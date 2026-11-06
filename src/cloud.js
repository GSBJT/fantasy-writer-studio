// Optional OneDrive manual backup transfer via Microsoft Graph.
// Requires user-owned Entra app registration, SPA redirect URI on deployed origin,
// personal Microsoft accounts enabled, and Files.ReadWrite.AppFolder delegated scope.
let msalApp=null;
const scopes=['Files.ReadWrite.AppFolder'];
export async function connectMicrosoft(clientId){
 if(!/^[0-9a-f-]{36}$/i.test(clientId))throw new Error('Enter an application (client) ID UUID');
 const {PublicClientApplication}=await import('@azure/msal-browser');
 msalApp=new PublicClientApplication({auth:{clientId,authority:'https://login.microsoftonline.com/consumers',redirectUri:location.origin},cache:{cacheLocation:'sessionStorage'}});
 await msalApp.initialize();
 const result=await msalApp.loginPopup({scopes,prompt:'select_account'});
 return result.account?.username||'Connected';
}
async function token(){if(!msalApp)throw Error('Connect first');const accounts=msalApp.getAllAccounts();if(!accounts.length)throw Error('Sign in first');try{return (await msalApp.acquireTokenSilent({scopes,account:accounts[0]})).accessToken}catch{return (await msalApp.acquireTokenPopup({scopes,account:accounts[0]})).accessToken}}
async function graph(path,options={}){const t=await token();const response=await fetch('https://graph.microsoft.com/v1.0'+path,{...options,headers:{Authorization:'Bearer '+t,...options.headers}});if(!response.ok)throw Error(`OneDrive error ${response.status}: ${(await response.text()).slice(0,400)}`);return response}
export async function uploadOneDrive(data){
 const bytes=new TextEncoder().encode(JSON.stringify(data));const filename='fantasy-writer-studio-backup.json';
 if(bytes.length<=4*1024*1024){await graph('/me/drive/special/approot:/'+filename+':/content',{method:'PUT',headers:{'Content-Type':'application/json'},body:bytes});return bytes.length}
 const session=await (await graph('/me/drive/special/approot:/'+filename+':/createUploadSession',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({item:{'@microsoft.graph.conflictBehavior':'replace'}})})).json();
 const step=320*1024*10;
 for(let start=0;start<bytes.length;start+=step){const end=Math.min(start+step,bytes.length);const res=await fetch(session.uploadUrl,{method:'PUT',headers:{'Content-Length':String(end-start),'Content-Range':`bytes ${start}-${end-1}/${bytes.length}`},body:bytes.slice(start,end)});if(!res.ok)throw Error(`Upload chunk failed ${res.status}`)}
 return bytes.length;
}
export async function downloadOneDrive(){const response=await graph('/me/drive/special/approot:/fantasy-writer-studio-backup.json:/content');return JSON.parse(await response.text())}
export async function disconnectMicrosoft(){if(msalApp){await msalApp.logoutPopup({account:msalApp.getAllAccounts()[0],postLogoutRedirectUri:location.origin});msalApp=null}}

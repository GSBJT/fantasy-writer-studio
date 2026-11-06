# Fantasy Writer Studio v0.1 — 초보자 설치 가이드

## 1. 준비물
- Windows PC (최초 업로드는 PC가 편합니다)
- Node.js LTS: https://nodejs.org/  (설치 시 PATH 옵션 기본값 유지)
- GitHub 계정: https://github.com/signup
- Vercel 계정: https://vercel.com/signup (GitHub로 로그인 추천)
- 갤럭시 + Chrome

## 2. PC에서 실행 확인
1. 이 ZIP 파일을 `C:\FantasyWriterStudio` 같은 폴더에 압축 해제합니다. ZIP 자체가 아닌, **package.json**이 있는 폴더에서 작업해야 합니다.
2. 폴더 주소 표시줄에 `cmd`를 입력하고 Enter를 누릅니다.
3. 아래 명령을 하나씩 붙여넣습니다.
```bat
node -v
npm -v
npm install
npm run dev
```
4. 출력되는 `http://localhost:5173/` 주소를 PC 브라우저에서 엽니다(포트 숫자는 달라질 수 있음).
5. 불가리아어 `Писане`에서 챕터를 쓰고 `Герои`에서 캐릭터와 이미지를 추가합니다. 페이지 새로고침 후 저장 여부를 확인합니다.

## 3. GitHub에 올리기 (명령어 없이)
1. https://github.com/new 에서 Repository name: `fantasy-writer-studio` 입력.
2. 아내분의 미공개 작품을 보호하기 위해 **Private** 선택. `Create repository` 클릭.
3. 생성된 저장소의 `uploading an existing file` 또는 `Add file` > `Upload files` 클릭.
4. 압축 해제한 폴더의 **내용물**(index.html, package.json, src 폴더, public 폴더, .gitignore 등)을 업로드. `node_modules`와 `dist`는 업로드하지 마세요. 폴더 드래그가 지원되는 PC 브라우저 사용을 권장합니다.
5. `Commit changes` 클릭. 업로드 후 저장소 맨 위에 `package.json`과 `index.html`이 보여야 합니다.

> ZIP 파일 하나를 저장소에 올리는 것은 안 됩니다. 압축을 풀고 **개별 파일과 폴더 구조**를 올려야 Vercel이 빌드합니다. GitHub 웹에서 파일 드래그 업로드가 불편하면 GitHub Desktop(https://desktop.github.com/)으로 폴더를 추가할 수도 있습니다.

## 4. Vercel에 배포
1. https://vercel.com/new 로 이동해 GitHub 연결.
2. 위의 `fantasy-writer-studio` 저장소를 선택하고 `Import`.
3. Framework Preset이 `Vite`인지 확인.
4. Build Command는 `npm run build`, Output Directory는 `dist`로 설정(자동 인식되면 그대로 둠).
5. `Deploy` 클릭. 빌드 성공 시 `https://...vercel.app` 주소가 생깁니다.
6. 갤럭시 Chrome에서 해당 주소를 열고 테스트합니다. Chrome 메뉴의 `홈 화면에 추가`로 앱처럼 바로가기를 만들 수 있습니다.
7. GitHub에 코드를 업데이트하면 Vercel이 자동 재배포합니다.

## 5. 테스트 체크리스트
- [ ] 불가리아어로 제목과 챕터 내용을 작성한다.
- [ ] 새로고침 후 원고가 남아 있다.
- [ ] 챕터 2개를 만들어 챕터 이동을 한다.
- [ ] 캐릭터를 만들고 사진을 2장 첨부, 대표 이미지를 바꾼다.
- [ ] 장소를 만들고 이미지, 메모를 기록한다.
- [ ] Word를 내보내 Microsoft Word에서 불가리아어가 표시되는지 확인한다.
- [ ] PDF를 다운로드해 키릴 문자가 깨지지 않는지 확인한다.
- [ ] `Архив`에서 JSON 백업을 저장한다.
- [ ] 갤럭시에서 JSON 파일을 복원해 사진과 챕터가 보이는지 확인한다.

## 꼭 알아둘 점
- **PC와 갤럭시의 저장 내용은 자동으로 동기화되지 않습니다.** JSON 백업 파일로 수동 복원해야 합니다.
- 데이터를 브라우저에 로컬 저장합니다. 사이트 데이터 삭제·시크릿 모드·저장 공간 부족에 주의하세요.
- 코드 파일만 GitHub에 올립니다. 원고나 개인 이미지를 GitHub 저장소에 넣을 필요 없습니다.
- 이 버전은 지도 제작·Word 원고 가져오기·맞춤법 검사·AI 기능을 포함하지 않습니다.
- PDF 생성은 이미지형 렌더 방식이므로 긴 원고는 Word로 내보낸 뒤 Word의 PDF 저장을 사용하는 방법이 더 안정적입니다.

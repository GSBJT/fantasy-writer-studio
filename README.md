# Fantasy Writer Studio v0.1

불가리아어 판타지 소설 집필용 웹앱. 초보자용 가이드: `START_HERE_KO.md`.

## 기능
- 불가리아어 / 영어 / 한국어 UI
- 소설 제목, 저자, 챕터 생성·수정·삭제, 자동 저장
- 등장인물 및 세계관 카드, 이미지 여러 장(장당 최대 5 MB), 대표 이미지, 메모
- Word(.docx) 및 PDF(.pdf) 원고 내보내기
- 전체 프로젝트(이미지 포함) JSON 백업 및 복원
- 모바일/데스크톱 반응형 화면, 기본 PWA manifest

## 시작
```bash
npm install
npm run dev
```
개발 서버 안내 주소로 접속합니다. PC에서 테스트 후 GitHub에 올려 Vercel 배포를 권장합니다.

## 빌드
```bash
npm run build
npm run preview
```

## 저장과 개인 정보
- 원고와 이미지 파일의 Base64 데이터는 **해당 기기/브라우저의 IndexedDB**에 저장됩니다. Vercel에 업로드되지 않습니다.
- 기기 간 자동 동기화는 없습니다. 브라우저의 사이트 데이터나 캐시를 삭제하면 원고를 잃을 수 있습니다.
- `Архив`에서 **JSON 백업을 정기적으로 다운로드**하고, 다른 기기에 `Възстанови архив`로 복원하세요. 원고가 중요할 경우 별도 외장 드라이브/클라우드에 백업 파일을 저장하세요.
- 무거운 이미지 여러 장은 모바일 브라우저 저장 한도를 소진할 수 있습니다.
- Word/PDF 내보내기는 *원고만* 포함합니다. 캐릭터 이미지와 설정은 JSON 백업에 포함됩니다.
- v0.1은 **단순 텍스트 기반 편집기**이며, 기존 Word의 서식이나 이미지를 가져오는 기능, 지도 제작, 사용자 계정, 자동 클라우드 동기화, 맞춤법 검사 및 AI 생성/번역은 아직 없습니다.
- PDF는 html2canvas 방식으로 브라우저에서 렌더링되므로 긴 원고의 경우 생성 시간이 걸리거나 메모리 한계가 나타날 수 있고, PDF 텍스트 선택 및 검색이 제한될 수 있습니다. DOCX를 Microsoft Word에서 PDF로 변환하는 것이 긴 원고에 더 적합할 수 있습니다.

## 기술
React + Vite + `idb`(IndexedDB) + `docx` + `html2pdf.js`.

## 배포
Vercel > Add New > Project > GitHub 저장소 Import > Framework `Vite` > Build `npm run build` > Output `dist` > Deploy.

## 개발 상태
v0.1 실험용. 실제 원고를 옮기기 전에 가짜 원고와 이미지로 저장·복원·PDF·Word를 먼저 테스트하세요.

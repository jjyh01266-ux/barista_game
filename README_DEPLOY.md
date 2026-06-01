# Firebase Hosting 배포 방법

이 폴더는 Firebase Hosting에 바로 올릴 수 있게 설정되어 있습니다.

배포되는 파일은 `index.html`, `game.js`, `assets` 폴더입니다. 작업 중 만든 PDF 참고 이미지 폴더는 배포에서 제외됩니다.

## 처음 한 번만 하기

1. Firebase 콘솔에서 새 프로젝트를 만듭니다.
2. 컴퓨터에 Firebase CLI를 설치합니다.
3. 이 폴더에서 Firebase에 로그인합니다.

```powershell
firebase login
```

4. 만든 Firebase 프로젝트를 연결합니다.

```powershell
firebase use --add
```

## 배포하기

```powershell
firebase deploy --only hosting
```

배포가 끝나면 `https://프로젝트이름.web.app` 주소가 표시됩니다.

# images — 제품 이미지 저장 폴더

`data/*.json` 의 올리브영 이미지 주소(`image.oliveyoung.co.kr/...`)가 2026-11-10 기준 **전부 403(차단)** 이라 화면에 "이미지 없음"으로 표시됩니다.
제품 사진을 이 폴더에 저장하고 JSON 의 `imageUrl` 을 상대 경로로 바꾸면 됩니다.

## 사용법

1. 사진을 이 폴더에 저장 — 파일명은 SKU id 와 같게: `sku-vt-riddle-shot-100.jpg`
2. `data/sku-list.json`, `data/weekly-trends.json`, `data/weekly-uploads.json` 에서 해당 제품의 `imageUrl` 을 바꿈

```json
"imageUrl": "images/sku-vt-riddle-shot-100.jpg"
```

- 허용되는 주소: `https://...` 또는 `images/...` (이 폴더 안). `../` 같은 상위 경로는 막혀 있습니다.
- 권장 크기: 400×400px 이하 JPG/WEBP (저장소가 무거워지지 않게).
- 사진 저작권: 직접 찍은 사진이나 브랜드가 판매용으로 제공한 이미지를 쓰세요.

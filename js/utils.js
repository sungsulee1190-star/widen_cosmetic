// ============================================================
// WIDEN — utils.js · 모든 뷰가 공유하는 작은 헬퍼
// (data-store.js 보다 먼저 로드되어야 함)
// ============================================================

// HTML 특수문자 이스케이프 — 사용자가 입력한 값(방문 기록 등)이나
// 향후 외부 시트/크롤링에서 들어올 값을 innerHTML 에 넣을 때 사용
function esc(value) {
  if (value === undefined || value === null) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// http(s) 링크만 허용 — javascript: 같은 스킴 차단
function safeUrl(url) {
  if (typeof url !== 'string') return '';
  const trimmed = url.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : '';
}

// LocalStorage JSON 읽기/쓰기 — 값이 깨져 있어도 앱 전체가 죽지 않도록
function readStore(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    console.warn(`[WIDEN] localStorage "${key}" 읽기 실패, 기본값 사용`, e);
    return fallback;
  }
}

function writeStore(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`[WIDEN] localStorage "${key}" 저장 실패`, e);
  }
}

// 로컬(한국) 날짜 YYYY-MM-DD — toISOString()은 UTC라 오전 9시 전엔 어제 날짜가 나옴
function localDateISO(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// 오늘 요일 키 (mon..sun)
function todayDayKey(date = new Date()) {
  return ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][date.getDay()];
}

// ★ 표시 — 0~5 범위로 고정 (6 이상/음수/소수면 String.repeat 가 RangeError)
function stars(score, max = 5) {
  const n = Math.max(0, Math.min(max, Math.round(Number(score) || 0)));
  return '★'.repeat(n) + '☆'.repeat(max - n);
}

// "5~10%" → 7.5, "10%" → 10, 숫자 없으면 0
function parseMarginRange(text) {
  const nums = String(text || '').match(/\d+(\.\d+)?/g);
  if (!nums) return 0;
  const values = nums.map(Number);
  return values.reduce((a, b) => a + b, 0) / values.length;
}

// JSON 링크 키(oliveyoung, qoo10Search …)를 사람이 읽는 라벨로
const LINK_LABELS = {
  oliveyoung: '올리브영',
  product: '상품 페이지',
  qoo10: 'Qoo10',
  qoo10Search: 'Qoo10 검색',
  competitor: '경쟁 페이지',
  shopee: 'Shopee',
  drive: 'Drive',
  notion: 'Notion',
  naverDatalab: '네이버 데이터랩',
  googleTrends: 'Google 트렌드',
};

// { key: url } 또는 [{label,url}] 둘 다 받아서 [{label,url}] 로 통일
function normalizeLinks(links) {
  if (!links) return [];
  const list = Array.isArray(links)
    ? links.filter(l => l && l.url).map(l => ({ label: l.label || '링크', url: l.url }))
    : Object.entries(links)
        .filter(([, url]) => typeof url === 'string' && url.trim())
        .map(([key, url]) => ({ label: LINK_LABELS[key] || key, url }));
  return list.filter(l => safeUrl(l.url));
}

// 외부 링크 <a> — 새 탭 + rel=noopener (열린 탭이 대시보드를 조작하지 못하게)
function extLink(url, label, className = 'ext-link', prefix = '🔗 ') {
  const href = safeUrl(url);
  if (!href) return '';
  return `<a href="${esc(href)}" target="_blank" rel="noopener noreferrer" class="${className}">${prefix}${esc(label)}</a>`;
}

// 클립보드 복사 — navigator.clipboard 가 없거나 거부되면 textarea 방식으로 재시도
function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text).catch(() => legacyCopy(text));
  }
  return legacyCopy(text);
}

function legacyCopy(text) {
  return new Promise((resolve, reject) => {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand && document.execCommand('copy');
    document.body.removeChild(ta);
    ok ? resolve() : reject(new Error('copy failed'));
  });
}

// 복사 버튼에 "복사 완료" 피드백까지 묶어서 바인딩
function bindCopyButton(button, getText) {
  if (!button) return;
  button.addEventListener('click', () => {
    const originalText = button.textContent;
    copyText(getText()).then(() => {
      button.textContent = '✅ 복사 완료!';
      setTimeout(() => { button.textContent = originalText; }, 2000);
    }).catch(() => {
      alert('클립보드 복사에 실패했습니다. 브라우저 권한을 확인하세요.');
    });
  });
}

// 벤치마킹샵 / 경쟁페이지 분석 두 화면이 같이 쓰는 MD 리포트 템플릿 (원래 두 파일에 중복돼 있었음)
const MD_REPORT_TEMPLATE = `# [제품명] Qoo10 JP 경쟁 분석 MD 리포트

## 기본 정보
- 분석 날짜:
- 분석 대상 URL:
- 셀러명:

## 제목 분석
- 첫 키워드:
- 공식/정품 표현:
- 제목 전체:

## 이미지 분석
- 대표 이미지 구성:
- 강조 문구:

## 가격/쿠폰/세트
- 단품 가격:
- 세트 구성:
- 쿠폰:

## 리뷰 분석
- 리뷰 수:
- 반복 구매 이유:

## 액션 아이템
- 따라할 것:
- 변형할 것:
- 버릴 것:`;

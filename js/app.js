// ============================================================
// WIDEN — app.js · App Init + Router + Sidebar + Badges
// ============================================================

// Router map
const VIEW_RENDERERS = {
  'view-cockpit': () => typeof renderCockpitView === 'function' && renderCockpitView(),
  'view-sku': () => typeof renderSkuView === 'function' && renderSkuView(),
  'view-copycat': () => typeof renderCopycatView === 'function' && renderCopycatView(),
  'view-wiki': () => typeof renderWikiView === 'function' && renderWikiView(),
  'view-country': () => typeof renderCountryView === 'function' && renderCountryView(),
  'view-sourcing': () => typeof renderSourcingView === 'function' && renderSourcingView(),
  'view-reference': () => typeof renderReferenceView === 'function' && renderReferenceView(),
  'view-links': () => typeof renderLinksView === 'function' && renderLinksView(),
};

const DEFAULT_VIEW = 'view-cockpit';

function navigate(viewId) {
  // 저장된 뷰 ID가 메뉴 개편 등으로 사라졌으면 빈 화면 대신 기본 화면으로
  if (!VIEW_RENDERERS[viewId]) viewId = DEFAULT_VIEW;

  document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => {
    n.classList.remove('active');
    n.removeAttribute('aria-current');
  });
  const target = document.getElementById(viewId);
  if (target) target.classList.add('active');
  const navItem = document.querySelector(`.nav-item[data-view="${viewId}"]`);
  if (navItem) {
    navItem.classList.add('active');
    navItem.setAttribute('aria-current', 'page');
  }
  try {
    VIEW_RENDERERS[viewId]();
  } catch (err) {
    // 한 화면의 렌더 오류가 앱 전체를 멈추지 않도록, 원인을 화면에 표시
    console.error(`[WIDEN] ${viewId} 렌더 실패`, err);
    if (target) {
      target.innerHTML = `<div class="card load-error">⚠️ 이 화면을 그리는 중 오류가 발생했습니다: ${esc(err.message)}<br>개발자 도구 콘솔(F12)에서 자세한 내용을 확인하세요.</div>`;
    }
  }
  try { localStorage.setItem('widen-last-view', viewId); } catch (e) { /* 저장 불가 환경 무시 */ }
  window.scrollTo(0, 0);
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  sidebar.classList.toggle('collapsed');
  const collapsed = sidebar.classList.contains('collapsed');
  document.getElementById('sidebar-toggle').setAttribute('aria-expanded', String(!collapsed));
  try { localStorage.setItem('widen-sidebar-collapsed', collapsed); } catch (e) { /* ignore */ }
}

function updateBadges() {
  const el1 = document.getElementById('badge-actions');
  if (el1) el1.textContent = DataStore.countOpenActions() || '';
  const el2 = document.getElementById('badge-sku');
  if (el2) el2.textContent = DataStore.skus.length || '';
  const el3 = document.getElementById('badge-copycat');
  if (el3) el3.textContent = DataStore.copycatShops.length || '';
}

// 데이터 로딩 실패 안내 — 특히 index.html 을 더블클릭(file://)으로 열면
// 브라우저가 JSON fetch 를 막아서 모든 화면이 "데이터 없음"으로 보였음
function showLoadErrors() {
  if (!DataStore.loadErrors.length) return;
  const isFile = location.protocol === 'file:';
  const banner = document.createElement('div');
  banner.className = 'card load-error';
  banner.innerHTML = `
    <strong>⚠️ 데이터 파일 ${DataStore.loadErrors.length}개를 불러오지 못했습니다.</strong>
    ${isFile
      ? `<p>index.html 을 파일로 직접 열면 브라우저 보안 정책 때문에 data/*.json 을 읽을 수 없습니다.
         터미널에서 이 폴더로 이동한 뒤 <code>python3 -m http.server 8000</code> 을 실행하고
         <code>http://localhost:8000</code> 으로 접속하세요.</p>`
      : `<p>${DataStore.loadErrors.map(e => `${esc(e.file)} (${esc(e.message)})`).join('<br>')}</p>`}
  `;
  const main = document.getElementById('main-content');
  main.insertBefore(banner, main.firstChild);
}

// 이미지가 안 뜨면(올리브영 CDN 차단·주소 변경 등) 깨진 아이콘 대신 회색 자리로 바꿈
// 이미지는 화면마다 innerHTML 로 새로 그려지므로 document 한 곳에서 capture 로 처리
document.addEventListener('error', (e) => {
  const img = e.target;
  if (!(img instanceof HTMLImageElement) || img.dataset.broken) return;
  img.dataset.broken = '1';
  // 같은 클래스(크기·모양)를 유지한 자리표시자로 교체 → 레이아웃이 깨지지 않고 이유가 보임
  // (2026-11-10 확인: data/*.json 의 올리브영 이미지 주소가 전부 403 으로 막혀 있음)
  const ph = document.createElement('div');
  ph.className = `${img.className} img-broken`;
  ph.setAttribute('style', img.getAttribute('style') || '');
  ph.textContent = '이미지 없음';
  ph.title = `이미지를 불러오지 못했습니다: ${img.alt || ''}`;
  img.replaceWith(ph);
}, true);

async function initApp() {
  await DataStore.load();
  showLoadErrors();

  // Sidebar toggle
  const toggle = document.getElementById('sidebar-toggle');
  toggle.addEventListener('click', toggleSidebar);
  let collapsed = false;
  try { collapsed = localStorage.getItem('widen-sidebar-collapsed') === 'true'; } catch (e) { /* ignore */ }
  if (collapsed) document.getElementById('sidebar').classList.add('collapsed');
  toggle.setAttribute('aria-expanded', String(!collapsed));

  // Nav clicks + 키보드(Enter/Space) 지원
  document.querySelectorAll('.nav-item').forEach(item => {
    item.setAttribute('role', 'link');
    item.setAttribute('tabindex', '0');
    item.addEventListener('click', () => navigate(item.dataset.view));
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        navigate(item.dataset.view);
      }
    });
  });

  // Badges
  updateBadges();

  // Restore last view
  let lastView = DEFAULT_VIEW;
  try { lastView = localStorage.getItem('widen-last-view') || DEFAULT_VIEW; } catch (e) { /* ignore */ }
  navigate(lastView);
}

document.addEventListener('DOMContentLoaded', initApp);

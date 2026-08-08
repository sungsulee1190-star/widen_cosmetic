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

function navigate(viewId) {
  document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const target = document.getElementById(viewId);
  if (target) target.classList.add('active');
  const navItem = document.querySelector(`.nav-item[data-view="${viewId}"]`);
  if (navItem) navItem.classList.add('active');
  // Call view renderer
  if (VIEW_RENDERERS[viewId]) VIEW_RENDERERS[viewId]();
  localStorage.setItem('widen-last-view', viewId);
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  sidebar.classList.toggle('collapsed');
  localStorage.setItem('widen-sidebar-collapsed', sidebar.classList.contains('collapsed'));
}

function updateBadges() {
  const incompleteActions = DataStore.actions.filter(a => DataStore.getActionState(a.id) === '미완료').length;
  const el1 = document.getElementById('badge-actions');
  if (el1) el1.textContent = incompleteActions || '';
  const el2 = document.getElementById('badge-sku');
  if (el2) el2.textContent = DataStore.skus.length || '';
  const el3 = document.getElementById('badge-copycat');
  if (el3) el3.textContent = DataStore.copycatShops.length || '';
}

function updateSyncBar() {
  const state = document.getElementById('sync-state');
  const detail = document.getElementById('sync-detail');
  const form = document.getElementById('auth-form');
  const logout = document.getElementById('auth-logout');
  if (!state || !detail || !form || !logout) return;

  const storageStatus = window.AppStorage?.status || 'LOCAL_FALLBACK';
  const authStatus = window.WidenAuth?.getStatus?.() || 'CONFIG_REQUIRED';
  const user = window.WidenAuth?.getSession?.()?.user;
  const labels = {
    SYNCED: ['공용 저장소 연결됨', '다른 브라우저와 동기화됩니다.'],
    LOCAL_FALLBACK: ['로컬 저장 모드', '브라우저에만 저장됩니다.'],
    AUTH_REQUIRED: ['로그인 필요', '동기화를 시작하려면 이메일 로그인이 필요합니다.'],
    REMOTE_ERROR: ['공용 저장소 오류', '현재 로컬 저장으로 동작합니다.'],
  };
  const [stateLabel, detailLabel] = labels[storageStatus] || labels.LOCAL_FALLBACK;

  state.textContent = stateLabel;
  detail.textContent = DataStore.loadErrors?.length
    ? `데이터 ${DataStore.loadErrors.length}개를 불러오지 못했습니다.`
    : user?.email || detailLabel;
  form.classList.toggle('hidden', authStatus !== 'AUTH_REQUIRED');
  logout.classList.toggle('hidden', !user);
}

function bindAuthEvents() {
  const form = document.getElementById('auth-form');
  const logout = document.getElementById('auth-logout');
  if (!form || !logout || !window.WidenAuth) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = document.getElementById('auth-email')?.value || '';
    const detail = document.getElementById('sync-detail');
    try {
      const { error } = await window.WidenAuth.signInWithOtp(email);
      if (error) throw error;
      if (detail) detail.textContent = '로그인 링크를 이메일에서 확인해 주세요.';
      form.reset();
    } catch (error) {
      if (detail) detail.textContent = `로그인 요청 실패: ${error.message}`;
    }
  });

  logout.addEventListener('click', async () => {
    await window.WidenAuth.signOut();
    await window.AppStorage?.load();
    updateSyncBar();
    updateBadges();
    navigate(document.querySelector('.view-section.active')?.id || 'view-cockpit');
  });

  window.WidenAuth.onAuthStateChange(async () => {
    await window.AppStorage?.load();
    updateSyncBar();
    updateBadges();
    navigate(document.querySelector('.view-section.active')?.id || 'view-cockpit');
  });
}

async function initApp() {
  bindAuthEvents();
  await DataStore.load();
  // Sidebar toggle
  document.getElementById('sidebar-toggle').addEventListener('click', toggleSidebar);
  if (localStorage.getItem('widen-sidebar-collapsed') === 'true') {
    document.getElementById('sidebar').classList.add('collapsed');
  }
  // Nav clicks
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => navigate(item.dataset.view));
  });
  // Badges
  updateBadges();
  updateSyncBar();
  // Restore last view
  const lastView = localStorage.getItem('widen-last-view') || 'view-cockpit';
  navigate(lastView);
}

document.addEventListener('DOMContentLoaded', initApp);

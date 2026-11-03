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
  // 팀 공유 모드: 다른 사람이 남긴 기록을 받아와 바뀐 게 있으면 다시 그린다
  const log = DataStore.workLog;
  if (log && log.shared) {
    const before = log.entries().length;
    log.load().then(() => {
      if (log.entries().length !== before && VIEW_RENDERERS[viewId]) {
        VIEW_RENDERERS[viewId]();
        updateBadges();
      }
    }).catch(() => {});
  }
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

// 사이드바 하단: 작업 기록이 어디에 저장되는지
function updateWorkspaceStatus() {
  const el = document.getElementById('workspace-status');
  if (!el) return;
  const { backend, error } = DataStore.workLogStatus;
  el.textContent = error ? '⚠️ 공유 저장소 연결 실패' : backend === 'supabase' ? '👥 팀 공유 저장' : '💻 이 브라우저에 저장';
  el.title = error || '';
}

async function initApp() {
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
  updateWorkspaceStatus();
  // Restore last view
  const lastView = localStorage.getItem('widen-last-view') || 'view-cockpit';
  navigate(lastView);
}

document.addEventListener('DOMContentLoaded', initApp);

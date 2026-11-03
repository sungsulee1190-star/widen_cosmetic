// ============================================================
// WIDEN — view-workspace.js · 작업 기록 저장소 설정 (데이터 관리 화면 상단 카드)
// ============================================================

const WORK_KIND_LABELS = {
  'action-state': '할 일 상태',
  'upload-check': '업로드 체크',
  'favorite': '즐겨찾기',
  'visit': '방문 기록'
};

function describeWorkEntry(entry) {
  const d = entry.data || {};
  if (entry.kind === 'action-state') return `${entry.key} → ${d.state}`;
  if (entry.kind === 'upload-check') return `${entry.key} ${d.checked ? '체크' : '해제'}`;
  if (entry.kind === 'favorite') return `${entry.key} ${d.on ? '추가' : '해제'}`;
  if (entry.kind === 'visit') return [d.store, d.sku, d.stock].filter(Boolean).join(' · ');
  return '';
}

function renderWorkspaceCard() {
  const esc = SkuCatalog.escapeHtml;
  const settings = DataStore.workspaceSettings();
  const status = DataStore.workLogStatus;
  const log = DataStore.workLog;
  const recent = log.entries().slice(-8).reverse();

  return `
    <div class="card workspace-card mb-24" id="workspace-card">
      <div class="flex-between mb-16">
        <div>
          <div class="card-title" style="margin-bottom:4px;">🗄️ 작업 기록 저장소</div>
          <div class="card-meta">할 일 상태 · 업로드 체크 · 즐겨찾기 · 방문 기록이 저장되는 곳</div>
        </div>
        <span class="workspace-badge ${status.backend === 'supabase' ? 'is-shared' : ''}">
          ${status.backend === 'supabase' ? '👥 팀 공유 (Supabase)' : '💻 이 브라우저에만'}
        </span>
      </div>
      ${status.error ? `<p class="workspace-error">${esc(status.error)}</p>` : ''}

      <form id="workspace-form" class="workspace-form">
        <label>저장 위치
          <select id="ws-backend">
            <option value="local" ${settings.backend === 'local' ? 'selected' : ''}>이 브라우저 (localStorage)</option>
            <option value="supabase" ${settings.backend === 'supabase' ? 'selected' : ''}>팀 공유 (Supabase)</option>
          </select>
        </label>
        <label>작성자 이름
          <input type="text" id="ws-author" value="${esc(settings.author)}" placeholder="예: 대표, 성수팀">
        </label>
        <label class="full">Supabase URL
          <input type="url" id="ws-url" value="${esc(settings.supabase.url || '')}" placeholder="https://xxxx.supabase.co">
        </label>
        <label class="full">Supabase publishable key
          <input type="text" id="ws-key" value="${esc(settings.supabase.key || '')}" placeholder="sb_publishable_... (공개용 키만 — service_role 키 금지)">
        </label>
        <div class="full workspace-actions">
          <button type="submit" class="btn btn-primary">저장하고 다시 연결</button>
          <button type="button" class="btn btn-outline" id="ws-copy-local" ${status.backend === 'supabase' ? '' : 'disabled'}>이 브라우저 기록을 공유 저장소로 복사</button>
          <span class="workspace-message" id="ws-message"></span>
        </div>
      </form>

      <div class="workspace-recent">
        <div class="card-meta" style="margin-bottom:6px;">최근 기록 ${log.entries().length}건</div>
        ${recent.length ? recent.map(e => `
          <div class="workspace-entry">
            <span>${String(e.at).startsWith('1970') ? '이전 기록' : esc(String(e.at).slice(0, 16).replace('T', ' '))}</span>
            <b>${esc(WORK_KIND_LABELS[e.kind] || e.kind)}</b>
            <em>${esc(describeWorkEntry(e))}</em>
            <span>${esc(e.by || '')}</span>
          </div>`).join('') : '<p class="card-meta">아직 기록이 없습니다.</p>'}
      </div>
    </div>
  `;
}

function bindWorkspaceCard(container) {
  const form = container.querySelector('#workspace-form');
  if (!form) return;
  const message = container.querySelector('#ws-message');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    DataStore.saveWorkspaceSettings({
      backend: form.querySelector('#ws-backend').value,
      author: form.querySelector('#ws-author').value.trim(),
      supabase: {
        url: form.querySelector('#ws-url').value.trim(),
        key: form.querySelector('#ws-key').value.trim()
      }
    });
    message.textContent = '연결 중…';
    await DataStore.openWorkLog();
    refreshAfterWorkLogChange();
  });

  const copyBtn = container.querySelector('#ws-copy-local');
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      copyBtn.disabled = true;
      message.textContent = '복사 중…';
      const local = await WorkLog.localAdapter(localStorage).load();
      const existing = new Set(DataStore.workLog.entries().map(entry => entry.id));
      const settings = DataStore.workspaceSettings();
      const remote = WorkLog.supabaseAdapter(settings.supabase);
      let copied = 0;
      try {
        for (const entry of local) {
          if (existing.has(entry.id)) continue;
          await remote.append(entry);
          copied++;
        }
        await DataStore.openWorkLog();
        refreshAfterWorkLogChange(`${copied}건 복사했습니다.`);
      } catch (error) {
        message.textContent = `복사 실패: ${error.message} (${copied}건까지 복사됨)`;
        copyBtn.disabled = false;
      }
    });
  }
}

// 저장소가 바뀌면 배지·사이드바 상태·현재 화면을 다시 그린다.
function refreshAfterWorkLogChange(note) {
  if (typeof updateBadges === 'function') updateBadges();
  if (typeof updateWorkspaceStatus === 'function') updateWorkspaceStatus();
  renderLinksView();
  const message = document.querySelector('#ws-message');
  if (message && note) message.textContent = note;
}

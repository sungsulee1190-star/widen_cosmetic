// ============================================================
// WIDEN — view-country.js · 국가별 규제 (Page 5)
// ============================================================

function renderCountryView() {
  const container = document.getElementById('view-country');
  if (!container) return;

  const countries = DataStore.countries || [];

  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">🌏 국가별 주의사항 & 규제</h1>
      <p class="page-subtitle">수출 대상 국가별 약기법, 금지 성분, 마케팅 조심할 표현 및 통관 유의사항을 확인합니다.</p>
    </div>

    <div class="grid-2" style="align-items: start;">
      ${countries.map(c => renderCountryCard(c)).join('')}
    </div>
  `;

  bindCountryEvents(container);
}

function renderCountryCard(country) {
  return `
    <div class="card" style="padding: 24px; display: flex; flex-direction: column; gap: 16px;">
      <div style="display:flex; align-items:center; gap:12px; border-bottom:1px solid var(--border-default); padding-bottom:16px;">
        <span style="font-size:32px;">${country.flag || '🌏'}</span>
        <h2 style="font-size:20px; font-weight:800; color:var(--text-main);">${country.name || '국가명'}</h2>
      </div>

      <div style="display:flex; flex-direction:column; gap:12px;">
        ${(country.sections || []).map((sec, idx) => {
          const isChecklist = sec.title === '판매 전 체크리스트';
          return `
            <div class="toggle-section" style="border: 1px solid var(--border-default); border-radius: 8px; overflow: hidden;">
              <div class="toggle-header" data-target="${country.id}-sec-${idx}" style="display:flex; justify-content:space-between; align-items:center; padding:12px 16px; background:var(--bg-subtle); cursor:pointer; font-weight:700; font-size:14px; color:var(--text-secondary);">
                <span>${sec.title}</span>
                <span class="toggle-arrow" style="transition: transform 0.2s;">▶</span>
              </div>
              <div class="toggle-content" id="${country.id}-sec-${idx}" style="display:none; padding:16px; background:var(--surface-card); border-top:1px solid var(--border-default);">
                ${isChecklist ? renderCountryChecklist(sec.items) : renderCountryItems(sec.items)}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function renderCountryItems(items) {
  return `<ul style="padding-left:20px; margin:0; display:flex; flex-direction:column; gap:8px; line-height:1.5; font-size:13px; color:var(--text-secondary);">
    ${(items || []).map(item => `<li>${item}</li>`).join('')}
  </ul>`;
}

function renderCountryChecklist(items) {
  return `<div style="display:flex; flex-direction:column; gap:10px;">
    ${(items || []).map((item, idx) => `
      <label class="checklist-item" style="display:flex; align-items:flex-start; gap:8px; font-size:13px; color:var(--text-secondary); cursor:pointer;">
        <input type="checkbox" style="margin-top:3px; cursor:pointer;">
        <span>${item}</span>
      </label>
    `).join('')}
  </div>`;
}

function bindCountryEvents(container) {
  container.querySelectorAll('.toggle-header').forEach(header => {
    header.addEventListener('click', () => {
      const targetId = header.dataset.target;
      const content = container.querySelector(`#${targetId}`);
      const arrow = header.querySelector('.toggle-arrow');
      
      if (content) {
        const isHidden = content.style.display === 'none';
        content.style.display = isHidden ? 'block' : 'none';
        header.classList.toggle('open', isHidden);
        if (arrow) {
          arrow.style.transform = isHidden ? 'rotate(90deg)' : 'rotate(0deg)';
        }
      }
    });
  });
}

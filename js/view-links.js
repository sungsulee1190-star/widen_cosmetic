// ============================================================
// WIDEN — view-links.js · 데이터 관리 (Page 8)
// ============================================================

function renderLinksView() {
  const container = document.getElementById('view-links');
  if (!container) return;

  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">🔗 Notion / Drive 데이터 관리</h1>
      <p class="page-subtitle">WIDEN의 핵심 자산인 노션 데이터베이스와 구글 드라이브 폴더의 링크 모음 및 파일명 규칙 가이드라인입니다.</p>
    </div>

    <div class="grid-2" style="margin-bottom: 24px;">
      <!-- Notion Card -->
      <div class="card" style="padding: 24px; display:flex; flex-direction:column; gap:16px;">
        <div style="display:flex; align-items:center; gap:12px;">
          <span style="font-size:32px;">📓</span>
          <div>
            <h2 style="font-size:18px; font-weight:800; color:var(--text-main);">WIDEN Notion Workspace</h2>
            <p style="font-size:12px; color:var(--text-muted);">전 주기 수출 프로세스 및 데이터베이스 통합 관리</p>
          </div>
        </div>
        <ul style="font-size:13px; color:var(--text-secondary); padding-left:20px; line-height:1.6; flex:1;">
          <li>📦 <strong>SKU DB</strong>: 등록 SKU 원가, 마진율 및 바코드 관리</li>
          <li>🧪 <strong>성분 위키</strong>: 성분명 한/영/일 대조 및 주의 표현 사전</li>
          <li>🌏 <strong>국가별 주의사항</strong>: 국가별 약기법 및 개인 통관 규제 사항</li>
          <li>🏪 <strong>매장 방문 로그</strong>: 명동/성수 등 현장조사 로그 및 사진 아카이브</li>
          <li>🔍 <strong>벤치마킹 DB</strong>: 타사 판매 패턴 및 마케팅 전략 모니터링</li>
        </ul>
        <a href="https://app.notion.com/p/37744d5ca46c817db9f0e04cbf8b7c2c" target="_blank" class="btn btn-primary" style="text-align:center; text-decoration:none; display:block; padding:10px; border-radius:8px;">Notion 바로가기</a>
      </div>

      <!-- Drive Card -->
      <div class="card" style="padding: 24px; display:flex; flex-direction:column; gap:16px;">
        <div style="display:flex; align-items:center; gap:12px;">
          <span style="font-size:32px;">📁</span>
          <div>
            <h2 style="font-size:18px; font-weight:800; color:var(--text-main);">WIDEN Google Drive</h2>
            <p style="font-size:12px; color:var(--text-muted);">클라우드 파일 보관소 및 아카이브</p>
          </div>
        </div>
        <ul style="font-size:13px; color:var(--text-secondary); padding-left:20px; line-height:1.6; flex:1;">
          <li>📂 <code>01_SKU</code>: 각 제품 누끼 이미지 및 국내 소싱 영수증</li>
          <li>📂 <code>02_Benchmarking</code>: 벤치마킹 샵 캡처본 및 상세페이지 기획서</li>
          <li>📂 <code>03_Ingredients</code>: 특허 성분 설명서 및 학술자료 PDF</li>
          <li>📂 <code>04_Regulations</code>: 일본 약기법 및 대만 PIF 법안 원문 문서</li>
          <li>📂 <code>05_Offline_Visits</code>: 오프라인 매장 방문 사진 원본</li>
          <li>📂 <code>06_References</code>: 인플루언서 마케팅 가이드 및 스크랩북</li>
          <li>📂 <code>07_Screenshots_Archive</code>: 주간 업로드 증빙 스크린샷</li>
        </ul>
        <a href="https://drive.google.com/drive/folders/10d_wFsMKYxc8lPJ9AhtU8PF-u15IHp9e" target="_blank" class="btn btn-outline" style="text-align:center; text-decoration:none; display:block; padding:10px; border-radius:8px; border:1px solid var(--border-default);">Google Drive 바로가기</a>
      </div>
    </div>

    <!-- Naming Rules Card -->
    <div class="card" style="padding: 24px;">
      <h3 style="font-size:16px; font-weight:800; margin-bottom:12px; color:var(--text-main);">🏷️ 파일명 및 데이터 작성 규칙 가이드라인</h3>
      <p style="font-size:13px; color:var(--text-secondary); margin-bottom:16px; line-height:1.5;">
        드라이브 및 노션에 업로드되는 파일들은 나중에 자동화 에이전트(AI)가 원활하게 탐색하고 식별할 수 있도록 아래 규칙을 반드시 준수해야 합니다.
      </p>
      <div style="background:var(--bg-subtle); padding:16px; border-radius:8px; display:flex; flex-direction:column; gap:12px; font-size:13px; line-height:1.5;">
        <div>
          <strong>1. SKU 이미지 파일명 규칙</strong><br>
          <code style="background:white; padding:2px 6px; border-radius:4px; border:1px solid var(--border-default);">sku_[skuId]_[일련번호].[확장자]</code><br>
          <span style="color:var(--text-muted); font-size:11px;">예시: sku-vt-riddle-shot-100_01.png, sku-torriden-dive-in-serum_main.jpg</span>
        </div>
        <div>
          <strong>2. 매장 방문 로그 사진 규칙</strong><br>
          <code style="background:white; padding:2px 6px; border-radius:4px; border:1px solid var(--border-default);">visit_[YYYYMMDD]_[장소]_[목적].[확장자]</code><br>
          <span style="color:var(--text-muted); font-size:11px;">예시: visit_20260703_myeongdong_daiso.jpg</span>
        </div>
        <div>
          <strong>3. MD 리포트 캡처 파일 규칙</strong><br>
          <code style="background:white; padding:2px 6px; border-radius:4px; border:1px solid var(--border-default);">report_[skuId]_[채널]_[날짜].[확장자]</code><br>
          <span style="color:var(--text-muted); font-size:11px;">예시: report_vt-riddle-shot-100_qoo10_20260704.png</span>
        </div>
      </div>
    </div>
  `;
}

#!/usr/bin/env node
// ============================================================
// WIDEN — 주간 롤오버 (매주 1회, 리서치 전에 실행)
//
//   node scripts/weekly-rollover.mjs              # 이번 주(ISO)로 넘김
//   node scripts/weekly-rollover.mjs --week 2026-W47
//   node scripts/weekly-rollover.mjs --dry-run    # 바꿀 내용만 출력
//
// 하는 일 (기계적인 부분만 — 판단/리서치는 하지 않음)
//   1. 지난주 weekly-trends / weekly-uploads / actions 를 data/history/<지난주>/ 에 보관
//   2. 지난주 트렌드·업로드에 나온 SKU 의 weeklyHistory 에 한 줄씩 추가
//      → 카테고리/제품 화면의 '주차' 필터가 실제 기록으로 동작하게 됨
//   3. weekly-uploads 의 status 를 'upcoming' 으로 초기화 (오늘 표시는 화면이 실제 요일로 계산)
//   4. data/meta.json 의 week 를 이번 주로, researchPending: true 로 표시
//      → 리서치(트렌드·시즌·할 일 갱신)가 끝나면 researchPending 을 false 로 바꾸고 sources 를 채움
//
// 절차 전체: docs/WEEKLY_UPDATE.md
// ============================================================
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import vm from 'node:vm';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const weekArg = args.includes('--week') ? args[args.indexOf('--week') + 1] : null;

// 주차 계산은 화면과 같은 코드(js/utils.js)를 그대로 사용
const ctx = {};
vm.createContext(ctx);
vm.runInContext(readFileSync('js/utils.js', 'utf8') + '\n;Object.assign(globalThis,{isoWeek,weekDiff,localDateISO});', ctx);

const read = (p) => JSON.parse(readFileSync(p, 'utf8'));
const write = (p, data) => {
  if (dryRun) return;
  writeFileSync(p, JSON.stringify(data, null, 2) + '\n');
};

const meta = read('data/meta.json');
const targetWeek = weekArg || ctx.isoWeek(new Date());
if (!/^\d{4}-W\d{2}$/.test(targetWeek)) {
  console.error(`주차 형식이 잘못됐습니다: ${targetWeek} (예: 2026-W46)`);
  process.exit(1);
}
const prevWeek = meta.week;
if (prevWeek === targetWeek) {
  console.log(`이미 ${targetWeek} 입니다. 롤오버할 것이 없습니다.`);
  process.exit(0);
}
if (ctx.weekDiff(prevWeek, targetWeek) < 0) {
  console.error(`데이터(${prevWeek})가 대상 주(${targetWeek})보다 미래입니다. --week 를 확인하세요.`);
  process.exit(1);
}

// 월요일 날짜 (ISO 주의 시작)
function mondayOf(week) {
  const [y, w] = week.split('-W').map(Number);
  const jan4 = new Date(Date.UTC(y, 0, 4));
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - ((jan4.getUTCDay() || 7) - 1) + (w - 1) * 7);
  return monday.toISOString().slice(0, 10);
}

const trends = read('data/weekly-trends.json');
const uploads = read('data/weekly-uploads.json');
const actions = read('data/actions.json');
const skus = read('data/sku-list.json');

// 1. 지난주 스냅샷 보관
const historyDir = `data/history/${prevWeek}`;
if (!dryRun) {
  mkdirSync(historyDir, { recursive: true });
  for (const f of ['weekly-trends.json', 'weekly-uploads.json', 'actions.json']) {
    const target = `${historyDir}/${f}`;
    if (!existsSync(target)) writeFileSync(target, readFileSync(`data/${f}`));
  }
}

// 2. SKU 주차 이력 추가
const byId = new Map(skus.map(s => [s.id, s]));
const byName = new Map(skus.map(s => [s.name, s]));
const added = [];
function addHistory(sku, entry) {
  if (!sku) return;
  sku.weeklyHistory = sku.weeklyHistory || [];
  const dup = sku.weeklyHistory.some(h => h.week === entry.week && h.signal === entry.signal);
  if (dup) return;
  sku.weeklyHistory.push(entry);
  sku.weeklyHistory.sort((a, b) => a.week.localeCompare(b.week));
  added.push(`${sku.name} ← ${entry.week} ${entry.signal}`);
}

trends.forEach(t => {
  addHistory(byId.get(t.skuId) || byName.get(t.name), {
    week: prevWeek,
    signal: '트렌드',
    summary: (t.whyTrending || [])[0] || '이번 주 트렌드 선정',
  });
});
const dayKo = { mon: '월', tue: '화', wed: '수', thu: '목', fri: '금', sat: '토', sun: '일' };
uploads.forEach(u => {
  addHistory(byId.get(u.skuId) || byName.get(u.name), {
    week: prevWeek,
    signal: '업로드',
    summary: `${dayKo[u.day] || u.day}요일 업로드 ${u.status === 'completed' ? '완료' : '계획'}${u.reason ? ` — ${u.reason}` : ''}`,
  });
});

// 3. 업로드 상태 초기화
uploads.forEach(u => { u.status = 'upcoming'; });

// 4. meta 갱신
const newMeta = {
  ...meta,
  week: targetWeek,
  weekStart: mondayOf(targetWeek),
  updatedAt: ctx.localDateISO(new Date()),
  updatedBy: 'scripts/weekly-rollover.mjs',
  researchPending: true,
  previousWeek: prevWeek,
  sources: [],
};

write('data/sku-list.json', skus);
write('data/weekly-uploads.json', uploads);
write('data/meta.json', newMeta);

console.log(`${dryRun ? '[dry-run] ' : ''}롤오버: ${prevWeek} → ${targetWeek} (월요일 ${newMeta.weekStart})`);
console.log(`- 보관: ${historyDir}/ (weekly-trends, weekly-uploads, actions)`);
console.log(`- SKU 주차 이력 추가 ${added.length}건`);
added.forEach(a => console.log(`    ${a}`));
const unmatched = trends.filter(t => !(byId.get(t.skuId) || byName.get(t.name))).map(t => t.name);
if (unmatched.length) console.log(`- ⚠️ sku-list 에 없는 트렌드 제품 (이력 미기록): ${unmatched.join(', ')}`);
console.log(`
다음 단계 (리서치 — docs/WEEKLY_UPDATE.md):
  [ ] data/weekly-trends.json   이번 주 트렌드 SKU 3개 (출처 sources 필수)
  [ ] data/sku-list.json        새 트렌드 제품 추가 (weeklyHistory 에 ${targetWeek} 기록)
  [ ] data/weekly-uploads.json  이번 주 요일별 업로드 계획
  [ ] data/actions.json         이번 주 할 일 (새 id 사용: act-${targetWeek.toLowerCase().replace('-', '')}-01 …)
  [ ] data/season-calendar.json 월이 바뀌었으면 갱신
  [ ] data/meta.json            researchPending: false, sources 채우기
  [ ] npm test`);

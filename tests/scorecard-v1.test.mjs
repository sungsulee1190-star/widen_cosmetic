import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8');

// 1. Verify docs exist in primary project repository
assert.ok(existsSync('docs/설계비판-및-개선방향.md'), '설계비판-및-개선방향.md exists');
assert.ok(existsSync('docs/상품평가기준표.md'), '상품평가기준표.md exists');
assert.ok(existsSync('docs/주간갱신-교차검증-운영계획.md'), '주간갱신-교차검증-운영계획.md exists');
assert.ok(existsSync('data/scorecard-v1.json'), 'data/scorecard-v1.json exists');

// 2. Verify scorecard-v1.json schema & criteria
const scorecard = JSON.parse(read('data/scorecard-v1.json'));
assert.equal(scorecard.version, 'scorecard-v1');
assert.equal(scorecard.criteria.length, 9, 'Must have 9 criteria');

const totalWeight = scorecard.criteria.reduce((sum, c) => sum + c.weight, 0);
assert.equal(totalWeight, 100, 'Sum of weights must equal 100');

// 3. Verify view-cockpit.js contains Decision Board
const cockpit = read('js/view-cockpit.js');
assert.match(cockpit, /renderDecisionBoardSection/, 'cockpit renders decision board');
assert.match(cockpit, /bindDecisionBoardEvents/, 'cockpit binds decision board events');
assert.match(cockpit, /scorecard-v1/, 'cockpit displays scorecard-v1 criteria');

// 4. Verify DataStore candidate methods
const dataStore = read('js/data-store.js');
assert.match(dataStore, /getCandidates/, 'DataStore supports getCandidates');
assert.match(dataStore, /calculateCandidateScore/, 'DataStore calculates candidate score');

console.log('Scorecard-v1 and Decision Board tests passed successfully!');

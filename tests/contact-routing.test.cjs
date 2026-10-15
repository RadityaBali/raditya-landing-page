const { test } = require('node:test');
const assert = require('node:assert/strict');
const { resolveContact } = require('../contact-routing');
const { resolveReferral, createLink } = require('../referral');
const { rankBranches } = require('../branch-distance');
const branches = require('../branches.json');
const sales = require('../sales.json');
const now = 1000;
const run = input => resolveContact({ branches, sales, now, ...input });
const manual = branchId => ({ branchId, source: 'manual', expiresAt: now + 10000 });
const referral = resolveReferral('?ref=rd-dps-02', null, sales, branches, now).referral;

test('every branch routes to its own active sales person', () => {
  for (const branch of branches) {
    const result = run({ explicitBranchId: branch.id });
    assert.equal(result.branch.id, branch.id);
    assert.equal(result.sales.branchId, branch.id);
    assert.equal(result.source, 'page');
  }
});
test('referral sales persists while delivery branch changes', () => {
  const result = run({ referral, explicitBranchId:'klungkung', nearestBranchId:'singaraja', saved:manual('gianyar') });
  assert.equal(result.sales.id,'rd-dps-02');
  assert.equal(result.branch.id,'denpasar');
  assert.equal(result.serviceBranch.id,'klungkung');
});
test('branch URL beats earlier manual choice and geolocation', () => {
  assert.equal(run({explicitBranchId:'gianyar', saved:manual('denpasar'), nearestBranchId:'singaraja'}).branch.id,'gianyar');
});
test('manual selection beats new geolocation', () => {
  assert.equal(run({saved:manual('gianyar'), nearestBranchId:'singaraja'}).branch.id,'gianyar');
});
test('organic visitor uses the nearest branch, from all eight regions', () => {
  for (const branch of branches) {
    const ranked = rankBranches(branch.coordinates,branches);
    const result = run({nearestBranchId:ranked[0].id});
    assert.equal(result.branch.id,branch.id);
    assert.equal(result.sales.branchId,branch.id);
  }
});
test('expired or unknown saved selection falls back safely', () => {
  assert.equal(run({saved:{...manual('denpasar'),expiresAt:999}}).source,'central');
  assert.equal(run({saved:manual('missing'),explicitBranchId:'missing'}).branch,null);
});
test('inactive sales falls back to another active salesperson in same branch', () => {
  const result = run({explicitBranchId:'denpasar',sales:sales.map(s=>s.id==='rd-dps-01'?{...s,active:false}:s)});
  assert.equal(result.sales.id,'rd-dps-02');
});
test('unavailable branch sales does not redirect to an unrelated branch', () => {
  const result = run({explicitBranchId:'denpasar',sales:sales.filter(s=>s.branchId!=='denpasar')});
  assert.equal(result.sales,null);
  assert.equal(result.branch.id,'denpasar');
});
test('invalid new referral clears old attribution', () => {
  const result = resolveReferral('?ref=invalid',{salesId:'rd-dps-02',expiresAt:99999},sales,branches,now);
  assert.equal(result.referral,null); assert.equal(result.clear,true);
});
test('valid new referral replaces saved salesperson', () => {
  const result = resolveReferral('?ref=rd-gny-02',{salesId:'rd-dps-02',expiresAt:99999},sales,branches,now);
  assert.equal(result.referral.sales.id,'rd-gny-02');
});
test('shared referral links resolve to existing branch pages', () => {
  const fs = require('node:fs');
  for (const person of sales) {
    const url=new URL(createLink('https://radityabali.com/',person));
    assert.equal(url.searchParams.get('ref'),person.id);
    assert.ok(fs.existsSync(require('node:path').join(__dirname,'..',url.pathname,'index.html')));
  }
});

const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const policy = require('../contact-routing');
const distance = require('../branch-distance');
const branches = require('../branches.json');
const sales = require('../sales.json');
const config = require('../site-config.json');
const source = fs.readFileSync(require('node:path').join(__dirname,'../contact-router.js'),'utf8');
function setup({ pageBranch, referral=null, denyStorage=false, permission='prompt' }={}) {
  const storage = new Map(); const events=[]; let gpsSuccess, gpsFailure, calls=0;
  const element = (attrs={}) => ({dataset:{},textContent:'',disabled:false,href:attrs.href,...attrs,
    getAttribute(k){return this[k]},setAttribute(k,v){this[k]=v},removeAttribute(k){delete this[k]},addEventListener(){},replaceChildren(){},append(){}});
  const generic=element({href:'https://wa.me/6281558064281?text=hello'});
  const pinned=element({href:'https://wa.me/6281558064281?text=visit',dataset:{contactBranch:'gianyar'}});
  const status=element(),note=element(),feedback=element(),select=element(),button=element();
  const document={body:{dataset:{branchId:pageBranch}},dispatchEvent(e){events.push(e)},querySelectorAll(selector){
    if(selector==='a[href]')return [generic,pinned];
    if(selector==='[data-service-select]')return [select];
    if(selector==='[data-contact-status]')return [status];
    if(selector==='[data-contact-note]')return [note];
    if(selector==='[data-location-feedback]')return [feedback];
    if(selector.includes('data-find-branch'))return [button];
    return [];
  }};
  const context={URL,URLSearchParams,Date,Option:function(text,value){this.text=text;this.value=value;},CustomEvent:function(type,opts){this.type=type;this.detail=opts.detail;},document,location:{href:'http://localhost/',search:''},history:{replaceState(){}},isSecureContext:true,
    localStorage:{getItem(k){if(denyStorage)throw Error();return storage.get(k)},setItem(k,v){if(denyStorage)throw Error();storage.set(k,v)}},
    navigator:{permissions:{query:async()=>({state:permission})},geolocation:{getCurrentPosition(success,failure){calls++;gpsSuccess=success;gpsFailure=failure}}},
    radityaReferral:{ready:Promise.resolve(referral),branches,sales,config},radityaContactPolicy:policy,branchDistance:distance};
  context.window=context;vm.runInNewContext(source,context);
  return {api:context.radityaContact,generic,pinned,status,note,feedback,select,button,storage,events,get calls(){return calls},success(id){const b=branches.find(b=>b.id===id);gpsSuccess({coords:{latitude:b.coordinates[0],longitude:b.coordinates[1],accuracy:10}})},fail(code){gpsFailure({code})}};
}
test('no initial permission prompt; manual choice updates all general contacts, not named branch contact',async()=>{
 const env=setup(); await env.api.ready;assert.equal(env.calls,0);
 env.api.chooseBranch('buleleng'); assert.ok(env.generic.href.includes('/6280000000109?'));assert.ok(env.pinned.href.includes('/6280000000105?'));
 assert.equal(env.select.value,'buleleng');
});
test('geolocation updates nearest branch and never stores raw coordinates',async()=>{
 const env=setup();await env.api.ready;await env.api.locate();env.success('buleleng');
 assert.equal(env.api.current.branch.id,'buleleng');assert.ok(env.generic.href.includes('/6280000000109?'));
 const saved=JSON.parse([...env.storage.values()][0]);assert.deepEqual(Object.keys(saved).sort(),['branchId','expiresAt','source']);
 assert.equal(env.button.disabled,false);
});
test('late GPS result cannot override a manual choice made while locating',async()=>{
 const env=setup();await env.api.ready;await env.api.locate();env.api.chooseBranch('gianyar');env.success('buleleng');
 assert.equal(env.api.current.branch.id,'gianyar');
});
test('denied location leaves contacts usable and allows manual fallback',async()=>{
 const env=setup();await env.api.ready;await env.api.locate();env.fail(1);
 assert.match(env.feedback.textContent,/belum diizinkan/);assert.equal(env.button.disabled,false);
 env.api.chooseBranch('klungkung');assert.ok(env.generic.href.includes('/6280000000115?'));
});
test('manual routing works when storage is unavailable',async()=>{
 const env=setup({denyStorage:true});await env.api.ready;env.api.chooseBranch('bangli');assert.equal(env.api.current.branch.id,'bangli');
});
test('permission already granted may locate automatically for an organic visitor',async()=>{
 const env=setup({permission:'granted'});await env.api.ready;await Promise.resolve();await Promise.resolve();
 assert.equal(env.calls,1);env.success('jembrana');assert.equal(env.api.current.branch.id,'jembrana');
});

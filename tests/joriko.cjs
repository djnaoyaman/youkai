const assert = require('node:assert/strict');
const {simulate, successAges, options, accountStep, scalePositive} = require('../joriko-model.js');
const near = (a,b) => assert.ok(Math.abs(a-b)<1e-9, `${a} != ${b}`);
const base=simulate();
assert.equal(base.length,41);assert.equal(base[0].age,25);assert.equal(base[40].age,65);
assert.equal(base[0].wealth,300);assert.equal(base[0].trust,.7);assert.equal(base[0].trueFriends,8);
assert.equal(base[25].age,50);assert.equal(base[35].age,60);
assert.deepEqual(base,simulate());
for(const founder of [false,true]) for(const wins of [0,1,3,5]) {
 const o={founder,wins,agency:.8,burden:.9,care:.1};
 const l=simulate(o),r=simulate({...o,repair:true}),c=simulate({...o,crash:true});
 assert.deepEqual(l.slice(0,20),r.slice(0,20),'25–44 identical before repair');
 assert.ok(r[40].trust>l[40].trust);assert.ok(r[40].listeners>l[40].listeners);
 assert.deepEqual(l.slice(0,35),c.slice(0,35),'25–59 identical before crash');
 near(c[35].wealth,l[35].wealth>0?l[35].wealth*.35:l[35].wealth);
 near(c[35].rank,l[35].rank*.25);near(c[35].beforeEvent.wealth,l[35].wealth);
 for(let i=0;i<=40;i++) {near(c[i].trust,l[i].trust);near(c[i].trueFriends,l[i].trueFriends);near(c[i].listeners,l[i].listeners);}
 assert.deepEqual(l.filter(d=>d.events.includes('事業成功')).map(d=>d.age), founder?successAges(wins):[]);
 assert.deepEqual(l.filter(d=>d.events.includes('事業損失')).map(d=>d.age), founder?[36,48,60]:[]);
 const low=simulate({...o,agency:0}),high=simulate({...o,agency:1});
 low.forEach((d,i)=>{near(d.trust,high[i].trust);near(d.trueFriends,high[i].trueFriends);near(d.listeners,high[i].listeners);});
}
let cases=0;
for(const agency of [0,.2,.5,.8,1])for(const burden of [0,.2,.5,.8,1])for(const care of [0,.2,.5,.8,1])
for(const founder of [false,true])for(const wins of [0,1,3,5])for(const crash of [false,true])for(const repair of [false,true]) {
 const l=simulate({agency,burden,care,founder,wins,crash,repair});cases++;
 l.forEach((d,i)=>{
  assert.equal(d.age,25+i);
  for(const key of ['wealth','rank','trust','trueFriends','funFriends','workContacts','listeners','autonomy','relatedness','economic','fulfillment'])assert.ok(Number.isFinite(d[key]),key);
  for(const key of ['trust','autonomy','relatedness','economic','fulfillment'])assert.ok(d[key]>=0&&d[key]<=1,key);
  assert.ok(d.listeners<=d.trueFriends+1e-9);assert.ok(d.listeners>=0&&d.listeners<=5);
  assert.ok(d.trueFriends>=0&&d.trueFriends<=15);assert.ok(d.funFriends>=0&&d.funFriends<=15);assert.ok(d.workContacts>=0&&d.workContacts<=50);
 });
}
near(options({weights:[60,20,20]}).weights[0],.6);
assert.deepEqual(options({weights:[0,0,0]}).weights,[.4,.3,.3]);
assert.deepEqual(options({weights:[NaN,-1,Infinity]}).weights,[.4,.3,.3]);
// Deficits remain debt; asset shocks never erase liabilities.
near(accountStep(-100,300,360),-163);
near(accountStep(10,100,360),-249.8);
near(scalePositive(-100,.35),-100);near(scalePositive(-100,1.8),-100);
near(scalePositive(100,.35),35);
const first=base[1];
const income=420*1.01*(.8+.4*.7)*(.9+.2*.5)*(1+.12*.2);
near(first.income,income);near(first.wealth,300*1.02+income-372);
console.log(`PASS: ${cases} scenarios; ages, initial state, debt, crash timing, deterministic success, repair, independent agency, score bounds and subsets`);

/* 常利己の計算 v2. All coefficients are fictional scenario assumptions. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.JorikoModel = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const clamp = (x, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, x));
  const defaults = Object.freeze({agency: .5, burden: .2, care: .5, founder: false, wins: 0,
    crash: false, repair: false, employeeDiscretion: .5, founderDiscretion: .7,
    weights: [.4, .3, .3]});
  const successAges = count => ({0: [], 1: [45], 3: [33, 45, 57], 5: [33, 39, 45, 51, 57]})[count] || [];
  function options(input) {
    const o = Object.assign({}, defaults, input);
    ['agency', 'burden', 'care', 'employeeDiscretion', 'founderDiscretion'].forEach(k => {
      o[k] = Number.isFinite(Number(o[k])) ? clamp(Number(o[k])) : defaults[k];
    });
    const raw = Array.isArray(o.weights) && o.weights.length === 3 ? o.weights : defaults.weights;
    const w = raw.map(x => Number.isFinite(Number(x)) ? Math.max(0, Number(x)) : 0);
    const sum = w.reduce((a, b) => a + b, 0);
    o.weights = sum ? w.map(x => x / sum) : defaults.weights.slice();
    o.wins = o.founder && [0, 1, 3, 5].includes(Number(o.wins)) ? Number(o.wins) : 0;
    return o;
  }
  // Five years of living expenses maps to .5; ten years maps to 1.
  const buffer = wealth => clamp(Math.max(wealth, 0) / (360 * 10));
  function measures(s, o, care) {
    const q = .2 + .5 * s.trust + .3 * care;
    const listeners = 5 * (1 - Math.exp(-s.trueFriends * q / 5));
    const economic = buffer(s.wealth);
    const discretion = o.founder ? o.founderDiscretion : o.employeeDiscretion;
    const autonomy = .5 * o.agency + .3 * economic + .2 * discretion;
    const relatedness = .7 * listeners / 5 + .3 * s.funFriends / 15;
    const fulfillment = relatedness * o.weights[0] + autonomy * o.weights[1] + economic * o.weights[2];
    return Object.assign({}, s, {listeners, economic, autonomy, relatedness, fulfillment});
  }
  const accountStep = (wealth, income, spending) => wealth * (wealth >= 0 ? 1.02 : 1.03) + income - spending;
  const scalePositive = (wealth, multiplier) => wealth > 0 ? wealth * multiplier : wealth;
  function simulate(input) {
    const o = options(input);
    let s = {age: 25, wealth: 300, rank: 1, trust: .7, trueFriends: 8, funFriends: 10, workContacts: 4};
    const log = [Object.assign(measures(s, o, o.care), {income: 0, spending: 0, events: [], beforeEvent: null})];
    let incomeMultiplier = 1;
    for (let age = 26; age <= 65; age++) {
      const care = o.repair && age >= 45 ? Math.max(.7, o.care) : o.care;
      const burden = o.repair && age >= 45 ? Math.min(.1, o.burden) : o.burden;
      const years = Math.min(age - 25, 25);
      const income = 420 * Math.pow(o.founder ? 1.015 : 1.01, years) * incomeMultiplier
        * (.8 + .4 * s.trust) * (.9 + .2 * o.agency) * (1 + .12 * burden);
      const spending = 360 + 24 * care;
      const wealth = accountStep(s.wealth, income, spending);
      s = Object.assign({}, s, {age, wealth,
        rank: s.rank + (o.founder ? .13 : .10) * (.5 + .5 * s.trust) * (.8 + .4 * o.agency),
        trust: clamp(s.trust + (.03 * (1 - burden) + .10 * care) * (1 - s.trust) - .15 * burden * s.trust)});
      const events = [];
      let beforeEvent = null;
      if (o.founder && successAges(o.wins).includes(age)) {
        s.wealth = scalePositive(s.wealth, 1.8);
        incomeMultiplier *= 1.1; // Starts with the following year's income.
        s.rank += 1.2;
        events.push('事業成功');
      }
      if (o.founder && [36, 48, 60].includes(age)) {
        s.wealth = scalePositive(s.wealth, .9);
        events.push('事業損失');
      }
      if (o.crash && age === 60) {
        beforeEvent = {wealth: s.wealth, rank: s.rank};
        s.wealth = scalePositive(s.wealth, .35);
        s.rank *= .25;
        events.push('失脚');
      }
      const trueTarget = 15 * s.trust * (.4 + .6 * care);
      const funTarget = 15 * (.3 + .7 * care) * (.5 + .5 * s.trust);
      // Saturation is a scenario setting, not a Dunbar-derived hard human limit.
      const network = Math.sqrt(Math.max(s.wealth, 0) / 300) + s.rank / 5;
      const workTarget = 50 * (1 - Math.exp(-network / 12));
      s.trueFriends += (trueTarget - s.trueFriends) * .12;
      s.funFriends += (funTarget - s.funFriends) * .18;
      s.workContacts += (workTarget - s.workContacts) * .18;
      log.push(Object.assign(measures(s, o, care), {income, spending, events, beforeEvent}));
    }
    return log;
  }
  return {defaults, options, simulate, successAges, accountStep, scalePositive};
});

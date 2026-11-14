(function () {
  'use strict';
  if (!document.getElementById('jrk-agency') || !window.JorikoModel) return;
  const $ = id => document.getElementById('jrk-' + id);
  const model = window.JorikoModel;
  const weights = {balanced: [40, 30, 30], relationships: [60, 20, 20], autonomy: [20, 60, 20], economic: [20, 20, 60]};
  const weightIds = ['weight-related', 'weight-autonomy', 'weight-economic'];
  const format = {
    wealth: x => Math.round(x).toLocaleString('ja-JP') + '万円',
    rank: x => x.toFixed(1), trust: x => x.toFixed(2), autonomy: x => x.toFixed(2),
    fulfillment: x => (x * 100).toFixed(1), support50: x => (x * 100).toFixed(1)
  };
  ['trueFriends', 'funFriends', 'workContacts', 'listeners'].forEach(k => { format[k] = x => x.toFixed(1) + '人相当'; });
  const compareRows = [['wealth', '純資産'], ['trust', '信頼'], ['trueFriends', '本音を話せる関係'],
    ['listeners', '聞いてくれる人'], ['autonomy', '自律性'], ['fulfillment', '充足指数']];
  function readOptions() {
    return model.options({agency: Number($('agency').value) / 100, burden: Number($('burden').value) / 100,
      care: Number($('care').value) / 100,
      founder: document.querySelector('[name="jrkCareer"]:checked').value === 'founder',
      wins: Number(document.querySelector('[name="jrkWins"]:checked').value), crash: $('crash').checked,
      employeeDiscretion: Number($('employee-discretion').value) / 100,
      founderDiscretion: Number($('founder-discretion').value) / 100,
      weights: weightIds.map(id => Math.max(0, Number($(id).value) || 0))});
  }
  function tableRows(series) {
    return compareRows.map(([key, name]) => '<tr><th scope="row">' + name + '</th>' +
      series.map(s => '<td>' + format[key](s[key]) + '</td>').join('') + '</tr>').join('');
  }
  const chartGroups = [
    {title: '経済', unit: '万円', keys: [['wealth', '純資産', '#9b392f']]},
    {title: '人間関係', unit: '人相当', keys: [['trueFriends', '本音', '#9b392f'], ['funFriends', '趣味', '#8b6509'], ['workContacts', '仕事', '#27635e'], ['listeners', '聞き手', '#475397']]},
    {title: '状態', unit: '指数 0〜100', keys: [['trust', '信頼', '#9b392f'], ['autonomy', '自律性', '#27635e'], ['fulfillment', '充足', '#475397']]}
  ];
  function chart(group, log, repaired, o) {
    const state = group.title === '状態';
    const value = (d, key) => d[key] * (state ? 100 : 1);
    const all = (repaired ? log.concat(repaired) : log);
    const values = all.flatMap(d => group.keys.map(([key]) => value(d, key)));
    let min = Math.min(0, ...values), max = Math.max(1, ...values);
    if (state) { min = 0; max = 100; }
    else {
      const step = Math.pow(10, Math.floor(Math.log10(Math.max(Math.abs(min), max)))) / 2;
      min = Math.floor(min / step) * step; max = Math.ceil(max / step) * step;
    }
    const x = age => 80 + (age - 25) / 40 * 540;
    const y = v => 24 + (max - v) / (max - min) * 210;
    let svg = '<svg viewBox="0 0 640 275" role="img" aria-label="' + group.title + 'の25歳から65歳までの推移。数値は下の年ごとの表でも確認できます。"><title>' + group.title + 'の推移</title>';
    for (let i = 0; i <= 4; i++) {
      const v = min + (max - min) * i / 4, yy = y(v);
      const label = state || max < 100 ? Number(v.toFixed(1)).toLocaleString('ja-JP') : Math.round(v).toLocaleString('ja-JP');
      svg += '<line x1="80" y1="' + yy + '" x2="620" y2="' + yy + '" class="jrk-gridline"/><text x="72" y="' + (yy + 4) + '" text-anchor="end">' + label + '</text>';
    }
    [25, 35, 45, 55, 65].forEach(age => { svg += '<text x="' + x(age) + '" y="261" text-anchor="middle">' + age + '歳</text>'; });
    [[45, !!repaired, '行動変更'], [60, o.crash, '失脚']].forEach(([age, on, name]) => {
      if (on) svg += '<line x1="' + x(age) + '" x2="' + x(age) + '" y1="24" y2="234" class="jrk-event-line"/><text x="' + x(age) + '" y="16" text-anchor="middle">' + name + '</text>';
    });
    group.keys.forEach(([key, , color]) => {
      [log, repaired].forEach((series, i) => {
        if (!series) return;
        const d = series.map((row, j) => (j ? 'L' : 'M') + x(row.age).toFixed(2) + ',' + y(value(row, key)).toFixed(2)).join(' ');
        svg += '<path d="' + d + '" fill="none" stroke="' + color + '" stroke-width="2.5"' + (i ? ' stroke-dasharray="7 5"' : '') + '/>';
      });
    });
    svg += '</svg>';
    const legend = group.keys.map(([, name, color]) => '<span><i style="background:' + color + '"></i>' + name + '</span>').join('');
    return '<figure class="jrk-chart-panel"><figcaption>' + group.title + '<small>' + group.unit + '</small></figcaption>' + svg + '<div class="jrk-chart-key">' + legend + '</div></figure>';
  }
  function yearlyTable(log, repaired) {
    const rows = log.map((d, i) => '<tr><th scope="row">' + d.age + '歳</th><td>' + format.wealth(d.wealth) + '</td><td>' + format.trust(d.trust) + '</td><td>' + format.trueFriends(d.trueFriends) + '</td><td>' + format.funFriends(d.funFriends) + '</td><td>' + format.workContacts(d.workContacts) + '</td><td>' + format.listeners(d.listeners) + '</td><td>' + format.autonomy(d.autonomy) + '</td><td>' + format.fulfillment(d.fulfillment) + '</td>' + (repaired ? '<td>' + format.listeners(repaired[i].listeners) + '</td><td>' + format.fulfillment(repaired[i].fulfillment) + '</td>' : '') + '<td>' + (d.events.join('・') || '—') + '</td></tr>').join('');
    return '<details class="jrk-details"><summary>年ごとの数値を表で読む</summary><div class="jrk-table-scroll"><table><caption>25歳の初期状態と、26〜65歳の年末の値</caption><thead><tr><th scope="col">年齢</th><th scope="col">純資産</th><th scope="col">信頼</th><th scope="col">本音</th><th scope="col">趣味</th><th scope="col">仕事</th><th scope="col">聞き手</th><th scope="col">自律性</th><th scope="col">充足指数</th>' + (repaired ? '<th scope="col">修復時の聞き手</th><th scope="col">修復時の充足指数</th>' : '') + '<th scope="col">出来事</th></tr></thead><tbody>' + rows + '</tbody></table></div></details>';
  }
  function update() {
    const o = readOptions(), log = model.simulate(o), d = log[40];
    const repaired = $('repair').checked ? model.simulate(Object.assign({}, o, {repair: true})) : null;
    ['agency', 'burden', 'care', 'employee-discretion', 'founder-discretion'].forEach(id => { $(id + '-value').textContent = $(id).value + '%'; });
    $('wins-row').disabled = !o.founder;
    Object.keys(format).forEach(key => { $(key).textContent = format[key](key === 'support50' ? log[25].relatedness : d[key]); });
    $('weight-note').textContent = '適用中の配分　関係' + (o.weights[0] * 100).toFixed(1) + '%、自律性' + (o.weights[1] * 100).toFixed(1) + '%、経済' + (o.weights[2] * 100).toFixed(1) + '%。合計を100%に換算。全項目0なら標準を適用します。';
    $('summary').textContent = '65歳時点の純資産は' + format.wealth(d.wealth) + '。信頼は' + format.trust(d.trust) + '、聞いてくれる人は' + format.listeners(d.listeners) + '。自分の意思を大切にすることと、相手に負担を寄せることは、別々に計算しています。';
    $('repair-comparison').hidden = !repaired;
    if (repaired) $('repair-body').innerHTML = tableRows([d, repaired[40]]);
    $('crash-comparison').hidden = !o.crash;
    if (o.crash) {
      const noCrash = model.simulate(Object.assign({}, o, {crash: false}));
      $('crash-body').innerHTML = tableRows([log[34], log[35], d, noCrash[40]]);
      const before = log[35].beforeEvent;
      $('crash-immediate').textContent = '60歳の失脚イベント直前 → 直後　純資産 ' + format.wealth(before.wealth) + ' → ' + format.wealth(log[35].wealth) + '、影響力 ' + format.rank(before.rank) + ' → ' + format.rank(log[35].rank) + '。';
    }
    $('charts').innerHTML = chartGroups.map(g => chart(g, log, repaired, o)).join('') + yearlyTable(log, repaired);
    // All explanatory numbers come from the same model, including counterfactuals.
    const lowBurden = model.simulate(Object.assign({}, o, {burden: 0}))[40];
    const highBurden = model.simulate(Object.assign({}, o, {burden: 1}))[40];
    const agencyLow = model.simulate(Object.assign({}, o, {agency: 0}))[40];
    const agencyHigh = model.simulate(Object.assign({}, o, {agency: 1}))[40];
    let findings = '<p>ほかの条件をそろえて、自分の意思を0%から100%へ変えても、65歳の信頼は' + format.trust(agencyLow.trust) + 'から' + format.trust(agencyHigh.trust) + 'で変わりません。自己決定そのものを、信頼を失う行動とは扱っていないためです。</p>';
    findings += '<p>相手への負担だけを0%と100%にすると、65歳の信頼はそれぞれ' + format.trust(lowBurden.trust) + 'と' + format.trust(highBurden.trust) + '、純資産は' + format.wealth(lowBurden.wealth) + 'と' + format.wealth(highBurden.wealth) + 'です。短期の取り分と、その後の信頼の影響を組み合わせた結果です。</p>';
    if (repaired) findings += '<p>45歳から育て直すと、聞いてくれる人は65歳時点で' + format.listeners(d.listeners) + 'から' + format.listeners(repaired[40].listeners) + 'へ変わります。充足指数は' + format.fulfillment(d.fulfillment) + 'から' + format.fulfillment(repaired[40].fulfillment) + '。修復に使う手間と支出も計算に含めています。</p>';
    findings += '<p>この結果は設定から生まれた値です。人間関係の数を足して友人の総数にしたり、充足指数から健康や寿命を予測したりはしません。</p>';
    $('findings').innerHTML = findings;
  }
  $('weight-preset').addEventListener('change', function () {
    const selected = weights[this.value];
    if (selected) weightIds.forEach((id, i) => { $(id).value = selected[i]; });
    update();
  });
  weightIds.forEach(id => $(id).addEventListener('input', function () { $('weight-preset').value = 'custom'; }));
  document.querySelectorAll('.jrk-presets button').forEach(button => button.addEventListener('click', function () {
    const preset = this.dataset.preset;
    const values = preset === 'independent' ? [80, 10, 70] : preset === 'burden' ? [80, 90, 10] : [50, 20, 50];
    ['agency', 'burden', 'care'].forEach((id, i) => { $(id).value = values[i]; });
    if (preset === 'balanced') {
      document.querySelector('[name="jrkCareer"][value="employee"]').checked = true;
      document.querySelector('[name="jrkWins"][value="0"]').checked = true;
      $('crash').checked = false; $('repair').checked = false;
      $('employee-discretion').value = 50; $('founder-discretion').value = 70;
      $('weight-preset').value = 'balanced'; weightIds.forEach((id, i) => { $(id).value = weights.balanced[i]; });
    }
    update();
  }));
  document.querySelectorAll('.jrk-control input').forEach(input => input.addEventListener(input.type === 'radio' || input.type === 'checkbox' ? 'change' : 'input', update));
  update();
})();

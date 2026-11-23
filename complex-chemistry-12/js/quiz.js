/* =====================================================================
 * COMPLEX CHEMISTRY 12 – LUYỆN TẬP (phần logic)
 * Ngân hàng câu hỏi sinh tự động: mỗi phức chất × 6 dạng bài.
 * Giao diện các bước làm bài nằm ở pages-luyen.js.
 * ===================================================================== */
var Quiz = (function () {
  'use strict';
  var esc = Chem.esc;

  var TYPES = [
    { id: 'f2n', name: 'Công thức → chọn tên', desc: 'Chọn tên đúng của phức chất', lv: 1 },
    { id: 'n2f', name: 'Tên → chọn công thức', desc: 'Chọn công thức ứng với tên', lv: 2 },
    { id: 'type', name: 'Công thức → tự nhập tên', desc: 'Gõ tên theo SGK', lv: 3 },
    { id: 'os', name: 'Xác định số oxi hóa', desc: 'Của nguyên tử trung tâm', lv: 2 },
    { id: 'lig', name: 'Xác định phối tử', desc: 'Loại và số lượng phối tử', lv: 1 },
    { id: 'cn', name: 'Xác định số phối trí', desc: 'Kể cả phối tử hai càng', lv: 1 }
  ];
  var LV_NAME = ['', 'Nhận biết', 'Thông hiểu', 'Vận dụng'];

  /* ---------- ngân hàng câu hỏi (sinh lại khi đổi kiểu tên phối tử) ---------- */
  var BANK = [];
  function rebuildBank() {
    BANK.length = 0;
    App.lib().forEach(function (a) {
      TYPES.forEach(function (t) { BANK.push({ id: a.id + '-' + t.id, a: a, type: t.id, lv: Math.max(a.lv, t.lv) }); });
    });
  }
  rebuildBank(); App.onRebuild(rebuildBank);

  /* ---------- tiện ích ---------- */
  function shuffle(arr) { for (var i = arr.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = arr[i]; arr[i] = arr[j]; arr[j] = t; } return arr; }
  function clone(p) { return JSON.parse(JSON.stringify(p)); }
  function uniqPush(list, v, correct) { if (v && v !== correct && list.indexOf(v) < 0) list.push(v); }
  function fillFrom(list, pool, correct, n) { shuffle(pool.slice()).forEach(function (v) { if (list.length < n) uniqPush(list, v, correct); }); }
  // các phức chất khác (bỏ chất có cùng ion phức để tránh gây nhầm)
  function others(a) { return App.lib().filter(function (x) { return x.ionFormula !== a.ionFormula; }); }
  function iu() { return App.mode() === 'iupac'; }
  function nm(p) { return Chem.name(p, iu() ? 'en' : 'vi'); }

  /* ---------- sinh phương án nhiễu ---------- */
  function wrongNames(a) {
    var p = a.p, M = METALS[p.metal], out = [], correct = App.pName(a), lang = iu() ? 'en' : 'vi', q;
    q = clone(p); q.os = p.os + 1; uniqPush(out, nm(q), correct);
    if (p.os > 0) { q = clone(p); q.os = p.os - 1; uniqPush(out, nm(q), correct); }
    // sai kiểu tên kim loại (Latin cho cation / tên thường cho anion)
    var parts = Chem.nameParts(p, lang).map(function (x) { return Object.assign({}, x); });
    parts.forEach(function (x) {
      if (x.k !== 'metal') return;
      if (p.charge < 0) { x.t = lang === 'vi' ? M.vi : M.en; x.sp = lang === 'vi'; } else { x.t = lang === 'vi' ? M.at : M.enAt; x.sp = false; }
    });
    uniqPush(out, Chem.joinParts(parts), correct);
    q = clone(p); q.ligands[0].count = p.ligands[0].count >= 4 ? p.ligands[0].count - 1 : p.ligands[0].count + 1; uniqPush(out, nm(q), correct);
    if (p.ligands.length > 1) uniqPush(out, Chem.name(p, lang, { order: Chem.sortedLigands(p, lang).reverse() }), correct);
    if (lang === 'vi') {
      if (/ammin/.test(correct)) uniqPush(out, correct.replace(/ammin/g, 'amin'), correct);
      if (/đi/.test(correct)) uniqPush(out, correct.replace(/đi(?=[a-z])/g, 'di'), correct);
    }
    if (p.kind === 'neutral') uniqPush(out, lang === 'vi' ? 'ion ' + correct : correct + ' ion', correct);
    var res = shuffle(out).slice(0, 3);
    fillFrom(res, others(a).filter(function (x) { return x.p.metal === p.metal; }).map(App.pName), correct, 3);
    fillFrom(res, others(a).map(App.pName), correct, 3);
    return res;
  }
  function wrongFormulas(a) {
    var p = a.p, out = [], correct = a.formula, q;
    q = clone(p); q.ligands[0].count += (q.ligands[0].count >= 4 ? -2 : 1); uniqPush(out, Chem.formula(q), correct);
    if (!p.outerCation && !p.outerAnion) {
      q = clone(p); q.charge = p.charge + (p.charge <= 0 ? -1 : 1); uniqPush(out, Chem.formula(q), correct);
      q = clone(p); q.charge = -p.charge || 1; uniqPush(out, Chem.formula(q), correct);
    }
    if (p.outerCation) { q = clone(p); q.outerCation.count = p.outerCation.count + 1; uniqPush(out, Chem.formula(q), correct); }
    if (p.outerAnion) { q = clone(p); q.outerAnion.count = p.outerAnion.count === 1 ? 2 : p.outerAnion.count - 1; uniqPush(out, Chem.formula(q), correct); }
    if (p.ligands.length > 1) { q = clone(p); var t = q.ligands[0].count; q.ligands[0].count = q.ligands[1].count; q.ligands[1].count = t; uniqPush(out, Chem.formula(q), correct); }
    var res = shuffle(out).slice(0, 3);
    fillFrom(res, others(a).filter(function (x) { return x.p.metal === p.metal; }).map(function (x) { return x.formula; }), correct, 3);
    fillFrom(res, others(a).map(function (x) { return x.formula; }), correct, 3);
    return res;
  }
  function ligText(ligs) { return ligs.map(function (l) { return l.count + ' ' + LIGANDS[l.key].display; }).join(' và '); }
  function wrongLigands(a) {
    var p = a.p, out = [], correct = ligText(p.ligands), q;
    if (p.outerAnion) uniqPush(out, correct + ' và ' + p.outerAnion.count + ' ' + p.outerAnion.ion.display, correct);
    if (p.outerCation) uniqPush(out, correct + ' và ' + p.outerCation.count + ' ' + p.outerCation.ion.display, correct);
    q = clone(p.ligands); q[0].count = q[0].count + 1; uniqPush(out, ligText(q), correct);
    q = clone(p.ligands); if (q[0].count > 1) { q[0].count = q[0].count - 1; uniqPush(out, ligText(q), correct); }
    var oth = shuffle(['NH3', 'H2O', 'Cl', 'CN', 'OH', 'CO'].filter(function (k) { return !p.ligands.some(function (l) { return l.key === k; }); }));
    q = clone(p.ligands); q[0].key = oth[0]; uniqPush(out, ligText(q), correct);
    q = clone(p.ligands); q[q.length - 1].key = oth[1]; uniqPush(out, ligText(q), correct);
    return shuffle(out).slice(0, 3);
  }
  function numberOptions(correct, extra, fmt) {
    var set = [correct];
    extra.forEach(function (v) { if (v >= 0 && v <= 8 && set.indexOf(v) < 0) set.push(v); });
    [correct + 1, correct - 1, correct + 2, correct - 2, correct + 3].forEach(function (v) { if (set.length < 4 && v >= 0 && set.indexOf(v) < 0) set.push(v); });
    return shuffle(set.slice(0, 4)).map(function (v) { return { text: fmt(v), ok: v === correct }; });
  }

  /* ---------- dựng câu hỏi ---------- */
  function build(q) {
    var a = q.a, p = a.p, Q = { q: q, a: a, mode: App.mode() }, name = App.pName(a), sys = iu() ? 'IUPAC' : 'SGK';
    if (q.type === 'f2n') {
      Q.html = 'Tên gọi đúng theo ' + sys + ' của <span class="f">' + a.formula + '</span> là:';
      Q.options = shuffle([{ text: name, ok: true }].concat(wrongNames(a).map(function (t) { return { text: t }; })));
      Q.answer = name;
    } else if (q.type === 'n2f') {
      Q.html = 'Công thức của <b>' + esc(name) + '</b> là:';
      Q.options = shuffle([{ text: a.formula, ok: true, f: 1 }].concat(wrongFormulas(a).map(function (t) { return { text: t, f: 1 }; })));
      Q.answer = a.formula; Q.answerIsFormula = true;
    } else if (q.type === 'type') {
      Q.html = 'Gõ tên gọi của <span class="f">' + a.formula + '</span> theo ' + sys + ':';
      Q.input = true; Q.answer = name;
    } else if (q.type === 'os') {
      Q.html = 'Số oxi hóa của nguyên tử trung tâm <b>' + p.metal + '</b> trong <span class="f">' + a.formula + '</span> là:';
      Q.options = numberOptions(p.os, [Math.abs(p.charge), p.os + Math.abs(p.charge)], Chem.signed);
      Q.answer = Chem.signed(p.os);
    } else if (q.type === 'lig') {
      Q.html = 'Các phối tử liên kết với nguyên tử trung tâm trong <span class="f">' + a.formula + '</span> là:';
      var c = ligText(p.ligands);
      Q.options = shuffle([{ text: c, ok: true }].concat(wrongLigands(a).map(function (t) { return { text: t }; })));
      Q.answer = c;
    } else {
      Q.html = 'Số phối trí của nguyên tử trung tâm trong <span class="f">' + a.formula + '</span> là:';
      var n = p.ligands.reduce(function (s, l) { return s + l.count; }, 0);
      var outer = (p.outerAnion || p.outerCation || { count: 0 }).count;
      Q.options = numberOptions(p.cn, [n, p.cn + outer, p.cn === 4 ? 6 : 4, 2], String);
      Q.answer = String(p.cn);
    }
    return Q;
  }
  function explain(Q) {
    // lời giải theo chế độ lúc ra câu hỏi (không đổi nếu người dùng bấm VI ⇄ IUPAC giữa bài)
    var iuQ = Q.mode === 'iupac', s = iuQ ? Q.a.stepsEn : Q.a.stepsVi, t = Q.q.type, head = '<h4><i data-lucide="lightbulb"></i> Lời giải</h4>';
    if (t === 'os') return head + s[2].html;
    if (t === 'lig') return head + s[0].html + '<br>' + s[1].html;
    if (t === 'cn') return head + s[1].html;
    return head + '<p><b>' + Q.a.formula + '</b> → <b>' + esc(iuQ ? Q.a.nameEn : Q.a.nameVi) + '</b></p>' + s[2].html + '<p>' + s[3].html + '</p>' + s[4].html;
  }

  /* ---------- chấm câu tự nhập ----------
   * Bỏ qua: hoa/thường, dấu cách, chữ "ion", dấu thanh (sắc, huyền…).
   * KHÔNG bỏ qua chữ "đ": "diammin" là lỗi sai SGK nêu rõ. */
  function normAns(s) { return String(s).toLowerCase().replace(/\bion\b/g, '').replace(/[\s\-‐–]/g, ''); }
  function noTone(s) { return s.normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function gradeTyped(v, a, mode) {
    var iuM = (mode || App.mode()) === 'iupac'; // chấm theo chế độ lúc bắt đầu bài
    var cands = (iuM ?[a.nameEn, a.nameEnAlt] : [a.nameVi]).map(normAns), u = normAns(v);
    if (!u) return { ok: false, msg: 'Bạn chưa nhập gì.' };
    if (cands.indexOf(u) >= 0) return { ok: true, msg: 'Chính xác!' };
    if (cands.some(function (c) { return noTone(c) === noTone(u); })) return { ok: true, msg: 'Đúng! Lưu ý viết đủ dấu thanh tiếng Việt (ồ, ắ…).' };
    var ud = Chem.deaccent(u);
    if (cands.some(function (c) { return Chem.deaccent(c) === ud; })) return { ok: false, near: true, msg: 'Gần đúng nhưng sai chữ “đ”: phải viết “đi”, “đồng”… (không viết “di”, “dong”).' };
    var sim = Math.max.apply(null, cands.map(function (c) { return Chem.similarity(ud, Chem.deaccent(c)); }));
    var tip = '';
    if (/\(\s*[+-]?\d\s*\)/.test(v)) tip = ' Số oxi hóa phải viết bằng số La Mã, ví dụ (II).';
    else if (iuM && /ammine/.test(a.nameEn) && !/ammine/.test(v.toLowerCase())) tip = ' Phối tử NH₃ trong IUPAC là “ammine” (hai chữ m, có chữ e).';
    else if (iuM && /\s/.test(v.trim().replace(/\s+ion$/i, '')) && !a.p.outerCation && !a.p.outerAnion) tip = ' Tên IUPAC của ion phức viết liền, không có dấu cách.';
    else if (/amin(?!m)/.test(Chem.deaccent(v)) && /ammin/.test(a.nameVi)) tip = ' “ammin” viết hai chữ m.';
    return { ok: false, near: sim >= 0.85, msg: (sim >= 0.85 ? 'Gần đúng (giống ' + Math.round(sim * 100) + '%) nhưng còn sai chi tiết.' : 'Chưa đúng.') + tip };
  }

  /* ---------- phiên làm bài ---------- */
  var S = null, LAST = null;
  function pickQuestions(types, lv, n, ids) {
    if (ids) return shuffle(BANK.filter(function (q) { return ids.indexOf(q.id) >= 0; }));
    var pool = BANK.filter(function (q) { return types.indexOf(q.type) >= 0; });
    var exact = shuffle(pool.filter(function (q) { return q.lv === lv; }));
    var rest = shuffle(pool.filter(function (q) { return q.lv !== lv; })).sort(function (x, y) { return Math.abs(x.lv - lv) - Math.abs(y.lv - lv); });
    var chosen = [], used = {}, all = exact.concat(rest);
    all.forEach(function (q) { if (chosen.length < n && !used[q.a.id]) { chosen.push(q); used[q.a.id] = 1; } }); // ưu tiên không trùng chất
    all.forEach(function (q) { if (chosen.length < n && chosen.indexOf(q) < 0) chosen.push(q); });
    return shuffle(chosen);
  }
  function start(cfg) {
    S = { list: pickQuestions(cfg.types, cfg.lv, cfg.n, cfg.ids).map(build), i: 0, answers: [], t0: Date.now(), lv: cfg.lv, timer: cfg.timer, retry: !!cfg.ids, mode: App.mode() };
    return S;
  }
  function session() { return S; }
  function answer(v, timeout) {
    var Q = S.list[S.i]; if (S.answers[S.i]) return S.answers[S.i];
    var r;
    if (timeout) r = { ok: false, your: '(hết giờ)', msg: 'Hết giờ!' };
    else if (Q.input) { var g = gradeTyped(v, Q.a, S.mode); r = { ok: g.ok, your: v, msg: g.msg }; }
    else r = { ok: !!Q.options[v].ok, your: Q.options[v].text, pick: v };
    S.answers[S.i] = r;
    return r;
  }
  function finish() {
    var n = S.list.length, c = S.answers.filter(function (x) { return x && x.ok; }).length;
    var res = { n: n, c: c, sec: Math.round((Date.now() - S.t0) / 1000), score: Math.round(c / n * 100) / 10, pct: Math.round(c / n * 100), lv: S.lv, retry: S.retry,
      wrong: S.list.map(function (Q, i) { return { Q: Q, A: S.answers[i] }; }).filter(function (x) { return !x.A || !x.A.ok; }) };
    if (!S.retry) {
      var key = 'history-' + S.mode, hist = App.Store.get(key, []); // lưu đúng chế độ của bài này
      hist.push({ t: Date.now(), lv: res.lv, n: n, c: c, score: res.score, sec: res.sec });
      App.Store.set(key, hist.slice(-50));
    }
    LAST = res; S = null;
    return res;
  }
  function quit() { S = null; }
  function last() { return LAST; }

  return { TYPES: TYPES, LV_NAME: LV_NAME, BANK: BANK, build: build, explain: explain, gradeTyped: gradeTyped,
    start: start, session: session, answer: answer, finish: finish, quit: quit, last: last };
})();

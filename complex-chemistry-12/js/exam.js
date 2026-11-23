/* =====================================================================
 * COMPLEX CHEMISTRY 12 – ĐỀ KIỂM TRA (phần logic)
 *  - Gọi Netlify Function để AI soạn đề, rồi KIỂM TRA LẠI từng câu bằng
 *    dữ liệu và bộ gọi tên của web. Câu nào sai thì thay bằng câu tự sinh.
 *  - Tự sinh đề cùng định dạng 3 phần từ ngân hàng câu hỏi (không dùng AI).
 *  - Chấm điểm theo cách tính của đề thi tốt nghiệp THPT từ 2025.
 * Giao diện nằm ở pages-de.js.
 * ===================================================================== */
var Exam = (function () {
  'use strict';
  var esc = Chem.esc, Store = App.Store;
  var ENDPOINT = '/.netlify/functions/generate-exam';
  var HOUR = 3600 * 1000, USER_MAX = 10;

  var LV = { NB: 'Nhận biết', TH: 'Thông hiểu', VD: 'Vận dụng' };
  var LV_NUM = { NB: 1, TH: 2, VD: 3 }, LV_CODE = ['', 'NB', 'TH', 'VD'];
  var LEVELS = [['NB', 'Nhận biết'], ['TH', 'Thông hiểu'], ['VD', 'Vận dụng'], ['MIX', 'Đề tổng hợp']];
  // số câu mỗi phần, thời gian làm bài và số phức chất gửi cho AI
  var LENGTHS = {
    short: { name: 'Kiểm tra 15 phút', p1: 6, p2: 2, p3: 2, minutes: 15, pool: 8 },
    full: { name: 'Đề đầy đủ', p1: 12, p2: 4, p3: 6, minutes: 45, pool: 14 }
  };
  // điểm thô như đề thật: Phần I 0,25đ/câu; Phần II theo số ý đúng; Phần III 0,25đ/câu → quy về thang 10
  var TF_POINTS = [0, 0.1, 0.25, 0.5, 1];

  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function levelName(code) { for (var i = 0; i < LEVELS.length; i++) if (LEVELS[i][0] === code) return LEVELS[i][1]; return ''; }

  /* mức độ của từng câu trong một phần; "Đề tổng hợp" trộn khoảng 40% – 30% – 30% */
  function plan(level, n) {
    var out = [], i;
    if (level !== 'MIX') { for (i = 0; i < n; i++) out.push(level); return out; }
    var nb = Math.round(n * 0.4), th = Math.round(n * 0.3);
    for (i = 0; i < n; i++) out.push(i < nb ? 'NB' : i < nb + th ? 'TH' : 'VD');
    return out;
  }
  function fullPlan(cfg) { var L = LENGTHS[cfg.length]; return { p1: plan(cfg.level, L.p1), p2: plan(cfg.level, L.p2), p3: plan(cfg.level, L.p3) }; }

  /* ---------- sự thật về một phức chất (lấy từ bộ gọi tên của web) ---------- */
  function nLig(a) { return a.p.ligands.reduce(function (s, l) { return s + l.count; }, 0); }
  function ligText(a) { return a.p.ligands.map(function (l) { return l.count + ' ' + LIGANDS[l.key].display; }).join(', '); }
  function outer(a) { return a.p.outerCation || a.p.outerAnion || null; }
  function names(a, mode) { return mode === 'iupac' ? [a.nameEn, a.nameEnAlt] : [a.nameVi]; }
  function mainName(a, mode) { return mode === 'iupac' ? a.nameEn : a.nameVi; }

  /* ---------- so khớp câu trả lời của AI với sự thật ---------- */
  var SUB = '₀₁₂₃₄₅₆₇₈₉', SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
  function toAscii(s) {
    return String(s).replace(/[₀-₉]/g, function (c) { return SUB.indexOf(c); }).replace(/[⁰¹²³⁴-⁹]/g, function (c) { return SUP.indexOf(c); })
      .replace(/⁺/g, '+').replace(/[⁻−–]/g, '-');
  }
  function normF(s) { return toAscii(s).replace(/\s+/g, '').replace(/[.;,]+$/, ''); }
  function normN(s) { return String(s).toLowerCase().replace(/\bion\b/g, '').replace(/[\s\-‐–.;,]/g, ''); }
  var ROMAN = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8 };
  // đọc một số nguyên có dấu: "+3", "3+", "−2", "2-", "(III)", "6"
  function signedInt(s) {
    var t = toAscii(s), m;
    if ((m = /(\d+)\s*([+-])(?![\d])/.exec(t))) return (m[2] === '-' ? -1 : 1) * +m[1];
    if ((m = /([+-])\s*(\d+)/.exec(t))) return (m[1] === '-' ? -1 : 1) * +m[2];
    if ((m = /\d+/.exec(t))) return +m[0];
    if ((m = /\b(VIII|VII|VI|IV|V|III|II|I)\b/.exec(t))) return ROMAN[m[1]];
    return null;
  }
  // "văn bản này có nói đúng sự thật dạng `kind` của phức chất a không?"
  function matches(kind, a, textValue, mode) {
    var t = String(textValue || '');
    switch (kind) {
      case 'name': return names(a, mode).map(normN).indexOf(normN(t)) >= 0;
      case 'formula': return normF(t) === a.ascii.replace(/\s+/g, '');
      case 'oxidation': return signedInt(t) === a.os;
      case 'coordination': return signedInt(t) === a.cn;
      case 'ligand_count': return signedInt(t) === nLig(a);
      case 'charge': return signedInt(t) === a.p.charge;
      case 'geometry': var d = Chem.deaccent(t); return d.indexOf(Chem.deaccent(a.geoVi)) >= 0 || d.indexOf(a.geoEn.toLowerCase()) >= 0;
    }
    return null; // 'other': web không tự kiểm chứng được
  }
  var NUMERIC = { oxidation: function (a) { return a.os; }, coordination: function (a) { return a.cn; }, ligand_count: nLig, charge: function (a) { return a.p.charge; } };

  /* ---------- chọn phức chất cho một đề ---------- */
  function pickComplexes(cfg) {
    var L = LENGTHS[cfg.length], want = cfg.level === 'MIX' ? 0 : LV_NUM[cfg.level];
    var recent = {}; history().slice(-2).forEach(function (h) { (h.used || []).forEach(function (f) { recent[f] = 1; }); });
    var seen = {}, list = shuffle(App.lib().slice()).map(function (a) {
      // điểm ưu tiên: đúng mức độ, chưa dùng trong 2 đề gần nhất
      return { a: a, s: Math.random() + (want && Math.abs(a.lv - want) > 1 ? -1 : 0) + (recent[a.ascii] ? -0.6 : 0) + (cfg.level === 'VD' && outer(a) ? 0.5 : 0) };
    }).sort(function (x, y) { return y.s - x.s; }).map(function (x) { return x.a; })
      .filter(function (a) { if (seen[a.ionFormula]) return false; seen[a.ionFormula] = 1; return true; });
    return list.slice(0, L.pool);
  }

  /* =================== ĐỀ TỪ NGÂN HÀNG CÂU HỎI =================== */
  function stripHead(html) { return html.replace(/<h4>.*?<\/h4>/, ''); }
  function nearestLevel(pool, lvNum, getLv) {
    var exact = pool.filter(function (x) { return getLv(x) === lvNum; });
    if (exact.length) return exact;
    var near = pool.filter(function (x) { return Math.abs(getLv(x) - lvNum) === 1; });
    return near.length ? near : pool;
  }
  // Phần I: lấy từ ngân hàng câu hỏi luyện tập (trừ dạng tự gõ tên)
  function bankMCQ(code, list, used) {
    var pool = Quiz.BANK.filter(function (q) { return q.type !== 'type' && !used[q.id] && (!list || list.indexOf(q.a) >= 0); });
    if (!pool.length) pool = Quiz.BANK.filter(function (q) { return q.type !== 'type' && !used[q.id]; });
    var q = pick(nearestLevel(pool, LV_NUM[code], function (x) { return x.lv; })), Q = Quiz.build(q);
    used[q.id] = 1;
    return { lv: LV_CODE[q.lv] || code, html: Q.html, options: Q.options.map(function (o) { return esc(o.text); }),
      answer: Q.options.map(function (o) { return !!o.ok; }).indexOf(true), explain: stripHead(Quiz.explain(Q)), src: 'bank', used: q.a.ascii };
  }
  // Phần II: 4 ý đúng/sai về một phức chất
  function bankTF(code, list, used, mode) {
    var pool = (list && list.length ? list : App.lib()).filter(function (a) { return !used['tf' + a.id]; });
    if (!pool.length) pool = App.lib();
    var a = pick(nearestLevel(pool, LV_NUM[code], function (x) { return x.lv; })), p = a.p, o = outer(a), M = p.metal;
    used['tf' + a.id] = 1;
    var name = mainName(a, mode), wrongName = Quiz.build({ a: a, type: 'f2n', id: 'x', lv: a.lv }).options.filter(function (x) { return !x.ok; })[0].text;
    var otherGeo = pick(['Bát diện', 'Tứ diện', 'Vuông phẳng', 'Đường thẳng'].filter(function (g) { return g !== a.geoVi; }));
    var L0 = p.ligands[0], D0 = LIGANDS[L0.key].display;
    // mỗi mẫu: [ý đúng, ý sai, lời giải]
    var T = [
      ['Số phối trí của nguyên tử trung tâm ' + M + ' là ' + a.cn + '.', 'Số phối trí của nguyên tử trung tâm ' + M + ' là ' + (a.cn === 6 ? 4 : a.cn + 2) + '.',
        'Có ' + ligText(a) + ' liên kết với ' + M + ' nên số phối trí là ' + a.cn + '.'],
      ['Số oxi hóa của ' + M + ' trong phức chất này là ' + Chem.signed(a.os) + '.', 'Số oxi hóa của ' + M + ' trong phức chất này là ' + Chem.signed(a.os + 1) + '.',
        'Tổng điện tích các phối tử cộng số oxi hóa của ' + M + ' bằng điện tích ion phức (' + Chem.chargeText(p.charge) + '), suy ra số oxi hóa của ' + M + ' là ' + Chem.signed(a.os) + '.'],
      ['Tên gọi của chất này là “' + name + '”.', 'Tên gọi của chất này là “' + wrongName + '”.', 'Tên đúng: ' + name + '.'],
      ['Trong cầu nội có ' + L0.count + ' phối tử ' + D0 + '.', 'Trong cầu nội có ' + (L0.count + 1) + ' phối tử ' + D0 + '.', 'Cầu nội gồm ' + M + ' và ' + ligText(a) + '.'],
      ['Phức chất có dạng hình học ' + a.geoVi.toLowerCase() + '.', 'Phức chất có dạng hình học ' + otherGeo.toLowerCase() + '.', 'Với số phối trí ' + a.cn + ', phức này có dạng ' + a.geoVi.toLowerCase() + '.'],
      p.charge === 0
        ? ['Đây là phức chất trung hòa (cầu nội không mang điện).', 'Cầu nội của phức chất này mang điện tích 2+.', 'Tổng điện tích của ' + M + ' và các phối tử bằng 0 nên đây là phức trung hòa.']
        : ['Ion phức (cầu nội) mang điện tích ' + Chem.chargeText(p.charge) + '.', 'Ion phức (cầu nội) mang điện tích ' + Chem.chargeText(-p.charge) + '.',
          'Ion phức là ' + a.ionFormula + ', mang điện tích ' + Chem.chargeText(p.charge) + ' (' + a.kindVi.toLowerCase() + ').']
    ];
    if (o) T.push(['Khi tan trong nước, 1 mol chất này phân li ra ' + (o.count + 1) + ' mol ion.', 'Khi tan trong nước, 1 mol chất này phân li ra ' + (o.count + nLig(a) + 1) + ' mol ion.',
      'Chỉ cầu ngoại tách khỏi ion phức: 1 mol chất cho ' + o.count + ' mol ' + o.ion.display + ' và 1 mol ' + a.ionFormula + '.']);
    var chosen = shuffle(T).slice(0, 4), truth = shuffle([true, true, false, false]);
    if (Math.random() < 0.5) truth[0] = !truth[0];           // 1–3 ý đúng, không bao giờ cả 4 ý giống nhau
    return { lv: code, html: 'Cho phức chất <span class="f">' + a.formula + '</span>.',
      statements: chosen.map(function (t, i) { return { html: esc(truth[i] ? t[0] : t[1]), answer: truth[i], explain: esc(t[2]) }; }), src: 'bank', used: a.ascii };
  }
  // Phần III: trả lời ngắn bằng một số
  function bankShort(code, list, used) {
    var base = list && list.length ? list : App.lib(), tries = 0, a, o, kinds, k, f;
    do {
      a = pick(nearestLevel(base, LV_NUM[code], function (x) { return x.lv; }));
      o = outer(a);
      kinds = code === 'NB' ? ['cn', 'nlig'] : code === 'TH' ? (o ? ['os', 'charge'] : ['os'])
        : ['sum', 'ligcharge'].concat(o ? ['ions', 'ions'] : [], a.p.outerAnion && a.p.outerAnion.key === 'Cl' ? ['agcl', 'agcl'] : []);
      k = pick(kinds);
    } while (used['s' + a.id + k] && ++tries < 30);
    used['s' + a.id + k] = 1;
    f = '<span class="f">' + a.formula + '</span>';
    var Q = { lv: code, src: 'bank', used: a.ascii };
    if (k === 'cn') { Q.html = 'Số phối trí của nguyên tử trung tâm trong ' + f + ' là bao nhiêu?'; Q.answer = a.cn; Q.explain = 'Có ' + ligText(a) + ' liên kết với ' + a.p.metal + ' → số phối trí là ' + a.cn + '.'; }
    else if (k === 'nlig') { Q.html = 'Có tổng cộng bao nhiêu phối tử trong cầu nội của ' + f + '?'; Q.answer = nLig(a); Q.explain = 'Cầu nội có ' + ligText(a) + ' → ' + nLig(a) + ' phối tử.'; }
    else if (k === 'os') { Q.html = 'Số oxi hóa của ' + a.p.metal + ' trong ' + f + ' là bao nhiêu?'; Q.answer = a.os; Q.explain = 'Điện tích ion phức là ' + Chem.chargeText(a.p.charge) + ', trừ đi tổng điện tích các phối tử → số oxi hóa của ' + a.p.metal + ' là ' + Chem.signed(a.os) + '.'; }
    else if (k === 'charge') { Q.html = 'Điện tích của ion phức trong ' + f + ' là bao nhiêu? (ghi cả dấu, ví dụ −2)'; Q.answer = a.p.charge; Q.explain = 'Cầu ngoại gồm ' + o.count + ' ion ' + o.ion.display + ' nên ion phức ' + a.ionFormula + ' mang điện tích ' + Chem.chargeText(a.p.charge) + '.'; }
    else if (k === 'sum') { Q.html = 'Trong ' + f + ', tổng của số oxi hóa của ' + a.p.metal + ' và số phối trí của nó là bao nhiêu?'; Q.answer = a.os + a.cn; Q.explain = 'Số oxi hóa của ' + a.p.metal + ' là ' + Chem.signed(a.os) + ', số phối trí là ' + a.cn + ' → tổng là ' + (a.os + a.cn) + '.'; }
    else if (k === 'ligcharge') {
      var lc = a.p.ligands.reduce(function (s, l) { return s + l.count * LIGANDS[l.key].charge; }, 0);
      Q.html = 'Tổng điện tích của tất cả các phối tử trong ' + f + ' là bao nhiêu? (ghi cả dấu nếu khác 0, ví dụ −4)'; Q.answer = lc;
      Q.explain = 'Các phối tử: ' + a.p.ligands.map(function (l) { return l.count + ' ' + LIGANDS[l.key].display + ' (mỗi phối tử mang điện tích ' + Chem.signed(LIGANDS[l.key].charge) + ')'; }).join(', ') + ' → tổng là ' + Chem.signed(lc) + '.';
    }
    else if (k === 'agcl') {
      var n = pick([0.01, 0.02, 0.05]), m = Math.round(n * o.count * 143.5 * 1000) / 1000;
      Q.html = 'Cho dung dịch chứa ' + String(n).replace('.', ',') + ' mol ' + f + ' tác dụng với lượng dư dung dịch AgNO₃. Khối lượng kết tủa AgCl thu được là bao nhiêu gam? (Cho Ag = 108; Cl = 35,5. Chỉ ion Cl⁻ ở cầu ngoại tạo kết tủa.)';
      Q.answer = m; Q.explain = 'Mỗi mol chất có ' + o.count + ' mol Cl⁻ ở cầu ngoại → n(AgCl) = ' + String(Math.round(n * o.count * 1000) / 1000).replace('.', ',') + ' mol → m = ' + String(m).replace('.', ',') + ' gam.';
    } else {
      var n2 = pick([0.1, 0.2, 0.5]), tot = Math.round(n2 * (o.count + 1) * 100) / 100;
      Q.html = 'Hòa tan hoàn toàn ' + String(n2).replace('.', ',') + ' mol ' + f + ' vào nước. Tổng số mol ion trong dung dịch là bao nhiêu? (Coi ion phức không phân li tiếp.)';
      Q.answer = tot; Q.explain = '1 mol chất phân li ra ' + o.count + ' mol ' + o.ion.display + ' và 1 mol ' + a.ionFormula + ', tức ' + (o.count + 1) + ' mol ion → ' + String(tot).replace('.', ',') + ' mol.';
    }
    Q.explain = esc(Q.explain);
    return Q;
  }
  function newExam(cfg, source) {
    var L = LENGTHS[cfg.length];
    return { id: String(Math.floor(1000 + Math.random() * 9000)), source: source, mode: App.mode(), level: cfg.level, length: cfg.length, minutes: L.minutes,
      title: cfg.length === 'short' ? 'ĐỀ KIỂM TRA 15 PHÚT' : 'ĐỀ KIỂM TRA ' + L.minutes + ' PHÚT', created: Date.now(), replaced: 0, parts: { p1: [], p2: [], p3: [] } };
  }
  function fromBank(cfg) {
    var ex = newExam(cfg, 'bank'), P = fullPlan(cfg), list = pickComplexes(cfg), used = {};
    ex.parts.p1 = P.p1.map(function (c) { return bankMCQ(c, list, used); });
    ex.parts.p2 = P.p2.map(function (c) { return bankTF(c, list, used, ex.mode); });
    ex.parts.p3 = P.p3.map(function (c) { return bankShort(c, list, used); });
    return ex;
  }

  /* =================== ĐỀ TỪ AI: KIỂM TRA TỪNG CÂU =================== */
  function str(v, max) { return typeof v === 'string' && v.trim() && v.length <= (max || 700) ? v.trim() : null; }
  function htmlText(s) { return esc(s).replace(/\n/g, '<br>'); }
  function refOf(item, list) { var i = item.ref; return typeof i === 'number' && list[i - 1] ? list[i - 1] : null; }
  function lvOf(item, fallback) { return LV[item.level] ? item.level : fallback; }

  // Trả về câu đã chuẩn hóa, hoặc null nếu sai khuôn dạng / sai hóa học
  function checkMCQ(it, list, mode, code) {
    if (!it || typeof it !== 'object') return null;
    var q = str(it.question), ex = str(it.explanation, 900) || '', o = it.options, ans = it.answer;
    if (!q || !Array.isArray(o) || o.length !== 4 || !(ans === 0 || ans === 1 || ans === 2 || ans === 3)) return null;
    o = o.map(function (x) { return str(x, 300); });
    if (o.some(function (x) { return !x; })) return null;
    o = o.map(function (x) { return x.replace(/^[A-D][.)]\s+/, ''); });
    if (o.map(normN).filter(function (x, i, arr) { return arr.indexOf(x) === i; }).length !== 4) return null;   // trùng phương án
    if (it.kind && it.kind !== 'other') {
      var a = refOf(it, list); if (!a) return null;
      if (matches(it.kind, a, o[ans], mode) !== true) return null;                                              // đáp án của AI không khớp dữ liệu
      if (o.some(function (x, i) { return i !== ans && matches(it.kind, a, x, mode) === true; })) return null;   // có 2 phương án cùng đúng
    }
    return { lv: lvOf(it, code), html: htmlText(q), options: o.map(esc), answer: ans, explain: htmlText(ex), src: 'ai', stem: q, used: (refOf(it, list) || {}).ascii };
  }
  function checkTF(it, list, mode, code) {
    if (!it || typeof it !== 'object') return null;
    var ctx = str(it.context, 900), st = it.statements, a = refOf(it, list);
    if (!ctx || !Array.isArray(st) || st.length !== 4) return null;
    var out = [];
    for (var i = 0; i < 4; i++) {
      var s = st[i] || {}, t = str(s.text, 500);
      if (!t || typeof s.answer !== 'boolean') return null;
      if (s.kind && s.kind !== 'other') {
        if (!a || !str(s.claim, 200)) return null;
        if (matches(s.kind, a, s.claim, mode) !== s.answer) return null;   // AI nói "đúng" nhưng dữ liệu nói "sai" (hoặc ngược lại)
      }
      out.push({ html: htmlText(t.replace(/^[a-d]\)\s+/, '')), answer: s.answer, explain: htmlText(str(s.explanation, 900) || '') });
    }
    return { lv: lvOf(it, code), html: htmlText(ctx), statements: out, src: 'ai', stem: ctx, used: (a || {}).ascii };
  }
  function checkShort(it, list, mode, code) {
    if (!it || typeof it !== 'object') return null;
    var q = str(it.question), ans = it.answer;
    if (!q || typeof ans !== 'number' || !isFinite(ans) || Math.abs(ans) > 99999) return null;
    if (it.kind && it.kind !== 'other') {
      var a = refOf(it, list), fact = NUMERIC[it.kind];
      if (!a || !fact || fact(a) !== ans) return null;
    }
    return { lv: lvOf(it, code), html: htmlText(q), answer: ans, explain: htmlText(str(it.explanation, 900) || ''), src: 'ai', stem: q, used: (refOf(it, list) || {}).ascii };
  }
  function fromAI(raw, cfg, list) {
    var ex = newExam(cfg, 'ai'), P = fullPlan(cfg), used = {}, good = 0;
    if (!raw || typeof raw !== 'object') return null;
    function build(key, checker, bank) {
      var src = Array.isArray(raw[key]) ? raw[key] : [];
      ex.parts[key === 'part1' ? 'p1' : key === 'part2' ? 'p2' : 'p3'] = P[key === 'part1' ? 'p1' : key === 'part2' ? 'p2' : 'p3'].map(function (code, i) {
        var okItem = checker(src[i], list, ex.mode, code);
        if (okItem) { good++; return okItem; }
        ex.replaced++;                                   // câu AI bị loại → thay bằng câu tự sinh cùng mức độ
        return bank(code, list, used, ex.mode);
      });
    }
    build('part1', checkMCQ, bankMCQ); build('part2', checkTF, bankTF); build('part3', checkShort, bankShort);
    return good ? ex : null;                             // AI không cho được câu nào dùng được → coi như lỗi
  }

  /* =================== CHẤM ĐIỂM =================== */
  function num(s) { var v = parseFloat(String(s == null ? '' : s).trim().replace(',', '.').replace(/[−–]/g, '-')); return isFinite(v) ? v : null; }
  function shortOk(user, ans) { var u = num(user); return u != null && Math.abs(u - ans) <= Math.max(0.011, Math.abs(ans) * 0.005); }
  function blankAnswers(ex) {
    return { p1: ex.parts.p1.map(function () { return null; }), p2: ex.parts.p2.map(function () { return [null, null, null, null]; }), p3: ex.parts.p3.map(function () { return ''; }) };
  }
  function answered(ex, ans) {
    return ans.p1.filter(function (x) { return x != null; }).length + ans.p2.filter(function (r) { return r.every(function (x) { return x != null; }); }).length +
      ans.p3.filter(function (x) { return String(x).trim() !== ''; }).length;
  }
  function total(ex) { return ex.parts.p1.length + ex.parts.p2.length + ex.parts.p3.length; }
  function grade(ex, ans) {
    var P = ex.parts, r = { p1: [], p2: [], p3: [], raw: 0, max: P.p1.length * 0.25 + P.p2.length * 1 + P.p3.length * 0.25 };
    P.p1.forEach(function (q, i) { var ok = ans.p1[i] === q.answer; r.p1.push(ok); if (ok) r.raw += 0.25; });
    P.p2.forEach(function (q, i) {
      var oks = q.statements.map(function (s, j) { return ans.p2[i][j] === s.answer; }), n = oks.filter(Boolean).length;
      r.p2.push({ oks: oks, n: n, pts: TF_POINTS[n] }); r.raw += TF_POINTS[n];
    });
    P.p3.forEach(function (q, i) { var ok = shortOk(ans.p3[i], q.answer); r.p3.push(ok); if (ok) r.raw += 0.25; });
    r.score = r.max ? Math.round(r.raw / r.max * 1000) / 100 : 0;   // thang 10, làm tròn 2 chữ số
    return r;
  }

  /* =================== GIỚI HẠN LƯỢT & LỊCH SỬ (localStorage, Store đã bọc try/catch) =================== */
  function calls() { var now = Date.now(); return Store.get('exam-calls', []).filter(function (t) { return typeof t === 'number' && now - t < HOUR; }); }
  function callsLeft() { return Math.max(0, USER_MAX - calls().length); }
  function waitMinutes() { var c = calls(); return c.length < USER_MAX ? 0 : Math.max(1, Math.ceil((HOUR - (Date.now() - c[0])) / 60000)); }
  function noteCall() { var c = calls(); c.push(Date.now()); Store.set('exam-calls', c); }
  function today() { var d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function quotaBlocked() { return Store.get('exam-quota-day', '') === today(); }      // đã hết lượt AI trong hôm nay → khỏi gọi nữa
  function history() { return Store.get('exam-history', []); }
  function saveResult(ex, score) {
    var items = ex.parts.p1.concat(ex.parts.p2, ex.parts.p3), h = history();
    h.push({ t: Date.now(), level: ex.level, length: ex.length, mode: ex.mode, source: ex.source, score: score,
      stems: items.filter(function (q) { return q.stem; }).map(function (q) { return q.stem.slice(0, 110); }),
      used: items.map(function (q) { return q.used; }).filter(function (f, i, arr) { return f && arr.indexOf(f) === i; }) });
    Store.set('exam-history', h.slice(-10));
  }
  function avoidList() { var out = []; history().slice(-3).forEach(function (h) { out = out.concat(h.stems || []); }); return out.slice(-30); }

  /* =================== GỌI AI =================== */
  var KNOWN = { QUOTA_EXCEEDED: 1, RATE_LIMIT: 1, API_KEY_INVALID: 1, AI_UNAVAILABLE: 1, USER_LIMIT: 1 };
  function payload(cfg, list) {
    var mode = App.mode(), L = LENGTHS[cfg.length];
    return {
      mode: mode, levelName: levelName(cfg.level), minutes: L.minutes, plan: fullPlan(cfg), seed: String(Math.floor(Math.random() * 1e9)),
      complexes: list.map(function (a) {
        var o = outer(a);
        return { f: a.formula, name: mainName(a, mode), metal: a.p.metal, os: Chem.signed(a.os), cn: String(a.cn), lig: ligText(a), charge: Chem.chargeText(a.p.charge),
          kind: a.kindVi, geo: a.geoVi, outer: o ? o.count + ' ' + o.ion.display : '', color: a.item.color || '', note: a.item.note || '' };
      }),
      avoid: avoidList()
    };
  }
  // Trả về Promise của { exam } hoặc { error, waitMin }
  function generate(cfg) {
    if (quotaBlocked()) return Promise.resolve({ error: 'QUOTA_EXCEEDED' });
    var wait = waitMinutes();
    if (wait) return Promise.resolve({ error: 'USER_LIMIT', waitMin: wait });
    var list = pickComplexes(cfg), ctrl = ('AbortController' in window) ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 35000);
    return fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload(cfg, list)), signal: ctrl ? ctrl.signal : undefined })
      .then(function (res) { return res.json(); })
      .then(function (d) {
        // chỉ tính 1 lượt khi AI thật sự đã soạn đề (lỗi mạng, hết lượt… không bị trừ lượt của người dùng)
        if (d && d.ok && d.exam) { noteCall(); var ex = fromAI(d.exam, cfg, list); return ex ? { exam: ex } : { error: 'AI_UNAVAILABLE', detail: 'Không câu nào của AI qua được bước kiểm tra' }; }
        var code = d && KNOWN[d.error] ? d.error : 'AI_UNAVAILABLE';
        if (code === 'QUOTA_EXCEEDED') Store.set('exam-quota-day', today());
        return { error: code, waitMin: d && d.waitMin, detail: d && typeof d.detail === 'string' ? d.detail : '' };
      })
      // mất mạng, quá giờ, hoặc máy chủ không trả JSON (ví dụ function bị Netlify cắt ngang)
      .catch(function (e) { return { error: 'AI_UNAVAILABLE', detail: e && e.name === 'AbortError' ? 'Quá 35 giây không có phản hồi' : 'Máy chủ không trả về JSON' }; })
      .then(function (r) { clearTimeout(timer); return r; });
  }

  /* đề đang làm (giữ trong bộ nhớ để rời trang rồi quay lại vẫn còn) */
  var CUR = null;
  function begin(ex) { CUR = { exam: ex, ans: blankAnswers(ex), deadline: Date.now() + ex.minutes * 60000, result: null }; return CUR; }
  function current() { return CUR; }
  function submit() { if (CUR && !CUR.result) { CUR.result = grade(CUR.exam, CUR.ans); saveResult(CUR.exam, CUR.result.score); } return CUR && CUR.result; }

  return { LV: LV, LEVELS: LEVELS, LENGTHS: LENGTHS, levelName: levelName, total: total, answered: answered,
    fromBank: fromBank, fromAI: fromAI, generate: generate, grade: grade, matches: matches,
    callsLeft: callsLeft, quotaBlocked: quotaBlocked, history: history, begin: begin, current: current, submit: submit };
})();

/* =====================================================================
 * COMPLEX CHEMISTRY 12 – LÕI DÙNG CHUNG
 * Lưu trữ, cài đặt, thư viện đã phân tích, hiển thị kết quả, hiệu ứng nền.
 * ===================================================================== */
var App = (function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = Chem.esc;

  /* ---------- lưu trữ (luôn bọc try/catch) ---------- */
  var Store = {
    get: function (k, def) {
      try { var v = localStorage.getItem('cc12-' + k); if (v == null) return def; var o = JSON.parse(v); return (Array.isArray(def) && !Array.isArray(o)) ? def : o; } catch (e) { return def; }
    },
    set: function (k, v) { try { localStorage.setItem('cc12-' + k, JSON.stringify(v)); } catch (e) { /* bộ nhớ bị chặn */ } }
  };

  /* ---------- cài đặt ---------- */
  // nameMode: '' (chưa chọn) | 'vi' | 'iupac' ; iupacStyle: 'new' (chlorido) | 'old' (chloro)
  var DEFAULTS = { nameMode: '', iupacStyle: 'new', enAccent: 'en-US', voiceVi: '', voiceEn: '', rate: 0.9 };
  var settings = Object.assign({}, DEFAULTS, Store.get('settings', {}));
  function getSetting(k) { return settings[k]; }
  function setSetting(k, v) {
    settings[k] = v; Store.set('settings', settings);
    if (k === 'iupacStyle') rebuild();
    if (k === 'nameMode') { applyMode(); document.dispatchEvent(new CustomEvent('modechange')); }
  }
  function applyMode() { document.documentElement.setAttribute('data-mode', mode()); }
  // khóa lưu trữ riêng cho từng chế độ (điểm, lịch sử, flashcard)
  function mkey(k) { return k + '-' + mode(); }
  function theme() { try { return localStorage.getItem('cc12-theme') || 'system'; } catch (e) { return 'system'; } }
  function setTheme(t) {
    try { localStorage.setItem('cc12-theme', t); } catch (e) { }
    if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t);
    else document.documentElement.removeAttribute('data-theme');
    document.dispatchEvent(new CustomEvent('themechange'));
  }
  function isDark() {
    var t = document.documentElement.getAttribute('data-theme');
    if (t) return t === 'dark';
    return !!(window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
  }

  function icons() { try { if (window.lucide) window.lucide.createIcons(); } catch (e) { } }
  // khung "Giáo viên hướng dẫn" dùng chung (trang chủ, Liên hệ, Giới thiệu); để trống SITE_CONFIG.teacher thì không hiện
  function teacherBox() {
    var t = SITE_CONFIG.teacher;
    return t ? '<div class="teacher-box"><i data-lucide="graduation-cap"></i><div><span>Giáo viên hướng dẫn</span><b>' + esc(t) + '</b></div></div>' : '';
  }
  function toast(msg, icon) {
    var box = $('#toasts'), t = document.createElement('div');
    t.className = 'toast'; t.innerHTML = '<i data-lucide="' + (icon || 'info') + '"></i><span>' + msg + '</span>';
    box.appendChild(t); icons();
    setTimeout(function () { t.style.transition = 'opacity .4s'; t.style.opacity = '0'; setTimeout(function () { t.remove(); }, 400); }, 3200);
  }

  /* ---------- thư viện đã phân tích ---------- */
  function slugOf(ascii) {
    return ascii.replace(/\+/g, 'plus').replace(/-/g, 'minus').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase();
  }
  var LIB = [], listeners = [];
  function rebuild() {
    var style = settings.iupacStyle === 'old' ? 'old' : 'new', other = style === 'old' ? 'new' : 'old';
    LIB = COMPLEXES.map(function (c, i) {
      Chem.setLigandStyle(other);
      var alt = Chem.analyze(c.f, c.geo);
      Chem.setLigandStyle(style);
      var a = Chem.analyze(c.f, c.geo);
      if (!a.ok) { if (window.console) console.warn('Lỗi dữ liệu:', c.f, a.error); return null; }
      a.item = c; a.id = i; a.lv = c.lv || 2; a.slug = slugOf(a.ascii);
      a.nameEnAlt = alt.nameEn;                       // tên IUPAC theo kiểu còn lại (để chấm bài)
      a.nameEnOld = style === 'old' ? a.nameEn : alt.nameEn;
      if (c.name_vi) a.nameVi = c.name_vi;            // tên ghi đè trong data.js (nếu có)
      if (c.name_iupac && style === 'new') a.nameEn = c.name_iupac;
      return a;
    }).filter(Boolean);
    SEARCH_KEYS = null;
    listeners.forEach(function (f) { f(); });
  }
  function lib() { return LIB; }
  function onRebuild(f) { listeners.push(f); }
  function bySlug(s) { s = String(s || '').toLowerCase(); for (var i = 0; i < LIB.length; i++) if (LIB[i].slug === s) return LIB[i]; return null; }
  function findInLib(ascii) { for (var i = 0; i < LIB.length; i++) if (LIB[i].ascii === ascii) return LIB[i]; return null; }

  /* tên "chính" theo chế độ VI / IUPAC đang chọn */
  function mode() { return settings.nameMode === 'iupac' ? 'iupac' : 'vi'; }
  function modeLabel(m) { return (m || mode()) === 'iupac' ? 'IUPAC' : 'VI'; }
  function pName(a) { return mode() === 'iupac' ? a.nameEn : a.nameVi; }
  function pSpeak(a) { return mode() === 'iupac' ? a.speakEn : a.speakVi; }
  function pSteps(a) { return mode() === 'iupac' ? a.stepsEn : a.stepsVi; }
  function pLang() { return mode() === 'iupac' ? 'en' : 'vi'; }

  /* ---------- sơ đồ hình học (SVG) ---------- */
  var GEO_POS = {
    linear: [[25, 100], [175, 100]],
    trigonal: [[100, 28], [38, 136], [162, 136]],
    tetrahedral: [[100, 22], [36, 140], [150, 160], [148, 92, 1]],
    square: [[28, 100], [172, 100], [100, 28], [100, 172]],
    tbp: [[100, 20], [100, 180], [28, 118], [166, 126], [128, 78, 1]],
    octahedral: [[100, 20], [100, 180], [26, 112], [174, 88], [68, 140], [132, 60, 1]]
  };
  function geoSVG(geo, labels, metal) {
    var pos = GEO_POS[geo] || GEO_POS.octahedral, back = '', frontBonds = '', front = '', plane = '';
    if (geo === 'square') plane = '<polygon class="g-plane" points="28,100 100,28 172,100 100,172"/>';
    if (geo === 'octahedral') plane = '<polygon class="g-plane" points="26,112 68,140 174,88 132,60"/>';
    if (geo === 'tbp') plane = '<polygon class="g-plane" points="28,118 166,126 128,78"/>';
    pos.forEach(function (p, i) {
      var isBack = !!p[2], lab = labels[i] || '';
      var s = '<line class="g-bond' + (isBack ? ' back' : '') + '" x1="100" y1="100" x2="' + p[0] + '" y2="' + p[1] + '"/>';
      var c = '<circle class="g-lig' + (isBack ? ' back' : '') + '" cx="' + p[0] + '" cy="' + p[1] + '" r="17"/><text class="g-text" x="' + p[0] + '" y="' + (p[1] + 3) + '" text-anchor="middle">' + esc(lab) + '</text>';
      if (isBack) back = s + c + back; else { frontBonds += s; front += c; }
    });
    return '<svg viewBox="0 0 200 200" role="img" aria-label="Hình học ' + esc(Chem.GEO[geo].vi) + '">' + plane + back + frontBonds +
      '<circle class="g-metal" cx="100" cy="100" r="22"/><text class="g-mtext" x="100" y="104" text-anchor="middle">' + esc(metal) + '</text>' + front + '</svg>';
  }
  function ligandLabels(a) {
    var out = [];
    a.p.ligands.forEach(function (l) {
      var L = LIGANDS[l.key], lab = L.display.replace(/[⁺⁻⁰¹²³⁴⁵⁶⁷⁸⁹]/g, '');
      for (var i = 0; i < l.count; i++) for (var d = 0; d < L.dent; d++) out.push(lab);
    });
    return out;
  }

  /* ---------- hiển thị kết quả phân tích (dùng chung) ---------- */
  function speakBtn(text, lang, label, slow) {
    return '<button class="speak' + (slow ? ' slow' : '') + '" type="button" data-speak="' + esc(text) + '" data-lang="' + lang + '"' + (slow ? ' data-rate="0.7"' : '') +
      ' aria-label="' + label + '" title="' + label + '"><i data-lucide="' + (slow ? 'snail' : 'volume-2') + '"></i></button>';
  }
  // tên chính theo chế độ + nút loa (+ đọc chậm và phiên âm ở chế độ IUPAC)
  function nameBlock(a) {
    if (mode() === 'iupac') {
      return '<div class="res-name"><span class="grad-text">' + esc(a.nameEn) + '</span>' + speakBtn(a.speakEn, 'en', 'Nghe tên') + speakBtn(a.speakEn, 'en', 'Nghe chậm', true) + '</div>' +
        '<div class="res-phon"><i data-lucide="message-square-quote"></i><span>Phiên âm: <b>' + esc(a.phonetic) + '</b></span></div>';
    }
    return '<div class="res-name"><span class="grad-text">' + esc(a.nameVi) + '</span>' + speakBtn(a.speakVi, 'vi', 'Nghe tên') + '</div>';
  }
  // bảng so sánh song song tên VI – IUPAC của cùng một chất
  function renderCompare(a) {
    var p = a.p, vi = Chem.sortedLigands(p, 'vi'), row = function (label, v, e) { return '<tr><th>' + label + '</th><td>' + v + '</td><td>' + e + '</td></tr>'; };
    var ligRows = vi.map(function (l) {
      var L = LIGANDS[l.key], pv = L.paren ? Chem.PRE_PAREN[l.count] : Chem.PRE_VI[l.count], pe = L.paren ? Chem.PRE_PAREN[l.count] : ['', '', 'di', 'tri', 'tetra', 'penta', 'hexa'][l.count];
      return row('Phối tử ' + L.display, esc((pv || '') + Chem.ligName(L, 'vi')), esc((pe || '') + Chem.ligName(L, 'en')));
    }).join('');
    var M = METALS[p.metal], an = p.charge < 0;
    var orderVi = vi.map(function (l) { return Chem.ligName(LIGANDS[l.key], 'vi'); }).join(' → ');
    var orderEn = Chem.sortedLigands(p, 'en').map(function (l) { return Chem.ligName(LIGANDS[l.key], 'en'); }).join(' → ');
    return '<div class="compare"><div class="table-wrap"><table class="table cmp-table"><thead><tr><th></th><th class="cmp-vi">Tiếng Việt (SGK)</th><th class="cmp-iu">IUPAC</th></tr></thead><tbody>' +
      row('Tên đầy đủ', '<b>' + esc(a.nameVi) + '</b> ' + speakBtn(a.speakVi, 'vi', 'Nghe tên tiếng Việt'), '<b>' + esc(a.nameEn) + '</b> ' + speakBtn(a.speakEn, 'en', 'Nghe tên IUPAC')) +
      ligRows +
      (vi.length > 1 ? row('Thứ tự phối tử', orderVi, orderEn) : '') +
      row('Kim loại', esc(an ? M.at : M.vi) + (an ? ' <small class="muted">(gốc Latin + at)</small>' : ''), esc(an ? M.enAt : M.en) + (an ? ' <small class="muted">(đuôi -ate)</small>' : '')) +
      row('Số oxi hóa', '(' + a.osRoman + ')', '(' + a.osRoman + ')') +
      (p.outerCation || p.outerAnion ? row('Cầu ngoại', esc((p.outerCation || p.outerAnion).ion.vi), esc((p.outerCation || p.outerAnion).ion.en)) : '') +
      row('Cách viết', 'Có dấu cách trước tên kim loại tiếng Việt' + (p.charge ? '; chữ “ion” đứng trước' : ''), 'Viết liền, không dấu cách' + (p.charge ? '; chữ “ion” đứng sau' : '')) +
      '</tbody></table></div></div>';
  }
  function renderAnalysis(a, opts) {
    opts = opts || {};
    var libA = a.item ? a : findInLib(a.ascii), lib = libA && libA.item;
    var h = '<div class="result-card glass">';
    h += '<div class="res-top"><div>';
    h += '<div class="res-formula">' + a.formula + '</div>' + nameBlock(a);
    h += '<div class="badges">' +
      '<div class="badge"><small>Số oxi hóa</small><b>' + Chem.signed(a.os) + '</b></div>' +
      '<div class="badge"><small>Số phối trí</small><b>' + a.cn + '</b></div>' +
      '<div class="badge"><small>Loại phức</small><b>' + a.kindVi + '</b></div>' +
      '<div class="badge"><small>Hình học</small><b>' + a.geoVi + '</b></div></div>';
    h += '<div class="res-actions"><button class="btn btn-soft btn-sm" type="button" data-compare aria-expanded="false"><i data-lucide="columns-2"></i> So sánh VI – IUPAC</button>' +
      (opts.detailLink && libA ? '<a class="btn btn-ghost btn-sm" href="#/thu-vien/' + libA.slug + '"><i data-lucide="book-marked"></i> Trang chi tiết</a>' : '') + '</div>';
    h += '</div><div class="geo-box">' + geoSVG(a.geo, ligandLabels(a), a.p.metal) +
      '<div class="geo-cap">' + a.geoVi + ' <small>(' + a.geoEn + ', góc ' + a.angle + ')</small></div>' +
      (a.p.cn === 4 && !lib ? '<small class="muted center">Số phối trí 4: hình học dự đoán theo ion kim loại.</small>' : '') + '</div></div>';
    h += '<div class="compare-slot" hidden>' + renderCompare(a) + '</div>';
    if (a.warnings && a.warnings.length) h += '<div class="notice warn" style="margin-top:18px"><i data-lucide="triangle-alert"></i><div>' + a.warnings.map(esc).join('<br>') + '</div></div>';
    if (lib) {
      h += '<div class="res-note notice info"><span class="swatch" style="background:' + esc(lib.hex || '#ddd') + '"></span><div>' + (lib.aka ? '<b>Tên thường gọi:</b> ' + esc(lib.aka) + '<br>' : '') + '<b>Màu thực tế:</b> ' + esc(lib.color) +
        '<p><b>Ứng dụng / phản ứng:</b> ' + esc(lib.note) + '</p></div></div>';
    }
    h += '<ol class="steps">' + pSteps(a).map(function (s, i) {
      return '<li class="step" style="animation-delay:' + (i * 0.25) + 's"><span class="step-n">B' + (i + 1) + '</span><div class="step-body"><h4>Bước ' + (i + 1) + ': ' + s.title + '</h4>' + s.html + '</div></li>';
    }).join('') + '</ol>';
    return h + '</div>';
  }
  function renderError(a) {
    return '<div class="notice err"><i data-lucide="circle-x"></i><div><b>' + esc(a.error) + '</b>' + (a.hint ? '<p>' + esc(a.hint) + '</p>' : '') +
      '<p class="small">Mẹo: viết hoa chữ cái đầu kí hiệu nguyên tố (Cu, Cl), đặt cầu nội trong [ ], phối tử nhiều nguyên tử trong ( ), điện tích ghi sau dấu ] như 2+ hoặc 3-.</p></div></div>';
  }

  /* ---------- tìm theo tên (mờ) ---------- */
  var SEARCH_KEYS = null;
  function searchKeys() {
    if (SEARCH_KEYS) return SEARCH_KEYS;
    SEARCH_KEYS = LIB.map(function (a) {
      var keys = [Chem.normName(a.nameVi), Chem.normName(Chem.name(a.p, 'vi', { noIon: true })), Chem.normName(Chem.name(a.p, 'en', { noIon: true })), Chem.normName(a.speakVi), Chem.normName(a.ascii)];
      (a.item.aka || '').split(',').forEach(function (s) { if (s.trim()) keys.push(Chem.normName(s)); });
      return { a: a, keys: keys };
    });
    return SEARCH_KEYS;
  }
  function searchByName(q, limit) {
    var nq = Chem.normName(q); if (!nq) return [];
    return searchKeys().map(function (s) {
      var best = 0;
      s.keys.forEach(function (k) {
        var sim = Chem.similarity(nq, k);
        if (k.indexOf(nq) >= 0 && nq.length >= 4) sim = Math.max(sim, 0.7 + 0.3 * nq.length / k.length);
        if (sim > best) best = sim;
      });
      return { a: s.a, score: best };
    }).sort(function (x, y) { return y.score - x.score; }).slice(0, limit || 5);
  }

  // Đếm từ 0 lên đúng số "to" (số lấy từ dữ liệu, không ghi cứng). Luôn dừng ở đúng số cuối.
  function countUp(el, to) {
    if (!el) return;
    var start = performance.now(), dur = 700, done = false;
    function end() { if (!done) { done = true; el.textContent = to; } }
    setTimeout(end, dur + 200); // phòng khi tab ẩn, trình duyệt tạm dừng animation
    (function step(t) { if (done) return; var k = Math.min(1, (t - start) / dur); if (k >= 1) return end(); el.textContent = Math.floor(to * k); requestAnimationFrame(step); })(start);
  }
  function bestScore() {
    var best = Store.get(mkey('history'), []).reduce(function (m, h) { return Math.max(m, h.score); }, -1);
    return best < 0 ? null : String(Math.round(best * 10) / 10).replace('.', ',');
  }
  function knownCount() {
    var st = Store.get(mkey('fc'), {});
    return LIB.filter(function (a) { return st[a.ascii] && st[a.ascii].k; }).length;
  }

  /* nút loa dùng chung (ủy quyền sự kiện) */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-speak]');
    if (b) { Speech.speak(b.getAttribute('data-speak'), b.getAttribute('data-lang'), b, +b.getAttribute('data-rate') || 0); return; }
    var c = e.target.closest('[data-compare]');
    if (c) {
      var slot = c.closest('.result-card').querySelector('.compare-slot');
      slot.hidden = !slot.hidden; c.setAttribute('aria-expanded', String(!slot.hidden));
      c.classList.toggle('on', !slot.hidden);
    }
  });

  rebuild(); applyMode();

  return {
    $: $, $$: $$, esc: esc, Store: Store, icons: icons, teacherBox: teacherBox, toast: toast,
    getSetting: getSetting, setSetting: setSetting, mkey: mkey, modeLabel: modeLabel, pSpeak: pSpeak, pSteps: pSteps, renderCompare: renderCompare, speakBtn: speakBtn, theme: theme, setTheme: setTheme, isDark: isDark,
    lib: lib, onRebuild: onRebuild, bySlug: bySlug, findInLib: findInLib, slugOf: slugOf,
    mode: mode, pName: pName, pLang: pLang,
    renderAnalysis: renderAnalysis, renderError: renderError, geoSVG: geoSVG, searchByName: searchByName,
    countUp: countUp, bestScore: bestScore, knownCount: knownCount
  };
})();

/* =====================================================================
 * COMPLEX CHEMISTRY 12 – BỘ MÁY HÓA HỌC
 * Phân tích công thức phức chất → nguyên tử trung tâm, phối tử, số oxi hóa,
 * số phối trí, loại phức, hình học, và sinh tên tiếng Việt + IUPAC.
 * Dùng chung cho mọi mục trong web (gọi tên, thư viện, luyện tập...).
 * ===================================================================== */
var Chem = (function () {
  'use strict';

  /* ---------- tiện ích chuỗi ---------- */
  var SUB = '₀₁₂₃₄₅₆₇₈₉', SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
  function toSub(n) { return String(n).replace(/\d/g, function (d) { return SUB[d]; }); }
  function toSupCharge(c) {
    if (!c) return '';
    var a = Math.abs(c), s = c > 0 ? '⁺' : '⁻';
    return (a === 1 ? '' : String(a).replace(/\d/g, function (d) { return SUP[d]; })) + s;
  }
  function chargeText(c) { return c === 0 ? '0' : Math.abs(c) + (c > 0 ? '+' : '−'); }
  function signed(n) { return n > 0 ? '+' + n : n < 0 ? '−' + Math.abs(n) : '0'; }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  var ROMAN = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
  var NUM_VI = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám'];
  var NUM_EN = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'];
  var PRE_VI = ['', '', 'đi', 'tri', 'tetra', 'penta', 'hexa', 'hepta', 'octa'];
  var PRE_EN = ['', '', 'di', 'tri', 'tetra', 'penta', 'hexa', 'hepta', 'octa'];
  var PRE_PAREN = ['', '', 'bis', 'tris', 'tetrakis', 'pentakis', 'hexakis', 'heptakis', 'octakis'];

  var GEO = {
    linear:      { vi: 'Đường thẳng',          en: 'linear',               angle: '180°' },
    trigonal:    { vi: 'Tam giác phẳng',       en: 'trigonal planar',      angle: '120°' },
    tetrahedral: { vi: 'Tứ diện',              en: 'tetrahedral',          angle: '≈109,5°' },
    square:      { vi: 'Vuông phẳng',          en: 'square planar',        angle: '90°' },
    tbp:         { vi: 'Lưỡng chóp tam giác',  en: 'trigonal bipyramidal', angle: '90° và 120°' },
    octahedral:  { vi: 'Bát diện',             en: 'octahedral',           angle: '90°' }
  };
  var KIND_VI = { cation: 'Cation phức', anion: 'Anion phức', neutral: 'Phức trung hòa' };

  /* ---------- chuẩn hóa đầu vào ---------- */
  function normalizeInput(raw) {
    var s = String(raw || '');
    s = s.replace(/[₀-₉]/g, function (c) { return SUB.indexOf(c); })
         .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, function (c) { return SUP.indexOf(c); })
         .replace(/⁺/g, '+').replace(/[⁻−–—]/g, '-')
         .replace(/[{}^\s]/g, '')
         .replace(/[（]/g, '(').replace(/[）]/g, ')')
         .replace(/[【［]/g, '[').replace(/[】］]/g, ']');
    return s;
  }

  function ChemError(msg, hint) { this.message = msg; this.hint = hint || ''; }

  /* ---------- bảng tra phối tử (key + alias) ---------- */
  var LIG_LOOKUP = null;
  function ligLookup() {
    if (LIG_LOOKUP) return LIG_LOOKUP;
    LIG_LOOKUP = [];
    Object.keys(LIGANDS).forEach(function (k) {
      LIG_LOOKUP.push({ text: k, key: k });
      (LIGANDS[k].aliases || []).forEach(function (a) { LIG_LOOKUP.push({ text: a, key: k }); });
    });
    LIG_LOOKUP.sort(function (a, b) { return b.text.length - a.text.length; });
    return LIG_LOOKUP;
  }
  function resolveLigand(t) {
    t = t.replace(/[+-]\d*$/, '').replace(/\d*[+-]$/, '');
    var list = ligLookup();
    for (var i = 0; i < list.length; i++) if (list[i].text === t) return list[i].key;
    for (i = 0; i < list.length; i++) if (list[i].text.toLowerCase() === t.toLowerCase()) return list[i].key;
    return null;
  }
  function readCount(s, pos) {
    var m = /^\d+/.exec(s.slice(pos));
    return m ? { n: parseInt(m[0], 10), len: m[0].length } : { n: 1, len: 0 };
  }

  function parseLigands(str) {
    var out = [], pos = 0, list = ligLookup();
    while (pos < str.length) {
      var key = null, len = 0;
      if (str[pos] === '(') {
        var close = str.indexOf(')', pos);
        if (close < 0) throw new ChemError('Thiếu dấu ngoặc đóng “)” trong cầu nội.', 'Mỗi phối tử nhiều nguyên tử nên đặt trong ngoặc tròn, ví dụ (NH3)4, (CN)6.');
        var inside = str.slice(pos + 1, close);
        key = resolveLigand(inside);
        if (!key) throw new ChemError('Không nhận ra phối tử “' + inside + '”.', 'Các phối tử được hỗ trợ: ' + Object.keys(LIGANDS).join(', ') + '.');
        len = close - pos + 1;
      } else {
        for (var i = 0; i < list.length; i++) {
          if (str.substr(pos, list[i].text.length) === list[i].text) { key = list[i].key; len = list[i].text.length; break; }
        }
        if (!key) {
          var bad = str.slice(pos, pos + 4);
          throw new ChemError('Không nhận ra phối tử bắt đầu bằng “' + bad + '”.', 'Kiểm tra chữ hoa/thường (Cl, không phải CL) và đặt phối tử nhiều nguyên tử trong ngoặc tròn: (NH3), (H2O), (CN)...');
        }
      }
      pos += len;
      var c = readCount(str, pos); pos += c.len;
      if (c.n < 1 || c.n > 8) throw new ChemError('Số lượng phối tử ' + c.n + ' không hợp lệ.', 'Mỗi loại phối tử thường có từ 1 đến 6.');
      var ex = out.filter(function (o) { return o.key === key; })[0];
      if (ex) ex.count += c.n; else out.push({ key: key, count: c.n });
    }
    return out;
  }

  function parseOuter(str, table, label) {
    var key = null, pos = 0, keys = Object.keys(table).sort(function (a, b) { return b.length - a.length; });
    if (str[0] === '(') {
      var close = str.indexOf(')');
      if (close < 0) throw new ChemError('Thiếu dấu “)” ở ' + label + '.');
      var inside = str.slice(1, close);
      key = keys.filter(function (k) { return k === inside; })[0] || null;
      pos = close + 1;
    } else {
      for (var i = 0; i < keys.length; i++) if (str.indexOf(keys[i]) === 0) { key = keys[i]; pos = keys[i].length; break; }
    }
    if (!key) throw new ChemError('Không nhận ra ion “' + str + '” ở ' + label + '.', 'Ion cầu ngoại hỗ trợ: ' + keys.join(', ') + '.');
    var c = readCount(str, pos);
    if (pos + c.len !== str.length) throw new ChemError('Phần “' + str + '” ở ' + label + ' viết chưa đúng.', 'Ví dụ đúng: K3[Fe(CN)6], [Cu(NH3)4]SO4, [Co(NH3)6]Cl3.');
    return { key: key, count: c.n, ion: table[key] };
  }

  /* ---------- PHÂN TÍCH CÔNG THỨC ---------- */
  function parse(raw) {
    var warnings = [];
    var s = normalizeInput(raw);
    if (!s) throw new ChemError('Bạn chưa nhập công thức.', 'Thử một ví dụ: [Cu(NH3)4]2+');
    var dot = s.search(/[·.*]/);
    if (dot > 0) { warnings.push('Đã bỏ qua phần nước kết tinh “' + s.slice(dot + 1) + '”.'); s = s.slice(0, dot); }
    var nOpen = (s.match(/\[/g) || []).length, nClose = (s.match(/\]/g) || []).length;
    if (nOpen === 0) throw new ChemError('Thiếu dấu ngoặc vuông [ ] bao quanh cầu nội.', 'Ví dụ: viết [Cu(NH3)4]2+ thay vì Cu(NH3)4 2+.');
    if (nOpen !== nClose) throw new ChemError('Số dấu “[” và “]” không khớp nhau.', 'Mỗi cầu nội cần đúng một cặp [ ].');
    if (nOpen > 1) throw new ChemError('Web hiện chỉ phân tích hợp chất có MỘT ion phức.', 'Ví dụ muối Magnus [Pt(NH3)4][PtCl4] gồm hai ion phức – hãy phân tích riêng từng ion.');
    var open = s.indexOf('['), close = s.indexOf(']');
    if (close < open) throw new ChemError('Dấu “]” đứng trước dấu “[”.');
    var prefix = s.slice(0, open), inner = s.slice(open + 1, close), suffix = s.slice(close + 1);
    if (!inner) throw new ChemError('Cầu nội đang trống.', 'Viết kim loại trung tâm và phối tử trong [ ], ví dụ [Ag(NH3)2]+.');

    // nguyên tử trung tâm
    var metal = null, m2 = inner.slice(0, 2), m1 = inner.slice(0, 1);
    if (/^[A-Z][a-z]$/.test(m2) && METALS[m2]) metal = m2;
    else if (/^[A-Z]$/.test(m1) && METALS[m1] && !/^[a-z]/.test(inner[1] || '')) metal = m1;
    if (!metal) {
      var guess = (/^[A-Z][a-z]?/.exec(inner) || [inner.slice(0, 2)])[0];
      if (/^[a-z]/.test(inner)) throw new ChemError('Kí hiệu kim loại phải viết hoa chữ cái đầu (“' + inner.slice(0, 2) + '”).', 'Ví dụ: Cu, Fe, Ag – không viết cu, fe, ag.');
      throw new ChemError('Chưa nhận ra nguyên tử trung tâm “' + guess + '”.', 'Đặt kim loại ngay sau dấu “[”. Kim loại được hỗ trợ: ' + Object.keys(METALS).join(', ') + '.');
    }
    var ligRest = inner.slice(metal.length);
    if (!ligRest) throw new ChemError('Không tìm thấy phối tử nào trong cầu nội.', 'Ví dụ: [Cu(NH3)4]2+ có 4 phối tử NH3.');
    var ligands = parseLigands(ligRest);

    // cầu ngoại & điện tích
    var outerCation = null, outerAnion = null, charge = 0, chargeGiven = false;
    if (prefix) outerCation = parseOuter(prefix, OUTER_CATIONS, 'cầu ngoại (trước dấu [ )');
    if (suffix) {
      var cm = /^(\d*)([+-])$/.exec(suffix) || /^([+-])(\d*)$/.exec(suffix);
      if (cm) {
        var both = cm[1] + cm[2], digits = both.replace(/\D/g, ''), sign = both.replace(/[^+-]/g, '');
        charge = (digits ? parseInt(digits, 10) : 1) * (sign === '+' ? 1 : -1);
        chargeGiven = true;
      } else {
        outerAnion = parseOuter(suffix, OUTER_ANIONS, 'cầu ngoại (sau dấu ] )');
      }
    }
    if (outerCation && outerAnion) throw new ChemError('Hợp chất có ion ở cả hai phía cầu nội – web chưa hỗ trợ dạng này.');
    if (outerCation) {
      var cc = -outerCation.ion.charge * outerCation.count;
      if (chargeGiven && charge !== cc) throw new ChemError('Điện tích ghi sau dấu ] không khớp với cầu ngoại.', 'Với muối, không cần ghi điện tích; ví dụ K3[Fe(CN)6].');
      charge = cc; chargeGiven = false;
    }
    if (outerAnion) charge = -outerAnion.ion.charge * outerAnion.count;

    var ligSum = ligands.reduce(function (a, l) { return a + LIGANDS[l.key].charge * l.count; }, 0);
    var os = charge - ligSum;
    var cn = ligands.reduce(function (a, l) { return a + LIGANDS[l.key].dent * l.count; }, 0);
    var M = METALS[metal];
    var suggest = M.os.map(function (o) { var c = o + ligSum; return (c === 0 ? 'trung hòa (không ghi điện tích)' : 'điện tích ' + chargeText(c)) + ' nếu ' + metal + ' có số oxi hóa ' + signed(o); }).join('; ');
    if (os < 0 || os > 8) {
      throw new ChemError('Số oxi hóa của ' + metal + ' tính được là ' + signed(os) + ' – không hợp lý.', 'Kiểm tra lại điện tích hoặc cầu ngoại. Với các phối tử này: ' + suggest + '.');
    } else if (M.os.indexOf(os) < 0) {
      var w = metal + ' hiếm khi có số oxi hóa ' + signed(os) + ' trong phức (thường gặp: ' + M.os.map(signed).join(', ') + ').';
      if (!outerCation && !outerAnion && !chargeGiven) w += ' Nếu đây là ion, hãy ghi điện tích sau dấu ]: ' + suggest + '.';
      warnings.push(w);
    }
    if (cn > 8) warnings.push('Số phối trí ' + cn + ' quá lớn so với các phức thường gặp (2, 4, 6).');

    return {
      input: raw, metal: metal, ligands: ligands, charge: charge, os: os, cn: cn,
      outerCation: outerCation, outerAnion: outerAnion, chargeGiven: chargeGiven,
      kind: charge > 0 ? 'cation' : charge < 0 ? 'anion' : 'neutral', warnings: warnings
    };
  }

  /* ---------- công thức hiển thị ---------- */
  var MONO = { F: 1, Cl: 1, Br: 1, I: 1 };
  function ligFormula(key, count, ascii) {
    var f = key === 'en' ? 'en' : key;
    var body = MONO[key] ? f : '(' + f + ')';
    if (MONO[key] && count === 1) body = f;
    return ascii ? body + (count > 1 ? count : '') : body.replace(/\d/g, toSub) + (count > 1 ? toSub(count) : '');
  }
  function ionFormula(o, ascii) {
    var k = o.key, poly = /[A-Z].*[A-Z]|\d/.test(k) && o.count > 1;
    var base = ascii ? k : k.replace(/\d/g, toSub);
    if (poly) base = '(' + base + ')';
    return base + (o.count > 1 ? (ascii ? o.count : toSub(o.count)) : '');
  }
  function formula(p, ascii) {
    var core = '[' + p.metal + p.ligands.map(function (l) { return ligFormula(l.key, l.count, ascii); }).join('') + ']';
    var out = '';
    if (p.outerCation) out += ionFormula(p.outerCation, ascii);
    out += core;
    if (p.outerAnion) out += ionFormula(p.outerAnion, ascii);
    if (!p.outerCation && !p.outerAnion && p.charge) {
      out += ascii ? (Math.abs(p.charge) === 1 ? '' : Math.abs(p.charge)) + (p.charge > 0 ? '+' : '-') : toSupCharge(p.charge);
    }
    return out;
  }
  function complexIonFormula(p) {
    var core = '[' + p.metal + p.ligands.map(function (l) { return ligFormula(l.key, l.count, false); }).join('') + ']';
    return core + toSupCharge(p.charge);
  }

  /* ---------- GỌI TÊN ---------- */
  // Kiểu tên phối tử IUPAC: 'new' (chlorido, cyanido – mặc định) hoặc 'old' (chloro, cyano)
  var LIG_STYLE = 'new';
  function setLigandStyle(s) { LIG_STYLE = s === 'old' ? 'old' : 'new'; }
  function ligName(L, lang) { return lang === 'vi' ? L.vi : (LIG_STYLE === 'old' && L.enOld) || L.en; }
  function sortedLigands(p, lang) {
    return p.ligands.slice().sort(function (a, b) {
      return ligName(LIGANDS[a.key], lang).localeCompare(ligName(LIGANDS[b.key], lang), lang === 'vi' ? 'vi' : 'en');
    });
  }

  // trả về mảng "phần tên": {t: chữ hiển thị, s: chữ để đọc, k: loại, sp: có dấu cách trước không}
  function complexParts(p, lang, order) {
    var vi = lang === 'vi', parts = [], M = METALS[p.metal];
    var groups = order || sortedLigands(p, lang);
    groups.forEach(function (g) {
      var L = LIGANDS[g.key], name = ligName(L, lang);
      var pre = L.paren ? PRE_PAREN[g.count] : (vi ? PRE_VI : PRE_EN)[g.count];
      if (pre) parts.push({ t: pre, k: 'prefix', lig: g.key });
      parts.push({ t: L.paren ? '(' + name + ')' : name, s: name, k: 'ligand', lig: g.key });
    });
    var anion = p.charge < 0;
    var mName = vi ? (anion ? M.at : M.vi) : (anion ? M.enAt : M.en);
    parts.push({ t: mName, k: 'metal', sp: vi && !anion });
    parts.push({ t: '(' + ROMAN[p.os] + ')', s: (vi ? NUM_VI : NUM_EN)[p.os], k: 'os' });
    // nối phối tử có gạch (nitrito-N) với phần sau bằng dấu "-"
    parts.forEach(function (pt, i) { if (/-N$/.test(pt.t) && parts[i + 1] && parts[i + 1].k !== 'os') pt.t += '-'; });
    return parts;
  }
  function nameParts(p, lang, opts) {
    opts = opts || {};
    var vi = lang === 'vi', parts = complexParts(p, lang, opts.order);
    if (p.outerCation) {
      parts.unshift({ t: p.outerCation.ion[vi ? 'vi' : 'en'], k: 'outer' });
      parts[1].sp = true;
    } else if (p.outerAnion) {
      parts.push({ t: p.outerAnion.ion[vi ? 'vi' : 'en'], k: 'outer', sp: true });
    } else if (p.charge !== 0 && !opts.noIon) {
      if (vi) { parts.unshift({ t: 'ion', k: 'ion' }); parts[1].sp = true; }
      else parts.push({ t: 'ion', k: 'ion', sp: true });
    }
    return parts;
  }
  function joinParts(parts) {
    return parts.map(function (pt, i) { return (i > 0 && pt.sp ? ' ' : '') + pt.t; }).join('');
  }
  function speakText(parts) { return parts.map(function (pt) { return pt.s || pt.t.replace(/[()]/g, ''); }).join(' '); }
  function name(p, lang, opts) { return joinParts(nameParts(p, lang, opts)); }

  /* ---------- hình học ---------- */
  function geometry(p, override) {
    if (override && GEO[override]) return override;
    var cn = p.cn, m = p.metal, keys = p.ligands.map(function (l) { return l.key; });
    if (cn === 2) return 'linear';
    if (cn === 3) return 'trigonal';
    if (cn === 4) {
      if (m === 'Pt' || m === 'Pd' || (m === 'Au' && p.os === 3)) return 'square';
      if (m === 'Ni' && p.os === 2 && keys.every(function (k) { return k === 'CN'; })) return 'square';
      if (m === 'Cu' && p.os === 2 && !keys.some(function (k) { return MONO[k]; })) return 'square';
      return 'tetrahedral';
    }
    if (cn === 5) return 'tbp';
    return 'octahedral';
  }

  /* ---------- các bước giải thích (luôn bằng tiếng Việt; lang chỉ đổi phần TÊN) ---------- */
  function prefixOf(L, count, lang) { return L.paren ? PRE_PAREN[count] : (lang === 'vi' ? PRE_VI : PRE_EN)[count]; }
  function steps(p, lang) {
    lang = lang === 'en' ? 'en' : 'vi';
    var vi = lang === 'vi', M = METALS[p.metal], out = [];
    var ionF = complexIonFormula(p), mPlain = vi ? M.vi : M.en;
    // B1
    out.push({
      title: 'Xác định nguyên tử trung tâm',
      html: 'Kim loại đứng đầu trong cầu nội <b class="f">' + ionF + '</b> là <b>' + p.metal + '</b> (' + (vi ? M.vi : M.en + ' – ' + M.vi) + ').' +
        (p.outerCation || p.outerAnion ? ' Phần nằm ngoài dấu [ ] là <b>cầu ngoại</b> (' +
          (p.outerCation ? p.outerCation.count + ' ' + p.outerCation.ion.display : p.outerAnion.count + ' ' + p.outerAnion.ion.display) +
          ') – không phải phối tử.' : '')
    });
    // B2
    var rows = p.ligands.map(function (l) {
      var L = LIGANDS[l.key], n = ligName(L, lang), pre = prefixOf(L, l.count, lang);
      var kind = L.charge === 0 ? 'phân tử' : 'ion';
      return '<li>Có ' + l.count + ' ' + kind + ' <b class="f">' + L.display + '</b>, tên phối tử là <i>' + n + '</i>' +
        (pre ? ', tiền tố <i>' + pre + '</i> → <b>' + pre + (L.paren ? '(' + n + ')' : n) + '</b>' : '') +
        ' (' + (L.charge === 0 ? 'trung hòa' : 'điện tích ' + signed(L.charge)) + (L.dent > 1 ? ', phối tử ' + L.dent + ' càng' : '') + ').</li>';
    }).join('');
    var cnCalc = p.ligands.map(function (l) { return LIGANDS[l.key].dent > 1 ? l.count + '×' + LIGANDS[l.key].dent : l.count; }).join(' + ');
    out.push({ title: 'Xác định phối tử và số lượng', html: '<ul>' + rows + '</ul>Số phối trí = ' + (cnCalc === String(p.cn) ? '' : cnCalc + ' = ') + '<b>' + p.cn + '</b>.' });
    // B3
    var calc, chargeSrc;
    if (p.outerCation) chargeSrc = 'Cầu ngoại có ' + p.outerCation.count + ' ion ' + p.outerCation.ion.display + ' (tổng ' + signed(p.outerCation.ion.charge * p.outerCation.count) + ') nên điện tích ion phức = <b>' + signed(p.charge) + '</b>.';
    else if (p.outerAnion) chargeSrc = 'Cầu ngoại có ' + p.outerAnion.count + ' ion ' + p.outerAnion.ion.display + ' (tổng ' + signed(p.outerAnion.ion.charge * p.outerAnion.count) + ') nên điện tích ion phức = <b>' + signed(p.charge) + '</b>.';
    else chargeSrc = p.charge === 0 ? 'Không có điện tích ghi kèm → phức trung hòa, điện tích = <b>0</b>.' : 'Điện tích ghi kèm của ion phức = <b>' + signed(p.charge) + '</b>.';
    var terms = p.ligands.map(function (l) {
      var c = LIGANDS[l.key].charge;
      return ' + ' + l.count + '×(' + signed(c) + ')';
    }).join('');
    calc = '<div class="calc">x' + terms + ' = ' + signed(p.charge) + '  ⟹  <b>x = ' + signed(p.os) + '</b></div>';
    out.push({ title: 'Tính số oxi hóa của ' + p.metal, html: chargeSrc + ' Gọi x là số oxi hóa của ' + p.metal + ':' + calc + 'Viết bằng số La Mã trong ngoặc: <b>(' + ROMAN[p.os] + ')</b>.' });
    // B4
    var kindHtml;
    if (vi) kindHtml = p.kind === 'cation' ? 'Ion phức mang điện tích dương → <b>cation phức</b>: tên kim loại giữ nguyên tiếng Việt (<i>' + M.vi + '</i>).'
      : p.kind === 'anion' ? 'Ion phức mang điện tích âm → <b>anion phức</b>: dùng gốc Latin của kim loại + đuôi “at” (<i>' + M.at + '</i>).'
      : 'Điện tích bằng 0 → <b>phức trung hòa</b>: tên kim loại giữ nguyên (<i>' + M.vi + '</i>), không có chữ “ion”.';
    var ionTxt = (p.outerCation || p.outerAnion) ? '.' : ', cuối tên thêm chữ “ion”.';
    if (!vi) kindHtml = p.kind === 'cation' ? 'Ion phức mang điện tích dương → <b>cation phức</b>: dùng tên tiếng Anh của kim loại (<i>' + M.en + '</i>)' + ionTxt
      : p.kind === 'anion' ? 'Ion phức mang điện tích âm → <b>anion phức</b>: tên kim loại đổi sang đuôi <b>-ate</b> (<i>' + M.en + '</i> → <i>' + M.enAt + '</i>)' + ionTxt
      : 'Điện tích bằng 0 → <b>phức trung hòa</b>: dùng tên tiếng Anh của kim loại (<i>' + M.en + '</i>), không có chữ “ion”.';
    out.push({ title: 'Xác định loại phức', html: kindHtml });
    // B5
    var sorted = sortedLigands(p, lang);
    var orderTxt = sorted.length > 1 ? 'Xếp phối tử theo thứ tự chữ cái ' + (vi ? '' : 'tiếng Anh ') + 'của tên (không tính tiền tố): ' + sorted.map(function (l) { return '<i>' + ligName(LIGANDS[l.key], lang) + '</i>'; }).join(' → ') + '. ' : '';
    var pieces = nameParts(p, lang).map(function (pt) { return '<span class="np np-' + pt.k + '">' + esc(pt.t) + '</span>'; }).join('<span class="np-plus">+</span>');
    var how = vi ? 'Ghép: (tiền tố + tên phối tử) + tên kim loại + (số oxi hóa)' : 'Ghép <b>viết liền, không có dấu cách</b>: (tiền tố + tên phối tử) + tên kim loại + (số oxi hóa)';
    out.push({ title: 'Ghép tên', html: orderTxt + how + (p.outerCation ? ', cation cầu ngoại đọc trước' : p.outerAnion ? ', anion cầu ngoại đọc sau' : '') + ':<div class="pieces">' + pieces + '</div>' });
    return out;
  }

  /* ---------- phiên âm kiểu Việt cho tên tiếng Anh ---------- */
  function phonetic(parts) {
    var P = (typeof PHONETIC !== 'undefined') ? PHONETIC : {};
    return parts.map(function (pt) {
      var w = (pt.s || pt.t).replace(/[()]/g, '');
      return P[w] || P[w.toLowerCase()] || w;
    }).join(' · ');
  }

  /* ---------- hàm tổng hợp ---------- */
  function analyze(raw, geoOverride) {
    try {
      var p = parse(raw);
      var g = geometry(p, geoOverride);
      var partsVi = nameParts(p, 'vi'), partsEn = nameParts(p, 'en');
      return {
        ok: true, p: p,
        formula: formula(p), ascii: formula(p, true), ionFormula: complexIonFormula(p),
        nameVi: joinParts(partsVi), nameEn: joinParts(partsEn),
        partsVi: partsVi, partsEn: partsEn,
        speakVi: speakText(partsVi), speakEn: speakText(partsEn), phonetic: phonetic(partsEn),
        os: p.os, osRoman: ROMAN[p.os], cn: p.cn, kind: p.kind, kindVi: KIND_VI[p.kind],
        geo: g, geoVi: GEO[g].vi, geoEn: GEO[g].en, angle: GEO[g].angle,
        stepsVi: steps(p, 'vi'), stepsEn: steps(p, 'en'), warnings: p.warnings
      };
    } catch (e) {
      if (e instanceof ChemError) return { ok: false, error: e.message, hint: e.hint };
      return { ok: false, error: 'Không phân tích được công thức này.', hint: String(e && e.message || e) };
    }
  }

  /* ---------- so khớp mờ (fuzzy) ---------- */
  function deaccent(s) {
    return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');
  }
  var ROMAN_MAP = { viii: 8, vii: 7, vi: 6, iv: 4, v: 5, iii: 3, ii: 2, i: 1, 0: 0 };
  var WORD_NUM = { khong: 0, mot: 1, hai: 2, ba: 3, bon: 4, nam: 5, sau: 6, zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6 };
  function normName(s) {
    var t = deaccent(s).replace(/\(\s*(viii|vii|vi|iv|v|iii|ii|i|0)\s*\)/g, function (_, r) { return ' ' + ROMAN_MAP[r] + ' '; });
    t = t.replace(/\b(ion)\b/g, ' ');
    t = t.replace(/\b(khong|mot|hai|ba|bon|nam|sau|zero|one|two|three|four|five|six)\b\s*$/g, function (w) { return WORD_NUM[w.trim()]; });
    t = t.replace(/[^a-z0-9]/g, '').replace(/([a-z])\1+/g, '$1');
    return t;
  }
  function lev(a, b) {
    if (a === b) return 0;
    var m = a.length, n = b.length; if (!m) return n; if (!n) return m;
    var prev = new Array(n + 1), cur = new Array(n + 1), i, j;
    for (j = 0; j <= n; j++) prev[j] = j;
    for (i = 1; i <= m; i++) {
      cur[0] = i;
      for (j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      var t = prev; prev = cur; cur = t;
    }
    return prev[n];
  }
  function similarity(a, b) {
    if (!a && !b) return 1; if (!a || !b) return 0;
    return 1 - lev(a, b) / Math.max(a.length, b.length);
  }

  return {
    parse: parse, analyze: analyze, name: name, nameParts: nameParts, joinParts: joinParts, formula: formula,
    complexIonFormula: complexIonFormula, sortedLigands: sortedLigands, geometry: geometry,
    normalizeInput: normalizeInput, setLigandStyle: setLigandStyle, ligName: ligName, phonetic: phonetic, steps: steps, normName: normName, deaccent: deaccent, similarity: similarity, lev: lev,
    toSub: toSub, toSupCharge: toSupCharge, signed: signed, chargeText: chargeText, esc: esc,
    ROMAN: ROMAN, GEO: GEO, KIND_VI: KIND_VI, PRE_VI: PRE_VI, PRE_PAREN: PRE_PAREN
  };
})();
if (typeof module !== 'undefined') module.exports = Chem;

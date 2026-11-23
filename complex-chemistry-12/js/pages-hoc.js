/* =====================================================================
 * CÁC TRANG HỌC: Trang chủ, Gọi tên, Tra cứu ngược, Thư viện,
 * Chi tiết phức chất, Hướng dẫn (danh sách bài + từng bài).
 * ===================================================================== */
var Pages = window.Pages || {};
(function () {
  'use strict';
  var $ = App.$, $$ = App.$$, esc = App.esc, R = Router;

  /* ================= TRANG CHỦ ================= */
  // Mọi con số (số phức chất, số câu hỏi, số bài) đều đếm từ dữ liệu, không ghi cứng.
  function mainFeatures() {
    return [
      ['/goi-ten', 'spell-check', 'Gọi tên phức chất', 'Nhập công thức, web gọi tên và giải thích theo 5 bước.'],
      ['/luyen-tap', 'target', 'Luyện tập', Quiz.BANK.length + ' câu hỏi thuộc ' + Quiz.TYPES.length + ' dạng, chia 3 mức độ, có lời giải.'],
      ['/de-kiem-tra', 'file-text', 'Đề kiểm tra AI', 'Đề 3 phần theo cấu trúc thi tốt nghiệp THPT từ 2025. Mỗi lần tạo là một đề khác.'],
      ['/huong-dan', 'book-open', 'Hướng dẫn', LESSONS.length + ' bài lý thuyết ngắn, có bảng tra phối tử và các lỗi hay gặp.']
    ];
  }
  function moreFeatures() {
    return [
      ['/bai-tap', 'Bài tập', BAITAP.reduce(function (n, b) { return n + b.parts.reduce(function (k, p) { return k + p.items.length; }, 0); }, 0) + ' câu theo cấu trúc đề tốt nghiệp THPT, có đáp án và lời giải.'],
      ['/tra-cuu', 'Tra cứu ngược', 'Gõ hoặc nói tên để tìm công thức, gõ thiếu dấu vẫn tìm được.'],
      ['/phat-am', 'Luyện phát âm', 'Đọc tên vào micro, web chấm từng âm tiết (cần Chrome hoặc Edge).'],
      ['/flashcard', 'Flashcard', 'Thẻ công thức – tên gọi; thẻ chưa thuộc được hỏi lại nhiều hơn.'],
      ['/thu-vien', 'Thư viện', App.lib().length + ' phức chất kèm màu sắc và ứng dụng.'],
      ['/gioi-thieu', 'Giới thiệu', 'Ai làm web này, làm để làm gì và dùng tài liệu nào.'],
      ['/lien-he', 'Liên hệ & báo lỗi', 'Thấy chỗ nào sai thì báo cho mình ở đây.']
    ];
  }
  R.add('/', function () {
    var iu = App.mode() === 'iupac', best = App.bestScore(), known = App.knownCount(), C = SITE_CONFIG;
    return {
      cls: 'home',
      html:
        '<div class="home-top"><p class="kicker">Hóa học 12 · Chương trình GDPT 2018</p>' +
        '<h1 tabindex="-1">Học gọi tên phức chất theo SGK Hóa học 12</h1>' +
        '<p class="lead">Nhập một công thức như <code>[Cu(NH3)4]SO4</code>, web sẽ gọi tên và giải thích từng bước: phối tử, số oxi hóa, loại phức, cách ghép tên. Học xong có thể làm bài luyện tập hoặc một đề kiểm tra để tự đánh giá.</p>' +
        '<div class="mode-pick"><span class="small muted">Tên gọi theo:</span><div class="seg" id="modeSeg">' +
        '<label><input type="radio" name="mode" value="vi"' + (iu ? '' : ' checked') + '><span>Tiếng Việt (SGK)</span></label>' +
        '<label><input type="radio" name="mode" value="iupac"' + (iu ? ' checked' : '') + '><span>IUPAC (tiếng Anh)</span></label></div></div>' +
        '<div class="hero-cta"><a href="#/goi-ten" class="btn btn-primary">Gọi tên một phức chất</a>' +
        '<a href="#/de-kiem-tra" class="btn">Làm đề kiểm tra</a></div>' + App.teacherBox() + '</div>' +
        '<div class="stats">' +
        '<div class="stat"><b id="stC">0</b><span>phức chất trong thư viện</span></div>' +
        '<div class="stat"><b id="stQ">0</b><span>câu hỏi luyện tập</span></div>' +
        // hai ô dưới chỉ hiện khi bạn đã có dữ liệu học
        (best != null ? '<div class="stat"><b>' + best + '</b><span>điểm luyện tập cao nhất của bạn</span></div>' : '') +
        (known > 0 ? '<div class="stat"><b>' + known + '</b><span>thẻ đã thuộc</span></div>' : '') +
        '</div>' +
        '<h2 class="home-h2">Phần chính</h2>' +
        '<div class="feature-grid">' + mainFeatures().map(function (f) {
          return '<a class="feature" href="#' + f[0] + '"><h3><i data-lucide="' + f[1] + '"></i> ' + f[2] + '</h3><p>' + f[3] + '</p></a>';
        }).join('') + '</div>' +
        '<h2 class="home-h2">Các phần khác</h2>' +
        '<ul class="more-list">' + moreFeatures().map(function (f) {
          return '<li><a href="#' + f[0] + '"><b>' + f[1] + '</b><span>' + f[2] + '</span></a></li>';
        }).join('') + '</ul>' +
        '<div class="about-box"><p><b>Về web này.</b> Nội dung bám theo SGK Hóa học 12; phần tên tiếng Anh theo IUPAC Red Book 2005.</p>' +
        '<p><a href="#/gioi-thieu">Xem trang Giới thiệu</a> · Phiên bản ' + esc(C.version) + ', cập nhật ' + esc(C.updated) + '.</p></div>',
      mount: function (el) {
        App.countUp($('#stC', el), App.lib().length);
        App.countUp($('#stQ', el), Quiz.BANK.length);
        $('#modeSeg', el).addEventListener('change', function (e) {
          App.setSetting('nameMode', e.target.value);
          App.toast(e.target.value === 'iupac' ? 'Đã chuyển sang tên IUPAC (tiếng Anh).' : 'Đã chuyển sang tên tiếng Việt theo SGK.', 'languages');
        });
      }
    };
  });

  /* ================= GỌI TÊN ================= */
  var EXAMPLES = ['[Cu(NH3)4]2+', 'K3[Fe(CN)6]', '[Pt(NH3)2Cl2]', 'K4[Fe(CN)6]', '[Cu(NH3)4]SO4', '[Co(NH3)5Cl]Cl2', '[Ag(NH3)2]+', 'Na[Al(OH)4]', '[Ni(CO)4]', '[Co(en)3]Cl3', '[Fe(H2O)5(SCN)]2+', 'Na3[Ag(S2O3)2]'];
  R.add('/goi-ten', function (params, query) {
    return {
      title: 'Gọi tên phức chất',
      head: { title: 'Gọi tên phức chất', icon: 'spell-check', color: 'c1', crumbs: [{ label: 'Gọi tên', href: '/goi-ten' }],
        sub: 'Nhập công thức (gõ số bình thường, web tự chuyển thành chỉ số). Ví dụ <code>[Cu(NH3)4]2+</code>, <code>K3[Fe(CN)6]</code>, <code>[Pt(NH3)2Cl2]</code>.' },
      html:
        '<div class="card glass">' +
        '<form class="input-row" id="nameForm" autocomplete="off"><label class="sr-only" for="formulaInput">Công thức phức chất</label>' +
        '<div class="input-wrap"><i data-lucide="flask-conical"></i><input id="formulaInput" class="input input-lg mono" placeholder="Ví dụ: [Co(NH3)5Cl]Cl2" spellcheck="false" autocapitalize="off"></div>' +
        '<button class="btn btn-primary btn-lg" type="submit">Gọi tên</button></form>' +
        '<div class="live-preview" id="formulaPreview" aria-live="polite"></div>' +
        '<div class="chips"><span class="chips-label">Ví dụ mẫu:</span>' + EXAMPLES.map(function (e) {
          var a = Chem.analyze(e); return '<button type="button" class="chip" data-f="' + esc(e) + '">' + (a.ok ? a.formula : esc(e)) + '</button>';
        }).join('') + '</div></div>' +
        '<div id="nameResult" class="result-area" aria-live="polite"></div>',
      mount: function (el) {
        var inp = $('#formulaInput', el), prev = $('#formulaPreview', el), box = $('#nameResult', el);
        function preview() {
          var v = inp.value.trim(), a = v ? Chem.analyze(v) : null;
          prev.innerHTML = !v ? '' : 'Xem trước: <b>' + (a.ok ? a.formula : esc(Chem.normalizeInput(v))) + '</b>';
        }
        function show(v) {
          var a = Chem.analyze(v);
          box.innerHTML = a.ok ? App.renderAnalysis(a, { detailLink: true }) : App.renderError(a);
          App.icons(); R.setQuery('/goi-ten', { f: v });
        }
        inp.addEventListener('input', preview);
        $('#nameForm', el).addEventListener('submit', function (e) { e.preventDefault(); show(inp.value); box.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
        $('.chips', el).addEventListener('click', function (e) {
          var b = e.target.closest('.chip'); if (!b) return;
          inp.value = b.getAttribute('data-f'); preview(); show(inp.value); box.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
        if (query.f) { inp.value = query.f; preview(); show(query.f); }
      }
    };
  });

  /* ================= TRA CỨU NGƯỢC ================= */
  R.add('/tra-cuu', function (params, query) {
    return {
      title: 'Tra cứu ngược',
      head: { title: 'Tra cứu ngược: tên → công thức', icon: 'arrow-right-left', color: 'c2', crumbs: [{ label: 'Tra cứu ngược', href: '/tra-cuu' }],
        sub: 'Gõ tên (có dấu hay không đều được) hoặc bấm micro để nói. Ví dụ: <i>“tetra amin dong 2”</i>, <i>“kali hexaxianoferat 3”</i>, <i>“cisplatin”</i>.' },
      html:
        '<div class="card glass"><form class="input-row" id="reverseForm" autocomplete="off"><label class="sr-only" for="reverseInput">Tên phức chất</label>' +
        '<div class="input-wrap"><i data-lucide="search"></i><input id="reverseInput" class="input input-lg" placeholder="Nhập tên phức chất…" spellcheck="false"></div>' +
        '<button class="btn btn-icon btn-soft btn-lg" type="button" id="reverseMic" aria-label="Nói tên bằng micro" title="Nói bằng micro"><i data-lucide="mic"></i></button>' +
        '<button class="btn btn-primary btn-lg" type="submit"><i data-lucide="search"></i> Tìm</button></form>' +
        '<p class="muted small" id="reverseStatus"></p><div id="reverseList" class="match-list"></div></div>' +
        '<div id="reverseResult" class="result-area" aria-live="polite"></div>',
      mount: function (el) {
        var inp = $('#reverseInput', el), list = $('#reverseList', el), status = $('#reverseStatus', el), res = $('#reverseResult', el), mic = $('#reverseMic', el);
        function showOne(a) {
          res.innerHTML = App.renderAnalysis(a, { detailLink: true }); App.icons();
          $$('.match', list).forEach(function (m) { m.classList.toggle('sel', m.getAttribute('data-s') === a.slug); });
        }
        function run(show) {
          var q = inp.value.trim();
          if (!q) { list.innerHTML = ''; status.textContent = ''; res.innerHTML = ''; return; }
          var r = App.searchByName(q, 5).filter(function (x) { return x.score >= 0.35; });
          if (!r.length) { status.textContent = 'Không tìm thấy phức chất phù hợp. Thử gõ đủ tên phối tử và kim loại, ví dụ “hexaxianoferat”.'; list.innerHTML = ''; res.innerHTML = ''; return; }
          status.textContent = r[0].score > 0.85 ? 'Tìm thấy kết quả khớp.' : 'Các kết quả gần đúng nhất:';
          list.innerHTML = r.map(function (x, i) {
            return '<button type="button" class="match' + (i === 0 ? ' sel' : '') + '" data-s="' + x.a.slug + '"><span class="m-f">' + x.a.formula + '</span><span class="m-n">' + esc(App.pName(x.a)) + '</span><span class="m-s">' + Math.round(x.score * 100) + '%</span></button>';
          }).join('');
          if (show) { showOne(r[0].a); R.setQuery('/tra-cuu', { q: q }); }
        }
        var tm; inp.addEventListener('input', function () { clearTimeout(tm); tm = setTimeout(function () { run(false); }, 180); });
        $('#reverseForm', el).addEventListener('submit', function (e) { e.preventDefault(); run(true); if (res.innerHTML) res.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
        list.addEventListener('click', function (e) { var b = e.target.closest('.match'); if (b) showOne(App.bySlug(b.getAttribute('data-s'))); });
        mic.addEventListener('click', function () {
          if (!Speech.canListen()) { App.toast('Trình duyệt chưa hỗ trợ nhận dạng giọng nói – hãy dùng Chrome hoặc Edge.', 'mic-off'); return; }
          if (mic.classList.contains('mic-on')) { Speech.stop(); return; }
          mic.classList.add('mic-on'); status.textContent = 'Đang nghe… hãy đọc tên phức chất.';
          Speech.listen({
            lang: App.pLang(),
            onInterim: function (t) { inp.value = t; },
            onResult: function (alts) { inp.value = alts[0]; run(true); },
            onError: function (m) { status.textContent = m; },
            onEnd: function () { mic.classList.remove('mic-on'); }
          });
        });
        if (query.q) { inp.value = query.q; run(true); }
      }
    };
  });

  /* ================= THƯ VIỆN ================= */
  var LS = { q: '', metal: '', lig: '', kind: '', sort: null, dir: 1, cmp: false }; // giữ bộ lọc khi quay lại
  function libCols() {
    return LS.cmp
      ? [['formula', 'Công thức'], ['nameVi', 'Tên tiếng Việt (SGK)'], ['nameEn', 'Tên IUPAC'], ['os', 'SOH'], ['cn', 'SPT'], ['kind', 'Loại']]
      : [['formula', 'Công thức'], ['name', 'Tên gọi'], ['color', 'Màu'], ['metal', 'Kim loại'], ['os', 'SOH'], ['cn', 'SPT'], ['kind', 'Loại'], ['geoVi', 'Hình học']];
  }
  function sortVal(a, k) {
    return k === 'metal' ? a.p.metal : k === 'formula' ? a.ascii : k === 'color' ? a.item.color : k === 'name' ? App.pName(a) : k === 'kind' ? a.kindVi : a[k];
  }
  R.add('/thu-vien', function () {
    var L = App.lib(), metals = {}, ligs = {};
    L.forEach(function (a) { metals[a.p.metal] = 1; a.p.ligands.forEach(function (l) { ligs[l.key] = 1; }); });
    function opt(v, label, cur) { return '<option value="' + v + '"' + (v === cur ? ' selected' : '') + '>' + label + '</option>'; }
    var ligLang = App.pLang();
    return {
      title: 'Thư viện', wide: true,
      head: { title: 'Thư viện phức chất', icon: 'library', color: 'c6', crumbs: [{ label: 'Thư viện', href: '/thu-vien' }],
        sub: 'Bấm vào một dòng để mở trang chi tiết: cách gọi tên từng bước, màu sắc thực tế và ứng dụng.' },
      html:
        '<div class="card glass"><div class="lib-filters">' +
        '<div class="input-wrap grow"><i data-lucide="search"></i><input id="libSearch" class="input" placeholder="Tìm theo công thức hoặc tên…" aria-label="Tìm trong thư viện" value="' + esc(LS.q) + '"></div>' +
        '<select id="libMetal" class="input" aria-label="Lọc theo kim loại">' + opt('', 'Mọi kim loại', LS.metal) + Object.keys(metals).map(function (m) { return opt(m, m + ' – ' + (ligLang === 'en' ? METALS[m].en : METALS[m].vi), LS.metal); }).join('') + '</select>' +
        '<select id="libLigand" class="input" aria-label="Lọc theo phối tử">' + opt('', 'Mọi phối tử', LS.lig) + Object.keys(LIGANDS).filter(function (k) { return ligs[k]; }).map(function (k) { return opt(k, LIGANDS[k].display + ' – ' + Chem.ligName(LIGANDS[k], ligLang), LS.lig); }).join('') + '</select>' +
        '<select id="libKind" class="input" aria-label="Lọc theo loại phức">' + opt('', 'Mọi loại phức', LS.kind) + opt('cation', 'Cation phức', LS.kind) + opt('anion', 'Anion phức', LS.kind) + opt('neutral', 'Phức trung hòa', LS.kind) + '</select>' +
        '<select id="libSort" class="input only-sm" aria-label="Sắp xếp"></select>' +
        '<button class="btn btn-soft" id="libCmp" aria-pressed="' + LS.cmp + '"><i data-lucide="columns-2"></i> So sánh VI – IUPAC</button>' +
        '</div><p class="small muted" id="libCount"></p>' +
        '<div class="table-wrap lib-wrap"><table class="table lib-table"><thead></thead><tbody></tbody></table></div></div>',
      mount: function (el) {
        function head() {
          $('thead', el).innerHTML = '<tr>' + libCols().map(function (s) {
            return '<th data-sort="' + s[0] + '" tabindex="0" class="' + (LS.sort === s[0] ? (LS.dir === 1 ? 'asc' : 'desc') : '') + '">' + s[1] + '</th>';
          }).join('') + '</tr>';
          // Trên điện thoại bảng thành thẻ, không có tiêu đề cột để bấm → sắp xếp bằng ô chọn này.
          var cur = LS.sort ? LS.sort + '|' + LS.dir : '';
          $('#libSort', el).innerHTML = opt('', 'Sắp xếp: mặc định', cur) + libCols().map(function (s) {
            return opt(s[0] + '|1', s[1] + ' ↑', cur) + opt(s[0] + '|-1', s[1] + ' ↓', cur);
          }).join('');
          $('#libCmp', el).classList.toggle('on', LS.cmp); $('#libCmp', el).setAttribute('aria-pressed', String(LS.cmp));
        }
        function draw() {
          var q = Chem.deaccent(LS.q.trim()), qn = q.replace(/[^a-z0-9]/g, '');
          var rows = L.filter(function (a) {
            if (LS.metal && a.p.metal !== LS.metal) return false;
            if (LS.lig && !a.p.ligands.some(function (x) { return x.key === LS.lig; })) return false;
            if (LS.kind && a.kind !== LS.kind) return false;
            if (q) {
              var hay = Chem.deaccent(a.nameVi + ' ' + a.nameEn + ' ' + a.ascii + ' ' + a.item.color + ' ' + (a.item.aka || '')).replace(/[^a-z0-9]/g, '');
              if (hay.indexOf(qn) < 0) return false;
            }
            return true;
          });
          if (LS.sort) rows.sort(function (x, y) {
            var vx = sortVal(x, LS.sort), vy = sortVal(y, LS.sort);
            return (typeof vx === 'number' ? vx - vy : String(vx).localeCompare(String(vy), 'vi')) * LS.dir;
          });
          $('#libCount', el).textContent = 'Hiển thị ' + rows.length + ' / ' + L.length + ' phức chất.';
          $('tbody', el).innerHTML = rows.length ? rows.map(function (a) {
            function td(label, html, cls) { return '<td' + (cls ? ' class="' + cls + '"' : '') + ' data-label="' + label + '">' + html + '</td>'; }
            // Ô màu đặt ngay cạnh công thức để luôn thấy màu, không phải kéo ngang.
            var f = '<td class="fm"><span class="swatch-sm" style="background:' + esc(a.item.hex) + '" title="' + esc(a.item.color) + '"></span>' + a.formula + '</td>';
            var tail = td('SOH', Chem.signed(a.os)) + td('SPT', a.cn) + td('Loại', '<span class="kind ' + a.kind + '">' + a.kindVi + '</span>');
            if (LS.cmp) return '<tr data-s="' + a.slug + '" tabindex="0">' + f + td('VI', esc(a.nameVi), 'nm cmp-vi') + td('IUPAC', esc(a.nameEn), 'nm cmp-iu') + tail + '</tr>';
            return '<tr data-s="' + a.slug + '" tabindex="0">' + f + td('Tên', esc(App.pName(a)), 'nm') + td('Màu', esc(a.item.color), 'col') + td('Kim loại', a.p.metal) + tail + td('Hình học', a.geoVi) + '</tr>';
          }).join('') : '<tr><td colspan="' + libCols().length + '" class="muted center">Không có phức chất phù hợp bộ lọc.</td></tr>';
        }
        [['#libSearch', 'q'], ['#libMetal', 'metal'], ['#libLigand', 'lig'], ['#libKind', 'kind']].forEach(function (p) {
          $(p[0], el).addEventListener('input', function () { LS[p[1]] = this.value; draw(); });
        });
        $('#libCmp', el).addEventListener('click', function () {
          LS.cmp = !LS.cmp;
          if (LS.sort && !libCols().some(function (c) { return c[0] === LS.sort; })) LS.sort = null;
          head(); draw();
        });
        function sortBy(th) { var k = th.getAttribute('data-sort'); LS.dir = LS.sort === k ? -LS.dir : 1; LS.sort = k; head(); draw(); }
        $('#libSort', el).addEventListener('change', function () {
          var v = this.value.split('|'); LS.sort = v[0] || null; LS.dir = +v[1] || 1; head(); draw();
        });
        $('thead', el).addEventListener('click', function (e) { var th = e.target.closest('th[data-sort]'); if (th) sortBy(th); });
        $('thead', el).addEventListener('keydown', function (e) { var th = e.target.closest('th[data-sort]'); if (th && e.key === 'Enter') sortBy(th); });
        var tb = $('tbody', el);
        tb.addEventListener('click', function (e) { var tr = e.target.closest('tr[data-s]'); if (tr) R.go('/thu-vien/' + tr.getAttribute('data-s')); });
        tb.addEventListener('keydown', function (e) { if (e.key === 'Enter') { var tr = e.target.closest('tr[data-s]'); if (tr) R.go('/thu-vien/' + tr.getAttribute('data-s')); } });
        head(); draw();
      }
    };
  });

  /* ================= CHI TIẾT PHỨC CHẤT ================= */
  R.add('/thu-vien/:id', function (params) {
    var a = App.bySlug(params.id);
    if (!a) return Pages.notFound('/thu-vien/' + params.id, 'Không có phức chất này trong thư viện.');
    var L = App.lib(), i = L.indexOf(a), prev = L[(i - 1 + L.length) % L.length], next = L[(i + 1) % L.length];
    return {
      title: a.ascii + ' – Thư viện',
      head: { title: a.formula, crumbs: [{ label: 'Thư viện', href: '/thu-vien' }, { label: a.formula, href: '/thu-vien/' + a.slug }], sub: esc(App.pName(a)) },
      html: App.renderAnalysis(a) +
        '<div class="pager">' +
        '<a class="btn btn-ghost" href="#/thu-vien/' + prev.slug + '"><i data-lucide="chevron-left"></i> <span class="f">' + prev.formula + '</span></a>' +
        '<a class="btn btn-primary" href="#/phat-am/' + a.slug + '"><i data-lucide="mic"></i> Luyện đọc chất này</a>' +
        '<a class="btn btn-ghost" href="#/thu-vien/' + next.slug + '"><span class="f">' + next.formula + '</span> <i data-lucide="chevron-right"></i></a></div>'
    };
  });

  /* ================= HƯỚNG DẪN ================= */
  var SPECIAL_LATIN = { Ag: 1, Au: 1, Cu: 1, Fe: 1, Pb: 1, Sn: 1, Hg: 1 };
  var IU_LATIN = { Ag: 1, Au: 1, Cu: 1, Fe: 1, Pb: 1, Sn: 1 };
  var GEO_EX = { linear: '[Ag(NH₃)₂]⁺, [Au(CN)₂]⁻', tetrahedral: '[Zn(NH₃)₄]²⁺, [Ni(CO)₄], [CoCl₄]²⁻', square: '[Cu(NH₃)₄]²⁺, [PtCl₄]²⁻, [Ni(CN)₄]²⁻', tbp: '[Fe(CO)₅]', octahedral: '[Fe(CN)₆]³⁻, [Co(NH₃)₆]³⁺' };
  var GEO_CN = { linear: 2, tetrahedral: 4, square: 4, tbp: 5, octahedral: 6 };
  var PRE_ROWS = [[2, 'đi', 'di', 'bis'], [3, 'tri', 'tri', 'tris'], [4, 'tetra', 'tetra', 'tetrakis'], [5, 'penta', 'penta', 'pentakis'], [6, 'hexa', 'hexa', 'hexakis']];
  function ph(w) { return (typeof PHONETIC !== 'undefined' && PHONETIC[w]) || ''; }
  function table(head, rows) { return '<div class="table-wrap"><table class="table"><thead><tr><th>' + head.join('</th><th>') + '</th></tr></thead><tbody>' + rows.join('') + '</tbody></table></div>'; }
  // nội dung bài theo chế độ; các bảng được sinh từ data.js
  function lessonHTML(L) {
    var iu = App.mode() === 'iupac';
    return ((iu && L.htmlIupac) || L.html)
      .replace('{{LIGAND_TABLE}}', function () {
        return iu
          ? table(['Công thức', 'IUPAC kiểu mới', 'Kiểu cũ', 'Phiên âm', 'Ghi chú tiếng Việt'], Object.keys(LIGANDS).map(function (k) {
              var G = LIGANDS[k];
              return '<tr><td class="f">' + G.display + '</td><td><b>' + G.en + '</b></td><td>' + (G.enOld || G.en) + '</td><td class="phon">' + ph(G.en) + '</td><td>Tên SGK: ' + G.vi + (G.charge ? ' · điện tích ' + Chem.chargeText(G.charge) : ' · trung hòa') + (G.dent > 1 ? ' · ' + G.dent + ' càng' : '') + '</td></tr>';
            }))
          : table(['Công thức', 'Tên trong SGK', 'Tên IUPAC', 'Điện tích', 'Số càng'], Object.keys(LIGANDS).map(function (k) {
              var G = LIGANDS[k];
              return '<tr><td class="f">' + G.display + (k === 'en' ? ' <small class="muted">(H₂NCH₂CH₂NH₂)</small>' : '') + '</td><td><b>' + G.vi + '</b></td><td>' + G.en + '</td><td>' + Chem.chargeText(G.charge) + '</td><td>' + G.dent + '</td></tr>';
            }));
      })
      .replace('{{PREFIX_TABLE}}', function () {
        return iu
          ? table(['Số lượng', 'Tiền tố thường', 'Phiên âm', 'Khi tên phối tử phức tạp', 'Phiên âm'], ['<tr><td>1</td><td>(mono – thường bỏ)</td><td></td><td>–</td><td></td></tr>'].concat(PRE_ROWS.map(function (r) {
              return '<tr><td>' + r[0] + '</td><td><b>' + r[2] + '</b></td><td class="phon">' + ph(r[2]) + '</td><td><b>' + r[3] + '</b></td><td class="phon">' + ph(r[3]) + '</td></tr>';
            })))
          : table(['Số lượng', 'Tiền tố thường', 'Khi tên phối tử phức tạp'], ['<tr><td>1</td><td>(mono – thường bỏ)</td><td>–</td></tr>'].concat(PRE_ROWS.map(function (r) {
              return '<tr><td>' + r[0] + '</td><td><b>' + r[1] + '</b></td><td><b>' + r[3] + '</b></td></tr>';
            })));
      })
      .replace('{{METAL_TABLE}}', function () {
        return iu
          ? table(['Kí hiệu', 'Cation / trung hòa', 'Anion (-ate)', 'Phiên âm (anion)', 'Ghi chú tiếng Việt'], Object.keys(METALS).map(function (k) {
              var M = METALS[k];
              return '<tr><td class="f">' + k + '</td><td>' + M.en + '</td><td>' + (IU_LATIN[k] ? '<b class="grad-text">' + M.enAt + '</b>' : M.enAt) + '</td><td class="phon">' + ph(M.enAt) + '</td><td>' + M.vi + (IU_LATIN[k] ? ' · gốc Latin <i>' + M.latin + '</i>' : '') + '</td></tr>';
            }))
          : table(['Kí hiệu', 'Tên tiếng Việt', 'Tên Latin', 'Tên trong anion phức', 'Tiếng Anh (anion)'], Object.keys(METALS).map(function (k) {
              var M = METALS[k];
              return '<tr><td class="f">' + k + '</td><td>' + M.vi + '</td><td><i>' + M.latin + '</i></td><td>' + (SPECIAL_LATIN[k] ? '<b class="grad-text">' + M.at + '</b>' : M.at) + '</td><td>' + M.enAt + '</td></tr>';
            }));
      })
      .replace('{{GEO_GRID}}', function () {
        return '<div class="geo-grid">' + Object.keys(GEO_CN).map(function (g) {
          return '<div class="geo-item">' + App.geoSVG(g, ['L', 'L', 'L', 'L', 'L', 'L'], 'M') + '<b>' + Chem.GEO[g].vi + '</b><small>Số phối trí ' + GEO_CN[g] + ' · góc ' + Chem.GEO[g].angle + '</small><small class="f">' + GEO_EX[g] + '</small></div>';
        }).join('') + '</div>';
      });
  }
  function lessonText(L) { var d = document.createElement('div'); d.innerHTML = lessonHTML(L); return d.textContent.replace(/\s+/g, ' '); }
  function highlight(root, q) {
    if (!q) return;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), nodes = [], n;
    while ((n = walker.nextNode())) nodes.push(n);
    nodes.forEach(function (node) {
      if (node.parentNode.closest('svg')) return;
      var txt = node.nodeValue, low = Chem.deaccent(txt), i = low.indexOf(q);
      if (i < 0 || low.length !== txt.length) return;
      var frag = document.createDocumentFragment(), last = 0;
      while (i >= 0) {
        frag.appendChild(document.createTextNode(txt.slice(last, i)));
        var mk = document.createElement('mark'); mk.className = 'hl'; mk.textContent = txt.slice(i, i + q.length); frag.appendChild(mk);
        last = i + q.length; i = low.indexOf(q, last);
      }
      frag.appendChild(document.createTextNode(txt.slice(last)));
      node.parentNode.replaceChild(frag, node);
    });
  }
  function printLessons(list) {
    var area = $('#printArea');
    area.innerHTML = '<h1>Complex Chemistry 12 – Hướng dẫn gọi tên phức chất</h1>' + list.map(function (L) {
      return '<section class="print-lesson"><h2>' + (LESSONS.indexOf(L) + 1) + '. ' + L.title + '</h2>' + lessonHTML(L) + '</section>';
    }).join('');
    App.icons();
    document.body.classList.add('printing');
    function done() { document.body.classList.remove('printing'); area.innerHTML = ''; window.removeEventListener('afterprint', done); }
    window.addEventListener('afterprint', done);
    App.toast('Chọn “Lưu dưới dạng PDF” trong hộp thoại in để tải file PDF.', 'printer');
    setTimeout(function () { window.print(); }, 200);
  }

  R.add('/huong-dan', function (params, query) {
    return {
      title: 'Hướng dẫn',
      head: { title: 'Hướng dẫn quy tắc gọi tên', icon: 'book-open', color: 'c7', crumbs: [{ label: 'Hướng dẫn', href: '/huong-dan' }],
        sub: 'Tóm tắt lý thuyết theo SGK Hóa học 12, gồm ' + LESSONS.length + ' bài, bài nào cũng có ví dụ.' },
      html:
        '<div class="theory-tools"><div class="input-wrap grow"><i data-lucide="search"></i><input id="thSearch" class="input" placeholder="Tìm trong lý thuyết (ví dụ: bis, Latin, vuông phẳng)…" aria-label="Tìm trong lý thuyết" value="' + esc(query.q || '') + '"></div>' +
        '<button class="btn btn-primary" id="thPrint"><i data-lucide="printer"></i> In / Tải PDF toàn bộ</button></div>' +
        '<div class="lesson-list" id="lessonList"></div>',
      mount: function (el) {
        var texts = LESSONS.map(lessonText), box = $('#lessonList', el), inp = $('#thSearch', el);
        function draw() {
          var q = Chem.deaccent(inp.value.trim()), any = false;
          box.innerHTML = LESSONS.map(function (L, i) {
            var t = texts[i], dt = Chem.deaccent(t), at = q ? dt.indexOf(q) : -1;
            if (q && at < 0 && Chem.deaccent(L.title).indexOf(q) < 0) return '';
            any = true;
            var snip = q && at >= 0 ? '…' + esc(t.slice(Math.max(0, at - 50), at + q.length + 70)) + '…' : '';
            return '<a class="lesson-card glass" href="#/huong-dan/' + L.slug + (q ? '?q=' + encodeURIComponent(q) : '') + '"><span class="acc-n">' + (i + 1) + '</span>' +
              '<span class="lc-body"><b>' + L.title + '</b>' + (snip ? '<small class="muted">' + snip + '</small>' : '') + '</span><i data-lucide="chevron-right"></i></a>';
          }).join('') || '<p class="muted">Không tìm thấy nội dung phù hợp.</p>';
          if (q) highlight(box, q);
          App.icons();
          R.setQuery('/huong-dan', { q: inp.value.trim() });
        }
        var tm; inp.addEventListener('input', function () { clearTimeout(tm); tm = setTimeout(draw, 180); });
        $('#thPrint', el).addEventListener('click', function () { printLessons(LESSONS); });
        draw();
      }
    };
  });
  R.add('/huong-dan/:slug', function (params, query) {
    var i = -1; LESSONS.forEach(function (L, k) { if (L.slug === params.slug) i = k; });
    if (i < 0) return Pages.notFound('/huong-dan/' + params.slug, 'Không có bài lý thuyết này.');
    var L = LESSONS[i], prev = LESSONS[i - 1], next = LESSONS[i + 1];
    return {
      title: L.title,
      head: { title: (i + 1) + '. ' + L.title, icon: L.icon, color: 'c7', crumbs: [{ label: 'Hướng dẫn', href: '/huong-dan' }, { label: 'Bài ' + (i + 1), href: '/huong-dan/' + L.slug }] },
      html:
        '<div class="lesson-tabs" role="tablist" aria-label="Các bài lý thuyết">' + LESSONS.map(function (x, k) {
          return '<a href="#/huong-dan/' + x.slug + '" role="tab" aria-selected="' + (k === i) + '" class="' + (k === i ? 'on' : '') + '" title="' + esc(x.title) + '">' + (k + 1) + '</a>';
        }).join('') + '</div>' +
        '<article class="card glass lesson-body" id="lessonBody">' + lessonHTML(L) + '</article>' +
        '<div class="pager">' +
        (prev ? '<a class="btn btn-ghost" href="#/huong-dan/' + prev.slug + '"><i data-lucide="chevron-left"></i> Bài trước</a>' : '<span></span>') +
        '<button class="btn btn-soft" id="lsPrint"><i data-lucide="printer"></i> In bài này</button>' +
        (next ? '<a class="btn btn-primary" href="#/huong-dan/' + next.slug + '">Bài tiếp <i data-lucide="chevron-right"></i></a>' : '<a class="btn btn-primary" href="#/luyen-tap">Luyện tập ngay <i data-lucide="target"></i></a>') +
        '</div>',
      mount: function (el, q) {
        if (q.q) { highlight($('#lessonBody', el), Chem.deaccent(q.q)); var m = $('mark.hl', el); if (m) setTimeout(function () { m.scrollIntoView({ block: 'center' }); }, 200); }
        $('#lsPrint', el).addEventListener('click', function () { printLessons([L]); });
      }
    };
  });
})();

/* =====================================================================
 * CÁC TRANG KHÁC: Chọn chế độ, Liên hệ & Báo lỗi, Cài đặt, 404
 * ===================================================================== */
var Pages = window.Pages || {};
(function () {
  'use strict';
  var $ = App.$, $$ = App.$$, esc = App.esc, R = Router;

  /* ================= CHỌN CHẾ ĐỘ (màn hình đầu tiên) ================= */
  R.add('/chon-che-do', function (params, query) {
    var next = query.next && query.next[0] === '/' ? query.next : '/';
    // Đã chọn chế độ ở lần trước → không hiện lại màn hình này (trừ khi mở từ Cài đặt với ?xem=1)
    if (App.getSetting('nameMode') && !query.xem) return { redirect: next };
    var a = Chem.analyze('[Cu(NH3)4]2+'), b = Chem.analyze('K3[Fe(CN)6]');
    function card(m, badge, title, sub, ex) {
      return '<button class="mode-card mode-' + m + '" data-mode="' + m + '">' + badge + '<b>' + title + '</b><span>' + sub + '</span>' +
        '<span class="mc-ex">' + ex.map(function (x) { return '<span class="f">' + x.formula + '</span> → ' + esc(m === 'iupac' ? x.nameEn : x.nameVi); }).join('<br>') + '</span>' +
        '<span class="btn btn-primary">Chọn chế độ này <i data-lucide="arrow-right"></i></span></button>';
    }
    return {
      title: 'Chọn chế độ đọc tên', cls: 'chooser',
      html:
        '<div class="chooser-head"><h1 tabindex="-1">Bạn muốn đọc tên phức chất theo cách nào?</h1>' +
        '<p class="lead">Chỉ <b>tên phức chất</b> và <b>giọng đọc</b> đổi theo lựa chọn này, phần còn lại vẫn là tiếng Việt. Web chỉ hỏi một lần; sau này muốn đổi thì bấm nút <b>VI ⇄ IUPAC</b> trên thanh menu.</p></div>' +
        '<div class="mode-grid">' +
        card('vi', '<span class="mode-badge">VI</span>', 'Tên tiếng Việt', 'Theo SGK Hóa học 12 (GDPT 2018)', [a, b]) +
        card('iupac', '<span class="mode-badge">IUPAC</span>', 'Tên tiếng Anh', 'Theo IUPAC Red Book 2005', [a, b]) +
        '</div>',
      mount: function (el) {
        $$('.mode-card', el).forEach(function (c) {
          c.addEventListener('click', function () { App.setSetting('nameMode', c.getAttribute('data-mode')); R.go(next, { replace: true }); });
        });
      }
    };
  });

  /* ================= LIÊN HỆ & BÁO LỖI ================= */
  var SECTIONS = ['Trang chủ', 'Gọi tên phức chất', 'Tra cứu ngược', 'Luyện phát âm', 'Luyện tập', 'Bài tập', 'Đề kiểm tra AI', 'Diễn đàn', 'Đăng nhập', 'Flashcard', 'Thư viện phức chất', 'Hướng dẫn lý thuyết', 'Cài đặt', 'Liên hệ & Báo lỗi', 'Khác'];
  R.add('/lien-he', function (params, query) {
    var C = SITE_CONFIG, modeTxt = App.mode() === 'iupac' ? 'IUPAC' : 'VI';
    var preSection = query.muc === 'de-ai' ? 'Đề kiểm tra AI' : ''; // link "báo lỗi" dưới đề AI tự chọn sẵn mục này
    var phone = (C.zaloPhone || '').replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
    var info = [C.className ? 'Lớp: ' + esc(C.className) : '', C.school ? 'Trường: ' + esc(C.school) : ''].filter(Boolean).join(' · ');
    var teacher = App.teacherBox();
    return {
      title: 'Liên hệ & Báo lỗi', wide: true,
      head: { title: 'Liên hệ & Báo lỗi', icon: 'message-circle', color: 'c8', crumbs: [{ label: 'Liên hệ', href: '/lien-he' }],
        sub: 'Nếu thấy tên gọi sai, công thức sai hoặc web bị lỗi, bạn báo giúp để mình sửa.' },
      html:
        '<div class="contact-grid"><div class="card glass author-card">' +
        '<h3>' + esc(C.authorName) + '</h3><p class="muted">' + info + '</p>' + teacher +
        '<div class="contact-links">' +
        (C.email ? '<a class="c-link" href="mailto:' + esc(C.email) + '?subject=' + encodeURIComponent('[Complex Chemistry 12] Góp ý') + '"><i data-lucide="mail"></i><span>' + esc(C.email) + '</span></a>' : '') +
        (C.zaloPhone ? '<a class="c-link" href="https://zalo.me/' + esc(C.zaloPhone) + '" target="_blank" rel="noopener"><span class="zalo-badge">Zalo</span><span>Zalo: ' + esc(phone) + '</span></a>' : '') +
        (C.facebook ? '<a class="c-link" href="' + esc(C.facebook) + '" target="_blank" rel="noopener"><svg class="fb-ic" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M13.5 21v-7.5h2.5l.4-3h-2.9V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 3.9v2.3H8v3h2.5V21h3z"/></svg><span>Trang Facebook</span></a>' : '') +
        '</div>' +
        '<div class="faq"><h4><i data-lucide="circle-help"></i> Câu hỏi thường gặp</h4>' +
        '<details><summary>Micro không hoạt động?</summary><p>Dùng Chrome hoặc Edge, mở web bằng https (link Netlify). Khi trình duyệt hỏi, bấm <b>Cho phép</b> micro. Nếu lỡ chặn: bấm biểu tượng ổ khóa cạnh địa chỉ web → Micro → Cho phép, rồi tải lại trang. Safari/Firefox chưa hỗ trợ nhận dạng giọng nói – hãy dùng ô “Gõ thay thế”.</p></details>' +
        '<details><summary>Không nghe được giọng đọc tiếng Việt?</summary><p>Máy cần có giọng tiếng Việt. Xem hướng dẫn cài thêm trong <a href="#/cai-dat">Cài đặt</a>.</p></details>' +
        '<details><summary>Web hiển thị lỗi, thiếu biểu tượng?</summary><p>Tải lại trang (Ctrl + F5). Biểu tượng và biểu đồ tải từ Internet nên cần có mạng. Nếu vẫn lỗi, gửi ảnh chụp màn hình qua biểu mẫu bên cạnh.</p></details>' +
        '<details><summary>Dùng trên điện thoại thế nào?</summary><p>Thanh dưới đáy có 5 mục chính; các mục khác nằm trong nút menu ☰ góc trên. Có thể “Thêm vào màn hình chính” để mở như ứng dụng. Gõ công thức không cần chỉ số: [Cu(NH3)4]2+ là đủ.</p></details>' +
        '<details><summary>Tiến độ học có bị mất không?</summary><p>Điểm, lịch sử và flashcard được lưu riêng cho từng chế độ trong trình duyệt của bạn. Xóa dữ liệu trình duyệt hoặc dùng tab ẩn danh sẽ làm mất tiến độ.</p></details>' +
        '</div></div>' +
        '<div class="card glass"><h3 class="card-title"><i data-lucide="bug"></i> Biểu mẫu báo lỗi</h3>' +
        '<form name="bao-loi" id="reportForm" method="POST" enctype="multipart/form-data" novalidate>' +
        '<input type="hidden" name="form-name" value="bao-loi"><input type="hidden" name="che-do" id="fMode" value="' + modeTxt + '">' +
        '<p class="hidden"><label>Đừng điền ô này: <input name="bot-field"></label></p>' +
        '<p class="mode-chip small">Chế độ đang dùng: <b>' + (modeTxt === 'VI' ? 'VI (tiếng Việt – SGK)' : 'IUPAC (tiếng Anh)') + '</b> – được gửi kèm tự động.</p>' +
        '<div class="form-grid">' +
        '<div class="field"><label for="fName">Họ tên <span class="req">*</span></label><input id="fName" name="ho-ten" class="input" required maxlength="80" placeholder="Nguyễn Văn A"><small class="err"></small></div>' +
        '<div class="field"><label for="fEmail">Email (để phản hồi) <span class="req">*</span></label><input id="fEmail" name="email" type="email" class="input" required placeholder="ban@gmail.com"><small class="err"></small></div>' +
        '<div class="field"><label for="fType">Loại sự cố <span class="req">*</span></label><select id="fType" name="loai-su-co" class="input" required><option value="">– Chọn loại sự cố –</option>' +
        ['Sai tên gọi', 'Sai công thức', 'Lỗi giọng nói', 'Lỗi giao diện', 'Góp ý khác'].map(function (x) { return '<option>' + x + '</option>'; }).join('') + '</select><small class="err"></small></div>' +
        '<div class="field"><label for="fSection">Mục bị lỗi <span class="req">*</span></label><select id="fSection" name="muc-bi-loi" class="input" required><option value="">– Chọn mục –</option>' +
        SECTIONS.map(function (x) { return '<option' + (x === preSection ? ' selected' : '') + '>' + x + '</option>'; }).join('') + '</select><small class="err"></small></div>' +
        '<div class="field full"><label for="fDesc">Mô tả chi tiết <span class="req">*</span></label><textarea id="fDesc" name="mo-ta" class="input" rows="5" required maxlength="2000" placeholder="Ví dụ: Ở mục Gọi tên, nhập K3[Fe(CN)6] thì ra tên … nhưng SGK ghi …"></textarea><small class="err"></small></div>' +
        '<div class="field full"><label for="fFile">Ảnh chụp màn hình (tùy chọn, tối đa 5 MB)</label>' +
        '<label class="file-drop" for="fFile"><i data-lucide="image"></i><span id="fFileName">Chọn ảnh (PNG, JPG, WEBP)…</span></label>' +
        '<input id="fFile" name="anh-chup" type="file" accept="image/*" class="sr-only"><small class="err"></small></div></div>' +
        '<button class="btn btn-primary btn-lg" type="submit" id="fSubmit"><i data-lucide="send"></i> Gửi báo lỗi</button>' +
        '<div id="formMsg" class="form-msg" role="status"></div></form></div></div>',
      mount: function (el) {
        var form = $('#reportForm', el), msg = $('#formMsg', el), file = $('#fFile', el);
        function setErr(f, m) { f.classList.toggle('invalid', !!m); var e = f.parentNode.querySelector('.err'); if (e) e.textContent = m || ''; return !m; }
        function validate(f) {
          var v = (f.value || '').trim();
          switch (f.id) {
            case 'fName': return setErr(f, v.length < 2 ? 'Vui lòng nhập họ tên (ít nhất 2 kí tự).' : '');
            case 'fEmail': return setErr(f, !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? 'Email chưa đúng định dạng, ví dụ ban@gmail.com.' : '');
            case 'fType': return setErr(f, !v ? 'Hãy chọn loại sự cố.' : '');
            case 'fSection': return setErr(f, !v ? 'Hãy chọn mục bị lỗi.' : '');
            case 'fDesc': return setErr(f, v.length < 10 ? 'Mô tả ít nhất 10 kí tự để tác giả hiểu lỗi.' : '');
            case 'fFile':
              var x = f.files[0];
              if (!x) return setErr(f, '');
              if (!/^image\//.test(x.type)) return setErr(f, 'Chỉ đính kèm file ảnh.');
              return setErr(f, x.size > 5 * 1024 * 1024 ? 'Ảnh lớn hơn 5 MB, hãy chọn ảnh nhỏ hơn.' : '');
          }
          return true;
        }
        file.addEventListener('change', function () { $('#fFileName', el).textContent = file.files[0] ? file.files[0].name : 'Chọn ảnh (PNG, JPG, WEBP)…'; validate(file); });
        ['fName', 'fEmail', 'fType', 'fSection', 'fDesc'].forEach(function (id) {
          var f = $('#' + id, el);
          f.addEventListener('blur', function () { validate(f); });
          f.addEventListener('input', function () { if (f.classList.contains('invalid')) validate(f); });
        });
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          var ok = ['fName', 'fEmail', 'fType', 'fSection', 'fDesc', 'fFile'].map(function (id) { return validate($('#' + id, el)); }).every(Boolean);
          if (!ok) { msg.innerHTML = '<div class="notice err"><i data-lucide="circle-x"></i><div>Vui lòng kiểm tra lại các ô được đánh dấu đỏ.</div></div>'; App.icons(); var bad = $('.invalid', form); if (bad) bad.focus(); return; }
          var btn = $('#fSubmit', el); btn.disabled = true; btn.innerHTML = '<i data-lucide="loader"></i> Đang gửi…'; App.icons();
          fetch('/', { method: 'POST', body: new FormData(form) }).then(function (r) {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            msg.innerHTML = '<div class="notice ok"><i data-lucide="circle-check"></i><div><b>Gửi thành công, cảm ơn bạn!</b><p>Tác giả sẽ phản hồi qua email ' + esc($('#fEmail', el).value) + '.</p></div></div>';
            form.reset(); $('#fMode', el).value = modeTxt; $('#fFileName', el).textContent = 'Chọn ảnh (PNG, JPG, WEBP)…';
          }).catch(function () {
            var local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || location.protocol === 'file:';
            msg.innerHTML = local
              ? '<div class="notice warn"><i data-lucide="triangle-alert"></i><div><b>Biểu mẫu chưa gửi được khi chạy thử trên máy.</b><p>Dữ liệu hợp lệ. Form sẽ hoạt động ngay khi website được deploy lên Netlify (Netlify Forms).</p></div></div>'
              : '<div class="notice err"><i data-lucide="circle-x"></i><div><b>Gửi chưa thành công.</b><p>Kiểm tra kết nối mạng rồi thử lại, hoặc gửi email trực tiếp tới ' + esc(C.email) + '.</p></div></div>';
          }).then(function () { btn.disabled = false; btn.innerHTML = '<i data-lucide="send"></i> Gửi báo lỗi'; App.icons(); });
        });
      }
    };
  });

  /* ================= CÀI ĐẶT ================= */
  R.add('/cai-dat', function () {
    var s = App.getSetting, sample = Chem.analyze('K3[Fe(CN)6]');
    function seg(name, opts, cur) {
      return '<div class="seg">' + opts.map(function (o) { return '<label><input type="radio" name="' + name + '" value="' + o[0] + '"' + (o[0] === cur ? ' checked' : '') + '><span>' + o[1] + '</span></label>'; }).join('') + '</div>';
    }
    return {
      title: 'Cài đặt',
      head: { title: 'Cài đặt', icon: 'settings', color: 'c1', crumbs: [{ label: 'Cài đặt', href: '/cai-dat' }], sub: 'Mọi thay đổi được lưu ngay trên trình duyệt của bạn.' },
      html:
        '<div class="card glass settings">' +
        '<div class="set-row"><div><b>Giao diện</b><small>Sáng, tối hoặc theo cài đặt của máy.</small></div>' + seg('theme', [['light', 'Sáng'], ['dark', 'Tối'], ['system', 'Theo máy']], App.theme()) + '</div>' +
        '<div class="set-row"><div><b>Chế độ đọc tên</b><small>Chỉ đổi phần tên phức chất và giọng đọc.</small></div>' + seg('mode', [['vi', 'VI – SGK'], ['iupac', 'IUPAC']], App.mode()) + '</div>' +
        '<div class="set-row"><div><b>Kiểu tên phối tử IUPAC</b><small id="styleEx"></small></div>' + seg('iupacStyle', [['new', 'Kiểu mới (chlorido, cyanido)'], ['old', 'Kiểu cũ (chloro, cyano)']], s('iupacStyle')) + '</div>' +
        '</div>' +
        '<div class="card glass settings" id="giong-doc"><h3 class="card-title"><i data-lucide="volume-2"></i> Giọng đọc</h3>' +
        '<div class="set-row"><div><b>Giọng tiếng Việt</b><small id="viInfo"></small></div><select class="input" id="voiceVi"></select></div>' +
        '<div class="set-row"><div><b>Giọng tiếng Anh</b><small>Chọn giọng Mỹ hoặc Anh.</small></div>' + seg('enAccent', [['en-US', 'Anh – Mỹ (en-US)'], ['en-GB', 'Anh – Anh (en-GB)']], s('enAccent')) + '</div>' +
        '<div class="set-row"><div><b>Giọng tiếng Anh cụ thể</b><small>Để “Tự động” nếu không chắc.</small></div><select class="input" id="voiceEn"></select></div>' +
        '<div class="set-row"><div><b>Tốc độ đọc: <span id="rateVal"></span></b><small>Nút “Nghe chậm” luôn đọc ở tốc độ 0,7.</small></div><input type="range" id="rate" min="0.5" max="1.3" step="0.1" value="' + s('rate') + '" aria-label="Tốc độ đọc"></div>' +
        '<div class="row gap wrap"><button class="btn btn-soft" id="testVi"><i data-lucide="play"></i> Nghe thử tiếng Việt</button><button class="btn btn-soft" id="testEn"><i data-lucide="play"></i> Nghe thử tiếng Anh</button></div>' +
        '<details class="faq-box"><summary><b>Máy không có giọng tiếng Việt? Cách cài thêm</b></summary><ul>' +
        '<li><b>Windows 10/11:</b> Cài đặt → Thời gian và ngôn ngữ → Giọng nói → Thêm giọng nói → chọn <i>Tiếng Việt</i>, sau đó khởi động lại trình duyệt. Hoặc dùng <b>Microsoft Edge</b> (có sẵn giọng HoaiMy, NamMinh trực tuyến).</li>' +
        '<li><b>Android:</b> Cài đặt → Quản lý chung → Chuyển văn bản thành giọng nói → Công cụ Google → Cài đặt dữ liệu giọng nói → <i>Tiếng Việt</i>.</li>' +
        '<li><b>iPhone/iPad:</b> Cài đặt → Trợ năng → Nội dung được đọc → Giọng nói → <i>Tiếng Việt</i> → tải giọng Linh.</li>' +
        '<li><b>macOS:</b> Cài đặt hệ thống → Trợ năng → Nội dung được đọc → Giọng hệ thống → Quản lý giọng nói → <i>Tiếng Việt</i>.</li></ul></details>' +
        '</div>' +
        '<div class="card glass settings"><h3 class="card-title"><i data-lucide="database"></i> Dữ liệu học tập</h3>' +
        '<p class="small muted">Điểm, lịch sử luyện tập, flashcard và điểm phát âm được lưu riêng cho mỗi chế độ.</p>' +
        '<div class="row gap wrap"><button class="btn btn-danger-soft" data-reset="vi"><i data-lucide="trash-2"></i> Xóa dữ liệu chế độ VI</button><button class="btn btn-danger-soft" data-reset="iupac"><i data-lucide="trash-2"></i> Xóa dữ liệu chế độ IUPAC</button></div>' +
        '<p class="small muted" style="margin-top:12px">Xem lại màn hình chọn chế độ: <a href="#/chon-che-do?xem=1">mở màn hình chọn chế độ</a>.</p></div>',
      mount: function (el) {
        function styleEx() { var a = Chem.analyze('K3[Fe(CN)6]'); $('#styleEx', el).innerHTML = 'Ví dụ: K₃[Fe(CN)₆] → <b>' + esc(a.nameEn) + '</b>'; }
        function fillVoices() {
          var vi = Speech.voices('vi'), acc = App.getSetting('enAccent'), en = Speech.voices('en').filter(function (v) { return v.lang.replace('_', '-') === acc; });
          if (!en.length) en = Speech.voices('en');
          $('#voiceVi', el).innerHTML = '<option value="">Tự động</option>' + vi.map(function (v) { return '<option' + (v.name === App.getSetting('voiceVi') ? ' selected' : '') + '>' + esc(v.name) + '</option>'; }).join('');
          $('#voiceEn', el).innerHTML = '<option value="">Tự động</option>' + en.map(function (v) { return '<option' + (v.name === App.getSetting('voiceEn') ? ' selected' : '') + '>' + esc(v.name) + '</option>'; }).join('');
          $('#viInfo', el).innerHTML = vi.length ? 'Máy có ' + vi.length + ' giọng tiếng Việt.' : '<span style="color:var(--bad)">Máy chưa có giọng tiếng Việt – xem hướng dẫn cài bên dưới.</span>';
        }
        el.addEventListener('change', function (e) {
          var t = e.target;
          if (t.name === 'theme') App.setTheme(t.value);
          else if (t.name === 'mode') App.setSetting('nameMode', t.value);
          else if (t.name === 'iupacStyle') { App.setSetting('iupacStyle', t.value); styleEx(); App.toast('Đã đổi kiểu tên phối tử IUPAC.', 'check'); }
          else if (t.name === 'enAccent') { App.setSetting('enAccent', t.value); App.setSetting('voiceEn', ''); fillVoices(); }
          else if (t.id === 'voiceVi') App.setSetting('voiceVi', t.value);
          else if (t.id === 'voiceEn') App.setSetting('voiceEn', t.value);
        });
        var rate = $('#rate', el);
        function showRate() { $('#rateVal', el).textContent = String(rate.value).replace('.', ','); }
        rate.addEventListener('input', function () { App.setSetting('rate', +rate.value); showRate(); });
        $('#testVi', el).addEventListener('click', function () { Speech.speak(sample.speakVi, 'vi', this); });
        $('#testEn', el).addEventListener('click', function () { Speech.speak(sample.speakEn, 'en', this); });
        $$('[data-reset]', el).forEach(function (b) {
          b.addEventListener('click', function () {
            var m = b.getAttribute('data-reset');
            if (!confirm('Xóa toàn bộ điểm, lịch sử, flashcard và điểm phát âm của chế độ ' + (m === 'vi' ? 'VI' : 'IUPAC') + '?')) return;
            ['history', 'fc', 'voice'].forEach(function (k) { App.Store.set(k + '-' + m, k === 'history' ? [] : {}); });
            App.toast('Đã xóa dữ liệu chế độ ' + (m === 'vi' ? 'VI' : 'IUPAC') + '.', 'trash-2');
          });
        });
        if (window.speechSynthesis) window.speechSynthesis.addEventListener('voiceschanged', fillVoices);
        fillVoices(); showRate(); styleEx();
        this._off = function () { if (window.speechSynthesis) window.speechSynthesis.removeEventListener('voiceschanged', fillVoices); };
      },
      unmount: function () { if (this._off) this._off(); }
    };
  });

  /* ================= GIỚI THIỆU ================= */
  R.add('/gioi-thieu', function () {
    var C = SITE_CONFIG;
    return {
      title: 'Giới thiệu',
      head: { title: 'Giới thiệu', crumbs: [{ label: 'Giới thiệu', href: '/gioi-thieu' }] },
      html:
        '<div class="card glass about">' + App.teacherBox() + '<h3>Vì sao mình làm web này?</h3>' + (C.why || []).map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') +
        '<h3>Web có gì?</h3>' +
        '<ul><li>' + App.lib().length + ' phức chất trong thư viện; tên gọi được web tự sinh từ công thức theo cùng một quy tắc.</li>' +
        '<li>' + Quiz.BANK.length + ' câu hỏi luyện tập (' + Quiz.TYPES.length + ' dạng cho mỗi phức chất) và ' + LESSONS.length + ' bài lý thuyết.</li>' +
        '<li>Trang <a href="#/bai-tap">Bài tập</a>: hệ thống bài tập theo cấu trúc đề tốt nghiệp THPT (đề các Sở, đề thi tốt nghiệp, sách bài tập), có đáp án và lời giải.</li>' +
        '<li>Trang <a href="#/de-kiem-tra">Đề kiểm tra AI</a>: đề do AI (Google Gemini) soạn, sau đó web đối chiếu lại đáp án với dữ liệu của mình trước khi hiển thị.</li></ul>' +
        '<h3>Nguồn tham khảo</h3>' +
        '<ul><li>Sách giáo khoa Hóa học 12, Chương trình GDPT 2018' + (C.textbook ? ' – ' + esc(C.textbook) : ' – phần kim loại chuyển tiếp dãy thứ nhất và phức chất') + '. Dùng cho khái niệm, ví dụ, màu sắc và ứng dụng của phức chất.</li>' +
        '<li>IUPAC, <i>Nomenclature of Inorganic Chemistry – IUPAC Recommendations 2005</i> (Red Book 2005), chương IR-9 về hợp chất phối trí. Dùng cho tên tiếng Anh: tên phối tử (ammine, chlorido, cyanido…), thứ tự chữ cái và đuôi <i>-ate</i> của anion phức.</li></ul>' +
        '<h3>Lưu ý</h3>' +
        '<p>Mình là học sinh nên web có thể còn sai sót. Nếu bạn thấy tên gọi hay đáp án nào chưa đúng, hãy báo ở trang <a href="#/lien-he">Liên hệ &amp; Báo lỗi</a>.</p>' +
        '<p class="small muted about-meta">Phiên bản ' + esc(C.version) + ' · Cập nhật gần nhất: ' + esc(C.updated) + '</p></div>'
    };
  });

  /* ================= 404 ================= */
  Pages.notFound = function (path, msg) {
    return {
      title: 'Không tìm thấy trang',
      html: '<div class="card glass not-found"><div class="nf-code">Lỗi 404</div><h1 tabindex="-1">Không tìm thấy trang này</h1>' +
        '<p class="muted">' + (msg || 'Đường dẫn <code>' + esc(path) + '</code> không có trong web. Có thể link bị gõ sai hoặc trang đã đổi tên.') + '</p>' +
        '<div class="row gap wrap"><a class="btn btn-primary" href="#/">Về trang chủ</a><a class="btn" href="#/thu-vien">Mở thư viện</a><a class="btn" href="#/lien-he">Báo link hỏng</a></div></div>'
    };
  };
})();

/* =====================================================================
 * TRANG "ĐỀ KIỂM TRA AI"
 *   #/de-kiem-tra           chọn mức độ, độ dài → tạo đề
 *   #/de-kiem-tra/lam-bai   làm bài, nộp bài, xem điểm và lời giải, in đề
 * Logic (gọi AI, kiểm tra câu hỏi, chấm điểm) nằm ở exam.js.
 * ===================================================================== */
(function () {
  'use strict';
  var $ = App.$, $$ = App.$$, esc = App.esc, R = Router;
  var CFG = { level: 'MIX', length: 'short' };   // nhớ lựa chọn gần nhất trong phiên
  var LV_CLASS = { NB: 'lv1', TH: 'lv2', VD: 'lv3' };
  function vn(n) { return String(n).replace('.', ',').replace('-', '−'); }
  function modeName(m) { return m === 'iupac' ? 'IUPAC (tiếng Anh)' : 'tiếng Việt (SGK)'; }

  /* ---------- khung thông báo lỗi (màu vàng, có icon, có nút) ---------- */
  var MSG = {
    QUOTA_EXCEEDED: ['calendar-clock', 'Hôm nay web đã dùng hết lượt tạo đề bằng AI miễn phí. Lượt sẽ được làm mới vào ngày mai. Bạn vẫn có thể làm đề từ ngân hàng câu hỏi có sẵn.'],
    RATE_LIMIT: ['hourglass', 'Có nhiều người đang tạo đề cùng lúc, vui lòng đợi 1 phút rồi thử lại.'],
    USER_LIMIT: ['timer', ''],
    API_KEY_INVALID: ['wrench', 'Chức năng tạo đề AI đang bảo trì. Vui lòng báo cho tác giả.'],
    AI_UNAVAILABLE: ['wifi-off', 'Không kết nối được AI. Kiểm tra mạng rồi thử lại.']
  };
  function errorBox(r) {
    var m = MSG[r.error] || MSG.AI_UNAVAILABLE, text = m[1];
    if (r.error === 'USER_LIMIT') text = 'Bạn đã tạo 10 đề trong 1 giờ qua. Hãy thử lại sau ' + (r.waitMin || 1) + ' phút.';
    var retry = r.error === 'RATE_LIMIT' || r.error === 'AI_UNAVAILABLE';
    return '<div class="notice warn ex-alert" role="alert"><i data-lucide="' + m[0] + '"></i><div><b>' + text + '</b>' +
      // lý do kỹ thuật (nếu có), để chụp màn hình gửi tác giả khi báo lỗi
      (r.detail ? '<p class="small muted">Chi tiết: ' + esc(r.detail) + '</p>' : '') +
      '<div class="ex-alert-actions">' +
      (retry ? '<button class="btn btn-sm" type="button" data-act="retry"><i data-lucide="rotate-cw"></i> Thử lại</button>' : '') +
      (r.error === 'API_KEY_INVALID' ? '<a class="btn btn-sm" href="#/lien-he?muc=de-ai"><i data-lucide="message-circle"></i> Báo cho tác giả</a>' : '') +
      '<button class="btn btn-sm" type="button" data-act="bank"><i data-lucide="database"></i> Làm đề từ ngân hàng câu hỏi</button>' +
      '</div></div></div>';
  }

  /* ================= BƯỚC 1: CHỌN ĐỀ ================= */
  R.add('/de-kiem-tra', function () {
    var cur = Exam.current(), L = Exam.LENGTHS;
    function seg(name, opts, val) {
      return '<div class="seg">' + opts.map(function (o) { return '<label><input type="radio" name="' + name + '" value="' + o[0] + '"' + (o[0] === val ? ' checked' : '') + '><span>' + o[1] + '</span></label>'; }).join('') + '</div>';
    }
    function count(k) { return L[k].p1 + L[k].p2 + L[k].p3; }
    var hist = Exam.history().slice().reverse();
    return {
      title: 'Đề kiểm tra AI',
      head: { title: 'Đề kiểm tra AI', crumbs: [{ label: 'Đề kiểm tra AI', href: '/de-kiem-tra' }],
        sub: 'Mỗi lần bấm, AI soạn một đề mới theo cấu trúc 3 phần của đề thi tốt nghiệp THPT từ năm 2025. Tên gọi trong đề theo chế độ <b>' + modeName(App.mode()) + '</b>.' },
      html:
        (cur && !cur.result ? '<div class="notice info"><i data-lucide="file-clock"></i><div>Bạn đang làm dở một đề. <a href="#/de-kiem-tra/lam-bai"><b>Làm tiếp</b></a></div></div>' : '') +
        '<div class="card glass">' +
        '<div class="field"><span class="field-label">Mức độ</span>' + seg('exLevel', Exam.LEVELS, CFG.level) +
        '<small class="muted">Đề tổng hợp trộn cả ba mức, khoảng 40% Nhận biết – 30% Thông hiểu – 30% Vận dụng.</small></div>' +
        '<div class="field"><span class="field-label">Độ dài</span>' + seg('exLength', [
          ['short', L.short.name + ' · ' + count('short') + ' câu'],
          ['full', L.full.name + ' · ' + count('full') + ' câu · ' + L.full.minutes + ' phút']], CFG.length) +
        '<small class="muted" id="exShape"></small></div>' +
        '<div class="row gap wrap ex-go"><button class="btn btn-primary btn-lg" id="exGen" type="button"><i data-lucide="file-plus-2"></i> <span>Tạo đề mới</span></button>' +
        '<button class="btn btn-lg" id="exBank" type="button"><i data-lucide="database"></i> Làm đề từ ngân hàng câu hỏi</button></div>' +
        '<div id="exMsg" aria-live="polite"></div>' +
        '<p class="small muted" id="exLeft"></p>' +
        '<p class="small muted">Web đối chiếu lại đáp án của AI với dữ liệu sẵn có trước khi hiện đề; câu nào không khớp sẽ được thay bằng câu từ ngân hàng ' + Quiz.BANK.length + ' câu hỏi.</p>' +
        '</div>' +
        (hist.length ? '<div class="card glass"><h3 class="card-title">Đề đã làm gần đây</h3><div class="table-wrap"><table class="table"><thead><tr><th>Thời gian</th><th>Đề</th><th>Nguồn</th><th>Điểm</th></tr></thead><tbody>' +
          hist.map(function (h) {
            var d = new Date(h.t);
            return '<tr><td>' + ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2) + ' ' + ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2) + '</td><td>' +
              esc(Exam.levelName(h.level)) + ' · ' + esc((L[h.length] || L.short).name) + ' · ' + (h.mode === 'iupac' ? 'IUPAC' : 'VI') + '</td><td>' + (h.source === 'ai' ? 'AI' : 'Ngân hàng') + '</td><td><b>' + vn(h.score) + '</b></td></tr>';
          }).join('') + '</tbody></table></div></div>' : ''),
      mount: function (el) {
        var gen = $('#exGen', el), bank = $('#exBank', el), msg = $('#exMsg', el), busy = false;
        function shape() {
          var x = L[CFG.length];
          $('#exShape', el).textContent = 'Phần I: ' + x.p1 + ' câu nhiều lựa chọn · Phần II: ' + x.p2 + ' câu đúng/sai · Phần III: ' + x.p3 + ' câu trả lời ngắn · ' + x.minutes + ' phút.';
          $('#exLeft', el).textContent = 'Mỗi người tạo được tối đa 10 đề AI mỗi giờ để dành lượt miễn phí cho các bạn khác. Bạn còn ' + Exam.callsLeft() + ' lượt.';
        }
        function show(r) { msg.innerHTML = errorBox(r); App.icons(); }
        function start(ex) { Exam.begin(ex); R.go('/de-kiem-tra/lam-bai'); }
        function lock(on) {
          busy = on; gen.disabled = on; bank.disabled = on;
          $('span', gen).textContent = on ? 'Đang tạo đề...' : 'Tạo đề mới';
        }
        function dropOld() { var c = Exam.current(); return !c || c.result || confirm('Bạn đang làm dở một đề. Tạo đề mới sẽ bỏ đề đó. Tiếp tục?'); }
        function useBank() { if (!busy && dropOld()) start(Exam.fromBank(CFG)); }
        function askAI() {
          if (busy || !dropOld()) return;
          lock(true); msg.innerHTML = '<p class="ex-wait"><i data-lucide="loader"></i> Đang tạo đề... AI cần khoảng 10–25 giây.</p>'; App.icons();
          Exam.generate(CFG).then(function (r) {
            if (!el.isConnected) return;               // người dùng đã rời trang trong lúc chờ
            lock(false); shape();
            if (r.exam) start(r.exam); else show(r);
          });
        }
        el.addEventListener('change', function (e) {
          if (e.target.name === 'exLevel') CFG.level = e.target.value;
          if (e.target.name === 'exLength') CFG.length = e.target.value;
          shape();
        });
        gen.addEventListener('click', askAI);
        bank.addEventListener('click', useBank);
        msg.addEventListener('click', function (e) {
          var b = e.target.closest('[data-act]'); if (!b) return;
          if (b.getAttribute('data-act') === 'retry') askAI(); else useBank();
        });
        shape();
        if (Exam.quotaBlocked()) show({ error: 'QUOTA_EXCEEDED' });   // đã biết hết lượt trong hôm nay → báo sẵn, không gọi API
      }
    };
  });

  /* ================= DỰNG TỜ ĐỀ (dùng cho cả màn hình và bản in) ================= */
  function tag(q) { return '<span class="tag ' + LV_CLASS[q.lv] + '">' + Exam.LV[q.lv] + '</span>'; }
  function sourceLine(ex) {
    return ex.source === 'ai'
      ? 'Đề do AI (Google Gemini) soạn' + (ex.replaced ? '; ' + ex.replaced + ' câu không qua được bước kiểm tra nên đã được thay bằng câu từ ngân hàng câu hỏi' : '') + '.'
      : 'Đề tạo từ ngân hàng câu hỏi (không dùng AI).';
  }
  function paper(ex, print) {
    var P = ex.parts, h = '';
    h += '<header class="exam-head"><div><b>COMPLEX CHEMISTRY 12</b><span>Đề luyện tập, không phải đề chính thức</span><span>Mã đề: ' + ex.id + '</span></div>' +
      '<div><b>' + ex.title + '</b><span>Môn: Hóa học 12 – Chủ đề: Phức chất</span><span><i>Thời gian làm bài: ' + ex.minutes + ' phút</i></span></div></header>';
    h += '<p class="exam-src">' + sourceLine(ex) + ' Mức độ: ' + Exam.levelName(ex.level) + '. Tên gọi theo ' + modeName(ex.mode) + '.</p>';
    if (print) h += '<p class="exam-name">Họ và tên: ........................................................ Lớp: ...............</p>';

    if (P.p1.length) {
      h += '<h3 class="exam-part">PHẦN I. Câu trắc nghiệm nhiều phương án lựa chọn.</h3><p class="exam-guide">Thí sinh trả lời từ câu 1 đến câu ' + P.p1.length + '. Mỗi câu hỏi thí sinh chỉ chọn một phương án.</p>';
      P.p1.forEach(function (q, i) {
        h += '<section class="exq" data-part="p1" data-i="' + i + '"><p class="exq-t"><b>Câu ' + (i + 1) + '.</b> ' + (print ? '' : tag(q) + ' ') + q.html + '</p><div class="exq-opts">' +
          q.options.map(function (o, j) {
            return print ? '<span class="exo"><b>' + 'ABCD'[j] + '.</b> ' + o + '</span>'
              : '<label class="exo"><input type="radio" name="p1-' + i + '" value="' + j + '"><span><b>' + 'ABCD'[j] + '.</b> ' + o + '</span></label>';
          }).join('') + '</div><div class="exq-sol" hidden></div></section>';
      });
    }
    if (P.p2.length) {
      h += '<h3 class="exam-part">PHẦN II. Câu trắc nghiệm đúng sai.</h3><p class="exam-guide">Thí sinh trả lời từ câu 1 đến câu ' + P.p2.length + '. Trong mỗi ý a), b), c), d) ở mỗi câu, thí sinh chọn đúng hoặc sai.</p>';
      P.p2.forEach(function (q, i) {
        h += '<section class="exq" data-part="p2" data-i="' + i + '"><p class="exq-t"><b>Câu ' + (i + 1) + '.</b> ' + (print ? '' : tag(q) + ' ') + q.html + '</p>' +
          q.statements.map(function (s, j) {
            return '<div class="tf-row" data-j="' + j + '"><span class="tf-text"><b>' + 'abcd'[j] + ')</b> ' + s.html + '</span>' +
              (print ? '<span class="tf-pick">Đúng ☐&nbsp;&nbsp; Sai ☐</span>'
                : '<span class="tf-pick"><label><input type="radio" name="p2-' + i + '-' + j + '" value="1"><span>Đúng</span></label><label><input type="radio" name="p2-' + i + '-' + j + '" value="0"><span>Sai</span></label></span>') +
              '<div class="exq-sol" hidden></div></div>';
          }).join('') + '</section>';
      });
    }
    if (P.p3.length) {
      h += '<h3 class="exam-part">PHẦN III. Câu trắc nghiệm trả lời ngắn.</h3><p class="exam-guide">Thí sinh trả lời từ câu 1 đến câu ' + P.p3.length + '. Đáp án là một số.</p>';
      P.p3.forEach(function (q, i) {
        h += '<section class="exq" data-part="p3" data-i="' + i + '"><p class="exq-t"><b>Câu ' + (i + 1) + '.</b> ' + (print ? '' : tag(q) + ' ') + q.html + '</p>' +
          (print ? '<p class="ex-blank">Đáp án: ..............................</p>'
            : '<label class="ex-short">Đáp án: <input class="input" type="text" inputmode="decimal" maxlength="8" autocomplete="off" name="p3-' + i + '" aria-label="Đáp án câu ' + (i + 1) + ' phần III"></label>') +
          '<div class="exq-sol" hidden></div></section>';
      });
    }
    h += '<p class="exam-end">------------------ HẾT ------------------</p>';
    if (!print) h += '<p class="small muted exam-foot">Đề do AI tạo, nếu thấy sai hãy <a href="#/lien-he?muc=de-ai">báo lỗi</a>.</p>';
    return h;
  }
  function printExam(ex) {
    var area = $('#printArea');
    area.innerHTML = '<div class="exam-paper print-exam">' + paper(ex, true) + '</div>';
    document.body.classList.add('printing');
    function done() { document.body.classList.remove('printing'); area.innerHTML = ''; window.removeEventListener('afterprint', done); }
    window.addEventListener('afterprint', done);
    setTimeout(function () { window.print(); }, 150);
  }

  /* ================= BƯỚC 2: LÀM BÀI → NỘP BÀI → XEM KẾT QUẢ ================= */
  R.add('/de-kiem-tra/lam-bai', function () {
    var S = Exam.current(), tick = null;
    if (!S) return { redirect: '/de-kiem-tra' };
    var ex = S.exam;
    return {
      title: 'Làm đề kiểm tra', wide: false, cls: 'exam-page',
      head: { title: ex.title, crumbs: [{ label: 'Đề kiểm tra AI', href: '/de-kiem-tra' }, { label: 'Làm bài', href: '/de-kiem-tra/lam-bai' }] },
      html:
        '<div class="exam-bar" id="exBar"><span class="q-timer" id="exTime"><i data-lucide="clock"></i> <b></b></span><span class="small muted" id="exDone"></span><span class="grow"></span>' +
        '<button class="btn btn-sm" id="exPrint" type="button"><i data-lucide="printer"></i> In đề</button>' +
        '<button class="btn btn-primary btn-sm" id="exSubmit" type="button">Nộp bài</button></div>' +
        '<div id="exResult"></div>' +
        '<article class="exam-paper card glass" id="exPaper">' + paper(ex, false) + '</article>',
      mount: function (el) {
        var paperEl = $('#exPaper', el), time = $('#exTime b', el);
        // khôi phục câu đã chọn (khi rời trang rồi quay lại)
        S.ans.p1.forEach(function (v, i) { if (v != null) { var r = $('input[name="p1-' + i + '"][value="' + v + '"]', paperEl); if (r) r.checked = true; } });
        S.ans.p2.forEach(function (row, i) { row.forEach(function (v, j) { if (v != null) { var r = $('input[name="p2-' + i + '-' + j + '"][value="' + (v ? 1 : 0) + '"]', paperEl); if (r) r.checked = true; } }); });
        S.ans.p3.forEach(function (v, i) { var r = $('input[name="p3-' + i + '"]', paperEl); if (r) r.value = v; });

        function progress() { $('#exDone', el).textContent = 'Đã trả lời ' + Exam.answered(ex, S.ans) + '/' + Exam.total(ex) + ' câu'; }
        function onInput(e) {
          var m = /^p([123])-(\d+)(?:-(\d))?$/.exec(e.target.name || ''); if (!m || S.result) return;
          if (m[1] === '1') S.ans.p1[+m[2]] = +e.target.value;
          else if (m[1] === '2') S.ans.p2[+m[2]][+m[3]] = e.target.value === '1';
          else S.ans.p3[+m[2]] = e.target.value;
          progress();
        }
        paperEl.addEventListener('change', onInput); paperEl.addEventListener('input', onInput);

        function sol(box, ok, html) { box.hidden = false; box.className = 'exq-sol ' + (ok ? 'ok' : 'bad'); box.innerHTML = html; }
        function showResult() {
          var r = S.result, P = ex.parts;
          clearInterval(tick);
          $$('input', paperEl).forEach(function (i) { i.disabled = true; });
          $('#exBar', el).classList.add('done'); $('#exSubmit', el).hidden = true; $('#exTime', el).hidden = true; $('#exDone', el).textContent = 'Đã nộp bài';
          P.p1.forEach(function (q, i) {
            var sec = $('.exq[data-part="p1"][data-i="' + i + '"]', paperEl), labs = $$('.exo', sec);
            labs[q.answer].classList.add('ok'); if (S.ans.p1[i] != null && !r.p1[i]) labs[S.ans.p1[i]].classList.add('bad');
            sol($('.exq-sol', sec), r.p1[i], '<b>' + (r.p1[i] ? 'Đúng.' : S.ans.p1[i] == null ? 'Chưa trả lời.' : 'Sai.') + ' Đáp án: ' + 'ABCD'[q.answer] + '.</b> ' + q.explain);
          });
          P.p2.forEach(function (q, i) {
            var sec = $('.exq[data-part="p2"][data-i="' + i + '"]', paperEl);
            q.statements.forEach(function (s, j) {
              var ok = r.p2[i].oks[j];
              sol($('.tf-row[data-j="' + j + '"] .exq-sol', sec), ok, '<b>' + (ok ? 'Đúng.' : S.ans.p2[i][j] == null ? 'Chưa trả lời.' : 'Sai.') + ' Ý này ' + (s.answer ? 'ĐÚNG' : 'SAI') + '.</b> ' + s.explain);
            });
            $('.exq-t', sec).insertAdjacentHTML('beforeend', ' <span class="ex-pts">(' + r.p2[i].n + '/4 ý đúng → ' + vn(r.p2[i].pts) + ' điểm)</span>');
          });
          P.p3.forEach(function (q, i) {
            var sec = $('.exq[data-part="p3"][data-i="' + i + '"]', paperEl);
            sol($('.exq-sol', sec), r.p3[i], '<b>' + (r.p3[i] ? 'Đúng.' : String(S.ans.p3[i]).trim() === '' ? 'Chưa trả lời.' : 'Sai.') + ' Đáp án: ' + vn(q.answer) + '.</b> ' + q.explain);
          });
          var c1 = r.p1.filter(Boolean).length, c3 = r.p3.filter(Boolean).length, pts2 = r.p2.reduce(function (s, x) { return s + x.pts; }, 0);
          $('#exResult', el).innerHTML = '<div class="card glass ex-score"><div><div class="big-score">' + vn(r.score) + '<small> / 10</small></div></div>' +
            '<div class="ex-score-detail"><p>Phần I: đúng <b>' + c1 + '/' + P.p1.length + '</b> câu (0,25 điểm mỗi câu).</p>' +
            '<p>Phần II: <b>' + vn(Math.round(pts2 * 100) / 100) + '/' + P.p2.length + '</b> điểm (mỗi câu: đúng 1 ý 0,1 – 2 ý 0,25 – 3 ý 0,5 – 4 ý 1 điểm).</p>' +
            '<p>Phần III: đúng <b>' + c3 + '/' + P.p3.length + '</b> câu (0,25 điểm mỗi câu).</p>' +
            '<p class="small muted">Điểm thô ' + vn(Math.round(r.raw * 100) / 100) + '/' + vn(r.max) + ', quy về thang 10. Đáp án và lời giải nằm ngay dưới từng câu.</p>' +
            '<div class="row gap wrap"><a class="btn btn-primary" href="#/de-kiem-tra">Tạo đề khác</a><a class="btn" href="#/lien-he?muc=de-ai">Báo câu sai</a></div></div></div>';
          App.icons();
        }
        function submit(auto) {
          if (S.result) return;
          var left = Exam.total(ex) - Exam.answered(ex, S.ans);
          if (!auto && left > 0 && !confirm('Bạn còn ' + left + ' câu chưa trả lời xong. Vẫn nộp bài?')) return;
          Exam.submit(); showResult(); window.scrollTo(0, 0);
          if (auto) App.toast('Hết giờ làm bài, web đã tự nộp.', 'alarm-clock');
        }
        function clock() {
          var s = Math.max(0, Math.round((S.deadline - Date.now()) / 1000));
          time.textContent = Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2);
          $('#exTime', el).classList.toggle('low', s <= 60);
          if (s <= 0) submit(true);
        }
        $('#exSubmit', el).addEventListener('click', function () { submit(false); });
        $('#exPrint', el).addEventListener('click', function () { printExam(ex); });
        progress();
        if (S.result) showResult(); else { clock(); tick = setInterval(clock, 500); }
        this._stop = function () { clearInterval(tick); };
      },
      unmount: function () { if (this._stop) this._stop(); }
    };
  });
})();

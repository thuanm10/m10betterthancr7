/* =====================================================================
 * TRANG "BÀI TẬP" – hệ thống bài tập theo cấu trúc đề tốt nghiệp THPT
 *   #/bai-tap            danh sách bài và phần
 *   #/bai-tap/28-1       Bài 28, Phần 1 (…-2: đúng/sai, …-3: trả lời ngắn)
 * Dữ liệu câu hỏi + lời giải: js/baitap-28.js, js/baitap-29.js (biến BAITAP).
 * Làm câu nào web chấm ngay câu đó và hiện lời giải.
 * ===================================================================== */
(function () {
  'use strict';
  var $ = App.$, $$ = App.$$, esc = App.esc, R = Router;
  var LV = ['', 'Nhận biết', 'Thông hiểu', 'Vận dụng'];
  var PART = {
    mcq: ['Phần 1', 'Trắc nghiệm nhiều phương án lựa chọn', 'Mỗi câu chỉ chọn một phương án. Chọn xong web chấm ngay và hiện lời giải.'],
    tf: ['Phần 2', 'Trắc nghiệm đúng sai', 'Trong mỗi ý a), b), c), d) ở mỗi câu, chọn Đúng hoặc Sai.'],
    short: ['Phần 3', 'Trắc nghiệm trả lời ngắn', 'Gõ đáp số rồi bấm Kiểm tra. Số thập phân dùng dấu phẩy hoặc dấu chấm đều được.']
  };
  function total() { var n = 0; BAITAP.forEach(function (b) { b.parts.forEach(function (p) { n += p.items.length; }); }); return n; }
  function img(q) { return q.img ? '<p class="bt-img"><img src="img/bai-tap/' + q.img + '" alt="Hình minh hoạ của câu hỏi" loading="lazy"></p>' : ''; }
  // So đáp số trả lời ngắn: số thì so giá trị (cho phép lệch rất nhỏ), chữ thì so sau khi bỏ dấu cách, dấu phẩy
  function shortOk(user, ans) {
    var norm = function (s) { return String(s).trim().toLowerCase().replace(/[−–]/g, '-').replace(/\s+/g, ''); };
    var u = norm(user), a = norm(ans), nu = Number(u.replace(',', '.')), na = Number(a.replace(',', '.'));
    if (u === '') return false;
    if (isFinite(na) && a !== '') return isFinite(nu) && Math.abs(nu - na) <= Math.max(0.011, Math.abs(na) * 0.005) * (/[.,]/.test(a) ? 1 : 0) + 1e-9;
    return u.replace(/[^a-z0-9]/g, '') === a.replace(/[^a-z0-9]/g, '');
  }

  /* ================= DANH SÁCH ================= */
  R.add('/bai-tap', function () {
    return {
      title: 'Bài tập',
      head: { title: 'Bài tập về phức chất', crumbs: [{ label: 'Bài tập', href: '/bai-tap' }],
        sub: total() + ' câu hỏi theo cấu trúc đề thi tốt nghiệp THPT, lấy từ đề các Sở, đề thi tốt nghiệp và sách bài tập. Câu nào cũng có đáp án và lời giải.' },
      html: BAITAP.map(function (b) {
        return '<div class="card glass"><h3 class="card-title">' + esc(b.title) + '</h3><ul class="more-list bt-list">' + b.parts.map(function (p, i) {
          var lv = [1, 2, 3].map(function (k) { var n = p.items.filter(function (x) { return x.lv === k; }).length; return n ? LV[k] + ': ' + n : ''; }).filter(Boolean).join(' · ');
          return '<li><a href="#/bai-tap/' + b.id + '-' + (i + 1) + '"><b>' + PART[p.type][0] + '. ' + PART[p.type][1] + '</b><span>' + p.items.length + ' câu' + (lv ? ' (' + lv + ')' : '') + '</span></a></li>';
        }).join('') + '</ul></div>';
      }).join('') +
        '<p class="small muted">Tên chất trong phần này giữ theo danh pháp trong tài liệu gốc (copper, iron, sodium…). Nếu thấy đáp án hoặc lời giải chưa đúng, hãy <a href="#/lien-he">báo lỗi</a>.</p>'
    };
  });

  /* ================= LÀM BÀI ================= */
  R.add('/bai-tap/:id', function (params) {
    var m = /^(\d+)-([123])$/.exec(params.id), bai = m && BAITAP.filter(function (b) { return b.id === m[1]; })[0], part = bai && bai.parts[+m[2] - 1];
    if (!part) return Pages.notFound('/bai-tap/' + params.id, 'Không có phần bài tập này.');
    var P = PART[part.type], idx = BAITAP.indexOf(bai), pi = +m[2] - 1;
    // phần trước / phần sau (đi qua cả hai bài)
    var flat = []; BAITAP.forEach(function (b) { b.parts.forEach(function (p, i) { flat.push({ href: '/bai-tap/' + b.id + '-' + (i + 1), label: 'Bài ' + b.id + ' – ' + PART[p.type][0] }); }); });
    var pos = idx * 3 + pi, prev = flat[pos - 1], next = flat[pos + 1];

    function item(q, i) {
      var h = '<section class="exq" data-i="' + i + '"><p class="exq-t"><b>Câu ' + (i + 1) + '.</b> ' + (q.lv ? '<span class="tag lv' + q.lv + '">' + LV[q.lv] + '</span> ' : '') +
        (q.s ? '<span class="bt-src">(' + esc(q.s) + ')</span> ' : '') + q.q + '</p>' + img(q);
      if (part.type === 'mcq') {
        h += '<div class="exq-opts">' + q.o.map(function (o, j) { return '<button class="exo bt-opt" type="button" data-o="' + j + '"><span><b>' + 'ABCD'[j] + '.</b> ' + o + '</span></button>'; }).join('') + '</div>';
      } else if (part.type === 'tf') {
        h += q.t.map(function (t, j) {
          return '<div class="tf-row" data-j="' + j + '"><span class="tf-text"><b>' + 'abcd'[j] + ')</b> ' + t[0] + '</span><span class="tf-pick">' +
            '<label><input type="radio" name="bt-' + i + '-' + j + '" value="1"><span>Đúng</span></label><label><input type="radio" name="bt-' + i + '-' + j + '" value="0"><span>Sai</span></label></span>' +
            '<div class="exq-sol" hidden></div></div>';
        }).join('');
      } else {
        h += '<form class="ex-short bt-short"><label for="bt-in-' + i + '">Đáp số:</label><input class="input" id="bt-in-' + i + '" type="text" inputmode="text" maxlength="12" autocomplete="off"><button class="btn btn-sm" type="submit">Kiểm tra</button></form>';
      }
      return h + (part.type === 'tf' ? '' : '<div class="exq-sol" hidden></div>') + '<p class="bt-more"><button class="link-btn" type="button" data-show>Xem đáp án và lời giải</button></p></section>';
    }
    var body = '', last = 0;
    part.items.forEach(function (q, i) {
      if (q.lv && q.lv !== last) { body += '<h3 class="exam-part">Mức ' + q.lv + ': ' + LV[q.lv] + '</h3>'; last = q.lv; }
      body += item(q, i);
    });

    return {
      title: P[0] + ' – ' + bai.title,
      head: { title: P[0] + '. ' + P[1], crumbs: [{ label: 'Bài tập', href: '/bai-tap' }, { label: 'Bài ' + bai.id + ' – ' + P[0], href: '/bai-tap/' + params.id }], sub: esc(bai.title) + '. ' + P[2] },
      html: '<div class="exam-bar"><span id="btScore" class="small"></span><span class="grow"></span><button class="btn btn-sm" type="button" id="btReset"><i data-lucide="rotate-ccw"></i> Làm lại từ đầu</button></div>' +
        '<article class="exam-paper card glass" id="btPaper">' + body + '</article>' +
        '<div class="pager">' + (prev ? '<a class="btn btn-ghost" href="#' + prev.href + '"><i data-lucide="chevron-left"></i> ' + prev.label + '</a>' : '<span></span>') +
        '<a class="btn btn-ghost" href="#/bai-tap">Danh sách bài tập</a>' +
        (next ? '<a class="btn btn-ghost" href="#' + next.href + '">' + next.label + ' <i data-lucide="chevron-right"></i></a>' : '<span></span>') + '</div>',
      mount: function (el) {
        var paper = $('#btPaper', el), done = {}, right = 0;   // done[i] = true khi câu i đã chấm xong hoặc đã xem lời giải
        function score() { $('#btScore', el).innerHTML = 'Đã làm <b>' + Object.keys(done).length + '/' + part.items.length + '</b> câu · đúng <b>' + right + '</b> câu'; }
        function sol(box, ok, html) { box.hidden = false; box.className = 'exq-sol ' + (ok === null ? '' : ok ? 'ok' : 'bad'); box.innerHTML = html; }
        function finish(sec, i, ok) {
          if (done[i]) return;
          done[i] = true; if (ok) right++;
          var more = $('.bt-more', sec); if (more) more.remove();
          score();
        }
        function mark(ok) { return ok === null ? '' : '<b>' + (ok ? 'Đúng.' : 'Sai.') + '</b> '; }
        // hiện đáp án + lời giải của cả câu; ok = null nghĩa là người dùng bấm "xem lời giải" mà chưa làm
        function reveal(sec, i, ok, pick) {
          var q = part.items[i];
          if (part.type === 'mcq') {
            var btns = $$('.bt-opt', sec); btns.forEach(function (b) { b.disabled = true; });
            btns[q.a].classList.add('ok'); if (pick != null && pick !== q.a) btns[pick].classList.add('bad');
            sol($('.exq-sol', sec), ok, mark(ok) + '<b>Đáp án: ' + 'ABCD'[q.a] + '.</b> ' + q.e);
          } else if (part.type === 'short') {
            $$('input,button', $('.bt-short', sec)).forEach(function (x) { x.disabled = true; });
            sol($('.exq-sol', sec), ok, mark(ok) + '<b>Đáp số: ' + esc(q.a.replace('-', '−')) + '.</b> ' + q.e);
          } else {
            $$('.tf-row', sec).forEach(function (row, j) {
              if ($('.exq-sol', row).hidden) { $$('input', row).forEach(function (x) { x.disabled = true; }); sol($('.exq-sol', row), null, '<b>Ý này ' + (q.t[j][1] ? 'ĐÚNG' : 'SAI') + '.</b> ' + q.t[j][2]); }
            });
          }
          finish(sec, i, !!ok);
        }
        paper.addEventListener('click', function (e) {
          var sec = e.target.closest('.exq'); if (!sec) return;
          var i = +sec.getAttribute('data-i'), opt = e.target.closest('.bt-opt');
          if (opt && !opt.disabled) { var pick = +opt.getAttribute('data-o'); reveal(sec, i, pick === part.items[i].a, pick); }
          else if (e.target.closest('[data-show]')) reveal(sec, i, null);
        });
        paper.addEventListener('change', function (e) {          // Phần 2: chấm từng ý ngay khi chọn
          var row = e.target.closest('.tf-row'); if (!row) return;
          var sec = row.closest('.exq'), i = +sec.getAttribute('data-i'), j = +row.getAttribute('data-j'), t = part.items[i].t[j];
          var ok = (e.target.value === '1') === t[1];
          row.setAttribute('data-ok', ok ? '1' : '0');
          $$('input', row).forEach(function (x) { x.disabled = true; });
          sol($('.exq-sol', row), ok, mark(ok) + '<b>Ý này ' + (t[1] ? 'ĐÚNG' : 'SAI') + '.</b> ' + t[2]);
          var rows = $$('.tf-row', sec);
          if (rows.every(function (r) { return r.hasAttribute('data-ok') || !$('.exq-sol', r).hidden; })) finish(sec, i, rows.every(function (r) { return r.getAttribute('data-ok') === '1'; }));
        });
        paper.addEventListener('submit', function (e) {
          e.preventDefault();
          var sec = e.target.closest('.exq'), i = +sec.getAttribute('data-i'), v = $('input', e.target).value;
          if (!v.trim()) { $('input', e.target).focus(); return; }
          reveal(sec, i, shortOk(v, part.items[i].a));
        });
        $('#btReset', el).addEventListener('click', function () {
          if (Object.keys(done).length && !confirm('Xoá hết phần đã làm ở trang này và làm lại từ đầu?')) return;
          Router.go('/bai-tap/' + params.id + '?lai=' + Date.now(), { replace: true });
        });
        score();
      }
    };
  });

  // dùng cho tools/kiem-tra-de.html
  window.BaiTapCheck = { shortOk: shortOk };
})();

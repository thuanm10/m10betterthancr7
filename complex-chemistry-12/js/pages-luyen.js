/* =====================================================================
 * CÁC TRANG LUYỆN: Luyện phát âm (chọn chất → đọc → kết quả),
 * Luyện tập (cấu hình → làm bài → kết quả), Flashcard.
 * Điểm và tiến độ lưu riêng cho từng chế độ VI / IUPAC.
 * ===================================================================== */
var Pages = window.Pages || {};
(function () {
  'use strict';
  var $ = App.$, $$ = App.$$, esc = App.esc, R = Router;
  function fmtTime(s) { return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }
  function iu() { return App.mode() === 'iupac'; }

  /* ================= LUYỆN PHÁT ÂM ================= */
  var VS = { result: null };
  function voiceNotices() {
    var h = '';
    if (!Speech.canListen()) h += '<div class="notice warn"><i data-lucide="triangle-alert"></i><div><b>Trình duyệt chưa hỗ trợ nhận dạng giọng nói.</b> Hãy dùng Google Chrome hoặc Microsoft Edge (máy tính hoặc Android) và mở web qua https. Bạn vẫn có thể dùng ô <b>Gõ thay thế</b>.</div></div>';
    if (!iu() && !Speech.hasVoice('vi')) h += '<div class="notice info"><i data-lucide="volume-x"></i><div><b>Máy chưa có giọng đọc tiếng Việt</b> nên nút “Nghe mẫu” có thể đọc sai. <a href="#/cai-dat">Xem cách cài thêm giọng tiếng Việt</a>.</div></div>';
    return h;
  }
  function bestVoice() { return App.Store.get(App.mkey('voice'), {}); }

  R.add('/phat-am', function (params, query) {
    return {
      title: 'Luyện phát âm',
      head: { title: 'Luyện phát âm', icon: 'mic', color: 'c3', crumbs: [{ label: 'Luyện phát âm', href: '/phat-am' }],
        sub: 'Bước 1: chọn phức chất muốn luyện đọc. ' + (iu() ? 'Bạn đang ở chế độ <b>IUPAC</b> – đọc tên tiếng Anh.' : 'Bạn đang ở chế độ <b>tiếng Việt (SGK)</b>.') },
      html: voiceNotices() +
        '<div class="theory-tools"><div class="input-wrap grow"><i data-lucide="search"></i><input id="vSearch" class="input" placeholder="Tìm phức chất…" aria-label="Tìm phức chất" value="' + esc(query.q || '') + '"></div>' +
        '<button class="btn btn-primary" id="vRandom"><i data-lucide="shuffle"></i> Chọn ngẫu nhiên</button></div>' +
        '<div class="pick-grid" id="vGrid"></div>',
      mount: function (el) {
        var best = bestVoice(), inp = $('#vSearch', el);
        function draw() {
          var q = Chem.deaccent(inp.value.trim()).replace(/[^a-z0-9]/g, '');
          $('#vGrid', el).innerHTML = App.lib().filter(function (a) {
            return !q || Chem.deaccent(a.ascii + App.pName(a)).replace(/[^a-z0-9]/g, '').indexOf(q) >= 0;
          }).map(function (a) {
            var b = best[a.slug];
            return '<a class="pick glass" href="#/phat-am/' + a.slug + '"><span class="f">' + a.formula + '</span><span class="pk-n">' + esc(App.pName(a)) + '</span>' +
              (b != null ? '<span class="pk-b ' + (b >= 85 ? 'ok' : b >= 60 ? 'near' : 'bad') + '">' + b + '%</span>' : '') + '</a>';
          }).join('') || '<p class="muted">Không tìm thấy phức chất phù hợp.</p>';
        }
        inp.addEventListener('input', draw);
        $('#vRandom', el).addEventListener('click', function () { var L = App.lib(); R.go('/phat-am/' + L[Math.floor(Math.random() * L.length)].slug); });
        draw();
      }
    };
  });

  R.add('/phat-am/:id', function (params) {
    var a = App.bySlug(params.id);
    if (!a) return Pages.notFound('/phat-am/' + params.id, 'Không có phức chất này.');
    var lang = App.pLang(), toks = Speech.expectedTokens(a, lang);
    return {
      title: 'Luyện đọc ' + a.ascii,
      head: { title: 'Luyện đọc', crumbs: [{ label: 'Luyện phát âm', href: '/phat-am' }, { label: a.formula, href: '/phat-am/' + a.slug }],
        sub: 'Bước 2: nghe mẫu, rồi bấm micro và đọc to tên dưới đây.' },
      html: voiceNotices() +
        '<div class="card glass read-card">' +
        '<div class="target-box"><div class="target-formula f">' + a.formula + '</div>' +
        '<div class="target-name">' + esc(App.pName(a)) + '</div>' +
        '<div class="syll">' + toks.map(function (t) { return '<span class="sy"><b>' + esc(t.show) + '</b>' + (t.phon ? '<small>' + esc(t.phon) + '</small>' : '') + '</span>'; }).join('<i>·</i>') + '</div>' +
        (lang === 'en' ? '<p class="small muted">Phiên âm: ' + esc(a.phonetic) + ' · Số La Mã đọc thành chữ: (II) = “two”.</p>' : '<p class="small muted">Chữ “ion” ở đầu tên có thể đọc hoặc bỏ qua.</p>') +
        '</div>' +
        '<div class="row gap wrap center">' +
        '<button class="btn btn-soft" data-speak="' + esc(App.pSpeak(a)) + '" data-lang="' + lang + '"><i data-lucide="volume-2"></i> Nghe mẫu</button>' +
        '<button class="btn btn-soft" data-speak="' + esc(App.pSpeak(a)) + '" data-lang="' + lang + '" data-rate="0.7"><i data-lucide="snail"></i> Nghe chậm</button>' +
        '<button class="btn btn-primary btn-lg mic-btn" id="vRec"><i data-lucide="mic"></i> <span>Bắt đầu đọc</span></button></div>' +
        '<p class="center muted small" id="vLive" aria-live="polite"></p>' +
        '<div class="fallback"><label for="vTyped" class="small muted"><i data-lucide="keyboard"></i> Gõ thay thế (khi không dùng được micro)</label>' +
        '<form class="input-row" id="vTypedForm"><input id="vTyped" class="input" placeholder="Gõ đúng như bạn sẽ đọc…"><button class="btn btn-soft" type="submit">Chấm điểm</button></form></div>' +
        '</div>',
      mount: function (el) {
        var rec = $('#vRec', el), live = $('#vLive', el);
        function done(heard) {
          VS.result = { slug: a.slug, heard: heard, lang: lang };
          var best = bestVoice(), pct = Speech.score(a, heard, lang).pct;
          if (best[a.slug] == null || pct > best[a.slug]) { best[a.slug] = pct; App.Store.set(App.mkey('voice'), best); }
          R.go('/phat-am/' + a.slug + '/ket-qua');
        }
        function reset() { rec.classList.remove('recording'); rec.querySelector('span').textContent = 'Bắt đầu đọc'; }
        rec.addEventListener('click', function () {
          if (!Speech.canListen()) { App.toast('Trình duyệt chưa hỗ trợ micro – dùng ô “Gõ thay thế”.', 'mic-off'); $('#vTyped', el).focus(); return; }
          if (rec.classList.contains('recording')) { Speech.stop(); return; }
          rec.classList.add('recording'); rec.querySelector('span').textContent = 'Đang nghe… (bấm để dừng)';
          live.textContent = 'Hãy đọc: ' + App.pName(a);
          Speech.listen({
            lang: lang,
            onInterim: function (t) { live.textContent = 'Đang nghe: “' + t + '”'; },
            onResult: function (alts) {
              var best = alts[0], bp = -1; // chọn phương án nhận dạng khớp nhất
              alts.forEach(function (al) { var p = Speech.score(a, al, lang).pct; if (p > bp) { bp = p; best = al; } });
              done(best);
            },
            onError: function (m) { live.textContent = m; },
            onEnd: reset
          });
        });
        $('#vTypedForm', el).addEventListener('submit', function (e) {
          e.preventDefault(); var v = $('#vTyped', el).value.trim();
          if (!v) { App.toast('Hãy gõ tên bạn định đọc.', 'keyboard'); return; }
          done(v);
        });
      }
    };
  });

  R.add('/phat-am/:id/ket-qua', function (params) {
    var a = App.bySlug(params.id), r = VS.result;
    if (!a) return Pages.notFound('/phat-am/' + params.id + '/ket-qua');
    if (!r || r.slug !== a.slug || r.lang !== App.pLang()) return { redirect: '/phat-am/' + params.id };
    var s = Speech.score(a, r.heard, r.lang), n = Speech.nearest(r.heard, r.lang);
    var col = s.pct >= 85 ? 'var(--ok)' : s.pct >= 60 ? 'var(--near)' : 'var(--bad)';
    var msg = s.pct >= 90 ? 'Xuất sắc! Phát âm rất chuẩn.' : s.pct >= 75 ? 'Tốt lắm! Chỉ cần chỉnh vài âm.' : s.pct >= 50 ? 'Khá ổn, hãy luyện thêm các âm màu vàng/đỏ.' : 'Chưa khớp – nghe mẫu rồi đọc chậm, rõ từng phần.';
    var bad = s.tokens.filter(function (t) { return t.cls !== 'ok'; });
    var L = App.lib(), next = L[(L.indexOf(a) + 1) % L.length];
    return {
      title: 'Kết quả phát âm',
      head: { title: 'Kết quả chấm điểm', crumbs: [{ label: 'Luyện phát âm', href: '/phat-am' }, { label: a.formula, href: '/phat-am/' + a.slug }, { label: 'Kết quả', href: '/phat-am/' + a.slug + '/ket-qua' }],
        sub: 'Bước 3: xem âm nào đúng, âm nào cần sửa.' },
      html:
        '<div class="card glass">' +
        '<div class="score-row"><div class="ring" style="--p:' + s.pct + ';--col:' + col + '"><b>' + s.pct + '%</b></div>' +
        '<div class="heard"><b>' + msg + '</b><p class="small">Cần đọc: <b>' + esc(App.pName(a)) + '</b><br>Web nghe được: <q>' + esc(r.heard) + '</q></p></div></div>' +
        '<div class="tokens">' + s.tokens.map(function (t) { return '<span class="tok ' + t.cls + '" title="Giống ' + Math.round(t.sim * 100) + '%">' + esc(t.tok.show) + (t.tok.phon ? '<small>' + esc(t.tok.phon) + '</small>' : '') + '</span>'; }).join('') + '</div>' +
        '<div class="legend small"><span><i class="dot ok"></i> đúng</span><span><i class="dot near"></i> gần đúng</span><span><i class="dot bad"></i> sai / thiếu</span></div>' +
        (bad.length ? '<h3 class="card-title" style="margin-top:18px"><i data-lucide="lightbulb"></i> Gợi ý sửa</h3><ul class="tips-list">' + bad.slice(0, 6).map(function (t) { return '<li>' + Speech.hintFor(t, r.lang) + '</li>'; }).join('') + '</ul>' : '') +
        (n && n.a !== a ? '<div class="notice info" style="margin-top:14px"><i data-lucide="info"></i><div>Câu bạn đọc giống nhất với <b class="f">' + n.a.formula + '</b> (' + esc(App.pName(n.a)) + ', ' + Math.round(n.s * 100) + '%). <a href="#/phat-am/' + n.a.slug + '">Luyện chất này</a></div></div>'
          : n ? '<p class="small muted" style="margin-top:12px">Phức chất gần nhất với câu bạn đọc: <b class="f">' + n.a.formula + '</b> (' + Math.round(n.s * 100) + '%) – đúng chất bạn chọn.</p>' : '') +
        '</div>' +
        '<div class="pager"><a class="btn btn-primary" href="#/phat-am/' + a.slug + '"><i data-lucide="repeat"></i> Đọc lại</a>' +
        '<button class="btn btn-soft" data-speak="' + esc(App.pSpeak(a)) + '" data-lang="' + r.lang + '"><i data-lucide="volume-2"></i> Nghe mẫu</button>' +
        '<a class="btn btn-ghost" href="#/phat-am/' + next.slug + '">Chất tiếp theo <i data-lucide="chevron-right"></i></a></div>'
    };
  });

  /* ================= LUYỆN TẬP ================= */
  var CFG = { types: ['f2n', 'n2f', 'os', 'lig', 'cn'], lv: 1, n: 10, timer: false };
  var chart = null;
  function historyHTML() {
    return '<div class="card glass"><h3 class="card-title"><i data-lucide="chart-line"></i> Lịch sử & tiến bộ – chế độ ' + App.modeLabel() + '</h3>' +
      '<div class="chart-wrap"><canvas id="historyChart" aria-label="Biểu đồ tiến bộ"></canvas><p class="muted center" id="historyEmpty">Chưa có lần làm bài nào ở chế độ này. Hãy làm bài đầu tiên nhé!</p></div>' +
      '<div class="table-wrap" id="histWrap"><table class="table small"><thead><tr><th>Lần</th><th>Thời điểm</th><th>Mức độ</th><th>Điểm</th><th>Đúng</th><th>Thời gian</th></tr></thead><tbody id="histBody"></tbody></table></div>' +
      '<button class="btn btn-ghost btn-sm" id="historyClear"><i data-lucide="trash-2"></i> Xóa lịch sử chế độ này</button></div>';
  }
  function drawHistory(el) {
    var hist = App.Store.get(App.mkey('history'), []);
    $('#historyEmpty', el).hidden = hist.length > 0;
    $('#histWrap', el).hidden = !hist.length; $('#historyClear', el).hidden = !hist.length;
    var p2 = function (x) { return ('0' + x).slice(-2); };
    $('#histBody', el).innerHTML = hist.slice().reverse().slice(0, 10).map(function (h, i) {
      var d = new Date(h.t);
      return '<tr><td>' + (hist.length - i) + '</td><td>' + p2(d.getDate()) + '/' + p2(d.getMonth() + 1) + ' ' + p2(d.getHours()) + ':' + p2(d.getMinutes()) + '</td><td>' + Quiz.LV_NAME[h.lv] + '</td><td><b>' + String(h.score).replace('.', ',') + '</b></td><td>' + h.c + '/' + h.n + '</td><td>' + fmtTime(h.sec) + '</td></tr>';
    }).join('');
    if (chart) { chart.destroy(); chart = null; }
    if (!window.Chart || !hist.length) return;
    var cs = getComputedStyle(document.documentElement), txt = cs.getPropertyValue('--muted').trim(), grid = cs.getPropertyValue('--border').trim(), acc = cs.getPropertyValue('--accent').trim() || '#7c3aed';
    chart = new Chart($('#historyChart', el), {
      type: 'line',
      data: { labels: hist.map(function (h, i) { return 'Lần ' + (i + 1); }), datasets: [{ label: 'Tỉ lệ đúng (%)', data: hist.map(function (h) { return Math.round(h.c / h.n * 100); }), borderColor: acc, backgroundColor: 'rgba(124,58,237,.12)', fill: true, tension: .35, pointRadius: 4, pointBackgroundColor: acc }] },
      options: {
        responsive: true, maintainAspectRatio: false, animation: { duration: 700 },
        scales: { y: { min: 0, max: 100, ticks: { color: txt, callback: function (v) { return v + '%'; } }, grid: { color: grid } }, x: { ticks: { color: txt }, grid: { display: false } } },
        plugins: { legend: { display: false }, tooltip: { callbacks: { afterLabel: function (c) { var h = hist[c.dataIndex]; return 'Điểm ' + h.score + ' · ' + Quiz.LV_NAME[h.lv]; } } } }
      }
    });
  }

  R.add('/luyen-tap', function () {
    var s = Quiz.session();
    return {
      title: 'Luyện tập',
      head: { title: 'Luyện tập', icon: 'target', color: 'c4', crumbs: [{ label: 'Luyện tập', href: '/luyen-tap' }],
        sub: 'Bước 1: chọn dạng bài, mức độ và số câu. Câu hỏi về tên dùng chế độ <b>' + (iu() ? 'IUPAC' : 'tiếng Việt (SGK)') + '</b>.' },
      html:
        (s ? '<div class="notice info"><i data-lucide="circle-play"></i><div><b>Bạn đang làm dở một bài (' + (s.answers.filter(Boolean).length) + '/' + s.list.length + ' câu).</b> <a href="#/luyen-tap/lam-bai">Tiếp tục bài đang làm</a></div></div>' : '') +
        '<div class="card glass"><div class="setup-grid">' +
        '<fieldset class="field"><legend>Dạng bài</legend><div class="check-grid">' + Quiz.TYPES.map(function (t, i) {
          return '<label class="check"><input type="checkbox" value="' + t.id + '"' + (CFG.types.indexOf(t.id) >= 0 ? ' checked' : '') + '><span>' + (i + 1) + '. ' + t.name + '<small>' + t.desc.replace('SGK', iu() ? 'IUPAC' : 'SGK') + '</small></span></label>';
        }).join('') + '</div></fieldset>' +
        '<div class="setup-side">' +
        '<fieldset class="field"><legend>Mức độ</legend><div class="seg">' + [1, 2, 3].map(function (v) { return '<label><input type="radio" name="lv" value="' + v + '"' + (CFG.lv === v ? ' checked' : '') + '><span>' + Quiz.LV_NAME[v] + '</span></label>'; }).join('') + '</div></fieldset>' +
        '<fieldset class="field"><legend>Số câu</legend><div class="seg">' + [5, 10, 15, 20].map(function (v) { return '<label><input type="radio" name="cnt" value="' + v + '"' + (CFG.n === v ? ' checked' : '') + '><span>' + v + '</span></label>'; }).join('') + '</div></fieldset>' +
        '<label class="switch"><input type="checkbox" id="qTimerSw"' + (CFG.timer ? ' checked' : '') + '><span class="track"><span class="thumb"></span></span><span>Đồng hồ đếm ngược (30 giây/câu, 60 giây với câu tự nhập)</span></label>' +
        '<button class="btn btn-primary btn-lg w100" id="qStart"><i data-lucide="play"></i> Bắt đầu làm bài</button>' +
        '<p class="muted small">Ngân hàng: ' + Quiz.BANK.length + ' câu hỏi sinh từ ' + App.lib().length + ' phức chất × 6 dạng bài.</p>' +
        '</div></div></div>' + historyHTML(),
      mount: function (el) {
        $('#qStart', el).addEventListener('click', function () {
          CFG.types = $$('.check input:checked', el).map(function (i) { return i.value; });
          if (!CFG.types.length) { App.toast('Hãy chọn ít nhất một dạng bài.', 'triangle-alert'); return; }
          CFG.lv = +$('input[name="lv"]:checked', el).value; CFG.n = +$('input[name="cnt"]:checked', el).value; CFG.timer = $('#qTimerSw', el).checked;
          Quiz.start(CFG); R.go('/luyen-tap/lam-bai');
        });
        $('#historyClear', el).addEventListener('click', function () {
          if (confirm('Xóa toàn bộ lịch sử làm bài của chế độ ' + App.modeLabel() + '?')) { App.Store.set(App.mkey('history'), []); drawHistory(el); }
        });
        drawHistory(el);
      },
      unmount: function () { if (chart) { chart.destroy(); chart = null; } }
    };
  });

  var timerId = null;
  R.add('/luyen-tap/lam-bai', function () {
    if (!Quiz.session()) return { redirect: Quiz.last() ? '/luyen-tap/ket-qua' : '/luyen-tap' };
    return {
      title: 'Làm bài',
      head: { title: 'Làm bài', crumbs: [{ label: 'Luyện tập', href: '/luyen-tap' }, { label: 'Làm bài', href: '/luyen-tap/lam-bai' }] },
      html: '<div class="card glass q-card" id="qBox" aria-live="polite"></div>',
      mount: function (el) {
        var box = $('#qBox', el);
        function render() {
          var S = Quiz.session(), Q = S.list[S.i], type = Quiz.TYPES.filter(function (t) { return t.id === Q.q.type; })[0], A = S.answers[S.i];
          var h = '<div class="q-head"><div class="q-meta"><span class="tag">Câu ' + (S.i + 1) + ' / ' + S.list.length + '</span><span class="tag">' + type.name + '</span><span class="tag lv' + Q.q.lv + '">' + Quiz.LV_NAME[Q.q.lv] + '</span></div>' +
            (S.timer ? '<div class="q-timer" id="qTimer"><i data-lucide="timer"></i><span></span></div>' : '') + '</div>';
          h += '<div class="progress"><span style="width:' + (S.i / S.list.length * 100) + '%"></span></div><div class="q-text">' + Q.html + '</div>';
          if (Q.input) h += '<form class="type-input" id="qTypeForm" autocomplete="off"><input class="input input-lg" id="qTyped" placeholder="' + (iu() ? 'Ví dụ: tetraamminecopper(II) ion' : 'Ví dụ: ion tetraammin đồng(II)') + '" spellcheck="false" aria-label="Nhập tên"><button class="btn btn-primary btn-lg" type="submit">Kiểm tra</button></form>' +
            '<p class="small muted">Gợi ý: số oxi hóa viết La Mã trong ngoặc, ví dụ (III). Có hay không chữ “ion” đều được.</p>';
          else h += '<div class="options">' + Q.options.map(function (o, i) {
            return '<button class="opt" data-i="' + i + '"><span class="k">' + 'ABCD'[i] + '</span><span class="opt-text' + (o.f ? ' f' : '') + '">' + (o.f ? o.text : esc(o.text)) + '</span></button>';
          }).join('') + '</div>';
          h += '<div class="feedback" id="qFeedback"></div><div class="q-actions"><button class="btn btn-ghost" id="qQuit"><i data-lucide="x"></i> Thoát</button>' +
            '<button class="btn btn-primary hidden" id="qNext">' + (S.i === S.list.length - 1 ? 'Xem kết quả <i data-lucide="flag"></i>' : 'Câu tiếp <i data-lucide="arrow-right"></i>') + '</button></div>';
          box.innerHTML = h; box.classList.remove('q-in'); void box.offsetWidth; box.classList.add('q-in'); App.icons();
          if (Q.input) $('#qTypeForm', box).addEventListener('submit', function (e) { e.preventDefault(); answer($('#qTyped', box).value); });
          else $$('.opt', box).forEach(function (b) { b.addEventListener('click', function () { answer(+b.getAttribute('data-i')); }); });
          $('#qNext', box).addEventListener('click', next);
          $('#qQuit', box).addEventListener('click', function () { if (confirm('Thoát bài đang làm? Kết quả sẽ không được lưu.')) { Quiz.quit(); R.go('/luyen-tap', { replace: true }); } });
          if (A) showAnswer(A); else { if (Q.input) setTimeout(function () { var t = $('#qTyped', box); if (t) t.focus({ preventScroll: true }); }, 50); startTimer(Q.input ? 60 : 30); }
        }
        function startTimer(sec) {
          clearInterval(timerId); if (!Quiz.session().timer) return;
          var left = sec, t = $('#qTimer', box);
          function tick() { t.querySelector('span').textContent = left + 's'; t.classList.toggle('low', left <= 5); }
          tick();
          timerId = setInterval(function () { left--; tick(); if (left <= 0) { clearInterval(timerId); answer(null, true); } }, 1000);
        }
        function answer(v, timeout) { clearInterval(timerId); showAnswer(Quiz.answer(v, timeout)); }
        function showAnswer(r) {
          var S = Quiz.session(), Q = S.list[S.i];
          if (Q.input) { $('#qTyped', box).disabled = true; $('#qTyped', box).value = r.your === '(hết giờ)' ? '' : r.your; $('#qTypeForm button', box).disabled = true; }
          else {
            var btns = $$('.opt', box); btns.forEach(function (b) { b.disabled = true; });
            Q.options.forEach(function (o, i) { if (o.ok) btns[i].classList.add('correct'); });
            if (r.pick != null && !r.ok) btns[r.pick].classList.add('wrong');
          }
          $('#qFeedback', box).innerHTML = '<div class="notice ' + (r.ok ? 'ok' : 'err') + '"><i data-lucide="' + (r.ok ? 'circle-check' : 'circle-x') + '"></i><div><b>' + (r.msg || (r.ok ? 'Chính xác!' : 'Chưa đúng.')) + '</b>' +
            (!r.ok ? '<p>Đáp án đúng: <b class="' + (Q.answerIsFormula ? 'f' : '') + '">' + (Q.answerIsFormula ? Q.answer : esc(Q.answer)) + '</b></p>' : '') + '</div></div><div class="explain">' + Quiz.explain(Q) + '</div>';
          App.icons();
          var nb = $('#qNext', box); nb.classList.remove('hidden'); nb.focus({ preventScroll: true });
          $('.progress span', box).style.width = ((S.i + 1) / S.list.length * 100) + '%';
        }
        function next() {
          var S = Quiz.session();
          if (S.i < S.list.length - 1) { S.i++; render(); window.scrollTo(0, 0); }
          else { Quiz.finish(); R.go('/luyen-tap/ket-qua', { replace: true }); }
        }
        render();
      },
      unmount: function () { clearInterval(timerId); }
    };
  });

  R.add('/luyen-tap/ket-qua', function () {
    var r = Quiz.last();
    if (!r) return { redirect: '/luyen-tap' };
    var col = r.pct >= 80 ? 'var(--ok)' : r.pct >= 50 ? 'var(--near)' : 'var(--bad)';
    return {
      title: 'Kết quả luyện tập',
      head: { title: 'Kết quả', crumbs: [{ label: 'Luyện tập', href: '/luyen-tap' }, { label: 'Kết quả', href: '/luyen-tap/ket-qua' }] },
      html:
        '<div class="card glass"><div class="result-hero"><i data-lucide="trophy" style="width:46px;height:46px;color:' + col + '"></i>' +
        '<div class="big-score" style="color:' + col + '">' + String(r.score).replace('.', ',') + '<small>/10</small></div>' +
        '<p><b>' + (r.pct >= 90 ? 'Xuất sắc!' : r.pct >= 70 ? 'Làm tốt lắm!' : r.pct >= 50 ? 'Khá rồi, cố thêm chút nữa!' : 'Đừng nản – xem lại lời giải và luyện lại nhé!') + '</b>' +
        (r.retry ? ' <span class="muted small">(lượt luyện lại – không lưu vào lịch sử)</span>' : '') + '</p>' +
        '<div class="res-stats"><div><b>' + r.c + '/' + r.n + '</b><small>câu đúng</small></div><div><b>' + r.pct + '%</b><small>chính xác</small></div><div><b>' + fmtTime(r.sec) + '</b><small>thời gian</small></div></div></div>' +
        (r.wrong.length ? '<h3 class="card-title"><i data-lucide="list-x"></i> Câu sai cần xem lại (' + r.wrong.length + ')</h3><div class="wrong-list">' + r.wrong.map(function (w) {
          var isF = w.Q.answerIsFormula;
          return '<details class="wrong-item"><summary>' + w.Q.html.replace(/<(?!\/?(span|b)\b)[^>]+>/g, '') + '</summary>' +
            '<p class="small">Bạn trả lời: <span class="ya ' + (isF ? 'f' : '') + '">' + (isF && w.A ? w.A.your : esc((w.A && w.A.your) || '(chưa trả lời)')) + '</span><br>Đáp án: <span class="ca ' + (isF ? 'f' : '') + '">' + (isF ? w.Q.answer : esc(w.Q.answer)) + '</span></p>' +
            '<div class="explain">' + Quiz.explain(w.Q) + '</div></details>';
        }).join('') + '</div>' : '') +
        '<div class="q-actions">' + (r.wrong.length ? '<button class="btn btn-primary" id="qRetry"><i data-lucide="repeat"></i> Luyện lại câu sai</button>' : '<span></span>') +
        '<a class="btn btn-soft" href="#/luyen-tap"><i data-lucide="rotate-ccw"></i> Làm bài mới</a></div></div>',
      mount: function (el) {
        var b = $('#qRetry', el);
        if (b) b.addEventListener('click', function () {
          Quiz.start({ ids: r.wrong.map(function (w) { return w.Q.q.id; }), lv: r.lv, timer: CFG.timer });
          R.go('/luyen-tap/lam-bai', { replace: true });
        });
      }
    };
  });

  /* ================= FLASHCARD ================= */
  var FC = { deck: 'all', cur: null };
  function fcState() { return App.Store.get(App.mkey('fc'), {}); }
  R.add('/flashcard', function () {
    return {
      title: 'Flashcard',
      head: { title: 'Flashcard', icon: 'layers', color: 'c5', crumbs: [{ label: 'Flashcard', href: '/flashcard' }],
        sub: 'Bấm vào thẻ để lật. Thẻ “chưa thuộc” sẽ quay lại thường xuyên hơn. Tiến độ lưu riêng cho chế độ ' + App.modeLabel() + '.' },
      html:
        '<div class="fc-toolbar"><div class="seg" id="fcDeck">' + [['all', 'Tất cả'], ['todo', 'Chưa thuộc'], ['1', 'Nhận biết'], ['3', 'Vận dụng']].map(function (d) {
          return '<label><input type="radio" name="deck" value="' + d[0] + '"' + (FC.deck === d[0] ? ' checked' : '') + '><span>' + d[1] + '</span></label>';
        }).join('') + '</div><div class="fc-progress"><div class="bar"><span id="fcBar"></span></div><span id="fcCount" class="small muted"></span></div></div>' +
        '<div class="fc-stage"><button class="flashcard" id="fcCard" aria-label="Lật thẻ">' +
        '<span class="fc-face fc-front"><span class="fc-tag" id="fcTag"></span><span class="fc-formula f" id="fcFront"></span><span class="fc-tip"><i data-lucide="rotate-ccw"></i> Chạm để lật thẻ</span></span>' +
        '<span class="fc-face fc-back"><span class="fc-name" id="fcName"></span><span class="fc-en" id="fcEn"></span><span class="fc-explain" id="fcExplain"></span></span></button></div>' +
        '<div class="fc-actions"><button class="btn btn-danger-soft btn-lg" id="fcNo"><i data-lucide="circle-x"></i> Chưa thuộc</button>' +
        '<button class="btn btn-soft btn-icon btn-lg" id="fcSpeak" aria-label="Nghe tên" title="Nghe tên"><i data-lucide="volume-2"></i></button>' +
        '<button class="btn btn-success-soft btn-lg" id="fcYes"><i data-lucide="circle-check"></i> Đã thuộc</button></div>' +
        '<p class="center small muted">Phím tắt: <kbd>Space</kbd> lật · <kbd>←</kbd> chưa thuộc · <kbd>→</kbd> đã thuộc · <button class="link-btn" id="fcReset">đặt lại tiến độ</button></p>',
      mount: function (el) {
        var card = $('#fcCard', el);
        function deck() {
          var st = fcState();
          return App.lib().filter(function (a) {
            if (FC.deck === 'todo') return !(st[a.ascii] && st[a.ascii].k);
            if (FC.deck === '1') return a.lv === 1;
            if (FC.deck === '3') return a.lv === 3;
            return true;
          });
        }
        function pick() {
          var d = deck(), st = fcState(); if (!d.length) return null;
          var w = d.map(function (a) { var s = st[a.ascii]; return (FC.cur && a.ascii === FC.cur.ascii && d.length > 1) ? 0 : !s ? 3 : s.k ? 1 : 5; });
          var tot = w.reduce(function (x, y) { return x + y; }, 0), r = Math.random() * tot;
          for (var i = 0; i < d.length; i++) { r -= w[i]; if (r <= 0) return d[i]; }
          return d[d.length - 1];
        }
        function stats() {
          var st = fcState(), L = App.lib(), known = L.filter(function (a) { return st[a.ascii] && st[a.ascii].k; }).length;
          $('#fcCount', el).textContent = 'Đã thuộc ' + known + ' / ' + L.length;
          $('#fcBar', el).style.width = (known / L.length * 100) + '%';
        }
        function show(a) {
          // đổi nội dung SAU KHI thẻ đã quay về mặt trước, để không lộ đáp án của thẻ mới
          var wasFlipped = card.classList.contains('flipped');
          card.classList.remove('flipped');
          FC.cur = a;
          setTimeout(function () {
            if (!a) {
              $('#fcFront', el).innerHTML = '<span style="font-size:1.2rem">Bạn đã thuộc hết thẻ trong bộ này!</span>';
              $('#fcTag', el).textContent = 'Hoàn thành'; $('#fcName', el).textContent = ''; $('#fcEn', el).textContent = ''; $('#fcExplain', el).textContent = '';
              return;
            }
            $('#fcFront', el).innerHTML = a.formula;
            $('#fcTag', el).textContent = Quiz.LV_NAME[a.lv];
            $('#fcName', el).textContent = App.pName(a);
            $('#fcEn', el).textContent = iu() ? 'Phiên âm: ' + a.phonetic : '';
            $('#fcExplain', el).innerHTML = 'Số oxi hóa <b>' + Chem.signed(a.os) + '</b> · Số phối trí <b>' + a.cn + '</b> · ' + a.kindVi + ' · ' + a.geoVi + '<br>Màu: ' + esc(a.item.color) + '<br><span style="opacity:.85">' + esc(a.item.note) + '</span>';
          }, wasFlipped ? 380 : 0);
          stats();
        }
        function mark(ok) {
          if (!FC.cur) return;
          var st = fcState(), s = st[FC.cur.ascii] || { n: 0 };
          s.k = ok; s.n++; st[FC.cur.ascii] = s; App.Store.set(App.mkey('fc'), st);
          card.classList.remove('swipe-l', 'swipe-r'); void card.offsetWidth; card.classList.add(ok ? 'swipe-r' : 'swipe-l');
          show(pick());
        }
        card.addEventListener('click', function () { if (FC.cur) card.classList.toggle('flipped'); });
        $('#fcYes', el).addEventListener('click', function () { mark(true); });
        $('#fcNo', el).addEventListener('click', function () { mark(false); });
        $('#fcSpeak', el).addEventListener('click', function () { if (FC.cur) Speech.speak(App.pSpeak(FC.cur), App.pLang(), this); });
        $('#fcDeck', el).addEventListener('change', function (e) { FC.deck = e.target.value; FC.cur = null; show(pick()); });
        $('#fcReset', el).addEventListener('click', function () { if (confirm('Đặt lại tiến độ flashcard của chế độ ' + App.modeLabel() + '?')) { App.Store.set(App.mkey('fc'), {}); show(pick()); } });
        FC.key = function (e) {
          // không chặn phím khi đang ở ô nhập hoặc đang chọn một nút khác
          if (/^(INPUT|TEXTAREA|SELECT|BUTTON|A)$/.test(e.target.tagName || '') && e.target !== card) return;
          if (e.key === ' ') { e.preventDefault(); card.click(); }
          else if (e.key === 'ArrowRight') mark(true);
          else if (e.key === 'ArrowLeft') mark(false);
        };
        document.addEventListener('keydown', FC.key);
        FC.cur = null; show(pick());
      },
      unmount: function () { document.removeEventListener('keydown', FC.key); }
    };
  });
})();

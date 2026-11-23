/* =====================================================================
 * TÀI KHOẢN + DIỄN ĐÀN
 *   #/dang-nhap            đăng nhập / đăng ký / quên mật khẩu (?next=… để quay lại trang cũ)
 *   #/tai-khoan            đổi tên hiển thị, đăng xuất
 *   #/dat-lai-mat-khau     đặt mật khẩu mới (mở từ email "quên mật khẩu")
 *   #/dien-dan             danh sách chủ đề
 *   #/dien-dan/moi         đặt câu hỏi mới
 *   #/dien-dan/:id         một chủ đề và các câu trả lời
 * Dữ liệu nằm ở Supabase; quyền đọc/ghi/xóa do Supabase kiểm tra (supabase/cai-dat.sql).
 * ===================================================================== */
(function () {
  'use strict';
  var $ = App.$, $$ = App.$$, esc = App.esc, R = Router;
  var CATS = [['hoi-dap', 'Hỏi đáp'], ['bai-tap', 'Bài tập'], ['gop-y', 'Góp ý cho web'], ['khac', 'Khác']];
  var PAGE = 20;

  function catName(k) { for (var i = 0; i < CATS.length; i++) if (CATS[i][0] === k) return CATS[i][1]; return k; }
  function when(iso) {
    var d = new Date(iso), s = (Date.now() - d) / 1000;
    if (s < 60) return 'vừa xong';
    if (s < 3600) return Math.floor(s / 60) + ' phút trước';
    if (s < 86400) return Math.floor(s / 3600) + ' giờ trước';
    if (s < 7 * 86400) return Math.floor(s / 86400) + ' ngày trước';
    return ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2) + '/' + d.getFullYear();
  }
  function note(kind, icon, html) { return '<div class="notice ' + kind + '"><i data-lucide="' + icon + '"></i><div>' + html + '</div></div>'; }
  function notReady() {
    return note('warn', 'plug-zap', '<b>Diễn đàn chưa được cài đặt.</b><p>Tác giả cần điền <code>supabaseUrl</code> và <code>supabaseKey</code> trong <code>js/data.js</code> (xem hướng dẫn trong README).</p>');
  }
  function errBox(e) { return note('err', 'circle-x', esc(Auth.viError(e))); }
  function loginLink(next, text) { return '<a href="#/dang-nhap?next=' + encodeURIComponent(next) + '">' + (text || 'Đăng nhập') + '</a>'; }
  function busy(btn, on, label) { btn.disabled = on; if (label) btn.textContent = on ? 'Đang xử lý...' : label; }
  // Chạy lại hàm vẽ mỗi khi trạng thái đăng nhập đổi; trả về hàm hủy (gọi trong unmount)
  function follow(draw) { var off = Auth.onChange(draw); Auth.load().then(draw, draw); return off; }
  // Kiểm duyệt: bài mới chờ quản trị viên duyệt (quyền do supabase/kiem-duyet.sql khóa lại)
  function waitTag(x) { return x.approved === false ? ' <span class="tag tag-wait">Chờ duyệt</span>' : ''; }
  function approve(table, id) {
    return Auth.db().from(table).update({ approved: true }).eq('id', id).select('id').then(function (r) {
      if (r.error) throw r.error;
      if (!r.data.length) throw new Error('row-level security');
    });
  }
  function remove(table, id) {
    return Auth.db().from(table).delete().eq('id', id).select('id').then(function (r) {
      if (r.error) throw r.error;
      if (!r.data.length) throw new Error('row-level security');      // RLS chặn: không xóa được dòng nào
    });
  }

  /* ================= ĐĂNG NHẬP / ĐĂNG KÝ / QUÊN MẬT KHẨU ================= */
  R.add('/dang-nhap', function (params, query) {
    var next = query.next && query.next[0] === '/' ? query.next : '/dien-dan', off = null, tab = query.tab || 'login';
    return {
      title: 'Đăng nhập',
      head: { title: 'Đăng nhập', crumbs: [{ label: 'Đăng nhập', href: '/dang-nhap' }],
        sub: 'Không bắt buộc. Bạn chỉ cần tài khoản khi muốn đặt câu hỏi hoặc trả lời ở Diễn đàn; mọi phần khác của web vẫn dùng bình thường.' },
      html: '<div class="card glass auth-card" id="authBox"></div>',
      mount: function (el) {
        var box = $('#authBox', el);
        function form() {
          var seg = '<div class="seg auth-tabs">' + [['login', 'Đăng nhập'], ['signup', 'Tạo tài khoản'], ['forgot', 'Quên mật khẩu']].map(function (t) {
            return '<label><input type="radio" name="authTab" value="' + t[0] + '"' + (t[0] === tab ? ' checked' : '') + '><span>' + t[1] + '</span></label>';
          }).join('') + '</div>';
          var f = '<form id="authForm" novalidate>' +
            (tab === 'signup' ? '<div class="field"><label for="aName">Tên hiển thị</label><input id="aName" class="input" maxlength="40" autocomplete="nickname" placeholder="Ví dụ: Minh 12A1" required></div>' : '') +
            '<div class="field"><label for="aEmail">Email</label><input id="aEmail" class="input" type="email" autocomplete="email" required></div>' +
            (tab !== 'forgot' ? '<div class="field"><label for="aPw">Mật khẩu' + (tab === 'signup' ? ' (ít nhất 8 kí tự)' : '') + '</label><input id="aPw" class="input" type="password" minlength="' + (tab === 'signup' ? 8 : 1) + '" autocomplete="' + (tab === 'signup' ? 'new-password' : 'current-password') + '" required></div>' : '') +
            '<button class="btn btn-primary" type="submit" id="aGo">' + { login: 'Đăng nhập', signup: 'Tạo tài khoản', forgot: 'Gửi email đặt lại mật khẩu' }[tab] + '</button>' +
            '<div id="aMsg" class="form-msg" role="status"></div></form>';
          box.innerHTML = seg + f; App.icons();
        }
        function draw() {
          if (!Auth.configured()) { box.innerHTML = notReady(); App.icons(); return; }
          if (Auth.user()) {
            box.innerHTML = note('ok', 'circle-check', 'Bạn đang đăng nhập với tên <b>' + esc(Auth.name()) + '</b>.') +
              '<div class="row gap wrap"><a class="btn btn-primary" href="#' + esc(next) + '">Tiếp tục</a><a class="btn" href="#/tai-khoan">Tài khoản của tôi</a></div>';
            App.icons(); return;
          }
          if (!$('#authForm', box)) form();
        }
        box.addEventListener('change', function (e) { if (e.target.name === 'authTab') { tab = e.target.value; form(); } });
        box.addEventListener('submit', function (e) {
          e.preventDefault();
          var msg = $('#aMsg', box), btn = $('#aGo', box), label = btn.textContent;
          var email = $('#aEmail', box).value.trim(), pw = $('#aPw', box) ? $('#aPw', box).value : '', name = $('#aName', box) ? $('#aName', box).value.trim() : '';
          var bad = !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) ? 'Email chưa đúng định dạng.'
            : tab === 'signup' && (name.length < 2 || name.length > 40) ? 'Tên hiển thị cần từ 2 đến 40 kí tự.'
            : tab === 'signup' && pw.length < 8 ? 'Mật khẩu cần ít nhất 8 kí tự.'
            : tab === 'login' && !pw ? 'Hãy nhập mật khẩu.' : '';
          if (bad) { msg.innerHTML = note('err', 'circle-x', bad); App.icons(); return; }
          busy(btn, true, label);
          var job = tab === 'login' ? Auth.signIn(email, pw) : tab === 'signup' ? Auth.signUp(email, pw, name) : Auth.resetPassword(email);
          job.then(function (d) {
            if (tab === 'login') { R.go(next, { replace: true }); return; }
            if (tab === 'signup' && d && d.session) { R.go(next, { replace: true }); return; }   // dự án tắt xác nhận email → vào luôn
            msg.innerHTML = note('ok', 'mail-check', tab === 'signup'
              ? '<b>Đã tạo tài khoản.</b><p>Mở hộp thư ' + esc(email) + ' và bấm vào liên kết xác nhận (xem cả mục Spam), sau đó quay lại đây đăng nhập.</p>'
              : '<b>Đã gửi email.</b><p>Mở liên kết trong email <b>bằng chính trình duyệt này</b> để đặt mật khẩu mới.</p>');
          }).catch(function (err) { msg.innerHTML = errBox(err); })
            .then(function () { if (btn.isConnected) busy(btn, false, label); App.icons(); });
        });
        off = follow(draw);
      },
      unmount: function () { if (off) off(); }
    };
  });

  /* ================= TÀI KHOẢN ================= */
  R.add('/tai-khoan', function () {
    var off = null;
    return {
      title: 'Tài khoản',
      head: { title: 'Tài khoản của tôi', crumbs: [{ label: 'Tài khoản', href: '/tai-khoan' }] },
      html: '<div class="card glass auth-card" id="accBox"><p class="muted">Đang tải...</p></div>',
      mount: function (el) {
        var box = $('#accBox', el);
        function draw() {
          if (!Auth.configured()) { box.innerHTML = notReady(); App.icons(); return; }
          if (!Auth.user()) { box.innerHTML = note('info', 'log-in', 'Bạn chưa đăng nhập. ' + loginLink('/tai-khoan') + ' hoặc <a href="#/dang-nhap?tab=signup">tạo tài khoản</a>.'); App.icons(); return; }
          box.innerHTML = '<p>Email: <b>' + esc(Auth.user().email) + '</b>' + (Auth.isAdmin() ? ' · <span class="tag">Quản trị viên</span>' : '') + '</p>' +
            '<form id="nameForm" class="field"><label for="accName">Tên hiển thị trên diễn đàn</label><div class="input-row"><input id="accName" class="input" maxlength="40" value="' + esc(Auth.name()) + '">' +
            '<button class="btn" type="submit" id="accSave">Lưu tên</button></div><div id="accMsg" class="form-msg" role="status"></div></form>' +
            '<div class="row gap wrap"><a class="btn" href="#/dien-dan">Vào diễn đàn</a><a class="btn" href="#/dat-lai-mat-khau">Đổi mật khẩu</a><button class="btn btn-danger-soft" id="accOut" type="button"><i data-lucide="log-out"></i> Đăng xuất</button></div>';
          App.icons();
          $('#nameForm', box).addEventListener('submit', function (e) {
            e.preventDefault();
            var n = $('#accName', box).value.trim(), btn = $('#accSave', box), m = $('#accMsg', box);
            if (n.length < 2 || n.length > 40) { m.innerHTML = note('err', 'circle-x', 'Tên hiển thị cần từ 2 đến 40 kí tự.'); App.icons(); return; }
            busy(btn, true, 'Lưu tên');
            Auth.updateName(n).then(function () { App.toast('Đã lưu tên hiển thị.', 'check'); }, function (err) { m.innerHTML = errBox(err); App.icons(); })
              .then(function () { if (btn.isConnected) busy(btn, false, 'Lưu tên'); });
          });
          $('#accOut', box).addEventListener('click', function () {
            Auth.signOut().then(function () { App.toast('Đã đăng xuất.', 'log-out'); R.go('/'); }, function (err) { App.toast(esc(Auth.viError(err)), 'circle-x'); });
          });
        }
        off = follow(draw);
      },
      unmount: function () { if (off) off(); }
    };
  });

  /* ================= ĐẶT LẠI MẬT KHẨU ================= */
  R.add('/dat-lai-mat-khau', function () {
    var off = null;
    return {
      title: 'Đặt mật khẩu mới',
      head: { title: 'Đặt mật khẩu mới', crumbs: [{ label: 'Đặt mật khẩu mới', href: '/dat-lai-mat-khau' }] },
      html: '<div class="card glass auth-card" id="pwBox"></div>',
      mount: function (el) {
        var box = $('#pwBox', el);
        function draw() {
          if (!Auth.configured()) { box.innerHTML = notReady(); App.icons(); return; }
          if (!Auth.user()) { box.innerHTML = note('info', 'key-round', 'Hãy mở liên kết trong email "đặt lại mật khẩu" bằng trình duyệt này, hoặc ' + loginLink('/dat-lai-mat-khau') + ' trước.'); App.icons(); return; }
          if ($('#pwForm', box)) return;
          box.innerHTML = '<form id="pwForm"><div class="field"><label for="pw1">Mật khẩu mới (ít nhất 8 kí tự)</label><input id="pw1" class="input" type="password" autocomplete="new-password"></div>' +
            '<div class="field"><label for="pw2">Nhập lại mật khẩu mới</label><input id="pw2" class="input" type="password" autocomplete="new-password"></div>' +
            '<button class="btn btn-primary" type="submit" id="pwGo">Lưu mật khẩu</button><div id="pwMsg" class="form-msg" role="status"></div></form>';
          $('#pwForm', box).addEventListener('submit', function (e) {
            e.preventDefault();
            var a = $('#pw1', box).value, b = $('#pw2', box).value, m = $('#pwMsg', box), btn = $('#pwGo', box);
            var bad = a.length < 8 ? 'Mật khẩu cần ít nhất 8 kí tự.' : a !== b ? 'Hai lần nhập không giống nhau.' : '';
            if (bad) { m.innerHTML = note('err', 'circle-x', bad); App.icons(); return; }
            busy(btn, true, 'Lưu mật khẩu');
            Auth.updatePassword(a).then(function () { App.toast('Đã đổi mật khẩu.', 'check'); R.go('/tai-khoan'); },
              function (err) { m.innerHTML = errBox(err); App.icons(); busy(btn, false, 'Lưu mật khẩu'); });
          });
        }
        off = follow(draw);
      },
      unmount: function () { if (off) off(); }
    };
  });

  /* ================= DIỄN ĐÀN: DANH SÁCH ================= */
  var FILTER = '';
  R.add('/dien-dan', function () {
    var off = null, shown = 0, cur = 0;
    return {
      title: 'Diễn đàn', wide: false,
      head: { title: 'Diễn đàn', crumbs: [{ label: 'Diễn đàn', href: '/dien-dan' }],
        sub: 'Hỏi bài, chia sẻ cách nhớ tên phức chất hoặc góp ý cho web. Ai cũng đọc được; muốn đăng bài thì cần đăng nhập.' },
      html: '<div class="forum-bar"><div class="seg" id="fCats">' + [['', 'Tất cả']].concat(CATS).map(function (c) {
          return '<label><input type="radio" name="fCat" value="' + c[0] + '"' + (c[0] === FILTER ? ' checked' : '') + '><span>' + c[1] + '</span></label>';
        }).join('') + '</div><a class="btn btn-primary" href="#/dien-dan/moi"><i data-lucide="plus"></i> Đặt câu hỏi</a></div>' +
        '<div id="fWho" class="small muted"></div><div id="fList"></div><div id="fMore"></div>',
      mount: function (el) {
        var list = $('#fList', el), more = $('#fMore', el);
        function who() {
          $('#fWho', el).innerHTML = !Auth.configured() ? '' : Auth.user() ? 'Bạn đang đăng nhập là <b>' + esc(Auth.name()) + '</b>.' +
            (Auth.isAdmin() ? ' <a href="#/dien-dan/duyet" id="fQueue">Duyệt bài</a>' : ' Bài mới sẽ hiện sau khi quản trị viên duyệt.') : 'Bạn chưa đăng nhập. ' + loginLink('/dien-dan') + ' để đặt câu hỏi và trả lời.';
          if (Auth.isAdmin()) Promise.all(['topics', 'replies'].map(function (t) { return Auth.db().from(t).select('id', { count: 'exact', head: true }).eq('approved', false); }))
            .then(function (rs) { var n = (rs[0].count || 0) + (rs[1].count || 0), a = $('#fQueue', el); if (a) a.textContent = 'Duyệt bài (' + n + ' đang chờ)'; });
        }
        function page(reset) {
          if (!Auth.configured()) { list.innerHTML = notReady(); App.icons(); return; }
          var my = ++cur;
          if (reset) { shown = 0; list.innerHTML = '<p class="muted">Đang tải...</p>'; more.innerHTML = ''; }
          Auth.load().then(function (db) {
            var q = db.from('topics').select('id,title,category,reply_count,created_at,last_reply_at,approved,author:profiles(display_name)')
              .order('last_reply_at', { ascending: false }).range(shown, shown + PAGE - 1);
            if (FILTER) q = q.eq('category', FILTER);
            return q;
          }).then(function (r) {
            if (my !== cur) return;
            if (r.error) throw r.error;
            if (reset) list.innerHTML = '<ul class="topic-list"></ul>';
            var ul = $('.topic-list', list);
            if (!r.data.length && !shown) { list.innerHTML = '<p class="muted">Chưa có chủ đề nào' + (FILTER ? ' trong mục này' : '') + '. Hãy là người đặt câu hỏi đầu tiên!</p>'; more.innerHTML = ''; return; }
            ul.insertAdjacentHTML('beforeend', r.data.map(function (t) {
              return '<li><a href="#/dien-dan/' + t.id + '"><b class="t-title">' + esc(t.title) + '</b><span class="t-meta"><span class="tag">' + esc(catName(t.category)) + '</span> ' +
                esc((t.author && t.author.display_name) || 'Thành viên') + ' · ' + when(t.created_at) + waitTag(t) + '</span><span class="t-count" title="Số trả lời"><i data-lucide="message-square"></i> ' + t.reply_count + '</span></a></li>';
            }).join(''));
            shown += r.data.length;
            more.innerHTML = r.data.length === PAGE ? '<button class="btn" type="button" id="fMoreBtn">Xem thêm</button>' : '';
            App.icons();
          }).catch(function (err) { if (my === cur) { list.innerHTML = errBox(err); App.icons(); } });
        }
        $('#fCats', el).addEventListener('change', function (e) { FILTER = e.target.value; page(true); });
        more.addEventListener('click', function (e) { if (e.target.closest('#fMoreBtn')) { e.target.disabled = true; page(false); } });
        page(true);
        if (Auth.configured()) off = follow(who);
      },
      unmount: function () { if (off) off(); }
    };
  });

  /* ================= DIỄN ĐÀN: ĐẶT CÂU HỎI ================= */
  R.add('/dien-dan/moi', function () {
    var off = null;
    return {
      title: 'Đặt câu hỏi',
      head: { title: 'Đặt câu hỏi', crumbs: [{ label: 'Diễn đàn', href: '/dien-dan' }, { label: 'Đặt câu hỏi', href: '/dien-dan/moi' }] },
      html: '<div class="card glass" id="newBox"><p class="muted">Đang tải...</p></div>',
      mount: function (el) {
        var box = $('#newBox', el);
        function draw() {
          if (!Auth.configured()) { box.innerHTML = notReady(); App.icons(); return; }
          if (!Auth.user()) { box.innerHTML = note('info', 'log-in', 'Bạn cần ' + loginLink('/dien-dan/moi', 'đăng nhập') + ' để đặt câu hỏi. Chưa có tài khoản? <a href="#/dang-nhap?tab=signup&next=%2Fdien-dan%2Fmoi">Tạo tài khoản</a>.'); App.icons(); return; }
          if ($('#tForm', box)) return;
          box.innerHTML = '<form id="tForm" novalidate>' +
            '<div class="field"><label for="tCat">Mục</label><select id="tCat" class="input">' + CATS.map(function (c) { return '<option value="' + c[0] + '">' + c[1] + '</option>'; }).join('') + '</select></div>' +
            '<div class="field"><label for="tTitle">Tiêu đề</label><input id="tTitle" class="input" maxlength="150" placeholder="Ví dụ: Vì sao [CoCl₄]²⁻ gọi là cobaltat mà không phải coban?"></div>' +
            '<div class="field"><label for="tBody">Nội dung</label><textarea id="tBody" class="input" rows="7" maxlength="5000" placeholder="Viết rõ câu hỏi; có thể gõ công thức kiểu [Cu(NH3)4]SO4."></textarea><small class="muted">Đăng với tên <b>' + esc(Auth.name()) + '</b>. Bài đã đăng không sửa được, chỉ xóa được.' +
              (Auth.isAdmin() ? '' : ' Câu hỏi sẽ hiện cho mọi người sau khi quản trị viên duyệt.') + '</small></div>' +
            '<button class="btn btn-primary" type="submit" id="tGo">Đăng câu hỏi</button><div id="tMsg" class="form-msg" role="status"></div></form>';
          App.icons();
          $('#tForm', box).addEventListener('submit', function (e) {
            e.preventDefault();
            var title = $('#tTitle', box).value.trim(), body = $('#tBody', box).value.trim(), m = $('#tMsg', box), btn = $('#tGo', box);
            var bad = title.length < 5 ? 'Tiêu đề cần ít nhất 5 kí tự.' : !body ? 'Hãy viết nội dung câu hỏi.' : '';
            if (bad) { m.innerHTML = note('err', 'circle-x', bad); App.icons(); return; }
            busy(btn, true, 'Đăng câu hỏi');
            Auth.db().from('topics').insert({ title: title, body: body, category: $('#tCat', box).value }).select('id').single().then(function (r) {
              if (r.error) throw r.error;
              if (!Auth.isAdmin()) App.toast('Đã gửi câu hỏi. Câu hỏi sẽ hiện cho mọi người sau khi quản trị viên duyệt.', 'clock');
              R.go('/dien-dan/' + r.data.id, { replace: true });
            }).catch(function (err) { m.innerHTML = errBox(err); App.icons(); busy(btn, false, 'Đăng câu hỏi'); });
          });
        }
        off = follow(draw);
      },
      unmount: function () { if (off) off(); }
    };
  });

  /* ================= DIỄN ĐÀN: DUYỆT BÀI (quản trị viên) ================= */
  // Phải khai báo TRƯỚC '/dien-dan/:id', nếu không "duyet" sẽ bị hiểu là mã chủ đề.
  R.add('/dien-dan/duyet', function () {
    var off = null;
    return {
      title: 'Duyệt bài',
      head: { title: 'Duyệt bài', crumbs: [{ label: 'Diễn đàn', href: '/dien-dan' }, { label: 'Duyệt bài', href: '/dien-dan/duyet' }],
        sub: 'Bài mới chỉ hiện cho mọi người sau khi được duyệt. Từ chối = xóa bài.' },
      html: '<div id="qBox"><p class="muted">Đang tải...</p></div>',
      mount: function (el) {
        var box = $('#qBox', el);
        function item(table, x) {
          var topicLink = table === 'topics' ? '<a href="#/dien-dan/' + x.id + '"><b>' + esc(x.title) + '</b></a>'
            : 'Trả lời trong <a href="#/dien-dan/' + x.topic_id + '">' + esc((x.topic && x.topic.title) || 'chủ đề #' + x.topic_id) + '</a>';
          return '<article class="post"><header><span>' + topicLink + '</span></header>' +
            '<p class="small muted">' + esc((x.author && x.author.display_name) || 'Thành viên') + ' · ' + when(x.created_at) + (x.category ? ' · ' + esc(catName(x.category)) : '') + '</p>' +
            '<div class="post-body">' + esc(x.body) + '</div>' +
            '<div class="row gap wrap mod-actions"><button class="btn btn-primary btn-sm" type="button" data-ok="' + table + '" data-id="' + x.id + '"><i data-lucide="check"></i> Duyệt</button>' +
            '<button class="btn btn-danger-soft btn-sm" type="button" data-no="' + table + '" data-id="' + x.id + '"><i data-lucide="x"></i> Từ chối (xóa)</button></div></article>';
        }
        function load() {
          if (!Auth.configured()) { box.innerHTML = notReady(); App.icons(); return; }
          if (!Auth.user() || !Auth.isAdmin()) { box.innerHTML = note('warn', 'shield-alert', 'Trang này chỉ dành cho quản trị viên.' + (Auth.user() ? '' : ' ' + loginLink('/dien-dan/duyet'))); App.icons(); return; }
          var db = Auth.db();
          Promise.all([
            db.from('topics').select('id,title,body,category,created_at,author:profiles(display_name)').eq('approved', false).order('created_at').limit(100),
            db.from('replies').select('id,body,topic_id,created_at,author:profiles(display_name),topic:topics(title)').eq('approved', false).order('created_at').limit(100)
          ]).then(function (rs) {
            if (rs[0].error) throw rs[0].error; if (rs[1].error) throw rs[1].error;
            var T = rs[0].data, P = rs[1].data;
            box.innerHTML = !T.length && !P.length ? note('ok', 'circle-check', 'Không có bài nào đang chờ duyệt.') :
              '<h3 class="home-h2">Câu hỏi mới (' + T.length + ')</h3>' + (T.map(function (x) { return item('topics', x); }).join('') || '<p class="muted">Không có.</p>') +
              '<h3 class="home-h2">Câu trả lời mới (' + P.length + ')</h3>' + (P.map(function (x) { return item('replies', x); }).join('') || '<p class="muted">Không có.</p>');
            App.icons();
          }).catch(function (err) { box.innerHTML = errBox(err); App.icons(); });
        }
        box.addEventListener('click', function (e) {
          var b = e.target.closest('[data-ok],[data-no]'); if (!b) return;
          var ok = b.hasAttribute('data-ok'), table = b.getAttribute(ok ? 'data-ok' : 'data-no'), id = +b.getAttribute('data-id');
          if (!ok && !confirm('Từ chối sẽ xóa hẳn bài này' + (table === 'topics' ? ' (cùng mọi câu trả lời của nó)' : '') + '. Tiếp tục?')) return;
          b.disabled = true;
          (ok ? approve(table, id) : remove(table, id)).then(function () { App.toast(ok ? 'Đã duyệt.' : 'Đã xóa bài.', ok ? 'check' : 'trash-2'); load(); },
            function (err) { b.disabled = false; App.toast(esc(Auth.viError(err)), 'circle-x'); });
        });
        off = follow(load);
      },
      unmount: function () { if (off) off(); }
    };
  });

  /* ================= DIỄN ĐÀN: MỘT CHỦ ĐỀ ================= */
  R.add('/dien-dan/:id', function (params) {
    var id = parseInt(params.id, 10), off = null;
    if (!(id > 0)) return Pages.notFound('/dien-dan/' + params.id, 'Không có chủ đề này.');
    return {
      title: 'Diễn đàn',
      head: { title: 'Chủ đề', crumbs: [{ label: 'Diễn đàn', href: '/dien-dan' }, { label: 'Chủ đề', href: '/dien-dan/' + id }] },
      html: '<div id="tBox"><p class="muted">Đang tải...</p></div><div id="rBox"></div><div id="rForm"></div>',
      mount: function (el) {
        var topic = null, replies = [];
        function canDelete(authorId) { var u = Auth.user(); return !!u && (u.id === authorId || Auth.isAdmin()); }
        function post(kind, x, isTopic) {
          return '<article class="post' + (isTopic ? ' post-topic' : '') + (x.approved === false ? ' post-wait' : '') + '"><header><b>' + esc((x.author && x.author.display_name) || 'Thành viên') + '</b> <span class="muted small">· ' + when(x.created_at) + '</span>' + waitTag(x) +
            '<span class="post-tools">' + (x.approved === false && Auth.isAdmin() ? '<button class="link-btn post-ok" type="button" data-ok="' + kind + '" data-id="' + x.id + '">Duyệt</button>' : '') +
            (canDelete(x.author_id) ? '<button class="link-btn post-del" type="button" data-del="' + kind + '" data-id="' + x.id + '">Xóa</button>' : '') + '</span></header>' +
            '<div class="post-body">' + esc(x.body) + '</div></article>';
        }
        function draw() {
          if (!topic) return;
          $('h1', el).textContent = topic.title; document.title = topic.title + ' – Diễn đàn – Complex Chemistry 12';
          $('#tBox', el).innerHTML = (topic.approved === false ? note('warn', 'clock', 'Câu hỏi này đang chờ quản trị viên duyệt, hiện chỉ ' + (Auth.isAdmin() ? 'tác giả và quản trị viên' : 'bạn') + ' nhìn thấy.') : '') +
            '<p class="small muted"><span class="tag">' + esc(catName(topic.category)) + '</span></p>' + post('topics', topic, true);
          $('#rBox', el).innerHTML = '<h3 class="home-h2">' + replies.filter(function (x) { return x.approved !== false; }).length + ' trả lời</h3>' + replies.map(function (x) { return post('replies', x); }).join('');
          var f = $('#rForm', el);
          if (!Auth.user()) f.innerHTML = note('info', 'log-in', loginLink('/dien-dan/' + id) + ' để trả lời.');
          else if (!$('form', f)) f.innerHTML = '<form id="replyForm" class="card glass"><div class="field"><label for="rBody">Trả lời với tên <b>' + esc(Auth.name()) + '</b></label>' +
            '<textarea id="rBody" class="input" rows="4" maxlength="5000"></textarea></div><button class="btn btn-primary" type="submit" id="rGo">Gửi trả lời</button><div id="rMsg" class="form-msg" role="status"></div></form>';
          App.icons();
        }
        function loadAll() {
          if (!Auth.configured()) { $('#tBox', el).innerHTML = notReady(); App.icons(); return; }
          Auth.load().then(function (db) {
            return Promise.all([
              db.from('topics').select('id,title,body,category,created_at,author_id,approved,author:profiles(display_name)').eq('id', id).maybeSingle(),
              db.from('replies').select('id,body,created_at,author_id,approved,author:profiles(display_name)').eq('topic_id', id).order('created_at').limit(500)
            ]);
          }).then(function (rs) {
            if (rs[0].error) throw rs[0].error; if (rs[1].error) throw rs[1].error;
            if (!rs[0].data) { $('#tBox', el).innerHTML = note('warn', 'search-x', 'Chủ đề này không tồn tại hoặc đã bị xóa. <a href="#/dien-dan">Về diễn đàn</a>'); App.icons(); return; }
            topic = rs[0].data; replies = rs[1].data; draw();
          }).catch(function (err) { $('#tBox', el).innerHTML = errBox(err); App.icons(); });
        }
        el.addEventListener('submit', function (e) {
          if (e.target.id !== 'replyForm') return;
          e.preventDefault();
          var body = $('#rBody', el).value.trim(), m = $('#rMsg', el), btn = $('#rGo', el);
          if (!body) { m.innerHTML = note('err', 'circle-x', 'Hãy viết nội dung trả lời.'); App.icons(); return; }
          busy(btn, true, 'Gửi trả lời');
          Auth.db().from('replies').insert({ topic_id: id, body: body }).then(function (r) {
            if (r.error) throw r.error;
            $('#rBody', el).value = '';
            m.innerHTML = Auth.isAdmin() ? '' : note('ok', 'clock', 'Đã gửi. Câu trả lời sẽ hiện cho mọi người sau khi quản trị viên duyệt.');
            App.icons(); loadAll();
          }).catch(function (err) { m.innerHTML = errBox(err); App.icons(); }).then(function () { if (btn.isConnected) busy(btn, false, 'Gửi trả lời'); });
        });
        el.addEventListener('click', function (e) {
          var ok = e.target.closest('[data-ok]');
          if (ok) {
            ok.disabled = true;
            approve(ok.getAttribute('data-ok'), +ok.getAttribute('data-id')).then(function () { App.toast('Đã duyệt.', 'check'); loadAll(); },
              function (err) { ok.disabled = false; App.toast(esc(Auth.viError(err)), 'circle-x'); });
            return;
          }
          var b = e.target.closest('[data-del]'); if (!b) return;
          var isTopic = b.getAttribute('data-del') === 'topics';
          if (!confirm(isTopic ? 'Xóa chủ đề này cùng mọi câu trả lời?' : 'Xóa câu trả lời này?')) return;
          remove(b.getAttribute('data-del'), +b.getAttribute('data-id')).then(function () {
            App.toast('Đã xóa.', 'trash-2');
            if (isTopic) R.go('/dien-dan', { replace: true }); else loadAll();
          }).catch(function (err) { App.toast(esc(Auth.viError(err)), 'circle-x'); });
        });
        loadAll();
        if (Auth.configured()) off = Auth.onChange(draw);
      },
      unmount: function () { if (off) off(); }
    };
  });
})();

/* =====================================================================
 * COMPLEX CHEMISTRY 12 – ĐĂNG NHẬP (Supabase)
 * Đăng nhập là TÙY CHỌN: chỉ cần khi muốn đăng bài ở Diễn đàn.
 * Thư viện Supabase chỉ được tải khi cần (mở trang đăng nhập / diễn đàn,
 * hoặc khi trình duyệt đã có phiên đăng nhập) để web vẫn nhẹ.
 * Cấu hình: supabaseUrl, supabaseKey trong SITE_CONFIG (js/data.js).
 * ===================================================================== */
var Auth = (function () {
  'use strict';
  var C = SITE_CONFIG, LIB = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js';
  var client = null, loading = null, user = null, profile = null, listeners = [];

  function configured() { return !!(C.supabaseUrl && C.supabaseKey); }
  function hasStoredSession() {
    try { for (var i = 0; i < localStorage.length; i++) if (/^sb-.*-auth-token$/.test(localStorage.key(i))) return true; } catch (e) { }
    return false;
  }
  function notify(event) { listeners.slice().forEach(function (f) { try { f(event); } catch (e) { } }); }
  function onChange(f) { listeners.push(f); return function () { listeners = listeners.filter(function (x) { return x !== f; }); }; }

  function refresh(session, event) {
    user = session ? session.user : null;
    var p = user ? client.from('profiles').select('display_name,is_admin').eq('id', user.id).maybeSingle()
      .then(function (r) { profile = r.data || null; }) : Promise.resolve(profile = null);
    return p.then(function () {
      notify(event);
      if (event === 'PASSWORD_RECOVERY') location.hash = '#/dat-lai-mat-khau';
    });
  }

  // Tải thư viện + tạo client (chỉ một lần). Trả về Promise của client.
  function load() {
    if (!configured()) return Promise.reject(new Error('NOT_CONFIGURED'));
    if (loading) return loading;
    var fromEmail = /[?&](code|error_description)=/.test(location.search);
    loading = new Promise(function (ok, fail) {
      var s = document.createElement('script');
      s.src = LIB; s.onload = ok;
      s.onerror = function () { loading = null; fail(new Error('LOAD_FAILED')); };
      document.head.appendChild(s);
    }).then(function () {
      // pkce: liên kết trong email quay về dạng ?code=…, không đụng tới phần #/… của router
      client = window.supabase.createClient(C.supabaseUrl, C.supabaseKey, { auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
      // Supabase khuyên không gọi API ngay trong callback này → đẩy ra sau
      client.auth.onAuthStateChange(function (event, session) { setTimeout(function () { refresh(session, event); }, 0); });
      return client.auth.getSession();
    }).then(function (r) {
      if (fromEmail) {
        var err = new URLSearchParams(location.search).get('error_description');
        try { history.replaceState(null, '', location.pathname + location.hash); } catch (e) { }
        App.toast(err ? 'Liên kết trong email không dùng được: ' + Chem.esc(err) : r.data.session ? 'Đã xác nhận, bạn đang đăng nhập.' : 'Email đã được xác nhận. Hãy đăng nhập bằng email và mật khẩu.', err ? 'triangle-alert' : 'circle-check');
      }
      return refresh(r.data.session, 'INITIAL');
    }).then(function () { return client; });
    return loading;
  }

  /* lỗi của Supabase → câu tiếng Việt dễ hiểu */
  function viError(e) {
    var m = String((e && (e.message || e.error_description)) || e || '');
    if (/NOT_CONFIGURED/.test(m)) return 'Chức năng đăng nhập chưa được cài đặt.';
    if (/LOAD_FAILED|Failed to fetch|NetworkError|network/i.test(m)) return 'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.';
    if (/Invalid login credentials/i.test(m)) return 'Sai email hoặc mật khẩu.';
    if (/Email not confirmed/i.test(m)) return 'Email chưa được xác nhận. Hãy mở hộp thư và bấm vào liên kết xác nhận.';
    if (/already registered|already been registered/i.test(m)) return 'Email này đã có tài khoản. Hãy đăng nhập hoặc dùng "Quên mật khẩu".';
    if (/Password should be at least/i.test(m)) return 'Mật khẩu cần ít nhất 6 kí tự.';
    if (/rate limit|only request this after|too many/i.test(m)) return 'Bạn thao tác quá nhiều lần. Hãy đợi một lúc rồi thử lại.';
    if (/should be different/i.test(m)) return 'Mật khẩu mới phải khác mật khẩu cũ.';
    if (/JWT|session.*(missing|expired)|Auth session missing/i.test(m)) return 'Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.';
    if (/row-level security/i.test(m)) return 'Bạn không có quyền làm việc này.';
    return m || 'Có lỗi xảy ra, hãy thử lại.';
  }
  function must(r) { if (r.error) throw r.error; return r.data; }
  function home() { return location.origin + location.pathname; }

  return {
    configured: configured, load: load, onChange: onChange, viError: viError,
    bootIfNeeded: function () { if (configured() && (hasStoredSession() || /[?&](code|error_description)=/.test(location.search))) load().catch(function () { }); },
    db: function () { return client; },
    user: function () { return user; },
    name: function () { return (profile && profile.display_name) || (user && user.email) || ''; },
    isAdmin: function () { return !!(profile && profile.is_admin); },
    signIn: function (email, pw) { return load().then(function (c) { return c.auth.signInWithPassword({ email: email, password: pw }); }).then(must); },
    signUp: function (email, pw, name) {
      return load().then(function (c) { return c.auth.signUp({ email: email, password: pw, options: { data: { display_name: name }, emailRedirectTo: home() } }); }).then(must);
    },
    signOut: function () { return load().then(function (c) { return c.auth.signOut(); }).then(must); },
    resetPassword: function (email) { return load().then(function (c) { return c.auth.resetPasswordForEmail(email, { redirectTo: home() }); }).then(must); },
    updatePassword: function (pw) { return load().then(function (c) { return c.auth.updateUser({ password: pw }); }).then(must); },
    updateName: function (n) {
      return load().then(function (c) { return c.from('profiles').update({ display_name: n }).eq('id', user.id); }).then(must)
        .then(function () { profile = Object.assign({}, profile, { display_name: n }); notify('PROFILE'); });
    }
  };
})();

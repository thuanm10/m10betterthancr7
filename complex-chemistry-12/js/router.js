/* =====================================================================
 * COMPLEX CHEMISTRY 12 – KHUNG TRANG & ĐIỀU HƯỚNG (Hash Router)
 * Đường dẫn dạng /#/thu-vien chạy ổn định trên Netlify và trong app Capacitor.
 * ===================================================================== */
var Router = (function () {
  'use strict';
  var $ = App.$, $$ = App.$$, esc = App.esc;

  var NAV = [
    { path: '/', label: 'Trang chủ', icon: 'house' },
    { path: '/goi-ten', label: 'Gọi tên', icon: 'spell-check' },
    { path: '/luyen-tap', label: 'Luyện tập', icon: 'target' },
    { path: '/bai-tap', label: 'Bài tập', icon: 'notebook-pen' },
    { path: '/de-kiem-tra', label: 'Đề kiểm tra AI', short: 'Đề AI', icon: 'file-text' },
    { path: '/huong-dan', label: 'Hướng dẫn', icon: 'book-open' },
    { path: '/tra-cuu', label: 'Tra cứu ngược', icon: 'arrow-right-left', sep: true },
    { path: '/phat-am', label: 'Luyện phát âm', icon: 'mic' },
    { path: '/flashcard', label: 'Flashcard', icon: 'layers' },
    { path: '/thu-vien', label: 'Thư viện', icon: 'library' },
    { path: '/dien-dan', label: 'Diễn đàn', icon: 'messages-square' },
    { path: '/gioi-thieu', label: 'Giới thiệu', icon: 'info', sep: true },
    { path: '/lien-he', label: 'Liên hệ & Báo lỗi', icon: 'message-circle' },
    { path: '/cai-dat', label: 'Cài đặt', icon: 'settings' }
  ];
  var BOTTOM = ['/', '/goi-ten', '/luyen-tap', '/de-kiem-tra', '/huong-dan'];

  /* ---------- bảng đường dẫn ---------- */
  var routes = [];
  function add(pattern, handler) {
    var keys = [];
    var re = new RegExp('^' + pattern.replace(/\/:(\w+)/g, function (_, k) { keys.push(k); return '/([^/]+)'; }) + '/?$');
    routes.push({ re: re, keys: keys, handler: handler });
  }
  function parseHash() {
    var h = location.hash.replace(/^#/, '') || '/', qi = h.indexOf('?'), query = {};
    var path = qi >= 0 ? h.slice(0, qi) : h;
    if (qi >= 0) h.slice(qi + 1).split('&').forEach(function (kv) { var p = kv.split('='); if (p[0]) query[decodeURIComponent(p[0])] = decodeURIComponent(p.slice(1).join('=')); }); // giữ nguyên dấu "+" (điện tích)
    if (path[0] !== '/') path = '/' + path;
    return { path: path, query: query };
  }
  function go(path, opts) {
    if (opts && opts.replace) location.replace('#' + path); else location.hash = '#' + path;
  }
  // đổi query trên thanh địa chỉ mà không chuyển trang (để chia sẻ link)
  function setQuery(path, query) {
    var qs = Object.keys(query).filter(function (k) { return query[k]; }).map(function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(query[k]); }).join('&');
    try { history.replaceState(history.state, '', '#' + path + (qs ? '?' + qs : '')); } catch (e) { }
  }

  /* ngăn xếp lịch sử trong web: để nút "Quay lại" không thoát khỏi web */
  var stack = [];
  function track(path) {
    if (stack.length > 1 && stack[stack.length - 2] === path) stack.pop();
    else if (stack[stack.length - 1] !== path) stack.push(path);
  }
  function back(fallback) { if (stack.length > 1) history.back(); else go(fallback || '/'); }

  /* ---------- đầu trang: đường dẫn vị trí + nút quay lại + tiêu đề ---------- */
  function pageHead(o) {
    var crumbs = [{ label: 'Trang chủ', href: '/' }].concat(o.crumbs || []);
    var parent = crumbs.length > 1 ? crumbs[crumbs.length - 2].href : '/';
    var bc = crumbs.map(function (c, i) {
      return i === crumbs.length - 1 ? '<span aria-current="page">' + c.label + '</span>' : '<a href="#' + c.href + '">' + c.label + '</a>';
    }).join('<i data-lucide="chevron-right" class="bc-sep"></i>');
    return '<div class="page-head">' +
      '<div class="ph-row"><button class="icon-btn back-btn" data-back="' + esc(parent) + '" aria-label="Quay lại" title="Quay lại"><i data-lucide="arrow-left"></i></button>' +
      '<nav class="breadcrumb" aria-label="Đường dẫn vị trí">' + bc + '</nav></div>' +
      '<div class="ph-title"><div><h1 tabindex="-1">' + o.title + '</h1>' + (o.sub ? '<p>' + o.sub + '</p>' : '') + '</div></div></div>';
  }

  /* ---------- vẽ trang ---------- */
  var current = null, token = 0;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function render() {
    var loc = parseHash(), my = ++token, page = null, params = {};
    // Chỉ lần đầu mở web (chưa lưu chế độ nào) mới hiện màn hình chọn chế độ; giữ nguyên cả phần ?f=… của link.
    if (!App.getSetting('nameMode') && loc.path !== '/chon-che-do') { go('/chon-che-do?next=' + encodeURIComponent(location.hash.slice(1) || '/'), { replace: true }); return; }
    track(loc.path);
    for (var i = 0; i < routes.length && !page; i++) {
      var m = routes[i].re.exec(loc.path);
      if (m) { routes[i].keys.forEach(function (k, j) { params[k] = decodeURIComponent(m[j + 1]); }); page = routes[i].handler(params, loc.query) || null; }
    }
    if (!page) page = Pages.notFound(loc.path);
    if (page.redirect) { stack.pop(); go(page.redirect, { replace: true }); return; }

    closeDrawer();
    Speech.cancel(); Speech.stop();
    var app = $('#app'), old = app.firstElementChild;
    if (current && current.unmount) { try { current.unmount(); } catch (e) { } }
    current = page;
    function swap() {
      if (my !== token) return;
      var el = document.createElement('section');
      el.className = 'page' + (page.wide ? ' wide' : '') + (page.cls ? ' ' + page.cls : '');
      el.innerHTML = (page.head ? pageHead(page.head) : '') + (page.html || '');
      app.innerHTML = ''; app.appendChild(el);
      window.scrollTo(0, 0);
      document.title = page.title ? page.title + ' – Complex Chemistry 12' : 'Complex Chemistry 12 – Luyện Đọc Tên Phức Chất';
      highlight(loc.path);
      $('#fabReport').classList.toggle('hidden', loc.path.indexOf('/lien-he') === 0);
      if (page.mount) page.mount(el, loc.query);
      App.icons();
      var h1 = $('h1', el); if (h1 && stack.length > 1) h1.focus({ preventScroll: true });
    }
    if (old && !reduce) { old.classList.add('page-out'); setTimeout(swap, 140); } else swap();
  }
  function modeUI() {
    var iu = App.mode() === 'iupac';
    $$('[data-mode-toggle]').forEach(function (b) {
      b.innerHTML = '<span class="mt-on">' + (iu ? 'IUPAC' : 'VI') + '</span><i data-lucide="arrow-left-right"></i><span class="mt-off">' + (iu ? 'VI' : 'IUPAC') + '</span>';
      b.setAttribute('aria-label', 'Đang ở chế độ ' + (iu ? 'IUPAC' : 'tiếng Việt') + '. Bấm để chuyển sang ' + (iu ? 'tiếng Việt' : 'IUPAC'));
    });
    App.icons();
  }
  function highlight(path) {
    var seg = '/' + (path.split('/')[1] || '');
    $$('[data-nav]').forEach(function (a) {
      var on = a.getAttribute('data-nav') === seg;
      a.classList.toggle('active', on);
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
  }

  /* ---------- menu trượt (điện thoại / máy tính bảng) ---------- */
  function openDrawer() {
    document.body.classList.add('drawer-open'); $('#drawerBackdrop').hidden = false;
    $('#menuOpen').setAttribute('aria-expanded', 'true');
    var first = $('#sideNav a'); if (first) first.focus({ preventScroll: true });
  }
  function closeDrawer() {
    if (!document.body.classList.contains('drawer-open')) return;
    document.body.classList.remove('drawer-open'); $('#drawerBackdrop').hidden = true;
    $('#menuOpen').setAttribute('aria-expanded', 'false');
  }

  function initShell() {
    $('#sideNav').innerHTML = NAV.map(function (n) {
      return (n.sep ? '<div class="nav-sep" role="separator"></div>' : '') + '<a href="#' + n.path + '" data-nav="' + n.path + '"><i data-lucide="' + n.icon + '"></i><span>' + n.label + '</span></a>';
    }).join('');
    $('#bottomNav').innerHTML = BOTTOM.map(function (p) {
      var n = NAV.filter(function (x) { return x.path === p; })[0];
      return '<a href="#' + n.path + '" data-nav="' + n.path + '"><i data-lucide="' + n.icon + '"></i><span>' + (n.short || n.label) + '</span></a>';
    }).join('');
    if (window.Capacitor) document.body.classList.add('is-app');
    $('#menuOpen').addEventListener('click', openDrawer);
    $('#menuClose').addEventListener('click', closeDrawer);
    $('#drawerBackdrop').addEventListener('click', closeDrawer);
    $('#sideNav').addEventListener('click', function (e) { if (e.target.closest('a')) closeDrawer(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeDrawer(); });
    $$('[data-mode-toggle]').forEach(function (b) {
      b.addEventListener('click', function () {
        App.setSetting('nameMode', App.mode() === 'iupac' ? 'vi' : 'iupac');
        App.toast(App.mode() === 'iupac' ? 'Đã chuyển sang chế độ IUPAC (tên tiếng Anh).' : 'Đã chuyển sang chế độ tiếng Việt (SGK).', 'languages');
      });
    });
    document.addEventListener('modechange', function () { modeUI(); if (parseHash().path !== '/chon-che-do') render(); });
    modeUI();
    $$('[data-theme-toggle]').forEach(function (b) { b.addEventListener('click', function () { App.setTheme(App.isDark() ? 'light' : 'dark'); }); });
    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-back]'); if (b) back(b.getAttribute('data-back'));
    });
    // nút lên đầu trang
    var top = $('#toTop'), ticking = false;
    function onScroll() {
      ticking = false;
      top.classList.toggle('show', window.scrollY > 500);
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
    top.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); });
    // chân trang
    var C = SITE_CONFIG;
    $('#ftYear').textContent = C.year;
    watchBadge();
  }
  /* Netlify (gói miễn phí) tự chèn huy hiệu "Powered by Netlify" ở góc dưới phải.
   * Đo chiều cao của nó rồi báo cho CSS (--badge-h) để thanh đáy, nút nổi và chân trang tự né ra. */
  function watchBadge() {
    function check() {
      var f = document.getElementById('nl-badge-frame'), h = f ? Math.round(f.getBoundingClientRect().height) : 0;
      document.documentElement.style.setProperty('--badge-h', Math.min(h, 80) + 'px');
    }
    check();
    if ('MutationObserver' in window) new MutationObserver(check).observe(document.body, { childList: true });
  }

  function start() {
    initShell();
    window.addEventListener('hashchange', render);
    render();
  }

  return { add: add, go: go, back: back, setQuery: setQuery, pageHead: pageHead, start: start, NAV: NAV };
})();

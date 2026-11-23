/* Khởi động website: dựng khung trang và mở trang theo đường dẫn hiện tại */
(function () {
  'use strict';
  function boot() {
    Router.start(); App.icons();
    // tên tài khoản ở cuối thanh bên (chỉ tải Supabase nếu trình duyệt đã từng đăng nhập)
    var a = document.getElementById('sideAccount');
    Auth.onChange(function () {
      var u = Auth.user();
      a.href = u ? '#/tai-khoan' : '#/dang-nhap';
      a.querySelector('span').textContent = u ? Auth.name() : 'Đăng nhập';
    });
    Auth.bootIfNeeded();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();

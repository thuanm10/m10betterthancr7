/* =====================================================================
 * NỘI DUNG LÝ THUYẾT RIÊNG CHO CHẾ ĐỘ IUPAC (vẫn giải thích bằng tiếng Việt)
 * + bài "Khác nhau giữa cách gọi tên tiếng Việt và IUPAC" (dùng chung).
 * Bài nào không có htmlIupac thì dùng chung nội dung với chế độ tiếng Việt.
 * ===================================================================== */
(function () {
  function L(slug) { return LESSONS.filter(function (x) { return x.slug === slug; })[0]; }

  L('quy-tac-goi-ten').htmlIupac = `
<div class="formula-rule"><span>Số lượng</span>+<span>Tên phối tử</span>+<span>Tên kim loại</span>+<span>(Số oxi hóa La Mã)</span></div>
<p>Tên IUPAC <b>viết liền, không có dấu cách</b> giữa phối tử và kim loại. Với ion, chữ <b>“ion” đứng cuối</b>.</p>
<div class="rule-grid">
  <div class="rule"><h4><i data-lucide="circle-plus"></i> Cation phức</h4><p>Dùng tên tiếng Anh của kim loại (copper, iron, silver…).</p><p class="ex">[Cu(NH₃)₄]²⁺ → tetraamminecopper(II) ion<br>[Ag(NH₃)₂]⁺ → diamminesilver(I) ion</p></div>
  <div class="rule"><h4><i data-lucide="circle-minus"></i> Anion phức</h4><p>Tên kim loại đổi sang đuôi <b>-ate</b>; sáu kim loại dùng gốc Latin: ferrate, cuprate, argentate, aurate, plumbate, stannate.</p><p class="ex">[Fe(CN)₆]³⁻ → hexacyanidoferrate(III) ion<br>[Zn(OH)₄]²⁻ → tetrahydroxidozincate(II) ion</p></div>
  <div class="rule"><h4><i data-lucide="circle-dot"></i> Phức trung hòa</h4><p>Như cation phức nhưng <b>không có chữ “ion”</b>. Số oxi hóa 0 viết là (0).</p><p class="ex">[Pt(NH₃)₂Cl₂] → diamminedichloridoplatinum(II)<br>[Ni(CO)₄] → tetracarbonylnickel(0)</p></div>
</div>
<h4>Hợp chất có cầu ngoại (muối)</h4>
<p>Gọi <b>cation trước, anion sau</b>, cách nhau một dấu cách. Không ghi số lượng ion cầu ngoại.</p>
<div class="example">K₄[Fe(CN)₆] → potassium hexacyanidoferrate(II) · [Cu(NH₃)₄]SO₄ → tetraamminecopper(II) sulfate · [Co(NH₃)₅Cl]Cl₂ → pentaamminechloridocobalt(III) chloride</div>`;

  L('phoi-tu').htmlIupac = `
<p>Theo IUPAC 2005, phối tử <b>anion</b> có đuôi <b>“-ido”</b> (chlorido, cyanido, hydroxido) – gọi là <b>kiểu mới</b>. Sách cũ dùng đuôi <b>“-o”</b> (chloro, cyano, hydroxo) – <b>kiểu cũ</b>. Phối tử trung hòa có tên riêng: <b>ammine</b> (NH₃ – hai chữ m, có chữ e), aqua (H₂O), carbonyl (CO).</p>
{{LIGAND_TABLE}}
<p class="small muted">Chọn kiểu mới / kiểu cũ trong <a href="#/cai-dat">Cài đặt</a>. Mặc định là kiểu mới.</p>`;

  L('tien-to').html = L('tien-to').html.replace(/<div class="table-wrap">[\s\S]*?<\/table><\/div>/, '{{PREFIX_TABLE}}');
  L('tien-to').htmlIupac = `
{{PREFIX_TABLE}}
<ul>
  <li>Tên tiếng Anh viết <b>“di”</b> (diammine, dichlorido) – khác tên tiếng Việt viết “đi”.</li>
  <li>Dùng <b>bis, tris, tetrakis</b> khi tên phối tử phức tạp (ethylenediamine, oxalato, thiosulfato); tên phối tử đặt trong ngoặc tròn.</li>
  <li>Không lược nguyên âm: <b>tetraammine</b>, <b>pentaaqua</b>, <b>hexaaqua</b>.</li>
</ul>
<div class="example">[Co(en)₃]³⁺ → tris(ethylenediamine)cobalt(III) ion · [Ag(S₂O₃)₂]³⁻ → bis(thiosulfato)argentate(I) ion</div>`;

  L('ten-latin').htmlIupac = `
<p>Khi phức là <b>anion</b>, tên kim loại thêm đuôi <b>-ate</b>. Sáu kim loại dùng gốc Latin (tô màu): <b>ferrate</b> (Fe), <b>cuprate</b> (Cu), <b>argentate</b> (Ag), <b>aurate</b> (Au), <b>plumbate</b> (Pb), <b>stannate</b> (Sn). Các kim loại khác chỉ thêm “-ate”: zincate, aluminate, cobaltate, nickelate, chromate, manganate, platinate.</p>
{{METAL_TABLE}}`;

  L('thu-tu-phoi-tu').htmlIupac = `
<p>Xếp phối tử theo <b>thứ tự chữ cái tiếng Anh</b> của tên phối tử, <b>bỏ qua tiền tố số lượng</b> (di, tri, tetra, bis…).</p>
<div class="example">[Co(NH₃)₄Cl₂]⁺: <b>a</b>mmine trước <b>c</b>hlorido → tetraamminedichloridocobalt(III) ion – “di” không được tính.</div>
<div class="example">[Cr(H₂O)₄Cl₂]⁺: <b>a</b>qua trước <b>c</b>hlorido → tetraaquadichloridochromium(III) ion.</div>
<div class="example">[Fe(H₂O)₅(SCN)]²⁺: <b>a</b>qua trước <b>t</b>hiocyanato → pentaaquathiocyanato-N-iron(III) ion (SCN⁻ liên kết với Fe qua nguyên tử N).</div>
<p class="small muted">Lưu ý: chữ cái đầu của tên tiếng Anh và tiếng Việt có thể khác (cyanido bắt đầu bằng “c”, xiano bắt đầu bằng “x”), nên thứ tự phối tử trong tên IUPAC có thể khác tên tiếng Việt.</p>`;

  L('loi-sai').htmlIupac = `
<div class="mistakes">
  <div class="mistake"><b>Coi ion cầu ngoại là phối tử.</b> SO₄²⁻ trong [Cu(NH₃)₄]SO₄ không phải phối tử; số phối trí là 4.</div>
  <div class="mistake"><b>Thiếu chữ “e” hoặc thiếu một chữ “m”:</b> <s>tetraammin</s>, <s>tetraamine</s> → <b>tetraammine</b>.</div>
  <div class="mistake"><b>Có dấu cách trong tên ion phức:</b> <s>tetraammine copper(II)</s> → <b>tetraamminecopper(II)</b>.</div>
  <div class="mistake"><b>Quên đuôi -ate cho anion phức:</b> <s>hexacyanidoiron(III)</s> → <b>hexacyanidoferrate(III)</b>; <s>tetrachloridocopperate(II)</s> → <b>tetrachloridocuprate(II)</b>.</div>
  <div class="mistake"><b>Dùng -ate cho cation phức:</b> <s>tetraamminecuprate(II)</s> → <b>tetraamminecopper(II)</b>.</div>
  <div class="mistake"><b>Lẫn kiểu mới và kiểu cũ trong một tên:</b> <s>dichloridodicyano…</s> → chọn một kiểu: <b>chlorido + cyanido</b> hoặc <b>chloro + cyano</b>.</div>
  <div class="mistake"><b>Xếp phối tử theo tiền tố:</b> <s>dichloridotetraammine…</s> → <b>tetraamminedichlorido…</b> (ammine trước chlorido).</div>
  <div class="mistake"><b>Ghi số oxi hóa sai dạng:</b> <s>copper(2)</s>, <s>copper(+2)</s> → <b>copper(II)</b>.</div>
  <div class="mistake"><b>Ghi số lượng ion cầu ngoại:</b> <s>tripotassium hexacyanidoferrate(III)</s> → <b>potassium hexacyanidoferrate(III)</b>.</div>
  <div class="mistake"><b>Thêm “ion” cho phức trung hòa:</b> <s>tetracarbonylnickel(0) ion</s> → <b>tetracarbonylnickel(0)</b>.</div>
</div>`;

  L('meo-nho').htmlIupac = `
<div class="tips">
  <div class="tip"><i data-lucide="lightbulb"></i><div><b>“Âm thì -ate.”</b> Anion phức → tên kim loại đuôi -ate (ferrate, cuprate…); cation và phức trung hòa → tên tiếng Anh thường (iron, copper…).</div></div>
  <div class="tip"><i data-lucide="lightbulb"></i><div><b>Viết liền một mạch:</b> tetra + ammine + copper + (II) → tetraamminecopper(II). Chữ “ion” để cuối.</div></div>
  <div class="tip"><i data-lucide="lightbulb"></i><div><b>Phối tử âm đuôi “-ido”</b> (kiểu mới): chlorido, cyanido, hydroxido. <b>Phối tử trung hòa tên riêng</b>: ammine, aqua, carbonyl.</div></div>
  <div class="tip"><i data-lucide="lightbulb"></i><div><b>6 gốc Latin cần thuộc:</b> Fe → ferrate, Cu → cuprate, Ag → argentate (Argentina), Au → aurate, Pb → plumbate (plumber), Sn → stannate.</div></div>
  <div class="tip"><i data-lucide="lightbulb"></i><div><b>Đọc số La Mã thành chữ:</b> copper(II) đọc “copper two” (cóp-pơ tu); iron(III) đọc “iron three”.</div></div>
  <div class="tip"><i data-lucide="lightbulb"></i><div><b>Hình học:</b> 2 – thẳng; 4 – tứ diện hoặc vuông phẳng (“Pt, Pd, Au(III) thích vuông”); 6 – bát diện.</div></div>
</div>`;

  // Bài riêng: so sánh hai cách gọi tên (dùng chung cho cả 2 chế độ)
  LESSONS.splice(LESSONS.indexOf(L('meo-nho')), 0, {
    slug: 'vi-va-iupac', title: 'Khác nhau giữa cách gọi tên tiếng Việt và IUPAC', icon: 'columns-2',
    html: `
<p>Cùng một phức chất nhưng tên tiếng Việt (SGK) và tên IUPAC (tiếng Anh) khác nhau ở nhiều điểm nhỏ. Nắm bảng dưới để không bị lẫn khi chuyển chế độ.</p>
<div class="table-wrap"><table class="table">
  <thead><tr><th>Điểm khác</th><th>Tiếng Việt (SGK)</th><th>IUPAC</th></tr></thead>
  <tbody>
    <tr><td>Phối tử NH₃</td><td><b>ammin</b></td><td><b>ammine</b> (có chữ e)</td></tr>
    <tr><td>Phối tử CN⁻, OH⁻, Cl⁻</td><td>xiano, hiđroxo, cloro</td><td>cyanido, hydroxido, chlorido <small class="muted">(kiểu cũ: cyano, hydroxo, chloro)</small></td></tr>
    <tr><td>Phối tử CO</td><td>cacbonyl</td><td>carbonyl</td></tr>
    <tr><td>Tiền tố 2</td><td><b>đi</b></td><td><b>di</b></td></tr>
    <tr><td>Kim loại trong cation</td><td>đồng, sắt, bạc, coban</td><td>copper, iron, silver, cobalt</td></tr>
    <tr><td>Kim loại trong anion</td><td>gốc Latin + <b>at</b>: cuprat, ferat, argentat, cobaltat</td><td>đuôi <b>-ate</b>: cuprate, ferrate, argentate, cobaltate</td></tr>
    <tr><td>Dấu cách</td><td>Có dấu cách trước tên kim loại tiếng Việt: tetraammin đồng(II)</td><td><b>Viết liền</b>: tetraamminecopper(II)</td></tr>
    <tr><td>Chữ “ion”</td><td>Đứng <b>trước</b>: ion tetraammin đồng(II)</td><td>Đứng <b>sau</b>: tetraamminecopper(II) ion</td></tr>
    <tr><td>Thứ tự phối tử</td><td>Theo chữ cái tên tiếng Việt</td><td>Theo chữ cái tên tiếng Anh – có thể khác (xiano ↔ cyanido)</td></tr>
    <tr><td>Cầu ngoại</td><td>kali, natri, clorua, sunfat</td><td>potassium, sodium, chloride, sulfate</td></tr>
  </tbody>
</table></div>
<div class="example"><b>K₃[Fe(CN)₆]</b>: kali hexaxianoferat(III) ⇄ potassium hexacyanidoferrate(III)</div>
<div class="example"><b>[Pt(NH₃)₂Cl₂]</b>: điamminđicloro platin(II) ⇄ diamminedichloridoplatinum(II)</div>
<p class="small muted">Mẹo: ở trang Gọi tên và Thư viện, bấm <b>“So sánh VI – IUPAC”</b> để xem hai tên của cùng một chất đặt song song.</p>`
  });
})();

/* =====================================================================
 * COMPLEX CHEMISTRY 12 – NỘI DUNG LÝ THUYẾT (mỗi phần là một trang con)
 * Đường dẫn: /#/huong-dan/<slug>
 * {{LIGAND_TABLE}}, {{METAL_TABLE}}, {{GEO_GRID}} được web tự điền từ data.js.
 * ===================================================================== */
var LESSONS = [
  {
    slug: 'phuc-chat-la-gi', title: 'Phức chất là gì? Cấu tạo của phức chất', icon: 'atom',
    html: `
<p><b>Phức chất</b> là hợp chất chứa <b>nguyên tử trung tâm</b> (thường là ion kim loại chuyển tiếp) liên kết với các <b>phối tử</b> (phân tử hoặc anion) bằng <b>liên kết cho – nhận</b>: phối tử cho cặp electron chưa liên kết vào orbital trống của nguyên tử trung tâm.</p>
<div class="diagram">
  <svg viewBox="0 0 560 250" role="img" aria-label="Sơ đồ cấu tạo phức chất [Cu(NH3)4]SO4">
    <rect x="40" y="40" width="330" height="170" rx="20" class="d-inner"/>
    <text x="205" y="30" class="d-label" text-anchor="middle">CẦU NỘI (ion phức) [Cu(NH₃)₄]²⁺</text>
    <line x1="205" y1="125" x2="205" y2="70" class="d-bond"/><line x1="205" y1="125" x2="205" y2="180" class="d-bond"/>
    <line x1="205" y1="125" x2="110" y2="125" class="d-bond"/><line x1="205" y1="125" x2="300" y2="125" class="d-bond"/>
    <circle cx="205" cy="125" r="26" class="d-metal"/><text x="205" y="131" text-anchor="middle" class="d-mtext">Cu²⁺</text>
    <g class="d-lig"><circle cx="205" cy="62" r="20"/><circle cx="205" cy="188" r="20"/><circle cx="100" cy="125" r="20"/><circle cx="310" cy="125" r="20"/></g>
    <g class="d-ltext" text-anchor="middle"><text x="205" y="67">NH₃</text><text x="205" y="193">NH₃</text><text x="100" y="130">NH₃</text><text x="310" y="130">NH₃</text></g>
    <rect x="410" y="95" width="120" height="60" rx="16" class="d-outer"/>
    <text x="470" y="131" text-anchor="middle" class="d-mtext2">SO₄²⁻</text>
    <text x="470" y="85" text-anchor="middle" class="d-label">CẦU NGOẠI</text>
    <text x="132" y="232" class="d-small">phối tử (cho cặp e)</text>
    <text x="236" y="232" class="d-small">→ nguyên tử trung tâm</text>
  </svg>
</div>
<ul>
  <li><b>Nguyên tử trung tâm</b>: nguyên tử/ion kim loại nhận cặp electron, ví dụ Cu²⁺ trong [Cu(NH₃)₄]²⁺.</li>
  <li><b>Phối tử</b>: phân tử (NH₃, H₂O, CO) hoặc anion (Cl⁻, CN⁻, OH⁻) có cặp electron chưa liên kết.</li>
  <li><b>Số phối trí</b>: số liên kết σ giữa nguyên tử trung tâm và phối tử. Phối tử hai càng như etylenđiamin (en), oxalato tạo 2 liên kết.</li>
  <li><b>Cầu nội</b>: phần trong dấu [ ] gồm nguyên tử trung tâm + phối tử. <b>Cầu ngoại</b>: các ion nằm ngoài [ ], trung hòa điện tích cầu nội.</li>
  <li>Phức chất có thể là <b>ion phức</b> ([Ag(NH₃)₂]⁺, [Fe(CN)₆]³⁻) hoặc <b>phân tử trung hòa</b> ([Pt(NH₃)₂Cl₂], [Ni(CO)₄]).</li>
</ul>
<div class="example"><b>Ví dụ:</b> Trong [Cu(NH₃)₄]SO₄: nguyên tử trung tâm Cu²⁺, phối tử NH₃, số phối trí 4, cầu nội [Cu(NH₃)₄]²⁺, cầu ngoại SO₄²⁻.</div>`
  },
  {
    slug: 'quy-tac-goi-ten', title: 'Quy tắc gọi tên cation phức, anion phức, phức trung hòa', icon: 'spell-check',
    html: `
<div class="formula-rule"><span>Số lượng</span>+<span>Tên phối tử</span>+<span>Tên kim loại</span>+<span>(Số oxi hóa La Mã)</span></div>
<div class="rule-grid">
  <div class="rule"><h4><i data-lucide="circle-plus"></i> Cation phức</h4><p>Tên kim loại giữ nguyên <b>tiếng Việt</b>. Thêm chữ “ion” phía trước khi gọi riêng ion.</p><p class="ex">[Cu(NH₃)₄]²⁺ → ion tetraammin đồng(II)<br>[Ag(NH₃)₂]⁺ → ion điammin bạc(I)</p></div>
  <div class="rule"><h4><i data-lucide="circle-minus"></i> Anion phức</h4><p>Dùng <b>gốc Latin của kim loại + đuôi “at”</b>, viết liền sau tên phối tử.</p><p class="ex">[Fe(CN)₆]³⁻ → ion hexaxianoferat(III)<br>[Zn(OH)₄]²⁻ → ion tetrahiđroxozincat(II)</p></div>
  <div class="rule"><h4><i data-lucide="circle-dot"></i> Phức trung hòa</h4><p>Gọi như cation phức nhưng <b>không có chữ “ion”</b>. Số oxi hóa 0 viết là (0).</p><p class="ex">[Pt(NH₃)₂Cl₂] → điamminđicloro platin(II)<br>[Ni(CO)₄] → tetracacbonyl niken(0)</p></div>
</div>
<h4>Hợp chất có cầu ngoại</h4>
<p>Gọi như tên muối: <b>cation trước, anion sau</b>. Không ghi số lượng ion cầu ngoại.</p>
<div class="example">K₃[Fe(CN)₆] → kali hexaxianoferat(III) · [Cu(NH₃)₄]SO₄ → tetraammin đồng(II) sunfat · [Co(NH₃)₅Cl]Cl₂ → pentaammincloro coban(III) clorua</div>
<p class="small muted">Ghi chú cách viết: web tách tên kim loại tiếng Việt bằng một dấu cách cho dễ đọc (tetraammin đồng(II)). Viết liền “tetraamminđồng(II)” cũng đúng – mục Luyện tập chấp nhận cả hai.</p>`
  },
  {
    slug: 'phoi-tu', title: 'Bảng tên phối tử thường gặp', icon: 'table',
    html: `
<p>Phối tử <b>anion</b> thường có đuôi <b>“-o”</b> (cloro, xiano, hiđroxo). Phối tử <b>trung hòa</b> có tên riêng: aqua (H₂O), ammin (NH₃ – viết <b>hai chữ m</b> để phân biệt với nhóm amin hữu cơ), cacbonyl (CO).</p>
{{LIGAND_TABLE}}
<p class="small muted">Muốn học tên phối tử tiếng Anh (ammine, chlorido, cyanido…)? Bấm nút <b>VI ⇄ IUPAC</b> trên thanh điều hướng.</p>`
  },
  {
    slug: 'tien-to', title: 'Tiền tố chỉ số lượng phối tử', icon: 'hash',
    html: `
<div class="table-wrap"><table class="table">
  <thead><tr><th>Số lượng</th><th>Tiền tố thường</th><th>Khi tên phối tử phức tạp</th></tr></thead>
  <tbody>
    <tr><td>1</td><td>(mono – thường bỏ)</td><td>–</td></tr>
    <tr><td>2</td><td><b>đi</b></td><td><b>bis</b></td></tr>
    <tr><td>3</td><td><b>tri</b></td><td><b>tris</b></td></tr>
    <tr><td>4</td><td><b>tetra</b></td><td><b>tetrakis</b></td></tr>
    <tr><td>5</td><td><b>penta</b></td><td><b>pentakis</b></td></tr>
    <tr><td>6</td><td><b>hexa</b></td><td><b>hexakis</b></td></tr>
  </tbody>
</table></div>
<ul>
  <li>Trong tên tiếng Việt luôn viết <b>“đi”</b> (điammin, đicloro); tên tiếng Anh viết “di”.</li>
  <li>Dùng <b>bis, tris, tetrakis</b> khi tên phối tử đã chứa tiền tố số hoặc là phối tử nhiều nguyên tử phức tạp (etylenđiamin, oxalato, thiosunfato). Khi đó tên phối tử đặt trong ngoặc tròn.</li>
  <li>Không lược nguyên âm: <b>tetraammin</b>, <b>pentaaqua</b>, <b>hexaaqua</b> (giữ nguyên hai chữ a).</li>
</ul>
<div class="example">[Co(en)₃]³⁺ → ion tris(etylenđiamin) coban(III) · [Ag(S₂O₃)₂]³⁻ → ion bis(thiosunfato)argentat(I)</div>`
  },
  {
    slug: 'ten-latin', title: 'Tên gốc Latin của kim loại trong anion phức', icon: 'languages',
    html: `
<p>Khi phức là <b>anion</b>, tên kim loại = <b>gốc Latin + “at”</b>. Những tên tô màu khác hẳn tên tiếng Việt – cần học thuộc.</p>
{{METAL_TABLE}}`
  },
  {
    slug: 'so-oxi-hoa', title: 'Cách tính số oxi hóa của nguyên tử trung tâm', icon: 'calculator',
    html: `
<div class="formula-rule"><span>x</span>+<span>Σ (số lượng × điện tích phối tử)</span>=<span>điện tích ion phức</span></div>
<ul>
  <li>Phối tử trung hòa (NH₃, H₂O, CO, en) có điện tích 0; Cl⁻, CN⁻, OH⁻… là −1; C₂O₄²⁻, S₂O₃²⁻ là −2.</li>
  <li>Nếu có cầu ngoại: <b>điện tích ion phức = − (tổng điện tích cầu ngoại)</b>.</li>
</ul>
<div class="example"><b>K₃[Fe(CN)₆]</b>: 3 K⁺ → ion phức −3. x + 6·(−1) = −3 ⟹ <b>x = +3</b> → trong tên viết (III).</div>
<div class="example"><b>[Co(NH₃)₅Cl]Cl₂</b>: 2 Cl⁻ cầu ngoại → ion phức +2. x + 5·0 + 1·(−1) = +2 ⟹ <b>x = +3</b>.</div>
<div class="example"><b>[Pt(NH₃)₂Cl₂]</b>: phức trung hòa. x + 2·0 + 2·(−1) = 0 ⟹ <b>x = +2</b>.</div>`
  },
  {
    slug: 'thu-tu-phoi-tu', title: 'Thứ tự gọi phối tử khi có nhiều loại', icon: 'arrow-down-a-z',
    html: `
<p>Các phối tử được gọi theo <b>thứ tự chữ cái của tên phối tử</b>, <b>không tính tiền tố số lượng</b> (đi, tri, tetra, bis…).</p>
<div class="example">[Co(NH₃)₄Cl₂]⁺: <b>a</b>mmin trước <b>c</b>loro → ion tetraamminđicloro coban(III) – “đi” không được tính khi xếp thứ tự.</div>
<div class="example">[Cr(H₂O)₄Cl₂]⁺: <b>a</b>qua trước <b>c</b>loro → ion tetraaquađicloro crom(III).</div>
<div class="example">[Fe(H₂O)₅(SCN)]²⁺: <b>a</b>qua trước <b>t</b>hioxianato → ion pentaaquathioxianato sắt(III).</div>
<p class="small muted">Lưu ý: thứ tự viết phối tử trong công thức có thể khác thứ tự đọc tên. Một số tài liệu cũ đọc phối tử âm trước phối tử trung hòa; web dùng quy tắc chữ cái theo IUPAC hiện hành.</p>`
  },
  {
    slug: 'hinh-hoc', title: 'Liên hệ số phối trí với dạng hình học', icon: 'shapes',
    html: `
{{GEO_GRID}}
<p>Số phối trí 4 có thể là <b>tứ diện</b> (Zn²⁺, Al³⁺, Ni(0), Co²⁺ với Cl⁻) hoặc <b>vuông phẳng</b> (Pt²⁺, Pd²⁺, Au³⁺, Ni²⁺ với CN⁻, Cu²⁺ với NH₃).</p>`
  },
  {
    slug: 'loi-sai', title: 'Các lỗi sai thường gặp của học sinh', icon: 'circle-x',
    html: `
<div class="mistakes">
  <div class="mistake"><b>Coi ion cầu ngoại là phối tử.</b> SO₄²⁻ trong [Cu(NH₃)₄]SO₄ nằm ngoài [ ] nên không phải phối tử; số phối trí là 4, không phải 5.</div>
  <div class="mistake"><b>Quên đổi tên kim loại sang gốc Latin cho anion phức.</b> <s>hexaxiano sắt(III)</s> → <b>hexaxianoferat(III)</b>.</div>
  <div class="mistake"><b>Dùng gốc Latin cho cation phức.</b> <s>tetraammincuprat(II)</s> → <b>tetraammin đồng(II)</b>.</div>
  <div class="mistake"><b>Viết sai chính tả:</b> <s>amin</s> → <b>ammin</b> (hai chữ m); <s>diammin</s> → <b>điammin</b>; <s>cobantat</s> → <b>cobaltat</b>.</div>
  <div class="mistake"><b>Xếp phối tử theo tiền tố.</b> <s>đicloro tetraammin</s> (xếp theo chữ “đ”) → <b>tetraamminđicloro</b> (ammin trước cloro).</div>
  <div class="mistake"><b>Tính sai số oxi hóa</b> vì quên điện tích âm của CN⁻, Cl⁻, OH⁻ hoặc quên cầu ngoại.</div>
  <div class="mistake"><b>Ghi số oxi hóa sai dạng:</b> <s>đồng(2)</s>, <s>đồng(+2)</s> → <b>đồng(II)</b>.</div>
  <div class="mistake"><b>Đếm số phối trí sai với phối tử hai càng:</b> [Co(en)₃]³⁺ có số phối trí <b>6</b>, không phải 3.</div>
  <div class="mistake"><b>Ghi số lượng ion cầu ngoại vào tên:</b> <s>trikali hexaxianoferat(III)</s> → <b>kali hexaxianoferat(III)</b>.</div>
  <div class="mistake"><b>Thêm chữ “ion” cho phức trung hòa:</b> <s>ion tetracacbonyl niken(0)</s> → <b>tetracacbonyl niken(0)</b>.</div>
</div>`
  },
  {
    slug: 'meo-nho', title: 'Mẹo ghi nhớ nhanh', icon: 'lightbulb',
    html: `
<div class="tips">
  <div class="tip"><i data-lucide="lightbulb"></i><div><b>“Âm thì Latin, dương giữ Việt.”</b> Anion phức → gốc Latin + at; cation và phức trung hòa → tên tiếng Việt.</div></div>
  <div class="tip"><i data-lucide="lightbulb"></i><div><b>Công thức tên: “Số – Phối – Kim – La Mã”</b>: tiền tố số lượng, tên phối tử, tên kim loại, số oxi hóa La Mã.</div></div>
  <div class="tip"><i data-lucide="lightbulb"></i><div><b>Phối tử âm đuôi “o”</b>: cloro, bromo, iođo, floro, xiano, hiđroxo. <b>Phối tử trung hòa tên riêng</b>: aqua, ammin, cacbonyl.</div></div>
  <div class="tip"><i data-lucide="lightbulb"></i><div><b>Gốc Latin dễ nhớ:</b> Ag – <i>Argentum</i> (Argentina = “xứ bạc”) → argentat; Pb – <i>Plumbum</i> (plumber = thợ ống chì) → plumbat; Au – <i>Aurum</i> → aurat; Fe – <i>Ferrum</i> → ferat; Cu – <i>Cuprum</i> → cuprat.</div></div>
  <div class="tip"><i data-lucide="lightbulb"></i><div><b>Số oxi hóa:</b> “x cộng điện tích phối tử bằng điện tích ion”. Phức muối kali → ion phức âm; muối clorua/sunfat → ion phức dương.</div></div>
  <div class="tip"><i data-lucide="lightbulb"></i><div><b>Hình học:</b> 2 – thẳng; 4 – tứ diện hoặc vuông phẳng (“Pt, Pd, Au(III) thích vuông”); 6 – bát diện.</div></div>
</div>`
  }
];

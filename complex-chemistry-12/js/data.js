/* =====================================================================
 * COMPLEX CHEMISTRY 12 – FILE DỮ LIỆU
 * ---------------------------------------------------------------------
 * Đây là file DUY NHẤT bạn cần sửa khi muốn:
 *   - đổi thông tin tác giả (SITE_CONFIG)
 *   - thêm / sửa phối tử, kim loại, ion cầu ngoại
 *   - thêm phức chất mới vào thư viện (COMPLEXES, ở cuối file)
 *
 * TÊN GỌI KHÔNG ĐƯỢC GÕ TAY: website tự sinh tên tiếng Việt và tên IUPAC
 * từ công thức, dựa vào các bảng LIGANDS / METALS bên dưới. Nhờ vậy mọi
 * tên trong web luôn thống nhất một quy ước (ammin, đi, cloro, xiano...).
 * ===================================================================== */

/* ---------- 1. THÔNG TIN NGƯỜI LÀM WEB ----------
 * Ô nào để trống ('') thì web tự ẩn dòng đó. */
var SITE_CONFIG = {
  authorName: 'Nguyễn Như Thuần',
  className: '',                                  // ví dụ: '12A1'
  school: 'THPT Nguyễn Đình Chiểu',
  teacher: 'Nguyễn Văn Chiến',                    // giáo viên hướng dẫn (để trống '' thì web ẩn dòng này)
  email: 'nguyennhuthuan931@gmail.com',
  zaloPhone: '0826139774',                        // số điện thoại Zalo
  facebook: 'https://www.facebook.com/nguyen.nhu.thuan.798506',
  year: 2026,

  /* --- dùng cho trang Giới thiệu --- */
  version: '1.3',                                 // tăng số này mỗi lần cập nhật lớn
  updated: '14/11/2026',                          // ngày cập nhật gần nhất
  // Vì sao làm web này. HÃY SỬA LẠI bằng lời của chính bạn (mỗi dòng là một đoạn).
  why: [
    'Phức chất là phần mới trong chương trình Hóa học 12. Lúc mới học mình hay nhầm thứ tự phối tử, quên đổi tên kim loại khi ion phức mang điện âm, và không có chỗ nào để kiểm tra lại ngay.',
    'Mình làm web này để tự luyện, và để các bạn trong lớp có chỗ tra nhanh cách gọi tên mà không phải lật lại sách.'
  ],
  // Bộ SGK và bài bạn đã dùng, ví dụ: 'Bộ Kết nối tri thức với cuộc sống – Chương 8, Bài 28 và Bài 29'.
  // Để trống thì trang Giới thiệu chỉ ghi chung là "SGK Hóa học 12".
  textbook: '',

  /* --- Đăng nhập + Diễn đàn (Supabase). Để trống thì hai phần này báo "chưa cài đặt". ---
   * Lấy ở Supabase → Project Settings → API (hoặc Data API):
   *   supabaseUrl: Project URL, dạng 'https://abcdxyz.supabase.co'
   *   supabaseKey: khóa "publishable" (sb_publishable_…) hoặc "anon public".
   * Hai giá trị này được phép công khai; quyền đọc/ghi do supabase/cai-dat.sql khóa lại.
   * TUYỆT ĐỐI không dán khóa "secret" / "service_role" vào đây. */
  supabaseUrl: 'https://xvxyscotkbsokxoebtmj.supabase.co',
  supabaseKey: 'sb_publishable_M_rQ-IQX9ElcG-QwYv5gXg_tuB6W_J3'
};

/* ---------- 2. PHỐI TỬ ----------
 * key      : cách viết trong công thức (không dấu, không điện tích)
 * vi       : tên tiếng Việt dùng khi gọi tên phức (theo SGK)
 * en       : tên IUPAC tiếng Anh kiểu mới (IUPAC Red Book 2005: chlorido, cyanido)
 * enOld    : (tùy chọn) tên IUPAC kiểu cũ (chloro, cyano) – nếu giống kiểu mới thì bỏ trống
 * charge   : điện tích của phối tử
 * dent     : số nguyên tử cho (1 = một càng, 2 = hai càng)
 * paren    : true nếu tên phối tử dài/phức tạp → dùng tiền tố bis, tris, tetrakis
 * display  : công thức hiển thị
 * aliases  : cách viết khác mà người dùng có thể gõ
 * Ghi chú: SCN⁻ trong [Fe(H₂O)₅(SCN)]²⁺ liên kết với Fe qua nguyên tử N nên tên IUPAC là thiocyanato-N.
 */
var LIGANDS = {
  NH3:  { vi: 'ammin',         en: 'ammine',          charge: 0,  dent: 1, display: 'NH₃' },
  H2O:  { vi: 'aqua',          en: 'aqua',            charge: 0,  dent: 1, display: 'H₂O', aliases: ['OH2'] },
  CO:   { vi: 'cacbonyl',      en: 'carbonyl',        charge: 0,  dent: 1, display: 'CO' },
  NO:   { vi: 'nitrozyl',      en: 'nitrosyl',        charge: 0,  dent: 1, display: 'NO' },
  en:   { vi: 'etylenđiamin',  en: 'ethylenediamine', charge: 0,  dent: 2, paren: true, display: 'en' },
  F:    { vi: 'floro',         en: 'fluorido',  enOld: 'fluoro',  charge: -1, dent: 1, display: 'F⁻' },
  Cl:   { vi: 'cloro',         en: 'chlorido',  enOld: 'chloro',  charge: -1, dent: 1, display: 'Cl⁻' },
  Br:   { vi: 'bromo',         en: 'bromido',   enOld: 'bromo',   charge: -1, dent: 1, display: 'Br⁻' },
  I:    { vi: 'iođo',          en: 'iodido',    enOld: 'iodo',    charge: -1, dent: 1, display: 'I⁻' },
  OH:   { vi: 'hiđroxo',       en: 'hydroxido', enOld: 'hydroxo', charge: -1, dent: 1, display: 'OH⁻', aliases: ['HO'] },
  CN:   { vi: 'xiano',         en: 'cyanido',   enOld: 'cyano',   charge: -1, dent: 1, display: 'CN⁻', aliases: ['NC'] },
  SCN:  { vi: 'thioxianato',   en: 'thiocyanato-N', enOld: 'isothiocyanato', charge: -1, dent: 1, display: 'SCN⁻', aliases: ['NCS'] },
  NO2:  { vi: 'nitro',         en: 'nitrito-N', enOld: 'nitro',   charge: -1, dent: 1, display: 'NO₂⁻' },
  C2O4: { vi: 'oxalato',       en: 'oxalato',         charge: -2, dent: 2, paren: true, display: 'C₂O₄²⁻', aliases: ['ox'] },
  S2O3: { vi: 'thiosunfato',   en: 'thiosulfato',     charge: -2, dent: 1, paren: true, display: 'S₂O₃²⁻' },
  SO4:  { vi: 'sunfato',       en: 'sulfato',         charge: -2, dent: 1, display: 'SO₄²⁻' },
  CO3:  { vi: 'cacbonato',     en: 'carbonato',       charge: -2, dent: 2, display: 'CO₃²⁻' }
};

/* ---------- 3. KIM LOẠI (NGUYÊN TỬ TRUNG TÂM) ----------
 * vi     : tên tiếng Việt – dùng cho cation phức và phức trung hòa
 * at     : gốc Latin + "at" – dùng khi phức là ANION
 * en/enAt: tên tiếng Anh tương ứng
 * latin  : tên Latin gốc (hiển thị trong bảng lý thuyết)
 * os     : các số oxi hóa thường gặp trong phức (dùng để cảnh báo khi bất thường)
 */
var METALS = {
  Ag: { vi: 'bạc',       at: 'argentat',  en: 'silver',    enAt: 'argentate',  latin: 'Argentum',  os: [1] },
  Au: { vi: 'vàng',      at: 'aurat',     en: 'gold',      enAt: 'aurate',     latin: 'Aurum',     os: [1, 3] },
  Cu: { vi: 'đồng',      at: 'cuprat',    en: 'copper',    enAt: 'cuprate',    latin: 'Cuprum',    os: [1, 2] },
  Fe: { vi: 'sắt',       at: 'ferat',     en: 'iron',      enAt: 'ferrate',    latin: 'Ferrum',    os: [0, 2, 3] },
  Zn: { vi: 'kẽm',       at: 'zincat',    en: 'zinc',      enAt: 'zincate',    latin: 'Zincum',    os: [2] },
  Al: { vi: 'nhôm',      at: 'aluminat',  en: 'aluminium', enAt: 'aluminate',  latin: 'Aluminium', os: [3] },
  Co: { vi: 'coban',     at: 'cobaltat',  en: 'cobalt',    enAt: 'cobaltate',  latin: 'Cobaltum',  os: [2, 3] },
  Ni: { vi: 'niken',     at: 'nickelat',  en: 'nickel',    enAt: 'nickelate',  latin: 'Niccolum',  os: [0, 2] },
  Cr: { vi: 'crom',      at: 'cromat',    en: 'chromium',  enAt: 'chromate',   latin: 'Chromium',  os: [0, 3] },
  Mn: { vi: 'mangan',    at: 'manganat',  en: 'manganese', enAt: 'manganate', latin: 'Manganum',  os: [0, 2, 3] },
  Pt: { vi: 'platin',    at: 'platinat',  en: 'platinum',  enAt: 'platinate',  latin: 'Platinum',  os: [2, 4] },
  Pd: { vi: 'palađi',    at: 'palađat',   en: 'palladium', enAt: 'palladate',  latin: 'Palladium', os: [2, 4] },
  Hg: { vi: 'thủy ngân', at: 'mercurat',  en: 'mercury',   enAt: 'mercurate',  latin: 'Hydrargyrum', os: [2] },
  Cd: { vi: 'cađimi',    at: 'cađimat',   en: 'cadmium',   enAt: 'cadmate',    latin: 'Cadmium',   os: [2] },
  Sn: { vi: 'thiếc',     at: 'stannat',   en: 'tin',       enAt: 'stannate',   latin: 'Stannum',   os: [2, 4] },
  Pb: { vi: 'chì',       at: 'plumbat',   en: 'lead',      enAt: 'plumbate',   latin: 'Plumbum',   os: [2, 4] },
  Ti: { vi: 'titan',     at: 'titanat',   en: 'titanium',  enAt: 'titanate',   latin: 'Titanium',  os: [3, 4] },
  V:  { vi: 'vanađi',    at: 'vanađat',   en: 'vanadium',  enAt: 'vanadate',   latin: 'Vanadium',  os: [2, 3] }
};

/* ---------- 4. ION Ở CẦU NGOẠI ---------- */
var OUTER_CATIONS = {
  K:   { vi: 'kali',   en: 'potassium', charge: 1, display: 'K⁺' },
  Na:  { vi: 'natri',  en: 'sodium',    charge: 1, display: 'Na⁺' },
  Li:  { vi: 'liti',   en: 'lithium',   charge: 1, display: 'Li⁺' },
  NH4: { vi: 'amoni',  en: 'ammonium',  charge: 1, display: 'NH₄⁺' },
  H:   { vi: 'hiđro',  en: 'hydrogen',  charge: 1, display: 'H⁺' },
  Ca:  { vi: 'canxi',  en: 'calcium',   charge: 2, display: 'Ca²⁺' },
  Ba:  { vi: 'bari',   en: 'barium',    charge: 2, display: 'Ba²⁺' },
  Mg:  { vi: 'magie',  en: 'magnesium', charge: 2, display: 'Mg²⁺' }
};
var OUTER_ANIONS = {
  Cl:   { vi: 'clorua',   en: 'chloride',    charge: -1, display: 'Cl⁻' },
  Br:   { vi: 'bromua',   en: 'bromide',     charge: -1, display: 'Br⁻' },
  I:    { vi: 'iođua',    en: 'iodide',      charge: -1, display: 'I⁻' },
  F:    { vi: 'florua',   en: 'fluoride',    charge: -1, display: 'F⁻' },
  OH:   { vi: 'hiđroxit', en: 'hydroxide',   charge: -1, display: 'OH⁻' },
  NO3:  { vi: 'nitrat',   en: 'nitrate',     charge: -1, display: 'NO₃⁻' },
  ClO4: { vi: 'peclorat', en: 'perchlorate', charge: -1, display: 'ClO₄⁻' },
  SO4:  { vi: 'sunfat',   en: 'sulfate',     charge: -2, display: 'SO₄²⁻' },
  CO3:  { vi: 'cacbonat', en: 'carbonate',   charge: -2, display: 'CO₃²⁻' }
};

/* ---------- 4b. PHIÊN ÂM KIỂU VIỆT CHO TÊN IUPAC ----------
 * Giúp học sinh đọc theo tên tiếng Anh: tetraamminecopper(II) → "tê-tra · am-min · cóp-pơ · tu".
 * Từ nào chưa có ở đây thì web hiển thị nguyên từ tiếng Anh. */
var PHONETIC = {
  // tiền tố
  di: 'đai', tri: 'trai', tetra: 'tê-tra', penta: 'pen-ta', hexa: 'hếch-xa', hepta: 'hép-ta', octa: 'óc-ta',
  bis: 'bít', tris: 'trít', tetrakis: 'tê-tra-kít', ion: 'ai-ơn',
  // phối tử (kiểu mới và kiểu cũ)
  ammine: 'am-min', aqua: 'a-quơ', carbonyl: 'ca-bơ-nin', nitrosyl: 'nai-trâu-xin', ethylenediamine: 'ê-thơ-lin-đai-ơ-min',
  fluorido: 'flo-ri-đô', chlorido: 'clo-ri-đô', bromido: 'brô-mi-đô', iodido: 'ai-ô-đi-đô', hydroxido: 'hai-đrốc-xi-đô',
  cyanido: 'xai-a-ni-đô', 'thiocyanato-N': 'thai-ô-xai-ơ-na-tô en', 'nitrito-N': 'nai-tri-tô en', oxalato: 'óc-xơ-la-tô',
  thiosulfato: 'thai-ô-xun-pha-tô', sulfato: 'xun-pha-tô', carbonato: 'ca-bơ-na-tô',
  fluoro: 'flo-rô', chloro: 'clo-rô', bromo: 'brô-mô', iodo: 'ai-ô-đô', hydroxo: 'hai-đrốc-xô', cyano: 'xai-a-nô',
  isothiocyanato: 'ai-xô-thai-ô-xai-ơ-na-tô', nitro: 'nai-trô',
  // kim loại (cation / trung hòa)
  silver: 'xiu-vơ', gold: 'gâu-đ', copper: 'cóp-pơ', iron: 'ai-ơn', zinc: 'zinh-k', aluminium: 'a-lu-mi-ni-ầm', cobalt: 'cô-bôn',
  nickel: 'ních-cơn', chromium: 'crô-mi-ầm', manganese: 'man-gơ-ni-z', platinum: 'pla-ti-nầm', palladium: 'pơ-lây-đi-ầm',
  mercury: 'mơ-kiu-ri', cadmium: 'các-mi-ầm', tin: 'tin', lead: 'led', titanium: 'tai-tây-ni-ầm', vanadium: 'vơ-nây-đi-ầm',
  // kim loại (anion, đuôi -ate)
  argentate: 'a-giần-tết', aurate: 'o-rết', cuprate: 'kiu-prết', ferrate: 'phe-rết', zincate: 'zinh-kết', aluminate: 'ơ-lu-mi-nết',
  cobaltate: 'cô-bôn-tết', nickelate: 'ních-cơ-lết', chromate: 'crâu-mết', manganate: 'man-gơ-nết', platinate: 'pla-ti-nết',
  palladate: 'pa-lơ-đết', mercurate: 'mơ-kiu-rết', cadmate: 'các-mết', stannate: 'xtan-nết', plumbate: 'plăm-bết', titanate: 'tai-tơ-nết', vanadate: 'va-nơ-đết',
  // số oxi hóa
  zero: 'zia-rô', one: 'oăn', two: 'tu', three: 'thri', four: 'pho', five: 'phai', six: 'xích',
  // ion cầu ngoại
  potassium: 'pơ-ta-xi-ầm', sodium: 'xâu-đi-ầm', lithium: 'li-thi-ầm', ammonium: 'ơ-mâu-ni-ầm', hydrogen: 'hai-đrơ-giần',
  calcium: 'can-xi-ầm', barium: 'be-ri-ầm', magnesium: 'mác-ni-zi-ầm', chloride: 'clo-rai', bromide: 'brô-mai', iodide: 'ai-ô-đai',
  fluoride: 'flo-rai', hydroxide: 'hai-đrốc-xai', nitrate: 'nai-trết', perchlorate: 'pơ-clo-rết', sulfate: 'xun-phết', carbonate: 'ca-bơ-nết'
};

/* ---------- 5. THƯ VIỆN PHỨC CHẤT ----------
 * f      : công thức (gõ kiểu thường: [Cu(NH3)4]2+, K3[Fe(CN)6], [Cu(NH3)4]SO4 ...)
 * lv     : mức độ 1 = Nhận biết, 2 = Thông hiểu, 3 = Vận dụng
 * color  : màu thực tế (chữ) ; hex : mã màu để vẽ ô màu
 * geo    : (tùy chọn) ghi đè dạng hình học – 'linear' | 'tetrahedral' | 'square' | 'octahedral' | 'tbp'
 * aka    : (tùy chọn) tên thường gọi, ví dụ 'cisplatin' – dùng cho tra cứu ngược
 * name_vi, name_iupac : (tùy chọn) ghi đè tên tự sinh – chỉ dùng khi thật cần; trang
 *          tools/kiem-tra-du-lieu.html sẽ báo nếu tên ghi đè khác tên tự sinh.
 *
 * Các trường name_vi, name_iupac, name_iupac_old, phien_am, steps_vi, steps_iupac của
 * mỗi chất được web TỰ SINH từ công thức. Muốn xem/tải toàn bộ ra file complexes.json,
 * mở tools/kiem-tra-du-lieu.html và bấm "Tải complexes.json".
 * note   : ứng dụng / phản ứng liên quan
 *
 * THÊM PHỨC CHẤT MỚI: chép 1 dòng, sửa công thức và thông tin. Xong!
 */
var COMPLEXES = [
  // ===== BẠC =====
  { f: '[Ag(NH3)2]+', lv: 1, color: 'Không màu', hex: '#e8eef5',
    note: 'Ion trong thuốc thử Tollens. AgCl tan trong dung dịch NH₃: AgCl + 2NH₃ → [Ag(NH₃)₂]Cl.' },
  { f: '[Ag(NH3)2]Cl', lv: 2, color: 'Dung dịch không màu', hex: '#e8eef5',
    note: 'Tạo thành khi hòa tan kết tủa trắng AgCl trong dung dịch NH₃ dư – dùng để phân biệt AgCl với AgI.' },
  { f: '[Ag(NH3)2]OH', lv: 2, aka: 'thuốc thử Tollens', color: 'Dung dịch không màu', hex: '#e8eef5',
    note: 'Thuốc thử Tollens: phản ứng tráng bạc với anđehit, glucozơ (tạo lớp bạc sáng như gương).' },
  { f: '[Ag(NH3)2]NO3', lv: 2, color: 'Dung dịch không màu', hex: '#e8eef5',
    note: 'Điều chế bằng cách nhỏ NH₃ vào AgNO₃ đến khi kết tủa Ag₂O tan hết – dùng tráng gương, tráng ruột phích.' },
  { f: '[Ag(CN)2]-', lv: 1, color: 'Không màu', hex: '#e8eef5',
    note: 'Phức rất bền, dùng trong mạ bạc và trong phương pháp xianua tách bạc khỏi quặng.' },
  { f: 'K[Ag(CN)2]', lv: 2, color: 'Tinh thể trắng', hex: '#f1f5f9',
    note: 'Thành phần chính của dung dịch mạ bạc điện phân.' },
  { f: '[Ag(S2O3)2]3-', lv: 3, color: 'Không màu', hex: '#e8eef5',
    note: 'Trong kĩ thuật ảnh cổ điển: AgBr chưa bị chiếu sáng tan trong Na₂S₂O₃ (thuốc hãm ảnh).' },
  { f: 'Na3[Ag(S2O3)2]', lv: 3, color: 'Dung dịch không màu', hex: '#e8eef5',
    note: 'AgBr + 2Na₂S₂O₃ → Na₃[Ag(S₂O₃)₂] + NaBr (quá trình định hình ảnh).' },

  // ===== ĐỒNG =====
  { f: '[Cu(NH3)4]2+', lv: 1, color: 'Xanh lam đậm', hex: '#1d4ed8', geo: 'square',
    note: 'Cu(OH)₂ tan trong NH₃ dư tạo dung dịch xanh lam đậm – dùng nhận biết ion Cu²⁺.' },
  { f: '[Cu(NH3)4]SO4', lv: 2, color: 'Tinh thể xanh lam thẫm', hex: '#1e3a8a', geo: 'square',
    note: 'Kết tinh từ dung dịch CuSO₄ + NH₃ dư khi thêm etanol, dạng [Cu(NH₃)₄]SO₄·H₂O.' },
  { f: '[Cu(NH3)4](OH)2', lv: 3, aka: 'nước Svayde (Schweizer)', color: 'Dung dịch xanh lam đậm', hex: '#1d4ed8', geo: 'square',
    note: 'Nước Svayde (Schweizer) – hòa tan được xenlulozơ, dùng sản xuất tơ đồng – amoniac.' },
  { f: '[Cu(H2O)6]2+', lv: 1, color: 'Xanh lam nhạt', hex: '#60a5fa',
    note: 'Ion tạo màu xanh của dung dịch CuSO₄, Cu(NO₃)₂ loãng.' },
  { f: '[Cu(NH3)4(H2O)2]2+', lv: 3, color: 'Xanh lam đậm', hex: '#1d4ed8',
    note: 'Cách viết đầy đủ hơn của phức đồng – amoniac trong nước (2 phân tử nước ở hai đỉnh bát diện).' },
  { f: '[CuCl4]2-', lv: 2, color: 'Vàng (dung dịch lẫn ion aqua có màu xanh lục)', hex: '#a3b33a', geo: 'tetrahedral',
    note: 'Thêm HCl đặc vào dung dịch CuSO₄: màu chuyển từ xanh lam sang xanh lục rồi vàng.' },
  { f: 'K2[CuCl4]', lv: 3, color: 'Tinh thể vàng lục', hex: '#b5b842', geo: 'tetrahedral',
    note: 'Muối kép chứa anion phức [CuCl₄]²⁻.' },
  { f: '[Cu(OH)4]2-', lv: 3, color: 'Xanh lam', hex: '#2563eb', geo: 'square',
    note: 'Cu(OH)₂ tan một phần trong dung dịch kiềm rất đặc.' },
  { f: '[Cu(en)2]2+', lv: 3, color: 'Tím xanh', hex: '#5b4fcf', geo: 'square',
    note: 'Phức chelat (vòng càng) – bền hơn [Cu(NH₃)₄]²⁺ nhờ hiệu ứng tạo vòng.' },

  // ===== KẼM =====
  { f: '[Zn(NH3)4]2+', lv: 1, color: 'Không màu', hex: '#e8eef5',
    note: 'Zn(OH)₂ tan trong dung dịch NH₃ dư (khác Al(OH)₃ không tan) – dùng phân biệt Zn²⁺ và Al³⁺.' },
  { f: '[Zn(NH3)4]Cl2', lv: 2, color: 'Dung dịch không màu', hex: '#e8eef5',
    note: 'ZnCl₂ + 4NH₃ (dư) → [Zn(NH₃)₄]Cl₂.' },
  { f: '[Zn(OH)4]2-', lv: 1, color: 'Không màu', hex: '#e8eef5',
    note: 'Zn(OH)₂ lưỡng tính tan trong kiềm dư.' },
  { f: 'Na2[Zn(OH)4]', lv: 2, color: 'Dung dịch không màu', hex: '#e8eef5',
    note: 'Zn(OH)₂ + 2NaOH → Na₂[Zn(OH)₄].' },
  { f: '[Zn(H2O)6]2+', lv: 2, color: 'Không màu', hex: '#e8eef5',
    note: 'Ion Zn²⁺ trong nước tồn tại ở dạng phức aqua (Zn²⁺ có cấu hình d¹⁰ nên không màu).' },

  // ===== SẮT =====
  { f: '[Fe(H2O)6]2+', lv: 1, color: 'Lục nhạt', hex: '#86efac',
    note: 'Ion tạo màu lục nhạt của dung dịch muối sắt(II) như FeSO₄.' },
  { f: '[Fe(H2O)6]3+', lv: 1, color: 'Tím nhạt (dung dịch thường vàng nâu do thủy phân)', hex: '#d9b26a',
    note: 'Ion sắt(III) trong nước; bị thủy phân tạo màu vàng nâu ở dung dịch FeCl₃.' },
  { f: '[Fe(CN)6]4-', lv: 2, color: 'Vàng nhạt', hex: '#fde68a',
    note: 'Anion trong muối máu vàng K₄[Fe(CN)₆].' },
  { f: 'K4[Fe(CN)6]', lv: 2, aka: 'muối máu vàng, kali feroxianua', color: 'Tinh thể vàng', hex: '#facc15',
    note: 'Thuốc thử nhận biết Fe³⁺: tạo kết tủa xanh đậm (xanh Prussian, xanh Phổ).' },
  { f: '[Fe(CN)6]3-', lv: 2, color: 'Đỏ cam', hex: '#ea580c',
    note: 'Anion trong muối máu đỏ K₃[Fe(CN)₆].' },
  { f: 'K3[Fe(CN)6]', lv: 2, aka: 'muối máu đỏ, kali ferixianua', color: 'Tinh thể đỏ', hex: '#dc2626',
    note: 'Thuốc thử nhận biết Fe²⁺: tạo kết tủa xanh Turnbull.' },
  { f: '[Fe(H2O)5(SCN)]2+', lv: 3, color: 'Đỏ máu', hex: '#991b1b',
    note: 'Nhỏ KSCN vào dung dịch Fe³⁺ xuất hiện màu đỏ máu – phản ứng nhận biết Fe³⁺ rất nhạy.' },
  { f: '[FeF6]3-', lv: 3, color: 'Không màu', hex: '#e8eef5',
    note: 'Thêm F⁻ làm mất màu đỏ của phức thioxianato – dùng “che” ion Fe³⁺ trong phân tích.' },
  { f: 'K3[Fe(C2O4)3]', lv: 3, color: 'Lục ánh xanh', hex: '#22c55e',
    note: 'Phức nhạy sáng: dưới ánh sáng Fe(III) bị khử về Fe(II) – dùng trong in ảnh xanh (cyanotype).' },
  { f: '[Fe(CO)5]', lv: 3, color: 'Chất lỏng vàng nhạt', hex: '#fde047', geo: 'tbp',
    note: 'Phức cacbonyl của sắt(0), dạng lưỡng chóp tam giác; dùng điều chế sắt siêu tinh khiết.' },

  // ===== COBAN =====
  { f: '[Co(H2O)6]2+', lv: 1, color: 'Hồng', hex: '#f472b6',
    note: 'Màu hồng của dung dịch CoCl₂ loãng.' },
  { f: '[CoCl4]2-', lv: 2, color: 'Xanh lam', hex: '#2563eb', geo: 'tetrahedral',
    note: 'Cân bằng [Co(H₂O)₆]²⁺ (hồng) ⇌ [CoCl₄]²⁻ (xanh) – dùng làm giấy/hạt chỉ thị độ ẩm.' },
  { f: '[Co(NH3)6]3+', lv: 2, color: 'Vàng cam', hex: '#f59e0b',
    note: 'Phức coban(III) rất bền, hầu như không bị thay thế phối tử.' },
  { f: '[Co(NH3)6]Cl3', lv: 2, aka: 'muối luteo', color: 'Tinh thể vàng cam', hex: '#f59e0b',
    note: 'Phức chất kinh điển trong thuyết phối trí của Werner: 3 ion Cl⁻ ở cầu ngoại đều kết tủa với Ag⁺.' },
  { f: '[Co(NH3)5Cl]Cl2', lv: 3, color: 'Đỏ tía', hex: '#9d174d',
    note: 'Chỉ 2 ion Cl⁻ cầu ngoại kết tủa với AgNO₃; Cl⁻ trong cầu nội liên kết với Co nên không kết tủa.' },
  { f: '[Co(NH3)4Cl2]Cl', lv: 3, color: 'Lục (đồng phân trans) / tím (đồng phân cis)', hex: '#15803d',
    note: 'Ví dụ về đồng phân hình học cis – trans của phức bát diện.' },
  { f: '[Co(en)3]Cl3', lv: 3, color: 'Vàng cam', hex: '#f59e0b',
    note: 'Mỗi phân tử en là phối tử hai càng nên 3 en tạo số phối trí 6.' },
  { f: 'Na3[Co(NO2)6]', lv: 3, color: 'Dung dịch vàng cam', hex: '#f97316',
    note: 'Thuốc thử nhận biết ion K⁺: tạo kết tủa vàng K₂Na[Co(NO₂)₆].' },

  // ===== NIKEN =====
  { f: '[Ni(H2O)6]2+', lv: 1, color: 'Xanh lục', hex: '#16a34a',
    note: 'Màu xanh lục của dung dịch NiSO₄, NiCl₂.' },
  { f: '[Ni(NH3)6]2+', lv: 2, color: 'Xanh lam tím', hex: '#6366f1',
    note: 'Ni(OH)₂ tan trong NH₃ dư tạo dung dịch xanh lam tím.' },
  { f: '[Ni(CN)4]2-', lv: 2, color: 'Vàng', hex: '#eab308', geo: 'square',
    note: 'Phức vuông phẳng của Ni(II) với phối tử trường mạnh CN⁻.' },
  { f: '[Ni(CO)4]', lv: 2, color: 'Chất lỏng không màu, rất độc', hex: '#e8eef5', geo: 'tetrahedral',
    note: 'Quy trình Mond: Ni + 4CO → [Ni(CO)₄] (50 °C), phân hủy ở 200 °C thu niken rất tinh khiết.' },

  // ===== CROM =====
  { f: '[Cr(H2O)6]3+', lv: 1, color: 'Tím', hex: '#7c3aed',
    note: 'Màu tím của phèn crom – kali KCr(SO₄)₂·12H₂O.' },
  { f: '[Cr(NH3)6]3+', lv: 2, color: 'Vàng', hex: '#facc15',
    note: 'Phức bát diện bền của crom(III).' },
  { f: '[Cr(H2O)4Cl2]+', lv: 3, color: 'Lục thẫm', hex: '#166534',
    note: 'Thành phần tạo màu lục của tinh thể CrCl₃·6H₂O thương mại: [Cr(H₂O)₄Cl₂]Cl·2H₂O.' },
  { f: 'Na[Cr(OH)4]', lv: 2, color: 'Dung dịch xanh lục', hex: '#22c55e', geo: 'tetrahedral',
    note: 'Cr(OH)₃ lưỡng tính tan trong NaOH dư (cách viết đơn giản hóa của ion [Cr(OH)₆]³⁻).' },
  { f: '[Cr(CO)6]', lv: 3, color: 'Tinh thể trắng', hex: '#f1f5f9',
    note: 'Phức cacbonyl của crom(0), dạng bát diện.' },

  // ===== MANGAN =====
  { f: '[Mn(H2O)6]2+', lv: 2, color: 'Hồng nhạt', hex: '#fbcfe8',
    note: 'Màu hồng rất nhạt của dung dịch muối Mn²⁺ – sản phẩm khi KMnO₄ bị khử trong môi trường axit.' },

  // ===== NHÔM =====
  { f: '[Al(OH)4]-', lv: 1, color: 'Không màu', hex: '#e8eef5',
    note: 'Al(OH)₃ lưỡng tính tan trong dung dịch kiềm dư.' },
  { f: 'Na[Al(OH)4]', lv: 1, color: 'Dung dịch không màu', hex: '#e8eef5',
    note: 'Al(OH)₃ + NaOH → Na[Al(OH)₄]; sục CO₂ vào lại thu được kết tủa Al(OH)₃.' },
  { f: '[Al(H2O)6]3+', lv: 2, color: 'Không màu', hex: '#e8eef5',
    note: 'Ion Al³⁺ trong nước; thủy phân làm dung dịch có môi trường axit (phèn chua làm trong nước).' },
  { f: 'Na3[AlF6]', lv: 2, aka: 'criolit', color: 'Tinh thể trắng (criolit)', hex: '#f1f5f9',
    note: 'Criolit – hạ nhiệt độ nóng chảy của Al₂O₃ trong điện phân sản xuất nhôm.' },

  // ===== PLATIN =====
  { f: '[Pt(NH3)2Cl2]', lv: 1, aka: 'cisplatin', color: 'Vàng (cisplatin)', hex: '#fde047', geo: 'square',
    note: 'Đồng phân cis (cisplatin) là thuốc điều trị ung thư; đồng phân trans không có tác dụng này.' },
  { f: '[PtCl4]2-', lv: 2, color: 'Đỏ', hex: '#dc2626', geo: 'square',
    note: 'Anion vuông phẳng của platin(II).' },
  { f: 'K2[PtCl4]', lv: 2, color: 'Tinh thể đỏ', hex: '#b91c1c', geo: 'square',
    note: 'Chất đầu để tổng hợp cisplatin.' },
  { f: 'K2[PtCl6]', lv: 3, color: 'Tinh thể vàng', hex: '#eab308',
    note: 'Ít tan – từng dùng để định lượng ion K⁺.' },
  { f: '[Pt(NH3)4]2+', lv: 2, color: 'Không màu', hex: '#e8eef5', geo: 'square',
    note: 'Cation trong muối Magnus [Pt(NH₃)₄][PtCl₄].' },

  // ===== VÀNG =====
  { f: '[AuCl4]-', lv: 2, color: 'Vàng', hex: '#eab308', geo: 'square',
    note: 'Vàng tan trong nước cường toan tạo H[AuCl₄].' },
  { f: 'H[AuCl4]', lv: 3, color: 'Tinh thể vàng', hex: '#facc15', geo: 'square',
    note: 'Au + HNO₃ + 4HCl → H[AuCl₄] + NO + 2H₂O.' },
  { f: '[Au(CN)2]-', lv: 2, color: 'Không màu', hex: '#e8eef5',
    note: 'Phương pháp xianua: 4Au + 8NaCN + O₂ + 2H₂O → 4Na[Au(CN)₂] + 4NaOH; sau đó dùng Zn khử Au.' },
  { f: 'Na[Au(CN)2]', lv: 2, color: 'Dung dịch không màu', hex: '#e8eef5',
    note: 'Sản phẩm hòa tan vàng trong quặng bằng dung dịch NaCN có sục không khí.' },

  // ===== THỦY NGÂN, CAĐIMI =====
  { f: 'K2[HgI4]', lv: 3, aka: 'thuốc thử Nessler', color: 'Dung dịch vàng nhạt', hex: '#fef08a',
    note: 'Thành phần thuốc thử Nessler (cùng KOH) – nhận biết vết NH₃/NH₄⁺ (kết tủa nâu đỏ).' },
  { f: '[Cd(NH3)4]2+', lv: 3, color: 'Không màu', hex: '#e8eef5',
    note: 'Cd(OH)₂ tan trong NH₃ dư tương tự Zn(OH)₂.' }
];

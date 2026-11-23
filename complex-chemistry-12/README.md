# COMPLEX CHEMISTRY 12 – Luyện Đọc Tên Phức Chất

Website giúp học sinh lớp 12 (chương trình GDPT 2018) học gọi tên phức chất. Web dùng HTML, CSS và JavaScript thuần, không có bước build. Riêng trang **Đề kiểm tra AI** cần một Netlify Function để gọi Google Gemini.

- **2 chế độ đọc tên:** tiếng Việt theo SGK và tiếng Anh theo IUPAC. Giao diện, lý thuyết và lời giải luôn bằng tiếng Việt.
- **Nhiều trang riêng** dùng Hash Router (`/#/thu-vien`): chạy ổn trên Netlify và trong app Capacitor.

## Danh sách trang

| Đường dẫn | Trang |
|---|---|
| `#/chon-che-do` | Chọn chế độ VI / IUPAC. Chỉ tự hiện ở lần mở web đầu tiên |
| `#/` | Trang chủ |
| `#/goi-ten` | Gọi tên phức chất (`?f=K3[Fe(CN)6]` để mở sẵn một chất) |
| `#/luyen-tap` → `#/luyen-tap/lam-bai` → `#/luyen-tap/ket-qua` | Luyện tập: cấu hình → làm bài → kết quả |
| `#/bai-tap`, `#/bai-tap/28-1` … `29-3` | Bài tập theo cấu trúc đề tốt nghiệp THPT (Bài 28, Bài 29; mỗi bài 3 phần), có đáp án và lời giải |
| `#/de-kiem-tra` → `#/de-kiem-tra/lam-bai` | Đề kiểm tra AI: chọn đề → làm bài, nộp bài, xem lời giải, in đề |
| `#/huong-dan`, `#/huong-dan/:bai` | Hướng dẫn: danh sách bài và từng bài lý thuyết |
| `#/tra-cuu` | Tra cứu ngược (tên → công thức) |
| `#/phat-am` → `#/phat-am/:id` → `#/phat-am/:id/ket-qua` | Luyện phát âm: chọn chất → đọc → kết quả |
| `#/flashcard` | Flashcard |
| `#/thu-vien`, `#/thu-vien/:id` | Thư viện và trang chi tiết từng chất |
| `#/gioi-thieu` | Giới thiệu: lý do làm web, nguồn tham khảo, phiên bản |
| `#/lien-he` | Liên hệ & Báo lỗi (`?muc=de-ai` chọn sẵn mục "Đề kiểm tra AI") |
| `#/cai-dat` | Cài đặt: sáng/tối, chế độ tên, kiểu tên phối tử IUPAC, giọng đọc, tốc độ |

Đường dẫn sai sẽ mở trang 404.

## Cấu trúc thư mục

```
complex-chemistry-12/
├── index.html            Khung trang (menu, thanh đáy, form tĩnh cho Netlify, thẻ Open Graph)
├── css/style.css         Giao diện (sáng/tối, màu nhấn theo chế độ, responsive, in ấn)
├── js/data.js            ★ DỮ LIỆU: tác giả, phối tử, kim loại, phiên âm, thư viện phức chất
├── js/chem.js            Bộ máy hóa học: phân tích công thức, sinh tên VI + IUPAC, lời giải
├── js/app.js             Lõi dùng chung: lưu trữ, cài đặt, hiển thị kết quả, so sánh VI–IUPAC
├── js/speech.js          Đọc tên, nhận dạng giọng nói, chấm phát âm
├── js/quiz.js            Ngân hàng câu hỏi luyện tập và chấm bài
├── js/exam.js            Đề kiểm tra: gọi AI, kiểm tra từng câu của AI, sinh đề dự phòng, chấm điểm
├── js/baitap-28.js, baitap-29.js   Câu hỏi + lời giải của trang Bài tập (hình vẽ nằm ở img/bai-tap/)
├── js/lessons.js, lessons-iupac.js   Các bài lý thuyết
├── js/router.js          Điều hướng: đường dẫn, menu trượt, thanh đáy, chuyển trang
├── js/pages-*.js         Các trang (học / luyện / đề kiểm tra / khác)
├── netlify/functions/generate-exam.js   Netlify Function gọi Google Gemini
├── tools/kiem-tra-du-lieu.html   Tự kiểm tra dữ liệu + tải complexes.json
├── tools/kiem-tra-de.html        Tự kiểm tra phần đề AI (không gọi Gemini thật)
├── tools/tao-anh.ps1             Tạo lại og-image.png (favicon.png, apple-touch-icon.png lấy từ logo.svg)
├── tools/chay-thu.ps1, chay-thu.bat   Máy chủ chạy thử trên Windows
├── logo.svg (logo + biểu tượng tab), favicon.png, apple-touch-icon.png, og-image.png
├── _redirects, netlify.toml      Cấu hình Netlify
```

## 1. Chạy thử trên máy

**Windows (không cần cài gì):** bấm đúp `chay-thu.bat`. Trình duyệt sẽ tự mở http://localhost:8080. Muốn dừng thì đóng cửa sổ đen.

Lưu ý khi chạy trên máy:
- **Micro** chỉ chạy qua `http://localhost` hoặc `https`, và chỉ trên **Chrome / Edge**.
- **Form báo lỗi** chỉ kiểm tra dữ liệu chứ không gửi đi.
- **Tạo đề bằng AI** không chạy được (không có Netlify Function), web sẽ báo "Không kết nối được AI". Nút "Làm đề từ ngân hàng câu hỏi" vẫn dùng bình thường.

## 2. Deploy lên Netlify bằng Netlify CLI

Phải dùng CLI (hoặc Git). **Kéo thả thư mục không chạy được Netlify Function**, nên trang Đề kiểm tra AI sẽ không tạo được đề.

1. Cài Node.js bản LTS từ https://nodejs.org, rồi mở lại terminal.
2. Cài Netlify CLI: `npm install -g netlify-cli`
3. Đăng nhập: `netlify login`
4. Mở terminal trong thư mục `complex-chemistry-12`, nối với site: `netlify link --name m10betterthancr7`
5. Deploy bản nháp để thử: `netlify deploy` (lệnh in ra một link tạm).
6. Thử xong thì deploy chính thức: `netlify deploy --prod`

`netlify.toml` đã khai báo `publish = "."` và `functions = "netlify/functions"`, nên không cần thêm tham số.

### Biến môi trường (đặt trên Netlify, mục Site configuration → Environment variables)

| Tên | Giá trị |
|---|---|
| `GEMINI_API_KEY` | API key của Google Gemini. Đánh dấu là bí mật. **Không ghi key vào code, không commit lên GitHub.** |
| `GEMINI_MODEL` | Tên model, ví dụ `gemini-flash-latest` |

Hai biến phải áp dụng cho mọi deploy context (hoặc ít nhất Production và Deploy Previews). Đổi biến xong phải deploy lại.

### Form báo lỗi

Vào **Forms → Enable form detection**, rồi deploy lại một lần để Netlify nhận diện form `bao-loi`. Mỗi lượt gửi gồm: họ tên, email, loại sự cố, mục bị lỗi, mô tả, chế độ (VI / IUPAC) và ảnh đính kèm. Muốn nhận email khi có báo lỗi: **Site configuration → Notifications → Form submission notifications**. Gói miễn phí nhận 100 lượt gửi form mỗi tháng.

## 3. Trang Đề kiểm tra AI

**Cách hoạt động**

1. Web chọn ngẫu nhiên 8 phức chất (đề 15 phút) hoặc 14 phức chất (đề đầy đủ) trong thư viện, ưu tiên chất chưa dùng ở 2 đề gần nhất.
2. Web gửi danh sách đó, mức độ từng câu, một mã ngẫu nhiên và các câu đã ra gần đây tới `/.netlify/functions/generate-exam`.
3. Function gọi Gemini ở chế độ trả JSON theo khuôn cố định, tối đa 25 giây.
4. Web kiểm tra từng câu: đúng khuôn dạng chưa, và với câu về tên gọi, công thức, số oxi hóa, số phối trí, số phối tử, điện tích, hình học thì đáp án có khớp dữ liệu của web không. Câu không đạt được thay bằng câu tự sinh cùng mức độ. Đầu đề ghi rõ có bao nhiêu câu bị thay.

**Cấu trúc và cách chấm**

| | Phần I (nhiều lựa chọn) | Phần II (đúng/sai) | Phần III (trả lời ngắn) | Thời gian |
|---|---|---|---|---|
| Kiểm tra 15 phút | 6 câu | 2 câu | 2 câu | 15 phút |
| Đề đầy đủ | 12 câu | 4 câu | 6 câu | 45 phút |

Điểm thô tính như đề thi thật: Phần I và Phần III 0,25 điểm mỗi câu; Phần II mỗi câu đúng 1 ý được 0,1 – 2 ý 0,25 – 3 ý 0,5 – 4 ý 1 điểm. Sau đó quy về thang 10. Muốn đổi số câu thì sửa `LENGTHS` trong `js/exam.js`.

**Giới hạn lượt**

- Mỗi trình duyệt tạo tối đa 10 đề AI mỗi giờ (đếm trong localStorage). Function cũng đếm theo địa chỉ IP, nhưng chỉ là lớp chặn phụ vì bộ đếm nằm trong bộ nhớ và mất khi function ngủ.
- Khi Gemini báo hết hạn mức theo ngày, web ghi nhớ đến hết ngày và không gọi API nữa.

**Mã lỗi function trả về**

| Mã | Khi nào | Web hiển thị |
|---|---|---|
| `QUOTA_EXCEEDED` | Gemini trả 429, `quotaId` có chữ `PerDay` | Hết lượt hôm nay |
| `RATE_LIMIT` | Gemini trả 429 loại khác | Đợi 1 phút + nút Thử lại |
| `API_KEY_INVALID` | Key sai, 401, 403, thiếu `GEMINI_API_KEY`, sai tên model | Đang bảo trì + nút báo tác giả |
| `AI_UNAVAILABLE` | Lỗi mạng, quá 25 giây, lỗi 5xx, AI trả sai định dạng | Không kết nối được AI + nút Thử lại |
| `USER_LIMIT` | Quá 10 lần mỗi giờ | Thử lại sau X phút |

Mọi thông báo lỗi đều có nút **Làm đề từ ngân hàng câu hỏi** (đề cùng định dạng, không dùng AI).

**Thử sau khi deploy**

- Mở `#/de-kiem-tra`, bấm **Tạo đề mới**. Sau 10–25 giây phải hiện đề có dòng "Đề do AI (Google Gemini) soạn".
- Kiểm tra function còn sống (phải trả về `{"error":"BAD_REQUEST"}`):
  `curl -X POST https://m10betterthancr7.netlify.app/.netlify/functions/generate-exam -d "{}"`
- Xem log của function: trên Netlify vào **Logs → Functions → generate-exam**. Log chỉ ghi mã lỗi, không ghi key và không ghi nội dung đề.
- Trên máy, mở `http://localhost:8080/tools/kiem-tra-de.html` để thử phần kiểm tra đáp án, chấm điểm và phân loại lỗi mà không tốn lượt Gemini.

## 4. Đổi thông tin tác giả và trang Giới thiệu

Mở `js/data.js` và sửa khối `SITE_CONFIG` ở đầu file. Ô nào để trống (`''`) thì web tự ẩn dòng đó.

| Ô | Ý nghĩa |
|---|---|
| `className` | Lớp, ví dụ `'12A1'`. Hiện đang để trống |
| `why` | Lý do làm web, mỗi phần tử là một đoạn. Hãy viết bằng lời của bạn |
| `textbook` | Bộ SGK và bài đã dùng, ví dụ `'Bộ Kết nối tri thức với cuộc sống – Chương 8, Bài 28 và Bài 29'` |
| `version`, `updated` | Phiên bản và ngày cập nhật gần nhất, hiện ở trang Giới thiệu và cuối trang chủ |

Ảnh chia sẻ lên Zalo/Facebook là `og-image.png`. Muốn đổi chữ trong ảnh thì sửa `tools/tao-anh.ps1` rồi chạy lại. Nếu đổi tên miền, sửa hai thẻ `og:url` và `og:image` trong `index.html`.

## 5. Thêm phức chất mới

Mở `js/data.js`, kéo xuống mảng `COMPLEXES` ở cuối file, rồi chép một dòng và sửa:

```js
{ f: '[Cu(NH3)2]+', lv: 2, color: 'Không màu', hex: '#e8eef5',
  note: 'Phức của đồng(I) với amoniac.' },
```

| Trường | Ý nghĩa |
|---|---|
| `f` | Công thức, gõ số bình thường: `[Cu(NH3)4]2+`, `K3[Fe(CN)6]`, `[Cu(NH3)4]SO4` |
| `lv` | Mức độ: 1 = Nhận biết, 2 = Thông hiểu, 3 = Vận dụng |
| `color`, `hex` | Màu thực tế (chữ) và mã màu để tô ô màu |
| `geo` | *(tùy chọn)* ghi đè hình học: `linear`, `tetrahedral`, `square`, `octahedral`, `tbp` |
| `aka` | *(tùy chọn)* tên thường gọi, ví dụ `'cisplatin'`, dùng cho tra cứu ngược |
| `note` | Ứng dụng hoặc phản ứng liên quan |
| `name_vi`, `name_iupac` | *(tùy chọn, hiếm khi cần)* ghi đè tên tự sinh |

**Không cần gõ tên gọi.** Từ công thức, web tự sinh tên tiếng Việt, tên IUPAC (kiểu mới và kiểu cũ), phiên âm, lời giải từng bước, 6 câu hỏi luyện tập và flashcard. Mọi con số trên web (số phức chất, số câu hỏi, số bài) đều đếm từ dữ liệu.

Sau khi thêm, mở `http://localhost:8080/tools/kiem-tra-du-lieu.html`:
- **Bảng 1** kiểm tra 21 tên mẫu. Dòng đỏ nghĩa là quy tắc gọi tên đã bị sửa sai.
- **Bảng 2** liệt kê toàn bộ thư viện. Dòng đỏ là công thức sai hoặc bị trùng. Dòng vàng là cảnh báo.
- Nút **Tải complexes.json** xuất toàn bộ dữ liệu ra một file JSON.

Muốn thêm **phối tử** hay **kim loại** mới thì thêm vào `LIGANDS` / `METALS`. Phiên âm cho từ tiếng Anh mới thì thêm vào `PHONETIC` trong cùng file.

## 6. Hai chế độ đọc tên

| | Tiếng Việt (SGK) | IUPAC |
|---|---|---|
| Phối tử | ammin, aqua, cloro, xiano, hiđroxo | ammine, aqua, chlorido, cyanido, hydroxido *(kiểu cũ: chloro, cyano…)* |
| Tiền tố | **đi**, tri, tetra… / bis, tris | di, tri, tetra… / bis, tris |
| Kim loại (cation) | đồng, sắt, coban… | copper, iron, cobalt… |
| Kim loại (anion) | gốc Latin + at: cuprat, ferat, **cobaltat** | -ate: cuprate, ferrate, cobaltate |
| Cách viết | dấu cách trước tên kim loại; "ion" đứng trước | viết liền; "ion" đứng sau |
| Giọng đọc | vi-VN | en-US (hoặc en-GB), có nút đọc chậm 0,7 và phiên âm kiểu Việt |

- Phối tử luôn xếp theo chữ cái **của tên trong chế độ đang dùng**, bỏ qua tiền tố.
- Điểm, lịch sử luyện tập, flashcard và điểm phát âm được **lưu riêng cho từng chế độ**.
- SCN⁻ trong [Fe(H₂O)₅(SCN)]²⁺ liên kết với Fe qua nguyên tử N, nên tên IUPAC là `thiocyanato-N`. Kiểu cũ là `isothiocyanato`.

## 7. Huy hiệu "Powered by Netlify"

Gói miễn phí của Netlify tự chèn một huy hiệu ở góc dưới bên phải. Web tự đo chiều cao của nó (`watchBadge` trong `js/router.js`) rồi đẩy thanh điều hướng dưới, hai nút nổi và chân trang lên trên, nên không phần nào bị che. Khi chạy trên máy không có huy hiệu thì không có khoảng trống thừa.

## 8. Đăng nhập và Diễn đàn (Supabase)

Đăng nhập là **tùy chọn**: chỉ cần khi muốn đặt câu hỏi hoặc trả lời ở Diễn đàn (`#/dien-dan`). Ai cũng đọc được diễn đàn mà không cần tài khoản. Tài khoản và bài viết lưu ở [Supabase](https://supabase.com) (gói miễn phí), nên vẫn deploy bằng cách kéo thả như cũ.

| Đường dẫn | Trang |
|---|---|
| `#/dang-nhap` | Đăng nhập / Tạo tài khoản / Quên mật khẩu |
| `#/tai-khoan` | Đổi tên hiển thị, đổi mật khẩu, đăng xuất |
| `#/dat-lai-mat-khau` | Đặt mật khẩu mới (mở từ email "quên mật khẩu") |
| `#/dien-dan`, `#/dien-dan/moi`, `#/dien-dan/:id` | Danh sách chủ đề, đặt câu hỏi, xem và trả lời một chủ đề |
| `#/dien-dan/duyet` | Duyệt bài (chỉ quản trị viên): duyệt hoặc từ chối câu hỏi, câu trả lời mới |

### Cài đặt (làm một lần, khoảng 5–10 phút)

1. Vào https://supabase.com → **Start your project** → đăng nhập (có thể dùng tài khoản GitHub) → **New project**. Đặt tên, chọn vùng **Southeast Asia (Singapore)**, đặt mật khẩu database (lưu lại), bấm **Create**.
2. Mở **SQL Editor** → **New query** → dán toàn bộ nội dung file `supabase/cai-dat.sql` → bấm **Run**. Phải thấy "Success". Sau đó làm y hệt với file `supabase/kiem-duyet.sql` (bật kiểm duyệt bài).
3. Vào **Authentication → URL Configuration**:
   - **Site URL**: `https://m10betterthancr7.netlify.app`
   - **Redirect URLs**: thêm `https://m10betterthancr7.netlify.app/**` và `http://localhost:8080/**`
4. Vào **Project Settings → API** (hoặc **Data API**), chép **Project URL** và khóa **publishable** (hoặc **anon public**) vào `js/data.js`:
   ```js
   supabaseUrl: 'https://xxxxxxxx.supabase.co',
   supabaseKey: 'sb_publishable_...'
   ```
   Hai giá trị này được phép công khai. **Không bao giờ** dán khóa `secret` / `service_role`.
5. Deploy lại web, mở `#/dang-nhap`, tạo tài khoản cho chính bạn.
6. Tự phong quản trị viên để xóa được bài của người khác: trong SQL Editor chạy
   ```sql
   update public.profiles set is_admin = true where id = (select id from auth.users where email = 'email-cua-ban@gmail.com');
   ```

### Cần biết

- Mặc định Supabase bắt **xác nhận email** khi đăng ký. Email gửi từ máy chủ miễn phí của Supabase bị giới hạn vài email mỗi giờ và hay vào mục Spam. Nếu muốn đăng ký là dùng được ngay: **Authentication → Sign In / Providers → Email** → tắt **Confirm email** (đổi lại thì dễ bị tạo tài khoản rác hơn).
- Liên kết "quên mật khẩu" phải mở **bằng chính trình duyệt** đã bấm gửi email.
- **Kiểm duyệt:** câu hỏi và câu trả lời mới ở trạng thái "Chờ duyệt", chỉ tác giả và quản trị viên nhìn thấy. Quản trị viên vào **Diễn đàn → Duyệt bài** (hoặc bấm "Duyệt" ngay dưới bài) để cho hiện; "Từ chối" là xóa bài. Bài của quản trị viên được duyệt luôn. Số trả lời chỉ đếm câu đã duyệt.
- Quyền được khóa trong database (Row Level Security), không phụ thuộc vào code web: ai cũng đọc được; chỉ người đã đăng nhập mới đăng bài và chỉ dưới tên mình; chỉ tác giả hoặc quản trị viên mới xóa được; bài đã đăng không sửa được; mỗi người phải chờ 20 giây giữa hai lần đăng.
- Chưa có: sửa bài, báo cáo bài xấu, tìm kiếm, đính kèm ảnh, thông báo khi có người trả lời.
- Dự án Supabase miễn phí **tự tạm dừng nếu 7 ngày không có ai dùng**. Khi đó vào supabase.com bấm **Restore project**.

## 9. Trang Bài tập

Trang `#/bai-tap` chứa hệ thống bài tập của Bài 28 và Bài 29, chia 3 phần như đề thi tốt nghiệp THPT: nhiều lựa chọn, đúng/sai, trả lời ngắn. Làm câu nào web chấm ngay câu đó và hiện lời giải; có nút "Xem đáp án và lời giải" cho câu chưa làm.

- Câu hỏi nằm trong `js/baitap-28.js` và `js/baitap-29.js`. Cách ghi một câu được giải thích ở đầu file `baitap-28.js`; muốn thêm câu thì chép một câu cùng phần rồi sửa.
- Hình vẽ của câu hỏi đặt trong `img/bai-tap/`, ghi tên file vào trường `img`.
- Công thức gõ bằng kí tự chỉ số Unicode (₂, ³⁺) hoặc thẻ `<sub>`, `<sup>`.
- Đáp số phần trả lời ngắn: số nguyên phải khớp chính xác; số thập phân cho phép lệch rất nhỏ; dấu phẩy và dấu chấm thập phân đều được nhận.
- Giáo viên hướng dẫn hiện ở trang Liên hệ và trang Giới thiệu, sửa ở ô `teacher` trong `js/data.js`.

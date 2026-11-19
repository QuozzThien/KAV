# Khanware Practice Assistant (v0.3.0)

Tiện ích Chrome/Chromium (Manifest V3) cho trang luyện tập Khan Academy: đọc câu hỏi đang hiển thị, chuẩn hóa thành JSON, hỏi AI qua OpenRouter và **chỉ hiển thị gợi ý** trong một bảng riêng.

## Không làm (nguyên tắc cố định)
- Không tự chọn phương án, không điền ô trả lời, không nộp bài.
- Không can thiệp API chấm điểm / tiến độ; không đọc đáp án ẩn, giá trị đã nhập hay trạng thái đã chọn.
- Thao tác duy nhất lên trang: thêm/bỏ class viền `kpa-mark` quanh phương án được gợi ý.
- Không dùng thư viện ngoài, không tải script từ CDN, không `eval`, không `innerHTML` với nội dung không tin cậy.

## Cách 1: Bookmarklet (GitHub Pages)
1. Copy thư mục này vào repo, chạy `npm install && npm run build` (tạo `docs/kpa.js`), commit cả thư mục `docs/`.
2. Repo → **Settings → Pages** → Deploy from branch → `main` + thư mục `/docs` (nếu repo đã dùng `/docs` cho việc khác, đổi tên thư mục trong `scripts/build.js`).
3. Mở `https://<user>.github.io/<repo>/`, kéo nút **KPA** lên thanh dấu trang (trang này tự dựng link đúng theo địa chỉ của nó).
4. Vào bài tập Khan Academy → bấm dấu trang → nút **AI** → **Cài đặt API key / model**.
- Bấm dấu trang lần hai chỉ mở lại bảng. Chỉ chạy trên `khanacademy.org`.
- Dự phòng không cần Pages: `docs/kpa.inline.txt` là bookmarklet nhúng sẵn toàn bộ mã (dán vào ô URL của dấu trang).
- **Khác bản extension**: key lưu trong localStorage của khanacademy.org (script của trang đọc được) → dùng key hạn mức thấp. Nếu Khan chặn tải script ngoài hoặc kết nối tới `openrouter.ai` (CSP) thì bookmarklet không chạy được; **chưa kiểm tra điều này trên Khan thật**.

## Cách 2: Extension
1. `chrome://extensions` → bật **Developer mode** → **Load unpacked** → chọn thư mục chứa `manifest.json`.
2. Mở **Details → Extension options**, nhập OpenRouter API key + model → **Kiểm tra kết nối**.
3. Mở bài tập Khan Academy, tải lại trang, bấm nút **AI** → **Phân tích câu hỏi hiện tại**.

## Kiến trúc
```
manifest.json  options.html
src/shared/helpers.js          tiện ích, kiểm tra hiển thị
src/reader/contentExtractor.js văn bản hiển thị (KaTeX→TeX, alt ảnh, bỏ ẩn)
src/reader/questionReader.js   tìm vùng câu hỏi, chuẩn hóa JSON, waitAndRead, fingerprint
src/widgets/registry.js        mỗi widget: detect / extract / format / validate / describe
src/ai/promptBuilder.js        dựng prompt + giới hạn kích thước
src/ai/responseParser.js       tách JSON, kiểm tra kết quả theo dữ liệu đã đọc
src/renderer/suggestionPanel.js hiển thị (textContent) + viền gợi ý
src/background.js              OpenRouter: timeout, retry, hủy, xử lý 400/401/403/429/5xx
src/content.js  content.css    giao diện: thu nhỏ, sáng/tối, sao chép, phân tích lại, theo dõi đổi câu
src/options.js                 cài đặt key/model
tests/                         40 test (node:test + jsdom)
```
Luồng: đọc DOM → JSON → (không đủ dữ liệu / không hỗ trợ ⇒ **dừng, không gọi AI**) → prompt → OpenRouter → kiểm tra chỉ số trả về khớp dữ liệu → hiển thị.

## Mức hỗ trợ widget (trung thực)
"Test" = test tự động trên **HTML tự viết** (jsdom). **Chưa widget nào được thử trên DOM thật của Khan Academy.**

| Widget | Trạng thái |
|---|---|
| radio, dropdown (`<select>` hoặc danh sách đã mở), numeric-input, input-number, expression, table | Đọc từ DOM + validate + test tự động |
| matrix | Chỉ khi DOM dùng `<tr>/<td>`; nếu không → `insufficient_data` |
| categorizer, matcher, orderer, sorter | **Thử nghiệm**: heuristic DOM (nhãn "thử nghiệm" trên giao diện), cần kiểm tra thật |
| grapher, interactive-graph, plotter, number-line, label-image | **unsupported** (trạng thái ở SVG/canvas, DOM không đủ): không gọi AI, không đoán |

Phương án chỉ có ảnh không mô tả ⇒ `insufficient_data`.

## Bảo mật
- API key trong `chrome.storage.local`, service worker đặt `TRUSTED_CONTEXTS` ⇒ content script/trang web không đọc được (cần Chrome ≥ 102). Chỉ theme/thu nhỏ nằm ở `storage.sync`.
- Background chỉ nhận tin từ đúng extension + tab `*.khanacademy.org`; `KPA_TEST` chỉ từ trang cài đặt.
- Quyền: `storage`, host `openrouter.ai` và `*.khanacademy.org`.
- Phản hồi AI chỉ hiển thị bằng `textContent`; AI chỉ được trả **chỉ số**, mọi chỉ số bị kiểm tra phạm vi.

## Phát triển
```
npm install      # chỉ để chạy test (jsdom)
npm run check    # kiểm tra cú pháp
npm run build    # gộp thành docs/kpa.js (bookmarklet)
npm test         # build + 40 test
```

## Giới hạn đã biết / việc còn lại
Xem mục "Việc còn lại" trong ghi chú bàn giao. Tên class `perseus-widget-*` là giả định dựa trên Perseus, cần xác nhận trên DOM thật.

## Giấy phép
Mã viết độc lập, không chứa mã nguồn Khanware gốc. Xem LICENSE; nếu sao chép mã từ Khanware (GPL-3.0-or-later) hãy tuân thủ giấy phép đó.

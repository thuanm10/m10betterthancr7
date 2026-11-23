/* =====================================================================
 * Netlify Function: nhờ Google Gemini soạn đề kiểm tra về phức chất.
 * Web gọi:  POST /.netlify/functions/generate-exam
 *
 * BẢO MẬT
 *  - API key CHỈ được đọc từ biến môi trường GEMINI_API_KEY (đặt trên Netlify).
 *    Key không nằm trong code, không gửi về trình duyệt, không ghi ra log.
 *  - Tên model lấy từ GEMINI_MODEL (mặc định "gemini-flash-latest").
 *  - Chỉ dùng fetch có sẵn của Node 18+, không cần cài thư viện nào.
 *
 * KẾT QUẢ TRẢ VỀ (luôn là JSON)
 *  - Thành công: { ok: true, exam: { title, part1, part2, part3 } }
 *  - Lỗi:        { error: "MÃ_LỖI" } với MÃ_LỖI là một trong:
 *      QUOTA_EXCEEDED   hết hạn mức miễn phí theo NGÀY
 *      RATE_LIMIT       gọi quá nhanh (hạn mức theo PHÚT)
 *      API_KEY_INVALID  key sai / bị xóa / thiếu biến môi trường / sai tên model
 *      AI_UNAVAILABLE   lỗi mạng, quá 25 giây, lỗi 5xx, AI trả về sai định dạng
 *      USER_LIMIT       một người gọi quá 10 lần / giờ (kèm waitMin)
 *      BAD_REQUEST      dữ liệu web gửi lên không hợp lệ
 * ===================================================================== */
'use strict';

const MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';
// Model dự phòng khi model chính quá tải (503) hoặc hết lượt (429); mỗi model có hạn mức miễn phí riêng.
const BACKUP_MODELS = ['gemini-flash-lite-latest', 'gemini-2.5-flash'];
const TIMEOUT_MS = 25000;
const USER_MAX = 10, HOUR = 3600 * 1000;
const LEVEL_NAME = { NB: 'Nhận biết', TH: 'Thông hiểu', VD: 'Vận dụng' };
const KINDS = ['name', 'formula', 'oxidation', 'coordination', 'ligand_count', 'charge', 'geometry', 'other'];

function reply(statusCode, body) {
  return { statusCode: statusCode, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }, body: JSON.stringify(body) };
}

/* ---------- giới hạn 10 lần/giờ cho mỗi địa chỉ IP ----------
 * shortcut: đếm trong bộ nhớ của function nên chỉ là lớp chặn phụ (bộ nhớ mất khi
 * function ngủ, và mỗi bản chạy song song đếm riêng). Lớp chặn chính nằm ở web
 * (localStorage). Muốn chặn chắc chắn thì phải lưu bộ đếm vào Netlify Blobs. */
const hits = new Map();
function minutesToWait(ip) {
  const now = Date.now(), list = (hits.get(ip) || []).filter(function (t) { return now - t < HOUR; });
  if (list.length >= USER_MAX) { hits.set(ip, list); return Math.max(1, Math.ceil((HOUR - (now - list[0])) / 60000)); }
  list.push(now); hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return 0;
}

/* ---------- làm sạch dữ liệu web gửi lên ---------- */
function text(v, max) { return String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f]/g, ' ').slice(0, max).trim(); }
function levels(v, max) {
  if (!Array.isArray(v) || v.length > max) return null;
  return v.every(function (x) { return LEVEL_NAME[x]; }) ? v : null;
}
function readRequest(raw) {
  let b; try { b = JSON.parse(raw || '{}'); } catch (e) { return null; }
  if (!b || typeof b !== 'object' || !b.plan) return null;
  const plan = { p1: levels(b.plan.p1, 18), p2: levels(b.plan.p2, 6), p3: levels(b.plan.p3, 8) };
  if (!plan.p1 || !plan.p2 || !plan.p3 || plan.p1.length + plan.p2.length + plan.p3.length === 0) return null;
  if (!Array.isArray(b.complexes) || b.complexes.length < 3 || b.complexes.length > 20) return null;
  return {
    mode: b.mode === 'iupac' ? 'iupac' : 'vi',
    levelName: text(b.levelName, 30) || 'Đề tổng hợp',
    minutes: Math.min(90, Math.max(5, parseInt(b.minutes, 10) || 15)),
    seed: text(b.seed, 20) || String(Date.now()),
    plan: plan,
    complexes: b.complexes.map(function (c) {
      c = c || {};
      return { f: text(c.f, 50), name: text(c.name, 140), metal: text(c.metal, 4), os: text(c.os, 4), cn: text(c.cn, 3), lig: text(c.lig, 80),
        charge: text(c.charge, 4), kind: text(c.kind, 20), geo: text(c.geo, 30), outer: text(c.outer, 40), color: text(c.color, 80), note: text(c.note, 220) };
    }),
    avoid: (Array.isArray(b.avoid) ? b.avoid : []).slice(0, 30).map(function (s) { return text(s, 120); }).filter(Boolean)
  };
}

/* ---------- lời nhắc gửi cho AI ---------- */
function buildPrompt(r) {
  const data = r.complexes.map(function (c, i) {
    return (i + 1) + '. ' + c.f + ' | tên: ' + c.name + ' | nguyên tử trung tâm: ' + c.metal + ' | số oxi hóa: ' + c.os + ' | số phối trí: ' + c.cn +
      ' | phối tử: ' + c.lig + ' | điện tích ion phức: ' + c.charge + ' | loại: ' + c.kind + ' | hình học: ' + c.geo +
      (c.outer ? ' | cầu ngoại: ' + c.outer : '') + (c.color ? ' | màu: ' + c.color : '') + (c.note ? ' | ghi chú: ' + c.note : '');
  }).join('\n');
  const lv = function (list) { return list.map(function (x, i) { return 'câu ' + (i + 1) + ': ' + LEVEL_NAME[x] + ' (' + x + ')'; }).join('; ') || '(không có câu nào)'; };
  const nameRule = r.mode === 'iupac'
    ? 'Tên phức chất viết bằng tiếng Anh theo IUPAC, ĐÚNG như cột "tên" trong dữ liệu (viết liền, ví dụ tetraamminecopper(II) ion). Phần còn lại của đề viết bằng tiếng Việt.'
    : 'Tên phức chất viết bằng tiếng Việt, ĐÚNG như cột "tên" trong dữ liệu (ví dụ: ion tetraammin đồng(II); dùng "đi", "ammin", "cloro", "xiano"...).';
  return [
    'Bạn là giáo viên Hóa học THPT ở Việt Nam. Hãy soạn một đề kiểm tra ' + r.minutes + ' phút về chủ đề "Phức chất" (Hóa học 12, Chương trình GDPT 2018), theo định dạng đề thi tốt nghiệp THPT từ năm 2025.',
    '',
    'DỮ LIỆU – chỉ ra đề dựa trên các phức chất dưới đây. Mọi số liệu trong dữ liệu là đáp án chuẩn, không tự suy ra giá trị khác:',
    data,
    '',
    'CẤU TRÚC ĐỀ (' + r.levelName + ')',
    '- part1: ' + r.plan.p1.length + ' câu trắc nghiệm nhiều lựa chọn, mỗi câu đúng 4 phương án, chỉ 1 phương án đúng. Mức độ: ' + lv(r.plan.p1) + '.',
    '- part2: ' + r.plan.p2.length + ' câu đúng/sai. Mỗi câu có một đoạn dẫn (context) về MỘT phức chất và đúng 4 ý; nên có cả ý đúng lẫn ý sai. Mức độ: ' + lv(r.plan.p2) + '.',
    '- part3: ' + r.plan.p3.length + ' câu trả lời ngắn, đáp án là MỘT SỐ viết được trong tối đa 4 kí tự (kể cả dấu âm và dấu phẩy). Mức độ: ' + lv(r.plan.p3) + '.',
    '',
    'QUY ĐỊNH',
    '- ' + nameRule,
    '- Phương án nhiễu về tên gọi phải sai thật sự (sai số oxi hóa, sai tiền tố, sai tên kim loại, sai thứ tự phối tử...), không được là một cách viết khác của tên đúng.',
    '- Công thức hóa học viết bằng kí tự chỉ số Unicode giống trong dữ liệu (ví dụ [Cu(NH₃)₄]²⁺). Không dùng LaTeX, HTML hay Markdown. Không ghi "A.", "B.", "a)" ở đầu phương án.',
    '- Trường level: ghi đúng mã mức độ được giao cho câu đó (NB, TH hoặc VD).',
    '  + NB (Nhận biết): nhận ra nguyên tử trung tâm, phối tử, số phối trí, cầu nội – cầu ngoại, tên của phức đơn giản.',
    '  + TH (Thông hiểu): tính số oxi hóa, điện tích ion phức, xác định loại phức, dạng hình học, gọi tên phức có cầu ngoại hoặc nhiều loại phối tử.',
    '  + VD (Vận dụng): bài nhiều bước hoặc có tính toán (số mol ion khi phân li, khối lượng kết tủa, so sánh nhiều phức...). Dữ kiện phải đủ, đáp số duy nhất. Nguyên tử khối: H=1; C=12; N=14; O=16; Na=23; Al=27; S=32; Cl=35,5; K=39; Fe=56; Cu=64; Zn=65; Ag=108.',
    '- Trường ref: số thứ tự (trong dữ liệu) của phức chất mà câu hỏi nói tới.',
    '- Trường kind: dạng của câu hoặc của ý: name (cho công thức, hỏi tên), formula (cho tên, hỏi công thức), oxidation (số oxi hóa của nguyên tử trung tâm), coordination (số phối trí), ligand_count (tổng số phối tử trong cầu nội), charge (điện tích của ion phức), geometry (dạng hình học), other (mọi dạng khác: tính toán, màu sắc, ứng dụng, phân loại...). Ưu tiên các dạng không phải other; other chiếm không quá khoảng 1/3 số câu.',
    '- Với từng ý đúng/sai: trường claim là giá trị mà ý đó khẳng định (ví dụ "+3", "6", "2-", "bát diện", hoặc tên / công thức được nêu). Nếu kind là other thì claim là chuỗi rỗng.',
    '- answer của part1 là vị trí phương án đúng: 0 = A, 1 = B, 2 = C, 3 = D. Rải đáp án đúng đều ở cả bốn vị trí.',
    '- answer của part3 là số (dùng dấu chấm thập phân trong JSON).',
    '- Chỉ trả về MỘT đối tượng JSON đúng dạng sau, không thêm chữ nào khác:',
    '  {"title": "...", "part1": [{"level": "NB", "kind": "name", "ref": 1, "question": "...", "options": ["...", "...", "...", "..."], "answer": 0, "explanation": "..."}],',
    '   "part2": [{"level": "TH", "ref": 2, "context": "...", "statements": [{"text": "...", "kind": "oxidation", "claim": "+3", "answer": true, "explanation": "..."} /* đúng 4 ý */]}],',
    '   "part3": [{"level": "VD", "kind": "other", "ref": 3, "question": "...", "answer": 1.5, "explanation": "..."}]}',
    '- explanation: lời giải ngắn gọn, 1–2 câu.',
    r.avoid.length ? '- Không ra lại các câu đã có trong những đề gần đây:\n' + r.avoid.map(function (s) { return '  • ' + s; }).join('\n') : '',
    '- Mã đề ' + r.seed + ': đây là số ngẫu nhiên, hãy dùng nó để chọn cách hỏi và phức chất cho từng câu sao cho đề này khác các đề khác.'
  ].filter(function (s) { return s !== ''; }).join('\n');
}

/* ---------- khuôn JSON bắt buộc (responseSchema của Gemini) ---------- */
const STR = { type: 'STRING' }, INT = { type: 'INTEGER' };
const LEVEL = { type: 'STRING', enum: ['NB', 'TH', 'VD'] }, KIND = { type: 'STRING', enum: KINDS };
function obj(properties) { return { type: 'OBJECT', properties: properties, required: Object.keys(properties) }; }
function arr(items, n) { const a = { type: 'ARRAY', items: items }; if (n) { a.minItems = n; a.maxItems = n; } return a; }
const SCHEMA = obj({
  title: STR,
  part1: arr(obj({ level: LEVEL, kind: KIND, ref: INT, question: STR, options: arr(STR, 4), answer: INT, explanation: STR })),
  part2: arr(obj({ level: LEVEL, ref: INT, context: STR, statements: arr(obj({ text: STR, kind: KIND, claim: STR, answer: { type: 'BOOLEAN' }, explanation: STR }), 4) })),
  part3: arr(obj({ level: LEVEL, kind: KIND, ref: INT, question: STR, answer: { type: 'NUMBER' }, explanation: STR }))
});

/* ---------- phân loại lỗi của Gemini ---------- */
function classify(status, data) {
  const err = (data && data.error) || {};
  const blob = JSON.stringify(err.details || []) + ' ' + String(err.message || '') + ' ' + String(err.status || '');
  if (status === 429 || err.status === 'RESOURCE_EXHAUSTED') return /PerDay/i.test(blob) ? 'QUOTA_EXCEEDED' : 'RATE_LIMIT';
  if (status === 401 || status === 403 || /API_KEY_INVALID|API key not valid|API key expired|PERMISSION_DENIED/i.test(blob)) return 'API_KEY_INVALID';
  if (status === 404) return 'API_KEY_INVALID';   // sai tên model trong GEMINI_MODEL: cũng là lỗi cấu hình, người dùng không tự sửa được
  return 'AI_UNAVAILABLE';                        // 5xx và mọi trường hợp còn lại
}
const HTTP = { QUOTA_EXCEEDED: 429, RATE_LIMIT: 429, USER_LIMIT: 429, API_KEY_INVALID: 503, AI_UNAVAILABLE: 502 };

/* "gemini-flash-latest" được Google đổi sang model mới theo thời gian, và mỗi đời model nhận tham số hơi khác nhau
 * (Gemini 3 không cho tắt hẳn bước suy nghĩ; model cũ không biết thinkingLevel...). Nên thử lần lượt từ cấu hình
 * tốt nhất tới đơn giản nhất; lỗi 400 do tham số trả về rất nhanh (~1 giây) nên vẫn kịp trong 25 giây. */
const CONFIGS = [
  { responseMimeType: 'application/json', responseSchema: SCHEMA, thinkingConfig: { thinkingLevel: 'low' } },
  { responseMimeType: 'application/json', responseSchema: SCHEMA },
  { responseMimeType: 'application/json' }          // không có khuôn: dựa vào mô tả JSON trong lời nhắc, web vẫn kiểm tra lại từng câu
];
// Mô tả lỗi ngắn để hiện cho người dùng và ghi log (thông báo lỗi của Google không chứa API key)
function describe(r) {
  const err = (r.data && r.data.error) || {};
  return ('Gemini ' + r.status + ' ' + (err.status || '') + ' ' + String(err.message || '')).trim().slice(0, 240);
}

async function askGemini(key, model, prompt, generationConfig, signal) {
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':generateContent';
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: generationConfig }),
    signal: signal
  });
  let data = null; try { data = await res.json(); } catch (e) { /* không phải JSON */ }
  return { status: res.status, ok: res.ok, data: data };
}

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') return reply(405, { error: 'BAD_REQUEST', message: 'Chỉ nhận POST.' });
  const req = readRequest(event.body);
  if (!req) return reply(400, { error: 'BAD_REQUEST' });

  const key = process.env.GEMINI_API_KEY;
  if (!key) { console.error('generate-exam: thiếu biến môi trường GEMINI_API_KEY'); return reply(HTTP.API_KEY_INVALID, { error: 'API_KEY_INVALID' }); }

  const h = event.headers || {};
  const ip = h['x-nf-client-connection-ip'] || h['client-ip'] || String(h['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  const wait = minutesToWait(ip);
  if (wait) return reply(HTTP.USER_LIMIT, { error: 'USER_LIMIT', waitMin: wait });

  const ctrl = new AbortController();
  const timer = setTimeout(function () { ctrl.abort(); }, TIMEOUT_MS);
  try {
    const prompt = buildPrompt(req);
    // Một model: thử lần lượt các cấu hình, chỉ chuyển cấu hình khi Gemini chê tham số (400)
    async function tryModel(model) {
      let r;
      for (let i = 0; i < CONFIGS.length; i++) {
        r = await askGemini(key, model, prompt, Object.assign({ temperature: 1 }, CONFIGS[i]), ctrl.signal);
        if (r.status !== 400 || classify(r.status, r.data) !== 'AI_UNAVAILABLE') break;
        console.error('generate-exam: ' + model + ' từ chối cấu hình ' + (i + 1) + ' –', describe(r));
      }
      return r;
    }
    // Quá tải (5xx) hoặc hết lượt (429) là chuyện thường ở gói miễn phí và chỉ kéo dài vài giây:
    // thử lần lượt model chính và các model dự phòng, nghỉ ngắn giữa các lần, trong giới hạn 25 giây.
    // Model dự phòng không tồn tại (404) thì bỏ qua. Nếu tất cả đều hỏng, báo lỗi của model chính
    // (để thông báo "hết lượt hôm nay" vẫn đúng) kèm lỗi của các model dự phòng trong phần chi tiết.
    const t0 = Date.now(), tried = [];
    let r = null, first = null;
    for (const model of [MODEL, MODEL].concat(BACKUP_MODELS.filter(function (m) { return m !== MODEL; }))) {
      if (tried.length && Date.now() - t0 > TIMEOUT_MS - 8000) break;               // không đủ thời gian cho lần nữa
      if (tried.length) await new Promise(function (ok) { setTimeout(ok, 1200); });
      const x = await tryModel(model);
      if (x.ok) { r = x; break; }
      tried.push(model + ': ' + describe(x));
      console.error('generate-exam: ' + model + ' –', describe(x));
      if (!first) first = x;
      if (!(x.status >= 500 || x.status === 429 || (x.status === 404 && model !== MODEL))) break;   // sai key, sai tham số… → thử nữa cũng vô ích
    }
    if (!r) r = first;

    if (!r.ok) {
      const code = classify(r.status, r.data), detail = describe(r) + (tried.length > 1 ? ' (đã thử ' + tried.length + ' lần, cả model dự phòng)' : '');
      console.error('generate-exam: →', code, '–', detail);   // không in key, không in nội dung đề
      return reply(HTTP[code], { error: code, detail: detail });
    }
    const cand = r.data && r.data.candidates && r.data.candidates[0];
    const out = cand && cand.content && Array.isArray(cand.content.parts)
      ? cand.content.parts.filter(function (p) { return !p.thought; }).map(function (p) { return p.text || ''; }).join('') : '';
    let exam = null; try { exam = JSON.parse(out.replace(/^\s*```(?:json)?\s*|\s*```\s*$/g, '')); } catch (e) { /* AI trả về không phải JSON hoàn chỉnh */ }
    if (!exam || typeof exam !== 'object') {
      const detail = 'AI trả về sai định dạng (finishReason: ' + ((cand && cand.finishReason) || 'không rõ') + ')';
      console.error('generate-exam:', detail);
      return reply(HTTP.AI_UNAVAILABLE, { error: 'AI_UNAVAILABLE', detail: detail });
    }
    return reply(200, { ok: true, exam: exam });
  } catch (e) {
    const detail = e && e.name === 'AbortError' ? 'Gemini không trả lời trong ' + (TIMEOUT_MS / 1000) + ' giây' : 'Lỗi mạng khi gọi Gemini';
    console.error('generate-exam:', detail);
    return reply(HTTP.AI_UNAVAILABLE, { error: 'AI_UNAVAILABLE', detail: detail });
  } finally {
    clearTimeout(timer);
  }
};

/* để thử phần phân loại lỗi mà không cần gọi Gemini thật */
exports._test = { classify: classify, readRequest: readRequest, buildPrompt: buildPrompt };

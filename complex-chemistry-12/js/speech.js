/* =====================================================================
 * COMPLEX CHEMISTRY 12 – GIỌNG NÓI
 * Đọc tên (SpeechSynthesis), nhận dạng giọng nói (SpeechRecognition)
 * và chấm điểm phát âm từng âm tiết.
 * ===================================================================== */
var Speech = (function () {
  'use strict';
  var synth = window.speechSynthesis || null;
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition || null;
  var rec = null, voiceList = [], warnedVoice = false, playingBtn = null;

  function loadVoices() { try { voiceList = synth ? synth.getVoices() : []; } catch (e) { voiceList = []; } }
  if (synth) { loadVoices(); if ('onvoiceschanged' in synth) synth.addEventListener('voiceschanged', loadVoices); }

  function voices(lang) {
    if (!voiceList.length) loadVoices();
    var pre = lang === 'vi' ? 'vi' : 'en';
    return voiceList.filter(function (v) { return (v.lang || '').toLowerCase().indexOf(pre) === 0; });
  }
  function pickVoice(lang) {
    var list = voices(lang), want = App.getSetting(lang === 'vi' ? 'voiceVi' : 'voiceEn');
    var chosen = list.filter(function (v) { return v.name === want; })[0];
    if (chosen) return chosen;
    var acc = App.getSetting('enAccent') || 'en-US';
    if (lang !== 'vi') list.sort(function (a, b) { return (b.lang.replace('_', '-') === acc) - (a.lang.replace('_', '-') === acc); });
    list.sort(function (a, b) { return (/natural|online|google/i.test(b.name)) - (/natural|online|google/i.test(a.name)); });
    return list[0] || null;
  }

  function cancel() {
    try { if (synth) synth.cancel(); } catch (e) { }
    if (playingBtn) { playingBtn.classList.remove('playing'); playingBtn = null; }
  }
  function speak(text, lang, btn, rate) {
    if (!synth || !window.SpeechSynthesisUtterance) { App.toast('Trình duyệt không hỗ trợ đọc văn bản.', 'volume-x'); return; }
    cancel();
    var u = new SpeechSynthesisUtterance(text), v = pickVoice(lang);
    u.lang = lang === 'vi' ? 'vi-VN' : (App.getSetting('enAccent') || 'en-US');
    if (v) u.voice = v;
    else if (lang === 'vi' && !warnedVoice) { warnedVoice = true; App.toast('Máy chưa có giọng đọc tiếng Việt – xem hướng dẫn cài thêm trong Cài đặt.', 'volume-x'); }
    u.rate = rate || +App.getSetting('rate') || 0.9;
    if (btn) { playingBtn = btn; btn.classList.add('playing'); }
    u.onend = u.onerror = function () { if (btn) btn.classList.remove('playing'); if (playingBtn === btn) playingBtn = null; };
    try { synth.speak(u); } catch (e) { if (btn) btn.classList.remove('playing'); }
  }

  function canListen() { return !!SR; }
  function hasVoice(lang) { return voices(lang).length > 0; }
  function stop() { try { if (rec) rec.stop(); } catch (e) { } }

  var ERR = {
    'not-allowed': 'Bạn chưa cho phép dùng micro. Bấm biểu tượng ổ khóa cạnh địa chỉ web → Micro → Cho phép.',
    'service-not-allowed': 'Trình duyệt chặn dịch vụ nhận dạng giọng nói. Hãy mở web bằng https trên Chrome/Edge.',
    'no-speech': 'Không nghe thấy tiếng nói. Hãy nói to, rõ và gần micro hơn.',
    'audio-capture': 'Không tìm thấy micro. Kiểm tra lại thiết bị thu âm.',
    'network': 'Lỗi mạng: nhận dạng giọng nói cần kết nối Internet.'
  };
  function listen(o) {
    if (!SR) { if (o.onError) o.onError('Trình duyệt chưa hỗ trợ nhận dạng giọng nói (hãy dùng Chrome hoặc Edge).'); if (o.onEnd) o.onEnd(); return; }
    stop(); cancel();
    var me = new SR(); rec = me;
    me.lang = o.lang === 'en' ? 'en-US' : 'vi-VN';
    me.interimResults = true; me.maxAlternatives = 3; me.continuous = false;
    // bỏ qua mọi sự kiện của bộ nhận dạng cũ đã bị thay thế
    me.onresult = function (ev) {
      if (rec !== me) return;
      var r = ev.results[ev.results.length - 1];
      if (r.isFinal) {
        var alts = []; for (var i = 0; i < r.length; i++) alts.push(r[i].transcript);
        if (o.onResult) o.onResult(alts);
      } else if (o.onInterim) o.onInterim(r[0].transcript);
    };
    me.onerror = function (ev) { if (rec === me && o.onError && ev.error !== 'aborted') o.onError(ERR[ev.error] || ('Lỗi nhận dạng: ' + ev.error)); };
    me.onend = function () { if (rec !== me) return; rec = null; if (o.onEnd) o.onEnd(); };
    try { me.start(); } catch (e) { rec = null; if (o.onError) o.onError('Không khởi động được micro: ' + e.message); if (o.onEnd) o.onEnd(); }
  }

  /* ---------------- CHẤM ĐIỂM PHÁT ÂM ---------------- */
  var DIGIT_VI = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
  var DIGIT_EN = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
  function clean(s, lang) {
    var d = lang === 'en' ? DIGIT_EN : DIGIT_VI;
    return Chem.deaccent(String(s).replace(/\b(VIII|VII|VI|IV|V|III|II)\b/g, function (r) { return ' ' + d[Chem.ROMAN.indexOf(r)] + ' '; })
      .replace(/\d/g, function (x) { return ' ' + d[+x] + ' '; }))
      .replace(/[^a-z\s]/g, ' ').replace(/([a-z])\1+/g, '$1');
  }
  // các "âm tiết" mẫu cần đọc (chữ "ion" không bắt buộc)
  function expectedTokens(a, lang) {
    var out = [];
    (lang === 'en' ? a.partsEn : a.partsVi).forEach(function (pt) {
      if (pt.k === 'ion') return;
      (pt.s || pt.t).replace(/[()\-]/g, ' ').trim().split(/\s+/).forEach(function (w) {
        if (w && w !== 'N') out.push({ text: w, kind: pt.k, show: pt.k === 'os' ? pt.t + ' → ' + w : w, phon: lang === 'en' && typeof PHONETIC !== 'undefined' ? PHONETIC[w] || '' : '' });
      });
    });
    return out;
  }
  function noTone(s) { return String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').normalize('NFC'); }
  function heardWords(heard, lang) {
    var d = lang === 'en' ? DIGIT_EN : DIGIT_VI;
    return String(heard).toLowerCase().normalize('NFC').replace(/\d/g, function (x) { return ' ' + d[+x] + ' '; }).split(/[^0-9a-zà-ỹđ]+/i).filter(Boolean);
  }
  function score(a, heard, lang) {
    var toks = expectedTokens(a, lang), H = clean(heard, lang).replace(/\s+/g, ''), ptr = 0, total = 0, words = heardWords(heard, lang);
    var res = toks.map(function (tk) {
      var t = clean(tk.text, lang).replace(/\s+/g, ''), best = 0, bs = ptr, bl = 0, bestAdj = -1;
      var maxStart = Math.min(H.length, ptr + Math.max(8, t.length + 4));
      for (var s = ptr; s <= maxStart; s++) {
        for (var L = Math.max(1, Math.ceil(t.length * 0.6)); L <= t.length + 3; L++) {
          if (s + L > H.length) break;
          var sim = Chem.similarity(t, H.substr(s, L)), adj = sim - 0.02 * (s - ptr); // ưu tiên vị trí gần
          if (adj > bestAdj) { bestAdj = adj; best = sim; bs = s; bl = L; }
        }
      }
      var seg = best > 0 ? H.substr(bs, bl) : '';
      if (best >= 0.6) ptr = bs + bl;
      var r = { tok: tk, sim: best, seg: seg, t: t, cls: best >= 0.85 ? 'ok' : best >= 0.55 ? 'near' : 'bad' };
      // tiếng Việt: kiểm tra dấu thanh (đồng ≠ đông) khi chữ đã khớp
      if (lang === 'vi' && r.cls === 'ok' && noTone(tk.text) !== tk.text.toLowerCase()) {
        var w = tk.text.toLowerCase();
        if (words.indexOf(w) < 0 && words.some(function (x) { return noTone(x) === noTone(w); })) { r.cls = 'near'; r.tone = true; r.sim = Math.min(r.sim, 0.75); }
      }
      total += r.sim;
      return r;
    });
    var pct = toks.length ? Math.round(total / toks.length * 100) : 0;
    var expLen = clean(toks.map(function (x) { return x.text; }).join(''), lang).replace(/\s+/g, '').length;
    if (H.length > expLen * 1.6) pct = Math.round(pct * expLen * 1.6 / H.length); // phạt khi đọc thừa nhiều
    return { tokens: res, pct: Math.max(0, Math.min(100, pct)) };
  }
  function nearest(heard, lang) {
    var h = clean(heard, lang).replace(/\s+/g, ''), best = null;
    App.lib().forEach(function (a) {
      var s = Chem.similarity(h, clean(lang === 'en' ? a.speakEn : a.speakVi, lang).replace(/\s+/g, ''));
      if (!best || s > best.s) best = { a: a, s: s };
    });
    return best;
  }
  var HINTS = {
    ammin: 'Đọc “am-min”, ngân rõ âm m (viết hai chữ m).', aqua: 'Đọc “a-qua” (a-kwa).', hidroxo: 'Đọc “hi-đrô-xô”.',
    xiano: 'Đọc “xi-a-nô”.', thioxianato: 'Đọc “thi-ô-xi-a-na-tô”.', cacbonyl: 'Đọc “các-bô-nin”.', cloro: 'Đọc “clo-rô”.',
    iodo: 'Đọc “i-ốt-đô”.', floro: 'Đọc “flo-rô”.', etylendiamin: 'Đọc “ê-ty-len-đi-a-min”.', oxalato: 'Đọc “ô-xa-la-tô”.',
    thiosunfato: 'Đọc “thi-ô-sun-pha-tô”.', nitro: 'Đọc “ni-trô”.', ferat: 'Đọc “phe-rát” (gốc Latin Ferrum).', cuprat: 'Đọc “cu-prát” (gốc Latin Cuprum).',
    argentat: 'Đọc “ác-gien-tát” (gốc Latin Argentum).', aurat: 'Đọc “au-rát” (gốc Latin Aurum).', cobaltat: 'Đọc “cô-ban-tát”, viết “cobaltat”.',
    zincat: 'Đọc “zin-cát”.', aluminat: 'Đọc “a-lu-mi-nát”.', platinat: 'Đọc “pla-ti-nát”.', nickelat: 'Đọc “ni-ken-lát”.', mercurat: 'Đọc “méc-cu-rát”.',
    di: 'Tiền tố “đi” = 2.', tri: 'Tiền tố “tri” = 3.', tetra: 'Tiền tố “tê-tra” = 4.', penta: 'Tiền tố “pen-ta” = 5.', hexa: 'Tiền tố “hếch-xa” = 6.',
    bis: 'Tiền tố “bis” = 2 (phối tử phức tạp).', tris: 'Tiền tố “tris” = 3 (phối tử phức tạp).'
  };
  // phần chữ bị thiếu/sai: so phần đầu và phần cuối giống nhau giữa mẫu và câu đọc
  function missingChunk(t, seg) {
    var lp = 0, ls = 0;
    while (lp < t.length && lp < seg.length && t[lp] === seg[lp]) lp++;
    while (ls < t.length - lp && ls < seg.length - lp && t[t.length - 1 - ls] === seg[seg.length - 1 - ls]) ls++;
    return t.slice(lp, t.length - ls);
  }
  function hintFor(r, lang) {
    var word = Chem.esc(r.tok.text), key = Chem.deaccent(r.tok.text);
    var P = (typeof PHONETIC !== 'undefined') ? PHONETIC : {};
    var say = lang === 'en' && P[r.tok.text] ? ' Đọc là “' + P[r.tok.text] + '”.' : (lang === 'vi' && HINTS[key] ? ' ' + HINTS[key] : '');
    if (r.tone) return 'Sai dấu thanh: phải đọc là <b>“' + word + '”</b>.';
    if (r.tok.kind === 'os') return 'Số oxi hóa ' + Chem.esc(r.tok.show) + ' – đọc to con số ở cuối tên' + (lang === 'en' ? ' (ví dụ “copper two” = copper(II))' : '') + '.';
    if (r.cls === 'bad' || !r.seg) return 'Bạn đọc thiếu hoặc sai từ <b>“' + word + '”</b>.' + say;
    var miss = missingChunk(r.t, r.seg);
    if (miss && r.seg.length < r.t.length) return 'Bạn đọc thiếu âm <b>“' + Chem.esc(miss) + '”</b> trong <b>' + word + '</b>.' + say;
    if (miss) return 'Âm <b>“' + Chem.esc(miss) + '”</b> trong <b>' + word + '</b> chưa chuẩn.' + say;
    return 'Từ <b>' + word + '</b> chưa thật rõ.' + say;
  }

  return { speak: speak, cancel: cancel, listen: listen, stop: stop, canListen: canListen, voices: voices, hasVoice: hasVoice,
    expectedTokens: expectedTokens, score: score, nearest: nearest, hintFor: hintFor };
})();

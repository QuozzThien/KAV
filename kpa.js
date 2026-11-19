/*! Khanware Practice Assistant v0.5.0 (bookmarklet + extension). Chỉ đọc câu hỏi và hiển thị gợi ý; không chọn/điền/nộp bài. Tạo bởi scripts/build.js, đừng sửa tay. */
(function () {
'use strict';
if (!window.__KPA_TEST__ && !/(^|\.)khanacademy\.org$/i.test(location.hostname)) { alert('Công cụ này chỉ chạy trên khanacademy.org'); return; }
if (window.__KPA_LOADED__) { if (window.__KPA_OPEN__) window.__KPA_OPEN__(); return; } // bấm lần nữa: chỉ mở bảng
{ const st = document.createElement("style"); st.id = "kpa-style"; st.textContent = "#kpa-host { all: initial; font-family: Arial, sans-serif; --bg:#fff; --fg:#172033; --muted:#586579; --line:#e5eaf2; --soft:#f7f9fc; --head:#f3f6fb; --accent:#2563eb; --ok:#16a34a; --warn:#b45309; --err:#b91c1c; }\n#kpa-host[data-theme=\"dark\"] { --bg:#1b2230; --fg:#e6ebf5; --muted:#a3afc4; --line:#2e3850; --soft:#232c3e; --head:#222b3d; --accent:#4f8cff; --ok:#4ade80; --warn:#fbbf24; --err:#f87171; }\n#kpa-host *, #kpa-host *::before { box-sizing: border-box; }\n#kpa-launch { position: fixed; right: 14px; bottom: 76px; z-index: 2147483646; width: 44px; height: 44px; border: 0; border-radius: 50%; background: var(--accent); color: #fff; font: 700 14px Arial, sans-serif; cursor: pointer; box-shadow: 0 4px 18px #0004; }\n#kpa-panel { position: fixed; right: 14px; bottom: 128px; z-index: 2147483647; width: min(360px, calc(100vw - 28px)); max-height: min(60vh, 560px); overflow: auto; background: var(--bg); color: var(--fg); border: 1px solid var(--line); border-radius: 14px; box-shadow: 0 12px 40px #0005; font: 14px/1.5 Arial, sans-serif; }\n#kpa-panel[hidden] { display: none; }\n#kpa-panel header { position: sticky; top: 0; display: flex; align-items: center; gap: 6px; padding: 10px 12px; background: var(--head); border-bottom: 1px solid var(--line); }\n#kpa-panel header strong { flex: 1; }\n#kpa-panel header button { border: 0; background: transparent; color: var(--fg); font-size: 18px; line-height: 1; cursor: pointer; padding: 4px 7px; }\n#kpa-panel.kpa-collapsed { max-height: none; overflow: hidden; }\n#kpa-panel.kpa-collapsed .kpa-body { display: none; }\n.kpa-body { padding: 12px; }\n.kpa-note { margin: 0 0 10px; color: var(--muted); font-size: 12px; }\n#kpa-analyze, #kpa-copy { width: 100%; border: 0; border-radius: 9px; padding: 10px; background: var(--accent); color: #fff; font-weight: 700; cursor: pointer; }\n#kpa-copy { margin-top: 8px; background: transparent; color: var(--accent); border: 1px solid var(--accent); }\n#kpa-analyze:disabled { opacity: .6; cursor: wait; }\n#kpa-copy[hidden] { display: none; }\n.kpa-link { display: block; margin-top: 10px; border: 0; background: none; color: var(--muted); text-decoration: underline; font-size: 12px; cursor: pointer; padding: 0; }\n#kpa-status { margin: 10px 0; color: var(--muted); font-size: 12px; white-space: pre-wrap; overflow-wrap: anywhere; }\n#kpa-status[data-kind=\"error\"] { color: var(--err); } #kpa-status[data-kind=\"warn\"] { color: var(--warn); } #kpa-status[data-kind=\"ok\"] { color: var(--ok); }\n.kpa-card { border-top: 1px solid var(--line); padding: 10px 0; }\n.kpa-card > strong { display: block; margin-bottom: 5px; }\n.kpa-value { white-space: pre-wrap; overflow-wrap: anywhere; background: var(--soft); padding: 8px; border-radius: 8px; margin-top: 4px; }\n.kpa-math { font-family: \"Courier New\", monospace; }\n.kpa-warn { color: var(--warn); font-size: 12px; margin-top: 6px; } .kpa-conf { color: var(--muted); font-size: 12px; margin-top: 6px; }\n.kpa-table { width: 100%; border-collapse: collapse; font-size: 13px; } .kpa-table td { border: 1px solid var(--line); padding: 4px 6px; }\n.kpa-mark { outline: 3px solid #16a34a !important; outline-offset: 2px !important; border-radius: 5px !important; }\n.kpa-body input, .kpa-body textarea { width: 100%; margin: 6px 0; padding: 7px; border: 1px solid var(--line); border-radius: 6px; background: var(--soft); color: var(--fg); font: 13px Arial, sans-serif; }\n.kpa-small { margin: 4px 6px 0 0; padding: 6px 12px; border: 0; border-radius: 6px; background: var(--accent); color: #fff; cursor: pointer; }\n"; document.head.appendChild(st); }
/* ---- src/shared/helpers.js ---- */
/* Tiện ích dùng chung. Các file trong extension chia sẻ không gian tên globalThis.KPA
 * (content script cùng extension dùng chung một "isolated world"); cũng chạy được trong Node để test. */
(function (root) {
  const K = root.KPA || (root.KPA = {});
  const clean = v => String(v == null ? '' : v).replace(/[\u200B-\u200D\u2060\uFEFF]/g, '').replace(/\s+/g, ' ').trim();
  const truncate = (s, n) => (s.length > n ? s.slice(0, n - 1) + '…' : s);

  // Hiển thị thật sự: không display:none / visibility:hidden / hidden ở bất kỳ tổ tiên nào; có kích thước (nếu bật layout)
  function isVisible(el) {
    if (!el || el.nodeType !== 1) return false;
    const view = el.ownerDocument.defaultView;
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      if (n.hidden) return false;
      if (view.getComputedStyle(n).display === 'none') return false;
    }
    if (view.getComputedStyle(el).visibility === 'hidden') return false;
    if ((K.config || {}).useLayout !== false) {
      const r = el.getBoundingClientRect();
      if (!r.width && !r.height) return false;
    }
    return true;
  }
  const hashString = s => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); };

  K.helpers = { clean, truncate, isVisible, hashString };
  if (typeof module === 'object' && module.exports) module.exports = K.helpers;
})(globalThis);

/* ---- src/reader/contentExtractor.js ---- */
/* Trích văn bản hiển thị từ DOM. Không đọc giá trị người dùng đã nhập hay trạng thái đã chọn. */
(function (root) {
  const K = root.KPA || (root.KPA = {});
  const H = K.helpers;
  const SKIP = new Set(['script', 'style', 'noscript', 'template']);

  // MathML (MathJax assistive) -> văn bản đọc được, ví dụ x^2, (a)/(b), sqrt(...)
  const wrap = s => { s = s.trim(); return /^\S+$/.test(s) ? s : '(' + s + ')'; };
  function mml(n) {
    if (n.nodeType === 3) return n.nodeValue;
    if (n.nodeType !== 1) return '';
    const t = n.localName, k = [...n.children], j = a => a.map(mml).join(' ');
    switch (t) {
      case 'annotation': case 'annotation-xml': case 'mspace': return '';
      case 'msup': { const b = mml(k[0]).trim(), e = mml(k[1]).trim(); return /^[′″‴'*]+$/.test(e) ? b + e : b + '^' + wrap(e); }
      case 'msub': return mml(k[0]).trim() + '_' + wrap(mml(k[1]));
      case 'munder': return mml(k[0]).trim() + '_' + wrap(mml(k[1]));
      case 'mover': return mml(k[0]).trim() + '^' + wrap(mml(k[1]));
      case 'msubsup': case 'munderover': return mml(k[0]).trim() + '_' + wrap(mml(k[1])) + '^' + wrap(mml(k[2]));
      case 'mfrac': return '(' + mml(k[0]).trim() + ')/(' + mml(k[1]).trim() + ')';
      case 'msqrt': return 'sqrt(' + j(k).trim() + ')';
      case 'mroot': return 'root(' + mml(k[1]).trim() + ', ' + mml(k[0]).trim() + ')';
      case 'mtable': return '[' + k.map(r => [...r.children].map(c => mml(c).trim()).join(', ')).join('; ') + ']';
      default: return k.length ? j(k) : n.textContent;
    }
  }
  const mathText = el => { const m = el.querySelector('math'); return H.clean(m ? mml(m).replace(/[\u2061-\u2064]/g, '') : ''); };

  // opts.replace: Map<Element,string> thay thế cả khối (dùng để thay widget bằng nhãn [WIDGET w1: radio])
  function nodeText(node, opts) {
    opts = opts || {};
    if (node.nodeType === 3) return node.nodeValue;
    if (node.nodeType !== 1) return '';
    const el = node, tag = el.tagName.toLowerCase();
    if (SKIP.has(tag)) return '';
    if (opts.replace && opts.replace.has(el)) return ' ' + opts.replace.get(el) + ' ';
    // MathJax: dùng MathML trợ năng (các mjx-c chỉ là hình, không có chữ); bỏ nút/svg đi kèm
    if (tag === 'mjx-container') { const t = mathText(el); return t ? ' $' + t + '$ ' : ''; }
    if (el.classList.contains('mathjax-selectable') || el.classList.contains('copy-menu-hack')) return '';
    // KaTeX: lấy mã TeX gốc, tránh lặp chữ giữa lớp MathML và lớp HTML
    if (el.classList.contains('katex')) {
      const ann = el.querySelector('annotation[encoding="application/x-tex"]');
      const t = H.clean(ann ? ann.textContent : (el.querySelector('.katex-mathml') || el).textContent);
      return t ? ' $' + t + '$ ' : '';
    }
    if (el.getAttribute('aria-hidden') === 'true') return '';
    if (!H.isVisible(el)) return '';
    if (tag === 'img') { const a = H.clean(el.getAttribute('alt')); return a ? ' [ảnh: ' + a + '] ' : ' [ảnh không có mô tả] '; }
    if (tag === 'svg') {
      if (el.closest('.mathjax-wrapper,mjx-container')) return '';
      const t = H.clean(el.getAttribute('aria-label') || (el.querySelector('title') || {}).textContent);
      return t ? ' [hình vẽ: ' + t + '] ' : ' [hình vẽ] ';
    }
    if (tag === 'canvas') return ' [hình vẽ canvas] ';
    if (tag === 'select') return ' [danh sách chọn] ';
    if (tag === 'textarea') return ' [ô nhập] ';
    if (tag === 'input') {
      const t = (el.getAttribute('type') || 'text').toLowerCase();
      return ['radio', 'checkbox', 'hidden', 'submit', 'button'].includes(t) ? '' : ' [ô nhập] ';
    }
    let out = '';
    for (const c of el.childNodes) out += nodeText(c, opts) + ' ';
    return out;
  }
  const textOf = (el, opts) => H.clean(nodeText(el, opts));

  K.extractor = { nodeText, textOf };
  if (typeof module === 'object' && module.exports) module.exports = K.extractor;
})(globalThis);

/* ---- src/widgets/registry.js ---- */
/* Đăng ký widget: mỗi loại có bộ trích xuất (extract), định dạng đáp án yêu cầu AI (format),
 * bộ kiểm tra kết quả (validate) và cách hiển thị (describe).
 * Quy ước: AI luôn trả CHỈ SỐ (0-based) thay vì chép lại chữ, để đối chiếu chắc chắn và chống bịa.
 * Widget không đọc được chính xác từ DOM => supported:false (không gọi AI, không đoán). */
(function (root) {
  const K = root.KPA || (root.KPA = {});
  const H = K.helpers, E = K.extractor;
  const vis = el => H.isVisible(el);
  const isIdx = (n, len) => Number.isInteger(n) && n >= 0 && n < len;
  const TEXT_INPUT = 'input:not([type=radio]):not([type=checkbox]):not([type=hidden]):not([type=submit]):not([type=button]):not([type=file]), textarea, [role=textbox], [contenteditable="true"], .mq-editable-field, [class*="mq-editable-field"]';
  const LIMITS = { opt: 300, items: 40, rows: 30, cols: 12 };

  const textInputs = c => {
    const all = [...c.querySelectorAll(TEXT_INPUT)].filter(vis);
    return all.filter(a => !all.some(b => b !== a && a.contains(b)));
  };
  const genericLabel = t => /^Ô nhập dữ liệu toán học/i.test(t) || /^math input/i.test(t);
  const fieldLabel = el => (l => (genericLabel(l) ? '' : l))(H.clean(el.getAttribute('aria-label') ||
    (el.getAttribute('aria-labelledby') && [...el.getAttribute('aria-labelledby').split(/\s+/)].map(id => (el.ownerDocument.getElementById(id) || {}).textContent || '').join(' ')) ||
    (el.labels && el.labels[0] && el.labels[0].textContent) || el.getAttribute('placeholder') || ''));
  // Phần tử chỉ có ảnh/hình không mô tả => không biết nội dung thật, không được đoán
  const blind = t => /\[(ảnh không có mô tả|hình vẽ|hình vẽ canvas)\]/.test(t);
  const unsupported = reason => ({ supported: false, reason });
  const itemsFrom = (c, sel) => [...c.querySelectorAll(sel)].filter(vis).map(el => ({ el, text: H.truncate(E.textOf(el), LIMITS.opt) })).filter(x => x.text);

  /* ---------- Trắc nghiệm ---------- */
  const radio = {
    supported: true,
    format: '{"selected":[<option index>]}  (exactly one index unless data.multiple is true)',
    extract(c) {
      // Perseus mới: fieldset > ul[role=list] > li[role=listitem] > button[aria-label="(Đáp án A)"] + nội dung ở phần tử có id "...-choice-N"
      const lis = [...c.querySelectorAll('li[role=listitem]')].filter(li => vis(li) && li.querySelector('[id*="-choice-"]'));
      if (lis.length >= 2) {
        const options = lis.map((li, index) => ({ index, text: H.truncate(E.textOf(li.querySelector('[id*="-choice-"]')), LIMITS.opt) }));
        if (options.some(o => !o.text || blind(o.text))) return { insufficient: 'Không đọc được đủ nội dung các phương án (có thể là phương án dạng hình ảnh).' };
        const hint = H.clean((c.querySelector('fieldset') || c).textContent);
        return { data: { multiple: /chọn tất cả|chọn nhiều|select all|all that apply/i.test(hint), options }, refs: lis };
      }
      const ctl = [...c.querySelectorAll('input[type=radio],input[type=checkbox],[role=radio],[role=checkbox]')].filter(vis);
      const seen = new Set(), holders = [];
      for (const el of ctl) {
        const h = el.closest('li,label,[role=listitem]') || el.parentElement || el;
        if (!c.contains(h) || seen.has(h)) continue;
        seen.add(h); holders.push(h);
      }
      const options = holders.map((h, index) => ({ index, text: H.truncate(E.textOf(h), LIMITS.opt) }));
      if (options.length < 2 || options.some(o => !o.text || blind(o.text))) return { insufficient: 'Không đọc được đủ nội dung các phương án (có thể là phương án dạng hình ảnh).' };
      const multiple = ctl.some(el => el.type === 'checkbox' || el.getAttribute('role') === 'checkbox');
      return { data: { multiple, options }, refs: holders };
    },
    validate(a, d) {
      const s = a && a.selected;
      if (!Array.isArray(s) || !s.length || !s.every(i => isIdx(i, d.options.length)) || new Set(s).size !== s.length) return { error: 'selected không hợp lệ' };
      if (!d.multiple && s.length !== 1) return { error: 'câu chỉ có một đáp án nhưng AI trả nhiều' };
      return { value: { selected: s } };
    },
    describe: (v, d) => ({ lines: v.selected.map(i => 'Phương án ' + (i + 1) + ': ' + d.options[i].text), marks: v.selected })
  };

  /* ---------- Dropdown ---------- */
  const dropdown = {
    supported: true,
    format: '{"selected": <option index>}',
    extract(c) {
      const sel = c.querySelector('select');
      let opts = [], refs = [];
      if (sel) {
        const list = [...sel.options].filter((o, i) => !(i === 0 && (o.value === '' || o.disabled)));
        opts = list.map(o => H.clean(o.textContent)); refs = [sel];
      } else {
        const btn = c.querySelector('[role=combobox],button[aria-haspopup]');
        if (!btn || btn.getAttribute('aria-expanded') !== 'true') return { insufficient: 'Danh sách thả xuống đang đóng. Hãy mở danh sách rồi bấm phân tích lại.' };
        refs = [...c.ownerDocument.querySelectorAll('[role=listbox] [role=option]')].filter(vis);
        opts = refs.map(o => E.textOf(o));
      }
      if (opts.length < 2 || opts.some(t => !t || blind(t))) return { insufficient: 'Không đọc được các lựa chọn của danh sách.' };
      return { data: { options: opts.map((text, index) => ({ index, text: H.truncate(text, LIMITS.opt) })) }, refs: sel ? [] : refs };
    },
    validate(a, d) { return isIdx(a && a.selected, d.options.length) ? { value: { selected: a.selected } } : { error: 'selected không hợp lệ' }; },
    describe: (v, d) => ({ lines: ['Chọn: ' + d.options[v.selected].text], marks: [v.selected] })
  };

  /* ---------- Ô nhập (numeric-input, input-number, expression, text-input) ---------- */
  const inputKind = (hint) => ({
    supported: true,
    format: '{"values":["<answer for field 0>", ...]}  (one string per data.fields entry; ' + hint + ')',
    extract(c) {
      const fields = textInputs(c).map((el, index) => ({ index, label: H.truncate(fieldLabel(el), 120), placeholder: H.truncate(H.clean(el.getAttribute('placeholder')), 60) }));
      if (!fields.length || fields.length > 12) return { insufficient: 'Không tìm thấy ô nhập hợp lệ trong widget.' };
      return { data: { fields }, refs: [] };
    },
    validate(a, d) {
      const v = a && a.values;
      if (!Array.isArray(v) || v.length !== d.fields.length) return { error: 'values không khớp số ô nhập' };
      const out = v.map(x => (typeof x === 'number' ? String(x) : x));
      if (!out.every(x => typeof x === 'string' && x.trim() && x.length <= 200)) return { error: 'giá trị ô nhập rỗng hoặc quá dài' };
      return { value: { values: out.map(x => x.trim()) } };
    },
    describe: (v, d) => ({ lines: v.values.map((x, i) => (d.fields[i].label ? d.fields[i].label + ': ' : 'Ô ' + (i + 1) + ': ') + x), marks: [] })
  });

  /* ---------- Bảng / ma trận (ô nhập nằm trong ô bảng) ---------- */
  const grid = (needRows) => ({
    supported: true,
    format: '{"cells":[{"row":<r>,"col":<c>,"value":"<text>"}]}  (0-based; only cells that are "[ô nhập]" in data.rows)',
    extract(c) {
      const trs = [...c.querySelectorAll('tr')].filter(vis).slice(0, LIMITS.rows);
      if (!trs.length) return { insufficient: needRows ? 'Không xác định được hàng/cột của ma trận từ DOM.' : 'Không tìm thấy bảng.' };
      const rows = trs.map(tr => [...tr.children].filter(x => /^(td|th)$/i.test(x.tagName)).slice(0, LIMITS.cols).map(td => H.truncate(E.textOf(td), 80)));
      if (!rows.some(r => r.some(t => t.includes('[ô nhập]')))) return { insufficient: 'Bảng không có ô nào cần điền.' };
      return { data: { rows }, refs: [] };
    },
    validate(a, d) {
      const cells = a && a.cells;
      if (!Array.isArray(cells) || !cells.length) return { error: 'cells trống' };
      const seen = new Set(), out = [];
      for (const x of cells) {
        const row = x && x.row, col = x && x.col, val = x && (typeof x.value === 'number' ? String(x.value) : x.value);
        if (!isIdx(row, d.rows.length) || !isIdx(col, d.rows[row].length)) return { error: 'ô ngoài phạm vi bảng' };
        if (!d.rows[row][col].includes('[ô nhập]')) return { error: 'AI điền vào ô không phải ô nhập' };
        if (typeof val !== 'string' || !val.trim() || val.length > 100 || seen.has(row + ',' + col)) return { error: 'giá trị ô không hợp lệ hoặc trùng' };
        seen.add(row + ',' + col); out.push({ row, col, value: val.trim() });
      }
      const need = d.rows.reduce((n, r) => n + r.filter(t => t.includes('[ô nhập]')).length, 0);
      if (out.length !== need) return { error: 'AI không điền đủ các ô nhập' };
      return { value: { cells: out } };
    },
    describe: (v) => ({ lines: v.cells.map(x => 'Hàng ' + (x.row + 1) + ', cột ' + (x.col + 1) + ': ' + x.value), marks: [], table: v.cells })
  });

  /* ---------- Widget dạng danh sách (CHƯA kiểm thử trên DOM thật) ---------- */
  const listItems = (c) => itemsFrom(c, '[draggable="true"],[role=listitem],li');
  const orderer = (name) => ({
    supported: true, experimental: true,
    format: '{"order":[<item index>, ...]}  (every item index exactly once, in the correct order)',
    extract(c) {
      const items = listItems(c).slice(0, LIMITS.items);
      if (items.length < 2 || items.some(x => blind(x.text))) return { insufficient: 'Không đọc được các phần tử cần sắp xếp.' };
      return { data: { items: items.map((x, index) => ({ index, text: x.text })) }, refs: items.map(x => x.el) };
    },
    validate(a, d) {
      const o = a && a.order, n = d.items.length;
      if (!Array.isArray(o) || o.length !== n || !o.every(i => isIdx(i, n)) || new Set(o).size !== n) return { error: 'order không phải hoán vị hợp lệ' };
      return { value: { order: o } };
    },
    describe: (v, d) => ({ lines: v.order.map((i, k) => (k + 1) + '. ' + d.items[i].text), marks: [] })
  });
  const categorizer = {
    supported: true, experimental: true,
    format: '{"assignments":[{"item":<item index>,"category":<category index>}]}  (every item exactly once)',
    extract(c) {
      const rows = [...c.querySelectorAll('tr')].filter(vis);
      const cell = tr => tr.querySelector('th,td');
      const cats = rows.length ? [...rows[0].children].map(x => E.textOf(x)).filter(Boolean).slice(0, 10) : [];
      const items = rows.slice(1).map(tr => (cell(tr) ? E.textOf(cell(tr)) : '')).filter(Boolean).slice(0, LIMITS.items);
      if (cats.length < 2 || items.length < 1 || [...cats, ...items].some(blind)) return { insufficient: 'Không xác định được nhóm và phần tử cần phân loại.' };
      return { data: { categories: cats.map((text, index) => ({ index, text })), items: items.map((text, index) => ({ index, text })) }, refs: [] };
    },
    validate(a, d) {
      const x = a && a.assignments;
      if (!Array.isArray(x) || x.length !== d.items.length) return { error: 'assignments không đủ phần tử' };
      const seen = new Set();
      for (const e of x) { if (!e || !isIdx(e.item, d.items.length) || !isIdx(e.category, d.categories.length) || seen.has(e.item)) return { error: 'assignment không hợp lệ' }; seen.add(e.item); }
      return { value: { assignments: x.map(e => ({ item: e.item, category: e.category })) } };
    },
    describe: (v, d) => ({ lines: v.assignments.map(e => d.items[e.item].text + ' → ' + d.categories[e.category].text), marks: [] })
  };
  const matcher = {
    supported: true, experimental: true,
    format: '{"pairs":[{"left":<left index>,"right":<right index>}]}  (each left once, each right once)',
    extract(c) {
      const lists = [...c.querySelectorAll('ul,ol,[role=list]')].filter(vis);
      if (lists.length < 2) return { insufficient: 'Không xác định được hai cột của bài ghép cặp.' };
      const mk = l => itemsFrom(l, 'li,[role=listitem],[draggable="true"]').slice(0, LIMITS.items).map((x, index) => ({ index, text: x.text }));
      const left = mk(lists[0]), right = mk(lists[1]);
      if (left.length < 1 || left.length !== right.length) return { insufficient: 'Hai cột ghép cặp không cân xứng hoặc không đọc được.' };
      return { data: { left, right }, refs: [] };
    },
    validate(a, d) {
      const p = a && a.pairs, n = d.left.length;
      if (!Array.isArray(p) || p.length !== n) return { error: 'pairs không đủ' };
      const L = new Set(), R = new Set();
      for (const e of p) { if (!e || !isIdx(e.left, n) || !isIdx(e.right, n) || L.has(e.left) || R.has(e.right)) return { error: 'pair không hợp lệ' }; L.add(e.left); R.add(e.right); }
      return { value: { pairs: p.map(e => ({ left: e.left, right: e.right })) } };
    },
    describe: (v, d) => ({ lines: v.pairs.map(e => d.left[e.left].text + ' ↔ ' + d.right[e.right].text), marks: [] })
  };

  /* ---------- Widget hình/đồ thị: không đọc chính xác được từ DOM ---------- */
  const NO_GRAPH = 'Widget đồ thị/hình ảnh lưu trạng thái trong SVG/canvas, DOM không cung cấp đủ dữ liệu để giải chính xác.';

  const REGISTRY = {
    'radio': radio,
    'dropdown': dropdown,
    'numeric-input': inputKind('a number: integer, decimal or fraction like 3/4'),
    'input-number': inputKind('a number'),
    'expression': inputKind('a math expression in plain text, e.g. 2x+3 or (x-1)^2'),
    'text-input': inputKind('answer typed into the field, as a number or math expression in plain text, e.g. 18sin(x) or (x^2)/2; do not repeat text that already appears outside the field in the question, such as a trailing +C'),
    'table': grid(false),
    'matrix': grid(true),
    'orderer': orderer('orderer'),
    'sorter': orderer('sorter'),
    'categorizer': categorizer,
    'matcher': matcher,
    'unknown-widget': unsupported('Không nhận diện được loại widget này từ cấu trúc trang.'),
    'grapher': unsupported(NO_GRAPH),
    'interactive-graph': unsupported(NO_GRAPH),
    'plotter': unsupported(NO_GRAPH),
    'number-line': unsupported(NO_GRAPH),
    'label-image': unsupported('Widget gắn nhãn ảnh cần vị trí điểm trên ảnh, DOM không cung cấp.')
  };

  /* ---------- Bộ nhận diện ---------- */
  // Perseus gắn class "perseus-widget-<tên>" lên vùng chứa widget (cần xác nhận lại trên DOM thật khi Khan đổi giao diện).
  // Suy loại widget từ cấu trúc bên trong (Khan dùng vùng chứa chung "perseus-widget-container", không có class theo loại)
  function inferType(el) {
    if (el.querySelector('li[role=listitem] [id*="-choice-"]') || el.querySelector('input[type=radio],input[type=checkbox],[role=radio],[role=checkbox]')) return 'radio';
    if (el.querySelector('select,[role=combobox],button[aria-haspopup]')) return 'dropdown';
    if (textInputs(el).length) return 'text-input';
    if (el.querySelector('table')) return 'table';
    return 'unknown-widget';
  }
  function detect(rootEl) {
    const found = [];
    // 1) class theo loại (phiên bản Perseus cũ): perseus-widget-<tên>
    for (const el of rootEl.querySelectorAll('[class*="perseus-widget-"]')) {
      for (const cls of el.classList) {
        const m = /^perseus-widget-(.+)$/.exec(cls);
        if (m && REGISTRY[m[1]] && !['text-input', 'unknown-widget'].includes(m[1]) && vis(el)) { found.push({ type: m[1], el }); break; }
      }
    }
    const top = found.filter(a => !found.some(b => b !== a && b.type === a.type && b.el.contains(a.el)));
    if (top.length) return { widgets: top, fallback: false };
    // 2) vùng chứa chung: suy loại theo cấu trúc
    const boxes = [...rootEl.querySelectorAll('.perseus-widget-container')].filter(vis);
    const outer = boxes.filter(a => !boxes.some(b => b !== a && b.contains(a)));
    if (outer.length) return { widgets: outer.map(el => ({ type: inferType(el), el })), fallback: false };
    // 3) dự phòng theo cấu trúc toàn vùng
    const fb = [];
    if (rootEl.querySelector('input[type=radio],input[type=checkbox],[role=radio],[role=checkbox]')) fb.push({ type: 'radio', el: rootEl });
    else if (rootEl.querySelector('select')) fb.push({ type: 'dropdown', el: rootEl });
    else if (textInputs(rootEl).length) fb.push({ type: 'text-input', el: rootEl });
    return { widgets: fb, fallback: true };
  }

  K.widgets = { REGISTRY, detect, LIMITS };
  if (typeof module === 'object' && module.exports) module.exports = K.widgets;
})(globalThis);

/* ---- src/reader/questionReader.js ---- */
/* Đọc câu hỏi đang hiển thị -> JSON chuẩn hóa. Không đọc đáp án ẩn, giá trị đã nhập hay trạng thái đã chọn. */
(function (root) {
  const K = root.KPA || (root.KPA = {});
  const H = K.helpers, E = K.extractor, W = K.widgets;
  const RENDERER_SEL = '.framework-perseus,.perseus-renderer';
  const FALLBACK_ROOTS = ['[data-testid*="exercise"]', '[data-testid*="question"]', '.framework-perseus', '.perseus-renderer', 'main', '[role=main]'];

  function lca(els) {
    const path = n => { const p = []; for (; n; n = n.parentElement) p.unshift(n); return p; };
    let common = path(els[0]);
    for (const el of els.slice(1)) { const p = path(el); let i = 0; while (i < common.length && common[i] === p[i]) i++; common = common.slice(0, i); }
    return common[common.length - 1];
  }
  // Vùng câu hỏi = bộ render Perseus ngoài cùng chứa tất cả widget (tránh thanh điều hướng/giao diện phụ)
  function widgetRoot(widgets) {
    const common = lca(widgets.map(w => w.el));
    let best = null;
    for (let n = common; n && n.tagName !== 'BODY'; n = n.parentElement) if (n.matches(RENDERER_SEL)) best = n;
    return best || common.parentElement || common;
  }
  function fallbackRoot(doc) {
    for (const s of FALLBACK_ROOTS) { const el = [...doc.querySelectorAll(s)].find(H.isVisible); if (el) return el; }
    return doc.body;
  }

  function read(doc) {
    doc = doc || document;
    let det = W.detect(doc.body), rootEl;
    if (!det.fallback) rootEl = widgetRoot(det.widgets);
    else { rootEl = fallbackRoot(doc); det = W.detect(rootEl); }

    const replace = new Map(), refs = {}, widgets = [];
    det.widgets.forEach((w, i) => { w.id = 'w' + (i + 1); if (!det.fallback) replace.set(w.el, '[WIDGET ' + w.id + ': ' + w.type + ']'); });
    const questionText = H.truncate(E.textOf(rootEl, { replace }), 6000);

    for (const w of det.widgets) {
      const spec = W.REGISTRY[w.type];
      if (spec.supported === false) { widgets.push({ id: w.id, type: w.type, status: 'unsupported', reason: spec.reason }); continue; }
      const ex = spec.extract(w.el);
      if (ex.insufficient) { widgets.push({ id: w.id, type: w.type, status: 'insufficient_data', reason: ex.insufficient }); continue; }
      widgets.push({ id: w.id, type: w.type, status: 'ok', experimental: !!spec.experimental, data: ex.data });
      refs[w.id] = ex.refs || [];
    }

    let status = 'ok', reason = '';
    const bad = widgets.filter(w => w.status !== 'ok');
    if (!widgets.length) { status = 'insufficient_data'; reason = 'Không nhận diện được widget nào trong câu hỏi đang hiển thị.'; }
    else if (bad.some(w => w.status === 'unsupported')) { status = 'unsupported'; }
    else if (bad.length) { status = 'insufficient_data'; }
    if (bad.length) reason = bad.map(w => w.id + ' (' + w.type + '): ' + w.reason).join('\n');
    if (status === 'ok' && questionText.replace(/\[WIDGET [^\]]*\]/g, '').trim().length < 3) { status = 'insufficient_data'; reason = 'Không đọc được nội dung đề bài.'; }

    const exercise = { status, reason, questionText, widgets };
    exercise.fingerprint = H.hashString((doc.location ? doc.location.pathname : '') + '|' + questionText + '|' + JSON.stringify(widgets));
    return { exercise, refs, rootEl };
  }

  // Chờ widget render xong: kết quả ổn định trong settleMs (tối đa timeoutMs)
  async function waitAndRead(opts) {
    opts = opts || {};
    const doc = opts.doc || document, timeout = opts.timeoutMs || 5000, settle = opts.settleMs || 500, step = opts.stepMs || 150;
    const sleep = opts.sleep || (ms => new Promise(r => setTimeout(r, ms)));
    const t0 = Date.now(); let last = read(doc), stableSince = Date.now();
    while (Date.now() - t0 < timeout) {
      if (opts.signal && opts.signal.aborted) break;
      await sleep(step);
      const cur = read(doc);
      if (cur.exercise.fingerprint !== last.exercise.fingerprint) { last = cur; stableSince = Date.now(); }
      else if (Date.now() - stableSince >= settle && last.exercise.widgets.length) break;
    }
    return last;
  }

  K.reader = { read, waitAndRead };
  if (typeof module === 'object' && module.exports) module.exports = K.reader;
})(globalThis);

/* ---- src/reader/diagnose.js ---- */
/* Chẩn đoán: xuất CẤU TRÚC (thẻ, class, role, data-testid) của vùng bài tập để người dùng gửi lại cho nhà phát triển.
 * Không xuất giá trị ô nhập; chỉ kèm chữ ngắn của các nút lá để nhận ra vị trí. */
(function (root) {
  const K = root.KPA || (root.KPA = {});
  const MAX_CHARS = 9000, MAX_NODES = 400;
  const SKIP = new Set(['script', 'style', 'noscript', 'template', 'path', 'g', 'defs']);

  function label(el) {
    const tag = el.tagName.toLowerCase();
    const cls = [...el.classList].filter(c => !/^[a-z]+_[a-z0-9]{5,}$/i.test(c) || /perseus|katex|mq-|widget|input|radio|math/i.test(c)).slice(0, 6);
    const a = [];
    for (const k of ['role', 'data-testid', 'type', 'aria-label', 'contenteditable', 'inputmode']) { const v = el.getAttribute(k); if (v) a.push(k + '=' + String(v).slice(0, 40)); }
    let s = tag + (el.id ? '#' + el.id.slice(0, 30) : '') + (cls.length ? '.' + cls.join('.') : '') + (a.length ? ' [' + a.join(' ') + ']' : '');
    const kids = [...el.children];
    if (!kids.length && !['input', 'textarea', 'select'].includes(tag)) { const t = (el.textContent || '').replace(/\s+/g, ' ').trim(); if (t) s += ' "' + t.slice(0, 40) + '"'; }
    return s;
  }
  const plain = el => !el.id && !el.classList.length && !['role', 'data-testid', 'aria-label'].some(k => el.getAttribute(k));

  function outline(rootEl) {
    const lines = []; let nodes = 0;
    (function walk(el, depth) {
      if (nodes >= MAX_NODES) return;
      const tag = el.tagName.toLowerCase(); if (SKIP.has(tag)) return;
      const kids = [...el.children];
      if (tag === 'div' || tag === 'span') if (plain(el) && kids.length === 1) { walk(kids[0], depth); return; } // gộp lớp bọc vô nghĩa
      nodes++; lines.push('  '.repeat(Math.min(depth, 14)) + label(el));
      if (tag === 'svg' || tag === 'select') return;
      for (const c of kids) walk(c, depth + 1);
    })(rootEl, 0);
    let out = lines.join('\n');
    if (out.length > MAX_CHARS) out = out.slice(0, MAX_CHARS) + '\n…(cắt bớt)';
    return out;
  }
  // Vùng lấy mẫu: phần tử chứa công thức/ô nhập nếu tìm được, ngược lại main/body
  function sampleRoot(doc) {
    const hit = doc.querySelector('[class*="mq-"],[class*="perseus"],.katex');
    if (hit) { let n = hit; for (let i = 0; i < 6 && n.parentElement && n.parentElement !== doc.body; i++) n = n.parentElement; return n; }
    return doc.querySelector('main,[role=main]') || doc.body;
  }
  K.diagnose = { outline, sampleRoot, run: doc => { doc = doc || document; return 'KPA ' + (doc.location ? doc.location.href.split('?')[0] : '') + '\n' + outline(sampleRoot(doc)); } };
  if (typeof module === 'object' && module.exports) module.exports = K.diagnose;
})(globalThis);

/* ---- src/solver/local.js ---- */
/* Bộ giải cục bộ: tính biểu thức, rút gọn/khai triển đa thức 1 biến, giải phương trình bậc 1-2 (nghiệm hữu tỉ).
 * Chạy hoàn toàn trong trình duyệt, không gọi mạng, không dùng eval. Gặp bất cứ điều gì không chắc => trả null (để AI xử lý). */
(function (root) {
  const K = root.KPA || (root.KPA = {});
  class Bail extends Error {}
  const bail = m => { throw new Bail(m); };
  const MAXD = 60, BOX = '\u25A1';

  /* ---------- Số hữu tỉ (BigInt) ---------- */
  const gcd = (a, b) => { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) [a, b] = [b, a % b]; return a; };
  const R = (n, d) => {
    n = BigInt(n); d = d === undefined ? 1n : BigInt(d);
    if (d === 0n) bail('chia cho 0');
    if (d < 0n) { n = -n; d = -d; }
    const g = gcd(n, d) || 1n; n /= g; d /= g;
    if (String(n).length > MAXD || String(d).length > MAXD) bail('số quá lớn');
    return { n, d };
  };
  const ZERO = R(0), ONE = R(1);
  const radd = (a, b) => R(a.n * b.d + b.n * a.d, a.d * b.d);
  const rsub = (a, b) => R(a.n * b.d - b.n * a.d, a.d * b.d);
  const rmul = (a, b) => R(a.n * b.n, a.d * b.d);
  const rdiv = (a, b) => R(a.n * b.d, a.d * b.n);
  const rneg = a => R(-a.n, a.d);
  const rzero = a => a.n === 0n;
  const req = (a, b) => a.n === b.n && a.d === b.d;
  const rcmp = (a, b) => { const x = a.n * b.d, y = b.n * a.d; return x < y ? -1 : x > y ? 1 : 0; };
  function rpow(a, k) {
    if (k < 0) { if (rzero(a)) bail('0 mũ âm'); return rpow(rdiv(ONE, a), -k); }
    let r = ONE, b = a;
    while (k > 0) { if (k & 1) r = rmul(r, b); k >>= 1; if (k) b = rmul(b, b); }
    return r;
  }
  function isqrt(n) {
    if (n < 0n) return null; if (n < 2n) return n;
    let x = BigInt(Math.floor(Math.sqrt(Number(n)))) || 1n;
    for (let i = 0; i < 200; i++) { const y = (x + n / x) >> 1n; if (y === x || y === x + 1n || y === x - 1n) { x = y; break; } x = y; }
    while (x * x > n) x--; while ((x + 1n) * (x + 1n) <= n) x++;
    return x;
  }
  function rsqrt(a) {
    if (a.n < 0n) return null;
    const sn = isqrt(a.n), sd = isqrt(a.d);
    return sn * sn === a.n && sd * sd === a.d ? R(sn, sd) : null;
  }
  const fmtR = r => (r.d === 1n ? String(r.n) : r.n + '/' + r.d);

  /* ---------- Đa thức 1 biến: mảng hệ số theo bậc ---------- */
  const trim = p => { p = p.slice(); while (p.length > 1 && rzero(p[p.length - 1])) p.pop(); return p; };
  const C = r => [r];
  const padd = (a, b) => { const n = Math.max(a.length, b.length), o = []; for (let i = 0; i < n; i++) o.push(radd(a[i] || ZERO, b[i] || ZERO)); return trim(o); };
  const pneg = a => a.map(rneg);
  const psub = (a, b) => padd(a, pneg(b));
  const pmul = (a, b) => {
    const o = Array(a.length + b.length - 1).fill(ZERO);
    for (let i = 0; i < a.length; i++) for (let j = 0; j < b.length; j++) o[i + j] = radd(o[i + j], rmul(a[i], b[j]));
    if (o.length > 9) bail('bậc quá cao');
    return trim(o);
  };
  const deg = p => trim(p).length - 1;
  const isConst = p => deg(p) === 0;
  function ppow(p, k) {
    if (isConst(p)) return C(rpow(p[0], k));
    if (k < 0 || k > 8) bail('mũ không hỗ trợ');
    let r = C(ONE); for (let i = 0; i < k; i++) r = pmul(r, p); return r;
  }
  const peval = (p, x) => { let r = ZERO; for (let i = p.length - 1; i >= 0; i--) r = radd(rmul(r, x), p[i]); return r; };
  const peq = (a, b) => { a = trim(a); b = trim(b); return a.length === b.length && a.every((c, i) => req(c, b[i])); };
  function fmtP(p, v) {
    p = trim(p); const parts = [];
    for (let i = p.length - 1; i >= 0; i--) {
      const c = p[i]; if (rzero(c)) continue;
      const neg = c.n < 0n, a = neg ? rneg(c) : c;
      let body;
      if (i === 0) body = fmtR(a);
      else {
        const x = i === 1 ? v : v + '^' + i;
        body = req(a, ONE) ? x : (a.d === 1n ? String(a.n) : '(' + fmtR(a) + ')') + x;
      }
      parts.push((parts.length ? (neg ? ' - ' : ' + ') : (neg ? '-' : '')) + body);
    }
    return parts.length ? parts.join('') : '0';
  }

  /* ---------- Chuẩn hóa TeX/MathML-text thành chuỗi toán thuần ---------- */
  function norm(s) {
    s = String(s).replace(/\\left|\\right|\\displaystyle|\\textstyle|\\,|\\;|\\!|\\quad|\\ /g, ' ');
    for (let i = 0; i < 6; i++) s = s.replace(/\\[dt]?frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, '($1)/($2)');
    s = s.replace(/\\cdot|\\times|[·×⋅∙]/g, '*').replace(/\\div|÷/g, '/').replace(/[−–—]/g, '-');
    s = s.replace(/\^\s*\{([^{}]*)\}/g, '^($1)').replace(/\{/g, '(').replace(/\}/g, ')');
    if (/[\\%|!√π∞\[\];:<>≤≥≠,]|sqrt|root/i.test(s.replace(/\u25A1/g, ''))) bail('ký hiệu chưa hỗ trợ');
    return s.replace(/\s+/g, ' ').trim();
  }

  /* ---------- Phân tích cú pháp ---------- */
  function tokenize(s) {
    const t = []; let i = 0;
    while (i < s.length) {
      const c = s[i];
      if (c === ' ') { i++; continue; }
      if (/[0-9]/.test(c)) {
        let j = i; while (j < s.length && /[0-9]/.test(s[j])) j++;
        let frac = '';
        if (s[j] === '.') { let k = j + 1; while (k < s.length && /[0-9]/.test(s[k])) k++; if (k === j + 1) bail('số thập phân lỗi'); frac = s.slice(j + 1, k); j = k; }
        t.push({ t: 'n', v: R(BigInt(s.slice(i, j - (frac ? frac.length + 1 : 0)) + frac), 10n ** BigInt(frac.length)) }); i = j; continue;
      }
      if (/[a-zA-Z]/.test(c)) { t.push({ t: 'v', v: c }); i++; continue; }
      if ('+-*/^()'.includes(c)) { t.push({ t: 'o', v: c }); i++; continue; }
      bail('ký tự lạ: ' + c);
    }
    return t;
  }
  function parse(str, ctx) {
    const tk = tokenize(norm(str)); let pos = 0;
    const peek = () => tk[pos], isOp = c => peek() && peek().t === 'o' && peek().v === c;
    function expr() {
      let p = term();
      while (isOp('+') || isOp('-')) { const op = tk[pos++].v; const q = term(); p = op === '+' ? padd(p, q) : psub(p, q); }
      return p;
    }
    function term() {
      let p = unary();
      for (;;) {
        if (isOp('*')) { pos++; p = pmul(p, unary()); }
        else if (isOp('/')) { pos++; const q = unary(); if (!isConst(q) || rzero(q[0])) bail('chia cho biểu thức'); p = pmul(p, C(rdiv(ONE, q[0]))); }
        else if (peek() && (peek().t === 'v' || (peek().t === 'o' && peek().v === '('))) p = pmul(p, power());
        else break;
      }
      return p;
    }
    function unary() {
      if (isOp('-')) { pos++; return pneg(unary()); }
      if (isOp('+')) { pos++; return unary(); }
      return power();
    }
    function power() {
      const b = atom();
      if (isOp('^')) {
        pos++; let e;
        if (isOp('(')) { pos++; const q = expr(); if (!isOp(')')) bail('thiếu )'); pos++; if (!isConst(q) || q[0].d !== 1n) bail('mũ không nguyên'); e = Number(q[0].n); }
        else { let sg = 1; if (isOp('-')) { pos++; sg = -1; } const x = peek(); if (!x || x.t !== 'n' || x.v.d !== 1n) bail('mũ không hợp lệ'); pos++; e = sg * Number(x.v.n); }
        if (Math.abs(e) > 30) bail('mũ quá lớn');
        return ppow(b, e);
      }
      return b;
    }
    function atom() {
      const x = tk[pos++]; if (!x) bail('biểu thức cụt');
      if (x.t === 'n') return C(x.v);
      if (x.t === 'v') { if (ctx.v && ctx.v !== x.v) bail('nhiều biến'); ctx.v = x.v; return [ZERO, ONE]; }
      if (x.v === '(') { const p = expr(); if (!isOp(')')) bail('thiếu )'); pos++; return p; }
      bail('cú pháp');
    }
    const p = expr(); if (pos !== tk.length) bail('còn dư ký tự'); return p;
  }

  /* ---------- Bộ tách đề ---------- */
  const EXCL = /làm tròn|round|nearest|gần nhất|phần trăm|percent|lớn hơn|nhỏ hơn|greater|less than|larger|smaller|lớn nhất|nhỏ nhất|largest|smallest|không phải|\bnot\b|estimate|ước lượng|thập phân|decimal|hỗn số|mixed|scientific|khoa học|đơn vị|\bunits?\b|đồ thị|graph|đúng|sai\b|true|false|so sánh|compare|dấu\b|sign|domain|miền|tập xác định/;
  const KW_SOLVE = /giải|solve|nghiệm|\btìm\s+\$?[a-z]\b|find\s+\$?[a-z]\b|\bfor\s+\$?[a-z]\b|value of\s+\$?[a-z]\b/;
  const KW_EVAL = /tính|evaluate|compute|calculate|giá trị|bằng bao nhiêu|what is|find the value|tìm giá trị/;
  const KW_SIMP = /rút gọn|thu gọn|simplify|expand|khai triển|phân phối|distribute/;
  const KW_EQUIV = /tương đương|equivalent|equal to|bằng với|which (expression|value|number)|biểu thức nào|số nào|giá trị nào/;

  function pieces(text) {
    text = String(text).replace(/\[WIDGET [^\]]*\]|\[ô nhập\]/g, '\u0001');
    const out = []; const re = /\$([^$]*)\$/g; let last = 0, m;
    const addW = s => { s.split('\u0001').forEach((seg, i, a) => { if (seg) out.push({ k: 'w', s: seg }); if (i < a.length - 1) out.push({ k: 'm', s: BOX }); }); };
    while ((m = re.exec(text))) { if (m.index > last) addW(text.slice(last, m.index)); out.push({ k: 'm', s: m[1] }); last = re.lastIndex; }
    if (last < text.length) addW(text.slice(last));
    // gộp "$a$ = □" / "$a$ + $b$": phần chữ chỉ gồm ký hiệu nối giữa hai khối toán
    const merged = [];
    for (let i = 0; i < out.length; i++) {
      const p = out[i], prev = merged[merged.length - 1];
      const left = merged[merged.length - 2];
      const joinable = p.k === 'm' && prev && prev.k === 'w' && left && left.k === 'm' && /^[\s=+\-−×÷*/·^()]+$/.test(prev.s) &&
        (/\S/.test(prev.s) || /[=+\-−×÷*/·^(]\s*$/.test(left.s) || /^\s*[=+\-−×÷*/·^)]/.test(p.s));
      if (joinable) { merged.pop(); merged.pop(); merged.push({ k: 'm', s: left.s + prev.s + p.s }); }
      else merged.push(p);
    }
    // phần "= □" đứng sau khối toán nhưng nằm lẫn trong chữ khác (vd. " = " rồi dấu chấm): đã được gộp ở trên khi cả hai phía là toán
    return merged;
  }

  const isAssign = s => /^[a-zA-Z]\s*=\s*[-+]?[\d./() ]+$/.test(s.replace(/\\frac\s*\{(\d+)\}\s*\{(\d+)\}/g, '$1/$2').replace(/[−–]/g, '-'));
  const hasEq = s => (s.match(/=/g) || []).length;

  function solveEquation(s, ctx) {
    const [l, r] = s.split('=');
    if (!l.trim() || !r.trim()) bail('phương trình thiếu vế');
    const P = psub(parse(l, ctx), parse(r, ctx)), d = deg(P);
    if (!ctx.v) bail('không có biến');
    if (d === 0) bail('vô nghiệm/vô số nghiệm');
    if (d === 1) {
      const root = rdiv(rneg(P[0]), P[1]);
      return { roots: [root], steps: 'Đưa về dạng ' + fmtP(P, ctx.v) + ' = 0, suy ra ' + ctx.v + ' = ' + fmtR(root) + '.' };
    }
    if (d === 2) {
      const [c, b, a] = P, disc = rsub(rmul(b, b), rmul(R(4), rmul(a, c))), sq = rsqrt(disc);
      if (!sq) bail('nghiệm không hữu tỉ');
      const two = rmul(R(2), a), r1 = rdiv(radd(rneg(b), sq), two), r2 = rdiv(rsub(rneg(b), sq), two);
      const roots = (req(r1, r2) ? [r1] : [r1, r2]).sort(rcmp);
      return { roots, steps: 'Đưa về ' + fmtP(P, ctx.v) + ' = 0, Δ = ' + fmtR(disc) + ', nghiệm: ' + roots.map(x => ctx.v + ' = ' + fmtR(x)).join('; ') + '.' };
    }
    bail('bậc > 2');
  }

  /* Trả về nhiệm vụ: { kind:'value', p, v, steps } hoặc { kind:'roots', roots, v, steps } */
  function plan(ex) {
    const text = ex.questionText || '';
    const words = text.replace(/\$[^$]*\$/g, ' ').replace(/\[WIDGET[^\]]*\]|\[ô nhập\]/g, ' ').toLowerCase();
    if (EXCL.test(words)) bail('đề có yêu cầu đặc biệt');
    if (words.split(/\s+/).filter(Boolean).length > 40) bail('đề dài/bài toán lời văn');
    const runs = pieces(text).filter(p => p.k === 'm').map(p => p.s.replace(/\s+/g, ' ').trim()).filter(Boolean);
    if (!runs.length) bail('không có biểu thức');
    const boxRuns = runs.filter(s => s.includes(BOX)), plain = runs.filter(s => !s.includes(BOX) && !/^[a-zA-Z]$/.test(s)); // bỏ các lần nhắc riêng một biến ("giải theo $x$")
    if (boxRuns.length > 1) bail('nhiều ô nhập');

    const wantsSolve = KW_SOLVE.test(words), wantsEval = KW_EVAL.test(words) || KW_SIMP.test(words) || KW_EQUIV.test(words);
    const asValue = (src, steps) => { const ctx = { v: null }; const p = parse(src, ctx); return { kind: 'value', p, v: ctx.v, steps: steps || (norm(src) + ' = ' + fmtP(p, ctx.v || 'x')) }; };
    const subst = (exprSrc, assignSrc) => {
      const [lv, rv] = assignSrc.split('='), c = { v: null }, k = parse(rv, c); if (!isConst(k)) bail('gán không phải hằng');
      const name = lv.trim(); if (!/^[a-zA-Z]$/.test(name)) bail('gán lạ');
      const ctx = { v: null }, p = parse(exprSrc, ctx); if (ctx.v && ctx.v !== name) bail('biến không khớp');
      const val = peval(p, k[0]); return { kind: 'value', p: C(val), v: null, steps: 'Thay ' + name + ' = ' + fmtR(k[0]) + ' vào ' + norm(exprSrc) + ' được ' + fmtR(val) + '.' };
    };
    const fromPlain = (needKw) => {
      const assigns = plain.filter(isAssign), eqs = plain.filter(s => hasEq(s) === 1 && !isAssign(s)), exprs = plain.filter(s => !hasEq(s));
      if (plain.some(s => hasEq(s) > 1)) bail('nhiều dấu =');
      if (eqs.length === 1 && !exprs.length && !assigns.length) { if (!wantsSolve && needKw) bail('chưa rõ yêu cầu giải'); const ctx = { v: null }, r = solveEquation(eqs[0], ctx); return { kind: 'roots', roots: r.roots, v: ctx.v, steps: r.steps }; }
      if (exprs.length === 1 && assigns.length === 1 && !eqs.length) return subst(exprs[0], assigns[0]);
      if (exprs.length === 1 && !eqs.length && !assigns.length) { if (!wantsEval && needKw) bail('chưa rõ yêu cầu tính'); return asValue(exprs[0]); }
      if (assigns.length === 1 && !exprs.length && !eqs.length && wantsSolve) { const ctx = { v: null }, r = solveEquation(assigns[0], ctx); return { kind: 'roots', roots: r.roots, v: ctx.v, steps: r.steps }; }
      bail('không xác định được yêu cầu');
    };

    if (!boxRuns.length) return fromPlain(true);          // trắc nghiệm: chỉ dựa vào biểu thức trong đề
    const br = boxRuns[0].replace(/\s+/g, '');
    let m = /^(.+)=\u25A1$/.exec(br) || /^\u25A1=(.+)$/.exec(br);
    if (m) {
      const L = m[1]; if (L.includes('=')) bail('nhiều dấu =');
      if (/^[a-zA-Z]$/.test(L)) { // "x = □": giải phương trình ở nơi khác
        const t = fromPlain(false); if (t.kind !== 'roots' || t.v !== L) bail('biến không khớp phương trình'); return t;
      }
      const ctx = { v: null }, p = parse(L, ctx);
      if (isConst(p)) return { kind: 'value', p, v: null, steps: norm(L) + ' = ' + fmtR(p[0]) + '.' };
      const asg = plain.filter(isAssign); if (asg.length === 1 && plain.length === 1) return subst(L, asg[0]);
      if (KW_SIMP.test(words)) return { kind: 'value', p, v: ctx.v, steps: 'Rút gọn: ' + fmtP(p, ctx.v) + '.' };
      bail('biểu thức có biến');
    }
    if (br === BOX) return fromPlain(true);               // ô nhập đứng riêng
    bail('dạng ô nhập chưa hỗ trợ');
  }

  /* ---------- Gắn đáp án vào widget ---------- */
  const INPUTS = ['numeric-input', 'input-number', 'expression', 'text-input'];
  function textOfTask(t) { return t.kind === 'roots' ? t.roots.map(fmtR) : [t.v ? fmtP(t.p, t.v) : fmtR(t.p[0])]; }

  function optionMatches(opt, t) {
    let s = norm(String(opt).replace(/\$/g, ' ')); const ctx = { v: null };
    if (/\b(or|and|hoặc|và)\b/i.test(s)) bail('đáp án nhiều phần');
    const eq = s.split('='); if (eq.length > 2) bail('đáp án lạ');
    if (eq.length === 2) { if (!/^[a-zA-Z]$/.test(eq[0].trim())) bail('đáp án lạ'); s = eq[1]; }
    const p = parse(s, ctx);
    if (t.kind === 'roots') return isConst(p) && req(p[0], t.roots[0]);
    if (isConst(p) && isConst(t.p)) return req(p[0], t.p[0]);
    return ctx.v === t.v && peq(p, t.p);
  }

  function solve(ex) {
    try {
      if (!ex || ex.status !== 'ok' || !ex.widgets || ex.widgets.length !== 1) return null;
      const w = ex.widgets[0]; if (w.status !== 'ok') return null;
      const t = plan(ex), vals = textOfTask(t);
      let answer;
      if (INPUTS.includes(w.type)) {
        const n = w.data.fields.length;
        if (t.kind === 'roots' ? t.roots.length !== n : n !== 1) return null;
        answer = { values: vals };
      } else if (w.type === 'radio' || w.type === 'dropdown') {
        if (w.type === 'radio' && w.data.multiple) return null;
        if (t.kind === 'roots' && t.roots.length !== 1) return null;
        const hit = [];
        for (const o of w.data.options) if (optionMatches(o.text, t)) hit.push(o.index);
        if (hit.length !== 1) return null;
        answer = { selected: w.type === 'radio' ? [hit[0]] : hit[0] };
      } else return null;
      return { answers: [{ widgetId: w.id, status: 'answered', answer }], explanation: t.steps + ' (Giải bằng bộ giải cục bộ, không dùng AI.)', confidence: 0.99, local: true };
    } catch (e) { if (e instanceof Bail || e instanceof RangeError) return null; return null; }
  }

  K.localSolver = { solve, _t: { parse, norm, plan, pieces, fmtP, fmtR } };
  if (typeof module === 'object' && module.exports) module.exports = K.localSolver;
})(globalThis);

/* ---- src/ai/promptBuilder.js ---- */
/* Dựng prompt từ JSON đã chuẩn hóa. Mỗi widget kèm định dạng đáp án riêng (lấy từ registry). */
(function (root) {
  const K = root.KPA || (root.KPA = {});
  const MAX_USER_CHARS = 12000;
  const SYSTEM = [
    'You are a careful tutor helping a student check their own practice work. The student will decide what to do on the page.',
    'You receive JSON describing one exercise: questionText (widgets appear as [WIDGET id: type]) and widgets[] with id, type, answerFormat and data.',
    'Solve it only from the provided data. If the data is not enough to be sure, set that widget status to "insufficient_data" instead of guessing.',
    'Return exactly ONE JSON object and nothing else:',
    '{"answers":[{"widgetId":"w1","status":"answered"|"insufficient_data","answer":<object in the widget answerFormat>}],"explanation":"<short explanation in Vietnamese>","confidence":<number 0..1>}',
    'Always refer to options/items/cells by the numeric indexes given in data. Never tell the user to click, type or submit anything automatically.'
  ].join('\n');

  function build(exercise) {
    if (!exercise || exercise.status !== 'ok') return { error: 'Câu hỏi chưa đủ điều kiện để gửi AI.' };
    const REG = K.widgets.REGISTRY;
    const payload = {
      questionText: exercise.questionText,
      widgets: exercise.widgets.map(w => ({ id: w.id, type: w.type, answerFormat: REG[w.type].format, data: w.data }))
    };
    const user = JSON.stringify(payload);
    if (user.length > MAX_USER_CHARS) return { error: 'Câu hỏi quá dài để gửi AI (' + user.length + ' ký tự, giới hạn ' + MAX_USER_CHARS + ').' };
    return { system: SYSTEM, user };
  }

  K.promptBuilder = { build, SYSTEM, MAX_USER_CHARS };
  if (typeof module === 'object' && module.exports) module.exports = K.promptBuilder;
})(globalThis);

/* ---- src/ai/responseParser.js ---- */
/* Phân tích + kiểm tra phản hồi AI. Không tin tưởng đầu ra: mọi chỉ số phải hợp lệ theo dữ liệu đã đọc. */
(function (root) {
  const K = root.KPA || (root.KPA = {});

  function extractJson(text) {
    let s = String(text || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    try { return JSON.parse(s); } catch (_) {}
    const start = s.indexOf('{'); if (start < 0) throw new Error('Không có JSON trong phản hồi AI.');
    let depth = 0, inStr = false, esc = false;
    for (let i = start; i < s.length; i++) {
      const c = s[i];
      if (inStr) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === '"') inStr = false; continue; }
      if (c === '"') inStr = true; else if (c === '{') depth++; else if (c === '}' && --depth === 0) {
        try { return JSON.parse(s.slice(start, i + 1)); } catch (_) { break; }
      }
    }
    throw new Error('AI trả về JSON không hợp lệ.');
  }
  function normConfidence(c) { // chấp nhận số 0..1, 0..100, chuỗi số hoặc nhãn
    if (typeof c === 'number' && isFinite(c)) return Math.min(1, Math.max(0, c > 1 ? c / 100 : c));
    if (typeof c === 'string' && c.trim() !== '' && isFinite(Number(c))) return normConfidence(Number(c));
    const m = { high: .85, medium: .55, low: .25, cao: .85, 'trung bình': .55, thấp: .25 };
    return typeof c === 'string' && m[c.toLowerCase()] != null ? m[c.toLowerCase()] : null;
  }

  function validate(obj, exercise) {
    if (!obj || typeof obj !== 'object' || !Array.isArray(obj.answers)) return { ok: false, errors: ['Thiếu mảng "answers".'] };
    const REG = K.widgets.REGISTRY, results = [], errors = [];
    let needsMoreInfo = !!obj.needsMoreInfo;
    for (const w of exercise.widgets) {
      const a = obj.answers.find(x => x && x.widgetId === w.id);
      if (!a) { errors.push(w.id + ': thiếu đáp án'); continue; }
      if (a.status === 'insufficient_data') { needsMoreInfo = true; results.push({ widgetId: w.id, type: w.type, insufficient: true, lines: [], marks: [] }); continue; }
      const v = REG[w.type].validate(a.answer, w.data);
      if (v.error) { errors.push(w.id + ' (' + w.type + '): ' + v.error); continue; }
      const d = REG[w.type].describe(v.value, w.data);
      results.push({ widgetId: w.id, type: w.type, lines: d.lines, marks: d.marks, table: d.table, experimental: w.experimental });
    }
    if (errors.length) return { ok: false, errors };
    return { ok: true, results, explanation: String(obj.explanation || '').slice(0, 3000), confidence: normConfidence(obj.confidence), needsMoreInfo, local: obj.local === true };
  }

  K.responseParser = { extractJson, validate, normConfidence };
  if (typeof module === 'object' && module.exports) module.exports = K.responseParser;
})(globalThis);

/* ---- src/renderer/suggestionPanel.js ---- */
/* Hiển thị gợi ý. Chỉ dùng textContent/createElement (không innerHTML với nội dung không tin cậy).
 * Chỉ thêm/bỏ một class viền (kpa-mark) trên phần tử phương án; không click, không đổi nội dung, không nhập liệu. */
(function (root) {
  const K = root.KPA || (root.KPA = {});
  const TYPE_VI = { radio: 'Trắc nghiệm', dropdown: 'Danh sách chọn', 'numeric-input': 'Điền số', 'input-number': 'Điền số', expression: 'Biểu thức', 'text-input': 'Ô nhập', table: 'Bảng', matrix: 'Ma trận', orderer: 'Sắp xếp', sorter: 'Sắp xếp', categorizer: 'Phân loại', matcher: 'Ghép cặp' };
  let marked = [];

  const el = (doc, tag, cls, text) => { const e = doc.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

  function buildResultNode(doc, v) {
    const box = el(doc, 'div', 'kpa-results');
    for (const r of v.results) {
      const sec = el(doc, 'section', 'kpa-card');
      sec.append(el(doc, 'strong', '', (TYPE_VI[r.type] || r.type) + ' (' + r.widgetId + ')' + (r.experimental ? ' – thử nghiệm' : '')));
      if (r.insufficient) sec.append(el(doc, 'div', 'kpa-value kpa-warn', 'AI cho biết chưa đủ dữ liệu để trả lời widget này.'));
      else if (r.table) {
        const t = el(doc, 'table', 'kpa-table');
        for (const c of r.table) { const tr = el(doc, 'tr'); tr.append(el(doc, 'td', '', 'Hàng ' + (c.row + 1) + ', cột ' + (c.col + 1)), el(doc, 'td', 'kpa-math', c.value)); t.append(tr); }
        sec.append(t);
      } else for (const line of r.lines) sec.append(el(doc, 'div', 'kpa-value' + (r.type === 'expression' ? ' kpa-math' : ''), '✓ ' + line));
      box.append(sec);
    }
    if (v.explanation) { const s = el(doc, 'section', 'kpa-card'); s.append(el(doc, 'strong', '', 'Giải thích'), el(doc, 'div', 'kpa-value', v.explanation)); box.append(s); }
    if (v.local) box.append(el(doc, 'div', 'kpa-conf', 'Tính trực tiếp bằng bộ giải cục bộ (chính xác, không qua AI).'));
    else if (v.confidence != null) box.append(el(doc, 'div', 'kpa-conf', 'Độ tin cậy (AI tự đánh giá): ' + Math.round(v.confidence * 100) + '%'));
    if (v.needsMoreInfo) box.append(el(doc, 'div', 'kpa-warn', 'Dữ liệu có thể chưa đủ. Hãy tự kiểm tra trước khi dùng gợi ý.'));
    return box;
  }

  function textSummary(v) {
    const parts = [];
    for (const r of v.results) parts.push((TYPE_VI[r.type] || r.type) + ' (' + r.widgetId + '):\n' + (r.table ? r.table.map(c => 'Hàng ' + (c.row + 1) + ', cột ' + (c.col + 1) + ': ' + c.value) : r.lines).join('\n'));
    if (v.explanation) parts.push('Giải thích: ' + v.explanation);
    return parts.join('\n\n');
  }

  function clearMarks() { for (const e of marked) e.classList.remove('kpa-mark'); marked = []; }
  function applyMarks(refs, v) {
    clearMarks();
    for (const r of v.results) for (const i of r.marks || []) { const t = (refs[r.widgetId] || [])[i]; if (t && t.isConnected) { t.classList.add('kpa-mark'); marked.push(t); } }
    return marked.length;
  }

  K.renderer = { buildResultNode, textSummary, applyMarks, clearMarks };
  if (typeof module === 'object' && module.exports) module.exports = K.renderer;
})(globalThis);

/* ---- src/transport/bookmarklet.js ---- */
/* Kênh giao tiếp bản bookmarklet: gọi thẳng OpenRouter từ trang (không có service worker).
 * Key + model lưu trong localStorage của khanacademy.org => script của trang có thể đọc được. Chỉ dùng key hạn mức thấp. */
(function (root) {
  const K = root.KPA || (root.KPA = {});
  const ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';
  const DEFAULT_MODEL = 'openrouter/free', TIMEOUT_MS = 45000, MAX_RETRIES = 2, MAX_TOKENS = 900, MAX_SYSTEM = 4000, MAX_USER = 14000;
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (_) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (_) { return false; } },
    del(k) { try { localStorage.removeItem(k); } catch (_) {} }
  };
  const inflight = new Map();
  const fail = (code, error) => ({ ok: false, code, error });
  const sleep = (ms, signal) => new Promise((res, rej) => { const t = setTimeout(res, ms); signal.addEventListener('abort', () => { clearTimeout(t); rej(new Error('aborted')); }, { once: true }); });

  function statusError(status, detail) {
    const d = String(detail || '').slice(0, 200);
    if (status === 400) return { fatal: true, ...fail('bad_request', 'Yêu cầu bị từ chối (400). Model có thể không hỗ trợ định dạng yêu cầu: ' + d) };
    if (status === 401) return { fatal: true, ...fail('unauthorized', 'API key không đúng hoặc đã bị thu hồi (401).') };
    if (status === 403) return { fatal: true, ...fail('forbidden', 'Key không có quyền dùng model này hoặc nội dung bị chặn (403): ' + d) };
    if (status === 429) return fail('rate_limited', 'Đã vượt giới hạn tốc độ/hạn mức (429). Hãy đợi một lúc hoặc đổi model.');
    if (status >= 500) return fail('server_error', 'Máy chủ OpenRouter đang lỗi (' + status + '). ' + d);
    return { fatal: true, ...fail('http_error', 'Lỗi HTTP ' + status + ': ' + d) };
  }

  async function callOne(P, ctrl, system, user, opts, maxRetries) {
    let jsonMode = true, last;
    {
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        if (ctrl.signal.aborted) return fail('aborted', 'Đã hủy yêu cầu.');
        const ac = new AbortController(); let timedOut = false;
        const onAbort = () => ac.abort(); ctrl.signal.addEventListener('abort', onAbort, { once: true });
        const timer = setTimeout(() => { timedOut = true; ac.abort(); }, TIMEOUT_MS);
        let retryAfter = 0;
        try {
          const body = { model: P.model, temperature: 0.1, max_tokens: opts.maxTokens || MAX_TOKENS, messages: [{ role: 'system', content: system }, { role: 'user', content: user }] };
          if (jsonMode) body.response_format = { type: 'json_object' };
          const res = await fetch(P.url, { method: 'POST', signal: ac.signal, headers: { Authorization: 'Bearer ' + P.key, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
          const data = await res.json().catch(() => ({}));
          if (!res.ok || (data && data.error)) {
            const status = res.ok ? Number(data.error.code) || 500 : res.status, detail = (data && data.error && data.error.message) || '';
            if (status === 400 && jsonMode && /response_format|json/i.test(detail)) { jsonMode = false; continue; }
            retryAfter = Math.min((Number(res.headers.get('retry-after')) || 0) * 1000, 5000);
            const e = statusError(status, detail); if (e.fatal) return e; last = e;
          } else {
            const content = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
            if (content) return { ok: true, result: content };
            last = fail('empty', 'AI không trả về nội dung.');
          }
        } catch (_) {
          if (ctrl.signal.aborted) return fail('aborted', 'Đã hủy yêu cầu.');
          last = timedOut ? fail('timeout', 'Hết thời gian chờ AI (45 giây).')
            : fail('network', 'Lỗi mạng khi gọi ' + P.name + '. Nếu trang chặn kết nối ra ngoài (CSP), hãy dùng bản extension.');
        } finally { clearTimeout(timer); ctrl.signal.removeEventListener('abort', onAbort); }
        if (attempt < maxRetries) { try { await sleep(retryAfter || (opts.backoffMs != null ? opts.backoffMs : 800) * 2 ** attempt, ctrl.signal); } catch (_) { return fail('aborted', 'Đã hủy yêu cầu.'); } }
      }
      return last;
    }
  }

  const hostOf = u => { try { return new URL(u).host; } catch (_) { return u; } };
  function providers() { // OpenRouter (key cũ) + các nhà cung cấp dự phòng tương thích OpenAI (URL|model|key)
    const list = [], key = store.get('kpa_apiKey', '');
    if (key) list.push({ name: 'OpenRouter', url: ENDPOINT, model: store.get('kpa_model', '') || DEFAULT_MODEL, key });
    for (const p of store.get('kpa_providers', [])) if (p && p.url && p.model && p.key) list.push({ name: hostOf(p.url), url: p.url, model: p.model, key: p.key });
    return list;
  }
  let rr = 0; // xoay vòng điểm bắt đầu để dàn đều hạn mức; lỗi/429 thì chuyển sang nhà cung cấp kế tiếp
  async function solve(id, system, user, opts) {
    opts = opts || {};
    const list = providers();
    if (!list.length) return fail('no_key', 'Bộ giải cục bộ không giải được câu này và chưa có API key để hỏi AI. Bấm "Cài đặt API key / model".');
    if (!system || !user || system.length > MAX_SYSTEM || user.length > MAX_USER) return fail('bad_input', 'Dữ liệu câu hỏi trống hoặc quá dài.');
    const ctrl = new AbortController(); inflight.set(id, ctrl);
    try {
      let last; const first = rr++ % list.length;
      for (let i = 0; i < list.length; i++) {
        const r = await callOne(list[(first + i) % list.length], ctrl, system, user, opts, list.length > 1 ? 1 : MAX_RETRIES);
        if (r && r.ok) return r;
        if (r && r.code === 'aborted') return r;
        last = r;
      }
      return last;
    } finally { inflight.delete(id); }
  }

  let box = null; // khối cài đặt trong panel
  function openSettings(ui) {
    if (box) { box.remove(); box = null; return; }
    const mk = ui.mk; box = mk('div', { class: 'kpa-card' });
    const key = mk('input', { type: 'password', autocomplete: 'off', placeholder: 'sk-or-...', 'aria-label': 'OpenRouter API key' });
    const model = mk('input', { type: 'text', placeholder: DEFAULT_MODEL, 'aria-label': 'Model' });
    key.value = store.get('kpa_apiKey', ''); model.value = store.get('kpa_model', '') || '';
    const extra = mk('textarea', { rows: '4', placeholder: 'Dự phòng (mỗi dòng một nhà cung cấp): URL|model|key', 'aria-label': 'Nhà cung cấp dự phòng (URL|model|key)' });
    extra.value = store.get('kpa_providers', []).map(p => [p.url, p.model, p.key].join('|')).join('\n');
    const save = mk('button', { type: 'button', class: 'kpa-small' }, 'Lưu');
    const clear = mk('button', { type: 'button', class: 'kpa-small' }, 'Xóa key');
    box.append(mk('strong', {}, 'Cài đặt'), mk('p', { class: 'kpa-note' }, 'Key lưu trong localStorage của khanacademy.org (trang có thể đọc được). Dùng key có hạn mức thấp, không dùng chung.'), key, model, mk('p', { class: 'kpa-note' }, 'Tùy chọn: thêm nhà cung cấp tương thích OpenAI (Groq, Gemini, Cerebras...) để xoay vòng khi một nơi hết hạn mức. Mỗi dòng: https://.../chat/completions|tên-model|key'), extra, save, clear);
    save.addEventListener('click', () => {
      const k = key.value.trim(), m = model.value.trim();
      if (k && !/^sk-or-[\w-]{10,}$/.test(k)) return ui.setStatus('Key có định dạng không quen thuộc (thường bắt đầu bằng sk-or-).', 'error');
      if (m && !/^[\w.:\-\/]{1,100}$/.test(m)) return ui.setStatus('Tên model không hợp lệ.', 'error');
      const provs = [];
      for (const line of extra.value.split('\n').map(x => x.trim()).filter(Boolean)) {
        const [url, md, ky] = line.split('|').map(x => (x || '').trim());
        if (!/^https:\/\/[^\s|]+$/.test(url || '') || !/^[\w.:\-\/]{1,100}$/.test(md || '') || !ky || /\s/.test(ky)) return ui.setStatus('Dòng nhà cung cấp không hợp lệ: ' + line.slice(0, 40) + '… (cần URL https|model|key)', 'error');
        provs.push({ url, model: md, key: ky });
      }
      store.set('kpa_apiKey', k); store.set('kpa_model', m); store.set('kpa_providers', provs); ui.setStatus('Đã lưu cài đặt (' + provs.length + ' nhà cung cấp dự phòng).', 'ok');
    });
    clear.addEventListener('click', () => { store.del('kpa_apiKey'); store.del('kpa_providers'); key.value = ''; extra.value = ''; ui.setStatus('Đã xóa toàn bộ API key.', 'ok'); });
    ui.body.append(box);
  }

  /* ---- Chế độ tiện ích (Manifest V3): gọi AI qua service worker (không bị CSP của trang, key nằm trong chrome.storage của tiện ích) ---- */
  const EXT = typeof chrome !== 'undefined' && !!(chrome.runtime && chrome.runtime.id);
  const extCall = msg => new Promise(res => {
    try { chrome.runtime.sendMessage(msg, r => { const e = chrome.runtime.lastError; res(e ? fail('ext', 'Không liên lạc được với tiện ích: ' + e.message) : (r || fail('ext', 'Tiện ích không phản hồi.'))); }); }
    catch (e) { res(fail('ext', 'Không liên lạc được với tiện ích: ' + e.message)); }
  });
  function solveExt(id, system, user) {
    if (!system || !user || system.length > MAX_SYSTEM || user.length > MAX_USER) return Promise.resolve(fail('bad_input', 'Dữ liệu câu hỏi trống hoặc quá dài.'));
    return extCall({ type: 'KPA_SOLVE', id, system, user });
  }
  K.transport = EXT ? {
    kind: 'extension', solve: solveExt,
    openSettings: ui => extCall({ type: 'KPA_OPEN_OPTIONS' }).then(r => ui.setStatus(r && r.ok ? 'Đã mở trang cài đặt của tiện ích.' : 'Không mở được trang cài đặt: vào chrome://extensions → Chi tiết → Tùy chọn tiện ích.', r && r.ok ? 'ok' : 'warn')),
    abort: id => { extCall({ type: 'KPA_ABORT', id }); },
    getPrefs: cb => { try { chrome.storage.local.get('kpa_prefs', o => cb((o && o.kpa_prefs) || {})); } catch (_) { cb({}); } },
    setPrefs: p => { try { chrome.storage.local.set({ kpa_prefs: { kpaTheme: p.theme, kpaCollapsed: p.collapsed } }); } catch (_) {} }
  } : {
    kind: 'bookmarklet', solve, openSettings,
    abort: id => { const c = inflight.get(id); if (c) c.abort(); },
    getPrefs: cb => cb(store.get('kpa_prefs', {})),
    setPrefs: p => store.set('kpa_prefs', { kpaTheme: p.theme, kpaCollapsed: p.collapsed })
  };
})(globalThis);

/* ---- src/content.js ---- */
/* Giao diện + điều phối. Chỉ đọc trang và hiển thị gợi ý; không chọn, không nhập, không nộp bài. */
(() => {
  if (window.__KPA_LOADED__) return;
  window.__KPA_LOADED__ = true;
  const K = globalThis.KPA, T = K.transport;
  const st = { open: false, collapsed: false, theme: "auto", seq: 0, reqId: null, busy: false, fp: "", refs: {}, last: null, observer: null, timer: null };

  /* ---------- Dựng giao diện (chỉ DOM API, không innerHTML) ---------- */
  const mk = (tag, attrs = {}, text) => { const e = document.createElement(tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); if (text != null) e.textContent = text; return e; };
  const host = mk("div", { id: "kpa-host" });
  const launch = mk("button", { id: "kpa-launch", type: "button", title: "Mở trợ lý luyện tập" }, "AI");
  const panel = mk("section", { id: "kpa-panel", "aria-label": "Khanware Practice Assistant" }); panel.hidden = true;
  const header = mk("header");
  const title = mk("strong", {}, "Practice Assistant");
  const bTheme = mk("button", { type: "button", "aria-label": "Đổi giao diện sáng/tối", title: "Sáng/Tối" }, "◐");
  const bMin = mk("button", { type: "button", "aria-label": "Thu nhỏ", title: "Thu nhỏ/Mở rộng" }, "–");
  const bClose = mk("button", { id: "kpa-close", type: "button", "aria-label": "Đóng" }, "×");
  header.append(title, bTheme, bMin, bClose);
  const body = mk("div", { class: "kpa-body" });
  body.append(mk("p", { class: "kpa-note" }, "Chỉ đọc nội dung đang hiển thị và gợi ý. Không tự chọn, điền hoặc nộp bài."));
  const bAnalyze = mk("button", { id: "kpa-analyze", type: "button" }, "Phân tích câu hỏi hiện tại");
  const bCopy = mk("button", { id: "kpa-copy", type: "button" }, "Sao chép kết quả"); bCopy.hidden = true;
  const bOpts = mk("button", { id: "kpa-settings", type: "button", class: "kpa-link" }, "Cài đặt API key / model");
  const bDiag = mk("button", { id: "kpa-diag", type: "button", class: "kpa-link" }, "Chẩn đoán (lấy cấu trúc trang để gửi cho dev)");
  const status = mk("div", { id: "kpa-status", role: "status" });
  const result = mk("div", { id: "kpa-result" });
  body.append(bAnalyze, bCopy, status, result, bOpts, bDiag);
  panel.append(header, body); host.append(launch, panel);
  document.documentElement.appendChild(host);

  /* Bộ nhớ đệm kết quả AI theo fingerprint câu hỏi (tối đa 150 mục, lưu localStorage) */
  const CK = "kpa_cache_v1", CMAX = 150;
  const cacheGet = fp => { try { return (JSON.parse(localStorage.getItem(CK) || "{}"))["f" + fp] || null; } catch (_) { return null; } };
  const cachePut = (fp, val) => { try { const o = JSON.parse(localStorage.getItem(CK) || "{}"); delete o["f" + fp]; o["f" + fp] = val; const ks = Object.keys(o); while (ks.length > CMAX) delete o[ks.shift()]; localStorage.setItem(CK, JSON.stringify(o)); } catch (_) {} };
  const setStatus = (msg, kind) => { status.textContent = msg; status.dataset.kind = kind || ""; };

  /* ---------- Tùy chọn giao diện (chrome.storage.sync: chỉ lưu theme/thu nhỏ, KHÔNG lưu key) ---------- */
  function applyTheme() {
    host.dataset.theme = st.theme === "auto" ? ((window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches) ? "dark" : "light") : st.theme;
    panel.classList.toggle("kpa-collapsed", st.collapsed);
    bMin.textContent = st.collapsed ? "+" : "–";
  }
  T.getPrefs(v => { st.theme = v.kpaTheme || "auto"; st.collapsed = !!v.kpaCollapsed; applyTheme(); });
  const savePrefs = () => T.setPrefs({ theme: st.theme, collapsed: st.collapsed });

  /* ---------- Hủy / làm sạch ---------- */
  function cancelPending() {
    st.seq++;
    if (st.reqId) { T.abort(st.reqId); st.reqId = null; }
    st.busy = false; bAnalyze.disabled = false;
  }
  function clearResult() { result.replaceChildren(); bCopy.hidden = true; st.last = null; st.refs = {}; K.renderer.clearMarks(); }

  /* ---------- Phân tích ---------- */
  async function analyze() {
    cancelPending(); clearResult();
    const my = st.seq; st.busy = true; bAnalyze.disabled = true;
    try {
      setStatus("Đang đọc câu hỏi…", "busy");
      const read = await K.reader.waitAndRead({ timeoutMs: 5000, settleMs: 500 });
      if (my !== st.seq) return;
      const ex = read.exercise; st.fp = ex.fingerprint;
      if (ex.status !== "ok") { // không đoán: báo rõ lý do
        setStatus((ex.status === "unsupported" ? "Chưa hỗ trợ: " : "Chưa đủ dữ liệu: ") + ex.reason, "warn");
        return;
      }
      let v = null, via = "";
      const loc = K.localSolver && K.localSolver.solve(ex); // tầng 0: tính trực tiếp, không mạng, không giới hạn
      if (loc) { const lv = K.responseParser.validate(loc, ex); if (lv.ok) { v = lv; via = "local"; } }
      if (!v) { const hit = cacheGet(ex.fingerprint); if (hit) { const cv = K.responseParser.validate(hit, ex); if (cv.ok) { v = cv; via = "cache"; } } } // tầng 1: đã hỏi AI trước đó
      if (!v) { // tầng 2: hỏi AI (xoay vòng nhà cung cấp)
        const prompt = K.promptBuilder.build(ex);
        if (prompt.error) { setStatus(prompt.error, "warn"); return; }
        st.reqId = "kpa-" + Date.now() + "-" + my;
        setStatus("Đang hỏi AI… (có thể hủy bằng cách chuyển câu hỏi)", "busy");
        const res = await T.solve(st.reqId, prompt.system, prompt.user);
        if (my !== st.seq) return; // đã đổi câu / hủy
        st.reqId = null;
        if (!res?.ok) throw new Error(res?.error || "Không nhận được phản hồi từ tiện ích.");
        let parsed; try { parsed = K.responseParser.extractJson(res.result); } catch (e) { throw new Error(e.message + " Hãy thử lại hoặc đổi model."); }
        v = K.responseParser.validate(parsed, ex);
        if (!v.ok) throw new Error("Phản hồi AI không khớp dữ liệu câu hỏi (" + v.errors.join("; ") + "). Bấm phân tích lại.");
        cachePut(ex.fingerprint, parsed); via = "ai";
      }
      // chống race: câu hỏi phải còn nguyên như lúc gửi
      if (K.reader.read().exercise.fingerprint !== ex.fingerprint) { setStatus("Câu hỏi đã thay đổi trong lúc chờ AI. Bấm phân tích lại.", "warn"); return; }
      st.last = v; st.refs = read.refs;
      result.append(K.renderer.buildResultNode(document, v));
      K.renderer.applyMarks(read.refs, v);
      bCopy.hidden = false; bAnalyze.textContent = "Phân tích lại";
      setStatus((via === "local" ? "Đã giải bằng bộ giải cục bộ (không dùng API). " : via === "cache" ? "Lấy từ bộ nhớ đệm (không tốn lượt AI). " : "Đã có gợi ý từ AI. ") + "Bạn tự quyết định thao tác trên bài tập.", "ok");
    } catch (e) {
      if (my === st.seq) setStatus(e.message, "error");
    } finally { if (my === st.seq) { st.busy = false; bAnalyze.disabled = false; st.reqId = null; } }
  }

  /* ---------- Theo dõi đổi câu hỏi (chỉ khi panel mở; debounce; ngắt khi đóng) ---------- */
  function onMutations(list) {
    if (list.every(m => host.contains(m.target))) return;
    clearTimeout(st.timer);
    st.timer = setTimeout(() => {
      if (!st.open || !st.fp) return;
      let fp; try { fp = K.reader.read().exercise.fingerprint; } catch (_) { return; }
      if (fp !== st.fp) { cancelPending(); clearResult(); st.fp = ""; bAnalyze.textContent = "Phân tích câu hỏi hiện tại"; setStatus("Câu hỏi đã thay đổi. Bấm phân tích để nhận gợi ý mới.", ""); }
    }, 500);
  }
  function startObserver() { if (st.observer) return; st.observer = new MutationObserver(onMutations); st.observer.observe(document.body, { childList: true, subtree: true }); }
  function stopObserver() { st.observer?.disconnect(); st.observer = null; clearTimeout(st.timer); }

  /* ---------- Sự kiện (đăng ký đúng một lần) ---------- */
  launch.addEventListener("click", () => { st.open = true; panel.hidden = false; startObserver(); });
  bClose.addEventListener("click", () => { st.open = false; panel.hidden = true; stopObserver(); cancelPending(); K.renderer.clearMarks(); });
  bMin.addEventListener("click", () => { st.collapsed = !st.collapsed; applyTheme(); savePrefs(); });
  bTheme.addEventListener("click", () => { st.theme = host.dataset.theme === "dark" ? "light" : "dark"; applyTheme(); savePrefs(); });
  bAnalyze.addEventListener("click", analyze);
  bCopy.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(K.renderer.textSummary(st.last)); setStatus("Đã sao chép kết quả.", "ok"); }
    catch (_) { setStatus("Không sao chép được (trình duyệt chặn clipboard).", "error"); }
  });
  bOpts.addEventListener("click", () => T.openSettings({ mk, body, setStatus }));
  bDiag.addEventListener("click", async () => {
    clearResult();
    const text = K.diagnose.run(document), ta = mk("textarea", { readonly: "", "aria-label": "Cấu trúc trang" }); ta.value = text; ta.rows = 10;
    result.append(ta); ta.focus(); ta.select();
    try { await navigator.clipboard.writeText(text); setStatus("Đã sao chép cấu trúc trang. Dán vào cuộc trò chuyện để gửi cho dev.", "ok"); }
    catch (_) { setStatus("Không tự sao chép được: nhấn giữ trong khung để chọn tất cả rồi sao chép.", "warn"); }
  });
  window.__KPA_OPEN__ = () => { st.open = true; panel.hidden = false; startObserver(); };
  addEventListener("pagehide", () => { stopObserver(); cancelPending(); });
})();

})();

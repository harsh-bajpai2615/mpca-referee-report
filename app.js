const STORE = 'mpcaRR.v1';
const { PDFDocument, StandardFonts, rgb, LineCapStyle } = PDFLib;
const INK = rgb(0.02, 0.13, 0.45);
const BAD = new Set(BAD_WORDS);
const NON_PRINTABLE = /[^\x20-\x7E\xA0-\xFF‘’“”–—…\n\r\t]/;

let V = load();
let revealed = new Set();

function load() {
  let v = {};
  try { v = JSON.parse(localStorage.getItem(STORE)) || {}; } catch {}
  if (!v.signature && typeof DEFAULT_SIGNATURE === 'string') v.signature = DEFAULT_SIGNATURE;
  return v;
}
function save() {
  try { localStorage.setItem(STORE, JSON.stringify(V)); } catch {}
}

const $ = id => document.getElementById(id);
const el = (tag, attrs = {}, ...kids) => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') n.className = v;
    else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
    else if (v !== undefined && v !== null && v !== false) n.setAttribute(k, v === true ? '' : v);
  }
  for (const k of kids.flat()) if (k != null && k !== false) n.append(k);
  return n;
};
const shown = cond => !cond || [].concat(cond[1]).includes(V[cond[0]]);
const steps = () => SECTIONS.filter(s => shown(s.showIf));
for (const s of SECTIONS) {
  let g = null;
  for (const f of s.fields) { if (f.group) g = f; f.under = g; }
}
const allFields = () => SECTIONS.flatMap(s => s.fields.map(f => ({ ...f, section: s })));
// "Team 2: Bhopal" for a field called "Rating", the field's own label otherwise
const nameOf = f => (f.under && ['Rating', 'Hotel', 'Reason/s'].includes(f.label) ? groupLabel(f.under) : f.label);
const filled = f => f.type === 'pair' ? !!(V[`${f.id}A`] || '').trim() : !!(V[f.id] || '').trim();

function title(s) {
  if (s.teamRef && V[s.teamRef]) return `${s.title}: ${V[s.teamRef]}`;
  return s.title;
}

function badRatingsFor(f) {
  return allFields().filter(g => g.type === 'choice' && f.reasonFor.test(g.id) && BAD.has(V[g.id]) && shown(g.section.showIf));
}

// fields a step still needs, a reason box only when something it covers is rated bad
function required(s) {
  return s.fields.filter(f => shown(f.showIf) && (f.reasonFor ? badRatingsFor(f).length > 0 : !f.optional));
}
function status(s) {
  const req = required(s);
  const done = req.filter(filled).length;
  const any = s.fields.some(filled);
  return { done, total: req.length, complete: done === req.length && (any || req.length === 0), started: any };
}

// ---------- routing ----------

function route() {
  const [, view, id] = location.hash.split('/');
  document.querySelectorAll('dialog[open]').forEach(d => d.close());
  $('home').hidden = $('step').hidden = $('finish').hidden = true;
  if (view === 'step' && steps().some(s => s.id === id)) renderStep(id);
  else if (view === 'finish') renderFinish();
  else renderHome();
  window.scrollTo(0, 0);
}
const go = hash => { if (location.hash === hash) route(); else location.hash = hash; };

// ---------- home ----------

function renderHome() {
  const v = $('home');
  v.hidden = false;
  const list = steps();
  const st = list.map(status);
  const doneCount = st.filter(x => x.complete).length;
  const next = list.find((s, i) => !st[i].complete);

  const teams = V.team1 && V.team2;
  const card = el('div', { class: 'match-card' },
    el('p', { class: 'eyebrow on-dark' }, [V.format, V.segment].filter(Boolean).join(' · ') || 'New match'),
    el('p', { class: 'match-title' }, teams ? `${V.team1} vs ${V.team2}` : 'Start with the match details'),
    teams ? el('p', { class: 'match-sub' }, [V.ground, V.dates].filter(Boolean).join(' · ')) : null,
    el('div', { class: 'meter', role: 'progressbar', 'aria-label': 'Steps done', 'aria-valuemin': 0, 'aria-valuemax': list.length, 'aria-valuenow': doneCount },
      el('span', { style: `width:${(doneCount / list.length) * 100}%` })),
    el('p', { class: 'match-sub' }, `${doneCount} of ${list.length} steps done`));

  const rows = el('ol', { class: 'steps' }, list.map((s, i) => {
    const x = st[i];
    return el('li', {}, el('a', { href: `#/step/${s.id}`, class: `step-row${x.complete ? ' is-done' : ''}` },
      el('span', { class: 'step-mark', 'aria-hidden': 'true' }, x.complete ? checkIcon() : String(i + 1)),
      el('span', { class: 'step-text' },
        el('span', { class: 'step-name' }, title(s)),
        el('span', { class: 'step-state' }, x.complete ? 'Done' : x.started ? `${x.done} of ${x.total} filled` : 'Not started')),
      chevron()));
  }));

  v.replaceChildren(
    el('header', { class: 'home-head' },
      el('p', { class: 'eyebrow' }, 'MPCA 2026-27'),
      el('h1', {}, 'Referee report'),
      el('p', { class: 'lede', lang: 'hi' }, 'हर स्टेप में ऊपर फ़ॉर्म का वही हिस्सा दिखेगा जो आप भर रहे हैं।')),
    card, rows,
    el('div', { class: 'home-foot' },
      el('button', { type: 'button', class: 'link danger', onclick: () => $('new-dialog').showModal() }, 'Start a new match'),
      el('p', { class: 'fine' }, 'Answers save on this phone as you type.')));

  setBar(next
    ? [el('button', { type: 'button', class: 'pill primary', onclick: () => go(`#/step/${next.id}`) }, st.some(x => x.started) ? `Continue: ${title(next)}` : 'Start'),
       el('button', { type: 'button', class: 'link', onclick: () => go('#/finish') }, 'Make the PDF now')]
    : [el('button', { type: 'button', class: 'pill primary', onclick: () => go('#/finish') }, 'Make the PDF')]);
}

// ---------- step ----------

function renderStep(id) {
  const list = steps();
  const i = list.findIndex(s => s.id === id);
  const s = list[i];
  const v = $('step');
  v.hidden = false;

  const snip = el('button', { type: 'button', class: 'snip', 'aria-label': `Show this part of the form, page ${s.page}, larger`, onclick: () => zoom(s.snip) },
    el('span', { class: 'snip-tag' }, el('span', {}, `On the form, page ${s.page}`), el('span', { class: 'snip-zoom' }, 'Tap to enlarge')),
    el('img', { src: `snips/${s.snip}.webp`, alt: `Part of the MPCA form, page ${s.page}`, decoding: 'async' }));

  const notes = s.notes ? el('details', { class: 'notes' },
    el('summary', {}, 'Pitch notes printed on the form'),
    el('img', { src: `snips/${s.notes}.webp`, alt: 'Explanatory notes for pitch assessment from the form', loading: 'lazy' })) : null;

  const body = el('div', { class: 'fields' });
  for (const f of s.fields) {
    if (f.group) body.append(el('h2', { class: 'group' }, groupLabel(f)));
    body.append(fieldNode(f));
  }
  const more = s.fields.filter(f => f.more);
  if (more.length) {
    body.append(el('button', { type: 'button', class: 'link add', id: 'add-more', onclick: () => {
      const f = more.find(g => $(`fw-${g.id}`).hidden);
      if (f) { revealed.add(f.id); $(`fw-${f.id}`).hidden = false; $(`f-${f.id}A`).focus(); }
      $('add-more').hidden = !more.some(g => $(`fw-${g.id}`).hidden);
    } }, '+ Add another selector'));
  }

  v.replaceChildren(
    el('header', { class: 'step-head' },
      el('a', { href: '#/', class: 'back' }, chevron(true), 'All steps'),
      el('span', { class: 'count' }, `${i + 1} of ${list.length}`)),
    el('div', { class: 'step-title' },
      s.num ? el('p', { class: 'eyebrow' }, `Section ${s.num}`) : null,
      el('h1', {}, title(s)),
      s.hi ? el('p', { class: 'lede', lang: 'hi' }, s.hi) : null),
    ...[snip, notes, body].filter(Boolean));

  for (const f of more) $(`fw-${f.id}`).hidden = !(filled(f) || revealed.has(f.id));
  if (more.length) $('add-more').hidden = !more.some(g => $(`fw-${g.id}`).hidden);
  refreshStep(s);

  const prev = list[i - 1], next = list[i + 1];
  setBar([
    el('button', { type: 'button', class: 'pill ghost', onclick: () => go(prev ? `#/step/${prev.id}` : '#/') }, 'Back'),
    el('button', { type: 'button', class: 'pill primary', onclick: () => go(next ? `#/step/${next.id}` : '#/finish') }, next ? 'Next' : 'Finish'),
  ], 'split');
}

function groupLabel(f) {
  const team = f.teamLabel && V[f.teamLabel];
  return team ? `${f.group}: ${team}` : f.group;
}

function fieldNode(f) {
  const warn = el('p', { class: 'warn', id: `w-${f.id}`, hidden: true });
  const hint = f.hint ? el('p', { class: 'hint' }, f.hint) : null;
  let body;
  if (f.type === 'choice') {
    const longest = Math.max(...f.opts.map(o => o.length));
    const total = f.opts.reduce((n, o) => n + o.length, 0);
    const seg = !f.chips && f.opts.length > 1 && f.opts.length <= 4 && total <= 30;
    body = el('div', { class: seg ? 'seg' : 'chips', role: 'group', 'aria-labelledby': `l-${f.id}`, style: seg ? `--n:${f.opts.length}` : `--min:${longest * 9 + 36}px` },
      f.opts.map(o => el('button', {
        type: 'button', 'aria-pressed': String(V[f.id] === o),
        onclick: e => {
          V[f.id] = V[f.id] === o ? '' : o;
          e.currentTarget.parentNode.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.textContent === V[f.id])));
          changed(f);
        },
      }, o)));
  } else if (f.type === 'pair') {
    body = el('div', { class: 'pair' }, input(f, `${f.id}A`, f.a), input(f, `${f.id}B`, f.b));
  } else if (f.type === 'sign') {
    body = signaturePad();
  } else {
    body = input(f, f.id, f.placeholder);
  }
  const suffix = f.suffix ? el('p', { class: 'hint' }, `Printed before “${f.suffix}”`) : null;
  return el('div', { class: `field t-${f.type}`, id: `fw-${f.id}`, hidden: !shown(f.showIf) },
    el('label', { class: 'label', id: `l-${f.id}`, for: f.type === 'choice' || f.type === 'sign' ? null : `f-${f.id}${f.type === 'pair' ? 'A' : ''}` }, f.label),
    hint, suffix, body,
    f.list ? el('datalist', { id: `dl-${f.id}` }, f.list.map(o => el('option', { value: o }))) : null,
    warn);
}

function input(f, key, placeholder) {
  const attrs = {
    id: `f-${key}`, placeholder, inputmode: f.inputmode, autocomplete: 'off', autocapitalize: 'words', list: f.list ? `dl-${f.id}` : null,
    'aria-label': f.type === 'pair' ? `${f.label} ${placeholder}` : null,
    oninput: e => { V[key] = e.target.value; changed(f); },
  };
  const n = f.type === 'area' ? el('textarea', { ...attrs, rows: 4, autocapitalize: 'sentences' }) : el('input', { ...attrs, type: 'text' });
  n.value = V[key] || '';
  return n;
}

function changed(f) {
  save();
  const s = SECTIONS.find(x => x.fields.some(g => g.id === f.id));
  for (const g of s.fields) {
    const w = $(`fw-${g.id}`);
    if (w && g.showIf) w.hidden = !shown(g.showIf);
  }
  refreshStep(s);
}

function refreshStep(s) {
  for (const f of s.fields) {
    let msg = '';
    const vals = [V[f.id], V[`${f.id}A`], V[`${f.id}B`]];
    if (vals.some(x => NON_PRINTABLE.test(x || ''))) msg = 'Please type in English. The PDF cannot print Hindi letters.';
    else if (f.reasonFor && !(V[f.id] || '').trim()) {
      const bad = badRatingsFor(f);
      if (bad.length) msg = `Needed, because ${bad.map(b => `${nameOf(b)} is marked ${V[b.id]}`).join(', ')}.`;
    }
    const w = $(`w-${f.id}`);
    if (w) { w.textContent = msg; w.hidden = !msg; }
  }
}

function setBar(kids, mode = '') {
  $('bar').className = `bar ${mode}`;
  $('bar').replaceChildren(el('div', { class: 'bar-in' }, ...kids));
}

function zoom(name) {
  $('zoom-frame').replaceChildren(el('img', { src: `snips/${name}.webp`, alt: 'Part of the MPCA form, larger' }));
  $('zoom').showModal();
}

const svg = (d, cls) => {
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('aria-hidden', 'true'); s.setAttribute('class', cls);
  const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  p.setAttribute('d', d); s.append(p);
  return s;
};
const chevron = left => svg(left ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7', 'chev');
const checkIcon = () => svg('M5 12.5l4.5 4.5L19 7.5', 'tick');

// ---------- signature ----------

function signaturePad() {
  const c = el('canvas', { class: 'sig', width: 900, height: 300, 'aria-label': 'Signature pad' });
  const g = c.getContext('2d');
  const paint = () => {
    g.clearRect(0, 0, c.width, c.height);
    if (!V.signature) return;
    const img = new Image();
    img.onload = () => {
      const k = Math.min(c.width / img.width, c.height / img.height, 1);
      g.drawImage(img, (c.width - img.width * k) / 2, (c.height - img.height * k) / 2, img.width * k, img.height * k);
    };
    img.src = V.signature;
  };
  let drawing = false, fresh = true;
  const pt = e => { const r = c.getBoundingClientRect(); return [(e.clientX - r.left) * c.width / r.width, (e.clientY - r.top) * c.height / r.height]; };
  c.addEventListener('pointerdown', e => {
    if (fresh && V.signature) g.clearRect(0, 0, c.width, c.height);
    fresh = false; drawing = true; c.setPointerCapture(e.pointerId);
    g.lineWidth = 7; g.lineCap = g.lineJoin = 'round'; g.strokeStyle = '#0a2a73';
    g.beginPath(); g.moveTo(...pt(e));
  });
  c.addEventListener('pointermove', e => { if (drawing) { g.lineTo(...pt(e)); g.stroke(); } });
  const end = () => { if (!drawing) return; drawing = false; V.signature = trimmed(c); save(); };
  c.addEventListener('pointerup', end);
  c.addEventListener('pointercancel', end);
  paint();
  return el('div', { class: 'sig-wrap' }, c,
    el('button', { type: 'button', class: 'link', onclick: () => { V.signature = ''; fresh = true; save(); paint(); } }, 'Clear and sign again'));
}

function trimmed(c) {
  const { data, width, height } = c.getContext('2d').getImageData(0, 0, c.width, c.height);
  let x0 = width, y0 = height, x1 = -1, y1 = -1;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    if (data[(y * width + x) * 4 + 3] > 10) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  if (x1 < 0) return '';
  const pad = 6, out = document.createElement('canvas');
  out.width = x1 - x0 + pad * 2; out.height = y1 - y0 + pad * 2;
  out.getContext('2d').drawImage(c, x0 - pad, y0 - pad, out.width, out.height, 0, 0, out.width, out.height);
  return out.toDataURL('image/png');
}

// ---------- finish ----------

let ready = null;

function renderFinish() {
  const v = $('finish');
  v.hidden = false;
  const issues = checks();
  v.replaceChildren(
    el('header', { class: 'step-head' }, el('a', { href: '#/', class: 'back' }, chevron(true), 'All steps')),
    el('div', { class: 'step-title' },
      el('h1', {}, 'Your report'),
      el('p', { class: 'lede', lang: 'hi' }, 'PDF बन रही है। फिर WhatsApp या Mail से भेजें।')),
    el('div', { class: 'file' },
      el('span', { class: 'file-icon', 'aria-hidden': 'true' }, 'PDF'),
      el('span', { class: 'file-text' }, el('span', { class: 'file-name' }, fileName()), el('span', { class: 'fine', id: 'prep' }, 'Making the PDF...'))),
    issues.length ? el('div', { class: 'issues' },
      el('h2', { class: 'group' }, 'Worth a look before sending'),
      el('ul', {}, issues.map(([t, step]) => el('li', {}, el('span', {}, t), step ? el('a', { href: `#/step/${step}`, class: 'link' }, 'Fix') : null)))) : null,
    el('div', { class: 'send-note' },
      el('h2', { class: 'group' }, 'Send within 72 hours to'),
      el('p', {}, 'cricket.operations@mpcaonline.com'),
      el('p', {}, 'moreports@mpcaonline.com'),
      el('p', { class: 'fine' }, 'or in a sealed envelope to the MPCA office')));
  setBar([
    el('button', { type: 'button', class: 'pill ghost act', disabled: true, onclick: downloadPdf }, 'Save to Files'),
    el('button', { type: 'button', class: 'pill primary act', disabled: true, onclick: sharePdf }, 'Share'),
  ], 'split');
  prepare();
}

function checks() {
  const out = [];
  if (!V.format) out.push(['Format is not chosen, so no pitch page will be filled.', 'match']);
  if (!V.refName) out.push(["Referee's name is empty.", 'match']);
  for (const s of steps()) {
    for (const f of s.fields) if (f.reasonFor && badRatingsFor(f).length && !(V[f.id] || '').trim()) out.push([`${title(s)}: the reason box is empty but something is marked bad.`, s.id]);
  }
  for (const s of steps()) {
    for (const f of s.fields) {
      if ([V[f.id], V[`${f.id}A`], V[`${f.id}B`]].some(x => NON_PRINTABLE.test(x || ''))) out.push([`${title(s)}: ${f.label} has Hindi letters the PDF cannot print.`, s.id]);
    }
  }
  if (!V.signature) out.push(['No signature yet. Sign in the app, or by hand after printing.', 'sign']);
  return out;
}

async function prepare() {
  ready = null;
  try {
    const bytes = await buildPdf();
    ready = new File([bytes], fileName(), { type: 'application/pdf' });
    if ($('prep')) $('prep').textContent = 'Ready to send';
    document.querySelectorAll('.act').forEach(b => (b.disabled = false));
  } catch (e) {
    if ($('prep')) $('prep').textContent = `Could not make the PDF: ${e.message}`;
  }
}

// Safari only allows share() straight after a tap, so the file is built before the tap
function sharePdf() {
  if (!ready) return;
  if (navigator.canShare && navigator.canShare({ files: [ready] })) {
    navigator.share({ files: [ready], title: ready.name })
      .then(() => { $('prep').textContent = 'Shared'; })
      .catch(e => { if (e.name !== 'AbortError') $('prep').textContent = `Could not share: ${e.message}`; });
  } else {
    downloadPdf();
  }
}

function downloadPdf() {
  if (!ready) return;
  const a = el('a', { href: URL.createObjectURL(ready), download: ready.name });
  document.body.append(a); a.click(); a.remove();
}

function newMatch() {
  V = Object.fromEntries(allFields().filter(f => f.keep).map(f => [f.id, V[f.id]]));
  revealed = new Set();
  save();
  $('new-dialog').close();
  go('#/');
}

// ---------- PDF ----------

function fileName() {
  const cat = (V.category || '').split(' ')[0];
  const fmt = (FORMATS.find(f => f[1] === V.format) || [''])[0];
  const no = (V.matchNo || '').replace(/\D/g, '');
  return no && cat && fmt ? `${no}${cat}${fmt}RVR.pdf` : 'Referee Report.pdf';
}

async function buildPdf() {
  const doc = await PDFDocument.load(await (await fetch('form.pdf')).arrayBuffer());
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const pages = doc.getPages();
  const H = pages[0].getHeight();
  const chars = new Set(font.getCharacterSet());
  const clean = s => [...String(s || '').replace(/\r/g, '').replace(/\t/g, ' ')].filter(ch => ch === '\n' || chars.has(ch.codePointAt(0))).join('').trim();
  const width = (s, size) => font.widthOfTextAtSize(s, size);
  const write = (p, s, x, base, size) => pages[p - 1].drawText(s, { x, y: H - base, size, font, color: INK });

  function wrap(text, w, size) {
    const lines = [];
    for (const para of text.split('\n')) {
      let line = '';
      for (let word of para.split(/ +/)) {
        while (width(word, size) > w) {
          let i = word.length;
          while (i > 1 && width((line ? line + ' ' : '') + word.slice(0, i), size) > w) i--;
          if (i <= 1 && line) { lines.push(line); line = ''; continue; }
          lines.push((line ? line + ' ' : '') + word.slice(0, i)); line = ''; word = word.slice(i);
        }
        const t = line ? `${line} ${word}` : word;
        if (width(t, size) <= w) line = t; else { lines.push(line); line = word; }
      }
      lines.push(line);
    }
    return lines;
  }

  const shrink = (s, w, size) => Math.min(size, size * w / width(s, size));

  // stacked lines inside [top, bottom], last baseline near the bottom
  function stack(p, s, x, w, top, bottom, max, min) {
    for (let size = max; size >= min; size -= 0.25) {
      const lines = wrap(s, w, size), lead = size * 1.1, last = bottom - size * 0.2;
      if (lines.length > 1 && lines.every(l => width(l, size) <= w) && last - (lines.length - 1) * lead - size * 0.72 >= top) {
        lines.forEach((l, i) => write(p, l, x, last - (lines.length - 1 - i) * lead, size));
        return true;
      }
    }
    return false;
  }

  function text(pl, s) {
    if (!s) return;
    if (pl.box) return box(pl, s);
    if (pl.cell) return cell(pl, s);
    const one = s.replace(/\n+/g, ', ');
    for (let size = pl.size || 9; size >= 6; size -= 0.25) {
      if (width(one, size) <= pl.w) return write(pl.p, one, pl.x, pl.b, size);
    }
    const [top, bottom] = pl.room || [pl.b - 10, pl.b + 1];
    if (stack(pl.p, one, pl.x, pl.w, top, bottom, 7, 4.5)) return;
    write(pl.p, one, pl.x, pl.b, shrink(one, pl.w, 6));
  }

  function cell(pl, s) {
    const [x0, y0, x1, y1] = pl.cell, pad = 3, w = x1 - x0 - pad * 2, m = (y0 + y1) / 2;
    const one = s.replace(/\n+/g, ', ');
    for (let size = 9; size >= 7; size -= 0.25) {
      if (width(one, size) <= w) return write(pl.p, one, x0 + pad, m + size * 0.35, size);
    }
    if (y1 - y0 >= 18) {
      for (let size = 8; size >= 6; size -= 0.25) {
        const lines = wrap(one, w, size), lead = size * 1.1;
        if (lines.length <= 2 && size * 2.2 <= y1 - y0) {
          lines.forEach((l, i) => write(pl.p, l, x0 + pad, m - lead / 2 + size * 0.35 + i * lead, size));
          return;
        }
      }
    }
    for (let size = 7; size >= 6; size -= 0.25) {
      if (width(one, size) <= w) return write(pl.p, one, x0 + pad, m + size * 0.35, size);
    }
    if (stack(pl.p, one, x0 + pad, w, y0 + 1, y1 - 1, 6, 4)) return;
    const size = shrink(one, w, 6);
    write(pl.p, one, x0 + pad, m + size * 0.35, size);
  }

  function box(pl, s) {
    const [x0, y0, x1, y1] = pl.box, pad = pl.pad ?? 4, w = x1 - x0 - pad * 2, h = y1 - y0 - pad * 2;
    for (let size = 9.5; size >= 1; size -= 0.25) {
      const lines = wrap(s, w, size), lead = size * 1.2;
      if (lines.length * lead <= h + size * 0.25) {
        lines.forEach((l, i) => write(pl.p, l, x0 + pad, y0 + pad + size * 0.85 + i * lead, size));
        return;
      }
    }
  }

  function mark(m) {
    const page = pages[m.p - 1];
    if (m.tick) {
      const [cx, cy] = m.tick, s = 8, k = s / 10;
      page.drawSvgPath('M 1 5.2 L 4 8.4 L 9.4 1.2', {
        x: cx - s / 2, y: H - (cy - s / 2) + 0.4, scale: k, borderColor: INK, borderWidth: 1.5 / k,
        borderLineCap: LineCapStyle ? LineCapStyle.Round : undefined,
      });
    } else if (m.oval) {
      const [x0, y0, x1, y1] = m.oval;
      page.drawEllipse({ x: (x0 + x1) / 2, y: H - (y0 + y1) / 2 - 0.3, xScale: (x1 - x0) / 2 + 2.2, yScale: (y1 - y0) / 2 + 2.4, borderColor: INK, borderWidth: 0.9 });
    }
  }

  const pitchPage = V.format === 'Multi-day' ? 6 : V.format ? 7 : null;
  for (const s of SECTIONS) {
    if (!shown(s.showIf)) continue;
    for (const f of s.fields) {
      if (!shown(f.showIf)) continue;
      if (f.type === 'choice') {
        (f.put[V[f.id]] || []).forEach(mark);
        if (f.printAs && V[f.id]) text(f.printAs, clean(V[f.id]));
      } else if (f.type === 'pair') {
        f.putA.forEach(pl => text(pl, clean(V[`${f.id}A`])));
        f.putB.forEach(pl => text(pl, clean(V[`${f.id}B`])));
      } else if (f.type === 'sign') {
        if (!V.signature) continue;
        const img = await doc.embedPng(V.signature);
        for (const pl of f.put) {
          const [x0, y0, x1, y1] = pl.img, k = Math.min((x1 - x0) / img.width, (y1 - y0) / img.height);
          pages[pl.p - 1].drawImage(img, { x: x0, y: H - y1, width: img.width * k, height: img.height * k });
        }
      } else {
        const val = clean(V[f.id]);
        if (val) (f.put || []).forEach(pl => text(pl, clean((f.prefix || '') + val)));
      }
    }
  }
  if (pitchPage) {
    for (const [k, pl] of Object.entries(PITCH_HEADERS[pitchPage])) text({ p: pitchPage, ...pl }, clean(V[k]));
  }

  doc.setTitle(fileName().replace(/\.pdf$/, ''));
  doc.setModificationDate(new Date());
  return doc.save();
}

// ---------- start ----------

document.addEventListener('DOMContentLoaded', () => {
  window.addEventListener('hashchange', route);
  route();
  $('new-yes').addEventListener('click', newMatch);
  document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => b.closest('dialog').close()));
  $('zoom').addEventListener('click', () => $('zoom').close());
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js');
});

window.__test = { buildPdf, fileName, setValues: v => { V = v; save(); route(); } };

const STORE = 'mpcaRR.v1';
const { PDFDocument, StandardFonts, rgb, LineCapStyle } = PDFLib;
const INK = rgb(0.02, 0.13, 0.45);
const BAD = new Set([...BAD_WORDS, 'Inadequate']);

let V = load();

function load() {
  try { return JSON.parse(localStorage.getItem(STORE)) || {}; } catch { return {}; }
}
function save() {
  try { localStorage.setItem(STORE, JSON.stringify(V)); } catch {}
  document.getElementById('saved').textContent = 'Saved on this phone';
}
const allFields = () => SECTIONS.flatMap(s => s.fields.map(f => ({ ...f, section: s })));
const shown = cond => !cond || [].concat(cond[1]).includes(V[cond[0]]);
const el = (tag, attrs = {}, ...kids) => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') n.className = v;
    else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
    else if (v !== undefined && v !== null && v !== false) n.setAttribute(k, v === true ? '' : v);
  }
  for (const k of kids.flat()) if (k != null) n.append(k);
  return n;
};
const NON_PRINTABLE = /[^\x20-\x7E\xA0-\xFF‘’“”–—…\n\r\t]/;

// ---------- form ----------

function input(f, key = f.id, placeholder) {
  const attrs = { id: `f-${key}`, value: V[key] || '', placeholder, inputmode: f.inputmode, autocomplete: 'off',
    oninput: e => { V[key] = e.target.value; save(); onChange(f, key); } };
  if (f.list) attrs.list = `l-${f.id}`;
  const n = f.type === 'area'
    ? el('textarea', { ...attrs, rows: 4 }, V[key] || '')
    : el('input', { ...attrs, type: 'text' });
  if (f.type === 'area') n.value = V[key] || '';
  return n;
}

function fieldNode(f) {
  const label = el('label', { class: 'lbl', for: f.type === 'choice' ? null : `f-${f.id}${f.type === 'pair' ? 'A' : ''}` },
    el('span', { class: 'lbl-text', 'data-label': f.id }, labelFor(f)));
  const hint = f.hint ? el('p', { class: 'hint' }, f.hint) : null;
  const warn = el('p', { class: 'warn', id: `w-${f.id}`, hidden: true });
  let body;
  if (f.type === 'choice') {
    body = el('div', { class: `choices n${f.opts.length}`, role: 'group', 'aria-label': f.label },
      f.opts.map(o => el('button', {
        type: 'button', class: 'choice', 'aria-pressed': String(V[f.id] === o),
        onclick: e => {
          V[f.id] = V[f.id] === o ? '' : o;
          e.currentTarget.parentNode.querySelectorAll('.choice').forEach(b => b.setAttribute('aria-pressed', String(b.textContent === V[f.id])));
          save(); onChange(f, f.id);
        },
      }, o)));
  } else if (f.type === 'select') {
    body = el('select', { id: `f-${f.id}`, onchange: e => { V[f.id] = e.target.value; save(); onChange(f, f.id); } },
      el('option', { value: '' }, 'Choose'), f.opts.map(o => el('option', { value: o, selected: V[f.id] === o }, o)));
  } else if (f.type === 'pair') {
    body = el('div', { class: 'pair' }, input(f, `${f.id}A`, f.a), input(f, `${f.id}B`, f.b));
  } else if (f.type === 'sign') {
    body = signaturePad();
  } else {
    body = input(f);
  }
  const list = f.list ? el('datalist', { id: `l-${f.id}` }, f.list.map(o => el('option', { value: o }))) : null;
  return el('div', { class: `field t-${f.type}`, id: `fw-${f.id}`, hidden: !shown(f.showIf) }, label, hint, body, list, warn);
}

function labelFor(f) {
  const team = f.teamLabel && V[f.teamLabel];
  return team ? f.label.replace(/^Team \d/, `${f.teamLabel === 'team1' ? 'Team 1' : 'Team 2'} (${team})`) : f.label;
}

function render() {
  const form = document.getElementById('form');
  const nav = document.getElementById('jump');
  for (const s of SECTIONS) {
    const head = el('header', { class: 'sec-head' },
      s.num ? el('span', { class: 'sec-num' }, s.num) : null,
      el('div', {}, el('h2', { 'data-team': s.teamRef || null }, sectionTitle(s)), s.hi ? el('p', { class: 'sec-hi', lang: 'hi' }, s.hi) : null));
    form.append(el('section', { class: 'sec', id: `sec-${s.id}`, hidden: !shown(s.showIf) }, head, s.fields.map(fieldNode)));
    nav.append(el('option', { value: s.id }, `${s.num ? s.num + '. ' : ''}${s.title}`));
  }
  refreshWarnings();
}

function sectionTitle(s) {
  if (!s.teamRef) return s.title;
  return V[s.teamRef] ? `${s.title} (${V[s.teamRef]})` : s.title;
}

function onChange(f, key) {
  if (NON_PRINTABLE.test(V[key] || '')) showWarn(f.id, 'Please type in English. The PDF cannot print Hindi letters.');
  if (['team1', 'team2'].includes(key)) {
    document.querySelectorAll('[data-label]').forEach(n => { const g = allFields().find(x => x.id === n.dataset.label); n.textContent = labelFor(g); });
    document.querySelectorAll('[data-team]').forEach(n => { n.textContent = sectionTitle(SECTIONS.find(s => s.teamRef === n.dataset.team)); });
  }
  for (const s of SECTIONS) {
    document.getElementById(`sec-${s.id}`).hidden = !shown(s.showIf);
    for (const g of s.fields) document.getElementById(`fw-${g.id}`).hidden = !shown(g.showIf);
  }
  refreshWarnings();
}

function showWarn(id, msg) {
  const w = document.getElementById(`w-${id}`);
  if (!w) return;
  w.textContent = msg || '';
  w.hidden = !msg;
}

// a reason box that is still empty while a rating it covers is bad
function missingReasons() {
  const out = [];
  for (const f of allFields()) {
    if (!f.reasonFor || !shown(f.section.showIf)) continue;
    const bad = allFields().filter(g => g.type === 'choice' && f.reasonFor.test(g.id) && BAD.has(V[g.id]));
    if (bad.length && !(V[f.id] || '').trim()) out.push({ f, bad });
  }
  return out;
}

function refreshWarnings() {
  for (const f of allFields()) {
    if (f.reasonFor) showWarn(f.id, '');
    else if (!NON_PRINTABLE.test(V[f.id] || '') && !NON_PRINTABLE.test(V[`${f.id}A`] || '') && !NON_PRINTABLE.test(V[`${f.id}B`] || '')) showWarn(f.id, '');
  }
  for (const { f, bad } of missingReasons()) showWarn(f.id, `Needed: you rated ${bad.map(b => b.label.replace(/:.*$/, '')).join(', ')} as ${[...new Set(bad.map(b => V[b.id]))].join(' / ')}.`);
  const total = allFields().filter(f => shown(f.section.showIf) && shown(f.showIf) && f.type !== 'sign' && f.id !== 'extra' && f.type !== 'pair');
  const done = total.filter(f => (V[f.id] || '').trim()).length;
  document.getElementById('progress').textContent = `${done} of ${total.length} answered`;
}

// ---------- signature ----------

function signaturePad() {
  const c = el('canvas', { class: 'sig', width: 900, height: 260, 'aria-label': 'Signature pad' });
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
  let drawing = false, dirty = false;
  const pt = e => { const r = c.getBoundingClientRect(); return [(e.clientX - r.left) * c.width / r.width, (e.clientY - r.top) * c.height / r.height]; };
  c.addEventListener('pointerdown', e => {
    if (!dirty && V.signature) { g.clearRect(0, 0, c.width, c.height); }
    drawing = dirty = true; c.setPointerCapture(e.pointerId);
    g.lineWidth = 7; g.lineCap = g.lineJoin = 'round'; g.strokeStyle = '#0a2a73';
    g.beginPath(); g.moveTo(...pt(e));
  });
  c.addEventListener('pointermove', e => { if (drawing) { g.lineTo(...pt(e)); g.stroke(); } });
  const end = () => { if (!drawing) return; drawing = false; V.signature = trimmed(c); save(); };
  c.addEventListener('pointerup', end);
  c.addEventListener('pointercancel', end);
  const clear = el('button', { type: 'button', class: 'btn-quiet', onclick: () => { V.signature = ''; dirty = false; save(); paint(); } }, 'Clear signature');
  paint();
  return el('div', { class: 'sig-wrap' }, c, clear);
}

function trimmed(c) {
  const g = c.getContext('2d');
  const { data, width, height } = g.getImageData(0, 0, c.width, c.height);
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
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const pages = doc.getPages();
  const H = pages[0].getHeight();
  const chars = new Set(font.getCharacterSet());
  const annex = [];
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

  function cut(s, w, size) {
    while (s.length > 1 && width(s + '...', size) > w) s = s.slice(0, -1);
    return s.trimEnd() + '...';
  }

  function text(pl, s, label) {
    if (!s) return;
    if (pl.box) return box(pl, s, label);
    if (pl.cell) return cell(pl, s, label);
    const one = s.replace(/\n+/g, ', ');
    for (let size = pl.size || 9; size >= 6; size -= 0.25) {
      if (width(one, size) <= pl.w) return write(pl.p, one, pl.x, pl.b, size);
    }
    write(pl.p, cut(one, pl.w, 6), pl.x, pl.b, 6);
    annex.push([label, s]);
  }

  function cell(pl, s, label) {
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
    write(pl.p, cut(one, w, 6), x0 + pad, m + 2, 6);
    annex.push([label, s]);
  }

  function box(pl, s, label) {
    const [x0, y0, x1, y1] = pl.box, pad = pl.pad ?? 4, w = x1 - x0 - pad * 2, h = y1 - y0 - pad * 2;
    for (let size = 9.5; size >= 6; size -= 0.25) {
      const lines = wrap(s, w, size), lead = size * 1.2;
      if (lines.length * lead <= h + size * 0.25) {
        lines.forEach((l, i) => write(pl.p, l, x0 + pad, y0 + pad + size * 0.85 + i * lead, size));
        return;
      }
    }
    const size = 6.5, lead = size * 1.2, fit = Math.max(1, Math.floor(h / lead));
    const lines = wrap(s, w, size).slice(0, fit - 1);
    lines.push('(continued on the supplement page at the end)');
    lines.forEach((l, i) => write(pl.p, l, x0 + pad, y0 + pad + size * 0.85 + i * lead, size));
    annex.push([label, s]);
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
      if (f.type === 'choice') (f.put[V[f.id]] || []).forEach(mark);
      else if (f.type === 'pair') {
        f.putA.forEach(pl => text(pl, clean(V[`${f.id}A`]), `${f.label}: ${f.a}`));
        f.putB.forEach(pl => text(pl, clean(V[`${f.id}B`]), `${f.label}: ${f.b}`));
      } else if (f.type === 'sign') {
        if (!V.signature) continue;
        const img = await doc.embedPng(V.signature);
        for (const pl of f.put) {
          const [x0, y0, x1, y1] = pl.img, k = Math.min((x1 - x0) / img.width, (y1 - y0) / img.height);
          pages[pl.p - 1].drawImage(img, { x: x0, y: H - y1, width: img.width * k, height: img.height * k });
        }
      } else {
        const val = clean(V[f.id]);
        if (val) (f.put || []).forEach(pl => text(pl, clean((f.prefix || '') + val), f.label));
      }
    }
  }
  if (pitchPage) {
    for (const [k, pl] of Object.entries(PITCH_HEADERS[pitchPage])) text({ p: pitchPage, ...pl }, clean(V[k]), k);
  }

  const extra = clean(V.extra);
  if (extra) annex.unshift(['Other remarks', extra]);
  if (annex.length) supplement(doc, annex, font, bold, clean);

  doc.setTitle(fileName().replace(/\.pdf$/, ''));
  doc.setModificationDate(new Date());
  return doc.save();
}

function supplement(doc, items, font, bold, clean) {
  const [W, H] = [545.04, 842.04], L = 46, R = W - 46, size = 9.5, lead = 13;
  let page, y;
  const fresh = () => { page = doc.addPage([W, H]); y = 60; };
  const line = (s, f = font, sz = size) => { if (y > H - 70) fresh(); page.drawText(s, { x: L, y: H - y, size: sz, font: f, color: INK }); y += lead; };
  const wrapW = (s, f, sz) => {
    const out = [];
    for (const para of s.split('\n')) {
      let cur = '';
      for (const w of para.split(/ +/)) { const t = cur ? `${cur} ${w}` : w; if (f.widthOfTextAtSize(t, sz) <= R - L) cur = t; else { out.push(cur); cur = w; } }
      out.push(cur);
    }
    return out;
  };
  fresh();
  page.drawText('SUPPLEMENT TO THE REPORT BY THE REFEREE', { x: L, y: H - y, size: 12, font: bold, color: rgb(0, 0, 0) });
  y += 18;
  const who = [V.tournament, V.team1 && V.team2 ? `${V.team1} vs ${V.team2}` : '', V.ground, V.dates].map(clean).filter(Boolean).join('  |  ');
  if (who) { wrapW(who, font, 9).forEach(s => line(s, font, 9)); }
  y += 10;
  for (const [label, s] of items) {
    y += 4;
    line(label, bold);
    wrapW(s, font, size).forEach(t => line(t));
    y += 6;
  }
  if (V.refName) { y += 14; line(`Name of the Referee: ${clean(V.refName)}`, bold); }
}

let ready = null;

async function prepare() {
  ready = null;
  const status = document.getElementById('prep');
  document.querySelectorAll('.act').forEach(b => (b.disabled = true));
  status.textContent = 'Making the PDF...';
  try {
    const bytes = await buildPdf();
    ready = new File([bytes], fileName(), { type: 'application/pdf' });
    status.textContent = `Ready: ${ready.name}`;
    document.querySelectorAll('.act').forEach(b => (b.disabled = false));
  } catch (e) {
    status.textContent = `Could not make the PDF: ${e.message}`;
  }
}

// Safari only allows share() straight after a tap, so the file is built before the tap
function sharePdf() {
  if (!ready) return;
  const status = document.getElementById('prep');
  if (navigator.canShare && navigator.canShare({ files: [ready] })) {
    navigator.share({ files: [ready], title: ready.name })
      .then(() => { status.textContent = `Shared ${ready.name}`; })
      .catch(e => { status.textContent = e.name === 'AbortError' ? 'Sharing cancelled' : `Could not share: ${e.message}`; });
  } else {
    downloadPdf();
    status.textContent = `This browser cannot share files, so ${ready.name} was downloaded instead`;
  }
}

function downloadPdf() {
  if (!ready) return;
  const a = el('a', { href: URL.createObjectURL(ready), download: ready.name });
  document.body.append(a); a.click(); a.remove();
}

function checks() {
  const out = [];
  if (!V.format) out.push('Choose the format (multi-day / one day / T20), so the right pitch page is filled.');
  if (!V.refName) out.push("Referee's name is empty.");
  if (!V.signature) out.push('No signature yet. Sign in the last section, or sign by hand after printing.');
  for (const { f } of missingReasons()) out.push(`${f.section.title}: reason box is empty but a rating is bad.`);
  for (const f of allFields()) {
    for (const k of [f.id, `${f.id}A`, `${f.id}B`]) if (NON_PRINTABLE.test(V[k] || '')) { out.push(`${f.label}: has Hindi or other letters the PDF cannot print.`); break; }
  }
  return out;
}

function openCheck() {
  const list = checks();
  const ul = document.getElementById('check-list');
  ul.replaceChildren(...list.map(t => el('li', {}, t)));
  document.getElementById('check-ok').hidden = list.length > 0;
  document.getElementById('check-dialog').showModal();
  prepare();
}

function newMatch() {
  const keep = Object.fromEntries(allFields().filter(f => f.keep).map(f => [f.id, V[f.id]]));
  const old = V;
  V = keep; save();
  document.getElementById('form').replaceChildren();
  document.getElementById('jump').replaceChildren(el('option', { value: '' }, 'Jump to section'));
  render();
  document.getElementById('new-dialog').close();
  window.scrollTo(0, 0);
  return old;
}

document.addEventListener('DOMContentLoaded', () => {
  render();
  document.getElementById('jump').addEventListener('change', e => {
    if (e.target.value) document.getElementById(`sec-${e.target.value}`).scrollIntoView({ behavior: 'smooth' });
    e.target.value = '';
  });
  document.getElementById('make').addEventListener('click', openCheck);
  document.getElementById('do-share').addEventListener('click', sharePdf);
  document.getElementById('do-download').addEventListener('click', downloadPdf);
  document.getElementById('new').addEventListener('click', () => document.getElementById('new-dialog').showModal());
  document.getElementById('new-yes').addEventListener('click', newMatch);
  document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => b.closest('dialog').close()));
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js');
});

window.__test = { buildPdf, setValues: v => { V = v; save(); }, fileName };

// Field map for "Umpire Assessment Report by Referees 2026-27" (MPCA). Coordinates are PDF points
// measured from the TOP-LEFT of each 612 x 792 page.

const GRADES = { Excellent: 'A', Good: 'B', Average: 'C', Poor: 'D' };
const CRITERIA = [
  ['Dec', 'Decision making', 314.3, 342.5],
  ['Man', 'Man and match management', 342.5, 374.9],
  ['Press', 'Handling player and match pressure', 374.9, 416.6],
  ['Comm', 'Communication and behaviour with players', 416.6, 467.5],
  ['Team', 'Team work with the other umpire', 467.5, 499.9],
];
const grades = (u, cx) => CRITERIA.map(([k, label, y0, y1]) => ({
  id: `u${u}${k}`, label, type: 'choice', opts: Object.keys(GRADES),
  put: Object.fromEntries(Object.entries(GRADES).map(([o, g]) => [o, [{ p: 1, say: g, at: [cx, (y0 + y1) / 2] }]])),
}));

const UMPIRE_SECTIONS = [
  {
    id: 'umatch', num: '', title: 'Match details', hi: 'अंपायर और मैच की जानकारी', page: 1, snip: 'u-match',
    fields: [
      { id: 'ump1', group: 'Umpires', label: 'Umpire 1', type: 'text', put: [{ p: 1, x: 190, b: 156.5, w: 188 }, { p: 1, cell: [241, 293, 418, 314] }] },
      { id: 'ump2', label: 'Umpire 2', type: 'text', put: [{ p: 1, x: 392, b: 156.5, w: 143 }, { p: 1, cell: [418, 293, 588, 314] }] },
      { id: 'tournament', group: 'Match', label: 'Tournament', type: 'text', list: ['C.T. Sarwate Trophy', 'Madhavrao Scindia Trophy', 'J.N. Bhaya Trophy'], put: [{ p: 1, x: 182, b: 183.5, w: 340 }] },
      { id: 'between', label: 'Match between', type: 'text', placeholder: 'Bhopal vs Jabalpur', put: [{ p: 1, x: 182, b: 210.3, w: 340 }] },
      { id: 'date', label: 'Date', type: 'text', placeholder: '18-21 Nov 2026', put: [{ p: 1, x: 182, b: 237, w: 114 }] },
      { id: 'venue', label: 'Venue', type: 'text', put: [{ p: 1, x: 364, b: 237, w: 157 }] },
      { id: 'format', group: 'For the file name', label: 'Format', type: 'choice', opts: FORMATS.map(f => f[1]), put: {} },
      { id: 'matchNo', label: 'Match no.', type: 'text', inputmode: 'numeric', placeholder: '12', put: [] },
      { id: 'category', label: 'Category', type: 'choice', opts: CATEGORIES.map(c => c[0]), put: {} },
      { id: 'refName', group: 'You', label: "Referee's name", type: 'text', keep: true, put: [{ p: 2, x: 412, b: 556.3, w: 170 }] },
    ],
  },
  { id: 'urate1', num: '', title: 'Umpire 1', teamRef: 'ump1', hi: 'A उत्कृष्ट, B अच्छा, C औसत, D कमज़ोर', page: 1, snip: 'u-rate', fields: grades(1, 329.4) },
  { id: 'urate2', num: '', title: 'Umpire 2', teamRef: 'ump2', hi: 'A उत्कृष्ट, B अच्छा, C औसत, D कमज़ोर', page: 1, snip: 'u-rate', fields: grades(2, 503) },
  {
    id: 'ucomments', num: '', title: "Referee's comments", hi: 'प्रत्येक अंपायर के प्रदर्शन पर टिप्पणी', page: 1, snip: 'u-ref',
    fields: [{ id: 'refComments', label: 'Your comments on each umpire', hint: 'If any rating is Poor, give the reason here', type: 'area', reasonFor: /^u[12]/, always: true, put: [{ p: 1, box: [48, 571, 575, 723] }] }],
  },
  {
    id: 'ucapt', num: '', title: "Captains' / coaches' comments", hi: 'कप्तानों / प्रशिक्षक की टिप्पणी', page: 2, snip: 'u-capt',
    fields: [{ id: 'captComments', label: 'Their comments on each umpire', type: 'area', optional: true, put: [{ p: 2, box: [57, 87, 576, 247] }] }],
  },
  {
    id: 'uincident', num: '', title: 'Incidents during the match', hi: 'मैच के दौरान कोई विशेष घटना', page: 2, snip: 'u-incident',
    fields: [{ id: 'incidents', label: 'Any incident', hint: 'Optional', type: 'area', optional: true, put: [{ p: 2, box: [58, 287, 575, 471] }] }],
  },
  {
    id: 'sign', num: '', title: 'Signature', hi: 'हस्ताक्षर', page: 2, snip: 'u-sign',
    fields: [
      { id: 'signature', label: 'Sign with your finger', hint: 'Done once, kept for every match', type: 'sign', keep: true, optional: true, put: [{ p: 2, img: [384, 512, 540, 545] }] },
      { id: 'signDate', label: 'Date', type: 'text', placeholder: '21/11/2026', inputmode: 'numeric', put: [{ p: 2, x: 92, b: 539.5, w: 180 }] },
    ],
  },
];

const UMPIRE = {
  id: 'umpire', name: 'Umpire report', title: 'Umpire assessment', store: 'mpcaRR.umpire.v1', pdf: 'umpire.pdf', sections: UMPIRE_SECTIONS,
  code: 'RU', fallback: 'Umpire Report.pdf', formatNote: 'Format is not chosen, so the file name is incomplete.',
  sendHead: 'Send by mail to', sendTo: ['moreports@mpcaonline.com'], envelope: false,
  card: V => ({ eyebrow: [V.format, V.category], title: V.between || '', sub: [V.venue, V.date] }),
  // empty fields start from the venue report of the same match
  prefill: {
    refName: 'refName', signature: 'signature', tournament: 'tournament', matchNo: 'matchNo', category: 'category', format: 'format',
    date: 'dates', venue: 'ground', between: v => (v.team1 && v.team2 ? `${v.team1} vs ${v.team2}` : ''),
  },
};

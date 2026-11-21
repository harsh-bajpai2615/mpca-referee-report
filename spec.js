// Field map for "Match Referee Report 2026-27" (MPCA). Coordinates are PDF points measured
// from the TOP-LEFT of each 545 x 842 page, taken from the form's own table geometry.

const DIVISIONS = ['Indore', 'Bhopal', 'Gwalior', 'Ujjain', 'Jabalpur', 'Chambal', 'Narmadapuram', 'Shahdol', 'Sagar', 'Rewa'];
const CATEGORIES = [['SR', 'Senior'], ['U22', 'Under 22'], ['U18', 'Under 18'], ['U15', 'Under 15'], ['U13', 'Under 13'], ['WSR', 'Women senior'], ['WJR', 'Women junior']];
const FORMATS = [['MD', 'Multi-day'], ['OD', 'One day'], ['T20', 'T20']];

const tick = (p, x, y) => ({ p, tick: [x, y] });
const oval = (p, x0, y0, x1, y1) => ({ p, oval: [x0, y0, x1, y1] });
const mid = (a, b) => (a + b) / 2;

// one tick per option, all on one row
function row(p, cols, y0, y1) {
  const put = {};
  for (const [opt, x] of Object.entries(cols)) put[opt] = [tick(p, x, mid(y0, y1))];
  return put;
}
// one tick per option, options stacked in rows of one column
function column(p, x, opts, ys) {
  const put = {};
  opts.forEach((o, i) => { put[o] = [tick(p, x, mid(ys[i], ys[i + 1]))]; });
  return put;
}
const rate = (id, label, cols, p, y0, y1, extra = {}) => ({ id, label, type: 'choice', opts: Object.keys(cols), put: row(p, cols, y0, y1), ...extra });

const ACC = { Excellent: 301, Satisfactory: 358, 'Sub-standard': 425.5, Bad: 482 };
const FOOD = { Excellent: 280, Satisfactory: 347.5, Substandard: 407.5, Bad: 471 };
const TEAM = { Excellent: 301, Satisfactory: 354.5, Average: 411.5 };
const STYLE = { Aggressive: 301, Positive: 354.5, Autocratic: 411.5, Passive: 475 };
const GROUND = { Good: 390, Average: 436, Poor: 482 };
const ADMIN = { Excellent: 297, Satisfactory: 351, Substandard: 418.5, Bad: 482.5 };
const MD = { Good: 257, Average: 331.5, Poor: 408 };
const LEVELS = ['No', 'Slight', 'Decent', 'Excessive'];
const OVERALL = ['Very good', 'Good', 'Satisfactory', 'Average', 'Poor'];
const BAD_WORDS = ['Sub-standard', 'Substandard', 'Bad', 'Poor', 'Inadequate'];

function teamBlock(n, coachB, r, styleRow, players) {
  const t = `t${n}`;
  return {
    id: `teams${n}`, num: '3', title: `Team ${n}`, teamRef: `team${n}`, hi: 'टीम का अनुशासन, किट, खेल का तरीका', page: 3, snip: `teams${n}`,
    fields: [
      { id: `${t}Coach`, label: 'Coach', type: 'text', put: [{ p: 3, x: 88, b: coachB, w: 184 }] },
      rate(`${t}Disc`, 'Discipline / grooming of the players', TEAM, 3, r[0], r[1]),
      rate(`${t}Gear`, 'Cricket gear available to team members', TEAM, 3, r[1], r[2]),
      rate(`${t}Appr`, 'Approach towards the game', TEAM, 3, r[2], r[3]),
      rate(`${t}Style`, 'Coaching style', STYLE, 3, styleRow[0], styleRow[1], { hint: n === 1 ? 'Only for teams up to U/18' : 'Only for teams up to U/19', optional: true }),
      ...players.map((y, i) => ({
        id: `${t}P${i + 1}`, group: i === 0 ? 'Potentially talented players' : null, label: `Player ${i + 1}`, type: 'pair', a: 'Name', b: 'Proficiency', optional: true,
        putA: [{ p: 3, cell: [276, y[0], 440, y[1]] }], putB: [{ p: 3, cell: [440, y[0], 510, y[1]] }],
      })),
    ],
  };
}

const SECTIONS = [
  {
    id: 'match', num: '', title: 'Match details', hi: 'मैच की जानकारी', page: 1, snip: 'match',
    fields: [
      { id: 'format', label: 'Format', type: 'choice', opts: FORMATS.map(f => f[1]), put: {}, hint: 'Picks the pitch page and the file name' },
      { id: 'tournament', label: 'Tournament', type: 'text', list: ['C.T. Sarwate Trophy', 'Madhavrao Scindia Trophy', 'J.N. Bhaya Trophy'], put: [{ p: 1, x: 143, b: 499, w: 355 }] },
      { id: 'segment', label: 'Segment', type: 'choice', chips: true, opts: ['League', 'Super League', 'Knock out'], put: {
        League: [oval(1, 215.6, 513.4, 248.1, 524.3)], 'Super League': [oval(1, 258.4, 513.4, 320.7, 524.3)], 'Knock out': [oval(1, 331.1, 513.4, 376.3, 524.3)] } },
      { id: 'team1', group: 'Match witnessed', label: 'Team 1', type: 'text', list: DIVISIONS, put: [{ p: 1, cell: [202, 631, 329, 652] }, { p: 3, x: 86, b: 77, w: 186 }] },
      { id: 'team2', label: 'Team 2', type: 'text', list: DIVISIONS, put: [{ p: 1, cell: [351, 631, 500, 652] }, { p: 3, x: 86, b: 328.5, w: 186 }] },
      { id: 'dates', label: 'Date/s', type: 'text', placeholder: '18-21 Nov 2026', put: [{ p: 1, cell: [139, 631, 202, 652] }] },
      { id: 'ground', label: 'Ground', type: 'text', put: [{ p: 1, x: 216, b: 587, w: 284 }] },
      { id: 'division', label: 'Staging association', type: 'text', list: DIVISIONS, suffix: 'Divisional Cricket Association', put: [{ p: 1, x: 218, b: 554, w: 97 }] },
      { id: 'matchNo', group: 'For the file name', label: 'Match no.', type: 'text', inputmode: 'numeric', placeholder: '12', put: [] },
      { id: 'category', label: 'Category', type: 'choice', opts: CATEGORIES.map(c => c[0]), put: {} },
      { id: 'refName', group: 'You', label: "Referee's name", type: 'text', keep: true, put: [{ p: 1, x: 199, b: 683.5, w: 300 }, { p: 7, x: 156, b: 633.5, w: 128 }] },
    ],
  },
  {
    id: 'acc', num: '1', title: 'Accommodation', hi: 'होटल का नाम और रेटिंग', page: 2, snip: 'acc',
    fields: [
      ...[['T1', 'Team 1', 'team1', 137, 167], ['T2', 'Team 2', 'team2', 167, 191], ['Ump', 'Umpires / scorer', null, 191, 211], ['Sel', 'Selectors', null, 211, 231]].flatMap(([k, label, team, y0, y1]) => [
        { id: `acc${k}Hotel`, group: label, teamLabel: team, label: 'Hotel', type: 'text', put: [{ p: 2, cell: [127, y0, 276, y1] }] },
        rate(`acc${k}Rate`, 'Rating', ACC, 2, y0, y1),
      ]),
      { id: 'accReason', group: 'Why sub-standard / bad', label: 'Reason/s', type: 'area', reasonFor: /^acc.*Rate$/, put: [{ p: 2, box: [43, 245, 502, 304] }] },
    ],
  },
  {
    id: 'food', num: '2', title: 'Food on match day', hi: 'नाश्ता, लंच, चाय, पानी', page: 2, snip: 'food',
    fields: [
      rate('foodBf', 'Breakfast', FOOD, 2, 508, 531),
      rate('foodLunch', 'Lunch', FOOD, 2, 531, 553),
      rate('foodTea', 'Tea', FOOD, 2, 553, 575),
      rate('foodPost', 'Post match', FOOD, 2, 575, 597),
      { id: 'waterSrc', group: 'Water', label: 'Source', type: 'choice', opts: ['Packaged / RO', 'Tap water'], put: row(2, { 'Packaged / RO': 280, 'Tap water': 347.5 }, 619, 641) },
      { id: 'waterQty', label: 'Quantity', type: 'choice', opts: ['Adequate', 'Inadequate'], put: row(2, { Adequate: 407.5, Inadequate: 471 }, 619, 641) },
      { id: 'foodReason', group: 'Why substandard / bad', label: 'Reason/s', type: 'area', reasonFor: /^(food|waterQty)/, put: [{ p: 2, box: [40, 668, 503, 736] }] },
    ],
  },
  teamBlock(1, 95.5, [100, 122, 144, 167], [189, 211], [[233, 255], [255, 277], [277, 299]]),
  teamBlock(2, 347.5, [360, 382, 404, 426], [448, 470], [[492, 514], [514, 537], [537, 559]]),
  {
    id: 'practice', num: '4', title: 'Practice facilities', hi: 'मैच से एक दिन पहले की प्रैक्टिस', page: 3, snip: 'practice',
    fields: [
      { id: 'pConv', label: 'Local conveyance for the visiting team', type: 'choice', opts: ['Yes', 'No'], put: { Yes: [tick(3, 316, 608.5)], No: [tick(3, 314, 631)] } },
      { id: 'pVehicle', label: 'Type of vehicle', showIf: ['pConv', 'Yes'], type: 'text', put: [{ p: 3, x: 403, b: 612, w: 98, room: [605, 624.5] }] },
      { id: 'pConvReason', label: 'Reason', showIf: ['pConv', 'No'], type: 'text', put: [{ p: 3, x: 368, b: 634.5, w: 133, room: [626, 646.5] }] },
      { id: 'pDuration', label: 'Duration of nets', type: 'text', placeholder: '2.5 hours', put: [{ p: 3, cell: [276, 648, 503, 670] }] },
      { id: 'pNets', label: 'No. of nets', type: 'text', inputmode: 'numeric', put: [{ p: 3, cell: [276, 670, 503, 692] }] },
      { id: 'pCoord', label: 'Coordinator present for visiting teams', type: 'choice', opts: ['Yes', 'No'], put: { Yes: [tick(3, 316, 697)], No: [tick(3, 368, 697)] } },
      { id: 'pSnacks', label: 'Snacks arranged', type: 'choice', opts: ['Yes', 'No'], put: { Yes: [tick(3, 316, 719)], No: [tick(3, 368, 719)] } },
      { id: 'pOverall', label: 'Overall arrangements', type: 'choice', opts: ['Good', 'Average', 'Poor'], put: { Good: [tick(3, 322, 741)], Average: [tick(3, 409, 741)], Poor: [tick(3, 471, 741)] } },
    ],
  },
  {
    id: 'ground1', num: '5', title: 'Ground: transport, rooms, staff', hi: 'गाड़ी, ड्रेसिंग रूम, ग्राउंड स्टाफ', page: 4, snip: 'ground1',
    fields: [
      { id: 'gVehicle', group: 'Local conveyance for visiting team', label: 'Vehicle type', type: 'text', put: [{ p: 4, x: 198, b: 78, w: 56, room: [71, 89] }] },
      { id: 'gCapacity', label: 'Capacity', type: 'text', inputmode: 'numeric', put: [{ p: 4, x: 304, b: 78, w: 63 }] },
      { id: 'gPunct', label: 'Punctuality', type: 'text', put: [{ p: 4, x: 195, b: 96.5, w: 171 }] },
      { id: 'gEffect', label: 'Overall effectiveness', type: 'text', put: [{ p: 4, x: 238, b: 115, w: 128 }] },
      rate('gConvRate', 'Rating', GROUND, 4, 70, 119),
      rate('gDrTeams', 'Teams', GROUND, 4, 119, 149, { group: 'Dressing rooms / work stations' }),
      rate('gDrUmp', 'Umpires', GROUND, 4, 149, 179),
      rate('gDrScorer', 'Scorer', GROUND, 4, 179, 201),
      rate('gDrSel', 'Selectors & referee', GROUND, 4, 201, 223),
      { id: 'gsName', group: 'Ground staff', label: 'Name of main ground staff', type: 'text', put: [{ p: 4, cell: [369, 223, 503, 245] }] },
      rate('gsRate', 'Main ground staff: knowledge, work ethics, initiative', GROUND, 4, 245, 267),
      { id: 'gsHelpers', label: 'No. of assistants / helpers', type: 'text', inputmode: 'numeric', put: [{ p: 4, x: 262, b: 281.5, w: 104 }] },
      rate('gsHelpersRate', 'Assistants / helpers', GROUND, 4, 267, 289, { optional: true }),
    ],
  },
  {
    id: 'ground2', num: '5', title: 'Ground: equipment', hi: 'रोलर, बाउंड्री, कवर, स्कोरबोर्ड', page: 4, snip: 'ground2',
    fields: [
      { id: 'rollMech', group: 'Rollers', label: 'Mechanical', type: 'text', placeholder: 'nos., weight, condition', put: [{ p: 4, x: 155, b: 335.5, w: 211, room: [325, 337] }] },
      { id: 'rollManual', label: 'Manual', type: 'text', placeholder: 'nos., weight, condition', prefix: 'Manual: ', put: [{ p: 4, x: 140, b: 345.3, w: 226, size: 7.5, room: [338, 347] }] },
      rate('rollRate', 'Rating', GROUND, 4, 289, 348),
      rate('gBoundary', 'Boundary marking', GROUND, 4, 348, 404, { group: 'Ratings' }),
      rate('gScoreboard', 'Scoreboard', GROUND, 4, 404, 433),
      rate('gSight', 'Sightscreen', GROUND, 4, 433, 476),
      rate('gCovers', 'Covers', GROUND, 4, 476, 505),
      rate('gSpares', 'Spare stumps, bails, markers, towels', GROUND, 4, 541, 570),
      { id: 'gSopperCond', group: 'Super sopper', label: 'Working condition', hint: 'Leave blank if there is none', optional: true, type: 'text', put: [{ p: 4, box: [138, 515, 368, 541], pad: 2 }] },
      rate('gSopper', 'Rating', GROUND, 4, 505, 541, { optional: true }),
      rate('gOverall', 'Overall rating of facilities', GROUND, 4, 570, 591, { group: 'Overall' }),
      { id: 'gPoorReason', group: 'Why poor', label: 'Reasons for any POOR rating', type: 'area', reasonFor: /^(g|roll)/, put: [{ p: 4, box: [135, 591, 503, 660] }] },
    ],
  },
  {
    id: 'other', num: '6-8', title: 'Placards, Cricbooks, conduct', hi: 'प्लेकार्ड, क्रिकबुक्स ऐप, आचार संहिता', page: 4, snip: 'other',
    fields: [
      { id: 'placardRef', group: "Players' placard checked by", label: 'Referee', type: 'choice', opts: ['Yes'], put: { Yes: [tick(4, 232, 676)] } },
      { id: 'placardUmp', label: 'Umpires', type: 'choice', opts: ['Yes'], put: { Yes: [tick(4, 334, 676)] } },
      { id: 'cricbooks', group: 'Cricbooks app', label: 'Working', type: 'choice', opts: ['Good', 'Poor'], put: {
        Good: [oval(4, 175.3, 693.6, 198.4, 703.3)], Poor: [oval(4, 203.9, 693.6, 224.8, 703.3)] } },
      { id: 'coc', group: "Violation of 'Code of Conduct'", label: 'Written after "Separate annexure"', type: 'choice', opts: ['Nil', 'Annexure attached'], put: {}, printAs: { p: 4, x: 392, b: 724, w: 110 } },
    ],
  },
  {
    id: 'admin', num: '9', title: 'Overall administration', hi: 'मेज़बान एसोसिएशन का प्रबंधन', page: 5, snip: 'admin',
    fields: [
      rate('aCoord', 'Coordination by host association', ADMIN, 5, 69, 98),
      rate('aHosp', 'Hospitality / transport to teams and officials', ADMIN, 5, 98, 127),
      rate('aGriev', 'Authorities available to sort out problems', ADMIN, 5, 127, 157),
      rate('aMedia', 'Media publicity / coverage', ADMIN, 5, 157, 186),
      { id: 'adminReason', group: 'Why substandard / bad', label: 'Reason/s', type: 'area', reasonFor: /^a(Coord|Hosp|Griev|Media)$/, put: [{ p: 5, box: [38, 207, 513, 332] }] },
    ],
  },
  {
    id: 'selectors', num: '10', title: 'State selectors at the match', hi: 'मैच देखने आए सिलेक्टर', page: 5, snip: 'selectors',
    fields: [396, 418, 440, 462, 484, 506].map((y, i) => ({
      id: `sel${i + 1}`, label: `Selector ${i + 1}`, type: 'pair', a: 'Name', b: 'Date/s', optional: true, more: i > 1,
      putA: [{ p: 5, cell: [41, y, 248, y + 22] }], putB: [{ p: 5, cell: [248, y, 511, y + 22] }],
    })),
  },
  {
    id: 'pitchMD', num: '', title: 'Pitch and outfield', hi: 'पिच और आउटफ़ील्ड', page: 6, snip: 'pitchMD', notes: 'pitchMD-notes', showIf: ['format', 'Multi-day'],
    fields: [
      rate('mdPitch', 'Pitch', MD, 6, 544, 566),
      rate('mdOutfield', 'Outfield', MD, 6, 566, 588),
      { id: 'mdReason', group: 'Why poor', label: 'Reason/s', type: 'area', reasonFor: /^md(Pitch|Outfield)$/, put: [{ p: 6, box: [53, 619, 491, 726] }] },
    ],
  },
  {
    id: 'pitchLO', num: '', title: 'Pitch and outfield', hi: 'पिच और आउटफ़ील्ड', page: 7, snip: 'pitchLO', notes: 'pitchLO-notes', showIf: ['format', ['One day', 'T20']],
    fields: [
      { id: 'loBat', label: 'Conducive for batting', type: 'choice', opts: ['Yes', 'No'], put: column(7, 267.5, ['Yes', 'No'], [320, 342, 365]) },
      { id: 'loMoist', label: 'Moisture & grass cover', type: 'choice', opts: LEVELS, put: column(7, 491, LEVELS, [320, 331, 342, 354, 365]) },
      { id: 'loBounce', label: 'Consistency of bounce', type: 'choice', opts: ['Throughout', 'Mostly', 'Irregular', 'Erratic'], put: column(7, 267.5, ['Throughout', 'Mostly', 'Irregular', 'Erratic'], [365, 376, 388, 399, 410]) },
      { id: 'loCarry', label: 'Carry', type: 'choice', opts: LEVELS, put: column(7, 491, LEVELS, [365, 376, 388, 399, 410]) },
      { id: 'loSeam', label: 'Seam movement', type: 'choice', opts: LEVELS, put: column(7, 267.5, LEVELS, [410, 422, 433, 444, 456]) },
      { id: 'loSpin', label: 'Spin', type: 'choice', opts: LEVELS, put: column(7, 491, LEVELS, [410, 422, 433, 444, 456]) },
      { id: 'loPitch', group: 'Overall rating', label: 'Pitch', type: 'choice', opts: OVERALL, put: column(7, 332, OVERALL, [502, 520, 539, 557, 576, 595]) },
      { id: 'loOutfield', label: 'Outfield', type: 'choice', opts: OVERALL, put: column(7, 441, OVERALL, [502, 520, 539, 557, 576, 595]) },
    ],
  },
  {
    id: 'sign', num: '', title: 'Signature', hi: 'हस्ताक्षर', page: 7, snip: 'sign',
    fields: [
      { id: 'signature', label: 'Sign with your finger', hint: 'Done once, kept for every match', type: 'sign', keep: true, optional: true, put: [{ p: 7, img: [342, 606, 490, 634] }] },
    ],
  },
];

// header lines repeated on whichever pitch page is used
const PITCH_HEADERS = {
  6: { tournament: { x: 99, b: 96.8, w: 133 }, team1: { x: 265, b: 96.8, w: 94 }, team2: { x: 381, b: 96.8, w: 94 }, ground: { x: 77, b: 118, w: 119 }, dates: { x: 234, b: 118, w: 122 } },
  7: { tournament: { x: 103, b: 91.3, w: 122 }, team1: { x: 258, b: 91.3, w: 116 }, team2: { x: 396, b: 91.3, w: 105 }, ground: { x: 82, b: 112.6, w: 162 }, dates: { x: 281, b: 112.6, w: 143 } },
};

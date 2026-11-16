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

const ACC = { Excellent: 301, Satisfactory: 358, 'Sub-standard': 425.5, Bad: 482 };
const FOOD = { Excellent: 280, Satisfactory: 347.5, Substandard: 407.5, Bad: 471 };
const TEAM = { Excellent: 301, Satisfactory: 354.5, Average: 411.5 };
const STYLE = { Aggressive: 301, Positive: 354.5, Autocratic: 411.5, Passive: 475 };
const GROUND = { Good: 390, Average: 436, Poor: 482 };
const ADMIN = { Excellent: 297, Satisfactory: 351, Substandard: 418.5, Bad: 482.5 };
const MD = { Good: 257, Average: 331.5, Poor: 408 };
const BAD_WORDS = ['Sub-standard', 'Substandard', 'Bad', 'Poor'];

function teamBlock(n, nameB, coachB, r, styleRow, players) {
  const t = `t${n}`;
  return {
    id: `teams${n}`, num: '3', title: n === 1 ? 'Teams: team 1' : 'Teams: team 2', teamRef: `team${n}`,
    fields: [
      { id: `${t}Coach`, label: 'Coach', type: 'text', put: [{ p: 3, x: 88, b: coachB, w: 184 }] },
      { id: `${t}Disc`, label: 'Discipline / grooming of the players', type: 'choice', opts: Object.keys(TEAM), put: row(3, TEAM, r[0], r[1]) },
      { id: `${t}Gear`, label: 'Availability of cricket gear for team members', type: 'choice', opts: Object.keys(TEAM), put: row(3, TEAM, r[1], r[2]) },
      { id: `${t}Appr`, label: 'Approach towards the game', type: 'choice', opts: Object.keys(TEAM), put: row(3, TEAM, r[2], r[3]) },
      { id: `${t}Style`, label: 'Coaching style / approach towards the team', hint: n === 1 ? 'Only for teams up to U/18' : 'Only for teams up to U/19', type: 'choice', opts: Object.keys(STYLE), put: row(3, STYLE, styleRow[0], styleRow[1]) },
      ...players.map((y, i) => ({
        id: `${t}P${i + 1}`, label: `Potentially talented player ${i + 1}`, type: 'pair', a: 'Name', b: 'Proficiency (e.g. opening bat)',
        putA: [{ p: 3, cell: [276, y[0], 440, y[1]] }], putB: [{ p: 3, cell: [440, y[0], 510, y[1]] }],
      })),
    ],
  };
}

const SECTIONS = [
  {
    id: 'match', num: '', title: 'Match details', hi: 'मैच की जानकारी',
    fields: [
      { id: 'refName', label: "Referee's name", type: 'text', keep: true, put: [{ p: 1, x: 199, b: 683.5, w: 300 }, { p: 7, x: 156, b: 633.5, w: 128 }] },
      { id: 'tournament', label: 'Tournament', type: 'text', list: ['C.T. Sarwate Trophy', 'Madhavrao Scindia Trophy', 'J.N. Bhaya Trophy'], put: [{ p: 1, x: 143, b: 499, w: 355 }] },
      { id: 'format', label: 'Format', hint: 'Decides which pitch page is filled (page 6 or 7) and the file name', type: 'choice', opts: FORMATS.map(f => f[1]), put: {} },
      { id: 'category', label: 'Category', hint: 'Used in the file name', type: 'select', opts: CATEGORIES.map(c => `${c[0]} (${c[1]})`), put: [] },
      { id: 'matchNo', label: 'Match no.', hint: 'Used in the file name, e.g. 12', type: 'text', inputmode: 'numeric', put: [] },
      { id: 'segment', label: 'Segment', type: 'choice', opts: ['League', 'Super League', 'Knock out'], put: {
        League: [oval(1, 215.6, 513.4, 248.1, 524.3)], 'Super League': [oval(1, 258.4, 513.4, 320.7, 524.3)], 'Knock out': [oval(1, 331.1, 513.4, 376.3, 524.3)] } },
      { id: 'division', label: 'Staging association (division)', hint: 'Printed before "Divisional Cricket Association"', type: 'text', list: DIVISIONS, put: [{ p: 1, x: 218, b: 554, w: 97 }] },
      { id: 'ground', label: 'Ground', type: 'text', put: [{ p: 1, x: 216, b: 587, w: 284 }] },
      { id: 'dates', label: 'Date/s', hint: 'e.g. 18-21 Nov 2026', type: 'text', put: [{ p: 1, cell: [139, 631, 202, 652] }] },
      { id: 'team1', label: 'Team 1', type: 'text', list: DIVISIONS, put: [{ p: 1, cell: [202, 631, 329, 652] }, { p: 3, x: 86, b: 77, w: 186 }] },
      { id: 'team2', label: 'Team 2', type: 'text', list: DIVISIONS, put: [{ p: 1, cell: [351, 631, 500, 652] }, { p: 3, x: 86, b: 328.5, w: 186 }] },
    ],
  },
  {
    id: 'acc', num: '1', title: 'Accommodation', hi: 'होटल का नाम और रेटिंग',
    fields: [
      ...[['T1', 'Team 1', 137, 167], ['T2', 'Team 2', 167, 191], ['Ump', 'Umpires / scorer', 191, 211], ['Sel', 'Selectors', 211, 231]].flatMap(([k, label, y0, y1]) => [
        { id: `acc${k}Hotel`, label: `${label}: hotel`, teamLabel: k === 'T1' ? 'team1' : k === 'T2' ? 'team2' : null, type: 'text', put: [{ p: 2, cell: [127, y0, 276, y1] }] },
        { id: `acc${k}Rate`, label: `${label}: rating`, teamLabel: k === 'T1' ? 'team1' : k === 'T2' ? 'team2' : null, type: 'choice', opts: Object.keys(ACC), put: row(2, ACC, y0, y1) },
      ]),
      { id: 'accReason', label: 'Reason/s for sub-standard / bad', type: 'area', reasonFor: /^acc.*Rate$/, put: [{ p: 2, box: [43, 245, 502, 304] }] },
    ],
  },
  {
    id: 'food', num: '2', title: 'Food arrangement (match day)', hi: 'नाश्ता, लंच, चाय, पानी',
    fields: [
      ...[['Bf', 'Breakfast', 508, 531], ['Lunch', 'Lunch', 531, 553], ['Tea', 'Tea', 553, 575], ['Post', 'Post match', 575, 597]].map(([k, label, y0, y1]) => (
        { id: `food${k}`, label, type: 'choice', opts: Object.keys(FOOD), put: row(2, FOOD, y0, y1) })),
      { id: 'waterSrc', label: 'Water', type: 'choice', opts: ['Packaged / RO', 'Tap water'], put: row(2, { 'Packaged / RO': 280, 'Tap water': 347.5 }, 619, 641) },
      { id: 'waterQty', label: 'Water quantity', type: 'choice', opts: ['Adequate', 'Inadequate'], put: row(2, { Adequate: 407.5, Inadequate: 471 }, 619, 641) },
      { id: 'foodReason', label: 'Reason/s for substandard / bad', type: 'area', reasonFor: /^(food|waterQty)/, put: [{ p: 2, box: [40, 668, 503, 736] }] },
    ],
  },
  teamBlock(1, 77, 95.5, [100, 122, 144, 167], [189, 211], [[233, 255], [255, 277], [277, 299]]),
  teamBlock(2, 328.5, 347.5, [360, 382, 404, 426], [448, 470], [[492, 514], [514, 537], [537, 559]]),
  {
    id: 'practice', num: '4', title: 'Practice facilities', hi: 'मैच से एक दिन पहले की प्रैक्टिस',
    fields: [
      { id: 'pConv', label: 'Local conveyance provided to visiting team', type: 'choice', opts: ['Yes', 'No'], put: { Yes: [tick(3, 316, 608.5)], No: [tick(3, 314, 631)] } },
      { id: 'pVehicle', label: 'Type of vehicle', showIf: ['pConv', 'Yes'], type: 'text', put: [{ p: 3, x: 403, b: 612, w: 98 }] },
      { id: 'pConvReason', label: 'Reason (no conveyance)', showIf: ['pConv', 'No'], type: 'text', put: [{ p: 3, x: 368, b: 634.5, w: 133 }] },
      { id: 'pDuration', label: 'Duration of nets offered', hint: 'e.g. 2.5 hours', type: 'text', put: [{ p: 3, cell: [276, 648, 503, 670] }] },
      { id: 'pNets', label: 'No. of nets offered', type: 'text', inputmode: 'numeric', put: [{ p: 3, cell: [276, 670, 503, 692] }] },
      { id: 'pCoord', label: 'Presence of coordinator for visiting teams', type: 'choice', opts: ['Yes', 'No'], put: { Yes: [tick(3, 316, 697)], No: [tick(3, 368, 697)] } },
      { id: 'pSnacks', label: 'Arrangement of snacks', type: 'choice', opts: ['Yes', 'No'], put: { Yes: [tick(3, 316, 719)], No: [tick(3, 368, 719)] } },
      { id: 'pOverall', label: 'Overall arrangements', type: 'choice', opts: ['Good', 'Average', 'Poor'], put: { Good: [tick(3, 322, 741)], Average: [tick(3, 409, 741)], Poor: [tick(3, 471, 741)] } },
    ],
  },
  {
    id: 'ground', num: '5', title: 'Ground / match facilities', hi: 'ग्राउंड की सुविधाएँ',
    fields: [
      { id: 'gVehicle', label: 'Local conveyance: vehicle type', type: 'text', put: [{ p: 4, x: 198, b: 78, w: 56 }] },
      { id: 'gCapacity', label: 'Local conveyance: capacity', type: 'text', inputmode: 'numeric', put: [{ p: 4, x: 304, b: 78, w: 63 }] },
      { id: 'gPunct', label: 'Local conveyance: punctuality', type: 'text', put: [{ p: 4, x: 195, b: 96.5, w: 171 }] },
      { id: 'gEffect', label: 'Local conveyance: overall effectiveness', type: 'text', put: [{ p: 4, x: 238, b: 115, w: 128 }] },
      { id: 'gConvRate', label: 'Local conveyance: rating', type: 'choice', opts: Object.keys(GROUND), put: row(4, GROUND, 70, 119) },
      { id: 'gDrTeams', label: 'Dressing room: teams', type: 'choice', opts: Object.keys(GROUND), put: row(4, GROUND, 119, 149) },
      { id: 'gDrUmp', label: 'Dressing room: umpires', type: 'choice', opts: Object.keys(GROUND), put: row(4, GROUND, 149, 179) },
      { id: 'gDrScorer', label: 'Work station: scorer', type: 'choice', opts: Object.keys(GROUND), put: row(4, GROUND, 179, 201) },
      { id: 'gDrSel', label: 'Work station: selectors & referee', type: 'choice', opts: Object.keys(GROUND), put: row(4, GROUND, 201, 223) },
      { id: 'gsName', label: 'Name of main ground staff', type: 'text', put: [{ p: 4, cell: [369, 223, 503, 245] }] },
      { id: 'gsRate', label: 'Main ground staff: knowledge / work ethics / initiative / punctuality', type: 'choice', opts: Object.keys(GROUND), put: row(4, GROUND, 245, 267) },
      { id: 'gsHelpers', label: 'No. of assistants / helpers', type: 'text', inputmode: 'numeric', put: [{ p: 4, x: 262, b: 281.5, w: 104 }] },
      { id: 'gsHelpersRate', label: 'Assistants / helpers: rating', type: 'choice', opts: Object.keys(GROUND), put: row(4, GROUND, 267, 289) },
      { id: 'rollMech', label: 'Rollers: mechanical', hint: 'Nos., approx. weight, working condition', type: 'text', put: [{ p: 4, x: 155, b: 335.5, w: 211 }] },
      { id: 'rollManual', label: 'Rollers: manual', hint: 'Nos., approx. weight, working condition', type: 'text', prefix: 'Manual: ', put: [{ p: 4, x: 140, b: 345.3, w: 226, size: 7.5 }] },
      { id: 'rollRate', label: 'Rollers: rating', type: 'choice', opts: Object.keys(GROUND), put: row(4, GROUND, 289, 348) },
      { id: 'gBoundary', label: 'Boundary marking', type: 'choice', opts: Object.keys(GROUND), put: row(4, GROUND, 348, 404) },
      { id: 'gScoreboard', label: 'Scoreboard', type: 'choice', opts: Object.keys(GROUND), put: row(4, GROUND, 404, 433) },
      { id: 'gSight', label: 'Sightscreen', type: 'choice', opts: Object.keys(GROUND), put: row(4, GROUND, 433, 476) },
      { id: 'gCovers', label: 'Covers', type: 'choice', opts: Object.keys(GROUND), put: row(4, GROUND, 476, 505) },
      { id: 'gSopperCond', label: 'Super sopper: working condition', hint: 'Leave blank if not available', type: 'text', put: [{ p: 4, box: [138, 515, 368, 541], pad: 2 }] },
      { id: 'gSopper', label: 'Super sopper: rating', type: 'choice', opts: Object.keys(GROUND), put: row(4, GROUND, 505, 541) },
      { id: 'gSpares', label: 'Availability of spare stumps, bails, markers, crease tools, towels', type: 'choice', opts: Object.keys(GROUND), put: row(4, GROUND, 541, 570) },
      { id: 'gOverall', label: 'Overall rating of facilities', type: 'choice', opts: Object.keys(GROUND), put: row(4, GROUND, 570, 591) },
      { id: 'gPoorReason', label: 'Reasons if any rating is POOR', type: 'area', reasonFor: /^(g|roll)/, put: [{ p: 4, box: [135, 591, 503, 660] }] },
    ],
  },
  {
    id: 'other', num: '6-8', title: 'Placards, Cricbooks, code of conduct', hi: 'प्लेकार्ड, क्रिकबुक्स ऐप, आचार संहिता',
    fields: [
      { id: 'placardRef', label: "Players' placard checked by referee", type: 'choice', opts: ['Yes'], put: { Yes: [tick(4, 232, 676)] } },
      { id: 'placardUmp', label: "Players' placard checked by umpires", type: 'choice', opts: ['Yes'], put: { Yes: [tick(4, 334, 676)] } },
      { id: 'cricbooks', label: 'Working of Cricbooks app', hint: 'Report separately if any problem', type: 'choice', opts: ['Good', 'Poor'], put: {
        Good: [oval(4, 175.3, 693.6, 198.4, 703.3)], Poor: [oval(4, 203.9, 693.6, 224.8, 703.3)] } },
      { id: 'coc', label: "Violation of 'Code of Conduct'", hint: 'Printed after "Separate annexure"', type: 'text', list: ['Nil', 'Annexure attached'], put: [{ p: 4, x: 392, b: 724, w: 110 }] },
    ],
  },
  {
    id: 'admin', num: '9', title: 'Overall administration', hi: 'मेज़बान एसोसिएशन का प्रबंधन',
    fields: [
      { id: 'aCoord', label: 'Administrative coordination on part of host association', type: 'choice', opts: Object.keys(ADMIN), put: row(5, ADMIN, 69, 98) },
      { id: 'aHosp', label: 'General hospitality / transportation to teams / match officials', type: 'choice', opts: Object.keys(ADMIN), put: row(5, ADMIN, 98, 127) },
      { id: 'aGriev', label: 'Availability of authorities for grievance redress', type: 'choice', opts: Object.keys(ADMIN), put: row(5, ADMIN, 127, 157) },
      { id: 'aMedia', label: 'Media publicity / coverage for the match', type: 'choice', opts: Object.keys(ADMIN), put: row(5, ADMIN, 157, 186) },
      { id: 'adminReason', label: 'Reason/s for substandard / bad', type: 'area', reasonFor: /^a(Coord|Hosp|Griev|Media)$/, put: [{ p: 5, box: [38, 207, 513, 332] }] },
    ],
  },
  {
    id: 'selectors', num: '10', title: 'State selectors who witnessed the match', hi: 'मैच देखने आए सिलेक्टर',
    fields: [396, 418, 440, 462, 484, 506].map((y, i) => ({
      id: `sel${i + 1}`, label: `Selector ${i + 1}`, type: 'pair', a: 'Name', b: 'Date/s',
      putA: [{ p: 5, cell: [41, y, 248, y + 22] }], putB: [{ p: 5, cell: [248, y, 511, y + 22] }],
    })),
  },
  {
    id: 'pitchMD', num: '', title: 'Pitch and outfield: multi-day', hi: 'पिच और आउटफ़ील्ड (पेज 6)', showIf: ['format', 'Multi-day'],
    fields: [
      { id: 'mdPitch', label: 'Pitch', type: 'choice', opts: Object.keys(MD), put: row(6, MD, 544, 566) },
      { id: 'mdOutfield', label: 'Outfield', type: 'choice', opts: Object.keys(MD), put: row(6, MD, 566, 588) },
      { id: 'mdReason', label: 'Reason/s for POOR', type: 'area', reasonFor: /^md(Pitch|Outfield)$/, put: [{ p: 6, box: [53, 619, 491, 726] }] },
    ],
  },
  {
    id: 'pitchLO', num: '', title: 'Pitch and outfield: limited overs', hi: 'पिच और आउटफ़ील्ड (पेज 7)', showIf: ['format', ['One day', 'T20']],
    fields: [
      { id: 'loBat', label: '1. Conducive for batting', type: 'choice', opts: ['Yes', 'No'], put: column(7, 267.5, ['Yes', 'No'], [320, 342, 365]) },
      { id: 'loMoist', label: '2. Moisture & grass cover', type: 'choice', opts: ['No', 'Slight', 'Decent', 'Excessive'], put: column(7, 491, ['No', 'Slight', 'Decent', 'Excessive'], [320, 331, 342, 354, 365]) },
      { id: 'loBounce', label: '3. Consistency of bounce', type: 'choice', opts: ['Throughout', 'Mostly', 'Irregular', 'Erratic'], put: column(7, 267.5, ['Throughout', 'Mostly', 'Irregular', 'Erratic'], [365, 376, 388, 399, 410]) },
      { id: 'loCarry', label: '4. Carry', type: 'choice', opts: ['No', 'Slight', 'Decent', 'Excessive'], put: column(7, 491, ['No', 'Slight', 'Decent', 'Excessive'], [365, 376, 388, 399, 410]) },
      { id: 'loSeam', label: '5. Seam movement', type: 'choice', opts: ['No', 'Slight', 'Decent', 'Excessive'], put: column(7, 267.5, ['No', 'Slight', 'Decent', 'Excessive'], [410, 422, 433, 444, 456]) },
      { id: 'loSpin', label: '6. Spin', type: 'choice', opts: ['No', 'Slight', 'Decent', 'Excessive'], put: column(7, 491, ['No', 'Slight', 'Decent', 'Excessive'], [410, 422, 433, 444, 456]) },
      { id: 'loPitch', label: 'Overall rating: pitch', type: 'choice', opts: ['Very good', 'Good', 'Satisfactory', 'Average', 'Poor'], put: column(7, 332, ['Very good', 'Good', 'Satisfactory', 'Average', 'Poor'], [502, 520, 539, 557, 576, 595]) },
      { id: 'loOutfield', label: 'Overall rating: outfield', type: 'choice', opts: ['Very good', 'Good', 'Satisfactory', 'Average', 'Poor'], put: column(7, 441, ['Very good', 'Good', 'Satisfactory', 'Average', 'Poor'], [502, 520, 539, 557, 576, 595]) },
    ],
  },
  {
    id: 'sign', num: '', title: 'Sign and send', hi: 'हस्ताक्षर और भेजना',
    fields: [
      { id: 'extra', label: 'Any other remarks', hint: 'Optional. Printed on an extra page at the end, as the form allows supplements', type: 'area', put: [] },
      { id: 'signature', label: 'Signature', hint: 'Sign once with your finger, it is remembered for the next match', type: 'sign', keep: true, put: [{ p: 7, img: [342, 606, 490, 634] }] },
    ],
  },
];

// header lines repeated on whichever pitch page is used
const PITCH_HEADERS = {
  6: { tournament: { x: 99, b: 96.8, w: 133 }, team1: { x: 265, b: 96.8, w: 94 }, team2: { x: 381, b: 96.8, w: 94 }, ground: { x: 77, b: 118, w: 119 }, dates: { x: 234, b: 118, w: 122 } },
  7: { tournament: { x: 103, b: 91.3, w: 122 }, team1: { x: 258, b: 91.3, w: 116 }, team2: { x: 396, b: 91.3, w: 105 }, ground: { x: 82, b: 112.6, w: 162 }, dates: { x: 281, b: 112.6, w: 143 } },
};

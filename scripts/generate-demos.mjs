// Generates the two-frame exercise demo illustrations in public/demos.
// Every scene uses only the home equipment the routine allows: Perfect Pushup handles,
// a doorway bar, dumbbells, a chair, and the floor. Run with: node scripts/generate-demos.mjs
import { mkdirSync, writeFileSync } from 'node:fs';

const OUT = new URL('../public/demos/', import.meta.url);
const W = 800;
const H = 360;
const F = 330; // floor line

const BODY = '#3f3f46';
const PROP = '#a1a1aa';
const ACCENT = '#10b981';
const CUE = '#d97706';

const line = ([x1, y1], [x2, y2], w, color = BODY) =>
  `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="${color}" stroke-width="${w}" stroke-linecap="round" fill="none"/>`;

/** Side-view figure from joint positions, split so props can sit between body and arm. */
function figure(j) {
  const body = [];
  if (j.toe) body.push(line(j.ankle, j.toe, 18));
  body.push(line(j.ankle, j.knee, 30), line(j.knee, j.hip, 36), line(j.hip, j.shoulder, 46));
  body.push(`<circle cx="${j.head[0]}" cy="${j.head[1]}" r="26" fill="${BODY}"/>`);
  // The near arm gets a light outline so it reads in front of the torso.
  const arm = [
    line(j.shoulder, j.elbow, 32, '#fafafa'), line(j.elbow, j.hand, 28, '#fafafa'),
    line(j.shoulder, j.elbow, 26), line(j.elbow, j.hand, 22),
  ];
  return { body: body.join('\n'), arm: arm.join('\n') };
}

/** Draws body, then props, then the arm on top. */
const scene = (j, ...props) => {
  const f = figure(j);
  return [f.body, ...props, f.arm].join('\n');
};

const dumbbell = ([x, y], r = 22) =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="${ACCENT}"/><circle cx="${x}" cy="${y}" r="${r * 0.38}" fill="#065f46"/>`;

/** Perfect Pushup handle, side view: domed base with the grip on top. */
const HAND_Y = 278; // centre of the handle grips
const handle = (x) =>
  `<path d="M${x - 34} ${F} Q${x} ${F - 44} ${x + 34} ${F} Z" fill="${PROP}"/>` +
  `<rect x="${x - 5}" y="${F - 52}" width="10" height="34" rx="3" fill="#71717a"/>` +
  `<rect x="${x - 11}" y="${F - 58}" width="22" height="12" rx="6" fill="#52525b"/>`;

/** Dashed line at grip height: the reference that shows how deep a push-up goes. */
const gripLine = (text) =>
  `<line x1="360" y1="${HAND_Y}" x2="690" y2="${HAND_Y}" stroke="${CUE}" stroke-width="2" stroke-dasharray="7 6"/>` +
  `<text x="690" y="${HAND_Y - 8}" text-anchor="end" font-family="system-ui, sans-serif" font-size="15" font-weight="700" fill="${CUE}">${text}</text>`;

/** Top-down inset showing handle orientation: neutral (parallel) or rotated inward. */
function rotationInset(rotated, spread = 22) {
  const cx = 715;
  const cy = 78;
  const grip = (dx, angle) =>
    `<rect x="${cx + dx - 7}" y="${cy - 24}" width="14" height="48" rx="7" fill="${rotated ? ACCENT : '#71717a'}" transform="rotate(${angle} ${cx + dx} ${cy})"/>`;
  const a = rotated ? 35 : 0;
  return [
    `<circle cx="${cx}" cy="${cy}" r="52" fill="#ffffff" stroke="#d4d4d8" stroke-width="3"/>`,
    grip(-spread, a),
    grip(spread, -a),
    `<text x="${cx}" y="${cy + 74}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="17" font-weight="700" fill="${rotated ? '#047857' : '#71717a'}">${rotated ? 'TURNED IN' : 'NEUTRAL'}</text>`,
  ].join('\n');
}

/** Doorway frame with the bar seen end-on. */
const doorBar = ([x, y]) =>
  `<rect x="${x - 9}" y="12" width="18" height="${F - 12}" fill="#e4e4e7"/>`;

/** The bar itself, drawn after the figure so the grip reads on top of the hand. */
const barEnd = ([x, y]) => `<circle cx="${x}" cy="${y}" r="12" fill="#52525b" stroke="#fafafa" stroke-width="3"/>`;

/** Chair, side view. backSide: which side the backrest is on. */
function chair(x, seatY, backSide = 'right') {
  const w = 96;
  const bx = backSide === 'right' ? x + w - 8 : x;
  return [
    `<rect x="${x + 4}" y="${seatY}" width="8" height="${F - seatY}" fill="${PROP}"/>`,
    `<rect x="${x + w - 12}" y="${seatY}" width="8" height="${F - seatY}" fill="${PROP}"/>`,
    `<rect x="${bx}" y="${seatY - 100}" width="8" height="100" fill="${PROP}"/>`,
    `<rect x="${x}" y="${seatY - 6}" width="${w}" height="12" rx="3" fill="#71717a"/>`,
  ].join('\n');
}

function arrow([x1, y1], [x2, y2], text, textPos) {
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const h = (da) => `${x2 - 16 * Math.cos(ang + da)} ${y2 - 16 * Math.sin(ang + da)}`;
  return (
    `<g stroke="${CUE}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none">` +
    `<path d="M${x1} ${y1} L${x2} ${y2}"/><path d="M${h(0.5)} L${x2} ${y2} L${h(-0.5)}"/></g>` +
    (text
      ? `<text x="${textPos[0]}" y="${textPos[1]}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="17" font-weight="700" fill="${CUE}">${text}</text>`
      : '')
  );
}

function svg(label, ...content) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">
<rect width="${W}" height="${H}" fill="#fafafa"/>
<line x1="20" y1="${F + 2}" x2="${W - 20}" y2="${F + 2}" stroke="#d4d4d8" stroke-width="4"/>
<text x="24" y="40" font-family="system-ui, sans-serif" font-size="24" font-weight="700" fill="#52525b">${label}</text>
${content.join('\n')}
</svg>
`;
}

// ---- Poses ----

// Deficit: the chest sinks well below the grips, nearly to the floor.
const deficitBottom = {
  toe: [112, 326], ankle: [130, 318], knee: [230, 314], hip: [330, 309],
  shoulder: [505, 304], head: [562, 298], elbow: [456, 262], hand: [520, HAND_Y],
};
// Standard: the chest stops level with the grips.
const standardBottom = {
  toe: [112, 326], ankle: [130, 318], knee: [230, 308], hip: [330, 299],
  shoulder: [505, 282], head: [562, 274], elbow: [460, 252], hand: [520, HAND_Y],
};
const pushupTop = {
  toe: [112, 326], ankle: [130, 318], knee: [228, 280], hip: [325, 243],
  shoulder: [520, 168], head: [577, 154], elbow: [520, 223], hand: [520, HAND_Y],
};
// Close grip: elbows stay tucked back along the ribs.
const closeBottom = { ...standardBottom, shoulder: [500, 284], head: [557, 276], elbow: [446, 292] };

const rowHang = {
  toe: [150, 312], ankle: [130, 322], knee: [230, 300], hip: [330, 280],
  shoulder: [520, 258], head: [575, 252], elbow: [520, 220], hand: [520, 180],
};
const rowApex = {
  toe: [150, 312], ankle: [130, 322], knee: [225, 289], hip: [320, 256],
  shoulder: [505, 200], head: [558, 186], elbow: [450, 222], hand: [520, 180],
};

// The doorway bar's lowest setting is about waist height, so the incline is steep.
const BAR_WAIST = [540, 186];
const inclineTop = {
  toe: [112, 326], ankle: [130, 318], knee: [233, 261], hip: [335, 204],
  shoulder: [522, 100], head: [575, 82], elbow: [531, 143], hand: [540, 186],
};
const inclineBottom = {
  toe: [112, 326], ankle: [130, 318], knee: [228, 280], hip: [322, 243],
  shoulder: [505, 172], head: [557, 154], elbow: [458, 140], hand: [540, 186],
};
// Chair seat is lower, so the incline is shallower and harder.
const CHAIR_X = 500;
const chairTop = {
  toe: [112, 326], ankle: [130, 318], knee: [230, 273], hip: [322, 232],
  shoulder: [508, 148], head: [561, 130], elbow: [510, 196], hand: [508, 244],
};
const chairBottom = {
  toe: [112, 326], ankle: [130, 318], knee: [230, 288], hip: [322, 260],
  shoulder: [492, 208], head: [545, 190], elbow: [455, 226], hand: [508, 244],
};

const standing = { toe: [432, 328], ankle: [402, 322], knee: [404, 252], hip: [406, 182], shoulder: [410, 84], head: [414, 46] };
const curlDown = { ...standing, elbow: [412, 140], hand: [416, 196] };
const curlUp = { ...standing, elbow: [412, 140], hand: [452, 98] };

const hinge = { toe: [412, 328], ankle: [382, 322], knee: [398, 262], hip: [362, 196], shoulder: [462, 112], head: [500, 90] };
const rowDown = { ...hinge, elbow: [464, 172], hand: [466, 230] };
const rowUp = { ...hinge, elbow: [398, 124], hand: [404, 184] };

const SEAT = 252;
const seated = { toe: [494, 328], ankle: [462, 322], knee: [456, 240], hip: [372, 240], shoulder: [378, 150], head: [384, 112] };
const extStretch = { ...seated, elbow: [404, 92], hand: [352, 118] };
const extLockout = { ...seated, elbow: [404, 92], hand: [408, 36] };

const dipTop = {
  toe: [200, 326], ankle: [225, 320], knee: [333, 284], hip: [440, 246],
  shoulder: [466, 150], head: [474, 112], elbow: [468, 196], hand: [472, 238],
};
const dipBottom = {
  toe: [200, 326], ankle: [225, 320], knee: [333, 306], hip: [442, 292],
  shoulder: [460, 204], head: [466, 166], elbow: [512, 200], hand: [474, 238],
};

const bridge = { toe: [148, 316], ankle: [200, 308], knee: [265, 164], hip: [410, 196], shoulder: [590, 286], head: [652, 286] };
const pressTop = { ...bridge, elbow: [586, 196], hand: [586, 110] };
const pressBottom = { ...bridge, elbow: [530, 314], hand: [530, 234] };

// Lying flat (hips down), knees bent.
const flat = { toe: [148, 316], ankle: [200, 308], knee: [265, 196], hip: [380, 300], shoulder: [570, 300], head: [632, 296] };
const flyOpen = { ...flat, elbow: [548, 262], hand: [528, 306] };
const flyTop = { ...flat, elbow: [572, 220], hand: [572, 138] };
const squeezeBottom = { ...bridge, elbow: [540, 300], hand: [578, 246] };


// Chin-up: bar overhead, seen end-on.
const BAR_HIGH = [420, 70];
const chinHang = {
  toe: [372, 324], ankle: [384, 316], knee: [432, 298], hip: [412, 258],
  shoulder: [420, 160], head: [442, 128], elbow: [420, 115], hand: [420, 70],
};
const chinTop = {
  toe: [380, 262], ankle: [392, 256], knee: [440, 238], hip: [420, 196],
  shoulder: [428, 98], head: [450, 44], elbow: [452, 112], hand: [420, 70],
};

const reverseFlyUp = { ...hinge, elbow: [486, 132], hand: [500, 120] };

const gobletTop = { ...standing, elbow: [426, 138], hand: [440, 112] };
const gobletBottom = {
  toe: [432, 328], ankle: [402, 322], knee: [470, 262], hip: [370, 262],
  shoulder: [408, 170], head: [424, 134], elbow: [440, 212], hand: [454, 190],
};
const rdlTop = { ...standing, elbow: [412, 140], hand: [414, 194] };
const rdlBottom = {
  toe: [432, 328], ankle: [402, 322], knee: [412, 258], hip: [358, 190],
  shoulder: [470, 150], head: [508, 136], elbow: [470, 206], hand: [470, 258],
};
// Split squat: back foot up on a chair behind (left). Back leg drawn separately.
const splitTop = {
  toe: [462, 328], ankle: [432, 322], knee: [436, 252], hip: [404, 182],
  shoulder: [406, 84], head: [410, 46], elbow: [408, 140], hand: [410, 194],
};
const splitBottom = {
  toe: [462, 328], ankle: [432, 322], knee: [452, 254], hip: [380, 244],
  shoulder: [388, 146], head: [392, 108], elbow: [390, 202], hand: [392, 256],
};
const lungeBottom = {
  toe: [470, 328], ankle: [440, 322], knee: [448, 252], hip: [382, 246],
  shoulder: [388, 148], head: [392, 110], elbow: [390, 204], hand: [392, 258],
};
const calfDown = { ...standing, elbow: [412, 140], hand: [414, 194] };
const calfUp = {
  toe: [432, 328], ankle: [410, 300], knee: [410, 232], hip: [412, 162],
  shoulder: [416, 66], head: [420, 30], elbow: [418, 122], hand: [420, 176],
};
const wallHalf = {
  toe: [462, 328], ankle: [432, 322], knee: [418, 212], hip: [332, 196],
  shoulder: [326, 98], head: [330, 60], elbow: [356, 160], hand: [388, 196],
};
const wallHold = {
  toe: [462, 328], ankle: [432, 322], knee: [432, 236], hip: [332, 236],
  shoulder: [326, 138], head: [330, 100], elbow: [366, 200], hand: [410, 230],
};

const legLine = (pts) => pts.slice(1).map((p, i) => line(pts[i], p, i === 0 ? 34 : 30)).join('\n');
const wall = `<rect x="280" y="12" width="20" height="${F - 12}" fill="#e4e4e7"/>`;
const pairDumbbells = ([x, y]) => dumbbell([x - 8, y], 22) + dumbbell([x + 8, y], 22);

/** Front-view figure for band pull-aparts. */
function bandFront(wide) {
  const cx = 400;
  const handL = wide ? [272, 112] : [384, 118];
  const handR = wide ? [528, 112] : [416, 118];
  const parts = [
    line([cx - 22, 205], [cx - 30, 324], 30), line([cx + 22, 205], [cx + 30, 324], 30),
    line([cx, 110], [cx, 200], 60),
    `<circle cx="${cx}" cy="64" r="28" fill="${BODY}"/>`,
    line([cx - 40, 104], handL, 22), line([cx + 40, 104], handR, 22),
    `<path d="M${handL[0]} ${handL[1]} L${handR[0]} ${handR[1]}" stroke="#f97316" stroke-width="7" stroke-linecap="round"/>`,
  ];
  return parts.join('\n');
}

/** Small front-view inset for flyes: arms open wide vs together over the chest. */
function flyInset(open) {
  const cx = 715;
  const cy = 86;
  const arms = open
    ? [line([cx - 14, cy], [cx - 46, cy + 6], 7, ACCENT), line([cx + 14, cy], [cx + 46, cy + 6], 7, ACCENT)]
    : [line([cx - 12, cy], [cx - 4, cy - 36], 7, ACCENT), line([cx + 12, cy], [cx + 4, cy - 36], 7, ACCENT)];
  return [
    `<circle cx="${cx}" cy="${cy - 8}" r="58" fill="#ffffff" stroke="#d4d4d8" stroke-width="3"/>`,
    line([cx, cy], [cx, cy + 34], 22),
    ...arms,
    `<text x="${cx}" y="${cy + 72}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="17" font-weight="700" fill="#71717a">${open ? 'ARMS WIDE' : 'SQUEEZE'}</text>`,
  ].join('\n');
}

// ---- Scenes ----

const scenes = {
  'perfect-pushup-deficit': [
    svg('Bottom: chest 2 in. BELOW the grips', scene(deficitBottom, handle(520)), gripLine('GRIP HEIGHT'), arrow([630, HAND_Y + 4], [630, 314], '2 IN. DEEPER', [712, 306]), rotationInset(false)),
    svg('Top: rotate handles inward', scene(pushupTop, handle(520)), rotationInset(true)),
  ],
  'perfect-pushup-iso-hold': [
    svg('Hold 5s: deep stretch below the grips', scene(deficitBottom, handle(520)), gripLine('GRIP HEIGHT'), rotationInset(false)),
    svg('Hold 5s: lockout squeeze', scene(pushupTop, handle(520)), rotationInset(true)),
  ],
  'close-grip-perfect-pushup': [
    svg('Handles 6-8 in apart, elbows tucked', scene(closeBottom, handle(520)), rotationInset(false, 9)),
    svg('Lockout: twist handles inward', scene(pushupTop, handle(520)), rotationInset(true, 9)),
  ],
  'low-bar-inverted-row': [
    svg('Hang under waist-high bar', doorBar([520, 180]), scene(rowHang), barEnd([520, 180])),
    svg('Pull sternum to the bar', doorBar([520, 180]), scene(rowApex), barEnd([520, 180])),
  ],
  'incline-pushup-bar': [
    svg('Hands on the bar (lowest setting, waist height)', doorBar(BAR_WAIST), scene(inclineTop), barEnd(BAR_WAIST)),
    svg('Lower chest to the bar, slowly', doorBar(BAR_WAIST), scene(inclineBottom), barEnd(BAR_WAIST), arrow([640, 112], [596, 164], 'PRESS DOWN &amp; AWAY', [690, 100])),
  ],
  'incline-pushup-chair': [
    svg('Hands on the seat, chair against a wall', chair(CHAIR_X, SEAT, 'right'), scene(chairTop)),
    svg('Lower chest to the seat edge', chair(CHAIR_X, SEAT, 'right'), scene(chairBottom), arrow([640, 170], [600, 214], 'PRESS DOWN &amp; AWAY', [690, 158])),
  ],
  'db-bicep-curl': [
    svg('Elbows pinned to ribs', scene(curlDown), dumbbell(curlDown.hand, 18)),
    svg('Curl up, pinkies turn up', scene(curlUp), dumbbell(curlUp.hand, 18)),
  ],
  'bent-over-db-row': [
    svg('Hinge 45°, flat back', scene(rowDown), dumbbell(rowDown.hand, 18)),
    svg('Pull toward hip pockets', scene(rowUp), dumbbell(rowUp.hand, 18)),
  ],
  'overhead-db-tricep-ext': [
    svg('Lower behind head to 90°', chair(326, SEAT, 'left'), scene(extStretch), dumbbell(extStretch.hand, 20)),
    svg('Extend to lockout', chair(326, SEAT, 'left'), scene(extLockout), dumbbell(extLockout.hand, 20)),
  ],
  'bench-dips': [
    svg('Hands on chair edge, legs out', chair(470, SEAT, 'right'), scene(dipTop)),
    svg('Lower until elbows hit 90°', chair(470, SEAT, 'right'), scene(dipBottom)),
  ],
  'glute-bridge-floor-press': [
    svg('Press to lockout', scene(pressTop), dumbbell(pressTop.hand, 30), arrow([410, 288], [410, 238], 'HIPS HIGH', [410, 318])),
    svg('Triceps touch floor, pause', scene(pressBottom), dumbbell(pressBottom.hand, 30), arrow([410, 288], [410, 238], 'HIPS HIGH', [410, 318])),
  ],

  // ---- Added chest / back ----
  'db-floor-fly': [
    svg('Wide arc, upper arms touch floor', scene(flyOpen), dumbbell(flyOpen.hand, 22), flyInset(true)),
    svg('Hug back up, squeeze 1s', scene(flyTop), dumbbell(flyTop.hand, 22), flyInset(false)),
  ],
  'bridge-squeeze-press': [
    svg('Hips up, crush dumbbells together', scene(squeezeBottom), pairDumbbells(squeezeBottom.hand), arrow([410, 288], [410, 238], 'HIPS HIGH', [410, 318])),
    svg('Press up, keep squeezing', scene(pressTop), pairDumbbells(pressTop.hand), arrow([410, 288], [410, 238], 'HIPS HIGH', [410, 318])),
  ],
  'band-pull-apart': [
    svg('Arms straight, band at shoulder height', bandFront(false)),
    svg('Pull apart to your chest, squeeze', bandFront(true)),
  ],
  'db-reverse-fly': [
    svg('Hinge, light dumbbells hanging', scene(rowDown), dumbbell(rowDown.hand, 16)),
    svg('Raise arms out wide, squeeze', scene(reverseFlyUp), dumbbell(reverseFlyUp.hand, 16)),
  ],
  'chin-up': [
    svg('Underhand grip, hang straight', doorBar(BAR_HIGH), scene(chinHang), barEnd(BAR_HIGH)),
    svg('Chin over the bar', doorBar(BAR_HIGH), scene(chinTop), barEnd(BAR_HIGH)),
  ],

  // ---- Swaps ----
  'perfect-pushup-standard': [
    svg('Bottom: chest level with the grips, no deeper', scene(standardBottom, handle(520)), gripLine('GRIP HEIGHT'), rotationInset(false)),
    svg('Press up and squeeze', scene(pushupTop, handle(520)), rotationInset(true)),
  ],
  'close-grip-burnout': [
    svg('Close grip, reps to failure', scene(closeBottom, handle(520)), rotationInset(false, 9)),
    svg('Squeeze at the top', scene(pushupTop, handle(520)), rotationInset(true, 9)),
  ],
  'chin-up-negative': [
    svg('Step up: chin over the bar', doorBar(BAR_HIGH), scene(chinTop), barEnd(BAR_HIGH)),
    svg('Lower slowly, 3-5 seconds', doorBar(BAR_HIGH), scene(chinHang), barEnd(BAR_HIGH), arrow([500, 110], [500, 200], 'SLOW', [540, 160])),
  ],

  // ---- Leg Day ----
  'goblet-squat': [
    svg('Dumbbell at chest, stand tall', scene(gobletTop), dumbbell(gobletTop.hand, 20)),
    svg('Sit deep, chest up', scene(gobletBottom), dumbbell(gobletBottom.hand, 20)),
  ],
  'db-rdl': [
    svg('Soft knees, dumbbells at thighs', scene(rdlTop), dumbbell(rdlTop.hand, 18)),
    svg('Hips back, flat back, feel the stretch', scene(rdlBottom), dumbbell(rdlBottom.hand, 18)),
  ],
  'bulgarian-split-squat': [
    svg('Back foot on the chair', chair(150, SEAT, 'left'), legLine([splitTop.hip, [330, 252], [238, 246]]), scene(splitTop), dumbbell(splitTop.hand, 16)),
    svg('Drop the back knee straight down', chair(150, SEAT, 'left'), legLine([splitBottom.hip, [318, 306], [238, 248]]), scene(splitBottom), dumbbell(splitBottom.hand, 16)),
  ],
  'reverse-lunge': [
    svg('Stand tall', scene(calfDown), dumbbell(calfDown.hand, 16)),
    svg('Step back, back knee toward floor', legLine([lungeBottom.hip, [316, 316], [244, 318]]), scene(lungeBottom), dumbbell(lungeBottom.hand, 16)),
  ],
  'db-calf-raise': [
    svg('Heels down, full stretch', scene(calfDown), dumbbell(calfDown.hand, 16)),
    svg('Rise high, pause 1s', scene(calfUp), dumbbell(calfUp.hand, 16)),
  ],
  'wall-sit': [
    svg('Slide down the wall', wall, scene(wallHalf)),
    svg('Thighs parallel, hold', wall, scene(wallHold)),
  ],
};

mkdirSync(OUT, { recursive: true });
for (const [id, frames] of Object.entries(scenes)) {
  frames.forEach((content, i) => writeFileSync(new URL(`${id}-${i}.svg`, OUT), content));
}
console.log(`Wrote ${Object.keys(scenes).length * 2} files to public/demos`);

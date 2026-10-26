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
const handle = (x) =>
  `<path d="M${x - 34} ${F} Q${x} ${F - 34} ${x + 34} ${F} Z" fill="${PROP}"/>` +
  `<rect x="${x - 7}" y="${F - 40}" width="14" height="16" rx="4" fill="#71717a"/>`;

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

const pushupBottom = {
  toe: [112, 326], ankle: [130, 318], knee: [230, 306], hip: [330, 298],
  shoulder: [505, 300], head: [562, 292], elbow: [462, 250], hand: [520, 290],
};
const pushupTop = {
  toe: [112, 326], ankle: [130, 318], knee: [228, 282], hip: [325, 248],
  shoulder: [520, 180], head: [577, 166], elbow: [520, 235], hand: [520, 290],
};
// Close grip: elbows stay tucked back along the ribs.
const closeBottom = { ...pushupBottom, shoulder: [500, 296], head: [557, 288], elbow: [452, 285] };

const rowHang = {
  toe: [150, 312], ankle: [130, 322], knee: [230, 300], hip: [330, 280],
  shoulder: [520, 258], head: [575, 252], elbow: [520, 220], hand: [520, 180],
};
const rowApex = {
  toe: [150, 312], ankle: [130, 322], knee: [225, 289], hip: [320, 256],
  shoulder: [505, 200], head: [558, 186], elbow: [450, 222], hand: [520, 180],
};

const BAR_LOW = [540, 240]; // thigh height
const inclineTop = {
  toe: [112, 326], ankle: [130, 318], knee: [233, 274], hip: [335, 228],
  shoulder: [522, 152], head: [575, 134], elbow: [532, 196], hand: [540, 236],
};
const inclineBottom = {
  toe: [112, 326], ankle: [130, 318], knee: [228, 286], hip: [322, 256],
  shoulder: [505, 222], head: [557, 206], elbow: [458, 192], hand: [540, 236],
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

// ---- Scenes ----

const scenes = {
  'perfect-pushup-deficit': [
    svg('Bottom: chest below handles', scene(pushupBottom, handle(520)), rotationInset(false)),
    svg('Top: rotate handles inward', scene(pushupTop, handle(520)), rotationInset(true)),
  ],
  'perfect-pushup-iso-hold': [
    svg('Hold 5s: deep stretch', scene(pushupBottom, handle(520)), rotationInset(false)),
    svg('Hold 5s: lockout squeeze', scene(pushupTop, handle(520)), rotationInset(true)),
  ],
  'close-grip-perfect-pushup': [
    svg('Handles 6-8 in apart, elbows tucked', scene(closeBottom, handle(520)), rotationInset(false, 12)),
    svg('Lockout: twist handles inward', scene(pushupTop, handle(520)), rotationInset(true, 12)),
  ],
  'low-bar-inverted-row': [
    svg('Hang under waist-high bar', doorBar([520, 180]), scene(rowHang), barEnd([520, 180])),
    svg('Pull sternum to the bar', doorBar([520, 180]), scene(rowApex), barEnd([520, 180])),
  ],
  'incline-pushup-bar': [
    svg('Hands on thigh-high bar', doorBar(BAR_LOW), scene(inclineTop), barEnd(BAR_LOW)),
    svg('Lower sternum to the bar', doorBar(BAR_LOW), scene(inclineBottom), barEnd(BAR_LOW), arrow([600, 170], [556, 222], 'PRESS DOWN &amp; AWAY', [640, 158])),
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
};

mkdirSync(OUT, { recursive: true });
for (const [id, frames] of Object.entries(scenes)) {
  frames.forEach((content, i) => writeFileSync(new URL(`${id}-${i}.svg`, OUT), content));
}
console.log(`Wrote ${Object.keys(scenes).length * 2} files to public/demos`);

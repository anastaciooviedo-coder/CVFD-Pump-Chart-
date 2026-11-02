// Figures copied from the CVFD flow chart (updated 2026-10-30, second revision).
// Nozzle rows: [nozzle psi, PDP psi, flow gpm]. hl = index of the row highlighted on the chart.
export const NOZZLES = {
  sb1516: { name: 'Elkhart Smooth Bore', tip: '15/16"', size: '1-3/4"', len: 200, rows: [[40, 83, 180], [50, 96, 185], [60, 121, 215]], hl: 1 },
  vortex: { name: 'TFT Vortex', tip: '15/16"', size: '1-3/4"', len: 200, rows: [[40, 73, 157], [50, 96, 185], [60, 109, 192], [67, 128, 215]], hl: 1 },
  chief: { name: 'Elkhart Chief XD', tip: 'Fog', size: '1-3/4"', len: 200, rows: [[40, 83, 180], [50, 95, 185], [50, 103, 200]], hl: 1 },
  sb1316: { name: 'Elkhart Smooth Bore', tip: '1-3/16"', size: '2-1/2"', len: 200, rows: [[40, 68, 277], [50, 83, 300], [60, 102, 341]], hl: 1 },
  tft118: { name: 'TFT', tip: '1-1/8"', size: '2-1/2"', len: 200, rows: [[40, 61, 238], [50, 76, 266], [60, 91, 291]], hl: null },
  bumper: {
    name: 'Elkhart Fog', tip: '', size: '1-3/4"', len: 150, rows: [[50, 84, 185]], hl: 0, chartless: true,
    note: 'Front bumper: 50 psi NP + 34 psi friction loss = 84 psi PDP. 34 psi is 150\' of 1-3/4" at 185 gpm on the friction chart.',
  },
};

export const COLORS = { red: '#E0103A', blue: '#0070C0', green: '#00A040', orange: '#F05020', yellow: '#FFE600' };

export const LINES = [
  { id: 'red', color: COLORS.red, name: 'Red', size: '2-1/2"', len: 200, noz: 'sb1316', nozLabel: 'Elkhart Smooth Bore' },
  { id: 'blue', color: COLORS.blue, name: 'Blue', size: '1-3/4"', len: 200, noz: 'vortex', nozLabel: 'TFT Vortex' },
  { id: 'green', color: COLORS.green, name: 'Green', size: '1-3/4"', len: 200, noz: 'chief', nozLabel: 'Elkhart Fog' },
  { id: 'orange', color: COLORS.orange, name: 'Orange', size: '1-3/4"', len: 200, noz: 'sb1516', nozLabel: 'Elkhart Smooth Bore' },
  { id: 'yellow', color: COLORS.yellow, name: 'Yellow', size: '1-3/4"', len: 150, noz: 'bumper', nozLabel: 'Elkhart Fog', where: 'Front bumper' },
  { id: 'tft', color: null, name: 'TFT 1-1/8"', size: '2-1/2"', len: 200, noz: 'tft118', nozLabel: 'TFT smooth bore', where: 'Not a crosslay', extra: true },
];

export const CHART_ORDER = ['sb1516', 'vortex', 'chief', 'sb1316', 'tft118'];

// Friction rows: [gpm, 50', 100', 200', 100' online calc, highlighted]
export const FRICTION = [
  { name: '1-3/4" Combat', rows: [[75, null, 4, 8, 4], [100, null, 7, 14, 7], [125, 5, 10, 20, 10], [150, 7, 15, 30, 15], [165, 9, 18, 36, 18, 1], [185, 11, 23, 46, 23, 1], [200, 13, 26, 52, 26, 1]] },
  { name: '2-1/4" TRU ID', rows: [[100, 1, 3, 5, 3], [150, 3, 6, 12, 6], [200, 5, 11, 22, 11], [250, 8, 17, 34, 17], [300, 12, 24, 49, 24, 1]] },
  { name: '2-1/2" Combat', rows: [[250, 6, 11, 23, 11], [300, 8, 16, 33, 16], [350, 11, 22, 44, 22], [400, 15, 29, 58, 29], [500, 23, 45, 91, 45, 1]] },
  { name: '3" Big 10', rows: [[200, 2, 4, 7, 4], [250, 3, 6, 11, 6], [300, 4, 8, 16, 8], [350, 5, 11, 22, 11], [400, 7, 14, 28, 14, 1], [500, 11, 22, 44, 22, 1], [600, 16, 32, 64, 32, 1], [750, 25, 50, 99, 50, 1], [1000, 44, 88, 176, 88, 1]] },
];

export const STATIONS = [['Station 1', COLORS.blue, 'Blue'], ['Station 2', COLORS.red, 'Red'], ['Station 3', COLORS.yellow, 'Yellow']];

// CVFD friction loss chart 2 (CVFD hoses 2026, rounded), psi per 100'.
// maxUse: flows past this are greyed out on the chart.
export const HOSES = [
  { id: '175', label: '1-3/4"', name: 'Key Combat Ready', maxUse: 350, pts: [[50, 2], [100, 7], [150, 15], [200, 26], [250, 41], [300, 60]] },
  { id: '225', label: '2-1/4"', name: 'Key Tru ID', maxUse: 350, pts: [[100, 3], [150, 6], [200, 11], [250, 17], [300, 24]] },
  { id: '25', label: '2-1/2"', name: 'Key Combat Ready', maxUse: 500, pts: [[250, 11], [300, 16], [350, 22], [400, 29], [500, 45]] },
  { id: '3', label: '3"', name: 'Key Big 10', maxUse: 1000, pts: [[200, 4], [250, 6], [300, 8], [350, 11], [400, 14], [500, 22], [600, 32], [750, 50], [1000, 88]] },
  { id: '5', label: '5"', name: 'Key Hy Flow', maxUse: 1750, pts: [[400, 0.82], [500, 1], [600, 2], [750, 3], [1000, 5], [1100, 6], [1300, 9], [1400, 10], [1500, 12], [1750, 16]] },
];
export const FL_GPM = [50, 100, 150, 200, 250, 300, 350, 400, 500, 600, 750, 1000, 1100, 1300, 1400, 1500, 1750];

// Builder nozzle presets: [id, group, label, np, gpm, hint]
export const PRESETS = [
  ['h78', 'Handline tips @ 50 psi', '7/8" tip', 50, 165],
  ['h1516', 'Handline tips @ 50 psi', '15/16" tip', 50, 185],
  ['h1316', 'Handline tips @ 50 psi', '1-3/16" tip', 50, 300],
  ['h1', 'Handline tips @ 50 psi', '1" tip', 50, 210],
  ['h1b', 'Handline tips @ 50 psi', '1" tip @ 80 psi', 80, 266],
  ['h118', 'Handline tips @ 50 psi', '1-1/8" tip (2-1/4" hose)', 50, 265],
  ['h1116a', 'Handline tips @ 50 psi', '1-1/16" tip (2-1/4" hose)', 50, 237],
  ['h114', 'Handline tips @ 50 psi', '1-1/4" tip', 50, 328],
  ['s25', 'Handline tips @ 50 psi', '25 mm stack tip', 50, 210],
  ['s28', 'Handline tips @ 50 psi', '28 mm stack tip', 50, 266],
  ['elk', 'Fog nozzles', 'Elkhart fog', 50, 200],
  ['metro', 'Fog nozzles', 'Metro fog', 75, 200],
  ['tftauto', 'Fog nozzles', 'TFT 2-1/2" automatic fog', 100, 250, 'Automatic nozzle: flows 95 to 300 gpm. Set the gpm you are flowing.'],
  ['hen', 'Fog nozzles', 'HEN 2-1/2"', 45, 250],
  ['m114', 'Master stream @ 80 psi', '1-1/4" tip', 80, 415],
  ['m112', 'Master stream @ 80 psi', '1-1/2" tip', 80, 598],
  ['m112l', 'Master stream @ 80 psi', '1-1/2" tip @ 50 psi', 50, 473],
  ['bfog', 'Blitzfire', 'Blitzfire fog, low pressure', 55, 500],
  ['bfogh', 'Blitzfire', 'Blitzfire fog, high pressure', 100, 500],
  ['b112', 'Blitzfire', 'Blitzfire 1-1/2" tip', 80, 600],
  ['b114', 'Blitzfire', 'Blitzfire 1-1/4" tip', 80, 400],
  ['b1', 'Blitzfire', 'Blitzfire 1" tip', 80, 200],
  ['custom', 'Other', 'Custom nozzle', 50, 150, 'Enter the nozzle pressure and flow.'],
];

export const HYDRANTS = [['Red', COLORS.red, '4"'], ['Yellow', COLORS.yellow, '6"'], ['White', '#FFFFFF', '8"'], ['Green', COLORS.green, '10"–20"'], ['Orange', COLORS.orange, '24"–60"'], ['Orange cap & body', COLORS.orange, '36"–90"']];
export const RESIDUALS = [[100, 90, 85, 75], [90, 81, 76, 67], [80, 72, 68, 60], [70, 63, 59, 52], [60, 54, 51, 45], [50, 45, 42, 37], [40, 36, 34, 30], [30, 27, 25, 22]];

export const REF = [
  { title: 'Nozzle pressures', rows: [['Low pressure fog', '50 psi'], ['High pressure fog', '75 psi'], ['Fog master stream', '100 psi'], ['Smooth bore handline', '50 psi'], ['Smooth bore master stream', '80 psi']] },
  { title: 'Master stream tips', sub: 'Over 350 gpm, @ 80 psi unless noted', rows: [['1-1/4"', '415 gpm'], ['1-1/2"', '598 gpm'], ['1-1/2" @ 50 psi', '473 gpm']] },
  { title: 'Appliance friction loss', rows: [['Under 350 gpm', '10 psi'], ['Over 350 gpm', '25 psi']] },
  { title: 'Blitzfire PDP', sub: 'Fog NP low 55 / high 100 psi · smooth bore NP 80 psi', rows: [["100' 3\"", 'Fog 77/122 · 1-1/2" 112 · 1-1/4" 94 · 1" 84'], ["200' 3\"", 'Fog 99/144 · 1-1/2" 144 · 1-1/4" 108 · 1" 87'], ["300' 3\"", 'Fog 121/166 · 1-1/2" 176 · 1-1/4" 122 · 1" 91'], ['Flow', 'Fog 500 · 1-1/2" 600 · 1-1/4" 400 · 1" 200 gpm']] },
  { title: 'Deck gun / booster line PDP', rows: [['Fog nozzle', '95–100 psi'], ['Booster line', '180–200 psi']] },
  { title: 'High rise operations', sub: '200\' of 3" to the standpipe, 100\' of 2-1/2" to the fire floor, 100\' of 2-1/4" with a 1-1/16" nozzle', rows: [['PDP', '115–130 psi + 5 psi for every floor above ground level'], ['PRV or non-PRV', "Doesn't matter unless a pump pressure is stated at the FDC"]] },
];

// Friction loss per 100' at a flow: chart value, straight-line between chart rows,
// or scaled by flow squared past either end of the chart (flagged as an estimate).
export function flPer100(hose, gpm) {
  const p = hose.pts;
  if (gpm <= 0) return { v: 0, how: 'chart' };
  const hit = p.find((x) => x[0] === gpm);
  if (hit) return { v: hit[1], how: 'chart' };
  if (gpm < p[0][0]) return { v: p[0][1] * (gpm / p[0][0]) ** 2, how: 'below' };
  const last = p[p.length - 1];
  if (gpm > last[0]) return { v: last[1] * (gpm / last[0]) ** 2, how: 'above' };
  for (let i = 1; i < p.length; i++) {
    if (gpm < p[i][0]) {
      const [g0, f0] = p[i - 1], [g1, f1] = p[i];
      return { v: f0 + ((f1 - f0) * (gpm - g0)) / (g1 - g0), how: 'between' };
    }
  }
}

export function calcBuild(b) {
  const gpm = Math.max(0, Number(b.gpm) || 0), np = Math.max(0, Number(b.np) || 0);
  const warns = [];
  const segs = b.segs.map((s) => {
    const h = HOSES.find((x) => x.id === s.hose) || HOSES[0];
    const f = flPer100(h, gpm);
    if (f.how === 'above') warns.push(`${h.label} hose: ${gpm} gpm is past the top of the chart (${h.pts[h.pts.length - 1][0]} gpm). Friction loss is estimated.`);
    else if (f.how === 'below') warns.push(`${h.label} hose: ${gpm} gpm is below the chart's first row (${h.pts[0][0]} gpm). Friction loss is estimated.`);
    else if (gpm > h.maxUse) warns.push(`${h.label} hose: ${gpm} gpm is past what this hose is used for on the chart.`);
    return { h, len: s.len, per: f.v, fl: (f.v * s.len) / 100, how: f.how };
  });
  const hoseFL = segs.reduce((a, s) => a + s.fl, 0);
  const appEach = gpm > 350 ? 25 : 10;
  const appFL = b.app * appEach;
  const elev = b.floors * 5;
  const pdp = np + hoseFL + appFL + elev;
  if (segs.some((s) => s.how === 'between')) warns.push('Some friction loss falls between chart rows, so it is figured in a straight line between them.');
  if (pdp > 250) warns.push('PDP is over 250 psi. Check the lay before pumping it.');
  return { gpm, np, segs, hoseFL, appEach, appFL, elev, pdp: Math.max(0, pdp), warns };
}

export function hydrantVerdict(S, R) {
  if (!S || R < 0 || R > S) return null;
  const d = Math.round(((S - R) / S) * 100);
  let v;
  if (R <= 20) v = 'Minimum residual. No additional lines.';
  else if (d <= 10) v = 'You can add 3 times the amount already flowing.';
  else if (d <= 15) v = 'You can add 2 times the amount already flowing.';
  else if (d <= 25) v = 'You can add 1 more line of the same amount.';
  else v = 'Over 25% drop. No additional lines.';
  return { drop: S - R, pct: d, v };
}

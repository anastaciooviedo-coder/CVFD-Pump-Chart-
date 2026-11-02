import { useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import {
  CHART_ORDER, COLORS, FL_GPM, FRICTION, HOSES, HYDRANTS, LINES, NOZZLES, PRESETS, REF, RESIDUALS, STATIONS, calcBuild, hydrantVerdict,
} from './src/data';

const LIGHT = { bg: '#eef0f1', panel: '#ffffff', ink: '#15191c', muted: '#5c656c', line: '#d3d8dc', plate: '#1d2328', plateInk: '#f4f6f7', hi: '#fff3a6', hiInk: '#3a3200', warn: '#9a3412', warnBg: '#ffedd5' };
const DARK = { bg: '#101315', panel: '#1a1f23', ink: '#eef1f3', muted: '#9aa4ab', line: '#2c3439', plate: '#262d33', plateInk: '#f4f6f7', hi: '#4a4210', hiInk: '#fff3a6', warn: '#fdba74', warnBg: '#431407' };
const TABS = [['pump', 'Pump'], ['build', 'Build'], ['friction', 'Friction'], ['hydrant', 'Hydrant'], ['ref', 'Ref']];
const DEFAULT_BUILD = { noz: 'h1516', np: 50, gpm: 185, segs: [{ hose: '175', len: 200 }], app: 0, floors: 0 };
const r0 = (n) => Math.round(n);

export default function App() {
  const t = useColorScheme() === 'dark' ? DARK : LIGHT;
  const [tab, setTab] = useState('pump');
  const [build, setBuild] = useState(DEFAULT_BUILD);
  const calc = calcBuild(build);
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={['top', 'left', 'right']}>
        <StatusBar style={t === DARK ? 'light' : 'dark'} />
        <ScrollView contentContainerStyle={s.wrap} keyboardShouldPersistTaps="handled">
          <View style={s.header}>
            <Image source={require('./assets/logo.png')} style={s.logo} accessibilityLabel="Community Fire Training Division badge" />
            <View style={{ flex: 1 }}>
              <Text style={[s.h1, { color: t.ink }]}>CVFD POCKET PUMP CHART</Text>
              <Text style={[s.sub, { color: t.muted }]}>Created by Training Division · PDP = pump discharge pressure</Text>
            </View>
          </View>
          {tab === 'pump' && <Pump t={t} />}
          {tab === 'build' && <Build t={t} b={build} setB={setBuild} c={calc} />}
          {tab === 'friction' && <Friction t={t} />}
          {tab === 'hydrant' && <Hydrant t={t} />}
          {tab === 'ref' && <Reference t={t} />}
          <Text style={[s.small, { color: t.muted }]}>Figures copied from the CVFD flow chart and friction loss chart. Build tab numbers are calculated estimates. Confirm against your apparatus and SOPs.</Text>
        </ScrollView>
        {tab === 'build' && (
          <View style={[s.result, { backgroundColor: t.plate }]} accessibilityLiveRegion="polite">
            <View>
              <Text style={[s.resultNum, { color: t.plateInk }]}>{r0(calc.pdp)}</Text>
              <Text style={[s.resultUnit, { color: t.plateInk }]}>PSI PDP</Text>
            </View>
            <Text style={[s.resultBd, { color: t.plateInk }]}>
              {`${calc.np} NP + ${r0(calc.hoseFL)} FL${build.app ? ` + ${calc.appFL} app` : ''}${build.floors ? ` ${calc.elev < 0 ? '−' : '+'} ${Math.abs(calc.elev)} elev` : ''}\n${calc.gpm} gpm`}
            </Text>
          </View>
        )}
      </SafeAreaView>
      <SafeAreaView edges={['bottom', 'left', 'right']} style={[s.nav, { backgroundColor: t.panel, borderTopColor: t.line }]}>
        {TABS.map(([id, label]) => (
          <Pressable key={id} onPress={() => setTab(id)} accessibilityRole="tab" accessibilityState={{ selected: tab === id }}
            style={[s.navItem, { borderTopColor: tab === id ? t.ink : 'transparent' }]}>
            <Text style={[s.navText, { color: tab === id ? t.ink : t.muted }]}>{label.toUpperCase()}</Text>
          </Pressable>
        ))}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

function LineRow({ t, l, selected, onPress }) {
  const c = l.color || t.muted;
  return (
    <Pressable onPress={onPress} disabled={!onPress} accessibilityRole={onPress ? 'button' : undefined} accessibilityState={{ selected }}
      style={[s.line, { backgroundColor: t.panel, borderColor: selected ? c : t.line }]}>
      <View style={[s.swatch, { backgroundColor: c }]} />
      <View style={{ flex: 1 }}>
        <Text style={[s.lineName, { color: t.ink }]}>{l.name.toUpperCase()}</Text>
        <Text style={[s.small, { color: t.muted }]}>{`${l.size} w/ ${l.nozLabel}${l.where ? ' · ' + l.where : ''}`}</Text>
      </View>
      <Text style={[s.lineLen, { color: t.muted }]}>{l.len}'</Text>
    </Pressable>
  );
}

function Pump({ t }) {
  const [lineId, setLineId] = useState('blue');
  const l = LINES.find((x) => x.id === lineId);
  const n = NOZZLES[l.noz];
  const [riSel, setRi] = useState(NOZZLES.vortex.hl);
  const ri = riSel >= 0 && riSel < n.rows.length ? riSel : n.hl ?? 0;
  const row = n.rows[ri];
  const c = l.color || t.muted;
  return (
    <View style={s.stack}>
      <View style={s.gap8}>
        {LINES.map((x) => (
          <LineRow key={x.id} t={t} l={x} selected={x.id === lineId}
            onPress={() => { setLineId(x.id); setRi(NOZZLES[x.noz].hl ?? 0); }} />
        ))}
      </View>
      <View style={[s.plate, { backgroundColor: t.plate, borderTopColor: c }]}>
        <Text style={[s.tag, { color: t.plateInk }]}>{`${l.name} · ${l.len}' of ${l.size} · ${n.name}${n.tip ? ' ' + n.tip : ''}`.toUpperCase()}</Text>
        <View style={s.big} accessibilityLiveRegion="polite">
          <Text style={[s.bigNum, { color: t.plateInk }]}>{row[1]}</Text>
          <Text style={[s.bigUnit, { color: t.plateInk }]}>PSI PDP</Text>
        </View>
        <View style={s.row8}>
          <Stat t={t} label="FLOW" value={`${row[2]} gpm`} />
          <Stat t={t} label="NOZZLE PRESSURE" value={`${row[0]} psi`} />
        </View>
        <View style={s.row8}>
          {n.rows.map((r, i) => {
            const on = i === ri;
            return (
              <Pressable key={i} onPress={() => setRi(i)} accessibilityRole="button" accessibilityState={{ selected: on }}
                style={[s.npBtn, on ? { backgroundColor: t.plateInk, borderColor: t.plateInk } : { borderColor: 'rgba(255,255,255,0.25)' },
                  i === n.hl && { borderBottomColor: COLORS.yellow, borderBottomWidth: 5 }]}>
                <Text style={[s.npNum, { color: on ? t.plate : t.plateInk }]}>{r[0]}</Text>
                <Text style={[s.npLbl, { color: on ? t.plate : t.plateInk }]}>{`${r[2]} gpm`}</Text>
              </Pressable>
            );
          })}
        </View>
        {n.hl != null && n.rows.length > 1 && <Text style={[s.tag, { color: t.plateInk }]}>YELLOW BAR MARKS THE ROW HIGHLIGHTED ON THE CHART</Text>}
        {n.note && <Text style={[s.note, { backgroundColor: t.hi, color: t.hiInk }]}>{n.note}</Text>}
      </View>
    </View>
  );
}

function Stat({ t, label, value }) {
  return (
    <View style={s.stat}>
      <Text style={[s.statLbl, { color: t.plateInk }]}>{label}</Text>
      <Text style={[s.statVal, { color: t.plateInk }]}>{value}</Text>
    </View>
  );
}

function Btn({ t, label, onPress, style, a11y, small }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={a11y}
      style={[s.btn, small && s.btnSmall, { borderColor: t.line, backgroundColor: t.panel }, style]}>
      <Text style={[small ? s.btnTextSmall : s.btnText, { color: t.ink }]}>{label}</Text>
    </Pressable>
  );
}

function Stepper({ t, value, onMinus, onPlus, what }) {
  return (
    <View style={s.stepper}>
      <Btn t={t} label="−" onPress={onMinus} a11y={`Less ${what}`} />
      <Text style={[s.stepVal, { color: t.ink }]}>{value}</Text>
      <Btn t={t} label="+" onPress={onPlus} a11y={`More ${what}`} />
    </View>
  );
}

function NumField({ t, label, value, onChange }) {
  return (
    <View style={[s.field, { flex: 1 }]}>
      <Text style={[s.fieldLbl, { color: t.muted }]}>{label.toUpperCase()}</Text>
      <TextInput value={String(value)} onChangeText={(v) => onChange(Number(v.replace(/[^0-9]/g, '')) || 0)} keyboardType="number-pad"
        style={[s.input, { color: t.ink, borderColor: t.line, backgroundColor: t.bg }]} accessibilityLabel={label} />
    </View>
  );
}

function Panel({ t, title, subtitle, children }) {
  return (
    <View style={[s.card, { backgroundColor: t.panel, borderColor: t.line }]}>
      {title && (
        <View style={[s.cardH, { borderBottomColor: t.line }]}>
          <View style={{ flex: 1 }}>
            <Text style={[s.cardTitle, { color: t.ink }]}>{title.toUpperCase()}</Text>
            {subtitle ? <Text style={[s.small, { color: t.muted }]}>{subtitle}</Text> : null}
          </View>
        </View>
      )}
      <View style={s.cardB}>{children}</View>
    </View>
  );
}

function Build({ t, b, setB, c }) {
  const [picking, setPicking] = useState(false);
  const preset = PRESETS.find((p) => p[0] === b.noz);
  const up = (patch) => setB({ ...b, ...patch });
  const setSeg = (i, patch) => up({ segs: b.segs.map((x, j) => (j === i ? { ...x, ...patch } : x)) });
  const groups = [...new Set(PRESETS.map((p) => p[1]))];
  const rows = [
    ['Nozzle pressure', c.np],
    ...c.segs.map((x) => [`${x.len}' of ${x.h.label}`, r0(x.fl)]),
    ...(b.app ? [[`${b.app} appliance${b.app > 1 ? 's' : ''} × ${c.appEach}`, c.appFL]] : []),
    ...(b.floors ? [[`${b.floors} floor${Math.abs(b.floors) > 1 ? 's' : ''} × 5`, c.elev]] : []),
    ['PDP', r0(c.pdp)],
  ];
  return (
    <View style={[s.stack, { paddingBottom: 90 }]}>
      <Text style={[s.h2, { color: t.muted }]}>BUILD A LINE</Text>
      <Text style={[s.sub, { color: t.muted }]}>Mix any nozzle, hose and lay. PDP = nozzle pressure + hose friction loss + appliances + elevation, using the CVFD friction loss chart.</Text>
      <Panel t={t}>
        <Text style={[s.fieldLbl, { color: t.muted }]}>NOZZLE</Text>
        <Pressable onPress={() => setPicking(true)} accessibilityRole="button" accessibilityLabel="Choose nozzle"
          style={[s.input, s.picker, { borderColor: t.line, backgroundColor: t.bg }]}>
          <Text style={{ color: t.ink, fontSize: 17, flex: 1 }}>{preset ? preset[2] : 'Custom nozzle'}</Text>
          <Text style={{ color: t.muted, fontSize: 18 }}>›</Text>
        </Pressable>
        <View style={s.row8}>
          <NumField t={t} label="Nozzle psi" value={b.np} onChange={(v) => up({ np: v })} />
          <NumField t={t} label="Flow gpm" value={b.gpm} onChange={(v) => up({ gpm: v })} />
        </View>
        <Text style={[s.small, { color: t.muted }]}>{(preset && preset[5]) || 'Change psi or gpm to match what you are flowing.'}</Text>
      </Panel>
      <Panel t={t} title="Hose lay" subtitle="Add each size in the lay, pump to nozzle">
        {b.segs.map((seg, i) => (
          <View key={i} style={[s.seg, { borderColor: t.line, backgroundColor: t.bg }]}>
            <View style={s.chips}>
              {HOSES.map((h) => (
                <Pressable key={h.id} onPress={() => setSeg(i, { hose: h.id })} accessibilityRole="button" accessibilityState={{ selected: seg.hose === h.id }}
                  style={[s.chip, { borderColor: seg.hose === h.id ? t.ink : t.line, backgroundColor: seg.hose === h.id ? t.ink : t.panel }]}>
                  <Text style={[s.chipText, { color: seg.hose === h.id ? t.bg : t.ink }]}>{h.label}</Text>
                </Pressable>
              ))}
            </View>
            <View style={[s.row8, { alignItems: 'center' }]}>
              <Stepper t={t} value={`${seg.len}'`} what="hose" onMinus={() => setSeg(i, { len: Math.max(50, seg.len - 50) })} onPlus={() => setSeg(i, { len: Math.min(3000, seg.len + 50) })} />
              <View style={{ marginLeft: 'auto', alignItems: 'flex-end' }}>
                <Text style={[s.segFl, { color: t.ink }]}>{r0(c.segs[i].fl)} psi</Text>
                <Text style={[s.small, { color: t.muted }]}>{c.segs[i].per < 10 ? c.segs[i].per.toFixed(1) : r0(c.segs[i].per)} per 100'</Text>
              </View>
              {b.segs.length > 1 && <Btn t={t} small label="✕" a11y={`Remove section ${i + 1}`} onPress={() => up({ segs: b.segs.filter((_, j) => j !== i) })} />}
            </View>
          </View>
        ))}
        <Btn t={t} label="+ ADD HOSE" onPress={() => up({ segs: [...b.segs, { hose: b.segs[b.segs.length - 1]?.hose || '175', len: 100 }] })} />
      </Panel>
      <Panel t={t}>
        <Text style={[s.fieldLbl, { color: t.muted }]}>APPLIANCES IN LINE</Text>
        <Stepper t={t} value={b.app} what="appliances" onMinus={() => up({ app: Math.max(0, b.app - 1) })} onPlus={() => up({ app: Math.min(6, b.app + 1) })} />
        <Text style={[s.small, { color: t.muted }]}>Wye, standpipe, manifold and the like. 10 psi each under 350 gpm, 25 psi over 350.</Text>
        <Text style={[s.fieldLbl, { color: t.muted, marginTop: 8 }]}>FLOORS ABOVE GROUND</Text>
        <Stepper t={t} value={b.floors} what="floors" onMinus={() => up({ floors: Math.max(-10, b.floors - 1) })} onPlus={() => up({ floors: Math.min(100, b.floors + 1) })} />
        <Text style={[s.small, { color: t.muted }]}>5 psi per floor. Go below 0 for lines below grade.</Text>
      </Panel>
      <Panel t={t} title="Breakdown" subtitle={`${c.gpm} gpm through ${b.segs.reduce((a, x) => a + x.len, 0)}' of hose`}>
        {rows.map((r, i) => (
          <View key={i} style={[s.bdRow, { borderBottomColor: t.line }, i === rows.length - 1 && { borderBottomWidth: 0 }]}>
            <Text style={{ color: t.ink, fontSize: 15, fontWeight: i === rows.length - 1 ? '700' : '400' }}>{r[0]}</Text>
            <Text style={[s.bdVal, { color: t.ink }]}>{r[1]} psi</Text>
          </View>
        ))}
        {c.warns.map((w) => <Text key={w} style={[s.note, { backgroundColor: t.warnBg, color: t.warn }]}>{w}</Text>)}
      </Panel>
      <Btn t={t} label="START OVER" onPress={() => setB(DEFAULT_BUILD)} />
      <Modal visible={picking} animationType="slide" onRequestClose={() => setPicking(false)}>
        <SafeAreaProvider>
          <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
            <View style={[s.cardH, { borderBottomColor: t.line }]}>
              <Text style={[s.cardTitle, { color: t.ink, flex: 1 }]}>CHOOSE NOZZLE</Text>
              <Btn t={t} small label="✕" a11y="Close" onPress={() => setPicking(false)} />
            </View>
            <ScrollView contentContainerStyle={{ padding: 16, gap: 8 }}>
              {groups.map((g) => (
                <View key={g} style={s.gap8}>
                  <Text style={[s.fieldLbl, { color: t.muted, marginTop: 8 }]}>{g.toUpperCase()}</Text>
                  {PRESETS.filter((p) => p[1] === g).map((p) => (
                    <Pressable key={p[0]} onPress={() => { setB({ ...b, noz: p[0], np: p[3], gpm: p[4] }); setPicking(false); }}
                      style={[s.line, { backgroundColor: t.panel, borderColor: p[0] === b.noz ? t.ink : t.line, minHeight: 52 }]}>
                      <Text style={{ color: t.ink, fontSize: 16, flex: 1 }}>{p[2]}</Text>
                      {p[0] !== 'custom' && <Text style={{ color: t.muted, fontSize: 14 }}>{`${p[3]} psi · ${p[4]} gpm`}</Text>}
                    </Pressable>
                  ))}
                </View>
              ))}
            </ScrollView>
          </SafeAreaView>
        </SafeAreaProvider>
      </Modal>
    </View>
  );
}

function Card({ t, color, title, subtitle, head, rows, flexes }) {
  const fx = (i) => (flexes ? flexes[i] : 1);
  return (
    <View style={[s.card, { backgroundColor: t.panel, borderColor: t.line }]}>
      <View style={[s.cardH, { borderBottomColor: t.line }]}>
        {color && <View style={[s.cardSw, { backgroundColor: color }]} />}
        <View style={{ flex: 1 }}>
          <Text style={[s.cardTitle, { color: t.ink }]}>{title.toUpperCase()}</Text>
          {subtitle ? <Text style={[s.small, { color: t.muted }]}>{subtitle}</Text> : null}
        </View>
      </View>
      {head && (
        <View style={[s.tr, { borderBottomColor: t.line }]}>
          {head.map((h, i) => <Text key={h} style={[s.th, { flex: fx(i), color: t.muted, textAlign: i ? 'right' : 'left' }]}>{h.toUpperCase()}</Text>)}
        </View>
      )}
      {rows.map((r, ri) => (
        <View key={ri} style={[s.tr, { borderBottomColor: t.line, backgroundColor: r.hl ? t.hi : 'transparent' }, ri === rows.length - 1 && { borderBottomWidth: 0 }]}>
          {r.cells.map((v, i) => {
            const text = typeof v === 'string' && !/^[\d–.-]+$/.test(v);
            return (
              <Text key={i} style={[text ? s.tdText : s.td, { flex: fx(i), color: v == null || v === 'off' ? t.muted : r.hl ? t.hiInk : t.ink, textAlign: i && !text ? 'right' : 'left' }]}>
                {v == null ? '–' : v === 'off' ? '' : v}
              </Text>
            );
          })}
        </View>
      ))}
    </View>
  );
}

function Legend({ t }) {
  return (
    <View style={s.legend}>
      <View style={[s.legendSw, { backgroundColor: t.hi, borderColor: t.line }]} />
      <Text style={[s.small, { color: t.muted }]}>Highlighted on the original chart</Text>
    </View>
  );
}

function Friction({ t }) {
  return (
    <View style={s.stack}>
      <Text style={[s.h2, { color: t.muted }]}>FRICTION LOSS</Text>
      <Card t={t} color={t.ink} title="CVFD friction loss chart" subtitle="psi per 100' by hose · CVFD hoses 2026, rounded · blank = past the flow this hose is used for"
        head={['gpm', ...HOSES.map((h) => h.label)]}
        rows={FL_GPM.map((g) => ({ cells: [g, ...HOSES.map((h) => { const p = h.pts.find((x) => x[0] === g); return p ? p[1] : g > h.maxUse ? 'off' : null; })] }))} />
      <Text style={[s.h2, { color: t.muted }]}>BY LENGTH</Text>
      <Legend t={t} />
      {FRICTION.map((h) => (
        <Card key={h.name} t={t} color={t.ink} title={h.name} subtitle="Friction loss in psi by flow and length"
          head={['gpm', "50'", "100'", "200'", "100' calc"]}
          rows={h.rows.map((r) => ({ cells: r.slice(0, 5), hl: !!r[5] }))} />
      ))}
      <Text style={[s.small, { color: t.muted }]}>"Calc" is the online calculator figure for 100'. A dash means the chart has no value.</Text>
    </View>
  );
}

function Hydrant({ t }) {
  const [st, setSt] = useState(80);
  const [rs, setRs] = useState(70);
  const v = hydrantVerdict(st, rs);
  return (
    <View style={s.stack}>
      <Text style={[s.h2, { color: t.muted }]}>FLOW AVAILABLE</Text>
      <Panel t={t}>
        <Text style={[s.small, { color: t.muted }]}>With the first line flowing, compare static and residual pressure.</Text>
        <View style={s.row8}>
          <NumField t={t} label="Static psi" value={st} onChange={setSt} />
          <NumField t={t} label="Residual psi" value={rs} onChange={setRs} />
        </View>
        {v ? (
          <>
            <View style={[s.bdRow, { borderBottomWidth: 0 }]}>
              <Text style={{ color: t.ink, fontSize: 15 }}>Drop</Text>
              <Text style={[s.bdVal, { color: t.ink }]}>{`${v.drop} psi · ${v.pct}%`}</Text>
            </View>
            <Text style={[s.verdict, { color: t.ink }]}>{v.v}</Text>
          </>
        ) : (
          <Text style={[s.note, { backgroundColor: t.warnBg, color: t.warn }]}>Enter a static pressure and a residual that is not higher than static.</Text>
        )}
      </Panel>
      <Card t={t} title="Drop rules" subtitle="Lines you can add" flexes={[1, 2]}
        rows={[['0–10% drop', '3 times the amount already flowing'], ['11–15% drop', '2 times the amount already flowing'], ['16–25% drop', '1 line, same amount already flowing']].map((c) => ({ cells: c }))} />
      <Card t={t} title="Residual at each drop" subtitle="psi" head={['Static', '10%', '15%', '25%']}
        rows={[...RESIDUALS.map((r) => ({ cells: r })), { cells: [20, 'Minimum residual. No additional lines.'] }]} flexes={[1, 1, 1, 1]} />
      <Text style={[s.h2, { color: t.muted }]}>HYDRANT MAIN SIZE</Text>
      <View style={[s.card, { backgroundColor: t.panel, borderColor: t.line }]}>
        {HYDRANTS.map(([name, c, m], i) => (
          <View key={name} style={[s.tr, { borderBottomColor: t.line, alignItems: 'center' }, i === HYDRANTS.length - 1 && { borderBottomWidth: 0 }]}>
            <View style={[s.dot, { backgroundColor: c, borderColor: t.line }]} />
            <Text style={[s.tdText, { color: t.ink, flex: 1 }]}>{name}</Text>
            <Text style={[s.td, { color: t.ink, textAlign: 'right' }]}>{m}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function Reference({ t }) {
  const tips = PRESETS.filter((p) => p[1] === 'Handline tips @ 50 psi' || p[1] === 'Fog nozzles')
    .map((p) => ({ cells: [p[2], `${p[0] === 'tftauto' ? '95–300' : p[4]} gpm${p[3] !== 50 ? ` @ ${p[3]} psi` : ''}`] }));
  return (
    <View style={s.stack}>
      <Text style={[s.h2, { color: t.muted }]}>NOZZLE CHARTS</Text>
      <Legend t={t} />
      {CHART_ORDER.map((k) => {
        const n = NOZZLES[k];
        const used = LINES.filter((l) => l.noz === k && !l.extra);
        const lines = used.length ? used.map((l) => l.name).join(', ') + ' line' : 'No crosslay assigned';
        return (
          <Card key={k} t={t} color={used[0] ? used[0].color : t.muted} title={`${n.name} ${n.tip}`}
            subtitle={`${n.len}' of ${n.size} Combat · ${lines}`} head={['Nozzle psi', 'PDP psi', 'Flow gpm']}
            rows={n.rows.map((r, i) => ({ cells: r, hl: i === n.hl }))} />
        );
      })}
      <Text style={[s.h2, { color: t.muted }]}>QUICK REFERENCE</Text>
      <Card t={t} title="Handline tips" subtitle="Under 350 gpm, @ 50 psi unless noted" rows={tips} flexes={[3, 2]} />
      {REF.map((r) => <Card key={r.title} t={t} title={r.title} subtitle={r.sub} rows={r.rows.map((c) => ({ cells: c }))} flexes={[1, 2]} />)}
      <Text style={[s.h2, { color: t.muted }]}>NOZZLE COLORS</Text>
      <View style={s.row8}>
        {STATIONS.map(([name, c, label]) => (
          <View key={name} style={[s.station, { backgroundColor: t.panel, borderColor: t.line }]}>
            <View style={[s.tri, { borderBottomColor: c }]} />
            <Text style={[s.lineName, { color: t.ink }]}>{name.toUpperCase()}</Text>
            <Text style={[s.small, { color: t.muted }]}>{label}</Text>
          </View>
        ))}
      </View>
      <Text style={[s.h2, { color: t.muted }]}>CROSSLAYS</Text>
      <View style={s.gap8}>
        {LINES.filter((l) => !l.extra).map((l) => <LineRow key={l.id} t={t} l={l} />)}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 16, paddingBottom: 32, gap: 20, width: '100%', maxWidth: 560, alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logo: { width: 56, height: 56, borderRadius: 28 },
  h1: { fontSize: 24, fontWeight: '800', letterSpacing: 0.6 },
  h2: { fontSize: 18, fontWeight: '700', letterSpacing: 1 },
  sub: { fontSize: 14 },
  small: { fontSize: 13 },
  stack: { gap: 16 },
  gap8: { gap: 8 },
  row8: { flexDirection: 'row', gap: 8 },
  line: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, minHeight: 56, borderWidth: 2, borderRadius: 10 },
  swatch: { width: 14, alignSelf: 'stretch', minHeight: 32, borderRadius: 4 },
  lineName: { fontSize: 18, fontWeight: '700', letterSpacing: 0.4 },
  lineLen: { fontSize: 18, fontWeight: '700' },
  plate: { borderRadius: 12, padding: 16, gap: 14, borderTopWidth: 8 },
  tag: { fontSize: 12, letterSpacing: 1, opacity: 0.75 },
  big: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  bigNum: { fontSize: 84, fontWeight: '800', lineHeight: 88, fontVariant: ['tabular-nums'] },
  bigUnit: { fontSize: 22, fontWeight: '700', paddingBottom: 12, opacity: 0.85 },
  stat: { flex: 1, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 10 },
  statLbl: { fontSize: 11, letterSpacing: 0.8, opacity: 0.7 },
  statVal: { fontSize: 24, fontWeight: '700', fontVariant: ['tabular-nums'] },
  npBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 8, borderWidth: 2 },
  npNum: { fontSize: 22, fontWeight: '700' },
  npLbl: { fontSize: 11, opacity: 0.8 },
  note: { fontSize: 14, borderRadius: 8, padding: 10, overflow: 'hidden' },
  card: { borderWidth: 1, borderRadius: 10, overflow: 'hidden' },
  cardH: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderBottomWidth: 1 },
  cardB: { padding: 12, gap: 10 },
  cardSw: { width: 10, height: 28, borderRadius: 3 },
  cardTitle: { fontSize: 18, fontWeight: '700', letterSpacing: 0.4 },
  tr: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingVertical: 9, borderBottomWidth: 1 },
  th: { flex: 1, fontSize: 11, fontWeight: '600', letterSpacing: 0.6 },
  td: { flex: 1, fontSize: 19, fontWeight: '700', fontVariant: ['tabular-nums'] },
  tdText: { flex: 1, fontSize: 15 },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendSw: { width: 14, height: 14, borderRadius: 3, borderWidth: 1 },
  station: { flex: 1, alignItems: 'center', gap: 6, paddingVertical: 14, borderWidth: 1, borderRadius: 10 },
  tri: { width: 0, height: 0, borderLeftWidth: 22, borderRightWidth: 22, borderBottomWidth: 38, borderLeftColor: 'transparent', borderRightColor: 'transparent' },
  dot: { width: 18, height: 18, borderRadius: 9, borderWidth: 1, marginRight: 4 },
  field: { gap: 6 },
  fieldLbl: { fontSize: 12, fontWeight: '600', letterSpacing: 0.7 },
  input: { borderWidth: 2, borderRadius: 8, paddingHorizontal: 12, minHeight: 48, fontSize: 17 },
  picker: { flexDirection: 'row', alignItems: 'center' },
  btn: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 8, borderWidth: 2, paddingHorizontal: 12 },
  btnSmall: { minWidth: 40, minHeight: 40 },
  btnText: { fontSize: 20, fontWeight: '700', letterSpacing: 0.6 },
  btnTextSmall: { fontSize: 16 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stepVal: { fontSize: 22, fontWeight: '700', minWidth: 64, textAlign: 'center', fontVariant: ['tabular-nums'] },
  seg: { borderWidth: 1, borderRadius: 8, padding: 10, gap: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { borderWidth: 2, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 10 },
  chipText: { fontSize: 15, fontWeight: '700' },
  segFl: { fontSize: 20, fontWeight: '700', fontVariant: ['tabular-nums'] },
  bdRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1 },
  bdVal: { fontSize: 18, fontWeight: '700', fontVariant: ['tabular-nums'] },
  verdict: { fontSize: 22, fontWeight: '700' },
  result: { flexDirection: 'row', alignItems: 'center', gap: 14, marginHorizontal: 8, marginBottom: 6, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14 },
  resultNum: { fontSize: 48, fontWeight: '800', lineHeight: 52, fontVariant: ['tabular-nums'] },
  resultUnit: { fontSize: 13, fontWeight: '700', opacity: 0.8 },
  resultBd: { marginLeft: 'auto', fontSize: 12, textAlign: 'right', opacity: 0.85 },
  nav: { flexDirection: 'row', borderTopWidth: 1 },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 60, borderTopWidth: 3 },
  navText: { fontSize: 14, fontWeight: '700', letterSpacing: 0.6 },
});

import { useState } from "react";
import "./LightSwitch.css";

// x = pole ki jagah (scene ki chaudai ka %), light ka cone bhi isi x se nikalta hai
const POLES = [
  { key: "one", label: "Pole 1", x: "23%" },
  { key: "two", label: "Pole 2", x: "77%" },
];

/* ---------- Textures (SVG tiles, code mein hi bane hain - koi image file nahi chahiye) ---------- */
const hash = (a, b, c) => ((a * 73856093) ^ (b * 19349663) ^ (c * 83492791)) >>> 0;

// Staggered eint / pathar ki tile. Kinaron par wrap hoti hai, isliye repeat karne par jod nahi dikhta.
function tileSvg({ bw, bh, gap, cols, rows, palette, mortar, rx = 0, hl = null }) {
  const cw = bw + gap;
  const ch = bh + gap;
  const W = cols * cw;
  const H = rows * ch;
  let s = `<svg xmlns='http://www.w3.org/2000/svg' width='${W}' height='${H}' viewBox='0 0 ${W} ${H}'>`;
  s += `<rect width='${W}' height='${H}' fill='${mortar}'/>`;
  for (let r = 0; r < rows; r++) {
    const off = (r % 2) * (cw / 2);
    for (let c = -1; c <= cols; c++) {
      const idx = ((c % cols) + cols) % cols;
      const fill = palette[hash(r + 1, idx + 5, 7) % palette.length];
      const x = off + c * cw;
      const y = r * ch;
      s += `<rect x='${x}' y='${y}' width='${bw}' height='${bh}' rx='${rx}' fill='${fill}'/>`;
      if (hl) s += `<rect x='${x}' y='${y}' width='${bw}' height='1.6' fill='${hl[0]}' fill-opacity='${hl[1]}'/>`;
    }
  }
  return `data:image/svg+xml;utf8,${encodeURIComponent(s + "</svg>")}`;
}

// Andhera: gehri hari-bhoori eint. Roshni mein: peeli-hari eint, upar halki chamak.
const BRICKS_DARK = tileSvg({
  bw: 34, bh: 15, gap: 2, cols: 8, rows: 8, mortar: "#141918",
  palette: ["#2a322d", "#303832", "#262d29", "#343c35", "#2c342f", "#222925"],
});
const BRICKS_LIT = tileSvg({
  bw: 34, bh: 15, gap: 2, cols: 8, rows: 8, mortar: "#3d3f20", hl: ["#fff0aa", 0.55],
  palette: ["#8d8d4c", "#9a9857", "#7f8249", "#a39f5d", "#888a4b", "#76793f"],
});
const COBBLES = tileSvg({
  bw: 30, bh: 15, gap: 3, cols: 6, rows: 5, rx: 5, mortar: "#121714",
  palette: ["#2b322d", "#333b34", "#262d28", "#2f3731", "#3a423a", "#232a25"],
});

/* ---------- Upar-right ke patte (ghana canopy, kinar par peele-hare patte) ---------- */
const LEAF_DARK = ["#0d120e", "#111811", "#151d15", "#0a0e0b"];
const LEAF_LIGHT = ["#b9b43b", "#8f9a2c", "#6e7a22", "#a09a30"];
// Canopy ki neechli kinar (viewBox 400 x 300 mein), patte isi line ke aas-paas
const EDGE = [[30, 0], [42, 40], [85, 66], [125, 92], [175, 118], [225, 146], [280, 168], [335, 192], [400, 214]];
const edgeAt = (s) => {
  const f = s * (EDGE.length - 1);
  const i = Math.min(Math.floor(f), EDGE.length - 2);
  const t = f - i;
  return [EDGE[i][0] + (EDGE[i + 1][0] - EDGE[i][0]) * t, EDGE[i][1] + (EDGE[i + 1][1] - EDGE[i][1]) * t];
};
const makeLeaf = (cx, cy, a, k, fill) => ({
  points: `${cx - a},${cy + k} ${cx},${cy - a * 0.7} ${cx + a},${cy - k} ${cx},${cy + a * 0.7}`,
  fill,
});
const LEAVES = [
  // andar ke gehre patte (ghana dikhane ke liye)
  ...Array.from({ length: 110 }, (_, i) => {
    const h1 = hash(i + 1, 3, 11), h2 = hash(i + 1, 7, 13), h3 = hash(i + 1, 17, 19);
    const cx = 60 + (h1 % 340);
    const cy = 4 + (h2 % 190);
    const [ex, ey] = edgeAt(Math.min(1, Math.max(0, (cx - 30) / 370)));
    if (cy > ey) return null; // kinar ke neeche nahi
    return makeLeaf(cx, cy, 9 + (h3 % 12), (h3 % 7) - 3, LEAF_DARK[h3 % LEAF_DARK.length]);
  }).filter(Boolean),
  // kinar par patte: kuch gehre, kuch peele-hare
  ...Array.from({ length: 70 }, (_, i) => {
    const h1 = hash(i + 41, 3, 11), h2 = hash(i + 41, 7, 13), h3 = hash(i + 41, 17, 19), h4 = hash(i + 41, 29, 31);
    const [ex, ey] = edgeAt(i / 70);
    const cx = ex - 26 + (h1 % 44);
    const cy = ey - 10 + (h2 % 34);
    const light = cx < ex - 4 && h4 % 100 < 45;
    const pal = light ? LEAF_LIGHT : LEAF_DARK;
    return makeLeaf(cx, cy, 6 + (h3 % 10), (h4 % 7) - 3, pal[h3 % pal.length]);
  }),
];

function Foliage() {
  return (
    <svg className="rl-foliage" viewBox="0 0 400 300" preserveAspectRatio="xMaxYMin slice" aria-hidden="true">
      <path
        d="M400 0 H30 Q20 40 42 40 Q60 58 85 66 Q105 80 125 92 Q150 106 175 118 Q200 134 225 146 Q250 160 280 168 Q305 182 335 192 Q365 205 400 214 Z"
        fill="#0b0f0c"
      />
      {LEAVES.map((l, i) => (
        <polygon key={i} points={l.points} fill={l.fill} />
      ))}
    </svg>
  );
}

/* ---------- Lakdi ki bench ---------- */
function Bench() {
  return (
    <svg className="rl-bench" viewBox="0 0 200 104" aria-hidden="true">
      <defs>
        <linearGradient id="rl-wood" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#d9783a" />
          <stop offset="0.5" stopColor="#b9581f" />
          <stop offset="1" stopColor="#8b4318" />
        </linearGradient>
      </defs>
      <ellipse cx="100" cy="100" rx="96" ry="4" fill="#000" opacity="0.5" />
      {/* lohe ke pair aur peeche ke khambe */}
      <g fill="#0c0d0f">
        <rect x="12" y="6" width="5" height="90" rx="1.5" />
        <rect x="183" y="6" width="5" height="90" rx="1.5" />
        <rect x="22" y="70" width="4" height="26" rx="1.5" />
        <rect x="174" y="70" width="4" height="26" rx="1.5" />
      </g>
      {/* peeth ke takhte */}
      <g fill="url(#rl-wood)">
        <rect x="6" y="6" width="188" height="11" rx="1.5" />
        <rect x="6" y="20" width="188" height="11" rx="1.5" />
        <rect x="6" y="34" width="188" height="11" rx="1.5" />
      </g>
      <g fill="#f0a05a" opacity="0.55">
        <rect x="6" y="6" width="188" height="1.6" />
        <rect x="6" y="20" width="188" height="1.6" />
        <rect x="6" y="34" width="188" height="1.6" />
      </g>
      {/* seat */}
      <rect x="2" y="62" width="196" height="9" rx="1.5" fill="url(#rl-wood)" />
      <rect x="2" y="62" width="196" height="1.6" fill="#f0a05a" opacity="0.55" />
      <rect x="2" y="73" width="196" height="5" rx="1.5" fill="#7a3a14" />
      {/* aage ke pair */}
      <g fill="#0c0d0f">
        <rect x="8" y="78" width="5" height="18" rx="1.5" />
        <rect x="187" y="78" width="5" height="18" rx="1.5" />
      </g>
    </svg>
  );
}

/* ---------- Kaala cast-iron lamp post (SVG) ---------- */
function PoleArt({ uid, on }) {
  const id = (n) => `rl-${n}-${uid}`;
  const ref = (n) => `url(#${id(n)})`;

  return (
    <svg className="rl-art" viewBox="0 0 120 420" aria-hidden="true">
      <defs>
        <linearGradient id={id("iron")} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#050506" />
          <stop offset="0.38" stopColor="#23262c" />
          <stop offset="0.7" stopColor="#0b0c0e" />
          <stop offset="1" stopColor="#020203" />
        </linearGradient>
        <radialGradient id={id("glassOn")} cx="0.5" cy="0.55" r="0.62">
          <stop offset="0" stopColor="#fff6c8" />
          <stop offset="0.35" stopColor="#ffd070" />
          <stop offset="0.75" stopColor="#ff9f2a" />
          <stop offset="1" stopColor="#c9620f" />
        </radialGradient>
        <linearGradient id={id("glassOff")} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#40362a" />
          <stop offset="1" stopColor="#1b1710" />
        </linearGradient>
        <radialGradient id={id("halo")}>
          <stop offset="0" stopColor="#ffb83a" stopOpacity="0.7" />
          <stop offset="0.4" stopColor="#ffb83a" stopOpacity="0.22" />
          <stop offset="1" stopColor="#ffb83a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id("pool")}>
          <stop offset="0" stopColor="#ffc860" stopOpacity="0.5" />
          <stop offset="0.6" stopColor="#ffc860" stopOpacity="0.15" />
          <stop offset="1" stopColor="#ffc860" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* zameen par roshni ka ghera aur pole ki lambi parchhai (sirf ON mein) */}
      <ellipse className="rl-pool" cx="60" cy="420" rx="100" ry="14" fill={ref("pool")} />
      <polygon className="rl-shadow" points="55,418 67,418 26,505 14,505" fill="#000" />

      {/* pedestal */}
      <rect x="38" y="410" width="44" height="9" rx="2" fill={ref("iron")} />
      <rect x="42" y="400" width="36" height="12" rx="2" fill={ref("iron")} />
      <rect x="46" y="346" width="28" height="56" fill={ref("iron")} />
      <path d="M46 362 H74 M46 392 H74" stroke="#2b2e35" strokeWidth="1.4" />
      <path d="M49 350 V398" stroke="#3a3e47" strokeWidth="1.2" opacity="0.7" />
      <rect x="43" y="340" width="34" height="7" rx="2" fill={ref("iron")} />
      <path d="M45 341.5 H75" stroke="#3b3f47" strokeWidth="1" />

      {/* shaft aur sajawati chhalle */}
      <polygon points="56,127 64,127 65.5,342 54.5,342" fill={ref("iron")} />
      <path d="M58 130 V338" stroke="#3b3f47" strokeWidth="1.1" opacity="0.8" />
      <g fill={ref("iron")}>
        <rect x="52.5" y="144" width="15" height="5" rx="2" />
        <rect x="54.5" y="152" width="11" height="4" rx="1.5" />
        <rect x="53.5" y="168" width="13" height="4" rx="1.5" />
        <ellipse cx="60" cy="322" rx="7.5" ry="10" />
        <rect x="52.5" y="333" width="15" height="5" rx="2" />
      </g>
      <path d="M53 145.5 H67 M57 322 V314" stroke="#3b3f47" strokeWidth="1" opacity="0.8" />

      {/* lantern neeche ka hissa */}
      <circle cx="60" cy="121" r="5" fill={ref("iron")} />
      <rect x="54" y="111" width="12" height="7" rx="2" fill={ref("iron")} />
      <path d="M39 104 H81 L77 112 H43 Z" fill={ref("iron")} />

      {/* lantern ka sheesha */}
      <polygon
        className={on ? "rl-glass is-on" : "rl-glass"}
        points="36,46 84,46 79,105 41,105"
        fill={on ? ref("glassOn") : ref("glassOff")}
      />
      {!on && <path d="M42 52 L45 96" stroke="#fff" strokeOpacity="0.12" strokeWidth="3" strokeLinecap="round" />}
      <path d="M36 46 L41 105 M84 46 L79 105" stroke="#08090a" strokeWidth="3.2" />
      <path d="M60 46 V105" stroke="#08090a" strokeWidth="2" />
      <rect x="34" y="43" width="52" height="5" rx="1.5" fill={ref("iron")} />

      {/* chhat aur kalash */}
      <rect x="28" y="38" width="64" height="6" rx="2.5" fill={ref("iron")} />
      <path d="M33 40 Q35 24 60 17 Q85 24 87 40 Z" fill={ref("iron")} />
      <path d="M41 33 Q49 24 59 21" fill="none" stroke="#4a4f58" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
      <path d="M56.5 13 L60 0 L63.5 13 Z" fill={ref("iron")} />
      <circle cx="60" cy="15" r="3.6" fill={ref("iron")} />

      <circle className="rl-halo" cx="60" cy="76" r="88" fill={ref("halo")} />
    </svg>
  );
}

/* ---------- Ek pole: lamp post + chhota control box (red OFF / green ON) ---------- */
function Pole({ uid, label, x, on, onTurnOn, onTurnOff }) {
  return (
    <div className={"rl-pole" + (on ? " is-on" : "")} style={{ "--lx": x }}>
      <PoleArt uid={uid} on={on} />
      <span className="rl-reflect" aria-hidden="true" />

      <div className="rl-box" role="group" aria-label={`${label} controls`}>
        <span className={"rl-led" + (on ? " is-on" : "")} aria-hidden="true" />
        <div className="rl-key">
          <button
            type="button"
            className={"rl-btn rl-btn--red" + (!on ? " is-active" : "")}
            onClick={onTurnOff}
            aria-pressed={!on}
            aria-label={`Turn ${label} off`}
          />
          <span className="rl-key-label" aria-hidden="true">OFF</span>
        </div>
        <div className="rl-key">
          <button
            type="button"
            className={"rl-btn rl-btn--green" + (on ? " is-active" : "")}
            onClick={onTurnOn}
            aria-pressed={on}
            aria-label={`Turn ${label} on`}
          />
          <span className="rl-key-label" aria-hidden="true">ON</span>
        </div>
      </div>
    </div>
  );
}

/* ---------- Task 7: Light switch ---------- */
export default function LightSwitch() {
  const [lights, setLights] = useState({ one: true, two: true });
  const setLight = (key, value) => setLights((l) => ({ ...l, [key]: value }));
  const litCount = POLES.filter((p) => lights[p.key]).length;
  const allOff = litCount === 0; // dono lights band -> poora scene black

  return (
    <section
      className={"rl-scene" + (allOff ? " is-dark" : "")}
      style={{
        "--rl-bricks": `url("${BRICKS_DARK}")`,
        "--rl-bricks-lit": `url("${BRICKS_LIT}")`,
        "--rl-cobbles": `url("${COBBLES}")`,
        "--lit": litCount,
      }}
      aria-label="Brick wall at night with two street lights and a bench"
    >
      <div className="rl-stage">
        <div className="rl-wall" aria-hidden="true" />
        <div className="rl-edge" aria-hidden="true"><span className="rl-window" /></div>

        {POLES.map((p) => (
          <div
            key={p.key}
            className={"rl-lit" + (lights[p.key] ? " is-on" : "")}
            style={{ "--lx": p.x }}
            aria-hidden="true"
          />
        ))}

        <Foliage />

        <div className="rl-plinth" aria-hidden="true" />
        <div className="rl-walk" aria-hidden="true" />
        <div className="rl-curb" aria-hidden="true" />
        <div className="rl-road" aria-hidden="true" />
        <div className="rl-vignette" aria-hidden="true" />
        <div className="rl-grain" aria-hidden="true" />

        <Bench />
        <div className="rl-night" aria-hidden="true" />

        {POLES.map((p) => (
          <Pole
            key={p.key}
            uid={p.key}
            label={p.label}
            x={p.x}
            on={lights[p.key]}
            onTurnOn={() => setLight(p.key, true)}   // green button -> light chalu
            onTurnOff={() => setLight(p.key, false)} // red button  -> light band
          />
        ))}

        {POLES.map((p) => (
          <p
            key={p.key}
            className={"rl-status" + (lights[p.key] ? " is-on" : "")}
            style={{ "--lx": p.x }}
            role="status"
          >
            <span className="rl-status-dot" aria-hidden="true" />
            {p.label}: Light {lights[p.key] ? "ON" : "OFF"}
          </p>
        ))}
      </div>
    </section>
  );
}
/*
  3D figures for the exam problems on solids in the note "Basic geometry: a comprehensive viewpoint"
  (Fuvest, Unicamp, ITA and IMO), drawn with three.js through the helpers of geometry-space.js.

  Each problem has a block  ::: {.geo-fig data-fig="NAME"}  in its statement and another one with
  data-mode="solution" in its solution; FIG3[NAME](g, mode) draws the first one when mode is "" and
  the second (with the steps of the solution) when mode is "solution".
*/
const S3 = window.GeoSpace;
if (S3) {
const { THREE, FIG3, C, D2R, V3, fmt, vec, rod, lines, face, dot, rightMark, arcMark, surface, circle3, disc, clear } = S3;
const SOL = (mode) => mode === "solution";
const col = (c) => "#" + c.toString(16).padStart(6, "0");
const mid3 = (P, Q) => vec(P).clone().add(vec(Q)).multiplyScalar(0.5);
// the midpoint of PQ, pushed a distance d away from the point `from`
const away = (P, Q, from, d = 0.2) => {
  const m = mid3(P, Q), u = m.clone().sub(vec(from));
  return u.length() < 1e-9 ? m : m.add(u.normalize().multiplyScalar(d));
};
const outFrom = (P, c, d = 0.2) => vec(P).clone().add(vec(P).clone().sub(vec(c)).normalize().multiplyScalar(d));
const ring = (pts, color = C.line, r = 0.02) => {
  const gr = new THREE.Group();
  pts.forEach((p, i) => gr.add(rod(p, pts[(i + 1) % pts.length], color, r)));
  return gr;
};
// the volume of a convex polyhedron given by its faces (fans from an interior point)
function convexVolume(faces) {
  const all = faces.flat(), c = all.reduce((s, p) => s.add(p), V3(0, 0, 0)).multiplyScalar(1 / all.length);
  let V = 0;
  faces.forEach((F) => {
    for (let i = 1; i < F.length - 1; i++) {
      const a = F[0].clone().sub(c), b = F[i].clone().sub(c), d = F[i + 1].clone().sub(c);
      V += Math.abs(a.dot(b.cross(d))) / 6;
    }
  });
  return V;
}
// Steps of a solution in 3D: the figure redraws itself from st.k
function steps3(g, list) {
  const st = { k: 0 };
  g.button("◀ Voltar", () => { st.k = Math.max(0, st.k - 1); });
  g.button("Próximo passo ▶", () => { st.k = Math.min(list.length - 1, st.k + 1); });
  g.readout(() => list.slice(0, st.k + 1)
    .map((t, i) => (i ? `<span class="step">${i}.</span> ` : "") + (typeof t === "function" ? t() : t)).join("<br>"));
  return st;
}
const ball = (p, r, color, opacity = 1) => {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 36, 24),
    new THREE.MeshLambertMaterial({ color, transparent: opacity < 1, opacity, depthWrite: opacity >= 1 }));
  m.position.copy(vec(p));
  return m;
};
const cone = (r0, z0, r1, z1, color, opacity, n = 48) => surface((u, w) => {
  const r = r0 + (r1 - r0) * w;
  return [r * Math.cos(2 * Math.PI * u), r * Math.sin(2 * Math.PI * u), z0 + (z1 - z0) * w];
}, n, 4, color, opacity);
const hcircle = (z, r, color = C.line) => circle3([0, 0, z], [1, 0, 0], [0, 1, 0], r, color);

// =================================================================================
// Metric relations in the right triangle — ITA 2023, question 46: a right triangle turns about its hypotenuse
FIG3["p-ita23-46"] = (g, mode) => {
  const sol = SOL(mode);
  const v = g.view({ theta: -72, phi: 16, r: 6.6, target: [0, 0, 0] });
  const k = 0.3, a = 10 * k, m = 1 * k, h = 3 * k, xH = -a / 2 + m;          // hypotenuse 10, altitude 3, segments 1 and 9
  const A = V3(-a / 2, 0, 0), B = V3(a / 2, 0, 0), Hf = V3(xH, 0, 0);
  const turn = sol ? { value: 360 } : g.slider("gire o triângulo:", 0, 360, 1, 0, (x) => x + "°");
  const st = sol ? steps3(g, [
    "Girando o triângulo em torno da hipotenusa, obtemos dois cones com a mesma base.",
    "O raio comum é a altura h; as alturas m e n somam 10: V = πh²m/3 + πh²n/3 = πh²·10/3 = 30π; logo, h = 3.",
    "Relações métricas: bc = ah = 10·3 = 30 e b² + c² = a² = 100.",
    `(b + c)² = 100 + 60 = 160; logo, b + c = 4√10: <span class="ok">perímetro = 10 + 4√10</span>.`,
  ]) : null;
  if (!sol) g.readout(() => "Um triângulo retângulo de hipotenusa 10 cm gira em torno da hipotenusa. O sólido tem volume 30π cm³. O perímetro do triângulo = ?");
  const dyn = new THREE.Group();
  v.root.add(dyn);
  const redraw = () => {
    clear(dyn); v.clearLabels();
    const T = turn.value * D2R, s = sol ? st.k : 0;
    const Cp = (t) => V3(xH, -h * Math.sin(t), h * Math.cos(t));
    dyn.add(lines([A.clone().add(V3(-0.7, 0, 0)), B.clone().add(V3(0.7, 0, 0))], C.aux, true));
    if (T > 1e-3) {
      dyn.add(surface((u, w) => { const t = T * w; return [-a / 2 + m * u, -h * u * Math.sin(t), h * u * Math.cos(t)]; }, 6, 64, C.face, 0.4));
      dyn.add(surface((u, w) => { const t = T * w; return [xH + (a / 2 - xH) * u, -h * (1 - u) * Math.sin(t), h * (1 - u) * Math.cos(t)]; }, 8, 64, C.faceA, 0.4));
      dyn.add(lines(Array.from({ length: 97 }, (_, i) => Cp(T * i / 96)), C.d));
    }
    const Cc = Cp(T);
    dyn.add(face([A, B, Cc], C.faceB, 0.65), ring([A, B, Cc], C.line, 0.022));
    dyn.add(dot(Cc, C.d, 0.05));
    v.label(V3(0, 0, -0.22), sol && s >= 1 ? "a = 10" : "10", "#1c1f26", 14);
    if (sol && s >= 1) {
      dyn.add(rod(Hf, Cc, C.d, 0.026), rightMark(Hf, V3(1, 0, 0), Cc.clone().sub(Hf), 0.1, C.d));
      v.label(mid3(Hf, Cc).add(V3(0.13, 0, 0)), "h", col(C.d), 17);
      v.label(mid3(A, Hf).add(V3(0, 0, -0.2)), "m", col(C.c), 15);   // below the axis: above it, h and c are close
      v.label(mid3(Hf, B).add(V3(0, 0, 0.18)), "n", col(C.c), 15);
    }
    if (sol && s >= 2) {
      v.label(away(A, Cc, B, 0.18), "c", col(C.b), 17);
      v.label(away(B, Cc, A, 0.18), "b", col(C.b), 17);
    }
  };
  redraw();
  return redraw;
};

// A line perpendicular to a plane — ITA 2013, question 19: the trirectangular trihedron
FIG3["p-ita13-19"] = (g, mode) => {
  const sol = SOL(mode);
  const v = g.view({ theta: 38, phi: 24, r: 7, target: [0.55, 0.2, 0.9] });
  const k = 0.55, Vx = V3(0, 0, 0), A = V3(3 * k, 0, 0), B = V3(0, 1 * k, 0), Cc = V3(0, 0, 4 * k);
  const G = A.clone().add(B).add(Cc).multiplyScalar(1 / 3);
  const st = sol ? steps3(g, [
    "VA = x, VB = y, VC = z, perpendiculares duas a duas; AB = √10, BC = √17, CA = 5.",
    "Cada aresta é perpendicular ao plano das outras duas: as faces em V são triângulos retângulos, x² + y² = 10, y² + z² = 17, x² + z² = 25.",
    "Um sistema linear em X = x², Y = y², Z = z²: X + Y = 10, Y + Z = 17, X + Z = 25. Somando as três, cada incógnita aparece duas vezes: 2(X + Y + Z) = 52, X + Y + Z = 26. Subtraindo cada equação dessa soma: Z = 16, X = 9, Y = 1; logo, x = 3, y = 1, z = 4.",
    `Base VAB (um triângulo retângulo, de área 3·1/2) e altura VC = 4: <span class="ok">volume = ⅓·(3/2)·4 = 2</span>.`,
  ]) : null;
  if (!sol) g.readout(() => "Três arestas por V, perpendiculares duas a duas, são cortadas por um plano em A, B, C; os lados de ABC medem √10, √17 e 5 cm. Volume de VABC = ?");
  const dyn = new THREE.Group();
  v.root.add(dyn);
  const redraw = () => {
    clear(dyn); v.clearLabels();
    const s = sol ? st.k : 0;
    [[A, V3(4.6 * k, 0, 0)], [B, V3(0, 2.4 * k, 0)], [Cc, V3(0, 0, 5.2 * k)]].forEach(([P, Q]) => dyn.add(lines([P, Q], C.aux, true)));
    dyn.add(face([A, B, Cc], C.face, 0.35), ring([A, B, Cc], C.c, 0.022));
    dyn.add(face([Vx, A, B], s >= 3 ? C.faceA : C.faceB, s >= 3 ? 0.6 : 0.18), face([Vx, B, Cc], C.faceB, 0.18), face([Vx, A, Cc], C.faceB, 0.18));
    dyn.add(rod(Vx, A, C.line, 0.022), rod(Vx, B, C.line, 0.022), rod(Vx, Cc, s >= 3 ? C.d : C.line, s >= 3 ? 0.04 : 0.022));
    [Vx, A, B, Cc].forEach((p) => dyn.add(dot(p, C.ink, 0.05)));
    v.label(V3(-0.15, -0.12, -0.12), "V"); v.label(outFrom(A, G, 0.2), "A"); v.label(outFrom(B, G, 0.22), "B"); v.label(outFrom(Cc, G, 0.2), "C");
    v.label(away(A, B, Vx, 0.25), "√10", col(C.c), 14); v.label(away(B, Cc, Vx, 0.3), "√17", col(C.c), 14); v.label(away(A, Cc, Vx, 0.22), "5", col(C.c), 14);
    if (s >= 1) {
      dyn.add(rightMark(Vx, A, B, 0.16), rightMark(Vx, B, Cc, 0.16), rightMark(Vx, A, Cc, 0.16));
      const nm = s >= 2 ? ["x = 3", "y = 1", "z = 4"] : ["x", "y", "z"];
      v.label(mid3(Vx, A).add(V3(0, -0.2, -0.05)), nm[0], col(C.d), 15);
      v.label(mid3(Vx, B).add(V3(-0.05, 0.05, -0.34)), nm[1], col(C.d), 15);
      v.label(mid3(Vx, Cc).add(V3(0.24, -0.31, 0)), nm[2], col(C.d), 15);   // to the left of VC on the screen
    }
  };
  redraw();
  return redraw;
};

// Prisms — Fuvest 2024, question 31: a cylindrical tank lying down, at 3/4 of its height
FIG3["p-fuv24-31"] = (g, mode) => {
  const sol = SOL(mode);
  // in the solution the camera looks at the near end of the tank, where the angle is drawn
  const v = g.view(sol ? { theta: -74, phi: 14, r: 5.4, target: [0, 1.1, 0] } : { theta: -58, phi: 18, r: 7.6, target: [0, 1.5, 0] });
  const R = 0.5, L = 3;                              // radius 1 m and length 6 m, at scale 1/2
  const water = 0x60a5fa;
  // the part of the tank below the plane z = zl (or above it)
  const part = (zl, color, opacity, upper = false) => {
    const p0 = Math.asin(Math.max(-1, Math.min(1, zl / R)));
    const a0 = upper ? p0 : Math.PI - p0, a1 = upper ? Math.PI - p0 : 2 * Math.PI + p0;
    const arc = (y) => Array.from({ length: 49 }, (_, i) => { const t = a0 + (a1 - a0) * i / 48; return V3(R * Math.cos(t), y, R * Math.sin(t)); });
    const gr = new THREE.Group(), xc = R * Math.cos(p0);
    gr.add(face(arc(0), color, opacity), face(arc(L), color, opacity));
    gr.add(surface((u, w) => { const t = a0 + (a1 - a0) * u; return [R * Math.cos(t), L * w, R * Math.sin(t)]; }, 48, 2, color, opacity));
    if (xc > 1e-4) gr.add(face([V3(-xc, 0, zl), V3(xc, 0, zl), V3(xc, L, zl), V3(-xc, L, zl)], color, opacity));
    return gr;
  };
  const del = sol ? { value: 1 } : g.slider("entregue a água:", 0, 1, 0.01, 0, (x) => "nível em " + fmt(100 * (1 - x / 4), 0) + "% da altura");
  const st = sol ? steps3(g, [
    "Depois da entrega, a água está a 3/4 da altura; a água usada é a parte de cima, vazia (laranja).",
    "Um prisma deitado: as suas bases são segmentos circulares e o seu comprimento é 6 m. Volume = (área da base)·6.",
    "Raio 1; a corda está 1/2 acima do centro: cos α = 1/2, α = 60°, e o segmento corresponde a um ângulo central de 2α = 120°.",
    "Segmento = setor − triângulo = (120°/360°)·π·1² − ½·1·1·sen 120° = π/3 − √3/4.",
    `<span class="ok">Volume = 6(π/3 − √3/4) = 2π − 3√3/2 m³</span>.`,
  ]) : null;
  if (!sol) g.readout(() => "O tanque (6 m de comprimento, 2 m de diâmetro) estava cheio; depois da entrega, a água está a 3/4 da altura. Água usada = ?");
  const dyn = new THREE.Group();
  v.root.add(dyn);
  const redraw = () => {
    clear(dyn); v.clearLabels();
    const s = sol ? st.k : 0, frac = 1 - del.value / 4, zl = -R + 2 * R * frac;
    dyn.add(surface((u, w) => [R * Math.cos(2 * Math.PI * u), L * w, R * Math.sin(2 * Math.PI * u)], 48, 2, C.face, 0.1));
    dyn.add(circle3([0, 0, 0], [1, 0, 0], [0, 0, 1], R), circle3([0, L, 0], [1, 0, 0], [0, 0, 1], R));
    [[R, 0], [-R, 0], [0, R], [0, -R]].forEach(([x, z]) => dyn.add(lines([V3(x, 0, z), V3(x, L, z)], C.aux)));
    dyn.add(part(zl, water, 0.45));
    if (sol) dyn.add(part(zl, C.faceA, 0.5, true));
    if (!sol) {
      v.label(V3(R + 0.2, L / 2, -R), "6 m", "#1c1f26", 14);
      v.label(V3(-R - 0.35, 0, 0), "2 m", "#1c1f26", 14);
      dyn.add(rod(V3(-R - 0.15, 0, -R), V3(-R - 0.15, 0, R), C.aux, 0.01));
    }
    if (sol && s >= 1) v.label(V3(R + 0.2, L / 2, R * 0.9), "6", col(C.d), 15);
    if (sol && s >= 2) {
      const xc = R * Math.sqrt(1 - (zl / R) ** 2), O = V3(0, -0.002, 0), E1 = V3(-xc, -0.002, zl), E2 = V3(xc, -0.002, zl);
      dyn.add(rod(O, E1, C.d, 0.012), rod(O, E2, C.d, 0.012), rod(E1, E2, C.line, 0.012), lines([O, V3(0, -0.002, zl)], C.c, true));
      const Mc = V3(0, -0.002, zl);   // the foot of the perpendicular from the centre to the chord
      dyn.add(arcMark(O, Mc, E2, 0.12, C.d), dot(O, C.ink, 0.025));
      // α between the perpendicular and a radius (the central angle is 2α); ½ on the other side of the perpendicular
      v.label(V3(0.1, -0.01, 0.19), "α", col(C.d), 16);
      v.label(V3(-0.07, -0.01, zl / 2), "½", col(C.c), 15);
      v.label(mid3(O, E2).add(V3(0.12, 0, -0.06)), "1", col(C.d), 14);
    }
  };
  redraw();
  return redraw;
};

// Right angles in solids — Fuvest 2026, second phase, question 5: the lamp at the vertex of a pyramid in a cube
FIG3["p-fuv26-5"] = (g, mode) => {
  const sol = SOL(mode);
  const v = g.view(sol ? { theta: -104, phi: 16, r: 7.2, target: [1, 1, 0.8] } : { theta: -62, phi: 20, r: 8, target: [1, 1, 0.95] });
  const k = 0.5, s2 = Math.SQRT2;
  const [A, B, F, E, D, Cc, G, H] = [[0, 0, 0], [4, 0, 0], [4, 4, 0], [0, 4, 0], [0, 0, 4], [4, 0, 4], [4, 4, 4], [0, 4, 4]].map((p) => V3(...p).multiplyScalar(k));
  const Q = V3(2, 2, 0).multiplyScalar(k), R = V3(2, 2, 4).multiplyScalar(k), ctr = V3(1, 1, 1);
  let part = 0;
  const ht = sol ? null : g.slider("altura PQ da luminária:", 0.2, 3.8, 0.01, 2, (x) => fmt(x) + " m");
  if (sol) g.choice(["a) arestas de 3 m", "b) arestas a 45°", "c) projeção de PF"], 0, (i) => { part = i; });
  g.readout(() => !sol ? "Uma pirâmide regular de base ABFE (o piso de um cubo de aresta 4 m) e vértice P (a luminária). Q e R: os centros do piso e do teto."
    : part === 0 ? `a) PQ ⊥ piso; logo, PQ ⊥ QB = 4√2/2 = 2√2. No triângulo retângulo PQB: PQ² + 8 = 9, <span class="ok">PQ = 1 m</span>.`
    : part === 1 ? `b) O ângulo em B é 45°: PQB é um triângulo retângulo isósceles, PQ = QB = 2√2, e <span class="ok">PB = 2√2·√2 = 4 m</span>.`
    : `c) S é a projeção de P sobre a face de trás EFGH; a projeção de PF é SF. S está 2√2 acima do ponto médio M de EF, e MF = 2: SF² = 8 + 4, <span class="ok">SF = 2√3 m</span>.`);
  const dyn = new THREE.Group();
  v.root.add(dyn);
  const redraw = () => {
    clear(dyn); v.clearLabels();
    const pq = sol ? (part === 0 ? 1 : 2 * s2) : ht.value, P = V3(2, 2, pq).multiplyScalar(k);
    const P8 = [A, B, F, E, D, Cc, G, H];
    [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]].forEach(([i, j]) => dyn.add(rod(P8[i], P8[j], C.aux, 0.012)));
    dyn.add(face([D, Cc, G, H], C.face, 0.12), face([A, B, F, E], C.face, 0.18));
    [[A, B], [B, F], [F, E], [E, A]].forEach(([X, Y]) => dyn.add(face([P, X, Y], C.faceA, 0.22)));
    [A, B, F, E].forEach((X) => dyn.add(rod(P, X, C.a, 0.018)));
    dyn.add(lines([Q, R], C.aux, true), dot(P, C.gold, 0.08), dot(Q, C.ink, 0.04), dot(R, C.ink, 0.04));
    [[A, "A"], [B, "B"], [F, "F"], [E, "E"], [D, "D"], [Cc, "C"], [G, "G"], [H, "H"]].forEach(([p, nm]) => v.label(outFrom(p, ctr, 0.2), nm, "#1c1f26", 14));
    v.label(P.clone().add(V3(0.18, -0.16, 0.18)), "P", col(C.gold), 16); v.label(Q.clone().add(V3(0.1, -0.1, -0.12)), "Q", "#1c1f26", 14);
    v.label(R.clone().add(V3(0.1, -0.1, 0.14)), "R", "#1c1f26", 14);
    if (!sol) return;
    if (part < 2) {
      dyn.add(face([P, Q, B], C.faceB, 0.55), rod(P, Q, C.d, 0.03), rod(Q, B, C.b, 0.03), rod(P, B, C.c, 0.03));
      dyn.add(rightMark(Q, P.clone().sub(Q), B.clone().sub(Q), 0.13, C.d));
      if (part === 1) dyn.add(arcMark(B, Q.clone().sub(B), P.clone().sub(B), 0.32, C.b));
      v.label(mid3(P, Q).add(V3(-0.15, 0, 0)), part === 0 ? "1" : "2√2", col(C.d), 15);
      v.label(mid3(Q, B).add(V3(0.05, -0.18, -0.08)), "2√2", col(C.b), 15);
      v.label(mid3(P, B).add(V3(0.12, -0.05, 0.1)), part === 0 ? "3" : "4", col(C.c), 16);
    } else {
      const Sp = V3(2, 4, pq).multiplyScalar(k), M = V3(2, 4, 0).multiplyScalar(k);
      dyn.add(face([E, F, G, H], C.faceC, 0.22), face([Sp, M, F], C.faceB, 0.55));
      dyn.add(rod(P, F, C.a, 0.03), lines([P, Sp], C.c, true), rod(Sp, M, C.d, 0.03), rod(M, F, C.b, 0.03), rod(Sp, F, C.c, 0.035));
      dyn.add(rightMark(M, Sp.clone().sub(M), F.clone().sub(M), 0.13, C.d), dot(Sp, C.c, 0.05), dot(M, C.ink, 0.04));
      v.label(Sp.clone().add(V3(-0.1, 0.12, 0.14)), "S", col(C.c), 16); v.label(M.clone().add(V3(0, 0.12, -0.16)), "M", "#1c1f26", 14);
      v.label(mid3(Sp, M).add(V3(-0.2, 0.05, 0)), "2√2", col(C.d), 15); v.label(mid3(M, F).add(V3(0, 0.1, -0.16)), "2", col(C.b), 15);
      v.label(Sp.clone().lerp(F, 0.66).add(V3(-0.1, 0.03, -0.14)), "2√3", col(C.c), 16);   // inside the triangle SMF, away from PF
    }
  };
  redraw();
  return redraw;
};

// Pyramids and tetrahedra — ITA 2027, question 11: four edges √3 and two opposite edges 2
FIG3["p-ita27-11"] = (g, mode) => {
  const sol = SOL(mode);
  // seen through the face ACD: B falls inside the triangle ACD on the screen (no crossing edges) and AMD is seen
  // nearly face-on. The edge labels are placed by hand for this view (3D point = (−Y/2, X, 0.866·Y) for the
  // screen offset (X, Y) from M).
  const v = g.view({ theta: 0, phi: 30, r: 5.2, target: [0, 0, 0.35] });
  const A = V3(0, -1, 1), D = V3(0, 1, 1), B = V3(-1, 0, 0), Cc = V3(1, 0, 0), M = V3(0, 0, 0), G = V3(0, 0, 0.5);
  const st = sol ? steps3(g, [
    "BC = AD = 2; as outras quatro arestas medem √3.",
    "M é o ponto médio de BC. ABC e DBC são isósceles: AM ⊥ BC, DM ⊥ BC, e AM = DM = √(3 − 1) = √2.",
    "BC é perpendicular ao plano AMD, que divide o tetraedro em duas pirâmides de base AMD e alturas MB = MC = 1. V = ⅓[AMD]·(1 + 1).",
    `AMD tem lados √2, √2, 2: como 2 + 2 = 4, ele é retângulo em M, e [AMD] = 1. <span class="ok">V = 2/3</span>.`,
  ]) : null;
  if (!sol) g.readout(() => "Um tetraedro com quatro arestas √3 e duas arestas opostas 2. Volume = ?");
  const dyn = new THREE.Group();
  v.root.add(dyn);
  const redraw = () => {
    clear(dyn); v.clearLabels();
    const s = sol ? st.k : 0;
    if (s >= 2) {
      [[A, M, B], [D, M, B], [A, D, B]].forEach((T) => dyn.add(face(T, C.faceB, 0.28)));
      [[A, M, Cc], [D, M, Cc], [A, D, Cc]].forEach((T) => dyn.add(face(T, C.faceA, 0.28)));
      dyn.add(face([A, M, D], C.faceC, 0.6));
    } else [[A, B, Cc], [D, B, Cc], [A, D, B], [A, D, Cc]].forEach((T) => dyn.add(face(T, C.face, 0.22)));
    [[A, B], [A, Cc], [D, B], [D, Cc]].forEach(([X, Y]) => dyn.add(rod(X, Y, C.line, 0.022)));
    dyn.add(rod(B, Cc, C.d, 0.028), rod(A, D, C.d, 0.028));
    [A, B, Cc, D].forEach((p) => dyn.add(dot(p, C.ink, 0.05)));
    [[A, "A"], [Cc, "C"], [D, "D"]].forEach(([p, nm]) => v.label(outFrom(p, G, 0.22), nm));
    v.label(V3(-0.33, 0, 0.57), "B");   // above B, between AB and DB
    [V3(-0.39, -0.5, 0.675), V3(-0.39, 0.5, 0.675), V3(-0.0475, -0.62, 0.082), V3(-0.0475, 0.62, 0.082)].forEach((p) => v.label(p, "√3", col(C.c), 13));
    v.label(V3(0.125, 0.1, -0.2165), "2", col(C.d), 15); v.label(V3(-0.55, 0, 0.95), "2", col(C.d), 15);
    if (s >= 1) {
      dyn.add(rod(A, M, C.b, 0.02), rod(D, M, C.b, 0.02), dot(M, C.b, 0.045));
      dyn.add(rightMark(M, A, Cc, 0.1, C.b), rightMark(M, D, Cc, 0.1, C.b));
      v.label(V3(0.015, -0.15, -0.026), "M", col(C.b), 15);
      v.label(V3(-0.295, -0.55, 0.511), "√2", col(C.b), 14); v.label(V3(-0.295, 0.55, 0.511), "√2", col(C.b), 14);
    }
    if (s >= 3) dyn.add(rightMark(M, A, D, 0.16, C.c));
  };
  redraw();
  return redraw;
};

// The angle between two planes — ITA 2015, question 30: a 3 × 4 sheet folded along its diagonal
FIG3["p-ita15-30"] = (g, mode) => {
  const sol = SOL(mode);
  const v = g.view({ theta: -90, phi: 34, r: 6.4, target: [1.5, -0.1, 0.35] });   // AC across the screen, B above it, D below
  const k = 0.6, A = V3(0, 0, 0), Cc = V3(5 * k, 0, 0), K = V3(1.8 * k, 0, 0), H = V3(3.2 * k, 0, 0), D = V3(1.8 * k, -2.4 * k, 0);
  const fold = sol ? { value: 90 } : g.slider("dobra:", 0, 90, 1, 0, (x) => "ângulo entre as metades " + (180 - x) + "°");
  const st = sol ? steps3(g, [
    "Retângulo ABCD (AB = 4, BC = 3) dobrado ao longo de AC = 5 até as metades formarem um ângulo reto. Cinco arestas mantêm as medidas: 3, 4, 3, 4, 5. A sexta é BD.",
    "Alturas relativas à dobra: BH = DK = 3·4/5 = 12/5, com AH = 4²/5 = 16/5 e AK = 3²/5 = 9/5; logo, HK = 7/5.",
    "Os planos formam um ângulo reto e BH, DK são perpendiculares à dobra: BH ⊥ plano ACD; logo, BH ⊥ HD.",
    `HD² = HK² + KD² = (49 + 144)/25 e BD² = BH² + HD² = 337/25: <span class="ok">BD = √337/5</span>.`,
  ]) : null;
  if (!sol) g.readout(() => `Dobre a folha ABCD (3 cm × 4 cm) ao longo da diagonal AC até as duas metades formarem um ângulo reto${fold.value === 90 ? " (agora)" : ""}; depois complete o tetraedro. As arestas = ?`);
  const dyn = new THREE.Group();
  v.root.add(dyn);
  const redraw = () => {
    clear(dyn); v.clearLabels();
    const s = sol ? st.k : 0, p = fold.value * D2R, B = V3(3.2 * k, 2.4 * k * Math.cos(p), 2.4 * k * Math.sin(p));
    const G = A.clone().add(B).add(Cc).add(D).multiplyScalar(0.25);
    dyn.add(face([A, Cc, D], C.face, 0.4), face([A, B, Cc], C.faceA, 0.45));
    dyn.add(ring([A, B, Cc, D], C.line, 0.02), rod(A, Cc, C.c, 0.025));
    if (fold.value > 0) dyn.add(s >= 3 ? rod(B, D, C.d, 0.03) : lines([B, D], C.d, true));
    [A, B, Cc, D].forEach((P) => dyn.add(dot(P, C.ink, 0.045)));
    [[A, "A"], [B, "B"], [Cc, "C"], [D, "D"]].forEach(([P, nm]) => v.label(outFrom(P, G, 0.22), nm));
    v.label(away(A, B, Cc, 0.15), "4"); v.label(away(B, Cc, A, 0.15), "3"); v.label(away(Cc, D, A, 0.15), "4"); v.label(away(D, A, Cc, 0.15), "3");
    if (s < 1) v.label(mid3(A, Cc).add(V3(0.3, 0.05, -0.17)), "5", col(C.c), 15);   // later the points H, K take its place
    if (s >= 1) {
      dyn.add(rod(B, H, C.b, 0.02), rod(D, K, C.b, 0.02), dot(H, C.b, 0.04), dot(K, C.b, 0.04));
      dyn.add(rightMark(H, B.clone().sub(H), V3(1, 0, 0), 0.12, C.b), rightMark(K, D.clone().sub(K), V3(-1, 0, 0), 0.12, C.b));
      v.label(H.clone().add(V3(0.1, 0.08, -0.17)), "H", col(C.b), 14); v.label(K.clone().add(V3(-0.12, 0, 0.17)), "K", col(C.b), 14);
      v.label(mid3(B, H).add(V3(0.2, 0, 0)), "12/5", col(C.b), 13); v.label(mid3(D, K).add(V3(-0.2, 0, 0.05)), "12/5", col(C.b), 13);
      v.label(H.clone().lerp(K, 0.25).add(V3(0, 0, -0.2)), "7/5", col(C.c), 13);   // below AC, clear of BD
    }
    if (s >= 2) dyn.add(lines([H, D], C.aux, true), rightMark(H, B.clone().sub(H), D.clone().sub(H), 0.14, C.d));
    if (s >= 3) v.label(D.clone().lerp(B, 0.68).add(V3(-0.33, 0, 0)), "√337/5", col(C.d), 15);
  };
  redraw();
  return redraw;
};

// Cylinders and cones — Unicamp 2023, second phase, question 1: wallpaper and lights on a pillar
FIG3["p-uni23-1"] = (g, mode) => {
  const sol = SOL(mode);
  const v = g.view({ theta: -24, phi: 10, r: 6.6, target: [0.45, 0.05, 1.35] });
  const k = 0.9, P0 = 1 * k, h = 3 * k, r = P0 / (2 * Math.PI);
  const lam = g.slider("desenrole o papel de parede:", 0, 1, 0.01, sol ? 1 : 0, (x) => Math.round(100 * x) + "%");
  g.readout(() => !sol ? "A pilastra: altura 3 m, perímetro da base 1 m. a) Papel de parede a R$ 20,00 o m²: custo = ? &nbsp; b) O menor fio de luzes que dá uma volta, de um ponto ao ponto logo acima dele = ?"
    : `a) Planificada, a lateral é um retângulo 1 m × 3 m: área 3 m², <span class="ok">custo R$ 60,00</span>.<br>b) O fio vira uma linha entre cantos opostos do retângulo; a menor é a diagonal: <span class="ok">√(1² + 3²) = √10 m</span>. (Enrole o papel de volta para vê-la como uma hélice.)`);
  const dyn = new THREE.Group();
  v.root.add(dyn);
  v.root.add(cone(r * 0.97, 0, r * 0.97, h, 0x94a3b8, 1, 32));
  const redraw = () => {
    clear(dyn); v.clearLabels();
    const l = Math.min(lam.value, 0.999), rho = r / (1 - l), xc = r - rho;
    const P = (u, w) => { const s = (u - 0.5) * 2 * Math.PI * r; return [xc + rho * Math.cos(s / rho), rho * Math.sin(s / rho), h * w]; };
    dyn.add(surface(P, 64, 4, C.faceB, 0.6));
    dyn.add(lines(Array.from({ length: 65 }, (_, i) => P(i / 64, 0)), C.line), lines(Array.from({ length: 65 }, (_, i) => P(i / 64, 1)), C.line));
    dyn.add(lines([P(0, 0), P(0, 1)], C.line), lines([P(1, 0), P(1, 1)], C.line));
    const n = 72;
    for (let i = 0; i < n; i++) dyn.add(rod(P(i / n, i / n), P((i + 1) / n, (i + 1) / n), C.gold, 0.012));
    for (let i = 0; i <= 12; i++) dyn.add(dot(P(i / 12, i / 12), i % 2 ? C.d : C.gold, 0.022));
    if (lam.value > 0.95) {
      v.label(V3(...P(0.5, 0)).add(V3(0, 0, -0.18)), "1 m", "#1c1f26", 14);
      v.label(V3(...P(1, 0.5)).add(V3(0, 0.22, 0)), "3 m", "#1c1f26", 14);
      if (sol) v.label(V3(...P(0.5, 0.5)).add(V3(0.05, -0.18, 0.12)), "√10", col(C.gold), 16);
    }
  };
  redraw();
  return redraw;
};

// Cylinders and cones — ITA 2019, question 40: a cone that unrolls into a sector of 216°
FIG3["p-ita19-40"] = (g, mode) => {
  const sol = SOL(mode);
  const v = g.view({ theta: -28, phi: 18, r: 9, target: [0.4, 0, 1.0] });
  const k = 0.25, gg = 10 * k, r = 6 * k, h = 8 * k;
  const lam = g.slider("planificar:", 0, 1, 0.01, sol ? 0 : 1, (x) => Math.round(100 * x) + "%");
  g.readout(() => !sol ? "Planificada, a superfície lateral do cone é um setor de 216°; a geratriz mede 10 cm. A altura do cone = ?"
    : `1. Planificada: um setor de raio g = 10 cujo arco é o perímetro da base: (216°/360°)·2π·10 = 12π = 2πr; logo, r = 6.` +
      `<br>2. O triângulo retângulo altura–raio–geratriz: <span class="ok">h = √(10² − 6²) = 8</span>.` + (lam.value > 0.05 ? " (Enrole o setor de volta no cone para vê-lo.)" : ""));
  const dyn = new THREE.Group();
  v.root.add(dyn);
  const redraw = () => {
    clear(dyn); v.clearLabels();
    const l = lam.value, rho = r + l * (gg - r), hl = Math.sqrt(Math.max(0, gg * gg - rho * rho));
    const d = Math.atan2(hl, rho) - Math.atan2(h, r);
    const rot = (x, y, z) => [x * Math.cos(d) - z * Math.sin(d), y, x * Math.sin(d) + z * Math.cos(d) + h];
    const P = (u, w) => { const s = (u - 0.5) * 2 * Math.PI * r; return rot(w * rho * Math.cos(s / rho), w * rho * Math.sin(s / rho), -w * hl); };
    dyn.add(surface(P, 72, 8, C.face, 0.5));
    dyn.add(lines(Array.from({ length: 73 }, (_, i) => P(i / 72, 1)), C.line));
    dyn.add(lines([P(0, 0), P(0, 1)], C.line), lines([P(1, 0), P(1, 1)], C.line));
    dyn.add(rod(P(0.5, 0), P(0.5, 1), C.c, 0.02));
    v.label(V3(...P(0.5, 0.55)).add(V3(0.42, 0.8, 0.06)), "g = 10", col(C.c), 15);   // to the right of the generatrix on the screen
    if (l < 0.97) dyn.add(disc([0, 0, 0], r, C.faceA, 0.35 * (1 - l)));
    if (l > 0.95) {
      v.label(V3(0, 0, h).add(V3(-0.1, -0.2, 0.22)), "216°", col(C.d), 16);
      if (sol) v.label(V3(...P(0.2, 1)).add(V3(0, -0.3, 0)), "arco = 2πr", col(C.d), 14);
    }
    if (sol && l < 0.03) {
      dyn.add(lines([V3(0, 0, h), V3(0, 0, 0)], C.d, true), rod(V3(0, 0, 0), V3(r, 0, 0), C.b, 0.02));
      dyn.add(rightMark(V3(0, 0, 0), [0, 0, 1], [1, 0, 0], 0.18, C.d));
      v.label(V3(-0.4, -0.1, h / 2), "h", col(C.d), 17); v.label(V3(r / 2, 0, -0.18), "r = 6", col(C.b), 15);
    }
  };
  redraw();
  return redraw;
};

// Differences of volumes — Fuvest 2025, question 75: a vase of two frustums
FIG3["p-fuv25-75"] = (g, mode) => {
  const sol = SOL(mode);
  const v = g.view({ theta: -50, phi: 14, r: 7.6, target: [0, 0, 1.2] });
  const k = 0.1, R = 10 * k, r = 5 * k, h = 12 * k;
  const st = sol ? steps3(g, [
    "A capacidade é o dobro do volume de um tronco.",
    "Complete o tronco de baixo até um cone de altura H: o cone pequeno retirado é semelhante, na razão r/R = 1/2; logo, H − 12 = H/2 e H = 24 (o seu vértice é o centro da boca!).",
    "Tronco = cone grande − cone pequeno = π·10²·24/3 − π·5²·12/3 = 800π − 100π = 700π.",
    `<span class="ok">Capacidade = 2·700π = 1400π cm³</span>.`,
  ]) : null;
  if (!sol) g.readout(() => "Dois troncos iguais unidos pelas bases menores: R = 10 cm, r = 5 cm, cada um de altura h = 12 cm. A capacidade do vaso = ?");
  const dyn = new THREE.Group();
  v.root.add(dyn);
  const redraw = () => {
    clear(dyn); v.clearLabels();
    const s = sol ? st.k : 0;
    dyn.add(cone(R, 0, r, h, C.face, s >= 1 ? 0.25 : 0.45), cone(r, h, R, 2 * h, C.face, s >= 1 ? 0.15 : 0.45));
    dyn.add(disc([0, 0, 0], R, C.face, 0.35), hcircle(0, R), hcircle(h, r, C.a), hcircle(2 * h, R));
    if (!sol || s === 0) {
      dyn.add(rod(V3(0, 0, 0), V3(R, 0, 0), C.b, 0.018), rod(V3(0, 0, h), V3(r, 0, h), C.a, 0.018), lines([V3(0, 0, 0), V3(0, 0, 2 * h)], C.aux, true));
      v.label(V3(R / 2, 0, -0.16), "R = 10", col(C.b), 14); v.label(V3(r / 2 + 0.15, 0, h + 0.25), "r = 5", col(C.a), 14);
      dyn.add(rod(V3(-R - 0.15, 0, 0), V3(-R - 0.15, 0, h), C.c, 0.012));
      v.label(V3(-R - 0.42, 0, h / 2), "h = 12", col(C.c), 14);
    }
    if (s >= 1) {
      const T = V3(0, 0, 2 * h);
      dyn.add(cone(r, h, 0, 2 * h, C.faceA, 0.6), dot(T, C.d, 0.05));
      [0, 1, 2, 3, 4, 5, 6, 7].forEach((i) => { const a = i * Math.PI / 4; dyn.add(lines([V3(R * Math.cos(a), R * Math.sin(a), 0), T], C.d, true)); });
      dyn.add(lines([V3(0, 0, 0), T], C.aux, true));
      v.label(T.clone().add(V3(0.15, 0, 0.18)), "vértice", col(C.d), 14);
      v.label(V3(-R - 0.35, 0, h), "H = 24", col(C.d), 15);
    }
  };
  redraw();
  return redraw;
};

// IMO 1965, Problem 3: a plane parallel to two opposite edges divides the tetrahedron
FIG3["imo1965-3"] = (g, mode) => {
  const sol = SOL(mode);
  const v = g.view({ theta: -64, phi: 18, r: 7.4, target: [0, 0, 0.8] });
  const A = V3(-1.25, 0, 0), B = V3(1.25, 0, 0), Cc = V3(-0.45, -1.15, 1.8), D = V3(0.6, 1.05, 1.8);
  const G = A.clone().add(B).add(Cc).add(D).multiplyScalar(0.25);
  const kk = g.slider("k:", 0.2, 4, 0.01, 1, (x) => fmt(x));
  const L = (P, Q, t) => P.clone().lerp(Q, t);
  const parts = () => {
    const t = kk.value / (kk.value + 1);
    const W = L(A, Cc, t), X = L(A, D, t), Y = L(B, D, t), Z = L(B, Cc, t), P = L(A, B, t);
    const lower = [[A, B, Z, W], [A, B, Y, X], [A, W, X], [B, Z, Y], [W, Z, Y, X]];
    const upper = [[W, Z, Cc], [X, Y, D], [W, Cc, D, X], [Z, Cc, D, Y], [W, Z, Y, X]];
    return { t, W, X, Y, Z, P, lower, upper };
  };
  const st = sol ? steps3(g, [
    "Queremos V₁/V₂ em função de k (mude k no controle).",
    "Com t = k/(k + 1), ε corta AC, AD, BD, BC em W, X, Y, Z na fração t a partir de A e de B. A seção WXYZ é um paralelogramo.",
    "O plano por W, X paralelo a BCD encontra AB em P: APWX é ABCD reduzido na razão t, volume t³V.",
    "PWX–BZY é um prisma (cada um de PB, WZ, XY é (1 − t)·AB): base t²[BCD], altura (1 − t) vezes a altura de A, volume 3t²(1 − t)V.",
    "V₁ = (3t² − 2t³)V e V₂ = (1 − t)²(1 + 2t)V; logo, V₁/V₂ = t²(3 − 2t)/((1 − t)²(1 + 2t)) = k²(k + 3)/(3k + 1).",
  ]) : null;
  if (!sol) g.readout(() => "O plano ε (verde) é paralelo a AB e a CD; as suas distâncias a AB e a CD estão na razão k. A razão entre os volumes dos dois sólidos = ?");
  const dyn = new THREE.Group();
  v.root.add(dyn);
  const redraw = () => {
    clear(dyn); v.clearLabels();
    const s = sol ? st.k : 0, q = parts();
    if (s >= 2) {
      [[A, q.P, q.W], [A, q.P, q.X], [A, q.W, q.X], [q.P, q.W, q.X]].forEach((T) => dyn.add(face(T, C.faceC, 0.5)));
      if (s >= 3) {
        [[q.P, q.W, q.X], [B, q.Z, q.Y], [q.P, B, q.Z, q.W], [q.P, B, q.Y, q.X], [q.W, q.Z, q.Y, q.X]].forEach((F) => dyn.add(face(F, C.faceA, 0.4)));
        dyn.add(ring([q.P, q.W, q.X], C.c, 0.014), rod(q.P, B, C.a, 0.014));
      }
      dyn.add(dot(q.P, C.c, 0.045)); v.label(q.P.clone().add(V3(0, -0.1, -0.18)), "P", col(C.c), 15);
    } else q.lower.slice(0, 4).forEach((F) => dyn.add(face(F, C.faceA, 0.3)));
    q.upper.slice(0, 4).forEach((F) => dyn.add(face(F, C.face, 0.25)));
    dyn.add(face([q.W, q.Z, q.Y, q.X], C.faceB, 0.6), ring([q.W, q.Z, q.Y, q.X], C.b, 0.018));
    [[A, B], [A, Cc], [A, D], [B, Cc], [B, D], [Cc, D]].forEach(([X, Y]) => dyn.add(rod(X, Y, (X === A && Y === B) || (X === Cc && Y === D) ? C.d : C.line, 0.02)));
    [A, B, Cc, D].forEach((p) => dyn.add(dot(p, C.ink, 0.05)));
    [[A, "A"], [B, "B"], [Cc, "C"], [D, "D"]].forEach(([p, nm]) => v.label(outFrom(p, G, 0.22), nm));
    v.label(q.Y.clone().add(V3(0.5, 0.3, -0.1)), "ε", col(C.b), 18);   // clear of the label of Y
    if (s >= 1) [[q.W, "W"], [q.X, "X"], [q.Y, "Y"], [q.Z, "Z"]].forEach(([p, nm]) => { dyn.add(dot(p, C.b, 0.04)); v.label(outFrom(p, G, 0.18), nm, col(C.b), 14); });
  };
  redraw();
  return redraw;
};

// The sphere — Unicamp 2023, question 50: a lead sphere in a cylinder of water
FIG3["p-uni23-50"] = (g, mode) => {
  const sol = SOL(mode);
  const v = g.view({ theta: -55, phi: 16, r: 9.4, target: [0, 0, 1.25] });
  const R = 0.55, Rc = 2 * R, Hc = 2.3, L0 = 1.35, top = Hc + R + 0.35;
  const water = 0x60a5fa;
  const down = g.slider("coloque a esfera:", 0, 1, 0.01, sol ? 1 : 0, (x) => Math.round(100 * x) + "%");
  const level = (zc) => {
    const cap = (L) => { const d = Math.max(0, Math.min(2 * R, L - (zc - R))); return Math.PI * d * d * (3 * R - d) / 3; };
    let lo = L0, hi = L0 + 2 * R;
    for (let i = 0; i < 50; i++) { const m = (lo + hi) / 2; if (Math.PI * Rc * Rc * m - cap(m) > Math.PI * Rc * Rc * L0) hi = m; else lo = m; }
    return (lo + hi) / 2;
  };
  const zc = () => top - down.value * (top - R);
  g.readout(() => !sol ? "Uma esfera de chumbo de raio R entra em um cilindro de raio 2R com água; no fim, a água cobre a esfera. Quanto a água sobe?"
    : `A água sobe o volume da esfera distribuído sobre a base do cilindro: π(2R)²·Δh = (4/3)πR³; logo, <span class="ok">Δh = R/3</span>.`);
  const dyn = new THREE.Group();
  v.root.add(dyn);
  const redraw = () => {
    clear(dyn); v.clearLabels();
    const z = zc(), Lw = level(z);
    dyn.add(cone(Rc, 0, Rc, Hc, C.face, 0.1, 64), hcircle(0, Rc), hcircle(Hc, Rc), disc([0, 0, 0], Rc, C.face, 0.15));
    dyn.add(cone(Rc * 0.995, 0, Rc * 0.995, Lw, water, 0.35, 64), disc([0, 0, Lw], Rc * 0.995, water, 0.35), hcircle(Lw, Rc * 0.995, 0x2563eb));
    dyn.add(ball([0, 0, z], R, 0x64748b));
    v.label(V3(0.82, 0.57, 0).multiplyScalar(R + 0.18).add(V3(0, 0, z)), "R", "#1c1f26", 15);
    dyn.add(rod(V3(0, 0, Hc + 0.12), V3(Rc, 0, Hc + 0.12), C.aux, 0.01));
    v.label(V3(Rc / 2, 0, Hc + 0.28), "2R", "#1c1f26", 14);
    if (sol) {
      dyn.add(circle3([0, 0, L0], [1, 0, 0], [0, 1, 0], Rc * 1.01, C.d));
      if (Lw - L0 > 0.02) {
        dyn.add(rod(V3(Rc + 0.12, 0, L0), V3(Rc + 0.12, 0, Lw), C.d, 0.015));
        v.label(V3(Rc + 0.4, 0, (L0 + Lw) / 2), "Δh", col(C.d), 15);
      }
      v.label(V3(-Rc - 0.25, 0, L0), "antes", col(C.d), 12);
    }
  };
  redraw();
  return redraw;
};

// IMO 1960, Problem 6: cone, inscribed sphere and the cylinder around the sphere
FIG3["imo1960-6"] = (g, mode) => {
  const sol = SOL(mode);
  const v = g.view({ theta: -78, phi: 12, r: 8.6, target: [0, 0, 1.1] });
  const H = 2.2, best = 2 * Math.asin(1 / 3) / D2R;
  const ang = g.slider("ângulo no vértice:", 20, 100, 0.1, 60, (x) => fmt(x, 1) + "°");
  if (sol) g.button("Menor razão", () => { ang.value = best; });
  const data = () => {
    const phi = ang.value / 2 * D2R, rho = H * Math.tan(phi), beta = Math.PI / 2 - phi, s = rho * Math.tan(beta / 2);
    return { phi, rho, s, t: Math.tan(beta / 2), k: (rho * rho * H / 3) / (2 * s ** 3) };
  };
  g.readout(() => {
    const d = data();
    if (!sol) return "Mude o ângulo no vértice. Pode ocorrer V₁ = V₂? Qual é a menor razão V₁/V₂ possível?";
    return `Com t = tg(β/2): V₁/V₂ = k = 1/(3t²(1 − t²)) ≥ 4/3, com igualdade para t² = 1/2, isto é, <span class="ok">sen φ = 1/3</span> (φ o semiângulo no vértice; o botão "Menor razão" mostra esse cone).`;
  });
  const dyn = new THREE.Group();
  v.root.add(dyn);
  const redraw = () => {
    clear(dyn); v.clearLabels();
    const { rho, s } = data();
    dyn.add(cone(rho, 0, 0, H, C.face, 0.22, 64), disc([0, 0, 0], rho, C.face, 0.25), hcircle(0, rho));
    dyn.add(ball([0, 0, s], s, C.faceB, 0.75));
    dyn.add(cone(s, 0, s, 2 * s, C.faceA, 0.28, 64), hcircle(0, s, C.a), hcircle(2 * s, s, C.a), disc([0, 0, 2 * s], s, C.faceA, 0.25));
    if (sol) {
      const T = V3(0, -0.002, H), L = V3(-rho, -0.002, 0), Rr = V3(rho, -0.002, 0), O = V3(0, -0.002, s);
      dyn.add(ring([L, Rr, T], C.line, 0.016), circle3(O, [1, 0, 0], [0, 0, 1], s, C.b), rod(Rr, O, C.c, 0.012), lines([T, V3(0, 0, 0)], C.aux, true));
      dyn.add(arcMark(Rr, L.clone().sub(Rr), T.clone().sub(Rr), Math.min(0.35, rho * 0.4), C.c), arcMark(T, V3(0, 0, -1), L.clone().sub(T), 0.45, C.d));
      dyn.add(dot(O, C.b, 0.035), rod(V3(-s, -0.002, 0), V3(-s, -0.002, 2 * s), C.a, 0.012), rod(V3(s, -0.002, 0), V3(s, -0.002, 2 * s), C.a, 0.012));
      v.label(Rr.clone().add(V3(-0.5, 0, 0.12)), "β", col(C.c), 15);
      v.label(T.clone().add(V3(-0.12, 0, -0.62)), "φ", col(C.d), 15);
      v.label(O.clone().add(V3(0.12, 0, 0.08)), "O", col(C.b), 14);
    }
  };
  redraw();
  return redraw;
};

// Convex polyhedra — Fuvest 2022, question 36: deltahedra
FIG3["p-fuv22-36"] = (g, mode) => {
  const sol = SOL(mode);
  const v = g.view({ theta: -40, phi: 20, r: 8.5, target: [0, 0, 0] });
  let which = 0;
  const names = ["Tetraedro", "Octaedro", "Icosaedro"];
  if (!sol) g.choice(names, 0, (i) => { which = i; });
  // the snub disphenoid: q is the root of 2x³ + 11x² + 4x − 1 in (0, 1)
  let q = 0.17;
  for (let i = 0; i < 60; i++) q -= (2 * q ** 3 + 11 * q * q + 4 * q - 1) / (6 * q * q + 22 * q + 4);
  const r = Math.sqrt(q), s = Math.sqrt((1 - q) / (2 * q)), t = Math.sqrt(2 - 2 * q);
  const SD = [[t, r, 0], [-t, r, 0], [0, -r, t], [0, -r, -t], [1, -s, 0], [-1, -s, 0], [0, s, 1], [0, s, -1]].map((p) => V3(p[0], p[2], p[1]).multiplyScalar(0.75));
  const edges = [], faces = [];
  for (let i = 0; i < 8; i++) for (let j = i + 1; j < 8; j++) if (Math.abs(SD[i].distanceTo(SD[j]) - 1.5) < 1e-6) edges.push([i, j]);
  for (let a = 0; a < 8; a++) for (let b = a + 1; b < 8; b++) for (let c = b + 1; c < 8; c++) {
    const n = SD[b].clone().sub(SD[a]).cross(SD[c].clone().sub(SD[a]));
    const sg = SD.map((p, i) => (i === a || i === b || i === c) ? 0 : Math.sign(p.clone().sub(SD[a]).dot(n)));
    if (sg.every((x) => x <= 0) || sg.every((x) => x >= 0)) faces.push([a, b, c]);
  }
  g.readout(() => !sol ? `${names[which]}: um deltaedro convexo com ${[4, 6, 12][which]} vértices. Com 8 vértices, quantas faces?`
    : `O disfenoide achatado: V = 8, A = ${edges.length}, F = ${faces.length}. Cada face tem 3 arestas e cada aresta está em 2 faces: 3F = 2A = ${3 * faces.length}; ` +
      `Euler: F − A + V = ${faces.length} − ${edges.length} + 8 = 2; logo, <span class="ok">F = 12</span>.`);
  const dyn = new THREE.Group();
  v.root.add(dyn);
  const palette = [C.faceA, C.face, C.faceB, C.faceC];
  const redraw = () => {
    clear(dyn);
    if (sol) {
      faces.forEach((F, i) => dyn.add(face(F.map((j) => SD[j]), palette[i % 4], 0.55)));
      edges.forEach(([i, j]) => dyn.add(rod(SD[i], SD[j], C.line, 0.02)));
      SD.forEach((p) => dyn.add(dot(p, C.pt, 0.05)));
      return;
    }
    const geo = [new THREE.TetrahedronGeometry(1.3), new THREE.OctahedronGeometry(1.25), new THREE.IcosahedronGeometry(1.25)][which];
    dyn.add(new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: C.faceA, transparent: true, opacity: 0.55, flatShading: true, side: THREE.DoubleSide, depthWrite: false })));
    const eg = new THREE.EdgesGeometry(geo, 1), pos = eg.getAttribute("position");
    for (let i = 0; i < pos.count; i += 2) dyn.add(rod(V3(pos.getX(i), pos.getY(i), pos.getZ(i)), V3(pos.getX(i + 1), pos.getY(i + 1), pos.getZ(i + 1)), C.line, 0.02));
    const seen = new Set(), gp = geo.getAttribute("position");
    for (let i = 0; i < gp.count; i++) {
      const key = [gp.getX(i), gp.getY(i), gp.getZ(i)].map((x) => x.toFixed(3)).join(",");
      if (!seen.has(key)) { seen.add(key); dyn.add(dot(V3(gp.getX(i), gp.getY(i), gp.getZ(i)), C.pt, 0.05)); }
    }
  };
  redraw();
  return redraw;
};
}

/*
  Interactive figures for the exam problems in the note "Basic geometry: a comprehensive viewpoint"
  (Fuvest, Unicamp, ITA and IMO), drawn with JSXGraph through the helpers of geometry-plane.js.

  Each problem has a block  ::: {.geo-fig data-fig="NAME"}  in its statement and another one with
  data-mode="solution" in its solution; FIG[NAME](g, mode) draws the first one when mode is "" and
  the second (with the steps of the solution) when mode is "solution".
*/
(function () {
  "use strict";
  const G = window.GeoPlane;
  if (!G) return;
  const { FIG, C, fmt, fdeg, D2R, xy, dist, deg, lerp, triArea, footOn } = G;
  const SOL = (mode) => mode === "solution";
  const sq = (x) => x * x;

  // ------------------------------------------------------------------ helpers
  function vis(els, v) {
    els.forEach((m) => {
      if (!m) return;
      m.setAttribute({ visible: v });
      if (m.borders) m.borders.forEach((b) => b.setAttribute({ visible: v }));
    });
  }
  // Steps of a solution: [{ t: "text" or () => "text", show: [elements] }, ...]. Step 0 is the start.
  function stepper(g, steps, onStep) {
    let k = 0;
    const show = () => {
      steps.forEach((s, i) => vis(s.show || [], i <= k));
      if (onStep) onStep(k);
    };
    show();
    g.button("◀ Voltar", () => { k = Math.max(0, k - 1); show(); });
    g.button("Próximo passo ▶", () => { k = Math.min(steps.length - 1, k + 1); show(); });
    g.readout(() => steps.slice(0, k + 1)
      .map((s, i) => (i ? `<span class="step">${i}.</span> ` : "") + (typeof s.t === "function" ? s.t() : s.t)).join("<br>"));
    return () => k;
  }
  const hidden = (o = {}) => Object.assign({ visible: false }, o);
  const P2 = (x, y) => [x, y];
  const add = (p, q) => [p[0] + q[0], p[1] + q[1]];
  const sub = (p, q) => [p[0] - q[0], p[1] - q[1]];
  const mul = (p, k) => [p[0] * k, p[1] * k];
  const mid = (p, q) => lerp(p, q, 0.5);
  const norm = (p) => Math.hypot(p[0], p[1]);
  const unit = (p) => mul(p, 1 / (norm(p) || 1));
  const rot = (p, a) => [p[0] * Math.cos(a) - p[1] * Math.sin(a), p[0] * Math.sin(a) + p[1] * Math.cos(a)];
  const cross = (u, v) => u[0] * v[1] - u[1] * v[0];
  function meet(A, B, Cc, Dd) {             // intersection of the lines AB and CD
    const a = xy(A), b = xy(B), c = xy(Cc), d = xy(Dd);
    const r = sub(b, a), s = sub(d, c), den = cross(r, s);
    if (Math.abs(den) < 1e-12) return a;
    const t = cross(sub(c, a), s) / den;
    return add(a, mul(r, t));
  }
  function circum(A, B, Cc) {               // circumcentre and radius
    const [ax, ay] = xy(A), [bx, by] = xy(B), [cx, cy] = xy(Cc);
    const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by)) || 1e-12;
    const ux = ((ax * ax + ay * ay) * (by - cy) + (bx * bx + by * by) * (cy - ay) + (cx * cx + cy * cy) * (ay - by)) / d;
    const uy = ((ax * ax + ay * ay) * (cx - bx) + (bx * bx + by * by) * (ax - cx) + (cx * cx + cy * cy) * (bx - ax)) / d;
    return [[ux, uy], Math.hypot(ax - ux, ay - uy)];
  }
  function incircle(A, B, Cc) {
    const a = dist(B, Cc), b = dist(A, Cc), c = dist(A, B), p = (a + b + c) / 2;
    const [ax, ay] = xy(A), [bx, by] = xy(B), [cx, cy] = xy(Cc);
    return [[(a * ax + b * bx + c * cx) / (2 * p), (a * ay + b * by + c * cy) / (2 * p)], triArea(A, B, Cc) / p];
  }
  function lineCircle(P, d, O, r) {          // points P + t d on the circle (O, r), t ascending
    const p = sub(xy(P), xy(O)), A = d[0] * d[0] + d[1] * d[1], B = 2 * (p[0] * d[0] + p[1] * d[1]), Cq = p[0] * p[0] + p[1] * p[1] - r * r;
    const D = B * B - 4 * A * Cq;
    if (D < 0) return [];
    const s = Math.sqrt(D);
    return [(-B - s) / (2 * A), (-B + s) / (2 * A)].map((t) => add(xy(P), mul(d, t)));
  }
  const side = (P, A, B) => cross(sub(xy(B), xy(A)), sub(xy(P), xy(A)));   // > 0: P left of AB
  // an arc of the circle (O, r) from angle a0 to a1 (radians, counterclockwise)
  function arcPts(O, r, a0, a1, n = 60) {
    const X = [], Y = [], [ox, oy] = xy(O);
    for (let i = 0; i <= n; i++) { const t = a0 + (a1 - a0) * i / n; X.push(ox + r * Math.cos(t)); Y.push(oy + r * Math.sin(t)); }
    return [X, Y];
  }
  const angOf = (P, O) => { const [x, y] = sub(xy(P), xy(O)); return Math.atan2(y, x); };
  // a label in the middle of a polygon
  const label = (g, b, pts, s, o = {}) => g.text(b, () => pts.reduce((a, p) => a + xy(p)[0], 0) / pts.length,
    () => pts.reduce((a, p) => a + xy(p)[1], 0) / pts.length, s, o);
  const dashed = { dash: 2, strokeColor: C.aux, strokeWidth: 1.5 };
  // a label at distance rr from P in the direction ang (degrees): for values of thin angles, written by hand
  const polarText = (g, b, P, ang, rr, s, col, o = {}) => g.text(b, () => xy(P)[0] + rr * Math.cos(ang * D2R),
    () => xy(P)[1] + rr * Math.sin(ang * D2R), s, Object.assign({ color: col, fontSize: 14 }, o));
  // a label on the bisector of the angle POQ, at distance rr from its vertex O (follows dragged points)
  const bisText = (g, b, P, O, Q, rr, s, col, o = {}) => {
    const pos = () => { const u = unit(sub(xy(P), xy(O))), v = unit(sub(xy(Q), xy(O))), w = unit(add(u, v)); return add(xy(O), mul(w, rr)); };
    return g.text(b, () => pos()[0], () => pos()[1], s, Object.assign({ color: col, fontSize: 14 }, o));
  };

  // =================================================================================
  // Parallel lines make equal angles — ITA 2027, question 2
  FIG["p-ita27-2"] = (g, mode) => {
    const b = g.board([-1.6, 11.4, 11.8, -1.6]);
    const A = g.fixed(b, 0, 0, "A", { label: { offset: [-16, -12] } });
    const B = g.fixed(b, 10, 0, "B", { label: { offset: [6, -12] } });
    const Cc = g.fixed(b, 10, 10, "C", { label: { offset: [6, 8] } });
    const Dd = g.fixed(b, 0, 10, "D", { label: { offset: [-16, 8] } });
    g.poly(b, [A, B, Cc, Dd], { fillOpacity: 0.05 });
    g.seg(b, A, Cc, { strokeColor: C.c });
    const sol = SOL(mode);
    const d = sol ? { value: 5 } : g.slider("distância de s a AC:", 0.5, 5 * Math.SQRT2 - 0.3, 0.05, 5, (v) => fmt(v));
    const E = g.dep(b, () => d.value * Math.SQRT2, () => 0, "E", { label: { offset: [-4, -16] } });
    const F = g.dep(b, () => 10, () => 10 - d.value * Math.SQRT2, "F", { label: { offset: [8, -4] } });
    const ext = (t) => () => { const e = xy(E), f = xy(F), u = unit(sub(f, e)); return add(e, mul(u, t)); };
    b.create("line", [g.at(b, ext(-1)), g.at(b, ext(1))], { strokeColor: C.a, strokeWidth: 2, straightFirst: true, straightLast: true, highlight: false });
    g.text(b, () => xy(F)[0] + 1.25, () => xy(F)[1] + 0.55, "s", { color: C.a, fontSize: 17 });
    g.poly(b, [E, B, F], { fillColor: C.fillA, fillOpacity: 0.3 });
    // the distance between the parallels, measured on the diagonal BD
    const Tm = g.at(b, () => meet(B, Dd, E, F));
    const M = g.at(b, () => [5, 5]);
    g.seg(b, M, Tm, { strokeColor: C.d, strokeWidth: 2.5 });
    g.right(b, Cc, M, Tm, 0.45);
    g.segText(b, M, Tm, () => fmt(d.value, d.value === 5 ? 0 : 2), Cc, { color: C.d });
    const inc = () => incircle(E, B, F);
    if (!sol) {
      b.create("circle", [g.at(b, () => inc()[0]), () => inc()[1]], { strokeColor: C.b, strokeWidth: 2, fillColor: C.fillB, fillOpacity: 0.2, highlight: false });
      g.readout(() => `distância entre s e AC = ${fmt(d.value)} &nbsp; → &nbsp; raio da circunferência inscrita em BEF: <b>?</b>`);
      return;
    }
    const lab = { fontSize: 14 };
    const s1 = [g.angle(b, B, A, Cc, "45°", C.b, { radius: 1.3, visible: false, label: Object.assign({ color: C.b }, lab) }),
      g.angle(b, B, E, F, "", C.b, { radius: 0.55, visible: false }),
      g.angle(b, E, F, B, "", C.c, { radius: 0.55, visible: false }),
      g.angle(b, A, Cc, B, "45°", C.c, { radius: 1.3, visible: false, label: Object.assign({ color: C.c }, lab) })];
    const BD = g.seg(b, B, Dd, Object.assign({ visible: false }, dashed));
    const Mp = g.fixed(b, 5, 5, "M", { visible: false, label: { offset: [-21, 1] } });
    const Tp = g.dep(b, () => xy(Tm)[0], () => xy(Tm)[1], "T", { visible: false, size: 2, label: { offset: [-20, 14] } });
    const BT = g.seg(b, B, Tm, { strokeColor: C.a, strokeWidth: 3, visible: false });
    const r0 = inc()[1], I0 = inc()[0];
    const ci = g.circ(b, g.fixed(b, I0[0], I0[1], "", { visible: false }), r0, { strokeColor: C.b, fillColor: C.fillB, fillOpacity: 0.25, visible: false });
    const sq = g.poly(b, [[10, 0], [10 - r0, 0], I0, [10, r0]], { fillColor: C.fillC, fillOpacity: 0.5, visible: false, borders: { strokeColor: C.c, strokeWidth: 1.5, highlight: false } });
    const BI = g.seg(b, [10, 0], I0, { strokeColor: C.c, strokeWidth: 3, visible: false });
    const IT = g.seg(b, I0, Tm, { strokeColor: C.b, strokeWidth: 3, visible: false });
    const tr = g.text(b, 10 - r0 / 2, -0.4, "r", { color: C.c, fontSize: 14, visible: false });
    stepper(g, [
      { t: "Quadrado de lado 10; s ∥ AC a uma distância 5 de AC. Determine o raio da circunferência inscrita em BEF." },
      { t: "s ∥ AC: ângulos correspondentes (mesma cor), ∠BEF = ∠BAC = 45° e ∠BFE = ∠BCA = 45°. BEF é um triângulo retângulo isósceles.", show: s1 },
      { t: "BD ⊥ AC; logo, BD ⊥ s: a altura de BEF é BT = BM − MT = 5√2 − 5.", show: [BD, Mp, Tp, BT] },
      { t: () => `A circunferência inscrita toca os catetos à distância r de B: um quadrado de lado r cuja diagonal, de B ao centro I, mede r√2 (roxa); depois vem o raio IT = r (verde). Então BT = r√2 + r = 5√2 − 5, e <span class="ok">r = (5/2)(2 − √2)²</span>.`, show: [ci, sq, BI, IT, tr] },
    ]);
  };

  // IMO 2018, Problem 1
  FIG["imo2018-1"] = (g, mode) => {
    const b = g.board([-3.8, 3.9, 3.8, -3.6]);
    const sol = SOL(mode);
    const R = 3;
    const Oc = g.fixed(b, 0, 0, "", { visible: false });
    const circle = g.circ(b, Oc, R, { strokeColor: C.aux });
    const B = g.fixed(b, R * Math.cos(-2.6), R * Math.sin(-2.6), "B", { label: { offset: [-16, -10] } });
    const Cc = g.fixed(b, R * Math.cos(-0.55), R * Math.sin(-0.55), "C", { label: { offset: [6, -10] } });
    const A = sol ? g.fixed(b, R * Math.cos(1.75), R * Math.sin(1.75), "A", { label: { offset: [-4, 12] } })
      : g.glider(b, R * Math.cos(1.75), R * Math.sin(1.75), circle, "A", { label: { offset: [-4, 12] } });
    g.poly(b, [A, B, Cc], { fillOpacity: 0.06 });
    const t = sol ? { value: 0.42 } : g.slider("AD = AE:", 0.05, 0.95, 0.01, 0.42, (v) => fmt(v * Math.min(dist(A, B), dist(A, Cc))));
    const amax = () => Math.min(dist(A, B), dist(A, Cc));
    const D = g.dep(b, () => add(xy(A), mul(unit(sub(xy(B), xy(A))), t.value * amax()))[0], () => add(xy(A), mul(unit(sub(xy(B), xy(A))), t.value * amax()))[1], "D", { label: { offset: [-18, 12] } });
    const E = g.dep(b, () => add(xy(A), mul(unit(sub(xy(Cc), xy(A))), t.value * amax()))[0], () => add(xy(A), mul(unit(sub(xy(Cc), xy(A))), t.value * amax()))[1], "E", { label: { offset: [6, 14] } });
    // F: the perpendicular bisector of BD meets the minor arc AB (on the other side of AB from C)
    const arcPoint = (P, Q, other) => () => {
      const m = mid(xy(P), xy(Q)), n = rot(sub(xy(Q), xy(P)), Math.PI / 2);
      const cand = lineCircle(m, n, [0, 0], R);
      const sC = side(other, P, Q);
      return cand.find((X) => side(X, P, Q) * sC < 0) || cand[0] || m;
    };
    const fF = arcPoint(B, D, Cc), fG = arcPoint(Cc, E, B);
    const F = g.dep(b, () => fF()[0], () => fF()[1], "F", { label: { offset: [-16, 4] } });
    const Gp = g.dep(b, () => fG()[0], () => fG()[1], "G", { label: { offset: [6, 4] } });
    // perpendicular bisectors (dashed) and the equal segments
    b.create("line", [g.at(b, () => mid(xy(B), xy(D))), F], Object.assign({ highlight: false }, dashed, { strokeColor: "#cbd5e1" }));
    b.create("line", [g.at(b, () => mid(xy(Cc), xy(E))), Gp], Object.assign({ highlight: false }, dashed, { strokeColor: "#cbd5e1" }));
    g.seg(b, F, B, { strokeColor: C.b, strokeWidth: 1.5 }); g.seg(b, F, D, { strokeColor: C.b, strokeWidth: 1.5 });
    g.seg(b, Gp, Cc, { strokeColor: C.c, strokeWidth: 1.5 }); g.seg(b, Gp, E, { strokeColor: C.c, strokeWidth: 1.5 });
    g.ticks(b, A, D, 1); g.ticks(b, A, E, 1);
    g.line(b, D, E, { strokeColor: C.a, strokeWidth: 2.2 });
    g.line(b, F, Gp, { strokeColor: C.d, strokeWidth: 2.2 });
    const angDiff = () => {
      const u = sub(xy(E), xy(D)), v = sub(xy(Gp), xy(F));
      let a = Math.abs(Math.atan2(cross(u, v), u[0] * v[0] + u[1] * v[1])) / D2R;
      return Math.min(a, 180 - a);
    };
    if (!sol) {
      g.readout(() => "Arraste A e mude AD = AE.");
      return;
    }
    const X = g.dep(b, () => meet(F, Gp, A, B)[0], () => meet(F, Gp, A, B)[1], "X", { visible: false, label: { offset: [-16, -6] } });
    const Y = g.dep(b, () => meet(F, Gp, A, Cc)[0], () => meet(F, Gp, A, Cc)[1], "Y", { visible: false, label: { offset: [6, -6] } });
    const arcCurve = (P, Q, col) => g.curve(b, () => {
      let a0 = angOf(P, [0, 0]), a1 = angOf(Q, [0, 0]);
      if (a1 < a0) a1 += 2 * Math.PI;
      if (a1 - a0 > Math.PI) { const t0 = a0; a0 = a1; a1 = t0 + 2 * Math.PI; }
      return arcPts([0, 0], R, a0, a1);
    }, { strokeColor: col, strokeWidth: 5, strokeOpacity: 0.55, visible: false });
    const arcs = [arcCurve(A, F, C.a), arcCurve(F, B, C.b), arcCurve(A, Gp, C.c), arcCurve(Gp, Cc, C.gold)];
    const lab = (P, Q, s, col) => g.text(b, () => mul(unit(mid(xy(P), xy(Q))), R + 0.35)[0], () => mul(unit(mid(xy(P), xy(Q))), R + 0.35)[1], s, { color: col, visible: false });
    const arcL = [lab(A, F, "2a", C.a), lab(F, B, "2b", C.b), lab(A, Gp, "2c", C.c), lab(Gp, Cc, "2d", C.gold)];
    const angX = g.angle(b, A, X, Y, "", C.b, { radius: 0.35, visible: false });
    const angY = g.angle(b, X, Y, A, "", C.b, { radius: 0.35, visible: false });
    const angD = g.angle(b, A, D, E, "", C.a, { radius: 0.35, visible: false });
    const arcVal = (P, Q) => { let a = Math.abs(angOf(P, [0, 0]) - angOf(Q, [0, 0])); if (a > Math.PI) a = 2 * Math.PI - a; return a / D2R; };
    stepper(g, [
      { t: "AD = AE; FB = FD e GC = GE (mediatrizes). Mostre que DE ∥ FG." },
      { t: "Arcos: AF = 2a, FB = 2b, AG = 2c, GC = 2d.", show: arcs.concat(arcL) },
      { t: () => `FB = FD dá AD = 2R sen(a − b); do mesmo modo, AE = 2R sen(c − d). AD = AE ⇒ a − b = c − d ⇒ a + d = b + c.`, show: [] },
      { t: `∠AXY = b + c e ∠AYX = a + d: AXY é isósceles, como ADE (os ângulos da base dos dois valem 90° − A/2); logo, <span class="ok">FG ∥ DE</span>.`, show: [X, Y, angX, angY, angD] },
    ]);
  };

  // The right angle — Unicamp 2023, second phase, question 6 (a)
  FIG["p-uni23-6"] = (g, mode) => {
    const sol = SOL(mode);
    const b1 = (9 + Math.sqrt(17)) / 2, c1 = (9 - Math.sqrt(17)) / 2;   // the legs
    if (!sol) {
      const b = g.board([-0.6, 4.6, 7.6, -1.0]);
      // the right-angle vertex runs on the semicircle over the hypotenuse (Thales)
      const A = g.fixed(b, 0, 0, "", { visible: false }), Bp = g.fixed(b, 7, 0, "", { visible: false });
      const O = g.fixed(b, 3.5, 0, "", { visible: false });
      b.create("arc", [O, Bp, A], Object.assign({ highlight: false }, dashed));
      const t0 = Math.atan2(c1 * b1 / 7, b1 * b1 / 7 - 3.5);
      const Cc = g.glider(b, 3.5 + 3.5 * Math.cos(t0), 3.5 * Math.sin(t0), b.create("arc", [O, Bp, A], { visible: false }), "", {});
      g.poly(b, [A, Bp, Cc], { fillOpacity: 0.15 });
      g.right(b, A, Cc, Bp, 0.3);
      g.segText(b, A, Bp, "7", Cc, { off: 0.3 });
      g.segText(b, A, Cc, () => "b = " + fmt(dist(A, Cc)), Bp);
      g.segText(b, Cc, Bp, () => "c = " + fmt(dist(Cc, Bp)), A, { off: 0.8 });
      g.readout(() => { const p = 7 + dist(A, Cc) + dist(Cc, Bp); return `Arraste o ângulo reto pela semicircunferência. Perímetro = ${fmt(p)} ${Math.abs(p - 16) < 0.03 ? '<span class="ok">= 16</span>' : "(queremos 16)"}; área = ?`; });
      return;
    }
    // Pythagoras' square: four copies of the triangle in a square of side b + c
    const b = g.board([-1.0, 9.7, 9.7, -1.5]);
    const s = b1 + c1;   // 9
    const P = [[0, 0], [s, 0], [s, s], [0, s]];
    const Q = [[c1, 0], [s, c1], [s - c1, s], [0, s - c1]];
    g.poly(b, P.map((p) => g.fixed(b, p[0], p[1], "", { visible: false })), { fillOpacity: 0.04 });
    const tris = [0, 1, 2, 3].map((i) => g.poly(b, [P[i], Q[i], Q[(i + 3) % 4]].map((p) => g.fixed(b, p[0], p[1], "", { visible: false })),
      { fillColor: C.fillA, fillOpacity: 0.45, visible: i === 0 }));
    const inner = g.poly(b, Q.map((p) => g.fixed(b, p[0], p[1], "", { visible: false })), { fillColor: C.fillC, fillOpacity: 0.4, visible: false });
    g.text(b, c1 / 2, -0.35, "c", {}); g.text(b, c1 + b1 / 2, -0.35, "b", {});
    g.text(b, -0.35, b1 / 2, "b", {}); g.text(b, -0.35, b1 + c1 / 2, "c", {});
    const lab7 = g.text(b, s / 2, s / 2, "a² = 49", { visible: false, fontSize: 18 });
    stepper(g, [
      { t: "Catetos b, c com b + c = 9, hipotenusa 7. Uma cópia do triângulo (laranja) em um quadrado de lado b + c = 9.", show: [tris[0]] },
      { t: "Quatro cópias se encaixam em volta de um quadrado inclinado de lado 7 (as hipotenusas).", show: [tris[1], tris[2], tris[3], inner, lab7] },
      { t: `Áreas: (b + c)² = 4·(bc/2) + a², isto é, 81 = 4·Área + 49; logo, <span class="ok">Área = 8 u.a.</span>`, show: [] },
    ]);
  };

  // Notable angles — Fuvest 2026, second phase, question 3 (not to scale vertically)
  FIG["p-fuv26-3"] = (g, mode) => {
    const sol = SOL(mode);
    const b = g.board([-4, 9.6, 13, -6.6]);
    const S = g.fixed(b, 0, 0, "S", { label: { offset: [-16, 8] } });
    g.circ(b, S, 1.2, { strokeColor: C.a, fillColor: C.fillA, fillOpacity: 0.5 });
    b.create("line", [[0, 0], [1, 0]], Object.assign({ highlight: false }, dashed));
    g.text(b, 11.3, -0.5, "reta horizontal", { fontSize: 13, color: C.aux });
    // the water surface (120 m above; drawn closer, not to scale)
    b.create("curve", [(t) => t, (t) => 8.6 + 0.12 * Math.sin(2.2 * t), -4, 13], { strokeColor: "#3b82f6", strokeWidth: 2, highlight: false });
    g.text(b, -2.3, 4.3, "120 m", { color: "#3b82f6" });
    b.create("segment", [[-1.2, 0], [-1.2, 8.5]], { strokeColor: "#3b82f6", strokeWidth: 1.2, lastArrow: true, firstArrow: true, highlight: false });
    g.text(b, 9.5, 9.25, "superfície (fora de escala)", { fontSize: 13, color: "#3b82f6" });
    const r1 = 10 * 0.62, O1 = g.fixed(b, r1 * Math.cos(Math.PI / 4), r1 * Math.sin(Math.PI / 4), "O₁", { label: { offset: [6, 6] } });
    const O2 = g.fixed(b, 10.4 * Math.cos(-Math.PI / 6), 10.4 * Math.sin(-Math.PI / 6), "O₂", { label: { offset: [6, -6] } });
    g.seg(b, S, O1, { strokeColor: C.b }); g.seg(b, S, O2, { strokeColor: C.c });
    g.segText(b, S, O1, "10", [5, -2], { color: C.b });
    const E1 = g.fixed(b, 1, 0, "", { visible: false });   // a point of the horizontal through S (an array here would create a visible point)
    g.angle(b, E1, S, O1, "45°", C.b, { radius: 1.8 });
    g.angle(b, O2, S, E1, "", C.c, { radius: 2.4 }); g.text(b, 3.0, -0.8, "30°", { color: C.c, fontSize: 17 });
    g.text(b, 3.2, -3.9, "170 m de profundidade", { color: C.c, fontSize: 13 });
    if (!sol) { g.readout(() => "Sonar de raio 3 m em S, a 120 m de profundidade. (b): objeto O₁ a 10 m, 45° acima da horizontal. (c): objeto O₂ a 170 m de profundidade, 30° abaixo."); return; }
    const P1 = g.fixed(b, xy(O1)[0], 0, "P", { visible: false, label: { offset: [4, -14] } });
    const P2p = g.fixed(b, xy(O2)[0], 0, "Q", { visible: false, label: { offset: [4, 10] } });
    const v1 = g.seg(b, O1, P1, { strokeColor: C.b, dash: 2, visible: false });
    const v2 = g.seg(b, O2, P2p, { strokeColor: C.c, dash: 2, visible: false });
    const ra = g.right(b, S, P1, O1, 0.4, { visible: false }), rb = g.right(b, S, P2p, O2, 0.4, { visible: false });
    const t1 = g.text(b, xy(O1)[0] + 1.3, xy(O1)[1] / 2, "5√2", { color: C.b, visible: false });
    const t2 = g.text(b, xy(O2)[0] + 0.9, xy(O2)[1] / 2, "50", { color: C.c, visible: false });
    const t3 = g.text(b, 4.3, -1.7, "100", { color: C.c, visible: false });
    stepper(g, [
      { t: "a) O objeto não pode estar dentro do sonar: a menor distância é o raio, <b>3 m</b>." },
      { t: "b) Meio quadrado: SO₁ = 10 é a diagonal; logo, a altura é O₁P = 10/√2 = 5√2. Profundidade: <b>(120 − 5√2) m</b>.", show: [P1, v1, ra, t1] },
      { t: "c) O₂ está 170 − 120 = 50 m abaixo da reta, oposto ao ângulo de 30°: a hipotenusa é o dobro, <b>SO₂ = 100 m</b>.", show: [P2p, v2, rb, t2, t3] },
    ]);
  };

  // Supplementary angles — ITA 2019, second phase, question 9
  FIG["p-ita19-9"] = (g, mode) => {
    const sol = SOL(mode);
    const gam = Math.asin(0.8);
    if (!sol) {
      const b = g.board([-0.6, 3.6, 6.6, -0.8]);
      const B = g.fixed(b, 0, 0, "B", { label: { offset: [-14, -10] } }), Cc = g.fixed(b, 6, 0, "C", { label: { offset: [4, -10] } });
      const A = g.free(b, 3.3, 2.3, "A", { label: { offset: [-4, 12] } });
      g.poly(b, [A, B, Cc], { fillOpacity: 0.12 });
      g.angle(b, Cc, B, A, "", C.b, { radius: 0.7 }); g.angle(b, B, A, Cc, "", C.a, { radius: 0.45 }); g.angle(b, A, Cc, B, "", C.c, { radius: 0.7 });
      g.readout(() => {
        const a = deg(B, A, Cc), bb = deg(Cc, B, A), c = deg(A, Cc, B);
        const s1 = Math.sin((a + bb) * D2R), s2 = Math.sin((a - c) * D2R);
        const ok = (x) => Math.abs(x - 0.8) < 0.01 ? `<span class="ok">${fmt(x, 3)}</span>` : fmt(x, 3);
        return `Arraste A: sen(A + B) = ${ok(s1)}, sen(A − C) = ${ok(s2)} (queremos as duas iguais a 0,800). sen B = ${fmt(Math.sin(bb * D2R), 3)}`;
      });
      return;
    }
    const b = g.board([-1.4, 1.5, 1.4, -0.35], { maxH: 300 });
    const b2 = g.board([-0.3, 2.6, 6.3, -0.4], { maxH: 300 });
    const O = g.fixed(b, 0, 0, "", { visible: false });
    b.create("arc", [O, g.fixed(b, 1, 0, "", { visible: false }), g.fixed(b, -1, 0, "", { visible: false })], { strokeColor: C.line, strokeWidth: 1.5, highlight: false });
    b.create("segment", [[-1.2, 0], [1.2, 0]], { strokeColor: C.aux, highlight: false });
    const P = g.fixed(b, Math.cos(gam), 0.8, "", { size: 3, color: C.c }), Q = g.fixed(b, -Math.cos(gam), 0.8, "", { size: 3, color: C.a });
    g.seg(b, O, P, { strokeColor: C.c }); g.seg(b, O, Q, { strokeColor: C.a });
    b.create("segment", [[-1.2, 0.8], [1.2, 0.8]], Object.assign({ highlight: false }, dashed));
    g.text(b, 1.25, 0.88, "4/5", { color: C.d, fontSize: 14 });
    const U = g.fixed(b, 1, 0, "", { visible: false });
    g.angle(b, U, O, P, "γ", C.c, { radius: 0.25 });
    g.angle(b, U, O, Q, "", C.a, { radius: 0.4 }); g.text(b, -0.08, 0.55, "180° − γ", { color: C.a, fontSize: 13 });   // inside the angle, between OP and OQ
    // the triangle A = 2γ, B = 180° − 3γ, C = γ
    const Bv = g.fixed(b2, 0, 0, "B", { label: { offset: [-14, -10] } });
    const a = 6, Cv = g.fixed(b2, a, 0, "C", { label: { offset: [4, -10] } });
    const bb = Math.PI - 3 * gam, c = a * Math.sin(gam) / Math.sin(2 * gam);
    const Av = g.fixed(b2, c * Math.cos(bb), c * Math.sin(bb), "A", { label: { offset: [-4, 12] } });
    g.poly(b2, [Av, Bv, Cv], { fillOpacity: 0.12 });
    const aA = [g.angle(b2, Bv, Av, Cv, "", C.a, { radius: 0.45, visible: false }), g.text(b2, xy(Av)[0] - 0.2, xy(Av)[1] - 0.8, "2γ", { color: C.a, fontSize: 15, visible: false })];
    const aB = g.angle(b2, Cv, Bv, Av, "180° − 3γ", C.b, { radius: 1.2, visible: false, label: { fontSize: 13 } });
    const aC = g.angle(b2, Av, Cv, Bv, "γ", C.c, { radius: 0.9, visible: false });
    stepper(g, [
      { t: "sen x = sen(180° − x): na circunferência trigonométrica, γ e 180° − γ têm a mesma altura." },
      { t: "A + B = 180° − C; logo, sen C = 4/5: C = γ (agudo) ou 180° − γ. Como A > C (sen(A − C) > 0), C não pode ser obtuso: C = γ.", show: [aC] },
      { t: "A − C = γ ou 180° − γ; a segunda dá A = 180°. Logo, A = 2γ e B = 180° − 3γ.", show: aA.concat([aB]) },
      { t: `sen B = sen 3γ = 3 sen γ − 4 sen³γ = 12/5 − 256/125 = <span class="ok">44/125</span>.` },
    ]);
  };

  // From the tangent to the sine and cosine — ITA 2019, question 37
  FIG["p-ita19-37"] = (g, mode) => {
    const sol = SOL(mode);
    const b = g.board([-0.9, 4.9, 9.2, -0.9]);
    const A = g.fixed(b, 0, 0, "A", { label: { offset: [-16, -10] } }), B = g.fixed(b, 8, 0, "B", { label: { offset: [6, -10] } });
    const Cc = g.fixed(b, 8, 4, "C", { label: { offset: [6, 6] } }), Dd = g.fixed(b, 0, 4, "D", { label: { offset: [-16, 6] } });
    g.poly(b, [A, B, Cc, Dd], { fillOpacity: 0.05 });
    const M = g.fixed(b, 8, 2, "M", { label: { offset: [8, -2] } }), N = g.fixed(b, 8, 3, "N", { label: { offset: [8, 2] } });
    g.seg(b, A, M, { strokeColor: C.b }); g.seg(b, A, N, { strokeColor: C.a });
    g.angle(b, M, A, N, "θ", C.d, { radius: 4.2 });
    g.ticks(b, B, M, 1); g.ticks(b, M, N, 2); g.ticks(b, N, Cc, 2);
    g.text(b, 4, -0.45, "AB = 2·BC", { fontSize: 14 });
    if (!sol) { g.readout(() => "M é o ponto médio de BC e N o ponto médio de CM. tg θ = ?"); return; }
    const tB = g.poly(b, [A, B, M], { fillColor: C.fillB, fillOpacity: 0.35, visible: false });
    const tA = g.poly(b, [A, B, N], { fillColor: C.fillA, fillOpacity: 0.25, visible: false });
    const ab = [g.angle(b, B, A, M, "", C.b, { radius: 2.2, visible: false }), g.text(b, 1.65, 0.14, "β", { color: C.b, fontSize: 17, visible: false })];
    const aa = [g.angle(b, B, A, N, "", C.a, { radius: 3.2, visible: false }), g.text(b, 2.75, 0.33, "α", { color: C.a, fontSize: 17, visible: false })];
    const l1 = g.text(b, 8.45, 1, "2", { visible: false, color: C.b }), l2 = g.text(b, 8.45, 2.5, "1", { visible: false, color: C.a }), l3 = g.text(b, 4, 0.35, "8", { visible: false });
    stepper(g, [
      { t: "Tome BC = 4, AB = 8: BM = 2, BN = 3. θ = α − β." },
      { t: "tg β = BM/AB = 2/8 = 1/4: um triângulo retângulo de catetos 1 e 4; logo, sen β = 1/√17, cos β = 4/√17.", show: [tB, l1, l3].concat(ab) },
      { t: "tg α = BN/AB = 3/8: catetos 3 e 8; logo, sen α = 3/√73, cos α = 8/√73.", show: [tA, l2].concat(aa) },
      { t: `tg θ = (sen α cos β − cos α sen β)/(cos α cos β + sen α sen β) = (12 − 8)/(32 + 3) = <span class="ok">4/35</span>.` },
    ]);
  };

  // The isosceles triangle — ITA 2022, question 42
  FIG["p-ita22-42"] = (g, mode) => {
    const sol = SOL(mode);
    // left: the whole picture (to scale); right: a zoom near AC, where the small triangle is
    const b = g.board([-34, 92, 34, -16], { maxH: 380 });
    const z = g.board([-17, 13.5, 17, -5.5], { maxH: 230, title: "Ampliação perto de AC" });
    const Bp = [-13 + 100 / 26, 240 / 26];
    const A = g.fixed(b, -13, 0, "A", { label: { offset: [-16, -10] } }), Cc = g.fixed(b, 13, 0, "C", { label: { offset: [6, -10] } });
    const O = g.fixed(b, 0, 84, "O", { label: { offset: [8, 6] } });
    b.create("line", [A, Cc], { strokeColor: C.line, strokeWidth: 1.4, highlight: false });
    g.text(b, 29, 3.8, "r", { fontSize: 17 });
    g.poly(b, [A, g.fixed(b, Bp[0], Bp[1], "", { visible: false }), Cc], { fillColor: C.fillB, fillOpacity: 0.35, borders: { strokeColor: C.line, strokeWidth: 1.2, highlight: false } });
    g.seg(b, O, A, { strokeColor: C.a }); g.seg(b, O, Cc, { strokeColor: C.a });
    g.segText(b, O, A, "85", Cc, { color: C.a, off: 3.5 });
    g.ticks(b, O, A, 1, { strokeWidth: 1.4 }); g.ticks(b, O, Cc, 1, { strokeWidth: 1.4 });
    b.create("polygon", [[-17, -5.5], [17, -5.5], [17, 13.5], [-17, 13.5]], { fillOpacity: 0, highlight: false, vertices: { visible: false },
      borders: { strokeColor: C.aux, strokeWidth: 1, dash: 2, highlight: false } });
    // the zoom
    const zA = g.fixed(z, -13, 0, "A", { label: { offset: [-16, -10] } }), zC = g.fixed(z, 13, 0, "C", { label: { offset: [6, -10] } });
    const zB = g.fixed(z, Bp[0], Bp[1], "B", { label: { offset: [-8, 12] } });
    z.create("line", [zA, zC], { strokeColor: C.line, strokeWidth: 1.4, highlight: false });
    g.text(z, 15.6, 1.1, "r", { fontSize: 17 });
    g.poly(z, [zA, zB, zC], { fillColor: C.fillB, fillOpacity: 0.35 });
    g.right(z, zA, zB, zC, 1.1);
    g.segText(z, zA, zB, "10", zC, { off: 1.1 }); g.segText(z, zB, zC, "24", zA, { off: 1.1 });
    const up = 13.5 / 84;   // the lines to O, up to the top of the zoom
    g.seg(z, zA, [-13 + 13 * up, 13.5], { strokeColor: C.a }); g.seg(z, zC, [13 - 13 * up, 13.5], { strokeColor: C.a });
    g.text(z, -12.6, 12.2, "↑ O", { color: C.a, fontSize: 13 }); g.text(z, 12.6, 12.2, "↑ O", { color: C.a, fontSize: 13 });
    if (!sol) { g.readout(() => "B = 90°, AB = 10, BC = 24; OA = OC = 85, O no mesmo semiplano de B em relação a r. Distância de O a r = ?"); return; }
    const H = g.fixed(b, 0, 0, "H", { visible: false, label: { offset: [4, -14] } });
    const OH = g.seg(b, O, H, { strokeColor: C.d, strokeWidth: 2.5, visible: false });
    const t84 = g.text(b, 5.0, 20, "84", { visible: false, color: C.d, fontSize: 17 });
    const zH = g.fixed(z, 0, 0, "H", { visible: false, label: { offset: [5, -14] } });
    const zOH = g.seg(z, zH, [0, 13.5], { strokeColor: C.d, strokeWidth: 2.5, visible: false });
    const zr = g.right(z, [0, 13.5], zH, zC, 1.0, { visible: false });
    const t13 = g.text(z, -6.5, -2.2, "13", { visible: false, color: C.d }), t13b = g.text(z, 6.5, -2.2, "13", { visible: false, color: C.d });
    stepper(g, [
      { t: "AC = √(10² + 24²) = 26." },
      { t: "OA = OC: o triângulo AOC é isósceles; logo, a sua altura OH é também mediana: AH = HC = 13.", show: [H, OH, zH, zOH, zr, t13, t13b] },
      { t: `OH = √(85² − 13²) = √(72 · 98) = <span class="ok">84</span>.`, show: [t84] },
    ]);
  };

  // Extending segments — ITA 2024, question 45
  FIG["p-ita24-45"] = (g, mode) => {
    const sol = SOL(mode);
    const b = g.board([-1.2, 8.6, 12.6, -3.2]);
    const A = g.free(b, 0.4, 0.2, "A", { label: { offset: [-16, -6] } });
    const B = g.free(b, 3.6, 4.0, "B", { label: { offset: [-6, 10] } });
    const Cc = g.free(b, 6.4, -0.6, "C", { label: { offset: [4, -12] } });
    const R = g.dep(b, () => sub(mul(xy(B), 2), xy(A))[0], () => sub(mul(xy(B), 2), xy(A))[1], "R", { label: { offset: [4, 6] } });
    const Q = g.dep(b, () => add(xy(Cc), mul(sub(xy(Cc), xy(A)), 0.5))[0], () => add(xy(Cc), mul(sub(xy(Cc), xy(A)), 0.5))[1], "Q", { label: { offset: [4, -12] } });
    const M = g.dep(b, () => mid(xy(B), xy(Cc))[0], () => mid(xy(B), xy(Cc))[1], "M", { label: { offset: [8, 0] } });
    const S = g.dep(b, () => meet(R, M, A, Cc)[0], () => meet(R, M, A, Cc)[1], "S", { label: { offset: [-4, -16] } });
    const P = g.dep(b, () => meet(Q, M, A, B)[0], () => meet(Q, M, A, B)[1], "P", { label: { offset: [-16, 4] } });
    g.poly(b, [A, B, Cc], { fillOpacity: 0.06 });
    g.seg(b, B, R, Object.assign({}, dashed)); g.seg(b, Cc, Q, Object.assign({}, dashed));
    g.seg(b, R, S, { strokeColor: C.b, strokeWidth: 1.6 }); g.seg(b, Q, P, { strokeColor: C.c, strokeWidth: 1.6 });
    g.ticks(b, A, B, 1); g.ticks(b, B, R, 1); g.ticks(b, B, M, 2); g.ticks(b, M, Cc, 2);
    g.poly(b, [A, P, M, S], { fillColor: C.fillA, fillOpacity: 0.5 });
    const ratio = () => (triArea(A, P, M) + triArea(A, M, S)) / triArea(A, B, Cc);
    if (!sol) { g.readout(() => `Arraste A, B, C. &nbsp; [APMS] / [ABC] = ${fmt(ratio(), 4)}; com [ABC] = 24, [APMS] = ?`); return; }
    const Bp = g.dep(b, () => meet(B, add(xy(B), sub(xy(Cc), xy(A))), R, M)[0], () => meet(B, add(xy(B), sub(xy(Cc), xy(A))), R, M)[1], "B′", { visible: false, label: { offset: [-4, 12] } });
    const Cp = g.dep(b, () => meet(Cc, add(xy(Cc), sub(xy(B), xy(A))), Q, M)[0], () => meet(Cc, add(xy(Cc), sub(xy(B), xy(A))), Q, M)[1], "C′", { visible: false, label: { offset: [6, 4] } });
    const s1 = [Bp, g.seg(b, B, Bp, { strokeColor: C.d, strokeWidth: 2, visible: false })];
    const s2 = [Cp, g.seg(b, Cc, Cp, { strokeColor: C.d, strokeWidth: 2, visible: false })];
    const AM = g.seg(b, A, M, { strokeColor: C.line, strokeWidth: 1.6, dash: 1, visible: false });
    const t1 = g.poly(b, [A, P, M], { fillColor: C.fillB, fillOpacity: 0.55, visible: false });
    const t2 = g.poly(b, [A, M, S], { fillColor: C.fillC, fillOpacity: 0.55, visible: false });
    stepper(g, [
      { t: "AB = BR, AC = 2·CQ, M o ponto médio de BC; [ABC] = 24." },
      { t: () => `Paralela a AC por B: B é o ponto médio de RA; logo, BB′ = AS/2; e MBB′ ≅ MCS dá BB′ = CS. Portanto, <b>AS = (2/3)·AC</b>.`, show: s1 },
      { t: () => `Paralela a AB por C: QCC′ ∼ QAP na razão 1/3; logo, CC′ = AP/3; e MCC′ ≅ MBP dá CC′ = BP. Portanto, <b>AP = (3/4)·AB</b>.`, show: s2 },
      { t: `A mediana AM divide a área ao meio: [ABM] = [ACM] = 12. Mesma altura: [APM] = (3/4)·12 = 9 e [ASM] = (2/3)·12 = 8; logo, <span class="ok">[APMS] = 17</span>.`, show: [AM, t1, t2] },
    ]);
  };

  // Similar triangles — Unicamp 2025, question 55
  FIG["p-uni25-55"] = (g, mode) => {
    const sol = SOL(mode);
    const b = g.board([-0.8, 9.4, 15.6, -1.0]);
    const u = [0.8, 0.6], n = [0.6, -0.8];
    const Ap = [0, 0], Gp = mul(u, 4), Hp = mul(u, 7), Dp = add(Gp, mul(n, 3)), Pp = add(Hp, mul(n, 3));
    const side = 111 / 20, Ep = [Pp[0], 0], Ip = [Pp[0], Pp[0] * 0.75], Fp = [Pp[0] + side, 0], Jp = [Pp[0] + side, side];
    const Cx = 14.6, Cp = [Cx, 0];
    const Bp = meet(Ap, Hp, Cp, Jp);
    const A = g.fixed(b, ...Ap, "A", { label: { offset: [-14, -6] } }), B = g.fixed(b, ...Bp, "B", { label: { offset: [-4, 12] } });
    const Cc = g.fixed(b, ...Cp, "C", { label: { offset: [4, -12] } });
    const Gq = g.fixed(b, ...Gp, "G", { label: { offset: [-14, 6] } }), Hq = g.fixed(b, ...Hp, "H", { label: { offset: [-10, 10] } });
    const Dq = g.fixed(b, ...Dp, "D", { label: { offset: [-4, -16] } }), Pq = g.fixed(b, ...Pp, "", {});
    const Eq = g.fixed(b, ...Ep, "E", { label: { offset: [-4, -16] } }), Fq = g.fixed(b, ...Fp, "F", { label: { offset: [-4, -16] } });
    const Iq = g.fixed(b, ...Ip, "", {}), Jq = g.fixed(b, ...Jp, "", {});
    g.poly(b, [A, B, Cc], { fillOpacity: 0.04 });
    g.poly(b, [Gq, Hq, Pq, Dq], { fillColor: C.fillC, fillOpacity: 0.3 });
    g.poly(b, [Eq, Fq, Jq, Iq], { fillColor: C.fillB, fillOpacity: 0.25 });
    g.segText(b, A, Gq, "4", Dq, { color: C.d }); g.segText(b, Gq, Hq, "3", Dq, { color: C.d });
    if (!sol) { g.readout(() => "AG = 4, GH = 3 (quadrado menor). EF = ?"); return; }
    const pl = (pts, col) => g.poly(b, pts, { fillColor: col, fillOpacity: 0.55, visible: false });
    const T1 = pl([A, Gq, Dq], C.fillA), T2 = pl([Dq, Eq, Pq], C.fillA), T3 = pl([Pq, Hq, Iq], C.fillA);
    const lP = g.text(b, Pp[0] + 0.35, Pp[1] + 0.1, "P", { visible: false }), lI = g.text(b, Ip[0] - 0.3, Ip[1] + 0.45, "I", { visible: false });
    const tAD = g.text(b, 2.6, -0.45, "5", { visible: false, color: C.d });
    const tPE = g.text(b, Pp[0] + 0.45, Pp[1] / 2, "9/5", { visible: false, color: C.d });
    const tPI = g.text(b, Pp[0] + 0.55, (Pp[1] + Ip[1]) / 2, "15/4", { visible: false, color: C.d });
    stepper(g, [
      { t: "Quadrados GHPD (lado 3) e EFJI; P em EI, I em AB." },
      { t: "AGD é retângulo em G, de catetos 4 e 3; logo, AD = 5.", show: [T1, tAD] },
      { t: "Os lados dos quadrados são paralelos ou perpendiculares: DEP e PHI têm os ângulos de AGD (ângulo Â em D e em P).", show: [T2, T3, lP, lI] },
      { t: "DEP: hipotenusa DP = 3; logo, PE = 3·(3/5) = 9/5. &nbsp; PHI: PH = 3 adjacente ao ângulo Â; logo, PI = 3·(5/4) = 15/4.", show: [tPE, tPI] },
      { t: `EF = EI = 9/5 + 15/4 = <span class="ok">111/20 = 5,55 cm</span>.` },
    ]);
  };

  // The exterior angle — ITA 2020, question 46
  FIG["p-ita20-46"] = (g, mode) => {
    const sol = SOL(mode);
    const b = g.board([-3.1, 1.7, 1.8, -1.6]);
    const r = 1.4, a = 10 * D2R;
    const O = g.fixed(b, 0, 0, "O", { label: { offset: [-4, -16] } });
    g.circ(b, O, r, { strokeColor: C.line });
    // A at (-d, 0) with AC = r: the triangle ACO is isosceles with base angles 10°, so AO = 2r cos 10°
    const d = 2 * r * Math.cos(a);
    const A = g.fixed(b, -d, 0, "A", { label: { offset: [-16, -6] } });
    const u = [Math.cos(a), Math.sin(a)];
    const pts = lineCircle([-d, 0], u, [0, 0], r);
    const Cc = g.fixed(b, ...pts[0], "C", { label: { offset: [-10, 12] } }), D = g.fixed(b, ...pts[1], "D", { label: { offset: [4, 10] } });
    const B = g.fixed(b, r, 0, "B", { label: { offset: [6, -8] } });
    g.seg(b, A, D, { strokeColor: C.line }); g.seg(b, A, B, { strokeColor: C.line });
    g.seg(b, O, D, { strokeColor: C.aux });
    g.ticks(b, A, Cc, 1);
    // the angles are thin: arcs without labels, and the values written inside each angle, past the arc
    const lab = (P, ang, rr, s, col, o = {}) => polarText(g, b, P, ang, rr, s, col, o);
    g.angle(b, B, A, D, "", C.a, { radius: 0.9 });
    lab(A, 5, 1.08, "10°", C.a);
    g.angle(b, B, O, D, "", C.d, { radius: 0.38 });
    lab(O, 15, 0.56, "?", C.d, { fontSize: 16 });
    if (!sol) { g.readout(() => "AC = r (o raio), ∠BAD = 10°. ∠BOD = ?"); return; }
    const OC = g.seg(b, O, Cc, { strokeColor: C.b, visible: false });
    const tk = g.ticks(b, O, Cc, 1, { visible: false });
    const a1 = [g.angle(b, Cc, O, A, "", C.a, { radius: 0.75, visible: false }), lab(O, 175, 0.98, "10°", C.a, { visible: false })];
    const a2 = [g.angle(b, O, Cc, D, "", C.b, { radius: 0.45, visible: false }), lab(Cc, 0, 0.72, "20°", C.b, { visible: false })];
    const a3 = [g.angle(b, Cc, D, O, "", C.b, { radius: 0.32, visible: false }), lab(D, 200, 0.5, "20°", C.b, { visible: false })];
    const tk2 = g.ticks(b, O, D, 1, { visible: false });
    stepper(g, [
      { t: "AC = r = OC." },
      { t: "O triângulo ACO é isósceles: ∠COA = ∠CAO = 10°.", show: [OC, tk].concat(a1) },
      { t: "Ângulo externo de ACO em C: ∠OCD = 10° + 10° = 20°.", show: a2 },
      { t: "OC = OD: o triângulo OCD é isósceles, ∠ODC = 20°.", show: a3.concat([tk2]) },
      { t: `Ângulo externo de AOD em O: ∠BOD = 10° + 20° = <span class="ok">30°</span>.` },
    ]);
  };

  // Drawing parallels — ITA 2020, second phase, question 8
  FIG["p-ita20-8"] = (g, mode) => {
    const sol = SOL(mode);
    const b = g.board([-1.6, 1.75, 2.45, -1.2]);
    const O = g.fixed(b, 0, 0, "O", { label: { offset: [-14, -10] } });
    g.circ(b, O, 1, { strokeColor: C.line });
    const A = g.fixed(b, 1, 0, "A", { label: { offset: [-2, -16] } }), B = g.fixed(b, 2, 0, "B", { label: { offset: [4, -14] } });
    const m = 100 * D2R, Mp = [Math.cos(m), Math.sin(m)], t = [-Math.sin(m), Math.cos(m)];
    const M = g.fixed(b, ...Mp, "M", { label: { offset: [-16, 6] } });
    const proj = (P) => add(Mp, mul(t, (P[0] - Mp[0]) * t[0] + (P[1] - Mp[1]) * t[1]));
    const D = g.fixed(b, ...proj([1, 0]), "D", { label: { offset: [-4, 12] } }), E = g.fixed(b, ...proj([2, 0]), "E", { label: { offset: [2, 12] } });
    b.create("line", [M, E], { strokeColor: C.a, strokeWidth: 2, highlight: false });
    g.text(b, -1.35, 0.98, "r", { color: C.a, fontSize: 17 });
    g.seg(b, O, B, { strokeColor: C.line }); g.seg(b, O, M, { strokeColor: C.aux });
    g.seg(b, A, D, Object.assign({}, dashed)); g.seg(b, B, E, Object.assign({}, dashed));
    g.right(b, A, D, M, 0.1); g.right(b, B, E, M, 0.1);
    g.angle(b, A, O, M, "", C.c, { radius: 0.25 });
    polarText(g, b, O, 50, 0.46, "100°", C.c);
    g.ticks(b, O, A, 1); g.ticks(b, A, B, 1);
    g.seg(b, A, E, { strokeColor: C.d });
    g.angle(b, A, E, B, "", C.d, { radius: 0.32 });
    polarText(g, b, E, 260, 0.52, "?", C.d, { fontSize: 16 });
    if (!sol) { g.readout(() => "A é o ponto médio de OB, ∠AOM = 100°, r tangente em M; D, E as projeções de A, B sobre r. ∠AEB = ?"); return; }
    const rM = g.right(b, O, M, E, 0.1, { visible: false });
    const tD = [g.ticks(b, M, D, 2, { visible: false }), g.ticks(b, D, E, 2, { visible: false })];
    const AM = g.seg(b, A, M, { strokeColor: C.b, visible: false });
    const H = { visible: false };
    const a40 = [g.angle(b, O, M, A, "", C.b, { radius: 0.28, visible: false }), polarText(g, b, M, -60, 0.47, "40°", C.b, H)];
    const a50 = [g.angle(b, A, M, E, "", C.a, { radius: 0.4, visible: false }), polarText(g, b, M, -15, 0.62, "50°", C.a, H)];
    const a50b = [g.angle(b, M, E, A, "", C.a, { radius: 0.26, visible: false }), polarText(g, b, E, 222, 0.43, "50°", C.a, H)];
    stepper(g, [
      { t: "Determine ∠AEB." },
      { t: "OM ⊥ r (raio e tangente), AD ⊥ r, BE ⊥ r: OM ∥ AD ∥ BE.", show: [rM] },
      { t: "As paralelas cortam OB e ME proporcionalmente: A é o ponto médio de OB; logo, D é o ponto médio de ME.", show: tD },
      { t: "AD é perpendicular a ME no seu ponto médio: AM = AE, o triângulo AME é isósceles.", show: [AM] },
      { t: `OA = OM e ∠AOM = 100°: ∠OMA = 40°; logo, ∠AME = 50° = ∠AEM, e ∠AEB = 90° − 50° = <span class="ok">40°</span>.`, show: a40.concat(a50, a50b) },
    ]);
  };

  // Drawing perpendiculars — Fuvest 2021, question 9
  FIG["p-fuv21-9"] = (g, mode) => {
    const sol = SOL(mode);
    const b = g.board([-1.2, 7.0, 17.6, -1.9]);
    const h = 3 * Math.sqrt(3);
    const A = g.fixed(b, 0, 0, "A", { label: { offset: [-8, -16] } }), F = g.fixed(b, 3, 0, "F", { label: { offset: [-4, -16] } });
    const B = g.fixed(b, 6, 0, "B", { label: { offset: [-4, -16] } }), Cc = g.fixed(b, 16, 0, "C", { label: { offset: [-4, -16] } });
    const E = g.fixed(b, 3, h, "E", { label: { offset: [-4, 12] } }), D = g.fixed(b, 16, h, "D", { label: { offset: [2, 12] } });
    g.poly(b, [A, B, E], { fillColor: C.fillA, fillOpacity: 0.3 });
    g.poly(b, [E, B, Cc, D], { fillOpacity: 0.12 });
    g.seg(b, A, Cc); g.seg(b, E, D);
    g.right(b, B, Cc, D, 0.45); g.right(b, Cc, D, E, 0.45);
    g.seg(b, D, F, { strokeColor: C.d, dash: 2 });
    g.segText(b, A, E, "6", B, { color: C.d }); g.segText(b, B, Cc, "10", E, { color: C.d });
    g.ticks(b, A, F, 1); g.ticks(b, F, B, 1);
    if (!sol) { g.readout(() => "AC ∥ DE, ambos ⊥ CD; ABE equilátero de lado 6; F o ponto médio de AB; BC = 10. DF = ?"); return; }
    const EF = g.seg(b, E, F, { strokeColor: C.b, strokeWidth: 2.5, visible: false });
    const rF = g.right(b, E, F, Cc, 0.45, { visible: false });
    const rect = g.poly(b, [F, Cc, D, E], { fillColor: C.fillB, fillOpacity: 0.3, visible: false });
    const tH = g.text(b, 3.65, h * 0.42, "3√3", { color: C.b, visible: false });
    const tri = g.poly(b, [F, Cc, D], { fillColor: C.fillC, fillOpacity: 0.5, visible: false });
    const t13 = [b.create("segment", [[3, -1.05], [16, -1.05]], { strokeColor: C.c, strokeWidth: 1.2, firstArrow: true, lastArrow: true, highlight: false, fixed: true, visible: false }),
      g.text(b, 9.5, -1.45, "FC = 13", { color: C.c, visible: false })];
    const t14 = g.text(b, 9.0, 3.4, "14", { color: C.d, visible: false, fontSize: 18 });
    stepper(g, [
      { t: "Determine DF." },
      { t: "Trace a perpendicular por E: no triângulo equilátero, ela cai no ponto médio F de AB, com altura 6√3/2 = 3√3.", show: [EF, rF, tH] },
      { t: "EF e DC são perpendiculares às paralelas: EFCD é um retângulo; logo, CD = 3√3.", show: [rect] },
      { t: `FC = 3 + 10 = 13; no triângulo retângulo FCD: DF² = 13² + 27 = 196, <span class="ok">DF = 14</span>.`, show: [tri, t14].concat(t13) },
    ]);
  };

  // A parallel to one side — Fuvest 2021, question 12
  FIG["p-fuv21-12"] = (g, mode) => {
    const sol = SOL(mode);
    const b = g.board([sol ? -7.6 : -4.2, 13.6, 37.0, -2.4], { maxH: 300 });
    const O = g.fixed(b, 0, 0, "", { visible: false }), X = g.fixed(b, 35, 0, "", { visible: false }), Y = g.fixed(b, 0, 12, "", { visible: false });
    g.poly(b, [O, X, Y], { fillColor: "#d6b98c", fillOpacity: 0.35 });
    g.right(b, X, O, Y, 1.0);
    g.text(b, 17.5, -1.2, "35", {});
    if (sol) {   // in the solution the leg 12 is split into x and 12 − x: its length goes on a dimension line
      b.create("segment", [[-5.0, 0], [-5.0, 12]], { strokeColor: C.ink, strokeWidth: 1.2, firstArrow: true, lastArrow: true, highlight: false, fixed: true });
      g.text(b, -6.3, 6, "12", {});
    } else g.text(b, -1.1, 6, "12", {});
    const xs = 420 / 47;
    const s = sol ? { value: xs } : g.slider("lado do quadrado:", 1, 11, 0.01, 6, (v) => fmt(v));
    const sqp = [O, g.at(b, () => [s.value, 0]), g.at(b, () => [s.value, s.value]), g.at(b, () => [0, s.value])];
    g.poly(b, sqp, { fillColor: C.fillB, fillOpacity: 0.45, borders: { strokeColor: C.b, strokeWidth: 2 } });
    const inside = () => s.value / 35 + s.value / 12 <= 1 + 1e-9;
    if (!sol) { g.readout(() => `lado ${fmt(s.value)} cm: o quadrado ${inside() ? "cabe" : '<span class="bad">não cabe</span>'} no triângulo. Qual é o maior?`); return; }
    const top = g.poly(b, [[0, xs], [xs, xs], Y].map((p) => (Array.isArray(p) ? g.fixed(b, p[0], p[1], "", { visible: false }) : p)), { fillColor: C.fillA, fillOpacity: 0.6, visible: false });
    const t1 = g.text(b, xs / 2, xs + 0.9, "x", { visible: false, color: C.a }), t2 = g.text(b, -1.9, (12 + xs) / 2, "12 − x", { visible: false, color: C.a, fontSize: 13 });
    const t3 = g.text(b, -1.0, xs / 2, "x", { visible: false, color: C.b });
    stepper(g, [
      { t: "O maior quadrado tem o seu quarto vértice sobre a hipotenusa; chame o seu lado de x." },
      { t: "O seu lado de cima é paralelo ao cateto 35: ele recorta um triângulo pequeno semelhante ao todo, de catetos x e 12 − x.", show: [top, t1, t2, t3] },
      { t: `(12 − x)/x = 12/35; logo, 47x = 420 e <span class="ok">x = 420/47 ≈ 8,94 cm</span>: mais próximo de 9,0 cm.` },
    ]);
  };

  // A midpoint likes another midpoint — Unicamp 2024, question 63
  FIG["p-uni24-63"] = (g, mode) => {
    const sol = SOL(mode);
    const b = g.board([-4.4, 9.3, 3.6, -0.9], { maxH: 400 });
    const A = g.fixed(b, -0.3, 8, "A", { label: { offset: [-14, 6] } }), B = g.fixed(b, 0.7, 8, "B", { label: { offset: [6, 6] } });
    const Cc = g.fixed(b, 2.9, 0, "C", { label: { offset: [6, -10] } }), D = g.fixed(b, -2.1, 0, "D", { label: { offset: [-14, -10] } });
    g.poly(b, [A, B, Cc, D], { fillOpacity: 0.06 });
    const M = g.fixed(b, 0.2, 8, "M", { label: { offset: [-9, -18] } }), N = g.fixed(b, 1.8, 4, "N", { label: { offset: [8, 0] } });
    g.poly(b, [M, B, N], { fillColor: "#64748b", fillOpacity: 0.55 });
    g.ticks(b, A, M, 1); g.ticks(b, M, B, 1); g.ticks(b, B, N, 2); g.ticks(b, N, Cc, 2);
    g.text(b, 0.2, 8.6, "1", { fontSize: 13 }); g.text(b, -0.4, 0.4, "5", { fontSize: 14 });
    if (!sol) { g.readout(() => "AB = 1, CD = 5, M e N pontos médios de AB e BC, [MBN] = 1. [ABCD] = ?"); return; }
    const AC = g.seg(b, A, Cc, { strokeColor: C.b, strokeWidth: 2, visible: false });
    const MN = g.seg(b, M, N, { strokeColor: C.b, strokeWidth: 2, visible: false });
    const ABC = g.poly(b, [A, B, Cc], { fillColor: C.fillB, fillOpacity: 0.3, visible: false });
    const H = g.seg(b, [-2.6, 8], [-2.6, 0], { strokeColor: C.d, strokeWidth: 2, firstArrow: true, lastArrow: true, visible: false });
    const tH = g.text(b, -3.6, 4, "h = 8", { color: C.d, visible: false, fontSize: 14 });
    stepper(g, [
      { t: "Trace a diagonal AC." },
      { t: "Em ABC, M e N são pontos médios de dois lados: MN ∥ AC e MN = AC/2. MBN ∼ ABC na razão 1/2; logo, [ABC] = 4·[MBN] = 4.", show: [AC, MN, ABC] },
      { t: "ABC tem base AB = 1 e a altura h do trapézio: h/2 = 4, h = 8.", show: [H, tH] },
      { t: `[ABCD] = (1 + 5)·8/2 = <span class="ok">24</span>.` },
    ]);
  };

  // IMO 2009, Problem 2
  FIG["imo2009-2"] = (g, mode) => {
    const sol = SOL(mode);
    const b = g.board([-2.6, 3.6, 3.4, -0.9]);
    const A = g.fixed(b, 0.3, 3, "A", { label: { offset: [-4, 12] } }), B = g.fixed(b, -2, 0, "B", { label: { offset: [-14, -10] } });
    const Cc = g.fixed(b, 3, 0, "C", { label: { offset: [6, -10] } });
    const [Oc, Rc] = circum(A, B, Cc);
    g.circ(b, g.fixed(b, ...Oc, "", { visible: false }), Rc, { strokeColor: "#e2e8f0" });
    const O = g.fixed(b, ...Oc, "O", { size: 2, label: { offset: [-4, -14] } });
    g.poly(b, [A, B, Cc], { fillOpacity: 0.06 });
    const segCA = g.seg(b, Cc, A, { visible: false }), segAB = g.seg(b, A, B, { visible: false });
    const P = g.glider(b, ...lerp([3, 0], [0.3, 3], 0.7), segCA, "P", { label: { offset: [8, 2] } });
    // in the solution Q is placed so that OP = OQ (the conclusion); in the statement it is free
    const qOnAB = () => {
      const d = sub(xy(B), xy(A)), f = sub(xy(A), Oc), r2 = sq(dist(O, P));
      const a = d[0] * d[0] + d[1] * d[1], bb = 2 * (f[0] * d[0] + f[1] * d[1]), c = f[0] * f[0] + f[1] * f[1] - r2, D = bb * bb - 4 * a * c;
      if (D < 0) return lerp(A, B, 0.5);
      // both roots give OQ = OP; take one inside the side AB (the one nearer B when both are)
      const roots = [(-bb + Math.sqrt(D)) / (2 * a), (-bb - Math.sqrt(D)) / (2 * a)].filter((t) => t > 0.02 && t < 0.98);
      const s = roots.length ? roots[0] : (-bb + Math.sqrt(D)) / (2 * a);
      return lerp(A, B, Math.max(0.02, Math.min(0.98, s)));
    };
    const Q = sol ? g.dep(b, () => qOnAB()[0], () => qOnAB()[1], "Q", { label: { offset: [-16, 2] } })
      : g.glider(b, ...lerp([0.3, 3], [-2, 0], 0.5), segAB, "Q", { label: { offset: [-16, 2] } });
    const K = g.dep(b, () => mid(xy(B), xy(P))[0], () => mid(xy(B), xy(P))[1], "K", { label: { offset: [-4, -16] } });
    const L = g.dep(b, () => mid(xy(Cc), xy(Q))[0], () => mid(xy(Cc), xy(Q))[1], "L", { label: { offset: [2, -16] } });
    const M = g.dep(b, () => mid(xy(P), xy(Q))[0], () => mid(xy(P), xy(Q))[1], "M", { label: { offset: [-4, 12] } });
    g.seg(b, B, P, { strokeColor: C.aux }); g.seg(b, Cc, Q, { strokeColor: C.aux });
    b.create("line", [P, Q], { strokeColor: C.a, strokeWidth: 2, highlight: false });
    const gam = () => circum(K, L, M);
    b.create("circle", [g.at(b, () => gam()[0]), () => gam()[1]], { strokeColor: C.b, strokeWidth: 2, highlight: false });
    const tangency = () => { const [c] = gam(); const u = unit(sub(xy(M), c)), v = unit(sub(xy(P), xy(Q))); return Math.abs(90 - Math.acos(Math.abs(u[0] * v[0] + u[1] * v[1])) / D2R); };
    g.seg(b, O, P, { strokeColor: C.d, dash: 2 }); g.seg(b, O, Q, { strokeColor: C.d, dash: 2 });
    if (!sol) {
      g.readout(() => { const t = tangency(); return `Mova P e Q. A circunferência Γ por K, L, M ${t < 0.4 ? 'é <span class="ok">tangente</span>' : "não é tangente"} a PQ, e ${Math.abs(dist(O, P) - dist(O, Q)) < 0.01 ? '<span class="ok">OP = OQ</span>' : "OP ≠ OQ"}.`; });
      return;
    }
    const MK = g.seg(b, M, K, { strokeColor: C.c, strokeWidth: 2.2, visible: false }), ML = g.seg(b, M, L, { strokeColor: C.c, strokeWidth: 2.2, visible: false });
    const a1 = g.angle(b, K, M, Q, "", C.a, { radius: 0.3, visible: false }), a2 = g.angle(b, M, L, K, "", C.a, { radius: 0.3, visible: false }), a3 = g.angle(b, A, Q, P, "", C.a, { radius: 0.3, visible: false });
    const tAPQ = g.poly(b, [A, P, Q], { fillColor: C.fillA, fillOpacity: 0.3, visible: false }), tMKL = g.poly(b, [M, K, L], { fillColor: C.fillA, fillOpacity: 0.3, visible: false });
    stepper(g, [
      { t: "Aqui Q está posicionado de modo que OP = OQ; então a circunferência Γ é tangente a PQ, como diz o problema (mova P)." },
      { t: "Bases médias: MK ∥ AB com MK = QB/2, e ML ∥ AC com ML = PC/2.", show: [MK, ML] },
      { t: "Tangente e corda: ∠KMQ = ∠MLK; ângulos alternos (MK ∥ AB): ∠KMQ = ∠AQP. Do mesmo modo, ∠MKL = ∠APQ.", show: [a1, a2, a3] },
      { t: () => `Logo, MKL ∼ APQ: MK/ML = AP/AQ, isto é, AQ·QB = AP·PC.`, show: [tAPQ, tMKL] },
      { t: `Potência de ponto: AQ·QB = R² − OQ² e AP·PC = R² − OP². Portanto, <span class="ok">OP = OQ</span>.` },
    ]);
  };

  // Four formulas — Unicamp 2025, second phase, question 6 (a)
  FIG["p-uni25-6"] = (g, mode) => {
    const sol = SOL(mode);
    const b = g.board([-1.4, 1.65, 3.6, -0.25], { maxH: 260 });
    const H = 1.1, s = 0.42;   // metres; s = side of the triangle ABC
    b.create("polygon", [[-0.4, H], [3.4, H], [3.4, H + 0.12], [-0.4, H + 0.12]], { fillColor: "#9ca3af", fillOpacity: 1, borders: { strokeColor: "#6b7280", strokeWidth: 1 }, vertices: { visible: false }, highlight: false });
    b.create("segment", [[-1.4, 0], [3.6, 0]], { strokeColor: C.line, strokeWidth: 2, highlight: false });
    const A = g.fixed(b, 0, H, "A", { label: { offset: [-14, -2] } }), B = g.fixed(b, s, H, "B", { label: { offset: [4, -2] } });
    const Cp = [s / 2, H - s * Math.sqrt(3) / 2], Cc = g.fixed(b, ...Cp, "C", { label: { offset: [6, 0] } });
    const Dp = meet([s, H], Cp, [0, 0], [1, 0]), D = g.fixed(b, ...Dp, "D", { label: { offset: [-14, -14] } });
    const D2 = meet([0, H], Cp, [0, 0], [1, 0]);
    g.seg(b, B, D, { strokeColor: C.line, strokeWidth: 3 }); g.seg(b, A, [D2[0], D2[1]], { strokeColor: C.line, strokeWidth: 3 });
    g.poly(b, [A, B, Cc], { fillColor: C.fillA, fillOpacity: 0.35 });
    b.create("segment", [[-0.9, 0], [-0.9, H]], { strokeColor: C.d, strokeWidth: 1.4, firstArrow: true, lastArrow: true, highlight: false });
    g.text(b, -1.1, H / 2, "110 cm", { color: C.d, fontSize: 13 });
    if (!sol) { g.readout(() => "ABC é equilátero; a trave está 110 cm acima do chão. DB = ?"); return; }
    const G0 = g.fixed(b, 2, 0, "", { visible: false });   // a point of the floor, to the right of D
    const a60 = [g.angle(b, Cc, B, A, "", C.b, { radius: 0.1, visible: false }), polarText(g, b, B, 210, 0.25, "60°", C.b, { visible: false, fontSize: 13 })];
    const a60d = [g.angle(b, G0, D, B, "", C.b, { radius: 0.18, visible: false }), polarText(g, b, D, 30, 0.33, "60°", C.b, { visible: false, fontSize: 13 })];
    const F = [s, 0], hB = g.seg(b, B, F, { strokeColor: C.d, dash: 2, visible: false }), rF = g.right(b, D, F, B, 0.06, { visible: false });
    stepper(g, [
      { t: "Determine DB." },
      { t: "ABC é equilátero: a perna BD forma 60° com a trave AB e, portanto, também com o chão (ângulos alternos).", show: a60.concat(a60d) },
      { t: `A altura de B até o chão é 110, oposta a 60°: 110 = (√3/2)·DB; logo, <span class="ok">DB = 220/√3 = 220√3/3 cm</span>.`, show: [hB, rF] },
    ]);
  };

  // IMO 1960, Problem 3
  FIG["imo1960-3"] = (g, mode) => {
    const sol = SOL(mode);
    const b = g.board([-0.5, 3.6, 6.5, -0.7]);
    const a = 6;
    const B = g.fixed(b, 0, 0, "B", { label: { offset: [-14, -10] } }), Cc = g.fixed(b, a, 0, "C", { label: { offset: [4, -10] } });
    const Ocirc = g.fixed(b, a / 2, 0, "", { visible: false });
    const semi = b.create("arc", [Ocirc, Cc, B], { visible: false });
    const A = sol ? g.fixed(b, 1.6, Math.sqrt(9 - 1.4 * 1.4), "A", { label: { offset: [-4, 12] } }) : g.glider(b, 1.6, Math.sqrt(9 - 1.4 * 1.4), semi, "A", { label: { offset: [-4, 12] } });
    b.create("arc", [Ocirc, Cc, B], Object.assign({ highlight: false }, dashed, { strokeColor: "#e2e8f0" }));
    g.poly(b, [A, B, Cc], { fillOpacity: 0.08 });
    g.right(b, B, A, Cc, 0.18);
    const n = sol ? { value: 5 } : g.slider("n =", 3, 15, 2, 5, (v) => String(v));
    const ticks = g.curve(b, () => { const X = [], Y = []; for (let i = 0; i <= n.value; i++) { X.push(a * i / n.value, a * i / n.value, NaN); Y.push(-0.12, 0.12, NaN); } return [X, Y]; }, { strokeColor: C.ink, strokeWidth: 1.5 });
    const P = g.at(b, () => [a * (n.value - 1) / (2 * n.value), 0]), Q = g.at(b, () => [a * (n.value + 1) / (2 * n.value), 0]);
    g.seg(b, P, Q, { strokeColor: C.d, strokeWidth: 4 });
    // the ends of the middle segment, named as in the text
    g.text(b, () => xy(P)[0] - 0.08, -0.36, "P", { fontSize: 15, cssStyle: "font-style: italic" });
    g.text(b, () => xy(Q)[0] + 0.08, -0.36, "Q", { fontSize: 15, cssStyle: "font-style: italic" });
    g.seg(b, A, P, { strokeColor: C.a }); g.seg(b, A, Q, { strokeColor: C.a });
    g.angle(b, P, A, Q, "", C.a, { radius: 0.9 });
    // α is thin and the median AM runs inside it: its name goes just outside, beside AQ
    const tA = () => add(xy(A), mul(rot(unit(sub(xy(Q), xy(A))), 11 * D2R), 0.95));
    g.text(b, () => tA()[0], () => tA()[1], "α", { color: C.a, fontSize: 17 });
    const Hf = g.at(b, () => [xy(A)[0], 0]);
    g.seg(b, A, Hf, Object.assign({}, dashed));
    const tanA = () => Math.tan(deg(P, A, Q) * D2R), h = () => xy(A)[1], form = () => 4 * n.value * h() / ((n.value * n.value - 1) * a);
    if (!sol) { g.readout(() => "Mova A pela semicircunferência e mude n (ímpar)."); return; }
    const M = g.fixed(b, a / 2, 0, "M", { size: 2.5, label: { offset: [-5, -17] } });   // named from the first step on
    const AM = g.seg(b, A, M, { strokeColor: C.b, strokeWidth: 2.2, visible: false });
    const hT = g.text(b, 1.35, 1.3, "h", { color: C.aux, visible: false });
    const shade = g.poly(b, [A, P, Q], { fillColor: C.fillA, fillOpacity: 0.45, visible: false });
    stepper(g, [
      { t: "PQ = a/n é a parte do meio, M o seu ponto médio (e o ponto médio de BC)." },
      { t: "A mediana relativa à hipotenusa é metade dela: AM = a/2.", show: [AM] },
      { t: "Área de APQ: ½·AP·AQ·sen α = ½·PQ·h; logo, AP·AQ·sen α = ah/n.", show: [shade, hT] },
      { t: "Lei dos cossenos e AP² + AQ² = 2AM² + 2MP²: AP·AQ·cos α = a²(n² − 1)/(4n²)." },
      { t: `Dividindo: <span class="ok">tg α = 4nh/((n² − 1)a)</span>.` },
    ]);
  };

  // The laws of cosines and sines — Unicamp 2021, question 27
  FIG["p-uni21-27"] = (g, mode) => {
    const sol = SOL(mode);
    const b = g.board([-0.6, 4.4, 7.0, -0.8]);
    const r = sol ? { value: 25 } : g.slider("razão r da PA:", 2, 55, 1, 25, (v) => v + "°");
    const angs = () => [60 - r.value, 60, 60 + r.value];   // opposite a < b < c
    const c = 6;   // the largest side, on the x axis: A = (0, 0), B = (c, 0); C makes the angles
    const Cpt = () => { const [al, , ] = angs(); const bb = c * Math.sin(al * D2R) / Math.sin((60 + r.value) * D2R);   // side opposite... computed below
      // angle at A is opposite a: A = 60 − r, angle at B = 60 (opposite b), C = 60 + r (opposite c)
      const sideB = c * Math.sin(60 * D2R) / Math.sin((60 + r.value) * D2R);   // b = AC
      return [sideB * Math.cos(al * D2R), sideB * Math.sin(al * D2R)];
    };
    const A = g.fixed(b, 0, 0, "A", { label: { offset: [-14, -10] } }), B = g.fixed(b, c, 0, "B", { label: { offset: [4, -10] } });
    const Cc = g.dep(b, () => Cpt()[0], () => Cpt()[1], "C", { label: { offset: [-4, 12] } });
    g.poly(b, [A, B, Cc], { fillOpacity: 0.1 });
    g.angle(b, B, A, Cc, "", C.a, { radius: 0.8 }); bisText(g, b, B, A, Cc, 1.45, "60° − r", C.a, { fontSize: 13 });
    g.angle(b, Cc, B, A, "", C.b, { radius: 0.6 }); bisText(g, b, Cc, B, A, 0.95, "60°", C.b);
    g.angle(b, A, Cc, B, "", C.c, { radius: 0.5 }); bisText(g, b, A, Cc, B, 0.85, "60° + r", C.c, { fontSize: 13 });
    g.segText(b, B, Cc, "a", A); g.segText(b, A, Cc, "b", B); g.segText(b, A, B, "c", Cc);
    const sides = () => [dist(B, Cc), dist(A, Cc), dist(A, B)];
    g.readout(() => "Os ângulos 60° − r, 60° e 60° + r estão opostos aos lados a < b < c (mude a razão r).");
    if (sol) g.readout(() => "Os ângulos em progressão somam 180°; logo, o do meio é 60°, e ele fica oposto ao lado do meio, b. Lei dos cossenos: b² = a² + c² − 2ac·cos 60° = a² + c² − ac.");
  };

  // IMO 1961, Problem 2
  FIG["imo1961-2"] = (g, mode) => {
    const sol = SOL(mode);
    const b = g.board([-0.8, 5.6, 6.8, -0.8]);
    const A = g.fixed(b, 0, 0, "", {}), B = g.free(b, 5.5, 0.4, "", {}), Cc = g.free(b, 2.0, 3.3, "", {});
    g.poly(b, [A, B, Cc], { fillOpacity: 0.12 });
    g.angle(b, B, A, Cc, "γ", C.a, { radius: 0.6 });
    g.segText(b, A, B, "a", Cc); g.segText(b, A, Cc, "b", B); g.segText(b, B, Cc, "c", A);
    const vals = () => { const a = dist(A, B), bb = dist(A, Cc), c = dist(B, Cc), S = triArea(A, B, Cc); return [a, bb, c, S]; };
    const eq = () => {   // the equilateral triangle on AB, for comparison
      const p = xy(B), q = rot(p, Math.PI / 3); return q;
    };
    if (sol) {
      const E = g.at(b, eq);
      g.poly(b, [A, B, E], { fillOpacity: 0, borders: { strokeColor: C.b, strokeWidth: 1.6, dash: 2 } });
    }
    g.readout(() => {
      const [a, bb, c, S] = vals(), L = a * a + bb * bb + c * c, R = 4 * Math.sqrt(3) * S, gm = deg(B, A, Cc);
      return sol ? `a² + b² + c² − 4√3·S = 2a² + 2b² − 4ab·cos(γ − 60°) ≥ 2(a − b)² ≥ 0; a igualdade vale só para a = b e γ = 60° (tracejado: o triângulo equilátero sobre a).` : "Arraste os dois vértices azuis.";
    });
  };

  // Where the law of sines ends — ITA 2023, second phase, question 9
  FIG["p-ita23-9"] = (g, mode) => {
    const sol = SOL(mode);
    const b = g.board([-6.2, 6.2, 6.2, -6.2], { maxH: 360 });
    const O = g.fixed(b, 0, 0, "O", { size: 2, label: { offset: [4, -12] } });
    const circle = g.circ(b, O, 5, { strokeColor: C.aux });
    const B = g.fixed(b, -4, -3, "B", { label: { offset: [-14, -10] } }), Cc = g.fixed(b, 4, -3, "C", { label: { offset: [4, -10] } });
    g.segText(b, B, Cc, "8", O, { color: C.d });
    // the solution: AB = 6 + √11 and AC = 6 − √11; with A = (x, y) on x² + y² = 25, AB² − AC² = 16x and
    // AB² + AC² = 100 + 12y give A = (3√11/2, −1/2) exactly
    const target = () => [1.5 * Math.sqrt(11), -0.5];
    const A = sol ? g.fixed(b, ...target(), "A", { label: { offset: [-4, 12] } }) : g.glider(b, 0, 5, circle, "A", { label: { offset: [-4, 12] } });
    g.poly(b, [A, B, Cc], { fillOpacity: 0.12 });
    g.angle(b, B, A, Cc, "", C.a, { radius: 0.9 });
    bisText(g, b, B, A, Cc, 1.55, "α", C.a, { fontSize: 17 });
    g.readout(() => {
      const p = 8 + dist(A, B) + dist(A, Cc), al = deg(B, A, Cc);
      const sum = [deg(B, A, Cc), deg(A, B, Cc), deg(A, Cc, B)].reduce((s, x) => s + Math.sin(x * D2R), 0);
      if (sol) return `AB = 6 + √11 e AC = 6 − √11: perímetro = 8 + (6 + √11) + (6 − √11) = <span class="ok">20</span>, e sen α + sen β + sen γ = 20/(2·5) = 2. No arco menor (α obtuso), o perímetro nunca chega a 20.`;
      return "Arraste A pela circunferência (raio 5, pois 2R = 20/2). " + `perímetro = ${fmt(p, 2)}${Math.abs(p - 20) < 0.02 ? ' <span class="ok">= 20</span>' : ""}, sen α + sen β + sen γ = ${fmt(sum, 2)}`;
    });
  };

  // The angle bisector theorem — ITA 2017, question 20
  FIG["p-ita17-20"] = (g, mode) => {
    const sol = SOL(mode);
    const b = g.board([-2, 9.4, 23, -14.6]);
    const A = g.fixed(b, 0, 0, "A", { label: { offset: [-16, -6] } }), B = g.fixed(b, 20, 0, "B", { label: { offset: [6, -6] } });
    const cx = (100 - 225 + 400) / 40, Cp = [cx, Math.sqrt(100 - cx * cx)];
    const Cc = g.fixed(b, ...Cp, "C", { label: { offset: [-4, 12] } });
    const D = g.fixed(b, 8, 0, "D", { label: { offset: [-16, -14] } });
    const u = unit(sub([8, 0], Cp)), CE = 25 * Math.sqrt(6) / 3;
    const E = g.fixed(b, ...add(Cp, mul(u, CE)), "E", { label: { offset: [6, -6] } });
    g.poly(b, [A, B, Cc], { fillOpacity: 0.08 });
    g.seg(b, Cc, E, { strokeColor: C.a }); g.seg(b, B, E, { strokeColor: C.line });
    g.segText(b, A, Cc, "10", B, { off: 0.6 }); g.segText(b, Cc, B, "15", A, { off: 0.6 }); g.text(b, 10, -0.9, "", {});
    g.angle(b, A, Cc, D, "", C.a, { radius: 1.6 }); g.angle(b, D, Cc, B, "", C.a, { radius: 1.9 });
    g.angle(b, D, B, E, "", C.c, { radius: 1.6 });
    g.text(b, 10, 0.9, "AB = 20", { fontSize: 13 });
    if (!sol) { g.readout(() => "CD é bissetriz de ∠ACB; E no prolongamento de CD com ∠DBE = ∠DCB. CE = ?"); return; }
    const t8 = g.text(b, 4, -0.9, "8", { color: C.d, visible: false }), t12 = g.text(b, 14, -0.9, "12", { color: C.d, visible: false });
    const tr1 = g.poly(b, [E, B, D], { fillColor: C.fillC, fillOpacity: 0.45, visible: false }), tr2 = g.poly(b, [E, Cc, B], { fillColor: C.fillB, fillOpacity: 0.2, visible: false });
    const [Oc, Rc] = circum(A, B, Cc);
    const circ = g.circ(b, g.fixed(b, ...Oc, "", { visible: false }), Rc, { strokeColor: C.aux, dash: 2, visible: false });
    stepper(g, [
      { t: "AC = 10, CB = 15, AB = 20." },
      { t: "Teorema da bissetriz: AD/DB = 10/15 e AD + DB = 20; logo, AD = 8, DB = 12.", show: [t8, t12] },
      { t: "EBD ∼ ECB (ângulo comum em E, ∠EBD = ∠ECB), razão BD/CB = 4/5: ED = (16/25)·EC; logo, CD = (9/25)·EC.", show: [tr1, tr2] },
      { t: "Medida da bissetriz: cos C = −1/4, cos(C/2) = √(3/8), CD = 2·10·15·cos(C/2)/25 = 3√6.", show: [] },
      { t: `EC = (25/9)·3√6 = <span class="ok">25√6/3</span>. (E está na circunferência circunscrita: DA·DB = DC·DE.)`, show: [circ] },
    ]);
  };

  // IMO 2003, Problem 4
  FIG["imo2003-4"] = (g, mode) => {
    const sol = SOL(mode);
    const b = g.board([-3.4, 3.4, 3.4, sol ? -3.9 : -3.4], { maxH: 400 });   // room for the circle on DC
    const R = 2.6, O = g.fixed(b, 0, 0, "", { visible: false });
    const circle = g.circ(b, O, R, { strokeColor: C.aux });
    const onC = (t) => [R * Math.cos(t), R * Math.sin(t)];
    const A = g.fixed(b, ...onC(3.3), "A", { label: { offset: [-16, -4] } }), Cc = g.fixed(b, ...onC(-0.1), "C", { label: { offset: [6, -4] } });
    const B = g.glider(b, ...onC(2.18), circle, "B", { label: { offset: [-10, 12] } });   // B, D far from antipodal: R, P away from A, C
    // D on the arc AC not containing B; in the solution it is placed where the bisectors meet on AC
    const D = sol ? g.dep(b, () => { // choose D with DA/DC = BA/BC
      const k = dist(B, A) / dist(B, Cc); let best = null;
      for (let i = 1; i < 2000; i++) { const t = 3.3 + (2 * Math.PI - 0.1 - 3.3) * i / 2000; const P = onC(t); const v = Math.abs(dist(P, A) / dist(P, Cc) - k); if (!best || v < best[0]) best = [v, P]; }
      return best[1][0]; }, () => { const k = dist(B, A) / dist(B, Cc); let best = null;
      for (let i = 1; i < 2000; i++) { const t = 3.3 + (2 * Math.PI - 0.1 - 3.3) * i / 2000; const P = onC(t); const v = Math.abs(dist(P, A) / dist(P, Cc) - k); if (!best || v < best[0]) best = [v, P]; }
      return best[1][1]; }, "D", { label: { offset: [-4, -16] } })
      : g.glider(b, ...onC(4.5), circle, "D", { label: { offset: [-4, -16] } });
    g.poly(b, [A, B, Cc, D], { fillOpacity: 0.06 });
    g.seg(b, A, Cc, { strokeColor: C.line, strokeWidth: 1.6 });
    const ft = (X, Y) => () => footOn(D, X, Y);
    const P = g.dep(b, () => ft(B, Cc)()[0], () => ft(B, Cc)()[1], "P", { size: 2.5, label: { offset: [6, 2] } });
    const Q = g.dep(b, () => ft(Cc, A)()[0], () => ft(Cc, A)()[1], "Q", { size: 2.5, label: { offset: [4, 8] } });
    const Rr = g.dep(b, () => ft(A, B)()[0], () => ft(A, B)()[1], "R", { size: 2.5, label: { offset: [-16, 2] } });
    [[B, Cc, P], [Cc, A, Q], [A, B, Rr]].forEach(([X, Y, F]) => { b.create("line", [X, Y], Object.assign({ highlight: false }, dashed, { strokeColor: "#e2e8f0" })); g.seg(b, D, F, { strokeColor: C.aux, strokeWidth: 1.2 }); });
    g.seg(b, Rr, P, { strokeColor: C.a, strokeWidth: 2 });
    const bisFoot = (V, X, Y) => () => lerp(X, Y, dist(V, X) / (dist(V, X) + dist(V, Y)));
    const Xb = g.dep(b, () => bisFoot(B, A, Cc)()[0], () => bisFoot(B, A, Cc)()[1], "", { size: 3, color: C.b });
    const Yb = g.dep(b, () => bisFoot(D, A, Cc)()[0], () => bisFoot(D, A, Cc)()[1], "", { size: 3, color: C.c });
    g.seg(b, B, Xb, { strokeColor: C.b, strokeWidth: 1.6 }); g.seg(b, D, Yb, { strokeColor: C.c, strokeWidth: 1.6 });
    const rd = () => `${Math.abs(dist(P, Q) - dist(Q, Rr)) < 0.01 ? '<span class="ok">PQ = QR</span>' : "PQ ≠ QR"}, e as bissetrizes por B (verde) e por D (roxa) encontram AC ${dist(Xb, Yb) < 0.02 ? '<span class="ok">no mesmo ponto</span>' : "em pontos diferentes"}.`;
    if (!sol) { g.readout(() => "Arraste B e D pela circunferência. " + rd()); return; }
    const c1 = b.create("circle", [g.at(b, () => mid(xy(D), xy(Cc))), () => dist(D, Cc) / 2], { strokeColor: C.gold, strokeWidth: 1.5, highlight: false, visible: false });
    const c2 = b.create("circle", [g.at(b, () => mid(xy(D), xy(A))), () => dist(D, A) / 2], { strokeColor: C.gold, strokeWidth: 1.5, highlight: false, visible: false });
    stepper(g, [
      { t: () => "Aqui D está posicionado de modo que DA/DC = BA/BC (mova B). " + rd() },
      { t: "∠DPC = ∠DQC = 90°: P, Q na circunferência de diâmetro DC; logo, PQ = DC·sen C. Do mesmo modo, QR = DA·sen A.", show: [c1, c2] },
      { t: "PQ = QR ⟺ DA/DC = sen C/sen A = BA/BC (lei dos senos em ABC)." },
      { t: `Teorema da bissetriz: as bissetrizes por B e por D dividem AC nas razões BA/BC e DA/DC: <span class="ok">elas se encontram sobre AC exatamente quando PQ = QR</span>.` },
    ]);
  };

  // Five ways to the area — Unicamp 2026, question 50
  FIG["p-uni26-50"] = (g, mode) => {
    const sol = SOL(mode);
    const b = g.board([-0.6, 5.7, 5.6, -0.8]);
    const x = 5;
    const D = g.fixed(b, 0, 0, "D", { label: { offset: [-14, -10] } }), Cc = g.fixed(b, x, 0, "C", { label: { offset: [4, -10] } });
    const B = g.fixed(b, x, x, "B", { label: { offset: [4, 6] } }), A = g.fixed(b, 0, x, "A", { label: { offset: [-14, 6] } });
    const M = g.fixed(b, x / 2, x, "M", { label: { offset: [-4, 12] } });
    g.poly(b, [D, Cc, B, A], { fillOpacity: 0.04 });
    const t0 = x / 2 - x / Math.sqrt(5);
    const s = sol ? { value: t0 } : g.slider("PD = QC:", 0.1, 2.4, 0.01, 1.0, (v) => fmt(v));
    const P = g.dep(b, () => s.value, () => 0, "P", { label: { offset: [0, -16] } }), Q = g.dep(b, () => x - s.value, () => 0, "Q", { label: { offset: [-8, -16] } });
    g.poly(b, [P, M, Q], { fillColor: C.fillA, fillOpacity: 0.4 });
    g.angle(b, P, M, Q, "", C.d, { radius: 0.8 });
    if (sol) polarText(g, b, M, -78, 1.05, "θ", C.d, { fontSize: 17 });   // the altitude MH will run along the bisector
    else bisText(g, b, P, M, Q, 1.2, "θ", C.d, { fontSize: 17 });
    g.ticks(b, D, P, 1); g.ticks(b, Q, Cc, 1);
    const cosT = () => Math.cos(deg(P, M, Q) * D2R);
    if (!sol) { g.readout(() => `cos θ = ${fmt(cosT(), 3)} ${Math.abs(cosT() - 2 / 3) < 0.004 ? '<span class="ok">= 2/3</span>' : "(queremos 2/3)"}. Área de PMQ = ?`); return; }
    const H = g.fixed(b, x / 2, 0, "H", { visible: false, label: { offset: [-4, -16] } });
    const MH = g.seg(b, M, H, { strokeColor: C.b, strokeWidth: 2, visible: false });
    const rH = g.right(b, M, H, Q, 0.25, { visible: false });
    const half = [g.angle(b, P, M, H, "", C.b, { radius: 1.6, visible: false }), polarText(g, b, M, -102, 1.9, "θ/2", C.b, { visible: false, fontSize: 13 })];
    const tx = g.text(b, x / 2 + 0.25, x / 2, "x", { color: C.b, visible: false });
    stepper(g, [
      { t: "PD = QC, cos θ = 2/3." },
      { t: "MP = MQ: a altura MH = x (um lado do quadrado) cai no ponto médio H de PQ e divide θ ao meio.", show: [H, MH, rH, tx] },
      { t: "cos²(θ/2) = (1 + 2/3)/2 = 5/6; logo, tg(θ/2) = 1/√5 e PH = x/√5.", show: half },
      { t: `Área = PQ·MH/2 = (2x/√5)·x/2 = <span class="ok">x²/√5 = √5·x²/5</span>.` },
    ]);
  };

  // IMO 2007, Problem 4
  FIG["imo2007-4"] = (g, mode) => {
    const sol = SOL(mode);
    const b = g.board([-3.3, 3.3, 3.3, -3.5], { maxH: 400 });
    const R = 2.8, Oc = g.fixed(b, 0, 0, "O", { size: 2, label: { offset: [4, -12] } });
    const circle = g.circ(b, g.fixed(b, 0, 0, "", { visible: false }), R, { strokeColor: C.aux });
    const onC = (t) => [R * Math.cos(t), R * Math.sin(t)];
    const A = g.fixed(b, ...onC(-2.75), "A", { label: { offset: [-16, -6] } }), B = g.fixed(b, ...onC(-0.3), "B", { label: { offset: [6, -6] } });
    // C well off the symmetric position, so that P, Q, N and O do not pile up in the middle
    const Cc = sol ? g.fixed(b, ...onC(2.3), "C", { label: { offset: [-10, 12] } }) : g.glider(b, ...onC(2.3), circle, "C", { label: { offset: [-10, 12] } });
    g.poly(b, [A, B, Cc], { fillOpacity: 0.05 });
    // R: the midpoint of the arc AB not containing C
    const Rf = () => { const m = mid(xy(A), xy(B)); let u = unit(m); if (side(Cc, A, B) * side(mul(u, R), A, B) > 0) u = mul(u, -1); return mul(u, R); };
    const Rp = g.dep(b, () => Rf()[0], () => Rf()[1], "R", { label: { offset: [-4, -16] } });
    const K = g.dep(b, () => mid(xy(B), xy(Cc))[0], () => mid(xy(B), xy(Cc))[1], "K", { label: { offset: [6, 2] } });
    const L = g.dep(b, () => mid(xy(A), xy(Cc))[0], () => mid(xy(A), xy(Cc))[1], "L", { label: { offset: [-16, 2] } });
    const P = g.dep(b, () => meet(Cc, Rp, [0, 0], K)[0], () => meet(Cc, Rp, [0, 0], K)[1], "P", { label: { offset: [6, 0] } });
    const Q = g.dep(b, () => meet(Cc, Rp, [0, 0], L)[0], () => meet(Cc, Rp, [0, 0], L)[1], "Q", { label: { offset: [-16, 0] } });
    g.seg(b, Cc, Rp, { strokeColor: C.a });
    b.create("line", [[0, 0], K], Object.assign({ highlight: false }, dashed, { strokeColor: "#cbd5e1" }));
    b.create("line", [[0, 0], L], Object.assign({ highlight: false }, dashed, { strokeColor: "#cbd5e1" }));
    g.poly(b, [Rp, P, K], { fillColor: C.fillB, fillOpacity: 0.5 });
    g.poly(b, [Rp, Q, L], { fillColor: C.fillC, fillOpacity: 0.5 });
    if (!sol) { g.readout(() => "Arraste C."); return; }
    const N = g.dep(b, () => mid(xy(Cc), xy(Rp))[0], () => mid(xy(Cc), xy(Rp))[1], "N", { visible: false, label: { offset: [-16, -4] } });
    const ON = g.seg(b, [0, 0], N, { strokeColor: C.d, dash: 2, visible: false });
    const OPQ = g.poly(b, [[0, 0], P, Q], { fillColor: C.fillD, fillOpacity: 0.35, visible: false });
    stepper(g, [
      { t: "Queremos mostrar que [RPK] = [RQL]." },
      { t: "Triângulos retângulos CKP e CLQ com ângulo C/2 em C: PK = (a/2)·tg(C/2), CP = (a/2)/cos(C/2); QL = (b/2)·tg(C/2), CQ = (b/2)/cos(C/2)." },
      { t: "OP ⊥ BC e OQ ⊥ CA formam o mesmo ângulo 90° − C/2 com CR: OPQ é isósceles. O pé N é o ponto médio de CR e de PQ; logo, RP = CQ e RQ = CP.", show: [N, ON, OPQ] },
      { t: `Os ângulos em P e Q têm seno cos(C/2): [RPK] = ½·RP·PK·cos(C/2) = <span class="ok">(ab/8)·tg(C/2) = [RQL]</span>.` },
    ]);
  };

  // Trapezoids — ITA 2015, question 17
  FIG["p-ita15-17"] = (g, mode) => {
    const sol = SOL(mode);
    const b = g.board([-1.2, 8.6, 16.2, -1.4]);
    const h = 36 / 5, off = 27 / 5;
    const A = g.fixed(b, 0, 0, "A", { label: { offset: [-14, -10] } }), B = g.fixed(b, 15, 0, "B", { label: { offset: [4, -10] } });
    const D = g.fixed(b, off, h, "D", { label: { offset: [-14, 6] } }), Cc = g.fixed(b, 15 - off, h, "C", { label: { offset: [4, 6] } });
    g.poly(b, [A, B, Cc, D], { fillOpacity: 0.06 });
    g.seg(b, A, Cc, { strokeColor: C.aux }); g.seg(b, B, D, { strokeColor: C.aux });
    const Ep = meet(A, Cc, B, D), E = g.fixed(b, ...Ep, "E", { label: { offset: [10, -4] } });
    g.right(b, A, D, B, 0.45);
    g.segText(b, A, D, "9", B); g.text(b, 7.5, -0.6, "15", {});
    if (!sol) { g.readout(() => "Trapézio isósceles, AB = 15, AD = 9, ∠ADB = 90°. Distância de E a AB = ?"); return; }
    const Hf = g.fixed(b, off, 0, "", { visible: false });
    const DH = g.seg(b, D, Hf, { strokeColor: C.d, dash: 2, visible: false });
    const tH = g.text(b, off - 0.85, 1.9, "36/5", { color: C.d, visible: false, fontSize: 14 });
    const t27 = g.text(b, off / 2, 0.45, "27/5", { visible: false, fontSize: 13 });
    const tCD = g.text(b, 7.5, h + 0.45, "21/5", { visible: false, fontSize: 13 });
    const tr1 = g.poly(b, [A, B, E], { fillColor: C.fillA, fillOpacity: 0.4, visible: false }), tr2 = g.poly(b, [Cc, D, E], { fillColor: C.fillA, fillOpacity: 0.4, visible: false });
    const EF = g.seg(b, E, [Ep[0], 0], { strokeColor: C.b, strokeWidth: 2.5, visible: false });
    stepper(g, [
      { t: "Determine a distância de E a AB." },
      { t: "Triângulo retângulo ADB: DB = 12, altura h = 9·12/15 = 36/5, pé a 9²/15 = 27/5 de A.", show: [DH, tH, t27] },
      { t: "Isosceles: CD = 15 − 2·27/5 = 21/5.", show: [tCD] },
      { t: `ABE ∼ CDE na razão 15 : 21/5 = 25 : 7; as alturas somam h: distância = (25/32)·(36/5) = <span class="ok">45/8</span>.`, show: [tr1, tr2, EF] },
    ]);
  };

  // Parallelograms — Fuvest 2020, question 16
  FIG["p-fuv20-16"] = (g, mode) => {
    const sol = SOL(mode);
    const b = g.board([-0.6, 3.4, 8.4, -0.6]);
    const a = 4.6, bb = 2.6;
    const th = sol ? { value: 30 } : g.slider("θ =", 5, 90, 0.5, 60, (v) => fmt(v, 1) + "°");
    const A = g.fixed(b, 0, 0, "", {}), B = g.fixed(b, a, 0, "", {});
    const D = g.dep(b, () => bb * Math.cos(th.value * D2R), () => bb * Math.sin(th.value * D2R), "", {});
    const Cc = g.dep(b, () => a + bb * Math.cos(th.value * D2R), () => bb * Math.sin(th.value * D2R), "", {});
    b.create("polygon", [[0, 0], [a, 0], [a, bb], [0, bb]], { fillOpacity: 0, borders: { strokeColor: C.aux, dash: 2, strokeWidth: 1.2 }, vertices: { visible: false }, highlight: false });
    g.poly(b, [A, B, Cc, D], { fillColor: C.fillA, fillOpacity: 0.4, borders: { strokeColor: C.line, strokeWidth: 4 } });
    g.angle(b, B, A, D, "", C.a, { radius: 0.6 }); bisText(g, b, B, A, D, 0.95, "θ", C.a, { fontSize: 17 });
    g.readout(() => { const S = a * bb * Math.sin(th.value * D2R), r = S / (a * bb); return sol ? 'área do paralelogramo = ab·sen θ = A·sen θ = A/2: sen θ = 1/2 e θ é o menor ângulo: <b>θ = 30°</b>.' : `área = ab·sen θ = ${fmt(r, 3)}·A ${Math.abs(r - 0.5) < 0.002 ? '<span class="ok">= A/2</span>' : ""}`; });
    if (sol) {
      const H = g.dep(b, () => xy(D)[0], () => 0, "", { visible: false });
      g.seg(b, D, H, { strokeColor: C.d, dash: 2 });
      g.text(b, () => xy(D)[0] + 0.35, () => xy(D)[1] / 2, "b/2", { color: C.d });
    }
  };

  // Rhombuses — Unicamp 2026, second phase, question 5 (Bernini's oval)
  FIG["p-uni26-5"] = (g, mode) => {
    const sol = SOL(mode);
    const b = g.board([-2.3, 1.95, 2.3, -1.95], { maxH: 380 });
    const r = 1, R = 2;   // 65 m and 130 m
    const Dp = [0, 0.5], Bp = [0, -0.5], Ap = [-Math.sqrt(3) / 2, 0], Cp = [Math.sqrt(3) / 2, 0];
    const D = g.fixed(b, ...Dp, "D", { label: { offset: [-4, 12] } }), B = g.fixed(b, ...Bp, "B", { label: { offset: [-4, -16] } });
    const A = g.fixed(b, ...Ap, "A", { label: { offset: [-16, -4] } }), Cc = g.fixed(b, ...Cp, "C", { label: { offset: [6, -4] } });
    const thin = { strokeColor: "#cbd5e1", strokeWidth: 1.2 };
    [[D, r], [B, r], [A, R], [Cc, R]].forEach(([P, rad]) => g.circ(b, P, rad, thin));
    g.poly(b, [A, B, Cc, D], { fillColor: C.fillA, fillOpacity: 0.35 });
    g.seg(b, B, D, { strokeColor: C.line, strokeWidth: 1.4 });
    // the oval: arcs EF (centre D), GH (centre B), EG (centre C), FH (centre A)
    const E = add(Dp, mul(unit(sub(Dp, Cp)), r)), F = add(Dp, mul(unit(sub(Dp, Ap)), r));
    const Gq = add(Bp, mul(unit(sub(Bp, Cp)), r)), H = add(Bp, mul(unit(sub(Bp, Ap)), r));
    const arc = (O, P, Q, col) => b.create("arc", [g.fixed(b, ...O, "", { visible: false }), g.fixed(b, ...P, "", { visible: false }), g.fixed(b, ...Q, "", { visible: false })], { strokeColor: col, strokeWidth: 3.2, highlight: false });
    arc(Dp, F, E, C.d); arc(Bp, Gq, H, C.d); arc(Cp, E, Gq, C.d); arc(Ap, H, F, C.d);
    g.text(b, -0.16, 0.22, "65", { fontSize: 13 });
    if (!sol) { g.readout(() => "Circunferências menores: centros B, D, a 65 m um do outro, cada uma passando pelo outro centro. Maiores: centros A, C. Área de ABCD? Perímetro do oval (vermelho)?"); return; }
    const pts = [E, F, Gq, H].map((p, i) => g.fixed(b, ...p, "EFGH"[i], { visible: false, size: 2.5, label: { offset: i < 2 ? [-4, 12] : [-4, -16] } }));
    const lines = [g.seg(b, Cc, pts[0], { strokeColor: C.aux, dash: 2, visible: false }), g.seg(b, A, pts[1], { strokeColor: C.aux, dash: 2, visible: false }),
      g.seg(b, Cc, pts[2], { strokeColor: C.aux, dash: 2, visible: false }), g.seg(b, A, pts[3], { strokeColor: C.aux, dash: 2, visible: false })];
    const eq1 = g.poly(b, [A, B, D], { fillColor: C.fillB, fillOpacity: 0.45, visible: false }), eq2 = g.poly(b, [Cc, B, D], { fillColor: C.fillB, fillOpacity: 0.45, visible: false });
    const a120 = [g.angle(b, pts[0], D, pts[1], "", C.c, { radius: 0.35, visible: false }), bisText(g, b, pts[0], D, pts[1], 0.55, "120°", C.c, { visible: false, fontSize: 13 })];
    const a60 = [g.angle(b, pts[0], Cc, pts[2], "", C.b, { radius: 0.45, visible: false }), bisText(g, b, pts[0], Cc, pts[2], 0.66, "60°", C.b, { visible: false, fontSize: 13 })];
    stepper(g, [
      { t: "BD = 65 = o raio das circunferências menores." },
      { t: `AB = AD = CB = CD = BD = 65: dois triângulos equiláteros, <span class="ok">[ABCD] = 2·65²√3/4 = 4225√3/2 m²</span>.`, show: [eq1, eq2] },
      { t: "A circunferência de centro C tangencia internamente a de centro D, em E na reta CD: o seu raio é 65 + 65 = 130.", show: pts.concat(lines) },
      { t: `Arcos: 120° de raio 65 (duas vezes) e 60° de raio 130 (duas vezes): 2·(1/3)·2π·65 + 2·(1/6)·2π·130 = <span class="ok">520π/3 m</span>.`, show: a120.concat(a60) },
    ]);
  };

  // Squares — Fuvest 2024, question 63 (the Pythagoras tree)
  FIG["p-fuv24-63"] = (g, mode) => {
    const sol = SOL(mode);
    const b = g.board([-3.6, 5.2, 4.6, -0.4], { maxH: 380 });
    const n = g.slider("estágios:", 1, 10, 1, sol ? 3 : 4, (v) => String(v));
    const shapes = [];
    const draw = () => {
      shapes.forEach((s) => b.removeObject(s)); shapes.length = 0;
      const rec = (p, q, k) => {   // square on the segment p → q (q to the right of p), k stages left
        const d = sub(q, p), nrm = [-d[1], d[0]];
        const r = add(q, nrm), s = add(p, nrm);
        shapes.push(b.create("polygon", [p, q, r, s], { fillColor: k === n.value ? "#c2410c" : "#15803d", fillOpacity: 0.85, borders: { strokeColor: "#fff", strokeWidth: 0.5 }, vertices: { visible: false }, highlight: false, fixed: true }));
        if (k <= 1) return;
        const m = add(mid(s, r), mul(rot(sub(r, s), Math.PI / 2), 0.5));   // apex of the isosceles right triangle
        rec(s, m, k - 1); rec(m, r, k - 1);
      };
      rec([-0.5, 0], [0.5, 0], n.value);
      if (sol && n.value >= 2) {
        const s = [-0.5, 1], r = [0.5, 1], m = [0, 1.5];
        shapes.push(b.create("polygon", [s, r, m], { fillColor: C.hl, fillOpacity: 0.9, borders: { strokeColor: C.d, strokeWidth: 2 }, vertices: { visible: false }, highlight: false, fixed: true }));
      }
    };
    draw();
    const orig = g.updateAll.bind(g);
    g.updateAll = () => { draw(); orig(); };
    g.readout(() => { const k = n.value, a = Math.pow(Math.SQRT1_2, k - 1); return `Estágio ${k}: os novos quadrados têm lado (1/√2)^${k - 1} cm` +
      (sol ? `<br>Triângulo retângulo isósceles (amarelo): hipotenusa ℓ = cateto·√2; logo, cada estágio multiplica o lado por 1/√2. (1/√2)^(n−1) < 10⁻⁴ ⟺ (n − 1)·0,15 > 4 ⟺ n − 1 > 26,7: <span class="ok">estágio 28</span>.` : ""); });
  };

  // Rectangles — ITA 2023, question 42
  FIG["p-ita23-42"] = (g, mode) => {
    const sol = SOL(mode);
    const b = g.board([-0.5, 2.0, 3.6, -0.5]);
    const s3 = Math.sqrt(3);
    const A = g.fixed(b, s3 * 1.8, 0, "A", { label: { offset: [4, -10] } }), B = g.fixed(b, 0, 0, "B", { label: { offset: [-14, -10] } }), Cc = g.fixed(b, 0, 1.8, "C", { label: { offset: [-14, 6] } });
    g.poly(b, [A, B, Cc], { fillOpacity: 0.06 });
    g.right(b, A, B, Cc, 0.12);
    g.angle(b, Cc, A, B, "", C.a, { radius: 0.5 }); bisText(g, b, Cc, A, B, 0.78, "30°", C.a, { fontSize: 13 });
    g.text(b, -0.22, 0.9, "1", {});
    const AC = g.seg(b, A, Cc, { visible: false });
    const foot = footOn([0, 0], A, Cc);
    const D = sol ? g.fixed(b, ...foot, "D", { label: { offset: [4, 6] } }) : g.glider(b, ...lerp(A, Cc, 0.35), AC, "D", { label: { offset: [4, 6] } });
    const E = g.dep(b, () => 0, () => xy(D)[1], "E", { label: { offset: [-16, 0] } });
    const F = g.dep(b, () => xy(D)[0], () => 0, "F", { label: { offset: [-4, -16] } });
    g.poly(b, [B, F, D, E], { fillColor: C.fillB, fillOpacity: 0.35 });
    g.seg(b, E, F, { strokeColor: C.d, strokeWidth: 2.4 });
    g.readout(() => sol ? `EF = BD, que é mínimo quando BD ⊥ AC: <span class="ok">EF = √3/2</span>.` : `EF = ${fmt(dist(E, F), 2)} = BD (mova D).`);
    if (sol) { g.seg(b, B, D, { strokeColor: C.c, strokeWidth: 2.4 }); g.right(b, B, D, A, 0.1); }
  };

  // Polygons — Fuvest 2023, question 88 (uniform tilings)
  FIG["p-fuv23-88"] = (g, mode) => {
    const sol = SOL(mode);
    const b = sol ? g.board([-1.25, 1.55, 2.35, -1.15], { maxH: 360 }) : g.board([-4.2, 3.2, 4.2, -3.2], { maxH: 380 });
    const col = { 3: "#2563eb", 4: "#f1f5f9", 6: "#d97706" }, R3 = Math.sqrt(3);
    const inView = (p) => Math.abs(p[0]) < 5.4 && Math.abs(p[1]) < 4.4;
    const hexAt = (c, s, a0) => [0, 1, 2, 3, 4, 5].map((i) => add(c, mul([Math.cos(a0 + i * Math.PI / 3), Math.sin(a0 + i * Math.PI / 3)], s)));
    const S1 = 0.62, H1 = S1 * R3 / 2;
    function t3464() {          // hexagons on a triangular lattice, a square on each edge, triangles in the gaps
      const s = S1, h = H1, L = (1 + R3) * s, e1 = [L, 0], e2 = [L / 2, L * R3 / 2], out = { 3: [], 4: [], 6: [] };
      for (let i = -8; i <= 8; i++) for (let j = -5; j <= 5; j++) {
        const c = add(mul(e1, i), mul(e2, j)); if (!inView(c)) continue;
        out[6].push(hexAt(c, s, Math.PI / 6));
        [0, 1, 2].forEach((k) => {
          const d = rot([1, 0], k * Math.PI / 3), n = rot(d, Math.PI / 2);
          const p = add(c, add(mul(d, h), mul(n, s / 2))), q = add(c, add(mul(d, h), mul(n, -s / 2)));
          out[4].push([q, add(q, mul(d, s)), add(p, mul(d, s)), p]);
        });
        [0, 1].forEach((k) => {
          const a = Math.PI / 6 + k * Math.PI / 3, v = add(c, mul([Math.cos(a), Math.sin(a)], s));
          out[3].push([v, add(v, rot([s, 0], k * Math.PI / 3)), add(v, rot([s, 0], (k + 1) * Math.PI / 3))]);
        });
      }
      return out;
    }
    function t3636() {          // hexagons sharing vertices, two triangles per hexagon
      const s = 0.9, e1 = [2 * s, 0], e2 = [s, s * R3], out = { 3: [], 4: [], 6: [] };
      for (let i = -8; i <= 8; i++) for (let j = -5; j <= 5; j++) {
        const c = add(mul(e1, i), mul(e2, j)); if (!inView(c)) continue;
        out[6].push(hexAt(c, s, 0));
        out[3].push([add(c, [s / 2, s * R3 / 2]), add(c, [s, 0]), add(c, [1.5 * s, s * R3 / 2])]);
        out[3].push([add(c, [s / 2, -s * R3 / 2]), add(c, [1.5 * s, -s * R3 / 2]), add(c, [s, 0])]);
      }
      return out;
    }
    // all polygons of one kind in a single filled curve (NaN starts a new piece)
    const pathOf = (list) => {
      const X = [], Y = [];
      list.forEach((P) => { P.concat([P[0]]).forEach((p) => { X.push(p[0]); Y.push(p[1]); }); X.push(NaN); Y.push(NaN); });
      return [X, Y];
    };
    const draw = (set) => [6, 4, 3].filter((k) => set[k].length).map((k) => {
      const [X, Y] = pathOf(set[k]);
      return b.create("curve", [X, Y], { fillColor: col[k], fillOpacity: k === 4 ? 1 : 0.8, strokeColor: "#334155", strokeWidth: 1, highlight: false });
    });
    const floor = draw(t3464());
    if (!sol) {
      const example = draw(t3636());
      vis(example, false);
      let which = 0;
      g.choice(["O piso do museu", "Exemplo (3.6.3.6)"], 0, (i) => { which = i; vis(floor, i === 0); vis(example, i === 1); });
      g.readout(() => which === 1
        ? "O exemplo (3.6.3.6): em torno de cada vértice, triângulo, hexágono, triângulo, hexágono — 60° + 120° + 60° + 120° = 360°."
        : "O piso do museu. Quais polígonos se encontram em cada vértice, e em que ordem?");
      return;
    }
    // one vertex of the floor and the four polygons around it
    const v = [H1, S1 / 2], d60 = [0.5, R3 / 2];
    const sq0 = [[H1, -S1 / 2], [H1 + S1, -S1 / 2], [H1 + S1, S1 / 2], v];
    const sq60 = [v, add(v, mul(d60, S1)), add([0, S1], mul(d60, S1)), [0, S1]];
    const tri = [v, add(v, [S1, 0]), add(v, mul(d60, S1))];
    const hex = hexAt([0, 0], S1, Math.PI / 6);
    const [X, Y] = pathOf([sq0, sq60, tri, hex]);
    b.create("curve", [X, Y], { strokeColor: C.d, strokeWidth: 2.6, highlight: false });
    const cen = (P) => mul(P.reduce((a, p) => add(a, p), [0, 0]), 1 / P.length);
    [[tri, "60°"], [sq60, "90°"], [hex, "120°"], [sq0, "90°"]].forEach(([P, s]) => { const c = cen(P); g.text(b, c[0], c[1], s, { fontSize: 14, color: C.ink }); });
    b.create("point", v, { size: 5, color: C.d, name: "", fixed: true, showInfobox: false, withLabel: false });
    g.readout(() => `Em torno do vértice vermelho, no sentido anti-horário a partir do triângulo: triângulo (60°), quadrado (90°), hexágono (120°), quadrado (90°). Os ângulos fecham a volta: 60 + 90 + 120 + 90 = 360. <span class="ok">(3.4.6.4)</span>`);
  };

  // Circles — Unicamp 2021, question 42
  FIG["p-uni21-42"] = (g, mode) => {
    const sol = SOL(mode);
    const b = g.board([-4.6, 4.4, 4.6, -0.8]);
    const R = 2, r = 0.5;
    b.create("line", [[0, 0], [1, 0]], { strokeColor: C.line, strokeWidth: 2, highlight: false });
    const O1 = g.fixed(b, -2, 2, "", { size: 2 }), O2 = g.fixed(b, 2, 2, "", { size: 2 }), o = g.fixed(b, 0, 0.5, "", { size: 2 });
    g.circ(b, O1, R); g.circ(b, O2, R); g.circ(b, o, r, { strokeColor: C.a });
    const Rp = g.fixed(b, 2 + R * Math.SQRT1_2, 2 + R * Math.SQRT1_2, "", { visible: false });
    g.seg(b, O2, Rp, { strokeColor: C.aux, strokeWidth: 1.5 });
    g.segText(b, O2, Rp, "R", [4, 2]);
    g.text(b, 0, 1.25, "r", { color: C.a });
    if (!sol) { g.readout(() => "Duas circunferências de raio R e uma de raio r, tangentes duas a duas e todas tangentes à reta. R/r = ?"); return; }
    const T1 = g.fixed(b, -2, 0, "", { size: 2 }), t = g.fixed(b, 0, 0, "", { size: 2 });
    const s1 = [g.seg(b, O1, T1, { strokeColor: C.b, visible: false }), g.seg(b, o, t, { strokeColor: C.b, visible: false }),
      g.right(b, O1, T1, t, 0.2, { visible: false }), g.seg(b, O1, o, { strokeColor: C.d, strokeWidth: 2.4, visible: false })];
    const Hh = g.fixed(b, -2, 0.5, "", { visible: false });
    const s2 = [g.seg(b, o, Hh, { strokeColor: C.c, dash: 2, visible: false }), g.right(b, O1, Hh, o, 0.18, { visible: false }),
      g.text(b, -2.75, 1.25, "R − r", { color: C.c, visible: false, fontSize: 13 }), g.text(b, -0.55, 1.6, "R + r", { color: C.d, visible: false, fontSize: 13 }),
      g.text(b, -0.95, 0.76, "2√(Rr)", { color: C.c, visible: false, fontSize: 13 })];
    const tR = g.text(b, 0, -0.45, "2R = 2√(Rr) + 2√(Rr)", { visible: false, color: C.d, fontSize: 14 });
    stepper(g, [
      { t: "Os raios até os pontos de tangência são perpendiculares à reta; em circunferências tangentes, a distância entre os centros é a soma dos raios." },
      { t: "Centros de uma circunferência grande (raio R) e da pequena (raio r): distância R + r.", show: s1 },
      { t: "Triângulo retângulo de hipotenusa R + r e cateto R − r: o outro cateto, ao longo da reta, é √((R + r)² − (R − r)²) = 2√(Rr).", show: s2 },
      { t: `As circunferências grandes tocam a reta a 2R uma da outra: 4√(Rr) = 2R; logo, R = 4r: <span class="ok">R/r = 4</span>.`, show: [tR] },
    ]);
  };

  // IMO 2000, Problem 1
  FIG["imo2000-1"] = (g, mode) => {
    const sol = SOL(mode);
    const b = g.board([-2.7, 1.6, 2.8, -2.7], { maxH: 520 });
    const O1 = g.fixed(b, -0.9, -1.0, "", { visible: false });
    const O2 = sol ? g.fixed(b, 1.3, -0.7, "", { visible: false }) : g.free(b, 1.3, -0.7, "", { size: 3 });
    const r1 = 1.5, r2s = sol ? { value: 1.15 } : g.slider("raio de G₂:", 0.7, 1.8, 0.01, 1.15, (v) => fmt(v));
    const r2 = () => r2s.value;
    g.circ(b, O1, r1, { strokeColor: C.b });
    b.create("circle", [O2, () => r2()], { strokeColor: C.c, strokeWidth: 2, highlight: false });
    g.text(b, -2.35, -2.2, "G₁", { color: C.b });
    g.text(b, () => xy(O2)[0] + 0.8 * r2() + 0.25, () => xy(O2)[1] - 0.8 * r2() - 0.1, "G₂", { color: C.c });
    const MN = () => {          // M (upper) and N (lower)
      const p = xy(O1), q = xy(O2), d = dist(p, q), a = (r1 * r1 - r2() * r2() + d * d) / (2 * d), h = Math.sqrt(Math.max(0, r1 * r1 - a * a));
      const u = unit(sub(q, p)), m = add(p, mul(u, a)), n = [-u[1], u[0]];
      const X = add(m, mul(n, h)), Y = add(m, mul(n, -h));
      return X[1] > Y[1] ? [X, Y] : [Y, X];
    };
    const tangent = () => {     // the common tangent on the side of M
      const p = xy(O1), q = xy(O2), d = dist(p, q), u = unit(sub(q, p)), n = [-u[1], u[0]];
      const c = (r1 - r2()) / d, s = Math.sqrt(Math.max(0, 1 - c * c));
      let nn = add(mul(u, c), mul(n, s)); if (nn[1] < 0) nn = add(mul(u, c), mul(n, -s));
      return [add(p, mul(nn, r1)), add(q, mul(nn, r2()))];
    };
    const A = g.dep(b, () => tangent()[0][0], () => tangent()[0][1], "A", { label: { offset: [-10, 12] } });
    const B = g.dep(b, () => tangent()[1][0], () => tangent()[1][1], "B", { label: { offset: [2, 12] } });
    const M = g.dep(b, () => MN()[0][0], () => MN()[0][1], "M", { label: { offset: [7, 6] } });   // between CD and the arc of G₂
    const N = g.dep(b, () => MN()[1][0], () => MN()[1][1], "N", { label: { offset: [-4, -16] } });
    b.create("line", [A, B], { strokeColor: C.line, strokeWidth: 1.6, highlight: false });
    const dirAB = () => unit(sub(xy(B), xy(A)));
    // the second point of the line through M parallel to AB on the circle (O, r)
    const far = (O, r) => () => lineCircle(xy(M), dirAB(), xy(O), r()).sort((X, Y) => dist(Y, xy(M)) - dist(X, xy(M)))[0] || xy(M);
    const fC = far(O1, () => r1), fD = far(O2, r2);
    const Cc = g.dep(b, () => fC()[0], () => fC()[1], "C", { label: { offset: [-16, 4] } });
    const D = g.dep(b, () => fD()[0], () => fD()[1], "D", { label: { offset: [6, 4] } });
    g.seg(b, Cc, D, { strokeColor: C.line, strokeWidth: 1.6 });
    const E = g.dep(b, () => meet(A, Cc, B, D)[0], () => meet(A, Cc, B, D)[1], "E", { label: { offset: [-4, 12] } });
    const P = g.dep(b, () => meet(A, N, Cc, D)[0], () => meet(A, N, Cc, D)[1], "P", { label: { offset: [-12, -16] } });
    const Q = g.dep(b, () => meet(B, N, Cc, D)[0], () => meet(B, N, Cc, D)[1], "Q", { label: { offset: [2, -16] } });
    g.seg(b, E, Cc, { strokeColor: C.aux }); g.seg(b, E, D, { strokeColor: C.aux });
    g.seg(b, A, N, { strokeColor: C.aux, dash: 1 }); g.seg(b, B, N, { strokeColor: C.aux, dash: 1 });
    g.poly(b, [E, P, Q], { fillColor: C.fillA, fillOpacity: 0.35, borders: { strokeColor: C.a, strokeWidth: 2, highlight: false } });
    if (!sol) { g.readout(() => "Arraste o centro de G₂ e mude o seu raio."); return; }
    const K = g.dep(b, () => meet(M, N, A, B)[0], () => meet(M, N, A, B)[1], "K", { visible: false, label: { offset: [-15, 10] } });
    const MNl = g.seg(b, K, N, { strokeColor: C.d, dash: 2, visible: false });
    const EM = g.seg(b, E, M, { strokeColor: C.c, strokeWidth: 2.4, visible: false });
    const tk1 = [g.ticks(b, A, K, 2, { visible: false }), g.ticks(b, K, B, 2, { visible: false })];
    const tk2 = [g.ticks(b, P, M, 1, { visible: false }), g.ticks(b, M, Q, 1, { visible: false })];
    const angs = [g.angle(b, B, A, E, "", C.b, { radius: 0.3, visible: false }), g.angle(b, M, A, B, "", C.b, { radius: 0.3, visible: false }),
      g.angle(b, E, B, A, "", C.gold, { radius: 0.3, visible: false }), g.angle(b, A, B, M, "", C.gold, { radius: 0.3, visible: false })];
    const rt = g.right(b, E, g.at(b, () => meet(E, M, A, B)), B, 0.14, { visible: false });
    stepper(g, [
      { t: "Queremos mostrar que EP = EQ." },
      { t: "A reta MN encontra AB em K: KA² = KM·KN = KB²; logo, K é o ponto médio de AB.", show: [K, MNl].concat(tk1) },
      { t: "PQ ∥ AB, e as retas NA, NK, NB cortam as duas: M é o ponto médio de PQ.", show: tk2 },
      { t: "Tangente e corda: ∠MAB = ∠ACM = ∠EAB (ângulos correspondentes). Logo, AB é bissetriz de ∠EAM; do mesmo modo, BA é bissetriz de ∠EBM.", show: angs },
      { t: `EAB ≅ MAB: E é o simétrico de M em relação a AB; logo, EM ⊥ AB ∥ PQ. EM é a mediatriz de PQ: <span class="ok">EP = EQ</span>.`, show: [EM, rt] },
    ]);
  };

  // The inradius — ITA 2021, question 45
  FIG["p-ita21-45"] = (g, mode) => {
    const sol = SOL(mode);
    const b = g.board([-1.2, 13.4, 15.2, -1.6]);
    const A = g.fixed(b, 0, 0, "A", { label: { offset: [-14, -10] } }), B = g.fixed(b, 14, 0, "B", { label: { offset: [4, -10] } });
    const Cc = g.fixed(b, 9, 12, "C", { label: { offset: [-4, 12] } });   // AC = 15, BC = 13
    g.poly(b, [A, B, Cc], { fillOpacity: 0.08 });
    g.text(b, 7, -0.8, "14", {});
    g.angle(b, B, A, Cc, "", C.a, { radius: 1.6 }); g.angle(b, Cc, B, A, "", C.b, { radius: 1.3 });
    g.text(b, 2.9, 0.6, "cos = 3/5", { fontSize: 13, color: C.a }); g.text(b, 11.3, 0.6, "cos = 5/13", { fontSize: 13, color: C.b });
    if (!sol) { g.readout(() => "AB = 14, cos A = 3/5, cos B = 5/13. O raio da circunferência inscrita = ?"); return; }
    const t13 = g.segText(b, B, Cc, "13", A, { visible: false, color: C.d, off: 0.75 }), t15 = g.segText(b, A, Cc, "15", B, { visible: false, color: C.d, off: 0.75 });
    const Hh = g.fixed(b, 9, 0, "", { visible: false });
    const CH = [g.seg(b, Cc, Hh, { strokeColor: C.aux, dash: 2, visible: false }), g.text(b, 9.6, 9.6, "12", { visible: false, color: C.aux }),
      g.right(b, Cc, Hh, B, 0.5, { visible: false })];
    const I = g.fixed(b, 8, 4, "", { visible: false });
    const ci = g.circ(b, I, 4, { strokeColor: C.b, fillColor: C.fillB, fillOpacity: 0.25, visible: false });
    const rr = g.seg(b, I, [8, 0], { strokeColor: C.b, strokeWidth: 2, visible: false }), tr = g.text(b, 7.6, 2, "r", { visible: false, color: C.b });
    stepper(g, [
      { t: "sen A = 4/5, sen B = 12/13 e sen C = sen(A + B) = 4/5·5/13 + 3/5·12/13 = 56/65." },
      { t: "Lei dos senos: 2R = 14/(56/65) = 65/4; logo, BC = 2R·sen A = 13 e AC = 2R·sen B = 15.", show: [t13, t15] },
      { t: "Lados 13, 14, 15: p = 21, e a altura relativa a AB é 12; logo, S = 14·12/2 = 84.", show: CH },
      { t: `<span class="ok">r = S/p = 84/21 = 4</span>.`, show: [ci, rr, tr] },
    ]);
  };

  // IMO 1964, Problem 3
  FIG["imo1964-3"] = (g, mode) => {
    const sol = SOL(mode);
    const b = g.board([-0.6, 5.2, 7.8, -0.6]);
    const A = g.free(b, 1.6, 4.6, "A", { label: { offset: [-4, 12] } }), B = g.fixed(b, 0, 0, "B", { label: { offset: [-14, -10] } });
    const Cc = g.free(b, 7.2, 0, "C", { label: { offset: [4, -10] } });
    g.poly(b, [A, B, Cc], { fillOpacity: 0.05 });
    const I = () => incircle(A, B, Cc);
    b.create("circle", [g.at(b, () => I()[0]), () => I()[1]], { strokeColor: C.b, strokeWidth: 2, fillColor: C.fillB, fillOpacity: 0.2, highlight: false });
    const per = () => dist(A, B) + dist(B, Cc) + dist(Cc, A);
    // the corner triangle at V (opposite side XY): V + k(X − V), k = (p − a)/p
    const corner = (V, X, Y, col) => {
      const k = () => { const p = per() / 2; return (p - dist(X, Y)) / p; };
      const P1 = g.at(b, () => lerp(V, X, k())), P2 = g.at(b, () => lerp(V, Y, k()));
      g.poly(b, [V, P1, P2], { fillColor: col, fillOpacity: 0.15, borders: { strokeColor: col, strokeWidth: 1.5, highlight: false } });
      b.create("line", [P1, P2], { strokeColor: col, strokeWidth: 1, dash: 2, highlight: false });
      const ci = () => incircle(V, P1, P2);
      b.create("circle", [g.at(b, () => ci()[0]), () => ci()[1]], { strokeColor: col, strokeWidth: 1.8, fillColor: col, fillOpacity: 0.25, highlight: false });
      return () => ci()[1];
    };
    const ra = corner(A, B, Cc, C.a), rb = corner(B, Cc, A, C.c), rc = corner(Cc, A, B, C.d);
    g.readout(() => sol
      ? `O triângulo do canto A tem perímetro 2(p − a) (tangentes iguais); logo, é ABC reduzido na razão (p − a)/p, assim como a sua circunferência inscrita.` +
        `<br>Soma das áreas = πr²·[(p − a)² + (p − b)² + (p − c)² + p²]/p² = <span class="ok">π(a² + b² + c²)(b + c − a)(c + a − b)(a + b − c)/(a + b + c)³</span>.`
      : "Arraste A e C.");
  };

  // Cyclic quadrilaterals — ITA 2022, second phase, question 8
  FIG["p-ita22-8"] = (g, mode) => {
    const sol = SOL(mode);
    const b = g.board([-5.0, 4.9, 5.0, -4.7], { maxH: 380 });
    const h = 5 * Math.sqrt(3) / 2, r = 7 * Math.sqrt(3) / 3, yA = -Math.sqrt(r * r - 16);
    const A = g.fixed(b, -4, yA, "A", { label: { offset: [-16, -10] } }), D = g.fixed(b, 4, yA, "D", { label: { offset: [6, -10] } });
    const B = g.fixed(b, -1.5, yA + h, "B", { label: { offset: [-16, 8] } }), Cc = g.fixed(b, 1.5, yA + h, "C", { label: { offset: [6, 8] } });
    const O = g.fixed(b, 0, 0, "", { size: 2 });
    g.circ(b, O, r, { strokeColor: C.aux });
    g.poly(b, [A, B, Cc, D], { fillOpacity: 0.1 });
    g.segText(b, A, B, "5", Cc); g.segText(b, B, Cc, "3", [0, 9]); g.segText(b, Cc, D, "5", B);   // 3 goes below BC, away from the circle g.segText(b, D, A, "8", B);
    if (!sol) { g.readout(() => "AB = CD = 5, BC = 3, DA = 8, inscrito em uma circunferência de raio r. r = ?"); return; }
    const BD = g.seg(b, B, D, { strokeColor: C.b, strokeWidth: 2.4, visible: false }), t7 = g.segText(b, B, D, "7", A, { visible: false, color: C.b });
    const s0 = [BD, g.angle(b, A, D, B, "", C.c, { radius: 0.9, visible: false }), g.angle(b, Cc, B, D, "", C.c, { radius: 0.9, visible: false })];
    const Hb = g.fixed(b, -1.5, yA, "", { visible: false });
    const s1 = [g.seg(b, B, Hb, { strokeColor: C.d, dash: 2, visible: false }), g.right(b, B, Hb, A, 0.3, { visible: false }),
      g.text(b, -2.75, yA - 0.38, "5/2", { visible: false, color: C.d, fontSize: 13 }),
      g.angle(b, D, A, B, "", C.a, { radius: 0.7, visible: false }), bisText(g, b, D, A, B, 1.15, "60°", C.a, { visible: false, fontSize: 13 })];
    const rad = g.seg(b, O, A, { strokeColor: C.c, strokeWidth: 2, visible: false }), tr = g.segText(b, O, A, "r", [-2, -3], { visible: false, color: C.c, off: 0.38 });
    stepper(g, [
      { t: "AB = CD = 5, BC = 3, DA = 8, inscrito em uma circunferência de raio r." },
      { t: "Cordas iguais AB = CD: ∠ADB = ∠CBD, ângulos alternos; logo, BC ∥ AD — um trapézio isósceles.", show: s0 },
      { t: "As alturas recortam (8 − 3)/2 = 5/2 de cada extremidade: cos A = (5/2)/5 = 1/2, A = 60°.", show: s1 },
      { t: "Lei dos cossenos em ABD: BD² = 25 + 64 − 40 = 49, BD = 7.", show: [t7] },
      { t: `Lei dos senos em ABD (mesma circunferência): 2r = 7/sen 60°, <span class="ok">r = 7√3/3</span>.`, show: [rad, tr] },
    ]);
  };

  // IMO 1985, Problem 1
  FIG["imo1985-1"] = (g, mode) => {
    const sol = SOL(mode);
    const b = g.board([-3.3, 2.1, 3.3, -0.9]);
    const O = g.fixed(b, 0, 0, "O", { size: 2, label: { offset: [-4, -16] } });
    b.create("line", [[0, 0], [1, 0]], { strokeColor: "#cbd5e1", strokeWidth: 1, dash: 2, highlight: false });
    g.circ(b, O, 1, { strokeColor: C.b, fillColor: C.fillB, fillOpacity: 0.15 });
    // angles A and B; the circle (radius 1) touches DA at 90° + A and CB at 90° − B,
    // and ABCD is cyclic exactly when it touches DC at 90° + A − B
    const sA = sol ? { value: 35 } : g.slider("ângulo A:", 22, 68, 0.5, 38, (v) => fmt(v, 1) + "°");
    const sB = sol ? { value: 50 } : g.slider("ângulo B:", 22, 68, 0.5, 52, (v) => fmt(v, 1) + "°");
    const T1 = () => 90 + sA.value, T3 = () => 90 - sB.value;
    const tang = (a) => [Math.cos(a * D2R), Math.sin(a * D2R)];
    const inter = (u, v) => { const det = u[0] * v[1] - u[1] * v[0]; return [(v[1] - u[1]) / det, (u[0] - v[0]) / det]; };   // X·u = X·v = 1
    const Q = () => {
      const u1 = tang(T1()), u3 = tang(T3()), u2 = tang(T1() + T3() - 90);
      return { A: [1 / u1[0], 0], B: [1 / u3[0], 0], D: inter(u1, u2), C: inter(u2, u3) };
    };
    const A = g.dep(b, () => Q().A[0], () => 0, "A", { label: { offset: [-14, -12] } }), B = g.dep(b, () => Q().B[0], () => 0, "B", { label: { offset: [4, -12] } });
    const Cc = g.dep(b, () => Q().C[0], () => Q().C[1], "C", { label: { offset: [6, 6] } }), D = g.dep(b, () => Q().D[0], () => Q().D[1], "D", { label: { offset: [-16, 6] } });
    g.poly(b, [A, B, Cc, D], { fillOpacity: 0.06 });
    const cc = () => circum(A, B, Cc);
    b.create("circle", [g.at(b, () => cc()[0]), () => cc()[1]], { strokeColor: "#cbd5e1", strokeWidth: 1.5, highlight: false });
    if (!sol) { g.readout(() => "Escolha os ângulos A e B; DC é então a tangente que torna ABCD inscritível (circunferência cinza)."); return; }
    const Gp = g.dep(b, () => tang(T1())[0], () => tang(T1())[1], "G", { size: 2, visible: false, label: { offset: [-16, 4] } });
    const Ep = g.dep(b, () => tang(T3())[0], () => tang(T3())[1], "E", { size: 2, visible: false, label: { offset: [6, 2] } });
    const s1 = [Gp, Ep, g.seg(b, O, Gp, { strokeColor: C.a, visible: false }), g.seg(b, O, Ep, { strokeColor: C.c, visible: false }),
      g.right(b, O, Gp, D, 0.13, { visible: false }), g.right(b, O, Ep, Cc, 0.13, { visible: false }),
      g.angle(b, B, A, D, "", C.a, { radius: 0.45, visible: false }), g.angle(b, Cc, B, A, "", C.c, { radius: 0.45, visible: false })];
    const s2 = [g.seg(b, O, D, { strokeColor: C.aux, dash: 2, visible: false }), g.seg(b, O, Cc, { strokeColor: C.aux, dash: 2, visible: false })];
    stepper(g, [
      { t: "Queremos mostrar que AD + BC = AB." },
      { t: "Tangente ⊥ raio. Em AGO: AO = r/sen A, AG = r·cotg A. Em BEO: OB = r/sen B, BE = r·cotg B.", show: s1 },
      { t: "DO e CO são bissetrizes dos ângulos D e C: DG = r·cotg(D/2) = r·tg(B/2) e CE = r·cotg(C/2) = r·tg(A/2), pois C = 180° − A e D = 180° − B.", show: s2 },
      { t: `cotg x + tg(x/2) = 1/sen x; logo, AD + BC = r/sen A + r/sen B = AO + OB = <span class="ok">AB</span>.` },
    ]);
  };

  // Areas of circles — Fuvest 2023, question 89
  FIG["p-fuv23-89"] = (g, mode) => {
    const sol = SOL(mode);
    const b = g.board([-2.3, 1.5, 1.5, -1.5]);
    b.create("axis", [[0, 0], [1, 0]], { ticks: { visible: false }, strokeColor: C.aux, highlight: false });
    b.create("axis", [[0, 0], [0, 1]], { ticks: { visible: false }, strokeColor: C.aux, highlight: false });
    const sqv = [[1, 0], [0, 1], [-1, 0], [0, -1]];
    g.poly(b, sqv.map((p) => g.fixed(b, p[0], p[1], "", { visible: false })), { fillColor: C.fillA, fillOpacity: 0.55 });
    const Oc = g.fixed(b, -1, 0, "", { size: 2.5 });
    g.circ(b, Oc, 1, { strokeColor: C.b, strokeWidth: 2 });
    // the part of the square inside the circle: a quarter of the disc
    const k = Math.SQRT1_2;
    b.create("sector", [Oc, g.fixed(b, -1 + k, -k, "", { visible: false }), g.fixed(b, -1 + k, k, "", { visible: false })],
      { fillColor: sol ? C.fillB : "#ffffff", fillOpacity: sol ? 0.75 : 1, strokeColor: C.b, strokeWidth: sol ? 1.5 : 0, highlight: false });
    g.text(b, 1.12, -0.13, "1", { fontSize: 13 }); g.text(b, -1.0, -0.18, "−1", { fontSize: 13 }); g.text(b, 0.12, 1.1, "1", { fontSize: 13 });
    if (sol) { g.right(b, [0, 1], [-1, 0], [0, -1], 0.16); g.text(b, -0.55, 0, "π/4", { fontSize: 14, color: C.b }); }
    g.readout(() => sol
      ? `O quadrado tem área 2. A circunferência tem centro no vértice (−1, 0) e raio 1; os lados nesse vértice são perpendiculares; logo, a parte do quadrado dentro da circunferência é um quarto de círculo, π/4. <span class="ok">Área = 2 − π/4</span>.`
      : "A: |x| + |y| ≤ 1. B: exterior da circunferência (x + 1)² + y² = 1. A área de A ∩ B (laranja) = ?");
  };
})();

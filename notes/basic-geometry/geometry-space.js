/*
  Interactive 3D figures for the spatial-geometry section of the note
  "Basic geometry: a comprehensive viewpoint", drawn with three.js (https://threejs.org).

  Each figure is a <div class="geo-fig" data-fig="NAME"></div> in index.qmd; FIG3[NAME] below
  builds it. Drag to turn the picture; zoom with the +/- buttons, a pinch, or Shift + scroll.
  The controls, readouts and the Reset button come from geometry-plane.js (window.GeoPlane).
*/
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.185.1/build/three.module.js";

const C = {
  ink: 0x1c1f26, line: 0x334155, aux: 0x94a3b8, pt: 0x1d4ed8,
  a: 0xea580c, b: 0x15803d, c: 0x7c3aed, d: 0xbe123c, gold: 0xca8a04,
  face: 0x93c5fd, faceA: 0xfdba74, faceB: 0x86efac, faceC: 0xc4b5fd, hl: 0xfde68a,
};
const D2R = Math.PI / 180;
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const FIG3 = {};
const fmt = (x, d = 2) => (Math.abs(x) < 5e-13 ? 0 : x).toFixed(d).replace(".", ",");   // decimal comma

// ------------------------------------------------------------------ the 3D view
class View {
  constructor(ctx, opt = {}) {
    this.opt = Object.assign({ aspect: 1.45, maxH: 430, theta: -55, phi: 24, r: 9, target: [0, 0, 0] }, opt);
    const wrap = document.createElement("div");
    wrap.style.maxWidth = Math.round(this.opt.maxH * this.opt.aspect) + "px";
    wrap.style.justifySelf = "center";
    wrap.style.width = "100%";
    const div = document.createElement("div");
    div.className = "geo-3d";
    div.style.aspectRatio = String(this.opt.aspect);
    wrap.appendChild(div);
    ctx.grid.appendChild(wrap);
    this.div = div;
    this.makeRenderer();
    this.labels = document.createElement("div");
    div.appendChild(this.labels);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(32, this.opt.aspect, 0.1, 200);
    this.camera.up.set(0, 0, 1);
    this.scene.add(new THREE.AmbientLight(0xffffff, 1.6));
    this.light = new THREE.DirectionalLight(0xffffff, 1.5);
    this.scene.add(this.light);
    this.root = new THREE.Group();
    this.scene.add(this.root);
    this.lbls = [];
    this.reset();
    this.zoomButtons();
    const ro = new ResizeObserver(() => this.resize());
    ro.observe(div);
    this.resize();
  }
  // Browsers allow only a few WebGL contexts per page: a figure far from the screen (or in a
  // collapsed callout) gives its context back with sleep() and takes a new one with wake().
  makeRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setClearColor(0xffffff, 1);
    this.div.insertBefore(this.renderer.domElement, this.div.firstChild);
    this.controls();
  }
  sleep() {
    if (!this.renderer) return;
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.renderer.domElement.remove();
    this.renderer = null;
  }
  wake() {
    if (this.renderer) return;
    this.makeRenderer();
    this.resize();
  }
  reset() {
    this.theta = this.opt.theta * D2R; this.phi = this.opt.phi * D2R; this.r = this.opt.r;
    this.target = V3(...this.opt.target);
    this.dirty();
  }
  resize() {
    const w = this.div.clientWidth, h = this.div.clientHeight;
    if (!w || !h || !this.renderer) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.dirty();
  }
  dirty() {
    if (this._raf) return;
    this._raf = requestAnimationFrame(() => { this._raf = 0; this.render(); });
  }
  render() {
    if (!this.renderer) return;
    const cp = Math.cos(this.phi);
    const pos = V3(cp * Math.cos(this.theta), cp * Math.sin(this.theta), Math.sin(this.phi)).multiplyScalar(this.r).add(this.target);
    this.camera.position.copy(pos);
    this.camera.lookAt(this.target);
    this.light.position.copy(pos).add(V3(0, 0, 3));
    this.renderer.render(this.scene, this.camera);
    const w = this.div.clientWidth, h = this.div.clientHeight;
    for (const L of this.lbls) {
      const p = (typeof L.pos === "function" ? L.pos() : L.pos);
      if (!p || L.hidden) { L.el.style.display = "none"; continue; }
      const v = p.clone().project(this.camera);
      L.el.style.display = v.z < 1 ? "" : "none";
      L.el.style.left = ((v.x + 1) / 2 * w) + "px";
      L.el.style.top = ((1 - v.y) / 2 * h) + "px";
      const t = typeof L.text === "function" ? L.text() : L.text;
      if (L.el.textContent !== t) L.el.textContent = t;
    }
  }
  controls() {
    const el = this.renderer.domElement, pts = new Map();
    let pinch0 = 0, r0 = 0;
    el.addEventListener("pointerdown", (e) => { el.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]); });
    el.addEventListener("pointermove", (e) => {
      if (!pts.has(e.pointerId)) return;
      const [x0, y0] = pts.get(e.pointerId);
      pts.set(e.pointerId, [e.clientX, e.clientY]);
      if (pts.size === 1) {
        this.theta -= (e.clientX - x0) * 0.008;
        this.phi = Math.max(-1.45, Math.min(1.45, this.phi + (e.clientY - y0) * 0.008));
      } else if (pts.size === 2) {
        const [[ax, ay], [bx, by]] = [...pts.values()], d = Math.hypot(ax - bx, ay - by);
        if (!pinch0) { pinch0 = d; r0 = this.r; }
        this.r = Math.max(2, Math.min(40, r0 * pinch0 / d));
      }
      this.dirty();
    });
    const end = (e) => { pts.delete(e.pointerId); if (pts.size < 2) pinch0 = 0; };
    el.addEventListener("pointerup", end);
    el.addEventListener("pointercancel", end);
    el.addEventListener("wheel", (e) => {
      if (!e.shiftKey) return;            // plain scrolling keeps scrolling the page
      e.preventDefault();
      this.r = Math.max(2, Math.min(40, this.r * Math.exp((e.deltaY || e.deltaX) * 0.0015)));
      this.dirty();
    }, { passive: false });
  }
  zoomButtons() {
    const z = document.createElement("div");
    z.className = "zoom";
    const mk = (t, f, title) => { const b = document.createElement("button"); b.type = "button"; b.textContent = t; b.title = title; b.addEventListener("click", f); z.appendChild(b); };
    mk("−", () => { this.r = Math.min(40, this.r * 1.2); this.dirty(); }, "Afastar");
    mk("+", () => { this.r = Math.max(2, this.r / 1.2); this.dirty(); }, "Aproximar");
    mk("⟲", () => this.reset(), "Vista inicial");
    this.div.appendChild(z);
  }
  // ---- labels
  label(pos, text, color = "#1c1f26", size = 15) {
    const el = document.createElement("div");
    el.className = "lbl";
    el.style.color = color;
    el.style.fontSize = size + "px";
    this.labels.appendChild(el);
    const L = { pos, text, el, hidden: false };
    this.lbls.push(L);
    this.dirty();
    return L;
  }
  clearLabels() { this.lbls.forEach((L) => L.el.remove()); this.lbls = []; }
  free() {
    this.root.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
    this.sleep();
  }
}

// ------------------------------------------------------------------ geometry helpers
const vec = (p) => (p.isVector3 ? p : V3(...p));
function rod(a, b, color = C.line, radius = 0.025) {
  a = vec(a); b = vec(b);
  const d = b.clone().sub(a), L = d.length();
  const m = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, L, 10, 1),
    new THREE.MeshLambertMaterial({ color }));
  m.position.copy(a.clone().add(b).multiplyScalar(0.5));
  m.quaternion.setFromUnitVectors(V3(0, 1, 0), d.normalize());
  return m;
}
function lines(points, color = C.aux, dashed = false, width = 1) {
  const g = new THREE.BufferGeometry().setFromPoints(points.map(vec));
  const mat = dashed ? new THREE.LineDashedMaterial({ color, dashSize: 0.12, gapSize: 0.08, linewidth: width })
    : new THREE.LineBasicMaterial({ color, linewidth: width });
  const l = new THREE.Line(g, mat);
  if (dashed) l.computeLineDistances();
  return l;
}
function face(points, color = C.face, opacity = 0.35) {   // a convex planar polygon
  const P = points.map(vec), pos = [];
  for (let i = 1; i < P.length - 1; i++) pos.push(...P[0].toArray(), ...P[i].toArray(), ...P[i + 1].toArray());
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false }));
}
function dot(p, color = C.ink, r = 0.06) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), new THREE.MeshLambertMaterial({ color }));
  m.position.copy(vec(p));
  return m;
}
function rightMark(O, u, v, s = 0.22, color = C.line) {   // small square at O in the plane of u, v
  O = vec(O); u = vec(u).clone().normalize().multiplyScalar(s); v = vec(v).clone().normalize().multiplyScalar(s);
  return lines([O.clone().add(u), O.clone().add(u).add(v), O.clone().add(v)], color);
}
function arcMark(O, u, v, r = 0.45, color = C.a, fill = true) {   // the angle between u and v at O
  O = vec(O); u = vec(u).clone().normalize(); v = vec(v).clone().normalize();
  const ang = u.angleTo(v), w = v.clone().sub(u.clone().multiplyScalar(u.dot(v))).normalize();
  const pts = [];
  for (let i = 0; i <= 24; i++) {
    const t = ang * i / 24;
    pts.push(O.clone().add(u.clone().multiplyScalar(r * Math.cos(t))).add(w.clone().multiplyScalar(r * Math.sin(t))));
  }
  const g = new THREE.Group();
  g.add(lines(pts, color));
  if (fill) g.add(face([O, ...pts], color, 0.3));
  return g;
}
function surface(f, nu, nv, color = C.face, opacity = 0.45, lambert = true) {   // f(u, v) in [0,1]^2 -> [x, y, z]
  const pos = [], idx = [];
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) pos.push(...f(i / nu, j / nv));
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
    const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1;
    idx.push(a, b, d, a, d, c);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  const mat = lambert ? new THREE.MeshLambertMaterial({ color, transparent: opacity < 1, opacity, side: THREE.DoubleSide, depthWrite: opacity >= 1 })
    : new THREE.MeshBasicMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false });
  return new THREE.Mesh(g, mat);
}
function circle3(center, n1, n2, r, color = C.line, k = 64) {   // circle spanned by unit vectors n1, n2
  const pts = [];
  for (let i = 0; i <= k; i++) {
    const t = 2 * Math.PI * i / k;
    pts.push(vec(center).clone().add(vec(n1).clone().multiplyScalar(r * Math.cos(t))).add(vec(n2).clone().multiplyScalar(r * Math.sin(t))));
  }
  return lines(pts, color);
}
function disc(center, r, color = C.faceA, opacity = 0.35, k = 64) {   // horizontal disc
  const c = vec(center), pts = [];
  for (let i = 0; i < k; i++) pts.push(V3(c.x + r * Math.cos(2 * Math.PI * i / k), c.y + r * Math.sin(2 * Math.PI * i / k), c.z));
  return face([c, ...pts, pts[0]], color, opacity);
}
function boxEdges(P, pairs, color = C.line, r = 0.018) {
  const g = new THREE.Group();
  pairs.forEach(([i, j]) => g.add(rod(P[i], P[j], color, r)));
  return g;
}
function clear(group) {
  group.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
  group.clear();
}

// ------------------------------------------------------------------ mounting
function build(el) {
  const { Ctx } = window.GeoPlane;
  let views = [];
  const rebuild = () => {
    views.forEach((v) => { v.clearLabels(); v.free(); });
    const ctx = new Ctx(el);
    views = [];
    ctx.view = (opt) => { const v = new View(ctx, opt); views.push(v); return v; };
    const redraw = FIG3[el.dataset.fig](ctx, el.dataset.mode || "") || (() => {});
    // sliders and buttons call updateAll(); redraw the 3D pictures then
    const upd = ctx.updateAll.bind(ctx);
    ctx.updateAll = () => { redraw(); views.forEach((v) => v.dirty()); upd(); };
    ctx.finish(() => rebuild(), "Arraste para girar a figura. Amplie com os botões − / +, com o movimento de pinça ou com Shift + rolagem; ⟲ volta à vista inicial.");
  };
  rebuild();
  new IntersectionObserver((entries) => entries.forEach((e) => views.forEach((v) => (e.isIntersecting ? v.wake() : v.sleep()))),
    { rootMargin: "500px" }).observe(el);
}
function start() {
  if (!window.GeoPlane) return;
  const plane = window.GeoPlane.FIG;
  // FIG3 is looked up when a figure comes into view, so that other modules (problems-space.js)
  // can still add figures after this one has run
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting || !FIG3[e.target.dataset.fig]) return;
      io.unobserve(e.target);
      build(e.target);
    });
  }, { rootMargin: "300px" });
  document.querySelectorAll(".geo-fig[data-fig]").forEach((el) => { if (!plane[el.dataset.fig]) io.observe(el); });
}
window.GeoSpace = { THREE, FIG3, C, D2R, V3, fmt, vec, rod, lines, face, dot, rightMark, arcMark, surface, circle3, disc, boxEdges, clear };

// =================================================================================
//                                   THE FIGURES
// =================================================================================

// 32. A line perpendicular to two concurrent lines of a plane is perpendicular to the plane.
FIG3["perp-plane"] = (g) => {
  // seen from an azimuth away from the directions of r, s and u, so that none of them is foreshortened onto t
  const v = g.view({ theta: -28, phi: 22, r: 8.5, target: [0, 0, 0.45] });
  const phi = g.slider("direção de u no plano:", 0, 180, 1, 60, (x) => x + "°");
  const S = 2.3;
  v.root.add(face([[-S, -S, 0], [S, -S, 0], [S, S, 0], [-S, S, 0]], C.face, 0.3));
  v.root.add(lines([[-S, -S, 0], [S, -S, 0], [S, S, 0], [-S, S, 0], [-S, -S, 0]], C.aux));
  const dr = V3(1, 0.25, 0).normalize(), ds = V3(-0.35, 1, 0).normalize();
  v.root.add(rod(dr.clone().multiplyScalar(-2.1), dr.clone().multiplyScalar(2.1), C.b, 0.03));
  v.root.add(rod(ds.clone().multiplyScalar(-2.1), ds.clone().multiplyScalar(2.1), C.c, 0.03));
  v.root.add(rod([0, 0, -1.4], [0, 0, 2.6], C.d, 0.035));
  v.root.add(dot([0, 0, 0], C.ink, 0.07));
  v.root.add(rightMark([0, 0, 0], dr, [0, 0, 1]), rightMark([0, 0, 0], ds, [0, 0, 1]));
  const dyn = new THREE.Group();
  v.root.add(dyn);
  v.label(dr.clone().multiplyScalar(2.35), "r", "#15803d", 17);
  v.label(ds.clone().multiplyScalar(2.35), "s", "#7c3aed", 17);
  v.label(V3(0.2, 0.2, 2.4), "t", "#be123c", 17);
  v.label(V3(-S + 0.35, S - 0.3, 0), "α", "#1d4ed8", 18);
  v.label(V3(-0.18, -0.18, -0.15), "O", "#1c1f26", 14);
  const uL = v.label(() => V3(Math.cos(phi.value * D2R), Math.sin(phi.value * D2R), 0).multiplyScalar(2.35), "u", "#ea580c", 17);
  const redraw = () => {
    clear(dyn);
    const du = V3(Math.cos(phi.value * D2R), Math.sin(phi.value * D2R), 0);
    dyn.add(rod(du.clone().multiplyScalar(-2.1), du.clone().multiplyScalar(2.1), C.a, 0.025));
    dyn.add(rightMark([0, 0, 0], du, [0, 0, 1], 0.3, C.a));
  };
  redraw();
  g.readout(() => `t ⊥ r e t ⊥ s, duas retas concorrentes de α por O &nbsp;⇒&nbsp; <span class="ok">t ⊥ α</span>.` +
    `<br>Reciprocamente, t é perpendicular a toda reta de α que passa por O: aqui t ⊥ u, com u a ${phi.value}°.`);
  return redraw;
};

// 32. Example in the cube: t ⊥ plane (ECBD) and BE lies in that plane, so t ⊥ BE.
FIG3["cube-perp"] = (g) => {
  const v = g.view({ theta: -38, phi: 20, r: 10, target: [1.1, 1, 0.9] });
  const phi = g.slider("uma reta da face por B:", 0, 90, 1, 45, (x) => x + "°");
  const P = [[0, 0, 0], [2, 0, 0], [2, 2, 0], [0, 2, 0], [0, 0, 2], [2, 0, 2], [2, 2, 2], [0, 2, 2]].map((p) => V3(...p));
  v.root.add(boxEdges(P, [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]], C.aux, 0.012));
  const [A, B, D, , , Cc, E] = P;     // B = (2,0,0), C = (2,0,2), E = (2,2,2), D = (2,2,0)
  v.root.add(face([B, Cc, E, D], C.faceB, 0.35));
  v.root.add(rod([-1.2, 0, 0], [3.4, 0, 0], C.d, 0.03));
  v.root.add(rod(B, E, C.c, 0.035));
  v.root.add(rod(B, Cc, C.line, 0.02), rod(B, D, C.line, 0.02));
  v.root.add(rightMark(B, [-1, 0, 0], E.clone().sub(B), 0.3, C.c));
  v.root.add(rightMark(B, [-1, 0, 0], [0, 0, 1], 0.2), rightMark(B, [-1, 0, 0], [0, 1, 0], 0.2));
  // A and B lie on t: their names go below the line, clear of it and of the right-angle marks
  [[A, "A", [0, -0.25, -0.32]], [B, "B", [0.05, -0.25, -0.32]], [Cc, "C", [0.12, -0.18, 0.15]], [D, "D", [0.12, -0.18, 0.15]], [E, "E", [0.12, -0.18, 0.15]]]
    .forEach(([p, s, o]) => { v.root.add(dot(p, C.ink, 0.05)); v.label(p.clone().add(V3(...o)), s); });
  v.label(V3(-1.25, 0, 0.18), "t", "#be123c", 17);
  const dyn = new THREE.Group();
  v.root.add(dyn);
  const redraw = () => {
    clear(dyn);
    const f = phi.value * D2R, d = V3(0, Math.sin(f), Math.cos(f));
    const s = Math.min(2 / Math.max(d.y, 1e-6), 2 / Math.max(d.z, 1e-6));
    dyn.add(rod(B, B.clone().add(d.multiplyScalar(s)), C.a, 0.022));
    dyn.add(rightMark(B, [-1, 0, 0], V3(0, Math.sin(f), Math.cos(f)), 0.42, C.a));
  };
  redraw();
  g.readout(() => `t ⊥ BC e t ⊥ BD (duas retas concorrentes da face) &nbsp;⇒&nbsp; t ⊥ plano (ECBD); BE está nesse plano; logo, ` +
    `<span class="ok">t ⊥ BE</span>. O mesmo vale para toda reta da face que passa por B (laranja, a ${phi.value}° de BC).`);
  return redraw;
};

// 33. Prisms: two parallel congruent bases. A dumpster is a prism with base ABCD and height CC'.
FIG3["prism"] = (g) => {
  const v = g.view({ theta: -50, phi: 16, r: 9.5, target: [0, 1.3, 0.55] });
  const L = 2.6, fill = g.slider("encha a caçamba:", 0, 1, 0.01, 0, (x) => Math.round(100 * x) + "%");
  const A = V3(-1.4, 0, 1.2), B = V3(1.4, 0, 1.2), Cc = V3(0.8, 0, 0), D = V3(-0.8, 0, 0);
  const sh = (p) => p.clone().add(V3(0, L, 0));
  const [A1, B1, C1, D1] = [A, B, Cc, D].map(sh);
  v.root.add(face([A, B, Cc, D], C.faceA, 0.5), face([A1, B1, C1, D1], C.faceA, 0.5));
  v.root.add(face([D, Cc, C1, D1], C.face, 0.25), face([A, D, D1, A1], C.face, 0.25), face([B, Cc, C1, B1], C.face, 0.25));
  v.root.add(boxEdges([A, B, Cc, D, A1, B1, C1, D1], [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [3, 7]], C.line, 0.018));
  v.root.add(rod(Cc, C1, C.d, 0.035));
  [[A, "A"], [B, "B"], [Cc, "C"], [D, "D"], [A1, "A′"], [B1, "B′"], [C1, "C′"], [D1, "D′"]].forEach(([p, s]) =>
    v.label(p.clone().add(V3(p.x > 0 ? 0.2 : -0.2, 0, p.z > 0.5 ? 0.18 : -0.18)), s));
  v.label(Cc.clone().add(C1).multiplyScalar(0.5).add(V3(0.25, 0, -0.18)), "altura CC′", "#be123c", 13);
  const dyn = new THREE.Group();
  v.root.add(dyn);
  const area = (2.8 + 1.6) / 2 * 1.2;
  const redraw = () => {
    clear(dyn);
    const y = fill.value * L;
    if (y > 1e-3) {
      const s = (p) => p.clone().add(V3(0, y, 0));
      dyn.add(face([A, B, Cc, D].map(s), C.faceA, 0.7));
      dyn.add(face([D, Cc, s(Cc), s(D)], C.faceA, 0.45), face([A, D, s(D), s(A)], C.faceA, 0.45),
        face([B, Cc, s(Cc), s(B)], C.faceA, 0.45), face([A, B, s(B), s(A)], C.faceA, 0.3));
    }
  };
  redraw();
  g.readout(() => `Bases: os trapézios ABCD e A′B′C′D′, paralelos e congruentes. Área(ABCD) = (2,8 + 1,6)/2 · 1,2 = ${fmt(area, 2)}, CC′ = ${fmt(L, 1)}.` +
    `<br><span class="ok">Volume = Área(ABCD) · CC′ = ${fmt(area * L, 2)}</span>; cheio até agora: Área(ABCD) · ${fmt(fill.value * L, 2)} = ${fmt(area * fill.value * L, 2)}.`);
  return redraw;
};

// 34. Look for right angles in solids.
FIG3["right-angles-3d"] = (g) => {
  const v = g.view({ theta: -55, phi: 20, r: 10.5, target: [0, 0, 1] });
  let which = 0;
  g.choice(["Cubo", "Pirâmide", "Cone", "Cilindro", "Esfera"], 0, (i) => { which = i; });
  const dyn = new THREE.Group();
  v.root.add(dyn);
  const texts = [
    "No cubo, todo ângulo entre arestas em um vértice é de 90°, e toda aresta é perpendicular às faces que encontra.",
    "A altura VO é perpendicular à base, e o apótema VM é perpendicular a BC: VOM é um triângulo retângulo, VM² = VO² + OM².",
    "A altura h, o raio r e a geratriz g formam um triângulo retângulo: g² = h² + r².",
    "As geratrizes são perpendiculares às bases; planificada, a superfície lateral é um retângulo 2πr × h.",
    "Um plano à distância x do centro corta um círculo de raio r com R² = r² + x² (ângulo reto em A).",
  ];
  const redraw = () => {
    clear(dyn); v.clearLabels();
    const lab = (p, s, col) => v.label(vec(p), s, col);
    if (which === 0) {
      const P = [[-1, -1, 0], [1, -1, 0], [1, 1, 0], [-1, 1, 0], [-1, -1, 2], [1, -1, 2], [1, 1, 2], [-1, 1, 2]].map((p) => V3(...p));
      dyn.add(boxEdges(P, [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]], C.line, 0.018));
      [[0, 1, 3, 4], [1, 0, 2, 5], [5, 4, 6, 1], [6, 5, 7, 2]].forEach(([o, a, b, c]) => {
        dyn.add(rightMark(P[o], P[a].clone().sub(P[o]), P[b].clone().sub(P[o]), 0.22, C.d));
        dyn.add(rightMark(P[o], P[a].clone().sub(P[o]), P[c].clone().sub(P[o]), 0.22, C.d));
        dyn.add(rightMark(P[o], P[b].clone().sub(P[o]), P[c].clone().sub(P[o]), 0.22, C.d));
      });
      dyn.add(face([P[0], P[1], P[2], P[3]], C.face, 0.25), face([P[0], P[1], P[5], P[4]], C.face, 0.2));
    } else if (which === 1) {
      const a = 1.25, h = 2.4, Vt = V3(0, 0, h), O = V3(0, 0, 0), M = V3(a, 0, 0);
      const B = [V3(-a, -a, 0), V3(a, -a, 0), V3(a, a, 0), V3(-a, a, 0)];
      dyn.add(face(B, C.face, 0.3));
      B.forEach((p, i) => { dyn.add(rod(p, B[(i + 1) % 4], C.line, 0.018)); dyn.add(rod(p, Vt, C.line, 0.018)); });
      dyn.add(face([Vt, O, M], C.hl, 0.6));
      dyn.add(rod(Vt, O, C.d, 0.03), rod(O, M, C.b, 0.025), rod(Vt, M, C.c, 0.025));
      dyn.add(rightMark(O, [0, 0, 1], [1, 0, 0], 0.22), rightMark(O, [0, 0, 1], [0, 1, 0], 0.22), rightMark(M, [-1, 0, 0], [0, 1, 0], 0.22, C.b));
      dyn.add(rightMark(M, Vt.clone().sub(M), [0, 1, 0], 0.22, C.c));
      lab(Vt.clone().add(V3(0, 0, 0.22)), "V"); lab(V3(-0.15, -0.18, -0.12), "O"); lab(M.clone().add(V3(0.2, 0, -0.15)), "M");
      lab(B[1].clone().add(V3(0.15, -0.15, -0.1)), "B"); lab(B[2].clone().add(V3(0.15, 0.15, -0.1)), "C");
    } else if (which === 2) {
      const r = 1.3, h = 2.4;
      dyn.add(surface((u, w) => [w * r * Math.cos(2 * Math.PI * u), w * r * Math.sin(2 * Math.PI * u), h * (1 - w)], 48, 8, C.face, 0.3));
      dyn.add(disc([0, 0, 0], r, C.face, 0.2), circle3([0, 0, 0], [1, 0, 0], [0, 1, 0], r));
      dyn.add(face([[0, 0, h], [0, 0, 0], [r, 0, 0]], C.hl, 0.6));
      dyn.add(rod([0, 0, h], [0, 0, 0], C.d, 0.03), rod([0, 0, 0], [r, 0, 0], C.b, 0.025), rod([0, 0, h], [r, 0, 0], C.c, 0.025));
      dyn.add(rightMark([0, 0, 0], [0, 0, 1], [1, 0, 0], 0.22));
      lab([-0.22, 0, h / 2], "h", "#be123c"); lab([r / 2, -0.05, -0.22], "r", "#15803d"); lab([r / 2 + 0.25, 0, h / 2 + 0.1], "g", "#7c3aed");
    } else if (which === 3) {
      const r = 1.1, h = 2.2;
      dyn.add(surface((u, w) => [r * Math.cos(2 * Math.PI * u), r * Math.sin(2 * Math.PI * u), h * w], 48, 4, C.face, 0.3));
      dyn.add(disc([0, 0, 0], r, C.face, 0.25), disc([0, 0, h], r, C.face, 0.25));
      dyn.add(circle3([0, 0, 0], [1, 0, 0], [0, 1, 0], r), circle3([0, 0, h], [1, 0, 0], [0, 1, 0], r));
      dyn.add(rod([0, 0, 0], [0, 0, h], C.d, 0.025), rod([r, 0, 0], [r, 0, h], C.c, 0.03), rod([0, 0, 0], [r, 0, 0], C.b, 0.02));
      dyn.add(rightMark([r, 0, 0], [-1, 0, 0], [0, 0, 1], 0.22, C.c), rightMark([r, 0, h], [-1, 0, 0], [0, 0, -1], 0.22, C.c));
      lab([r + 0.25, 0, h / 2], "h", "#7c3aed"); lab([r / 2, 0, -0.22], "r", "#15803d");
    } else {
      const R = 1.6, x = 0.9, r = Math.sqrt(R * R - x * x);
      dyn.add(surface((u, w) => [R * Math.sin(Math.PI * w) * Math.cos(2 * Math.PI * u), R * Math.sin(Math.PI * w) * Math.sin(2 * Math.PI * u),
        1 + R * Math.cos(Math.PI * w)], 48, 24, C.face, 0.22));
      dyn.add(disc([0, 0, 1 + x], r, C.faceA, 0.45), circle3([0, 0, 1 + x], [1, 0, 0], [0, 1, 0], r, C.a));
      dyn.add(face([[0, 0, 1], [0, 0, 1 + x], [r, 0, 1 + x]], C.hl, 0.7));
      dyn.add(rod([0, 0, 1], [0, 0, 1 + x], C.d, 0.025), rod([0, 0, 1 + x], [r, 0, 1 + x], C.b, 0.025), rod([0, 0, 1], [r, 0, 1 + x], C.c, 0.025));
      dyn.add(rightMark([0, 0, 1 + x], [0, 0, -1], [1, 0, 0], 0.18));
      dyn.add(dot([0, 0, 1], C.ink, 0.05));
      lab([-0.2, 0, 0.9], "O"); lab([-0.2, 0, 1 + x + 0.1], "A"); lab([r + 0.18, 0, 1 + x + 0.12], "B");
      lab([-0.2, 0, 1 + x / 2], "x", "#be123c"); lab([r / 2, 0, 1 + x + 0.2], "r", "#15803d"); lab([r / 2 + 0.2, 0, 1 + x / 2 - 0.1], "R", "#7c3aed");
    }
  };
  redraw();
  g.readout(() => texts[which]);
  return redraw;
};

// 35. Pyramid volume; in a tetrahedron any face can be the base (distance from D to plane AHC).
FIG3["tetra-distance"] = (g) => {
  const v = g.view({ theta: -58, phi: 24, r: 15, target: [1.5, 1.5, 1.6] });
  let mode = 1;
  g.choice(["Base ACD, altura HD", "Base AHC, altura d"], 1, (i) => { mode = i; });
  const A = V3(0, 0, 0), B = V3(3, 0, 0), Cc = V3(3, 3, 0), D = V3(0, 3, 0);
  const E = V3(0, 0, 4), F = V3(3, 0, 4), G = V3(3, 3, 4), H = V3(0, 3, 4);
  const P = [A, B, Cc, D, E, F, G, H];
  v.root.add(boxEdges(P, [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]], C.aux, 0.012));
  [[A, "A", [-0.2, -0.2, -0.1]], [B, "B", [0.2, -0.2, -0.1]], [Cc, "C", [0.25, 0.1, -0.1]], [D, "D", [-0.25, 0.15, -0.12]],
    [E, "E", [-0.2, -0.2, 0.15]], [F, "F", [0.2, -0.2, 0.15]], [G, "G", [0.2, 0.2, 0.15]], [H, "H", [-0.2, 0.2, 0.18]]].forEach(([p, s, o]) =>
    v.label(p.clone().add(V3(...o)), s));
  v.label(V3(1.5, -0.25, -0.2), "3", "#5d6470", 13); v.label(V3(3.25, 1.5, -0.15), "3", "#5d6470", 13); v.label(V3(-0.25, 3, 2), "4", "#5d6470", 13);
  const n = H.clone().sub(A).cross(Cc.clone().sub(A));
  const K = D.clone().sub(n.clone().multiplyScalar(n.dot(D.clone().sub(A)) / n.lengthSq()));
  const dyn = new THREE.Group();
  v.root.add(dyn);
  v.label(K.clone().add(V3(0.2, -0.2, 0.15)), "K", "#be123c");
  const redraw = () => {
    clear(dyn);
    [[D, A, H], [D, H, Cc], [D, A, Cc]].forEach((t) => dyn.add(face(t, C.face, 0.18)));
    [[D, A], [D, H], [D, Cc], [A, H], [H, Cc], [A, Cc]].forEach(([p, q]) => dyn.add(rod(p, q, C.line, 0.02)));
    if (mode === 0) {
      dyn.add(face([A, Cc, D], C.faceB, 0.6));
      dyn.add(rod(H, D, C.d, 0.04));
      dyn.add(rightMark(D, [0, 0, 1], [1, 0, 0], 0.3, C.d), rightMark(D, [0, 0, 1], [0, -1, 0], 0.3, C.d));
    } else {
      dyn.add(face([A, H, Cc], C.faceA, 0.55));
      dyn.add(rod(D, K, C.d, 0.04));
      dyn.add(dot(K, C.d, 0.06));
      dyn.add(rightMark(K, D.clone().sub(K), A.clone().sub(K), 0.25, C.d));
    }
    dyn.add(dot(D, C.ink, 0.07));
  };
  redraw();
  const area = (P1, P2, P3) => P2.clone().sub(P1).cross(P3.clone().sub(P1)).length() / 2;
  g.readout(() => {
    const vol = area(A, Cc, D) * 4 / 3, S = area(A, H, Cc);
    return `Vol(HACD) = ⅓ · Área(ACD) · HD = ⅓ · (9/2) · 4 = 6 &nbsp;e&nbsp; ` +
      `Vol(DAHC) = ⅓ · Área(AHC) · d, com Área(AHC) = (3/2)√41.` +
      `<br><span class="ok">d = 3·Vol / Área(AHC) = 12/√41</span> &nbsp;(d = DK, em vermelho)`;
  });
  return redraw;
};

// 36. The angle between two planes.
FIG3["dihedral"] = (g) => {
  const v = g.view({ theta: -30, phi: 22, r: 11, target: [0, 0.6, 0.5] });
  let mode = 0;
  g.choice(["Dois planos", "Pirâmide"], 0, (i) => { mode = i; th.value = th.value; });
  const th = g.slider("θ / altura:", 0.15, 0.9, 0.01, 0.4, (x) => mode === 0 ? Math.round(x * 180) + "°" : fmt(x * 3.2, 2));
  const dyn = new THREE.Group();
  v.root.add(dyn);
  const redraw = () => {
    clear(dyn); v.clearLabels();
    if (mode === 0) {
      const t = th.value * Math.PI, W = 2.2, Lh = 2.2;
      const dirB = V3(0, Math.cos(t), Math.sin(t));
      dyn.add(face([[-W, 0, 0], [W, 0, 0], [W, Lh, 0], [-W, Lh, 0]], C.face, 0.3));
      dyn.add(face([V3(-W, 0, 0), V3(W, 0, 0), V3(W, 0, 0).add(dirB.clone().multiplyScalar(Lh)), V3(-W, 0, 0).add(dirB.clone().multiplyScalar(Lh))], C.faceB, 0.3));
      dyn.add(rod([-W - 0.4, 0, 0], [W + 0.4, 0, 0], C.line, 0.03));
      dyn.add(rod([0, 0, 0], [0, 1.6, 0], C.c, 0.03), rod([0, 0, 0], dirB.clone().multiplyScalar(1.6), C.b, 0.03));
      dyn.add(rightMark([0, 0, 0], [1, 0, 0], [0, 1, 0], 0.22), rightMark([0, 0, 0], [1, 0, 0], dirB, 0.22));
      dyn.add(arcMark([0, 0, 0], [0, 1, 0], dirB, 0.6, C.a));
      v.label(V3(W + 0.55, 0, 0), "t"); v.label(V3(-W + 0.3, Lh - 0.2, 0), "α", "#1d4ed8", 18);
      v.label(V3(-W, 0, 0).add(dirB.clone().multiplyScalar(Lh - 0.2)).add(V3(0.3, 0, 0)), "β", "#15803d", 18);
      v.label(V3(0, 1.8, 0), "r", "#7c3aed"); v.label(dirB.clone().multiplyScalar(1.85), "s", "#15803d");
      v.label(V3(0, Math.cos(t / 2), Math.sin(t / 2)).multiplyScalar(0.85), "θ", "#ea580c", 16);
    } else {
      const a = 1.4, h = th.value * 3.2, Vt = V3(0, 0, h), O = V3(0, 0, 0), M = V3(a, 0, 0);
      const B = [V3(-a, -a, 0), V3(a, -a, 0), V3(a, a, 0), V3(-a, a, 0)];
      dyn.add(face(B, C.face, 0.3));
      dyn.add(face([Vt, B[1], B[2]], C.faceB, 0.35));
      B.forEach((p, i) => { dyn.add(rod(p, B[(i + 1) % 4], C.line, 0.018)); dyn.add(rod(p, Vt, C.line, 0.018)); });
      dyn.add(rod(Vt, O, C.aux, 0.015), rod(O, M, C.c, 0.03), rod(Vt, M, C.b, 0.03));
      dyn.add(rightMark(M, [-1, 0, 0], [0, 1, 0], 0.2), rightMark(M, Vt.clone().sub(M), [0, 1, 0], 0.2));
      dyn.add(arcMark(M, [-1, 0, 0], Vt.clone().sub(M), 0.45, C.a));
      v.label(Vt.clone().add(V3(0, 0, 0.22)), "V"); v.label(V3(-0.2, -0.15, -0.12), "O"); v.label(M.clone().add(V3(0.22, 0, -0.15)), "M");
      v.label(B[1].clone().add(V3(0.15, -0.15, -0.1)), "B"); v.label(B[2].clone().add(V3(0.15, 0.15, -0.1)), "C");
      v.label(B[0].clone().add(V3(-0.15, -0.15, -0.1)), "A"); v.label(B[3].clone().add(V3(-0.15, 0.15, -0.1)), "D");
    }
  };
  redraw();
  g.readout(() => mode === 0
    ? `r ⊂ α e s ⊂ β são ambas perpendiculares a t = α ∩ β no mesmo ponto: <span class="ok">o ângulo entre os planos é θ = ${Math.round(th.value * 180)}°</span>.`
    : `OM ⊥ BC e VM ⊥ BC; logo, o ângulo entre a base e a face VBC é θ = ∠VMO: ` +
      `<span class="ok">tg θ = VO/OM = ${fmt(th.value * 3.2, 2)}/1,4, θ = ${fmt(Math.atan(th.value * 3.2 / 1.4) / D2R, 1)}°</span>.`);
  return redraw;
};

// 37. Right cylinder and right cone: unroll the lateral surface.
FIG3["unroll"] = (g) => {
  const v = g.view({ theta: -25, phi: 18, r: 9.5, target: [0.6, 0, 1.0] });
  let which = 0;
  g.choice(["Cilindro", "Cone"], 0, (i) => { which = i; });
  const lam = g.slider("planificar:", 0, 1, 0.01, 0, (x) => Math.round(100 * x) + "%");
  const dyn = new THREE.Group();
  v.root.add(dyn);
  const r = 1, h = 2, gg = Math.sqrt(5);
  const redraw = () => {
    clear(dyn); v.clearLabels();
    const l = Math.min(lam.value, 0.999);
    if (which === 0) {
      const rho = r / (1 - l), xc = r - rho;
      const P = (u, w) => { const s = (u - 0.5) * 2 * Math.PI * r; return [xc + rho * Math.cos(s / rho), rho * Math.sin(s / rho), h * w]; };
      dyn.add(surface(P, 64, 4, C.face, 0.55));
      dyn.add(lines(Array.from({ length: 65 }, (_, i) => P(i / 64, 0)), C.line), lines(Array.from({ length: 65 }, (_, i) => P(i / 64, 1)), C.line));
      dyn.add(lines([P(0, 0), P(0, 1)], C.line), lines([P(1, 0), P(1, 1)], C.line));
      if (lam.value < 0.98) {
        dyn.add(disc([0, 0, 0], r, C.faceA, 0.4 * (1 - lam.value)), disc([0, 0, h], r, C.faceA, 0.4 * (1 - lam.value)));
      }
      if (lam.value > 0.95) {
        v.label(V3(...P(0.5, 0)).add(V3(0.1, 0, -0.25)), "2πr", "#be123c", 15);
        v.label(V3(...P(1, 0.5)).add(V3(0, 0.25, 0)), "h", "#be123c", 15);
        dyn.add(rightMark(P(1, 0), V3(...P(0.99, 0)).sub(V3(...P(1, 0))), [0, 0, 1], 0.2, C.d));
      }
    } else {
      const rho = r + l * (gg - r), hl = Math.sqrt(Math.max(0, gg * gg - rho * rho));
      const d = Math.atan2(hl, rho) - Math.atan2(h, r);       // keep the middle generatrix fixed
      const rot = (x, y, z) => [x * Math.cos(d) - z * Math.sin(d), y, x * Math.sin(d) + z * Math.cos(d) + h];
      const P = (u, w) => { const s = (u - 0.5) * 2 * Math.PI * r; return rot(w * rho * Math.cos(s / rho), w * rho * Math.sin(s / rho), -w * hl); };
      dyn.add(surface(P, 64, 8, C.face, 0.55));
      dyn.add(lines(Array.from({ length: 65 }, (_, i) => P(i / 64, 1)), C.line));
      dyn.add(lines([P(0, 0), P(0, 1)], C.line), lines([P(1, 0), P(1, 1)], C.line));
      if (lam.value < 0.98) dyn.add(disc([0, 0, 0], r, C.faceA, 0.4 * (1 - lam.value)));
      if (lam.value > 0.95) {
        v.label(V3(...P(0.5, 1)).multiplyScalar(1).add(V3(0.25, 0, 0)), "arco 2πr", "#be123c", 14);
        v.label(V3(...P(0, 0.5)).add(V3(0, -0.2, 0.1)), "g", "#7c3aed", 16);
      }
    }
  };
  redraw();
  g.readout(() => which === 0
    ? `Cilindro (r = 1, h = 2): área lateral = 2πr·h = ${fmt(2 * Math.PI * r * h)}, &nbsp; volume = πr²h = ${fmt(Math.PI * r * r * h)}` +
      (lam.value > 0.95 ? " &nbsp;<span class='ok'>— planificada: um retângulo 2πr × h</span>" : "")
    : `Cone (r = 1, h = 2, g = √5): área lateral = πrg = ${fmt(Math.PI * r * gg)}, &nbsp; volume = ⅓πr²h = ${fmt(Math.PI * r * r * h / 3)}` +
      (lam.value > 0.95 ? ` &nbsp;<span class='ok'>— planificada: um setor de raio g e arco 2πr (ângulo ${fmt(360 * r / gg, 1)}°)</span>` : ""));
  return redraw;
};

// 38. Difference of volumes: the frustum of a cone.
FIG3["frustum"] = (g) => {
  const v = g.view({ theta: -40, phi: 16, r: 11.5, target: [0, 0, 1.4] });
  const k = g.slider("k = VA/VC:", 0.2, 0.9, 0.01, 0.5, (x) => fmt(x, 2));
  const R = 1.5, H = 3;
  const dyn = new THREE.Group();
  v.root.add(dyn);
  const redraw = () => {
    clear(dyn); v.clearLabels();
    const kk = k.value, zc = H * (1 - kk), rc = R * kk;
    const cone = (r0, z0, r1, z1, col, op) => surface((u, w) => [(r0 + (r1 - r0) * w) * Math.cos(2 * Math.PI * u),
      (r0 + (r1 - r0) * w) * Math.sin(2 * Math.PI * u), z0 + (z1 - z0) * w], 48, 6, col, op);
    dyn.add(cone(R, 0, rc, zc, C.face, 0.35));
    dyn.add(cone(rc, zc, 0, H, C.faceA, 0.6));
    dyn.add(disc([0, 0, zc], rc, C.faceA, 0.5), disc([0, 0, 0], R, C.face, 0.3));
    dyn.add(circle3([0, 0, zc], [1, 0, 0], [0, 1, 0], rc, C.a), circle3([0, 0, 0], [1, 0, 0], [0, 1, 0], R));
    dyn.add(rod([0, 0, H], [0, 0, 0], C.aux, 0.015), rod([0, 0, H], [R, 0, 0], C.c, 0.022),
      rod([0, 0, zc], [rc, 0, zc], C.a, 0.025), rod([0, 0, 0], [R, 0, 0], C.b, 0.025));
    dyn.add(rightMark([0, 0, zc], [0, 0, 1], [1, 0, 0], 0.15), rightMark([0, 0, 0], [0, 0, 1], [1, 0, 0], 0.18));
    v.label(V3(0, 0, H + 0.22), "V"); v.label(V3(-0.2, 0, zc + 0.05), "A"); v.label(V3(rc + 0.2, 0, zc + 0.1), "B");
    v.label(V3(-0.2, 0, -0.1), "C"); v.label(V3(R + 0.2, 0, -0.1), "D");
  };
  redraw();
  g.readout(() => {
    const kk = k.value, Vb = Math.PI * R * R * H / 3, Vs = Vb * kk ** 3;
    return `ΔVAB ∼ ΔVCD na razão k = ${fmt(kk)}: o cone menor é semelhante ao maior; logo, ` +
      `<span class="ok">Vol(menor)/Vol(maior) = k³ = ${fmt(kk ** 3, 3)}</span>` +
      `<br>Vol(tronco) = Vol(maior) − Vol(menor) = ${fmt(Vb)} − ${fmt(Vs)} = ${fmt(Vb - Vs)}`;
  });
  return redraw;
};

// 39. The sphere: area, volume, sections, inscribed spheres.
FIG3["sphere"] = (g) => {
  const v = g.view({ theta: -40, phi: 18, r: 11, target: [0, 0, 0] });
  let mode = 0;
  g.choice(["Seção plana", "Esfera no cone", "Esfera no cubo"], 0, (i) => { mode = i; x.el.style.display = i ? "none" : ""; });
  const x = g.slider("distância x do plano:", -1.9, 1.9, 0.01, 0.9, (t) => fmt(t, 2));
  const dyn = new THREE.Group();
  v.root.add(dyn);
  const sph = (R, c, col = C.face, op = 0.22) => surface((u, w) => [c[0] + R * Math.sin(Math.PI * w) * Math.cos(2 * Math.PI * u),
    c[1] + R * Math.sin(Math.PI * w) * Math.sin(2 * Math.PI * u), c[2] + R * Math.cos(Math.PI * w)], 48, 24, col, op);
  const Rc = 1.5, Hc = 3, gc = Math.hypot(Rc, Hc), ri = Rc * Hc / (Rc + gc);
  const redraw = () => {
    clear(dyn); v.clearLabels();
    x.value = x.value;    // keep the output in sync
    if (mode === 0) {
      const R = 2, xx = x.value, r = Math.sqrt(Math.max(0, R * R - xx * xx));
      dyn.add(sph(R, [0, 0, 0]));
      dyn.add(disc([0, 0, xx], r, C.faceA, 0.5), circle3([0, 0, xx], [1, 0, 0], [0, 1, 0], r, C.a));
      dyn.add(face([[0, 0, 0], [0, 0, xx], [r, 0, xx]], C.hl, 0.7));
      dyn.add(rod([0, 0, 0], [0, 0, xx], C.d, 0.025), rod([0, 0, xx], [r, 0, xx], C.b, 0.025), rod([0, 0, 0], [r, 0, xx], C.c, 0.025));
      if (Math.abs(xx) > 0.05 && r > 0.05) dyn.add(rightMark([0, 0, xx], [0, 0, -Math.sign(xx)], [1, 0, 0], 0.16));
      dyn.add(dot([0, 0, 0], C.ink, 0.05));
      v.label(V3(-0.22, 0, -0.1), "O"); v.label(V3(-0.2, 0, xx + 0.1 * Math.sign(xx || 1)), "A"); v.label(V3(r + 0.2, 0, xx + 0.1), "B");
      v.label(V3(-0.22, 0, xx / 2), "x", "#be123c"); v.label(V3(r / 2, 0, xx + 0.2 * Math.sign(xx || 1)), "r", "#15803d");
      v.label(V3(r / 2 + 0.2, 0, xx / 2), "R", "#7c3aed");
    } else if (mode === 1) {
      dyn.add(surface((u, w) => [w * Rc * Math.cos(2 * Math.PI * u), w * Rc * Math.sin(2 * Math.PI * u), Hc * (1 - w) - Hc / 2], 48, 8, C.face, 0.2));
      dyn.add(sph(ri, [0, 0, ri - Hc / 2], C.faceA, 0.45));
      const Vt = V3(0, 0, Hc / 2), O = V3(0, 0, -Hc / 2), A = V3(Rc, 0, -Hc / 2), O1 = V3(0, 0, ri - Hc / 2);
      const u = A.clone().sub(Vt).normalize(), T = Vt.clone().add(u.multiplyScalar(O1.clone().sub(Vt).dot(u)));
      dyn.add(face([Vt, O, A], C.face, 0.25), face([Vt, O1, T], C.hl, 0.7));
      dyn.add(rod(Vt, O, C.aux, 0.015), rod(O, A, C.line, 0.02), rod(Vt, A, C.line, 0.02), rod(O1, T, C.b, 0.025));
      dyn.add(rightMark(T, Vt.clone().sub(T), O1.clone().sub(T), 0.15), rightMark(O, Vt.clone().sub(O), A.clone().sub(O), 0.18));
      v.label(Vt.clone().add(V3(0, 0, 0.22)), "V"); v.label(O.clone().add(V3(-0.2, 0, -0.1)), "O"); v.label(A.clone().add(V3(0.2, 0, -0.1)), "A");
      v.label(O1.clone().add(V3(-0.25, 0, 0)), "O′"); v.label(T.clone().add(V3(0.2, 0, 0.1)), "T");
    } else {
      const l = 2.4, hgt = l / 2;
      const P = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]].map((p) => V3(...p).multiplyScalar(hgt));
      dyn.add(boxEdges(P, [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]], C.line, 0.015));
      dyn.add(sph(hgt, [0, 0, 0], C.faceA, 0.45));
      dyn.add(rod([0, 0, -hgt], [0, 0, hgt], C.d, 0.025));
      v.label(V3(0.2, 0, 0.6), "2r = ℓ", "#be123c", 14);
    }
  };
  redraw();
  g.readout(() => {
    if (mode === 0) {
      const R = 2, xx = x.value, r2 = R * R - xx * xx;
      return `Esfera R = 2: área 4πR² = ${fmt(16 * Math.PI)}, volume ⁴⁄₃πR³ = ${fmt(32 * Math.PI / 3)}.` +
        `<br>Seção à distância x = ${fmt(Math.abs(xx))}: <span class="ok">r² = R² − x² = ${fmt(r2)}</span>, área πr² = ${fmt(Math.PI * r2)}`;
    }
    if (mode === 1) return `Seção meridiana: ΔVO′T ∼ ΔVOA (ambos retângulos, ângulo comum em V); logo, r/R = (h − r)/g e ` +
      `<span class="ok">r = Rh/(R + g) = ${fmt(ri, 3)}</span> para R = ${Rc}, h = ${Hc}, g = ${fmt(gc, 3)}.`;
    return `A esfera toca as seis faces: o seu diâmetro é a aresta, <span class="ok">2r = ℓ; logo, r = ℓ/2</span>.`;
  });
  return redraw;
};

// 40. Convex polyhedra: Euler's relation V − E + F = 2 and the five regular polyhedra.
FIG3["platonic"] = (g) => {
  const v = g.view({ theta: -50, phi: 22, r: 8, target: [0, 0, 0] });
  let which = 0;
  const data = [["Tetraedro", 4, 6, 4], ["Hexaedro (cubo)", 8, 12, 6], ["Octaedro", 6, 12, 8], ["Dodecaedro", 20, 30, 12],
    ["Icosaedro", 12, 30, 20]];
  g.choice(["T", "H", "O", "D", "I", "Tetraedro no cubo"], 0, (i) => { which = i; });
  const dyn = new THREE.Group();
  v.root.add(dyn);
  const redraw = () => {
    clear(dyn); v.clearLabels();
    if (which < 5) {
      const R = 1.7;
      const geo = [new THREE.TetrahedronGeometry(R), new THREE.BoxGeometry(2 * R / Math.sqrt(3), 2 * R / Math.sqrt(3), 2 * R / Math.sqrt(3)),
        new THREE.OctahedronGeometry(R), new THREE.DodecahedronGeometry(R), new THREE.IcosahedronGeometry(R)][which];
      if (which === 0) {   // stand the tetrahedron on a face: the vertex (1, 1, 1) points up
        geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V3(1, 1, 1).normalize(), V3(0, 0, 1)));
      } else { geo.rotateX(0.55); geo.rotateY(0.35); }
      const mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: C.face, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false, flatShading: true }));
      dyn.add(mesh);
      const eg = new THREE.EdgesGeometry(geo, 1);
      const pos = eg.getAttribute("position");
      for (let i = 0; i < pos.count; i += 2) dyn.add(rod(V3(pos.getX(i), pos.getY(i), pos.getZ(i)), V3(pos.getX(i + 1), pos.getY(i + 1), pos.getZ(i + 1)), C.line, 0.022));
      const seen = new Set(), gp = geo.getAttribute("position");
      for (let i = 0; i < gp.count; i++) {
        const key = [gp.getX(i), gp.getY(i), gp.getZ(i)].map((t) => t.toFixed(3)).join(",");
        if (seen.has(key)) continue;
        seen.add(key);
        dyn.add(dot(V3(gp.getX(i), gp.getY(i), gp.getZ(i)), C.pt, 0.06));
      }
    } else {
      const s = 1.2, P = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]].map((p) => V3(...p).multiplyScalar(s));
      dyn.add(boxEdges(P, [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]], C.aux, 0.014));
      const T = [P[0], P[2], P[5], P[7]];
      [[0, 1, 2], [0, 1, 3], [0, 2, 3], [1, 2, 3]].forEach(([a, b, c]) => dyn.add(face([T[a], T[b], T[c]], C.faceA, 0.3)));
      [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]].forEach(([a, b]) => dyn.add(rod(T[a], T[b], C.a, 0.03)));
      T.forEach((p) => dyn.add(dot(p, C.a, 0.07)));
      ["C", "B", "D", "A"].forEach((nm, i) => v.label(T[i].clone().multiplyScalar(1.15), nm));
      v.label(P[1].clone().add(P[5]).multiplyScalar(0.5).add(V3(0.2, -0.15, 0)), "ℓ", "#5d6470", 15);
      v.label(T[0].clone().add(T[2]).multiplyScalar(0.5).add(V3(0.1, -0.25, 0)), "ℓ√2", "#ea580c", 14);
    }
  };
  redraw();
  g.readout(() => {
    if (which === 5) return `Ligue vértices alternados do cubo: as seis arestas do tetraedro são diagonais das faces, todas iguais a ℓ√2; ` +
      `logo, <span class="ok">um tetraedro regular de aresta ℓ√2 cabe em um cubo de aresta ℓ</span>.`;
    const [nm, Vn, En, Fn] = data[which];
    return `${nm}: V = ${Vn}, A = ${En}, F = ${Fn}, &nbsp; <span class="ok">V − A + F = ${Vn - En + Fn}</span>. ` +
      `<span class="step">Só cinco poliedros convexos são regulares: T, H, O, D, I.</span>`;
  });
  return redraw;
};

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
else start();

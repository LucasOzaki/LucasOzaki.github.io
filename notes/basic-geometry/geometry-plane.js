/*
  Interactive figures for the plane-geometry section of the note
  "Basic geometry: a comprehensive viewpoint".

  Each figure is a <div class="geo-fig" data-fig="NAME"></div> in index.qmd; the function
  FIG[NAME] below builds it with JSXGraph (https://jsxgraph.org). Figures are built only when
  they scroll into view, so the page stays light.
*/
(function () {
  "use strict";

  const C = {
    ink: "#1c1f26", line: "#334155", aux: "#94a3b8", pt: "#1d4ed8",
    a: "#ea580c", b: "#15803d", c: "#7c3aed", d: "#be123c", gold: "#ca8a04",
    fillA: "#fdba74", fillB: "#86efac", fillC: "#c4b5fd", fillD: "#fda4af",
    area: "#93c5fd", hl: "#fde68a",
  };
  const D2R = Math.PI / 180;
  const FIG = {};

  // ------------------------------------------------------------------ small helpers
  const fmt = (x, d = 2) => (Math.abs(x) < 5e-13 ? 0 : x).toFixed(d).replace(".", ",");   // decimal comma
  const fdeg = (x, d = 1) => fmt(x, d) + "°";
  const xy = (P) => (Array.isArray(P) ? P : [P.X(), P.Y()]);
  const dist = (P, Q) => { const [a, b] = xy(P), [c, d] = xy(Q); return Math.hypot(c - a, d - b); };
  function deg(A, O, B) {               // the (non-reflex) angle AOB in degrees
    const [ax, ay] = xy(A), [ox, oy] = xy(O), [bx, by] = xy(B);
    const u = [ax - ox, ay - oy], v = [bx - ox, by - oy];
    const c = (u[0] * v[0] + u[1] * v[1]) / (Math.hypot(...u) * Math.hypot(...v) || 1);
    return Math.acos(Math.max(-1, Math.min(1, c))) / D2R;
  }
  const lerp = (P, Q, t) => { const [a, b] = xy(P), [c, d] = xy(Q); return [a + t * (c - a), b + t * (d - b)]; };
  const triArea = (A, B, Cc) => {
    const [a, b] = xy(A), [c, d] = xy(B), [e, f] = xy(Cc);
    return Math.abs((c - a) * (f - b) - (e - a) * (d - b)) / 2;
  };
  function footOn(P, A, B) {             // foot of the perpendicular from P to line AB
    const [px, py] = xy(P), [ax, ay] = xy(A), [bx, by] = xy(B);
    const dx = bx - ax, dy = by - ay, t = ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy);
    return [ax + t * dx, ay + t * dy];
  }

  // ------------------------------------------------------------------ the figure "context"
  function Ctx(el) {
    this.el = el;
    this.boards = [];
    this.readers = [];
    this.draggable = false;
    el.innerHTML = "";
    this.grid = document.createElement("div");
    this.grid.className = "geo-boards";
    this.controls = document.createElement("div");
    this.controls.className = "geo-controls";
    this.out = document.createElement("div");
    this.out.className = "geo-readout";
    this.hint = document.createElement("div");
    this.hint.className = "geo-hint";
    el.append(this.grid, this.controls, this.out, this.hint);
  }

  Ctx.prototype.board = function (bb, opt = {}) {
    const wrap = document.createElement("div");
    if (opt.title) {
      const t = document.createElement("div");
      t.className = "geo-board-title";
      t.innerHTML = opt.title;
      wrap.appendChild(t);
    }
    const div = document.createElement("div");
    div.className = "geo-board";
    div.id = "geo-" + Math.random().toString(36).slice(2, 10);
    const aspect = (bb[2] - bb[0]) / (bb[1] - bb[3]);
    div.style.aspectRatio = String(aspect);
    wrap.style.maxWidth = Math.round((opt.maxH || 440) * aspect) + "px";   // tall pictures do not fill the screen
    wrap.style.justifySelf = "center";
    wrap.style.width = "100%";
    wrap.appendChild(div);
    this.grid.appendChild(wrap);
    this.grid.classList.toggle("cols-2", this.grid.children.length === 2 || opt.cols === 2);
    this.grid.classList.toggle("cols-3", this.grid.children.length >= 3 && opt.cols !== 2);
    const b = JXG.JSXGraph.initBoard(div.id, {
      boundingbox: bb, keepaspectratio: true, axis: false, grid: false,
      showCopyright: false, showNavigation: true, showFullscreen: false, showScreenshot: false,
      showClearTraces: false, showReload: false,
      zoom: { wheel: true, needShift: true, pinch: true, min: 0.4, max: 10, factorX: 1.2, factorY: 1.2 },
      pan: { enabled: true, needShift: true, needTwoFingers: true },
      resize: { enabled: false },
    });
    // keep the whole picture visible when the page (or the grid around the board) changes size
    let lastW = div.clientWidth;
    if ("ResizeObserver" in window) {
      new ResizeObserver(() => {
        const w = div.clientWidth, h = div.clientHeight;
        if (!w || !h || Math.abs(w - lastW) < 2) return;
        lastW = w;
        b.resizeContainer(w, h, true, true);
        b.setBoundingBox(bb, true);
        b.fullUpdate();
      }).observe(div);
    }
    b.on("update", () => this.refresh());
    this.boards.push(b);
    return b;
  };

  Ctx.prototype.refresh = function () {
    if (this._busy) return;
    this._busy = true;
    try { this.out.innerHTML = this.readers.map((f) => f()).filter(Boolean).join("<br>"); }
    finally { this._busy = false; }
  };
  Ctx.prototype.readout = function (f) { this.readers.push(f); };
  Ctx.prototype.updateAll = function () { this.boards.forEach((b) => b.update()); this.refresh(); };

  Ctx.prototype.slider = function (label, min, max, step, value, show, onInput) {
    const lab = document.createElement("label");
    const inp = document.createElement("input");
    Object.assign(inp, { type: "range", min, max, step, value });
    const out = document.createElement("output");
    const s = { get value() { return parseFloat(inp.value); }, set value(v) { inp.value = v; out.textContent = show(+inp.value); } };
    out.textContent = show(value);
    inp.addEventListener("input", () => { out.textContent = show(+inp.value); if (onInput) onInput(+inp.value); this.updateAll(); });
    lab.append(label + " ", inp, out);
    this.controls.appendChild(lab);
    s.el = lab;
    return s;
  };

  Ctx.prototype.button = function (label, fn, toggle = false) {
    const btn = document.createElement("button");
    btn.className = "geo-btn";
    btn.type = "button";
    btn.innerHTML = label;
    btn.addEventListener("click", () => {
      if (toggle) btn.classList.toggle("active");
      fn(btn.classList.contains("active"), btn);
      this.updateAll();
    });
    this.controls.appendChild(btn);
    return btn;
  };

  Ctx.prototype.choice = function (labels, initial, fn) {   // a row of mutually exclusive buttons
    const btns = labels.map((lab, i) => {
      const b = document.createElement("button");
      b.className = "geo-btn" + (i === initial ? " active" : "");
      b.type = "button";
      b.innerHTML = lab;
      b.addEventListener("click", () => {
        btns.forEach((x) => x.classList.remove("active"));
        b.classList.add("active");
        fn(i);
        this.updateAll();
      });
      this.controls.appendChild(b);
      return b;
    });
    return btns;
  };

  Ctx.prototype.finish = function (rebuild, hint) {
    const parts = [];
    if (hint) parts.push(hint);
    else {
      if (this.draggable) parts.push("Arraste os pontos azuis.");
      parts.push("Amplie com os botões ＋/－, com o movimento de pinça ou com Shift + rolagem; Shift + arrastar move a figura.");
    }
    this.hint.innerHTML = "<span>" + parts.join(" ") + "</span>";
    const reset = document.createElement("button");
    reset.className = "geo-btn";
    reset.type = "button";
    reset.textContent = "Reiniciar";
    reset.addEventListener("click", rebuild);
    this.hint.appendChild(reset);
    this.updateAll();
  };

  // ---- elements
  Ctx.prototype.free = function (b, x, y, name, o = {}) {
    this.draggable = true;
    return b.create("point", [x, y], Object.assign({ name, size: 4, color: C.pt, showInfobox: false,
      label: { offset: [8, 10], fontSize: 16, color: C.ink } }, o));
  };
  Ctx.prototype.glider = function (b, x, y, on, name, o = {}) {
    this.draggable = true;
    return b.create("glider", [x, y, on], Object.assign({ name, size: 4, color: C.pt, showInfobox: false,
      label: { offset: [8, 10], fontSize: 16, color: C.ink } }, o));
  };
  Ctx.prototype.fixed = function (b, x, y, name, o = {}) {
    return b.create("point", [x, y], Object.assign({ name, size: 2.5, fixed: true, color: C.ink,
      showInfobox: false, label: { offset: [8, 10], fontSize: 16, color: C.ink } }, o));
  };
  Ctx.prototype.dep = function (b, fx, fy, name = "", o = {}) {
    return b.create("point", [fx, fy], Object.assign({ name, size: 2.5, color: C.ink, showInfobox: false,
      withLabel: !!name, label: { offset: [8, 10], fontSize: 16, color: C.ink } }, o));
  };
  Ctx.prototype.at = function (b, f) {      // invisible point at f() = [x, y]
    return b.create("point", [() => f()[0], () => f()[1]], { visible: false, withLabel: false });
  };
  Ctx.prototype.seg = function (b, P, Q, o = {}) {
    return b.create("segment", [P, Q], Object.assign({ strokeColor: C.line, strokeWidth: 2, highlight: false }, o));
  };
  Ctx.prototype.line = function (b, P, Q, o = {}) {
    return b.create("line", [P, Q], Object.assign({ strokeColor: C.line, strokeWidth: 1.6, highlight: false }, o));
  };
  Ctx.prototype.poly = function (b, pts, o = {}) {
    return b.create("polygon", pts, Object.assign({ fillColor: C.area, fillOpacity: 0.25, highlight: false,
      borders: { strokeColor: C.line, strokeWidth: 2, highlight: false }, vertices: { visible: false } }, o));
  };
  Ctx.prototype.circ = function (b, M, r, o = {}) {
    return b.create("circle", [M, r], Object.assign({ strokeColor: C.line, strokeWidth: 2, highlight: false,
      fillOpacity: 0 }, o));
  };
  Ctx.prototype.angle = function (b, A, O, B, name, color = C.a, o = {}) {
    const label = Object.assign({ fontSize: 18, color: color, strokeColor: color, anchorX: "middle", anchorY: "middle", offset: [0, 0] }, o.label || {});
    const el = b.create("nonreflexangle", [A, O, B], Object.assign({ name: name || "", radius: 0.6,
      fillColor: color, fillOpacity: 0.3, strokeColor: color, strokeWidth: 1.5, highlight: false,
      orthoType: "sector", withLabel: !!name }, o, { label }));
    if (name) el.getLabelAnchor = function () { return angleLabelAnchor(this); };
    return el;
  };
  // Where the name of an angle goes: on the bisector, centred, just past the arc, and, when the angle is
  // narrow, far enough out for the text to fit between the two sides (up to a limit).
  function angleLabelAnchor(el) {
    const bd = el.board, O = el.center.coords.usrCoords, P = el.radiuspoint.coords.usrCoords, Q = el.anglepoint.coords.usrCoords;
    let ux = P[1] - O[1], uy = P[2] - O[2], vx = Q[1] - O[1], vy = Q[2] - O[2];
    const lu = Math.hypot(ux, uy) || 1, lv = Math.hypot(vx, vy) || 1;
    ux /= lu; uy /= lu; vx /= lv; vy /= lv;
    let wx = ux + vx, wy = uy + vy, lw = Math.hypot(wx, wy);
    if (lw < 1e-9) { wx = -uy; wy = ux; lw = 1; }
    wx /= lw; wy /= lw;
    const half = Math.acos(Math.max(-1, Math.min(1, ux * vx + uy * vy))) / 2;
    const Rpx = el.Radius() * bd.unitX;
    // the size of the text, estimated from its length (the measured size is not known when the label is first placed)
    const fs = (el.label && el.label.evalVisProp("fontsize")) || 18, nm = String(el.name || "");
    const sz = [0.58 * fs * Math.max(1, nm.length), 1.05 * fs];
    const along = Math.abs(wx) * sz[0] / 2 + Math.abs(wy) * sz[1] / 2, perp = Math.abs(wy) * sz[0] / 2 + Math.abs(wx) * sz[1] / 2;
    let d = Rpx + 4 + along;
    if (half > 1e-3 && half < Math.PI / 2 - 1e-3) d = Math.max(d, Math.min((perp + 2) / Math.tan(half), d + 40));
    return new JXG.Coords(JXG.COORDS_BY_USER, [O[1] + wx * d / bd.unitX, O[2] + wy * d / bd.unitY], bd);
  }
  Ctx.prototype.right = function (b, A, O, B, size = 0.3, o = {}) {   // right-angle square at O
    return this.curve(b, () => {
      const [ax, ay] = xy(A), [ox, oy] = xy(O), [bx, by] = xy(B);
      const u = [ax - ox, ay - oy], v = [bx - ox, by - oy];
      const lu = Math.hypot(...u) || 1, lv = Math.hypot(...v) || 1;
      const p = [ox + size * u[0] / lu, oy + size * u[1] / lu], q = [ox + size * v[0] / lv, oy + size * v[1] / lv];
      const r = [p[0] + q[0] - ox, p[1] + q[1] - oy];
      return [[p[0], r[0], q[0]], [p[1], r[1], q[1]]];
    }, Object.assign({ strokeColor: C.line, strokeWidth: 1.4 }, o));
  };
  Ctx.prototype.curve = function (b, f, o = {}) {   // f() returns [xs, ys]
    const cv = b.create("curve", [[0], [0]], Object.assign({ strokeColor: C.line, strokeWidth: 2, highlight: false }, o));
    cv.updateDataArray = function () { const [X, Y] = f(); this.dataX = X; this.dataY = Y; };
    return cv;
  };
  Ctx.prototype.ticks = function (b, P, Q, n = 1, o = {}) {   // equal-length marks on segment PQ
    return this.curve(b, () => {
      const [px, py] = xy(P), [qx, qy] = xy(Q);
      const L = Math.hypot(qx - px, qy - py) || 1, ux = (qx - px) / L, uy = (qy - py) / L;
      const mx = (px + qx) / 2, my = (py + qy) / 2, h = 0.13, gap = 0.09;
      const X = [], Y = [];
      for (let k = 0; k < n; k++) {
        const s = (k - (n - 1) / 2) * gap;
        X.push(mx + s * ux - h * uy, mx + s * ux + h * uy, NaN);
        Y.push(my + s * uy + h * ux, my + s * uy - h * ux, NaN);
      }
      return [X, Y];
    }, Object.assign({ strokeColor: C.ink, strokeWidth: 1.6 }, o));
  };
  Ctx.prototype.text = function (b, x, y, s, o = {}) {
    return b.create("text", [x, y, s], Object.assign({ fontSize: 15, fixed: true, color: C.ink, highlight: false,
      anchorX: "middle", anchorY: "middle", parse: false }, o));
  };
  // A label beside segment PQ. `side` is +1 (left of P→Q) or -1 (right), or a point (or [x, y]):
  // then the label goes on the side of PQ away from that point, wherever the points are dragged.
  Ctx.prototype.segText = function (b, P, Q, s, side = 1, o = {}) {
    const off = o.off ?? 0.32;
    const pos = () => {
      const [px, py] = xy(P), [qx, qy] = xy(Q), L = Math.hypot(qx - px, qy - py) || 1;
      let sd = side;
      if (typeof side !== "number") {
        const [rx, ry] = xy(typeof side === "function" ? side() : side);
        sd = (qx - px) * (ry - py) - (qy - py) * (rx - px) > 0 ? -1 : 1;
      }
      return [(px + qx) / 2 - sd * off * (qy - py) / L, (py + qy) / 2 + sd * off * (qx - px) / L];
    };
    return this.text(b, () => pos()[0], () => pos()[1], s, o);
  };

  // ---- build on demand
  function build(el) {
    const name = el.dataset.fig;
    if (!FIG[name]) { el.innerHTML = "<p class='geo-nojs'>Figura desconhecida: " + name + "</p>"; return; }
    const rebuild = () => {
      const ctx = new Ctx(el);
      ctx.boards.forEach((b) => JXG.JSXGraph.freeBoard(b));
      FIG[name](ctx, el.dataset.mode || "");     // mode "solution": the figure of a worked solution
      ctx.finish(() => { ctx.boards.forEach((b) => JXG.JSXGraph.freeBoard(b)); rebuild(); });
    };
    rebuild();
  }
  function start() {
    if (!window.JXG) return;
    JXG.Options.text.fontSize = 15;
    JXG.Options.text.cssDefaultStyle = "font-family: 'Source Serif 4', Georgia, serif;";
    JXG.Options.label.cssDefaultStyle = "font-family: 'Source Serif 4', Georgia, serif; font-style: italic;";
    const figs = document.querySelectorAll(".geo-fig[data-fig]");
    const io = "IntersectionObserver" in window ? new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { io.unobserve(e.target); build(e.target); } });
    }, { rootMargin: "300px" }) : null;
    figs.forEach((el) => {
      if (!FIG[el.dataset.fig]) return;   // a 3D figure: built by geometry-space.js
      if (io) io.observe(el); else build(el);
    });
  }
  window.GeoPlane = { FIG, start, C, Ctx, fmt, fdeg, D2R, xy, dist, deg, lerp, triArea, footOn };

  // =================================================================================
  //                                   THE FIGURES
  // =================================================================================

  // 3. Parallel lines and a transversal: alternate angles are equal ("the Z of Zorro").
  FIG["parallels"] = (g) => {
    const b = g.board([-5, 3.6, 5, -3.6]);
    const tilt = g.slider("inclinação de s:", -20, 20, 1, 0, (v) => v + "°");
    const R1 = g.fixed(b, -4.6, 1.4, "", { visible: false }), R2 = g.fixed(b, 4.6, 1.4, "", { visible: false });
    const r = g.line(b, R1, R2, { strokeWidth: 2 });
    const S0 = g.fixed(b, 0, -1.4, "", { visible: false });
    const S1 = g.at(b, () => [Math.cos(tilt.value * D2R), -1.4 + Math.sin(tilt.value * D2R)]);
    const s = g.line(b, S0, S1, { strokeWidth: 2 });
    g.text(b, 4.4, 1.75, "r", { fontSize: 18 });
    g.text(b, () => 4.4, () => -1.4 + 4.4 * Math.tan(tilt.value * D2R) - 0.35, "s", { fontSize: 18 });
    const T1 = g.free(b, -1.6, -3.1, ""), T2 = g.free(b, 1.4, 3.1, "");
    const t = g.line(b, T1, T2, { strokeColor: C.ink });
    const P = b.create("intersection", [t, r, 0], { name: "", size: 2.5, color: C.ink });
    const Q = b.create("intersection", [t, s, 0], { name: "", size: 2.5, color: C.ink });
    const L = g.at(b, () => [P.X() - 1.5, P.Y()]);
    const Rr = g.at(b, () => [Q.X() + 1.5 * Math.cos(tilt.value * D2R), Q.Y() + 1.5 * Math.sin(tilt.value * D2R)]);
    g.curve(b, () => [[L.X(), P.X(), Q.X(), Rr.X()], [L.Y(), P.Y(), Q.Y(), Rr.Y()]],
      { strokeColor: C.gold, strokeWidth: 7, strokeOpacity: 0.35 });
    g.angle(b, L, P, Q, "α", C.a, { radius: 0.75 });
    g.angle(b, Rr, Q, P, "θ", C.b, { radius: 0.75 });
    g.readout(() => {
      const al = deg(L, P, Q), th = deg(Rr, Q, P);
      const par = Math.abs(tilt.value) < 1e-9;
      return `<span class="a">α = ${fdeg(al)}</span>, <span class="b">θ = ${fdeg(th)}</span>. ` +
        (par ? "<span class='ok'>r ∥ s; logo, α = θ (o “Z”).</span>"
             : "<span class='bad'>r não é paralela a s, e α ≠ θ.</span>");
    });
  };

  // 4. The right angle: Pythagoras and complementary angles.
  FIG["right-angle"] = (g) => {
    const BB = [-1.6, 4.9, 6.6, -1.4];
    const b = g.board(BB);
    const A = g.fixed(b, 0, 0, "A", { label: { offset: [-16, -14] } });
    const ay = b.create("segment", [[0, 0.8], [0, 4.4]], { visible: false });
    const ax = b.create("segment", [[0.8, 0], [6.2, 0]], { visible: false });
    const B = g.glider(b, 0, 3, ay, "B", { label: { offset: [-18, 4] } });
    const Cc = g.glider(b, 4, 0, ax, "C", { label: { offset: [4, -14] } });
    const sq = [];
    const square = (P, Q, col) => sq.push(g.poly(b, [P, Q, g.at(b, () => { const [p, q] = [xy(P), xy(Q)]; return [q[0] - (q[1] - p[1]), q[1] + (q[0] - p[0])]; }),
      g.at(b, () => { const [p, q] = [xy(P), xy(Q)]; return [p[0] - (q[1] - p[1]), p[1] + (q[0] - p[0])]; })],
      { fillColor: col, fillOpacity: 0.18, borders: { strokeColor: col, strokeWidth: 1, highlight: false }, visible: false }));
    square(A, B, C.b); square(Cc, A, C.c); square(B, Cc, C.a);
    g.poly(b, [A, B, Cc], { fillOpacity: 0.12 });
    g.right(b, B, A, Cc);
    g.angle(b, Cc, B, A, "α", C.a, { radius: 0.55 });
    g.angle(b, A, Cc, B, "β", C.b, { radius: 0.55 });
    g.segText(b, A, B, "b", Cc, { fontSize: 17 });
    g.segText(b, Cc, A, "c", B, { fontSize: 17 });
    g.segText(b, B, Cc, "a", A, { fontSize: 17 });
    // the squares stick out of the triangle: zoom out to show them whole, and back in to hide them
    const fit = (on) => {
      if (!on) { b.setBoundingBox(BB, true); return; }
      const v = sq.flatMap((p) => p.vertices.slice(0, 4).map((q) => [q.X(), q.Y()]));
      let x0 = Math.min(...v.map((q) => q[0])) - 0.5, x1 = Math.max(...v.map((q) => q[0])) + 0.5;
      let y0 = Math.min(...v.map((q) => q[1])) - 0.5, y1 = Math.max(...v.map((q) => q[1])) + 0.5;
      const asp = (BB[2] - BB[0]) / (BB[1] - BB[3]);
      if ((x1 - x0) / (y1 - y0) < asp) { const e = ((y1 - y0) * asp - (x1 - x0)) / 2; x0 -= e; x1 += e; }
      else { const e = ((x1 - x0) / asp - (y1 - y0)) / 2; y0 -= e; y1 += e; }
      b.setBoundingBox([x0, y1, x1, y0], true);
    };
    g.button("Mostrar os quadrados sobre os lados", (on) => { sq.forEach((p) => p.setAttribute({ visible: on })); fit(on); b.fullUpdate(); }, true);
    g.readout(() => {
      const a = dist(B, Cc), bb = dist(A, B), c = dist(A, Cc), al = deg(Cc, B, A), be = deg(A, Cc, B);
      return `a² = ${fmt(a * a)}, &nbsp; b² + c² = ${fmt(bb * bb)} + ${fmt(c * c)} = ${fmt(bb * bb + c * c)}<br>` +
        `<span class="a">α = ${fdeg(al)}</span> + <span class="b">β = ${fdeg(be)}</span> = ${fdeg(al + be)}, &nbsp; ` +
        `sen α = ${fmt(Math.sin(al * D2R), 3)} = cos β = ${fmt(Math.cos(be * D2R), 3)}`;
    });
  };

  // 5. Notable angles 30°, 45°, 60°, and "the leg opposite 30° is half the hypotenuse".
  FIG["notable"] = (g) => {
    const b = g.board([-0.7, 3.5, 5.3, -0.8]);
    let phi = 30;
    const x = g.slider("x:", 0.8, 1.8, 0.05, 1.5, (v) => fmt(v, 2));
    const H = () => 2 * x.value;                       // hypotenuse BC
    const B = g.fixed(b, 0, 0, "B", { label: { offset: [-16, -12] } });
    const A = g.dep(b, () => H() * Math.cos(phi * D2R), () => 0, "A", { label: { offset: [4, -14] } });
    const Cc = g.dep(b, () => H() * Math.cos(phi * D2R), () => H() * Math.sin(phi * D2R), "C", { label: { offset: [6, 6] } });
    g.poly(b, [A, B, Cc], { fillOpacity: 0.15 });
    g.right(b, B, A, Cc, 0.25);
    g.angle(b, A, B, Cc, "", C.a, { radius: 0.7 });
    g.text(b, () => 1.0 * Math.cos(phi * D2R / 2), () => 1.0 * Math.sin(phi * D2R / 2), () => phi + "°", { color: C.a, fontSize: 14 });
    const s = Math.sqrt;
    const names = {
      30: ["x", "x√3", "2x"], 45: ["x", "x", "x√2"], 60: ["x√3", "x", "2x"],
    };
    g.segText(b, A, Cc, () => names[phi][0], B, { color: C.d, fontSize: 17, off: 0.42 });
    g.segText(b, B, A, () => names[phi][1], Cc, { fontSize: 17 });
    g.segText(b, B, Cc, () => names[phi][2], A, { fontSize: 17, off: 0.38 });
    g.choice(["30°", "45°", "60°"], 0, (i) => { phi = [30, 45, 60][i]; });
    g.readout(() => {
      const hyp = dist(B, Cc), opp = dist(A, Cc), adj = dist(A, B);
      return `ângulo B = ${phi}°: &nbsp; AC = ${fmt(opp)}, &nbsp; AB = ${fmt(adj)}, &nbsp; BC = ${fmt(hyp)}` +
        (phi === 30 ? `<br><span class="ok">AC = ${fmt(opp)} = BC/2: o cateto oposto a 30° é metade da hipotenusa.</span>`
          : phi === 45 ? `<br>Dois catetos iguais: o triângulo é meio quadrado, BC = AB·√2 (√2 ≈ ${fmt(s(2), 3)}).`
          : `<br>Agora AB = BC/2, porque o ângulo em C é 30°.`);
    });
  };

  // 6. Supplementary angles on the unit circle: sin α = sin β, cos α = −cos β.
  FIG["supplementary"] = (g) => {
    const b = g.board([-1.6, 1.45, 1.6, -1.25]);
    const O = g.fixed(b, 0, 0, "", { visible: false });
    g.line(b, [-1, 0], [1, 0], { strokeColor: C.aux, strokeWidth: 1, lastArrow: true, straightFirst: true, straightLast: false });
    g.line(b, [0, -1], [0, 1], { strokeColor: C.aux, strokeWidth: 1, lastArrow: true, straightFirst: true, straightLast: false });
    g.text(b, 1.48, -0.08, "cos", { fontSize: 13, color: C.aux });
    g.text(b, 0.12, 1.35, "sen", { fontSize: 13, color: C.aux });
    const circle = g.circ(b, O, 1, { strokeColor: C.line });
    const P = g.glider(b, Math.cos(40 * D2R), Math.sin(40 * D2R), circle, "", { size: 4.5 });
    const Pp = g.dep(b, () => -P.X(), () => P.Y(), "", { color: C.b, size: 3.5 });
    const E = g.fixed(b, 1, 0, "", { visible: false });
    g.seg(b, O, P, { strokeColor: C.a });
    g.seg(b, O, Pp, { strokeColor: C.b });
    g.seg(b, P, Pp, { strokeColor: C.aux, dash: 2, strokeWidth: 1.5 });
    g.seg(b, P, g.at(b, () => [P.X(), 0]), { strokeColor: C.a, dash: 2, strokeWidth: 1.5 });
    g.seg(b, Pp, g.at(b, () => [Pp.X(), 0]), { strokeColor: C.b, dash: 2, strokeWidth: 1.5 });
    b.create("angle", [E, O, P], { radius: 0.25, name: "α", fillColor: C.a, fillOpacity: 0.3, strokeColor: C.a,
      highlight: false, label: { fontSize: 15, color: C.a } });
    b.create("angle", [E, O, Pp], { radius: 0.42, name: "β", fillColor: C.b, fillOpacity: 0.15, strokeColor: C.b,
      highlight: false, label: { fontSize: 15, color: C.b } });
    g.readout(() => {
      let al = Math.atan2(P.Y(), P.X()) / D2R; if (al < 0) al += 360;
      const be = (180 - al + 360) % 360;
      return `<span class="a">α = ${fdeg(al)}</span>, <span class="b">β = 180° − α = ${fdeg(be)}</span><br>` +
        `sen α = ${fmt(Math.sin(al * D2R), 3)} = sen β = ${fmt(Math.sin(be * D2R), 3)}; &nbsp; ` +
        `cos α = ${fmt(Math.cos(al * D2R), 3)} = −cos β = ${fmt(-Math.cos(be * D2R), 3)}`;
    });
  };

  // 7. tan α = 1/2: draw legs x and 2x, then Pythagoras.
  FIG["tangent-half"] = (g) => {
    const b = g.board([-0.8, 3.0, 7.0, -0.9]);
    const x = g.slider("x:", 0.4, 1.4, 0.02, 1, (v) => fmt(v, 2));
    const A = g.fixed(b, 0, 0, "", { visible: false });
    const B = g.dep(b, () => 2 * x.value * 2, () => 0, "", { visible: false });
    const Cc = g.dep(b, () => 2 * x.value * 2, () => 2 * x.value, "", { visible: false });
    g.poly(b, [A, B, Cc], { fillOpacity: 0.15 });
    g.right(b, A, B, Cc, 0.25);
    g.angle(b, B, A, Cc, "α", C.a, { radius: 0.9 });
    g.segText(b, A, B, "2x", Cc, { fontSize: 17 });
    g.segText(b, B, Cc, "x", A, { fontSize: 17 });
    g.segText(b, A, Cc, "x√5", B, { fontSize: 17, color: C.d });
    g.readout(() => {
      const xx = x.value, hyp = Math.hypot(xx, 2 * xx);
      return `x = ${fmt(xx)}: &nbsp; tg α = x/(2x) = 1/2, &nbsp; hipotenusa = √(x² + 4x²) = x√5 = ${fmt(hyp)}<br>` +
        `<span class="ok">sen α = x/(x√5) = √5/5 ≈ ${fmt(xx / hyp, 4)}, &nbsp; cos α = 2x/(x√5) = 2√5/5 ≈ ${fmt(2 * xx / hyp, 4)}</span>` +
        ` <span class="step">(o mesmo para todo x)</span>`;
    });
  };

  // 8. The isosceles triangle: equal sides, equal base angles, and AH is altitude, median and bisector.
  FIG["isosceles"] = (g) => {
    const b = g.board([-4.2, 5.2, 4.2, -1.0]);
    const B = g.fixed(b, -3, 0, "B", { label: { offset: [-16, -10] } });
    const Cc = g.fixed(b, 3, 0, "C", { label: { offset: [6, -10] } });
    const H = g.fixed(b, 0, 0, "H", { label: { offset: [-4, -16] } });
    const axis = b.create("segment", [[0, 1.2], [0, 4.8]], { visible: false });
    const A = g.glider(b, 0, 3.6, axis, "A", { label: { offset: [8, 6] } });
    g.poly(b, [A, B, Cc], { fillOpacity: 0.12 });
    g.seg(b, A, H, { strokeColor: C.c, dash: 2 });
    g.right(b, A, H, Cc, 0.25);
    g.ticks(b, A, B, 2); g.ticks(b, A, Cc, 2);
    g.ticks(b, B, H, 1); g.ticks(b, H, Cc, 1);
    g.angle(b, Cc, B, A, "θ", C.b, { radius: 0.6 });
    g.angle(b, A, Cc, B, "θ", C.b, { radius: 0.6 });
    g.angle(b, B, A, H, "α", C.a, { radius: 0.55 });
    g.angle(b, H, A, Cc, "α", C.a, { radius: 0.75 });
    g.readout(() => `AB = AC = ${fmt(dist(A, B))}, &nbsp; <span class="b">∠B = ∠C = ${fdeg(deg(Cc, B, A))}</span>, &nbsp; ` +
      `BH = HC = ${fmt(dist(B, H))}, &nbsp; <span class="a">∠BAH = ∠HAC = ${fdeg(deg(B, A, H))}</span>, &nbsp; ∠AHB = 90°`);
  };

  // 9. Extending segments.
  FIG["extend"] = (g) => {
    // (1) a trapezoid: extending AB creates alternate angles
    const b1 = g.board([-4, 3.2, 4.2, -0.9], { title: "Trapézio ABCD, AB ∥ CD" });
    const top = b1.create("segment", [[-2.8, 2], [3.0, 2]], { visible: false });
    const A = g.glider(b1, -1.8, 2, top, "A", { label: { offset: [-4, 12] } });
    const B = g.glider(b1, 1.4, 2, top, "B", { label: { offset: [-4, 12] } });
    const Dd = g.fixed(b1, -3, 0, "D", { label: { offset: [-14, -10] } });
    const Cc = g.fixed(b1, 3, 0, "C", { label: { offset: [6, -10] } });
    g.poly(b1, [A, B, Cc, Dd], { fillOpacity: 0.12 });
    const ext = [
      g.line(b1, A, B, { strokeColor: C.aux, dash: 2, visible: false }),
      g.line(b1, Dd, Cc, { strokeColor: C.aux, dash: 2, visible: false }),
    ];
    const AL = g.at(b1, () => [A.X() - 1, 2]), BR = g.at(b1, () => [B.X() + 1, 2]);
    const DR = g.at(b1, () => [Dd.X() + 1, 0]), CL = g.at(b1, () => [Cc.X() - 1, 0]);
    const marks = [
      g.angle(b1, AL, A, Dd, "α", C.a, { radius: 0.5, visible: false }), g.angle(b1, DR, Dd, A, "α", C.a, { radius: 0.5 }),
      g.angle(b1, BR, B, Cc, "β", C.b, { radius: 0.5, visible: false }), g.angle(b1, CL, Cc, B, "β", C.b, { radius: 0.5 }),
    ];
    // (2) a quadrilateral with angles 60°, 90°, 90°: extend AB and DC to meet at E
    const b2 = g.board([-0.8, 3.7, 6.2, -0.9], { title: "∠A = 60°, ∠B = ∠D = 90°" });
    const D2 = g.fixed(b2, 0, 0, "D", { label: { offset: [-14, -10] } });
    const A2 = g.fixed(b2, 0, 3, "A", { label: { offset: [-14, 6] } });
    const u = [Math.sin(60 * D2R), -Math.cos(60 * D2R)];
    const ray = b2.create("segment", [[u[0] * 1.6, 3 + u[1] * 1.6], [u[0] * 5.2, 3 + u[1] * 5.2]], { visible: false });
    const B2 = g.glider(b2, u[0] * 3.5, 3 + u[1] * 3.5, ray, "B", { label: { offset: [6, 6] } });
    const C2 = g.dep(b2, () => B2.X() - B2.Y() * Math.tan(30 * D2R), () => 0, "C", { label: { offset: [-4, -16] } });
    const E = g.fixed(b2, 6 * u[0], 0, "E", { label: { offset: [4, -14] }, visible: false });
    g.poly(b2, [A2, B2, C2, D2], { fillOpacity: 0.12 });
    g.right(b2, A2, D2, C2, 0.25);
    g.right(b2, A2, B2, C2, 0.25);
    g.angle(b2, D2, A2, B2, "60°", C.a, { radius: 0.55 });
    const ext2 = [g.seg(b2, B2, E, { strokeColor: C.aux, dash: 2, visible: false }), g.seg(b2, C2, E, { strokeColor: C.aux, dash: 2, visible: false })];
    const tri = g.poly(b2, [A2, D2, E], { fillColor: C.hl, fillOpacity: 0.35, borders: { visible: false }, visible: false });
    const e30 = g.angle(b2, A2, E, D2, "30°", C.b, { radius: 0.9, visible: false });
    g.button("Prolongar os lados", (on) => {
      ext.forEach((l) => l.setAttribute({ visible: on }));
      marks[0].setAttribute({ visible: on }); marks[2].setAttribute({ visible: on });
      ext2.forEach((l) => l.setAttribute({ visible: on }));
      [tri, e30, E].forEach((m) => m.setAttribute({ visible: on }));
      tri.borders.forEach((s) => s.setAttribute({ visible: false }));
    }, true);
    g.readout(() => `Esquerda: o prolongamento de AB faz α em A igual a α em D, e β em B igual a β em C (ângulos alternos).` +
      `<br>Direita: ADE é um triângulo de ângulos 60°, 90°, 30°: DE = AD·√3 = ${fmt(3 * Math.sqrt(3))}, AE = 2·AD = 6 (com AD = 3).`);
  };

  // 10. Similar triangles: the Fuvest question (right angle between the two hypotenuses).
  FIG["similar"] = (g) => {
    const b = g.board([-0.8, 4.6, 8.4, -1.0]);
    const O = g.fixed(b, 0, 0, "", { visible: false });
    const yAxis = b.create("segment", [[0, 0.8], [0, 4.2]], { visible: false });
    const base = b.create("segment", [[0.8, 0], [4.6, 0]], { visible: false });
    const Y = g.glider(b, 0, 2.6, yAxis, "", {});
    const V = g.glider(b, 3.0, 0, base, "", {});
    const pBase = b.create("segment", [[5, 0], [8, 0]], { visible: false });
    const R0 = g.glider(b, 6.0, 0, pBase, "", {});
    const R1 = g.dep(b, () => R0.X(), () => (R0.X() - V.X()) * V.X() / Y.Y(), "", { visible: false });
    g.seg(b, [-0.5, 0], [8.2, 0], { strokeColor: C.aux, strokeWidth: 1.4 });
    g.poly(b, [O, V, Y], { fillColor: C.fillA, fillOpacity: 0.2 });
    g.poly(b, [V, R0, R1], { fillColor: C.fillB, fillOpacity: 0.2 });
    g.right(b, Y, O, V, 0.25); g.right(b, V, R0, R1, 0.25); g.right(b, Y, V, R1, 0.25);
    const OL = g.at(b, () => [V.X() - 1, 0]), OR = g.at(b, () => [V.X() + 1, 0]);
    g.angle(b, Y, V, OL, "α", C.a, { radius: 0.55 });
    g.angle(b, OR, V, R1, "β", C.b, { radius: 0.55 });
    g.angle(b, O, Y, V, "β", C.b, { radius: 0.5 });
    g.angle(b, V, R1, R0, "α", C.a, { radius: 0.5 });
    g.segText(b, O, Y, "y", V, { fontSize: 17 });
    g.segText(b, O, V, "x", Y, { fontSize: 17 });
    g.segText(b, V, R0, "p", R1, { fontSize: 17 });
    g.segText(b, R0, R1, "m", V, { fontSize: 17 });
    g.readout(() => {
      const x = V.X(), y = Y.Y(), p = R0.X() - V.X(), m = R1.Y();
      return `x = ${fmt(x)}, y = ${fmt(y)}, p = ${fmt(p)}, m = ${fmt(m)}: &nbsp; ` +
        `y/p = ${fmt(y / p, 3)} = x/m = ${fmt(x / m, 3)} <span class="ok">⟺ x/y = m/p = ${fmt(x / y, 3)}</span>`;
    });
  };

  // 11. The exterior angle of a triangle.
  FIG["exterior"] = (g) => {
    const b = g.board([-3.6, 4.0, 5.8, -1.2]);
    const A = g.free(b, -0.4, 3, "A", { label: { offset: [-6, 12] } });
    const B = g.free(b, -3, 0, "B", { label: { offset: [-16, -8] } });
    const Cc = g.free(b, 2, 0, "C", { label: { offset: [-2, -16] } });
    const X = g.at(b, () => lerp(B, Cc, 1 + 3 / Math.max(dist(B, Cc), 0.5)));
    g.poly(b, [A, B, Cc], { fillOpacity: 0.12 });
    g.seg(b, Cc, X, { strokeColor: C.aux, dash: 2 });
    g.angle(b, B, A, Cc, "α", C.a, { radius: 0.6 });
    g.angle(b, Cc, B, A, "β", C.b, { radius: 0.6 });
    g.angle(b, X, Cc, A, "θ", C.c, { radius: 0.7 });
    g.readout(() => {
      const al = deg(B, A, Cc), be = deg(Cc, B, A), th = deg(X, Cc, A);
      return `<span class="c">θ = ${fdeg(th)}</span> = <span class="a">α = ${fdeg(al)}</span> + <span class="b">β = ${fdeg(be)}</span>` +
        ` = ${fdeg(al + be)} &nbsp; (θ e o ângulo C somam 180°, assim como α + β + C)`;
    });
  };

  // 11. Worked example 1: ADE equilateral, AD = BD, ABC isosceles with base BC; find α = 40°.
  FIG["example-40"] = (g) => {
    const b = g.board([-0.8, 3.4, 6.8, -0.8]);
    const L = 6, a = 40 * D2R;
    const B = g.fixed(b, 0, 0, "B", { label: { offset: [-16, -8] } });
    const Cc = g.fixed(b, L, 0, "C", { label: { offset: [4, -10] } });
    const A = g.fixed(b, L / 2, (L / 2) * Math.tan(a), "A", { label: { offset: [-4, 12] } });
    const AB = dist(A, B), dd = AB / (2 * Math.cos(a));
    const Dd = g.fixed(b, dd, 0, "D", { label: { offset: [-4, -16] } });
    const AD = dist(A, Dd);
    const E = g.fixed(b, ...lerp(A, Cc, AD / dist(A, Cc)), "E", { label: { offset: [6, 6] } });
    g.poly(b, [A, B, Cc], { fillOpacity: 0.08 });
    g.poly(b, [A, Dd, E], { fillColor: C.hl, fillOpacity: 0.3, borders: { strokeColor: C.line, strokeWidth: 2 } });
    g.ticks(b, A, Dd, 2); g.ticks(b, B, Dd, 2);
    const steps = [
      ["Dados: ADE equilátero, AD = BD, AB = AC. Determine α = ∠BAD.", []],
      ["AD = BD: o triângulo ABD é isósceles; logo, ∠ABD = α.", [g.angle(b, Dd, B, A, "α", C.a, { radius: 0.7, visible: false })]],
      ["AB = AC: os ângulos da base de ABC são iguais; logo, ∠ACB = α.", [g.angle(b, A, Cc, B, "α", C.a, { radius: 0.7, visible: false })]],
      ["ADE é equilátero: ∠DAE = 60°.", [g.angle(b, Dd, A, E, "60°", C.b, { radius: 0.55, visible: false })]],
      ["No triângulo ABC: α + 60° + α + α = 180°; logo, 3α = 120° e <b>α = 40°</b>.", []],
    ];
    g.angle(b, B, A, Dd, "α", C.a, { radius: 0.75 });
    let k = 0;
    g.button("Próximo passo", () => {
      k = Math.min(k + 1, steps.length - 1);
      steps[k][1].forEach((m) => m.setAttribute({ visible: true }));
    });
    g.readout(() => steps.slice(0, k + 1).map((s, i) => (i ? `${i}) ` : "") + s[0]).join("<br>"));
  };

  // 11. Worked example 2: BC = BP = PQ = QA and AB = AC; then α = 180°/7.
  FIG["example-180-7"] = (g) => {
    const b = g.board([-0.6, 2.2, 7.6, -2.2]);
    const al = (180 / 7) * D2R, l = 2.6;
    const s = l / (2 * Math.sin(al / 2));
    const dir1 = [Math.cos(al / 2), Math.sin(al / 2)], dir2 = [Math.cos(al / 2), -Math.sin(al / 2)];
    const A = g.fixed(b, 0, 0, "A", { label: { offset: [-16, -4] } });
    const B = g.fixed(b, s * dir1[0], s * dir1[1], "B", { label: { offset: [4, 10] } });
    const Cc = g.fixed(b, s * dir2[0], s * dir2[1], "C", { label: { offset: [4, -12] } });
    const Q = g.fixed(b, l * dir1[0], l * dir1[1], "Q", { label: { offset: [-6, 12] } });
    const ap = 2 * l * Math.cos(al);
    const P = g.fixed(b, ap * dir2[0], ap * dir2[1], "P", { label: { offset: [-4, -16] } });
    g.poly(b, [A, B, Cc], { fillOpacity: 0.08 });
    g.seg(b, Q, P); g.seg(b, P, B);
    [[A, Q], [Q, P], [P, B], [B, Cc]].forEach(([X, Y]) => g.ticks(b, X, Y, 1));
    g.angle(b, Q, A, P, "α", C.a, { radius: 0.9 });
    const r = 0.45;
    const steps = [
      ["Dados: BC = BP = PQ = QA e AB = AC. Determine α.", []],
      ["QA = QP: ∠QPA = α, e ∠PQB é externo a PQA: ∠PQB = α + α = 2α.",
        [g.angle(b, Q, P, A, "α", C.a, { radius: r, visible: false }), g.angle(b, P, Q, B, "2α", C.b, { radius: r, visible: false })]],
      ["PQ = PB: o triângulo PQB é isósceles; logo, ∠PBQ = 2α.", [g.angle(b, Q, B, P, "2α", C.b, { radius: 0.75, visible: false })]],
      ["∠CPB é externo ao triângulo PBA: ∠CPB = α + 2α = 3α.", [g.angle(b, B, P, Cc, "3α", C.c, { radius: r, visible: false })]],
      ["BP = BC: o triângulo BPC é isósceles; logo, ∠PCB = 3α.", [g.angle(b, P, Cc, B, "3α", C.c, { radius: r, visible: false })]],
      ["AB = AC: ∠ABC = ∠ACB = 3α; logo, ∠PBC = 3α − 2α = α.", [g.angle(b, P, B, Cc, "α", C.a, { radius: 1.05, visible: false })]],
      ["Triângulo BPC: α + 3α + 3α = 180°; logo, <b>α = 180°/7</b>.", []],
    ];
    let k = 0;
    g.button("Próximo passo", () => {
      k = Math.min(k + 1, steps.length - 1);
      steps[k][1].forEach((m) => m.setAttribute({ visible: true }));
    });
    g.readout(() => steps.slice(0, k + 1).map((st, i) => (i ? `${i}) ` : "") + st[0]).join("<br>"));
  };

  // 12. Parallels as an initiative: in the "dart", θ = α + β + γ.
  FIG["dart"] = (g) => {
    const b = g.board([-4.2, 4.0, 4.2, -2.6]);
    const A = g.free(b, 0, 3.2, "A", { label: { offset: [-4, 12] } });
    const B = g.free(b, -3.4, -1.8, "B", { label: { offset: [-16, -8] } });
    const Dd = g.free(b, 3.4, -1.6, "D", { label: { offset: [6, -8] } });
    const Cc = g.free(b, 0.2, 0.2, "C", { label: { offset: [8, 6] } });
    g.poly(b, [A, B, Cc, Dd], { fillOpacity: 0.12 });
    g.angle(b, B, A, Dd, "α", C.a, { radius: 0.6 });
    g.angle(b, Cc, B, A, "β", C.b, { radius: 0.7 });
    g.angle(b, A, Dd, Cc, "γ", C.c, { radius: 0.7 });
    g.angle(b, B, Cc, Dd, "θ", C.d, { radius: 0.55, fillOpacity: 0.15 });
    const aux = [
      b.create("parallel", [A, Dd, Cc], { strokeColor: C.aux, dash: 2, strokeWidth: 1.4, visible: false, highlight: false }),
      b.create("parallel", [A, B, Cc], { strokeColor: C.aux, dash: 2, strokeWidth: 1.4, visible: false, highlight: false }),
    ];
    g.button("Traçar as paralelas por C", (on) => aux.forEach((l) => l.setAttribute({ visible: on })), true);
    g.readout(() => {
      const a = deg(B, A, Dd), be = deg(Cc, B, A), ga = deg(A, Dd, Cc), th = deg(B, Cc, Dd);
      const inside = triArea(A, B, Dd) > triArea(A, B, Cc) + triArea(A, Cc, Dd) + triArea(B, Cc, Dd) - 1e-9;
      return inside
        ? `<span class="d">θ = ${fdeg(th)}</span> = <span class="a">α</span> + <span class="b">β</span> + <span class="c">γ</span> = ` +
          `${fdeg(a)} + ${fdeg(be)} + ${fdeg(ga)} = ${fdeg(a + be + ga)}`
        : `<span class="bad">Mantenha C dentro do triângulo ABD (o quadrilátero deve ser côncavo em C).</span>`;
    });
  };

  // 12. Worked example: the parallel through Y in the trapezoid WZYX gives m = 3.7.
  FIG["trapezoid-37"] = (g) => {
    const sc = 0.62;
    const b = g.board([-0.7, 1.2, 6.6, -3.2]);
    const th = g.slider("θ:", 22, 66, 1, 40, (v) => v + "°");
    const T = () => th.value * D2R;
    const W = g.fixed(b, 0, 0, "W", { label: { offset: [-16, 6] } });
    const Z = g.fixed(b, 9.4 * sc, 0, "Z", { label: { offset: [6, 6] } });
    const X = g.dep(b, () => sc * 7.4 * Math.cos(T()) ** 2, () => -sc * 7.4 * Math.cos(T()) * Math.sin(T()), "X",
      { label: { offset: [-16, -10] } });
    const Y = g.dep(b, () => X.X() + 5.7 * sc, () => X.Y(), "Y", { label: { offset: [4, -14] } });
    const P = g.fixed(b, 5.7 * sc, 0, "P", { label: { offset: [-4, 12] }, visible: false });
    g.poly(b, [W, Z, Y, X], { fillOpacity: 0.12 });
    g.segText(b, W, Z, "9,4", X, { fontSize: 14 });
    g.segText(b, X, Y, "5,7", W, { fontSize: 14 });
    g.segText(b, Z, Y, "m", W, { fontSize: 17, color: C.d });
    const Wr = g.at(b, () => [1, 0]);
    g.angle(b, Wr, W, X, "θ", C.a, { radius: 0.55 });
    g.angle(b, X, Y, Z, "2θ", C.b, { radius: 0.45 });
    const extra = [
      P, g.seg(b, P, Y, { strokeColor: C.c, dash: 2, visible: false }),
      g.poly(b, [Z, P, Y], { fillColor: C.hl, fillOpacity: 0.4, visible: false, borders: { visible: false } }),
      g.angle(b, Z, P, Y, "θ", C.a, { radius: 0.4, visible: false }),
      g.angle(b, P, Y, Z, "θ", C.a, { radius: 0.62, visible: false }),
    ];
    g.button("Traçar a paralela a WX por Y", (on) => {
      extra.forEach((m) => m.setAttribute({ visible: on }));
      extra[2].borders.forEach((s) => s.setAttribute({ visible: false }));
    }, true);
    g.readout(() => `XY ∥ WZ, WZ = 9,4, XY = 5,7. WPYX é um paralelogramo: WP = 5,7 e ZP = 9,4 − 5,7 = 3,7. ` +
      `O triângulo ZPY tem dois ângulos θ; logo, <span class="ok">m = ZY = ZP = ${fmt(dist(Z, Y) / sc)}</span> para todo θ.`);
  };

  // 13. Perpendiculars.
  FIG["perpendiculars"] = (g) => {
    const b1 = g.board([-3.2, 4.4, 3.2, -0.9], { title: "1) Triângulo isósceles" });
    const B = g.fixed(b1, -2.4, 0, "B", { label: { offset: [-14, -8] } });
    const Cc = g.fixed(b1, 2.4, 0, "C", { label: { offset: [4, -8] } });
    const axis = b1.create("segment", [[0, 1], [0, 4]], { visible: false });
    const A = g.glider(b1, 0, 3, axis, "A", { label: { offset: [8, 4] } });
    const M = g.fixed(b1, 0, 0, "M", { label: { offset: [-4, -16] } });
    g.poly(b1, [A, B, Cc], { fillOpacity: 0.12 });
    g.seg(b1, A, M, { strokeColor: C.c, dash: 2 }); g.right(b1, A, M, Cc, 0.25);
    g.ticks(b1, B, M, 1); g.ticks(b1, M, Cc, 1); g.ticks(b1, A, B, 2); g.ticks(b1, A, Cc, 2);

    const b2 = g.board([-3.2, 2.9, 3.2, -1.0], { title: "2) Trapézio isósceles" });
    const aS = g.slider("a:", 0.6, 3.2, 0.1, 1.8, (v) => fmt(v, 1));
    const bS = g.slider("b:", 3.4, 5.6, 0.1, 5.0, (v) => fmt(v, 1));
    const h = 1.9;
    const P1 = g.dep(b2, () => -bS.value / 2, () => 0), P2 = g.dep(b2, () => bS.value / 2, () => 0);
    const P3 = g.dep(b2, () => aS.value / 2, () => h), P4 = g.dep(b2, () => -aS.value / 2, () => h);
    const F1 = g.dep(b2, () => -aS.value / 2, () => 0), F2 = g.dep(b2, () => aS.value / 2, () => 0);
    g.poly(b2, [P1, P2, P3, P4], { fillOpacity: 0.12 });
    g.seg(b2, P4, F1, { strokeColor: C.c, dash: 2 }); g.seg(b2, P3, F2, { strokeColor: C.c, dash: 2 });
    g.right(b2, P4, F1, P2, 0.2); g.right(b2, P3, F2, P1, 0.2);
    g.segText(b2, P4, P3, "a", P1, { fontSize: 16 });
    g.segText(b2, P1, F1, "(b−a)/2", P4, { fontSize: 13, color: C.d, off: 0.38 });
    g.segText(b2, F2, P2, "(b−a)/2", P3, { fontSize: 13, color: C.d, off: 0.38 });

    const b3 = g.board([-3.2, 3.2, 3.2, -2.0], { title: "3) Distância de um ponto a uma reta" });
    const R1 = g.free(b3, -2.6, -1.3, ""), R2 = g.free(b3, 2.6, 0.4, "");
    const r = g.line(b3, R1, R2, { strokeWidth: 2 });
    const P = g.free(b3, -0.6, 2.2, "P", { label: { offset: [-16, 4] } });
    const Ft = g.dep(b3, () => footOn(P, R1, R2)[0], () => footOn(P, R1, R2)[1], "A", { label: { offset: [8, -14] } });
    g.seg(b3, P, Ft, { strokeColor: C.c, strokeWidth: 2.4 });
    g.right(b3, P, Ft, R2, 0.22);
    g.text(b3, 2.75, 0.85, "r", { fontSize: 17 });
    g.readout(() => `1) AM é altura, mediana e bissetriz. &nbsp; 2) Os dois pedaços laterais medem (b − a)/2 = ${fmt((bS.value - aS.value) / 2)}. ` +
      `&nbsp; 3) PA = ${fmt(dist(P, Ft))} é a distância de P a r.`);
  };

  // 14. A parallel to one side cuts off a similar triangle.
  FIG["parallel-cut"] = (g) => {
    const b = g.board([-3.6, 4.2, 3.8, -0.9]);
    const k = g.slider("AP/AB:", 0.1, 0.95, 0.01, 0.45, (v) => fmt(v, 2));
    const A = g.free(b, -0.4, 3.6, "A", { label: { offset: [-6, 12] } });
    const B = g.free(b, -3, 0, "B", { label: { offset: [-16, -8] } });
    const Cc = g.free(b, 3, 0, "C", { label: { offset: [4, -10] } });
    const P = g.dep(b, () => lerp(A, B, k.value)[0], () => lerp(A, B, k.value)[1], "P", { label: { offset: [-18, 4] } });
    const Q = g.dep(b, () => lerp(A, Cc, k.value)[0], () => lerp(A, Cc, k.value)[1], "Q", { label: { offset: [8, 4] } });
    g.poly(b, [A, B, Cc], { fillOpacity: 0.08 });
    g.poly(b, [A, P, Q], { fillColor: C.hl, fillOpacity: 0.45 });
    g.line(b, P, Q, { strokeColor: C.c, dash: 2 });
    g.angle(b, Q, P, A, "", C.a, { radius: 0.4 }); g.angle(b, Cc, B, A, "", C.a, { radius: 0.4 });
    g.angle(b, A, Q, P, "", C.b, { radius: 0.4 }); g.angle(b, A, Cc, B, "", C.b, { radius: 0.4 });
    g.readout(() => `r ∥ BC ⇒ triângulo APQ ∼ triângulo ABC: &nbsp; AP/AB = ${fmt(dist(A, P) / dist(A, B), 3)}, ` +
      `AQ/AC = ${fmt(dist(A, Q) / dist(A, Cc), 3)}, PQ/BC = ${fmt(dist(P, Q) / dist(B, Cc), 3)}`);
  };

  // 15. Midpoint likes another midpoint: the midsegment theorem.
  FIG["midsegment"] = (g) => {
    const b = g.board([-3.6, 4.2, 3.8, -0.9]);
    const A = g.free(b, -0.6, 3.6, "A", { label: { offset: [-6, 12] } });
    const B = g.free(b, -3, 0, "B", { label: { offset: [-16, -8] } });
    const Cc = g.free(b, 3, 0.2, "C", { label: { offset: [4, -10] } });
    const M = b.create("midpoint", [A, B], { name: "M", size: 3, color: C.c, label: { offset: [-18, 4], fontSize: 16 } });
    const N = b.create("midpoint", [A, Cc], { name: "N", size: 3, color: C.c, label: { offset: [8, 4], fontSize: 16 } });
    g.poly(b, [A, B, Cc], { fillOpacity: 0.1 });
    g.seg(b, M, N, { strokeColor: C.c, strokeWidth: 3 });
    g.ticks(b, A, M, 1); g.ticks(b, M, B, 1); g.ticks(b, A, N, 2); g.ticks(b, N, Cc, 2);
    g.readout(() => {
      const sl1 = Math.atan2(N.Y() - M.Y(), N.X() - M.X()), sl2 = Math.atan2(Cc.Y() - B.Y(), Cc.X() - B.X());
      return `MN ∥ BC (ambas a ${fdeg(sl1 / D2R)}, ${fdeg(sl2 / D2R)}), &nbsp; <span class="ok">MN = ${fmt(dist(M, N))} = BC/2 = ${fmt(dist(B, Cc) / 2)}</span>`;
    });
  };

  // 16. Four formulas: equilateral triangle and square.
  FIG["formulas"] = (g) => {
    const L = g.slider("ℓ:", 1, 3, 0.05, 2.4, (v) => fmt(v, 2));
    const b1 = g.board([-0.6, 3.0, 3.6, -0.6], { title: "Triângulo equilátero" });
    const T1 = g.fixed(b1, 0, 0, "", { visible: false });
    const T2 = g.dep(b1, () => L.value, () => 0, "", { visible: false });
    const T3 = g.dep(b1, () => L.value / 2, () => L.value * Math.sqrt(3) / 2, "", { visible: false });
    const Hf = g.dep(b1, () => L.value / 2, () => 0, "", { visible: false });
    g.poly(b1, [T1, T2, T3], { fillOpacity: 0.15 });
    g.seg(b1, T3, Hf, { strokeColor: C.c, dash: 2 }); g.right(b1, T3, Hf, T2, 0.18);
    g.segText(b1, T1, T3, "ℓ", T2, { fontSize: 16 }); g.segText(b1, T3, T2, "ℓ", T1, { fontSize: 16 });
    g.segText(b1, T1, T2, "ℓ", T3, { fontSize: 16 });
    g.segText(b1, T3, Hf, "h", T2, { fontSize: 16, color: C.c, off: 0.22 });
    const b2 = g.board([-0.6, 3.6, 3.6, -0.6], { title: "Quadrado" });
    const S1 = g.fixed(b2, 0, 0, "", { visible: false });
    const S2 = g.dep(b2, () => L.value, () => 0, "", { visible: false });
    const S3 = g.dep(b2, () => L.value, () => L.value, "", { visible: false });
    const S4 = g.dep(b2, () => 0, () => L.value, "", { visible: false });
    g.poly(b2, [S1, S2, S3, S4], { fillOpacity: 0.15 });
    g.seg(b2, S4, S2, { strokeColor: C.d, strokeWidth: 2.4 });
    g.right(b2, S2, S1, S4, 0.2);
    g.segText(b2, S1, S2, "ℓ", S4, { fontSize: 16 }); g.segText(b2, S1, S4, "ℓ", S2, { fontSize: 16 });
    g.segText(b2, S4, S2, "d", S1, { fontSize: 16, color: C.d, off: 0.25 });
    g.readout(() => {
      const l = L.value;
      return `Triângulo: h = ℓ√3/2 = ${fmt(l * Math.sqrt(3) / 2)}, &nbsp; área = ℓ²√3/4 = ${fmt(l * l * Math.sqrt(3) / 4)}` +
        `<br>Quadrado: área = ℓ² = ${fmt(l * l)}, &nbsp; d = ℓ√2 = ${fmt(l * Math.SQRT2)}`;
    });
  };

  // 17. Metric relations in the right triangle: h² = m·n and b·c = a·h.
  FIG["right-relations"] = (g) => {
    const b = g.board([-3.8, 3.6, 3.8, -1.0]);
    const B = g.fixed(b, -3, 0, "B", { label: { offset: [-16, -8] } });
    const Cc = g.fixed(b, 3, 0, "C", { label: { offset: [4, -10] } });
    const hid = (x, y) => b.create("point", [x, y], { visible: false, fixed: true, withLabel: false });
    const semi = b.create("arc", [hid(0, 0), hid(3, 0), hid(-3, 0)], { strokeColor: C.aux, dash: 2, strokeWidth: 1.2, highlight: false });
    const A = g.glider(b, -1.2, Math.sqrt(9 - 1.44), semi, "A", { label: { offset: [-4, 12] } });
    const H = g.dep(b, () => A.X(), () => 0, "H", { label: { offset: [-4, -16] } });
    g.poly(b, [A, B, Cc], { fillOpacity: 0.12 });
    g.seg(b, A, H, { strokeColor: C.c, dash: 2 });
    g.right(b, B, A, Cc, 0.25); g.right(b, A, H, Cc, 0.22);
    g.segText(b, A, H, "h", Cc, { fontSize: 16, color: C.c, off: 0.22 });
    g.segText(b, B, H, "m", A, { fontSize: 16 }); g.segText(b, H, Cc, "n", A, { fontSize: 16 });
    g.segText(b, B, A, "c", Cc, { fontSize: 16 }); g.segText(b, A, Cc, "b", B, { fontSize: 16 });
    g.readout(() => {
      const h = A.Y(), m = dist(B, H), n = dist(H, Cc), a = 6, bb = dist(A, Cc), c = dist(A, B);
      return `h² = ${fmt(h * h)} = m·n = ${fmt(m)}·${fmt(n)} = ${fmt(m * n)} &nbsp;&nbsp; b·c = ${fmt(bb * c)} = a·h = ${fmt(a * h)}` +
        ` <span class="step">(A se move na semicircunferência de diâmetro BC; logo, o ângulo em A continua reto)</span>`;
    });
  };

  // 18. The law of cosines and the law of sines.
  FIG["laws"] = (g) => {
    const b = g.board([-3.6, 3.9, 4.2, -1.0]);
    const A = g.free(b, -2.6, 0, "A", { label: { offset: [-16, -8] } });
    const B = g.free(b, 3.2, 0, "B", { label: { offset: [4, -10] } });
    const Cc = g.free(b, -0.2, 3.0, "C", { label: { offset: [-4, 12] } });
    g.poly(b, [A, B, Cc], { fillOpacity: 0.12 });
    g.angle(b, B, A, Cc, "θ", C.a, { radius: 0.6 });
    g.angle(b, Cc, B, A, "β", C.b, { radius: 0.6 });
    g.segText(b, B, Cc, "a", A, { fontSize: 17, color: C.d });
    g.segText(b, Cc, A, "b", B, { fontSize: 17 });
    g.segText(b, A, B, "c", Cc, { fontSize: 17 });
    g.readout(() => {
      const a = dist(B, Cc), bb = dist(A, Cc), c = dist(A, B), th = deg(B, A, Cc), be = deg(Cc, B, A);
      return `Lei dos cossenos: a² = ${fmt(a * a)} = b² + c² − 2bc·cos θ = ${fmt(bb * bb + c * c - 2 * bb * c * Math.cos(th * D2R))}` +
        `<br>Lei dos senos: a / sen θ = ${fmt(a / Math.sin(th * D2R), 3)} = b / sen β = ${fmt(bb / Math.sin(be * D2R), 3)}`;
    });
  };

  // 19. The law of sines ends with 2R.
  FIG["sines-2R"] = (g) => {
    const b = g.board([-3.4, 3.4, 3.4, -3.4]);
    const O = g.fixed(b, 0, 0, "", { size: 2 });
    const circle = g.circ(b, O, 2.6, { strokeColor: C.aux });
    const A = g.glider(b, -0.6, 2.53, circle, "A", { label: { offset: [-4, 12] } });
    const B = g.glider(b, -2.4, -1.0, circle, "B", { label: { offset: [-16, -8] } });
    const Cc = g.glider(b, 2.3, -1.2, circle, "C", { label: { offset: [6, -8] } });
    g.poly(b, [A, B, Cc], { fillOpacity: 0.12 });
    g.seg(b, O, A, { strokeColor: C.c, dash: 2 });
    g.segText(b, O, A, "R", B, { fontSize: 15, color: C.c, off: 0.22 });
    g.segText(b, B, Cc, "a", A, { fontSize: 16 }); g.segText(b, Cc, A, "b", B, { fontSize: 16 });
    g.segText(b, A, B, "c", Cc, { fontSize: 16 });
    g.readout(() => {
      const a = dist(B, Cc), bb = dist(A, Cc), c = dist(A, B);
      const sA = Math.sin(deg(B, A, Cc) * D2R), sB = Math.sin(deg(A, B, Cc) * D2R), sC = Math.sin(deg(A, Cc, B) * D2R);
      return `a/sen A = ${fmt(a / sA, 3)}, &nbsp; b/sen B = ${fmt(bb / sB, 3)}, &nbsp; c/sen C = ${fmt(c / sC, 3)}, &nbsp; ` +
        `<span class="ok">2R = ${fmt(5.2, 3)}</span>`;
    });
  };

  // 20. The internal bisector theorem (and the Fuvest question 30, 40, 56).
  FIG["bisector"] = (g) => {
    const b = g.board([-0.7, 3.0, 6.3, -0.9]);
    const B = g.free(b, 0, 0, "B", { label: { offset: [-16, -8] } });
    const Cc = g.free(b, 5.6, 0, "C", { label: { offset: [4, -10] } });
    const A = g.free(b, 2.175, 2.066, "A", { label: { offset: [-4, 12] } });
    const S = g.dep(b, () => lerp(B, Cc, dist(A, B) / (dist(A, B) + dist(A, Cc)))[0],
      () => lerp(B, Cc, dist(A, B) / (dist(A, B) + dist(A, Cc)))[1], "S", { label: { offset: [-4, -16] } });
    g.poly(b, [A, B, Cc], { fillOpacity: 0.12 });
    g.seg(b, A, S, { strokeColor: C.c, strokeWidth: 2.2 });
    g.angle(b, B, A, S, "α", C.a, { radius: 0.55 }); g.angle(b, S, A, Cc, "α", C.a, { radius: 0.75 });
    g.segText(b, A, B, "c", Cc, { fontSize: 16 }); g.segText(b, Cc, A, "b", B, { fontSize: 16 });
    g.segText(b, B, S, "m", A, { fontSize: 16 }); g.segText(b, S, Cc, "n", A, { fontSize: 16 });
    g.readout(() => {
      const c = 10 * dist(A, B), bb = 10 * dist(A, Cc), m = 10 * dist(B, S), n = 10 * dist(S, Cc);
      return `c = ${fmt(c, 1)}, b = ${fmt(bb, 1)}, m = BS = ${fmt(m, 1)}, n = SC = ${fmt(n, 1)}: &nbsp; ` +
        `<span class="ok">c/m = ${fmt(c / m, 3)} = b/n = ${fmt(bb / n, 3)}</span>, &nbsp; c/b = m/n = ${fmt(c / bb, 3)}` +
        `<br><span class="step">No início: c = 30, b = 40, BC = 56; logo, 3x + 4x = 56, x = 8 e BS = 24.</span>`;
    });
  };

  // 21. Five ways to the area of a triangle.
  FIG["areas"] = (g) => {
    const b1 = g.board([-3.4, 3.8, 3.6, -1.0], { title: "1)–3) A mesma área, três fórmulas" });
    const A = g.free(b1, -0.4, 3.0, "A", { label: { offset: [-4, 12] } });
    const B = g.free(b1, -2.8, 0, "B", { label: { offset: [-16, -8] } });
    const Cc = g.free(b1, 3, 0, "C", { label: { offset: [4, -10] } });
    const Hh = g.dep(b1, () => footOn(A, B, Cc)[0], () => footOn(A, B, Cc)[1], "", { size: 2 });
    g.poly(b1, [A, B, Cc], { fillOpacity: 0.18 });
    g.line(b1, B, Cc, { strokeColor: C.aux, strokeWidth: 1, dash: 1 });
    g.seg(b1, A, Hh, { strokeColor: C.c, dash: 2 }); g.right(b1, A, Hh, Cc, 0.2);
    g.angle(b1, B, Cc, A, "θ", C.a, { radius: 0.55 });
    g.segText(b1, A, Hh, "h", Cc, { fontSize: 15, color: C.c, off: 0.22 });
    g.segText(b1, B, Cc, "a", A, { fontSize: 16, off: 0.36 }); g.segText(b1, Cc, A, "b", B, { fontSize: 16 }); g.segText(b1, A, B, "c", Cc, { fontSize: 16 });

    const b2 = g.board([-3.4, 3.8, 3.6, -1.0], { title: "4) Mesma altura: razão das áreas = razão das bases" });
    const A2 = g.fixed(b2, -0.4, 3, "A", { label: { offset: [-4, 12] } });
    const B2 = g.fixed(b2, -2.8, 0, "B", { label: { offset: [-16, -8] } });
    const C2 = g.fixed(b2, 3, 0, "C", { label: { offset: [4, -10] } });
    const bc = b2.create("segment", [[-2.6, 0], [2.8, 0]], { visible: false });
    const D2 = g.glider(b2, 0.6, 0, bc, "D", { label: { offset: [-4, -16] } });
    g.poly(b2, [A2, B2, D2], { fillColor: C.fillA, fillOpacity: 0.35 });
    g.poly(b2, [A2, D2, C2], { fillColor: C.fillB, fillOpacity: 0.35 });
    g.segText(b2, B2, D2, "x", A2, { fontSize: 15 }); g.segText(b2, D2, C2, "y", A2, { fontSize: 15 });

    const b3 = g.board([-0.4, 3.6, 7.8, -0.7], { title: "5) Triângulos semelhantes: razão das áreas = k²" });
    const k = g.slider("k:", 0.3, 1.6, 0.05, 0.6, (v) => fmt(v, 2));
    const t = [[0, 0], [2.6, 0], [0.9, 2.1]];
    const P = t.map((p, i) => g.fixed(b3, p[0], p[1], "ABC"[i], { size: 1.5, label: { offset: i === 2 ? [-4, 12] : [-6, -14] } }));
    const Q = t.map((p, i) => g.dep(b3, () => 3.6 + k.value * p[0], () => k.value * p[1], "DEF"[i],
      { size: 1.5, label: { offset: i === 2 ? [-4, 12] : [-6, -14] } }));
    g.poly(b3, P, { fillColor: C.area, fillOpacity: 0.3 });
    g.poly(b3, Q, { fillColor: C.fillC, fillOpacity: 0.4 });
    g.readout(() => {
      const a = dist(B, Cc), bb = dist(A, Cc), c = dist(A, B), h = dist(A, Hh), th = deg(B, Cc, A), p = (a + bb + c) / 2;
      const S1 = triArea(A2, B2, D2), S2 = triArea(A2, D2, C2);
      const kk = k.value;
      return `1) a·h/2 = ${fmt(a * h / 2)} &nbsp; 2) ½·a·b·sen θ = ${fmt(a * bb * Math.sin(th * D2R) / 2)} &nbsp; ` +
        `3) Heron √(p(p−a)(p−b)(p−c)) = ${fmt(Math.sqrt(Math.max(0, p * (p - a) * (p - bb) * (p - c))))}` +
        `<br>4) Área(ABD)/Área(ADC) = ${fmt(S1 / S2, 3)} = x/y = ${fmt(dist(B2, D2) / dist(D2, C2), 3)} ` +
        `&nbsp; 5) Área(DEF)/Área(ABC) = ${fmt(kk * kk, 3)} = k²`;
    });
  };

  // 22. Trapezoid: the midsegment is the average of the bases.
  FIG["trapezoid-mid"] = (g) => {
    const b = g.board([-3.8, 3.5, 3.8, -0.9]);
    const Dd = g.fixed(b, -3.2, 0, "D", { label: { offset: [-16, -8] } });
    const Cc = g.free(b, 3.2, 0, "C", { label: { offset: [4, -10] } });
    const A = g.free(b, -1.6, 2.6, "A", { label: { offset: [-6, 12] } });
    const par = b.create("parallel", [Dd, Cc, A], { visible: false });
    const B = g.glider(b, 1.4, 2.6, par, "B", { label: { offset: [4, 12] } });
    const M = b.create("midpoint", [A, Dd], { name: "M", size: 3, color: C.c, label: { offset: [-20, 2], fontSize: 16 } });
    const N = b.create("midpoint", [B, Cc], { name: "N", size: 3, color: C.c, label: { offset: [8, 2], fontSize: 16 } });
    g.poly(b, [A, B, Cc, Dd], { fillOpacity: 0.12 });
    g.seg(b, M, N, { strokeColor: C.c, strokeWidth: 3 });
    g.ticks(b, A, M, 1); g.ticks(b, M, Dd, 1); g.ticks(b, B, N, 2); g.ticks(b, N, Cc, 2);
    g.readout(() => `<span class="ok">MN = ${fmt(dist(M, N))} = (AB + CD)/2 = (${fmt(dist(A, B))} + ${fmt(dist(Cc, Dd))})/2</span>, e MN ∥ AB ∥ CD`);
  };

  // 23. Parallelograms.
  FIG["parallelogram"] = (g) => {
    const b = g.board([-3.6, 3.4, 4.6, -0.9]);
    const A = g.free(b, -3, 0, "A", { label: { offset: [-16, -8] } });
    const B = g.free(b, 1.6, 0, "B", { label: { offset: [4, -10] } });
    const Dd = g.free(b, -1.6, 2.6, "D", { label: { offset: [-16, 6] } });
    const Cc = g.dep(b, () => B.X() + Dd.X() - A.X(), () => B.Y() + Dd.Y() - A.Y(), "C", { label: { offset: [6, 6] } });
    const M = g.dep(b, () => (A.X() + Cc.X()) / 2, () => (A.Y() + Cc.Y()) / 2, "M", { label: { offset: [-4, -16] } });
    g.poly(b, [A, B, Cc, Dd], { fillOpacity: 0.12 });
    g.seg(b, A, Cc, { strokeColor: C.aux, strokeWidth: 1.4 }); g.seg(b, B, Dd, { strokeColor: C.aux, strokeWidth: 1.4 });
    g.ticks(b, A, M, 1); g.ticks(b, M, Cc, 1); g.ticks(b, B, M, 2); g.ticks(b, M, Dd, 2);
    g.angle(b, B, A, Dd, "α", C.a, { radius: 0.5 }); g.angle(b, Dd, Cc, B, "α", C.a, { radius: 0.5 });
    g.angle(b, A, Dd, Cc, "β", C.b, { radius: 0.5 }); g.angle(b, Cc, B, A, "β", C.b, { radius: 0.5 });
    g.readout(() => {
      const al = deg(B, A, Dd), be = deg(A, Dd, Cc);
      return `<span class="a">α = ${fdeg(al)}</span> (em A e C), <span class="b">β = ${fdeg(be)}</span> (em B e D), ` +
        `α + β = ${fdeg(al + be)}. &nbsp; AM = MC = ${fmt(dist(A, M))}, BM = MD = ${fmt(dist(B, M))}`;
    });
  };

  // 24. Rhombus: perpendicular diagonals that bisect the angles; area = AC·BD/2.
  FIG["rhombus"] = (g) => {
    const b = g.board([-3.6, 3.3, 3.6, -3.3]);
    const O = g.fixed(b, 0, 0, "", { size: 2 });
    const ya = b.create("segment", [[0, 0.5], [0, 3]], { visible: false });
    const xa = b.create("segment", [[0.5, 0], [3.2, 0]], { visible: false });
    const A = g.glider(b, 0, 2.6, ya, "A", { label: { offset: [-4, 12] } });
    const B = g.glider(b, 1.6, 0, xa, "B", { label: { offset: [6, -4] } });
    const Cc = g.dep(b, () => 0, () => -A.Y(), "C", { label: { offset: [-4, -16] } });
    const Dd = g.dep(b, () => -B.X(), () => 0, "D", { label: { offset: [-18, -4] } });
    g.poly(b, [A, B, Cc, Dd], { fillOpacity: 0.12 });
    g.seg(b, A, Cc, { strokeColor: C.aux }); g.seg(b, B, Dd, { strokeColor: C.aux });
    g.right(b, A, O, B, 0.22);
    g.angle(b, Dd, A, O, "α", C.a, { radius: 0.5 }); g.angle(b, O, A, B, "α", C.a, { radius: 0.7 });
    g.angle(b, A, Dd, O, "β", C.b, { radius: 0.5 }); g.angle(b, O, Dd, Cc, "β", C.b, { radius: 0.7 });
    g.readout(() => {
      const d1 = dist(A, Cc), d2 = dist(B, Dd);
      return `AC ⊥ BD, as diagonais são bissetrizes dos ângulos, lado = ${fmt(dist(A, B))}. &nbsp; ` +
        `<span class="ok">Área = AC·BD/2 = ${fmt(d1)}·${fmt(d2)}/2 = ${fmt(d1 * d2 / 2)}</span>`;
    });
  };

  // 25. Square: also a rhombus, so area = d·d/2.
  FIG["square"] = (g) => {
    const b = g.board([-0.8, 3.6, 3.6, -0.8]);
    const A = g.fixed(b, 0, 2.6, "A", { label: { offset: [-16, 6] } });
    const ax = b.create("segment", [[0.6, 2.6], [3.2, 2.6]], { visible: false });
    const B = g.glider(b, 2.6, 2.6, ax, "B", { label: { offset: [6, 6] } });
    const l = () => B.X();
    const Cc = g.dep(b, () => l(), () => 2.6 - l(), "C", { label: { offset: [6, -10] } });
    const Dd = g.dep(b, () => 0, () => 2.6 - l(), "D", { label: { offset: [-16, -10] } });
    g.poly(b, [A, B, Cc, Dd], { fillOpacity: 0.12 });
    g.seg(b, A, Cc, { strokeColor: C.d }); g.seg(b, B, Dd, { strokeColor: C.d });
    g.right(b, B, A, Dd, 0.22);
    g.readout(() => `ℓ = ${fmt(l())}: &nbsp; ℓ² = ${fmt(l() * l())} = AC·BD/2 = ${fmt(dist(A, Cc))}·${fmt(dist(B, Dd))}/2 = ` +
      `${fmt(dist(A, Cc) * dist(B, Dd) / 2)}`);
  };

  // 26. Rectangles; the median to the hypotenuse is half the hypotenuse.
  FIG["rectangle"] = (g) => {
    const b = g.board([-0.9, 3.4, 5.6, -0.9]);
    const Dd = g.fixed(b, 0, 0, "D", { label: { offset: [-16, -8] } });
    const xa = b.create("segment", [[0.8, 0], [5.2, 0]], { visible: false });
    const ya = b.create("segment", [[0, 0.6], [0, 3.0]], { visible: false });
    const Cc = g.glider(b, 4.4, 0, xa, "C", { label: { offset: [4, -10] } });
    const A = g.glider(b, 0, 2.4, ya, "A", { label: { offset: [-16, 6] } });
    const B = g.dep(b, () => Cc.X(), () => A.Y(), "B", { label: { offset: [6, 6] } });
    const M = g.dep(b, () => Cc.X() / 2, () => A.Y() / 2, "M", { label: { offset: [-4, -18] } });
    g.poly(b, [A, B, Cc, Dd], { fillOpacity: 0.1 });
    g.poly(b, [A, B, Dd], { fillColor: C.hl, fillOpacity: 0.35, borders: { visible: false } });
    g.seg(b, A, Cc, { strokeColor: C.aux }); g.seg(b, B, Dd, { strokeColor: C.aux });
    g.seg(b, A, M, { strokeColor: C.c, strokeWidth: 2.6 });
    g.right(b, B, A, Dd, 0.22);
    g.ticks(b, A, M, 1); g.ticks(b, B, M, 1); g.ticks(b, M, Dd, 1); g.ticks(b, M, Cc, 1);
    g.readout(() => `AC = BD = ${fmt(dist(A, Cc))}, e M é o ponto médio de ambas. &nbsp; ` +
      `No triângulo retângulo ABD: <span class="ok">AM = ${fmt(dist(A, M))} = BD/2</span>`);
  };

  // 27. Polygons: diagonals, sums of angles, and the regular hexagon.
  FIG["polygons"] = (g) => {
    const b1 = g.board([-2.6, 2.6, 2.6, -2.6], { title: "Diagonais e somas dos ângulos" });
    let objs = [];
    const n = g.slider("n:", 3, 12, 1, 6, (v) => String(v), () => draw());
    function draw() {
      b1.suspendUpdate();
      b1.removeObject(objs);
      objs = [];
      const k = n.value, V = [];
      for (let i = 0; i < k; i++) {
        const t = Math.PI / 2 + 2 * Math.PI * i / k;
        V.push([2.2 * Math.cos(t), 2.2 * Math.sin(t)]);
      }
      for (let i = 0; i < k; i++) for (let j = i + 2; j < k; j++) {
        if (i === 0 && j === k - 1) continue;
        objs.push(b1.create("segment", [V[i], V[j]], { strokeColor: C.c, strokeWidth: 1, strokeOpacity: 0.6, fixed: true, highlight: false }));
      }
      objs.push(b1.create("polygon", V, { fillColor: C.area, fillOpacity: 0.2, vertices: { size: 2, color: C.ink, fixed: true, withLabel: false },
        borders: { strokeColor: C.line, strokeWidth: 2, highlight: false, fixed: true }, fixed: true, highlight: false }));
      b1.unsuspendUpdate();
    }
    draw();
    const b2 = g.board([-2.6, 2.6, 2.6, -2.6], { title: "Hexágono regular = 6 triângulos equiláteros" });
    const L = g.slider("ℓ:", 1, 2.4, 0.05, 2, (v) => fmt(v, 2));
    const O = g.fixed(b2, 0, 0, "", { size: 2 });
    const H = [];
    for (let i = 0; i < 6; i++) H.push(g.dep(b2, () => L.value * Math.cos(i * Math.PI / 3), () => L.value * Math.sin(i * Math.PI / 3), "", { size: 1.5 }));
    for (let i = 0; i < 6; i++) g.poly(b2, [O, H[i], H[(i + 1) % 6]], { fillColor: i % 2 ? C.area : C.fillB, fillOpacity: 0.3 });
    g.readout(() => {
      const k = n.value, l = L.value;
      return `n = ${k}: &nbsp; diagonais n(n−3)/2 = ${k * (k - 3) / 2}, &nbsp; S<sub>i</sub> = (n−2)·180° = ${(k - 2) * 180}°, &nbsp; S<sub>e</sub> = 360°` +
        `<br>Hexágono: área = 6·ℓ²√3/4 = ${fmt(6 * l * l * Math.sqrt(3) / 4)} (ℓ = ${fmt(l)})`;
    });
  };

  // 28. Circles: six ideas.
  FIG["circles"] = (g) => {
    // a) length, arc length, tangent perpendicular to the radius
    const b1 = g.board([-3, 3, 3, -3], { title: "a) Comprimento de arco; a tangente é ⊥ ao raio" });
    const O = g.fixed(b1, 0, 0, "O", { label: { offset: [-16, -8] } });
    const R = 2;
    const c1 = g.circ(b1, O, R);
    const A = g.fixed(b1, R, 0, "A", { label: { offset: [6, -8] } });
    const T = g.glider(b1, R * Math.cos(1.1), R * Math.sin(1.1), c1, "B", { label: { offset: [6, 8] } });
    b1.create("arc", [O, A, T], { strokeColor: C.a, strokeWidth: 4, highlight: false });
    g.seg(b1, O, T, { strokeColor: C.c });
    b1.create("tangent", [T], { strokeColor: C.b, strokeWidth: 1.6, highlight: false });
    g.right(b1, O, T, g.at(b1, () => [T.X() - T.Y(), T.Y() + T.X()]), 0.22);
    b1.create("angle", [A, O, T], { radius: 0.45, name: "α", fillColor: C.a, fillOpacity: 0.25, strokeColor: C.a, highlight: false,
      label: { fontSize: 15, color: C.a } });
    // b) PA = PB
    const b2 = g.board([-2.5, 3, 4.5, -3], { title: "b) Segmentos tangentes: PA = PB" });
    const O2 = g.fixed(b2, 0, 0, "", { size: 2 });
    g.circ(b2, O2, 1.5);
    const P = g.free(b2, 3.4, 0.6, "P", { label: { offset: [6, 6] } });
    const tp = (sgn) => () => {
      const d = Math.hypot(P.X(), P.Y()), ph = Math.atan2(P.Y(), P.X()), a = Math.acos(Math.min(1, 1.5 / Math.max(d, 1.5)));
      return [1.5 * Math.cos(ph + sgn * a), 1.5 * Math.sin(ph + sgn * a)];
    };
    const TA = g.dep(b2, () => tp(1)()[0], () => tp(1)()[1], "A", { label: { offset: [-4, 12] } });
    const TB = g.dep(b2, () => tp(-1)()[0], () => tp(-1)()[1], "B", { label: { offset: [-4, -16] } });
    g.seg(b2, P, TA, { strokeColor: C.a }); g.seg(b2, P, TB, { strokeColor: C.a });
    g.ticks(b2, P, TA, 2); g.ticks(b2, P, TB, 2);
    // c) power of a point
    const b3 = g.board([-2.5, 3, 4.5, -3], { title: "c) Potência de ponto: PT² = PA·PB" });
    const O3 = g.fixed(b3, 0, 0, "", { size: 2 });
    const c3 = g.circ(b3, O3, 1.5);
    const P3 = g.free(b3, 3.6, -0.6, "P", { label: { offset: [6, -6] } });
    const G = g.glider(b3, -1.0, 1.12, c3, "", {});
    const sec = () => {   // the two intersections of line P3-G with the circle
      const px = P3.X(), py = P3.Y(), dx = G.X() - px, dy = G.Y() - py;
      const a = dx * dx + dy * dy, bq = 2 * (px * dx + py * dy), cq = px * px + py * py - 2.25;
      const disc = Math.max(0, bq * bq - 4 * a * cq), s1 = (-bq - Math.sqrt(disc)) / (2 * a), s2 = (-bq + Math.sqrt(disc)) / (2 * a);
      return [[px + s1 * dx, py + s1 * dy], [px + s2 * dx, py + s2 * dy]];
    };
    const SA = g.dep(b3, () => sec()[0][0], () => sec()[0][1], "A", { label: { offset: [-4, 12] } });
    const SB = g.dep(b3, () => sec()[1][0], () => sec()[1][1], "B", { label: { offset: [-14, 8] } });
    const tq = () => {
      const d = Math.hypot(P3.X(), P3.Y()), ph = Math.atan2(P3.Y(), P3.X()), a = Math.acos(Math.min(1, 1.5 / Math.max(d, 1.5)));
      return [1.5 * Math.cos(ph - a), 1.5 * Math.sin(ph - a)];
    };
    const TT = g.dep(b3, () => tq()[0], () => tq()[1], "T", { label: { offset: [-4, -16] } });
    g.seg(b3, P3, SB, { strokeColor: C.c }); g.seg(b3, P3, TT, { strokeColor: C.b, strokeWidth: 2.6 });
    // d) two circles and their common tangent
    const b4 = g.board([-2.6, 3.0, 5.2, -2.6], { title: "d) Tangente comum: trace r ∥ PQ por B" });
    const A4 = g.fixed(b4, 0, 0.2, "A", { label: { offset: [-16, 4] } });
    const RR = 2, rr = 0.9;
    g.circ(b4, A4, RR);
    const B4 = g.free(b4, 3.6, -0.5, "B", { label: { offset: [6, 6] } });
    g.circ(b4, B4, rr);
    const nrm = () => {   // unit normal of the lower common external tangent
      const dx = B4.X() - A4.X(), dy = B4.Y() - A4.Y(), L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
      const cp = (RR - rr) / L, sp = Math.sqrt(Math.max(0, 1 - cp * cp));
      return [cp * ux + sp * uy, cp * uy - sp * ux];
    };
    const P4 = g.dep(b4, () => A4.X() + RR * nrm()[0], () => A4.Y() + RR * nrm()[1], "P", { label: { offset: [-6, -16] } });
    const Q4 = g.dep(b4, () => B4.X() + rr * nrm()[0], () => B4.Y() + rr * nrm()[1], "Q", { label: { offset: [-2, -16] } });
    g.line(b4, P4, Q4, { strokeColor: C.b });
    g.seg(b4, A4, P4, { strokeColor: C.c }); g.seg(b4, B4, Q4, { strokeColor: C.c });
    g.right(b4, A4, P4, Q4, 0.2); g.right(b4, B4, Q4, P4, 0.2);
    const K = g.dep(b4, () => A4.X() + (RR - rr) * nrm()[0], () => A4.Y() + (RR - rr) * nrm()[1], "", { visible: false });
    const aux4 = [g.seg(b4, B4, K, { strokeColor: C.a, dash: 2, visible: false }), g.seg(b4, A4, B4, { strokeColor: C.a, dash: 2, visible: false }),
      g.poly(b4, [A4, K, B4], { fillColor: C.hl, fillOpacity: 0.45, visible: false, borders: { visible: false } })];
    g.button("Traçar r ∥ PQ por B", (on) => {
      aux4.forEach((m) => m.setAttribute({ visible: on }));
      aux4[2].borders.forEach((s) => s.setAttribute({ visible: false }));
    }, true);
    // e) inscribed angle
    const b5 = g.board([-3, 3, 3, -3], { title: "e) O ângulo inscrito é metade do ângulo central" });
    const O5 = g.fixed(b5, 0, 0, "O", { label: { offset: [-4, 13] } });
    const c5 = g.circ(b5, O5, 2.2);
    const A5 = g.glider(b5, 2.2 * Math.cos(-2.2), 2.2 * Math.sin(-2.2), c5, "A", { label: { offset: [-14, -8] } });
    const B5 = g.glider(b5, 2.2 * Math.cos(-0.7), 2.2 * Math.sin(-0.7), c5, "B", { label: { offset: [6, -8] } });
    const P5 = g.glider(b5, 2.2 * Math.cos(1.7), 2.2 * Math.sin(1.7), c5, "P", { label: { offset: [-4, 12] } });
    g.seg(b5, P5, A5); g.seg(b5, P5, B5); g.seg(b5, O5, A5, { strokeColor: C.c }); g.seg(b5, O5, B5, { strokeColor: C.c });
    g.angle(b5, A5, P5, B5, "θ", C.a, { radius: 0.6 });
    g.angle(b5, A5, O5, B5, "α", C.c, { radius: 0.45 });
    g.readout(() => {
      const al = Math.atan2(T.Y(), T.X()); const a = (al < 0 ? al + 2 * Math.PI : al) / D2R;
      const PA = dist(P, TA), PB = dist(P, TB);
      const pT = dist(P3, TT), pa = dist(P3, SA), pb = dist(P3, SB);
      const AB = dist(A4, B4), PQ = dist(P4, Q4);
      const th = deg(A5, P5, B5), alc = deg(A5, O5, B5);
      return `a) comprimento 2πR = ${fmt(2 * Math.PI * R)}, &nbsp; arco AB = (α/360°)·2πR = ${fmt(a / 360 * 2 * Math.PI * R)} (α = ${fdeg(a)})` +
        `<br>b) PA = ${fmt(PA)} = PB = ${fmt(PB)} &nbsp; c) PT² = ${fmt(pT * pT)} = PA·PB = ${fmt(pa * pb)}` +
        `<br>d) PQ² = ${fmt(PQ * PQ)} = AB² − (R − r)² = ${fmt(AB * AB - (RR - rr) ** 2)} &nbsp; ` +
        `e) θ = ${fdeg(th)}, α = ${fdeg(alc)}` + (Math.abs(th - alc / 2) < 0.05 ? " <span class='ok'>θ = α/2</span>"
          : " <span class='step'>(P está no arco menor AB: então θ = 180° − α/2)</span>");
    });
  };

  // 29. Inradius: r = S/p.
  FIG["inradius"] = (g) => {
    const b = g.board([-3.6, 3.9, 3.8, -0.9]);
    const A = g.free(b, -0.4, 3.4, "A", { label: { offset: [-4, 12] } });
    const B = g.free(b, -3, 0, "B", { label: { offset: [-16, -8] } });
    const Cc = g.free(b, 3.2, 0, "C", { label: { offset: [4, -10] } });
    g.poly(b, [A, B, Cc], { fillOpacity: 0.12 });
    const ic = b.create("incircle", [A, B, Cc], { strokeColor: C.c, strokeWidth: 2, highlight: false,
      center: { visible: true, name: "", size: 2, color: C.c } });
    const F = g.dep(b, () => footOn(ic.center, B, Cc)[0], () => footOn(ic.center, B, Cc)[1], "", { visible: false });
    g.seg(b, ic.center, F, { strokeColor: C.c, dash: 2 });
    g.segText(b, ic.center, F, "r", Cc, { fontSize: 15, color: C.c, off: 0.2 });
    g.readout(() => {
      const a = dist(B, Cc), bb = dist(A, Cc), c = dist(A, B), p = (a + bb + c) / 2, S = triArea(A, B, Cc);
      return `S = ${fmt(S)}, p = ${fmt(p)}: &nbsp; <span class="ok">r = ${fmt(ic.Radius(), 3)} = S/p = ${fmt(S / p, 3)}</span>`;
    });
  };

  // 30. Cyclic quadrilaterals: opposite angles add up to 180°.
  FIG["cyclic"] = (g) => {
    const b = g.board([-3.2, 3.2, 3.2, -3.2]);
    const O = g.fixed(b, 0, 0, "", { size: 2 });
    const circ = g.circ(b, O, 2.5, { strokeColor: C.aux });
    const pt = (t, nm, off) => g.glider(b, 2.5 * Math.cos(t), 2.5 * Math.sin(t), circ, nm, { label: { offset: off } });
    const A = pt(1.9, "A", [-6, 12]), B = pt(0.2, "B", [8, 4]), Cc = pt(-1.4, "C", [4, -14]), Dd = pt(3.6, "D", [-16, -6]);
    g.poly(b, [A, B, Cc, Dd], { fillOpacity: 0.12 });
    g.angle(b, B, A, Dd, "β", C.b, { radius: 0.55 });
    g.angle(b, Dd, Cc, B, "α", C.a, { radius: 0.55 });
    g.button("Deixar C sair da circunferência", (on) => { if (on) Cc.free(); else Cc.makeGlider(circ); }, true);
    g.readout(() => {
      const al = deg(Dd, Cc, B), be = deg(B, A, Dd), on = Math.abs(Math.hypot(Cc.X(), Cc.Y()) - 2.5) < 1e-6;
      return `<span class="a">α = ${fdeg(al)}</span> + <span class="b">β = ${fdeg(be)}</span> = ${fdeg(al + be)} ` +
        (on ? "<span class='ok'>(na circunferência: 180°)</span>" : "<span class='bad'>(C fora da circunferência: não dá 180°)</span>");
    });
  };

  // 31. Areas of circles and their parts: think of differences of areas.
  FIG["circle-areas"] = (g) => {
    const b = g.board([-2.9, 2.9, 2.9, -2.9]);
    const O = g.fixed(b, 0, 0, "O", { label: { offset: [-16, -8] } });
    const R = 2.3;
    const c = g.circ(b, O, R);
    const A = g.fixed(b, R, 0, "A", { label: { offset: [6, -8] } });
    const B = g.glider(b, R * Math.cos(1.3), R * Math.sin(1.3), c, "B", { label: { offset: [4, 10] } });
    b.create("sector", [O, A, B], { fillColor: C.area, fillOpacity: 0.35, strokeColor: C.line, strokeWidth: 1.5, highlight: false });
    g.poly(b, [O, A, B], { fillColor: C.fillA, fillOpacity: 0.55, borders: { strokeColor: C.line, strokeWidth: 1.5 } });
    b.create("angle", [A, O, B], { radius: 0.45, name: "α", fillColor: C.a, fillOpacity: 0.3, strokeColor: C.a, highlight: false,
      label: { fontSize: 15, color: C.a } });
    g.readout(() => {
      let al = Math.atan2(B.Y(), B.X()); if (al < 0) al += 2 * Math.PI;
      const a = al / D2R, sec = (a / 360) * Math.PI * R * R, tri = 0.5 * R * R * Math.sin(al);
      return `Círculo: πR² = ${fmt(Math.PI * R * R)} (R = ${fmt(R, 1)}). &nbsp; Setor OAB = (α/360°)·πR² = ${fmt(sec)}, ` +
        `triângulo OAB = ½R²·sen α = ${fmt(tri)}<br><span class="ok">segmento (azul) = setor − triângulo = ${fmt(sec - tri)}</span>` +
        (a > 180 ? " <span class='step'>(para α > 180°, o triângulo é subtraído com sen α &lt; 0; logo, é somado)</span>" : "");
    });
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();

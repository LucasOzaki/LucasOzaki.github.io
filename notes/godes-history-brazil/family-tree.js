// Interactive academic family tree, without external libraries.
// Data: window.GENEALOGY, defined in genealogy.js (edit that file, not this one).
// Layout: one column per academic generation (one column to the right of the advisors, or the
// column given in the data, whichever is further right); inside each
// column, people are ordered and spaced so that they sit close to their advisors and students.
(function () {
  "use strict";

  const SVGNS = "http://www.w3.org/2000/svg";
  const COL_W = 200;   // distance between two columns (the gap between boxes holds the lines)
  const NODE_W = 156;  // width of a name box
  const NODE_H = 26;   // height of a name box
  const ROW = 33;      // minimal vertical distance between two boxes of the same column
  const PAD = 14;

  function html(tag, attrs, parent) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) e.setAttribute(k, v);
    if (parent) parent.appendChild(e);
    return e;
  }

  function svg(tag, attrs, parent) {
    const e = document.createElementNS(SVGNS, tag);
    for (const [k, v] of Object.entries(attrs || {})) e.setAttribute(k, v);
    if (parent) parent.appendChild(e);
    return e;
  }

  function linkOf(p) {
    if (p.lattes) return "http://lattes.cnpq.br/" + p.lattes;
    return p.link || null;
  }

  function linkKind(p) {
    if (p.lattes) return "Lattes CV";
    if (!p.link) return null;
    if (p.link.includes("mathgenealogy.org")) return "Mathematics Genealogy Project page";
    if (p.link.includes("escavador.com")) return "profile (Escavador, from the Lattes CV)";
    if (p.link.includes("wikipedia.org")) return "Wikipedia page";
    if (p.link === "/") return "home page";
    return "web page";
  }

  function joinNames(names) {
    if (names.length <= 1) return names.join("");
    return names.slice(0, -1).join(", ") + " and " + names[names.length - 1];
  }

  // Pool-adjacent-violators: the nondecreasing sequence closest (least squares) to e.
  function isotonic(e) {
    const blocks = [];
    for (const v of e) {
      blocks.push({ sum: v, n: 1 });
      while (blocks.length > 1) {
        const b = blocks[blocks.length - 1];
        const a = blocks[blocks.length - 2];
        if (a.sum / a.n <= b.sum / b.n) break;
        blocks.pop();
        a.sum += b.sum;
        a.n += b.n;
      }
    }
    const z = [];
    for (const b of blocks) for (let i = 0; i < b.n; i++) z.push(b.sum / b.n);
    return z;
  }

  // Positions as close as possible to `desired` (already sorted), with y[i+1] - y[i] >= gaps[i].
  function place(desired, gaps) {
    const c = [0];
    for (let i = 1; i < desired.length; i++) c.push(c[i - 1] + gaps[i - 1]);
    const z = isotonic(desired.map((d, i) => d - c[i]));
    return z.map((v, i) => v + c[i]);
  }

  // Layered layout. A line that skips columns goes through a "waypoint" in each column it crosses;
  // waypoints take a slot of their own in the column, so no name box is ever drawn over a line.
  function layout(people) {
    const byId = new Map(people.map((p) => [p.id, p]));
    const parents = new Map();
    const children = new Map();
    for (const p of people) {
      const known = (p.advisors || []).filter((a) => byId.has(a));
      (p.advisors || []).filter((a) => !byId.has(a)).forEach((a) => console.warn("family tree: unknown advisor id", a, "for", p.id));
      parents.set(p.id, known);
      children.set(p.id, []);
    }
    for (const p of people) parents.get(p.id).forEach((a) => children.get(a).push(p.id));

    const layer = new Map();
    const visiting = new Set();
    const depth = (id) => {
      if (layer.has(id)) return layer.get(id);
      if (visiting.has(id)) throw new Error("family tree: advisor cycle at " + id);
      visiting.add(id);
      let v = byId.get(id).column || 0;   // optional earliest column, set in genealogy.js
      for (const a of parents.get(id)) v = Math.max(v, depth(a) + 1);
      visiting.delete(id);
      layer.set(id, v);
      return v;
    };
    people.forEach((p) => depth(p.id));

    // nodes = people + waypoints; up/down = neighbours in the previous/next column
    const isWay = new Set();
    const up = new Map(people.map((p) => [p.id, []]));
    const down = new Map(people.map((p) => [p.id, []]));
    const chains = [];
    let k = 0;
    for (const p of people) {
      for (const a of parents.get(p.id)) {
        const ids = [a];
        for (let l = layer.get(a) + 1; l < layer.get(p.id); l++) {
          const w = "~" + k++;
          isWay.add(w);
          layer.set(w, l);
          up.set(w, []);
          down.set(w, []);
          ids.push(w);
        }
        ids.push(p.id);
        for (let i = 0; i + 1 < ids.length; i++) {
          down.get(ids[i]).push(ids[i + 1]);
          up.get(ids[i + 1]).push(ids[i]);
        }
        chains.push({ from: a, to: p.id, ids });
      }
    }

    const nCols = Math.max(...layer.values()) + 1;
    const cols = Array.from({ length: nCols }, () => []);
    for (const id of layer.keys()) cols[layer.get(id)].push(id);

    const gap = (a, b) => {
      const wa = isWay.has(a), wb = isWay.has(b);
      if (wa && wb) return 9;
      if (wa || wb) return NODE_H / 2 + 11;
      return ROW;
    };
    const y = new Map();
    cols.forEach((c) => c.forEach((id, i) => y.set(id, i * ROW)));
    const mean = (ids) => ids.reduce((s, id) => s + y.get(id), 0) / ids.length;
    const sweep = (k, towardParents) => {
      const col = cols[k];
      const want = new Map(col.map((id) => {
        const nb = towardParents ? up.get(id) : down.get(id);
        return [id, nb.length ? mean(nb) : y.get(id)];
      }));
      col.sort((a, b) => want.get(a) - want.get(b) || y.get(a) - y.get(b));
      const gaps = col.slice(1).map((id, i) => gap(col[i], id));
      place(col.map((id) => want.get(id)), gaps).forEach((v, i) => y.set(col[i], v));
    };
    for (let it = 0; it < 40; it++) {
      for (let k = 1; k < nCols; k++) sweep(k, true);
      for (let k = nCols - 2; k >= 0; k--) sweep(k, false);
    }
    for (let k = 1; k < nCols; k++) sweep(k, true);

    // Close empty horizontal bands (e.g. between two unconnected branches).
    const ys = [...new Set(y.values())].sort((a, b) => a - b);
    let shift = 0;
    const shiftOf = new Map();
    for (let i = 0; i < ys.length; i++) {
      if (i > 0 && ys[i] - ys[i - 1] > 2 * ROW) shift += ys[i] - ys[i - 1] - 1.5 * ROW;
      shiftOf.set(ys[i], shift);
    }
    for (const [id, v] of y) y.set(id, v - shiftOf.get(v));

    const minY = Math.min(...y.values());
    const pos = new Map();
    for (const id of layer.keys()) pos.set(id, { x: PAD + layer.get(id) * COL_W, y: PAD + y.get(id) - minY });
    const height = Math.max(...people.map((p) => pos.get(p.id).y)) + NODE_H + PAD;
    const width = 2 * PAD + (nCols - 1) * COL_W + NODE_W;
    return { byId, parents, children, layer, pos, chains, isWay, width, height };
  }

  function lineage(id, rel) {
    // all ancestors (rel = parents) or all descendants (rel = children) of id
    const seen = new Set();
    const stack = [id];
    while (stack.length) {
      for (const n of rel.get(stack.pop())) if (!seen.has(n)) { seen.add(n); stack.push(n); }
    }
    return seen;
  }

  function render(root, data) {
    const people = data.people;
    const L = layout(people);
    const nameOf = (id) => L.byId.get(id).label;
    const advisorNames = (p) => (p.advisors || []).filter((a) => L.byId.has(a)).map(nameOf).concat(p.otherAdvisors || []);

    function phdLine(p) {
      const ph = p.phd || {};
      const adv = advisorNames(p);
      const advText = adv.length ? (adv.length > 1 ? "Advisors: " : "Advisor: ") + joinNames(adv) : "";
      const co = p.coNote ? " (" + p.coNote + ")" : "";
      if (p.ongoing) {
        return ["PhD in progress" + (ph.school ? " at " + ph.school : "") + (ph.since ? ", since " + ph.since : ""), advText + co];
      }
      return ["PhD" + (ph.school ? ", " + ph.school : "") + (ph.year ? ", " + ph.year : ""), advText + co];
    }

    root.textContent = "";

    const legend = html("div", { class: "ft-legend" }, root);
    const key = (cls, text) => {
      const k = html("span", { class: "ft-key" }, legend);
      html("span", { class: "ft-swatch " + cls }, k);
      html("span", {}, k).textContent = text;
    };
    key("brazil", "Brazilian group");
    key("abroad", "Prague school");
    key("ongoing", "PhD in progress");
    html("span", { class: "ft-key ft-hint" }, legend).textContent = "Lines go from advisor to student. Hover or tap a name for details; click to open the CV.";

    const scroller = html("div", { class: "ft-scroll" }, root);
    const canvas = svg("svg", {
      class: "ft-svg", width: L.width, height: L.height, viewBox: `0 0 ${L.width} ${L.height}`,
      role: "group", "aria-label": "Academic family tree of the people who studied generalized ODEs in the Brazilian group",
    }, scroller);
    const gEdges = svg("g", { class: "ft-edges" }, canvas);
    const gNodes = svg("g", { class: "ft-nodes" }, canvas);

    const edgeEls = [];
    for (const ch of L.chains) {
      // from the right side of the advisor, through the waypoints, to the left side of the student
      const s0 = L.pos.get(ch.ids[0]);
      let x = s0.x + NODE_W, yy = s0.y + NODE_H / 2;
      let d = `M${x},${yy}`;
      for (const id of ch.ids.slice(1)) {
        const q = L.pos.get(id);
        const x2 = q.x, y2 = q.y + NODE_H / 2, c = (x2 - x) / 2;
        d += ` C${x + c},${yy} ${x2 - c},${y2} ${x2},${y2}`;
        x = x2; yy = y2;
        if (L.isWay.has(id)) { x += NODE_W; d += ` L${x},${yy}`; }
      }
      edgeEls.push({ from: ch.from, to: ch.to, el: svg("path", { d }, gEdges) });
    }

    const tip = html("div", { class: "ft-tip", role: "tooltip", id: "ft-tip" }, root);
    tip.hidden = true;
    const nodeEls = new Map();
    let pinned = null;
    let lastPointer = "mouse";

    function highlight(id) {
      if (!id) {
        canvas.classList.remove("ft-dim");
        nodeEls.forEach((n) => n.classList.remove("ft-on"));
        edgeEls.forEach((e) => e.el.classList.remove("ft-on"));
        return;
      }
      const up = lineage(id, L.parents);
      const down = lineage(id, L.children);
      const on = new Set([id, ...up, ...down]);
      canvas.classList.add("ft-dim");
      nodeEls.forEach((n, k) => n.classList.toggle("ft-on", on.has(k)));
      edgeEls.forEach((e) => {
        const lit = (e.to === id || up.has(e.to)) && (up.has(e.from) || e.from === id) || (down.has(e.to) && (e.from === id || down.has(e.from)));
        e.el.classList.toggle("ft-on", lit);
      });
    }

    function show(p, anchor) {
      tip.textContent = "";
      html("div", { class: "ft-tip-name" }, tip).textContent = p.name;
      if (p.affiliation) html("div", { class: "ft-tip-aff" }, tip).textContent = p.affiliation;
      if (p.fields && p.fields.length) {
        html("div", { class: "ft-tip-h" }, tip).textContent = p.deceased ? "Worked on" : "Works on";
        const ul = html("ul", {}, tip);
        p.fields.forEach((f) => { html("li", {}, ul).textContent = f; });
      } else if (p.phd && (p.phd.thesis || p.phd.topic)) {
        html("div", { class: "ft-tip-h" }, tip).textContent = p.phd.thesis ? "PhD thesis" : "PhD topic";
        html("div", { class: "ft-tip-thesis" }, tip).textContent = p.phd.thesis || p.phd.topic;
      }
      const [l1, l2] = phdLine(p);
      const phd = html("div", { class: "ft-tip-phd" }, tip);
      phd.textContent = l1;
      if (l2) { html("br", {}, phd); phd.appendChild(document.createTextNode(l2)); }
      const kind = linkKind(p);
      html("div", { class: "ft-tip-link" }, tip).textContent = kind
        ? (lastPointer === "touch" ? "Tap again to open the " : "Click to open the ") + kind + "."
        : "No link yet.";

      tip.hidden = false;
      const r = root.getBoundingClientRect();
      const a = anchor.getBoundingClientRect();
      const tw = tip.offsetWidth, th = tip.offsetHeight;
      // to the right of the name if it fits, else to the left, else (narrow screens) below it
      let left, top;
      if (a.right + 10 + tw <= window.innerWidth - 8) {
        left = a.right - r.left + 10;
        top = a.top - r.top + a.height / 2 - th / 2;
      } else if (a.left - 10 - tw >= 8) {
        left = a.left - r.left - tw - 10;
        top = a.top - r.top + a.height / 2 - th / 2;
      } else {
        left = a.left - r.left + a.width / 2 - tw / 2;
        top = a.bottom - r.top + 8;
      }
      left = Math.max(0, Math.min(left, r.width - tw));
      top = Math.max(0, top);
      tip.style.left = left + "px";
      tip.style.top = top + "px";
      highlight(p.id);
    }

    function hide() {
      tip.hidden = true;
      highlight(null);
      nodeEls.forEach((n) => n.classList.remove("ft-active"));
    }

    canvas.addEventListener("pointerdown", (e) => { lastPointer = e.pointerType || "mouse"; }, true);

    for (const p of people) {
      const q = L.pos.get(p.id);
      const href = linkOf(p);
      const cls = ["ft-node", p.group === "abroad" ? "abroad" : "brazil"];
      if (p.ongoing) cls.push("ongoing");
      if (p.highlight) cls.push("self");
      if (!href) cls.push("ft-nolink");
      const node = href
        ? svg("a", { href, target: "_blank", rel: "noopener", class: cls.join(" ") }, gNodes)
        : svg("g", { tabindex: "0", class: cls.join(" ") }, gNodes);
      node.setAttribute("aria-label", p.name + (p.fields ? ". Works on: " + p.fields.join(", ") : ""));
      node.setAttribute("aria-describedby", "ft-tip");
      svg("rect", { x: q.x, y: q.y, width: NODE_W, height: NODE_H, rx: 7 }, node);
      const text = svg("text", { x: q.x + NODE_W / 2, y: q.y + NODE_H / 2 + 0.5, "text-anchor": "middle", "dominant-baseline": "central" }, node);
      text.textContent = p.label;
      nodeEls.set(p.id, node);

      node.addEventListener("mouseenter", () => { if (!pinned) show(p, node); });
      node.addEventListener("mouseleave", () => { if (!pinned) hide(); });
      node.addEventListener("focus", () => show(p, node));
      node.addEventListener("blur", () => { if (pinned !== p.id) hide(); });
      node.addEventListener("click", (e) => {
        // On touch screens the first tap shows the details, the second one opens the link.
        if (!href || (lastPointer === "touch" && pinned !== p.id)) {
          e.preventDefault();
          hide();
          pinned = p.id;
          node.classList.add("ft-active");
          show(p, node);
        }
      });
    }

    // Long names: shrink the text to fit its box.
    nodeEls.forEach((node) => {
      const t = node.querySelector("text");
      try {
        if (t.getComputedTextLength() > NODE_W - 10) {
          t.setAttribute("textLength", NODE_W - 10);
          t.setAttribute("lengthAdjust", "spacingAndGlyphs");
        }
      } catch (err) { /* not rendered yet */ }
    });

    document.addEventListener("click", (e) => {
      if (pinned && !e.target.closest(".ft-node")) { pinned = null; hide(); }
    });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") { pinned = null; hide(); } });

    // The same data as a table (accessible, searchable with Ctrl+F, and handy to check the data).
    const details = html("details", { class: "ft-list" }, root);
    html("summary", {}, details).textContent = "Show the family tree as a table";
    const table = html("table", { class: "table table-sm" }, details);
    const head = html("tr", {}, html("thead", {}, table));
    ["Name", "PhD", "Advisors", "Works on"].forEach((h) => { html("th", {}, head).textContent = h; });
    const body = html("tbody", {}, table);
    const order = [...people].sort((a, b) => L.layer.get(a.id) - L.layer.get(b.id) ||
      ((a.phd && (a.phd.year || a.phd.since)) || 0) - ((b.phd && (b.phd.year || b.phd.since)) || 0));
    for (const p of order) {
      const tr = html("tr", {}, body);
      const tdName = html("td", {}, tr);
      const href = linkOf(p);
      if (href) {
        const a = html("a", { href, target: "_blank", rel: "noopener" }, tdName);
        a.textContent = p.name;
      } else tdName.textContent = p.name;
      const ph = p.phd || {};
      html("td", {}, tr).textContent = p.ongoing
        ? "in progress" + (ph.school ? ", " + ph.school : "") + (ph.since ? " (since " + ph.since + ")" : "")
        : [ph.school, ph.year].filter(Boolean).join(", ");
      html("td", {}, tr).textContent = joinNames(advisorNames(p)) + (p.coNote ? " (" + p.coNote + ")" : "");
      html("td", {}, tr).textContent = (p.fields || []).join("; ");
    }
    if (data.checked) html("p", { class: "ft-checked" }, details).textContent = "Data last checked on " + data.checked + ".";
  }

  function init() {
    const root = document.getElementById("family-tree");
    if (!root) return;
    if (!window.GENEALOGY) {
      root.textContent = "The family tree could not be loaded (genealogy.js is missing).";
      return;
    }
    render(root, window.GENEALOGY);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();

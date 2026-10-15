<%
// Groups shown on the Research page, in this order. Empty groups are skipped.
const groups = [
  { label: "Published and accepted", statuses: ["published", "accepted"] },
  { label: "Submitted",              statuses: ["submitted"] },
  { label: "Preprints",              statuses: ["preprint"] },
  { label: "In preparation",         statuses: ["in-preparation"] },
];

const withList = (names) => {
  if (!names || names.length === 0) return "";
  if (names.length === 1) return names[0];
  return names.slice(0, -1).join(", ") + " and " + names[names.length - 1];
};
%>
<% for (const group of groups) {
     const papers = items.filter(p => group.statuses.includes(p.status));
     if (papers.length === 0) continue; %>

## <%= group.label %> {.paper-group}

```{=html}
<ol class="paper-list">
```
<% for (const p of papers) { %>
```{=html}
<li class="paper">
<div class="paper-title">
```

<%= p.title %>

```{=html}
</div>
<div class="paper-meta">
<% if (p.coauthors && p.coauthors.length) { %>
  <span class="paper-coauthors">with <%- withList(p.coauthors) %></span>
<% } else { %>
  <span class="paper-solo">sole author</span>
<% } %>
<% if (p.journal) { %>
  <span class="paper-venue"><em><%- p.journal %></em><% if (p.details) { %>, <%- p.details %><% } %></span>
<% } else if (p.status === "accepted") { %>
  <span class="paper-venue">accepted</span>
<% } %>
<% if (p.year) { %><span class="paper-year"><%- p.year %></span><% } %>
</div>
<div class="paper-links">
<% if (p.arxiv) { %><a class="paper-link" href="https://arxiv.org/abs/<%- p.arxiv %>">arXiv</a><% } %>
<% if (p.doi) { %><a class="paper-link" href="https://doi.org/<%- p.doi %>">DOI</a><% } %>
<% if (p.pdf) { %><a class="paper-link" href="<%- p.pdf %>">PDF</a><% } %>
<% if (p.url) { %><a class="paper-link" href="<%- p.url %>">Link</a><% } %>
</div>
</li>
```
<% } %>
```{=html}
</ol>
```
<% } %>

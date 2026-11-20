(function () {
'use strict';
var $ = function (s) { return document.querySelector(s); };
var NS = 'http://www.w3.org/2000/svg';
var KEY = 'deo.organigrama.v1';
var AREAS = [
  { k: 'v', n: 'Ventas', c: '#CFE6F5' }, { k: 'o', n: 'Operación', c: '#F6E3C3' },
  { k: 'f', n: 'Finanzas', c: '#D9EFD9' }, { k: 'd', n: 'Diseño', c: '#EBD8F3' }
];
var MEC = [['reuniones', 'Reuniones'], ['procesos', 'Procesos'], ['metas', 'Metas OKR'], ['integrador', 'Integrador'], ['herramienta', 'Herramienta']];
var DIMS = [
  ['span', 'Tramo de control', .22, 'Daft: lo sano es 4–8 personas por jefe'],
  ['vert', 'Capas', .12, 'Daft: diferenciación vertical'],
  ['hor', 'Áreas', .14, 'Daft: diferenciación horizontal'],
  ['mando', 'Unidad de mando', .18, 'Un jefe por persona'],
  ['cent', 'Delegación', .18, 'Mintzberg: la supervisión directa se satura'],
  ['coord', 'Coordinación', .16, 'Galbraith: más complejidad, más enlaces']
];
var PL = { semilla: [6, 2, 5, 2, 85, 17, ['reuniones']], mype: [28, 3, 12, 3, 75, 15, ['reuniones']], agencia: [20, 2, 8, 4, 45, 35, ['reuniones', 'herramienta']] };
var EXP_CSS = '.lin{stroke:#9AA8BA;stroke-width:1.6;fill:none}.cru{stroke:#C0392B;stroke-width:1.8;stroke-dasharray:5 4;fill:none}' +
  '.n circle{stroke-width:3}.n.ok circle{stroke:#2E8B6A}.n.amb circle{stroke:#D9860B}.n.red circle{stroke:#C0392B}' +
  '.n.dual circle{stroke:#C0392B;stroke-dasharray:4 3}.n text{font:700 12px sans-serif;text-anchor:middle;fill:#1B2A41}' +
  '.n .nm{font:500 11px sans-serif;fill:#5B6B80}';

var N = [], sel = 0, nid = 0, mode = '', cent = 60, coord = [], M = null, prevIdx = null, drag = null;
var hist = [], hp = -1, shared = false, sharedWarned = false;
var hlIds = [], pulseOn = false, tPulse = 0, tToast = 0, AL = [];
var svg = $('#org');

function cl(x) { return Math.max(0, Math.min(100, Math.round(x))); }
function get(id) { for (var i = 0; i < N.length; i++) if (N[i].id === id) return N[i]; }
function mk(name, parent, area) { var n = { id: nid++, name: name, area: area || '', boss: parent ? [parent.id] : [], x: 500, y: 60 }; N.push(n); return n; }
function dep(n) { return n.boss.length ? 1 + dep(get(n.boss[0])) : 0; }
function anc(n, id) { return n.boss.some(function (b) { return b === id || anc(get(b), id); }); }
function kidsOf(n) { return N.filter(function (m) { return m.boss[0] === n.id; }); }
function el(t, a, p) { var e = document.createElementNS(NS, t); for (var k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; }
function by(fn) { return N.filter(fn).map(function (n) { return n.id; }); }
function toast(t) {
  var e = $('#toast'); e.textContent = t; e.classList.add('on');
  clearTimeout(tToast); tToast = setTimeout(function () { e.classList.remove('on'); }, 3600);
}

/* ---------- Plantillas y orden ---------- */
function build(e, v, t, na, du) {
  N = []; nid = 0; var root = mk('Dirección'), prev = [root], left = e - 1, rk = 0, i;
  for (var d = 1; d <= v && left > 0; d++) {
    var cur = [];
    prev.forEach(function (p) {
      for (var j = 0; j < t && left > 0; j++) {
        var a = p === root ? AREAS[rk++ % na].k : p.area;
        cur.push(mk('', p, a)); left--;
      }
    });
    prev = cur;
  }
  var pool = N.filter(function (n) { return dep(n) === Math.max(0, v - 1); });
  for (i = 0; left > 0; i++, left--) { var p2 = pool[i % pool.length]; mk('', p2, p2 === root ? '' : p2.area); }
  var leaves = N.filter(function (n) { return !kidsOf(n).length; });
  var bosses = N.filter(function (n) { return kidsOf(n).length; });
  var k = Math.round(du / 100 * N.length);
  for (i = 0; i < k && leaves.length; i++) {
    var lf = leaves[Math.floor(i * leaves.length / k)];
    var c = bosses.filter(function (b) { return b.id !== lf.boss[0]; });
    if (c.length) lf.boss.push(c[(i * 2 + 1) % c.length].id);
  }
}
function layout() {
  var c = 0;
  (function p(n) { var k = kidsOf(n); if (!k.length) n.cx = c++; else { k.forEach(p); n.cx = (k[0].cx + k[k.length - 1].cx) / 2; } })(N[0]);
  var md = Math.max.apply(null, N.map(dep)), st = Math.min(64, 900 / Math.max(1, c)), off = (1000 - (c - 1) * st) / 2, g = md ? Math.min(110, 520 / md) : 0;
  N.forEach(function (n) { n.x = off + n.cx * st; n.y = 70 + dep(n) * g; });
}

/* ---------- Modelo DEO ---------- */
function ev() {
  var e = N.length, sp = {}, ms = 0;
  N.forEach(function (n) { sp[n.id] = N.filter(function (m) { return m.boss.indexOf(n.id) > -1; }).length; ms = Math.max(ms, sp[n.id]); });
  var niv = Math.max.apply(null, N.map(dep));
  var du = N.filter(function (n) { return n.boss.length > 1; }).length / e * 100;
  var used = {}; N.forEach(function (n) { if (n.area) used[n.area] = 1; });
  var ar = Object.keys(used).length || 1, ratio = e / ar;
  var meta = e <= 8 ? 70 : e <= 20 ? 55 : e <= 40 ? 40 : 30;
  var need = Math.max(1, Math.ceil(Math.log(e) / Math.log(6) - 1e-9));
  var cn = (ar >= 4 || e > 25) ? 4 : e > 10 ? 3 : 2, has = coord.length;
  var s = {
    span: ms > 8 ? 100 - 14 * (ms - 8) : (ms < 4 && e >= 10 ? 100 - 10 * (4 - ms) : 100),
    vert: 100 - 22 * Math.abs(niv - need),
    hor: ratio < 4 ? 100 - 18 * (4 - ratio) : ratio > 15 ? 100 - 3 * (ratio - 15) : 100,
    mando: 100 - 2.5 * du,
    cent: 100 - 1.4 * Math.max(0, cent - meta) - (cent < 15 ? 20 : 0),
    coord: 100 * Math.min(1, has / cn)
  };
  for (var k in s) s[k] = cl(s[k]);
  var idx = cl(DIMS.reduce(function (a, d) { return a + s[d[0]] * d[2]; }, 0));
  return { e: e, sp: sp, ms: ms, niv: niv, du: du, ar: ar, ratio: ratio, meta: meta, need: need, cn: cn, has: has, s: s, idx: idx };
}
function vered(m) { return m.idx >= 75 ? 'Lista para crecer' : m.idx >= 50 ? 'Escala con ajustes' : 'En riesgo de atascarse'; }
function arquetipo(m) {
  if (m.du >= 20) return ['Adhocracia improvisada', 'Se resuelve entre personas, sin reglas de quién manda.'];
  if (m.e <= 15 && cent >= 55) return ['Estructura simple', 'Una cabeza coordina: rápida hoy, límite mañana.'];
  if (m.niv >= 4 && cent >= 55) return ['Burocracia maquinal', 'Muchas capas y decisiones arriba: control, pero lentitud.'];
  if (m.ar >= 4 && m.e >= 25 && cent <= 50) return ['Forma divisional', 'Áreas autónomas con metas por resultado.'];
  if (cent <= 40 && m.has >= 3) return ['Burocracia profesional', 'Especialistas deciden, coordinados por estándares.'];
  if (cent >= 60) return ['Estructura simple desbordada', 'Creció sin cambiar de forma: aquí se atasca.'];
  return ['Estructura en transición', 'Elige la forma que quieres a 12 meses.'];
}
/* Cada alerta: [severidad, título, texto, objetivo]. El objetivo son los ids de nodos
   a resaltar en el lienzo, o 'coord' para resaltar los chips de coordinación. */
function alertas(m) {
  var a = [], R = 'red', A = 'amb';
  var topIds = by(function (n) { return m.sp[n.id] === m.ms; });
  if (m.ms > 10) a.push([R, 'Cuello de botella', 'Un jefe supervisa a ' + m.ms + '. Lo sano: 4–8.', topIds]);
  else if (m.ms > 8) a.push([A, 'Tramo al límite', 'Un jefe supervisa a ' + m.ms + '.', topIds]);
  else if (m.ms < 4 && m.e >= 10) a.push([A, 'Jefes con poco equipo', 'Capas que quizá no hacen falta.', by(function (n) { return m.sp[n.id] > 0; })]);
  if (cent >= m.meta + 20) a.push([R, 'Todo pasa por la dirección', cent + '% arriba; con ' + m.e + ' personas, ~' + m.meta + '%.', [0]]);
  else if (cent >= m.meta + 10) a.push([A, 'Delegación corta', 'Baja hacia ' + m.meta + '%.', [0]]);
  else if (cent < 15) a.push([A, 'Falta de dirección', 'Cada área tira por su lado.', [0]]);
  var duIds = by(function (n) { return n.boss.length > 1; });
  if (m.du >= 20) a.push([R, 'Cruce de mando', Math.round(m.du) + '% responde a dos jefes.', duIds]);
  else if (m.du >= 8) a.push([A, 'Cruces puntuales', 'Define quién decide en un conflicto.', duIds]);
  if (m.niv > m.need) {
    var d = N[0]; N.forEach(function (n) { if (dep(n) > dep(d)) d = n; });
    var ch = []; while (d) { ch.push(d.id); d = d.boss.length ? get(d.boss[0]) : null; }
    a.push([A, 'Quizá sobran capas', 'Bastan ~' + m.need + ' para ' + m.e + ' personas.', ch]);
  } else if (m.niv < m.need) a.push([A, 'Faltan mandos intermedios', 'La dirección absorbe supervisión.', [0]]);
  if (m.ar === 1 && m.e > 12) a.push([A, 'Sin áreas', 'Todos hacen de todo.', by(function (n) { return n.id && !n.area; })]);
  else if (m.ratio < 3) {
    var cnt = {}; N.forEach(function (n) { if (n.area) cnt[n.area] = (cnt[n.area] || 0) + 1; });
    var mn = Math.min.apply(null, Object.keys(cnt).map(function (k) { return cnt[k]; }));
    a.push([A, 'Áreas muy fragmentadas', 'Pocas personas por área.', by(function (n) { return n.area && cnt[n.area] === mn; })]);
  }
  if (m.has < m.cn) a.push([m.has < m.cn - 1 ? R : A, 'Coordinación corta', 'Necesitas ' + m.cn + ' mecanismos y tienes ' + m.has + '.', 'coord']);
  if (!a.length) a.push(['ok', 'Estructura coherente', 'Revísala antes del próximo salto.']);
  var o = { red: 0, amb: 1, ok: 2 };
  return a.sort(function (x, y) { return o[x[0]] - o[y[0]]; }).slice(0, 3);
}
function plan(m) {
  var w = DIMS[0][0], i;
  for (i = 1; i < DIMS.length; i++) if (m.s[DIMS[i][0]] < m.s[w]) w = DIMS[i][0];
  if (m.s[w] >= 100) return ['Siguiente reto', 'Todo en verde: prueba sumar 10 personas.'];
  var nx = MEC.filter(function (x) { return coord.indexOf(x[0]) < 0; })[0];
  return {
    span: ['30 días', 'Forma equipos de 4–8 con un líder cada uno.'],
    vert: ['90 días', m.niv > m.need ? 'Quita una capa que solo transmite.' : 'Crea mandos intermedios.'],
    hor: ['90 días', (m.ar === 1 || m.ratio > 15) ? 'Separa 2–3 áreas con responsable.' : 'Une áreas de menos de 4 personas.'],
    mando: ['Esta semana', 'Un jefe por persona: deja al segundo como líder de proyecto.'],
    cent: ['Esta semana', 'Delega lo de bajo riesgo con tope. Meta: ' + m.meta + '%.'],
    coord: ['30 días', 'Activa primero: ' + (nx ? nx[1].toLowerCase() : 'una revisión mensual') + '.']
  }[w];
}

/* ---------- Guardado, historial y validación ---------- */
function pack() {
  return { n: N.map(function (n) { return [n.id, n.name, n.area, n.boss, Math.round(n.x), Math.round(n.y)]; }), i: nid, c: cent, k: coord };
}
function ser() { return JSON.stringify(pack()); }
/* Valida cualquier dato externo (autoguardado o enlace) antes de usarlo. Devuelve null si no es válido. */
function unpack(o) {
  if (!o || !Array.isArray(o.n) || !o.n.length || o.n.length > 300) return null;
  var ids = {}, nodes = [], maxId = 0, i, j;
  for (i = 0; i < o.n.length; i++) {
    var r = o.n[i];
    if (!Array.isArray(r) || r.length < 6 || !Number.isInteger(r[0]) || r[0] < 0 || ids[r[0]] || !Array.isArray(r[3]) || r[3].length > 4) return null;
    var bs = [];
    for (j = 0; j < r[3].length; j++) {
      if (!Number.isInteger(r[3][j])) return null;
      if (bs.indexOf(r[3][j]) < 0) bs.push(r[3][j]);
    }
    ids[r[0]] = 1; maxId = Math.max(maxId, r[0]);
    var area = AREAS.some(function (a) { return a.k === r[2]; }) ? r[2] : '';
    var x = +r[4], y = +r[5];
    if (!isFinite(x) || !isFinite(y)) return null;
    nodes.push({ id: r[0], name: String(r[1] == null ? '' : r[1]).slice(0, 18), area: area, boss: bs, x: Math.max(20, Math.min(980, x)), y: Math.max(30, Math.min(610, y)) });
  }
  if (!ids[0]) return null;
  var map = {}; nodes.forEach(function (n) { map[n.id] = n; });
  for (i = 0; i < nodes.length; i++) {
    var n = nodes[i];
    if (n.id === 0) { if (n.boss.length) return null; continue; }
    if (!n.boss.length) return null;
    for (j = 0; j < n.boss.length; j++) if (!map[n.boss[j]] || n.boss[j] === n.id) return null;
  }
  var st = {};
  function visit(id) {
    if (st[id] === 2) return true;
    if (st[id] === 1) return false;
    st[id] = 1;
    var b = map[id].boss;
    for (var q = 0; q < b.length; q++) if (!visit(b[q])) return false;
    st[id] = 2; return true;
  }
  for (i = 0; i < nodes.length; i++) if (!visit(nodes[i].id)) return null;
  var c = +o.c; if (!isFinite(c)) c = 60;
  var k = (Array.isArray(o.k) ? o.k : []).filter(function (v, q, arr) {
    return arr.indexOf(v) === q && MEC.some(function (m) { return m[0] === v; });
  });
  return { nodes: nodes, nid: Math.max(maxId + 1, Math.floor(+o.i) || 0), cent: Math.max(0, Math.min(100, Math.round(c / 5) * 5)), coord: k };
}
function setState(st) {
  N = st.nodes; nid = st.nid; cent = st.cent; coord = st.coord;
  if (!get(sel)) sel = 0;
  mode = ''; syncCtl(); unmarkPlant();
}
function save() {
  if (shared) return;
  try { localStorage.setItem(KEY, ser()); } catch (e) { /* sin espacio o bloqueado: se sigue sin guardar */ }
}
function push() {
  var s = ser();
  if (hist[hp] !== s) {
    hist = hist.slice(0, hp + 1); hist.push(s);
    if (hist.length > 120) hist.shift();
    hp = hist.length - 1;
  }
  save();
  if (shared && !sharedWarned) {
    sharedWarned = true;
    toast('Estás viendo un enlace compartido: tus cambios no se autoguardan. Usa «Copiar enlace» para conservarlos.');
  }
}
function restore(s) {
  var st; try { st = unpack(JSON.parse(s)); } catch (e) { st = null; }
  if (!st) return;
  setState(st); save(); render();
}
function undo() { if (hp > 0) { hp--; restore(hist[hp]); } }
function redo() { if (hp < hist.length - 1) { hp++; restore(hist[hp]); } }
function chg() { unmarkPlant(); push(); render(); }
function leaveShared() {
  if (!shared) return;
  shared = false;
  try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* ignorar */ }
}
function nuevo() {
  N = []; nid = 0; mk('Dirección'); sel = 0; cent = 60; coord = []; prevIdx = null; mode = '';
  leaveShared(); syncCtl(); chg();
  toast('Organigrama nuevo. Pulsa Deshacer (Ctrl+Z) para recuperar el anterior.');
}

/* ---------- Dibujo ---------- */
function sev(n) {
  var s = M.sp[n.id], c = s > 10 ? 'red' : s > 8 ? 'amb' : 'ok';
  if (n.id === 0) { if (cent >= M.meta + 20) c = 'red'; else if (cent >= M.meta + 10 && c === 'ok') c = 'amb'; }
  return c;
}
function draw() {
  svg.innerHTML = '';
  var gE = el('g', {}, svg), gN = el('g', {}, svg);
  N.forEach(function (n) {
    n.boss.forEach(function (b, i) {
      var p = get(b), my = (p.y + n.y) / 2;
      if (i === 0) el('path', { d: 'M' + p.x + ' ' + p.y + 'V' + my + 'H' + n.x + 'V' + n.y, 'class': 'lin' }, gE);
      else el('path', { d: 'M' + p.x + ' ' + p.y + 'Q' + ((p.x + n.x) / 2 + 40) + ' ' + my + ' ' + n.x + ' ' + n.y, 'class': 'cru' }, gE);
    });
  });
  N.forEach(function (n) {
    var s = M.sp[n.id], r = n.id === 0 ? 19 : s ? 15 : 9, a = AREAS.filter(function (x) { return x.k === n.area; })[0];
    var hl = hlIds.indexOf(n.id) > -1;
    var g = el('g', { 'class': 'n ' + sev(n) + (n.boss.length > 1 ? ' dual' : '') + (n.id === sel ? ' sel' : '') + (hl ? ' hl' + (pulseOn ? ' pulse' : '') : ''), 'data-id': n.id }, gN);
    el('title', {}, g).textContent = (n.name || (n.id ? 'Persona' : 'Dirección')) + ': supervisa a ' + s;
    el('circle', { cx: n.x, cy: n.y, r: r + 6, 'class': 'halo' }, g);
    el('circle', { cx: n.x, cy: n.y, r: r, fill: a ? a.c : '#fff' }, g);
    if (s) el('text', { x: n.x, y: n.y + 4.5 }, g).textContent = s;
    if (n.name || n.id === 0) el('text', { x: n.x, y: n.y + r + 14, 'class': 'nm' }, g).textContent = n.name || 'Dirección';
  });
}

/* ---------- Alertas que señalan el lienzo ---------- */
function setHl(i, pulse) {
  var a = AL[i], t = a && a[3];
  if (!t) return;
  if (t === 'coord') {
    var c = $('#coord'); c.classList.add('flash');
    setTimeout(function () { c.classList.remove('flash'); }, 2200);
    return;
  }
  hlIds = t; pulseOn = !!pulse; draw();
  clearTimeout(tPulse);
  if (pulse) tPulse = setTimeout(function () { pulseOn = false; hlIds = []; draw(); }, 2600);
}
function clearHl() {
  if (pulseOn) return;
  clearTimeout(tPulse); hlIds = []; draw();
}

/* ---------- Exportar y compartir ---------- */
function uri(s) { return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s); }
function dl(href, name) { var a = document.createElement('a'); a.href = href; a.download = name; document.body.appendChild(a); a.click(); a.remove(); }
/* Copia autónoma del organigrama con estilos incrustados (sin depender de la hoja de estilos). */
function svgString(head) {
  var xs = N.map(function (n) { return n.x; }), ys = N.map(function (n) { return n.y; });
  var x0 = Math.min.apply(null, xs) - 70, x1 = Math.max.apply(null, xs) + 70;
  var y0 = Math.min.apply(null, ys) - 34 - (head ? 78 : 0), y1 = Math.max.apply(null, ys) + 44;
  if (head && x1 - x0 < 640) { var mid = (x0 + x1) / 2; x0 = mid - 320; x1 = mid + 320; }
  var w = Math.round(x1 - x0), h = Math.round(y1 - y0);
  var c = svg.cloneNode(true);
  Array.prototype.forEach.call(c.querySelectorAll('.halo'), function (e) { e.parentNode.removeChild(e); });
  ['id', 'role', 'aria-label', 'class', 'style'].forEach(function (k) { c.removeAttribute(k); });
  c.setAttribute('viewBox', Math.round(x0) + ' ' + Math.round(y0) + ' ' + w + ' ' + h);
  c.setAttribute('width', w); c.setAttribute('height', h);
  c.insertBefore(el('rect', { x: x0, y: y0, width: w + 2, height: h + 2, fill: '#fff' }), c.firstChild);
  var st = el('style', {}); st.textContent = EXP_CSS; c.insertBefore(st, c.firstChild);
  if (head) {
    var t1 = el('text', { x: x0 + 24, y: y0 + 34, 'font-size': 20, 'font-weight': 700, fill: '#1B2A41', 'font-family': 'Georgia,serif' }, c);
    t1.textContent = 'DEO · ' + (M.e >= 3 ? 'Índice ' + M.idx + '/100 · ' + vered(M) : 'Organigrama');
    var t2 = el('text', { x: x0 + 24, y: y0 + 58, 'font-size': 12, fill: '#5B6B80', 'font-family': 'sans-serif' }, c);
    t2.textContent = (M.e >= 3 ? arquetipo(M)[0] + ' · ' : '') + M.e + (M.e === 1 ? ' persona' : ' personas');
  }
  return { s: new XMLSerializer().serializeToString(c), w: w, h: h };
}
function png() {
  var o = svgString(true), im = new Image();
  im.onload = function () {
    var k = 2, cv = document.createElement('canvas'); cv.width = o.w * k; cv.height = o.h * k;
    var cx = cv.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0, 0, cv.width, cv.height); cx.drawImage(im, 0, 0, cv.width, cv.height);
    cv.toBlob(function (b) {
      if (!b) { toast('No se pudo generar la imagen.'); return; }
      var u = URL.createObjectURL(b); dl(u, 'organigrama-deo.png');
      setTimeout(function () { URL.revokeObjectURL(u); }, 5000);
      toast('Imagen PNG descargada.');
    }, 'image/png');
  };
  im.onerror = function () { toast('No se pudo generar la imagen.'); };
  im.src = uri(o.s);
}
/* Reporte imprimible: se abre el diálogo de impresión y se elige «Guardar como PDF». */
function reporte() {
  if (M.e < 3) { toast('Añade al menos 3 personas para generar el reporte.'); return; }
  var r = $('#reporte'), f = new Date().toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' });
  var col = M.idx >= 75 ? 'ok' : M.idx >= 50 ? 'amb' : 'red', ar = arquetipo(M), al = alertas(M), p = plan(M);
  var nomC = MEC.filter(function (x) { return coord.indexOf(x[0]) > -1; }).map(function (x) { return x[1]; }).join(', ') || 'Ninguno';
  r.innerHTML =
    '<header class="r-top"><h1>Reporte DEO</h1><span>' + f + '</span></header>' +
    '<section class="r-score"><div class="r-num ' + col + '">' + M.idx + '<small>de 100</small></div>' +
    '<div><b>' + vered(M) + '</b><p class="r-arq">' + ar[0] + '</p><p>' + ar[1] + '</p></div></section>' +
    '<img class="r-img" alt="Organigrama" src="' + uri(svgString(false).s) + '">' +
    '<h2>Seis dimensiones</h2>' +
    DIMS.map(function (d) {
      var v = M.s[d[0]], q = v >= 75 ? 'ok' : v >= 50 ? 'amb' : 'red';
      return '<div class="r-dim"><span>' + d[1] + '</span><div class="r-b"><i class="' + q + '" style="width:' + v + '%"></i></div><b>' + v + '</b><em>' + d[3] + '</em></div>';
    }).join('') +
    '<h2>Alertas</h2><ul class="r-al">' + al.map(function (a) { return '<li class="' + a[0] + '"><b>' + a[1] + '</b> ' + a[2] + '</li>'; }).join('') + '</ul>' +
    '<h2>Plan</h2><p class="r-plan"><b>' + p[0] + ':</b> ' + p[1] + '</p>' +
    '<h2>Datos del organigrama</h2><p>' + M.e + ' personas · ' + (M.niv + 1) + ' niveles · ' + M.ar + ' áreas · jefe con más directos: ' + M.ms +
    '<br>Decisiones que esperan a la dirección: ' + cent + '% · Coordinación: ' + nomC + '</p>' +
    '<p class="r-foot">Base teórica: Mintzberg, Daft y Galbraith. Auditoría orientativa.</p>';
  var t0 = document.title, im = r.querySelector('img'), done = false;
  document.title = 'Reporte DEO ' + f;
  var back = function () { document.title = t0; window.removeEventListener('afterprint', back); };
  window.addEventListener('afterprint', back);
  function go() { if (done) return; done = true; window.print(); }
  im.onload = go; setTimeout(go, 900);
  if (im.complete && im.naturalWidth) go();
}
function b64e(s) {
  var b = new TextEncoder().encode(s), r = '';
  b.forEach(function (x) { r += String.fromCharCode(x); });
  return btoa(r).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64d(t) {
  t = t.replace(/-/g, '+').replace(/_/g, '/');
  while (t.length % 4) t += '=';
  var r = atob(t), b = new Uint8Array(r.length);
  for (var i = 0; i < r.length; i++) b[i] = r.charCodeAt(i);
  return new TextDecoder().decode(b);
}
function enlace() {
  var u;
  try { u = location.href.split('#')[0] + '#o=' + b64e(ser()); } catch (e) { toast('No se pudo crear el enlace.'); return; }
  var largo = u.length > 8000 ? ' Es muy largo: algunas apps podrían cortarlo.' : '';
  function ok() { toast('Enlace copiado. Quien lo abra verá tu organigrama tal cual.' + largo); }
  function manual() { window.prompt('Copia este enlace:', u); }
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(u).then(ok, manual);
  else manual();
}

/* ---------- Interfaz ---------- */
function render() {
  M = ev();
  clearTimeout(tPulse); hlIds = []; pulseOn = false;
  var big = M.e >= 3, col = M.idx >= 75 ? 'ok' : M.idx >= 50 ? 'amb' : 'red';
  var md = $('#medidor');
  md.style.setProperty('--p', big ? M.idx : 0);
  md.style.setProperty('--c', 'var(--' + col + ')');
  $('#indice').textContent = big ? M.idx : '–';
  $('#veredicto').textContent = !big ? 'Añade personas' : vered(M);
  var ar = big ? arquetipo(M) : ['', ''];
  $('#arq').textContent = ar[0]; $('#arqT').textContent = ar[1];
  var dl2 = $('#delta');
  if (prevIdx === null) dl2.textContent = '';
  if (big && prevIdx !== null && M.idx !== prevIdx) {
    var d = M.idx - prevIdx; dl2.textContent = (d > 0 ? '+' : '') + d; dl2.className = 'delta ' + (d > 0 ? 'up' : 'dn');
    if (M.idx >= 75 && prevIdx < 75) { md.classList.remove('win'); void md.offsetWidth; md.classList.add('win'); }
  }
  prevIdx = big ? M.idx : null;

  $('#dims').innerHTML = DIMS.map(function (d) {
    var v = M.s[d[0]], q = v >= 75 ? 'ok' : v >= 50 ? 'amb' : 'red';
    return '<div class="dim" title="' + d[3] + '"><span>' + d[1] + '</span><div class="b"><i class="' + q + '" style="width:' + v + '%"></i></div><b>' + v + '</b></div>';
  }).join('');
  AL = big ? alertas(M) : [];
  $('#alertas').innerHTML = AL.map(function (a, i) {
    var go = a[3] ? ' go" data-i="' + i + '" tabindex="0" role="button" title="Ver en el organigrama' : '';
    return '<li class="' + a[0] + go + '"><b>' + a[1] + '</b>' + a[2] + '</li>';
  }).join('');
  var p = big ? plan(M) : null;
  $('#plan').innerHTML = p ? '<small>' + p[0] + '</small>' + p[1] : '';
  $('#plan').style.display = p ? '' : 'none';

  var sn = get(sel);
  if (document.activeElement !== $('#nombre')) $('#nombre').value = sn ? sn.name : '';
  Array.prototype.forEach.call($('#areas').children, function (b) { b.setAttribute('aria-pressed', sn && sn.area === b.dataset.k ? 'true' : 'false'); });
  $('#bCon').setAttribute('aria-pressed', mode === 'con');
  $('#bUndo').disabled = hp <= 0;
  $('#bRedo').disabled = hp >= hist.length - 1;
  hint(mode === 'con' ? 'Toca a quien también responderá a este jefe' : N.length < 2 ? 'Pulsa ＋ Persona para añadir a quien reporta al nodo marcado' : 'Arrastra los nodos libremente · toca para elegir · Ctrl+Z deshace');
  draw();
}
function hint(t) { $('#hint').textContent = t; }

function pt(e) { var p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); }
function pick(n) {
  if (mode === 'con' && n.id !== sel) {
    var b = get(sel);
    if (n.id === 0 || n.boss.indexOf(b.id) > -1 || anc(b, n.id)) { toast('Esa conexión no es posible.'); mode = ''; return false; }
    n.boss.push(b.id); mode = ''; return true;
  }
  sel = n.id; mode = ''; return false;
}
function aplicar(k) {
  var P = PL[k]; build(P[0], P[1], P[2], P[3], P[5]);
  cent = P[4]; coord = P[6].slice(); layout(); sel = 0; prevIdx = null; mode = '';
  leaveShared(); syncCtl();
  Array.prototype.forEach.call($('#plant').querySelectorAll('[data-p]'), function (b) { b.setAttribute('aria-pressed', b.dataset.p === k); });
  push(); render();
}
function syncCtl() {
  $('#cent').value = cent; $('#oCent').textContent = cent + '%';
  Array.prototype.forEach.call($('#coord').children, function (b) { b.setAttribute('aria-pressed', coord.indexOf(b.dataset.k) > -1); });
}
function unmarkPlant() { Array.prototype.forEach.call($('#plant').querySelectorAll('[data-p]'), function (b) { b.setAttribute('aria-pressed', 'false'); }); }

function init() {
  AREAS.forEach(function (a) {
    var b = document.createElement('button'); b.type = 'button'; b.dataset.k = a.k;
    b.innerHTML = '<i style="background:' + a.c + '"></i>' + a.n;
    b.onclick = function () { var n = get(sel); if (n && n.id) { n.area = n.area === a.k ? '' : a.k; chg(); } };
    $('#areas').appendChild(b);
  });
  MEC.forEach(function (m) {
    var b = document.createElement('button'); b.type = 'button'; b.dataset.k = m[0]; b.textContent = m[1];
    b.onclick = function () { var i = coord.indexOf(m[0]); if (i > -1) coord.splice(i, 1); else coord.push(m[0]); syncCtl(); chg(); };
    $('#coord').appendChild(b);
  });
  $('#cent').oninput = function () { cent = +this.value; unmarkPlant(); syncCtl(); render(); };
  $('#cent').onchange = function () { push(); render(); };
  $('#nombre').oninput = function () { var n = get(sel); if (n) { n.name = this.value; draw(); } };
  $('#nombre').onchange = function () { push(); render(); };
  $('#bAdd').onclick = function () {
    var p = get(sel), k = kidsOf(p).length, n = mk('', p, p.id ? p.area : '');
    n.x = Math.max(30, Math.min(970, p.x + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 46)); n.y = Math.min(600, p.y + 95);
    chg();
  };
  $('#bCon').onclick = function () { mode = mode === 'con' ? '' : 'con'; render(); };
  $('#bOrd').onclick = function () { layout(); chg(); };
  $('#bDel').onclick = function () {
    if (!sel) { toast('La dirección no se puede quitar.'); return; }
    var d = get(sel), up = d.boss[0];
    N = N.filter(function (n) { return n.id !== d.id; });
    N.forEach(function (n) { if (n.boss.indexOf(d.id) > -1) { n.boss = n.boss.filter(function (b) { return b !== d.id; }); if (!n.boss.length) n.boss = [up]; } });
    sel = up; chg();
  };
  $('#bUndo').onclick = undo;
  $('#bRedo').onclick = redo;
  $('#bNew').onclick = nuevo;
  $('#bPng').onclick = png;
  $('#bPdf').onclick = reporte;
  $('#bLink').onclick = enlace;
  Array.prototype.forEach.call($('#plant').querySelectorAll('[data-p]'), function (b) { b.onclick = function () { aplicar(b.dataset.p); }; });

  svg.addEventListener('pointerdown', function (e) {
    var g = e.target.closest('[data-id]'); if (!g) return;
    drag = { n: get(+g.dataset.id), mv: 0 }; svg.setPointerCapture(e.pointerId);
  });
  svg.addEventListener('pointermove', function (e) {
    if (!drag) return; var p = pt(e);
    if (drag.mv || Math.hypot(p.x - drag.n.x, p.y - drag.n.y) > 4) {
      drag.mv = 1; drag.n.x = Math.max(20, Math.min(980, p.x)); drag.n.y = Math.max(30, Math.min(610, p.y)); draw();
    }
  });
  svg.addEventListener('pointerup', function () {
    if (!drag) return;
    var cambio = drag.mv ? true : pick(drag.n);
    drag = null;
    if (cambio) { unmarkPlant(); push(); }
    render();
  });
  svg.addEventListener('pointercancel', function () {
    if (!drag) return;
    var mv = drag.mv; drag = null;
    if (mv) push();
    render();
  });

  var al = $('#alertas');
  al.addEventListener('mouseover', function (e) {
    var li = e.target.closest('li[data-i]'); if (li) setHl(+li.dataset.i, false);
  });
  al.addEventListener('mouseout', function (e) {
    var li = e.target.closest('li[data-i]');
    if (li && !li.contains(e.relatedTarget)) clearHl();
  });
  al.addEventListener('click', function (e) {
    var li = e.target.closest('li[data-i]'); if (li) setHl(+li.dataset.i, true);
  });
  al.addEventListener('keydown', function (e) {
    var li = e.target.closest('li[data-i]');
    if (li && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); setHl(+li.dataset.i, true); }
  });

  document.addEventListener('keydown', function (e) {
    if (!(e.ctrlKey || e.metaKey) || e.altKey || !$('#taller').classList.contains('abierto')) return;
    if (e.target.tagName === 'INPUT' && e.target.type === 'text') return;
    var k = e.key.toLowerCase();
    if (k === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
    else if (k === 'y' || (k === 'z' && e.shiftKey)) { e.preventDefault(); redo(); }
  });

  $('#inicio').onclick = function () {
    $('#taller').classList.add('abierto');
    setTimeout(function () { $('#taller').scrollIntoView({ behavior: 'smooth' }); }, 60);
  };
  window.addEventListener('scroll', function () { $('#stick').style.opacity = Math.max(0, 1 - window.scrollY / (window.innerHeight * 0.8)); });

  /* Arranque: enlace compartido > autoguardado > ejemplo Mype */
  var st = null, h = location.hash.match(/^#o=([A-Za-z0-9_-]+)$/), desdeEnlace = false;
  if (h) {
    try { st = unpack(JSON.parse(b64d(h[1]))); } catch (e) { st = null; }
    desdeEnlace = !!st;
  }
  if (!st) {
    try { var raw = localStorage.getItem(KEY); if (raw) st = unpack(JSON.parse(raw)); } catch (e) { st = null; }
  }
  if (st) {
    shared = desdeEnlace;
    setState(st); hist = [ser()]; hp = 0; prevIdx = null; render();
    if (desdeEnlace) {
      $('#taller').classList.add('abierto');
      setTimeout(function () { $('#taller').scrollIntoView({ behavior: 'smooth' }); }, 60);
    }
  } else aplicar('mype');
}
init();
})();

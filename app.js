(function () {
'use strict';
var $ = function (s) { return document.querySelector(s); };
var NS = 'http://www.w3.org/2000/svg';
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

var N = [], sel = 0, nid = 0, mode = '', cent = 60, coord = [], M = null, prevIdx = null, drag = null;
var svg = $('#org');

function cl(x) { return Math.max(0, Math.min(100, Math.round(x))); }
function get(id) { for (var i = 0; i < N.length; i++) if (N[i].id === id) return N[i]; }
function mk(name, parent, area) { var n = { id: nid++, name: name, area: area || '', boss: parent ? [parent.id] : [], x: 500, y: 60 }; N.push(n); return n; }
function dep(n) { return n.boss.length ? 1 + dep(get(n.boss[0])) : 0; }
function anc(n, id) { return n.boss.some(function (b) { return b === id || anc(get(b), id); }); }
function kidsOf(n) { return N.filter(function (m) { return m.boss[0] === n.id; }); }
function el(t, a, p) { var e = document.createElementNS(NS, t); for (var k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; }

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
function arquetipo(m) {
  if (m.du >= 20) return ['Adhocracia improvisada', 'Se resuelve entre personas, sin reglas de quién manda.'];
  if (m.e <= 15 && cent >= 55) return ['Estructura simple', 'Una cabeza coordina: rápida hoy, límite mañana.'];
  if (m.niv >= 4 && cent >= 55) return ['Burocracia maquinal', 'Muchas capas y decisiones arriba: control, pero lentitud.'];
  if (m.ar >= 4 && m.e >= 25 && cent <= 50) return ['Forma divisional', 'Áreas autónomas con metas por resultado.'];
  if (cent <= 40 && m.has >= 3) return ['Burocracia profesional', 'Especialistas deciden, coordinados por estándares.'];
  if (cent >= 60) return ['Estructura simple desbordada', 'Creció sin cambiar de forma: aquí se atasca.'];
  return ['Estructura en transición', 'Elige la forma que quieres a 12 meses.'];
}
function alertas(m) {
  var a = [], R = 'red', A = 'amb';
  if (m.ms > 10) a.push([R, 'Cuello de botella', 'Un jefe supervisa a ' + m.ms + '. Lo sano: 4–8.']);
  else if (m.ms > 8) a.push([A, 'Tramo al límite', 'Un jefe supervisa a ' + m.ms + '.']);
  else if (m.ms < 4 && m.e >= 10) a.push([A, 'Jefes con poco equipo', 'Capas que quizá no hacen falta.']);
  if (cent >= m.meta + 20) a.push([R, 'Todo pasa por la dirección', cent + '% arriba; con ' + m.e + ' personas, ~' + m.meta + '%.']);
  else if (cent >= m.meta + 10) a.push([A, 'Delegación corta', 'Baja hacia ' + m.meta + '%.']);
  else if (cent < 15) a.push([A, 'Falta de dirección', 'Cada área tira por su lado.']);
  if (m.du >= 20) a.push([R, 'Cruce de mando', Math.round(m.du) + '% responde a dos jefes.']);
  else if (m.du >= 8) a.push([A, 'Cruces puntuales', 'Define quién decide en un conflicto.']);
  if (m.niv > m.need) a.push([A, 'Quizá sobran capas', 'Bastan ~' + m.need + ' para ' + m.e + ' personas.']);
  else if (m.niv < m.need) a.push([A, 'Faltan mandos intermedios', 'La dirección absorbe supervisión.']);
  if (m.ar === 1 && m.e > 12) a.push([A, 'Sin áreas', 'Todos hacen de todo.']);
  else if (m.ratio < 3) a.push([A, 'Áreas muy fragmentadas', 'Pocas personas por área.']);
  if (m.has < m.cn) a.push([m.has < m.cn - 1 ? R : A, 'Coordinación corta', 'Necesitas ' + m.cn + ' mecanismos y tienes ' + m.has + '.']);
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
    var g = el('g', { 'class': 'n ' + sev(n) + (n.boss.length > 1 ? ' dual' : '') + (n.id === sel ? ' sel' : ''), 'data-id': n.id }, gN);
    el('title', {}, g).textContent = (n.name || (n.id ? 'Persona' : 'Dirección')) + ': supervisa a ' + s;
    el('circle', { cx: n.x, cy: n.y, r: r + 6, 'class': 'halo' }, g);
    el('circle', { cx: n.x, cy: n.y, r: r, fill: a ? a.c : '#fff' }, g);
    if (s) el('text', { x: n.x, y: n.y + 4.5 }, g).textContent = s;
    if (n.name || n.id === 0) el('text', { x: n.x, y: n.y + r + 14, 'class': 'nm' }, g).textContent = n.name || 'Dirección';
  });
}

/* ---------- Interfaz ---------- */
function render() {
  M = ev();
  var big = M.e >= 3, col = M.idx >= 75 ? 'ok' : M.idx >= 50 ? 'amb' : 'red';
  var md = $('#medidor');
  md.style.setProperty('--p', big ? M.idx : 0);
  md.style.setProperty('--c', 'var(--' + col + ')');
  $('#indice').textContent = big ? M.idx : '–';
  $('#veredicto').textContent = !big ? 'Añade personas' : M.idx >= 75 ? 'Lista para crecer' : M.idx >= 50 ? 'Escala con ajustes' : 'En riesgo de atascarse';
  var ar = big ? arquetipo(M) : ['', ''];
  $('#arq').textContent = ar[0]; $('#arqT').textContent = ar[1];
  var dl = $('#delta');
  if (big && prevIdx !== null && M.idx !== prevIdx) {
    var d = M.idx - prevIdx; dl.textContent = (d > 0 ? '+' : '') + d; dl.className = 'delta ' + (d > 0 ? 'up' : 'dn');
    if (M.idx >= 75 && prevIdx < 75) { md.classList.remove('win'); void md.offsetWidth; md.classList.add('win'); }
  }
  prevIdx = big ? M.idx : null;

  $('#dims').innerHTML = DIMS.map(function (d) {
    var v = M.s[d[0]], q = v >= 75 ? 'ok' : v >= 50 ? 'amb' : 'red';
    return '<div class="dim" title="' + d[3] + '"><span>' + d[1] + '</span><div class="b"><i class="' + q + '" style="width:' + v + '%"></i></div><b>' + v + '</b></div>';
  }).join('');
  $('#alertas').innerHTML = big ? alertas(M).map(function (a) { return '<li class="' + a[0] + '"><b>' + a[1] + '</b>' + a[2] + '</li>'; }).join('') : '';
  var p = big ? plan(M) : null;
  $('#plan').innerHTML = p ? '<small>' + p[0] + '</small>' + p[1] : '';
  $('#plan').style.display = p ? '' : 'none';

  var sn = get(sel);
  if (document.activeElement !== $('#nombre')) $('#nombre').value = sn ? sn.name : '';
  Array.prototype.forEach.call($('#areas').children, function (b) { b.setAttribute('aria-pressed', sn && sn.area === b.dataset.k ? 'true' : 'false'); });
  $('#bCon').setAttribute('aria-pressed', mode === 'con');
  hint(mode === 'con' ? 'Toca a quien también responderá a este jefe' : N.length < 2 ? 'Pulsa ＋ Persona para añadir a quien reporta al nodo marcado' : 'Arrastra los nodos libremente · toca para elegir');
  draw();
}
function hint(t) { $('#hint').textContent = t; }

function pt(e) { var p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); }
function pick(n) {
  if (mode === 'con' && n.id !== sel) {
    var b = get(sel);
    if (n.id === 0 || n.boss.indexOf(b.id) > -1 || anc(b, n.id)) { hint('Esa conexión no es posible'); mode = ''; return; }
    n.boss.push(b.id); mode = '';
  } else { sel = n.id; mode = ''; }
}
function aplicar(k) {
  var P = PL[k]; build(P[0], P[1], P[2], P[3], P[5]);
  cent = P[4]; coord = P[6].slice(); layout(); sel = 0; prevIdx = null; syncCtl();
  Array.prototype.forEach.call($('#plant').querySelectorAll('[data-p]'), function (b) { b.setAttribute('aria-pressed', b.dataset.p === k); });
  render();
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
    b.onclick = function () { var n = get(sel); if (n && n.id) { n.area = n.area === a.k ? '' : a.k; unmarkPlant(); render(); } };
    $('#areas').appendChild(b);
  });
  MEC.forEach(function (m) {
    var b = document.createElement('button'); b.type = 'button'; b.dataset.k = m[0]; b.textContent = m[1];
    b.onclick = function () { var i = coord.indexOf(m[0]); if (i > -1) coord.splice(i, 1); else coord.push(m[0]); unmarkPlant(); syncCtl(); render(); };
    $('#coord').appendChild(b);
  });
  $('#cent').oninput = function () { cent = +this.value; unmarkPlant(); syncCtl(); render(); };
  $('#nombre').oninput = function () { var n = get(sel); if (n) { n.name = this.value; draw(); } };
  $('#bAdd').onclick = function () {
    var p = get(sel), k = kidsOf(p).length, n = mk('', p, p.id ? p.area : '');
    n.x = Math.max(30, Math.min(970, p.x + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 46)); n.y = Math.min(600, p.y + 95);
    unmarkPlant(); render();
  };
  $('#bCon').onclick = function () { mode = mode === 'con' ? '' : 'con'; render(); };
  $('#bOrd').onclick = function () { layout(); render(); };
  $('#bDel').onclick = function () {
    if (!sel) { hint('La dirección no se puede quitar'); return; }
    var d = get(sel), up = d.boss[0];
    N = N.filter(function (n) { return n.id !== d.id; });
    N.forEach(function (n) { if (n.boss.indexOf(d.id) > -1) { n.boss = n.boss.filter(function (b) { return b !== d.id; }); if (!n.boss.length) n.boss = [up]; } });
    sel = up; unmarkPlant(); render();
  };
  $('#bClr').onclick = function () { N = []; nid = 0; mk('Dirección'); sel = 0; unmarkPlant(); render(); };
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
  svg.addEventListener('pointerup', function () { if (!drag) return; if (!drag.mv) pick(drag.n); drag = null; render(); });

  $('#inicio').onclick = function () {
    $('#taller').classList.add('abierto');
    setTimeout(function () { $('#taller').scrollIntoView({ behavior: 'smooth' }); }, 60);
  };
  window.addEventListener('scroll', function () { $('#stick').style.opacity = Math.max(0, 1 - window.scrollY / (window.innerHeight * 0.8)); });

  aplicar('mype');
}
init();
})();

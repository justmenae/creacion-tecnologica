'use strict';
/* DEO · Modelo basado en Mintzberg, Daft y Galbraith. Sin dependencias. */
(function () {
  var $ = function (s) { return document.querySelector(s); };
  var NS = 'http://www.w3.org/2000/svg';
  var cl = function (x) { return Math.max(0, Math.min(100, Math.round(x))); };

  var MECANISMOS = {
    reuniones: 'reuniones de sincronización', procesos: 'procesos documentados',
    metas: 'metas medibles (OKR/KPI)', integrador: 'un rol integrador entre áreas',
    herramienta: 'una herramienta de gestión compartida'
  };

  var PLANTILLAS = {
    semilla: { emp: 6, niv: 2, tramo: 5, areas: 2, cent: 85, dual: 17, coord: ['reuniones'] },
    mype: { emp: 28, niv: 3, tramo: 12, areas: 3, cent: 75, dual: 15, coord: ['reuniones'] },
    agencia: { emp: 20, niv: 2, tramo: 8, areas: 4, cent: 45, dual: 35, coord: ['reuniones', 'herramienta'] }
  };

  var DIMS = [
    { k: 'span', n: 'Tramo de control', w: 0.22 },
    { k: 'vert', n: 'Capas jerárquicas', w: 0.12 },
    { k: 'hor', n: 'Reparto en áreas', w: 0.14 },
    { k: 'mando', n: 'Unidad de mando', w: 0.18 },
    { k: 'cent', n: 'Delegación de decisiones', w: 0.18 },
    { k: 'coord', n: 'Coordinación', w: 0.16 }
  ];

  /* ---------- Modelo ---------- */
  function construirArbol(emp, niv, tramo) {
    var t = [{ id: 0, p: null, d: 0, h: [] }], i = 1, d, ps, a, k, c;
    function hijo(pid) {
      c = { id: t.length, p: pid, d: t[pid].d + 1, h: [] };
      t.push(c); t[pid].h.push(c.id); i++;
    }
    for (d = 1; d <= niv && i < emp; d++) {
      ps = t.filter(function (x) { return x.d === d - 1; });
      for (a = 0; a < ps.length; a++) for (k = 0; k < tramo && i < emp; k++) hijo(ps[a].id);
    }
    // Si faltan capas para tanta gente, el exceso recae en los últimos jefes: se infla su tramo.
    ps = t.filter(function (x) { return x.d === Math.max(0, niv - 1); });
    for (a = 0; i < emp; a = (a + 1) % ps.length) hijo(ps[a].id);
    return t;
  }

  function metaCent(n) { return n <= 8 ? 70 : n <= 20 ? 55 : n <= 40 ? 40 : 30; }
  function capasNecesarias(n) { return Math.max(1, Math.ceil(Math.log(n) / Math.log(6) - 1e-9)); }
  function coordNecesaria(s) { return (s.areas >= 4 || s.emp > 25) ? 4 : s.emp > 10 ? 3 : 2; }

  function evaluar(s) {
    var t = construirArbol(s.emp, s.niv, s.tramo);
    var jefes = t.filter(function (x) { return x.h.length; });
    var maxSpan = Math.max.apply(null, jefes.map(function (x) { return x.h.length; }));
    var profReal = Math.max.apply(null, t.map(function (x) { return x.d; }));
    var meta = metaCent(s.emp), need = capasNecesarias(s.emp), cn = coordNecesaria(s);
    var tiene = s.coord.length, ratio = s.emp / s.areas, sc = {};

    sc.span = maxSpan > 8 ? cl(100 - 14 * (maxSpan - 8)) : (maxSpan < 4 && s.emp >= 10 ? cl(100 - 10 * (4 - maxSpan)) : 100);
    sc.vert = cl(100 - 22 * Math.abs(s.niv - need));
    sc.hor = ratio < 4 ? cl(100 - 18 * (4 - ratio)) : ratio > 15 ? cl(100 - 3 * (ratio - 15)) : 100;
    sc.mando = cl(100 - 2.5 * s.dual);
    sc.cent = cl(100 - 1.4 * Math.max(0, s.cent - meta) - (s.cent < 15 ? 20 : 0));
    sc.coord = cl(100 * Math.min(1, tiene / cn));

    var idx = cl(DIMS.reduce(function (a, d) { return a + sc[d.k] * d.w; }, 0));
    return { t: t, sc: sc, idx: idx, maxSpan: maxSpan, profReal: profReal, meta: meta, need: need, cn: cn, tiene: tiene, ratio: ratio };
  }

  function arquetipo(s, r) {
    var c = s.coord;
    if (s.dual >= 20) return ['Adhocracia / matricial improvisada', 'Mintzberg: el trabajo se resuelve ajustándose entre personas, sin reglas claras de quién manda. Funciona en proyectos creativos, pero sin acuerdos genera choques de prioridades y desgaste.'];
    if (s.emp <= 15 && s.cent >= 55) return ['Estructura simple', 'Mintzberg: una cabeza coordina por supervisión directa. Es rápida y barata mientras el equipo sea pequeño; deja de servir cuando la dirección ya no alcanza a decidir todo.'];
    if (s.niv >= 4 && s.cent >= 55) return ['Burocracia maquinal', 'Mintzberg: muchas capas y decisiones arriba, con trabajo estandarizado. Da control, pero lentitud: la información tarda en subir y bajar.'];
    if (s.areas >= 4 && s.emp >= 25 && s.cent <= 50) return ['Forma divisional', 'Mintzberg: áreas con autonomía propia y metas por resultado. Escala bien si cada área tiene dirección clara y metas medibles.'];
    if (s.cent <= 40 && c.length >= 3) return ['Burocracia profesional', 'Mintzberg: el poder está en especialistas que deciden en su campo, coordinados por estándares y metas. Exige confianza y criterios compartidos.'];
    if (s.cent >= 60) return ['Estructura simple desbordada', 'Mintzberg: nació como estructura simple y creció sin cambiar su forma. La dirección sigue decidiendo, pero ya no llega a todo: ese es el punto donde la empresa se atasca.'];
    return ['Estructura en transición', 'Hay elementos de delegación, pero aún no hay un diseño claro. Conviene decidir qué forma quieres tener a 12 meses y construirla a propósito.'];
  }

  function alertas(s, r) {
    var a = [], falta = Object.keys(MECANISMOS).filter(function (k) { return s.coord.indexOf(k) < 0; });
    if (r.maxSpan > 10) a.push(['red', 'Cuello de botella de supervisión', 'Un jefe supervisa a ' + r.maxSpan + ' personas directas. Daft ubica lo sano entre 4 y 8 en trabajo no rutinario: más allá, nadie recibe guía a tiempo y el trabajo espera.']);
    else if (r.maxSpan > 8) a.push(['amb', 'Tramo de control al límite', 'Un jefe supervisa a ' + r.maxSpan + ' personas. Si el trabajo es cambiante, ya es mucho; si es repetitivo, aún es manejable.']);
    else if (r.maxSpan < 4 && s.emp >= 10) a.push(['amb', 'Jefes con muy poco equipo', 'Ningún jefe pasa de ' + r.maxSpan + ' directos. Estás pagando capas de supervisión que no hacen falta.']);
    if (s.cent >= r.meta + 20) a.push(['red', 'Todo pasa por la dirección', s.cent + '% de las decisiones espera a una persona. Para ' + s.emp + ' personas, lo razonable es cerca de ' + r.meta + '%. Mintzberg: la supervisión directa se satura al crecer.']);
    else if (s.cent >= r.meta + 10) a.push(['amb', 'Delegación todavía corta', 'Decides ' + s.cent + '% de los temas; con este tamaño conviene bajar hacia ' + r.meta + '%.']);
    else if (s.cent < 15) a.push(['amb', 'Falta de dirección', 'Casi nada se decide arriba. Sin criterios comunes, cada área tira por su lado.']);
    if (s.dual >= 20) a.push(['red', 'Cruce de mando', s.dual + '% de las personas responde a dos jefes. Es el choque clásico contra la unidad de mando: órdenes contradictorias, prioridades que se pisan.']);
    else if (s.dual >= 8) a.push(['amb', 'Cruces de mando puntuales', 'Algunas personas reciben órdenes de dos lados. Define quién decide cuando haya conflicto.']);
    if (s.niv > r.need) a.push(['amb', 'Posiblemente demasiadas capas', 'Con ' + s.emp + ' personas bastan unas ' + r.need + ' capas. Cada capa extra retrasa la información (Daft: diferenciación vertical).']);
    else if (s.niv < r.need) a.push(['amb', 'Faltan mandos intermedios', 'Con ' + s.emp + ' personas conviene tener unas ' + r.need + ' capas de jefatura; hoy la dirección absorbe trabajo de supervisión.']);
    if (s.areas === 1 && s.emp > 12) a.push(['amb', 'Sin especialización por áreas', 'Todos hacen de todo. Separar funciones (diferenciación horizontal) mejora calidad y rapidez.']);
    else if (r.ratio < 3) a.push(['amb', 'Áreas demasiado fragmentadas', 'Hay ' + r.ratio.toFixed(1) + ' personas por área. Más áreas significan más reuniones de coordinación para poco trabajo.']);
    if (r.tiene < r.cn) a.push([r.tiene <= r.cn - 2 ? 'red' : 'amb', 'Coordinación insuficiente', 'A este nivel de complejidad (Galbraith) se necesitan al menos ' + r.cn + ' mecanismos y tienes ' + r.tiene + '. Te falta, por ejemplo: ' + falta.slice(0, 2).map(function (k) { return MECANISMOS[k]; }).join(' y ') + '.']);
    if (!a.length) a.push(['ok', 'Sin alertas críticas', 'La estructura declarada es coherente con el tamaño del equipo. Revisa de nuevo antes del próximo salto de crecimiento.']);
    return a.sort(function (x, y) { return ({ red: 0, amb: 1, ok: 2 })[x[0]] - ({ red: 0, amb: 1, ok: 2 })[y[0]]; });
  }

  function plan(s, r) {
    var falta = Object.keys(MECANISMOS).filter(function (k) { return s.coord.indexOf(k) < 0; });
    var acc = {
      span: ['30 días', 'Reparte equipos', 'Agrupa a las personas en equipos de 4 a 8 y nombra un líder para cada uno. Hoy tu jefe más cargado tiene ' + r.maxSpan + ' directos.'],
      vert: ['90 días', s.niv > r.need ? 'Quita una capa' : 'Crea mandos intermedios', s.niv > r.need ? 'Elimina un nivel que solo transmite información y da su autoridad al nivel inferior.' : 'Promueve o contrata líderes de equipo para que la dirección deje de supervisar el día a día.'],
      hor: ['90 días', s.areas === 1 || r.ratio > 15 ? 'Separa funciones' : 'Une áreas pequeñas', s.areas === 1 || r.ratio > 15 ? 'Define 2 o 3 áreas con responsable claro (por ejemplo ventas, operación y administración).' : 'Fusiona áreas de menos de 4 personas bajo un solo responsable para reducir reuniones cruzadas.'],
      mando: ['Esta semana', 'Un jefe por persona', 'Dibuja quién responde a quién. Si alguien tiene dos jefes, elige el jefe formal y deja al segundo como líder de proyecto con alcance limitado.'],
      cent: ['Esta semana', 'Delega con reglas', 'Lista las 10 decisiones que más se repiten. Delega las de bajo riesgo con un tope de monto y pide reporte semanal. Objetivo: bajar a ' + r.meta + '%.'],
      coord: ['30 días', 'Activa coordinación', 'Implementa primero ' + (falta.length ? MECANISMOS[falta[0]] : 'una revisión mensual de la estructura') + '. Galbraith: a más complejidad, más mecanismos de enlace.']
    };
    return DIMS.slice().sort(function (x, y) { return r.sc[x.k] - r.sc[y.k]; }).slice(0, 3).map(function (d) { return acc[d.k]; });
  }

  /* ---------- Organigrama SVG ---------- */
  function el(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  function dibujar(s, r) {
    var t = r.t, svg = $('#org'), x = 0, DX = 28, DY = 72, M = 24, i;
    svg.textContent = '';
    (function pos(id) {
      var n = t[id];
      if (!n.h.length) { n.x = x++; return; }
      n.h.forEach(pos);
      n.x = (t[n.h[0]].x + t[n.h[n.h.length - 1]].x) / 2;
    })(0);
    var W = Math.max(360, x * DX + 2 * M), H = r.profReal * DY + 2 * M + 10;
    var px = function (n) { return M + n.x * DX + DX / 2 - (x * DX < W - 2 * M ? 0 : 0) + (W - 2 * M - x * DX) / 2; };
    var py = function (n) { return M + n.d * DY; };
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.setAttribute('aria-label', 'Organigrama de ' + s.emp + ' personas; el jefe más cargado supervisa a ' + r.maxSpan);

    t.forEach(function (n) {
      if (n.p === null) return;
      var p = t[n.p], mid = (py(p) + py(n)) / 2;
      el('path', { d: 'M' + px(p) + ' ' + py(p) + 'V' + mid + 'H' + px(n) + 'V' + py(n), 'class': 'lin' }, svg);
    });

    var hojas = t.filter(function (n) { return !n.h.length; }), jefes = t.filter(function (n) { return n.h.length; });
    var k = Math.min(8, Math.round(s.dual / 100 * s.emp)), marcadas = {};
    var paso = Math.max(1, Math.floor(hojas.length / Math.max(k, 1)));
    for (i = 0; i < k && i * paso < hojas.length; i++) {
      var h = hojas[i * paso], cand = jefes.filter(function (j) { return j.id !== h.p; });
      if (!cand.length) continue;
      var tg = cand[(i * 2 + 1) % cand.length], ax = px(h), ay = py(h), bx = px(tg), by = py(tg);
      el('path', { d: 'M' + ax + ' ' + ay + 'C' + ax + ' ' + (ay - 45) + ',' + bx + ' ' + (by + 45) + ',' + bx + ' ' + by, 'class': 'cruce' }, svg);
      marcadas[h.id] = 1;
    }

    var ceoSev = s.cent >= r.meta + 20 ? 'red' : s.cent >= r.meta + 10 ? 'amb' : '';
    t.forEach(function (n) {
      var sp = n.h.length, sev = sp > 10 ? 'red' : sp > 8 ? 'amb' : '';
      if (n.id === 0 && ceoSev && (ceoSev === 'red' || !sev)) sev = ceoSev;
      var c = el('circle', { cx: px(n), cy: py(n), r: sp ? 12 : 6, 'class': 'nodo ' + sev + (marcadas[n.id] ? ' dual' : '') }, svg);
      el('title', {}, c).textContent = n.id === 0 ? 'Dirección: supervisa a ' + sp + (ceoSev ? ' · concentra demasiadas decisiones' : '') : sp ? 'Jefe de ' + sp + ' personas' : 'Equipo operativo';
      if (sp) el('text', { x: px(n), y: py(n), 'class': 'nnum' }, svg).textContent = sp;
    });
  }

  /* ---------- Interfaz ---------- */
  var ids = ['emp', 'niv', 'tramo', 'areas', 'cent', 'dual'];
  var unidad = { cent: '%', dual: '%' };

  function leer() {
    var s = { coord: [] };
    ids.forEach(function (i) { s[i] = +$('#' + i).value; });
    document.querySelectorAll('input[name=coord]:checked').forEach(function (c) { s.coord.push(c.value); });
    return s;
  }

  function pintar() {
    var s = leer(), r = evaluar(s);
    ids.forEach(function (i) { $('[data-out=' + i + ']').textContent = s[i] + (unidad[i] || ''); });
    var col = r.idx >= 75 ? 'var(--ok)' : r.idx >= 50 ? 'var(--amb)' : 'var(--red)';
    var m = $('#medidor');
    m.style.setProperty('--p', r.idx); m.style.setProperty('--c', col);
    $('#indice').textContent = r.idx;
    $('#veredicto').textContent = r.idx >= 75 ? 'Lista para crecer' : r.idx >= 50 ? 'Escala con ajustes' : 'En riesgo de atascarse';
    var a = arquetipo(s, r);
    $('#arqNombre').textContent = 'Arquetipo: ' + a[0];
    $('#arqTexto').textContent = a[1];

    var ul = $('#alertas'); ul.textContent = '';
    alertas(s, r).forEach(function (x) {
      var li = document.createElement('li'); li.className = x[0];
      li.innerHTML = '<b></b><p></p>';
      li.firstChild.textContent = x[1]; li.lastChild.textContent = x[2];
      ul.appendChild(li);
    });

    var dm = $('#dims'); dm.textContent = '';
    DIMS.forEach(function (d) {
      var v = r.sc[d.k], q = v >= 75 ? '' : v >= 50 ? 'amb' : 'red', row = document.createElement('div');
      row.className = 'dim';
      row.innerHTML = '<span></span><div class="barra"><i class="' + q + '" style="width:' + v + '%"></i></div><b>' + v + '</b>';
      row.firstChild.textContent = d.n;
      dm.appendChild(row);
    });

    var ol = $('#plan'); ol.textContent = '';
    plan(s, r).forEach(function (p) {
      var li = document.createElement('li');
      li.innerHTML = '<span class="cuando"></span><div><b></b><p></p></div>';
      li.firstChild.textContent = p[0];
      li.querySelector('b').textContent = p[1]; li.querySelector('p').textContent = p[2];
      ol.appendChild(li);
    });
    dibujar(s, r);
  }

  function aplicar(p, nombre) {
    ids.forEach(function (i) { $('#' + i).value = p[i]; });
    document.querySelectorAll('input[name=coord]').forEach(function (c) { c.checked = p.coord.indexOf(c.value) >= 0; });
    document.querySelectorAll('.plant').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.p === nombre ? 'true' : 'false'); });
    pintar();
  }

  function init() {
    document.querySelectorAll('.plant').forEach(function (b) {
      b.addEventListener('click', function () { aplicar(PLANTILLAS[b.dataset.p], b.dataset.p); });
    });
    document.querySelectorAll('.panel input').forEach(function (i) {
      i.addEventListener('input', function () {
        if (i.id !== 'empresa') document.querySelectorAll('.plant').forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
        pintar();
      });
    });
    $('#btnReporte').addEventListener('click', function () {
      $('#repEmpresa').textContent = $('#empresa').value.trim() || 'Empresa sin nombre';
      $('#repFecha').textContent = new Date().toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' });
      window.print();
    });
    aplicar(PLANTILLAS.mype, 'mype');
  }
  init();
})();

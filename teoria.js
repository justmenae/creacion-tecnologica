const acotar = (v) => Math.max(0, Math.min(100, v));

export const DEPTOS = {
  funcional:  { n: "Funcional", m: 75, t: "Agrupa por especialidad (finanzas, producción, marketing). Economías de escala y especialización; riesgo de silos y respuesta lenta. Ideal en entornos estables." },
  procesos:   { n: "Por procesos", m: 65, t: "Agrupa por etapas de un flujo de trabajo (diseño, corte, costura). Eficiente en tecnología rutinaria; exige coordinación entre etapas." },
  productos:  { n: "Por productos / divisional", m: 50, t: "Una división por línea de producto, con sus propias funciones. Mayor foco y responsabilidad por resultados; duplica recursos." },
  geografica: { n: "Geográfica", m: 50, t: "Una unidad por país o región. Cercanía al mercado local; riesgo de inconsistencia entre regiones." },
  clientes:   { n: "Por clientes", m: 45, t: "Unidades según tipo de cliente (corporativo, personas, pymes). Atención especializada; puede fragmentar la oferta." },
  matricial:  { n: "Matricial / por proyectos", m: 30, t: "Cada persona responde a un jefe funcional y a uno de proyecto (doble reporte). Flexible en entornos cambiantes; exige reglas claras para evitar conflicto de autoridad." },
  equipos:    { n: "Por equipos", m: 20, t: "Equipos interfuncionales con autonomía, decisiones descentralizadas y poca formalización. Típico de estructuras planas y horizontales." },
  red:        { n: "En red / modular / virtual", m: 12, t: "El núcleo coordina proveedores y aliados externos; reduce costos fijos y gana flexibilidad, con menos control directo." }
};

const arbol = (raiz, ramas) => {
  const k = ramas.length, n = [["direccion", raiz, 80 + (k - 1) * 150, 40]], e = [];
  ramas.forEach(([a], i) => { n.push(["area", a, 80 + i * 300, 170]); e.push([1, i + 2]); });
  ramas.forEach(([, c], i) => { n.push(["cargo", c, 80 + i * 300, 300]); e.push([i + 2, k + i + 2]); });
  return { nodos: n, enlaces: e };
};

const fun = arbol("Gerencia general", [["Producción", "Jefe de planta"], ["Marketing", "Jefe de ventas"], ["Finanzas", "Contador"], ["Recursos humanos", "Analista de personal"]]);
fun.nodos.push(["area", "Asesoría legal", 1280, 170, true]);
fun.enlaces.push([1, fun.nodos.length]);

export const PLANTILLAS = {
  funcional:  { ...fun, cfg: { depto: "funcional", formal: 75, central: 70 } },
  productos:  { ...arbol("Junta directiva", [["Bebidas energizantes", "Comercial energizantes"], ["Maltas", "Comercial maltas"], ["Refrescantes", "Comercial refrescantes"]]), cfg: { depto: "productos", formal: 55, central: 45 } },
  geografica: { ...arbol("Junta directiva", [["Región Norte", "Ventas Norte"], ["Región Centro", "Ventas Centro"], ["Región Sur", "Ventas Sur"]]), cfg: { depto: "geografica", formal: 55, central: 40 } },
  matricial: {
    nodos: [["direccion", "Gerencia general", 520, 40], ["area", "Gerencia de Ingeniería", 220, 170], ["area", "Gerencia de Operaciones", 520, 170],
            ["area", "Proyecto A", 820, 170], ["area", "Proyecto B", 1120, 170], ["cargo", "Ingeniero 1", 370, 300], ["cargo", "Ingeniero 2", 970, 300]],
    enlaces: [[1, 2], [1, 3], [1, 4], [1, 5], [2, 6], [4, 6], [2, 7], [5, 7]],
    cfg: { depto: "matricial", matricial: true, formal: 35, central: 35 }
  }
};

export function creaCiclo(enlaces, de, a) {
  const vistos = new Set(), pila = [a];
  while (pila.length) {
    const x = pila.pop();
    if (x === de) return true;
    if (vistos.has(x)) continue;
    vistos.add(x);
    enlaces.forEach((l) => { if (l.de === x) pila.push(l.a); });
  }
  return false;
}

export function analizar(nodos, enlaces, matricial) {
  const hijos = new Map(), padres = new Map(), alertas = [];
  nodos.forEach((n) => { hijos.set(n.id, []); padres.set(n.id, []); });
  enlaces.forEach((l) => { if (hijos.has(l.de) && hijos.has(l.a)) { hijos.get(l.de).push(l.a); padres.get(l.a).push(l.de); } });

  const raices = nodos.filter((n) => !padres.get(n.id).length && hijos.get(n.id).length);
  const nivel = new Map(), cola = raices.map((n) => n.id);
  cola.forEach((i) => nivel.set(i, 0));
  while (cola.length) {
    const i = cola.shift();
    hijos.get(i).forEach((h) => { if (!nivel.has(h)) { nivel.set(h, nivel.get(i) + 1); cola.push(h); } });
  }
  const niveles = nivel.size ? Math.max(...nivel.values()) + 1 : 0;
  const amp = new Map(nodos.map((n) => [n.id, hijos.get(n.id).length]));
  const jefes = nodos.filter((n) => amp.get(n.id) > 0);
  const promedio = jefes.length ? jefes.reduce((s, n) => s + amp.get(n.id), 0) / jefes.length : 0;
  const maxima = jefes.length ? Math.max(...jefes.map((n) => amp.get(n.id))) : 0;

  nodos.forEach((n) => {
    const p = padres.get(n.id).length, h = amp.get(n.id);
    if (p > 1) alertas.push(matricial
      ? { t: "info", id: n.id, txt: `«${n.texto}» reporta a ${p} jefes: doble reporte matricial (declarado).` }
      : { t: "err", id: n.id, txt: `«${n.texto}» reporta a ${p} jefes: viola la unidad de mando. Deja un solo jefe o marca la estructura como matricial.` });
    if (h > 7) alertas.push({ t: "aviso", id: n.id, txt: `«${n.texto}» supervisa ${h} unidades: sobrecarga de amplitud de control (recomendado ≤ 7). Agrega un nivel intermedio.` });
    if (h === 1 && !n.staff) alertas.push({ t: "info", id: n.id, txt: `«${n.texto}» tiene un solo subordinado: nivel jerárquico posiblemente innecesario.` });
    if (n.staff && h > 0) alertas.push({ t: "aviso", id: n.id, txt: `«${n.texto}» es staff: asesora, no ejerce autoridad de línea sobre subordinados.` });
    if (!p && !h) alertas.push({ t: "aviso", id: n.id, txt: `«${n.texto}» está aislado: no está en ninguna cadena de mando.` });
    if (p && !nivel.has(n.id)) alertas.push({ t: "err", id: n.id, txt: `«${n.texto}» forma parte de un ciclo: la cadena de mando no llega a la cima.` });
  });
  if (raices.length > 1) alertas.push({ t: "aviso", id: null, txt: `Hay ${raices.length} cimas jerárquicas (${raices.map((r) => r.texto).join(", ")}): la cadena de mando no es única.` });
  if (niveles > 5) alertas.push({ t: "aviso", id: null, txt: `${niveles} niveles jerárquicos: estructura alta, comunicación lenta.` });
  const orden = { err: 0, aviso: 1, info: 2 };
  alertas.sort((a, b) => orden[a.t] - orden[b.t]);
  return { amp, niveles, promedio, maxima, raices: raices.length, alertas, sobrecarga: jefes.filter((n) => amp.get(n.id) > 7).length };
}

export function puntajeActual(m, cfg) {
  const s = m.promedio ? acotar(((8 - m.promedio) / 6) * 100) : 50;
  const l = acotar(((m.niveles - 1) / 5) * 100);
  return Math.round(0.3 * cfg.formal + 0.3 * cfg.central + 0.2 * s + 0.2 * l);
}

const PESOS = {
  estrategia: { costos: 20, diferenciacion: 0, innovacion: -20 },
  tamano: { pequena: -15, mediana: 0, grande: 15 },
  tecno: { rutinaria: 15, mixta: 0, noRutinaria: -15 },
  entorno: { estable: 15, cambiante: 0, incierto: -20 }
};

export function evaluar(cfg, m) {
  const ideal = acotar(50 + PESOS.estrategia[cfg.estrategia] + PESOS.tamano[cfg.tamano] + PESOS.tecno[cfg.tecno] + PESOS.entorno[cfg.entorno]);
  const actual = puntajeActual(m, cfg), delta = actual - ideal;
  const sugerido = Object.keys(DEPTOS).reduce((a, b) => Math.abs(DEPTOS[a].m - ideal) <= Math.abs(DEPTOS[b].m - ideal) ? a : b);
  const r = [];
  if (!m.niveles) return { ideal, actual, sugerido, delta, estado: "vacio", recs: [{ t: "info", txt: "Agrega cuadros y conéctalos para evaluar la estructura." }] };
  if (delta > 15) {
    r.push({ t: "aviso", txt: "Estructura más mecanicista de lo que pide el contexto: reduce la formalización, delega decisiones y amplía la amplitud de control." });
    if (m.niveles > 4) r.push({ t: "aviso", txt: "Aplana la jerarquía: elimina niveles intermedios." });
    if (cfg.central > 60) r.push({ t: "aviso", txt: "Descentraliza: lleva decisiones operativas a quien tiene la información." });
  } else if (delta < -15) {
    r.push({ t: "aviso", txt: "Estructura más orgánica de lo que pide el contexto: define cadena de mando, procedimientos y límites de decisión." });
    if (cfg.formal < 40) r.push({ t: "aviso", txt: "Sube la formalización: reglas y procedimientos escritos para las tareas rutinarias." });
    if (m.promedio && m.promedio > 6) r.push({ t: "aviso", txt: "Reduce la amplitud de control para reforzar la supervisión." });
  } else r.push({ t: "ok", txt: "La estructura es coherente con estrategia, tamaño, tecnología y entorno." });
  if (cfg.entorno === "incierto" && cfg.depto === "funcional") r.push({ t: "aviso", txt: "Entorno muy incierto con diseño funcional: considera equipos interfuncionales o estructura matricial." });
  if (cfg.estrategia === "innovacion" && cfg.formal > 60) r.push({ t: "aviso", txt: "Una estrategia de innovación necesita baja formalización y libre flujo de información." });
  if (cfg.estrategia === "costos" && cfg.tecno === "rutinaria" && cfg.depto === "equipos") r.push({ t: "aviso", txt: "Costos + tecnología rutinaria: un diseño funcional o por procesos suele ser más eficiente." });
  if (cfg.tamano === "grande" && m.niveles <= 2) r.push({ t: "aviso", txt: "Organización grande con pocos niveles: riesgo de sobrecarga de amplitud de control." });
  if (cfg.tamano === "pequena" && m.niveles > 3) r.push({ t: "aviso", txt: "Organización pequeña con muchos niveles: simplifica." });
  if (m.sobrecarga) r.push({ t: "aviso", txt: `${m.sobrecarga} jefe(s) con sobrecarga de amplitud: revisa las alertas.` });
  if (cfg.depto !== sugerido) r.push({ t: "info", txt: `Para este contexto el diseño más cercano es «${DEPTOS[sugerido].n}».` });
  return { ideal, actual, sugerido, delta, estado: Math.abs(delta) <= 15 ? "coherente" : "desajuste", recs: r };
}

import { DEPTOS, PLANTILLAS, creaCiclo, analizar, evaluar } from "./teoria.js";

const STORAGE_KEY = "creacion_tecnologica_org_v1";

const el = {
  empezar: document.getElementById("empezar"),
  editor: document.getElementById("editor"),
  lienzo: document.getElementById("lienzo"),
  escenario: document.getElementById("escenario"),
  lineas: document.getElementById("lineas"),
  pista: document.getElementById("pista"),
  btnConectar: document.getElementById("btnConectar"),
  btnStaff: document.getElementById("btnStaff"),
  btnDeshacer: document.getElementById("btnDeshacer"),
  btnRehacer: document.getElementById("btnRehacer"),
  btnEliminar: document.getElementById("btnEliminar"),
  buscar: document.getElementById("buscar"),
  filtroTipo: document.getElementById("filtroTipo"),
  selPlantilla: document.getElementById("selPlantilla"),
  btnPlantilla: document.getElementById("btnPlantilla"),
  btnExportar: document.getElementById("btnExportar"),
  btnImportar: document.getElementById("btnImportar"),
  archivo: document.getElementById("archivo"),
  btnLimpiar: document.getElementById("btnLimpiar"),
  mensaje: document.getElementById("mensaje"),
  metricas: document.getElementById("metricas"),
  alertas: document.getElementById("alertas"),
  cfgFormal: document.getElementById("cfgFormal"),
  vFormal: document.getElementById("vFormal"),
  cfgCentral: document.getElementById("cfgCentral"),
  vCentral: document.getElementById("vCentral"),
  cfgMatricial: document.getElementById("cfgMatricial"),
  cfgDepto: document.getElementById("cfgDepto"),
  deptoInfo: document.getElementById("deptoInfo"),
  cfgEstrategia: document.getElementById("cfgEstrategia"),
  cfgTamano: document.getElementById("cfgTamano"),
  cfgTecno: document.getElementById("cfgTecno"),
  cfgEntorno: document.getElementById("cfgEntorno"),
  mActual: document.getElementById("mActual"),
  mIdeal: document.getElementById("mIdeal"),
  resumen: document.getElementById("resumen"),
  recomendaciones: document.getElementById("recomendaciones")
};

const defaultEstado = () => ({
  nodos: [],
  enlaces: [],
  cfg: {
    formal: 50,
    central: 50,
    matricial: false,
    depto: "funcional",
    estrategia: "diferenciacion",
    tamano: "mediana",
    tecno: "mixta",
    entorno: "cambiante"
  }
});

let estado = cargarGuardado() || defaultEstado();
let historial = [];
let futuro = [];
let seleccionadoId = null;
let origenConectarId = null;
let modoConectar = false;
let contadorId = calcularSiguienteId(estado);

function calcularSiguienteId(st) {
  let maxNum = 0;
  for (const n of st.nodos || []) {
    const m = String(n.id || "").match(/(\d+)$/);
    if (m) maxNum = Math.max(maxNum, Number(m[1]));
  }
  for (const l of st.enlaces || []) {
    const m = String(l.id || "").match(/(\d+)$/);
    if (m) maxNum = Math.max(maxNum, Number(m[1]));
  }
  return maxNum + 1;
}

function clonarEstado(st) {
  return JSON.parse(JSON.stringify(st));
}

function cargarGuardado() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.nodos) || !Array.isArray(parsed.enlaces)) return null;
    return {
      ...defaultEstado(),
      ...parsed,
      cfg: { ...defaultEstado().cfg, ...(parsed.cfg || {}) }
    };
  } catch {
    return null;
  }
}

function guardarLocal() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(estado));
  } catch {
    // Ignorar errores de cuota en almacenamiento local
  }
}

function setMensaje(texto) {
  if (el.mensaje) el.mensaje.textContent = texto;
}

function registrarCambio(prevSnapshot) {
  historial.push(clonarEstado(prevSnapshot));
  if (historial.length > 40) historial.shift();
  futuro = [];
  guardarLocal();
}

function abrirEditor() {
  el.editor.hidden = false;
  requestAnimationFrame(() => {
    el.editor.classList.add("abierto");
    el.editor.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function poblarSelectDeptos() {
  el.cfgDepto.innerHTML = "";
  for (const [key, info] of Object.entries(DEPTOS)) {
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = info.n;
    el.cfgDepto.appendChild(opt);
  }
}

function sincronizarControlesCfg() {
  const { cfg } = estado;
  el.cfgFormal.value = String(cfg.formal);
  el.vFormal.textContent = String(cfg.formal);
  el.cfgCentral.value = String(cfg.central);
  el.vCentral.textContent = String(cfg.central);
  el.cfgMatricial.checked = Boolean(cfg.matricial);
  el.cfgDepto.value = DEPTOS[cfg.depto] ? cfg.depto : "funcional";
  el.deptoInfo.textContent = DEPTOS[el.cfgDepto.value]?.t || "";
  el.cfgEstrategia.value = cfg.estrategia;
  el.cfgTamano.value = cfg.tamano;
  el.cfgTecno.value = cfg.tecno;
  el.cfgEntorno.value = cfg.entorno;
}

function agregarNodo(tipo) {
  const prev = clonarEstado(estado);
  const etiquetas = {
    direccion: "Dirección general",
    area: "Nueva área",
    cargo: "Nuevo cargo"
  };
  const offset = (estado.nodos.length % 7) * 32;
  const nuevo = {
    id: `n_${contadorId++}`,
    tipo,
    texto: etiquetas[tipo] || "Unidad",
    x: 140 + offset,
    y: tipo === "direccion" ? 60 : tipo === "area" ? 190 : 320,
    staff: false
  };
  estado.nodos.push(nuevo);
  seleccionadoId = nuevo.id;
  registrarCambio(prev);
  render();
  setMensaje(`Se agregó «${nuevo.texto}». Doble clic para editar su nombre.`);
}

function alternarStaff() {
  if (!seleccionadoId) {
    setMensaje("Selecciona un cuadro primero para alternar su autoridad staff.");
    return;
  }
  const nodo = estado.nodos.find((n) => n.id === seleccionadoId);
  if (!nodo) return;
  const prev = clonarEstado(estado);
  nodo.staff = !nodo.staff;
  registrarCambio(prev);
  render();
  setMensaje(`«${nodo.texto}» ahora está marcado como ${nodo.staff ? "staff / asesoría" : "línea"}.`);
}

function conectarNodos(deId, aId) {
  if (deId === aId) {
    setMensaje("No puedes conectar un cuadro consigo mismo.");
    return;
  }
  const existe = estado.enlaces.some((l) => l.de === deId && l.a === aId);
  if (existe) {
    setMensaje("Esos dos cuadros ya están conectados.");
    return;
  }
  if (creaCiclo(estado.enlaces, deId, aId)) {
    setMensaje("Esa conexión crearía un ciclo jerárquico. Elige otro sentido.");
    return;
  }
  const prev = clonarEstado(estado);
  estado.enlaces.push({
    id: `e_${contadorId++}`,
    de: deId,
    a: aId,
    staff: false
  });
  registrarCambio(prev);
  render();
  setMensaje("Conexión creada. Haz clic en una línea si deseas eliminarla.");
}

function eliminarSeleccionado() {
  if (!seleccionadoId) {
    setMensaje("Selecciona un cuadro para eliminarlo.");
    return;
  }
  const prev = clonarEstado(estado);
  estado.nodos = estado.nodos.filter((n) => n.id !== seleccionadoId);
  estado.enlaces = estado.enlaces.filter((l) => l.de !== seleccionadoId && l.a !== seleccionadoId);
  seleccionadoId = null;
  if (origenConectarId === prev.nodos.find((n) => n.id === origenConectarId)?.id) {
    origenConectarId = null;
  }
  registrarCambio(prev);
  render();
  setMensaje("Cuadro eliminado.");
}

function deshacer() {
  if (!historial.length) return;
  futuro.push(clonarEstado(estado));
  estado = historial.pop();
  seleccionadoId = null;
  origenConectarId = null;
  guardarLocal();
  render();
  setMensaje("Acción deshecha.");
}

function rehacer() {
  if (!futuro.length) return;
  historial.push(clonarEstado(estado));
  estado = futuro.pop();
  seleccionadoId = null;
  origenConectarId = null;
  guardarLocal();
  render();
  setMensaje("Acción rehecha.");
}

function cargarPlantilla(clave) {
  const tpl = PLANTILLAS[clave];
  if (!tpl) return;
  const prev = clonarEstado(estado);

  const nodosCreados = tpl.nodos.map((item, idx) => {
    const [tipo, texto, x, y, staff] = item;
    return {
      id: `n_${contadorId++}`,
      tipo,
      texto,
      x,
      y,
      staff: Boolean(staff),
      _idx: idx + 1
    };
  });

  const enlacesCreados = tpl.enlaces.map(([origenIdx, destinoIdx]) => {
    const deNodo = nodosCreados.find((n) => n._idx === origenIdx);
    const aNodo = nodosCreados.find((n) => n._idx === destinoIdx);
    return {
      id: `e_${contadorId++}`,
      de: deNodo ? deNodo.id : "",
      a: aNodo ? aNodo.id : "",
      staff: false
    };
  }).filter((l) => l.de && l.a);

  estado.nodos = nodosCreados.map(({ _idx, ...rest }) => rest);
  estado.enlaces = enlacesCreados;
  estado.cfg = {
    ...defaultEstado().cfg,
    ...(tpl.cfg || {})
  };
  seleccionadoId = null;
  origenConectarId = null;
  registrarCambio(prev);
  sincronizarControlesCfg();
  render();
  setMensaje(`Plantilla «${DEPTOS[tpl.cfg?.depto]?.n || clave}» cargada.`);
}

function limpiarTodo() {
  const prev = clonarEstado(estado);
  estado = defaultEstado();
  seleccionadoId = null;
  origenConectarId = null;
  registrarCambio(prev);
  sincronizarControlesCfg();
  render();
  setMensaje("Lienzo limpiado.");
}

function exportarJSON() {
  const blob = new Blob([JSON.stringify(estado, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "organigrama-diseno.json";
  a.click();
  URL.revokeObjectURL(url);
  setMensaje("Diseño exportado como organigrama-diseno.json.");
}

function importarJSON(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(String(reader.result || "{}"));
      if (!Array.isArray(data.nodos) || !Array.isArray(data.enlaces)) {
        setMensaje("El archivo JSON no tiene una estructura válida.");
        return;
      }
      const prev = clonarEstado(estado);
      estado = {
        ...defaultEstado(),
        ...data,
        cfg: { ...defaultEstado().cfg, ...(data.cfg || {}) }
      };
      contadorId = calcularSiguienteId(estado);
      seleccionadoId = null;
      origenConectarId = null;
      registrarCambio(prev);
      sincronizarControlesCfg();
      render();
      setMensaje("Diseño importado correctamente.");
    } catch {
      setMensaje("No se pudo leer el archivo JSON.");
    }
  };
  reader.readAsText(file);
}

function coincideFiltro(nodo) {
  const q = (el.buscar.value || "").trim().toLowerCase();
  const tipoFiltro = el.filtroTipo.value;

  let pasaTipo = true;
  if (tipoFiltro === "staff") {
    pasaTipo = Boolean(nodo.staff);
  } else if (tipoFiltro) {
    pasaTipo = nodo.tipo === tipoFiltro;
  }

  const pasaTexto = !q || String(nodo.texto || "").toLowerCase().includes(q);
  return pasaTipo && pasaTexto;
}

function renderNodosYLineas(analisis) {
  const tieneFiltro = Boolean((el.buscar.value || "").trim() || el.filtroTipo.value);
  const severidadPorNodo = new Map();

  for (const al of analisis.alertas) {
    if (!al.id) continue;
    const prev = severidadPorNodo.get(al.id);
    if (al.t === "err") severidadPorNodo.set(al.id, "err");
    else if (al.t === "aviso" && prev !== "err") severidadPorNodo.set(al.id, "aviso");
  }

  el.escenario.querySelectorAll(".nodo").forEach((n) => n.remove());
  el.pista.hidden = estado.nodos.length > 0;
  el.escenario.classList.toggle("modo-conectar", modoConectar);

  const posCentro = new Map();

  for (const nodo of estado.nodos) {
    const div = document.createElement("div");
    div.className = `nodo ${nodo.tipo}`;
    if (nodo.staff) div.classList.add("staff");
    if (severidadPorNodo.has(nodo.id)) div.classList.add(severidadPorNodo.get(nodo.id));
    if (nodo.id === seleccionadoId) div.classList.add("seleccionado");
    if (nodo.id === origenConectarId) div.classList.add("origen");
    if (tieneFiltro && !coincideFiltro(nodo)) div.classList.add("tenue");

    div.style.left = `${nodo.x}px`;
    div.style.top = `${nodo.y}px`;
    div.dataset.id = nodo.id;

    const badge = document.createElement("span");
    badge.className = "bd";
    const ampVal = analisis.amp.get(nodo.id) || 0;
    badge.textContent = nodo.staff ? "Staff" : `${nodo.tipo.toUpperCase()} · Alcance ${ampVal}`;

    const txt = document.createElement("span");
    txt.className = "txt";
    txt.textContent = nodo.texto;

    div.appendChild(badge);
    div.appendChild(txt);

    txt.addEventListener("dblclick", (ev) => {
      ev.stopPropagation();
      txt.contentEditable = "true";
      txt.focus();
      const range = document.createRange();
      range.selectNodeContents(txt);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    });

    const finalizarEdicion = () => {
      if (txt.contentEditable !== "true") return;
      txt.contentEditable = "false";
      const limpio = (txt.textContent || "").trim() || "Sin nombre";
      if (limpio !== nodo.texto) {
        const prev = clonarEstado(estado);
        nodo.texto = limpio;
        registrarCambio(prev);
        render();
      } else {
        txt.textContent = nodo.texto;
      }
    };

    txt.addEventListener("blur", finalizarEdicion);
    txt.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") {
        ev.preventDefault();
        txt.blur();
      } else if (ev.key === "Escape") {
        txt.textContent = nodo.texto;
        txt.contentEditable = "false";
      }
    });

    div.addEventListener("pointerdown", (ev) => {
      if (txt.contentEditable === "true" || ev.button !== 0) return;

      seleccionadoId = nodo.id;

      if (modoConectar) {
        ev.stopPropagation();
        if (!origenConectarId) {
          origenConectarId = nodo.id;
          render();
          setMensaje(`Origen: «${nodo.texto}». Ahora haz clic en el cuadro que depende de él.`);
        } else {
          const origen = origenConectarId;
          origenConectarId = null;
          conectarNodos(origen, nodo.id);
        }
        return;
      }

      const prevDrag = clonarEstado(estado);
      let movio = false;
      const startX = ev.clientX;
      const startY = ev.clientY;
      const origX = nodo.x;
      const origY = nodo.y;

      div.classList.add("arrastrando");
      div.setPointerCapture(ev.pointerId);

      const onMove = (moveEv) => {
        const dx = moveEv.clientX - startX;
        const dy = moveEv.clientY - startY;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) movio = true;
        nodo.x = Math.max(12, Math.min(1420, origX + dx));
        nodo.y = Math.max(12, Math.min(920, origY + dy));
        div.style.left = `${nodo.x}px`;
        div.style.top = `${nodo.y}px`;
        dibujarLineas();
      };

      const onUp = (upEv) => {
        div.classList.remove("arrastrando");
        div.releasePointerCapture(upEv.pointerId);
        div.removeEventListener("pointermove", onMove);
        div.removeEventListener("pointerup", onUp);
        if (movio) {
          registrarCambio(prevDrag);
        }
        render();
      };

      div.addEventListener("pointermove", onMove);
      div.addEventListener("pointerup", onUp);
    });

    el.escenario.appendChild(div);
  }

  function dibujarLineas() {
    posCentro.clear();
    for (const nodo of estado.nodos) {
      const domNode = el.escenario.querySelector(`.nodo[data-id="${nodo.id}"]`);
      const w = domNode ? domNode.offsetWidth : 168;
      const h = domNode ? domNode.offsetHeight : 56;
      posCentro.set(nodo.id, {
        topX: nodo.x + w / 2,
        topY: nodo.y,
        bottomX: nodo.x + w / 2,
        bottomY: nodo.y + h
      });
    }

    el.lineas.innerHTML = "";
    for (const enlace of estado.enlaces) {
      const a = posCentro.get(enlace.de);
      const b = posCentro.get(enlace.a);
      if (!a || !b) continue;

      const midY = (a.bottomY + b.topY) / 2;
      const d = `M ${a.bottomX} ${a.bottomY} C ${a.bottomX} ${midY}, ${b.topX} ${midY}, ${b.topX} ${b.topY}`;

      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", d);
      path.setAttribute("class", "linea");
      if (enlace.staff) path.setAttribute("stroke-dasharray", "6 5");
      path.title = "Haz clic para eliminar esta conexión";

      path.addEventListener("click", (ev) => {
        ev.stopPropagation();
        const prev = clonarEstado(estado);
        estado.enlaces = estado.enlaces.filter((item) => item.id !== enlace.id);
        registrarCambio(prev);
        render();
        setMensaje("Conexión eliminada.");
      });

      el.lineas.appendChild(path);
    }
  }

  dibujarLineas();
}

function renderDiagnostico(analisis, evalRes) {
  el.metricas.innerHTML = `
    <div class="kpi"><b>${analisis.niveles}</b>Niveles</div>
    <div class="kpi"><b>${analisis.promedio ? analisis.promedio.toFixed(1) : "0.0"}</b>Alcance prom.</div>
    <div class="kpi"><b>${analisis.maxima}</b>Alcance máx.</div>
  `;

  el.alertas.innerHTML = "";
  if (!analisis.alertas.length) {
    const li = document.createElement("li");
    li.className = "ok";
    li.textContent = estado.nodos.length
      ? "Sin alertas estructurales en el organigrama actual."
      : "Agrega cuadros y conéctalos para ver alertas de unidad de mando y amplitud de control.";
    el.alertas.appendChild(li);
  } else {
    for (const al of analisis.alertas) {
      const li = document.createElement("li");
      li.className = al.t;
      li.textContent = al.txt;
      if (al.id) {
        li.dataset.id = al.id;
        li.addEventListener("click", () => {
          seleccionadoId = al.id;
          render();
          const target = el.escenario.querySelector(`.nodo[data-id="${al.id}"]`);
          if (target) target.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
        });
      }
      el.alertas.appendChild(li);
    }
  }

  el.mActual.style.left = `${evalRes.actual}%`;
  el.mIdeal.style.left = `${evalRes.ideal}%`;

  const etiquetaEstado = evalRes.estado === "vacio"
    ? "Sin estructura"
    : evalRes.estado === "coherente"
      ? "Coherente"
      : "Desajuste";

  el.resumen.textContent = `${etiquetaEstado}: puntaje actual ${evalRes.actual}/100 vs. ideal ${evalRes.ideal}/100 para el contexto.`;

  el.recomendaciones.innerHTML = "";
  for (const rec of evalRes.recs) {
    const li = document.createElement("li");
    li.className = rec.t;
    li.textContent = rec.txt;
    el.recomendaciones.appendChild(li);
  }
}

function render() {
  const analisis = analizar(estado.nodos, estado.enlaces, Boolean(estado.cfg.matricial));
  const evalRes = evaluar(estado.cfg, analisis);

  el.btnDeshacer.disabled = historial.length === 0;
  el.btnRehacer.disabled = futuro.length === 0;
  el.btnEliminar.disabled = !seleccionadoId;
  el.btnConectar.setAttribute("aria-pressed", String(modoConectar));

  renderNodosYLineas(analisis);
  renderDiagnostico(analisis, evalRes);
}

function bindEventos() {
  el.empezar.addEventListener("click", abrirEditor);

  document.querySelectorAll("[data-add]").forEach((btn) => {
    btn.addEventListener("click", () => agregarNodo(btn.dataset.add));
  });

  el.btnConectar.addEventListener("click", () => {
    modoConectar = !modoConectar;
    origenConectarId = null;
    render();
    setMensaje(
      modoConectar
        ? "Modo conectar activado: haz clic en el cuadro superior y luego en el que depende de él."
        : "Modo conectar desactivado."
    );
  });

  el.btnStaff.addEventListener("click", alternarStaff);
  el.btnDeshacer.addEventListener("click", deshacer);
  el.btnRehacer.addEventListener("click", rehacer);
  el.btnEliminar.addEventListener("click", eliminarSeleccionado);

  el.buscar.addEventListener("input", render);
  el.filtroTipo.addEventListener("change", render);

  el.btnPlantilla.addEventListener("click", () => cargarPlantilla(el.selPlantilla.value));
  el.btnExportar.addEventListener("click", exportarJSON);
  el.btnImportar.addEventListener("click", () => el.archivo.click());
  el.archivo.addEventListener("change", (ev) => {
    importarJSON(ev.target.files?.[0]);
    ev.target.value = "";
  });
  el.btnLimpiar.addEventListener("click", limpiarTodo);

  const actualizarCfg = (fn) => {
    const prev = clonarEstado(estado);
    fn(estado.cfg);
    registrarCambio(prev);
    sincronizarControlesCfg();
    render();
  };

  el.cfgFormal.addEventListener("input", () => {
    el.vFormal.textContent = el.cfgFormal.value;
    actualizarCfg((cfg) => { cfg.formal = Number(el.cfgFormal.value); });
  });

  el.cfgCentral.addEventListener("input", () => {
    el.vCentral.textContent = el.cfgCentral.value;
    actualizarCfg((cfg) => { cfg.central = Number(el.cfgCentral.value); });
  });

  el.cfgMatricial.addEventListener("change", () => {
    actualizarCfg((cfg) => { cfg.matricial = el.cfgMatricial.checked; });
  });

  el.cfgDepto.addEventListener("change", () => {
    actualizarCfg((cfg) => { cfg.depto = el.cfgDepto.value; });
  });

  el.cfgEstrategia.addEventListener("change", () => {
    actualizarCfg((cfg) => { cfg.estrategia = el.cfgEstrategia.value; });
  });

  el.cfgTamano.addEventListener("change", () => {
    actualizarCfg((cfg) => { cfg.tamano = el.cfgTamano.value; });
  });

  el.cfgTecno.addEventListener("change", () => {
    actualizarCfg((cfg) => { cfg.tecno = el.cfgTecno.value; });
  });

  el.cfgEntorno.addEventListener("change", () => {
    actualizarCfg((cfg) => { cfg.entorno = el.cfgEntorno.value; });
  });

  el.escenario.addEventListener("click", (ev) => {
    if (ev.target === el.escenario || ev.target === el.lineas) {
      seleccionadoId = null;
      if (modoConectar) origenConectarId = null;
      render();
    }
  });

  document.addEventListener("keydown", (ev) => {
    const activo = document.activeElement;
    const escribiendo = activo && (activo.tagName === "INPUT" || activo.tagName === "SELECT" || activo.isContentEditable);
    if (escribiendo) return;

    if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === "z" && !ev.shiftKey) {
      ev.preventDefault();
      deshacer();
    } else if ((ev.ctrlKey || ev.metaKey) && (ev.key.toLowerCase() === "y" || (ev.key.toLowerCase() === "z" && ev.shiftKey))) {
      ev.preventDefault();
      rehacer();
    } else if ((ev.key === "Delete" || ev.key === "Backspace") && seleccionadoId) {
      ev.preventDefault();
      eliminarSeleccionado();
    }
  });
}

poblarSelectDeptos();
sincronizarControlesCfg();
bindEventos();
render();

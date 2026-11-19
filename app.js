"use strict";

const $ = (s) => document.querySelector(s);
const portada = $("#portada"), editor = $("#editor"), escenario = $("#escenario");
const lineas = $("#lineas"), pista = $("#pista"), mensaje = $("#mensaje"), btnConectar = $("#btnConectar");

const CLAVE = "organigrama-v1";
const TEXTOS = { direccion: "Dirección general", area: "Nueva área", cargo: "Nuevo cargo" };
const FILA = { direccion: 40, area: 170, cargo: 300 };
const AYUDA = {
  direccion: "Arrástrala a su lugar. Doble clic para cambiar el nombre.",
  area: "Arrástrala bajo la dirección y usa Conectar para unirlas.",
  cargo: "Colócalo bajo su área y conéctalo con ella."
};

let nodos = [], enlaces = [], siguiente = 1;
let sel = null, origen = null, conectando = false;
const els = new Map();

/* ---------- Portada: se desvanece al deslizar ---------- */
function desvanecer() {
  const p = Math.min(1, window.scrollY / (window.innerHeight * 0.8));
  portada.style.opacity = 1 - p;
}
window.addEventListener("scroll", desvanecer, { passive: true });

/* ---------- Abrir el editor ---------- */
$("#empezar").addEventListener("click", () => {
  editor.hidden = false;
  requestAnimationFrame(() => {
    editor.classList.add("abierto");
    dibujarLineas();
  });
  editor.scrollIntoView({ behavior: "smooth", block: "start" });
});

/* ---------- Guardado local (en este navegador) ---------- */
function guardar() {
  try { localStorage.setItem(CLAVE, JSON.stringify({ nodos, enlaces, siguiente })); } catch (e) {}
}
function cargar() {
  try {
    const d = JSON.parse(localStorage.getItem(CLAVE));
    if (d && Array.isArray(d.nodos)) {
      nodos = d.nodos;
      enlaces = d.enlaces || [];
      siguiente = d.siguiente || nodos.length + 1;
    }
  } catch (e) {}
}

function decir(t) { mensaje.textContent = t; }

/* ---------- Cuadros ---------- */
function pintarNodo(n) {
  const e = document.createElement("div");
  e.className = "nodo " + n.tipo;
  e.tabIndex = 0;
  e.textContent = n.texto;
  e.style.left = n.x + "px";
  e.style.top = n.y + "px";
  e.addEventListener("pointerdown", (ev) => arrastrar(ev, n, e));
  e.addEventListener("click", () => clicNodo(n));
  e.addEventListener("dblclick", () => editar(n, e));
  e.addEventListener("keydown", (k) => {
    if (k.key === "Enter" && e.isContentEditable) { k.preventDefault(); e.blur(); }
  });
  escenario.appendChild(e);
  els.set(n.id, e);
}

function crearNodo(tipo, x, y, texto) {
  const n = { id: siguiente++, tipo, x, y, texto: texto || TEXTOS[tipo] };
  nodos.push(n);
  pintarNodo(n);
  return n;
}

function agregar(tipo) {
  const c = nodos.filter((n) => n.tipo === tipo).length;
  const n = crearNodo(tipo, 40 + (c % 8) * 190, FILA[tipo] + Math.floor(c / 8) * 90);
  sel = n.id;
  actualizar();
  guardar();
  decir(AYUDA[tipo]);
}

function marcar() {
  els.forEach((e, id) => {
    e.classList.toggle("seleccionado", id === sel);
    e.classList.toggle("origen", id === origen);
  });
}

function actualizar() {
  pista.hidden = nodos.length > 0;
  marcar();
  dibujarLineas();
}

function clicNodo(n) {
  if (conectando) {
    if (origen === null) {
      origen = n.id;
      decir("Ahora elige el cuadro que depende de este.");
    } else if (origen !== n.id) {
      if (!enlaces.some((l) => l.de === origen && l.a === n.id)) {
        enlaces.push({ de: origen, a: n.id });
        guardar();
      }
      origen = null;
      decir("Conectado. Puedes seguir conectando o desactivar Conectar.");
    }
  } else {
    sel = n.id;
    decir("Seleccionado. Arrástralo, edítalo con doble clic o elimínalo.");
  }
  actualizar();
}

/* ---------- Arrastrar ---------- */
function arrastrar(ev, n, e) {
  if (conectando || e.isContentEditable) return;
  const ox = ev.clientX - n.x, oy = ev.clientY - n.y;
  e.setPointerCapture(ev.pointerId);
  e.classList.add("arrastrando");
  const mover = (m) => {
    n.x = Math.max(0, m.clientX - ox);
    n.y = Math.max(0, m.clientY - oy);
    e.style.left = n.x + "px";
    e.style.top = n.y + "px";
    dibujarLineas();
  };
  const soltar = () => {
    e.removeEventListener("pointermove", mover);
    e.removeEventListener("pointerup", soltar);
    e.classList.remove("arrastrando");
    guardar();
  };
  e.addEventListener("pointermove", mover);
  e.addEventListener("pointerup", soltar);
}

/* ---------- Editar texto ---------- */
function editar(n, e) {
  if (conectando) return;
  e.contentEditable = "true";
  e.focus();
  document.getSelection().selectAllChildren(e);
  const fin = () => {
    e.contentEditable = "false";
    n.texto = e.textContent.trim() || n.texto;
    e.textContent = n.texto;
    e.removeEventListener("blur", fin);
    guardar();
    dibujarLineas();
  };
  e.addEventListener("blur", fin);
}

/* ---------- Líneas entre cuadros ---------- */
function dibujarLineas() {
  lineas.innerHTML = "";
  enlaces.forEach((l, i) => {
    const A = nodos.find((n) => n.id === l.de), B = nodos.find((n) => n.id === l.a);
    const a = els.get(l.de), b = els.get(l.a);
    if (!A || !B || !a || !b) return;
    const x1 = A.x + a.offsetWidth / 2, y1 = A.y + a.offsetHeight;
    const x2 = B.x + b.offsetWidth / 2, y2 = B.y;
    const ym = (y1 + y2) / 2;
    const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
    p.setAttribute("d", `M${x1} ${y1}V${ym}H${x2}V${y2}`);
    p.setAttribute("class", "linea");
    const t = document.createElementNS("http://www.w3.org/2000/svg", "title");
    t.textContent = "Clic para quitar esta conexión";
    p.appendChild(t);
    p.addEventListener("click", () => {
      enlaces.splice(i, 1);
      guardar();
      dibujarLineas();
      decir("Conexión quitada.");
    });
    lineas.appendChild(p);
  });
}

/* ---------- Herramientas ---------- */
document.querySelectorAll("[data-add]").forEach((b) =>
  b.addEventListener("click", () => agregar(b.dataset.add)));

btnConectar.addEventListener("click", () => {
  conectando = !conectando;
  origen = null;
  btnConectar.setAttribute("aria-pressed", conectando);
  escenario.classList.toggle("modo-conectar", conectando);
  decir(conectando
    ? "Haz clic en el cuadro superior y luego en el que depende de él."
    : "Conectar desactivado. Ya puedes mover los cuadros.");
  marcar();
});

function eliminar() {
  if (sel === null) { decir("Primero haz clic en el cuadro que quieres eliminar."); return; }
  els.get(sel).remove();
  els.delete(sel);
  nodos = nodos.filter((n) => n.id !== sel);
  enlaces = enlaces.filter((l) => l.de !== sel && l.a !== sel);
  sel = null;
  actualizar();
  guardar();
  decir("Cuadro eliminado.");
}
$("#btnEliminar").addEventListener("click", eliminar);

function vaciar() {
  els.forEach((e) => e.remove());
  els.clear();
  nodos = []; enlaces = []; siguiente = 1; sel = null; origen = null;
}

$("#btnLimpiar").addEventListener("click", () => {
  if (nodos.length && !confirm("¿Borrar todo el lienzo?")) return;
  vaciar();
  actualizar();
  guardar();
  decir("Lienzo limpio. Agrega tu primer cuadro.");
});

$("#btnEjemplo").addEventListener("click", () => {
  if (nodos.length && !confirm("Esto reemplaza lo que tienes en el lienzo. ¿Continuar?")) return;
  vaciar();
  crearNodo("direccion", 520, 40, "Gerencia general");
  crearNodo("area", 190, 170, "Finanzas");
  crearNodo("area", 520, 170, "Operaciones");
  crearNodo("area", 850, 170, "Marketing");
  crearNodo("cargo", 190, 300, "Contador");
  crearNodo("cargo", 520, 300, "Jefe de planta");
  crearNodo("cargo", 850, 300, "Diseñador");
  enlaces = [[1, 2], [1, 3], [1, 4], [2, 5], [3, 6], [4, 7]].map(([de, a]) => ({ de, a }));
  actualizar();
  guardar();
  decir("Ejemplo cargado. Muévelo, edítalo o agrega más cuadros.");
});

/* ---------- Teclado y clic en el fondo ---------- */
document.addEventListener("keydown", (e) => {
  if (e.key === "Delete" && !document.activeElement.isContentEditable) eliminar();
  if (e.key === "Escape" && conectando) btnConectar.click();
});
escenario.addEventListener("click", (e) => {
  if (e.target === escenario || e.target === lineas) { sel = null; origen = null; marcar(); }
});

/* ---------- Inicio ---------- */
cargar();
nodos.forEach(pintarNodo);
actualizar();
desvanecer();

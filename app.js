let state = {
  turn: 1,
  maxTurns: 5,
  budget: 10000,
  cohesion: 40,
  infoflow: 35,
  response: 45,
  systems: { erp: false, crm: false, org: false }
};

const scenarios = [
  {
    title: "Turno 1: Cuello de botella en pedidos",
    desc: "Ventas cerró un contrato grande, pero Almacén no sabía que no había stock suficiente porque usan hojas de cálculo separadas.",
    choices: [
      {
        text: "Establecer protocolos de comunicación diaria entre áreas (Costo: $500)",
        effect: { budget: -500, cohesion: 12, infoflow: 10, response: 8 },
        log: "Creaste reuniones de sincronización. Mejoró la coordinación básica."
      },
      {
        text: "Resolver el pedido pagando envíos urgentes sin cambiar el proceso (Costo: $1,500)",
        effect: { budget: -1500, cohesion: -5, infoflow: -5, response: 5 },
        log: "Apagaste el incendio con dinero, pero la desorganización interna persiste."
      }
    ]
  },
  {
    title: "Turno 2: Duplicidad de datos financieros",
    desc: "Finanzas reporta pérdidas distintas a las registradas por Comercial debido a falta de estandarización.",
    choices: [
      {
        text: "Unificar formatos y crear un tablero de indicadores compartidos (Costo: $800)",
        effect: { budget: -800, cohesion: 10, infoflow: 18, response: 10 },
        log: "Estandarizaste los datos: ahora todas las áreas leen la misma información."
      },
      {
        text: "Delegar la revisión manual a un asistente externo (Costo: $1,000)",
        effect: { budget: -1000, cohesion: 0, infoflow: -8, response: -5 },
        log: "El proceso sigue lento y propenso a errores humanos."
      }
    ]
  },
  {
    title: "Turno 3: Expansión de nueva línea de servicio",
    desc: "La empresa lanza un nuevo servicio y los equipos no saben quién toma las decisiones operativas.",
    choices: [
      {
        text: "Definir matriz de responsabilidades (RACI) y flujos claros (Costo: $600)",
        effect: { budget: -600, cohesion: 18, infoflow: 10, response: 15 },
        log: "Clarificaste roles y autoridad. Los equipos responden sin fricciones."
      },
      {
        text: "Centralizar todas las aprobaciones en la gerencia general (Costo: $0)",
        effect: { budget: 0, cohesion: -10, infoflow: -5, response: -18 },
        log: "La gerencia se saturó y las decisiones tardan días en aprobarse."
      }
    ]
  },
  {
    title: "Turno 4: Crisis de demanda repentina",
    desc: "Un pico inesperado de clientes pone a prueba la estructura actual y tus sistemas de información.",
    choices: [
      {
        text: "Automatizar alertas de inventario y redistribuir células de trabajo (Costo: $1,200)",
        effect: { budget: -1200, cohesion: 12, infoflow: 15, response: 20 },
        log: "Tu diseño organizacional soportó el pico de demanda con éxito."
      },
      {
        text: "Forzar horas extra sin reorganizar los flujos (Costo: $1,800)",
        effect: { budget: -1800, cohesion: -12, infoflow: -5, response: 5 },
        log: "El equipo sufrió desgaste por falta de soporte sistémico."
      }
    ]
  },
  {
    title: "Turno 5: Auditoría de Sostenibilidad Empresarial",
    desc: "El directorio evalúa si la arquitectura organizacional está lista para escalar a nivel nacional.",
    choices: [
      {
        text: "Consolidar gobierno de datos y mejora continua (Costo: $1,000)",
        effect: { budget: -1000, cohesion: 15, infoflow: 15, response: 15 },
        log: "Cierre sólido: arquitectura alineada con la estrategia empresarial."
      },
      {
        text: "Recortar presupuesto de sistemas para ahorrar caja (Costo: +$1,000)",
        effect: { budget: 1000, cohesion: -15, infoflow: -20, response: -15 },
        log: "Ahorraste dinero a corto plazo, pero debilitaste los sistemas clave."
      }
    ]
  }
];

function clamp(val) {
  return Math.max(0, Math.min(100, val));
}

function addLog(msg) {
  const ul = document.getElementById("event-log");
  const li = document.createElement("li");
  li.textContent = `• [Turno ${state.turn}] ${msg}`;
  ul.prepend(li);
}

function updateDepartmentsUI() {
  const deptVentas = document.getElementById("dept-ventas");
  const deptOps = document.getElementById("dept-ops");
  const deptFinanzas = document.getElementById("dept-finanzas");

  deptVentas.classList.remove("connected");
  deptOps.classList.remove("connected");
  deptFinanzas.classList.remove("connected");

  deptVentas.innerHTML = "🛒 <strong>Comercial / Ventas</strong><br><small>Estado: Operación manual</small>";
  deptOps.innerHTML = "📦 <strong>Operaciones / Almacén</strong><br><small>Estado: Aislado</small>";
  deptFinanzas.innerHTML = "📊 <strong>Finanzas y Control</strong><br><small>Estado: Reportes tardíos</small>";

  if (state.systems.erp) {
    deptOps.classList.add("connected");
    deptOps.innerHTML = "📦 <strong>Operaciones / Almacén</strong><br><small>Conectado vía ERP</small>";
    deptFinanzas.classList.add("connected");
    deptFinanzas.innerHTML = "📊 <strong>Finanzas y Control</strong><br><small>Datos en tiempo real</small>";
  }

  if (state.systems.crm) {
    deptVentas.classList.add("connected");
    deptVentas.innerHTML = "🛒 <strong>Comercial / Ventas</strong><br><small>CRM Activo</small>";
  }

  if (state.systems.org) {
    deptVentas.classList.add("connected");
    deptOps.classList.add("connected");
    deptFinanzas.classList.add("connected");
  }
}

function updateSystemsButtonsUI() {
  const btnErp = document.getElementById("btn-erp");
  const btnCrm = document.getElementById("btn-crm");
  const btnOrg = document.getElementById("btn-org");

  btnErp.disabled = state.systems.erp || state.budget < 3500;
  btnCrm.disabled = state.systems.crm || state.budget < 2500;
  btnOrg.disabled = state.systems.org || state.budget < 2000;

  btnErp.classList.toggle("active-system", state.systems.erp);
  btnCrm.classList.toggle("active-system", state.systems.crm);
  btnOrg.classList.toggle("active-system", state.systems.org);

  btnErp.querySelector(".cost-pill").textContent = state.systems.erp ? "Activo ✓" : "$3,500";
  btnCrm.querySelector(".cost-pill").textContent = state.systems.crm ? "Activo ✓" : "$2,500";
  btnOrg.querySelector(".cost-pill").textContent = state.systems.org ? "Activo ✓" : "$2,000";

  const activeCount = Object.values(state.systems).filter(Boolean).length;
  document.getElementById("systems-count").textContent = `${activeCount} / 3 activos`;
}

function updateUI() {
  document.getElementById("turn-display").textContent = Math.min(state.turn, state.maxTurns);
  document.getElementById("max-turns-display").textContent = state.maxTurns;
  document.getElementById("budget-val").textContent = `$${state.budget.toLocaleString()}`;
  document.getElementById("cohesion-val").textContent = `${state.cohesion}%`;
  document.getElementById("infoflow-val").textContent = `${state.infoflow}%`;
  document.getElementById("response-val").textContent = `${state.response}%`;

  document.getElementById("cohesion-bar").style.width = `${state.cohesion}%`;
  document.getElementById("infoflow-bar").style.width = `${state.infoflow}%`;
  document.getElementById("response-bar").style.width = `${state.response}%`;

  const budgetHint = document.getElementById("budget-status");
  if (state.budget < 1500) {
    budgetHint.textContent = "Caja ajustada: prioriza decisiones de alto impacto";
    budgetHint.classList.add("low-budget");
  } else {
    budgetHint.textContent = "Liquidez operativa disponible";
    budgetHint.classList.remove("low-budget");
  }

  updateDepartmentsUI();
  updateSystemsButtonsUI();

  if (state.turn <= state.maxTurns) {
    const current = scenarios[state.turn - 1];
    document.getElementById("scenario-title").textContent = current.title;
    document.getElementById("scenario-desc").textContent = current.desc;

    const container = document.getElementById("choices-container");
    container.innerHTML = "";
    current.choices.forEach((choice) => {
      const btn = document.createElement("button");
      btn.className = "choice-btn";
      btn.textContent = choice.text;
      btn.onclick = () => makeChoice(choice);
      container.appendChild(btn);
    });
  }
}

function buySystem(type) {
  if (type === "erp" && state.budget >= 3500 && !state.systems.erp) {
    state.budget -= 3500;
    state.systems.erp = true;
    state.infoflow = clamp(state.infoflow + 25);
    state.cohesion = clamp(state.cohesion + 20);
    addLog("Implementaste un ERP: las áreas comparten datos en tiempo real.");
  } else if (type === "crm" && state.budget >= 2500 && !state.systems.crm) {
    state.budget -= 2500;
    state.systems.crm = true;
    state.response = clamp(state.response + 20);
    state.infoflow = clamp(state.infoflow + 15);
    addLog("Desplegaste un CRM: la información comercial está centralizada.");
  } else if (type === "org" && state.budget >= 2000 && !state.systems.org) {
    state.budget -= 2000;
    state.systems.org = true;
    state.cohesion = clamp(state.cohesion + 25);
    state.response = clamp(state.response + 15);
    addLog("Rediseño matricial aplicado: comunicación horizontal activa.");
  }
  updateUI();
}

function makeChoice(choice) {
  state.budget += choice.effect.budget;
  state.cohesion = clamp(state.cohesion + choice.effect.cohesion);
  state.infoflow = clamp(state.infoflow + choice.effect.infoflow);
  state.response = clamp(state.response + choice.effect.response);
  addLog(choice.log);

  if (state.turn < state.maxTurns) {
    state.turn++;
    updateUI();
  } else {
    endGame();
  }
}

function endGame() {
  updateUI();
  document.getElementById("game-board").classList.add("hidden");
  const endScreen = document.getElementById("end-screen");
  endScreen.classList.remove("hidden");

  const avg = Math.round((state.cohesion + state.infoflow + state.response) / 3);
  let diagnosis = "";
  if (avg >= 75) {
    diagnosis = "¡Excelente diseño organizacional! Lograste integrar sistemas de información clave y eliminar cuellos de botella.";
  } else if (avg >= 50) {
    diagnosis = "Organización funcional pero mejorable. Aún existen brechas de comunicación entre departamentos.";
  } else {
    diagnosis = "Estructura fragmentada. La falta de sistemas de información integrados generó decisiones reactivas.";
  }

  const activeSystems = [];
  if (state.systems.erp) activeSystems.push("ERP Integrado");
  if (state.systems.crm) activeSystems.push("CRM Centralizado");
  if (state.systems.org) activeSystems.push("Rediseño Matricial");
  const systemsText = activeSystems.length > 0 ? activeSystems.join(", ") : "Ninguno (operación tradicional)";

  document.getElementById("final-summary").textContent = diagnosis;
  document.getElementById("final-stats").innerHTML = `
    <p>
      <strong>Índice Global de Diseño Organizacional:</strong> ${avg}% |
      <strong>Presupuesto Restante:</strong> $${state.budget.toLocaleString()}
    </p>
    <p style="margin-top:8px; color:#cbd5e1;">
      <strong>Sistemas y estructuras implementadas:</strong> ${systemsText}
    </p>
    <div class="stats-grid">
      <div class="stat-chip">
        <span>Cohesión de Áreas</span>
        <strong>${state.cohesion}%</strong>
      </div>
      <div class="stat-chip">
        <span>Flujo de Información</span>
        <strong>${state.infoflow}%</strong>
      </div>
      <div class="stat-chip">
        <span>Capacidad de Respuesta</span>
        <strong>${state.response}%</strong>
      </div>
    </div>
  `;
}

function resetGame() {
  state = {
    turn: 1,
    maxTurns: 5,
    budget: 10000,
    cohesion: 40,
    infoflow: 35,
    response: 45,
    systems: { erp: false, crm: false, org: false }
  };
  document.getElementById("game-board").classList.remove("hidden");
  document.getElementById("end-screen").classList.add("hidden");
  document.getElementById("event-log").innerHTML = "<li>Nueva simulación iniciada. Diseña tu organización empresarial.</li>";
  updateUI();
}

// Iniciar juego
updateUI();

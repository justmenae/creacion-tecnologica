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

function updateUI() {
  document.getElementById("turn-display").textContent = state.turn;
  document.getElementById("budget-val").textContent = `$${state.budget.toLocaleString()}`;
  document.getElementById("cohesion-val").textContent = `${state.cohesion}%`;
  document.getElementById("infoflow-val").textContent = `${state.infoflow}%`;
  document.getElementById("response-val").textContent = `${state.response}%`;

  // Actualizar estado visual de departamentos
  if (state.systems.erp) {
    document.getElementById("dept-ops").classList.add("connected");
    document.getElementById("dept-ops").innerHTML = "📦 <strong>Operaciones / Almacén</strong><br><small>Conectado vía ERP</small>";
    document.getElementById("dept-finanzas").classList.add("connected");
    document.getElementById("dept-finanzas").innerHTML = "📊 <strong>Finanzas y Control</strong><br><small>Datos en tiempo real</small>";
  }
  if (state.systems.crm) {
    document.getElementById("dept-ventas").classList.add("connected");
    document.getElementById("dept-ventas").innerHTML = "🛒 <strong>Comercial / Ventas</strong><br><small>CRM Activo</small>";
  }

  // Botones de sistemas
  document.getElementById("btn-erp").disabled = state.systems.erp || state.budget < 3500;
  document.getElementById("btn-crm").disabled = state.systems.crm || state.budget < 2500;
  document.getElementById("btn-org").disabled = state.systems.org || state.budget < 2000;

  // Cargar escenario actual
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

  document.getElementById("final-summary").textContent = diagnosis;
  document.getElementById("final-stats").innerHTML = `
    <p style="margin-top:12px;">
      <strong>Índice Global de Diseño Organizacional:</strong> ${avg}% | 
      <strong>Presupuesto Restante:</strong> $${state.budget.toLocaleString()}
    </p>
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
  
  // Restaurar tarjetas de departamentos
  document.getElementById("dept-ventas").classList.remove("connected");
  document.getElementById("dept-ventas").innerHTML = "🛒 <strong>Comercial / Ventas</strong><br><small>Estado: Operación manual</small>";
  document.getElementById("dept-ops").classList.remove("connected");
  document.getElementById("dept-ops").innerHTML = "📦 <strong>Operaciones / Almacén</strong><br><small>Estado: Aislado</small>";
  document.getElementById("dept-finanzas").classList.remove("connected");
  document.getElementById("dept-finanzas").innerHTML = "📊 <strong>Finanzas y Control</strong><br><small>Estado: Reportes tardíos</small>";

  updateUI();
}

// Iniciar juego
updateUI();

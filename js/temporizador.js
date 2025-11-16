// temporizador.js (PIXI HUD)

const tiempo_inicial = 80; // 30s primera fase + 50s segunda fase
let timeLeft = tiempo_inicial;
let timerInterval = null;
let pixiTimerText = null;
let blinkState = false;
let firstPhaseConverted = false; // flag para convertir 1/3 después de 30s

function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

function createPixiTimer() {
  // colocarlo en `hudContainer` si existe, sino en stage
  const parent =
    typeof hudContainer !== "undefined"
      ? hudContainer
      : typeof app !== "undefined"
      ? app.stage
      : null;
  if (!parent) {
    console.warn(
      "No se encontró contenedor HUD ni app.stage. Temporizador no creado."
    );
    return;
  }

  const style = new PIXI.TextStyle({
    fontFamily: "Special Elite",
    fontSize: 36,
    fill: "#ffffff",
    stroke: "#000000",
    strokeThickness: 4,
  });

  pixiTimerText = new PIXI.Text(formatTime(timeLeft), style);
  pixiTimerText.anchor.set(0.5, 0);
  // posicion superior-centro del canvas
  pixiTimerText.x =
    typeof app !== "undefined" ? app.renderer.width / 2 : window.innerWidth / 2;
  pixiTimerText.y = 12;
  // Asegurar que quede fijo en pantalla aunque el world se mueva (está en hudContainer)
  parent.addChild(pixiTimerText);

  // adaptación al resize
  if (typeof app !== "undefined" && app.renderer) {
    app.renderer.on("resize", () => {
      pixiTimerText.x = app.renderer.width / 2;
    });
  }
}

function updatePixiDisplay() {
  if (!pixiTimerText) return;
  pixiTimerText.text = formatTime(Math.max(0, timeLeft));

  // Estructura: 80-50 (primera fase 30s), 50-0 (segunda fase 50s)
  // Primera fase: parpadea cuando 60 > timeLeft >= 50 (últimos 10s de primera fase)
  // Segunda fase: parpadea cuando 10 > timeLeft >= 0 (últimos 10s de segunda fase)

  if ((timeLeft <= 60 && timeLeft > 50) || (timeLeft <= 10 && timeLeft > 0)) {
    // parpadeo entre rojo y blanco en los últimos 10 segundos de cada fase
    blinkState = !blinkState;
    pixiTimerText.style.fill = blinkState ? "#ff0000" : "#ffffff";
  } else if (timeLeft === 0) {
    pixiTimerText.style.fill = "#ff0000";
  } else {
    // fuera de los últimos 10 segundos, mantener blanco
    pixiTimerText.style.fill = "#ffffff";
  }
}

function tick() {
  if (timeLeft <= 0) {
    clearInterval(timerInterval);
    timerInterval = null;
    timeLeft = 0;
    updatePixiDisplay();

    // Al terminar los 60s totales:
    // 1. Convertir todas las ovejas blancas restantes a negras
    if (typeof window.convertFractionWhiteToBlack === "function") {
      window.convertFractionWhiteToBlack(1); // convertir 100% de blancas
      console.log(
        "Temporizador finalizado. Todas las ovejas blancas convertidas a negras."
      );
    }

    // 2. Inicia el desvanecimiento de pantalla (Game Over UI)
    if (typeof window.startScreenFadeIn === "function") {
      window.startScreenFadeIn();
      console.log(
        "Temporizador finalizado. Iniciando desvanecimiento de pantalla."
      );
    }
    return;
  }

  // Cuando faltan exactamente 50s (después de la primera fase), convertir 1/4 de blancas
  if (timeLeft === 50 && !firstPhaseConverted) {
    firstPhaseConverted = true;
    if (typeof window.convertFractionWhiteToBlack === "function") {
      window.convertFractionWhiteToBlack(1 / 4);
      console.log(
        "Primera fase completada. 1/4 de ovejas blancas convertidas a negras."
      );
    }
  }

  timeLeft--;
  updatePixiDisplay();
}

function startTimer() {
  if (!pixiTimerText) createPixiTimer();
  if (timerInterval) clearInterval(timerInterval);
  timeLeft = tiempo_inicial;
  firstPhaseConverted = false;
  updatePixiDisplay();

  // Activar el flag de juego comenzado para permitir detección de victoria
  if (typeof window.setGameStarted === "function") {
    window.setGameStarted();
  }

  timerInterval = setInterval(tick, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

// Exponer API global compatible con `juego.js` que espera `window.gameTimer.start()`
window.gameTimer = window.gameTimer || {};
window.gameTimer.start = startTimer;
window.gameTimer.stop = stopTimer;
window.gameTimer.reset = () => {
  timeLeft = tiempo_inicial;
  firstPhaseConverted = false;
  updatePixiDisplay();
};

// NO iniciar automáticamente - esperar a que juego.js lo inicie
// El temporizador se inicia cuando el juego está listo

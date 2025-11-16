// temporizador.js (PIXI HUD)

const tiempo_inicial = 30; // segundos iniciales (aumentado a 30)
let timeLeft = tiempo_inicial;
let timerInterval = null;
let pixiTimerText = null;
let blinkState = false;

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

  if (timeLeft <= 10 && timeLeft > 0) {
    // parpadeo entre rojo y blanco solo en los últimos 10 segundos
    blinkState = !blinkState;
    pixiTimerText.style.fill = blinkState ? "#ff0000" : "#ffffff";
  } else if (timeLeft === 0) {
    pixiTimerText.style.fill = "#ff0000";
  } else {
    // antes de los 10 segundos, mantener blanco
    pixiTimerText.style.fill = "#ffffff";
  }
}

function tick() {
  if (timeLeft <= 0) {
    clearInterval(timerInterval);
    timerInterval = null;
    timeLeft = 0;
    updatePixiDisplay();

    // Inicia el desvanecimiento de pantalla (Game Over UI)
    if (typeof window.startScreenFadeIn === "function") {
      window.startScreenFadeIn();
      console.log(
        "Temporizador finalizado. Iniciando desvanecimiento de pantalla."
      );
    }

    // Convertir un tercio de las ovejas blancas a negras una sola vez cuando finaliza el temporizador
    if (
      !window.sheepConvertedByTimer &&
      typeof window.convertFractionWhiteToBlack === "function"
    ) {
      window.sheepConvertedByTimer = true;
      window.convertFractionWhiteToBlack(1 / 3);
    }
    return;
  }
  timeLeft--;
  updatePixiDisplay();
}

function startTimer() {
  if (!pixiTimerText) createPixiTimer();
  if (timerInterval) clearInterval(timerInterval);
  timeLeft = tiempo_inicial;
  window.sheepConvertedByTimer = false;
  updatePixiDisplay();
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
  updatePixiDisplay();
};

// Iniciar automáticamente al cargar el script si el contenedor ya existe
try {
  if (typeof hudContainer !== "undefined" || typeof app !== "undefined")
    startTimer();
} catch (e) {
  console.warn("No se pudo iniciar el temporizador automáticamente:", e);
}

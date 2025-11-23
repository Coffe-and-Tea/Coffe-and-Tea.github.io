(function () {
  const tiempo_inicial = 150; // las fases de propagación ocurren a 90s y 10s
  let timeLeft = tiempo_inicial;
  let timerInterval = null;
  let pixiTimerText = null;
  let timerBackgroundRect = null;
  let timerContainer = null;
  let blinkState = false;
  let firstPhaseConverted = false;

  // Estilo unificado para el temporizador
  const style = new PIXI.TextStyle({
    fontFamily: "Special Elite",
    fontSize: 48,
    fill: "#ffffff",
    stroke: "#000000",
    strokeThickness: 4,
  });

  // Formatea los segundos restantes a un string "HH:MM:SS".
  function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  // Dibuja o actualiza el recuadro de fondo basándose en el tamaño del texto.
  function redrawBackground() {
    if (!timerBackgroundRect || !pixiTimerText || !timerContainer) return;

    // Limpiar y redibujar el gráfico
    timerBackgroundRect.clear();

    const paddingX = 20; // Espaciado horizontal interno
    const paddingY = 15; // Espaciado vertical interno

    // Calcular las dimensiones
    const totalHeight = pixiTimerText.height + 2 * paddingY;
    const totalWidth = pixiTimerText.width + 2 * paddingX;

    // Dibujar el Recuadro Negro con menos opacidad y bordes redondeados
    timerBackgroundRect.beginFill(0x000000, 0.4); // Fondo negro con 40% de opacidad

    // Dibujar el rectángulo redondeado
    timerBackgroundRect.drawRoundedRect(
      0, // x
      0, // y
      totalWidth,
      totalHeight,
      12 // Radio de esquina
    );
    timerBackgroundRect.endFill();

    // Ajustar la posición del texto dentro del contenedor
    pixiTimerText.x = paddingX;
    pixiTimerText.y = paddingY;

    // Ajustar la posición del contenedor (Centrar en la pantalla)
    if (typeof app !== "undefined" && app.renderer) {
      timerContainer.x = (app.renderer.width - totalWidth) / 2;
    } else {
      timerContainer.x = (window.innerWidth - totalWidth) / 2;
    }
  }

  // Inicializa el texto del temporizador y el recuadro de fondo.
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

    try {
      // Crear el Contenedor para agrupar
      if (!timerContainer) {
        timerContainer = new PIXI.Container();
        timerContainer.y = 10; // Posición Y fija cerca de la parte superior
        parent.addChild(timerContainer);
      }

      // Crear el Graphics para el fondo
      if (!timerBackgroundRect) {
        timerBackgroundRect = new PIXI.Graphics();
        timerContainer.addChildAt(timerBackgroundRect, 0); // Añadir primero para que esté detrás
      }

      // Crear el Texto
      if (!pixiTimerText) {
        pixiTimerText = new PIXI.Text(formatTime(timeLeft), style);
        pixiTimerText.anchor.set(0); // Anchor.set(0) para que 0,0 sea la esquina superior izquierda del texto
        timerContainer.addChild(pixiTimerText);
      }

      // Dibujar el fondo inicial y posicionar
      redrawBackground();

      // Adaptación al resize
      if (typeof app !== "undefined" && app.renderer) {
        app.renderer.on("resize", () => {
          redrawBackground(); // El fondo se redibuja y el contenedor se recentra
        });
      }
    } catch (e) {
      console.warn("createPixiTimer failed:", e);
    }
  }

  // Actualiza el valor del tiempo mostrado y aplica efectos de parpadeo.
  function updatePixiDisplay() {
    if (!pixiTimerText) return;

    const oldWidth = pixiTimerText.width;
    pixiTimerText.text = formatTime(Math.max(0, timeLeft));

    // Si el ancho del texto cambia, redibujar el fondo
    if (pixiTimerText.width !== oldWidth) {
      redrawBackground();
    }

    // Estructura de dos fases de propagacion: una entre 100-90s y otra entre 10-0s
    if (
      (timeLeft <= 100 && timeLeft > 90) ||
      (timeLeft <= 10 && timeLeft > 0)
    ) {
      // parpadeo entre rojo y blanco en los últimos 10 segundos de cada fase
      blinkState = !blinkState;
      pixiTimerText.style.fill = blinkState ? "#ff0000" : "#ffffff";
    } else if (timeLeft === 0) {
      pixiTimerText.style.fill = "#ff0000";
    } else {
      pixiTimerText.style.fill = "#ffffff"; // fuera de los segundos críticos, mantener blanco
    }
  }

  // Lógica de decremento del temporizador y control de fases.
  function tick() {
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      timeLeft = 0;
      updatePixiDisplay();

      // Control de Sangre al llegar a 0
      if (typeof window.bloodEffectActive !== "undefined") {
        window.bloodEffectActive = false;
        window.bloodMaxStatic = true;
      }

      // Al terminar el temporizador, todas las ovejas blancas restantes se convierten a negras
      if (typeof window.convertFractionWhiteToBlack === "function") {
        window.convertFractionWhiteToBlack(1);
      }

      // game over fade out
      if (typeof window.startScreenFadeIn === "function") {
        window.startScreenFadeIn();
      }
      return;
    }

    // HUD - sangre
    if (typeof window.bloodEffectActive !== "undefined") {
      if (timeLeft <= 10) {
        window.bloodEffectActive = true;
      } else {
        window.bloodEffectActive = false;
      }
    }

    // al segundo 90 convertir 1/9 de blancas
    if (timeLeft === 90 && !firstPhaseConverted) {
      firstPhaseConverted = true;
      if (typeof window.convertFractionWhiteToBlack === "function") {
        window.convertFractionWhiteToBlack(1 / 9);
      }
    }

    timeLeft--;
    updatePixiDisplay();
  }

  // Inicia el temporizador.
  function startTimer() {
    if (!pixiTimerText) createPixiTimer();
    if (timerInterval) clearInterval(timerInterval);
    timeLeft = tiempo_inicial;
    firstPhaseConverted = false;
    updatePixiDisplay();

    // HUD - sangre
    if (typeof window.bloodEffectActive !== "undefined") {
      window.bloodEffectActive = false;
      window.bloodMaxStatic = false;
    }

    // Activar el flag de juego comenzado para permitir detección de victoria
    if (typeof window.setGameStarted === "function") {
      window.setGameStarted();
    }

    timerInterval = setInterval(tick, 1000);
  }

  // Detiene el temporizador.
  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  // Inicializar automáticamente si hudContainer ya existe
  try {
    if (typeof hudContainer !== "undefined") createPixiTimer();
  } catch (e) {}

  // Exponer API global compatible con `juego.js`
  window.gameTimer = window.gameTimer || {};
  window.gameTimer.start = startTimer;
  window.gameTimer.stop = stopTimer;
  window.gameTimer.reset = () => {
    timeLeft = tiempo_inicial;
    firstPhaseConverted = false;
    updatePixiDisplay();
  };
})();

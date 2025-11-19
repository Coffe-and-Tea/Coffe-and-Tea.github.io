// Pantallazo con fade
(function () {
  // Variables de FADE
  const overlay = new PIXI.Graphics();
  overlay.alpha = 0;
  overlay.position.set(0, 0);

  if (pixiApp.stage.children.indexOf(overlay) === -1) {
    pixiApp.stage.addChild(overlay);
  }

  let overlayAlpha = 0;
  const fadeInSpeed = 0.01;
  const targetAlpha = 0.7;
  let fadingIn = false;
  let gameWon = false;

  // Estilos de la UI
  const WIN_TEXT_STYLE = {
    fontFamily: "Special Elite",
    fontSize: 36,
    fill: 0x00ff00,
    stroke: 0x000000,
    strokeThickness: 4,
    align: "center",
  };

  let winContainer = null;

  // --- 1. Lógica de UI y Redimensionamiento ---

  function updateOverlaySize() {
    overlay.clear();
    overlay.beginFill(0x000000);
    overlay.drawRect(0, 0, pixiApp.renderer.width, pixiApp.renderer.height);
    overlay.endFill();
    overlay.alpha = overlayAlpha;

    if (winContainer) {
      winContainer.x = pixiApp.renderer.width / 2;
      winContainer.y = pixiApp.renderer.height / 2;
    }
  }

  // Escucha el evento de redimensionamiento
  pixiApp.renderer.on("resize", updateOverlaySize);

  function createWinUI() {
    if (winContainer) return;

    winContainer = new PIXI.Container();

    // 1. Título "GANASTE"
    const winText = new PIXI.Text("¡GANASTE!", WIN_TEXT_STYLE);

    // Fondo semi-transparente
    const textBackground = new PIXI.Graphics();
    textBackground.beginFill(0x000000, 0.5);
    const padding = 15;
    textBackground.drawRect(
      -winText.width / 2 - padding,
      -winText.height / 2 - padding,
      winText.width + 2 * padding,
      winText.height + 2 * padding
    );
    textBackground.endFill();
    winText.anchor.set(0.5);
    winText.y = -50;

    winContainer.addChild(textBackground);
    winContainer.addChild(winText);

    // 2. Botón "JUGAR DE NUEVO"
    const BUTTON_STYLE = Object.assign({}, WIN_TEXT_STYLE, {
      fontSize: 24,
      fill: 0x000000, // Texto negro
      stroke: 0xffffff, // Borde blanco
      strokeThickness: 2,
    });

    const buttonText = new PIXI.Text("JUGAR DE NUEVO", BUTTON_STYLE);
    buttonText.anchor.set(0.5);

    const button = new PIXI.Graphics();
    const buttonPadding = 20;
    const buttonWidth = buttonText.width + 2 * buttonPadding;
    const buttonHeight = buttonText.height + buttonPadding;

    button.beginFill(0xffffff, 0.8);
    button.drawRoundedRect(
      -buttonWidth / 2,
      -buttonHeight / 2,
      buttonWidth,
      buttonHeight,
      10
    );
    button.endFill();

    button.interactive = true;
    button.buttonMode = true;

    // Listener para el click que RECARGA la página
    button.on("pointerdown", () => {
      console.log(
        "[WIN CONTROLLER] Botón JUGAR DE NUEVO presionado. Recargando página..."
      );
      window.location.reload();
    });

    button.y = 50;
    buttonText.y = 50;
    winContainer.addChild(button);
    winContainer.addChild(buttonText);

    // Centrar y agregar al escenario
    winContainer.x = pixiApp.renderer.width / 2;
    winContainer.y = pixiApp.renderer.height / 2;

    pixiApp.stage.addChild(winContainer);
    console.log("[WIN CONTROLLER] UI de Victoria creada y mostrada.");
  }

  // --- 2. Lógica de Verificación y Ticker de Juego ---

  pixiApp.ticker.add(() => {
    // --- A) Controlar la atenuación (Fade) ---
    if (fadingIn) {
      overlayAlpha += fadeInSpeed;

      if (overlayAlpha >= targetAlpha) {
        overlayAlpha = targetAlpha;
        fadingIn = false;
        console.log(
          `[WIN CONTROLLER] Fade-in finished at ${targetAlpha * 100}%.`
        );

        // Mostrar la UI de Victoria
        createWinUI();

        // Asegurarse de que el UI esté encima del overlay
        if (winContainer) {
          pixiApp.stage.setChildIndex(
            winContainer,
            pixiApp.stage.children.length - 1
          );
        }
      }
      overlay.alpha = overlayAlpha;
      pixiApp.stage.setChildIndex(overlay, pixiApp.stage.children.length - 1);
      return; // Detener el resto de la lógica si estamos en fade
    }

    // --- B) Verificar Condición de Victoria ---
    // Asumiendo que 'timerValue' es el tiempo restante en SEGUNDOS (0 cuando llega a 00:00:00)
    // Y que 'blackSheepCount' es el número de ovejas negras restantes
    const timerFinished = typeof timerValue !== "undefined" && timerValue <= 0;
    const allBlackSheepFound =
      typeof blackSheepCount !== "undefined" && blackSheepCount <= 0;

    if (!gameWon && timerFinished && allBlackSheepFound) {
      gameWon = true; // Prevenir múltiples llamadas
      console.log(
        "[WIN CONTROLLER] ¡Condición de Victoria alcanzada! Iniciando Fade."
      );

      // Iniciar la atenuación
      fadingIn = true;
      // Opcional: Detener la lógica de tu juego principal aquí si es necesario
      // pixiApp.ticker.stop();
    }
  });

  // Ejecutar actualización inicial de tamaño
  updateOverlaySize();
})();

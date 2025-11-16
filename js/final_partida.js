// Screen fade controller
(function () {
  // Check if the PIXI application is globally available
  // Asumimos que 'app' es la instancia de PIXI.Application.
  const pixiApp =
    typeof app !== "undefined"
      ? app
      : typeof window.app !== "undefined"
      ? window.app
      : null;

  if (!pixiApp) {
    console.error(
      "PIXI Application 'app' not found. Screen fade cannot be initialized."
    );
    return;
  }

  // DEBUG: Confirm the script is executing
  console.log("[FADE CONTROLLER] Script initialized and PIXI app found.");

  // --- Variables de FADE ---
  const overlay = new PIXI.Graphics();
  overlay.alpha = 0;
  overlay.position.set(0, 0);
  pixiApp.stage.addChild(overlay);

  let overlayAlpha = 0;
  const fadeInSpeed = 0.01; // fade speed
  const targetAlpha = 0.7; // target opacity
  let fadingIn = false; // flag to control the fade

  // --- Variables de la Interfaz de Game Over ---
  let gameOverContainer = null;
  const GAME_OVER_TEXT_STYLE = {
    fontFamily: "Special Elite",
    fontSize: 36,
    fill: 0xffffff, // #ffffff
    stroke: 0x000000, // #000
    strokeThickness: 4, // Para simular el text-shadow de 2px
    dropShadow: false,
    align: "center",
  };

  // --- Lógica del FADE y Redimensionamiento ---

  // Function to update the black layer size if the canvas resizes
  function updateOverlaySize() {
    // Clear previous drawing
    overlay.clear();

    // Redraw with current renderer dimensions
    overlay.beginFill(0x000000);
    overlay.drawRect(0, 0, pixiApp.renderer.width, pixiApp.renderer.height);
    overlay.endFill();

    // Maintain current opacity
    overlay.alpha = overlayAlpha;

    // Reposition the UI elements if they exist
    if (gameOverContainer) {
      gameOverContainer.x = pixiApp.renderer.width / 2;
      gameOverContainer.y = pixiApp.renderer.height / 2;
    }
  }

  // Listen to the PIXI renderer resize event
  pixiApp.renderer.on("resize", updateOverlaySize);

  // --- Lógica de la Interfaz de Game Over CORREGIDA ---
  // --- Función para congelar la lógica del juego (pausar gameloops de juego pero mantener UI) ---
  window.freezeGame = function () {
    if (window.gameFrozen) return;
    window.gameFrozen = true;
    try {
      if (pixiApp && pixiApp.ticker) {
        // Remover bucles de juego conocidos (granjera, ovejas)
        if (typeof gameloop === "function") pixiApp.ticker.remove(gameloop);
        if (typeof goatGameloop === "function")
          pixiApp.ticker.remove(goatGameloop);
      }
    } catch (e) {
      console.warn("[freezeGame] No se pudieron remover algunos tickers:", e);
    }
    console.log(
      "[freezeGame] Juego congelado. Los gameloops principales fueron removidos."
    );
  };

  function createGameOverUI() {
    if (gameOverContainer) return; // Already created

    // Contenedor para agrupar el texto y los botones
    gameOverContainer = new PIXI.Container();
    gameOverContainer.sortableChildren = true;

    // --- Estilos Comunes ---
    const BACKGROUND_FILL_COLOR = 0xffffff; // Blanco
    const BACKGROUND_FILL_ALPHA = 0.8; // Opacidad
    const ROUNDED_RECT_RADIUS = 10; // Radio de las esquinas

    // Estilo de texto para elementos sobre fondo BLANCO (Texto Negro, Borde Blanco)
    const TEXT_STYLE_ON_WHITE_BG = Object.assign({}, GAME_OVER_TEXT_STYLE, {
      fill: 0x000000, // Color de texto NEGRO
      stroke: 0xffffff, // Borde blanco
      strokeThickness: 2,
      fontSize: 30,
    });

    // 1. "PERDISTE" como cuadro de texto ROJO (no interactivo)
    const LOSE_STYLE = Object.assign({}, GAME_OVER_TEXT_STYLE, {
      fontSize: 48,
      fill: 0xffffff, // texto blanco sobre fondo rojo
      stroke: 0x000000,
      strokeThickness: 4,
    });

    const loseText = new PIXI.Text("PERDISTE", LOSE_STYLE);
    loseText.anchor.set(0.5);

    // Calcular tamaño del fondo de PERDISTE
    const loseTextPadding = 12;
    const loseTextBgWidth = loseText.width + 2 * loseTextPadding;
    const loseTextBgHeight = loseText.height + 2 * (loseTextPadding / 2);

    const textBackground = new PIXI.Graphics();
    // Fondo ROJO para PERDISTE
    textBackground.beginFill(0xff0000, 1);
    textBackground.drawRoundedRect(
      -loseTextBgWidth / 2,
      -loseTextBgHeight / 2,
      loseTextBgWidth,
      loseTextBgHeight,
      ROUNDED_RECT_RADIUS
    );
    textBackground.endFill();

    // Posicionamiento de PERDISTE (Texto + Fondo)
    loseText.y = -50;
    textBackground.y = -50;

    gameOverContainer.addChild(textBackground);
    gameOverContainer.addChild(loseText);

    // 2. Botón "REINICIAR"
    // El estilo es el mismo, solo el tamaño de la fuente es menor
    const RESTART_BUTTON_TEXT_STYLE = Object.assign(
      {},
      TEXT_STYLE_ON_WHITE_BG,
      {
        fontSize: 24, // El botón es más pequeño
      }
    );

    const buttonText = new PIXI.Text("REINICIAR", RESTART_BUTTON_TEXT_STYLE);
    buttonText.anchor.set(0.5);

    const button = new PIXI.Graphics();
    const buttonPadding = 20;
    const buttonWidth = buttonText.width + 2 * buttonPadding;
    const buttonHeight = buttonText.height + buttonPadding;

    // Dibujar el botón (mismo estilo de fondo)
    button.beginFill(BACKGROUND_FILL_COLOR, BACKGROUND_FILL_ALPHA);
    button.drawRoundedRect(
      -buttonWidth / 2,
      -buttonHeight / 2,
      buttonWidth,
      buttonHeight,
      ROUNDED_RECT_RADIUS
    );
    button.endFill();

    // Hacerlo interactivo
    button.interactive = true;
    button.buttonMode = true;

    // Listener para el click
    button.on("pointerdown", () => {
      console.log(
        "[FADE CONTROLLER] Botón REINICIAR presionado. Recargando página..."
      );
      window.location.reload();
    });

    // Posicionar el botón
    button.y = 50;
    buttonText.y = 50;
    gameOverContainer.addChild(button);
    gameOverContainer.addChild(buttonText);

    // Centrar el contenedor en el escenario
    gameOverContainer.x = pixiApp.renderer.width / 2;
    gameOverContainer.y = pixiApp.renderer.height / 2;

    // Agregar el contenedor al Stage
    pixiApp.stage.addChild(gameOverContainer);
    console.log("[FADE CONTROLLER] UI de Game Over creada y mostrada.");
  }

  // Function to start the fade
  function startFadeIn() {
    // Solo empezar si no está atenuando
    if (!fadingIn && overlayAlpha < targetAlpha) {
      fadingIn = true;

      // Asegúrate de que el overlay esté siempre en la capa más alta
      pixiApp.stage.setChildIndex(overlay, pixiApp.stage.children.length - 1);

      // Si la UI de Game Over ya existe, ocúltala
      if (gameOverContainer) {
        pixiApp.stage.removeChild(gameOverContainer);
        gameOverContainer = null;
      }

      console.log(
        "[FADE CONTROLLER] Fade-in started. Current alpha:",
        overlayAlpha
      );
    } else if (fadingIn) {
      console.log("[FADE CONTROLLER] Fade-in already in progress.");
    }
  }

  // Update the overlay every frame (using PIXI ticker)
  pixiApp.ticker.add(() => {
    if (fadingIn) {
      overlayAlpha += fadeInSpeed;

      // Si alcanzamos o excedemos la opacidad objetivo (0.7)
      if (overlayAlpha >= targetAlpha) {
        overlayAlpha = targetAlpha;
        fadingIn = false; // Detener la atenuación
        console.log(
          `[FADE CONTROLLER] Fade-in finished at ${targetAlpha * 100}%.`
        );

        // *** LLAMADA CRÍTICA: Mostrar la UI de Game Over ***
        createGameOverUI();
        // Congelar la lógica del juego ahora que la UI de fin aparece
        try {
          if (typeof window.freezeGame === "function") window.freezeGame();
        } catch (e) {
          console.warn("freezeGame failed", e);
        }

        // Asegúrate de que la UI de Game Over esté *encima* del overlay
        if (gameOverContainer) {
          pixiApp.stage.setChildIndex(
            gameOverContainer,
            pixiApp.stage.children.length - 1
          );
        }
      }

      overlay.alpha = overlayAlpha;
    }
  });

  // Execute initial size update
  updateOverlaySize();

  // Expose the function globally
  window.startScreenFadeIn = startFadeIn;
})();

// Pantalla de inicio
(function () {
  const pixiApp = typeof app !== "undefined" ? app : null;

  if (!pixiApp) {
    console.error("[START SCREEN] PIXI app not found.");
    return;
  }

  console.log("[START SCREEN] Script initialized.");

  let startScreenContainer = null;
  let screenShown = false; // Crear la pantalla de inicio

  function createStartScreen() {
    if (startScreenContainer) return;

    startScreenContainer = new PIXI.Container();
    startScreenContainer.zIndex = 100; // Agregar un zIndex alto como precaución // Fondo negro que cubre toda la pantalla

    const background = new PIXI.Graphics();
    background.beginFill(0x000000);
    background.drawRect(0, 0, pixiApp.renderer.width, pixiApp.renderer.height);
    background.endFill();
    startScreenContainer.addChild(background); // Estilo del título

    const titleStyle = new PIXI.TextStyle({
      fontFamily: "Special Elite",
      fontSize: 72,
      fill: 0xffffff,
      stroke: 0x000000,
      strokeThickness: 4,
      align: "center",
    }); // Título "THE DEVIL'S HERD"

    const title = new PIXI.Text("THE DEVIL'S HERD", titleStyle);
    title.anchor.set(0.5);
    title.x = pixiApp.renderer.width / 2;
    title.y = pixiApp.renderer.height / 2 - 150;
    startScreenContainer.addChild(title); // Estilo del botón

    const buttonTextStyle = new PIXI.TextStyle({
      fontFamily: "Special Elite",
      fontSize: 48,
      fill: 0x000000,
      stroke: 0xffffff,
      strokeThickness: 2,
      align: "center",
    });

    const buttonText = new PIXI.Text("COMENZAR", buttonTextStyle);
    buttonText.anchor.set(0.5); // Fondo del botón (blanco)

    const button = new PIXI.Graphics();
    const buttonPadding = 30;
    const buttonWidth = buttonText.width + 2 * buttonPadding;
    const buttonHeight = buttonText.height + 2 * buttonPadding;

    button.beginFill(0xffffff, 0.9);
    button.drawRoundedRect(
      -buttonWidth / 2,
      -buttonHeight / 2,
      buttonWidth,
      buttonHeight,
      15
    );
    button.endFill(); // Hacer el botón interactivo (CORRECCIÓN DE DEPRECACIÓN)

    button.eventMode = "static"; // Reemplaza button.interactive = true;
    button.cursor = "pointer"; // Reemplaza button.buttonMode = true;
    button.on("pointerdown", () => {
      console.log("[START SCREEN] COMENZAR button pressed. Starting game...");
      hideStartScreen();
      startGame();
    }); // Posicionar botón

    button.x = pixiApp.renderer.width / 2;
    button.y = pixiApp.renderer.height / 2 + 100;
    buttonText.x = pixiApp.renderer.width / 2;
    buttonText.y = pixiApp.renderer.height / 2 + 100;

    startScreenContainer.addChild(button);
    startScreenContainer.addChild(buttonText); // Agregar contenedor al stage

    pixiApp.stage.addChild(startScreenContainer);
    console.log("[START SCREEN] Start screen created.");
  }

  function showStartScreen() {
    if (!startScreenContainer) {
      createStartScreen();
    }
    if (startScreenContainer) {
      startScreenContainer.visible = true; // Esto asegura que se dibuje encima de todos los demás elementos.
      pixiApp.stage.setChildIndex(
        startScreenContainer,
        pixiApp.stage.children.length - 1
      );
      screenShown = true;
      console.log("[START SCREEN] Start screen shown and moved to front.");
    }
  }

  function hideStartScreen() {
    if (startScreenContainer) {
      startScreenContainer.visible = false;
      screenShown = false;
      console.log("[START SCREEN] Start screen hidden.");
    }
  }

  function startGame() {
    // Iniciar el temporizador
    if (typeof window.gameTimer !== "undefined" && window.gameTimer.start) {
      window.gameTimer.start();
      console.log("[START SCREEN] Game timer started.");
    }
  } // Exponer funciones globales

  window.showStartScreen = showStartScreen;
  window.hideStartScreen = hideStartScreen;
  window.startGame = startGame;
})();

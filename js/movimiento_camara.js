// Contenedor para la cámara que contendrá todos los elementos del juego
const gameContainer = new PIXI.Container();

// Sistema de cámara
function initCamera(appInstance) {
  appInstance.stage.addChild(gameContainer);
}

// Movimiento de la cámara con respecto al personaje
function moverCamara(characterPos, appInstance) {
  // Calcular el centro de la pantalla
  const screenCenterX = appInstance.screen.width / 2;
  const screenCenterY = appInstance.screen.height / 2;

  // Calcular la posición objetivo de la cámara
  const targetX = -characterPos.x + screenCenterX;
  const targetY = -characterPos.y + screenCenterY;

  // Aplicar suavizado al movimiento de la cámara
  const lerp = 0.1;
  gameContainer.x = targetX;
  gameContainer.y = targetY;
}

// Función para agregar elementos al contenedor del juego
function addToGameContainer(sprite) {
  if (gameContainer) {
    gameContainer.addChild(sprite);
  }
}

// Exportar las funciones
window.gameCamera = {
  init: initCamera,
  move: moverCamara,
  addToContainer: addToGameContainer,
};

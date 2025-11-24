// Inicialización de variables y funciones globales
// Despues son todas sobreescritas por otra funcion.

// Flag para saber si el juego ha comenzado
window.gameStarted = false;

// Flag para saber si se han creado las ovejas iniciales
window.hasInitialSheep = false;

// Flag para saber si el juego ha ganado
window.isGameWon = false;

// Flag para saber si el juego está congelado
window.gameFrozen = false;

// Función placeholder para setInitialSheepCreated
window.setInitialSheepCreated = function () {
  window.hasInitialSheep = true;
  console.log("[INIT] Ovejas iniciales detectadas.");
};

// Función placeholder para checkVictory
window.checkVictory = function () {
  console.log("[INIT] checkVictory placeholder");
};

// Función placeholder para freezeGame
window.freezeGame = function () {
  window.gameFrozen = true;
  console.log("[INIT] freezeGame placeholder");
};

console.log("[INIT] Global functions initialized");
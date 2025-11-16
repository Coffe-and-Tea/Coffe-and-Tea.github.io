// 00_init.js - Inicialización de variables y funciones globales
// Este archivo se debe cargar PRIMERO para asegurar que todas las funciones globales existan

// Flag para saber si el juego ha comenzado
window.gameStarted = false;

// Flag para saber si se han creado las ovejas iniciales
window.hasInitialSheep = false;

// Flag para saber si el juego ha ganado
window.isGameWon = false;

// Flag para saber si el juego está congelado
window.gameFrozen = false;

// Función placeholder para setInitialSheepCreated (será sobrescrita por final_partida.js)
window.setInitialSheepCreated = function () {
  window.hasInitialSheep = true;
  console.log("[INIT] Ovejas iniciales detectadas.");
};

// Función placeholder para checkVictory (será sobrescrita por final_partida.js)
window.checkVictory = function () {
  console.log("[INIT] checkVictory placeholder");
};

// Función placeholder para freezeGame (será sobrescrita por final_partida.js)
window.freezeGame = function () {
  window.gameFrozen = true;
  console.log("[INIT] freezeGame placeholder");
};

console.log("[INIT] Global functions initialized");

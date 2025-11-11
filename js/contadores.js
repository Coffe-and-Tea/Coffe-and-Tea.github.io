// Contadores HUD: crea y actualiza los contadores de ovejas
(function () {
  let whiteCountText = null;
  let blackCountText = null;
  // estilo basado en temporizador.css (Special Elite)
const styleWhite = new PIXI.TextStyle({
    fontFamily: "Special Elite",
    fontSize: 36, // Aumentado a 36px
    fill: '#ffffff', // Color del texto principal: Blanco
    stroke: '#000000', // Color del "borde/sombra": Negro
    strokeThickness: 4, // Aumentado para simular el efecto de sombra (text-shadow)
});

const styleBlack = new PIXI.TextStyle({
    fontFamily: "Special Elite",
    fontSize: 36, // Aumentado a 36px
    fill: '#ffffff', // Color del texto principal: Blanco
    stroke: '#000000', // Color del "borde/sombra": Negro
    strokeThickness: 4, // Aumentado para simular el efecto de sombra (text-shadow)

});

  function initCounters(hud) {
    try {
      if (!hud) return;
      if (!whiteCountText) {
        whiteCountText = new PIXI.Text("Blancas: 0", styleWhite);
        whiteCountText.x = 12;
        whiteCountText.y = 8;
        hud.addChild(whiteCountText);
      }
      if (!blackCountText) {
        blackCountText = new PIXI.Text("Negras: 0", styleBlack);
        blackCountText.x = 12;
        blackCountText.y = 46;
        hud.addChild(blackCountText);
      }
    } catch (e) {
      console.warn("initCounters failed:", e);
    }
  }

  function updateCounters(whites, blacks) {
    try {
      if (whiteCountText) whiteCountText.text = `Blancas: ${whites}`;
      if (blackCountText) blackCountText.text = `Negras: ${blacks}`;
    } catch (e) {}
  }

  // Inicializar automáticamente si hudContainer ya existe
  try {
    if (typeof hudContainer !== "undefined") initCounters(hudContainer);
  } catch (e) {}

  // Exponer API global
  window.initCounters = initCounters;
  window.updateCounters = updateCounters;
})();

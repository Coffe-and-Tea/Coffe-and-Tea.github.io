// Crea y actualiza los contadores de ovejas
(function () {
  let whiteCountText = null;
  let blackCountText = null;
  let backgroundRect = null;
  let textContainer = null;

  // Estilo unificado para ambos contadores
  const style = new PIXI.TextStyle({
    fontFamily: "Special Elite",
    fontSize: 36,
    fill: "#ffffff",
    stroke: "#000000",
    strokeThickness: 4,
  });

  /**
   * Dibuja o actualiza el recuadro de fondo basándose en el tamaño de los textos.
   */
  function redrawBackground() {
    if (!backgroundRect || !whiteCountText || !blackCountText) return;

    // Limpiar y redibujar el gráfico
    backgroundRect.clear();

    const padding = 15; // Espaciado interno

    // 1. Calcular el ancho que debe cubrir el recuadro
    // Usamos el ancho actual del texto más largo
    const currentMaxWidth = Math.max(
      whiteCountText.width,
      blackCountText.width
    );

    // 2. Establecer las dimensiones del recuadro
    const totalHeight =
      whiteCountText.height + blackCountText.height + 4 + 2 * padding; // Altura total de los dos textos + separación + 2*padding
    const totalWidth = currentMaxWidth + 2 * padding + 5; // Ancho del texto más largo + 2*padding + 5px de margen extra

    // 3. Dibujar el Recuadro Negro con menos opacidad y sin borde
    backgroundRect.beginFill(0x000000, 0.4); // Fondo negro con 40% de opacidad

    // Dibujar el rectángulo redondeado
    backgroundRect.drawRoundedRect(
      0,
      0,
      totalWidth,
      totalHeight,
      12 // Radio de esquina
    );
    backgroundRect.endFill();
  }

  /**
   * Inicializa los contadores y dibuja el recuadro de fondo.
   * @param {PIXI.Container} hud El contenedor principal de la interfaz de usuario (HUD).
   */
  function initCounters(hud) {
    try {
      if (!hud) return;

      // 1. Crear el Contenedor para agrupar los textos y el fondo
      if (!textContainer) {
        textContainer = new PIXI.Container();
        // Posición inicial del contenedor en el HUD (ej: esquina superior izquierda)
        textContainer.x = 10;
        textContainer.y = 10;
        hud.addChild(textContainer);
      }

      // 2. Crear el Graphics para el fondo
      if (!backgroundRect) {
        backgroundRect = new PIXI.Graphics();
        textContainer.addChildAt(backgroundRect, 0); // Añadir primero para que esté detrás
      }

      // 3. Crear y posicionar los textos si no existen
      const padding = 15;
      if (!whiteCountText) {
        whiteCountText = new PIXI.Text("Blancas: 0", style);
        whiteCountText.x = padding;
        whiteCountText.y = padding;
        textContainer.addChild(whiteCountText);
      }
      if (!blackCountText) {
        blackCountText = new PIXI.Text("Negras: 0", style);
        blackCountText.x = padding;
        // Posición Y basada en la altura del texto blanco más la separación
        blackCountText.y = whiteCountText.y + whiteCountText.height + 4;
        textContainer.addChild(blackCountText);
      }

      // 4. Dibujar el recuadro inicial
      redrawBackground();
    } catch (e) {
      console.warn("initCounters failed:", e);
    }
  }

  /**
   * Actualiza los valores mostrados en los contadores y redibuja el fondo si es necesario.
   * @param {number} whites Número de ovejas blancas.
   * @param {number} blacks Número de ovejas negras.
   */
  function updateCounters(whites, blacks) {
    try {
      // Guardamos los anchos antiguos para verificar si cambiaron
      const oldWhiteWidth = whiteCountText ? whiteCountText.width : 0;
      const oldBlackWidth = blackCountText ? blackCountText.width : 0;

      if (whiteCountText) whiteCountText.text = `Blancas: ${whites}`;
      if (blackCountText) blackCountText.text = `Negras: ${blacks}`;

      // Verificamos si el ancho de alguno de los textos cambió (ej: de "1" a "100")
      if (
        whiteCountText.width !== oldWhiteWidth ||
        blackCountText.width !== oldBlackWidth
      ) {
        // Si el ancho cambió, redibujamos el fondo para que se adapte al nuevo tamaño
        redrawBackground();
      }
    } catch (e) {
      // Ignorar errores de actualización
    }
  }

  // Inicializar automáticamente si hudContainer ya existe
  try {
    if (typeof hudContainer !== "undefined") initCounters(hudContainer);
  } catch (e) {}

  // Exponer API global
  window.initCounters = initCounters;
  window.updateCounters = updateCounters;
})();

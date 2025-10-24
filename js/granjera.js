// =========================================================
// *** INICIALIZACIÓN Y CONFIGURACIÓN (Parte Corregida) ***
// =========================================================

// Posición central del personaje: Esta es la "verdad" de la posición.
let characterPos = {
  x: app.screen.width / 2,
  y: app.screen.height / 2,
};

// Agregamos un sprite estatico para cuando la granjera no esta en movimiento (reemplazar por idle)
const granjera = PIXI.Sprite.from("images/granjera.png");
granjera.anchor.set(0.5);
// Usar la posición central inicial
granjera.x = characterPos.x;
granjera.y = characterPos.y;
app.stage.addChild(granjera);

// Variables y referencias
let keys = {};
const animSprites = {}; // Para guardar las animaciones

// ===========================================
// *** FUNCIONES HELPERS ***
// ===========================================

// Helpers para mostrar/ocultar animaciones
function hideAllAnims() {
  Object.keys(animSprites).forEach((k) => {
    const s = animSprites[k];
    if (s) {
      s.visible = false;
      if (s.playing) s.stop();
    }
  });
}

function showAnim(key) {
  const s = animSprites[key];
  if (!s) return;
  s.visible = true; // Ocultamos el sprite estático para evitar superposición

  granjera.visible = false;
  if (!s.playing) s.play();
}

// Cargamos los spritesheets
function setupFromSheetData(sheetData, baseImagePath, keyName) {
  const animList = sheetData.animations.walk; // Crear baseTexture desde la imagen del spritesheet

  const baseTex = PIXI.BaseTexture.from(baseImagePath);
  const frames = animList
    .map((name) => {
      const f = sheetData.frames[name];
      if (!f || !f.frame) return null;
      const r = f.frame;
      return new PIXI.Texture(baseTex, new PIXI.Rectangle(r.x, r.y, r.w, r.h));
    })
    .filter(Boolean);

  if (frames.length) {
    const animSprite = new PIXI.AnimatedSprite(frames);
    animSprite.anchor.set(0.5); // Usar la posición central inicial
    animSprite.x = characterPos.x;
    animSprite.y = characterPos.y;
    animSprite.animationSpeed = 0.15;
    animSprite.visible = false;
    animSprite.scale.x = Math.abs(animSprite.scale.x || 1);
    app.stage.addChild(animSprite);
    if (keyName) animSprites[keyName] = animSprite;
  }
}

// =======================================================
// *** CARGA DE ANIMACIONES (CORRECCIÓN CRÍTICA DE LOADER) ***
// =======================================================

// Solo necesitamos walk1, walk3 y walk4 (usaremos walk4 para A y D)
const sheets = ["walk1", "walk3", "walk4"];
if (
  PIXI.Loader &&
  PIXI.Loader.shared &&
  typeof PIXI.Loader.shared.add === "function"
) {
  sheets.forEach((s) => PIXI.Loader.shared.add(s, `animaciones/${s}.json`));
  PIXI.Loader.shared.load((loader, resources) => {
    // CORRECCIÓN CLAVE: Creamos los sprites animados desde los recursos cargados
    sheets.forEach((s) => {
      const res = resources[s];
      if (res && res.data) {
        const baseImage =
          res.data.meta && res.data.meta.image
            ? `animaciones/${res.data.meta.image}`
            : `animaciones/${s}.png`;
        setupFromSheetData(res.data, baseImage, s);
      }
    });
  });
} else {
  // Fallback: fetch cada JSON
  sheets.forEach((s) => {
    fetch(`animaciones/${s}.json`)
      .then((r) => r.json())
      .then((json) => {
        const baseImage =
          json.meta && json.meta.image
            ? `animaciones/${json.meta.image}`
            : `animaciones/${s}.png`;
        setupFromSheetData(json, baseImage, s);
      })
      .catch((err) =>
        console.error("Error leyendo JSON del spritesheet:", err)
      );
  });
}

// ===========================================
// *** INPUT Y GAMELOOP ***
// ===========================================

// Agregamos el movimiento "WASD" del teclado
window.addEventListener("keydown", keysDown);
window.addEventListener("keyup", keysUp);

function keysDown(e) {
  keys[e.keyCode] = true;
}
function keysUp(e) {
  keys[e.keyCode] = false;
}

// Gameloop para el movimiento y poder controlar la animación (LÓGICA FINAL CORREGIDA)
function gameloop() {
  let moving = false;
  const speed = 4;
  let currentAnimKey = null;

  let movedX = false;
  let movedY = false; // --- 1. Determinar Movimiento y Actualizar Posición Central (characterPos) ---

  if (keys[87]) {
    // W (Arriba)
    movedY = true;
    characterPos.y -= speed;
    currentAnimKey = "walk1";
  }

  if (keys[83]) {
    // S (Abajo)
    movedY = true;
    characterPos.y += speed;
    currentAnimKey = "walk3";
  }

  if (keys[65]) {
    // A (Izquierda)
    movedX = true;
    characterPos.x -= speed;
    currentAnimKey = "walk4"; // Usa walk4
  }

  if (keys[68]) {
    // D (Derecha)
    movedX = true;
    characterPos.x += speed;
    currentAnimKey = "walk4"; // Usa walk4
  }

  moving = movedX || movedY; // --- 2. Sincronizar Sprites y Manejar Animación ---

  if (moving && currentAnimKey && animSprites[currentAnimKey]) {
    // El sprite animado está activo: lo mostramos y sincronizamos su posición.
    hideAllAnims();
    showAnim(currentAnimKey);

    const anim = animSprites[currentAnimKey]; // LÓGICA DE ESCALA INVERSA: Usar walk4 para ambas direcciones horizontales

    if (currentAnimKey === "walk4") {
      const baseScale = Math.abs(anim.scale.x || 1);

      if (keys[65]) {
        // Izquierda
        anim.scale.x = -baseScale;
      } else if (keys[68]) {
        // Derecha
        anim.scale.x = baseScale;
      }
    } else {
      // Asegurar que las animaciones verticales (walk1, walk3) no estén invertidas
      anim.scale.x = Math.abs(anim.scale.x || 1);
    } // SINCRONIZACIÓN CLAVE: El sprite animado toma la posición central

    anim.x = characterPos.x;
    anim.y = characterPos.y;
  } else {
    // Reposo: Ocultar animaciones y mostrar el sprite estático.
    hideAllAnims();
    granjera.visible = true; // SINCRONIZACIÓN CLAVE: El sprite estático toma la posición central

    granjera.x = characterPos.x;
    granjera.y = characterPos.y;
  }
}

// Se añade el gameloop al ticker
if (app && app.ticker) app.ticker.add(gameloop);

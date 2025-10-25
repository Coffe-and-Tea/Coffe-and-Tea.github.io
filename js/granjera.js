// Posición central del personaje: Esta es la "verdad" de la posición.
let characterPos = {
  x: app.screen.width / 2,
  y: app.screen.height / 2,
};

// variable de estado: Para recordar la última dirección de caminata (Abajo por defecto).
let lastDirectionKey = "idle3";

// variable clave: Almacena la escala horizontal final (-1 para izquierda, +1 para derecha).
let lastScaleX = 1;

// Agregamos un sprite estatico (usado como fallback si falla la carga o el idle)
const granjera = PIXI.Sprite.from("images/granjera.png");
granjera.anchor.set(0.5);
granjera.x = characterPos.x;
granjera.y = characterPos.y;
app.stage.addChild(granjera);

// Variables y referencias
let keys = {};
const animSprites = {}; // Para guardar las animaciones

// ** NUEVOS PARÁMETROS DE INTERACCIÓN **
const KILL_KEY_CODE = 32; // Código de tecla para matar (32 es la barra espaciadora)
const KILL_RADIUS = 40; // Distancia máxima en píxeles para que la granjera pueda interactuar/matar

// ===========================================
// *** FUNCIONES HELPERS ***
// ===========================================

// Oculta todos los sprites animados y detiene su reproducción
function hideAllAnims() {
  Object.keys(animSprites).forEach((k) => {
    const s = animSprites[k];
    if (s) {
      s.visible = false;
      if (s.playing) s.stop();
    }
  });
}

// Muestra la animación especificada y la reproduce si no está corriendo
function showAnim(key) {
  const s = animSprites[key];
  if (!s) return;
  s.visible = true;
  granjera.visible = false;
  if (!s.playing) s.play();
}

// Función robusta para leer animaciones del JSON (Mantenida igual)
function setupFromSheetData(sheetData, baseImagePath, keyName) {
  if (!sheetData || !sheetData.animations) {
    console.warn(
      `[Carga Fallida] El JSON para ${keyName} está incompleto o mal formado (falta 'animations').`
    );
    return;
  }

  // Intentamos encontrar la lista de frames: 'walk', 'idle', o la primera lista disponible
  let animList = sheetData.animations.walk || sheetData.animations.idle;

  if (!animList) {
    const allKeys = Object.keys(sheetData.animations);
    if (allKeys.length > 0) {
      animList = sheetData.animations[allKeys[0]];
    }
  }

  if (!animList || !Array.isArray(animList)) {
    console.error(
      `[Carga Crítica] No se encontró una lista de frames válida (walk/idle/otra) en el JSON de ${keyName}.`
    );
    return;
  }

  // --- Lógica de creación del AnimatedSprite ---
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
    animSprite.anchor.set(0.5);
    animSprite.x = characterPos.x;
    animSprite.y = characterPos.y;

    // Para que el idle vaya mas lento
    if (keyName.startsWith("idle")) {
      animSprite.animationSpeed = 0.1; // Velocidad lenta para reposo
    } else {
      animSprite.animationSpeed = 0.15; // Velocidad normal para caminar
    }

    animSprite.visible = false;
    animSprite.scale.x = Math.abs(animSprite.scale.x || 1);
    app.stage.addChild(animSprite);
    if (keyName) animSprites[keyName] = animSprite;
  } else {
    console.warn(
      `[Advertencia] ${keyName} no tiene frames válidos después de procesar el JSON.`
    );
  }
}

// =======================================================
// *** CARGA DE ANIMACIONES (Mantenida igual) ***
// =======================================================

// Lista de todas las animaciones a cargar
const sheets = [
  "walk1", // Arriba
  "walk3", // Abajo
  "walk4", // Izquierda/Derecha
  "idle2", // Reposo Arriba
  "idle3", // Reposo Abajo
  "idle4", // Reposo Derecha
];

if (
  PIXI.Loader &&
  PIXI.Loader.shared &&
  typeof PIXI.Loader.shared.add === "function"
) {
  sheets.forEach((s) => PIXI.Loader.shared.add(s, `animaciones/${s}.json`));
  PIXI.Loader.shared.load((loader, resources) => {
    sheets.forEach((s) => {
      const res = resources[s];
      if (res && res.data) {
        // Acceso seguro a la ruta de la imagen: Asume s.png si el meta.image falla
        const baseImage =
          res.data.meta && res.data.meta.image
            ? `animaciones/${res.data.meta.image}`
            : `animaciones/${s}.png`;

        setupFromSheetData(res.data, baseImage, s);
      } else {
        console.error(
          `[Fallo Crítico de Carga] El archivo JSON para ${s} no se pudo cargar (¿Error 404?).`
        );
      }
    });
  });
} else {
  // Fallback: fetch cada JSON
  sheets.forEach((s) => {
    fetch(`animaciones/${s}.json`)
      .then((r) => r.json())
      .then((json) => {
        const baseImage = `animaciones/${s}.png`;
        setupFromSheetData(json, baseImage, s);
      })
      .catch((err) =>
        console.error(`Error leyendo JSON del spritesheet ${s}:`, err)
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

// Gameloop para el movimiento, animación y la INTERACCIÓN DE MATANZA
function gameloop() {
  let moving = false;
  const speed = 4;
  let currentAnimKey = null;

  let movedX = false;
  let movedY = false;

  // --- LÓGICA DE MOVIMIENTO ---
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
    currentAnimKey = "walk4";
  }

  if (keys[68]) {
    // D (Derecha)
    movedX = true;
    characterPos.x += speed;
    currentAnimKey = "walk4";
  }

  moving = movedX || movedY;

  // --- LÓGICA DE ANIMACIÓN (Caminata/Idle) ---
  // ... (El código de animación de caminata y idle se mantiene igual)

  if (moving && currentAnimKey && animSprites[currentAnimKey]) {
    // Animacion de walk
    hideAllAnims();
    showAnim(currentAnimKey);

    const anim = animSprites[currentAnimKey];

    if (currentAnimKey === "walk4") {
      const baseScale = Math.abs(anim.scale.x || 1);

      if (keys[65]) {
        // Izquierda
        anim.scale.x = -baseScale;
        lastDirectionKey = "idle1";
        lastScaleX = -baseScale;
      } else if (keys[68]) {
        // Derecha
        anim.scale.x = baseScale;
        lastDirectionKey = "idle4";
        lastScaleX = baseScale;
      }
    } else {
      // Asegurar que las animaciones verticales no estén invertidas
      anim.scale.x = Math.abs(anim.scale.x || 1);

      // Actualizar la última dirección para W y S
      if (currentAnimKey === "walk1") lastDirectionKey = "idle2";
      if (currentAnimKey === "walk3") lastDirectionKey = "idle3";
    }

    anim.x = characterPos.x;
    anim.y = characterPos.y;
  } else {
    // Animacion de idle
    hideAllAnims();
    let idleKey = lastDirectionKey;

    // Si la última dirección es "idle1" (izquierda), usamos el sprite "idle4"
    if (idleKey === "idle1") {
      idleKey = "idle4";
    }

    const idleAnim = animSprites[idleKey];

    if (idleAnim) {
      // Si la animación idle existe, la mostramos y sincronizamos
      idleAnim.x = characterPos.x;
      idleAnim.y = characterPos.y;
      idleAnim.visible = true;

      // Aplicar la escala horizontal guardada (solo para idle4)
      if (idleKey === "idle4") {
        idleAnim.scale.x = lastScaleX;
      } else {
        // Asegurar que los idle verticales (idle2, idle3) tengan escala positiva
        idleAnim.scale.x = Math.abs(idleAnim.scale.x || 1);
      }

      if (!idleAnim.playing) idleAnim.play();
      granjera.visible = false;
    } else {
      // Fallback (El idle NO CARGÓ): Mostramos el sprite estático
      granjera.x = characterPos.x;
      granjera.y = characterPos.y;
      granjera.visible = true;
    }
  }

  // ===============================================
  // 🔪 LÓGICA DE INTERACCIÓN Y MATANZA (NUEVO) 🔪
  // ===============================================

  // NOTA: 'flock' debe ser un array global que contenga las instancias de GoatBoid
  // (Definido en tu archivo de cabras/ovejas)
  if (keys[KILL_KEY_CODE] && typeof flock !== "undefined") {
    // Obtenemos la posición real de la granjera
    const granjeraX = characterPos.x;
    const granjeraY = characterPos.y;

    // Iteramos el array 'flock' hacia atrás para poder eliminar elementos de forma segura
    for (let i = flock.length - 1; i >= 0; i--) {
      const animal = flock[i];

      // Si el animal no es válido o ya fue eliminado, saltamos
      if (!animal || !animal.sprite) continue;

      // Calcular la distancia
      const dx = animal.sprite.x - granjeraX;
      const dy = animal.sprite.y - granjeraY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Condición de Muerte/Interacción
      if (distance < KILL_RADIUS) {
        // Llamamos al método de eliminación que debe estar en la clase GoatBoid
        if (typeof animal.removeSelf === "function") {
          animal.removeSelf();
        } else {
          // Fallback si removeSelf no existe (¡debes añadirlo a GoatBoid!)
          console.error("Falta el método removeSelf() en la clase del animal.");
          animal.sprite.visible = false;
          flock.splice(i, 1);
        }

        // Si la granjera solo puede matar un animal por pulsación de tecla, salimos:
        break;
      }
    }
  }
}

// Se añade el gameloop al ticker
if (app && app.ticker) app.ticker.add(gameloop);

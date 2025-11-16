// Posición central del personaje: Esta es la "verdad" de la posición.
// Inicializar position defensivamente (si `app` aún no existe usamos viewport)
let characterPos = {
  x:
    typeof app !== "undefined" && app.screen
      ? app.screen.width / 2
      : Math.round(window.innerWidth / 2),
  y:
    typeof app !== "undefined" && app.screen
      ? app.screen.height / 2
      : Math.round(window.innerHeight / 2),
};

console.log("granjera.js cargado. characterPos:", characterPos);

// variable de estado: Para recordar la última dirección de caminata (Abajo por defecto).
let lastDirectionKey = "idle3";

// variable clave: Almacena la escala horizontal final (-1 para izquierda, +1 para derecha).
let lastScaleX = 1;

// NUEVA VARIABLE: Estado de ataque
let isAttacking = false;

// Agregamos un sprite estatico (usado como fallback si falla la carga o el idle)
// *** RUTA CORREGIDA: granjera.png está dentro de la carpeta 'images/' ***
const granjera = PIXI.Sprite.from("images/granjera.png");
granjera.anchor.set(0.5);
granjera.x = characterPos.x;
granjera.y = characterPos.y;
// Añadimos la granjera al contenedor del mundo si existe, sino al stage
if (typeof world !== "undefined") world.addChild(granjera);
else app.stage.addChild(granjera);

// Variables y referencias
let keys = {};
const animSprites = {}; // Para guardar las animaciones

// ** NUEVOS PARÁMETROS DE INTERACCIÓN **
const KILL_KEY_CODE = 32; // Código de tecla para matar (32 es la barra espaciadora)
const KILL_RADIUS = 40; // Distancia máxima en píxeles para que la granjera pueda interactuar/matar
const FARMER_RADIUS = 24; // Radio aproximado para evitar obstaculos

// ===========================================
// *** FUNCIONES HELPERS ***
// ===========================================

// Oculta todos los sprites animados y detiene su reproducción
function hideAllAnims() {
  Object.keys(animSprites).forEach((k) => {
    const s = animSprites[k];
    if (s) {
      s.visible = false;
      if (s.playing && !isAttacking) s.stop(); // Solo detenemos si no estamos en medio de un ataque
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
  } // Intentamos encontrar la lista de frames: 'walk', 'idle', o la primera lista disponible

  let animList =
    sheetData.animations.walk ||
    sheetData.animations.idle ||
    sheetData.animations.attack;

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
  } // --- Lógica de creación del AnimatedSprite ---

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
    animSprite.y = characterPos.y; // Velocidad de animación

    if (keyName.startsWith("idle")) {
      animSprite.animationSpeed = 0.1; // Velocidad lenta para reposo
    } else if (keyName.startsWith("attack")) {
      animSprite.animationSpeed = 0.25; // Velocidad rápida para ataque
      animSprite.loop = false; // El ataque NO se repite
    } else {
      animSprite.animationSpeed = 0.15; // Velocidad normal para caminar
    }

    animSprite.visible = false;
    animSprite.scale.x = Math.abs(animSprite.scale.x || 1);
    if (typeof world !== "undefined") world.addChild(animSprite);
    else app.stage.addChild(animSprite);
    if (keyName) animSprites[keyName] = animSprite; // Lógica para devolver al estado IDLE después de un ataque

    if (keyName.startsWith("attack")) {
      animSprite.onComplete = () => {
        isAttacking = false;
        animSprite.gotoAndStop(0); // Detener y reiniciar al primer frame
      };
    }
  } else {
    console.warn(
      `[Advertencia] ${keyName} no tiene frames válidos después de procesar el JSON.`
    );
  }
}

// =======================================================
// *** CARGA DE ANIMACIONES ***
// =======================================================

// Lista de todas las animaciones a cargar
const sheets = [
  "walk1", // Arriba
  "walk3", // Abajo
  "walk4", // Izquierda/Derecha
  "idle2", // Reposo Arriba
  "idle3", // Reposo Abajo
  "idle4", // Reposo Derecha
  "attack1", // ATAQUE Arriba
  "attack2", // ATAQUE Izquierda/Derecha (Ahora usado para ambos)
  "attack3", // ATAQUE Abajo
];

if (
  PIXI.Loader &&
  PIXI.Loader.shared &&
  typeof PIXI.Loader.shared.add === "function"
) {
  // *** RUTA CORREGIDA: Los JSON están dentro de la carpeta 'animaciones/' ***
  sheets.forEach((s) => PIXI.Loader.shared.add(s, `animaciones/${s}.json`));
  PIXI.Loader.shared.load((loader, resources) => {
    sheets.forEach((s) => {
      const res = resources[s];
      if (res && res.data) {
        // Acceso seguro a la ruta de la imagen: Asume s.png si el meta.image falla
        // *** RUTA CORREGIDA: Las imágenes PNG también están dentro de 'animaciones/' ***
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
    // *** RUTA CORREGIDA: Los JSON y PNG están dentro de la carpeta 'animaciones/' ***
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
  // Evitar que la barra espaciadora haga scroll en la página
  if (e.keyCode === KILL_KEY_CODE) {
    try {
      e.preventDefault();
    } catch (err) {}
  }
  keys[e.keyCode] = true;
}
function keysUp(e) {
  keys[e.keyCode] = false;
}

// Función para determinar la animación de ataque basada en la última dirección de reposo
function getAttackAnimKey() {
  switch (lastDirectionKey) {
    case "idle2": // Arriba
      return "attack1";
    case "idle3": // Abajo
      return "attack3";
    case "idle1": // Izquierda
      return "attack2"; // Usamos attack2
    case "idle4": // Derecha
    default:
      return "attack2"; // <<-- CAMBIO: Usamos attack2 para la derecha también
  }
}

// Gameloop para el movimiento, animación y la INTERACCIÓN DE MATANZA
function gameloop() {
  let moving = false;
  const speed = 3;
  let currentAnimKey = null;

  let movedX = false;
  let movedY = false; // 1. --- LÓGICA DE ATAQUE (Prioridad Máxima) ---

  if (keys[KILL_KEY_CODE] && !isAttacking && typeof flock !== "undefined") {
    isAttacking = true;
    keys[KILL_KEY_CODE] = false; // Consumir la pulsación para que no sea automático
    currentAnimKey = getAttackAnimKey(); // Ejecutar lógica de eliminación solo al inicio del ataque

    performKillLogic();
  } // Si estamos atacando, no se permite el movimiento (bloqueo de input)

  if (isAttacking) {
    currentAnimKey = getAttackAnimKey(); // Forzar la animación de ataque // Sincronizar el sprite de ataque y salir del bucle de movimiento/idle

    const attackAnim = animSprites[currentAnimKey];
    if (attackAnim) {
      hideAllAnims();
      showAnim(currentAnimKey);
      attackAnim.x = characterPos.x;
      attackAnim.y = characterPos.y; // Aplicar escala horizontal correcta para ataques laterales (attack2)

      if (currentAnimKey === "attack2") {
        // <<-- CORRECCIÓN: Invertimos la escala (multiplicamos por -1) para corregir el giro.
        // Esto asume que el sprite de ataque lateral (attack2) está dibujado mirando
        // en la dirección opuesta a la animación de caminar (walk4).
        attackAnim.scale.x = lastScaleX * -1;
      } else {
        // Asegurar que los ataques verticales (attack1, attack3) tengan escala positiva
        attackAnim.scale.x = Math.abs(attackAnim.scale.x || 1);
      }
    }
    return; // Salir del gameloop para que no se ejecute la lógica de movimiento/idle
  } // 2. --- LÓGICA DE MOVIMIENTO (Solo si NO está atacando) ---

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

  moving = movedX || movedY; // 3. --- LÓGICA DE ANIMACIÓN (Caminata/Idle) ---

  // Resolver colisiones contra obstáculos para que la granjera no atraviese rocas
  try {
    if (typeof ObstacleManager !== "undefined") {
      ObstacleManager.resolvePoint(characterPos, FARMER_RADIUS);
    }
  } catch (e) {
    // no bloquear si no existe
  }
  // Clamp de la granjera dentro de la pantalla
  try {
    if (typeof app !== "undefined" && app.screen) {
      const halfW = 18;
      const halfH = 24;
      const maxX =
        typeof WORLD_WIDTH !== "undefined"
          ? WORLD_WIDTH - halfW
          : app.screen.width - halfW;
      const maxY =
        typeof WORLD_HEIGHT !== "undefined"
          ? WORLD_HEIGHT - halfH
          : app.screen.height - halfH;
      if (characterPos.x < halfW) characterPos.x = halfW;
      if (characterPos.y < halfH) characterPos.y = halfH;
      if (characterPos.x > maxX) characterPos.x = maxX;
      if (characterPos.y > maxY) characterPos.y = maxY;
    }
  } catch (e) {}

  // Camara: centrar el world en la granjera, con límites para no mostrar fuera del mundo
  try {
    if (typeof world !== "undefined") {
      const sw = app.screen.width;
      const sh = app.screen.height;
      const ww = typeof WORLD_WIDTH !== "undefined" ? WORLD_WIDTH : sw;
      const wh = typeof WORLD_HEIGHT !== "undefined" ? WORLD_HEIGHT : sh;
      let targetX = -characterPos.x + sw / 2;
      let targetY = -characterPos.y + sh / 2;
      // limitar para que no muestre fuera del mundo
      const minX = -ww + sw;
      const minY = -wh + sh;
      if (targetX > 0) targetX = 0;
      if (targetX < minX) targetX = minX;
      if (targetY > 0) targetY = 0;
      if (targetY < minY) targetY = minY;
      world.x = targetX;
      world.y = targetY;
    }
  } catch (e) {}

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
      anim.scale.x = Math.abs(anim.scale.x || 1); // Actualizar la última dirección para W y S

      if (currentAnimKey === "walk1") lastDirectionKey = "idle2";
      if (currentAnimKey === "walk3") lastDirectionKey = "idle3"; // Para walk1 y walk3, restablecemos la escala X de reposo a 1

      lastScaleX = Math.abs(lastScaleX);
    }

    anim.x = characterPos.x;
    anim.y = characterPos.y;
  } else {
    // Animacion de idle
    hideAllAnims();
    let idleKey = lastDirectionKey; // Si la última dirección de caminata fue "idle1" (izquierda), usamos el sprite "idle4"

    if (idleKey === "idle1") {
      idleKey = "idle4";
    }

    const idleAnim = animSprites[idleKey];

    if (idleAnim) {
      // Si la animación idle existe, la mostramos y sincronizamos
      idleAnim.x = characterPos.x;
      idleAnim.y = characterPos.y;
      idleAnim.visible = true; // Aplicar la escala horizontal guardada (solo para idle4)

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
  } // 4. --- LÓGICA DE INTERACCIÓN Y MATANZA (Movida a performKillLogic) --- // Esta sección se ha movido a una función separada para ser llamada // cuando se inicia el ataque, en lugar de cada frame.
}

// ===============================================
// 🔪 FUNCIÓN DE LÓGICA DE MATANZA (REFACTORIZADA) 🔪
// ===============================================

function performKillLogic() {
  if (typeof flock === "undefined") return; // Obtenemos la posición real de la granjera

  const granjeraX = characterPos.x;
  const granjeraY = characterPos.y; // Iteramos el array 'flock' hacia atrás para poder eliminar elementos de forma segura

  for (let i = flock.length - 1; i >= 0; i--) {
    const animal = flock[i]; // Si el animal no es válido o ya fue eliminado, saltamos

    if (!animal || !animal.sprite) continue; // Calcular la distancia

    const dx = animal.sprite.x - granjeraX;
    const dy = animal.sprite.y - granjeraY;
    const distance = Math.sqrt(dx * dx + dy * dy); // Condición de Muerte/Interacción

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
      // Marcamos que matamos una blanca para provocar la transformación
      var killedWhite = true;
      // Si la granjera solo puede matar un animal por pulsación de tecla, salimos:
      // (Esto asegura que el ataque solo elimine uno por golpe)
      break;
    }
  }

  // Si no matamos ninguna del flock, intentamos con las ovejas estáticas (staticSheep)
  if (typeof staticSheep !== "undefined") {
    for (let i = staticSheep.length - 1; i >= 0; i--) {
      const animal = staticSheep[i];
      if (!animal || !animal.sprite) continue;
      const dx = animal.sprite.x - granjeraX;
      const dy = animal.sprite.y - granjeraY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < KILL_RADIUS) {
        console.log(
          `[GRANJERA] Matada oveja negra. staticSheep.length antes: ${staticSheep.length}`
        );
        if (typeof animal.removeSelf === "function") {
          animal.removeSelf();
        } else {
          animal.sprite.visible = false;
          staticSheep.splice(i, 1);
        }
        console.log(
          `[GRANJERA] Oveja negra eliminada. staticSheep.length después: ${staticSheep.length}`
        );
        break;
      }
    }
  }

  // Si matamos una blanca, transformamos otra blanca en negra
  if (typeof killedWhite !== "undefined" && killedWhite) {
    if (typeof transformRandomWhiteToBlack === "function") {
      transformRandomWhiteToBlack();
    }
  }
  // Actualizar HUD si existe
  try {
    if (
      typeof window !== "undefined" &&
      typeof window.updateCounters === "function"
    ) {
      window.updateCounters(
        Array.isArray(flock) ? flock.length : 0,
        Array.isArray(staticSheep) ? staticSheep.length : 0
      );
    }
  } catch (e) {}

  // Revisar si se alcanzó la victoria (todas las ovejas negras muertas)
  if (typeof window.checkVictory === "function") {
    console.log("[GRANJERA] Llamando a checkVictory()");
    window.checkVictory();
  }
}

// Se añade el gameloop al ticker
if (app && app.ticker) app.ticker.add(gameloop);

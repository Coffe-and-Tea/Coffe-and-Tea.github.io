let characterPos = {
  x:
    typeof WORLD_WIDTH !== "undefined"
      ? WORLD_WIDTH / 2
      : typeof app !== "undefined" && app.screen
      ? app.screen.width / 2
      : Math.round(window.innerWidth / 2),
  y:
    typeof WORLD_HEIGHT !== "undefined"
      ? WORLD_HEIGHT / 2
      : typeof app !== "undefined" && app.screen
      ? app.screen.height / 2
      : Math.round(window.innerHeight / 2),
};

console.log("granjera.js cargado. characterPos:", characterPos);

// Para recordar la última dirección de caminata
let lastDirectionKey = "idle3";

// Almacena la escala horizontal final
let lastScaleX = 1;

// Estado de ataque
let isAttacking = false;

// Agregamos un sprite estatico (usado como fallback si falla la carga o el idle)
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

const KILL_KEY_CODE = 32; // Código de tecla para matar aka barra espaciadora
const KILL_RADIUS = 40; // Distancia máxima en píxeles para que la granjera pueda interactuar/matar
const FARMER_RADIUS = 24; // Radio aproximado para evitar obstaculos

// *** FUNCIONES HELPERS ***

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

// Función robusta para leer animaciones del JSON
function setupFromSheetData(sheetData, baseImagePath, keyName) {
  if (!sheetData || !sheetData.animations) {
    console.warn(
      `[Carga Fallida] El JSON para ${keyName} está incompleto o mal formado (falta 'animations').`
    );
    return;
  }

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
  }

  // Lógica de creación del AnimatedSprite
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
      animSprite.loop = false; // El ataque no se repite
    } else {
      animSprite.animationSpeed = 0.15; // Velocidad normal para caminar
    }

    animSprite.visible = false;
    animSprite.scale.x = Math.abs(animSprite.scale.x || 1);
    if (typeof world !== "undefined") world.addChild(animSprite);
    else app.stage.addChild(animSprite);
    if (keyName) animSprites[keyName] = animSprite; // Lógica para devolver al estado idle después de un ataque

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

// *** CARGA DE ANIMACIONES ***

// Lista de todas las animaciones a cargar
const sheets = [
  "walk1", // Arriba
  "walk3", // Abajo
  "walk4", // Izquierda/Derecha
  "idle2", // Reposo Arriba
  "idle3", // Reposo Abajo
  "idle4", // Reposo Izquierda/Derecha
  "attack1", // ataque Arriba
  "attack2", // ataque Izquierda/Derecha
  "attack3", // ataque Abajo
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
        // Acceso seguro a la ruta de la imagen
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
  // Fallback
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

// *** INPUT Y GAMELOOP ***

// moviemiento wasd
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
      return "attack2";
  }
}

// Gameloop para el movimiento, animación y la mecanica de ataque
function gameloop() {
  let moving = false;
  const speed = 4;
  let currentAnimKey = null;

  let movedX = false;
  let movedY = false;

  // 1. LÓGICA DE ATAQUE
  if (keys[KILL_KEY_CODE] && !isAttacking && typeof flock !== "undefined") {
    isAttacking = true;
    keys[KILL_KEY_CODE] = false; // Consumir la pulsación para que no sea automático
    currentAnimKey = getAttackAnimKey(); // Ejecutar lógica de eliminación solo al inicio del ataque

    performKillLogic();
  }

  if (isAttacking) {
    currentAnimKey = getAttackAnimKey(); // Forzar la animación de ataque

    const attackAnim = animSprites[currentAnimKey];
    if (attackAnim) {
      hideAllAnims();
      showAnim(currentAnimKey);
      attackAnim.x = characterPos.x;
      attackAnim.y = characterPos.y; // Aplicar escala horizontal correcta para ataques laterales

      if (currentAnimKey === "attack2") {
        attackAnim.scale.x = lastScaleX * -1;
      } else {
        // Asegurar que los ataques verticales tengan escala positiva
        attackAnim.scale.x = Math.abs(attackAnim.scale.x || 1);
      }
    }
    return; // Salir del gameloop para que no se ejecute la lógica de movimiento/idle
  }

  // LÓGICA DE MOVIMIENTO
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

  // LÓGICA DE ANIMACIÓN
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

  // centrar el world en la granjera, con límites para no mostrar fuera del mundo
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
      if (currentAnimKey === "walk3") lastDirectionKey = "idle3";

      lastScaleX = Math.abs(lastScaleX);
    }

    anim.x = characterPos.x;
    anim.y = characterPos.y;
  } else {
    // Animacion de idle
    hideAllAnims();
    let idleKey = lastDirectionKey; // Si la última dirección de caminata fue idle1, usamos idle4

    if (idleKey === "idle1") {
      idleKey = "idle4";
    }

    const idleAnim = animSprites[idleKey];

    if (idleAnim) {
      // Si la animación idle existe, la mostramos y sincronizamos
      idleAnim.x = characterPos.x;
      idleAnim.y = characterPos.y;
      idleAnim.visible = true;

      if (idleKey === "idle4") {
        idleAnim.scale.x = lastScaleX;
      } else {
        // Asegurar que los idle verticales (idle2, idle3) tengan escala positiva
        idleAnim.scale.x = Math.abs(idleAnim.scale.x || 1);
      }

      if (!idleAnim.playing) idleAnim.play();
      granjera.visible = false;
    } else {
      // Fallback
      granjera.x = characterPos.x;
      granjera.y = characterPos.y;
      granjera.visible = true;
    }
  }
}

// Mecanica de ataque

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
        // Fallback
        console.error("Falta el método removeSelf() en la clase del animal.");
        animal.sprite.visible = false;
        flock.splice(i, 1);
      }
      // Marcamos que matamos una blanca para provocar la transformación
      var killedWhite = true;
      // Si la granjera solo puede matar un animal por pulsación de tecla, salimos
      break;
    }
  }

  // Si no matamos ninguna del flock, intentamos con las ovejas estáticas
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
    window.checkVictory();
  }
}

// Se añade el gameloop al ticker
if (app && app.ticker) app.ticker.add(gameloop);

// Configuración global y referencias
const numGoats = 80;
const flock = [];
const loadedTextures = {}; // Almacena los frames de animación cargados

// Definiciones de las rutas
const SHEETS = ["goat_beige_w", "goat_beige_a", "goat_beige_s", "goat_beige_d"];
const BLACK_SHEETS = [
  "goat_black_w",
  "goat_black_a",
  "goat_black_s",
  "goat_black_d",
];

// Rutas relativas (sin slash inicial para funcionar desde server http)
const BASE_PATH = "animaciones_animales/cabra_beige/";
const BLACK_BASE = "animaciones_animales/goat_black/";

// Array para ovejas negras estáticas (objetos con { sprite, removeSelf })
const staticSheep = [];

// =========================================================
// **  1. CLASE GOATBOID (Boid con Animación Direccional) **
// =========================================================

class GoatBoid {
  constructor(x, y) {
    // Inicializar con la textura 'Abajo'
    this.sprite = new PIXI.AnimatedSprite(loadedTextures["goat_beige_s"]);
    this.sprite.anchor.set(0.5);
    this.sprite.x = x;
    this.sprite.y = y;
    this.sprite.animationSpeed = 0.15;
    this.sprite.play();
    // app debe estar definido y accesible globalmente
    app.stage.addChild(this.sprite);

    // Variables Boid
    this.position = new PIXI.Point(x, y);
    // Inicializamos la velocidad con dirección aleatoria y magnitud aleatoria
    // (evita dividir por cero si el vector casual queda en 0)
    this.maxSpeed = 1.8;
    const ang = Math.random() * Math.PI * 2;
    const sp = Math.random() * this.maxSpeed;
    this.velocity = new PIXI.Point(Math.cos(ang) * sp, Math.sin(ang) * sp);
    this.maxForce = 0.04;
    this.perceptionRadius = 60;
    this.separationDistance = 25;
    // Parámetros para evitar a la granjera (farmer)
    this.avoidRadius = 90; // radio en píxeles en el que la cabra empezará a alejarse
    this.avoidForce = 3.2; // multiplicador de fuerza de evasión (se normaliza por maxForce en applyForce)
    this.minFarmerDistance = 32; // distancia mínima permitida entre la cabra y la granjera (teleport si la tocan)
    // Wander (deambular) para evitar que todas vayan en la misma dirección
    this.wanderAngle = Math.random() * Math.PI * 2;
    this.wanderRadius = 8; // radio del círculo de wander
    this.wanderDistance = 12; // distancia del círculo desde la posición
    this.wanderChange = 0.6; // cuánto puede cambiar el ángulo por frame
    this.wanderStrength = 0.3; // fuerza de steering del wander

    // No normalizamos aquí porque ya inicializamos con magnitud <= maxSpeed
  }

  // Permite que la granjera (variable global `characterPos`) pueda forzar que la cabra se aleje.
  avoidFarmer() {
    // Si la granjera no está definida, no hacemos nada
    if (typeof characterPos === "undefined") return new PIXI.Point(0, 0);

    const dx = this.position.x - characterPos.x;
    const dy = this.position.y - characterPos.y;
    const d = Math.sqrt(dx * dx + dy * dy);

    if (d === 0) {
      // Caso degenerado: reposicionar a un punto mínimo alrededor de la granjera
      const ux = Math.random() - 0.5 || 0.1;
      const uy = Math.random() - 0.5 || 0.1;
      const len = Math.sqrt(ux * ux + uy * uy);
      const nx = (ux / len) * this.minFarmerDistance;
      const ny = (uy / len) * this.minFarmerDistance;
      this.position.x = characterPos.x + nx;
      this.position.y = characterPos.y + ny;
      this.sprite.x = this.position.x;
      this.sprite.y = this.position.y;
      this.velocity.x = (nx / this.minFarmerDistance) * this.maxSpeed;
      this.velocity.y = (ny / this.minFarmerDistance) * this.maxSpeed;
      return new PIXI.Point(0, 0);
    }

    // Si estamos dentro de la distancia mínima, forzamos una recolocación al borde
    if (d < this.minFarmerDistance) {
      const ux = dx / d;
      const uy = dy / d;
      this.position.x = characterPos.x + ux * this.minFarmerDistance;
      this.position.y = characterPos.y + uy * this.minFarmerDistance;
      this.sprite.x = this.position.x;
      this.sprite.y = this.position.y;
      // Rebotar la velocidad hacia afuera
      this.velocity.x = ux * this.maxSpeed;
      this.velocity.y = uy * this.maxSpeed;
      return new PIXI.Point(0, 0);
    }

    if (d < this.avoidRadius) {
      // Vector unitario en dirección contraria a la granjera
      const ux = dx / d;
      const uy = dy / d;
      // Fuerza proporcional a qué tan cerca estemos (más fuerte cuanto más cerca)
      const strength =
        ((this.avoidRadius - d) / this.avoidRadius) * this.avoidForce;
      return new PIXI.Point(ux * strength, uy * strength);
    }

    return new PIXI.Point(0, 0);
  }

  updateAnimation() {
    const angle = Math.atan2(this.velocity.y, this.velocity.x);
    const degrees = angle * (180 / Math.PI);

    let newAnimKey;
    if (degrees >= -45 && degrees < 45) {
      newAnimKey = "goat_beige_d";
    } // Derecha
    else if (degrees >= 45 && degrees < 135) {
      newAnimKey = "goat_beige_s";
    } // Abajo
    else if (degrees >= 135 || degrees < -135) {
      newAnimKey = "goat_beige_a";
    } // Izquierda
    else {
      newAnimKey = "goat_beige_w";
    } // Arriba

    if (this.sprite.textures !== loadedTextures[newAnimKey]) {
      this.sprite.textures = loadedTextures[newAnimKey];
      this.sprite.play();
    }
  }

  // Reglas Boid (flock, applyForce, update, edges, separate, align, cohesion) - Se mantienen.
  flock(flock) {
    // Reglas boid
    let sep = this.separate(flock);
    let ali = this.align(flock);
    let coh = this.cohesion(flock);
    // Evasión de la granjera: fuerza adicional que empuja en sentido contrario
    let evade = this.avoidFarmer(flock);
    // Wander para diversidad
    let wander = this.wander();

    // Pesos: reducimos el alineamiento para evitar que todos vayan juntos a la misma dirección
    sep.x *= 1.8;
    sep.y *= 1.8;
    ali.x *= 0.6;
    ali.y *= 0.6; // menos alineamiento
    coh.x *= 0.8;
    coh.y *= 0.8;
    wander.x *= 1.0;
    wander.y *= 1.0;

    // Aplicar las fuerzas. Evitar se aplica al final para mayor prioridad.
    this.applyForce(sep);
    this.applyForce(coh);
    this.applyForce(ali);
    this.applyForce(wander);
    this.applyForce(evade);
  }

  // Wander: comportamiento de deriva aleatoria para diversificar direcciones
  wander() {
    // cambiar ligeramente el ángulo
    this.wanderAngle += (Math.random() - 0.5) * this.wanderChange;
    // punto objetivo en frente del boid
    const cx =
      this.position.x + Math.cos(this.wanderAngle) * this.wanderDistance;
    const cy =
      this.position.y + Math.sin(this.wanderAngle) * this.wanderDistance;
    // vector hacia el punto en el círculo
    const tx =
      cx + Math.cos(this.wanderAngle) * this.wanderRadius - this.position.x;
    const ty =
      cy + Math.sin(this.wanderAngle) * this.wanderRadius - this.position.y;
    return new PIXI.Point(tx * this.wanderStrength, ty * this.wanderStrength);
  }

  applyForce(force) {
    let mag = Math.sqrt(force.x * force.x + force.y * force.y);
    if (mag > this.maxForce) {
      force.x *= this.maxForce / mag;
      force.y *= this.maxForce / mag;
    }
    this.velocity.x += force.x;
    this.velocity.y += force.y;
    let velMag = Math.sqrt(
      this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y
    );
    if (velMag > this.maxSpeed) {
      this.velocity.x *= this.maxSpeed / velMag;
      this.velocity.y *= this.maxSpeed / velMag;
    }
  }

  update() {
    // Añadimos un pequeño ruido aleatorio para evitar que todos tomen la misma trayectoria
    this.velocity.x += (Math.random() - 0.5) * 0.04;
    this.velocity.y += (Math.random() - 0.5) * 0.04;
    // Limitar magnitud de velocidad
    let velMagClamp = Math.sqrt(
      this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y
    );
    if (velMagClamp > this.maxSpeed) {
      this.velocity.x = (this.velocity.x / velMagClamp) * this.maxSpeed;
      this.velocity.y = (this.velocity.y / velMagClamp) * this.maxSpeed;
    }

    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
    this.sprite.x = this.position.x;
    this.sprite.y = this.position.y;
    this.updateAnimation();
    this.edges();
  }

  edges() {
    const screenWidth = app.screen.width;
    const screenHeight = app.screen.height;
    if (this.position.x > screenWidth) this.position.x = 0;
    else if (this.position.x < 0) this.position.x = screenWidth;
    if (this.position.y > screenHeight) this.position.y = 0;
    else if (this.position.y < 0) this.position.y = screenHeight;
  }

  separate(flock) {
    let steering = new PIXI.Point(0, 0);
    let count = 0;
    for (let other of flock) {
      let d = Math.sqrt(
        Math.pow(this.position.x - other.position.x, 2) +
          Math.pow(this.position.y - other.position.y, 2)
      );
      if (other !== this && d < this.separationDistance) {
        let diff = new PIXI.Point(
          this.position.x - other.position.x,
          this.position.y - other.position.y
        );
        diff.x /= d * d;
        diff.y /= d * d;
        steering.x += diff.x;
        steering.y += diff.y;
        count++;
      }
    }
    if (count > 0) {
      steering.x /= count;
      steering.y /= count;
    }
    return steering;
  }
  align(flock) {
    let avgVelocity = new PIXI.Point(0, 0);
    let count = 0;
    for (let other of flock) {
      let d = Math.sqrt(
        Math.pow(this.position.x - other.position.x, 2) +
          Math.pow(this.position.y - other.position.y, 2)
      );
      if (other !== this && d < this.perceptionRadius) {
        avgVelocity.x += other.velocity.x;
        avgVelocity.y += other.velocity.y;
        count++;
      }
    }
    if (count > 0) {
      avgVelocity.x /= count;
      avgVelocity.y /= count;
    }
    return avgVelocity;
  }
  cohesion(flock) {
    let centerOfMass = new PIXI.Point(0, 0);
    let count = 0;
    for (let other of flock) {
      let d = Math.sqrt(
        Math.pow(this.position.x - other.position.x, 2) +
          Math.pow(this.position.y - other.position.y, 2)
      );
      if (other !== this && d < this.perceptionRadius) {
        centerOfMass.x += other.position.x;
        centerOfMass.y += other.position.y;
        count++;
      }
      if (count > 0) {
        centerOfMass.x /= count;
        centerOfMass.y /= count;
        centerOfMass.x -= this.position.x;
        centerOfMass.y -= this.position.y;
      }
    }
    return centerOfMass;
  }

  // Remueve la cabra de la escena y del arreglo global `flock` (llamado por granjera.performKillLogic)
  removeSelf() {
    try {
      if (this.sprite && this.sprite.parent)
        this.sprite.parent.removeChild(this.sprite);
    } catch (e) {
      console.warn("No se pudo remover sprite del stage:", e);
    }
    const idx = flock.indexOf(this);
    if (idx !== -1) {
      flock.splice(idx, 1);
    }
  }
}

// ==============================================
// **  2. FUNCIONES DE CARGA E INICIALIZACIÓN  **
// ==============================================

function createFlock() {
  for (let i = 0; i < numGoats; i++) {
    const startX = Math.random() * app.screen.width;
    const startY = Math.random() * app.screen.height;
    const goat = new GoatBoid(startX, startY);
    flock.push(goat);
  }
  app.ticker.add(goatGameloop);
  console.log(`Simulación Boid iniciada: ${numGoats} cabras.`);
}

function goatGameloop() {
  for (let goat of flock) {
    goat.flock(flock);
    goat.update();
  }
  // Actualizar ovejas negras móviles
  for (let s of staticSheep) {
    if (s && typeof s.update === "function") s.update();
  }
}

// Función para procesar el JSON y extraer los frames de animación
function extractFrames(sheetData, sheetName, baseDir) {
  // 🚨 Corrección: Solo necesitamos que el objeto 'frames' exista en el JSON.
  if (!sheetData || !sheetData.frames) {
    console.error(
      `Error de estructura JSON en ${sheetName}.json: Faltan 'frames' o el JSON está vacío.`
    );
    return [];
  }

  const basePathToUse = baseDir || BASE_PATH;
  const baseImage = `${basePathToUse}${sheetName}.png`;

  // Intenta crear la textura PNG.
  try {
    const baseTex = PIXI.BaseTexture.from(baseImage);
  } catch (e) {
    console.error(
      `ERROR CRÍTICO: El archivo PNG no se pudo cargar: ${baseImage}`
    );
    return [];
  }
  const baseTex = PIXI.BaseTexture.from(baseImage);

  let animList = null;

  // Lógica para obtener la lista de frames del objeto 'animations'
  if (sheetData.animations && Object.keys(sheetData.animations).length > 0) {
    // Obtenemos la primera animación que aparezca (que sabemos que es "goat" en tu JSON)
    const firstAnimKey = Object.keys(sheetData.animations)[0];
    animList = sheetData.animations[firstAnimKey];
  } else {
    // Opción de respaldo: Si no hay animaciones, usamos todas las claves de frames.
    animList = Object.keys(sheetData.frames);
  }

  if (!animList || animList.length === 0) {
    console.error(
      `Error: La lista de frames de animación está vacía en ${sheetName}.json.`
    );
    return [];
  }

  // Mapeamos los nombres de los frames a Texturas de PIXI
  return animList
    .map((name) => {
      const f = sheetData.frames[name];
      if (!f || !f.frame) {
        console.warn(
          `Frame ${name} no encontrado o incompleto en ${sheetName}.json.`
        );
        return null;
      }
      const r = f.frame;
      // Comprobación de dimensiones para evitar el error 'shared'
      if (r.w === 0 || r.h === 0) return null;

      return new PIXI.Texture(baseTex, new PIXI.Rectangle(r.x, r.y, r.w, r.h));
    })
    .filter(Boolean); // Eliminamos cualquier frame nulo o mal formado
}

// ===========================================================
// ** 3. INICIO DEL PROGRAMA: Carga Asíncrona (PIXI.Assets) **
// ===========================================================

async function loadGoatAssets() {
  const manifest = {
    bundles: [
      {
        name: "goatBundle",
        assets: {},
      },
    ],
  };

  // Agregamos tanto las hojas beige como las negras al manifiesto
  SHEETS.forEach((s) => {
    manifest.bundles[0].assets[s] = `${BASE_PATH}${s}.json`;
  });
  BLACK_SHEETS.forEach((s) => {
    manifest.bundles[0].assets[s] = `${BLACK_BASE}${s}.json`;
  });

  try {
    await PIXI.Assets.init({ manifest: manifest });
    const resources = await PIXI.Assets.loadBundle("goatBundle");

    let success = true;

    // Procesamos todas las assets del bundle (tanto beige como black)
    Object.keys(manifest.bundles[0].assets).forEach((s) => {
      let resource = resources[s];
      const sheetData = resource && (resource.data || resource);

      // Elegir basePath correcto según el nombre
      const baseDir = BLACK_SHEETS.includes(s) ? BLACK_BASE : BASE_PATH;

      if (sheetData && sheetData.frames) {
        const frames = extractFrames(sheetData, s, baseDir);
        if (frames.length === 0) {
          success = false;
        } else {
          loadedTextures[s] = frames;
        }
      } else {
        success = false;
        console.error(
          `Error: El archivo JSON ${s}.json se cargó, pero no contiene la estructura de frames esperada.`
        );
      }
    });

    if (success) {
      createFlock();
      // Crear 6 ovejas negras móviles en posiciones aleatorias
      createStaticBlackSheep(6);
      console.log(
        "¡Éxito! 🎉 La simulación Boid con cabras animadas ha comenzado."
      );
    } else {
      console.error(
        "🔴 No se pudo iniciar la simulación. El problema es la estructura interna de los JSON (verifique el objeto 'frames' en el JSON)."
      );
    }
  } catch (error) {
    console.error("⛔ ERROR CRÍTICO DURANTE LA CARGA DE ASSETS.", error);
  }
}

// ⚠️ EJECUCIÓN ⚠️
// ⚠️ EJECUCIÓN ⚠️
loadGoatAssets();

// =====================================================
// ** 4. OVEJAS NEGRAS ESTÁTICAS (CREACIÓN Y HELPERS) **
// =====================================================

function createStaticBlackSheep(count = 6) {
  if (!loadedTextures["goat_black_s"]) {
    console.warn(
      "No se encontraron texturas para ovejas negras (goat_black_s). No se crearán."
    );
    return;
  }

  for (let i = 0; i < count; i++) {
    let x = Math.random() * app.screen.width;
    let y = Math.random() * app.screen.height;

    // Asegurar que no nazcan encima de la granjera: si characterPos existe, reposicionar
    if (typeof characterPos !== "undefined") {
      const dx = x - characterPos.x;
      const dy = y - characterPos.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < 48) {
        const ang = Math.random() * Math.PI * 2;
        x = characterPos.x + Math.cos(ang) * 64;
        y = characterPos.y + Math.sin(ang) * 64;
      }
    }

    createMovingBlackSheep(x, y);
  }
}

// Crea una oveja negra móvil que gira en círculos pequeños y erráticos
function createMovingBlackSheep(x, y) {
  const frames = loadedTextures["goat_black_s"];
  if (!frames) return null;

  const sprite = new PIXI.AnimatedSprite(frames);
  sprite.anchor.set(0.5);
  sprite.x = x;
  sprite.y = y;
  sprite.animationSpeed = 0.12;
  sprite.play();
  app.stage.addChild(sprite);

  // Parámetros de movimiento circular y errático
  const center = { x: x, y: y };
  let angle = Math.random() * Math.PI * 2;
  const radius = 6 + Math.random() * 10; // pequeño radio
  let angularSpeed =
    (Math.random() * 0.06 + 0.02) * (Math.random() < 0.5 ? -1 : 1);

  const obj = {
    sprite,
    center,
    angle,
    radius,
    angularSpeed,
    // update llamado desde goatGameloop
    update() {
      // variar ligeramente el centro para dar comportamiento errático
      center.x += (Math.random() - 0.5) * 0.6;
      center.y += (Math.random() - 0.5) * 0.6;
      // alterar la velocidad angular levemente
      this.angularSpeed += (Math.random() - 0.5) * 0.004;
      // limitar angularSpeed
      if (this.angularSpeed > 0.12) this.angularSpeed = 0.12;
      if (this.angularSpeed < -0.12) this.angularSpeed = -0.12;
      this.angle += this.angularSpeed;
      this.sprite.x = center.x + Math.cos(this.angle) * this.radius;
      this.sprite.y = center.y + Math.sin(this.angle) * this.radius;
    },
    removeSelf() {
      try {
        if (this.sprite && this.sprite.parent)
          this.sprite.parent.removeChild(this.sprite);
      } catch (e) {
        console.warn("No se pudo remover oveja negra:", e);
      }
      const idx = staticSheep.indexOf(this);
      if (idx !== -1) staticSheep.splice(idx, 1);
    },
  };

  staticSheep.push(obj);
  return obj;
}

// Transforma aleatoriamente una cabra blanca en negra (llamada por granjera al matar una blanca)
function transformRandomWhiteToBlack() {
  if (!flock || flock.length === 0) return;
  // escoger una cabra blanca aleatoria
  const idx = Math.floor(Math.random() * flock.length);
  const goat = flock[idx];
  if (!goat) return;
  const x = goat.position.x;
  const y = goat.position.y;
  // eliminar la cabra blanca
  if (typeof goat.removeSelf === "function") goat.removeSelf();
  else flock.splice(idx, 1);
  // crear una oveja negra móvil en su lugar
  createMovingBlackSheep(x, y);

  // Comprueba condición de reinicio: si hay más de la mitad convertidas a negras
  const blackCount = staticSheep.length;
  if (blackCount > numGoats / 2) {
    // reiniciar juego (recargar página)
    if (
      typeof location !== "undefined" &&
      typeof location.reload === "function"
    ) {
      location.reload();
    }
  }
}

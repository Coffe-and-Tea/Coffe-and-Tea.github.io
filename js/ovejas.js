// Configuración global y referencias
const numGoats = 170;
const flock = [];
const loadedTextures = {}; // Almacena los frames de animación cargados

// DEBUG: confirmar que `app` y `window` existen en este punto
console.log(
  "[OVEJAS DEBUG] app:",
  typeof app !== "undefined" ? "defined" : "undefined",
  "window.hasInitialSheep:",
  typeof window.hasInitialSheep !== "undefined"
    ? window.hasInitialSheep
    : "undefined"
);

// Definiciones de las rutas
const SHEETS = ["goat_beige_w", "goat_beige_a", "goat_beige_s", "goat_beige_d"];
const BLACK_SHEETS = [
  "goat_black_w",
  "goat_black_a",
  "goat_black_s",
  "goat_black_d",
];

// Rutas relativas
const BASE_PATH = "animaciones_animales/cabra_beige/";
const BLACK_BASE = "animaciones_animales/goat_black/";

// Array para ovejas negras estáticas
const staticSheep = [];

// Exponer staticSheep globalmente para que otros scripts puedan accederlo
window.staticSheep = staticSheep;

// HUD ahora está centralizado en js/contadores.js: usamos su API si existe

// Flag global para saber si se han creado las ovejas iniciales
window.hasInitialSheep = false;

// Inicializar setInitialSheepCreated si no existe (fallback)
if (typeof window.setInitialSheepCreated !== "function") {
  window.setInitialSheepCreated = function () {
    window.hasInitialSheep = true;
  };
}

// **  1. CLASE GOATBOID (Boid con Animación Direccional) **

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
    if (typeof world !== "undefined") world.addChild(this.sprite);
    else app.stage.addChild(this.sprite);

    // Variables Boid
    this.position = new PIXI.Point(x, y);
    this.maxSpeed = 1.4; // Inicializamos la velocidad con dirección aleatoria y magnitud aleatoria
    const ang = Math.random() * Math.PI * 2;
    const sp = Math.random() * this.maxSpeed;
    this.velocity = new PIXI.Point(Math.cos(ang) * sp, Math.sin(ang) * sp);
    this.maxForce = 0.04;
    this.perceptionRadius = 60;
    this.separationDistance = 25;
    // Parámetros para evitar a la granjera (farmer)
    this.avoidRadius = 120; // radio en píxeles en el que la cabra empezará a alejarse
    this.avoidForce = 1.8; // fuerza base de evasión; aumentada para respuesta más perceptible
    this.minFarmerDistance = 48; // distancia de seguridad alrededor de la granjera
    this.wanderAngle = Math.random() * Math.PI * 2; // Wander para evitar que todas vayan en la misma dirección
    this.wanderRadius = 6; // radio del círculo de wander
    this.wanderDistance = 10; // distancia del círculo desde la posición
    this.wanderChange = 0.4; // cuánto puede cambiar el ángulo por frame
    this.wanderStrength = 0.15; // fuerza de steering del wander (menor para movimiento más lento)
  }

  // Permite que la granjera (variable global `characterPos`) pueda forzar que la cabra se aleje.
  avoidFarmer() {
    // Si la granjera no está definida, no hacemos nada
    if (typeof characterPos === "undefined") return new PIXI.Point(0, 0);
    const dx = this.position.x - characterPos.x;
    const dy = this.position.y - characterPos.y;
    const d = Math.sqrt(dx * dx + dy * dy);

    // Caso degenerado: aplicamos una pequeña fuerza aleatoria para salir (este comentario lo puso la ia y lo vamos solo xq es chistoso el concepto de caso degenerado)
    if (d === 0) {
      const ux = Math.random() - 0.5 || 0.1;
      const uy = Math.random() - 0.5 || 0.1;
      const len = Math.sqrt(ux * ux + uy * uy) || 1;
      const nx = ux / len;
      const ny = uy / len;
      return new PIXI.Point(nx * this.avoidForce, ny * this.avoidForce);
    }

    // Si estamos muy cerca, aplicamos una fuerza más fuerte y reducimos velocidad
    if (d < this.minFarmerDistance) {
      const ux = dx / d;
      const uy = dy / d;
      const strength =
        ((this.minFarmerDistance - d) / this.minFarmerDistance) *
        this.avoidForce *
        1.6;
      const n1 = (Math.random() - 0.5) * 0.9;
      const n2 = (Math.random() - 0.5) * 0.9;
      this.velocity.x *= 0.75;
      this.velocity.y *= 0.75;
      const fx = ux * strength + n1 * (strength * 0.4);
      const fy = uy * strength + n2 * (strength * 0.4);
      return new PIXI.Point(fx, fy);
    }

    // Dentro del radio de evasión: fuerza gradual con ruido leve
    if (d < this.avoidRadius) {
      const ux = dx / d;
      const uy = dy / d;
      const strength =
        ((this.avoidRadius - d) / this.avoidRadius) * this.avoidForce;
      const n1 = (Math.random() - 0.5) * 0.4;
      const n2 = (Math.random() - 0.5) * 0.4;
      const fx = ux * strength + n1 * (strength * 0.25);
      const fy = uy * strength + n2 * (strength * 0.25);
      return new PIXI.Point(fx, fy);
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
    // Aceptar override opcional para maxForce (prioridad de la fuerza)
    let maxOverride = null;
    if (arguments.length > 1 && typeof arguments[1] === "number")
      maxOverride = arguments[1];

    let mag = Math.sqrt(force.x * force.x + force.y * force.y);
    const clamp = maxOverride || this.maxForce;
    if (mag > clamp) {
      force.x *= clamp / mag;
      force.y *= clamp / mag;
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
    this.velocity.x += (Math.random() - 0.5) * 0.02;
    this.velocity.y += (Math.random() - 0.5) * 0.02;
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
    // Clamp dentro del mundo/ventana para evitar que salgan
    const screenWidth =
      typeof WORLD_WIDTH !== "undefined" ? WORLD_WIDTH : app.screen.width;
    const screenHeight =
      typeof WORLD_HEIGHT !== "undefined" ? WORLD_HEIGHT : app.screen.height;
    const halfW = Math.max(this.sprite.width, 16) * 0.5;
    const halfH = Math.max(this.sprite.height, 16) * 0.5;
    if (this.position.x > screenWidth - halfW) {
      this.position.x = screenWidth - halfW;
      this.velocity.x *= -0.3;
    } else if (this.position.x < halfW) {
      this.position.x = halfW;
      this.velocity.x *= -0.3;
    }
    if (this.position.y > screenHeight - halfH) {
      this.position.y = screenHeight - halfH;
      this.velocity.y *= -0.3;
    } else if (this.position.y < halfH) {
      this.position.y = halfH;
      this.velocity.y *= -0.3;
    }
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
        // atenuar por distancia (1/d) en lugar de 1/d^2 para evitar fuerzas explosivas
        const inv = 1 / (d || 0.0001);
        diff.x *= inv;
        diff.y *= inv;
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
    }
    if (count > 0) {
      centerOfMass.x /= count;
      centerOfMass.y /= count;
      centerOfMass.x -= this.position.x;
      centerOfMass.y -= this.position.y;
    }
    return centerOfMass;
  }

  // Atracción hacia ovejas negras
  attractToBlackSheep(blackSheepArray) {
    let attraction = new PIXI.Point(0, 0);
    if (!blackSheepArray || blackSheepArray.length === 0) {
      return attraction;
    }

    const attractionRadius = 200; // radio en el que se sienten atraídas
    let nearestBlack = null;
    let nearestDist = Infinity;

    // Encontrar la oveja negra más cercana dentro del radio
    for (let blackSheep of blackSheepArray) {
      if (!blackSheep || !blackSheep.position) continue;
      const dx = blackSheep.position.x - this.position.x;
      const dy = blackSheep.position.y - this.position.y;
      const d = Math.sqrt(dx * dx + dy * dy);

      if (d < attractionRadius && d < nearestDist) {
        nearestDist = d;
        nearestBlack = blackSheep;
      }
    }

    // Si encontramos una oveja negra cercana, calcular fuerza de atracción
    if (nearestBlack && nearestDist > 0) {
      const dx = nearestBlack.position.x - this.position.x;
      const dy = nearestBlack.position.y - this.position.y;
      const d = nearestDist;

      // Fuerza que aumenta cuando más cercana está la oveja negra
      const strength = (1 - d / attractionRadius) * 0.7; // de 0.8 a 0

      attraction.x = (dx / d) * strength;
      attraction.y = (dy / d) * strength;
    }

    return attraction;
  }

  // Comportamiento de flock: combina separación, alineamiento, cohesión, wander, atracción a negras y evasión
  flock(flockArray) {
    // Obtener vectores básicos
    const sep = this.separate(flockArray);
    const ali = this.align(flockArray);
    const coh = this.cohesion(flockArray);
    const wand = this.wander();

    // Obtener atracción hacia ovejas negras
    const attract = this.attractToBlackSheep(
      typeof window.staticSheep !== "undefined" ? window.staticSheep : []
    );

    // Ajustes para dispersión: incrementar separación y wander, reducir alineamiento y cohesión
    const SEP_W = 2.2;
    const ALI_W = 0.15;
    const COH_W = 0.12;
    const WAND_W = 1.2;
    const ATTR_W = 1.5; // peso de atracción a ovejas negras

    // Escalamos los componentes
    sep.x *= SEP_W;
    sep.y *= SEP_W;
    ali.x *= ALI_W;
    ali.y *= ALI_W;
    coh.x *= COH_W;
    coh.y *= COH_W;
    wand.x *= WAND_W;
    wand.y *= WAND_W;
    attract.x *= ATTR_W;
    attract.y *= ATTR_W;

    // Aplicamos fuerzas normales
    this.applyForce(sep);
    this.applyForce(ali);
    this.applyForce(coh);
    this.applyForce(wand);
    this.applyForce(attract); // Aplicar atracción a ovejas negras

    // Evasión de la granjera: si existe una fuerza de evasión, aplicarla con prioridad
    // Pero si hay atracción a ovejas negras, reducir la fuerza de evasión para que les cueste más alejarse
    const evade = this.avoidFarmer();
    const hasAttraction = attract.x !== 0 || attract.y !== 0;
    if (
      (evade.x && Math.abs(evade.x) > 0.0001) ||
      (evade.y && Math.abs(evade.y) > 0.0001)
    ) {
      // Si están atraídas por ovejas negras, reducir la fuerza de evasión
      const evasionMultiplier = hasAttraction ? 0.6 : 1.0; // reducir a 60% si hay atracción
      evade.x *= evasionMultiplier;
      evade.y *= evasionMultiplier;

      // Aplicar evasión con un clamp mayor para que no sea anulada por otras fuerzas
      const overrideClamp = this.maxForce * 6;
      this.applyForce(evade, overrideClamp);
    }
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

// FUNCIONES DE CARGA E INICIALIZACIÓN
// esto deberia estar como metodo en juego.js pero no sabemos como implementarlo ahi todavia, asi que lo dejamos acá por ahora.
function createFlock() {
  for (let i = 0; i < numGoats; i++) {
    const startX =
      typeof WORLD_WIDTH !== "undefined"
        ? Math.random() * WORLD_WIDTH
        : Math.random() * app.screen.width;
    const startY =
      typeof WORLD_HEIGHT !== "undefined"
        ? Math.random() * WORLD_HEIGHT
        : Math.random() * app.screen.height;
    const goat = new GoatBoid(startX, startY);
    flock.push(goat);
  }
  app.ticker.add(goatGameloop);
  // Notificar que se han creado las ovejas iniciales
  if (typeof window.setInitialSheepCreated === "function") {
    window.setInitialSheepCreated();
  }
}

function goatGameloop() {
  // Usamos un bucle hacia atrás para poder eliminar entradas inválidas sin romper la iteración
  for (let i = flock.length - 1; i >= 0; i--) {
    const goat = flock[i];
    if (!goat) {
      flock.splice(i, 1);
      continue;
    }
    try {
      // Intentamos ejecutar las funciones; si no existen o fallan lanzará y lo atrapamos
      if (goat && typeof goat.flock === "function") goat.flock(flock);
      if (goat && typeof goat.update === "function") goat.update();
      // Resolver colisiones contra obstáculos (si existen)
      try {
        if (typeof ObstacleManager !== "undefined") {
          const radius =
            Math.max(goat.sprite.width, goat.sprite.height) * 0.5 * 0.6;
          ObstacleManager.resolvePoint(goat.position, radius);
          goat.sprite.x = goat.position.x;
          goat.sprite.y = goat.position.y;
        }
      } catch (e) {
        // no bloquear si no está disponible
      }
    } catch (e) {
      console.error(
        "Error actualizando goat en goatGameloop, se eliminará el elemento:",
        e,
        goat
      );
      flock.splice(i, 1);
    }
  }
  // Actualizar ovejas negras móviles
  for (let s of staticSheep) {
    if (s && typeof s.update === "function") s.update();
  }

  // Corrección física simple: evitar solapamiento entre ovejas del flock
  for (let i = 0; i < flock.length; i++) {
    for (let j = i + 1; j < flock.length; j++) {
      const a = flock[i];
      const b = flock[j];
      if (!a || !b) continue;
      const dx = b.position.x - a.position.x;
      const dy = b.position.y - a.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 0.0001;
      // Determinar radios aproximados (basado en ancho del sprite)
      const ra = Math.max(a.sprite.width, a.sprite.height) * 0.5 * 0.8;
      const rb = Math.max(b.sprite.width, b.sprite.height) * 0.5 * 0.8;
      const minDist = ra + rb;
      if (dist < minDist && dist > 0) {
        const overlap = (minDist - dist) / 2;
        const ux = dx / dist;
        const uy = dy / dist;
        // mover ambos hacia fuera
        a.position.x -= ux * overlap;
        a.position.y -= uy * overlap;
        b.position.x += ux * overlap;
        b.position.y += uy * overlap;
        a.sprite.x = a.position.x;
        a.sprite.y = a.position.y;
        b.sprite.x = b.position.x;
        b.sprite.y = b.position.y;
      }
    }
  }

  // Evitar solapamiento entre flock y staticSheep
  for (let g of flock) {
    for (let s of staticSheep) {
      if (!g || !s) continue;
      const dx = g.position.x - s.sprite.x;
      const dy = g.position.y - s.sprite.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 0.0001;
      const rg = Math.max(g.sprite.width, g.sprite.height) * 0.5 * 0.8;
      const rs = Math.max(s.sprite.width, s.sprite.height) * 0.5 * 0.8;
      const minD = rg + rs;
      if (dist < minD) {
        const overlap = minD - dist + 0.5;
        const ux = dx / dist;
        const uy = dy / dist;
        g.position.x += ux * overlap;
        g.position.y += uy * overlap;
        g.sprite.x = g.position.x;
        g.sprite.y = g.position.y;
      }
    }
  }
}

// Función para procesar el JSON y extraer los frames de animación
function extractFrames(sheetData, sheetName, baseDir) {
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

// ** 3. INICIO DEL PROGRAMA: Carga Asíncrona (PIXI.Assets) **

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
      }
    });

    if (success) {
      createFlock();
      createStaticBlackSheep(8);
      // Actualizar HUD después de crear entidades
      if (typeof window.updateCounters === "function") {
        window.updateCounters(flock.length, staticSheep.length);
      }
    }
  } catch (error) {
    console.error("Error durante la carga de assets", error);
  }
}

// ejecucion
loadGoatAssets();

// ** 4. OVEJAS NEGRAS ESTÁTICAS (CREACIÓN Y HELPERS) **

function createStaticBlackSheep(count = 6) {
  if (!loadedTextures["goat_black_s"]) {
    console.warn(
      "No se encontraron texturas para ovejas negras (goat_black_s). No se crearán."
    );
    return;
  }

  for (let i = 0; i < count; i++) {
    let x =
      typeof WORLD_WIDTH !== "undefined"
        ? Math.random() * WORLD_WIDTH
        : Math.random() * app.screen.width;
    let y =
      typeof WORLD_HEIGHT !== "undefined"
        ? Math.random() * WORLD_HEIGHT
        : Math.random() * app.screen.height;

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
  sprite.animationSpeed = 0.08; // más lento
  sprite.play();
  if (typeof world !== "undefined") world.addChild(sprite);
  else app.stage.addChild(sprite);

  // Parámetros de movimiento circular y errático
  const center = { x: x, y: y };
  let angle = Math.random() * Math.PI * 2;
  const radius = 4 + Math.random() * 6;
  let angularSpeed =
    (Math.random() * 0.02 + 0.008) * (Math.random() < 0.5 ? -1 : 1);

  const obj = {
    sprite,
    center,
    angle,
    radius,
    angularSpeed,
    // update llamado desde goatGameloop
    update() {
      // Si la granjera está cerca, empujar el centro hacia afuera de forma gradual
      if (typeof characterPos !== "undefined") {
        const dx = center.x - characterPos.x;
        const dy = center.y - characterPos.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 0.0001;
        const avoidRadius = 120;
        if (d < avoidRadius) {
          const ux = dx / d;
          const uy = dy / d;
          const strength = ((avoidRadius - d) / avoidRadius) * 1.8;
          center.x += ux * strength * 1.2;
          center.y += uy * strength * 1.2;
        }
      }

      // variar ligeramente el centro para dar comportamiento errático (más suave)
      center.x += (Math.random() - 0.5) * 0.2;
      center.y += (Math.random() - 0.5) * 0.2;
      // alterar la velocidad angular muy levemente
      this.angularSpeed += (Math.random() - 0.5) * 0.001;
      // limitar angularSpeed
      if (this.angularSpeed > 0.045) this.angularSpeed = 0.045;
      if (this.angularSpeed < -0.045) this.angularSpeed = -0.045;
      this.angle += this.angularSpeed;
      this.sprite.x = center.x + Math.cos(this.angle) * this.radius;
      this.sprite.y = center.y + Math.sin(this.angle) * this.radius;

      // ajustar center si sprite colisiona contra bordes u obstáculos
      if (typeof ObstacleManager !== "undefined") {
        const p = { x: this.sprite.x, y: this.sprite.y };
        try {
          ObstacleManager.resolvePoint(
            p,
            Math.max(this.sprite.width, this.sprite.height) * 0.5 * 0.7
          );
          const dx = p.x - this.sprite.x;
          const dy = p.y - this.sprite.y;
          if (Math.abs(dx) > 0.001 || Math.abs(dy) > 0.001) {
            center.x += dx;
            center.y += dy;
            this.sprite.x = p.x;
            this.sprite.y = p.y;
          }
        } catch (e) {}
      }
      // Restringe la posición central de la oveja negra al mundo.
      const screenWidth =
        typeof WORLD_WIDTH !== "undefined" ? WORLD_WIDTH : app.screen.width;
      const screenHeight =
        typeof WORLD_HEIGHT !== "undefined" ? WORLD_HEIGHT : app.screen.height;
      const halfSize = 16; // Margen de seguridad para que no toque el borde

      // Clamp center X
      if (center.x < halfSize) {
        center.x = halfSize;
      } else if (center.x > screenWidth - halfSize) {
        center.x = screenWidth - halfSize;
      }

      // Clamp center Y
      if (center.y < halfSize) {
        center.y = halfSize;
      } else if (center.y > screenHeight - halfSize) {
        center.y = screenHeight - halfSize;
      }
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
    position: center, // Añadido para que las cabras beige puedan acceder a su posición
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
  // actualizar HUD si existe
  if (typeof window.updateCounters === "function")
    window.updateCounters(flock.length, staticSheep.length);
}

// Convierte una fracción (0..1) del flock actual en ovejas negras.
function convertFractionWhiteToBlack(fraction) {
  if (!flock || flock.length === 0) return;
  fraction = Math.max(0, Math.min(1, fraction || 0));
  const totalWhite = flock.length;
  const toConvert = Math.floor(totalWhite * fraction);
  if (toConvert <= 0) return;

  // Seleccionar 'toConvert' ovejas aleatorias sin repetir
  const indices = Array.from({ length: totalWhite }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = indices[i];
    indices[i] = indices[j];
    indices[j] = tmp;
  }
  const selected = indices
    .slice(0, toConvert)
    .map((i) => flock[i])
    .filter(Boolean);

  // Transformar cada cabra seleccionada en oveja negra móvil
  for (let goat of selected) {
    if (!goat) continue;
    const x = goat.position.x;
    const y = goat.position.y;
    if (typeof goat.removeSelf === "function") goat.removeSelf();
    else {
      const idx = flock.indexOf(goat);
      if (idx !== -1) flock.splice(idx, 1);
    }
    createMovingBlackSheep(x, y);
  }

  // Actualizar HUD si existe
  if (typeof window.updateCounters === "function")
    window.updateCounters(flock.length, staticSheep.length);
}

// Exponer la función globalmente para que otros scripts puedan llamarla
window.convertFractionWhiteToBlack = convertFractionWhiteToBlack;

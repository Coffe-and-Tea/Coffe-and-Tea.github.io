// Configuración global y referencias
const numGoats = 60;
const flock = [];
const loadedTextures = {}; // Almacena los frames de animación cargados

// Definiciones de las rutas
const SHEETS = ["goat_beige_w", "goat_beige_a", "goat_beige_s", "goat_beige_d"];

// Esto asume que 'animaciones_animales' está en la raíz de tu proyecto (junto a index.html y js).
const BASE_PATH = "/animaciones_animales/cabra_beige/";

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
    this.velocity = new PIXI.Point(
      Math.random() * 2 - 1,
      Math.random() * 2 - 1
    );
    this.maxSpeed = 1.8;
    this.maxForce = 0.04;
    this.perceptionRadius = 60;
    this.separationDistance = 25;

    let len = Math.sqrt(
      this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y
    );
    this.velocity.x /= len;
    this.velocity.y /= len;
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
    let sep = this.separate(flock);
    let ali = this.align(flock);
    let coh = this.cohesion(flock);
    sep.x *= 1.8;
    sep.y *= 1.8;
    ali.x *= 1.2;
    ali.y *= 1.2;
    coh.x *= 1.0;
    coh.y *= 1.0;
    this.applyForce(sep);
    this.applyForce(ali);
    this.applyForce(coh);
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
}

// Función para procesar el JSON y extraer los frames de animación
function extractFrames(sheetData, sheetName) {
  // 🚨 Corrección: Solo necesitamos que el objeto 'frames' exista en el JSON.
  if (!sheetData || !sheetData.frames) {
    console.error(
      `Error de estructura JSON en ${sheetName}.json: Faltan 'frames' o el JSON está vacío.`
    );
    return [];
  }

  const baseImage = `${BASE_PATH}${sheetName}.png`;

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

  SHEETS.forEach((s) => {
    manifest.bundles[0].assets[s] = `${BASE_PATH}${s}.json`;
  });

  try {
    await PIXI.Assets.init({ manifest: manifest });
    const resources = await PIXI.Assets.loadBundle("goatBundle");

    let success = true;

    SHEETS.forEach((s) => {
      let resource = resources[s];

      const sheetData = resource.data || resource;

      if (sheetData && sheetData.frames) {
        const frames = extractFrames(sheetData, s);
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
loadGoatAssets();

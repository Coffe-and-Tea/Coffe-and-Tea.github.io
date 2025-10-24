// Agregamos un sprite estatico para cuando la granjera no esta en movimiento (reemplazar por idle)
const granjera = PIXI.Sprite.from('images/granjera.png');
granjera.anchor.set(0.5);
granjera.x = app.screen.width / 2;
granjera.y = app.screen.height / 2;
app.stage.addChild(granjera);


// Variables y referencias 
let keys = {}; 
let granjeraAnimada = null; 


// Para guardar las animaciones 
const animSprites = {}; 


// Helpers para mostrar/ocultar animaciones
function hideAllAnims() {
  Object.keys(animSprites).forEach(k => {
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
  s.x = granjera.x;
  s.y = granjera.y;
  s.visible = true;

  // Ocultamos el sprite estático para evitar superposición
  granjera.visible = false;
  if (!s.playing) s.play();
}


// Cargamos los spritesheets
function setupFromSheetData(sheetData, baseImagePath, keyName) {
  const animList = sheetData.animations.walk;

  // Crear baseTexture desde la imagen del spritesheet
  const baseTex = PIXI.BaseTexture.from(baseImagePath);
  const frames = animList.map(name => {
    const f = sheetData.frames[name];
    if (!f || !f.frame) return null;
    const r = f.frame;
    return new PIXI.Texture(baseTex, new PIXI.Rectangle(r.x, r.y, r.w, r.h));
  }).filter(Boolean);

  if (frames.length) {
    const animSprite = new PIXI.AnimatedSprite(frames);
    animSprite.anchor.set(0.5);
    animSprite.x = granjera.x;
    animSprite.y = granjera.y;
    animSprite.animationSpeed = 0.15;
    animSprite.visible = false;
    animSprite.scale.x = Math.abs(animSprite.scale.x || 1);
    app.stage.addChild(animSprite);
    if (keyName) animSprites[keyName] = animSprite;
  }
}


// Cargamos los spritesheets del walk1 al walk4
const sheets = ['walk1', 'walk2', 'walk3', 'walk4'];
if (PIXI.Loader && PIXI.Loader.shared && typeof PIXI.Loader.shared.add === 'function') {
  
  sheets.forEach(s => PIXI.Loader.shared.add(s, `animaciones/${s}.json`));
  PIXI.Loader.shared.load((loader, resources) => {
    sheets.forEach(s => {
      const res = resources[s];
    });
  });

} else {
  // fallback: fetch cada JSON
  sheets.forEach(s => {
    fetch(`animaciones/${s}.json`).then(r => r.json()).then(json => {
      const baseImage = (json.meta && json.meta.image) ? `animaciones/${json.meta.image}` : `animaciones/${s}.png`;
      setupFromSheetData(json, baseImage, s);
    }).catch(err => console.error('Error leyendo JSON del spritesheet:', err));
  });
}


// Agregamos el movimiento "WASD" del teclado 
window.addEventListener('keydown', keysDown);
window.addEventListener('keyup', keysUp);

function keysDown(e) { keys[e.keyCode] = true; }
function keysUp(e) { keys[e.keyCode] = false; }


// Gameloop para el movimiento y poder controlar la animación
function gameloop() {
  let moving = false;


// Seleccionamos la animación por tecla
  const mapKeyToAnim = {
    87: 'walk1', // W
    65: 'walk4', // A (usando walk4 invertida)
    83: 'walk3', // S
    68: 'walk4'  // D
  };


// Movimiento base por tecla (se mueve la animSprite si existe, si no, el sprite estático)
  if (keys[87]) { // W
    moving = true;
    const anim = animSprites['walk1'];
    if (anim) {
      hideAllAnims();
      showAnim('walk1');
      anim.y -= 4;
      granjera.y = anim.y;
      granjera.x = anim.x;
    } else {
      granjera.y -= 4;
    }
  }

  if (keys[83]) { // S
    moving = true;
    const anim = animSprites['walk3'];
    if (anim) {
      hideAllAnims();
      showAnim('walk3');
      anim.y += 4;
      granjera.y = anim.y;
      granjera.x = anim.x;
    } else {
      granjera.y += 4;
    }
  }

  if (keys[65]) { // A
    moving = true;
    const anim = animSprites['walk4'];
    if (anim) {
      hideAllAnims();
      showAnim('walk4');
      anim.scale.x = -Math.abs(anim.scale.x || 1); // Invertimos la animación
      anim.x -= 4;
      granjera.x = anim.x;
    } else {
      granjera.x -= 4;
    }
  }

  if (keys[68]) { // D
    moving = true;
    const anim = animSprites['walk4'];
    if (anim) {
      hideAllAnims();
      showAnim('walk4');
      anim.x += 4;
      granjera.x = anim.x;
    } else {
      granjera.x += 4;
    }
  }

  // Si no se mueve, se va a mostrar el sprite estático y se detiene la animación
  if (!moving) {
    // Se esconden todas las anims y pasa a mostrar la estática
    hideAllAnims();
    granjera.visible = true;
    // Se sincroniza las posiciones con cualquiera de las anims si existe
    const anyAnim = animSprites.walk1 || animSprites.walk2 || animSprites.walk3 || animSprites.walk4;
    if (anyAnim) {
      granjera.x = anyAnim.x;
      granjera.y = anyAnim.y;
    }
  }
}


// Se añade el gameloop al ticker
if (app && app.ticker) app.ticker.add(gameloop);
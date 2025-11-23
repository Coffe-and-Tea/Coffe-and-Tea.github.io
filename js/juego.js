// Creamos la app de pixi
const app = new PIXI.Application({
  width: window.innerWidth,
  height: window.innerHeight,
  antialias: true,
  resizeTo: window,
});

// Remover márgenes y padding del body y html
document.documentElement.style.margin = "0";
document.documentElement.style.padding = "0";
document.documentElement.style.width = "100%";
document.documentElement.style.height = "100%";
document.documentElement.style.overflow = "hidden";

document.body.style.margin = "0";
document.body.style.padding = "0";
document.body.style.width = "100%";
document.body.style.height = "100%";
document.body.style.overflow = "hidden";

// Remover márgenes del canvas y hacerlo fullscreen
app.view.style.margin = "0";
app.view.style.padding = "0";
app.view.style.display = "block";
app.view.style.width = "100%";
app.view.style.height = "100%";

document.body.appendChild(app.view);
// Configuramos tamaño del mundo (doble del viewport)
const WORLD_WIDTH = app.screen.width * 2;
const WORLD_HEIGHT = app.screen.height * 2;

// Creamos un contenedor para todo el mundo (la "escena") y otro para HUD en pantalla fija
const world = new PIXI.Container();
const hudContainer = new PIXI.Container();
app.stage.addChild(world);
app.stage.addChild(hudContainer);

// Agregamos el fondo al mundo y lo escalamos al tamaño del mundo
const background = PIXI.Sprite.from("images/pasto.png");
background.width = WORLD_WIDTH;
background.height = WORLD_HEIGHT;
background.anchor.set(0);
background.x = 0;
background.y = 0;
world.addChild(background);

// --- OBSTÁCULOS: Rocas ---
const piedras = [];
const rockPositions = [
  { x: WORLD_WIDTH * 0.25, y: WORLD_HEIGHT * 0.6 },
  { x: WORLD_WIDTH * 0.7, y: WORLD_HEIGHT * 0.2 },
  { x: WORLD_WIDTH * 0.8, y: WORLD_HEIGHT * 0.75 },
  { x: WORLD_WIDTH * 0.58, y: WORLD_HEIGHT * 0.56 },
];

for (let i = 0; i < 4; i++) {
  const r = PIXI.Sprite.from("images/piedra.png");
  r.width = 90 + Math.random() * 40;
  r.height = (r.width * 0.7) | 0;
  r.anchor.set(0.5);
  r.x = rockPositions[i].x + (Math.random() - 0.5) * 80;
  r.y = rockPositions[i].y + (Math.random() - 0.5) * 60;
  world.addChild(r);
  piedras.push(r);
}

// --- OBSTÁCULOS: Casa Abandonada ---
const casa = [];
const casaPositions = [{ x: WORLD_WIDTH * 0.5, y: WORLD_HEIGHT * 0.35 }];
const c = PIXI.Sprite.from("images/granja_abandonada.png");
c.width = 370;
c.height = (c.width * 0.93) | 0;
c.anchor.set(0.5);
c.x = casaPositions[0].x;
c.y = casaPositions[0].y;

world.addChild(c);
casa.push(c);

// --- OBSTÁCULOS: Vallas Horizontales ---
const vallasHorizontales = [];
// Posiciones para vallas horizontales (no se superponen con rocas/casa)
const hFencePositions = [
  { x: WORLD_WIDTH * 0.1, y: WORLD_HEIGHT * 0.25 },
  { x: WORLD_WIDTH * 0.35, y: WORLD_HEIGHT * 0.1 },
  { x: WORLD_WIDTH * 0.75, y: WORLD_HEIGHT * 0.9 },
  { x: WORLD_WIDTH * 0.15, y: WORLD_HEIGHT * 0.8 },
];

// Tamaño distinto para vallas horizontales
const H_FENCE_WIDTH = 120;
const H_FENCE_HEIGHT = 40;

for (const pos of hFencePositions) {
  const valla = PIXI.Sprite.from("images/valla_h.png");
  valla.width = H_FENCE_WIDTH;
  valla.height = H_FENCE_HEIGHT;
  valla.anchor.set(0.5);
  // Aplica un ligero desplazamiento aleatorio
  valla.x = pos.x + (Math.random() - 0.5) * 40;
  valla.y = pos.y + (Math.random() - 0.5) * 30;

  world.addChild(valla);
  vallasHorizontales.push(valla);
}

// --- OBSTÁCULOS: Vallas Verticales ---
const vallasVerticales = [];
// Posiciones para vallas verticales (no se superponen con rocas/casa)
const vFencePositions = [
  { x: WORLD_WIDTH * 0.9, y: WORLD_HEIGHT * 0.4 },
  { x: WORLD_WIDTH * 0.3, y: WORLD_HEIGHT * 0.45 },
  { x: WORLD_WIDTH * 0.65, y: WORLD_HEIGHT * 0.65 },
  { x: WORLD_WIDTH * 0.4, y: WORLD_HEIGHT * 0.95 },
];

// Tamaño distinto para vallas verticales
const V_FENCE_WIDTH = 40;
const V_FENCE_HEIGHT = 120;

for (const pos of vFencePositions) {
  const valla = PIXI.Sprite.from("images/valla_v.png");
  valla.width = V_FENCE_WIDTH;
  valla.height = V_FENCE_HEIGHT;
  valla.anchor.set(0.5);
  // Aplica un ligero desplazamiento aleatorio
  valla.x = pos.x + (Math.random() - 0.5) * 30;
  valla.y = pos.y + (Math.random() - 0.5) * 40;

  world.addChild(valla);
  vallasVerticales.push(valla);
}

// --- REGISTRO DE OBSTÁCULOS PARA COLISIÓN ---
// Incluimos rocas, casa, Vallas Horizontales Y Vallas Verticales
const todosLosObstaculos = [
  ...piedras,
  ...casa,
  ...vallasHorizontales,
  ...vallasVerticales, // ¡Ambos tipos de vallas son ahora obstáculos colisionables!
];

// Aseguramos que el array de obstáculos a registrar exista.
window.pendingObstacles = window.pendingObstacles || [];

// Registramos todos los elementos como obstáculos sólidos.
for (let r of todosLosObstaculos) {
  window.pendingObstacles.push({
    sprite: r,
    padding: 6,
    options: {
      allowPassBehind: false,
    },
  });
}

// Iniciamos la pantalla de inicio cuando la ventana cargue
window.addEventListener("load", () => {
  console.log("[GAME] Window loaded. Showing start screen.");
  if (typeof window.showStartScreen === "function") {
    window.showStartScreen();
  }
});

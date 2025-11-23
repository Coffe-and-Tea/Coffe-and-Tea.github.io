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

// Obstáculos del mundo: piedras, vallas y una casa abandonada
const piedras = [];
const rockPositions = [
  { x: WORLD_WIDTH * 0.25, y: WORLD_HEIGHT * 0.6 },
  { x: WORLD_WIDTH * 0.6, y: WORLD_HEIGHT * 0.35 },
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

// const vallasHorizontales = [];
// const vallasPositions = [
//   { x: WORLD_WIDTH * 0.25, y: WORLD_HEIGHT * 0.6 },
//   { x: WORLD_WIDTH * 0.6, y: WORLD_HEIGHT * 0.35 },
//   { x: WORLD_WIDTH * 0.8, y: WORLD_HEIGHT * 0.75 },
//   { x: WORLD_WIDTH * 0.58, y: WORLD_HEIGHT * 0.56 },
// ];

// for (let i = 0; i < 4; i++) {
//   // Usamos el nombre de imagen que proporcionaste, asumiendo que es correcto
//   const r = PIXI.Sprite.from("images/valla_h.png");
//   r.width = 90;
//   r.height = (r.width * 0.7) | 0;
//   r.anchor.set(0.5);
//   // Aplica el ligero desplazamiento aleatorio que definiste
//   r.x = vallasPositions[i].x + (Math.random() - 0.5) * 80;
//   r.y = vallasPositions[i].y + (Math.random() - 0.5) * 60;
//   world.addChild(r);
//   vallasHorizontales.push(r);
// }

const casa = [];
const casaPositions = [{ x: WORLD_WIDTH * 0.5, y: WORLD_HEIGHT * 0.35 }];
const c = PIXI.Sprite.from("images/granja_abandonada.png");
c.width = 350;
c.height = (c.width * 0.95) | 0;
c.anchor.set(0.5);
c.x = casaPositions[0].x;
c.y = casaPositions[0].y;

world.addChild(c);
casa.push(c);

const todosLosObstaculos = [...piedras, ...casa];

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

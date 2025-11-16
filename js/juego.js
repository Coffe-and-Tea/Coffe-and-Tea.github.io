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

// Agregamos una granja al mundo
const farm = PIXI.Sprite.from("images/granja_abandonada.png");
farm.width = 600;
farm.height = 320;
farm.anchor.set(0.5);
farm.x = WORLD_WIDTH / 2;
farm.y = WORLD_HEIGHT / 2;
world.addChild(farm);

// Nota: placeholder 'piedra' removido; se crearán varias rocas más abajo
// Crear 3 rocas distribuidas por el mapa y registrarlas como obstáculos
const piedras = [];
const rockPositions = [
  { x: WORLD_WIDTH * 0.25, y: WORLD_HEIGHT * 0.6 },
  { x: WORLD_WIDTH * 0.6, y: WORLD_HEIGHT * 0.35 },
  { x: WORLD_WIDTH * 0.8, y: WORLD_HEIGHT * 0.75 },
];

for (let i = 0; i < 3; i++) {
  const r = PIXI.Sprite.from("images/piedra.png");
  r.width = 90 + Math.random() * 40;
  r.height = (r.width * 0.7) | 0;
  r.anchor.set(0.5);
  r.x = rockPositions[i].x + (Math.random() - 0.5) * 80;
  r.y = rockPositions[i].y + (Math.random() - 0.5) * 60;
  world.addChild(r);
  piedras.push(r);
}

// Registrar las rocas como obstáculos en pendingObstacles para que ObstacleManager las añada
window.pendingObstacles = window.pendingObstacles || [];
for (let r of piedras) {
  window.pendingObstacles.push({
    sprite: r,
    padding: 6,
    options: { allowPassBehind: false },
  });
}

// Iniciamos la pantalla de inicio cuando la ventana cargue
// El timer se iniciará cuando el usuario presione "COMENZAR"
window.addEventListener("load", () => {
  console.log("[GAME] Window loaded. Showing start screen.");
  if (typeof window.showStartScreen === "function") {
    window.showStartScreen();
  }
});

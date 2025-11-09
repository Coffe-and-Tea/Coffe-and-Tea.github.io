// Creamos la app de pixi
const app = new PIXI.Application({
  width: 1920,
  height: 1080,
  antialias: true,
});

document.body.appendChild(app.view);
// Agregamos el fondo a la escena
const background = PIXI.Sprite.from("images/pasto.png");
background.width = app.screen.width;
background.height = app.screen.height;
background.anchor.set(0);
background.x = 0;
background.y = 0;
app.stage.addChild(background);

// Agregamos una granja a la escena
const farm = PIXI.Sprite.from("images/granja_abandonada.png");
farm.width = 600;
farm.height = 320;
farm.anchor.set(0);
(farm.x = app.screen.width / 2),
(farm.y = app.screen.height / 2),
app.stage.addChild(farm);
background.x = 0;
background.y = 0;

const piedra = PIXI.Sprite.from("images/piedra.png");
piedra.width = 100;
piedra.height = 70;
app.stage.addChild(piedra);
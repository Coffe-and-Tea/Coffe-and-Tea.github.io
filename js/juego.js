// Creamos la app de pixi
const app = new PIXI.Application({
  width: 1920,
  height: 1080,
  antialias: true,
});

document.body.appendChild(app.view);

// Agregamos el fondo a la escena
const background = PIXI.Sprite.from("images/fondo-pasto.png");
background.width = app.screen.width;
background.height = app.screen.height;
background.anchor.set(0);
background.x = 0;
background.y = 0;
app.stage.addChild(background);

//Overlay de sangre en la pantalla
const sangre = PIXI.Sprite.from("images/sangre.png");
sangre.width = window.innerWidth;
sangre.height = window.innerHeight;
sangre.anchor.set(0);
sangre.x = 0;
sangre.y = 0;
sangre.alpha = 0;


// Variables para el efecto de titileo
let bloodOpacityDirection = 1;
let bloodOpacitySpeed = 0.01;
let bloodMinOpacity = 0.2;
let bloodMaxOpacity = 0.8;
let bloodEffectActive = true;


app.stage.sortableChildren = true;
app.stage.addChild(sangre);


// Visibilidad de la capa de sangre
sangre.zIndex = 1;
if (typeof app !== "undefined") {
    app.stage.sortableChildren = true;
   
    if (typeof hudContainer !== "undefined") {
        hudContainer.zIndex = 5;
    }
}


// Animación del efecto de sangre
if (typeof app !== "undefined") {
    app.ticker.add(() => {
        if (bloodEffectActive) {
            sangre.alpha += bloodOpacitySpeed * bloodOpacityDirection;


            if (sangre.alpha >= bloodMaxOpacity) {
                sangre.alpha = bloodMaxOpacity;
                bloodOpacityDirection = -1;
            }
            else if (sangre.alpha <= bloodMinOpacity) {
                sangre.alpha = bloodMinOpacity;
                bloodOpacityDirection = 1;
            }
        } else {
            sangre.alpha = 0;
        }
    });
}
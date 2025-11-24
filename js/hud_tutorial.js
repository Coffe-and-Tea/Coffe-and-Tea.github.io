// HUD TUTORIAL 

const tutorialHudContainer = new PIXI.Container();

// capa y posicion ----------------------------------------------
world.sortableChildren = true; 
tutorialHudContainer.zIndex = 1000;

tutorialHudContainer.x = WORLD_WIDTH / 2; 
tutorialHudContainer.y = WORLD_HEIGHT / 2;
world.addChild(tutorialHudContainer);


// Carga de imagen -----------------------------------------------
const tutorial = PIXI.Sprite.from("images/tutorial.png");
tutorial.width = 1920;
tutorial.height = 1080;
tutorial.anchor.set(0.5);
tutorialHudContainer.addChild(tutorial);


// Boton y propiedades -------------------------------------------
const botonCerrarContainer = new PIXI.Container();

const botonFondo = new PIXI.Graphics();
botonFondo.beginFill(0xEAEAEA); 
botonFondo.drawRoundedRect(-75, -30, 150, 60, 10);
botonFondo.endFill();
botonCerrarContainer.addChild(botonFondo);

const estiloTexto = new PIXI.TextStyle({
    fontFamily: 'Special Elite',
    fontSize: 40,
    fill: '#000000', 
});
const textoJugar = new PIXI.Text('Jugar', estiloTexto);
textoJugar.anchor.set(0.5); 
botonCerrarContainer.addChild(textoJugar);

botonCerrarContainer.y = 380;

botonCerrarContainer.eventMode = 'static'; 
botonCerrarContainer.cursor = 'pointer'; 

botonCerrarContainer.on('pointerover', () => {
    // Teñimos el fondo de ROJO
    botonFondo.tint = 0x8C1B24; 
});

botonCerrarContainer.on('pointerout', () => {
    botonFondo.tint = 0xFFFFFF; 
});


// Funcion boton agregado del mismo ------------------------------
botonCerrarContainer.on('pointerdown', () => {
    world.removeChild(tutorialHudContainer);
    window.juegoIniciado = true; 
    console.log("Tutorial cerrado. ¡Tiempo corriendo!");
});

tutorialHudContainer.addChild(botonCerrarContainer);
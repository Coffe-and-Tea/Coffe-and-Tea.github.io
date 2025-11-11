// Screen fade controller
(function() {
    // Check if the PIXI application is globally available
    // Asumimos que 'app' es la instancia de PIXI.Application.
    const pixiApp = typeof app !== 'undefined' ? app : (typeof window.app !== 'undefined' ? window.app : null);

    if (!pixiApp) {
        console.error("PIXI Application 'app' not found. Screen fade cannot be initialized.");
        return;
    }
    
    // DEBUG: Confirm the script is executing
    console.log("[FADE CONTROLLER] Script initialized and PIXI app found.");

    // --- Variables de FADE ---
    const overlay = new PIXI.Graphics();
    overlay.alpha = 0;
    overlay.position.set(0, 0); 
    pixiApp.stage.addChild(overlay); 

    let overlayAlpha = 0;
    const fadeInSpeed = 0.01; // fade speed
    const targetAlpha = 0.7; // target opacity
    let fadingIn = false; // flag to control the fade

    // --- Variables de la Interfaz de Game Over ---
    let gameOverContainer = null;
    const GAME_OVER_TEXT_STYLE = {
        fontFamily: "Special Elite",
        fontSize: 36,
        fill: 0xffffff, // #ffffff
        stroke: 0x000000, // #000
        strokeThickness: 4, // Para simular el text-shadow de 2px
        dropShadow: false,
        align: 'center'
    };
    
    // --- Lógica del FADE y Redimensionamiento ---

    // Function to update the black layer size if the canvas resizes
    function updateOverlaySize() {
        // Clear previous drawing
        overlay.clear(); 
        
        // Redraw with current renderer dimensions
        overlay.beginFill(0x000000); 
        overlay.drawRect(0, 0, pixiApp.renderer.width, pixiApp.renderer.height);
        overlay.endFill();
        
        // Maintain current opacity
        overlay.alpha = overlayAlpha; 
        
        // Reposition the UI elements if they exist
        if (gameOverContainer) {
            gameOverContainer.x = pixiApp.renderer.width / 2;
            gameOverContainer.y = pixiApp.renderer.height / 2;
        }
    }

    // Listen to the PIXI renderer resize event
    pixiApp.renderer.on('resize', updateOverlaySize);
    
    // --- Lógica de la Interfaz de Game Over ---
    
    function createGameOverUI() {
        if (gameOverContainer) return; // Already created

        // Contenedor para agrupar el texto y los botones
        gameOverContainer = new PIXI.Container();
        gameOverContainer.sortableChildren = true;
        
        // 1. Título "PERDISTE"
        const loseText = new PIXI.Text("PERDISTE", GAME_OVER_TEXT_STYLE);
        // Aplica un fondo semi-transparente similar al CSS usando un Graphics detrás
        const textBackground = new PIXI.Graphics();
        textBackground.beginFill(0x000000, 0.5); // Negro con 50% de opacidad
        // Añadimos padding y centramos el rectángulo detrás del texto
        const padding = 15;
        textBackground.drawRect(
            -loseText.width / 2 - padding, 
            -loseText.height / 2 - padding, 
            loseText.width + 2 * padding, 
            loseText.height + 2 * padding
        );
        textBackground.endFill();
        // Centrar el texto
        loseText.anchor.set(0.5);
        loseText.y = -50; // Posición sobre el botón
        
        // Agregamos el fondo y el texto al contenedor. El fondo va primero.
        gameOverContainer.addChild(textBackground);
        gameOverContainer.addChild(loseText);

        // 2. Botón "REINICIAR" (Usando Graphics para la forma y Text para la etiqueta)
        const BUTTON_STYLE = Object.assign({}, GAME_OVER_TEXT_STYLE, { 
            fontSize: 24, 
            fill: 0x000000, // Color de texto negro para el botón
            stroke: 0xffffff, // Borde blanco
            strokeThickness: 2
        });

        const buttonText = new PIXI.Text("REINICIAR", BUTTON_STYLE);
        buttonText.anchor.set(0.5);

        const button = new PIXI.Graphics();
        const buttonPadding = 20;
        const buttonWidth = buttonText.width + 2 * buttonPadding;
        const buttonHeight = buttonText.height + buttonPadding;
        
        // Dibujar el botón con un color de fondo diferente
        button.beginFill(0xffffff, 0.8); // Fondo del botón blanco semi-transparente
        button.drawRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 10);
        button.endFill();
        
        // Hacerlo interactivo
        button.interactive = true;
        button.buttonMode = true;
        
        // Listener para el click
        button.on('pointerdown', () => {
            console.log("[FADE CONTROLLER] Botón REINICIAR presionado. Recargando página...");
            // *** MODIFICACIÓN AQUÍ ***
            // Esto fuerza a que la página se cargue de nuevo.
            window.location.reload(); 
        });

        // Posicionar y agregar al contenedor
        button.y = 50;
        buttonText.y = 50;
        gameOverContainer.addChild(button);
        gameOverContainer.addChild(buttonText);

        // Centrar el contenedor en el escenario
        gameOverContainer.x = pixiApp.renderer.width / 2;
        gameOverContainer.y = pixiApp.renderer.height / 2;

        // Agregar el contenedor al Stage (DEBE ir DESPUÉS del overlay para estar encima)
        pixiApp.stage.addChild(gameOverContainer);
        console.log("[FADE CONTROLLER] UI de Game Over creada y mostrada.");
    }


    // Function to start the fade
    function startFadeIn() {
        // Solo empezar si no está atenuando
        if (!fadingIn && overlayAlpha < targetAlpha) {
            fadingIn = true;
            
            // Asegúrate de que el overlay esté siempre en la capa más alta
            pixiApp.stage.setChildIndex(overlay, pixiApp.stage.children.length - 1);
            
            // Si la UI de Game Over ya existe, ocúltala
            if(gameOverContainer) {
                pixiApp.stage.removeChild(gameOverContainer);
                gameOverContainer = null;
            }
            
            console.log("[FADE CONTROLLER] Fade-in started. Current alpha:", overlayAlpha);
        } else if (fadingIn) {
            console.log("[FADE CONTROLLER] Fade-in already in progress.");
        }
    }

    // Update the overlay every frame (using PIXI ticker)
    pixiApp.ticker.add(() => {
        if (fadingIn) {
            overlayAlpha += fadeInSpeed;
            
            // Si alcanzamos o excedemos la opacidad objetivo (0.7)
            if (overlayAlpha >= targetAlpha) {
                overlayAlpha = targetAlpha;
                fadingIn = false; // Detener la atenuación
                console.log(`[FADE CONTROLLER] Fade-in finished at ${targetAlpha * 100}%.`);
                
                // *** LLAMADA CRÍTICA: Mostrar la UI de Game Over ***
                createGameOverUI();
                
                // Asegúrate de que la UI de Game Over esté *encima* del overlay
                if (gameOverContainer) {
                    pixiApp.stage.setChildIndex(gameOverContainer, pixiApp.stage.children.length - 1);
                }
            }
            
            overlay.alpha = overlayAlpha;
        }
    });

    // Execute initial size update
    updateOverlaySize();
    
    // Expose the function globally
    window.startScreenFadeIn = startFadeIn;

})();
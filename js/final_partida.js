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

    // Create a black overlay layer covering the whole screen
    const overlay = new PIXI.Graphics();
    
    // Initial configuration
    overlay.alpha = 0; // Initially invisible (alpha 0)
    overlay.position.set(0, 0); 
    
    // Add the layer to the application stage.
    // By adding it here, it will be in the base children list.
    pixiApp.stage.addChild(overlay); 

    let overlayAlpha = 0;
    const fadeInSpeed = 0.01; // fade speed
    const targetAlpha = 0.7; // target opacity
    let fadingIn = false; // flag to control the fade

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
    }

    // Listen to the PIXI renderer resize event
    pixiApp.renderer.on('resize', updateOverlaySize);

    // Function to start the fade
    function startFadeIn() {
        // Only start if not already fading or at the target
        if (!fadingIn && overlayAlpha < targetAlpha) {
            fadingIn = true;
            console.log("[FADE CONTROLLER] Fade-in started. Current alpha:", overlayAlpha);
            // Ensure the overlay is always on top (highest z-index)
            // This is CRITICAL if other graphics are added after the overlay.
            pixiApp.stage.setChildIndex(overlay, pixiApp.stage.children.length - 1);
        } else if (fadingIn) {
             console.log("[FADE CONTROLLER] Fade-in already in progress.");
        }
    }

    // Update the overlay every frame (using PIXI ticker)
    pixiApp.ticker.add(() => {
        if (fadingIn) {
            overlayAlpha += fadeInSpeed;
            
            // If we reach or exceed the target opacity (0.7)
            if (overlayAlpha >= targetAlpha) {
                overlayAlpha = targetAlpha;
                fadingIn = false; // Stop the fade
                console.log(`[FADE CONTROLLER] Fade-in finished at ${targetAlpha * 100}%.`);
            }
            
            overlay.alpha = overlayAlpha;
        }
    });

    // Execute initial size update
    updateOverlaySize();
    
    // Expose the function globally
    window.startScreenFadeIn = startFadeIn;

})();
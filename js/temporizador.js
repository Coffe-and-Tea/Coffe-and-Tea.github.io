// temporizador.js

const tiempo_inicial = 60; // segundos iniciales
let timeLeft = tiempo_inicial;
let timerInterval = null;

// Formatea segundos a HH:MM:SS
function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Crear y agregar el div del temporizador (usa la clase .timer-text en el CSS)
const timerDiv = document.createElement('div');
timerDiv.className = 'timer-text';
timerDiv.style.position = 'fixed';
timerDiv.style.top = '20px';
timerDiv.style.left = '50%';
timerDiv.style.transform = 'translateX(-50%)'; 
timerDiv.style.zIndex = '1000';
timerDiv.textContent = formatTime(timeLeft);
document.body.appendChild(timerDiv);

// Actualiza el display del temporizador
function updateDisplay() {
    timerDiv.textContent = formatTime(timeLeft);
    if (timeLeft <= 30 && timeLeft > 0) {
        // Parpadeo: alternamos la clase warning para permitir animación CSS si se desea
        timerDiv.classList.toggle('warning');
    } else if (timeLeft === 0) {
        timerDiv.classList.add('warning');
    }
}

// Lógica que corre cada segundo
function tick() {
    if (timeLeft <= 0) {
        clearInterval(timerInterval);
        timerInterval = null;
        timerDiv.textContent = formatTime(0);
        timerDiv.classList.add('warning');
        
        // =========================================================
        // AÑADIDO: INICIAR EL DESVANECIMIENTO DE LA PANTALLA
        if (typeof window.startScreenFadeIn === 'function') {
            window.startScreenFadeIn();
            console.log("Temporizador finalizado. Iniciando desvanecimiento de pantalla.");
        }
        // =========================================================
        
        // Convertir un tercio de las ovejas blancas a negras una sola vez cuando finaliza el temporizador
        if (!window.sheepConvertedByTimer && typeof window.convertFractionWhiteToBlack === 'function') {
            window.sheepConvertedByTimer = true;
            // convertir 1/3
            window.convertFractionWhiteToBlack(1/3);
        }
        return;
    }
    timeLeft--;
    updateDisplay();
}

// Inicia o reinicia el temporizador
function startTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    timeLeft = tiempo_inicial;
    // permitir que la conversión ocurra de nuevo en futuros reinicios
    window.sheepConvertedByTimer = false;
    updateDisplay();
    timerInterval = setInterval(tick, 1000);
}

// Iniciar automáticamente al cargar el script
startTimer();
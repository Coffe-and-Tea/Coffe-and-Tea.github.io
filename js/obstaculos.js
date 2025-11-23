// registra obstáculos y resuelve colisiones círculo-rectángulo
const ObstacleManager = (function () {
  const obstacles = [];

  // opciones: { padding, allowPassBehind: bool, passThreshold: 0..1 }
  function addRectObstacle(sprite, padding = 0, options = {}) {
    if (!sprite) return null;
    // Aseguramos que el sprite tenga position y dimensiones
    const rect = {
      sprite,
      padding: padding,
      allowPassBehind: !!options.allowPassBehind,
      passThreshold:
        typeof options.passThreshold === "number"
          ? options.passThreshold
          : 0.66,
    };
    obstacles.push(rect);
    return rect;
  }

  // Devuelve el rect (world) dado un obstacle entry
  function getRect(o) {
    const x =
      o.sprite.x - (o.sprite.anchor ? o.sprite.anchor.x * o.sprite.width : 0);
    const y =
      o.sprite.y - (o.sprite.anchor ? o.sprite.anchor.y * o.sprite.height : 0);
    return {
      left: x - o.padding,
      top: y - o.padding,
      right: x + o.sprite.width + o.padding,
      bottom: y + o.sprite.height + o.padding,
    };
  }

  // resuelve colisión de un punto circular contra todos los obstáculos;  point: {x,y} (pasado por referencia) y radius: número
  function resolvePoint(point, radius = 12) {
    if (!point) return;
    for (let o of obstacles) {
      const r = getRect(o);
      // Si este obstáculo permite pasar por detrás y el punto está suficientemente abajo permitimos la entrada.
      const height = r.bottom - r.top || 1;
      const frac = (point.y - r.top) / height;
      if (o.allowPassBehind && frac >= (o.passThreshold || 0.66)) {
        // No resolver colisión: se permite pasar por la parte trasera
        continue;
      }
      // Encontrar el punto más cercano del rectángulo al centro del círculo
      const closestX = Math.max(r.left, Math.min(point.x, r.right));
      const closestY = Math.max(r.top, Math.min(point.y, r.bottom));
      const dx = point.x - closestX;
      const dy = point.y - closestY;
      const distSq = dx * dx + dy * dy;
      if (distSq < radius * radius) {
        const dist = Math.sqrt(distSq) || 0.0001;
        const overlap = radius - dist + 0.5;
        const ux = dx / dist;
        const uy = dy / dist;
        // Si el centro está exactamente dentro del rect (dist muy pequeño), empujamos en dirección opuesta al centro del rect
        if (!isFinite(ux) || !isFinite(uy)) {
          // escoger vector desde centro del rect hacia fuera
          const cx = (r.left + r.right) / 2;
          const cy = (r.top + r.bottom) / 2;
          const ddx = point.x - cx || 0.1;
          const ddy = point.y - cy || 0.1;
          const dlen = Math.sqrt(ddx * ddx + ddy * ddy) || 0.0001;
          point.x += (ddx / dlen) * overlap;
          point.y += (ddy / dlen) * overlap;
        } else {
          point.x += ux * overlap;
          point.y += uy * overlap;
        }
      }
    }
  }

  function isPointBlocked(point, radius = 12) {
    if (!point) return false;
    for (let o of obstacles) {
      const r = getRect(o);
      const height = r.bottom - r.top || 1;
      const frac = (point.y - r.top) / height;
      if (o.allowPassBehind && frac >= (o.passThreshold || 0.66)) continue;
      const closestX = Math.max(r.left, Math.min(point.x, r.right));
      const closestY = Math.max(r.top, Math.min(point.y, r.bottom));
      const dx = point.x - closestX;
      const dy = point.y - closestY;
      if (dx * dx + dy * dy < radius * radius) return true;
    }
    return false;
  }

  // registrar obstáculos pendientes si existen (pushed por juego.js antes de que este archivo cargue)
  function registerPending() {
    try {
      const pending = window.pendingObstacles || window._pendingObstacles;
      if (Array.isArray(pending)) {
        for (let p of pending) {
          addRectObstacle(p.sprite, p.padding || 0, p.options || {});
        }
        window.pendingObstacles = []; // limpiamos la lista para evitar duplicados si se vuelve a ejecutar
      }
    } catch (e) {
      console.warn("No se pudo registrar pendingObstacles:", e);
    }
  }

  // Ejecutar registro una vez que el manager exista
  registerPending();

  return {
    addRectObstacle,
    resolvePoint,
    isPointBlocked,
    _internal: { obstacles, getRect },
  };
})();

// Exponer globalmente por facilidad
window.ObstacleManager = ObstacleManager;

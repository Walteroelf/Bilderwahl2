/*
  Feier-Animationen nach einer richtigen Antwort.

  Alles wird auf einer eigenen, durchsichtigen Ebene über dem ganzen
  Bildschirm gezeichnet (Canvas) – mit Schwerkraft, Luftwiderstand und
  Flattern, damit es weich und lebendig wirkt. Die Ebene fängt keine
  Berührungen ab.

  createCelebration(element, art, ruhig)
    element: Ausgangspunkt (z. B. das richtige Bild)
    art:     "confetti", "stars", "balloons", "hearts", "flowers", "fireworks"
             (ältere Namen wie "ribbons" oder "sparkles" werden zugeordnet)
    ruhig:   nur ein kurzes, sanftes Funkeln
*/

const CELEBRATION_COLORS = ["#ff5c8a", "#ffb703", "#3dd598", "#4cc9f0", "#7b61ff", "#ff8a3d"];

const CELEBRATION_ALIASES = {
  confetti: "confetti",
  ribbons: "confetti",
  circles: "confetti",
  stars: "stars",
  sparkles: "stars",
  diamonds: "stars",
  balloons: "balloons",
  hearts: "hearts",
  flowers: "flowers",
  smileys: "fireworks",
  fireworks: "fireworks"
};

const celebrationCanvas = document.createElement("canvas");
celebrationCanvas.className = "celebration-layer";
celebrationCanvas.setAttribute("aria-hidden", "true");
document.body.appendChild(celebrationCanvas);

const celebrationContext = celebrationCanvas.getContext("2d");

let celebrationParticles = [];
let celebrationTimers = new Set();
let celebrationFrame = null;
let celebrationWidth = 0;
let celebrationHeight = 0;

function resizeCelebrationLayer() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  celebrationWidth = window.innerWidth;
  celebrationHeight = window.innerHeight;
  celebrationCanvas.width = Math.round(celebrationWidth * dpr);
  celebrationCanvas.height = Math.round(celebrationHeight * dpr);
  celebrationContext.setTransform(dpr, 0, 0, dpr, 0, 0);
}

window.addEventListener("resize", resizeCelebrationLayer);
resizeCelebrationLayer();

function createCelebration(element, type, calm) {
  stopCelebration();
  resizeCelebrationLayer();

  const origin = getCelebrationOrigin(element);
  const reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (calm || reducedMotion) {
    starBurst(origin, 10, 0.6);
  } else {
    const effect = CELEBRATION_ALIASES[type] || "confetti";

    if (effect === "confetti") confettiCannons();
    if (effect === "stars") starBurst(origin, 28, 1);
    if (effect === "balloons") balloons();
    if (effect === "hearts") hearts(origin);
    if (effect === "flowers") petals();
    if (effect === "fireworks") fireworks();
  }

  startCelebrationLoop();
}

function stopCelebration() {
  celebrationTimers.forEach(timer => clearTimeout(timer));
  celebrationTimers.clear();
  celebrationParticles = [];
  celebrationContext.clearRect(0, 0, celebrationWidth, celebrationHeight);
}

function startCelebrationLoop() {
  if (!celebrationFrame) celebrationFrame = requestAnimationFrame(drawCelebration);
}

function getCelebrationOrigin(element) {
  const rect = element && element.getBoundingClientRect ? element.getBoundingClientRect() : null;

  if (!rect || rect.width === 0) {
    return { x: celebrationWidth / 2, y: celebrationHeight / 2 };
  }

  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

function random(min, max) {
  return min + Math.random() * (max - min);
}

function pickColor() {
  return CELEBRATION_COLORS[Math.floor(Math.random() * CELEBRATION_COLORS.length)];
}

// Zeitversetzt Teilchen hinzufügen (z. B. Luftballons nacheinander)
function later(milliseconds, action) {
  const timer = setTimeout(() => {
    celebrationTimers.delete(timer);
    action();
    startCelebrationLoop();
  }, milliseconds);

  celebrationTimers.add(timer);
}

// Größere Bildschirme bekommen etwas schnellere Teilchen
function speedScale() {
  return Math.max(0.8, Math.min(1.6, celebrationHeight / 800));
}

/* ---------- Effekte ---------- */

// Zwei Konfetti-Kanonen schießen von unten links und unten rechts nach oben
function confettiCannons() {
  const scale = speedScale();

  [true, false].forEach(fromLeft => {
    for (let i = 0; i < 110; i++) {
      const angle = ((fromLeft ? -60 : -120) + random(-16, 16)) * Math.PI / 180;
      const speed = random(16, 27) * scale;

      celebrationParticles.push({
        kind: "confetti",
        x: fromLeft ? -10 : celebrationWidth + 10,
        y: celebrationHeight * 0.92,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        gravity: 0.3 * scale,
        drag: 0.982,
        rotation: random(0, Math.PI * 2),
        spin: random(-0.2, 0.2),
        flip: random(0, Math.PI * 2),
        flipSpeed: random(0.08, 0.22),
        width: random(10, 16),
        height: random(6, 10),
        round: Math.random() < 0.25,
        color: pickColor(),
        life: 0,
        maxLife: random(150, 200)
      });
    }
  });
}

// Goldene Sterne springen vom Bild nach außen und funkeln
function starBurst(origin, count, strength) {
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + random(-0.2, 0.2);
    const speed = random(7, 15) * strength * speedScale();

    celebrationParticles.push({
      kind: "star",
      x: origin.x,
      y: origin.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      gravity: 0.08,
      drag: 0.945,
      rotation: random(0, Math.PI),
      spin: random(-0.08, 0.08),
      size: random(13, 26) * (0.6 + strength * 0.4),
      color: ["#ffd166", "#ffb703", "#ffe066", "#ffc43d"][i % 4],
      life: 0,
      maxLife: random(70, 95)
    });

    // Kleine helle Funken dazwischen
    const sparkAngle = random(0, Math.PI * 2);
    const sparkSpeed = random(3, 9) * strength * speedScale();

    celebrationParticles.push({
      kind: "spark",
      x: origin.x,
      y: origin.y,
      vx: Math.cos(sparkAngle) * sparkSpeed,
      vy: Math.sin(sparkAngle) * sparkSpeed,
      gravity: 0.02,
      drag: 0.92,
      size: random(1.8, 3.2),
      color: "#ffe9a8",
      life: 0,
      maxLife: random(35, 55)
    });
  }
}

// Bunte Luftballons steigen von unten auf und schwingen leicht
function balloons() {
  const count = celebrationWidth < 600 ? 7 : 11;

  for (let i = 0; i < count; i++) {
    later(i * 120, () => {
      celebrationParticles.push({
        kind: "balloon",
        x: celebrationWidth * ((i + 0.5) / count) + random(-30, 30),
        y: celebrationHeight + random(40, 120),
        vy: -random(2.4, 3.6) * speedScale(),
        swayPhase: random(0, Math.PI * 2),
        swaySpeed: random(0.02, 0.04),
        size: random(34, 50) * Math.min(1.3, speedScale()),
        color: CELEBRATION_COLORS[i % CELEBRATION_COLORS.length],
        life: 0,
        maxLife: 600
      });
    });
  }
}

// Herzen steigen vom Bild auf
function hearts(origin) {
  const spread = Math.min(celebrationWidth * 0.25, 160);

  for (let i = 0; i < 26; i++) {
    later(i * 50, () => {
      celebrationParticles.push({
        kind: "heart",
        x: origin.x + random(-spread, spread),
        y: origin.y + random(0, 60),
        vx: random(-1.2, 1.2),
        vy: -random(3, 5.5) * speedScale(),
        gravity: -0.01,
        drag: 0.99,
        swayPhase: random(0, Math.PI * 2),
        size: random(26, 46),
        color: ["#ff5c8a", "#ff8fab", "#e63973", "#ff4d6d"][i % 4],
        life: 0,
        maxLife: random(110, 150)
      });
    });
  }
}

// Kleine Blüten schweben von oben herab und drehen sich
function petals() {
  const count = celebrationWidth < 600 ? 30 : 48;

  for (let i = 0; i < count; i++) {
    celebrationParticles.push({
      kind: "petal",
      x: random(0, celebrationWidth),
      y: random(-celebrationHeight * 0.4, -20),
      vx: random(-0.6, 0.6),
      vy: random(2.6, 4.4) * speedScale(),
      swayPhase: random(0, Math.PI * 2),
      swaySpeed: random(0.03, 0.06),
      rotation: random(0, Math.PI * 2),
      spin: random(-0.06, 0.06),
      size: random(9, 16),
      color: ["#ff5c8a", "#ff8fab", "#c77dff", "#ff8a3d", "#4cc9f0"][i % 5],
      life: 0,
      maxLife: 500
    });
  }
}

// Drei Raketen steigen auf und zerplatzen in Funkenringe
function fireworks() {
  const scale = speedScale();
  const count = 3;

  for (let i = 0; i < count; i++) {
    later(i * 380, () => {
      const targetY = celebrationHeight * random(0.18, 0.38);
      const gravity = 0.18 * scale;

      celebrationParticles.push({
        kind: "rocket",
        x: celebrationWidth * ((i + 0.5) / count) + random(-40, 40),
        y: celebrationHeight,
        vx: random(-0.6, 0.6),
        // so schnell, dass die Rakete genau bei targetY zum Stehen käme
        vy: -Math.sqrt(2 * gravity * (celebrationHeight - targetY)),
        gravity: gravity,
        color: CELEBRATION_COLORS[(i * 2) % CELEBRATION_COLORS.length],
        life: 0,
        maxLife: 300
      });
    });
  }
}

// Funkenring einer Rakete; liefert die neuen Teilchen zurück
function explode(x, y, color) {
  const count = 90;
  const scale = speedScale();
  const embers = [];

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const speed = random(4.5, 9.5) * scale;

    embers.push({
      kind: "ember",
      x: x,
      y: y,
      previousX: x,
      previousY: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      gravity: 0.07 * scale,
      drag: 0.962,
      size: random(2.6, 4.2),
      color: i % 5 === 0 ? "#ffe9a8" : color,
      life: 0,
      maxLife: random(70, 100)
    });
  }

  return embers;
}

/* ---------- Zeichnen ---------- */

function drawCelebration() {
  const context = celebrationContext;
  context.clearRect(0, 0, celebrationWidth, celebrationHeight);

  const next = [];

  celebrationParticles.forEach(p => {
    p.life++;
    if (p.life > p.maxLife) return;

    // Ausblenden im letzten Viertel
    const fadeStart = p.maxLife * 0.75;
    const alpha = p.life > fadeStart ? 1 - (p.life - fadeStart) / (p.maxLife - fadeStart) : 1;

    if (p.kind === "rocket") {
      p.vy += p.gravity;
      p.x += p.vx;
      p.y += p.vy;

      // Am höchsten Punkt zerplatzen – die Funken direkt in die neue Liste
      if (p.vy >= -0.5) {
        next.push(...explode(p.x, p.y, p.color));
        return;
      }

      drawGlowDot(context, p.x - p.vx * 2, p.y - p.vy * 2, 2, p.color, 0.6);
      drawGlowDot(context, p.x, p.y, 3, "#fff6d5", 1);
      next.push(p);
      return;
    }

    if (p.kind === "balloon") {
      p.swayPhase += p.swaySpeed;
      p.x += Math.sin(p.swayPhase) * 0.8;
      p.y += p.vy;

      if (p.y < -p.size * 4) return;

      drawBalloon(context, p);
      next.push(p);
      return;
    }

    if (p.kind === "petal") {
      p.swayPhase += p.swaySpeed;
      p.x += p.vx + Math.sin(p.swayPhase) * 1.2;
      p.y += p.vy;
      p.rotation += p.spin;

      if (p.y > celebrationHeight + 20) return;

      drawBlossom(context, p, alpha);
      next.push(p);
      return;
    }

    // Alle übrigen Teilchen: Schwerkraft und Luftwiderstand
    if (p.kind === "ember") {
      p.previousX = p.x;
      p.previousY = p.y;
    }

    p.vx *= p.drag || 1;
    p.vy = p.vy * (p.drag || 1) + (p.gravity || 0);
    p.x += p.vx;
    p.y += p.vy;

    if (p.kind === "confetti") {
      if (p.y > celebrationHeight + 30) return;

      p.rotation += p.spin;
      p.flip += p.flipSpeed;

      context.save();
      context.globalAlpha = alpha;
      context.translate(p.x, p.y);
      context.rotate(p.rotation);
      // Flattern: das Teilchen dreht sich um seine Längsachse
      context.scale(1, Math.cos(p.flip));
      context.fillStyle = p.color;

      if (p.round) {
        context.beginPath();
        context.arc(0, 0, p.height * 0.8, 0, Math.PI * 2);
        context.fill();
      } else {
        context.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
      }

      context.restore();
    }

    if (p.kind === "star") {
      p.rotation += p.spin;
      const pulse = 0.85 + Math.sin(p.life * 0.35) * 0.15;
      drawStar(context, p.x, p.y, p.size * pulse, p.rotation, p.color, alpha);
    }

    if (p.kind === "spark") {
      drawGlowDot(context, p.x, p.y, p.size, p.color, alpha);
    }

    if (p.kind === "heart") {
      p.swayPhase += 0.08;
      p.x += Math.sin(p.swayPhase) * 0.6;
      drawHeart(context, p.x, p.y, p.size, p.color, alpha);
    }

    if (p.kind === "ember") {
      context.save();
      context.globalAlpha = alpha;
      context.strokeStyle = p.color;
      context.lineWidth = p.size;
      context.lineCap = "round";
      context.shadowColor = p.color;
      context.shadowBlur = 10;
      context.beginPath();
      context.moveTo(p.previousX - p.vx * 3, p.previousY - p.vy * 3);
      context.lineTo(p.x, p.y);
      context.stroke();
      context.restore();
    }

    next.push(p);
  });

  celebrationParticles = next;

  if (celebrationParticles.length > 0) {
    celebrationFrame = requestAnimationFrame(drawCelebration);
  } else {
    celebrationFrame = null;
  }
}

function drawGlowDot(context, x, y, radius, color, alpha) {
  context.save();
  context.globalAlpha = alpha;
  context.fillStyle = color;
  context.shadowColor = color;
  context.shadowBlur = radius * 4;
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function drawStar(context, x, y, size, rotation, color, alpha) {
  context.save();
  context.globalAlpha = alpha;
  context.translate(x, y);
  context.rotate(rotation);
  context.fillStyle = color;
  context.shadowColor = "#ffcf33";
  context.shadowBlur = size * 0.8;
  context.beginPath();

  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? size : size * 0.45;
    const angle = (i / 10) * Math.PI * 2 - Math.PI / 2;
    context.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
  }

  context.closePath();
  context.fill();

  // Goldener Rand, damit die Sterne auch auf Weiß gut sichtbar sind
  context.shadowBlur = 0;
  context.strokeStyle = "#e09200";
  context.lineWidth = Math.max(1, size * 0.08);
  context.lineJoin = "round";
  context.stroke();
  context.restore();
}

// Blüte: fünf Blütenblätter um eine gelbe Mitte, kippt beim Fallen leicht
function drawBlossom(context, p, alpha) {
  context.save();
  context.globalAlpha = alpha;
  context.translate(p.x, p.y);
  context.rotate(p.rotation);
  context.scale(1, Math.abs(Math.cos(p.swayPhase)) * 0.4 + 0.6);
  context.fillStyle = p.color;

  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2;
    context.beginPath();
    context.ellipse(Math.cos(angle) * p.size * 0.55, Math.sin(angle) * p.size * 0.55,
      p.size * 0.5, p.size * 0.32, angle, 0, Math.PI * 2);
    context.fill();
  }

  context.fillStyle = "#ffd166";
  context.beginPath();
  context.arc(0, 0, p.size * 0.3, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function drawHeart(context, x, y, size, color, alpha) {
  context.save();
  context.globalAlpha = alpha;
  context.translate(x, y);
  context.scale(size / 28, size / 28);
  context.fillStyle = color;
  context.shadowColor = "rgba(230, 57, 115, 0.45)";
  context.shadowBlur = 10;
  context.beginPath();
  context.moveTo(0, 6);
  context.bezierCurveTo(-14, -4, -8, -16, 0, -8);
  context.bezierCurveTo(8, -16, 14, -4, 0, 6);
  context.fill();
  context.restore();
}

function drawBalloon(context, p) {
  const radiusX = p.size * 0.82;
  const radiusY = p.size;

  context.save();
  context.translate(p.x, p.y);

  // Schnur
  context.strokeStyle = "rgba(71, 85, 105, 0.6)";
  context.lineWidth = 1.5;
  context.beginPath();
  context.moveTo(0, radiusY + 6);
  context.quadraticCurveTo(Math.sin(p.swayPhase * 2) * 12, radiusY * 2, 0, radiusY * 3);
  context.stroke();

  // Knoten
  context.fillStyle = p.color;
  context.beginPath();
  context.moveTo(-4, radiusY + 7);
  context.lineTo(4, radiusY + 7);
  context.lineTo(0, radiusY - 1);
  context.closePath();
  context.fill();

  // Ballon mit Glanzlicht
  const gradient = context.createRadialGradient(-radiusX * 0.35, -radiusY * 0.4, radiusX * 0.1, 0, 0, radiusY * 1.1);
  gradient.addColorStop(0, "rgba(255, 255, 255, 0.85)");
  gradient.addColorStop(0.25, p.color);
  gradient.addColorStop(1, p.color);

  context.fillStyle = gradient;
  context.beginPath();
  context.ellipse(0, 0, radiusX, radiusY, 0, 0, Math.PI * 2);
  context.fill();

  context.restore();
}

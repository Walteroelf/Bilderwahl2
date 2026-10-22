/*
  Übung "Freirubbeln" (nach dem Foto-Radierer): Das Bild liegt im Vollbild
  unter einer roten Fläche, das Kind rubbelt sie mit dem Finger weg.
  Vor der ersten Berührung zeigt eine bewegte Hand, wie es geht.
  Ist etwa die Hälfte frei, fragt die App "Was ist das?" (raten, benennen),
  ab der eingestellten Schwelle erscheint das ganze Bild und die App nennt das Wort.
  Ohne Lernstand – die App weiß nicht, ob das Kind das Wort richtig gesagt hat,
  deshalb gibt es beim Aufdecken kein "Richtig!", sondern nur "Geschafft!".
*/

const SCRATCH_ROUND = 6;
// Stiftgröße: Anteil der kürzeren Bildschirmseite und Mindestgröße in Pixeln
const SCRATCH_BRUSHES = {
  klein: { share: 0.035, min: 14 },
  mittel: { share: 0.06, min: 22 },
  gross: { share: 0.09, min: 32 }
};
const SCRATCH_COLOR = "#e00000";

const scratchGame = document.getElementById("scratchGame");
const scratchArea = document.getElementById("scratchArea");
const scratchImage = document.getElementById("scratchImage");
const scratchCanvas = document.getElementById("scratchCanvas");
const scratchHand = document.getElementById("scratchHand");
const scratchContext = scratchCanvas.getContext("2d");

const scratchPointers = new Map();
let scratchRadius = 24;
let scratchAsked = false;
let scratchRevealed = false;
let scratchCheckTimer = null;

const scratchExercise = {
  container: scratchGame,

  restart(set, words) {
    startScratchGame(set, words);
  },

  start() {
    scratchImage.removeAttribute("src");
    document.body.classList.add("scratch-mode");
  },

  // Am Ende der Runde das Vollbild schließen, damit die Auswertung sichtbar ist
  finish() {
    document.body.classList.remove("scratch-mode");
    scratchGame.classList.add("hidden");
  },

  showItem(item) {
    scratchAsked = false;
    scratchRevealed = false;
    scratchPointers.clear();

    instruction.textContent = "Rubbel das Bild frei!";

    // Erst die Fläche zeichnen, dann das Bild setzen – so blitzt es nicht kurz auf
    scratchCanvas.classList.remove("hidden");
    scratchHand.classList.remove("hidden");
    coverScratchArea();
    scratchImage.src = item.url;

    setTimeout(() => this.repeat(), 400);
  },

  repeat() {
    const item = session.current;
    if (!item) return;

    if (scratchRevealed) {
      speak(buildModelSentence(item));
    } else if (scratchAsked) {
      speak("Was ist das?");
    } else {
      speak("Rubbel das Bild frei!");
    }
  },

  stop() {
    document.body.classList.remove("scratch-mode");
    clearTimeout(scratchCheckTimer);
    scratchPointers.clear();
    scratchImage.removeAttribute("src");
  }
};

function startScratchGame(set, words) {
  const limit = Math.min(getRoundLength() || SCRATCH_ROUND, SCRATCH_ROUND);
  return startSession(scratchExercise, set, words, { statPrefix: false, words: words, limit: limit });
}

function coverScratchArea() {
  const rect = scratchArea.getBoundingClientRect();
  if (rect.width === 0) return;

  // Begrenzte Pixeldichte für flüssiges Rubbeln auf dem iPad
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

  scratchCanvas.width = Math.round(rect.width * dpr);
  scratchCanvas.height = Math.round(rect.height * dpr);
  scratchContext.setTransform(dpr, 0, 0, dpr, 0, 0);

  scratchContext.globalCompositeOperation = "source-over";
  scratchContext.fillStyle = SCRATCH_COLOR;
  scratchContext.fillRect(0, 0, rect.width, rect.height);

  const brush = SCRATCH_BRUSHES[settings.scratchBrush] || SCRATCH_BRUSHES.mittel;
  scratchRadius = Math.max(brush.min, Math.min(rect.width, rect.height) * brush.share);
}

function scratchAt(x, y) {
  const context = scratchContext;
  context.save();
  context.globalCompositeOperation = "destination-out";

  // Weicher Rand wie beim Foto-Radierer
  const gradient = context.createRadialGradient(x, y, scratchRadius * 0.2, x, y, scratchRadius);
  gradient.addColorStop(0, "rgba(0, 0, 0, 1)");
  gradient.addColorStop(0.72, "rgba(0, 0, 0, 0.9)");
  gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

  context.fillStyle = gradient;
  context.beginPath();
  context.arc(x, y, scratchRadius, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function scratchLine(from, to) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / Math.max(2.5, scratchRadius * 0.28)));

  for (let i = 0; i <= steps; i++) {
    scratchAt(from.x + dx * i / steps, from.y + dy * i / steps);
  }
}

function getScratchPosition(event) {
  const rect = scratchCanvas.getBoundingClientRect();
  return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}

scratchCanvas.addEventListener("pointerdown", event => {
  event.preventDefault();
  if (scratchRevealed || !session.current) return;

  // Sobald das Kind selbst rubbelt, verschwindet die Hand
  scratchHand.classList.add("hidden");

  const position = getScratchPosition(event);
  scratchPointers.set(event.pointerId, position);
  // Kann bei ungewöhnlichen Eingabegeräten fehlschlagen – dann ohne weiter
  try { scratchCanvas.setPointerCapture(event.pointerId); } catch (error) { /* weiter ohne */ }

  scratchAt(position.x, position.y);
  scheduleScratchCheck();
});

scratchCanvas.addEventListener("pointermove", event => {
  event.preventDefault();

  const previous = scratchPointers.get(event.pointerId);
  if (!previous || scratchRevealed) return;

  // Mehrere Zwischenpunkte pro Bewegung (flüssige Linien auf dem iPad)
  const coalesced = event.getCoalescedEvents ? event.getCoalescedEvents() : [];
  const events = coalesced.length > 0 ? coalesced : [event];
  let last = previous;

  events.forEach(single => {
    const position = getScratchPosition(single);
    scratchLine(last, position);
    last = position;
  });

  scratchPointers.set(event.pointerId, last);
  scheduleScratchCheck();
});

["pointerup", "pointercancel"].forEach(type => {
  scratchCanvas.addEventListener(type, event => scratchPointers.delete(event.pointerId));
});

function scheduleScratchCheck() {
  clearTimeout(scratchCheckTimer);
  scratchCheckTimer = setTimeout(checkScratchProgress, 180);
}

function getScratchProgress() {
  if (scratchCanvas.width === 0) return 0;

  const pixels = scratchContext.getImageData(0, 0, scratchCanvas.width, scratchCanvas.height).data;
  const step = 16;
  let checked = 0;
  let cleared = 0;

  for (let i = 3; i < pixels.length; i += 4 * step) {
    checked++;
    if (pixels[i] < 128) cleared++;
  }

  return cleared / checked;
}

function checkScratchProgress() {
  if (scratchRevealed || !session.current) return;

  const progress = getScratchProgress();

  const revealAt = Number(settings.scratchReveal) || 0.8;

  // Die Frage kommt etwa bei der Hälfte, bei niedriger Schwelle entsprechend früher
  const askAt = Math.min(0.45, revealAt - 0.2);

  if (progress >= revealAt) {
    revealScratchImage();
    return;
  }

  if (!scratchAsked && progress >= askAt) {
    scratchAsked = true;
    instruction.textContent = "Was ist das?";
    speak("Was ist das?");
  }
}

function revealScratchImage() {
  const item = session.current;
  if (!item || scratchRevealed) return;

  scratchRevealed = true;
  scratchPointers.clear();
  scratchContext.clearRect(0, 0, scratchCanvas.width, scratchCanvas.height);
  scratchCanvas.classList.add("hidden");
  scratchHand.classList.add("hidden");

  // Kein Lob für die Antwort: ob das Wort richtig gesagt wurde, weiß die App nicht.
  // "Geschafft!" bezieht sich auf das Freirubbeln, danach das Wort als Modell.
  instruction.textContent = "Geschafft!";
  showAnswerWord(item);

  speak("Geschafft! " + buildModelSentence(item));
  createCelebration(scratchArea, "confetti", settings.calm);

  setTimeout(() => {
    nextButton.classList.remove("hidden");
    settingsButton.classList.remove("hidden");
  }, 1200);
}

window.addEventListener("resize", () => {
  if (session.game === scratchExercise && !scratchRevealed) {
    setTimeout(coverScratchArea, 150);
  }
});

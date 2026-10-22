/*
  Übung "Memory": Bildpaare finden. Jede aufgedeckte Karte nennt ihr Wort,
  so hört das Kind die Wörter immer wieder. Ohne Lernstand.
*/

const MEMORY_PAIRS = 6;

const memoryGame = document.getElementById("memoryGame");
const memoryGrid = document.getElementById("memoryGrid");

let memoryOpen = [];
let memoryBusy = false;
let memoryFound = 0;
let memoryPairs = 0;
let memoryTries = 0;

const memoryExercise = {
  container: memoryGame,
  continuous: true,

  restart(set, words) {
    startMemoryGame(set, words);
  },

  start() {
    // Kein "Noch einmal hören" – jede Karte spricht beim Aufdecken
    repeatButton.classList.add("hidden");

    memoryOpen = [];
    memoryBusy = false;
    memoryFound = 0;
    memoryTries = 0;
    memoryPairs = session.queue.length;

    // Alle Paare liegen gleichzeitig aus – die Runde besteht aus einem "Durchgang"
    const cards = shuffle([...session.queue, ...session.queue]);
    session.queue = [];

    memoryGrid.innerHTML = "";
    memoryGrid.style.setProperty("--memory-columns", memoryPairs <= 4 ? 4 : memoryPairs <= 6 ? 4 : 5);

    cards.forEach(item => {
      const card = document.createElement("button");
      card.className = "memory-card";
      card.setAttribute("aria-label", "Karte aufdecken");

      const img = document.createElement("img");
      img.src = item.url;
      img.alt = "";

      card.appendChild(img);
      card.addEventListener("click", () => flipMemoryCard(card, item));
      memoryGrid.appendChild(card);
    });

    instruction.textContent = "Finde die Paare!";
  },

  repeat() {},

  stop() {
    memoryGrid.innerHTML = "";
    memoryOpen = [];
  }
};

function startMemoryGame(set, words) {
  return startSession(memoryExercise, set, words, {
    statPrefix: false,
    words: words,
    limit: Math.min(MEMORY_PAIRS, words.length)
  });
}

function flipMemoryCard(card, item) {
  if (memoryBusy || card.classList.contains("open") || card.classList.contains("found")) return;
  if (memoryPairs === 0) return;

  card.classList.add("open");
  memoryOpen.push({ card: card, item: item });

  speak(getDisplayName(item));

  if (memoryOpen.length < 2) return;

  memoryTries++;
  const [first, second] = memoryOpen;

  if (first.item === second.item) {
    memoryOpen = [];
    memoryFound++;

    setTimeout(() => {
      first.card.classList.add("found");
      second.card.classList.add("found");
      createCelebration(second.card, "stars", true);

      if (memoryFound === memoryPairs) {
        setTimeout(() => {
          finishSession("Alle Paare gefunden! " + memoryTries + " Versuche.");
        }, 900);
      }
    }, 500);

    return;
  }

  // Kein Paar: kurz zeigen, dann wieder umdrehen
  memoryBusy = true;

  setTimeout(() => {
    first.card.classList.remove("open");
    second.card.classList.remove("open");
    memoryOpen = [];
    memoryBusy = false;
  }, 1600);
}

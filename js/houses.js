/*
  Aufgabenformat "Artikel-Häuser":
  Ein Bild nach dem anderen wird in das der-, die-, das- oder Mehrzahl-Haus
  gezogen (oder das Haus wird angetippt).
*/

const HOUSE_FORMS = ["der", "die", "das", "pl"];

const houseGame = document.getElementById("houseGame");
const houseStage = document.getElementById("houseStage");
const houseRow = document.getElementById("houseRow");
const houseSummary = document.getElementById("houseSummary");

let houseWords = [];
let houseQueue = [];
let houseCurrent = null;
let houseMistake = false;
let houseLocked = false;
let houseFirstTry = 0;
let houseDone = 0;
let houseSet = null;
let houseSetWords = [];
let houseDrag = null;

function getHouseWords(words) {
  return words.filter(word => HOUSE_FORMS.includes(word.form));
}

function startHouseGame(set, words) {
  unlockAudio();
  stopHouseGame();

  houseSet = set;
  houseSetWords = words;

  houseWords = getHouseWords(words).map(word => ({
    id: word.id,
    noun: word.noun,
    form: word.form,
    audio: word.audio || null,
    url: URL.createObjectURL(word.image)
  }));

  houseQueue = shuffle(houseWords);
  houseFirstTry = 0;
  houseDone = 0;

  showScreen(null);
  setGameMode("houses");

  renderHouses();
  houseSummary.classList.add("hidden");
  houseRow.classList.remove("hidden");

  settingsButton.classList.add("hidden");
  repeatButton.classList.remove("hidden");

  speak("Los geht's.", nextHouseWord);
}

function stopHouseGame() {
  houseWords.forEach(word => URL.revokeObjectURL(word.url));
  houseWords = [];
  houseQueue = [];
  houseCurrent = null;
  houseDrag = null;
  houseStage.innerHTML = "";
  houseRow.innerHTML = "";
}

function renderHouses() {
  houseRow.innerHTML = HOUSE_FORMS.map(form =>
    "<button class=\"house house-" + form + "\" data-form=\"" + form + "\" aria-label=\"" +
    (form === "pl" ? "Mehrzahl" : form) + "-Haus\">" +
    "<span class=\"house-roof\"></span>" +
    "<span class=\"house-body\">" +
    "<span class=\"house-label\">" + (form === "pl" ? "die" : form) + "</span>" +
    (form === "pl" ? "<span class=\"house-sublabel\">Mehrzahl</span>" : "") +
    "<span class=\"house-items\"></span>" +
    "</span>" +
    "</button>"
  ).join("");

  houseRow.querySelectorAll(".house").forEach(house => {
    house.addEventListener("click", () => {
      if (houseDrag && houseDrag.moved) return;
      answerHouse(house.dataset.form);
    });
  });
}

function getHouse(form) {
  return houseRow.querySelector(".house[data-form=\"" + form + "\"]");
}

function nextHouseWord() {
  houseMistake = false;
  houseLocked = false;
  houseRow.querySelectorAll(".house").forEach(house => house.classList.remove("hint", "wrong"));

  if (houseQueue.length === 0) {
    showHouseSummary();
    return;
  }

  houseCurrent = houseQueue.pop();

  houseStage.innerHTML = "";

  const card = document.createElement("div");
  card.className = "house-card";

  const img = document.createElement("img");
  img.src = houseCurrent.url;
  img.alt = houseCurrent.noun;
  img.draggable = false;

  card.appendChild(img);
  houseStage.appendChild(card);

  enableDragging(card);

  instruction.textContent = settings.housesSayArticle
    ? "In welches Haus gehört das Bild?"
    : "Der, die, das – oder Mehrzahl?";

  setTimeout(speakHouseWord, 400);
}

function speakHouseWord() {
  if (!houseCurrent) return;

  // Mit Artikel: das Kind hört "der Schal" und ordnet nach Gehör zu (leichter).
  // Ohne Artikel: das Kind hört nur "Schal" und muss den Artikel wissen.
  if (settings.housesSayArticle) {
    if (settings.recordings && houseCurrent.audio) {
      playRecording(houseCurrent.audio);
    } else {
      speak(getDisplayName(houseCurrent));
    }
  } else {
    speak(houseCurrent.noun);
  }
}

/* ---------- Ziehen mit Finger oder Maus ---------- */

function enableDragging(card) {
  card.addEventListener("pointerdown", event => {
    if (houseLocked) return;

    event.preventDefault();
    card.setPointerCapture(event.pointerId);

    houseDrag = {
      card: card,
      startX: event.clientX,
      startY: event.clientY,
      moved: false
    };

    card.classList.add("dragging");
  });

  card.addEventListener("pointermove", event => {
    if (!houseDrag || houseDrag.card !== card) return;

    const dx = event.clientX - houseDrag.startX;
    const dy = event.clientY - houseDrag.startY;

    if (Math.abs(dx) + Math.abs(dy) > 6) houseDrag.moved = true;

    card.style.transform = "translate(" + dx + "px, " + dy + "px) scale(0.85)";

    const house = getHouseAt(event.clientX, event.clientY);
    houseRow.querySelectorAll(".house").forEach(element => {
      element.classList.toggle("drop-target", element === house);
    });
  });

  const endDrag = event => {
    if (!houseDrag || houseDrag.card !== card) return;

    const house = houseDrag.moved ? getHouseAt(event.clientX, event.clientY) : null;

    card.classList.remove("dragging");
    card.style.transform = "";
    houseRow.querySelectorAll(".house").forEach(element => element.classList.remove("drop-target"));

    // Kurz warten, damit ein Klick auf das Haus nicht doppelt zählt
    setTimeout(() => { houseDrag = null; }, 0);

    if (house) answerHouse(house.dataset.form);
  };

  card.addEventListener("pointerup", endDrag);
  card.addEventListener("pointercancel", endDrag);
}

function getHouseAt(x, y) {
  return [...houseRow.querySelectorAll(".house")].find(house => {
    const rect = house.getBoundingClientRect();
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
  }) || null;
}

/* ---------- Antwort prüfen ---------- */

function answerHouse(form) {
  if (!houseCurrent || houseLocked) return;

  const house = getHouse(form);

  if (form === houseCurrent.form) {
    houseLocked = true;
    houseDone++;
    if (!houseMistake) houseFirstTry++;

    recordResult("artikel:" + houseCurrent.id, !houseMistake).catch(() => {});

    // Bild wandert klein ins Haus
    const thumb = document.createElement("img");
    thumb.src = houseCurrent.url;
    thumb.alt = getDisplayName(houseCurrent);
    house.querySelector(".house-items").appendChild(thumb);

    house.classList.remove("hint");
    house.classList.add("correct");
    setTimeout(() => house.classList.remove("correct"), 700);

    houseStage.innerHTML = "";

    const text = settings.calm ? "Richtig!" : getRandomItem(correctMessages).text;
    instruction.innerHTML = escapeHtml(text) + " <span class=\"genus-" + houseCurrent.form + "\">" +
      escapeHtml(getDisplayName(houseCurrent)) + "</span>";

    settingsButton.classList.remove("hidden");

    speak(text + " " + getDisplayName(houseCurrent) + ".", () => {
      settingsButton.classList.add("hidden");
      nextHouseWord();
    });

    return;
  }

  houseMistake = true;

  house.classList.add("wrong");
  setTimeout(() => house.classList.remove("wrong"), 600);

  if (settings.errorless) {
    // Hilfe: richtiges Haus zeigen und das Wort mit Artikel vorsprechen
    getHouse(houseCurrent.form).classList.add("hint");

    // Bei der Mehrzahl erklären, warum es nicht das rote die-Haus ist
    const intro = houseCurrent.form === "pl" ? "Das sind mehrere. Es heißt " : "Es heißt ";

    instruction.innerHTML = escapeHtml(intro) + "<span class=\"genus-" + houseCurrent.form + "\">" +
      escapeHtml(getDisplayName(houseCurrent)) + "</span>.";
    speak(intro + getDisplayName(houseCurrent) + ".");
  } else {
    instruction.textContent = settings.calm ? "Noch einmal." : getRandomItem(wrongMessages);
    speak(instruction.textContent, () => {
      if (!houseLocked) speakHouseWord();
    });
  }
}

function showHouseSummary() {
  houseCurrent = null;
  houseStage.innerHTML = "";

  instruction.textContent = "Fertig! Alle Bilder sind in ihren Häusern.";

  houseSummary.innerHTML =
    "<p>Beim ersten Versuch richtig: <strong>" + houseFirstTry + " von " + houseDone + "</strong></p>" +
    "<div class=\"button-row center\">" +
    "<button id=\"houseAgainButton\">Noch einmal</button>" +
    "<button id=\"houseBackButton\" class=\"secondary\">Zurück zu den Wortsets</button>" +
    "</div>";

  houseSummary.classList.remove("hidden");
  repeatButton.classList.add("hidden");

  document.getElementById("houseAgainButton").addEventListener("click", () => startHouseGame(houseSet, houseSetWords));
  document.getElementById("houseBackButton").addEventListener("click", openSettings);

  speak(settings.calm ? "Fertig." : "Super, fertig!");
}

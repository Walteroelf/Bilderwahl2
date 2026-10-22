/*
  Übungen zum Einsortieren – ein Bild nach dem anderen wird in ein Haus gezogen
  (oder das Haus wird angetippt):
  - "Artikel-Häuser": der-, die-, das- oder Mehrzahl-Haus
  - "Sortieren": ein Haus pro ausgewähltem Wortfeld (z. B. Obst / Tiere)
*/

const HOUSE_FORMS = ["der", "die", "das", "pl"];
const FIELD_HOUSE_COLORS = ["#7c3aed", "#0891b2", "#db2777", "#65a30d"];

const houseGame = document.getElementById("houseGame");
const houseStage = document.getElementById("houseStage");
const houseRow = document.getElementById("houseRow");

let sortMode = "articles";
let sortBins = [];
let sortLocked = false;
let sortDrag = null;

function getHouseWords(words) {
  return words.filter(word => HOUSE_FORMS.includes(word.form));
}

const sortExercise = {
  container: houseGame,

  restart(set, words) {
    if (sortMode === "fields") {
      startFieldSortGame(set, words, sortBins);
    } else {
      startHouseGame(set, words);
    }
  },

  start() {
    renderHouses();
  },

  showItem(item) {
    sortLocked = false;
    houseRow.querySelectorAll(".house").forEach(house => house.classList.remove("hint", "wrong"));

    houseStage.innerHTML = "";

    const card = document.createElement("div");
    card.className = "house-card";

    const img = document.createElement("img");
    img.src = item.url;
    img.alt = item.noun;
    img.draggable = false;

    card.appendChild(img);
    houseStage.appendChild(card);

    enableDragging(card);

    if (sortMode === "fields") {
      instruction.textContent = "Wohin gehört das Bild?";
    } else {
      instruction.textContent = settings.housesSayArticle
        ? "In welches Haus gehört das Bild?"
        : "Der, die, das – oder Mehrzahl?";
    }

    setTimeout(() => this.repeat(), 400);
  },

  repeat() {
    const item = session.current;
    if (!item) return;

    // Artikel-Häuser ohne Artikel: das Kind hört nur "Schal" und muss den Artikel wissen
    if (sortMode === "articles" && !settings.housesSayArticle) {
      speak(item.noun);
      return;
    }

    speakQuestion(item, getDisplayName(item));
  },

  stop() {
    sortDrag = null;
    houseStage.innerHTML = "";
    houseRow.innerHTML = "";
  }
};

function startHouseGame(set, words) {
  sortMode = "articles";
  sortBins = HOUSE_FORMS.map(form => ({
    id: form,
    label: form === "pl" ? "die" : form,
    sublabel: form === "pl" ? "Mehrzahl" : "",
    className: "house-" + form,
    ariaLabel: (form === "pl" ? "Mehrzahl" : form) + "-Haus"
  }));

  return startSession(sortExercise, set, words, { statPrefix: "artikel", words: getHouseWords(words) });
}

/*
  Sortieren nach Wortfeldern. fields: [{ id, name }]
  Wörter, die in mehreren der gewählten Wortfelder vorkommen, werden
  ausgelassen – sonst gäbe es zwei richtige Häuser.
*/
function startFieldSortGame(set, words, bins) {
  sortMode = "fields";
  sortBins = bins;

  const counts = {};
  words.forEach(word => {
    const key = (word.form || "") + "|" + word.noun.toLowerCase();
    counts[key] = (counts[key] || 0) + 1;
  });

  const unique = words.filter(word => counts[(word.form || "") + "|" + word.noun.toLowerCase()] === 1);

  return startSession(sortExercise, set, words, { statPrefix: false, words: unique });
}

function buildFieldBins(items) {
  return items.map((item, index) => ({
    id: item.set.id,
    label: item.set.name,
    sublabel: "",
    className: "house-field",
    color: FIELD_HOUSE_COLORS[index % FIELD_HOUSE_COLORS.length],
    ariaLabel: item.set.name
  }));
}

function getItemBin(item) {
  return sortMode === "fields" ? item.setId : item.form;
}

function renderHouses() {
  houseRow.style.setProperty("--houses", sortBins.length);

  houseRow.innerHTML = sortBins.map(bin =>
    "<button class=\"house " + bin.className + "\" data-bin=\"" + escapeHtml(bin.id) + "\" aria-label=\"" + escapeHtml(bin.ariaLabel) + "\"" +
    (bin.color ? " style=\"--house-color: " + bin.color + "\"" : "") + ">" +
    "<span class=\"house-roof\"></span>" +
    "<span class=\"house-body\">" +
    "<span class=\"house-label" + (sortMode === "fields" ? " house-label-small" : "") + "\">" + escapeHtml(bin.label) + "</span>" +
    (bin.sublabel ? "<span class=\"house-sublabel\">" + escapeHtml(bin.sublabel) + "</span>" : "") +
    "<span class=\"house-items\"></span>" +
    "</span>" +
    "</button>"
  ).join("");

  houseRow.querySelectorAll(".house").forEach(house => {
    house.addEventListener("click", () => {
      if (sortDrag && sortDrag.moved) return;
      answerHouse(house.dataset.bin);
    });
  });
}

function getHouse(binId) {
  return [...houseRow.querySelectorAll(".house")].find(house => house.dataset.bin === binId);
}

/* ---------- Ziehen mit Finger oder Maus ---------- */

function enableDragging(card) {
  card.addEventListener("pointerdown", event => {
    if (sortLocked) return;

    event.preventDefault();
    // Kann bei ungewöhnlichen Eingabegeräten fehlschlagen – dann ohne weiter
    try { card.setPointerCapture(event.pointerId); } catch (error) { /* weiter ohne */ }

    sortDrag = {
      card: card,
      startX: event.clientX,
      startY: event.clientY,
      moved: false
    };

    card.classList.add("dragging");
  });

  card.addEventListener("pointermove", event => {
    if (!sortDrag || sortDrag.card !== card) return;

    const dx = event.clientX - sortDrag.startX;
    const dy = event.clientY - sortDrag.startY;

    if (Math.abs(dx) + Math.abs(dy) > 6) sortDrag.moved = true;

    card.style.transform = "translate(" + dx + "px, " + dy + "px) scale(0.85)";

    const house = getHouseAt(event.clientX, event.clientY);
    houseRow.querySelectorAll(".house").forEach(element => {
      element.classList.toggle("drop-target", element === house);
    });
  });

  const endDrag = event => {
    if (!sortDrag || sortDrag.card !== card) return;

    const house = sortDrag.moved ? getHouseAt(event.clientX, event.clientY) : null;

    card.classList.remove("dragging");
    card.style.transform = "";
    houseRow.querySelectorAll(".house").forEach(element => element.classList.remove("drop-target"));

    // Kurz warten, damit ein Klick auf das Haus nicht doppelt zählt
    setTimeout(() => { sortDrag = null; }, 0);

    if (house) answerHouse(house.dataset.bin);
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

function answerHouse(binId) {
  const item = session.current;
  if (!item || sortLocked) return;

  const house = getHouse(binId);
  const correctBin = getItemBin(item);

  if (binId === correctBin) {
    sortLocked = true;
    recordItemResult(!session.mistake);

    // Bild wandert klein ins Haus
    const thumb = document.createElement("img");
    thumb.src = item.url;
    thumb.alt = getDisplayName(item);
    house.querySelector(".house-items").appendChild(thumb);

    house.classList.remove("hint");
    house.classList.add("correct");
    createCelebration(house, "stars", true);
    setTimeout(() => house.classList.remove("correct"), 700);

    houseStage.innerHTML = "";

    const text = pickPraise().text;
    instruction.innerHTML = escapeHtml(text) + " <span class=\"genus-" + item.form + "\">" +
      escapeHtml(getDisplayName(item)) + "</span>";


    speak(text + " " + getDisplayName(item) + ".", () => {
      if (session.current === item) nextItem();
    });

    return;
  }

  session.mistake = true;

  house.classList.add("wrong");
  setTimeout(() => house.classList.remove("wrong"), 600);

  if (settings.errorless) {
    // Hilfe: richtiges Haus zeigen
    getHouse(correctBin).classList.add("hint");

    if (sortMode === "fields") {
      instruction.textContent = "Schau mal, hier!";
      speak("Schau mal. Das gehört hierhin.");
      return;
    }

    // Bei der Mehrzahl erklären, warum es nicht das rote die-Haus ist
    const intro = item.form === "pl" ? "Das sind mehrere. Es heißt " : "Es heißt ";

    instruction.innerHTML = escapeHtml(intro) + "<span class=\"genus-" + item.form + "\">" +
      escapeHtml(getDisplayName(item)) + "</span>.";
    speak(intro + getDisplayName(item) + ".");
  } else {
    instruction.textContent = pickWrongMessage();
    speak(instruction.textContent, () => {
      if (!sortLocked) sortExercise.repeat();
    });
  }
}

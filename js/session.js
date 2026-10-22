/*
  Gemeinsame Rundensteuerung für alle Übungen:
  - wählt die Wörter einer Runde nach dem Lernfach aus (Wiederholung in Abständen)
  - holt ein falsch beantwortetes Wort in derselben Runde noch einmal
  - zeigt am Ende die Auswertung

  Eine Übung ist ein Objekt mit
    container  (Element, das während der Übung sichtbar ist)
    start()    (beginnt die Runde, nachdem session vorbereitet ist)
    showItem(item)
    repeat()   (Knopf "Noch einmal hören")
    stop()     (aufräumen)
    restart(set, words)
    finish()   (optional: wird vor der Auswertung aufgerufen)
    continuous (optional: true = keine Einzelaufgaben, die Übung beendet die Runde selbst)
*/

const gameSummary = document.getElementById("gameSummary");
const gameContainers = () => [...document.querySelectorAll(".game")];

const session = {
  game: null,
  set: null,
  words: [],
  statPrefix: null,
  items: [],
  queue: [],
  current: null,
  mistake: false,
  firstTry: 0,
  done: 0,
  urls: []
};

// Schlüssel im Lernstand: "Bild finden" nutzt aus älteren Versionen die reine Wort-ID
function statKey(prefix, wordId) {
  return prefix ? prefix + ":" + wordId : wordId;
}

// Bilder der Wörter als URLs bereitstellen (werden beim Beenden freigegeben)
function prepareItems(words) {
  return words.map(word => {
    const url = URL.createObjectURL(word.image);
    session.urls.push(url);

    return {
      id: word.id,
      setId: word.setId,
      noun: word.noun,
      form: word.form,
      audio: word.audio || null,
      url: url
    };
  });
}

/*
  Reihenfolge nach Lernfach:
  1. fällige Wörter (neue, falsche, und solche, deren Abstand abgelaufen ist),
     niedrige Fächer zuerst
  2. danach die übrigen, die am frühesten fällig werden
  Aus den ersten "Anzahl pro Übung" wird die Runde gemischt.
*/
async function scheduleItems(items, prefix, limit) {
  let stats = {};

  if (prefix !== false) {
    try {
      stats = await getStats(items.map(item => statKey(prefix, item.id)));
    } catch (error) {
      stats = {};
    }
  }

  const now = Date.now();

  const scored = items.map(item => {
    const entry = stats[statKey(prefix, item.id)];
    return {
      item: item,
      box: entry && entry.box ? entry.box : 0,
      due: entry && entry.due ? entry.due : 0,
      random: Math.random()
    };
  });

  const dueNow = scored.filter(s => s.due <= now).sort((a, b) => a.box - b.box || a.random - b.random);
  const later = scored.filter(s => s.due > now).sort((a, b) => a.due - b.due || a.random - b.random);

  const count = limit > 0 ? limit : items.length;

  return shuffle([...dueNow, ...later].slice(0, count).map(s => s.item));
}

function getRoundLength() {
  return Number(settings.roundLength) || 0;
}

// Startet eine Übung: Bildschirm umschalten, Runde planen, "Los geht's"
async function startSession(game, set, words, options) {
  stopActiveGame();
  unlockAudio();

  session.game = game;
  session.set = set;
  session.words = words;
  session.statPrefix = options.statPrefix;
  session.items = prepareItems(options.words || words);
  session.queue = await scheduleItems(session.items, options.statPrefix, options.limit === undefined ? getRoundLength() : options.limit);
  session.current = null;
  session.firstTry = 0;
  session.done = 0;
  session.items.forEach(item => { item.repeated = false; });

  showScreen(null);
  gameContainers().forEach(element => element.classList.toggle("hidden", element !== game.container));
  gameSummary.classList.add("hidden");

  nextButton.classList.add("hidden");
  repeatButton.classList.remove("hidden");
  gearButton.classList.remove("hidden");
  scoreDisplay.classList.add("hidden");
  answerWord.classList.add("hidden");

  game.start();

  speak("Los geht's.", game.continuous ? null : nextItem);
}

function nextItem() {
  if (!session.game) return;

  session.mistake = false;
  nextButton.classList.add("hidden");
  answerWord.classList.add("hidden");

  if (session.queue.length === 0) {
    finishSession();
    return;
  }

  session.current = session.queue.shift();
  session.game.showItem(session.current);
}

/*
  Ergebnis eines Wortes festhalten.
  result: true (auf Anhieb richtig), false (mit Fehler) oder "teilweise".
  Ein Wort mit Fehler kommt in derselben Runde zwei Aufgaben später noch
  einmal – diese Wiederholung zählt nicht mehr für den Lernstand.
*/
function recordItemResult(result) {
  const item = session.current;
  if (!item) return;

  if (item.repeated) return;

  session.done++;
  if (result === true) session.firstTry++;
  updateSessionScore();

  if (session.statPrefix !== false) {
    recordResult(statKey(session.statPrefix, item.id), result).catch(() => {});
  }

  if (result !== true && session.queue.length > 0) {
    item.repeated = true;
    session.queue.splice(Math.min(2, session.queue.length), 0, item);
  }
}

function updateSessionScore() {
  if (session.done === 0) {
    scoreDisplay.classList.add("hidden");
    return;
  }

  // Auf schmalen Bildschirmen wird die Beschriftung ausgeblendet (nur "✓ 3 von 4")
  scoreDisplay.innerHTML = "<span class=\"score-label\">Beim ersten Versuch richtig: </span>" +
    "<span class=\"score-short\" aria-hidden=\"true\">✓ </span>" + session.firstTry + " von " + session.done;
  scoreDisplay.classList.remove("hidden");
}

function finishSession(text) {
  session.current = null;
  if (session.game && session.game.finish) session.game.finish();
  repeatButton.classList.add("hidden");
  nextButton.classList.add("hidden");

  instruction.textContent = text || "Fertig!";

  gameSummary.innerHTML =
    (session.done > 0
      ? "<p>Beim ersten Versuch richtig: <strong>" + session.firstTry + " von " + session.done + "</strong></p>"
      : "") +
    "<div class=\"button-row center\">" +
    "<button id=\"summaryAgainButton\">Noch einmal</button>" +
    "<button id=\"summaryBackButton\" class=\"secondary\">Zurück zu den Wortfeldern</button>" +
    "</div>";

  gameSummary.classList.remove("hidden");

  const game = session.game;
  const set = session.set;
  const words = session.words;

  document.getElementById("summaryAgainButton").addEventListener("click", () => game.restart(set, words));
  document.getElementById("summaryBackButton").addEventListener("click", backToOverview);

  speak(settings.calm ? "Fertig." : "Super, fertig!");
}

function stopActiveGame() {
  stopSpeaking();

  if (session.game) session.game.stop();

  session.urls.forEach(url => URL.revokeObjectURL(url));
  session.urls = [];
  session.game = null;
  session.current = null;
  session.queue = [];

  gameSummary.classList.add("hidden");
}

// Rückmeldung nach einer richtigen Antwort
function pickPraise() {
  return settings.calm ? { text: "Richtig!", animation: "stars" } : getRandomItem(correctMessages);
}

function pickWrongMessage() {
  return settings.calm ? "Noch einmal." : getRandomItem(wrongMessages);
}

function showAnswerWord(word) {
  if (settings.genusColors && word.form) {
    answerWord.innerHTML = "<span class=\"genus-" + word.form + "\">" + escapeHtml(getArticle(word)) + "</span> " +
      escapeHtml(word.noun);
  } else {
    answerWord.textContent = getDisplayName(word);
  }

  answerWord.classList.remove("hidden");
}

// Die Frage zu einem Wort: eigene Aufnahme, sonst Stimme
function speakQuestion(item, text) {
  if (settings.recordings && item.audio) {
    playRecording(item.audio);
    return;
  }

  speak(text);
}

function shuffle(array) {
  const result = [...array];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

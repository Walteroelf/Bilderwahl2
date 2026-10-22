/*
  Übung "Bild finden": "Wo ist der Schal?" – das Kind tippt auf das passende Bild.
*/

const pickGame = document.getElementById("pickGame");
const imageGrid = document.getElementById("imageGrid");

let pickChoices = [];
let pickAnswered = false;
let pickColumns = 2;

const pickExercise = {
  container: pickGame,

  restart(set, words) {
    startPickGame(set, words);
  },

  start() {
    pickColumns = Math.min(settings.numberOfChoices, session.items.length);
  },

  showItem(item) {
    pickAnswered = false;

    imageGrid.innerHTML = "";
    imageGrid.style.setProperty("--columns", pickColumns);
    imageGrid.dataset.columns = pickColumns;

    // Ablenker aus allen Wörtern der Auswahl, nicht nur aus der Runde
    const distractors = shuffle(session.items.filter(other => other !== item && other.noun !== item.noun))
      .slice(0, pickColumns - 1);

    pickChoices = shuffle([item, ...distractors]);
    renderPickCards();

    instruction.textContent = "Höre gut zu und tippe auf das passende Bild.";

    setTimeout(() => this.repeat(), 500);
  },

  repeat() {
    if (!session.current) return;
    speakQuestion(session.current, buildQuestionForImage(session.current));
  },

  stop() {
    imageGrid.innerHTML = "";
    pickChoices = [];
  }
};

function getPickWords(words) {
  return words.filter(word => word.form);
}

function startPickGame(set, words) {
  return startSession(pickExercise, set, words, { statPrefix: null, words: getPickWords(words) });
}

function renderPickCards() {
  pickChoices.forEach(image => {
    const card = document.createElement("div");
    card.classList.add("image-card");
    card.setAttribute("role", "button");
    card.tabIndex = 0;

    const img = document.createElement("img");
    img.src = image.url;
    img.alt = getDisplayName(image);

    card.appendChild(img);

    card.addEventListener("click", () => checkPickAnswer(image, card));
    card.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        checkPickAnswer(image, card);
      }
    });

    imageGrid.appendChild(card);
  });
}

function checkPickAnswer(selected, selectedCard) {
  const target = session.current;
  if (pickAnswered || !target) return;
  if (selectedCard.classList.contains("ruled-out") || selectedCard.classList.contains("faded")) return;

  if (selected === target) {
    pickAnswered = true;
    recordItemResult(!session.mistake);

    // Alle anderen Bilder treten zurück, nur das richtige bleibt stehen
    imageGrid.querySelectorAll(".image-card").forEach(card => {
      card.classList.remove("hint");
      if (card !== selectedCard) card.classList.add("faded");
    });
    selectedCard.classList.add("correct");

    const praise = pickPraise();
    instruction.textContent = praise.text;
    showAnswerWord(target);

    // Das Wort wird zum Schluss noch einmal als Satz vorgesprochen
    speak(praise.text + " " + buildModelSentence(target));
    createCelebration(selectedCard, praise.animation, settings.calm);

    setTimeout(() => {
      nextButton.classList.remove("hidden");
    }, 1200);

    return;
  }

  session.mistake = true;
  selectedCard.classList.add("wrong");

  if (settings.errorless) {
    // Hilfe: falsches Bild ausgrauen, richtiges Bild zeigen und benennen
    selectedCard.classList.add("ruled-out");
    imageGrid.children[pickChoices.indexOf(target)].classList.add("hint");

    instruction.textContent = "Schau mal, hier!";
    speak("Schau mal. " + buildHintSentence(target));
  } else {
    const message = pickWrongMessage();
    instruction.textContent = message;

    // Nach dem Hinweis wird die Frage automatisch wiederholt
    speak(message, () => {
      if (!pickAnswered) pickExercise.repeat();
    });
  }

  setTimeout(() => selectedCard.classList.remove("wrong"), 900);
}

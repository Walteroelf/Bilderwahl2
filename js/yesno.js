/*
  Übung "Ja oder Nein": Ein Bild, dazu die Frage "Ist das der Schal?".
  Mal passt das Wort zum Bild, mal nicht – das Kind tippt Ja oder Nein.
*/

const yesNoGame = document.getElementById("yesNoGame");
const yesNoImage = document.getElementById("yesNoImage");
const yesButton = document.getElementById("yesButton");
const noButton = document.getElementById("noButton");

let yesNoAsked = null;
let yesNoAnswered = false;

const yesNoExercise = {
  container: yesNoGame,

  restart(set, words) {
    startYesNoGame(set, words);
  },

  start() {
    yesNoImage.innerHTML = "";
  },

  showItem(item) {
    yesNoAnswered = false;
    [yesButton, noButton].forEach(button => button.classList.remove("hint", "wrong", "correct"));

    // Etwa die Hälfte der Fragen passt zum Bild, die anderen fragen nach einem anderen Wort
    const others = session.items.filter(other => other.noun !== item.noun);
    yesNoAsked = others.length > 0 && Math.random() < 0.5 ? getRandomItem(others) : item;

    yesNoImage.innerHTML = "";
    const img = document.createElement("img");
    img.src = item.url;
    img.alt = "";
    yesNoImage.appendChild(img);

    instruction.textContent = buildYesNoQuestion(yesNoAsked);

    setTimeout(() => this.repeat(), 400);
  },

  repeat() {
    if (!yesNoAsked) return;
    speak(buildYesNoQuestion(yesNoAsked));
  },

  stop() {
    yesNoImage.innerHTML = "";
    yesNoAsked = null;
  }
};

yesButton.addEventListener("click", () => answerYesNo(true));
noButton.addEventListener("click", () => answerYesNo(false));

function buildYesNoQuestion(word) {
  return (word.form === "pl" ? "Sind das " : "Ist das ") + getDisplayName(word) + "?";
}

function startYesNoGame(set, words) {
  return startSession(yesNoExercise, set, words, { statPrefix: "janein", words: words.filter(word => word.form) });
}

function answerYesNo(saidYes) {
  const item = session.current;
  if (!item || yesNoAnswered) return;

  const isYes = yesNoAsked === item;
  const button = saidYes ? yesButton : noButton;

  if (saidYes === isYes) {
    yesNoAnswered = true;
    recordItemResult(!session.mistake);

    button.classList.remove("hint");
    button.classList.add("correct");

    const praise = pickPraise();
    instruction.textContent = praise.text;
    showAnswerWord(item);

    speak(praise.text + " " + buildModelSentence(item));
    createCelebration(yesNoImage, praise.animation, settings.calm);

    setTimeout(() => {
      nextButton.classList.remove("hidden");
    }, 1200);

    return;
  }

  session.mistake = true;
  button.classList.add("wrong");
  setTimeout(() => button.classList.remove("wrong"), 600);

  if (settings.errorless) {
    // Hilfe: richtigen Knopf zeigen und das Bild benennen
    (isYes ? yesButton : noButton).classList.add("hint");
    instruction.textContent = "Schau mal: " + getDisplayName(item);
    showAnswerWord(item);
    speak("Schau mal. " + buildModelSentence(item));
  } else {
    instruction.textContent = pickWrongMessage();
    speak(instruction.textContent, () => {
      if (!yesNoAnswered) yesNoExercise.repeat();
    });
  }
}

/*
  Übung "Benennen": Das Kind sagt selbst, was auf dem Bild ist.
  Optional nimmt die App die Antwort auf und spielt sie vor. Die Lehrkraft
  bewertet: richtig / teilweise / noch nicht. Die Aufnahmen werden nicht gespeichert.
*/

const namingGame = document.getElementById("namingGame");
const namingImage = document.getElementById("namingImage");
const namingRecordButton = document.getElementById("namingRecordButton");
const namingPlayButton = document.getElementById("namingPlayButton");
const namingSolutionButton = document.getElementById("namingSolutionButton");
const namingRating = document.getElementById("namingRating");

let namingRecorder = null;
let namingRecording = null;
let namingRated = false;

const namingExercise = {
  container: namingGame,

  restart(set, words) {
    startNamingGame(set, words);
  },

  start() {
    namingRecordButton.classList.toggle("hidden", !canRecordAudio());
  },

  showItem(item) {
    namingRated = false;
    namingRecording = null;
    namingPlayButton.classList.add("hidden");
    namingRecordButton.textContent = "🎤 Antwort aufnehmen";
    namingRecordButton.classList.remove("recording");
    namingRating.querySelectorAll("button").forEach(button => { button.disabled = false; });

    namingImage.innerHTML = "";
    const img = document.createElement("img");
    img.src = item.url;
    img.alt = "";
    namingImage.appendChild(img);

    instruction.textContent = "Was ist das?";
    setTimeout(() => this.repeat(), 400);
  },

  repeat() {
    if (session.current) speak("Was ist das?");
  },

  stop() {
    stopNamingRecording(true);
    namingImage.innerHTML = "";
    namingRecording = null;
  }
};

namingRecordButton.addEventListener("click", toggleNamingRecording);
namingPlayButton.addEventListener("click", () => {
  if (namingRecording) playRecording(namingRecording);
});
namingSolutionButton.addEventListener("click", () => {
  const item = session.current;
  if (!item) return;

  showAnswerWord(item);
  speak(buildModelSentence(item));
});

namingRating.addEventListener("click", event => {
  const button = event.target.closest("button[data-rating]");
  if (!button || namingRated || !session.current) return;

  namingRated = true;
  namingRating.querySelectorAll("button").forEach(other => { other.disabled = true; });
  stopNamingRecording(true);

  const rating = button.dataset.rating;
  const item = session.current;

  recordItemResult(rating === "richtig" ? true : rating === "teilweise" ? "teilweise" : false);

  // Zum Abschluss das Wort noch einmal als Modell
  showAnswerWord(item);

  if (rating === "richtig") {
    const praise = pickPraise();
    instruction.textContent = praise.text;
    createCelebration(namingImage, praise.animation, settings.calm);
    speak(praise.text + " " + buildModelSentence(item), nextItem);
  } else {
    instruction.textContent = getDisplayName(item);
    speak(buildModelSentence(item), nextItem);
  }
});

function startNamingGame(set, words) {
  return startSession(namingExercise, set, words, { statPrefix: "benennen", words: words.filter(word => word.form) });
}

async function toggleNamingRecording() {
  if (namingRecorder) {
    await stopNamingRecording(false);
    return;
  }

  stopSpeaking();

  try {
    namingRecorder = await startRecording();
    namingRecordButton.textContent = "■ Aufnahme beenden";
    namingRecordButton.classList.add("recording");
  } catch (error) {
    instruction.textContent = "Das Mikrofon konnte nicht gestartet werden.";
  }
}

async function stopNamingRecording(discard) {
  if (!namingRecorder) return;

  const recorder = namingRecorder;
  namingRecorder = null;

  namingRecordButton.textContent = "🎤 Neu aufnehmen";
  namingRecordButton.classList.remove("recording");

  const blob = await recorder.stop();

  if (!discard && blob.size > 0) {
    namingRecording = blob;
    namingPlayButton.classList.remove("hidden");
    playRecording(blob);
  }
}

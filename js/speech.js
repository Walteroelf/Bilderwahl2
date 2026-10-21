/*
  Sprachausgabe: Computerstimme oder – optional – eigene Aufnahmen.
*/

let availableVoices = [];
let speechToken = 0;

// Ein gemeinsames Audio-Element; iPad/Safari erlaubt Abspielen erst,
// nachdem es einmal durch ein Tippen freigeschaltet wurde.
const recordingPlayer = new Audio();
let recordingPlayerUrl = null;

const SILENT_WAV =
  "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=";

if ("speechSynthesis" in window) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

function loadVoices() {
  availableVoices = window.speechSynthesis.getVoices();
}

// Muss direkt aus einem Tipp-Ereignis aufgerufen werden
function unlockAudio() {
  recordingPlayer.src = SILENT_WAV;
  recordingPlayer.play().catch(() => {});
}

function getBestGermanVoice() {
  const germanVoices = availableVoices.filter(voice =>
    voice.lang && voice.lang.toLowerCase().startsWith("de")
  );

  if (germanVoices.length === 0) {
    return null;
  }

  const preferredNames = [
    "Anna",
    "Petra",
    "Markus",
    "Yannick",
    "Siri",
    "Google Deutsch",
    "German",
    "Deutsch"
  ];

  for (const preferred of preferredNames) {
    const found = germanVoices.find(voice =>
      voice.name.toLowerCase().includes(preferred.toLowerCase())
    );

    if (found) return found;
  }

  return germanVoices[0];
}

// onDone wird genau einmal aufgerufen – auch wenn der Browser kein
// "end"-Ereignis liefert – und nicht mehr, wenn inzwischen etwas
// anderes gesprochen wird.
function createFinisher(onDone) {
  const token = ++speechToken;
  let finished = false;

  return () => {
    if (finished || token !== speechToken) return;
    finished = true;
    if (onDone) onDone();
  };
}

function speak(text, onDone) {
  stopAudioOnly();
  const finish = createFinisher(onDone);

  if (!("speechSynthesis" in window)) {
    console.warn("Sprachausgabe wird von diesem Browser nicht unterstützt.");
    setTimeout(finish, 300);
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);

  utterance.lang = "de-DE";
  utterance.voice = getBestGermanVoice();
  utterance.rate = 0.78;
  utterance.pitch = 1.0;
  utterance.volume = 1;

  utterance.onend = () => setTimeout(finish, 250);
  utterance.onerror = () => setTimeout(finish, 250);

  // Sicherheitsnetz, falls "end" ausbleibt
  setTimeout(finish, 1500 + text.length * 120);

  window.speechSynthesis.speak(utterance);
}

function playRecording(blob, onDone) {
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  stopAudioOnly();

  const finish = createFinisher(onDone);

  recordingPlayerUrl = URL.createObjectURL(blob);
  recordingPlayer.src = recordingPlayerUrl;
  recordingPlayer.onended = () => setTimeout(finish, 250);
  recordingPlayer.onerror = () => setTimeout(finish, 250);

  recordingPlayer.play().catch(() => setTimeout(finish, 250));
}

function stopAudioOnly() {
  recordingPlayer.onended = null;
  recordingPlayer.onerror = null;
  recordingPlayer.pause();

  if (recordingPlayerUrl) {
    URL.revokeObjectURL(recordingPlayerUrl);
    recordingPlayerUrl = null;
  }
}

function stopSpeaking() {
  speechToken++;
  stopAudioOnly();

  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

/*
  Eigene Aufnahmen mit dem Mikrofon.
*/

function canRecordAudio() {
  return Boolean(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
}

async function startRecording() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const recorder = new MediaRecorder(stream);
  const chunks = [];

  recorder.ondataavailable = event => {
    if (event.data && event.data.size > 0) chunks.push(event.data);
  };

  const finished = new Promise(resolve => {
    recorder.onstop = () => {
      stream.getTracks().forEach(track => track.stop());
      resolve(new Blob(chunks, { type: recorder.mimeType || "audio/mp4" }));
    };
  });

  recorder.start();

  return {
    stop: () => {
      if (recorder.state !== "inactive") recorder.stop();
      return finished;
    }
  };
}

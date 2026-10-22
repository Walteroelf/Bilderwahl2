/*
  Sprachausgabe: vorab erzeugte Sätze mit der Thorsten-Stimme (js/voice.js),
  sonst die Computerstimme des Geräts – und optional eigene Aufnahmen.
*/

let availableVoices = [];
let speechToken = 0;
let bundledVoiceEnabled = true;

const VOICE_FOLDER = "audio/thorsten/";

function setBundledVoiceEnabled(enabled) {
  bundledVoiceEnabled = enabled;
}

// Muss zu key() in scripts/generate-voice.py passen
function voiceKey(text) {
  return String(text).replace(/\s+/g, " ").trim().replace(/\.+$/, "").trim();
}

// Liefert die Dateien für einen Text – als Ganzes oder Satz für Satz.
// Fehlt auch nur ein Satz, wird null geliefert (dann spricht das Gerät alles,
// damit nicht zwei Stimmen in einer Äußerung gemischt werden).
function findVoiceClips(text) {
  if (!bundledVoiceEnabled || typeof VOICE_CLIPS === "undefined") return null;

  const whole = VOICE_CLIPS[voiceKey(text)];
  if (whole) return [whole];

  const parts = (String(text).match(/[^.!?]+[.!?]*/g) || []).map(part => part.trim()).filter(Boolean);
  if (parts.length < 2) return null;

  const files = parts.map(part => VOICE_CLIPS[voiceKey(part)]);
  return files.every(Boolean) ? files : null;
}

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
  const clips = findVoiceClips(text);

  if (clips) {
    playVoiceClips(clips, text, onDone);
    return;
  }

  speakWithDevice(text, onDone);
}

function speakWithDevice(text, onDone) {
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

// Spielt die Dateien nacheinander mit kurzer Pause ab
function playVoiceClips(files, text, onDone) {
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  stopAudioOnly();

  const token = speechToken + 1;
  const finish = createFinisher(onDone);
  let index = 0;

  const playNext = () => {
    if (token !== speechToken) return;

    if (index >= files.length) {
      setTimeout(finish, 250);
      return;
    }

    recordingPlayer.src = VOICE_FOLDER + files[index] + ".m4a";
    index++;

    recordingPlayer.play().catch(fallback);
  };

  // Datei fehlt oder lässt sich nicht abspielen: Gerätestimme übernimmt
  const fallback = () => {
    if (token !== speechToken) return;
    stopAudioOnly();
    speakWithDevice(text, onDone);
  };

  recordingPlayer.onended = () => setTimeout(playNext, 200);
  recordingPlayer.onerror = fallback;

  playNext();
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

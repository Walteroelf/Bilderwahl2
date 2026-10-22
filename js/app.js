const MAX_WORDS_PER_SET = 40;
const MAX_IMAGE_SIZE = 1200;

const wrongMessages = [
  "Leider falsch.",
  "Das war es noch nicht.",
  "Versuche es noch einmal.",
  "Fast, aber noch nicht richtig.",
  "Hör noch einmal genau hin.",
  "Das gesuchte Bild ist ein anderes.",
  "Noch einmal probieren.",
  "Das war leider nicht das passende Bild.",
  "Schau noch einmal genau.",
  "Nicht ganz. Du schaffst das."
];

const correctMessages = [
  { text: "Genau richtig!", animation: "confetti" },
  { text: "Super gemacht!", animation: "stars" },
  { text: "Prima, das stimmt!", animation: "hearts" },
  { text: "Sehr gut gehört!", animation: "circles" },
  { text: "Klasse, richtig!", animation: "ribbons" },
  { text: "Toll gemacht!", animation: "diamonds" },
  { text: "Ja, das ist richtig!", animation: "smileys" },
  { text: "Wunderbar!", animation: "flowers" },
  { text: "Richtig erkannt!", animation: "sparkles" },
  { text: "Fantastisch!", animation: "balloons" }
];

const FORM_OPTIONS = [
  ["", "?"],
  ["der", "der"],
  ["die", "die"],
  ["das", "das"],
  ["pl", "die (Mehrzahl)"]
];

/* ---------- Einstellungen ---------- */

const SETTINGS_KEY = "bilderwahl-einstellungen";

const defaultSettings = {
  numberOfChoices: 2,
  errorless: true,
  calm: false,
  genusColors: true,
  recordings: false,
  housesSayArticle: true
};

let settings = loadSettings();

function loadSettings() {
  try {
    return { ...defaultSettings, ...JSON.parse(localStorage.getItem(SETTINGS_KEY)) };
  } catch (error) {
    return { ...defaultSettings };
  }
}

function saveSettings() {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    // Einstellungen gelten dann nur bis zum Neuladen
  }
}

/* ---------- Elemente ---------- */

const homeScreen = document.getElementById("homeScreen");
const libraryScreen = document.getElementById("libraryScreen");
const libraryList = document.getElementById("libraryList");
const librarySetButton = document.getElementById("librarySetButton");
const libraryBackButton = document.getElementById("libraryBackButton");
const editorScreen = document.getElementById("editorScreen");
const statsScreen = document.getElementById("statsScreen");

const setList = document.getElementById("setList");
const newSetButton = document.getElementById("newSetButton");
const importSetButton = document.getElementById("importSetButton");
const importInput = document.getElementById("importInput");

const imageCountSelect = document.getElementById("imageCountSelect");
const errorlessToggle = document.getElementById("errorlessToggle");
const calmToggle = document.getElementById("calmToggle");
const genusToggle = document.getElementById("genusToggle");
const recordingsToggle = document.getElementById("recordingsToggle");
const housesArticleToggle = document.getElementById("housesArticleToggle");

const editorTitle = document.getElementById("editorTitle");
const setNameInput = document.getElementById("setNameInput");
const fileInput = document.getElementById("fileInput");
const fileInfo = document.getElementById("fileInfo");
const wordRows = document.getElementById("wordRows");
const saveSetButton = document.getElementById("saveSetButton");
const cancelEditButton = document.getElementById("cancelEditButton");

const statsTitle = document.getElementById("statsTitle");
const statsTable = document.getElementById("statsTable");
const statsBackButton = document.getElementById("statsBackButton");
const statsResetButton = document.getElementById("statsResetButton");

const instruction = document.getElementById("instruction");
const answerWord = document.getElementById("answerWord");
const pickGame = document.getElementById("pickGame");
const imageGrid = document.getElementById("imageGrid");
const scoreDisplay = document.getElementById("score");

const repeatButton = document.getElementById("repeatButton");
const nextButton = document.getElementById("nextButton");
const settingsButton = document.getElementById("settingsButton");

/* ---------- Zustand ---------- */

// Wortset, das gerade bearbeitet wird
let editingSet = null;
let editingWords = [];
let activeRecorder = null;

// Wortset, dessen Lernstand angezeigt wird
let statsSet = null;
let statsWords = [];

// Spiel: "pick" = Bild finden, "houses" = Artikel-Häuser
let gameMode = "pick";
let images = [];
let currentChoices = [];
let correctImage = null;
let answered = false;
let numberOfChoices = 2;
let targetQueue = [];
let lastTarget = null;
let roundsPlayed = 0;
let correctOnFirstTry = 0;
let mistakeInRound = false;

/* ---------- Start ---------- */

applySettingsToForm();
document.getElementById("homeCredit").innerHTML = ARASAAC_CREDIT_HTML;
document.getElementById("libraryCredit").innerHTML = ARASAAC_CREDIT_HTML;
requestPersistentStorage();
showHome();

imageCountSelect.addEventListener("change", updateSettingsFromForm);
errorlessToggle.addEventListener("change", updateSettingsFromForm);
calmToggle.addEventListener("change", updateSettingsFromForm);
genusToggle.addEventListener("change", updateSettingsFromForm);
recordingsToggle.addEventListener("change", updateSettingsFromForm);
housesArticleToggle.addEventListener("change", updateSettingsFromForm);

newSetButton.addEventListener("click", () => openEditor(null));
librarySetButton.addEventListener("click", showLibrary);
libraryBackButton.addEventListener("click", showHome);
importSetButton.addEventListener("click", () => importInput.click());
importInput.addEventListener("change", importSetFromFile);

fileInput.addEventListener("change", addFilesToEditor);
saveSetButton.addEventListener("click", saveEditor);
cancelEditButton.addEventListener("click", closeEditor);
wordRows.addEventListener("click", handleWordRowClick);
wordRows.addEventListener("change", handleWordRowChange);

statsBackButton.addEventListener("click", showHome);
statsResetButton.addEventListener("click", resetStatsOfSet);

repeatButton.addEventListener("click", () => {
  if (gameMode === "houses") {
    speakHouseWord();
  } else {
    speakCurrentWord();
  }
});
nextButton.addEventListener("click", nextRound);
settingsButton.addEventListener("click", openSettings);

function applySettingsToForm() {
  imageCountSelect.value = String(settings.numberOfChoices);
  errorlessToggle.checked = settings.errorless;
  calmToggle.checked = settings.calm;
  genusToggle.checked = settings.genusColors;
  recordingsToggle.checked = settings.recordings;
  housesArticleToggle.checked = settings.housesSayArticle;
}

function updateSettingsFromForm() {
  settings = {
    numberOfChoices: Number(imageCountSelect.value),
    errorless: errorlessToggle.checked,
    calm: calmToggle.checked,
    genusColors: genusToggle.checked,
    recordings: recordingsToggle.checked,
    housesSayArticle: housesArticleToggle.checked
  };

  saveSettings();
  renderSetList();
}

function showScreen(screen) {
  [homeScreen, libraryScreen, editorScreen, statsScreen].forEach(element => {
    element.classList.toggle("hidden", element !== screen);
  });
}

/* ---------- Startseite: Wortsets ---------- */

async function showHome() {
  showScreen(homeScreen);
  await renderSetList();
}

async function renderSetList() {
  let sets;

  try {
    sets = await getAllSets();
  } catch (error) {
    setList.innerHTML = "<p class=\"warning\">Dieser Browser kann keine Wortsets speichern " +
      "(z. B. im privaten Modus). Bitte in einem normalen Fenster öffnen.</p>";
    newSetButton.disabled = true;
    librarySetButton.disabled = true;
    importSetButton.disabled = true;
    return;
  }

  if (sets.length === 0) {
    setList.innerHTML = "<p class=\"hint\">Noch keine Wortsets. Lege eines an, z. B. „Kleidung“ mit Fotos von Schal, Mütze und Strümpfen.</p>";
    return;
  }

  const cards = await Promise.all(sets.map(async set => {
    const words = await getWordsOfSet(set.id);
    return buildSetCard(set, words);
  }));

  setList.innerHTML = "";
  cards.forEach(card => setList.appendChild(card));
}

function buildSetCard(set, words) {
  const card = document.createElement("div");
  card.className = "set-card";

  const missing = words.filter(word => !word.form).length;
  const usesArasaac = words.some(word => word.credit === "ARASAAC");
  const playable = words.length - missing >= settings.numberOfChoices;
  const housesPlayable = getHouseWords(words).length >= 2;

  const thumbs = document.createElement("div");
  thumbs.className = "set-thumbs";

  words.slice(0, 6).forEach(word => {
    const img = document.createElement("img");
    img.src = URL.createObjectURL(word.image);
    img.alt = "";
    img.onload = () => URL.revokeObjectURL(img.src);
    thumbs.appendChild(img);
  });

  const info = document.createElement("div");
  info.className = "set-info";
  info.innerHTML = "<strong>" + escapeHtml(set.name) + "</strong><br />" +
    words.length + " Wörter" +
    (usesArasaac ? " · <span class=\"hint\">Piktogramme: ARASAAC</span>" : "") +
    (missing > 0 ? " · <span class=\"warning\">" + missing + " ohne Artikel</span>" : "") +
    (!playable && missing === 0 ? " · <span class=\"warning\">mindestens " + settings.numberOfChoices + " Wörter nötig</span>" : "");

  const actions = document.createElement("div");
  actions.className = "set-actions";

  actions.appendChild(makeButton("Bild finden", "", () => startGame(set, words), !playable));
  actions.appendChild(makeButton("Artikel-Häuser", "", () => startHouseGame(set, words), !housesPlayable));
  actions.appendChild(makeButton("Bearbeiten", "secondary", () => openEditor(set)));
  actions.appendChild(makeButton("Lernstand", "secondary", () => showStats(set, words)));
  actions.appendChild(makeButton("Exportieren", "secondary", () => exportSet(set, words)));
  actions.appendChild(makeButton("Löschen", "secondary danger", () => confirmDeleteSet(set)));

  card.appendChild(thumbs);
  card.appendChild(info);
  card.appendChild(actions);

  return card;
}

function makeButton(label, className, onClick, disabled) {
  const button = document.createElement("button");
  button.textContent = label;
  if (className) button.className = className;
  button.disabled = Boolean(disabled);
  button.addEventListener("click", onClick);
  return button;
}

async function confirmDeleteSet(set) {
  if (!confirm("Wortset „" + set.name + "“ mit allen Bildern, Aufnahmen und dem Lernstand löschen?")) return;

  await deleteSet(set.id);
  renderSetList();
}

/* ---------- Wortset bearbeiten ---------- */

async function openEditor(set) {
  editingSet = set ? { ...set } : { id: createId(), name: "", createdAt: Date.now() };

  const storedWords = set ? await getWordsOfSet(set.id) : [];

  editingWords = storedWords.map(word => ({
    id: word.id,
    noun: word.noun,
    form: word.form,
    image: word.image,
    imageUrl: URL.createObjectURL(word.image),
    audio: word.audio || null,
    credit: word.credit || null
  }));

  editorTitle.textContent = set ? "Wortset bearbeiten" : "Neues Wortset";
  setNameInput.value = editingSet.name;
  fileInput.value = "";
  fileInfo.textContent = "";

  renderWordRows();
  showScreen(editorScreen);

  if (!set) setNameInput.focus();
}

function closeEditor() {
  stopActiveRecording();
  editingWords.forEach(word => URL.revokeObjectURL(word.imageUrl));
  editingWords = [];
  editingSet = null;
  showHome();
}

async function addFilesToEditor(event) {
  const files = Array.from(event.target.files).filter(isImageFile);
  const freeSlots = MAX_WORDS_PER_SET - editingWords.length;

  fileInfo.textContent = "Bilder werden vorbereitet …";

  let skipped = 0;
  let unreadable = [];

  for (const file of files.slice(0, freeSlots)) {
    const image = await prepareImage(file);

    if (!image) {
      unreadable.push(file.name);
      continue;
    }

    const parsed = parseImageName(file.name);

    editingWords.push({
      id: createId(),
      noun: parsed.noun,
      form: parsed.form,
      image: image,
      imageUrl: URL.createObjectURL(image),
      audio: null,
      credit: null
    });
  }

  skipped = Math.max(0, files.length - freeSlots);

  const messages = [];
  if (unreadable.length > 0) {
    messages.push(unreadable.length + " Bild(er) können nicht angezeigt werden (bitte als JPG oder PNG speichern): " + unreadable.join(", "));
  }
  if (skipped > 0) {
    messages.push(skipped + " Bild(er) übersprungen – höchstens " + MAX_WORDS_PER_SET + " Wörter pro Wortset.");
  }

  fileInfo.textContent = messages.join(" ");
  fileInput.value = "";

  renderWordRows();
}

function isImageFile(file) {
  const fileName = file.name.toLowerCase();

  return (
    file.type.startsWith("image/") ||
    /\.(png|jpe?g|heic|heif|webp)$/.test(fileName)
  );
}

// Verkleinert große Fotos, damit sie wenig Speicher brauchen.
// Gibt null zurück, wenn der Browser das Bild nicht anzeigen kann.
function prepareImage(file) {
  return new Promise(resolve => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);

      if (!img.naturalWidth) {
        resolve(null);
        return;
      }

      const scale = Math.min(1, MAX_IMAGE_SIZE / Math.max(img.naturalWidth, img.naturalHeight));
      const isPng = file.type === "image/png" || /\.png$/i.test(file.name);

      if (scale === 1 && file.size < 1500000) {
        resolve(file);
        return;
      }

      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.naturalWidth * scale);
      canvas.height = Math.round(img.naturalHeight * scale);

      const context = canvas.getContext("2d");

      if (!isPng) {
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
      }

      context.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        blob => resolve(blob || file),
        isPng ? "image/png" : "image/jpeg",
        0.85
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };

    img.src = url;
  });
}

function renderWordRows() {
  if (editingWords.length === 0) {
    wordRows.innerHTML = "<p class=\"hint\">Noch keine Bilder. Wähle oben Bilder aus.</p>";
    updateEditorStatus();
    return;
  }

  const showRecordings = settings.recordings && canRecordAudio();

  wordRows.innerHTML = editingWords.map((word, index) => {
    let html = "<div class=\"word-row" + (word.form ? "" : " missing") + "\" data-index=\"" + index + "\">" +
      "<img src=\"" + word.imageUrl + "\" alt=\"\" />" +
      "<div class=\"word-fields\">" +
      "<div class=\"word-inputs\">" +
      buildFormSelect(word, index) +
      "<input type=\"text\" class=\"text-input noun-input\" value=\"" + escapeHtml(word.noun) + "\" aria-label=\"Wort\" />" +
      "</div>" +
      "<div class=\"word-question\">" + (word.form
        ? escapeHtml(buildQuestionForImage(word))
        : "<span class=\"warning\">Bitte Artikel wählen</span>") +
      "</div>";

    if (showRecordings) {
      const recording = activeRecorder && activeRecorder.index === index;

      html += "<div class=\"word-audio\">" +
        "<button class=\"small" + (recording ? " recording" : "") + "\" data-action=\"record\">" +
        (recording ? "■ Stopp" : (word.audio ? "🎤 Neu aufnehmen" : "🎤 Aufnehmen")) + "</button>" +
        (word.audio
          ? "<button class=\"small secondary\" data-action=\"play\">▶ Anhören</button>" +
            "<button class=\"small secondary\" data-action=\"delete-audio\">Aufnahme löschen</button>"
          : "<span class=\"hint\">sonst Computerstimme</span>") +
        "</div>";
    }

    html += "</div>" +
      "<button class=\"small secondary remove-word\" data-action=\"remove\" aria-label=\"Wort entfernen\">✕</button>" +
      "</div>";

    return html;
  }).join("");

  updateEditorStatus();
}

function buildFormSelect(word, index) {
  return "<select class=\"form-select genus-select-" + (word.form || "none") + "\" data-index=\"" + index + "\" aria-label=\"Artikel\">" +
    FORM_OPTIONS.map(([value, label]) =>
      "<option value=\"" + value + "\"" + ((word.form || "") === value ? " selected" : "") + ">" + label + "</option>"
    ).join("") +
    "</select>";
}

function updateEditorStatus() {
  const missing = editingWords.filter(word => !word.form).length;
  saveSetButton.disabled = editingWords.length === 0;

  if (missing > 0 && !fileInfo.textContent) {
    fileInfo.textContent = "Bei " + missing + " Wort/Wörtern fehlt der Artikel. Speichern geht trotzdem, gespielt werden nur Wörter mit Artikel.";
  }
}

function handleWordRowChange(event) {
  const row = event.target.closest(".word-row");
  if (!row) return;

  const word = editingWords[Number(row.dataset.index)];

  if (event.target.classList.contains("form-select")) {
    word.form = event.target.value || null;
    if (word.form) saveForm(word.noun, word.form);
  }

  if (event.target.classList.contains("noun-input")) {
    // Eingabe wie "der Schal" oder "Strümpfe" wird wie ein Dateiname gelesen
    const parsed = parseWordText(event.target.value);
    word.noun = parsed.noun;
    if (parsed.form) word.form = parsed.form;
  }

  fileInfo.textContent = "";
  renderWordRows();
}

async function handleWordRowClick(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const row = button.closest(".word-row");
  const index = Number(row.dataset.index);
  const word = editingWords[index];

  switch (button.dataset.action) {
    case "remove":
      if (activeRecorder && activeRecorder.index === index) await stopActiveRecording();
      URL.revokeObjectURL(word.imageUrl);
      editingWords.splice(index, 1);
      if (activeRecorder && activeRecorder.index > index) activeRecorder.index--;
      fileInfo.textContent = "";
      renderWordRows();
      break;

    case "record":
      await toggleRecording(index);
      break;

    case "play":
      playRecording(word.audio);
      break;

    case "delete-audio":
      word.audio = null;
      renderWordRows();
      break;
  }
}

async function toggleRecording(index) {
  if (activeRecorder) {
    const wasIndex = activeRecorder.index;
    await stopActiveRecording();
    if (wasIndex === index) return;
  }

  stopSpeaking();

  try {
    const recorder = await startRecording();
    activeRecorder = { index: index, recorder: recorder };
    fileInfo.textContent = "Aufnahme läuft … Sprich die Frage, z. B. „" + buildQuestionForImage(editingWords[index]) + "“";
  } catch (error) {
    fileInfo.textContent = "Das Mikrofon konnte nicht gestartet werden. Bitte den Zugriff auf das Mikrofon erlauben.";
  }

  renderWordRows();
}

async function stopActiveRecording() {
  if (!activeRecorder) return;

  const { index, recorder } = activeRecorder;
  activeRecorder = null;

  const blob = await recorder.stop();

  if (editingWords[index] && blob.size > 0) {
    editingWords[index].audio = blob;
  }

  fileInfo.textContent = "";
  renderWordRows();
}

async function saveEditor() {
  await stopActiveRecording();

  editingSet.name = setNameInput.value.trim() || "Wortset ohne Namen";

  try {
    await saveSet(editingSet, editingWords);
  } catch (error) {
    fileInfo.textContent = "Speichern hat nicht geklappt. Ist der Speicher des Geräts voll?";
    return;
  }

  closeEditor();
}

/* ---------- Sammlung mitgelieferter Wortfelder ---------- */

function showLibrary() {
  showScreen(libraryScreen);

  libraryList.innerHTML = "";

  WORD_FIELDS.forEach(field => {
    const card = document.createElement("div");
    card.className = "set-card";

    const thumbs = document.createElement("div");
    thumbs.className = "set-thumbs";

    field.words.slice(0, 6).forEach(word => {
      const img = document.createElement("img");
      img.src = getPictogramUrl(word.picto);
      img.alt = "";
      img.loading = "lazy";
      thumbs.appendChild(img);
    });

    const info = document.createElement("div");
    info.className = "set-info";
    info.innerHTML = "<strong>" + escapeHtml(field.name) + "</strong><br />" +
      "<span class=\"hint\">" + field.words.map(word => escapeHtml(getDisplayName(word))).join(", ") + "</span>";

    const actions = document.createElement("div");
    actions.className = "set-actions";

    const addButton = makeButton("Als Wortset anlegen", "", async () => {
      addButton.disabled = true;
      addButton.textContent = "Wird angelegt …";

      try {
        await addWordFieldAsSet(field);
        showHome();
      } catch (error) {
        addButton.disabled = false;
        addButton.textContent = "Als Wortset anlegen";
        alert("Die Bilder konnten nicht geladen werden. Besteht eine Internetverbindung?");
      }
    });

    actions.appendChild(addButton);

    card.appendChild(thumbs);
    card.appendChild(info);
    card.appendChild(actions);

    libraryList.appendChild(card);
  });
}

async function addWordFieldAsSet(field) {
  const words = await Promise.all(field.words.map(async word => {
    const response = await fetch(getPictogramUrl(word.picto));
    if (!response.ok) throw new Error("Bild fehlt: " + word.picto);

    return {
      id: createId(),
      noun: word.noun,
      form: word.form,
      image: await response.blob(),
      audio: null,
      credit: "ARASAAC"
    };
  }));

  await saveSet({ id: createId(), name: field.name, createdAt: Date.now() }, words);
}

/* ---------- Export und Import ---------- */

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

async function dataUrlToBlob(dataUrl) {
  const response = await fetch(dataUrl);
  return response.blob();
}

async function exportSet(set, words) {
  const data = {
    app: "bilderwahl",
    format: 1,
    name: set.name,
    words: await Promise.all(words.map(async word => ({
      noun: word.noun,
      form: word.form,
      image: await blobToDataUrl(word.image),
      audio: word.audio ? await blobToDataUrl(word.audio) : null,
      credit: word.credit || null
    })))
  };

  const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "Wortset " + set.name.replace(/[\\/:*?"<>|]+/g, "") + ".json";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 10000);
}

async function importSetFromFile(event) {
  const file = event.target.files[0];
  importInput.value = "";
  if (!file) return;

  try {
    const data = JSON.parse(await file.text());

    if (data.app !== "bilderwahl" || !Array.isArray(data.words)) {
      throw new Error("Keine Wortset-Datei");
    }

    const set = { id: createId(), name: String(data.name || "Importiertes Wortset"), createdAt: Date.now() };

    const words = await Promise.all(data.words.slice(0, MAX_WORDS_PER_SET).map(async word => ({
      id: createId(),
      noun: String(word.noun || ""),
      form: ["der", "die", "das", "pl"].includes(word.form) ? word.form : null,
      image: await dataUrlToBlob(word.image),
      audio: word.audio ? await dataUrlToBlob(word.audio) : null,
      credit: word.credit === "ARASAAC" ? "ARASAAC" : null
    })));

    await saveSet(set, words);
    renderSetList();
  } catch (error) {
    alert("Diese Datei konnte nicht als Wortset gelesen werden.");
  }
}

/* ---------- Lernstand ---------- */

async function showStats(set, words) {
  statsSet = set;
  statsWords = words;
  statsTitle.textContent = "Lernstand: " + set.name;

  const stats = await getStats(getAllStatKeys(words));

  const cell = entry => {
    const state = getLearningState(entry);
    const stateClass = state === "sicher" ? "state-sure" : state === "neu" ? "state-new" : "state-practice";

    return "<td>" + (entry ? entry.firstTry : 0) + " von " + (entry ? entry.seen : 0) +
      " <span class=\"state " + stateClass + "\">" + state + "</span></td>";
  };

  const rows = words.map(word => {
    return "<tr>" +
      "<td>" + escapeHtml(getDisplayName(word)) + "</td>" +
      cell(stats[word.id]) +
      (HOUSE_FORMS.includes(word.form) ? cell(stats["artikel:" + word.id]) : "<td class=\"hint\">–</td>") +
      "</tr>";
  }).join("");

  statsTable.innerHTML = "<table class=\"stats\"><thead><tr>" +
    "<th>Wort</th><th>Bild finden</th><th>Artikel-Häuser</th>" +
    "</tr></thead><tbody>" + rows + "</tbody></table>";

  showScreen(statsScreen);
}

async function resetStatsOfSet() {
  if (!statsSet) return;
  if (!confirm("Lernstand für „" + statsSet.name + "“ zurücksetzen?")) return;

  await resetStats(getAllStatKeys(statsWords));
  showStats(statsSet, statsWords);
}

/* ---------- Spiel ---------- */

// Lernstand-Schlüssel: Wort-ID für "Bild finden", "artikel:<ID>" für Artikel-Häuser
function getAllStatKeys(words) {
  return words.flatMap(word => [word.id, "artikel:" + word.id]);
}

function setGameMode(mode) {
  gameMode = mode;
  pickGame.classList.toggle("hidden", mode !== "pick");
  houseGame.classList.toggle("hidden", mode !== "houses");
}

function startGame(set, words) {
  unlockAudio();
  setGameMode("pick");

  images.forEach(image => URL.revokeObjectURL(image.url));

  images = words
    .filter(word => word.form)
    .map(word => ({
      id: word.id,
      noun: word.noun,
      form: word.form,
      audio: word.audio || null,
      url: URL.createObjectURL(word.image)
    }));

  numberOfChoices = Math.min(settings.numberOfChoices, images.length);

  showScreen(null);

  settingsButton.classList.add("hidden");
  nextButton.classList.add("hidden");
  repeatButton.classList.remove("hidden");

  targetQueue = [];
  lastTarget = null;
  roundsPlayed = 0;
  correctOnFirstTry = 0;
  updateScore();

  speak("Los geht's.", () => {
    nextRound();
  });
}

function openSettings() {
  stopSpeaking();
  stopHouseGame();
  setGameMode("pick");

  answered = false;
  correctImage = null;
  currentChoices = [];

  imageGrid.innerHTML = "";
  answerWord.classList.add("hidden");
  scoreDisplay.classList.add("hidden");

  instruction.textContent = "Höre gut zu und tippe auf das passende Bild.";

  repeatButton.classList.add("hidden");
  nextButton.classList.add("hidden");
  settingsButton.classList.add("hidden");

  showHome();
}

function nextRound() {
  answered = false;
  mistakeInRound = false;

  nextButton.classList.add("hidden");
  settingsButton.classList.add("hidden");
  answerWord.classList.add("hidden");

  imageGrid.innerHTML = "";
  imageGrid.style.setProperty("--columns", numberOfChoices);

  correctImage = getNextTarget();
  lastTarget = correctImage;

  const distractors = shuffle(images.filter(image => image !== correctImage))
    .slice(0, numberOfChoices - 1);

  currentChoices = shuffle([correctImage, ...distractors]);

  renderImageCards();

  instruction.textContent = "Höre gut zu und tippe auf das passende Bild.";

  setTimeout(() => {
    speakCurrentWord();
  }, 500);
}

function getNextTarget() {
  if (targetQueue.length === 0) {
    targetQueue = shuffle(images);

    // Nicht dasselbe Bild zweimal hintereinander suchen lassen
    if (targetQueue.length > 1 && targetQueue[targetQueue.length - 1] === lastTarget) {
      targetQueue.unshift(targetQueue.pop());
    }
  }

  return targetQueue.pop();
}

function renderImageCards() {
  currentChoices.forEach(image => {
    const card = document.createElement("div");
    card.classList.add("image-card");
    card.setAttribute("role", "button");
    card.tabIndex = 0;

    const img = document.createElement("img");
    img.src = image.url;
    img.alt = getDisplayName(image);

    card.appendChild(img);

    card.addEventListener("click", () => {
      checkAnswer(image, card);
    });

    card.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        checkAnswer(image, card);
      }
    });

    imageGrid.appendChild(card);
  });
}

function shuffle(array) {
  const result = [...array];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

function speakCurrentWord() {
  if (!correctImage) return;

  if (settings.recordings && correctImage.audio) {
    playRecording(correctImage.audio);
    return;
  }

  speak(buildQuestionForImage(correctImage));
}

function updateScore() {
  if (roundsPlayed === 0) {
    scoreDisplay.classList.add("hidden");
    return;
  }

  scoreDisplay.textContent =
    "Beim ersten Versuch richtig: " + correctOnFirstTry + " von " + roundsPlayed;
  scoreDisplay.classList.remove("hidden");
}

function showAnswerWord(word) {
  if (settings.genusColors) {
    answerWord.innerHTML = "<span class=\"genus-" + word.form + "\">" + escapeHtml(getArticle(word)) + "</span> " +
      escapeHtml(word.noun);
  } else {
    answerWord.textContent = getDisplayName(word);
  }

  answerWord.classList.remove("hidden");
}

function checkAnswer(selectedImage, selectedCard) {
  if (answered || !correctImage) return;
  if (selectedCard.classList.contains("ruled-out")) return;

  if (selectedImage === correctImage) {
    answered = true;

    roundsPlayed++;
    if (!mistakeInRound) correctOnFirstTry++;
    updateScore();

    recordResult(correctImage.id, !mistakeInRound).catch(() => {});

    imageGrid.querySelectorAll(".image-card").forEach(card => card.classList.remove("hint"));
    selectedCard.classList.add("correct");

    const feedback = settings.calm
      ? { text: "Richtig!", animation: "stars" }
      : getRandomItem(correctMessages);

    instruction.textContent = feedback.text;
    showAnswerWord(correctImage);

    // Das Wort wird zum Schluss noch einmal als Satz vorgesprochen
    speak(feedback.text + " " + buildModelSentence(correctImage));
    createCelebration(selectedCard, feedback.animation, settings.calm);

    setTimeout(() => {
      nextButton.classList.remove("hidden");
      settingsButton.classList.remove("hidden");
    }, 1200);

    return;
  }

  mistakeInRound = true;

  selectedCard.classList.add("wrong");

  if (settings.errorless) {
    // Hilfe: falsches Bild ausgrauen, richtiges Bild zeigen und benennen
    selectedCard.classList.add("ruled-out");

    const correctCard = imageGrid.children[currentChoices.indexOf(correctImage)];
    correctCard.classList.add("hint");

    const hintText = buildHintSentence(correctImage);
    instruction.textContent = "Schau mal, hier!";
    speak("Schau mal. " + hintText);
  } else {
    const wrongMessage = settings.calm ? "Noch einmal." : getRandomItem(wrongMessages);
    instruction.textContent = wrongMessage;

    // Nach dem Hinweis wird die Frage automatisch wiederholt
    speak(wrongMessage, () => {
      if (!answered) speakCurrentWord();
    });
  }

  setTimeout(() => {
    selectedCard.classList.remove("wrong");
  }, 900);
}

/* ---------- Hilfsfunktionen ---------- */

function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

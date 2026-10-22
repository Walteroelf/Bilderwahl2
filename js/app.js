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
  roundLength: 10,
  errorless: true,
  calm: false,
  genusColors: true,
  recordings: false,
  housesSayArticle: true,
  scratchBrush: "mittel",
  scratchReveal: 0.8,
  codeLock: true,
  bundledVoice: true
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
const fieldScreen = document.getElementById("fieldScreen");
const exerciseScreen = document.getElementById("exerciseScreen");
const editorScreen = document.getElementById("editorScreen");
const statsScreen = document.getElementById("statsScreen");

const fieldGrid = document.getElementById("fieldGrid");
const setupInfo = document.getElementById("setupInfo");
const restoreFieldsButton = document.getElementById("restoreFieldsButton");
const selectionInfo = document.getElementById("selectionInfo");
const clearSelectionButton = document.getElementById("clearSelectionButton");
const toExerciseButton = document.getElementById("toExerciseButton");

const fieldTitle = document.getElementById("fieldTitle");
const fieldInfo = document.getElementById("fieldInfo");
const fieldWords = document.getElementById("fieldWords");
const fieldActions = document.getElementById("fieldActions");
const fieldBackButton = document.getElementById("fieldBackButton");

const exerciseInfo = document.getElementById("exerciseInfo");
const exercisePick = document.getElementById("exercisePick");
const exercisePickNote = document.getElementById("exercisePickNote");
const exerciseYesNo = document.getElementById("exerciseYesNo");
const exerciseYesNoNote = document.getElementById("exerciseYesNoNote");
const exerciseMemory = document.getElementById("exerciseMemory");
const exerciseMemoryNote = document.getElementById("exerciseMemoryNote");
const exerciseHouses = document.getElementById("exerciseHouses");
const exerciseHousesNote = document.getElementById("exerciseHousesNote");
const exerciseSort = document.getElementById("exerciseSort");
const exerciseSortNote = document.getElementById("exerciseSortNote");
const exerciseNaming = document.getElementById("exerciseNaming");
const exerciseNamingNote = document.getElementById("exerciseNamingNote");
const exerciseScratch = document.getElementById("exerciseScratch");
const exerciseScratchNote = document.getElementById("exerciseScratchNote");
const exerciseBackButton = document.getElementById("exerciseBackButton");
const newSetButton = document.getElementById("newSetButton");
const importSetButton = document.getElementById("importSetButton");
const importInput = document.getElementById("importInput");

const imageCountSelect = document.getElementById("imageCountSelect");
const roundLengthSelect = document.getElementById("roundLengthSelect");
const errorlessToggle = document.getElementById("errorlessToggle");
const calmToggle = document.getElementById("calmToggle");
const genusToggle = document.getElementById("genusToggle");
const recordingsToggle = document.getElementById("recordingsToggle");
const housesArticleToggle = document.getElementById("housesArticleToggle");
const scratchBrushSelect = document.getElementById("scratchBrushSelect");
const codeLockToggle = document.getElementById("codeLockToggle");
const scratchRevealSelect = document.getElementById("scratchRevealSelect");
const bundledVoiceToggle = document.getElementById("bundledVoiceToggle");

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
const scoreDisplay = document.getElementById("score");

const repeatButton = document.getElementById("repeatButton");
const nextButton = document.getElementById("nextButton");

/* ---------- Zustand ---------- */

// Wortfeld, das gerade bearbeitet wird
let editingSet = null;
let editingWords = [];
let activeRecorder = null;

// Wortfeld, dessen Lernstand angezeigt wird
let statsSet = null;
let statsWords = [];


/* ---------- Start ---------- */

applySettingsToForm();
document.getElementById("homeCredit").innerHTML = ARASAAC_CREDIT_HTML;
requestPersistentStorage();

// Erst starten, wenn alle Skripte geladen sind (auch die weiter unten)
document.addEventListener("DOMContentLoaded", showHome);

imageCountSelect.addEventListener("change", updateSettingsFromForm);
roundLengthSelect.addEventListener("change", updateSettingsFromForm);
errorlessToggle.addEventListener("change", updateSettingsFromForm);
calmToggle.addEventListener("change", updateSettingsFromForm);
genusToggle.addEventListener("change", updateSettingsFromForm);
recordingsToggle.addEventListener("change", updateSettingsFromForm);
housesArticleToggle.addEventListener("change", updateSettingsFromForm);
scratchBrushSelect.addEventListener("change", updateSettingsFromForm);
codeLockToggle.addEventListener("change", updateSettingsFromForm);
scratchRevealSelect.addEventListener("change", updateSettingsFromForm);
bundledVoiceToggle.addEventListener("change", updateSettingsFromForm);

newSetButton.addEventListener("click", () => openEditor(null));
restoreFieldsButton.addEventListener("click", restoreHiddenFields);
clearSelectionButton.addEventListener("click", clearSelection);
toExerciseButton.addEventListener("click", showExercise);
fieldBackButton.addEventListener("click", showHome);
exerciseBackButton.addEventListener("click", showHome);
exercisePick.addEventListener("click", () => startPickGame(exerciseSet, exerciseWords));
exerciseYesNo.addEventListener("click", () => startYesNoGame(exerciseSet, exerciseWords));
exerciseMemory.addEventListener("click", () => startMemoryGame(exerciseSet, exerciseWords));
exerciseHouses.addEventListener("click", () => startHouseGame(exerciseSet, exerciseWords));
exerciseSort.addEventListener("click", () => startFieldSortGame(exerciseSet, exerciseAllWords, buildFieldBins(exerciseItems)));
exerciseNaming.addEventListener("click", () => startNamingGame(exerciseSet, exerciseWords));
exerciseScratch.addEventListener("click", () => startScratchGame(exerciseSet, exerciseWords));
importSetButton.addEventListener("click", () => importInput.click());
importInput.addEventListener("change", importSetFromFile);

fileInput.addEventListener("change", addFilesToEditor);
saveSetButton.addEventListener("click", saveEditor);
cancelEditButton.addEventListener("click", closeEditor);
wordRows.addEventListener("click", handleWordRowClick);
wordRows.addEventListener("change", handleWordRowChange);

statsBackButton.addEventListener("click", () => showField(statsSet.id));
statsResetButton.addEventListener("click", resetStatsOfSet);

repeatButton.addEventListener("click", () => {
  if (session.game) session.game.repeat();
});
nextButton.addEventListener("click", () => nextItem());

function applySettingsToForm() {
  imageCountSelect.value = String(settings.numberOfChoices);
  roundLengthSelect.value = String(settings.roundLength);
  errorlessToggle.checked = settings.errorless;
  calmToggle.checked = settings.calm;
  genusToggle.checked = settings.genusColors;
  recordingsToggle.checked = settings.recordings;
  housesArticleToggle.checked = settings.housesSayArticle;
  scratchBrushSelect.value = settings.scratchBrush;
  codeLockToggle.checked = settings.codeLock;
  scratchRevealSelect.value = String(settings.scratchReveal);
  bundledVoiceToggle.checked = settings.bundledVoice;
  setBundledVoiceEnabled(settings.bundledVoice);
}

function updateSettingsFromForm() {
  settings = {
    numberOfChoices: Number(imageCountSelect.value),
    roundLength: Number(roundLengthSelect.value),
    errorless: errorlessToggle.checked,
    calm: calmToggle.checked,
    genusColors: genusToggle.checked,
    recordings: recordingsToggle.checked,
    housesSayArticle: housesArticleToggle.checked,
    scratchBrush: scratchBrushSelect.value,
    codeLock: codeLockToggle.checked,
    scratchReveal: Number(scratchRevealSelect.value),
    bundledVoice: bundledVoiceToggle.checked
  };

  setBundledVoiceEnabled(settings.bundledVoice);
  saveSettings();
}

function showScreen(screen) {
  [homeScreen, fieldScreen, exerciseScreen, editorScreen, statsScreen].forEach(element => {
    element.classList.toggle("hidden", element !== screen);
  });
}

/* ---------- Startseite: Übersicht der Wortfelder ---------- */

const SELECTION_KEY = "bilderwahl-auswahl";
const HIDDEN_FIELDS_KEY = "bilderwahl-ausgeblendet";

// Alle Wortfelder mit ihren Wörtern, wie sie zuletzt angezeigt wurden
let homeData = [];
let homeImageUrls = [];
let selectedIds = new Set(loadList(SELECTION_KEY));
let libraryInstall = null;

function loadList(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return Array.isArray(value) ? value : [];
  } catch (error) {
    return [];
  }
}

function saveList(key, list) {
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch (error) {
    // nur eine Bequemlichkeit
  }
}

function saveSelection() {
  saveList(SELECTION_KEY, [...selectedIds]);
}

/*
  Mitgelieferte Wortfelder werden beim ersten Start einmal auf dem Gerät
  angelegt. Danach sind sie normale Wortfelder: bearbeitbar, mit Lernstand.
  Gelöschte mitgelieferte Wortfelder werden gemerkt und nicht neu angelegt.
*/
function ensureLibraryInstalled() {
  if (!libraryInstall) {
    libraryInstall = installMissingLibraryFields().finally(() => {
      libraryInstall = null;
    });
  }

  return libraryInstall;
}

async function installMissingLibraryFields() {
  const sets = await getAllSets();
  const hidden = loadList(HIDDEN_FIELDS_KEY);

  // Ältere Versionen haben Wortfelder ohne Kennung angelegt: anhand des Namens zuordnen
  for (const set of sets) {
    if (set.libraryId) continue;

    const field = WORD_FIELDS.find(item => item.name === set.name);
    if (!field || sets.some(other => other.libraryId === field.id)) continue;

    const words = await getWordsOfSet(set.id);
    if (words.length > 0 && words.every(word => word.credit === "ARASAAC")) {
      set.libraryId = field.id;
      await saveSetInfo(set);
    }
  }

  const installed = new Set(sets.map(set => set.libraryId).filter(Boolean));
  const missing = WORD_FIELDS.filter(field => !installed.has(field.id) && !hidden.includes(field.id));

  if (missing.length === 0) return;

  setupInfo.textContent = "Wortfelder werden eingerichtet …";
  setupInfo.classList.remove("hidden");

  let done = 0;

  for (const field of missing) {
    await addWordFieldAsSet(field);
    done++;
    setupInfo.textContent = "Wortfelder werden eingerichtet … " + done + " von " + missing.length;
  }

  setupInfo.classList.add("hidden");
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

  // Mitgelieferte Wortfelder stehen in der Reihenfolge der Sammlung vor den eigenen
  const order = WORD_FIELDS.indexOf(field);

  await saveSet({ id: createId(), name: field.name, libraryId: field.id, createdAt: order }, words);
}

async function showHome() {
  showScreen(homeScreen);

  try {
    await ensureLibraryInstalled();
  } catch (error) {
    console.warn("Wortfelder konnten nicht eingerichtet werden:", error);
    setupInfo.textContent = "Einige mitgelieferte Wortfelder konnten nicht eingerichtet werden. " +
      "Bitte später mit Internetverbindung noch einmal öffnen.";
    setupInfo.classList.remove("hidden");
  }

  await renderHome();
}

async function renderHome() {
  let sets;

  try {
    sets = await getAllSets();
  } catch (error) {
    fieldGrid.innerHTML = "<p class=\"warning\">Dieser Browser kann keine Wortfelder speichern " +
      "(z. B. im privaten Modus). Bitte in einem normalen Fenster öffnen.</p>";
    newSetButton.disabled = true;
    importSetButton.disabled = true;
    return;
  }

  homeData = await Promise.all(sets.map(async set => ({ set: set, words: await getWordsOfSet(set.id) })));

  // Auswahl von gelöschten Wortfeldern bereinigen
  selectedIds = new Set([...selectedIds].filter(id => homeData.some(item => item.set.id === id)));
  saveSelection();

  homeImageUrls.forEach(url => URL.revokeObjectURL(url));
  homeImageUrls = [];

  fieldGrid.innerHTML = "";

  homeData.forEach(({ set, words }) => {
    const tile = document.createElement("div");
    tile.className = "field-tile" + (selectedIds.has(set.id) ? " selected" : "");

    const open = document.createElement("button");
    open.className = "field-open";
    open.setAttribute("aria-label", set.name + " ansehen");

    const cover = document.createElement("span");
    cover.className = "field-cover";

    if (words[0]) {
      const img = document.createElement("img");
      const url = URL.createObjectURL(words[0].image);
      homeImageUrls.push(url);
      img.src = url;
      img.alt = "";
      cover.appendChild(img);
    }

    const name = document.createElement("span");
    name.className = "field-name";
    name.textContent = set.name;

    const count = document.createElement("span");
    count.className = "field-count";
    count.textContent = words.length + " Wörter" + (set.libraryId ? "" : " · eigenes");

    open.appendChild(cover);
    open.appendChild(name);
    open.appendChild(count);
    open.addEventListener("click", () => showField(set.id));

    const check = document.createElement("label");
    check.className = "field-check";

    const box = document.createElement("input");
    box.type = "checkbox";
    box.checked = selectedIds.has(set.id);
    box.setAttribute("aria-label", set.name + " auswählen");
    box.addEventListener("change", () => {
      toggleSelection(set.id, box.checked);
      tile.classList.toggle("selected", box.checked);
    });

    check.appendChild(box);

    tile.appendChild(open);
    tile.appendChild(check);
    fieldGrid.appendChild(tile);
  });

  restoreFieldsButton.classList.toggle("hidden", loadList(HIDDEN_FIELDS_KEY).length === 0);

  updateSelectionBar();
}

function toggleSelection(setId, selected) {
  if (selected) {
    selectedIds.add(setId);
  } else {
    selectedIds.delete(setId);
  }

  saveSelection();
  updateSelectionBar();
}

function getSelectedData() {
  return homeData.filter(item => selectedIds.has(item.set.id));
}

// Wörter mehrerer Wortfelder zusammenführen; doppelte Wörter nur einmal
function combineWords(items) {
  const seen = new Set();
  const result = [];

  items.forEach(({ words }) => {
    words.forEach(word => {
      const key = (word.form || "") + "|" + word.noun.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      result.push(word);
    });
  });

  return result;
}

function updateSelectionBar() {
  const items = getSelectedData();
  const words = combineWords(items);

  if (items.length === 0) {
    selectionInfo.textContent = "Noch kein Wortfeld ausgewählt";
  } else {
    selectionInfo.textContent = items.length + (items.length === 1 ? " Wortfeld" : " Wortfelder") +
      " · " + words.length + " Wörter";
  }

  toExerciseButton.disabled = items.length === 0;
  clearSelectionButton.classList.toggle("hidden", items.length === 0);
}

function clearSelection() {
  selectedIds.clear();
  saveSelection();
  renderHome();
}

async function restoreHiddenFields() {
  saveList(HIDDEN_FIELDS_KEY, []);
  await showHome();
}

/* ---------- Ein Wortfeld im Detail ---------- */

let fieldImageUrls = [];

async function showField(setId) {
  const sets = await getAllSets();
  const set = sets.find(item => item.id === setId);

  if (!set) {
    showHome();
    return;
  }

  const words = await getWordsOfSet(set.id);
  const missing = words.filter(word => !word.form).length;
  const usesArasaac = words.some(word => word.credit === "ARASAAC");

  fieldTitle.textContent = set.name;
  fieldInfo.innerHTML = words.length + " Wörter" +
    (set.libraryId ? " · mitgeliefert" : " · eigenes Wortfeld") +
    (usesArasaac ? " · Piktogramme: ARASAAC" : "") +
    (missing > 0 ? " · <span class=\"warning\">" + missing + " ohne Artikel (werden nicht geübt)</span>" : "");

  fieldImageUrls.forEach(url => URL.revokeObjectURL(url));
  fieldImageUrls = [];

  fieldWords.innerHTML = "";

  words.forEach(word => {
    const item = document.createElement("figure");
    item.className = "field-word";

    const img = document.createElement("img");
    const url = URL.createObjectURL(word.image);
    fieldImageUrls.push(url);
    img.src = url;
    img.alt = "";

    const caption = document.createElement("figcaption");

    if (word.form) {
      caption.innerHTML = "<span class=\"genus-" + word.form + "\">" + escapeHtml(getArticle(word)) + "</span> " +
        escapeHtml(word.noun);
    } else {
      caption.innerHTML = escapeHtml(word.noun) + " <span class=\"warning\">?</span>";
    }

    item.appendChild(img);
    item.appendChild(caption);
    fieldWords.appendChild(item);
  });

  fieldActions.innerHTML = "";

  fieldActions.appendChild(makeButton("Nur dieses Wortfeld üben", "", () => {
    selectedIds = new Set([set.id]);
    saveSelection();
    showExercise();
  }));

  const inSelection = selectedIds.has(set.id);
  fieldActions.appendChild(makeButton(inSelection ? "Aus der Auswahl nehmen" : "Zur Auswahl hinzufügen", "secondary", () => {
    toggleSelection(set.id, !inSelection);
    showField(set.id);
  }));

  fieldActions.appendChild(makeButton("Bearbeiten", "secondary", () => openEditor(set)));
  fieldActions.appendChild(makeButton("Lernstand", "secondary", () => showStats(set, words)));
  fieldActions.appendChild(makeButton("Exportieren", "secondary", () => exportSet(set, words)));
  fieldActions.appendChild(makeButton("Löschen", "secondary danger", () => confirmDeleteSet(set)));

  showScreen(fieldScreen);
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
  const message = set.libraryId
    ? "Wortfeld „" + set.name + "“ mit allen Änderungen und dem Lernstand löschen?\n\n" +
      "Mitgelieferte Wortfelder lassen sich auf der Startseite über „Gelöschte Wortfelder wiederherstellen“ zurückholen."
    : "Wortfeld „" + set.name + "“ mit allen Bildern, Aufnahmen und dem Lernstand löschen?";

  if (!confirm(message)) return;

  if (set.libraryId) {
    saveList(HIDDEN_FIELDS_KEY, [...new Set([...loadList(HIDDEN_FIELDS_KEY), set.libraryId])]);
  }

  await deleteSet(set.id);
  selectedIds.delete(set.id);
  saveSelection();
  showHome();
}

/* ---------- Übung auswählen ---------- */

let exerciseSet = null;
let exerciseWords = [];
let exerciseAllWords = [];
let exerciseItems = [];

function setExerciseState(button, note, available, text, reason) {
  button.disabled = !available;
  note.textContent = available ? text : reason;
}

function showExercise() {
  const items = getSelectedData();

  if (items.length === 0) {
    showHome();
    return;
  }

  exerciseItems = items;
  exerciseWords = combineWords(items);
  exerciseAllWords = items.flatMap(item => item.words);
  exerciseSet = { id: "auswahl", name: items.map(item => item.set.name).join(", ") };

  exerciseInfo.textContent = exerciseSet.name + " · " + exerciseWords.length + " Wörter";

  const withArticle = exerciseWords.filter(word => word.form).length;
  const houseCount = getHouseWords(exerciseWords).length;
  const perRound = getRoundLength() || withArticle;

  setExerciseState(exercisePick, exercisePickNote, withArticle >= settings.numberOfChoices,
    Math.min(perRound, withArticle) + " Aufgaben · " + settings.numberOfChoices + " Bilder zur Auswahl",
    "Mindestens " + settings.numberOfChoices + " Wörter mit Artikel nötig.");

  setExerciseState(exerciseYesNo, exerciseYesNoNote, withArticle >= 2,
    Math.min(perRound, withArticle) + " Aufgaben",
    "Mindestens 2 Wörter mit Artikel nötig.");

  setExerciseState(exerciseMemory, exerciseMemoryNote, exerciseWords.length >= 3,
    Math.min(MEMORY_PAIRS, exerciseWords.length) + " Paare",
    "Mindestens 3 Wörter nötig.");

  setExerciseState(exerciseHouses, exerciseHousesNote, houseCount >= 2,
    Math.min(getRoundLength() || houseCount, houseCount) + " Bilder zum Einsortieren",
    "Mindestens 2 Wörter mit Artikel nötig.");

  setExerciseState(exerciseSort, exerciseSortNote, items.length >= 2 && items.length <= 4,
    items.length + " Häuser: " + items.map(item => item.set.name).join(", "),
    items.length < 2 ? "Dafür 2 bis 4 Wortfelder auswählen." : "Höchstens 4 Wortfelder auswählen.");

  setExerciseState(exerciseNaming, exerciseNamingNote, withArticle >= 1,
    Math.min(perRound, withArticle) + " Aufgaben" + (canRecordAudio() ? " · mit Aufnahme" : ""),
    "Mindestens 1 Wort mit Artikel nötig.");

  setExerciseState(exerciseScratch, exerciseScratchNote, exerciseWords.length >= 1,
    Math.min(getRoundLength() || SCRATCH_ROUND, SCRATCH_ROUND, exerciseWords.length) + " Bilder",
    "Mindestens 1 Wort nötig.");

  showScreen(exerciseScreen);
}

/* ---------- Wortfeld bearbeiten ---------- */

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

  editorTitle.textContent = set ? "Wortfeld bearbeiten" : "Neues Wortfeld";
  setNameInput.value = editingSet.name;
  fileInput.value = "";
  fileInfo.textContent = "";

  renderWordRows();
  showScreen(editorScreen);

  if (!set) setNameInput.focus();
}

function closeEditor() {
  const setId = editingSet && editingSet.id;

  stopActiveRecording();
  editingWords.forEach(word => URL.revokeObjectURL(word.imageUrl));
  editingWords = [];
  editingSet = null;

  // Zurück zum Wortfeld, falls es gespeichert ist – sonst zur Übersicht
  showField(setId);
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
    messages.push(skipped + " Bild(er) übersprungen – höchstens " + MAX_WORDS_PER_SET + " Wörter pro Wortfeld.");
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

  editingSet.name = setNameInput.value.trim() || "Wortfeld ohne Namen";

  try {
    await saveSet(editingSet, editingWords);
  } catch (error) {
    fileInfo.textContent = "Speichern hat nicht geklappt. Ist der Speicher des Geräts voll?";
    return;
  }

  closeEditor();
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
  link.download = "Wortfeld " + set.name.replace(/[\\/:*?"<>|]+/g, "") + ".json";
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
      throw new Error("Keine Wortfeld-Datei");
    }

    const set = { id: createId(), name: String(data.name || "Importiertes Wortfeld"), createdAt: Date.now() };

    const words = await Promise.all(data.words.slice(0, MAX_WORDS_PER_SET).map(async word => ({
      id: createId(),
      noun: String(word.noun || ""),
      form: ["der", "die", "das", "pl"].includes(word.form) ? word.form : null,
      image: await dataUrlToBlob(word.image),
      audio: word.audio ? await dataUrlToBlob(word.audio) : null,
      credit: word.credit === "ARASAAC" ? "ARASAAC" : null
    })));

    await saveSet(set, words);
    renderHome();
  } catch (error) {
    alert("Diese Datei konnte nicht als Wortfeld gelesen werden.");
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
      " <span class=\"state " + stateClass + "\">" + state + "</span>" +
      (entry && entry.box ? "<br /><span class=\"hint\">Fach " + entry.box + " · " + formatDue(entry.due) + "</span>" : "") +
      "</td>";
  };

  const rows = words.map(word => {
    return "<tr>" +
      "<td>" + escapeHtml(getDisplayName(word)) + "</td>" +
      STAT_EXERCISES.map(exercise =>
        word.form ? cell(stats[statKey(exercise.prefix, word.id)]) : "<td class=\"hint\">–</td>"
      ).join("") +
      "</tr>";
  }).join("");

  statsTable.innerHTML = "<div class=\"table-scroll\"><table class=\"stats\"><thead><tr>" +
    "<th>Wort</th>" + STAT_EXERCISES.map(exercise => "<th>" + exercise.name + "</th>").join("") +
    "</tr></thead><tbody>" + rows + "</tbody></table></div>";

  showScreen(statsScreen);
}

async function resetStatsOfSet() {
  if (!statsSet) return;
  if (!confirm("Lernstand für „" + statsSet.name + "“ zurücksetzen?")) return;

  await resetStats(getAllStatKeys(statsWords));
  showStats(statsSet, statsWords);
}

/* ---------- Übungen (die Übungen selbst stehen in session.js, pick.js usw.) ---------- */

// Übungen mit Lernstand und ihr Schlüssel im Lernstand
const STAT_EXERCISES = [
  { prefix: null, name: "Bild finden" },
  { prefix: "janein", name: "Ja/Nein" },
  { prefix: "artikel", name: "Artikel" },
  { prefix: "benennen", name: "Benennen" }
];

function getAllStatKeys(words) {
  return words.flatMap(word => STAT_EXERCISES.map(exercise => statKey(exercise.prefix, word.id)));
}

function formatDue(due) {
  if (!due || due <= Date.now()) return "jetzt fällig";

  const days = Math.ceil((due - Date.now()) / DAY);
  return days === 1 ? "wieder in 1 Tag" : "wieder in " + days + " Tagen";
}

// Zurück aus einer Übung zur Übersicht
function backToOverview() {
  stopActiveGame();
  gearButton.classList.add("hidden");

  instruction.textContent = "Höre gut zu und tippe auf das passende Bild.";
  answerWord.classList.add("hidden");
  scoreDisplay.classList.add("hidden");

  repeatButton.classList.add("hidden");
  nextButton.classList.add("hidden");

  showHome();
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

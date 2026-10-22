/*
  Zugang zu den Einstellungen über das Zahnrad – jederzeit, auch mitten in
  einer Übung. Wie im Kirmes-Kiosk fragt die App vorher einen Zahlen-Code ab:
  vier Zahlen werden als Wörter angezeigt ("drei – sieben – eins – vier").
  Wer lesen kann, kommt hinein; Kinder tippen nicht versehentlich hinein.
*/

const NUMBER_WORDS = ["null", "eins", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun"];

const gearButton = document.getElementById("gearButton");
const homeGearButton = document.getElementById("homeGearButton");
const codeScreen = document.getElementById("codeScreen");
const codeWords = document.getElementById("codeWords");
const codeDots = document.getElementById("codeDots");
const keypad = document.getElementById("keypad");
const codeError = document.getElementById("codeError");
const settingsScreen = document.getElementById("settingsScreen");
const settingsContinueButton = document.getElementById("settingsContinueButton");
const settingsEndButton = document.getElementById("settingsEndButton");
const settingsCloseButton = document.getElementById("settingsCloseButton");

let expectedCode = "";
let enteredCode = "";
let afterCode = null;

gearButton.addEventListener("click", () => requestSettings(true));
homeGearButton.addEventListener("click", () => requestSettings(false));

keypad.addEventListener("click", event => {
  const key = event.target.closest("button[data-key]");
  if (key) pressCodeKey(key.dataset.key);
});

document.addEventListener("keydown", event => {
  if (codeScreen.classList.contains("hidden")) return;

  if (/^[0-9]$/.test(event.key)) pressCodeKey(event.key);
  else if (event.key === "Backspace") pressCodeKey("back");
  else if (event.key === "Escape") pressCodeKey("cancel");
});

settingsContinueButton.addEventListener("click", () => {
  settingsScreen.classList.add("hidden");

  // Die laufende Aufgabe noch einmal ansagen, damit das Kind wieder einsteigt
  if (session.game) session.game.repeat();
});

settingsEndButton.addEventListener("click", () => {
  settingsScreen.classList.add("hidden");
  backToOverview();
});

settingsCloseButton.addEventListener("click", () => {
  settingsScreen.classList.add("hidden");
  renderHome();
});

function requestSettings(fromGame) {
  // Die Sprachausgabe läuft zu Ende: Manche Übungen schalten erst am Ende
  // eines Satzes zur nächsten Aufgabe weiter und würden sonst hängen bleiben.
  if (settings.codeLock) {
    askForCode(() => openSettingsScreen(fromGame));
  } else {
    openSettingsScreen(fromGame);
  }
}

function askForCode(onSuccess) {
  afterCode = onSuccess;
  newCode();
  codeError.textContent = "";
  codeScreen.classList.remove("hidden");
}

function newCode() {
  expectedCode = Array.from({ length: 4 }, () => String(Math.floor(Math.random() * 10))).join("");
  enteredCode = "";
  codeWords.textContent = [...expectedCode].map(digit => NUMBER_WORDS[digit]).join(" – ");
  updateCodeDots();
}

function updateCodeDots() {
  [...codeDots.children].forEach((dot, index) => dot.classList.toggle("filled", index < enteredCode.length));
}

function pressCodeKey(key) {
  if (key === "cancel") {
    codeScreen.classList.add("hidden");
    afterCode = null;
    if (session.game) session.game.repeat();
    return;
  }

  if (key === "back") {
    enteredCode = enteredCode.slice(0, -1);
    updateCodeDots();
    return;
  }

  if (enteredCode.length >= 4) return;

  enteredCode += key;
  updateCodeDots();

  if (enteredCode.length < 4) return;

  if (enteredCode === expectedCode) {
    codeScreen.classList.add("hidden");
    const next = afterCode;
    afterCode = null;
    if (next) next();
    return;
  }

  // Falsch: neue Zahlen, damit nicht einfach probiert werden kann
  codeError.textContent = "Das war nicht richtig. Bitte die neuen Zahlen eintippen.";
  setTimeout(newCode, 400);
}

function openSettingsScreen(fromGame) {
  const inGame = fromGame && Boolean(session.game);

  settingsContinueButton.classList.toggle("hidden", !inGame);
  settingsEndButton.classList.toggle("hidden", !inGame);
  settingsCloseButton.classList.toggle("hidden", inGame);

  applySettingsToForm();
  updateOfflineStatus();

  settingsScreen.classList.remove("hidden");
  settingsScreen.querySelector(".modal").scrollTop = 0;
}

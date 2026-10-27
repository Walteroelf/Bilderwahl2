/*
  Speicherung auf dem Gerät (IndexedDB).

  sets:  { id, name, createdAt, libraryId }
         libraryId: Kennung des mitgelieferten Wortfelds (sonst fehlt sie = eigenes)
  words: { id, setId, noun, form, image (Blob), audio (Blob | null), credit, order }
         credit: Herkunft des Bildes, z. B. "ARASAAC" (sonst null = eigenes Bild)
  stats: { wordId, seen, firstTry, history: [true/false …], lastSeen, box, due }
         wordId: Wort-ID ("Bild finden") oder "<übung>:<Wort-ID>" für andere Übungen
         box/due: Lernfach 1–5 und Zeitpunkt der nächsten Wiederholung

  Alles bleibt lokal im Browser dieses Geräts.
*/

const DB_NAME = "bilderwahl";
const DB_VERSION = 1;

let dbPromise = null;

function openDatabase() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains("sets")) {
        db.createObjectStore("sets", { keyPath: "id" });
      }

      if (!db.objectStoreNames.contains("words")) {
        const words = db.createObjectStore("words", { keyPath: "id" });
        words.createIndex("setId", "setId");
      }

      if (!db.objectStoreNames.contains("stats")) {
        db.createObjectStore("stats", { keyPath: "wordId" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function transactionDone(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

function createId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

async function getAllSets() {
  const db = await openDatabase();
  const sets = await requestToPromise(db.transaction("sets").objectStore("sets").getAll());
  return sets.sort((a, b) => a.createdAt - b.createdAt);
}

async function getWordsOfSet(setId) {
  const db = await openDatabase();
  const index = db.transaction("words").objectStore("words").index("setId");
  const words = await requestToPromise(index.getAll(setId));
  return words.sort((a, b) => a.order - b.order);
}

// Speichert ein Wortset mit allen Wörtern; entfernte Wörter werden gelöscht
async function saveSet(set, words) {
  const db = await openDatabase();
  const existingWords = await getWordsOfSet(set.id);
  const keepIds = new Set(words.map(word => word.id));

  const transaction = db.transaction(["sets", "words", "stats"], "readwrite");
  transaction.objectStore("sets").put(set);

  existingWords
    .filter(word => !keepIds.has(word.id))
    .forEach(word => {
      transaction.objectStore("words").delete(word.id);
      transaction.objectStore("stats").delete(word.id);
    });

  words.forEach((word, index) => {
    transaction.objectStore("words").put({
      id: word.id,
      setId: set.id,
      noun: word.noun,
      form: word.form,
      image: word.image,
      audio: word.audio || null,
      credit: word.credit || null,
      third: word.third || null,
      order: index
    });
  });

  return transactionDone(transaction);
}

// Ändert nur Name/Kennung eines Wortfelds, nicht die Wörter
async function saveSetInfo(set) {
  const db = await openDatabase();
  const transaction = db.transaction("sets", "readwrite");
  transaction.objectStore("sets").put(set);
  return transactionDone(transaction);
}

async function deleteSet(setId) {
  const db = await openDatabase();
  const words = await getWordsOfSet(setId);

  const transaction = db.transaction(["sets", "words", "stats"], "readwrite");
  transaction.objectStore("sets").delete(setId);

  words.forEach(word => {
    transaction.objectStore("words").delete(word.id);
    transaction.objectStore("stats").delete(word.id);
  });

  return transactionDone(transaction);
}

async function getStats(wordIds) {
  const db = await openDatabase();
  const store = db.transaction("stats").objectStore("stats");
  const result = {};

  await Promise.all(wordIds.map(async id => {
    const entry = await requestToPromise(store.get(id));
    if (entry) result[id] = entry;
  }));

  return result;
}

/*
  Wiederholung in Abständen (Leitner-System):
  Auf Anhieb richtig → ein Fach weiter, das Wort kommt erst nach dem
  Abstand des neuen Fachs wieder dran. Fehler → zurück in Fach 1 (sofort
  wieder fällig). "teilweise" (nur beim Benennen) lässt das Fach unverändert.
*/
const DAY = 24 * 60 * 60 * 1000;
const BOX_INTERVALS = { 1: 0, 2: DAY, 3: 3 * DAY, 4: 7 * DAY, 5: 14 * DAY };

// result: true (auf Anhieb richtig), false oder "teilweise"
async function recordResult(wordId, result) {
  const correctOnFirstTry = result === true;
  const db = await openDatabase();
  const transaction = db.transaction("stats", "readwrite");
  const store = transaction.objectStore("stats");

  // Lesen und Schreiben im selben Callback, damit die Transaktion offen bleibt
  const request = store.get(wordId);

  request.onsuccess = () => {
    const entry = request.result || { wordId: wordId, seen: 0, firstTry: 0, history: [] };

    entry.seen++;
    if (correctOnFirstTry) entry.firstTry++;
    entry.history = [...entry.history, correctOnFirstTry].slice(-10);
    entry.lastSeen = Date.now();

    const box = entry.box || 1;
    entry.box = result === true ? Math.min(5, box + 1) : result === "teilweise" ? box : 1;
    entry.due = entry.lastSeen + BOX_INTERVALS[entry.box];

    store.put(entry);
  };

  return transactionDone(transaction);
}

// Löscht alle Einträge, deren Schlüssel so beginnt (z. B. alles eines Kinderprofils)
async function deleteStatsWithPrefix(prefix) {
  const db = await openDatabase();
  const transaction = db.transaction("stats", "readwrite");
  transaction.objectStore("stats").delete(IDBKeyRange.bound(prefix, prefix + "\uffff"));
  return transactionDone(transaction);
}

async function resetStats(wordIds) {
  const db = await openDatabase();
  const transaction = db.transaction("stats", "readwrite");
  wordIds.forEach(id => transaction.objectStore("stats").delete(id));
  return transactionDone(transaction);
}

/*
  Lernstand eines Wortes:
  - "neu":       noch nie oder erst einmal gefragt
  - "sicher":    die letzten drei Male beim ersten Versuch richtig
  - "übt noch":  alles dazwischen
*/
function getLearningState(entry) {
  if (!entry || entry.seen < 2) return "neu";

  const lastThree = entry.history.slice(-3);
  if (lastThree.length === 3 && lastThree.every(Boolean)) return "sicher";

  return "übt noch";
}

// Bittet den Browser, die Daten nicht automatisch zu löschen
function requestPersistentStorage() {
  if (navigator.storage && navigator.storage.persist) {
    navigator.storage.persist().catch(() => {});
  }
}

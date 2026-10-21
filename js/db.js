/*
  Speicherung auf dem Gerät (IndexedDB).

  sets:  { id, name, createdAt }
  words: { id, setId, noun, form, image (Blob), audio (Blob | null), credit, order }
         credit: Herkunft des Bildes, z. B. "ARASAAC" (sonst null = eigenes Bild)
  stats: { wordId, seen, firstTry, history: [true/false …], lastSeen }

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
      order: index
    });
  });

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

async function recordResult(wordId, correctOnFirstTry) {
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

    store.put(entry);
  };

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

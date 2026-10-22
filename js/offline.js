/*
  Offline-Betrieb: Service Worker anmelden und auf Wunsch alle Bilder und
  Sprachdateien vorab laden (siehe sw.js).
*/

const MEDIA_CACHE_NAME = "bilderwahl-medien";

const offlineStatus = document.getElementById("offlineStatus");
const offlineButton = document.getElementById("offlineButton");

offlineButton.addEventListener("click", downloadForOffline);

if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
  navigator.serviceWorker.register("sw.js").catch(error => {
    console.warn("Offline-Betrieb nicht verfügbar:", error);
  });
}

function getMediaUrls() {
  const pictos = WORD_FIELDS.flatMap(field => field.words.map(word => getPictogramUrl(word.picto)));
  const voice = typeof VOICE_CLIPS === "undefined" ? [] : Object.values(VOICE_CLIPS).map(file => VOICE_FOLDER + file + ".m4a");

  return [...new Set([...pictos, ...voice])].map(path => new URL(path, location.href).href);
}

async function updateOfflineStatus() {
  if (!("caches" in window) || !("serviceWorker" in navigator)) {
    offlineStatus.textContent = "Dieser Browser unterstützt keinen Offline-Betrieb.";
    offlineButton.classList.add("hidden");
    return;
  }

  try {
    const cache = await caches.open(MEDIA_CACHE_NAME);
    const stored = new Set((await cache.keys()).map(request => request.url));
    const urls = getMediaUrls();
    const missing = urls.filter(url => !stored.has(url)).length;

    if (missing === 0) {
      offlineStatus.textContent = "✓ Alles ist auf diesem Gerät gespeichert. Die App funktioniert auch ohne Internet.";
      offlineButton.classList.add("hidden");
    } else {
      offlineStatus.textContent = "Die App selbst startet auch ohne Internet. Für die natürliche Stimme und die " +
        "mitgelieferten Bilder einmal alles laden (ca. 20 MB, am besten im WLAN). " +
        "Noch nicht gespeichert: " + missing + " von " + urls.length + " Dateien.";
      offlineButton.classList.remove("hidden");
    }
  } catch (error) {
    offlineStatus.textContent = "Der Offline-Speicher ist in diesem Browser nicht verfügbar (z. B. im privaten Modus).";
    offlineButton.classList.add("hidden");
  }
}

async function downloadForOffline() {
  offlineButton.disabled = true;

  try {
    const cache = await caches.open(MEDIA_CACHE_NAME);
    const stored = new Set((await cache.keys()).map(request => request.url));
    const missing = getMediaUrls().filter(url => !stored.has(url));

    let done = 0;
    let failed = 0;

    // Immer 6 Dateien gleichzeitig laden
    const queue = [...missing];
    const worker = async () => {
      while (queue.length > 0) {
        const url = queue.shift();

        try {
          const response = await fetch(url, { cache: "no-cache" });
          if (response.ok) {
            await cache.put(url, response);
          } else {
            failed++;
          }
        } catch (error) {
          failed++;
        }

        done++;
        if (done % 20 === 0 || done === missing.length) {
          offlineStatus.textContent = "Wird geladen … " + done + " von " + missing.length;
        }
      }
    };

    await Promise.all(Array.from({ length: 6 }, worker));

    if (failed > 0) {
      offlineStatus.textContent = failed + " Dateien konnten nicht geladen werden. Bitte mit Internet noch einmal versuchen.";
      offlineButton.disabled = false;
      return;
    }
  } catch (error) {
    offlineStatus.textContent = "Laden hat nicht geklappt. Ist der Speicher des Geräts voll?";
  }

  offlineButton.disabled = false;
  updateOfflineStatus();
}

updateOfflineStatus();

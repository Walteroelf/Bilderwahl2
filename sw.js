/*
  Service Worker: macht die App ohne Internet nutzbar.

  - Die App selbst (HTML, CSS, Skripte, Symbole) wird bei der Installation
    gespeichert. VERSION muss zur ?v=…-Nummer in index.html passen und bei
    jeder neuen Version erhöht werden – dann lädt der Browser die neue Fassung.
  - Bilder (pictos/) und Sprachdateien (audio/) werden beim ersten Abruf
    gespeichert, oder alle auf einmal über "Für Offline-Nutzung laden".
*/

const VERSION = "19";
const APP_CACHE = "bilderwahl-app-" + VERSION;
const MEDIA_CACHE = "bilderwahl-medien";

const APP_FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "icon-180.png",
  "icon-512.png",
  "schriften/andika-400.woff2",
  "schriften/andika-700.woff2",
  "schriften/grandstander.woff2",
  "css/style.css?v=" + VERSION,
  "js/curtain.js?v=" + VERSION,
  "js/words.js?v=" + VERSION,
  "js/wordfields.js?v=" + VERSION,
  "js/voice.js?v=" + VERSION,
  "js/db.js?v=" + VERSION,
  "js/profiles.js?v=" + VERSION,
  "js/speech.js?v=" + VERSION,
  "js/celebration.js?v=" + VERSION,
  "js/app.js?v=" + VERSION,
  "js/session.js?v=" + VERSION,
  "js/pick.js?v=" + VERSION,
  "js/sort.js?v=" + VERSION,
  "js/yesno.js?v=" + VERSION,
  "js/memory.js?v=" + VERSION,
  "js/naming.js?v=" + VERSION,
  "js/scratch.js?v=" + VERSION,
  "js/teacher.js?v=" + VERSION,
  "js/offline.js?v=" + VERSION
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(APP_CACHE)
      // "reload": am Browser-Zwischenspeicher vorbei, damit keine alte Fassung gespeichert wird
      .then(cache => cache.addAll(APP_FILES.map(file => new Request(file, { cache: "reload" }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key.startsWith("bilderwahl-app-") && key !== APP_CACHE)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

function isMedia(url) {
  return url.pathname.includes("/pictos/") || url.pathname.includes("/audio/");
}

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Seite selbst: zuerst aus dem Netz (für Updates), ohne Netz aus dem Speicher.
  // Bei sehr langsamer Verbindung nach 4 Sekunden die gespeicherte Fassung.
  if (request.mode === "navigate") {
    const timeout = new Promise((resolve, reject) => setTimeout(() => reject(new Error("Zeitüberschreitung")), 4000));

    event.respondWith(
      Promise.race([fetch(request), timeout])
        .then(response => {
          const copy = response.clone();
          caches.open(APP_CACHE).then(cache => cache.put("index.html", copy));
          return response;
        })
        .catch(() => caches.match("index.html", { cacheName: APP_CACHE }))
    );
    return;
  }

  // Bilder und Sprachdateien: aus dem Speicher, sonst aus dem Netz und merken
  if (isMedia(url)) {
    event.respondWith(
      caches.open(MEDIA_CACHE).then(cache =>
        cache.match(request).then(cached => {
          if (cached) return cached;

          return fetch(request).then(response => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          });
        })
      )
    );
    return;
  }

  // Übrige Dateien der App: aus dem Speicher, sonst aus dem Netz
  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request))
  );
});

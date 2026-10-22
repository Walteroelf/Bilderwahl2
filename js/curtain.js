/*
  Vorhang beim Öffnen der App: Ein roter Samtvorhang mit dem Schild
  "Bilderwahl" geht nach kurzer Pause auf (insgesamt etwa 1,6 Sekunden).
  Antippen öffnet ihn sofort. Bei "Bewegung reduzieren" wird nur ausgeblendet.
  Nur beim Laden der Seite – nicht beim Zurückkehren aus einer Übung.
*/

const CURTAIN_PAUSE = 450;
const CURTAIN_OPENING = 1100;

const curtain = document.getElementById("curtain");

if (curtain) {
  const reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let opened = false;

  const openCurtain = (fast) => {
    if (opened) return;
    opened = true;

    if (reducedMotion) curtain.classList.add("fade");
    if (fast) curtain.classList.add("fast");

    curtain.classList.add("open");

    setTimeout(() => curtain.remove(), fast || reducedMotion ? 450 : CURTAIN_OPENING + 100);
  };

  setTimeout(() => openCurtain(false), CURTAIN_PAUSE);
  curtain.addEventListener("pointerdown", () => openCurtain(true));
}

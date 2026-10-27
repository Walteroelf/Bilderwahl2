/*
  Kinderprofile: Jedes Kind hat ein Tier als Symbol (ohne Namen, wegen des
  Datenschutzes; die Lehrkraft kann ein Kürzel ergänzen). Der Lernstand und
  damit die Wiederholung in Abständen gelten je Kind.

  Ohne Profile – oder mit "Ohne Profil" – arbeitet die App wie bisher; der
  bisherige Lernstand bleibt dort erhalten.

  Lernstand-Schlüssel mit Profil: "kind:<Profil-ID>:<bisheriger Schlüssel>"
*/

const PROFILES_KEY = "bilderwahl-kinder";
const ACTIVE_PROFILE_KEY = "bilderwahl-aktives-kind";

// Tiere als Symbole – die Bilder liegen schon in pictos/
const PROFILE_ANIMALS = [
  { id: "hund", name: "Hund", picto: 2517 },
  { id: "katze", name: "Katze", picto: 2406 },
  { id: "maus", name: "Maus", picto: 2546 },
  { id: "pferd", name: "Pferd", picto: 2294 },
  { id: "kuh", name: "Kuh", picto: 2609 },
  { id: "schwein", name: "Schwein", picto: 2327 },
  { id: "schaf", name: "Schaf", picto: 2489 },
  { id: "ente", name: "Ente", picto: 2563 },
  { id: "huhn", name: "Huhn", picto: 2403 },
  { id: "hase", name: "Hase", picto: 2351 },
  { id: "loewe", name: "Löwe", picto: 2449 },
  { id: "elefant", name: "Elefant", picto: 2372 },
  { id: "giraffe", name: "Giraffe", picto: 2437 },
  { id: "affe", name: "Affe", picto: 2477 },
  { id: "zebra", name: "Zebra", picto: 2324 },
  { id: "pinguin", name: "Pinguin", picto: 3243 },
  { id: "igel", name: "Igel", picto: 26829 },
  { id: "frosch", name: "Frosch", picto: 2543 },
  { id: "schmetterling", name: "Schmetterling", picto: 2465 },
  { id: "marienkaefer", name: "Marienkäfer", picto: 2924 }
];

let profiles = loadProfiles();
let activeProfileId = loadActiveProfileId();

function loadProfiles() {
  try {
    const value = JSON.parse(localStorage.getItem(PROFILES_KEY));
    return Array.isArray(value) ? value : [];
  } catch (error) {
    return [];
  }
}

function saveProfiles() {
  try {
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
  } catch (error) {
    // ohne Speicher gelten die Profile nur bis zum Neuladen
  }
}

function loadActiveProfileId() {
  try {
    const id = localStorage.getItem(ACTIVE_PROFILE_KEY);
    return profiles.some(profile => profile.id === id) ? id : null;
  } catch (error) {
    return null;
  }
}

function setActiveProfile(id) {
  activeProfileId = profiles.some(profile => profile.id === id) ? id : null;

  try {
    if (activeProfileId) {
      localStorage.setItem(ACTIVE_PROFILE_KEY, activeProfileId);
    } else {
      localStorage.removeItem(ACTIVE_PROFILE_KEY);
    }
  } catch (error) {
    // nur eine Bequemlichkeit
  }
}

function getAnimal(animalId) {
  return PROFILE_ANIMALS.find(animal => animal.id === animalId) || PROFILE_ANIMALS[0];
}

function getProfile(id) {
  return profiles.find(profile => profile.id === id) || null;
}

function getProfileLabel(profile) {
  const animal = getAnimal(profile.animal);
  return profile.label ? animal.name + " (" + profile.label + ")" : animal.name;
}

function getFreeAnimals() {
  const used = new Set(profiles.map(profile => profile.animal));
  return PROFILE_ANIMALS.filter(animal => !used.has(animal.id));
}

function addProfile(animalId, label) {
  const profile = {
    id: createId(),
    animal: animalId,
    label: String(label || "").trim().slice(0, 12)
  };

  profiles.push(profile);
  saveProfiles();
  return profile;
}

async function removeProfile(id) {
  profiles = profiles.filter(profile => profile.id !== id);
  saveProfiles();

  if (activeProfileId === id) setActiveProfile(null);

  await deleteStatsWithPrefix("kind:" + id + ":");
}

// Lernstand-Schlüssel für ein Profil (null = ohne Profil, wie bisher)
function profileKey(profileId, key) {
  return profileId ? "kind:" + profileId + ":" + key : key;
}

// Kleines Tier-Bild für Knöpfe und Kopf
function buildAnimalImage(animalId, className) {
  const img = document.createElement("img");
  img.src = getPictogramUrl(getAnimal(animalId).picto);
  img.alt = "";
  if (className) img.className = className;
  return img;
}

/* ---------- Oberfläche ---------- */

const profileList = document.getElementById("profileList");
const animalPicker = document.getElementById("animalPicker");
const profileLabelInput = document.getElementById("profileLabelInput");
const profileAddHint = document.getElementById("profileAddHint");
const whoPractices = document.getElementById("whoPractices");
const profileChoice = document.getElementById("profileChoice");
const profileBadge = document.getElementById("profileBadge");

// Einstellungen → Kinder: Liste und Tierauswahl für ein neues Kind
function renderProfileSettings() {
  profileList.innerHTML = "";

  profiles.forEach(profile => {
    const row = document.createElement("div");
    row.className = "profile-row";

    row.appendChild(buildAnimalImage(profile.animal, "profile-animal"));

    const label = document.createElement("span");
    label.className = "profile-label";
    label.textContent = getProfileLabel(profile);
    row.appendChild(label);

    const remove = document.createElement("button");
    remove.className = "secondary small danger";
    remove.textContent = "Löschen";
    remove.addEventListener("click", async () => {
      if (!confirm("Kind „" + getProfileLabel(profile) + "“ mit seinem Lernstand löschen?")) return;
      await removeProfile(profile.id);
      renderProfileSettings();
    });
    row.appendChild(remove);

    profileList.appendChild(row);
  });

  animalPicker.innerHTML = "";
  const free = getFreeAnimals();

  profileAddHint.textContent = free.length > 0
    ? "Neues Kind anlegen: Kürzel eintragen (freiwillig), dann ein Tier antippen."
    : "Alle Tiere sind vergeben.";
  profileLabelInput.classList.toggle("hidden", free.length === 0);

  free.forEach(animal => {
    const button = document.createElement("button");
    button.className = "animal-button";
    button.setAttribute("aria-label", animal.name + " als neues Kind");
    button.title = animal.name;
    button.appendChild(buildAnimalImage(animal.id));
    button.addEventListener("click", () => {
      addProfile(animal.id, profileLabelInput.value);
      profileLabelInput.value = "";
      renderProfileSettings();
    });
    animalPicker.appendChild(button);
  });
}

// Übungsauswahl → "Wer übt?" (nur, wenn es Kinder gibt)
function renderProfileChoice() {
  whoPractices.classList.toggle("hidden", profiles.length === 0);
  profileChoice.innerHTML = "";

  if (profiles.length === 0) return;

  const options = [{ id: null, label: "Ohne Profil", animal: null }, ...profiles];

  options.forEach(option => {
    const button = document.createElement("button");
    button.className = "profile-button" + (option.id === activeProfileId ? " active" : "");
    button.setAttribute("aria-pressed", option.id === activeProfileId ? "true" : "false");

    if (option.animal) {
      button.appendChild(buildAnimalImage(option.animal));
      const label = document.createElement("span");
      label.textContent = option.label || getAnimal(option.animal).name;
      button.appendChild(label);
    } else {
      const label = document.createElement("span");
      label.textContent = "Ohne Profil";
      button.appendChild(label);
    }

    button.addEventListener("click", () => {
      setActiveProfile(option.id);
      renderProfileChoice();
    });

    profileChoice.appendChild(button);
  });
}

// Kopf der Übung: Tier des übenden Kindes
function updateProfileBadge() {
  const profile = getProfile(activeProfileId);
  profileBadge.innerHTML = "";
  profileBadge.classList.toggle("hidden", !profile);

  if (profile) {
    profileBadge.appendChild(buildAnimalImage(profile.animal));
    profileBadge.title = "Es übt: " + getProfileLabel(profile);
  }
}

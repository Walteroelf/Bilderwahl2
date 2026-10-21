/*
  Mitgelieferte Wortfelder mit Piktogrammen von ARASAAC.
  Die Bilder liegen in pictos/<Nummer>.png (Nummer = ARASAAC-Piktogramm-Nummer).
*/

const ARASAAC_CREDIT_HTML =
  "Piktogramme: Sergio Palao. Herkunft: <a href=\"https://arasaac.org\" target=\"_blank\" rel=\"noopener\">ARASAAC</a>. " +
  "Lizenz: <a href=\"https://creativecommons.org/licenses/by-nc-sa/4.0/deed.de\" target=\"_blank\" rel=\"noopener\">CC BY-NC-SA 4.0</a>. " +
  "Eigentum: Regierung von Aragón (Spanien).";

function getPictogramUrl(id) {
  return "pictos/" + id + ".png";
}

const WORD_FIELDS = [
  {
    id: "kleidung",
    name: "Kleidung",
    words: [
      { noun: "Schal", form: "der", picto: 2290 },
      { noun: "Mütze", form: "die", picto: 2412 },
      { noun: "Jacke", form: "die", picto: 2319 },
      { noun: "Hose", form: "die", picto: 2565 },
      { noun: "T-Shirt", form: "das", picto: 2309 },
      { noun: "Pullover", form: "der", picto: 2436 },
      { noun: "Kleid", form: "das", picto: 2613 },
      { noun: "Rock", form: "der", picto: 2391 },
      { noun: "Schuhe", form: "pl", picto: 2622 },
      { noun: "Socken", form: "pl", picto: 2298 },
      { noun: "Handschuhe", form: "pl", picto: 2415 },
      { noun: "Stiefel", form: "pl", picto: 2667 }
    ]
  },
  {
    id: "koerper",
    name: "Körper",
    words: [
      { noun: "Kopf", form: "der", picto: 2673 },
      { noun: "Hand", form: "die", picto: 2928 },
      { noun: "Fuß", form: "der", picto: 2841 },
      { noun: "Auge", form: "das", picto: 6573 },
      { noun: "Ohr", form: "das", picto: 2871 },
      { noun: "Nase", form: "die", picto: 2887 },
      { noun: "Mund", form: "der", picto: 2663 },
      { noun: "Bauch", form: "der", picto: 2786 },
      { noun: "Arm", form: "der", picto: 2669 },
      { noun: "Bein", form: "das", picto: 8666 },
      { noun: "Haare", form: "pl", picto: 2851 },
      { noun: "Zahn", form: "der", picto: 10267 }
    ]
  },
  {
    id: "essen",
    name: "Essen und Trinken",
    words: [
      { noun: "Brot", form: "das", picto: 2494 },
      { noun: "Milch", form: "die", picto: 2445 },
      { noun: "Wasser", form: "das", picto: 2248 },
      { noun: "Käse", form: "der", picto: 2541 },
      { noun: "Ei", form: "das", picto: 2427 },
      { noun: "Nudeln", form: "pl", picto: 8652 },
      { noun: "Reis", form: "der", picto: 39387 },
      { noun: "Suppe", form: "die", picto: 2573 },
      { noun: "Wurst", form: "die", picto: 3280 },
      { noun: "Joghurt", form: "der", picto: 2618 },
      { noun: "Saft", form: "der", picto: 11461 },
      { noun: "Pizza", form: "die", picto: 2527 }
    ]
  },
  {
    id: "obst-gemuese",
    name: "Obst und Gemüse",
    words: [
      { noun: "Apfel", form: "der", picto: 2462 },
      { noun: "Banane", form: "die", picto: 2530 },
      { noun: "Birne", form: "die", picto: 2561 },
      { noun: "Erdbeere", form: "die", picto: 2400 },
      { noun: "Orange", form: "die", picto: 2483 },
      { noun: "Trauben", form: "pl", picto: 3247 },
      { noun: "Tomate", form: "die", picto: 2594 },
      { noun: "Gurke", form: "die", picto: 2847 },
      { noun: "Karotte", form: "die", picto: 2619 },
      { noun: "Kartoffel", form: "die", picto: 2503 },
      { noun: "Paprika", form: "die", picto: 2839 },
      { noun: "Zitrone", form: "die", picto: 3022 }
    ]
  },
  {
    id: "schule",
    name: "Schule",
    words: [
      { noun: "Stift", form: "der", picto: 2440 },
      { noun: "Buch", form: "das", picto: 2450 },
      { noun: "Schere", form: "die", picto: 2591 },
      { noun: "Kleber", form: "der", picto: 2510 },
      { noun: "Heft", form: "das", picto: 2359 },
      { noun: "Radiergummi", form: "der", picto: 2409 },
      { noun: "Lineal", form: "das", picto: 2815 },
      { noun: "Tafel", form: "die", picto: 2526 },
      { noun: "Tisch", form: "der", picto: 3129 },
      { noun: "Stuhl", form: "der", picto: 3155 },
      { noun: "Rucksack", form: "der", picto: 2475 },
      { noun: "Spitzer", form: "der", picto: 2553 }
    ]
  },
  {
    id: "tiere",
    name: "Tiere",
    words: [
      { noun: "Hund", form: "der", picto: 2517 },
      { noun: "Katze", form: "die", picto: 2406 },
      { noun: "Maus", form: "die", picto: 2546 },
      { noun: "Pferd", form: "das", picto: 2294 },
      { noun: "Kuh", form: "die", picto: 2609 },
      { noun: "Schwein", form: "das", picto: 2327 },
      { noun: "Schaf", form: "das", picto: 2489 },
      { noun: "Vogel", form: "der", picto: 2490 },
      { noun: "Fisch", form: "der", picto: 2520 },
      { noun: "Ente", form: "die", picto: 2563 },
      { noun: "Huhn", form: "das", picto: 2403 },
      { noun: "Hase", form: "der", picto: 2351 }
    ]
  },
  {
    id: "bad-zuhause",
    name: "Bad und Zuhause",
    words: [
      { noun: "Zahnbürste", form: "die", picto: 2694 },
      { noun: "Seife", form: "die", picto: 2964 },
      { noun: "Handtuch", form: "das", picto: 2593 },
      { noun: "Toilette", form: "die", picto: 2430 },
      { noun: "Dusche", form: "die", picto: 2370 },
      { noun: "Badewanne", form: "die", picto: 2272 },
      { noun: "Bett", form: "das", picto: 2304 },
      { noun: "Tür", form: "die", picto: 3244 },
      { noun: "Fenster", form: "das", picto: 2611 },
      { noun: "Lampe", form: "die", picto: 4936 },
      { noun: "Kamm", form: "der", picto: 2852 },
      { noun: "Sofa", form: "das", picto: 2571 }
    ]
  },
  {
    id: "kueche",
    name: "Küche",
    words: [
      { noun: "Teller", form: "der", picto: 2532 },
      { noun: "Tasse", form: "die", picto: 2582 },
      { noun: "Löffel", form: "der", picto: 2362 },
      { noun: "Gabel", form: "die", picto: 2588 },
      { noun: "Messer", form: "das", picto: 3237 },
      { noun: "Glas", form: "das", picto: 2610 },
      { noun: "Flasche", form: "die", picto: 2288 },
      { noun: "Topf", form: "der", picto: 9086 },
      { noun: "Pfanne", form: "die", picto: 2558 },
      { noun: "Kühlschrank", form: "der", picto: 3272 },
      { noun: "Herd", form: "der", picto: 2341 },
      { noun: "Schüssel", form: "die", picto: 3257 }
    ]
  },
  {
    id: "spielzeug",
    name: "Spielzeug",
    words: [
      { noun: "Ball", form: "der", picto: 2269 },
      { noun: "Puppe", form: "die", picto: 2482 },
      { noun: "Teddy", form: "der", picto: 4945 },
      { noun: "Bausteine", form: "pl", picto: 4930 },
      { noun: "Puzzle", form: "das", picto: 2540 },
      { noun: "Roller", form: "der", picto: 2508 },
      { noun: "Rutsche", form: "die", picto: 4759 },
      { noun: "Schaukel", form: "die", picto: 4608 },
      { noun: "Fahrrad", form: "das", picto: 2277 },
      { noun: "Kreisel", form: "der", picto: 8663 },
      { noun: "Trommel", form: "die", picto: 2578 },
      { noun: "Spielzeugauto", form: "das", picto: 2340 }
    ]
  },
  {
    id: "fahrzeuge",
    name: "Fahrzeuge",
    words: [
      { noun: "Auto", form: "das", picto: 2339 },
      { noun: "Bus", form: "der", picto: 2263 },
      { noun: "Zug", form: "der", picto: 2603 },
      { noun: "Flugzeug", form: "das", picto: 2264 },
      { noun: "Schiff", form: "das", picto: 6932 },
      { noun: "Traktor", form: "der", picto: 2600 },
      { noun: "Lastwagen", form: "der", picto: 2306 },
      { noun: "Motorrad", form: "das", picto: 2480 },
      { noun: "Hubschrauber", form: "der", picto: 2421 },
      { noun: "Feuerwehrauto", form: "das", picto: 4925 },
      { noun: "Polizeiauto", form: "das", picto: 3426 },
      { noun: "Krankenwagen", form: "der", picto: 2251 }
    ]
  },
  {
    id: "personen",
    name: "Personen",
    words: [
      { noun: "Mama", form: "die", picto: 2458 },
      { noun: "Papa", form: "der", picto: 2497 },
      { noun: "Baby", form: "das", picto: 2275 },
      { noun: "Oma", form: "die", picto: 2243 },
      { noun: "Opa", form: "der", picto: 2244 },
      { noun: "Junge", form: "der", picto: 2485 },
      { noun: "Mädchen", form: "das", picto: 2484 },
      { noun: "Polizist", form: "der", picto: 38233 },
      { noun: "Feuerwehrmann", form: "der", picto: 2664 },
      { noun: "Lehrerin", form: "die", picto: 2456 },
      { noun: "Arzt", form: "der", picto: 2467 },
      { noun: "Koch", form: "der", picto: 6985 }
    ]
  }
];

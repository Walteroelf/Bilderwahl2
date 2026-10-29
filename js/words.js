function cleanFileName(fileName) {
  return cleanWordText(String(fileName).replace(/\.[^/.]+$/, ""));
}

function cleanWordText(text) {
  return String(text)
    .replace(/^\uFEFF/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/*
  Plural-Erkennung.

  Erkannt wird vorne:
  - PL die Handschuhe.png
  - pl die Handschuhe.png
  - Plural die Handschuhe.png
  - Mehrzahl die Handschuhe.png
  - [PL] die Handschuhe.png
  - (PL) die Handschuhe.png
  - {PL} die Handschuhe.png

  Erkannt wird hinten:
  - die Handschuhe PL.png
  - die Handschuhe [PL].png
  - die Handschuhe (PL).png
  - die Handschuhe plural.png
*/
const PLURAL_MARKER =
  "(?:\\[\\s*(?:pl|plural|mehrzahl)\\s*\\]|\\(\\s*(?:pl|plural|mehrzahl)\\s*\\)|\\{\\s*(?:pl|plural|mehrzahl)\\s*\\}|(?:pl|plural|mehrzahl)(?![a-zäöüß]))";

const pluralPrefixPattern = new RegExp("^\\s*" + PLURAL_MARKER + "\\s*", "i");
const pluralSuffixPattern = new RegExp("(?:^|\\s)" + PLURAL_MARKER + "\\s*$", "i");
const articlePattern = /^(der|die|das)\s+/i;

/*
  Wörterliste für Dateinamen ohne Artikel (z. B. "Schal.png").
  "pl" steht für Mehrzahl ("Wo sind die …?").
  Wörter, die in Einzahl und Mehrzahl gleich sind (Löffel, Teller …),
  stehen nur in der Einzahl – die Mehrzahl lässt sich in der Liste
  der erkannten Namen auswählen.
*/
const WORD_LIST = {
  der:
    "Hund Ball Baum Apfel Schuh Schal Strumpf Handschuh Hut Pullover Pulli Rock Mantel Schlüssel Löffel " +
    "Teller Becher Tisch Stuhl Schrank Stift Bleistift Buntstift Tiger Löwe Elefant Affe Bär Hase Fisch " +
    "Vogel Frosch Igel Käse Kuchen Keks Saft Zug Bus Traktor Roller Bagger Teddy Mond Stern Kamm Eimer " +
    "Topf Mann Junge Papa Opa Fuß Finger Mund Kopf Bauch Arm Zahn Ring Regenschirm Schirm Schmetterling " +
    "Hahn Esel Wurm Käfer Pinsel Kuli Rucksack Schlafanzug Stiefel Gürtel Knopf Kühlschrank Fernseher " +
    "Computer Turm Drache Pilz Kürbis Joghurt Reis Würfel Luftballon Ballon Lutscher Zaun Berg Schneemann " +
    "Clown Koffer Korb Kinderwagen Hubschrauber Ofen Herd Spiegel Besen Hammer Sessel Teppich Vorhang " +
    "Kran Laster Lastwagen Lkw Baustein Stein Hamster Papagei Pinguin Wal Hai Delfin Dinosaurier Dino " +
    "Fuchs Wolf Storch Specht Rabe Marienkäfer Kakao Tee Kaffee Honig Salat Burger Lolli Badeanzug " +
    "Overall Body Kittel Wecker Ventilator Staubsauger Föhn Schwamm Waschlappen Schnuller Sand Schnee " +
    "Regen Regenbogen Blitz Fußball Kreisel Drachen Schlitten Bauernhof Garten Wald Kindergarten Arzt " +
    "Bauer Polizist Pirat Ritter König Zauberer Engel Weihnachtsmann Nikolaus Osterhase Tannenbaum " +
    "Kamin Briefkasten Brief Stempel Kleber Radiergummi Spitzer Ordner Tannenzapfen",
  die:
    "Katze Maus Kuh Ente Gans Ziege Schnecke Biene Spinne Giraffe Schlange Banane Birne Erdbeere Kirsche " +
    "Tomate Gurke Karotte Möhre Zitrone Orange Traube Weintraube Milch Pizza Nudel Wurst Suppe Brezel " +
    "Torte Mütze Hose Jacke Socke Brille Uhr Tasche Tasse Gabel Flasche Schere Lampe Tür Blume Sonne " +
    "Wolke Puppe Kerze Zahnbürste Bürste Seife Badewanne Mama Oma Frau Hand Nase Kette Krone Trommel " +
    "Gitarre Geige Flöte Rakete Ampel Eisenbahn Schaukel Rutsche Zange Säge Leiter Pfanne Kanne Dose " +
    "Kiste Tafel Feder Kugel Brücke Fahne Hexe Prinzessin Eule Kröte Robbe Muschel Ameise Raupe Zwiebel " +
    "Paprika Kartoffel Melone Ananas Mandarine Pflaume Butter Schokolade Badehose Sandale Strumpfhose " +
    "Kappe Haarspange Decke Matratze Couch Waschmaschine Treppe Wand Bank Mauer Kamera Fliege Lok " +
    "Lokomotive Feuerwehr Polizei Tüte Pfeife Glocke Wippe Jeans Leggings Weste Bluse Krawatte Schleife " +
    "Mücke Libelle Taube Kuh Henne Möwe Qualle Krabbe Erbse Bohne Nuss Walnuss Kiwi Mango Kokosnuss " +
    "Zucchini Aubergine Brezel Waffel Marmelade Limonade Cola Sahne Wurst Salami Kugel Murmel Rassel " +
    "Seifenblase Sandburg Schaufel Gießkanne Harke Blumenvase Vase Pflanze Tulpe Rose Sonnenblume " +
    "Kastanie Eichel Nuss Banane Zahnpasta Toilette Dusche Windel Uhr Mikrowelle Spülmaschine Heizung " +
    "Steckdose Tastatur Maus Ärztin Lehrerin Königin Fee Meerjungfrau Schildkröte Fledermaus Katze " +
    "Kasse Ampel Straße Schule Kirche Burg Insel Brücke Wiese Blüte Banane",
  das:
    "Auto Haus Buch Bett Fahrrad Boot Schiff Flugzeug Pferd Schaf Schwein Huhn Küken Kaninchen Krokodil " +
    "Zebra Nilpferd Kamel Känguru Eichhörnchen Ei Brot Brötchen Eis Wasser Glas Messer Kleid Hemd TShirt " +
    "Shirt Kind Baby Mädchen Auge Ohr Bein Knie Telefon Handy Bild Fenster Sofa Kissen Spielzeug Puzzle " +
    "Herz Geschenk Blatt Gras Feuer Motorrad Dreirad Laufrad Zelt Nest Handtuch Licht Lineal Heft Papier " +
    "Radio Klavier Schloss Sandwich Müsli Würstchen Bonbon Kuscheltier Stofftier Lätzchen Taschentuch " +
    "Pflaster Tablet Trampolin Schwimmbad Tor Seil Springseil Rad Taxi Polizeiauto Feuerwehrauto Lama Pony " +
    "Gespenst Einhorn Wildschwein Reh Nashorn Meerschweinchen Kälbchen Fohlen Lamm Ferkel " +
    "Stück Kuchenstück Obst Gemüse Mehl Salz Fleisch Hähnchen Popcorn Kaugummi Croissant " +
    "Kostüm Nachthemd Halstuch Stirnband Armband Portemonnaie Geld Paket Spiel Memory Instrument " +
    "Xylophon Tamburin Planschbecken Sandspielzeug Förmchen Lenkrad Segelboot Kanu UBoot Ufo Raumschiff " +
    "Fernglas Mikroskop Feuerzeug Streichholz Werkzeug Kabel Ladekabel Schaukelpferd Bilderbuch Bügeleisen",
  pl:
    "Strümpfe Socken Schuhe Handschuhe Hosen Jacken Mützen Äpfel Bananen Birnen Erdbeeren Kirschen " +
    "Trauben Weintrauben Tomaten Karotten Möhren Nudeln Eier Bälle Bücher Autos Blumen Hunde Katzen " +
    "Mäuse Kühe Schafe Schweine Pferde Enten Hühner Vögel Fische Kekse Gabeln Tassen Gläser Flaschen " +
    "Kerzen Bausteine Klötze Steine Blätter Sterne Wolken Bäume Häuser Kinder Babys Haare Augen Ohren " +
    "Hände Füße Zähne Beine Kleider Hemden Sandalen Hausschuhe Brillen Luftballons Ballons Bonbons " +
    "Zwiebeln Kartoffeln Pommes Chips Spaghetti Erbsen Bohnen Nüsse Muscheln Schnecken Bienen Ameisen " +
    "Spielsachen Stifte Buntstifte Ringe Knöpfe Perlen Kugeln Puppen Teddys Bären Hasen Frösche Affen " +
    "Löwen Elefanten Giraffen Zebras Schlangen Pilze Kürbisse Melonen Orangen Zitronen Pflaumen " +
    "Mandarinen Schals Mäntel Röcke Hüte Shorts Gummistiefel Turnschuhe Stiefel Pantoffeln Ohrringe " +
    "Haarspangen Kastanien Tulpen Rosen Würfel Murmeln Seifenblasen Waffeln Brezeln Würstchen " +
    "Gummibärchen Weintrauben Blaubeeren Himbeeren Kekse Plätzchen Leute Menschen Geschwister Eltern " +
    "Großeltern Zwillinge Ferien Sterne Schmetterlinge Marienkäfer Fliegen Käfer Spinnen Pinguine " +
    "Delfine Bagger Autos Züge Busse Boote Schiffe Flugzeuge Fahrräder Räder"
};

const wordLookup = buildWordLookup();

function buildWordLookup() {
  const lookup = {};

  ["der", "die", "das", "pl"].forEach(form => {
    WORD_LIST[form].split(/\s+/).forEach(word => {
      const key = normalizeWordKey(word);
      if (key && !(key in lookup)) lookup[key] = form;
    });
  });

  // Einzahl hat Vorrang vor Mehrzahl, wenn ein Wort in beiden steht
  // ("Würfel", "Käfer" …) – das ist oben über die Reihenfolge geregelt.
  return lookup;
}

function normalizeWordKey(word) {
  return String(word).toLowerCase().replace(/[\s.-]+/g, "");
}

function lookUpForm(noun) {
  const key = normalizeWordKey(noun);
  if (!key) return null;

  if (lookup(key)) {
    return { form: lookup(key), source: "liste" };
  }

  // Zusammengesetzte Wörter: "Winterschal" → "Schal", "Wollsocken" → "Socken"
  for (let start = 1; start <= key.length - 4; start++) {
    const ending = key.slice(start);
    if (lookup(ending)) {
      return { form: lookup(ending), source: "vermutet" };
    }
  }

  return null;

  function lookup(k) {
    return Object.prototype.hasOwnProperty.call(wordLookup, k) ? wordLookup[k] : null;
  }
}

const ARTICLE_STORAGE_KEY = "bilderwahl-artikel";

function loadSavedForms() {
  try {
    return JSON.parse(localStorage.getItem(ARTICLE_STORAGE_KEY)) || {};
  } catch (error) {
    return {};
  }
}

function saveForm(noun, form) {
  try {
    const saved = loadSavedForms();
    saved[normalizeWordKey(noun)] = form;
    localStorage.setItem(ARTICLE_STORAGE_KEY, JSON.stringify(saved));
  } catch (error) {
    // Speichern ist nur eine Bequemlichkeit
  }
}

function parseImageName(fileName) {
  return parseWordText(cleanFileName(fileName));
}

// Wandelt "der Schal", "Strümpfe", "PL die Socken" … in Wort + Artikel um
function parseWordText(text) {
  let name = cleanWordText(text);
  let pluralMarked = false;

  if (pluralPrefixPattern.test(name)) {
    pluralMarked = true;
    name = name.replace(pluralPrefixPattern, "").trim();
  }

  if (pluralSuffixPattern.test(name)) {
    pluralMarked = true;
    name = name.replace(pluralSuffixPattern, "").trim();
  }

  let article = null;
  const articleMatch = name.match(articlePattern);

  if (articleMatch) {
    article = articleMatch[1].toLowerCase();
    name = name.replace(articlePattern, "").trim();
  }

  const noun = capitalize(name);
  const known = lookUpForm(noun);
  const saved = loadSavedForms()[normalizeWordKey(noun)];

  let form = null;
  let source = null;

  if (pluralMarked) {
    form = "pl";
    source = "datei";
  } else if (article === "die" && known && known.form === "pl") {
    // "die Strümpfe.png" → Mehrzahl, auch ohne PL
    form = "pl";
    source = "datei";
  } else if (article) {
    form = article;
    source = "datei";
  } else if (saved) {
    form = saved;
    source = "gewählt";
  } else if (known) {
    form = known.form;
    source = known.source;
  }

  return {
    noun: noun,
    form: form,
    formSource: source
  };
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/*
  Satzbausteine. Tätigkeiten (form "verb") haben statt eines Artikels die
  er/sie/es-Form in "third": schlafen → "Wer schläft?", "Hier schläft jemand."
  Personen (form "person", z. B. eigene Fotos) haben nur einen Namen:
  "Wo ist Mia?", "Wer ist das?", "Das ist Mia."
*/

function isVerb(word) {
  return word.form === "verb";
}

function isPerson(word) {
  return word.form === "person";
}

// Wörter mit der/die/das (Mehrzahl zählt mit) – nur sie bekommen Artikel und Genusfarben
function hasArticle(word) {
  return ["der", "die", "das", "pl"].includes(word.form);
}

function getArticle(word) {
  if (!hasArticle(word)) return "";
  return word.form === "pl" ? "die" : word.form;
}

function getDisplayName(word) {
  if (!hasArticle(word)) return word.noun;
  return getArticle(word) + " " + word.noun;
}

// "Wo ist der Schal?" / "Wo sind die Strümpfe?" / "Wer schläft?" / "Wo ist Mia?"
function buildQuestionForImage(word) {
  if (isVerb(word)) return "Wer " + word.third + "?";
  return (word.form === "pl" ? "Wo sind " : "Wo ist ") + getDisplayName(word) + "?";
}

// "Das ist der Schal." / "Das sind die Strümpfe." / "Hier schläft jemand." / "Das ist Mia."
function buildModelSentence(word) {
  if (isVerb(word)) return "Hier " + word.third + " jemand.";
  return (word.form === "pl" ? "Das sind " : "Das ist ") + getDisplayName(word) + ".";
}

// "Hier ist der Schal." / "Hier sind die Strümpfe." / "Hier schläft jemand." / "Hier ist Mia."
function buildHintSentence(word) {
  if (isVerb(word)) return "Hier " + word.third + " jemand.";
  return (word.form === "pl" ? "Hier sind " : "Hier ist ") + getDisplayName(word) + ".";
}

// Ja-oder-Nein-Frage: "Ist das der Schal?" / "Sind das die Strümpfe?" / "Schläft hier jemand?" / "Ist das Mia?"
function buildYesNoQuestion(word) {
  if (isVerb(word)) return capitalize(word.third) + " hier jemand?";
  return (word.form === "pl" ? "Sind das " : "Ist das ") + getDisplayName(word) + "?";
}

// Frage beim Benennen
function buildNamingQuestion(word) {
  if (isVerb(word)) return "Was passiert hier?";
  return isPerson(word) ? "Wer ist das?" : "Was ist das?";
}

// Dateinamen von Kameras und Handys ("IMG_4711", "DSC01234", "PXL_2026…") sind kein Name
function isCameraFileName(fileName) {
  return /^(img|dsc|dscn|dcim|pxl|photo|foto|bild|image|screenshot|bildschirmfoto|whatsapp image|signal)?[\s_-]*[\d\s_.:-]{3,}/i
    .test(String(fileName).replace(/\.[^/.]+$/, ""));
}

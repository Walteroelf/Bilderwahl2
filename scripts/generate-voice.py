"""Erzeugt alle Sätze der mitgelieferten Wortfelder mit der Thorsten-Stimme.

Aufruf (siehe scripts/STIMME.md):
    python generate-voice.py <App-Ordner> <Stimmmodell.onnx> [Sprechtempo]

Sprechtempo: 1.0 = normal, 1.2 = langsamer (Standard), 1.4 = sehr langsam.
Legt audio/thorsten/<hash>.m4a und js/voice.js im App-Ordner an.
Benötigt macOS (afconvert) und das Python-Paket piper-tts.
"""
import sys, re, json, wave, hashlib, os, subprocess, tempfile
from piper import PiperVoice, SynthesisConfig

app = sys.argv[1]
model = sys.argv[2]
length_scale = float(sys.argv[3]) if len(sys.argv) > 3 else 1.2

# espeak verträgt keine sehr langen Pfade; bei Problemen die Daten an einen
# kurzen Ort kopieren und ESPEAK_DATA_DIR darauf setzen.
espeak_dir = os.environ.get("ESPEAK_DATA_DIR")

src = open(os.path.join(app, "js/wordfields.js"), encoding="utf8").read()
words = re.findall(r'\{ noun: "([^"]+)", form: "(der|die|das|pl)", picto: \d+ \}', src)

def key(text):
    # muss zu voiceKey() in js/speech.js passen
    return re.sub(r"\s+", " ", text).strip().rstrip(".").strip()

texts = set()
for noun, form in words:
    article = "die" if form == "pl" else form
    name = article + " " + noun
    plural = form == "pl"
    texts.update([
        ("Wo sind " if plural else "Wo ist ") + name + "?",
        ("Das sind " if plural else "Das ist ") + name + ".",
        ("Hier sind " if plural else "Hier ist ") + name + ".",
        "Es heißt " + name + ".",
        name,
        noun,
    ])

# feste Sätze aus js/app.js und js/houses.js
texts.update([
    "Genau richtig!", "Super gemacht!", "Prima, das stimmt!", "Sehr gut gehört!", "Klasse, richtig!",
    "Toll gemacht!", "Ja, das ist richtig!", "Wunderbar!", "Richtig erkannt!", "Fantastisch!",
    "Leider falsch.", "Das war es noch nicht.", "Versuche es noch einmal.", "Fast, aber noch nicht richtig.",
    "Hör noch einmal genau hin.", "Das gesuchte Bild ist ein anderes.", "Noch einmal probieren.",
    "Das war leider nicht das passende Bild.", "Schau noch einmal genau.", "Nicht ganz. Du schaffst das.",
    "Richtig!", "Noch einmal.", "Los geht's.", "Schau mal.", "Das sind mehrere.", "Fertig.", "Super, fertig!",
])

# "Nicht ganz. Du schaffst das." wird auch in Teilen gebraucht
texts.update(["Nicht ganz.", "Du schaffst das."])

out_dir = os.path.join(app, "audio/thorsten")
os.makedirs(out_dir, exist_ok=True)

voice = PiperVoice.load(model, espeak_data_dir=espeak_dir) if espeak_dir else PiperVoice.load(model)
config = SynthesisConfig(length_scale=length_scale)

clips = {}
tmp = tempfile.mkdtemp()
for i, text in enumerate(sorted(texts)):
    k = key(text)
    name = hashlib.sha1(k.encode("utf8")).hexdigest()[:10]
    clips[k] = name
    target = os.path.join(out_dir, name + ".m4a")
    if os.path.exists(target):
        continue
    wav = os.path.join(tmp, name + ".wav")
    with wave.open(wav, "wb") as w:
        voice.synthesize_wav(text, w, syn_config=config)
    subprocess.run(["afconvert", "-f", "m4af", "-d", "aac", "-b", "32000", "-c", "1", wav, target], check=True)
    os.remove(wav)
    if i % 100 == 0:
        print(i, "/", len(texts), flush=True)

# nicht mehr benutzte Dateien entfernen
for f in os.listdir(out_dir):
    if f.endswith(".m4a") and f[:-4] not in clips.values():
        os.remove(os.path.join(out_dir, f))

with open(os.path.join(app, "js/voice.js"), "w", encoding="utf8") as f:
    f.write("/*\n  Vorab erzeugte Sätze mit der Thorsten-Stimme (Piper).\n"
            "  Erzeugt mit scripts/generate-voice.py – nicht von Hand bearbeiten.\n"
            "  Schlüssel: Satz ohne Schlusspunkt, Wert: Datei in audio/thorsten/.\n*/\n\n")
    f.write("const VOICE_CLIPS = " + json.dumps(dict(sorted(clips.items())), ensure_ascii=False, indent=0) + ";\n")

print("fertig:", len(clips), "Sätze")

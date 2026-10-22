# Thorsten-Stimme neu erzeugen

Die Sätze der mitgelieferten Wortfelder („Wo ist der Schal?“, „Das ist der Schal.“ …)
liegen als fertige Audiodateien in `audio/thorsten/`. Die App spielt sie ab;
fehlt ein Satz (z. B. bei eigenen Wörtern), spricht die Stimme des Geräts.

Neu erzeugen ist nötig, wenn Wortfelder in `js/wordfields.js` oder feste Sätze
in `js/app.js` / `js/houses.js` geändert werden. Bereits vorhandene Dateien werden
übersprungen, nicht mehr benötigte gelöscht.

```bash
python3 -m venv venv
./venv/bin/pip install piper-tts
curl -LO https://huggingface.co/rhasspy/piper-voices/resolve/main/de/de_DE/thorsten/high/de_DE-thorsten-high.onnx
curl -LO https://huggingface.co/rhasspy/piper-voices/resolve/main/de/de_DE/thorsten/high/de_DE-thorsten-high.onnx.json
./venv/bin/python scripts/generate-voice.py . de_DE-thorsten-high.onnx 1.2
```

Für ein anderes Sprechtempo vorher den Ordner `audio/thorsten/` leeren.

Stimme: Thorsten-Voice von Thorsten Müller (Datensatz CC0, https://www.thorsten-voice.de),
Modell `de_DE-thorsten-high` von Piper (https://github.com/OHF-Voice/piper1-gpl).

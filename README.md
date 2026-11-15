# Formkurve

Meine persönliche Fitness-App: Training, Laufen, Ernährung und Fortschritt an einem Ort.
Technik: React + TypeScript + Vite, als **Web-App (PWA)**. Sie läuft im Browser und lässt sich aufs iPhone wie eine normale App installieren.

## Starten (am PC)

```bash
cd app
npm install   # nur beim ersten Mal
npm run dev
```

Danach im Browser: http://localhost:5173

## Aufs iPhone holen (im selben WLAN)

1. Am PC `npm run dev` laufen lassen.
2. Im Terminal steht eine Zeile **„Network: http://192.168.x.x:5173“**. Diese Adresse am iPhone in **Safari** öffnen.
3. Unten auf **Teilen ⬆️ → „Zum Home-Bildschirm“** tippen. Jetzt hast du ein App-Icon.

⚠️ So funktioniert die App nur, solange der PC läuft. Für eine dauerhafte Version (auch unterwegs) muss sie online gestellt werden, z. B. kostenlos über GitHub Pages oder Netlify. Das ist der nächste Schritt.

⚠️ Alle Daten werden **nur lokal im Browser** gespeichert (localStorage). Unter *Fortschritt → Backup exportieren* regelmäßig sichern.

## Aufbau

| Ordner/Datei | Inhalt |
|---|---|
| `src/data/training.ts` | Trainingsplan (Push, Pull, Legs, Brust/Rücken, Arme, Stabi) + Wochentage |
| `src/data/running.ts` | 12-Wochen-Laufplan |
| `src/data/nutrition.ts` | Kalorienziele, Lebensmittel, Mahlzeitenplan, Wochenend-Regeln |
| `src/lib/store.tsx` | Datenspeicherung (localStorage) |
| `src/lib/stats.ts` | Berechnungen (Wochenschnitt, Progression, Laufplan-Datum) |
| `src/screens/` | Die 5 Bildschirme: Heute, Training, Laufen, Essen, Fortschritt |

Plan ändern = einfach die Dateien in `src/data/` anpassen.

## Ideen für später
- Trainingsplan in der App bearbeiten (Übungen hinzufügen/tauschen)
- Online stellen (GitHub Pages/Netlify) → läuft ohne PC
- Sync zwischen Geräten / Benutzerkonten (für Veröffentlichung)
- Kraft-Diagramme pro Übung
- Erinnerungen (Wiegen, Laufen)
- Import aus Adidas Running / Apple Health

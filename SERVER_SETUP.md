# Server Setup für STL-Generierung

Dieser Server ermöglicht die direkte STL-Generierung im Browser ohne lokale OpenSCAD-Installation.

## Voraussetzungen

- Node.js (v14 oder höher)
- OpenSCAD (muss auf dem Server installiert sein)

## Installation

### 1. OpenSCAD installieren

#### macOS (mit Homebrew):
```bash
brew install --cask openscad
```

#### Ubuntu/Debian:
```bash
sudo apt-get update
sudo apt-get install openscad
```

#### Windows:
Download von https://openscad.org/downloads.html

### 2. Dependencies installieren

```bash
npm install
```

## Server starten

### Entwicklung (mit Auto-Reload):
```bash
npm run server:dev
```

### Produktion:
```bash
npm run server
```

Der Server läuft standardmäßig auf Port 3001.

## Verwendung

1. Server starten: `npm run server`
2. Frontend öffnen: `npm run dev` (in einem anderen Terminal)
3. Namen eingeben und validieren
4. "Generate STL Files" klicken
5. ZIP-Datei mit STL-Dateien wird heruntergeladen

## Fehlerbehebung

### "OpenSCAD not found"
- Stelle sicher, dass OpenSCAD installiert ist
- Prüfe mit: `openscad --version`
- Füge OpenSCAD zum PATH hinzu, falls nötig

### "Server not running"
- Stelle sicher, dass der Server läuft: `npm run server`
- Prüfe die Konsole auf Fehlermeldungen

## Docker-Alternative

Für eine einfachere Installation kann auch Docker verwendet werden:

```dockerfile
FROM node:18-alpine
RUN apk add --no-cache openscad
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 3001
CMD ["node", "server.js"]
```

## Sicherheitshinweise

- Der Server sollte nur in vertrauenswürdigen Netzwerken laufen
- Für Produktion: Rate-Limiting und Eingabevalidierung verstärken
- OpenSCAD-Prozesse haben ein Timeout von 30 Sekunden
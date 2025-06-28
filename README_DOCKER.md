# 🚀 Schnellstart mit Docker

## Alles mit einem Befehl starten:

```bash
npm run dev
```

Das macht automatisch:
1. ✅ Startet Docker-Container mit OpenSCAD
2. ✅ Startet Frontend-Server
3. ✅ Öffnet Browser auf http://localhost:3000

## Weitere Docker-Befehle:

```bash
# Logs anzeigen
npm run docker:logs

# Docker neu starten
npm run docker:restart

# Docker stoppen
npm run docker:stop

# Nur Frontend starten (wenn Docker schon läuft)
npm run frontend
```

## Troubleshooting:

### "Cannot connect to Docker daemon"
→ Docker Desktop starten

### "Port 3001 already in use"
→ `npm run docker:restart`

### STL-Button zeigt "Server not running"
→ Warte 5-10 Sekunden nach Start
→ Prüfe Logs: `npm run docker:logs`
# Docker Setup for Wedding Name Tag Generator

This project includes a Docker-based solution for server-side STL generation, eliminating the need to install OpenSCAD locally.

## 🚀 Quick Start

Start everything with a single command:

```bash
npm run dev
```

This automatically:
1. ✅ Checks if Docker is running
2. ✅ Builds and starts the Docker container with OpenSCAD
3. ✅ Starts the frontend server
4. ✅ Opens your browser at http://localhost:3000

## 📋 Prerequisites

- **Docker Desktop** - [Download here](https://www.docker.com/products/docker-desktop/)
- **Node.js** (v14 or higher) - [Download here](https://nodejs.org/)

## 🐳 Docker Commands

```bash
# Start everything (Docker + Frontend)
npm run dev

# Docker-specific commands
npm run docker:start    # Start Docker container
npm run docker:stop     # Stop Docker container  
npm run docker:restart  # Restart Docker container
npm run docker:logs     # View Docker logs

# Frontend only (if Docker is already running)
npm run frontend
```

## 🏗️ Architecture

The Docker setup consists of:

- **Frontend**: Runs on port 3000 (development server)
- **Backend API**: Node.js/Express server on port 3001 (inside Docker)
- **OpenSCAD**: Pre-installed in the Docker container

### Docker Container Details

- **Base Image**: Ubuntu 22.04 (supports both Intel and ARM architectures)
- **Included Software**:
  - Node.js 18
  - OpenSCAD
  - STIX fonts
  - Xvfb (for headless operation)

## 🔧 Configuration

### Environment Variables

The server supports these environment variables:

```bash
PORT=3001              # Server port (default: 3001)
NODE_ENV=production    # Environment mode
```

### Docker Compose

The `docker-compose.yml` file configures:
- Port mapping (3001:3001)
- Volume mounting for live code updates
- Automatic container restart

## 🚨 Troubleshooting

### "Docker Desktop is not running"
**Solution**: Start Docker Desktop and wait for it to fully initialize

### "Port 3001 already in use"
**Solution**: 
```bash
npm run docker:restart
```

### "STL generation failed"
**Solution**: Check Docker logs for errors
```bash
npm run docker:logs
```

### "Server not responding"
**Solution**: Wait 5-10 seconds after starting Docker, then check logs

### Apple Silicon Mac Issues
The Docker image is built for multi-architecture support. If you encounter issues:
1. Ensure Docker Desktop is updated
2. Enable "Use Rosetta for x86/amd64 emulation" in Docker settings

## 🔒 Security Considerations

- The server includes rate limiting (100 requests per minute)
- OpenSCAD processes have a 30-second timeout
- Temporary files are automatically cleaned up
- Input validation prevents malicious code injection

## 🛠️ Development

### Running Without Docker

If you prefer to run without Docker (requires local OpenSCAD installation):

```bash
# Install dependencies
npm install

# Start server
npm run server

# Start frontend (in another terminal)
npm run frontend
```

### Building Docker Image Manually

```bash
# Build image
docker build -t wedding-tag-generator .

# Run container
docker run -p 3001:3001 wedding-tag-generator
```

## 📝 API Endpoints

### POST /api/generate-stl
Generates STL files for the provided names.

**Request body:**
```json
{
  "names": ["JOHN", "JANE", "ALEX"]
}
```

**Response:** ZIP file containing STL files

## 🔄 Updates and Maintenance

### Updating Dependencies
```bash
# Update npm packages
npm update

# Rebuild Docker image
npm run docker:restart
```

### Viewing Logs
```bash
# Real-time logs
npm run docker:logs

# Or using Docker directly
docker-compose logs -f
```

## 💡 Tips

1. **Performance**: The first STL generation may be slower as fonts are loaded
2. **Batch Processing**: You can generate up to 50 names at once
3. **File Size**: Each STL file is approximately 1-2 MB
4. **Browser Compatibility**: Works with all modern browsers

## 🆘 Support

If you encounter issues:

1. Check the Docker logs: `npm run docker:logs`
2. Ensure Docker Desktop is running
3. Try restarting: `npm run docker:restart`
4. Check the [GitHub Issues](https://github.com/drehelm/wedding-name-tag-generator/issues)

---

For manual installation without Docker, see the main [README.md](README.md).
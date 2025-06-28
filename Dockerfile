FROM ubuntu:22.04

# Install dependencies and Node.js 18
RUN apt-get update && apt-get install -y \
    curl \
    openscad \
    fonts-stix \
    xvfb \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# OpenSCAD needs a virtual display
ENV DISPLAY=:99

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node dependencies
RUN npm ci

# Copy application files
COPY server.js ./
COPY src/templates ./src/templates/

# Create temp directory
RUN mkdir -p temp

# Expose port
EXPOSE 3001

# Start the server
CMD ["node", "server.js"]
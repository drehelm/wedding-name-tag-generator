const fs = require('fs-extra');
const path = require('path');

// Files to preserve during build (not to be overwritten)
const filesToPreserve = [
  'README.md',
  'GITHUB_PAGES_DEPLOYMENT.md',
  'LICENSE',
  'package.json',
  'package-lock.json',
  'node_modules',
  '.git',
  '.gitignore',
  'build.js'
];

async function build() {
  console.log('Starting build process...');
  
  try {
    // Source directory (public)
    const sourceDir = path.join(__dirname, 'public');
    
    // Check if source directory exists
    if (!fs.existsSync(sourceDir)) {
      throw new Error(`Source directory '${sourceDir}' does not exist`);
    }
    
    // Get all files in public directory
    const files = fs.readdirSync(sourceDir);
    
    // Process each file in the public directory
    for (const file of files) {
      const sourcePath = path.join(sourceDir, file);
      const destPath = path.join(__dirname, file);
      
      // Skip if this is a file to preserve
      if (filesToPreserve.includes(file)) {
        console.log(`Preserving existing file: ${file}`);
        continue;
      }
      
      // If it's a directory, copy recursively
      if (fs.statSync(sourcePath).isDirectory()) {
        console.log(`Copying directory: ${file}`);
        await fs.copy(sourcePath, destPath, { overwrite: true });
      } else {
        // If it's a file, copy it
        console.log(`Copying file: ${file}`);
        await fs.copyFile(sourcePath, destPath);
      }
    }
    
    console.log('Build completed successfully!');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

// Run the build
build();
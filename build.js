const fs = require('fs-extra');
const path = require('path');

// Files to preserve during build (not to be overwritten)
const filesToPreserve = [
  'README.md',
  'GITHUB_PAGES_DEPLOYMENT.md',
  'DEVELOPMENT_WORKFLOW.md',
  'VERSION.md',
  'LICENSE',
  'package.json',
  'package-lock.json',
  'node_modules',
  '.git',
  '.gitignore',
  'build.js',
  'manual-deploy.js',
  'scripts',
  'test-version-injection.js'
];

async function build() {
  console.log('Starting build process...');
  
  try {
    // Get version from package.json
    const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    const version = packageJson.version;
    const buildDate = new Date().toISOString();
    
    console.log(`Building version: ${version}`);
    console.log(`Build timestamp: ${buildDate}`);
    
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
        // If it's an HTML file, inject version information
        if (file.endsWith('.html')) {
          console.log(`Processing HTML file: ${file} (injecting version: ${version})`);
          let content = fs.readFileSync(sourcePath, 'utf8');
          
          // Inject version number into title
          content = content.replace(/<title>(.*?)<\/title>/, `<title>$1 (v${version})</title>`);
          
          // Add version meta tag if not exists
          if (!content.includes('<meta name="version"')) {
            content = content.replace('</head>', `  <meta name="version" content="${version}">\n  <meta name="build-date" content="${buildDate}">\n</head>`);
          }
          
          // Update the version info div with the actual version number
          content = content.replace(
            /<div class="version-info"><!-- Version info will be automatically inserted here by the build script --><\/div>/,
            `<div class="version-info">Version ${version} (Built: ${new Date().toLocaleDateString()})</div>`
          );
          
          // Write the modified content
          fs.writeFileSync(destPath, content);
        } else {
          // If it's any other file, just copy it
          console.log(`Copying file: ${file}`);
          await fs.copyFile(sourcePath, destPath);
        }
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
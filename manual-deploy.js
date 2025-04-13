const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

// Function to run shell commands
function run(command) {
  console.log(`Running: ${command}`);
  try {
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`Command failed: ${command}`);
    console.error(error.message);
    return false;
  }
}

// Process command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    target: 'gh-pages', // Default target branch
    message: 'GitHub Pages deployment'
  };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--target' && i + 1 < args.length) {
      options.target = args[i + 1];
      i++;
    } else if (arg === '--message' && i + 1 < args.length) {
      options.message = args[i + 1];
      i++;
    } else if (arg === '--help') {
      console.log('Usage: node manual-deploy.js [options]');
      console.log('Options:');
      console.log('  --target BRANCH   Target branch for deployment (default: gh-pages)');
      console.log('  --message MESSAGE Commit message (default: "GitHub Pages deployment")');
      console.log('  --help            Show this help message');
      process.exit(0);
    }
  }
  
  return options;
}

// Start deployment
console.log('Starting manual deployment...');
const options = parseArgs();
console.log(`Target branch: ${options.target}`);

try {
  // Get version from package.json
  const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  const version = packageJson.version;
  console.log(`Deploying version: ${version}`);
  
  // Build the project - this copies files from /public to root
  console.log('Building project...');
  require('./build.js');
  
  console.log('\nDeploying to GitHub Pages...');
  
  // Make sure git is configured
  const configCheck = execSync('git config user.name || echo "NOT_SET"').toString().trim();
  if (configCheck === 'NOT_SET') {
    console.log('Git user name not configured. Please run:');
    console.log('git config --global user.name "Your Name"');
    console.log('git config --global user.email "your.email@example.com"');
    process.exit(1);
  }
  
  // Save current branch and stash any changes
  const currentBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
  console.log(`Current branch: ${currentBranch}`);
  
  // Create a temp directory for deployment
  const deployDir = path.join(__dirname, '.deploy-temp');
  
  // Delete the temp directory if it exists
  if (fs.existsSync(deployDir)) {
    fs.removeSync(deployDir);
  }
  
  // Create the temp directory
  fs.mkdirSync(deployDir);
  
  // Copy only the files needed for GitHub Pages to the temp directory
  // This prevents us from accidentally deleting local files
  const filesToDeploy = [
    'index.html',
    'styles.css',
    'script.js',
    'templates',
    'images'
  ];
  
  for (const file of filesToDeploy) {
    const sourcePath = path.join(__dirname, file);
    const destPath = path.join(deployDir, file);
    
    if (fs.existsSync(sourcePath)) {
      if (fs.statSync(sourcePath).isDirectory()) {
        fs.copySync(sourcePath, destPath);
      } else {
        fs.copyFileSync(sourcePath, destPath);
      }
    }
  }
  
  // Initialize a new git repo in the temp directory
  process.chdir(deployDir);
  execSync('git init');
  execSync('git checkout -b gh-pages');
  
  // Add and commit files
  execSync('git add .');
  const commitMessage = `${options.message} (v${version})`;
  execSync(`git commit -m "${commitMessage}" --allow-empty`);
  
  // Add the remote
  const repoUrl = execSync('git config --get remote.origin.url').toString().trim();
  execSync(`git remote add origin ${repoUrl}`);
  
  // Push to the target branch
  if (!run(`git push origin gh-pages:${options.target} --force`)) {
    console.error(`Failed to push to ${options.target} branch`);
    process.exit(1);
  }
  
  // Clean up: go back to original directory and remove temp folder
  process.chdir(__dirname);
  fs.removeSync(deployDir);
  
  console.log('\nDeployment complete!');
  
  if (options.target === 'gh-pages') {
    console.log('Your site should be available shortly at:');
    console.log(`https://drehelm.github.io/wedding-name-tag-generator/`);
  } else {
    console.log(`Successfully deployed to '${options.target}' branch.`);
  }
  
} catch (error) {
  console.error('Deployment failed:', error);
  
  // Make sure we're back in the project directory
  try {
    process.chdir(__dirname);
  } catch (e) {
    // Already in the right directory, do nothing
  }
  
  process.exit(1);
}
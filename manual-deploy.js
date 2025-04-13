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
  
  // Build the project
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
  
  // Save current branch
  const currentBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
  console.log(`Current branch: ${currentBranch}`);
  
  // Create and switch to a temporary branch for deployment
  const tempBranch = `deploy-${Date.now()}`;
  if (!run(`git checkout -b ${tempBranch}`)) {
    console.error('Failed to create temporary branch');
    process.exit(1);
  }
  
  // Add all files
  if (!run('git add -A')) {
    console.error('Failed to add files');
    run(`git checkout ${currentBranch}`);
    run(`git branch -D ${tempBranch}`);
    process.exit(1);
  }
  
  // Commit with version in message
  const commitMessage = `${options.message} (v${version})`;
  if (!run(`git commit -m "${commitMessage}" --allow-empty`)) {
    console.error('Failed to commit files');
    run(`git checkout ${currentBranch}`);
    run(`git branch -D ${tempBranch}`);
    process.exit(1);
  }
  
  // Push to GitHub forcing the update of target branch
  if (!run(`git push origin HEAD:${options.target} --force`)) {
    console.error(`Failed to push to ${options.target} branch`);
    run(`git checkout ${currentBranch}`);
    run(`git branch -D ${tempBranch}`);
    process.exit(1);
  }
  
  // Return to original branch and clean up
  run(`git checkout ${currentBranch}`);
  run(`git branch -D ${tempBranch}`);
  
  console.log('\nDeployment complete!');
  
  if (options.target === 'gh-pages') {
    console.log('Your site should be available shortly at:');
    console.log(`https://drehelm.github.io/wedding-name-tag-generator/`);
  } else {
    console.log(`Successfully deployed to '${options.target}' branch.`);
  }
  
} catch (error) {
  console.error('Deployment failed:', error);
  process.exit(1);
}
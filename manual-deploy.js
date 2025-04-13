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

// Function to run commands that return output
function runWithOutput(command) {
  try {
    return { success: true, output: execSync(command).toString().trim() };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Process command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    target: 'gh-pages', // Default target branch
    message: 'GitHub Pages deployment',
    repoUrl: null // Will be set if provided via --repo flag
  };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--target' && i + 1 < args.length) {
      options.target = args[i + 1];
      i++;
    } else if (arg === '--message' && i + 1 < args.length) {
      options.message = args[i + 1];
      i++;
    } else if (arg === '--repo' && i + 1 < args.length) {
      options.repoUrl = args[i + 1];
      i++;
    } else if (arg === '--help') {
      console.log('Usage: node manual-deploy.js [options]');
      console.log('Options:');
      console.log('  --target BRANCH   Target branch for deployment (default: gh-pages)');
      console.log('  --message MESSAGE Commit message (default: "GitHub Pages deployment")');
      console.log('  --repo URL        Repository URL (optional, falls back to git remote origin)');
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
  const configCheck = runWithOutput('git config user.name || echo "NOT_SET"');
  if (!configCheck.success || configCheck.output === 'NOT_SET') {
    console.log('Git user name not configured. Please run:');
    console.log('git config --global user.name "Your Name"');
    console.log('git config --global user.email "your.email@example.com"');
    process.exit(1);
  }
  
  // Get repository URL - either from args, remote origin, or ask user
  let repoUrl = options.repoUrl;
  if (!repoUrl) {
    // Try to get from remote origin
    const remoteCheck = runWithOutput('git config --get remote.origin.url');
    if (remoteCheck.success) {
      repoUrl = remoteCheck.output;
      console.log(`Using repository URL from git remote: ${repoUrl}`);
    } else {
      console.error('No git remote origin found and no --repo option provided.');
      console.error('Please either:');
      console.error('1. Set up a git remote with: git remote add origin <your-repo-url>');
      console.error('2. Run this command with the --repo option: npm run manual-deploy -- --repo=<your-repo-url>');
      
      // Use a fallback for local testing (create a local branch)
      console.log('\nFalling back to local deployment for testing...');
      console.log('This will create a local gh-pages branch but not push to remote.');
      repoUrl = '';
    }
  }
  
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
  
  // If we have a repository URL, push to it
  if (repoUrl) {
    // Add the remote
    execSync(`git remote add origin ${repoUrl}`);
    
    // Push to the target branch
    if (!run(`git push origin gh-pages:${options.target} --force`)) {
      console.error(`Failed to push to ${options.target} branch`);
      process.exit(1);
    }
    
    console.log('\nDeployment complete!');
    
    if (options.target === 'gh-pages') {
      console.log('Your site should be available shortly at:');
      
      // Extract the GitHub username and repo from the URL
      const match = repoUrl.match(/github\.com[:/]([^/]+)\/([^/.]+)/);
      if (match) {
        const [, username, repo] = match;
        console.log(`https://${username}.github.io/${repo}/`);
      } else {
        console.log('GitHub Pages URL depends on your repository name and owner.');
      }
    } else {
      console.log(`Successfully deployed to '${options.target}' branch.`);
    }
  } else {
    console.log('\nLocal branch created but not pushed to remote.');
    console.log('To push manually, use:');
    console.log('git push origin gh-pages:<target-branch> --force');
  }
  
  // Clean up: go back to original directory and remove temp folder
  process.chdir(__dirname);
  fs.removeSync(deployDir);
  
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
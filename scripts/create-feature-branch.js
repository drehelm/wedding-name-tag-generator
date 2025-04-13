const { execSync } = require('child_process');
const readline = require('readline');

// Function to run shell commands
function run(command) {
  console.log(`Running: ${command}`);
  try {
    const output = execSync(command, { encoding: 'utf8' });
    return { success: true, output };
  } catch (error) {
    console.error(`Command failed: ${command}`);
    console.error(error.message);
    return { success: false, error };
  }
}

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Prompt for feature information
console.log('Feature Branch Creation Utility');
console.log('==============================\n');

rl.question('Enter feature name (e.g., "preview-functionality", "multiple-clip-designs"): ', (featureName) => {
  if (!featureName || featureName.trim() === '') {
    console.error('Error: Feature name cannot be empty');
    rl.close();
    return;
  }

  // Clean up feature name for branch
  const cleanName = featureName.trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/-+/g, '-')         // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, '');      // Remove leading/trailing hyphens

  // Determine branch type
  rl.question('Branch type (1: feature, 2: bugfix, 3: enhancement, 4: other): ', (typeChoice) => {
    let branchPrefix;
    
    switch (typeChoice.trim()) {
      case '1':
      case 'feature':
        branchPrefix = 'feature';
        break;
      case '2':
      case 'bugfix':
        branchPrefix = 'bugfix';
        break;
      case '3':
      case 'enhancement':
        branchPrefix = 'enhancement';
        break;
      case '4':
      case 'other':
        rl.question('Enter custom branch prefix: ', (customPrefix) => {
          createBranch(customPrefix.trim(), cleanName);
        });
        return;
      default:
        branchPrefix = 'feature';
    }
    
    createBranch(branchPrefix, cleanName);
  });
});

function createBranch(prefix, name) {
  const branchName = `${prefix}/${name}`;
  
  console.log(`\nCreating branch: ${branchName}`);
  
  // Check if on develop branch
  const currentBranch = run('git rev-parse --abbrev-ref HEAD').output.trim();
  
  if (currentBranch !== 'develop') {
    rl.question(`You are not on the develop branch (currently on ${currentBranch}). Switch to develop? (y/n): `, (answer) => {
      if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        // Try to switch to develop branch
        const switchResult = run('git checkout develop');
        
        if (!switchResult.success) {
          // Try to create develop branch if it doesn't exist
          rl.question('Develop branch not found. Create it? (y/n): ', (createAnswer) => {
            if (createAnswer.toLowerCase() === 'y' || createAnswer.toLowerCase() === 'yes') {
              if (run('git checkout -b develop').success) {
                run('git push -u origin develop');
                continueWithBranchCreation(branchName);
              } else {
                console.error('Failed to create develop branch');
                rl.close();
              }
            } else {
              console.log('Aborting branch creation');
              rl.close();
            }
          });
          return;
        }
        
        continueWithBranchCreation(branchName);
      } else {
        rl.question(`Create ${branchName} from ${currentBranch} instead? (y/n): `, (createAnswer) => {
          if (createAnswer.toLowerCase() === 'y' || createAnswer.toLowerCase() === 'yes') {
            continueWithBranchCreation(branchName);
          } else {
            console.log('Aborting branch creation');
            rl.close();
          }
        });
      }
    });
  } else {
    continueWithBranchCreation(branchName);
  }
}

function continueWithBranchCreation(branchName) {
  // Make sure we have latest changes
  run('git pull');
  
  // Create and switch to the new branch
  if (run(`git checkout -b ${branchName}`).success) {
    console.log(`\nSuccessfully created branch: ${branchName}`);
    
    rl.question('Push branch to remote repository? (y/n): ', (answer) => {
      if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        if (run(`git push -u origin ${branchName}`).success) {
          console.log(`\nBranch ${branchName} pushed to remote repository`);
        } else {
          console.error('Failed to push branch to remote repository');
        }
      } else {
        console.log('\nBranch created locally only. Push manually when ready:');
        console.log(`git push -u origin ${branchName}`);
      }
      
      console.log('\nYou are now on branch:', branchName);
      console.log('Happy coding!');
      rl.close();
    });
  } else {
    console.error(`Failed to create branch ${branchName}`);
    rl.close();
  }
}
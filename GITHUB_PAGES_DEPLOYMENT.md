# Deploying to GitHub Pages

This guide explains how to deploy the Wedding Name Tag Generator to GitHub Pages using npm build scripts.

## Step 1: Create a GitHub Repository

1. Log in to your GitHub account
2. Click the "+" icon in the top right and select "New repository"
3. Name your repository (e.g., "wedding-name-tag-generator")
4. Make it public (GitHub Pages requires this for free accounts)
5. Click "Create repository"

## Step 2: Set Up Your Project

1. Clone your repository locally:
   ```
   git clone https://github.com/yourusername/wedding-name-tag-generator.git
   cd wedding-name-tag-generator
   ```

2. Copy all project files into this directory (or if you already have the project, just continue in that directory)

3. Install the required npm packages:
   ```
   npm install
   ```

## Step 3: Build and Deploy

Our npm scripts make deployment simple:

1. Run the build script to copy files from the `public` directory to the repository root:
   ```
   npm run build
   ```

2. Add and commit the generated files:
   ```
   git add .
   git commit -m "Build for GitHub Pages"
   ```

3. Push to GitHub:
   ```
   git push origin main
   ```

4. Optional: Use the gh-pages package to automate deployment:
   ```
   npm run deploy
   ```
   This will build the project and push to the gh-pages branch automatically.

## Step 4: Configure GitHub Pages

1. Go to your GitHub repository
2. Click "Settings"
3. Scroll down to the "GitHub Pages" section
4. For the source, select either:
   - `main` branch (if you pushed directly to main)
   - `gh-pages` branch (if you used the automated deploy command)
5. Click "Save"

GitHub will provide you with a URL where your site is published (typically https://yourusername.github.io/wedding-name-tag-generator/)

## Step 5: Verify Your Deployment

1. Wait a few minutes for GitHub Pages to build your site
2. Visit the URL provided in the GitHub Pages settings
3. Test that you can:
   - Enter names
   - Generate and download a ZIP file
   - Extract and use the files in the ZIP

## Updating Your Site

To update your site after making changes:

1. Make your changes to files in the `public` directory
2. Run the build process again:
   ```
   npm run build
   ```
3. Commit and push your changes:
   ```
   git add .
   git commit -m "Update site"
   git push
   ```
4. Or use the automated deployment:
   ```
   npm run deploy
   ```

## Customization

You can customize various aspects of the site:

1. Web Interface: Edit files in the `public` directory
2. Templates: Modify files in the `public/templates` directory
3. Appearance: Update the CSS in `public/styles.css`

Remember to run the build script after making changes to see them reflected in the deployed site.

## Troubleshooting

1. **Files not updating**: Make sure you're running the build script after changes
2. **Template files missing**: Check that `public/templates` contains all necessary files
3. **Page not found**: Verify GitHub Pages is configured correctly in your repository settings
4. **Build script errors**: Make sure you have installed all dependencies with `npm install`

## Technical Details

The build process:
1. Copies all files from the `public` directory to the repository root
2. Preserves important files like README.md and package.json
3. Ensures proper placement of template files required by the application

This approach allows GitHub Pages to serve the application from the repository root while keeping the source code organized with the public files in their own directory.
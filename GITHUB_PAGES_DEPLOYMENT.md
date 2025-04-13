# Deploying to GitHub Pages

This guide explains how to deploy the Wedding Name Tag Generator to GitHub Pages.

## Step 1: Create a GitHub Repository

1. Log in to your GitHub account
2. Click the "+" icon in the top right and select "New repository"
3. Name your repository (e.g., "wedding-name-tag-generator")
4. Make it public (GitHub Pages requires this for free accounts)
5. Click "Create repository"

## Step 2: Push Your Code

You have two options for deploying to GitHub Pages:

### Option A: Deploy from the `public` directory

With this approach, you'll push the entire project but only deploy the `public` directory:

1. Initialize Git in your project folder:
   ```
   git init
   ```

2. Create a `.gitignore` file (optional):
   ```
   echo "node_modules/" > .gitignore
   ```

3. Add and commit your files:
   ```
   git add .
   git commit -m "Initial commit"
   ```

4. Connect to your GitHub repository:
   ```
   git remote add origin https://github.com/yourusername/wedding-name-tag-generator.git
   ```

5. Push your code:
   ```
   git push -u origin main
   ```

### Option B: Push only the `public` directory

Alternatively, you can push only the files needed for GitHub Pages:

1. Navigate to your public directory:
   ```
   cd public
   ```

2. Initialize Git:
   ```
   git init
   ```

3. Add and commit files:
   ```
   git add .
   git commit -m "Initial commit"
   ```

4. Connect to your GitHub repository:
   ```
   git remote add origin https://github.com/yourusername/wedding-name-tag-generator.git
   ```

5. Push to GitHub:
   ```
   git push -u origin main
   ```

## Step 3: Configure GitHub Pages

1. Go to your GitHub repository
2. Click "Settings"
3. Scroll down to the "GitHub Pages" section
4. For deployment source, select one of these options:
   - If you used Option A: Select "main" branch and "/public" folder
   - If you used Option B: Select "main" branch and root folder
5. Click "Save"

GitHub will provide you with a URL where your site is published (typically https://yourusername.github.io/wedding-name-tag-generator/)

## Step 4: Verify Your Deployment

1. Wait a few minutes for GitHub Pages to build your site
2. Visit the URL provided in the GitHub Pages settings
3. Test that you can:
   - Enter names
   - Generate and download a ZIP file
   - Extract and use the files in the ZIP

## Troubleshooting

1. **Page not found**: Make sure your repository is public and GitHub Pages is properly configured
2. **Resources not loading**: Check that all paths in your HTML file are relative
3. **Templates not working**: Ensure all template files are in the public/templates directory
4. **Custom domain**: You can set up a custom domain in the GitHub Pages settings

## Updating Your Site

To update your site after making changes:

1. Make your changes to the code
2. Commit and push to GitHub:
   ```
   git add .
   git commit -m "Update site"
   git push
   ```
3. GitHub Pages will automatically rebuild and deploy your site

## Important Notes

- GitHub Pages only serves static content (HTML, CSS, JavaScript)
- All processing happens in the user's browser using JavaScript
- We're using JSZip library for client-side ZIP file creation
- No server-side code (like Node.js) will run on GitHub Pages

Your Wedding Name Tag Generator should now be accessible to anyone with the GitHub Pages URL!
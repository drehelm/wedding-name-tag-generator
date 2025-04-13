# Wedding Name Tag Generator - Web Application

This project provides a web-based interface for generating customized 3D printable wedding name tags. Users can enter names, and the application generates a downloadable package with everything needed to create the name tags.

## How It Works

1. Users visit the web page and enter names (one per line)
2. The serverless function generates a ZIP package containing:
   - Customized Python script with pre-populated names
   - OpenSCAD template
   - SVG clip design
   - README with clear instructions
3. Users download and extract the ZIP
4. They follow the instructions to generate 3D printable STL files

## Project Structure

```
/
├── netlify.toml          # Netlify configuration
├── package.json          # Project dependencies
├── public/               # Frontend files
│   ├── index.html        # Web interface
│   ├── styles.css        # Styling
│   └── script.js         # Frontend JavaScript
├── functions/            # Serverless functions
│   └── generate-name-tags.js  # Main function
└── templates/            # Templates for file generation
    ├── Clip1.svg         # SVG clip design
    ├── templatev2.scad   # OpenSCAD template
    ├── generateNames.py.template  # Python script template
    └── README.md.template  # Instructions template
```

## Local Development

1. Install the required dependencies:
   ```
   npm install
   ```

2. Start the development server:
   ```
   npm run dev
   ```

3. Open http://localhost:8888 in your browser to view the application.

## Deployment

### Option 1: Netlify Deployment

1. Install the Netlify CLI if you haven't already:
   ```
   npm install netlify-cli -g
   ```

2. Login to Netlify:
   ```
   netlify login
   ```

3. Create a new site:
   ```
   netlify deploy
   ```

4. When prompted, choose:
   - Publish directory: `public`
   - Functions directory: `functions`

5. Deploy to production:
   ```
   netlify deploy --prod
   ```

### Option 2: GitHub + Netlify Integration

1. Push this project to a GitHub repository.

2. Log in to [Netlify](https://netlify.com).

3. Click "New site from Git" and select your GitHub repository.

4. Configure the build settings:
   - Build command: Leave blank (no build step needed)
   - Publish directory: `public`
   - Advanced build settings: Add environment variables if needed

5. Click "Deploy site".

## Customization

- **Change Clip Design**: Replace `templates/Clip1.svg` with your own design
- **Modify OpenSCAD Template**: Edit `templates/templatev2.scad` to change the 3D model
- **Update Instructions**: Modify `templates/README.md.template` to customize the instructions

## Future Improvements

- Add a preview of the name tag
- Support for different fonts and text sizes
- Multiple clip design options
- Direct STL generation in the browser

## License

MIT

## Credits

Based on the original project by ahelmer.
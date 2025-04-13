# Technical Implementation Plan - The Wheel Phase

## Project Overview
Create a simple web interface where users can input names and generate a customized package to create 3D printable name tags, with no coding knowledge required.

## System Components

### 1. Frontend (Static Website)

#### HTML Structure
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>3D Name Tag Generator</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container">
        <header>
            <h1>Wedding Name Tag Generator</h1>
            <p>Create personalized drink clip name tags for your event</p>
        </header>

        <main>
            <div class="form-container">
                <form id="nameForm">
                    <div class="input-group">
                        <label for="nameList">Enter Names (one per line):</label>
                        <textarea id="nameList" rows="10" placeholder="JOHN&#10;JANE&#10;ALEX&#10;TAYLOR"></textarea>
                        <p class="hint">Names work best in ALL CAPS</p>
                    </div>
                    
                    <div class="actions">
                        <button type="submit" id="generateBtn">Generate Name Tags</button>
                    </div>
                </form>
            </div>
            
            <div class="instructions">
                <h2>How It Works</h2>
                <ol>
                    <li>Enter your names (one per line)</li>
                    <li>Click "Generate Name Tags"</li>
                    <li>Download the ZIP file</li>
                    <li>Follow the included instructions to create your 3D printable name tags</li>
                </ol>
            </div>
        </main>

        <footer>
            <p>Based on <a href="https://github.com/yourusername/name-tag-generator">Name Tag Generator</a></p>
        </footer>
    </div>

    <script src="script.js"></script>
</body>
</html>
```

#### CSS Styling
```css
/* Basic styling for the name tag generator */
* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

body {
    font-family: Arial, sans-serif;
    line-height: 1.6;
    color: #333;
    background-color: #f4f4f4;
    padding: 20px;
}

.container {
    max-width: 800px;
    margin: 0 auto;
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

header {
    text-align: center;
    margin-bottom: 30px;
}

header h1 {
    margin-bottom: 10px;
    color: #2c3e50;
}

.form-container {
    margin-bottom: 30px;
}

.input-group {
    margin-bottom: 20px;
}

label {
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
}

textarea {
    width: 100%;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-family: monospace;
}

.hint {
    font-size: 0.8em;
    color: #666;
    margin-top: 5px;
}

.actions {
    text-align: center;
}

button {
    background-color: #3498db;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
    transition: background-color 0.3s;
}

button:hover {
    background-color: #2980b9;
}

.instructions {
    background-color: #f9f9f9;
    padding: 20px;
    border-radius: 4px;
    border-left: 4px solid #3498db;
}

.instructions h2 {
    margin-bottom: 10px;
}

.instructions ol {
    margin-left: 20px;
}

footer {
    margin-top: 30px;
    text-align: center;
    font-size: 0.9em;
    color: #666;
}

footer a {
    color: #3498db;
    text-decoration: none;
}

footer a:hover {
    text-decoration: underline;
}
```

#### JavaScript Functionality
```javascript
document.addEventListener('DOMContentLoaded', function() {
    const nameForm = document.getElementById('nameForm');
    const nameList = document.getElementById('nameList');
    const generateBtn = document.getElementById('generateBtn');

    nameForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get the names from the textarea
        const names = nameList.value.trim().split('\n').filter(name => name.trim() !== '');
        
        if (names.length === 0) {
            alert('Please enter at least one name');
            return;
        }
        
        // Show processing status
        generateBtn.textContent = 'Processing...';
        generateBtn.disabled = true;
        
        // Call the serverless function
        generateNameTags(names)
            .then(data => {
                // Reset button
                generateBtn.textContent = 'Generate Name Tags';
                generateBtn.disabled = false;
                
                // Handle the download
                if (data && data.downloadUrl) {
                    // Trigger download
                    window.location.href = data.downloadUrl;
                } else {
                    throw new Error('Failed to generate name tags');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('There was an error generating your name tags. Please try again.');
                
                // Reset button
                generateBtn.textContent = 'Generate Name Tags';
                generateBtn.disabled = false;
            });
    });
    
    // Function to call the serverless function
    async function generateNameTags(names) {
        try {
            const response = await fetch('/.netlify/functions/generate-name-tags', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ names }),
            });
            
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    }
});
```

### 2. Backend (Serverless Function)

#### Netlify Function Structure
```
/
├── netlify.toml        # Netlify configuration
├── functions/          # Serverless functions directory
│   └── generate-name-tags.js  # Main function
├── templates/          # Templates for generating files
│   ├── generateNames.py.template
│   ├── README.md.template
│   ├── templatev2.scad
│   └── Clip1.svg
└── public/             # Static website files
    ├── index.html
    ├── styles.css
    └── script.js
```

#### netlify.toml Configuration
```toml
[build]
  publish = "public"
  functions = "functions"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### Serverless Function Implementation (Node.js)
```javascript
// functions/generate-name-tags.js
const fs = require('fs').promises;
const path = require('path');
const archiver = require('archiver');
const { Readable } = require('stream');

exports.handler = async function(event, context) {
    try {
        // Parse the incoming request body
        const body = JSON.parse(event.body);
        const names = body.names || [];
        
        if (!names.length) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'No names provided' })
            };
        }
        
        // Create a ZIP file in memory
        const archive = archiver('zip', {
            zlib: { level: 9 } // Compression level
        });
        
        const streamBuffers = [];
        const output = new Readable();
        output._read = () => {}; // Implement _read method
        
        output.on('data', (data) => {
            streamBuffers.push(data);
        });
        
        archive.pipe(output);
        
        // Read template files
        const templateDir = path.join(__dirname, '..', 'templates');
        
        // Add SCAD template
        const scadContent = await fs.readFile(path.join(templateDir, 'templatev2.scad'), 'utf8');
        archive.append(scadContent, { name: 'templatev2.scad' });
        
        // Add SVG file
        const svgContent = await fs.readFile(path.join(templateDir, 'Clip1.svg'), 'utf8');
        archive.append(svgContent, { name: 'Clip1.svg' });
        
        // Generate Python script with names
        const pyTemplateContent = await fs.readFile(
            path.join(templateDir, 'generateNames.py.template'), 
            'utf8'
        );
        
        // Replace placeholder with actual names
        const namesList = names.map(name => `    "${name}"`).join(',\n');
        const pyContent = pyTemplateContent.replace('{{NAMES_LIST}}', namesList);
        
        archive.append(pyContent, { name: 'generateNames.py' });
        
        // Add README with instructions
        const readmeTemplateContent = await fs.readFile(
            path.join(templateDir, 'README.md.template'), 
            'utf8'
        );
        
        const readmeContent = readmeTemplateContent.replace(
            '{{NAMES_COUNT}}', 
            names.length.toString()
        );
        
        archive.append(readmeContent, { name: 'README.md' });
        
        // Finalize the archive
        await new Promise((resolve, reject) => {
            archive.finalize();
            archive.on('error', reject);
            output.on('end', resolve);
        });
        
        // Convert buffer to base64
        const buffer = Buffer.concat(streamBuffers);
        const base64data = buffer.toString('base64');
        
        // Create a data URL for the download
        const dataUrl = `data:application/zip;base64,${base64data}`;
        
        return {
            statusCode: 200,
            body: JSON.stringify({ 
                downloadUrl: dataUrl,
                message: 'Name tags package generated successfully' 
            })
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to generate name tags package' })
        };
    }
};
```

### 3. Templates

#### Python Script Template
```python
import subprocess
import os
import sys
import shutil
import tempfile
from pathlib import Path

# List of names to generate STL files for
names = [
{{NAMES_LIST}}
]

# Paths
template_path = Path("templatev2.scad").resolve()
output_dir = Path("output_stls").resolve()

def find_openscad():
    # Try default search
    executable = shutil.which("openscad")

    # Mac typical path
    if not executable and sys.platform == "darwin":
        mac_path = "/Applications/OpenSCAD.app/Contents/MacOS/OpenSCAD"
        if os.path.exists(mac_path):
            executable = mac_path

    # Windows: check for .exe explicitly if not found
    if not executable and sys.platform == "win32":
        possible_names = ["openscad.exe", "OpenSCAD.exe"]
        for name in possible_names:
            path = shutil.which(name)
            if path:
                executable = path
                break

    return executable

def test_setup(openscad_exe):
    print("Testing setup...")

    # Check OpenSCAD binary
    if not openscad_exe:
        print("Error: OpenSCAD executable not found. Ensure it's installed and in your PATH.")
        return False

    print(f"Using OpenSCAD at: {openscad_exe}")

    try:
        result = subprocess.run([openscad_exe, "-v"], capture_output=True, text=True)
        if result.returncode != 0:
            print(f"Error: OpenSCAD returned error code {result.returncode}.")
            return False
        print(f"OpenSCAD version info: {result.stdout.strip()}")
    except Exception as e:
        print(f"Error running OpenSCAD: {e}")
        return False

    # Check template file
    if not template_path.exists():
        print(f"Error: Template file '{template_path}' does not exist.")
        return False
    print(f"Template file found: {template_path}")

    # Check output directory
    try:
        output_dir.mkdir(parents=True, exist_ok=True)
        print(f"Output directory ready: {output_dir}")
    except Exception as e:
        print(f"Error creating output directory '{output_dir}': {e}")
        return False

    print("All tests passed.")
    return True

def generate_stls(openscad_exe):
    output_dir.mkdir(parents=True, exist_ok=True)

    with open(template_path, "r") as template_file:
        template_content = template_file.read()

    for name in names:
        modified_content = template_content.replace('name = "Your Text";', f'name = "{name}";')

        # Use a temporary file for the .scad
        with tempfile.NamedTemporaryFile(mode="w", suffix=".scad", delete=False) as temp_scad_file:
            temp_scad_file.write(modified_content)
            temp_scad_path = Path(temp_scad_file.name)

        output_stl_path = output_dir / f"{name}.stl"

        print(f"Generating STL for: {name}")
        try:
            subprocess.run(
                [openscad_exe, "-o", str(output_stl_path), str(temp_scad_path)],
                check=True
            )
            print(f"STL generated: {output_stl_path}")
        except subprocess.CalledProcessError as e:
            print(f"Error generating STL for '{name}': {e}")
        finally:
            try:
                temp_scad_path.unlink()  # Delete the temp file
            except Exception as e:
                print(f"Warning: Could not delete temporary file '{temp_scad_path}': {e}")

if __name__ == "__main__":
    openscad_exe = find_openscad()

    if len(sys.argv) > 1 and sys.argv[1] == "test":
        if not test_setup(openscad_exe):
            sys.exit(1)
    else:
        if not test_setup(openscad_exe):
            sys.exit(1)
        generate_stls(openscad_exe)
```

#### README Template
```markdown
# Wedding Name Tag Generator

## Overview
This package contains everything you need to generate 3D printable name tags for your event. The names you entered ({{NAMES_COUNT}} total) have already been added to the script.

## Prerequisites
Before you can generate the name tags, you'll need to install:

1. **OpenSCAD** - Download from https://www.openscad.org/downloads.html
2. **Python 3** - Download from https://www.python.org/downloads/
   - Windows users: Be sure to check "Add Python to PATH" during installation!
3. **Stix Two Text Font** - Download from https://fonts.google.com/specimen/STIX+Two+Text
   - Click "Download family" and install the STIXTwoText-Regular.ttf font

## Generate Your STL Files

### On Windows
1. Open Command Prompt
2. Navigate to the folder where you extracted this ZIP
   ```
   cd path\to\folder
   ```
3. Run the script:
   ```
   python generateNames.py
   ```

### On Mac/Linux
1. Open Terminal
2. Navigate to the folder where you extracted this ZIP
   ```
   cd path/to/folder
   ```
3. Run the script:
   ```
   python3 generateNames.py
   ```

The script will create a folder called `output_stls` containing all your name tags as individual STL files.

## Troubleshooting
- **OpenSCAD not found**: Verify it's installed. On Mac, check /Applications/OpenSCAD.app
- **Python not recognized**: Reinstall Python 3 and ensure "Add Python to PATH" is selected (Windows)
- **Font not working**: Make sure you installed the Stix Two Text font properly

## 3D Printing Tips
- Material: PETG works well (more springy than PLA)
- Size: Consider scaling to 70% if using for standard wine glasses
- Infill: 30% recommended
- Layer Height: 0.2mm

## Credits
Generated using the Wedding Name Tag Generator web tool.
Original project by ahelmer.
```

## Deployment Steps

### 1. Set Up Netlify Account
1. Sign up for a free Netlify account at https://netlify.com
2. Connect your GitHub/GitLab account or prepare to deploy manually

### 2. Project Setup
1. Create a new repository with the structure outlined above
2. Create the necessary template files:
   - Copy the original `templatev2.scad` file as is
   - Copy the original `Clip1.svg` file as is
   - Create the Python template from the original script
   - Create the README template with instructions

### 3. Install Required Packages
```bash
npm init -y
npm install netlify-cli --save-dev
npm install archiver --save
```

### 4. Test Locally
```bash
npx netlify dev
```

### 5. Deploy to Netlify
```bash
npx netlify deploy --prod
```

## Next Steps (The Skateboard)
Once the basic functionality is working, consider these enhancements:

1. Add a simple 2D SVG preview of the name tag
2. Add basic configuration options:
   - Text size slider
   - Scale factor option
3. Add better error handling and validation
4. Add a demo/example image

## Technical Considerations

### Security
- Input validation to prevent command injection
- Limit number of names to prevent abuse
- Consider rate limiting if necessary

### Performance
- Optimize ZIP file generation
- Use efficient streaming for file handling
- Consider caching common assets

### Compatibility
- Test across major browsers
- Ensure mobile responsiveness
- Verify download works on different platforms
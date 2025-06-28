document.addEventListener('DOMContentLoaded', function() {
    const nameForm = document.getElementById('nameForm');
    const nameList = document.getElementById('nameList');
    const generateBtn = document.getElementById('generateBtn');
    const validationFeedback = document.getElementById('validationFeedback');
    const charCount = document.getElementById('charCount');
    const validateBtn = document.getElementById('validateBtn');
    const generateSTLBtn = document.getElementById('generateSTLBtn');
    
    let isValid = false;
    const MAX_CHARS = 14;

    // Load template files
    Promise.all([
        fetch('templates/templatev2.scad').then(response => response.text()),
        fetch('templates/Clip1.svg').then(response => response.text()),
        fetch('templates/generateNames.py.template').then(response => response.text()),
        fetch('templates/README.md.template').then(response => response.text())
    ]).then(([scadTemplate, svgContent, pyTemplate, readmeTemplate]) => {
        // Store templates for later use
        window.templates = {
            scad: scadTemplate,
            svg: svgContent,
            python: pyTemplate,
            readme: readmeTemplate
        };
        
        // Enable validation button once templates are loaded
        validateBtn.disabled = false;
        validateBtn.textContent = 'Validate Names';
    }).catch(error => {
        console.error('Error loading templates:', error);
        validateBtn.textContent = 'Error: Could not load templates';
    });

    // Update character count and auto-uppercase as user types
    nameList.addEventListener('input', function() {
        // Auto-uppercase the input
        const cursorPosition = this.selectionStart;
        this.value = this.value.toUpperCase();
        this.setSelectionRange(cursorPosition, cursorPosition);
        
        // If there are multiple lines, get the current line
        const lines = this.value.split('\n');
        const currentLineIndex = this.value.substring(0, cursorPosition).split('\n').length - 1;
        const currentLine = lines[currentLineIndex] || '';
        
        // Update the character count for the current line
        charCount.textContent = `${currentLine.length}/${MAX_CHARS} characters`;
        
        // Visually indicate if line is too long
        if (currentLine.length > MAX_CHARS) {
            charCount.style.color = '#e74c3c';
        } else if (currentLine.length > MAX_CHARS * 0.8) {
            charCount.style.color = '#f39c12';
        } else {
            charCount.style.color = '#666';
        }
        
        // Clear validation state when user modifies input
        isValid = false;
        generateBtn.disabled = true;
        generateSTLBtn.disabled = true;
        validateBtn.classList.remove('validated');
        validateBtn.textContent = 'Validate Names';
        hideValidationError();
    });

    function validateNames() {
        const text = nameList.value.trim();
        
        if (!text) {
            showValidationError('Please enter at least one name.');
            return false;
        }
        
        const names = text.split('\n').filter(name => name.trim() !== '');
        
        if (names.length === 0) {
            showValidationError('Please enter at least one name.');
            return false;
        }
        
        // Check each name
        for (let i = 0; i < names.length; i++) {
            const name = names[i].trim();
            
            // Check if the name is too long
            if (name.length > MAX_CHARS) {
                showValidationError(`Line ${i + 1}: "${name}" is too long (${name.length} characters). Maximum is ${MAX_CHARS} characters.`);
                return false;
            }
            
            // Check for invalid characters
            const validPattern = /^[A-Z0-9\s-]+$/;
            if (!validPattern.test(name)) {
                const invalidChars = name.split('').filter(char => !validPattern.test(char));
                const uniqueInvalidChars = [...new Set(invalidChars)];
                const errorMessage = `Line ${i + 1}: "${name}" contains invalid characters: ${uniqueInvalidChars.join(', ')}<br>Only letters, numbers, spaces, and hyphens are allowed.`;
                
                showValidationError(errorMessage);
                return false;
            }
        }
        
        // All names are valid
        hideValidationError();
        return true;
    }
    
    function showValidationError(message) {
        validationFeedback.innerHTML = message;
        validationFeedback.style.display = 'block';
        isValid = false;
        generateBtn.disabled = true;
        generateSTLBtn.disabled = true;
    }
    
    function hideValidationError() {
        validationFeedback.style.display = 'none';
        isValid = true;
        generateBtn.disabled = false;
        generateSTLBtn.disabled = false;
    }
    
    // Add validation button click handler
    validateBtn.addEventListener('click', function() {
        validateNames();
        if (isValid) {
            this.classList.add('validated');
            this.textContent = 'Names Validated ✓';
            
            // Reset after 3 seconds
            setTimeout(() => {
                this.classList.remove('validated');
                this.textContent = 'Validate Names';
            }, 3000);
        }
    });

    nameForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Double-check validation before proceeding
        if (!isValid && !validateNames()) {
            return;
        }
        
        // Get the names from the textarea
        const names = nameList.value.trim().split('\n').filter(name => name.trim() !== '');
        
        // Show processing status
        generateBtn.textContent = 'Generating...';
        generateBtn.disabled = true;
        
        try {
            // Create a new ZIP file
            const zip = new JSZip();
            
            // Add the SVG file
            zip.file('Clip1.svg', window.templates.svg);
            
            // Generate OpenSCAD files for each name
            names.forEach(name => {
                const cleanName = name.trim();
                // Replace the placeholder with the actual name
                const personalizedScad = window.templates.scad.replace(/name = "[^"]*"/, `name = "${cleanName}"`);
                zip.file(`${cleanName}_tag.scad`, personalizedScad);
            });
            
            // Create the Python script content with the names
            const pythonScript = window.templates.python.replace('{{NAMES_LIST}}', names.map(n => `"${n.trim()}"`).join(', '));
            zip.file('generateNames.py', pythonScript);
            
            // Create the README with personalized content
            const readmeContent = window.templates.readme
                .replace('{{NAME_COUNT}}', names.length)
                .replace('{{NAMES_LIST}}', names.map(n => `- ${n.trim()}_tag.scad`).join('\n'))
                .replace('{{GENERATED_DATE}}', new Date().toLocaleString());
            
            zip.file('README.md', readmeContent);
            
            // Generate the ZIP file
            zip.generateAsync({type: 'blob'}).then(function(content) {
                // Create a download link
                const url = URL.createObjectURL(content);
                const downloadLink = document.createElement('a');
                downloadLink.href = url;
                downloadLink.download = 'wedding-name-tags.zip';
                
                // Trigger the download
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);
                
                // Clean up
                URL.revokeObjectURL(url);
                
                // Reset the button
                generateBtn.textContent = 'Generate Name Tags';
                generateBtn.disabled = false;
            });
            
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    });

    // Add STL generation button click handler
    generateSTLBtn.addEventListener('click', async function() {
        // Double-check validation before proceeding
        if (!isValid && !validateNames()) {
            return;
        }
        
        // Get the names from the textarea
        const names = nameList.value.trim().split('\n').filter(name => name.trim() !== '');
        
        // Show processing status
        const originalText = this.textContent;
        this.textContent = 'Generating STL files...';
        this.disabled = true;
        
        try {
            // Determine server URL
            const serverUrl = window.location.hostname === 'localhost' 
                ? 'http://localhost:3001' 
                : ''; // Same origin in production
            
            // Call server API
            const response = await fetch(`${serverUrl}/api/generate-stl`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ names })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.details || error.error || 'Server error');
            }
            
            // Download the ZIP file
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const downloadLink = document.createElement('a');
            downloadLink.href = url;
            downloadLink.download = 'wedding-name-tags-stl.zip';
            
            // Trigger the download
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            
            // Clean up
            URL.revokeObjectURL(url);
            
            // Show success
            this.textContent = 'STL Files Generated ✓';
            this.classList.add('validated');
            
            setTimeout(() => {
                this.textContent = originalText;
                this.disabled = false;
                this.classList.remove('validated');
            }, 3000);
            
        } catch (error) {
            console.error('Error generating STL files:', error);
            
            // Show error with helpful message
            let errorMessage = 'Error generating STL files';
            if (error.message.includes('OpenSCAD')) {
                errorMessage = 'Server error: OpenSCAD not installed';
            } else if (error.message.includes('Failed to fetch')) {
                errorMessage = 'Server not running. Start with: npm run server';
            }
            
            this.textContent = errorMessage;
            this.classList.add('error');
            
            setTimeout(() => {
                this.textContent = originalText;
                this.disabled = false;
                this.classList.remove('error');
            }, 5000);
        }
    });

});
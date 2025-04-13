document.addEventListener('DOMContentLoaded', function() {
    const nameForm = document.getElementById('nameForm');
    const nameList = document.getElementById('nameList');
    const generateBtn = document.getElementById('generateBtn');
    const validationFeedback = document.getElementById('validationFeedback');
    const charCount = document.getElementById('charCount');
    const validateBtn = document.getElementById('validateBtn');
    
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
        } else {
            charCount.style.color = '#666';
        }
    });
    
    // Validate names function
    function validateNames() {
        const names = nameList.value.trim().split('\n').filter(name => name.trim() !== '');
        
        if (names.length === 0) {
            showValidationError('Please enter at least one name');
            return false;
        }
        
        // Check each name
        const invalidNames = [];
        const tooLongNames = [];
        
        for (let i = 0; i < names.length; i++) {
            const name = names[i];
            
            // Check length
            if (name.length > MAX_CHARS) {
                tooLongNames.push(`Line ${i+1}: "${name}" (${name.length} characters)`);
            }
            
            // Check for invalid characters (only letters, numbers, spaces, and hyphens allowed)
            if (!/^[A-Z0-9 -]+$/.test(name)) {
                invalidNames.push(`Line ${i+1}: "${name}" (contains invalid characters)`);
            }
        }
        
        // Show validation errors if any
        if (tooLongNames.length > 0 || invalidNames.length > 0) {
            let errorMessage = '';
            
            if (tooLongNames.length > 0) {
                errorMessage += `<strong>Names exceeding ${MAX_CHARS} characters:</strong><br>`;
                errorMessage += tooLongNames.join('<br>') + '<br><br>';
            }
            
            if (invalidNames.length > 0) {
                errorMessage += '<strong>Names with invalid characters:</strong><br>';
                errorMessage += invalidNames.join('<br>') + '<br><br>';
                errorMessage += 'Only uppercase letters, numbers, spaces, and hyphens are allowed.';
            }
            
            showValidationError(errorMessage);
            return false;
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
    }
    
    function hideValidationError() {
        validationFeedback.style.display = 'none';
        isValid = true;
        generateBtn.disabled = false;
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
        
        // Generate package
        generatePackage(names)
            .then(() => {
                // Reset button
                generateBtn.textContent = 'Generate Name Tags';
                generateBtn.disabled = !isValid;
            })
            .catch(error => {
                console.error('Error:', error);
                alert('There was an error generating your name tags. Please try again.');
                
                // Reset button
                generateBtn.textContent = 'Generate Name Tags';
                generateBtn.disabled = !isValid;
            });
    });
    
    // Function to generate and download the package
    async function generatePackage(names) {
        try {
            // Create a new ZIP file using JSZip
            const JSZip = window.JSZip;
            const zip = new JSZip();
            
            // Add SCAD template
            zip.file('templatev2.scad', window.templates.scad);
            
            // Add SVG file
            zip.file('Clip1.svg', window.templates.svg);
            
            // Generate Python script with names
            const namesList = names.map(name => `    "${name}"`).join(',\n');
            const pyContent = window.templates.python.replace('{{NAMES_LIST}}', namesList);
            zip.file('generateNames.py', pyContent);
            
            // Add README with instructions
            const readmeContent = window.templates.readme.replace('{{NAMES_COUNT}}', names.length.toString());
            zip.file('README.md', readmeContent);
            
            // Generate the ZIP file
            const zipBlob = await zip.generateAsync({type: 'blob'});
            
            // Create a download link
            const downloadLink = document.createElement('a');
            downloadLink.href = URL.createObjectURL(zipBlob);
            downloadLink.download = 'wedding-name-tags.zip';
            
            // Trigger the download
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    }
});
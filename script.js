document.addEventListener('DOMContentLoaded', function() {
    const nameForm = document.getElementById('nameForm');
    const nameList = document.getElementById('nameList');
    const generateBtn = document.getElementById('generateBtn');

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
        
        // Enable form once templates are loaded
        generateBtn.disabled = false;
        generateBtn.textContent = 'Generate Name Tags';
    }).catch(error => {
        console.error('Error loading templates:', error);
        generateBtn.textContent = 'Error: Could not load templates';
    });

    nameForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get the names from the textarea
        const names = nameList.value.trim().split('\n').filter(name => name.trim() !== '');
        
        if (names.length === 0) {
            alert('Please enter at least one name');
            return;
        }
        
        // Show processing status
        generateBtn.textContent = 'Generating...';
        generateBtn.disabled = true;
        
        // Generate package
        generatePackage(names)
            .then(() => {
                // Reset button
                generateBtn.textContent = 'Generate Name Tags';
                generateBtn.disabled = false;
            })
            .catch(error => {
                console.error('Error:', error);
                alert('There was an error generating your name tags. Please try again.');
                
                // Reset button
                generateBtn.textContent = 'Generate Name Tags';
                generateBtn.disabled = false;
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
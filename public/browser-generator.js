// browser-generator.js - Main controller for the browser-based name tag generator

document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const nameList = document.getElementById('nameList');
    const charCount = document.getElementById('charCount');
    const validationFeedback = document.getElementById('validationFeedback');
    const validateBtn = document.getElementById('validateBtn');
    const generateBtn = document.getElementById('generateBtn');
    const previewBtn = document.getElementById('previewBtn');
    const previewCanvas = document.getElementById('previewCanvas');
    const previewPlaceholder = document.getElementById('previewPlaceholder');
    const rotateBtn = document.getElementById('rotateBtn');
    const resetViewBtn = document.getElementById('resetViewBtn');
    const processingStatus = document.getElementById('processingStatus');
    const statusText = document.getElementById('statusText');
    const progressBar = document.getElementById('progressBar');
    
    // State variables
    let isValid = false;
    let isAutoRotating = false;
    let renderer = null;
    let currentModel = null;
    const MAX_CHARS = 14;
    
    // Initialize once JSCAD libraries are loaded
    function initializeApp() {
        // Set up the renderer
        setupRenderer();
        
        // Enable buttons
        validateBtn.disabled = false;
        previewBtn.disabled = false;
    }
    
    // Character count and validation as user types
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
    
    // Validation button click handler
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
    
    // Preview button click handler
    previewBtn.addEventListener('click', function() {
        const names = nameList.value.trim().split('\n').filter(name => name.trim() !== '');
        
        if (names.length === 0) {
            showValidationError('Please enter at least one name');
            return;
        }
        
        // Use the first name for preview
        const nameToPreview = names[0];
        
        // Show loading state
        previewBtn.disabled = true;
        previewBtn.textContent = 'Generating Preview...';
        
        try {
            // Generate the preview model
            currentModel = getPreviewModel(nameToPreview);
            
            // Show the preview
            showPreview();
            
            // Update button state
            previewBtn.textContent = 'Update Preview';
            previewBtn.disabled = false;
        } catch (error) {
            console.error('Error generating preview:', error);
            previewBtn.textContent = 'Preview Failed';
            setTimeout(() => {
                previewBtn.textContent = 'Try Preview Again';
                previewBtn.disabled = false;
            }, 2000);
        }
    });
    
    // Generate button click handler
    generateBtn.addEventListener('click', function() {
        // Double-check validation before proceeding
        if (!isValid && !validateNames()) {
            return;
        }
        
        // Get the names
        const names = nameList.value.trim().split('\n').filter(name => name.trim() !== '');
        
        // Show processing status
        processingStatus.style.display = 'block';
        statusText.textContent = `Preparing to generate ${names.length} STL files...`;
        progressBar.style.width = '0%';
        
        // Disable buttons during processing
        validateBtn.disabled = true;
        generateBtn.disabled = true;
        previewBtn.disabled = true;
        
        // Start processing with a slight delay to allow UI to update
        setTimeout(() => {
            processNames(names, updateProgress)
                .then(result => {
                    // Show completion message
                    statusText.textContent = `Generated ${result.successful} of ${result.total} STL files.`;
                    
                    if (result.errors.length > 0) {
                        const errorList = result.errors.map(err => `${err.name}: ${err.error}`).join('<br>');
                        validationFeedback.innerHTML = `<strong>Errors during generation:</strong><br>${errorList}`;
                        validationFeedback.style.display = 'block';
                    }
                    
                    // Re-enable buttons
                    validateBtn.disabled = false;
                    generateBtn.disabled = !isValid;
                    previewBtn.disabled = false;
                    
                    // Hide processing status after a delay
                    setTimeout(() => {
                        processingStatus.style.display = 'none';
                    }, 5000);
                })
                .catch(error => {
                    console.error('Error processing names:', error);
                    statusText.textContent = 'An error occurred during processing.';
                    
                    // Re-enable buttons
                    validateBtn.disabled = false;
                    generateBtn.disabled = !isValid;
                    previewBtn.disabled = false;
                });
        }, 100);
    });
    
    // Update progress bar and status during processing
    function updateProgress(progress) {
        const percent = Math.round((progress.current / progress.total) * 100);
        progressBar.style.width = `${percent}%`;
        
        if (progress.status === 'processing') {
            statusText.textContent = `Generating ${progress.current} of ${progress.total}: ${progress.name}`;
        } else if (progress.status === 'error') {
            statusText.textContent = `Error with ${progress.name} (${progress.current} of ${progress.total})`;
        }
    }
    
    // Set up the 3D renderer
    function setupRenderer() {
        // Only proceed if JSCAD libraries are loaded
        if (!window.jscadModeling || !window.jscadReglRenderer) {
            console.error('JSCAD libraries not loaded');
            return;
        }
        
        // Get the necessary functions from the libraries
        const { prepareRender } = jscadReglRenderer;
        
        try {
            // Initialize the renderer
            renderer = prepareRender({
                glOptions: { canvas: previewCanvas }
            });
            
            console.log('Renderer initialized');
        } catch (error) {
            console.error('Error initializing renderer:', error);
        }
    }
    
    // Display the 3D preview
    function showPreview() {
        if (!renderer || !currentModel) {
            console.error('Renderer or model not ready');
            return;
        }
        
        // Hide placeholder and show canvas
        previewPlaceholder.style.display = 'none';
        previewCanvas.style.display = 'block';
        
        // Set up the render function
        const { camera, drawCommands, entitiesFromSolids } = jscadReglRenderer;
        
        // Create entities from the model
        const entities = entitiesFromSolids({}, [currentModel]);
        
        // Set up camera
        const cameraState = camera.create({
            position: [0, 0, 100],
            target: [0, 0, 0],
            perspective: {
                fov: Math.PI / 4
            }
        });
        
        // Function to render the scene
        function render() {
            if (!renderer) return;
            
            // Update camera if auto-rotating
            if (isAutoRotating) {
                const rotateY = Date.now() * 0.001;
                camera.rotate(cameraState, rotateY, 0);
            }
            
            // Perform the rendering
            renderer(drawCommands, {
                camera: cameraState,
                entities
            });
            
            // Request next frame
            requestAnimationFrame(render);
        }
        
        // Start the render loop
        render();
    }
    
    // Toggle auto-rotation
    rotateBtn.addEventListener('click', function() {
        isAutoRotating = !isAutoRotating;
        this.textContent = isAutoRotating ? 'Stop Rotation' : 'Rotate';
    });
    
    // Reset camera view
    resetViewBtn.addEventListener('click', function() {
        if (!renderer) return;
        
        const { camera } = jscadReglRenderer;
        
        // Reset camera to default position
        camera.update(cameraState, {
            position: [0, 0, 100],
            target: [0, 0, 0]
        });
    });
    
    // Check if JSCAD libraries are loaded
    function checkLibrariesLoaded() {
        if (window.jscadModeling && window.jscadReglRenderer && window.jscadIo) {
            initializeApp();
        } else {
            // Try again in 100ms
            setTimeout(checkLibrariesLoaded, 100);
        }
    }
    
    // Start checking for libraries
    checkLibrariesLoaded();
});
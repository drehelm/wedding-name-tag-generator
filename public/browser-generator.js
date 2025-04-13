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
    const libraryError = document.getElementById('libraryError');
    const renderMethodRadios = document.getElementsByName('renderMethod');
    
    // State variables
    let isValid = false;
    let isAutoRotating = false;
    let scene = null;
    let camera = null;
    let renderer = null;
    let controls = null;
    let animationFrameId = null;
    let openscadInitialized = false;
    const MAX_CHARS = 14;
    
    // Import constants
    const SVG_THICKNESS = 4; // Match with clip-model.js
    
    // Get the selected rendering method
    function getSelectedRenderMethod() {
        for (const radio of renderMethodRadios) {
            if (radio.checked) {
                return radio.value;
            }
        }
        return 'threejs'; // Default to THREE.js
    }
    
    // Set up event listeners for render method selection
    for (const radio of renderMethodRadios) {
        radio.addEventListener('change', function() {
            // If a name is already in the preview, update it with the new method
            if (nameList.value.trim()) {
                const names = nameList.value.trim().split('\n');
                if (names.length > 0) {
                    updatePreview(names[0]);
                }
            }
        });
    }
    
    // Check if THREE.js is available
    function checkThreeAvailability() {
        if (typeof THREE === 'undefined') {
            console.error('THREE.js not available');
            libraryError.style.display = 'block';
            validateBtn.disabled = true;
            previewBtn.disabled = true;
            generateBtn.disabled = true;
            return false;
        }
        console.log('THREE.js available:', THREE.REVISION);
        return true;
    }
    
    // Initialize the OpenSCAD-WASM library
    function initializeOpenSCAD() {
        if (typeof initOpenSCAD === 'undefined') {
            console.error('OpenSCAD-WASM library not found');
            return Promise.reject(new Error('OpenSCAD-WASM library not found'));
        }
        
        console.log('Initializing OpenSCAD-WASM');
        openscadInitialized = true;
        
        // Show loading message
        previewBtn.textContent = 'Loading OpenSCAD...';
        previewBtn.disabled = true;
        
        return initOpenSCAD()
            .then(openScadModule => {
                console.log('OpenSCAD-WASM initialized successfully');
                previewBtn.textContent = 'Preview First Name';
                previewBtn.disabled = false;
                return openScadModule;
            })
            .catch(error => {
                console.error('Failed to initialize OpenSCAD-WASM:', error);
                previewBtn.textContent = 'Preview First Name';
                previewBtn.disabled = false;
                // Auto-select THREE.js rendering method
                for (const radio of renderMethodRadios) {
                    if (radio.value === 'threejs') {
                        radio.checked = true;
                    } else {
                        radio.disabled = true;
                    }
                }
                throw error;
            });
    }
    
    // Initialize once libraries are loaded
    function initializeApp() {
        if (!checkThreeAvailability()) {
            return;
        }
        
        // Set up the THREE.js environment
        setupThreeJS();
        
        // Enable buttons
        validateBtn.disabled = false;
        previewBtn.disabled = false;

        // Add a test scene to verify rendering is working
        createTestScene();
        
        // Try to initialize OpenSCAD-WASM in the background
        initializeOpenSCAD().catch(error => {
            console.warn('OpenSCAD-WASM initialization failed, using THREE.js fallback:', error);
        });
    }

    // Create a simple test scene to verify three.js is working
    function createTestScene() {
        if (!scene) {
            console.error('No scene available for test cube');
            return;
        }

        // Clear the scene
        resetScene();

        // Add a simple cube
        const geometry = new THREE.BoxGeometry(20, 20, 20);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0xff0000,
            metalness: 0.3,
            roughness: 0.7
        });
        const cube = new THREE.Mesh(geometry, material);
        
        // Add cube to scene
        scene.add(cube);
        console.log('Test cube added to scene');
        
        // Add axes helper
        const axesHelper = new THREE.AxesHelper(30);
        scene.add(axesHelper);
        
        // Add grid helper
        const gridHelper = new THREE.GridHelper(100, 10);
        scene.add(gridHelper);
        
        // Hide placeholder and show canvas
        previewPlaceholder.style.display = 'none';
        previewCanvas.style.display = 'block';
        
        // Start animation
        startAnimation();
        
        console.log('Test scene created');
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
    
    // Update the preview with the current name
    async function updatePreview(name) {
        // Reset the scene
        resetScene();
        
        try {
            // Check which rendering method to use
            const renderMethod = getSelectedRenderMethod();
            
            if (renderMethod === 'openscad' && isOpenSCADAvailable()) {
                // Create OpenSCAD preview
                const previewScene = await createOpenSCADPreviewScene(name);
                
                // Import objects from the preview scene to our main scene
                if (previewScene && previewScene.children) {
                    previewScene.children.forEach(child => {
                        scene.add(child.clone());
                    });
                }
            } else {
                // Create THREE.js preview (fallback)
                const previewScene = await createPreviewScene(name);
                
                // Import objects from the preview scene to our main scene
                if (previewScene && previewScene.children) {
                    previewScene.children.forEach(child => {
                        scene.add(child.clone());
                    });
                }
            }
            
            // Hide placeholder and show canvas
            previewPlaceholder.style.display = 'none';
            previewCanvas.style.display = 'block';
            
            // Update camera position for better viewing
            camera.position.set(0, -50, 80);
            camera.lookAt(0, 0, 0);
            
            // Start animation
            startAnimation();
            
            console.log('Preview created and rendered');
            return true;
        } catch (error) {
            console.error('Error generating preview:', error);
            return false;
        }
    }
    
    // Preview button click handler
    previewBtn.addEventListener('click', async function() {
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
            console.log('Creating preview for name:', nameToPreview);
            
            // Update the preview
            const success = await updatePreview(nameToPreview);
            
            // Update button state
            if (success) {
                previewBtn.textContent = 'Update Preview';
            } else {
                previewBtn.textContent = 'Preview Failed';
                setTimeout(() => {
                    previewBtn.textContent = 'Try Preview Again';
                }, 2000);
            }
        } catch (error) {
            console.error('Error generating preview:', error);
            previewBtn.textContent = 'Preview Failed';
            
            // Show error details
            showValidationError(`Preview Error: ${error.message || 'Unknown error'}`);
            
            setTimeout(() => {
                previewBtn.textContent = 'Try Preview Again';
            }, 2000);
        } finally {
            previewBtn.disabled = false;
        }
    });
    
    // Generate STL files - choose the appropriate method based on the selected render method
    async function generateSTLFiles(names) {
        const renderMethod = getSelectedRenderMethod();
        
        if (renderMethod === 'openscad' && isOpenSCADAvailable()) {
            // Use OpenSCAD-WASM for generation
            return generateSTLFilesWithOpenSCAD(names);
        } else {
            // Use THREE.js for generation
            return processNames(names, updateProgress);
        }
    }
    
    // Generate STL files using OpenSCAD-WASM
    async function generateSTLFilesWithOpenSCAD(names) {
        console.log("Generating STL files with OpenSCAD-WASM for", names.length, "names");
        
        // Array to collect any errors
        const errors = [];
        
        // Process each name sequentially
        for (let i = 0; i < names.length; i++) {
            const name = names[i];
            
            try {
                // Update progress
                updateProgress({
                    current: i + 1,
                    total: names.length,
                    name: name,
                    status: 'processing'
                });
                
                console.log(`Processing name ${i+1}/${names.length}: ${name}`);
                
                // Load the OpenSCAD template
                const templateUrl = 'templates/templatev2.scad';
                const template = await loadFileFromURL(templateUrl);
                
                // Set parameters for the name tag
                const params = {
                    name: name
                };
                
                // Generate STL from OpenSCAD
                const stlData = await generateFromOpenSCAD(template, params);
                
                // Create a Blob from the STL data
                const blob = new Blob([stlData], { type: 'application/octet-stream' });
                
                // Create a download URL for the blob
                const url = URL.createObjectURL(blob);
                
                // Create a temporary download link
                const downloadLink = document.createElement('a');
                downloadLink.href = url;
                downloadLink.download = `${name}.stl`;
                
                // Append the link to the document, click it, and remove it
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);
                
                // Clean up the URL object
                setTimeout(() => {
                    URL.revokeObjectURL(url);
                }, 100);
                
                // Short delay to prevent overwhelming the browser
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (error) {
                console.error(`Error processing name "${name}":`, error);
                errors.push({ name, error: error.message || 'Unknown error' });
                
                // Update progress with error
                updateProgress({
                    current: i + 1,
                    total: names.length,
                    name: name,
                    status: 'error',
                    error: error.message || 'Unknown error'
                });
            }
        }
        
        // Return summary of processing
        console.log("Names processing complete. Successful:", names.length - errors.length, "Errors:", errors.length);
        return {
            total: names.length,
            successful: names.length - errors.length,
            errors: errors
        };
    }
    
    // Generate button click handler
    generateBtn.addEventListener('click', async function() {
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
        setTimeout(async () => {
            try {
                console.log('Starting STL generation for', names.length, 'names');
                
                // Generate STL files with the appropriate method
                const result = await generateSTLFiles(names);
                
                // Show completion message
                statusText.textContent = `Generated ${result.successful} of ${result.total} STL files.`;
                
                if (result.errors.length > 0) {
                    const errorList = result.errors.map(err => `${err.name}: ${err.error}`).join('<br>');
                    validationFeedback.innerHTML = `<strong>Errors during generation:</strong><br>${errorList}`;
                    validationFeedback.style.display = 'block';
                }
            } catch (error) {
                console.error('Error processing names:', error);
                statusText.textContent = 'An error occurred during processing.';
                showValidationError(`Generation Error: ${error.message || 'Unknown error'}`);
            } finally {
                // Re-enable buttons
                validateBtn.disabled = false;
                generateBtn.disabled = !isValid;
                previewBtn.disabled = false;
                
                // Hide processing status after a delay
                setTimeout(() => {
                    processingStatus.style.display = 'none';
                }, 5000);
            }
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
    
    // Set up THREE.js renderer, scene and camera
    function setupThreeJS() {
        try {
            console.log('Setting up THREE.js environment');
            
            // Create scene
            scene = new THREE.Scene();
            scene.background = new THREE.Color(0xf0f0f0);
            
            // Create camera
            camera = new THREE.PerspectiveCamera(45, previewCanvas.clientWidth / previewCanvas.clientHeight, 1, 1000);
            camera.position.set(0, -50, 80);
            
            // Create renderer
            renderer = new THREE.WebGLRenderer({ 
                canvas: previewCanvas, 
                antialias: true,
                alpha: true
            });
            renderer.setSize(previewCanvas.clientWidth, previewCanvas.clientHeight);
            renderer.setClearColor(0xf0f0f0, 1);
            
            // Create controls using our embedded OrbitControls
            controls = new OrbitControls(camera, renderer.domElement);
            controls.enablePan = true;
            controls.minDistance = 50;
            controls.maxDistance = 200;
            
            // Add ambient lighting
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
            scene.add(ambientLight);
            
            // Add directional lighting for better 3D appearance
            const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
            directionalLight.position.set(50, 50, 50);
            scene.add(directionalLight);
            
            // Add additional light from another angle
            const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
            directionalLight2.position.set(-50, -50, 50);
            scene.add(directionalLight2);
            
            console.log('THREE.js initialized successfully');
            
            // Test render
            renderer.render(scene, camera);
        } catch (error) {
            console.error('Error initializing THREE.js:', error);
            libraryError.style.display = 'block';
        }
    }
    
    // Clear the current scene
    function resetScene() {
        if (!scene) {
            console.error('No scene to reset');
            return;
        }
        
        console.log('Resetting scene');
        
        // Remove all objects from the scene
        while(scene.children.length > 0) { 
            scene.remove(scene.children[0]); 
        }
        
        // Re-add ambient lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        scene.add(ambientLight);
        
        // Re-add directional lighting
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
        directionalLight.position.set(50, 50, 50);
        scene.add(directionalLight);
        
        // Add additional light from another angle
        const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight2.position.set(-50, -50, 50);
        scene.add(directionalLight2);
    }
    
    // Animation loop
    function startAnimation() {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        
        console.log('Starting animation loop');
        
        function animate() {
            animationFrameId = requestAnimationFrame(animate);
            
            if (isAutoRotating && scene) {
                scene.rotation.y += 0.01;
            }
            
            if (controls) {
                controls.update();
            }
            
            if (renderer && scene && camera) {
                renderer.render(scene, camera);
            }
        }
        
        animate();
    }
    
    // Handle window resize
    window.addEventListener('resize', function() {
        if (camera && renderer) {
            camera.aspect = previewCanvas.clientWidth / previewCanvas.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(previewCanvas.clientWidth, previewCanvas.clientHeight);
        }
    });
    
    // Toggle auto-rotation
    rotateBtn.addEventListener('click', function() {
        isAutoRotating = !isAutoRotating;
        this.textContent = isAutoRotating ? 'Stop Rotation' : 'Rotate';
    });
    
    // Reset camera view
    resetViewBtn.addEventListener('click', function() {
        if (camera) {
            camera.position.set(0, -50, 80);
            camera.lookAt(0, 0, 0);
        }
        
        if (controls) {
            controls.reset();
        }
        
        if (scene) {
            scene.rotation.set(0, 0, 0);
        }
    });
    
    // Initialize the app
    initializeApp();
});
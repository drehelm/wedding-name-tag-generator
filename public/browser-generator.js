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
    
    // State variables
    let isValid = false;
    let isAutoRotating = false;
    let scene = null;
    let camera = null;
    let renderer = null;
    let controls = null;
    let animationFrameId = null;
    const MAX_CHARS = 14;
    
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

        // Add a simple test cube to make sure rendering works
        addTestCube();
    }

    // Add a simple test cube to verify rendering
    function addTestCube() {
        if (!scene) {
            console.error('No scene available for test cube');
            return;
        }

        const geometry = new THREE.BoxGeometry(20, 20, 20);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0xff0000,
            metalness: 0.3,
            roughness: 0.7
        });
        const cube = new THREE.Mesh(geometry, material);
        cube.position.set(0, 0, 0);
        
        scene.add(cube);
        console.log('Test cube added to scene');
        
        // Start animation to render the cube
        startAnimation();
        
        // Hide placeholder and show canvas
        previewPlaceholder.style.display = 'none';
        previewCanvas.style.display = 'block';
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
            console.log('Starting preview for name:', nameToPreview);
            
            // Create a new preview scene
            resetScene();
            createSimplePreview(nameToPreview);
            
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
                const result = await processNames(names, updateProgress);
                
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
            camera.position.set(0, 0, 100);
            
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
            controls.enablePan = false;
            controls.minDistance = 50;
            controls.maxDistance = 200;
            
            // Add lighting
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
            scene.add(ambientLight);
            
            const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
            directionalLight.position.set(50, 50, 50);
            scene.add(directionalLight);
            
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
        
        // Re-add lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
        directionalLight.position.set(50, 50, 50);
        scene.add(directionalLight);
    }
    
    // Create a simple preview for debugging
    function createSimplePreview(name) {
        if (!scene || !camera || !renderer) {
            console.error('THREE.js not properly initialized');
            return;
        }
        
        console.log('Creating simple preview for name:', name);
        
        try {
            // Create a simple clip representation
            const clipGeometry = new THREE.BoxGeometry(60, 20, 5);
            const clipMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x3498db,
                metalness: 0.2,
                roughness: 0.5
            });
            const clipMesh = new THREE.Mesh(clipGeometry, clipMaterial);
            scene.add(clipMesh);
            
            // Create a simple text representation
            const textWidth = name.length * 5;
            const textGeometry = new THREE.BoxGeometry(textWidth, 10, 2);
            const textMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x2c3e50,
                metalness: 0.1,
                roughness: 0.8
            });
            const textMesh = new THREE.Mesh(textGeometry, textMaterial);
            textMesh.position.set(0, 0, 5);
            scene.add(textMesh);
            
            // Create a simple underline
            const underlineGeometry = new THREE.BoxGeometry(textWidth + 10, 2, 2);
            const underlineMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x2c3e50,
                metalness: 0.1,
                roughness: 0.8
            });
            const underlineMesh = new THREE.Mesh(underlineGeometry, underlineMaterial);
            underlineMesh.position.set(0, -8, 5);
            scene.add(underlineMesh);
            
            console.log('Simple preview created with', scene.children.length, 'objects');
            
            // Hide placeholder and show canvas
            previewPlaceholder.style.display = 'none';
            previewCanvas.style.display = 'block';
            
            // Reset camera position
            camera.position.set(0, 0, 100);
            camera.lookAt(0, 0, 0);
            
            // Apply a small rotation for better viewing angle
            scene.rotation.x = 0.2;
            
            // Start animation
            startAnimation();
            
            // Force a render
            renderer.render(scene, camera);
            
            console.log('Preview rendering complete');
        } catch (error) {
            console.error('Error creating preview:', error);
            throw error;
        }
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
            camera.position.set(0, 0, 100);
            camera.lookAt(0, 0, 0);
        }
        
        if (controls) {
            controls.reset();
        }
        
        if (scene) {
            scene.rotation.set(0.2, 0, 0); // Keep slight x rotation for better view
        }
    });
    
    // Initialize the app
    initializeApp();
});
// text-generator.js - Creates 3D text for name tags using THREE.js

// Constants for text dimensions (from OpenSCAD file)
const TEXT_THICKNESS = 4;
const FONT_SIZE = 8;
const UNDERLINE_THICKNESS = 1.5;
const UNDERLINE_WIDTH_FACTOR = 1.2; // Make underline a bit wider than text
const TEXT_X_OFFSET = 5;  // Adjusted position for better placement
const TEXT_Y_OFFSET = 2;

// Create text using proper 3D text geometry with font loading
function createTextMesh(text) {
    return new Promise((resolve) => {
        // Create a group to hold all text elements
        const textGroup = new THREE.Group();
        
        // Create a font loader
        const fontLoader = new THREE.FontLoader();
        
        // Load a font
        fontLoader.load('helvetiker_bold', function(font) {
            // Create text geometry
            const textGeometry = new THREE.TextGeometry(text, {
                font: font,
                size: FONT_SIZE,
                height: TEXT_THICKNESS,
                curveSegments: 4,
                bevelEnabled: false
            });
            
            // Center the text geometry
            textGeometry.computeBoundingBox();
            const textWidth = textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x;
            const textHeight = textGeometry.boundingBox.max.y - textGeometry.boundingBox.min.y;
            
            // Create text material
            const textMaterial = new THREE.MeshStandardMaterial({
                color: 0x333333,
                metalness: 0.1,
                roughness: 0.8
            });
            
            // Create text mesh
            const textMesh = new THREE.Mesh(textGeometry, textMaterial);
            
            // Position text to be centered
            textMesh.position.set(-textWidth / 2, -textHeight / 2, 0);
            textGroup.add(textMesh);
            
            // Create underline
            const underlineWidth = textWidth * UNDERLINE_WIDTH_FACTOR;
            const underlineGeometry = new THREE.BoxGeometry(
                underlineWidth, 
                UNDERLINE_THICKNESS, 
                TEXT_THICKNESS
            );
            
            const underlineMaterial = new THREE.MeshStandardMaterial({
                color: 0x333333,
                metalness: 0.1,
                roughness: 0.8
            });
            
            const underlineMesh = new THREE.Mesh(underlineGeometry, underlineMaterial);
            
            // Position underline below text
            underlineMesh.position.set(
                0,                      // Centered horizontally
                -textHeight - 3,        // Below the text with a small gap
                0                       // Same Z position as text
            );
            
            textGroup.add(underlineMesh);
            
            // Resolve the promise with the text group
            resolve(textGroup);
        });
    });
}

// Estimate text width (used for preview before actual text is rendered)
function estimateTextWidth(text) {
    // This is a rough estimate since we can't know exact dimensions until font is loaded
    return text.length * FONT_SIZE * 0.6;
}

// Create a placeholder text group for immediate display
function createPlaceholderTextGroup(text) {
    const textGroup = new THREE.Group();
    
    // Estimate text width
    const textWidth = estimateTextWidth(text);
    
    // Create a placeholder box for text
    const textGeometry = new THREE.BoxGeometry(textWidth, FONT_SIZE, TEXT_THICKNESS);
    const textMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        metalness: 0.1,
        roughness: 0.8
    });
    
    const textMesh = new THREE.Mesh(textGeometry, textMaterial);
    textMesh.position.set(0, 0, 0);
    textGroup.add(textMesh);
    
    // Create underline
    const underlineWidth = textWidth * UNDERLINE_WIDTH_FACTOR;
    const underlineGeometry = new THREE.BoxGeometry(
        underlineWidth, 
        UNDERLINE_THICKNESS, 
        TEXT_THICKNESS
    );
    
    const underlineMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        metalness: 0.1,
        roughness: 0.8
    });
    
    const underlineMesh = new THREE.Mesh(underlineGeometry, underlineMaterial);
    
    // Position underline below text
    underlineMesh.position.set(
        0,                      // Centered horizontally
        -FONT_SIZE - 3,         // Below the text with a small gap
        0                       // Same Z position as text
    );
    
    textGroup.add(underlineMesh);
    
    return textGroup;
}

// Function to get text and underline group for a name
function getTextGroup(name) {
    // Create a placeholder first for immediate display
    const placeholderGroup = createPlaceholderTextGroup(name);
    
    // Position the placeholder at the right offset
    placeholderGroup.position.set(TEXT_X_OFFSET, TEXT_Y_OFFSET, 0);
    
    // Start loading the real text
    createTextMesh(name).then((realTextGroup) => {
        // Position real text at the right offset
        realTextGroup.position.set(TEXT_X_OFFSET, TEXT_Y_OFFSET, 0);
        
        // Replace placeholder with real text once it's loaded
        if (placeholderGroup.parent) {
            placeholderGroup.parent.add(realTextGroup);
            placeholderGroup.parent.remove(placeholderGroup);
        }
    });
    
    // Return placeholder for now
    return placeholderGroup;
}

// Add text for a name to a scene
function addTextToScene(scene, name) {
    const textGroup = getTextGroup(name);
    scene.add(textGroup);
    return textGroup;
}
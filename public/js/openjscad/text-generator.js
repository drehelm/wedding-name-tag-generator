// text-generator.js - Creates 3D text for name tags using THREE.js

// Constants for text dimensions (from OpenSCAD file)
const TEXT_THICKNESS = 4;
const FONT_SIZE = 8;
const UNDERLINE_THICKNESS = 1.5;
const UNDERLINE_WIDTH_FACTOR = 1.2; // Make underline a bit wider than text
const TEXT_X_OFFSET = 5;  // Adjusted position for better placement
const TEXT_Y_OFFSET = 5;

// Load the font
let fontPromise = null;
function loadFont() {
    console.log("Loading font...");
    
    // Only create the promise once
    if (!fontPromise) {
        fontPromise = new Promise((resolve, reject) => {
            const loader = new THREE.FontLoader();
            
            // Try to load the default helvetica font from three.js repo
            loader.load('https://threejs.org/examples/fonts/helvetiker_bold.typeface.json', function(font) {
                console.log("Font loaded successfully");
                resolve(font);
            }, undefined, function(error) {
                console.error("Font failed to load:", error);
                
                // If loading fails, use a fallback approach with a simple font
                console.log("Using fallback font");
                createFallbackFont().then(resolve).catch(reject);
            });
        });
    }
    
    return fontPromise;
}

// Create a fallback font if loading fails
function createFallbackFont() {
    return new Promise((resolve) => {
        // Create a simple font data structure
        const fontData = {
            glyphs: {},
            resolution: 100
        };
        
        // For each letter, create a simple glyph
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 -".split("");
        
        for (const char of chars) {
            fontData.glyphs[char] = {
                ha: getCharWidth(char) * 10, // horizontal advance
                o: [] // outline
            };
        }
        
        console.log("Fallback font created");
        resolve(fontData);
    });
}

// Create actual text geometry using TextGeometry
async function createTextGeometry(text, size, thickness) {
    console.log("Creating text geometry for:", text);
    
    try {
        // Load the font first
        const font = await loadFont();
        
        // Create text geometry with TextGeometry
        const textGeo = new THREE.TextGeometry(text, {
            font: font,
            size: size,
            height: thickness,
            curveSegments: 4,
            bevelEnabled: false
        });
        
        // Center the text
        textGeo.computeBoundingBox();
        const textWidth = textGeo.boundingBox.max.x - textGeo.boundingBox.min.x;
        const centerOffset = -textWidth / 2;
        
        textGeo.translate(centerOffset, 0, 0);
        
        console.log("Text geometry created successfully");
        return textGeo;
    } catch (error) {
        console.error("Error creating text geometry:", error);
        return createFallbackTextGeometry(text, size, thickness);
    }
}

// Fallback to create simple text if TextGeometry fails
function createFallbackTextGeometry(text, size, thickness) {
    console.log("Creating fallback text geometry");
    
    // Create a group to hold all letter geometries
    const textWidth = estimateTextWidth(text);
    const letterHeight = size;
    
    // Create a single box for the entire text
    const geometry = new THREE.BoxGeometry(textWidth, letterHeight, thickness);
    
    console.log("Fallback text geometry created");
    return geometry;
}

// Function to estimate text width based on the OpenSCAD template logic
function estimateTextWidth(text) {
    console.log("Estimating text width for:", text);
    let totalWidth = 0;
    
    // This mirrors the character width estimation from the OpenSCAD template
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        totalWidth += getCharWidth(char);
    }
    
    // Scale the width to match the font size
    const scaledWidth = totalWidth * (FONT_SIZE / 5);
    
    console.log("Estimated width:", scaledWidth);
    return scaledWidth;
}

// Function to get character width (matches OpenSCAD logic)
function getCharWidth(char) {
    // Narrow characters
    if ("IilJ1".indexOf(char) >= 0) {
        return 2.5;
    } 
    // Wide characters
    else if ("WMHKOD".indexOf(char) >= 0) {
        return 5;
    } 
    // Regular characters
    else {
        return 3.5;
    }
}

// Create underline geometry
function createUnderlineGeometry(textWidth, thickness, textThickness) {
    console.log("Creating underline with width:", textWidth);
    
    const underlineWidth = textWidth * UNDERLINE_WIDTH_FACTOR;
    const geometry = new THREE.BoxGeometry(
        underlineWidth, 
        thickness, 
        textThickness
    );
    
    // Center the underline horizontally
    geometry.translate(0, -FONT_SIZE - 2, 0);
    
    console.log("Underline geometry created successfully");
    return geometry;
}

// Create a text group with both text and underline
async function createTextGroup(text) {
    console.log("Creating text group for:", text);
    
    // Create a group to hold text and underline
    const group = new THREE.Group();
    
    try {
        // Create text geometry
        const textGeometry = await createTextGeometry(text, FONT_SIZE, TEXT_THICKNESS);
        const textMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            metalness: 0.2,
            roughness: 0.7
        });
        const textMesh = new THREE.Mesh(textGeometry, textMaterial);
        group.add(textMesh);
        
        // Estimate text width for underline
        const textWidth = estimateTextWidth(text);
        
        // Create underline geometry
        const underlineGeometry = createUnderlineGeometry(textWidth, UNDERLINE_THICKNESS, TEXT_THICKNESS);
        const underlineMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            metalness: 0.2,
            roughness: 0.7
        });
        const underlineMesh = new THREE.Mesh(underlineGeometry, underlineMaterial);
        group.add(underlineMesh);
        
        console.log("Text group created successfully");
    } catch (error) {
        console.error("Error in createTextGroup:", error);
        // Create fallback text representation
        createFallbackTextGroup(text, group);
    }
    
    return group;
}

// Create fallback text group if the main method fails
function createFallbackTextGroup(text, group) {
    console.log("Creating fallback text group");
    
    // Create a simple representation for text
    const textWidth = estimateTextWidth(text);
    const textHeight = FONT_SIZE;
    
    // Create a single box for text
    const textGeometry = new THREE.BoxGeometry(textWidth, textHeight, TEXT_THICKNESS);
    const textMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        metalness: 0.2,
        roughness: 0.7
    });
    const textMesh = new THREE.Mesh(textGeometry, textMaterial);
    group.add(textMesh);
    
    // Create underline
    const underlineWidth = textWidth * UNDERLINE_WIDTH_FACTOR;
    const underlineGeometry = new THREE.BoxGeometry(underlineWidth, UNDERLINE_THICKNESS, TEXT_THICKNESS);
    const underlineMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        metalness: 0.2,
        roughness: 0.7
    });
    const underlineMesh = new THREE.Mesh(underlineGeometry, underlineMaterial);
    underlineMesh.position.y = -textHeight - 2;
    group.add(underlineMesh);
    
    console.log("Fallback text group created");
}

// Add text for a name to a scene
async function addTextToScene(scene, name) {
    console.log("Adding text to scene for name:", name);
    
    try {
        // Create the text group asynchronously
        const textGroup = await createTextGroup(name);
        
        // Position the text on the clip
        textGroup.position.set(TEXT_X_OFFSET, TEXT_Y_OFFSET, SVG_THICKNESS + 0.1);
        
        scene.add(textGroup);
        console.log("Text added to scene successfully");
        return textGroup;
    } catch (error) {
        console.error("Error adding text to scene:", error);
        
        // Create a simple fallback if everything fails
        const fallbackGroup = new THREE.Group();
        createFallbackTextGroup(name, fallbackGroup);
        fallbackGroup.position.set(TEXT_X_OFFSET, TEXT_Y_OFFSET, SVG_THICKNESS + 0.1);
        scene.add(fallbackGroup);
        
        return fallbackGroup;
    }
}
// text-generator.js - Creates 3D text for name tags using THREE.js

// Constants for text dimensions (from OpenSCAD file)
const TEXT_THICKNESS = 4;
const FONT_SIZE = 8;
const UNDERLINE_THICKNESS = 1.5;
const UNDERLINE_WIDTH_FACTOR = 1.2; // Make underline a bit wider than text
const TEXT_X_OFFSET = 5;  // Adjusted position for better placement
const TEXT_Y_OFFSET = 5;

// Global font cache
let cachedFont = null;

// Create an array of possible font URLs to try in order
const FONT_URLS = [
    // Try using common fonts first
    'https://cdn.jsdelivr.net/npm/three/examples/fonts/droid/droid_sans_bold.typeface.json', // More web-safe common font
    'https://cdn.jsdelivr.net/npm/three/examples/fonts/gentilis_bold.typeface.json', // Clear letter shapes
    'https://cdn.jsdelivr.net/npm/three/examples/fonts/helvetiker_bold.typeface.json', // Fallback helvetiker font
    // Add threejs default font as final fallback
    'https://threejs.org/examples/fonts/helvetiker_bold.typeface.json'
];

// Load a font with multiple fallback options
function loadFont() {
    console.log("Loading font...");
    
    // If we already have the font cached, return it immediately
    if (cachedFont) {
        console.log("Using cached font");
        return Promise.resolve(cachedFont);
    }
    
    // Try loading fonts in sequence until one succeeds
    return tryLoadFontSequence(0);
}

// Recursive function to try loading fonts in sequence
function tryLoadFontSequence(index) {
    // If we've tried all fonts, create a manual fallback
    if (index >= FONT_URLS.length) {
        console.error("All font loading attempts failed");
        return Promise.resolve(createManualFallbackFont());
    }
    
    const fontUrl = FONT_URLS[index];
    console.log(`Attempting to load font from: ${fontUrl}`);
    
    return new Promise((resolve) => {
        // Create a loader
        const loader = new THREE.FontLoader();
        
        // Try to load this font
        loader.load(fontUrl, 
            // onLoad callback - success!
            function(font) {
                console.log(`Font loaded successfully from: ${fontUrl}`);
                cachedFont = font;
                resolve(font);
            },
            // onProgress callback
            undefined,
            // onError callback - try next font
            function(err) {
                console.warn(`Failed to load font from ${fontUrl}:`, err);
                // Try the next font in our array
                tryLoadFontSequence(index + 1).then(resolve);
            }
        );
    });
}

// Create a manual fallback font if all loading attempts fail
function createManualFallbackFont() {
    console.log("Creating manual fallback font");
    
    // This is a very simplified font data structure just to avoid errors
    const fontData = {
        glyphs: {},
        resolution: 100,
        boundingBox: {
            yMin: 0,
            yMax: 10
        }
    };
    
    // For each letter, define a simple glyph
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 -".split("");
    
    for (const char of chars) {
        fontData.glyphs[char] = {
            ha: getCharWidth(char) * 10,
            o: [] // outline
        };
    }
    
    return fontData;
}

// Create true text geometry using TextGeometry
async function createTextGeometry(text, size, thickness) {
    console.log("Creating text geometry for:", text);
    
    try {
        // Load font first
        const font = await loadFont();
        
        // Create text geometry
        const textGeometry = new THREE.TextGeometry(text, {
            font: font,
            size: size,
            height: thickness,
            curveSegments: 12,
            bevelEnabled: true,
            bevelThickness: 0.3,
            bevelSize: 0.2,
            bevelOffset: 0,
            bevelSegments: 5
        });
        
        // Center text
        textGeometry.computeBoundingBox();
        const centerOffset = -0.5 * (
            textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x
        );
        textGeometry.translate(centerOffset, 0, 0);
        
        console.log("Text geometry created successfully");
        return textGeometry;
        
    } catch(error) {
        console.error("Failed to create text geometry:", error);
        return createLetterGeometries(text, size, thickness);
    }
}

// Create detailed letter shapes for each character - more sophisticated fallback
function createLetterGeometries(text, size, thickness) {
    console.log("Creating detailed letter geometries for:", text);
    
    // Create geometries for each letter
    const letterGeometries = [];
    let xOffset = 0;
    const totalWidth = estimateTextWidth(text);
    
    // Start with negative offset to center the text
    xOffset = -totalWidth / 2;
    
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        
        // Size based on character width
        const width = getCharWidth(char) * (size / 5);
        const height = size;
        
        // Create a shape for this letter
        const letterShape = createLetterShape(char, width, height);
        
        // Extrude settings
        const extrudeSettings = {
            steps: 1,
            depth: thickness,
            bevelEnabled: true,
            bevelThickness: 0.2,
            bevelSize: 0.1,
            bevelOffset: 0,
            bevelSegments: 3
        };
        
        // Create extruded geometry
        const geometry = new THREE.ExtrudeGeometry(letterShape, extrudeSettings);
        geometry.translate(xOffset, 0, 0);
        letterGeometries.push(geometry);
        
        // Update x offset for next letter (with spacing)
        xOffset += width * 1.2;
    }
    
    // Merge geometries if possible
    if (typeof BufferGeometryUtils !== 'undefined' && 
        BufferGeometryUtils.mergeBufferGeometries) {
        return BufferGeometryUtils.mergeBufferGeometries(letterGeometries);
    } else {
        // Return a group of letter meshes
        const letterGroup = new THREE.Group();
        
        // Material for all letters
        const material = new THREE.MeshStandardMaterial({
            color: 0x333333,
            metalness: 0.2,
            roughness: 0.7
        });
        
        // Add each letter as a separate mesh
        letterGeometries.forEach(geo => {
            const mesh = new THREE.Mesh(geo, material);
            letterGroup.add(mesh);
        });
        
        return letterGroup;
    }
}

// Create a shape for a specific letter
function createLetterShape(char, width, height) {
    const shape = new THREE.Shape();
    
    // Different letter shapes based on the character
    switch (char) {
        case 'A':
            // Triangle with crossbar
            shape.moveTo(0, 0);
            shape.lineTo(width/2, height);
            shape.lineTo(width, 0);
            shape.lineTo(0.8*width, 0);
            shape.lineTo(0.5*width, 0.7*height);
            shape.lineTo(0.2*width, 0);
            shape.lineTo(0, 0);
            // Add crossbar (as a separate shape)
            const crossbar = new THREE.Path();
            crossbar.moveTo(0.2*width, 0.4*height);
            crossbar.lineTo(0.8*width, 0.4*height);
            crossbar.lineTo(0.8*width, 0.5*height);
            crossbar.lineTo(0.2*width, 0.5*height);
            crossbar.lineTo(0.2*width, 0.4*height);
            shape.holes.push(crossbar);
            break;
            
        case 'B':
            // B shape with two rounded sections
            shape.moveTo(0, 0);
            shape.lineTo(0, height);
            shape.lineTo(0.7*width, height);
            shape.bezierCurveTo(
                width, height,
                width, 0.6*height,
                0.7*width, 0.55*height
            );
            shape.bezierCurveTo(
                width, 0.5*height, 
                width, 0, 
                0.7*width, 0
            );
            shape.lineTo(0, 0);
            break;
            
        case 'C':
            // C shape
            shape.moveTo(width, 0.25*height);
            shape.bezierCurveTo(
                0.8*width, 0,
                0.2*width, 0,
                0, 0.25*height
            );
            shape.bezierCurveTo(
                -0.2*width, 0.5*height,
                -0.2*width, 0.5*height,
                0, 0.75*height
            );
            shape.bezierCurveTo(
                0.2*width, height,
                0.8*width, height,
                width, 0.75*height
            );
            break;
            
        case 'D':
            // D shape
            shape.moveTo(0, 0);
            shape.lineTo(0, height);
            shape.lineTo(0.6*width, height);
            shape.bezierCurveTo(
                width, height,
                width, 0.5*height,
                width, 0
            );
            shape.lineTo(0, 0);
            break;
            
        case 'E':
            // E shape
            shape.moveTo(width, 0);
            shape.lineTo(0, 0);
            shape.lineTo(0, height);
            shape.lineTo(width, height);
            shape.lineTo(width, 0.85*height);
            shape.lineTo(0.2*width, 0.85*height);
            shape.lineTo(0.2*width, 0.55*height);
            shape.lineTo(0.8*width, 0.55*height);
            shape.lineTo(0.8*width, 0.45*height);
            shape.lineTo(0.2*width, 0.45*height);
            shape.lineTo(0.2*width, 0.15*height);
            shape.lineTo(width, 0.15*height);
            shape.lineTo(width, 0);
            break;
            
        case 'F':
            // F shape
            shape.moveTo(0, 0);
            shape.lineTo(0, height);
            shape.lineTo(width, height);
            shape.lineTo(width, 0.85*height);
            shape.lineTo(0.2*width, 0.85*height);
            shape.lineTo(0.2*width, 0.55*height);
            shape.lineTo(0.8*width, 0.55*height);
            shape.lineTo(0.8*width, 0.45*height);
            shape.lineTo(0.2*width, 0.45*height);
            shape.lineTo(0.2*width, 0);
            shape.lineTo(0, 0);
            break;
            
        case 'G':
            // G shape
            shape.moveTo(width, 0.25*height);
            shape.bezierCurveTo(
                0.8*width, 0,
                0.2*width, 0,
                0, 0.25*height
            );
            shape.bezierCurveTo(
                -0.2*width, 0.5*height,
                -0.2*width, 0.5*height,
                0, 0.75*height
            );
            shape.bezierCurveTo(
                0.2*width, height,
                0.8*width, height,
                width, 0.75*height
            );
            shape.lineTo(width, 0.4*height);
            shape.lineTo(0.5*width, 0.4*height);
            shape.lineTo(0.5*width, 0.5*height);
            shape.lineTo(0.8*width, 0.5*height);
            shape.lineTo(0.8*width, 0.25*height);
            break;
            
        case 'H':
            // H shape
            shape.moveTo(0, 0);
            shape.lineTo(0, height);
            shape.lineTo(0.2*width, height);
            shape.lineTo(0.2*width, 0.55*height);
            shape.lineTo(0.8*width, 0.55*height);
            shape.lineTo(0.8*width, height);
            shape.lineTo(width, height);
            shape.lineTo(width, 0);
            shape.lineTo(0.8*width, 0);
            shape.lineTo(0.8*width, 0.45*height);
            shape.lineTo(0.2*width, 0.45*height);
            shape.lineTo(0.2*width, 0);
            shape.lineTo(0, 0);
            break;
            
        case 'I':
            // I shape
            shape.moveTo(0, 0);
            shape.lineTo(0, height);
            shape.lineTo(width, height);
            shape.lineTo(width, 0);
            shape.lineTo(0, 0);
            break;
            
        case 'J':
            // J shape
            shape.moveTo(0, 0.25*height);
            shape.bezierCurveTo(
                0.2*width, 0,
                0.8*width, 0,
                width, 0.25*height
            );
            shape.lineTo(width, height);
            shape.lineTo(0.8*width, height);
            shape.lineTo(0.8*width, 0.25*height);
            shape.bezierCurveTo(
                0.7*width, 0.15*height,
                0.3*width, 0.15*height,
                0.2*width, 0.25*height
            );
            shape.lineTo(0, 0.25*height);
            break;
            
        case 'K':
            // K shape
            shape.moveTo(0, 0);
            shape.lineTo(0, height);
            shape.lineTo(0.2*width, height);
            shape.lineTo(0.2*width, 0.6*height);
            shape.lineTo(0.7*width, height);
            shape.lineTo(width, height);
            shape.lineTo(0.4*width, 0.5*height);
            shape.lineTo(width, 0);
            shape.lineTo(0.7*width, 0);
            shape.lineTo(0.2*width, 0.4*height);
            shape.lineTo(0.2*width, 0);
            shape.lineTo(0, 0);
            break;
            
        case 'L':
            // L shape
            shape.moveTo(0, 0);
            shape.lineTo(0, height);
            shape.lineTo(0.2*width, height);
            shape.lineTo(0.2*width, 0.15*height);
            shape.lineTo(width, 0.15*height);
            shape.lineTo(width, 0);
            shape.lineTo(0, 0);
            break;
            
        case 'M':
            // M shape
            shape.moveTo(0, 0);
            shape.lineTo(0, height);
            shape.lineTo(0.2*width, height);
            shape.lineTo(0.5*width, 0.4*height);
            shape.lineTo(0.8*width, height);
            shape.lineTo(width, height);
            shape.lineTo(width, 0);
            shape.lineTo(0.8*width, 0);
            shape.lineTo(0.8*width, 0.8*height);
            shape.lineTo(0.5*width, 0.2*height);
            shape.lineTo(0.2*width, 0.8*height);
            shape.lineTo(0.2*width, 0);
            shape.lineTo(0, 0);
            break;
            
        case 'N':
            // N shape
            shape.moveTo(0, 0);
            shape.lineTo(0, height);
            shape.lineTo(0.2*width, height);
            shape.lineTo(0.8*width, 0.2*height);
            shape.lineTo(0.8*width, height);
            shape.lineTo(width, height);
            shape.lineTo(width, 0);
            shape.lineTo(0.8*width, 0);
            shape.lineTo(0.2*width, 0.8*height);
            shape.lineTo(0.2*width, 0);
            shape.lineTo(0, 0);
            break;
            
        case 'O':
            // O shape
            shape.moveTo(0, 0.25*height);
            shape.bezierCurveTo(
                0.2*width, 0,
                0.8*width, 0,
                width, 0.25*height
            );
            shape.bezierCurveTo(
                1.2*width, 0.5*height,
                1.2*width, 0.5*height,
                width, 0.75*height
            );
            shape.bezierCurveTo(
                0.8*width, height,
                0.2*width, height,
                0, 0.75*height
            );
            shape.bezierCurveTo(
                -0.2*width, 0.5*height,
                -0.2*width, 0.5*height,
                0, 0.25*height
            );
            break;
            
        // Add specific shapes for P, Q, R, S, T, U, V, W, X, Y, Z
        // For brevity, I'll just include a few more key letters people might use
        
        case 'P':
            // P shape
            shape.moveTo(0, 0);
            shape.lineTo(0, height);
            shape.lineTo(0.7*width, height);
            shape.bezierCurveTo(
                width, height,
                width, 0.7*height,
                0.7*width, 0.5*height
            );
            shape.lineTo(0.2*width, 0.5*height);
            shape.lineTo(0.2*width, 0);
            shape.lineTo(0, 0);
            break;
            
        case 'R':
            // R shape
            shape.moveTo(0, 0);
            shape.lineTo(0, height);
            shape.lineTo(0.7*width, height);
            shape.bezierCurveTo(
                width, height,
                width, 0.7*height,
                0.7*width, 0.5*height
            );
            shape.lineTo(width, 0);
            shape.lineTo(0.8*width, 0);
            shape.lineTo(0.5*width, 0.5*height);
            shape.lineTo(0.2*width, 0.5*height);
            shape.lineTo(0.2*width, 0);
            shape.lineTo(0, 0);
            break;
            
        case 'S':
            // S shape
            shape.moveTo(0, 0.25*height);
            shape.bezierCurveTo(
                0.2*width, 0,
                0.8*width, 0,
                width, 0.25*height
            );
            shape.bezierCurveTo(
                1.2*width, 0.4*height,
                0.8*width, 0.6*height,
                0.5*width, 0.5*height
            );
            shape.bezierCurveTo(
                0.2*width, 0.4*height,
                -0.2*width, 0.6*height,
                0, 0.75*height
            );
            shape.bezierCurveTo(
                0.2*width, height,
                0.8*width, height,
                width, 0.75*height
            );
            break;
            
        case 'T':
            // T shape
            shape.moveTo(0, height);
            shape.lineTo(width, height);
            shape.lineTo(width, 0.85*height);
            shape.lineTo(0.6*width, 0.85*height);
            shape.lineTo(0.6*width, 0);
            shape.lineTo(0.4*width, 0);
            shape.lineTo(0.4*width, 0.85*height);
            shape.lineTo(0, 0.85*height);
            shape.lineTo(0, height);
            break;
            
        case 'U':
            // U shape
            shape.moveTo(0, height);
            shape.lineTo(0.2*width, height);
            shape.lineTo(0.2*width, 0.25*height);
            shape.bezierCurveTo(
                0.2*width, 0.1*height,
                0.8*width, 0.1*height,
                0.8*width, 0.25*height
            );
            shape.lineTo(0.8*width, height);
            shape.lineTo(width, height);
            shape.lineTo(width, 0.25*height);
            shape.bezierCurveTo(
                width, 0,
                0, 0,
                0, 0.25*height
            );
            shape.lineTo(0, height);
            break;
            
        // For numerals and other characters, create simplified shapes
        // For example, for 0-9 we'll create shapes that resemble the numerals
            
        default:
            // Default letter shape (a rectangle with some details)
            shape.moveTo(0, 0);
            shape.lineTo(0, height);
            shape.lineTo(width, height);
            shape.lineTo(width, 0);
            shape.lineTo(0, 0);
            
            // Add some details inside to make it look like a character
            const hole = new THREE.Path();
            hole.moveTo(0.3*width, 0.3*height);
            hole.lineTo(0.7*width, 0.3*height);
            hole.lineTo(0.7*width, 0.7*height);
            hole.lineTo(0.3*width, 0.7*height);
            hole.lineTo(0.3*width, 0.3*height);
            shape.holes.push(hole);
            break;
    }
    
    return shape;
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
        // Get text geometry or group
        const textGeometryOrGroup = await createTextGeometry(text, FONT_SIZE, TEXT_THICKNESS);
        
        // If it's a group, add it directly
        if (textGeometryOrGroup instanceof THREE.Group) {
            group.add(textGeometryOrGroup);
        } else {
            // Otherwise create a mesh
            const textMaterial = new THREE.MeshStandardMaterial({
                color: 0x333333,
                metalness: 0.2,
                roughness: 0.7
            });
            const textMesh = new THREE.Mesh(textGeometryOrGroup, textMaterial);
            group.add(textMesh);
        }
        
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
        // Create a error indicator
        const errorBox = new THREE.BoxGeometry(30, 5, 2);
        const errorMaterial = new THREE.MeshStandardMaterial({
            color: 0xff0000, // Red for error
            metalness: 0.2,
            roughness: 0.7
        });
        const errorMesh = new THREE.Mesh(errorBox, errorMaterial);
        group.add(errorMesh);
    }
    
    return group;
}

// Add text for a name to a scene
async function addTextToScene(scene, name) {
    console.log("Adding text to scene for name:", name);
    
    try {
        // Create text group
        const textGroup = await createTextGroup(name);
        
        // Position text on the clip
        textGroup.position.set(TEXT_X_OFFSET, TEXT_Y_OFFSET, SVG_THICKNESS + 0.1);
        
        scene.add(textGroup);
        console.log("Text added to scene successfully");
        return textGroup;
    } catch (error) {
        console.error("Error adding text to scene:", error);
        
        // Add a error indicator
        const message = new THREE.Group();
        
        // Add a message box
        const messageGeometry = new THREE.BoxGeometry(30, 5, 2);
        const messageMaterial = new THREE.MeshStandardMaterial({
            color: 0xff0000, // Red for error
            metalness: 0.2,
            roughness: 0.7
        });
        const messageMesh = new THREE.Mesh(messageGeometry, messageMaterial);
        messageMesh.position.set(0, 0, 0);
        message.add(messageMesh);
        
        // Position message on clip
        message.position.set(TEXT_X_OFFSET, TEXT_Y_OFFSET, SVG_THICKNESS + 0.1);
        
        scene.add(message);
        return message;
    }
}
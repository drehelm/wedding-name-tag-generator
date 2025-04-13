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

// Load the default font - use a simpler approach with a single reliable font source
function loadFont() {
    console.log("Loading font...");
    
    // If we already have the font cached, return it immediately
    if (cachedFont) {
        console.log("Using cached font");
        return Promise.resolve(cachedFont);
    }
    
    return new Promise((resolve, reject) => {
        // Use the reliable helvetiker_bold font from three.js examples
        const fontUrl = 'https://threejs.org/examples/fonts/helvetiker_bold.typeface.json';
        
        // Create a loader
        const loader = new THREE.FontLoader();
        
        // Load the font
        loader.load(fontUrl, 
            // onLoad callback
            function(font) {
                console.log("Font loaded successfully");
                cachedFont = font;
                resolve(font);
            },
            // onProgress callback
            undefined,
            // onError callback
            function(err) {
                console.error("Font loading error:", err);
                // If loading fails, create individual letter meshes
                createIndividualLetterGeometry("FALLBACK").then(resolve).catch(reject);
            }
        );
    });
}

// Create text geometry using TextGeometry - simpler approach
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
        return createFallbackTextGeometry(text, size, thickness);
    }
}

// Create individual letter geometries as a last resort
function createIndividualLetterGeometry(text) {
    console.log("Creating individual letter geometries for:", text);
    
    // Create geometries for each letter
    const letterGeometries = [];
    let xOffset = 0;
    
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        
        // Size based on character width
        const width = getCharWidth(char);
        const height = FONT_SIZE;
        
        // Create individual letter
        const shape = new THREE.Shape();
        
        // Draw more letter-like shapes instead of just rectangles
        if ("AEFHIKLMNTVWXYZ".includes(char)) {
            // Letters with diagonal strokes
            shape.moveTo(0, 0);
            shape.lineTo(width/3, height);
            shape.lineTo(2*width/3, height);
            shape.lineTo(width, 0);
            shape.lineTo(3*width/4, 0);
            shape.lineTo(2*width/3, height/3);
            shape.lineTo(width/3, height/3);
            shape.lineTo(width/4, 0);
            shape.lineTo(0, 0);
        } 
        else if ("BDOPQRSU".includes(char)) {
            // Rounded letters
            shape.moveTo(0, 0);
            shape.lineTo(0, height);
            shape.lineTo(3*width/4, height);
            shape.bezierCurveTo(
                width, height,
                width, height/2,
                3*width/4, 0
            );
            shape.lineTo(0, 0);
        }
        else if ("CGJ".includes(char)) {
            // Letters with hooks
            shape.moveTo(width, height/4);
            shape.lineTo(3*width/4, 0);
            shape.lineTo(width/4, 0);
            shape.lineTo(0, height/4);
            shape.lineTo(0, 3*height/4);
            shape.lineTo(width/4, height);
            shape.lineTo(width, height);
            
        } 
        else {
            // Default letter shape (simple rectangle with some features)
            shape.moveTo(0, 0);
            shape.lineTo(0, height);
            shape.lineTo(width, height);
            shape.lineTo(width, 0);
            shape.lineTo(0, 0);
            
            // Add some details to make it look more like a letter
            shape.moveTo(width/4, height/4);
            shape.lineTo(3*width/4, height/4);
            shape.lineTo(3*width/4, 3*height/4);
            shape.lineTo(width/4, 3*height/4);
            shape.lineTo(width/4, height/4);
        }
        
        // Extrude settings
        const extrudeSettings = {
            steps: 1,
            depth: TEXT_THICKNESS,
            bevelEnabled: true,
            bevelThickness: 0.2,
            bevelSize: 0.1,
            bevelOffset: 0,
            bevelSegments: 3
        };
        
        // Create extruded geometry
        const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        geometry.translate(xOffset, 0, 0);
        letterGeometries.push(geometry);
        
        // Update x offset for next letter (with spacing)
        xOffset += width * 1.2;
    }
    
    // Merge geometries if we have BufferGeometryUtils
    if (BufferGeometryUtils && BufferGeometryUtils.mergeBufferGeometries) {
        return BufferGeometryUtils.mergeBufferGeometries(letterGeometries);
    } else {
        // Return the first geometry if we can't merge
        const group = new THREE.Group();
        letterGeometries.forEach(geo => {
            const mesh = new THREE.Mesh(
                geo, 
                new THREE.MeshStandardMaterial({
                    color: 0x333333,
                    metalness: 0.2,
                    roughness: 0.7
                })
            );
            group.add(mesh);
        });
        return group;
    }
}

// Create a fallback text geometry for when the font fails to load
function createFallbackTextGeometry(text, size, thickness) {
    console.log("Creating fallback text geometry for:", text);
    
    // A simpler approximation of letters - make it clear these are letters
    // by creating individual shapes for each letter
    
    // Calculate the total width
    let totalWidth = 0;
    for (let i = 0; i < text.length; i++) {
        totalWidth += getCharWidth(text[i]) * 1.2; // Add 20% spacing
    }
    totalWidth = totalWidth * size / 5; // Scale with font size
    
    // Create individual letter shapes
    const group = new THREE.Group();
    let xOffset = -totalWidth / 2; // Center the text
    
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const width = getCharWidth(char) * size / 5;
        const height = size;
        
        // For each letter, create a more distinctive shape
        const letterGeometry = new THREE.BoxGeometry(width * 0.8, height, thickness);
        const letterMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            metalness: 0.2,
            roughness: 0.7
        });
        
        const letterMesh = new THREE.Mesh(letterGeometry, letterMaterial);
        letterMesh.position.set(xOffset + width/2, 0, 0);
        
        // Add distinguishing feature to make it obvious these are letters
        if ("AEFHIKLMNTVWXYZ".includes(char)) {
            // Add a diagonal line for these letters
            const lineGeometry = new THREE.BoxGeometry(width * 0.8, thickness/2, thickness/2);
            const line = new THREE.Mesh(lineGeometry, letterMaterial);
            line.rotation.z = Math.PI / 4;
            line.position.set(0, 0, thickness/2);
            letterMesh.add(line);
        } 
        else if ("BDOPQRSU".includes(char)) {
            // Add a small box for these letters
            const boxGeometry = new THREE.BoxGeometry(width * 0.4, height * 0.4, thickness/2);
            const box = new THREE.Mesh(boxGeometry, letterMaterial);
            box.position.set(0, height * 0.2, thickness/2);
            letterMesh.add(box);
        }
        
        group.add(letterMesh);
        xOffset += width * 1.2; // Add some spacing between letters
    }
    
    return group;
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
        // Create actual text geometry - now with proper TextGeometry
        const textGeometry = await createTextGeometry(text, FONT_SIZE, TEXT_THICKNESS);
        
        // If textGeometry is a mesh or group, add it directly
        if (textGeometry instanceof THREE.Group) {
            group.add(textGeometry);
        } else {
            // Otherwise create a mesh with the geometry
            const textMaterial = new THREE.MeshStandardMaterial({
                color: 0x333333,
                metalness: 0.2,
                roughness: 0.7
            });
            const textMesh = new THREE.Mesh(textGeometry, textMaterial);
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
        // Create a fallback with individual letters
        const fallbackText = await createIndividualLetterGeometry(text);
        if (fallbackText instanceof THREE.Group) {
            group.add(fallbackText);
        } else {
            const material = new THREE.MeshStandardMaterial({
                color: 0x333333,
                metalness: 0.2,
                roughness: 0.7
            });
            const mesh = new THREE.Mesh(fallbackText, material);
            group.add(mesh);
        }
        
        // Still add an underline
        const textWidth = estimateTextWidth(text);
        const underlineGeometry = createUnderlineGeometry(textWidth, UNDERLINE_THICKNESS, TEXT_THICKNESS);
        const underlineMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            metalness: 0.2,
            roughness: 0.7
        });
        const underlineMesh = new THREE.Mesh(underlineGeometry, underlineMaterial);
        group.add(underlineMesh);
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
        
        // Add a text label to indicate something went wrong 
        // but still provide SOME visual feedback
        const message = new THREE.Group();
        
        // Add a message box
        const messageGeometry = new THREE.BoxGeometry(30, 5, 2);
        const messageMaterial = new THREE.MeshStandardMaterial({
            color: 0xff0000, // Red to indicate error
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
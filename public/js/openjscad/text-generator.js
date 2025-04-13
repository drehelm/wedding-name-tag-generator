// text-generator.js - Creates 3D text for name tags using THREE.js

// Constants for text dimensions (from OpenSCAD file)
const TEXT_THICKNESS = 4;
const FONT_SIZE = 8;
const UNDERLINE_THICKNESS = 1.5;
const UNDERLINE_WIDTH_FACTOR = 1.2; // Make underline a bit wider than text
const TEXT_X_OFFSET = 5;  // Adjusted position for better placement
const TEXT_Y_OFFSET = 5;

// Function to estimate text width based on the OpenSCAD template logic
function estimateTextWidth(text) {
    console.log("Estimating text width for:", text);
    let totalWidth = 0;
    
    // This mirrors the character width estimation from the OpenSCAD template
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        
        // Narrow characters
        if ("IilJ1".indexOf(char) >= 0) {
            totalWidth += 2.5;
        } 
        // Wide characters
        else if ("WMHKOD".indexOf(char) >= 0) {
            totalWidth += 5;
        } 
        // Regular characters
        else {
            totalWidth += 3.5;
        }
    }
    
    console.log("Estimated width:", totalWidth);
    return totalWidth;
}

// Create extruded 3D text that more closely matches OpenSCAD output
function createTextGeometry(text, size, thickness) {
    console.log("Creating text geometry for:", text);
    
    // We'll create individual letter shapes
    const letterShapes = [];
    let currentX = 0;
    
    // Create a shape for each letter
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const letterWidth = getCharWidth(char) * (size / 5); // Scale with font size
        
        // Create a shape for this letter (simplistic representation)
        const shape = new THREE.Shape();
        
        // For simplicity, let's make rectangular shapes with varying widths
        const letterHeight = size;
        shape.moveTo(currentX, 0);
        shape.lineTo(currentX + letterWidth, 0);
        shape.lineTo(currentX + letterWidth, letterHeight);
        shape.lineTo(currentX, letterHeight);
        shape.lineTo(currentX, 0);
        
        letterShapes.push(shape);
        currentX += letterWidth * 1.2; // Add spacing between letters
    }
    
    // Convert shapes to geometries and merge them
    const geometries = [];
    
    // Extrude settings
    const extrudeSettings = {
        steps: 1,
        depth: thickness,
        bevelEnabled: false
    };
    
    // Create and position each letter
    for (const shape of letterShapes) {
        const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        geometries.push(geometry);
    }
    
    // Merge the geometries
    const mergedGeometry = mergeGeometries(geometries);
    
    // Center the text horizontally
    mergedGeometry.translate(-currentX / 2, 0, 0);
    
    console.log("Text geometry created successfully");
    return mergedGeometry;
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

// Simple function to merge geometries
function mergeGeometries(geometries) {
    if (geometries.length === 0) return null;
    
    // For simplicity in this debug version, just return the first geometry
    // In a full implementation, we would use THREE.BufferGeometryUtils.mergeBufferGeometries
    const mergedGeometry = BufferGeometryUtils 
        ? BufferGeometryUtils.mergeBufferGeometries(geometries) 
        : geometries[0].clone();
        
    return mergedGeometry || geometries[0].clone();
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
function createTextGroup(text) {
    console.log("Creating text group for:", text);
    
    // Create a group to hold text and underline
    const group = new THREE.Group();
    
    // Estimate text dimensions
    const textWidth = estimateTextWidth(text);
    
    // Create text geometry
    const textGeometry = createTextGeometry(text, FONT_SIZE, TEXT_THICKNESS);
    const textMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        metalness: 0.2,
        roughness: 0.7
    });
    const textMesh = new THREE.Mesh(textGeometry, textMaterial);
    group.add(textMesh);
    
    // Create underline geometry
    const underlineGeometry = createUnderlineGeometry(textWidth, UNDERLINE_THICKNESS, TEXT_THICKNESS);
    const underlineMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        metalness: 0.2,
        roughness: 0.7
    });
    const underlineMesh = new THREE.Mesh(underlineGeometry, underlineMaterial);
    group.add(underlineMesh);
    
    // Add wireframe to help debug the text shape
    const textWireframe = new THREE.WireframeGeometry(textGeometry);
    const textLine = new THREE.LineSegments(textWireframe);
    textLine.material.color.setHex(0x000000);
    textLine.material.opacity = 0.25;
    textLine.material.transparent = true;
    group.add(textLine);
    
    console.log("Text group created successfully");
    return group;
}

// Simplified function for debugging preview
function createTextPreviewGroup(text) {
    console.log("Creating simple text preview for:", text);
    
    // Create a group to hold text and underline
    const group = new THREE.Group();
    
    // Create a simpler representation for previewing
    const textWidth = estimateTextWidth(text) * 0.8;
    const textHeight = FONT_SIZE;
    
    // Create a simple box for the text
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
    
    console.log("Simple text preview created successfully");
    return group;
}

// Add text for a name to a scene
function addTextToScene(scene, name) {
    console.log("Adding text to scene for name:", name);
    
    try {
        // For development: use a simpler version for reliable preview
        const textGroup = createTextPreviewGroup(name);
        
        // Position the text on the clip
        textGroup.position.set(TEXT_X_OFFSET, TEXT_Y_OFFSET, SVG_THICKNESS + 0.1);
        
        scene.add(textGroup);
        console.log("Text added to scene successfully");
        return textGroup;
    } catch (error) {
        console.error("Error adding text to scene:", error);
        return null;
    }
}
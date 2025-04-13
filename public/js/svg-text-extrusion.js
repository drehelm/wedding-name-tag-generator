// SVG Text Extrusion - Generate 3D text using SVG paths and THREE.js extrusion

// Constants from OpenSCAD template
const TEXT_THICKNESS = 4;
const FONT_SIZE = 8;
const UNDERLINE_THICKNESS = 1.5;
const UNDERLINE_WIDTH_FACTOR = 1.2;
const TEXT_X_OFFSET = 5;
const TEXT_Y_OFFSET = 5;

// Create and return an SVG element with text
function createSVGTextElement(text, fontSize) {
    // Create a temporary SVG element
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("width", "500");
    svg.setAttribute("height", "100");
    
    // Create a text element
    const textElement = document.createElementNS(svgNS, "text");
    textElement.setAttribute("x", "10");
    textElement.setAttribute("y", "50");
    textElement.setAttribute("font-family", "Arial, sans-serif");
    textElement.setAttribute("font-size", fontSize);
    textElement.setAttribute("font-weight", "bold");
    textElement.textContent = text;
    
    // Append text to SVG
    svg.appendChild(textElement);
    
    // Add to document temporarily to get path data
    document.body.appendChild(svg);
    
    return svg;
}

// Convert SVG text to path data
function getSVGTextPath(svg, text) {
    if (!svg) {
        console.error("No SVG element provided");
        return null;
    }
    
    try {
        // Get the text element
        const textElement = svg.querySelector("text");
        if (!textElement) {
            console.error("No text element found in SVG");
            return null;
        }
        
        // Create a canvas to measure text
        const tempCanvas = document.createElement('canvas');
        const ctx = tempCanvas.getContext('2d');
        
        // Set font properties to match the SVG text
        const fontSize = textElement.getAttribute("font-size");
        const fontFamily = textElement.getAttribute("font-family");
        ctx.font = `bold ${fontSize}px ${fontFamily}`;
        
        // Measure text width
        const textWidth = ctx.measureText(text).width;
        
        // Get the bounding box of the text
        const bbox = textElement.getBBox();
        
        // Convert text to path data
        return {
            path: textElement,
            width: textWidth,
            height: bbox.height,
            x: bbox.x,
            y: bbox.y
        };
    } catch (error) {
        console.error("Error getting SVG text path:", error);
        return null;
    } finally {
        // Clean up - remove the SVG from document
        if (svg.parentNode) {
            svg.parentNode.removeChild(svg);
        }
    }
}

// Create shapes from text for extrusion
function createTextShapes(text) {
    console.log("Creating text shapes for:", text);
    
    // Create SVG with text
    const svg = createSVGTextElement(text, FONT_SIZE * 10); // Scale up for better detail
    
    // Get path data
    const pathData = getSVGTextPath(svg, text);
    
    if (!pathData) {
        console.error("Failed to get path data for text");
        return createFallbackTextShapes(text);
    }
    
    try {
        // Create shapes for each character
        const shapes = [];
        let xOffset = 0;
        
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            
            // Create a shape for this character
            const shape = new THREE.Shape();
            const width = getCharWidth(char) * (FONT_SIZE / 5);
            const height = FONT_SIZE;
            
            // Create a letter-like shape
            shape.moveTo(xOffset, 0);
            shape.lineTo(xOffset + width, 0);
            shape.lineTo(xOffset + width, height);
            shape.lineTo(xOffset, height);
            shape.lineTo(xOffset, 0);
            
            shapes.push(shape);
            
            // Update offset for next character
            xOffset += width * 1.2; // Add spacing
        }
        
        console.log("Created shapes for text");
        return shapes;
    } catch (error) {
        console.error("Error creating text shapes:", error);
        return createFallbackTextShapes(text);
    }
}

// Create fallback text shapes if SVG approach fails
function createFallbackTextShapes(text) {
    console.log("Creating fallback text shapes for:", text);
    
    const shapes = [];
    let xOffset = 0;
    
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        
        // Size based on character width
        const width = getCharWidth(char) * (FONT_SIZE / 5);
        const height = FONT_SIZE;
        
        // Create a shape for this character
        const shape = new THREE.Shape();
        
        // Create different shapes based on character
        if ("AEFHIKLMNTVWXYZ".includes(char)) {
            // Letters with diagonal strokes
            shape.moveTo(xOffset, 0);
            shape.lineTo(xOffset + width/3, height);
            shape.lineTo(xOffset + 2*width/3, height);
            shape.lineTo(xOffset + width, 0);
            shape.lineTo(xOffset + 0.8*width, 0);
            shape.lineTo(xOffset + 0.65*width, height/2);
            shape.lineTo(xOffset + 0.35*width, height/2);
            shape.lineTo(xOffset + 0.2*width, 0);
            shape.lineTo(xOffset, 0);
        } 
        else if ("BDOPQRSU".includes(char)) {
            // Rounded letters
            shape.moveTo(xOffset, 0);
            shape.lineTo(xOffset, height);
            shape.lineTo(xOffset + 0.7*width, height);
            
            // Add curves for rounded letters
            shape.bezierCurveTo(
                xOffset + width, height,
                xOffset + width, height/2,
                xOffset + 0.7*width, 0
            );
            
            shape.lineTo(xOffset, 0);
        }
        else if ("CGJ".includes(char)) {
            // Letters with hooks
            shape.moveTo(xOffset + width, height/4);
            shape.lineTo(xOffset + 0.7*width, 0);
            shape.lineTo(xOffset + 0.3*width, 0);
            shape.lineTo(xOffset, height/4);
            shape.lineTo(xOffset, 0.75*height);
            shape.lineTo(xOffset + 0.3*width, height);
            shape.lineTo(xOffset + width, height);
        }
        else {
            // Default letter shape (simple rectangle with detail)
            shape.moveTo(xOffset, 0);
            shape.lineTo(xOffset, height);
            shape.lineTo(xOffset + width, height);
            shape.lineTo(xOffset + width, 0);
            shape.lineTo(xOffset, 0);
            
            // Add a hole in the middle to make it more letter-like
            const hole = new THREE.Path();
            hole.moveTo(xOffset + 0.25*width, 0.25*height);
            hole.lineTo(xOffset + 0.75*width, 0.25*height);
            hole.lineTo(xOffset + 0.75*width, 0.75*height);
            hole.lineTo(xOffset + 0.25*width, 0.75*height);
            hole.lineTo(xOffset + 0.25*width, 0.25*height);
            
            shape.holes.push(hole);
        }
        
        shapes.push(shape);
        
        // Update offset for next character
        xOffset += width * 1.2; // Add spacing
    }
    
    return shapes;
}

// Function to get character width (follows OpenSCAD template logic)
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

// Create underline shape
function createUnderlineShape(textWidth) {
    console.log("Creating underline with width:", textWidth);
    
    const underlineWidth = textWidth * UNDERLINE_WIDTH_FACTOR;
    
    // Create shape for underline
    const shape = new THREE.Shape();
    shape.moveTo(-underlineWidth/2, -FONT_SIZE - 2);
    shape.lineTo(underlineWidth/2, -FONT_SIZE - 2);
    shape.lineTo(underlineWidth/2, -FONT_SIZE - 2 - UNDERLINE_THICKNESS);
    shape.lineTo(-underlineWidth/2, -FONT_SIZE - 2 - UNDERLINE_THICKNESS);
    shape.lineTo(-underlineWidth/2, -FONT_SIZE - 2);
    
    return shape;
}

// Calculate total text width
function calculateTextWidth(text) {
    let totalWidth = 0;
    
    for (let i = 0; i < text.length; i++) {
        const width = getCharWidth(text[i]);
        totalWidth += width * 1.2; // Add spacing
    }
    
    return totalWidth * (FONT_SIZE / 5);
}

// Create extruded text geometry
function createExtrudedText(text) {
    console.log("Creating extruded text for:", text);
    
    // Create shapes for the text
    const textShapes = createTextShapes(text);
    
    // Create extrude settings
    const extrudeSettings = {
        steps: 1,
        depth: TEXT_THICKNESS,
        bevelEnabled: true,
        bevelThickness: 0.3,
        bevelSize: 0.2,
        bevelOffset: 0,
        bevelSegments: 5
    };
    
    // Create geometry for each shape
    const geometries = [];
    
    textShapes.forEach(shape => {
        const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        geometries.push(geometry);
    });
    
    // Add underline
    const textWidth = calculateTextWidth(text);
    const underlineShape = createUnderlineShape(textWidth);
    const underlineGeometry = new THREE.ExtrudeGeometry(underlineShape, extrudeSettings);
    geometries.push(underlineGeometry);
    
    // Create material
    const material = new THREE.MeshStandardMaterial({
        color: 0x333333,
        metalness: 0.2,
        roughness: 0.7
    });
    
    // Create group for all text parts
    const group = new THREE.Group();
    
    // Add each geometry as a mesh
    geometries.forEach(geometry => {
        const mesh = new THREE.Mesh(geometry, material);
        group.add(mesh);
    });
    
    console.log("Extruded text created successfully");
    return group;
}

// Add text to scene
async function addTextToScene(scene, name) {
    console.log("Adding text to scene for name:", name);
    
    try {
        // Create extruded text
        const textGroup = createExtrudedText(name);
        
        // Position text on clip
        textGroup.position.set(TEXT_X_OFFSET, TEXT_Y_OFFSET, SVG_THICKNESS + 0.1);
        
        // Add to scene
        scene.add(textGroup);
        
        console.log("Text added to scene successfully");
        return textGroup;
    } catch (error) {
        console.error("Error adding text to scene:", error);
        
        // Add error indicator
        const errorGeometry = new THREE.BoxGeometry(30, 5, 2);
        const errorMaterial = new THREE.MeshStandardMaterial({
            color: 0xff0000
        });
        const errorMesh = new THREE.Mesh(errorGeometry, errorMaterial);
        errorMesh.position.set(TEXT_X_OFFSET, TEXT_Y_OFFSET, SVG_THICKNESS + 0.1);
        
        scene.add(errorMesh);
        return errorMesh;
    }
}
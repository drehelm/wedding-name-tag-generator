// text-generator.js - Creates 3D text for name tags using THREE.js

// Constants for text dimensions (from OpenSCAD file)
const TEXT_THICKNESS = 4;
const FONT_SIZE = 20;
const UNDERLINE_THICKNESS = 3;
const UNDERLINE_MARGIN = 4;
const TEXT_X_OFFSET = SVG_WIDTH / 5;  // Matches the OpenSCAD positioning
const TEXT_Y_OFFSET = SVG_HEIGHT * 2.19;

// Character width estimation functions ported from OpenSCAD
function getCharWidth(char) {
  // Narrow characters
  if (['I', 'i', 'l', '1', 'J', '.', ',', '-'].includes(char)) {
    return 2.5;
  }
  // Wide characters
  else if (['W', 'M', 'H', 'K', 'O', 'D', 'Q', 'G'].includes(char)) {
    return 5;
  }
  // Medium characters (default)
  else {
    return 3.5;
  }
}

// Estimate the width of text based on character widths
function estimateTextWidth(text, sizeFactor = 1) {
  let width = 0;
  for (let i = 0; i < text.length; i++) {
    width += getCharWidth(text[i]);
  }
  return width * sizeFactor;
}

// Create text mesh
function createTextMesh(text) {
    // For a real implementation we would use TextGeometry from THREE.js
    // Since we don't have font loading set up in this prototype, we'll use a placeholder
    
    // Calculate the estimated text dimensions
    const textWidth = estimateTextWidth(text, 5);
    const textHeight = FONT_SIZE * 0.7;  // Approximate height based on font size
    
    // Create a box geometry to represent text
    const textGeometry = new THREE.BoxGeometry(textWidth, textHeight, TEXT_THICKNESS);
    const textMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x2c3e50,
        metalness: 0.1,
        roughness: 0.8
    });
    
    // Position the text correctly
    textGeometry.translate(textWidth/2, -textHeight/2, TEXT_THICKNESS/2);
    
    return new THREE.Mesh(textGeometry, textMaterial);
}

// Create underline mesh
function createUnderlineMesh(textWidth) {
    // Create underline
    const underlineLength = textWidth + (2 * UNDERLINE_MARGIN);
    const underlineGeometry = new THREE.BoxGeometry(underlineLength, UNDERLINE_THICKNESS, TEXT_THICKNESS);
    const underlineMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x2c3e50,
        metalness: 0.1,
        roughness: 0.8
    });
    
    // Position the underline correctly
    underlineGeometry.translate(underlineLength/2, UNDERLINE_THICKNESS/2, TEXT_THICKNESS/2);
    
    return new THREE.Mesh(underlineGeometry, underlineMaterial);
}

// Function to get text and underline group for a name
function getTextGroup(name) {
    // Create a group to hold all text elements
    const textGroup = new THREE.Group();
    
    // Create the text mesh
    const textMesh = createTextMesh(name);
    textMesh.position.set(TEXT_X_OFFSET, TEXT_Y_OFFSET, 0);
    textGroup.add(textMesh);
    
    // Create the underline mesh
    const textWidth = estimateTextWidth(name, 5);
    const underlineMesh = createUnderlineMesh(textWidth);
    underlineMesh.position.set(20, 12.4, 0);
    textGroup.add(underlineMesh);
    
    return textGroup;
}

// Add text for a name to a scene
function addTextToScene(scene, name) {
    const textGroup = getTextGroup(name);
    scene.add(textGroup);
    return textGroup;
}
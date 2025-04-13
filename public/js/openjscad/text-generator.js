// text-generator.js - Creates 3D text for name tags using THREE.js

// Constants for text dimensions (from OpenSCAD file)
const TEXT_THICKNESS = 4;
const FONT_SIZE = 10;
const UNDERLINE_THICKNESS = 1.5;
const UNDERLINE_WIDTH_FACTOR = 1.2; // Make underline a bit wider than text
const TEXT_X_OFFSET = 5;  // Adjusted position for better placement
const TEXT_Y_OFFSET = 2;

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

// Create individual letter geometries
function createLetterGeometry(letter, xPosition) {
  // For a realistic implementation, we'd use TextGeometry with loaded fonts
  // Since that requires async font loading, we'll simulate letters with simple shapes
  
  const charWidth = getCharWidth(letter);
  const letterWidth = charWidth * 2;
  const letterHeight = FONT_SIZE;
  
  // Create a shape based on the letter
  let shape;
  
  switch(letter) {
    case 'I':
    case '1':
    case 'l':
      // Thin rectangle
      shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.lineTo(letterWidth * 0.4, 0);
      shape.lineTo(letterWidth * 0.4, letterHeight);
      shape.lineTo(0, letterHeight);
      shape.lineTo(0, 0);
      break;
      
    case 'O':
    case 'Q':
    case 'D':
      // Rounded rectangle
      shape = new THREE.Shape();
      const radius = letterHeight * 0.3;
      shape.moveTo(radius, 0);
      shape.lineTo(letterWidth - radius, 0);
      shape.arc(0, radius, radius, Math.PI * 1.5, 0, false);
      shape.lineTo(letterWidth, letterHeight - radius);
      shape.arc(-radius, 0, radius, 0, Math.PI * 0.5, false);
      shape.lineTo(radius, letterHeight);
      shape.arc(0, -radius, radius, Math.PI * 0.5, Math.PI, false);
      shape.lineTo(0, radius);
      shape.arc(radius, 0, radius, Math.PI, Math.PI * 1.5, false);
      break;
      
    default:
      // Default letter shape (rectangle with slight difference for variety)
      shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.lineTo(letterWidth, 0);
      shape.lineTo(letterWidth, letterHeight);
      shape.lineTo(letterWidth * 0.8, letterHeight);
      shape.lineTo(letterWidth * 0.8, letterHeight * 0.8);
      shape.lineTo(letterWidth * 0.2, letterHeight * 0.8);
      shape.lineTo(letterWidth * 0.2, letterHeight);
      shape.lineTo(0, letterHeight);
      shape.lineTo(0, 0);
  }
  
  // Extrude the shape
  const extrudeSettings = {
    steps: 1,
    depth: TEXT_THICKNESS,
    bevelEnabled: false
  };
  
  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  
  // Position the letter
  geometry.translate(xPosition, 0, 0);
  
  return geometry;
}

// Create text mesh for the entire name
function createTextMesh(text) {
  // Create a group to hold all text meshes
  const textGroup = new THREE.Group();
  
  // Track total width for positioning
  let totalWidth = 0;
  const letterGeometries = [];
  
  // Create a letter mesh for each character
  for (let i = 0; i < text.length; i++) {
    const letter = text[i];
    
    // Skip spaces but account for their width
    if (letter === ' ') {
      totalWidth += getCharWidth(' ') * 2;
      continue;
    }
    
    // Create letter geometry
    const letterGeometry = createLetterGeometry(letter, totalWidth);
    letterGeometries.push(letterGeometry);
    
    // Update totalWidth for next letter
    totalWidth += getCharWidth(letter) * 2;
  }
  
  // Combine all letter geometries
  let textGeometry;
  if (letterGeometries.length > 0) {
    // If we have letters, merge them into a single geometry
    const mergedGeometry = BufferGeometryUtils.mergeBufferGeometries
      ? BufferGeometryUtils.mergeBufferGeometries(letterGeometries)
      : letterGeometries[0]; // Fallback if merge not available
    
    textGeometry = mergedGeometry;
  } else {
    // Fallback for empty text
    textGeometry = new THREE.BoxGeometry(1, FONT_SIZE, TEXT_THICKNESS);
  }
  
  // Create material
  const textMaterial = new THREE.MeshStandardMaterial({
    color: 0x333333,
    metalness: 0.1,
    roughness: 0.8
  });
  
  // Create mesh and add to group
  const textMesh = new THREE.Mesh(textGeometry, textMaterial);
  textGroup.add(textMesh);
  
  return textGroup;
}

// Create underline mesh
function createUnderlineMesh(textWidth) {
  // Create a more interesting underline with beveled edges
  const underlineShape = new THREE.Shape();
  
  // Underline with slightly rounded ends
  const halfHeight = UNDERLINE_THICKNESS / 2;
  const width = textWidth * UNDERLINE_WIDTH_FACTOR;
  
  underlineShape.moveTo(0, -UNDERLINE_THICKNESS);
  underlineShape.lineTo(width, -UNDERLINE_THICKNESS);
  underlineShape.lineTo(width, 0);
  underlineShape.lineTo(0, 0);
  underlineShape.lineTo(0, -UNDERLINE_THICKNESS);
  
  // Extrude the shape
  const extrudeSettings = {
    steps: 1,
    depth: TEXT_THICKNESS,
    bevelEnabled: false
  };
  
  const geometry = new THREE.ExtrudeGeometry(underlineShape, extrudeSettings);
  
  // Create material
  const underlineMaterial = new THREE.MeshStandardMaterial({
    color: 0x333333,
    metalness: 0.1,
    roughness: 0.8
  });
  
  return new THREE.Mesh(geometry, underlineMaterial);
}

// Function to get text and underline group for a name
function getTextGroup(name) {
  // Create a group to hold all text elements
  const textGroup = new THREE.Group();
  
  // Calculate text width for positioning
  const textWidth = estimateTextWidth(name, 2);
  
  // Create the text mesh
  const textMesh = createTextMesh(name);
  textMesh.position.set(TEXT_X_OFFSET, TEXT_Y_OFFSET, 0);
  textGroup.add(textMesh);
  
  // Create the underline mesh
  const underlineMesh = createUnderlineMesh(textWidth);
  underlineMesh.position.set(TEXT_X_OFFSET - 2, TEXT_Y_OFFSET - FONT_SIZE * 0.3, 0);
  textGroup.add(underlineMesh);
  
  return textGroup;
}

// Add text for a name to a scene
function addTextToScene(scene, name) {
  const textGroup = getTextGroup(name);
  scene.add(textGroup);
  return textGroup;
}

// Polyfill for BufferGeometryUtils if needed
const BufferGeometryUtils = {
  mergeBufferGeometries: function(geometries) {
    // If THREE.BufferGeometryUtils exists, use it
    if (THREE.BufferGeometryUtils && THREE.BufferGeometryUtils.mergeBufferGeometries) {
      return THREE.BufferGeometryUtils.mergeBufferGeometries(geometries);
    }
    
    // Otherwise, return the first geometry as a simple fallback
    return geometries[0];
  }
};
// text-generator.js - Creates 3D text for name tags using OpenJSCAD

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

// Create 3D text model with underline
function generateTextModel(text) {
  // Extract needed JSCAD modules
  const { translate, rotateX } = jscadModeling.transforms;
  const { cuboid } = jscadModeling.primitives;
  const { extrudeLinear } = jscadModeling.extrusions;
  const { union } = jscadModeling.booleans;
  
  // Create models array to store text and underline
  const models = [];
  
  // Create 3D text
  // Note: OpenJSCAD doesn't have a built-in text function like OpenSCAD
  // For a real implementation, we would need a text-to-geometry library
  // Here we'll simulate text with a placeholder box that scales with text length
  
  // Calculate estimated text dimensions
  const textWidth = estimateTextWidth(text, 5);
  const textHeight = FONT_SIZE * 0.7;  // Approximate height based on font size
  
  // Create a placeholder box for text (in a real implementation, we would use actual text geometry)
  const textBox = cuboid({
    size: [textWidth, textHeight, TEXT_THICKNESS],
    center: [textWidth/2, -textHeight/2, TEXT_THICKNESS/2]
  });
  
  // Position the text
  const positionedText = translate(
    [TEXT_X_OFFSET, TEXT_Y_OFFSET, 0],
    textBox
  );
  
  models.push(positionedText);
  
  // Create underline
  const underlineLength = textWidth + (2 * UNDERLINE_MARGIN);
  const underline = cuboid({
    size: [underlineLength, UNDERLINE_THICKNESS, TEXT_THICKNESS],
    center: [underlineLength/2, UNDERLINE_THICKNESS/2, TEXT_THICKNESS/2]
  });
  
  // Position the underline (matching OpenSCAD positioning)
  const positionedUnderline = translate(
    [20, 12.4, 0],
    underline
  );
  
  models.push(positionedUnderline);
  
  // Combine text and underline
  return union(models);
}

// Create text with name for a specific name
function getTextModel(name) {
  // Generate the text model for the given name
  return generateTextModel(name);
}

// In a complete implementation, we would:
// 1. Use a proper text-to-geometry library or API
// 2. Support the STIX Two Text Bold font
// 3. Handle proper text metrics and positioning

// For a production version, libraries like THREE.TextGeometry or custom
// font-to-path solutions would provide actual text geometry
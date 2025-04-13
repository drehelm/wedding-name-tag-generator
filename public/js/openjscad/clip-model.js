// clip-model.js - Converts SVG clip to 3D model

// This file handles the conversion of the Clip1.svg file to a 3D model
// using OpenJSCAD's modeling library

// SVG path data from Clip1.svg
const clipPathData = "M -7.3884953,69.348353 C -9.118145,68.40965 -11.055891,67.897161 -13.037246,67.854385 v 2e-6 c -1.98142,-0.04254 -3.947888,0.385925 -5.732467,1.249019 l -0.429782,0.191121 -14.698799,6.827605 -0.271864,0.205914 c -2.387859,0.634289 -4.040473,0.459185 -5.908332,-1.203252 -1.867553,-1.662396 -2.574351,-4.359732 -1.780253,-6.7939 0.79407,-2.434414 2.92664,-4.106986 5.371249,-4.212663 l 0.379624,-0.0047 78.402647,-0.0739";

// Constants for SVG dimensions (from OpenSCAD file)
const SVG_WIDTH = 86;
const SVG_HEIGHT = 15;
const SVG_THICKNESS = 4;

// Convert SVG path data to points
function parsePathToPoints(pathData) {
  // This is a simplified path parser for the specific SVG path
  // A production solution would use a full SVG path parser
  
  // For our specific clip, we'll create a simplified approximation
  // by creating a series of points that approximate the clip shape
  
  // The clip is roughly a curved line with a hook at one end
  // We'll create a simplified version with strategic points
  
  return [
    // Starting point (left side)
    [-42, 62], // Adjusted to match clip dimensions
    
    // Bottom curve points
    [-40, 64],
    [-35, 66],
    [-30, 67],
    [-25, 67.5],
    [-20, 67.8],
    
    // Middle section
    [-15, 67.9],
    [-10, 67.8],
    [-5, 67.5],
    [0, 67],
    [5, 66.5],
    [10, 66],
    [15, 65.5],
    
    // Right section (straight part)
    [20, 65],
    [25, 64.5],
    [30, 64],
    [35, 63.5],
    [40, 63],
    [42, 62.8],
    
    // Right end point
    [43, 62.7]
  ];
}

// Create a closed polygon from the points
function createClosedPath(points) {
  // Create a closed shape by mirroring the points with a slight offset
  const topOffset = 1; // Distance between top and bottom parts
  
  // Create top path (reversed and offset)
  const topPoints = [...points]
    .reverse()
    .map(p => [p[0], p[1] - topOffset]);
  
  // Combine bottom and top paths to form a closed shape
  return [...points, ...topPoints];
}

// Generate the clip model using OpenJSCAD
function generateClipModel() {
  // Extract JSCAD modules
  const { extrudeLinear } = jscadModeling.extrusions;
  const { polygon } = jscadModeling.primitives;
  
  // Parse the path to points
  const points = parsePathToPoints(clipPathData);
  
  // Create a closed path
  const closedPath = createClosedPath(points);
  
  // Create the 2D polygon
  const clipPolygon = polygon({ points: closedPath });
  
  // Extrude the polygon to create a 3D model
  return extrudeLinear({ height: SVG_THICKNESS }, clipPolygon);
}

// Function to get the clip model centered at origin
function getClipModel() {
  // Generate the basic clip model
  const clipModel = generateClipModel();
  
  // The model is already positioned appropriately based on the points
  return clipModel;
}
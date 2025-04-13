// clip-model.js - Converts SVG clip to 3D model using THREE.js

// Constants for SVG dimensions (from OpenSCAD file)
const SVG_WIDTH = 86;
const SVG_HEIGHT = 15;
const SVG_THICKNESS = 4;

// Create a more accurate representation of the clip shape
function createClipGeometry() {
    // We'll create a more interesting shape using ExtrudeGeometry
    const shape = new THREE.Shape();
    
    // Start from bottom left
    shape.moveTo(0, 0);
    
    // Draw the curved bottom edge
    shape.bezierCurveTo(
        20, 0,     // control point 1
        30, 3,     // control point 2
        40, 5      // end point
    );
    
    // Continue the curve
    shape.bezierCurveTo(
        50, 7,     // control point 1
        60, 9,     // control point 2
        SVG_WIDTH, 10  // end point (right bottom)
    );
    
    // Draw the right edge
    shape.lineTo(SVG_WIDTH, SVG_HEIGHT);
    
    // Draw the top curved edge (reversed curve from bottom)
    shape.bezierCurveTo(
        60, SVG_HEIGHT - 2,  // control point 1
        50, SVG_HEIGHT - 3,  // control point 2
        40, SVG_HEIGHT - 4   // end point
    );
    
    // Complete the curve back to left
    shape.bezierCurveTo(
        30, SVG_HEIGHT - 6,  // control point 1
        20, SVG_HEIGHT - 8,  // control point 2
        0, SVG_HEIGHT        // end point (left top)
    );
    
    // Close the shape
    shape.lineTo(0, 0);
    
    // Extrude the shape to create a 3D geometry
    const extrudeSettings = {
        steps: 1,
        depth: SVG_THICKNESS,
        bevelEnabled: false
    };
    
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    
    // Reposition the model so it's centered
    geometry.translate(-SVG_WIDTH/2, -SVG_HEIGHT/2, 0);
    
    return geometry;
}

// Function to get a THREE.js mesh for the clip
function getClipMesh() {
    const geometry = createClipGeometry();
    const material = new THREE.MeshStandardMaterial({ 
        color: 0x3498db,
        metalness: 0.2,
        roughness: 0.5
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    
    return mesh;
}

// Function to add a clip mesh to a THREE.js scene
function addClipToScene(scene) {
    const clipMesh = getClipMesh();
    scene.add(clipMesh);
    return clipMesh;
}
// clip-model.js - Converts SVG clip to 3D model using THREE.js

// Constants for SVG dimensions (from OpenSCAD file)
const SVG_WIDTH = 86;
const SVG_HEIGHT = 15;
const SVG_THICKNESS = 4;

// Create a more accurate representation of the clip shape based on actual SVG path
function createClipGeometry() {
    console.log("Creating accurate clip geometry based on SVG path");
    
    // Create a shape from the actual SVG path data in Clip1.svg
    const shape = new THREE.Shape();
    
    // The original path data is: 
    // M -7.3884953,69.348353 C -9.118145,68.40965 -11.055891,67.897161 -13.037246,67.854385 
    // v 2e-6 c -1.98142,-0.04254 -3.947888,0.385925 -5.732467,1.249019 l -0.429782,0.191121 
    // -14.698799,6.827605 -0.271864,0.205914 c -2.387859,0.634289 -4.040473,0.459185 
    // -5.908332,-1.203252 -1.867553,-1.662396 -2.574351,-4.359732 -1.780253,-6.7939 
    // 0.79407,-2.434414 2.92664,-4.106986 5.371249,-4.212663 l 0.379624,-0.0047 78.402647,-0.0739
    
    // Normalize coordinates for our coordinate system
    // Start point (offset to create a complete shape)
    shape.moveTo(5, 2);
    
    // Create the main curved body shape (approximating the SVG path)
    shape.bezierCurveTo(
        15, 1.5,   // control point 1
        25, 1,     // control point 2
        40, 1      // end point
    );
    
    // Continue with the right side curve
    shape.bezierCurveTo(
        55, 1,     // control point 1 
        70, 1.5,   // control point 2
        80, 4      // end point (right side)
    );
    
    // Top edge
    shape.lineTo(80, SVG_HEIGHT - 2);
    
    // Top curve 
    shape.bezierCurveTo(
        70, SVG_HEIGHT - 1,  // control point 1
        55, SVG_HEIGHT,      // control point 2
        40, SVG_HEIGHT       // end point
    );
    
    // Left top curve
    shape.bezierCurveTo(
        25, SVG_HEIGHT,      // control point 1
        15, SVG_HEIGHT - 1,  // control point 2
        5, SVG_HEIGHT - 2    // end point (left side)
    );
    
    // Add the clip hook feature on the left
    shape.lineTo(5, SVG_HEIGHT - 5);
    shape.bezierCurveTo(
        3, SVG_HEIGHT - 6,   // control point 1
        1, SVG_HEIGHT - 7,   // control point 2
        0, SVG_HEIGHT - 9    // end point (hook point)
    );
    
    // Continue the hook curve
    shape.bezierCurveTo(
        1, SVG_HEIGHT - 11,  // control point 1
        3, SVG_HEIGHT - 12,  // control point 2
        5, SVG_HEIGHT - 13   // end point
    );
    
    // Close the shape back to start
    shape.lineTo(5, 2);
    
    // Extrude settings
    const extrudeSettings = {
        steps: 2,
        depth: SVG_THICKNESS,
        bevelEnabled: true,
        bevelThickness: 0.5,
        bevelSize: 0.5,
        bevelOffset: 0,
        bevelSegments: 3
    };
    
    // Create extruded geometry
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    
    // Reposition the model so it's centered
    geometry.translate(-SVG_WIDTH/2 + 5, -SVG_HEIGHT/2, -SVG_THICKNESS/2);
    
    console.log("Clip geometry created successfully");
    return geometry;
}

// Function to get a THREE.js mesh for the clip
function getClipMesh() {
    console.log("Getting clip mesh");
    const geometry = createClipGeometry();
    const material = new THREE.MeshStandardMaterial({ 
        color: 0x3498db,
        metalness: 0.3,
        roughness: 0.7,
        side: THREE.DoubleSide  // Render both sides of faces
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    
    // Add wireframe to help debug the shape
    const wireframe = new THREE.WireframeGeometry(geometry);
    const line = new THREE.LineSegments(wireframe);
    line.material.color.setHex(0x000000);
    line.material.opacity = 0.25;
    line.material.transparent = true;
    
    // Create a group to hold both the solid mesh and wireframe
    const group = new THREE.Group();
    group.add(mesh);
    group.add(line);
    
    console.log("Returning clip mesh group");
    return group;
}

// Function to add a clip mesh to a THREE.js scene
function addClipToScene(scene) {
    console.log("Adding clip to scene");
    const clipMesh = getClipMesh();
    scene.add(clipMesh);
    
    // Also add axes helper to visualize orientation
    const axesHelper = new THREE.AxesHelper(30);
    scene.add(axesHelper);
    
    console.log("Clip added to scene");
    return clipMesh;
}
// stl-generator.js - Generates STL files for name tags using THREE.js

// Function to create a complete name tag scene
function createNameTagScene(name) {
  console.log("Creating name tag scene for:", name);
  
  // Create a new THREE.js scene
  const scene = new THREE.Scene();
  
  // Add lighting for better visualization
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(50, 50, 50);
  scene.add(directionalLight);
  
  const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight2.position.set(-50, -50, 50);
  scene.add(directionalLight2);
  
  // Add the clip to the scene
  console.log("Adding clip to name tag scene");
  const clipMesh = addClipToScene(scene);
  
  // Add the text to the scene, positioned on top of the clip
  console.log("Adding text to name tag scene");
  const textGroup = addTextToScene(scene, name);
  
  console.log("Name tag scene created successfully");
  return scene;
}

// Function to generate STL binary data for a name tag
function generateSTL(name) {
  try {
    console.log("Generating STL for name:", name);
    
    // Create the name tag scene
    const nameTagScene = createNameTagScene(name);
    
    // Check if the THREE.STLExporter is available
    if (!THREE.STLExporter) {
      console.error("THREE.STLExporter not available");
      throw new Error('THREE.STLExporter not available. Make sure THREE.js STLExporter is properly loaded.');
    }
    
    // Create an STL exporter
    const exporter = new THREE.STLExporter();
    
    // Export the scene to STL (binary format)
    console.log("Exporting scene to STL");
    const stlData = exporter.parse(nameTagScene, { binary: true });
    
    console.log("STL generation complete");
    return stlData;
  } catch (error) {
    console.error('Error generating STL:', error);
    throw error;
  }
}

// Function to generate and initiate download of an STL file
function downloadSTL(name) {
  try {
    console.log("Starting STL download for name:", name);
    
    // Generate STL binary data
    const stlData = generateSTL(name);
    
    // Create a Blob from the STL data
    const blob = new Blob([stlData], { type: 'application/octet-stream' });
    
    // Create a download URL for the blob
    const url = URL.createObjectURL(blob);
    
    // Create a temporary download link
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = `${name}.stl`;
    
    // Append the link to the document, click it, and remove it
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
    // Clean up the URL object
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 100);
    
    console.log("STL download complete");
    return { success: true };
  } catch (error) {
    console.error('Error downloading STL:', error);
    return { success: false, error };
  }
}

// Function to create a THREE.js scene for preview with better positioning
function createPreviewScene(name) {
  console.log("Creating preview scene for name:", name);
  
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf0f0f0);
  
  // Add lighting for better visualization
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(50, 50, 50);
  scene.add(directionalLight);
  
  const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight2.position.set(-50, -50, 50);
  scene.add(directionalLight2);
  
  // Add the clip to the scene
  console.log("Adding clip to preview scene");
  const clipMesh = addClipToScene(scene);
  
  // Add the text to the scene, positioned on top of the clip
  console.log("Adding text to preview scene");
  const textGroup = addTextToScene(scene, name);
  
  // Add a grid helper for better visualization
  const gridHelper = new THREE.GridHelper(100, 10);
  gridHelper.rotation.x = Math.PI / 2;
  gridHelper.position.z = -5;
  scene.add(gridHelper);
  
  // Adjust the camera angle by positioning the model
  scene.rotation.x = -Math.PI / 6; // Tilt to show the 3D aspect better
  
  console.log("Preview scene created successfully");
  return scene;
}

// Function to process multiple names and generate STL files
function processNames(names, progressCallback) {
  console.log("Processing multiple names:", names);
  
  // Array to collect any errors
  const errors = [];
  
  // Process each name sequentially using promises
  return new Promise(async (resolve) => {
    for (let i = 0; i < names.length; i++) {
      const name = names[i];
      
      try {
        // Update progress
        if (progressCallback) {
          progressCallback({
            current: i + 1,
            total: names.length,
            name: name,
            status: 'processing'
          });
        }
        
        console.log(`Processing name ${i+1}/${names.length}: ${name}`);
        
        // Generate and download the STL
        const result = await downloadSTL(name);
        
        if (!result.success) {
          throw new Error(result.error.message || 'Unknown error');
        }
        
        // Short delay to prevent overwhelming the browser
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Error processing name "${name}":`, error);
        errors.push({ name, error: error.message || 'Unknown error' });
        
        // Update progress with error
        if (progressCallback) {
          progressCallback({
            current: i + 1,
            total: names.length,
            name: name,
            status: 'error',
            error: error.message || 'Unknown error'
          });
        }
      }
    }
    
    // Return summary of processing
    console.log("Names processing complete. Successful:", names.length - errors.length, "Errors:", errors.length);
    resolve({
      total: names.length,
      successful: names.length - errors.length,
      errors: errors
    });
  });
}
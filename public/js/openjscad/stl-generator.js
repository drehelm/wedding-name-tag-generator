// stl-generator.js - Generates STL files for name tags using THREE.js

// Function to create a complete name tag scene
async function createNameTagScene(name) {
  // Create a new THREE.js scene
  const scene = new THREE.Scene();
  
  // Add lighting for better visualization
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(50, 50, 50);
  scene.add(directionalLight);
  
  // Add the clip to the scene
  const clipMesh = addClipToScene(scene);
  
  // Add the text to the scene, positioned on top of the clip
  const textGroup = addTextToScene(scene, name);
  
  // Position text on the clip's top surface
  textGroup.position.z = SVG_THICKNESS;
  
  // Wait for the text to fully load (approximate delay)
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return scene;
}

// Function to generate STL binary data for a name tag
async function generateSTL(name) {
  try {
    // Create the name tag scene (with await for text loading)
    const nameTagScene = await createNameTagScene(name);
    
    // Check if the THREE.STLExporter is available
    if (!THREE.STLExporter) {
      throw new Error('THREE.STLExporter not available. Make sure THREE.js STLExporter is properly loaded.');
    }
    
    // Create an STL exporter
    const exporter = new THREE.STLExporter();
    
    // Export the scene to STL (binary format)
    const stlData = exporter.parse(nameTagScene, { binary: true });
    
    return stlData;
  } catch (error) {
    console.error('Error generating STL:', error);
    throw error;
  }
}

// Function to generate and initiate download of an STL file
async function downloadSTL(name) {
  try {
    // Generate STL binary data (with await)
    const stlData = await generateSTL(name);
    
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
    
    return { success: true };
  } catch (error) {
    console.error('Error downloading STL:', error);
    return { success: false, error };
  }
}

// Function to create a THREE.js scene for preview with better positioning
function createPreviewScene(name) {
  // We can't use await here since this function is called synchronously,
  // but our text-generator will handle loading and replacing the placeholder
  const scene = new THREE.Scene();
  
  // Add lighting for better visualization
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(50, 50, 50);
  scene.add(directionalLight);
  
  // Add the clip to the scene
  const clipMesh = addClipToScene(scene);
  
  // Add the text to the scene, positioned on top of the clip
  const textGroup = addTextToScene(scene, name);
  
  // Position text on the clip's top surface
  textGroup.position.z = SVG_THICKNESS;
  
  // Adjust the camera angle by positioning the model
  scene.rotation.x = -Math.PI / 8; // Tilt slightly to show the 3D aspect better
  
  return scene;
}

// Function to process multiple names and generate STL files
async function processNames(names, progressCallback) {
  // Array to collect any errors
  const errors = [];
  
  // Process each name
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
  return {
    total: names.length,
    successful: names.length - errors.length,
    errors: errors
  };
}
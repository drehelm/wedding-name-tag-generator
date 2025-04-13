// stl-generator.js - Generates STL files for name tags

// Function to create a complete name tag by combining clip and text
function createNameTag(name) {
  // Extract needed JSCAD modules
  const { union } = jscadModeling.booleans;
  
  // Get the clip model
  const clipModel = getClipModel();
  
  // Get the text model
  const textModel = getTextModel(name);
  
  // Combine the clip and text models
  return union(clipModel, textModel);
}

// Function to generate STL binary data for a name tag
function generateSTL(name) {
  // Get the serialization functions
  const { stlSerializer } = jscadIo;
  
  // Create the name tag model
  const nameTagModel = createNameTag(name);
  
  // Convert the model to STL binary format
  return stlSerializer.serialize({ binary: true }, nameTagModel);
}

// Function to generate and initiate download of an STL file
function downloadSTL(name) {
  return new Promise((resolve, reject) => {
    try {
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
        resolve();
      }, 100);
    } catch (error) {
      reject(error);
    }
  });
}

// Function to generate a preview model for rendering
function getPreviewModel(name) {
  return createNameTag(name);
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
      await downloadSTL(name);
      
      // Short delay to prevent overwhelming the browser
      await new Promise(resolve => setTimeout(resolve, 300));
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
// OpenSCAD-WASM integration script
let openScadModule = null;
let openScadInitialized = false;
let pendingCallbacks = [];

// Initialize OpenSCAD-WASM
async function initOpenSCAD() {
    if (openScadInitialized) {
        return Promise.resolve(openScadModule);
    }
    
    console.log("Initializing OpenSCAD-WASM...");
    
    try {
        // Using the CDN version of OpenSCAD-WASM
        const openscadjs = document.createElement('script');
        openscadjs.src = 'https://unpkg.com/@jscad/openscad-wasm@latest/dist/openscad-wasm.min.js';
        
        // Create a promise that resolves when the script loads
        const scriptLoadPromise = new Promise((resolve, reject) => {
            openscadjs.onload = resolve;
            openscadjs.onerror = (e) => reject(new Error("Failed to load OpenSCAD-WASM: " + e));
        });
        
        // Add script to document
        document.head.appendChild(openscadjs);
        
        // Wait for script to load
        await scriptLoadPromise;
        
        // Initialize the OpenSCAD module
        openScadModule = await OpenSCADWasm.initialize({
            printErr: (text) => console.error("OpenSCAD Error:", text),
            printMsg: (text) => console.log("OpenSCAD Message:", text),
        });
        
        openScadInitialized = true;
        console.log("OpenSCAD-WASM initialized successfully");
        
        // Process any pending callbacks
        pendingCallbacks.forEach(callback => callback(openScadModule));
        pendingCallbacks = [];
        
        return openScadModule;
    } catch (error) {
        console.error("Failed to initialize OpenSCAD-WASM:", error);
        throw error;
    }
}

// Function to check if OpenSCAD is available
function isOpenSCADAvailable() {
    return openScadInitialized && openScadModule !== null;
}

// Generate 3D model from OpenSCAD script
async function generateFromOpenSCAD(openscadScript, params = {}) {
    if (!openScadInitialized) {
        await initOpenSCAD();
    }
    
    console.log("Generating model from OpenSCAD script...");
    
    try {
        // Replace parameters in the script
        const processedScript = replaceParameters(openscadScript, params);
        
        // Compile the OpenSCAD script to STL
        const stlData = await openScadModule.compile({
            filename: 'model.scad',
            source: processedScript,
            outputFormat: 'stl'
        });
        
        console.log("OpenSCAD model generated successfully");
        return stlData;
    } catch (error) {
        console.error("Error generating model from OpenSCAD script:", error);
        throw error;
    }
}

// Replace parameters in OpenSCAD script
function replaceParameters(script, params) {
    let processedScript = script;
    
    // Replace each parameter in the script
    for (const [key, value] of Object.entries(params)) {
        const regex = new RegExp(`${key}\\s*=\\s*[^;]+;`, 'g');
        const replacement = typeof value === 'string' 
            ? `${key} = "${value}";` 
            : `${key} = ${value};`;
        
        processedScript = processedScript.replace(regex, replacement);
    }
    
    return processedScript;
}

// Load a file from URL and return its contents
async function loadFileFromURL(url) {
    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Failed to load file from ${url}: ${response.status} ${response.statusText}`);
        }
        
        return await response.text();
    } catch (error) {
        console.error(`Error loading file from ${url}:`, error);
        throw error;
    }
}

// Convert STL binary data to THREE.js geometry
function stlToThreeGeometry(stlData) {
    // Create a blob from the STL data
    const blob = new Blob([stlData], { type: 'application/octet-stream' });
    
    // Create a URL for the blob
    const url = URL.createObjectURL(blob);
    
    // Use THREE STLLoader to load the geometry
    return new Promise((resolve, reject) => {
        const loader = new THREE.STLLoader();
        loader.load(url, 
            // onLoad
            (geometry) => {
                // Clean up the URL
                URL.revokeObjectURL(url);
                resolve(geometry);
            },
            // onProgress
            undefined,
            // onError
            (error) => {
                // Clean up the URL
                URL.revokeObjectURL(url);
                reject(error);
            }
        );
    });
}

// Generate a name tag using OpenSCAD and return a THREE.js mesh
async function generateNameTag(name) {
    try {
        console.log("Generating name tag for:", name);
        
        // Load the OpenSCAD template
        const templateUrl = 'templates/templatev2.scad';
        const template = await loadFileFromURL(templateUrl);
        
        // Set parameters for the name tag
        const params = {
            name: name
        };
        
        // Generate STL from OpenSCAD
        const stlData = await generateFromOpenSCAD(template, params);
        
        // Convert to THREE.js geometry
        const geometry = await stlToThreeGeometry(stlData);
        
        // Create a material for the mesh
        const material = new THREE.MeshStandardMaterial({
            color: 0x3498db,
            metalness: 0.3,
            roughness: 0.7
        });
        
        // Create the mesh
        const mesh = new THREE.Mesh(geometry, material);
        
        console.log("Name tag generated successfully");
        return mesh;
    } catch (error) {
        console.error("Error generating name tag:", error);
        throw error;
    }
}

// Create a preview scene for a name using OpenSCAD
async function createOpenSCADPreviewScene(name) {
    console.log("Creating OpenSCAD preview scene for:", name);
    
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
    
    try {
        // Generate name tag using OpenSCAD
        const nameTagMesh = await generateNameTag(name);
        
        // Add the mesh to the scene
        scene.add(nameTagMesh);
        
        // Add a grid helper for better visualization
        const gridHelper = new THREE.GridHelper(100, 10);
        gridHelper.rotation.x = Math.PI / 2;
        gridHelper.position.z = -5;
        scene.add(gridHelper);
        
        console.log("OpenSCAD preview scene created successfully");
    } catch (error) {
        console.error("Error creating OpenSCAD preview scene:", error);
        
        // Add error indicator to the scene
        const errorGeometry = new THREE.BoxGeometry(30, 5, 2);
        const errorMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
        const errorMesh = new THREE.Mesh(errorGeometry, errorMaterial);
        scene.add(errorMesh);
    }
    
    return scene;
}
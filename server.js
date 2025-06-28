const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const JSZip = require('jszip');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('dist'));

// Temp directory for processing
const TEMP_DIR = path.join(__dirname, 'temp');
fs.ensureDirSync(TEMP_DIR);

// Templates directory
const TEMPLATES_DIR = path.join(__dirname, 'src', 'templates');

// Check if OpenSCAD is installed
async function checkOpenSCAD() {
    try {
        await execPromise('openscad --version');
        return true;
    } catch (error) {
        console.error('OpenSCAD not found. Please install OpenSCAD first.');
        return false;
    }
}

// Generate STL from OpenSCAD file
async function generateSTL(scadPath, stlPath) {
    // Use xvfb-run for headless operation in Docker
    const command = process.env.DISPLAY 
        ? `xvfb-run -a openscad -o "${stlPath}" "${scadPath}"`
        : `openscad -o "${stlPath}" "${scadPath}"`;
    
    try {
        console.log(`Executing: ${command}`);
        const { stdout, stderr } = await execPromise(command, { 
            timeout: 30000 // 30 second timeout
        });
        
        if (stderr && !stderr.includes('WARNING')) {
            console.error('OpenSCAD stderr:', stderr);
        }
        
        return true;
    } catch (error) {
        console.error('Error generating STL:', error);
        throw error;
    }
}

// API endpoint to generate STL files
app.post('/api/generate-stl', async (req, res) => {
    const { names } = req.body;
    
    if (!names || !Array.isArray(names) || names.length === 0) {
        return res.status(400).json({ error: 'No names provided' });
    }
    
    // Check OpenSCAD availability
    const hasOpenSCAD = await checkOpenSCAD();
    if (!hasOpenSCAD) {
        return res.status(500).json({ 
            error: 'OpenSCAD is not installed on the server. Please install OpenSCAD to use this feature.' 
        });
    }
    
    // Create unique working directory
    const workDir = path.join(TEMP_DIR, `job_${Date.now()}`);
    fs.ensureDirSync(workDir);
    
    try {
        // Copy templates to working directory
        const templatePath = path.join(TEMPLATES_DIR, 'templatev2.scad');
        const svgPath = path.join(TEMPLATES_DIR, 'Clip1.svg');
        
        if (!fs.existsSync(templatePath) || !fs.existsSync(svgPath)) {
            throw new Error('Template files not found');
        }
        
        fs.copyFileSync(svgPath, path.join(workDir, 'Clip1.svg'));
        
        // Read template
        const template = fs.readFileSync(templatePath, 'utf8');
        
        // Generate STL files
        const zip = new JSZip();
        const stlFiles = [];
        
        for (const name of names) {
            const cleanName = name.trim().toUpperCase();
            
            // Create personalized SCAD file
            const personalizedScad = template.replace(/name = "[^"]*"/, `name = "${cleanName}"`);
            const scadPath = path.join(workDir, `${cleanName}_tag.scad`);
            const stlPath = path.join(workDir, `${cleanName}_tag.stl`);
            
            // Write SCAD file
            fs.writeFileSync(scadPath, personalizedScad);
            
            // Generate STL
            console.log(`Generating STL for: ${cleanName}`);
            await generateSTL(scadPath, stlPath);
            
            // Add to ZIP
            if (fs.existsSync(stlPath)) {
                const stlContent = fs.readFileSync(stlPath);
                zip.file(`${cleanName}_tag.stl`, stlContent);
                stlFiles.push(`${cleanName}_tag.stl`);
            } else {
                console.error(`STL file not created for ${cleanName}`);
            }
        }
        
        // Add README
        const readmeContent = `Wedding Name Tag STL Files
==========================

This ZIP contains STL files for ${names.length} name tag(s).

Files included:
${stlFiles.map(f => `- ${f}`).join('\n')}

These files are ready for 3D printing!

Print Settings:
- Layer Height: 0.2mm
- Infill: 20%
- Support: Not required
- Print Time: ~15-20 minutes per tag

Generated with OpenSCAD on: ${new Date().toLocaleString()}
`;
        
        zip.file('README.txt', readmeContent);
        
        // Generate ZIP
        const zipContent = await zip.generateAsync({ 
            type: 'nodebuffer',
            compression: 'DEFLATE',
            compressionOptions: { level: 9 }
        });
        
        // Clean up
        fs.removeSync(workDir);
        
        // Send ZIP file
        res.set({
            'Content-Type': 'application/zip',
            'Content-Disposition': 'attachment; filename=wedding-name-tags-stl.zip'
        });
        res.send(zipContent);
        
    } catch (error) {
        // Clean up on error
        if (fs.existsSync(workDir)) {
            try {
                fs.removeSync(workDir);
            } catch (cleanupError) {
                console.error('Cleanup error:', cleanupError);
            }
        }
        
        console.error('Error in STL generation:', error);
        res.status(500).json({ 
            error: 'Failed to generate STL files',
            details: error.message 
        });
    }
});

// Health check
app.get('/api/health', async (req, res) => {
    const hasOpenSCAD = await checkOpenSCAD();
    res.json({ 
        status: 'ok', 
        openscad: hasOpenSCAD,
        message: hasOpenSCAD ? 'Server ready' : 'OpenSCAD not installed'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    checkOpenSCAD().then(hasOpenSCAD => {
        if (hasOpenSCAD) {
            console.log('OpenSCAD is available');
        } else {
            console.log('WARNING: OpenSCAD is not installed. STL generation will not work.');
            console.log('Install OpenSCAD: brew install openscad');
        }
    });
});
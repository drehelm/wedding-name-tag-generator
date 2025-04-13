// functions/generate-name-tags.js
const fs = require('fs').promises;
const path = require('path');
const archiver = require('archiver');
const { Readable } = require('stream');

exports.handler = async function(event, context) {
    try {
        // Parse the incoming request body
        const body = JSON.parse(event.body);
        const names = body.names || [];
        
        if (!names.length) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'No names provided' })
            };
        }
        
        // Create a ZIP file in memory
        const archive = archiver('zip', {
            zlib: { level: 9 } // Compression level
        });
        
        const streamBuffers = [];
        const output = new Readable();
        output._read = () => {}; // Implement _read method
        
        output.on('data', (data) => {
            streamBuffers.push(data);
        });
        
        archive.pipe(output);
        
        // Read template files
        const templateDir = path.join(__dirname, '..', 'templates');
        
        // Add SCAD template
        const scadContent = await fs.readFile(path.join(templateDir, 'templatev2.scad'), 'utf8');
        archive.append(scadContent, { name: 'templatev2.scad' });
        
        // Add SVG file
        const svgContent = await fs.readFile(path.join(templateDir, 'Clip1.svg'), 'utf8');
        archive.append(svgContent, { name: 'Clip1.svg' });
        
        // Generate Python script with names
        const pyTemplateContent = await fs.readFile(
            path.join(templateDir, 'generateNames.py.template'), 
            'utf8'
        );
        
        // Replace placeholder with actual names
        const namesList = names.map(name => `    "${name}"`).join(',\n');
        const pyContent = pyTemplateContent.replace('{{NAMES_LIST}}', namesList);
        
        archive.append(pyContent, { name: 'generateNames.py' });
        
        // Add README with instructions
        const readmeTemplateContent = await fs.readFile(
            path.join(templateDir, 'README.md.template'), 
            'utf8'
        );
        
        const readmeContent = readmeTemplateContent.replace(
            '{{NAMES_COUNT}}', 
            names.length.toString()
        );
        
        archive.append(readmeContent, { name: 'README.md' });
        
        // Finalize the archive
        await new Promise((resolve, reject) => {
            archive.finalize();
            archive.on('error', reject);
            output.on('end', resolve);
        });
        
        // Convert buffer to base64
        const buffer = Buffer.concat(streamBuffers);
        const base64data = buffer.toString('base64');
        
        // Create a data URL for the download
        const dataUrl = `data:application/zip;base64,${base64data}`;
        
        return {
            statusCode: 200,
            body: JSON.stringify({ 
                downloadUrl: dataUrl,
                message: 'Name tags package generated successfully' 
            })
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to generate name tags package' })
        };
    }
};
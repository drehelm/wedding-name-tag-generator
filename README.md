# Wedding Name Tag Generator

Create personalized drink clip name tags for weddings and events, using a simple web interface.

![Wedding Name Tag Generator](images/preview.png)

## Two Ways to Generate Name Tags

This project now offers two different methods for generating name tags:

### 1. Browser-Only Method (New!)

Generate STL files directly in your browser without installing any software:

- **✅ No software installation needed**
- **✅ Instant 3D preview**
- **✅ Direct STL download**
- **✅ Works on any modern browser**

Simply enter your names, preview the result, and download the ready-to-print STL files.

### 2. Traditional Method

Generate name tags using Python and OpenSCAD:

- **✅ More customization options**
- **✅ Better for large batches**
- **✅ Consistent results**
- **❗ Requires Python and OpenSCAD installation**

## How to Use the Browser-Only Method

1. Visit the [Browser Edition](browser-generator.html) page
2. Enter the names you want to create tags for
3. Click "Preview" to see a 3D preview of your name tag
4. Click "Validate Names" to check all names for errors
5. Click "Generate STL Files" to create and download the STL files
6. Print the downloaded STL files on your 3D printer

## How to Use the Traditional Method

1. Enter the names you want to create tags for
2. Click "Generate" to download a ZIP file containing:
   - `generateNames.py` - Python script to generate all name tags
   - `templatev2.scad` - OpenSCAD template file
   - `Clip1.svg` - Clip design
   - `README.md` - Instructions

3. Install required software:
   - [OpenSCAD](https://www.openscad.org/downloads.html)
   - [Python 3](https://www.python.org/downloads/)
   - [STIX Two Text Font](https://fonts.google.com/specimen/STIX+Two+Text)

4. Run the Python script to generate STL files:
   ```
   python generateNames.py
   ```

5. Print the generated STL files

## Technical Details

The browser-based generator uses:
- OpenJSCAD for 3D modeling
- Client-side JavaScript for STL generation
- WebGL for 3D preview

The traditional method uses:
- Python for name processing
- OpenSCAD for 3D modeling

## Requirements

### Browser Method
- Modern web browser with WebGL support
- Sufficient RAM for browser-based 3D operations

### Traditional Method
- OpenSCAD 2021.01 or later
- Python 3.6 or later
- STIX Two Text Font (Bold)

## Browser Compatibility

The browser-based generator has been tested with:
- Chrome 100+
- Firefox 100+
- Edge 100+
- Safari 15+

## Contributing

Contributions are welcome! See [DEVELOPMENT_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md) for details on how to contribute to this project.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

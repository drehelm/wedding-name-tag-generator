# 🍷 Wedding Drink Name Tag Generator

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Ready-brightgreen)](GITHUB_PAGES_DEPLOYMENT.md)
[![3D Printing](https://img.shields.io/badge/3D%20Printing-Ready-blue)](https://www.printables.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

<p align="center">
  <img src="https://via.placeholder.com/800x400?text=Wedding+Name+Tag+Example" alt="Name Tag Example" width="600"/>
</p>

## 🎯 Overview

Custom 3D printable name tags for wedding seat placements - easily generate dozens of personalized tags without manually editing each one! Perfect for weddings, parties, or any event where you need to label glasses.

## 🌟 New: Web Interface Available!

**Try the web interface** to create your name tags without editing any code!
- Simply enter names (one per line)
- Click "Generate"
- Download a ready-to-use package
- [Deploy to GitHub Pages](GITHUB_PAGES_DEPLOYMENT.md) to host your own copy

## 📖 The Story

> My sister is getting married and she asked me to make a bunch of name tags for seat placements. I saw the cool project by [@LarsPrintingSolution](https://www.printables.com/model/286409-individual-nametag-for-glasses-and-cups-wedding-de) however I wasn't going to manually make and edit dozens of names.
>
> So I made my very first OpenSCAD project... it combines an SVG I made and some rather manual shifting of the letters for a very specific font ("STIX Two Text") to come up with this model.
>
> And then I wrote a little Python script that goes and generates the whole list of names for me and outputs the STL's.
>
> A few hours of work to save me a couple hours of work? Worth it! 😂

## 🚀 Quick Start

### Option 1: Use the Web Interface (Easiest)
1. Visit the web interface (or [deploy your own](GITHUB_PAGES_DEPLOYMENT.md))
2. Enter names (one per line)
3. Download the ZIP file and follow the instructions

### Option 2: Manual Setup (Advanced)

#### ✅ Prerequisites

| Requirement | Download Link | Notes |
|-------------|---------------|-------|
| OpenSCAD | [Download](https://www.openscad.org/downloads.html) | For generating 3D models |
| Python 3 | [Download](https://www.python.org/downloads/) | Windows users: Check "Add Python to PATH" |
| STIX Two Text Font | [Download](https://fonts.google.com/specimen/STIX+Two+Text) | Required for text rendering |

#### 📁 Project Files

Download and place these files in a single folder:
- `generateNames.py` - Python script to generate STL files
- `templatev2.scad` - OpenSCAD template
- `Clip1.svg` - SVG clip design

#### 📋 Step-by-Step Instructions

1. **Install the Prerequisites** 
   - Install OpenSCAD, Python 3, and the STIX Two Text font

2. **Add Your Names**
   - Open `generateNames.py` in a text editor
   - Replace the example names with your own:
     ```python
     names = [ "JOHN", "JANE", "ALEX", "TAYLOR" ]
     ```
   - **Tip:** Names work best in ALL CAPS

3. **Test Your Setup**
   
   **Mac/Linux:**
   ```bash
   cd ~/path/to/folder
   python3 generateNames.py test
   ```
   
   **Windows:**
   ```bash
   cd C:\path\to\folder
   python generateNames.py test
   ```

4. **Generate Your Name Tags**
   
   **Mac/Linux:**
   ```bash
   python3 generateNames.py
   ```
   
   **Windows:**
   ```bash
   python generateNames.py
   ```

5. **Check Your Output**
   - STL files will be created in the `output_stls` folder
   - Each name will have its own STL file

## 🖨️ Printing Instructions

| Setting | Recommendation |
|---------|----------------|
| Material | PETG (more springy than PLA) |
| Scale | 70% (for standard wine glasses) |
| Infill | 30% |
| Layer Height | 0.2mm |
| Printer Used | Prusa MK4 |

I managed to fit about 12-16 tags on the bed at a time.

## 🛠️ Troubleshooting

| Problem | Solution |
|---------|----------|
| OpenSCAD not found | Verify it's installed. On Mac, check `/Applications/OpenSCAD.app` |
| Python not recognized | Reinstall Python 3 and ensure "Add Python to PATH" is selected (Windows) |
| Font not working | Ensure STIX Two Text is installed properly. Restart OpenSCAD if necessary |
| Permission denied | Try running the terminal as Administrator (Windows) or sudo (Mac/Linux) |

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Submit bug reports
- Suggest enhancements
- Create pull requests
- Share your customizations

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Inspired by [@LarsPrintingSolution](https://www.printables.com/model/286409-individual-nametag-for-glasses-and-cups-wedding-de)
- Original project by [@ahelmer](https://github.com/ahelmer)
- Web interface added in 2025

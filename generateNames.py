import subprocess
import os
import sys
import shutil
import tempfile
from pathlib import Path

# List of names to generate STL files for
names = [
    "THIS", "IS", "A", "LIST", "OF",
    "NAMES"
]

# Paths
template_path = Path("templatev2.scad").resolve()
output_dir = Path("output_stls").resolve()

def find_openscad():
    # Try default search
    executable = shutil.which("openscad")

    # Mac typical path
    if not executable and sys.platform == "darwin":
        mac_path = "/Applications/OpenSCAD.app/Contents/MacOS/OpenSCAD"
        if os.path.exists(mac_path):
            executable = mac_path

    # Windows: check for .exe explicitly if not found
    if not executable and sys.platform == "win32":
        possible_names = ["openscad.exe", "OpenSCAD.exe"]
        for name in possible_names:
            path = shutil.which(name)
            if path:
                executable = path
                break

    return executable

def test_setup(openscad_exe):
    print("Testing setup...")

    # Check OpenSCAD binary
    if not openscad_exe:
        print("Error: OpenSCAD executable not found. Ensure it's installed and in your PATH.")
        return False

    print(f"Using OpenSCAD at: {openscad_exe}")

    try:
        result = subprocess.run([openscad_exe, "-v"], capture_output=True, text=True)
        if result.returncode != 0:
            print(f"Error: OpenSCAD returned error code {result.returncode}.")
            return False
        print(f"OpenSCAD version info: {result.stdout.strip()}")
    except Exception as e:
        print(f"Error running OpenSCAD: {e}")
        return False

    # Check template file
    if not template_path.exists():
        print(f"Error: Template file '{template_path}' does not exist.")
        return False
    print(f"Template file found: {template_path}")

    # Check output directory
    try:
        output_dir.mkdir(parents=True, exist_ok=True)
        print(f"Output directory ready: {output_dir}")
    except Exception as e:
        print(f"Error creating output directory '{output_dir}': {e}")
        return False

    print("All tests passed.")
    return True

def generate_stls(openscad_exe):
    output_dir.mkdir(parents=True, exist_ok=True)

    with open(template_path, "r") as template_file:
        template_content = template_file.read()

    for name in names:
        modified_content = template_content.replace('name = "Your Text";', f'name = "{name}";')

        # Use a temporary file for the .scad
        with tempfile.NamedTemporaryFile(mode="w", suffix=".scad", delete=False) as temp_scad_file:
            temp_scad_file.write(modified_content)
            temp_scad_path = Path(temp_scad_file.name)

        output_stl_path = output_dir / f"{name}.stl"

        print(f"Generating STL for: {name}")
        try:
            subprocess.run(
                [openscad_exe, "-o", str(output_stl_path), str(temp_scad_path)],
                check=True
            )
            print(f"STL generated: {output_stl_path}")
        except subprocess.CalledProcessError as e:
            print(f"Error generating STL for '{name}': {e}")
        finally:
            try:
                temp_scad_path.unlink()  # Delete the temp file
            except Exception as e:
                print(f"Warning: Could not delete temporary file '{temp_scad_path}': {e}")

if __name__ == "__main__":
    openscad_exe = find_openscad()

    if len(sys.argv) > 1 and sys.argv[1] == "test":
        if not test_setup(openscad_exe):
            sys.exit(1)
    else:
        if not test_setup(openscad_exe):
            sys.exit(1)
        generate_stls(openscad_exe)

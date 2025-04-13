//Wedding Drink Name Tags Generator - OpenSCAD
//Find the original file on Printables by @ahelmer_1275429
//Must be used with Clip1.svg file
//Can be automated using the generateNames.py script included in the same project

// Parameters for the SVG dimensions (manually measured)
svg_width = 86;  // Replace with your SVG width
svg_height = 15; // Replace with your SVG height
svg_thickness = 4; // Thickness of the extruded SVG
name = "Your Text";
// Function to return approximate width multiplier for each character
function char_width(c) =
    (c == "I" || c == "i" || c == "l" || c == "1" || c == "J") ? 2.5 :
    (c == "W" || c == "M" || c == "H" || c == "K" || c == "O" || c == "D") ? 5 :3.5;

// Function to estimate text width
function estimate_text_width(text_content, size) =
    size * sum_chars(text_content);

// Helper function to sum character widths
function sum_chars(text_content) =
    let(n = len(text_content))
    sum_chars_loop(text_content, n);

// Recursive function to perform the sum
function sum_chars_loop(text_content, n, i = 0, acc = 0) =
    i == n ? acc : sum_chars_loop(text_content, n, i + 1, acc + char_width(text_content[i]));

// Import and extrude the SVG file, aligning it to the origin
module imported_svg() {
    translate([0, 0, 0])
        linear_extrude(height = svg_thickness)
            import("Clip1.svg"); // Removed ./ to make it look in current directory
}

// Add text with underline
module add_text_with_underline(text_content, size, thickness, x_offset, y_offset, underline_thickness, underline_margin) {
    // Text
    translate([x_offset, y_offset, 0]) // Position text above the SVG
        linear_extrude(height = thickness)
            text(text_content, size = size, valign = "top", halign = "left", font = "STIX Two Text:style=Bold");
    
    // Underline
    text_width = estimate_text_width(text_content, 5); // Estimate text width
    underline_length = text_width + (2 * underline_margin);
    translate([20, 12.4, 0])

        cube([underline_length, underline_thickness, thickness]);
}

// Combine the imported SVG with the text and underline
translate([0, 0, 0]) {
    imported_svg();
    //debug_cube(); // Debugging: Add a cube to verify the position

}

// Position the text and underline on the SVG
// Adjust the offsets to position the text correctly
font_size = 20;
text_thickness = 4;       // Thickness of the extruded text
underline_thickness = 3;  // Thickness of the underline
underline_margin = 4;     // Margin on either side of the underline
text_x_offset = svg_width/5;
text_y_offset = svg_height*2.19;

add_text_with_underline(name, font_size, text_thickness, text_x_offset, text_y_offset, underline_thickness, underline_margin);
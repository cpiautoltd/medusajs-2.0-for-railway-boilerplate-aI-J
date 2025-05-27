#!/usr/bin/env python3
"""
Simplified STEP to OBJ/STL conversion using FreeCAD command line
"""

import sys
import os
import subprocess
import time

def main():
    if len(sys.argv) != 3:
        print("Usage: python convert_step.py input.step output.obj")
        sys.exit(1)
    
    input_file = os.path.abspath(sys.argv[1])
    output_file = os.path.abspath(sys.argv[2])
    
    if not os.path.exists(input_file):
        print(f"Input file not found: {input_file}")
        return 1
    
    # Create a simple FreeCAD script
    script_content = f"""
import FreeCAD
import Part
import Mesh
import os

# Print FreeCAD version and working directory for debugging
print("FreeCAD version:", FreeCAD.Version)
print("Working directory:", os.getcwd())
print("Input file:", "{input_file}")
print("Output file:", "{output_file}")

# Create a new document
doc = FreeCAD.newDocument("Conversion")

# Import the STEP file
imported = Part.Shape()
try:
    print("Reading STEP file...")
    imported.read("{input_file}")
    print("STEP file read successfully")
except Exception as e:
    print("Error reading STEP file:", e)
    sys.exit(1)

# Add the shape to the document
print("Adding shape to document...")
Part.show(imported)
print("Shape added to document")

# Print objects in document
print("Objects in document:", len(doc.Objects))
for i, obj in enumerate(doc.Objects):
    print(f"Object {i}: {obj.Name}")

# Create a mesh from the shape
print("Creating mesh...")
mesh = Mesh.Mesh()
for obj in doc.Objects:
    if hasattr(obj, "Shape"):
        print(f"Meshing object: {{obj.Name}}")
        mesh.addFacets(obj.Shape.tessellate(0.1))

# Save the mesh to an output file
print("Saving mesh to:", "{output_file}")
mesh.write("{output_file}")
print("Saved mesh.")

# Verify the file was created
if os.path.exists("{output_file}"):
    print("Output file size:", os.path.getsize("{output_file}"))
    print("Conversion successful")
else:
    print("Error: Output file not created")
"""
    
    # Write the script to a file
    script_file = '/tmp/freecad_convert_step.py'
    with open(script_file, 'w') as f:
        f.write(script_content)
    
    # Try different FreeCAD command line approaches
    success = False
    
    # Approach 1: freecad --run script
    try:
        print("Approach 1: Using freecad --run")
        cmd = ['freecad', '--run', script_file]
        print("Running:", ' '.join(cmd))
        result = subprocess.run(cmd, capture_output=True, text=True)
        print("Return code:", result.returncode)
        print("STDOUT:", result.stdout)
        print("STDERR:", result.stderr)
        
        if os.path.exists(output_file):
            print("✅ Conversion successful with approach 1!")
            return 0
    except Exception as e:
        print(f"Error running approach 1: {e}")
    
    # Approach 2: freecad -c "exec(open('script').read())"
    try:
        print("\nApproach 2: Using freecad -c exec")
        cmd = ['freecad', '-c', f"exec(open('{script_file}').read())"]
        print("Running:", ' '.join(cmd))
        result = subprocess.run(cmd, capture_output=True, text=True)
        print("Return code:", result.returncode)
        print("STDOUT:", result.stdout)
        print("STDERR:", result.stderr)
        
        if os.path.exists(output_file):
            print("✅ Conversion successful with approach 2!")
            return 0
    except Exception as e:
        print(f"Error running approach 2: {e}")
    
    # Approach 3: Try writing a direct FreeCAD macro
    try:
        print("\nApproach 3: Using FreeCAD macro")
        macro_file = '/tmp/convert_step_macro.FCMacro'
        with open(macro_file, 'w') as f:
            f.write(script_content)
        
        cmd = ['freecad', macro_file]
        print("Running:", ' '.join(cmd))
        result = subprocess.run(cmd, capture_output=True, text=True)
        print("Return code:", result.returncode)
        print("STDOUT:", result.stdout)
        print("STDERR:", result.stderr)
        
        if os.path.exists(output_file):
            print("✅ Conversion successful with approach 3!")
            return 0
    except Exception as e:
        print(f"Error running approach 3: {e}")
    
    # Last resort: Try other FreeCAD variants
    try:
        print("\nTrying alternative FreeCAD commands")
        for freecad_cmd in ['FreeCAD', 'freecad-daily', '/usr/bin/freecad', '/usr/local/bin/freecad']:
            try:
                print(f"Trying: {freecad_cmd}")
                cmd = [freecad_cmd, '--run', script_file]
                result = subprocess.run(cmd, capture_output=True, text=True)
                print("Return code:", result.returncode)
                print("STDOUT:", result.stdout[:200] + "..." if len(result.stdout) > 200 else result.stdout)
                print("STDERR:", result.stderr[:200] + "..." if len(result.stderr) > 200 else result.stderr)
                
                if os.path.exists(output_file):
                    print(f"✅ Conversion successful with {freecad_cmd}!")
                    return 0
            except FileNotFoundError:
                print(f"{freecad_cmd} not found")
    except Exception as e:
        print(f"Error trying alternative commands: {e}")
    
    print("❌ All FreeCAD approaches failed.")
    return 1

if __name__ == "__main__":
    sys.exit(main())
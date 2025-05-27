#!/usr/bin/env python3
"""
Debugging script for FreeCAD conversion
"""

import sys
import os
import subprocess

def main():
    # Input and output paths
    input_file = "/app/source/8020-1001.step"
    output_file = "/app/intermediate/8020-1001.obj"
    
    # Create a simple FreeCAD script
    script_content = """#!/usr/bin/env python3
import sys
import os
import traceback

print("Python version:", sys.version)
print("Current working directory:", os.getcwd())

try:
    import FreeCAD
    print("FreeCAD version:", FreeCAD.Version)
except ImportError as e:
    print("Failed to import FreeCAD:", e)
    sys.exit(1)

try:
    import Part
    import Mesh
    print("Imported Part and Mesh modules")
except ImportError as e:
    print("Failed to import FreeCAD modules:", e)
    sys.exit(1)

input_file = "INPUTFILE"
output_file = "OUTPUTFILE"

print("Input file:", input_file)
print("Output file:", output_file)

try:
    # Create a new document
    doc = FreeCAD.newDocument("Conversion")
    print("Created document")
    
    # Import the STEP file
    shape = Part.Shape()
    shape.read(input_file)
    print("Read STEP file")
    
    # Add the shape to the document
    Part.show(shape)
    print("Added shape to document")
    
    # List objects
    print("Objects in document:", len(doc.Objects))
    for obj_idx, obj in enumerate(doc.Objects):
        print(f"Object {obj_idx}: {obj.Name}")
    
    # Create mesh
    mesh = Mesh.Mesh()
    for obj in doc.Objects:
        if hasattr(obj, "Shape"):
            print(f"Meshing {obj.Name}")
            mesh.addFacets(obj.Shape.tessellate(0.1))
    
    # Save mesh
    mesh.write(output_file)
    print("Saved mesh to", output_file)
    
    # Check file
    if os.path.exists(output_file):
        print("File exists, size:", os.path.getsize(output_file))
    else:
        print("Output file was not created!")
    
except Exception as e:
    print("Error:", e)
    traceback.print_exc()
"""
    
    # Replace placeholders
    script_content = script_content.replace("INPUTFILE", input_file)
    script_content = script_content.replace("OUTPUTFILE", output_file)
    
    # Write script to a file
    script_file = '/tmp/debug_freecad.py'
    with open(script_file, 'w') as f:
        f.write(script_content)
    
    # Make executable
    os.chmod(script_file, 0o755)
    
    # Try different ways to run FreeCAD
    commands = [
        ["freecad", "-c", script_file],
        ["freecad", "--run", script_file],
        ["freecad", script_file],
        ["/usr/bin/freecad", "-c", script_file]
    ]
    
    success = False
    for cmd in commands:
        try:
            print(f"\nTrying command: {' '.join(cmd)}")
            result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            print(f"Return code: {result.returncode}")
            print(f"STDOUT: {result.stdout}")
            print(f"STDERR: {result.stderr}")
            
            if os.path.exists(output_file):
                print(f"✅ Success! Created {output_file}")
                success = True
                break
        except Exception as e:
            print(f"Error running command: {e}")
    
    if not success:
        print("\nAll commands failed. Trying a direct Python approach...")
        try:
            # Create a direct Python script that doesn't rely on command-line args
            direct_script = f"""#!/usr/bin/env python3
import os
import sys
import FreeCAD
import Part
import Mesh

def convert():
    input_file = "{input_file}"
    output_file = "{output_file}"
    
    print("Starting conversion...")
    print("Input:", input_file)
    print("Output:", output_file)
    
    # Create document
    doc = FreeCAD.newDocument("Conversion")
    
    # Import STEP
    shape = Part.Shape()
    shape.read(input_file)
    
    # Show shape
    Part.show(shape)
    
    # Create mesh
    mesh = Mesh.Mesh()
    for obj in doc.Objects:
        if hasattr(obj, "Shape"):
            mesh.addFacets(obj.Shape.tessellate(0.1))
    
    # Write mesh
    mesh.write(output_file)
    print("Conversion done!")

if __name__ == "__main__":
    convert()
"""
            
            direct_script_file = '/tmp/direct_freecad.py'
            with open(direct_script_file, 'w') as f:
                f.write(direct_script)
            
            os.chmod(direct_script_file, 0o755)
            
            # Try running through Python directly
            print("Running through Python directly...")
            subprocess.run(["python3", direct_script_file], check=True)
            
            if os.path.exists(output_file):
                print(f"✅ Success! Created {output_file}")
                success = True
            else:
                print("❌ Failed to create output file.")
        except Exception as e:
            print(f"Error with direct Python approach: {e}")
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())
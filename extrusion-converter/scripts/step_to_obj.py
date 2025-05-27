#!/usr/bin/env python3

import sys
import os
import traceback

print("Python version:", sys.version)
print("Script arguments:", sys.argv)
print("Current working directory:", os.getcwd())

try:
    import FreeCAD
    print("FreeCAD imported successfully, version:", FreeCAD.Version)
except ImportError as e:
    print("Failed to import FreeCAD:", e)
    sys.exit(1)

try:
    import Mesh
    import Part
    print("Mesh and Part modules imported successfully")
except ImportError as e:
    print("Failed to import FreeCAD modules:", e)
    sys.exit(1)

def convert_step_to_obj(input_file, output_file):
    """Convert STEP file to OBJ using FreeCAD"""
    print(f"Converting {input_file} to {output_file}...")
    
    try:
        print("Checking if input file exists...")
        if not os.path.exists(input_file):
            print(f"Input file not found: {input_file}")
            return False
            
        print("Reading STEP file...")
        shape = Part.Shape()
        shape.read(input_file)
        
        print("Creating FreeCAD document...")
        doc = FreeCAD.newDocument("Conversion")
        
        print("Adding shape to document...")
        Part.show(shape)
        
        print("Getting document objects...")
        # Getting document objects...
        objs = doc.Objects
        print(f"Found {len(objs)} objects")
        
        print("Creating mesh...")
        mesh = Mesh.Mesh()
        mesh_count = 0
        for obj in objs:
            if hasattr(obj, "Shape"):
                print(f"Meshing object: {obj.Name}")
                mesh.addFacets(obj.Shape.tessellate(0.1))
                mesh_count += 1
        
        print(f"Meshed {mesh_count} objects")
        
        print(f"Writing mesh to OBJ: {output_file}")
        mesh.write(output_file)
        
        print(f"Checking if output file was created: {os.path.exists(output_file)}")
        if os.path.exists(output_file):
            print(f"Output file size: {os.path.getsize(output_file)} bytes")
        
        print(f"Conversion successful: {output_file}")
        return True
    
    except Exception as e:
        print(f"Error converting file: {e}")
        print("Traceback:")
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("Starting STEP to OBJ conversion script")
    
    if len(sys.argv) != 3:
        print("Usage: freecad -c step_to_obj.py input.step output.obj")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2]
    
    print(f"Input file: {input_file}")
    print(f"Output file: {output_file}")
    
    success = convert_step_to_obj(input_file, output_file)
    print(f"Conversion {'successful' if success else 'failed'}")
    sys.exit(0 if success else 1)
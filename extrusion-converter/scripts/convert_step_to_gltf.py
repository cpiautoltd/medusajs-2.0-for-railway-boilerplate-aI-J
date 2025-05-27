#!/usr/bin/env python3
"""
STEP to GLB/glTF Conversion Script for Extrusion Models

This script converts STEP files (typically from CAD software) into glTF/GLB format
for web-based 3D visualization. It's designed specifically for aluminum extrusion profiles
that need to be displayed at variable lengths.

Usage:
    blender --background --python convert_step_to_gltf.py -- INPUT_FILE OUTPUT_FILE METADATA_FILE [OPTIONS]

Options:
    --lod=low|medium|high    Detail level (default: medium)
    --unit=mm|inch           Input unit (default: inch)
    --center                 Center the model at origin
    --normalize              Normalize the model along X-axis (for extrusions)
    --compress               Apply Draco compression
"""

import bpy
import os
import sys
import json
import math
import argparse
from mathutils import Vector

# Get command line arguments after "--"
argv = sys.argv
argv = argv[argv.index("--") + 1:]

# Parse arguments
parser = argparse.ArgumentParser(description='Convert STEP files to glTF/GLB for extrusion models')
parser.add_argument('input_file', help='Input STEP or OBJ file path')
parser.add_argument('output_file', help='Output GLB file path')
parser.add_argument('metadata_file', help='Output metadata JSON file path')
parser.add_argument('--lod', choices=['low', 'medium', 'high'], default='medium', help='Level of detail')
parser.add_argument('--unit', choices=['mm', 'inch'], default='inch', help='Input unit')
parser.add_argument('--center', action='store_true', help='Center the model')
parser.add_argument('--normalize', action='store_true', help='Normalize extrusion along X axis')
parser.add_argument('--compress', action='store_true', help='Apply Draco compression')

args = parser.parse_args(argv)

# Clear default scene
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()

print(f"Converting {args.input_file}...")

# Import STEP or OBJ file
try:
    # Determine file type
    file_ext = os.path.splitext(args.input_file)[1].lower()
    
    if file_ext in ['.step', '.stp']:
        # Some versions of Blender use different import operators
        if hasattr(bpy.ops.import_mesh, 'step'):
            bpy.ops.import_mesh.step(filepath=args.input_file)
        elif hasattr(bpy.ops.import_scene, 'step'):
            bpy.ops.import_scene.step(filepath=args.input_file)
        else:
            print("Error: No STEP importer found in Blender")
            sys.exit(1)
    elif file_ext == '.obj':
        bpy.ops.import_scene.obj(filepath=args.input_file)
    else:
        print(f"Error: Unsupported file format: {file_ext}")
        sys.exit(1)
except Exception as e:
    print(f"Error importing file: {e}")
    sys.exit(1)

# Get all imported objects
if not bpy.context.selected_objects:
    print("Error: No objects were imported")
    sys.exit(1)

# Create a new collection for the extrusion
extrusion_collection = bpy.data.collections.new("Extrusion")
bpy.context.scene.collection.children.link(extrusion_collection)

# Join all objects if there are multiple parts
if len(bpy.context.selected_objects) > 1:
    bpy.ops.object.join()

# Get the main object
obj = bpy.context.selected_objects[0]

# Add to our collection
for old_collection in obj.users_collection:
    old_collection.objects.unlink(obj)
extrusion_collection.objects.link(obj)

# Apply scale and rotation transformations
bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)

# Calculate dimensions and bounding box
dimensions = obj.dimensions.copy()
bbox_corners = [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]
bbox_min = Vector(map(min, zip(*bbox_corners)))
bbox_max = Vector(map(max, zip(*bbox_corners)))

# Determine the extrusion axis (assume longest dimension is the extrusion axis)
axis_lengths = [dimensions.x, dimensions.y, dimensions.z]
extrusion_axis = axis_lengths.index(max(axis_lengths))
axis_names = ['x', 'y', 'z']
extrusion_axis_name = axis_names[extrusion_axis]

# Set origin to center of mass
bpy.ops.object.origin_set(type='ORIGIN_CENTER_OF_VOLUME')

# Normalize the model - align the extrusion axis with X-axis (for easier scaling in ThreeJS)
# Normalize the model - align the extrusion axis with X-axis (for easier scaling in ThreeJS)
if args.normalize:
    # First, center the object
    bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')
    
    # Use direct matrix manipulation instead of operators
    import mathutils
    
    # Now rotate to align with X-axis if needed
    if extrusion_axis == 1:  # Y is longest
        print("Rotating Y axis to align with X axis...")
        rot_mat = mathutils.Matrix.Rotation(math.pi/2, 4, 'Z')
        obj.matrix_world = obj.matrix_world @ rot_mat
    elif extrusion_axis == 2:  # Z is longest
        print("Rotating Z axis to align with X axis...")
        rot_mat = mathutils.Matrix.Rotation(math.pi/2, 4, 'Y')
        obj.matrix_world = obj.matrix_world @ rot_mat
    
    # Apply the rotation
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    
    try:
        # Try to apply the rotation through the operator
        bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)
    except Exception as e:
        print(f"Warning: Could not apply rotation through operator: {e}")
        print("Using alternative method...")
        # Alternative method: directly modify mesh data
        mesh = obj.data
        for v in mesh.vertices:
            v.co = obj.matrix_world @ v.co
        obj.matrix_world = mathutils.Matrix()
    
    # Recalculate dimensions after rotation
    dimensions = obj.dimensions.copy()
    extrusion_axis = 0  # Now X is the extrusion axis
    extrusion_axis_name = 'x'

# Calculate profile dimensions (perpendicular to extrusion axis)
profile_dimensions = {
    'width': dimensions.y,
    'height': dimensions.z
}

# Apply level of detail reduction
if args.lod != 'high':
    # Get the current mesh
    mesh = obj.data
    
    # Enable decimate modifier
    decimate = obj.modifiers.new(name="Decimate", type='DECIMATE')
    
    # Set reduction ratio based on LOD
    if args.lod == 'low':
        decimate.ratio = 0.3  # Aggressive reduction
    else:  # medium
        decimate.ratio = 0.7  # Moderate reduction
    
    # Apply the modifier
    bpy.ops.object.modifier_apply(modifier=decimate.name)

# Calculate the unit scale factor
unit_scale = 1.0
if args.unit == 'mm':
    unit_scale = 0.0393701  # mm to inch

# Prepare metadata
model_id = os.path.splitext(os.path.basename(args.input_file))[0]
metadata = {
    "id": model_id,
    "name": model_id.replace('-', ' ').title(),
    "profileType": "custom",  # Can be refined based on analysis
    "dimensions": {
        "width": dimensions.y * unit_scale,
        "height": dimensions.z * unit_scale,
        "baseLength": dimensions.x * unit_scale,
    },
    "boundingBox": {
        "min": [bbox_min.x * unit_scale, bbox_min.y * unit_scale, bbox_min.z * unit_scale],
        "max": [bbox_max.x * unit_scale, bbox_max.y * unit_scale, bbox_max.z * unit_scale]
    },
    "center": [obj.location.x * unit_scale, obj.location.y * unit_scale, obj.location.z * unit_scale],
    "extrusionAxis": extrusion_axis_name,
    "material": "aluminum",
    "supportsTapping": True,
    "modelFile": os.path.basename(args.output_file),
    "lod": args.lod,
    "fileSize": 0  # Will be updated after export
}

# Create a simple metallic material
if "Aluminum" not in bpy.data.materials:
    mat = bpy.data.materials.new(name="Aluminum")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    
    # Clear default nodes
    for node in nodes:
        nodes.remove(node)
    
    # Create PBR nodes
    output = nodes.new(type='ShaderNodeOutputMaterial')
    principled = nodes.new(type='ShaderNodeBsdfPrincipled')
    
    # Connect nodes
    mat.node_tree.links.new(principled.outputs[0], output.inputs[0])
    
    # Set material properties for aluminum
    principled.inputs['Base Color'].default_value = (0.91, 0.91, 0.91, 1.0)
    principled.inputs['Metallic'].default_value = 0.9
    principled.inputs['Roughness'].default_value = 0.2
    principled.inputs['Specular'].default_value = 0.5
    
    # Assign material to object
    if obj.data.materials:
        obj.data.materials[0] = mat
    else:
        obj.data.materials.append(mat)

# Export as GLB
export_options = {
    'filepath': args.output_file,
    'check_existing': False,
    'export_format': 'GLB',
    'use_selection': True
}

if args.compress:
    export_options['export_draco_mesh_compression_enable'] = True
    export_options['export_draco_mesh_compression_level'] = 6

try:
    bpy.ops.export_scene.gltf(**export_options)
    print(f"Successfully exported to {args.output_file}")
    
    # Update file size in metadata
    if os.path.exists(args.output_file):
        metadata["fileSize"] = os.path.getsize(args.output_file)
    
    # Write metadata
    with open(args.metadata_file, 'w') as f:
        json.dump(metadata, f, indent=2)
    print(f"Metadata written to {args.metadata_file}")
    
except Exception as e:
    print(f"Error exporting GLB: {e}")
    sys.exit(1)

print("Conversion completed successfully!")
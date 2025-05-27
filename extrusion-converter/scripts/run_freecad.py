#!/usr/bin/env python3
"""
FreeCAD STEP to OBJ conversion script
"""

import sys
import os
import subprocess

def main():
    if len(sys.argv) != 3:
        print("Usage: python run_freecad.py input.step output.obj")
        sys.exit(1)
    
    input_file = os.path.abspath(sys.argv[1])
    output_file = os.path.abspath(sys.argv[2])
    
    print(f"Absolute input path: {input_file}")
    print(f"Absolute output path: {output_file}")
    
    script_dir = os.path.dirname(os.path.abspath(__file__))
    step_to_obj_script = os.path.join(script_dir, 'step_to_obj.py')
    
    # Create a simple FreeCAD macro that calls our step_to_obj function
    macro_content = f"""
import sys
sys.path.append('{script_dir}')
import os
os.chdir('{os.path.dirname(script_dir)}')  # Change to app root dir
print("Working directory changed to:", os.getcwd())

from step_to_obj import convert_step_to_obj
success = convert_step_to_obj('{input_file}', '{output_file}')
print("Conversion result:", success)
"""
    
    # Write the macro to a temporary file
    macro_file = '/tmp/step_to_obj_macro.FCMacro'
    with open(macro_file, 'w') as f:
        f.write(macro_content)
    
    # Run FreeCAD with the macro
    for freecad_cmd in ['freecad', 'FreeCAD', 'freecad-daily']:
        try:
            print(f"Trying FreeCAD command: {freecad_cmd}")
            result = subprocess.run([freecad_cmd, macro_file], 
                                    stdout=subprocess.PIPE, 
                                    stderr=subprocess.PIPE,
                                    text=True)
            print("STDOUT:", result.stdout)
            print("STDERR:", result.stderr)
            
            if os.path.exists(output_file):
                print(f"✅ Conversion successful! Output file: {output_file}")
                return 0
            else:
                print(f"❌ Conversion failed. Output file not created.")
        except FileNotFoundError:
            print(f"{freecad_cmd} not found, trying next command...")
            continue
    
    print("❌ All FreeCAD commands failed.")
    return 1

if __name__ == "__main__":
    sys.exit(main())
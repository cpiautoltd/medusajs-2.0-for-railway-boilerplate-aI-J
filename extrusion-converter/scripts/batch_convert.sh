#!/bin/bash
#!/bin/bash

# Configuration
SOURCE_DIR="./source"
INTERMEDIATE_DIR="./intermediate"
PROCESSED_DIR="./processed"
METADATA_DIR="./metadata"
CATALOG_FILE="./processed/catalog.json"
BLENDER_PATH="blender"
SCRIPT_PATH="./scripts/convert_step_to_gltf.py"

# LOD settings
LOD_LEVELS=("low" "medium" "high")
DEFAULT_LOD="medium"

# Create directories if they don't exist
mkdir -p "$INTERMEDIATE_DIR"
mkdir -p "$PROCESSED_DIR/low"
mkdir -p "$PROCESSED_DIR/medium"
mkdir -p "$PROCESSED_DIR/high"
mkdir -p "$METADATA_DIR"

# Convert all STEP files
echo "Looking for STEP files in $SOURCE_DIR..."
STEP_FILES=$(find "$SOURCE_DIR" -type f -iname "*.step" -o -iname "*.stp")
FILE_COUNT=$(echo "$STEP_FILES" | wc -l)

if [ -z "$STEP_FILES" ]; then
    echo "No STEP files found in $SOURCE_DIR"
    exit 1
fi

echo "Found $FILE_COUNT STEP files to process."

# Process each file
COUNT=0
for STEP_FILE in $STEP_FILES; do
    COUNT=$((COUNT + 1))
    FILENAME=$(basename "$STEP_FILE")
    MODEL_ID="${FILENAME%.*}"
    
    echo "[$COUNT/$FILE_COUNT] Processing $MODEL_ID..."
    
    # Convert STEP to OBJ first using FreeCAD
    OBJ_FILE="$INTERMEDIATE_DIR/$MODEL_ID.obj"
    echo "  - Converting STEP to OBJ..."
    echo "Running debugging script..."
    python3 ./scripts/debug_freecad.py
    
    if [ ! -f "$OBJ_FILE" ]; then
        echo "  ❌ Failed to convert $MODEL_ID from STEP to OBJ"
        continue
    fi
    
    # Process each LOD level
    for LOD in "${LOD_LEVELS[@]}"; do
        echo "  - Converting at $LOD detail level..."
        OUTPUT_FILE="$PROCESSED_DIR/$LOD/$MODEL_ID.glb"
        METADATA_FILE="$METADATA_DIR/${MODEL_ID}_${LOD}.json"
        
        # Run Blender conversion
        "$BLENDER_PATH" --background --python "$SCRIPT_PATH" -- \
            "$OBJ_FILE" \
            "$OUTPUT_FILE" \
            "$METADATA_FILE" \
            --lod="$LOD" \
            --unit="inch" \
            --normalize \
            --center \
            --compress
        
        # Check if conversion was successful
        if [ ! -f "$OUTPUT_FILE" ]; then
            echo "  ❌ Failed to convert $MODEL_ID to $LOD detail level"
        else
            echo "  ✅ Successfully created $OUTPUT_FILE ($(du -h "$OUTPUT_FILE" | cut -f1))"
        fi
    done
    
    # Generate catalog file
    echo "Generating catalog file..."
    echo "{" > "$CATALOG_FILE"
    echo "  \"models\": [" >> "$CATALOG_FILE"

    # Find all unique model IDs from metadata files
    MODELS=$(find "$METADATA_DIR" -name "*.json" | sed -E 's/.*\/([^_]+)_.+\.json/\1/' | sort | uniq)
    echo "Found models: $MODELS"

    FIRST=true
    for MODEL_ID in $MODELS; do
        # Use the medium LOD metadata for the catalog (or any LOD if medium doesn't exist)
        METADATA_FILE="$METADATA_DIR/${MODEL_ID}_medium.json"
        if [ ! -f "$METADATA_FILE" ]; then
            METADATA_FILE="$METADATA_DIR/${MODEL_ID}_high.json"
        fi
        if [ ! -f "$METADATA_FILE" ]; then
            METADATA_FILE="$METADATA_DIR/${MODEL_ID}_low.json"
        fi
        
        if [ -f "$METADATA_FILE" ]; then
            echo "Adding model $MODEL_ID to catalog using $METADATA_FILE"
            if [ "$FIRST" = true ]; then
                FIRST=false
            else
                echo "," >> "$CATALOG_FILE"
            fi
            cat "$METADATA_FILE" | sed 's/^/    /' >> "$CATALOG_FILE"
        else
            echo "Warning: No metadata file found for model $MODEL_ID"
        fi
    done

    echo "" >> "$CATALOG_FILE"
    echo "  ]" >> "$CATALOG_FILE"
    echo "}" >> "$CATALOG_FILE"

    echo "Catalog generated at $CATALOG_FILE"
    echo "Summary:"
    echo "  - Total models processed: $COUNT"
    echo "  - Models available at: $PROCESSED_DIR"
    echo "  - Metadata available at: $METADATA_DIR"
    echo ""
    
    echo "  ✅ Finished processing $MODEL_ID"
    echo ""
done
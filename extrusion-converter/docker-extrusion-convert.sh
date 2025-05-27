#!/bin/bash
# docker-extrusion-convert.sh
# Helper script for running the Docker-based conversion pipeline

# Default settings
IMAGE_NAME="extrusion-converter"
CONTAINER_NAME="extrusion-converter-container"
HOST_DIR="$(pwd)"

# Display help
show_help() {
    echo "STEP to glTF Conversion Tool for Extrusions"
    echo ""
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  build             Build the Docker image"
    echo "  convert           Convert STEP files in the source directory"
    echo "  clean             Remove temporary files and containers"
    echo "  help              Show this help message"
    echo ""
    echo "Options:"
    echo "  --dir=PATH        Set the host directory (default: $HOST_DIR)"
    echo "  --image=NAME      Set the Docker image name (default: $IMAGE_NAME)"
    echo "  --force           Force rebuild of Docker image (for build command)"
    echo ""
    echo "Examples:"
    echo "  $0 build                   # Build the Docker image"
    echo "  $0 convert                 # Convert all STEP files in source directory"
    echo "  $0 convert --dir=/data     # Specify a different directory"
    echo ""
}

# Parse command line arguments
COMMAND=""
FORCE_REBUILD=false
for arg in "$@"; do
    case $arg in
        build|convert|clean|help)
            COMMAND="$arg"
            ;;
        --dir=*)
            HOST_DIR="${arg#*=}"
            ;;
        --image=*)
            IMAGE_NAME="${arg#*=}"
            ;;
        --force)
            FORCE_REBUILD=true
            ;;
        *)
            # Unknown option
            ;;
    esac
done

# If no command provided, show help
if [ -z "$COMMAND" ]; then
    show_help
    exit 1
fi

# Execute command
case $COMMAND in
    build)
        echo "Building Docker image: $IMAGE_NAME..."
        
        # Force rebuild if requested
        if [ "$FORCE_REBUILD" = true ]; then
            echo "Forcing rebuild of Docker image..."
            docker rmi -f "$IMAGE_NAME" >/dev/null 2>&1 || true
            BUILD_ARGS="--no-cache"
        else
            BUILD_ARGS=""
        fi
        
        # Create the directory structure if it doesn't exist
        mkdir -p "$HOST_DIR"/{source,intermediate,processed/{low,medium,high},metadata,scripts}
        
        # Copy the scripts to the host directory if they exist in the current directory
        if [ -f "$(dirname "$0")/scripts/convert_step_to_gltf.py" ]; then
            cp "$(dirname "$0")/scripts/convert_step_to_gltf.py" "$HOST_DIR/scripts/"
        fi
        
        if [ -f "$(dirname "$0")/scripts/batch_convert.sh" ]; then
            cp "$(dirname "$0")/scripts/batch_convert.sh" "$HOST_DIR/scripts/"
        fi
        
        if [ -f "$(dirname "$0")/scripts/convert_step.py" ]; then
            cp "$(dirname "$0")/scripts/convert_step.py" "$HOST_DIR/scripts/"
        fi
        
        # Build the Docker image
        docker build $BUILD_ARGS -t "$IMAGE_NAME" -f "$HOST_DIR/Dockerfile" "$HOST_DIR"
        
        if [ $? -eq 0 ]; then
            echo "✅ Docker image built successfully: $IMAGE_NAME"
            echo "You can now run conversions with: $0 convert"
        else
            echo "❌ Failed to build Docker image"
            exit 1
        fi
        ;;
        
    convert)
        echo "Converting STEP files in $HOST_DIR/source..."
        
        # Check if the image exists
        if ! docker image inspect "$IMAGE_NAME" >/dev/null 2>&1; then
            echo "❌ Docker image not found: $IMAGE_NAME"
            echo "Build the image first: $0 build"
            exit 1
        fi
        
        # Check if source directory contains any STEP files
        if [ ! "$(find "$HOST_DIR/source" -type f -iname "*.step" -o -iname "*.stp" 2>/dev/null)" ]; then
            echo "❌ No STEP files found in $HOST_DIR/source"
            echo "Please add your STEP files to $HOST_DIR/source and try again"
            exit 1
        fi
        
        # Run the container
        docker run --rm \
            --name "$CONTAINER_NAME" \
            -v "$HOST_DIR/source:/app/source" \
            -v "$HOST_DIR/intermediate:/app/intermediate" \
            -v "$HOST_DIR/processed:/app/processed" \
            -v "$HOST_DIR/metadata:/app/metadata" \
            -v "$HOST_DIR/scripts:/app/scripts" \
            "$IMAGE_NAME"
        
        if [ $? -eq 0 ]; then
            echo "✅ Conversion completed successfully"
            echo "Output files are available in $HOST_DIR/processed"
            echo "Metadata files are available in $HOST_DIR/metadata"
            echo "Catalog file: $HOST_DIR/processed/catalog.json"
        else
            echo "❌ Conversion failed"
            exit 1
        fi
        ;;
        
    clean)
        echo "Cleaning up..."
        
        # Remove the container if it exists
        if docker ps -a --format '{{.Names}}' | grep -q "^$CONTAINER_NAME$"; then
            docker rm -f "$CONTAINER_NAME"
        fi
        
        # Remove intermediate files
        rm -rf "$HOST_DIR/intermediate"/*
        
        echo "✅ Cleanup completed"
        ;;
        
    help)
        show_help
        ;;
        
    *)
        show_help
        exit 1
        ;;
esac

exit 0
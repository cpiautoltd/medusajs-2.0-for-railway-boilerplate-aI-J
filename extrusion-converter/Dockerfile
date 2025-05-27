FROM ubuntu:22.04

# Set environment variables
ENV DEBIAN_FRONTEND=noninteractive

# Install required packages
RUN apt-get update && apt-get install -y \
    blender \
    freecad \
    python3-pip \
    python3-numpy \
    nodejs \
    npm \
    wget \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js packages
RUN npm install -g gltf-pipeline

# Install Python dependencies
RUN pip3 install trimesh scipy matplotlib

# Create working directories
RUN mkdir -p /app/source \
    /app/intermediate \
    /app/processed/low \
    /app/processed/medium \
    /app/processed/high \
    /app/metadata \
    /app/scripts

# Copy scripts
COPY scripts/convert_step_to_gltf.py /app/scripts/
COPY scripts/batch_convert.sh /app/scripts/
COPY scripts/convert_step.py /app/scripts/
COPY scripts/debug_freecad.py /app/scripts/

# Make scripts executable
RUN chmod +x /app/scripts/batch_convert.sh

# Set working directory
WORKDIR /app

# Entrypoint
ENTRYPOINT ["/app/scripts/batch_convert.sh"]
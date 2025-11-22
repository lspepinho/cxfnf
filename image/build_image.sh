#!/bin/bash
set -e

# Configuration
IMAGE_NAME="cheerpx-fnf-alpine"
CONTAINER_NAME="cheerpx-container"
FS_DIR="cheerpXFS"
EXT2_IMAGE_NAME="cheerpXImage.ext2"
IMAGE_SIZE="600M" # Adjust size as needed

# 1. Build the container image
echo "Building container image..."
buildah build -f Dockerfile --dns=none --platform linux/i386 -t ${IMAGE_NAME} .

# 2. Create a container from the image
echo "Creating container..."
# Remove existing container if it exists
podman rm ${CONTAINER_NAME} >/dev/null 2>&1 || true
podman create --name ${CONTAINER_NAME} ${IMAGE_NAME}

# 3. Copy the filesystem from the container
echo "Copying filesystem..."
rm -rf ${FS_DIR}
mkdir ${FS_DIR}
podman unshare podman cp ${CONTAINER_NAME}:/ ${FS_DIR}/

# 4. Create an ext2 image from the directory
echo "Creating ext2 image..."
rm -f ../${EXT2_IMAGE_NAME}
podman unshare mkfs.ext2 -b 4096 -d ${FS_DIR}/ ../${EXT2_IMAGE_NAME} ${IMAGE_SIZE}

# 5. Clean up
echo "Cleaning up..."
podman rm ${CONTAINER_NAME}
buildah rmi ${IMAGE_NAME}
rm -rf ${FS_DIR}

echo "Done! Image '${EXT2_IMAGE_NAME}' created successfully in the root directory."

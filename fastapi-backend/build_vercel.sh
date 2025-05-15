#!/bin/bash
set -e

echo "Starting custom build script for Vercel deployment..."

# Create a requirements-slim.txt file with minimal dependencies
cat > requirements-slim.txt << EOL
fastapi==0.104.1
uvicorn==0.24.0
pydantic==2.4.2
pydantic-settings==2.0.3
firebase-admin==6.2.0
google-generativeai==0.3.1
email-validator==2.1.0
requests==2.31.0
EOL

# Install the minimal dependencies
echo "Installing minimal dependencies..."
pip install -r requirements-slim.txt --no-cache-dir

# Install only the necessary parts of langchain
echo "Installing minimal langchain components..."
pip install langchain-core==0.1.15 --no-cache-dir
pip install langchain-google-genai==0.0.5 --no-cache-dir

# Clean up unnecessary files to reduce size
echo "Cleaning up unnecessary files..."
find . -type d -name "__pycache__" -exec rm -rf {} +
find . -type d -name "*.dist-info" -exec rm -rf {} +
find . -type d -name "*.egg-info" -exec rm -rf {} +
find . -type f -name "*.pyc" -delete
find . -type f -name "*.pyo" -delete
find . -type f -name "*.pyd" -delete

# Remove test files from installed packages
find /vercel/path0/.python_packages/lib -type d -name "tests" -exec rm -rf {} +
find /vercel/path0/.python_packages/lib -type d -name "test" -exec rm -rf {} +

# Remove documentation
find /vercel/path0/.python_packages/lib -type d -name "docs" -exec rm -rf {} +
find /vercel/path0/.python_packages/lib -type d -name "doc" -exec rm -rf {} +

# Remove unnecessary Firebase Admin SDK components to reduce size
echo "Optimizing Firebase Admin SDK size..."
rm -rf /vercel/path0/.python_packages/lib/python*/site-packages/google/cloud/firestore_v1/proto
rm -rf /vercel/path0/.python_packages/lib/python*/site-packages/google/cloud/storage
rm -rf /vercel/path0/.python_packages/lib/python*/site-packages/google/cloud/bigquery
rm -rf /vercel/path0/.python_packages/lib/python*/site-packages/google/cloud/datastore
rm -rf /vercel/path0/.python_packages/lib/python*/site-packages/google/cloud/pubsub
rm -rf /vercel/path0/.python_packages/lib/python*/site-packages/google/cloud/vision

# Remove unnecessary Google API components
echo "Optimizing Google API components size..."
rm -rf /vercel/path0/.python_packages/lib/python*/site-packages/googleapiclient/discovery_cache

# Remove unnecessary protobuf files
echo "Optimizing protobuf size..."
find /vercel/path0/.python_packages/lib -name "*.proto" -delete

echo "Custom build completed successfully!"

#!/bin/bash

# Setup script for local schedule processing

echo "Setting up local schedule processor..."

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r requirements-local.txt

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cat > .env << EOF
# Supabase Configuration
SUPABASE_URL=your_supabase_url_here
SUPABASE_KEY=your_supabase_service_role_key_here

# Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here
EOF
    echo "Please edit .env file with your actual credentials"
else
    echo ".env file already exists"
fi

echo "Setup complete!"
echo ""
echo "To use:"
echo "1. Edit .env file with your credentials"
echo "2. For web processing: python local-server.py"
echo "3. For command line: python local-schedule-processor.py your-image.jpg"

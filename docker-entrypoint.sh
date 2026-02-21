#!/bin/sh
# Inject environment variables into the React app at runtime

echo "Injecting runtime environment variables..."

# Default fallback if not provided
API_URL=${VITE_API_URL:-"/api"}

# Replace the placeholder in the compiled JS files
# We will instruct Vite to output a specific placeholder during build, e.g., __RUNTIME_VITE_API_URL__
find /usr/share/nginx/html -type f -name "*.js" -exec sed -i "s|__RUNTIME_VITE_API_URL__|$API_URL|g" {} +

echo "Starting Nginx..."
exec "$@"

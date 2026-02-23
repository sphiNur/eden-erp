# ============================================================
# Monolith Dockerfile (for Koyeb single-container deployment)
# Builds React frontend → serves via FastAPI static files
# Usage: docker build -t eden-erp .
# ============================================================

# === Stage 1: Build React Frontend ===
FROM node:18-alpine AS frontend-builder
WORKDIR /app/web

COPY web/package*.json ./
RUN npm install

COPY web/ .
RUN npm run build


# === Stage 2: Production Backend + Static Frontend ===
FROM python:3.11-slim

# Create non-root user (Koyeb security best practice)
RUN useradd -m -u 1000 user
USER user
ENV PATH="/home/user/.local/bin:$PATH"

WORKDIR /app

# Install Python dependencies
COPY --chown=user requirements.txt .
RUN pip install --no-cache-dir --upgrade -r requirements.txt

# Copy backend code
COPY --chown=user app/ ./app/

# Copy built React frontend from Stage 1
COPY --chown=user --from=frontend-builder /app/web/dist ./web/dist

# Runtime config
ENV PORT=8000
EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

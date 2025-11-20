# ---- Base ----
FROM node:20-alpine

# ---- Create app directory ----
WORKDIR /app

# ---- Copy dependency manifests ----
COPY package*.json ./

# ---- Install dependencies ----
# If a lock file exists we use 'npm ci' for a reproducible build;
# otherwise fall back to 'npm install'.
RUN if [ -f package-lock.json ]; then \
        npm ci --omit=dev; \
    else \
        npm install --omit=dev; \
    fi

# ---- Copy source code ----
COPY . .

# ---- Expose port (change if your app listens on another) ----
EXPOSE 3000

# ---- Start the application ----
CMD ["node", "index.js"]   # <-- replace 'index.js' with your actual entry file

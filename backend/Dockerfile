FROM public.ecr.aws/lambda/nodejs:18

# Set working directory
WORKDIR ${LAMBDA_TASK_ROOT}

# Copy package files first (for better caching)
COPY package*.json ./

# Increase npm timeouts and install with more memory
RUN npm config set fetch-timeout 600000 && \
    npm config set fetch-retry-mintimeout 10000 && \
    npm config set fetch-retry-maxtimeout 60000 && \
    NODE_OPTIONS="--max-old-space-size=4096" npm ci --omit=dev --no-audit --no-fund

# Copy application source
COPY src/ src/
COPY *.js ./

# Set the CMD to your handler
CMD ["src/server-simple.handler"]

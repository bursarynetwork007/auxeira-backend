FROM public.ecr.aws/lambda/nodejs:18

# Set working directory
WORKDIR ${LAMBDA_TASK_ROOT}

# Configure npm for better reliability with large packages
RUN npm config set fetch-timeout 600000 && \
    npm config set fetch-retry-mintimeout 10000 && \
    npm config set fetch-retry-maxtimeout 60000 && \
    npm config set maxsockets 5

# Copy package files first (for better Docker layer caching)
COPY package*.json ./

# Install dependencies with increased memory and timeouts
RUN NODE_OPTIONS="--max-old-space-size=6144" npm ci --omit=dev --no-audit --no-fund --ignore-scripts

# Copy application source code
COPY src/ src/
COPY *.js ./

# Set the handler
CMD ["src/server-simple.handler"]

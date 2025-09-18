FROM public.ecr.aws/lambda/nodejs:18

WORKDIR ${LAMBDA_TASK_ROOT}

# Copy package files
COPY package*.json ./

# Install lighter dependencies (no Solana)
RUN npm ci --omit=dev --no-audit --no-fund

# Copy application code
COPY src/ src/
COPY *.js ./

CMD ["src/server-simple.handler"]

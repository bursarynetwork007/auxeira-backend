# Build stage with more memory
FROM node:18-alpine AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies including Solana
RUN npm ci --omit=dev --ignore-scripts

# Runtime stage  
FROM public.ecr.aws/lambda/nodejs:18
COPY --from=builder /app/node_modules ${LAMBDA_TASK_ROOT}/node_modules
COPY --from=builder /app/package*.json ${LAMBDA_TASK_ROOT}/
COPY src/ ${LAMBDA_TASK_ROOT}/src/
COPY *.js ${LAMBDA_TASK_ROOT}/

CMD ["src/server-simple.handler"]

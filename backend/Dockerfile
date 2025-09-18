FROM public.ecr.aws/lambda/nodejs:18

WORKDIR ${LAMBDA_TASK_ROOT}

# Copy and install lightweight dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy application code
COPY src/ src/
COPY *.js ./

CMD ["src/server-simple.handler"]

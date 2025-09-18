FROM public.ecr.aws/lambda/nodejs:18

# Copy package files
COPY package*.json ./

# Install dependencies  
RUN npm install --omit=dev --ignore-scripts

# Copy application code
COPY . ./

# Set the handler
CMD ["src/server-simple.handler"]

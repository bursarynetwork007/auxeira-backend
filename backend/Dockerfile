FROM public.ecr.aws/lambda/node:18

# Copy package files
COPY package*.json ./

# Install dependencies (AWS will handle the heavy lifting)
RUN npm install --omit=dev --ignore-scripts

# Copy application code
COPY . ./

# Set the handler
CMD ["src/server-simple.handler"]

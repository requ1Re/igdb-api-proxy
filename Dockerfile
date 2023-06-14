# Step 1
FROM --platform=$TARGETPLATFORM node:18-slim
LABEL org.opencontainers.image.source="https://github.com/requ1Re/igdb-api-proxy"

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package*.json ./

RUN npm install

ADD . .
RUN npm run build

# Step 2
FROM --platform=$TARGETPLATFORM node:18-slim

WORKDIR /app

COPY package*.json ./

RUN npm install --omit=dev

COPY --from=0 /app/dist .

EXPOSE 80
CMD ["node","index.js"]
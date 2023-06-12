FROM --platform=$TARGETPLATFORM node:18-slim
LABEL org.opencontainers.image.source="https://github.com/requ1Re/igdb-api-proxy"

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package*.json ./

RUN npm install

ADD . .
RUN npm run build

FROM --platform=$TARGETPLATFORM node:18-slim
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=0 /app/dist .
RUN npm install pm2 -g
EXPOSE 80
CMD ["pm2-runtime","index.js"]
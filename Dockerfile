FROM --platform=$TARGETPLATFORM node:18-slim
LABEL org.opencontainers.image.source="https://github.com/requ1Re/igdb-api-proxy"

# Create app directory
WORKDIR /app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm ci --omit=dev

# Bundle app source
ADD . .
RUN npm run build

FROM node:12.17.0-alpine
WORKDIR /usr
COPY package.json ./
RUN npm install --only=production
COPY --from=0 /usr/dist .
RUN npm install pm2 -g
EXPOSE 80
CMD ["pm2-runtime","index.js"]
FROM node:22-alpine

RUN apk add --no-cache postgresql-client

WORKDIR /app

COPY backend/package*.json ./
RUN npm install --omit=dev

COPY backend/src ./src
COPY backend/scripts ./scripts
COPY database ./database
COPY backend/docker-entrypoint.sh ./docker-entrypoint.sh

RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 5055

ENTRYPOINT ["/app/docker-entrypoint.sh"]

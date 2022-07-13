FROM node:18-alpine as BUILD

ENV NODE_ENV build

# USER node
WORKDIR /build

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build \
    && npm prune --production

RUN npx prisma generate

FROM node:16-alpine

ENV NODE_ENV production

# USER node
WORKDIR /app

COPY --from=BUILD /build/package*.json ./
COPY --from=BUILD /build/node_modules/ ./node_modules/
COPY --from=BUILD /build/dist/ ./dist/
COPY --from=BUILD /build/prisma/ ./prisma/

CMD ["node", "dist/main.js"]
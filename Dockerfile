FROM node:13-alpine

RUN npm i -g nodemon

USER node

RUN mkdir /home/node/code

WORKDIR /home/node/code

COPY --chown=node:node package-lock.json package.json ./

RUN npm ci --only=production

COPY --chown=node:node ./dist/server .

CMD ["node", "index.js"]

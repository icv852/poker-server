

# start node:18.14-buster-slim
FROM node:18.14-buster-slim

ENV PORT 5000

# copy file into container
COPY . /app

# cd /app
WORKDIR /app

# run npm install
RUN npm install

# run node server.js (at runtime)
CMD ["node", "server.js"] 
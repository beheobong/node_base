FROM node:lts as builder

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package.json /app
RUN npm install --production --unsafe

# Bundle app source
COPY . /app

FROM node:lts-alpine
RUN npm install --global pm2

# Add user so we dont run our app as root
# RUN groupadd -r node && useradd -r -g node node \
#     && mkdir -p /home/node/app \
RUN mkdir -p /home/node/app \
    && chown -R node:node /home/node \
    && mkdir -p /home/node/app/upload \
    && chmod 770 /home/node/app/upload
    # && mkdir /tmp/media \
    # && chown -R node:node /tmp/media

WORKDIR /home/node/app
COPY --from=builder /app .

USER node
EXPOSE 3000

CMD ["pm2-docker", "--raw", "process.yml"]
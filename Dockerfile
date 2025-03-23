# Use a base Node.js image
FROM node:20-alpine

# Set environment variables
ENV HOMEBRIDGE_USER /homebridge
ENV PATH $HOMEBRIDGE_USER/node_modules/.bin:$PATH
ENV PLUGIN_ID homebridge-plugin-warmup

# Install necessary dependencies
RUN apk add --no-cache \
  avahi \
  dbus \
  git \
  make \
  g++ \
  python3

# Create a directory for Homebridge and set permissions
RUN mkdir -p $HOMEBRIDGE_USER && chown -R node:node $HOMEBRIDGE_USER
WORKDIR $HOMEBRIDGE_USER

# Clone Homebridge branch
# USER node
RUN git clone --depth 1 https://github.com/homebridge/homebridge.git $HOMEBRIDGE_USER

# Install Homebridge and dependencies
RUN npm install
RUN npm run build

# Install the UI
RUN npm install -g homebridge-config-ui-x

RUN mkdir -p $HOMEBRIDGE_USER/node_modules/$PLUGIN_ID/dist/
RUN mkdir -p $HOMEBRIDGE_USER/node_modules/$PLUGIN_ID/node_modules/
RUN mkdir -p $HOMEBRIDGE_USER/node_modules/$PLUGIN_ID/.yarn/

COPY ./config.schema.json $HOMEBRIDGE_USER/node_modules/$PLUGIN_ID/
COPY ./yarn.lock $HOMEBRIDGE_USER/node_modules/$PLUGIN_ID/
COPY ./package.json $HOMEBRIDGE_USER/node_modules/$PLUGIN_ID/
COPY ./dist/ $HOMEBRIDGE_USER/node_modules/$PLUGIN_ID/dist/
COPY ./node_modules/ $HOMEBRIDGE_USER/node_modules/$PLUGIN_ID/node_modules/
COPY ./.yarn/ $HOMEBRIDGE_USER/node_modules/$PLUGIN_ID/.yarn/

COPY ./volumes/config.json $HOMEBRIDGE_USER/config.json

# Expose necessary ports
EXPOSE 8581
EXPOSE 51826

# Define entrypoint
CMD npm run watch -- -U $HOMEBRIDGE_USER
# Use a Node.js image (replace with any base image you need)
FROM node:14

# Set the working directory
WORKDIR /workspace

RUN apt-get update && apt-get install -y libgd-dev pkg-config curl && \
    curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.16.1/install.sh | bash && \
    export NVM_DIR="$HOME/.nvm" && \
    [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" && \
    nvm install 6 && \
    nvm alias default 6 && \
    npm install && \
    apt-get update && apt-get install -y wget gnupg lsb-release && \
    wget -qO - https://www.mongodb.org/static/pgp/server-4.4.asc | apt-key add - && \
    echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu bionic/mongodb-org/4.4 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-4.4.list && \
    apt-get update && apt-get install -y mongodb-org && \
    mkdir -p /data/db

# Set environment variables for MongoDB
ENV MONGO_INITDB_ROOT_USERNAME=admin
ENV MONGO_INITDB_ROOT_PASSWORD=password
ENV MONGO_INITDB_DATABASE=pcaso

#copy all
COPY startup.sh ./startup.sh
RUN chmod +x ./startup.sh

EXPOSE 27017 8080

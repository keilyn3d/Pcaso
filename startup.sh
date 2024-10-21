#!/bin/bash

# Start MongoDB in the background
mongod --bind_ip 0.0.0.0 &

# Wait for MongoDB to start
sleep 5

# Create MongoDB user and database (if not already created)
mongo --eval "db.createUser({user: '$MONGO_INITDB_ROOT_USERNAME', pwd: '$MONGO_INITDB_ROOT_PASSWORD', roles:[{role:'root',db:'admin'}]});" || true

# Start the Node.js application
npm run start-server
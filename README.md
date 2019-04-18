A Node.js/Express powered server for all your mapping needs!

# Quickstart

```sh
npm install
npm run start
```

# Server Setup

- Get Source Code: https://github.com/cs467-map/server

- Install Node.js/npm: [OS specific instructions.](https://nodejs.org/en/download/)

- Start Server

To build and run the server, enter

```sh
# install dependencies
npm install

# start server
npm run start
```

The server’s npm commands are defined in the package.json file:

```JSON
  "scripts": {
    "start": "nodemon index.js",
    "test": "node test.js",
  },
```

Browse to localhost:5000 and you should see the map!

![example of server running on localhost](./example.png)

# Database Setup

Database installation and configuration instructions may be found [here](https://github.com/cs467-map/database).

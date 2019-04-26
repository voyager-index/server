A Node.js/Express powered server for all your mapping needs!

# Quickstart

```sh
npm install
source .env
npm run build
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

# set environment varibales
source .env

# build bundle
npm run build

# start server
npm run start
```

The server’s npm commands are defined in the package.json file:

```JSON
  "scripts": {
    "start": "nodemon -e js,ejs,json,css,md index.js",
    "test": "node test.js",
    "build": "webpack --config webpack.config.js --mode production",
    "watch": "webpack --config webpack.config.js --mode production --watch"
  },
```

Browse to localhost:5000 and you should see the map!

![example of server running on localhost](./example.png)

# Heroku Setup

Helpful article:

https://devcenter.heroku.com/articles/getting-started-with-nodejs?singlepage=true

## Install Heroku
- [OS-specific instructions](https://devcenter.heroku.com/articles/getting-started-with-nodejs?singlepage=true#set-up)


```sh
# login to Heroku
heroku login

# if not already in the server directory, cd to it.
cd server

# set environmental variables.
source .env

# set database url for heroku host to use
heroku config:set DATABASE_URL=postgres://USER:PASSWORD@HOST/DATABASE

# add heroku remote 
heroku git:remote -a $APP

# push to the heroku host
git push heroku master
```

# Database Setup

Database installation and configuration instructions may be found [here](https://github.com/cs467-map/database).

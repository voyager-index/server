A Node.js/Express powered server for all your mapping needs!

# Quickstart

```sh
npm install
source .env
npm run build
npm run start
```
# Requirements

- [Node.js](https://nodejs.org/) (runs the server).
- [pandoc](https://pandoc.org/) (converts views/pages/data_article.md to views/pages/data_article.ejs).
- [PostgreSQL](https://www.postgresql.org/) (runs the database).
- [Git](https://git-scm.com/) (moves the code around).
- A shell and terminal (runs the code).

If you'd rather skip the pandoc installation, change this line in `nodemon.json`:

```json
    "restart": "node docs.js; sass public/stylesheets/main.scss public/stylesheets/main.css"
```
to:

```json
    "restart": "sass public/stylesheets/main.scss public/stylesheets/main.css"
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

See the section *Note on Passwords* below for a note on security.

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

# Note on Passwords

One of the commands above requires the password to interface with the hosted database. 

```sh
heroku config:set DATABASE_URL=postgres://USER:PASSWORD@HOST/DATABASE
```

There are a few options available for inputting the password, each with different security levels and setup requirements:

### Plain Input 

Not very secure, as the password can be viewed as plain text and possibly stored in command history. But, it is fast and handy.

```sh
heroku config:set DATABASE_URL=postgres://coolUser:password123!@coolHost/coolDb
```

### Export Environmental Variable

A little bit more secure, but the environmental variable may still may be viewed in command history, or by the operating system's superuser. [See also.](https://borgbackup.readthedocs.io/en/stable/quickstart.html#pitfalls-with-shell-variables-and-environment-variables)

```sh
export DB_PASS = 'password123!'
heroku config:set DATABASE_URL=postgres://coolUser:DB_PASS@coolHost/coolDb
```

### Use a Password Manager 

Much more secure, but requires some setup. [Pass](https://www.passwordstore.org/) and [KeepassXC](https://keepassxc.org/) are two Free, Open Source, and Cross Platform options.

```sh
pass init
pass add db
heroku config:set DATABASE_URL=postgres://coolUser:$(pass show db)@coolHost/coolDb
```


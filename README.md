A Node.js/Express powered server for all your mapping needs!

-   [Quickstart](#quickstart)
-   [Requirements](#requirements)
-   [Server Setup](#server-setup)
-   [Heroku Setup](#heroku-setup)
    -   [Requirements](#requirements-1)
    -   [Install Heroku](#install-heroku)
-   [Database Setup](#database-setup)
-   [Note on Passwords](#note-on-passwords)
    -   [Plain Input](#plain-input)
    -   [Export Environmental Variable](#export-environmental-variable)
    -   [Use a Password Manager](#use-a-password-manager)

# Quickstart

```sh
npm install    # install dependencies
source .env    # set environmental variables (optional)
npm run build  # build webpack bundle
npm run start  # start node server
```

# Requirements

-   [Node.js](https://nodejs.org/) (runs the server).
-   [PostgreSQL](https://www.postgresql.org/) (runs the database).
-   [Git](https://git-scm.com/) (moves the code around).
-   [pandoc](https://pandoc.org/) (optional, converts `views/pages/data_article.md` to `views/pages/data_article.ejs`).
-   A shell and terminal (runs the code).

If you'd rather skip the pandoc installation, replace this line in `nodemon.json`:

```json
    "restart": "node docs.js; sass public/stylesheets/main.scss public/stylesheets/main.css"
```

with:

```json
    "restart": "sass public/stylesheets/main.scss public/stylesheets/main.css"
```

# Server Setup

-   Get Source Code: `git clone https://github.com/cs467-map/server`

-   Install Node.js/npm: [OS specific instructions.](https://nodejs.org/en/download/)

-   Start Server:

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
    "start": "nodemon -e js,ejs,json,scss,css,md index.js",
    "test": "node test.js",
    "dev": "webpack --config webpack.config.js --mode development",
    "watch": "webpack --config webpack.config.js --mode development --watch",
    "analyze": "webpack --config webpack.config.js --mode production --profile --json > stats.json",
    "build": "webpack --config webpack.config.js --mode production"
},
```

Browse to `localhost:5000` and you should see the map!

![example of server running on localhost](./example.png)

# Heroku Setup

Setting up the Heroku workflow is only necessary if you wish to push changes to the production server at https://voyager-index.herokuapp.com/.

## Requirements

-   [GnuPG](https://www.gnupg.org/)
-   [Gopass](https://www.gopass.pw/)

Source:

https://devcenter.heroku.com/articles/getting-started-with-nodejs?singlepage=true

## Install Heroku

-   [OS-specific instructions](https://devcenter.heroku.com/articles/getting-started-with-nodejs?singlepage=true#set-up)

See the section _Note on Passwords_ below for a note on security.

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

Database installation and configuration instructions may be found at the [database repo](https://github.com/cs467-map/database).

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

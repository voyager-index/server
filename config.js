// Used to connect to PostgreSQL database.
const { Pool } = require('pg');

const pool = new Pool({
    // old heroku info
    // connectionString: process.env.DATABASE_URL

    // new connection info
    host: process.env.DBHOST, // server name or IP address;
    port: process.env.DBPORT,
    database: process.env.DBNAME,
    user: process.env.DBUSER,
    password: process.env.DBPASS
});

module.exports = pool;

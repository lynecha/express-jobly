"use strict";

/** Database setup for jobly. */

const { Client } = require("pg");

const DB_URI = process.env.NODE_ENV === "test"
    ? "postgres://postgres:1084314Lyne!@localhost:5432/jobly_test"
    : "postgres://postgres:1084314Lyne!@localhost:5432/jobly";
let db = new Client({
  connectionString: DB_URI,
});

db.connect();


module.exports = db;



// const { getDatabaseUri } = require("./config");

// const db = new Client({
//   connectionString: getDatabaseUri(),
// });

// db.connect();

// module.exports = db;

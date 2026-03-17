const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'localhost',       // your MySQL host
  user: 'root',            // your MySQL username
  password: 'Nest123$',// your MySQL password
  database: 'eduverse',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const db = pool.promise();

module.exports = db;
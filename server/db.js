const Pool = require("pg").Pool;

const pool = new Pool(
    {
        user : "postgres",
        password : "pass123",
        host : "localhost",
        port : 5432,
        database:"DBS"
    }
);

module.exports=pool;
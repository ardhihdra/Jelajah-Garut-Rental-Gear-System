var mysql = require('mysql');

var con = mysql.createConnection({
  host:"localhost",
  user: "root",
  password: "password"
});
// install mysql first
// port: "3306",
// then npm mysql
//localhost, user, -
console.log("cuk");
con.connect(function(err){
  if(err) throw err;
  console.log("Connected to database");


  con.query("CREATE DATABASE dbinvoice", function(err,result){
    if(err) throw err;
    console.log("Database created");
  });


});

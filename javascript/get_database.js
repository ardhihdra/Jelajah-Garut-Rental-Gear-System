var mysql = require('mysql');

var con = mysql.createConnection({
  host:"localhost",
  user: "root",
  password: "password",
  database: "dbinvoice"
});
// install mysql first
// then npm mysql

con.connect(function(err){
  var sql = "SELECT tenda4 FROM nama"
  con.query(sql, function(err,result){
    if(err) throw err;
    console.log("Number of records recorded! : "+ result);
  });

});

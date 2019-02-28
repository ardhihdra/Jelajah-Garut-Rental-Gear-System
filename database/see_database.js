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
  con.query("SELECT * FROM Invoice", function(err,result){
    if(err) throw err;
    console.log(result);
  });

  con.query("SELECT * FROM Barang", function(err,result){
    if(err) throw err;
    console.log(result);

  });
 con.query("SELECT * FROM BarangRusak", function(err,result){
    if(err) throw err;
    console.log(result);

  });
  con.query("SELECT * FROM Pelanggan", function(err,result){
     if(err) throw err;
     console.log(result);

   });


  //con.query("DROP TABLE Barang", function(err,reuslt){if(err) throw err;});
  /*var sqlbarang = "CREATE TABLE Barang (nama_barang VARCHAR(50), harga_sewa INTEGER,"
                + " siap_sewa INTEGER, total_barang INTEGER"+ ")";
  con.query(sqlbarang, function(err,result){
    if(err) throw err;
    console.log("Number of records recorded! : "+ result.affectedRows);
  });*/



});

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
  con.query("DELETE FROM Invoice WHERE name='jokowi'", function(err,reuslt){if(err) throw err;console.log('berhasil dihapus');});
  //con.query("DROP TABLE Barang", function(err,reuslt){if(err) throw err;});
  //con.query("DROP TABLE Invoice ", function(err,reuslt){if(err) throw err; console.log("berhasil dihapus");});
  //con.query("DELETE FROM Invoice WHERE keterangan = 'undefined", function(err,reuslt){if(err) throw err; console.log("berhasil dihapus");});
  //con.query("DELETE FROM BarangRusak", function(err,reuslt){if(err) throw err; console.log("berhasil dihapus");});

  /*var sqlbarang = "CREATE TABLE Barang (nama_barang VARCHAR(50), harga_sewa INTEGER,"
                + " siap_sewa INTEGER, total_barang INTEGER"+ ")";
  con.query(sqlbarang, function(err,result){
    if(err) throw err;
    console.log("Number of records recorded! : "+ result.affectedRows);
  });*/

  //con.query("ALTER TABLE Invoice DROP ID");

});

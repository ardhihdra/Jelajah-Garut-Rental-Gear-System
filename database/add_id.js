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
  //con.query("ALTER TABLE Invoice ADD denda INT ");
  //con.query("ALTER TABLE Invoice ADD jaminan VARCHAR(10)");
  //con.query("ALTER TABLE Invoice ADD PRIMARY KEY (ID)");
  //con.query("ALTER TABLE Invoice DROP PRIMARY KEY");
  //con.query("ALTER TABLE Invoice DROP ID");
  //con.query("ALTER TABLE Invoice ADD PRIMARY KEY (ID,name)");
  //con.query("ALTER TABLE Invoice MODIFY COLUMN barang1 VARCHAR(255)");
  //con.query("ALTER TABLE Invoice MODIFY COLUMN barang2 VARCHAR(255)");
  //con.query("ALTER TABLE Invoice MODIFY COLUMN barang3 VARCHAR(255)");
  //con.query("ALTER TABLE Invoice MODIFY COLUMN barang4 VARCHAR(255)");
  //con.query("ALTER TABLE Invoice MODIFY COLUMN barang5 VARCHAR(255)");
  //con.query("ALTER TABLE Invoice MODIFY COLUMN barang6 VARCHAR(255)");
  //con.query("ALTER TABLE Invoice MODIFY COLUMN barang7 VARCHAR(255)");
  //con.query("ALTER TABLE Invoice MODIFY COLUMN keterangan VARCHAR(610)");
  con.query("ALTER TABLE Pelanggan ADD nyewa INT");
  console.log("sudah");
  //con.query("DROP TABLE Barang", function(err,reuslt){if(err) throw err;});
  //con.query("SELECT * FROM Invoice");
  //con.query("ALTER TABLE Invoice ADD keterangan VARCHAR(255)");
  //con.query("UPDATE Invoice SET denda=0");
  //con.query("ALTER TABLE BarangRusak ADD biaya INT");
  /*var sqlbarang = "CREATE TABLE Barang (nama_barang VARCHAR(50), harga_sewa INTEGER,"
                + " siap_sewa INTEGER, total_barang INTEGER"+ ")";
  con.query(sqlbarang, function(err,result){
    if(err) throw err;
    console.log("Number of records recorded! : "+ result.affectedRows);
  });*/


  //TO EDIT TABLE arrangement
  //ALTER TABLE Invoice MODIFY COLUMN ID INT FIRST;


});

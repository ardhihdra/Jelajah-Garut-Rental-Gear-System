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
  //con.query("DROP TABLE Invoice", function(err,reuslt){if(err) throw err;});
  //con.query("DROP TABLE Barang", function(err,reuslt){if(err) throw err;});

  var sql = "CREATE TABLE Invoice ( ID INT NOT NULL AUTO_INCREMENT, tujuan VARCHAR(30), waktu_booking DATE,"
          + "waktu_pengambilan DATETIME, waktu_kembali DATETIME,"
          + "barang1 VARCHAR(255), barang2 VARCHAR(255), barang3 VARCHAR(255), barang4 VARCHAR(255), barang5 VARCHAR(255), barang6 VARCHAR(255), barang7 VARCHAR(255),"
          + "nbarang1 INTEGER, nbarang2 INTEGER, nbarang3 INTEGER, nbarang4 INTEGER, nbarang5 INTEGER, nbarang6 INTEGER, nbarang7 INTEGER,"
          + "lama_sewa INTEGER, total_biaya INTEGER, uang_muka INTEGER, sisa INTEGER, kembali INT, diambil INT, denda INT, jaminan VARCHAR(20), keterangan (255),  PRIMARY KEY(ID)"
          + ")";

  con.query(sql, function(err,result){
    if(err) throw err;
    console.log("Number of records recorded1! : "+ result.affectedRows);
  });

  var sqlbarang = "CREATE TABLE Barang (IDbarang INT NOT NULL AUTO_INCREMENT, nama_barang VARCHAR(50), harga_sewa INTEGER,"
  + " siap_sewa INTEGER,  total_barang INTEGER, PRIMARY KEY(IDbarang)"+ ")";
/*
  con.query(sqlbarang, function(err,result){
    if(err) throw err;
    console.log("Number of records recorded2! : "+ result.affectedRows);
  });
*/
  var sqlbarang1 = "CREATE TABLE BarangRusak (ID INT NOT NULL AUTO_INCREMENT, nama_barang_rusak VARCHAR(50), penyervis VARCHAR(50),"
  + " total_barang_rusak INTEGER, tanggal_servis DATE, keterangan VARCHAR(255), PRIMARY KEY(ID)"+ ")";
/*
  con.query(sqlbarang1, function(err,result){
    if(err) throw err;
    console.log("Number of records recorded3! : "+ result.affectedRows);
  });
*/

  var sqlprofil = "CREATE TABLE Pelanggan (IDpelanggan INT NOT NULL AUTO_INCREMENT, nama VARCHAR(155), email VARCHAR(255),"
          + "nomor_hp VARCHAR(30), foto LONGBLOB, nyewa INT, PRIMARY KEY(IDpelanggan)" + ")";

  con.query(sqlprofil, function(err,result){
    if(err) throw err;
    console.log("Number of records recorded profil! : "+ result.affectedRows);
  });
});

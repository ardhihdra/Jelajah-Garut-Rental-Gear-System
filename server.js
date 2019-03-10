var http = require('http');
var url = require('url');
var fs = require('fs');
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
app.use(bodyParser.json({limit:'5mb'}));
var urlencodedParser = bodyParser.urlencoded({limit:'5mb', extended: true });
var mysql = require('mysql');
var trct = require('truncate-html');
//var json2csv = require('json2csv');
const Json2csvParser = require('json2csv').Parser;
var dateformat = require('dateformat')
var csvWriter = require('csv-write-stream')
// var popup = require('popups');
var moment = require('moment');
var jsdom = require('jsdom');
var values = require('object.values');
var formidable = require('formidable');
var d3 = require("d3");
var JSDOM = jsdom.JSDOM;

//install document juga
// install mysql first
// then npm mysql
// install jQuery

process.env.PWD = process.cwd()
app.use(express.static(process.env.PWD + '/public'));
app.use(express.static(process.env.PWD + '/css'));
app.use(express.static(process.env.PWD + '/javascript'));
app.use(express.static(process.env.PWD + '/database'));

//global.document = new JSDOM('input.html').window.document;

// Running Server Details.

var server = app.listen(8082, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log("Terhubung ke %s:%s Port", host, port);
  console.log("Buka browser kesayangan anda dan kunjungi http://localhost:8082/html/form.html");
});

function connect(){
  return mysql.createConnection({
    host:"localhost",
    user: "root",
    password: "password",
    database: "dbinvoice"
  });
}

function append(page_template){
  var document = new JSDOM(page_template);
  document = document;
  window = document.defaultView;
  return require('jquery')(document.window);
}

app.get('/html/form.html', function (req, res) {
  console.log("ini get form");
  var con = connect();

  //gear = req.body.gear.split(' : ')[0];
  //ngear = req.body.gear.split(' : ')[1];
  //console.log($('html').html());
  var page_template = fs.readFileSync('html/form.html','utf-8');
  var $ = append(page_template)
  con.connect(function(err){
    if(err) throw err;

    var sql = "SELECT * FROM Barang";
    con.query(sql, function (err, result, fields) {
      if (err) throw err;
        //console.log(result[0].nama_barang);
        //console.log(result);
        var barangdiinput;
        var cart;
        for(var i=0;i<result.length;i++){
          barangdiinput = "<option name= '"+ result[i].nama_barang + "'>"  + result[i].nama_barang ;
          barangdiinput += " : "+ result[i].harga_sewa +"</option>\n";
          //console.log(barangdiinput);
          $(barangdiinput).appendTo('select');

          cart = "<p>"+result[i].nama_barang +" [stok total:"+result[i].total_barang +"]<span class='price' name='harga"+ (i+1)+ "'>RP."+ result[i].harga_sewa +"</span></p>"
          $(cart).appendTo('div4');
        }
        //console.log($('html').html());
        res.send($('html').html());
      });
  });
});

app.post('/html/form.html', urlencodedParser, function(req,res){
  console.log("ini post form");
  //post bakal nerima data (data uang muka dan sisa) yang tersubmit dan dikirim dari tag html form cuk
  var con = connect();
  var pageform = fs.readFileSync('html/form.html','utf-8');
  var $ = append(pageform);

  con.connect(function(err){
    if(err) throw err;
    //console.log("isi body");
    //console.log(req.body.ktp);
    // -----aa
    if(req.body.idpelanggan==0){
      var pelanggan = "INSERT INTO Pelanggan";
      pelanggan += "(name, email,"
      + "nomor_hp, foto, nyewa)";
      pelanggan += "VALUES ?";
      var value1 = [
        [req.body.name,req.body.email,req.body.phonenumber,req.body.foto,1]
      ];
      //console.log("barang2 nya"+value);
      //console.log(req.body.rentdate);;
      con.query(pelanggan, [value1], function(err, result){
        if(err) throw err;
        console.log("Pelanggan berhasil dimasukan ke database pelanggan");
      });
      var updateid = "UPDATE Invoice SET IDpelanggan=(SELECT MAX(IDpelanggan) FROM Pelanggan) ORDER BY ID DESC LIMIT 1";

    } else {
      var pelanggan = "UPDATE Pelanggan SET nyewa=nyewa+1,";
      pelanggan += "name='"+req.body.name+"',email='"+req.body.email+"',nomor_hp='"+req.body.phonenumber+"',foto='"+req.body.foto+"'";
      pelanggan += "WHERE IDpelanggan="+req.body.idpelanggan;
      con.query(pelanggan, function(err, result){
        if(err) throw err;
        console.log("Pelanggan berhasil diupdate");
      });
      var updateid = "UPDATE Invoice SET IDpelanggan="+req.body.idpelanggan+" ORDER BY ID DESC LIMIT 1";

    }

    var kirimbarang = "INSERT INTO Invoice";
    kirimbarang += "("
            + "tujuan, waktu_booking,"
            + "waktu_pengambilan, waktu_kembali,"
            + "barang1, barang2, barang3, barang4, barang5, barang6, barang7,"
            + "nbarang1, nbarang2, nbarang3, nbarang4, nbarang5, nbarang6, nbarang7,"
            + "lama_sewa, total_biaya, uang_muka, sisa, kembali, diambil, jaminan,keterangan,denda"
            + ")"
    var taken=0;
    var now = new Date();
    var then = new Date(req.body.rentdate);
    if(now.getDate()==then.getDate() && now.getMonth()==then.getMonth() && now.getFullYear()==then.getFullYear()){
      taken = 1;
    }
    //console.log(taken);
    var lamasewa = req.body.lamasewa[0];
    for(let i=1;i<req.body.lamasewa.length;i++){
      if(req.body.lamasewa[i]>lamasewa) lamasewa=req.body.lamasewa[i];
    }
    kirimbarang += " VALUES ?";

    var value = [
      [req.body.destination,new Date(),new Date(req.body.rentdate),new Date(req.body.returndate),
        req.body.gear1,req.body.gear2,req.body.gear3,req.body.gear4,req.body.gear5,req.body.gear6,req.body.gear7,
        req.body.barang1,req.body.barang2,req.body.barang3,req.body.barang4,req.body.barang5,req.body.barang6,req.body.barang7,
        lamasewa,req.body.total,req.body.dp,(parseInt(req.body.total)-parseInt(req.body.dp)),0,taken,req.body.jaminan,req.body.keterangan,0]
    ];
    //console.log(kirimbarang);
    //console.log("barang2 nya"+value);
    //console.log(req.body.rentdate);;
    con.query(kirimbarang, [value],function(err, result){
      if(err) throw err;
      console.log("barang berhasil dimasukan ke database invoice");
    });
    con.query(updateid, function(err, result){
      if(err) throw err;
      console.log("IDpelanggan berhasil dimasukan ke database invoice");
    });


    // dbprofil
    var sql = "SELECT nama_barang, harga_sewa FROM Barang";
    con.query(sql, function (err, result, fields) {
      if (err) throw err;
      //console.log(result[0].nama_barang);

      var page_template = fs.readFileSync('html/form.html','utf-8');
      var $ = append(page_template);
      var barangdiinput;
      var cart;
      for(var i=0;i<result.length;i++){
        barangdiinput = "<option name= '"+ result[i].nama_barang + "'>"  + result[i].nama_barang ;
        barangdiinput += " : "+ result[i].harga_sewa +"</option>\n";
        //console.log(barangdiinput);
        $(barangdiinput).appendTo('select');
        //$(nbarangdiinput).appendTo('divh');

        cart = "<p><a href='#'>"+result[i].nama_barang +"</a> <span class='price' name='harga"+ (i+1)+ "'>"+ result[i].harga_sewa +"</span></p>"
        $(cart).appendTo('div4');
      }

        $("input").on("change", function() {
          this.setAttribute(
                "data-date",
                moment(this.value, "YYYY-MM-DD")
                .format( this.getAttribute("data-date-format") )
            )
        }).trigger("change");

      res.send($('html').html());
      });
  });
  //console.log("tespek");
});

app.post('/html/printinvoice', urlencodedParser, function(req,res){
  console.log("request print");
  var a;
  //post bakal nerima data (data uang muka dan sisa) yang tersubmit dan dikirim dari tag html form cuk
  var con = connect();
  var pageform = fs.readFileSync('html/printinvoice.html','utf-8');
  //var pageform = fs.readFileSync('checkout.html','utf-8');

  var $ = append(pageform);
  //console.log(req.body.name);
  con.connect(function(err){
    if(err)throw err;

    con.query("SELECT * FROM Invoice natural join Pelanggan ORDER BY ID DESC, IDpelanggan DESC LIMIT  1",function(err, result, fields){
      if(err)throw err;
      //dbprofil
	    //console.log(result);
      var inv = '';
      if(result.length==0){
		      var id=1;
	    }else{
		      var id=parseInt(result[0].ID)+1;
      }
      if(req.body.idpelanggan==0){
        if(result[0].IDpelanggan==undefined || result[0].IDpelanggan==0){
          var idpelanggan=1;
        } else {
          var idpelanggan=parseInt(result[0].IDpelanggan)+1;
        }
      } else {
        idpelanggan=req.body.idpelanggan;
      }
      //console.log(req.body);
      //console.log(req.body.foto);;
      inv += "<div class='invoice-box'><table cellpadding='0' cellspacing='0'><tr class='top'>";
      inv += "<td colspan='2'><table><tr><td class='title'><img src='/JG.png' style='width:100%; max-width:100px;'>";
      inv += "<img src='"+req.body.foto+"' style='width:100%; max-width:100px;' alt='profile-image'></td>";
      inv += "<td>Invoice #"+id+"<br>";
      inv += "ID Pelanggan #"+idpelanggan+"<br>";
      inv += "<br>Created: "+dateformat(new Date(),"fullDate")+"<br>";
      inv += "Gear rent on: "+dateformat(req.body.rentdate,"fullDate")+"<br>";
      inv += "Gear return on: "+dateformat(req.body.returndate,"fullDate")+"<br>";
      inv += "</td>";
      inv += "</tr></table></td></tr><tr class='information'><td colspan='2'><table><tr>";
      inv += "<td>CV. Jelajah Garut.<br>Jl. Ahmad Yani, Garut<br>0899-2688-000</td>";
      //divprofil
      inv += "<td>"+req.body.name+"<br>"+req.body.phonenumber+"<br>"+req.body.destination+"<br>";
      if(req.body.email!=undefined) inv +=req.body.email;
      inv+= "</td>";
      //divprofil
      inv += "</tr></table></td></tr><tr class='heading'><td>Details</td><td>#</td></tr>";
      //<divdetails>
      inv += "<tr class='details'><td> Jaminan : </td><td>"+req.body.jaminan+"</td></tr>";
      a = req.body.lamasewa[0];
      for(let i=1;i<req.body.lamasewa.length;i++){
        if(req.body.lamasewa[i]>a) a=req.body.lamasewa[i];
      }
      inv += "<tr class='details'><td> Lama sewa : </td><td>"+a+" hari</td></tr>";
      inv += "<tr class='details'><td> Keterangan : </td><td><i>"+req.body.keterangan+"</i></td></tr>"
      //</divdetails>
      inv += "<tr class='heading'><td>Gear</td><td>Price</td></tr>";
      //<divgear>
      //lanjut array gear
      if(req.body.gear1!="-"){
        inv += "<tr class='item'><td>";
        inv += req.body.gear1 + " ("+req.body.barang1+" set)";
        inv += "</td><td>"+req.body.harga1+"</td></tr>";
      }
      if(req.body.gear2!="-"){
        inv += "<tr class='item'><td>";
        inv += req.body.gear2+ " ("+req.body.barang2+" set)";
        inv += "</td><td>Rp."+req.body.harga2+"</td></tr>";
      }
      if(req.body.gear3!="-"){
        inv += "<tr class='item'><td>";
        inv += req.body.gear3+ " ("+req.body.barang3+" set)";
        inv += "</td><td>Rp."+req.body.harga3+"</td></tr>";
      }
      if(req.body.gear4!="-"){
        inv += "<tr class='item'><td>";
        inv += req.body.gear4+ " ("+req.body.barang4+" set)";
        inv += "</td><td>Rp."+req.body.harga4+"</td></tr>";
      }
      if(req.body.gear5!="-"){
        inv += "<tr class='item'><td>";
        inv += req.body.gear5+ " ("+req.body.barang5+" set)";
        inv += "</td><td>"+req.body.harga5+"</td></tr>";
      }
      if(req.body.gear6!="-"){
        inv += "<tr class='item'><td>";
        inv += req.body.gear6+ " ("+req.body.barang6+" set)";
        inv += "</td><td>"+req.body.harga6+"</td></tr>";
      }
      if(req.body.gear7!="-"){
        inv += "<tr class='item'><td>";
        inv += req.body.gear7+ " ("+req.body.barang7+" set)";
        inv += "</td><td>"+req.body.harga7+"</td></tr>";
      }
      inv +="<tr class='total'><td></td>";
      inv +="<td>Total: Rp."+req.body.total+"</td></tr>";
      inv +="<tr class='total'><td></td><td>Uang Muka: Rp."+req.body.dp+"</td></tr>";
      inv +="<tr class='total'><td></td><td>Sisa: Rp."+(parseInt(req.body.total)-parseInt(req.body.dp))+"</td></tr></table></div>";

      $(inv).appendTo('body');
      res.send($('html').html());
    });
  })
});

app.get('/html/checkout.html', urlencodedParser, function(req,res){
  console.log("ini get check");
  res.sendFile('html/form.html', { root : __dirname});
});

app.post('/html/checkout.html', urlencodedParser, function(req,res){
  console.log("ini post check");
  var con = connect();
  var sql = "SELECT harga_sewa FROM Barang"; //
  var harga = [];
  var cost;
  var jaminan = [];
  var l;
  var page_template = fs.readFileSync('html/checkout.html','utf-8');
  var $ = append(page_template);
  con.connect(function(err){
    if(err) throw err;
    //console.log("isi body: " + req.body.foto);
    //console.log("check");
    if(req.body.ktp!=undefined){jaminan.push(req.body.ktp);}
    if(req.body.sim!=undefined){jaminan.push(req.body.sim);}
    if(req.body.ktm!=undefined){jaminan.push(req.body.ktm)}
    if(req.body.kp!=undefined){jaminan.push(req.body.kp)}
    if(req.body.dll!=undefined){jaminan.push(req.body.dll)}
    //console.log(jaminan);

  //console.log(req.body.name);
    var d = new Date();
    var drnt = new Date(req.body.rentdate);
    var drtr = new Date(req.body.returndate);

    if(req.body.idpelanggan==0){
      console.log("check");
      var foto=req.body.foto;
      var name=req.body.name;
      var phonenumber=req.body.phonenumber;
      var email=req.body.email;
      profil(foto,name,phonenumber,email);
    } else {
      console.log("check2");
      var query ="SELECT * FROM Pelanggan WHERE IDpelanggan="+req.body.idpelanggan;
      con.query(query,function(err,result,field){
        if(err) throw err;
        if(req.body.updatefoto){
          var foto=result[0].foto;
        } else {
          var foto=req.body.foto;
        }
        var name=result[0].name;
        var phonenumber=result[0].nomor_hp;
        var email=result[0].email;
        profil(foto,name,phonenumber,email);
      });

    }
    function profil(foto,name,phonenumber,email){
      var profil ="<tr><th rowspan='6'>"
      +  "<img src='/JG.png' alt='jg-logo' width='10%'>"
      + " <h1>Verifikasi Pesanan Anda</h1>"
      +  "<h4>Kembali ke form jika salah</h4>"
      +"</th>"
      + "<th rowspan='6'>"
      +  "<label>Foto Penyewa:</label>"
      +  "<img height='100' width='100' id='profile' src='"+foto+"' alt='profile-image' />"
      +  "<input hidden id='foto' name='foto' value='"+foto+"' required>";
      if(req.body.updatefoto){
        profil +=  "<br><br><input type='checkbox' name='updatefoto' checked>Gunakan foto lama>"
      } else {
        profil +=  "<br><br><input type='checkbox' name='updatefoto'>Gunakan foto lama>"
      }
      +  "</th>";
      profil += "<tr><th><label for='fid'><i class='fa fa-id'></i> ID Penyewa</label></th>";
      profil +=  "<td><input type='text' id='fid' name='idpelanggan' value='"+req.body.idpelanggan+"' required></td></tr>";
      profil += "<tr><th><label for='fname'><i class='fa fa-user'></i> Nama Penyewa</label></th>";
      profil +=  "<td><input type='text' id='fname' name='name' value='"+name+"' required></td></tr>";
      profil += "<tr><th><label for='pnumber'><i class='fa fa-envelope'></i> Nomor HP</label></th>";
      profil +=  "<td><input   type='text' id='pnumber' name='phonenumber' value='"+phonenumber+"' required></td>";
      profil += "</tr><tr><th><label for='dest'><i class='fa fa-destination'></i> Tujuan</label></th>";
      profil += " <td><input  type='text' id='dst' name='destination' value='"+req.body.destination+"' required></td></tr>";
      profil += "<tr><th><label for='email'><i class='fa fa-email'></i> Email</label></th>";
      profil +=  "<td><input id='email' type='text' name='email' value='"+email+"'></td></tr></tr>";
      //console.log(profil);
      $(profil).appendTo('.div1');
      var a = req.body.gear1.split(" : ")[0];
      //console.log(req.body.gear4.split(" : ")[1]);
      var arrayGear = [
        [req.body.gear1.split(" : ")[0], parseInt(req.body.gear1.split(" : ")[1]) ,parseInt(req.body.barang1)],
        [req.body.gear2.split(" : ")[0], parseInt(req.body.gear2.split(" : ")[1]) ,parseInt(req.body.barang2)],
        [req.body.gear3.split(" : ")[0], parseInt(req.body.gear3.split(" : ")[1]) ,parseInt(req.body.barang3)],
        [req.body.gear4.split(" : ")[0], parseInt(req.body.gear4.split(" : ")[1]) ,parseInt(req.body.barang4)],
        [req.body.gear5.split(" : ")[0], parseInt(req.body.gear5.split(" : ")[1]) ,parseInt(req.body.barang5)],
        [req.body.gear6.split(" : ")[0], parseInt(req.body.gear6.split(" : ")[1]) ,parseInt(req.body.barang6)],
        [req.body.gear7.split(" : ")[0], parseInt(req.body.gear7.split(" : ")[1]) ,parseInt(req.body.barang7)],
      ];
      //console.log(arrayGear);
      //handle nama2 barang yang muncul
      var total=0;
      var lamasewa;
      var i = 0;
      var d1 = (new Date(req.body.rentdate).getDate());
      var d2 = (new Date(req.body.returndate).getDate());
      var m1 = (new Date(req.body.rentdate).getMonth());
      var m2 = (new Date(req.body.returndate).getMonth());
      var y1 = (new Date(req.body.rentdate).getFullYear());
      var y2 = (new Date(req.body.returndate).getFullYear());

      //console.log(d1 + " " + m1 + " " + y1);

      var barang = '';
      for(let i=0;i<arrayGear.length;i++){
        if(arrayGear[i][0]=='-') {
          //console.log('nyettt');
          harga.push(0);
        }else{
          harga.push(arrayGear[i][1]);
        }
        //console.log("harga tes " + harga[i]*10000);
        //console.log(" gear tes " + arrayGear[i][0]);
        //console.log(d1 + " " +m1+" ");
        if(y2!=y1) {
          lamasewa = ((31-d1)) + (d2); //ini masih bug wkwkwk
        } else {
          if(m2!=m1){
            if(y1%4==0&&m1==1) {lamasewa = ((29-d1)) + (d2);}
            else if (m1==1) {lamasewa = (m2-m1-1)*30 + ((28-d1)) + (d2);}
            else if ((m1+1)%2==0) {lamasewa = (m2-m1-1)*30 +(1*(30-d1)) + (1*d2);}
            else {lamasewa = (m2-m1-1)*30 +(1*(31-d1)) + (1*d2);}
          }else {lamasewa = ((d2-d1));if(d2==d1) lamasewa = 1;}
        }
        //console.log(arrayGear[i][1]);
        //console.log(lamasewa);
        //console.log(arrayGear[i][2]);
        cost = arrayGear[i][1]*lamasewa*arrayGear[i][2];

        //harga[i] = harga[i]*lamasewa;

        if(arrayGear[i][0]!='-'){
          barang += "<tr><td><input type='text' class='col-50' name='gear"+(i+1)+"' value='"+arrayGear[i][0]+"' required></input></td>";
          barang += "<td><input type='text' class='col-50' name='barang"+(i+1)+"' value ='"+arrayGear[i][2]+"' required></input></td>";
          barang += "<td><input type='text' class='col-50' name='harga"+(i+1)+"' value='"+harga[i]+"' required></input></td>";
          barang += "<td><input type='text' name='lamasewa' value='"+lamasewa+"' required ></td>";
          barang +=  "<td><input type='text' name='total"+(i+1)+"' value='"+cost+"' required></td></tr>";
        } else {
          barang += "<tr><td><input type='text' class='col-50' name='gear"+(i+1)+"' value='"+arrayGear[i][0]+"' required hidden></input></td>";
          barang += "<td><input type='text' class='col-50' name='barang"+(i+1)+"' value ='"+arrayGear[i][2]+"' required hidden></input></td>";
          barang += "<td><input type='text' class='col-50' name='harga"+(i+1)+"' value='"+harga[i]+"' required hidden></input></td>";
          barang += "<td><input type='text' name='lamasewa' value='"+0+"' required hidden></td>";
          barang +=  "<td><input type='text' name='total"+(i+1)+"' value='"+cost+"' required hidden></td></tr>";
        }

        total += cost;
        //console.log($('html').html());
      } //for lop
      //console.log(req.body.name);
      //console.log(req.body.keterangan);
      $(barang).appendTo('.div2');

      var tag ="<input type='text' name='jaminan' value ='";
      for(let y=0;y<jaminan.length;y++){
        tag += jaminan[y];
        if(y!=jaminan.length-1) tag += ",";
      }

      tagihan ="";
      tagihan += "<tr>";
      tagihan += "<th>Tanggal Sewa</th>";
      tagihan += "<td><label for='rndate'><input type='text' class='col-50' name='datenow' value='" +  dateformat(d ,'dd/mmmm/yyyy')+ "' required></label></td>";
      tagihan += "<td rowspan='4'><input type='text' rows='10' cols='30' name='keterangan' value='"+req.body.keterangan+"' required></td>";
      tagihan += "<th>Jaminan</th><td>"+tag+"' required></td></tr>";

      tagihan += "<tr>";
      tagihan += "<th>Tanggal Pengambilan</th>";
      tagihan += "<td><label for='rndate'><input type='text' class='col-50' name='rentdate' value='"+dateformat(drnt ,'dd/mmmm/yyyy') +"' required></label></td>";
      tagihan += "<th>Total Biaya</th><td><input type='text' class='col-50' name='total' value='"+ total+ "' required></td></tr>";

      tagihan += "<tr>";
      tagihan += "<th>Tanggal Pengembalian</th>";
      tagihan += "<td><label for='rndate'><input type='text' class='col-50' name='returndate' value='"+dateformat(drtr ,'dd/mmmm/yyyy') +"' required></label></td>";
      tagihan += "<th>Uang Muka Biaya</th><td><input type='text' name='dp' required></td>";
      tagihan += "</tr>";

      //console.log($('html').html());
      $(tagihan).appendTo('.div3');
      res.send($('html').html());
    }
    //console.log(profil);
      // ----

      // ------
    //res.sendFile('checkout.html', { root : __dirname});
  });
  //console.log("cek3");
});

function printPengembalian(result,$){
  var barang=[];
  var nbarang=[];
  //console.log(result)
  for(let i=0;i<result.length;i++){
    barang[i]=[result[i].barang1,result[i].barang2,result[i].barang3,result[i].barang4,result[i].barang5,result[i].barang6,result[i].barang7];
    nbarang[i]=[result[i].nbarang1,result[i].nbarang2,result[i].nbarang3,result[i].nbarang4,result[i].nbarang5,result[i].nbarang6,result[i].nbarang7];
  }
  for(let i=0;i<result.length;i++){
    //console.log(result[i].name);
    var profil = "<div class='container'>";
    profil += "<form action='/html/return.html' method='post' name='form1'>";
    profil += "<div class='row'><div class='col-50'>";
    profil += "<table style='width:100%' class='div1'>";
    profil += "<tr><th colspan='4'><h3><img src='/JG.png' alt='jg-logo' width='3%'>Invoice Jelajah Garut</h3></th></tr>"
    profil += "<tbody><th rowspan='6'>";
    profil += "<h4>ID : <input type='textnumber' name='id' value='"+result[i].ID+"'>";
    profil += "<br><h4>ID Pelanggan:<input type='textnumber' name='idpelanggan' value='"+result[i].IDpelanggan+"'><br><h4>"+result[i].nyewa+" kali menyewa</h4></th></tr>";
    profil += "<tr><th rowspan='6'>"
        + "<img width='100' height='150' id='profile' src='"+result[i].foto+"' alt='profile-image'>"
      + "</th></tr>";
    profil += '';
    profil += "<tr><th><label for='fname'><i class='fa fa-user'></i> Nama Penyewa</label></th>";
    profil +=  "<td>"+result[i].name+"</td></tr>"; //<input type='text' name='name' value=''>
    profil += "<tr><th><label for='pnumber'><i class='fa fa-envelope'></i> Nomor HP</label></th>";
    profil +=  "<td>"+result[i].nomor_hp+"</td>";
    profil += "</tr><tr><th><label for='dest'><i class='fa fa-destination'></i> Tujuan</label></th>";
    profil += " <td>"+result[i].tujuan+"</td></tr>";
    profil += "<tr><th><label for='email'><i class='fa fa-email'></i> Email</label></th>";
    profil +=  "<td>"+result[i].email+"</td></tr>";
    profil += "</tr></tbody></table>";

    profil += "<table style='width:100%' class='div2'>";
    profil += "<!-- info barang -->";
    profil += "<tr><th>Nama Alat</th><th>Kuantiti</th><th>Lama Sewa</th></tr>";
    for(let j =0;j<barang.length;j++){
      if(barang[i][j]!="-"){
        profil += "<tr><td>"+barang[i][j]+"</td>";
        profil += "<td>"+nbarang[i][j]+"</td>";
        profil += "<td>"+result[i].lama_sewa+"</td>";
        profil += "</tr>";
      }
    }
    profil += "</table><table style='width:100%' class='div3'><script src='https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.10.3/moment.min.js'></script>";
    profil += "<tr><th colspan='2'>Tanggal</th><th >Keterangan</th><th colspan='2'>Tagihan</th></tr>";
    profil += "";
    profil += "<tr>";
    profil += "<th>Tanggal Sewa</th>";
    profil += "<td><label for='rndate'>" + dateformat(result[i].waktu_booking,'dd/mmmm/yyyy') + "</label></td>";
    profil += "<td rowspan='4'><input type='text' name='keterangan'   value='"+result[i].keterangan+"'></td>";
    profil += "<th>Jaminan</th><td>"+result[i].jaminan+"</td></tr>";

    profil += "<tr>";
    profil += "<th>Tanggal Pengambilan</th>";
    profil += "<td><label for='rndate'>"+dateformat(result[i].waktu_pengambilan,'dd/mmmm/yyyy')+"</label></td>";
    profil += "<th>Total Biaya</th><td>"+ result[i].total_biaya+ "</td></tr>";

    profil += "<tr>";
    profil += "<th>Tanggal Pengembalian</th>";
    profil += "<td><label for='rndate'>"+dateformat(result[i].waktu_kembali,'dd/mmmm/yyyy') +"</label></td>";
    profil += "<th>Uang Muka Biaya</th><td>"+result[i].uang_muka+"</td>";
    profil += "</tr>";

    profil += "</table></div></div>";


    profil +=            "Denda Jika Rusak: <input type='text' name='denda' value="+result[i].denda+"> </li><br>";
    profil +=        "<input type='submit' class='btn3' formaction='updateketerangan' value='Tambahkan Keterangan'></label>"
    profil +=        "<input type='submit' value='Konfirmasi Pengembalian' class='btn'>";
    profil +=        "</div>";
    profil +=      "</div>";
    profil +=      "<divi>";
    profil +=      "</divi></form></div>";
      //console.log($('html').html());
    //for lop
    //console.log(req.body.name);
    //console.log(req.body.keterangan);
    //console.log($('html').html());
    $(profil).appendTo("body");
  }
}

app.get('/html/return.html', urlencodedParser, function (req,res) {
 //ambil nilai denda ambil nilai boolean terkembalikan
 console.log("enter get return");
 var con = connect();

 var page_template = fs.readFileSync('html/return.html','utf-8');
 var $ = append(page_template);

 con.connect(function(err){
   if(err) throw err;
   var sql = "SELECT * ";
   sql += " FROM Invoice join Pelanggan using(IDpelanggan) WHERE diambil=0 or kembali=0 and name!='-' ORDER BY waktu_pengambilan ASC LIMIT 10"; //
   //console.log(sql);
   //FROM Invoice leftouter join Pelanggan WHERE diambil=0 or kembali=0 and name!='' ORDER BY waktu_pengambilan ASC

   con.query(sql,function(err,result,fields){
     //dbprofil
     //console.log(result);
     printPengembalian(result,$);
       //console.log(profil);
       //console.log(result[i].ID);
       //var update = "UPDATE Invoice SET keterangan='"+req.body.keterangan+"'";
       //con.query(update,function(err){if(err) throw err;});

     res.send($('html').html());
   });
 });
});

app.post('/html/searchID', urlencodedParser, function (req,res) {
  //ambil nilai denda ambil nilai boolean terkembalikan
  console.log("enter get return");
  var con = connect();

  var page_template = fs.readFileSync('html/return.html','utf-8');
  var $ = append(page_template);

  con.connect(function(err){
    if(err) throw err;
    var sql = "SELECT * ";
    sql += " FROM Invoice join Pelanggan using(IDpelanggan) WHERE ID="+req.body.id+" ORDER BY waktu_pengambilan ASC"; //
    //console.log(sql);
    con.query(sql,function(err,result,fields){
      //console.log(result);
      printPengembalian(result,$);
        //console.log(profil);
        //console.log(result[i].ID);
        //var update = "UPDATE Invoice SET keterangan='"+req.body.keterangan+"'";
      res.send($('html').html());
    });
  });
 //res.sendFile('return.html', { root : __dirname});
});

app.post('/html/searchID-pelanggan', urlencodedParser, function(req,res){
  //ambil nilai denda ambil nilai boolean terkembalikan
  console.log("enter search ID pelanggan");
  var con = connect();

  var page_template = fs.readFileSync('html/return.html','utf-8');
  var $ = append(page_template);

  con.connect(function(err){
    if(err) throw err;
    var sql = "SELECT * ";
    sql += " FROM Invoice join Pelanggan using(IDpelanggan) WHERE IDpelanggan="+req.body.idpelanggan+" ORDER BY waktu_pengambilan ASC"; //
    //console.log(sql);
    con.query(sql,function(err,result,fields){
      //console.log(result);
      printPengembalian(result,$);
        //console.log(profil);
        //console.log(result[i].ID);
        //var update = "UPDATE Invoice SET keterangan='"+req.body.keterangan+"'";
      res.send($('html').html());
    });
  });
});

app.post('/html/updateketerangan',urlencodedParser, function(req,res){

  console.log("tambah keterangan");
  var con = connect();

  var page_template = fs.readFileSync('html/return.html','utf-8');
  var $ = append(page_template);

  var date = new Date();
  var d = date.getDate();
  var m = date.getMonth();
  var y = date.getFullYear();
  var h = date.getHours();
  var mt = date.getMinutes();
  var dt = date.getSeconds();
  var newdate = date.toISOString();

  con.connect(function(err){
    if(err) throw err;
    //console.log("ini denda");
    //console.log(req.body.denda);
    var set = "UPDATE Invoice SET keterangan ='"+req.body.keterangan+"' , denda="+req.body.denda;//
    set += " WHERE ID = "+req.body.id;
    //console.log(set);
    con.query(set,function(err,result,fields){
      if(err) throw err;
    });

    var sql = "SELECT * ";
    sql += " FROM Invoice join Pelanggan using(IDpelanggan) WHERE diambil=0 or kembali=0 and name!='' ORDER BY waktu_pengambilan ASC"; //
    //console.log(sql);
    //dbprofil
    con.query(sql,function(err,result,fields){
      //console.log(result);
      printPengembalian(result,$); // end loop

      res.send($('html').html());
    });
  });//connection
});

app.post('/html/return.html', urlencodedParser, function (req,res) {
  //kirim data list pengembalian yang baru
  console.log("enter post return");
  var con = connect();

  var page_template = fs.readFileSync('html/return.html','utf-8');
  var $ = append(page_template);

   var date = new Date();
   var d = date.getDate();
   var m = date.getMonth();
   var y = date.getFullYear();
   var h = date.getHours();
   var mt = date.getMinutes();
   var dt = date.getSeconds();
   var newdate = date.toISOString();

  con.connect(function(err) {
    if(err) throw err;
    //console.log(req.body.denda);
    var sum = 0;
    //sum = (req.body.denda).reduce((a, b) => parseInt(a) + parseInt(b), 0);

    var set = "UPDATE Invoice SET kembali = 1, diambil=1, denda="+req.body.denda+" ";
    set += " WHERE ID ='"+req.body.id+"' and IDpelanggan='"+req.body.idpelanggan+"'";
    con.query(set,function(err,result,fields){
      if(err) throw err;
    });

    var sql = "SELECT * ";
    sql += " FROM Invoice join Pelanggan using(IDpelanggan) WHERE diambil=0 or kembali=0  ORDER BY waktu_pengambilan ASC"; //
    //console.log(sql);
    //dbprofil
    con.query(sql,function(err,result,fields){
      //console.log(result);
      printPengembalian(result,$); // end loop

      res.send($('html').html());
    });
  });
});

app.get('/html/stock.html', urlencodedParser, function(req, res){
  console.log("enter get stock");
  var con = connect();

  var barangdiinput;
  var cart;
  var cekbarang={value:'a'};
  var page_template = fs.readFileSync('html/stock.html','utf-8');
  var $ = append(page_template);
  var hasil;

  con.connect(function(err) {
    var sql = "SELECT * FROM Barang";
    var cqsql = con.query(sql,function(err, result, fields) {
      if (err) throw err;
      cekbarang['value']=result[1].nama_barang;
      //console.log(result[0].nama_barang);
      // tulis nama barang dan stok hari ini di layar
      for(var i=0;i<result.length;i++){
        barangdiinput = "<option >"  + result[i].nama_barang + " : ";
        barangdiinput += result[i].total_barang + "</option>\n";
        //console.log(barangdiinput);
        $(barangdiinput).appendTo('select');
      }
      hasil = barangdiinput;
      var barangdiinput;
      var cart;
      for(var i=0;i<result.length;i++){

        cart = "<p>"+result[i].nama_barang +" [stok total:"+result[i].total_barang +"]<span class='price' name='harga"+ (i+1)+ "'>RP."+ result[i].harga_sewa +"</span></p>"
        $(cart).appendTo('div4');
      }
      res.send($('html').html());


    }); //where is taken
    var a='month';
    function f(a){
      cekbarang.value=a;
    }
    //console.log(cekbarang.value);
    //console.log("ini hasil");
    //console.log(hasil);
    //console.log($('html').html());
  });
  //res.sendFile('stock.html', {root: __dirname});
});

app.post('/html/check_table.html', urlencodedParser, function(req, res){
  console.log("enter post stock");
  var con = connect();

  //date = extractday(date);
  //date1 = extractday(date1);
  //console.log(date[0] + " " + date[1] + " " + date[2]+ " " + date[3]+ " " + date[4] + " " + date[5]);
  var page_template = fs.readFileSync('html/check_table.html','utf-8');
  var $ = append(page_template);

  var date = new Date(req.body.rentdate);
  var date1 = new Date(req.body.returndate);
  var rentdate1 = date.getTime();
  var returndate1 = date1.getTime();
  var rnt1 = extractday(date);
  var rtr1 = extractday(date1);
  var barangdiinput;
  var cart;

  var hasil;
  var gear, ngear;
  gear = req.body.gear.split(' : ')[0];
  ngear = req.body.gear.split(' : ')[1];
  con.connect(function(err) {
    //console.log($('html').html());
    var ceksql = "SELECT barang1,barang2,barang3,barang4,barang5,barang6,barang7, waktu_kembali, waktu_pengambilan,";
    ceksql += " nbarang1,nbarang2,nbarang3,nbarang4,nbarang5,nbarang6,nbarang7,kembali FROM Invoice WHERE";
    ceksql += " (barang1='"+gear+"' OR "+" barang2='"+gear+"' OR "+" barang3='"+gear+"' OR "+" barang4='"+gear+"' OR "+" barang5='"+gear+"' OR "+" barang6='"+gear+"' OR "+" barang7='"+gear+"') ";
    ceksql += " AND kembali=0";
    //console.log(ceksql);
    con.query(ceksql, function(err,result,fields){
      //console.log(result);
      //console.log(extractday(new Date(result[0].waktu_kembali)));
      var rentdate; var returndate;
      var lamasewa;
      var realresult = []; var j = 0;

      for(let i=0;i<result.length;i++){
        rentdate = new Date(result[i].waktu_pengambilan).getTime();
        returndate = new Date(result[i].waktu_kembali).getTime();
        if((returndate >= rentdate1 && rentdate <= rentdate1) || (rentdate>=rentdate1 && rentdate <= returndate1)){
          console.log("ini ada satu");
          //cari lama sewa
          realresult[j] = result[i]; j++;
          if(rtr1[2]!=rnt1[2]) lamasewa = (31-rnt1[0]) + (rtr1[0]);
          else {
            if(rtr1[1]!=rnt1[1]){
              if(rnt1[3]%4==0&&rnt1[1]==1) {lamasewa = (29-rnt1[0]) + (rtr1[0]);}
              else if (rent1[1]==1) {lamasewa = (28-rnt1[0]) + (rtr1[0]);}
              else if ((rent1[1]+1)%2==0) {lamasewa = 1*(31-rnt1[0]) + (1*rtr1[0]);}
              else {lamasewa = 1*(30-rnt1[0]) + (1*rtr1[0]);}
            }else {lamasewa = 1*(rtr1[0]-rnt1[0]);}
          }
        }
          //jika memenuhi syarat tulis di check_table.html
      } //out for
      //console.log("realresult");
      //console.log(realresult);
      var stok=0;
      //cari alat banyaknya alat yang kepake di tanggal tertentu
      for(let x=0;x<realresult.length;x++){
        //7 masih hardcoded
        if(realresult[x].barang1==gear) stok+=realresult[x].nbarang1;
        if(realresult[x].barang2==gear) stok+=realresult[x].nbarang2;
        if(realresult[x].barang3==gear) stok+=realresult[x].nbarang3;
        if(realresult[x].barang4==gear) stok+=realresult[x].nbarang4;
        if(realresult[x].barang5==gear) stok+=realresult[x].nbarang5;
        if(realresult[x].barang6==gear) stok+=realresult[x].nbarang6;
        if(realresult[x].barang7==gear) stok+=realresult[x].nbarang7;

        //cari tanggal yang tepat
      }
      var rentdate = dateformat(req.body.rentdate, 'fullDate');
      var returndate = dateformat(req.body.returndate,"fullDate");
      var response = "<label> Barang : "+ gear +"</label>";
      response += "<label>Sebanyak : "+req.body.banyaknyaitem +" unit </label>";
      response += "<label>Diambil pada tanggal : "+rentdate+" </label>";
      response += "<label>Dikembalikan pada tanggal : "+returndate+" </label>";
      response += "<hr><br>";
      response += "<h4> Stok JG : "+ngear+"</h4>";
      response += "<h4> Stok terpakai "+stok +"</h4>";
      response += "<h4> Stok sisa "+ (parseInt(ngear) - parseInt(stok)) +"</h4>";
      //console.log(response);
      $(response).appendTo("divreq");
      res.send($('html').html());
    }); //out ceksql query

  });

  //res.sendFile('check_table.html', {root: __dirname});
});

app.post('/html/check_today', urlencodedParser, function(req, res){
  console.log("enter post stock");
  var con = connect();

  var page_template = fs.readFileSync('html/check_table.html','utf-8');
  var $ = append(page_template);

  var date = new Date();
  var rentdate1 = date.getTime();
  var rnt1 = extractday(date);
  var rtr1 = rnt1;
  var barangdiinput;
  var cart;

  var hasil;
  var gear, ngear;
  gear = req.body.gear.split(' : ')[0];
  ngear = req.body.gear.split(' : ')[1];
  con.connect(function(err) {
    //console.log($('html').html());
    var ceksql = "SELECT barang1,barang2,barang3,barang4,barang5,barang6,barang7, waktu_kembali, waktu_pengambilan,";
    ceksql += " nbarang1,nbarang2,nbarang3,nbarang4,nbarang5,nbarang6,nbarang7,kembali FROM Invoice WHERE";
    ceksql += " (barang1='"+gear+"' OR "+" barang2='"+gear+"' OR "+" barang3='"+gear+"' OR "+" barang4='"+gear+"' OR "+" barang5='"+gear+"' OR "+" barang6='"+gear+"' OR "+" barang7='"+gear+"') ";
    ceksql += " AND kembali=0";
    //console.log(ceksql);
    con.query(ceksql, function(err,result,fields){
      //console.log(result);
      //console.log(extractday(new Date(result[0].waktu_kembali)));
      var rentdate; var returndate;
      var lamasewa;
      var realresult = []; var j = 0;

      for(let i=0;i<result.length;i++){
        rentdate = new Date(result[i].waktu_pengambilan).getTime();
        returndate = new Date(result[i].waktu_kembali).getTime();
        if((returndate >= rentdate1 && rentdate <= rentdate1) || (rentdate>=rentdate1 && rentdate <= returndate1)){
          console.log("ini ada satu");
          //cari lama sewa
          realresult[j] = result[i]; j++;
          if(rtr1[2]!=rnt1[2]) lamasewa = (31-rnt1[0]) + (rtr1[0]);
          else {
            if(rtr1[1]!=rnt1[1]){
              if(rnt1[3]%4==0&&rnt1[1]==1) {lamasewa = (29-rnt1[0]) + (rtr1[0]);}
              else if (rent1[1]==1) {lamasewa = (28-rnt1[0]) + (rtr1[0]);}
              else if ((rent1[1]+1)%2==0) {lamasewa = 1*(31-rnt1[0]) + (1*rtr1[0]);}
              else {lamasewa = 1*(30-rnt1[0]) + (1*rtr1[0]);}
            }else {lamasewa = 1*(rtr1[0]-rnt1[0]);}
          }
        }
          //jika memenuhi syarat tulis di check_table.html
      } //out for
      //console.log("realresult");
      //console.log(realresult);
      var stok=0;
      //cari alat banyaknya alat yang kepake di tanggal tertentu
      for(let x=0;x<realresult.length;x++){
        //7 masih hardcoded
        if(realresult[x].barang1==gear) stok+=realresult[x].nbarang1;
        if(realresult[x].barang2==gear) stok+=realresult[x].nbarang2;
        if(realresult[x].barang3==gear) stok+=realresult[x].nbarang3;
        if(realresult[x].barang4==gear) stok+=realresult[x].nbarang4;
        if(realresult[x].barang5==gear) stok+=realresult[x].nbarang5;
        if(realresult[x].barang6==gear) stok+=realresult[x].nbarang6;
        if(realresult[x].barang7==gear) stok+=realresult[x].nbarang7;

        //cari tanggal yang tepat
      }
      var rentdate = dateformat(req.body.rentdate, 'fullDate');
      var returndate = dateformat(req.body.returndate,"fullDate");
      var response = "<label> Barang : "+ gear +"</label>";
      response += "<label>Sebanyak : "+req.body.banyaknyaitem +" unit </label>";
      response += "<label>Diambil pada tanggal : "+rentdate+" </label>";
      response += "<label>Dikembalikan pada tanggal : "+returndate+" </label>";
      response += "<hr><br>";
      response += "<h4> Stok JG : "+ngear+"</h4>";
      response += "<h4> Stok terpakai "+stok +"</h4>";
      response += "<h4> Stok sisa "+ (parseInt(ngear) - parseInt(stok)) +"</h4>";
      //console.log(response);
      $(response).appendTo("divreq");
      res.send($('html').html());
    }); //out ceksql query

  });

  //res.sendFile('check_table.html', {root: __dirname});
});

function extractday(a){
  return [a.getDate(),a.getMonth(),a.getFullYear(),a.getHours(),a.getMinutes(),a.getSeconds()];
}

app.get('/html/input.html', function (req, res) {
  //ambil nilai barang lama dan barang baru jika ada
  var con = connect();

  var page_template = fs.readFileSync('html/input.html','utf-8');
  var $ = append(page_template);
  var barangdiinput;
  var sql = "SELECT nama_barang,total_barang, harga_sewa FROM Barang";
  var cqsql = con.query(sql,function(err, result, fields) {
    if (err) throw err;
    //console.log(result[0].nama_barang);

      for(var i=0;i<result.length;i++){
        barangdiinput = "<option >"  + result[i].nama_barang + " : stok " + result[i].total_barang + " : harga " + result[i].harga_sewa;
        barangdiinput += "</option>\n";
        //console.log(barangdiinput);
        $(barangdiinput).appendTo('select');
      }
      hasil = barangdiinput;
      res.send($('html').html());
  }); //end query

  //res.sendFile('input.html' , { root : __dirname});
});

app.post('/html/baranglama',urlencodedParser,function(req,res){

  console.log("post barang lama");

  var con = connect();

  var page_template = fs.readFileSync('html/input.html','utf-8');
  var $ = append(page_template);

  var gear = req.body.gear.split(" : stok ")[0];
  var ngear = req.body.gear.split(" : stok ")[1];
  //console.log(req.body.hapus);
  con.connect(function(err){
    if(err) throw err;
    console.log("masuk konek");
    if(req.body.hapus=="1"){
      var sql = "DELETE FROM Barang WHERE nama_barang='"+gear+"' and total_barang="+ngear;
    } else {
      var sql = "UPDATE Barang SET ";
      if(req.body.ngear!='0' && req.body.ubahharga!='0'){
        sql += "total_barang="+req.body.ngear+" , harga_sewa="+req.body.ubahharga;
      }
      if(req.body.ngear!='0' && req.body.ubahharga=='0'){
        sql += "total_barang="+req.body.ngear;
      }
      if(req.body.ngear=='0' && req.body.ubahharga!='0'){
        sql += "harga_sewa="+req.body.ubahharga;
      }
      sql += " WHERE nama_barang='"+gear+"'"; //
      //console.log(sql);
    }
    con.query(sql, function(err, result){if(err) throw err;});

    var sql = "SELECT nama_barang,total_barang, harga_sewa FROM Barang";
    var cqsql = con.query(sql,function(err, result, fields) {
      if (err) throw err;
      //console.log(result[0].nama_barang);
      var barangdiinput;
      for(var i=0;i<result.length;i++){
        barangdiinput = "<option >"  + result[i].nama_barang + " : stok "+result[i].total_barang + " : harga " + result[i].harga_sewa;
        barangdiinput += "</option>\n";
        //console.log(barangdiinput);
        $(barangdiinput).appendTo('select');
      }
      hasil = barangdiinput;
      res.send($('html').html());
    }); //end query

  });
});

app.post('/html/inputbarang',urlencodedParser,function(req,res){
  console.log("sent input barang");
  var con = connect();
  var page_template = fs.readFileSync('html/input.html','utf-8');
  var $ = append(page_template);

  con.connect(function(err){
    if(err) throw err;
    console.log("masuk konek");
    var sql = "INSERT INTO Barang (nama_barang, harga_sewa, siap_sewa, total_barang) VALUES ?"; //
    var value = [
      [req.body.stuffname, parseInt(req.body.stuffprice,10), parseInt(req.body.stuffqty,10), parseInt(req.body.stuffqty,10)]
    ];
    con.query(sql, [value], function(err, result){if(err) throw err;});
    //console.log(sql);
    //console.log("Data Termasukkan!" + reply);
    var barangdiinput;

    var sql = "SELECT nama_barang, total_barang, harga_sewa FROM Barang";
    var cqsql = con.query(sql,function(err, result, fields) {
      if (err) throw err;
      //console.log(result[0].nama_barang);

      for(var i=0;i<result.length;i++){
        barangdiinput = "<option >"  + result[i].nama_barang + " : stok " + result[i].total_barang + " : harga " + result[i].harga_sewa;
        barangdiinput += "</option>\n";
          //console.log(barangdiinput);
        $(barangdiinput).appendTo('select');
      }
      hasil = barangdiinput;
      res.send($('html').html());
    }); //end query
  });
  //res.sendFile('input.html' , { root : __dirname});
});

//ini jadi gakepake
app.post('/html/input.html', urlencodedParser, function (req, res) {
  console.log("post input");
  var con = connect();
  var reply='';

  reply += req.body.stuffname;
  reply += " " + req.body.stuffprice;
  reply += " " + req.body.stuffqty;

  con.connect(function(err){
    if(err) throw err;
    console.log("masuk konek");
    var sql = "INSERT INTO Barang (nama_barang, harga_sewa, siap_sewa, total_barang) VALUES ?"; //
    var value = [
      [req.body.stuffname, parseInt(req.body.stuffprice,10), parseInt(req.body.stuffqty,10), parseInt(req.body.stuffqty,10)]
    ];
    //con.query(sql, [value], function(err, result){if(err) throw err;});
    //console.log(sql);
  });
  console.log("Data Termasukkan!" + reply);


  res.sendFile('html/input.html' , { root : __dirname});
  //res.send('data termasukan euy!' + reply);
});

app.get('/html/broke.html',urlencodedParser, function(req,res){
  console.log("get broke");
  var con = connect();
  var page_template = fs.readFileSync('html/broke.html','utf-8');
  var $ = append(page_template);
  var barangdiinput;
  var sql = "SELECT nama_barang,total_barang FROM Barang";
  var cqsql = con.query(sql,function(err, result, fields) {
    if (err) throw err;
    //console.log(result[0].nama_barang);

      for(var i=0;i<result.length;i++){
        barangdiinput = "<option >"  + result[i].nama_barang + " : stok " + result[i].total_barang;
        barangdiinput += "</option>\n";
        //console.log(barangdiinput);
        $(barangdiinput).appendTo('select');
      }
      hasil = barangdiinput;
      res.send($('html').html());

  });

});

app.post('/html/broke.html',urlencodedParser, function(req,res){
  console.log("post broke");

  var con = connect();

  var page_template = fs.readFileSync('html/broke.html','utf-8');
  var $ = append(page_template);

  var gear = req.body.gear.split(" : stok ")[0];
  var ngear = req.body.gear.split(" : stok ")[1];
  //console.log(req.body.hapus);
  con.connect(function(err){
    if(err) throw err;
    if(req.body.hapus=='1'){
      var sql = "DELETE FROM Barang WHERE nama_barang='"+gear+"'";
      con.query(sql, function(err, result){if(err) throw err;});
    } else {
      var sqll = "INSERT INTO BarangRusak (nama_barang_rusak, total_barang_rusak,penyervis,tanggal_servis, keterangan,biaya,kembali) VALUES ?";
      var value = [[gear,parseInt(req.body.ngear),req.body.servis,new Date(req.body.tanggalservis),req.body.keterangan,parseInt(req.body.biaya),0]];
      //console.log(sqll);
      //console.log(value);
      con.query(sqll, [value], function(err, result){if(err) throw err;});
      var update="UPDATE Barang SET total_barang="+(ngear-parseInt(req.body.ngear))+" WHERE nama_barang='"+gear+"'";
      con.query(update);
    }

    var barangdiinput;
    var sql = "SELECT nama_barang,total_barang FROM Barang";
    var cqsql = con.query(sql,function(err, result, fields) {
      if (err) throw err;
      //console.log(result[0].nama_barang);a

        for(var i=0;i<result.length;i++){
          barangdiinput = "<option >"  + result[i].nama_barang + " : stok " + result[i].total_barang;
          barangdiinput += "</option>\n";
          //console.log(barangdiinput);
          $(barangdiinput).appendTo('select');
        }
        hasil = barangdiinput;
        res.send($('html').html());


    });


  });
});

function listrusak(result,$){
  if(result!=undefined || result.length==0){
    for(let i=0;i<result.length;i++){
    var date = dateformat(result[i].tanggal_servis,"fullDate");
    //console.log(result[i].name);
    var profil = "<div class='container'>";
    profil +=  "   <form action='/html/returnbroke.html' method='post' name='form1'>";
    profil +=  "     <div class='row'>";
    profil +=          "<divv class='col-50'>";
    profil +=            "<label>ID : <input name='id' value='"+result[i].ID+"'></label>";
    profil +=            "<label>Nama Barang : <input name='name' value='"+result[i].nama_barang_rusak+"'></label>";
    profil +=            "<label>Banyak Barang : <input name='ngear' value="+result[i].total_barang_rusak+"></label>";
    profil +=            "<label>Penyervis : <input name='penyervis' value='"+ result[i].penyervis+"'></label>";
    profil +=            "<label>Harga : <input name='penyervis' value='"+ result[i].biaya+"'></label>";
    profil +=            "<label><i class='fa fa-date'></i>Tanggal Servis: "+ date  +"</label>";
    profil +=            "<label> <i>BARANG BELUM KEMBALI "+"</i></label>";
    profil +=            "<label>Keterangan : <input type='text' name='keterangan' value='"+result[i].keterangan+"'>";
    profil +=            "<input type='submit' class='btn3' formaction='updateservis' value='Tambahkan Keterangan'></label>"
    profil +=         "</divv>";
    profil +=        "</div>";
    profil +=      "<divi>";
    profil +=      "<input type='submit' value='Konfirmasi Pengembalian' class='btn'>";
    profil +=      "</divi></form></div>";
    //console.log(profil);
    //console.log(result[i].ID);
    $(profil).appendTo("body");
    //var update = "UPDATE Invoice SET keterangan='"+req.body.keterangan+"'";
    //con.query(update,function(err){if(err) throw err;});
    } // end loop
  }

}

app.get('/html/returnbroke.html',urlencodedParser,function(err,res){
  console.log("enter get return broke");

  var con = connect();
  var page_template = fs.readFileSync('html/returnbroke.html','utf-8');
  var $ = append(page_template);

  con.connect(function(err){
    if(err) throw err;
    var sql = "SELECT * ";
    sql += " FROM BarangRusak WHERE kembali=0 ORDER BY tanggal_servis ASC"; //
    //console.log(sql);

    con.query(sql,function(err,result,fields){
  	  console.log("result");
  	  //console.log(result);
      listrusak(result,$);
      res.send($('html').html());
    });
  });
});

app.post('/html/returnbroke.html',urlencodedParser,function(req,res){
  console.log("enter post return broke");

  var con = connect();
  var page_template = fs.readFileSync('html/returnbroke.html','utf-8');
  var $ = append(page_template);

  con.connect(function(err){
    if(err) throw err;
    con.query("UPDATE BarangRusak SET kembali=1 WHERE ID="+req.body.id);
    con.query("UPDATE Barang SET total_barang=total_barang+1 WHERE nama_barang='"+req.body.name+"'",function(err){if(err){throw err;}});

    var sql = "SELECT * ";
    sql += " FROM BarangRusak WHERE kembali=0 ORDER BY tanggal_servis ASC"; //
    //console.log(sql);

    con.query(sql,function(err,result,fields){
      //console.log(result);
      listrusak(result,$);
      res.send($('html').html());
    });
  });
});

app.post('/html/updateservis',urlencodedParser,function(req,res){
  console.log("post update broke");
  var con = connect();
  var page_template = fs.readFileSync('html/returnbroke.html','utf-8');
  var $ = append(page_template);

  con.connect(function(err){
    if(err) throw err;
    con.query("UPDATE BarangRusak SET keterangan='"+req.body.keterangan+"' WHERE ID="+req.body.id);


    var sql = "SELECT * ";
    sql += " FROM BarangRusak WHERE kembali=0 ORDER BY tanggal_servis ASC"; //
    //console.log(sql);

    con.query(sql,function(err,result,fields){
      //console.log(result);
      listrusak(result,$);
      res.send($('html').html());
    });
  });
});

app.get('/html/file.html', urlencodedParser, function(err, res){
  //res.sendFile('html/file.html', {root: __dirname});
  console.log("enter file.html");
  var con = connect();

  var page_template = fs.readFileSync('html/file.html','utf-8');
  var $ = append(page_template);

  con.connect(function(err){
  // data invoice
    var sql = "SELECT * FROM Invoice"; //
    con.query(sql, function(err, result,fields){
      if(err) throw err;
      //dbprofila
      //console.log(result);
      const field = [];
      const mydata = [];
      for(let i=0;i<fields.length;i++){
        if(fields[i].name!=undefined) field[i]=fields[i].name;
      }
      for(let i=0;i<result.length;i++){
        if(result[i]!=undefined) mydata[i]=values(result[i]);
      }

      var writer = csvWriter({ headers: field})
      writer.pipe(fs.createWriteStream('invoice.csv'))
      for(let i = 0; i < mydata.length; i++){
        mydata[i][5]=dateformat(mydata[i][5],"dd/mmmm/yyyy");
        mydata[i][4]=dateformat(mydata[i][4],"dd/mmmm/yyyy");
        mydata[i][3]=dateformat(mydata[i][3],"dd/mmmm/yyyy");
        writer.write(mydata[i]);
      }
      writer.end();

      var download = '';
      download += "<form action='/html/invoice' method='post' target='_blank'>";
      download += "<label>Download File Invoice</label><input type='submit' name='penyewa' value='download invoice'></input><br></form>";
      $(download).appendTo(".form");
      // header
      var isiTabel = "<tr class='file'>";
      for(let i=0;i<fields.length;i++){
        if(i==4 || i==20 || i==22 || i==23 || i==26 ) i++;
        isiTabel += "<th>"+field[i]+"</th>";
      }
      isiTabel += "</tr>";
      for(let i=0;i<result.length;i++){
        isiTabel += "<tr class='file'>"
        + "<td>"+result[i].ID+"</td>"
        + "<td>"+result[i].IDpelanggan+"</td><td>"+result[i].tujuan+"</td>"
        + "<td>"+dateformat(result[i].waktu_pengambilan,"dd/mmmm/yyyy")+"</td>"
        + "<td>"+dateformat(result[i].waktu_kembali,"dd/mmmm/yyyy")+"</td>"
        + "<td>"+result[i].barang1+"</td><td>"+result[i].nbarang1+"</td>"
        + "<td>"+result[i].barang2+"</td><td>"+result[i].nbarang2+"</td>"
        + "<td>"+result[i].barang3+"</td><td>"+result[i].nbarang3+"</td>"
        + "<td>"+result[i].barang4+"</td><td>"+result[i].nbarang4+"</td>"
        + "<td>"+result[i].barang5+"</td><td>"+result[i].nbarang5+"</td>"
        + "<td>"+result[i].barang6+"</td><td>"+result[i].nbarang6+"</td>"
        + "<td>"+result[i].barang7+"</td><td>"+result[i].nbarang7+"</td>"
        + "<td>"+(parseInt(result[i].total_biaya)+parseInt(result[i].denda))+"</td><td>"+result[i].sisa+"</td>"
        + "<td>"+result[i].kembali+"</td><td>"+result[i].diambil+"</td>"
        + "<td>"+ result[i].jaminan+"</td><td>"+result[i].keterangan+"</td></tr>"
      }
      //console.log(field);
      //console.log(mydata);
      $(isiTabel).appendTo("table");
      res.send($('html').html());

    });

    // jginvoice
    sql = "SELECT waktu_pengambilan, barang1, barang2, barang3, barang4, barang5, barang6, barang7, nbarang1, nbarang2, nbarang3, nbarang4, nbarang5, nbarang6, nbarang7, lama_sewa FROM Invoice ORDER BY waktu_pengambilan ASC" //
    con.query(sql, function(err, result,fields){
      if(err) throw err;
      const field = []
      const mydata = []
      for(let i=0;i<fields.length;i++){
        if(fields[i].name!=undefined) field[i]=fields[i].name;
        if(result[i]!=undefined) mydata[i]=values(result[i]);
      }
      //console.log(field);
      //console.log(mydata);

      var writer = csvWriter({ headers: field})
      writer.pipe(fs.createWriteStream('penyewaan_gear.csv'))
      for(let i = 0; i < mydata.length; i++){
        mydata[i][0] = dateformat(mydata[i][0],"dd/mmmm/yyyy");
        writer.write(mydata[i]);
      }
      writer.end()
    });

    });
});

app.post('/html/file.html', urlencodedParser, function(req, res){
  res.sendFile('html/file.html', {root: __dirname});
});

app.get('/html/penyewa-f.html', urlencodedParser, function(req,res){
  //res.sendFile('html/file.html', {root: __dirname});
  console.log("enter file penyewa.html");
  var con = connect();

  var page_template = fs.readFileSync('html/file.html','utf-8');
  var $ = append(page_template);

  con.connect(function(err){
  // data invoice
    var sql = "SELECT * FROM Pelanggan"; //
    con.query(sql, function(err, result,fields){
      if(err) throw err;
      //dbprofila
      //console.log(result);
      const field = [];
      const mydata = [];
      //console.log(values(result[1]));
      for(let i=0;i<fields.length;i++){
        if(fields[i].name!=undefined){field[i]=fields[i].name;}
      }
      for(let i=0;i<result.length;i++){
        if(result[i]!=undefined){ mydata[i]=values(result[i]);}
      }
      //console.log(field);
      //console.log(mydata);

      var writer = csvWriter({ headers: field})
      writer.pipe(fs.createWriteStream('penyewa.csv'))
      for(let i = 0; i < mydata.length; i++){
        writer.write(mydata[i]);
      }
      writer.end();

      var isiTabel = '';
      var download = '';
      download += "<form action='/html/penyewa' method='post' target='_blank'>";
      download += "<label>Download File Penyewa</label><input type='submit' name='penyewa' value='download penyewa'></input><br></form>";
      $(download).appendTo(".form");

      var isiTabel = "<table class='content'><tr class='file'>";
      for(let i=0;i<fields.length;i++){
        isiTabel += "<th>"+field[i]+"</th>";
      }
      isiTabel += "</tr>";
      for(let i=0;i<result.length;i++){
        isiTabel += "<tr class='file'>";
        isiTabel +=  "<td>"+result[i].IDpelanggan+"</td>"
        + "<td>"+result[i].name+"</td><td>"+result[i].email+"</td><td>"+result[i].nomor_hp+"</td>"
        + "<td><img width='100' height='150' id='profile' src='"+result[i].foto+"' alt='profile-image'></td><td>"+result[i].nyewa+"</td></tr>"
      }
      //console.log(field);
      //console.log(mydata);
      $(isiTabel).appendTo("table");
      res.send($('html').html());
    });
  });
});

app.get('/html/gear-f.html', urlencodedParser, function(req,res){
  console.log("enter file gear");
  var con = connect();

  var page_template = fs.readFileSync('html/file.html','utf-8');
  var $ = append(page_template);

  con.connect(function(err){
  // data invoice
    var sql = "SELECT * FROM Barang"; //
    con.query(sql, function(err, result,fields){
      if(err) throw err;
      //dbprofila
      //console.log(result);
      const field = [];
      const mydata = [];
      for(let i=0;i<fields.length;i++){
        if(fields[i].name!=undefined) field[i]=fields[i].name;
      }
      for(let i=0;i<result.length;i++){
        if(result[i]!=undefined) mydata[i]=values(result[i]);
      }
      //console.log(field);
      //console.log(mydata);

      var writer = csvWriter({ headers: field})
      writer.pipe(fs.createWriteStream('list_gear.csv'))
      for(let i = 0; i < mydata.length; i++){
        writer.write(mydata[i]);
      }
      writer.end();

      var isiTabel = '';
      var download = '';
      download += "<form action='/html/gear' method='post' target='_blank'>";
      download += "<label>Download File Gear</label><input type='submit' name='' value='download gear'></input></form><br>";
      $(download).appendTo(".form");

      var isiTabel = "<table class='content'><tr class='file'>";
      for(let i=0;i<fields.length;i++){
        isiTabel += "<th>"+field[i]+"</th>";
      }
      isiTabel += "</tr>";
      for(let i=0;i<result.length;i++){
        isiTabel += "<tr class='file'>";
        isiTabel +=  "<td>"+result[i].IDbarang+"</td>"
        + "<td>"+result[i].nama_barang+"</td><td>"+result[i].harga_sewa+"</td><td>"+result[i].siap_sewa+"</td>"
        + "<td>"+result[i].total_barang+"</td></tr>"
      }
      //console.log(field);
      //console.log(mydata);
      $(isiTabel).appendTo("table");
      res.send($('html').html());
    });
  });
});

app.get('/html/broke-f.html', urlencodedParser, function(req,res){
  console.log("enter file gear rusak");
  var con = connect();

  var page_template = fs.readFileSync('html/file.html','utf-8');
  var $ = append(page_template);

  con.connect(function(err){
  // data invoice
    var sql = "SELECT * FROM BarangRusak"; //
    con.query(sql, function(err, result,fields){
      if(err) throw err;
      //dbprofila
      //console.log(result);
      const field = [];
      const mydata = [];
      for(let i=0;i<fields.length;i++){
        if(fields[i].name!=undefined) field[i]=fields[i].name;
      }
      for(let i=0;i<result.length;i++){
        if(result[i]!=undefined) mydata[i]=values(result[i]);
      }
      //console.log(field);
      //console.log(mydata);

      var writer = csvWriter({ headers: field})
      writer.pipe(fs.createWriteStream('kerusakan.csv'))
      for(let i = 0; i < mydata.length; i++){
        writer.write(mydata[i]);
      }
      writer.end();

      var isiTabel = '';
      var download = '';
      download += "<form action='/html/gearrusak' method='post' target='_blank'>";
      download += "<label>Download File Gear Rusak</label><input type='submit' name='' value='download kerusakan'></input></form><br>";
      $(download).appendTo(".form");

      var isiTabel = "<table class='content'><tr class='file'>";
      for(let i=0;i<fields.length;i++){
        isiTabel += "<th>"+field[i]+"</th>";
      }
      isiTabel += "</tr>";
      for(let i=0;i<result.length;i++){
        isiTabel += "<tr class='file'>";
        isiTabel +=  "<td>"+result[i].ID+"</td>"
        + "<td>"+result[i].nama_barang_rusak+"</td><td>"+result[i].penyervis+"</td><td>"+result[i].total_barang_rusak+"</td>"
        + "<td>"+dateformat(result[i].tanggal_servis,"dd/mmmm/yyyy")+"</td>"
        + "<td>"+result[i].keterangan+"</td><td>"+result[i].kembali+"</td><td>"+result[i].biaya+"</td>"
        + "</tr>"
      }
      //console.log(field);
      //console.log(mydata);
      $(isiTabel).appendTo("table");
      res.send($('html').html());
    });
  });
});

app.get('/html/tujuan-f.html', urlencodedParser, function(req,res){
  console.log("enter file tujuan");
  var con = connect();

  var page_template = fs.readFileSync('html/file.html','utf-8');
  var $ = append(page_template);

  con.connect(function(err){
  // data invoice
    var sql = "SELECT IDpelanggan,waktu_pengambilan,tujuan FROM Invoice ORDER BY waktu_pengambilan DESC"; //
    con.query(sql, function(err, result,fields){
      if(err) throw err;
      //dbprofila
      //console.log(result);
      const field = [];
      const mydata = [];
      for(let i=0;i<fields.length;i++){
        if(fields[i].name!=undefined) field[i]=fields[i].name;
      }
      for(let i=0;i<result.length;i++){
        if(result[i]!=undefined) mydata[i]=values(result[i]);
      }
      //console.log(field);
      //console.log(mydata);
      var writer = csvWriter({ headers: field})
      writer.pipe(fs.createWriteStream('tujuan.csv'))
      for(let i = 0; i < mydata.length; i++){
        mydata[i][1] = dateformat(mydata[i][1],"dd/mmmm/yyyy");
        writer.write(mydata[i]);
      }
      writer.end();

      var download = '';
      download += "<form action='/html/frequentdest' method='post' target='_blank'>";
      download += "<label>Download File Pemasukan</label><input type='submit' name='' value='download tujuan'></input></form>";
      $(download).appendTo(".form");


      var isiTabel = '';

      var isiTabel = "<table class='content'><tr class='file'>";
      for(let i=0;i<fields.length;i++){
        isiTabel += "<th>"+field[i]+"</th>";
      }
      isiTabel += "</tr>";
      for(let i=0;i<result.length;i++){
        isiTabel += "<tr class='file'>";
        isiTabel +=  "<td>"+result[i].IDpelanggan+"</td>"
        + "<td>"+dateformat(result[i].waktu_booking,"dd/mmmm/yyyy")+"</td><td>"+result[i].tujuan+"</td>"
        + "</tr>"
      }
      //console.log(field);
      //console.log(mydata);
      $(isiTabel).appendTo("table");
      res.send($('html').html());
    });
  });
});

app.get('/html/pemasukan-f.html', urlencodedParser, function(req,res){
  console.log("enter file pemasukan");
  var con = connect();

  var page_template = fs.readFileSync('html/file.html','utf-8');
  var $ = append(page_template);

  con.connect(function(err){
  // data invoice
    var sql = "SELECT ID,waktu_booking,total_biaya,denda,sisa FROM Invoice ORDER BY waktu_pengambilan DESC"; //
    con.query(sql, function(err, result,fields){
      if(err) throw err;
      //dbprofila
      //console.log(result);
      const field = [];
      const mydata = [];
      for(let i=0;i<fields.length;i++){
        if(fields[i].name!=undefined) field[i]=fields[i].name;
      }
      for(let i=0;i<result.length;i++){
        if(result[i]!=undefined) mydata[i]=values(result[i]);
      }
      //console.log(field);
      //console.log(mydata);
      var writer = csvWriter({ headers: field})
      writer.pipe(fs.createWriteStream('pemasukan.csv'))
      for(let i = 0; i < mydata.length; i++){
        mydata[i][1] = dateformat(mydata[i][1],"dd/mmmm/yyyy");
        writer.write(mydata[i]);
      }
      writer.end();

      var download = '';
      download += "<form action='/html/income' method='post' target='_blank'>";
      download += "<label>Download File Pemasukan</label><input type='submit' name='' value='download pemasukan'></input></form>";
      $(download).appendTo(".form");


      var isiTabel = '';
      var isiTabel = "<table class='content'><tr class='file'>";
      for(let i=0;i<fields.length;i++){
        isiTabel += "<th>"+field[i]+"</th>";
      }
      isiTabel += "</tr>";
      for(let i=0;i<result.length;i++){
        isiTabel += "<tr class='file'>";
        isiTabel += "<td>"+result[i].ID+"</td>"
        + "<td>"+dateformat(result[i].waktu_booking,"dd/mmmm/yyyy")+"</td>"
        + "<td>"+result[i].total_biaya+"</td>"
        + "<td>"+result[i].denda+"</td><td>"+result[i].sisa+"</td>"
        + "</tr>"
      }
      //console.log(field);
      //console.log(mydata);
      $(isiTabel).appendTo("table");

      // create graph
     //$("<script type='text/javascript' src='/graph_income.js'></script>").appendTo("body");



     res.send($('html').html());


    });
  });
});

app.post('/html/invoice', urlencodedParser, function(req, res){
  //donwload file lalu kemblai
  res.download("invoice.csv", "invoice_gear.csv");
});

app.post('/html/gear', urlencodedParser, function(err, res){
  //donwload file lalu kembali
  res.download("list_gear.csv", "list_gear.csv");
});

app.post('/html/frequentgear', urlencodedParser, function(err, res){
  //donwload file lalu kembali
  res.download("penyewaan_gear.csv", "penyewaan_gear.csv");
});

app.post('/html/gearrusak', urlencodedParser, function(err, res){
  //donwload file lalu kembali
  res.download("kerusakan.csv", "list_kerusakan.csv");
});

app.post('/html/penyewa', urlencodedParser, function(err, res){
  //donwload file lalu kembali
  res.download("penyewa.csv", "profil_penyewa.csv");
});

app.post('/html/frequentdest', urlencodedParser, function(err, res){
  //donwload file lalu kembali
  res.download("tujuan.csv", "list_tujuan.csv");
});

app.post('/html/income', urlencodedParser, function(err, res){
  //donwload file lalu kembali
  res.download("pemasukan.csv", "pemasukan.csv");
});

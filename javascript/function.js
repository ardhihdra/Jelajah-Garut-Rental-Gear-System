function checkFormData() {
  var checkboxes = document.querySelectorAll('input[type="checkbox"]');
  var checkedOne = Array.prototype.slice.call(checkboxes).some(x => x.checked);

  if (checkedOne) {
      return true;
  } else {
    setTimeout(function(){alert("Minimal ada satu jaminan!");},1);
    document.getElementById("errMessage").innerHTML = "Check Box ga boleh kosong";
    return false;
  }
}

$("#image").change(function(){
  readURL(this);
  //other uploading proccess [server side by ajax and form-data ]
});

function readURL(input) {
  if (input.files && input.files[0]) {
      var reader = new FileReader();

      reader.onload = function (e) {
          $('#profile').attr('src', e.target.result);
          $('#foto').attr('value', e.target.result);
      }

      reader.readAsDataURL(input.files[0]);
  }
}

function konfirbarang(){
  setTimeout(function() { alert("Data termasukan :))"); }, 3);
}
function printInvoice(){}

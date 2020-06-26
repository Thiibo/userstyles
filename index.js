// Set logo size
$header = document.getElementsByTagName("header")[0];
$logo = document.getElementById("logo");
$logo.style.fontSize = $header.offsetHeight / 2 - 20 + "px";

// Select method
$methods = document.getElementsByClassName('method');

for (let i = 0; i < $methods.length; i++) {
  let $el = $methods.item(i);
  $el.addEventListener('click', function() {
    for (var i = 0; i < $methods.length; i++) $methods.item(i).classList.remove('selected');
    this.classList.add('selected');
  });
}


// Select userstyle
$userstyles = document.getElementsByClassName('userstyle');

for (let i = 0; i < $userstyles.length; i++) {
  let $el = $userstyles.item(i);
  $el.addEventListener('click', function() {
    for (var i = 0; i < $userstyles.length; i++) $userstyles.item(i).classList.remove('selected');
    this.classList.add('selected');
  });
}

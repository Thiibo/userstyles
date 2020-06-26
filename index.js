// ELEMENT DECLARATIONS
const $header = document.getElementsByTagName("header")[0];
const $logo = document.getElementById("logo");
const $methods = document.getElementsByClassName('method');
const $selectbaroptions = document.getElementsByClassName('selectbaroption');
const $userstyles = document.getElementsByClassName('userstyle');
const $settings = document.getElementById('settings');
const $settingslist = document.getElementById('settingslist');
const $pvwwindow = document.getElementById('previewwindow');

// VARIABLES
let method = 'ucs';
let userstyle = 'dse';
let cache = {}

// USEFULL FUNCTIONS
function getChildIndex($el) {
  let $n = $el;
  for (i = 0; $n = $n.previousSibling; i++);
  return Math.floor(i / 2);
}

async function fetchData(path) {
    const response = await fetch(path);
    return response.text();
}
async function fetchToCache(path, _isJSON) {
  if (!cache.hasOwnProperty(path)) {
    let data = await fetchData(path);
    cache[path] = _isJSON ? JSON.parse(data) : data;
    return true;
  } else {
    return false;
  }
}


// Set logo size
$logo.style.fontSize = $header.offsetHeight / 2 - 20 + "px";

// Select from selectbar
function selectbarClicked($el) {
  let selectbaroptions = $el.parentNode.children;
  for (var i = 0; i < selectbaroptions.length; i++) selectbaroptions[i].classList.remove('selected');
  $el.classList.add('selected');
  if ($el.classList.contains('method')) {
    method = $el.getAttribute('code');
    setSections();
  }
}
for (var i = 0; i < $methods.length; i++) $methods.item(i).addEventListener('click', function() {selectbarClicked(this)});

// Select userstyle
for (let i = 0; i < $userstyles.length; i++) {
  $userstyles.item(i).addEventListener('click', function() {
    for (var i = 0; i < $userstyles.length; i++) $userstyles.item(i).classList.remove('selected');
    this.classList.add('selected');
    userstyle = this.getAttribute('code');
    setSections();
  });
}

// Settings
function resized() {
  // Get screen height and width
  var wWidth = window.innerWidth
  || document.documentElement.clientWidth
  || document.body.clientWidth;
  var wHeight = window.innerHeight
  || document.documentElement.clientHeight
  || document.body.clientHeight;

  // Set previewwindow height and width
  $pvwwindow.style.height = $pvwwindow.offsetWidth * (wHeight / wWidth) + "px";
}
window.addEventListener("resize", resized);
resized();

// Set section visibility and settings
async function setSections() {
  if ((method === 'hjs' || method === 'hcs' || method === 'pcs') && (userstyle === 'dse' || userstyle === 'sah')) {
    // Load settings
    let cachePath = './data/settings/' + userstyle + '.json';
    await fetchToCache(cachePath, true);
    // Update HTML
    let settings = document.createElement('ul');
    for (let [option, optionValue] of Object.entries(cache[cachePath])) {
      // Create setting
      let setting = document.createElement('li');
      setting.classList.add('setting');

      // Create and append label
      let label = document.createElement('label');
      label.innerHTML = optionValue.label + (optionValue.type !== 'checkbox' ? ': ' : '');
      setting.appendChild(label);

      // Create content
      let optionContent;
      if (optionValue.type === 'selectbar') {
        optionContent = document.createElement('ul');
        for (let [selectOption, selectOptionValue] of Object.entries(optionValue.options)) {
          let li = document.createElement('li');
          li.classList.add('selectbaroption');
          li.setAttribute('onclick', 'selectbarClicked(this)');
          li.innerHTML = selectOptionValue.label;
          optionContent.appendChild(li);
        }
        optionContent.firstChild.classList.add('selected');
      } else {
        optionContent = document.createElement('div');
      }
      optionContent.classList.add('content');
      optionContent.classList.add(optionValue.type);
      if (optionValue.type === 'checkbox') {
        setting.prepend(optionContent);
      } else {
        setting.appendChild(optionContent);
      }

      // Append setting
      settings.appendChild(setting);
    }
    // Update settings
    $settingslist.innerHTML = settings.innerHTML;

    // Show settings
    $settings.classList.remove('hidden');
  } else {
    $settings.classList.add('hidden');
  }
  resized();
}
setSections();

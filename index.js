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
let cache = {};
let settings = {};

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

// Select userstyle
for (let i = 0; i < $userstyles.length; i++) {
  $userstyles.item(i).addEventListener('click', function() {
    for (var i = 0; i < $userstyles.length; i++) $userstyles.item(i).classList.remove('selected');
    this.classList.add('selected');
    userstyle = this.getAttribute('code');
    setSections();
  });
}

// Select from selectbar
function selectbarClicked($el) {
  let selectbaroptions = $el.parentNode.children;
  for (var i = 0; i < selectbaroptions.length; i++) selectbaroptions[i].classList.remove('selected');
  $el.classList.add('selected');
  if ($el.classList.contains('method')) {
    method = $el.getAttribute('code');
    setSections();
  } else {
    settings[$el.parentNode.parentNode.getAttribute('code')] = $el.getAttribute('code');
  }
}
for (var i = 0; i < $methods.length; i++) $methods.item(i).addEventListener('click', function() {selectbarClicked(this)});

// Click checkbox
function checkboxClicked($el) {
  $el.classList.toggle('active');
  settings[$el.parentNode.getAttribute('code')] = $el.classList.contains('active');
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

// Set section visibility and settings
async function setSections() {
  if ((method === 'hjs' || method === 'hcs' || method === 'pcs') && (userstyle === 'dse' || userstyle === 'sah')) {
    // Load settings
    let cachePath = './data/settings/' + userstyle + '.json';
    await fetchToCache(cachePath, true);
    // Update HTML
    let $newsettings = document.createElement('ul');
    for (let [option, optionValue] of Object.entries(cache[cachePath])) {
      // Create setting
      let $setting = document.createElement('li');
      $setting.classList.add('setting');

      // Create and append label
      let $label = document.createElement('label');
      $label.innerHTML = optionValue.label + (optionValue.type !== 'checkbox' ? ': ' : '');
      $setting.appendChild($label);

      // Create content
      let $optionContent;
      if (optionValue.type === 'selectbar') {
        $optionContent = document.createElement('ul');
      } else {
        $optionContent = document.createElement('div');
      }
      // Type specific functionality
      switch (optionValue.type) {
        case 'selectbar':
          // Create individual options
          for (let [selectOption, selectOptionValue] of Object.entries(optionValue.options)) {
            let $li = document.createElement('li');
            $li.classList.add('selectbaroption');
            $li.setAttribute('onclick', 'selectbarClicked(this)');
            $li.setAttribute('code', selectOption)
            $li.innerHTML = selectOptionValue.label;
            $optionContent.appendChild($li);
          }
          // Set default
          $optionContent.firstChild.classList.add('selected');
          settings[option] = $optionContent.firstChild.getAttribute('code');
          break;
        case 'checkbox':
          $optionContent.setAttribute('onclick', 'checkboxClicked(this)');
          if (optionValue.hasOwnProperty('group')) {
            $optionContent.classList.add('hasGroup');
            let $group = document.createElement('div');
            $group.classList.add('group', 'hidden');
          }
          break;
        default:

      }
      $optionContent.classList.add('content', optionValue.type);
      if (optionValue.type === 'checkbox') {
        $setting.prepend($optionContent);
      } else {
        $setting.appendChild($optionContent);
      }
      $setting.setAttribute('code', option);

      // Append setting
      $newsettings.appendChild($setting);
    }
    // Update settings
    $settingslist.innerHTML = $newsettings.innerHTML;

    // Show settings
    $settings.classList.remove('hidden');
  } else {
    $settings.classList.add('hidden');
  }
  resized();
}
setSections();

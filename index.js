// ELEMENT DECLARATIONS
const $header = document.getElementsByTagName("header")[0];
const $logo = document.getElementById("logo");
const $methods = document.getElementsByClassName('method');
const $userstyles = document.getElementsByClassName('userstyle');
const $settings = document.getElementById('settings');
const $settingslist = document.getElementById('settingslist');
const $pvwwindow = document.getElementById('previewwindow');
const $saveLinkInput = document.getElementById('saveLinkInput');
const $saveLinkCopy = document.getElementById('saveLinkCopy');

// VARIABLES
let cache = {};
let settings = {};

// Test if current method and userstyle have settings
var hasSettings = () => (method === 'hjs' || method === 'hcs' || method === 'pcs') && (userstyle === 'dse' || userstyle === 'sah');

// Read URL
let myURL = new URL(window.location.href);
let params = new URLSearchParams(myURL.search);
let method = params.has('m') ? params.get('m') : 'usc';
let userstyle = params.has('s') ? params.get('s') : 'dse';
async function readURL() {
  for (var i = 0; i < $methods.length; i++) if ($methods[i].getAttribute('code') === method) {$methods[i].classList.add('selected'); break;}
  for (var i = 0; i < $userstyles.length; i++) if ($userstyles[i].getAttribute('code') === userstyle) {$userstyles[i].classList.add('selected'); break;}
  await setSections();
  updateURL();
}
readURL();

// Fetching data in general
async function fetchData(path) {
    const response = await fetch(path);
    return response.text();
}
// Fetching data to cache
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


// If selected userstyle
for (let i = 0; i < $userstyles.length; i++) {
  $userstyles.item(i).addEventListener('click', async function() {
    for (var i = 0; i < $userstyles.length; i++) $userstyles.item(i).classList.remove('selected');
    this.classList.add('selected');
    userstyle = this.getAttribute('code');
    // Clear settings
    for (let [key, value] of Object.entries(settings)) params.delete(key);
    settings = {};
    await setSections();
    updateURL();
  });
}

// If selected from selectbar
async function selectbarClicked($el) {
  let $selectbaroptions = $el.parentNode.children;
  for (var i = 0; i < $selectbaroptions.length; i++) $selectbaroptions[i].classList.remove('selected');
  $el.classList.add('selected');
  // If selected method
  if ($el.classList.contains('method')) {
    method = $el.getAttribute('code');
    // Clear settings
    for (let [key, value] of Object.entries(settings)) params.delete(key);
    await setSections();
  } else {
    settings[$el.parentNode.parentNode.getAttribute('code')] = $el.getAttribute('code');
  }
  updateURL();
}
for (var i = 0; i < $methods.length; i++) $methods.item(i).addEventListener('click', function() {selectbarClicked(this)});

// If clicked checkbox
function checkboxClicked($el) {
  $el.classList.toggle('active');
  settings[$el.parentNode.getAttribute('code')] = $el.classList.contains('active');
  if ($el.classList.contains('hasGroup')) $el.nextElementSibling.nextElementSibling.classList.toggle('hidden');
  updateURL();
}


// Update URL
function updateURL() {
  // -- Update params
  // Method and userstyle
  params.set('m', method);
  params.set('s', userstyle);
  // Settings
  if (hasSettings()) for (let [key, value] of Object.entries(settings)) params.set(key, value);
  // --
  // Update full URL
  window.history.replaceState({}, '', `${window.location.pathname}?${params}`);
  // Update link for sharing
  $saveLinkInput.value = window.location.href;
}

// If window resized...
function resized() {
  // Get screen height and width
  var wWidth = window.innerWidth
  || document.documentElement.clientWidth
  || document.body.clientWidth;
  var wHeight = window.innerHeight
  || document.documentElement.clientHeight
  || document.body.clientHeight;

  // Set preview window height and width
  $pvwwindow.style.height = $pvwwindow.offsetWidth * (wHeight / wWidth) + "px";
}
window.addEventListener("resize", resized);

// Set section visibility and settings
async function setSections() {
  if (hasSettings()) {
    // Load settings
    let cachePath = './data/settingsandpvw/' + userstyle + '.json';
    await fetchToCache(cachePath, true);
    // Update settings
    $settingslist.innerHTML = settingsToHTML(cache[cachePath]).innerHTML;
    // Add functionality to color inputs
    addColorPickers(document.querySelectorAll('#settingslist .color'));
    // Show settings
    $settings.classList.remove('hidden');
  } else {
    $settings.classList.add('hidden');
  }
  resized();
}

// Clicked on copy button of sharing section
$saveLinkCopy.addEventListener('click', function() {
  $saveLinkInput.select();
  $saveLinkInput.setSelectionRange(0, 99999);
  document.execCommand('copy');
});

// Convert settings from JSON to HTML
function settingsToHTML(src) {
  let $newsettings = document.createElement('ul');
  for (let [option, optionValue] of Object.entries(src)) {
    // Create setting
    let $setting = document.createElement('li');
    $setting.classList.add('setting');

    // Create and append label
    let $label = document.createElement('label');
    $label.innerHTML = optionValue.label + (optionValue.type === 'selectbar' ? ': ' : '');
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
        // Set state
        settings[option] = params.has(option) ? params.get(option) : $optionContent.firstChild.getAttribute('code');
        let $children = $optionContent.children;
        for (var i = 0; i < $children.length; i++) if ($children[i].getAttribute('code') === settings[option]) {$children[i].classList.add('selected'); break;}
        break;
      case 'checkbox':
        $optionContent.setAttribute('onclick', 'checkboxClicked(this)');
        // Set state
        settings[option] = params.has(option) ? params.get(option).toLowerCase() === 'true' : typeof optionValue.default === 'undefined' ? false : optionValue.default;
        if(settings[option]) $optionContent.classList.add('active');
        if (optionValue.hasOwnProperty('group')) {
          $optionContent.classList.add('hasGroup');
          let $group = document.createElement('ul');
          $group.classList.add('group');
          if (!settings[option]) $group.classList.add('hidden');
          $group.innerHTML = settingsToHTML(optionValue.group).innerHTML;
          $setting.appendChild($group);
        }
        break;
      case 'color':
        // Set state
        settings[option] = params.has(option) ? params.get(option) : optionValue.default;
        $optionContent.setAttribute('default', settings[option]);
        // The color pickers themselves will be added via addColorPickers() after all of the elements become part of the DOM.
        break;
      default:
        console.error("Could not identify setting type \"" + optionValue.type + "\"");
    }
    $optionContent.classList.add('content', optionValue.type);
    if (optionValue.type === 'selectbar') {
      $setting.appendChild($optionContent);
    } else {
      $setting.prepend($optionContent);
      $setting.classList.add('spaceunder');
    }
    $setting.setAttribute('code', option);

    // Append setting
    $newsettings.appendChild($setting);
  }
  return $newsettings;
}

// Add color pickers
function addColorPickers($els) {
  for (var i = 0; i < $els.length; i++) {
    let $pickr = document.createElement('div');
    $els[i].appendChild($pickr);
    const pickr = Pickr.create({
      el: $pickr,
      default: $els[i].getAttribute('default'),
      theme: 'nano',
      swatches: [
        'rgb(244, 67, 54)',
        'rgb(233, 30, 99)',
        'rgb(156, 39, 176)',
        'rgb(103, 58, 183)',
        'rgb(63, 81, 181)',
        'rgb(33, 150, 243)',
        'rgb(3, 169, 244)',
        'rgb(0, 188, 212)',
        'rgb(0, 150, 136)',
        'rgb(76, 175, 80)',
        'rgb(139, 195, 74)',
        'rgb(205, 220, 57)',
        'rgb(255, 235, 59)',
        'rgb(255, 193, 7)'
      ],
      components: {
        // Main components
        preview: true,
        opacity: false,
        hue: true,
        // Input / output Options
        interaction: {
          hex: false,
          rgba: false,
          hsla: false,
          hsva: false,
          cmyk: false,
          input: true,
          clear: false,
          save: true
        }
      }
    });
    // Hide after saving and save into settings
    pickr.on('save', color => {
      pickr.hide();
      settings[pickr._root.root.parentNode.parentNode.getAttribute('code')] = color.toHEXA().toString();
      updateURL();
    });
  }
}

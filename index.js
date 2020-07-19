// ELEMENT DECLARATIONS
const $header = document.getElementsByTagName("header")[0];
const $logo = document.getElementById("logo");
const $methods = document.getElementsByClassName('method');
const $userstyles = document.getElementsByClassName('userstyle');
const $stylelist = document.getElementById('stylelist');
const $settings = document.getElementById('settings');
const $settingslist = document.getElementById('settingslist');
const $pvwrandomize = document.getElementById('pvwrandomize');
const $pvwwindow = document.getElementById('previewwindow');
const $pvwwarning = document.getElementById('pvwwarning');
const $saveLinkInput = document.getElementById('saveLinkInput');
const $saveLinkCopy = document.getElementById('saveLinkCopy');

// VARIABLES
let cache = {};
let settings = {};
var pvwColoring; // Global variable for setSections(), $pvwrandomize.click() and colorPvw()

// Set userstyles
const USERSTYLES = {
  "dse": "Dark Scratch Editor",
  "dhl": "Duolingo hide leagues",
  "sah": "Startpage ad highlighter",
  "cep": "Crowdin enhanced profile"
}
for (let [key, value] of Object.entries(USERSTYLES)) {
  // Create 'li'
  let $li = document.createElement('li');
  $li.setAttribute('code', key);
  $li.classList.add('userstyle');
  // Create 'li > img' and append
  let $img = document.createElement('img');
  $img.src = "./img/thumb/" + key + ".png"
  $img.setAttribute('alt', "Thumbnail for userstyle \"" + value + "\"");
  $li.appendChild($img);
  // Create 'li > span' and append
  let $span = document.createElement('span');
  $span.innerHTML = value;
  $li.appendChild($span);
  // Append 'li' and contents
  $stylelist.appendChild($li);

  // Set settings
  settings[key] = {};
}

// Test if current selected method and userstyle are compatible with built-in settings
var hasSettings = () => (method === 'hjs' || method === 'hcs' || method === 'pcs') && (cache['./data/settingsandpvw/' + userstyle + '.json'].hasOwnProperty('settings'));

// Read URL
let myURL = new URL(window.location.href);
let params = new URLSearchParams(myURL.search);
let method = params.has('m') ? params.get('m') : 'ucs';
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

// Adding CSS from obj
function updateCSS($el, css) {for (let [k, v] of Object.entries(css)) $el.style[k] = v;}

// Set logo size
$logo.style.fontSize = $header.offsetHeight / 2 - 20 + "px";


// If selected userstyle
for (let i = 0; i < $userstyles.length; i++) {
  $userstyles.item(i).addEventListener('click', async function() {
    // Set visual
    for (var i = 0; i < $userstyles.length; i++) $userstyles.item(i).classList.remove('selected');
    this.classList.add('selected');
    // Clear settings
    for (let [key, value] of Object.entries(settings[userstyle])) params.delete(key);
    let $pickrs = document.getElementsByClassName('pcr-app');
    while ($pickrs.length > 0) $pickrs[0].parentNode.removeChild($pickrs[0]);
    // Remove previous preview content
    $pvwwindow.innerHTML = "";
    // Update stuff
    userstyle = this.getAttribute('code');
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
    for (let [key, value] of Object.entries(settings[userstyle])) params.delete(key);
    await setSections();
  } else {
    settings[userstyle][$el.parentNode.parentNode.getAttribute('code')] = $el.getAttribute('code');
    console.log('bf: ' + $el.getAttribute('pvwmarkup'));
    if ($el.hasAttribute('pvwmarkup')) colorPvw(JSON.parse($el.getAttribute('pvwmarkup')));
  }
  updateURL();
}
for (var i = 0; i < $methods.length; i++) $methods.item(i).addEventListener('click', function() {selectbarClicked(this)});

// If clicked checkbox
function checkboxClicked($el) {
  $el.classList.toggle('active');
  settings[userstyle][$el.parentNode.getAttribute('code')] = $el.classList.contains('active');
  if ($el.classList.contains('hasGroup')) $el.nextElementSibling.nextElementSibling.classList.toggle('hidden');
  updateURL();
}

// If clicked on randomize
function randomizeSettings(src) {
  var randomProperty = function(obj) {
    var keys = Object.keys(obj);
    return obj[keys[ keys.length * Math.random() << 0]];
  };
  var getHex = (n) => n < 10 ? n : ['a', 'b', 'c', 'd', 'e', 'f'][n - 10];
  for (let [key, value] of Object.entries(src)) {
    switch (value.type) {
      case 'selectbar':
        pvwColoring = {...pvwColoring, ...randomProperty(value.options).pvwmarkup};
        break;
      case 'checkbox':
        if (value.hasOwnProperty('pvwmarkup') && Math.random() < 0.5) pvwColoring = {...pvwColoring, ...value.pvwmarkup}
        if (value.hasOwnProperty('group')) randomizeSettings(value.group);
        break;
      case 'color':
        let color = '#';
        for (var i = 0; i < 6; i++) color += getHex(Math.round(Math.random() * 15));
        pvwColoring[key] = color;
        break;
      default:
        console.error("Could not identify setting type \"" + optionValue.type + "\"");
    }
  }
}
$pvwrandomize.addEventListener('click', async function() {
  let cachePath = './data/settingsandpvw/' + userstyle + '.json';
  await fetchToCache(cachePath, true);
  pvwColoring = {};
  randomizeSettings(cache[cachePath].settings);
  console.log(pvwColoring);
  colorPvw(pvwColoring);
});


// Update URL
function updateURL() {
  // -- Update params
  // Method and userstyle
  params.set('m', method);
  params.set('s', userstyle);
  // Settings
  if (hasSettings()) for (let [key, value] of Object.entries(settings[userstyle])) params.set(key, value);
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
  // Load settings
  let cachePath = './data/settingsandpvw/' + userstyle + '.json';
  await fetchToCache(cachePath, true);
  // Update preview
  createPvw();
  if (hasSettings()) {
    // Update settings
    pvwColoring = {};
    $settingslist.innerHTML = settingsToHTML(cache[cachePath].settings).innerHTML;
    // Add functionality to color inputs
    addColorPickers(document.querySelectorAll('#settingslist .color'));
    $pvwwarning.classList.add('hidden');
    // Color preview
    console.log(pvwColoring);
    colorPvw(pvwColoring);
    $pvwrandomize.classList.add('hidden');
    $pvwwarning.classList.add('hidden');
  } else {
    let $small = document.createElement('small');
    if (cache[cachePath].hasOwnProperty('settings')) {
      $small.textContent = method === 'ucs' ? "The settings are editable in the extension" : "THe settings are editable at userstyles.org";
      $pvwrandomize.classList.remove('hidden');
      $pvwwarning.classList.remove('hidden')
    } else {
      $small.textContent = "There are no settings available for this userstyle";
      $pvwrandomize.classList.add('hidden');
      $pvwwarning.classList.add('hidden');
    }
    $settingslist.innerHTML = "";
    $settingslist.appendChild($small);
  }
  // Update preview width and height
  resized();
}

// Clicked on copy button of sharing section
$saveLinkCopy.addEventListener('click', function() {
  $saveLinkInput.select();
  $saveLinkInput.setSelectionRange(0, 99999);
  document.execCommand('copy');
});

// Create elements for preview(window)
function createPvw() {
  // Create divs function
  var createPvwDivs = function(src) {
    let $div = document.createElement('div');
    for (let [key, value] of Object.entries(src)) {
      let $el = document.createElement('div');
      // Set ID and class
      $el.setAttribute('id', 'pvw--' + key);
      $el.classList.add('pvwElement');
      // Set CSS
      updateCSS($el, value.css);
      // Add children
      if (value.hasOwnProperty('children')) $el.innerHTML = createPvwDivs(value.children).innerHTML;
      // Append to element
      $div.appendChild($el);
    }
    return $div;
  }

  // Creating preview
  let cachePath = './data/settingsandpvw/' + userstyle + '.json';
  $pvwwindow.innerHTML = createPvwDivs(cache[cachePath].preview).innerHTML;

  // Randomize coloring
  if (cache[cachePath].hasOwnProperty('settings')) {
    randomizeSettings(cache[cachePath].settings);
    colorPvw(pvwColoring);
  }
}
// Color pvw
function colorPvw(markup) {
  let $els = document.getElementsByClassName('pvwElement');
  for (var i = 0; i < $els.length; i++) {
    let key = $els[i].id.slice(5);
    if (markup.hasOwnProperty(key)) $els[i].style.backgroundColor = markup[key];
  }
  if (markup.hasOwnProperty('bg')) $pvwwindow.style.backgroundColor = markup['bg'];
}

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
    let $optionContent = document.createElement(optionValue.type === 'selectbar' ? 'ul' : 'div');
    // Type specific functionality
    switch (optionValue.type) {
      case 'selectbar':
        // Create individual options
        for (let [selectOption, selectOptionValue] of Object.entries(optionValue.options)) {
          let $li = document.createElement('li');
          $li.classList.add('selectbaroption');
          $li.setAttribute('onclick', 'selectbarClicked(this)');
          if (selectOptionValue.hasOwnProperty('pvwmarkup')) $li.setAttribute('pvwmarkup', JSON.stringify(selectOptionValue.pvwmarkup));
          $li.setAttribute('code', selectOption)
          $li.innerHTML = selectOptionValue.label;
          $optionContent.appendChild($li);
        }
        // Set state
        if (!settings[userstyle].hasOwnProperty(option)) settings[userstyle][option] = params.has(option) ? params.get(option) : $optionContent.firstChild.getAttribute('code');
        let $children = $optionContent.children;
        for (var i = 0; i < $children.length; i++) if ($children[i].getAttribute('code') === settings[userstyle][option]) {$children[i].classList.add('selected'); break;}
        // Add coloring to preview
        if (optionValue.options[settings[userstyle][option]].hasOwnProperty('pvwmarkup')) pvwColoring = {...pvwColoring, ...optionValue.options[settings[userstyle][option]].pvwmarkup};
        break;
      case 'checkbox':
        $optionContent.setAttribute('onclick', 'checkboxClicked(this)');
        // Set state
        if (!settings[userstyle].hasOwnProperty(option)) settings[userstyle][option] = params.has(option) ? params.get(option).toLowerCase() === 'true' : typeof optionValue.default === 'undefined' ? false : optionValue.default;
        if (settings[userstyle][option]) $optionContent.classList.add('active');
        if (optionValue.hasOwnProperty('group')) {
          $optionContent.classList.add('hasGroup');
          let $group = document.createElement('ul');
          $group.classList.add('group');
          if (!settings[userstyle][option]) $group.classList.add('hidden');
          $group.innerHTML = settingsToHTML(optionValue.group).innerHTML;
          $setting.appendChild($group);
        }
        // Add coloring to preview
        if (optionValue.hasOwnProperty('pvwmarkup') && settings[userstyle][option]) pvwColoring = {...pvwColoring, ...optionValue.pvwmarkup};
        break;
      case 'color':
        // Set state
        if (!settings[userstyle].hasOwnProperty(option)) settings[userstyle][option] = params.has(option) ? params.get(option) : optionValue.default;
        $optionContent.setAttribute('default', settings[userstyle][option]);
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
      settings[userstyle][pickr._root.root.parentNode.parentNode.getAttribute('code')] = color.toHEXA().toString();
      updateURL();
    });
  }
}

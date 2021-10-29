import * as monaco from 'monaco-editor';

require('./playground');
const { Store } = require('./store');

let editor = null;
let selectedPlayground = null;
let currentPlayground = null;
let currentId = null;

const colorEl = document.querySelector('input[type="color"]');
const demosEl = document.querySelector('.demos .grid');
const newEl = document.querySelector('.new');
const closeEl = document.querySelector('.close');
const demoNameEl = document.querySelector('.demo-name');
const searchFieldEl = document.querySelector('.search-field');
const delEl = document.querySelector('.delete');

const store = new Store();

const INITIAL_COLOR = '#21558C';
const INITIAL_CODE = `
/*
This is your new 1DIV!

You only have 1 element to style:
<div class="a"></a>
So get creative!

Tips:
- Use relative units so your demo works at any size.
- Use multiple background-images to draw shapes.
- Use ::before/::after pseudo-elements.
- Use multiple box-shadows to duplicate shapes.

You can't style the body or html elements. If you
want to change the background color, use the color
picker button in the bottom-right corner.
*/

.a {
  width: 90vh;
  aspect-ratio: 1;
  border-radius: 50%;
  background: gold;
  box-shadow:
    inset 0 0 0 10vh #0001,
    inset 0 0 0 20vh #0001,
    inset 0 0 0 30vh #0001,
    inset 0 0 0 40vh #0001;
}`;

function updatePlayground(cssText, bgColor, el) {
  el.css = cssText;
  if (bgColor) {
    el.style.backgroundColor = bgColor;

    colorEl.value = bgColor;
  }
}

function themeWindow(bgColor) {
  document.querySelector("meta[name=theme-color]").setAttribute('content', bgColor);
}

editor = monaco.editor.create(document.querySelector('.code'), {
  theme: 'vs-dark',
  model: monaco.editor.createModel(INITIAL_CODE, 'css'),
  wordWrap: 'off',
  minimap: {
    enabled: false
  },
  scrollbar: {
    vertical: 'auto'
  }
});

editor.getModel().onDidChangeContent(async () => {
  if (!selectedPlayground || !currentPlayground) {
    return;
  }
  updatePlayground(editor.getValue(), null, selectedPlayground);
  updatePlayground(editor.getValue(), null, currentPlayground);

  await store.set(currentId, editor.getValue(), colorEl.value);
});

// Re-layout on resize.
window.onresize = () => editor.layout();

// Response to color changes.
colorEl.addEventListener('input', async () => {
  if (!selectedPlayground || !currentPlayground) {
    return;
  }

  const color = colorEl.value;

  updatePlayground(editor.getValue(), color, selectedPlayground);
  updatePlayground(editor.getValue(), color, currentPlayground);
  themeWindow(color);

  await store.set(currentId, editor.getValue(), color);
});

// Populate the list of demos.
async function refreshAllStoredDemos() {
  demosEl.innerHTML = '';

  const demos = await store.getAll();

  for (const id in demos) {
    const { name, bgColor, cssText } = demos[id];

    const li = createDemo(id, name, bgColor, cssText);
    demosEl.appendChild(li);
  }
}

refreshAllStoredDemos();

function createDemo(id, name, bgColor, cssText) {
  const li = document.createElement('li');
  li.classList.add('demo');
  li.dataset.id = id;
  li.setAttribute('title', 'Edit this 1DIV');

  const playground = document.createElement('css-playground');
  updatePlayground(cssText, bgColor, playground);

  li.appendChild(playground);

  const h2 = document.createElement('h2');
  h2.textContent = name || 'Untitled';
  li.appendChild(h2);

  return li;
}

// Wire the new button.
newEl.addEventListener('click', async () => {
  const bgColor = INITIAL_COLOR;
  const cssText = INITIAL_CODE;

  const id = await store.createNew(cssText, bgColor);
  const li = createDemo(id, null, bgColor, cssText);
  demosEl.appendChild(li);

  await launchDemo(li);
});

// Load a demo on click.
addEventListener('click', async e => {
  const demo = e.target.closest('.demo');
  if (!demo) {
    return;
  }

  await launchDemo(demo);
});

async function launchDemo(demoEl) {
  currentId = demoEl.dataset.id;

  const data = await store.get(currentId);
  if (!data) {
    return;
  }
  const { name, bgColor, cssText } = data;

  editor.setValue(data.cssText);

  demoNameEl.value = name || 'Untitled';

  // Clone the css-playground and append it to the body so we can
  // make it full-size.
  selectedPlayground = demoEl.querySelector('css-playground');

  const rect = selectedPlayground.getBoundingClientRect();

  currentPlayground = document.createElement('css-playground');
  currentPlayground.style = `top:${rect.top}px;left:${rect.left}px;width:${rect.width}px;height:${rect.height}px;`;
  currentPlayground.classList.add('selected');

  updatePlayground(cssText, bgColor, currentPlayground);
  themeWindow(bgColor);

  document.body.appendChild(currentPlayground);
  document.body.classList.add('demo-selected');

  setTimeout(() => {
    const forceReflow = currentPlayground.offsetWidth;
    currentPlayground.classList.add('full-size');
  }, 0);
}

async function closeDemo() {
  if (!currentPlayground || !selectedPlayground) {
    return;
  }

  // Update the zoomed-out rect coordinates in case the window was resized.
  const rect = selectedPlayground.getBoundingClientRect();
  currentPlayground.style = `background-color:${selectedPlayground.style.backgroundColor};top:${rect.top}px;left:${rect.left}px;width:${rect.width}px;height:${rect.height}px;`;

  themeWindow('white');

  document.body.classList.remove('demo-selected');

  currentPlayground.classList.remove('full-size');

  return new Promise(r => {
    currentPlayground.addEventListener('transitionend', () => {
      if (!currentPlayground) {
        return;
      }
      currentPlayground.remove();

      currentPlayground = null;
      selectedPlayground = null;
      currentPlayground = null;

      r();
    });
  });
}

// Change the zoom level
addEventListener('click', e => {
  const button = e.target.closest('.zoom button');
  if (!button) {
    return;
  }

  const level = button.className.substring(5);
  demosEl.setAttribute('zoom-level', level);
});

// Close a demo
closeEl.addEventListener('click', async () => {
  await closeDemo();
});

// Rename a demo
demoNameEl.addEventListener('input', async () => {
  if (!currentPlayground) {
    return;
  }

  await store.setName(currentId, demoNameEl.value);
  selectedPlayground.nextElementSibling.textContent = demoNameEl.value;
});

// Search for demos
searchFieldEl.addEventListener('input', () => {
  demosEl.querySelectorAll('h2').forEach(h2 => {
    const demo = h2.parentNode;
    const matches = h2.textContent.toLowerCase().includes(searchFieldEl.value.toLowerCase());
    demo.classList.toggle('hidden', !matches);
  });
});

// Delete a demo
delEl.addEventListener('click', async () => {
  if (!currentPlayground) {
    return;
  }

  const demoToDelete = selectedPlayground.parentNode;

  await store.delete(currentId);
  await closeDemo();

  demoToDelete.classList.add('deleting');
  demoToDelete.addEventListener('transitionend', () => {
    demoToDelete.remove();
  });
});

// Don't try to squeeze our own titlebar if the window is too narrow.
if (navigator.windowControlsOverlay) {
  navigator.windowControlsOverlay.addEventListener('geometrychange', () => {
    const { width } = navigator.windowControlsOverlay.getBoundingClientRect();

    // Yes, we could do this with a media-query, but we only care
    // if the window-controls-overlay feature is being used.
    document.body.classList.toggle('narrow', width < 250);
  });
}

const selectionPageElement = document.getElementById('selection-page');
const testPageElement = document.getElementById('test-page');
const settingsPageElement = document.getElementById('settings-page');
const userPageElement = document.getElementById('user-page');

let currentPageElement = document.querySelector('.page.active');
let state = false;

async function switchPage(pageElement, listen = false) {
    if (state || pageElement === currentPageElement)
        return;
    if (listen)
        enableKeyListener();
    else
        disableKeyListener();
    currentPageElement.classList.remove('active')
    state = true;
    await sleep(300);
    currentPageElement.style.display = null;
    currentPageElement = pageElement;
    currentPageElement.style.display = 'flex';
    await sleep(300);
    currentPageElement.classList.add('active');
    state = false;
}
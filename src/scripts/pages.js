const selectionPageElement = document.getElementById('selection-page');
const testPageElement = document.getElementById('test-page');

let currentPageElement = document.querySelector('.page.active');

async function switchPage(pageElement) {
    currentPageElement.classList.remove('active')
    await sleep(1000);
    currentPageElement = pageElement;
    currentPageElement.classList.add('active');
}
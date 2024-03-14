class Request {

    constructor(passage) {
        this.endpoint = `https://api.esv.org/v3/passage/text/`;
        this.passage = passage;
        this.parameters = new Map();
    }

    setIncludePassageReferences(includePassageReferences) {
        this.parameters.set('include-passage-references', includePassageReferences);
        return this;
    }

    setIncludeVerseNumbers(includeVerseNumbers) {
        this.parameters.set('include-verse-numbers', includeVerseNumbers);
        return this;
    }

    setIncludeFirstVerseNumbers(includeFirstVerseNumbers) {
        this.parameters.set('include-first-verse-numbers', includeFirstVerseNumbers);
        return this;
    }

    setIncludeFootnotes(includeFootnotes) {
        this.parameters.set('include-footnotes', includeFootnotes);
        return this;
    }

    setIncludeFootnoteBody(includeFootnoteBody) {
        this.parameters.set('include-footnote-body', includeFootnoteBody);
        return this;
    }

    setIncludeHeadings(includeHeadings) {
        this.parameters.set('include-headings', includeHeadings);
        return this;
    }

    setIncludeShortCopyright(includeShortCopyright) {
        this.parameters.set('include-short-copyright', includeShortCopyright);
        return this;
    }

    setIncludeCopyright(includeCopyright) {
        this.parameters.set('include-copyright', includeCopyright);
        return this;
    }

    setIncludePassageHorizontalLines(includePassageHorizontalLines) {
        this.parameters.set('include-passage-horizontal-lines', includePassageHorizontalLines);
        return this;
    }

    setIncludeHeadingHorizontalLines(includeHeadingHorizontalLines) {
        this.parameters.set('include-heading-horizontal-lines', includeHeadingHorizontalLines);
        return this;
    }

    setHorizontalLineLength(horizontalLineLength) {
        this.parameters.set('horizontal-line-length', horizontalLineLength);
        return this;
    }

    setIncludeSelahs(includeSelahs) {
        this.parameters.set('include-selahs', includeSelahs);
        return this;
    }

    setIndentUsing(indentUsing) {
        this.parameters.set('indent-using', indentUsing);
        return this;
    }

    setIndentParagraphs(indentParagraphs) {
        this.parameters.set('indent-paragraphs', indentParagraphs);
        return this;
    }

    setIndentPoetry(indentPoetry) {
        this.parameters.set('indent-poetry', indentPoetry);
        return this;
    }

    setIndentPoetryLines(indentPoetryLines) {
        this.parameters.set('indent-poetry-lines', indentPoetryLines);
        return this;
    }

    setIndentDeclares(indentDeclares) {
        this.parameters.set('indent-declares', indentDeclares);
        return this;
    }

    setIndentPsalmDoxology(indentPsalmDoxology) {
        this.parameters.set('indent-psalm-doxology', indentPsalmDoxology);
        return this;
    }

    setLineLength(lineLength) {
        this.parameters.set('line-length', lineLength);
        return this;
    }

    fetch() {
        let url = `${this.endpoint}?q=${encodeURIComponent(this.passage)}`;
        this.parameters.forEach((value, key) => {
            url += `&${key}=${value}`;
        });
        return fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Token ${API_KEY}`
            }
        })
    }
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// elements
const passageInputElement = document.getElementById('passage-input');
const passageInputButtonElement = document.getElementById('passage-input-button');
const passageTitleElement = document.getElementById('passage-title');

const testNavbarButtonElement = document.getElementById('test-navbar-button');
const settingsNavbarButtonElement = document.getElementById('settings-navbar-button');
const userNavbarButtonElement = document.getElementById('user-navbar-button');

// state
let currentTokenTracker;
let currentTokenInputHandler;
let currentPassage;

// navbar listeners
testNavbarButtonElement.addEventListener('click', async () => {
    if (currentTokenTracker)
        await switchPage(testPageElement, true);
    else {
        await switchPage(selectionPageElement);
        passageInputElement.focus();
    }
});

settingsNavbarButtonElement.addEventListener('click', async () => {
    await switchPage(settingsPageElement);
});

userNavbarButtonElement.addEventListener('click', async () => {
    await switchPage(userPageElement);
});

// passage selection listeners
passageInputButtonElement.addEventListener('click', async () => {
    await inputPassage(passageInputElement.value);
});

passageInputElement.addEventListener('keydown', async event => {
    if (event.key === 'Enter')
        await inputPassage(passageInputElement.value);
});

passageTitleElement.addEventListener('click', async () => {
    await switchPage(selectionPageElement);
    passageInputElement.focus();
});

// input passage
const keyListener = event => {
    if (event.metaKey || event.ctrlKey)
        return;

    const result = currentTokenInputHandler.handle(event.key, false);
    if (result) {
        event.preventDefault();
        event.stopPropagation();
        window.scrollTo({
            top: testPageElement.scrollHeight,
        });
    }
}

function enableKeyListener() {
    document.addEventListener('keydown', keyListener);
}

function disableKeyListener() {
    document.removeEventListener('keydown', keyListener)
}

async function inputPassage(passage) {

    async function playError() {
        passageInputElement.style.outline = '2px solid var(--main-error-color)';
        await sleep(1000);
        passageInputElement.style.outline = '2px solid var(--main-background-color)';
    }

    if (!passage)
        return playError();

    if (currentPassage === passage) {
        await switchPage(testPageElement, true);
        return;
    }

    currentPassage = passage;

    // remove current token tracker
    if (currentTokenTracker)
        currentTokenTracker.removeAll();

    const request = new Request(passage)
        .setIncludeFootnotes(false)
        .setIncludeShortCopyright(false)
        .setIncludePassageHorizontalLines(true)
        .setIncludeHeadingHorizontalLines(true)
        .setIndentUsing('tab')
        .setIndentParagraphs(1)
        .setIndentPoetry(true)
        .setIndentPoetryLines(1)
        .setHorizontalLineLength(5);

    const response = await request.fetch();

    if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

    const data = await response.json();
    if (!data.canonical || data.passages.length !== 1)
        return playError();

    const tokens = parseTokens(data.passages[0]);
    currentTokenTracker = new TokenTracker(tokenContainerElement, tokens, true);

    passageTitleElement.innerText = data.canonical;

    await switchPage(testPageElement, true);
    currentTokenInputHandler = new TokenInputHandler(currentTokenTracker, tokenInputHandlerSettings);
    currentTokenInputHandler.autofill(new Token(null, null));
}

// testing
// inputPassage('2 Timothy 2');

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

// elements

const passageInputElement = document.getElementById('passage-input');
const passageInputButtonElement = document.getElementById('passage-input-button');
const passageTitle = document.getElementById('passage-title');
const caret = document.getElementById('caret');

// settings
const autoFillHeaders = true;
const autoFillChapters = true;
const autoFillVerses = true;
const autoFillIndentation = true;
const autoFillLineBreaks = true;
const autoFillPunctuation = true;
const firstLetterOnly = false;
const ignoreCase = true;

let tokenTracker;

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

passageInputButtonElement.addEventListener('click', async () => {
    await inputPassage(passageInputElement.value);
});

async function inputPassage(passage) {

    async function playError() {
        passageInputElement.style.outline = '2px solid var(--main-error-color)';
        await sleep(1000);
        passageInputElement.style.outline = '2px solid var(--main-background-color)';
    }

    if (!passage)
        return playError();

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
    tokenTracker = new TokenTracker(tokenContainerElement, tokens);

    passageTitle.innerText = data.canonical;

    await switchPage(testPageElement);
    const tokenInputHandler = new TokenInputHandler(tokenTracker, {
        autoFillHeaders: false,
        autoFillChapters: false,
        autoFillVerses: false,
        autoFillPunctuation: false,
        autoFillLineBreaks: false,
        autoFillSpaces: false,
        autoFillIndentation: true,
        autoFillWords: true,
        ignoreCase: true,
    });
    tokenInputHandler.autofill(new Token(null, null));
    document.addEventListener('keydown', event => {
        if (event.metaKey || event.ctrlKey)
            return;

        const result = tokenInputHandler.handle(event.key, false);
        if (result) {
            console.log(event.key);
            event.preventDefault();
            event.stopPropagation();
            window.scrollTo({
                top: testPageElement.scrollHeight,
            });
        }
    });
}

// testing
inputPassage('2 Timothy 1');

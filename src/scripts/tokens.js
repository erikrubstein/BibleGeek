// elements
const tokenContainerElement = document.getElementById('token-container');

// token class
class Token {

    constructor(type, value) {
        this.type = type;
        this.value = value;
    }
}

// parse function
function parseTokens(text) {
    const tokens = [];
    let isPassage = false;
    let isHeader = false;
    let chapter = null;
    let isChapter = false;
    let isVerse = false;
    let isFirstVerse = true;
    let ignore = 0;

    const lines = text.split('\n');
    for (let i = 0; i < lines.length - 2; i++) {
        const line = lines[i];

        // ignore empty lines
        if (ignore > 0 && line === '') {
            ignore--;
            continue;
        }

        // check for passage {
        if (line === '=====') {
            isPassage = true;
            continue;
        }

        // process passage
        if (isPassage) {
            const segment = line.split(' ');
            const lastSegment = segment[segment.length - 1];
            if (lastSegment.match(/^\d+$/)) {
                chapter = lastSegment;
            }
            isPassage = false;
            continue;
        }

        // check for header
        if (line === '_____') {
            isHeader = true;
            continue;
        }

        // add line break token (if not first line)
        if (tokens.length > 0)
            tokens.push(new Token('line-break', '\n'));

        // simplify whitespace lines
        if (line.trim() === '')
            continue;

        // loop through characters
        for (let character of line) {
            switch (character) {
                case '—':
                    process('-');
                    process('-');
                    continue;
                case '’':
                    process('\'');
                    continue;
                case '“':
                case '”':
                    process('"');
                    continue;
                default:
                    process(character);
            }
        }

        function process(character) {

            // ignore characters
            if (ignore > 0) {
                ignore--;
                return;
            }

            // add header
            if (isHeader) {
                tokens.push(new Token('header', character.toUpperCase()));
                return;
            }

            // check for opening verse bracket
            if (!isVerse && character === '[') {
                isVerse = true;
                if (isFirstVerse && chapter !== null) {
                    isChapter = true;
                    if (tokens[tokens.length - 1].type === 'tab')
                        tokens.pop();
                    for (let chapterCharacter of chapter)
                        tokens.push(new Token('chapter', chapterCharacter));
                }
                isFirstVerse = false;
                return;
            }

            // check for closing number bracket
            if (isVerse && character === ']') {
                if (isChapter)
                    ignore = 1;
                isChapter = false;
                isVerse = false;
                return;
            }

            // check for number
            if (isVerse) {
                if (!isChapter)
                    tokens.push(new Token('verse', character));
                return;
            }


            // check for tab
            if (character === '\t') {
                tokens.push(new Token('tab', '   '));
                return;
            }

            // default
            tokens.push(new Token('character', character));
        }

        // reset header
        if (isHeader) {
            ignore = 1
            isHeader = false;
        }
    }
    return tokens;
}

class TokenTracker {

    constructor(tokenContainerElement, tokens, showGhost) {
        this.tokenContainerElement = tokenContainerElement;
        this.tokens = tokens;
        this.elementWrappers = [];
        this.elementTokenLengths = [];
        this.ghostElementWrappers = [];
        this.ghostElementTokenLengths = [];
        this.index = 0;
        this.invalidIndex = 0;

        this.mistakes = 0;

        if (showGhost) {
        }
    }

    fetchElement(type, fadeIn) {
        const length = this.elementWrappers.length;
        if (length === 0 || this.elementWrappers[length - 1][1] !== type) {

            if (type === 'invalid') {
                this.mistakes++;
                console.log('Mistakes: ' + this.mistakes);
            }

            const element = document.createElement('span');
            element.classList.add(type);
            if (fadeIn)
                element.classList.add('fade-in');
            this.elementWrappers.push([element, type]);
            this.tokenContainerElement.appendChild(element);
            return element;
        }
        return this.elementWrappers[length - 1][0];
    }

    fetchGhostElement

    append(fadeIn, token) {
        const element = this.fetchElement(token.type, fadeIn);
        element.textContent += token.value;
        this.elementTokenLengths.push(token.value.length);
        if (token.type === 'invalid')
            this.invalidIndex++;
        else
            this.index++;
    }

    remove() {
        if (this.elementWrappers.length === 0 || this.elementTokenLengths.length === 0)
            return;
        const elementWrapper = this.elementWrappers[this.elementWrappers.length - 1];
        const elementTokenLength = this.elementTokenLengths.pop();

        if (elementWrapper[0].textContent.length <= elementTokenLength) {
            elementWrapper[0].remove();
            this.elementWrappers.pop();
        } else {
            elementWrapper[0].textContent = elementWrapper[0].textContent.slice(0, -elementTokenLength);
        }

        if (elementWrapper[1] === 'invalid')
            this.invalidIndex--;
        else
            this.index--;
    }

    removeAll() {
        for (let i = 0; i < this.elementWrappers.length; i++)
            this.elementWrappers[i][0].remove();
        this.elementWrappers = [];
        this.elementTokenLengths = [];
        this.index = 0;
        this.invalidIndex = 0;
    }

    hasNextValidToken() {
        return this.index < this.tokens.length;
    }

    getNextValidToken() {
        return this.tokens[this.index];
    }

    isEmpty() {
        return this.elementWrappers.length === 0;
    }

    isInvalid() {
        return this.invalidIndex > 0;
    }
}
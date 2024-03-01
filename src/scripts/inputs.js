function isWhitespaceKey(key) {
    return key === ' ' || key === 'Tab' || key === 'Enter';
}

function isWhitespaceToken(token) {
    return token.type === null || token.type === 'line-break' || token.type === 'tab' || token.value === ' ';
}

function isPunctuationToken(token) {
    return token.value && token.value.match(/[.,;:!?"'-]/);
}

class TokenInputHandler {

    constructor(tokenTracker, options = {}) {
        this.tokenTracker = tokenTracker;
        this.options = options;
    }

    handle(key) {
        if (!this.tokenTracker.hasNextValidToken())
            return false;
        let token = this.tokenTracker.getNextValidToken();

        // handle backspace
        if (key === 'Backspace') {
            if (!this.tokenTracker.isEmpty())
                this.tokenTracker.remove();
            return true;
        }

        // auto fill punctuation
        if (!this.tokenTracker.isInvalid() && this.options.autoFillPunctuation && isWhitespaceKey(key) && isPunctuationToken(token)) {
            while (this.tokenTracker.hasNextValidToken()) {
                if (!isPunctuationToken(this.tokenTracker.getNextValidToken()))
                    break;
                token = this.tokenTracker.getNextValidToken();
                this.tokenTracker.append(false, token);
            }
            if (token.value && token.value !== key && key === ' ') {
                this.autofill(token);
                return true;
            }
        }
        
        // autofill line breaks on whitespace
        if (this.options.autoFillLineBreaks && token.type === 'line-break' && isWhitespaceKey(key)) {
            this.tokenTracker.append(false, token);
            this.autofill(token);
            return true;
        }

        // autofill spaces on whitespace
        if (this.options.autoFillSpaces && token.value === ' ' && isWhitespaceToken(token)) {
            this.tokenTracker.append(false, token);
            this.autofill(token);
            return true;
        }

        const appendElseInvalid = (condition, character) => {
            if (!this.tokenTracker.isInvalid() && condition) {
                this.tokenTracker.append(false, token);
            } else {
                this.tokenTracker.append(false, new Token('invalid', character));
            }
        }

        // handle enter
        if (key === 'Enter' || (this.options.autoFillLineBreaks && token.type === 'line-break' && isWhitespaceKey(key))) {
            appendElseInvalid(token.type === 'line-break', '↩\n');
            this.autofill(token);
            return true;
        }

        // handle tab
        if (key === 'Tab') {
            appendElseInvalid(token.type === 'tab', '-->');
            this.autofill(token);
            return true;
        }

        // handle character
        if (key.length === 1) {
            appendElseInvalid(token.value === key || (this.options.ignoreCase && token.value.toLowerCase() === key.toLowerCase()), key);
            this.autofill(token);
            return true;
        }

        return false;
    }

    autofill(previousToken) {
        if (this.tokenTracker.isInvalid() || !this.tokenTracker.hasNextValidToken())
            return;

        let token = this.tokenTracker.getNextValidToken();

        // autofill headers
        if (this.options.autoFillHeaders) {
            if (token.type === 'header') {
                this.tokenTracker.append(true, token);
                this.autofill(token);
                return;
            }
            if (previousToken.type === 'header' && token.type === 'line-break') {
                this.tokenTracker.append(false, token);
                this.autofill(token);
                return;
            }
        }

        // autofill chapters
        if (this.options.autoFillChapters && token.type === 'chapter') {
            this.tokenTracker.append(true, token);
            this.autofill(token);
            return;
        }

        // autofill verses
        if (this.options.autoFillVerses) {
            if (token.type === 'verse') {
                this.tokenTracker.append(true, token);
                this.autofill(token);
                return;
            }
            if (previousToken.type === 'verse' && token.value === ' ') {
                this.tokenTracker.append(false, token);
                this.autofill(token);
                return;
            }
        }

        // autofill indentation
        if (this.options.autoFillIndentation && previousToken.type === 'line-break') {
            while (this.tokenTracker.hasNextValidToken()) {
                if (!isWhitespaceToken(this.tokenTracker.getNextValidToken()))
                    break;
                token = this.tokenTracker.getNextValidToken();
                this.tokenTracker.append(false, token);
            }
            this.autofill(token);
            return;
        }

        // autofill words
        if (this.options.autoFillWords && !isWhitespaceToken(previousToken) && previousToken.type !== 'chapter') {
            console.log(previousToken.type, previousToken.value, token.value);
            this.tokenTracker.append(false, token);
            this.autofill(token);
            return;
        }
    }
}


function inputKey(event, ignoreInvalid = false) {
    if (tokenIndex >= tokens.length)
        return;

    const token = tokens[tokenIndex];

    // handle backspace
    if (event.key === 'Backspace') {
        if (tokenElements.length > 0) {
            const tokenElement = tokenElements[tokenElements.length - 1];
            const isInvalid = tokenElement.token instanceof InvalidToken;
            const isHeader = tokenElement.token instanceof HeaderToken;
            const isVerse = tokenElement.token instanceof VerseToken;
            const isCharacter = tokenElement.token instanceof CharacterToken;
            if (isInvalid || ((isHeader || isVerse || isCharacter) && tokenElement.token.value !== ' '))
                tokenElement.remove();
        }
        return;
    }

    // auto fill punctuation
    if (invalidTokenIndex === 0 && autoFillPunctuation && (event.key === ' ' || event.key === 'Tab' || event.key === 'Enter')) {
        if (token.value && token.value.match(/[.,;:!?"'-]/)) {
            token.appendElement()
            validateTokens(false, false, false);
            inputKey(event, true);
            return;
        }
    }

    // autofill line breaks on space
    if (invalidTokenIndex === 0 && autoFillLineBreaks && event.key === ' ' && token instanceof LineBreakToken) {
        token.appendElement();
        validateTokens(true, false, false);
        return;
    }

    // autofill space on return
    if (invalidTokenIndex === 0 && autoFillLineBreaks && event.key === 'Enter' && token.value === ' ') {
        token.appendElement();
        validateTokens(false, false, false);
        return;
    }

    // handle enter
    if (event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        if (invalidTokenIndex === 0 && token instanceof LineBreakToken) {
            token.appendElement()
            validateTokens(true, false, false);
        } else if (!ignoreInvalid) {
            new InvalidToken("↩\n").appendElement();
            validateTokens(false, false, false);
        }
        return;
    }

    // handle tab
    if (event.key === 'Tab') {
        event.preventDefault();
        event.stopPropagation();
        if (invalidTokenIndex === 0 && token instanceof TabToken) {
            token.appendElement()
            validateTokens(false, false, false);
        } else if (!ignoreInvalid) {
            new InvalidToken("-->").appendElement();
            validateTokens(false, false, false);
        }
        return;
    }

    // ignore invalid tokens
    if (event.key.length !== 1 || event.ctrlKey || event.metaKey)
        return;

    // handle character
    if (invalidTokenIndex === 0 && (event.key === token.value || (ignoreCase && token.value && event.key.toLowerCase() === token.value.toLowerCase()))) {
        event.preventDefault();
        event.stopPropagation();
        token.appendElement();

        window.scrollTo({
            top: document.body.scrollHeight,
            behavior: 'smooth'
        });

        validateTokens(false, false, false);
        return;
    }

    // ignore invalid tokens
    event.preventDefault();
    event.stopPropagation();
    if (!ignoreInvalid) {
        new InvalidToken(event.key).appendElement()
        validateTokens(false, false, false);
    }
}

function validateTokens(lineBreak, forceLineBreak, forceSpace) {
    if (tokenIndex >= tokens.length)
        return;

    const token = tokens[tokenIndex];

    if (autoFillHeaders && token instanceof HeaderToken) {
        token.appendElement(true);
        validateTokens(lineBreak, true, false);
        return;
    }

    if (autoFillChapters && token instanceof ChapterToken) {
        token.appendElement(true);
        validateTokens(lineBreak, false, false);
        return;
    }

    if (autoFillVerses && token instanceof VerseToken) {
        token.appendElement(true);
        validateTokens(lineBreak, false, true);
        return;
    }

    if ((forceLineBreak || (autoFillIndentation && lineBreak)) && token instanceof LineBreakToken) {
        token.appendElement();
        validateTokens(lineBreak, true, false);
        return;
    }

    if ((forceSpace || autoFillIndentation && lineBreak) && (token.value === ' ' || token instanceof TabToken)) {
        token.appendElement();
        validateTokens(lineBreak, false, false);
        return;
    }

    completeWordTokens(lineBreak, forceLineBreak, forceSpace);
}

function completeWordTokens(lineBreak, forceLineBreak, forceSpace) {
    if (tokenIndex >= tokens.length || tokenIndex === 0)
        return;

    let previousToken = tokens[tokenIndex - 1];
    let token = tokens[tokenIndex];
    if (previousToken.value === ' ' || invalidTokenIndex > 0)
        return;

    if (invalidTokenIndex === 0) {
        token.appendElement();
        if (token.value !== ' ')
            validateTokens(lineBreak, forceLineBreak, forceSpace);
    }
}
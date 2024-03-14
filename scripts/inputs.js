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
        if (!this.tokenTracker.isInvalid() && this.options.autofillPunctuation && isWhitespaceKey(key) && isPunctuationToken(token)) {
            while (this.tokenTracker.hasNextValidToken()) {
                if (!isPunctuationToken(this.tokenTracker.getNextValidToken()) && !(this.tokenTracker.getNextValidToken().value === ' ' && key === ' '))
                    break;
                token = this.tokenTracker.getNextValidToken();
                this.tokenTracker.append(false, token);
            }
            token = this.tokenTracker.getNextValidToken();
            if ((token.type !== 'line-break' && token.type !== 'tab') && token.value !== key && key === ' ') {
                this.autofill(token);
                return true;
            }
        }
        
        // autofill line breaks on whitespace
        if (!this.tokenTracker.isInvalid() && this.options.autofillLineBreaks && token.type === 'line-break' && isWhitespaceKey(key)) {
            this.tokenTracker.append(false, token);
            this.autofill(token);
            return true;
        }

        // autofill spaces on whitespace
        if (!this.tokenTracker.isInvalid() && this.options.autofillSpaces && token.value === ' ' && isWhitespaceToken(token)) {
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
        if (key === 'Enter' || (this.options.autofillLineBreaks && token.type === 'line-break' && isWhitespaceKey(key))) {
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
            appendElseInvalid(token.value === key || (this.options.autofillCase && token.value.toLowerCase() === key.toLowerCase()), key);
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
        if (this.options.autofillHeaders) {
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
        if (this.options.autofillChapters && token.type === 'chapter') {
            this.tokenTracker.append(true, token);
            this.autofill(token);
            return;
        }

        // autofill verses
        if (this.options.autofillVerses) {
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
        if (this.options.autofillIndentation && (previousToken.type === null || previousToken.type === 'line-break')) {
            let modified = false;
            while (this.tokenTracker.hasNextValidToken()) {
                if (!isWhitespaceToken(this.tokenTracker.getNextValidToken()))
                    break;
                token = this.tokenTracker.getNextValidToken();
                modified = true;
                this.tokenTracker.append(false, token);
            }

            if (modified) {
                this.autofill(token);
                return;
            }
        }

        // autofill words
        if (this.options.autofillWords && !isWhitespaceToken(previousToken) && previousToken.type !== 'chapter') {
            this.tokenTracker.append(false, token);
            this.autofill(token);
        }
    }
}

class Response {

    constructor(version = '1.0') {
        this.version = version;
        this.sessionAttributes = {};
        this.response = {
            shouldEndSession: false,
            outputSpeech: undefined,
            card: undefined,
            reprompt: {
                outputSpeech: undefined
            },
            directives: []
        };
    }

    say(text) {
        this.response.outputSpeech = this.createOutputSpeech(text);
        return this;
    }

    reprompt(text) {
        this.response.reprompt.outputSpeech = this.createOutputSpeech(text);
        return this;
    }

    createOutputSpeech(text) {
        const ssml = text.match(/^<speak>.*<\/speak>$/);
        return {
            type: ssml ? 'SSML' : 'PlainText',
            text: text
        };
    }

    setSessionAttribute(key, value) {
        this.sessionAttributes[key] = value;
        return this;
    }

    setCard(card) {
        this.response.card = card;
        return this;
    }

    addDirective(directive) {
        this.response.directives.push(directive);
        return this;
    }

    endSession() {
        this.response.shouldEndSession = true;
        return this;
    }

    get() {
        return {
            version: this.version,
            sessionAttributes: this.sessionAttributes,
            response: this.response
        };
    }
}

module.exports = Response;

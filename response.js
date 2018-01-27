
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

    say(text, ssml=false) {
        this.response.outputSpeech = this.createOutputSpeech(text, ssml)
    }

    reprompt(text, ssml=false) {
        this.response.reprompt.outputSpeech = this.createOutputSpeech(text, ssml);
    }

    createOutputSpeech(text, ssml=false) {
        return {
            type: ssml ? 'SSML' : 'PlainText',
            text: text
        };
    }

    setSessionAttribute(key, value) {
        this.sessionAttributes[key] = value;
    }

    setCard(card) {
        this.response.card = card;
    }

    addDirective(directive) {
        this.response.directives.push(directive);
    }

    endSession() {
        this.response.shouldEndSession = true;
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

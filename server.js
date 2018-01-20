const express = require('express');
const alexaVerifier = require('alexa-verifier-middleware');
const configParams = require('./config');
const Response = require('./response');

class AlexaSkillServer {

    constructor(config = {}) {
        this.version = '1.0';
        this.config = Object.assign(configParams, config);
        this.app = express();
        this.router = express.Router();
        this.server = null;

        if (this.config.prodEnv) {
            this.router.use(alexaVerifier);
        }

        this.router.get(this.config.apiRootPath, this.onRequest);
    }

    start() {
        const port = this.config.listenPort;
        const host = this.config.listenHost;

        const configStr = Object.keys(this.config).map(key => `${key}=${this.config[key]}`).join(' ');
        console.log(`Config: ${configStr}`);

        console.log('Starting server...');
        this.server = this.app.listen(port, host, () => {
            console.log(`Server started listening on ${host}:${port}`);
        });

        const stopSignals = ['SIGTERM', 'SIGINT'];

        stopSignals.forEach(signal => process.on(signal, () => {
            console.log(`Received shutdown signal (${signal})`);
            this.stop();
        }));
    }

    stop() {
        console.log('Stopping server...');
        this.server.close(() => {
            console.log('Server was stopped - Terminating process');
            process.exit();
        });

        setInterval(() => {
            console.error('Unable to stop server - forcefully shutting down now');
            process.exit();
        }, 3000);
    }

    onRequest(req, res) {
        console.log(`Request: ${req.body}`);

        const version = req.body.version;
        const session = req.body.session;
        const request = req.body.request;

        let response = null;

        if (!version || !session || !request) {
            response = this.onInvalidRequest(req);
            this.sendResponse(response);
            return;
        }

        if (!this.supportsApiVersion(version)) {
            response = this.onUnsupportedRequest(version);
            this.sendResponse(res, response);
            return;
        }

        switch(request.type) {
            case 'LaunchRequest':
                response = this.onLaunchRequest(request, session);
                break;
            case 'IntentRequest':
                response = this.onIntentRequest(request, session);
                break;
            case 'SessionEndedRequest':
                this.onSessionEndedRequest(request, session);
                break;
            default:
                response = this.onFallbackRequest(request, session);
        }

        this.sendResponse(res, response)
    }

    sendResponse(res, response) {
        if (!response) {
            return
        } else if (response instanceof Response) {
            res.json(response.get())
        } else {
            res.json(response);
        }
    }

    onLaunchRequest(request, session) {}

    onUnknownIntentRequest(request, session) {
        console.error(`Unknown intent ${request.intent.name}`);
    }

    onIntentRequest(request) {
        const intentName = request.intent.name;
        const intentRequestHandler = this[`on${intentName}IntentRequest`];
        if (typeof intentRequestHandler === 'function') {
            return intentRequestHandler(request);
        } else {
            return this.onUnknownIntentRequest(request);
        }
    }

    onSessionEndedRequest(request, session) {
        if (request.reason === 'ERROR') {
            console.error('Alexa ended the session due to an error');
        }
    }

    onFallbackRequest(request, session) {
        console.error(`Request type '${request.type}' not implemented`);
    }

    onUnsupportedRequest(version) {
        console.error(`Unsupported request of version '${version}'`);
    }

    onInvalidRequest(req) {
        console.error('Invalid request');
    }

    createResponse() {
        return Response(this.version);
    }

    supportsVersion(version) {
        return version === this.version;
    }
}

module.exports = AlexaSkillServer;

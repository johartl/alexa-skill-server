const express = require('express');
const alexaVerifier = require('alexa-verifier-middleware');
const winston = require('winston');
const morgan = require('morgan');
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

        // Set up logging
        this.logger = this.createLogger();
        const logStream = { write: (message, encoding) => this.logRequest(message) };
        const requestLogger = morgan('short', {stream: logStream});
        this.app.use(requestLogger);

        // Set up paths
        this.app.use(this.config.apiRootPath, this.router);
        this.router.get('/', this.getServerInfo.bind(this));
        this.router.post('/', this.onRequest.bind(this));
    }

    createLogger() {
        const logger = new winston.Logger({
            level: this.config.logLevel
        });

        logger.add(winston.transports.Console, {
            handleExceptions: true,
            humanReadableUnhandledException: true,
            json: false,
            timestamp: true,
            colorize: true
        });

        logger.add(winston.transports.File, {
            filename: this.config.logFile,
            colorize: false,
            json: false
        });

        return logger;
    }

    logRequest(message) {
        this.logger.debug(message);
    }

    start() {
        const port = this.config.listenPort;
        const host = this.config.listenHost;

        const configStr = Object.keys(this.config).map(key => `${key}=${this.config[key]}`).join(' ');
        this.logger.info(`Config: ${configStr}`);

        this.logger.info('Starting server...');
        this.server = this.app.listen(port, host, () => {
            this.logger.info(`Server started listening on ${host}:${port}`);
        });

        const stopSignals = ['SIGTERM', 'SIGINT'];

        stopSignals.forEach(signal => process.on(signal, () => {
            this.logger.info(`Received shutdown signal (${signal})`);
            this.stop();
        }));
    }

    stop() {
        this.logger.info('Stopping server...');
        this.server.close(() => {
            this.logger.info('Server was stopped - Terminating process');
            setTimeout(() => process.exit()); // flush logging stream before exiting
        });

        setInterval(() => {
            this.logger.info('Unable to stop server - forcefully shutting down now');
            setTimeout(() => process.exit()); // flush logging stream before exiting
        }, 3000);
    }

    getServerInfo(req, res) {
        res.send(`${this.constructor.name} running at version ${this.version}.`);
    }

    onRequest(req, res) {
        let response = null;

        if (!req.body || !req.body.version || !req.body.session|| !req.body.request) {
            response = this.onInvalidRequest(req);
            this.sendResponse(response);
            return;
        }

        const version = req.body.version;
        const session = req.body.session;
        const request = req.body.request;

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
        this.logger.error(`Unknown intent ${request.intent.name}`);
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
            this.logger.error('Alexa ended the session due to an error');
        }
    }

    onFallbackRequest(request, session) {
        this.logger.error(`Request type '${request.type}' not implemented`);
    }

    onUnsupportedRequest(version) {
        this.logger.error(`Unsupported request of version '${version}'`);
    }

    onInvalidRequest(req) {
        this.logger.error('Invalid request');
    }

    createResponse() {
        return Response(this.version);
    }

    supportsApiVersion(version) {
        return version === this.version;
    }
}

module.exports = AlexaSkillServer;

module.exports = {
    listenHost: process.env.LISTEN_HOST || '127.0.0.1',
    listenPort: process.env.LISTEN_PORT || 3000,
    prodEnv: process.env.NODE_ENV === 'prod',
    apiRootPath: process.env.API_ROOT_PATH || '/',
    logLevel: process.env.LOG_LEVEL || 'debug',
    logFile: process.env.LOG_FILE || 'server.log'
};

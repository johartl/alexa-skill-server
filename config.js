module.exports = {
    listenHost: overrideWithEnv('LISTEN_HOST', '127.0.0.1'),
    listenPort: overrideWithEnv('LISTEN_PORT', 3000),
    prodEnv: process.env.NODE_ENV === 'prod',
    apiRootPath: overrideWithEnv('API_ROOT_PATH', '/'),
    logLevel: overrideWithEnv('LOG_LEVEL', 'debug'),
    logFile: overrideWithEnv('LOG_FILE', 'server.log'),
    logRequestBody: ['true', 'on', 'yes'].includes(overrideWithEnv('LOG_LEVEL', 'true').toLowerCase()),
};

function overrideWithEnv(envKey, defaultValue) {
    return process.env[envKey] !== undefined ? process.env[envKey] : defaultValue;
}

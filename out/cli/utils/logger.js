let verboseMode = false;
export function setVerbose(verbose) {
    verboseMode = verbose;
}
export class Logger {
    scope;
    constructor(scope) {
        this.scope = scope;
    }
    write(level, message, meta) {
        // In non-verbose mode, only show warnings and errors
        if (!verboseMode && (level === 'debug' || level === 'info')) {
            return;
        }
        const timestamp = new Date().toISOString();
        const suffix = meta ? ` ${JSON.stringify(meta)}` : '';
        console[level](`[${timestamp}] [${this.scope}] ${message}${suffix}`);
    }
    debug(message, meta) {
        this.write('debug', message, meta);
    }
    info(message, meta) {
        this.write('info', message, meta);
    }
    warn(message, meta) {
        this.write('warn', message, meta);
    }
    error(message, meta) {
        this.write('error', message, meta);
    }
}
//# sourceMappingURL=logger.js.map
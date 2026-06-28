const formatMessage = (level, message, ...args) => {
  const timestamp = new Date().toISOString();
  let extra = '';
  if (args.length > 0) {
    extra = args.map(arg => {
      if (arg instanceof Error) {
        return `${arg.message}\n${arg.stack || ''}`;
      }
      return typeof arg === 'object' ? JSON.stringify(arg) : arg;
    }).join(' ');
  }
  return `[${timestamp}] [${level}] ${message} ${extra}`.trim();
};

export const logger = {
  info: (message, ...args) => {
    console.log(formatMessage('INFO', message, ...args));
  },
  warn: (message, ...args) => {
    console.warn(formatMessage('WARN', message, ...args));
  },
  error: (message, ...args) => {
    console.error(formatMessage('ERROR', message, ...args));
  },
};

export default logger;

import pc from 'picocolors';

const getTimestamp = () => {
  const now = new Date();
  return now.toTimeString().split(' ')[0];
};

export const logger = {
  info: (msg) => {
    console.log(`${pc.gray(`[${getTimestamp()}]`)} ${pc.blue('[INFO]')} ${msg}`);
  },
  success: (msg) => {
    console.log(`${pc.gray(`[${getTimestamp()}]`)} ${pc.green('[SUCCESS]')} ${msg}`);
  },
  warn: (msg) => {
    console.log(`${pc.gray(`[${getTimestamp()}]`)} ${pc.yellow('[WARN]')} ${msg}`);
  },
  error: (msg, err = '') => {
    const errorDetail = err ? `\n${pc.red(err.stack || err)}` : '';
    console.error(`${pc.gray(`[${getTimestamp()}]`)} ${pc.red('[ERROR]')} ${msg}${errorDetail}`);
  },
  debug: (msg) => {
    if (process.env.DEBUG === 'true') {
      console.log(`${pc.gray(`[${getTimestamp()}]`)} ${pc.magenta('[DEBUG]')} ${msg}`);
    }
  }
};

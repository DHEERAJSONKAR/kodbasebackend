const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

const logFile = path.join(logsDir, 'auth.log');

function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  let logEntry = `[${timestamp}] [${level}] ${message}`;
  
  if (data) {
    if (typeof data === 'object') {
      logEntry += `\n${JSON.stringify(data, null, 2)}`;
    } else {
      logEntry += ` ${data}`;
    }
  }
  
  console.log(logEntry);
  
  fs.appendFile(logFile, logEntry + '\n', (err) => {
    if (err) console.error('Error writing to log file:', err);
  });
}

module.exports = {
  info: (message, data) => log('INFO', message, data),
  error: (message, data) => log('ERROR', message, data),
  debug: (message, data) => log('DEBUG', message, data),
  warn: (message, data) => log('WARN', message, data)
};

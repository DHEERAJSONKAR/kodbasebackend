class EmailServiceError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = 'EmailServiceError';
    this.statusCode = statusCode;
  }
}

module.exports = EmailServiceError;

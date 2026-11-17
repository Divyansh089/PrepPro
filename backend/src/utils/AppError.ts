// Throw this from services when you want a specific status code
// Example: throw new AppError(404, 'Test not found');
export class AppError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

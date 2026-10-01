export default function errorHandler(error, _request, response, next) {
  if (response.headersSent) {
    return next(error);
  }

  const candidateStatus = error.statusCode || error.status || 500;
  const statusCode = candidateStatus >= 400 && candidateStatus <= 599 ? candidateStatus : 500;
  const message = statusCode >= 500 ? "Internal server error" : error.message || "Request failed";

  if (statusCode >= 500) {
    console.error(`Request failed (${error.name || "Error"}).`);
  }

  response.status(statusCode).json({ error: message });
}
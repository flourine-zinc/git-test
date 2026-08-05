export function success(
  res,
  statusCode = 200,
  data = null,
  message = "Success",
) {
  const body = { success: true, message };
  if (data !== null && data !== undefined) body.data = data;
  return res.status(statusCode).json(body);
}

export function error(
  res,
  statusCode = 500,
  message = "Internal server error",
  details = null,
) {
  const body = { success: false, error: { code: statusCode, message } };
  if (details !== null && details !== undefined) body.error.details = details;
  return res.status(statusCode).json(body);
}

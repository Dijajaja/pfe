export function getApiErrorMessage(error, fallback = "Une erreur est survenue.") {
  const detail =
    error?.response?.data?.detail ||
    error?.response?.data?.message ||
    error?.message;
  return detail || fallback;
}

export function shouldUseFallback(error) {
  const status = error?.response?.status;
  return [404, 405, 501, 503].includes(status);
}


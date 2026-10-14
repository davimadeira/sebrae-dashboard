export function calculatePercentage(value, total, decimalPlaces = 2) {
  const numericValue = Number(value);
  const numericTotal = Number(total);

  if (!Number.isFinite(numericValue) || !Number.isFinite(numericTotal) || numericTotal <= 0) {
    return 0;
  }

  return Number(((numericValue / numericTotal) * 100).toFixed(decimalPlaces));
}

export function formatPercentage(value, decimalPlaces = 2) {
  const numericValue = Number(value);
  const safeValue = Number.isFinite(numericValue) ? numericValue : 0;

  return safeValue.toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimalPlaces,
  });
}

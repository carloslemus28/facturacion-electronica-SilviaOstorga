const sanitizeCsvFileName = (value) => {
  return String(value || 'exportacion')
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, '_');
};

const formatCsvValue = (value) => {
  if (value === undefined || value === null) {
    return '';
  }

  if (value instanceof Date) {
    return `"${value.toISOString()}"`;
  }

  const text = String(value)
    .replace(/\r?\n|\r/g, ' ')
    .trim();

  if (!/[",;\n\r]/.test(text)) {
    return text;
  }

  return `"${text.replace(/"/g, '""')}"`;
};

const writeCsvLine = (stream, values) => {
  stream.write(`${values.map(formatCsvValue).join(',')}\r\n`);
};

const setCsvDownloadHeaders = (res, fileName) => {
  const safeFileName = sanitizeCsvFileName(fileName);

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${safeFileName}"`);
  res.setHeader('Cache-Control', 'no-store');
};

module.exports = {
  formatCsvValue,
  sanitizeCsvFileName,
  setCsvDownloadHeaders,
  writeCsvLine
};

const parseBoolean = (value, fallback = false) => {
  if (value === undefined) return fallback;
  if (typeof value === 'boolean') return value;
  return value === 'true';
};

const parseNumber = (value, fallback) => {
  if (value === undefined || value === null || value === '') return fallback;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const parseJsonArray = (value) => {
  if (value === undefined || value === null || value === '') {
    return { value: undefined };
  }
  if (Array.isArray(value)) {
    return { value };
  }
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return { error: 'Expected array' };
    }
    return { value: parsed };
  } catch (err) {
    return { error: 'Invalid JSON' };
  }
};

module.exports = {
  parseBoolean,
  parseNumber,
  parseJsonArray,
};

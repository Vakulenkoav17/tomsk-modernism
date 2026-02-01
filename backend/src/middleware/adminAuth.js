const decodeBasicAuth = (header) => {
  if (!header || typeof header !== 'string') return null;
  const [scheme, encoded] = header.split(' ');
  if (scheme !== 'Basic' || !encoded) return null;
  let decoded = '';
  try {
    decoded = Buffer.from(encoded, 'base64').toString('utf8');
  } catch {
    return null;
  }
  const separator = decoded.indexOf(':');
  if (separator === -1) return null;
  return {
    user: decoded.slice(0, separator),
    pass: decoded.slice(separator + 1),
  };
};

const adminAuth = (req, res, next) => {
  const adminUser = process.env.ADMIN_USER;
  const adminPass = process.env.ADMIN_PASS;
  if (!adminUser || !adminPass) {
    return res.status(500).json({ error: 'Admin credentials are not configured' });
  }

  const credentials = decodeBasicAuth(req.headers.authorization);
  if (!credentials || credentials.user !== adminUser || credentials.pass !== adminPass) {
    res.set('WWW-Authenticate', 'Basic realm="Admin"');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  return next();
};

module.exports = adminAuth;

const generateTrackingId = () => {
  const prefix = 'ECO';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

module.exports = generateTrackingId;

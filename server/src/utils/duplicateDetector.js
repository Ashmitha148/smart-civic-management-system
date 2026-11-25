const STOP_WORDS = new Set([
  'the',
  'is',
  'at',
  'which',
  'on',
  'and',
  'a',
  'an',
  'in',
  'to',
  'of',
  'for',
  'near',
  'with',
  'this',
  'that',
  'from',
  'has',
  'have',
  'been',
  'there',
  'are',
  'was',
]);

export const tokenizeText = (text = '') => {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w))
  );
};

export const computeTextSimilarity = (textA = '', textB = '') => {
  const tokensA = tokenizeText(textA);
  const tokensB = tokenizeText(textB);
  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  let intersection = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) intersection += 1;
  }

  const union = tokensA.size + tokensB.size - intersection;
  return union === 0 ? 0 : Number((intersection / union).toFixed(3));
};

export const haversineMeters = (lat1, lon1, lat2, lon2) => {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

export const findPotentialDuplicates = (
  { title = '', description = '', category, latitude = null, longitude = null },
  existingComplaints = []
) => {
  const incomingText = `${title} ${description}`;
  const hasIncomingCoords =
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    !Number.isNaN(latitude) &&
    !Number.isNaN(longitude);

  const matches = [];

  for (const existing of existingComplaints) {
    if (category && existing.category !== category) continue;

    const existingText = `${existing.title || ''} ${existing.description || ''}`;
    const similarityScore = computeTextSimilarity(incomingText, existingText);

    let distanceMeters = null;
    const hasExistingCoords =
      typeof existing.location?.latitude === 'number' &&
      typeof existing.location?.longitude === 'number';

    if (hasIncomingCoords && hasExistingCoords) {
      distanceMeters = haversineMeters(
        latitude,
        longitude,
        existing.location.latitude,
        existing.location.longitude
      );
    }

    const isGeoClose = distanceMeters !== null && distanceMeters <= 300;
    const isDuplicateCandidate =
      (isGeoClose && similarityScore >= 0.2) || similarityScore >= 0.4;

    if (isDuplicateCandidate) {
      matches.push({
        _id: existing._id,
        complaintId: existing.complaintId,
        title: existing.title,
        status: existing.status,
        address: existing.location?.address || '',
        distanceMeters,
        similarityScore,
      });
    }
  }

  return matches
    .sort((a, b) => b.similarityScore - a.similarityScore)
    .slice(0, 3);
};

const CATEGORY_WEIGHTS = {
  'Electricity Issues': 25,
  'Water Leakage': 25,
  'Drainage Problems': 25,
  'Road Damage': 20,
  'Streetlight Issues': 20,
  Sanitation: 15,
  'Garbage Collection': 15,
  Other: 10,
};

const SEVERITY_WEIGHTS = {
  Low: 0,
  Medium: 15,
  High: 30,
  Emergency: 45,
};

const EMERGENCY_KEYWORDS = [
  'spark',
  'live wire',
  'electrocution',
  'collapsed',
  'flooding',
  'sewage overflow',
  'sinkhole',
  'fire',
  'burst main',
  'gas',
  'accident',
  'hospital',
  'school',
];

const SAFETY_KEYWORDS = [
  'hazard',
  'danger',
  'dark',
  'broken',
  'blocked',
  'slippery',
  'leaking',
  'overflow',
  'deep',
  'exposed',
];

export const calculateSuggestedPriority = ({
  category = 'Other',
  title = '',
  description = '',
  reportedSeverity = 'Medium',
  nearbySimilarCount = 0,
}) => {
  let score = 0;
  const factors = [];

  const catWeight = CATEGORY_WEIGHTS[category] ?? 10;
  score += catWeight;
  factors.push(`Category "${category}" baseline (+${catWeight})`);

  const sevWeight = SEVERITY_WEIGHTS[reportedSeverity] ?? 15;
  if (sevWeight > 0) {
    score += sevWeight;
    factors.push(`Reported severity "${reportedSeverity}" (+${sevWeight})`);
  }

  const combinedText = `${title} ${description}`.toLowerCase();

  const matchedEmergency = EMERGENCY_KEYWORDS.filter((kw) => combinedText.includes(kw));
  if (matchedEmergency.length > 0) {
    score += 35;
    factors.push(
      `Emergency indicator detected (${matchedEmergency.slice(0, 3).join(', ')}) (+35)`
    );
  } else {
    const matchedSafety = SAFETY_KEYWORDS.filter((kw) => combinedText.includes(kw));
    if (matchedSafety.length > 0) {
      score += 15;
      factors.push(
        `Safety risk indicator detected (${matchedSafety.slice(0, 3).join(', ')}) (+15)`
      );
    }
  }

  if (nearbySimilarCount >= 3) {
    score += 20;
    factors.push(`${nearbySimilarCount} similar complaints nearby (+20)`);
  } else if (nearbySimilarCount >= 1) {
    score += 10;
    factors.push(`${nearbySimilarCount} similar complaint(s) nearby (+10)`);
  }

  let suggestedPriority = 'Low';
  if (score >= 70) suggestedPriority = 'Emergency';
  else if (score >= 45) suggestedPriority = 'High';
  else if (score >= 25) suggestedPriority = 'Medium';

  return {
    suggestedPriority,
    score: Math.min(100, score),
    factors,
  };
};

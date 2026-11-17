export const DISEASE_CATEGORIES = ['All', 'Fungal', 'Bacterial', 'Healthy'];

export const SEVERITY_BADGE_STYLES = {
  High: 'border-red-200 bg-red-50 text-red-800',
  Moderate: 'border-amber-200 bg-amber-50 text-amber-800',
  Low: 'border-yellow-200 bg-yellow-50 text-yellow-800',
  None: 'border-emerald-200 bg-emerald-50 text-emerald-800',
};

export const SUPPORTED_PLANTS = [
  {
    name: 'Tomato',
    scientificName: 'Solanum lycopersicum',
    conditionsCount: 3,
    focusAreas: ['Early Blight', 'Late Blight', 'Healthy Foliage'],
    summary: 'High-priority greenhouse and field crop monitored for foliar blights and leaf spots.',
    status: 'active',
    aiTrained: true,
    statusLabel: 'AI Model Trained',
  },
  {
    name: 'Potato',
    scientificName: 'Solanum tuberosum',
    conditionsCount: 2,
    focusAreas: ['Early Blight', 'Late Blight'],
    summary: 'Root crop vulnerable to rapid oomycete and fungal defoliation during humid weather.',
    status: 'active',
    aiTrained: true,
    statusLabel: 'AI Model Trained',
  },
  {
    name: 'Bell Pepper',
    scientificName: 'Capsicum annuum',
    conditionsCount: 1,
    focusAreas: ['Bacterial Spot'],
    summary: 'Warm-season crop tracked for water-soaked leaf lesions and premature leaf drop.',
    status: 'active',
    aiTrained: true,
    statusLabel: 'AI Model Trained',
  },
  {
    name: 'Apple',
    scientificName: 'Malus domestica',
    conditionsCount: 2,
    focusAreas: ['Apple Scab', 'Black Rot'],
    summary: 'Orchard fruit leaves evaluated for fungal lesions, scabbing, and necrotic spots.',
    status: 'planned',
    aiTrained: false,
    statusLabel: 'Planned Addition',
  },
  {
    name: 'Corn',
    scientificName: 'Zea mays',
    conditionsCount: 2,
    focusAreas: ['Northern Leaf Blight', 'Common Rust'],
    summary: 'Cereal crop checked for cigar-shaped necrotic lesions and rust pustules.',
    status: 'planned',
    aiTrained: false,
    statusLabel: 'Planned Addition',
  },
  {
    name: 'Grape',
    scientificName: 'Vitis vinifera',
    conditionsCount: 1,
    focusAreas: ['Black Rot'],
    summary: 'Vineyard foliage screened for reddish-brown circular spots and fruiting bodies.',
    status: 'planned',
    aiTrained: false,
    statusLabel: 'Planned Addition',
  },
  {
    name: 'Rice',
    scientificName: 'Oryza sativa',
    conditionsCount: 1,
    focusAreas: ['Brown Spot'],
    summary: 'Staple grain monitored for oval brown foliar spots associated with nutrient stress.',
    status: 'planned',
    aiTrained: false,
    statusLabel: 'Planned Addition',
  },
];

export const ACTIVE_PLANTS = SUPPORTED_PLANTS.filter((plant) => plant.status === 'active');
export const PLANNED_PLANTS = SUPPORTED_PLANTS.filter((plant) => plant.status === 'planned');

export const DISEASES = [
  {
    id: 'tomato-early-blight',
    plant: 'Tomato',
    diseaseName: 'Tomato Early Blight',
    scientificName: 'Alternaria solani',
    category: 'Fungal',
    severity: 'Moderate',
    summary:
      'A widespread fungal infection beginning on older lower leaves and progressing upward during warm, humid periods.',
    symptoms: [
      'Dark brown to black circular lesions with distinct concentric rings ("target" pattern).',
      'Yellowing halo surrounding older spots on lower foliage.',
      'Premature leaf drop exposing developing fruit to sunscald.',
    ],
    causes: [
      'Fungal spores overwintering in infected crop debris or soil.',
      'Warm temperatures (24–29°C) paired with frequent rain or overhead irrigation.',
      'Splashing water transferring spores from soil onto lower leaves.',
    ],
    treatments: [
      'Prune and safely dispose of severely affected lower leaves to reduce spore load.',
      'Apply copper-based or recommended targeted protectant fungicides according to label directions.',
      'Water at the soil base in the morning rather than using overhead sprinklers.',
    ],
    prevention: [
      'Practice a 2–3 year crop rotation away from solanaceous crops.',
      'Mulch around plant bases to prevent soil splash onto foliage.',
    ],
  },
  {
    id: 'tomato-late-blight',
    plant: 'Tomato',
    diseaseName: 'Tomato Late Blight',
    scientificName: 'Phytophthora infestans',
    category: 'Fungal',
    severity: 'High',
    summary:
      'An aggressive oomycete disease capable of destroying entire tomato canopies within days under cool, wet conditions.',
    symptoms: [
      'Large, irregular water-soaked dark green to purplish-black blotches on leaves.',
      'White, cottony mold growth on leaf undersides during humid mornings.',
      'Dark, firm lesions extending onto stems and developing fruit.',
    ],
    causes: [
      'Airborne sporangia spreading rapidly from infected volunteer plants or nearby fields.',
      'Cool nights, high relative humidity (>90%), and prolonged leaf wetness.',
    ],
    treatments: [
      'Remove and bag heavily infected plants immediately to limit regional spread.',
      'Use approved oomycete-specific fungicides preventively when conditions favor blight.',
      'Increase plant spacing and pruning to maximize airflow through the canopy.',
    ],
    prevention: [
      'Plant certified disease-free seedlings and resistant cultivars when available.',
      'Eliminate volunteer tomato and potato plants before each season.',
    ],
  },
  {
    id: 'tomato-healthy',
    plant: 'Tomato',
    diseaseName: 'Healthy Tomato Foliage',
    scientificName: 'Solanum lycopersicum',
    category: 'Healthy',
    severity: 'None',
    summary:
      'Vigorous, uniform green leaf tissue showing normal turgor and no signs of pathogenic lesions or chlorosis.',
    symptoms: [
      'Consistent deep green coloration across leaf blades and veins.',
      'Intact leaf margins with no necrotic spots, mold, or curling.',
    ],
    causes: [
      'Balanced soil nutrition, consistent root-zone moisture, and effective airflow.',
    ],
    treatments: [
      'No curative treatment required; continue routine scouting every 5–7 days.',
      'Maintain drip irrigation and balanced fertilization schedules.',
    ],
    prevention: [
      'Sanitize pruning shears between rows to keep plants pathogen-free.',
    ],
  },
  {
    id: 'potato-late-blight',
    plant: 'Potato',
    diseaseName: 'Potato Late Blight',
    scientificName: 'Phytophthora infestans',
    category: 'Fungal',
    severity: 'High',
    summary:
      'A destructive blight affecting potato leaves, stems, and tubers, thriving in cool and misty climates.',
    symptoms: [
      'Pale green to dark brown water-soaked patches starting near leaf tips or edges.',
      'Pale yellowish border around lesions with white spore rings underneath.',
      'Rapid blackening and foul-smelling collapse of foliage in wet weather.',
    ],
    causes: [
      'Infected seed tubers or wind-borne spores from neighboring crops.',
      'Persistent fog, dew, or cool rainy weather (10–20°C).',
    ],
    treatments: [
      'Apply labeled blight protectants immediately upon local weather alerts.',
      'Destroy infected haulms before harvest to prevent tuber contamination.',
      'Avoid harvesting during wet soil conditions.',
    ],
    prevention: [
      'Use certified disease-free seed potatoes and hill soil thoroughly over tubers.',
    ],
  },
  {
    id: 'potato-early-blight',
    plant: 'Potato',
    diseaseName: 'Potato Early Blight',
    scientificName: 'Alternaria solani',
    category: 'Fungal',
    severity: 'Moderate',
    summary:
      'A common foliar disease causing dark concentric lesions, particularly on stressed or maturing potato plants.',
    symptoms: [
      'Small dark brown spots that enlarge into angular lesions bounded by leaf veins.',
      'Concentric ring patterns inside older lesions.',
      'Gradual senescence and yellowing of lower foliage.',
    ],
    causes: [
      'Plant stress from nitrogen deficiency, drought, or heavy tuber set.',
      'Warm weather alternating between dry periods and heavy dew.',
    ],
    treatments: [
      'Address nitrogen and potassium deficiencies to bolster plant vigor.',
      'Apply appropriate protectant fungicides when lesions appear on mid-canopy leaves.',
    ],
    prevention: [
      'Rotate crops every 3 years and incorporate or remove post-harvest plant residue.',
    ],
  },
  {
    id: 'apple-scab',
    plant: 'Apple',
    diseaseName: 'Apple Scab',
    scientificName: 'Venturia inaequalis',
    category: 'Fungal',
    severity: 'Moderate',
    summary:
      'An early-season orchard disease causing velvety olive-green leaf spots that later darken and deform foliage.',
    symptoms: [
      'Olive-green to dark brown velvety spots on upper and lower leaf surfaces.',
      'Puckered, twisted, or yellowing leaves that drop early in severe infections.',
      'Corky scabby lesions on developing apples.',
    ],
    causes: [
      'Ascospores released from fallen overwintered leaves during spring rains.',
      'Cool, wet spring weather keeping buds and young leaves moist.',
    ],
    treatments: [
      'Rake and compost or shred fallen leaves in autumn to break the life cycle.',
      'Apply orchard fungicides timed to spring bud-break and wet infection periods.',
      'Prune canopies to open interior branches for faster drying.',
    ],
    prevention: [
      'Select scab-resistant apple cultivars for new orchard plantings.',
    ],
  },
  {
    id: 'apple-black-rot',
    plant: 'Apple',
    diseaseName: 'Apple Black Rot (Frogeye Leaf Spot)',
    scientificName: 'Botryosphaeria obtusa',
    category: 'Fungal',
    severity: 'Moderate',
    summary:
      'A fungal orchard disease producing characteristic purple-bordered leaf spots alongside fruit rot and limb cankers.',
    symptoms: [
      'Small purple flecks enlarging into circular tan-centered spots ("frogeye" appearance).',
      'Chlorosis and premature defoliation around heavy infection zones.',
    ],
    causes: [
      'Spores persisting in mummified fruit, dead bark, and fire-blight-damaged twigs.',
      'Warm, humid conditions during spring and summer.',
    ],
    treatments: [
      'Prune out dead wood, limb cankers, and mummified fruit during dormancy.',
      'Maintain a protective fungicide program from petal fall through summer cover sprays.',
    ],
    prevention: [
      'Remove brush piles and wild host trees near commercial orchard borders.',
    ],
  },
  {
    id: 'corn-northern-leaf-blight',
    plant: 'Corn',
    diseaseName: 'Corn Northern Leaf Blight',
    scientificName: 'Exserohilum turcicum',
    category: 'Fungal',
    severity: 'High',
    summary:
      'A major foliar disease in maize producing long, cigar-shaped lesions that reduce photosynthetic grain-fill capacity.',
    symptoms: [
      'Elongated, grayish-green to tan cigar-shaped lesions (2.5–15 cm long).',
      'Lesions expanding parallel to leaf veins and coalescing across whole leaves.',
    ],
    causes: [
      'Fungal survival in surface corn residue from previous seasons.',
      'Moderate temperatures (18–27°C) with heavy dew or frequent rainfall.',
    ],
    treatments: [
      'Evaluate hybrid susceptibility and ear-leaf infection levels prior to tasseling.',
      'Apply labeled foliar fungicides at VT/R1 growth stages if economic thresholds are exceeded.',
    ],
    prevention: [
      'Choose resistant corn hybrids and rotate away from continuous corn.',
    ],
  },
  {
    id: 'corn-common-rust',
    plant: 'Corn',
    diseaseName: 'Corn Common Rust',
    scientificName: 'Puccinia sorghi',
    category: 'Fungal',
    severity: 'Low',
    summary:
      'A wind-dispersed rust infection identifiable by brick-red pustules scattered across both sides of maize leaves.',
    symptoms: [
      'Small, oval cinnamon-brown pustules erupting through upper and lower leaf surfaces.',
      'Powdery rust spores rubbing off easily onto fingers or clothing.',
    ],
    causes: [
      'Windborne urediniospores carried northward from tropical/subtropical regions.',
      'Cool temperatures (16–23°C) and high humidity.',
    ],
    treatments: [
      'Most modern field corn hybrids carry sufficient tolerance without sprays.',
      'For susceptible sweet corn, apply preventive fungicides early if pustules multiply rapidly.',
    ],
    prevention: [
      'Plant rust-resistant sweet and field corn hybrids.',
    ],
  },
  {
    id: 'grape-black-rot',
    plant: 'Grape',
    diseaseName: 'Grape Black Rot',
    scientificName: 'Guignardia bidwellii',
    category: 'Fungal',
    severity: 'High',
    summary:
      'A damaging vineyard fungus that spots leaves before attacking flower clusters and shriveling berries into hard black mummies.',
    symptoms: [
      'Circular tan-to-reddish-brown leaf lesions edged with a dark brown border.',
      'Tiny black fruiting dots (pycnidia) arranged in rings inside older spots.',
    ],
    causes: [
      'Overwintered mummified berries hanging in trellises or lying on vineyard floors.',
      'Warm rain events after shoot growth begins in spring.',
    ],
    treatments: [
      'Remove all mummified berries and infected tendrils during winter pruning.',
      'Apply vineyard-approved protectant sprays from early shoot growth through fruit set.',
    ],
    prevention: [
      'Use open trellis training and leaf pulling around fruiting zones to speed drying.',
    ],
  },
  {
    id: 'pepper-bacterial-spot',
    plant: 'Bell Pepper',
    diseaseName: 'Bell Pepper Bacterial Spot',
    scientificName: 'Xanthomonas campestris pv. vesicatoria',
    category: 'Bacterial',
    severity: 'High',
    summary:
      'A contagious bacterial leaf and fruit disease spread rapidly by wind-driven rain and handling wet plants.',
    symptoms: [
      'Small water-soaked spots that turn dark brown to black with a papery center.',
      'Affected leaves turn yellow and drop prematurely, exposing pods.',
    ],
    causes: [
      'Contaminated seed, transplants, or crop debris.',
      'Overhead watering, wind-driven rain, and working in fields while foliage is wet.',
    ],
    treatments: [
      'Avoid handling or pruning plants when leaves are wet.',
      'Use fixed copper bactericide sprays (often paired per local guidance) to slow spread.',
      'Rogue out severely symptomatic transplants early.',
    ],
    prevention: [
      'Source hot-water-treated or certified pathogen-free seed and resistant cultivars.',
    ],
  },
  {
    id: 'rice-brown-spot',
    plant: 'Rice',
    diseaseName: 'Rice Brown Spot',
    scientificName: 'Bipolaris oryzae',
    category: 'Fungal',
    severity: 'Moderate',
    summary:
      'A fungal disease of rice strongly associated with nutrient-poor or moisture-stressed paddy and upland soils.',
    symptoms: [
      'Oval to circular dark brown lesions with lighter gray centers and yellow halos.',
      'Multiple spots merging on older leaves, reducing grain weight and quality.',
    ],
    causes: [
      'Potassium, silicon, or nitrogen imbalances weakening leaf tissue defenses.',
      'Seed-borne infection and high humidity.',
    ],
    treatments: [
      'Correct soil nutrient deficiencies (especially potassium and silicon) through balanced fertilization.',
      'Use recommended foliar fungicides only if upper flag leaves become heavily infected.',
    ],
    prevention: [
      'Treat seeds prior to sowing and maintain consistent water management.',
    ],
  },
];

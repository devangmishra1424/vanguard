/**
 * dietEngine.ts
 * Maps dietaryFlags → condition-specific diet plans with "Healing Clock" schedules.
 */

export type DietItem = {
  name: string;
  nameHi: string;
  reason: string;
  reasonHi: string;
  emoji: string;
};

export type ScheduleItem = {
  time: string;
  activity: string;
  activityHi: string;
  foods: string;
  foodsHi: string;
  tip: string;
  tipHi: string;
};

export type DietPlan = {
  name: string;
  nameHi: string;
  description: string;
  descriptionHi: string;
  consume: DietItem[];
  avoid: DietItem[];
  chefTips: string[];
  chefTipsHi: string[];
  schedule: ScheduleItem[];
};

export const ANEMIA_DIET: DietPlan = {
  name: 'Iron & B12 Vitality Plan',
  nameHi: 'आयरन और बी12 ऊर्जा आहार',
  description: 'Focused on restoring hemoglobin levels and boosting energy through iron-rich traditional Indian foods paired with Vitamin C.',
  descriptionHi: 'हीमोग्लोबिन के स्तर को बहाल करने और आयरन से भरपूर पारंपरिक भारतीय खाद्य पदार्थों और विटामिन सी के माध्यम से ऊर्जा बढ़ाने पर केंद्रित।',
  consume: [
    { name: 'Spinach (Palak)', nameHi: 'पालक', emoji: '🥬', reason: 'High in non-heme iron and folate', reasonHi: 'आयरन और फोलेट से भरपूर' },
    { name: 'Beetroot', nameHi: 'चुकंदर', emoji: '🥗', reason: 'Helps in red blood cell production', reasonHi: 'रक्त कोशिकाओं के निर्माण में मदद करता है' },
    { name: 'Pomegranate (Anar)', nameHi: 'अनार', emoji: '🍎', reason: 'Rich in iron and Vitamin C for absorption', reasonHi: 'आयरन और विटामिन सी से भरपूर' },
    { name: 'Eggs / Lean Meat', nameHi: 'अंडे / चिकन', emoji: '🥚', reason: 'Heme iron for fast absorption', reasonHi: 'हीम आयरन जो जल्दी सोखता है' },
  ],
  avoid: [
    { name: 'Tea / Coffee', nameHi: 'चाय / कॉफी', emoji: '☕', reason: 'Tannins block iron absorption', reasonHi: 'टैनिन आयरन को सोखने से रोकता है' },
    { name: 'Calcium Supplements', nameHi: 'कैल्शियम सप्लीमेंट', emoji: '💊', reason: 'Competes with iron for absorption', reasonHi: 'आयरन के अवशोषण में बाधा डालता है' },
    { name: 'Processed Snacks', nameHi: 'जंक फूड', emoji: '🍟', reason: 'Empty calories displacement', reasonHi: 'पोषक तत्वों की कमी' },
  ],
  chefTips: [
    'Always squeeze fresh lemon on your Palak or Poha. Vitamin C increases iron absorption by 3x!',
    'Cook in iron utensils (Kadhai). It naturally adds trace iron to your food.',
    'Wait at least 1 hour after meals before drinking tea or coffee.'
  ],
  chefTipsHi: [
    'हमेशा अपने पालक या पोहे पर ताजा नींबू निचोड़ें। विटामिन सी आयरन के अवशोषण को 3 गुना बढ़ाता है!',
    'लोहे के बर्तनों (कढ़ाई) में खाना बनाएं। यह प्राकृतिक रूप से भोजन में आयरन मिलाता है।',
    'भोजन के कम से कम 1 घंटे बाद ही चाय या कॉफी पिएं।'
  ],
  schedule: [
    { time: '08:00 AM', activity: 'Iron Breakfast', activityHi: 'आयरन नाश्ता', foods: 'Poha with Sprouts & Lemon', foodsHi: 'अंकुरित पोहा और नींबू', tip: 'Pair with Lemon juice', tipHi: 'नींबू के रस के साथ लें' },
    { time: '11:00 AM', activity: 'Vitamin C Boost', activityHi: 'विटामिन सी बूस्ट', foods: 'Amla or Orange', foodsHi: 'आंवला या संतरा', tip: 'Helps absorb breakfast iron', tipHi: 'आयरन सोखने में मदद करता है' },
    { time: '02:00 PM', activity: 'Power Lunch', activityHi: 'पावर लंच', foods: 'Palak Dal & Bajra Roti', foodsHi: 'पालक दाल और बाजरा रोटी', tip: 'Avoid Curd during this meal', tipHi: 'इस भोजन में दही न लें' },
    { time: '05:00 PM', activity: 'Energy Snack', activityHi: 'एनर्जी स्नैक', foods: 'Roasted Chana & Jaggery', foodsHi: 'भुना चना और गुड़', tip: 'Natural Iron combo', tipHi: 'प्राकृतिक आयरन कॉम्बो' },
    { time: '08:00 PM', activity: 'Light Dinner', activityHi: 'हल्का डिनर', foods: 'Mixed Veg Khichdi', foodsHi: 'मिक्स वेज खिचड़ी', tip: 'Easy for night digestion', tipHi: 'पाचन के लिए आसान' },
  ]
};

export const LIVER_DETOX_DIET: DietPlan = {
  name: 'Hepatic Recovery & Detox',
  nameHi: 'लिवर रिकवरी और डिटॉक्स',
  description: 'A low-fat, high-antioxidant approach to reduce liver enzyme levels and support natural detoxification.',
  descriptionHi: 'लिवर एंजाइम स्तर को कम करने और प्राकृतिक विषहरण में मदद करने के लिए कम वसा वाला आहार।',
  consume: [
    { name: 'Bottle Gourd (Lauki)', nameHi: 'लौकी', emoji: '🥒', reason: 'High hydration, easy to digest', reasonHi: 'पाचन में आसान और हाइड्रेटिंग' },
    { name: 'Turmeric (Haldi)', nameHi: 'हल्दी', emoji: '🫚', reason: 'Anti-inflammatory properties', reasonHi: 'सूजन कम करने में मददगार' },
    { name: 'Garlic', nameHi: 'लहसुन', emoji: '🧄', reason: 'Contains sulfur to active liver enzymes', reasonHi: 'लिवर एंजाइम को सक्रिय करता है' },
    { name: 'Green Tea', nameHi: 'ग्रीन टी', emoji: '🍵', reason: 'Potent antioxidants (EGCG)', reasonHi: 'एंटीऑक्सीडेंट से भरपूर' },
  ],
  avoid: [
    { name: 'Alcohol', nameHi: 'शराब', emoji: '🍺', reason: 'Direct toxic effect on liver cells', reasonHi: 'लिवर कोशिकाओं के लिए हानिकारक' },
    { name: 'Fried Foods / Pakoras', nameHi: 'तला हुआ भोजन', emoji: '🍕', reason: 'Causes fatty liver accumulation', reasonHi: 'फैटी लिवर का कारण बनता है' },
    { name: 'Sugary Drinks', nameHi: 'कोल्ड ड्रिंक', emoji: '🥤', reason: 'Fructose stress on the liver', reasonHi: 'लिवर पर अतिरिक्त दबाव' },
  ],
  chefTips: [
    'Boil Lauki with a pinch of turmeric. It is the gentlest food for a recovering liver.',
    'Replace your morning coffee with warm lemon water to jumpstart detox.',
    'Eat your last meal by 7:30 PM to give the liver enough rest time.'
  ],
  chefTipsHi: [
    'चुटकी भर हल्दी के साथ लौकी उबालें। यह रिकवरी के लिए सबसे सौम्य भोजन है।',
    'डिटॉक्स शुरू करने के लिए सुबह की कॉफी को गुनगुने नींबू पानी से बदलें।',
    'लिवर को पर्याप्त आराम देने के लिए शाम 7:30 बजे तक अपना आखिरी भोजन कर लें।'
  ],
  schedule: [
    { time: '07:30 AM', activity: 'Detox Start', activityHi: 'डिटॉक्स शुरुआत', foods: 'Warm Lemon Water', foodsHi: 'गुनगुना नींबू पानी', tip: 'Flushes out toxins', tipHi: 'विषाक्त पदार्थों को बाहर निकालता है' },
    { time: '09:00 AM', activity: 'Healing Breakfast', activityHi: 'हीलिंग नाश्ता', foods: 'Oats with Berries', foodsHi: 'ओट्स और बेरीज', tip: 'Fiber for clean liver', tipHi: 'फाइबर लिवर साफ रखता है' },
    { time: '01:30 PM', activity: 'Light Lunch', activityHi: 'हल्का लंच', foods: 'Lauki Sabzi & Phulka', foodsHi: 'लौकी सब्जी और फुल्का', tip: 'Zero oil preparation', tipHi: 'बिना तेल के बनाएं' },
    { time: '05:00 PM', activity: 'Liver Tea', activityHi: 'लिवर टी', foods: 'Green Tea & Walnuts', foodsHi: 'ग्रीन टी और अखरोट', tip: 'Healthy fats & antioxidants', tipHi: 'स्वस्थ वसा और एंटीऑक्सीडेंट' },
    { time: '07:30 PM', activity: 'Early Dinner', activityHi: 'जल्दी डिनर', foods: 'Moong Dal Soup', foodsHi: 'मूंग दाल का सूप', tip: 'Maximum rest for liver', tipHi: 'लिवर को अधिकतम आराम दें' },
  ]
};

export const LOW_GLYCEMIC_DIET: DietPlan = {
  name: 'Glucose Balance & Energy',
  nameHi: 'ग्लूकोज बैलेंस और ऊर्जा',
  description: 'Focuses on slow-releasing carbs and high fiber to prevent blood glucose spikes.',
  descriptionHi: 'ब्लड ग्लूकोज को स्थिर रखने के लिए फाइबर और धीरे पचने वाले कार्ब्स पर आधारित।',
  consume: [
    { name: 'Methi (Fenugreek)', nameHi: 'मेथी', emoji: '🌿', reason: 'Improves insulin sensitivity', reasonHi: 'इंसुलिन सुधारने में मददगार' },
    { name: 'Whole Grains (Bajra/Jowar)', nameHi: 'बाजरा / ज्वार', emoji: '🌾', reason: 'Low Glycemic Index', reasonHi: 'कम ग्लाइसेमिक इंडेक्स' },
    { name: 'Cinnamon (Dalchini)', nameHi: 'दालचीनी', emoji: '🪵', reason: 'Helps lower fasting blood sugar', reasonHi: 'शुगर कम करने में मदद' },
    { name: 'Lentils', nameHi: 'दाल', emoji: '🫘', reason: 'High protein and fiber combo', reasonHi: 'प्रोटीन और फाइबर का मेल' },
  ],
  avoid: [
    { name: 'White Rice / Maida', nameHi: 'सफेद चावल / मैदा', emoji: '🍚', reason: 'Triggers instant glucose spikes', reasonHi: 'शुगर को तुरंत बढ़ाता है' },
    { name: 'Potato (Fried)', nameHi: 'आलू', emoji: '🍟', reason: 'High starch, high calorie', reasonHi: 'अधिक स्टार्च और कैलोरी' },
    { name: 'Sweet Desserts', nameHi: 'मिठाई', emoji: '🍰', reason: 'Direct refined sugar load', reasonHi: 'सीधी रिफाइंड शुगर' },
  ],
  chefTips: [
    'Add methi seeds or powder to your atta. It slows down glucose entry into the blood.',
    'Eat your salad or veggies *before* you start eating your main carb (roti/grains).',
    'Stay active for 10 minutes after a meal to help manage spikes.'
  ],
  chefTipsHi: [
    'अपने आटे में मेथी के दाने या पाउडर मिलाएं। यह शुगर के सोखने को धीमा करता है।',
    'अपना मुख्य कार्ब (रोटी/अनाज) शुरू करने से *पहले* सलाद या सब्जियां खाएं।',
    'शुगर को नियंत्रित करने के लिए भोजन के बाद 10 मिनट तक सक्रिय रहें।'
  ],
  schedule: [
    { time: '08:00 AM', activity: 'Stable Start', activityHi: 'स्थिर शुरुआत', foods: 'Methi Thepla & Curd', foodsHi: 'मेथी थेपला और दही', tip: 'Low GI foundation', tipHi: 'लो-जीआई आधार' },
    { time: '11:00 AM', activity: 'Fiber Snack', activityHi: 'फाइबर स्नैक', foods: 'Roasted Makhana', foodsHi: 'भुना मखाना', tip: 'Keeps hunger away', tipHi: 'भूख को नियंत्रित रखता है' },
    { time: '01:30 PM', activity: 'Square Lunch', activityHi: 'कंप्लीट लंच', foods: 'Mix Veg Dal & Salad', foodsHi: 'मिक्स वेज दाल और सलाद', tip: 'Eat salad first', tipHi: 'पहले सलाद खाएं' },
    { time: '05:00 PM', activity: 'Nuts Break', activityHi: 'नट्स ब्रेक', foods: 'Almonds & Seeds', foodsHi: 'बादाम और बीज', tip: 'Steady energy flow', tipHi: 'निरंतर ऊर्जा प्रवाह' },
    { time: '08:00 PM', activity: 'Protein Dinner', activityHi: 'प्रोटीन डिनर', foods: 'Paneer or Tofu Veggie Bowl', foodsHi: 'पनीर या टोफू बाउल', tip: 'Light on carbs at night', tipHi: 'रात में कार्ब्स कम लें' },
  ]
};

export const HEART_HEALTHY_DIET: DietPlan = {
  name: 'Cardio-Vascular Care',
  nameHi: 'हृदय देखभाल आहार',
  description: 'Heart-protective plan focusing on healthy fats and low sodium to manage lipid levels.',
  descriptionHi: 'हृदय की सुरक्षा के लिए स्वस्थ वसा और कम सोडियम वाला आहार।',
  consume: [
    { name: 'Oats / Porridge', nameHi: 'ओट्स / दलिया', emoji: '🥣', reason: 'Beta-glucan lowers cholesterol', reasonHi: 'कोलेस्ट्रॉल कम करता है' },
    { name: 'Flaxseeds', nameHi: 'अलसी', emoji: '✨', reason: 'Richest source of plant Omega-3', reasonHi: 'ओमेगा-3 का अच्छा स्रोत' },
    { name: 'Walnuts', nameHi: 'अखरोट', emoji: '🌰', reason: 'Improves artery function', reasonHi: 'धमनियों के कार्य में सुधार' },
    { name: 'Berries / Fruits', nameHi: 'बेरीज / फल', emoji: '🍓', reason: 'Rich in protective polyphenols', reasonHi: 'पॉलीफेनोल्स से भरपूर' },
  ],
  avoid: [
    { name: 'Salt (Excess)', nameHi: 'अधिक नमक', emoji: '🧂', reason: 'Directly raises blood pressure', reasonHi: 'ब्लड प्रेशर बढ़ाता है' },
    { name: 'Saturated Fats (Ghee/Butter)', nameHi: 'मक्खन / घी', emoji: '🧈', reason: 'Can raise LDL cholesterol', reasonHi: 'कोलेस्ट्रॉल बढ़ा सकता है' },
    { name: 'Canned Foods', nameHi: 'डिब्बाबंद खाना', emoji: '🥫', reason: 'Hidden sodium and preservatives', reasonHi: 'छिपा हुआ नमक और केमिकल' },
  ],
  chefTips: [
    'Use garlic in everything. It naturally helps in thinning blood and heart health.',
    'Replace common salt with rock salt (Sendha Namak), but still keep it limited.',
    'Include 30g of raw walnuts daily for your required Omega-3 dose.'
  ],
  chefTipsHi: [
    'हर चीज में लहसुन का प्रयोग करें। यह प्राकृतिक रूप से हृदय स्वास्थ्य में मदद करता है।',
    'साधारण नमक की जगह सेंधा नमक का प्रयोग करें, लेकिन इसे फिर भी सीमित रखें।',
    'ओमेगा-3 की खुराक के लिए रोजाना 30 ग्राम कच्चे अखरोट शामिल करें।'
  ],
  schedule: [
    { time: '08:00 AM', activity: 'Hearty Breakfast', activityHi: 'स्वस्थ नाश्ता', foods: 'Dalia with Flaxseeds', foodsHi: 'अलसी के साथ दलिया', tip: 'Rich in plant Omega-3', tipHi: 'ओमेगा-3 से भरपूर' },
    { time: '11:00 AM', activity: 'Fruit Break', activityHi: 'फ्रूट ब्रेक', foods: 'Apple or Guava', foodsHi: 'सेब या अमरूद', tip: 'Pectin for cholesterol', tipHi: 'कोलेस्ट्रॉल के लिए पेक्टिन' },
    { time: '01:30 PM', activity: 'Balanced Lunch', activityHi: 'संतुलित लंच', foods: 'Whole wheat chapati & Greens', foodsHi: 'गेहूं की रोटी और साग', tip: 'Low salt preparation', tipHi: 'कम नमक में बनाएं' },
    { time: '05:00 PM', activity: 'Seed Snack', activityHi: 'सीड स्नैक', foods: 'Pumpkin Seeds or Walnuts', foodsHi: 'कद्दू के बीज या अखरोट', tip: 'Protective fats', tipHi: 'सुरक्षात्मक वसा' },
    { time: '08:00 PM', activity: 'Fibre Dinner', activityHi: 'फाइबर डिनर', foods: 'Vegetable Clear Soup', foodsHi: 'वेजीटेबल सूप', tip: 'Easy on the heart', tipHi: 'हृदय के लिए हल्का' },
  ]
};

export const KIDNEY_FRIENDLY_DIET: DietPlan = {
  name: 'Renal Balance Plan',
  nameHi: 'किडनी बैलेंस आहार',
  description: 'Carefully managed protein and minerals to reduce work-load on kidneys.',
  descriptionHi: 'किडनी पर दबाव कम करने के लिए प्रोटीन और खनिजों का संतुलित आहार।',
  consume: [
    { name: 'Cauliflower', nameHi: 'फूलगोभी', emoji: '🥦', reason: 'Low potassium alternative to potato', reasonHi: 'आलू का कम पोटेशियम वाला विकल्प' },
    { name: 'Cabbage', nameHi: 'पत्तागोभी', emoji: '🥬', reason: 'Excellent for renal health', reasonHi: 'किडनी के स्वास्थ्य के लिए अच्छा' },
    { name: 'White Rice (Limited)', nameHi: 'सफेद चावल', emoji: '🍚', reason: 'Lower in phosphorus than whole grains', reasonHi: 'फास्फोरस में कम' },
    { name: 'Bell Peppers', nameHi: 'शिमला मिर्च', emoji: '🫑', reason: 'Rich in Vit C, low in potassium', reasonHi: 'कम पोटेशियम, उच्च विटामिन सी' },
  ],
  avoid: [
    { name: 'High Potass. Foods', nameHi: 'उच्च पोटेशियम भोजन', emoji: '🍌', reason: 'Hard for kidneys to filter', reasonHi: 'छानने में मुश्किल' },
    { name: 'Dark Sodas', nameHi: 'डार्क सोडा', emoji: '🥤', reason: 'Very high in Phosphorus', reasonHi: 'फास्फोरस में बहुत अधिक' },
    { name: 'Dairy (Excess)', nameHi: 'अधिक डेयरी', emoji: '🥛', reason: 'High in minerals, strain kidneys', reasonHi: 'खनिजों के कारण दबाव' },
  ],
  chefTips: [
    'Leach your vegetables (soak in water for 2 hours) to remove excess potassium.',
    'Avoid adding extra protein powder unless specifically prescribed.',
    'Track your daily water intake carefully to avoid renal overload.'
  ],
  chefTipsHi: [
    'सब्जियों को 2 घंटे तक पानी में भिगोकर अतिरिक्त पोटेशियम निकालें।',
    'जब तक विशेष रूप से निर्देशित न हो, अतिरिक्त प्रोटीन पाउडर से बचें।',
    'किडनी पर दबाव से बचने के लिए अपने दैनिक पानी के सेवन पर सावधानीपूर्वक नज़र रखें।'
  ],
  schedule: [
    { time: '08:00 AM', activity: 'Gentle Start', activityHi: 'सौम्य शुरुआत', foods: 'Rava Upma with Veggies', foodsHi: 'वेजी उपमा', tip: 'Measured light protein', tipHi: 'सीमित मात्रा में प्रोटीन' },
    { time: '11:00 AM', activity: 'Hydration Break', activityHi: 'हाइड्रेशन ब्रेक', foods: 'Small Apple or Pineapple', foodsHi: 'सेब या अनानास', tip: 'Controlled fluid intake', tipHi: 'तरल पदार्थ पर नियंत्रण' },
    { time: '01:30 PM', activity: 'Safe Lunch', activityHi: 'सुरक्षित लंच', foods: 'White Rice & Cabbage', foodsHi: 'चावल और पत्तागोभी', tip: 'Low Phosphorus meal', tipHi: 'कम फास्फोरस वाला भोजन' },
    { time: '05:00 PM', activity: 'Light Snack', activityHi: 'हल्का स्नैक', foods: 'Rice Puffs (Murmura)', foodsHi: 'मुरमुरा', tip: 'Sodium-free snack', tipHi: 'बिना नमक वाला नाश्ता' },
    { time: '08:00 PM', activity: 'Soft Dinner', activityHi: 'नरम डिनर', foods: 'Bottle Gourd Soup', foodsHi: 'लौकी का सूप', tip: 'Restful for renal system', tipHi: 'गुर्दे के लिए आरामदेह' },
  ]
};

export const NORMAL_HEALTHY_DIET: DietPlan = {
  name: 'Balanced Wellness Plan',
  nameHi: 'संतुलित स्वास्थ्य आहार',
  description: 'Maintenance plan focusing on maintaining current energy levels and long-term health.',
  descriptionHi: 'ऊर्जा स्तर और लंबी अवधि के स्वास्थ्य के लिए संतुलित आहार।',
  consume: [
    { name: 'Seasonal Fruits', nameHi: 'मौसमी फल', emoji: '🍓', reason: 'Natural vitamins and hydration', reasonHi: 'प्राकृतिक विटामिन' },
    { name: 'Whole Pulses', nameHi: 'साबुत दालें', emoji: '🍲', reason: 'Sustainable energy source', reasonHi: 'ऊर्जा का स्रोत' },
    { name: 'Mixed Nuts', nameHi: 'मिक्स नट्स', emoji: '🥜', reason: 'Healthy fats for brain', reasonHi: 'स्वस्थ वसा' },
    { name: 'Fresh Curd', nameHi: 'ताजा दही', emoji: '🥛', reason: 'Good for gut microbiome', reasonHi: 'पाचन के लिए अच्छा' },
  ],
  avoid: [
    { name: 'Excessive Caffeine', nameHi: 'अधिक कैफीन', emoji: '☕', reason: 'Disrupts sleep cycle', reasonHi: 'नींद खराब करता है' },
    { name: 'Refined Flours', nameHi: 'मैदा', emoji: '🥐', reason: 'Low fiber, gut stress', reasonHi: 'फाइबर की कमी' },
    { name: 'Extra Sugar', nameHi: 'चीनी', emoji: '🍬', reason: 'Causes energy crashes', reasonHi: 'एनर्जी क्रैश' },
  ],
  chefTips: [
    'Eat colorful meals. The more colors, the better the nutrient variety!',
    'Chew your food 32 times. Digestion starts in the mouth.',
    'Keep a handful of almonds ready in your bag to avoid impulsive junk eating.'
  ],
  chefTipsHi: [
    'रंगीन भोजन करें। जितने अधिक रंग, उतने अधिक पोषक तत्व!',
    'भोजन को 32 बार चबाएं। पाचन मुँह से शुरू होता है।',
    'जंक फूड से बचने के लिए अपने बैग में मुट्ठी भर बादाम तैयार रखें।'
  ],
  schedule: [
    { time: '08:00 AM', activity: 'Energy Start', activityHi: 'ऊर्जावान शुरुआत', foods: 'Besan Cheela or Sprouts', foodsHi: 'बेसन चीला या अंकुरित', tip: 'High protein morning', tipHi: 'उच्च प्रोटीन सुबह' },
    { time: '11:00 AM', activity: 'Vibe Break', activityHi: 'वाइब ब्रेक', foods: 'Coconut Water or Fruit', foodsHi: 'नारियल पानी या फल', tip: 'Electrolyte balance', tipHi: 'इलेक्ट्रोलाइट संतुलन' },
    { time: '01:30 PM', activity: 'Royal Lunch', activityHi: 'शाही लंच', foods: 'Dal, Veg, Roti & Curd', foodsHi: 'दाल, सब्जी, रोटी और दही', tip: 'Macro-balanced meal', tipHi: 'संतुलित भोजन' },
    { time: '05:00 PM', activity: 'Tea Time', activityHi: 'चाय का समय', foods: 'Makhana or Peanuts', foodsHi: 'मखाना या मूंगफली', tip: 'Avoid fried snacks', tipHi: 'तले हुए स्नैक्स से बचें' },
    { time: '08:00 PM', activity: 'Calm Dinner', activityHi: 'शांत डिनर', foods: 'Light Veggie Dalia', foodsHi: 'सब्जी दलिया', tip: 'Aids deep sleep', tipHi: 'गहरी नींद में मददगार' },
  ]
};

export const THYROID_DIET: DietPlan = {
  name: 'Metabolic & Thyroid Support',
  nameHi: 'मेटाबॉलिक और थायराइड सहायता आहार',
  description: 'Designed to support thyroid hormone production and metabolism using selenium-rich and iodine-balanced foods.',
  descriptionHi: 'सेलेनियम और आयोडीन युक्त संतुलित भोजन के साथ थायराइड हार्मोन उत्पादन और मेटाबॉलिज्म में मदद के लिए।',
  consume: [
    { name: 'Brazil Nuts', nameHi: 'ब्राजील नट्स', emoji: '🌰', reason: 'Highest natural source of selenium', reasonHi: 'सेलेनियम का सबसे अच्छा स्रोत' },
    { name: 'Iodized Salt', nameHi: 'आयोडीन युक्त नमक', emoji: '🧂', reason: 'Essential for thyroid hormone T3/T4', reasonHi: 'थायराइड हार्मोन के लिए आवश्यक' },
    { name: 'Curd / Yogurt', nameHi: 'दही / योगर्ट', emoji: '🥛', reason: 'Probiotics and iodine source', reasonHi: 'प्रोबायोटिक्स और आयोडीन का स्रोत' },
    { name: 'Coconut Oil', nameHi: 'नारियल तेल', emoji: '🥥', reason: 'Medium-chain fats for metabolism boost', reasonHi: 'मेटाबॉलिज्म बढ़ाने में मददगार' },
  ],
  avoid: [
    { name: 'Raw Crucial Veggies', nameHi: 'कच्ची क्रूसिफेरस सब्जियां', emoji: '🥦', reason: 'Raw cabbage/broccoli can block iodine', reasonHi: 'कच्चा गोभी/ब्रोकोली आयोडीन रोकता है' },
    { name: 'Soy Products', nameHi: 'सोया उत्पाद', emoji: '🫘', reason: 'May interfere with hormone absorption', reasonHi: 'हार्मोन अवशोषण में बाधा डाल सकता है' },
    { name: 'Gluten (Excess)', nameHi: 'अधिक ग्लूटेन', emoji: '🍞', reason: 'Can trigger inflammation in some cases', reasonHi: 'कुछ मामलों में सूजन बढ़ा सकता है' },
  ],
  chefTips: [
    'Always cook your broccoli or cabbage. Cooking neutralizes the goitrogens that block iodine.',
    'Eat just 2 Brazil nuts a day for your entire daily selenium requirement.',
    'Use virgin coconut oil for cooking to help support a sluggish metabolism.'
  ],
  chefTipsHi: [
    'गोभी या ब्रोकोली को हमेशा पकाकर खाएं। पकाने से आयोडीन रोकने वाले तत्व खत्म हो जाते हैं।',
    'दिन में सिर्फ 2 ब्राजील नट्स खाने से सेलेनियम की दैनिक जरूरत पूरी हो जाती है।',
    'मेटाबॉलिज्म को गति देने के लिए वर्जिन नारियल तेल का प्रयोग करें।'
  ],
  schedule: [
    { time: '08:00 AM', activity: 'Metabolic Kickstart', activityHi: 'मेटाबॉलिक शुरुआत', foods: 'Warm Water & Brazil Nuts', foodsHi: 'गुनगुना पानी और ब्राजील नट्स', tip: 'Selenium jumpstarts hormone conversion', tipHi: 'सेलेनियम हार्मोन सक्रिय करता है' },
    { time: '10:00 AM', activity: 'Iodine Breakfast', activityHi: 'आयोडीन नाश्ता', foods: 'Oats with Greek Yogurt', foodsHi: 'दही के साथ ओट्स', tip: 'Source of iodine and protein', tipHi: 'आयोडीन और प्रोटीन का मेल' },
    { time: '01:30 PM', activity: 'Cooked Veggie Lunch', activityHi: 'पका हुआ भोजन', foods: 'Cooked Spinach & Brown Rice', foodsHi: 'पकी हुई पालक और ब्राउन राइस', tip: 'Avoid raw salads if TSH is high', tipHi: 'TSH अधिक होने पर कच्चा सलाद न लें' },
    { time: '05:00 PM', activity: 'Healthy Fat Snack', activityHi: 'हेल्दी फैट स्नैक', foods: 'Roasted Pumpkin Seeds', foodsHi: 'भुने हुए कद्दू के बीज', tip: 'Zinc for thyroid function', tipHi: 'थायराइड के लिए जिंक' },
    { time: '08:00 PM', activity: 'Metabolic Dinner', activityHi: 'मेटाबॉलिक डिनर', foods: 'Grilled Fish or Moong Dal', foodsHi: 'ग्रिल्ड फिश या मूंग दाल', tip: 'Lean protein for night recovery', tipHi: 'रिकवरी के लिए हल्का प्रोटीन' },
  ]
};

export function getDietPlan(dietaryFlags: string[]): DietPlan {
  if (dietaryFlags.includes('ANEMIA_DIET') || dietaryFlags.includes('IRON_RICH')) return ANEMIA_DIET;
  if (dietaryFlags.includes('LIVER_DETOX_DIET') || dietaryFlags.includes('LOW_FAT') || dietaryFlags.includes('NO_ALCOHOL')) return LIVER_DETOX_DIET;
  if (dietaryFlags.includes('LOW_GLYCEMIC_DIET') || dietaryFlags.includes('LOW_SUGAR')) return LOW_GLYCEMIC_DIET;
  if (dietaryFlags.includes('HEART_HEALTHY_DIET')) return HEART_HEALTHY_DIET;
  if (dietaryFlags.includes('KIDNEY_FRIENDLY_DIET')) return KIDNEY_FRIENDLY_DIET;
  if (dietaryFlags.includes('THYROID_DIET')) return THYROID_DIET;
  return NORMAL_HEALTHY_DIET;
}

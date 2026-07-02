export const STATE_MAPPING = {
  "Andhra Pradesh": "IN-AP",
  "Arunachal Pradesh": "IN-AR",
  "Assam": "IN-AS",
  "Bihar": "IN-BR",
  "Chhattisgarh": "IN-CT",
  "Goa": "IN-GA",
  "Gujarat": "IN-GJ",
  "Haryana": "IN-HR",
  "Himachal Pradesh": "IN-HP",
  "Jharkhand": "IN-JH",
  "Karnataka": "IN-KA",
  "Kerala": "IN-KL",
  "Madhya Pradesh": "IN-MP",
  "Maharashtra": "IN-MH",
  "Manipur": "IN-MN",
  "Meghalaya": "IN-ML",
  "Mizoram": "IN-MZ",
  "Nagaland": "IN-NL",
  "Odisha": "IN-OR",
  "Punjab": "IN-PB",
  "Rajasthan": "IN-RJ",
  "Sikkim": "IN-SK",
  "Tamil Nadu": "IN-TN",
  "Telangana": "IN-TG",
  "Tripura": "IN-TR",
  "Uttar Pradesh": "IN-UP",
  "Uttarakhand": "IN-UT",
  "West Bengal": "IN-WB",
  "Andaman and Nicobar Islands": "IN-AN",
  "Chandigarh": "IN-CH",
  "Dadra and Nagar Haveli and Daman and Diu": "IN-DN",
  "Delhi": "IN-DL",
  "Jammu and Kashmir": "IN-JK",
  "Ladakh": "IN-LA",
  "Lakshadweep": "IN-LD",
  "Puducherry": "IN-PY"
};

// Reverse mapping from ID to Name
export const STATE_ID_TO_NAME = Object.entries(STATE_MAPPING).reduce((acc, [name, id]) => {
  acc[id] = name;
  return acc;
}, {});

// Popular states to highlight differently
export const POPULAR_STATES = [
  "Uttar Pradesh",
  "Maharashtra",
  "Karnataka",
  "Tamil Nadu",
  "Gujarat",
  "Delhi"
];

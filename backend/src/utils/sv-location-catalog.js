const removeAccents = (value) => {
  return String(value || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
};

const normalizeTextKey = (value) => {
  return removeAccents(value)
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
};

const cleanDigits = (value) => {
  if (value === undefined || value === null) return null;

  const digits = String(value).replace(/\D/g, '');

  return digits || null;
};

const cleanCatalogCode = (value, length = 2) => {
  const digits = cleanDigits(value);

  if (!digits) return null;
  if (digits.length === length) return digits;
  if (digits.length > length) return digits.slice(-length);

  return digits.padStart(length, '0');
};

const CAT013_MUNICIPALITIES = [
  {
    "departmentCode": "01",
    "municipalityName": "Ahuachapán Centro",
    "municipalityCode": "14",
    "legacyMunicipalityCode": "0101"
  },
  {
    "departmentCode": "01",
    "municipalityName": "Ahuachapán Norte",
    "municipalityCode": "13",
    "legacyMunicipalityCode": "0102"
  },
  {
    "departmentCode": "01",
    "municipalityName": "Ahuachapán Sur",
    "municipalityCode": "15",
    "legacyMunicipalityCode": "0103"
  },
  {
    "departmentCode": "02",
    "municipalityName": "Santa Ana Centro",
    "municipalityCode": "15",
    "legacyMunicipalityCode": "0201"
  },
  {
    "departmentCode": "02",
    "municipalityName": "Santa Ana Este",
    "municipalityCode": "16",
    "legacyMunicipalityCode": "0202"
  },
  {
    "departmentCode": "02",
    "municipalityName": "Santa Ana Norte",
    "municipalityCode": "14",
    "legacyMunicipalityCode": "0203"
  },
  {
    "departmentCode": "02",
    "municipalityName": "Santa Ana Oeste",
    "municipalityCode": "17",
    "legacyMunicipalityCode": "0204"
  },
  {
    "departmentCode": "03",
    "municipalityName": "Sonsonate Centro",
    "municipalityCode": "18",
    "legacyMunicipalityCode": "0301"
  },
  {
    "departmentCode": "03",
    "municipalityName": "Sonsonate Este",
    "municipalityCode": "19",
    "legacyMunicipalityCode": "0302"
  },
  {
    "departmentCode": "03",
    "municipalityName": "Sonsonate Norte",
    "municipalityCode": "17",
    "legacyMunicipalityCode": "0303"
  },
  {
    "departmentCode": "03",
    "municipalityName": "Sonsonate Oeste",
    "municipalityCode": "20",
    "legacyMunicipalityCode": "0304"
  },
  {
    "departmentCode": "04",
    "municipalityName": "Chalatenango Centro",
    "municipalityCode": "35",
    "legacyMunicipalityCode": "0401"
  },
  {
    "departmentCode": "04",
    "municipalityName": "Chalatenango Norte",
    "municipalityCode": "34",
    "legacyMunicipalityCode": "0402"
  },
  {
    "departmentCode": "04",
    "municipalityName": "Chalatenango Sur",
    "municipalityCode": "36",
    "legacyMunicipalityCode": "0403"
  },
  {
    "departmentCode": "05",
    "municipalityName": "La Libertad Centro",
    "municipalityCode": "24",
    "legacyMunicipalityCode": "0501"
  },
  {
    "departmentCode": "05",
    "municipalityName": "La Libertad Costa",
    "municipalityCode": "27",
    "legacyMunicipalityCode": "0502"
  },
  {
    "departmentCode": "05",
    "municipalityName": "La Libertad Este",
    "municipalityCode": "26",
    "legacyMunicipalityCode": "0503"
  },
  {
    "departmentCode": "05",
    "municipalityName": "La Libertad Norte",
    "municipalityCode": "23",
    "legacyMunicipalityCode": "0504"
  },
  {
    "departmentCode": "05",
    "municipalityName": "La Libertad Oeste",
    "municipalityCode": "25",
    "legacyMunicipalityCode": "0505"
  },
  {
    "departmentCode": "05",
    "municipalityName": "La Libertad Sur",
    "municipalityCode": "28",
    "legacyMunicipalityCode": "0506"
  },
  {
    "departmentCode": "06",
    "municipalityName": "San Salvador Centro",
    "municipalityCode": "23",
    "legacyMunicipalityCode": "0601"
  },
  {
    "departmentCode": "06",
    "municipalityName": "San Salvador Este",
    "municipalityCode": "22",
    "legacyMunicipalityCode": "0602"
  },
  {
    "departmentCode": "06",
    "municipalityName": "San Salvador Norte",
    "municipalityCode": "20",
    "legacyMunicipalityCode": "0603"
  },
  {
    "departmentCode": "06",
    "municipalityName": "San Salvador Oeste",
    "municipalityCode": "21",
    "legacyMunicipalityCode": "0604"
  },
  {
    "departmentCode": "06",
    "municipalityName": "San Salvador Sur",
    "municipalityCode": "24",
    "legacyMunicipalityCode": "0605"
  },
  {
    "departmentCode": "07",
    "municipalityName": "Cuscatlán Norte",
    "municipalityCode": "17",
    "legacyMunicipalityCode": "0701"
  },
  {
    "departmentCode": "07",
    "municipalityName": "Cuscatlán Sur",
    "municipalityCode": "18",
    "legacyMunicipalityCode": "0702"
  },
  {
    "departmentCode": "08",
    "municipalityName": "La Paz Centro",
    "municipalityCode": "24",
    "legacyMunicipalityCode": "0801"
  },
  {
    "departmentCode": "08",
    "municipalityName": "La Paz Este",
    "municipalityCode": "25",
    "legacyMunicipalityCode": "0802"
  },
  {
    "departmentCode": "08",
    "municipalityName": "La Paz Oeste",
    "municipalityCode": "23",
    "legacyMunicipalityCode": "0803"
  },
  {
    "departmentCode": "09",
    "municipalityName": "Cabañas Este",
    "municipalityCode": "11",
    "legacyMunicipalityCode": "0901"
  },
  {
    "departmentCode": "09",
    "municipalityName": "Cabañas Oeste",
    "municipalityCode": "10",
    "legacyMunicipalityCode": "0902"
  },
  {
    "departmentCode": "10",
    "municipalityName": "San Vicente Norte",
    "municipalityCode": "14",
    "legacyMunicipalityCode": "1001"
  },
  {
    "departmentCode": "10",
    "municipalityName": "San Vicente Sur",
    "municipalityCode": "15",
    "legacyMunicipalityCode": "1002"
  },
  {
    "departmentCode": "11",
    "municipalityName": "Usulután Este",
    "municipalityCode": "25",
    "legacyMunicipalityCode": "1101"
  },
  {
    "departmentCode": "11",
    "municipalityName": "Usulután Norte",
    "municipalityCode": "24",
    "legacyMunicipalityCode": "1102"
  },
  {
    "departmentCode": "11",
    "municipalityName": "Usulután Oeste",
    "municipalityCode": "26",
    "legacyMunicipalityCode": "1103"
  },
  {
    "departmentCode": "12",
    "municipalityName": "San Miguel Centro",
    "municipalityCode": "22",
    "legacyMunicipalityCode": "1201"
  },
  {
    "departmentCode": "12",
    "municipalityName": "San Miguel Norte",
    "municipalityCode": "21",
    "legacyMunicipalityCode": "1202"
  },
  {
    "departmentCode": "12",
    "municipalityName": "San Miguel Oeste",
    "municipalityCode": "23",
    "legacyMunicipalityCode": "1203"
  },
  {
    "departmentCode": "13",
    "municipalityName": "Morazán Norte",
    "municipalityCode": "27",
    "legacyMunicipalityCode": "1301"
  },
  {
    "departmentCode": "13",
    "municipalityName": "Morazán Sur",
    "municipalityCode": "28",
    "legacyMunicipalityCode": "1302"
  },
  {
    "departmentCode": "14",
    "municipalityName": "La Unión Norte",
    "municipalityCode": "19",
    "legacyMunicipalityCode": "1401"
  },
  {
    "departmentCode": "14",
    "municipalityName": "La Unión Sur",
    "municipalityCode": "20",
    "legacyMunicipalityCode": "1402"
  }
];

const municipalityByName = new Map();
const municipalityByLegacyCode = new Map();
const municipalityByCurrentCode = new Map();

for (const item of CAT013_MUNICIPALITIES) {
  const departmentCode = cleanCatalogCode(item.departmentCode, 2);
  const nameKey = normalizeTextKey(item.municipalityName);
  const currentCode = cleanCatalogCode(item.municipalityCode, 2);
  const legacyCode = cleanDigits(item.legacyMunicipalityCode);

  if (departmentCode && nameKey && currentCode) {
    municipalityByName.set(`${departmentCode}|${nameKey}`, currentCode);
    municipalityByCurrentCode.set(`${departmentCode}|${currentCode}`, currentCode);
  }

  if (departmentCode && legacyCode && currentCode) {
    municipalityByLegacyCode.set(`${departmentCode}|${legacyCode}`, currentCode);
    municipalityByLegacyCode.set(`${departmentCode}|${cleanCatalogCode(legacyCode, 2)}`, currentCode);
  }
}

const resolveSvMunicipalityCode = ({
  departmentCode,
  municipalityCode,
  municipalityName
} = {}) => {
  const department = cleanCatalogCode(departmentCode, 2);

  if (!department) return cleanCatalogCode(municipalityCode, 2);

  const currentCode = cleanCatalogCode(municipalityCode, 2);
  const rawCode = cleanDigits(municipalityCode);
  const nameKey = normalizeTextKey(municipalityName);

  if (nameKey) {
    const byName = municipalityByName.get(`${department}|${nameKey}`);

    if (byName) return byName;
  }

  if (rawCode) {
    const byLegacy = municipalityByLegacyCode.get(`${department}|${rawCode}`);

    if (byLegacy) return byLegacy;
  }

  if (currentCode) {
    const byCurrent = municipalityByCurrentCode.get(`${department}|${currentCode}`);

    if (byCurrent) return byCurrent;
  }

  return currentCode;
};

const buildSvAddressComplement = ({
  addressComplement,
  districtName
} = {}) => {
  const address = String(addressComplement || '').trim() || 'SIN DIRECCION';
  const district = String(districtName || '').trim();

  if (!district) return address;

  const normalizedAddress = normalizeTextKey(address);
  const normalizedDistrict = normalizeTextKey(district);

  if (normalizedDistrict && normalizedAddress.includes(normalizedDistrict)) {
    return address;
  }

  return `${district}, ${address}`;
};

module.exports = {
  CAT013_MUNICIPALITIES,
  buildSvAddressComplement,
  resolveSvMunicipalityCode
};

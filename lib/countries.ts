export type Country = {
  name: string
  iso2: string
  dialCode: string
  flag: string
}

export const countries: Country[] = [
  // --- Middle East & Central Asia ---
  { name: "Iran", iso2: "ir", dialCode: "98", flag: "🇮🇷" },
  { name: "Afghanistan", iso2: "af", dialCode: "93", flag: "🇦🇫" },
  { name: "Iraq", iso2: "iq", dialCode: "964", flag: "🇮🇶" },
  { name: "Turkey", iso2: "tr", dialCode: "90", flag: "🇹🇷" },
  { name: "UAE", iso2: "ae", dialCode: "971", flag: "🇦🇪" },
  { name: "Saudi Arabia", iso2: "sa", dialCode: "966", flag: "🇸🇦" },
  { name: "Kuwait", iso2: "kw", dialCode: "965", flag: "🇰🇼" },
  { name: "Qatar", iso2: "qa", dialCode: "974", flag: "🇶🇦" },
  { name: "Bahrain", iso2: "bh", dialCode: "973", flag: "🇧🇭" },
  { name: "Oman", iso2: "om", dialCode: "968", flag: "🇴🇲" },
  { name: "Jordan", iso2: "jo", dialCode: "962", flag: "🇯🇴" },
  { name: "Lebanon", iso2: "lb", dialCode: "961", flag: "🇱🇧" },
  { name: "Syria", iso2: "sy", dialCode: "963", flag: "🇸🇾" },
  { name: "Yemen", iso2: "ye", dialCode: "967", flag: "🇾🇪" },
  { name: "Pakistan", iso2: "pk", dialCode: "92", flag: "🇵🇰" },
  { name: "Azerbaijan", iso2: "az", dialCode: "994", flag: "🇦🇿" },
  { name: "Armenia", iso2: "am", dialCode: "374", flag: "🇦🇲" },
  { name: "Georgia", iso2: "ge", dialCode: "995", flag: "🇬🇪" },
  { name: "Kazakhstan", iso2: "kz", dialCode: "7", flag: "🇰🇿" },
  { name: "Uzbekistan", iso2: "uz", dialCode: "998", flag: "🇺🇿" },
  { name: "Turkmenistan", iso2: "tm", dialCode: "993", flag: "🇹🇲" },
  { name: "Tajikistan", iso2: "tj", dialCode: "992", flag: "🇹🇯" },
  { name: "Kyrgyzstan", iso2: "kg", dialCode: "996", flag: "🇰🇬" },

  // --- Europe ---
  { name: "Germany", iso2: "de", dialCode: "49", flag: "🇩🇪" },
  { name: "France", iso2: "fr", dialCode: "33", flag: "🇫🇷" },
  { name: "United Kingdom", iso2: "gb", dialCode: "44", flag: "🇬🇧" },
  { name: "Italy", iso2: "it", dialCode: "39", flag: "🇮🇹" },
  { name: "Spain", iso2: "es", dialCode: "34", flag: "🇪🇸" },
  { name: "Netherlands", iso2: "nl", dialCode: "31", flag: "🇳🇱" },
  { name: "Belgium", iso2: "be", dialCode: "32", flag: "🇧🇪" },
  { name: "Sweden", iso2: "se", dialCode: "46", flag: "🇸🇪" },
  { name: "Norway", iso2: "no", dialCode: "47", flag: "🇳🇴" },
  { name: "Denmark", iso2: "dk", dialCode: "45", flag: "🇩🇰" },
  { name: "Finland", iso2: "fi", dialCode: "358", flag: "🇫🇮" },
  { name: "Switzerland", iso2: "ch", dialCode: "41", flag: "🇨🇭" },
  { name: "Austria", iso2: "at", dialCode: "43", flag: "🇦🇹" },
  { name: "Poland", iso2: "pl", dialCode: "48", flag: "🇵🇱" },
  { name: "Portugal", iso2: "pt", dialCode: "351", flag: "🇵🇹" },
  { name: "Greece", iso2: "gr", dialCode: "30", flag: "🇬🇷" },
  { name: "Russia", iso2: "ru", dialCode: "7", flag: "🇷🇺" },
  { name: "Ukraine", iso2: "ua", dialCode: "380", flag: "🇺🇦" },
  { name: "Czech Republic", iso2: "cz", dialCode: "420", flag: "🇨🇿" },
  { name: "Romania", iso2: "ro", dialCode: "40", flag: "🇷🇴" },
  { name: "Hungary", iso2: "hu", dialCode: "36", flag: "🇭🇺" },

  // --- Americas ---
  { name: "United States", iso2: "us", dialCode: "1", flag: "🇺🇸" },
  { name: "Canada", iso2: "ca", dialCode: "1", flag: "🇨🇦" },
  { name: "Mexico", iso2: "mx", dialCode: "52", flag: "🇲🇽" },
  { name: "Brazil", iso2: "br", dialCode: "55", flag: "🇧🇷" },
  { name: "Argentina", iso2: "ar", dialCode: "54", flag: "🇦🇷" },
  { name: "Colombia", iso2: "co", dialCode: "57", flag: "🇨🇴" },
  { name: "Chile", iso2: "cl", dialCode: "56", flag: "🇨🇱" },
  { name: "Peru", iso2: "pe", dialCode: "51", flag: "🇵🇪" },

  // --- Asia ---
  { name: "China", iso2: "cn", dialCode: "86", flag: "🇨🇳" },
  { name: "Japan", iso2: "jp", dialCode: "81", flag: "🇯🇵" },
  { name: "South Korea", iso2: "kr", dialCode: "82", flag: "🇰🇷" },
  { name: "India", iso2: "in", dialCode: "91", flag: "🇮🇳" },
  { name: "Indonesia", iso2: "id", dialCode: "62", flag: "🇮🇩" },
  { name: "Malaysia", iso2: "my", dialCode: "60", flag: "🇲🇾" },
  { name: "Thailand", iso2: "th", dialCode: "66", flag: "🇹🇭" },
  { name: "Vietnam", iso2: "vn", dialCode: "84", flag: "🇻🇳" },
  { name: "Philippines", iso2: "ph", dialCode: "63", flag: "🇵🇭" },
  { name: "Singapore", iso2: "sg", dialCode: "65", flag: "🇸🇬" },
  { name: "Bangladesh", iso2: "bd", dialCode: "880", flag: "🇧🇩" },
  { name: "Nepal", iso2: "np", dialCode: "977", flag: "🇳🇵" },
  { name: "Sri Lanka", iso2: "lk", dialCode: "94", flag: "🇱🇰" },

  // --- Oceania ---
  { name: "Australia", iso2: "au", dialCode: "61", flag: "🇦🇺" },
  { name: "New Zealand", iso2: "nz", dialCode: "64", flag: "🇳🇿" },
]

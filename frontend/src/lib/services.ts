import type { ServiceConfig } from "./types";

export const SERVICES: ServiceConfig[] = [
  {
    id: "pan_card",
    name: "PAN Card Application",
    tagline: "New PAN / Correction",
    description:
      "Apply for a new Permanent Account Number or make corrections to your existing PAN card. Fast, paperless processing with digital acknowledgement.",
    fee: 150,
    icon: "CreditCard",
    accent: "from-sky-500 to-blue-600",
    fields: [
      { name: "fullName", label: "Full Name (as per Aadhaar)", type: "text", placeholder: "Rajesh Kumar Sharma", required: true, fullWidth: true },
      { name: "fatherName", label: "Father's Name", type: "text", placeholder: "Suresh Sharma", required: true, fullWidth: true },
      { name: "dob", label: "Date of Birth", type: "date", required: true },
      { name: "aadhaar", label: "Aadhaar Number", type: "text", placeholder: "XXXX XXXX XXXX", required: true, helpText: "12-digit Aadhaar number" },
      { name: "gender", label: "Gender", type: "select", required: true, options: ["Male", "Female", "Other"] },
      { name: "category", label: "Application Type", type: "select", required: true, options: ["New PAN", "Correction in PAN"] },
      { name: "address", label: "Residential Address", type: "textarea", placeholder: "House no, Street, City, State, PIN", required: true, fullWidth: true },
    ],
    documents: [
      { name: "aadhaar_front", label: "Aadhaar Front", description: "Front side of your Aadhaar card", required: true },
      { name: "aadhaar_back", label: "Aadhaar Back", description: "Back side of your Aadhaar card", required: true },
      { name: "pan_proof", label: "Existing PAN (if correction)", description: "Only required for correction applications", required: false },
      { name: "address_proof", label: "Address Proof", description: "Utility bill, voter ID, or passport", required: true },
      { name: "photo", label: "Passport-size Photo", description: "Recent colour photograph", required: true },
    ],
  },
  {
    id: "gumasta_license",
    name: "Gumasta License",
    tagline: "Shop Establishment",
    description:
      "Obtain your Shops and Establishments (Gumasta) licence required to legally operate any commercial establishment in Madhya Pradesh.",
    fee: 599,
    icon: "Store",
    accent: "from-amber-500 to-orange-600",
    fields: [
      { name: "shopName", label: "Shop / Establishment Name", type: "text", placeholder: "Sharma General Store", required: true, fullWidth: true },
      { name: "ownerName", label: "Owner's Full Name", type: "text", placeholder: "Rajesh Sharma", required: true, fullWidth: true },
      { name: "premisesType", label: "Premises Type", type: "select", required: true, options: ["Owned", "Rented", "Leased"] },
      { name: "employeeCount", label: "Number of Employees", type: "text", placeholder: "e.g. 5", required: true },
      { name: "natureBusiness", label: "Nature of Business", type: "text", placeholder: "e.g. Retail Grocery", required: true, fullWidth: true },
      { name: "shopAddress", label: "Shop Address", type: "textarea", placeholder: "Shop no, Market, City, State, PIN", required: true, fullWidth: true },
      { name: "gstn", label: "GSTIN (if applicable)", type: "text", placeholder: "23ABCDE1234F1Z5", required: false },
    ],
    documents: [
      { name: "aadhaar_front", label: "Aadhaar Front", description: "Front side of owner's Aadhaar card", required: true },
      { name: "aadhaar_back", label: "Aadhaar Back", description: "Back side of owner's Aadhaar card", required: true },
      { name: "address_proof", label: "Shop Address Proof", description: "Electricity bill, property tax receipt, or rent agreement", required: true },
      { name: "rent_agreement", label: "Rent Agreement (if rented)", description: "Only required if premises are rented", required: false },
      { name: "photo", label: "Owner's Passport Photo", description: "Recent colour photograph of the owner", required: true },
    ],
  },
  {
    id: "msme_registration",
    name: "MSME / Udyam",
    tagline: "MSME / Udyam Certificate",
    description:
      "Register your micro, small, or medium enterprise under the MSME / Udyam scheme. Receive a government-recognised certificate with URN to avail subsidies, lower interest loans, and scheme benefits.",
    fee: 199,
    icon: "Factory",
    accent: "from-emerald-500 to-teal-600",
    fields: [
      { name: "enterpriseName", label: "Enterprise / Business Name", type: "text", placeholder: "Sharma Traders", required: true, fullWidth: true },
      { name: "unitType", label: "Unit Type", type: "select", required: true, options: ["Micro", "Small", "Medium"] },
      { name: "activity", label: "Main Business Activity", type: "select", required: true, options: ["Manufacturing", "Service", "Trading"] },
      { name: "organisation", label: "Organisation Type", type: "select", required: true, options: ["Proprietorship", "Partnership", "Private Limited", "LLP", "HUF"] },
      { name: "pan", label: "Proprietor / Partner PAN", type: "text", placeholder: "ABCDE1234F", required: true },
      { name: "bankAccount", label: "Bank Account Number", type: "text", placeholder: "XXXXXXXXXX", required: true },
      { name: "ifsc", label: "IFSC Code", type: "text", placeholder: "HDFC0001234", required: true },
      { name: "investment", label: "Total Investment in Plant & Machinery (Rs.)", type: "text", placeholder: "e.g. 500000", required: true },
      { name: "turnover", label: "Annual Turnover (Rs.)", type: "text", placeholder: "e.g. 2500000", required: true },
      { name: "officialAddress", label: "Business Address", type: "textarea", placeholder: "Premises, Area, City, State, PIN", required: true, fullWidth: true },
      { name: "aadhaar", label: "Aadhaar of Applicant", type: "text", placeholder: "XXXX XXXX XXXX", required: true },
    ],
    documents: [
      { name: "aadhaar_front", label: "Aadhaar Front", description: "Front side of your Aadhaar card", required: true },
      { name: "aadhaar_back", label: "Aadhaar Back", description: "Back side of your Aadhaar card", required: true },
      { name: "pan_card", label: "PAN Card", description: "Of the proprietor / partner / organisation", required: true },
      { name: "bank_proof", label: "Bank Proof", description: "Cancelled cheque or bank statement", required: true },
      { name: "business_proof", label: "Business Address Proof", description: "Utility bill or rental agreement for business premises", required: true },
    ],
  },
];

export const SERVICE_MAP: Record<string, ServiceConfig> = Object.fromEntries(
  SERVICES.map((s) => [s.id, s]),
);

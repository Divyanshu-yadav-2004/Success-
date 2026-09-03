export type Language = "en" | "hi";

export interface Translations {
  // Navbar
  navbar: {
    support: string;
    logout: string;
    myProfile: string;
    updateContactDetails: string;
    fullName: string;
    phoneNumber: string;
    address: string;
    enterFullName: string;
    enterPhone: string;
    enterAddress: string;
    role: string;
    cancel: string;
    saveChanges: string;
    saving: string;
    profileUpdated: string;
    error: string;
    viewOrEditProfile: string;
  };
  
  // Dashboard
  dashboard: {
    availableServices: string;
    selectServiceToStart: string;
    mySubmittedApplications: string;
    noApplicationsFound: string;
    chooseServiceToStart: string;
    loadingApplications: string;
    errorLoadingApplications: string;
    noApplicationsMatch: string;
    viewApplication: string;
    details: string;
    close: string;
    submittedInformation: string;
    fee: string;
    applyNow: string;
    backToDashboard: string;
    applicationId: string;
    status: string;
    applicant: string;
    date: string;
    processing: string;
    completed: string;
    delivered: string;
    documentArrived: string;
    downloadPdfDocument: string;
  };
  
  // Admin Dashboard
  admin: {
    overviewDashboard: string;
    allApplications: string;
    userManagement: string;
    deliveryLogs: string;
    publishAnnouncement: string;
    allSystemSubmissions: string;
    manageCitizenSubmissions: string;
    searchByIdNameService: string;
    all: string;
    pending: string;
    completed: string;
    delivered: string;
    deliverDocument: string;
    loadingApplications: string;
    errorLoadingApplications: string;
    noApplicationsMatch: string;
  };
  
  // Service Form
  serviceForm: {
    backToDashboard: string;
    details: string;
    documents: string;
    payment: string;
    receipt: string;
    email: string;
    phoneNumber: string;
    serviceFee: string;
    proceedToDocuments: string;
    back: string;
    proceedToPayment: string;
    uploadDocuments: string;
    uploadRequiredDocuments: string;
    acceptedFormats: string;
    mandatoryFiles: string;
    pleaseUploadRequiredDocuments: string;
    applicationSubmittedSuccessfully: string;
    applicationRegistered: string;
    uniqueApplicationId: string;
    copyId: string;
    copied: string;
    keepApplicationIdSafe: string;
    confirmationEmailSent: string;
    aCopyDelivered: string;
    applicationSavedEmailNotice: string;
    automatedEmailCouldNotComplete: string;
    applicationIdValid: string;
    serviceName: string;
    applicantName: string;
    submissionTime: string;
    currentStatus: string;
    submittedUnderReview: string;
    officialSupport: string;
    trackApplication: string;
    downloadPdfReceipt: string;
    serviceNotFound: string;
    userSessionLost: string;
    failedToSubmit: string;
    paymentCancelled: string;
    select: string;
  };
  
  // Service Names
  services: {
    panCard: string;
    panCardTagline: string;
    panCardDescription: string;
    gumastaLicense: string;
    gumastaLicenseTagline: string;
    gumastaLicenseDescription: string;
    msmeRegistration: string;
    msmeRegistrationTagline: string;
    msmeRegistrationDescription: string;
  };
  
  // Service Fields
  fields: {
    fullName: string;
    fathersName: string;
    dateOfBirth: string;
    aadhaarNumber: string;
    gender: string;
    applicationType: string;
    residentialAddress: string;
    shopName: string;
    ownersFullName: string;
    premisesType: string;
    numberOfEmployees: string;
    natureOfBusiness: string;
    shopAddress: string;
    gstin: string;
    enterpriseName: string;
    unitType: string;
    mainBusinessActivity: string;
    organisationType: string;
    pan: string;
    bankAccountNumber: string;
    ifscCode: string;
    totalInvestment: string;
    annualTurnover: string;
    businessAddress: string;
    aadhaarOfApplicant: string;
  };
  
  // Field Options
  options: {
    male: string;
    female: string;
    other: string;
    newPan: string;
    correctionInPan: string;
    owned: string;
    rented: string;
    leased: string;
    micro: string;
    small: string;
    medium: string;
    manufacturing: string;
    service: string;
    trading: string;
    proprietorship: string;
    partnership: string;
    privateLimited: string;
    llp: string;
    huf: string;
  };
  
  // Documents
  documents: {
    aadhaarCard: string;
    aadhaarCardDescription: string;
    aadhaarFront: string;
    aadhaarFrontDescription: string;
    aadhaarBack: string;
    aadhaarBackDescription: string;
    existingPan: string;
    existingPanDescription: string;
    addressProof: string;
    addressProofDescription: string;
    passportSizePhoto: string;
    passportSizePhotoDescription: string;
    ownerIdProof: string;
    ownerIdProofDescription: string;
    shopAddressProof: string;
    shopAddressProofDescription: string;
    rentAgreement: string;
    rentAgreementDescription: string;
    ownersPassportPhoto: string;
    ownersPassportPhotoDescription: string;
    panCard: string;
    panCardDescription: string;
    bankProof: string;
    bankProofDescription: string;
    businessAddressProof: string;
    businessAddressProofDescription: string;
  };
  
  // Common
  common: {
    loading: string;
    error: string;
    success: string;
    required: string;
  };
}

export const translations: Record<Language, Translations> = {
  en: {
    navbar: {
      support: "Support",
      logout: "Logout",
      myProfile: "My Profile",
      updateContactDetails: "Update your contact details",
      fullName: "Full Name",
      phoneNumber: "Phone Number",
      address: "Address",
      enterFullName: "Enter full name",
      enterPhone: "10-digit mobile",
      enterAddress: "Enter full address",
      role: "Role",
      cancel: "Cancel",
      saveChanges: "Save Changes",
      saving: "Saving...",
      profileUpdated: "Profile updated successfully!",
      error: "Error",
      viewOrEditProfile: "View / edit profile",
    },
    dashboard: {
      availableServices: "Available Services",
      selectServiceToStart: "Select an existing service below to start your application",
      mySubmittedApplications: "My Submitted Applications",
      noApplicationsFound: "No applications found. Choose a service above to get started.",
      chooseServiceToStart: "Choose a service above to get started.",
      loadingApplications: "Loading applications...",
      errorLoadingApplications: "Error loading applications",
      noApplicationsMatch: "No applications match your current search/filter.",
      viewApplication: "View Application",
      details: "Details",
      close: "Close",
      submittedInformation: "Submitted Information",
      fee: "Fee",
      applyNow: "Apply Now",
      backToDashboard: "Back to dashboard",
      applicationId: "Application ID",
      status: "Status",
      applicant: "Applicant",
      date: "Date",
      processing: "Processing",
      completed: "Completed",
      delivered: "Delivered",
      documentArrived: "Your document has arrived!",
      downloadPdfDocument: "Download PDF Document",
    },
    admin: {
      overviewDashboard: "Overview Dashboard",
      allApplications: "All Applications",
      userManagement: "User Management",
      deliveryLogs: "Delivery Logs",
      publishAnnouncement: "Publish Announcement",
      allSystemSubmissions: "All System Submissions",
      manageCitizenSubmissions: "Manage citizen service submissions and deliver government documents cleanly",
      searchByIdNameService: "Search by ID, name, service...",
      all: "All",
      pending: "Pending",
      completed: "Completed",
      delivered: "Delivered",
      deliverDocument: "Deliver Document",
      loadingApplications: "Loading applications...",
      errorLoadingApplications: "Error loading applications",
      noApplicationsMatch: "No applications match your current search/filter.",
    },
    serviceForm: {
      backToDashboard: "Back to dashboard",
      details: "Details",
      documents: "Documents",
      payment: "Payment",
      receipt: "Receipt",
      email: "Email",
      phoneNumber: "Phone Number",
      serviceFee: "Service fee",
      proceedToDocuments: "Proceed to Documents",
      back: "Back",
      proceedToPayment: "Proceed to Payment",
      uploadDocuments: "Upload Documents",
      uploadRequiredDocuments: "Upload all required documents to proceed with your application.",
      acceptedFormats: "Accepted formats: JPG, PNG, and PDF. Maximum file size: 10 MB. Files marked with * are mandatory.",
      mandatoryFiles: "mandatory",
      pleaseUploadRequiredDocuments: "Please upload all required documents",
      applicationSubmittedSuccessfully: "✓ Application Submitted Successfully",
      applicationRegistered: "Your application has been registered, saved in our central portal database, and assigned a unique Application ID for tracking.",
      uniqueApplicationId: "Unique Application ID",
      copyId: "Copy ID",
      copied: "Copied!",
      keepApplicationIdSafe: "🔒 Keep your Application ID safe for tracking & reference",
      confirmationEmailSent: "✉ Confirmation email sent to:",
      aCopyDelivered: "A copy of your submission receipt and status details has been delivered.",
      applicationSavedEmailNotice: "⚠️ Application Saved (Email Delivery Notice)",
      automatedEmailCouldNotComplete: "Your application is saved securely. Automated email dispatch could not complete, but your Application ID is valid.",
      applicationIdValid: "Your Application ID is valid.",
      serviceName: "Service Name",
      applicantName: "Applicant Name",
      submissionTime: "Submission Time",
      currentStatus: "Current Status",
      submittedUnderReview: "Submitted / Under Review",
      officialSupport: "Official Support",
      trackApplication: "Track Application",
      downloadPdfReceipt: "Download PDF Receipt",
      serviceNotFound: "Service not found.",
      userSessionLost: "User session lost. Please log in again.",
      failedToSubmit: "Failed to submit. Please try again.",
      paymentCancelled: "Payment was cancelled. You can try again.",
      select: "Select...",
    },
    services: {
      panCard: "PAN Card Application",
      panCardTagline: "New PAN / Correction",
      panCardDescription: "Apply for a new Permanent Account Number or make corrections to your existing PAN card. Fast, paperless processing with digital acknowledgement.",
      gumastaLicense: "Gumasta License",
      gumastaLicenseTagline: "Shop Establishment",
      gumastaLicenseDescription: "Obtain your Shops and Establishments (Gumasta) licence required to legally operate any commercial establishment in Madhya Pradesh.",
      msmeRegistration: "MSME / Udyam",
      msmeRegistrationTagline: "MSME / Udyam Certificate",
      msmeRegistrationDescription: "Register your micro, small, or medium enterprise under the MSME / Udyam scheme. Receive a government-recognised certificate with URN to avail subsidies, lower interest loans, and scheme benefits.",
    },
    fields: {
      fullName: "Full Name (as per Aadhaar)",
      fathersName: "Father's Name",
      dateOfBirth: "Date of Birth",
      aadhaarNumber: "Aadhaar Number",
      gender: "Gender",
      applicationType: "Application Type",
      residentialAddress: "Residential Address",
      shopName: "Shop / Establishment Name",
      ownersFullName: "Owner's Full Name",
      premisesType: "Premises Type",
      numberOfEmployees: "Number of Employees",
      natureOfBusiness: "Nature of Business",
      shopAddress: "Shop Address",
      gstin: "GSTIN (if applicable)",
      enterpriseName: "Enterprise / Business Name",
      unitType: "Unit Type",
      mainBusinessActivity: "Main Business Activity",
      organisationType: "Organisation Type",
      pan: "Proprietor / Partner PAN",
      bankAccountNumber: "Bank Account Number",
      ifscCode: "IFSC Code",
      totalInvestment: "Total Investment in Plant & Machinery (Rs.)",
      annualTurnover: "Annual Turnover (Rs.)",
      businessAddress: "Business Address",
      aadhaarOfApplicant: "Aadhaar of Applicant",
    },
    options: {
      male: "Male",
      female: "Female",
      other: "Other",
      newPan: "New PAN",
      correctionInPan: "Correction in PAN",
      owned: "Owned",
      rented: "Rented",
      leased: "Leased",
      micro: "Micro",
      small: "Small",
      medium: "Medium",
      manufacturing: "Manufacturing",
      service: "Service",
      trading: "Trading",
      proprietorship: "Proprietorship",
      partnership: "Partnership",
      privateLimited: "Private Limited",
      llp: "LLP",
      huf: "HUF",
    },
    documents: {
      aadhaarCard: "Aadhaar Card",
      aadhaarCardDescription: "Front + back of your Aadhaar card",
      aadhaarFront: "Aadhaar Front",
      aadhaarFrontDescription: "Front side of your Aadhaar card",
      aadhaarBack: "Aadhaar Back",
      aadhaarBackDescription: "Back side of your Aadhaar card",
      existingPan: "Existing PAN (if correction)",
      existingPanDescription: "Only required for correction applications",
      addressProof: "Address Proof",
      addressProofDescription: "Utility bill, voter ID, or passport",
      passportSizePhoto: "Passport-size Photo",
      passportSizePhotoDescription: "Recent colour photograph",
      ownerIdProof: "Owner ID Proof",
      ownerIdProofDescription: "Aadhaar, PAN, or voter ID of the owner",
      shopAddressProof: "Shop Address Proof",
      shopAddressProofDescription: "Electricity bill, property tax receipt, or rent agreement",
      rentAgreement: "Rent Agreement (if rented)",
      rentAgreementDescription: "Only required if premises are rented",
      ownersPassportPhoto: "Owner's Passport Photo",
      ownersPassportPhotoDescription: "Recent colour photograph of the owner",
      panCard: "PAN Card",
      panCardDescription: "Of the proprietor / partner / organisation",
      bankProof: "Bank Proof",
      bankProofDescription: "Cancelled cheque or bank statement",
      businessAddressProof: "Business Address Proof",
      businessAddressProofDescription: "Utility bill or rental agreement for business premises",
    },
    common: {
      loading: "Loading",
      error: "Error",
      success: "Success",
      required: "Required",
    },
  },
  hi: {
    navbar: {
      support: "सहायता",
      logout: "लॉग आउट",
      myProfile: "मेरी प्रोफ़ाइल",
      updateContactDetails: "अपनी संपर्क जानकारी अपडेट करें",
      fullName: "पूरा नाम",
      phoneNumber: "फ़ोन नंबर",
      address: "पता",
      enterFullName: "पूरा नाम दर्ज करें",
      enterPhone: "10-अंकीय मोबाइल",
      enterAddress: "पूरा पता दर्ज करें",
      role: "भूमिका",
      cancel: "रद्द करें",
      saveChanges: "परिवर्तन सहेजें",
      saving: "सहेज रहा है...",
      profileUpdated: "प्रोफ़ाइल सफलतापूर्वक अपडेट की गई!",
      error: "त्रुटि",
      viewOrEditProfile: "प्रोफ़ाइल देखें / संपादित करें",
    },
    dashboard: {
      availableServices: "उपलब्ध सेवाएं",
      selectServiceToStart: "अपना आवेदन शुरू करने के लिए नीचे दी गई किसी सेवा का चयन करें",
      mySubmittedApplications: "मेरे जमा किए गए आवेदन",
      noApplicationsFound: "कोई आवेदन नहीं मिला। शुरू करने के लिए ऊपर से कोई सेवा चुनें।",
      chooseServiceToStart: "शुरू करने के लिए ऊपर से कोई सेवा चुनें।",
      loadingApplications: "आवेदन लोड हो रहे हैं...",
      errorLoadingApplications: "आवेदन लोड करने में त्रुटि",
      noApplicationsMatch: "आपकी वर्तमान खोज/फ़िल्टर से कोई आवेदन मेल नहीं खाता।",
      viewApplication: "आवेदन देखें",
      details: "विवरण",
      close: "बंद करें",
      submittedInformation: "जमा की गई जानकारी",
      fee: "शुल्क",
      applyNow: "अभी आवेदन करें",
      backToDashboard: "डैशबोर्ड पर वापस",
      applicationId: "आवेदन आईडी",
      status: "स्थिति",
      applicant: "आवेदक",
      date: "दिनांक",
      processing: "प्रक्रिया में",
      completed: "पूर्ण",
      delivered: "वितरित",
      documentArrived: "आपका दस्तावेज़ आ गया है!",
      downloadPdfDocument: "पीडीएफ दस्तावेज़ डाउनलोड करें",
    },
    admin: {
      overviewDashboard: "विवरण डैशबोर्ड",
      allApplications: "सभी आवेदन",
      userManagement: "उपयोगकर्ता प्रबंधन",
      deliveryLogs: "वितरण लॉग",
      publishAnnouncement: "घोषणा प्रकाशित करें",
      allSystemSubmissions: "सभी सिस्टम जमा",
      manageCitizenSubmissions: "नागरिक सेवा जमा का प्रबंधन करें और सरकारी दस्तावेजों को साफ़-सुथरे तरीके से वितरित करें",
      searchByIdNameService: "आईडी, नाम, सेवा से खोजें...",
      all: "सभी",
      pending: "लंबित",
      completed: "पूर्ण",
      delivered: "वितरित",
      deliverDocument: "दस्तावेज़ वितरित करें",
      loadingApplications: "आवेदन लोड हो रहे हैं...",
      errorLoadingApplications: "आवेदन लोड करने में त्रुटि",
      noApplicationsMatch: "आपकी वर्तमान खोज/फ़िल्टर से कोई आवेदन मेल नहीं खाता।",
    },
    serviceForm: {
      backToDashboard: "डैशबोर्ड पर वापस",
      details: "विवरण",
      documents: "दस्तावेज",
      payment: "भुगतान",
      receipt: "रसीद",
      email: "ईमेल",
      phoneNumber: "फ़ोन नंबर",
      serviceFee: "सेवा शुल्क",
      proceedToDocuments: "दस्तावेजों पर आगे बढ़ें",
      back: "वापस",
      proceedToPayment: "भुगतान पर आगे बढ़ें",
      uploadDocuments: "दस्तावेज़ अपलोड करें",
      uploadRequiredDocuments: "अपने आवेदन के साथ आगे बढ़ने के लिए सभी आवश्यक दस्तावेज़ अपलोड करें।",
      acceptedFormats: "स्वीकृत प्रारूप: JPG, PNG और PDF। अधिकतम फ़ाइल आकार: 10 MB। * चिह्नित फ़ाइलें अनिवार्य हैं।",
      mandatoryFiles: "अनिवार्य",
      pleaseUploadRequiredDocuments: "कृपया सभी आवश्यक दस्तावेज़ अपलोड करें",
      applicationSubmittedSuccessfully: "✓ आवेदन सफलतापूर्वक जमा किया गया",
      applicationRegistered: "आपका आवेदन पंजीकृत हो गया है, हमारे केंद्रीय पोर्टल डेटाबेस में सहेजा गया है, और ट्रैकिंग के लिए एक अद्वितीय आवेदन आईडी सौंपा गया है।",
      uniqueApplicationId: "अद्वितीय आवेदन आईडी",
      copyId: "आईडी कॉपी करें",
      copied: "कॉपी किया गया!",
      keepApplicationIdSafe: "🔒 ट्रैकिंग और संदर्भ के लिए अपना आवेदन आईडी सुरक्षित रखें",
      confirmationEmailSent: "✉ पुष्टि ईमेल भेजा गया:",
      aCopyDelivered: "आपकी जमा रसीद और स्थिति विवरण की एक प्रति वितरित की गई है।",
      applicationSavedEmailNotice: "⚠️ आवेदन सहेजा गया (ईमेल वितरण नोटिस)",
      automatedEmailCouldNotComplete: "आपका आवेदन सुरक्षित रूप से सहेजा गया है। स्वचालित ईमेल वितरण पूरा नहीं हो सका, लेकिन आपका आवेदन आईडी मान्य है।",
      applicationIdValid: "आपका आवेदन आईडी मान्य है।",
      serviceName: "सेवा का नाम",
      applicantName: "आवेदक का नाम",
      submissionTime: "जमा समय",
      currentStatus: "वर्तमान स्थिति",
      submittedUnderReview: "जमा किया गया / समीक्षा में",
      officialSupport: "आधिकारिक सहायता",
      trackApplication: "आवेदन ट्रैक करें",
      downloadPdfReceipt: "पीडीएफ रसीद डाउनलोड करें",
      serviceNotFound: "सेवा नहीं मिली।",
      userSessionLost: "उपयोगकर्ता सत्र समाप्त। कृपया पुनः लॉग इन करें।",
      failedToSubmit: "जमा करने में विफल। कृपया पुनः प्रयास करें।",
      paymentCancelled: "भुगतान रद्द कर दिया गया। आप पुनः प्रयास कर सकते हैं।",
      select: "चुनें...",
    },
    services: {
      panCard: "पैन कार्ड आवेदन",
      panCardTagline: "नया पैन / सुधार",
      panCardDescription: "नया स्थायी खाता संख्या प्राप्त करें या अपने मौजूदा पैन कार्ड में सुधार करें। डिजिटल पुष्टि के साथ तेज़, पेपरलेस प्रसंस्करण।",
      gumastaLicense: "गुमास्ता लाइसेंस",
      gumastaLicenseTagline: "दुकान स्थापन",
      gumastaLicenseDescription: "मध्य प्रदेश में किसी भी वाणिज्यिक प्रतिष्ठान को कानूनी रूप से संचालित करने के लिए आवश्यक दुकान और प्रतिष्ठान (गुमास्ता) लाइसेंस प्राप्त करें।",
      msmeRegistration: "एमएसएमई / उद्यम",
      msmeRegistrationTagline: "एमएसएमई / उद्यम प्रमाण पत्र",
      msmeRegistrationDescription: "अपने सूक्ष्म, लघु या मध्यम उद्यम को एमएसएमई / उद्यम योजना के तहत पंजीकृत करें। सब्सिडी, कम ब्याज वाले ऋण और योजना लाभों के लिए सरकार द्वारा मान्य प्रमाण पत्र और URN प्राप्त करें।",
    },
    fields: {
      fullName: "पूरा नाम (आधार के अनुसार)",
      fathersName: "पिता का नाम",
      dateOfBirth: "जन्म तिथि",
      aadhaarNumber: "आधार संख्या",
      gender: "लिंग",
      applicationType: "आवेदन प्रकार",
      residentialAddress: "आवासीय पता",
      shopName: "दुकान / प्रतिष्ठान का नाम",
      ownersFullName: "मालिक का पूरा नाम",
      premisesType: "परिसर प्रकार",
      numberOfEmployees: "कर्मचारियों की संख्या",
      natureOfBusiness: "व्यवसाय की प्रकृति",
      shopAddress: "दुकान का पता",
      gstin: "जीएसटीआईएन (यदि लागू हो)",
      enterpriseName: "उद्यम / व्यवसाय का नाम",
      unitType: "इकाई प्रकार",
      mainBusinessActivity: "मुख्य व्यवसायिक गतिविधि",
      organisationType: "संगठन प्रकार",
      pan: "स्वामी / भागीदार पैन",
      bankAccountNumber: "बैंक खाता संख्या",
      ifscCode: "आईएफएससी कोड",
      totalInvestment: "संयंत्र और मशीनरी में कुल निवेश (रु.)",
      annualTurnover: "वार्षिक कारोबार (रु.)",
      businessAddress: "व्यवसाय पता",
      aadhaarOfApplicant: "आवेदक का आधार",
    },
    options: {
      male: "पुरुष",
      female: "महिला",
      other: "अन्य",
      newPan: "नया पैन",
      correctionInPan: "पैन में सुधार",
      owned: "स्वामित्व",
      rented: "किराए पर",
      leased: "लीज पर",
      micro: "सूक्ष्म",
      small: "लघु",
      medium: "मध्यम",
      manufacturing: "विनिर्माण",
      service: "सेवा",
      trading: "व्यापार",
      proprietorship: "स्वामित्व",
      partnership: "साझेदारी",
      privateLimited: "प्राइवेट लिमिटेड",
      llp: "एलएलपी",
      huf: "एचयूएफ",
    },
    documents: {
      aadhaarCard: "आधार कार्ड",
      aadhaarCardDescription: "आपके आधार कार्ड का सामने + पीछे",
      aadhaarFront: "आधार कार्ड (सामने का भाग)",
      aadhaarFrontDescription: "आपके आधार कार्ड का सामने का भाग",
      aadhaarBack: "आधार कार्ड (पीछे का भाग)",
      aadhaarBackDescription: "आपके आधार कार्ड का पीछे का भाग",
      existingPan: "मौजूदा पैन (यदि सुधार)",
      existingPanDescription: "केवल सुधार आवेदनों के लिए आवश्यक",
      addressProof: "पता प्रमाण",
      addressProofDescription: "उपयोगिता बिल, मतदाता पहचान पत्र, या पासपोर्ट",
      passportSizePhoto: "पासपोर्ट-साइज़ फोटो",
      passportSizePhotoDescription: "हाल की रंगीन तस्वीर",
      ownerIdProof: "मालिक आईडी प्रमाण",
      ownerIdProofDescription: "मालिक का आधार, पैन, या मतदाता पहचान पत्र",
      shopAddressProof: "दुकान पता प्रमाण",
      shopAddressProofDescription: "बिजली बिल, संपदा कर रसीद, या किराया समझौता",
      rentAgreement: "किराया समझौता (यदि किराए पर)",
      rentAgreementDescription: "केवल तभी आवश्यक जब परिसर किराए पर हो",
      ownersPassportPhoto: "मालिक का पासपोर्ट फोटो",
      ownersPassportPhotoDescription: "मालिक की हाल की रंगीन तस्वीर",
      panCard: "पैन कार्ड",
      panCardDescription: "स्वामी / भागीदार / संगठन का",
      bankProof: "बैंक प्रमाण",
      bankProofDescription: "रद्द किया गया चेक या बैंक स्टेटमेंट",
      businessAddressProof: "व्यवसाय पता प्रमाण",
      businessAddressProofDescription: "व्यवसाय परिसर के लिए उपयोगिता बिल या किराया समझौता",
    },
    common: {
      loading: "लोड हो रहा है",
      error: "त्रुटि",
      success: "सफलता",
      required: "आवश्यक",
    },
  },
};

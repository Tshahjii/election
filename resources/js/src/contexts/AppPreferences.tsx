import PropTypes from 'prop-types';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AppPreferencesContext = createContext(null);

const translations = {
  en: {
    'app.name': 'Election Management Portal',
    'app.caption': 'Government Operations',
    'controls.language': 'Change language',
    'controls.theme': 'Change theme',
    'controls.english': 'English',
    'controls.hindi': 'Hindi',
    'controls.light': 'Light',
    'controls.dark': 'Dark',
    'customizer.title': 'Customizer',
    'customizer.themeMode': 'Theme mode',
    'customizer.accentColor': 'Accent color',
    'customizer.language': 'Language',
    'customizer.layoutDensity': 'Layout density',
    'customizer.fontSize': 'Font size',
    'customizer.reset': 'Reset preferences',
    'customizer.comfort': 'Comfort',
    'customizer.compact': 'Compact',
    'customizer.normal': 'Normal',
    'customizer.large': 'Large',
    'error.title': 'Something went wrong',
    'error.message': 'Unable to load this page. Please try again.',
    'error.reload': 'Reload page',
    'error.login': 'Go to login',
    'auth.title': 'Officer Sign In',
    'auth.subtitle': 'Access the election dashboard with your registered mobile number and OTP.',
    'auth.officialLogin': 'Official Login',
    'auth.mobileOtpLogin': 'Mobile OTP Login',
    'auth.roleBasedAccess': 'Role Based Access',
    'auth.heroTitle': 'Secure access for election officials',
    'auth.heroBody': 'Monitor voter records, polling station activity, and administrative tasks from a verified mobile login.',
    'auth.protectedSession': 'Protected session',
    'auth.protectedSessionBody': 'OTP verification helps keep election data access controlled.',
    'auth.otpIntro': 'OTP will be sent to the mobile number registered with the election office.',
    'auth.mobileLabel': 'Registered Mobile Number',
    'auth.mobilePlaceholder': 'Registered mobile number',
    'auth.passwordLabel': 'Password',
    'auth.passwordPlaceholder': 'Enter your password',
    'auth.otpLabel': 'Verification OTP',
    'auth.otpPlaceholder': 'Enter 6 digit OTP',
    'auth.changeMobile': 'Change mobile number',
    'auth.resendOtp': 'Resend OTP',
    'auth.otpExpired': 'OTP expired',
    'auth.otpExpiredFull': 'OTP expired. Please resend OTP.',
    'auth.otpExpiresIn': 'OTP expires in',
    'auth.humanPending': 'Complete human verification before verifying OTP.',
    'auth.humanDone': 'Human verification complete.',
    'auth.sendOtp': 'Send OTP',
    'auth.verifyOtp': 'Verify OTP',
    'menu.dashboardOverview': 'Dashboard Overview',
    'menu.voterManagement': 'Voter Management',
    'menu.voterList': 'Voter List',
    'menu.verificationQueue': 'Verification Queue',
    'menu.claimsObjections': 'Claims & Objections',
    'menu.master': 'Master',
    'menu.masterCountry': 'Country Master',
    'menu.masterState': 'State Master',
    'menu.masterDistrict': 'District Master',
    'menu.masterOffice': 'Office Master',
    'menu.masterCity': 'City Master',
    'menu.masterWard': 'Ward Master',
    'menu.masterPollingStation': 'Polling Station Master',
    'menu.users': 'Users',
    'menu.accessManagement': 'Access Management',
    'menu.pollingOperations': 'Polling Operations',
    'menu.boothMapping': 'Booth Mapping',
    'menu.pollingStations': 'Polling Stations',
    'menu.turnoutMonitor': 'Turnout Monitor',
    'menu.reportsSecurity': 'Reports & Security',
    'menu.electionReports': 'Election Reports',
    'menu.auditLog': 'Audit Log',
    'breadcrumb.home': 'Home',
    'common.create': 'Create',
    'common.update': 'Update',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.search': 'Search',
    'common.view': 'View',
    'common.status': 'Status',
    'common.active': 'Active',
    'common.inactive': 'Inactive',
    'common.allStatus': 'All Status',
    'common.allStates': 'All States',
    'common.allDistricts': 'All Districts',
    'common.allCities': 'All Cities',
    'common.allWards': 'All Wards',
    'common.attachment': 'Attachment',
    'common.action': 'Action',
    'common.rows': 'rows',
    'common.sno': 'S.No',
    'common.noRecords': 'No records found.',
    'common.loading': 'Loading...',
    'common.uploadLogo': 'Upload Logo Image',
    'common.existingFile': 'Existing file will remain unchanged.',
    'common.deleteConfirm': 'This record will be permanently deleted.',
    'masters.master': 'Master',
    'masters.managePrefix': 'Manage',
    'masters.manageSuffix': 'master records.',
    'masters.countries': 'Countries',
    'masters.country': 'Country',
    'masters.states': 'States',
    'masters.state': 'State',
    'masters.districts': 'Districts',
    'masters.district': 'District',
    'masters.offices': 'Offices',
    'masters.office': 'Office',
    'masters.cities': 'Cities',
    'masters.city': 'City',
    'masters.wards': 'Wards',
    'masters.ward': 'Ward',
    'masters.pollingStations': 'Polling Stations',
    'masters.pollingStation': 'Polling Station',
    'field.name': 'Name',
    'field.iso2': 'ISO2',
    'field.iso3': 'ISO3',
    'field.phoneCode': 'Phone Code',
    'field.currency': 'Currency',
    'field.nationality': 'Nationality',
    'field.code': 'Code',
    'field.country': 'Country',
    'field.state': 'State',
    'field.district': 'District',
    'field.department': 'Department',
    'field.type': 'Type',
    'field.city': 'City',
    'field.ward': 'Ward',
    'field.cityName': 'City Name',
    'field.wardNo': 'Ward No',
    'field.wardName': 'Ward Name',
    'field.pollingStationName': 'Polling Station Name',
    'field.officeCode': 'Office Code',
    'field.officeName': 'Office Name',
    'field.officeType': 'Office Type',
    'field.parentOfficeId': 'Parent Office ID',
    'field.countryName': 'Country Name',
    'field.stateName': 'State Name',
    'field.districtName': 'District Name',
    'field.districtCode': 'District Code',
    'data.headOffice': 'Head Office',
    'data.branchOffice': 'Branch Office',
    'data.normal': 'Normal',
    'data.review': 'Review',
    'data.attention': 'Attention',
    'data.verified': 'Verified',
    'data.pending': 'Pending',
    'data.correction': 'Correction',
    'data.rejected': 'Rejected',
    'dashboard.liveControlRoom': 'Live Election Control Room',
    'dashboard.title': 'District Election Dashboard',
    'dashboard.subtitle': 'Monitor voter services, booth readiness, polling activity, and field incidents from one official workspace.',
    'dashboard.registeredVoters': 'Registered Voters',
    'dashboard.registeredVotersCaption': 'Across 8 constituencies',
    'dashboard.pollingStations': 'Polling Stations',
    'dashboard.pollingStationsCaption': '1,219 ready for polling',
    'dashboard.todayTurnout': 'Today Turnout',
    'dashboard.todayTurnoutCaption': '+7.4% since last update',
    'dashboard.openIncidents': 'Open Incidents',
    'dashboard.openIncidentsCaption': '4 marked high priority',
    'dashboard.turnoutGraph': 'Constituency Turnout Bar Graph',
    'dashboard.voterPieChart': 'Voter Verification Pie Chart',
    'dashboard.monitoring': 'Constituency Monitoring',
    'dashboard.constituency': 'Constituency',
    'dashboard.booths': 'Booths',
    'dashboard.officers': 'Officers',
    'dashboard.turnout': 'Turnout',
    'dashboard.status': 'Status',
    'dashboard.current': 'Current',
    'dashboard.operationsReadiness': 'Operations Readiness',
    'dashboard.priorityTasks': 'Priority Tasks',
    'dashboard.quickInsights': 'Quick Insights',
    'dashboard.serviceDesk': 'Service Desk',
    'dashboard.pollingTeam': 'Polling Team',
    'dashboard.lastUpdated': 'Last updated',
    'dashboard.boothChecklists': 'Booth checklists completed',
    'dashboard.securityCompliance': 'Strong room security compliance',
    'dashboard.fieldUpdateInterval': 'Average field update interval',
    'dashboard.verificationQueue': 'Voter verification queue',
    'dashboard.evmReadiness': 'EVM/VVPAT readiness',
    'dashboard.officerAttendance': 'Officer attendance',
    'dashboard.task1': 'Approve pending booth officer replacements',
    'dashboard.task2': 'Review high-priority incident reports',
    'dashboard.task3': 'Publish 4 PM turnout bulletin',
    'dashboard.task4': 'Validate strong room security checklist',
    'dashboard.helpdeskCalls': 'Helpdesk calls resolved',
    'dashboard.formsProcessed': 'Forms processed today',
    'dashboard.teamsDeployed': 'Teams deployed',
    'dashboard.materialKits': 'Material kits ready'
  },
  hi: {
    'app.name': 'निर्वाचन प्रबंधन पोर्टल',
    'app.caption': 'सरकारी संचालन',
    'controls.language': 'भाषा बदलें',
    'controls.theme': 'थीम बदलें',
    'controls.english': 'English',
    'controls.hindi': 'हिन्दी',
    'controls.light': 'लाइट',
    'controls.dark': 'डार्क',
    'customizer.title': 'कस्टमाइज़र',
    'customizer.themeMode': 'थीम मोड',
    'customizer.accentColor': 'एक्सेंट रंग',
    'customizer.language': 'भाषा',
    'customizer.layoutDensity': 'लेआउट घनत्व',
    'customizer.fontSize': 'फ़ॉन्ट आकार',
    'customizer.reset': 'रीसेट करें',
    'customizer.comfort': 'आरामदायक',
    'customizer.compact': 'कॉम्पैक्ट',
    'customizer.normal': 'सामान्य',
    'customizer.large': 'बड़ा',
    'error.title': 'कुछ समस्या हुई',
    'error.message': 'यह पेज लोड नहीं हो पाया। कृपया फिर प्रयास करें।',
    'error.reload': 'पेज फिर लोड करें',
    'error.login': 'लॉगिन पर जाएं',
    'auth.title': 'अधिकारी लॉगिन',
    'auth.subtitle': 'पंजीकृत मोबाइल नंबर और OTP से निर्वाचन डैशबोर्ड खोलें।',
    'auth.officialLogin': 'आधिकारिक लॉगिन',
    'auth.mobileOtpLogin': 'मोबाइल OTP लॉगिन',
    'auth.roleBasedAccess': 'भूमिका आधारित पहुंच',
    'auth.heroTitle': 'निर्वाचन अधिकारियों के लिए सुरक्षित पहुंच',
    'auth.heroBody': 'सत्यापित मोबाइल लॉगिन से मतदाता रिकॉर्ड, मतदान केंद्र गतिविधि और प्रशासनिक कार्य देखें।',
    'auth.protectedSession': 'सुरक्षित सत्र',
    'auth.protectedSessionBody': 'OTP सत्यापन निर्वाचन डेटा की पहुंच नियंत्रित रखता है।',
    'auth.otpIntro': 'OTP निर्वाचन कार्यालय में पंजीकृत मोबाइल नंबर पर भेजा जाएगा।',
    'auth.mobileLabel': 'पंजीकृत मोबाइल नंबर',
    'auth.mobilePlaceholder': 'पंजीकृत मोबाइल नंबर',
    'auth.passwordLabel': 'पासवर्ड',
    'auth.passwordPlaceholder': 'अपना पासवर्ड दर्ज करें',
    'auth.otpLabel': 'सत्यापन OTP',
    'auth.otpPlaceholder': '6 अंकों का OTP दर्ज करें',
    'auth.changeMobile': 'मोबाइल नंबर बदलें',
    'auth.resendOtp': 'OTP फिर भेजें',
    'auth.otpExpired': 'OTP समाप्त',
    'auth.otpExpiredFull': 'OTP समाप्त हो गया है। कृपया फिर से OTP भेजें।',
    'auth.otpExpiresIn': 'OTP समाप्त होगा',
    'auth.humanPending': 'OTP सत्यापित करने से पहले मानव सत्यापन पूरा करें।',
    'auth.humanDone': 'मानव सत्यापन पूरा हुआ।',
    'auth.sendOtp': 'OTP भेजें',
    'auth.verifyOtp': 'OTP सत्यापित करें',
    'menu.dashboardOverview': 'डैशबोर्ड अवलोकन',
    'menu.voterManagement': 'मतदाता प्रबंधन',
    'menu.voterList': 'मतदाता सूची',
    'menu.verificationQueue': 'सत्यापन कतार',
    'menu.claimsObjections': 'दावे और आपत्तियां',
    'menu.master': 'मास्टर',
    'menu.masterCountry': 'देश मास्टर',
    'menu.masterState': 'राज्य मास्टर',
    'menu.masterDistrict': 'जिला मास्टर',
    'menu.masterOffice': 'कार्यालय मास्टर',
    'menu.masterCity': 'शहर मास्टर',
    'menu.masterWard': 'वार्ड मास्टर',
    'menu.masterPollingStation': 'मतदान केंद्र मास्टर',
    'menu.users': 'उपयोगकर्ता',
    'menu.accessManagement': 'एक्सेस प्रबंधन',
    'menu.pollingOperations': 'मतदान संचालन',
    'menu.boothMapping': 'बूथ मैपिंग',
    'menu.pollingStations': 'मतदान केंद्र',
    'menu.turnoutMonitor': 'मतदान प्रतिशत मॉनिटर',
    'menu.reportsSecurity': 'रिपोर्ट और सुरक्षा',
    'menu.electionReports': 'निर्वाचन रिपोर्ट',
    'menu.auditLog': 'ऑडिट लॉग',
    'breadcrumb.home': 'होम',
    'common.create': 'बनाएं',
    'common.update': 'अपडेट',
    'common.save': 'सेव',
    'common.cancel': 'रद्द करें',
    'common.delete': 'हटाएं',
    'common.search': 'खोजें',
    'common.view': 'देखें',
    'common.status': 'स्थिति',
    'common.active': 'सक्रिय',
    'common.inactive': 'निष्क्रिय',
    'common.allStatus': 'सभी स्थिति',
    'common.allStates': 'सभी राज्य',
    'common.allDistricts': 'सभी जिले',
    'common.allCities': 'सभी शहर',
    'common.allWards': 'सभी वार्ड',
    'common.attachment': 'अटैचमेंट',
    'common.action': 'कार्यवाही',
    'common.rows': 'पंक्तियां',
    'common.sno': 'क्र.सं.',
    'common.noRecords': 'कोई रिकॉर्ड नहीं मिला।',
    'common.loading': 'लोड हो रहा है...',
    'common.uploadLogo': 'लोगो इमेज अपलोड करें',
    'common.existingFile': 'मौजूदा फ़ाइल वही रहेगी।',
    'common.deleteConfirm': 'यह रिकॉर्ड स्थायी रूप से हटाया जाएगा।',
    'masters.master': 'मास्टर',
    'masters.managePrefix': 'प्रबंधित करें',
    'masters.manageSuffix': 'मास्टर रिकॉर्ड।',
    'masters.countries': 'देश',
    'masters.country': 'देश',
    'masters.states': 'राज्य',
    'masters.state': 'राज्य',
    'masters.districts': 'जिले',
    'masters.district': 'जिला',
    'masters.offices': 'कार्यालय',
    'masters.office': 'कार्यालय',
    'masters.cities': 'शहर',
    'masters.city': 'शहर',
    'masters.wards': 'वार्ड',
    'masters.ward': 'वार्ड',
    'masters.pollingStations': 'मतदान केंद्र',
    'masters.pollingStation': 'मतदान केंद्र',
    'field.name': 'नाम',
    'field.iso2': 'ISO2',
    'field.iso3': 'ISO3',
    'field.phoneCode': 'फोन कोड',
    'field.currency': 'मुद्रा',
    'field.nationality': 'राष्ट्रीयता',
    'field.code': 'कोड',
    'field.country': 'देश',
    'field.state': 'राज्य',
    'field.district': 'जिला',
    'field.department': 'विभाग',
    'field.type': 'प्रकार',
    'field.city': 'शहर',
    'field.ward': 'वार्ड',
    'field.cityName': 'शहर का नाम',
    'field.wardNo': 'वार्ड नंबर',
    'field.wardName': 'वार्ड का नाम',
    'field.pollingStationName': 'मतदान केंद्र का नाम',
    'field.officeCode': 'कार्यालय कोड',
    'field.officeName': 'कार्यालय नाम',
    'field.officeType': 'कार्यालय प्रकार',
    'field.parentOfficeId': 'मुख्य कार्यालय ID',
    'field.countryName': 'देश का नाम',
    'field.stateName': 'राज्य का नाम',
    'field.districtName': 'जिले का नाम',
    'field.districtCode': 'जिला कोड',
    'data.headOffice': 'मुख्य कार्यालय',
    'data.branchOffice': 'शाखा कार्यालय',
    'data.normal': 'सामान्य',
    'data.review': 'समीक्षा',
    'data.attention': 'ध्यान दें',
    'data.verified': 'सत्यापित',
    'data.pending': 'लंबित',
    'data.correction': 'सुधार',
    'data.rejected': 'अस्वीकृत',
    'dashboard.liveControlRoom': 'लाइव निर्वाचन नियंत्रण कक्ष',
    'dashboard.title': 'जिला निर्वाचन डैशबोर्ड',
    'dashboard.subtitle': 'मतदाता सेवाएं, बूथ तैयारी, मतदान गतिविधि और फील्ड घटनाएं एक आधिकारिक कार्यक्षेत्र से देखें।',
    'dashboard.registeredVoters': 'पंजीकृत मतदाता',
    'dashboard.registeredVotersCaption': '8 निर्वाचन क्षेत्रों में',
    'dashboard.pollingStations': 'मतदान केंद्र',
    'dashboard.pollingStationsCaption': '1,219 मतदान के लिए तैयार',
    'dashboard.todayTurnout': 'आज का मतदान',
    'dashboard.todayTurnoutCaption': 'पिछले अपडेट से +7.4%',
    'dashboard.openIncidents': 'खुली घटनाएं',
    'dashboard.openIncidentsCaption': '4 उच्च प्राथमिकता में चिह्नित',
    'dashboard.turnoutGraph': 'निर्वाचन क्षेत्र मतदान बार ग्राफ',
    'dashboard.voterPieChart': 'मतदाता सत्यापन पाई चार्ट',
    'dashboard.monitoring': 'निर्वाचन क्षेत्र निगरानी',
    'dashboard.constituency': 'निर्वाचन क्षेत्र',
    'dashboard.booths': 'बूथ',
    'dashboard.officers': 'अधिकारी',
    'dashboard.turnout': 'मतदान',
    'dashboard.status': 'स्थिति',
    'dashboard.current': 'वर्तमान',
    'dashboard.operationsReadiness': 'संचालन तैयारी',
    'dashboard.priorityTasks': 'प्राथमिक कार्य',
    'dashboard.quickInsights': 'त्वरित जानकारी',
    'dashboard.serviceDesk': 'सेवा डेस्क',
    'dashboard.pollingTeam': 'मतदान टीम',
    'dashboard.lastUpdated': 'अंतिम अपडेट',
    'dashboard.boothChecklists': 'बूथ चेकलिस्ट पूरी',
    'dashboard.securityCompliance': 'स्ट्रॉन्ग रूम सुरक्षा अनुपालन',
    'dashboard.fieldUpdateInterval': 'औसत फील्ड अपडेट अंतराल',
    'dashboard.verificationQueue': 'मतदाता सत्यापन कतार',
    'dashboard.evmReadiness': 'EVM/VVPAT तैयारी',
    'dashboard.officerAttendance': 'अधिकारी उपस्थिति',
    'dashboard.task1': 'लंबित बूथ अधिकारी बदलाव स्वीकृत करें',
    'dashboard.task2': 'उच्च प्राथमिकता घटना रिपोर्ट की समीक्षा करें',
    'dashboard.task3': '4 PM मतदान बुलेटिन प्रकाशित करें',
    'dashboard.task4': 'स्ट्रॉन्ग रूम सुरक्षा चेकलिस्ट सत्यापित करें',
    'dashboard.helpdeskCalls': 'हेल्पडेस्क कॉल समाधान',
    'dashboard.formsProcessed': 'आज प्रोसेस किए गए फॉर्म',
    'dashboard.teamsDeployed': 'तैनात टीमें',
    'dashboard.materialKits': 'तैयार सामग्री किट'
  }
};

const labelKey = (value) =>
  `field.${String(value)
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .replace(/\s+([a-zA-Z0-9])/g, (_, chr) => chr.toUpperCase())
    .replace(/^./, (chr) => chr.toLowerCase())}`;

const getStoredValue = (key, fallback) => {
  if (typeof window === 'undefined') return fallback;

  return localStorage.getItem(key) || fallback;
};

export function AppPreferencesProvider({ children }) {
  const [language, setLanguageState] = useState(() => getStoredValue('app_language', 'en'));
  const [themeMode, setThemeModeState] = useState(() => getStoredValue('app_theme_mode', 'light'));
  const [accentColor, setAccentColorState] = useState(() => getStoredValue('app_accent_color', 'blue'));
  const [layoutDensity, setLayoutDensityState] = useState(() => getStoredValue('app_layout_density', 'comfortable'));
  const [fontScale, setFontScaleState] = useState(() => getStoredValue('app_font_scale', 'normal'));

  useEffect(() => {
    document.documentElement.lang = language === 'hi' ? 'hi' : 'en';
  }, [language]);

  const setLanguage = (nextLanguage) => {
    setLanguageState(nextLanguage);
    localStorage.setItem('app_language', nextLanguage);
  };

  const setThemeMode = (nextThemeMode) => {
    setThemeModeState(nextThemeMode);
    localStorage.setItem('app_theme_mode', nextThemeMode);
  };

  const setAccentColor = (nextAccentColor) => {
    setAccentColorState(nextAccentColor);
    localStorage.setItem('app_accent_color', nextAccentColor);
  };

  const setLayoutDensity = (nextLayoutDensity) => {
    setLayoutDensityState(nextLayoutDensity);
    localStorage.setItem('app_layout_density', nextLayoutDensity);
  };

  const setFontScale = (nextFontScale) => {
    setFontScaleState(nextFontScale);
    localStorage.setItem('app_font_scale', nextFontScale);
  };

  const resetPreferences = () => {
    setLanguage('en');
    setThemeMode('light');
    setAccentColor('blue');
    setLayoutDensity('comfortable');
    setFontScale('normal');
  };

  const t = (key) => translations[language]?.[key] || translations.en[key] || key;
  const tl = (value) => {
    const key = labelKey(value);
    const translated = t(key);

    return translated === key ? value : translated;
  };

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      tl,
      themeMode,
      setThemeMode,
      accentColor,
      setAccentColor,
      layoutDensity,
      setLayoutDensity,
      fontScale,
      setFontScale,
      resetPreferences
    }),
    [language, themeMode, accentColor, layoutDensity, fontScale]
  );

  return <AppPreferencesContext.Provider value={value}>{children}</AppPreferencesContext.Provider>;
}

AppPreferencesProvider.propTypes = { children: PropTypes.node };

export function useAppPreferences() {
  const context = useContext(AppPreferencesContext);

  if (!context) {
    throw new Error('useAppPreferences must be used inside AppPreferencesProvider');
  }

  return context;
}

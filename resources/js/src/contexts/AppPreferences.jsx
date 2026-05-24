import PropTypes from 'prop-types';
import { createContext, useContext, useMemo, useState } from 'react';

const AppPreferencesContext = createContext(null);

const translations = {
  en: {
    'app.name': 'Election Management Portal',
    'app.caption': 'Government Operations',
    'controls.language': 'Change language',
    'controls.theme': 'Change theme',
    'controls.english': 'English',
    'controls.hindi': 'हिन्दी',
    'controls.light': 'Light',
    'controls.dark': 'Dark',
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
    'dashboard.priorityTasks': 'Priority Tasks'
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
    'auth.title': 'अधिकारी लॉगिन',
    'auth.subtitle': 'अपने पंजीकृत मोबाइल नंबर और OTP से निर्वाचन डैशबोर्ड खोलें।',
    'auth.officialLogin': 'आधिकारिक लॉगिन',
    'auth.mobileOtpLogin': 'मोबाइल OTP लॉगिन',
    'auth.roleBasedAccess': 'भूमिका आधारित पहुंच',
    'auth.heroTitle': 'निर्वाचन अधिकारियों के लिए सुरक्षित पहुंच',
    'auth.heroBody': 'सत्यापित मोबाइल लॉगिन से मतदाता रिकॉर्ड, मतदान केंद्र गतिविधि और प्रशासनिक कार्य देखें।',
    'auth.protectedSession': 'सुरक्षित सत्र',
    'auth.protectedSessionBody': 'OTP सत्यापन निर्वाचन डेटा की पहुंच को सुरक्षित रखता है।',
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
    'dashboard.priorityTasks': 'प्राथमिक कार्य'
  }
};

const getStoredValue = (key, fallback) => {
  if (typeof window === 'undefined') return fallback;

  return localStorage.getItem(key) || fallback;
};

export function AppPreferencesProvider({ children }) {
  const [language, setLanguageState] = useState(() => getStoredValue('app_language', 'en'));
  const [themeMode, setThemeModeState] = useState(() => getStoredValue('app_theme_mode', 'light'));
  const [accentColor, setAccentColorState] = useState(() => getStoredValue('app_accent_color', 'blue'));
  const [layoutDensity, setLayoutDensityState] = useState(() => getStoredValue('app_layout_density', 'comfortable'));

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

  const t = (key) => translations[language]?.[key] || translations.en[key] || key;

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      themeMode,
      setThemeMode,
      accentColor,
      setAccentColor,
      layoutDensity,
      setLayoutDensity
    }),
    [language, themeMode, accentColor, layoutDensity]
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

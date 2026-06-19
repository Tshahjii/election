import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTheme } from '@mui/material/styles';
import {
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  Fab,
  Grow,
  IconButton,
  List,
  ListItem,
  Paper,
  Slider,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import AutoAwesomeTwoToneIcon from '@mui/icons-material/AutoAwesomeTwoTone';
import CloseIcon from '@mui/icons-material/Close';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import SendIcon from '@mui/icons-material/Send';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import ChecklistOutlinedIcon from '@mui/icons-material/ChecklistOutlined';
import NotesOutlinedIcon from '@mui/icons-material/NotesOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';

type AssistantTab = 'chat' | 'tasks' | 'notes' | 'history' | 'settings';

interface Message {
  sender: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

interface StoredMessage {
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

interface AssistantSettings {
  language: 'hi-IN' | 'en-US';
  rate: number;
  volume: number;
  continuous: boolean;
  wakeWord: boolean;
  useOllama: boolean;
  ollamaModel: string;
}

interface TodoItem {
  id: string;
  text: string;
  done: boolean;
  createdAt: string;
}

interface NoteItem {
  id: string;
  text: string;
  createdAt: string;
}

interface ReminderItem {
  id: string;
  text: string;
  dueText: string;
  createdAt: string;
}

interface ScreenField {
  label: string;
  purpose: string;
  mandatory?: boolean;
  digits?: number;
  options?: string[];
}

interface ScreenMeta {
  name: string;
  route: string;
  fields: ScreenField[];
  buttons: string[];
  nextStep: string;
  description: string;
}

const STORAGE_KEYS = {
  messages: 'swara.messages',
  settings: 'swara.settings',
  todos: 'swara.todos',
  notes: 'swara.notes',
  reminders: 'swara.reminders',
  commands: 'swara.commands',
  theme: 'swara.theme'
};

const defaultSettings: AssistantSettings = {
  language: 'hi-IN',
  rate: 1,
  volume: 1,
  continuous: false,
  wakeWord: false,
  useOllama: false,
  ollamaModel: 'llama3.2:3b'
};

const fallbackMessages: Message[] = [
  {
    sender: 'assistant',
    text: 'नमस्ते! मैं स्वरा हूँ। मैं आपकी screen देखकर form, buttons, fields, notes, tasks, reminders, search, calculator, weather, Wikipedia और project navigation में मदद कर सकती हूँ। सब कुछ free/local technologies से चलता है।',
    timestamp: new Date()
  }
];

const projectScreens: Record<string, ScreenMeta> = {
  '/admin/dashboard': {
    name: 'Dashboard Overview',
    route: '/admin/dashboard',
    description: 'यह main dashboard है। यहाँ election portal का overview, quick cards, activity और navigation मिलते हैं।',
    fields: [{ label: 'Search', purpose: 'portal records search करने के लिए', mandatory: false }],
    buttons: ['Menu', 'Search', 'Theme', 'Profile', 'Calendar'],
    nextStep: 'जिस module में काम करना है, left menu या search से उसे खोलिए।'
  },
  '/admin/election/nagar-panchayat': {
    name: 'Nagar Panchayat Dashboard',
    route: '/admin/election/nagar-panchayat',
    description: 'Nagar Panchayat election monitoring screen है। इसमें wards, booths, candidates और team scheduling दिखाई देता है।',
    fields: [
      { label: 'Date of Birth', purpose: 'team schedule के लिए date भरने में', mandatory: false },
      { label: 'Number of Employees', purpose: 'team में total employees दिखाने के लिए', mandatory: false },
      { label: 'Male', purpose: 'male employees की संख्या भरने के लिए', mandatory: false }
    ],
    buttons: ['Create Team Schedule'],
    nextStep: 'Create Team Schedule दबाकर team details भरिए।'
  },
  '/admin/election/nagari-nikay': {
    name: 'Nagari Nikay Dashboard',
    route: '/admin/election/nagari-nikay',
    description: 'Nagari Nikay election monitoring screen है। यहाँ candidates, voters, booths और election status दिखता है।',
    fields: [
      { label: 'Date of Birth', purpose: 'team schedule के लिए date भरने में', mandatory: false },
      { label: 'Number of Employees', purpose: 'team में total employees दिखाने के लिए', mandatory: false },
      { label: 'Male', purpose: 'male employees की संख्या भरने के लिए', mandatory: false }
    ],
    buttons: ['Create Team Schedule'],
    nextStep: 'Team Scheduling section खोलकर values check कीजिए।'
  },
  '/admin/masters/countries': {
    name: 'Country Master',
    route: '/admin/masters/countries',
    description: 'Country master में country records create, search, update और delete होते हैं।',
    fields: [
      { label: 'Search Countries', purpose: 'country record खोजने के लिए', mandatory: false },
      { label: 'Country Name', purpose: 'देश का नाम भरने के लिए', mandatory: true },
      { label: 'Status', purpose: 'record Active या Inactive रखने के लिए', mandatory: false },
      { label: 'Logo Attachment', purpose: 'country/state logo image upload करने के लिए', mandatory: false }
    ],
    buttons: ['Create Country', 'Save', 'Cancel', 'View', 'Edit', 'Delete'],
    nextStep: 'Create Country दबाइए, Country Name भरिए, जरूरत हो तो logo upload कीजिए और Save दबाइए।'
  },
  '/admin/masters/states': {
    name: 'State Master',
    route: '/admin/masters/states',
    description: 'State master में country के अंदर states manage होते हैं।',
    fields: [
      { label: 'Country', purpose: 'जिस देश में state आता है उसे चुनने के लिए', mandatory: true },
      { label: 'State Name', purpose: 'राज्य का नाम भरने के लिए', mandatory: true },
      { label: 'State Code', purpose: 'state का short code भरने के लिए', mandatory: false },
      { label: 'Logo Attachment', purpose: 'state logo upload करने के लिए', mandatory: false }
    ],
    buttons: ['Create State', 'Save', 'Cancel', 'Edit', 'Delete'],
    nextStep: 'Country चुनिए, State Name भरिए, State Code optional है, फिर Save दबाइए।'
  },
  '/admin/masters/districts': {
    name: 'District Master',
    route: '/admin/masters/districts',
    description: 'District master में state के districts manage होते हैं।',
    fields: [
      { label: 'Country', purpose: 'district के country को चुनने के लिए', mandatory: true },
      { label: 'State', purpose: 'district के state को चुनने के लिए', mandatory: true },
      { label: 'District Name', purpose: 'जिले का नाम भरने के लिए', mandatory: true },
      { label: 'District Code', purpose: 'जिले का code भरने के लिए', mandatory: false }
    ],
    buttons: ['Create District', 'Save', 'Cancel', 'Edit', 'Delete'],
    nextStep: 'Country और State चुनने के बाद District Name भरिए और Save दबाइए।'
  },
  '/admin/masters/offices': {
    name: 'Office Master',
    route: '/admin/masters/offices',
    description: 'Office master में election offices और departments manage होते हैं।',
    fields: [
      { label: 'Office Code', purpose: 'office का code भरने के लिए', mandatory: false },
      { label: 'Office Name', purpose: 'office का नाम भरने के लिए', mandatory: true },
      { label: 'Department', purpose: 'department/company name भरने के लिए', mandatory: false },
      { label: 'Office Type', purpose: 'Head Office या Branch Office चुनने के लिए', mandatory: false },
      { label: 'Parent Office ID', purpose: 'parent office चुनने के लिए', mandatory: false },
      { label: 'Country', purpose: 'office का country चुनने के लिए', mandatory: true },
      { label: 'State', purpose: 'office का state चुनने के लिए', mandatory: true },
      { label: 'District', purpose: 'office का district चुनने के लिए', mandatory: true }
    ],
    buttons: ['Create Office', 'Save', 'Cancel', 'Edit', 'Delete'],
    nextStep: 'Office Name और location hierarchy भरिए, फिर Save दबाइए।'
  },
  '/admin/masters/cities': {
    name: 'City Master',
    route: '/admin/masters/cities',
    description: 'City master में urban/rural city records manage होते हैं।',
    fields: [
      { label: 'State', purpose: 'city का state चुनने के लिए', mandatory: true },
      { label: 'District', purpose: 'city का district चुनने के लिए', mandatory: true },
      { label: 'City Name', purpose: 'city का नाम भरने के लिए', mandatory: true },
      { label: 'City Type', purpose: 'Urban या Rural चुनने के लिए', mandatory: true, options: ['Urban', 'Rural'] }
    ],
    buttons: ['Create City', 'Save', 'Cancel', 'Edit', 'Delete'],
    nextStep: 'State और District चुनिए, City Name भरिए, City Type चुनिए और Save दबाइए।'
  },
  '/admin/masters/wards': {
    name: 'Ward Master',
    route: '/admin/masters/wards',
    description: 'Ward master में city के wards manage होते हैं।',
    fields: [
      { label: 'State', purpose: 'ward का state चुनने के लिए', mandatory: true },
      { label: 'District', purpose: 'ward का district चुनने के लिए', mandatory: true },
      { label: 'City', purpose: 'ward की city चुनने के लिए', mandatory: true },
      { label: 'Ward No', purpose: 'ward number भरने के लिए', mandatory: true },
      { label: 'Ward Name', purpose: 'ward का नाम भरने के लिए', mandatory: true }
    ],
    buttons: ['Create Ward', 'Save', 'Cancel', 'Edit', 'Delete'],
    nextStep: 'State, District और City चुनकर Ward No और Ward Name भरिए, फिर Save दबाइए।'
  },
  '/admin/masters/polling-stations': {
    name: 'Polling Station Master',
    route: '/admin/masters/polling-stations',
    description: 'Polling Station master में मतदान केंद्र manage होते हैं।',
    fields: [
      { label: 'State', purpose: 'polling station का state चुनने के लिए', mandatory: true },
      { label: 'District', purpose: 'polling station का district चुनने के लिए', mandatory: true },
      { label: 'City', purpose: 'polling station की city चुनने के लिए', mandatory: true },
      { label: 'Ward', purpose: 'polling station का ward चुनने के लिए', mandatory: true },
      { label: 'Polling Station Name', purpose: 'मतदान केंद्र का नाम भरने के लिए', mandatory: true }
    ],
    buttons: ['Create Polling Station', 'Save', 'Cancel', 'Edit', 'Delete'],
    nextStep: 'Location hierarchy चुनिए, Polling Station Name भरिए और Save दबाइए।'
  },
  '/admin/masters/emp-types': {
    name: 'Employee Type Master',
    route: '/admin/masters/emp-types',
    description: 'Employee types जैसे Permanent, Contract आदि manage करने की screen है।',
    fields: [{ label: 'Employee Type', purpose: 'employee type का नाम भरने के लिए', mandatory: true }],
    buttons: ['Create Employee Type', 'Save', 'Cancel', 'Edit', 'Delete'],
    nextStep: 'Employee Type भरिए और Save दबाइए।'
  },
  '/admin/masters/designations': {
    name: 'Designation Master',
    route: '/admin/masters/designations',
    description: 'Designation master में पदनाम manage होते हैं।',
    fields: [{ label: 'Designation', purpose: 'पदनाम भरने के लिए', mandatory: true }],
    buttons: ['Create Designation', 'Save', 'Cancel', 'Edit', 'Delete'],
    nextStep: 'Designation भरिए और Save दबाइए।'
  },
  '/admin/masters/departments': {
    name: 'Department Master',
    route: '/admin/masters/departments',
    description: 'Department master में departments manage होते हैं।',
    fields: [{ label: 'Department', purpose: 'department का नाम भरने के लिए', mandatory: true }],
    buttons: ['Create Department', 'Save', 'Cancel', 'Edit', 'Delete'],
    nextStep: 'Department भरिए और Save दबाइए।'
  },
  '/admin/masters/pay-levels': {
    name: 'Pay Level Master',
    route: '/admin/masters/pay-levels',
    description: 'Pay level master में level, amount pay और grade pay manage होते हैं।',
    fields: [
      { label: 'Level', purpose: 'pay level भरने के लिए', mandatory: true },
      { label: 'Amount Pay', purpose: 'pay amount भरने के लिए', mandatory: true },
      { label: 'Grade Pay', purpose: 'grade pay भरने के लिए', mandatory: true }
    ],
    buttons: ['Create Pay Level', 'Save', 'Cancel', 'Edit', 'Delete'],
    nextStep: 'Level, Amount Pay और Grade Pay भरकर Save दबाइए।'
  },
  '/admin/hrms/master-employee': {
    name: 'Master Employee',
    route: '/admin/hrms/master-employee',
    description: 'Master Employee screen में employee records create, edit, search और delete होते हैं।',
    fields: [
      { label: 'Employee Code', purpose: 'कर्मचारी code भरने के लिए', mandatory: false },
      { label: 'Title', purpose: 'Mr, Ms आदि title भरने के लिए', mandatory: true },
      { label: 'Name', purpose: 'कर्मचारी का पूरा नाम भरने के लिए', mandatory: true },
      { label: 'Gender', purpose: 'Male या Female चुनने के लिए', mandatory: true, options: ['Male', 'Female'] },
      { label: 'Date of Birth', purpose: 'कर्मचारी की जन्म तिथि भरने के लिए', mandatory: true },
      { label: 'Mobile', purpose: 'कर्मचारी का 10 अंकों का mobile number भरने के लिए', mandatory: true, digits: 10 },
      { label: 'Email', purpose: 'कर्मचारी का email भरने के लिए', mandatory: true },
      { label: 'Employee Type', purpose: 'employee type चुनने के लिए', mandatory: true },
      { label: 'Department', purpose: 'department चुनने के लिए', mandatory: true },
      { label: 'Designation', purpose: 'designation चुनने के लिए', mandatory: true },
      { label: 'Pay Level', purpose: 'pay level चुनने के लिए', mandatory: true },
      { label: 'Basic Pay', purpose: 'basic pay भरने के लिए', mandatory: true },
      { label: 'Country', purpose: 'country चुनने के लिए', mandatory: true },
      { label: 'State', purpose: 'state चुनने के लिए', mandatory: true },
      { label: 'District', purpose: 'district चुनने के लिए', mandatory: true },
      { label: 'City Type', purpose: 'Urban या Rural चुनने के लिए', mandatory: true },
      { label: 'City', purpose: 'city चुनने के लिए', mandatory: true },
      { label: 'Office', purpose: 'office चुनने के लिए', mandatory: false },
      { label: 'Any Disability', purpose: 'disability है या नहीं चुनने के लिए', mandatory: true, options: ['No', 'Yes'] },
      { label: 'Remark', purpose: 'extra note लिखने के लिए', mandatory: false }
    ],
    buttons: ['Create Employee', 'Save', 'Cancel', 'Edit', 'Delete'],
    nextStep: 'Create Employee दबाइए, required fields भरिए, mobile में 10 digits डालिए, फिर Save दबाइए।'
  },
  '/admin/users/access-management': {
    name: 'Access Management',
    route: '/admin/users/access-management',
    description: 'Access Management में users create होते हैं और role, state, district, office permissions assign होते हैं।',
    fields: [
      { label: 'Full Name', purpose: 'user का पूरा नाम भरने के लिए', mandatory: true },
      { label: 'User ID', purpose: 'optional user code भरने के लिए', mandatory: false },
      { label: 'Email Address', purpose: 'user का email भरने के लिए', mandatory: true },
      { label: 'Mobile Number', purpose: 'user का 10 अंकों का mobile number भरने के लिए', mandatory: true, digits: 10 },
      { label: 'Role', purpose: 'user role चुनने के लिए', mandatory: true },
      { label: 'Department', purpose: 'department भरने के लिए', mandatory: true },
      { label: 'Designation', purpose: 'designation भरने के लिए', mandatory: true },
      { label: 'Temporary Password', purpose: 'temporary password set करने के लिए', mandatory: true },
      { label: 'Country', purpose: 'country access/location चुनने के लिए', mandatory: true },
      { label: 'State', purpose: 'state access/location चुनने के लिए', mandatory: true },
      { label: 'District', purpose: 'district access/location चुनने के लिए', mandatory: true },
      { label: 'Office', purpose: 'office चुनने के लिए', mandatory: false },
      { label: 'Address', purpose: 'user address भरने के लिए', mandatory: false },
      { label: 'Status', purpose: 'Active या Inactive चुनने के लिए', mandatory: true }
    ],
    buttons: ['Create User', 'Save User', 'Access', 'Reset', 'Delete', 'Save Access'],
    nextStep: 'Create User दबाइए, required fields भरिए, फिर Save User दबाइए। Access button से permissions assign होती हैं।'
  },
  '/admin/reports/allocation': {
    name: 'Allocation Report',
    route: '/admin/reports/allocation',
    description: 'Duty allocation report में assigned duties और roster details देखे जाते हैं।',
    fields: [{ label: 'Search/Filters', purpose: 'allocation records filter करने के लिए', mandatory: false }],
    buttons: ['Search', 'Export', 'Print'],
    nextStep: 'Filters set करके report देखिए या export/print button use कीजिए।'
  },
  '/admin/reports/analytics': {
    name: 'Duty Analytics',
    route: '/admin/reports/analytics',
    description: 'Duty analytics screen charts और summaries दिखाती है।',
    fields: [{ label: 'Filters', purpose: 'analytics data filter करने के लिए', mandatory: false }],
    buttons: ['Search', 'Refresh'],
    nextStep: 'Required filter चुनकर analytics review कीजिए।'
  }
};

const navigationTargets = [
  { keys: ['dashboard', 'home', 'डैशबोर्ड', 'होम'], path: '/admin/dashboard', name: 'Dashboard' },
  { keys: ['nagar panchayat', 'नगर पंचायत'], path: '/admin/election/nagar-panchayat', name: 'Nagar Panchayat' },
  { keys: ['nagari nikay', 'नगरी निकाय'], path: '/admin/election/nagari-nikay', name: 'Nagari Nikay' },
  { keys: ['country', 'countries', 'देश', 'कंट्री'], path: '/admin/masters/countries', name: 'Country Master' },
  { keys: ['state', 'states', 'राज्य', 'स्टेट'], path: '/admin/masters/states', name: 'State Master' },
  { keys: ['district', 'districts', 'जिला', 'डिस्ट्रिक्ट'], path: '/admin/masters/districts', name: 'District Master' },
  { keys: ['office', 'offices', 'कार्यालय', 'ऑफिस'], path: '/admin/masters/offices', name: 'Office Master' },
  { keys: ['city', 'cities', 'शहर', 'सिटी'], path: '/admin/masters/cities', name: 'City Master' },
  { keys: ['ward', 'wards', 'वार्ड'], path: '/admin/masters/wards', name: 'Ward Master' },
  { keys: ['polling', 'booth', 'मतदान', 'पोलिंग'], path: '/admin/masters/polling-stations', name: 'Polling Station Master' },
  { keys: ['employee type', 'emp type'], path: '/admin/masters/emp-types', name: 'Employee Type Master' },
  { keys: ['designation', 'पद'], path: '/admin/masters/designations', name: 'Designation Master' },
  { keys: ['department', 'विभाग'], path: '/admin/masters/departments', name: 'Department Master' },
  { keys: ['pay level', 'salary', 'वेतन'], path: '/admin/masters/pay-levels', name: 'Pay Level Master' },
  { keys: ['employee', 'कर्मचारी', 'एम्प्लॉयी'], path: '/admin/hrms/master-employee', name: 'Master Employee' },
  { keys: ['access', 'permission', 'role', 'एक्सेस', 'परमिशन'], path: '/admin/users/access-management', name: 'Access Management' },
  { keys: ['allocation report', 'duty report', 'रिपोर्ट'], path: '/admin/reports/allocation', name: 'Allocation Report' },
  { keys: ['analytics', 'chart', 'एनालिटिक्स'], path: '/admin/reports/analytics', name: 'Duty Analytics' }
];

const jokes = [
  'एक developer ने कहा: मेरा code चलता है। दूसरे ने पूछा: कहाँ? बोला, मेरे computer पर।',
  'Computer ने user से कहा: आप relax कीजिए, error मैं संभाल लूँगा। फिर blue screen आ गई।',
  'Election portal इतना organized है कि files भी queue में खड़ी लगती हैं।'
];

const facts = [
  'भारत में electronic voting machine का large-scale use elections को faster counting में मदद करता है।',
  'SQLite एक lightweight database है जो local apps में बहुत useful होता है।',
  'Browser Speech Synthesis API बिना paid subscription के text को voice में बोल सकती है।'
];

const safeJsonParse = <T,>(value: string | null, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const normalize = (value: string) => value.toLowerCase().trim();

const stripCommand = (query: string, patterns: RegExp[]) => {
  let output = query.trim();
  patterns.forEach((pattern) => {
    output = output.replace(pattern, '').trim();
  });
  return output.replace(/^[:\-–,.\s]+/, '').trim();
};

const inferFieldPurpose = (label: string): ScreenField => {
  const lower = label.toLowerCase();
  if (lower.includes('mobile') || lower.includes('phone')) {
    return { label, purpose: '10 अंकों का mobile number भरने के लिए', mandatory: /required|\*/i.test(label), digits: 10 };
  }
  if (lower.includes('email')) return { label, purpose: 'email address भरने के लिए', mandatory: /required|\*/i.test(label) };
  if (lower.includes('password')) return { label, purpose: 'password भरने के लिए', mandatory: /required|\*/i.test(label) };
  if (lower.includes('date') || lower.includes('dob')) return { label, purpose: 'date चुनने या भरने के लिए', mandatory: /required|\*/i.test(label) };
  if (lower.includes('state')) return { label, purpose: 'state चुनने के लिए', mandatory: /required|\*/i.test(label) };
  if (lower.includes('district')) return { label, purpose: 'district चुनने के लिए', mandatory: /required|\*/i.test(label) };
  if (lower.includes('country')) return { label, purpose: 'country चुनने के लिए', mandatory: /required|\*/i.test(label) };
  if (lower.includes('search')) return { label, purpose: 'record search करने के लिए', mandatory: false };
  return { label, purpose: 'यह जानकारी भरने या चुनने के लिए', mandatory: /required|\*/i.test(label) };
};

const getVisibleText = (element: Element) =>
  (
    element.getAttribute('aria-label') ||
    element.getAttribute('placeholder') ||
    element.getAttribute('title') ||
    element.textContent ||
    ''
  )
    .replace(/\s+/g, ' ')
    .trim();

const getLabelForInput = (element: Element) => {
  const id = element.getAttribute('id');
  const ariaLabelledBy = element.getAttribute('aria-labelledby');
  const labelByFor = id ? document.querySelector(`label[for="${CSS.escape(id)}"]`)?.textContent : '';
  const ariaLabel = ariaLabelledBy
    ? ariaLabelledBy
        .split(/\s+/)
        .map((part) => document.getElementById(part)?.textContent || '')
        .join(' ')
    : '';
  const wrapperLabel = element.closest('.MuiFormControl-root')?.querySelector('label')?.textContent || '';
  const nearbyText = element.closest('label')?.textContent || '';
  const direct = getVisibleText(element);

  return (labelByFor || ariaLabel || wrapperLabel || nearbyText || direct).replace(/\s+/g, ' ').trim();
};

const isElementVisible = (element: Element) => {
  const rect = (element as HTMLElement).getBoundingClientRect();
  const style = window.getComputedStyle(element as HTMLElement);
  return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
};

export default function VoiceAssistant() {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state: any) => state.auth?.user);

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<AssistantTab>('chat');
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isDark, setIsDark] = useState(() => safeJsonParse<boolean>(localStorage.getItem(STORAGE_KEYS.theme), theme.palette.mode === 'dark'));
  const [settings, setSettings] = useState<AssistantSettings>(() => safeJsonParse(localStorage.getItem(STORAGE_KEYS.settings), defaultSettings));
  const [messages, setMessages] = useState<Message[]>(() => {
    const stored = safeJsonParse<StoredMessage[]>(localStorage.getItem(STORAGE_KEYS.messages), []);
    return stored.length
      ? stored.slice(-60).map((message) => ({ ...message, timestamp: new Date(message.timestamp) }))
      : fallbackMessages;
  });
  const [todos, setTodos] = useState<TodoItem[]>(() => safeJsonParse(localStorage.getItem(STORAGE_KEYS.todos), []));
  const [notes, setNotes] = useState<NoteItem[]>(() => safeJsonParse(localStorage.getItem(STORAGE_KEYS.notes), []));
  const [reminders, setReminders] = useState<ReminderItem[]>(() => safeJsonParse(localStorage.getItem(STORAGE_KEYS.reminders), []));
  const [commandHistory, setCommandHistory] = useState<string[]>(() => safeJsonParse(localStorage.getItem(STORAGE_KEYS.commands), []));
  const [newTask, setNewTask] = useState('');
  const [newNote, setNewNote] = useState('');
  const [listeningText, setListeningText] = useState('सुन रही हूँ...');

  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const settingsRef = useRef(settings);
  const isOpenRef = useRef(isOpen);
  const isListeningRef = useRef(isListening);

  const currentGuide = useMemo(() => projectScreens[location.pathname], [location.pathname]);

  useEffect(() => {
    settingsRef.current = settings;
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEYS.messages,
      JSON.stringify(messages.slice(-100).map((message) => ({ ...message, timestamp: message.timestamp.toISOString() })))
    );
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => localStorage.setItem(STORAGE_KEYS.todos, JSON.stringify(todos)), [todos]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.notes, JSON.stringify(notes)), [notes]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.reminders, JSON.stringify(reminders)), [reminders]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.commands, JSON.stringify(commandHistory.slice(-50))), [commandHistory]);
  useEffect(() => localStorage.setItem(STORAGE_KEYS.theme, JSON.stringify(isDark)), [isDark]);

  useEffect(() => {
    if (!isOpen) {
      window.speechSynthesis.cancel();
      try {
        recognitionRef.current?.stop?.();
      } catch {
        // Browser speech APIs can throw if already stopped.
      }
      return;
    }

    const timer = window.setTimeout(() => {
      speakText(`नमस्ते ${user?.name || ''}! मैं स्वरा हूँ। आप पूछ सकते हैं: यहाँ क्या भरना है, कोई page खोलिए, note बनाइए, task जोड़िए, या search करिए।`);
    }, 120);

    return () => window.clearTimeout(timer);
  }, [isOpen, user?.name]);

  useEffect(() => {
    const loadVoices = () => {
      voicesRef.current = window.speechSynthesis.getVoices();
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = settings.language;

    recognition.onstart = () => {
      setIsListening(true);
      setListeningText(settings.language === 'hi-IN' ? 'सुन रही हूँ... बोलिए' : 'Listening... speak now');
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript || '';
      handleSendMessage(transcript);
    };

    recognition.onerror = (event: any) => {
      setIsListening(false);
      if (event.error === 'not-allowed') {
        addAssistantMessage('माइक्रोफोन permission नहीं मिली। कृपया browser में mic allow कीजिए या message type कीजिए।');
      } else if (event.error === 'no-speech' && !settingsRef.current.continuous) {
        addAssistantMessage('आवाज साफ नहीं आई। कृपया दोबारा बोलिए।');
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      if (settingsRef.current.continuous && isOpenRef.current && !window.speechSynthesis.speaking) {
        window.setTimeout(() => {
          if (recognitionRef.current && !isListeningRef.current && isOpenRef.current) {
            try {
              recognitionRef.current.start();
            } catch {
              // Rapid restarts are rejected by some browsers.
            }
          }
        }, 800);
      }
    };

    recognitionRef.current = recognition;
  }, [settings.language]);

  const speakText = (text: string) => {
    if (isMuted) return;

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = voicesRef.current.length ? voicesRef.current : window.speechSynthesis.getVoices();
      const preferredLanguageVoices = voices.filter((voice) => voice.lang.toLowerCase().startsWith(settingsRef.current.language.slice(0, 2).toLowerCase()));
      const softVoice = voices.find((voice) => /female|swara|kalpana|heera|zira|samantha|karen|google/i.test(voice.name));

      utterance.voice = preferredLanguageVoices.find((voice) => voice === softVoice) || preferredLanguageVoices[0] || softVoice || voices[0] || null;
      utterance.lang = utterance.voice?.lang || settingsRef.current.language;
      utterance.rate = settingsRef.current.rate;
      utterance.volume = settingsRef.current.volume;
      utterance.pitch = 1.05;
      utterance.onstart = () => {
        try {
          recognitionRef.current?.stop?.();
        } catch {
          // Speech recognition may already be stopped.
        }
      };
      utterance.onend = () => {
        if (settingsRef.current.continuous && isOpenRef.current && recognitionRef.current) {
          window.setTimeout(() => {
            try {
              recognitionRef.current.start();
            } catch {
              // Ignored because browser speech APIs throttle restarts.
            }
          }, 450);
        }
      };

      window.speechSynthesis.speak(utterance);
    } catch {
      // Text response remains visible even if speech synthesis fails.
    }
  };

  const addAssistantMessage = (text: string) => {
    setMessages((prev) => [...prev, { sender: 'assistant', text, timestamp: new Date() }]);
    speakText(text);
  };

  const addUserMessage = (text: string) => {
    setMessages((prev) => [...prev, { sender: 'user', text, timestamp: new Date() }]);
    setCommandHistory((prev) => [text, ...prev.filter((item) => item !== text)].slice(0, 50));
  };

  const inspectVisibleScreen = () => {
    const dialog = Array.from(document.querySelectorAll('[role="dialog"], .MuiDialog-root')).find(isElementVisible);
    const scope = dialog || document.body;

    const fields = Array.from(scope.querySelectorAll('input, textarea, select, [role="combobox"]'))
      .filter(isElementVisible)
      .map(getLabelForInput)
      .map((label) => label.replace(/\s*\*+\s*$/, '').trim())
      .filter((label, index, arr) => Boolean(label) && arr.indexOf(label) === index)
      .slice(0, 24)
      .map(inferFieldPurpose);

    const buttons = Array.from(scope.querySelectorAll('button, [role="button"]'))
      .filter(isElementVisible)
      .map(getVisibleText)
      .filter((text, index, arr) => Boolean(text) && arr.indexOf(text) === index)
      .slice(0, 20);

    const errors = Array.from(scope.querySelectorAll('[aria-invalid="true"], .Mui-error, [role="alert"]'))
      .filter(isElementVisible)
      .map(getVisibleText)
      .filter((text, index, arr) => Boolean(text) && arr.indexOf(text) === index)
      .slice(0, 8);

    const title =
      dialog?.querySelector('[role="heading"], h1, h2, h3, .MuiDialogTitle-root')?.textContent?.replace(/\s+/g, ' ').trim() ||
      document.querySelector('h1, h2')?.textContent?.replace(/\s+/g, ' ').trim() ||
      currentGuide?.name ||
      'current screen';

    return { title, isDialog: Boolean(dialog), fields, buttons, errors };
  };

  const screenResponse = (specificQuery = '') => {
    const visible = inspectVisibleScreen();
    const guide = currentGuide;
    const combinedFields = [...visible.fields, ...(guide?.fields || [])].filter(
      (field, index, arr) => arr.findIndex((item) => item.label.toLowerCase() === field.label.toLowerCase()) === index
    );
    const fields = combinedFields.length ? combinedFields : [{ label: 'Visible Form', purpose: 'screen पर दिख रही जानकारी भरने के लिए', mandatory: false }];
    const query = specificQuery.toLowerCase();
    const matchedField = fields.find((field) => query && query.includes(field.label.toLowerCase().split(' ')[0]));
    const fieldsToExplain = matchedField ? [matchedField] : fields.slice(0, 12);

    const fieldText = fieldsToExplain
      .map((field) => {
        const required = field.mandatory ? 'यह field अनिवार्य है' : 'यह field optional हो सकता है';
        const digits = field.digits ? ` इसमें ${field.digits} digits भरने हैं।` : '';
        const options = field.options?.length ? ` Options: ${field.options.join(', ')}.` : '';
        return `${field.label}: ${field.purpose}. ${required}.${digits}${options}`;
      })
      .join('\n');

    const buttons = visible.buttons.length ? visible.buttons : guide?.buttons || [];
    const buttonText = buttons.length ? `दिख रहे buttons: ${buttons.join(', ')}.` : 'अभी कोई साफ button नहीं दिख रहा है। जरूरत हो तो नीचे scroll कीजिए।';
    const errorText = visible.errors.length ? `\nScreen पर error दिख रहा है: ${visible.errors.join(' ')}. कृपया highlighted field सही कीजिए।` : '';
    const nextStep = guide?.nextStep || 'Required fields भरने के बाद Save, Submit या Next जैसा main button दबाइए।';
    const scope = visible.isDialog ? 'modal popup' : 'page';

    return `आप ${visible.title} ${scope} पर हैं।\n${fieldText}\n${buttonText}${errorText}\nअगला step: ${nextStep}`;
  };

  const openUrl = (url: string, label: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
    addAssistantMessage(`${label} नई tab में खोल दिया है।`);
  };

  const calculate = (query: string) => {
    const expression = stripCommand(query, [/calculate/gi, /calculator/gi, /गणना/g, /हिसाब/g, /कैलकुलेट/g])
      .replace(/plus/gi, '+')
      .replace(/minus/gi, '-')
      .replace(/into|multiply|times/gi, '*')
      .replace(/divide|divided by/gi, '/')
      .replace(/x/gi, '*');

    if (!/^[0-9+\-*/().\s%]+$/.test(expression) || !expression.trim()) {
      addAssistantMessage('कृपया calculation ऐसे बोलिए: calculate 25 plus 30 या 12 * 5.');
      return;
    }

    try {
      // Whitelisted numeric expression only; names, strings and operators outside math are blocked above.
      const result = Function(`"use strict"; return (${expression})`)();
      addAssistantMessage(`${expression.trim()} का जवाब ${Number(result).toLocaleString('en-IN')} है।`);
    } catch {
      addAssistantMessage('यह calculation समझ नहीं आई। कृपया simple numbers और operators के साथ पूछिए।');
    }
  };

  const getWeather = async (query: string) => {
    const city = stripCommand(query, [/weather/gi, /मौसम/g, /temperature/gi, /तापमान/g]) || 'Delhi';
    try {
      const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?count=1&language=en&format=json&name=${encodeURIComponent(city)}`);
      const geo = await geoResponse.json();
      const place = geo?.results?.[0];
      if (!place) {
        addAssistantMessage(`${city} का weather location नहीं मिला।`);
        return;
      }

      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m`
      );
      const weather = await weatherResponse.json();
      addAssistantMessage(
        `${place.name} में अभी temperature ${weather.current?.temperature_2m}°C है, humidity ${weather.current?.relative_humidity_2m}% और wind speed ${weather.current?.wind_speed_10m} km/h है।`
      );
    } catch {
      addAssistantMessage('Weather fetch नहीं हो पाया। यह free Open-Meteo API से आता है; internet connection check कीजिए।');
    }
  };

  const getNews = async () => {
    try {
      const response = await fetch('https://hn.algolia.com/api/v1/search?tags=front_page');
      const data = await response.json();
      const headlines = (data.hits || [])
        .slice(0, 5)
        .map((item: any, index: number) => `${index + 1}. ${item.title}`)
        .join('\n');
      addAssistantMessage(`Free public Hacker News API से top headlines:\n${headlines}`);
    } catch {
      addAssistantMessage('News headlines fetch नहीं हो पाए। यह free public API से आता है; internet connection check कीजिए।');
    }
  };

  const searchWikipedia = async (query: string) => {
    const topic = stripCommand(query, [/wikipedia/gi, /wiki/gi, /विकिपीडिया/g, /search/gi, /खोज/g]);
    if (!topic) {
      addAssistantMessage('कृपया Wikipedia topic बताइए, जैसे: Wikipedia election commission.');
      return;
    }

    try {
      const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topic)}`);
      if (!response.ok) throw new Error('Not found');
      const data = await response.json();
      addAssistantMessage(`${data.title}: ${data.extract || 'Summary available नहीं है।'}`);
    } catch {
      addAssistantMessage(`${topic} के लिए Wikipedia summary नहीं मिली।`);
    }
  };

  const askOllama = async (query: string) => {
    if (!settingsRef.current.useOllama) return false;
    try {
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: settingsRef.current.ollamaModel,
          prompt: `You are Swara, a polite Hindi assistant for an election portal. Answer briefly in Hindi. User asked: ${query}`,
          stream: false
        })
      });
      if (!response.ok) return false;
      const data = await response.json();
      if (data?.response) {
        addAssistantMessage(data.response.trim());
        return true;
      }
    } catch {
      return false;
    }
    return false;
  };

  const addTodo = (text: string) => {
    if (!text) {
      addAssistantMessage('Task जोड़ने के लिए task text बताइए।');
      return;
    }
    setTodos((prev) => [{ id: makeId(), text, done: false, createdAt: new Date().toISOString() }, ...prev]);
    addAssistantMessage(`Task जोड़ दिया: ${text}`);
  };

  const addNote = (text: string) => {
    if (!text) {
      addAssistantMessage('Note बनाने के लिए note text बताइए।');
      return;
    }
    setNotes((prev) => [{ id: makeId(), text, createdAt: new Date().toISOString() }, ...prev]);
    addAssistantMessage(`Note save कर दिया: ${text}`);
  };

  const addReminder = (text: string) => {
    if (!text) {
      addAssistantMessage('Reminder बनाने के लिए detail बताइए, जैसे: remind me submit report tomorrow.');
      return;
    }
    setReminders((prev) => [{ id: makeId(), text, dueText: text, createdAt: new Date().toISOString() }, ...prev]);
    addAssistantMessage(`Reminder save कर दिया: ${text}`);
  };

  const explainProject = () => {
    const modules = [
      'Dashboard Overview',
      'Election Management: Nagar Panchayat और Nagari Nikay dashboards',
      'Masters: Country, State, District, Office, City, Ward, Polling Station',
      'HRMS: Employee Type, Designation, Department, Pay Level, Master Employee',
      'Users: Access Management और permissions',
      'Reports: Allocation Report और Duty Analytics'
    ];
    addAssistantMessage(`यह Laravel + React election portal है। Main modules हैं:\n${modules.join('\n')}\nमैं current page और modal popup के visible fields देखकर exact guidance दे सकती हूँ।`);
  };

  const processCommand = async (query: string) => {
    const cleanQuery = normalize(query);

    if (settings.wakeWord && !/hey assistant|hey swara|स्वरा|हे असिस्टेंट/.test(cleanQuery)) {
      return;
    }

    if (/^(hi|hello|hey|namaste|नमस्ते|हेलो)/.test(cleanQuery)) {
      addAssistantMessage(`नमस्ते ${user?.name || ''}! बताइए, मैं आपकी कैसे मदद करूँ?`);
      return;
    }

    const target = navigationTargets.find(
      (item) => item.keys.some((key) => cleanQuery.includes(key.toLowerCase())) && /(open|go|show|खोल|जाओ|दिख|ले चल)/i.test(cleanQuery)
    );
    if (target) {
      navigate(target.path);
      addAssistantMessage(`${target.name} page खोल रही हूँ। Page खुलने के बाद आप पूछ सकते हैं: यहाँ क्या भरना है?`);
      return;
    }

    if (/project|portal|module|इस project|यह project|पूरा knowledge|complete knowledge/.test(cleanQuery)) {
      explainProject();
      return;
    }

    if (/kya bharna|क्या भरना|kaun sa field|कौन सा field|field|button|बटन|next|अगला|screen|form|फॉर्म|modal|popup|error|गलती|mobile|मोबाइल|data भरना|क्या data/.test(cleanQuery)) {
      addAssistantMessage(screenResponse(query));
      return;
    }

    if (/google|search web|वेब search|गूगल/.test(cleanQuery)) {
      const term = stripCommand(query, [/google/gi, /search web/gi, /web search/gi, /गूगल/g, /खोज/g]);
      openUrl(`https://www.google.com/search?q=${encodeURIComponent(term || query)}`, 'Google search');
      return;
    }

    if (/youtube|यूट्यूब/.test(cleanQuery)) {
      const term = stripCommand(query, [/youtube/gi, /यूट्यूब/g, /search/gi, /खोज/g]);
      openUrl(`https://www.youtube.com/results?search_query=${encodeURIComponent(term || query)}`, 'YouTube search');
      return;
    }

    if (/open website|website खोल|site खोल|open site/.test(cleanQuery)) {
      const site = stripCommand(query, [/open website/gi, /open site/gi, /website खोल/gi, /site खोल/gi]);
      if (!site) {
        addAssistantMessage('कृपया website बताइए, जैसे: open website example.com');
        return;
      }
      const url = /^https?:\/\//i.test(site) ? site : `https://${site}`;
      openUrl(url, 'Website');
      return;
    }

    if (/date|time|samay|तारीख|समय/.test(cleanQuery)) {
      addAssistantMessage(`अभी तारीख और समय है: ${new Date().toLocaleString('hi-IN', { dateStyle: 'full', timeStyle: 'short' })}`);
      return;
    }

    if (/calculate|calculator|गणना|हिसाब|कैलकुलेट|\d+\s*[+\-*/]\s*\d+/.test(cleanQuery)) {
      calculate(query);
      return;
    }

    if (/weather|मौसम|temperature|तापमान/.test(cleanQuery)) {
      await getWeather(query);
      return;
    }

    if (/news|headline|समाचार|खबर/.test(cleanQuery)) {
      await getNews();
      return;
    }

    if (/wikipedia|wiki|विकिपीडिया/.test(cleanQuery)) {
      await searchWikipedia(query);
      return;
    }

    if (/joke|jokes|चुटकुला|मजाक/.test(cleanQuery)) {
      addAssistantMessage(jokes[Math.floor(Math.random() * jokes.length)]);
      return;
    }

    if (/fact|facts|तथ्य/.test(cleanQuery)) {
      addAssistantMessage(facts[Math.floor(Math.random() * facts.length)]);
      return;
    }

    if (/add task|todo|to-do|task जोड़|काम जोड़/.test(cleanQuery)) {
      addTodo(stripCommand(query, [/add task/gi, /todo/gi, /to-do/gi, /task जोड़/gi, /काम जोड़/g]));
      return;
    }

    if (/show tasks|list tasks|task दिख|todo दिख/.test(cleanQuery)) {
      addAssistantMessage(todos.length ? `आपके tasks:\n${todos.map((todo, index) => `${index + 1}. ${todo.done ? 'Done: ' : ''}${todo.text}`).join('\n')}` : 'अभी कोई task saved नहीं है।');
      return;
    }

    if (/add note|note बन|note save|नोट/.test(cleanQuery)) {
      addNote(stripCommand(query, [/add note/gi, /note बन/gi, /note save/gi, /नोट/g]));
      return;
    }

    if (/show notes|notes दिख|नोट दिख/.test(cleanQuery)) {
      addAssistantMessage(notes.length ? `आपके notes:\n${notes.map((note, index) => `${index + 1}. ${note.text}`).join('\n')}` : 'अभी कोई note saved नहीं है।');
      return;
    }

    if (/remind|reminder|याद दिल/.test(cleanQuery)) {
      addReminder(stripCommand(query, [/remind me/gi, /reminder/gi, /remind/gi, /याद दिलाना/g, /याद दिल/g]));
      return;
    }

    if (/dark mode|डार्क/.test(cleanQuery)) {
      setIsDark(true);
      addAssistantMessage('Assistant panel dark mode में कर दिया है।');
      return;
    }

    if (/light mode|लाइट/.test(cleanQuery)) {
      setIsDark(false);
      addAssistantMessage('Assistant panel light mode में कर दिया है।');
      return;
    }

    if (/history|command history/.test(cleanQuery)) {
      setActiveTab('history');
      addAssistantMessage('Command history tab खोल दिया है।');
      return;
    }

    if (/help|madad|मदद|command|क्या कर सकती/.test(cleanQuery)) {
      addAssistantMessage('आप बोल सकते हैं: “यहाँ क्या भरना है”, “Employee page खोलिए”, “Google search election rules”, “YouTube search training”, “calculate 25+30”, “weather Jaipur”, “Wikipedia India”, “add task report banana”, “add note meeting at 5”, “remind me call officer tomorrow”, “dark mode”, या “project के modules बताइए”।');
      return;
    }

    const ollamaAnswered = await askOllama(query);
    if (ollamaAnswered) return;

    addAssistantMessage(screenResponse(query));
  };

  const handleSendMessage = (text: string) => {
    if (!text.trim()) return;
    addUserMessage(text);
    processCommand(text);
    setInputValue('');
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      addAssistantMessage('इस browser में Speech Recognition supported नहीं है। कृपया type करके पूछिए।');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      return;
    }

    try {
      window.speechSynthesis.cancel();
      recognitionRef.current.lang = settings.language;
      recognitionRef.current.start();
    } catch {
      addAssistantMessage('Mic अभी start नहीं हो पाया। कृपया permission check करके फिर mic दबाइए।');
    }
  };

  const updateSetting = <K extends keyof AssistantSettings>(key: K, value: AssistantSettings[K]) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const addManualTask = () => {
    addTodo(newTask.trim());
    setNewTask('');
  };

  const addManualNote = () => {
    addNote(newNote.trim());
    setNewNote('');
  };

  const panelBg = isDark ? '#111827' : theme.palette.background.paper;
  const panelText = isDark ? '#f8fafc' : theme.palette.text.primary;
  const subtleBg = isDark ? 'rgba(255,255,255,0.08)' : 'grey.100';
  const panelBorder = isDark ? 'rgba(255,255,255,0.12)' : theme.palette.divider;
  const quickPrompts = [
    'यहाँ क्या भरना है?',
    'Employee page खोलिए',
    'Project modules बताइए'
  ];

  const renderTabs = () => (
    <Stack
      direction="row"
      sx={{
        gap: 0.5,
        px: 1,
        py: 0.75,
        borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : theme.palette.divider}`,
        overflowX: 'auto',
        flexShrink: 0
      }}
    >
      {[
        { key: 'chat', label: 'Chat', icon: <AutoAwesomeTwoToneIcon fontSize="small" /> },
        { key: 'tasks', label: 'Tasks', icon: <ChecklistOutlinedIcon fontSize="small" /> },
        { key: 'notes', label: 'Notes', icon: <NotesOutlinedIcon fontSize="small" /> },
        { key: 'history', label: 'History', icon: <HistoryOutlinedIcon fontSize="small" /> },
        { key: 'settings', label: 'Settings', icon: <SettingsOutlinedIcon fontSize="small" /> }
      ].map((tab) => (
        <Button
          key={tab.key}
          size="small"
          startIcon={tab.icon}
          variant={activeTab === tab.key ? 'contained' : 'text'}
          onClick={() => setActiveTab(tab.key as AssistantTab)}
          sx={{ minWidth: 'auto', px: 1.15, borderRadius: 2, flexShrink: 0, textTransform: 'none', fontWeight: 700 }}
        >
          {tab.label}
        </Button>
      ))}
    </Stack>
  );

  const renderChat = () => (
    <Box sx={{ flexGrow: 1, minHeight: 0, overflowY: 'auto', p: 2 }}>
      <Stack direction="row" sx={{ gap: 1, mb: 1.5, overflowX: 'auto', pb: 0.5 }}>
        {quickPrompts.map((prompt) => (
          <Chip
            key={prompt}
            label={prompt}
            size="small"
            onClick={() => handleSendMessage(prompt)}
            sx={{ flexShrink: 0, borderRadius: 2, bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'primary.lighter', color: isDark ? '#f8fafc' : 'primary.dark', fontWeight: 700 }}
          />
        ))}
      </Stack>
      <List sx={{ p: 0 }}>
        {messages.map((message, index) => {
          const isUser = message.sender === 'user';
          return (
            <ListItem key={`${message.timestamp.getTime()}-${index}`} sx={{ p: 0, mb: 1.5, justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
              <Box
                sx={{
                  maxWidth: '88%',
                  p: 1.5,
                  borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  bgcolor: isUser ? 'primary.main' : subtleBg,
                  color: isUser ? '#fff' : panelText,
                  border: isUser ? 'none' : `1px solid ${panelBorder}`,
                  boxShadow: isUser ? '0 8px 18px rgba(25, 118, 210, 0.2)' : 'none'
                }}
              >
                <Typography variant="body2" sx={{ whiteSpace: 'pre-line', wordBreak: 'break-word' }}>
                  {message.text}
                </Typography>
              </Box>
            </ListItem>
          );
        })}
        <div ref={chatEndRef} />
      </List>
    </Box>
  );

  const renderTasks = () => (
    <Box sx={{ flexGrow: 1, minHeight: 0, overflowY: 'auto', p: 2 }}>
      <Stack direction="row" sx={{ gap: 1, mb: 2 }}>
        <TextField size="small" fullWidth placeholder="New task" value={newTask} onChange={(event) => setNewTask(event.target.value)} />
        <Button variant="contained" onClick={addManualTask}>Add</Button>
      </Stack>
      <Stack sx={{ gap: 1 }}>
        {todos.length === 0 && <Typography variant="body2" color={isDark ? 'rgba(255,255,255,0.7)' : 'text.secondary'}>No tasks yet.</Typography>}
        {todos.map((todo) => (
          <Paper key={todo.id} variant="outlined" sx={{ p: 1, bgcolor: 'transparent', color: panelText }}>
            <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
              <Switch size="small" checked={todo.done} onChange={(event) => setTodos((prev) => prev.map((item) => (item.id === todo.id ? { ...item, done: event.target.checked } : item)))} />
              <Typography variant="body2" sx={{ flex: 1, textDecoration: todo.done ? 'line-through' : 'none' }}>{todo.text}</Typography>
              <IconButton size="small" onClick={() => setTodos((prev) => prev.filter((item) => item.id !== todo.id))}>
                <DeleteOutlineOutlinedIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Paper>
        ))}
      </Stack>
    </Box>
  );

  const renderNotes = () => (
    <Box sx={{ flexGrow: 1, minHeight: 0, overflowY: 'auto', p: 2 }}>
      <Stack sx={{ gap: 1, mb: 2 }}>
        <TextField size="small" fullWidth multiline minRows={2} placeholder="New note" value={newNote} onChange={(event) => setNewNote(event.target.value)} />
        <Button variant="contained" onClick={addManualNote}>Save Note</Button>
      </Stack>
      <Stack sx={{ gap: 1 }}>
        {notes.length === 0 && <Typography variant="body2" color={isDark ? 'rgba(255,255,255,0.7)' : 'text.secondary'}>No notes yet.</Typography>}
        {notes.map((note) => (
          <Paper key={note.id} variant="outlined" sx={{ p: 1.25, bgcolor: 'transparent', color: panelText }}>
            <Stack direction="row" sx={{ alignItems: 'flex-start', gap: 1 }}>
              <Typography variant="body2" sx={{ flex: 1, whiteSpace: 'pre-line' }}>{note.text}</Typography>
              <IconButton size="small" onClick={() => setNotes((prev) => prev.filter((item) => item.id !== note.id))}>
                <DeleteOutlineOutlinedIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Paper>
        ))}
      </Stack>
    </Box>
  );

  const renderHistory = () => (
    <Box sx={{ flexGrow: 1, minHeight: 0, overflowY: 'auto', p: 2 }}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="subtitle2" sx={{ color: panelText }}>Command History</Typography>
        <Button size="small" onClick={() => setCommandHistory([])}>Clear</Button>
      </Stack>
      <Stack sx={{ gap: 1 }}>
        {commandHistory.map((command) => (
          <Chip key={command} label={command} onClick={() => handleSendMessage(command)} sx={{ justifyContent: 'flex-start', maxWidth: '100%' }} />
        ))}
        {reminders.length > 0 && (
          <>
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" sx={{ color: panelText }}>Reminders</Typography>
            {reminders.map((reminder) => (
              <Chip key={reminder.id} label={reminder.text} onDelete={() => setReminders((prev) => prev.filter((item) => item.id !== reminder.id))} />
            ))}
          </>
        )}
      </Stack>
    </Box>
  );

  const renderSettings = () => (
    <Box sx={{ flexGrow: 1, minHeight: 0, overflowY: 'auto', p: 2 }}>
      <Stack sx={{ gap: 2 }}>
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="body2" sx={{ color: panelText }}>Language</Typography>
          <Stack direction="row" sx={{ gap: 1 }}>
            <Button size="small" variant={settings.language === 'hi-IN' ? 'contained' : 'outlined'} onClick={() => updateSetting('language', 'hi-IN')}>Hindi</Button>
            <Button size="small" variant={settings.language === 'en-US' ? 'contained' : 'outlined'} onClick={() => updateSetting('language', 'en-US')}>English</Button>
          </Stack>
        </Stack>
        <Box>
          <Typography variant="body2" sx={{ color: panelText }}>Voice Speed: {settings.rate.toFixed(1)}</Typography>
          <Slider min={0.6} max={1.6} step={0.1} value={settings.rate} onChange={(_, value) => updateSetting('rate', value as number)} />
        </Box>
        <Box>
          <Typography variant="body2" sx={{ color: panelText }}>Volume: {Math.round(settings.volume * 100)}%</Typography>
          <Slider min={0} max={1} step={0.05} value={settings.volume} onChange={(_, value) => updateSetting('volume', value as number)} />
        </Box>
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="body2" sx={{ color: panelText }}>Continuous listening</Typography>
          <Switch checked={settings.continuous} onChange={(event) => updateSetting('continuous', event.target.checked)} />
        </Stack>
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="body2" sx={{ color: panelText }}>Wake word: Hey Assistant / Swara</Typography>
          <Switch checked={settings.wakeWord} onChange={(event) => updateSetting('wakeWord', event.target.checked)} />
        </Stack>
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="body2" sx={{ color: panelText }}>Assistant dark mode</Typography>
          <IconButton onClick={() => setIsDark((value) => !value)}>{isDark ? <LightModeOutlinedIcon /> : <DarkModeOutlinedIcon />}</IconButton>
        </Stack>
        <Divider />
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="body2" sx={{ color: panelText }}>Optional local AI via Ollama</Typography>
            <Typography variant="caption" color={isDark ? 'rgba(255,255,255,0.7)' : 'text.secondary'}>Only localhost, no paid API.</Typography>
          </Box>
          <Switch checked={settings.useOllama} onChange={(event) => updateSetting('useOllama', event.target.checked)} />
        </Stack>
        <TextField size="small" label="Ollama model" value={settings.ollamaModel} onChange={(event) => updateSetting('ollamaModel', event.target.value)} />
      </Stack>
    </Box>
  );

  const renderActiveTab = () => {
    if (activeTab === 'tasks') return renderTasks();
    if (activeTab === 'notes') return renderNotes();
    if (activeTab === 'history') return renderHistory();
    if (activeTab === 'settings') return renderSettings();
    return renderChat();
  };

  return (
    <>
      <Tooltip title="Swara - Free Local AI Voice Assistant" placement="left">
        <Fab
          color="primary"
          aria-label="swara-assistant"
          onClick={() => setIsOpen((value) => !value)}
          sx={{
            position: 'fixed',
            bottom: { xs: 18, sm: 24 },
            right: { xs: 18, sm: 24 },
            zIndex: (theme) => theme.zIndex.appBar + 20,
            width: { xs: 56, sm: 58 },
            height: { xs: 56, sm: 58 },
            background: 'linear-gradient(135deg, #0f766e, #2563eb)',
            boxShadow: '0 18px 36px rgba(37, 99, 235, 0.32)'
          }}
        >
          <AutoAwesomeTwoToneIcon sx={{ fontSize: '1.8rem', color: '#fff' }} />
        </Fab>
      </Tooltip>

      <Grow in={isOpen} style={{ transformOrigin: 'bottom right' }}>
        <Paper
          elevation={12}
          sx={{
            position: 'fixed',
            top: { xs: 76, sm: 'auto' },
            bottom: { xs: 82, sm: 94 },
            left: { xs: 12, sm: 'auto' },
            right: { xs: 12, sm: 24 },
            width: { xs: 'auto', sm: 440 },
            height: { xs: 'auto', sm: 650 },
            maxHeight: { xs: 'none', sm: 680 },
            zIndex: (theme) => theme.zIndex.appBar + 20,
            borderRadius: { xs: 2, sm: 2.5 },
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            border: `1px solid ${panelBorder}`,
            bgcolor: panelBg,
            color: panelText,
            boxShadow: isDark ? '0 24px 70px rgba(0,0,0,0.55)' : '0 24px 70px rgba(15,23,42,0.2)'
          }}
        >
          <Box sx={{ p: { xs: 1.25, sm: 2 }, background: 'linear-gradient(135deg, #0f766e, #2563eb)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, gap: 1 }}>
            <Stack direction="row" spacing={1.2} sx={{ alignItems: 'center', minWidth: 0 }}>
              <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 40, height: 40, border: '1px solid rgba(255,255,255,0.28)' }}>
                <AutoAwesomeTwoToneIcon sx={{ color: '#fff', fontSize: '1.3rem' }} />
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#fff' }}>
                  Election Swara
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.85, display: 'block' }}>
                  Free Local Voice Assistant
                </Typography>
                <Stack direction="row" sx={{ gap: 0.75, mt: 0.75 }}>
                  <Chip size="small" label={isListening ? 'Listening' : 'Ready'} color={isListening ? 'error' : 'success'} sx={{ height: 20, fontSize: '0.68rem', fontWeight: 800 }} />
                  <Chip size="small" label={settings.language === 'hi-IN' ? 'Hindi' : 'English'} sx={{ height: 20, fontSize: '0.68rem', color: '#fff', bgcolor: 'rgba(255,255,255,0.16)' }} />
                </Stack>
              </Box>
            </Stack>

            <Stack direction="row" spacing={0.25} sx={{ alignItems: 'center', flexShrink: 0 }}>
              <Tooltip title={settings.continuous ? 'Continuous listening on' : 'Continuous listening off'}>
                <IconButton size="small" onClick={() => updateSetting('continuous', !settings.continuous)} sx={{ color: '#fff' }}>
                  <MicIcon fontSize="small" color={settings.continuous ? 'success' : 'inherit'} />
                </IconButton>
              </Tooltip>
              <IconButton size="small" onClick={() => setIsMuted((value) => !value)} sx={{ color: '#fff' }}>
                {isMuted ? <VolumeOffIcon fontSize="small" /> : <VolumeUpIcon fontSize="small" />}
              </IconButton>
              <IconButton size="small" onClick={() => setIsOpen(false)} sx={{ color: '#fff' }}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Box>

          {renderTabs()}
          {renderActiveTab()}

          {isListening && (
            <Box sx={{ px: 2, py: 1, borderTop: `1px dashed ${isDark ? 'rgba(255,255,255,0.16)' : theme.palette.divider}`, color: 'primary.main', flexShrink: 0 }}>
              <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 700 }}>
                  {listeningText}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '3px', height: 18 }}>
                  {[1, 2, 3, 4, 5].map((bar) => (
                    <Box
                      key={bar}
                      sx={{
                        width: 3,
                        height: 6,
                        borderRadius: 1,
                        bgcolor: 'primary.main',
                        animation: 'swaraWave 1s ease-in-out infinite',
                        animationDelay: `${bar * 0.12}s`,
                        '@keyframes swaraWave': {
                          '0%, 100%': { height: 6 },
                          '50%': { height: 18 }
                        }
                      }}
                    />
                  ))}
                </Box>
              </Stack>
            </Box>
          )}

          <Box
            component="form"
            onSubmit={(event: React.FormEvent) => {
              event.preventDefault();
              handleSendMessage(inputValue);
            }}
            sx={{
              p: 1.5,
              borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : theme.palette.divider}`,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              flexShrink: 0
            }}
          >
            <Tooltip title={isListening ? 'सुनना बंद करें' : 'बोलना शुरू करें'}>
              <IconButton color={isListening ? 'error' : 'primary'} onClick={toggleListening} sx={{ width: 44, height: 44 }}>
                {isListening ? <MicOffIcon /> : <MicIcon />}
              </IconButton>
            </Tooltip>

            <TextField
              fullWidth
              size="small"
              placeholder='पूछिए: "इस popup में क्या भरना है?"'
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              disabled={isListening}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 6,
                  bgcolor: isDark ? 'rgba(255,255,255,0.08)' : theme.palette.background.paper,
                  color: panelText
                },
                '& input': { color: panelText }
              }}
            />

            <IconButton type="submit" color="primary" disabled={!inputValue.trim() || isListening}>
              <SendIcon fontSize="small" />
            </IconButton>
          </Box>
        </Paper>
      </Grow>
    </>
  );
}

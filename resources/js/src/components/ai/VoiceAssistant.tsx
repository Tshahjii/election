import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTheme } from '@mui/material/styles';
import {
  Box,
  Fab,
  Paper,
  Typography,
  IconButton,
  TextField,
  List,
  ListItem,
  Stack,
  Tooltip,
  Grow,
  Avatar
} from '@mui/material';

// Icons
import AutoAwesomeTwoToneIcon from '@mui/icons-material/AutoAwesomeTwoTone';
import { useAppPreferences } from 'contexts/AppPreferences';
import CloseIcon from '@mui/icons-material/Close';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import SendIcon from '@mui/icons-material/Send';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';

interface Message {
  sender: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

export default function VoiceAssistant() {
  const theme = useTheme();
  const navigate = useNavigate();
  const user = useSelector((state: any) => state.auth?.user);
  const { setThemeMode, setAccentColor, setLanguage } = useAppPreferences();

  // Assistant states
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'assistant',
      text: 'नमस्ते! मैं आपकी इलेक्शन असिस्टेंट "स्वरा" हूँ। आप मुझसे कुछ भी पूछ सकते हैं, मैं तुरंत जवाब दूँगी।',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isHandsFree, setIsHandsFree] = useState(false);
  const [listeningText, setListeningText] = useState('सुन रही हूँ...');

  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

  // Refs to prevent stale closure in async callbacks
  const isHandsFreeRef = useRef(false);
  const isListeningRef = useRef(false);
  const isOpenRef = useRef(false);

  useEffect(() => {
    isHandsFreeRef.current = isHandsFree;
  }, [isHandsFree]);

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  // Auto-scroll chat history
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  // Trigger greeting speech on open, and clean up on close
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        speakText(`नमस्ते ${user?.name || ''}! मैं आपकी इलेक्शन असिस्टेंट "स्वरा" हूँ। आज मैं आपकी क्या मदद कर सकती हूँ?`);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      // Stop all speech and recognition when closed
      window.speechSynthesis.cancel();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [isOpen, user]);

  // Pre-load voices for instant speech
  useEffect(() => {
    const loadVoices = () => {
      voicesRef.current = window.speechSynthesis.getVoices();
    };
    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Setup Web Speech API for Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'hi-IN'; // Indian context handles English & Hindi speech

      recognition.onstart = () => {
        setIsListening(true);
        setListeningText('सुन रही हूँ... (Listening...)');
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        handleSendMessage(transcript);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          addAssistantMessage('माइक्रोफ़ोन परमिशन नहीं मिली। कृपया परमिशन दें या टाइप करें।');
        } else if (event.error === 'no-speech') {
          // Speak back only if not in hands-free to avoid constant timeout loops
          if (!isHandsFreeRef.current) {
            addAssistantMessage('मुझे आवाज़ नहीं आई। कृपया दोबारा बोलें!');
          }
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        // If hands-free is ON, we are NOT speaking, and we are not currently listening, auto-restart
        if (isHandsFreeRef.current && isOpenRef.current && !window.speechSynthesis.speaking) {
          setTimeout(() => {
            if (isHandsFreeRef.current && isOpenRef.current && !isListeningRef.current && !window.speechSynthesis.speaking) {
              try {
                recognitionRef.current.start();
              } catch (e) {
                console.error("Autostart inside onend error:", e);
              }
            }
          }, 800); // 800ms silence auto-listening restart
        }
      };

      recognitionRef.current = recognition;
    }
  }, []);

  // Speak response back using a preferred female/girl voice
  const speakText = (text: string) => {
    if (isMuted) return;
    try {
      // Instantly cancel any active speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = voicesRef.current.length > 0 ? voicesRef.current : window.speechSynthesis.getVoices();
      
      // Filter list of Hindi voices
      const hiVoices = voices.filter(
        (v) => v.lang.startsWith('hi') || v.lang.includes('hi-IN') || v.lang.includes('hi_IN')
      );

      // Criteria to identify female voice names
      const isFemaleVoice = (voice: SpeechSynthesisVoice) => {
        const name = voice.name.toLowerCase();
        return name.includes('female') || 
               name.includes('google हिन्दी') || 
               name.includes('kalpana') || 
               name.includes('swara') || 
               name.includes('sabina') || 
               name.includes('zira') || 
               name.includes('hazel') ||
               name.includes('heera') ||
               name.includes('siri') ||
               name.includes('haruka') ||
               name.includes('karen') ||
               name.includes('samantha') ||
               name.includes('moira');
      };

      // 1. Prefer Hindi Female Voice
      let selectedVoice = hiVoices.find(isFemaleVoice);

      // 2. Fallback to any Hindi voice
      if (!selectedVoice && hiVoices.length > 0) {
        selectedVoice = hiVoices[0];
      }

      // 3. Fallback to English Indian/US Female Voice
      if (!selectedVoice) {
        const enVoices = voices.filter((v) => v.lang.startsWith('en'));
        selectedVoice = enVoices.find((v) => v.lang.includes('en-IN') && isFemaleVoice(v)) || 
                        enVoices.find((v) => v.lang.includes('en-IN')) ||
                        enVoices.find(isFemaleVoice) ||
                        enVoices[0];
      }

      if (selectedVoice) {
        utterance.voice = selectedVoice;
        utterance.lang = selectedVoice.lang;
      }

      // Snappy and clear audio properties
      utterance.rate = 1.05; // Slightly faster to feel active and modern
      utterance.pitch = 1.05; // Slightly higher pitch for a clear girl voice accent
      
      utterance.onstart = () => {
        // Stop recognition if speaking starts
        if (recognitionRef.current && isListeningRef.current) {
          try {
            recognitionRef.current.stop();
          } catch (e) {
            console.error(e);
          }
        }
      };

      utterance.onend = () => {
        // If hands-free mode is enabled, start listening again automatically after speaking finishes!
        if (isHandsFreeRef.current && isOpenRef.current) {
          setTimeout(() => {
            if (recognitionRef.current && !isListeningRef.current && isOpenRef.current) {
              try {
                recognitionRef.current.start();
              } catch (e) {
                console.error("Autostart inside utterance.onend error:", e);
              }
            }
          }, 400); // 400ms delay after speaking finishes to prevent feedback
        }
      };

      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Speech synthesis error:', error);
    }
  };

  const addAssistantMessage = (text: string) => {
    setMessages((prev) => [...prev, { sender: 'assistant', text, timestamp: new Date() }]);
    
    if (isMuted) {
      // If muted, wait 1.5s then trigger auto-listen if handsfree is ON
      if (isHandsFree) {
        setTimeout(() => {
          if (recognitionRef.current && !isListeningRef.current && isOpenRef.current) {
            try {
              recognitionRef.current.start();
            } catch (e) {
              console.error(e);
            }
          }
        }, 1500);
      }
    } else {
      speakText(text);
    }
  };

  // Toggle listening
  const toggleListening = () => {
    if (!recognitionRef.current) {
      addAssistantMessage('स्पीच रिकग्निशन सपोर्टेड नहीं है। कृपया टाइप करें।');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        window.speechSynthesis.cancel(); // Stop speaking if they click to talk
        recognitionRef.current.start();
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Toggle continuous Real-time Talk mode
  const toggleHandsFree = () => {
    const nextState = !isHandsFree;
    setIsHandsFree(nextState);
    
    if (nextState) {
      window.speechSynthesis.cancel();
      // Start listening immediately
      if (recognitionRef.current && !isListening) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.error(e);
        }
      }
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.error(e);
        }
      }
    }
  };

  // Process inputs & commands instantly
  const processCommand = (query: string) => {
    const cleanQuery = query.toLowerCase().trim();

    // 1. Navigation Command Mapping
    const navigations = [
      { keys: ['country', 'countries', 'desh', 'rashtra', 'कंट्री', 'देश'], path: '/admin/masters/countries', name: 'कंट्री मास्टर' },
      { keys: ['state', 'states', 'rajya', 'pradesh', 'स्टेट', 'राज्य', 'प्रदेश'], path: '/admin/masters/states', name: 'स्टेट मास्टर' },
      { keys: ['district', 'districts', 'jila', 'zila', 'डिस्ट्रिक्ट', 'जिला', 'ज़िला'], path: '/admin/masters/districts', name: 'डिस्ट्रिक्ट मास्टर' },
      { keys: ['office', 'offices', 'karyalaya', 'daftar', 'ऑफिस', 'कार्यालय', 'दफ़्तर'], path: '/admin/masters/offices', name: 'ऑफिस मास्टर' },
      { keys: ['city', 'cities', 'shahar', 'nagar', 'सिटी', 'शहर', 'नगर'], path: '/admin/masters/cities', name: 'सिटी  मास्टर' },
      { keys: ['ward', 'wards', 'वार्ड', 'वर्ड'], path: '/admin/masters/wards', name: 'वार्ड मास्टर' },
      { keys: ['polling', 'booth', 'matdan', 'station', 'पोलिंग', 'बूथ', 'मतदान', 'स्टेशन'], path: '/admin/masters/polling-stations', name: 'पोलिंग स्टेशन -मास्टर' },
      { keys: ['employee type', 'emp type', 'एम्प्लोयी टाइप'], path: '/admin/masters/emp-types', name: 'एम्प्लोयी टाइप' },
      { keys: ['designation', 'designations', 'pad', 'पद', 'डेसिग्नेशन'], path: '/admin/masters/designations', name: 'डेसिग्नेशन' },
      { keys: ['department', 'departments', 'vibhag', 'विभाग', 'डिपार्टमेंट'], path: '/admin/masters/departments', name: 'डिपार्टमेंट' },
      { keys: ['pay scale', 'pay level', 'salary', 'vetan', 'vetanman', 'सैलरी', 'वेतन'], path: '/admin/masters/pay-levels', name: 'पे स्केल' },
      { keys: ['employee', 'emploee', 'employe', 'karmachari', 'karmchari', 'कर्मचारी', 'एम्पलाई', 'एम्प्लोयी'], path: '/admin/hrms/master-employee', name: 'मास्टर एम्प्लोयी' },
      { keys: ['access', 'permission', 'role', 'roles', 'adikar', 'adhikar', 'अधिकार', 'रोल', 'परमिशन'], path: '/admin/users/access-management', name: 'एक्सेस मैनेजमेंट' },
      { keys: ['dashboard', 'home', 'overview', 'main', 'डैशबोर्ड', 'होम'], path: '/admin/dashboard', name: 'डैशबोर्ड ओवरव्यू' }
    ];

    // 1.5. Translation / Explanation Questions Check
    const isTranslationQuery = 
      cleanQuery.includes('kya bolte') || 
      cleanQuery.includes('kya bolate') || 
      cleanQuery.includes('क्या बोलते') || 
      cleanQuery.includes('मतलब') || 
      cleanQuery.includes('meaning') ||
      cleanQuery.includes('hindi me') ||
      cleanQuery.includes('hindi mein');

    if (isTranslationQuery) {
      if (cleanQuery.includes('employee') || cleanQuery.includes('emploee') || cleanQuery.includes('एम्पलाई') || cleanQuery.includes('एम्प्लोयी')) {
        addAssistantMessage("एम्प्लोयी (Employee) को हिंदी में 'कर्मचारी' बोलते हैं।");
        return;
      }
      if (cleanQuery.includes('district') || cleanQuery.includes('zila') || cleanQuery.includes('zillah') || cleanQuery.includes('डिस्ट्रिक्ट')) {
        addAssistantMessage("डिस्ट्रिक्ट (District) को हिंदी में 'ज़िला' या 'जनपद' बोलते हैं।");
        return;
      }
      if (cleanQuery.includes('state') || cleanQuery.includes('pradesh') || cleanQuery.includes('स्टेट')) {
        addAssistantMessage("स्टेट (State) को हिंदी में 'राज्य' या 'प्रदेश' बोलते हैं।");
        return;
      }
      if (cleanQuery.includes('country') || cleanQuery.includes('desh') || cleanQuery.includes('कंट्री')) {
        addAssistantMessage("कंट्री (Country) को हिंदी में 'देश' या 'राष्ट्र' बोलते हैं।");
        return;
      }
      if (cleanQuery.includes('office') || cleanQuery.includes('karyalaya') || cleanQuery.includes('ऑफिस')) {
        addAssistantMessage("ऑफिस (Office) को हिंदी में 'कार्यालय' या 'दफ़्तर' बोलते हैं।");
        return;
      }
      if (cleanQuery.includes('department') || cleanQuery.includes('vibhag') || cleanQuery.includes('डिपार्टमेंट')) {
        addAssistantMessage("डिपार्टमेंट (Department) को हिंदी में 'विभाग' बोलते हैं।");
        return;
      }
      if (cleanQuery.includes('designation') || cleanQuery.includes('pad') || cleanQuery.includes('डेसिग्नेशन')) {
        addAssistantMessage("डेसिग्नेशन (Designation) को हिंदी में 'पद' बोलते हैं।");
        return;
      }
      if (cleanQuery.includes('ward') || cleanQuery.includes('वार्ड')) {
        addAssistantMessage("वार्ड (Ward) को हिंदी में 'वार्ड' या 'प्रभाग' बोलते हैं।");
        return;
      }
      if (cleanQuery.includes('polling') || cleanQuery.includes('booth') || cleanQuery.includes('मतदान')) {
        addAssistantMessage("पोलिंग स्टेशन (Polling Station) को हिंदी में 'मतदान केंद्र' बोलते हैं।");
        return;
      }
    }

    // Check if query is navigation request
    // It's a navigation if they use navigation verbs OR if they just name the page without asking a question.
    const isQuestion = cleanQuery.includes('what') || 
                       cleanQuery.includes('kya') || 
                       cleanQuery.includes('kon') || 
                       cleanQuery.includes('kaun') || 
                       cleanQuery.includes('explain') || 
                       cleanQuery.includes('meaning') || 
                       cleanQuery.includes('बता') || 
                       cleanQuery.includes('क्या') || 
                       cleanQuery.includes('क्यों') || 
                       cleanQuery.includes('कैसे') || 
                       cleanQuery.includes('कौन');

    const isNav = !isQuestion || 
                  cleanQuery.includes('go to') || 
                  cleanQuery.includes('open') || 
                  cleanQuery.includes('kholo') || 
                  cleanQuery.includes('dikhao') ||
                  cleanQuery.includes('chalo') ||
                  cleanQuery.includes('navigate') ||
                  cleanQuery.includes('खोल') ||
                  cleanQuery.includes('दिखा') ||
                  cleanQuery.includes('पर जाओ') ||
                  cleanQuery.includes('चलो') ||
                  cleanQuery.includes('fill') ||
                  cleanQuery.includes('feel') ||
                  cleanQuery.includes('add') ||
                  cleanQuery.includes('insert') ||
                  cleanQuery.includes('enter') ||
                  cleanQuery.includes('view') ||
                  cleanQuery.includes('detail') ||
                  cleanQuery.includes('form') ||
                  cleanQuery.includes('भर') ||
                  cleanQuery.includes('डिटेल') ||
                  cleanQuery.includes('दर्ज') ||
                  cleanQuery.includes('ओपन') ||
                  cleanQuery.includes('गो') ||
                  cleanQuery.includes('शो') ||
                  cleanQuery.includes('व्यू') ||
                  cleanQuery.includes('पेज') ||
                  cleanQuery.includes('पन्ना');

    for (const nav of navigations) {
      const match = nav.keys.some(key => cleanQuery.includes(key));
      if (match && (isNav || nav.keys.some(k => cleanQuery === k))) {
        navigate(nav.path);
        addAssistantMessage(`${nav.name} पेज खोल रही हूँ।`);
        return;
      }
    }

    // 1.8. Collapse Group Navigation Check
    const collapseGroups = [
      {
        keys: ['hrms', 'एचआरएमएस', 'hr'],
        reply: "एचआरएमएस (HRMS) में 'मास्टर एम्प्लोयी' (Master Employee) पेज है। क्या आप उसे खोलना चाहते हैं? आप बोल सकते हैं 'कर्मचारी पेज खोलें'।"
      },
      {
        keys: ['master data', 'masters', 'मास्टर डेटा'],
        reply: "मास्टर डेटा में कंट्री, स्टेट, डिस्ट्रिक्ट, ऑफिस, सिटी, वार्ड, पोलिंग स्टेशन, एम्प्लोयी टाइप, डेसिग्नेशन, डिपार्टमेंट और पे स्केल पेज हैं। इनमें से मैं कौन सा मेनू खोलूँ?"
      },
      {
        keys: ['users', 'user', 'यूज़र', 'यूज़र्स'],
        reply: "यूज़र्स (Users) मेनू में 'एक्सेस मैनेजमेंट' (Access Management) पेज है। क्या आप उसे खोलना चाहते हैं? आप बोल सकते हैं 'एक्सेस मैनेजमेंट खोलें'।"
      }
    ];

    for (const group of collapseGroups) {
      const match = group.keys.some(key => cleanQuery === key || (cleanQuery.includes(key) && isNav));
      if (match) {
        addAssistantMessage(group.reply);
        return;
      }
    }

    // 1.9. Theme, Color, and Language Customization Queries
    // Theme Mode Changes
    if (cleanQuery.includes('theme') || cleanQuery.includes('mode') || cleanQuery.includes('थीम') || cleanQuery.includes('मोड')) {
      if (cleanQuery.includes('dark') || cleanQuery.includes('डार्क') || cleanQuery.includes('काला') || cleanQuery.includes('kali')) {
        setThemeMode('dark');
        addAssistantMessage("डार्क थीम सेट कर दी है।");
        return;
      }
      if (cleanQuery.includes('light') || cleanQuery.includes('लाइट') || cleanQuery.includes('सफेद') || cleanQuery.includes('safed')) {
        setThemeMode('light');
        addAssistantMessage("लाइट थीम सेट कर दी है।");
        return;
      }
    }

    // Accent Color Changes
    const isColorChange = cleanQuery.includes('color') || cleanQuery.includes('colour') || cleanQuery.includes('कलर') || cleanQuery.includes('रंग') || cleanQuery.includes('change') || cleanQuery.includes('बदल');
    if (isColorChange) {
      if (cleanQuery.includes('saffron') || cleanQuery.includes('satyam') || cleanQuery.includes('सत्यम') || cleanQuery.includes('केसरिया') || cleanQuery.includes('भगवा') || cleanQuery.includes('सैफरन') || cleanQuery.includes('सफ़्रॉन')) {
        setAccentColor('saffron');
        addAssistantMessage("सफ़्रॉन (केसरिया) रंग सेट कर दिया है।");
        return;
      }
      if (cleanQuery.includes('blue') || cleanQuery.includes('नीला') || cleanQuery.includes('nila') || cleanQuery.includes('ब्लू')) {
        setAccentColor('blue');
        addAssistantMessage("ब्लू (नीला) रंग सेट कर दिया है।");
        return;
      }
      if (cleanQuery.includes('green') || cleanQuery.includes('हरा') || cleanQuery.includes('hara') || cleanQuery.includes('ग्रीन')) {
        setAccentColor('green');
        addAssistantMessage("ग्रीन (हरा) रंग सेट कर दिया है।");
        return;
      }
      if (cleanQuery.includes('maroon') || cleanQuery.includes('मरून') || cleanQuery.includes('लाल') || cleanQuery.includes('lal')) {
        setAccentColor('maroon');
        addAssistantMessage("मरून रंग सेट कर दिया है।");
        return;
      }
      if (cleanQuery.includes('indigo') || cleanQuery.includes('इंडिगो')) {
        setAccentColor('indigo');
        addAssistantMessage("इंडिगो रंग सेट कर दिया है।");
        return;
      }
      if (cleanQuery.includes('teal') || cleanQuery.includes('टील')) {
        setAccentColor('teal');
        addAssistantMessage("टील (Teal) रंग सेट कर दिया है।");
        return;
      }
    }

    // Language Settings (Checks for language name + change intent)
    const wantsEnglish = cleanQuery.includes('english') || 
                         cleanQuery.includes('angrezi') || 
                         cleanQuery.includes('angreji') || 
                         cleanQuery.includes('अंग्रेजी') || 
                         cleanQuery.includes('अंग्रेज़ी') || 
                         cleanQuery.includes('अंगरेजी') ||
                         cleanQuery.includes('इंग्लिश') || 
                         cleanQuery.includes('इंगलिश') ||
                         cleanQuery.includes('इंग्लीश') ||
                         cleanQuery.includes('इंगलीश') ||
                         cleanQuery.includes('इंग्लिस') ||
                         cleanQuery.includes('इंगलिस');

    const wantsHindi = cleanQuery.includes('hindi') || 
                       cleanQuery.includes('हिंदी') || 
                       cleanQuery.includes('हिन्दी') ||
                       cleanQuery.includes('हिंदि') ||
                       cleanQuery.includes('हिन्दि');

    const hasLanguageIntent = cleanQuery.includes('language') || 
                              cleanQuery.includes('भाषा') || 
                              cleanQuery.includes('लैंग्वेज') || 
                              cleanQuery.includes('लेंग्वेज') || 
                              cleanQuery.includes('लैंगवेज') || 
                              cleanQuery.includes('लेंगवेज') || 
                              cleanQuery.includes('बोली') ||
                              cleanQuery.includes('set') ||
                              cleanQuery.includes('सेट') ||
                              cleanQuery.includes('karo') ||
                              cleanQuery.includes('करो') ||
                              cleanQuery.includes('बदल') ||
                              cleanQuery.includes('चेंज') ||
                              cleanQuery.includes('change') ||
                              cleanQuery.includes('में') ||
                              cleanQuery.includes('मे') ||
                              cleanQuery.includes('लगा') ||
                              cleanQuery.includes('कर') ||
                              cleanQuery.includes('me') ||
                              cleanQuery.includes('mein') ||
                              cleanQuery.includes('in');

    if (wantsEnglish && (hasLanguageIntent || cleanQuery === 'english' || cleanQuery === 'इंग्लिश' || cleanQuery === 'इंगलिश')) {
      setLanguage('en');
      addAssistantMessage("I have set the language to English.");
      return;
    }

    if (wantsHindi && (hasLanguageIntent || cleanQuery === 'hindi' || cleanQuery === 'हिंदी' || cleanQuery === 'हिन्दी')) {
      setLanguage('hi');
      addAssistantMessage("मैंने भाषा को हिंदी पर सेट कर दिया है।");
      return;
    }

    // 2. User Context Queries
    const isUserQuery = 
      cleanQuery.includes('who am i') || 
      cleanQuery.includes('who is logged in') || 
      cleanQuery.includes('profile') || 
      cleanQuery.includes('details') || 
      cleanQuery.includes('naam') || 
      cleanQuery.includes('kaun hu') || 
      cleanQuery.includes('kon hu') || 
      cleanQuery.includes('कौन हूँ') || 
      cleanQuery.includes('मेरा नाम');

    if (isUserQuery) {
      if (user) {
        const userName = user.name || 'यूज़र';
        const stateName = user.state_info?.name || user.office_info?.state || 'राज्य';
        const office = user.office_info?.company_name || user.department || 'इलेक्शन डिपार्टमेंट';
        addAssistantMessage(`आप ${userName} के रूप में लॉग इन हैं। आप ${office} में काम कर रहे हैं, जो ${stateName} में स्थित है।`);
      } else {
        addAssistantMessage("मुझे आपका लॉगिन सेशन नहीं मिला। कृपया लॉग इन करें।");
      }
      return;
    }

    // 3. Project Information Queries
    if (cleanQuery.includes('what is this project') || cleanQuery.includes('tell me about this') || cleanQuery.includes('ye kya project hai') || cleanQuery.includes('ye kya hai') || cleanQuery.includes('यह क्या प्रोजेक्ट है') || cleanQuery.includes('यह क्या है')) {
      addAssistantMessage(
        "यह एक इलेक्शन पोर्टल है जिसे सरकारी ऑपरेशन्स के लिए बनाया गया है। इसका बैकएंड लारवेल और फ्रंटएंड रिएक्ट विथ मटेरियल यूआई से बना है। इसके ज़रिए इलेक्शन डेटा जैसे कि पोलिंग स्टेशन्स, कर्मचारी ड्यूटीज़, और यूजर एक्सेस को मैनेज किया जा सकता है।"
      );
      return;
    }

    // 4. Model/Database Queries
    if (cleanQuery.includes('database model') || cleanQuery.includes('models') || cleanQuery.includes('schema') || cleanQuery.includes('database tables') || cleanQuery.includes('डेटाबेस मॉडल') || cleanQuery.includes('टेबल')) {
      addAssistantMessage(
        "इस सिस्टम में कई मुख्य मॉडल्स हैं जैसे कि: MasterEmployee (कर्मचारी डेटा), MasterPollingStation (मतदान केंद्र), CalendarEvent (कैलेंडर कार्यक्रम), User (यूज़र), और अन्य... जैसे कि Country, State, District, City, और Department।"
      );
      return;
    }

    // 5. Help / Greeting Commands
    if (cleanQuery.includes('hello') || cleanQuery.includes('hi') || cleanQuery.includes('hey') || cleanQuery.includes('namaste') || cleanQuery.includes('pranam') || cleanQuery.includes('नमस्ते') || cleanQuery.includes('हेलो')) {
      addAssistantMessage(
        `नमस्ते ${user?.name || ''}! आज मैं आपकी क्या मदद कर सकती हूँ? आप बोल सकते हैं: "कंट्री मास्टर खोलो", "मैं कौन हूँ?" या "यह क्या प्रोजेक्ट है?"`
      );
      return;
    }

    if (cleanQuery.includes('help') || cleanQuery.includes('madad') || cleanQuery.includes('command') || cleanQuery.includes('kya kar sakte ho') || cleanQuery.includes('मदद') || cleanQuery.includes('कमांड')) {
      addAssistantMessage(
        "आप मुझसे इस तरह के कमांड बोल सकते हैं: 'कंट्री मास्टर खोलो', 'पोलिंग स्टेशन दिखाओ', 'मैं कौन हूँ?', 'डेटाबेस मॉडल्स क्या हैं?', या 'यह क्या प्रोजेक्ट है?'।"
      );
      return;
    }

    // Fallback response
    addAssistantMessage(
      `मैंने सुना: "${query}"। इसके बारे में मुझे जानकारी नहीं है। लेकिन मैं इस इलेक्शन पोर्टल के बारे में बता सकती हूँ। आप बोलें: "कंट्री मास्टर खोलो" या "कर्मचारी पेज पर जाओ"।`
    );
  };

  const handleSendMessage = (text: string) => {
    if (!text.trim()) return;
    setMessages((prev) => [...prev, { sender: 'user', text, timestamp: new Date() }]);
    processCommand(text);
    setInputValue('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputValue);
  };

  return (
    <>
      {/* Floating Action Button (FAB) */}
      <Tooltip title="Swara (Election Voice Assistant)" placement="left">
        <Fab
          color="primary"
          aria-label="swara-assistant"
          onClick={() => setIsOpen(!isOpen)}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 2000,
            width: 58,
            height: 58,
            boxShadow: theme.shadows[10],
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            '&:hover': {
              background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
              transform: 'scale(1.08)',
              transition: 'all 0.2s ease-in-out'
            }
          }}
        >
          <AutoAwesomeTwoToneIcon sx={{ fontSize: '1.8rem', color: '#fff' }} />
        </Fab>
      </Tooltip>

      {/* Main Assistant Panel */}
      <Grow in={isOpen} style={{ transformOrigin: 'bottom right' }}>
        <Paper
          elevation={12}
          sx={{
            position: 'fixed',
            bottom: 94,
            right: 24,
            width: { xs: 'calc(100vw - 48px)', sm: 380 },
            height: 500,
            zIndex: 2000,
            borderRadius: 3.5,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            border: `1px solid ${theme.palette.divider}`,
            background: theme.palette.mode === 'dark' 
              ? 'rgba(30, 30, 40, 0.92)' 
              : 'rgba(255, 255, 255, 0.94)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.25)'
          }}
        >
          {/* Header */}
          <Box
            sx={{
              p: 2,
              background: `linear-gradient(90deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
          >
            <Stack direction="row" spacing={1.2} sx={{ alignItems: 'center', flex: 1, minWidth: 0 }}>
              <Avatar
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  width: 34,
                  height: 34,
                  border: '1px solid rgba(255, 255, 255, 0.4)'
                }}
              >
                <AutoAwesomeTwoToneIcon sx={{ color: '#fff', fontSize: '1.25rem' }} />
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.1, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Election Swara
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8, display: 'block', fontSize: '0.68rem' }}>
                  Offline Portal Guide
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
              {/* Real-time Mode toggle pill */}
              <Tooltip title={isHandsFree ? "Real-time Talk toggled ON (Continuous conversation)" : "Turn ON Real-time talk"}>
                <Box
                  onClick={toggleHandsFree}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    px: 1,
                    py: 0.35,
                    borderRadius: 5,
                    border: '1px solid rgba(255, 255, 255, 0.35)',
                    cursor: 'pointer',
                    bgcolor: isHandsFree ? 'rgba(76, 175, 80, 0.3)' : 'rgba(255, 255, 255, 0.08)',
                    '&:hover': {
                      bgcolor: isHandsFree ? 'rgba(76, 175, 80, 0.45)' : 'rgba(255, 255, 255, 0.15)'
                    },
                    transition: 'all 0.2s'
                  }}
                >
                  <Box
                    sx={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      bgcolor: isHandsFree ? '#4caf50' : '#ff9800',
                      boxShadow: isHandsFree ? '0 0 6px #4caf50' : 'none',
                      animation: isHandsFree ? 'glowingDot 1.5s infinite' : 'none',
                      '@keyframes glowingDot': {
                        '0%, 100%': { opacity: 0.5 },
                        '50%': { opacity: 1 }
                      }
                    }}
                  />
                  <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#fff', userSelect: 'none' }}>
                    Real-time
                  </Typography>
                </Box>
              </Tooltip>

              <IconButton
                size="small"
                onClick={() => setIsMuted(!isMuted)}
                sx={{ color: '#fff', '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' }, p: 0.5 }}
              >
                {isMuted ? <VolumeOffIcon sx={{ fontSize: '1.2rem' }} /> : <VolumeUpIcon sx={{ fontSize: '1.2rem' }} />}
              </IconButton>
              
              <IconButton
                size="small"
                onClick={() => setIsOpen(false)}
                sx={{ color: '#fff', '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' }, p: 0.5 }}
              >
                <CloseIcon sx={{ fontSize: '1.2rem' }} />
              </IconButton>
            </Stack>
          </Box>

          {/* Conversation List */}
          <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <List sx={{ p: 0 }}>
              {messages.map((msg, index) => {
                const isUser = msg.sender === 'user';
                return (
                  <ListItem
                    key={index}
                    sx={{
                      p: 0,
                      mb: 1.5,
                      flexDirection: 'column',
                      alignItems: isUser ? 'flex-end' : 'flex-start'
                    }}
                  >
                    <Box
                      sx={{
                        maxWidth: '85%',
                        p: 1.5,
                        borderRadius: isUser ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                        bgcolor: isUser 
                          ? theme.palette.primary.main 
                          : theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100',
                        color: isUser 
                          ? '#fff' 
                          : theme.palette.text.primary,
                        boxShadow: 1
                      }}
                    >
                      <Typography variant="body2" sx={{ wordBreak: 'break-word', whiteSpace: 'pre-line' }}>
                        {msg.text}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.45, mx: 0.5 }}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                  </ListItem>
                );
              })}
              <div ref={chatEndRef} />
            </List>
          </Box>

          {/* Speech Waves Visualizer */}
          {isListening && (
            <Box
              sx={{
                py: 1,
                px: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1.5,
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(30, 30, 30, 0.8)' : 'rgba(240, 240, 240, 0.8)',
                borderTop: `1px dashed ${theme.palette.divider}`,
                borderBottom: `1px dashed ${theme.palette.divider}`
              }}
            >
              <Typography variant="caption" color="primary.main" sx={{ fontWeight: 600, mr: 1 }}>
                {listeningText}
              </Typography>
              {/* CSS Voice Wave Bars */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px', height: '18px' }}>
                {[1, 2, 3, 4, 5].map((bar) => (
                  <Box
                    key={bar}
                    sx={{
                      width: '3px',
                      height: '8px',
                      bgcolor: 'primary.main',
                      borderRadius: '2px',
                      animation: 'pulseWave 1.2s ease-in-out infinite',
                      animationDelay: `${bar * 0.15}s`,
                      '@keyframes pulseWave': {
                        '0%, 100%': { height: '6px' },
                        '50%': { height: '18px' }
                      }
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* Form Input Footer */}
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{
              p: 1.5,
              borderTop: `1px solid ${theme.palette.divider}`,
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(20, 20, 25, 0.5)' : 'rgba(250, 250, 250, 0.8)',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <Tooltip title={isListening ? "सुनना बंद करने के लिए क्लिक करें" : "बोलना शुरू करें"}>
              <IconButton
                color={isListening ? "error" : "primary"}
                onClick={toggleListening}
                sx={{
                  bgcolor: isListening ? 'error.lighter' : 'primary.lighter',
                  '&:hover': {
                    bgcolor: isListening ? 'error.light' : 'primary.light'
                  },
                  width: 44,
                  height: 44,
                  animation: isListening ? 'listeningPulse 1.5s infinite' : 'none',
                  '@keyframes listeningPulse': {
                    '0%': { boxShadow: '0 0 0 0 rgba(211, 47, 47, 0.4)' },
                    '70%': { boxShadow: '0 0 0 10px rgba(211, 47, 47, 0)' },
                    '100%': { boxShadow: '0 0 0 0 rgba(211, 47, 47, 0)' }
                  }
                }}
              >
                {isListening ? <MicOffIcon /> : <MicIcon />}
              </IconButton>
            </Tooltip>
            
            <TextField
              fullWidth
              size="small"
              placeholder="मुझसे कुछ पूछें, जैसे 'कंट्री मास्टर खोलो'"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isListening}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 6,
                  bgcolor: theme.palette.background.paper
                }
              }}
            />

            <IconButton
              type="submit"
              color="primary"
              disabled={!inputValue.trim() || isListening}
              sx={{
                width: 40,
                height: 40,
                bgcolor: inputValue.trim() && !isListening ? 'primary.main' : 'transparent',
                color: inputValue.trim() && !isListening ? '#fff' : 'action.disabled',
                '&:hover': {
                  bgcolor: inputValue.trim() && !isListening ? 'primary.dark' : 'transparent'
                }
              }}
            >
              <SendIcon fontSize="small" />
            </IconButton>
          </Box>
        </Paper>
      </Grow>
    </>
  );
}

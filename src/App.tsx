/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Coins, 
  UserPlus, 
  Users, 
  CheckCircle, 
  Clock, 
  Plus, 
  QrCode, 
  Sparkles,
  Phone,
  Shield,
  Edit2,
  X,
  Check,
  Lock,
  Unlock,
  LogOut,
  Mail,
  User as UserIcon,
  Smartphone,
  Info,
  Calendar,
  Share2,
  Search
} from 'lucide-react';

// Define the interface for the Committee Member
interface Member {
  id: number;
  name: string;
  phone: string;
  email?: string;
  amount: number;
  status: 'Paid' | 'Pending';
  screenshot?: string | null;
  hasWon?: boolean;
  dateAdded?: string;
  allocatedMonth?: number;
}

// Define the interface for the Signed-up Users
interface User {
  name: string;
  email: string;
  phone: string;
  password?: string;
  role: 'member' | 'admin';
  verifyCode?: string | null;
}

export default function App() {
  // --- AUTHENTICATION STATES ---
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('commity_users');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    // Pre-populate with a default Admin for testing ease
    return [
      {
        name: "Hasnain",
        email: "admin@hasnain.com",
        phone: "+92 300 1234567",
        password: "1234",
        role: "admin",
        verifyCode: "HASNAIN786"
      }
    ];
  });
  
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('commity_current_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  
  // Sign Up Form Inputs
  const [suName, setSuName] = useState('');
  const [suEmail, setSuEmail] = useState('');
  const [suPhone, setSuPhone] = useState('');
  const [suPassword, setSuPassword] = useState('');
  const [suRole, setSuRole] = useState<'member' | 'admin'>('member');
  const [suVerifyCode, setSuVerifyCode] = useState(''); // Admin's secret verification code

  // Login Form Inputs
  const [logEmail, setLogEmail] = useState('');
  const [logPassword, setLogPassword] = useState('');

  // --- COMMITTEE STATES ---
  const [members, setMembers] = useState<Member[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState(''); 
  const [memberEmailInput, setMemberEmailInput] = useState('');
  const [amount, setAmount] = useState('');
  const [screenshot, setScreenshot] = useState<string | null>(null);

  // --- DYNAMIC TOTAL & INSTALLMENT LOGIC ---
  const [installmentPerMember, setInstallmentPerMember] = useState<number>(1000);
  const totalPoolAmount = members.length * installmentPerMember;
  const autoInstallmentAmount = installmentPerMember;
  const adminFee = 100;
  const netPayout = totalPoolAmount - adminFee;
  
  // Admin control committee month (Default: Month 1)
  const [currentCommityMonth, setCurrentCommityMonth] = useState<number>(1);
  
  // ایڈمن کا اپنا والٹ جہاں ہر مہینے کے 100 روپے جمع ہوں گے
  const [adminCommission, setAdminCommission] = useState<number>(0);
  
  // For members: code matching to connect to an Admin's database
  const [memberVerifyInput, setMemberVerifyInput] = useState('');
  const [connectedCode, setConnectedCode] = useState<string>(() => {
    return localStorage.getItem('commity_connected_code') || '';
  });

  // Lucky Draw State
  const [winner, setWinner] = useState<Member | null>(null);
  const [isRolling, setIsRolling] = useState(false);

  // Screenshot/Receipt Viewer Popup State
  const [activeReceipt, setActiveReceipt] = useState<Member | null>(null);

  // File Input reference to clear field after submission
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Share Invite States
  const [showShareToast, setShowShareToast] = useState(false);
  const [copiedText, setCopiedText] = useState('');

  // Member status check states
  const [searchName, setSearchName] = useState("");
  const [memberStatus, setMemberStatus] = useState<Member | null>(null);

  // --- DATABASE PERSISTENCE SYNCS ---
  
  // Save all users
  useEffect(() => {
    localStorage.setItem('commity_users', JSON.stringify(users));
  }, [users]);

  // Handle current session changes (loads database context)
  useEffect(() => {
    localStorage.setItem('commity_current_user', JSON.stringify(currentUser));
    
    if (currentUser) {
      if (currentUser.role === 'admin') {
        const savedMembers = localStorage.getItem(`members_${currentUser.email}`);
        if (savedMembers) {
          setMembers(JSON.parse(savedMembers));
        } else {
          // Default initial set for testing
          const initialSet: Member[] = [
            { id: 1, name: "Kamlesh", phone: "+92 300 1112223", amount: 1000, status: "Paid", screenshot: null, hasWon: false },
            { id: 2, name: "Ali", phone: "+92 312 4445556", amount: 1000, status: "Pending", screenshot: null, hasWon: false }
          ];
          setMembers(initialSet);
          localStorage.setItem(`members_${currentUser.email}`, JSON.stringify(initialSet));
        }
        
        const savedInstallment = localStorage.getItem(`installment_per_member_${currentUser.email}`);
        if (savedInstallment) {
          setInstallmentPerMember(parseInt(savedInstallment));
        } else {
          const savedTotal = localStorage.getItem(`total_pool_${currentUser.email}`);
          setInstallmentPerMember(savedTotal ? Math.round(parseInt(savedTotal) / 10) : 1000);
        }
        
        const savedMonth = localStorage.getItem(`current_month_${currentUser.email}`);
        setCurrentCommityMonth(savedMonth ? parseInt(savedMonth) : 1);
        
        const savedComm = localStorage.getItem(`admin_commission_${currentUser.email}`) || localStorage.getItem('commity_admin_commission');
        setAdminCommission(savedComm ? parseInt(savedComm) : 0);
      } else {
        // If logged in as member, check connected admin code
        const code = localStorage.getItem(`connected_code_${currentUser.email}`) || '';
        setConnectedCode(code);
        if (code) {
          const targetAdmin = users.find(u => u.role === 'admin' && u.verifyCode === code);
          if (targetAdmin) {
            const savedMembers = localStorage.getItem(`members_${targetAdmin.email}`);
            setMembers(savedMembers ? JSON.parse(savedMembers) : []);
            
            const savedInstallment = localStorage.getItem(`installment_per_member_${targetAdmin.email}`);
            if (savedInstallment) {
              setInstallmentPerMember(parseInt(savedInstallment));
            } else {
              const savedTotal = localStorage.getItem(`total_pool_${targetAdmin.email}`);
              setInstallmentPerMember(savedTotal ? Math.round(parseInt(savedTotal) / 10) : 1000);
            }
            
            const savedMonth = localStorage.getItem(`current_month_${targetAdmin.email}`);
            setCurrentCommityMonth(savedMonth ? parseInt(savedMonth) : 1);
            
            const savedComm = localStorage.getItem(`admin_commission_${targetAdmin.email}`) || localStorage.getItem('commity_admin_commission');
            setAdminCommission(savedComm ? parseInt(savedComm) : 0);
          } else {
            setMembers([]);
            setInstallmentPerMember(1000);
            setCurrentCommityMonth(1);
            setAdminCommission(0);
          }
        } else {
          setMembers([]);
          setInstallmentPerMember(1000);
          setCurrentCommityMonth(1);
          setAdminCommission(0);
        }
      }
    } else {
      setMembers([]);
      setInstallmentPerMember(1000);
      setCurrentCommityMonth(1);
      setAdminCommission(0);
    }
    setWinner(null);
  }, [currentUser, users]);

  // Sync member list back into browser database (localStorage key per Admin's space)
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'admin') {
        localStorage.setItem(`members_${currentUser.email}`, JSON.stringify(members));
      } else {
        if (connectedCode) {
          const targetAdmin = users.find(u => u.role === 'admin' && u.verifyCode === connectedCode);
          if (targetAdmin) {
            localStorage.setItem(`members_${targetAdmin.email}`, JSON.stringify(members));
          }
        }
      }
    }
  }, [members, currentUser, connectedCode, users]);

  // Sync admin's installment per member and total pool back to browser database
  useEffect(() => {
    if (currentUser && currentUser.role === 'admin') {
      localStorage.setItem(`installment_per_member_${currentUser.email}`, installmentPerMember.toString());
      localStorage.setItem(`total_pool_${currentUser.email}`, totalPoolAmount.toString());
    }
  }, [installmentPerMember, totalPoolAmount, currentUser]);

  // Sync admin's current committee month back to browser database
  useEffect(() => {
    if (currentUser && currentUser.role === 'admin') {
      localStorage.setItem(`current_month_${currentUser.email}`, currentCommityMonth.toString());
    }
  }, [currentCommityMonth, currentUser]);

  // Sync admin's commission back to browser database
  useEffect(() => {
    if (currentUser && currentUser.role === 'admin') {
      localStorage.setItem(`admin_commission_${currentUser.email}`, adminCommission.toString());
      localStorage.setItem('commity_admin_commission', adminCommission.toString());
    }
  }, [adminCommission, currentUser]);

  // --- HANDLERS ---

  // Handle image receipt upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setScreenshot(URL.createObjectURL(file));
    }
  };

  // Profile sign-up handler
  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!suName.trim() || !suEmail.trim() || !suPhone.trim() || !suPassword.trim()) {
      alert("Please fill in all requested fields!");
      return;
    }

    if (users.some(u => u.email.toLowerCase() === suEmail.toLowerCase())) {
      alert("This Email is already registered!");
      return;
    }

    if (suRole === 'admin' && !suVerifyCode.trim()) {
      alert("As a Commity Admin, you must set an access Verification Code for your members!");
      return;
    }

    // Ensure verification code is unique if user is admin
    if (suRole === 'admin') {
      const codeExists = users.some(u => u.role === 'admin' && u.verifyCode?.toUpperCase() === suVerifyCode.toUpperCase());
      if (codeExists) {
        alert("This verification code is already taken. Please choose a different unique code!");
        return;
      }
    }

    const newUser: User = {
      name: suName.trim(),
      email: suEmail.trim().toLowerCase(),
      phone: suPhone.trim(),
      password: suPassword,
      role: suRole,
      verifyCode: suRole === 'admin' ? suVerifyCode.trim().toUpperCase() : null
    };

    setUsers([...users, newUser]);
    alert("🎉 Profile created successfully! Please Login now.");
    setAuthMode('login');

    // Reset signup inputs
    setSuName('');
    setSuEmail('');
    setSuPhone('');
    setSuPassword('');
    setSuVerifyCode('');
  };

  // User Login Handler
  const playWelcomeVoice = () => {
    if ('speechSynthesis' in window) {
      const message = new SpeechSynthesisUtterance("Welcome to Commity App");
      message.lang = 'en-US';
      message.pitch = 1;
      message.rate = 1;
      window.speechSynthesis.speak(message);
    }
  };

  // User Login Handler
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const verifiedUser = users.find(u => u.email.toLowerCase() === logEmail.toLowerCase() && u.password === logPassword);
    
    if (verifiedUser) {
      setCurrentUser(verifiedUser);
      playWelcomeVoice();
      // Reset inputs
      setLogEmail('');
      setLogPassword('');
    } else {
      alert("❌ Invalid Email or Password! Please verify and try again.");
    }
  };

  // Logout handler
  const handleLogout = () => {
    setCurrentUser(null);
    setConnectedCode('');
    setSearchName('');
    setMemberStatus(null);
  };

  // Check member payment status
  const checkStatus = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchName.trim()) {
      alert("براہ کرم اپنا نام درج کریں۔ (Please enter your name.)");
      return;
    }
    const found = members.find(m => m.name.toLowerCase().trim() === searchName.toLowerCase().trim());
    if (found) {
      setMemberStatus(found);
    } else {
      alert(`نام "${searchName}" لسٹ میں نہیں ملا۔ براہ کرم درست نام درج کریں۔ (Name not found in the list. Please enter correct name.)`);
    }
  };

  // Copy customized invite message to clipboard
  const copyInviteLink = () => {
    const appUrl = window.location.origin + window.location.pathname;
    let inviteMsg = `✨ Join HASNAIN COMMITY on the Portal! ✨\n\n🔗 Portal: ${appUrl}`;
    
    if (currentUser?.role === 'admin') {
      inviteMsg += `\n👑 Admin: ${currentUser.name}\n🔑 Join Code: ${currentUser.verifyCode}\n💵 Monthly Installment: Rs. ${installmentPerMember.toLocaleString()}`;
    } else if (connectedCode) {
      inviteMsg += `\n🔑 Join Code: ${connectedCode}`;
      if (connectedAdmin) {
        inviteMsg += `\n👑 Admin: ${connectedAdmin.name}`;
      }
      inviteMsg += `\n💵 Monthly Installment: Rs. ${installmentPerMember.toLocaleString()}`;
    } else {
      inviteMsg += `\n💵 Monthly Installment: Rs. ${installmentPerMember.toLocaleString()}`;
    }
    
    inviteMsg += `\n\nRegister or login to enter the code and participate!`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(inviteMsg).then(() => {
        setCopiedText("Invite message copied to clipboard!");
        setShowShareToast(true);
        setTimeout(() => setShowShareToast(false), 3000);
      }).catch(() => {
        fallbackCopyText(inviteMsg);
      });
    } else {
      fallbackCopyText(inviteMsg);
    }
  };

  const fallbackCopyText = (text: string) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    // Prevent scrolling
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      setCopiedText("Invite message copied to clipboard!");
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 3000);
    } catch (err) {
      alert("Failed to copy invite message. Please copy manually.");
    }
    document.body.removeChild(textArea);
  };

  // Connect to an Admin's committee directly
  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberVerifyInput.trim()) {
      alert("Please specify a verification code!");
      return;
    }

    const inputCode = memberVerifyInput.trim().toUpperCase();
    const targetAdmin = users.find(u => u.role === 'admin' && u.verifyCode === inputCode);
    
    if (targetAdmin) {
      setConnectedCode(inputCode);
      if (currentUser) {
        localStorage.setItem(`connected_code_${currentUser.email}`, inputCode);
      }
      // Load members of that admin immediately
      const savedMembers = localStorage.getItem(`members_${targetAdmin.email}`);
      setMembers(savedMembers ? JSON.parse(savedMembers) : []);

      // Load installment set by target admin immediately
      const savedInstallment = localStorage.getItem(`installment_per_member_${targetAdmin.email}`);
      if (savedInstallment) {
        setInstallmentPerMember(parseInt(savedInstallment));
      } else {
        const savedTotal = localStorage.getItem(`total_pool_${targetAdmin.email}`);
        setInstallmentPerMember(savedTotal ? Math.round(parseInt(savedTotal) / 10) : 1000);
      }

      // Load month set by target admin immediately
      const savedMonth = localStorage.getItem(`current_month_${targetAdmin.email}`);
      setCurrentCommityMonth(savedMonth ? parseInt(savedMonth) : 1);

      // Load commission set by target admin immediately
      const savedComm = localStorage.getItem(`admin_commission_${targetAdmin.email}`) || localStorage.getItem('commity_admin_commission');
      setAdminCommission(savedComm ? parseInt(savedComm) : 0);

      setMemberVerifyInput('');
      alert(`🎉 Connected successfully to '${targetAdmin.name}'s Committee!`);
    } else {
      alert("❌ Verification Code not found! Make sure you entered it correctly or ask your Admin.");
    }
  };

  // Remove connection to Admin's committee
  const handleDisconnect = () => {
    if (confirm("Disconnect from this committee? You won't be able to submit records until you reconnect.")) {
      setConnectedCode('');
      setMembers([]);
      if (currentUser) {
        localStorage.removeItem(`connected_code_${currentUser.email}`);
      }
    }
  };

  // Create or Join Participant
  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !memberEmailInput.trim()) {
      alert("Please fill in Name, Phone number, and Email Address!");
      return;
    }

    if (members.length >= 10) {
      alert("❌ Member Limit Reached! Committee already has 10 members.");
      return;
    }

    // Security Guards when logged in as a Regular Member
    if (currentUser?.role === 'member') {
      if (!connectedCode) {
        alert("Please connect to an Admin's committee first using their secret verification code!");
        return;
      }
    }

    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) + 
                          ' ' + today.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const newMember: Member = {
      id: Date.now(),
      name: name.trim(),
      phone: phone.trim(),
      email: memberEmailInput.trim(),
      amount: autoInstallmentAmount,
      status: screenshot ? "Paid" : "Pending",
      screenshot: screenshot,
      hasWon: false,
      dateAdded: formattedDate,
      allocatedMonth: currentCommityMonth
    };

    setMembers([...members, newMember]);
    setName('');
    setPhone('');
    setMemberEmailInput('');
    setAmount('');
    setScreenshot(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    alert("🎉 Committee Record Added successfully!");
  };

  // Remove Record (Strictly Admin Guard)
  const handleRemoveMember = (id: number) => {
    if (!currentUser || currentUser.role !== 'admin') {
      alert("Access Denied! Strictly restricted to Admin Profile.");
      return;
    }
    setMembers(prev => prev.filter(m => m.id !== id));
    if (winner && winner.id === id) setWinner(null);
    if (activeReceipt && activeReceipt.id === id) setActiveReceipt(null);
  };

  // Toggle Member Status (Strictly Admin Guard)
  const toggleStatus = (id: number) => {
    if (!currentUser || currentUser.role !== 'admin') {
      alert("Access Denied! Strictly restricted to Admin Profile.");
      return;
    }
    setMembers(prev => prev.map(m => {
      if (m.id === id) {
        return {
          ...m,
          status: m.status === 'Paid' ? 'Pending' : 'Paid'
        };
      }
      return m;
    }));
  };

  // Smart Lucky Draw (Strictly Admin Guard)
  const handleLuckyDraw = () => {
    if (!currentUser || currentUser.role !== 'admin') {
      alert("Access Denied! Strictly restricted to Admin Profile.");
      return;
    }

    if (members.length === 0) {
      alert("No members available in the list!");
      return;
    }

    // 1. Check if all members have status 'Paid'
    const anyPendingMember = members.some(member => member.status !== 'Paid');
    
    if (anyPendingMember) {
      alert("❌ Lucky Draw Locked! अभी तक सभी मेंबर्स ने इस महीने के पैसे जमा नहीं करवाए हैं। जब सब का स्टेटस 'Paid' हो जाएगा, तभी पर्ची निकलेगी।");
      return;
    }

    // 2. Filter out eligible members who haven't won yet
    const eligible = members.filter(m => !m.hasWon);
    if (eligible.length === 0) {
      alert("All members in this list have already won!");
      return;
    }

    setIsRolling(true);
    setWinner(null);

    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * eligible.length);
      const chosen = eligible[randomIndex];
      setWinner(chosen);
      setIsRolling(false);

      // Update their victory state and increment commission wallet by Rs 100
      setMembers(prev => prev.map(m => m.id === chosen.id ? { ...m, hasWon: true } : m));
      setAdminCommission(prev => prev + 100);
    }, 1200);
  };

  // Reset Draw (Strictly Admin Guard)
  const handleResetDraws = () => {
    if (!currentUser || currentUser.role !== 'admin') {
      alert("Access Denied! Strictly restricted to Admin Profile.");
      return;
    }
    setMembers(prev => prev.map(m => ({ ...m, hasWon: false })));
    setWinner(null);
  };

  // Start Next Month (یہ فنکشن ایڈمن کے لیے ہے جو نیا مہینہ شروع کرے گا)
  const startNextMonth = () => {
    if (!currentUser || currentUser.role !== 'admin') return;

    // 1. Naya mahina set karein
    const nextMonth = currentCommityMonth + 1;
    setCurrentCommityMonth(nextMonth);
    
    // 2. Sabhi members ka status "Pending" aur screenshots clear karein
    const updatedMembers: Member[] = members.map(m => ({ 
      ...m, 
      status: 'Pending', 
      screenshot: null // Screenshot delete ho jayega taake naya mahina saaf ho
    }));
    
    setMembers(updatedMembers);
    
    // 3. LocalStorage mein turant save karein
    localStorage.setItem(`members_${currentUser.email}`, JSON.stringify(updatedMembers));
    localStorage.setItem(`current_month_${currentUser.email}`, nextMonth.toString());
    localStorage.setItem('commity_current_month', nextMonth.toString());
    
    // 4. Winner ko hata dein
    setWinner(null);
    
    alert(`🚀 Month ${nextMonth} shuru ho gaya hai! Sabhi members ka status Pending ho gaya hai.`);
  };

  // Send Email Reminder helper using mailto
  const sendEmailReminder = (member: Member) => {
    const subject = encodeURIComponent(`🚨 Commity Payment Reminder - Month ${member.allocatedMonth || 1}`);
    const body = encodeURIComponent(`Hello ${member.name},\n\nThis is a reminder that your commity qist of Rs. ${member.amount.toLocaleString()} for Month ${member.allocatedMonth || 1} is currently PENDING.\n\nPlease submit your payment slip on the Hasnain Company portal as soon as possible so we can proceed with the Lucky Draw.\n\nThank you!`);
    window.location.href = `mailto:${member.email || ''}?subject=${subject}&body=${body}`;
  };

  // Calculate dynamic committee information based on loaded members context
  const totalPool = members.reduce((sum, m) => sum + (m.status === 'Paid' ? m.amount : 0), 0);
  const targetPool = members.reduce((sum, m) => sum + m.amount, 0);
  const paidCount = members.filter(m => m.status === 'Paid').length;
  const pendingCount = members.filter(m => m.status === 'Pending').length;

  // Retrieve current active connected Admin
  const connectedAdmin = connectedCode 
    ? users.find(u => u.role === 'admin' && u.verifyCode === connectedCode) 
    : null;

  // Render Authentication screen if session doesn't exist
  if (!currentUser) {
    return (
      <div 
        id="auth_overlay" 
        className="min-h-screen text-slate-100 flex flex-col justify-center items-center p-4 relative"
        style={{
          background: 'radial-gradient(circle at 20% 30%, #2A1B4E 0%, #0B0F19 70%)',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}
      >
        {/* Apple Style Browser bar */}
        <div id="top_browser_bar" className="absolute top-0 left-0 right-0 bg-slate-900/85 backdrop-blur-md border-b border-white/10 px-4 py-3 flex items-center justify-between z-10">
          <div id="apple_window_dots" className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-rose-500 hover:bg-rose-600 transition border border-rose-605/20 shadow-sm cursor-pointer"></div>
            <div className="w-3 h-3 rounded-full bg-amber-500 hover:bg-amber-600 transition border border-amber-605/20 shadow-sm cursor-pointer"></div>
            <div className="w-3 h-3 rounded-full bg-emerald-500 hover:bg-emerald-600 transition border border-emerald-605/20 shadow-sm cursor-pointer"></div>
          </div>
          <span id="bar_url" className="text-xs font-bold text-white tracking-wider flex items-center gap-1.5">
            <span>Hasnain Company Gateway</span>
          </span>
          <div className="w-14"></div>
        </div>

        {/* Portal Entry Card */}
        <div 
          id="hasnain_card" 
          className="p-6 sm:p-8 rounded-[24px] w-full max-w-[480px] mt-20 relative overflow-hidden"
          style={{
            backgroundColor: 'rgba(28, 28, 30, 0.85)',
            backdropFilter: 'blur(30px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 24px 50px rgba(0, 0, 0, 0.7)'
          }}
        >
          {/* Neon Top Line accent */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#007AFF] via-[#BF5AF2] to-[#FF2D55]"></div>

          <div id="welcome_section" className="text-center mb-6">
            <div className="flex justify-center mb-3">
              <svg className="w-20 h-20 shadow-[0_0_20px_rgba(46,125,50,0.45)] rounded-full" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                <circle cx="100" cy="100" r="90" fill="#2E7D32" />
                <text x="50%" y="50%" fontFamily="Arial, sans-serif" fontSize="60" fontWeight="bold" fill="white" textAnchor="middle" dy=".3em">HC</text>
                <text x="50%" y="75%" fontFamily="Arial, sans-serif" fontSize="11" fill="#E8F5E9" textAnchor="middle" fontWeight="bold">HASNAIN COMMITY</text>
              </svg>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight pb-0.5"
                style={{
                  background: 'linear-gradient(135deg, #007AFF 0%, #BF5AF2 50%, #FF2D55 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.5px'
                }}>
              Hasnain Commity Portal
            </h1>
            <p className="text-xs font-semibold tracking-wider mt-1.5" style={{ color: '#8E8E93' }}>
              Create your profile or login to manage chits
            </p>
          </div>

          {authMode === 'login' ? (
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <h3 className="text-sm font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-2">
                <Lock className="w-4 h-4 text-[#007AFF]" />
                <span>🔒 Account Login</span>
              </h3>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-300">Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-slate-500" />
                  </span>
                  <input 
                    type="email" 
                    placeholder="name@email.com" 
                    value={logEmail} 
                    onChange={(e) => setLogEmail(e.target.value)} 
                    className="bg-slate-950 border border-slate-800 hover:border-slate-705 focus:border-[#007AFF] pl-10 pr-4 py-2.5 rounded-xl text-slate-100 text-sm outline-none transition duration-150 w-full"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-300">Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-500" />
                  </span>
                  <input 
                    type="password" 
                    placeholder="Enter account password" 
                    value={logPassword} 
                    onChange={(e) => setLogPassword(e.target.value)} 
                    className="bg-slate-950 border border-slate-800 hover:border-slate-705 focus:border-[#007AFF] pl-10 pr-4 py-2.5 rounded-xl text-slate-100 text-sm outline-none transition duration-150 w-full"
                    required
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="bg-[#007AFF] hover:bg-[#007AFF]/95 text-white font-bold py-3 rounded-xl transition duration-150 mt-2 select-none cursor-pointer text-sm shadow-lg shadow-[#007AFF]/20 flex items-center justify-center gap-2"
              >
                <span>Sign In Securely</span>
              </button>

              <div className="text-center mt-3">
                <p className="text-xs text-[#8E8E93]">
                  New profile? {' '}
                  <button 
                    type="button" 
                    onClick={() => setAuthMode('signup')}
                    className="text-[#007AFF] hover:underline hover:text-white font-semibold transition bg-transparent border-none cursor-pointer outline-none"
                  >
                    Create Profile Here
                  </button>
                </p>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="flex flex-col gap-4 max-h-[450px] overflow-y-auto pr-1">
              <h3 className="text-sm font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-2">
                <UserIcon className="w-4 h-4 text-[#BF5AF2]" />
                <span>👤 Create Profile</span>
              </h3>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-300">Full Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <UserIcon className="h-4 w-4 text-slate-500" />
                  </span>
                  <input 
                    type="text" 
                    placeholder="e.g. Kamlesh Kumar" 
                    value={suName} 
                    onChange={(e) => setSuName(e.target.value)} 
                    className="bg-slate-950 border border-slate-800 focus:border-[#BF5AF2] pl-10 pr-4 py-2.5 rounded-xl text-slate-100 text-sm outline-none transition duration-150 w-full"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-300">Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-slate-500" />
                  </span>
                  <input 
                    type="email" 
                    placeholder="e.g. kamlesh@email.com" 
                    value={suEmail} 
                    onChange={(e) => setSuEmail(e.target.value)} 
                    className="bg-slate-950 border border-slate-800 focus:border-[#BF5AF2] pl-10 pr-4 py-2.5 rounded-xl text-slate-100 text-sm outline-none transition duration-150 w-full"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-300">Phone Number</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Smartphone className="h-4 w-4 text-slate-500" />
                  </span>
                  <input 
                    type="text" 
                    placeholder="e.g. +92 300 0000000" 
                    value={suPhone} 
                    onChange={(e) => setSuPhone(e.target.value)} 
                    className="bg-slate-950 border border-slate-800 focus:border-[#BF5AF2] pl-10 pr-4 py-2.5 rounded-xl text-slate-100 text-sm outline-none transition duration-150 w-full"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-300">Profile Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-500" />
                  </span>
                  <input 
                    type="password" 
                    placeholder="Create security password" 
                    value={suPassword} 
                    onChange={(e) => setSuPassword(e.target.value)} 
                    className="bg-slate-950 border border-slate-800 focus:border-[#BF5AF2] pl-10 pr-4 py-2.5 rounded-xl text-slate-100 text-sm outline-none transition duration-150 w-full"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-300">Profile Account Role</label>
                <select 
                  value={suRole} 
                  onChange={(e) => setSuRole(e.target.value as 'member' | 'admin')} 
                  className="bg-slate-950 border border-slate-800 focus:border-[#BF5AF2] px-4 py-2.5 rounded-xl text-slate-100 text-sm outline-none transition duration-150 w-full cursor-pointer"
                >
                  <option value="member">Regular Member (सिर्फ ज्वाइन करने के लिए)</option>
                  <option value="admin">Commity Admin Holder (कमेटी मालिक/नियंत्रक)</option>
                </select>
              </div>

              {suRole === 'admin' && (
                <div className="border border-dashed border-[#BF5AF2]/35 bg-[#BF5AF2]/5 p-3.5 rounded-xl flex flex-col gap-1.5 transition-all">
                  <label className="text-xs font-bold text-[#BF5AF2] flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5" />
                    <span>🔑 Create Secret Verification Code:</span>
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. HASNAIN786" 
                    value={suVerifyCode} 
                    onChange={(e) => setSuVerifyCode(e.target.value)} 
                    className="bg-slate-950 border border-[#BF5AF2]/30 text-center py-2 text-slate-100 font-black tracking-widest uppercase focus:border-[#BF5AF2] rounded-xl outline-none transition"
                    required
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                    Your members will type this secret verification code to join your committee and view records.
                  </span>
                </div>
              )}

              <button 
                type="submit" 
                className="bg-gradient-to-r from-[#BF5AF2] to-[#FF2D55] text-white font-bold py-3 rounded-xl transition duration-150 mt-2 select-none cursor-pointer text-sm shadow-lg shadow-pink-500/20"
              >
                Register Security Profile
              </button>

              <div className="text-center mt-3">
                <p className="text-xs text-[#8E8E93]">
                  Already have a profile? {' '}
                  <button 
                    type="button" 
                    onClick={() => setAuthMode('login')}
                    className="text-[#007AFF] hover:underline hover:text-white font-semibold transition bg-transparent border-none cursor-pointer outline-none"
                  >
                    Login here
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* Quick Access Account / Credentials Keys */}
          <div className="mt-5 pt-4 border-t border-white/10">
            <h4 className="text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1.5 mb-2.5">
              <QrCode className="w-3.5 h-3.5 text-emerald-400" />
              <span>🔑 Quick Access & Demo Codes</span>
            </h4>
            
            <div className="space-y-2">
              <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-900/60 flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-semibold">👑 Admin Account Credentials</span>
                  <span className="text-emerald-400 font-mono text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">TEST ADMIN</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="bg-slate-900/50 p-1.5 rounded border border-white/5 flex flex-col justify-center">
                    <span className="text-[9px] text-slate-500 uppercase font-sans">Email Address</span>
                    <span className="text-slate-100 font-bold truncate">admin@hasnain.com</span>
                  </div>
                  <div className="bg-slate-900/50 p-1.5 rounded border border-white/5 flex flex-col justify-center">
                    <span className="text-[9px] text-slate-500 uppercase font-sans">Password</span>
                    <span className="text-slate-100 font-bold">1234</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setLogEmail('admin@hasnain.com');
                    setLogPassword('1234');
                  }}
                  className="w-full bg-[#2E7D32] hover:bg-[#256428] active:scale-[0.98] text-white font-bold text-[10px] py-1 px-2.5 rounded-lg transition duration-150 cursor-pointer border-none outline-none text-center"
                >
                  ⚡ Auto-Fill Admin Sign In
                </button>
              </div>

              <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-900/60 flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-semibold">🔑 Active Committee Join Codes</span>
                  <span className="text-cyan-400 font-mono text-[9px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">MEMBERS USE</span>
                </div>
                <div className="space-y-1">
                  {users.filter(u => u.role === 'admin' && u.verifyCode).map((adm, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-slate-900/50 hover:bg-slate-900 px-2 py-1.5 rounded border border-white/5 text-xs">
                      <span className="text-slate-300 font-medium truncate max-w-[150px]">{adm.name}'s Committee:</span>
                      <div className="flex items-center gap-1.5">
                        <code className="text-amber-400 font-mono font-extrabold bg-amber-500/5 px-1 rounded border border-amber-500/10">{adm.verifyCode}</code>
                        <button
                          type="button"
                          onClick={() => {
                            if (navigator.clipboard && navigator.clipboard.writeText) {
                              navigator.clipboard.writeText(adm.verifyCode || '');
                              setCopiedText(`Code "${adm.verifyCode}" copied to clipboard!`);
                              setShowShareToast(true);
                              setTimeout(() => setShowShareToast(false), 2500);
                            }
                          }}
                          className="text-[9px] text-[#007AFF] hover:text-[#007AFF]/80 font-bold bg-[#007AFF]/10 px-1.5 py-0.5 rounded border-none cursor-pointer"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  ))}
                  {users.filter(u => u.role === 'admin' && u.verifyCode).length === 0 && (
                    <span className="text-[10px] text-slate-500 italic block py-0.5">No codes generated. Sign up as Admin to create a new code.</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- MAIN APP COMPONENT SCREEN (IF LOGGED IN) ---
  return (
    <div 
      id="dark_container" 
      className="min-h-screen text-slate-100 flex flex-col justify-center items-center p-4 relative"
      style={{
        background: 'radial-gradient(circle at 20% 30%, #2A1B4E 0%, #0B0F19 70%)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}
    >
      {/* Top Browser Bar with Session Profile and Logout */}
      <div id="top_browser_bar" className="absolute top-0 left-0 right-0 bg-slate-900/85 backdrop-blur-md border-b border-white/10 px-4 py-3 flex items-center justify-between z-10">
        <div id="apple_window_dots" className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-rose-500 border border-rose-605/20"></div>
          <div className="w-3 h-3 rounded-full bg-amber-500 border border-amber-605/20"></div>
          <div className="w-3 h-3 rounded-full bg-emerald-500 border border-emerald-650/20"></div>
        </div>
        
        <span id="bar_url" className="text-xs text-slate-300 tracking-wide flex items-center gap-1.5 font-medium select-text">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Logged in: </span>
          <strong className="text-white font-black">{currentUser.name}</strong>
          <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-cyan-500/15 text-cyan-400 tracking-widest border border-cyan-500/20">
            {currentUser.role}
          </span>
        </span>

        <div>
          <button 
            onClick={handleLogout}
            id="logout_btn"
            className="bg-[#FF3B30]/20 hover:bg-[#FF3B30]/35 text-[#FF3B30] text-[11px] font-bold px-3 py-1.5 rounded-full transition cursor-pointer flex items-center gap-1 border border-transparent outline-none"
          >
            <LogOut className="w-3 h-3" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main card */}
      <div 
        id="hasnain_card" 
        className="p-6 sm:p-8 rounded-[20px] w-full max-w-[530px] mt-20 relative overflow-hidden"
        style={{
          backgroundColor: 'rgba(28, 28, 30, 0.85)',
          backdropFilter: 'blur(30px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)'
        }}
      >
        {/* Decorative Top glow line */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-[2px] bg-gradient-to-r from-transparent via-[#BF5AF2] to-transparent"></div>

        {/* Branding header banner */}
        <div id="welcome_section" className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <svg className="w-20 h-20 shadow-[0_0_20px_rgba(46,125,50,0.45)] rounded-full" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
              <circle cx="100" cy="100" r="90" fill="#2E7D32" />
              <text x="50%" y="50%" fontFamily="Arial, sans-serif" fontSize="60" fontWeight="bold" fill="white" textAnchor="middle" dy=".3em">HC</text>
              <text x="50%" y="75%" fontFamily="Arial, sans-serif" fontSize="11" fill="#E8F5E9" textAnchor="middle" fontWeight="bold">HASNAIN COMMITY</text>
            </svg>
          </div>
          <h1 id="welcome_heading" 
              className="text-2xl sm:text-3xl font-bold tracking-tight pb-0.5"
              style={{
                background: 'linear-gradient(135deg, #007AFF 0%, #BF5AF2 50%, #FF2D55 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.5px'
              }}>
            Hasnain Commity Hub
          </h1>
          <p id="subheading" className="text-xs font-semibold tracking-wider mt-1.5" style={{ color: '#8E8E93' }}>
            <span>Premium Multi-Profile Edition</span>
          </p>
        </div>

        {/* Multi-Profile context Box */}
        {currentUser.role === 'admin' ? (
          <div 
            id="admin_box" 
            className="rounded-[14px] p-4.5 mb-5 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(191, 90, 242, 0.15) 0%, rgba(0, 122, 255, 0.05) 100%)',
              border: '1px solid rgba(191, 90, 242, 0.3)',
              marginBottom: '15px'
            }}
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#BF5AF2]/5 via-transparent to-transparent pointer-events-none"></div>
            <h4 id="admin_title" className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 mb-2.5" style={{ color: '#BF5AF2' }}>
              <Shield className="w-4 h-4 shrink-0" />
              <span>👑 Admin Control & Settings</span>
            </h4>
            
            {/* 💰 لائیو اور محفوظ ایڈمن کمیشن اکاؤنٹ بکس */}
            <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl mb-3.5 shadow-inner" id="admin_commission_wallet">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <span className="text-xs sm:text-sm font-bold text-slate-300 flex items-center gap-1.5">
                  <Coins className="w-4.5 h-4.5 text-amber-400 shrink-0" />
                  <span>💼 Total Admin Commission Wallet (ایڈمن کمیشن والٹ):</span>
                </span>
                {/* یہ بکس اب صرف بیلنس دکھائے گا، کوئی بھی اسے ایڈٹ نہیں کر سکتا */}
                <div className="bg-[#FFD60A] text-slate-950 px-4 py-1.5 rounded-lg font-black font-mono text-base shadow-lg shrink-0" style={{ boxShadow: '0 2px 8px rgba(255, 214, 10, 0.3)' }}>
                  Rs. {adminCommission.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="space-y-1.5 text-xs sm:text-sm my-3">
              <p className="text-slate-300 flex items-center gap-2">
                <span className="text-[#AEAEB2] font-semibold w-24">Admin Name:</span> 
                <strong className="text-white font-bold">{currentUser.name}</strong>
              </p>
              <p className="text-slate-300 flex items-center gap-2">
                <span className="text-[#AEAEB2] font-semibold w-24">Phone Number:</span> 
                <strong className="text-slate-200 font-mono">{currentUser.phone}</strong>
              </p>
              <p className="text-slate-300 flex items-center gap-2">
                <span className="text-[#AEAEB2] font-semibold w-24">Verification Code:</span> 
                <span className="text-[#36C759] font-black font-mono tracking-widest bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded shrink-0">
                  {currentUser.verifyCode}
                </span>
              </p>
            </div>
            
            <div className="mt-3.5 pt-3.5 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-300">Monthly Installment (قسط فی ممبر):</label>
                <input 
                  type="number" 
                  value={installmentPerMember} 
                  onChange={(e) => setInstallmentPerMember(Math.max(0, parseInt(e.target.value) || 0))} 
                  className="bg-slate-950 border border-slate-800 hover:border-slate-700/80 focus:border-[#BF5AF2] px-3 py-2 rounded-lg text-slate-100 text-sm font-mono outline-none transition w-full"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-200">Active Timeline Month:</label>
                <div className="relative w-full">
                  <select 
                    value={currentCommityMonth} 
                    onChange={(e) => setCurrentCommityMonth(parseInt(e.target.value) || 1)} 
                    className="bg-slate-950 border border-slate-800 hover:border-slate-700/80 focus:border-[#BF5AF2] pl-3 pr-8 py-2 rounded-lg text-slate-100 text-sm outline-none transition w-full cursor-pointer appearance-none"
                  >
                    {[...Array(12)].map((_, i) => (
                      <option key={i+1} value={i+1}>Month {i+1}</option>
                    ))}
                  </select>
                  <Calendar className="w-4 h-4 text-[#BF5AF2] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* 📊 Commity Automatic Details Panel */}
            <div className="mt-3.5 p-3 rounded-xl bg-slate-950/60 border border-slate-900/80 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Members</span>
                <strong className="text-slate-100 font-mono font-black text-sm">{members.length}</strong>
              </div>
              <div className="flex flex-col gap-1 border-x border-white/5">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Pool (Automatic)</span>
                <strong className="text-cyan-400 font-mono font-black text-sm">Rs. {totalPoolAmount.toLocaleString()}</strong>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Payout to Winner</span>
                <strong className="text-emerald-400 font-mono font-black text-sm">Rs. {netPayout.toLocaleString()}</strong>
              </div>
            </div>

            {/* 📤 Invite Friends Action */}
            <button
              type="button"
              onClick={copyInviteLink}
              className="mt-3 w-full bg-[#2E7D32] hover:bg-[#256428] active:scale-[0.99] text-white font-extrabold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-150 shadow-md cursor-pointer border-none outline-none"
            >
              <Share2 className="w-4 h-4 text-white animate-pulse" />
              <span>📤 Invite Friends / Copy Invite Details (انویٹیشن لنک کاپی کریں)</span>
            </button>
            
            <div className="mt-4 pt-3 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="text-xs flex flex-wrap gap-x-3.5 gap-y-1.5 text-slate-400">
                <p>قسط: <b className="text-cyan-400 font-mono font-bold">Rs. {autoInstallmentAmount.toLocaleString()}</b></p>
                <span className="text-slate-700 hidden sm:inline">|</span>
                <p>موجودہ ٹائم لائن: <b className="text-[#BF5AF2] font-mono font-bold">Month {currentCommityMonth}</b></p>
                <span className="text-slate-700 hidden sm:inline">|</span>
                <p>Collection Status: <b className="text-emerald-400 font-bold">{paidCount} / {members.length} Paid</b></p>
              </div>

              <button
                type="button"
                onClick={startNextMonth}
                className="text-white font-extrabold text-[11px] px-4 py-2 rounded-lg transition duration-150 cursor-pointer shadow-lg active:scale-98 flex items-center justify-center gap-1.5 shrink-0 outline-none border-none"
                style={{
                  background: 'linear-gradient(135deg, #BF5AF2 0%, #007AFF 100%)'
                }}
              >
                <span>🚀 Start Next Month (اگلا مہینہ)</span>
              </button>
            </div>
          </div>
        ) : (
          <div 
            id="member_connection_panel" 
            className="rounded-[14px] p-4.5 mb-5 relative overflow-hidden"
            style={{
              background: connectedCode 
                ? 'linear-gradient(135deg, rgba(52, 199, 89, 0.1) 0%, rgba(0, 122, 255, 0.03) 100%)' 
                : 'linear-gradient(135deg, rgba(255, 214, 10, 0.1) 0%, rgba(255, 45, 85, 0.02) 100%)',
              border: connectedCode 
                ? '1px solid rgba(52, 199, 89, 0.25)' 
                : '1px solid rgba(255, 214, 10, 0.25)',
              marginBottom: '15px'
            }}
          >
            {connectedCode && connectedAdmin ? (
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 mb-2.5 text-emerald-400">
                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>🌍 Connected to Active Committee</span>
                </h4>
                <div className="space-y-1 text-xs sm:text-sm">
                  <p className="text-slate-350 flex items-center gap-2">
                    <span className="text-[#AEAEB2] font-semibold w-28">Committee Owner:</span> 
                    <strong className="text-white font-bold">{connectedAdmin.name}</strong>
                  </p>
                  <p className="text-slate-350 flex items-center gap-2">
                    <span className="text-[#AEAEB2] font-semibold w-28">Admin Phone:</span> 
                    <strong className="text-slate-200 font-mono">{connectedAdmin.phone}</strong>
                  </p>
                  <p className="text-slate-350 flex items-center gap-2">
                    <span className="text-[#AEAEB2] font-semibold w-28">Connected Code:</span> 
                    <span className="text-emerald-400 font-black font-mono tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded text-xs">
                      {connectedCode}
                    </span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={copyInviteLink}
                  className="mt-3 w-full bg-[#2E7D32] hover:bg-[#256428] active:scale-[0.99] text-white font-extrabold text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition duration-150 shadow-md cursor-pointer border-none outline-none"
                >
                  <Share2 className="w-3.5 h-3.5 text-white animate-pulse" />
                  <span>📤 Invite Friends / Copy Invite Details</span>
                </button>
                <div className="mt-3 pt-2.5 border-t border-white/5 flex justify-end">
                  <button 
                    onClick={handleDisconnect}
                    className="text-[11px] font-bold text-red-400 hover:text-red-300 transition duration-150 bg-transparent border-none outline-none cursor-pointer"
                  >
                    Disconnect Committee
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleConnect} className="space-y-2.5">
                <h4 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 text-amber-400">
                  <Lock className="w-3.5 h-3.5 shrink-0" />
                  <span>🔒 Connect to a Committee Database</span>
                </h4>
                <p className="text-xs text-slate-400 leading-normal">
                  You are currently offline. Please enter your Admin's secret Verification Code to load their active committee list and submit payments.
                </p>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Enter Secret Code (e.g. HASNAIN786)" 
                    value={memberVerifyInput}
                    onChange={(e) => setMemberVerifyInput(e.target.value)}
                    className="bg-slate-950 border border-slate-800 focus:border-amber-400 px-3 py-2 text-xs text-center font-bold tracking-widest uppercase rounded-lg outline-none transition w-full"
                    required
                  />
                  <button 
                    type="submit"
                    className="bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black px-4 py-2 rounded-lg transition duration-150 shrink-0 cursor-pointer"
                  >
                    Connect
                  </button>
                </div>

                {/* Quick Join Codes helper badges */}
                <div className="mt-3 pt-2.5 border-t border-white/5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <QrCode className="w-3.5 h-3.5 text-amber-500" />
                    <span>Available Codes (بٹن دبائیں اور کوڈ بھریں):</span>
                  </span>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {users.filter(u => u.role === 'admin' && u.verifyCode).map((adm, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setMemberVerifyInput(adm.verifyCode || '')}
                        className="bg-slate-950/90 border border-slate-800 hover:border-amber-400/50 text-[11px] text-amber-300 font-bold py-1 px-2.5 rounded-lg flex items-center gap-1.5 transition duration-150 cursor-pointer text-left"
                        title={`Click to fill: ${adm.verifyCode}`}
                      >
                        <span className="text-white/60 font-sans font-normal text-[10px]">{adm.name}:</span>
                        <code className="text-amber-400 font-mono tracking-wider font-extrabold">{adm.verifyCode}</code>
                      </button>
                    ))}
                    {users.filter(u => u.role === 'admin' && u.verifyCode).length === 0 && (
                      <span className="text-[10px] text-slate-500 italic">No admin codes generated yet.</span>
                    )}
                  </div>
                </div>
              </form>
            )}
          </div>
        )}

        {/* --- LUCKY CHIT / DRAW SECTION (ONLY FUNCTIONAL & VISIBLE TO ACTIVE ADMINS) --- */}
        {currentUser.role === 'admin' ? (
          <div 
            id="lucky_draw_box" 
            className="rounded-[14px] p-4.5 mb-6 shadow-md relative overflow-hidden text-center transition-all duration-300"
            style={{
              background: (members.length === 0 || members.some(m => m.status !== 'Paid'))
                ? 'linear-gradient(135deg, rgba(255, 59, 48, 0.08) 0%, rgba(191, 90, 242, 0.04) 100%)'
                : 'linear-gradient(135deg, rgba(52, 199, 89, 0.08) 0%, rgba(0, 122, 255, 0.04) 100%)',
              border: (members.length === 0 || members.some(m => m.status !== 'Paid'))
                ? '1px solid rgba(255, 59, 48, 0.3)'
                : '1px solid rgba(52, 199, 89, 0.3)',
              marginBottom: '15px'
            }}
          >
            <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-[#FF2D55]/5 via-transparent to-transparent pointer-events-none"></div>
            
            {/* Absolute Month Tag */}
            <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-[#BF5AF2]/15 border border-[#BF5AF2]/25 px-2 py-0.5 rounded-full text-[9px] font-bold text-[#BF5AF2] uppercase tracking-wider select-none">
              <Calendar className="w-3 h-3 text-[#BF5AF2] shrink-0" />
              <span>Month {currentCommityMonth}</span>
            </div>

            <h4 
              id="draw_title" 
              className="text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 mb-1"
              style={{ color: (members.length === 0 || members.some(m => m.status !== 'Paid')) ? '#FF3B30' : '#34C759' }}
            >
              <Sparkles className="w-4 h-4 text-[#BF5AF2] animate-pulse" />
              <span>🎟️ Lucky Chit System (पર્ચી باکس)</span>
            </h4>
            <p id="draw_desc" className="text-xs text-[#AEAEB2] mb-3 max-w-sm mx-auto">
              Once a member wins, they are excluded from next draws but remain to pay monthly.
            </p>

            {/* स्टेटस बार कि ड्रा खुला है या बंद */}
            <div className="mb-4">
              {members.length === 0 || members.some(m => m.status !== 'Paid') ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FF3B30]/10 border border-[#FF3B30]/25 text-[#FF3B30] text-[11px] font-bold select-none uppercase tracking-wide">
                  <Lock className="w-3 h-3 text-[#FF3B30] shrink-0" />
                  <span>🔒 DRAW LOCKED: सब मेंबर्स के पैसे आने पर ही खुलेगा।</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#34C759]/10 border border-[#34C759]/25 text-[#34C759] text-[11px] font-bold select-none uppercase tracking-wide">
                  <Unlock className="w-3 h-3 text-[#34C759] shrink-0 animate-pulse" />
                  <span>🔓 DRAW UNLOCKED: सभी मेंबर्स ने पैसे दे दिए हैं!</span>
                </div>
              )}
            </div>
            
            <button 
              type="button" 
              onClick={handleLuckyDraw} 
              id="drop_pick_btn"
              style={{
                background: isRolling 
                  ? '#8E8E93' 
                  : (members.length === 0 || members.some(m => m.status !== 'Paid'))
                    ? '#48484A'
                    : 'linear-gradient(135deg, #FF2D55 0%, #BF5AF2 100%)',
                color: '#FFFFFF'
              }}
              disabled={isRolling}
              className="w-full text-xs sm:text-sm font-bold py-2.5 px-4 rounded-xl transition duration-150 select-none cursor-pointer shadow-lg shadow-pink-500/10 hover:shadow-pink-500/25 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 outline-none border-none"
            >
              {isRolling ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin text-white"></span>
                  <span>🗳️ Shuffling Chits...</span>
                </>
              ) : (
                <>
                  <span>🎰 Drop & Pick Lucky Chit</span>
                </>
              )}
            </button>

            {/* Winner Display Area */}
            {winner && (
              <div 
                id="winner_display" 
                className="mt-4 p-4 rounded-xl border border-dashed border-[#BF5AF2]/30 animate-fade-in text-center flex flex-col items-center justify-center gap-1.5"
                style={{
                  background: 'rgba(28, 28, 30, 0.6)'
                }}
              >
                <span id="winner_label" className="text-[10px] font-black tracking-widest text-[#BF5AF2] uppercase block mb-1">
                  🎉 WINNER OF MONTH {currentCommityMonth} 🎉
                </span>
                <h2 
                  id="winner_name" 
                  className="text-xl font-extrabold"
                  style={{
                    background: 'linear-gradient(135deg, #007AFF, #BF5AF2, #FF2D55)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}
                >
                  {winner.name}
                </h2>
                <p id="winner_contact_info" className="text-xs text-[#AEAEB2] font-mono mt-1 flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5">
                  <span>📞 {winner.phone}</span>
                  {winner.email && (
                    <>
                      <span className="text-slate-600">|</span>
                      <span>✉️ {winner.email}</span>
                    </>
                  )}
                </p>

                {/* 📸 ونر کی پیمنٹ سلپ دیکھنے کے لیے نیا بٹن */}
                {winner.screenshot ? (
                  <div className="my-2.5 shrink-0">
                    <button 
                      type="button" 
                      onClick={() => setActiveReceipt(winner)} 
                      className="bg-[#007AFF] hover:bg-[#007AFF]/90 hover:scale-102 active:scale-98 text-white border-none rounded-lg px-3.5 py-1.5 text-xs font-bold transition duration-150 cursor-pointer shadow-lg shadow-[#007AFF]/15 flex items-center justify-center gap-1.5 outline-none"
                    >
                      <span>📄 View Attached Slip (پیمنٹ کا ثبوت)</span>
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-red-400 italic my-2">⚠️ No payment slip found for this member.</p>
                )}

                <div className="w-full max-w-xs mt-2 p-2.5 rounded-lg bg-slate-950/60 border border-slate-850 text-left text-xs space-y-1">
                  <p className="flex justify-between items-center text-slate-300">
                    <span>Total Pool:</span>
                    <strong className="font-mono text-white font-bold">Rs. {totalPoolAmount.toLocaleString()}</strong>
                  </p>
                  <p className="flex justify-between items-center text-red-400">
                    <span>Admin Fee Cut (Saved to Wallet):</span>
                    <strong className="font-mono font-bold">- Rs. 100</strong>
                  </p>
                  <div className="border-t border-dashed border-white/10 pt-1.5 mt-1.5 flex justify-between items-center text-emerald-400 font-bold">
                    <span>Net Payout to Member:</span>
                    <span className="font-mono font-black text-sm">Rs. {netPayout.toLocaleString()}</span>
                  </div>
                </div>

                <small className="text-[#34C759] font-bold block mt-1.5 text-[11px] leading-tight flex items-center justify-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 animate-pulse text-[#34C759]" />
                  <span>✓ Locked out from subsequent draws!</span>
                </small>
              </div>
            )}

            {members.some(m => m.hasWon) && (
              <button
                type="button"
                onClick={handleResetDraws}
                id="reset_draws_btn"
                className="mt-3 text-[11px] text-[#AEAEB2] hover:text-white underline transition bg-transparent border-none cursor-pointer outline-none block mx-auto font-medium"
              >
                🔄 Reset Draw Cycle (Start Over)
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4 mb-4" id="member_dashboard_container">
            {winner && (
              <div 
                id="member_winner_info" 
                className="rounded-[14px] p-4 text-center border"
                style={{
                  background: 'linear-gradient(135deg, rgba(52, 199, 89, 0.15) 0%, rgba(28, 28, 30, 0.8) 100%)',
                  borderColor: 'rgba(52, 199, 89, 0.3)'
                }}
              >
                <span className="text-[10px] font-black tracking-widest text-[#34C759] uppercase block mb-1">
                  🏆 RECENT LUCKY DRAW WINNER OF MONTH {currentCommityMonth} 🏆
                </span>
                <h3 className="text-lg font-extrabold text-white">{winner.name}</h3>
                <p className="text-xs text-slate-350 mt-0.5 font-mono flex flex-wrap items-center justify-center gap-1.5">
                  <span>📞 {winner.phone}</span>
                  {winner.email && (
                    <>
                      <span className="text-slate-600">|</span>
                      <span>✉️ {winner.email}</span>
                    </>
                  )}
                </p>

                {/* 📸 ونر کی پیمنٹ سلپ دیکھنے کے لیے نیا بٹن */}
                {winner.screenshot ? (
                  <div className="my-2.5">
                    <button 
                      type="button" 
                      onClick={() => setActiveReceipt(winner)} 
                      className="bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-555 border border-emerald-500/20 rounded-lg px-3.5 py-1.5 text-xs font-bold transition duration-150 cursor-pointer shadow-lg flex items-center justify-center gap-1.5 mx-auto outline-none"
                    >
                      <span>📄 View Attached Slip (پیمنٹ کا ثبوت)</span>
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-red-400 italic my-2">⚠️ No payment slip found for this member.</p>
                )}

                <div className="w-full max-w-xs mt-2.5 mx-auto p-3 rounded-lg bg-slate-950/60 border border-slate-900 text-left text-xs space-y-1">
                  <p className="flex justify-between items-center text-slate-350">
                    <span>Total Pool:</span>
                    <strong className="font-mono text-white">Rs. {totalPoolAmount.toLocaleString()}</strong>
                  </p>
                  <p className="flex justify-between items-center text-red-400 font-medium">
                    <span>Admin Fee Cut (Saved to Wallet):</span>
                    <strong className="font-mono font-bold">- Rs. 100</strong>
                  </p>
                  <div className="border-t border-dashed border-white/10 pt-1.5 mt-1.5 flex justify-between items-center text-emerald-400 font-bold">
                    <span>Net Payout to Member:</span>
                    <span className="font-mono font-black text-sm">Rs. {netPayout.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}
            
            {connectedCode && (
              <div 
                id="member_dashboard_info"
                className="rounded-[14px] p-4.5 border text-center relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(0, 122, 255, 0.12) 0%, rgba(28, 28, 30, 0.85) 100%)',
                  borderColor: 'rgba(0, 122, 255, 0.3)'
                }}
              >
                <div className="absolute top-2.5 right-2 text-[9px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20 uppercase tracking-widest">
                  صرف ممبر کا ویو (User View)
                </div>
                
                <h3 className="text-base sm:text-lg font-black tracking-tight text-white mb-3 text-left flex items-center gap-2">
                  <Info className="w-4 h-4 text-[#007AFF]" />
                  <span>Welcome to Commity</span>
                </h3>

                <div 
                  className="bg-slate-950/70 rounded-xl p-3.5 border border-white/5 space-y-2 text-left text-xs text-slate-300 mb-3"
                  id="infoCard"
                >
                  <p className="flex items-center justify-between">
                    <span className="font-semibold text-slate-400 flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                      <b>Admin Contact:</b>
                    </span>
                    <strong className="text-white font-mono">{connectedAdmin?.phone || "0300-1234567"}</strong>
                  </p>
                  
                  <p className="flex items-center justify-between border-t border-white/5 pt-2">
                    <span className="font-semibold text-slate-400 flex items-center gap-1.5">
                      <Coins className="w-3.5 h-3.5 text-amber-400" />
                      <b>Total Commity Pool:</b>
                    </span>
                    <strong className="text-emerald-400 font-mono font-bold">Rs. {totalPoolAmount.toLocaleString()}</strong>
                  </p>

                  <div className="border-t border-dashed border-white/10 pt-2 text-center">
                    <p className="text-[10px] text-slate-400 italic">
                      <i>Note: Please contact Admin for further details.</i>
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5 text-amber-400" />
                    <span>👑 Admin Commission Wallet (ایڈمن والٹ):</span>
                  </span>
                  <strong className="text-amber-400 font-mono font-bold">Rs. {adminCommission.toLocaleString()}</strong>
                </div>

                {/* 🔍 Check My Payment Status Section (ممبر کے لیے اپنا سٹیٹس دیکھنے والا سیکشن) */}
                <div className="mt-4 pt-4 border-t border-white/10 text-left">
                  <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wide flex items-center gap-1.5 mb-2">
                    <Search className="w-3.5 h-3.5 text-amber-400" />
                    <span>Check My Payment Status (سٹیٹس چیک کریں)</span>
                  </h4>
                  
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={searchName}
                      placeholder="Enter Your Name..." 
                      onChange={(e) => setSearchName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          checkStatus();
                        }
                      }}
                      className="flex-1 text-[11px] bg-slate-950/90 border border-slate-800 focus:border-amber-400/50 text-slate-100 font-medium py-1.5 px-3 rounded-xl transition duration-150 outline-none"
                    />
                    <button 
                      type="button"
                      onClick={() => checkStatus()}
                      className="bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-slate-950 font-black text-[11.5px] py-1.5 px-3 rounded-xl transition duration-150 cursor-pointer border-none outline-none text-center"
                    >
                      Check Details
                    </button>
                  </div>

                  {memberStatus && (
                    <div className="mt-3 p-3 bg-slate-950/80 rounded-xl border border-slate-900/65 text-xs space-y-1.5 relative animate-fade-in">
                      <button 
                        type="button" 
                        onClick={() => setMemberStatus(null)}
                        className="absolute top-2 right-2 text-slate-500 hover:text-slate-300 bg-transparent border-none cursor-pointer p-0"
                        title="Close details"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      
                      <p className="flex justify-between items-center text-slate-300">
                        <span className="font-semibold text-slate-400">Name:</span>
                        <strong className="text-white">{memberStatus.name}</strong>
                      </p>
                      
                      <p className="flex justify-between items-center text-slate-300">
                        <span className="font-semibold text-slate-400">Phone:</span>
                        <strong className="text-slate-200 font-mono text-[11px]">{memberStatus.phone}</strong>
                      </p>

                      <p className="flex justify-between items-center text-slate-300">
                        <span className="font-semibold text-slate-400">Paid Amount:</span>
                        <strong className="text-white font-mono text-xs">
                          Rs. {memberStatus.amount.toLocaleString()}
                        </strong>
                      </p>

                      {memberStatus.allocatedMonth && (
                        <p className="flex justify-between items-center text-slate-300">
                          <span className="font-semibold text-slate-400">Assigned Month:</span>
                          <strong className="text-cyan-400 font-mono font-bold">Month {memberStatus.allocatedMonth}</strong>
                        </p>
                      )}

                      <p className="flex justify-between items-center pt-1 border-t border-white/5">
                        <span className="font-semibold text-slate-400">Status:</span>
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase flex items-center gap-1 ${
                          memberStatus.status === "Paid" 
                            ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" 
                            : "bg-amber-500/10 border border-amber-500/20 text-amber-400 animate-pulse"
                        }`}>
                          {memberStatus.status === "Paid" ? "✅ Paid" : "⏳ Pending"}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- Stats Display Bento Grid --- */}
        <div id="stats_grid" className="grid grid-cols-2 gap-3.5 mb-6">
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Collected Pool</span>
            <div>
              <p className="text-lg font-black text-white font-mono mt-1">Rs. {totalPool.toLocaleString()}</p>
              <span className="text-[10px] text-slate-400 block mt-0.5">Target: Rs. {targetPool.toLocaleString()}</span>
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Clearances</span>
            <div>
              <p className="text-lg font-bold text-white font-mono mt-1">
                {paidCount} <span className="font-normal text-slate-600">/</span> {members.length}
              </p>
              <span className="text-[10px] text-amber-400 block mt-0.5 font-medium">{pendingCount} Accounts Pending</span>
            </div>
          </div>
        </div>

        {/* Form Container (Only render form if connected or admin) */}
        {(currentUser.role === 'admin' || connectedCode) ? (
          members.length < 10 ? (
            <form onSubmit={handleAddMember} id="member_contribution_form" className="flex flex-col gap-4">
              <h3 className="text-sm font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800/50 pb-2">
                <UserPlus className="w-4 h-4 text-cyan-400" />
                <span>{currentUser.role === 'admin' ? `Register New Member (${members.length}/10)` : "Submit Your payment details"}</span>
              </h3>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-300">Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Kamlesh" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-slate-950 border border-slate-800 focus:border-cyan-500/80 placeholder:text-slate-600 rounded-xl py-2.5 px-4 text-slate-100 text-sm outline-none transition duration-150 w-full"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-300">Phone Number</label>
                <input 
                  type="text" 
                  placeholder="e.g. +92 300 1112223" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="bg-slate-950 border border-slate-800 focus:border-cyan-500/80 placeholder:text-slate-600 rounded-xl py-2.5 px-4 text-slate-100 text-sm outline-none transition duration-150 w-full"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-300">Email Address</label>
                <input 
                  type="email" 
                  placeholder="e.g. member@email.com" 
                  value={memberEmailInput}
                  onChange={(e) => setMemberEmailInput(e.target.value)}
                  className="bg-slate-950 border border-slate-800 focus:border-cyan-500/80 placeholder:text-slate-600 rounded-xl py-2.5 px-4 text-slate-100 text-sm outline-none transition duration-150 w-full"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5" id="auto_amount_group">
                <label className="text-xs font-bold text-slate-300">Monthly Amount (Auto-Calculated)</label>
                <input 
                  type="text" 
                  value={`Rs. ${autoInstallmentAmount.toLocaleString()}`}
                  className="border border-slate-800 text-[#0A84FF] font-black font-mono text-sm rounded-xl py-2.5 px-4 outline-none w-full select-none"
                  disabled 
                  style={{ backgroundColor: 'rgba(10, 132, 255, 0.05)' }}
                />
              </div>

              {/* Receipt Uploader */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>Receipt Screenshot (Optional)</span>
                  {screenshot && (
                    <button 
                      type="button" 
                      onClick={() => setScreenshot(null)} 
                      className="text-red-400 hover:text-red-300 text-xs font-bold flex items-center gap-1 bg-transparent border-none outline-none cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Clear Image</span>
                    </button>
                  )}
                </label>
                <div className="flex flex-col gap-2">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleFileChange}
                    ref={fileInputRef}
                    className="hidden"
                  />
                  {!screenshot ? (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-slate-950/60 hover:bg-slate-950 border-2 border-dashed border-slate-800 hover:border-[#BF5AF2]/50 rounded-xl py-4 px-4 text-slate-450 hover:text-slate-200 text-xs sm:text-sm font-medium transition duration-150 flex flex-col items-center justify-center gap-2 cursor-pointer"
                    >
                      <QrCode className="w-6 h-6 text-[#BF5AF2] shrink-0" />
                      <span>Click to upload slip or receipt snapshot</span>
                    </button>
                  ) : (
                    <div className="bg-slate-950/80 border border-emerald-500/30 rounded-xl p-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <img 
                          src={screenshot} 
                          alt="Receipt Preview" 
                          className="w-10 h-10 rounded-lg object-cover bg-slate-900 border border-slate-800 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 leading-tight">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Slip uploaded!
                          </span>
                          <span className="text-[11px] text-slate-500 leading-tight">Status will be marked paid immediately on submit</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <button 
                type="submit" 
                className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black py-3 rounded-xl transition mt-1 select-none cursor-pointer text-sm font-bold shadow-lg shadow-cyan-500/15 flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5 stroke-[2.5]" />
                <span>{currentUser.role === 'admin' ? 'Add Member To List' : 'Send Slip To Admin'}</span>
              </button>
            </form>
          ) : (
            <div className="border border-emerald-500/25 bg-emerald-500/5 rounded-xl p-4 text-center" style={{ borderColor: '#34C759' }}>
              <CheckCircle className="w-6 h-6 text-[#34C759] mx-auto mb-2" />
              <h4 className="text-sm font-bold text-[#34C759]">✅ Member Limit Reached (10/10)</h4>
              <p className="text-xs text-slate-400 mt-1">
                کمیٹی مکمل ہو چکی ہے، اب کوئی نیا ممبر ایڈ نہیں کیا جا سکتا۔
              </p>
            </div>
          )
        ) : (
          <div className="border border-amber-500/30 bg-amber-500/5 rounded-xl p-4 text-center">
            <Info className="w-6 h-6 text-amber-400 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-amber-400">Database Blocked</h4>
            <p className="text-xs text-slate-400 mt-1">
              Please enter an Admin Code in the panel above to connect to an active committee.
            </p>
          </div>
        )}

        <hr id="form_divider" className="border-0 border-t border-slate-800/80 my-5" />

        {/* --- Committee Members List --- */}
        <div id="members_list_section" className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 id="section_title" className="text-sm font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-4 h-4 text-cyan-400" />
              <span>Committee Participants ({members.length})</span>
            </h3>
            {currentUser.role === 'admin' && (
              <span className="text-[10px] text-slate-500 font-mono">Click status badge to toggle pay status</span>
            )}
          </div>

          <div id="list_container" className="flex flex-col gap-2.5 max-h-76 overflow-y-auto pr-1">
            {members.length === 0 ? (
              <div id="empty_list_state" className="text-center py-8 bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
                <Users className="w-8 h-8 mx-auto text-slate-650 mb-2 stroke-1 text-slate-600" />
                <p className="text-xs text-slate-500 font-medium">No committee accounts registered yet.</p>
              </div>
            ) : (
              members.map((member) => (
                <div 
                  key={member.id} 
                  id={`member_row_${member.id}`}
                  className="bg-slate-950/60 hover:bg-slate-950/90 border border-slate-800/60 hover:border-slate-800 py-3.5 px-4 rounded-xl flex justify-between items-center gap-4 transition duration-150 group"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-800 border border-slate-705 flex-shrink-0 mt-1.5"></div>
                    <div className="flex flex-col">
                      <span 
                        id={`member_name_${member.id}`} 
                        className="font-bold text-sm sm:text-base text-slate-200 leading-tight flex items-center gap-1.5"
                      >
                        <span>{member.name}</span>
                        {member.hasWon && (
                          <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase flex items-center gap-0.5 shrink-0 select-none">
                            🏆 Won
                          </span>
                        )}
                        {member.screenshot && (
                          <button
                            type="button"
                            onClick={() => setActiveReceipt(member)}
                            id={`member_receipt_btn_${member.id}`}
                            className="bg-purple-500/20 hover:bg-purple-500/35 border border-[#BF5AF2]/30 rounded px-1.5 py-0.5 text-[9px] text-[#BF5AF2] font-bold tracking-wider uppercase transition flex items-center gap-0.5 cursor-pointer outline-none"
                            title="View uploaded payment receipt slip"
                          >
                            <QrCode className="w-2.5 h-2.5 text-[#BF5AF2]" />
                            <span>Slip Available</span>
                          </button>
                        )}
                      </span>
                      <span className="text-xs text-slate-400 font-mono flex flex-wrap items-center gap-x-1.5 gap-y-0.5 mt-0.5" id={`member_phone_display_${member.id}`}>
                        <span className="flex items-center gap-1 shrink-0">
                          <Phone className="w-3 h-3 text-slate-500 shrink-0" />
                          <span>{member.phone}</span>
                        </span>
                        {member.email && (
                          <>
                            <span className="text-slate-600 hidden sm:inline">|</span>
                            <span className="flex items-center gap-1 overflow-hidden shrink-0">
                              <Mail className="h-3 w-3 text-slate-500" />
                              <span className="truncate max-w-[160px]" title={member.email}>{member.email}</span>
                            </span>
                          </>
                        )}
                      </span>
                      <span className="text-[11px] text-slate-550 font-medium flex flex-wrap items-center gap-x-1.5 gap-y-0.5 mt-1.5">
                        <Calendar className="w-3 h-3 text-slate-600 shrink-0" />
                        <span>{member.dateAdded || "Just now"}</span>
                        <span className="text-slate-700 hidden sm:inline">•</span>
                        <span className="text-purple-400 font-extrabold bg-purple-500/10 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider">Month {member.allocatedMonth || 1}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3">
                    <span 
                      id={`member_amount_${member.id}`} 
                      className="text-cyan-400 font-extrabold font-mono text-xs sm:text-sm whitespace-nowrap"
                    >
                      Rs. {member.amount.toLocaleString()}
                    </span>
                    
                    {/* Send manual email reminder alert (Admin only, if status is Pending) */}
                    {currentUser.role === 'admin' && member.status === 'Pending' && (
                      <button
                        type="button"
                        onClick={() => sendEmailReminder(member)}
                        className="bg-amber-400/10 hover:bg-amber-400/25 text-amber-400 border border-amber-400/25 text-[11px] font-bold px-2.5 py-1 rounded-full transition cursor-pointer flex items-center justify-center gap-1 outline-none shrink-0"
                        title="Send email qist reminder to this member"
                      >
                        <Mail className="w-3.5 h-3.5 text-amber-400" />
                        <span>Alert</span>
                      </button>
                    )}

                    {/* Status badge - clickable only for Admin */}
                    <button
                      onClick={() => toggleStatus(member.id)}
                      disabled={currentUser.role !== 'admin'}
                      id={`member_status_btn_${member.id}`}
                      className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full text-white select-none transition ${currentUser.role === 'admin' ? 'cursor-pointer hover:opacity-90 active:scale-95 duration-100' : 'cursor-default'} outline-none flex items-center gap-1 min-w-[76px] justify-center`}
                      style={{
                        backgroundColor: member.status === 'Paid' ? '#34C759' : '#FF3B30'
                      }}
                      title={currentUser.role === 'admin' ? "Click to toggle payment clearance status" : "Clearance Status"}
                    >
                      {member.status === 'Paid' ? (
                        <>
                          <CheckCircle className="w-3 h-3 stroke-[3]" />
                          <span>Paid</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3 stroke-[2.5]" />
                          <span>Pending</span>
                        </>
                      )}
                    </button>

                    {/* Delete record - strictly Admin only */}
                    {currentUser.role === 'admin' && (
                      <button 
                        type="button"
                        onClick={() => handleRemoveMember(member.id)} 
                        id={`member_delete_${member.id}`}
                        style={{
                          backgroundColor: 'rgba(255, 59, 48, 0.15)',
                          color: '#FF3B30',
                          border: 'none',
                          padding: '6px 14px',
                          borderRadius: '20px',
                          fontSize: '11px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s ease',
                          outline: 'none'
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255, 59, 48, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255, 59, 48, 0.15)';
                        }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* --- Apple Style Screenshot Preview Popup / Modal --- */}
      {activeReceipt && (
        <div 
          id="receipt_modal_overlay"
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-all duration-300"
          onClick={() => setActiveReceipt(null)}
        >
          <div 
            id="receipt_modal_win"
            className="bg-[#1C1C1E] border border-white/10 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl relative animate-scale-up"
            style={{
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] text-[#BF5AF2] font-semibold uppercase tracking-widest leading-none mb-1">Committee Receipt</span>
                <h4 className="text-sm font-bold text-white leading-tight">{activeReceipt.name}'s Payment Slip</h4>
              </div>
              <button 
                onClick={() => setActiveReceipt(null)}
                className="bg-white/5 hover:bg-white/10 p-1.5 rounded-full transition cursor-pointer bg-transparent border-none outline-none text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Receipt Image */}
            <div className="p-4 bg-black/30 flex items-center justify-center min-h-[250px] relative">
              {activeReceipt.screenshot ? (
                <img 
                  src={activeReceipt.screenshot} 
                  alt="Payment screenshot" 
                  className="max-h-80 w-auto rounded-lg border border-white/5 object-contain"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <QrCode className="w-12 h-12 text-slate-600 mx-auto mb-2 stroke-1 animate-pulse" />
                  <p className="text-xs">No screenshot available for this receipt.</p>
                </div>
              )}
            </div>

            {/* Details Footer */}
            <div className="p-4 bg-[#1C1C1E] border-t border-white/10 space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Paid amount:</span>
                <span className="font-bold text-cyan-400 font-mono">Rs. {activeReceipt.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Phone:</span>
                <span className="text-slate-200 font-mono">{activeReceipt.phone}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Share Toast Notification */}
      {showShareToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#2E7D32] border border-white/25 px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 transition-all duration-300 transform animate-bounce">
          <CheckCircle className="w-5 h-5 text-white" />
          <span className="text-white text-xs font-bold font-sans">{copiedText}</span>
        </div>
      )}
    </div>
  );
}

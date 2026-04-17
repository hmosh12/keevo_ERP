import React, { useState, useEffect } from 'react';
import { cn } from './lib/utils';
import { auth, db, googleProvider, signInWithPopup } from './firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, collection, query, where } from 'firebase/firestore';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import Accounting from './components/Accounting';
import POS from './components/POS';
import Contacts from './components/Contacts';
import Expenses from './components/Expenses';
import Returns from './components/Returns';
import Damaged from './components/Damaged';
import Settings from './components/Settings';
import LandingPage from './components/LandingPage';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, UserPlus, ShieldCheck, Globe, ArrowRight } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isRTL, setIsRTL] = useState(true); // Default to Arabic for Keevo
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [products, setProducts] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [returns, setReturns] = useState<any[]>([]);
  const [damagedItems, setDamagedItems] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [isTrialExpired, setIsTrialExpired] = useState(false);
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null);
  const [currencySettings, setCurrencySettings] = useState({
    baseCurrency: 'USD',
    rates: {
      USD: 1,
      SAR: 3.75,
      AED: 3.67,
      EGP: 48.50,
      IQD: 1310.00
    }
  });

  const [companyInfo, setCompanyInfo] = useState<any>({
    name: 'Keevo Trading Co.',
    logo: 'https://picsum.photos/seed/keevo/200/200',
    deliveryNumber: '+966 50 123 4567',
    address: 'King Fahd Road, Riyadh, Saudi Arabia',
    email: 'contact@keevo.com',
    website: 'www.keevo.com'
  });

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // First check if doc exists, if not create it
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
          const newUser = {
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName || 'User',
            email: firebaseUser.email,
            role: 'admin',
            companyId: firebaseUser.uid
          };
          await setDoc(userDocRef, newUser);
        }

        // Setup real-time listener for user profile
        const unsubscribeUser = onSnapshot(doc(db, 'users', firebaseUser.uid), (docSnap) => {
          if (docSnap.exists()) {
            setUser(docSnap.data());
          }
        });

        // Cleanup user listener when auth changes
        return () => unsubscribeUser();
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  // Real-time data syncing
  useEffect(() => {
    if (!user?.companyId) return;

    // Sync Company Info
    const unsubscribeCompany = onSnapshot(doc(db, 'companies', user.companyId), (docSnap) => {
      if (docSnap.exists()) {
        setCompanyInfo(docSnap.data());
      } else if (user.role === 'admin') {
        // Initialize company if it doesn't exist
        setDoc(doc(db, 'companies', user.companyId), {
          ...companyInfo,
          ownerId: user.uid,
          createdAt: new Date().toISOString(),
          isSubscribed: false,
          licenseStatus: 'trial'
        });
      }
    });

    // Sync Products
    const unsubscribeProducts = onSnapshot(collection(db, 'companies', user.companyId, 'products'), (snapshot) => {
      const productsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (productsData.length > 0) setProducts(productsData);
    });

    // Sync Contacts
    const unsubscribeContacts = onSnapshot(collection(db, 'companies', user.companyId, 'contacts'), (snapshot) => {
      const contactsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setContacts(contactsData);
    });

    // Sync Expenses
    const unsubscribeExpenses = onSnapshot(collection(db, 'companies', user.companyId, 'expenses'), (snapshot) => {
      const expensesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setExpenses(expensesData);
    });

    // Sync Returns
    const unsubscribeReturns = onSnapshot(collection(db, 'companies', user.companyId, 'returns'), (snapshot) => {
      const returnsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReturns(returnsData);
    });

    // Sync Damaged Items
    const unsubscribeDamaged = onSnapshot(collection(db, 'companies', user.companyId, 'damaged_items'), (snapshot) => {
      const damagedData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDamagedItems(damagedData);
    });

    // Sync Staff (Users in the same company)
    const unsubscribeStaff = onSnapshot(
      query(collection(db, 'users'), where('companyId', '==', user.companyId)),
      (snapshot) => {
        setStaff(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    );

    return () => {
      unsubscribeCompany();
      unsubscribeProducts();
      unsubscribeContacts();
      unsubscribeExpenses();
      unsubscribeReturns();
      unsubscribeDamaged();
      unsubscribeStaff();
    };
  }, [user?.companyId]);

  // Sync Trial Status
  useEffect(() => {
    if (!companyInfo?.createdAt) return;

    // If already subscribed or status is active, bypass trial logic
    if (companyInfo.isSubscribed === true || companyInfo.licenseStatus === 'active') {
      setIsTrialExpired(false);
      setTrialDaysLeft(null);
      return;
    }

    const createdAt = new Date(companyInfo.createdAt);
    const expiryDate = new Date(createdAt);
    expiryDate.setMonth(expiryDate.getMonth() + 1);
    expiryDate.setDate(expiryDate.getDate() + 3);

    const now = new Date();
    const expired = now > expiryDate;
    setIsTrialExpired(expired);

    // Calculate days left
    const diffTime = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    setTrialDaysLeft(expired ? 0 : diffDays);
  }, [companyInfo?.createdAt]);

  const handleAuth = async () => {
    setError('');
    try {
      if (authMode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;
        
        // Initialize company and user doc
        const companyId = firebaseUser.uid;
        await setDoc(doc(db, 'companies', companyId), {
          name: companyName || 'My Company',
          ownerId: firebaseUser.uid,
          createdAt: new Date().toISOString(),
          isSubscribed: false,
          licenseStatus: 'trial'
        });

        await setDoc(doc(db, 'users', firebaseUser.uid), {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: email.split('@')[0],
          role: 'admin',
          companyId: companyId,
          createdAt: new Date().toISOString()
        });
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleGoogleAuth = async () => {
    setError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      
      // Check if user doc exists
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        // Initialize company and user doc for new Google user
        const companyId = firebaseUser.uid;
        await setDoc(doc(db, 'companies', companyId), {
          name: firebaseUser.displayName ? `${firebaseUser.displayName}'s Company` : 'My Company',
          ownerId: firebaseUser.uid,
          createdAt: new Date().toISOString(),
          isSubscribed: false,
          licenseStatus: 'trial'
        });

        await setDoc(userDocRef, {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          role: 'admin',
          companyId: companyId,
          createdAt: new Date().toISOString()
        });
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const updateCompanyInfo = async (newInfo: any) => {
    if (!user?.companyId) return;
    try {
      await setDoc(doc(db, 'companies', user.companyId), newInfo, { merge: true });
    } catch (err) {
      console.error('Error updating company info:', err);
    }
  };

  const logout = () => signOut(auth);

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-950">
        <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4" />
        <p className="text-white font-black tracking-widest uppercase text-xs animate-pulse">KEEVO ERP</p>
      </div>
    );
  }

  // Pre-auth Landing & Auth Flow
  if (!user) {
    if (!showAuth) {
      return (
        <LandingPage 
          isRTL={isRTL} 
          onGetStarted={() => {
            setAuthMode('register');
            setShowAuth(true);
          }}
          onLogin={() => {
            setAuthMode('login');
            setShowAuth(true);
          }}
        />
      );
    }

    return (
      <div className={cn(
        "min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden",
        isRTL ? "font-['Cairo']" : "font-sans"
      )} dir={isRTL ? "rtl" : "ltr"}>
        {/* Background Decorative Blurs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-indigo-600/10 blur-[120px] rounded-full -z-10" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-sky-600/5 blur-[100px] rounded-full -z-10" />

        <button 
          onClick={() => setShowAuth(false)}
          className="absolute top-8 left-8 rtl:right-8 rtl:left-auto text-slate-400 hover:text-white flex items-center gap-2 font-bold px-4 py-2 bg-white/5 border border-white/10 rounded-xl transition-all"
        >
          <ArrowRight size={18} className={cn("rotate-180", isRTL && "rotate-0")} />
          <span>{isRTL ? 'العودة' : 'Back'}</span>
        </button>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg"
        >
          <div className="bg-white rounded-[40px] shadow-2xl p-8 md:p-12 relative overflow-hidden">
            <div className="text-center mb-10">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-3xl flex items-center justify-center text-white font-black text-3xl shadow-xl shadow-indigo-200 mx-auto mb-6 transform rotate-3">
                K
              </div>
              <h1 className="text-3xl font-black text-slate-800 mb-2">
                {authMode === 'login' ? (isRTL ? 'أهلاً بك مجدداً' : 'Welcome Back') : (isRTL ? 'ابدأ رحلة النجاح' : 'Start Success Journey')}
              </h1>
              <p className="text-slate-500 font-medium">
                {authMode === 'login' 
                  ? (isRTL ? 'قم بتسجيل الدخول لمتابعة أعمالك' : 'Sign in to continue your business')
                  : (isRTL ? 'انضم إلى KEEVO وقم بإدارة تجارتك بذكاء' : 'Join KEEVO and manage your trade smartly')}
              </p>
            </div>

            <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8">
              <button 
                onClick={() => setAuthMode('login')}
                className={cn(
                  "flex-1 py-3 rounded-xl text-sm font-black transition-all",
                  authMode === 'login' ? "bg-white text-indigo-600 shadow-md" : "text-slate-500 hover:text-slate-700"
                )}
              >
                {isRTL ? 'دخول' : 'Login'}
              </button>
              <button 
                onClick={() => setAuthMode('register')}
                className={cn(
                  "flex-1 py-3 rounded-xl text-sm font-black transition-all",
                  authMode === 'register' ? "bg-white text-indigo-600 shadow-md" : "text-slate-500 hover:text-slate-700"
                )}
              >
                {isRTL ? 'تسجيل' : 'Register'}
              </button>
            </div>

            <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); handleAuth(); }}>
              {error && (
                <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 text-sm rounded-2xl font-bold">
                  {error}
                </div>
              )}
              
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  {isRTL ? 'البريد الإلكتروني' : 'Email Address'}
                </label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  placeholder="admin@keevo.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  {isRTL ? 'كلمة المرور' : 'Password'}
                </label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
              
              {authMode === 'register' && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    {isRTL ? 'اسم الشركة' : 'Company Name'}
                  </label>
                  <input 
                    type="text" 
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    placeholder={isRTL ? 'شركة كيفو التجارية' : 'Keevo Trading Co.'}
                    required
                  />
                </div>
              )}

              <button 
                type="submit"
                className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 mt-4"
              >
                {authMode === 'login' ? <LogIn size={20} /> : <UserPlus size={20} />}
                {authMode === 'login' ? (isRTL ? 'دخول' : 'Sign In') : (isRTL ? 'إنشاء الحساب' : 'Create Account')}
              </button>

              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-slate-500">{isRTL ? 'أو عبر' : 'Or continue with'}</span>
                </div>
              </div>

              <button 
                type="button"
                onClick={handleGoogleAuth}
                className="w-full bg-white text-slate-700 py-3.5 rounded-xl font-bold border border-slate-200 shadow-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-3"
              >
                <Globe size={20} className="text-indigo-600" />
                <span>{isRTL ? 'الدخول عبر جوجل' : 'Sign in with Google'}</span>
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
              <p className="text-slate-400 text-xs">
                {isRTL ? 'بالمتابعة، أنت توافق على شروط الخدمة' : 'By continuing, you agree to our Terms of Service'}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard isRTL={isRTL} />;
      case 'inventory':
        return <Inventory isRTL={isRTL} products={products} user={user} />;
      case 'accounting':
        return <Accounting user={user} isRTL={isRTL} currencySettings={currencySettings} setCurrencySettings={setCurrencySettings} />;
      case 'pos':
        return <POS isRTL={isRTL} products={products} currencySettings={currencySettings} contacts={contacts} companyInfo={companyInfo} user={user} />;
      case 'contacts':
        return <Contacts isRTL={isRTL} products={products} currencySettings={currencySettings} contacts={contacts} user={user} />;
      case 'expenses':
        return <Expenses isRTL={isRTL} user={user} expenses={expenses} />;
      case 'returns':
        return <Returns isRTL={isRTL} user={user} returns={returns} />;
      case 'damaged':
        return <Damaged isRTL={isRTL} products={products} user={user} damagedItems={damagedItems} />;
      case 'settings':
        return <Settings isRTL={isRTL} companyInfo={companyInfo} setCompanyInfo={updateCompanyInfo} user={user} staff={staff} />;
      default:
        return <Dashboard isRTL={isRTL} />;
    }
  };

  return (
    <>
      <Layout 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isRTL={isRTL} 
        setIsRTL={setIsRTL}
        user={user}
        companyInfo={companyInfo}
        logout={logout}
      >
        {renderContent()}
      </Layout>

      {/* Trial Status Toast (Optional - shows countdown if not expired) */}
      {!isTrialExpired && trialDaysLeft !== null && trialDaysLeft <= 7 && (
        <div className={cn(
          "fixed bottom-24 bg-amber-50 border border-amber-200 p-3 rounded-xl shadow-lg z-50 animate-in fade-in slide-in-from-bottom-5",
          isRTL ? "right-8" : "left-8"
        )}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
              <ShieldCheck size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-900 leading-none">
                {isRTL ? 'انتهاء الفترة التجريبية قريباً' : 'Trial Ending Soon'}
              </p>
              <p className="text-[10px] text-amber-700 mt-1">
                {isRTL 
                  ? `بقي ${trialDaysLeft} أيام على انتهاء اشتراكك` 
                  : `${trialDaysLeft} days remaining on your trial`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Trial Over Overlay */}
      <AnimatePresence>
        {isTrialExpired && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[9999] flex items-center justify-center p-6 text-center"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="max-w-md w-full bg-white rounded-[32px] p-10 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-rose-500 to-indigo-600" />
              
              <div className="w-24 h-24 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
                <ShieldCheck size={48} />
              </div>

              <h2 className="text-3xl font-bold text-slate-800 mb-4">
                {isRTL ? 'انتهت الفترة التجريبية' : 'Trial Period Expired'}
              </h2>
              
              <p className="text-slate-500 mb-8 leading-relaxed">
                {isRTL 
                  ? 'نشكرك على تجربة كيفو ERP. لقد انتهت صلاحية الفترة التجريبية (شهر و3 أيام). يرجى التواصل مع الدعم لتفعيل اشتراكك الكامل.'
                  : 'Thank you for trying Keevo ERP. Your trial period (1 month and 3 days) has ended. Please contact support to activate your full subscription.'}
              </p>

              <div className="space-y-3">
                <button className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all">
                  {isRTL ? 'تفعيل الاشتراك' : 'Activate Subscription'}
                </button>
                <button 
                  onClick={logout}
                  className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                >
                  {isRTL ? 'تسجيل الخروج' : 'Log Out'}
                </button>
              </div>

              <p className="mt-8 text-xs text-slate-400 font-medium">
                {isRTL ? 'لديك استفسار؟' : 'Have questions?'} 
                <span className="text-indigo-600 ml-1 cursor-pointer">support@keevo.com</span>
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

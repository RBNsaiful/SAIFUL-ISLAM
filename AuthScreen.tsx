import React, { useState, FC, FormEvent, useEffect, ChangeEvent } from 'react';
import { DEFAULT_AVATAR_URL } from '../constants';
import { auth, db, googleProvider } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, signInWithPopup } from 'firebase/auth';
import { ref, set, get, query, orderByChild, equalTo } from 'firebase/database';

interface AuthScreenProps {
  texts: any;
  appName: string;
  logoUrl: string;
}

const EyeIcon: FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
);

const EyeOffIcon: FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
);

const UserIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>);
const MailIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0 1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>);
const LockIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>);
const UsersIcon: FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>);
const GoogleIcon: FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className={className}>
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
    </svg>
);
const Spinner: FC = () => (<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>);

const AuthScreen: FC<AuthScreenProps> = ({ texts, appName, logoUrl }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [authErrorType, setAuthErrorType] = useState<'config' | 'user' | null>(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    setEmail('');
    setName('');
    setPassword('');
    setConfirmPassword('');
    setError('');
    setAuthErrorType(null);
  }, [isLogin]);

  useEffect(() => {
    let isValid = false;
    if (isLogin) {
      isValid = email.trim() !== '' && password.length >= 6;
    } else {
      isValid = email.trim() !== '' && name.trim() !== '' && password.length >= 6 && confirmPassword.length >= 6;
    }
    setIsFormValid(isValid);
    
    if (!isLogin && confirmPassword && password !== confirmPassword) {
      setError(texts.passwordsDoNotMatch);
    } else {
      setError('');
    }
  }, [email, name, password, confirmPassword, isLogin, texts.passwordsDoNotMatch]);
  
  const handleInputFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    setTimeout(() => {
      event.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  };

  const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      if (/^[a-zA-Z\s]*$/.test(val) && val.length <= 15) {
          setName(val);
      }
  };

  // --- GOOGLE QUICK LOGIN HANDLER ---
  const handleGoogleLogin = async () => {
    if (loading) return;
    setLoading(true);
    setError('');

    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        
        // Check if user exists in our DB
        const userRef = ref(db, 'users/' + user.uid);
        const snapshot = await get(userRef);

        if (!snapshot.exists()) {
            // New User Registration via Google
            await set(userRef, {
                name: user.displayName || 'User',
                email: user.email,
                balance: 0,
                avatarUrl: user.photoURL || DEFAULT_AVATAR_URL,
                totalAdsWatched: 0,
                totalEarned: 0,
                uid: user.uid,
                referralCode: user.uid, // Use UID as own code
                referredBy: null, // NO REFERRAL DURING SIGNUP
                isReferralRewardClaimed: false
            });
        }
        // If exists, do nothing, onAuthStateChanged in App.tsx handles the rest
    } catch (err: any) {
        console.error("Google Auth Error:", err);
        // Improved Error Handling for Configuration Issues
        if (err.code === 'auth/unauthorized-domain') {
             setError("⚠️ Domain not authorized. Go to Firebase Console > Authentication > Settings > Authorized Domains and add this website's URL.");
        } else if (err.code === 'auth/popup-closed-by-user') {
             setError("Sign-in cancelled.");
        } else {
             setError(err.message);
        }
    } finally {
        setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isFormValid || loading) return;
    setError('');
    setAuthErrorType(null);

    if (!isLogin) {
        if (name.trim().length < 6 || name.trim().length > 15) {
            setError("Invalid name");
            return;
        }
        if (password !== confirmPassword) {
            setError(texts.passwordsDoNotMatch);
            return;
        }
    }

    setLoading(true);

    try {
        if (isLogin) {
            await signInWithEmailAndPassword(auth, email, password);
        } else {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            await updateProfile(user, { displayName: name, photoURL: DEFAULT_AVATAR_URL });

            await set(ref(db, 'users/' + user.uid), {
                name: name,
                email: email,
                balance: 0, 
                avatarUrl: DEFAULT_AVATAR_URL,
                totalAdsWatched: 0,
                totalEarned: 0,
                uid: user.uid,
                referralCode: user.uid, // Use UID as own code
                referredBy: null, // NO REFERRAL DURING SIGNUP
                isReferralRewardClaimed: false
            });
        }
    } catch (err: any) {
        console.error("Auth Error:", err);
        let msg = "An error occurred: " + (err.message || err.code);
        let type: 'config' | 'user' | null = 'user';
        
        // Map specific error codes to user-friendly messages
        if (err.code === 'auth/email-already-in-use') msg = "Email already in use.";
        else if (err.code === 'auth/invalid-email') msg = "Invalid email address.";
        else if (err.code === 'auth/weak-password') msg = "Password: use at least 6 characters";
        else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') msg = "Invalid email or password.";
        else if (err.code === 'auth/network-request-failed') msg = "Network error. Please check your connection.";
        
        // Configuration Errors (Firebase Console)
        else if (err.code === 'auth/operation-not-allowed') {
            msg = "Email/Password sign-in is NOT enabled.";
            type = 'config';
        }
        else if (err.code === 'PERMISSION_DENIED') {
            msg = "Database permission denied. Check Rules.";
            type = 'config';
        }
        
        else if (err.code === 'auth/too-many-requests') msg = "Too many attempts. Please try again later.";

        setError(msg);
        setAuthErrorType(type);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="w-full animate-fade-in bg-light-card dark:bg-dark-card p-8 rounded-2xl shadow-lg">
      <div className="flex flex-col items-center mb-4">
        <img src={logoUrl} alt="App Logo" className="w-24 h-24 object-contain mb-4 rounded-full shadow-lg border-4 border-primary/10 dark:border-primary/30" />
        <h1 className="text-4xl font-extrabold text-center text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary drop-shadow-[0_2px_2px_rgba(0,0,0,0.2)] dark:drop-shadow-[0_2px_5px_rgba(124,58,237,0.3)]">
            {appName}
        </h1>
      </div>
      <h2 className="text-xl font-semibold text-center text-light-text dark:text-dark-text mb-8">
        {isLogin ? texts.loginTitle : texts.registerTitle}
      </h2>
      
      {authErrorType === 'config' && (
          <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg text-xs text-yellow-800 dark:text-yellow-200">
              <strong>Setup Required:</strong>
              <ul className="list-disc pl-4 mt-1 space-y-1">
                  <li>Go to Firebase Console &gt; Authentication</li>
                  <li>Enable "Email/Password" and "Google" provider</li>
              </ul>
          </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {!isLogin && (
          <div>
            <label className="text-sm font-medium">{texts.name}</label>
            <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={handleNameChange}
                  onFocus={handleInputFocus}
                  placeholder="Full Name"
                  required
                  className="w-full p-3 pl-10 bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
            </div>
          </div>
        )}
        <div>
          <label className="text-sm font-medium">{texts.email}</label>
           <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <MailIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={handleInputFocus}
                    placeholder="Email"
                    required
                    className="w-full p-3 pl-10 bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
            </div>
        </div>
        <div>
          <label className="text-sm font-medium">{texts.password}</label>
          <div className="relative mt-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <LockIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={handleInputFocus}
              placeholder="Password"
              required
              className="w-full p-3 pl-10 bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOffIcon className="w-5 h-5"/> : <EyeIcon className="w-5 h-5"/>}
            </button>
          </div>
        </div>
        {!isLogin && (
           <>
            <div>
                <label className="text-sm font-medium">{texts.confirmPassword}</label>
                <div className="relative mt-1">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <LockIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onFocus={handleInputFocus}
                    placeholder="Confirm Password"
                    required
                    className="w-full p-3 pl-10 bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400"
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                    >
                    {showConfirmPassword ? <EyeOffIcon className="w-5 h-5"/> : <EyeIcon className="w-5 h-5"/>}
                    </button>
                </div>
            </div>
          </>
        )}
        {error && <p className="text-red-500 text-sm text-center font-medium">{error}</p>}
        <button
          type="submit"
          disabled={!isFormValid || loading}
          className="w-full bg-gradient-to-r from-primary to-secondary text-white font-bold py-3 rounded-lg hover:opacity-90 transition-opacity duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
        >
          {loading ? <Spinner /> : (isLogin ? texts.login : texts.register)}
        </button>
      </form>

      {/* GOOGLE LOGIN DIVIDER & BUTTON */}
      <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-light-card dark:bg-dark-card text-gray-500">OR</span>
          </div>
      </div>

      <button
          onClick={handleGoogleLogin}
          type="button"
          disabled={loading}
          className="w-full bg-white dark:bg-gray-800 text-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 font-bold py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-3 shadow-sm"
      >
          <GoogleIcon className="w-5 h-5" />
          <span>Continue with Google</span>
      </button>

      <p className="text-center text-sm mt-6">
        {isLogin ? texts.noAccount : texts.haveAccount}{' '}
        <button onClick={() => setIsLogin(!isLogin)} className="text-primary font-semibold">
          {isLogin ? texts.register : texts.login}
        </button>
      </p>
    </div>
  );
};

export default AuthScreen;
import React, { useState } from 'react';
import { 
  HiEnvelope, 
  HiLockClosed, 
  HiEye, 
  HiEyeSlash, 
  HiKey 
} from 'react-icons/hi2';

interface ValidationErrors {
  general?: string;
  email?: string[];
  password?: string[];
  code?: string[];
  [key: string]: any;
}

function Login() {
  // Gestion de l'étape : 'login' ou 'otp'
  const [step, setStep] = useState<'login' | 'otp'>('login');

  // Champs de formulaires
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');

  // Visibilité du mot de passe
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // États UI
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [successMessage, setSuccessMessage] = useState<string>('');

  // 1. ÉTAPE 1 : Validation Identifiants -> Envoi OTP
  const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setSuccessMessage('');

    try {
      await fetch('http://localhost:8000/sanctum/csrf-cookie', {
        method: 'GET',
        credentials: 'include',
      });

      const response = await fetch('http://localhost:8000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.status) {
        if (data.errors) {
          setErrors(data.errors);
        } else {
          setErrors({ general: data.message || 'Identifiants incorrects.' });
        }
      } else {
        setSuccessMessage(data.message);
        setStep('otp');
      }
    } catch (error) {
      setErrors({ general: 'Impossible de contacter le serveur.' });
    } finally {
      setLoading(false);
    }
  };

  // 2. ÉTAPE 2 : Validation du code OTP -> Connexion finale
  const handleOtpSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setSuccessMessage('');

    try {
      const response = await fetch('http://localhost:8000/api/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: email,
          code: otpCode,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.status) {
        if (data.errors) {
          setErrors(data.errors);
        } else {
          setErrors({ general: data.message || 'Code invalide ou expiré.' });
        }
      } else {
        setSuccessMessage('Connexion réussie ! Redirection...');

        setTimeout(() => {
          window.location.href = data.redirect_url || '/home';
        }, 1200);
      }
    } catch (error) {
      setErrors({ general: 'Impossible de contacter le serveur.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900 flex items-center justify-center p-4 sm:p-6 transition-colors">
      
      {/* CARD PRINCIPALE DIMENSIONNÉE ULTRA-COMPACTE */}
      <div className="max-w-3xl w-full rounded-2xl md:rounded-3xl bg-white dark:bg-gray-800 shadow-xl border border-gray-100 dark:border-gray-700/50 flex overflow-hidden my-auto">
        
        {/* COLONNE GAUCHE : FORMULAIRE */}
        <div className="w-full lg:w-1/2 p-6 sm:p-10 flex flex-col justify-center">
          
          {/* LOGO */}
          <div className="text-center">
            <a href="/" className="inline-flex items-center gap-2 justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" className="bi bi-cart4 text-indigo-600" viewBox="0 0 16 16">
                <path d="M0 2.5A.5.5 0 0 1 .5 2H2a.5.5 0 0 1 .485.379L2.89 4H14.5a.5.5 0 0 1 .485.621l-1.5 6A.5.5 0 0 1 13 11H4a.5.5 0 0 1-.485-.379L1.61 3H.5a.5.5 0 0 1-.5-.5M3.14 5l.5 2H5V5zM6 5v2h2V5zm3 0v2h2V5zm3 0v2h1.36l.5-2zm1.11 3H12v2h.61zM11 8H9v2h2zM8 8H6v2h2zM5 8H3.89l.5 2H5zm0 5a1 1 0 1 0 0 2 1 1 0 0 0 0-2m-2 1a2 2 0 1 1 4 0 2 2 0 0 1-4 0m9-1a1 1 0 1 0 0 2 1 1 0 0 0 0-2m-2 1a2 2 0 1 1 4 0 2 2 0 0 1-4 0"/>
              </svg>
              <span className="text-xl font-extrabold text-indigo-600 tracking-tight">
                Kouly<span className="text-gray-900 dark:text-white">'Store</span>
              </span>
            </a>
          </div>

          <div className="mt-6 flex flex-col items-center">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight text-center">
              {step === 'login' ? 'Soyez les bienvenus !' : 'Vérification OTP'}
            </h1>
            <p className="text-xs text-gray-400 mt-1 text-center">
              {step === 'login' 
                ? 'Connectez-vous pour accéder à votre compte' 
                : `Code à 6 chiffres envoyé à ${email}`}
            </p>
            
            <div className="w-full max-w-sm mt-5">
              
              {/* MESSAGES D'ALERTE */}
              {errors.general && (
                <div className="mb-3 p-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 text-red-600 dark:text-red-400 text-xs text-center font-medium">
                  {errors.general}
                </div>
              )}

              {successMessage && (
                <div className="mb-3 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40 text-emerald-600 dark:text-emerald-400 text-xs text-center font-medium">
                  {successMessage}
                </div>
              )}

              {/* FORMULAIRE ÉTAPE 1 : CONNEXION */}
              {step === 'login' ? (
                <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                  
                  {/* EMAIL */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Adresse e-mail
                    </label>
                    <div className="relative flex items-center">
                      <HiEnvelope className="absolute left-3.5 text-gray-400 text-lg pointer-events-none" />
                      <input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        type="email"
                        placeholder="john.doe@example.com"
                        required
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl font-medium bg-slate-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 placeholder-gray-400 text-xs sm:text-sm focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-700 text-slate-800 dark:text-white transition-all"
                      />
                    </div>
                    {errors.email && <p className="text-red-500 text-[11px] mt-1 ml-1">{errors.email[0]}</p>}
                  </div>

                  {/* MOT DE PASSE */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                        Mot de passe
                      </label>
                      
                      {/* 👈 LIEN MOT DE PASSE OUBLIÉ */}
                      <a 
                        href="/forgot-password" 
                        className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 hover:underline transition-colors"
                      >
                        Mot de passe oublié ?
                      </a>
                    </div>

                    <div className="relative flex items-center">
                      <HiLockClosed className="absolute left-3.5 text-gray-400 text-lg pointer-events-none" />
                      <input
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        type={showPassword ? "text" : "password"}
                        placeholder="Votre mot de passe"
                        required
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl font-medium bg-slate-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 placeholder-gray-400 text-xs sm:text-sm focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-700 text-slate-800 dark:text-white transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 text-gray-400 hover:text-indigo-600 transition-colors p-1"
                      >
                        {showPassword ? <HiEyeSlash className="text-lg" /> : <HiEye className="text-lg" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-red-500 text-[11px] mt-1 ml-1">{errors.password[0]}</p>}
                  </div>

                  {/* BOUTON SOUMISSION */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-2 tracking-wide font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white w-full py-3 rounded-xl shadow-md active:scale-[0.99] transition-all flex items-center justify-center focus:outline-none cursor-pointer text-xs sm:text-sm"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Vérification...
                      </span>
                    ) : (
                      'Continuer'
                    )}
                  </button>

                  {/* REDIRECTION REGISTER */}
                  <div className="text-xs text-gray-400 text-center pt-2">
                    Pas encore de compte ?{' '}
                    <a href="/register" className="text-indigo-500 hover:underline font-semibold">
                      S'inscrire
                    </a>
                  </div>
                </form>
              ) : (
                
                /* FORMULAIRE ÉTAPE 2 : CODE OTP */
                <form onSubmit={handleOtpSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 text-center">
                      Code de sécurité
                    </label>
                    <div className="relative flex items-center">
                      <HiKey className="absolute left-3.5 text-gray-400 text-lg pointer-events-none" />
                      <input
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        maxLength={6}
                        type="text"
                        placeholder="000000"
                        required
                        className="w-full text-center tracking-[0.4em] font-bold pl-8 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 placeholder-gray-400 text-sm sm:text-base focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-700 text-slate-800 dark:text-white transition-all"
                      />
                    </div>
                    {errors.code && <p className="text-red-500 text-[11px] mt-1 text-center">{errors.code[0]}</p>}
                  </div>

                  {/* BOUTON VERIFICATION OTP */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-2 tracking-wide font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white w-full py-3 rounded-xl shadow-md active:scale-[0.99] transition-all flex items-center justify-center focus:outline-none cursor-pointer text-xs sm:text-sm"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Validation du code...
                      </span>
                    ) : (
                      'Valider & Se connecter'
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setStep('login');
                      setErrors({});
                      setSuccessMessage('');
                    }}
                    className="w-full text-xs text-gray-500 hover:text-indigo-600 text-center transition-colors pt-1"
                  >
                    ← Modifier l'adresse e-mail
                  </button>
                </form>
              )}

            </div>
          </div>
        </div>

        {/* COLONNE DROITE : IMAGE ADAPTÉE & COMPACTE */}
        <div className="hidden lg:block lg:w-1/2 relative bg-slate-900">
          <img 
            src="/src/assets/auth.jpeg" 
            alt="Shopping Expérience Kouly'Store" 
            className="w-full h-full object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent flex flex-col justify-end p-8">
            <h2 className="text-2xl font-black text-white tracking-tight">
              Ravi de vous revoir !
            </h2>
            <p className="text-xs text-gray-300 mt-1.5 leading-relaxed max-w-xs font-normal">
              Accédez à vos commandes, vos favoris et vos offres personnalisées en un instant.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Login;

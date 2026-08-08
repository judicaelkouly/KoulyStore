import React, { useState } from 'react';

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
      // 1. Initialiser le cookie CSRF Sanctum
      await fetch('http://localhost:8000/sanctum/csrf-cookie', {
        method: 'GET',
        credentials: 'include',
      });

      // 2. Envoyer la demande de connexion
      const response = await fetch('http://localhost:8000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include', // Essentiel pour les sessions/cookies
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
        // Succès Étape 1 -> Passage à l'étape OTP
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
        credentials: 'include', // Conserve la session
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

        // Redirection gérée directement par l'URL du Backend (sans localStorage)
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
      <div className="max-w-screen-xl w-full bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700/50 sm:rounded-3xl flex justify-center overflow-hidden min-h-[600px]">
        
        {/* BLOC DE FORMULAIRE */}
        <div className="w-full lg:w-1/2 xl:w-5/12 p-6 sm:p-12 flex flex-col justify-center">
          <div className="text-center">
            <a href="#" className="inline-flex items-center gap-2 justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" fill="currentColor" className="bi bi-cart4 text-indigo-600" viewBox="0 0 16 16">
                <path d="M0 2.5A.5.5 0 0 1 .5 2H2a.5.5 0 0 1 .485.379L2.89 4H14.5a.5.5 0 0 1 .485.621l-1.5 6A.5.5 0 0 1 13 11H4a.5.5 0 0 1-.485-.379L1.61 3H.5a.5.5 0 0 1-.5-.5M3.14 5l.5 2H5V5zM6 5v2h2V5zm3 0v2h2V5zm3 0v2h1.36l.5-2zm1.11 3H12v2h.61zM11 8H9v2h2zM8 8H6v2h2zM5 8H3.89l.5 2H5zm0 5a1 1 0 1 0 0 2 1 1 0 0 0 0-2m-2 1a2 2 0 1 1 4 0 2 2 0 0 1-4 0m9-1a1 1 0 1 0 0 2 1 1 0 0 0 0-2m-2 1a2 2 0 1 1 4 0 2 2 0 0 1-4 0"/>
              </svg>
              <span className="text-xl font-extrabold text-indigo-600 tracking-tight">
                                Kouly<span className="text-gray-900">'Store</span>
                            </span>
            </a>
          </div>

          <div className="mt-8 flex flex-col items-center">
            <h1 className="text-2xl xl:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {step === 'login' ? 'Soyez les bienvenus !' : 'Vérification OTP'}
            </h1>
            <p className="text-xs text-gray-400 mt-1 text-center">
              {step === 'login' 
                ? 'Connectez-vous pour accéder à votre compte' 
                : `Saisissez le code à 6 chiffres envoyé à ${email}`}
            </p>
            
            <div className="w-full flex-1 mt-6">
              
              {/* ALERTE ERREUR GÉNÉRALE */}
              {errors.general && (
                <div className="mb-4 text-red-600 text-xs text-center font-medium">
                  {errors.general}
                </div>
              )}

              {/* ALERTE SUCCÈS */}
              {successMessage && (
                <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 text-xs text-center font-medium">
                  {successMessage}
                </div>
              )}

              {/* FORMULAIRE ÉTAPE 1 : LOGIN */}
              {step === 'login' ? (
                <form onSubmit={handleLoginSubmit} className="mx-auto max-w-xs space-y-4">
                  <div>
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-5 py-3.5 rounded-xl font-medium bg-slate-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 placeholder-gray-400 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white text-slate-800 dark:text-white transition-all"
                      type="email"
                      placeholder="Adresse e-mail"
                      required
                    />
                    {errors.email && <p className="text-red-500 text-[11px] mt-1 ml-1">{errors.email[0]}</p>}
                  </div>

                  <div>
                    <input
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-5 py-3.5 rounded-xl font-medium bg-slate-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 placeholder-gray-400 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white text-slate-800 dark:text-white transition-all"
                      type="password"
                      placeholder="Mot de passe"
                      required
                    />
                    {errors.password && <p className="text-red-500 text-[11px] mt-1 ml-1">{errors.password[0]}</p>}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="tracking-wide font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white w-full py-3.5 rounded-xl shadow-md active:scale-[0.99] transition-all flex items-center justify-center focus:outline-none cursor-pointer text-sm"
                  >
                    {loading ? 'Vérification...' : 'Continuer'}
                  </button>

                  <p className="text-[11px] text-gray-400 text-center leading-normal pt-2">
                    Pas de compte ?{' '}
                    <a href="/register" className="text-indigo-500 hover:underline font-semibold">
                      S'inscrire
                    </a>
                  </p>
                </form>
              ) : (
                /* FORMULAIRE ÉTAPE 2 : CODE OTP */
                <form onSubmit={handleOtpSubmit} className="mx-auto max-w-xs space-y-4">
                  <div>
                    <input
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      maxLength={6}
                      className="w-full text-center tracking-[0.5em] text-lg font-bold px-5 py-3.5 rounded-xl bg-slate-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:bg-white text-slate-800 dark:text-white transition-all"
                      type="text"
                      placeholder="000000"
                      required
                    />
                    {errors.code && <p className="text-red-500 text-[11px] mt-1 ml-1">{errors.code[0]}</p>}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="tracking-wide font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white w-full py-3.5 rounded-xl shadow-md active:scale-[0.99] transition-all flex items-center justify-center focus:outline-none cursor-pointer text-sm"
                  >
                    {loading ? 'Validation du code...' : 'Valider & Se connecter'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setStep('login');
                      setErrors({});
                      setSuccessMessage('');
                    }}
                    className="w-full text-[11px] text-gray-500 hover:text-indigo-600 text-center transition-colors"
                  >
                    ← Modifier l'adresse email
                  </button>
                </form>
              )}

            </div>
          </div>
        </div>

        {/* COLONNE DROITE : Image */}
        <div className="flex-1 bg-slate-100 text-center hidden lg:flex relative">
          <div className="absolute inset-0 bg-gradient-to-t from-indigo-950/40 via-transparent to-black/10 z-10" />
          <img 
            src="/src/assets/auth.jpeg" 
            alt="Shopping Expérience Kouly'price" 
            className="w-full h-full object-cover"
          />
        </div>

      </div>
    </div>
  );
}

export default Login;
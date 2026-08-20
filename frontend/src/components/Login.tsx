import React, { useState } from 'react';
import { 
  HiEnvelope, 
  HiLockClosed, 
  HiEye, 
  HiEyeSlash 
} from 'react-icons/hi2';

// URL de base de l'API (ex: https://ton-back.onrender.com/api ou http://localhost:8000/api)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
// URL racine pour Sanctum (ex: https://ton-back.onrender.com ou http://localhost:8000)
const SANCTUM_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "");

interface ValidationErrors {
  general?: string;
  email?: string[];
  password?: string[];
  [key: string]: any;
}

function Login() {
  // Champs de formulaires
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Visibilité du mot de passe
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // États UI
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Validation Identifiants -> Connexion Directe
  const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setSuccessMessage('');

    try {
      await fetch(`${SANCTUM_BASE_URL}/sanctum/csrf-cookie`, {
        method: 'GET',
        credentials: 'include',
      });

      const response = await fetch(`${API_BASE_URL}/login`, {
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
        setSuccessMessage('Connexion réussie ! Redirection...');

        setTimeout(() => {
          window.location.href = data.redirect_url || '/';
        }, 1000);
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
           <div className="flex items-center justify-center">
         <a href="/" className="flex items-center gap-3 group">
            <img 
              src="/src/assets/logo3.png" 
              alt="Kouly'Store Logo" 
              className="h-10 sm:h-20 w-auto object-contain transition-transform group-hover:scale-105"
            />
          </a>
        </div>

          <div className="mt-6 flex flex-col items-center">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight text-center">
              Soyez les bienvenus !
            </h1>
            <p className="text-xs text-gray-400 mt-1 text-center">
              Connectez-vous pour accéder à votre compte
            </p>
            
            <div className="w-full max-w-sm mt-5">
              
              {/* MESSAGES D'ALERTE */}
              {errors.general && (
                <div className="mb-3 p-2.5  text-red-600 dark:text-red-400 text-xs text-center font-medium">
                  {errors.general}
                </div>
              )}

              {successMessage && (
                <div className="mb-3 p-2.5 text-emerald-600 dark:text-emerald-400 text-xs text-center font-medium">
                  {successMessage}
                </div>
              )}

              {/* FORMULAIRE DE CONNEXION */}
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
                      Connexion en cours...
                    </span>
                  ) : (
                    'Se connecter'
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

            </div>
          </div>
        </div>

        {/* COLONNE DROITE : IMAGE */}
        <div className="hidden lg:block lg:w-1/2 relative">
          <img 
            src="/src/assets/hero3.png" 
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

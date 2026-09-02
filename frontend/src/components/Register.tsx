import React, { useState } from 'react';
import { 
  HiUser, 
  HiEnvelope, 
  HiPhone, 
  HiLockClosed, 
  HiEye, 
  HiEyeSlash 
} from 'react-icons/hi2';

// URL de base de l'API (ex: https://ton-back.onrender.com/api ou http://localhost:8000/api)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

interface ValidationErrors {
  general?: string;
  username?: string[];
  email?: string[];
  phone?: string[];
  password?: string[];
  [key: string]: any;
}

function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [successMessage, setSuccessMessage] = useState<string>('');

  // États pour la visibilité des mots de passe
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setSuccessMessage('');

    try {
        console.time("Connexion globale");

        console.time("Temps API Register");

      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
  console.timeEnd("Temps API Register");

      if (!response.ok) {
        if (data.errors) {
          setErrors(data.errors);
        } else {
          setErrors({ general: data.message || "Une erreur est survenue." });
        }
      } else {
        setSuccessMessage('Compte créé avec succès ! Redirection...');
        setFormData({
          username: '',
          email: '',
          phone: '',
          password: '',
          password_confirmation: '',
        });

        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      }
    } catch (error) {
      setErrors({ general: 'Impossible de contacter le serveur.' });
    } finally {
        console.timeEnd("Connexion globale");

      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900 flex items-center justify-center p-4 sm:p-6 transition-colors">
      
      {/* CARD PRINCIPALE DIMENTIONNÉE */}
      <div className="max-w-4xl w-full rounded-2xl md:rounded-3xl bg-white dark:bg-gray-800 shadow-xl border border-gray-100 dark:border-gray-700/50 flex overflow-hidden my-auto">
        
        {/* COLONNE GAUCHE : FORMULAIRE */}
        <div className="w-full lg:w-1/2 p-6 sm:p-10 flex flex-col justify-center">
          
          {/* LOGO */}
          <div className="flex items-center justify-center">
            <a href="/" className="flex items-center gap-3 group">
              <img 
                src="/public/logo3.png" 
                alt="Kouly'Store Logo" 
                className="h-10 sm:h-20 w-auto object-contain transition-transform group-hover:scale-105"
              />
            </a>
          </div>

          <div className="mt-6 flex flex-col items-center">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight text-center">
              Créer un compte
            </h1>
            <p className="text-xs text-gray-400 mt-1 text-center">Rejoignez-nous pour une expérience unique</p>
            
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

              {/* FORMULAIRE */}
              <form onSubmit={handleSubmit} className="space-y-3.5">
                
                {/* NOM D'UTILISATEUR */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Nom d'utilisateur
                  </label>
                  <div className="relative flex items-center">
                    <HiUser className="absolute left-3.5 text-gray-400 text-lg pointer-events-none" />
                    <input
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      type="text"
                      placeholder="John Doe"
                      required
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl font-medium bg-slate-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 placeholder-gray-400 text-xs sm:text-sm focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-700 text-slate-800 dark:text-white transition-all"
                    />
                  </div>
                  {errors.username && <p className="text-red-500 text-[11px] mt-1 ml-1">{errors.username[0]}</p>}
                </div>

                {/* EMAIL */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Adresse e-mail
                  </label> 
                  <div className="relative flex items-center">
                    <HiEnvelope className="absolute left-3.5 text-gray-400 text-lg pointer-events-none" />
                    <input
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      type="email"
                      placeholder="john.doe@example.com"
                      required
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl font-medium bg-slate-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 placeholder-gray-400 text-xs sm:text-sm focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-700 text-slate-800 dark:text-white transition-all"
                    />
                  </div>
                  {errors.email && <p className="text-red-500 text-[11px] mt-1 ml-1">{errors.email[0]}</p>}
                </div>

                {/* TELEPHONE (FACULTATIF) */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Téléphone
                  </label>
                  <div className="relative flex items-center">
                    <HiPhone className="absolute left-3.5 text-gray-400 text-lg pointer-events-none" />
                    <input
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      type="tel"
                      placeholder="+225 05 55 55 55 55"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl font-medium bg-slate-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 placeholder-gray-400 text-xs sm:text-sm focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-700 text-slate-800 dark:text-white transition-all"
                    />
                  </div>
                  {errors.phone && <p className="text-red-500 text-[11px] mt-1 ml-1">{errors.phone[0]}</p>}
                </div>

                {/* MOT DE PASSE */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Mot de passe
                  </label>
                  <div className="relative flex items-center">
                    <HiLockClosed className="absolute left-3.5 text-gray-400 text-lg pointer-events-none" />
                    <input
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      type={showPassword ? "text" : "password"}
                      placeholder="Min 6 caractères"
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

                {/* CONFIRMATION MOT DE PASSE */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Confirmer le mot de passe
                  </label>
                  <div className="relative flex items-center">
                    <HiLockClosed className="absolute left-3.5 text-gray-400 text-lg pointer-events-none" />
                    <input
                      name="password_confirmation"
                      value={formData.password_confirmation}
                      onChange={handleChange}
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Répétez le mot de passe"
                      required
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl font-medium bg-slate-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 placeholder-gray-400 text-xs sm:text-sm focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-700 text-slate-800 dark:text-white transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 text-gray-400 hover:text-indigo-600 transition-colors p-1"
                    >
                      {showConfirmPassword ? <HiEyeSlash className="text-lg" /> : <HiEye className="text-lg" />}
                    </button>
                  </div>
                  {errors.password_confirmation && (
                    <p className="text-red-500 text-[11px] mt-1 ml-1">{errors.password_confirmation[0]}</p>
                  )}
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
                      Création en cours...
                    </span>
                  ) : (
                    <span>Créer mon compte</span>
                  )}
                </button>
                
                {/* REDIRECTION LOGIN */}
                <div className="text-xs text-gray-400 text-center pt-2">
                  Déjà un compte ?{" "}
                  <a href="/login" className="text-indigo-500 hover:underline font-semibold">
                    Se connecter
                  </a>
                </div>
              </form>

            </div>
          </div>
        </div>

        {/* COLONNE DROITE : IMAGE ADAPTÉE & COMPACTE */}
        <div className="hidden lg:block lg:w-1/2 relative ">
          <img 
            src="/src/assets/hero3.png" 
            alt="Shopping Expérience Kouly'Store" 
            className="w-full h-full object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent flex flex-col justify-end p-8">
            <h2 className="text-2xl font-black text-white tracking-tight">
              Découvrez les tendances.
            </h2>
            <p className="text-xs text-gray-300 mt-1.5 leading-relaxed max-w-xs font-normal">
              Accédez instantanément aux meilleures sélections exclusives et profitez d'une livraison sur-mesure.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Register;

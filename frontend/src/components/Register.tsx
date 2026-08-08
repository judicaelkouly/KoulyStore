import React, { useState } from 'react';

// Interface pour typer proprement l'objet des erreurs
interface ValidationErrors {
  general?: string;
  username?: string[];
  email?: string[];
  phone?: string[];
  password?: string[];
  [key: string]: any; // Indexation dynamique pour autoriser errors[name]
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
      const response = await fetch('http://localhost:8000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

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
              Créer un compte
            </h1>
            <p className="text-xs text-gray-400 mt-1">Rejoignez-nous pour une expérience shopping unique</p>
            
            <div className="w-full flex-1 mt-6">
              
              {/* ALERTE ERREUR GÉNÉRALE */}
              {errors.general && (
                <div className="mb-4 text-red-600 text-xs text-center font-medium">
                  {errors.general}
                </div>
              )}

              {/* ALERTE SUCCÈS */}
              {successMessage && (
                <div className="mb-4 text-emerald-600 text-xs text-center font-medium">
                  {successMessage}
                </div>
              )}

              {/* Formulaire classique */}
              <form onSubmit={handleSubmit} className="mx-auto max-w-xs space-y-4">
                
                {/* Username */}
                <div>
                  <input
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full px-5 py-3.5 rounded-xl font-medium bg-slate-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 placeholder-gray-400 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white text-slate-800 dark:text-white transition-all"
                    type="text"
                    placeholder="Nom d'utilisateur"
                    required
                  />
                  {errors.username && <p className="text-red-500 text-[11px] mt-1 ml-1">{errors.username[0]}</p>}
                </div>

                {/* Email */}
                <div>
                  <input
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-5 py-3.5 rounded-xl font-medium bg-slate-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 placeholder-gray-400 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white text-slate-800 dark:text-white transition-all"
                    type="email"
                    placeholder="Adresse e-mail"
                    required
                  />
                  {errors.email && <p className="text-red-500 text-[11px] mt-1 ml-1">{errors.email[0]}</p>}
                </div>

                {/* Phone */}
                <div>
                  <input
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-5 py-3.5 rounded-xl font-medium bg-slate-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 placeholder-gray-400 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white text-slate-800 dark:text-white transition-all"
                    type="tel"
                    placeholder="+225 05 55 55 55 55"
                    required
                  />
                  {errors.phone && <p className="text-red-500 text-[11px] mt-1 ml-1">{errors.phone[0]}</p>}
                </div>

                {/* Password */}
                <div>
                  <input
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-5 py-3.5 rounded-xl font-medium bg-slate-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 placeholder-gray-400 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white text-slate-800 dark:text-white transition-all"
                    type="password"
                    placeholder="Mot de passe"
                    required
                  />
                  {errors.password && <p className="text-red-500 text-[11px] mt-1 ml-1">{errors.password[0]}</p>}
                </div>

                {/* Password Confirmation */}
                <div>
                  <input
                    name="password_confirmation"
                    value={formData.password_confirmation}
                    onChange={handleChange}
                    className="w-full px-5 py-3.5 rounded-xl font-medium bg-slate-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 placeholder-gray-400 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white text-slate-800 dark:text-white transition-all"
                    type="password"
                    placeholder="Confirmer le mot de passe"
                    required
                  />
                </div>
                
                {/* Bouton de soumission */}
                <button
                  type="submit"
                  disabled={loading}
                  className="tracking-wide font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white w-full py-3.5 rounded-xl shadow-md active:scale-[0.99] transition-all flex items-center justify-center focus:outline-none cursor-pointer text-sm"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Création en cours...
                    </span>
                  ) : (
                    <>
                      <svg className="w-5 h-5 -ml-1 text-indigo-200" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                        <circle cx="8.5" cy="7" r="4" />
                        <path d="M20 8v6M23 11h-6" />
                      </svg>
                      <span className="ml-2.5">Créer mon compte</span>
                    </>
                  )}
                </button>
                
                {/* Lien de redirection */}
                <div className="text-[11px] text-gray-400 text-center leading-normal pt-2">
                  Déjà un compte ?{" "}
                  <a href="/login" className="text-indigo-500 hover:underline font-semibold">
                    Se connecter
                  </a>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* COLONNE DROITE : Image Shopping */}
        <div className="flex-1 bg-slate-100 text-center hidden lg:flex relative">
          <div className="absolute inset-0 bg-gradient-to-t from-indigo-950/40 via-transparent to-black/10 z-10" />
          <img 
            src="/src/assets/auth.jpeg" 
            alt="Shopping Expérience Kouly'price" 
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-12 left-12 right-12 z-20 text-left">
            <h2 className="text-3xl font-black text-white tracking-tight drop-shadow-sm">Découvrez les tendances.</h2>
            <p className="text-sm text-white/90 mt-2 max-w-sm font-medium drop-shadow-sm">Accédez instantanément aux meilleures sélections exclusives et profitez d'une livraison sur-mesure.</p>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Register;

import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  HiLockClosed, 
  HiEye, 
  HiEyeSlash 
} from "react-icons/hi2";

type Step = "EMAIL" | "CODE" | "NEW_PASSWORD";

export default function ForgotPassword() {
  const navigate = useNavigate();

  // Gestion des étapes
  const [step, setStep] = useState<Step>("EMAIL");

  // Champs de formulaire
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");

  // Visibilité des mots de passe
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);

  // États UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Helper XSRF pour Laravel Sanctum
  const getXsrfToken = (): string => {
    const cookies = document.cookie.split(";");
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split("=");
      if (name === "XSRF-TOKEN") return decodeURIComponent(value);
    }
    return "";
  };

  // 1️⃣ ÉTAPE 1 : Demande du code par e-mail
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const response = await fetch("http://localhost:8000/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-XSRF-TOKEN": getXsrfToken(),
        },
        credentials: "include",
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        setStep("CODE");
      } else {
        setError(data.message || "Une erreur est survenue.");
      }
    } catch (err) {
      setError("Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  };

  // 2️⃣ ÉTAPE 2 : Vérification du code OTP
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const response = await fetch("http://localhost:8000/api/auth/verify-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-XSRF-TOKEN": getXsrfToken(),
        },
        credentials: "include",
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        setStep("NEW_PASSWORD");
      } else {
        setError(data.message || "Code invalide.");
      }
    } catch (err) {
      setError("Impossible de vérifier le code.");
    } finally {
      setLoading(false);
    }
  };

  // 3️⃣ ÉTAPE 3 : Choix du nouveau mot de passe
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (password !== passwordConfirmation) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:8000/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-XSRF-TOKEN": getXsrfToken(),
        },
        credentials: "include",
        body: JSON.stringify({
          email,
          code,
          password,
          password_confirmation: passwordConfirmation,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Redirection vers la connexion après succès
        navigate("/login", {
          state: { message: "Mot de passe réinitialisé ! Veuillez vous connecter." },
        });
      } else {
        setError(data.message || "Erreur lors de la réinitialisation.");
      }
    } catch (err) {
      setError("Impossible de modifier le mot de passe.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100">
        <h2 className="text-2xl font-bold text-slate-800 text-center mb-2">
          {step === "EMAIL" && "Mot de passe oublié"}
          {step === "CODE" && "Vérification du code"}
          {step === "NEW_PASSWORD" && "Nouveau mot de passe"}
        </h2>
        <p className="text-xs text-gray-500 text-center mb-6">
          {step === "EMAIL" && "Entrez votre e-mail pour recevoir un code à 6 chiffres."}
          {step === "CODE" && `Code envoyé à ${email}`}
          {step === "NEW_PASSWORD" && "Saisissez votre nouveau mot de passe ci-dessous."}
        </p>

        {/* Message de succès */}
        {message && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3 rounded-lg text-xs mb-4">
            {message}
          </div>
        )}

        {/* Message d'erreur */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-xs mb-4">
            {error}
          </div>
        )}

        {/* FORMULAIRE ÉTAPE 1 : EMAIL */}
        {step === "EMAIL" && (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Adresse E-mail
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre.email@exemple.com"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-600 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg text-sm transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Envoi du code..." : "Recevoir le code"}
            </button>
          </form>
        )}

        {/* FORMULAIRE ÉTAPE 2 : CODE OTP */}
        {step === "CODE" && (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Code à 6 chiffres
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                className="w-full text-center tracking-widest text-lg font-mono px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg text-sm transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Vérification..." : "Valider le code"}
            </button>

            <button
              type="button"
              onClick={() => setStep("EMAIL")}
              className="w-full text-xs text-slate-500 hover:underline text-center block cursor-pointer"
            >
              Changer d'adresse e-mail
            </button>
          </form>
        )}

        {/* FORMULAIRE ÉTAPE 3 : NOUVEAU MOT DE PASSE */}
        {step === "NEW_PASSWORD" && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            
            {/* NOUVEAU MOT DE PASSE */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Nouveau mot de passe
              </label>
              <div className="relative flex items-center">
                <HiLockClosed className="absolute left-3.5 text-gray-400 text-lg pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-600 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-gray-400 hover:text-indigo-600 transition-colors p-1 cursor-pointer"
                >
                  {showPassword ? <HiEyeSlash className="text-lg" /> : <HiEye className="text-lg" />}
                </button>
              </div>
            </div>

            {/* CONFIRMATION MOT DE PASSE */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Répéter le mot de passe
              </label>
              <div className="relative flex items-center">
                <HiLockClosed className="absolute left-3.5 text-gray-400 text-lg pointer-events-none" />
                <input
                  type={showPasswordConfirmation ? "text" : "password"}
                  required
                  minLength={8}
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-600 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                  className="absolute right-3 text-gray-400 hover:text-indigo-600 transition-colors p-1 cursor-pointer"
                >
                  {showPasswordConfirmation ? <HiEyeSlash className="text-lg" /> : <HiEye className="text-lg" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg text-sm transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Enregistrement..." : "Changer mon mot de passe"}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link to="/login" className="text-xs text-indigo-600 hover:underline">
            ← Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
}

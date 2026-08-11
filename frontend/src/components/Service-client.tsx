import { useState } from "react";
//import Header from "./Header";
//import HeaderConnect from "./HeaderConnect";
import Footer from "./Footer";
import { 
  FaUndo, 
  FaPaperPlane, 
  FaPhoneAlt, 
  FaEnvelope, 
  FaClock, 
  FaBoxOpen, 
  FaTruckLoading, 
  FaCheckCircle, 
  FaCloudUploadAlt 
} from "react-icons/fa";

function ContactReturns() {
  const [formData, setFormData] = useState({
    orderNumber: "",
    fullName: "",
    email: "",
    reason: "defective", // defective, wrong_item, size_issue, other
    description: "",
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Helper pour récupérer le token XSRF si tu utilises Laravel Sanctum
  const getXsrfToken = () => {
    const cookies = document.cookie.split(";");
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split("=");
      if (name === "XSRF-TOKEN") {
        return decodeURIComponent(value);
      }
    }
    return "";
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    // Construction du FormData pour l'envoi multipart (fichiers + textes)
    const data = new FormData();
    data.append("orderNumber", formData.orderNumber);
    data.append("fullName", formData.fullName);
    data.append("email", formData.email);
    data.append("reason", formData.reason);
    data.append("description", formData.description);

    if (selectedFile) {
      data.append("photo", selectedFile);
    }

    const xsrfToken = getXsrfToken();
    const headers: Record<string, string> = {
      Accept: "application/json",
    };
    if (xsrfToken) headers["X-XSRF-TOKEN"] = xsrfToken;

    try {
      const response = await fetch("http://localhost:8000/api/returns", {
        method: "POST",
        headers,
        body: data,
        credentials: "include",
      });

      if (response.ok) {
        setIsSubmitted(true);
      } else {
        const errorData = await response.json().catch(() => null);
        setErrorMessage(
          errorData?.error || errorData?.message || "Une erreur est survenue lors de l'envoi de la demande."
        );
      }
    } catch (error) {
      console.error("Erreur réseau :", error);
      setErrorMessage("Impossible de contacter le serveur. Veuillez vérifier votre connexion.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const returnSteps = [
    {
      icon: <FaPaperPlane className="text-xl text-indigo-600" />,
      title: "1. Demande en ligne",
      desc: "Remplissez le formulaire ci-dessous avec le numéro de votre commande et une photo de l'article."
    },
    {
      icon: <FaBoxOpen className="text-xl text-indigo-600" />,
      title: "2. Validation & Instructions",
      desc: "Notre équipe vérifie votre demande sous 24h et vous envoie l'accord de retour."
    },
    {
      icon: <FaTruckLoading className="text-xl text-indigo-600" />,
      title: "3. Enlèvement / Échange",
      desc: "Notre livreur récupère le colis à votre adresse ou procède à un échange direct."
    }
  ];

  return (
    <div className="bg-gradient-to-br from-slate-100 to-slate-200 min-h-screen flex flex-col text-slate-800">
      {/* Header conditionnel */}
      {/* {user ? <HeaderConnect user={user} /> : <Header />} */}

      {/* BANNIÈRE HERO */}
      <section className="bg-slate-900 text-white py-14 px-4 relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <span className="inline-flex items-center gap-2 bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4">
            <FaUndo /> Service Client & Retours
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-4">
            Un problème avec votre commande ?
          </h1>
          <p className="text-gray-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Vous disposez de <strong>7 jours</strong> après la réception de votre colis pour demander un retour, un échange ou un remboursement.
          </p>
        </div>
      </section>

      {/* CONTENU PRINCIPAL */}
      <main className="max-w-5xl mx-auto px-4 py-12 flex-1 w-full space-y-12">

        {/* ÉTAPES DU RETOUR */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {returnSteps.map((step, idx) => (
            <div key={idx} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-4">
                {step.icon}
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-2">{step.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>

        {/* FORMULAIRE ET COORDONNÉES */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

          {/* FORMULAIRE DE RETOUR (2 Colonnes) */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
            <h2 className="text-xl font-extrabold text-slate-900 mb-6 flex items-center gap-2">
              Formulaire de demande de retour
            </h2>

            {errorMessage && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-600 text-xs sm:text-sm p-4 rounded-xl">
                {errorMessage}
              </div>
            )}

            {isSubmitted ? (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto text-3xl">
                  <FaCheckCircle />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Demande enregistrée avec succès !</h3>
                <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
                  Votre dossier de retour concernant la commande <strong>#{formData.orderNumber}</strong> a été transmis à notre service logistique. Vous recevrez un SMS/Email de confirmation très rapidement.
                </p>
                <button
                  onClick={() => {
                    setIsSubmitted(false);
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }}
                  className="mt-4 text-xs font-bold text-indigo-600 hover:underline"
                >
                  Envoyer une autre demande
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      N° de commande *
                    </label>
                    <input
                      type="text"
                      name="orderNumber"
                      required
                      placeholder="Ex: CMD-8492"
                      value={formData.orderNumber}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Nom complet *
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      required
                      placeholder="Ex: Kouame Judicael"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Adresse Email / Téléphone *
                    </label>
                    <input
                      type="text"
                      name="email"
                      required
                      placeholder="Pour vous recontacter"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Motif du retour *
                    </label>
                    <select
                      name="reason"
                      value={formData.reason}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    >
                      <option value="defective">Produit endommagé ou défectueux</option>
                      <option value="wrong_item">Mauvais article reçu</option>
                      <option value="size_issue">Problème de taille / pointure</option>
                      <option value="other">Autre motif</option>
                    </select>
                  </div>
                </div>

                {/* Joindre une photo */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Photo de l'article (Optionnel)
                  </label>
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    {previewUrl ? (
                      <div className="flex items-center justify-center gap-3">
                        <img src={previewUrl} alt="Aperçu" className="w-12 h-12 rounded-lg object-cover border" />
                        <span className="text-xs font-semibold text-slate-700">{selectedFile?.name}</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-slate-500">
                        <FaCloudUploadAlt className="text-2xl text-indigo-500" />
                        <span className="text-xs font-medium">Cliquez pour ajouter une photo du produit</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Explication complémentaire *
                  </label>
                  <textarea
                    name="description"
                    rows={4}
                    required
                    placeholder="Décrivez brièvement le souci rencontré..."
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm py-3.5 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? "Envoi en cours..." : "Soumettre la demande de retour"}
                </button>
              </form>
            )}
          </div>

          {/* INFORMATIONS SUPPORTS EN DIRECT (1 Colonne) */}
          <div className="space-y-6">
            <div className="bg-slate-900 text-white rounded-2xl p-6 space-y-6 shadow-sm">
              <h3 className="font-bold text-lg border-b border-slate-800 pb-3">Besoin d'aide immédiate ?</h3>
              
              <div className="space-y-4 text-xs sm:text-sm">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-indigo-600/30 text-indigo-400 rounded-lg flex items-center justify-center shrink-0">
                    <FaPhoneAlt />
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs font-medium">Téléphone / WhatsApp</p>
                    <p className="font-bold text-white mt-0.5">+225 07 00 00 00 00</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-indigo-600/30 text-indigo-400 rounded-lg flex items-center justify-center shrink-0">
                    <FaEnvelope />
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs font-medium">Email Support</p>
                    <p className="font-bold text-white mt-0.5">support@koulystore.ci</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-indigo-600/30 text-indigo-400 rounded-lg flex items-center justify-center shrink-0">
                    <FaClock />
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs font-medium">Horaires du Service Client</p>
                    <p className="font-semibold text-white mt-0.5">Lun - Sam: 08h00 - 19h00</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 text-slate-700 space-y-2">
              <h4 className="font-bold text-indigo-950 text-sm">Rappel important</h4>
              <p className="text-xs leading-relaxed text-indigo-900/80">
                L'article retourné doit être dans son état d'origine, non utilisé, et conservé dans son emballage initial avec les étiquettes intactes.
              </p>
            </div>
          </div>

        </div>

      </main>

      <Footer />
    </div>
  );
}

export default ContactReturns;

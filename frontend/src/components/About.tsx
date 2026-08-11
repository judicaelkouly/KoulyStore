import Footer from "./Footer";
import { Link } from "react-router-dom";
import { 
  FaStore, 
  FaShieldAlt, 
  FaRocket, 
  FaHeart, 
  FaTruck, 
  //FaUsers, 
  FaCheckCircle 
} from "react-icons/fa";

function About() {
  const stats = [
    { number: "100%", label: "Produits authentiques" },
    { number: "24-48h", label: "Livraison rapide" },
    { number: "24/7", label: "Support client" },
    { number: "1000+", label: "Clients satisfaits" },
  ];

  const values = [
    {
      icon: <FaShieldAlt className="text-2xl text-indigo-600" />,
      title: "Fiabilité & Qualité",
      description: "Nous sélectionnons rigoureusement chaque article pour vous garantir une qualité irréprochable et des produits authentiques."
    },
    {
      icon: <FaTruck className="text-2xl text-indigo-600" />,
      title: "Proximité & Rapidité",
      description: "Un service de livraison optimisé pour vous livrer dans les plus brefs délais, avec un suivi en temps réel."
    },
    {
      icon: <FaHeart className="text-2xl text-indigo-600" />,
      title: "Satisfaction Client",
      description: "Votre expérience d'achat est notre priorité absolue. Notre équipe reste à votre écoute pour répondre à tous vos besoins."
    },
    {
      icon: <FaRocket className="text-2xl text-indigo-600" />,
      title: "Innovation Digitale",
      description: "Une plateforme fluide, sécurisée et pensée pour faciliter vos achats au quotidien en toute sérénité."
    }
  ];

  return (
    <div className="bg-gradient-to-br from-slate-100 to-slate-200 min-h-screen flex flex-col text-slate-800">
      {/* Header conditionnel */}

      {/* BANNIÈRE HERO */}
      <section className="bg-slate-900 text-white py-16 px-4 relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <span className="inline-flex items-center gap-2 bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4">
            <FaStore /> Découvrez notre histoire
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-4">
            Bienvenue chez <span className="text-indigo-400">Kouly'Store</span>
          </h1>
          <p className="text-gray-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Votre destination e-commerce de confiance. Nous combinons technologie, qualité et passion pour vous offrir la meilleure expérience d'achat en ligne.
          </p>
        </div>
      </section>

      {/* CONTENU PRINCIPAL */}
      <main className="max-w-5xl mx-auto px-4 py-12 flex-1 w-full space-y-16">

        {/* SECTION NOTRE HISTOIRE */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Notre Mission & Ambition
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Créé avec la volonté de simplifier le commerce en ligne, <strong>Kouly'Store</strong> s'impose comme une réponse moderne aux besoins des consommateurs exigeants.
            </p>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Nous mettons un point d'honneur à rapprocher nos clients de leurs produits préférés grâce à une interface intuitive, des méthodes de paiement sécurisées et une logistique réactive.
            </p>
            
            <ul className="space-y-2.5 pt-2">
              {[
                "Large sélection de produits soigneusement triés",
                "Transactions 100% sécurisées (Mobile Money & Carte)",
                "Service client réactif et à l'écoute"
              ].map((item, idx) => (
                <li key={idx} className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                  <FaCheckCircle className="text-indigo-600 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl"></div>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center text-xl font-black shadow-md">
                K
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg">Kouly'Store</h3>
                <p className="text-xs text-slate-500 font-medium">L'excellence au quotidien</p>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 italic leading-relaxed">
              « Notre vision dépasse la simple vente en ligne. Nous construisons une relation de confiance durable avec chaque client en garantissant authenticité, accessibilité et rapidité. »
            </p>
          </div>
        </section>

        {/* CHIFFRES CLÉS / STATISTIQUES */}
        <section className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {stats.map((stat, idx) => (
            <div key={idx} className="space-y-1">
              <p className="text-2xl sm:text-4xl font-black text-indigo-600">{stat.number}</p>
              <p className="text-xs sm:text-sm font-bold text-slate-600">{stat.label}</p>
            </div>
          ))}
        </section>

        {/* NOS VALEURS */}
        <section className="space-y-8">
          <div className="text-center max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
              Ce qui nous anime
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm">
              Des principes solides au cœur de chacune de nos décisions.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((val, idx) => (
              <div 
                key={idx}
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200"
              >
                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-4">
                  {val.icon}
                </div>
                <h3 className="font-bold text-slate-900 text-base mb-2">{val.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{val.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA BOUTIQUE */}
        <div className="bg-slate-900 rounded-2xl p-8 sm:p-10 text-white text-center shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-xl mx-auto space-y-4">
            <h3 className="text-2xl font-black">Prêt à passer votre première commande ?</h3>
            <p className="text-xs sm:text-sm text-gray-300">
              Parcourez nos catégories et découvrez nos dernières nouveautés ainsi que nos meilleures offres du moment.
            </p>
            <div className="pt-2">
              <Link
                to="/"
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs sm:text-sm px-6 py-3.5 rounded-xl transition-all shadow-lg active:scale-95"
              >
                Explorer la boutique
              </Link>
            </div>
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}

export default About;

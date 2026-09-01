import { useState } from "react";

import Footer from "./Footer";
import { 
  FaChevronDown, 
  FaQuestionCircle, 
  FaTruck, 
  FaUndo, 
  FaCreditCard, 
  FaSearch,
  FaShieldAlt
} from "react-icons/fa";

interface FaqItem {
  id: number;
  category: "livraison" | "paiement" | "retours" | "compte";
  question: string;
  answer: string;
}

const faqData: FaqItem[] = [
  {
    id: 1,
    category: "livraison",
    question: "Quels sont les délais et frais de livraison ?",
    answer: "Les livraisons s'effectuent généralement sous 24h à 48h à Abidjan et 48h à 72h pour l'intérieur du pays. Les frais dépendent de votre zone de livraison et sont affichés avant la confirmation de commande."
  },
  {
    id: 2,
    category: "paiement",
    question: "Quels modes de paiement acceptez-vous ?",
    answer: "Nous acceptons les paiements en espèces à la livraison, ainsi que les solutions Mobile Money principales (Orange Money, MTN MoMo, Wave) et les cartes bancaires Visa/Mastercard."
  },
  {
    id: 3,
    category: "retours",
    question: "Quelle est votre politique de retour ?",
    answer: "Si le produit ne vous convient pas ou présente un défaut, vous disposez d'un délai de 7 jours après réception pour demander un échange ou un remboursement sous réserve que l'article soit neuf et dans son emballage d'origine."
  },
  {
    id: 4,
    category: "compte",
    question: "Comment suivre l'état de ma commande ?",
    answer: "Une fois connecté à votre compte Kouly'Store, rendez-vous dans la section 'Mes Commandes'. Vous pourrez y suivre en temps réel le statut d'expédition de vos articles."
  },
  {
    id: 5,
    category: "livraison",
    question: "Puis-je modifier mon adresse de livraison après commande ?",
    answer: "Oui, tant que la commande n'a pas été expédiée. Contactez immédiatement notre service client via la page Contact ou par téléphone."
  },
  {
    id: 6,
    category: "paiement",
    question: "Les paiements en ligne sont-ils sécurisés ?",
    answer: "Absolument. Toutes nos transactions en ligne passent par des passerelles chiffrées SSL certifiées pour garantir la sécurité totale de vos données bancaires et mobiles."
  }
];

function Faq({ user }: { user?: any }) {
  const [openId, setOpenId] = useState<number | null>(1); // Le 1er élément est ouvert par défaut
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Gestion de l'ouverture/fermeture des accordéons
  const toggleAccordion = (id: number) => {
    setOpenId(openId === id ? null : id);
  };

  // Filtrage dynamique des questions
  const filteredFaqs = faqData.filter((item) => {
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    const matchesSearch = 
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="bg-gradient-to-br from-slate-100 to-slate-200 min-h-screen flex flex-col text-slate-800">
      
     
      {/* BANNIÈRE HERO FAQ */}
      <section className="bg-slate-900 text-white py-14 px-4 relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <span className="inline-flex items-center gap-2 bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4">
            <FaQuestionCircle /> Centre d'aide
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-4">
            Comment pouvons-nous vous aider ?
          </h1>
          <p className="text-gray-300 text-sm sm:text-base max-w-2xl mx-auto mb-8">
            Retrouvez rapidement les réponses à toutes vos questions concernant vos achats, livraisons et services sur Kouly'Store.
          </p>

          {/* Barre de recherche FAQ */}
          <div className="relative max-w-xl mx-auto">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher une question ou un mot clé..."
              className="w-full pl-11 pr-4 py-3.5 bg-white text-slate-900 text-sm rounded-full shadow-lg outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-gray-400"
            />
          </div>
        </div>
      </section>

      {/* CONTENU PRINCIPAL */}
      <main className="max-w-4xl mx-auto px-4 py-12 flex-1 w-full">
        
        {/* Filtres de catégories */}
        <div className="flex items-center justify-center gap-2 flex-wrap mb-10">
          {[
            { id: "all", label: "Toutes les questions", icon: <FaQuestionCircle /> },
            { id: "livraison", label: "Livraison", icon: <FaTruck /> },
            { id: "paiement", label: "Paiement", icon: <FaCreditCard /> },
            { id: "retours", label: "Retours & Remboursements", icon: <FaUndo /> },
            { id: "compte", label: "Mon Compte", icon: <FaShieldAlt /> },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                selectedCategory === cat.id
                  ? "bg-indigo-600 text-white shadow-md scale-105"
                  : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
              }`}
            >
              {cat.icon}
              {cat.label}
            </button>
          ))}
        </div>

        {/* Liste des Accordéons FAQ */}
        {filteredFaqs.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-slate-200">
            <p className="text-gray-500 font-semibold text-sm">
              Aucune question ne correspond à votre recherche "{searchQuery}".
            </p>
            <button
              onClick={() => { setSearchQuery(""); setSelectedCategory("all"); }}
              className="mt-4 text-xs font-bold text-indigo-600 hover:underline"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredFaqs.map((faq) => {
              const isOpen = openId === faq.id;

              return (
                <div
                  key={faq.id}
                  className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden shadow-sm ${
                    isOpen ? "border-indigo-500 ring-2 ring-indigo-500/10" : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <button
                    onClick={() => toggleAccordion(faq.id)}
                    className="w-full flex items-center justify-between p-5 text-left font-bold text-slate-900 text-sm sm:text-base gap-4"
                  >
                    <span>{faq.question}</span>
                    <span
                      className={`w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 transition-transform duration-300 ${
                        isOpen ? "rotate-180 bg-indigo-100 text-indigo-600" : "text-slate-500"
                      }`}
                    >
                      <FaChevronDown className="text-xs" />
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* SECTION DE CONTACT EN BAS */}
        <div className="mt-14 bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-2xl p-8 text-white text-center shadow-xl">
          <h3 className="text-xl font-bold mb-2">Vous n'avez pas trouvé votre réponse ?</h3>
          <p className="text-xs sm:text-sm text-indigo-100 max-w-lg mx-auto mb-6">
            Notre équipe du service client est disponible du Lundi au Samedi pour vous assister dans vos achats.
          </p>
          <a
            href="/service-client"
            className="inline-flex items-center gap-2 bg-white text-indigo-900 font-extrabold text-xs sm:text-sm px-6 py-3 rounded-xl hover:bg-slate-100 transition-all shadow-md active:scale-95"
          >
            Contacter le support
          </a>
        </div>

      </main>

      <Footer />
    </div>
  );
}

export default Faq;

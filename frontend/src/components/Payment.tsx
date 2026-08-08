import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// Types des éléments de commande
export interface OrderItem {
  id: number | string;
  name: string;
  category?: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface ClientInfo {
  fullName: string;
  phone: string;
  email: string;
  city: string;
  deliveryAddress: string;
}

export interface LocationState {
  items?: OrderItem[];
  source?: 'direct' | 'cart';
}

function Payment() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState;

  // 1. Récupération des articles passés par la navigation
  const items: OrderItem[] = state?.items || [];

  // 2. États du formulaire
  const [paymentMethod, setPaymentMethod] = useState<"wave" | "orange" | "mtn">("wave");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [client, setClient] = useState<ClientInfo>({
    fullName: "",
    phone: "",
    email: "",
    city: "Abidjan",
    deliveryAddress: "",
  });

  const deliveryFee = 2500; // Frais de livraison standard

  // Redirection si aucun produit n'est fourni
  useEffect(() => {
    if (!items || items.length === 0) {
      alert("Aucun produit sélectionné pour le paiement.");
      navigate("/profile"); // Redirection vers le profil ou la page d'accueil
    }
  }, [items, navigate]);

  // Calculs dynamiques
  const itemTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const orderTotal = itemTotal + deliveryFee;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setClient((prev) => ({ ...prev, [name]: value }));
  };

  // Helper pour récupérer le cookie XSRF
  const getXsrfToken = (): string => {
    const cookies = document.cookie.split(";");
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split("=");
      if (name === "XSRF-TOKEN") return decodeURIComponent(value);
    }
    return "";
  };

  // 3. Soumission à l'API de commande / paiement
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Payload structuré pour le backend (Laravel OrderController)
    const orderPayload = {
      payment_method: paymentMethod,
      full_name: client.fullName,
      phone: client.phone,
      email: client.email,
      city: client.city,
      delivery_address: client.deliveryAddress,
      delivery_fee: deliveryFee,
      total_amount: orderTotal,
      items: items.map((item) => ({
        product_id: item.id,
        quantity: item.quantity,
        price: item.price,
      })),
    };

    try {
      const xsrfToken = getXsrfToken();
      const response = await fetch("http://localhost:8000/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(xsrfToken ? { "X-XSRF-TOKEN": xsrfToken } : {}),
        },
        credentials: "include",
        body: JSON.stringify(orderPayload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Échec du traitement de la commande.");
      }

      alert(`Commande validée avec succès via ${paymentMethod.toUpperCase()} !`);
      navigate("/profile"); // Redirection vers le suivi de commande ou confirmation
    } catch (err: unknown) {
      console.error("Erreur commande:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Une erreur est survenue lors de la commande.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!items || items.length === 0) return null;

  return (
    <div className="bg-slate-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 w-full transition-colors">
      <div className="max-w-5xl mx-auto bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700/50 p-6 md:p-10">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white mb-8 tracking-tight flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="currentColor" className="text-indigo-600" viewBox="0 0 16 16">
            <path d="M11 5.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5z"/>
            <path d="M2 2a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zm13 2v5H1V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1m-1 9H2a1 1 0 0 1-1-1v-1h14v1a1 1 0 0 1-1 1"/>
          </svg>
          Finaliser votre commande
        </h1>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-xl text-sm">
            {error}
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-10 items-start">
          
          {/* COLONNE GAUCHE : Formulaire & Moyens de paiement */}
          <div className="flex-1 w-full order-2 lg:order-1">
            <form onSubmit={handlePaymentSubmit} className="space-y-6">
              
              {/* 1. SELECTION DU MOYEN DE PAIEMENT */}
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-gray-300 block mb-3">
                  1. Choisir le moyen de paiement
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* WAVE */}
                  <label className={`border-2 rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-all ${
                    paymentMethod === "wave" ? "border-sky-500 bg-sky-50/20 dark:bg-sky-950/20" : "border-gray-100 dark:border-gray-700 hover:border-gray-300"
                  }`}>
                    <div className="flex items-center gap-3">
                      <input 
                        type="radio" 
                        name="payment" 
                        value="wave" 
                        checked={paymentMethod === "wave"}
                        onChange={() => setPaymentMethod("wave")}
                        className="text-sky-500 focus:ring-sky-500"
                      />
                      <span className="font-bold text-sm text-slate-800 dark:text-white">Wave</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-sky-400 flex items-center justify-center text-white text-xs font-black">W</div>
                  </label>

                  {/* ORANGE MONEY */}
                  <label className={`border-2 rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-all ${
                    paymentMethod === "orange" ? "border-orange-500 bg-orange-50/20 dark:bg-orange-950/20" : "border-gray-100 dark:border-gray-700 hover:border-gray-300"
                  }`}>
                    <div className="flex items-center gap-3">
                      <input 
                        type="radio" 
                        name="payment" 
                        value="orange" 
                        checked={paymentMethod === "orange"}
                        onChange={() => setPaymentMethod("orange")}
                        className="text-orange-500 focus:ring-orange-500"
                      />
                      <span className="font-bold text-sm text-slate-800 dark:text-white">Orange Money</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-black">OM</div>
                  </label>

                  {/* MTN MOMO */}
                  <label className={`border-2 rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-all ${
                    paymentMethod === "mtn" ? "border-amber-500 bg-amber-50/20 dark:bg-amber-950/10" : "border-gray-100 dark:border-gray-700 hover:border-gray-300"
                  }`}>
                    <div className="flex items-center gap-3">
                      <input 
                        type="radio" 
                        name="payment" 
                        value="mtn" 
                        checked={paymentMethod === "mtn"}
                        onChange={() => setPaymentMethod("mtn")}
                        className="text-amber-500 focus:ring-amber-500"
                      />
                      <span className="font-bold text-sm text-slate-800 dark:text-white">MTN MoMo</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center text-slate-900 text-xs font-black">M</div>
                  </label>
                </div>
              </div>

              {/* 2. DETAILS DU CLIENT & LIVRAISON */}
              <div className="border-t border-gray-100 dark:border-gray-700 pt-6">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-gray-300 block mb-4">
                  2. Informations de facturation & livraison
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-400 font-medium block mb-1">Nom complet</label>
                    <input 
                      type="text" 
                      name="fullName"
                      value={client.fullName}
                      onChange={handleInputChange}
                      className="w-full h-11 px-4 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none bg-slate-50/50 dark:bg-gray-800 text-slate-800 dark:text-white focus:border-indigo-500" 
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 font-medium block mb-1">Numéro de Téléphone (Paiement)</label>
                    <input 
                      type="tel" 
                      name="phone"
                      value={client.phone}
                      onChange={handleInputChange}
                      className="w-full h-11 px-4 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none bg-slate-50/50 dark:bg-gray-800 text-slate-800 dark:text-white focus:border-indigo-500" 
                      required
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs text-gray-400 font-medium block mb-1">Adresse e-mail</label>
                    <input 
                      type="email" 
                      name="email"
                      value={client.email}
                      onChange={handleInputChange}
                      className="w-full h-11 px-4 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none bg-slate-50/50 dark:bg-gray-800 text-slate-800 dark:text-white focus:border-indigo-500" 
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 font-medium block mb-1">Ville</label>
                    <input 
                      type="text" 
                      name="city"
                      value={client.city}
                      onChange={handleInputChange}
                      className="w-full h-11 px-4 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none bg-slate-50/50 dark:bg-gray-800 text-slate-800 dark:text-white focus:border-indigo-500" 
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 font-medium block mb-1">Adresse précise de livraison</label>
                    <input 
                      type="text" 
                      name="deliveryAddress"
                      value={client.deliveryAddress}
                      onChange={handleInputChange}
                      className="w-full h-11 px-4 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none bg-slate-50/50 dark:bg-gray-800 text-slate-800 dark:text-white focus:border-indigo-500" 
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Bouton d'action final */}
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-indigo-600 dark:bg-indigo-500 text-white py-4 rounded-xl font-bold text-sm hover:bg-indigo-700 dark:hover:bg-indigo-600 shadow-md active:scale-[0.99] transition-all uppercase tracking-wider mt-4 disabled:opacity-50"
              >
                {loading ? "Traitement en cours..." : `Confirmer et Payer ${orderTotal.toLocaleString()} FCFA`}
              </button>

            </form>
          </div>

          {/* COLONNE DROITE : Résumé de la commande */}
          <div className="w-full lg:w-80 order-1 lg:order-2 bg-slate-50 dark:bg-gray-700/30 p-5 rounded-2xl border border-slate-100 dark:border-gray-700 lg:sticky lg:top-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-gray-300 block mb-4">
              Résumé de la commande ({items.length} article{items.length > 1 ? "s" : ""})
            </span>

            {/* Liste des articles en boucle */}
            <div className="max-h-60 overflow-y-auto space-y-3 pr-1">
              {items.map((item, index) => (
                <div key={item.id || index} className="flex gap-3 pb-3 border-b border-gray-200/60 dark:border-gray-700">
                  <div className="w-14 h-14 rounded-xl bg-gray-200 dark:bg-gray-700 overflow-hidden flex-shrink-0">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Img</div>
                    )}
                  </div>
                  <div className="flex flex-col justify-center min-w-0 flex-1">
                    <h3 className="font-bold text-xs text-slate-800 dark:text-white truncate">{item.name}</h3>
                    <p className="text-[11px] text-gray-400 mt-0.5">{item.category || "Général"}</p>
                    <div className="flex justify-between items-center mt-1 w-full">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Qté : {item.quantity}</span>
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{(item.price * item.quantity).toLocaleString()} FCFA</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Calcul des coûts */}
            <div className="space-y-2.5 pt-4 text-xs">
              <div className="flex justify-between text-gray-500 dark:text-gray-400">
                <span>Sous-total</span>
                <span className="font-semibold text-slate-800 dark:text-white">{itemTotal.toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between text-gray-500 dark:text-gray-400">
                <span>Frais de livraison ({client.city || "Abidjan"})</span>
                <span className="font-semibold text-slate-800 dark:text-white">{deliveryFee.toLocaleString()} FCFA</span>
              </div>
              
              <div className="h-px bg-gray-200 dark:bg-gray-700 my-2"></div>
              
              <div className="flex justify-between items-baseline text-sm">
                <span className="font-bold text-slate-800 dark:text-white">Total Général</span>
                <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">{orderTotal.toLocaleString()} FCFA</span>
              </div>
            </div>

            {/* Note de sécurité */}
            <div className="mt-5 p-3 bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30 rounded-xl flex items-start gap-2.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" viewBox="0 0 16 16">
                <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2m3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2M5 9.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-.5.5h-5a.5.5 0 0 1-.5-.5z"/>
              </svg>
              <p className="text-[10px] text-emerald-700 dark:text-emerald-400 leading-tight">
                Paiement direct et sécurisé. Une demande d'approbation vous sera envoyée instantanément sur votre mobile.
              </p>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}

export default Payment;

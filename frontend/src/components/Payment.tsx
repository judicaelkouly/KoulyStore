import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

//  Interface OrderItem incluant la taille
export interface OrderItem {
  id: number | string;
  name: string;
  category?: string;
  price: number;
  quantity: number;
  size?: string | number | null;
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

  // Récupération des articles passés par la navigation
  const items: OrderItem[] = state?.items || [];

  const [paymentMethod, setPaymentMethod] = useState<"wave" | "orange" | "mtn" | "cash">("cash");
  const [loading, setLoading] = useState<boolean>(false);
  const [checkingAuth, setCheckingAuth] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [client, setClient] = useState<ClientInfo>({
    fullName: "",
    phone: "",
    email: "",
    city: "Abidjan",
    deliveryAddress: "",
  });

  const deliveryFee = 1500;

  const getXsrfToken = (): string => {
    const cookies = document.cookie.split(";");
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split("=");
      if (name === "XSRF-TOKEN") return decodeURIComponent(value);
    }
    return "";
  };

  //  Redirection si panier vide
  useEffect(() => {
    if (!items || items.length === 0) {
      alert("Aucun produit sélectionné pour le paiement.");
      navigate("/profile");
    }
  }, [items, navigate]);

  // Vérification de l'authentification et pré-remplissage des infos au chargement
  useEffect(() => {
    const checkUserAuth = async () => {
      try {
        const xsrfToken = getXsrfToken();
        const response = await fetch(`${API_BASE_URL}/user`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            ...(xsrfToken ? { "X-XSRF-TOKEN": xsrfToken } : {}),
          },
          credentials: "include",
        });

        // Si l'utilisateur n'est pas connecté (401), redirection fluide vers /login
        if (response.status === 401) {
          navigate("/login", {
            state: {
              from: "/payment",
              items: items, // On conserve les items pour ne pas les perdre après la connexion
              message: "Veuillez vous connecter pour finaliser votre commande.",
            },
          });
          return;
        }

        if (response.ok) {
          const userData = await response.json();
          setClient((prev) => ({
            ...prev,
            fullName: userData.name || userData.full_name || prev.fullName,
            email: userData.email || prev.email,
            phone: userData.phone || prev.phone,
            city: userData.city || prev.city,
            deliveryAddress: userData.address || userData.delivery_address || prev.deliveryAddress,
          }));
        }
      } catch (err) {
        console.error("Erreur de vérification auth:", err);
      } finally {
        setCheckingAuth(false);
      }
    };

    if (items.length > 0) {
      checkUserAuth();
    }
  }, [navigate, items]);

  const itemTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const orderTotal = itemTotal + deliveryFee;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setClient((prev) => ({ ...prev, [name]: value }));
  };

  //  Soumission à l'API backend avec interception du status 401
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

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
        size: item.size || null,
      })),
    };

    try {
      const xsrfToken = getXsrfToken();
      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(xsrfToken ? { "X-XSRF-TOKEN": xsrfToken } : {}),
        },
        credentials: "include",
        body: JSON.stringify(orderPayload),
      });

      // Prise en charge du cas non-authentifié (401)
      if (response.status === 401) {
        navigate("/login", {
          state: {
            from: "/payment",
            items: items,
            message: "Votre session a expiré. Connectez-vous pour valider votre commande.",
          },
        });
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Échec du traitement de la commande.");
      }

      const paymentLabel = paymentMethod === "cash" ? "Espèces à la livraison" : paymentMethod.toUpperCase();
      alert(`Commande validée avec succès (${paymentLabel}) ! Un e-mail de confirmation vous a été envoyé.`);
      navigate("/profile");
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

  // Affichage pendant la vérification initiale de session
  if (checkingAuth) {
    return (
      <div className="py-24 text-center text-gray-500 font-medium bg-slate-50  min-h-screen flex flex-col items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-indigo-600 border-t-transparent mb-4"></div>
        <p className="text-sm">Vérification de votre session en cours...</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-50  py-12 px-4 sm:px-6 lg:px-8 w-full transition-colors min-h-screen">
      <div className="max-w-5xl mx-auto bg-white  rounded-3xl shadow-sm border border-gray-100  p-6 md:p-10">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900  mb-8 tracking-tight flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="currentColor" className="text-indigo-600" viewBox="0 0 16 16">
            <path d="M11 5.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5z"/>
            <path d="M2 2a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zm13 2v5H1V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1m-1 9H2a1 1 0 0 1-1-1v-1h14v1a1 1 0 0 1-1 1"/>
          </svg>
          Finaliser votre commande
        </h1>

        {error && (
          <div className="mb-6 p-4 text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-10 items-start">
          
          {/* COLONNE GAUCHE : Formulaire */}
          <div className="flex-1 w-full order-2 lg:order-1">
            <form onSubmit={handlePaymentSubmit} className="space-y-6">
              
              {/* MOYEN DE PAIEMENT */}
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-3">
                  1. Choisir le moyen de paiement
                </span>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  
                  {/* Option ESPÈCES */}
                  <label className={`border-2 rounded-2xl p-3 sm:p-4 flex flex-col justify-between cursor-pointer transition-all ${
                    paymentMethod === "cash" ? "border-green-600 bg-green-50/40 " : "border-gray-100 hover:border-gray-300"
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <input 
                        type="radio" 
                        name="payment" 
                        value="cash" 
                        checked={paymentMethod === "cash"}
                        onChange={() => setPaymentMethod("cash")}
                        className="text-green-600 focus:ring-green-600"
                      />
                      <span className="font-bold text-xs sm:text-sm text-slate-800">Espèces</span>
                    </div>
                    <span className="text-[10px] text-gray-500">À la livraison</span>
                  </label>

                  {/* Option WAVE */}
                  <label className={`border-2 rounded-2xl p-3 sm:p-4 flex flex-col justify-between cursor-pointer transition-all ${
                    paymentMethod === "wave" ? "border-sky-500 bg-sky-50/20" : "border-gray-100 hover:border-gray-300"
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <input 
                        type="radio" 
                        name="payment" 
                        value="wave" 
                        checked={paymentMethod === "wave"}
                        onChange={() => setPaymentMethod("wave")}
                        className="text-sky-500 focus:ring-sky-500"
                      />
                      <span className="font-bold text-xs sm:text-sm text-slate-800">Wave</span>
                    </div>
                    <span className="text-[10px] text-gray-500">Mobile Money</span>
                  </label>

                  {/* Option ORANGE MONEY */}
                  <label className={`border-2 rounded-2xl p-3 sm:p-4 flex flex-col justify-between cursor-pointer transition-all ${
                    paymentMethod === "orange" ? "border-orange-500 bg-orange-50/20 " : "border-gray-100 hover:border-gray-300"
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <input 
                        type="radio" 
                        name="payment" 
                        value="orange" 
                        checked={paymentMethod === "orange"}
                        onChange={() => setPaymentMethod("orange")}
                        className="text-orange-500 focus:ring-orange-500"
                      />
                      <span className="font-bold text-xs sm:text-sm text-slate-800 ">Orange</span>
                    </div>
                    <span className="text-[10px] text-gray-500">Orange Money</span>
                  </label>

                  {/* Option MTN */}
                  <label className={`border-2 rounded-2xl p-3 sm:p-4 flex flex-col justify-between cursor-pointer transition-all ${
                    paymentMethod === "mtn" ? "border-amber-500 bg-amber-50/20" : "border-gray-100 hover:border-gray-300"
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <input 
                        type="radio" 
                        name="payment" 
                        value="mtn" 
                        checked={paymentMethod === "mtn"}
                        onChange={() => setPaymentMethod("mtn")}
                        className="text-amber-500 focus:ring-amber-500"
                      />
                      <span className="font-bold text-xs sm:text-sm text-slate-800">MTN</span>
                    </div>
                    <span className="text-[10px] text-gray-500">MTN MoMo</span>
                  </label>

                </div>
              </div>

              {/* INFORMATIONS CLIENT */}
              <div className="border-t border-gray-100 pt-6">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-4">
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
                      className="w-full h-11 px-4 border border-gray-200 rounded-xl text-sm outline-none bg-slate-50/50 text-slate-800 focus:border-indigo-500" 
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 font-medium block mb-1">Numéro de Téléphone</label>
                    <input 
                      type="tel" 
                      name="phone"
                      value={client.phone}
                      onChange={handleInputChange}
                      className="w-full h-11 px-4 border border-gray-200  rounded-xl text-sm outline-none bg-slate-50/50 text-slate-800 focus:border-indigo-500" 
                      required
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs text-gray-400 font-medium block mb-1">Adresse e-mail (pour la confirmation)</label>
                    <input 
                      type="email" 
                      name="email"
                      value={client.email}
                      onChange={handleInputChange}
                      className="w-full h-11 px-4 border border-gray-200 rounded-xl text-sm outline-none bg-slate-50/50 text-slate-800  focus:border-indigo-500" 
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
                      className="w-full h-11 px-4 border border-gray-200 rounded-xl text-sm outline-none bg-slate-50/50 text-slate-800 focus:border-indigo-500" 
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
                      className="w-full h-11 px-4 border border-gray-200  rounded-xl text-sm outline-none bg-slate-50/500 text-slate-800 focus:border-indigo-500" 
                      required
                    />
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className={`w-full text-white py-4 rounded-xl font-bold text-sm shadow-md active:scale-[0.99] transition-all uppercase tracking-wider mt-4 disabled:opacity-50 ${
                  paymentMethod === "cash" 
                    ? "bg-green-600 hover:bg-green-700" 
                    : "bg-indigo-600 hover:bg-indigo-700 "
                }`}
              >
                {loading 
                  ? "Traitement en cours..." 
                  : paymentMethod === "cash"
                    ? `Valider la commande (${orderTotal.toLocaleString()} FCFA à la livraison)`
                    : `Confirmer et Payer ${orderTotal.toLocaleString()} FCFA`}
              </button>

            </form>
          </div>

          {/* COLONNE DROITE : Résumé de la commande */}
          <div className="w-full lg:w-80 order-1 lg:order-2 bg-slate-50 p-5 rounded-2xl border border-slate-100 lg:sticky lg:top-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-4">
              Résumé de la commande ({items.length} article{items.length > 1 ? "s" : ""})
            </span>

            <div className="max-h-60 overflow-y-auto space-y-3 pr-1">
              {items.map((item, index) => (
                <div key={item.id || index} className="flex gap-3 pb-3 border-b border-gray-200/60">
                  <div className="w-14 h-14 rounded-xl bg-gray-200 overflow-hidden flex-shrink-0">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Img</div>
                    )}
                  </div>
                  <div className="flex flex-col justify-center min-w-0 flex-1">
                    <h3 className="font-bold text-xs text-slate-800 dark:text- truncate">{item.name}</h3>
                    
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-[11px] text-gray-400">{item.category || "Général"}</p>
                      {item.size && (
                        <span className="text-[10px] bg-slate-200  text-slate-700 px-1.5 py-0.5 rounded font-bold">
                          Taille: {item.size}
                        </span>
                      )}
                    </div>

                    <div className="flex justify-between items-center mt-1 w-full">
                      <span className="text-xs font-medium text-gray-500 ">Qté : {item.quantity}</span>
                      <span className="text-xs font-bold text-indigo-600 ">{(item.price * item.quantity).toLocaleString()} FCFA</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2.5 pt-4 text-xs">
              <div className="flex justify-between text-gray-500 ">
                <span>Sous-total</span>
                <span className="font-semibold text-slate-800 ">{itemTotal.toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Frais de livraison ({client.city || "Abidjan"})</span>
                <span className="font-semibold text-slate-800 ">{deliveryFee.toLocaleString()} FCFA</span>
              </div>
              
              <div className="h-px bg-gray-200 my-2"></div>
              
              <div className="flex justify-between items-baseline text-sm">
                <span className="font-bold text-slate-800 ">Total Général</span>
                <span className="text-lg font-black text-indigo-600">{orderTotal.toLocaleString()} FCFA</span>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}

export default Payment;

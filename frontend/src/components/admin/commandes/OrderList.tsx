import { useState, useEffect } from "react";

// Interfaces TypeScript mises à jour avec la structure product & images
export interface User {
  id: number;
  name?: string;
  username?: string;
  email?: string;
}

export interface ProductImage {
  id?: number;
  image_path?: string;
  url?: string;
  is_primary?: boolean;
}

export interface Product {
  id: number;
  title?: string;
  image_url?: string | null;
  image_path?: string | null;
  image?: string | null;
  images?: ProductImage[] | string[];
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product_title: string;
  unit_price: string | number;
  quantity: number;
  size?: string | null;
  product?: Product | null; // 👈 Relation du produit incluant l'image
}

export interface OrderData {
  id: number;
  user_id: number;
  order_number: string;
  total_amount: string | number;
  status: string;
  city: string;
  shipping_address: string;
  phone: string;
  payment_method?: string;
  created_at: string;
  updated_at: string;
  user?: User;
  items?: OrderItem[];
}

function OrderList() {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Helper pour formater et valider les URLs d'images Laravel
  const formatImageUrl = (pathCandidate?: any): string | null => {
    if (!pathCandidate) return null;

    let target = pathCandidate;

    if (typeof pathCandidate === "object" && pathCandidate !== null) {
      target =
        pathCandidate.image_path ||
        pathCandidate.url ||
        pathCandidate.path ||
        pathCandidate.image ||
        "";
    }

    if (!target || typeof target !== "string") return null;

    if (
      target.startsWith("http://") ||
      target.startsWith("https://") ||
      target.startsWith("data:") ||
      target.startsWith("blob:")
    ) {
      return target;
    }

    const cleanPath = target.replace(/^\//, "");

    if (cleanPath.startsWith("storage/")) {
      return `http://localhost:8000/${cleanPath}`;
    }

    return `http://localhost:8000/storage/${cleanPath}`;
  };

  // Récupère l'image du produit liée à l'item de commande
  const getItemImage = (item: OrderItem): string | null => {
    if (!item) return null;

    const product = item.product;
    if (!product) return null;

    // 1. Chercher la propriété image_url (accessor Laravel / $appends)
    if (product.image_url) {
      return formatImageUrl(product.image_url);
    }

    // 2. Chercher dans les attributs directs du produit
    const directCandidate = product.image_path || product.image;
    if (directCandidate) {
      return formatImageUrl(directCandidate);
    }

    // 3. Chercher dans la relation d'images (tableau)
    if (Array.isArray(product.images) && product.images.length > 0) {
      const firstImg = product.images[0];
      return formatImageUrl(firstImg);
    }

    return null;
  };

  // Utilitaire pour récupérer le Cookie XSRF-TOKEN
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

  // Chargement des commandes depuis l'API Laravel
  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError(null);

      try {
        const xsrfToken = getXsrfToken();
        const headers: Record<string, string> = {
          Accept: "application/json",
          "Content-Type": "application/json",
        };
        if (xsrfToken) {
          headers["X-XSRF-TOKEN"] = xsrfToken;
        }

        const response = await fetch("http://localhost:8000/api/admin/orders", {
          method: "GET",
          headers,
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Impossible de charger la liste des commandes.");
        }

        const data = await response.json();
        const fetchedOrders = Array.isArray(data)
          ? data
          : data.orders || data.data || [];

        setOrders(fetchedOrders);
      } catch (err: any) {
        console.error("Erreur récupération commandes:", err);
        setError(err.message || "Une erreur est survenue lors du chargement.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (loading) {
    return (
      <div className="py-16 text-center text-gray-500 font-medium">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent mb-3"></div>
        <p className="text-sm">Chargement des commandes en cours...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      {/* Affichage d'erreur */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="font-bold text-red-700 ml-4 hover:underline"
          >
            Fermer
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Liste des Commandes
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Gérez et suivez l'état des dernières commandes récentes.
          </p>
        </div>
        <span className="text-xs font-semibold px-3 py-1 bg-gray-100 text-gray-700 rounded-full border border-gray-200">
          {orders.length} commande(s)
        </span>
      </div>

      {/* Container de la Liste */}
      {orders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-500 text-sm">
            Aucune commande enregistrée dans la base de données.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const orderId = order.order_number || `#${order.id}`;
            const amount = Number(order.total_amount || 0);

            const orderDate = order.created_at
              ? new Date(order.created_at).toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })
              : "-";

            const isPaid =
              order.status?.toLowerCase() === "paid" ||
              order.status?.toLowerCase() === "payé";

            const clientName =
              order.user?.name || order.user?.username || "Client Anonyme";
            const address = order.shipping_address || "Adresse non spécifiée";
            const city = order.city || "Abidjan";
            const phone = order.phone || "";

            const items = order.items || [];
            
            // Image du 1er article de la commande pour l'aperçu
            const firstItemImage = items.length > 0 ? getItemImage(items[0]) : null;

            return (
              <div
                key={order.id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 p-5 grid grid-cols-1 md:grid-cols-12 gap-4 items-center"
              >
                {/* 1. Image + Infos Produit / ID (Col 4) */}
                <div className="md:col-span-4 flex items-center space-x-4">
                  {/* Conteneur d'image */}
                  <div className="w-14 h-14 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0 overflow-hidden">
                    {firstItemImage ? (
                      <img
                        src={firstItemImage}
                        alt="Aperçu produit"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback si l'image ne charge pas
                          (e.target as HTMLElement).style.display = "none";
                          (e.target as HTMLElement).nextElementSibling?.classList.remove("hidden");
                        }}
                      />
                    ) : null}

                    {/* Icône de fallback si pas d'image */}
                    <div className={`flex items-center justify-center ${firstItemImage ? "hidden" : ""}`}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                        />
                      </svg>
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-mono font-bold text-indigo-600">
                      {orderId}
                    </span>
                    {items.length === 0 ? (
                      <p className="font-semibold text-gray-800 text-sm italic">
                        Aucun article
                      </p>
                    ) : (
                      items.map((item, idx) => (
                        <p
                          key={item.id || idx}
                          className="font-semibold text-gray-800 text-sm truncate"
                        >
                          {item.product_title}
                          {item.quantity > 1 && (
                            <span className="ml-2 text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                              x{item.quantity}
                            </span>
                          )}
                          {item.size && (
                            <span className="ml-1.5 text-xs text-gray-500 font-normal">
                              ({item.size})
                            </span>
                          )}
                        </p>
                      ))
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">{orderDate}</p>
                  </div>
                </div>

                {/* 2. Infos Client / Adresse (Col 3) */}
                <div className="md:col-span-3 text-sm">
                  <p className="font-semibold text-gray-900">{clientName}</p>
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {address}, {city}
                  </p>
                  {phone && (
                    <p className="text-xs font-mono text-gray-400 mt-0.5">
                      {phone}
                    </p>
                  )}
                </div>

                {/* 3. Montant & Statut (Col 5) */}
                <div className="md:col-span-5 flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 pt-3 md:pt-0 border-gray-100">
                  <div className="text-left md:text-right">
                    <p className="text-base font-bold text-gray-900">
                      {amount.toLocaleString("fr-FR")} FCFA
                    </p>
                  </div>

                  <div>
                    {isPaid ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Payé
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        En attente
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default OrderList;

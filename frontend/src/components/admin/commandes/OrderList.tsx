import { useState, useEffect } from "react";

// Configuration dynamique des URL d'API et de stockage
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
const STORAGE_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "");

// Interfaces TypeScript
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
  product?: Product | null;
}

export interface OrderData {
  id: number;
  user_id: number;
  order_number: string;
  total_amount: string | number;
  status: string;
  full_name: string;
  city: string;
  shipping_address: string;
  phone: string;
  payment_method?: string;
  is_read?: boolean | number;
  created_at: string;
  updated_at: string;
  user?: User;
  items?: OrderItem[];
}

interface OrderListProps {
  onOrdersUpdated?: () => void;
}

function OrderList({ onOrdersUpdated }: OrderListProps) {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // État pour la barre de recherche
  const [searchTerm, setSearchTerm] = useState<string>("");

  // 📄 GESTION DE LA PAGINATION (20 par page)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 20;

  // État pour la modale de détails de la commande
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);

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
      return `${STORAGE_BASE_URL}/${cleanPath}`;
    }

    return `${STORAGE_BASE_URL}/storage/${cleanPath}`;
  };

  // Récupère l'image du produit liée à l'item de commande
  const getItemImage = (item: OrderItem): string | null => {
    if (!item) return null;

    const product = item.product;
    if (!product) return null;

    if (product.image_url) {
      return formatImageUrl(product.image_url);
    }

    const directCandidate = product.image_path || product.image;
    if (directCandidate) {
      return formatImageUrl(directCandidate);
    }

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

  // Chargement des commandes depuis l'API
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

      const response = await fetch(`${API_BASE_URL}/admin/orders`, {
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

  useEffect(() => {
    fetchOrders();
  }, []);

  // Marquer une commande comme lue au clic
  const handleMarkAsRead = async (order: OrderData) => {
    if (!order.is_read) {
      try {
        const xsrfToken = getXsrfToken();
        const headers: Record<string, string> = {
          Accept: "application/json",
          "Content-Type": "application/json",
        };
        if (xsrfToken) headers["X-XSRF-TOKEN"] = xsrfToken;

        await fetch(`${API_BASE_URL}/admin/orders/${order.id}/read`, {
          method: "PATCH",
          headers,
          credentials: "include",
        });

        // Mettre à jour l'état local
        setOrders((prev) =>
          prev.map((o) => (o.id === order.id ? { ...o, is_read: true } : o))
        );

        // Notifier le composant parent
        if (onOrdersUpdated) {
          onOrdersUpdated();
        }
      } catch (err) {
        console.error("Erreur marquage commande comme lue:", err);
      }
    }

    setSelectedOrder(order);
  };

  // Filtrage en temps réel selon le numéro de commande, nom ou téléphone
  const filteredOrders = orders.filter((order) => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return true;

    const orderNumber = (order.order_number || `#${order.id}`).toLowerCase();
    const clientName = (order.full_name || order.user?.name || "").toLowerCase();
    const phone = (order.phone || "").toLowerCase();

    return (
      orderNumber.includes(query) ||
      clientName.includes(query) ||
      phone.includes(query)
    );
  });

  // 📄 CALCUL DES COMMANDES POUR LA PAGE ACTIVE
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  // Remise à la première page lors d'une recherche
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  // Badge du moyen de paiement
  const renderPaymentBadge = (method?: string) => {
    const m = (method || "").toLowerCase().trim();

    if (m.includes("wave")) {
      return (
        <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-sky-100 text-sky-800 border border-sky-200">
          Wave
        </span>
      );
    }
    if (m.includes("orange") || m.includes("om")) {
      return (
        <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-orange-100 text-orange-800 border border-orange-200">
          Orange Money
        </span>
      );
    }
    if (m.includes("mtn") || m.includes("momo")) {
      return (
        <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-yellow-100 text-yellow-800 border border-blue-200">
          MTN Money
        </span>
      );
    }
    if (m.includes("card") || m.includes("carte") || m.includes("stripe")) {
      return (
        <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-purple-100 text-purple-800 border border-purple-200">
          Carte Bancaire
        </span>
      );
    }
    if (m.includes("cash") || m.includes("livraison")) {
      return (
        <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200">
          À la livraison
        </span>
      );
    }

    return (
      <span className="px-2.5 py-1 text-xs font-medium rounded-lg bg-gray-100 text-gray-700 border border-gray-200">
        {method || "Non spécifié"}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="py-16 text-center text-gray-500 font-medium">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent mb-3"></div>
        <p className="text-sm">Chargement des commandes en cours...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 relative">
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

      {/* Top Header avec Barre de Recherche */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Liste des Commandes
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Gérez et suivez l'état des dernières commandes récentes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Champ de Recherche */}
          <div className="relative w-full sm:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-4 w-4 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Rechercher (N° CMD, Nom...)"
              className="w-full pl-9 pr-8 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => handleSearchChange("")}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>

          <span className="text-xs font-semibold px-3 py-2 bg-gray-100 text-gray-700 rounded-lg border border-gray-200 shrink-0">
            {filteredOrders.length} / {orders.length}
          </span>
        </div>
      </div>

      {/* Container de la Liste */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200 space-y-3">
          <p className="text-gray-500 text-sm">
            {searchTerm
              ? `Aucune commande ne correspond à la recherche "${searchTerm}".`
              : "Aucune commande enregistrée dans la base de données."}
          </p>
          {searchTerm && (
            <button
              onClick={() => handleSearchChange("")}
              className="text-xs font-semibold text-indigo-600 hover:underline"
            >
              Effacer la recherche
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Rendu dynamique des 20 commandes paginées */}
          {paginatedOrders.map((order) => {
            const orderId = order.order_number || `#${order.id}`;
            const amount = Number(order.total_amount || 0);
            const isUnread = !order.is_read;

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
              order.full_name || order.user?.name || "Client Anonyme";
            const address = order.shipping_address || "Adresse non spécifiée";
            const city = order.city || "Abidjan";
            const phone = order.phone || "";

            const items = order.items || [];
            const firstItemImage = items.length > 0 ? getItemImage(items[0]) : null;

            return (
              <div
                key={order.id}
                onClick={() => handleMarkAsRead(order)}
                className={`rounded-xl border transition-all duration-200 p-5 grid grid-cols-1 md:grid-cols-12 gap-4 items-center cursor-pointer ${
                  isUnread
                    ? "bg-blue-50/40 border-blue-300 shadow-sm hover:shadow-md ring-1 ring-blue-200"
                    : "bg-white border-gray-200 shadow-sm hover:shadow-md hover:bg-gray-50/50"
                }`}
              >
                {/* 1. Image + Infos Produit / ID (Col 5) */}
                <div className="md:col-span-5 flex items-center space-x-4">
                  <div className="w-20 h-20 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0 overflow-hidden relative shadow-xs">
                    {firstItemImage ? (
                      <img
                        src={firstItemImage}
                        alt="Aperçu produit"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                          (e.target as HTMLElement).nextElementSibling?.classList.remove("hidden");
                        }}
                      />
                    ) : null}

                    <div className={`flex items-center justify-center ${firstItemImage ? "hidden" : ""}`}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-8 w-8 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                        />
                      </svg>
                    </div>
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-indigo-600">
                        {orderId}
                      </span>
                      {isUnread && (
                        <span className="bg-blue-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                          Nouveau
                        </span>
                      )}
                    </div>

                    {items.length === 0 ? (
                      <p className="font-semibold text-gray-800 text-sm italic">
                        Aucun article
                      </p>
                    ) : (
                      items.map((item, idx) => (
                        <div key={item.id || idx} className="flex items-center flex-wrap gap-1.5 text-sm">
                          <span className="font-semibold text-gray-800 truncate">
                            {item.product_title}
                          </span>
                          {item.quantity > 1 && (
                            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                              x{item.quantity}
                            </span>
                          )}
                          {item.size && (
                            <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                              Taille: {item.size}
                            </span>
                          )}
                        </div>
                      ))
                    )}
                    <p className="text-xs text-gray-400">{orderDate}</p>
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

                {/* 3. Moyen de Paiement (Col 2) */}
                <div className="md:col-span-2 text-left md:text-center">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1 block md:hidden">
                    Paiement
                  </p>
                  {renderPaymentBadge(order.payment_method)}
                </div>

                {/* 4. Montant & Statut (Col 2) */}
                <div className="md:col-span-2 flex items-center justify-between md:justify-end gap-3 border-t md:border-t-0 pt-3 md:pt-0 border-gray-100">
                  <div className="text-left md:text-right">
                    <p className="text-base font-bold text-gray-900">
                      {amount.toLocaleString("fr-FR")} FCFA
                    </p>
                    <div className="mt-1">
                      {isPaid ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Payé
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                          En attente
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 📄 CONTRÔLES DE PAGINATION */}
      {!loading && !error && filteredOrders.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 pt-4 border-t border-gray-200">
          <div>
            <span className="text-sm text-gray-600">
              Affichage de {startIndex + 1} à{" "}
              {Math.min(endIndex, filteredOrders.length)} sur {filteredOrders.length} commande(s)
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm transition"
            >
              Précédent
            </button>

            <span className="text-sm text-gray-700 font-medium px-2">
              Page {currentPage} sur {totalPages || 1}
            </span>

            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage >= totalPages}
              className="px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm transition"
            >
              Suivant
            </button>
          </div>
        </div>
      )}

      {/* MODALE DÉTAILS DE LA COMMANDE */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Bouton de Fermeture */}
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition"
            >
              ✕
            </button>

            {/* En-tête Modale */}
            <div className="border-b border-gray-200 pb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full uppercase">
                  Détails Commande
                </span>
                {selectedOrder.status?.toLowerCase() === "paid" || selectedOrder.status?.toLowerCase() === "payé" ? (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                    Payé
                  </span>
                ) : (
                  <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                    En attente
                  </span>
                )}
              </div>
              <h3 className="text-2xl font-extrabold text-gray-900 mt-2">
                {selectedOrder.order_number || `#${selectedOrder.id}`}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Passée le {selectedOrder.created_at ? new Date(selectedOrder.created_at).toLocaleString("fr-FR") : "-"}
              </p>
            </div>

            {/* Informations Client & Livraison */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase">Client</p>
                <p className="text-sm font-bold text-gray-800 mt-0.5">
                  {selectedOrder.full_name || selectedOrder.user?.name || "Client Anonyme"}
                </p>
                {selectedOrder.phone && (
                  <p className="text-xs font-mono text-gray-600 mt-1">📞 {selectedOrder.phone}</p>
                )}
              </div>
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase">Adresse de Livraison</p>
                <p className="text-sm font-bold text-gray-800 mt-0.5">{selectedOrder.shipping_address || "Non renseignée"}</p>
                <p className="text-xs text-gray-600 mt-0.5">{selectedOrder.city || "Abidjan"}</p>
              </div>
            </div>

            {/* Moyen de Paiement */}
            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-200">
              <span className="text-xs font-bold text-gray-500 uppercase">Moyen de Paiement</span>
              <div>{renderPaymentBadge(selectedOrder.payment_method)}</div>
            </div>

            {/* Articles Commandés */}
            <div className="space-y-3">
              <p className="text-xs text-gray-400 font-bold uppercase">Articles Commandés</p>
              <div className="space-y-3">
                {(selectedOrder.items || []).map((item, idx) => {
                  const img = getItemImage(item);
                  const price = Number(item.unit_price || 0);

                  return (
                    <div
                      key={item.id || idx}
                      className="flex items-center gap-4 bg-white p-3 rounded-xl border border-gray-200 shadow-2xs"
                    >
                      <div className="w-20 h-20 rounded-lg bg-gray-100 border border-gray-200 shrink-0 overflow-hidden relative">
                        {img ? (
                          <img
                            src={img}
                            alt={item.product_title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                            Pas d'image
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-800 text-sm">{item.product_title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500 font-medium">
                            Quantité: <strong className="text-gray-800">{item.quantity}</strong>
                          </span>
                          {item.size && (
                            <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                              Taille: {item.size}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-indigo-600 font-semibold mt-1">
                          {price.toLocaleString("fr-FR")} FCFA / unité
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-extrabold text-gray-900">
                          {(price * item.quantity).toLocaleString("fr-FR")} FCFA
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pied de Modale : Total */}
            <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
              <span className="text-base font-extrabold text-gray-900">Total de la commande</span>
              <span className="text-xl font-extrabold text-indigo-600">
                {Number(selectedOrder.total_amount || 0).toLocaleString("fr-FR")} FCFA
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrderList;

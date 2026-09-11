import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  RefreshCw,
  ShoppingBag,
  User,
  MapPin,
  Phone,
  CreditCard,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  X,
  AlertCircle,
  Eye,
  ArrowLeft,
  ImageOff,
  PackageCheck,
  Bell
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
const STORAGE_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "");

// Interfaces TypeScript
export interface UserData {
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
  user?: UserData;
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

  // Gestion de la pagination (20 par page)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 20;

  // Modale de détails
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

  // Utilitaire Cookie XSRF-TOKEN
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

  // Chargement des commandes
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

  // Marquer comme lue au clic
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

        setOrders((prev) =>
          prev.map((o) => (o.id === order.id ? { ...o, is_read: true } : o))
        );

        if (onOrdersUpdated) {
          onOrdersUpdated();
        }
      } catch (err) {
        console.error("Erreur marquage commande comme lue:", err);
      }
    }

    setSelectedOrder(order);
  };

  // Filtrage
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

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const unreadCount = orders.filter((o) => !o.is_read).length;

  // Badge du moyen de paiement
  const renderPaymentBadge = (method?: string) => {
    const m = (method || "").toLowerCase().trim();

    if (m.includes("wave")) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-sky-50 text-sky-700 border border-sky-200/80">
          Wave
        </span>
      );
    }
    if (m.includes("orange") || m.includes("om")) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-orange-50 text-orange-700 border border-orange-200/80">
          Orange Money
        </span>
      );
    }
    if (m.includes("mtn") || m.includes("momo")) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-50 text-amber-700 border border-amber-200/80">
          MTN Money
        </span>
      );
    }
    if (m.includes("card") || m.includes("carte") || m.includes("stripe")) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-purple-50 text-purple-700 border border-purple-200/80">
          Carte Bancaire
        </span>
      );
    }
    if (m.includes("cash") || m.includes("livraison")) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/80">
          À la livraison
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 text-slate-600 border border-slate-200/80">
        {method || "Non spécifié"}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Total Commandes
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{orders.length}</p>
          </div>
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <ShoppingBag size={20} />
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Non lues
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{unreadCount}</p>
          </div>
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
            <Bell size={20} />
          </div>
        </div>
      </div>

      {/* Barre d'action & Recherche */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Navigation */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Link
            to="/admin/dashboard"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Retour</span>
          </Link>
        </div>

        {/* Recherche et Actualisation */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Rechercher (N° CMD, Nom, Tél)..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
            />
            {searchTerm && (
              <button
                onClick={() => handleSearchChange("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <button
            onClick={fetchOrders}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            title="Actualiser"
          >
            <RefreshCw size={16} className={loading ? "animate-spin text-indigo-600" : ""} />
          </button>
        </div>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-xs flex justify-between items-center">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchOrders}
            className="px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 font-semibold rounded-lg text-[11px]"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* Container Liste des Commandes */}
      {loading ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center text-slate-400">
          <div className="flex flex-col items-center justify-center gap-2">
            <RefreshCw className="animate-spin text-indigo-600" size={24} />
            <span className="text-xs font-medium">Chargement des commandes...</span>
          </div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center space-y-2">
          <p className="text-xs font-medium text-slate-500">
            {searchTerm
              ? `Aucune commande ne correspond à "${searchTerm}"`
              : "Aucune commande enregistrée."}
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
        <div className="space-y-3">
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
                className={`group rounded-2xl border transition-all duration-200 p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center cursor-pointer ${
                  isUnread
                    ? "bg-indigo-50/40 border-indigo-200/80 hover:bg-indigo-50/70"
                    : "bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/50"
                }`}
              >
                {/* 1. Visuel + Nom & Articles (Col 5) */}
                <div className="md:col-span-5 flex items-center space-x-3.5">
                  <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200/80 flex items-center justify-center shrink-0 overflow-hidden relative">
                    {firstItemImage ? (
                      <img
                        src={firstItemImage}
                        alt="Produit"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                          (e.target as HTMLElement).nextElementSibling?.classList.remove("hidden");
                        }}
                      />
                    ) : null}

                    <div className={`flex items-center justify-center text-slate-400 ${firstItemImage ? "hidden" : ""}`}>
                      <ImageOff size={20} />
                    </div>
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-indigo-600">
                        {orderId}
                      </span>
                      {isUnread && (
                        <span className="bg-indigo-600 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Nouveau
                        </span>
                      )}
                    </div>

                    {items.length === 0 ? (
                      <p className="font-semibold text-slate-400 text-xs italic">
                        Aucun article
                      </p>
                    ) : (
                      items.map((item, idx) => (
                        <div key={item.id || idx} className="flex items-center flex-wrap gap-1.5 text-xs">
                          <span className="font-semibold text-slate-800 truncate">
                            {item.product_title}
                          </span>
                          {item.quantity > 1 && (
                            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md border border-indigo-100">
                              x{item.quantity}
                            </span>
                          )}
                          {item.size && (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200/80 px-1.5 py-0.5 rounded-md">
                              Taille: {item.size}
                            </span>
                          )}
                        </div>
                      ))
                    )}
                    <p className="text-[11px] text-slate-400">{orderDate}</p>
                  </div>
                </div>

                {/* 2. Infos Client / Adresse (Col 3) */}
                <div className="md:col-span-3 text-xs space-y-0.5">
                  <p className="font-bold text-slate-900">{clientName}</p>
                  <p className="text-slate-500 truncate">{address}, {city}</p>
                  {phone && (
                    <p className="font-mono text-slate-400 text-[11px]">{phone}</p>
                  )}
                </div>

                {/* 3. Moyen de Paiement (Col 2) */}
                <div className="md:col-span-2 text-left md:text-center">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1 block md:hidden">
                    Paiement
                  </p>
                  {renderPaymentBadge(order.payment_method)}
                </div>

                {/* 4. Montant & Statut (Col 2) */}
                <div className="md:col-span-2 flex items-center justify-between md:justify-end gap-3 border-t md:border-t-0 pt-2.5 md:pt-0 border-slate-100">
                  <div className="text-left md:text-right">
                    <p className="text-sm font-bold text-slate-900">
                      {amount.toLocaleString("fr-FR")} FCFA
                    </p>
                    <div className="mt-0.5">
                      {isPaid ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                          <CheckCircle2 size={12} />
                          Payé
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200/80">
                          <Clock size={12} />
                          En attente
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-slate-300 group-hover:text-indigo-600 transition-colors hidden sm:block">
                    <Eye size={18} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && filteredOrders.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2 text-xs text-slate-500">
          <div>
            Affichage de <span className="font-semibold text-slate-800">{startIndex + 1}</span> à{" "}
            <span className="font-semibold text-slate-800">{Math.min(endIndex, filteredOrders.length)}</span> sur{" "}
            <span className="font-semibold text-slate-800">{filteredOrders.length}</span> commande(s)
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>

            <span className="px-3 py-1 font-semibold text-slate-700 bg-slate-100 rounded-lg">
              {currentPage} / {totalPages || 1}
            </span>

            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Modale Détails de la Commande */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl space-y-5 relative max-h-[90vh] overflow-y-auto border border-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Bouton Fermer */}
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <X size={18} />
            </button>

            {/* En-tête Modale */}
            <div className="border-b border-slate-100 pb-4 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full uppercase">
                  Détails Commande
                </span>
                {selectedOrder.status?.toLowerCase() === "paid" || selectedOrder.status?.toLowerCase() === "payé" ? (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full">
                    Payé
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200/80 px-2.5 py-0.5 rounded-full">
                    En attente
                  </span>
                )}
              </div>
              <h3 className="text-xl font-bold text-slate-900 pt-1">
                {selectedOrder.order_number || `#${selectedOrder.id}`}
              </h3>
              <p className="text-xs text-slate-400">
                Passée le {selectedOrder.created_at ? new Date(selectedOrder.created_at).toLocaleString("fr-FR") : "-"}
              </p>
            </div>

            {/* Infos Client & Livraison */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80 text-xs">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <User size={12} /> Client
                </p>
                <p className="font-bold text-slate-800">
                  {selectedOrder.full_name || selectedOrder.user?.name || "Client Anonyme"}
                </p>
                {selectedOrder.phone && (
                  <p className="font-mono text-slate-500 flex items-center gap-1">
                    <Phone size={11} /> {selectedOrder.phone}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <MapPin size={12} /> Livraison
                </p>
                <p className="font-semibold text-slate-800">{selectedOrder.shipping_address || "Non renseignée"}</p>
                <p className="text-slate-500">{selectedOrder.city || "Abidjan"}</p>
              </div>
            </div>

            {/* Moyen de Paiement */}
            <div className="flex items-center justify-between bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80 text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <CreditCard size={12} /> Paiement
              </span>
              <div>{renderPaymentBadge(selectedOrder.payment_method)}</div>
            </div>

            {/* Articles Commandés */}
            <div className="space-y-2.5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <PackageCheck size={12} /> Articles ({selectedOrder.items?.length || 0})
              </p>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {(selectedOrder.items || []).map((item, idx) => {
                  const img = getItemImage(item);
                  const price = Number(item.unit_price || 0);

                  return (
                    <div
                      key={item.id || idx}
                      className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-slate-200/80"
                    >
                      <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200/80 shrink-0 overflow-hidden relative flex items-center justify-center">
                        {img ? (
                          <img
                            src={img}
                            alt={item.product_title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageOff size={16} className="text-slate-400" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0 text-xs space-y-0.5">
                        <p className="font-bold text-slate-800 truncate">{item.product_title}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500">
                            Qté: <strong className="text-slate-800">{item.quantity}</strong>
                          </span>
                          {item.size && (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200/80 px-1.5 py-0.5 rounded-md">
                              Taille: {item.size}
                            </span>
                          )}
                        </div>
                        <p className="text-indigo-600 font-semibold">
                          {price.toLocaleString("fr-FR")} FCFA / unité
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-xs font-bold text-slate-900">
                          {(price * item.quantity).toLocaleString("fr-FR")} FCFA
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Total */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-sm font-bold text-slate-800">Total de la commande</span>
              <span className="text-lg font-bold text-indigo-600">
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

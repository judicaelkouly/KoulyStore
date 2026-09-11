import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import ProductList from "./products/ProductList";
import UserList from "./user/UserList";
import OrderList from "./commandes/OrderList";
import CategoryList from "./categories/CategoryList";
import BannerList from "./bannieres/BannerList";
import ReturnList from "./returns/ReturnList";

import { 
  LayoutDashboard, 
  Users, 
  Package, 
  FolderTree, 
  ShoppingBag, 
  RotateCcw, 
  Image as ImageIcon, 
  BarChart3, 
  Home, 
  LogOut, 
  Menu, 
  X, 
  DollarSign, 
  TrendingUp, 
  RefreshCw,
  ChevronRight,
  ShieldCheck,
  AlertCircle
} from "lucide-react";

import logo from '../../assets/logo4.png';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
const STORAGE_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "");

interface OrderSummary {
  id: number;
  total_amount: string | number;
  status?: string;
  created_at?: string;
  user?: { name?: string; username?: string };
}

interface ItemSummary {
  id: number;
}

interface ReturnSummary {
  id: number;
  status: string;
}

interface UserProfileData {
  username?: string;
  name?: string;
  avatarUrl?: string;
  avatar_url?: string;
  avatar?: string;
}

function AdminPage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 
  const navigate = useNavigate();

  // États KPI
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [totalOrdersCount, setTotalOrdersCount] = useState<number>(0);
  const [unreadOrdersCount, setUnreadOrdersCount] = useState<number>(0);
  const [pendingReturnsCount, setPendingReturnsCount] = useState<number>(0);
  const [totalUsersCount, setTotalUsersCount] = useState<number>(0);
  const [totalProductsCount, setTotalProductsCount] = useState<number>(0);
  const [totalCategoriesCount, setTotalCategoriesCount] = useState<number>(0);
  const [recentOrders, setRecentOrders] = useState<OrderSummary[]>([]);
  const [loadingKpis, setLoadingKpis] = useState<boolean>(true);

  // Profil Admin
  const [adminUser, setAdminUser] = useState<UserProfileData | null>(null);

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

  const formatAvatarUrl = (path?: string) => {
    if (!path) return null;
    if (path.startsWith("http") || path.startsWith("blob:") || path.startsWith("data:")) {
      return path;
    }
    const cleanPath = path.replace(/^\//, "").replace(/^storage\//, "");
    return `${STORAGE_BASE_URL}/storage/${cleanPath}`;
  };

  const fetchDashboardStats = async () => {
    setLoadingKpis(true);
    const xsrfToken = getXsrfToken();
    const headers: Record<string, string> = {
      Accept: "application/json",
      "Content-Type": "application/json",
    };
    if (xsrfToken) headers["X-XSRF-TOKEN"] = xsrfToken;

    try {
      const [ordersRes, unreadRes, returnsRes, usersRes, productsRes, categoriesRes, profileRes] = await Promise.allSettled([
        fetch(`${API_BASE_URL}/admin/orders`, { headers, credentials: "include" }),
        fetch(`${API_BASE_URL}/admin/orders/unread-count`, { headers, credentials: "include" }),
        fetch(`${API_BASE_URL}/admin/returns`, { headers, credentials: "include" }),
        fetch(`${API_BASE_URL}/users`, { headers, credentials: "include" }),
        fetch(`${API_BASE_URL}/products`, { headers, credentials: "include" }),
        fetch(`${API_BASE_URL}/categories`, { headers, credentials: "include" }),
        fetch(`${API_BASE_URL}/profile`, { headers, credentials: "include" }),
      ]);

      if (ordersRes.status === "fulfilled" && ordersRes.value.ok) {
        const dataData = await ordersRes.value.json();
        const ordersList: OrderSummary[] = Array.isArray(dataData)
          ? dataData
          : dataData.orders || dataData.data || [];

        setTotalOrdersCount(ordersList.length);
        setRecentOrders(ordersList.slice(0, 5)); // 5 dernières commandes

        const revenue = ordersList.reduce((acc, order) => {
          return acc + (Number(order.total_amount) || 0);
        }, 0);
        setTotalRevenue(revenue);
      }

      if (unreadRes.status === "fulfilled" && unreadRes.value.ok) {
        const unreadData = await unreadRes.value.json();
        setUnreadOrdersCount(unreadData.count || 0);
      }

      if (returnsRes.status === "fulfilled" && returnsRes.value.ok) {
        const returnsData = await returnsRes.value.json();
        const returnsList: ReturnSummary[] = Array.isArray(returnsData)
          ? returnsData
          : returnsData.data || [];
        
        const pendingCount = returnsList.filter((item) => item.status === "pending").length;
        setPendingReturnsCount(pendingCount);
      }

      if (usersRes.status === "fulfilled" && usersRes.value.ok) {
        const usersData = await usersRes.value.json();
        const usersList: ItemSummary[] = Array.isArray(usersData)
          ? usersData
          : usersData.users || usersData.data || [];
        setTotalUsersCount(usersList.length);
      }

      if (productsRes.status === "fulfilled" && productsRes.value.ok) {
        const productsData = await productsRes.value.json();
        const productsList: ItemSummary[] = Array.isArray(productsData)
          ? productsData
          : productsData.products || productsData.data || [];
        setTotalProductsCount(productsList.length);
      }

      if (categoriesRes.status === "fulfilled" && categoriesRes.value.ok) {
        const categoriesData = await categoriesRes.value.json();
        const categoriesList: ItemSummary[] = Array.isArray(categoriesData)
          ? categoriesData
          : categoriesData.categories || categoriesData.data || [];
        setTotalCategoriesCount(categoriesList.length);
      }

      if (profileRes.status === "fulfilled" && profileRes.value.ok) {
        const profileData = await profileRes.value.json();
        const userData = profileData.user || profileData.data || profileData;
        setAdminUser(userData);
      }

    } catch (err) {
      console.error("Erreur KPI:", err);
    } finally {
      setLoadingKpis(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const handleLogout = async () => {
    const xsrfToken = getXsrfToken();
    const headers: Record<string, string> = {
      Accept: "application/json",
      "Content-Type": "application/json",
    };
    if (xsrfToken) headers["X-XSRF-TOKEN"] = xsrfToken;

    try {
      const response = await fetch(`${API_BASE_URL}/logout`, {
        method: "POST",
        headers,
        credentials: "include",
      });

      if (response.ok) {
        navigate("/");
      }
    } catch (error) {
      console.error("Erreur déconnexion:", error);
    }
  };

  const navItems = [
    { id: "dashboard", label: "Tableau de bord", icon: <LayoutDashboard size={18} /> },
    { id: "orders", label: "Commandes", icon: <ShoppingBag size={18} />, badge: unreadOrdersCount, badgeColor: "bg-indigo-500" },
    { id: "returns", label: "Retours", icon: <RotateCcw size={18} />, badge: pendingReturnsCount, badgeColor: "bg-amber-500" },
    { id: "products", label: "Produits", icon: <Package size={18} /> },
    { id: "categories", label: "Catégories", icon: <FolderTree size={18} /> },
    { id: "users", label: "Clients", icon: <Users size={18} /> },
    { id: "banner", label: "Bannières & Pubs", icon: <ImageIcon size={18} /> },
    { id: "analytics", label: "Statistiques", icon: <BarChart3 size={18} /> },
  ];

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    setIsSidebarOpen(false); 
  };

  const renderMainContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <div className="space-y-6">
            {/* Bannière d'alerte e-commerce rapide */}
            {(unreadOrdersCount > 0 || pendingReturnsCount > 0) && (
              <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-lg border border-indigo-700/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-indigo-500/20 text-indigo-300 rounded-xl border border-indigo-400/30">
                    <AlertCircle size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">Actions requises aujourd'hui</h3>
                    <p className="text-xs text-indigo-200 mt-0.5">
                      {unreadOrdersCount > 0 && `${unreadOrdersCount} nouvelle(s) commande(s) à traiter. `}
                      {pendingReturnsCount > 0 && `${pendingReturnsCount} demande(s) de retour en attente.`}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  {unreadOrdersCount > 0 && (
                    <button 
                      onClick={() => setActiveTab("orders")}
                      className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors flex-1 sm:flex-none text-center"
                    >
                      Voir Commandes
                    </button>
                  )}
                  {pendingReturnsCount > 0 && (
                    <button 
                      onClick={() => setActiveTab("returns")}
                      className="px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg transition-colors flex-1 sm:flex-none text-center"
                    >
                      Gérer Retours
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {/* Chiffre d'affaires */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">C.A Total</span>
                  <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                    <DollarSign size={18} />
                  </div>
                </div>
                <p className="text-lg font-extrabold text-slate-900 truncate" title={`${totalRevenue.toLocaleString("fr-FR")} FCFA`}>
                  {loadingKpis ? "..." : `${totalRevenue.toLocaleString("fr-FR")} F`}
                </p>
                <div className="mt-2 flex items-center text-[11px] font-medium text-emerald-600">
                  <TrendingUp size={12} className="mr-1" />
                  <span>En constante hausse</span>
                </div>
              </div>

              {/* Commandes */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Commandes</span>
                  <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                    <ShoppingBag size={18} />
                  </div>
                </div>
                <p className="text-2xl font-extrabold text-slate-900">
                  {loadingKpis ? "..." : totalOrdersCount.toLocaleString("fr-FR")}
                </p>
                <div className="mt-2">
                  {unreadOrdersCount > 0 ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
                      ● {unreadOrdersCount} nouvelles
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium text-slate-400">À jour</span>
                  )}
                </div>
              </div>

              {/* Retours */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Retours</span>
                  <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                    <RotateCcw size={18} />
                  </div>
                </div>
                <p className="text-2xl font-extrabold text-slate-900">
                  {loadingKpis ? "..." : pendingReturnsCount.toLocaleString("fr-FR")}
                </p>
                <div className="mt-2">
                  {pendingReturnsCount > 0 ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                      ● Action requise
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium text-emerald-600">Aucun litige</span>
                  )}
                </div>
              </div>

              {/* Produits */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Produits</span>
                  <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                    <Package size={18} />
                  </div>
                </div>
                <p className="text-2xl font-extrabold text-slate-900">
                  {loadingKpis ? "..." : totalProductsCount.toLocaleString("fr-FR")}
                </p>
                <p className="mt-2 text-[11px] font-medium text-slate-400">Actifs sur le shop</p>
              </div>

              {/* Clients */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Clients</span>
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                    <Users size={18} />
                  </div>
                </div>
                <p className="text-2xl font-extrabold text-slate-900">
                  {loadingKpis ? "..." : totalUsersCount.toLocaleString("fr-FR")}
                </p>
                <p className="mt-2 text-[11px] font-medium text-slate-400">Comptes enregistrés</p>
              </div>

              {/* Catégories */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Catégories</span>
                  <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
                    <FolderTree size={18} />
                  </div>
                </div>
                <p className="text-2xl font-extrabold text-slate-900">
                  {loadingKpis ? "..." : totalCategoriesCount.toLocaleString("fr-FR")}
                </p>
                <p className="mt-2 text-[11px] font-medium text-slate-400">Rayons configurés</p>
              </div>
            </div>

            {/* Section Aperçu rapide des commandes */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-800">Commandes Récentes</h3>
                  <p className="text-xs text-slate-500">Aperçu rapide des flux d'achats</p>
                </div>
                <button
                  onClick={() => setActiveTab("orders")}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  Tout afficher <ChevronRight size={14} />
                </button>
              </div>

              {recentOrders.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  Aucune commande récente à afficher
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                      <tr>
                        <th className="py-3 px-4">ID</th>
                        <th className="py-3 px-4">Client</th>
                        <th className="py-3 px-4">Montant</th>
                        <th className="py-3 px-4">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {recentOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-900">#{order.id}</td>
                          <td className="py-3 px-4">{order.user?.name || order.user?.username || "Client Inconnu"}</td>
                          <td className="py-3 px-4 font-semibold text-slate-900">
                            {Number(order.total_amount).toLocaleString("fr-FR")} F
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 capitalize">
                              {order.status || "En attente"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        );

      case "users":
        return (
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm overflow-x-auto">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Gestion des Clients</h2>
            <UserList />
          </div>
        );

      case "categories":
        return (
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm overflow-x-auto">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Gestion des Catégories</h2>
            <CategoryList />
          </div>
        );

      case "analytics":
        return (
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Analytique & Performances</h2>
            <p className="text-sm text-slate-500">Moyenne du panier, taux de conversion et rapports mensuels.</p>
          </div>
        );

      case "orders":
        return (
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm overflow-x-auto">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Gestion des Commandes</h2>
            <OrderList onOrdersUpdated={fetchDashboardStats} />
          </div>
        );

      case "returns":
        return (
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm overflow-x-auto">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Retours & Service Après-Vente</h2>
            <ReturnList onReturnsUpdated={fetchDashboardStats} />
          </div>
        );

      case "banner":
        return (
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm overflow-x-auto">
            <BannerList />
          </div>
        );

      case "products":
        return (
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm overflow-x-auto">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Catalogue Produits</h2>
            <ProductList />
          </div>
        );

      default:
        return null;
    }
  };

  const adminAvatar = formatAvatarUrl(
    adminUser?.avatarUrl || adminUser?.avatar_url || adminUser?.avatar
  );
  const adminName = adminUser?.username || adminUser?.name || "Administrateur";

  return (
    <div className="bg-slate-50 text-slate-800 min-h-screen flex flex-col antialiased">
      {/* Overlay Mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Ultra-Moderne */}
      <aside 
        className={`fixed inset-y-0 left-0 w-64 bg-slate-900 text-slate-300 z-50 flex flex-col justify-between border-r border-slate-800 transform transition-transform duration-300 ease-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800/80">
            <Link to="/" className="flex items-center gap-3">
              <img 
                src={logo}
                alt="Kouly'Store Logo"
                className="h-9 w-auto object-contain"
              />
            </Link>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden text-slate-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="mt-4 px-3 flex-1 space-y-1.5 overflow-y-auto">
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Menu principal
            </div>
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all duration-150 group ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                      : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200"}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>

                  {item.badge && item.badge > 0 ? (
                    <span className={`text-[10px] font-bold text-white px-2 py-0.5 rounded-full ${item.badgeColor || "bg-indigo-500"}`}>
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>

          {/* Footer Sidebar */}
          <div className="p-3 border-t border-slate-800/80 space-y-2">
            <Link
              to="/"
              className="flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
            >
              <Home size={18} />
              <span>Voir la boutique</span>
            </Link>

            <div className="bg-slate-800/50 border border-slate-800 p-2.5 rounded-xl flex items-center gap-3">
              {adminAvatar ? (
                <img
                  src={adminAvatar}
                  alt={adminName}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-500/50"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs ring-2 ring-indigo-500/30">
                  {adminName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="overflow-hidden">
                <p className="text-white text-xs font-semibold truncate">{adminName}</p>
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                  <ShieldCheck size={10} /> Admin
                </span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Layout */}
      <div className="lg:ml-64 flex flex-col flex-1 min-h-screen">
        {/* Header Responsive */}
        <header className="bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-slate-200/80">
          <div className="px-4 sm:px-6 py-3.5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  aria-label="Ouvrir le menu"
                >
                  <Menu size={20} />
                </button>
                <div>
                  <h1 className="text-base sm:text-lg font-bold text-slate-900 capitalize flex items-center gap-2">
                    {navItems.find(i => i.id === activeTab)?.label || activeTab}
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Bouton rafraîchir KPI */}
                <button
                  onClick={fetchDashboardStats}
                  title="Rafraîchir les données"
                  className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <RefreshCw size={18} className={loadingKpis ? "animate-spin text-indigo-600" : ""} />
                </button>

                {/* Bouton Déconnexion */}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-2 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl font-semibold text-xs transition-all duration-150 border border-rose-100"
                >
                  <LogOut size={16} />
                  <span className="hidden sm:inline">Déconnexion</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Zone de contenu dynamique */}
        <main className="p-4 sm:p-6 flex-1 max-w-7xl w-full mx-auto">
          {renderMainContent()}
        </main>
      </div>
    </div>
  );
}

export default AdminPage;

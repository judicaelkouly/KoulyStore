import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import ProductList from "./products/ProductList";
import UserList from "./user/UserList";
import OrderList from "./commandes/OrderList";
import CategoryList from "./categories/CategoryList";
import BannerList from "./bannieres/BannerList";
import ReturnList from "./returns/ReturnList";

import { 
  FaChartBar, 
  FaTachometerAlt, 
  FaUsers, 
  FaHome, 
  FaDollarSign, 
  FaSignOutAlt, 
  FaReceipt,
  FaUndoAlt 
} from "react-icons/fa";
import { MdOutlineProductionQuantityLimits } from "react-icons/md";
import { TbCategoryPlus } from "react-icons/tb";
import { PiFlagBannerFoldFill } from "react-icons/pi";
import { Package } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
const API_HOST_URL = API_BASE_URL.replace(/\/api\/?$/, "");

interface OrderSummary {
  id: number;
  total_amount: string | number;
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
  const navigate = useNavigate();

  // États pour stocker les métriques dynamiques
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [totalOrdersCount, setTotalOrdersCount] = useState<number>(0);
  const [unreadOrdersCount, setUnreadOrdersCount] = useState<number>(0);
  const [pendingReturnsCount, setPendingReturnsCount] = useState<number>(0);
  const [totalUsersCount, setTotalUsersCount] = useState<number>(0);
  const [totalProductsCount, setTotalProductsCount] = useState<number>(0);
  const [totalCategoriesCount, setTotalCategoriesCount] = useState<number>(0); // 👈 Nouveau KPI
  const [loadingKpis, setLoadingKpis] = useState<boolean>(true);

  // État pour l'utilisateur admin actuellement connecté
  const [adminUser, setAdminUser] = useState<UserProfileData | null>(null);

  // Helper pour récupérer le token XSRF (Laravel Sanctum)
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

  // Formatage de l'image de l'avatar
  const formatAvatarUrl = (path?: string) => {
    if (!path) return null;
    if (path.startsWith("http") || path.startsWith("blob:") || path.startsWith("data:")) {
      return path;
    }
    const cleanPath = path.replace(/^\//, "").replace(/^storage\//, "");
    return `http://localhost:8000/storage/${cleanPath}`;
  };

  // Chargement des données dynamiques du Dashboard et du Profil Admin
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
        fetch(`${API_BASE_URL}/categories`, { headers, credentials: "include" }), // 👈 API Catégories
        fetch(`${API_BASE_URL}/profile`, { headers, credentials: "include" }),
      ]);

      if (ordersRes.status === "fulfilled" && ordersRes.value.ok) {
        const dataData = await ordersRes.value.json();
        const ordersList: OrderSummary[] = Array.isArray(dataData)
          ? dataData
          : dataData.orders || dataData.data || [];

        setTotalOrdersCount(ordersList.length);

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

      // Traitement du total des catégories
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
      console.error("Erreur lors de la récupération des KPI:", err);
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
      } else {
        console.error("Erreur lors de la déconnexion");
      }
    } catch (error) {
      console.error("Erreur réseau lors de la déconnexion:", error);
    }
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: <FaTachometerAlt /> },
    { id: "users", label: "Users", icon: <FaUsers /> },
    { id: "products", label: "Products", icon: <MdOutlineProductionQuantityLimits /> },
    { id: "categories", label: "Categories", icon: <TbCategoryPlus /> },
    { id: "orders", label: "Orders", icon: <Package />, badge: unreadOrdersCount },
    { id: "returns", label: "Retours", icon: <FaUndoAlt />, badge: pendingReturnsCount },
    { id: "banner", label: "Bannière", icon: <PiFlagBannerFoldFill /> },
    { id: "analytics", label: "Analytics", icon: <FaChartBar /> },
  ];

  const renderMainContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          /* Grille ajustée à 6 colonnes sur grands écrans */
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
            {/* 1. Revenu Total */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
              <div className="flex items-center justify-between">
                <div className="overflow-hidden">
                  <p className="text-xs font-semibold text-gray-500 truncate">Chiffre d'affaires</p>
                  <p className="text-lg font-bold text-gray-900 mt-1 truncate" title={`${totalRevenue.toLocaleString("fr-FR")} FCFA`}>
                    {loadingKpis ? "..." : `${totalRevenue.toLocaleString("fr-FR")} F`}
                  </p>
                </div>
                <div className="w-10 h-10 bg-blue-50 text-indigo-600 rounded-lg flex items-center justify-center shrink-0">
                  <FaDollarSign className="text-lg" />
                </div>
              </div>
            </div>

            {/* 2. Utilisateurs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-500 truncate">Utilisateurs</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {loadingKpis ? "..." : totalUsersCount.toLocaleString("fr-FR")}
                  </p>
                </div>
                <div className="w-10 h-10 bg-green-100 text-green-600 rounded-lg flex items-center justify-center shrink-0">
                  <FaUsers className="text-lg" />
                </div>
              </div>
            </div>

            {/* 3. Produits */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-500 truncate">Produits</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {loadingKpis ? "..." : totalProductsCount.toLocaleString("fr-FR")}
                  </p>
                </div>
                <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center shrink-0">
                  <MdOutlineProductionQuantityLimits className="text-lg" />
                </div>
              </div>
            </div>

            {/* 4. Catégories */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-500 truncate">Catégories</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {loadingKpis ? "..." : totalCategoriesCount.toLocaleString("fr-FR")}
                  </p>
                </div>
                <div className="w-10 h-10 bg-teal-100 text-teal-600 rounded-lg flex items-center justify-center shrink-0">
                  <TbCategoryPlus className="text-lg" />
                </div>
              </div>
            </div>

            {/* 5. Commandes */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-500 truncate">Commandes</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {loadingKpis ? "..." : totalOrdersCount.toLocaleString("fr-FR")}
                  </p>
                </div>
                <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center shrink-0">
                  <Package className="text-lg" />
                </div>
              </div>
              <div className="mt-2">
                {unreadOrdersCount > 0 ? (
                  <span className="text-red-600 text-[11px] font-bold block truncate">
                    ● {unreadOrdersCount} nouvelle{unreadOrdersCount > 1 ? "s" : ""}
                  </span>
                ) : (
                  <span className="text-green-600 text-[11px] font-medium block truncate">
                    À jour
                  </span>
                )}
              </div>
            </div>

            {/* 6. Retours en attente */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-500 truncate">Retours</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {loadingKpis ? "..." : pendingReturnsCount.toLocaleString("fr-FR")}
                  </p>
                </div>
                <div className="w-10 h-10 bg-red-100 text-red-600 rounded-lg flex items-center justify-center shrink-0">
                  <FaUndoAlt className="text-lg" />
                </div>
              </div>
              <div className="mt-2">
                {pendingReturnsCount > 0 ? (
                  <span className="text-red-600 text-[11px] font-bold block truncate">
                    ● En attente
                  </span>
                ) : (
                  <span className="text-green-600 text-[11px] font-medium block truncate">
                    Aucun retour
                  </span>
                )}
              </div>
            </div>
          </div>
        );

      case "users":
        return (
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Gestion des utilisateurs</h2>
            <UserList />
          </div>
        );

      case "categories":
        return (
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Gestion des catégories</h2>
            <CategoryList />
          </div>
        );

      case "analytics":
        return (
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Statistiques & Analyses</h2>
            <p className="text-gray-600">Graphiques de performance et métriques avancées.</p>
          </div>
        );

      case "orders":
        return (
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Commandes récentes</h2>
            <OrderList onOrdersUpdated={fetchDashboardStats} />
          </div>
        );

      case "returns":
        return (
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Demandes de Retour Produit</h2>
            <ReturnList onReturnsUpdated={fetchDashboardStats} />
          </div>
        );

      case "banner":
        return (
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <BannerList />
          </div>
        );

      case "products":
        return (
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Catalogue Produits</h2>
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
    <div className="bg-gray-100 min-h-screen">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-gray-900 shadow-xl z-50 rounded-lg flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-center h-16 bg-gray-900">
            <div className="w-full mt-10 mr-15 md:w-[45%] lg:w-[70%] flex flex-col items-center md:items-start text-center md:text-left">
              <div className="flex items-center">
                <a href="/" className="flex items-center gap-3 group">
                  <img 
                    src="/src/assets/logo4.png" 
                    alt="Kouly'Store Logo"
                    className="h-10 sm:h-40 w-auto object-contain transition-transform group-hover:scale-105"
                  />
                </a>
              </div>
              <div className='w-full max-w-52 h-px mt-6 bg-gradient-to-r from-transparent via-white/20 to-transparent md:bg-none'></div>
            </div>
          </div>

          <nav className="mt-8 px-4">
            <div className="space-y-2">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 font-bold rounded-lg transition-colors group ${
                      isActive
                        ? "bg-gray-700 text-white"
                        : "text-gray-400 hover:bg-gray-700 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center">
                      <span
                        className={`mr-3 text-lg ${
                          isActive ? "text-indigo-400" : "text-gray-400 group-hover:text-white"
                        }`}
                      >
                        {item.icon}
                      </span>
                      {item.label}
                    </div>

                    {item.badge && item.badge > 0 ? (
                      <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-extrabold animate-pulse">
                        {item.badge}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </nav>
        </div>

        {/* Section Bas de Sidebar avec Profil Admin Dynamique */}
        <div className="p-4 space-y-3">
          <Link
            to="/"
            className="w-full flex items-center px-4 py-2.5 font-semibold text-sm text-gray-300 bg-gray-800 hover:bg-indigo-600 hover:text-white rounded-lg transition-all duration-200"
          >
            <FaHome className="mr-3 text-base" />
            Retour au site
          </Link>

          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              {adminAvatar ? (
                <img
                  src={adminAvatar}
                  alt={adminName}
                  className="w-10 h-10 rounded-full object-cover border border-indigo-500"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">
                  {adminName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="overflow-hidden">
                <p className="text-white text-sm font-medium truncate">{adminName}</p>
                <p className="text-gray-400 text-xs">Administrateur</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="ml-64">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-gray-800 capitalize">
                  {activeTab}
                </h1>
                <p className="text-sm mt-1 text-gray-500">
                  Soyez les bienvenus. Voici l'essentiel de l'actualité de ce jour.
                </p>
              </div>
              <div className="flex items-center">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-lg font-semibold text-sm transition-colors duration-200 border border-red-100"
                >
                  <FaSignOutAlt className="text-lg" />
                  Se déconnecter
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="p-6">{renderMainContent()}</main>
      </div>
    </div>
  );
}

export default AdminPage;

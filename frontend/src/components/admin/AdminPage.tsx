import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom"; // Ajout de useNavigate
import ProductList from "./products/ProductList";
import UserList from "./user/UserList";
import OrderList from "./commandes/OrderList";
import CategoryList from "./categories/CategoryList";
import BannerList from "./bannieres/BannerList";

import { FaChartBar, FaTachometerAlt, FaUsers, FaHome, FaDollarSign, FaSignOutAlt } from "react-icons/fa"; // Ajout de FaSignOutAlt
import { MdOutlineProductionQuantityLimits } from "react-icons/md";
import { TbCategoryPlus } from "react-icons/tb";
//import { CgReorder } from "react-icons/cg";
import { PiFlagBannerFoldFill } from "react-icons/pi";
import {FaReceipt} from "react-icons/fa";

// Interfaces pour le typage des réponses API
interface OrderSummary {
  id: number;
  total_amount: string | number;
}

interface ItemSummary {
  id: number;
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
  const navigate = useNavigate(); // Initialisation pour la redirection

  // États pour stocker les métriques dynamiques
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [totalOrdersCount, setTotalOrdersCount] = useState<number>(0);
  const [totalUsersCount, setTotalUsersCount] = useState<number>(0);
  const [totalProductsCount, setTotalProductsCount] = useState<number>(0);
  const [loadingKpis, setLoadingKpis] = useState<boolean>(true);

  // État pour l'utilisateur admin actuellement connecté
  const [adminUser, setAdminUser] = useState<UserProfileData | null>(null);

  // Helper pour récupérer le token XSRF si besoin (Laravel Sanctum)
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
  useEffect(() => {
    const fetchDashboardStats = async () => {
      setLoadingKpis(true);
      const xsrfToken = getXsrfToken();
      const headers: Record<string, string> = {
        Accept: "application/json",
        "Content-Type": "application/json",
      };
      if (xsrfToken) headers["X-XSRF-TOKEN"] = xsrfToken;

      try {
        const [ordersRes, usersRes, productsRes, profileRes] = await Promise.allSettled([
          fetch("http://localhost:8000/api/admin/orders", { headers, credentials: "include" }),
          fetch("http://localhost:8000/api/users", { headers, credentials: "include" }),
          fetch("http://localhost:8000/api/products", { headers, credentials: "include" }),
          fetch("http://localhost:8000/api/profile", { headers, credentials: "include" }),
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

    fetchDashboardStats();
  }, []);

  // Fonction de déconnexion
  const handleLogout = async () => {
    const xsrfToken = getXsrfToken();
    const headers: Record<string, string> = {
      Accept: "application/json",
      "Content-Type": "application/json",
    };
    if (xsrfToken) headers["X-XSRF-TOKEN"] = xsrfToken;

    try {
      const response = await fetch("http://localhost:8000/api/logout", {
        method: "POST",
        headers,
        credentials: "include",
      });

      if (response.ok) {
        // Redirection vers l'accueil après déconnexion réussie
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
    { id: "orders", label: "Orders", icon: <FaReceipt /> },
    { id: "banner", label: "Bannière", icon: <PiFlagBannerFoldFill /> },
    { id: "analytics", label: "Analytics", icon: <FaChartBar /> },
  ];

  const renderMainContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-xl font-bold text-gray-900 mt-2">
                    {loadingKpis ? "..." : `${totalRevenue.toLocaleString("fr-FR")} FCFA`}
                  </p>
                  <div className="flex items-center mt-2">
                    <span className="text-green-600 text-sm font-medium flex items-center">
                      ↑ 12%
                    </span>
                    <span className="text-gray-500 text-xs ml-2">vs le mois dernier</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-blue-50 text-indigo-600 rounded-lg flex items-center justify-center">
                  <FaDollarSign className="text-xl" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {loadingKpis ? "..." : totalUsersCount.toLocaleString("fr-FR")}
                  </p>
                  <div className="flex items-center mt-2">
                    <span className="text-green-600 text-sm font-medium flex items-center">
                      ↑ 8%
                    </span>
                    <span className="text-gray-500 text-xs ml-2">vs le mois dernier</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <FaUsers className="text-green-600 text-xl" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Orders</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {loadingKpis ? "..." : totalOrdersCount.toLocaleString("fr-FR")}
                  </p>
                  <div className="flex items-center mt-2">
                    <span className="text-green-600 text-sm font-medium flex items-center">
                      ↑ 15%
                    </span>
                    <span className="text-gray-500 text-xs ml-2">vs le mois dernier</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <FaReceipt className="text-orange-600 text-xl" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Products</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {loadingKpis ? "..." : totalProductsCount.toLocaleString("fr-FR")}
                  </p>
                  <div className="flex items-center mt-2">
                    <span className="text-green-600 text-sm font-medium flex items-center">
                      ↑ 5%
                    </span>
                    <span className="text-gray-500 text-xs ml-2">vs le mois dernier</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <MdOutlineProductionQuantityLimits className="text-purple-600 text-xl" />
                </div>
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
            <OrderList />
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
            <div className="w-full mt-10 mr-15 md:w-[45%] lg:w-[35%] flex flex-col items-center md:items-start text-center md:text-left">
              <a href="#" className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" fill="currentColor" className="bi bi-cart4 text-indigo-600" viewBox="0 0 16 16">
                  <path d="M0 2.5A.5.5 0 0 1 .5 2H2a.5.5 0 0 1 .485.379L2.89 4H14.5a.5.5 0 0 1 .485.621l-1.5 6A.5.5 0 0 1 13 11H4a.5.5 0 0 1-.485-.379L1.61 3H.5a.5.5 0 0 1-.5-.5M3.14 5l.5 2H5V5zM6 5v2h2V5zm3 0v2h2V5zm3 0v2h1.36l.5-2zm1.11 3H12v2h.61zM11 8H9v2h2zM8 8H6v2h2zM5 8H3.89l.5 2H5zm0 5a1 1 0 1 0 0 2 1 1 0 0 0 0-2m-2 1a2 2 0 1 1 4 0 2 2 0 0 1-4 0m9-1a1 1 0 1 0 0 2 1 1 0 0 0 0-2m-2 1a2 2 0 1 1 4 0 2 2 0 0 1-4 0"/>
                </svg>
                <span className="text-xl font-extrabold text-indigo-600 tracking-tight">
                  Kouly<span className="text-white">'Store</span>
                </span>
              </a>
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
                    className={`w-full flex items-center px-4 py-3 font-bold rounded-lg transition-colors group ${
                      isActive
                        ? "bg-gray-700 text-white"
                        : "text-gray-400 hover:bg-gray-700 hover:text-white"
                    }`}
                  >
                    <span
                      className={`mr-3 text-lg ${
                        isActive ? "text-indigo-400" : "text-gray-400 group-hover:text-white"
                      }`}
                    >
                      {item.icon}
                    </span>
                    {item.label}
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
                {/* Remplacement de la barre de recherche par le bouton de déconnexion */}
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

import React, { useState, useEffect } from "react";
import { CiLogout } from "react-icons/ci";
import { FaTachometerAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

// Interfaces TypeScript
export interface UserData {
  id?: string | number;
  username: string;
  email: string;
  phone?: string;
  city?: string;
  address?: string;
  avatarUrl?: string;
  role?: string;       // 👈 Ajout du rôle
  is_admin?: boolean;  // 👈 Support alternatif pour un booléen is_admin
}

export interface OrderItemData {
  id?: string | number;
  product_id?: string | number;
  product_title?: string;
  title?: string;
  name?: string;
  unit_price?: number;
  price?: number;
  quantity: number;
  size?: string;
  image?: string | any;
  image_url?: string | any;
  product?: {
    id?: string | number;
    title?: string;
    name?: string;
    image?: string | any;
    image_url?: string | any;
    images?: any[];
  };
}

export interface UserOrder {
  id: string | number;
  order_number?: string;
  created_at?: string;
  date?: string;
  total_price?: number;
  total_amount?: number;
  total?: number;
  status: "Payé" | "En attente" | "Livré" | "Annulé" | string;
  items_count?: number;
  itemCount?: number;
  items?: OrderItemData[];
}

export interface CartItem {
  cart_item_id?: string | number;
  id?: string | number;
  product_id?: string | number;
  quantity: number;
  unit_price?: number;
  price?: number;
  title?: string;
  name?: string;
  image?: string | any;
  image_url?: string | any;
  product?: {
    id: string | number;
    title?: string;
    name?: string;
    price?: number;
    image?: string | any;
    image_url?: string | any;
    images?: any[];
  };
}

function UserProfile() {
  const navigate = useNavigate();

  const [user, setUser] = useState<UserData | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartTotal, setCartTotal] = useState<number>(0);

  const [activeTab, setActiveTab] = useState<"info" | "orders" | "cart">("info");
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const [formData, setFormData] = useState<UserData>({
    username: "",
    email: "",
    phone: "",
    city: "",
    address: "",
    avatarUrl: "",
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [loggingOut, setLoggingOut] = useState<boolean>(false);
  const [removingId, setRemovingId] = useState<string | number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [imageError, setImageError] = useState<boolean>(false);

  // Helper Cookie XSRF-TOKEN
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

  const getCookieAuthHeaders = () => {
    const xsrfToken = getXsrfToken();
    return {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(xsrfToken ? { "X-XSRF-TOKEN": xsrfToken } : {}),
    };
  };

  // Guard Authentification & Redirection
  const checkAuthOrRedirect = (): boolean => {
    if (!isAuthenticated || !user?.id) {
      window.location.href = "/login";
      return false;
    }
    return true;
  };

  // Helper pour formater une chaîne/objet URL d'image vers Laravel Backend
  const formatUrl = (pathCandidate?: any): string | null => {
    if (!pathCandidate) return null;

    let target = pathCandidate;
    if (typeof pathCandidate === "object" && pathCandidate !== null) {
      target = pathCandidate.url || pathCandidate.path || pathCandidate.image_path || "";
    }

    if (!target || typeof target !== "string") return null;

    if (target.startsWith("http") || target.startsWith("blob:") || target.startsWith("data:")) {
      return target;
    }

    const cleanPath = target.replace(/^\//, "").replace(/^storage\//, "");
    return `http://localhost:8000/storage/${cleanPath}`;
  };

  // Helper pour récupérer l'image d'un article de panier ou de commande
  const getItemImageUrl = (item: CartItem | OrderItemData): string | null => {
    let candidate = item.image || item.image_url;

    if (!candidate && item.product) {
      candidate = item.product.image || item.product.image_url;

      if (!candidate && Array.isArray(item.product.images) && item.product.images.length > 0) {
        candidate = item.product.images[0];
      }
    }

    return formatUrl(candidate);
  };

  // Helper pour l'URL de l'avatar
  const getAvatarUrl = (rawAvatar?: string | null): string | null => {
    return formatUrl(rawAvatar);
  };

  // Chargement des données
  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Profil
        const resProfile = await fetch("http://localhost:8000/api/profile", {
          method: "GET",
          headers: getCookieAuthHeaders(),
          credentials: "include",
        });

        if (resProfile.status === 401) {
          setIsAuthenticated(false);
          setUser(null);
          setLoading(false);
          return;
        }

        if (resProfile.ok) {
          const dataProfile = await resProfile.json();
          const userData = dataProfile.user || dataProfile.data || dataProfile;

          const rawAvatar = userData.avatar_url || userData.avatar || "";
          const formattedAvatar = getAvatarUrl(rawAvatar) || "";

          const profileObj: UserData = {
            id: userData.id,
            username: userData.username || userData.name || "",
            email: userData.email || "",
            phone: userData.phone || "",
            city: userData.city || "",
            address: userData.address || "",
            avatarUrl: formattedAvatar,
            role: userData.role || "",           // 👈 Récupération du rôle
            is_admin: Boolean(userData.is_admin), // 👈 Récupération du flag admin
          };

          setUser(profileObj);
          setFormData(profileObj);
          setIsAuthenticated(true);
        }

        // Commandes
        const resOrders = await fetch("http://localhost:8000/api/user/orders", {
          method: "GET",
          headers: getCookieAuthHeaders(),
          credentials: "include",
        });

        if (resOrders.ok) {
          const dataOrders = await resOrders.json();
          setOrders(
            Array.isArray(dataOrders) ? dataOrders : dataOrders.orders || dataOrders.data || []
          );
        }

        // Panier
        const resCart = await fetch("http://localhost:8000/api/cart", {
          method: "GET",
          headers: getCookieAuthHeaders(),
          credentials: "include",
        });

        if (resCart.ok) {
          const dataCart = await resCart.json();
          const listCart =
            dataCart.cart?.items ||
            dataCart.cart_items ||
            dataCart.items ||
            (Array.isArray(dataCart) ? dataCart : []);

          setCartItems(listCart);

          if (dataCart.cart?.total_amount) {
            setCartTotal(dataCart.cart.total_amount);
          } else {
            const calculatedTotal = listCart.reduce((sum: number, item: CartItem) => {
              const price = item.unit_price || item.price || item.product?.price || 0;
              return sum + price * (item.quantity || 1);
            }, 0);
            setCartTotal(calculatedTotal);
          }
        }
      } catch (err: any) {
        console.error("Erreur chargement profil:", err);
        setError(err.message || "Erreur de chargement.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Déconnexion
  const handleLogout = async () => {
    setLoggingOut(true);
    setError(null);

    try {
      const xsrfToken = getXsrfToken();
      const headers: Record<string, string> = {
        Accept: "application/json",
      };
      if (xsrfToken) {
        headers["X-XSRF-TOKEN"] = xsrfToken;
      }

      await fetch("http://localhost:8000/api/logout", {
        method: "POST",
        headers,
        credentials: "include",
      });

      setIsAuthenticated(false);
      setUser(null);
      window.location.href = "/";
    } catch (err: any) {
      console.error("Erreur déconnexion:", err);
      window.location.href = "/";
    } finally {
      setLoggingOut(false);
    }
  };

  // Supprimer un article du panier
  const handleRemoveFromCart = async (cartItemId: string | number) => {
    if (!checkAuthOrRedirect()) return;

    if (!window.confirm("Voulez-vous vraiment retirer cet article du panier ?")) {
      return;
    }

    setRemovingId(cartItemId);
    setError(null);

    try {
      const response = await fetch(`http://localhost:8000/api/cart/${cartItemId}`, {
        method: "DELETE",
        headers: getCookieAuthHeaders(),
        credentials: "include",
      });

      if (!response.ok) {
        const resData = await response.json().catch(() => ({}));
        throw new Error(resData.message || "Impossible de supprimer l'article du panier.");
      }

      const updatedCart = cartItems.filter(
        (item) => (item.cart_item_id || item.id) !== cartItemId
      );
      setCartItems(updatedCart);

      const newTotal = updatedCart.reduce((sum, item) => {
        const price = item.unit_price || item.price || item.product?.price || 0;
        return sum + price * (item.quantity || 1);
      }, 0);
      setCartTotal(newTotal);

      setSuccessMsg("Article retiré du panier.");
    } catch (err: any) {
      console.error("Erreur suppression panier:", err);
      setError(err.message || "Échec de la suppression.");
    } finally {
      setRemovingId(null);
    }
  };

  // Redirection vers le paiement (/Checkout)
  const handleProceedToCheckout = () => {
    if (!checkAuthOrRedirect()) return;

    if (cartItems.length === 0) {
      setError("Votre panier est vide.");
      return;
    }

    const itemsToPay = cartItems.map((item) => {
      const pId = item.product_id || item.product?.id || item.id;
      const pName =
        item.title ||
        item.name ||
        item.product?.title ||
        item.product?.name ||
        "Produit";
      const pPrice =
        item.unit_price || item.price || item.product?.price || 0;

      return {
        id: pId,
        name: pName,
        category: "Panier",
        price: Number(pPrice),
        quantity: item.quantity || 1,
        image: getItemImageUrl(item) || "",
      };
    });

    navigate("/checkout", {
      state: {
        items: itemsToPay,
        source: "cart",
      },
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Traitement Fichier Image
  const processSelectedFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Veuillez sélectionner un fichier image valide.");
      return;
    }
    setAvatarFile(file);
    setImageError(false);
    setFormData((prev) => ({ ...prev, avatarUrl: URL.createObjectURL(file) }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  // Enregistrement du Profil
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkAuthOrRedirect()) return;

    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const bodyFormData = new FormData();
      bodyFormData.append("username", formData.username);
      bodyFormData.append("email", formData.email);
      if (formData.phone) bodyFormData.append("phone", formData.phone);
      if (formData.city) bodyFormData.append("city", formData.city);
      if (formData.address) bodyFormData.append("address", formData.address);

      if (avatarFile) {
        bodyFormData.append("avatar", avatarFile);
      }

      const xsrfToken = getXsrfToken();
      const headers: Record<string, string> = {
        Accept: "application/json",
      };
      if (xsrfToken) {
        headers["X-XSRF-TOKEN"] = xsrfToken;
      }

      const response = await fetch("http://localhost:8000/api/profile", {
        method: "POST",
        headers,
        credentials: "include",
        body: bodyFormData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erreur lors de la mise à jour du profil.");
      }

      const updatedUser = data.user || data.data || data;
      const rawAvatar = updatedUser.avatar_url || updatedUser.avatar || formData.avatarUrl;
      const formattedAvatar = getAvatarUrl(rawAvatar) || "";

      const finalProfile: UserData = {
        id: updatedUser.id || user?.id,
        username: updatedUser.username || updatedUser.name || formData.username,
        email: updatedUser.email || formData.email,
        phone: updatedUser.phone || formData.phone,
        city: updatedUser.city || formData.city,
        address: updatedUser.address || formData.address,
        avatarUrl: formattedAvatar,
        role: updatedUser.role || user?.role,
        is_admin: updatedUser.is_admin ?? user?.is_admin,
      };

      setUser(finalProfile);
      setFormData(finalProfile);
      setIsEditing(false);
      setAvatarFile(null);
      setImageError(false);
      setSuccessMsg("Profil et photo mis à jour avec succès !");
    } catch (err: any) {
      setError(err.message || "Échec de la sauvegarde.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center text-gray-500 font-medium">
        Chargement de votre profil...
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-white rounded-2xl border border-gray-200 shadow-sm text-center">
        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
          <i className="fas fa-lock"></i>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Accès Restreint</h2>
        <p className="text-sm text-gray-500 mb-6">
          Vous devez être connecté pour accéder à votre profil, gérer votre panier ou passer une commande.
        </p>
        <a
          href="/login"
          className="inline-block w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-sm transition-all"
        >
          Se connecter
        </a>
      </div>
    );
  }

  const currentAvatarSrc = getAvatarUrl(isEditing ? formData.avatarUrl : user.avatarUrl);

  // Vérification si l'utilisateur est administrateur
  const isAdmin = user.role === "admin" || user.is_admin === true;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      {/* Notifications */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="font-bold text-red-700 ml-4">&times;</button>
        </div>
      )}
      {successMsg && (
        <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl flex items-center justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="font-bold text-emerald-700 ml-4">&times;</button>
        </div>
      )}

      {/* En-tête Profil */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            <div className="relative group">
              {currentAvatarSrc && !imageError ? (
                <img
                  src={currentAvatarSrc}
                  alt={user.username}
                  onError={() => setImageError(true)}
                  className="w-24 h-24 rounded-full object-cover border-4 border-indigo-50 shadow-md"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-indigo-100 border-4 border-indigo-50 shadow-md flex items-center justify-center text-indigo-600 font-bold text-2xl">
                  {user.username ? user.username.charAt(0).toUpperCase() : <i className="fas fa-user"></i>}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <h1 className="text-2xl font-bold text-gray-900">
                  {user.username || "Utilisateur"}
                </h1>
                
              </div>
              <p className="text-sm text-gray-500 mt-0.5">{user.email}</p>
              {user.city && (
                <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                    <i className="fas fa-map-marker-alt mr-1"></i> {user.city}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Onglets & Actions */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
            {/* 👑 BOUTON TABLEAU DE BORD ADMIN (Affiché uniquement pour les admins) */}
            {isAdmin && (
              <button
                onClick={() => navigate("/admin/dashboard")}
                className="flex-1 sm:flex-none px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
                title="Accéder au Tableau de bord Administrateur"
              >
                <FaTachometerAlt /> 
               Tableau de bord
              </button>
            )}

            <button
              onClick={() => { setActiveTab("info"); setIsEditing(false); }}
              className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === "info"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <i className="fas fa-user mr-2"></i>Mon Profil
            </button>
            <button
              onClick={() => { setActiveTab("orders"); setIsEditing(false); }}
              className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === "orders"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <i className="fas fa-shopping-bag mr-2"></i>Commandes ({orders.length})
            </button>
            <button
              onClick={() => { setActiveTab("cart"); setIsEditing(false); }}
              className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === "cart"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <i className="fas fa-shopping-cart mr-2"></i>Panier ({cartItems.length})
            </button>

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              title="Se déconnecter"
              className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-sm rounded-xl border border-red-100 transition-all flex items-center justify-center gap-2"
            >
              {loggingOut ? (
                <i className="fas fa-spinner fa-spin"></i>
              ) : (
                <i className="fas fa-sign-out-alt"></i>
              )}
              <span className=" md:inline"><CiLogout /></span>
            </button>
          </div>
        </div>
      </div>

      {/* ONGLET 1 : Informations */}
      {activeTab === "info" && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
            <h2 className="text-lg font-bold text-gray-800">Informations Personnelles</h2>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
              >
                <i className="fas fa-edit"></i> Modifier le profil
              </button>
            )}
          </div>

          <form onSubmit={handleSave}>
            {isEditing && (
              <div className="mb-6">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Photo de Profil
                </label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
                    isDragging
                      ? "border-indigo-500 bg-indigo-50/50"
                      : "border-gray-300 hover:border-indigo-400 bg-gray-50/50"
                  }`}
                >
                  <input
                    id="avatar-dropzone"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                  <label htmlFor="avatar-dropzone" className="cursor-pointer flex flex-col items-center">
                    {formData.avatarUrl ? (
                      <div className="mb-3 relative">
                        <img
                          src={formData.avatarUrl}
                          alt="Prévisualisation"
                          className="w-20 h-20 rounded-full object-cover border-2 border-indigo-600 shadow-sm"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-3 text-xl">
                        <i className="fas fa-cloud-upload-alt"></i>
                      </div>
                    )}
                    <p className="text-sm font-semibold text-gray-700">
                      Glissez-déposez une image ici, ou <span className="text-indigo-600 underline">parcourez votre galerie</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF jusqu'à 5 Mo</p>
                  </label>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Nom d'utilisateur
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full text-sm py-2.5 px-3 rounded-lg border border-gray-300 focus:border-indigo-500 outline-none"
                    required
                  />
                ) : (
                  <p className="text-sm font-medium text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-100">
                    {user.username || "Non spécifié"}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Adresse Email
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full text-sm py-2.5 px-3 rounded-lg border border-gray-300 focus:border-indigo-500 outline-none"
                    required
                  />
                ) : (
                  <p className="text-sm font-medium text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-100">
                    {user.email || "Non spécifié"}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Téléphone
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full text-sm py-2.5 px-3 rounded-lg border border-gray-300 focus:border-indigo-500 outline-none"
                  />
                ) : (
                  <p className="text-sm font-medium text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-100">
                    {user.phone || "Non spécifié"}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Ville
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full text-sm py-2.5 px-3 rounded-lg border border-gray-300 focus:border-indigo-500 outline-none"
                  />
                ) : (
                  <p className="text-sm font-medium text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-100">
                    {user.city || "Non spécifiée"}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Adresse de Livraison
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full text-sm py-2.5 px-3 rounded-lg border border-gray-300 focus:border-indigo-500 outline-none"
                  />
                ) : (
                  <p className="text-sm font-medium text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-100">
                    {user.address || "Non spécifiée"}
                  </p>
                )}
              </div>
            </div>

            {isEditing && (
              <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => { setFormData(user); setIsEditing(false); setAvatarFile(null); }}
                  className="px-5 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors"
                >
                  {submitting ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            )}
          </form>
        </div>
      )}

      {/* ONGLET 2 : Commandes */}
      {activeTab === "orders" && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
            <h2 className="text-lg font-bold text-gray-800">Historique des Commandes</h2>
            <span className="text-xs font-bold px-3 py-1 bg-gray-100 text-gray-700 rounded-full border">
              {orders.length} commande(s)
            </span>
          </div>

          {orders.length === 0 ? (
            <p className="text-center py-8 text-sm text-gray-500">Aucune commande trouvée.</p>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => {
                const total = order.total_amount || order.total_price || order.total || 0;
                const orderNum = order.order_number || `#${order.id}`;
                const date = order.created_at
                  ? new Date(order.created_at).toLocaleDateString("fr-FR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : order.date || "-";

                const orderItems = order.items || [];

                return (
                  <div
                    key={order.id}
                    className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-gray-50 border-b border-gray-100">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold shrink-0">
                          <i className="fas fa-box text-sm"></i>
                        </div>
                        <div>
                          <span className="text-sm font-mono font-bold text-indigo-600">
                            {orderNum}
                          </span>
                          <p className="text-xs text-gray-500">{date}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="text-xs font-semibold px-3 py-1 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                          {order.status}
                        </span>
                        <div className="text-right">
                          <span className="text-xs text-gray-400 block">Total Commande</span>
                          <p className="text-sm font-extrabold text-gray-900">
                            {Number(total).toLocaleString("fr-FR")} FCFA
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 divide-y divide-gray-100">
                      {orderItems.length === 0 ? (
                        <p className="text-xs text-gray-400 italic py-2">
                          Détails des articles indisponibles.
                        </p>
                      ) : (
                        orderItems.map((item, idx) => {
                          const title =
                            item.product_title ||
                            item.title ||
                            item.name ||
                            item.product?.title ||
                            item.product?.name ||
                            "Article";

                          const unitPrice =
                            item.unit_price || item.price || item.product?.price || 0;

                          const imgUrl = getItemImageUrl(item);

                          return (
                            <div
                              key={item.id || idx}
                              className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                            >
                              <div className="flex items-center gap-3">
                                {imgUrl ? (
                                  <img
                                    src={imgUrl}
                                    alt={title}
                                    onError={(e) => {
                                      (e.target as HTMLElement).style.display = 'none';
                                      if ((e.target as HTMLElement).nextElementSibling) {
                                        ((e.target as HTMLElement).nextElementSibling as HTMLElement).style.display = 'flex';
                                      }
                                    }}
                                    className="w-12 h-12 object-cover rounded-lg border border-gray-100 bg-gray-50 shrink-0"
                                  />
                                ) : null}

                                <div
                                  className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-lg border border-indigo-100 flex items-center justify-center font-bold text-sm shrink-0"
                                  style={{ display: imgUrl ? 'none' : 'flex' }}
                                >
                                  <i className="fas fa-shopping-bag"></i>
                                </div>

                                <div>
                                  <h4 className="text-xs font-bold text-gray-800 line-clamp-1">
                                    {title}
                                  </h4>
                                  <p className="text-[11px] text-gray-500 mt-0.5">
                                    Qté : <span className="font-semibold text-gray-700">{item.quantity}</span> × {Number(unitPrice).toLocaleString("fr-FR")} FCFA
                                  </p>
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <span className="text-xs font-bold text-gray-900">
                                  {Number(unitPrice * item.quantity).toLocaleString("fr-FR")} FCFA
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ONGLET 3 : Panier */}
      {activeTab === "cart" && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-800">Mon Panier</h2>
              <p className="text-xs text-gray-500 mt-0.5">Articles actuellement dans votre panier.</p>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
              {cartItems.length} article(s)
            </span>
          </div>

          {cartItems.length === 0 ? (
            <p className="text-center py-8 text-sm text-gray-500">Votre panier est vide.</p>
          ) : (
            <div className="space-y-4">
              {cartItems.map((item, index) => {
                const title = item.title || item.product?.title || item.name || item.product?.name || "Produit";
                const unitPrice = item.unit_price || item.price || item.product?.price || 0;
                const qty = item.quantity || 1;
                const itemTotal = unitPrice * qty;
                const itemId = item.cart_item_id || item.id || index;
                const productId = item.product_id || item.product?.id;
                const imageUrl = getItemImageUrl(item);

                return (
                  <div
                    key={itemId}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-all gap-4"
                  >
                    <div className="flex items-center space-x-4 w-full sm:w-auto">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={title}
                          className="w-16 h-16 object-cover rounded-lg border border-gray-200 shrink-0 bg-white"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-indigo-50 border border-indigo-100 text-indigo-500 rounded-lg flex items-center justify-center font-bold shrink-0">
                          <i className="fas fa-box-open text-xl"></i>
                        </div>
                      )}

                      <div className="flex-1">
                        <h3 className="text-sm font-bold text-gray-900">{title}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Quantité : <span className="font-semibold text-gray-700">{qty}</span> × {Number(unitPrice).toLocaleString("fr-FR")} FCFA
                        </p>
                        <p className="text-xs font-bold text-indigo-600 mt-1 sm:hidden">
                          {Number(itemTotal).toLocaleString("fr-FR")} FCFA
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                      <p className="text-sm font-extrabold text-indigo-600 hidden sm:block">
                        {Number(itemTotal).toLocaleString("fr-FR")} FCFA
                      </p>

                      <div className="flex items-center gap-2">
                        <a href={`/details?id=${productId}`}>
                          <button
                            title="Voir les détails du produit"
                            className="px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-100 transition-colors flex items-center gap-1.5"
                          >
                            <i className="fas fa-eye text-xs"></i>
                            <span>Détails</span>
                          </button>
                        </a>

                        <button
                          onClick={() => handleRemoveFromCart(itemId)}
                          disabled={removingId === itemId}
                          title="Supprimer du panier"
                          className="px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 disabled:opacity-50 rounded-lg border border-red-100 transition-colors flex items-center gap-1.5"
                        >
                          {removingId === itemId ? (
                            <i className="fas fa-spinner fa-spin text-xs"></i>
                          ) : (
                            <i className="fas fa-trash-alt text-xs"></i>
                          )}
                          <span>Supprimer</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="pt-6 border-t border-gray-100 mt-6">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-base font-bold text-gray-800">Total Général</span>
                  <span className="text-xl font-black text-indigo-600">
                    {Number(cartTotal).toLocaleString("fr-FR")} FCFA
                  </span>
                </div>

                <button
                  onClick={handleProceedToCheckout}
                  className="w-full py-3.5 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <i className="fas fa-credit-card"></i>
                  <span>Valider mon panier (Passer au paiement)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default UserProfile;

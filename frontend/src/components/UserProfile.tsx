import React, { useState, useEffect } from "react";
import { CiLogout } from "react-icons/ci";
import { FaTachometerAlt, FaStar } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

// Configuration dynamique de l'API et du stockage
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
const STORAGE_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "");

// Interfaces TypeScript
export interface UserData {
  id?: string | number;
  username: string;
  email: string;
  phone?: string;
  city?: string;
  address?: string;
  avatarUrl?: string;
  role?: string;
  is_admin?: boolean;
}

export interface OrderItemData {
  id?: string | number;
  product_id?: string | number;
  product_title?: string;
  title?: string;
  name?: string;
  unit_price?: number;
  price?: number;
  old_price?: number;
  quantity: number;
  size?: string;
  image?: string | any;
  image_url?: string | any;
  image_path?: string | any;
  product?: {
    id?: string | number;
    title?: string;
    name?: string;
    price?: number;
    image?: string | any;
    image_url?: string | any;
    image_path?: string | any;
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
  subtotal?: number;
  shipping_fee?: number;
  payment_method?: string;
  shipping_address?: string;
  shipping_method?: string;
  status: "Payé" | "En attente" | "Livré" | "Annulé" | string;
  delivery_date_info?: string;
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
  image_path?: string | any;
  product?: {
    id: string | number;
    title?: string;
    name?: string;
    price?: number;
    image?: string | any;
    image_url?: string | any;
    image_path?: string | any;
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
  const [orderFilterTab, setOrderFilterTab] = useState<"active" | "cancelled">("active");
  const [selectedOrder, setSelectedOrder] = useState<UserOrder | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // ÉTATS DE GESTION DU MODAL ET AVIS PRODUIT
  const [reviewModalOpen, setReviewModalOpen] = useState<boolean>(false);
  const [reviewProductId, setReviewProductId] = useState<string | number | null>(null);
  const [reviewProductName, setReviewProductName] = useState<string>("");
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewHoverRating, setReviewHoverRating] = useState<number>(0);
  const [reviewTitle, setReviewTitle] = useState<string>("");
  const [reviewComment, setReviewComment] = useState<string>("");
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);

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

  const checkAuthOrRedirect = (): boolean => {
    if (!isAuthenticated || !user?.id) {
      window.location.href = "/login";
      return false;
    }
    return true;
  };

  const formatUrl = (pathCandidate?: any): string | null => {
    if (!pathCandidate) return null;

    let target = pathCandidate;

    if (typeof pathCandidate === "object" && pathCandidate !== null) {
      target = pathCandidate.url || pathCandidate.path || pathCandidate.image_path || pathCandidate.image || "";
    }

    if (!target || typeof target !== "string") return null;

    if (target.startsWith("http://") || target.startsWith("https://") || target.startsWith("blob:") || target.startsWith("data:")) {
      return target;
    }

    let cleanPath = target.replace(/^\//, "");

    if (cleanPath.startsWith("storage/")) {
      return `${STORAGE_BASE_URL}/${cleanPath}`;
    }

    return `${STORAGE_BASE_URL}/storage/${cleanPath}`;
  };

  const getItemImageUrl = (item: CartItem | OrderItemData): string | null => {
    if (!item) return null;

    let candidate = item.image_path || item.image_url || item.image;

    if (!candidate && item.product) {
      candidate =
        item.product.image_path ||
        item.product.image_url ||
        item.product.image;

      if (!candidate && Array.isArray(item.product.images) && item.product.images.length > 0) {
        candidate = item.product.images[0];
      }
    }

    return formatUrl(candidate);
  };

  const getAvatarUrl = (rawAvatar?: string | null): string | null => {
    return formatUrl(rawAvatar);
  };

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      setError(null);

      try {
        const resProfile = await fetch(`${API_BASE_URL}/profile`, {
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
            role: userData.role || "",
            is_admin: Boolean(userData.is_admin),
          };

          setUser(profileObj);
          setFormData(profileObj);
          setIsAuthenticated(true);
        }

        const resOrders = await fetch(`${API_BASE_URL}/user/orders`, {
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

        const resCart = await fetch(`${API_BASE_URL}/cart`, {
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

      await fetch(`${API_BASE_URL}/logout`, {
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

  const handleRemoveFromCart = async (cartItemId: string | number) => {
    if (!checkAuthOrRedirect()) return;

    if (!window.confirm("Voulez-vous vraiment retirer cet article du panier ?")) {
      return;
    }

    setRemovingId(cartItemId);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/cart/${cartItemId}`, {
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

      const response = await fetch(`${API_BASE_URL}/profile`, {
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

  // OUVRIR LE MODAL DE NOTATION
  const handleOpenReviewModal = (pId: string | number, pName: string) => {
    setReviewProductId(pId);
    setReviewProductName(pName);
    setReviewRating(5);
    setReviewTitle("");
    setReviewComment("");
    setReviewModalOpen(true);
  };

  // SOUMETTRE L'AVIS AU BACKEND
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewProductId) return;

    setSubmittingReview(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/products/${reviewProductId}/reviews`, {
        method: "POST",
        headers: getCookieAuthHeaders(),
        credentials: "include",
        body: JSON.stringify({
          rating: reviewRating,
          title: reviewTitle,
          comment: reviewComment,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erreur lors de la soumission de l'avis.");
      }

      setSuccessMsg("Merci ! Votre avis a été publié avec succès.");
      setReviewModalOpen(false);
    } catch (err: any) {
      setError(err.message || "Impossible d'envoyer votre avis.");
    } finally {
      setSubmittingReview(false);
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
  const isAdmin = user.role === "admin" || user.is_admin === true;

  const activeOrders = orders.filter(
    (o) => o.status.toLowerCase() !== "annulé" && o.status.toLowerCase() !== "retourné"
  );
  const cancelledOrders = orders.filter(
    (o) => o.status.toLowerCase() === "annulé" || o.status.toLowerCase() === "retourné"
  );

  const displayedOrders = orderFilterTab === "active" ? activeOrders : cancelledOrders;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 font-sans relative">
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

          {/* Navigation Onglets */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
            {isAdmin && (
              <button
                onClick={() => navigate("/admin/dashboard")}
                className="flex-1 sm:flex-none px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
                title="Accéder au Tableau de bord Administrateur"
              >
                <FaTachometerAlt />
              </button>
            )}

            <button
              onClick={() => { setActiveTab("info"); setIsEditing(false); setSelectedOrder(null); }}
              className={`flex-1 sm:flex-none px-2 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === "info"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <i className="fas fa-user mr-2"></i>Mon Profil
            </button>
            <button
              onClick={() => { setActiveTab("orders"); setIsEditing(false); }}
              className={`flex-1 sm:flex-none px-2 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === "orders"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <i className="fas fa-shopping-bag mr-2"></i>Commandes ({orders.length})
            </button>
            <button
              onClick={() => { setActiveTab("cart"); setIsEditing(false); setSelectedOrder(null); }}
              className={`flex-1 sm:flex-none px-2 py-2 rounded-xl text-sm font-semibold transition-all ${
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
              className="flex items-center gap-1 px-2 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-sm rounded-xl border border-red-100 transition-all flex items-center justify-center gap-2"
            >
              {loggingOut ? (
                <i className="fas fa-spinner fa-spin"></i>
              ) : (
                <i className="fas fa-sign-out-alt"></i>
              )}
              <span className="md:inline"><CiLogout  /></span>
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
          {selectedOrder ? (
            /* VUE DÉTAILLÉE DE LA COMMANDE */
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-2 border-b border-gray-200">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                  title="Retour aux commandes"
                >
                  <i className="fas fa-arrow-left text-lg"></i>
                </button>
                <h2 className="text-lg font-bold text-gray-900">Détails de la commande</h2>
              </div>

              <div className="text-sm text-gray-700 space-y-1">
                <p className="font-bold text-base text-gray-900">
                  Commande n° {selectedOrder.order_number || selectedOrder.id}
                </p>
                <p className="text-xs text-gray-500">
                  {selectedOrder.items?.length || selectedOrder.items_count || 1} article(s)
                </p>
                <p className="text-xs text-gray-500">
                  Effectuée le {selectedOrder.created_at || selectedOrder.date || "N/A"}
                </p>
                <p className="text-xs font-semibold text-gray-800">
                  Total: {Number(selectedOrder.total_price || selectedOrder.total_amount || selectedOrder.total || 0).toLocaleString("fr-FR")} FCFA
                </p>
              </div>

              {/* Bloc ARTICLES DANS VOTRE COMMANDE */}
              <div className="border border-gray-200 rounded-lg p-4 bg-white">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">
                  ARTICLES DANS VOTRE COMMANDE
                </h3>

                <div className="space-y-4">
                  {(selectedOrder.items && selectedOrder.items.length > 0
                    ? selectedOrder.items
                    : [{} as OrderItemData]
                  ).map((item, idx) => {
                    const productId = item.product_id || item.product?.id;
                    const itemTitle =
                      item.product_title ||
                      item.title ||
                      item.name ||
                      item.product?.title ||
                      item.product?.name ||
                      "Article sans nom";
                    const itemPrice = item.unit_price || item.price || item.product?.price || 0;
                    const itemOldPrice = item.old_price;
                    const itemQty = item.quantity || 1;
                    const itemImg = getItemImageUrl(item);

                    return (
                      <div key={idx} className="flex flex-col sm:flex-row gap-4 items-start border-b border-gray-100 pb-4 last:border-b-0 last:pb-0">
                        <div className="w-24 h-24 rounded-md border border-gray-100 bg-gray-50 shrink-0 overflow-hidden flex items-center justify-center p-1">
                          {itemImg ? (
                            <img
                              src={itemImg}
                              alt={itemTitle}
                              className="w-full h-full object-cover rounded-md transition-transform hover:scale-105"
                            />
                          ) : (
                            <i className="fas fa-box text-gray-300 text-3xl"></i>
                          )}
                        </div>

                        <div className="flex-1 space-y-1.5">
                          <div>
                            <span className="inline-block bg-green-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wide">
                              {selectedOrder.status.toUpperCase()}
                            </span>
                          </div>

                          {selectedOrder.delivery_date_info && (
                            <p className="text-xs font-bold text-gray-800">
                              {selectedOrder.delivery_date_info}
                            </p>
                          )}

                          <h4 className="text-sm font-semibold text-gray-900 leading-snug">
                            {itemTitle}
                          </h4>

                          <p className="text-xs text-gray-500">
                            Quantité: {itemQty}
                          </p>

                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-gray-900">
                              {Number(itemPrice).toLocaleString("fr-FR")} FCFA
                            </span>
                            {itemOldPrice && (
                              <span className="text-xs text-gray-400 line-through">
                                {Number(itemOldPrice).toLocaleString("fr-FR")} FCFA
                              </span>
                            )}
                          </div>

                          {/* BOUTON ÉVALUER CE PRODUIT DANS LA VUE DÉTAILLÉE */}
                          {productId && (
                            <div className="pt-2">
                              <button
                                onClick={() => handleOpenReviewModal(productId, itemTitle)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold rounded-lg border border-amber-200 transition-colors"
                              >
                                <FaStar className="text-amber-500" />
                                <span>Évaluer ce produit</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Grid PAIEMENT et LIVRAISON */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded-lg p-4 bg-white space-y-3">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 pb-2">
                    PAIEMENT
                  </h3>

                  <div>
                    <h4 className="text-xs font-bold text-gray-800 mb-1">Mode de paiement</h4>
                    <p className="text-xs text-gray-600">
                      {selectedOrder.payment_method || "Paiement à la livraison / Mobile Money"}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-gray-50 space-y-1">
                    <h4 className="text-xs font-bold text-gray-800 mb-1">Détails du paiement</h4>
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Sous-total:</span>
                      <span>
                        {Number(selectedOrder.subtotal || selectedOrder.total_price || 0).toLocaleString("fr-FR")} FCFA
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Frais de livraison:</span>
                      <span>
                        {selectedOrder.shipping_fee
                          ? `${Number(selectedOrder.shipping_fee).toLocaleString("fr-FR")} FCFA`
                          : "0 FCFA"}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs font-bold text-gray-900 pt-1">
                      <span>Total:</span>
                      <span>
                        {Number(selectedOrder.total_price || selectedOrder.total_amount || selectedOrder.total || 0).toLocaleString("fr-FR")} FCFA
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4 bg-white space-y-3">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 pb-2">
                    LIVRAISON
                  </h3>

                  <div>
                    <h4 className="text-xs font-bold text-gray-800 mb-1">Méthode de livraison</h4>
                    <p className="text-xs text-gray-600">
                      {selectedOrder.shipping_method || "Livraison à domicile / Point Relais"}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-gray-800 mb-1">Adresse de livraison</h4>
                    <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">
                      {selectedOrder.shipping_address || user.address || user.city || "Adresse non renseignée"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* VUE LISTE DES COMMANDES */
            <>
              <h2 className="text-xl font-bold text-gray-800 mb-4">Vos commandes</h2>

              <div className="flex border-b border-gray-200 mb-6">
                <button
                  onClick={() => setOrderFilterTab("active")}
                  className={`py-2 px-4 text-xs font-bold tracking-wide transition-all border-b-2 ${
                    orderFilterTab === "active"
                      ? "border-orange-500 text-orange-500"
                      : "border-transparent text-gray-500 hover:text-gray-800"
                  }`}
                >
                  EN COURS/LIVRÉES ({activeOrders.length})
                </button>
                <button
                  onClick={() => setOrderFilterTab("cancelled")}
                  className={`py-2 px-4 text-xs font-bold tracking-wide transition-all border-b-2 ${
                    orderFilterTab === "cancelled"
                      ? "border-orange-500 text-orange-500"
                      : "border-transparent text-gray-500 hover:text-gray-800"
                  }`}
                >
                  ANNULÉES/RETOURNÉES ({cancelledOrders.length})
                </button>
              </div>

              {displayedOrders.length === 0 ? (
                <div className="text-center py-12 text-sm text-gray-500">
                  Aucune commande enregistrée dans cette rubrique.
                </div>
              ) : (
                <div className="space-y-4">
                  {displayedOrders.map((order) => {
                    const firstItem = order.items && order.items.length > 0 ? order.items[0] : null;
                    const productId = firstItem?.product_id || firstItem?.product?.id;
                    const title =
                      firstItem?.product_title ||
                      firstItem?.title ||
                      firstItem?.name ||
                      firstItem?.product?.title ||
                      firstItem?.product?.name ||
                      "Commande d'articles";

                    const orderNum = order.order_number || order.id;
                    const imgUrl = firstItem ? getItemImageUrl(firstItem) : null;
                    const size = firstItem?.size;

                    const isDelivered = order.status.toLowerCase().includes("livré");
                    const isPending =
                      order.status.toLowerCase().includes("attente") ||
                      order.status.toLowerCase().includes("pending");

                    return (
                      <div
                        key={order.id}
                        className="border border-gray-200 rounded-lg p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white hover:border-gray-300 transition-colors"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-20 h-20 rounded-md border border-gray-100 bg-gray-50 shrink-0 overflow-hidden flex items-center justify-center p-1">
                            {imgUrl ? (
                              <img
                                src={imgUrl}
                                alt={title}
                                className="w-full h-full object-cover rounded-md"
                              />
                            ) : (
                              <i className="fas fa-box text-gray-300 text-2xl"></i>
                            )}
                          </div>

                          <div className="flex flex-col gap-1">
                            <h3 className="text-sm font-semibold text-gray-900 leading-snug">
                              {title}
                            </h3>
                            <p className="text-xs text-gray-500">
                              Commande {orderNum}
                            </p>

                            {size && (
                              <p className="text-xs text-gray-600 font-medium">
                                Size: {size}
                              </p>
                            )}

                            <div className="mt-1 flex flex-col items-start gap-1">
                              {isDelivered && (
                                <>
                                  <span className="inline-block bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wide">
                                    COLIS LIVRÉ
                                  </span>
                                  {order.delivery_date_info && (
                                    <span className="text-xs font-bold text-gray-900">
                                      {order.delivery_date_info}
                                    </span>
                                  )}
                                </>
                              )}

                              {isPending && (
                                <>
                                  <span className="inline-block bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wide">
                                   {order.status}
                                  </span>
                                  {order.delivery_date_info && (
                                    <span className="text-xs font-bold text-gray-900">
                                      {order.delivery_date_info}
                                    </span>
                                  )}
                                </>
                              )}

                              {!isDelivered && !isPending && (
                                <span className="inline-block bg-green-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wide">
                                  {order.status}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Boutons d'action : Détails + Évaluer */}
                        <div className="flex flex-col sm:items-end gap-2 self-end sm:self-center">
                          {productId && (
                            <button
                              onClick={() => handleOpenReviewModal(productId, title)}
                              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold rounded-lg border border-amber-200 transition-colors"
                            >
                              <FaStar className="text-amber-500" />
                              <span>Évaluer</span>
                            </button>
                          )}

                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="text-orange-500 hover:text-orange-600 font-semibold text-sm transition-colors text-right"
                          >
                            Détails
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
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

      {/* MODAL POUR ÉVALUER LE PRODUIT */}
      {reviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl relative space-y-4">
            <button
              onClick={() => setReviewModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-bold text-lg"
            >
              &times;
            </button>

            <div>
              <h3 className="text-lg font-bold text-gray-900">Évaluer le produit</h3>
              <p className="text-xs text-gray-500 mt-1 truncate">
                {reviewProductName}
              </p>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              {/* Étoiles interactives */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Votre note
                </label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      onMouseEnter={() => setReviewHoverRating(star)}
                      onMouseLeave={() => setReviewHoverRating(0)}
                      className="text-2xl transition-transform hover:scale-110 focus:outline-none"
                    >
                      <FaStar
                        className={
                          star <= (reviewHoverRating || reviewRating)
                            ? "text-amber-400"
                            : "text-gray-200"
                        }
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-sm font-semibold text-gray-700">
                    {reviewHoverRating || reviewRating} / 5
                  </span>
                </div>
              </div>

              {/* Titre de l'avis */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Titre résumé (Optionnel)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Excellent produit, très confortable !"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  className="w-full text-sm py-2 px-3 rounded-lg border border-gray-300 focus:border-indigo-500 outline-none"
                />
              </div>

              {/* Commentaire */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Votre commentaire (Optionnel)
                </label>
                <textarea
                  rows={3}
                  placeholder="Partagez votre expérience avec ce produit..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full text-sm py-2 px-3 rounded-lg border border-gray-300 focus:border-indigo-500 outline-none resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-2"
                >
                  {submittingReview ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      <span>Envoi...</span>
                    </>
                  ) : (
                    <span>Publier l'avis</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserProfile;

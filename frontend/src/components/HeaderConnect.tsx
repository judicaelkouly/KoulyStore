import  { useState, useEffect } from "react";
import { MdShoppingCart } from "react-icons/md";


// Interfaces TypeScript
export interface UserData {
  id?: string | number;
  username: string;
  email: string;
  avatarUrl?: string;
}

export interface HeaderProps {
  // Possibilité de passer une fonction de déconnexion si gérée globalement
  onLogout?: () => void;
}

function HeaderConnect({ onLogout }: HeaderProps) {
  const [user, setUser] = useState<UserData | null>(null);
  const [cartCount, setCartCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [imageError, setImageError] = useState<boolean>(false);

  // Helper pour extraire le Token XSRF (Sanctum/Laravel)
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

  const getAuthHeaders = () => {
    const xsrfToken = getXsrfToken();
    return {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(xsrfToken ? { "X-XSRF-TOKEN": xsrfToken } : {}),
    };
  };

  // Helper pour formatage d'URL d'avatar
  const getAvatarUrl = (rawAvatar?: string | null): string | null => {
    if (!rawAvatar || typeof rawAvatar !== "string") return null;
    if (rawAvatar.startsWith("http") || rawAvatar.startsWith("blob:")) return rawAvatar;
    const cleanPath = rawAvatar.replace(/^\//, "").replace(/^storage\//, "");
    return `http://localhost:8000/storage/${cleanPath}`;
  };

  useEffect(() => {
    const fetchHeaderData = async () => {
      setLoading(true);
      try {
        // 1. Récupération des informations de l'utilisateur
        const resProfile = await fetch("http://localhost:8000/api/profile", {
          method: "GET",
          headers: getAuthHeaders(),
          credentials: "include",
        });

        if (resProfile.ok) {
          const dataProfile = await resProfile.json();
          const userData = dataProfile.user || dataProfile.data || dataProfile;
          const rawAvatar = userData.avatar_url || userData.avatar || "";

          setUser({
            id: userData.id,
            username: userData.username || userData.name || "",
            email: userData.email || "",
            avatarUrl: getAvatarUrl(rawAvatar) || "",
          });
        }

        // 2. Récupération du panier pour le nombre d'articles
        const resCart = await fetch("http://localhost:8000/api/cart", {
          method: "GET",
          headers: getAuthHeaders(),
          credentials: "include",
        });

        if (resCart.ok) {
          const dataCart = await resCart.json();
          const items =
            dataCart.cart?.items ||
            dataCart.cart_items ||
            dataCart.items ||
            (Array.isArray(dataCart) ? dataCart : []);

          // Calcul de la somme totale des quantités dans le panier
          const totalQuantity = items.reduce(
            (sum: number, item: any) => sum + (item.quantity || 1),
            0
          );
          setCartCount(totalQuantity);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des données du header :", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHeaderData();
  }, []);

  // Extraction de la première lettre pour les initiales
  const initialLetter = user?.username ? user.username.charAt(0).toUpperCase() : "?";

  return (
    <header className="bg-white border-b border-custom rounded-xl border-gray-200 px-4 py-3 h-[80px] sticky top-0 z-50">
      <div className="max-w-8xl mx-auto flex items-center justify-between">
        {/* LOGO / MARQUE */}
        <div className="flex items-center">
        <a href="#" className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            fill="currentColor"
            className="bi bi-cart4 text-indigo-500 shrink-0"
            viewBox="0 0 16 16"
          >
            <path d="M0 2.5A.5.5 0 0 1 .5 2H2a.5.5 0 0 1 .485.379L2.89 4H14.5a.5.5 0 0 1 .485.621l-1.5 6A.5.5 0 0 1 13 11H4a.5.5 0 0 1-.485-.379L1.61 3H.5a.5.5 0 0 1-.5-.5M3.14 5l.5 2H5V5zM6 5v2h2V5zm3 0v2h2V5zm3 0v2h1.36l.5-2zm1.11 3H12v2h.61zM11 8H9v2h2zM8 8H6v2h2zM5 8H3.89l.5 2H5zm0 5a1 1 0 1 0 0 2 1 1 0 0 0 0-2m-2 1a2 2 0 1 1 4 0 2 2 0 0 1-4 0m9-1a1 1 0 1 0 0 2 1 1 0 0 0 0-2m-2 1a2 2 0 1 1 4 0 2 2 0 0 1-4 0" />
          </svg>
          <span className="text-lg md:text-2xl font-extrabold text-indigo-600 tracking-tight whitespace-nowrap">
            Kouly<span className="text-gray-900">'Store</span>
          </span>
        </a>
      </div>
        {/* SECTION DROITE (Avatar + Panier) */}
        <div className="flex items-center gap-4">
          {loading ? (
            <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse"></div>
          ) : user ? (
            /* Utilisateur Connecté */
            <div className="flex items-center gap-4">
              {/* Profile Avatar / Initiales */}
              <a
                href="/profile"
                title="Accéder à mon profil"
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                {user.avatarUrl && !imageError ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.username}
                    onError={() => setImageError(true)}
                    className="w-15 h-15 rounded-full object-cover border-2 border-indigo-100 shadow-sm"
                  />
                ) : (
                  <div className="w-15 h-15 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-base shadow-sm">
                    {initialLetter}
                  </div>
                )}
                
              </a>

              {/* Bouton Panier avec Badge (Positionné à droite de l'avatar) */}
              <a
                href="/profile"
                className="relative p-2 text-gray-600 hover:text-indigo-600 bg-gray-50 hover:bg-indigo-50 rounded-xl transition-all"
                title="Voir mon panier"
              >
                <MdShoppingCart className="text-lg w-12 h-12" />

                {/* Badge du nombre d'articles */}
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm animate-bounce">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </a>
            </div>
          ) : (
            /* Utilisateur Non-connecté */
            <div className="flex items-center gap-3">
              <a
                href="/login"
                className="px-4 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              >
                Connexion
              </a>
              <a
                href="/cart"
                className="relative p-2 text-gray-600 hover:text-indigo-600 bg-gray-50 rounded-xl"
              >
                <i className="fas fa-shopping-cart text-lg"></i>
              </a>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default HeaderConnect;

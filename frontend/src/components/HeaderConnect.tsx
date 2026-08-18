import { useState, useEffect, useRef } from "react";
import { 
  MdShoppingCart, 
  MdSearch, 
  MdPerson, 
  MdClose, 
  MdLogout,
  MdStore,
  MdLocalOffer
} from "react-icons/md";

export interface UserData {
  id?: string | number;
  username: string;
  email: string;
  avatarUrl?: string;
}

export interface SearchProduct {
  id: string | number;
  name: string;
  price: number;
  image_url?: string;
}

export interface HeaderProps {
  onLogout?: () => void;
}

function HeaderConnect({ onLogout }: HeaderProps) {
  const [user, setUser] = useState<UserData | null>(null);
  const [cartCount, setCartCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [imageError, setImageError] = useState<boolean>(false);
  
  // Menu Mobile Drawer
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Recherche dynamique
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<SearchProduct[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const searchRef = useRef<HTMLDivElement>(null);

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

  const getAvatarUrl = (rawAvatar?: string | null): string | null => {
    if (!rawAvatar || typeof rawAvatar !== "string") return null;
    if (rawAvatar.startsWith("http") || rawAvatar.startsWith("blob:")) return rawAvatar;
    const cleanPath = rawAvatar.replace(/^\//, "").replace(/^storage\//, "");
    return `http://localhost:8000/storage/${cleanPath}`;
  };

  // Fermer la dropdown de recherche au clic à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Récupération initiale (Profil + Panier)
  useEffect(() => {
    const fetchHeaderData = async () => {
      setLoading(true);
      try {
        // Profile
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

        // Cart
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

  // Recherche dynamique en temps réel avec Debounce (300ms)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`http://localhost:8000/api/products?search=${encodeURIComponent(searchQuery)}`, {
          headers: getAuthHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          const products = data.data || data.products || (Array.isArray(data) ? data : []);
          setSearchResults(products.slice(0, 5)); // Limiter aux 5 premiers résultats
          setShowDropdown(true);
        }
      } catch (err) {
        console.error("Erreur lors de la recherche :", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowDropdown(false);
      window.location.href = `#products?search=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  const initialLetter = user?.username ? user.username.charAt(0).toUpperCase() : "?";

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between gap-4">
        
        {/* LOGO (Clique sur Mobile = Ouvre le Menu | Clique sur Desktop = Accueil) */}
        <div className="flex items-center">
         <a href="/" className="flex items-center gap-3 group">
            <img 
              src="/src/assets/logo3.png" 
              alt="Kouly'Store Logo" 
              className="h-10 sm:h-20 w-auto object-contain transition-transform group-hover:scale-105"
            />
          </a>
        </div>

        {/* BARRE DE RECHERCHE DYNAMIQUE (Desktop) */}
        <div ref={searchRef} className="hidden md:block flex-1 max-w-md relative">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <input
              type="text"
              placeholder="Rechercher un article, une catégorie..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.trim() && setShowDropdown(true)}
              className="w-full bg-slate-100 border border-slate-200 rounded-full py-2.5 pl-4 pr-11 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all"
            />
            <button
              type="submit"
              className="absolute right-1.5 p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-500 transition-colors"
              title="Rechercher"
            >
              <MdSearch className="text-lg" />
            </button>
          </form>

          {/* Autocomplétion / Résultats de recherche */}
          {showDropdown && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50">
              {isSearching ? (
                <div className="p-4 text-center text-xs text-slate-400">Recherche en cours...</div>
              ) : searchResults.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {searchResults.map((product) => (
                    <a
                      key={product.id}
                      href={`/details?id=${product.id}`}
                      className="flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors"
                    >
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="w-10 h-10 rounded-lg object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                          <MdStore />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{product.name}</p>
                        <p className="text-xs font-semibold text-indigo-600">{product.price} FCFA</p>
                      </div>
                    </a>
                  ))}
                  <button
                    onClick={handleSearchSubmit}
                    className="w-full text-center py-2.5 text-xs font-bold text-indigo-600 hover:bg-indigo-50 transition-colors"
                  >
                    Voir tous les résultats ({searchResults.length})
                  </button>
                </div>
              ) : (
                <div className="p-4 text-center text-xs text-slate-500">
                  Aucun produit trouvé pour "{searchQuery}"
                </div>
              )}
            </div>
          )}
        </div>

        {/* NAVIGATION DESKTOP */}
        <nav className="hidden lg:flex items-center gap-6 text-xs font-bold uppercase tracking-wider text-slate-600">
          <a href="#products" className="hover:text-indigo-600 transition-colors">Boutique</a>
          <a href="/service-client" className="hover:text-indigo-600 transition-colors">Service Client</a>
        </nav>

        {/* ACTIONS DROITE */}
        <div className="flex items-center gap-3">
          
          {/* BOUTON PANIER (Visible Mobile + Desktop) */}
          <a
            href="/profile"
            className="relative p-2.5 text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
            title="Voir mon panier"
          >
            <MdShoppingCart className="text-2xl" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </a>

          {/* PROFIL (Desktop uniquement) */}
          <div className="hidden md:flex items-center gap-2">
            {loading ? (
              <div className="w-9 h-9 rounded-full bg-slate-200 animate-pulse"></div>
            ) : user ? (
              <>
                <a
                  href="/profile"
                  title="Mon compte"
                  className="flex items-center gap-2 p-1 rounded-full hover:bg-slate-100 transition-all"
                >
                  {user.avatarUrl && !imageError ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.username}
                      onError={() => setImageError(true)}
                      className="w-9 h-9 rounded-full object-cover border border-indigo-200"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-indigo-600 text-white font-black flex items-center justify-center text-sm shadow-sm">
                      {initialLetter}
                    </div>
                  )}
                  <span className="hidden xl:inline text-xs font-bold text-slate-800 max-w-[100px] truncate">
                    {user.username}
                  </span>
                </a>

                {onLogout && (
                  <button
                    onClick={onLogout}
                    title="Déconnexion"
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <MdLogout className="text-xl" />
                  </button>
                )}
              </>
            ) : (
              <a
                href="/login"
                className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl transition-all shadow-md active:scale-95"
              >
                <MdPerson className="text-base" />
                <span>Connexion</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* DRAWER MENU MOBILE (Ouvert en cliquant sur le Logo mobile) */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-5 space-y-5 shadow-2xl animate-fadeIn">
          
          {/* Header du drawer : bouton fermer */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-black uppercase text-slate-400 tracking-wider">Navigation</span>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-1 text-slate-500 hover:bg-slate-100 rounded-lg"
            >
              <MdClose className="text-2xl" />
            </button>
          </div>

          {/* Utilisateur connecté sur mobile */}
          {user ? (
            <div className="flex items-center gap-3 p-3 bg-indigo-50/50 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0">
                {initialLetter}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">{user.username}</p>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
              </div>
            </div>
          ) : (
            <a
              href="/login"
              className="flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold text-xs py-3 rounded-xl shadow-md"
            >
              <MdPerson className="text-base" /> Se connecter / S'inscrire
            </a>
          )}

          {/* Liens de navigation mobile */}
          <nav className="flex flex-col space-y-2 font-semibold text-sm text-slate-700">
            <a href="#products" className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
              <MdStore className="text-xl text-indigo-600" /> Boutique
            </a>
            <a href="/service-client" className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
              <MdLocalOffer className="text-xl text-indigo-600" /> Service Client & Retours
            </a>
            {user && (
              <a href="/profile" className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                <MdPerson className="text-xl text-indigo-600" /> Mon Profil
              </a>
            )}
          </nav>

          {/* Déconnexion Mobile */}
          {user && onLogout && (
            <div className="pt-2 border-t border-slate-100">
              <button
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 font-bold text-xs py-2.5 rounded-xl hover:bg-red-100 transition-colors"
              >
                <MdLogout /> Se déconnecter
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

export default HeaderConnect;

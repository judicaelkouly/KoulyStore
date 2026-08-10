import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// 1. Interfaces TypeScript pour les produits et catégories
export interface Category {
  id: number | string;
  name: string;
}

export interface Product {
  id: number | string;
  title: string;
  description: string;
  price: number | string;
  promo_price?: number | string | null;
  images?: string[] | string | null;
  stock?: number;
  is_active?: boolean | number;
  category_id?: number | string;
  category?: Category;
}

interface ProductsProps {
  searchQuery?: string;
  selectedCategory?: Category | null;
  onClearCategory?: () => void;
}

function Products({
  searchQuery = "",
  selectedCategory = null,
  onClearCategory,
}: ProductsProps) {
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Gestion des actions d'ajout au panier / chargement
  const [addingId, setAddingId] = useState<number | string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Helper pour extraire le token CSRF/XSRF des cookies
  const getXsrfToken = (): string => {
    const cookies = document.cookie.split(";");
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split("=");
      if (name === "XSRF-TOKEN") return decodeURIComponent(value);
    }
    return "";
  };

  // Helper pour vérifier rapidement si l'utilisateur est connecté
  const checkAuth = async (): Promise<boolean> => {
    try {
      const xsrfToken = getXsrfToken();
      const response = await fetch("http://localhost:8000/api/user", {
        method: "GET",
        headers: {
          Accept: "application/json",
          ...(xsrfToken ? { "X-XSRF-TOKEN": xsrfToken } : {}),
        },
        credentials: "include",
      });
      return response.ok;
    } catch {
      return false;
    }
  };

  // 📥 Récupération des produits depuis l'API avec support Recherche & Catégorie
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();

        if (searchQuery.trim()) {
          params.append("search", searchQuery.trim());
        }

        if (selectedCategory) {
          params.append("category_id", String(selectedCategory.id));
        }

        const queryString = params.toString() ? `?${params.toString()}` : "";
        const response = await fetch(
          `http://localhost:8000/api/products${queryString}`,
          {
            headers: {
              Accept: "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Impossible de récupérer la liste des produits.");
        }

        const data = await response.json();
        const productList = Array.isArray(data)
          ? data
          : data.products || data.data || [];

        setProducts(productList);
        setError(null);
      } catch (err: any) {
        console.error("Erreur lors du chargement des produits:", err);
        setError(err.message || "Une erreur est survenue.");
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchProducts();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory]);

  // Filtrage local complémentaire
  const filteredProducts = products.filter((p) => {
    const isActive =
      p.is_active === undefined ||
      p.is_active === true ||
      p.is_active === 1 ||
      (p as any).is_active === "1";

    if (!isActive) {
      return false;
    }

    if (selectedCategory) {
      const matchCategoryId =
        p.category_id &&
        String(p.category_id) === String(selectedCategory.id);
      const matchCategoryObj =
        p.category?.id &&
        String(p.category.id) === String(selectedCategory.id);
      const matchCategoryName =
        p.category?.name &&
        p.category.name.toLowerCase() === selectedCategory.name.toLowerCase();

      if (!matchCategoryId && !matchCategoryObj && !matchCategoryName) {
        return false;
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchDesc = p.description && p.description.toLowerCase().includes(q);
      const matchCat = p.category?.name && p.category.name.toLowerCase().includes(q);

      return matchTitle || matchDesc || matchCat;
    }

    return true;
  });

  // Helper pour l'image d'un produit
  const getSingleImageUrl = (product: Product): string => {
    let rawImages = product.images;

    if (typeof rawImages === "string") {
      try {
        rawImages = JSON.parse(rawImages);
      } catch {}
    }

    let imgPath: string | null = null;

    if (Array.isArray(rawImages) && rawImages.length > 0) {
      const firstItem = rawImages[0];
      if (typeof firstItem === "object" && firstItem !== null) {
        imgPath = firstItem.url || firstItem.path || firstItem.image_path || null;
      } else if (typeof firstItem === "string") {
        imgPath = firstItem;
      }
    } else if (typeof rawImages === "object" && rawImages !== null) {
      imgPath = (rawImages as any).url || (rawImages as any).path || null;
    } else if (typeof rawImages === "string" && rawImages.trim() !== "") {
      imgPath = rawImages;
    }

    if (typeof imgPath === "string" && imgPath.trim() !== "") {
      if (imgPath.startsWith("http://") || imgPath.startsWith("https://")) {
        return imgPath;
      }
      return `http://localhost:8000/storage/${imgPath.replace(/^\//, "")}`;
    }

    return "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=600&q=80";
  };

  // 🛒 Action : Ajouter au panier avec gestion propre de l'authentification
  const handleAddToCart = async (
    e: React.MouseEvent,
    productId: number | string
  ) => {
    e.preventDefault();
    e.stopPropagation();

    setAddingId(productId);

    try {
      // 1. Vérification préalable de la session
      const isAuthenticated = await checkAuth();

      if (!isAuthenticated) {
        navigate("/login", {
          state: {
            message: "Veuillez vous connecter pour ajouter un article à votre panier.",
          },
        });
        return;
      }

      // 2. Utilisateur authentifié : envoi au backend
      const xsrfToken = getXsrfToken();
      const response = await fetch("http://localhost:8000/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(xsrfToken ? { "X-XSRF-TOKEN": xsrfToken } : {}),
        },
        credentials: "include",
        body: JSON.stringify({
          product_id: productId,
          quantity: 1,
        }),
      });

      // 3. Interception au cas où la session aurait expiré entre temps (401 / 419)
      if (response.status === 401 || response.status === 419) {
        navigate("/login", {
          state: {
            message: "Votre session a expiré. Veuillez vous reconnecter.",
          },
        });
        return;
      }

      if (response.ok) {
        showNotification("Produit ajouté au panier !");
      } else {
        const resData = await response.json();
        showNotification(resData.message || "Impossible d'ajouter au panier.");
      }
    } catch (err) {
      console.error("Erreur ajout panier:", err);
      showNotification("Erreur de connexion au serveur.");
    } finally {
      setAddingId(null);
    }
  };

  // 🚀 Action : Commander directement
  const handleDirectBuy = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/details?id=${product.id}`);
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h1
          className="text-3xl sm:text-4xl font-bold text-slate-800 border-l-4 border-indigo-600 pl-4"
          id="produits"
        >
          Trouvez votre produit idéal
        </h1>

        {/* Badges d'état de recherche / filtre active */}
        <div className="flex flex-wrap items-center gap-2">
          {selectedCategory && (
            <span className="inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs sm:text-sm font-medium px-3 py-1.5 rounded-full shadow-sm">
              <span>Catégorie : <strong>{selectedCategory.name}</strong></span>
              {onClearCategory && (
                <button
                  onClick={onClearCategory}
                  className="hover:bg-indigo-200 text-indigo-600 hover:text-indigo-900 rounded-full w-4 h-4 inline-flex items-center justify-center text-xs font-bold transition-colors ml-1"
                  title="Effacer le filtre par catégorie"
                >
                  ✕
                </button>
              )}
            </span>
          )}

          {searchQuery.trim() && (
            <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 text-xs sm:text-sm px-3 py-1.5 rounded-full">
              Recherche : <strong className="text-indigo-600">"{searchQuery}"</strong>
            </span>
          )}
        </div>
      </div>

      {/* Notification temporaire */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl text-xs sm:text-sm flex items-center gap-2 animate-bounce">
          <span>🛒</span> {notification}
        </div>
      )}

      {/* État de Chargement */}
      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 animate-pulse"
            >
              <div className="bg-slate-200 h-48 rounded-lg mb-4" />
              <div className="bg-slate-200 h-4 w-3/4 rounded mb-2" />
              <div className="bg-slate-200 h-4 w-1/2 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Affichage des Erreurs */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl text-center text-sm">
          {error}
        </div>
      )}

      {/* Aucun produit disponible */}
      {!loading && !error && filteredProducts.length === 0 && (
        <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-gray-200">
          <p className="text-gray-500 text-sm font-medium mb-3">
            {selectedCategory || searchQuery.trim()
              ? "Aucun produit disponible ne correspond à vos critères de recherche actuels."
              : "Aucun produit disponible pour le moment."}
          </p>
          {(selectedCategory || searchQuery.trim()) && onClearCategory && (
            <button
              onClick={onClearCategory}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow transition-all"
            >
              Afficher tous les produits
            </button>
          )}
        </div>
      )}

      {/* Grille des Produits Actifs */}
      {!loading && !error && filteredProducts.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {filteredProducts.map((product) => {
            const hasOffer = Boolean(
              product.promo_price && Number(product.promo_price) > 0
            );

            return (
              <div
                key={product.id}
                className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden hover:-translate-y-1"
              >
                {/* Lien vers la page de détails */}
                <a href={`/details?id=${product.id}`} className="block relative">
                  <div className="relative overflow-hidden h-44 sm:h-64 bg-slate-50">
                    <img
                      src={getSingleImageUrl(product)}
                      alt={product.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=600&q=80";
                      }}
                    />

                    {/* Badge Promo */}
                    {hasOffer && (
                      <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                        PROMO
                      </span>
                    )}

                    {/* Overlay et Boutons au Survol */}
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-end p-3 gap-2">
                      <button
                        type="button"
                        onClick={(e) => handleAddToCart(e, product.id)}
                        disabled={addingId === product.id}
                        className="w-full bg-white text-slate-900 hover:bg-slate-100 py-2 rounded-lg font-semibold text-xs shadow transition-all flex items-center justify-center gap-1.5 active:scale-95"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"
                          />
                        </svg>
                        {addingId === product.id ? "Ajout..." : "Panier"}
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleDirectBuy(e, product)}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg font-semibold text-xs shadow transition-all flex items-center justify-center gap-1.5 active:scale-95"
                      >
                        Acheter
                      </button>
                    </div>
                  </div>
                </a>

                {/* Informations du Produit */}
                <div className="p-4 flex flex-col justify-between flex-grow">
                  <div>
                    <a href={`/details?id=${product.id}`}>
                      <h3 className="font-bold text-black text-lg sm:text-base text-center line-clamp-1 hover:text-indigo-600 transition-colors">
                        {product.title}
                      </h3>
                    </a>
                    <p className="text-gray-400 text-xs mt-1 line-clamp-2">
                      {product.description || "Aucune description disponible."}
                    </p>
                  </div>

                  {/* Prix et Étoiles */}
                  <div className="mt-4 pt-2 border-t border-gray-50 flex items-center justify-between">
                    <div>
                      {hasOffer ? (
                        <div className="flex flex-col">
                          <span className="font-extrabold text-indigo-600 text-xs sm:text-sm">
                            {Number(product.promo_price).toLocaleString()} FCFA
                          </span>
                          <span className="text-[10px] text-gray-400 line-through">
                            {Number(product.price).toLocaleString()} FCFA
                          </span>
                        </div>
                      ) : (
                        <span className="font-extrabold text-indigo-600 text-xs sm:text-sm">
                          {Number(product.price).toLocaleString()} FCFA
                        </span>
                      )}
                    </div>

                    <div className="flex text-amber-400 text-[10px] sm:text-lg">
                      ★ ★ ★ ★ ☆
                    </div>
                  </div>
                  <span className="text-gray-400 text-[10px] sm:text-xs text-center mt-1">
                    ({product.stock || 0}) Articles seulement restants
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Products;

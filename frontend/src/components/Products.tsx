import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaStar, FaRegStar } from "react-icons/fa6";

// URL de base dynamique pour l'API
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
const STORAGE_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "");

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
  rating?: number;
  average_rating?: number;
  reviews_count?: number;
  total_reviews?: number;
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

  // États pour les produits et la pagination
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const PER_PAGE = 30;

  // État pour stocker les notes récupérées dynamiquement
  const [ratingsMap, setRatingsMap] = useState<Record<string | number, { rating: number; count: number }>>({});

  const [addingId, setAddingId] = useState<number | string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Helper pour générer le rendu dynamique des étoiles
  const renderStars = (rating: number = 0) => {
    const stars = [];
    const roundedRating = Math.round(rating);

    for (let i = 1; i <= 5; i++) {
      if (i <= roundedRating) {
        stars.push(<FaStar key={i} className="text-amber-400" />);
      } else {
        stars.push(<FaRegStar key={i} className="text-gray-300 dark:text-gray-600" />);
      }
    }
    return <div className="flex items-center gap-0.5 text-xs sm:text-sm">{stars}</div>;
  };

  const getXsrfToken = (): string => {
    const cookies = document.cookie.split(";");
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split("=");
      if (name === "XSRF-TOKEN") return decodeURIComponent(value);
    }
    return "";
  };

  const checkAuth = async (): Promise<boolean> => {
    try {
      const xsrfToken = getXsrfToken();
      const response = await fetch(`${API_BASE_URL}/user`, {
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

  // 📥 Récupération initiale ou réinitialisation lors d'un changement de filtre (page = 1)
  useEffect(() => {
    setPage(1);
    setProducts([]);
    setHasMore(true);
    fetchProducts(1, true);
  }, [searchQuery, selectedCategory]);

  // Fonction principale de chargement des produits (par page)
  const fetchProducts = async (pageToFetch: number, isReset: boolean = false) => {
    if (isReset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append("page", String(pageToFetch));
      params.append("per_page", String(PER_PAGE));

      if (searchQuery.trim()) {
        params.append("search", searchQuery.trim());
      }

      if (selectedCategory) {
        params.append("category_id", String(selectedCategory.id));
      }

      const response = await fetch(
        `${API_BASE_URL}/products?${params.toString()}`,
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

      // Extraction des produits gérant les réponses paginées Laravel (data.data) ou simples tableaux
      const newProducts: Product[] = Array.isArray(data)
        ? data
        : data.data || data.products || [];

      // Vérification s'il reste d'autres pages à charger
      if (data.current_page && data.last_page) {
        setHasMore(data.current_page < data.last_page);
      } else {
        setHasMore(newProducts.length === PER_PAGE);
      }

      if (isReset) {
        setProducts(newProducts);
      } else {
        // Empêche les doublons éventuels
        setProducts((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const filteredNew = newProducts.filter((p) => !existingIds.has(p.id));
          return [...prev, ...filteredNew];
        });
      }

      // Récupérer les notes des nouveaux produits
      fetchRatingsForProducts(newProducts);

    } catch (err: any) {
      console.error("Erreur lors du chargement des produits:", err);
      setError(err.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Handler pour déclencher le chargement des 25 produits suivants
  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchProducts(nextPage, false);
    }
  };

  // Fonction pour charger la moyenne des notes de chaque produit
  const fetchRatingsForProducts = (productList: Product[]) => {
    productList.forEach(async (product) => {
      if (product.average_rating !== undefined || product.rating !== undefined) return;

      try {
        const res = await fetch(`${API_BASE_URL}/products/${product.id}/reviews`, {
          headers: { Accept: "application/json" },
        });
        if (res.ok) {
          const revData = await res.json();
          setRatingsMap((prev) => ({
            ...prev,
            [product.id]: {
              rating: revData.average_rating || 0,
              count: revData.total_reviews || 0,
            },
          }));
        }
      } catch (e) {
        console.error(`Erreur chargement note produit ${product.id}:`, e);
      }
    });
  };

  // Filtrage local complémentaire
  const filteredProducts = products.filter((p) => {
    const isActive =
      p.is_active === undefined ||
      p.is_active === true ||
      p.is_active === 1 ||
      (p as any).is_active === "1";

    if (!isActive) return false;

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

  const getSingleImageUrl = (product: Product): string => {
    let rawImages = product.images;

    if (typeof rawImages === "string") {
      try {
        rawImages = JSON.parse(rawImages);
      } catch {}
    }

    let imgPath: string | null = null;

    if (Array.isArray(rawImages) && rawImages.length > 0) {
      const firstItem = rawImages[0] as { url?: string; path?: string; image_path?: string } | string | undefined;

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
      return `${STORAGE_BASE_URL}/storage/${imgPath.replace(/^\//, "")}`;
    }

    return "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=600&q=80";
  };

  const handleAddToCart = async (
    e: React.MouseEvent,
    productId: number | string
  ) => {
    e.preventDefault();
    e.stopPropagation();

    setAddingId(productId);

    try {
      const isAuthenticated = await checkAuth();

      if (!isAuthenticated) {
        navigate("/login", {
          state: {
            message: "Veuillez vous connecter pour ajouter un article à votre panier.",
          },
        });
        return;
      }

      const xsrfToken = getXsrfToken();
      const response = await fetch(`${API_BASE_URL}/cart`, {
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
    <div className="max-w-8xl mx-auto px-4 sm:px-6 py-8 relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h1
          className="text-3xl sm:text-4xl font-bold text-slate-800 border-l-4 border-indigo-600 pl-4"
          id="produits"
        >
          Trouvez votre produit idéal
        </h1>

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

      {notification && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl text-xs sm:text-sm flex items-center gap-2 animate-bounce">
          <span>🛒</span> {notification}
        </div>
      )}

      {/* Squelette de chargement initial */}
      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
          {Array.from({ length: 12 }).map((_, i) => (
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

      {error && !loading && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl text-center text-sm">
          {error}
        </div>
      )}

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

      {!loading && !error && filteredProducts.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-6">
            {filteredProducts.map((product) => {
              const hasOffer = Boolean(
                product.promo_price && Number(product.promo_price) > 0
              );

              const ratingData = ratingsMap[product.id];
              const productRating = product.average_rating ?? product.rating ?? ratingData?.rating ?? 0;
              const reviewsCount = product.total_reviews ?? product.reviews_count ?? ratingData?.count ?? 0;

              return (
                <div
  key={product.id}
  className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden hover:-translate-y-1"
>
  {/* SECTION IMAGE & BADGES */}
  <a href={`/details?id=${product.id}`} className="block relative">
    <div className="relative overflow-hidden h-48 sm:h-56 bg-slate-50">
      <img
        src={getSingleImageUrl(product)}
        alt={product.title}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        onError={(e) => {
          (e.target as HTMLImageElement).src =
            "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=600&q=80";
        }}
      />

      {/* Badges d'état (Promo) */}
      <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
        {hasOffer && (
          <span className="bg-red-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-md tracking-wider uppercase">
            PROMO
          </span>
        )}
      </div>

      {/* OVERLAY D'ACTIONS AU SURVOL (Desktop uniquement) */}
      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden sm:flex flex-col items-center justify-end p-3 gap-2 backdrop-blur-[2px]">
        <button
          type="button"
          onClick={(e) => handleAddToCart(e, product.id)}
          disabled={addingId === product.id}
          className="w-full bg-white text-slate-900 hover:bg-slate-100 py-2 rounded-xl font-semibold text-xs shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
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
          {addingId === product.id ? "Ajout en cours..." : "Ajouter au panier"}
        </button>

        <button
          type="button"
          onClick={(e) => handleDirectBuy(e, product)}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-xl font-semibold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
        >
          Acheter maintenant
        </button>
      </div>
    </div>
  </a>

  {/* SECTION CONTENU & INFORMATIONS */}
  <div className="p-4 flex flex-col justify-between flex-grow gap-3">
    <div>
      {/* Titre */}
      <a href={`/details?id=${product.id}`}>
        <h3 className="text-slate-800 font-bold text-sm sm:text-base line-clamp-2 hover:text-indigo-600 transition-colors leading-snug">
          {product.title}
        </h3>
      </a>

      {/* Évaluations / Étoiles */}
      <div className="flex items-center gap-1.5 mt-1.5">
        <div className="flex items-center text-amber-400 text-xs">
          {renderStars(productRating)}
        </div>
        {reviewsCount > 0 && (
          <span className="text-[11px] text-gray-400 font-medium">
            ({reviewsCount})
          </span>
        )}
      </div>
    </div>

    {/* BAS DE CARTE : Prix, Stock & Actions */}
    <div className="pt-2 border-t border-gray-100 flex flex-col gap-2">
      {/* Flex direction vertical sur mobile (flex-col), horizontal sur PC (sm:flex-row) */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between items-start gap-1 sm:gap-2">
        {/* Prix */}
        <div className="flex flex-col">
          {hasOffer ? (
            <>
              <span className="text-[11px] text-gray-400 line-through leading-none">
                {Number(product.price).toLocaleString()} FCFA
              </span>
              <span className="font-extrabold text-indigo-600 text-base sm:text-lg leading-tight">
                {Number(product.promo_price).toLocaleString()} FCFA
              </span>
            </>
          ) : (
            <span className="font-extrabold text-indigo-600 text-base sm:text-lg leading-tight">
              {Number(product.price).toLocaleString()} FCFA
            </span>
          )}
        </div>

        {/* Indication du stock (sur sa propre ligne sur mobile) */}
        <span
          className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
            (product.stock || 0) <= 5
              ? "bg-amber-50 text-amber-700"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {product.stock || 0} restants
        </span>
      </div>

      {/* BOUTONS D'ACTION MOBILE */}
      <div className="grid grid-cols-2 gap-2 sm:hidden mt-1">
        <button
          type="button"
          onClick={(e) => handleAddToCart(e, product.id)}
          disabled={addingId === product.id}
          className="bg-slate-100 text-slate-800 py-1.5 rounded-lg text-[11px] font-semibold active:scale-95 cursor-pointer"
        >
          {addingId === product.id ? "..." : "+ Panier"}
        </button>
        <button
          type="button"
          onClick={(e) => handleDirectBuy(e, product)}
          className="bg-indigo-600 text-white py-1.5 rounded-lg text-[11px] font-semibold active:scale-95 cursor-pointer"
        >
          Acheter
        </button>
      </div>
    </div>
  </div>
</div>
              );
            })}
          </div>

          {/* Bouton "Charger plus" en bas de page */}
          {hasMore && (
            <div className="flex flex-col items-center justify-center mt-12 gap-2">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-extrabold text-sm px-8 py-3.5 rounded-xl shadow-lg hover:shadow-indigo-500/25 transition-all flex items-center gap-3 disabled:opacity-60 cursor-pointer"
              >
                {loadingMore ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Chargement des produits suivants...</span>
                  </>
                ) : (
                  <>
                    <span>Voir plus de produits</span>
                  </>
                )}
              </button>
              
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Products;

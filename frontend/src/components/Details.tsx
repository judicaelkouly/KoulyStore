import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaMoneyBillTransfer, FaStar, FaRegStar } from "react-icons/fa6";
import { FaCheckCircle } from "react-icons/fa";

// Interfaces TypeScript
export interface ProductDetail {
  id: number | string;
  title: string;
  description: string;
  shortDescription?: string;
  price: number | string;
  promo_price?: number | string | null;
  stock?: number;
  category?: {
    id: number | string;
    name: string;
  } | string;
  images?: string[] | string | any;
  sizes?: string[] | string | null;
}

export interface ReviewUser {
  id: number | string;
  name?: string;
  username?: string;
}

export interface ReviewItem {
  id: number | string;
  rating: number;
  title?: string;
  comment?: string;
  created_at?: string;
  user?: ReviewUser;
}

export interface ReviewData {
  average_rating: number;
  total_reviews: number;
  stars_distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  reviews: ReviewItem[];
}

function Details() {
  const navigate = useNavigate();

  // États du produit et du chargement
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<"description" | "shipping">("description");

  // États pour les avis / reviews
  const [reviewsData, setReviewsData] = useState<ReviewData>({
    average_rating: 0,
    total_reviews: 0,
    stars_distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    reviews: [],
  });
  const [loadingReviews, setLoadingReviews] = useState<boolean>(true);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [addingToCart, setAddingToCart] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  // 📥 Fetch du produit & des avis selon l'ID
  useEffect(() => {
    const fetchProductDetails = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const productId = urlParams.get("id");

      if (!productId) {
        setError("Aucun identifiant de produit spécifié.");
        setLoading(false);
        setLoadingReviews(false);
        return;
      }

      try {
        // Fetch Produit
        const response = await fetch(`http://localhost:8000/api/products/${productId}`, {
          headers: { Accept: "application/json" },
        });

        if (!response.ok) {
          throw new Error("Impossible de charger les détails de ce produit.");
        }

        const data = await response.json();
        const fetchedProduct: ProductDetail = data.data || data.product || data;

        setProduct(fetchedProduct);

        // Normalisation des images
        let parsedImages: string[] = [];
        let rawImgs = fetchedProduct.images;

        if (typeof rawImgs === "string") {
          try { rawImgs = JSON.parse(rawImgs); } catch {}
        }

        if (Array.isArray(rawImgs)) {
          parsedImages = rawImgs.map((img) => {
            if (typeof img === "string") {
              return img.startsWith("http") ? img : `http://localhost:8000/storage/${img.replace(/^\//, "")}`;
            }
            if (typeof img === "object" && img !== null) {
              const path = img.url || img.path || img.image_path || "";
              return path.startsWith("http") ? path : `http://localhost:8000/storage/${path.replace(/^\//, "")}`;
            }
            return "";
          }).filter(Boolean);
        } else if (typeof rawImgs === "string" && rawImgs.trim() !== "") {
          const imgUrl = rawImgs.startsWith("http")
            ? rawImgs
            : `http://localhost:8000/storage/${rawImgs.replace(/^\//, "")}`;
          parsedImages = [imgUrl];
        }

        if (parsedImages.length === 0) {
          parsedImages = ["https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=1000&q=80"];
        }

        setImages(parsedImages);
        setSelectedImage(parsedImages[0]);

        // Normalisation des tailles
        let parsedSizes: string[] = [];
        let rawSizes = fetchedProduct.sizes;

        if (typeof rawSizes === "string") {
          try {
            parsedSizes = JSON.parse(rawSizes);
          } catch {
            parsedSizes = rawSizes.split(",").map((s) => s.trim());
          }
        } else if (Array.isArray(rawSizes)) {
          parsedSizes = rawSizes;
        }

        setSizes(parsedSizes);
        if (parsedSizes.length > 0) {
          setSelectedSize(parsedSizes[0]);
        }

        // Fetch des avis
        fetchProductReviews(productId);

      } catch (err: any) {
        console.error("Erreur chargement détail produit :", err);
        setError(err.message || "Une erreur est survenue lors du chargement.");
        setLoadingReviews(false);
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, []);

  // Fetch séparé pour les avis
  const fetchProductReviews = async (productId: string) => {
    try {
      const res = await fetch(`http://localhost:8000/api/products/${productId}/reviews`, {
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        const revData = await res.json();
        setReviewsData({
          average_rating: revData.average_rating || 0,
          total_reviews: revData.total_reviews || 0,
          stars_distribution: revData.stars_distribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
          reviews: revData.reviews || [],
        });
      }
    } catch (e) {
      console.error("Erreur chargement des avis:", e);
    } finally {
      setLoadingReviews(false);
    }
  };

  // Formateur de prix FCFA
  const formatPrice = (price: number | string) => {
    return Number(price).toLocaleString("fr-FR") + " FCFA";
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(null);
    }, 3500);
  };

  // Générateur d'étoiles dynamique
  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= Math.round(rating)) {
        stars.push(<FaStar key={i} className="text-amber-400 text-sm" />);
      } else {
        stars.push(<FaRegStar key={i} className="text-gray-300 dark:text-gray-600 text-sm" />);
      }
    }
    return <div className="flex items-center gap-1">{stars}</div>;
  };

  // Formatage de la date en JJ-MM-AAAA
  const formatDate = (dateString?: string) => {
    if (!dateString) return new Date().toLocaleDateString("fr-FR");
    const d = new Date(dateString);
    return d.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Action : Ajouter au panier
  const handleAddToCart = async () => {
    if (!product) return;

    if (sizes.length > 0 && !selectedSize) {
      showNotification("Veuillez sélectionner une taille !");
      return;
    }

    setAddingToCart(true);
    try {
      const response = await fetch("http://localhost:8000/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          product_id: product.id,
          quantity: quantity,
          size: selectedSize || null,
        }),
      });

      if (response.ok) {
        showNotification("Produit ajouté au panier avec succès !");
      } else {
        const resData = await response.json();
        showNotification(resData.message || "Erreur lors de l'ajout au panier.");
      }
    } catch (err) {
      console.error("Erreur d'ajout au panier:", err);
      showNotification("Impossible d'ajouter au panier.");
    } finally {
      setAddingToCart(false);
    }
  };

  // Action : Commander directement
  const handleDirectBuy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!product) return;

    if (sizes.length > 0 && !selectedSize) {
      showNotification("Veuillez sélectionner une taille !");
      return;
    }

    const effectivePrice =
      product.promo_price && Number(product.promo_price) > 0
        ? Number(product.promo_price)
        : Number(product.price);

    const categoryName =
      typeof product.category === "object"
        ? product.category?.name
        : product.category || "Général";

    navigate("/checkout", {
      state: {
        items: [
          {
            id: product.id,
            name: product.title,
            category: categoryName,
            price: effectivePrice,
            quantity: quantity,
            size: selectedSize || null,
            image: selectedImage || images[0],
          },
        ],
        source: "direct",
      },
    });
  };

  const categoryName = typeof product?.category === "object"
    ? product?.category?.name
    : product?.category || "Général";

  const hasOffer = Boolean(product?.promo_price && Number(product.promo_price) > 0);

  return (
    <div className="bg-slate-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8 w-full transition-colors min-h-screen">
      
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl text-xs sm:text-sm flex items-center gap-2 animate-bounce">
          <span>🔔</span> {notification}
        </div>
      )}

      {/* État de chargement */}
      {loading && (
        <div className="max-w-6xl mx-auto bg-white dark:bg-gray-800 rounded-3xl p-8 animate-pulse flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-1/2 h-[400px] bg-slate-200 dark:bg-gray-700 rounded-2xl"></div>
          <div className="w-full lg:w-1/2 flex flex-col gap-4">
            <div className="h-6 bg-slate-200 dark:bg-gray-700 w-1/3 rounded"></div>
            <div className="h-10 bg-slate-200 dark:bg-gray-700 w-3/4 rounded"></div>
            <div className="h-12 bg-slate-200 dark:bg-gray-700 w-1/2 rounded"></div>
            <div className="h-24 bg-slate-200 dark:bg-gray-700 w-full rounded"></div>
          </div>
        </div>
      )}

      {/* Gestion des erreurs */}
      {error && !loading && (
        <div className="max-w-xl mx-auto bg-red-50 border border-red-200 text-red-600 p-6 rounded-2xl text-center">
          <p className="font-bold text-lg mb-2">Oups !</p>
          <p className="text-sm">{error}</p>
          <a
            href="/"
            className="inline-block mt-4 bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold"
          >
            Retourner à l'accueil
          </a>
        </div>
      )}

      {/* Affichage des détails du produit */}
      {!loading && !error && product && (
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-200/80 dark:border-gray-700/60 p-6 md:p-10">
            <div className="flex flex-col lg:flex-row gap-10">
              
              {/* ================= ZONE VISUELLE : Galerie Multi-Photos ================= */}
              <div className="flex-1 flex flex-col gap-4">
                <div className="relative h-[380px] sm:h-[460px] rounded-2xl bg-slate-100 dark:bg-gray-700/50 overflow-hidden group border border-gray-100 dark:border-gray-700">
                  {hasOffer && (
                    <span className="absolute top-4 left-4 bg-rose-500 text-white text-xs font-bold px-3 py-1.5 rounded-full z-10 shadow-sm">
                      PROMO
                    </span>
                  )}
                  <img
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    src={selectedImage}
                    alt={product.title}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=1000&q=80";
                    }}
                  />
                </div>

                {images.length > 1 && (
                  <div className="flex items-center gap-3 overflow-x-auto pb-2">
                    {images.map((img, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImage(img)}
                        className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                          selectedImage === img
                            ? "border-indigo-600 ring-2 ring-indigo-600/30"
                            : "border-gray-200 dark:border-gray-700 opacity-70 hover:opacity-100"
                        }`}
                      >
                        <img
                          src={img}
                          alt={`Miniature ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* ================= ZONE DÉTAILS PRODUIT ================= */}
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold tracking-wider uppercase text-gray-400 dark:text-gray-400 mb-2">
                    <span>
                      Catégorie :{" "}
                      <strong className="text-gray-700 dark:text-gray-200">
                        {categoryName}
                      </strong>
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-3 tracking-tight">
                    {product.title}
                  </h1>

                  <div className="flex items-center gap-4 mb-6 bg-slate-50 dark:bg-gray-700/40 p-3.5 rounded-2xl w-fit border border-gray-100 dark:border-gray-700">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                        {formatPrice(hasOffer ? product.promo_price! : product.price)}
                      </span>
                      {hasOffer && (
                        <span className="text-sm text-gray-400 line-through font-medium">
                          {formatPrice(product.price)}
                        </span>
                      )}
                    </div>
                    <div className="w-px h-5 bg-gray-300 dark:bg-gray-600"></div>
                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                      {(product.stock ?? 1) > 0 ? "En Stock" : "Rupture de stock"}
                    </span>
                  </div>

                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-6 line-clamp-2">
                    {product.shortDescription || product.description}
                  </p>

                  {/* TAILLE / POINTURE */}
                  {sizes.length > 0 && (
                    <div className="mb-6">
                      <div className="flex justify-between items-center mb-2.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-gray-300">
                          Choisir la Taille / Pointure :
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {sizes.map((size) => (
                          <button
                            key={size}
                            type="button"
                            onClick={() => setSelectedSize(size)}
                            className={`min-w-11 h-10 px-3 rounded-xl font-bold text-xs transition-all border cursor-pointer ${
                              selectedSize === size
                                ? "bg-indigo-600 border-indigo-600 text-white shadow-sm scale-105"
                                : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-slate-800 dark:text-white hover:border-gray-400"
                            }`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SÉLECTEUR DE QUANTITÉ */}
                  <div className="mb-6">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-gray-300 block mb-2">
                      Quantité :
                    </span>
                    <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-xl w-fit bg-slate-50 dark:bg-gray-800">
                      <button
                        type="button"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="px-3.5 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-l-xl transition-colors font-bold"
                      >
                        -
                      </button>
                      <span className="px-4 py-2 font-bold text-sm text-slate-900 dark:text-white">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuantity(quantity + 1)}
                        className="px-3.5 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-r-xl transition-colors font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* BOUTONS D'ACTION */}
                  <div className="flex flex-col sm:flex-row items-center gap-3 mt-6">
                    <button
                      type="button"
                      onClick={handleAddToCart}
                      disabled={addingToCart}
                      className="w-full sm:w-1/2 border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-gray-700 py-3.5 px-6 rounded-2xl font-bold text-sm transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2"
                    >
                      <span>{addingToCart ? "Ajout..." : "Ajouter au Panier"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDirectBuy}
                      className="w-full sm:w-1/2 bg-indigo-600 text-white py-3.5 px-6 rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                    >
                      <FaMoneyBillTransfer className="text-base" />
                      <span>Acheter Maintenant</span>
                    </button>
                  </div>
                </div>

                {/* ONGLETS DESCRIPTION & LIVRAISON */}
                <div className="border-t border-gray-100 dark:border-gray-700/80 pt-6 mt-8">
                  <div className="flex gap-6 border-b border-gray-100 dark:border-gray-700/80 text-sm mb-4">
                    <button
                      type="button"
                      onClick={() => setActiveTab("description")}
                      className={`pb-2.5 font-bold transition-all relative cursor-pointer ${
                        activeTab === "description"
                          ? "text-indigo-600 dark:text-indigo-400 after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-indigo-600"
                          : "text-gray-400 hover:text-gray-600"
                      }`}
                    >
                      Description Complète
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("shipping")}
                      className={`pb-2.5 font-bold transition-all relative cursor-pointer ${
                        activeTab === "shipping"
                          ? "text-indigo-600 dark:text-indigo-400 after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-indigo-600"
                          : "text-gray-400 hover:text-gray-600"
                      }`}
                    >
                      Livraison & Retours
                    </button>
                  </div>

                  <div className="min-h-20">
                    {activeTab === "description" ? (
                      <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                        {product.description}
                      </p>
                    ) : (
                      <ul className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm leading-relaxed space-y-1.5 list-disc pl-4">
                        <li>Livraison rapide en 24h à 48h partout en Côte d'Ivoire.</li>
                        <li>Paiement à la livraison accepté (Wave, Orange Money, MTN Money, Cash).</li>
                        <li>Retour gratuit sous 7 jours sous conditions.</li>
                      </ul>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* ================= SECTION AVIS & NOTES CLIENTS ================= */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-200/80 dark:border-gray-700/60 p-6 md:p-8">
            {/* Header de la section */}
            <div className="flex items-center justify-between pb-6 mb-6 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                Commentaires clients vérifiés
              </h2>
              <button 
                type="button"
                className="text-xs sm:text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors"
              >
                Voir plus &gt;
              </button>
            </div>

            {loadingReviews ? (
              <div className="py-12 text-center text-gray-400 text-sm animate-pulse">
                Chargement des commentaires...
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                
                {/* COLONNE GAUCHE : Statistique globale & Répartition */}
                <div className="md:col-span-5 lg:col-span-4 border-b md:border-b-0 md:border-r border-gray-100 dark:border-gray-700 pb-6 md:pb-0 md:pr-8">
                  <div className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wider mb-4">
                    AVIS VÉRIFIÉS ({reviewsData.total_reviews})
                  </div>

                  {/* Bloc Box Moyenne Note */}
                  <div className="bg-slate-100/80 dark:bg-gray-700/40 rounded-2xl p-6 text-center mb-6">
                    <div className="text-4xl font-extrabold text-amber-500 mb-2">
                      {reviewsData.average_rating.toFixed(1)}<span className="text-2xl text-gray-400">/5</span>
                    </div>
                    <div className="flex justify-center mb-2">
                      {renderStars(reviewsData.average_rating)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                      {reviewsData.total_reviews} avis vérifiés
                    </div>
                  </div>

                  {/* Barres de répartition des étoiles (5 à 1) */}
                  <div className="space-y-2.5">
                    {[5, 4, 3, 2, 1].map((starKey) => {
                      const count = reviewsData.stars_distribution[starKey as keyof typeof reviewsData.stars_distribution] || 0;
                      const percentage = reviewsData.total_reviews > 0 
                        ? Math.round((count / reviewsData.total_reviews) * 100) 
                        : 0;

                      return (
                        <div key={starKey} className="flex items-center gap-2 text-xs">
                          <span className="w-3 text-gray-700 dark:text-gray-300 font-bold">{starKey}</span>
                          <FaStar className="text-amber-400 text-xs shrink-0" />
                          <span className="w-8 text-gray-400 text-right font-medium">({count})</span>
                          <div className="flex-1 bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                            <div 
                              className="bg-amber-400 h-full rounded-full transition-all duration-500" 
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* COLONNE DROITE : Liste des commentaires */}
                <div className="md:col-span-7 lg:col-span-8">
                  <div className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400 tracking-wider mb-6">
                    COMMENTAIRES ({reviewsData.reviews.length})
                  </div>

                  {reviewsData.reviews.length === 0 ? (
                    <div className="py-12 text-center text-gray-400 text-sm">
                      Aucun avis pour le moment. Soyez le premier à donner votre avis après votre achat !
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-700/80 space-y-6">
                      {reviewsData.reviews.map((rev) => {
                        const authorName = rev.user?.username || rev.user?.name || "Client vérifié";

                        return (
                          <div key={rev.id} className="pt-6 first:pt-0">
                            {/* Étoiles du commentaire */}
                            <div className="mb-2">
                              {renderStars(rev.rating)}
                            </div>

                            {/* Titre de l'avis */}
                            {rev.title && (
                              <h4 className="font-extrabold text-sm text-gray-900 dark:text-white mb-1.5">
                                {rev.title}
                              </h4>
                            )}

                            {/* Contenu / Commentaire */}
                            {rev.comment && (
                              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
                                {rev.comment}
                              </p>
                            )}

                            {/* Méta infos : Date + Auteur + Badge Achat vérifié */}
                            <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
                              <div>
                                <span>{formatDate(rev.created_at)}</span>
                                <span className="mx-1.5">par</span>
                                <span className="font-semibold text-gray-700 dark:text-gray-300">
                                  {authorName}
                                </span>
                              </div>

                              <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                                <FaCheckCircle className="text-xs" />
                                <span>Achat vérifié</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Details;

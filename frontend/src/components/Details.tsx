import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaMoneyBillTransfer } from "react-icons/fa6";

// 1. Interfaces TypeScript
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

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [addingToCart, setAddingToCart] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  // 📥 Fetch du produit selon l'ID dans l'URL (ex: /details?id=12)
  useEffect(() => {
    const fetchProductDetails = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const productId = urlParams.get("id");

      if (!productId) {
        setError("Aucun identifiant de produit spécifié.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`http://localhost:8000/api/products/${productId}`, {
          headers: {
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Impossible de charger les détails de ce produit.");
        }

        const data = await response.json();
        const fetchedProduct: ProductDetail = data.data || data.product || data;

        setProduct(fetchedProduct);

        // --- 🖼️ Normalisation des images ---
        let parsedImages: string[] = [];
        let rawImgs = fetchedProduct.images;

        if (typeof rawImgs === "string") {
          try {
            rawImgs = JSON.parse(rawImgs);
          } catch {
            // Simple chaîne
          }
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

        // --- 📏 Normalisation des tailles ---
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

      } catch (err: any) {
        console.error("Erreur chargement détail produit :", err);
        setError(err.message || "Une erreur est survenue lors du chargement.");
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, []);

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

  // 🛒 Action : Ajouter au panier
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

  // 🚀 Action : Commander directement (Identique à la carte de produit)
  const handleDirectBuy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!product) return;

    if (sizes.length > 0 && !selectedSize) {
      showNotification("Veuillez sélectionner une taille !");
      return;
    }

    // Calcul du prix effectif selon promo
    const effectivePrice =
      product.promo_price && Number(product.promo_price) > 0
        ? Number(product.promo_price)
        : Number(product.price);

    // Extraction du nom de la catégorie
    const categoryName =
      typeof product.category === "object"
        ? product.category?.name
        : product.category || "Général";

    // Transmission des données via le state du React Router
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

  // Nom de la catégorie
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

      {/* Affichage des détails */}
      {!loading && !error && product && (
        <div className="max-w-6xl mx-auto bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-200/80 dark:border-gray-700/60 p-6 md:p-10">
          <div className="flex flex-col lg:flex-row gap-10">
            
            {/* ================= ZONE VISUELLE : Galerie Multi-Photos ================= */}
            <div className="flex-1 flex flex-col gap-4">
              {/* Image Principale */}
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

              {/* Thumbnails */}
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
                {/* Entête : Catégorie */}
                <div className="flex items-center justify-between text-xs font-semibold tracking-wider uppercase text-gray-400 dark:text-gray-400 mb-2">
                  <span>
                    Catégorie :{" "}
                    <strong className="text-gray-700 dark:text-gray-200">
                      {categoryName}
                    </strong>
                  </span>
                </div>

                {/* Titre */}
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-3 tracking-tight">
                  {product.title}
                </h1>

                {/* Prix & Stock */}
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

                {/* Description courte */}
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-6 line-clamp-2">
                  {product.shortDescription || product.description}
                </p>

                {/* CHOIX DE LA TAILLE / POINTURE */}
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
                      <li>Paiement à la livraison accepté (Wave, Orange Money, Cash).</li>
                      <li>Retour gratuit sous 7 jours sous conditions.</li>
                    </ul>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Details;

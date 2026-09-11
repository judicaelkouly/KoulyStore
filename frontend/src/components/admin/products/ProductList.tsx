import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Plus,
  Trash2,
  Edit3,
  Package,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Tag,
  ArrowLeft
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
const STORAGE_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "");

export interface Product {
  id: number | string;
  title?: string;
  name?: string;
  price: number | string;
  promo_price?: number | string | null;
  stock: number;
  is_active?: boolean;
  category?: {
    id: number | string;
    name: string;
  } | string;
  images?: any;
}

function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | string | null>(null);
  const [togglingId, setTogglingId] = useState<number | string | null>(null);

  // Filtres
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [stockFilter, setStockFilter] = useState<string>("all");

  // Pagination (15 par page)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 15;

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
      ...(xsrfToken ? { "X-XSRF-TOKEN": xsrfToken } : {}),
    };
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/admin/products`, {
        credentials: "include",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error("Impossible de récupérer la liste des produits.");
      }

      const data = await response.json();
      const productList = Array.isArray(data)
        ? data
        : data.products || data.data || [];

      setProducts(productList);
    } catch (err: any) {
      console.error("Erreur lors du chargement des produits:", err);
      setError(err.message || "Une erreur est survenue lors de la récupération.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleToggleStatus = async (id: number | string, currentStatus?: boolean) => {
    setTogglingId(id);

    try {
      const response = await fetch(`${API_BASE_URL}/admin/products/${id}/toggle-status`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erreur lors du changement de statut.");
      }

      setProducts((prevProducts) =>
        prevProducts.map((p) =>
          p.id === id ? { ...p, is_active: data.is_active ?? !currentStatus } : p
        )
      );
    } catch (err: any) {
      console.error("Erreur toggle status:", err);
      alert(err.message || "Impossible de changer le statut du produit.");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id: number | string, productName: string) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer "${productName}" ?`)) {
      return;
    }

    setDeletingId(id);

    try {
      const response = await fetch(`${API_BASE_URL}/admin/products/${id}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erreur lors de la suppression.");
      }

      setProducts((prev) => prev.filter((item) => item.id !== id));
    } catch (err: any) {
      console.error("Erreur de suppression:", err);
      alert(err.message || "Erreur lors de la suppression.");
    } finally {
      setDeletingId(null);
    }
  };

  // Filtrage multicritères
  const filteredProducts = products.filter((product) => {
    const query = searchTerm.trim().toLowerCase();
    const productName = (product.title || product.name || "").toLowerCase();
    const categoryName = (
      typeof product.category === "object"
        ? product.category?.name
        : product.category || ""
    ).toLowerCase();

    const matchesSearch = !query || productName.includes(query) || categoryName.includes(query);

    let matchesStock = true;
    if (stockFilter === "in_stock") matchesStock = product.stock > 5;
    else if (stockFilter === "low_stock") matchesStock = product.stock > 0 && product.stock <= 5;
    else if (stockFilter === "out_of_stock") matchesStock = product.stock <= 0;
    else if (stockFilter === "hidden") matchesStock = product.is_active === false;

    return matchesSearch && matchesStock;
  });

  // Calcul pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const getProductImage = (product: Product): string => {
    let rawImgs = product.images;

    if (typeof rawImgs === "string") {
      try {
        rawImgs = JSON.parse(rawImgs);
      } catch {}
    }

    const formatUrl = (path: string) => {
      if (path.startsWith("http://") || path.startsWith("https://")) {
        return path;
      }
      const cleanPath = path.replace(/^\//, "");
      return cleanPath.startsWith("storage/")
        ? `${STORAGE_BASE_URL}/${cleanPath}`
        : `${STORAGE_BASE_URL}/storage/${cleanPath}`;
    };

    if (Array.isArray(rawImgs) && rawImgs.length > 0) {
      const first = rawImgs[0];
      if (typeof first === "string") {
        return formatUrl(first);
      }
      if (typeof first === "object" && first !== null) {
        const url = first.url || first.path || first.image_path || "";
        return formatUrl(url);
      }
    }

    if (typeof rawImgs === "string" && rawImgs.trim() !== "") {
      return formatUrl(rawImgs);
    }

    return "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=100&q=80";
  };

  // Statistiques rapides
  const totalProducts = products.length;
  const inStockCount = products.filter((p) => p.stock > 5).length;
  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= 5).length;
  const outOfStockCount = products.filter((p) => p.stock <= 0).length;

  return (
    <div className="space-y-6">
      {/* Statistiques rapides */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Produits</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{totalProducts}</p>
          </div>
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <Package size={18} />
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">En Stock</p>
            <p className="text-xl font-bold text-emerald-600 mt-0.5">{inStockCount}</p>
          </div>
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle2 size={18} />
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Stock Bas (&le; 5)</p>
            <p className="text-xl font-bold text-amber-600 mt-0.5">{lowStockCount}</p>
          </div>
          <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
            <AlertTriangle size={18} />
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Ruptures</p>
            <p className="text-xl font-bold text-rose-600 mt-0.5">{outOfStockCount}</p>
          </div>
          <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
            <X size={18} />
          </div>
        </div>
      </div>

      {/* Barre d'action & Filtres */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Actions principales */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Link
            to="/admin/dashboard"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Retour</span>
          </Link>

          <Link
            to="/admin/add-product"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-xs"
          >
            <Plus size={15} />
            <span>Ajouter un produit</span>
          </Link>
        </div>

        {/* Barre de recherche & Sélecteur */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Rechercher produit, catégorie..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
            />
            {searchTerm && (
              <button
                onClick={() => handleSearchChange("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <select
            value={stockFilter}
            onChange={(e) => {
              setStockFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs bg-slate-50 border border-slate-200 text-slate-700 px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          >
            <option value="all">Tous les états</option>
            <option value="in_stock">En stock</option>
            <option value="low_stock">Stock bas</option>
            <option value="out_of_stock">Rupture</option>
            <option value="hidden">Masqués</option>
          </select>

          <button
            onClick={fetchProducts}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            title="Actualiser la liste"
          >
            <RefreshCw size={16} className={loading ? "animate-spin text-indigo-600" : ""} />
          </button>
        </div>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-xs flex justify-between items-center">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchProducts}
            className="px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 font-semibold rounded-lg text-[11px]"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* Tableau des Produits */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-4">Produit</th>
                <th className="py-3.5 px-4">Catégorie</th>
                <th className="py-3.5 px-4">Prix</th>
                <th className="py-3.5 px-4">Stock</th>
                <th className="py-3.5 px-4 text-center">Visibilité</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="animate-spin text-indigo-600" size={24} />
                      <span>Chargement du catalogue produit...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 space-y-2">
                    <p className="font-medium text-slate-500">
                      {searchTerm
                        ? `Aucun produit ne correspond à "${searchTerm}"`
                        : "Aucun produit disponible dans le catalogue."}
                    </p>
                    {searchTerm && (
                      <button
                        onClick={() => handleSearchChange("")}
                        className="text-xs font-semibold text-indigo-600 hover:underline"
                      >
                        Effacer la recherche
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((product) => {
                  const productName = product.title || product.name || "Sans nom";
                  const categoryName =
                    typeof product.category === "object"
                      ? product.category?.name
                      : product.category || "Sans catégorie";
                  const isActive = product.is_active ?? true;
                  const price = Number(product.price);
                  const promoPrice = product.promo_price ? Number(product.promo_price) : null;

                  return (
                    <tr key={product.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Image + Nom + ID */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={getProductImage(product)}
                            alt={productName}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200/80 shrink-0 bg-slate-50"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=100&q=80";
                            }}
                          />
                          <div>
                            <p className="font-bold text-slate-900">{productName}</p>
                            <p className="text-[11px] text-slate-400">ID: #{product.id}</p>
                          </div>
                        </div>
                      </td>

                      {/* Catégorie */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 text-[11px] px-2.5 py-0.5 rounded-full font-semibold">
                          <Tag size={10} />
                          {categoryName}
                        </span>
                      </td>

                      {/* Prix (avec promo) */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {promoPrice && promoPrice < price ? (
                          <div className="space-y-0.5">
                            <p className="font-bold text-emerald-600">
                              {promoPrice.toLocaleString()} FCFA
                            </p>
                            <p className="text-[10px] text-slate-400 line-through">
                              {price.toLocaleString()} FCFA
                            </p>
                          </div>
                        ) : (
                          <p className="font-bold text-slate-900">
                            {price.toLocaleString()} FCFA
                          </p>
                        )}
                      </td>

                      {/* Stock */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            product.stock > 5
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                              : product.stock > 0
                              ? "bg-amber-50 text-amber-700 border border-amber-200/60"
                              : "bg-rose-50 text-rose-700 border border-rose-200/60"
                          }`}
                        >
                          {product.stock > 0 ? `${product.stock} en stock` : "Rupture"}
                        </span>
                      </td>

                      {/* Statut / Toggle Visibilité */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(product.id, isActive)}
                            disabled={togglingId === product.id}
                            className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              isActive ? "bg-emerald-500" : "bg-slate-300"
                            } ${togglingId === product.id ? "opacity-50 cursor-wait" : ""}`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                isActive ? "translate-x-4" : "translate-x-0"
                              }`}
                            />
                          </button>

                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-bold ${
                              isActive ? "text-emerald-700" : "text-slate-400"
                            }`}
                          >
                            {isActive ? <Eye size={12} /> : <EyeOff size={12} />}
                            {isActive ? "Visible" : "Masqué"}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            to={`/admin/update-product/${product.id}`}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Modifier"
                          >
                            <Edit3 size={15} />
                          </Link>

                          <button
                            type="button"
                            onClick={() => handleDelete(product.id, productName)}
                            disabled={deletingId === product.id}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Supprimer"
                          >
                            {deletingId === product.id ? (
                              <RefreshCw size={15} className="animate-spin text-rose-600" />
                            ) : (
                              <Trash2 size={15} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {!loading && !error && filteredProducts.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2 text-xs text-slate-500">
          <div>
            Affichage de <span className="font-semibold text-slate-800">{startIndex + 1}</span> à{" "}
            <span className="font-semibold text-slate-800">{Math.min(endIndex, filteredProducts.length)}</span> sur{" "}
            <span className="font-semibold text-slate-800">{filteredProducts.length}</span> produit(s)
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>

            <span className="px-3 py-1 font-semibold text-slate-700 bg-slate-100 rounded-lg">
              {currentPage} / {totalPages || 1}
            </span>

            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductList;

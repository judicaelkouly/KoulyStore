import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

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

  // État pour la recherche
  const [searchTerm, setSearchTerm] = useState<string>("");

  //  GESTION DE LA PAGINATION (20 par page)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 20;

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
      alert("Produit supprimé !");
    } catch (err: any) {
      console.error("Erreur de suppression:", err);
      alert(err.message || "Erreur lors de la suppression.");
    } finally {
      setDeletingId(null);
    }
  };

  // Filtrage des produits
  const filteredProducts = products.filter((product) => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return true;

    const productName = (product.title || product.name || "").toLowerCase();
    const categoryName = (
      typeof product.category === "object"
        ? product.category?.name
        : product.category || ""
    ).toLowerCase();

    return productName.includes(query) || categoryName.includes(query);
  });

  // CALCUL DES PRODUITS POUR LA PAGE ACTIVE
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  // Remise à la première page lors de la recherche
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

  return (
    <div>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
          Liste des Produits
        </h1>

        {/* Action bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Link
              to="/admin/dashboard"
              className="focus:outline-none text-white  py-2.5 px-4 rounded-lg bg-gray-600 hover:bg-gray-400 transition"
            >
              Retour
            </Link>

            <Link to="/admin/add-product">
              <button className="bg-gray-600 text-white px-4 py-2.5 rounded-lg hover:bg-gray-400 transition duration-300 font-medium text-sm">
                + Ajouter un Produit
              </button>
            </Link>
          </div>

          <div className="relative w-full md:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-4 w-4 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Rechercher un produit..."
              className="w-full pl-9 pr-8 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => handleSearchChange("")}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-600 text-white uppercase sm:text-sm leading-normal">
                <th className="py-3 px-6 text-left">ID</th>
                <th className="py-3 px-6 text-left">Image</th>
                <th className="py-3 px-6 text-left">Nom du Produit</th>
                <th className="py-3 px-6 text-left">Catégorie</th>
                <th className="py-3 px-6 text-left">Prix</th>
                <th className="py-3 px-6 text-left">Stock</th>
                <th className="py-3 px-6 text-center">Statut (Admin)</th>
                <th className="py-3 px-6 text-center">Actions</th>
              </tr>
            </thead>

            <tbody className="text-black">
              {loading && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-500">
                    Chargement des produits en cours...
                  </td>
                </tr>
              )}

              {error && !loading && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-red-500">
                    {error}
                  </td>
                </tr>
              )}

              {!loading && !error && filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-500 space-y-2">
                    <p>
                      {searchTerm
                        ? `Aucun produit ne correspond à la recherche "${searchTerm}".`
                        : "Aucun produit trouvé dans la base de données."}
                    </p>
                    {searchTerm && (
                      <button
                        onClick={() => handleSearchChange("")}
                        className="text-xs font-semibold text-blue-500 hover:underline"
                      >
                        Effacer la recherche
                      </button>
                    )}
                  </td>
                </tr>
              )}

              {/* Rendu dynamique des 20 produits paginés */}
              {!loading &&
                !error &&
                paginatedProducts.map((product) => {
                  const productName = product.title || product.name || "Sans nom";
                  const categoryName =
                    typeof product.category === "object"
                      ? product.category?.name
                      : product.category || "N/A";
                  const isActive = product.is_active ?? true;

                  return (
                    <tr
                      key={product.id}
                      className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-3 px-6 text-left font-medium">
                        #{product.id}
                      </td>

                      <td className="py-3 px-6 text-left">
                        <img
                          src={getProductImage(product)}
                          alt={productName}
                          className="w-20 h-15 rounded-lg object-cover border border-gray-200"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=100&q=80";
                          }}
                        />
                      </td>

                      <td className="py-3 px-6 text-left font-semibold text-gray-800">
                        {productName}
                      </td>

                      <td className="py-3 px-6 text-left">
                        <span className="bg-blue-50 text-blue-600 text-xs px-2.5 py-1 rounded-full font-semibold">
                          {categoryName}
                        </span>
                      </td>

                      <td className="py-3 px-6 text-left font-bold text-gray-700">
                        {Number(product.price).toLocaleString()} FCFA
                      </td>

                      <td className="py-3 px-6 text-left">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-bold ${
                            product.stock > 0
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {product.stock} en stock
                        </span>
                      </td>

                      <td className="py-3 px-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(product.id, isActive)}
                            disabled={togglingId === product.id}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              isActive ? "bg-emerald-500" : "bg-gray-300"
                            } ${togglingId === product.id ? "opacity-50 cursor-wait" : ""}`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                isActive ? "translate-x-5" : "translate-x-0"
                              }`}
                            />
                          </button>
                          
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            isActive 
                              ? "bg-emerald-100 text-emerald-700" 
                              : "bg-gray-100 text-gray-500"
                          }`}>
                            {isActive ? "Visible" : "Masqué"}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            to={`/admin/update-product/${product.id}`}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-blue-50 text-blue-500 hover:scale-110 transition-all"
                            title="Modifier"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              width={18}
                              height={18}
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                              />
                            </svg>
                          </Link>

                          <button
                            type="button"
                            onClick={() => handleDelete(product.id, productName)}
                            disabled={deletingId === product.id}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-red-500 hover:scale-110 transition-all disabled:opacity-50"
                            title="Supprimer"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width={18}
                              height={18}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/*  CONTROLES DE PAGINATION */}
        {!loading && !error && filteredProducts.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
            <div>
              <span className="text-sm text-white">
                Affichage de {filteredProducts.length > 0 ? startIndex + 1 : 0} à{" "}
                {Math.min(endIndex, filteredProducts.length)} sur {filteredProducts.length} produit(s)
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-md bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm transition"
              >
                Précédent
              </button>

              <span className="text-sm text-white font-medium px-2">
                Page {currentPage} sur {totalPages || 1}
              </span>

              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage >= totalPages}
                className="px-3 py-1.5 rounded-md bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm transition"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductList;

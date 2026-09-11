import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Plus,
  Trash2,
  Edit3,
  FolderTree,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  ArrowLeft,
  ImageOff
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
const STORAGE_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "");

interface Category {
  id: number;
  name: string;
  image?: string;
  image_url?: string;
}

function CategoryList() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Recherche
  const [searchTerm, setSearchTerm] = useState<string>("");

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

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/categories`, {
        headers: getAuthHeaders(),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Impossible de charger les catégories.");
      }

      const categoryList = Array.isArray(data) ? data : data.categories || data.data || [];
      setCategories(categoryList);
    } catch (err: any) {
      console.error("Erreur de chargement :", err);
      setError("Erreur lors de la récupération des catégories.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleDelete = async (id: number, categoryName: string) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer la catégorie "${categoryName}" ?`)) {
      return;
    }

    setDeletingId(id);

    try {
      const response = await fetch(`${API_BASE_URL}/admin/categories/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.message || "Erreur lors de la suppression.");
        return;
      }

      setCategories((prev) => prev.filter((cat) => cat.id !== id));
    } catch (err) {
      console.error("Erreur lors de la suppression :", err);
      alert("Impossible de joindre le serveur pour supprimer.");
    } finally {
      setDeletingId(null);
    }
  };

  // Filtrage
  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchTerm.trim().toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCategories = filteredCategories.slice(startIndex, endIndex);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const getImageUrl = (category: Category) => {
    if (category.image_url) return category.image_url;

    if (category.image) {
      if (
        category.image.startsWith("http://") ||
        category.image.startsWith("https://") ||
        category.image.startsWith("data:")
      ) {
        return category.image;
      }

      const cleanPath = category.image.replace(/^\//, "");
      if (cleanPath.startsWith("storage/")) {
        return `${STORAGE_BASE_URL}/${cleanPath}`;
      }

      return `${STORAGE_BASE_URL}/storage/${cleanPath}`;
    }

    return null;
  };

  return (
    <div className="space-y-6">
      {/* En-tête / Statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Total Catégories
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{categories.length}</p>
          </div>
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <FolderTree size={20} />
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Résultats de recherche
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{filteredCategories.length}</p>
          </div>
          <div className="p-2.5 bg-slate-200/60 text-slate-600 rounded-xl">
            <Search size={20} />
          </div>
        </div>
      </div>

      {/* Barre d'action & Recherche */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Navigation & Création */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Link
            to="/admin/dashboard"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Retour</span>
          </Link>

          <Link
            to="/admin/add-category"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-xs"
          >
            <Plus size={15} />
            <span>Ajouter une catégorie</span>
          </Link>
        </div>

        {/* Champ de recherche & rafraîchissement */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Rechercher une catégorie..."
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

          <button
            onClick={fetchCategories}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            title="Actualiser"
          >
            <RefreshCw size={16} className={loading ? "animate-spin text-indigo-600" : ""} />
          </button>
        </div>
      </div>

      {/* Alerte d'erreur */}
      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-xs flex justify-between items-center">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchCategories}
            className="px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 font-semibold rounded-lg text-[11px]"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* Tableau des Catégories */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-4 w-20">ID</th>
                <th className="py-3.5 px-4">Visuel</th>
                <th className="py-3.5 px-4">Nom de la catégorie</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400 font-medium">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="animate-spin text-indigo-600" size={24} />
                      <span>Chargement des catégories...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400 space-y-2">
                    <p className="font-medium text-slate-500">
                      {searchTerm
                        ? `Aucune catégorie ne correspond à "${searchTerm}"`
                        : "Aucune catégorie trouvée."}
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
                paginatedCategories.map((category) => {
                  const imgUrl = getImageUrl(category);

                  return (
                    <tr key={category.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* ID */}
                      <td className="py-3 px-4 font-semibold text-slate-400">
                        #{category.id}
                      </td>

                      {/* Aperçu Image */}
                      <td className="py-3 px-4">
                        {imgUrl ? (
                          <img
                            src={imgUrl}
                            alt={category.name}
                            className="w-12 h-12 rounded-xl object-cover border border-slate-200/80 bg-slate-50"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                              (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
                            }}
                          />
                        ) : null}
                        <div
                          className={`w-12 h-12 rounded-xl border border-slate-200 bg-slate-100 text-slate-400 flex items-center justify-center ${
                            imgUrl ? "hidden" : ""
                          }`}
                        >
                          <ImageOff size={18} />
                        </div>
                      </td>

                      {/* Nom */}
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 text-sm">
                          {category.name}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            to={`/admin/update-category/${category.id}`}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Modifier"
                          >
                            <Edit3 size={16} />
                          </Link>

                          <button
                            type="button"
                            onClick={() => handleDelete(category.id, category.name)}
                            disabled={deletingId === category.id}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Supprimer"
                          >
                            {deletingId === category.id ? (
                              <RefreshCw size={16} className="animate-spin text-rose-600" />
                            ) : (
                              <Trash2 size={16} />
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
      {!loading && !error && filteredCategories.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2 text-xs text-slate-500">
          <div>
            Affichage de <span className="font-semibold text-slate-800">{startIndex + 1}</span> à{" "}
            <span className="font-semibold text-slate-800">{Math.min(endIndex, filteredCategories.length)}</span> sur{" "}
            <span className="font-semibold text-slate-800">{filteredCategories.length}</span> catégorie(s)
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

export default CategoryList;

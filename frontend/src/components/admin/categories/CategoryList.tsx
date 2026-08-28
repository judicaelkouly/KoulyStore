import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

// Configuration dynamique des URL d'API et de stockage
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
const STORAGE_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "");

// Interface TypeScript pour typer une catégorie
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

  // État pour la barre de recherche
  const [searchTerm, setSearchTerm] = useState<string>("");

  // 📄 GESTION DE LA PAGINATION (20 par page)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 20;

  // Helper pour récupérer le token XSRF des cookies (Laravel Sanctum)
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

  // 1. Récupération des catégories depuis le Backend
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

  // 2. Gestion de la suppression d'une catégorie
  const handleDelete = async (id: number) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette catégorie ?")) {
      return;
    }

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
    }
  };

  // Filtrage dynamique des catégories par nom
  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchTerm.trim().toLowerCase())
  );

  // 📄 CALCUL DES CATÉGORIES POUR LA PAGE ACTIVE
  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCategories = filteredCategories.slice(startIndex, endIndex);

  // Remise à la première page lors de la saisie d'une recherche
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  // Helper dynamique pour construire l'URL de l'image
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

    return "/src/assets/myy.jpeg";
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
        Liste des Catégories
      </h1>

      {/* Header Actions & Recherche */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Link
            to="/admin/dashboard"
            className="focus:outline-black text-white text-sm py-2.5 px-4 rounded-lg bg-blue-500 hover:bg-blue-600 transition duration-300"
          >
            Retour
          </Link>
          
          <Link to="/admin/add-category">
            <button className="bg-blue-500 text-white px-4 py-2.5 text-sm rounded-lg hover:bg-blue-600 transition duration-300">
              Ajouter une catégorie
            </button>
          </Link>
        </div>

        {/* Champ de Recherche */}
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
            placeholder="Rechercher une catégorie..."
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

      {error && (
        <div className="mb-4 p-4 bg-red-500 text-white rounded-lg text-center font-medium">
          {error}
        </div>
      )}

      {/* Tableau d'affichage */}
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-blue-500 text-white uppercase text-sm leading-normal">
              <th className="py-3 px-6 text-left">ID</th>
              <th className="py-3 px-6 text-left">Image</th>
              <th className="py-3 px-6 text-left">Nom de la catégorie</th>
              <th className="py-3 px-6 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="text-gray-600 text-sm">
            {loading ? (
              <tr>
                <td colSpan={4} className="py-6 text-center text-gray-500">
                  Chargement des catégories...
                </td>
              </tr>
            ) : filteredCategories.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-gray-500 space-y-2">
                  <p>
                    {searchTerm
                      ? `Aucune catégorie ne correspond à la recherche "${searchTerm}".`
                      : "Aucune catégorie trouvée dans la base de données."}
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
            ) : (
              /* Rendu dynamique des 20 catégories paginées */
              paginatedCategories.map((category) => (
                <tr
                  key={category.id}
                  className="border-b border-gray-200 hover:bg-gray-100 transition-colors"
                >
                  <td className="py-3 px-6 text-left font-medium">{category.id}</td>
                  <td className="py-3 px-6 text-left">
                    <img
                      src={getImageUrl(category)}
                      alt={category.name}
                      className="w-10 h-10 rounded-lg object-cover border border-gray-200"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/src/assets/myy.jpeg";
                      }}
                    />
                  </td>
                  <td className="py-3 px-6 text-left font-semibold text-gray-800">
                    {category.name}
                  </td>
                  <td className="py-3 px-6 text-center">
                    <div className="flex justify-center items-center space-x-3">
                      <Link
                        to={`/admin/update-category/${category.id}`}
                        className="transform hover:text-blue-500 hover:scale-110 transition-transform"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          width={20}
                          height={20}
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
                        onClick={() => handleDelete(category.id)}
                        className="transform hover:text-red-500 hover:scale-110 transition-transform"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width={20}
                          height={20}
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
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 📄 CONTRÔLES DE PAGINATION */}
      {!loading && !error && filteredCategories.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
          <div>
            <span className="text-sm text-gray-600">
              Affichage de {filteredCategories.length > 0 ? startIndex + 1 : 0} à{" "}
              {Math.min(endIndex, filteredCategories.length)} sur {filteredCategories.length} catégorie(s)
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-md bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm transition"
            >
              Précédent
            </button>

            <span className="text-sm text-gray-700 font-medium px-2">
              Page {currentPage} sur {totalPages || 1}
            </span>

            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage >= totalPages}
              className="px-3 py-1.5 rounded-md bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm transition"
            >
              Suivant
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CategoryList;

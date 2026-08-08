import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

// Interface TypeScript pour typer une catégorie
interface Category {
  id: number;
  name: string;
  image?: string;
  image_url?: string; // Si ton API renvoie déjà l'URL complète
}

function CategoryList() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 1. Récupération des catégories depuis le Backend
  const fetchCategories = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("http://localhost:8000/api/categories", {
        headers: {
          Accept: "application/json",
        },
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Impossible de charger les catégories.");
      }

      // Laravel renvoie soit directement le tableau, soit un objet { status: true, categories: [...] } ou { data: [...] }
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
      const response = await fetch(`http://localhost:8000/api/admin/categories/${id}`, {
        method: "DELETE",
        headers: {
          Accept: "application/json",
        },
        credentials: "include", // 🔑 Pour authentification Admin via Cookie
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.message || "Erreur lors de la suppression.");
        return;
      }

      // Mise à jour de la liste locale en filtrant la catégorie supprimée
      setCategories(categories.filter((cat) => cat.id !== id));
    } catch (err) {
      console.error("Erreur lors de la suppression :", err);
      alert("Impossible de joindre le serveur pour supprimer.");
    }
  };

  // Helper pour afficher correctement l'image depuis Laravel Storage
  const getImageUrl = (category: Category) => {
    if (category.image_url) return category.image_url;
    if (category.image) {
      // Si l'image est un chemin relatif stocké dans 'storage/...'
      return category.image.startsWith("http")
        ? category.image
        : `http://localhost:8000/storage/${category.image}`;
    }
    return "/src/assets/myy.jpeg"; // Image par défaut de fallback
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8 text-white">Listes des Catégories</h1>

      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <div className="w-full md:w-1/3 mb-4 md:mb-0">
          <Link
            to="/admin/dashboard"
            className="focus:outline-black text-white text-sm py-2.5 px-4 rounded-lg bg-blue-500 hover:bg-blue-400"
          >
            Retour
          </Link>
        </div>
        <Link to="/admin/add-category">
          <button className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition duration-300">
            Ajouter une catégorie
          </button>
        </Link>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="mb-4 p-4 bg-red-500 text-white rounded-lg text-center font-medium">
          {error}
        </div>
      )}

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
            {/* 1. État de Chargement */}
            {loading ? (
              <tr>
                <td colSpan={4} className="py-6 text-center text-gray-500">
                  Chargement des catégories...
                </td>
              </tr>
            ) : categories.length === 0 ? (
              /* 2. Aucune catégorie en BDD */
              <tr>
                <td colSpan={4} className="py-6 text-center text-gray-500">
                  Aucune catégorie trouvée dans la base de données.
                </td>
              </tr>
            ) : (
              /* 3. Affichage de la liste dynamique */
              categories.map((category) => (
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
                        // Image par défaut si le lien d'image échoue
                        (e.target as HTMLImageElement).src = "/src/assets/myy.jpeg";
                      }}
                    />
                  </td>
                  <td className="py-3 px-6 text-left font-semibold text-gray-800">
                    {category.name}
                  </td>
                  <td className="py-3 px-6 text-center">
                    <div className="flex justify-center items-center space-x-3">
                      {/* Bouton Éditer */}
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

                      {/* Bouton Supprimer */}
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
    </div>
  );
}

export default CategoryList;

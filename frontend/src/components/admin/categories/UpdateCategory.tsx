import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";

// Configuration dynamique des URL d'API et de stockage
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
const STORAGE_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "");

interface ValidationError {
  [key: string]: string[];
}

function UpdateCategory() {
  const { id } = useParams<{ id: string }>(); // Récupère l'ID passé dans l'URL (ex: /admin/edit-category/3)
  const navigate = useNavigate();

  // ÉTATS DU FORMULAIRE
  const [categoryName, setCategoryName] = useState("");
  const [hasSizes, setHasSizes] = useState(false);
  const [sizeType, setSizeType] = useState<"vêtements" | "chaussures" | "custom">("vêtements");
  const [customSizes, setCustomSizes] = useState("");

  // ÉTATS DE L'IMAGE
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // ÉTATS DE CHARGEMENT ET GESTION ERREURS
  const [loadingCategory, setLoadingCategory] = useState(true); // Chargement des données au montage
  const [loading, setLoading] = useState(false); // Chargement lors du submit
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<ValidationError>({});

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

  // Helper pour formater l'URL de l'image
  const formatImageUrl = (pathCandidate?: string | null): string | null => {
    if (!pathCandidate) return null;
    if (
      pathCandidate.startsWith("http://") ||
      pathCandidate.startsWith("https://") ||
      pathCandidate.startsWith("blob:") ||
      pathCandidate.startsWith("data:")
    ) {
      return pathCandidate;
    }
    const cleanPath = pathCandidate.replace(/^\//, "");
    if (cleanPath.startsWith("storage/")) {
      return `${STORAGE_BASE_URL}/${cleanPath}`;
    }
    return `${STORAGE_BASE_URL}/storage/${cleanPath}`;
  };

  // 1. CHERCHER LA CATÉGORIE EN BDD AU CHARGEMENT
  useEffect(() => {
    const fetchCategory = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
          headers: getAuthHeaders(),
          credentials: "include",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Impossible de récupérer la catégorie.");
        }

        const category = data.category || data.data || data;

        // Injection des valeurs reçues dans les states
        setCategoryName(category.name || "");
        setHasSizes(Boolean(category.has_sizes));

        // Formatage de l'image d'illustration existante
        if (category.image || category.image_url) {
          const rawImage = category.image_url || category.image;
          setImagePreview(formatImageUrl(rawImage));
        }

        // Détection et injection des tailles
        if (category.sizes && Array.isArray(category.sizes) && category.sizes.length > 0) {
          const sizes: string[] = category.sizes;
          const isClothing = JSON.stringify(sizes) === JSON.stringify(["XS", "S", "M", "L", "XL", "XXL"]);
          const isShoes = JSON.stringify(sizes) === JSON.stringify(["37", "38", "39", "40", "41", "42", "43", "44"]);

          if (isClothing) {
            setSizeType("vêtements");
          } else if (isShoes) {
            setSizeType("chaussures");
          } else {
            setSizeType("custom");
            setCustomSizes(sizes.join(", "));
          }
        }
      } catch (err: any) {
        console.error("Erreur de récupération :", err);
        setErrorMessage("Erreur lors du chargement des données de la catégorie.");
      } finally {
        setLoadingCategory(false);
      }
    };

    if (id) {
      fetchCategory();
    }
  }, [id]);

  // GESTION DU CHANGEMENT D'IMAGE
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file)); // Prévisualisation locale de la nouvelle image
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  // 2. SOUMISSION DU FORMULAIRE (MODIFICATION)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setFieldErrors({});

    // Calcul des tailles selon l'option choisie
    const computedSizes = hasSizes
      ? sizeType === "vêtements"
        ? ["XS", "S", "M", "L", "XL", "XXL"]
        : sizeType === "chaussures"
        ? ["37", "38", "39", "40", "41", "42", "43", "44"]
        : customSizes.split(",").map((s) => s.trim()).filter((s) => s !== "")
      : [];

    // Création du FormData
    const formData = new FormData();
    // 🔑 Method Spoofing Laravel pour autoriser l'envoi de fichiers multipart/form-data via PUT
    formData.append("_method", "PUT");
    formData.append("name", categoryName);
    formData.append("has_sizes", hasSizes ? "1" : "0");

    // Ajout du tableau de tailles
    computedSizes.forEach((size) => {
      formData.append("sizes[]", size);
    });

    // On n'ajoute l'image que si l'utilisateur en a sélectionné une NOUVELLE
    if (imageFile) {
      formData.append("image", imageFile);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/admin/categories/${id}`, {
        method: "POST", // Method Spoofing Laravel : POST avec _method = PUT
        headers: getAuthHeaders(),
        credentials: "include",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 422 && data.errors) {
          setFieldErrors(data.errors);
          setErrorMessage("Veuillez vérifier les champs du formulaire.");
        } else {
          setErrorMessage(data.message || "Erreur lors de la mise à jour de la catégorie.");
        }
        return;
      }

      setSuccessMessage("La catégorie a été modifiée avec succès !");

      // Redirection automatique vers le tableau de bord après 1.5s
      setTimeout(() => {
        navigate("/admin/dashboard");
      }, 1500);

    } catch (error) {
      console.error("Erreur réseau :", error);
      setErrorMessage("Impossible de joindre le serveur backend.");
    } finally {
      setLoading(false);
    }
  };

  if (loadingCategory) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-white text-lg">Chargement de la catégorie...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-xl border border-gray-200 max-w-md shadow-sm mx-auto mt-10">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-800">
          Modifier la catégorie
        </h3>
        <Link to="/admin/dashboard" className="text-xs text-indigo-600 hover:underline">
          &larr; Annuler
        </Link>
      </div>

      {/* Message d'erreur global */}
      {errorMessage && (
        <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs rounded-r">
          {errorMessage}
        </div>
      )}

      {/* Message de succès */}
      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 border-l-4 border-green-500 text-green-700 text-xs rounded-r">
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nom de la catégorie */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nom de la catégorie
          </label>
          <input
            type="text"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            placeholder="Ex: Chaussures de sport, Montres..."
            className={`w-full text-sm py-2 px-3 border rounded-lg outline-none focus:ring-2 ${
              fieldErrors.name ? "border-red-500 focus:ring-red-200" : "border-gray-300 focus:ring-indigo-500"
            }`}
            required
          />
          {fieldErrors.name && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.name[0]}</p>
          )}
        </div>

        {/* Champ pour l'Image de la catégorie */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Image d'illustration
          </label>

          {imagePreview ? (
            /* Zone de prévisualisation si une image existe ou est sélectionnée */
            <div className="relative w-full h-40 rounded-lg overflow-hidden border border-gray-200 group">
              <img
                src={imagePreview}
                alt="Aperçu catégorie"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                <label className="cursor-pointer bg-white text-gray-800 text-xs font-semibold py-1.5 px-3 rounded-lg shadow hover:bg-gray-100 transition-colors">
                  Changer
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="bg-red-600 text-white text-xs font-semibold py-1.5 px-3 rounded-lg shadow hover:bg-red-700 transition-colors"
                >
                  Supprimer
                </button>
              </div>
            </div>
          ) : (
            /* Zone de dépôt / sélection si aucune image */
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-indigo-50/50 hover:border-indigo-300 transition-all">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg
                  className="w-8 h-8 mb-2 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  ></path>
                </svg>
                <p className="text-xs text-gray-500 font-medium">
                  <span className="text-indigo-600 font-bold">Cliquez pour importer</span> ou glissez une image
                </p>
                <p className="text-[10px] text-gray-400 mt-1">PNG, JPG, WEBP (Max 5Mo)</p>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          )}
          {fieldErrors.image && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.image[0]}</p>
          )}
        </div>

        {/* Option d'activation des tailles */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div>
            <p className="text-sm font-semibold text-gray-800">
              Gérer des tailles ?
            </p>
            <p className="text-xs text-gray-500">
              Active la sélection de taille pour cette catégorie.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={hasSizes}
              onChange={(e) => setHasSizes(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        {/* Configuration des tailles (S'affiche uniquement si `hasSizes` est coché) */}
        {hasSizes && (
          <div className="p-4 bg-indigo-50/60 rounded-lg border border-indigo-100 space-y-3">
            <label className="block text-xs font-bold text-indigo-900 uppercase tracking-wider">
              Type de tailles
            </label>

            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="radio"
                  name="sizeType"
                  value="vêtements"
                  checked={sizeType === "vêtements"}
                  onChange={() => setSizeType("vêtements")}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <span>Vêtements (XS, S, M, L, XL, XXL)</span>
              </label>

              <label className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="radio"
                  name="sizeType"
                  value="chaussures"
                  checked={sizeType === "chaussures"}
                  onChange={() => setSizeType("chaussures")}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <span>Pointures chaussures (37 à 44)</span>
              </label>

              <label className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="radio"
                  name="sizeType"
                  value="custom"
                  checked={sizeType === "custom"}
                  onChange={() => setSizeType("custom")}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <span>Tailles personnalisées</span>
              </label>
            </div>

            {/* Saisie personnalisée si nécessaire */}
            {sizeType === "custom" && (
              <div className="mt-2">
                <input
                  type="text"
                  value={customSizes}
                  onChange={(e) => setCustomSizes(e.target.value)}
                  placeholder="Ex: 38mm, 40mm, 42mm"
                  className="w-full text-xs py-2 px-3 border border-gray-300 rounded-md outline-none bg-white"
                  required
                />
              </div>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg transition-colors shadow-sm active:scale-98 disabled:opacity-50 flex justify-center items-center"
        >
          {loading ? "Mise à jour en cours..." : "Mettre à jour la catégorie"}
        </button>
      </form>
    </div>
  );
}

export default UpdateCategory;

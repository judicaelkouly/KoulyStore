import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

// Configuration dynamique de l'URL d'API
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

// Interfaces TypeScript
interface ApiCategory {
  id: number | string;
  name: string;
  hasSizes?: boolean;
  availableSizes?: string[];
}

interface ProductFormData {
  title: string;
  description: string;
  category_id: string;
  price: string;
  promo_price: string;
  stock: string;
}

function AddProduct() {
  // Config par défaut/fallback pour les tailles si l'API ne fournit pas les clés
  const defaultSizesMap: Record<string, string[]> = {
    Vêtements: ["S", "M", "L", "XL", "XXL"],
    Chaussures: ["38", "39", "40", "41", "42", "43", "44"],
    Mode_Hommes_Chaussures: ["38", "39", "40", "41", "42", "43", "44"],
    Mode_Hommes_Vêtements: ["S", "M", "L", "XL", "XXL", "3XL", "4XL"],
    Mode_Enfants_Chaussures: ["25", "26", "27", "28", "29", "30", "31", "32", "33", "34", "35", "36", "37"],
    Mode_Enfants_Vêtements: ["XXS", "XS", "L", "S"],
    Mode_Femmes_Chaussures: ["38", "39", "40", "41", "42", "43", "44"],
    Mode_Femmes_Vêtements: ["S", "M", "L", "XL", "XXL", "3XL", "4XL"],
  };

  // États pour l'API et les catégories
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState<boolean>(true);

  // États du formulaire
  const [formData, setFormData] = useState<ProductFormData>({
    title: "",
    description: "",
    category_id: "",
    price: "",
    promo_price: "",
    stock: "",
  });

  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<(File | null)[]>([null, null, null, null, null]);
  const [imagePreviews, setImagePreviews] = useState<(string | null)[]>([null, null, null, null, null]);

  // États de soumission, erreurs et notifications
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

  // 📥 Récupération des catégories depuis l'API Backend
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/categories`, {
          headers: getAuthHeaders(),
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          const list = Array.isArray(data) ? data : data.categories || data.data || [];
          setCategories(list);
        } else {
          console.error("Impossible de charger les catégories");
        }
      } catch (err) {
        console.error("Erreur de connexion lors du chargement des catégories", err);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  // Trouver la catégorie sélectionnée
  const currentCategoryObj = categories.find(
    (cat) => String(cat.id) === String(formData.category_id)
  );

  // Déterminer si la catégorie choisie gère les tailles
  const availableSizes =
    currentCategoryObj?.availableSizes ||
    (currentCategoryObj ? defaultSizesMap[currentCategoryObj.name] : null);

  // Gestion des inputs texte / select
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { id, value } = e.target;

    // Réinitialise les tailles si la catégorie change
    if (id === "category_id") {
      setSelectedSizes([]);
    }

    setFormData((prev) => ({ ...prev, [id]: value }));
    // Efface les messages d'erreur à la saisie
    if (validationErrors[id]) {
      setValidationErrors((prev) => ({ ...prev, [id]: [] }));
    }
  };

  // Gestion des images
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (file) {
      const newFiles = [...imageFiles];
      newFiles[index] = file;
      setImageFiles(newFiles);

      const newPreviews = [...imagePreviews];
      if (newPreviews[index]) {
        URL.revokeObjectURL(newPreviews[index]!);
      }
      newPreviews[index] = URL.createObjectURL(file);
      setImagePreviews(newPreviews);
    }
  };

  const handleRemoveImage = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();

    const newFiles = [...imageFiles];
    newFiles[index] = null;
    setImageFiles(newFiles);

    const newPreviews = [...imagePreviews];
    if (newPreviews[index]) {
      URL.revokeObjectURL(newPreviews[index]!);
    }
    newPreviews[index] = null;
    setImagePreviews(newPreviews);
  };

  const toggleSize = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  // 🚀 SOUMISSION DU FORMULAIRE VERS L'API
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setValidationErrors({});

    try {
      // Construction du FormData pour l'envoi multipart (fichiers + champs)
      const data = new FormData();
      data.append("title", formData.title);
      data.append("description", formData.description);
      data.append("category_id", formData.category_id);
      data.append("price", formData.price);
      if (formData.promo_price) {
        data.append("promo_price", formData.promo_price);
      }
      data.append("stock", formData.stock);

      // Ajout des tailles
      selectedSizes.forEach((size) => {
        data.append("sizes[]", size);
      });

      // Ajout des fichiers images
      imageFiles.forEach((file) => {
        if (file) {
          data.append("images[]", file);
        }
      });

      const response = await fetch(`${API_BASE_URL}/admin/products`, {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
        body: data,
      });

      const result = await response.json();

      if (response.ok) {
        setSuccessMessage("Produit créé avec succès !");

        // Réinitialisation du formulaire
        setFormData({
          title: "",
          description: "",
          category_id: "",
          price: "",
          promo_price: "",
          stock: "",
        });
        setSelectedSizes([]);
        setImageFiles([null, null, null, null, null]);
        setImagePreviews([null, null, null, null, null]);
      } else if (response.status === 422) {
        // Erreurs de validation Backend (ex: Laravel Validation)
        setValidationErrors(result.errors || {});
        setErrorMessage("Veuillez corriger les erreurs indiquées ci-dessous.");
      } else {
        setErrorMessage(result.message || "Une erreur est survenue lors de la création.");
      }
    } catch (error) {
      console.error("Erreur lors de la requête :", error);
      setErrorMessage("Impossible de joindre le serveur. Vérifiez votre connexion.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-8 px-4 md:px-8 bg-white min-h-screen flex flex-col items-center">
      <form
        onSubmit={handleSubmit}
        className="space-y-6 max-w-6xl max-h-6xl w-full bg-white p-6 rounded-xl border border-gray-200 shadow-sm"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg text-center font-bold text-gray-800">
            Ajouter un nouveau produit
          </h2>
          <Link to="/admin/dashboard" className="text-xs text-indigo-600 hover:underline">
            &larr; Retour
          </Link>
        </div>

        {/* Message de Succès */}
        {successMessage && (
          <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg">
            {successMessage}
          </div>
        )}

        {/* Message d'Erreur Global */}
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
            {errorMessage}
          </div>
        )}

        {/* Section Upload Images */}
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">Images du produit (Max 5)</p>
          <div className="flex flex-wrap items-center gap-3">
            {imagePreviews.map((imgUrl, index) => (
              <div key={index} className="relative">
                <label
                  htmlFor={`image-${index}`}
                  className="relative flex items-center justify-center w-45 h-45 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-500 transition-colors overflow-hidden bg-gray-50 group"
                >
                  <input
                    accept="image/*"
                    type="file"
                    id={`image-${index}`}
                    hidden
                    onChange={(e) => handleImageChange(e, index)}
                  />
                  {imgUrl ? (
                    <img
                      src={imgUrl}
                      alt={`Aperçu ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center text-gray-400">
                      <span className="block text-lg font-bold">+</span>
                      <span className="block text-[10px] font-medium">Ajouter</span>
                    </div>
                  )}
                </label>

                {imgUrl && (
                  <button
                    type="button"
                    onClick={(e) => handleRemoveImage(e, index)}
                    className="absolute -top-1.5 -right-1.5 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] shadow-md hover:bg-red-700 transition-colors"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
          {validationErrors.images && (
            <p className="text-xs text-red-500 mt-1">{validationErrors.images[0]}</p>
          )}
        </div>

        {/* Nom du Produit */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-gray-700" htmlFor="title">
            Nom du produit
          </label>
          <input
            id="title"
            type="text"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="Ex: T-Shirt en coton Bio"
            className={`w-full text-sm outline-none py-2.5 px-3 rounded-lg border ${
              validationErrors.title || validationErrors.name ? "border-red-500" : "border-gray-300"
            } focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all`}
            required
          />
          {(validationErrors.title || validationErrors.name) && (
            <p className="text-xs text-red-500 mt-1">
              {(validationErrors.title || validationErrors.name)[0]}
            </p>
          )}
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-gray-700" htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            rows={4}
            value={formData.description}
            onChange={handleInputChange}
            className={`w-full text-sm outline-none py-2.5 px-3 rounded-lg border ${
              validationErrors.description ? "border-red-500" : "border-gray-300"
            } focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none`}
            placeholder="Écrivez une description détaillée du produit..."
          />
          {validationErrors.description && (
            <p className="text-xs text-red-500 mt-1">{validationErrors.description[0]}</p>
          )}
        </div>

        {/* Sélection Catégorie */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-gray-700" htmlFor="category_id">
            Catégorie
          </label>
          <select
            id="category_id"
            value={formData.category_id}
            onChange={handleInputChange}
            className={`w-full text-sm outline-none py-2.5 px-3 rounded-lg border ${
              validationErrors.category_id ? "border-red-500" : "border-gray-300"
            } focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white transition-all`}
            required
            disabled={loadingCategories}
          >
            <option value="">
              {loadingCategories ? "Chargement des catégories..." : "Sélectionner une catégorie"}
            </option>
            {categories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          {validationErrors.category_id && (
            <p className="text-xs text-red-500 mt-1">{validationErrors.category_id[0]}</p>
          )}
        </div>

        {/* TAILLES CONDITIONNELLES */}
        {availableSizes && availableSizes.length > 0 && (
          <div className="flex flex-col gap-2 p-4 bg-indigo-50/50 rounded-lg border border-indigo-100">
            <label className="text-sm font-semibold text-gray-800">Tailles disponibles</label>
            <div className="flex flex-wrap gap-2">
              {availableSizes.map((size) => {
                const isSelected = selectedSizes.includes(size);
                return (
                  <button
                    type="button"
                    key={size}
                    onClick={() => toggleSize(size)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-all ${
                      isSelected
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                        : "bg-white text-gray-700 border-gray-300 hover:border-indigo-400"
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Prix et Quantité en Stock */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-700" htmlFor="price">
              Prix (FCFA)
            </label>
            <input
              id="price"
              type="number"
              min="0"
              value={formData.price}
              onChange={handleInputChange}
              placeholder="0"
              className={`text-sm outline-none py-2.5 px-3 rounded-lg border ${
                validationErrors.price ? "border-red-500" : "border-gray-300"
              } focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500`}
              required
            />
            {validationErrors.price && (
              <p className="text-xs text-red-500 mt-1">{validationErrors.price[0]}</p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-700" htmlFor="promo_price">
              Prix Promotionnel
            </label>
            <input
              id="promo_price"
              type="number"
              min="0"
              value={formData.promo_price}
              onChange={handleInputChange}
              placeholder="0"
              className={`text-sm outline-none py-2.5 px-3 rounded-lg border ${
                validationErrors.promo_price ? "border-red-500" : "border-gray-300"
              } focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500`}
            />
            {validationErrors.promo_price && (
              <p className="text-xs text-red-500 mt-1">{validationErrors.promo_price[0]}</p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-700" htmlFor="stock">
              Stock disponible
            </label>
            <input
              id="stock"
              type="number"
              min="0"
              value={formData.stock}
              onChange={handleInputChange}
              placeholder="Ex: 50"
              className={`text-sm outline-none py-2.5 px-3 rounded-lg border ${
                validationErrors.stock ? "border-red-500" : "border-gray-300"
              } focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500`}
              required
            />
            {validationErrors.stock && (
              <p className="text-xs text-red-500 mt-1">{validationErrors.stock[0]}</p>
            )}
          </div>
        </div>

        {/* Bouton de Soumission */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full sm:w-auto px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg shadow transition-colors active:scale-98 ${
            isSubmitting ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {isSubmitting ? "Création en cours..." : "Ajouter le produit"}
        </button>
      </form>
    </div>
  );
}

export default AddProduct;

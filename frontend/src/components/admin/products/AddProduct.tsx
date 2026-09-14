import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

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
  const defaultSizesMap: Record<string, string[]> = {
    Vêtements: ["S", "M", "L", "XL", "XXL"],
    Chaussures: ["38", "39", "40", "41", "42", "43", "44"],
    Mode_Hommes_Chaussures: ["38", "39", "40", "41", "42", "43", "44"],
    Mode_Hommes_Vêtements: ["S", "M", "L", "XL", "XXL", "3XL", "4XL"],
    Mode_Enfants_Chaussures: ["25", "26", "27", "28", "29", "30", "31", "32", "33", "34", "35", "36", "37"],
    Mode_Enfants_Vêtements: ["XXS", "XS", "S", "M", "L"],
    Mode_Femmes_Chaussures: ["36", "37", "38", "39", "40", "41", "42"],
    Mode_Femmes_Vêtements: ["XS", "S", "M", "L", "XL", "XXL"],
  };

  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState<boolean>(true);

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

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

  const currentCategoryObj = categories.find(
    (cat) => String(cat.id) === String(formData.category_id)
  );

  const availableSizes =
    currentCategoryObj?.availableSizes ||
    (currentCategoryObj ? defaultSizesMap[currentCategoryObj.name] : null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { id, value } = e.target;

    if (id === "category_id") {
      setSelectedSizes([]);
    }

    setFormData((prev) => ({ ...prev, [id]: value }));
    if (validationErrors[id]) {
      setValidationErrors((prev) => ({ ...prev, [id]: [] }));
    }
  };

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setValidationErrors({});

    try {
      const data = new FormData();
      data.append("title", formData.title);
      data.append("description", formData.description);
      data.append("category_id", formData.category_id);
      data.append("price", formData.price);
      if (formData.promo_price) {
        data.append("promo_price", formData.promo_price);
      }
      data.append("stock", formData.stock);

      selectedSizes.forEach((size) => {
        data.append("sizes[]", size);
      });

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
    <div className="min-h-screen bg-slate-50/50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Navigation / En-tête */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Nouveau produit</h1>
            <p className="text-xs text-slate-500 mt-1">Ajoutez un nouvel article à votre catalogue de vente.</p>
          </div>
          <Link
            to="/admin/dashboard"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 px-4 py-2.5 rounded-xl transition-all w-fit"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Retour au Tableau de bord
          </Link>
        </div>

        {/* Retours d'information */}
        {successMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-2xl flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-medium">{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-sm rounded-2xl flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-rose-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* COLONNE GAUCHE (2 tiers) : Infos Principales & Médias */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Carte 1 : Détails du Produit */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Informations Générales</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="title">
                    Nom du produit <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="title"
                    type="text"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="ex: Chaussure Sneakers Urban Pro"
                    className={`w-full text-sm outline-none px-4 py-3 rounded-xl border bg-slate-50/50 text-slate-800 transition-all focus:bg-white ${
                      validationErrors.title || validationErrors.name 
                        ? "border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-100" 
                        : "border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50"
                    }`}
                    required
                  />
                  {(validationErrors.title || validationErrors.name) && (
                    <p className="text-xs text-rose-500 mt-1 font-medium">
                      {(validationErrors.title || validationErrors.name)[0]}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="description">
                    Description
                  </label>
                  <textarea
                    id="description"
                    rows={5}
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Décrivez les caractéristiques, matières et points forts du produit..."
                    className={`w-full text-sm outline-none px-4 py-3 rounded-xl border bg-slate-50/50 text-slate-800 transition-all resize-none focus:bg-white ${
                      validationErrors.description 
                        ? "border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-100" 
                        : "border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50"
                    }`}
                  />
                  {validationErrors.description && (
                    <p className="text-xs text-rose-500 mt-1 font-medium">{validationErrors.description[0]}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Carte 2 : Upload Galerie Médias */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Galerie Médias</h2>
                <span className="text-xs font-medium text-slate-400">5 images max</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {imagePreviews.map((imgUrl, index) => (
                  <div key={index} className="relative group aspect-square">
                    <label
                      htmlFor={`image-${index}`}
                      className={`relative flex flex-col items-center justify-center w-full h-full border-2 border-dashed rounded-xl cursor-pointer transition-all overflow-hidden ${
                        imgUrl 
                          ? "border-slate-200 bg-white" 
                          : "border-slate-200 hover:border-indigo-400 bg-slate-50/50 hover:bg-indigo-50/20"
                      }`}
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
                        <div className="flex flex-col items-center gap-1 p-2 text-center text-slate-400 group-hover:text-indigo-600 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          <span className="text-[10px] font-semibold">
                            {index === 0 ? "Couverture" : `Photo ${index + 1}`}
                          </span>
                        </div>
                      )}
                    </label>

                    {imgUrl && (
                      <button
                        type="button"
                        onClick={(e) => handleRemoveImage(e, index)}
                        className="absolute top-1.5 right-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-full p-1 shadow-md transition-all opacity-90 hover:scale-110"
                        title="Supprimer la photo"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {validationErrors.images && (
                <p className="text-xs text-rose-500 font-medium">{validationErrors.images[0]}</p>
              )}
            </div>
          </div>

          {/* COLONNE DROITE (1 tier) : Catégorie, Tailles, Prix & Stock */}
          <div className="space-y-6">
            
            {/* Carte Catégorie & Tailles */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Classification</h2>
              
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="category_id">
                  Catégorie <span className="text-rose-500">*</span>
                </label>
                <select
                  id="category_id"
                  value={formData.category_id}
                  onChange={handleInputChange}
                  className={`w-full text-sm outline-none px-4 py-3 rounded-xl border bg-slate-50/50 text-slate-800 transition-all focus:bg-white cursor-pointer ${
                    validationErrors.category_id 
                      ? "border-rose-400 focus:border-rose-500" 
                      : "border-slate-200 focus:border-indigo-500"
                  }`}
                  required
                  disabled={loadingCategories}
                >
                  <option value="">
                    {loadingCategories ? "Chargement..." : "Sélectionner une catégorie"}
                  </option>
                  {categories.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
                {validationErrors.category_id && (
                  <p className="text-xs text-rose-500 mt-1 font-medium">{validationErrors.category_id[0]}</p>
                )}
              </div>

              {/* Sélection interactive des Tailles */}
              {availableSizes && availableSizes.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    Tailles disponibles
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availableSizes.map((size) => {
                      const isSelected = selectedSizes.includes(size);
                      return (
                        <button
                          type="button"
                          key={size}
                          onClick={() => toggleSize(size)}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                            isSelected
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                              : "bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-100"
                          }`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Carte Prix & Inventaire */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Prix & Stock</h2>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="price">
                  Prix de vente (FCFA) <span className="text-rose-500">*</span>
                </label>
                <input
                  id="price"
                  type="number"
                  min="0"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="0"
                  className={`w-full text-sm outline-none px-4 py-3 rounded-xl border bg-slate-50/50 text-slate-800 transition-all focus:bg-white ${
                    validationErrors.price ? "border-rose-400 focus:border-rose-500" : "border-slate-200 focus:border-indigo-500"
                  }`}
                  required
                />
                {validationErrors.price && (
                  <p className="text-xs text-rose-500 mt-1 font-medium">{validationErrors.price[0]}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="promo_price">
                  Prix barré / Promo (FCFA)
                </label>
                <input
                  id="promo_price"
                  type="number"
                  min="0"
                  value={formData.promo_price}
                  onChange={handleInputChange}
                  placeholder="Optionnel"
                  className={`w-full text-sm outline-none px-4 py-3 rounded-xl border bg-slate-50/50 text-slate-800 transition-all focus:bg-white ${
                    validationErrors.promo_price ? "border-rose-400 focus:border-rose-500" : "border-slate-200 focus:border-indigo-500"
                  }`}
                />
                {validationErrors.promo_price && (
                  <p className="text-xs text-rose-500 mt-1 font-medium">{validationErrors.promo_price[0]}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="stock">
                  Quantité en Stock <span className="text-rose-500">*</span>
                </label>
                <input
                  id="stock"
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={handleInputChange}
                  placeholder="ex: 25"
                  className={`w-full text-sm outline-none px-4 py-3 rounded-xl border bg-slate-50/50 text-slate-800 transition-all focus:bg-white ${
                    validationErrors.stock ? "border-rose-400 focus:border-rose-500" : "border-slate-200 focus:border-indigo-500"
                  }`}
                  required
                />
                {validationErrors.stock && (
                  <p className="text-xs text-rose-500 mt-1 font-medium">{validationErrors.stock[0]}</p>
                )}
              </div>

              {/* Bouton de Soumission */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Création en cours...</span>
                  </>
                ) : (
                  <span>Publier le produit</span>
                )}
              </button>
            </div>

          </div>

        </form>
      </div>
    </div>
  );
}

export default AddProduct;

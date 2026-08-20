import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

// Configuration dynamique des URL d'API et de stockage
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
const STORAGE_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "");

// Interfaces TypeScript
export interface Category {
  id: number | string;
  name: string;
  sizes?: string[] | string | null;
}

export interface Product {
  id?: string | number;
  title?: string;
  name?: string;
  description?: string;
  category?: Category | string;
  category_id?: string | number;
  price: number | string;
  promo_price?: number | string | null;
  offerPrice?: number | string;
  stock: number | string;
  sizes?: string[];
  images?: any[];
}

interface UpdateProductProps {
  productToEdit?: Product;
  onCancel?: () => void;
  onSuccess?: (updatedProduct: Product) => void;
}

function UpdateProduct({ productToEdit, onCancel, onSuccess }: UpdateProductProps) {
  const { id: routeId } = useParams();
  const navigate = useNavigate();

  // ID réel du produit (depuis les props ou l'URL)
  const productId = productToEdit?.id || routeId;

  // États pour la BDD et le Formulaire
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category_id: "",
    price: "",
    promo_price: "",
    stock: "",
  });

  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  // Stocke soit l'URL d'aperçu (string) soit un nouveau fichier choisi (File)
  const [images, setImages] = useState<(string | File | null)[]>([null, null, null, null, null]);

  // États de chargement et d'erreur
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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

  // 1. Récupération des catégories depuis l'API Laravel
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/categories`, {
          credentials: "include",
          headers: getAuthHeaders(),
        });
        if (response.ok) {
          const data = await response.json();
          const cats = Array.isArray(data) ? data : data.categories || data.data || [];
          setCategories(cats);
        }
      } catch (err) {
        console.error("Erreur lors du chargement des catégories:", err);
      }
    };

    fetchCategories();
  }, []);

  // Fonction utilitaire pour pré-remplir le formulaire avec les données du produit
  const populateForm = (product: Product) => {
    let catId = "";
    if (product.category_id) {
      catId = String(product.category_id);
    } else if (typeof product.category === "object" && product.category?.id) {
      catId = String(product.category.id);
    }

    setFormData({
      title: product.title || product.name || "",
      description: product.description || "",
      category_id: catId,
      price: String(product.price || ""),
      promo_price: String(product.promo_price || product.offerPrice || ""),
      stock: String(product.stock || ""),
    });

    // Traitement des tailles du produit
    let prodSizes = product.sizes || [];
    if (typeof prodSizes === "string") {
      try {
        prodSizes = JSON.parse(prodSizes);
      } catch {
        prodSizes = [];
      }
    }
    setSelectedSizes(prodSizes);

    // Traitement des images existantes du produit
    if (product.images && Array.isArray(product.images)) {
      const initialImages: (string | null)[] = [null, null, null, null, null];
      product.images.forEach((img: any, idx: number) => {
        if (idx < 5) {
          const url = typeof img === "string" ? img : img.url || img.image_path || img.path || "";
          if (url.startsWith("http://") || url.startsWith("https://")) {
            initialImages[idx] = url;
          } else {
            const cleanPath = url.replace(/^\//, "");
            initialImages[idx] = cleanPath.startsWith("storage/")
              ? `${STORAGE_BASE_URL}/${cleanPath}`
              : `${STORAGE_BASE_URL}/storage/${cleanPath}`;
          }
        }
      });
      setImages(initialImages);
    }
  };

  // 2. Récupération des données du produit à modifier depuis l'API
  useEffect(() => {
    if (productToEdit) {
      populateForm(productToEdit);
      setLoading(false);
    } else if (productId) {
      const fetchProduct = async () => {
        try {
          setLoading(true);
          const response = await fetch(`${API_BASE_URL}/admin/products/${productId}`, {
            credentials: "include",
            headers: getAuthHeaders(),
          });

          if (!response.ok) {
            throw new Error("Impossible de récupérer les détails du produit.");
          }

          const data = await response.json();
          const prod = data.product || data;
          populateForm(prod);
        } catch (err: any) {
          setError(err.message || "Erreur de chargement.");
        } finally {
          setLoading(false);
        }
      };

      fetchProduct();
    } else {
      setLoading(false);
    }
  }, [productToEdit, productId]);

  // Trouve la catégorie sélectionnée dans notre liste BDD
  const selectedCategoryObj = categories.find(
    (cat) => String(cat.id) === String(formData.category_id)
  );

  // Extrait les tailles disponibles enregistrées dans cette catégorie
  const getAvailableSizes = (): string[] => {
    if (!selectedCategoryObj || !selectedCategoryObj.sizes) return [];
    let sizes = selectedCategoryObj.sizes;
    if (typeof sizes === "string") {
      try {
        sizes = JSON.parse(sizes);
      } catch {
        return [];
      }
    }
    return Array.isArray(sizes) ? sizes : [];
  };

  const availableSizes = getAvailableSizes();

  // Handlers de modification
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCatId = e.target.value;
    setFormData((prev) => ({ ...prev, category_id: newCatId }));
    setSelectedSizes([]); // Réinitialise les tailles lors du changement de catégorie
  };

  const handleImageChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const newImages = [...images];
      newImages[index] = file; // Enregistre le fichier File pour l'envoi multipart
      setImages(newImages);
    }
  };

  const handleRemoveImage = (index: number, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const newImages = [...images];
    newImages[index] = null;
    setImages(newImages);
  };

  const toggleSize = (size: string) => {
    if (selectedSizes.includes(size)) {
      setSelectedSizes(selectedSizes.filter((s) => s !== size));
    } else {
      setSelectedSizes([...selectedSizes, size]);
    }
  };

  // 3. Soumission du formulaire de mise à jour à l'API Laravel
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) return;

    setSubmitting(true);
    setError(null);

    try {
      const bodyFormData = new FormData();

      // Astuce Laravel pour les formulaires multipart/form-data en modification
      //bodyFormData.append("_method", "PUT");

      bodyFormData.append("title", formData.title);
      bodyFormData.append("description", formData.description);
      bodyFormData.append("category_id", formData.category_id);
      bodyFormData.append("price", formData.price);
      if (formData.promo_price) {
        bodyFormData.append("promo_price", formData.promo_price);
      }
      bodyFormData.append("stock", formData.stock);

      if (selectedSizes.length > 0) {
        bodyFormData.append("sizes", JSON.stringify(selectedSizes));
      }

      images.forEach((img) => {
        if (img instanceof File) {
          bodyFormData.append("images[]", img);
        }
      });

      const response = await fetch(`${API_BASE_URL}/admin/products/${productId}`, {
        method: "POST", // Method POST avec _method PUT pour supporter multipart/form-data dans Laravel
        credentials: "include",
        headers: getAuthHeaders(),
        body: bodyFormData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erreur lors de la mise à jour du produit.");
      }

      alert("Produit mis à jour avec succès !");

      if (onSuccess) {
        onSuccess(data.product || data);
      } else {
        navigate("/admin/dashboard");
      }
    } catch (err: any) {
      console.error("Erreur update:", err);
      setError(err.message || "Une erreur est survenue.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-gray-500 font-medium">
        Chargement des données du produit...
      </div>
    );
  }

  return (
    <div className="py-8 px-4 md:px-8 bg-white min-h-screen">
      <form
        onSubmit={handleSubmit}
        className="space-y-6 max-w-2xl bg-white p-6 rounded-xl border border-gray-200 shadow-sm mx-auto"
      >
        {/* Entête */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              Modifier le Produit #{productId || ""}
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Mettez à jour les informations, les images ou les stocks.
            </p>
          </div>
          {(onCancel || routeId) && (
            <button
              type="button"
              onClick={onCancel || (() => navigate("/admin/dashboard"))}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <i className="fas fa-times text-lg"></i>
            </button>
          )}
        </div>

        {/* Message d'erreur s'il y en a un */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
            {error}
          </div>
        )}

        {/* Section Upload Images */}
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">
            Images du produit (Cliquez pour remplacer / ajouter)
          </p>
          <div className="flex flex-wrap items-center gap-3">
            {images.map((imgItem, index) => {
              const previewUrl =
                imgItem instanceof File
                  ? URL.createObjectURL(imgItem)
                  : imgItem;

              return (
                <div key={index} className="relative group">
                  <label
                    htmlFor={`update-image-${index}`}
                    className="flex items-center justify-center w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-500 transition-colors overflow-hidden bg-gray-50 relative"
                  >
                    <input
                      accept="image/*"
                      type="file"
                      id={`update-image-${index}`}
                      hidden
                      onChange={(e) => handleImageChange(index, e)}
                    />
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt={`preview-${index}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center text-gray-400">
                        <i className="fas fa-cloud-upload-alt text-lg"></i>
                        <span className="block text-[10px] font-medium">Ajouter</span>
                      </div>
                    )}
                  </label>

                  {previewUrl && (
                    <button
                      type="button"
                      onClick={(e) => handleRemoveImage(index, e)}
                      className="absolute -top-1.5 -right-1.5 bg-red-500 text-white w-5 h-5 rounded-full text-xs flex items-center justify-center shadow hover:bg-red-600 transition-colors"
                    >
                      ×
                    </button>
                  )}
                </div>
              );
            })}
          </div>
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
            onChange={handleChange}
            placeholder="Ex: T-Shirt en coton Bio"
            className="w-full text-sm outline-none py-2.5 px-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            required
          />
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
            onChange={handleChange}
            className="w-full text-sm outline-none py-2.5 px-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none"
            placeholder="Description détaillée du produit..."
          ></textarea>
        </div>

        {/* Sélection Catégorie dynamique depuis la BDD */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-gray-700" htmlFor="category_id">
            Catégorie
          </label>
          <select
            id="category_id"
            value={formData.category_id}
            onChange={handleCategoryChange}
            className="w-full text-sm outline-none py-2.5 px-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white transition-all"
            required
          >
            <option value="">Sélectionner une catégorie</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Tailles Conditionnelles depuis les catégories de la BDD */}
        {availableSizes.length > 0 && (
          <div className="flex flex-col gap-2 p-4 bg-indigo-50/50 rounded-lg border border-indigo-100">
            <label className="text-sm font-semibold text-gray-800">
              Tailles disponibles pour la catégorie "{selectedCategoryObj?.name}"
            </label>
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

        {/* Prix, Prix Promo et Stock */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-700" htmlFor="price">
              Prix (FCFA)
            </label>
            <input
              id="price"
              type="number"
              value={formData.price}
              onChange={handleChange}
              placeholder="0"
              className="text-sm outline-none py-2.5 px-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-700" htmlFor="promo_price">
              Prix Promo (Optionnel)
            </label>
            <input
              id="promo_price"
              type="number"
              value={formData.promo_price}
              onChange={handleChange}
              placeholder="0"
              className="text-sm outline-none py-2.5 px-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-700" htmlFor="stock">
              Stock disponible
            </label>
            <input
              id="stock"
              type="number"
              value={formData.stock}
              onChange={handleChange}
              placeholder="Ex: 20"
              className="text-sm outline-none py-2.5 px-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              required
            />
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          {(onCancel || routeId) && (
            <button
              type="button"
              onClick={onCancel || (() => navigate("/admin/dashboard"))}
              className="px-5 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium text-sm rounded-lg transition-colors"
            >
              Annuler
            </button>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium text-sm rounded-lg shadow transition-colors"
          >
            {submitting ? "Enregistrement..." : "Enregistrer les modifications"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default UpdateProduct;

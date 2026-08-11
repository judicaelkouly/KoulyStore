import React, { useState, useEffect } from "react";
import { FaPlus, FaTrash, FaEye, FaEyeSlash, FaUpload } from "react-icons/fa";

export interface Banner {
  id: number;
  title: string;
  subtitle?: string;
  badge?: string;
  button_text?: string;
  button_link?: string;
  image: string;
  gradient?: string;
  is_active: boolean;
}

function BannerList() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);

  // État des champs textes
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [badge, setBadge] = useState("NOUVELLE COLLECTION");
  const [buttonText, setButtonText] = useState("Découvrir la sélection");
  const [buttonLink, setButtonLink] = useState("#products");
  
  // État du fichier image sélectionné
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const getXsrfToken = () => {
    const cookies = document.cookie.split(";");
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split("=");
      if (name === "XSRF-TOKEN") return decodeURIComponent(value);
    }
    return "";
  };

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const xsrfToken = getXsrfToken();
      const headers: Record<string, string> = { Accept: "application/json" };
      if (xsrfToken) headers["X-XSRF-TOKEN"] = xsrfToken;

      const response = await fetch("http://localhost:8000/api/admin/banners", {
        headers,
        credentials: "include",
      });

      if (!response.ok) throw new Error("Erreur lors du chargement des bannières.");

      const data = await response.json();
      setBanners(data.banners || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  // Gestion du choix d'image depuis la galerie
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file)); // Aperçu direct avant upload
    }
  };

  // Soumission via FormData (Upload d'image)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile) {
      alert("Veuillez sélectionner une image !");
      return;
    }

    try {
      const xsrfToken = getXsrfToken();
      
      // Utilisation de FormData pour l'envoi de fichier
      const formData = new FormData();
      formData.append("title", title);
      formData.append("subtitle", subtitle);
      formData.append("badge", badge);
      formData.append("button_text", buttonText);
      formData.append("button_link", buttonLink);
      formData.append("image", imageFile); // Le fichier binaire
      formData.append("is_active", "1");

      const headers: Record<string, string> = {
        Accept: "application/json",
        // N.B: Ne PAS définir Content-Type avec FormData, le navigateur le gère seul avec le boundary
      };
      if (xsrfToken) headers["X-XSRF-TOKEN"] = xsrfToken;

      const response = await fetch("http://localhost:8000/api/admin/banners", {
        method: "POST",
        headers,
        credentials: "include",
        body: formData,
      });

      if (!response.ok) throw new Error("Impossible de créer la bannière.");

      setShowModal(false);
      // Réinitialisation
      setTitle("");
      setSubtitle("");
      setImageFile(null);
      setPreviewUrl(null);
      fetchBanners();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const toggleActive = async (banner: Banner) => {
    try {
      const xsrfToken = getXsrfToken();
      const headers: Record<string, string> = {
        Accept: "application/json",
        "Content-Type": "application/json",
      };
      if (xsrfToken) headers["X-XSRF-TOKEN"] = xsrfToken;

      await fetch(`http://localhost:8000/api/admin/banners/${banner.id}`, {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({ is_active: !banner.is_active }),
      });

      fetchBanners();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette bannière ?")) return;

    try {
      const xsrfToken = getXsrfToken();
      const headers: Record<string, string> = { Accept: "application/json" };
      if (xsrfToken) headers["X-XSRF-TOKEN"] = xsrfToken;

      await fetch(`http://localhost:8000/api/admin/banners/${id}`, {
        method: "DELETE",
        headers,
        credentials: "include",
      });

      fetchBanners();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-gray-500">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent mb-2"></div>
        <p className="text-sm">Chargement des bannières...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Bannières Publicitaires</h2>
          <p className="text-sm text-gray-500">Gérez les visuels du carrousel d'accueil</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-medium text-sm rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <FaPlus /> Nouvelle Bannière
        </button>
      </div>

      {error && <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

      {/* Grille des Bannières */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {banners.map((banner) => (
          <div
            key={banner.id}
            className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow relative"
          >
            <div className="h-44 relative bg-gray-900 flex items-end p-4">
              <img
                src={banner.image}
                alt={banner.title}
                className="absolute inset-0 w-full h-full object-cover opacity-60"
              />
              <div className="relative z-10 space-y-1">
                {banner.badge && (
                  <span className="text-[10px] font-bold tracking-widest text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-500/30">
                    {banner.badge}
                  </span>
                )}
                <h3 className="text-white font-bold text-base line-clamp-1">{banner.title}</h3>
                <p className="text-gray-300 text-xs line-clamp-1">{banner.subtitle}</p>
              </div>
            </div>

            <div className="p-4 flex items-center justify-between bg-gray-50 border-t border-gray-100">
              <button
                onClick={() => toggleActive(banner)}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${
                  banner.is_active
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-gray-200 text-gray-600 border-gray-300"
                }`}
              >
                {banner.is_active ? <FaEye /> : <FaEyeSlash />}
                {banner.is_active ? "Actif" : "Masqué"}
              </button>

              <button
                onClick={() => handleDelete(banner.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <FaTrash className="text-sm" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Ajout Bannière */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900">Ajouter une Bannière</h3>
            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-gray-700 font-medium mb-1">Titre</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-indigo-500"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">Sous-titre</label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-indigo-500"
                  rows={2}
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                />
              </div>

              {/* Champ d'Upload de fichier */}
              <div>
                <label className="block text-gray-700 font-medium mb-1">Image depuis la galerie *</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-indigo-500 transition-colors relative cursor-pointer bg-gray-50">
                  <input
                    type="file"
                    accept="image/*"
                    required
                    onChange={handleImageChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {previewUrl ? (
                    <div className="space-y-2">
                      <img src={previewUrl} alt="Aperçu" className="h-32 w-full object-cover rounded-md" />
                      <p className="text-xs text-gray-500">Cliquez pour changer d'image</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center space-y-2 py-2">
                      <FaUpload className="text-2xl text-gray-400" />
                      <span className="text-xs font-semibold text-gray-600">
                        Parcourir les fichiers de votre appareil
                      </span>
                      <span className="text-[10px] text-gray-400">PNG, JPG, WEBP jusqu'à 5 Mo</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Badge</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-indigo-500"
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Texte Bouton</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-indigo-500"
                    value={buttonText}
                    onChange={(e) => setButtonText(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
                >
                  Téléverser & Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default BannerList;

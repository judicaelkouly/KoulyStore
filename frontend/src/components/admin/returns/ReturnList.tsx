import { useState, useEffect } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
const STORAGE_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "");

export interface ReturnRequest {
  id: number;
  order_number: string;
  full_name: string;
  email: string;
  reason: string;
  description: string;
  image_path: string | null;
  status: "pending" | "approved" | "rejected" | "completed";
  created_at: string;
}

interface ReturnListProps {
  onReturnsUpdated?: () => void;
}

function ReturnList({ onReturnsUpdated }: ReturnListProps) {
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  // 📄 GESTION DE LA PAGINATION (20 par page)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 20;

  // État pour la modale de détails
  const [selectedReturn, setSelectedReturn] = useState<ReturnRequest | null>(null);

  // Helper pour récupérer le token XSRF (Laravel Sanctum)
  const getXsrfToken = (): string => {
    const cookies = document.cookie.split(";");
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split("=");
      if (name === "XSRF-TOKEN") {
        return decodeURIComponent(value);
      }
    }
    return "";
  };

  const getAuthHeaders = (): Record<string, string> => {
    const xsrfToken = getXsrfToken();
    return {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(xsrfToken ? { "X-XSRF-TOKEN": xsrfToken } : {}),
    };
  };

  // Récupération des demandes de retours
  const fetchReturns = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/returns`, {
        method: "GET",
        headers: getAuthHeaders(),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Impossible de récupérer la liste des retours.");
      }

      const data = await response.json();
      const returnList: ReturnRequest[] = Array.isArray(data)
        ? data
        : data.data || [];

      setReturns(returnList);
    } catch (err: unknown) {
      console.error("Erreur lors de la récupération des retours:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Une erreur est survenue.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, []);

  // Traitement / Mise à jour du statut d'un retour
  const handleStatusChange = async (id: number, newStatus: string) => {
    setUpdatingId(id);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/returns/${id}/status`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Échec de la mise à jour du statut.");
      }

      setReturns((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, status: newStatus as ReturnRequest["status"] } : item
        )
      );

      // Si l'élément actuellement ouvert dans la modale est celui modifié, mettre à jour son état
      if (selectedReturn && selectedReturn.id === id) {
        setSelectedReturn((prev) => prev ? { ...prev, status: newStatus as ReturnRequest["status"] } : null);
      }

      // Notification au composant parent (AdminPage) pour rafraîchir les KPIs
      if (onReturnsUpdated) {
        onReturnsUpdated();
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erreur lors de la mise à jour.");
    } finally {
      setUpdatingId(null);
    }
  };

  // Formatage propre de la date et de l'heure
  const formatDate = (isoString: string) => {
    if (!isoString) return { date: "N/A", time: "" };
    const d = new Date(isoString);
    const date = d.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const time = d.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return { date, time };
  };

  // Barre de recherche multicritère
  const filteredReturns = returns.filter((item) => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return true;

    return (
      item.order_number.toLowerCase().includes(query) ||
      item.full_name.toLowerCase().includes(query) ||
      item.email.toLowerCase().includes(query) ||
      item.reason.toLowerCase().includes(query) ||
      item.status.toLowerCase().includes(query)
    );
  });

  // 📄 CALCUL DES RETOURS POUR LA PAGE ACTIVE
  const totalPages = Math.ceil(filteredReturns.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedReturns = filteredReturns.slice(startIndex, endIndex);

  // Remise à la première page lors de la saisie d'une recherche
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  return (
    <div className="w-full relative">
      {/* Barre supérieure : Recherche */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="relative w-full md:w-80">
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
            placeholder="Rechercher par N° commande, client, motif..."
            className="w-full pl-9 pr-8 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors shadow-sm"
          />
          {searchTerm && (
            <button
              onClick={() => handleSearchChange("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 text-sm"
            >
              ✕
            </button>
          )}
        </div>

        <span className="text-xs font-semibold px-3 py-2 bg-gray-100 text-gray-700 rounded-lg border border-gray-200 shrink-0">
          {filteredReturns.length} / {returns.length}
        </span>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm flex justify-between items-center">
          <span>{error}</span>
          <button
            onClick={fetchReturns}
            className="text-xs bg-red-200 hover:bg-red-300 text-red-800 font-bold px-3 py-1 rounded"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* Tableau des Demandes de Retour */}
      <div className="overflow-x-auto bg-white rounded-lg border border-gray-200 shadow-sm">
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-gray-800 text-white uppercase text-xs leading-normal">
              <th className="py-3 px-4 text-left">Date & Heure</th>
              <th className="py-3 px-4 text-left">N° Commande</th>
              <th className="py-3 px-4 text-left">Client</th>
              <th className="py-3 px-4 text-left">Motif & Details</th>
              <th className="py-3 px-4 text-center">Preuve (Photo)</th>
              <th className="py-3 px-4 text-center">Statut actuel</th>
              <th className="py-3 px-4 text-center">Traitement</th>
              <th className="py-3 px-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="text-gray-600 text-sm">
            {loading ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-gray-500 font-medium">
                  Chargement des demandes de retour...
                </td>
              </tr>
            ) : filteredReturns.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-gray-500 space-y-2">
                  <p>
                    {searchTerm
                      ? `Aucun retour ne correspond à "${searchTerm}".`
                      : "Aucune demande de retour enregistrée."}
                  </p>
                  {searchTerm && (
                    <button
                      onClick={() => handleSearchChange("")}
                      className="text-xs font-semibold text-indigo-500 hover:underline"
                    >
                      Effacer la recherche
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              paginatedReturns.map((item) => {
                const { date, time } = formatDate(item.created_at);

                return (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedReturn(item)}
                    className="border-b border-gray-200 hover:bg-indigo-50/40 cursor-pointer transition duration-150"
                  >
                    {/* Date & Heure */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-semibold text-gray-800">{date}</div>
                      <div className="text-xs text-gray-400">{time}</div>
                    </td>

                    {/* N° Commande */}
                    <td className="py-3 px-4 font-bold text-indigo-600 whitespace-nowrap">
                      #{item.order_number}
                    </td>

                    {/* Information Client */}
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-800">{item.full_name}</div>
                      <div className="text-xs text-gray-400">{item.email}</div>
                    </td>

                    {/* Motif & Aperçu Explication */}
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-semibold text-gray-800">{item.reason}</div>
                      <div className="text-xs text-gray-500 truncate" title={item.description}>
                        {item.description}
                      </div>
                    </td>

                    {/* Photo de Preuve Miniature */}
                    <td className="py-3 px-4 text-center">
                      {item.image_path ? (
                        <img
                          src={`${STORAGE_BASE_URL}/storage/${item.image_path}`}
                          alt="Preuve produit"
                          className="w-10 h-10 object-cover rounded border border-gray-300 shadow-sm mx-auto"
                        />
                      ) : (
                        <span className="text-xs text-gray-400 italic">Aucune</span>
                      )}
                    </td>

                    {/* Statut Actuel */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                          item.status === "pending"
                            ? "bg-amber-100 text-amber-700 border border-amber-200"
                            : item.status === "approved"
                            ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                            : item.status === "completed"
                            ? "bg-blue-100 text-blue-700 border border-blue-200"
                            : "bg-red-100 text-red-700 border border-red-200"
                        }`}
                      >
                        {item.status === "pending"
                          ? "En attente"
                          : item.status === "approved"
                          ? "Approuvé"
                          : item.status === "completed"
                          ? "Terminé"
                          : "Refusé"}
                      </span>
                    </td>

                    {/* Traitement Admin */}
                    <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <select
                        disabled={updatingId === item.id}
                        value={item.status}
                        onChange={(e) => handleStatusChange(item.id, e.target.value)}
                        className="text-xs border border-gray-300 rounded-lg p-1.5 bg-gray-50 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition cursor-pointer"
                      >
                        <option value="pending">En attente</option>
                        <option value="approved">Approuver</option>
                        <option value="rejected">Refuser</option>
                        <option value="completed">Terminer</option>
                      </select>
                    </td>

                    {/* Bouton Voir Détails */}
                    <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedReturn(item)}
                        className="bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-xs"
                      >
                        Détails
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 📄 CONTRÔLES DE PAGINATION */}
      {!loading && !error && filteredReturns.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 pt-4 border-t border-gray-200">
          <div>
            <span className="text-sm text-gray-600">
              Affichage de {startIndex + 1} à{" "}
              {Math.min(endIndex, filteredReturns.length)} sur {filteredReturns.length} retour(s)
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm transition"
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
              className="px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm transition"
            >
              Suivant
            </button>
          </div>
        </div>
      )}

      {/* MODALE / POPUP DE DÉTAILS DU RETOUR */}
      {selectedReturn && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          onClick={() => setSelectedReturn(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Bouton de fermeture */}
            <button
              onClick={() => setSelectedReturn(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition"
            >
              ✕
            </button>

            {/* En-tête de la modale */}
            <div className="border-b border-gray-200 pb-3">
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full uppercase">
                Demande de Retour
              </span>
              <h3 className="text-xl font-extrabold text-gray-900 mt-2">
                Commande #{selectedReturn.order_number}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Soumis le {formatDate(selectedReturn.created_at).date} à {formatDate(selectedReturn.created_at).time}
              </p>
            </div>

            {/* Informations Client */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase">Client</p>
                <p className="text-sm font-bold text-gray-800 mt-0.5">{selectedReturn.full_name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase">Email / Contact</p>
                <p className="text-sm font-bold text-gray-800 mt-0.5">{selectedReturn.email}</p>
              </div>
            </div>

            {/* Motif et Description complète */}
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase">Motif du retour</p>
                <span className="inline-block mt-1 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-lg">
                  {selectedReturn.reason}
                </span>
              </div>

              <div>
                <p className="text-xs text-gray-400 font-bold uppercase mb-1">Explication détaillée du client</p>
                <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl text-xs sm:text-sm text-gray-700 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                  {selectedReturn.description}
                </div>
              </div>
            </div>

            {/* Photo de preuve grand format */}
            {selectedReturn.image_path ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-400 font-bold uppercase">Photo de preuve jointe</p>
                  <a
                    href={`${STORAGE_BASE_URL}/storage/${selectedReturn.image_path}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-indigo-600 font-bold hover:underline"
                  >
                    Ouvrir en plein écran ↗
                  </a>
                </div>
                <div className="bg-gray-900/5 p-2 rounded-xl border border-gray-200 flex justify-center">
                  <img
                    src={`${STORAGE_BASE_URL}/storage/${selectedReturn.image_path}`}
                    alt="Preuve produit grand format"
                    className="max-h-80 w-auto object-contain rounded-lg shadow-md"
                  />
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">Aucune image jointe à cette demande.</p>
            )}

            {/* Modifier le statut directement depuis la modale */}
            <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500">Changer le statut :</span>
              <select
                disabled={updatingId === selectedReturn.id}
                value={selectedReturn.status}
                onChange={(e) => handleStatusChange(selectedReturn.id, e.target.value)}
                className="text-xs border border-gray-300 rounded-lg p-2 bg-gray-50 font-bold text-gray-800 focus:ring-2 focus:ring-indigo-500 outline-none transition cursor-pointer"
              >
                <option value="pending">En attente</option>
                <option value="approved">Approuver</option>
                <option value="rejected">Refuser</option>
                <option value="completed">Terminer</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReturnList;

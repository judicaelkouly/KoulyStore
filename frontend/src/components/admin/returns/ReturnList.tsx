import { useState, useEffect } from "react";
import { 
  Search, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  CheckCheck, 
  RefreshCw, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Mail, 
  Eye, 
  ExternalLink, 
  AlertCircle,
  FileText,
  Package
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
const STORAGE_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "");

const getImageUrl = (imagePath: string | null): string | null => {
  if (!imagePath) return null;
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }
  return `${STORAGE_BASE_URL}/storage/${imagePath}`;
};

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
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  // Pagination (10 ou 20 par page)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 15;

  // Modale de détails
  const [selectedReturn, setSelectedReturn] = useState<ReturnRequest | null>(null);

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
        setError("Une erreur est survenue lors du chargement.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, []);

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

      if (selectedReturn && selectedReturn.id === id) {
        setSelectedReturn((prev) => prev ? { ...prev, status: newStatus as ReturnRequest["status"] } : null);
      }

      if (onReturnsUpdated) {
        onReturnsUpdated();
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erreur lors de la mise à jour.");
    } finally {
      setUpdatingId(null);
    }
  };

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

  // Filtrage multicritères (Recherche + Statut)
  const filteredReturns = returns.filter((item) => {
    const query = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !query ||
      item.order_number.toLowerCase().includes(query) ||
      item.full_name.toLowerCase().includes(query) ||
      item.email.toLowerCase().includes(query) ||
      item.reason.toLowerCase().includes(query) ||
      item.status.toLowerCase().includes(query);

    const matchesStatus = statusFilter === "all" || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calcul pagination
  const totalPages = Math.ceil(filteredReturns.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedReturns = filteredReturns.slice(startIndex, endIndex);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  // Statistiques rapides
  const pendingCount = returns.filter((r) => r.status === "pending").length;
  const approvedCount = returns.filter((r) => r.status === "approved").length;
  const completedCount = returns.filter((r) => r.status === "completed").length;
  const rejectedCount = returns.filter((r) => r.status === "rejected").length;

  const renderStatusBadge = (status: ReturnRequest["status"]) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200/60">
            <Clock size={11} /> En attente
          </span>
        );
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200/60">
            <CheckCircle2 size={11} /> Approuvé
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200/60">
            <CheckCheck size={11} /> Terminé
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200/60">
            <XCircle size={11} /> Refusé
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête / Cartes Métriques */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">En attente</p>
            <p className="text-xl font-bold text-amber-600 mt-0.5">{pendingCount}</p>
          </div>
          <div className="p-2 bg-amber-100/60 text-amber-600 rounded-lg">
            <Clock size={18} />
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Approuvés</p>
            <p className="text-xl font-bold text-emerald-600 mt-0.5">{approvedCount}</p>
          </div>
          <div className="p-2 bg-emerald-100/60 text-emerald-600 rounded-lg">
            <CheckCircle2 size={18} />
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Terminés</p>
            <p className="text-xl font-bold text-indigo-600 mt-0.5">{completedCount}</p>
          </div>
          <div className="p-2 bg-indigo-100/60 text-indigo-600 rounded-lg">
            <CheckCheck size={18} />
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Refusés</p>
            <p className="text-xl font-bold text-rose-600 mt-0.5">{rejectedCount}</p>
          </div>
          <div className="p-2 bg-rose-100/60 text-rose-600 rounded-lg">
            <XCircle size={18} />
          </div>
        </div>
      </div>

      {/* Barre d'action : Recherche & Filtres */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Recherche */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Rechercher N° commande, client, motif..."
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

        {/* Filtrage par Statut & Bouton Rafraîchir */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs bg-slate-50 border border-slate-200 text-slate-700 px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          >
            <option value="all">Tous les statuts</option>
            <option value="pending">En attente ({pendingCount})</option>
            <option value="approved">Approuvé ({approvedCount})</option>
            <option value="completed">Terminé ({completedCount})</option>
            <option value="rejected">Refusé ({rejectedCount})</option>
          </select>

          <button
            onClick={fetchReturns}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            title="Actualiser la liste"
          >
            <RefreshCw size={16} className={loading ? "animate-spin text-indigo-600" : ""} />
          </button>
        </div>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-xs flex justify-between items-center">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchReturns}
            className="px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 font-semibold rounded-lg text-[11px]"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* Tableau des Demandes de Retour */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Commande</th>
                <th className="py-3.5 px-4">Client</th>
                <th className="py-3.5 px-4">Motif & Explication</th>
                <th className="py-3.5 px-4 text-center">Preuve</th>
                <th className="py-3.5 px-4 text-center">Statut</th>
                <th className="py-3.5 px-4 text-center">Changer Statut</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="animate-spin text-indigo-600" size={24} />
                      <span>Chargement des demandes de retour...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredReturns.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 space-y-2">
                    <p className="font-medium text-slate-500">
                      {searchTerm
                        ? `Aucun retour ne correspond à "${searchTerm}"`
                        : "Aucune demande de retour trouvée."}
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
                paginatedReturns.map((item) => {
                  const { date, time } = formatDate(item.created_at);
                  const imageUrl = getImageUrl(item.image_path);

                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedReturn(item)}
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                    >
                      {/* Date */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <p className="font-bold text-slate-900">{date}</p>
                        <p className="text-[11px] text-slate-400">{time}</p>
                      </td>

                      {/* N° Commande */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-bold text-indigo-600 bg-indigo-50/80 px-2 py-1 rounded-lg w-fit">
                          <Package size={13} />
                          <span>#{item.order_number}</span>
                        </div>
                      </td>

                      {/* Client */}
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900">{item.full_name}</p>
                        <div className="flex items-center gap-1 text-[11px] text-slate-400">
                          <Mail size={11} />
                          <span className="truncate max-w-[140px]">{item.email}</span>
                        </div>
                      </td>

                      {/* Motif & Explication */}
                      <td className="py-3 px-4 max-w-xs">
                        <p className="font-bold text-slate-800 truncate">{item.reason}</p>
                        <p className="text-[11px] text-slate-400 truncate max-w-[200px]" title={item.description}>
                          {item.description}
                        </p>
                      </td>

                      {/* Preuve Photo */}
                      <td className="py-3 px-4 text-center">
                        {imageUrl ? (
                          <div className="relative group inline-block">
                            <img
                              src={imageUrl}
                              alt="Preuve"
                              className="w-9 h-9 object-cover rounded-lg border border-slate-200 shadow-xs mx-auto"
                            />
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-300 italic">Aucune</span>
                        )}
                      </td>

                      {/* Statut Badge */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {renderStatusBadge(item.status)}
                      </td>

                      {/* Sélecteur de statut rapide */}
                      <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <select
                          disabled={updatingId === item.id}
                          value={item.status}
                          onChange={(e) => handleStatusChange(item.id, e.target.value)}
                          className="text-[11px] bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold cursor-pointer disabled:opacity-50"
                        >
                          <option value="pending">En attente</option>
                          <option value="approved">Approuver</option>
                          <option value="rejected">Refuser</option>
                          <option value="completed">Terminer</option>
                        </select>
                      </td>

                      {/* Bouton Action */}
                      <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedReturn(item)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Voir les détails"
                        >
                          <Eye size={16} />
                        </button>
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
      {!loading && !error && filteredReturns.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2 text-xs text-slate-500">
          <div>
            Affichage de <span className="font-semibold text-slate-800">{startIndex + 1}</span> à{" "}
            <span className="font-semibold text-slate-800">{Math.min(endIndex, filteredReturns.length)}</span> sur{" "}
            <span className="font-semibold text-slate-800">{filteredReturns.length}</span> retour(s)
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

      {/* Modale de Détails du Retour */}
      {selectedReturn && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4"
          onClick={() => setSelectedReturn(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl space-y-5 relative max-h-[90vh] overflow-y-auto border border-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Bouton de Fermeture */}
            <button
              onClick={() => setSelectedReturn(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>

            {/* En-tête Modale */}
            <div className="border-b border-slate-100 pb-3 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Demande de Retour
                </span>
                {renderStatusBadge(selectedReturn.status)}
              </div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>Commande #{selectedReturn.order_number}</span>
              </h3>
              <p className="text-xs text-slate-400">
                Soumis le {formatDate(selectedReturn.created_at).date} à {formatDate(selectedReturn.created_at).time}
              </p>
            </div>

            {/* Informations Client */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/60 text-xs">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Nom du Client</p>
                <p className="font-bold text-slate-800 mt-0.5">{selectedReturn.full_name}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Email de Contact</p>
                <p className="font-bold text-slate-800 mt-0.5 break-all">{selectedReturn.email}</p>
              </div>
            </div>

            {/* Motif & Explication */}
            <div className="space-y-2">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Motif Déclaré</p>
                <span className="inline-block mt-1 text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-lg">
                  {selectedReturn.reason}
                </span>
              </div>

              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                  <FileText size={12} /> Explication du client
                </p>
                <div className="bg-slate-50 border border-slate-200/60 p-3 rounded-xl text-xs text-slate-700 leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {selectedReturn.description || "Aucune description supplémentaire fournie."}
                </div>
              </div>
            </div>

            {/* Photo de Preuve */}
            {selectedReturn.image_path ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Photo de Preuve Jointe</p>
                  <a
                    href={getImageUrl(selectedReturn.image_path) ?? "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-indigo-600 font-bold hover:underline flex items-center gap-1"
                  >
                    <span>Plein écran</span> <ExternalLink size={12} />
                  </a>
                </div>
                <div className="bg-slate-900/5 p-2 rounded-xl border border-slate-200/60 flex justify-center">
                  <img
                    src={getImageUrl(selectedReturn.image_path) ?? ""}
                    alt="Preuve produit"
                    className="max-h-64 w-auto object-contain rounded-lg shadow-sm"
                  />
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">Aucune image jointe à cette demande.</p>
            )}

            {/* Modifier le statut */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">Mettre à jour le statut :</span>
              <select
                disabled={updatingId === selectedReturn.id}
                value={selectedReturn.status}
                onChange={(e) => handleStatusChange(selectedReturn.id, e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition cursor-pointer"
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

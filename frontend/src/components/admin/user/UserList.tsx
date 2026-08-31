import { useState, useEffect } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

// 1. Interface pour l'utilisateur
export interface User {
  id: number | string;
  username?: string;
  name?: string;
  email: string;
  phone?: string;
  number?: string;
  address?: string;
  city?: string;
  role?: string;
}

function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | string | null>(null);

  // État pour la barre de recherche
  const [searchTerm, setSearchTerm] = useState<string>("");

  // 📄 GESTION DE LA PAGINATION (20 par page)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 20;

  // Helper pour récupérer le token XSRF dans les cookies (Laravel Sanctum)
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

  // Typage strict des en-têtes HTTP
  const getAuthHeaders = (): Record<string, string> => {
    const xsrfToken = getXsrfToken();
    return {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(xsrfToken ? { "X-XSRF-TOKEN": xsrfToken } : {}),
    };
  };

  // Récupération des utilisateurs
  const fetchUsers = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: "GET",
        headers: getAuthHeaders(),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Impossible de récupérer la liste des utilisateurs, connectez-vous.");
      }

      const data = await response.json();
      
      // Extraction et vérification du format de données
      const userList: User[] = Array.isArray(data)
        ? data
        : data.users || data.data || [];

      setUsers(userList);
    } catch (err: unknown) {
      console.error("Erreur lors de la récupération des utilisateurs: ", err);
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
    fetchUsers();
  }, []);

  // Suppression d'un utilisateur
  const handleDelete = async (userId: number | string): Promise<void> => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) {
      return;
    }

    setDeletingId(userId);
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Échec de la suppression.");
      }

      // Mise à jour de l'état local
      setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert("Erreur lors de la suppression.");
      }
    } finally {
      setDeletingId(null);
    }
  };

  // Filtrage dynamique multicritère
  const filteredUsers = users.filter((user) => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return true;

    const fullName = (user.username || user.name || "").toLowerCase();
    const email = user.email.toLowerCase();
    const phone = (user.phone || user.number || "").toLowerCase();
    const address = (user.address || user.city || "").toLowerCase();
    const role = (user.role || "client").toLowerCase();

    return (
      fullName.includes(query) ||
      email.includes(query) ||
      phone.includes(query) ||
      address.includes(query) ||
      role.includes(query)
    );
  });

  // 📄 CALCUL DES UTILISATEURS POUR LA PAGE ACTIVE
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  // Remise à la première page lors d'une nouvelle recherche
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8 text-white">Liste des Utilisateurs</h1>

      {/* Barre d'action supérieure avec champ de recherche */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="w-full md:w-auto">
          <a
            href="/admin/dashboard"
            className="inline-block focus:outline-none text-white  py-2.5 px-4 rounded-lg bg-gray-600 hover:bg-gray-400 font-semibold transition duration-200"
          >
            ← Back
          </a>
        </div>

        {/* Champ de Recherche */}
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
            placeholder="Rechercher par nom, email, rôle..."
            className="w-full pl-9 pr-8 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-sm"
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
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm flex justify-between items-center">
          <span>{error}</span>
          <button
            onClick={fetchUsers}
            className="text-xs bg-red-200 hover:bg-red-300 text-red-800 font-bold px-3 py-1 rounded"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* Tableau des utilisateurs */}
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-gray-600 text-white uppercase  leading-normal">
              <th className="py-3 px-6 text-left">Full Name</th>
              <th className="py-3 px-6 text-left">Email</th>
              <th className="py-3 px-6 text-left">Number</th>
              <th className="py-3 px-6 text-left">Address</th>
              <th className="py-3 px-6 text-center">Role</th>
              <th className="py-3 px-6 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="text-black">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-500 font-medium">
                  Chargement des utilisateurs...
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-500 space-y-2">
                  <p>
                    {searchTerm
                      ? `Aucun utilisateur ne correspond à "${searchTerm}".`
                      : "Aucun utilisateur trouvé."}
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
              paginatedUsers.map((user) => {
                const fullName = user.username || user.name || "N/A";
                const phone = user.phone || user.number || "N/A";
                const address = user.address || (user.city ? `${user.city}` : "N/A");
                const role = user.role || "client";

                return (
                  <tr
                    key={user.id}
                    className="border-b border-gray-200 hover:bg-gray-100 transition duration-150"
                  >
                    <td className="py-3 px-6 text-left whitespace-nowrap font-medium text-gray-800">
                      {fullName}
                    </td>
                    <td className="py-3 px-6 text-left">{user.email}</td>
                    <td className="py-3 px-6 text-left">{phone}</td>
                    <td className="py-3 px-6 text-left">{address}</td>

                    <td className="py-3 px-6 text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                          role === "admin"
                            ? "bg-purple-100 text-purple-700 border border-purple-200"
                            : "bg-blue-50 text-blue-600 border border-blue-100"
                        }`}
                      >
                        {role}
                      </span>
                    </td>

                    <td className="py-3 px-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <a
                          href={``}
                          className="w-4 transform hover:text-blue-500 hover:scale-110 transition duration-150"
                          title="Modifier"
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
                        </a>

                        <button
                          onClick={() => handleDelete(user.id)}
                          disabled={deletingId === user.id}
                          className="w-4 transform hover:text-red-500 hover:scale-110 transition duration-150 disabled:opacity-50"
                          title="Supprimer"
                        >
                          {deletingId === user.id ? (
                            <span className="inline-block animate-spin text-xs">🌀</span>
                          ) : (
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

      {/* 📄 CONTRÔLES DE PAGINATION */}
      {!loading && !error && filteredUsers.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 pt-4 border-t border-gray-200 bg-white/10 p-4 rounded-lg">
          <div>
            <span className="text-sm text-white">
              Affichage de {startIndex + 1} à{" "}
              {Math.min(endIndex, filteredUsers.length)} sur {filteredUsers.length} utilisateur(s)
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-md bg-blue-500 hover:bg-blue-400 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm font-semibold transition"
            >
              Précédent
            </button>

            <span className="text-sm text-white font-medium px-2">
              Page {currentPage} sur {totalPages || 1}
            </span>

            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage >= totalPages}
              className="px-3 py-1.5 rounded-md bg-blue-500 hover:bg-blue-400 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm font-semibold transition"
            >
              Suivant
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserList;

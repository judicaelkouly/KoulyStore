import  { useState, useEffect } from "react";

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
      const response = await fetch("http://localhost:8000/api/users", {
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
      const response = await fetch(`http://localhost:8000/api/users/${userId}`, {
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

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8 text-white">UserList</h1>

      {/* Barre d'action supérieure */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="w-full md:w-auto">
          <a
            href="/admin"
            className="inline-block focus:outline-none text-white text-sm py-2.5 px-4 rounded-lg bg-blue-500 hover:bg-blue-400 font-semibold transition duration-200"
          >
            ← Back
          </a>
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
            <tr className="bg-blue-500 text-white uppercase text-sm leading-normal">
              <th className="py-3 px-6 text-left">Full Name</th>
              <th className="py-3 px-6 text-left">Email</th>
              <th className="py-3 px-6 text-left">Number</th>
              <th className="py-3 px-6 text-left">Address</th>
              <th className="py-3 px-6 text-center">Role</th>
              <th className="py-3 px-6 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="text-gray-600 text-sm">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-500 font-medium">
                  Chargement des utilisateurs...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-500">
                  Aucun utilisateur trouvé.
                </td>
              </tr>
            ) : (
              users.map((user) => {
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
                          href={`/admin/users/edit/${user.id}`}
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
    </div>
  );
}

export default UserList;

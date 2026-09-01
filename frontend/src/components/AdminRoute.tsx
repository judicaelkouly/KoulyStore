import  { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";


// Helper pour récupérer le token XSRF
const getXsrfToken = () => {
  const cookies = document.cookie.split(";");
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split("=");
    if (name === "XSRF-TOKEN") return decodeURIComponent(value);
  }
  return "";
};

const AdminRoute = () => {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const xsrfToken = getXsrfToken();
        const res = await fetch(`${API_BASE_URL}/profile`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            ...(xsrfToken ? { "X-XSRF-TOKEN": xsrfToken } : {}),
          },
          credentials: "include",
        });

        if (res.ok) {
          const data = await res.json();
          const user = data.user || data.data || data;

          // Vérification si l'utilisateur possède le rôle admin
          if (user && (user.role === "admin" || user.is_admin === true)) {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error("Erreur de vérification des droits d'accès :", error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-gray-600 font-medium">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p>Vérification des autorisations d'accès...</p>
      </div>
    );
  }

  // Redirection automatique vers /login si l'utilisateur n'est pas administrateur
  if (!isAdmin) {
    return <Navigate to="/login" replace />;
  }

  // Affiche la page admin protégée (ton composant AdminPage)
  return <Outlet />;
};

export default AdminRoute;
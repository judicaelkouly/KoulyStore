import { useState } from "react";

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="flex items-center justify-between px-6 py-3 md:py-4 shadow max-w-5xl rounded-full mx-auto w-full bg-white relative mt-4">
      {/* Logo */}
      <div className="flex items-center">
        <a href="#" className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            fill="currentColor"
            className="bi bi-cart4 text-indigo-500 shrink-0"
            viewBox="0 0 16 16"
          >
            <path d="M0 2.5A.5.5 0 0 1 .5 2H2a.5.5 0 0 1 .485.379L2.89 4H14.5a.5.5 0 0 1 .485.621l-1.5 6A.5.5 0 0 1 13 11H4a.5.5 0 0 1-.485-.379L1.61 3H.5a.5.5 0 0 1-.5-.5M3.14 5l.5 2H5V5zM6 5v2h2V5zm3 0v2h2V5zm3 0v2h1.36l.5-2zm1.11 3H12v2h.61zM11 8H9v2h2zM8 8H6v2h2zM5 8H3.89l.5 2H5zm0 5a1 1 0 1 0 0 2 1 1 0 0 0 0-2m-2 1a2 2 0 1 1 4 0 2 2 0 0 1-4 0m9-1a1 1 0 1 0 0 2 1 1 0 0 0 0-2m-2 1a2 2 0 1 1 4 0 2 2 0 0 1-4 0" />
          </svg>
          <span className="text-lg md:text-xl font-extrabold text-indigo-600 tracking-tight whitespace-nowrap">
            Kouly<span className="text-gray-900">'Store</span>
          </span>
        </a>
      </div>

      {/* Menu de navigation mobile & desktop */}
      <nav
        id="menu"
        className={`max-md:fixed max-md:inset-0 max-md:overflow-hidden items-center justify-center transition-all duration-300 bg-white flex-col md:flex-row flex gap-6 md:gap-8 text-gray-900 text-sm font-normal z-50 ${
          isMenuOpen
            ? "max-md:opacity-100 max-md:pointer-events-auto"
            : "max-md:opacity-0 max-md:pointer-events-none md:opacity-100"
        }`}
      >
        <a
          className="hover:text-indigo-600 transition-colors text-base md:text-sm"
          href="#"
          onClick={() => setIsMenuOpen(false)}
        >
          Accueil
        </a>
        <a
          className="hover:text-indigo-600 transition-colors text-base md:text-sm"
          href="#produits"
          onClick={() => setIsMenuOpen(false)}
        >
          Produits
        </a>
        <a
          className="hover:text-indigo-600 transition-colors text-base md:text-sm"
          href="#categories"
          onClick={() => setIsMenuOpen(false)}
        >
          Catégories
        </a>
        <a
          className="hover:text-indigo-600 transition-colors text-base md:text-sm"
          href="#"
          onClick={() => setIsMenuOpen(false)}
        >
          Contact
        </a>

        {/* Boutons réservés au menu MOBILE */}
        <div className="flex flex-col w-64 gap-3 mt-4 md:hidden">
          <a
            className="w-full text-center bg-indigo-50 text-indigo-600 px-5 py-2.5 rounded-full text-sm font-medium hover:bg-indigo-100 transition"
            href="/register"
            onClick={() => setIsMenuOpen(false)}
          >
            S'inscrire
          </a>
          <a
            className="w-full text-center bg-indigo-600 text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-indigo-700 transition"
            href="/login"
            onClick={() => setIsMenuOpen(false)}
          >
            Se connecter
          </a>
        </div>

        {/* Bouton de fermeture menu mobile */}
        <button
          onClick={() => setIsMenuOpen(false)}
          className="md:hidden text-gray-600 absolute top-6 right-6 p-2"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </nav>

      {/* Actions (Boutons Desktop + Burger) */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        <a
          className="hidden md:flex bg-indigo-50 text-indigo-600 px-5 py-2 rounded-full text-sm font-medium hover:bg-indigo-100 transition"
          href="/register"
        >
          S'inscrire
        </a>
        <a
          className="hidden md:flex bg-indigo-600 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-indigo-700 transition"
          href="/login"
        >
          Se connecter
        </a>

        <button
          onClick={() => setIsMenuOpen(true)}
          className="md:hidden text-gray-600 p-1 hover:text-indigo-600 transition-colors"
          aria-label="Ouvrir le menu"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
    </header>
  );
}

export default Header;

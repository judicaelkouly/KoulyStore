import { useState, useEffect, useRef } from "react";
import Header from "./Header";
import HeaderConnect from "./HeaderConnect";
import Products from "./Products";
import Footer from "./Footer";
import { BiSolidCategoryAlt } from "react-icons/bi";

// Interfaces TypeScript
interface Category {
  id: number | string;
  name: string;
  image?: string;
  image_url?: string;
  promo?: string;
}

interface BannerSlide {
  id: number;
  title: string;
  subtitle: string;
  badge: string;
  buttonText: string;
  buttonLink: string;
  image: string;
  gradient: string;
}

function Dashboard() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const productsSectionRef = useRef<HTMLElement>(null);

  // 1. ÉTAT D'AUTHENTIFICATION & UTILISATEUR
  const [user, setUser] = useState<any | null>(null);
  const [checkingAuth, setCheckingAuth] = useState<boolean>(true);

  // 2. ÉTAT DES CATÉGORIES DEPUIS L'API
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState<boolean>(true);

  // 3. ÉTAT DES BANNIÈRES DYNAMIQUES DEPUIS L'API
  const [banners, setBanners] = useState<BannerSlide[]>([]);
  const [loadingBanners, setLoadingBanners] = useState<boolean>(true);

  // États React internes
  const [savedCategories, setSavedCategories] = useState<Record<string | number, boolean>>({});
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  // 🎯 ÉTAT DE LA CATÉGORIE SÉLECTIONNÉE
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // ================= VÉRIFICATION DE L'AUTHENTIFICATION =================
  useEffect(() => {
    const checkUserAuth = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/user", {
          headers: { Accept: "application/json" },
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user || data);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Erreur lors de la vérification de l'utilisateur :", error);
        setUser(null);
      } finally {
        setCheckingAuth(false);
      }
    };

    checkUserAuth();
  }, []);

  // ================= RÉCUPÉRATION DES CATÉGORIES (API) =================
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/categories", {
          headers: { Accept: "application/json" },
        });

        if (response.ok) {
          const data = await response.json();
          const fetchedList = Array.isArray(data) ? data : data.categories || data.data || [];
          setCategories(fetchedList);
        }
      } catch (error) {
        console.error("Erreur de chargement des catégories :", error);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  // ================= RÉCUPÉRATION DES BANNIÈRES DYNAMIQUES (API) =================
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/banners", {
          headers: { Accept: "application/json" },
        });

        if (response.ok) {
          const data = await response.json();
          const rawBanners = Array.isArray(data) ? data : data.banners || data.data || [];

          const formattedBanners: BannerSlide[] = rawBanners.map((item: any) => ({
            id: item.id,
            title: item.title || "",
            subtitle: item.subtitle || "",
            badge: item.badge || "NOUVEAUTÉ",
            buttonText: item.button_text || item.buttonText || "Découvrir la sélection",
            buttonLink: item.button_link || item.buttonLink || "#products",
            image: item.image?.startsWith("http")
              ? item.image
              : `http://localhost:8000/${item.image}`,
            gradient: item.gradient || "from-slate-900/90 via-slate-900/60 to-transparent",
          }));

          setBanners(formattedBanners);
        }
      } catch (error) {
        console.error("Erreur de chargement des bannières :", error);
      } finally {
        setLoadingBanners(false);
      }
    };

    fetchBanners();
  }, []);

  // ================= AUTOPLAY DU CARROUSEL =================
  useEffect(() => {
    if (isPaused || banners.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isPaused, banners.length]);

  const nextSlide = () => {
    if (banners.length > 0) {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }
  };

  const prevSlide = () => {
    if (banners.length > 0) {
      setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
    }
  };

  const toggleSaveCategory = (id: string | number) => {
    setSavedCategories((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getCategoryImageUrl = (cat: Category) => {
    if (cat.image_url) return cat.image_url;
    if (cat.image) {
      return cat.image.startsWith("http")
        ? cat.image
        : `http://localhost:8000/storage/${cat.image}`;
    }
    return "https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=300&q=80";
  };

  const scrollCategories = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === "left" ? -240 : 240;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  // ================= GESTION DE LA SELECTION DE CATEGORIE =================
  const handleSelectCategory = (cat: Category | null) => {
    if (selectedCategory?.id === cat?.id) {
      // Désélection si on clique à nouveau sur la catégorie active
      setSelectedCategory(null);
    } else {
      setSelectedCategory(cat);
      // Optionnel : réinitialiser la recherche par texte pour se concentrer sur la catégorie
      setSearchQuery("");
    }

    // Défiler doucement jusqu'à la section des produits
    if (productsSectionRef.current) {
      productsSectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // ================= GESTION DU SCROLL DE RECHERCHE =================
  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (productsSectionRef.current) {
      productsSectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    

      <div className=" bg-gradient-to-br from-slate-100 to-slate-300 text-slate-900">
        {/* Header conditionnel */}
        {checkingAuth ? (
          <div className="h-16 bg-white border-b border-gray-100 flex items-center justify-center text-xs text-gray-400">
            Chargement de la session...
          </div>
        ) : user ? (
          <HeaderConnect user={user} />
        ) : (
          <Header />
        )}

        {/* ================= SECTION HERO + CATÉGORIES AVEC BANNIÈRES LATÉRALES (DESKTOP) ================= */}
<section className="pt-6 px-4 mx-auto">
  <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
    
    {/* 👈 BANNIÈRE GAUCHE (S'étend sur Carrousel + Catégories) */}
    <aside className="hidden xl:block xl:col-span-2 sticky top-6">
      <a 
        href="#products" 
        className="block relative h-[820px] rounded-lg overflow-hidden shadow-lg border border-slate-200 group"
      >
        <img
          src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80"
          alt="Publicité Produit Gauche"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-5 text-white">
          <span className="bg-amber-500 text-black text-[10px] font-black uppercase px-2.5 py-1 rounded-md w-fit mb-2 shadow">
            Offre Flash
          </span>
          <h4 className="font-bold text-base leading-snug">Chaussures de Sport -30%</h4>
          <p className="text-xs text-gray-300 mt-1">Découvrir la collection</p>
        </div>
      </a>
    </aside>

    {/* 🎯 BLOC CENTRAL (Carrousel + Recherche + Catégories) */}
    <div className="col-span-1 xl:col-span-8 space-y-8">
      
      {/* 1. CARROUSEL PRINCIPAL */}
      <div
        className="relative w-full h-[180px] sm:h-[450px] rounded-xl overflow-hidden shadow-lg border border-slate-100 group bg-slate-900"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {loadingBanners ? (
          <div className="h-full w-full flex items-center justify-center text-white/70 text-sm">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-white border-t-transparent mr-3"></div>
            Chargement des bannières...
          </div>
        ) : banners.length === 0 ? (
          <div className="h-full w-full flex items-center justify-center text-white/70 text-sm">
            Aucune bannière disponible actuellement.
          </div>
        ) : (
          <>
            <div
              className="flex h-full w-full transition-transform duration-700 ease-out"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {banners.map((slide) => (
                <div key={slide.id} className="relative w-full h-full flex-shrink-0">
                  <img
                    src={slide.image}
                    alt={slide.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-r ${slide.gradient}`} />
                  <div className="relative z-10 h-full flex flex-col justify-center px-6 sm:px-12 max-w-2xl text-white">
                    {slide.badge && (
                      <span className="inline-block bg-indigo-600/90 backdrop-blur-md text-white mt-5 text-[11px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full w-fit mb-3 border border-indigo-400/30">
                        {slide.badge}
                      </span>
                    )}
                    <h2 className="text-lg sm:text-3xl font-black leading-tight tracking-tight drop-shadow-sm">
                      {slide.title}
                    </h2>
                    {slide.subtitle && (
                      <p className="text-xs sm:text-sm text-gray-200 mt-2 font-normal line-clamp-2">
                        {slide.subtitle}
                      </p>
                    )}
                    <div className="mt-4">
                      <a
                        href={slide.buttonLink}
                        className="inline-flex items-center gap-2 bg-white text-slate-900 hover:bg-indigo-600 hover:text-white px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md active:scale-95"
                      >
                        {slide.buttonText}
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Navigation du carrousel */}
            {banners.length > 1 && (
              <>
                <button
                  onClick={prevSlide}
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/80 hover:text-slate-900 text-white backdrop-blur-md w-9 h-9 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                >
                  ❮
                </button>
                <button
                  onClick={nextSlide}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/80 hover:text-slate-900 text-white backdrop-blur-md w-9 h-9 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                >
                  ❯
                </button>

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 bg-black/30 backdrop-blur-md px-2.5 py-1 rounded-full">
                  {banners.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      className={`h-1.5 rounded-full transition-all ${
                        currentSlide === index ? "w-6 bg-white" : "w-1.5 bg-white/40"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* 2. BARRE DE RECHERCHE */}
      <div className="flex justify-center relative z-20">
        <form
          onSubmit={handleSearchSubmit}
          className="flex items-center border pl-4 gap-2 bg-white border-gray-200 h-[50px] rounded-full shadow-md focus-within:ring-2 focus-within:ring-indigo-500/50 overflow-hidden w-full transition-all max-w-xl"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 30 30"
            fill="#6B7280"
            className="flex-shrink-0"
          >
            <path d="M13 3C7.489 3 3 7.489 3 13s4.489 10 10 10a9.95 9.95 0 0 0 6.322-2.264l5.971 5.971a1 1 0 1 0 1.414-1.414l-5.97-5.97A9.95 9.95 0 0 0 23 13c0-5.511-4.489-10-10-10m0 2c4.43 0 8 3.57 8 8s-3.57 8-8 8-8-3.57-8-8 3.57-8 8-8" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-full outline-none text-xs sm:text-sm text-gray-700 placeholder-gray-400"
            placeholder="Rechercher un produit par nom, description..."
          />

          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="text-gray-400 hover:text-gray-600 text-sm font-bold px-1"
            >
              ✕
            </button>
          )}

          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 transition-colors px-5 h-[40px] rounded-full text-xs font-semibold text-white mr-[4px] flex-shrink-0 active:scale-95"
          >
            Rechercher
          </button>
        </form>
      </div>

      {/* 3. SECTION CATÉGORIES DYNAMIQUES */}
      <div id="categories" className="pt-2">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Explorer les catégories</h2>
            <p className="text-xs text-gray-500 mt-0.5">Cliquez sur une catégorie pour afficher ses produits.</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => scrollCategories("left")}
              aria-label="Défiler à gauche"
              className="w-8 h-8 rounded-full border border-gray-200 bg-white hover:bg-indigo-50 hover:border-indigo-300 flex items-center justify-center text-slate-700 text-xs shadow-sm transition-all active:scale-95"
            >
              ❮
            </button>
            <button
              type="button"
              onClick={() => scrollCategories("right")}
              aria-label="Défiler à droite"
              className="w-8 h-8 rounded-full border border-gray-200 bg-white hover:bg-indigo-50 hover:border-indigo-300 flex items-center justify-center text-slate-700 text-xs shadow-sm transition-all active:scale-95"
            >
              ❯
            </button>
          </div>
        </div>

        <div
          ref={scrollContainerRef}
          className="flex items-center gap-3 overflow-x-auto no-scrollbar scroll-smooth py-2 px-1"
        >
          {/* Bouton toutes les catégories */}
          {!loadingCategories && categories.length > 0 && (
            <div
              onClick={() => handleSelectCategory(null)}
              className={`group relative border ${
                selectedCategory === null
                  ? "border-indigo-600 bg-indigo-50/50 shadow-md ring-2 ring-indigo-500/20"
                  : "border-zinc-200/80 hover:border-indigo-400 bg-white"
              } transition-all duration-300 rounded-xl p-2.5 flex flex-col justify-between w-36 shrink-0 cursor-pointer`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
                  Toutes
                </span>
              </div>
              <div className="flex items-center justify-center h-24 w-full mb-2 overflow-hidden rounded-lg bg-indigo-100/50 text-indigo-600 font-bold text-xl">
                <BiSolidCategoryAlt  className="w-full h-full object-cover"/>

              </div>
              <h3 className="font-bold text-center text-xs text-slate-800 truncate px-0.5">
                All Categories
              </h3>
            </div>
          )}

          {loadingCategories ? (
            <div className="py-8 text-xs text-gray-400 w-full text-center">
              Chargement des catégories...
            </div>
          ) : categories.length === 0 ? (
            <div className="py-8 text-xs text-gray-400 w-full text-center">
              Aucune catégorie disponible.
            </div>
          ) : (
            categories.map((cat) => {
              const isSelected = selectedCategory?.id === cat.id;

              return (
                <div
                  key={cat.id}
                  onClick={() => handleSelectCategory(cat)}
                  className={`group relative border ${
                    isSelected
                      ? "border-indigo-600 bg-indigo-50/40 shadow-md ring-2 ring-indigo-500/20"
                      : "border-zinc-200/80 hover:border-indigo-400 bg-white"
                  } hover:shadow-md transition-all duration-300 rounded-xl p-2.5 flex flex-col justify-between w-36 shrink-0 cursor-pointer`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`${
                        isSelected
                          ? "bg-indigo-600 text-white"
                          : "bg-indigo-50 text-indigo-600"
                      } text-[10px] font-bold px-2 py-0.5 rounded-md border border-indigo-100/50`}
                    >
                      {cat.promo || "Populaire"}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSaveCategory(cat.id);
                      }}
                      aria-label={`Mettre en favori ${cat.name}`}
                      className="w-6 h-6 rounded-full border border-zinc-200 bg-white flex items-center justify-center hover:bg-zinc-50 transition-colors"
                    >
                      <svg
                        width="8"
                        height="10"
                        viewBox="0 0 9 11"
                        fill={savedCategories[cat.id] ? "#4f46e5" : "none"}
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M7.357.5c.303 0 .594.117.808.325s.335.491.335.786v8.334a.54.54 0 0 1-.076.277.584.584 0 0 1-.779.205L5.067 8.995a1.17 1.17 0 0 0-1.134 0l-2.578 1.432a.584.584 0 0 1-.779-.205.54.54 0 0 1-.076-.277V1.61c0-.295.12-.577.335-.786A1.16 1.16 0 0 1 1.643.5z"
                          stroke={savedCategories[cat.id] ? "#4f46e5" : "#27272a"}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>

                  <div className="flex items-center justify-center h-24 w-full mb-2 overflow-hidden rounded-lg bg-slate-50">
                    <img
                      src={getCategoryImageUrl(cat)}
                      alt={cat.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=300&q=80";
                      }}
                    />
                  </div>

                  <h3 className={`font-bold text-center text-xs truncate px-0.5 transition-colors ${
                    isSelected ? "text-indigo-600 font-extrabold" : "text-slate-800 group-hover:text-indigo-600"
                  }`}>
                    {cat.name}
                  </h3>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>

    {/* 👉 BANNIÈRE DROITE (S'étend sur Carrousel + Catégories) */}
    <aside className="hidden xl:block xl:col-span-2 sticky top-6">
      <a 
        href="#products" 
        className="block relative h-[820px] rounded-lg overflow-hidden shadow-lg border border-slate-200 group"
      >
        <img
          src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80"
          alt="Publicité Produit Droite"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-5 text-white">
          <span className="bg-indigo-600 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-md w-fit mb-2 shadow">
            Tendance
          </span>
          <h4 className="font-bold text-base leading-snug">Casques & Audio High-Tech</h4>
          <p className="text-xs text-gray-300 mt-1">Voir les nouveautés</p>
        </div>
      </a>
    </aside>

  </div>
</section>


        {/* Section Produits (reçoit le terme de recherche et la catégorie active) */}
        <section id="products" ref={productsSectionRef}>
          <Products 
            searchQuery={searchQuery} 
            selectedCategory={selectedCategory}
            onClearCategory={() => setSelectedCategory(null)} 
          />
        </section>
        <Footer />
      </div>

      

  );
}

export default Dashboard;

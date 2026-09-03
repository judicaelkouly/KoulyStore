import logo from '../assets/logo4.png';

function Footer() {
  return (
    <footer className="bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 mt-12 w-full border-t border-white/5">
      <div className="w-full max-w-7xl mx-auto">
       
        <div className="grid grid-cols-2 md:flex md:flex-wrap md:justify-between gap-x-6 gap-y-10 lg:gap-x-8">

          {/* Section Marque & Description (Full width sur mobile) */}
          <div className="col-span-2 md:w-[45%] lg:w-[32%] flex flex-col items-start">
            <a href="/" className="flex items-center gap-3 group">
              <img 
                src={logo}
                alt="Kouly'Store Logo"
                className="h-12 sm:h-16 w-auto object-contain transition-transform group-hover:scale-105"
              />
            </a>
            <p className="text-sm text-gray-400 mt-4 max-w-sm leading-relaxed">
              Votre destination shopping de confiance. Nous sélectionnons des produits d'exception alliant qualité supérieure et tarifs compétitifs.
            </p>
          </div>

          {/* Colonne 1 : Navigation (Côte à côte sur mobile) */}
          <div className="col-span-1 md:w-[20%] lg:w-[15%] flex flex-col items-center text-left">
            <h3 className="text-xs sm:text-sm text-white font-semibold tracking-wider uppercase">Navigation</h3>
            <div className="flex flex-col gap-2.5 mt-4">
              <a href="#" className="text-sm text-gray-400 hover:text-indigo-400 transition-colors">Accueil</a>
              <a href="/about" className="text-sm text-gray-400 hover:text-indigo-400 transition-colors">À propos</a>
              <a href="#products" className="text-sm text-gray-400 hover:text-indigo-400 transition-colors">Nos Produits</a>
              <a href="/service-client" className="text-sm text-gray-400 hover:text-indigo-400 transition-colors">Service Client</a>
              <a href="/faq" className="text-sm text-gray-400 hover:text-indigo-400 transition-colors">FAQ</a>
            </div>
          </div>

          {/* Colonne 2 : Réseaux Sociaux (Côte à côte sur mobile) */}
          <div className="col-span-1 md:w-[20%] lg:w-[15%] flex flex-col items-center text-left">
            <h3 className="text-xs sm:text-sm text-white font-semibold tracking-wider uppercase">Suivez-nous</h3>
            <div className="flex flex-col gap-2.5 mt-4">
              <a href="#" className="text-sm text-gray-400 hover:text-indigo-400 transition-colors">X (Twitter)</a>
              <a href="#" className="text-sm text-gray-400 hover:text-indigo-400 transition-colors">Instagram</a>
              <a href="#" className="text-sm text-gray-400 hover:text-indigo-400 transition-colors">YouTube</a>
              <a href="#" className="text-sm text-gray-400 hover:text-indigo-400 transition-colors">LinkedIn</a>
            </div>
          </div>

          {/* Section Newsletter (Full width sur mobile) */}
          <div className="col-span-2 md:w-[45%] lg:w-[28%] flex flex-col items-center text-left">
            <h3 className="text-xs sm:text-sm text-white font-semibold tracking-wider uppercase">Restez informé</h3>
            <p className="text-xs text-gray-400 mt-2">Inscrivez-vous pour ne manquer aucune offre exclusive.</p>
            <form onSubmit={(e) => e.preventDefault()} className="flex items-center border border-white/10 bg-white/5 h-12 w-full max-w-md rounded-full overflow-hidden mt-4 focus-within:border-indigo-500/50 transition-colors">
              <input 
                type="email" 
                placeholder="Votre e-mail..." 
                className="w-full h-full pl-5 outline-none text-sm bg-transparent text-white placeholder-gray-500" 
                required 
              />
              <button 
                type="submit" 
                className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all px-5 h-9 rounded-full text-xs font-semibold text-white cursor-pointer mr-1.5 flex-shrink-0"
              >
                Rejoindre
              </button>
            </form>
          </div>

        </div>

        {/* Séparateur */}
        <div className="w-full h-px mt-12 mb-6 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

        {/* Footer Bas */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <p className="text-xs text-gray-500">© {new Date().getFullYear()} Kouly'Store. Tous droits réservés.</p>
          <div className="flex items-center gap-4 sm:gap-6">
            <a href="#" className="text-xs text-gray-500 hover:text-white transition-colors">Conditions Générales</a>
            <div className="w-px h-3 bg-white/10"></div>
            <a href="#" className="text-xs text-gray-500 hover:text-white transition-colors">Politique de Confidentialité</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

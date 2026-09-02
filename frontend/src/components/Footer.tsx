import logo from '../assets/logo4.png'
function Footer() {
  return (
    <footer className='bg-gray-900 py-16 px-4 sm:px-6 lg:px-8 mt-12 w-full border-t border-white/5'>
            <div className='w-full max-w-7xl mx-auto'>

                <div className="flex flex-wrap justify-between gap-y-12 lg:gap-x-8">

                    {/* Section Marque & Description */}
                    <div className="w-full md:w-[45%] lg:w-[35%] flex flex-col items-center md:items-start text-center md:text-left">
                       <div className="flex items-center">
                            <a href="/" className="flex items-center gap-3 group">
                                <img 
                                src={logo}
                                alt="Kouly'Store Logo"
                                className="h-10 sm:h-20 w-auto object-contain transition-transform group-hover:scale-105"

                                />
                            </a>
                            </div>
                        <div className='w-full max-w-52 h-px mt-6 bg-gradient-to-r from-transparent via-white/20 to-transparent md:bg-none'></div>
                        <p className='text-sm text-gray-400 mt-5 max-w-sm leading-relaxed'>
                            Votre destination shopping de confiance. Nous sélectionnons des produits d'exception alliant qualité supérieure et tarifs compétitifs pour sublimer votre quotidien.
                        </p>
                    </div>

                    {/* Liens Importants */}
                    <div className="w-full md:w-[45%] lg:w-[15%] flex flex-col items-center md:items-start text-center md:text-left">
                        <h3 className='text-sm text-white font-semibold tracking-wider uppercase'>Navigation</h3>
                        <div className="flex flex-col gap-3 mt-6">
                            <a href="#" className='text-sm text-gray-400 hover:text-indigo-400 transition-colors duration-200'>Accueil</a>
                            <a href="/about" className='text-sm text-gray-400 hover:text-indigo-400 transition-colors duration-200'>À propos</a>
                            <a href="#products" className='text-sm text-gray-400 hover:text-indigo-400 transition-colors duration-200'>Nos Produits</a>
                            <a href="/service-client" className='text-sm text-gray-400 hover:text-indigo-400 transition-colors duration-200'>Service Client</a>
                            <a href="/faq" className='text-sm text-gray-400 hover:text-indigo-400 transition-colors duration-200'>FAQ</a>
                        </div>
                    </div>

                    {/* Réseaux Sociaux */}
                    <div className="w-full md:w-[45%] lg:w-[15%] flex flex-col items-center md:items-start text-center md:text-left">
                        <h3 className='text-sm text-white font-semibold tracking-wider uppercase'>Suivez-nous</h3>
                        <div className="flex flex-col gap-3 mt-6">
                            <a href="#" className='text-sm text-gray-400 hover:text-indigo-400 transition-colors duration-200'>X (Twitter)</a>
                            <a href="#" className='text-sm text-gray-400 hover:text-indigo-400 transition-colors duration-200'>Instagram</a>
                            <a href="#" className='text-sm text-gray-400 hover:text-indigo-400 transition-colors duration-200'>YouTube</a>
                            <a href="#" className='text-sm text-gray-400 hover:text-indigo-400 transition-colors duration-200'>LinkedIn</a>
                        </div>
                    </div>

                    {/* Newsletter */}
                    <div className="w-full md:w-[45%] lg:w-[25%] flex flex-col items-center md:items-start text-center md:text-left">
                        <h3 className='text-sm text-white font-semibold tracking-wider uppercase'>Restez informé</h3>
                        <p className="text-xs text-gray-400 mt-2">Inscrivez-vous pour ne manquer aucune offre exclusive.</p>
                        <form onSubmit={(e) => e.preventDefault()} className="flex items-center border gap-2 border-white/10 bg-white/5 h-12 max-w-80 w-full rounded-full overflow-hidden mt-4 focus-within:border-indigo-500/50 transition-colors">
                            <input 
                                type="email" 
                                placeholder="Votre adresse e-mail..." 
                                className="w-full h-full pl-5 outline-none text-sm bg-transparent text-white placeholder-gray-500" 
                                required 
                            />
                            <button 
                                type="submit" 
                                className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all px-5 h-9 rounded-full text-sm font-medium text-white cursor-pointer mr-1.5 flex-shrink-0"
                            >
                                Rejoindre
                            </button>
                        </form>
                    </div>

                </div>

                {/* Séparateur */}
                <div className='w-full h-px mt-16 mb-6 bg-gradient-to-r from-transparent via-white/10 to-transparent'></div>

                {/* Footer Bas */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className='text-xs text-gray-500'>© {new Date().getFullYear()} Kouly'Store. Tous droits réservés.</p>
                    <div className="flex items-center gap-4 sm:gap-6">
                        <a href='#' className='text-xs text-gray-500 hover:text-white transition-colors duration-200'>Conditions Générales</a>
                        <div className='w-px h-3 bg-white/10'></div>
                        <a href='#' className='text-xs text-gray-500 hover:text-white transition-colors duration-200'>Politique de Confidentialité</a>
                    </div>
                </div>
            </div>
        </footer>
  );
}

export default Footer;
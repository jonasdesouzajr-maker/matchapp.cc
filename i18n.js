/* ============================================================
   MatchApp — NATIVE INTERNATIONALIZATION ENGINE
   ------------------------------------------------------------
   Replaces the Google Translate widget with hand-written native
   copy. The widget produced machine translations that read badly
   and broke layout; these strings are authored per language.

   How it works:
     1. Detect the device/browser language (navigator.languages).
     2. Fall back through region -> base language -> English.
     3. Honour a saved manual override in localStorage.
     4. Apply strings to any element carrying data-i18n /
        data-i18n-html / data-i18n-placeholder / data-i18n-aria.
     5. Set <html lang> and dir="rtl" for Arabic so the whole
        layout mirrors correctly.
   ============================================================ */

const I18N_LANGS = {
    'en':    { name: 'English',    flag: '🇺🇸', dir: 'ltr' },
    'pt-BR': { name: 'Português',  flag: '🇧🇷', dir: 'ltr' },
    'es':    { name: 'Español',    flag: '🇪🇸', dir: 'ltr' },
    'fr':    { name: 'Français',   flag: '🇫🇷', dir: 'ltr' },
    'de':    { name: 'Deutsch',    flag: '🇩🇪', dir: 'ltr' },
    'it':    { name: 'Italiano',   flag: '🇮🇹', dir: 'ltr' },
    'tr':    { name: 'Türkçe',     flag: '🇹🇷', dir: 'ltr' },
    'ru':    { name: 'Русский',    flag: '🇷🇺', dir: 'ltr' },
    'ar':    { name: 'العربية',    flag: '🇸🇦', dir: 'rtl' },
    'hi':    { name: 'हिन्दी',       flag: '🇮🇳', dir: 'ltr' },
    'id':    { name: 'Indonesia',  flag: '🇮🇩', dir: 'ltr' },
    'ja':    { name: '日本語',      flag: '🇯🇵', dir: 'ltr' },
    'ko':    { name: '한국어',      flag: '🇰🇷', dir: 'ltr' },
    'zh':    { name: '中文',        flag: '🇨🇳', dir: 'ltr' }
};

const I18N = {
  'en': {
    'search.heading': 'Search or Ask Anything', 'search.hint': 'Type a title for a direct match — or ask a full question and our AI will find every title that fits.', 'search.trythese': 'Try:',
    'nav.signin': '👤 Sign In / Join', 'nav.profile': '👤 Profile', 'nav.logout': 'Logout',
    'chrome.notice': 'Open on Google Chrome for the Best Experience',
    'marquee.title': '🔥 Trending Blockbusters Worldwide',
    'search.heading': 'Search Any Title Directly',
    'search.placeholder': 'Type a movie, series, drama or podcast...',
    'search.button': '🔍 Search',
    'how.title': 'How MatchApp Works',
    'how.intro': 'MatchApp is your <strong>premium AI streaming concierge</strong>. Instead of scrolling three apps for forty minutes, tell us what you\'re in the mood for and our AI finds the one title worth your night — plus exactly where to watch it. It takes about <strong>15 seconds</strong>.',
    'how.s1.title': 'Set Your Mood', 'how.s1.body': 'Pick a format, platform, mood, era and age rating. Choosing one narrows the rest automatically — or hit <em>Surprise Me</em> and let the AI decide everything.',
    'how.s2.title': 'Get Your Match', 'how.s2.body': 'Our AI returns one perfect pick with its real cover art, a playable trailer, and a synopsis — drawn from movies, series, K-dramas, anime, novelas, micro-dramas, podcasts and Spotify.',
    'how.s3.title': 'Watch It Instantly', 'how.s3.body': 'One tap opens it on Netflix, Prime, Max, Disney+, Spotify or wherever it lives. Save it to Watch Later, or hit <em>Not For Me</em> and we\'ll instantly find another.',
    'how.cta': '⚡ Find My Match — It\'s Free',
    'how.freeline': '3 free matches daily · Register free for 5 · No credit card required',
    'q.title': 'Curate Your Perfect Match',
    'q.category': 'Category / Format', 'q.platform': 'Platform', 'q.mood': 'Mood',
    'q.vibe': 'Vibe', 'q.era': 'Era / Decade', 'q.rating': 'Age Appropriateness',
    'q.submit': '⚡ Consult AI Concierge',
    'opt.surprise': '✨ Surprise Me', 'opt.anyplatform': 'Any Platform', 'opt.anyplatformhas': 'Any Platform That Has It',
    'opt.anymood': 'Any Mood', 'opt.anyvibe': 'Any Vibe', 'opt.anyera': 'Any Era (1920 – Today)', 'opt.anyrating': 'Any Rating',
    'res.streamnow': '▶ Stream Now', 'res.listennow': '🎧 Listen Now', 'res.findwhere': '▶ Find Where To Stream',
    'res.trailer': '🎬 Trailer & Preview',
    'res.nopreview': 'No preview clip available for this title. Watch the official trailer on YouTube:',
    'res.ytsearch': '▶ Search on YouTube', 'res.ytmore': '▶ More trailers on YouTube', 'res.applestore': '🍎 View on Apple Store',
    'res.watchlater': '⭐ Watch Later', 'res.listenlater': '🎧 Listen Later',
    'res.seenit': '👁️ I\'ve Seen It', 'res.heardit': '🎼 Have Heard It',
    'res.loved': '👍 Loved It', 'res.notforme': '👎 Not For Me',
    'rematch.title': '👎 Noted!', 'rematch.same': '⚡ Match Again — Same Choices',
    'rematch.change': '🎛️ Change My Choices First', 'rematch.close': 'Close',
    'loading.title': 'Consulting the AI Concierge...',
    'footer.movies': '🎬 Movies & TV Platforms', 'footer.regional': '🌎 Novelas, K-Drama & Anime',
    'footer.audio': '🎧 Podcasts, Playlists, Singles & Audio', 'footer.find': '🔍 Find Where To Stream Anything',
    'footer.popular': 'Popular Searches on MatchApp',
    'lang.label': 'Language'
  },
  'pt-BR': {
    'search.heading': 'Busque ou pergunte qualquer coisa', 'search.hint': 'Digite um título para busca direta — ou faça uma pergunta completa e nossa IA encontrará todos os títulos que combinam.', 'search.trythese': 'Experimente:',
    'nav.signin': '👤 Entrar / Cadastrar', 'nav.profile': '👤 Perfil', 'nav.logout': 'Sair',
    'chrome.notice': 'Abra no Google Chrome para a melhor experiência',
    'marquee.title': '🔥 Sucessos em alta no mundo todo',
    'search.heading': 'Busque qualquer título diretamente',
    'search.placeholder': 'Digite um filme, série, novela ou podcast...',
    'search.button': '🔍 Buscar',
    'how.title': 'Como o MatchApp funciona',
    'how.intro': 'O MatchApp é o seu <strong>concierge premium de streaming com IA</strong>. Em vez de passar quarenta minutos rolando três aplicativos, diga o que você está a fim de assistir e nossa IA encontra o título que vale a sua noite — e exatamente onde assistir. Leva cerca de <strong>15 segundos</strong>.',
    'how.s1.title': 'Escolha seu clima', 'how.s1.body': 'Selecione formato, plataforma, clima, época e classificação. Cada escolha filtra a seguinte automaticamente — ou toque em <em>Surpreenda-me</em> e deixe a IA decidir tudo.',
    'how.s2.title': 'Receba seu match', 'how.s2.body': 'Nossa IA devolve uma indicação perfeita com a capa real, trailer para assistir e sinopse — de filmes, séries, K-dramas, animes, novelas, microdramas, podcasts e Spotify.',
    'how.s3.title': 'Assista na hora', 'how.s3.body': 'Um toque abre na Netflix, Prime, Max, Disney+, Globoplay, Spotify ou onde estiver. Salve em Assistir Depois, ou toque em <em>Não é pra mim</em> e achamos outro na hora.',
    'how.cta': '⚡ Encontrar meu match — é grátis',
    'how.freeline': '3 matches grátis por dia · Cadastre-se grátis e ganhe 5 · Sem cartão de crédito',
    'q.title': 'Monte seu match perfeito',
    'q.category': 'Categoria / Formato', 'q.platform': 'Plataforma', 'q.mood': 'Clima',
    'q.vibe': 'Estilo', 'q.era': 'Época / Década', 'q.rating': 'Faixa etária',
    'q.submit': '⚡ Consultar o concierge de IA',
    'opt.surprise': '✨ Surpreenda-me', 'opt.anyplatform': 'Qualquer plataforma', 'opt.anyplatformhas': 'Qualquer plataforma que tenha',
    'opt.anymood': 'Qualquer clima', 'opt.anyvibe': 'Qualquer estilo', 'opt.anyera': 'Qualquer época (1920 – hoje)', 'opt.anyrating': 'Qualquer classificação',
    'res.streamnow': '▶ Assistir agora', 'res.listennow': '🎧 Ouvir agora', 'res.findwhere': '▶ Ver onde assistir',
    'res.trailer': '🎬 Trailer e prévia',
    'res.nopreview': 'Não há prévia disponível para este título. Assista ao trailer oficial no YouTube:',
    'res.ytsearch': '▶ Buscar no YouTube', 'res.ytmore': '▶ Mais trailers no YouTube', 'res.applestore': '🍎 Ver na Apple Store',
    'res.watchlater': '⭐ Assistir depois', 'res.listenlater': '🎧 Ouvir depois',
    'res.seenit': '👁️ Já assisti', 'res.heardit': '🎼 Já ouvi',
    'res.loved': '👍 Amei', 'res.notforme': '👎 Não é pra mim',
    'rematch.title': '👎 Entendido!', 'rematch.same': '⚡ Buscar outro — mesmas escolhas',
    'rematch.change': '🎛️ Mudar minhas escolhas antes', 'rematch.close': 'Fechar',
    'loading.title': 'Consultando o concierge de IA...',
    'footer.movies': '🎬 Plataformas de filmes e séries', 'footer.regional': '🌎 Novelas, K-Drama e Anime',
    'footer.audio': '🎧 Podcasts, playlists, singles e áudio', 'footer.find': '🔍 Descubra onde assistir qualquer coisa',
    'footer.popular': 'Buscas populares no MatchApp',
    'lang.label': 'Idioma'
  },
  'es': {
    'search.heading': 'Busca o pregunta lo que quieras', 'search.hint': 'Escribe un título para búsqueda directa — o haz una pregunta completa y nuestra IA encontrará todos los títulos que encajen.', 'search.trythese': 'Prueba:',
    'nav.signin': '👤 Iniciar sesión / Registrarse', 'nav.profile': '👤 Perfil', 'nav.logout': 'Cerrar sesión',
    'chrome.notice': 'Abre en Google Chrome para la mejor experiencia',
    'marquee.title': '🔥 Grandes éxitos en tendencia mundial',
    'search.heading': 'Busca cualquier título directamente',
    'search.placeholder': 'Escribe una película, serie, drama o podcast...',
    'search.button': '🔍 Buscar',
    'how.title': 'Cómo funciona MatchApp',
    'how.intro': 'MatchApp es tu <strong>conserje premium de streaming con IA</strong>. En lugar de pasar cuarenta minutos entre tres aplicaciones, dinos qué te apetece y nuestra IA encuentra el título que vale tu noche — y exactamente dónde verlo. Tarda unos <strong>15 segundos</strong>.',
    'how.s1.title': 'Elige tu ánimo', 'how.s1.body': 'Selecciona formato, plataforma, ánimo, época y clasificación. Cada elección filtra la siguiente automáticamente — o pulsa <em>Sorpréndeme</em> y deja que la IA decida todo.',
    'how.s2.title': 'Recibe tu match', 'how.s2.body': 'Nuestra IA devuelve una recomendación perfecta con su carátula real, tráiler reproducible y sinopsis — de películas, series, K-dramas, anime, telenovelas, microdramas, podcasts y Spotify.',
    'how.s3.title': 'Míralo al instante', 'how.s3.body': 'Un toque lo abre en Netflix, Prime, Max, Disney+, Spotify o donde esté. Guárdalo en Ver más tarde, o pulsa <em>No es para mí</em> y encontramos otro al instante.',
    'how.cta': '⚡ Encontrar mi match — es gratis',
    'how.freeline': '3 matches gratis al día · Regístrate gratis y obtén 5 · Sin tarjeta de crédito',
    'q.title': 'Crea tu match perfecto',
    'q.category': 'Categoría / Formato', 'q.platform': 'Plataforma', 'q.mood': 'Ánimo',
    'q.vibe': 'Estilo', 'q.era': 'Época / Década', 'q.rating': 'Clasificación por edad',
    'q.submit': '⚡ Consultar al conserje de IA',
    'opt.surprise': '✨ Sorpréndeme', 'opt.anyplatform': 'Cualquier plataforma', 'opt.anyplatformhas': 'Cualquier plataforma que lo tenga',
    'opt.anymood': 'Cualquier ánimo', 'opt.anyvibe': 'Cualquier estilo', 'opt.anyera': 'Cualquier época (1920 – hoy)', 'opt.anyrating': 'Cualquier clasificación',
    'res.streamnow': '▶ Ver ahora', 'res.listennow': '🎧 Escuchar ahora', 'res.findwhere': '▶ Ver dónde verlo',
    'res.trailer': '🎬 Tráiler y avance',
    'res.nopreview': 'No hay avance disponible para este título. Mira el tráiler oficial en YouTube:',
    'res.ytsearch': '▶ Buscar en YouTube', 'res.ytmore': '▶ Más tráilers en YouTube', 'res.applestore': '🍎 Ver en Apple Store',
    'res.watchlater': '⭐ Ver más tarde', 'res.listenlater': '🎧 Escuchar después',
    'res.seenit': '👁️ Ya la vi', 'res.heardit': '🎼 Ya la escuché',
    'res.loved': '👍 Me encantó', 'res.notforme': '👎 No es para mí',
    'rematch.title': '👎 ¡Entendido!', 'rematch.same': '⚡ Buscar otro — mismas opciones',
    'rematch.change': '🎛️ Cambiar mis opciones primero', 'rematch.close': 'Cerrar',
    'loading.title': 'Consultando al conserje de IA...',
    'footer.movies': '🎬 Plataformas de cine y TV', 'footer.regional': '🌎 Telenovelas, K-Drama y Anime',
    'footer.audio': '🎧 Podcasts, playlists, singles y audio', 'footer.find': '🔍 Descubre dónde ver cualquier cosa',
    'footer.popular': 'Búsquedas populares en MatchApp',
    'lang.label': 'Idioma'
  },
  'fr': {
    'search.heading': 'Cherchez ou posez une question', 'search.hint': 'Tapez un titre pour une recherche directe — ou posez une question complète et notre IA trouvera tous les titres correspondants.', 'search.trythese': 'Essayez :',
    'nav.signin': '👤 Connexion / Inscription', 'nav.profile': '👤 Profil', 'nav.logout': 'Déconnexion',
    'chrome.notice': 'Ouvrez dans Google Chrome pour une expérience optimale',
    'marquee.title': '🔥 Blockbusters tendance dans le monde',
    'search.heading': 'Recherchez un titre directement',
    'search.placeholder': 'Tapez un film, une série, un drama ou un podcast...',
    'search.button': '🔍 Rechercher',
    'how.title': 'Comment fonctionne MatchApp',
    'how.intro': 'MatchApp est votre <strong>concierge streaming premium propulsé par l\'IA</strong>. Au lieu de parcourir trois applis pendant quarante minutes, dites-nous votre humeur et notre IA trouve le titre qui vaut votre soirée — et exactement où le regarder. Cela prend environ <strong>15 secondes</strong>.',
    'how.s1.title': 'Choisissez votre humeur', 'how.s1.body': 'Sélectionnez format, plateforme, humeur, époque et classification. Chaque choix affine le suivant automatiquement — ou appuyez sur <em>Surprenez-moi</em> et laissez l\'IA tout décider.',
    'how.s2.title': 'Obtenez votre match', 'how.s2.body': 'Notre IA renvoie une recommandation parfaite avec sa vraie affiche, une bande-annonce lisible et un synopsis — parmi films, séries, K-dramas, animes, telenovelas, micro-dramas, podcasts et Spotify.',
    'how.s3.title': 'Regardez immédiatement', 'how.s3.body': 'Un appui l\'ouvre sur Netflix, Prime, Max, Disney+, Spotify ou ailleurs. Enregistrez-le dans À voir plus tard, ou appuyez sur <em>Pas pour moi</em> et nous en trouvons un autre aussitôt.',
    'how.cta': '⚡ Trouver mon match — c\'est gratuit',
    'how.freeline': '3 matchs gratuits par jour · Inscrivez-vous gratuitement pour 5 · Sans carte bancaire',
    'q.title': 'Composez votre match parfait',
    'q.category': 'Catégorie / Format', 'q.platform': 'Plateforme', 'q.mood': 'Humeur',
    'q.vibe': 'Ambiance', 'q.era': 'Époque / Décennie', 'q.rating': 'Classification d\'âge',
    'q.submit': '⚡ Consulter le concierge IA',
    'opt.surprise': '✨ Surprenez-moi', 'opt.anyplatform': 'Toute plateforme', 'opt.anyplatformhas': 'Toute plateforme qui le propose',
    'opt.anymood': 'Toute humeur', 'opt.anyvibe': 'Toute ambiance', 'opt.anyera': 'Toute époque (1920 – aujourd\'hui)', 'opt.anyrating': 'Toute classification',
    'res.streamnow': '▶ Regarder maintenant', 'res.listennow': '🎧 Écouter maintenant', 'res.findwhere': '▶ Voir où le regarder',
    'res.trailer': '🎬 Bande-annonce et aperçu',
    'res.nopreview': 'Aucun aperçu disponible pour ce titre. Regardez la bande-annonce officielle sur YouTube :',
    'res.ytsearch': '▶ Chercher sur YouTube', 'res.ytmore': '▶ Plus de bandes-annonces sur YouTube', 'res.applestore': '🍎 Voir sur l\'Apple Store',
    'res.watchlater': '⭐ À voir plus tard', 'res.listenlater': '🎧 À écouter plus tard',
    'res.seenit': '👁️ Déjà vu', 'res.heardit': '🎼 Déjà écouté',
    'res.loved': '👍 J\'ai adoré', 'res.notforme': '👎 Pas pour moi',
    'rematch.title': '👎 Compris !', 'rematch.same': '⚡ Relancer — mêmes choix',
    'rematch.change': '🎛️ Modifier mes choix d\'abord', 'rematch.close': 'Fermer',
    'loading.title': 'Consultation du concierge IA...',
    'footer.movies': '🎬 Plateformes films et séries', 'footer.regional': '🌎 Telenovelas, K-Drama et Anime',
    'footer.audio': '🎧 Podcasts, playlists, singles et audio', 'footer.find': '🔍 Trouvez où regarder n\'importe quoi',
    'footer.popular': 'Recherches populaires sur MatchApp',
    'lang.label': 'Langue'
  },
  'de': {
    'search.heading': 'Suchen oder fragen Sie alles', 'search.hint': 'Geben Sie einen Titel für die Direktsuche ein — oder stellen Sie eine ganze Frage, und unsere KI findet alle passenden Titel.', 'search.trythese': 'Probieren Sie:',
    'nav.signin': '👤 Anmelden / Registrieren', 'nav.profile': '👤 Profil', 'nav.logout': 'Abmelden',
    'chrome.notice': 'Für das beste Erlebnis in Google Chrome öffnen',
    'marquee.title': '🔥 Weltweit angesagte Blockbuster',
    'search.heading': 'Beliebigen Titel direkt suchen',
    'search.placeholder': 'Film, Serie, Drama oder Podcast eingeben...',
    'search.button': '🔍 Suchen',
    'how.title': 'So funktioniert MatchApp',
    'how.intro': 'MatchApp ist Ihr <strong>Premium-KI-Streaming-Concierge</strong>. Statt vierzig Minuten durch drei Apps zu scrollen, sagen Sie uns Ihre Stimmung — unsere KI findet den einen Titel, der Ihren Abend wert ist, und genau wo er läuft. Das dauert etwa <strong>15 Sekunden</strong>.',
    'how.s1.title': 'Stimmung wählen', 'how.s1.body': 'Wählen Sie Format, Plattform, Stimmung, Epoche und Altersfreigabe. Jede Wahl filtert die nächste automatisch — oder tippen Sie auf <em>Überrasch mich</em> und lassen Sie die KI alles entscheiden.',
    'how.s2.title': 'Match erhalten', 'how.s2.body': 'Unsere KI liefert eine perfekte Empfehlung mit echtem Cover, abspielbarem Trailer und Inhaltsangabe — aus Filmen, Serien, K-Dramas, Anime, Telenovelas, Mikrodramen, Podcasts und Spotify.',
    'how.s3.title': 'Sofort ansehen', 'how.s3.body': 'Ein Tippen öffnet ihn auf Netflix, Prime, Max, Disney+, Spotify oder wo immer er läuft. Auf die Merkliste setzen oder <em>Nichts für mich</em> tippen — wir finden sofort einen anderen.',
    'how.cta': '⚡ Mein Match finden — kostenlos',
    'how.freeline': '3 kostenlose Matches täglich · Kostenlos registrieren für 5 · Keine Kreditkarte nötig',
    'q.title': 'Stellen Sie Ihr perfektes Match zusammen',
    'q.category': 'Kategorie / Format', 'q.platform': 'Plattform', 'q.mood': 'Stimmung',
    'q.vibe': 'Vibe', 'q.era': 'Epoche / Jahrzehnt', 'q.rating': 'Altersfreigabe',
    'q.submit': '⚡ KI-Concierge fragen',
    'opt.surprise': '✨ Überrasch mich', 'opt.anyplatform': 'Beliebige Plattform', 'opt.anyplatformhas': 'Jede Plattform, die es hat',
    'opt.anymood': 'Beliebige Stimmung', 'opt.anyvibe': 'Beliebiger Vibe', 'opt.anyera': 'Beliebige Epoche (1920 – heute)', 'opt.anyrating': 'Beliebige Freigabe',
    'res.streamnow': '▶ Jetzt ansehen', 'res.listennow': '🎧 Jetzt anhören', 'res.findwhere': '▶ Finden, wo es läuft',
    'res.trailer': '🎬 Trailer & Vorschau',
    'res.nopreview': 'Für diesen Titel ist keine Vorschau verfügbar. Sehen Sie den offiziellen Trailer auf YouTube:',
    'res.ytsearch': '▶ Auf YouTube suchen', 'res.ytmore': '▶ Mehr Trailer auf YouTube', 'res.applestore': '🍎 Im Apple Store ansehen',
    'res.watchlater': '⭐ Später ansehen', 'res.listenlater': '🎧 Später anhören',
    'res.seenit': '👁️ Schon gesehen', 'res.heardit': '🎼 Schon gehört',
    'res.loved': '👍 Großartig', 'res.notforme': '👎 Nichts für mich',
    'rematch.title': '👎 Verstanden!', 'rematch.same': '⚡ Neues Match — gleiche Auswahl',
    'rematch.change': '🎛️ Erst Auswahl ändern', 'rematch.close': 'Schließen',
    'loading.title': 'KI-Concierge wird befragt...',
    'footer.movies': '🎬 Film- & TV-Plattformen', 'footer.regional': '🌎 Telenovelas, K-Drama & Anime',
    'footer.audio': '🎧 Podcasts, Playlists, Singles & Audio', 'footer.find': '🔍 Finden Sie, wo alles läuft',
    'footer.popular': 'Beliebte Suchen auf MatchApp',
    'lang.label': 'Sprache'
  },
  'it': {
    'search.heading': 'Cerca o chiedi qualsiasi cosa', 'search.hint': 'Digita un titolo per la ricerca diretta — oppure fai una domanda completa e la nostra IA troverà tutti i titoli adatti.', 'search.trythese': 'Prova:',
    'nav.signin': '👤 Accedi / Registrati', 'nav.profile': '👤 Profilo', 'nav.logout': 'Esci',
    'chrome.notice': 'Apri su Google Chrome per la migliore esperienza',
    'marquee.title': '🔥 Blockbuster di tendenza nel mondo',
    'search.heading': 'Cerca qualsiasi titolo direttamente',
    'search.placeholder': 'Digita un film, una serie, un drama o un podcast...',
    'search.button': '🔍 Cerca',
    'how.title': 'Come funziona MatchApp',
    'how.intro': 'MatchApp è il tuo <strong>concierge premium di streaming con IA</strong>. Invece di scorrere tre app per quaranta minuti, dicci di che umore sei e la nostra IA trova il titolo che vale la tua serata — e dove guardarlo esattamente. Ci vogliono circa <strong>15 secondi</strong>.',
    'how.s1.title': 'Scegli il tuo umore', 'how.s1.body': 'Seleziona formato, piattaforma, umore, epoca e classificazione. Ogni scelta filtra la successiva automaticamente — oppure tocca <em>Sorprendimi</em> e lascia decidere tutto all\'IA.',
    'how.s2.title': 'Ricevi il tuo match', 'how.s2.body': 'La nostra IA restituisce una scelta perfetta con la copertina reale, un trailer riproducibile e una sinossi — tra film, serie, K-drama, anime, telenovelas, microdrammi, podcast e Spotify.',
    'how.s3.title': 'Guardalo subito', 'how.s3.body': 'Un tocco lo apre su Netflix, Prime, Max, Disney+, Spotify o dove si trova. Salvalo in Guarda dopo, oppure tocca <em>Non fa per me</em> e ne troviamo subito un altro.',
    'how.cta': '⚡ Trova il mio match — è gratis',
    'how.freeline': '3 match gratuiti al giorno · Registrati gratis per averne 5 · Nessuna carta richiesta',
    'q.title': 'Costruisci il tuo match perfetto',
    'q.category': 'Categoria / Formato', 'q.platform': 'Piattaforma', 'q.mood': 'Umore',
    'q.vibe': 'Atmosfera', 'q.era': 'Epoca / Decennio', 'q.rating': 'Classificazione per età',
    'q.submit': '⚡ Consulta il concierge IA',
    'opt.surprise': '✨ Sorprendimi', 'opt.anyplatform': 'Qualsiasi piattaforma', 'opt.anyplatformhas': 'Qualsiasi piattaforma che ce l\'abbia',
    'opt.anymood': 'Qualsiasi umore', 'opt.anyvibe': 'Qualsiasi atmosfera', 'opt.anyera': 'Qualsiasi epoca (1920 – oggi)', 'opt.anyrating': 'Qualsiasi classificazione',
    'res.streamnow': '▶ Guarda ora', 'res.listennow': '🎧 Ascolta ora', 'res.findwhere': '▶ Scopri dove guardarlo',
    'res.trailer': '🎬 Trailer e anteprima',
    'res.nopreview': 'Nessuna anteprima disponibile per questo titolo. Guarda il trailer ufficiale su YouTube:',
    'res.ytsearch': '▶ Cerca su YouTube', 'res.ytmore': '▶ Altri trailer su YouTube', 'res.applestore': '🍎 Vedi su Apple Store',
    'res.watchlater': '⭐ Guarda dopo', 'res.listenlater': '🎧 Ascolta dopo',
    'res.seenit': '👁️ Già visto', 'res.heardit': '🎼 Già ascoltato',
    'res.loved': '👍 Adorato', 'res.notforme': '👎 Non fa per me',
    'rematch.title': '👎 Capito!', 'rematch.same': '⚡ Nuovo match — stesse scelte',
    'rematch.change': '🎛️ Cambia prima le mie scelte', 'rematch.close': 'Chiudi',
    'loading.title': 'Consultazione del concierge IA...',
    'footer.movies': '🎬 Piattaforme film e TV', 'footer.regional': '🌎 Telenovelas, K-Drama e Anime',
    'footer.audio': '🎧 Podcast, playlist, singoli e audio', 'footer.find': '🔍 Scopri dove guardare qualsiasi cosa',
    'footer.popular': 'Ricerche popolari su MatchApp',
    'lang.label': 'Lingua'
  },
  'tr': {
    'search.heading': 'Arayın ya da her şeyi sorun', 'search.hint': 'Doğrudan arama için bir başlık yazın — ya da tam bir soru sorun, yapay zekâmız uyan tüm yapımları bulsun.', 'search.trythese': 'Deneyin:',
    'nav.signin': '👤 Giriş / Kayıt', 'nav.profile': '👤 Profil', 'nav.logout': 'Çıkış',
    'chrome.notice': 'En iyi deneyim için Google Chrome\'da açın',
    'marquee.title': '🔥 Dünya çapında trend yapımlar',
    'search.heading': 'Herhangi bir yapımı doğrudan ara',
    'search.placeholder': 'Film, dizi, drama veya podcast yazın...',
    'search.button': '🔍 Ara',
    'how.title': 'MatchApp nasıl çalışır',
    'how.intro': 'MatchApp, <strong>yapay zekâ destekli premium yayın rehberinizdir</strong>. Kırk dakika boyunca üç uygulamada gezinmek yerine, ne izlemek istediğinizi söyleyin; yapay zekâmız gecenize değecek tek yapımı ve tam olarak nerede izleyeceğinizi bulsun. Yaklaşık <strong>15 saniye</strong> sürer.',
    'how.s1.title': 'Ruh halinizi seçin', 'how.s1.body': 'Format, platform, ruh hali, dönem ve yaş sınırı seçin. Her seçim bir sonrakini otomatik daraltır — ya da <em>Beni şaşırt</em>\'a dokunun, her şeye yapay zekâ karar versin.',
    'how.s2.title': 'Eşleşmenizi alın', 'how.s2.body': 'Yapay zekâmız gerçek kapak görseli, oynatılabilir fragman ve özet ile mükemmel bir öneri sunar — filmler, diziler, K-dramalar, animeler, telenovelalar, mikro dramalar, podcastler ve Spotify arasından.',
    'how.s3.title': 'Hemen izleyin', 'how.s3.body': 'Tek dokunuşla Netflix, Prime, Max, Disney+, Spotify veya nerede yayındaysa açılır. Sonra İzle listesine kaydedin ya da <em>Bana göre değil</em>\'e dokunun, anında başka bir öneri bulalım.',
    'how.cta': '⚡ Eşleşmemi bul — ücretsiz',
    'how.freeline': 'Günde 3 ücretsiz eşleşme · Ücretsiz kayıt olun, 5 olsun · Kredi kartı gerekmez',
    'q.title': 'Mükemmel eşleşmenizi oluşturun',
    'q.category': 'Kategori / Format', 'q.platform': 'Platform', 'q.mood': 'Ruh hali',
    'q.vibe': 'Tarz', 'q.era': 'Dönem / On yıl', 'q.rating': 'Yaş uygunluğu',
    'q.submit': '⚡ Yapay zekâ rehberine danış',
    'opt.surprise': '✨ Beni şaşırt', 'opt.anyplatform': 'Herhangi bir platform', 'opt.anyplatformhas': 'Bulunduğu herhangi bir platform',
    'opt.anymood': 'Herhangi bir ruh hali', 'opt.anyvibe': 'Herhangi bir tarz', 'opt.anyera': 'Herhangi bir dönem (1920 – bugün)', 'opt.anyrating': 'Herhangi bir sınır',
    'res.streamnow': '▶ Şimdi izle', 'res.listennow': '🎧 Şimdi dinle', 'res.findwhere': '▶ Nerede izleneceğini bul',
    'res.trailer': '🎬 Fragman ve önizleme',
    'res.nopreview': 'Bu yapım için önizleme yok. Resmi fragmanı YouTube\'da izleyin:',
    'res.ytsearch': '▶ YouTube\'da ara', 'res.ytmore': '▶ YouTube\'da daha fazla fragman', 'res.applestore': '🍎 Apple Store\'da gör',
    'res.watchlater': '⭐ Sonra izle', 'res.listenlater': '🎧 Sonra dinle',
    'res.seenit': '👁️ İzledim', 'res.heardit': '🎼 Dinledim',
    'res.loved': '👍 Bayıldım', 'res.notforme': '👎 Bana göre değil',
    'rematch.title': '👎 Anlaşıldı!', 'rematch.same': '⚡ Tekrar eşleştir — aynı seçimler',
    'rematch.change': '🎛️ Önce seçimlerimi değiştir', 'rematch.close': 'Kapat',
    'loading.title': 'Yapay zekâ rehberine danışılıyor...',
    'footer.movies': '🎬 Film ve dizi platformları', 'footer.regional': '🌎 Telenovela, K-Drama ve Anime',
    'footer.audio': '🎧 Podcast, çalma listesi, single ve ses', 'footer.find': '🔍 Her şeyin nerede olduğunu bulun',
    'footer.popular': 'MatchApp\'te popüler aramalar',
    'lang.label': 'Dil'
  },
  'ru': {
    'search.heading': 'Найдите или спросите что угодно', 'search.hint': 'Введите название для прямого поиска — или задайте полный вопрос, и наш ИИ найдёт все подходящие варианты.', 'search.trythese': 'Попробуйте:',
    'nav.signin': '👤 Войти / Регистрация', 'nav.profile': '👤 Профиль', 'nav.logout': 'Выйти',
    'chrome.notice': 'Откройте в Google Chrome для лучшего впечатления',
    'marquee.title': '🔥 Мировые хиты в тренде',
    'search.heading': 'Найти любое название напрямую',
    'search.placeholder': 'Введите фильм, сериал, дораму или подкаст...',
    'search.button': '🔍 Поиск',
    'how.title': 'Как работает MatchApp',
    'how.intro': 'MatchApp — ваш <strong>премиальный ИИ-консьерж по стримингу</strong>. Вместо сорока минут пролистывания трёх приложений просто скажите, чего вам хочется, и наш ИИ найдёт то самое название, достойное вашего вечера, — и точное место просмотра. Это занимает около <strong>15 секунд</strong>.',
    'how.s1.title': 'Задайте настроение', 'how.s1.body': 'Выберите формат, платформу, настроение, эпоху и возрастной рейтинг. Каждый выбор автоматически сужает следующий — или нажмите <em>Удиви меня</em>, и ИИ решит всё сам.',
    'how.s2.title': 'Получите совпадение', 'how.s2.body': 'Наш ИИ выдаёт одну идеальную рекомендацию с настоящей обложкой, воспроизводимым трейлером и описанием — из фильмов, сериалов, дорам, аниме, теленовелл, микродрам, подкастов и Spotify.',
    'how.s3.title': 'Смотрите сразу', 'how.s3.body': 'Одно нажатие открывает его в Netflix, Prime, Max, Disney+, Spotify или где он доступен. Сохраните в «Посмотреть позже» или нажмите <em>Не моё</em> — мы мгновенно найдём другое.',
    'how.cta': '⚡ Найти совпадение — бесплатно',
    'how.freeline': '3 бесплатных совпадения в день · Бесплатная регистрация — 5 · Без банковской карты',
    'q.title': 'Соберите идеальное совпадение',
    'q.category': 'Категория / Формат', 'q.platform': 'Платформа', 'q.mood': 'Настроение',
    'q.vibe': 'Атмосфера', 'q.era': 'Эпоха / Десятилетие', 'q.rating': 'Возрастной рейтинг',
    'q.submit': '⚡ Спросить ИИ-консьержа',
    'opt.surprise': '✨ Удиви меня', 'opt.anyplatform': 'Любая платформа', 'opt.anyplatformhas': 'Любая платформа, где это есть',
    'opt.anymood': 'Любое настроение', 'opt.anyvibe': 'Любая атмосфера', 'opt.anyera': 'Любая эпоха (1920 – сегодня)', 'opt.anyrating': 'Любой рейтинг',
    'res.streamnow': '▶ Смотреть сейчас', 'res.listennow': '🎧 Слушать сейчас', 'res.findwhere': '▶ Найти, где смотреть',
    'res.trailer': '🎬 Трейлер и превью',
    'res.nopreview': 'Превью для этого названия недоступно. Смотрите официальный трейлер на YouTube:',
    'res.ytsearch': '▶ Искать на YouTube', 'res.ytmore': '▶ Больше трейлеров на YouTube', 'res.applestore': '🍎 Открыть в Apple Store',
    'res.watchlater': '⭐ Посмотреть позже', 'res.listenlater': '🎧 Послушать позже',
    'res.seenit': '👁️ Уже смотрел', 'res.heardit': '🎼 Уже слушал',
    'res.loved': '👍 Отлично', 'res.notforme': '👎 Не моё',
    'rematch.title': '👎 Понятно!', 'rematch.same': '⚡ Ещё раз — те же настройки',
    'rematch.change': '🎛️ Сначала изменить настройки', 'rematch.close': 'Закрыть',
    'loading.title': 'Обращаемся к ИИ-консьержу...',
    'footer.movies': '🎬 Платформы кино и сериалов', 'footer.regional': '🌎 Теленовеллы, дорамы и аниме',
    'footer.audio': '🎧 Подкасты, плейлисты, синглы и аудио', 'footer.find': '🔍 Найдите, где смотреть что угодно',
    'footer.popular': 'Популярные запросы в MatchApp',
    'lang.label': 'Язык'
  },
  'ar': {
    'search.heading': 'ابحث أو اسأل عن أي شيء', 'search.hint': 'اكتب عنوانًا للبحث المباشر — أو اطرح سؤالًا كاملًا وسيجد الذكاء الاصطناعي كل الأعمال المناسبة.', 'search.trythese': 'جرّب:',
    'nav.signin': '👤 تسجيل الدخول / التسجيل', 'nav.profile': '👤 الملف الشخصي', 'nav.logout': 'تسجيل الخروج',
    'chrome.notice': 'افتح في Google Chrome للحصول على أفضل تجربة',
    'marquee.title': '🔥 الأعمال الرائجة حول العالم',
    'search.heading': 'ابحث عن أي عمل مباشرة',
    'search.placeholder': 'اكتب فيلمًا أو مسلسلًا أو دراما أو بودكاست...',
    'search.button': '🔍 بحث',
    'how.title': 'كيف يعمل MatchApp',
    'how.intro': 'MatchApp هو <strong>مساعدك المتميز للبث بالذكاء الاصطناعي</strong>. بدلًا من تصفح ثلاثة تطبيقات لأربعين دقيقة، أخبرنا بمزاجك وسيجد الذكاء الاصطناعي العمل الوحيد الذي يستحق ليلتك — ومكان مشاهدته بالضبط. يستغرق الأمر حوالي <strong>15 ثانية</strong>.',
    'how.s1.title': 'حدد مزاجك', 'how.s1.body': 'اختر النوع والمنصة والمزاج والحقبة والتصنيف العمري. كل اختيار يضيّق التالي تلقائيًا — أو اضغط <em>فاجئني</em> ودع الذكاء الاصطناعي يقرر كل شيء.',
    'how.s2.title': 'احصل على توصيتك', 'how.s2.body': 'يعيد الذكاء الاصطناعي توصية مثالية واحدة مع الغلاف الحقيقي ومقطع دعائي قابل للتشغيل وملخص — من الأفلام والمسلسلات والدراما الكورية والأنمي والتيلينوفيلا والدراما القصيرة والبودكاست وSpotify.',
    'how.s3.title': 'شاهده فورًا', 'how.s3.body': 'ضغطة واحدة تفتحه على Netflix أو Prime أو Max أو Disney+ أو Spotify أو أينما كان. احفظه في المشاهدة لاحقًا، أو اضغط <em>ليس لي</em> وسنجد لك غيره فورًا.',
    'how.cta': '⚡ اعثر على توصيتي — مجانًا',
    'how.freeline': '٣ توصيات مجانية يوميًا · سجّل مجانًا واحصل على ٥ · بدون بطاقة ائتمان',
    'q.title': 'اصنع توصيتك المثالية',
    'q.category': 'الفئة / النوع', 'q.platform': 'المنصة', 'q.mood': 'المزاج',
    'q.vibe': 'الأجواء', 'q.era': 'الحقبة / العقد', 'q.rating': 'التصنيف العمري',
    'q.submit': '⚡ استشر مساعد الذكاء الاصطناعي',
    'opt.surprise': '✨ فاجئني', 'opt.anyplatform': 'أي منصة', 'opt.anyplatformhas': 'أي منصة تعرضه',
    'opt.anymood': 'أي مزاج', 'opt.anyvibe': 'أي أجواء', 'opt.anyera': 'أي حقبة (1920 – اليوم)', 'opt.anyrating': 'أي تصنيف',
    'res.streamnow': '▶ شاهد الآن', 'res.listennow': '🎧 استمع الآن', 'res.findwhere': '▶ اعرف أين تشاهده',
    'res.trailer': '🎬 المقطع الدعائي والمعاينة',
    'res.nopreview': 'لا تتوفر معاينة لهذا العمل. شاهد المقطع الدعائي الرسمي على YouTube:',
    'res.ytsearch': '▶ ابحث على YouTube', 'res.ytmore': '▶ مقاطع دعائية أخرى على YouTube', 'res.applestore': '🍎 اعرضه على Apple Store',
    'res.watchlater': '⭐ شاهد لاحقًا', 'res.listenlater': '🎧 استمع لاحقًا',
    'res.seenit': '👁️ شاهدته', 'res.heardit': '🎼 سمعته',
    'res.loved': '👍 أعجبني', 'res.notforme': '👎 ليس لي',
    'rematch.title': '👎 تم!', 'rematch.same': '⚡ توصية أخرى — نفس الاختيارات',
    'rematch.change': '🎛️ غيّر اختياراتي أولًا', 'rematch.close': 'إغلاق',
    'loading.title': 'جارٍ استشارة مساعد الذكاء الاصطناعي...',
    'footer.movies': '🎬 منصات الأفلام والمسلسلات', 'footer.regional': '🌎 التيلينوفيلا والدراما الكورية والأنمي',
    'footer.audio': '🎧 البودكاست وقوائم التشغيل والأغاني والصوتيات', 'footer.find': '🔍 اعرف أين تشاهد أي شيء',
    'footer.popular': 'عمليات البحث الشائعة على MatchApp',
    'lang.label': 'اللغة'
  },
  'hi': {
    'search.heading': 'खोजें या कुछ भी पूछें', 'search.hint': 'सीधी खोज के लिए टाइटल टाइप करें — या पूरा सवाल पूछें और हमारा AI हर मिलता-जुलता टाइटल ढूंढ़ेगा।', 'search.trythese': 'आज़माएं:',
    'nav.signin': '👤 साइन इन / जुड़ें', 'nav.profile': '👤 प्रोफ़ाइल', 'nav.logout': 'लॉग आउट',
    'chrome.notice': 'बेहतरीन अनुभव के लिए Google Chrome में खोलें',
    'marquee.title': '🔥 दुनिया भर में ट्रेंडिंग ब्लॉकबस्टर',
    'search.heading': 'कोई भी टाइटल सीधे खोजें',
    'search.placeholder': 'फ़िल्म, सीरीज़, ड्रामा या पॉडकास्ट टाइप करें...',
    'search.button': '🔍 खोजें',
    'how.title': 'MatchApp कैसे काम करता है',
    'how.intro': 'MatchApp आपका <strong>प्रीमियम AI स्ट्रीमिंग कंसीयज</strong> है। चालीस मिनट तक तीन ऐप्स स्क्रॉल करने के बजाय, हमें बताएं कि आपका मूड क्या है — हमारा AI आपकी शाम के लायक वह एक टाइटल ढूंढ़ेगा, और यह भी कि उसे कहाँ देखना है। इसमें लगभग <strong>15 सेकंड</strong> लगते हैं।',
    'how.s1.title': 'अपना मूड चुनें', 'how.s1.body': 'फ़ॉर्मेट, प्लेटफ़ॉर्म, मूड, दौर और आयु रेटिंग चुनें। हर चुनाव अगले को अपने आप सीमित करता है — या <em>मुझे चौंकाएं</em> दबाएं और AI को सब तय करने दें।',
    'how.s2.title': 'अपना मैच पाएं', 'how.s2.body': 'हमारा AI असली कवर, चलने वाला ट्रेलर और सारांश के साथ एक बेहतरीन सुझाव देता है — फ़िल्मों, सीरीज़, के-ड्रामा, एनीमे, टेलीनोवेला, माइक्रो-ड्रामा, पॉडकास्ट और Spotify से।',
    'how.s3.title': 'तुरंत देखें', 'how.s3.body': 'एक टैप इसे Netflix, Prime, Max, Disney+, Spotify या जहाँ भी उपलब्ध है, खोल देता है। बाद में देखें में सहेजें, या <em>मेरे लिए नहीं</em> दबाएं और हम तुरंत दूसरा ढूंढ देंगे।',
    'how.cta': '⚡ मेरा मैच खोजें — मुफ़्त',
    'how.freeline': 'रोज़ 3 मुफ़्त मैच · मुफ़्त रजिस्टर करें और 5 पाएं · क्रेडिट कार्ड की ज़रूरत नहीं',
    'q.title': 'अपना बेहतरीन मैच बनाएं',
    'q.category': 'श्रेणी / फ़ॉर्मेट', 'q.platform': 'प्लेटफ़ॉर्म', 'q.mood': 'मूड',
    'q.vibe': 'वाइब', 'q.era': 'दौर / दशक', 'q.rating': 'आयु उपयुक्तता',
    'q.submit': '⚡ AI कंसीयज से पूछें',
    'opt.surprise': '✨ मुझे चौंकाएं', 'opt.anyplatform': 'कोई भी प्लेटफ़ॉर्म', 'opt.anyplatformhas': 'कोई भी प्लेटफ़ॉर्म जहाँ यह हो',
    'opt.anymood': 'कोई भी मूड', 'opt.anyvibe': 'कोई भी वाइब', 'opt.anyera': 'कोई भी दौर (1920 – आज)', 'opt.anyrating': 'कोई भी रेटिंग',
    'res.streamnow': '▶ अभी देखें', 'res.listennow': '🎧 अभी सुनें', 'res.findwhere': '▶ देखें कहाँ उपलब्ध है',
    'res.trailer': '🎬 ट्रेलर और झलक',
    'res.nopreview': 'इस टाइटल के लिए कोई झलक उपलब्ध नहीं है। YouTube पर आधिकारिक ट्रेलर देखें:',
    'res.ytsearch': '▶ YouTube पर खोजें', 'res.ytmore': '▶ YouTube पर और ट्रेलर', 'res.applestore': '🍎 Apple Store पर देखें',
    'res.watchlater': '⭐ बाद में देखें', 'res.listenlater': '🎧 बाद में सुनें',
    'res.seenit': '👁️ देख चुका हूँ', 'res.heardit': '🎼 सुन चुका हूँ',
    'res.loved': '👍 बहुत पसंद आया', 'res.notforme': '👎 मेरे लिए नहीं',
    'rematch.title': '👎 समझ गए!', 'rematch.same': '⚡ फिर से मैच — वही विकल्प',
    'rematch.change': '🎛️ पहले विकल्प बदलें', 'rematch.close': 'बंद करें',
    'loading.title': 'AI कंसीयज से परामर्श हो रहा है...',
    'footer.movies': '🎬 फ़िल्म और टीवी प्लेटफ़ॉर्म', 'footer.regional': '🌎 टेलीनोवेला, के-ड्रामा और एनीमे',
    'footer.audio': '🎧 पॉडकास्ट, प्लेलिस्ट, सिंगल्स और ऑडियो', 'footer.find': '🔍 पता करें कुछ भी कहाँ देखें',
    'footer.popular': 'MatchApp पर लोकप्रिय खोजें',
    'lang.label': 'भाषा'
  },
  'id': {
    'search.heading': 'Cari atau tanyakan apa saja', 'search.hint': 'Ketik judul untuk pencarian langsung — atau ajukan pertanyaan lengkap dan AI kami akan menemukan semua judul yang cocok.', 'search.trythese': 'Coba:',
    'nav.signin': '👤 Masuk / Daftar', 'nav.profile': '👤 Profil', 'nav.logout': 'Keluar',
    'chrome.notice': 'Buka di Google Chrome untuk pengalaman terbaik',
    'marquee.title': '🔥 Blockbuster yang sedang tren di dunia',
    'search.heading': 'Cari judul apa pun secara langsung',
    'search.placeholder': 'Ketik film, serial, drama, atau podcast...',
    'search.button': '🔍 Cari',
    'how.title': 'Cara kerja MatchApp',
    'how.intro': 'MatchApp adalah <strong>concierge streaming premium bertenaga AI</strong> Anda. Alih-alih menggulir tiga aplikasi selama empat puluh menit, katakan suasana hati Anda dan AI kami akan menemukan satu judul yang layak untuk malam Anda — beserta tempat menontonnya. Hanya butuh sekitar <strong>15 detik</strong>.',
    'how.s1.title': 'Tentukan suasana', 'how.s1.body': 'Pilih format, platform, suasana, era, dan rating usia. Setiap pilihan otomatis menyaring pilihan berikutnya — atau tekan <em>Kejutkan saya</em> dan biarkan AI memutuskan semuanya.',
    'how.s2.title': 'Dapatkan rekomendasi', 'how.s2.body': 'AI kami memberi satu pilihan sempurna lengkap dengan sampul asli, trailer yang bisa diputar, dan sinopsis — dari film, serial, K-drama, anime, telenovela, drama mikro, podcast, dan Spotify.',
    'how.s3.title': 'Tonton seketika', 'how.s3.body': 'Satu ketukan membukanya di Netflix, Prime, Max, Disney+, Spotify, atau di mana pun tersedia. Simpan ke Tonton Nanti, atau tekan <em>Bukan untuk saya</em> dan kami langsung mencari yang lain.',
    'how.cta': '⚡ Temukan rekomendasi saya — gratis',
    'how.freeline': '3 rekomendasi gratis per hari · Daftar gratis untuk 5 · Tanpa kartu kredit',
    'q.title': 'Susun rekomendasi sempurna Anda',
    'q.category': 'Kategori / Format', 'q.platform': 'Platform', 'q.mood': 'Suasana',
    'q.vibe': 'Nuansa', 'q.era': 'Era / Dekade', 'q.rating': 'Kesesuaian usia',
    'q.submit': '⚡ Konsultasi dengan concierge AI',
    'opt.surprise': '✨ Kejutkan saya', 'opt.anyplatform': 'Platform apa pun', 'opt.anyplatformhas': 'Platform mana pun yang punya',
    'opt.anymood': 'Suasana apa pun', 'opt.anyvibe': 'Nuansa apa pun', 'opt.anyera': 'Era apa pun (1920 – sekarang)', 'opt.anyrating': 'Rating apa pun',
    'res.streamnow': '▶ Tonton sekarang', 'res.listennow': '🎧 Dengarkan sekarang', 'res.findwhere': '▶ Cari tempat menontonnya',
    'res.trailer': '🎬 Trailer & pratinjau',
    'res.nopreview': 'Tidak ada pratinjau untuk judul ini. Tonton trailer resminya di YouTube:',
    'res.ytsearch': '▶ Cari di YouTube', 'res.ytmore': '▶ Trailer lain di YouTube', 'res.applestore': '🍎 Lihat di Apple Store',
    'res.watchlater': '⭐ Tonton nanti', 'res.listenlater': '🎧 Dengarkan nanti',
    'res.seenit': '👁️ Sudah ditonton', 'res.heardit': '🎼 Sudah didengar',
    'res.loved': '👍 Suka sekali', 'res.notforme': '👎 Bukan untuk saya',
    'rematch.title': '👎 Dicatat!', 'rematch.same': '⚡ Cari lagi — pilihan sama',
    'rematch.change': '🎛️ Ubah pilihan saya dulu', 'rematch.close': 'Tutup',
    'loading.title': 'Menghubungi concierge AI...',
    'footer.movies': '🎬 Platform film & TV', 'footer.regional': '🌎 Telenovela, K-Drama & Anime',
    'footer.audio': '🎧 Podcast, playlist, single & audio', 'footer.find': '🔍 Cari di mana menonton apa pun',
    'footer.popular': 'Pencarian populer di MatchApp',
    'lang.label': 'Bahasa'
  },
  'ja': {
    'search.heading': '検索、または何でも質問', 'search.hint': 'タイトルを入力すれば直接検索。文章で質問すれば、AI が該当する作品をすべて探します。', 'search.trythese': '例:',
    'nav.signin': '👤 ログイン / 登録', 'nav.profile': '👤 プロフィール', 'nav.logout': 'ログアウト',
    'chrome.notice': '最適な体験のため Google Chrome で開いてください',
    'marquee.title': '🔥 世界で話題の大ヒット作',
    'search.heading': 'タイトルを直接検索',
    'search.placeholder': '映画、ドラマ、シリーズ、ポッドキャストを入力...',
    'search.button': '🔍 検索',
    'how.title': 'MatchApp の使い方',
    'how.intro': 'MatchApp はあなたの<strong>プレミアム AI ストリーミング・コンシェルジュ</strong>です。3つのアプリを40分もスクロールする代わりに、今の気分を教えてください。AI が今夜にふさわしい1本と、その視聴先まで見つけます。所要時間は約<strong>15秒</strong>です。',
    'how.s1.title': '気分を選ぶ', 'how.s1.body': 'ジャンル、プラットフォーム、気分、年代、年齢区分を選択します。1つ選ぶと次の選択肢が自動的に絞り込まれます。<em>おまかせ</em>を押せば AI がすべて決定します。',
    'how.s2.title': 'マッチを受け取る', 'how.s2.body': 'AI が実際のカバーアート、再生可能な予告編、あらすじ付きで最適な1本を提示します。映画、シリーズ、韓国ドラマ、アニメ、テレノベラ、ショートドラマ、ポッドキャスト、Spotify から選出。',
    'how.s3.title': 'すぐに視聴', 'how.s3.body': 'ワンタップで Netflix、Prime、Max、Disney+、Spotify など配信先が開きます。「あとで見る」に保存するか、<em>好みではない</em>を押せばすぐ別の作品を提案します。',
    'how.cta': '⚡ マッチを見つける — 無料',
    'how.freeline': '1日3回まで無料 · 無料登録で5回に · クレジットカード不要',
    'q.title': '最高のマッチを組み立てる',
    'q.category': 'カテゴリー / 形式', 'q.platform': 'プラットフォーム', 'q.mood': '気分',
    'q.vibe': '雰囲気', 'q.era': '年代', 'q.rating': '年齢区分',
    'q.submit': '⚡ AI コンシェルジュに相談',
    'opt.surprise': '✨ おまかせ', 'opt.anyplatform': 'すべてのプラットフォーム', 'opt.anyplatformhas': '配信しているどこでも',
    'opt.anymood': 'すべての気分', 'opt.anyvibe': 'すべての雰囲気', 'opt.anyera': 'すべての年代（1920年〜現在）', 'opt.anyrating': 'すべての区分',
    'res.streamnow': '▶ 今すぐ視聴', 'res.listennow': '🎧 今すぐ再生', 'res.findwhere': '▶ 配信先を探す',
    'res.trailer': '🎬 予告編とプレビュー',
    'res.nopreview': 'この作品のプレビューはありません。YouTube で公式予告編をご覧ください：',
    'res.ytsearch': '▶ YouTube で検索', 'res.ytmore': '▶ YouTube でもっと見る', 'res.applestore': '🍎 Apple Store で見る',
    'res.watchlater': '⭐ あとで見る', 'res.listenlater': '🎧 あとで聴く',
    'res.seenit': '👁️ 視聴済み', 'res.heardit': '🎼 再生済み',
    'res.loved': '👍 great!', 'res.notforme': '👎 好みではない',
    'rematch.title': '👎 了解しました', 'rematch.same': '⚡ 同じ条件でもう一度',
    'rematch.change': '🎛️ 条件を変更する', 'rematch.close': '閉じる',
    'loading.title': 'AI コンシェルジュに問い合わせ中...',
    'footer.movies': '🎬 映画・TV プラットフォーム', 'footer.regional': '🌎 テレノベラ・韓国ドラマ・アニメ',
    'footer.audio': '🎧 ポッドキャスト・プレイリスト・シングル・音声', 'footer.find': '🔍 どこで見られるかを探す',
    'footer.popular': 'MatchApp の人気検索',
    'lang.label': '言語'
  },
  'ko': {
    'search.heading': '검색하거나 무엇이든 물어보세요', 'search.hint': '제목을 입력하면 바로 검색됩니다 — 문장으로 질문하면 AI가 어울리는 작품을 모두 찾아드립니다.', 'search.trythese': '예시:',
    'nav.signin': '👤 로그인 / 가입', 'nav.profile': '👤 프로필', 'nav.logout': '로그아웃',
    'chrome.notice': '최상의 경험을 위해 Google Chrome에서 열어보세요',
    'marquee.title': '🔥 전 세계 인기 대작',
    'search.heading': '작품을 직접 검색하세요',
    'search.placeholder': '영화, 시리즈, 드라마, 팟캐스트 입력...',
    'search.button': '🔍 검색',
    'how.title': 'MatchApp 이용 방법',
    'how.intro': 'MatchApp은 당신의 <strong>프리미엄 AI 스트리밍 컨시어지</strong>입니다. 앱 세 개를 40분씩 뒤질 필요 없이, 지금 기분만 알려주시면 AI가 오늘 밤에 어울리는 단 하나의 작품과 시청 가능한 곳까지 찾아드립니다. 약 <strong>15초</strong>면 충분합니다.',
    'how.s1.title': '기분 설정', 'how.s1.body': '장르, 플랫폼, 기분, 연대, 연령 등급을 선택하세요. 하나를 고르면 다음 항목이 자동으로 좁혀집니다. <em>알아서 골라줘</em>를 누르면 AI가 모두 결정합니다.',
    'how.s2.title': '매치 받기', 'how.s2.body': 'AI가 실제 커버 이미지, 재생 가능한 예고편, 줄거리와 함께 완벽한 추천 하나를 제시합니다. 영화, 시리즈, K-드라마, 애니메이션, 텔레노벨라, 숏드라마, 팟캐스트, Spotify에서 선정합니다.',
    'how.s3.title': '바로 시청', 'how.s3.body': '한 번만 누르면 Netflix, Prime, Max, Disney+, Spotify 등 제공처가 열립니다. 나중에 보기에 저장하거나 <em>취향이 아니에요</em>를 누르면 즉시 다른 작품을 찾아드립니다.',
    'how.cta': '⚡ 내 매치 찾기 — 무료',
    'how.freeline': '하루 3회 무료 · 무료 가입 시 5회 · 신용카드 불필요',
    'q.title': '완벽한 매치 만들기',
    'q.category': '카테고리 / 형식', 'q.platform': '플랫폼', 'q.mood': '기분',
    'q.vibe': '분위기', 'q.era': '연대', 'q.rating': '연령 등급',
    'q.submit': '⚡ AI 컨시어지에게 물어보기',
    'opt.surprise': '✨ 알아서 골라줘', 'opt.anyplatform': '모든 플랫폼', 'opt.anyplatformhas': '제공하는 모든 곳',
    'opt.anymood': '모든 기분', 'opt.anyvibe': '모든 분위기', 'opt.anyera': '모든 연대 (1920 – 현재)', 'opt.anyrating': '모든 등급',
    'res.streamnow': '▶ 지금 보기', 'res.listennow': '🎧 지금 듣기', 'res.findwhere': '▶ 볼 수 있는 곳 찾기',
    'res.trailer': '🎬 예고편 및 미리보기',
    'res.nopreview': '이 작품의 미리보기가 없습니다. YouTube에서 공식 예고편을 확인하세요:',
    'res.ytsearch': '▶ YouTube에서 검색', 'res.ytmore': '▶ YouTube에서 더 보기', 'res.applestore': '🍎 Apple Store에서 보기',
    'res.watchlater': '⭐ 나중에 보기', 'res.listenlater': '🎧 나중에 듣기',
    'res.seenit': '👁️ 이미 봤어요', 'res.heardit': '🎼 이미 들었어요',
    'res.loved': '👍 최고예요', 'res.notforme': '👎 취향이 아니에요',
    'rematch.title': '👎 알겠습니다!', 'rematch.same': '⚡ 같은 조건으로 다시',
    'rematch.change': '🎛️ 조건 먼저 바꾸기', 'rematch.close': '닫기',
    'loading.title': 'AI 컨시어지에게 문의 중...',
    'footer.movies': '🎬 영화 및 TV 플랫폼', 'footer.regional': '🌎 텔레노벨라, K-드라마, 애니메이션',
    'footer.audio': '🎧 팟캐스트, 플레이리스트, 싱글, 오디오', 'footer.find': '🔍 무엇이든 어디서 볼지 찾기',
    'footer.popular': 'MatchApp 인기 검색어',
    'lang.label': '언어'
  },
  'zh': {
    'search.heading': '搜索或随意提问', 'search.hint': '输入片名可直接搜索——或提出完整问题，AI 将找出所有符合的作品。', 'search.trythese': '试试：',
    'nav.signin': '👤 登录 / 注册', 'nav.profile': '👤 个人资料', 'nav.logout': '退出',
    'chrome.notice': '在 Google Chrome 中打开以获得最佳体验',
    'marquee.title': '🔥 全球热门大片',
    'search.heading': '直接搜索任意作品',
    'search.placeholder': '输入电影、剧集、短剧或播客...',
    'search.button': '🔍 搜索',
    'how.title': 'MatchApp 如何运作',
    'how.intro': 'MatchApp 是您的<strong>高级 AI 影音管家</strong>。无需在三个应用里翻找四十分钟，只要告诉我们此刻的心情，AI 就会找出值得您今晚观看的那一部，并告诉您在哪里看。整个过程约需 <strong>15 秒</strong>。',
    'how.s1.title': '设定心情', 'how.s1.body': '选择类型、平台、心情、年代和年龄分级。每选一项，后续选项会自动收窄——或点击<em>给我惊喜</em>，让 AI 全权决定。',
    'how.s2.title': '获取推荐', 'how.s2.body': 'AI 会提供一个完美推荐，附带真实封面、可播放预告片和剧情简介——涵盖电影、剧集、韩剧、动漫、电视小说、微短剧、播客和 Spotify。',
    'how.s3.title': '立即观看', 'how.s3.body': '一键即可在 Netflix、Prime、Max、Disney+、Spotify 或其所在平台打开。保存到稍后观看，或点击<em>不合我意</em>，我们立刻换一部。',
    'how.cta': '⚡ 找到我的推荐 — 免费',
    'how.freeline': '每天 3 次免费推荐 · 免费注册可得 5 次 · 无需信用卡',
    'q.title': '定制您的完美推荐',
    'q.category': '类别 / 格式', 'q.platform': '平台', 'q.mood': '心情',
    'q.vibe': '氛围', 'q.era': '年代', 'q.rating': '年龄分级',
    'q.submit': '⚡ 咨询 AI 管家',
    'opt.surprise': '✨ 给我惊喜', 'opt.anyplatform': '任意平台', 'opt.anyplatformhas': '任何可观看的平台',
    'opt.anymood': '任意心情', 'opt.anyvibe': '任意氛围', 'opt.anyera': '任意年代（1920 至今）', 'opt.anyrating': '任意分级',
    'res.streamnow': '▶ 立即观看', 'res.listennow': '🎧 立即收听', 'res.findwhere': '▶ 查找观看平台',
    'res.trailer': '🎬 预告片与预览',
    'res.nopreview': '该作品暂无预览片段。请在 YouTube 观看官方预告片：',
    'res.ytsearch': '▶ 在 YouTube 搜索', 'res.ytmore': '▶ 在 YouTube 查看更多预告', 'res.applestore': '🍎 在 Apple Store 查看',
    'res.watchlater': '⭐ 稍后观看', 'res.listenlater': '🎧 稍后收听',
    'res.seenit': '👁️ 已看过', 'res.heardit': '🎼 已听过',
    'res.loved': '👍 非常喜欢', 'res.notforme': '👎 不合我意',
    'rematch.title': '👎 明白了！', 'rematch.same': '⚡ 再来一次 — 相同条件',
    'rematch.change': '🎛️ 先修改我的选择', 'rematch.close': '关闭',
    'loading.title': '正在咨询 AI 管家...',
    'footer.movies': '🎬 影视平台', 'footer.regional': '🌎 电视小说、韩剧与动漫',
    'footer.audio': '🎧 播客、歌单、单曲与音频', 'footer.find': '🔍 查找任何内容的观看平台',
    'footer.popular': 'MatchApp 热门搜索',
    'lang.label': '语言'
  }
};

/* ---------- Detection ---------- */
function normalizeLang(tag) {
    if (!tag) return null;
    const t = tag.toLowerCase().replace('_', '-');
    // Portuguese: treat every variant as pt-BR (our authored Portuguese).
    if (t.startsWith('pt')) return 'pt-BR';
    // Chinese: all variants map to our simplified set.
    if (t.startsWith('zh')) return 'zh';
    if (t.startsWith('es')) return 'es';
    if (t.startsWith('ar')) return 'ar';
    const base = t.split('-')[0];
    if (I18N[t]) return t;
    if (I18N[base]) return base;
    return null;
}

function detectLanguage() {
    // 1. Explicit user override always wins.
    const saved = localStorage.getItem('match_lang');
    if (saved && I18N[saved]) return saved;

    // 2. ?lang= query parameter (useful for shared/localized links).
    try {
        const qp = new URLSearchParams(window.location.search).get('lang');
        const fromQuery = normalizeLang(qp);
        if (fromQuery) return fromQuery;
    } catch (e) {}

    // 3. Device languages, in the user's own priority order.
    const candidates = (navigator.languages && navigator.languages.length)
        ? navigator.languages : [navigator.language || navigator.userLanguage];
    for (const c of candidates) {
        const hit = normalizeLang(c);
        if (hit) return hit;
    }
    return 'en';
}

/* ---------- Application ---------- */
function t(key, lang) {
    const L = lang || window.MATCH_LANG || 'en';
    return (I18N[L] && I18N[L][key]) || I18N['en'][key] || '';
}
window.t = t;

function applyTranslations(lang) {
    const meta = I18N_LANGS[lang] || I18N_LANGS['en'];
    window.MATCH_LANG = lang;

    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', meta.dir);
    document.body && document.body.classList.toggle('rtl-mode', meta.dir === 'rtl');

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const val = t(el.getAttribute('data-i18n'), lang);
        if (val) el.textContent = val;
    });
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
        const val = t(el.getAttribute('data-i18n-html'), lang);
        if (val) el.innerHTML = val;
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const val = t(el.getAttribute('data-i18n-placeholder'), lang);
        if (val) el.setAttribute('placeholder', val);
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(el => {
        const val = t(el.getAttribute('data-i18n-aria'), lang);
        if (val) el.setAttribute('aria-label', val);
    });

    // Let other modules (result cards, cascading dropdowns) re-render in the new language.
    document.dispatchEvent(new CustomEvent('matchapp:langchange', { detail: { lang } }));
}

window.setLanguage = function(lang) {
    if (!I18N[lang]) return;
    localStorage.setItem('match_lang', lang);
    applyTranslations(lang);
    const sel = document.getElementById('lang-switcher');
    if (sel) sel.value = lang;
};

function buildLanguageSwitcher() {
    const host = document.getElementById('lang-switcher-host');
    if (!host) return;
    const sel = document.createElement('select');
    sel.id = 'lang-switcher';
    sel.setAttribute('aria-label', 'Language');
    sel.className = 'lang-switcher';
    Object.entries(I18N_LANGS).forEach(([code, meta]) => {
        const o = document.createElement('option');
        o.value = code;
        o.textContent = `${meta.flag} ${meta.name}`;
        sel.appendChild(o);
    });
    sel.value = window.MATCH_LANG || 'en';
    sel.addEventListener('change', e => window.setLanguage(e.target.value));
    host.appendChild(sel);
}

// Run as early as possible so users never see an English flash first.
(function initI18n() {
    const lang = detectLanguage();
    window.MATCH_LANG = lang;
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', (I18N_LANGS[lang] || I18N_LANGS['en']).dir);

    const boot = () => { applyTranslations(lang); buildLanguageSwitcher(); };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
})();

# Bourse Pro · Terminal personnel

Terminal de suivi boursier personnel pour investisseur buy-and-hold orienté tech. Construit avec Next.js 14, déployé sur Vercel, accessible depuis Mac et mobile.

## Fonctionnalités

- **Terminal principal** : KPIs portefeuille, positions live, opportunités détectées, news critiques, earnings à venir, événements macro
- **Ticker défilant infini** : indices US/EU, matières premières, taux, statut marché en temps réel
- **Portefeuille** : ajout/suppression positions, P/L en direct, allocation par poids
- **Screener fondamental** : univers tech de 30+ titres scorés sur ROIC, croissance, marges, P/E
- **Watchlist** : prix cibles avec alertes visuelles quand cours proche
- **Benchmark** : performance vs Nasdaq 100, S&P 500, MSCI World
- **Auth Google** restreinte à un email unique
- **Stockage local** : positions et watchlist en localStorage (pas de base de données à gérer)

## Stack technique

- Next.js 14 (App Router) + TypeScript
- NextAuth pour authentification Google
- Tailwind CSS
- Lucide React pour les icônes
- Graphiques SVG natifs (pas de dépendance graphique lourde)
- APIs : Finnhub + Twelve Data + Financial Modeling Prep (tous en free tier)

## Étapes de déploiement

### 1. Récupérer les clés API (15 min)

Crée tes comptes gratuits sur :

- **Finnhub** : https://finnhub.io/register → récupère ta clé sur le dashboard (60 req/min gratuit)
- **Twelve Data** : https://twelvedata.com/register → dashboard → API keys (800 req/jour gratuit)
- **Financial Modeling Prep** : https://site.financialmodelingprep.com/developer/docs → sign up → récupère la clé (250 req/jour gratuit)

### 2. Créer l'OAuth Google (10 min)

1. Va sur https://console.cloud.google.com/
2. Crée un nouveau projet "Bourse Pro"
3. APIs & Services → OAuth consent screen → External → remplis les champs minimums (nom app, email)
4. Dans "Scopes", ajoute `email` et `profile`
5. Dans "Test users", ajoute ton email Google
6. APIs & Services → Credentials → Create Credentials → OAuth Client ID
7. Type : Web application
8. Authorized redirect URIs : ajoute ces URIs (tu ajouteras la prod après le déploiement Vercel) :
   - `http://localhost:3000/api/auth/callback/google` (pour dev local)
   - `https://TON-APP.vercel.app/api/auth/callback/google` (à ajouter après déploiement)
9. Récupère le **CLIENT_ID** et le **CLIENT_SECRET**

### 3. Créer le repo GitHub (5 min)

```bash
cd ~/horae-projects/  # ou là où tu veux
# Copie le dossier bourse-pro-bazz ici
cd bourse-pro-bazz

git init
git add .
git commit -m "Initial commit: Bourse Pro V1"

# Crée le repo sur GitHub : https://github.com/new
# Nom : bourse-pro-bazz · Public · Sans README ni .gitignore

git remote add origin https://github.com/TON-USERNAME/bourse-pro-bazz.git
git branch -M main
git push -u origin main
```

### 4. Déployer sur Vercel (5 min)

1. Va sur https://vercel.com/new
2. Connecte ton compte GitHub
3. Importe le repo `bourse-pro-bazz`
4. Framework Preset : Next.js (auto-détecté)
5. Avant de cliquer "Deploy", expand **Environment Variables** et ajoute :

| Nom | Valeur |
|-----|--------|
| `FINNHUB_API_KEY` | ta clé Finnhub |
| `TWELVEDATA_API_KEY` | ta clé Twelve Data |
| `FMP_API_KEY` | ta clé FMP |
| `GOOGLE_CLIENT_ID` | ton client ID Google |
| `GOOGLE_CLIENT_SECRET` | ton client secret Google |
| `ALLOWED_EMAIL` | ton email Google (ex: `basile.caille@gmail.com`) |
| `NEXTAUTH_SECRET` | génère avec `openssl rand -base64 32` |
| `NEXTAUTH_URL` | laisse vide pour l'instant, on le remplira après |

6. Clique **Deploy**. Attends 1-2 minutes.
7. Tu obtiens une URL type `https://bourse-pro-bazz-xxxx.vercel.app`
8. Retourne dans Vercel → Settings → Environment Variables, ajoute `NEXTAUTH_URL` avec la valeur de ton URL Vercel (sans trailing slash)
9. Retourne dans Google Cloud Console → Credentials → ton OAuth Client, ajoute cette URL en Authorized redirect URI : `https://bourse-pro-bazz-xxxx.vercel.app/api/auth/callback/google`
10. Redéploie (Vercel → Deployments → trois points → Redeploy)

### 5. Tester

Va sur ton URL Vercel, tu dois voir la page de connexion. Connecte-toi avec ton email Google autorisé. Si tu utilises un autre email, tu seras rejeté.

## Développement local

```bash
cd bourse-pro-bazz
cp .env.local.example .env.local
# Édite .env.local avec tes vraies clés

npm install
npm run dev
# Ouvre http://localhost:3000
```

## Structure du projet

```
bourse-pro-bazz/
├── app/
│   ├── page.tsx                    Dashboard principal (terminal)
│   ├── portfolio/page.tsx          Gestion portefeuille
│   ├── screener/page.tsx           Screener fondamental
│   ├── watchlist/page.tsx          Watchlist avec prix cibles
│   ├── benchmark/page.tsx          Performance vs indices
│   ├── login/page.tsx              Page de connexion
│   ├── layout.tsx                  Layout racine
│   ├── providers.tsx               SessionProvider NextAuth
│   ├── globals.css                 CSS global + animations
│   └── api/
│       ├── auth/[...nextauth]/     NextAuth handler
│       ├── quote/[ticker]/         Prix temps réel
│       ├── macro/                  Indices + taux pour ticker
│       ├── news/                   News par tickers portefeuille
│       ├── earnings/               Calendrier earnings
│       ├── screener/               Screener fondamental
│       └── search/                 Autocomplete tickers
├── components/
│   ├── NavBar.tsx                  Barre navigation principale
│   ├── InfiniteTicker.tsx          Ticker défilant animé
│   ├── PortfolioTable.tsx          Tableau positions
│   └── KpiCard.tsx                 Carte KPI réutilisable
├── lib/
│   ├── finnhub.ts                  Wrapper API Finnhub
│   ├── twelvedata.ts               Wrapper API Twelve Data
│   ├── fmp.ts                      Wrapper API FMP
│   ├── cache.ts                    Cache in-memory
│   └── usePortfolio.ts             Hook portefeuille + localStorage
├── middleware.ts                   Protection routes (auth)
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── .env.local.example
```

## Roadmap

### V1.1 (améliorations rapides)
- Snapshots quotidiens portefeuille pour vraie courbe historique benchmark
- Export CSV des positions
- Page détail par action (/stock/[ticker])
- Mode mobile optimisé
- Plus de tickers dans le screener (50+)

### V1.2 (intégration Cowork)
- Briefing quotidien par email à 7h30 (pattern de ton agent CEO)
- Alerte Slack sur mouvements >5%
- Scoring buy/hold/sell automatique sur tes positions

### V2 (sophistication)
- Backtest de stratégies simples
- Comparables sectoriels automatiques
- Import CSV BoursoBank
- Analyse macro avancée (impact Fed sur tes positions)

## Notes importantes

- **Quota API** : la combinaison Finnhub (60/min) + Twelve Data (800/jour) + FMP (250/jour) couvre largement l'usage personnel. Le cache intelligent (1h pour fundamentals, 60s pour prix, 30min pour news) économise les requêtes.
- **Sécurité** : toutes les clés API restent côté serveur (routes API Next.js), elles ne sont jamais exposées au navigateur.
- **Stockage** : positions et watchlist en localStorage du navigateur. Pour synchro cross-device, il faudra ajouter Supabase en V1.1.
- **Secteurs exclus** : le screener exclut par défaut l'armement (pas dans la liste `TECH_UNIVERSE`). Palantir aussi.

## Troubleshooting

**Erreur "FINNHUB_API_KEY manquante"** : variable d'environnement absente dans Vercel, va dans Settings → Environment Variables et redéploie.

**Page blanche après connexion** : problème de `NEXTAUTH_URL` ou de redirect URI Google. Vérifie que l'URL Vercel est bien ajoutée dans les deux endroits.

**Prix à 0 sur certains tickers EU** : Twelve Data en free tier a parfois des limitations sur les ticker codes. Essaie le format `ASML:NASDAQ` au lieu de juste `ASML`.

**Quota API dépassé** : attendre la reset (minuit UTC pour Twelve Data et FMP, minute glissante pour Finnhub). Le cache évite normalement ce cas en usage perso.

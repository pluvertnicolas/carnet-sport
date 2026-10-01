# Carnet Sport

Application web personnelle de suivi d'entraînement : séance du jour selon le temps, la forme et le lieu, calendrier, musculation avec progression des charges, running, sports de raquette et foot, analyse des progrès.

Elle tourne sans serveur ni compilation : HTML, CSS et JavaScript. Elle s'installe sur iPhone et Android comme une app et fonctionne hors connexion.

## Structure

```
index.html              Squelette de la page
css/styles.css          Styles (thème clair et sombre, mobile d'abord)
js/app.js               Toute la logique : données, recommandations, vues
img/                    Photos d'exercices (départ / arrivée)
icons/                  Icônes de l'app
manifest.webmanifest    Installation sur l'écran d'accueil
sw.js                   Fonctionnement hors connexion
CLAUDE.md               Contexte du projet pour Claude Code
donnees/                Ta sauvegarde personnelle (ignorée par Git)
```

## Lancer en local

```bash
cd carnet-sport-app
python3 -m http.server 8000
```

Ouvre ensuite http://localhost:8000 dans Chrome ou Safari.

## Mettre sur GitHub

1. Crée un dépôt vide sur github.com, par exemple `carnet-sport`, sans README.
2. Dans le dossier du projet :

```bash
git init
git add .
git commit -m "Carnet Sport : première version"
git branch -M main
git remote add origin https://github.com/TON-COMPTE/carnet-sport.git
git push -u origin main
```

Le dossier `donnees/` n'est jamais envoyé : il est listé dans `.gitignore`.

## Héberger avec GitHub Pages

1. Sur GitHub, ouvre le dépôt, puis Settings > Pages.
2. Dans Source, choisis « Deploy from a branch », branche `main`, dossier `/ (root)`.
3. Après une à deux minutes, l'app est en ligne sur `https://TON-COMPTE.github.io/carnet-sport/`.

Sur un compte GitHub gratuit, GitHub Pages exige un dépôt public. Le code devient visible, mais tes données restent dans ton navigateur et ne sont jamais publiées.

## Installer sur ton téléphone

- iPhone (Safari) : bouton Partager, puis « Sur l'écran d'accueil ».
- Android (Chrome) : menu ⋮, puis « Installer l'application ».

## Récupérer tes données

Tes séances actuelles sont dans `donnees/sauvegarde-2026-10-01.json`.

1. Ouvre l'app en ligne.
2. Va dans Réglages > Sauvegarde > « Restaurer depuis un fichier .json ».
3. Choisis le fichier.

Pour en exporter une plus récente depuis la version Claude : Réglages > « Copier ma sauvegarde », puis colle le texte dans la version web.

## Où sont stockées les données

Dans la version web, tout est enregistré dans le navigateur (localStorage). Conséquences :

- Chaque appareil a ses propres données. Téléphone et ordinateur ne se synchronisent pas.
- Vider les données du navigateur efface tout. Télécharge une sauvegarde régulièrement (Réglages > « Télécharger la sauvegarde »).

Pour une vraie synchronisation entre appareils, il faut une base en ligne. Voir « Prochaines étapes ».

## Strava

Dans l'artefact Claude, la synchro Strava passait par le connecteur Claude. Hors de Claude, elle ne fonctionne pas encore.

Pour la brancher, il faut l'API Strava avec OAuth. Le « client secret » Strava ne doit jamais apparaître dans le code du navigateur. Il faut donc un petit serveur intermédiaire, par exemple un Cloudflare Worker ou une fonction Netlify gratuite :

1. Crée une application sur https://www.strava.com/settings/api pour obtenir client_id et client_secret.
2. Le Worker gère l'échange du code OAuth contre un jeton et le rafraîchissement du jeton.
3. L'app appelle `GET /athlete/activities` via le Worker, puis réutilise `parseActs()` et `importActs()` déjà présents dans `js/app.js`.

Les séries de musculation (détail des charges par série) ne sont pas disponibles dans l'API publique de Strava. Hors de Claude, saisis-les dans l'app.

## Travailler avec Claude Code

```bash
cd carnet-sport-app
claude
```

Claude Code lit `CLAUDE.md` au démarrage et connaît l'architecture et les règles du projet.

Exemples de demandes :

- « Rends la saisie des séries plus rapide sur mobile : boutons + et − pour les reps et la charge, minuteur de repos qui se lance seul après chaque série validée. »
- « Ajoute une synchro entre appareils avec Supabase (connexion par e-mail) en gardant localStorage comme cache hors ligne. »
- « Crée un Cloudflare Worker pour l'OAuth Strava et branche l'import automatique. »
- « Ajoute des tests pour suggestion(), rankTemplates() et generateWeek(). »
- « Découpe js/app.js en modules ES (données, logique, vues) sans changer le comportement. »

À chaque déploiement qui modifie le code, incrémente `VERSION` dans `sw.js` pour que les téléphones récupèrent la nouvelle version.

## Crédits

Photos d'exercices : [Free Exercise DB](https://github.com/yuhonas/free-exercise-db), domaine public (Unlicense).
Polices : Barlow Condensed et Figtree, Google Fonts (licence SIL Open Font).

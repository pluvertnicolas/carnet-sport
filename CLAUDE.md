# Carnet Sport : contexte pour Claude Code

App web personnelle d'entraînement pour Nicolas (Bordeaux). Vanilla JS, aucune dépendance, aucun build. Servie en statique (GitHub Pages). Installable comme une app (manifest + service worker).

## Utilisateur et règles de contenu

- Interface 100 % en français, tutoiement.
- Pas d'emoji. Pas de tiret « - » ni de tiret long « — » au milieu des phrases de l'interface.
- Ton direct, phrases courtes, orthographe impeccable.
- Profil sportif : muscu en salle 2 à 3 fois par semaine sur un split pecs/épaules/triceps et dos/biceps, foot tous les lundis (activité fixe), squash, tennis, padel, running (5 à 12 km), vélo en salle en échauffement. Montre Garmin reliée à Strava. Niveau débutant à intermédiaire en musculation : la logique de progression doit rester simple et lisible.

## Architecture (js/app.js, un seul fichier, sections balisées par des commentaires `/* ===== ... ===== */`)

- `IN_CLAUDE` : vrai si la page tourne dans un artefact Claude (`window.claude.use` existe). Dans ce cas : base `db` partagée et connecteur Strava via `claude.use('mcp')`. Sinon : localStorage seulement. Tout code qui dépend de Claude doit tester `IN_CLAUDE` ou gérer un retour `null`.
- Données de référence :
  - `EX` : exercices (nom, muscles, réglage machine, étapes, erreurs, unité `kg|reps|sec`, `step` de charge, `perHand` pour les haltères, `assist` pour les machines d'assistance). `EX[id].g` : groupe musculaire (`EXG`).
  - `PH` : photo associée à un exercice (`img/<slug>-0.jpg` départ, `-1.jpg` arrivée).
  - `FIG` : schémas animés en SVG (cinématique simple) pour les exercices sans photo.
  - `TPL` : modèles de séance (`push_a`, `push_b`, `pull_a`, `pull_b`, `legs`, `home_circuit`, running, cardio, renfo, mobilité). `ex: [[exId, séries, repsMin, repsMax]]`.
  - `SPORTS` : toutes les activités (course, tapis, vélo salle, foot, squash...) avec les métriques saisies.
  - `GOALS` : objectifs hebdomadaires par type de séance.
- État : `S = {profile, sessions, tests, example}` et `UI` (vue courante, filtres). `ED` = séance ouverte dans l'éditeur.
- Persistance : `persistSession`, `persistDelete`, `persistProfile` → localStorage (`saveLocal`) + db Claude si dispo.
- Logique d'entraînement :
  - `rankTemplates(date, pool, minutesDispo, {forme, lieu})` : score chaque modèle (déficit vs objectif de la semaine, 48 h entre séances jambes, pas d'intensité deux jours de suite, ratio de charge aiguë/chronique, semaine allégée toutes les 4 semaines, alternance push/pull/jambes, veille d'une activité fixe). Renvoie les raisons (`why`) affichées à l'utilisateur.
  - `suggestion(exId, lo, hi, date)` : double progression. Toutes les séries au sommet de la fourchette → +1 palier de charge. Plus de 28 jours sans trace → reprise à 90 % de la meilleure charge des 6 semaines précédentes.
  - `instantiate(tpl, date, opts)` : crée une séance prévue avec charges suggérées.
  - `generateWeek(lundi, depuis)` / `adaptAfter(date)` / `replanWeek()` : planification auto et réajustement après chaque séance faite.
  - `acwr()` : charge sRPE (durée × RPE) sur 7 jours vs moyenne 28 jours.
- Vues : `vToday`, `vCalendar`, `vLibrary`, `vExercises`, `vProgress`, `vSettings`, plus l'éditeur `renderSheet`. Rendu par `innerHTML` + délégation d'événements : les boutons portent `data-a="nomAction"` et les actions sont dans l'objet `A`.

## Modèle d'une séance

```js
{ id, date:'YYYY-MM-DD', type:'muscu|run|cardio|sport|renfo|mob|autre', sport:'course|foot|...', key, sub:'push|pull|bas',
  tplId, title, status:'planned|done', duration, rpe, notes, legs, hard, auto,
  exercises:[{exId, lo, hi, sets:[{reps, load, ok}]}],   // muscu, renfo
  distance, time, hr,                                     // running, cardio
  result:'V|D|N', score, opp, goals,                      // sports
  stravaId, stravaSets }                                  // import Strava
```

## Styles (css/styles.css)

- Couleurs uniquement via les tokens `:root` (`--bg`, `--ink`, `--accent`, `--c-muscu`...). Thème sombre redéfini dans `@media (prefers-color-scheme: dark)` et `[data-theme="dark"]` : toute nouvelle couleur doit exister dans les trois blocs.
- Mobile d'abord : barre d'onglets en bas sous 900 px, rail latéral au-dessus. Aucun défilement horizontal de la page. Zones tactiles d'au moins 40 px.
- Polices : Barlow Condensed (titres), Figtree (texte).

## Vérifier un changement

- `node --check js/app.js` pour la syntaxe.
- `python3 -m http.server 8000` puis test dans Chrome (mode mobile 390 px) et Safari.
- Après modification du code déployé : incrémenter `VERSION` dans `sw.js`.

## Pistes prioritaires

1. Saisie des séries plus rapide en salle (boutons +/−, minuteur de repos automatique, écran qui reste allumé avec l'API Wake Lock).
2. Synchro entre appareils (Supabase ou Firebase), localStorage gardé comme cache hors ligne.
3. OAuth Strava via un Cloudflare Worker (le client secret ne doit jamais être côté navigateur).
4. Découpage de `app.js` en modules ES et tests unitaires des fonctions de logique.

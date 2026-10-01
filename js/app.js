/* ================= ENVIRONMENT ================= */
// true when the page runs inside a Claude artifact (db + Strava connector available)
const IN_CLAUDE=!!(window.claude&&window.claude.use);

/* ================= REFERENCE DATA ================= */
const TYPES={muscu:{label:'Musculation'},run:{label:'Running'},cardio:{label:'Cardio'},sport:{label:'Sports'},renfo:{label:'Renforcement'},mob:{label:'Mobilité'},autre:{label:'Autre activité'}};
// every session has a sport; m = metrics captured
const SPORTS={
 course:{n:'Course à pied',type:'run',m:[]},
 course_tapis:{n:'Course sur tapis',type:'run',m:['incline']},
 velo_salle:{n:'Vélo en salle',type:'cardio',key:'cardio',m:['dist','watts','hr']},
 marche_incl:{n:'Marche inclinée',type:'cardio',key:'cardio',m:['speed','incline','hr']},
 escaliers:{n:'Escaliers',type:'cardio',key:'cardio',legs:true,m:['floors','hr']},
 rameur:{n:'Rameur',type:'cardio',key:'cardio',m:['dist','hr']},
 elliptique:{n:'Elliptique',type:'cardio',key:'cardio',m:['dist','hr']},
 velo:{n:'Vélo extérieur',type:'cardio',key:'cardio',m:['dist','hr']},
 foot:{n:'Football',type:'sport',key:'sport_i',legs:true,hard:true,m:['result','score','goals','hr']},
 squash:{n:'Squash',type:'sport',key:'sport_i',legs:true,hard:true,m:['result','score','opp','hr']},
 tennis:{n:'Tennis',type:'sport',key:'sport_m',m:['result','score','opp','hr']},
 padel:{n:'Padel',type:'sport',key:'sport_m',m:['result','score','opp','hr']},
 muscu:{n:'Musculation',type:'muscu',m:[]},renfo:{n:'Renforcement',type:'renfo',m:[]},mob:{n:'Mobilité / yoga',type:'mob',m:[]},autre:{n:'Autre activité',type:'autre',m:['hr']}
};
const DEFSPORT={run:'course',muscu:'muscu',renfo:'renfo',mob:'mob',cardio:'velo_salle',sport:'foot',autre:'autre'};
const RESULT={V:'Victoire',D:'Défaite',N:'Nul'};
const sportOf=s=>s.sport&&SPORTS[s.sport]?s.sport:(s.type==='run'&&s.lieu==='salle'?'course_tapis':DEFSPORT[s.type]||'autre');
function sportOptions(sel){return Object.entries(TYPES).map(([k,t])=>`<optgroup label="${t.label}">${Object.entries(SPORTS).filter(([,x])=>x.type===k).map(([id,x])=>`<option value="${id}" ${sel===id?'selected':''}>${x.n}</option>`).join('')}</optgroup>`).join('')}
const LIEUX={salle:'Salle',exterieur:'Extérieur',maison:'Maison'};
const FORME={1:'Épuisé',2:'Fatigué',3:'Normal',4:'Bien',5:'Au top'};
const KEYLABEL={autre:'Autre activité',muscu:'Musculation',run_q:'Running qualité',run_e:'Running endurance',run_l:'Sortie longue',renfo:'Renforcement',mob:'Mobilité',cardio:'Cardio machine',cardio_q:'Cardio intense',sport_i:'Sport intense',sport_m:'Sport de raquette'};
function keyLabel(k){if(S.profile.goal!=='running'){if(k==='run_q')return 'Intensité (fractionné, foot, squash…)';if(k==='run_e')return 'Endurance (footing, vélo, tennis, padel…)'}return KEYLABEL[k]||k}
const GOALS={
  mixte:{label:'Condition physique globale',targets:{muscu:2,run_q:1,run_e:1,renfo:1,mob:1}},
  running:{label:'Améliorer mes chronos running',targets:{run_q:1,run_e:1,run_l:1,renfo:2,muscu:1}},
  force:{label:'Prendre de la force',targets:{muscu:3,run_e:1,renfo:1,mob:1}},
  seche:{label:'Perdre du gras, garder le muscle',targets:{muscu:2,run_e:2,run_q:1,renfo:1}}
};
const RPE_TXT={1:'Très facile',2:'Très facile',3:'Facile',4:'Facile',5:'Modéré',6:'Modéré, ça travaille',7:'Difficile, 3 reps en réserve',8:'Très difficile, 2 reps en réserve',9:'Presque maximal, 1 rep en réserve',10:'Maximal'};

const EX={
 chest_press:{n:'Développé assis machine (chest press)',g:'haut',m:'Pectoraux, triceps, épaules avant',machine:'Chest press',unit:'kg',step:2.5,
  setup:'Règle le siège pour que les poignées arrivent au milieu de la poitrine. Dos et tête collés au dossier, pieds à plat.',
  steps:['Serre les omoplates vers l\'arrière et vers le bas avant la première poussée.','Pousse en expirant jusqu\'à bras presque tendus, sans verrouiller les coudes.','Reviens en 2 à 3 secondes jusqu\'à sentir un léger étirement des pectoraux.'],
  err:['Épaules qui avancent en fin de poussée.','Coudes à 90° du buste : garde-les vers 45 à 60°.'],tip:'Si tes épaules chauffent plus que tes pectoraux, baisse légèrement le siège.'},
 lat_pulldown:{n:'Tirage vertical poitrine',g:'haut',m:'Grand dorsal, biceps, rhomboïdes',machine:'Poulie haute / lat pulldown',unit:'kg',step:2.5,
  setup:'Cale les cuisses sous les boudins. Prise un peu plus large que les épaules, paumes vers l\'avant.',
  steps:['Incline le buste de 10 à 15° en arrière, poitrine sortie.','Tire la barre vers le haut de la poitrine en pensant « coudes vers les hanches ».','Contrôle la remontée jusqu\'à bras tendus.'],
  err:['Tirer derrière la nuque.','Se jeter en arrière pour bouger la charge.','Tirer uniquement avec les bras.'],tip:'Marque 1 seconde de pause barre en bas : c\'est là que le dos travaille le plus.'},
 shoulder_press:{n:'Développé épaules machine',g:'haut',m:'Deltoïdes, triceps',machine:'Shoulder press',unit:'kg',step:2.5,
  setup:'Poignées à hauteur des épaules au départ. Dos plaqué, abdos serrés.',
  steps:['Pousse vers le haut en expirant, sans cambrer.','Arrête-toi juste avant le verrouillage des coudes.','Redescends lentement jusqu\'au niveau du menton.'],
  err:['Cambrer le bas du dos.','Hausser les épaules vers les oreilles.'],tip:'Charge modérée : l\'épaule se protège mieux avec 10 à 12 reps propres qu\'avec 6 reps lourdes.'},
 seated_row:{n:'Rowing assis poulie basse',g:'haut',m:'Dorsaux, rhomboïdes, trapèzes moyens, biceps',machine:'Poulie basse, poignée triangle',unit:'kg',step:2.5,
  setup:'Pieds sur les cales, genoux légèrement fléchis, buste droit.',
  steps:['Tire la poignée vers le nombril, coudes le long du corps.','Serre les omoplates 1 seconde en fin de tirage.','Allonge les bras en laissant les omoplates s\'écarter, sans arrondir le dos.'],
  err:['Se balancer d\'avant en arrière.','Arrondir le dos au retour.'],tip:'Le buste ne bouge quasiment pas. Si tu dois te pencher, la charge est trop lourde.'},
 lateral_raise:{n:'Élévations latérales haltères',g:'haut',m:'Deltoïde moyen',machine:'Haltères',unit:'kg',step:1,
  setup:'Debout, haltères légers, coudes très légèrement fléchis.',
  steps:['Monte les bras sur les côtés jusqu\'à hauteur d\'épaules.','Garde les mains au niveau des coudes, pas plus haut.','Descends en 3 secondes.'],
  err:['Donner de l\'élan avec le buste.','Monter au-dessus des épaules.'],tip:'Exercice d\'isolation : léger et strict, la brûlure arrive vers la 12e rep.'},
 cable_curl:{n:'Curl biceps poulie basse',g:'haut',m:'Biceps',machine:'Poulie basse, barre droite',unit:'kg',step:2.5,
  setup:'Debout face à la poulie, coudes collés au buste.',
  steps:['Fléchis les coudes pour monter la barre vers les épaules.','Serre 1 seconde en haut.','Redescends jusqu\'à bras quasi tendus.'],
  err:['Coudes qui avancent.','Balancier du buste.'],tip:'La tension continue de la poulie est idéale pour débuter.'},
 triceps_pushdown:{n:'Extension triceps poulie haute',g:'haut',m:'Triceps',machine:'Poulie haute, corde',unit:'kg',step:2.5,
  setup:'Face à la poulie, buste légèrement penché, coudes collés au corps.',
  steps:['Pousse la corde vers le bas en tendant les bras.','Écarte les mains en bas du mouvement.','Remonte jusqu\'à ce que les avant-bras soient à l\'horizontale.'],
  err:['Coudes qui bougent vers l\'avant.','Épaules qui roulent pour pousser.'],tip:'Seuls les avant-bras bougent.'},
 pec_deck:{n:'Pec deck (écarté machine)',g:'haut',m:'Pectoraux',machine:'Pec deck / butterfly',unit:'kg',step:2.5,
  setup:'Poignées à hauteur de poitrine, coudes légèrement fléchis et fixes.',
  steps:['Rapproche les bras en arc de cercle.','Serre la poitrine 1 seconde.','Ouvre lentement jusqu\'à un léger étirement.'],
  err:['Ouvrir trop loin en arrière, ça stresse l\'épaule.'],tip:'Pense « serrer un gros arbre » plutôt que pousser.'},
 incline_db_press:{n:'Développé incliné haltères',g:'haut',m:'Haut des pectoraux, épaules avant, triceps',machine:'Banc incliné à 30°, haltères',unit:'kg',step:2,
  setup:'Banc à 30°. Assieds-toi haltères sur les cuisses, puis allonge-toi en les amenant au-dessus de la poitrine.',
  steps:['Descends les haltères de chaque côté du haut de la poitrine, coudes vers 45 à 60°.','Pousse en expirant, les haltères se rapprochent légèrement en haut.','Garde les pieds au sol et les omoplates serrées.'],
  err:['Banc trop incliné : l\'exercice devient un développé épaules.','Rebondir en bas.'],tip:'La charge indiquée est celle d\'un haltère.'},
 face_pull:{n:'Face pull',g:'haut',m:'Deltoïdes arrière, coiffe des rotateurs',machine:'Poulie haute, corde',unit:'kg',step:2.5,
  setup:'Poulie à hauteur du visage, corde en prise pouces vers toi.',
  steps:['Tire la corde vers le front en écartant les mains.','Coudes hauts, à hauteur d\'épaules.','Pause 1 seconde, retour contrôlé.'],
  err:['Charge trop lourde qui fait basculer le buste.'],tip:'Excellent pour la posture et les épaules de ceux qui travaillent assis.'},
 assisted_dip:{n:'Dips assistés machine',g:'haut',m:'Triceps, bas des pectoraux',machine:'Machine assistée (contrepoids)',unit:'kg',step:5,assist:true,
  setup:'La charge est une ASSISTANCE : plus elle est lourde, plus c\'est facile. Genoux sur la plateforme.',
  steps:['Buste légèrement penché vers l\'avant.','Descends jusqu\'à ce que les coudes forment 90°.','Pousse jusqu\'à bras tendus sans verrouiller.'],
  err:['Descendre trop bas.','Épaules qui remontent aux oreilles.'],tip:'Progresser = diminuer l\'assistance.'},
 db_curl:{n:'Curl haltères alterné',g:'haut',m:'Biceps',machine:'Haltères',unit:'kg',step:1,
  setup:'Debout, haltères le long du corps, paumes vers l\'avant.',
  steps:['Monte un haltère en gardant le coude fixe.','Redescends en 2 secondes.','Alterne les bras.'],err:['Balancer le buste.'],tip:'Charge d\'un haltère.'},
 leg_press:{n:'Presse à cuisses 45°',g:'bas',m:'Quadriceps, fessiers, ischios',machine:'Presse inclinée',unit:'kg',step:5,
  setup:'Dos et bassin plaqués au dossier. Pieds largeur de hanches, au milieu de la plateforme.',
  steps:['Déverrouille les sécurités.','Descends jusqu\'à environ 90° aux genoux, sans que le bassin décolle.','Pousse avec les talons, sans verrouiller les genoux en haut.'],
  err:['Bassin qui s\'enroule en bas du mouvement.','Genoux qui rentrent vers l\'intérieur.','Verrouiller les genoux en haut.'],tip:'La charge affichée ne compte pas le chariot. Note toujours la même chose pour comparer.'},
 leg_curl:{n:'Leg curl assis',g:'bas',m:'Ischio-jambiers',machine:'Leg curl assis',unit:'kg',step:2.5,
  setup:'Aligne l\'axe du genou avec l\'axe de la machine. Boudin juste au-dessus des talons, cale-cuisses serré.',
  steps:['Fléchis les jambes en ramenant les talons sous le siège.','Tiens 1 seconde.','Remonte lentement sans laisser tomber la charge.'],
  err:['Décoller les hanches du siège.','Lâcher la charge au retour.'],tip:'Des ischios forts protègent tes genoux en course.'},
 leg_extension:{n:'Leg extension',g:'bas',m:'Quadriceps',machine:'Leg extension',unit:'kg',step:2.5,
  setup:'Axe du genou aligné avec l\'axe machine, boudin sur le bas du tibia.',
  steps:['Tends les jambes complètement.','Contracte 1 seconde en haut.','Descends en 3 secondes.'],err:['Donner de l\'élan.','Faire une demi-amplitude.'],tip:'Reste sur des charges modérées, 12 à 15 reps.'},
 hip_thrust:{n:'Hip thrust',g:'bas',m:'Fessiers, ischios',machine:'Machine hip thrust ou barre + banc',unit:'kg',step:5,
  setup:'Haut du dos sur le banc, pieds à plat, tibias verticaux en position haute.',
  steps:['Pousse avec les talons pour monter le bassin.','Aligne épaules, hanches et genoux en haut, serre les fessiers 1 seconde.','Menton rentré, redescends contrôlé.'],
  err:['Cambrer les lombaires en haut.','Pousser sur la pointe des pieds.'],tip:'Mets une mousse sur la barre si tu utilises une barre libre.'},
 calf_raise:{n:'Mollets machine',g:'bas',m:'Mollets',machine:'Machine à mollets debout ou presse',unit:'kg',step:5,
  setup:'Avant des pieds sur la marche, talons dans le vide.',
  steps:['Descends les talons sous le niveau de la marche, pause 1 seconde en étirement.','Monte le plus haut possible sur la pointe.','Descends en 2 secondes.'],err:['Rebondir en bas.','Amplitude partielle.'],tip:'Clé pour la prévention des blessures en running.'},
 goblet_squat:{n:'Squat goblet',g:'bas',m:'Quadriceps, fessiers, gainage',machine:'Un haltère ou kettlebell',unit:'kg',step:2,
  setup:'Haltère tenu contre la poitrine. Pieds largeur d\'épaules, pointes légèrement ouvertes.',
  steps:['Descends en poussant les hanches en arrière et les genoux dans l\'axe des pieds.','Dos neutre, descends au moins cuisses parallèles au sol.','Remonte en poussant le sol.'],
  err:['Talons qui décollent.','Genoux qui rentrent.','Dos qui s\'arrondit.'],tip:'Le meilleur exercice pour apprendre le squat.'},
 walking_lunge:{n:'Fentes marchées',g:'bas',m:'Quadriceps, fessiers',machine:'Haltères ou poids du corps',unit:'kg',step:2,
  setup:'Debout, haltères le long du corps (optionnels).',
  steps:['Fais un grand pas en avant.','Descends le genou arrière vers le sol, buste droit.','Pousse sur le talon avant pour enchaîner le pas suivant.'],
  err:['Genou avant qui rentre.','Pas trop court.'],tip:'Reps comptées par jambe. Charge d\'un haltère.'},
 rdl:{n:'Soulevé de terre roumain haltères',g:'bas',m:'Ischios, fessiers, lombaires',machine:'Haltères',unit:'kg',step:2,
  setup:'Debout, haltères devant les cuisses, genoux légèrement fléchis et fixes.',
  steps:['Bascule les hanches vers l\'arrière, les haltères glissent le long des cuisses.','Descends jusqu\'à mi-tibia en gardant le dos plat.','Remonte en poussant les hanches vers l\'avant.'],
  err:['Dos rond.','Transformer le mouvement en squat.','Haltères loin des jambes.'],tip:'Tu dois sentir un étirement franc derrière les cuisses.'},
 abductor:{n:'Abducteurs machine',g:'bas',m:'Moyen fessier',machine:'Machine abducteurs',unit:'kg',step:5,
  setup:'Assis, dos plaqué, extérieur des genoux contre les coussins.',
  steps:['Écarte les jambes.','Tiens 1 seconde.','Reviens lentement.'],err:['Relâcher d\'un coup.'],tip:'Stabilise le bassin et les genoux en course.'},
 plank:{n:'Gainage planche',g:'tronc',m:'Abdominaux, transverse',machine:'Poids du corps',unit:'sec',
  setup:'Avant-bras au sol sous les épaules.',
  steps:['Aligne tête, dos et talons.','Serre fessiers et abdos.','Respire normalement.'],err:['Fesses trop hautes.','Dos qui se creuse.'],tip:'Arrête la série dès que le bassin s\'affaisse.'},
 side_plank:{n:'Gainage latéral',g:'tronc',m:'Obliques, moyen fessier',machine:'Poids du corps',unit:'sec',
  setup:'Sur le côté, avant-bras sous l\'épaule.',steps:['Décolle le bassin pour aligner le corps.','Tiens la position.','Fais les deux côtés.'],err:['Bassin qui tombe.'],tip:'Temps indiqué par côté.'},
 glute_bridge_single:{n:'Pont fessier unilatéral',g:'tronc',m:'Fessiers, ischios',machine:'Poids du corps',unit:'reps',
  setup:'Allongé sur le dos, un pied au sol, l\'autre jambe tendue.',steps:['Monte le bassin en poussant sur le talon.','Serre le fessier 1 seconde en haut.','Redescends sans toucher le sol.'],err:['Bassin qui pivote.'],tip:'Reps par jambe.'},
 clamshell:{n:'Clamshell élastique',g:'tronc',m:'Moyen fessier',machine:'Mini-bande élastique',unit:'reps',
  setup:'Sur le côté, genoux fléchis à 90°, élastique au-dessus des genoux.',steps:['Ouvre le genou du dessus sans décoller les pieds.','Pause 1 seconde.','Referme lentement.'],err:['Bassin qui roule en arrière.'],tip:'Prévention du syndrome de l\'essuie-glace.'},
 eccentric_calf:{n:'Mollets excentriques sur marche',g:'tronc',m:'Mollets, tendon d\'Achille',machine:'Marche',unit:'reps',
  setup:'Avant des pieds sur une marche.',steps:['Monte sur la pointe avec les deux pieds.','Retire un pied et descends sur une seule jambe en 3 à 4 secondes.','Remonte à deux pieds.'],err:['Descendre trop vite.'],tip:'Référence en prévention des tendinopathies du coureur.'},
 bulgarian_split:{n:'Squat bulgare',g:'tronc',m:'Quadriceps, fessiers, équilibre',machine:'Banc, poids du corps',unit:'reps',
  setup:'Pied arrière posé sur un banc, pied avant un grand pas devant.',steps:['Descends le genou arrière vers le sol.','Buste légèrement penché.','Pousse sur le talon avant.'],err:['Pied avant trop proche du banc.'],tip:'Reps par jambe.'},
 bird_dog:{n:'Bird dog',g:'tronc',m:'Lombaires, gainage',machine:'Poids du corps',unit:'reps',
  setup:'À quatre pattes, mains sous les épaules.',steps:['Tends le bras droit et la jambe gauche.','Tiens 2 secondes sans bouger le bassin.','Alterne.'],err:['Dos qui se creuse.'],tip:'Lent et stable.'},
 dead_bug:{n:'Dead bug',g:'tronc',m:'Abdominaux profonds',machine:'Poids du corps',unit:'reps',
  setup:'Sur le dos, bras vers le plafond, genoux à 90°.',steps:['Plaque le bas du dos au sol.','Allonge bras et jambe opposés.','Reviens et alterne.'],err:['Bas du dos qui décolle.'],tip:'Expire en allongeant.'},
 pushup:{n:'Pompes',g:'tronc',m:'Pectoraux, triceps, gainage',machine:'Poids du corps',unit:'reps',
  setup:'Mains un peu plus larges que les épaules. Version facile : genoux au sol.',steps:['Corps gainé et aligné.','Descends la poitrine près du sol, coudes à 45°.','Pousse.'],err:['Bassin qui tombe.'],tip:''},
 mountain_climber:{n:'Mountain climbers',g:'tronc',m:'Cardio, gainage',machine:'Poids du corps',unit:'sec',
  setup:'Position de pompe.',steps:['Ramène un genou vers la poitrine.','Alterne rapidement.','Garde le bassin bas.'],err:['Fesses en l\'air.'],tip:''},
 jump_squat:{n:'Squats sautés',g:'tronc',m:'Quadriceps, fessiers, explosivité',machine:'Poids du corps',unit:'reps',
  setup:'Pieds largeur d\'épaules.',steps:['Descends en squat.','Saute en extension complète.','Réception souple, genoux dans l\'axe.'],err:['Réception jambes tendues.'],tip:''},
 hip_flexor:{n:'Étirement fléchisseurs de hanche',g:'mob',m:'Psoas, quadriceps',machine:'Tapis',unit:'sec',
  setup:'Fente basse, genou arrière au sol.',steps:['Rentre le bassin (bascule arrière).','Avance légèrement jusqu\'à l\'étirement devant la hanche.','Respire lentement.'],err:['Cambrer.'],tip:'Temps par côté. Indispensable si tu es assis toute la journée.'},
 hip_9090:{n:'Mobilité 90/90 hanches',g:'mob',m:'Rotateurs de hanche',machine:'Tapis',unit:'sec',
  setup:'Assis, une jambe devant pliée à 90°, l\'autre sur le côté à 90°.',steps:['Buste droit, penche-toi sur la jambe avant.','Change de côté en pivotant les genoux.','Enchaîne lentement.'],err:['Dos rond.'],tip:''},
 thoracic_rot:{n:'Rotations thoraciques',g:'mob',m:'Haut du dos',machine:'Tapis',unit:'reps',
  setup:'Allongé sur le côté, genoux pliés, bras tendus devant.',steps:['Ouvre le bras du dessus vers l\'autre côté.','Suis la main du regard.','Reviens.'],err:['Genoux qui se séparent.'],tip:'Reps par côté.'},
 ankle_mob:{n:'Mobilité chevilles genou au mur',g:'mob',m:'Chevilles',machine:'Mur',unit:'reps',
  setup:'Face au mur, pied à 10 cm.',steps:['Avance le genou vers le mur, talon au sol.','Reviens.','Recule le pied si c\'est trop facile.'],err:['Talon qui décolle.'],tip:'Reps par côté.'}
};

Object.assign(EX,{
 bench_press:{n:'Développé couché barre',m:'Pectoraux, triceps, épaules avant',machine:'Banc plat + barre (20 kg à vide)',unit:'kg',step:2.5,
  setup:'Allongé, yeux sous la barre, pieds à plat. Serre les omoplates et garde une légère cambrure. Prise un peu plus large que les épaules.',
  steps:['Décroche la barre bras tendus au-dessus des épaules.','Descends-la en 2 à 3 s jusqu\'au bas des pectoraux, coudes à 45° du buste.','Pousse en expirant jusqu\'à bras tendus, sans décoller les fesses.'],
  err:['Rebondir sur la poitrine.','Coudes à 90° du buste : les épaules souffrent.','Fesses qui décollent du banc.'],tip:'Note toujours le poids total, barre comprise, pour comparer d\'une séance à l\'autre.'},
 db_bench:{n:'Développé couché haltères',m:'Pectoraux, triceps, épaules avant',machine:'Banc plat + haltères',unit:'kg',step:2,perHand:true,
  setup:'Assieds-toi haltères sur les cuisses, allonge-toi en les ramenant au-dessus de la poitrine. Omoplates serrées, pieds au sol.',
  steps:['Descends les haltères de chaque côté de la poitrine, coudes à 45°.','Descends jusqu\'à sentir l\'étirement des pectoraux.','Pousse en rapprochant légèrement les haltères en haut.'],
  err:['Descendre trop bas et forcer sur l\'épaule.','Taper les haltères en haut.'],tip:'Charge indiquée par haltère.'},
 cable_cross:{n:'Câble croisé poulie haute',m:'Pectoraux (bas), épaules avant',machine:'Vis-à-vis de poulies, poignées',unit:'kg',step:2.5,
  setup:'Poulies en haut, une poignée dans chaque main. Un pas en avant, buste légèrement penché, coudes un peu fléchis.',
  steps:['Ramène les mains vers le bas et l\'avant, en arc de cercle.','Croise légèrement les mains devant le bassin et serre 1 s.','Remonte lentement jusqu\'à l\'étirement des pectoraux.'],
  err:['Plier les coudes pour pousser : ça devient un développé.','Charge trop lourde qui fait basculer le buste.'],tip:'Charge indiquée par poulie.'},
 triceps_bar:{n:'Extension triceps barre droite',m:'Triceps',machine:'Poulie haute, barre droite',unit:'kg',step:2.5,
  setup:'Face à la poulie, prise en pronation largeur d\'épaules, coudes collés au corps.',
  steps:['Pousse la barre vers le bas jusqu\'à bras tendus.','Contracte les triceps 1 s.','Remonte jusqu\'à l\'horizontale des avant-bras.'],
  err:['Coudes qui avancent.','Se pencher sur la barre pour pousser avec le poids du corps.'],tip:'Plus lourd que la corde, moins d\'amplitude : alterne les deux.'},
 dip_machine:{n:'Dips machine assise',m:'Triceps, bas des pectoraux',machine:'Dipping machine (assise)',unit:'kg',step:5,
  setup:'Assis, dos contre le dossier, poignées à hauteur des côtes. Règle le siège pour que les coudes soient pliés à 90° au départ.',
  steps:['Pousse les poignées vers le bas jusqu\'à bras tendus.','Garde les épaules basses, loin des oreilles.','Remonte lentement jusqu\'à 90° aux coudes.'],
  err:['Hausser les épaules.','Remonter trop haut et étirer l\'avant de l\'épaule.'],tip:''},
 hammer_curl:{n:'Curl marteau haltères',m:'Biceps, brachial, avant-bras',machine:'Haltères',unit:'kg',step:2,perHand:true,
  setup:'Debout, haltères le long du corps, paumes face à face (prise marteau).',
  steps:['Monte l\'haltère en gardant la paume tournée vers l\'intérieur.','Coude fixe contre le buste.','Redescends en 2 à 3 s.'],
  err:['Balancer le buste.','Coude qui avance.'],tip:'Charge par haltère. Excellent pour l\'épaisseur du bras et la prise.'},
 ez_curl:{n:'Curl barre EZ',m:'Biceps',machine:'Barre EZ (coudée)',unit:'kg',step:2.5,
  setup:'Debout, prise sur les parties coudées de la barre, coudes contre le buste.',
  steps:['Monte la barre vers les épaules sans bouger les coudes.','Serre 1 s en haut.','Redescends jusqu\'à bras presque tendus.'],
  err:['Se cambrer pour monter la charge.','Coudes qui partent vers l\'avant.'],tip:'Note le poids total, barre comprise.'},
 machine_curl:{n:'Curl biceps machine',m:'Biceps',machine:'Machine curl (pupitre)',unit:'kg',step:2.5,
  setup:'Règle le siège pour que l\'arrière des bras repose à plat sur le pupitre, coudes alignés avec l\'axe de la machine.',
  steps:['Fléchis les bras jusqu\'en haut.','Serre 1 s.','Redescends lentement jusqu\'à bras presque tendus.'],
  err:['Décoller les coudes du pupitre.','Lâcher la charge en descente.'],tip:''},
 db_row:{n:'Rowing haltère unilatéral',m:'Grand dorsal, rhomboïdes, biceps',machine:'Banc + haltère',unit:'kg',step:2,perHand:true,
  setup:'Un genou et une main sur le banc, dos plat parallèle au sol. Haltère dans l\'autre main, bras tendu.',
  steps:['Tire l\'haltère vers la hanche, coude près du corps.','Serre l\'omoplate 1 s en haut.','Redescends bras tendu en 2 s.'],
  err:['Tourner le buste pour tirer.','Tirer vers l\'épaule au lieu de la hanche.'],tip:'Reps par bras, charge de l\'haltère.'},
 cable_row:{n:'Tirage horizontal poulie basse',m:'Dos (milieu), biceps',machine:'Poulie basse, poignée',unit:'kg',step:2.5,
  setup:'Assis face à la poulie, pieds sur les cales, genoux légèrement fléchis, dos droit.',
  steps:['Tire la poignée vers le nombril, coudes le long du corps.','Serre les omoplates 1 s.','Allonge les bras sans arrondir le dos.'],
  err:['Se balancer d\'avant en arrière.','Arrondir le dos au retour.'],tip:'En version un bras : reps par bras.'},
 pullover:{n:'Pull-over haltère',m:'Grand dorsal, pectoraux',machine:'Banc + un haltère',unit:'kg',step:2,
  setup:'Allongé en travers ou dans la longueur du banc, haltère tenu à deux mains au-dessus de la poitrine, coudes légèrement fléchis.',
  steps:['Descends l\'haltère derrière la tête en arc de cercle.','Arrête-toi quand les bras sont dans le prolongement du buste.','Ramène-le au-dessus de la poitrine en serrant le dos.'],
  err:['Plier les coudes en cours de mouvement.','Cambrer le bas du dos.'],tip:''},
 ab_crunch:{n:'Crunch machine',m:'Grands droits de l\'abdomen',machine:'Machine abdos (crunch)',unit:'kg',step:2.5,
  setup:'Assis, poignées ou boudins sur le haut de la poitrine, pieds calés.',
  steps:['Enroule le buste vers le bassin en expirant.','Contracte 1 s en bas.','Reviens lentement sans relâcher complètement.'],
  err:['Tirer avec les bras.','Mouvement trop rapide.'],tip:''},
 crunch:{n:'Crunch au sol',m:'Grands droits de l\'abdomen',machine:'Tapis',unit:'reps',
  setup:'Sur le dos, genoux fléchis, mains sur les tempes.',steps:['Enroule le haut du dos en expirant.','Décolle les omoplates, pas le bas du dos.','Redescends lentement.'],err:['Tirer sur la nuque.'],tip:''},
 air_squat:{n:'Squat poids du corps',m:'Quadriceps, fessiers',machine:'Poids du corps',unit:'reps',
  setup:'Pieds largeur d\'épaules, bras devant pour l\'équilibre.',steps:['Descends en poussant les hanches en arrière.','Cuisses au moins parallèles au sol.','Remonte en poussant dans les talons.'],err:['Genoux qui rentrent.','Talons qui décollent.'],tip:''},
 jump_lunge:{n:'Fentes sautées',m:'Quadriceps, fessiers, explosivité',machine:'Poids du corps',unit:'reps',
  setup:'En fente, genou arrière proche du sol.',steps:['Saute en changeant de jambe en l\'air.','Réception souple en fente.','Enchaîne sans pause.'],err:['Réception jambe tendue.','Genou avant qui rentre.'],tip:'Reps totales, les deux jambes comprises.'},
 in_out:{n:'In and out (abdos assis)',m:'Abdominaux, fléchisseurs de hanche',machine:'Tapis',unit:'sec',
  setup:'Assis, mains derrière les fesses, buste incliné, pieds décollés.',steps:['Ramène les genoux vers la poitrine.','Tends les jambes en avant sans toucher le sol.','Enchaîne en rythme.'],err:['Pieds qui touchent le sol.','Dos rond.'],tip:''},
 plank_hip_dip:{n:'Planche hip dips',m:'Obliques, gainage',machine:'Tapis',unit:'sec',
  setup:'En planche sur les avant-bras, corps aligné.',steps:['Tourne le bassin pour approcher une hanche du sol.','Reviens au centre puis de l\'autre côté.','Garde les épaules au-dessus des coudes.'],err:['Fesses trop hautes.','Mouvement trop rapide.'],tip:''}
});
EX.seated_row.n='Rowing assis machine (seated row)';EX.seated_row.machine='Machine seated row, appui poitrine';
EX.seated_row.setup='Règle le siège pour que les poignées arrivent à hauteur du bas de la poitrine. Poitrine contre l\'appui, pieds à plat.';
EX.seated_row.steps=['Tire les poignées vers toi, coudes le long du corps.','Serre les omoplates 1 s en fin de mouvement.','Allonge les bras lentement sans décoller la poitrine de l\'appui.'];
EX.seated_row.err=['Décoller la poitrine de l\'appui pour tirer.','Hausser les épaules.'];
EX.pec_deck.n='Butterfly (pec deck)';
['incline_db_press','lateral_raise','db_curl','walking_lunge','rdl'].forEach(k=>EX[k].perHand=true);
EX.db_curl.step=2;
const EXG={pecs:['chest_press','bench_press','db_bench','incline_db_press','pec_deck','cable_cross','pushup'],epaules:['shoulder_press','lateral_raise','face_pull'],
 dos:['seated_row','lat_pulldown','db_row','cable_row','pullover'],bras:['machine_curl','ez_curl','db_curl','hammer_curl','cable_curl','triceps_pushdown','triceps_bar','dip_machine','assisted_dip'],
 jambes:['leg_press','leg_curl','leg_extension','hip_thrust','bulgarian_split','goblet_squat','walking_lunge','rdl','calf_raise','eccentric_calf','abductor','air_squat','jump_squat','jump_lunge'],
 abdos:['plank','side_plank','plank_hip_dip','ab_crunch','crunch','dead_bug','in_out','mountain_climber','bird_dog','glute_bridge_single','clamshell'],
 mob:['hip_flexor','hip_9090','thoracic_rot','ankle_mob']};
Object.entries(EXG).forEach(([g,l])=>l.forEach(k=>{if(EX[k])EX[k].g=g}));
const PH={chest_press:'leverage-chest-press',bench_press:'barbell-bench-press-medium-grip',db_bench:'dumbbell-bench-press',incline_db_press:'incline-dumbbell-press',pec_deck:'butterfly',cable_cross:'cable-crossover',pushup:'pushups',
 shoulder_press:'leverage-shoulder-press',lateral_raise:'side-lateral-raise',face_pull:'face-pull',seated_row:'leverage-iso-row',lat_pulldown:'wide-grip-lat-pulldown',db_row:'one-arm-dumbbell-row',cable_row:'seated-cable-rows',pullover:'bent-arm-dumbbell-pullover',
 machine_curl:'machine-bicep-curl',ez_curl:'ez-bar-curl',db_curl:'dumbbell-alternate-bicep-curl',hammer_curl:'alternate-hammer-curl',cable_curl:'standing-biceps-cable-curl',triceps_pushdown:'triceps-pushdown-rope-attachment',triceps_bar:'triceps-pushdown',dip_machine:'dip-machine',
 leg_press:'leg-press',leg_curl:'seated-leg-curl',leg_extension:'leg-extensions',hip_thrust:'barbell-hip-thrust',bulgarian_split:'split-squats',goblet_squat:'goblet-squat',walking_lunge:'dumbbell-lunges',rdl:'stiff-legged-dumbbell-deadlift',calf_raise:'standing-calf-raises',eccentric_calf:'rocking-standing-calf-raise',abductor:'thigh-abductor',air_squat:'bodyweight-squat',jump_squat:'freehand-jump-squat',jump_lunge:'split-jump',
 plank:'plank',side_plank:'side-bridge',ab_crunch:'ab-crunch-machine',crunch:'crunches',dead_bug:'dead-bug',in_out:'seated-leg-tucks',mountain_climber:'mountain-climbers',glute_bridge_single:'single-leg-glute-bridge',hip_flexor:'kneeling-hip-flexor'};
const GROUPS={pecs:'Pectoraux',epaules:'Épaules',dos:'Dos',bras:'Bras',jambes:'Jambes',abdos:'Abdos & gainage',mob:'Mobilité'};

// template exercise: [id, sets, lo, hi]
const TPL=[
 {id:'push_a',type:'muscu',key:'muscu',sub:'push',name:'Pecs / épaules / triceps A',dur:65,hard:false,legs:false,warm:true,desc:'Ta séance de poussée, version haltères et butterfly.',
  ex:[['db_bench',4,8,12],['pec_deck',4,10,12],['shoulder_press',4,8,12],['lateral_raise',3,12,15],['triceps_pushdown',4,10,12],['plank',3,45,60],['crunch',3,15,20]]},
 {id:'push_b',type:'muscu',key:'muscu',sub:'push',name:'Pecs / épaules / triceps B',dur:65,hard:false,legs:false,warm:true,desc:'Version barre et poulies, avec le face pull pour l\'arrière d\'épaule.',
  ex:[['bench_press',4,8,12],['cable_cross',3,12,15],['shoulder_press',4,8,12],['face_pull',3,12,15],['dip_machine',3,10,12],['triceps_bar',3,10,12],['ab_crunch',3,12,15]]},
 {id:'pull_a',type:'muscu',key:'muscu',sub:'pull',name:'Dos / biceps A',dur:60,hard:false,legs:false,warm:true,desc:'Tirages machine puis travail unilatéral et biceps.',
  ex:[['seated_row',4,8,12],['lat_pulldown',4,8,12],['db_row',3,10,12],['db_curl',3,10,12],['hammer_curl',3,10,12]]},
 {id:'pull_b',type:'muscu',key:'muscu',sub:'pull',name:'Dos / biceps B',dur:60,hard:false,legs:false,warm:true,desc:'Grand dorsal en priorité, curls machine et barre EZ.',
  ex:[['lat_pulldown',4,8,12],['cable_row',3,10,12],['pullover',3,10,12],['machine_curl',3,10,12],['ez_curl',3,10,12],['face_pull',3,12,15]]},
 {id:'legs',type:'muscu',key:'muscu',sub:'bas',name:'Jambes & gainage',dur:55,hard:true,legs:true,warm:true,desc:'La pièce manquante de ta routine : protège genoux et chevilles pour le foot, le squash et la course.',
  ex:[['leg_press',4,8,12],['leg_curl',3,10,12],['bulgarian_split',3,8,10],['hip_thrust',3,10,12],['calf_raise',3,12,15],['side_plank',2,30,45]]},
 {id:'home_circuit',type:'renfo',key:'renfo',sub:'full',name:'Full body maison · circuit × 4',dur:35,hard:true,legs:true,loc:['maison','exterieur'],circuit:4,desc:'Ton circuit maison : 4 tours, 2 min de repos entre les tours.',
  ex:[['pushup',4,10,12],['mountain_climber',4,60,60],['air_squat',4,10,15],['in_out',4,45,60],['jump_lunge',4,10,12],['plank_hip_dip',4,45,60]]},
 {id:'renfo_run',type:'renfo',key:'renfo',name:'Renfo du coureur',dur:30,hard:false,legs:true,desc:'Prévention des blessures : fessiers, mollets, gainage.',
  ex:[['glute_bridge_single',3,10,12],['clamshell',3,15,20],['eccentric_calf',3,10,12],['bulgarian_split',3,8,10],['side_plank',3,30,45],['bird_dog',2,10,12]]},
 {id:'core',type:'renfo',key:'renfo',name:'Gainage 20 min',dur:20,hard:false,legs:false,desc:'Sangle abdominale et lombaires.',
  ex:[['plank',3,40,60],['side_plank',3,30,45],['dead_bug',3,10,12],['bird_dog',3,10,12]]},
 {id:'circuit',type:'renfo',key:'renfo',name:'Circuit cardio-renfo',dur:25,hard:true,legs:false,desc:'4 tours enchaînés, 1 min 30 de repos entre les tours. Dépense élevée.',
  ex:[['jump_squat',4,12,15],['pushup',4,10,15],['mountain_climber',4,30,40],['walking_lunge',4,10,12],['plank',4,30,40]]},
 {id:'ef',type:'run',key:'run_e',name:'Endurance fondamentale',dur:40,hard:false,legs:false,desc:'La base de 80 % de ton volume de course.',run:'ef'},
 {id:'recup',type:'run',key:'run_e',name:'Footing récup + lignes droites',dur:30,hard:false,legs:false,desc:'Très facile, avec quelques accélérations pour la foulée.',run:'recup'},
 {id:'frac_court',type:'run',key:'run_q',name:'Fractionné court 10 × 400 m',dur:45,hard:true,legs:false,desc:'Développe la vitesse maximale aérobie (VMA).',run:'frac_court'},
 {id:'frac_long',type:'run',key:'run_q',name:'Fractionné long 5 × 1000 m',dur:50,hard:true,legs:false,desc:'Travail à allure 5 km, le cœur de la progression sur 5 et 10 km.',run:'frac_long'},
 {id:'seuil',type:'run',key:'run_q',name:'Seuil 3 × 8 min',dur:45,hard:true,legs:false,desc:'Repousse le seuil lactique : tu tiens plus vite plus longtemps.',run:'seuil'},
 {id:'longue',type:'run',key:'run_l',name:'Sortie longue',dur:70,hard:false,legs:false,desc:'Endurance et économie de course. Idéal le week-end.',run:'longue'},
 {id:'mobilite',type:'mob',key:'mob',name:'Mobilité 20 min',dur:20,hard:false,legs:false,desc:'Hanches, chevilles, haut du dos. Récupération active.',
  ex:[['hip_flexor',2,45,60],['hip_9090',2,60,60],['thoracic_rot',2,8,10],['ankle_mob',2,10,12]]}
];
TPL.push(
 {id:'velo_z2',type:'cardio',key:'cardio',sport:'velo_salle',name:'Vélo en salle endurance',dur:45,hard:false,legs:false,loc:['salle'],desc:'Endurance sans impact : idéal le lendemain du foot ou d\'une séance intense.',cardio:'velo_z2'},
 {id:'velo_hiit',type:'cardio',key:'cardio_q',sport:'velo_salle',name:'Vélo fractionné 8 × 1 min',dur:35,hard:true,legs:false,loc:['salle'],desc:'Intensité élevée, faible impact articulaire.',cardio:'velo_hiit'},
 {id:'marche_incl',type:'cardio',key:'cardio',sport:'marche_incl',name:'Marche inclinée',dur:40,hard:false,legs:false,loc:['salle'],desc:'Cardio doux qui brûle beaucoup sans fatiguer. Parfait après la muscu.',cardio:'marche_incl'},
 {id:'escaliers_int',type:'cardio',key:'cardio_q',sport:'escaliers',name:'Escaliers intervalles',dur:25,hard:true,legs:true,loc:['salle'],desc:'Cardio intense et renfo des jambes en même temps.',cardio:'escaliers_int'});
const LOC={cardio:['salle'],muscu:['salle'],renfo:['salle','maison','exterieur'],run:['exterieur','salle'],mob:['salle','maison','exterieur']};
TPL.forEach(t=>{t.loc=t.loc||LOC[t.type];if(['ef','recup','longue','velo_z2','marche_incl'].includes(t.id))t.flex=true});
const TPLBY=Object.fromEntries(TPL.map(t=>[t.id,t]));

/* ================= UTILS ================= */
const pad2=n=>String(n).padStart(2,'0');
const iso=d=>d.getFullYear()+'-'+pad2(d.getMonth()+1)+'-'+pad2(d.getDate());
const parseD=s=>{const [y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)};
const today=()=>iso(new Date());
const addDays=(s,n)=>{const d=parseD(s);d.setDate(d.getDate()+n);return iso(d)};
const mondayOf=s=>{const d=parseD(s);d.setDate(d.getDate()-((d.getDay()+6)%7));return iso(d)};
const daysBetween=(a,b)=>Math.round((parseD(b)-parseD(a))/864e5);
const uid=()=>Math.random().toString(36).slice(2,9)+Date.now().toString(36);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clone=o=>JSON.parse(JSON.stringify(o));
function toSec(str){if(str==null||str==='')return null;const p=String(str).trim().split(':').map(Number);if(p.some(isNaN))return null;return p.length===3?p[0]*3600+p[1]*60+p[2]:p.length===2?p[0]*60+p[1]:p[0]*60}
function fmtSec(s){if(s==null||!isFinite(s))return '–';s=Math.round(s);const h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=s%60;return h?`${h}:${pad2(m)}:${pad2(x)}`:`${m}:${pad2(x)}`}
const fmtPace=s=>fmtSec(s);
const DOWS=['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];
const fmtDay=s=>parseD(s).toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'});
const fmtShort=s=>parseD(s).toLocaleDateString('fr-FR',{day:'numeric',month:'short'});
const num=v=>{const n=parseFloat(String(v).replace(',','.'));return isNaN(n)?null:n};

/* ================= STATE ================= */
const LS='carnet-sport-v1';
const DEFAULT_PROFILE={goal:'mixte',level:'debutant',ref5k:'27:30',cycleStart:mondayOf(today()),
  avail:{1:60,2:45,3:0,4:60,5:0,6:75,0:60},recurring:[{id:'r1',dow:1,sport:'foot',dur:90}]};
let S={profile:clone(DEFAULT_PROFILE),sessions:[],tests:[],example:false};
let UI={view:'today',calMonth:today().slice(0,7),selDay:today(),exGroup:'haut',exQuery:'',exOpenId:null,progEx:null};
let ED=null; // session in editor
let sync={mode:'local',db:null,uid:null,uploaded:false};

function loadLocal(){try{const r=localStorage.getItem(LS);if(r){const d=JSON.parse(r);return d}}catch(e){}return null}
function saveLocal(){if(S.example)return;try{localStorage.setItem(LS,JSON.stringify({profile:S.profile,sessions:S.sessions,tests:S.tests,touched:true}))}catch(e){}}

/* ================= TRAINING LOGIC ================= */
function paces(){
  const t5=toSec(S.profile.ref5k)||toSec('27:30');const p5=t5/5;
  return {p5,ef:[p5*1.22,p5*1.34],seuil:p5*1.06,i400:p5*0.96,p10:p5*1.0425};
}
function runPlan(kind,dur,lieu){
  const P=paces(),f=fmtPace;const tap=lieu==='salle'?' Sur tapis : inclinaison 1 % pour compenser l\'absence de vent.':'';
  switch(kind){
    case 'ef':return `${dur||40} min à ${f(P.ef[0])} – ${f(P.ef[1])} /km. Tu dois pouvoir parler en phrases complètes (zone 2).`+tap;
    case 'recup':return `${dur||30} min très facile, plus lent que ${f(P.ef[1])} /km. Termine par 6 lignes droites de 80 m en accélération progressive, retour en marchant.`+tap;
    case 'frac_court':return `Échauffement 15 min en EF + 3 accélérations. 10 × 400 m à ${f(P.i400)} /km (≈ ${fmtSec(P.i400*0.4)} par 400 m), récup 1 min 30 en trottinant. Retour au calme 10 min.`+tap;
    case 'frac_long':return `Échauffement 15 min en EF. 5 × 1000 m à ${f(P.p5)} /km (allure 5 km), récup 2 min en trottinant. Retour au calme 10 min.`+tap;
    case 'seuil':return `Échauffement 15 min en EF. 3 × 8 min à ${f(P.seuil)} /km (confortablement difficile), récup 2 min. Retour au calme 10 min.`+tap;
    case 'longue':return `${dur||70} min à ${f(P.ef[0])} – ${f(P.ef[1])} /km. Les 10 dernières minutes un peu plus vite si tu te sens bien. Bois si tu dépasses 60 min.`+tap;
  }return '';
}
function classifyRun(durMin,paceSec){const P=paces();if(paceSec&&paceSec<=P.p5*1.08)return 'run_q';if(durMin>=60)return 'run_l';return 'run_e'}
function cardioPlan(kind,dur){switch(kind){
  case 'velo_z2':return `${dur} min à allure régulière, cadence 85 à 95 tr/min, résistance qui te laisse parler (zone 2, environ 65 à 75 % de ta FC max).`;
  case 'velo_hiit':return `10 min d'échauffement progressif. 8 × 1 min fort (RPE 9, cadence 100+) / 2 min très facile. 5 min de retour au calme.`;
  case 'marche_incl':return `${dur} min à 5,5 – 6 km/h, inclinaison 10 à 12 %. Ne te tiens pas aux barres : bras libres, buste droit.`;
  case 'escaliers_int':return `5 min lent pour chauffer. 6 × 2 min rythme soutenu / 1 min lent. 5 min de retour au calme. Ne t'appuie pas sur les rampes.`;}return ''}
function normKey(k){const g=S.profile.goal;const t=(GOALS[g]||GOALS.mixte).targets;
  if(k==='run_l'&&!t.run_l)return 'run_e';
  if(g==='running'){if(['cardio','sport_m','sport_i','cardio_q'].includes(k))return 'x_'+k;return k}
  if(k==='cardio'||k==='sport_m')return 'run_e';if(k==='sport_i'||k==='cardio_q')return 'run_q';return k}
const done=()=>S.sessions.filter(s=>s.status==='done');
const sLoad=s=>(s.duration||0)*(s.rpe||5);
function acwr(ref=today()){
  const d=done();const acute=d.filter(s=>{const x=daysBetween(s.date,ref);return x>=0&&x<7}).reduce((a,s)=>a+sLoad(s),0);
  const chronicSum=d.filter(s=>{const x=daysBetween(s.date,ref);return x>=0&&x<28}).reduce((a,s)=>a+sLoad(s),0);
  const chronic=chronicSum/4;return {acute,chronic,ratio:chronic>0?acute/chronic:null};
}
function acwrState(r){if(r==null)return{c:'neutral',t:'Pas assez d\'historique'};if(r<0.8)return{c:'warn',t:'Sous-charge'};if(r<=1.3)return{c:'ok',t:'Zone optimale'};if(r<=1.5)return{c:'warn',t:'Vigilance'};return{c:'bad',t:'Risque de surcharge'}}
function isDeload(date){const w=Math.floor(daysBetween(S.profile.cycleStart||date,mondayOf(date))/7);return w>=0&&w%4===3}

function sessMeta(s){const t=TPLBY[s.tplId];const sp=SPORTS[sportOf(s)]||{};return{key:s.key||t?.key||sp.key||(s.type==='run'?'run_e':s.type),legs:s.legs??t?.legs??sp.legs??false,hard:s.hard??t?.hard??sp.hard??((s.rpe||0)>=8),sub:s.sub||t?.sub}}
function sportSession(sport,date,o={}){const sp=SPORTS[sport];const s={id:uid(),date,type:sp.type,sport,key:sp.key||(sp.type==='run'?'run_e':sp.type),title:sp.n,status:'planned',duration:60,rpe:null,notes:'',legs:!!sp.legs,hard:!!sp.hard,...o};if(sp.type==='run'){s.distance=s.distance||'';s.time=s.time||'';s.hr=s.hr||''}if((sp.type==='muscu'||sp.type==='renfo')&&!s.exercises)s.exercises=[];return s}

// Rank templates for a date. pool = sessions considered as already happening. crit = {forme, lieu}
function rankTemplates(date,pool,avail,crit={}){
  const g=GOALS[S.profile.goal]||GOALS.mixte;const targets=g.targets;const order=Object.keys(targets);
  const ws=mondayOf(date);const forme=+crit.forme||3;const lieu=crit.lieu||null;
  const before=pool.filter(s=>s.date<date).sort((a,b)=>a.date<b.date?1:-1);
  const counts={};pool.filter(s=>s.date>=ws&&s.date<date).forEach(s=>{const k=normKey(sessMeta(s).key,targets);counts[k]=(counts[k]||0)+1});
  const last=pred=>before.find(s=>pred(sessMeta(s),s));
  const lastLegs=last(m=>m.legs),lastHard=last(m=>m.hard),lastMuscu=last(m=>m.key==='muscu');
  const dLegs=lastLegs?daysBetween(lastLegs.date,date):99,dHard=lastHard?daysBetween(lastHard.date,date):99;
  const km7=pool.filter(s=>s.type==='run'&&s.status==='done'&&daysBetween(s.date,date)>=1&&daysBetween(s.date,date)<=7).reduce((a,s)=>a+(num(s.distance)||0),0);
  const r=acwr(date).ratio;const deload=isDeload(date);
  const tmr=addDays(date,1);const recT=(S.profile.recurring||[]).filter(r=>+r.dow===parseD(tmr).getDay()&&SPORTS[r.sport]).map(r=>sportSession(r.sport,tmr,{duration:+r.dur}));
  const nextHard=[...pool,...S.sessions,...recT].find(s=>s.date===tmr&&s.status!=='done'&&(sessMeta(s).hard||sessMeta(s).legs));
  const out=[];
  for(const t of TPL){
    if(lieu&&!t.loc.includes(lieu))continue;
    const fits=t.flex?avail>=(t.id==='longue'?60:25):t.dur<=avail+5;if(!fits)continue;
    const dur=t.flex?Math.min(avail,{longue:100,ef:60,recup:40}[t.id]):t.dur;
    const k=normKey(t.key,targets);const deficit=(targets[k]||0)-(counts[k]||0);
    let score=deficit*10-order.indexOf(k)*0.5;const why=[];
    if(deficit>0)why.push(`${keyLabel(k)} : ${counts[k]||0}/${targets[k]} cette semaine pour ton objectif.`);
    if(t.legs&&dLegs<2){score-=100;why.push('Attention : jambes travaillées il y a moins de 48 h.')}
    if(t.hard&&dHard<=1){score-=60}
    if(t.key==='run_q'&&dLegs<=1){score-=80}
    if(t.hard&&r!=null&&r>1.3){score-=40}
    if(t.hard&&deload){score-=20}
    if(nextHard&&(t.legs||t.hard)){score-=35;why.push(`Demain : ${esc(nextHard.title)}. On garde les jambes fraîches.`)}
    else if(nextHard&&!t.legs&&!t.hard)why.push(`Demain : ${esc(nextHard.title)}. Séance choisie pour arriver frais.`);
    if(forme<=2){if(t.hard)score-=50;if(t.legs)score-=15;if(t.type==='mob')score+=25;if(t.id==='recup')score+=15}
    if(forme===1&&t.type!=='mob')score-=30;
    if(forme>=5&&t.hard&&dHard>=2)score+=6;
    if(forme===4&&t.hard&&dHard>=2)score+=3;
    if(t.type==='run'&&km7>=25&&!t.hard)score-=3;
    if(t.key==='muscu'&&lastMuscu){const ls=sessMeta(lastMuscu).sub;if(ls===t.sub&&t.sub!=='full')score-=15;else if(ls&&ls!==t.sub&&t.sub!=='full')why.push(`Alternance : ta dernière séance de muscu était ${SUBL[ls]||ls}.`);
      const prevM=before.filter(s=>sessMeta(s).key==='muscu'&&sessMeta(s).sub)[1];if(prevM&&sessMeta(prevM).sub===t.sub)score-=5}
    const lastSame=before.find(s=>sessMeta(s).key===t.key);if(lastSame&&lastSame.tplId===t.id)score-=6;
    if(!t.flex&&t.dur>avail)score-=3;
    if(!t.flex&&t.dur>=avail-20)score+=2;
    if(t.hard&&dHard>=2&&forme>=3)why.push('48 h de récupération depuis ta dernière séance intense.');
    if(!t.legs&&lastLegs&&dLegs<2)why.push(('Tes jambes récupèrent de la séance du '+fmtShort(lastLegs.date)+'.').replace('..','.'));
    if(lastHard&&dHard<=1&&!t.hard)why.push('Séance intense la veille ('+esc(lastHard.title)+') : on reste modéré.');
    if(forme<=2&&!t.hard)why.push(`Forme « ${FORME[forme].toLowerCase()} » : priorité à la récupération.`);
    if(forme>=4&&t.hard&&dHard>=2)why.push('Bonne forme et récupération suffisante : bon jour pour de la qualité.');
    if(t.type==='run'&&km7>0)why.push(`${km7.toFixed(1)} km courus sur les 7 derniers jours.`);
    if(deload)why.push('Semaine allégée (4e semaine du cycle) : une série de moins, running raccourci.');
    if(r!=null&&r>1.3)why.push(`Ratio charge aiguë/chronique à ${r.toFixed(2)} : évite d'empiler l'intensité.`);
    out.push({tpl:t,score,deficit,why,dur});
  }
  return out.sort((a,b)=>b.score-a.score);
}
const SUBL={push:'pecs / épaules / triceps',pull:'dos / biceps',bas:'jambes',haut:'haut du corps',full:'full body'};
function pickBest(date,pool,avail,crit){return rankTemplates(date,pool,avail,crit)[0]||null}
const rStep=(v,st)=>Math.round(v/st)*st;
const kgTxt=e=>e.perHand?' kg par haltère':' kg';
function suggestion(exId,lo,hi,beforeDate){
  const e=EX[exId];if(!e)return{load:'',txt:''};const step=e.step||2.5;
  const hist=done().filter(s=>s.date<=beforeDate&&(s.exercises||[]).some(x=>x.exId===exId&&x.sets.some(st=>num(st.reps)>0)))
    .sort((a,b)=>a.date<b.date?1:-1);
  if(!hist.length)return{load:'',txt:e.unit==='kg'?'Première fois : choisis une charge qui te laisse 2 à 3 reps en réserve à la dernière rep.':''};
  const s=hist[0];const x=s.exercises.find(x=>x.exId===exId);const w=x.sets.filter(st=>num(st.reps)>0);const reps=w.map(st=>num(st.reps));
  if(e.unit!=='kg'){const top=reps.every(r=>r>=hi);return{load:'',txt:top?`La dernière fois : ${reps.join(' / ')}. Monte d'un cran : ${e.unit==='sec'?'+5 s':'+2 reps'} par série.`:`La dernière fois : ${reps.join(' / ')}. Vise ${hi}${e.unit==='sec'?' s':' reps'} sur chaque série.`}}
  const loadsOf=xx=>xx.sets.filter(st=>num(st.reps)>0).map(st=>num(st.load)).filter(v=>v!=null&&v>0);
  const loads=loadsOf(x);
  const gap=daysBetween(s.date,beforeDate);
  if(gap>28){
    const recent=hist.filter(h=>daysBetween(h.date,s.date)<=42).flatMap(h=>loadsOf(h.exercises.find(y=>y.exId===exId)));
    if(!recent.length)return{load:'',txt:`Dernière trace le ${fmtShort(s.date)} sans charge notée. Choisis une charge qui laisse 2 à 3 reps en réserve.`};
    const best=e.assist?Math.min(...recent):Math.max(...recent);const nl=Math.max(0,rStep(best*(e.assist?1.1:0.9),step));
    return{load:nl,txt:`Reprise : ta meilleure charge récente est ${best}${kgTxt(e)} (dernière trace le ${fmtShort(s.date)}). On repart à ${nl}${kgTxt(e)}, vise ${hi} reps sur chaque série, puis la charge remonte.`};
  }
  if(!loads.length)return{load:'',txt:`La dernière fois : ${reps.join(' / ')} reps, sans charge notée.`};
  const L=e.assist?Math.min(...loads):Math.max(...loads);
  const allTop=reps.every(r=>r>=hi);const under=reps.filter(r=>r<lo).length>=2;
  if(allTop){const nl=e.assist?Math.max(0,L-step):L+step;return{load:nl,txt:`Toutes tes séries au sommet (${reps.join(' / ')}) le ${fmtShort(s.date)} : passe à ${nl}${kgTxt(e)}${e.assist?' d\'assistance':''}.`}}
  if(under)return{load:L,txt:`Séries sous ${lo} reps la dernière fois : reste à ${L}${kgTxt(e)} et soigne l'exécution.`};
  return{load:L,txt:`Même charge (${L}${kgTxt(e)}) : ajoute 1 rep par série jusqu'à ${hi}, puis la charge monte.`};
}

function instantiate(t,date,opts={}){
  const deload=isDeload(date);
  const s={id:uid(),date,type:t.type,key:t.key,sub:t.sub||null,tplId:t.id,title:t.name,status:'planned',
    duration:Math.round((opts.dur||t.dur)*(deload&&t.type==='run'?0.75:1)),rpe:null,legs:t.legs,hard:t.hard,notes:'',auto:!!opts.auto,lieu:opts.lieu||null};
  if(t.ex)s.exercises=t.ex.map(([id,n,lo,hi])=>{const sets=Math.max(1,n-(deload?1:0));const sg=suggestion(id,lo,hi,date);
    return{exId:id,lo,hi,sets:Array.from({length:sets},()=>({reps:'',load:sg.load===''?'':sg.load,ok:false}))}});
  if(t.warm)s.plan='Échauffement : vélo 10 min en montée progressive (cadence 85 à 90). Première série de chaque machine à 50 % de la charge, 10 reps.';
  if(t.circuit)s.plan=`${t.circuit} tours enchaînés, sans pause entre les exercices. 2 min de repos entre les tours.`;
  s.sport=t.sport||(t.type==='run'?(opts.lieu==='salle'?'course_tapis':'course'):DEFSPORT[t.type]);
  if(t.cardio)s.plan=cardioPlan(t.cardio,s.duration);
  if(t.run){s.plan=runPlan(t.run,s.duration,opts.lieu)+(deload?' Semaine allégée : raccourcis de 25 %.':'');s.distance='';s.time='';s.hr=''}
  return s;
}

function generateWeek(weekStart,from){
  const t0=from||today();
  const keep=S.sessions.filter(s=>!(s.auto&&s.status==='planned'&&s.date>=weekStart&&s.date<=addDays(weekStart,6)&&s.date>=t0));
  const removed=S.sessions.filter(s=>!keep.includes(s));
  const pool=[...keep];const created=[];
  for(let i=0;i<7;i++){const d=addDays(weekStart,i);if(d<t0)continue;const dow=parseD(d).getDay();
    (S.profile.recurring||[]).filter(r=>+r.dow===dow&&SPORTS[r.sport]).forEach(r=>{if(pool.some(s=>s.date===d&&sportOf(s)===r.sport))return;
      const s=sportSession(r.sport,d,{duration:+r.dur||60,auto:true,recurring:true});pool.push(s);created.push(s)})}
  for(let i=0;i<7;i++){const d=addDays(weekStart,i);if(d<t0)continue;
    if(pool.some(s=>s.date===d))continue;
    const av=+S.profile.avail[parseD(d).getDay()]||0;if(!av)continue;
    const b=pickBest(d,pool,av);if(!b||b.deficit<=0||b.score<-20)continue;
    const s=instantiate(b.tpl,d,{auto:true,dur:b.dur});pool.push(s);created.push(s)}
  return{created,removed};
}

/* ================= EXAMPLE DATA ================= */
function buildExamples(){
  const base={bench_press:35,db_bench:14,cable_cross:17.5,triceps_bar:27.5,dip_machine:25,hammer_curl:8,ez_curl:25,machine_curl:22.5,db_row:14,cable_row:17.5,pullover:14,ab_crunch:27.5,chest_press:30,lat_pulldown:35,shoulder_press:17.5,seated_row:30,lateral_raise:5,cable_curl:12.5,triceps_pushdown:12.5,leg_press:70,leg_curl:25,leg_extension:25,hip_thrust:40,calf_raise:40,goblet_squat:14,rdl:12,walking_lunge:6,incline_db_press:12,pec_deck:25,face_pull:10,assisted_dip:45,db_curl:8,abductor:30};
  const pattern={2:'push_a',3:'ef',4:'pull_a',6:'frac_long',0:'renfo_run'};const alt={2:'push_b',3:'velo_z2',4:'pull_b',6:'seuil',0:'longue'};
  const out=[];const t0=today();const start=addDays(mondayOf(t0),-35);
  for(let i=0;i<35+((parseD(t0).getDay()+6)%7);i++){const d=addDays(start,i);if(d>=t0)break;const dow=parseD(d).getDay();const w=Math.floor(i/7);
    if(dow===1){const f=sportSession('foot',d,{status:'done',example:true,duration:90,rpe:8,result:['V','D','V','N','V'][w%5],score:['5-3','2-4','6-5','3-3','4-2'][w%5],goals:String(w%3)});out.push(f)}
    let id=(w%2?alt:pattern)[dow];if(!id)continue;if(w===2&&dow===0)continue;
    const t=TPLBY[id];const s=instantiate(t,d);s.status='done';s.example=true;s.auto=false;
    s.rpe=t.hard?8:t.type==='renfo'?6:t.type==='run'?4:7;
    if(s.exercises)s.exercises.forEach(x=>{const e=EX[x.exId];const b=base[x.exId];
      x.sets.forEach((st,k)=>{st.ok=true;if(e.unit==='kg'){const lvl=Math.floor(w/2);st.load=e.assist?Math.max(0,b-lvl*e.step):b+lvl*e.step;st.reps=Math.max(x.lo,Math.min(x.hi,x.lo+(w%2)*2+2-k))}else st.reps=x.hi-(k>1?1:0)})});
    if(t.type==='run'){const P=paces();const f=1.04-w*0.012;const pace=(t.key==='run_q'?P.p5*1.05:P.ef[0]*1.05)*f;s.time=fmtSec(s.duration*60);s.distance=((s.duration*60)/pace).toFixed(1);s.hr=t.key==='run_q'?168:142}
    out.push(s)}
  return out;
}
function exampleTests(){const t0=today();return[{id:'e1',date:addDays(t0,-33),kind:'5k',value:'28:40',example:true},{id:'e2',date:addDays(t0,-12),kind:'5k',value:'27:35',example:true},{id:'e3',date:addDays(t0,-33),kind:'poids',value:'82',example:true},{id:'e4',date:addDays(t0,-19),kind:'poids',value:'81.2',example:true},{id:'e5',date:addDays(t0,-4),kind:'poids',value:'80.6',example:true}]}
function enterExamples(){S.example=true;S.sessions=buildExamples();S.tests=exampleTests();const g=generateWeek(mondayOf(today()));g.created.forEach(s=>s.example=true);S.sessions.push(...g.created)}
function leaveExamples(){if(!S.example)return;S.example=false;S.sessions=S.sessions.filter(s=>!s.example);S.tests=S.tests.filter(t=>!t.example)}

/* ================= SYNC (db capability) ================= */
const chains={};
function queue(k,fn){chains[k]=(chains[k]||Promise.resolve()).then(fn).catch(e=>{console.warn(e);setSyncMode('err')})}
const profRef=()=>sync.db.doc('data/users/'+sync.uid+'/profile');
const sessCol=()=>profRef().collection('sessions');
const strip=s=>{const c=clone(s);delete c.example;return c};
function persistSession(s){saveLocal();if(sync.db&&sync.uid)queue('s'+s.id,()=>sessCol().doc(s.id).set(strip(s)))}
function persistDelete(id){saveLocal();if(sync.db&&sync.uid)queue('s'+id,()=>sessCol().doc(id).delete())}
function persistProfile(){saveLocal();if(sync.db&&sync.uid)queue('profile',()=>profRef().set({profile:S.profile,tests:S.tests.filter(t=>!t.example),updatedAt:Date.now()}))}
function makeReal(){if(S.example){leaveExamples();persistProfile();S.sessions.forEach(persistSession)}}
function setSyncMode(m){sync.mode=m;if(UI.view==='settings')render()}

async function initSync(){
  if(!window.claude?.use)return;
  const [db,user]=await Promise.all([window.claude.use('db'),window.claude.use('user')]);
  if(!db||!user)return;const id=await user.id();if(!id)return;
  sync.db=db;sync.uid=id;setSyncMode('cloud');
  let profSeen=false,sessSeen=false;
  profRef().onSnapshot(snap=>{
    if(snap.exists){const d=snap.data();if(d.profile){leaveExamplesKeep();S.profile={...DEFAULT_PROFILE,...clone(d.profile)};S.tests=clone(d.tests||[])}saveLocal();render();maybeAutoStrava()}
    else if(!profSeen&&!S.example){persistProfile()}
    profSeen=true;
  },e=>console.warn(e));
  sessCol().onSnapshot(snap=>{
    const remote=snap.docs.map(d=>clone(d.data()));
    if(!sessSeen&&remote.length===0&&!S.example&&S.sessions.length){S.sessions.forEach(persistSession)}
    else if(remote.length){if(S.example){S.example=false;S.tests=S.tests.filter(t=>!t.example)}S.sessions=remote;saveLocal();render();if(ED)renderSheet()}
    sessSeen=true;
  },e=>console.warn(e));
}
function leaveExamplesKeep(){S.example=false;S.sessions=S.sessions.filter(s=>!s.example);S.tests=S.tests.filter(t=>!t.example)}

/* ================= RENDER: SHELL ================= */
const ICONS={
 today:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/></svg>',
 cal:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
 lib:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h10"/></svg>',
 ex:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 8v8M18 8v8M3 10v4M21 10v4M6 12h12"/></svg>',
 prog:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 20h18M5 16l5-5 4 3 6-7"/></svg>',
 set:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/></svg>'
};
const NAV=[['today','Aujourd\'hui','today'],['calendar','Calendrier','cal'],['library','Séances','lib'],['exercises','Exercices','ex'],['progress','Progrès','prog'],['settings','Réglages','set']];
function renderNav(){
  const items=NAV.map(([v,l,i])=>`<button class="tab" data-a="nav" data-v="${v}" ${UI.view===v?'aria-current="page"':''}>${ICONS[i]}<span>${l}</span></button>`).join('');
  document.getElementById('tabbar').innerHTML=items;
  document.getElementById('rail').innerHTML=`<div class="brand">Carnet Sport<small>Entraînement de Nicolas</small></div>`+items;
}
function render(){renderNav();const m=document.getElementById('main');
  const banner=S.example?`<div class="banner"><span><b>Données d'exemple.</b> Elles montrent l'app en situation et disparaissent dès ta première séance enregistrée.</span><button class="btn sm" data-a="clearEx">Partir de zéro</button></div>`:'';
  m.innerHTML=banner+({today:vToday,calendar:vCalendar,library:vLibrary,exercises:vExercises,progress:vProgress,settings:vSettings}[UI.view])();figStart()}

function typeChip(type){return `<span class="chip t-${type}"><span class="dot"></span>${TYPES[type].label}</span>`}
function sessItem(s){
  const sp=sportOf(s);const extra=(s.distance&&num(s.distance)?` · ${s.distance} km`:'')+(s.result?` · ${RESULT[s.result]}${s.score?' '+esc(s.score):''}`:'');
  const st=s.status==='done'?`<span class="pill ok">Faite${s.rpe?' · RPE '+s.rpe:''}</span>`:`<span class="pill neutral">Prévue</span>`;
  return `<button class="sitem t-${s.type}" data-a="open" data-id="${s.id}"><span class="stripe"></span><span class="main"><span class="ttl">${esc(s.title)}</span><br><span class="meta tn">${SPORTS[sp].n} · ${s.duration||'?'} min${extra}</span></span>${st}</button>`;
}

/* ================= VIEW: TODAY ================= */
function critDefaults(){const av=+S.profile.avail[parseD(today()).getDay()]||45;return{time:av,forme:3,lieu:S.profile.lieu||'salle'}}
function seg(name,val,opts){return `<div class="seg" role="group">${opts.map(([v,l])=>`<button data-a="crit" data-k="${name}" data-v="${v}" aria-pressed="${String(val)===String(v)}">${l}</button>`).join('')}</div>`}
function recoCard(){
  const c=UI.crit||(UI.crit=critDefaults());const t0=today();
  const list=rankTemplates(t0,done(),+c.time,{forme:c.forme,lieu:c.lieu});
  const best=list[0];const alts=list.slice(1).filter(x=>x.tpl.type!==best?.tpl.type||x.tpl.sub!==best?.tpl.sub).slice(0,2);
  const crit=`<div class="crit">
    <div><div class="eyebrow" style="margin-bottom:4px">Temps dispo</div>${seg('time',c.time,[[20,'20'],[30,'30'],[45,'45'],[60,'60'],[75,'75'],[90,'90'],[120,'2 h']])}</div>
    <div><div class="eyebrow" style="margin-bottom:4px">Forme</div>${seg('forme',c.forme,Object.entries(FORME))}</div>
    <div><div class="eyebrow" style="margin-bottom:4px">Lieu</div>${seg('lieu',c.lieu,Object.entries(LIEUX))}</div></div>`;
  if(!best)return `<div class="card stack">${crit}<div class="empty">Aucune séance ne tient dans ${c.time} min à cet endroit. Monte le temps dispo ou change de lieu.</div></div>`;
  const t=best.tpl;const restFirst=+c.forme===1;
  const plan=t.run?`<div class="plan">${esc(runPlan(t.run,best.dur,c.lieu))}</div>`:'';
  return `<div class="hero t-${t.type}">${crit}
    <div class="spread"><span class="eyebrow">Séance du jour sur mesure</span>${typeChip(t.type)}</div>
    ${restFirst?`<div class="sugg">Forme « épuisé » : le repos complet est aussi un bon choix aujourd'hui. Sinon, voici l'option la plus douce.</div>`:''}
    <div class="big">${esc(t.name)}</div><div class="muted tn">${best.dur} min · ${esc(t.desc)}</div>${plan}
    ${best.why.length?`<div><div class="eyebrow" style="margin-bottom:4px">Pourquoi cette séance</div><ul class="why">${best.why.slice(0,4).map(w=>`<li>${w}</li>`).join('')}</ul></div>`:''}
    <div class="row"><button class="btn primary" data-a="startReco" data-t="${t.id}" data-dur="${best.dur}">Démarrer</button><button class="btn" data-a="planReco" data-t="${t.id}" data-dur="${best.dur}">Ajouter au calendrier</button></div>
    ${alts.length?`<div class="alts"><div class="eyebrow">Autres options</div>${alts.map(x=>`<div class="alt"><span>${typeChip(x.tpl.type)} <b>${esc(x.tpl.name)}</b> <span class="muted tn">${x.dur} min</span></span><button class="btn sm" data-a="startReco" data-t="${x.tpl.id}" data-dur="${x.dur}">Démarrer</button></div>`).join('')}</div>`:''}
  </div>`;
}
function quickLogCard(){
  const rpeOpts=Array.from({length:10},(_,i)=>`<option value="${i+1}" ${i===4?'selected':''}>${i+1} · ${RPE_TXT[i+1]}</option>`).join('');
  return `<div class="card stack"><div class="spread"><h2>J'ai fait une séance</h2><span class="small muted">Le plan de la semaine se réajuste</span></div>
   <div class="fields"><label class="f">Activité<select id="qlType">${sportOptions('course')}</select></label>
    <label class="f">Date<input type="date" id="qlDate" value="${today()}"></label>
    <label class="f ql-dist">Distance (km)<input type="text" id="qlDist" inputmode="decimal" placeholder="11.5"></label>
    <label class="f ql-run">Allure (/km)<input type="text" id="qlPace" placeholder="6:00"></label>
    <label class="f">Durée (min)<input type="number" id="qlDur" inputmode="numeric" placeholder="auto en running"></label>
    <label class="f ql-sport" hidden>Résultat<select id="qlRes"><option value="">–</option>${Object.entries(RESULT).map(([k,l])=>`<option value="${k}">${l}</option>`).join('')}</select></label>
    <label class="f ql-sport" hidden>Score<input type="text" id="qlScore" placeholder="6-4 6-3, 5-3…"></label>
    <label class="f">Effort ressenti<select id="qlRpe">${rpeOpts}</select></label></div>
   <label class="f">Notes<input type="text" id="qlNotes" placeholder="Parcours, sensations, séance de salle faite…"></label>
   <div class="row"><button class="btn primary" data-a="quickLog">Enregistrer</button><span class="small muted">Pour détailler séries et charges, ouvre la séance ensuite depuis le calendrier.</span></div></div>`;
}
function stravaLine(){
  const p=S.profile;const st=UI.strava||{};
  const msg=st.state==='loading'?'Synchronisation…':st.state==='error'?`<span style="color:var(--bad)">${esc(st.msg)}</span>`:p.strava?`Connecté${p.stravaLast?' · dernière synchro '+new Date(p.stravaLast).toLocaleString('fr-FR',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}):''}`:'Importe tes activités Strava (et Garmin si ta montre est reliée à Strava).';
  return `<div class="card spread"><div style="min-width:0;flex:1"><span class="strava">Strava</span> <span class="small">${msg}</span></div><button class="btn sm" data-a="stravaSync" ${st.state==='loading'?'disabled':''}>${p.strava?'Synchroniser':'Connecter Strava'}</button></div>`;
}
function vToday(){
  const t0=today();
  const planned=S.sessions.filter(s=>s.date===t0);const pending=planned.filter(s=>s.status!=='done');const doneToday=planned.filter(s=>s.status==='done');
  let top='';
  if(pending.length){const s=pending[0];
    top=`<div class="hero t-${s.type}"><div class="spread"><span class="eyebrow">Prévue aujourd'hui</span>${typeChip(s.type)}</div><div class="big">${esc(s.title)}</div>
    <div class="muted tn">${s.duration} min${s.exercises?' · '+s.exercises.length+' exercices':''}</div>${s.plan?`<div class="plan">${esc(s.plan)}</div>`:''}
    <div class="row"><button class="btn primary" data-a="open" data-id="${s.id}">Démarrer la séance</button><button class="btn" data-a="skipPlanned" data-id="${s.id}">Pas aujourd'hui</button></div></div>`}
  if(doneToday.length)top+=`<div class="card"><span class="eyebrow">Fait aujourd'hui</span><div class="slist" style="margin-top:8px">${doneToday.map(sessItem).join('')}</div></div>`;
  const ws=mondayOf(t0);let week='';
  for(let i=0;i<7;i++){const d=addDays(ws,i);const ss=S.sessions.filter(s=>s.date===d);
    week+=`<button class="wd ${d===t0?'today':''}" data-a="goDay" data-d="${d}"><span class="n">${DOWS[parseD(d).getDay()]} ${parseD(d).getDate()}</span>${ss.map(s=>`<span class="bar t-${s.type} ${s.status!=='done'?'planned':''}" title="${esc(s.title)}"></span>`).join('')}</button>`}
  const g=GOALS[S.profile.goal];const counts={};S.sessions.filter(s=>s.date>=ws&&s.date<=addDays(ws,6)&&s.status==='done').forEach(s=>{const k=normKey(sessMeta(s).key,g.targets);counts[k]=(counts[k]||0)+1});
  const targ=Object.entries(g.targets).map(([k,n])=>{const c=counts[k]||0;return `<span class="chip">${keyLabel(k)} <b class="tn">${c}/${n}</b></span>`}).join('');
  const r=acwr();const st=acwrState(r.ratio);
  const upcoming=S.sessions.filter(s=>s.date>t0&&s.status!=='done').sort((a,b)=>a.date<b.date?-1:1).slice(0,3);
  return `<div class="head"><span class="eyebrow">${fmtDay(t0)}${isDeload(t0)?' · semaine allégée':''}</span><h1>Aujourd'hui</h1></div>
  <div class="stack">${top}${recoCard()}${stravaLine()}${quickLogCard()}</div>
  <div class="section"><div class="spread"><h2>Cette semaine</h2><button class="btn sm" data-a="genWeek" data-d="${ws}">Planifier ma semaine</button></div>
    <div class="week">${week}</div><div class="row">${targ}</div></div>
  <div class="section"><h2>Forme</h2><div class="kpis">
    <div class="kpi"><span>Charge 7 jours</span><b>${Math.round(r.acute)}</b><span>UA (durée × RPE)</span></div>
    <div class="kpi"><span>Moyenne 4 semaines</span><b>${Math.round(r.chronic)}</b><span>UA / semaine</span></div>
    <div class="kpi"><span>Ratio aigu/chronique</span><b>${r.ratio==null?'–':r.ratio.toFixed(2)}</b><span class="pill ${st.c}" style="align-self:flex-start">${st.t}</span></div>
    <div class="kpi"><span>Allure EF conseillée</span><b>${fmtPace(paces().ef[0])}</b><span>min/km, base 5 km ${esc(S.profile.ref5k)}</span></div></div></div>
  <div class="section"><h2>À venir</h2>${upcoming.length?`<div class="slist">${upcoming.map(s=>`<div><div class="eyebrow" style="margin:0 0 4px">${fmtDay(s.date)}</div>${sessItem(s)}</div>`).join('')}</div>`:`<div class="empty">Rien de prévu. « Planifier ma semaine » remplit tes créneaux libres selon ton objectif.</div>`}</div>`;
}

/* ================= ADAPTATION & STRAVA ================= */
function replanWeek(){const {created,removed}=generateWeek(mondayOf(today()));removed.forEach(s=>{S.sessions=S.sessions.filter(x=>x.id!==s.id);persistDelete(s.id)});created.forEach(upsert);return created.length}
function adaptAfter(date){
  const t0=today();let changed=0;
  S.sessions.filter(s=>s.auto&&s.status==='planned'&&s.date===date).forEach(s=>{S.sessions=S.sessions.filter(x=>x.id!==s.id);persistDelete(s.id);changed++});
  const ws=mondayOf(t0);const from=addDays(t0,S.sessions.some(s=>s.date===t0&&s.status==='done')?1:0);
  const hadAuto=S.sessions.some(s=>s.auto&&s.status==='planned'&&s.date>=from&&s.date<=addDays(ws,6));
  if(!hadAuto&&!changed)return 0;
  const {created,removed}=generateWeek(ws,from);
  removed.forEach(s=>{S.sessions=S.sessions.filter(x=>x.id!==s.id);persistDelete(s.id)});created.forEach(upsert);
  return created.length+removed.length+changed;
}
let MCP;async function getMcp(){if(MCP!==undefined)return MCP;MCP=window.claude?.use?await window.claude.use('mcp'):null;return MCP}
const STRAVA='Strava';
function stravaErr(e){const c=e?.code;return({no_mcp:IN_CLAUDE?'Ouvre cette page dans Claude, connecté à ton compte, pour utiliser Strava.':'La synchro Strava passe par Claude. Dans cette version web, importe tes séances à la main ou branche l\'API Strava (voir README).',
  needs_reauth:'Connexion Strava expirée : reconnecte Strava dans claude.ai, Réglages, Connecteurs.',
  server_not_connected:'Strava n\'est pas connecté : finalise la connexion dans claude.ai, Réglages, Connecteurs.',
  selection_required:'Plusieurs connecteurs Strava : choisis celui à utiliser quand Claude te le propose.',
  not_in_manifest:'Tu n\'as pas autorisé Strava pour cette page. Autorise-le depuis le menu de la page.',
  consent_required:'Autorise Strava pour cette page, puis relance la synchro.',
  server_unavailable:'Strava ne répond pas pour l\'instant. Réessaie dans quelques minutes.',
  format:'Réponse de Strava dans un format non reconnu. Saisis la séance à la main en attendant.',
  tool_error:'Strava a refusé la demande : '+(e?.message||'')})[c]||('Synchro impossible ('+(c||'erreur')+').')}
function parseActs(p){
  if(typeof p==='string'){try{p=JSON.parse(p)}catch(e){throw{code:'format'}}}
  let arr=Array.isArray(p)?p:null;
  if(!arr&&p&&typeof p==='object'){for(const k of ['activities','data','items','results','list'])if(Array.isArray(p[k])){arr=p[k];break}
    if(!arr){const v=Object.values(p).find(v=>Array.isArray(v)&&v.length&&typeof v[0]==='object');if(v)arr=v}}
  if(!arr)throw{code:'format'};
  return arr.map(mapAct).filter(a=>a.id&&a.date).sort((a,b)=>a.date<b.date?1:-1);
}
function mapAct(a0){
  const a={...(a0.summary||{}),...a0};
  const g=(...ks)=>{for(const k of ks){if(a[k]!=null&&a[k]!=='')return a[k]}return null};
  const id=g('id','activity_id','activityId');const sport=String(g('sport_type','sportType','type','activity_type')||'');
  const raw=String(g('start_local','start_date_local','startDateLocal','start_date','startDate','date')||'');const date=/^\d{4}-\d{2}-\d{2}/.test(raw)?raw.slice(0,10):null;
  let km=g('distance_km','distanceKm');
  if(km!=null)km=num(km);else{let d=g('distance','distance_m','distance_meters');if(d!=null){const isKm=typeof d==='string'&&/km/i.test(d);d=num(d);if(d!=null)km=isKm?d:(d>300?d/1000:d)}}
  let sec=g('moving_time','movingTime','moving_time_s','elapsed_time','elapsedTime','duration','duration_s');if(typeof sec==='string')sec=sec.includes(':')?toSec(sec):num(sec);
  const hr=num(g('average_heartrate','averageHeartrate','avg_hr','average_hr','avg_heartrate'));
  const tr=!!(a.is_trainer||/virtual/i.test(sport));
  const sp=/run/i.test(sport)?(tr?'course_tapis':'course'):/ride|cycl|bike/i.test(sport)?(tr?'velo_salle':'velo'):/stair/i.test(sport)?'escaliers':/row/i.test(sport)?'rameur':/ellipt/i.test(sport)?'elliptique':
    /walk|hike/i.test(sport)?(tr?'marche_incl':'autre'):/soccer|football/i.test(sport)?'foot':/squash|racquetball/i.test(sport)?'squash':/^tennis/i.test(sport)?'tennis':/padel/i.test(sport)?'padel':
    /yoga|pilates|stretch/i.test(sport)?'mob':/weight|strength/i.test(sport)?'muscu':/workout|crossfit|hiit|train/i.test(sport)?'renfo':'autre';
  const type=SPORTS[sp].type;
  const re=num(a.relative_effort);
  return{re,id:id!=null?String(id):null,name:String(g('name','title')||'Activité Strava'),sport,date,km:km!=null?Math.round(km*100)/100:null,sec:sec||null,hr:hr!=null?Math.round(hr):null,type,sp,elev:num(a.elevation_gain)};
}
async function stravaList(){
  const m=await getMcp();if(!m)throw{code:'no_mcp'};
  try{const perms=await window.claude.use('permissions');if(perms)await perms.request(['mcp:'+STRAVA])}catch(e){}
  const r=await m.callTool(STRAVA,'list_activities',{first:60,include_tags:true,range_start:addDays(today(),-30)+'T00:00:00'},{cache:false});
  return parseActs(r.payload??r);
}
function importActs(acts){
  makeReal();let n=0;const dates=[];
  acts.forEach(a=>{if(S.sessions.some(s=>s.stravaId===a.id))return;
    const dur=a.sec?Math.round(a.sec/60):null;const pace=a.type==='run'&&a.sec&&a.km?a.sec/a.km:null;
    const planned=S.sessions.find(s=>s.date===a.date&&!s.stravaId&&s.type===a.type&&(a.type==='run'||sportOf(s)===a.sp||(s.status==='planned'&&!['sport'].includes(a.type)))&&(s.status==='planned'||s.status==='done'));
    const s=planned?clone(planned):sportSession(a.sp,a.date,{title:a.name});if(!planned||a.type!=='muscu')s.sport=a.sp;
    Object.assign(s,{status:'done',stravaId:a.id,auto:false});if(dur)s.duration=dur;if(a.re!=null)s.notes=(s.notes?s.notes+' · ':'')+'Effort relatif Strava : '+a.re;
    if(a.type==='run'){s.distance=a.km!=null?String(a.km):'';s.time=a.sec?fmtSec(a.sec):'';s.hr=a.hr||'';if(!planned){s.key=classifyRun(dur,pace);s.hard=s.key==='run_q'}}
    else{if(a.km)s.distance=String(a.km);if(a.hr)s.hr=a.hr;if(a.sp==='marche_incl'&&a.km&&a.sec){s.speed=String(Math.round(a.km/(a.sec/3600)*10)/10)}}
    upsert(s);n++;dates.push(a.date)});
  if(n){const last=dates.sort().pop();adaptAfter(last)}
  return n;
}
async function stravaSync(interactive){
  UI.strava={state:'loading'};if(UI.view==='today'||UI.view==='settings')render();
  try{const acts=await stravaList();UI.strava={};
    if(interactive&&!S.profile.strava){openStravaPreview(acts);render();return}
    const since=S.profile.stravaSince||addDays(today(),-7);const ign=S.profile.stravaIgnored||[];
    const fresh=acts.filter(a=>a.date>=since&&!ign.includes(a.id)&&!S.sessions.some(s=>s.stravaId===a.id));
    const n=importActs(fresh);S.profile.stravaLast=Date.now();persistProfile();render();enrichStrength().catch(e=>console.warn(e));
    if(interactive||n)toast(n?`${n} activité${n>1?'s':''} Strava importée${n>1?'s':''}, plan réajusté`:'Rien de nouveau sur Strava');
  }catch(e){UI.strava={state:'error',msg:stravaErr(e)};render()}
}
const SNAME={'Bench Press':'Développé couché','Dumbbell Flye':'Écarté','Curl':'Curl','Row':'Rowing','Squat':'Squat','Sit Up':'Abdos','Lat Pulldown':'Tirage vertical','Shoulder Press':'Développé épaules','Lateral Raise':'Élévations latérales','Triceps Extension':'Extension triceps','Leg Press':'Presse','Deadlift':'Soulevé de terre','Lunge':'Fentes','Plank':'Gainage','Push Up':'Pompes','Crunch':'Crunch'};
function strengthSummary(sets){const g=[];
  for(const st of sets||[]){const w=num(String(st.weight?.value??'').replace(/[^0-9.,]/g,''))||0;const r=parseInt(st.reps?.value)||0;if(!r)continue;
    const nm=st.exercise_name&&st.exercise_name!=='Unknown'?st.exercise_name:null;const l=g[g.length-1];
    if(l&&l.w===w&&(!nm||!l.nm||l.nm===nm)){l.r.push(r);if(nm)l.nm=nm}else g.push({w,nm,r:[r]})}
  return g.map(b=>{const same=b.r.every(x=>x===b.r[0]);const label=b.nm?(SNAME[b.nm]||b.nm):(b.w?'Exercice':'Poids du corps');
    return `${label}${b.w?' '+b.w+' kg':''} : ${same?b.r.length+' × '+b.r[0]:b.r.join(' / ')}`}).join(' · ')}
async function enrichStrength(){const m=await getMcp();if(!m)return;
  const todo=S.sessions.filter(s=>s.stravaId&&['muscu','renfo'].includes(s.type)&&s.stravaSets==null).slice(0,20);if(!todo.length)return;
  const r=await m.callTool(STRAVA,'get_strength_workout_details',{activity_ids:todo.map(s=>s.stravaId)},{cache:false});
  let p=r.payload??r;if(typeof p==='string'){try{p=JSON.parse(p)}catch(e){return}}
  const list=Array.isArray(p)?p:(p&&(p.workouts||p.activities||p.data||p.results))||[];
  list.forEach(w=>{const s=S.sessions.find(x=>x.stravaId===String(w.activity_id));if(!s)return;const c=clone(s);c.stravaSets=strengthSummary(w.exercise_sets)||'';upsert(c)});
  if(UI.view!=='settings')render()}
function openStravaPreview(acts){
  UI.stravaActs=acts;const known=id=>S.sessions.some(s=>s.stravaId===id);
  ov2.innerHTML=`<div class="sheet" role="dialog" aria-modal="true" aria-label="Import Strava"><div class="sheet-h"><div><div class="eyebrow">30 derniers jours</div><h3>Activités Strava</h3></div><button class="x" data-a="closePick" aria-label="Fermer">×</button></div>
   <div class="sheet-b">${acts.length?`<p class="small muted" style="margin:0">Coche ce que tu veux importer. Les prochaines activités s'importeront automatiquement à l'ouverture de l'app.</p>
   <div>${acts.map(a=>`<label class="imp"><input type="checkbox" data-imp="${esc(a.id)}" ${known(a.id)?'disabled':'checked'}><span class="dot t-${a.type}"></span><span class="main"><b>${esc(a.name)}</b><br><span class="small muted tn">${fmtShort(a.date)} · ${esc(SPORTS[a.sp].n)}${a.km?' · '+a.km+' km':''}${a.sec?' · '+fmtSec(a.sec):''}${a.km&&a.sec&&a.type==='run'?' · '+fmtPace(a.sec/a.km)+' /km':''}${known(a.id)?' · déjà importée':''}</span></span></label>`).join('')}</div>`:'<div class="empty">Aucune activité trouvée sur les 30 derniers jours.</div>'}</div>
   <div class="sheet-f"><span></span><button class="btn primary" data-a="stravaImport">${acts.length?'Importer la sélection':'Activer la synchro'}</button></div></div>`;
  ov2.hidden=false;
}
function maybeAutoStrava(){if(S.profile.strava&&!UI.autoStrava&&!S.example){UI.autoStrava=true;stravaSync(false)}}

/* ================= VIEW: CALENDAR ================= */
function vCalendar(){
  const [y,mo]=UI.calMonth.split('-').map(Number);const first=new Date(y,mo-1,1);
  const start=mondayOf(iso(first));const t0=today();
  let cells='';for(let i=0;i<42;i++){const d=addDays(start,i);const dd=parseD(d);if(i>=35&&dd.getMonth()!==mo-1)break;
    const ss=S.sessions.filter(s=>s.date===d);
    cells+=`<button class="cd ${dd.getMonth()!==mo-1?'out':''} ${d===t0?'today':''} ${d===UI.selDay?'sel':''}" data-a="selDay" data-d="${d}" aria-label="${fmtDay(d)}, ${ss.length} séance(s)">
      <span class="num tn">${dd.getDate()}</span>
      ${ss.map(s=>`<span class="lbl t-${s.type} ${s.status!=='done'?'planned':''}">${esc(s.title)}</span>`).join('')}
      <span class="bars">${ss.map(s=>`<span class="bar t-${s.type} ${s.status!=='done'?'planned':''}"></span>`).join('')}</span></button>`}
  const sel=UI.selDay;const ss=S.sessions.filter(s=>s.date===sel);
  const av=+S.profile.avail[parseD(sel).getDay()]||0;
  const monthName=first.toLocaleDateString('fr-FR',{month:'long',year:'numeric'});
  return `<div class="head"><span class="eyebrow">Planification</span><h1>Calendrier</h1></div>
  <div class="spread" style="margin-bottom:10px"><div class="row"><button class="btn sm" data-a="calMove" data-n="-1" aria-label="Mois précédent">‹</button><h2 style="min-width:150px;text-align:center">${monthName}</h2><button class="btn sm" data-a="calMove" data-n="1" aria-label="Mois suivant">›</button><button class="btn ghost sm" data-a="calToday">Aujourd'hui</button></div>
  <button class="btn sm primary" data-a="genWeek" data-d="${mondayOf(sel)}">Planifier la semaine du ${fmtShort(mondayOf(sel))}</button></div>
  <div class="cal">${['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].map(d=>`<div class="dow">${d}</div>`).join('')}${cells}</div>
  <div class="legend" style="margin-top:10px">${Object.keys(TYPES).map(k=>`<span class="t-${k}"><span class="dot"></span>${TYPES[k].label}</span>`).join('')}<span>Pointillés = prévue</span></div>
  <div class="section"><div class="spread"><h2 style="text-transform:none;font-size:22px">${fmtDay(sel)}</h2><span class="muted small">${av?av+' min disponibles':'Pas de créneau habituel'}</span></div>
   ${ss.length?`<div class="slist">${ss.map(sessItem).join('')}</div>`:`<div class="empty">Aucune séance ce jour.</div>`}
   <div class="row"><button class="btn primary" data-a="pick" data-d="${sel}">Ajouter une séance</button>${!ss.length&&av?`<button class="btn" data-a="recoDay" data-d="${sel}">Séance recommandée</button>`:''}</div></div>`;
}

/* ================= VIEW: LIBRARY ================= */
function tplCard(t,date){
  const content=t.ex?`<ul>${t.ex.map(([id,n,lo,hi])=>`<li><button class="btn ghost sm" style="padding:0;font-weight:600;color:var(--ink);text-decoration:underline;text-decoration-color:var(--line);text-underline-offset:3px" data-a="exInfo" data-id="${id}">${esc(EX[id].n)}</button> <span class="muted tn">${n} × ${lo===hi?lo:lo+'-'+hi}${EX[id].unit==='sec'?' s':''}</span></li>`).join('')}</ul>`:`<div class="plan small">${esc(t.run?runPlan(t.run):cardioPlan(t.cardio,t.dur))}</div>`;
  return `<div class="card tpl t-${t.type}"><div class="spread"><h3>${esc(t.name)}</h3><span class="muted small tn">${t.dur} min</span></div><div class="small muted">${esc(t.desc)}</div>${content}
   <div class="row"><input type="date" id="d-${t.id}" value="${date||today()}" style="width:auto;flex:1" aria-label="Date"><button class="btn sm primary" data-a="planTpl" data-t="${t.id}">Planifier</button><button class="btn sm" data-a="startTpl" data-t="${t.id}">Faire maintenant</button></div></div>`;
}
function vLibrary(){
  const groups=Object.keys(TYPES).filter(k=>TPL.some(t=>t.type===k)).map(k=>{const list=TPL.filter(t=>t.type===k);return `<div class="section"><h2>${TYPES[k].label}</h2><div class="grid2">${list.map(t=>tplCard(t)).join('')}</div></div>`}).join('');
  return `<div class="head"><span class="eyebrow">Idées de séances</span><h1>Séances</h1><p class="muted" style="margin:4px 0 0;max-width:62ch">Les allures running sont calculées sur ton chrono 5 km de référence (${esc(S.profile.ref5k)}). Les charges de musculation sont proposées à partir de ta dernière séance sur chaque exercice.</p></div>${groups}`;
}

/* ================= FIGURES (animated movement drawings) ================= */
const FLEN={t:46,n:13,ua:26,fa:24,th:36,sh:34,ft:11};
const dv=a=>{const r=a*Math.PI/180;return[Math.sin(r),-Math.cos(r)]};
const PT=(o,a,l)=>{const d=dv(a);return[o[0]+d[0]*l,o[1]+d[1]*l]};
const f1=n=>Math.round(n*10)/10;
function fsolve(k,view){
  const L=n=>(FLEN[n.replace('2','')]||0)*((k.L&&k.L[n])??1);
  const g=(n,d)=>k[n]??d;
  const hp=k.hp,s=PT(hp,k.t,L('t')),h=PT(s,k.t,L('n'));
  const P={hp,s,h};
  if(view==='front'){
    const sR=[s[0]+12,s[1]],sL=[s[0]-12,s[1]],hR=[hp[0]+7,hp[1]],hL=[hp[0]-7,hp[1]];
    const ua2=g('ua2',360-k.ua),fa2=g('fa2',360-k.fa),th2=g('th2',360-k.th),sh2=g('sh2',360-k.sh);
    P.sR=sR;P.sL=sL;P.hR=hR;P.hL=hL;
    P.e=PT(sR,k.ua,L('ua'));P.w=PT(P.e,k.fa,L('fa'));P.e2=PT(sL,ua2,L('ua2'));P.w2=PT(P.e2,fa2,L('fa2'));
    P.k=PT(hR,k.th,L('th'));P.a=PT(P.k,k.sh,L('sh'));P.t=PT(P.a,g('ft',k.sh-90),5.5);
    P.k2=PT(hL,th2,L('th2'));P.a2=PT(P.k2,sh2,L('sh2'));P.t2=PT(P.a2,g('ft2',360-(k.sh-90)),5.5);
    return P;
  }
  P.e=PT(s,g('ua',178),L('ua'));P.w=PT(P.e,g('fa',175),L('fa'));
  P.k=PT(hp,k.th,L('th'));P.a=PT(P.k,k.sh,L('sh'));P.t=PT(P.a,g('ft',k.sh-90),L('ft'));
  P.e2=PT(s,g('ua2',g('ua',178)),L('ua2'));P.w2=PT(P.e2,g('fa2',g('fa',175)),L('fa2'));
  P.k2=PT(hp,g('th2',k.th),L('th2'));P.a2=PT(P.k2,g('sh2',k.sh),L('sh2'));P.t2=PT(P.a2,g('ft2',g('ft',g('sh2',k.sh)-90)),L('ft2'));
  P.k_=k;return P;
}
function lerpK(a,b,u){const o={};for(const key of new Set([...Object.keys(a),...Object.keys(b)])){
  const x=a[key],y=b[key];
  if(key==='L'){o.L={};const ks=new Set([...Object.keys(x||{}),...Object.keys(y||{})]);ks.forEach(n=>{const p=(x&&x[n])??1,q=(y&&y[n])??1;o.L[n]=p+(q-p)*u});continue}
  if(Array.isArray(x)||Array.isArray(y)){const p=x||y,q=y||x;o[key]=[p[0]+(q[0]-p[0])*u,p[1]+(q[1]-p[1])*u];continue}
  if(typeof x==='number'||typeof y==='number'){const p=x??y,q=y??x;o[key]=p+(q-p)*u}}
  return o}
/* drawing helpers */
const Ln=(a,b,c='eq',w=4)=>`<line x1="${f1(a[0])}" y1="${f1(a[1])}" x2="${f1(b[0])}" y2="${f1(b[1])}" class="${c}" stroke-width="${w}"/>`;
const Rc=(x,y,w,h,c='eqf',r=2)=>`<rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" rx="${r}" class="${c}"/>`;
const Ci=(p,r,c='eqf')=>`<circle cx="${f1(p[0])}" cy="${f1(p[1])}" r="${r}" class="${c}"/>`;
const add=(p,x,y)=>[p[0]+x,p[1]+y];
const Cab=(a,b)=>Ln(a,b,'cab',1.4);
const Pul=p=>Ci(p,4,'eq2f');
const Stack=(x,y=86)=>Rc(x,y,18,60,'eqline',2)+[0,1,2,3,4,5,6].map(i=>Rc(x+2,y+60-8*(i+1)+1,14,6,'eqf',1)).join('');
const Plate=(p,r=6)=>Ci(p,r,'eq2f')+Ci(p,2,'figbg');
const DBv=p=>Rc(p[0]-3,p[1]-8,6,16,'eq2f',2);
const Grip=p=>Ci(p,3.2,'eq2f');
const Post=(x,y1,y2=146)=>Ln([x,y1],[x,y2],'eq',4);
/* muscle regions: [segment, from, to, side] side +1 = right-hand normal */
const MREG={chest:['t',.6,.88,1],abs:['t',.12,.52,1],back:['t',.45,.9,-1],lowback:['t',.04,.4,-1],glutes:['t',-.1,.16,-1],
  biceps:['ua',.15,.8,-1],triceps:['ua',.15,.8,1],quads:['th',.1,.88,-1],hams:['th',.1,.88,1],calves:['sh',.08,.55,1]};
function segOf(P,seg,far){const m={t:['hp','s'],ua:['s','e'],fa:['e','w'],th:['hp','k'],sh:['k','a']}[seg];const two=far&&seg!=='t'?'2':'';return[P[m[0]+(m[0]==='s'||m[0]==='hp'?'':two)],P[m[1]+two]]}
function muscles(P,list,view){let o='';
  if(view==='front'){list.forEach(m=>{
    if(m==='delts'){o+=Ci(add(P.sR,1,1),5.5,'mus')+Ci(add(P.sL,-1,1),5.5,'mus')}
    else if(m==='chest'){o+=`<ellipse cx="${f1(P.s[0]+6)}" cy="${f1(P.s[1]+9)}" rx="6" ry="5" class="mus"/><ellipse cx="${f1(P.s[0]-6)}" cy="${f1(P.s[1]+9)}" rx="6" ry="5" class="mus"/>`}
    else if(m==='glutes_med'){o+=Ci(add(P.hR,5,-2),5,'mus')+Ci(add(P.hL,-5,-2),5,'mus')}
  });return o}
  list.forEach(m=>{const far=m.endsWith('2');const key=far?m.slice(0,-1):m;
    if(key==='delts'){o+=Ci(P.s,5.5,'mus');return}
    const r=MREG[key];if(!r)return;const [a,b]=segOf(P,r[0],far);const d=[b[0]-a[0],b[1]-a[1]];const len=Math.hypot(d[0],d[1])||1;
    const n=[-d[1]/len*r[3]*3.2,d[0]/len*r[3]*3.2];
    const p=[a[0]+d[0]*r[1]+n[0],a[1]+d[1]*r[1]+n[1]],q=[a[0]+d[0]*r[2]+n[0],a[1]+d[1]*r[2]+n[1]];
    o+=Ln(p,q,'mus',7)});
  return o}
function body(P,view){
  if(view==='front'){
    const lim=(a,b,c,w)=>Ln(a,b,'bd',w);
    return `<polygon points="${[P.sL,P.sR,P.hR,P.hL].map(p=>f1(p[0])+','+f1(p[1])).join(' ')}" class="bdf"/>`+
      lim(P.hL,P.k2,0,5.5)+lim(P.k2,P.a2,0,5)+lim(P.a2,P.t2,0,4)+lim(P.hR,P.k,0,5.5)+lim(P.k,P.a,0,5)+lim(P.a,P.t,0,4)+
      lim(P.sL,P.e2,0,5)+lim(P.e2,P.w2,0,4.5)+lim(P.sR,P.e,0,5)+lim(P.e,P.w,0,4.5)+Ln(P.s,P.h,'bd',4)+Ci(P.h,7.5,'bdh')}
  return Ln(P.hp,P.k2,'far',5.5)+Ln(P.k2,P.a2,'far',5)+Ln(P.a2,P.t2,'far',4)+Ln(P.s,P.e2,'far',5)+Ln(P.e2,P.w2,'far',4.5)+
    Ln(P.hp,P.s,'bd',7)+Ln(P.s,P.h,'bd',4)+Ci(P.h,7.5,'bdh')+
    Ln(P.hp,P.k,'bd',5.5)+Ln(P.k,P.a,'bd',5)+Ln(P.a,P.t,'bd',4)+Ln(P.s,P.e,'bd',5)+Ln(P.e,P.w,'bd',4.5)}

const seatBack=(P,len=50)=>{const n=dv((P.k_?.t??0)-90);const o=[n[0]*7,n[1]*7];const top=PT(P.hp,P.k_?.t??0,len);return Ln(add(P.hp,o[0],o[1]),add(top,o[0],o[1]),'eqpad',8)};
const Seat=(x1,x2,y)=>Ln([x1,y],[x2,y],'eqpad',6)+Post((x1+x2)/2,y+3);

const FIG={
 chest_press:{mu:['chest','triceps','delts'],kf:[{hp:[78,108],t:-12,ua:255,fa:85,th:88,sh:180},{hp:[78,108],t:-12,ua:95,fa:92,th:88,sh:180}],
  eq:P=>Stack(8)+Post(38,30)+Ln([38,30],[60,30],'eq',4)+seatBack(P,52)+Seat(62,102,112)+Ln([60,30],P.w,'eq2',3.5),
  fr:P=>Ln(add(P.w,0,-7),add(P.w,0,7),'eq2',4.5)},
 lat_pulldown:{mu:['back','biceps'],kf:[{hp:[100,110],t:-12,ua:8,fa:6,th:90,sh:180},{hp:[100,110],t:-12,ua:195,fa:15,th:90,sh:180}],
  eq:P=>Stack(168)+Post(162,0)+Ln([97,2],[162,2],'eq',4)+Pul([97,5])+Seat(80,124,113)+Ci([134,101],5,'eqpadf')+Cab([97,5],P.w),
  fr:P=>Ln(add(P.w,-9,0),add(P.w,9,0),'eq2',4)},
 shoulder_press:{mu:['delts','triceps'],kf:[{hp:[90,110],t:0,ua:165,fa:8,th:90,sh:180},{hp:[90,110],t:0,ua:8,fa:4,th:90,sh:180}],
  eq:P=>Stack(8)+Post(40,12)+seatBack(P,58)+Seat(72,112,113)+Ln([42,14],P.w,'eq2',3.5),fr:P=>Ln(add(P.w,-6,0),add(P.w,6,0),'eq2',4.5)},
 seated_row:{mu:['back','biceps'],kf:[{hp:[62,128],t:0,ua:92,fa:92,th:75,sh:110,ft:20},{hp:[62,128],t:0,ua:200,fa:85,th:75,sh:110,ft:20}],
  eq:P=>Stack(176)+Post(170,90)+Pul([164,118])+Ln([30,133],[110,133],'eqpad',6)+Post(45,136)+Post(95,136)+Ln([138,108],[138,146],'eqpad',5)+Cab([164,118],P.w),
  fr:P=>Ci(P.w,3.5,'eq2f')},
 lateral_raise:{view:'front',mu:['delts'],kf:[{hp:[100,72],t:0,ua:172,fa:174,th:177,sh:180},{hp:[100,72],t:0,ua:92,fa:96,th:177,sh:180}],
  fr:P=>DBv(P.w)+DBv(P.w2)},
 cable_curl:{mu:['biceps'],kf:[{hp:[90,72],t:0,ua:182,fa:174,th:180,sh:180},{hp:[90,72],t:0,ua:176,fa:22,th:180,sh:180}],
  eq:P=>Stack(176)+Post(170,40)+Pul([162,138])+Cab([162,138],P.w),fr:P=>Ln(add(P.w,-5,0),add(P.w,5,0),'eq2',4)},
 triceps_pushdown:{mu:['triceps'],kf:[{hp:[86,72],t:12,ua:178,fa:65,th:175,sh:182},{hp:[86,72],t:12,ua:180,fa:172,th:175,sh:182}],
  eq:P=>Stack(176)+Post(170,4)+Ln([150,4],[170,4],'eq',4)+Pul([150,8])+Cab([150,8],P.w),fr:P=>Ln(P.w,add(P.w,-3,7),'eq2',3)+Ln(P.w,add(P.w,3,7),'eq2',3)},
 pec_deck:{view:'front',mu:['chest'],kf:[{hp:[100,100],t:0,ua:92,fa:90,th:176,sh:180,L:{th:.35,th2:.35,sh:.95,sh2:.95}},{hp:[100,100],t:0,ua:92,fa:268,th:176,sh:180,L:{ua:.4,ua2:.4,fa:.9,fa2:.9,th:.35,th2:.35,sh:.95,sh2:.95}}],
  eq:P=>Rc(80,40,40,62,'eqpadf',4)+Ln([72,104],[128,104],'eqpad',6)+Post(100,107)+Ln([60,14],[140,14],'eq',4)+Ln([108,14],P.w,'eq2',3)+Ln([92,14],P.w2,'eq2',3),
  fr:P=>Ln(add(P.w,0,-7),add(P.w,0,7),'eq2',4.5)+Ln(add(P.w2,0,-7),add(P.w2,0,7),'eq2',4.5)},
 incline_db_press:{mu:['chest','delts','triceps'],kf:[{hp:[118,102],t:-60,ua:200,fa:25,th:102,sh:180,ft:90},{hp:[118,102],t:-60,ua:28,fa:30,th:102,sh:180,ft:90}],
  eq:P=>{const n=dv(-150),o=[n[0]*7,n[1]*7];const top=PT(P.hp,-60,58);return Ln(add(P.hp,o[0],o[1]),add(top,o[0],o[1]),'eqpad',8)+Ln([108,109],[138,109],'eqpad',6)+Post(122,112)+Post(70,92)},
  fr:P=>Plate(P.w,6)},
 face_pull:{mu:['delts','back'],kf:[{hp:[80,72],t:-5,ua:76,fa:78,th:182,sh:178},{hp:[80,72],t:-5,ua:268,fa:76,th:182,sh:178,L:{ua:.45}}],
  eq:P=>Stack(178)+Post(172,10)+Pul([170,16])+Cab([170,16],P.w),fr:P=>Ln(P.w,add(P.w,5,6),'eq2',3)+Ln(P.w,add(P.w,5,-5),'eq2',3)},
 assisted_dip:{mu:['triceps','chest'],anchor:'w',kf:[{hp:[100,90],t:12,ua:180,fa:180,th:178,sh:270,ft:180},{hp:[100,90],t:22,ua:245,fa:165,th:175,sh:268,ft:180}],
  eq:P=>Post(126,40)+Ln([96,96],[132,96],'eq',4)+Ln([P.k[0],P.k[1]+6],[P.k[0],146],'eq2',3)+Stack(160),
  fr:P=>Ln(add(P.k,-14,5),add(P.k,10,5),'eqpad',6)},
 db_curl:{mu:['biceps'],kf:[{hp:[95,72],t:0,ua:182,fa:178,th:180,sh:180,ua2:184,fa2:180},{hp:[95,72],t:0,ua:175,fa:25,th:180,sh:180,ua2:184,fa2:180}],
  eq:P=>Plate(P.w2,5),fr:P=>Plate(P.w,5)},
 leg_press:{mu:['quads','glutes'],kf:[{hp:[62,112],t:-55,th:25,sh:125,ua:120,fa:100},{hp:[62,112],t:-55,th:58,sh:62,ua:120,fa:100}],
  eq:P=>{const n=dv(-145),o=[n[0]*7,n[1]*7];const top=PT(P.hp,-55,56);return Ln([96,120],[178,22],'eq',5)+Ln(add(P.hp,o[0],o[1]),add(top,o[0],o[1]),'eqpad',8)+Ln([48,120],[80,120],'eqpad',6)+Post(56,123)+Post(110,104)},
  fr:P=>{const m=[(P.a[0]+P.t[0])/2,(P.a[1]+P.t[1])/2];return Ln(PT(m,-50,17),PT(m,130,9),'eq2',5)}},
 leg_curl:{mu:['hams'],kf:[{hp:[80,100],t:-12,th:90,sh:92,ft:2,ua:172,fa:120},{hp:[80,100],t:-12,th:90,sh:205,ft:115,ua:172,fa:120}],
  eq:P=>Stack(170)+seatBack(P,50)+Seat(62,118,106)+Ci([111,90],5.5,'eqpadf'),
  fr:P=>{const r=PT(add(P.k,0,0),P.k_.sh,34*.82);const n=dv(P.k_.sh+90);const q=[r[0]+n[0]*7,r[1]+n[1]*7];return Ln(P.k,q,'eq2',3)+Ci(q,5.5,'eqpadf')}},
 leg_extension:{mu:['quads'],kf:[{hp:[80,100],t:-8,th:90,sh:182,ft:92,ua:172,fa:120},{hp:[80,100],t:-8,th:90,sh:92,ft:2,ua:172,fa:120}],
  eq:P=>Stack(170)+seatBack(P,50)+Seat(62,118,106),
  fr:P=>{const r=PT(P.k,P.k_.sh,34*.85);const n=dv(P.k_.sh-90);const q=[r[0]+n[0]*7,r[1]+n[1]*7];return Ln(P.k,q,'eq2',3)+Ci(q,5.5,'eqpadf')}},
 hip_thrust:{mu:['glutes','hams'],anchor:'a',kf:[{hp:[100,128],t:290,th:60,sh:160,ft:90,ua:100,fa:95},{hp:[100,128],t:270,th:95,sh:180,ft:90,ua:100,fa:95}],
  eq:P=>Rc(18,114,46,7,'eqpadf',3)+Post(24,121)+Post(58,121),fr:P=>Ci(add(P.hp,2,-11),11,'eq2f')+Ci(add(P.hp,2,-11),3,'figbg')},
 calf_raise:{mu:['calves'],anchor:'t',kf:[{hp:[90,70],t:0,th:180,sh:180,ft:70,ua:168,fa:12},{hp:[90,70],t:0,th:180,sh:180,ft:128,ua:168,fa:12}],
  eq:P=>Rc(96,137,40,9,'eqf',2)+Post(150,0),fr:P=>Ln(add(P.s,-10,-5),add(P.s,12,-5),'eqpad',7)+Ln(add(P.s,12,-5),[150,P.s[1]-5],'eq2',3)},
 goblet_squat:{mu:['quads','glutes'],anchor:'a',kf:[{hp:[90,72],t:0,th:180,sh:180,ua:168,fa:15,ft:90},{hp:[90,72],t:35,th:95,sh:208,ua:170,fa:40,ft:90}],fr:P=>DBv(P.w)},
 walking_lunge:{mu:['quads','glutes'],anchor:'a',kf:[{hp:[90,72],t:0,th:168,sh:182,th2:196,sh2:200,ft2:120,ua:180,fa:180,ft:90},{hp:[90,72],t:2,th:95,sh:180,th2:184,sh2:262,ft2:150,ua:180,fa:180,ft:90}],
  fr:P=>Plate(P.w,5)},
 rdl:{mu:['hams','glutes','lowback'],anchor:'a',kf:[{hp:[90,72],t:0,th:180,sh:180,ua:180,fa:180,ft:90},{hp:[90,72],t:78,th:162,sh:172,ua:180,fa:180,ft:90}],fr:P=>Plate(P.w,5)},
 abductor:{view:'front',mu:['glutes_med'],kf:[{hp:[100,100],t:0,ua:165,fa:170,th:178,sh:182,L:{th:.35,th2:.35}},{hp:[100,100],t:0,ua:165,fa:170,th:125,sh:176,L:{th:.45,th2:.45}}],
  eq:P=>Rc(80,46,40,56,'eqpadf',4)+Ln([70,104],[130,104],'eqpad',6)+Post(100,107),fr:P=>Ln(add(P.k,5,-6),add(P.k,5,8),'eqpad',5)+Ln(add(P.k2,-5,-6),add(P.k2,-5,8),'eqpad',5)},
 plank:{mu:['abs'],iso:true,kf:[{hp:[112,124],t:275,ua:180,fa:270,th:100,sh:100,ft:190}]},
 side_plank:{mu:['abs','glutes'],iso:true,kf:[{hp:[100,128],t:282,ua:180,fa:85,th:100,sh:100,ft:120,ua2:2,fa2:2,L:{fa:.35}}]},
 glute_bridge_single:{mu:['glutes','hams'],anchor:'s',kf:[{hp:[100,142],t:275,th:50,sh:150,ft:90,th2:75,sh2:75,ft2:20,ua:95,fa:95},{hp:[100,142],t:250,th:80,sh:170,ft:90,th2:70,sh2:70,ft2:20,ua:95,fa:95}]},
 clamshell:{mu:['glutes'],kf:[{hp:[112,128],t:270,ua:140,fa:105,ua2:262,fa2:300,L:{ua:.6,fa:.6,sh:.8,sh2:.8},th:110,sh:57,ft:150,th2:116,sh2:55,ft2:150},{hp:[112,128],t:270,ua:140,fa:105,ua2:262,fa2:300,L:{ua:.6,fa:.6,sh:.8,sh2:.8},th:68,sh:112,ft:150,th2:116,sh2:55,ft2:150}],
  fr:P=>Ln(PT(P.hp,P.k_.th,24),PT(P.hp,P.k_.th2,24),'band',2)},
 eccentric_calf:{mu:['calves'],anchor:'t',ecc:true,kf:[{hp:[90,60],t:0,th:180,sh:180,ft:125,ua:82,fa:88,th2:180,sh2:180,ft2:125},{hp:[90,60],t:0,th:180,sh:180,ft:68,ua:82,fa:88,th2:186,sh2:250,ft2:160}],
  eq:P=>Rc(94,137,40,9,'eqf',2)+Ln([148,0],[148,146],'eqpad',5)},
 bulgarian_split:{mu:['quads','glutes'],anchor:'a',down:true,kf:[{hp:[80,72],t:5,th:170,sh:180,ft:90,th2:200,sh2:235,ft2:300,ua:180,fa:180},{hp:[80,72],t:14,th:110,sh:200,ft:90,th2:178,sh2:288,ft2:300,ua:182,fa:180}],
  eq:P=>Rc(4,124,44,7,'eqpadf',3)+Post(12,131)+Post(40,131)},
 bird_dog:{mu:['lowback','glutes2','abs'],kf:[{hp:[125,109],t:285,ua:180,fa:180,th:180,sh:90,ft:95,ua2:180,fa2:180,th2:180,sh2:90,ft2:95},{hp:[125,109],t:282,ua:280,fa:280,th:180,sh:90,ft:95,ua2:180,fa2:180,th2:86,sh2:86,ft2:176}]},
 dead_bug:{mu:['abs'],kf:[{hp:[120,138],t:270,ua:0,fa:0,th:0,sh:90,ft:0,ua2:0,fa2:0,th2:0,sh2:90,ft2:0},{hp:[120,138],t:270,ua:285,fa:285,th:0,sh:90,ft:0,ua2:0,fa2:0,th2:80,sh2:82,ft2:0}]},
 pushup:{mu:['chest','triceps'],anchor:'t',down:true,kf:[{hp:[110,108],t:290,ua:180,fa:180,th:110,sh:110,ft:200},{hp:[110,108],t:275,ua:100,fa:223,th:97,sh:97,ft:190}]},
 mountain_climber:{mu:['abs','quads'],fast:true,kf:[{hp:[110,108],t:290,ua:180,fa:180,th:240,sh:125,ft:200,th2:110,sh2:110,ft2:200},{hp:[110,108],t:290,ua:180,fa:180,th:110,sh:110,ft:200,th2:240,sh2:125,ft2:200}]},
 jump_squat:{mu:['quads','glutes','calves'],fast:true,kf:[{hp:[86,108],t:30,th:95,sh:205,ft:90,ua:215,fa:215},{hp:[100,56],t:0,th:180,sh:180,ft:150,ua:62,fa:52}]},
 hip_flexor:{mu:['quads2'],anchor:'k2',slow:true,kf:[{hp:[94,110],t:0,th:90,sh:180,ft:90,th2:175,sh2:270,ft2:180,ua:185,fa:175},{hp:[94,110],t:-5,th:92,sh:201,ft:90,th2:195,sh2:268,ft2:180,ua:185,fa:175}]},
 hip_9090:{mu:['glutes'],slow:true,kf:[{hp:[88,136],t:0,th:92,sh:270,ft:270,th2:262,sh2:270,ft2:270,ua:168,fa:172,ua2:190,fa2:185,L:{sh:.3,th2:.3}},{hp:[88,136],t:40,th:92,sh:270,ft:270,th2:262,sh2:270,ft2:270,ua:150,fa:165,ua2:160,fa2:170,L:{sh:.3,th2:.3}}]},
 thoracic_rot:{mu:['back'],slow:true,top:true,kf:[{hp:[124,82],t:270,ua:0,fa:0,ua2:2,fa2:2,th:0,sh:90,ft:90,th2:4,sh2:92},{hp:[124,82],t:270,ua:0,fa:0,ua2:2,fa2:2,th:0,sh:90,ft:90,th2:4,sh2:92,L:{ua:.15,fa:.15}},{hp:[124,82],t:270,ua:180,fa:180,ua2:2,fa2:2,th:0,sh:90,ft:90,th2:4,sh2:92}]},
 ankle_mob:{mu:['calves'],anchor:'a',slow:true,kf:[{hp:[100,110],t:0,th:90,sh:182,ft:90,th2:178,sh2:270,ft2:180,ua:84,fa:88},{hp:[100,110],t:0,th:88,sh:205,ft:90,th2:195,sh2:270,ft2:180,ua:82,fa:88}],
  eq:P=>Ln([156,0],[156,146],'eqpad',5)}
};
function figFrame(id,u){const F=FIG[id];if(!F)return '';const kf=F.kf;const view=F.view||'side';
  let k;if(kf.length===1)k=kf[0];else{const seg=Math.min(kf.length-2,Math.floor(u*(kf.length-1)));const lu=u*(kf.length-1)-seg;k=lerpK(kf[seg],kf[seg+1],lu)}
  let P=fsolve(k,view);
  if(F.anchor){const P0=fsolve(kf[0],view);const A0=P0[F.anchor],A=P[F.anchor];const dx=A0[0]-A[0],dy=A0[1]-A[1];
    for(const key in P){if(Array.isArray(P[key]))P[key]=[P[key][0]+dx,P[key][1]+dy]}}
  return (F.top?'':`<line x1="0" y1="146.5" x2="200" y2="146.5" class="gnd"/>`)+(F.eq?F.eq(P):'')+muscles(P,F.mu||[],view)+body(P,view)+(F.fr?F.fr(P):'');
}
function figSVG(id,u,cls=''){return `<svg viewBox="0 -14 200 164" class="figsvg ${cls}" role="img" aria-label="Schéma du mouvement">${figFrame(id,u)}</svg>`}
const ease=x=>x<.5?2*x*x:1-Math.pow(-2*x+2,2)/2;
function figTiming(F){if(F.iso)return null;if(F.fast)return{a:.45,h1:.05,b:.45,h2:.05,la:'Rythme dynamique',lb:'Rythme dynamique'};
  if(F.slow)return{a:2,h1:1.2,b:2,h2:.6,la:'Mouvement lent',lb:'Retour lent'};
  if(F.ecc)return{a:3,h1:.4,b:1,h2:.5,la:'Descente lente · 3 à 4 s',lb:'Remontée à 2 pieds'};
  if(F.down)return{a:2.4,h1:.4,b:1,h2:.5,la:'Descente contrôlée · 2 à 3 s',lb:'Remontée · 1 s'};
  return{a:1,h1:.5,b:2.4,h2:.5,la:'Effort · 1 s',lb:'Retour contrôlé · 2 à 3 s'}}
function figPhase(F,time){const T=figTiming(F);if(!T)return{u:0,label:'Position tenue'};const tot=T.a+T.h1+T.b+T.h2;let x=time%tot;
  if(x<T.a)return{u:ease(x/T.a),label:T.la};x-=T.a;if(x<T.h1)return{u:1,label:T.la};x-=T.h1;if(x<T.b)return{u:1-ease(x/T.b),label:T.lb};return{u:0,label:T.lb}}

const RM=(()=>{try{return matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){return false}})();
FIG.plank_hip_dip=FIG.plank;
function photoBlock(id){const p=PH[id],e=EX[id];const nm=esc(e.n);
  const tempo=e.unit==='kg'?'Montée en 1 s, descente contrôlée en 2 à 3 s.':e.unit==='sec'?'Garde la position ou le rythme pendant toute la durée.':'Mouvement contrôlé, amplitude complète.';
  return `<div class="stack" style="gap:8px"><div class="phv" role="img" aria-label="${nm} : enchaînement départ puis arrivée">
    <img class="a" src="img/${p}-0.jpg" alt="" decoding="async"><img class="b" src="img/${p}-1.jpg" alt="" decoding="async">
    <span class="tag a">1 · Départ</span><span class="tag b">2 · Arrivée</span></div>
   <div class="phpair"><figure><img src="img/${p}-0.jpg" alt="${nm}, position de départ" loading="lazy"><figcaption>1 · Départ</figcaption></figure><figure><img src="img/${p}-1.jpg" alt="${nm}, position d'arrivée" loading="lazy"><figcaption>2 · Arrivée</figcaption></figure></div>
   <div class="small muted">${tempo} La machine de ta salle peut différer légèrement : garde les repères de réglage ci-dessous.</div></div>`}
function figBlock(id){if(PH[id])return photoBlock(id);const F=FIG[id];if(!F)return '';const T=figTiming(F);const view=F.top?'Vue de dessus':F.view==='front'?'Vue de face':'Vue de profil';
  const key=`<span class="key"><i></i>Muscles ciblés</span>`;
  const big=T&&!RM?`<div class="fig figbig" data-anim="${id}">${figSVG(id,0)}<div class="figcap"><span class="phase">${T.la}</span>${key}</div></div>`
    :`<div class="fig figbig">${figSVG(id,F.iso?0:1)}<div class="figcap"><span class="phase">${F.iso?'Position tenue':'Arrivée'} · ${view}</span>${key}</div></div>`;
  const pair=T&&F.kf.length>1?`<div class="figpair"><div class="fig"><span>Départ</span>${figSVG(id,0)}</div><div class="fig"><span>${F.kf.length>2?'Fin':'Arrivée'}</span>${figSVG(id,1)}</div></div>`:'';
  return `<div class="stack" style="gap:8px">${big}${pair}<div class="small muted">${view}. ${F.iso?'Garde la position, sans bouger.':'Suis le rythme affiché sous le dessin.'}</div></div>`}
function figThumb(id){if(PH[id])return `<span class="thumb" aria-hidden="true"><img src="img/${PH[id]}-1.jpg" alt="" loading="lazy"></span>`;return FIG[id]?`<span class="thumb" aria-hidden="true">${figSVG(id,FIG[id].iso?0:1)}</span>`:''}
let figRAF=null;const figT0=performance.now();
function figTick(now){const els=document.querySelectorAll('[data-anim]');if(!els.length){figRAF=null;return}
  const t=(now-figT0)/1000;els.forEach(el=>{const F=FIG[el.dataset.anim];if(!F)return;const ph=figPhase(F,t);const svg=el.querySelector('svg');
    const key=Math.round(ph.u*400);if(el._k!==key){el._k=key;svg.innerHTML=figFrame(el.dataset.anim,ph.u)}const lab=el.querySelector('.phase');if(lab&&lab.textContent!==ph.label)lab.textContent=ph.label});
  figRAF=requestAnimationFrame(figTick)}
function figStart(){if(RM||figRAF)return;if(document.querySelector('[data-anim]'))figRAF=requestAnimationFrame(figTick)}

/* ================= VIEW: EXERCISES ================= */
function exDetail(id){const e=EX[id];
  const hist=done().filter(s=>(s.exercises||[]).some(x=>x.exId===id)).sort((a,b)=>a.date<b.date?1:-1);
  let last='';if(hist.length){const x=hist[0].exercises.find(x=>x.exId===id);last=`<div class="tip"><b>Dernière fois (${fmtShort(hist[0].date)}) :</b> ${x.sets.filter(s=>s.reps).map(s=>`${s.reps}${e.unit==='sec'?' s':''}${s.load!==''&&s.load!=null?' × '+s.load+' kg':''}`).join(' / ')}</div>`}
  return `<div class="exdetail"><div class="row"><span class="chip">${esc(e.machine)}</span><span class="small muted">${esc(e.m)}</span></div>
   <div style="margin-top:10px">${figBlock(id)}</div>
   <h4>Réglage</h4><p style="margin:0">${esc(e.setup)}</p>
   <h4>Exécution</h4><ol>${e.steps.map(s=>`<li>${esc(s)}</li>`).join('')}</ol>
   <h4>Erreurs fréquentes</h4><ul>${e.err.map(s=>`<li>${esc(s)}</li>`).join('')}</ul>
   ${e.unit==='kg'?'<h4>Rythme</h4><p style="margin:0">Montée 1 s, descente 2 à 3 s. Expire à l\'effort. Repos 90 s à 2 min entre les séries.</p>':''}
   ${e.tip?`<div class="tip">${esc(e.tip)}</div>`:''}${last}</div>`}
function vExercises(){
  const q=UI.exQuery.toLowerCase();
  const list=Object.entries(EX).filter(([id,e])=>q?(e.n+' '+e.m+' '+e.machine).toLowerCase().includes(q):e.g===UI.exGroup);
  return `<div class="head"><span class="eyebrow">Bibliothèque de mouvements</span><h1>Exercices</h1></div>
  <div class="stack"><input type="search" id="exq" placeholder="Chercher un exercice, une machine, un muscle" value="${esc(UI.exQuery)}">
  <div class="filters">${Object.entries(GROUPS).map(([k,l])=>`<button data-a="exGroup" data-g="${k}" aria-pressed="${!q&&UI.exGroup===k}">${l}</button>`).join('')}</div>
  <div class="slist">${list.map(([id,e])=>`<div><button class="exrow" data-a="exToggle" data-id="${id}" aria-expanded="${UI.exOpenId===id}">${figThumb(id)}<span class="grow"><b>${esc(e.n)}</b><br><span class="small muted">${esc(e.m)}</span></span><span class="muted">${UI.exOpenId===id?'−':'+'}</span></button>${UI.exOpenId===id?`<div class="card" style="margin-top:6px">${exDetail(id)}</div>`:''}</div>`).join('')||'<div class="empty">Aucun exercice trouvé.</div>'}</div></div>`;
}

/* ================= CHARTS ================= */
function lineChart(pts,{invert=false,fmt=v=>v,color='var(--accent)',h=200}={}){
  if(pts.length<2)return `<div class="empty">Il faut au moins deux mesures pour tracer une courbe.</div>`;
  const W=460,H=h,P={l:48,r:14,t:14,b:28};
  const xs=pts.map(p=>parseD(p.x).getTime());let x0=Math.min(...xs),x1=Math.max(...xs);if(x1===x0)x1=x0+864e5;
  const ys=pts.map(p=>p.y);let y0=Math.min(...ys),y1=Math.max(...ys);const sp=(y1-y0)||Math.abs(y0)*0.1||1;y0-=sp*.2;y1+=sp*.2;
  const sx=t=>P.l+(t-x0)/(x1-x0)*(W-P.l-P.r);const ih=H-P.t-P.b;
  const sy=v=>invert?P.t+(v-y0)/(y1-y0)*ih:H-P.b-(v-y0)/(y1-y0)*ih;
  let g='';for(let i=0;i<4;i++){const v=y0+(y1-y0)*(i+0.5)/4;const y=sy(v);g+=`<line class="grid" x1="${P.l}" x2="${W-P.r}" y1="${y}" y2="${y}"/><text x="${P.l-6}" y="${y+4}" text-anchor="end">${esc(fmt(v))}</text>`}
  const xl=[pts[0],pts[Math.floor(pts.length/2)],pts[pts.length-1]].map((p,i)=>`<text x="${sx(parseD(p.x).getTime())}" y="${H-8}" text-anchor="${['start','middle','end'][i]}">${fmtShort(p.x)}</text>`).join('');
  const d=pts.map((p,i)=>`${i?'L':'M'}${sx(xs[i]).toFixed(1)},${sy(p.y).toFixed(1)}`).join(' ');
  const base=H-P.b;const area=`${d} L${sx(xs[xs.length-1]).toFixed(1)},${base} L${sx(xs[0]).toFixed(1)},${base} Z`;
  const dots=pts.map((p,i)=>`<circle cx="${sx(xs[i])}" cy="${sy(p.y)}" r="${i===pts.length-1?5:3}" fill="${color}" stroke="var(--surface)" stroke-width="${i===pts.length-1?2:0}"><title>${fmtShort(p.x)} : ${esc(fmt(p.y))}</title></circle>`).join('');
  return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img">${g}<path d="${area}" fill="${color}" opacity=".10"/><path d="${d}" fill="none" stroke="${color}" stroke-width="2.2" stroke-linejoin="round"/>${dots}${xl}</svg></div>`;
}
function weeklyBars(){
  const W=460,H=200,P={l:40,r:10,t:12,b:28};const ws=mondayOf(today());const weeks=[];
  for(let i=7;i>=0;i--){const s=addDays(ws,-7*i);const parts={};done().filter(x=>x.date>=s&&x.date<=addDays(s,6)).forEach(x=>parts[x.type]=(parts[x.type]||0)+sLoad(x));weeks.push({s,parts,tot:Object.values(parts).reduce((a,b)=>a+b,0)})}
  const max=Math.max(100,...weeks.map(w=>w.tot))*1.1;const bw=(W-P.l-P.r)/weeks.length;const ih=H-P.t-P.b;
  let g='';for(let i=0;i<=3;i++){const v=max*i/3;const y=H-P.b-v/max*ih;g+=`<line class="grid" x1="${P.l}" x2="${W-P.r}" y1="${y}" y2="${y}"/><text x="${P.l-6}" y="${y+4}" text-anchor="end">${Math.round(v)}</text>`}
  let bars='';weeks.forEach((w,i)=>{let y=H-P.b;const x=P.l+i*bw+bw*0.18;Object.keys(TYPES).forEach(k=>{const v=w.parts[k]||0;if(!v)return;const hh=v/max*ih;y-=hh;bars+=`<rect x="${x}" y="${y}" width="${bw*0.64}" height="${hh}" fill="var(--c-${k})"><title>${TYPES[k].label} : ${Math.round(v)} UA</title></rect>`});
    bars+=`<text x="${x+bw*0.32}" y="${H-10}" text-anchor="middle">${pad2(parseD(w.s).getDate())}/${pad2(parseD(w.s).getMonth()+1)}</text>`});
  return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Charge hebdomadaire">${g}${bars}</svg></div>`;
}

/* ================= SPORT ANALYSIS ================= */
function metricOf(sp){
  const t=SPORTS[sp].type;
  if(t==='run')return{l:'Allure (min/km)',inv:true,fmt:v=>fmtPace(v),get:s=>toSec(s.time)&&num(s.distance)?toSec(s.time)/num(s.distance):null};
  if(sp==='velo_salle'||sp==='velo')return{l:'Puissance moyenne (W)',fmt:v=>Math.round(v)+' W',get:s=>num(s.watts),alt:{l:'Vitesse (km/h)',fmt:v=>v.toFixed(1),get:s=>num(s.distance)&&s.duration?num(s.distance)/(s.duration/60):null}};
  if(sp==='marche_incl')return{l:'Dénivelé par séance (m D+)',fmt:v=>Math.round(v)+' m',get:s=>num(s.speed)&&num(s.incline)&&s.duration?num(s.speed)*s.duration/60*1000*num(s.incline)/100:null};
  if(sp==='escaliers')return{l:'Étages par minute',fmt:v=>v.toFixed(1),get:s=>num(s.floors)&&s.duration?num(s.floors)/s.duration:null};
  if(sp==='rameur')return{l:'Allure /500 m',inv:true,fmt:v=>fmtSec(v),get:s=>num(s.distance)&&s.duration?s.duration*60/(num(s.distance)*2):null};
  if(t==='sport')return{l:'Charge par séance (UA)',fmt:v=>Math.round(v),get:s=>s.duration?sLoad(s):null};
  return{l:'Durée (min)',fmt:v=>Math.round(v)+' min',get:s=>s.duration||null};
}
function trendTxt(vals,inv,fmt){if(vals.length<4)return '';const n=Math.min(4,Math.floor(vals.length/2));const a=vals.slice(-n),b=vals.slice(-2*n,-n);
  const m=x=>x.reduce((p,c)=>p+c,0)/x.length;const d=(m(a)-m(b))/m(b)*100;if(!isFinite(d))return '';const better=inv?d<0:d>0;
  if(Math.abs(d)<2)return `Stable sur tes ${n} dernières séances (${fmt(m(a))} en moyenne).`;
  return `${better?'En progrès':'En recul'} de ${Math.abs(d).toFixed(0)} % sur tes ${n} dernières séances par rapport aux ${n} précédentes (${fmt(m(b))} → ${fmt(m(a))}).`}
function sportAnalysis(){
  const t0=today();const d=done();
  const last28=d.filter(s=>{const x=daysBetween(s.date,t0);return x>=0&&x<28});
  const bySp={};last28.forEach(s=>{const k=sportOf(s);bySp[k]=(bySp[k]||0)+(+s.duration||0)});
  const max=Math.max(1,...Object.values(bySp));const totLoad=last28.reduce((a,s)=>a+sLoad(s),0)||1;
  const dist=Object.entries(bySp).sort((a,b)=>b[1]-a[1]).map(([k,m])=>`<div class="hbar t-${SPORTS[k].type}"><span>${SPORTS[k].n}</span><span class="track"><span class="fill" style="width:${(m/max*100).toFixed(0)}%;display:block"></span></span><span class="tn muted">${Math.floor(m/60)}h${pad2(Math.round(m%60))}</span></div>`).join('');
  const present=[...new Set(d.map(sportOf))];
  if(!UI.progSport||!present.includes(UI.progSport))UI.progSport=present.find(x=>SPORTS[x].type==='sport')||present[0]||null;
  let detail='<div class="empty">Enregistre des séances pour voir l\'analyse par sport.</div>';
  if(UI.progSport){const sp=UI.progSport,SP=SPORTS[sp];
    const list=d.filter(s=>sportOf(s)===sp).sort((a,b)=>a.date<b.date?-1:1);const l90=list.filter(s=>daysBetween(s.date,t0)<90);
    const mins=l90.reduce((a,s)=>a+(+s.duration||0),0);const rpes=l90.filter(s=>s.rpe).map(s=>s.rpe);
    const share=last28.filter(s=>sportOf(s)===sp).reduce((a,s)=>a+sLoad(s),0)/totLoad*100;
    const M=metricOf(sp);let pts=list.map(s=>({x:s.date,y:M.get(s)})).filter(p=>p.y!=null);let ML=M;
    if(pts.length<2&&M.alt){ML=M.alt;pts=list.map(s=>({x:s.date,y:M.alt.get(s)})).filter(p=>p.y!=null)}
    const ins=[];const tr=trendTxt(pts.map(p=>p.y),ML.inv,ML.fmt);if(tr)ins.push(tr);
    ins.push(`${share.toFixed(0)} % de ta charge d'entraînement des 4 dernières semaines.`);
    const allR=d.filter(s=>s.rpe).map(s=>s.rpe);const next=list.map(s=>d.find(x=>x.date===addDays(s.date,1)&&x.rpe)).filter(Boolean);
    if(next.length>=2&&allR.length>=5){const mn=next.reduce((a,s)=>a+s.rpe,0)/next.length,ma=allR.reduce((a,b)=>a+b,0)/allR.length;
      if(mn-ma>=0.7)ins.push(`Le lendemain, tes séances te paraissent plus dures (RPE ${mn.toFixed(1)} contre ${ma.toFixed(1)} en moyenne). Garde ce jour-là en récupération.`)}
    let extra='';
    if(SP.type==='sport'){const res=l90.filter(s=>s.result);const c={V:0,D:0,N:0};res.forEach(s=>c[s.result]++);
      const wr=res.length?c.V/res.length*100:null;
      if(res.length)ins.unshift(`Bilan 90 jours : ${c.V} victoire${c.V>1?'s':''}, ${c.D} défaite${c.D>1?'s':''}${c.N?`, ${c.N} nul${c.N>1?'s':''}`:''} (${wr.toFixed(0)} % de victoires).`);
      if(sp==='foot'){const g=l90.reduce((a,s)=>a+(num(s.goals)||0),0),as=l90.reduce((a,s)=>a+(num(s.assists)||0),0);if(g||as)ins.push(`${g} but${g>1?'s':''} et ${as} passe${as>1?'s':''} décisive${as>1?'s':''} sur ${l90.length} match${l90.length>1?'s':''}.`)}
      const lastRes=list.filter(s=>s.result).slice(-8);
      if(lastRes.length)extra=`<div class="row">${lastRes.map(s=>`<span class="res ${s.result}" title="${fmtShort(s.date)}${s.score?' · '+esc(s.score):''}${s.opp?' · '+esc(s.opp):''}">${s.result}</span>`).join('')}<span class="small muted">derniers résultats</span></div>`;
      else extra=`<div class="small muted">Renseigne le résultat de tes matchs pour suivre ton taux de victoires.</div>`}
    if(SP.type==='run'){const km=l90.reduce((a,s)=>a+(num(s.distance)||0),0);ins.push(`${km.toFixed(1)} km sur 90 jours.`)}
    if(['velo_salle','velo','rameur','elliptique'].includes(sp)){const km=l90.reduce((a,s)=>a+(num(s.distance)||0),0);if(km)ins.push(`${km.toFixed(1)} km sur 90 jours.`)}
    detail=`<div class="kpis"><div class="kpi"><span>Séances</span><b>${l90.length}</b><span>90 jours</span></div><div class="kpi"><span>Temps</span><b>${Math.floor(mins/60)}h${pad2(Math.round(mins%60))}</b><span>cumulé</span></div>
      <div class="kpi"><span>RPE moyen</span><b>${rpes.length?(rpes.reduce((a,b)=>a+b,0)/rpes.length).toFixed(1):'–'}</b><span>sur 10</span></div><div class="kpi"><span>Charge</span><b>${share.toFixed(0)} %</b><span>du total 4 sem.</span></div></div>
      ${extra}<ul class="why">${ins.map(i=>`<li>${i}</li>`).join('')}</ul><h3>${ML.l}</h3>${lineChart(pts,{invert:!!ML.inv,fmt:ML.fmt,color:`var(--c-${SP.type})`})}`}
  return `<div class="section"><div class="grid2"><div class="card stack"><h2>Répartition 4 semaines</h2>${dist||'<div class="empty">Aucune séance sur 4 semaines.</div>'}<p class="small muted" style="margin:0">Temps passé par activité.</p></div>
   <div class="card stack"><div class="spread"><h2>Analyse par sport</h2>${present.length?`<select id="progSport" style="width:auto">${present.map(k=>`<option value="${k}" ${k===UI.progSport?'selected':''}>${SPORTS[k].n}</option>`).join('')}</select>`:''}</div>${detail}</div></div></div>`;
}

/* ================= VIEW: PROGRESS ================= */
function vProgress(){
  const t0=today();const d30=done().filter(s=>daysBetween(s.date,t0)<30&&daysBetween(s.date,t0)>=0);
  const km=d30.filter(s=>s.type==='run').reduce((a,s)=>a+(num(s.distance)||0),0);
  const mins=d30.reduce((a,s)=>a+(s.duration||0),0);const r=acwr();const st=acwrState(r.ratio);
  const runs=done().filter(s=>s.type==='run'&&num(s.distance)>0&&toSec(s.time)).sort((a,b)=>a.date<b.date?-1:1);
  const efRuns=runs.filter(s=>sessMeta(s).key!=='run_q').map(s=>({x:s.date,y:toSec(s.time)/num(s.distance)}));
  const t5=S.tests.filter(t=>t.kind==='5k'&&toSec(t.value)).sort((a,b)=>a.date<b.date?-1:1).map(t=>({x:t.date,y:toSec(t.value)}));
  const t10=S.tests.filter(t=>t.kind==='10k'&&toSec(t.value)).sort((a,b)=>a.date<b.date?-1:1).map(t=>({x:t.date,y:toSec(t.value)}));
  const wt=S.tests.filter(t=>t.kind==='poids'&&num(t.value)).sort((a,b)=>a.date<b.date?-1:1).map(t=>({x:t.date,y:num(t.value)}));
  // strength
  const e1={};done().sort((a,b)=>a.date<b.date?-1:1).forEach(s=>(s.exercises||[]).forEach(x=>{const e=EX[x.exId];if(!e||e.unit!=='kg'||e.assist)return;let best=0;x.sets.forEach(st=>{const L=num(st.load),R=num(st.reps);if(L>0&&R>0&&R<=15)best=Math.max(best,L*(1+R/30))});if(best){(e1[x.exId]=e1[x.exId]||[]).push({x:s.date,y:best})}}));
  const exIds=Object.keys(e1);if(!UI.progEx||!e1[UI.progEx])UI.progEx=exIds.sort((a,b)=>e1[b].length-e1[a].length)[0]||null;
  const recs=exIds.map(id=>{const arr=e1[id];const best=Math.max(...arr.map(p=>p.y));const first=arr[0].y;return{id,best,delta:(best-first)/first*100}}).sort((a,b)=>b.delta-a.delta);
  const lastTests=[...S.tests].sort((a,b)=>a.date<b.date?1:-1).slice(0,6);
  return `<div class="head"><span class="eyebrow">30 derniers jours</span><h1>Progrès</h1></div>
  <div class="kpis"><div class="kpi"><span>Séances</span><b>${d30.length}</b><span>faites</span></div><div class="kpi"><span>Temps actif</span><b>${Math.floor(mins/60)}h${pad2(mins%60)}</b><span>cumulé</span></div>
   <div class="kpi"><span>Running</span><b>${km.toFixed(1)}</b><span>km</span></div><div class="kpi"><span>Charge</span><b>${r.ratio==null?'–':r.ratio.toFixed(2)}</b><span class="pill ${st.c}" style="align-self:flex-start">${st.t}</span></div></div>
  <div class="section"><div class="card stack"><div class="spread"><h2>Charge hebdomadaire</h2><div class="legend">${Object.keys(TYPES).map(k=>`<span class="t-${k}"><span class="dot"></span>${TYPES[k].label}</span>`).join('')}</div></div>${weeklyBars()}
   <p class="small muted" style="margin:0">Charge = durée × RPE (méthode sRPE de Foster). Monte de 10 % par semaine maximum. Un ratio 7 jours / 4 semaines entre 0,8 et 1,3 limite le risque de blessure.</p></div></div>
  ${sportAnalysis()}
  <div class="section"><div class="grid2">
   <div class="card stack"><h2>Force estimée (1RM)</h2>${exIds.length?`<select id="progEx">${exIds.map(id=>`<option value="${id}" ${id===UI.progEx?'selected':''}>${esc(EX[id].n)}</option>`).join('')}</select>${lineChart(e1[UI.progEx]||[],{fmt:v=>Math.round(v)+' kg',color:'var(--c-muscu)'})}<p class="small muted" style="margin:0">Formule d'Epley : charge × (1 + reps / 30), meilleure série de chaque séance.</p>`:`<div class="empty">Enregistre une séance de musculation avec charges et reps pour voir ta courbe.</div>`}</div>
   <div class="card stack"><h2>Allure en endurance</h2>${lineChart(efRuns,{invert:true,fmt:v=>fmtPace(v),color:'var(--c-run)'})}<p class="small muted" style="margin:0">Allure moyenne des sorties hors fractionné (min/km). À effort égal, une courbe qui monte = tu vas plus vite.</p></div>
   <div class="card stack"><h2>Chrono 5 km</h2>${lineChart(t5,{invert:true,fmt:v=>fmtSec(v),color:'var(--c-run)'})}${t10.length>1?'<h3>10 km</h3>'+lineChart(t10,{invert:true,fmt:v=>fmtSec(v),color:'var(--c-run)'}):''}</div>
   <div class="card stack"><h2>Poids corporel</h2>${lineChart(wt,{fmt:v=>v.toFixed(1)+' kg',color:'var(--c-renfo)'})}</div>
  </div></div>
  <div class="section"><div class="card stack"><h2>Ajouter une mesure</h2>
   <div class="fields"><label class="f">Type<select id="tKind"><option value="5k">Chrono 5 km</option><option value="10k">Chrono 10 km</option><option value="poids">Poids (kg)</option></select></label>
   <label class="f">Date<input type="date" id="tDate" value="${t0}"></label><label class="f">Valeur<input type="text" id="tVal" placeholder="25:40 ou 80.5" inputmode="decimal"></label></div>
   <div class="row"><button class="btn primary" data-a="addTest">Enregistrer la mesure</button><label class="row small"><input type="checkbox" id="tRef" checked> Un chrono 5 km met à jour mes allures</label></div>
   ${lastTests.length?`<div class="tablewrap"><table class="rec"><tr><th>Date</th><th>Mesure</th><th>Valeur</th><th></th></tr>${lastTests.map(t=>`<tr><td class="tn">${fmtShort(t.date)}</td><td>${{'5k':'5 km','10k':'10 km',poids:'Poids'}[t.kind]}</td><td class="tn">${esc(t.value)}${t.kind==='poids'?' kg':''}</td><td><button class="btn ghost sm danger" data-a="delTest" data-id="${t.id}">Supprimer</button></td></tr>`).join('')}</table></div>`:''}</div></div>
  ${recs.length?`<div class="section"><div class="card stack"><h2>Records de force</h2><div class="tablewrap"><table class="rec"><tr><th>Exercice</th><th>1RM estimé</th><th>Depuis le début</th></tr>${recs.map(x=>`<tr><td>${esc(EX[x.id].n)}</td><td class="tn">${Math.round(x.best)} kg</td><td class="tn" style="color:${x.delta>0?'var(--ok)':'var(--muted)'}">${x.delta>0?'+':''}${x.delta.toFixed(0)} %</td></tr>`).join('')}</table></div></div></div>`:''}`;
}

/* ================= VIEW: SETTINGS ================= */
function vSettings(){
  const p=S.profile;const opts=[0,20,30,45,60,75,90,120];
  const days=[1,2,3,4,5,6,0].map(d=>`<label class="f">${DOWS[d]}<select data-av="${d}" id="av-${d}">${opts.map(o=>`<option value="${o}" ${+p.avail[d]===o?'selected':''}>${o?o+' min':'Repos'}</option>`).join('')}</select></label>`).join('');
  const syncTxt={cloud:'Synchronisé sur ton compte Claude : tes données te suivent sur téléphone et ordinateur.',local:'Stocké dans ce navigateur uniquement. Ouvre la page connecté à Claude pour synchroniser.',err:'Dernière sauvegarde en ligne échouée. Tes données restent dans ce navigateur.'}[sync.mode];
  return `<div class="head"><span class="eyebrow">Profil et préférences</span><h1>Réglages</h1></div>
  <div class="stack">
  <div class="card stack"><h2>Objectif</h2><div class="fields">
    <label class="f">Objectif principal<select id="pGoal">${Object.entries(GOALS).map(([k,g])=>`<option value="${k}" ${p.goal===k?'selected':''}>${g.label}</option>`).join('')}</select></label>
    <label class="f">Chrono 5 km de référence<input type="text" id="pRef" value="${esc(p.ref5k)}" placeholder="mm:ss"></label>
    <label class="f">Lieu habituel<select id="pLieu">${Object.entries(LIEUX).map(([k,l])=>`<option value="${k}" ${(p.lieu||'salle')===k?'selected':''}>${l}</option>`).join('')}</select></label>
    <label class="f">Début du cycle de 4 semaines<input type="date" id="pCycle" value="${esc(p.cycleStart)}"></label>
    <label class="f">Repos entre séries (muscu)<select id="pRest">${[60,75,90,120,150,180].map(v=>`<option value="${v}" ${+(p.rest||90)===v?'selected':''}>${v>=120?Math.floor(v/60)+' min'+(v%60?' '+v%60+' s':''):v+' s'}</option>`).join('')}</select></label></div>
    <p class="small muted" style="margin:0">Semaine type : ${Object.entries(GOALS[p.goal].targets).map(([k,n])=>`${n} × ${keyLabel(k).toLowerCase()}`).join(', ')}.</p></div>
  <div class="card stack"><h2>Activités fixes</h2><p class="small muted" style="margin:0">Tes rendez-vous sportifs réguliers. Ils sont posés en premier dans la semaine et le reste du plan s'organise autour (pas de jambes lourdes la veille, récup le lendemain).</p>
    ${(p.recurring||[]).map((r,i)=>`<div class="recrow"><label class="f">Jour<select data-rec="${i}" data-k="dow" id="rec-dow-${i}">${[1,2,3,4,5,6,0].map(d=>`<option value="${d}" ${+r.dow===d?'selected':''}>${DOWS[d]}</option>`).join('')}</select></label>
      <label class="f">Activité<select data-rec="${i}" data-k="sport" id="rec-sp-${i}">${sportOptions(r.sport)}</select></label>
      <label class="f">Durée<select data-rec="${i}" data-k="dur" id="rec-dur-${i}">${[30,45,60,75,90,120].map(o=>`<option value="${o}" ${+r.dur===o?'selected':''}>${o} min</option>`).join('')}</select></label>
      <button class="btn ghost sm danger" data-a="recDel" data-i="${i}">Retirer</button></div>`).join('')||'<div class="small muted">Aucune activité fixe.</div>'}
    <div class="row"><button class="btn sm" data-a="recAdd">+ Ajouter une activité fixe</button></div></div>
  <div class="card stack"><h2>Disponibilités</h2><p class="small muted" style="margin:0">Temps habituel par jour. Les recommandations et la planification automatique s'y adaptent.</p><div class="avail">${days}</div></div>
  <div class="card stack"><h2>Logique d'entraînement</h2><ul class="why">
    <li>Surcharge progressive en double progression : quand toutes les séries atteignent le haut de la fourchette, la charge monte d'un palier.</li>
    <li>48 h minimum entre deux séances qui chargent les jambes, et jamais de fractionné le lendemain d'une séance jambes.</li>
    <li>Pas deux séances intenses d'affilée. Environ 80 % du running en endurance facile, 20 % en qualité.</li>
    <li>Suivi de charge par sRPE (durée × effort ressenti) et ratio aigu/chronique pour éviter les pics de fatigue.</li>
    <li>Toutes les 4 semaines, une semaine allégée : une série de moins, running raccourci de 25 %.</li>
    <li>Allures calculées depuis ton chrono 5 km : EF à +22 à 34 %, seuil à +6 %, 400 m à −4 %.</li></ul></div>
  <div class="card stack"><h2>Strava et Garmin</h2><p style="margin:0">${S.profile.strava?`Synchro Strava active depuis le ${fmtShort(S.profile.stravaSince||today())}. Les nouvelles activités s'importent à chaque ouverture de l'app.`:'Connecte Strava pour importer tes activités automatiquement.'}</p>
    <p class="small muted" style="margin:0">Garmin : dans l'app Garmin Connect, relie ton compte à Strava (Paramètres, Applications connectées). Tes activités Garmin arrivent alors ici via Strava. Pour la muscu, les séries enregistrées par la montre (charges et répétitions) apparaissent dans chaque séance.</p>
    <div class="row"><button class="btn" data-a="stravaSync">${S.profile.strava?'Synchroniser maintenant':'Connecter Strava'}</button>${S.profile.strava?'<button class="btn ghost sm danger" data-a="stravaOff">Couper la synchro</button>':''}</div></div>
  <p class="small muted" style="margin:0">Photos d'exercices : Free Exercise DB, domaine public.</p>
  <div class="card stack"><h2>Sauvegarde</h2><p style="margin:0">${syncTxt}</p>
    <div class="row"><button class="btn" data-a="copyBackup">Copier ma sauvegarde</button>${IN_CLAUDE?'':'<button class="btn" data-a="downloadBackup">Télécharger la sauvegarde</button>'}</div>
    <label class="f">Restaurer depuis un fichier .json<input type="file" id="impFile" accept="application/json,.json"></label>
    <label class="f">Ou colle le texte d'une sauvegarde<textarea id="imp" placeholder='{"profile":…}'></textarea></label>
    <div class="row"><button class="btn" data-a="importBackup">Restaurer</button></div></div>
  </div>`;
}

/* ================= SESSION EDITOR ================= */
const ov=document.getElementById('ov'),ov2=document.getElementById('ov2');
function openEditor(s,isNew){ED=clone(s);ED._new=!!isNew;UI.confirmDel=false;ov.innerHTML='';renderSheet();ov.hidden=false;if(ED.exercises&&ED.exercises.length)keepAwake(true)}
function closeEditor(){ED=null;ov.hidden=true;ov.innerHTML='';stopTimer();keepAwake(false)}
function renderSheet(){
  if(!ED){return}
  const ob=ov.querySelector('.sheet-b');const keepScroll=ob?ob.scrollTop:0;
  const s=ED;let body='';
  body+=`<div class="fields"><label class="f">Activité<select id="e-sport">${sportOptions(sportOf(s))}</select></label><label class="f">Titre<input type="text" id="e-title" data-ed="title" value="${esc(s.title)}"></label><label class="f">Date<input type="date" id="e-date" data-ed="date" value="${s.date}"></label><label class="f">Durée (min)<input type="number" id="e-dur" data-ed="duration" min="0" value="${s.duration??''}" inputmode="numeric"></label></div>`;
  if(s.plan)body+=`<div class="plan"><div class="eyebrow" style="margin-bottom:4px">Contenu de la séance</div>${esc(s.plan)}</div>`;
  if(s.type==='run'){const pace=toSec(s.time)&&num(s.distance)?toSec(s.time)/num(s.distance):null;
    body+=`<div class="fields"><label class="f">Distance (km)<input type="text" id="e-dist" data-ed="distance" value="${esc(s.distance)}" inputmode="decimal" placeholder="8.2"></label><label class="f">Allure (/km)<input type="text" id="e-pacein" value="${pace?fmtPace(pace):''}" placeholder="6:00"></label><label class="f">Temps (h:mm:ss)<input type="text" id="e-time" data-ed="time" value="${esc(s.time)}" placeholder="1:09:00"></label><label class="f">FC moyenne<input type="number" id="e-hr" data-ed="hr" value="${esc(s.hr)}" inputmode="numeric"></label></div>
    <div class="small">Allure moyenne : <b class="tn" id="e-pace">${pace?fmtPace(pace)+' /km':'–'}</b></div>`}
  body+=metricFields(s);
  if(s.stravaSets)body+=`<div class="sugg"><b>Séries enregistrées par ta montre :</b> ${esc(s.stravaSets)}<br><span class="small muted">La montre devine mal les noms d'exercices. Ajoute les exercices ci-dessous pour que la progression les prenne en compte.</span></div>`;
  if(s.exercises){body+=s.exercises.map((x,ei)=>{const e=EX[x.exId];const sg=suggestion(x.exId,x.lo,x.hi,addDays(s.date,-1));const u=e.unit;
    return `<div class="exc"><div class="spread"><div class="row" style="flex-wrap:nowrap;min-width:0"><button class="thumbbtn" data-a="exInfo" data-id="${x.exId}" aria-label="Voir le mouvement">${figThumb(x.exId)}</button><div style="min-width:0"><b>${esc(e.n)}</b><div class="small muted tn">${x.sets.length} × ${x.lo===x.hi?x.lo:x.lo+'-'+x.hi}${u==='sec'?' s':' reps'}${e.assist?' · charge = assistance':''}</div></div></div><div class="row"><button class="btn sm" data-a="exInfo" data-id="${x.exId}">Mouvement</button><button class="btn ghost sm danger" data-a="rmEx" data-ei="${ei}" aria-label="Retirer l'exercice">Retirer</button></div></div>
    ${sg.txt?`<div class="sugg">${esc(sg.txt)}</div>`:''}
    <div class="sets">${(()=>{const cur=x.sets.findIndex(st=>!st.ok);return x.sets.map((st,si)=>setRow(x,e,ei,si,st,si===cur)).join('')})()}</div>
    <div class="row"><button class="btn ghost sm" data-a="addSet" data-ei="${ei}">+ Série</button>${x.sets.length>1?`<button class="btn ghost sm" data-a="rmSet" data-ei="${ei}">− Série</button>`:''}</div></div>`}).join('');
    body+=`<label class="f">Ajouter un exercice<select id="addEx"><option value="">Choisir…</option>${Object.entries(GROUPS).map(([g,l])=>`<optgroup label="${l}">${Object.entries(EX).filter(([,e])=>e.g===g).map(([id,e])=>`<option value="${id}">${esc(e.n)}</option>`).join('')}</optgroup>`).join('')}</select></label>`}
  body+=`<div><div class="eyebrow" style="margin-bottom:6px">Effort ressenti (RPE)</div><div class="rpe">${Array.from({length:10},(_,i)=>`<button data-a="rpe" data-n="${i+1}" aria-pressed="${s.rpe===i+1}">${i+1}</button>`).join('')}</div><div class="small muted" style="margin-top:4px">${s.rpe?RPE_TXT[s.rpe]:'Note l\'effort global à la fin. Cible muscu débutant : 7 à 8.'}</div></div>`;
  body+=`<label class="f">Notes<textarea id="e-notes" data-ed="notes" placeholder="Sensations, douleurs, réglages machine…">${esc(s.notes)}</textarea></label>`;
  const foot=UI.confirmDel?`<span class="small">Supprimer définitivement ?</span><div class="row"><button class="btn sm" data-a="delNo">Annuler</button><button class="btn sm danger" data-a="delYes">Supprimer</button></div>`:
   `<div class="row">${s.exercises?`<button class="btn sm" data-a="timer" data-n="${S.profile.rest||90}">Repos ${S.profile.rest||90} s</button>`:''}${!s._new?`<button class="btn ghost sm danger" data-a="delAsk">Supprimer</button>`:''}</div>
   <div class="row"><button class="btn" data-a="saveSess">${s._new?'Planifier':'Enregistrer'}</button><button class="btn primary" data-a="finishSess">${s.status==='done'?'Mettre à jour':'Séance faite'}</button></div>`;
  ov.innerHTML=`<div class="sheet t-${s.type}" role="dialog" aria-modal="true" aria-label="${esc(s.title)}"><div class="sheet-h"><div class="row">${typeChip(s.type)}${s.stravaId?'<span class="strava small">Strava</span>':''}<span class="pill ${s.status==='done'?'ok':'neutral'}">${s.status==='done'?'Faite':'Prévue'}</span></div><button class="x" data-a="close" aria-label="Fermer">×</button></div><div class="sheet-b">${body}</div>${timerBar()}<div class="sheet-f">${foot}</div></div>`;
  const nb=ov.querySelector('.sheet-b');if(nb&&keepScroll)nb.scrollTop=keepScroll;
}
const CHECK='<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
function setRow(x,e,ei,si,st,cur){const u=e.unit;const rl=u==='sec'?'secondes':'reps';const ll=u==='kg'?(e.perHand?'kg / haltère':'kg'):'lest kg';
  const stp=(f,v,ph,im,lab)=>`<div class="stp"><button class="sb" data-a="stepSet" data-f="${f}" data-d="-1" data-ei="${ei}" data-si="${si}" aria-label="Moins ${lab}">−</button><input type="number" inputmode="${im}" step="any" id="${f[0]}-${ei}-${si}" data-set="${f}" data-ei="${ei}" data-si="${si}" value="${esc(v)}" placeholder="${ph}" aria-label="${lab} série ${si+1}"><button class="sb" data-a="stepSet" data-f="${f}" data-d="1" data-ei="${ei}" data-si="${si}" aria-label="Plus ${lab}">+</button><span class="lab">${lab}</span></div>`;
  return `<div class="srow${st.ok?' done':''}${cur?' cur':''}" id="row-${ei}-${si}"><span class="n tn">${si+1}</span>${stp('reps',st.reps,x.hi,'numeric',rl)}${stp('load',st.load,u==='kg'?'0':'–','decimal',ll)}<button class="okb" data-a="okSet" data-ei="${ei}" data-si="${si}" aria-pressed="${!!st.ok}" aria-label="Valider la série ${si+1}">${CHECK}</button></div>`}
/* repos & écran allumé */
let wakeLock=null;
async function keepAwake(on){try{if(on&&!wakeLock&&'wakeLock' in navigator&&document.visibilityState==='visible'){wakeLock=await navigator.wakeLock.request('screen');wakeLock.addEventListener('release',()=>{wakeLock=null})}else if(!on&&wakeLock){await wakeLock.release();wakeLock=null}}catch(e){wakeLock=null}}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&ED&&ED.exercises)keepAwake(true)});
function restFor(exId){const e=EX[exId];const base=+(S.profile.rest||90);return e&&e.unit==='kg'?base:Math.min(45,base)}
let audioCtx=null;
function beep(){try{audioCtx=audioCtx||new (window.AudioContext||window.webkitAudioContext)();const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.frequency.value=880;g.gain.setValueAtTime(.25,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+.5);o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+.5)}catch(e){}}
function timerBar(){if(!timerEnd)return '';return `<div class="restbar" id="restbar"><div><div class="eyebrow">Repos</div><span class="timer tn" id="timer">${fmtSec(Math.max(0,Math.round((timerEnd-Date.now())/1000)))}</span></div><div class="row"><button class="btn sm" data-a="timerAdd" data-n="-15">−15 s</button><button class="btn sm" data-a="timerAdd" data-n="15">+15 s</button><button class="btn sm primary" data-a="timerStop">Passer</button></div></div>`}
const MF={dist:['distance','Distance (km)','decimal'],watts:['watts','Puissance moy. (W)','numeric'],hr:['hr','FC moyenne','numeric'],speed:['speed','Vitesse (km/h)','decimal'],
  incline:['incline','Inclinaison (%)','decimal'],floors:['floors','Étages montés','numeric'],score:['score','Score','text'],opp:['opp','Adversaire / partenaire','text'],goals:['goals','Buts','numeric']};
function derived(s){const sp=sportOf(s),d=+s.duration||0;
  if(sp==='marche_incl'&&num(s.speed)&&num(s.incline)&&d)return `Dénivelé estimé : <b class="tn">${Math.round(num(s.speed)*d/60*1000*num(s.incline)/100)} m D+</b> · ${(num(s.speed)*d/60).toFixed(1)} km`;
  if(sp==='escaliers'&&num(s.floors)&&d)return `Rythme : <b class="tn">${(num(s.floors)/d).toFixed(1)} étages/min</b> · ≈ ${Math.round(num(s.floors)*3)} m D+`;
  if((sp==='velo_salle'||sp==='velo')&&num(s.distance)&&d)return `Vitesse moyenne : <b class="tn">${(num(s.distance)/(d/60)).toFixed(1)} km/h</b>`;
  if(sp==='rameur'&&num(s.distance)&&d)return `Allure : <b class="tn">${fmtSec(d*60/(num(s.distance)*2))} /500 m</b>`;
  return ''}
function metricFields(s){const sp=SPORTS[sportOf(s)];const m=(sp.m||[]).filter(k=>!(s.type==='run'&&k==='hr'));if(!m.length)return '';
  let h='';if(m.includes('result'))h+=`<div><div class="eyebrow" style="margin-bottom:6px">Résultat</div><div class="seg">${Object.entries(RESULT).map(([k,l])=>`<button data-a="result" data-v="${k}" aria-pressed="${s.result===k}">${l}</button>`).join('')}</div></div>`;
  const f=m.filter(k=>MF[k]);if(f.length)h+=`<div class="fields">${f.map(k=>{const [key,l,im]=MF[k];return `<label class="f">${l}<input type="${im==='text'?'text':'text'}" inputmode="${im==='text'?'text':im}" id="m-${key}" data-ed="${key}" value="${esc(s[key])}"></label>`}).join('')}${m.includes('goals')?`<label class="f">Passes décisives<input type="text" inputmode="numeric" id="m-assists" data-ed="assists" value="${esc(s.assists)}"></label>`:''}</div>`;
  const dv=derived(s);if(dv)h+=`<div class="small" id="e-derived">${dv}</div>`;return h}
let timerInt=null,timerEnd=0;
function stopTimer(){clearInterval(timerInt);timerInt=null;timerEnd=0;const b=document.getElementById('restbar');if(b)b.remove()}
function startTimer(sec){clearInterval(timerInt);timerEnd=Date.now()+sec*1000;
  if(!document.getElementById('restbar')){const f=ov.querySelector('.sheet-f');if(f)f.insertAdjacentHTML('beforebegin',timerBar())}
  const tick=()=>{const t=document.getElementById('timer');if(!t){clearInterval(timerInt);return}const r=Math.max(0,Math.round((timerEnd-Date.now())/1000));t.textContent=fmtSec(r);
    if(r<=0){clearInterval(timerInt);timerInt=null;t.textContent='Go';document.getElementById('restbar')?.classList.add('over');beep();try{navigator.vibrate&&navigator.vibrate([200,100,200])}catch(e){}
      setTimeout(()=>{if(timerEnd&&Date.now()>=timerEnd)stopTimer()},4000)}};
  tick();timerInt=setInterval(tick,250)}

function upsert(s){const c=clone(s);delete c._new;delete c.example;const i=S.sessions.findIndex(x=>x.id===c.id);if(i>=0)S.sessions[i]=c;else S.sessions.push(c);persistSession(c)}
function commit(markDone){
  makeReal();
  if(markDone){ED.status='done';if(ED.type==='run'&&!ED.duration&&toSec(ED.time))ED.duration=Math.round(toSec(ED.time)/60);if(!ED.rpe)ED.rpe=ED.hard?8:6;
    if(ED.exercises)ED.exercises.forEach(x=>x.sets.forEach(st=>{if(st.reps!==''&&st.reps!=null)st.ok=true}))}
  ED.auto=false;upsert(ED);let adj=0;if(markDone)adj=adaptAfter(ED.date);
  toast(markDone?(adj?'Séance enregistrée, semaine réajustée':'Séance enregistrée comme faite'):'Séance enregistrée');closeEditor();render()}

/* picker */
function openPicker(date){
  const av=+S.profile.avail[parseD(date).getDay()]||0;const b=pickBest(date,S.sessions.filter(s=>s.status==='done'||s.date<date),av||60);
  ov2.innerHTML=`<div class="sheet" role="dialog" aria-modal="true" aria-label="Choisir une séance"><div class="sheet-h"><div><div class="eyebrow">${fmtDay(date)}</div><h3>Choisir une séance</h3></div><button class="x" data-a="closePick" aria-label="Fermer">×</button></div>
  <div class="sheet-b">${b&&b.deficit>0?`<div class="sugg"><b>Conseillée :</b> ${esc(b.tpl.name)}. ${esc(b.why[0]||'')}</div>`:''}
  ${Object.keys(TYPES).map(k=>`<div class="stack" style="gap:6px"><div class="eyebrow">${TYPES[k].label}</div>${TPL.filter(t=>t.type===k).map(t=>`<button class="sitem t-${t.type}" data-a="pickTpl" data-t="${t.id}" data-d="${date}"><span class="stripe"></span><span class="main"><span class="ttl">${esc(t.name)}${b&&b.tpl.id===t.id&&b.deficit>0?' · conseillée':''}</span><br><span class="meta">${t.dur} min · ${esc(t.desc)}</span></span></button>`).join('')}
  <div class="row">${Object.entries(SPORTS).filter(([,x])=>x.type===k).map(([id,x])=>`<button class="btn sm" data-a="pickFree" data-sport="${id}" data-d="${date}">+ ${esc(x.n)}</button>`).join('')}</div></div>`).join('')}</div></div>`;
  ov2.hidden=false}
function closePicker(){ov2.hidden=true;ov2.innerHTML=''}
function openExInfo(id){ov2.innerHTML=`<div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(EX[id].n)}"><div class="sheet-h"><h3>${esc(EX[id].n)}</h3><button class="x" data-a="closePick" aria-label="Fermer">×</button></div><div class="sheet-b">${exDetail(id)}</div></div>`;ov2.hidden=false;figStart()}

function toast(t){const el=document.getElementById('toast');el.textContent=t;el.hidden=false;clearTimeout(toast._t);toast._t=setTimeout(()=>el.hidden=true,2200)}

/* ================= EVENTS ================= */
const A={
 nav:b=>{UI.view=b.dataset.v;render();window.scrollTo(0,0)},
 open:b=>{const s=S.sessions.find(x=>x.id===b.dataset.id);if(s)openEditor(s,false)},
 close:()=>closeEditor(),
 pick:b=>openPicker(b.dataset.d),
 closePick:()=>closePicker(),
 pickTpl:b=>{closePicker();openEditor(instantiate(TPLBY[b.dataset.t],b.dataset.d),true)},
 pickFree:b=>{closePicker();openEditor(sportSession(b.dataset.sport,b.dataset.d,{duration:+(b.dataset.dur||60)}),true)},
 startTpl:b=>openEditor(instantiate(TPLBY[b.dataset.t],today()),true),
 planTplDate:b=>{makeReal();upsert(instantiate(TPLBY[b.dataset.t],b.dataset.d));toast('Ajoutée au calendrier');render()},
 planTpl:b=>{const d=document.getElementById('d-'+b.dataset.t).value||today();makeReal();upsert(instantiate(TPLBY[b.dataset.t],d));toast('Planifiée le '+fmtShort(d))},
 recoDay:b=>{const d=b.dataset.d;const av=+S.profile.avail[parseD(d).getDay()]||60;const r=pickBest(d,S.sessions,av);if(r)openEditor(instantiate(r.tpl,d),true)},
 genWeek:b=>{makeReal();const {created,removed}=generateWeek(b.dataset.d);removed.forEach(s=>{S.sessions=S.sessions.filter(x=>x.id!==s.id);persistDelete(s.id)});created.forEach(upsert);
   toast(created.length?`${created.length} séance${created.length>1?'s':''} planifiée${created.length>1?'s':''}`:'Semaine déjà complète ou sans créneau libre');render()},
 goDay:b=>{UI.view='calendar';UI.selDay=b.dataset.d;UI.calMonth=b.dataset.d.slice(0,7);render()},
 selDay:b=>{UI.selDay=b.dataset.d;render()},
 calMove:b=>{const [y,m]=UI.calMonth.split('-').map(Number);const d=new Date(y,m-1+(+b.dataset.n),1);UI.calMonth=iso(d).slice(0,7);render()},
 calToday:()=>{UI.calMonth=today().slice(0,7);UI.selDay=today();render()},
 exGroup:b=>{UI.exGroup=b.dataset.g;UI.exQuery='';UI.exOpenId=null;render()},
 exToggle:b=>{UI.exOpenId=UI.exOpenId===b.dataset.id?null:b.dataset.id;render()},
 exInfo:b=>openExInfo(b.dataset.id),
 addSet:b=>{const x=ED.exercises[+b.dataset.ei];const l=x.sets[x.sets.length-1];x.sets.push({reps:'',load:l?l.load:'',ok:false});renderSheet()},
 rmSet:b=>{ED.exercises[+b.dataset.ei].sets.pop();renderSheet()},
 rmEx:b=>{ED.exercises.splice(+b.dataset.ei,1);renderSheet()},
 rpe:b=>{ED.rpe=+b.dataset.n;renderSheet()},
 timer:b=>startTimer(+b.dataset.n),
 timerAdd:b=>{if(!timerEnd)return;timerEnd=Math.max(Date.now()+1000,timerEnd+(+b.dataset.n)*1000);if(!timerInt)startTimer((timerEnd-Date.now())/1000)},
 timerStop:()=>stopTimer(),
 stepSet:b=>{const ei=+b.dataset.ei,si=+b.dataset.si,f=b.dataset.f,d=+b.dataset.d;const x=ED.exercises[ei],e=EX[x.exId],st=x.sets[si];
   let v=num(st[f]);
   if(v==null){if(f==='reps')v=x.hi;else{const prev=x.sets.slice(0,si).map(z=>num(z.load)).filter(z=>z!=null).pop();v=prev??0}if(f==='load'&&d<0&&v===0)return}
   else v=f==='reps'?Math.max(0,v+d*(e.unit==='sec'?5:1)):Math.max(0,Math.round((v+d*(e.step||2.5))*100)/100);
   st[f]=String(v);const inp=document.getElementById(f[0]+'-'+ei+'-'+si);if(inp)inp.value=v;try{navigator.vibrate&&navigator.vibrate(8)}catch(e){}},
 okSet:b=>{const ei=+b.dataset.ei,si=+b.dataset.si;const x=ED.exercises[ei],st=x.sets[si];
   if(st.ok){st.ok=false;renderSheet();return}
   if(st.reps===''||st.reps==null)st.reps=String(x.hi);st.ok=true;
   const nx=x.sets[si+1];x.sets.slice(si+1).forEach(z=>{if(!z.ok)z.load=st.load});
   const nextEx=!nx&&ED.exercises[ei+1];const last=!nx&&!nextEx;
   renderSheet();try{navigator.vibrate&&navigator.vibrate(30)}catch(e){}
   if(!last)startTimer(restFor(x.exId));else{stopTimer();toast('Dernière série faite. Note ton RPE puis « Séance faite ».')}
   const target=document.getElementById(nx?`row-${ei}-${si+1}`:nextEx?`row-${ei+1}-0`:'');if(target)target.scrollIntoView({block:'center',behavior:'smooth'})},
 saveSess:()=>commit(false),
 finishSess:()=>commit(true),
 delAsk:()=>{UI.confirmDel=true;renderSheet()},
 delNo:()=>{UI.confirmDel=false;renderSheet()},
 delYes:()=>{const id=ED.id;if(ED.stravaId){S.profile.stravaIgnored=[...(S.profile.stravaIgnored||[]),ED.stravaId];persistProfile()}S.sessions=S.sessions.filter(s=>s.id!==id);persistDelete(id);closeEditor();toast('Séance supprimée');render()},
 crit:b=>{UI.crit=UI.crit||critDefaults();const k=b.dataset.k;UI.crit[k]=k==='lieu'?b.dataset.v:+b.dataset.v;render()},
 startReco:b=>{openEditor(instantiate(TPLBY[b.dataset.t],today(),{dur:+b.dataset.dur,lieu:UI.crit?.lieu}),true)},
 planReco:b=>{makeReal();upsert(instantiate(TPLBY[b.dataset.t],today(),{dur:+b.dataset.dur,lieu:UI.crit?.lieu}));toast('Ajoutée à aujourd\'hui');render()},
 skipPlanned:b=>{const s=S.sessions.find(x=>x.id===b.dataset.id);if(!s)return;makeReal();S.sessions=S.sessions.filter(x=>x.id!==s.id);persistDelete(s.id);adaptAfter(today());toast('Séance retirée, semaine réajustée');render()},
 quickLog:()=>{const sport=$('#qlType').value,sp=SPORTS[sport],date=$('#qlDate').value||today(),rpe=+$('#qlRpe').value,notes=$('#qlNotes').value.trim();
   const s=sportSession(sport,date,{status:'done',duration:num($('#qlDur').value),rpe,notes});if(rpe>=8)s.hard=true;
   if(sp.type==='run'){const km=num($('#qlDist').value),pace=toSec($('#qlPace').value);let dur=s.duration;
     if(!km&&!dur){toast('Indique au moins la distance ou la durée');return}
     let sec=km&&pace?km*pace:dur?dur*60:null;if(!dur&&sec)dur=Math.round(sec/60);
     Object.assign(s,{distance:km?String(km):'',time:sec?fmtSec(sec):'',duration:dur,key:classifyRun(dur,km&&sec?sec/km:null)});
     s.hard=s.key==='run_q'||rpe>=8;s.title=`${sp.n} ${km?String(km).replace('.',',')+' km':''}`.trim()}
   else{if(!s.duration){toast('Indique la durée en minutes');return}
     const km=num($('#qlDist').value);if(km&&(sp.m||[]).includes('dist'))s.distance=String(km);
     if(sp.type==='sport'){s.result=$('#qlRes').value||'';s.score=$('#qlScore').value.trim()}}
   makeReal();const rec=S.sessions.find(x=>x.date===date&&x.recurring&&x.status==='planned'&&sportOf(x)===sport);if(rec){s.id=rec.id;s.recurring=true}
   upsert(s);const adj=adaptAfter(date);toast(adj?'Séance enregistrée, semaine réajustée':'Séance enregistrée');render()},
 result:b=>{ED.result=ED.result===b.dataset.v?'':b.dataset.v;renderSheet()},
 stravaSync:()=>stravaSync(true),
 recAdd:()=>{makeReal();S.profile.recurring=[...(S.profile.recurring||[]),{id:uid(),dow:3,sport:'padel',dur:90}];persistProfile();replanWeek();render()},
 recDel:b=>{makeReal();S.profile.recurring.splice(+b.dataset.i,1);persistProfile();replanWeek();render();toast('Activité fixe retirée')},
 stravaOff:()=>{S.profile.strava=false;persistProfile();render();toast('Synchro Strava coupée')},
 stravaImport:()=>{const acts=UI.stravaActs||[];const boxes=[...document.querySelectorAll('[data-imp]')];
   const sel=new Set(boxes.filter(b=>b.checked&&!b.disabled).map(b=>b.dataset.imp));
   const ign=acts.filter(a=>!sel.has(a.id)&&!S.sessions.some(s=>s.stravaId===a.id)).map(a=>a.id);
   makeReal();S.profile.strava=true;S.profile.stravaSince=acts.length?acts[acts.length-1].date:today();S.profile.stravaIgnored=[...(S.profile.stravaIgnored||[]),...ign];S.profile.stravaLast=Date.now();
   const n=importActs(acts.filter(a=>sel.has(a.id)));persistProfile();closePicker();toast(`Strava connecté · ${n} activité${n>1?'s':''} importée${n>1?'s':''}`);render()},
 clearEx:()=>{leaveExamples();saveLocal();persistProfile();render();toast('Carnet vide, à toi de jouer')},
 addTest:()=>{const kind=$('#tKind').value,date=$('#tDate').value||today(),val=$('#tVal').value.trim();
   if(kind==='poids'?num(val)==null:toSec(val)==null){toast(kind==='poids'?'Poids attendu, ex. 80.5':'Temps attendu au format mm:ss');return}
   makeReal();S.tests.push({id:uid(),date,kind,value:kind==='poids'?String(num(val)):val});
   if(kind==='5k'&&$('#tRef').checked)S.profile.ref5k=val;persistProfile();toast('Mesure enregistrée');render()},
 delTest:b=>{S.tests=S.tests.filter(t=>t.id!==b.dataset.id);persistProfile();render()},
 downloadBackup:()=>{const txt=JSON.stringify({profile:S.profile,sessions:S.sessions.filter(s=>!s.example),tests:S.tests.filter(t=>!t.example)},null,1);
   const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([txt],{type:'application/json'}));a.download='carnet-sport-'+today()+'.json';document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500);toast('Sauvegarde téléchargée')},
 copyBackup:()=>{const txt=JSON.stringify({profile:S.profile,sessions:S.sessions.filter(s=>!s.example),tests:S.tests.filter(t=>!t.example)});
   const done=()=>toast('Sauvegarde copiée');navigator.clipboard?.writeText(txt).then(done,()=>{const t=$('#imp');t.value=txt;t.select();toast('Copie bloquée : texte sélectionné, copie-le à la main')})},
 importBackup:()=>{try{const d=JSON.parse($('#imp').value);if(!d.profile||!Array.isArray(d.sessions))throw 0;S.example=false;
   const old=S.sessions.map(s=>s.id);S.profile={...DEFAULT_PROFILE,...d.profile};S.tests=d.tests||[];S.sessions=d.sessions;old.filter(id=>!S.sessions.some(s=>s.id===id)).forEach(persistDelete);persistProfile();S.sessions.forEach(persistSession);toast('Sauvegarde restaurée');render()}
   catch(e){toast('Texte invalide : colle une sauvegarde copiée depuis cette page')}}
};
const $=s=>document.querySelector(s);
document.addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(b&&A[b.dataset.a]){e.preventDefault();A[b.dataset.a](b,e);return}
  if(e.target===ov)closeEditor();if(e.target===ov2)closePicker()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(!ov2.hidden)closePicker();else if(!ov.hidden)closeEditor()}});
document.addEventListener('input',e=>{const t=e.target;
  if(t.dataset.ed&&ED){ED[t.dataset.ed]=t.type==='number'?(t.value===''?null:+t.value):t.value;
    if(ED.type==='run'&&t.dataset.ed==='time'&&toSec(ED.time)){ED.duration=Math.round(toSec(ED.time)/60);const du=$('#e-dur');if(du)du.value=ED.duration}
    if(ED.type==='run'&&(t.dataset.ed==='distance'||t.dataset.ed==='time')){const p=toSec(ED.time)&&num(ED.distance)?toSec(ED.time)/num(ED.distance):null;const el=$('#e-pace');if(el)el.textContent=p?fmtPace(p)+' /km':'–'}}
  if(t.dataset.ed&&ED&&ED.type!=='run'){const dv=$('#e-derived');if(dv)dv.innerHTML=derived(ED)}
  if(t.dataset.set&&ED){const st=ED.exercises[+t.dataset.ei].sets[+t.dataset.si];if(t.dataset.set==='ok')st.ok=t.checked;else st[t.dataset.set]=t.value}
  if(t.id==='e-pacein'&&ED){const p=toSec(t.value),d=num(ED.distance);if(p&&d){ED.time=fmtSec(p*d);ED.duration=Math.round(p*d/60);const ti=$('#e-time');if(ti)ti.value=ED.time;const du=$('#e-dur');if(du)du.value=ED.duration}}
  if(t.id==='exq'){UI.exQuery=t.value;const pos=t.selectionStart;render();const n=$('#exq');n.focus();n.setSelectionRange(pos,pos)}
});
document.addEventListener('change',e=>{const t=e.target;
  if(t.id==='addEx'&&t.value&&ED){const e2=EX[t.value];const lo=e2.unit==='sec'?30:e2.unit==='reps'?10:8,hi=e2.unit==='sec'?45:12;const sg=suggestion(t.value,lo,hi,ED.date);
    ED.exercises.push({exId:t.value,lo,hi,sets:Array.from({length:3},()=>({reps:'',load:sg.load,ok:false}))});renderSheet()}
  if(t.id==='progEx'){UI.progEx=t.value;render()}
  if(t.id==='impFile'&&t.files&&t.files[0]){const fr=new FileReader();fr.onload=()=>{$('#imp').value=String(fr.result);A.importBackup()};fr.readAsText(t.files[0])}
  if(t.id==='progSport'){UI.progSport=t.value;render()}
  if(t.dataset.rec!=null){const r=S.profile.recurring[+t.dataset.rec];r[t.dataset.k]=t.dataset.k==='sport'?t.value:+t.value;makeReal();persistProfile();replanWeek();render();toast('Activité fixe enregistrée, semaine replanifiée')}
  if(t.id==='e-sport'&&ED){const sp=SPORTS[t.value];const wasTitle=!ED.title||Object.values(SPORTS).some(x=>x.n===ED.title)||ED.title.endsWith(' libre');
    ED.sport=t.value;ED.type=sp.type;ED.key=sp.type==='run'?(ED.key&&ED.key.startsWith('run')?ED.key:'run_e'):(sp.key||sp.type);ED.legs=!!sp.legs;ED.hard=!!sp.hard;if(wasTitle)ED.title=sp.n;
    if(sp.type==='run'){ED.distance=ED.distance||'';ED.time=ED.time||''}if(!['muscu','renfo'].includes(sp.type)&&ED.exercises&&!ED.exercises.length)delete ED.exercises;else if(['muscu','renfo'].includes(sp.type)&&!ED.exercises)ED.exercises=[];renderSheet()}
  if(t.id==='qlType'){const sp=SPORTS[t.value];document.querySelectorAll('.ql-run').forEach(el=>el.hidden=sp.type!=='run');document.querySelectorAll('.ql-dist').forEach(el=>el.hidden=!(sp.type==='run'||(sp.m||[]).includes('dist')));document.querySelectorAll('.ql-sport').forEach(el=>el.hidden=sp.type!=='sport')}
  if(t.id==='pLieu'){S.profile.lieu=t.value;UI.crit=null;persistProfile();toast('Réglages enregistrés')}
  const p=S.profile;let changed=false;
  if(t.id==='pGoal'){p.goal=t.value;changed=true}
  if(t.id==='pRef'){if(toSec(t.value)){p.ref5k=t.value.trim();changed=true}else toast('Format attendu : mm:ss')}
  if(t.id==='pCycle'&&t.value){p.cycleStart=t.value;changed=true}
  if(t.id==='pRest'){p.rest=+t.value;changed=true}
  if(t.dataset.av!=null){p.avail[t.dataset.av]=+t.value;changed=true}
  if(changed){if(S.example){const keepP=clone(p);leaveExamples();S.profile=keepP;S.sessions.forEach(persistSession)}persistProfile();render();toast('Réglages enregistrés')}
});

/* ================= BOOT ================= */
(function boot(){
  const l=loadLocal();
  if(l&&l.touched){S.profile={...DEFAULT_PROFILE,...l.profile};S.sessions=l.sessions||[];S.tests=l.tests||[]}
  else enterExamples();
  render();initSync().catch(e=>console.warn(e)).finally(()=>setTimeout(maybeAutoStrava,1500));
})();

/* ================= PWA (version web uniquement) ================= */
if(!IN_CLAUDE&&'serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost'||location.hostname==='127.0.0.1')){
  window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(e=>console.warn('SW',e)));
}

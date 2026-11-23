import React, { createContext, useContext, useEffect, useState } from 'react';

export type Lang = 'en' | 'fr' | 'ar';

const STORAGE_KEY = 'ouagx_lang';

export const TRANSLATIONS: Record<Lang, Record<string, string>> = {
  en: {
    // Brand & Common
    brandSubtitle: 'Realms of the Dragon Throne',
    playNow: 'Play Now',
    playGuest: 'Play Instantly (Guest)',
    signIn: 'Sign In',
    createAccount: 'New Lord',
    quickPlay: 'Quick Play',
    backHome: 'Home',
    logout: 'Sign Out',
    close: 'Close',
    level: 'Level',
    power: 'Power',
    kills: 'Kills',
    rank: 'Rank',
    food: 'Food',
    wood: 'Wood',
    iron: 'Iron',
    gold: 'Gold',
    gems: 'Gems',

    // Landing Page
    navFeatures: 'Features',
    navWorld: 'The Realm',
    navHeroes: 'Heroes',
    heroBadge: 'REALM #1 VALORIA • LIVE MULTIPLAYER RPG',
    heroTitle1: 'FORGE YOUR EMPIRE.',
    heroTitle2: 'CLAIM THE DRAGON THRONE.',
    heroDesc:
      'Command a medieval citadel in OUAGX. Upgrade 14 fortress buildings, train Tier 1–10 armies, recruit mythic heroes, conquer 20 PvE campaign stages, and battle across a living open world.',
    statBuildings: 'Castle Buildings',
    statCampaign: 'PvE Campaign Levels',
    statTroops: 'Troop Tiers & Types',
    statWorld: 'Live World Map',
    featSectionTitle: 'Master Every Pillar of Conquest',
    featSectionSub: 'Strategy, RPG progression, and real-time multiplayer warfare unified in your browser.',
    feat1Title: 'Medieval Kingdom Builder',
    feat1Desc: 'Construct and upgrade your Citadel Keep up to Lv.30 alongside Barracks, Farms, Academy, Forge, and Walls.',
    feat2Title: 'Heroes & Dragon Forge',
    feat2Desc: 'Recruit Rare to Mythic commanders, level them to Lv.100, upgrade active battle skills, and forge legendary gear.',
    feat3Title: '20-Stage PvE Campaign',
    feat3Desc: 'Fight across 4 dark fantasy chapters with an animated tactical battle arena, 3-star ratings, and Boss loot drops.',
    feat4Title: 'Living Open World Map',
    feat4Desc: 'Explore lush forests, rivers, and mountains. Gather resources, hunt roaming dragons, rally alliances, and seize the Throne.',
    heroesSectionTitle: 'Legendary Champions of OUAGX',
    heroesSectionSub: 'Recruit iconic warlords to lead your marches and unleash devastating battlefield skills.',
    ctaTitle: 'Your Citadel Awaits, Sovereign',
    ctaDesc: 'Enter Realm #1 in seconds — no download required. Build your kingdom and write your legend.',
    footerTagline: 'Browser-based medieval strategy RPG crafted for sovereigns, tacticians, and conquerors.',
    copyright: '© 2026 OUAGX Interactive. All Rights Reserved.',
    footerTerms: 'Terms of Service',
    footerPrivacy: 'Privacy Policy',
    footerRules: 'Realm Codex',

    // Auth
    lordName: 'Lord Name',
    lordNameOpt: 'Lord Name (Optional)',
    lordPlaceholder: 'Enter your Lord name',
    guestPlaceholder: 'e.g. KingArthur (or leave blank)',
    passphrase: 'Royal Passphrase',
    royalCrest: 'Royal Crest',
    enterRealm: 'Enter Realm #1 Immediately',
    returnCitadel: 'Return to Citadel',
    claimKingdom: 'Claim Your Kingdom',
    forgingKingdom: 'Forging Kingdom...',

    // Navigation Dock
    tabCity: 'City',
    tabWorld: 'World Map',
    tabCampaign: 'Campaign',
    tabHeroes: 'Heroes',
    tabArmy: 'Barracks',
    tabAcademy: 'Academy',
    tabAlliance: 'Alliance',
    tabQuests: 'Quests',
    tabReports: 'Reports',
    tabLeaderboard: 'Ranks',
    chat: 'Chat',

    // City View
    buildQueues: 'Build Queues',
    powerContrib: 'Kingdom Power Contribution',
    currentProd: 'Current Production',
    nextProd: 'Next Level Output',
    upgradeTo: 'Upgrade to Level',
    upgradeBuilding: 'Upgrade Building',
    upgradingTo: 'Upgrading to Level',
    speedUp: 'Speed-Up',
    instantGem: 'Instant Gem',
    reqHelp: 'Request Alliance Help',
    joinAllianceHelp: 'Join Alliance for Help',
    maxLevelReached: 'Maximum Level Reached!',
    requiresKeep: 'Requires Citadel Keep Lv.',

    // World Map
    myCitadel: 'My Citadel',
    dragonThrone: 'Dragon Throne',
    mapHint: 'Drag to pan • Scroll to zoom • Click any tile to Gather, Hunt, or Siege',
    legendTitle: 'Realm Legend',
    legendForest: 'Forest & Highlands',
    legendRiver: 'Valoria River',
    legendThrone: 'Dragon Throne',
    legendCastle: 'Castles',
    legendMonster: 'Monsters',
    legendResource: 'Resources',
    tileType: 'Type',
    resRemaining: 'Resources Remaining',
    recPower: 'Recommended Power',
    lordLabel: 'Lord',
    lordPower: 'Lord Power',
    distanceKeep: 'Distance from Keep',
    leagues: 'leagues',
    commandingHero: 'Commanding Hero',
    marchGather: 'March to Gather',
    assaultThrone: 'Assault Dragon Throne!',
    launchSiege: 'Launch Siege Attack',
    huntMonster: 'Hunt World Monster',
    ownCitadelMsg: 'This is your sovereign Citadel in Realm #1.',
    marchNote: 'Dispatches 70% of your standing garrison with your selected Hero.',
    marchingTo: 'Marching to',
    returningSpoils: 'Returning with Spoils',

    // Campaign
    campaignTitle: 'PvE Conquest Campaign',
    campaignSub: 'Conquer 20 progressive levels across 4 realms. Defeat Bosses for Hero XP, Gems, and Gear.',
    campaignStars: 'Campaign Stars',
    standingArmy: 'Standing Army',
    leadHero: 'Lead Hero',
    enemyForce: 'Enemy Force',
    launchAssault: 'Launch Assault',
    battleAgain: 'Battle Again (Farm)',
    locked: 'Locked',
    battleArena: 'Battle Arena',
    victoryTitle: 'GLORIOUS VICTORY!',
    defeatTitle: 'ARMY REPELLED',
    continueConquest: 'Continue Conquest',

    // Heroes & Forge
    heroesTitle: 'Hall of Heroes & Dragon Forge',
    heroesSub: 'Recruit legendary commanders, level them up to Lv.100, upgrade skills, and forge mythic gear.',
    tabHeroesSub: 'Heroes',
    tabForgeSub: 'Dragon Forge',
    recruitHero: 'Recruit Hero',
    combatDrill: 'Combat Drill (+180 XP)',
    equippedGear: 'Equipped Battle Gear',
    emptySlot: 'Empty Slot',
    forgeBlueprints: 'Forge Blueprints',
    forgeGear: 'Forge Gear',
    armoryInventory: 'Armory Inventory',
    unequipped: 'Unequipped',

    // Army & Academy
    barracksTitle: 'Royal Barracks & War Hospital',
    barracksSub: 'Train Tier 1–10 divisions. Master counters: Infantry > Cavalry > Archers > Infantry.',
    warHospital: 'War Hospital',
    wounded: 'Wounded',
    healAll: 'Heal All',
    owned: 'Owned',
    academyTitle: 'Royal Academy',
    academySub: 'Permanent empire-wide upgrades across Economy, Military, and City Defense.',
    branchEconomy: 'Economy',
    branchMilitary: 'Military',
    branchDefense: 'City Defense',
    currentBonus: 'Current Bonus',
    researchLevel: 'Research Level',
    speedUpResearch: 'Speed Up Research',
    mastered: 'Mastered',

    // Alliance, Reports, Quests, Ranks, Chat
    alliancesTitle: 'Alliances of OUAGX',
    alliancesSub: 'Join a noble house for Alliance Chat, Build Help speed-ups, and allied protection.',
    foundAlliance: 'Found a New Alliance',
    establishAlliance: 'Establish Alliance',
    leaveAlliance: 'Leave Alliance',
    allianceHelp: 'Alliance Construction Help',
    clanRoster: 'Clan Roster',
    join: 'Join',
    reportsTitle: 'Royal Dispatch & Battle Reports',
    questsTitle: 'Royal Quests & Milestones',
    questsSub: 'Complete kingdom decrees to earn resource caches and Royal Gems.',
    claimReward: 'Claim Reward',
    claimed: 'Claimed',
    inProgress: 'In Progress',
    ranksTitle: 'Realm #1 Hall of Glory',
    ranksSub: 'Top Sovereigns and Alliances competing for the OUAGX Throne.',
    topLords: 'Top Lords',
    topAlliances: 'Top Alliances',
    kingdomChat: 'Kingdom',
    allianceChat: 'Alliance',
    chatPlaceholder: 'Write a message...',
  },

  fr: {
    brandSubtitle: 'Les Royaumes du Trône du Dragon',
    playNow: 'Jouer Maintenant',
    playGuest: 'Jouer en Invité',
    signIn: 'Connexion',
    createAccount: 'Nouveau Seigneur',
    quickPlay: 'Jeu Rapide',
    backHome: 'Accueil',
    logout: 'Déconnexion',
    close: 'Fermer',
    level: 'Niveau',
    power: 'Puissance',
    kills: 'Éliminations',
    rank: 'Rang',
    food: 'Nourriture',
    wood: 'Bois',
    iron: 'Fer',
    gold: 'Or',
    gems: 'Gemmes',

    // Landing Page
    navFeatures: 'Fonctionnalités',
    navWorld: 'Le Royaume',
    navHeroes: 'Héros',
    heroBadge: 'ROYAUME #1 VALORIA • RPG MULTIJOUEUR EN DIRECT',
    heroTitle1: 'FORGEZ VOTRE EMPIRE.',
    heroTitle2: 'CONQUÉREZ LE TRÔNE DU DRAGON.',
    heroDesc:
      'Commandez une citadelle médiévale dans OUAGX. Améliorez 14 bâtiments, formez des armées de rang 1 à 10, recrutez des héros mythiques, triomphez de 20 niveaux PvE et régnez sur la carte du monde.',
    statBuildings: 'Bâtiments du Château',
    statCampaign: 'Niveaux Campagne PvE',
    statTroops: 'Unités & Rangs',
    statWorld: 'Carte du Monde Live',
    featSectionTitle: 'Maîtrisez Chaque Pilier de la Conquête',
    featSectionSub: 'Stratégie, progression RPG et guerres multijoueurs en temps réel dans votre navigateur.',
    feat1Title: 'Bâtisseur de Royaume',
    feat1Desc: 'Améliorez votre Citadelle jusqu’au Niv.30 avec Casernes, Fermes, Académie, Forge et Remparts.',
    feat2Title: 'Héros & Forge du Dragon',
    feat2Desc: 'Recrutez des commandants Rares à Mythiques, montez-les au Niv.100 et forgez des équipements légendaires.',
    feat3Title: 'Campagne PvE 20 Niveaux',
    feat3Desc: 'Affrontez 4 chapitres avec une arène de combat animée, des étoiles de victoire et du butin de Boss.',
    feat4Title: 'Carte du Monde Vivante',
    feat4Desc: 'Explorez forêts, rivières et montagnes. Récoltez, chassez les dragons, ralliez votre alliance et prenez le Trône.',
    heroesSectionTitle: 'Champions Légendaires d’OUAGX',
    heroesSectionSub: 'Recrutez des seigneurs de guerre pour mener vos marches et déchaîner leurs pouvoirs.',
    ctaTitle: 'Votre Citadelle Vous Attend, Souverain',
    ctaDesc: 'Rejoignez le Royaume #1 en un clic — aucun téléchargement requis. Écrivez votre légende.',
    footerTagline: 'RPG de stratégie médiévale en ligne conçu pour les souverains, tacticiens et conquérants.',
    copyright: '© 2026 OUAGX Interactive. Tous droits réservés.',
    footerTerms: 'Conditions d’utilisation',
    footerPrivacy: 'Confidentialité',
    footerRules: 'Codex du Royaume',

    // Auth
    lordName: 'Nom du Seigneur',
    lordNameOpt: 'Nom du Seigneur (Optionnel)',
    lordPlaceholder: 'Entrez votre nom de Seigneur',
    guestPlaceholder: 'ex. RoiArthur (ou laissez vide)',
    passphrase: 'Mot de Passe Royal',
    royalCrest: 'Blason Royal',
    enterRealm: 'Entrer dans le Royaume #1',
    returnCitadel: 'Retourner à la Citadelle',
    claimKingdom: 'Fonder Votre Royaume',
    forgingKingdom: 'Création du Royaume...',

    // Navigation Dock
    tabCity: 'Cité',
    tabWorld: 'Monde',
    tabCampaign: 'Campagne',
    tabHeroes: 'Héros',
    tabArmy: 'Caserne',
    tabAcademy: 'Académie',
    tabAlliance: 'Alliance',
    tabQuests: 'Quêtes',
    tabReports: 'Rapports',
    tabLeaderboard: 'Classement',
    chat: 'Chat',

    // City View
    buildQueues: 'Files de Construction',
    powerContrib: 'Contribution de Puissance',
    currentProd: 'Production Actuelle',
    nextProd: 'Production Niv. Suivant',
    upgradeTo: 'Améliorer au Niveau',
    upgradeBuilding: 'Améliorer le Bâtiment',
    upgradingTo: 'Amélioration vers Niv.',
    speedUp: 'Accélérer',
    instantGem: 'Finir (Gemmes)',
    reqHelp: 'Demander Aide Alliance',
    joinAllianceHelp: 'Rejoindre une Alliance',
    maxLevelReached: 'Niveau Maximum Atteint !',
    requiresKeep: 'Requiert Citadelle Niv.',

    // World Map
    myCitadel: 'Ma Citadelle',
    dragonThrone: 'Trône du Dragon',
    mapHint: 'Glisser pour déplacer • Molette pour zoomer • Cliquez une case pour agir',
    legendTitle: 'Légende du Royaume',
    legendForest: 'Forêts & Montagnes',
    legendRiver: 'Rivière Valoria',
    legendThrone: 'Trône du Dragon',
    legendCastle: 'Châteaux',
    legendMonster: 'Monstres',
    legendResource: 'Ressources',
    tileType: 'Type',
    resRemaining: 'Ressources Restantes',
    recPower: 'Puissance Conseillée',
    lordLabel: 'Seigneur',
    lordPower: 'Puissance du Seigneur',
    distanceKeep: 'Distance du Château',
    leagues: 'lieues',
    commandingHero: 'Héros Commandant',
    marchGather: 'Marcher pour Récolter',
    assaultThrone: 'Assaut du Trône du Dragon !',
    launchSiege: 'Lancer un Siège',
    huntMonster: 'Chasser le Monstre',
    ownCitadelMsg: 'Voici votre Citadelle souveraine dans le Royaume #1.',
    marchNote: 'Envoie 70% de votre garnison avec le Héros sélectionné.',
    marchingTo: 'En marche vers',
    returningSpoils: 'Retour avec Butin',

    // Campaign
    campaignTitle: 'Campagne de Conquête PvE',
    campaignSub: 'Conquérez 20 niveaux sur 4 régions. Battez les Boss pour obtenir XP, Gemmes et Équipements.',
    campaignStars: 'Étoiles Campagne',
    standingArmy: 'Armée Active',
    leadHero: 'Héros Chef',
    enemyForce: 'Force Ennemie',
    launchAssault: 'Lancer l’Assaut',
    battleAgain: 'Rejouer (Butin)',
    locked: 'Verrouillé',
    battleArena: 'Arène de Combat',
    victoryTitle: 'VICTOIRE GLORIEUSE !',
    defeatTitle: 'ARMÉE REPOUSSÉE',
    continueConquest: 'Continuer la Conquête',

    // Heroes & Forge
    heroesTitle: 'Salle des Héros & Forge du Dragon',
    heroesSub: 'Recrutez des commandants légendaires, montez au Niv.100 et forgez des armes mythiques.',
    tabHeroesSub: 'Héros',
    tabForgeSub: 'Forge du Dragon',
    recruitHero: 'Recruter le Héros',
    combatDrill: 'Entraînement (+180 XP)',
    equippedGear: 'Équipement de Combat',
    emptySlot: 'Emplacement Vide',
    forgeBlueprints: 'Plans de Forge',
    forgeGear: 'Forger l’Objet',
    armoryInventory: 'Inventaire Armurerie',
    unequipped: 'Non équipé',

    // Army & Academy
    barracksTitle: 'Casernes Royales & Hôpital',
    barracksSub: 'Formez les rangs 1–10. Contres : Infanterie > Cavalerie > Archers > Infanterie.',
    warHospital: 'Hôpital de Guerre',
    wounded: 'Blessés',
    healAll: 'Tout Soigner',
    owned: 'Possédés',
    academyTitle: 'Académie Royale',
    academySub: 'Recherches permanentes en Économie, Militaire et Défense de Cité.',
    branchEconomy: 'Économie',
    branchMilitary: 'Militaire',
    branchDefense: 'Défense',
    currentBonus: 'Bonus Actuel',
    researchLevel: 'Rechercher Niveau',
    speedUpResearch: 'Accélérer la Recherche',
    mastered: 'Maîtrisé',

    // Alliance, Reports, Quests, Ranks, Chat
    alliancesTitle: 'Alliances d’OUAGX',
    alliancesSub: 'Rejoignez une maison noble pour le Chat d’Alliance, l’Aide de Construction et la protection.',
    foundAlliance: 'Fonder une Alliance',
    establishAlliance: 'Créer l’Alliance',
    leaveAlliance: 'Quitter l’Alliance',
    allianceHelp: 'Aide de Construction',
    clanRoster: 'Membres du Clan',
    join: 'Rejoindre',
    reportsTitle: 'Dépêches & Rapports de Bataille',
    questsTitle: 'Quêtes Royales & Objectifs',
    questsSub: 'Accomplissez les décrets royaux pour gagner des ressources et des Gemmes.',
    claimReward: 'Réclamer',
    claimed: 'Réclamé',
    inProgress: 'En cours',
    ranksTitle: 'Panthéon du Royaume #1',
    ranksSub: 'Les plus puissants Seigneurs et Alliances d’OUAGX.',
    topLords: 'Top Seigneurs',
    topAlliances: 'Top Alliances',
    kingdomChat: 'Royaume',
    allianceChat: 'Alliance',
    chatPlaceholder: 'Écrire un message...',
  },

  ar: {
    brandSubtitle: 'ممـالك عرش التنـين',
    playNow: 'العب الآن',
    playGuest: 'العب فوراً (ضيف)',
    signIn: 'تسجيل الدخول',
    createAccount: 'أمير جديد',
    quickPlay: 'لعب سريع',
    backHome: 'الرئيسية',
    logout: 'خروج',
    close: 'إغلاق',
    level: 'المستوى',
    power: 'القوة',
    kills: 'القتلى',
    rank: 'الترتيب',
    food: 'طعام',
    wood: 'خشب',
    iron: 'حديد',
    gold: 'ذهب',
    gems: 'جواهر',

    // Landing Page
    navFeatures: 'المميزات',
    navWorld: 'العالم',
    navHeroes: 'الأبطال',
    heroBadge: 'المملكة #1 فالوريا • لعبة RPG استراتيجية أونلاين',
    heroTitle1: 'شيّد إمبراطوريتك.',
    heroTitle2: 'انتزع عرش التنين.',
    heroDesc:
      'قُد قلعتك في العصور الوسطى داخل OUAGX. طوّر 14 مبنى ملكياً، درّب جيوشاً حتى الرتبة 10، جنّد أبطالاً أسطوريين، اقتحم 20 مرحلة قتالية، وحارب على خريطة عالم حية.',
    statBuildings: 'مبنى في القلعة',
    statCampaign: 'مرحلة حملة PvE',
    statTroops: 'نوع ورتبة جيش',
    statWorld: 'خريطة عالم حية',
    featSectionTitle: 'أتقن كل ركائز الغزو والسيطرة',
    featSectionSub: 'استراتيجية، تطور RPG، وحروب تحالفات مباشرة في متصفحك دون تحميل.',
    feat1Title: 'بناء المملكة والقلعة',
    feat1Desc: 'طوّر قلعتك حتى المستوى 30 مع الثكنات والمزارع والأكاديمية والحداد والأسوار الحصينة.',
    feat2Title: 'الأبطال ومصهر التنين',
    feat2Desc: 'جنّد قادة من النادر إلى الأسطوري، ارفع مستواهم إلى 100، واصنع أسلحة ودروعاً خرافية.',
    feat3Title: 'حملة PvE من 20 مرحلة',
    feat3Desc: 'خض معارك عبر 4 فصول مع ساحة قتال متحركة، تقييم 3 نجوم، ومكافآت الزعماء.',
    feat4Title: 'خريطة عالم غنية ومفتوحة',
    feat4Desc: 'استكشف الغابات الكثيفة والأنهار والجبال. اجمع الموارد، اصطد التنانين، وحاصر القلاع لانتزاع العرش.',
    heroesSectionTitle: 'أبطال OUAGX الأسطوريون',
    heroesSectionSub: 'جنّد أعظم القادة لقيادة جيوشك وإطلاق مهارات قتالية مدمرة.',
    ctaTitle: 'قلعتك بانتظارك يا مولاي',
    ctaDesc: 'ادخل المملكة #1 في ثوانٍ — مجاناً بالكامل ودون تثبيت. اصنع أسطورتك الآن.',
    footerTagline: 'لعبة استراتيجية RPG في العصور الوسطى عبر الإنترنت للملوك والقادة والفاتحين.',
    copyright: '© 2026 OUAGX Interactive. جميع الحقوق محفوظة.',
    footerTerms: 'شروط الاستخدام',
    footerPrivacy: 'سياسة الخصوصية',
    footerRules: 'قوانين المملكة',

    // Auth
    lordName: 'اسم الأمير',
    lordNameOpt: 'اسم الأمير (اختياري)',
    lordPlaceholder: 'أدخل اسم الأمير الخاص بك',
    guestPlaceholder: 'مثال: صلاح_الدين (أو اتركه فارغاً)',
    passphrase: 'كلمة المرور الملكية',
    royalCrest: 'الشعار الملكي',
    enterRealm: 'ادخل المملكة #1 فوراً',
    returnCitadel: 'العودة إلى القلعة',
    claimKingdom: 'أسّس مملكتك',
    forgingKingdom: 'جارٍ تأسيس المملكة...',

    // Navigation Dock
    tabCity: 'القلعة',
    tabWorld: 'الخريطة',
    tabCampaign: 'الحملة',
    tabHeroes: 'الأبطال',
    tabArmy: 'الثكنات',
    tabAcademy: 'الأكاديمية',
    tabAlliance: 'التحالف',
    tabQuests: 'المهام',
    tabReports: 'التقارير',
    tabLeaderboard: 'التصنيف',
    chat: 'دردشة',

    // City View
    buildQueues: 'طوابير البناء',
    powerContrib: 'مساهمة القوة الملكية',
    currentProd: 'الإنتاج الحالي',
    nextProd: 'إنتاج المستوى القادم',
    upgradeTo: 'ترقية إلى المستوى',
    upgradeBuilding: 'ترقية المبنى',
    upgradingTo: 'جارٍ الترقية للمستوى',
    speedUp: 'تسريع',
    instantGem: 'إنهاء بالجواهر',
    reqHelp: 'طلب مساعدة التحالف',
    joinAllianceHelp: 'انضم لتحالف للمساعدة',
    maxLevelReached: 'تم الوصول للحد الأقصى!',
    requiresKeep: 'يتطلب القلعة الرئيسية مستوى',

    // World Map
    myCitadel: 'قلعتي',
    dragonThrone: 'عرش التنين',
    mapHint: 'اسحب للتحريك • كبّر بالعجلة • اضغط على أي موقع للجمع أو الهجوم أو الحصار',
    legendTitle: 'دليل الخريطة',
    legendForest: 'غابات وجبال',
    legendRiver: 'نهر فالوريا',
    legendThrone: 'عرش التنين',
    legendCastle: 'قلاع',
    legendMonster: 'وحوش',
    legendResource: 'موارد',
    tileType: 'النوع',
    resRemaining: 'الموارد المتبقية',
    recPower: 'القوة الموصى بها',
    lordLabel: 'الأمير',
    lordPower: 'قوة الأمير',
    distanceKeep: 'المسافة عن القلعة',
    leagues: 'فرسخ',
    commandingHero: 'البطل القائد',
    marchGather: 'إرسال جيش للجمع',
    assaultThrone: 'اقتحام عرش التنين!',
    launchSiege: 'شنّ حصار على القلعة',
    huntMonster: 'صيد وحش العالم',
    ownCitadelMsg: 'هذه قلعتك الملكية في المملكة #1.',
    marchNote: 'يرسل 70% من جيشك المتاح بقيادة البطل المختار.',
    marchingTo: 'زحف نحو',
    returningSpoils: 'عودة بالغنائم',

    // Campaign
    campaignTitle: 'حملة الغزو PvE',
    campaignSub: 'افتح 20 مرحلة متدرجة عبر 4 أقاليم. اهزم الزعماء لكسب خبرة وجواهر وعتاد نادر.',
    campaignStars: 'نجوم الحملة',
    standingArmy: 'الجيش الجاهز',
    leadHero: 'البطل القائد',
    enemyForce: 'قوات العدو',
    launchAssault: 'ابدأ المعركة',
    battleAgain: 'إعادة القتال',
    locked: 'مغلق',
    battleArena: 'ساحة المعركة',
    victoryTitle: 'نصرٌ ساحق!',
    defeatTitle: 'تراجع الجيش',
    continueConquest: 'مواصلة الغزو',

    // Heroes & Forge
    heroesTitle: 'قاعة الأبطال ومصهر التنين',
    heroesSub: 'جنّد القادة الأسطوريين، ارفع مستواهم حتى 100، واصنع العتاد الملكي.',
    tabHeroesSub: 'الأبطال',
    tabForgeSub: 'مصهر التنين',
    recruitHero: 'تجنيد البطل',
    combatDrill: 'تدريب قتالي (+180 XP)',
    equippedGear: 'العتاد المجهّز',
    emptySlot: 'خانة فارغة',
    forgeBlueprints: 'مخططات الحدادة',
    forgeGear: 'صناعة العتاد',
    armoryInventory: 'مخزن الأسلحة',
    unequipped: 'غير مجهّز',

    // Army & Academy
    barracksTitle: 'الثكنات الملكية ومستشفى الحرب',
    barracksSub: 'درّب القوات من الرتبة 1 إلى 10. التفوق: المشاة > الفرسان > الرماة > المشاة.',
    warHospital: 'مستشفى الحرب',
    wounded: 'جرحى',
    healAll: 'علاج الجميع',
    owned: 'المتاح',
    academyTitle: 'الأكاديمية الملكية',
    academySub: 'أبحاث دائمة لتعزيز الاقتصاد والجيش ودفاعات المدينة.',
    branchEconomy: 'الاقتصاد',
    branchMilitary: 'العسكرية',
    branchDefense: 'دفاع القلعة',
    currentBonus: 'المكافأة الحالية',
    researchLevel: 'بحث المستوى',
    speedUpResearch: 'تسريع البحث',
    mastered: 'مكتمل',

    // Alliance, Reports, Quests, Ranks, Chat
    alliancesTitle: 'تحالفات OUAGX',
    alliancesSub: 'انضم لتحالف للحصول على الدردشة الخاصة ومساعدة تسريع البناء والحماية.',
    foundAlliance: 'تأسيس تحالف جديد',
    establishAlliance: 'إنشاء التحالف',
    leaveAlliance: 'مغادرة التحالف',
    allianceHelp: 'مساعدات البناء للتحالف',
    clanRoster: 'أعضاء التحالف',
    join: 'انضمام',
    reportsTitle: 'البريد الملكي وتقارير المعارك',
    questsTitle: 'المهام الملكية والإنجازات',
    questsSub: 'أنجز المهام الملكية للحصول على موارد ضخمة وجواهر.',
    claimReward: 'استلام المكافأة',
    claimed: 'تم الاستلام',
    inProgress: 'قيد التنفيذ',
    ranksTitle: 'قاعة المجد — المملكة #1',
    ranksSub: 'أقوى الملوك والتحالفات المتنافسة على عرش OUAGX.',
    topLords: 'أقوى الملوك',
    topAlliances: 'أقوى التحالفات',
    kingdomChat: 'المملكة',
    allianceChat: 'التحالف',
    chatPlaceholder: 'اكتب رسالتك هنا...',
  },
};

interface I18nContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
  isRtl: boolean;
}

const I18nContext = createContext<I18nContextValue>({
  lang: 'en',
  setLang: () => {},
  t: (k) => k,
  isRtl: false,
});

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'fr' || saved === 'ar' || saved === 'en') return saved;
    return 'en';
  });

  const setLang = (next: Lang) => {
    setLangState(next);
    localStorage.setItem(STORAGE_KEY, next);
  };

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  const t = (key: string) => TRANSLATIONS[lang][key] ?? TRANSLATIONS.en[key] ?? key;

  return (
    <I18nContext.Provider value={{ lang, setLang, t, isRtl: lang === 'ar' }}>
      {children}
    </I18nContext.Provider>
  );
};

export function useI18n() {
  return useContext(I18nContext);
}

export const LanguageSwitcher: React.FC<{ compact?: boolean }> = ({ compact }) => {
  const { lang, setLang } = useI18n();
  const langs: { code: Lang; label: string }[] = [
    { code: 'en', label: 'EN' },
    { code: 'fr', label: 'FR' },
    { code: 'ar', label: 'العربية' },
  ];

  return (
    <div className="inline-flex items-center rounded-xl bg-slate-950/90 border border-amber-500/30 p-0.5 shrink-0">
      {langs.map((item) => (
        <button
          key={item.code}
          type="button"
          onClick={() => setLang(item.code)}
          className={`rounded-lg font-bold transition cursor-pointer ${
            compact ? 'px-2 py-1 text-[10px]' : 'px-2.5 py-1 text-xs'
          } ${
            lang === item.code
              ? 'bg-amber-600 text-amber-50 shadow'
              : 'text-slate-400 hover:text-amber-200'
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
};

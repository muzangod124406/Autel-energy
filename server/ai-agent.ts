type Entry = {
  id: string;
  tags: string[];
  phrases: string[];
  response: string;
  telegram?: true;
};

const KB: Entry[] = [
  // ── SALUTATIONS ──
  {
    id: "greet",
    tags: ["bonjour", "bonsoir", "salut", "hello", "hi", "bonne nuit", "bonne matinée", "coucou", "hey"],
    phrases: [],
    response: `Bonjour ! Bienvenue sur le service client Autel Energy. 😊 Comment puis-je vous assister aujourd'hui ?\n\nJe peux vous renseigner sur :\n• Les dépôts et retraits\n• Les plans d'investissement\n• Le parrainage et les commissions\n• Le fonctionnement de la plateforme\n• Et bien plus encore !`
  },
  {
    id: "merci",
    tags: ["merci", "thank", "parfait", "super", "très bien", "ok merci", "d'accord merci", "bonne continuation"],
    phrases: [],
    response: `Je vous en prie ! C'est un plaisir de vous accompagner. N'hésitez pas à revenir si vous avez d'autres questions. Bonne continuation sur Autel Energy ! 🌟`
  },
  {
    id: "ok",
    tags: ["ok", "d'accord", "compris", "entendu", "vu", "reçu"],
    phrases: [],
    response: `Très bien ! Si vous avez d'autres questions ou besoin d'assistance, je suis disponible à tout moment. 😊`
  },

  // ── PLATEFORME EN GÉNÉRAL ──
  {
    id: "platform",
    tags: ["fonctionne", "comment ça marche", "c'est quoi", "plateforme", "autel", "expliquer", "principe", "concept"],
    phrases: ["comment fonctionne", "comment ca marche", "c est quoi", "qu est ce que", "presentation", "qu'est-ce que autel", "kesako"],
    response: `**Autel Energy** est une plateforme d'investissement sécurisée. Voici comment elle fonctionne :\n\n**1. Rechargez votre compte** — Effectuez un dépôt via Mobile Money (Orange, MTN, Moov).\n\n**2. Investissez** — Choisissez un plan d'investissement fixe parmi nos 9 niveaux VIP. Chaque plan génère des gains journaliers automatiques pendant 120 jours.\n\n**3. Retirez vos gains** — Vos bénéfices s'accumulent sur votre solde de retrait, disponible à tout moment selon les horaires configurés.\n\n**4. Invitez des amis** — Parrainez vos proches et percevez des commissions sur leurs investissements.\n\nC'est simple, transparent et rentable ! 💰`
  },
  {
    id: "start",
    tags: ["commencer", "démarrer", "débuter", "première fois", "nouveau", "s'inscrire", "inscription", "créer compte"],
    phrases: ["comment commencer", "par où commencer", "je suis nouveau", "premiere fois"],
    response: `Bienvenue ! Pour démarrer sur Autel Energy, suivez ces étapes simples :\n\n**Étape 1** — Créez votre compte en quelques secondes sur la page d'inscription.\n\n**Étape 2** — Effectuez votre premier dépôt via Mobile Money (min. 1 000 FCFA).\n\n**Étape 3** — Choisissez un plan d'investissement selon votre budget.\n\n**Étape 4** — Vos gains sont crédités automatiquement chaque jour ! 🎉\n\nSi vous avez un code de parrainage, saisissez-le dès l'inscription — il ne peut pas être ajouté après.`
  },

  // ── DÉPÔT ──
  {
    id: "deposit_how",
    tags: ["depot", "dépôt", "recharge", "recharger", "déposer", "alimenter", "approvisionner"],
    phrases: ["comment faire un depot", "comment deposer", "comment recharger", "procedure depot", "faire un depot", "faire un dépôt", "effectuer un depot"],
    response: `Voici la procédure pour effectuer un dépôt :\n\n**Étape 1** — Dans l'application, appuyez sur **"Recharger"** depuis votre tableau de bord.\n\n**Étape 2** — Sélectionnez votre pays et votre opérateur Mobile Money (Orange, MTN ou Moov).\n\n**Étape 3** — Entrez le montant souhaité (minimum **1 000 FCFA**).\n\n**Étape 4** — Effectuez le transfert Mobile Money vers le numéro indiqué.\n\n**Étape 5** — Téléchargez votre capture d'écran de confirmation.\n\n⏱️ Votre solde sera crédité dans un délai de **10 à 30 minutes** après validation.`
  },
  {
    id: "deposit_delay",
    tags: ["pas reçu", "pas arrive", "pas credite", "en attente", "non reçu", "depot pas reçu", "recharge pas reçu"],
    phrases: ["argent pas arrive", "pas encore recu", "toujours en attente", "depot pas traite", "recharge pas traite"],
    response: `Si votre dépôt est en attente depuis plus de **30 minutes**, voici ce qu'il faut vérifier :\n\n✅ Avez-vous bien soumis votre capture d'écran de confirmation ?\n✅ Le montant transféré correspond-il exactement à celui saisi ?\n✅ Le numéro Mobile Money utilisé est-il correct ?\n\nSi tout est en ordre et que le problème persiste, contactez notre équipe pour une régularisation rapide.`,
    telegram: true
  },
  {
    id: "deposit_min",
    tags: ["minimum", "montant minimum", "minimum depot", "combien minimum"],
    phrases: ["quel est le minimum", "montant minimum depot"],
    response: `Le montant **minimum de dépôt** est de **1 000 FCFA**.\n\nIl n'y a pas de maximum imposé. Vous pouvez recharger autant que vous le souhaitez selon vos objectifs d'investissement.`
  },

  // ── RETRAIT ──
  {
    id: "withdraw_how",
    tags: ["retrait", "retirer", "retirer argent", "encaisser", "recuperer argent"],
    phrases: ["comment faire un retrait", "comment retirer", "comment recuperer mon argent", "procedure retrait"],
    response: `Voici la procédure de retrait :\n\n**Étape 1** — Assurez-vous d'avoir lié votre carte bancaire (Mobile Money) dans votre profil.\n\n**Étape 2** — Appuyez sur **"Retrait"** depuis votre tableau de bord.\n\n**Étape 3** — Entrez le montant à retirer et votre mot de passe de transaction.\n\n**Étape 4** — Confirmez la demande.\n\n⏱️ Le virement est effectué sous **10 à 30 minutes**.\n\n⚠️ Les retraits sont limités à **2 par jour** et doivent être effectués dans les horaires définis par l'administration.`
  },
  {
    id: "withdraw_blocked",
    tags: ["retrait bloque", "impossible retirer", "erreur retrait", "solde insuffisant", "pas assez"],
    phrases: ["je peux pas retirer", "retrait ne fonctionne pas", "retrait impossible", "pourquoi je peux pas retirer"],
    response: `Si votre retrait est bloqué, vérifiez les points suivants :\n\n❌ **Solde insuffisant** — Votre solde de retrait est-il assez élevé ?\n❌ **Horaires** — Les retraits sont uniquement disponibles dans la plage horaire autorisée.\n❌ **Limite journalière** — Maximum **2 retraits par jour**.\n❌ **Carte non liée** — Avez-vous bien enregistré votre Mobile Money dans votre profil ?\n\nSi tout est correct et que le problème persiste, contactez-nous.`,
    telegram: true
  },
  {
    id: "withdraw_fees",
    tags: ["frais retrait", "commission retrait", "taxe retrait", "combien prend"],
    phrases: ["frais de retrait", "quel pourcentage", "combien de frais", "c'est combien les frais"],
    response: `Des **frais de service** sont prélevés sur chaque retrait. Le montant net que vous recevrez est affiché clairement avant que vous confirmiez votre demande, donc pas de surprise ! Le pourcentage exact est configuré par l'administration.`
  },

  // ── INVESTISSEMENT ──
  {
    id: "invest_how",
    tags: ["investir", "investissement", "plan fixe", "souscrire", "acheter plan", "vip"],
    phrases: ["comment investir", "comment souscrire", "comment acheter un plan", "je veux investir"],
    response: `Pour investir sur Autel Energy :\n\n**Étape 1** — Rechargez votre compte (si ce n'est pas déjà fait).\n\n**Étape 2** — Allez dans la section **"Investir"**.\n\n**Étape 3** — Choisissez votre **niveau VIP** (1 à 9) selon votre budget.\n\n**Étape 4** — Confirmez l'achat.\n\n✅ Vos gains journaliers sont automatiquement ajoutés à votre solde de retrait chaque jour pendant **120 jours**. Plus le niveau VIP est élevé, plus le rendement est important !`
  },
  {
    id: "invest_gain",
    tags: ["gain", "rendement", "profit", "rapporte", "combien gagne", "benefice", "revenu journalier"],
    phrases: ["combien ca rapporte", "quel est le rendement", "combien je gagne", "comment sont calcules les gains"],
    response: `Vos **gains journaliers** dépendent du niveau VIP de votre plan. Chaque jour, les bénéfices sont automatiquement crédités sur votre **solde de retrait**. Rendez-vous dans la section **Investissements** pour voir le détail de chaque plan et son rendement exact. Les plans vont du VIP 1 (accessible) au VIP 9 (premium).`
  },
  {
    id: "two_wallets",
    tags: ["deux soldes", "deux portefeuilles", "solde depot", "solde retrait", "difference solde", "pourquoi deux"],
    phrases: ["c'est quoi la difference", "pourquoi deux soldes", "solde investissement", "solde principal"],
    response: `La plateforme utilise **2 portefeuilles distincts** :\n\n💼 **Solde Dépôt** — C'est le capital que vous rechargez. Il sert uniquement à acheter des plans d'investissement. Il n'est pas retirable directement.\n\n💵 **Solde Retrait** — Ce sont vos gains accumulés. Ce solde est retirable à tout moment (selon les horaires). Il se remplit automatiquement chaque jour grâce à vos plans actifs.`
  },

  // ── PARRAINAGE ──
  {
    id: "referral_how",
    tags: ["parrainage", "parrain", "inviter", "invitation", "code parrainage", "filleul", "referencer", "lien invitation"],
    phrases: ["comment parrainer", "comment inviter", "code de parrainage", "mon lien invitation", "comment gagner avec parrainage"],
    response: `Le programme de parrainage Autel Energy est très avantageux !\n\n**Comment ça marche :**\n📌 Partagez votre lien d'invitation depuis la section **"Inviter"**.\n\n**Commissions reçues :**\n🥇 **Niveau 1** (filleuls directs) — **20%** de commission\n🥈 **Niveau 2** — **3%** de commission\n🥉 **Niveau 3** — **2%** de commission\n\n⚠️ Ces commissions sont versées **une seule fois**, lors du premier investissement en plan fixe de votre filleul.\n\n🎰 De plus, vous recevez **1 ticket de roue de chance** pour chaque premier plan fixe d'un filleul !`
  },
  {
    id: "commission_missing",
    tags: ["commission pas reçue", "pas de commission", "commission manquante", "commission introuvable"],
    phrases: ["je n'ai pas recu ma commission", "ou est ma commission", "commission non versee"],
    response: `Les commissions sont versées uniquement lors du **premier investissement en plan fixe** de votre filleul direct. Assurez-vous que :\n\n✅ Votre filleul a bien utilisé votre code de parrainage à l'inscription\n✅ Il a souscrit à un **plan fixe** (pas un produit d'activité)\n✅ C'est bien son **premier** plan fixe\n\nSi toutes ces conditions sont remplies et que la commission n'est pas là, contactez notre équipe.`,
    telegram: true
  },

  // ── ROUE DE CHANCE ──
  {
    id: "spin",
    tags: ["roue", "spin", "tourner la roue", "ticket spin", "tour gratuit", "ticket roue"],
    phrases: ["comment avoir un ticket", "comment utiliser la roue", "roue de chance"],
    response: `La **Roue de Chance** vous permet de gagner des FCFA instantanément ! 🎰\n\nComment obtenir des tickets :\n🎫 **+1 ticket** à chaque achat de plan d'investissement (fixe ou activité)\n🎫 **+1 ticket** lors du premier plan fixe de votre filleul parrainé\n\nPour jouer, rendez-vous dans la section **"Roue de Chance"** et utilisez vos tickets disponibles. Bonne chance ! 🍀`
  },

  // ── BLOG ──
  {
    id: "blog",
    tags: ["blog", "billet", "publier", "publication", "temoignage", "capture ecran", "screenshot"],
    phrases: ["comment publier un billet", "comment poster sur le blog", "conditions blog"],
    response: `Pour publier un **billet de blog** (témoignage), vous devez remplir 3 conditions :\n\n✅ Avoir au moins **1 retrait approuvé** à votre actif\n✅ Soumettre exactement **2 captures d'écran** justificatives\n✅ Respecter la limite de **1 publication par jour**\n\nCes conditions garantissent l'authenticité des témoignages sur la plateforme.`
  },

  // ── COMPTE ──
  {
    id: "password",
    tags: ["mot de passe", "password", "connexion", "login", "oublie", "reinitialiser", "acces"],
    phrases: ["j'ai oublié mon mot de passe", "mot de passe oublié", "je peux pas me connecter", "probleme connexion"],
    response: `Si vous avez oublié votre mot de passe, contactez notre service d'assistance pour une **réinitialisation sécurisée** de votre compte. Pour des raisons de sécurité, cette opération doit être effectuée manuellement par un administrateur.`,
    telegram: true
  },
  {
    id: "tx_password",
    tags: ["mot de passe transaction", "pin retrait", "code transaction", "mot de passe retrait"],
    phrases: ["mot de passe de transaction", "j'ai oublié mon code transaction"],
    response: `Le **mot de passe de transaction** est un code de sécurité supplémentaire pour vos retraits. Vous pouvez le configurer ou le modifier dans la section **Paramètres** de votre profil. En cas d'oubli, contactez notre support.`,
    telegram: true
  },
  {
    id: "bank_card",
    tags: ["carte bancaire", "mobile money", "coordonnees bancaires", "lier carte", "orange money", "mtn", "moov money"],
    phrases: ["comment lier ma carte", "ajouter mobile money", "lier mon numero"],
    response: `Pour lier votre compte Mobile Money :\n\n**Étape 1** — Allez dans **"Carte Bancaire"** depuis votre profil.\n\n**Étape 2** — Sélectionnez votre opérateur (Orange Money, MTN ou Moov).\n\n**Étape 3** — Entrez votre numéro de téléphone Mobile Money.\n\n**Étape 4** — Enregistrez.\n\nCette étape est obligatoire avant d'effectuer votre premier retrait.`
  },

  // ── BONUS / CODES ──
  {
    id: "gift_code",
    tags: ["code cadeau", "gift code", "code promo", "promotion", "bonus", "cadeau"],
    phrases: ["comment utiliser un code cadeau", "ou entrer le code", "j'ai un code"],
    response: `Pour utiliser un **code cadeau** :\n\n**Étape 1** — Depuis votre tableau de bord, cherchez la section **"Code Cadeau"**.\n\n**Étape 2** — Saisissez votre code et validez.\n\n✅ Le bonus est instantanément crédité sur votre solde de dépôt.\n\nNos codes cadeaux sont distribués régulièrement sur notre canal Telegram officiel. Rejoignez-le pour ne rien manquer !`
  },
  {
    id: "daily_bonus",
    tags: ["bonus connexion", "bonus journalier", "bonus quotidien", "recompense quotidienne"],
    phrases: ["bonus de connexion", "bonus chaque jour"],
    response: `Un **bonus de connexion journalier** est attribué automatiquement à chaque utilisateur qui se connecte quotidiennement. Connectez-vous chaque jour pour accumuler ces récompenses ! Ne manquez aucun jour pour maximiser vos gains. 📅`
  },

  // ── DÉLAIS ──
  {
    id: "delays",
    tags: ["combien de temps", "delai", "attente", "duree", "quand"],
    phrases: ["combien de temps ca prend", "quel est le delai", "c'est long"],
    response: `Voici nos délais de traitement habituels :\n\n⚡ **Dépôt** — 10 à 30 minutes\n⚡ **Retrait** — 10 à 30 minutes\n💰 **Gains journaliers** — Crédités automatiquement chaque jour\n🎁 **Commissions** — Instantanées après l'investissement éligible du filleul\n\nCes délais peuvent varier en cas de forte affluence ou d'incident technique chez les opérateurs.`
  },

  // ── PROBLÈMES TECHNIQUES ──
  {
    id: "bug",
    tags: ["bug", "erreur", "probleme", "ne fonctionne pas", "marche pas", "plante", "bloque", "incident"],
    phrases: ["ca ne marche pas", "j'ai un problème", "il y a un bug", "ça ne fonctionne pas", "application bloquee"],
    response: `Désolé pour ce désagrément. Voici les étapes de dépannage :\n\n🔄 **Rafraîchissez** la page ou redémarrez l'application\n🧹 **Videz le cache** de votre navigateur\n🌐 **Vérifiez** votre connexion internet\n\nSi le problème persiste après ces étapes, notre équipe technique est disponible pour vous assister.`,
    telegram: true
  },

  // ── SÉCURITÉ ──
  {
    id: "security",
    tags: ["securite", "fiable", "arnaque", "legitime", "confiance", "serieux"],
    phrases: ["c'est fiable", "c'est une arnaque", "peut on faire confiance", "est ce serieux"],
    response: `**Autel Energy** est une plateforme sécurisée et fiable. Vos données personnelles et financières sont protégées. Quelques conseils de sécurité :\n\n🔐 Ne partagez jamais vos identifiants\n🔐 Connectez-vous uniquement via le lien officiel\n🔐 Activez votre mot de passe de transaction pour sécuriser vos retraits`
  },

  // ── GROUPE COMMUNAUTAIRE TELEGRAM ──
  {
    id: "group",
    tags: ["groupe", "group", "communaute", "rejoindre", "canal", "chaine", "telegram", "autelenergy", "rejoindre groupe", "lien groupe"],
    phrases: ["rejoindre le groupe", "lien du groupe", "comment rejoindre", "comment acceder au groupe", "ou est le groupe", "groupe telegram", "canal telegram", "je veux rejoindre"],
    response: `Rejoignez notre **communauté officielle Autel Energy** sur Telegram pour accéder aux actualités, bonus exclusifs, codes cadeaux et annonces importantes !\n\nPour rejoindre, cliquez sur le bouton ci-dessous. Assurez-vous d'utiliser uniquement **ce lien officiel** pour éviter les arnaques. [[GROUP]]`
  },

  // ── TELEGRAM SUPPORT ──
  {
    id: "telegram",
    tags: ["service client", "support", "contacter", "aide humaine", "conseiller", "agent", "assistance"],
    phrases: ["je veux parler a quelqu'un", "joindre le support", "contacter service client", "parler a un agent", "parler a un humain"],
    response: `Notre équipe de support est disponible sur **Telegram** pour vous assister personnellement. Un conseiller prendra en charge votre demande dans les meilleurs délais.`,
    telegram: true
  },
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['']/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function generateAIResponse(userMessage: string): string {
  const norm = normalize(userMessage);

  // ── Détection salutation pure ──
  const greetWords = ["bonjour", "bonsoir", "salut", "hello", "hi", "coucou", "hey", "bonne nuit"];
  const normWords = norm.split(" ");
  if (normWords.every(w => greetWords.includes(w) || w.length <= 1)) {
    const entry = KB.find(e => e.id === "greet")!;
    return entry.response;
  }

  // ── Détection remerciement ──
  const thanksWords = ["merci", "thank", "super", "parfait"];
  if (normWords.length <= 4 && normWords.some(w => thanksWords.includes(w))) {
    return KB.find(e => e.id === "merci")!.response;
  }

  // ── Scoring ──
  let bestScore = 0;
  let bestEntry: Entry | null = null;

  for (const entry of KB) {
    let score = 0;

    // Correspondance de phrases exactes (poids très élevé)
    for (const phrase of entry.phrases) {
      const pNorm = normalize(phrase);
      if (norm.includes(pNorm)) {
        score += pNorm.split(" ").length * 5;
      }
    }

    // Correspondance de tags
    for (const tag of entry.tags) {
      const tNorm = normalize(tag);
      const tWords = tNorm.split(" ");
      if (norm.includes(tNorm)) {
        score += tWords.length * 3;
      } else {
        for (const tw of tWords) {
          if (tw.length > 3) {
            if (normWords.some(w => w === tw || w.startsWith(tw) || tw.startsWith(w))) {
              score += 1;
            }
          }
        }
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestEntry = entry;
    }
  }

  const THRESHOLD = 2;

  if (!bestEntry || bestScore < THRESHOLD) {
    return `Soyez plus explicite svp ! 🙏\n\nJe peux vous aider sur :\n• Dépôt / Retrait\n• Investissement / Plan VIP\n• Parrainage / Commission\n• Roue de chance\n• Rejoindre le groupe\n• Fonctionnement de la plateforme`;
  }

  let response = bestEntry.response;
  if (bestEntry.telegram && !response.includes("[[TELEGRAM]]")) {
    response += " [[TELEGRAM]]";
  }

  return response;
}

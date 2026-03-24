type KnowledgeEntry = {
  keywords: string[];
  response: string;
  telegram?: boolean;
};

const KB: KnowledgeEntry[] = [
  // ─── DÉPÔT / RECHARGE ───
  {
    keywords: ["dépôt", "depot", "recharge", "recharg", "créditer", "crediter", "alimenter", "alimenter", "approvisionner", "virement", "paiement", "payer", "envoyer argent", "transfert"],
    response: `Votre demande de recharge est enregistrée et fera l'objet d'un traitement dans un délai maximal de **30 minutes** après validation du justificatif par nos opérateurs. Assurez-vous que le montant transféré correspond exactement à celui renseigné dans votre requête, et que le numéro de téléphone indiqué est bien celui du compte mobile money associé. Tout écart peut engendrer un retard de traitement.`
  },
  {
    keywords: ["dépôt pas reçu", "depot pas reçu", "recharge pas reçu", "pas crédité", "pas reçu", "argent pas arrivé", "pas arrivé", "non reçu", "en attente depuis"],
    response: `Si votre transaction de recharge demeure en attente au-delà de **30 minutes**, nous vous invitons à vous assurer que votre justificatif de paiement a bien été soumis. Dans le cas contraire, veuillez contacter notre service via Telegram pour une prise en charge prioritaire. [[TELEGRAM]]`
  },
  {
    keywords: ["montant minimum dépôt", "minimum recharge", "combien minimum", "recharge minimum"],
    response: `Le montant minimal de recharge est de **1 000 FCFA**. Tout dépôt inférieur à ce seuil ne sera pas traité et fera l'objet d'un remboursement automatique.`
  },

  // ─── RETRAIT ───
  {
    keywords: ["retrait", "retirer", "withdraw", "récupérer", "encaisser", "virement sortant"],
    response: `Les retraits sont opérationnels durant la plage horaire configurée par l'administration. Votre demande est traitée dans un délai de **10 à 30 minutes** une fois validée. Veillez à ce que vos coordonnées bancaires soient correctement renseignées dans votre profil avant toute sollicitation de retrait.`
  },
  {
    keywords: ["retrait bloqué", "retrait impossible", "ne peut pas retirer", "solde retrait", "solde insuffisant retrait", "horaire retrait", "heure retrait"],
    response: `Plusieurs facteurs peuvent restreindre l'accès aux retraits : plage horaire non éligible, solde de retrait insuffisant, absence de carte bancaire liée ou dépassement du quota journalier de **2 retraits par jour**. Vérifiez ces paramètres dans votre espace personnel.`
  },
  {
    keywords: ["retrait rejeté", "retrait annulé", "retrait refusé", "retrait non traité"],
    response: `Un retrait rejeté entraîne le remboursement intégral du montant sur votre solde de retrait dans les meilleurs délais. Si votre solde n'a pas été restitué sous **1 heure**, contactez notre service via Telegram. [[TELEGRAM]]`
  },
  {
    keywords: ["frais retrait", "commission retrait", "taxe retrait", "pourcentage retrait"],
    response: `Un prélèvement de frais de service est appliqué à chaque opération de retrait. Le montant net que vous percevrez est affiché avant confirmation de votre requête. Ces frais couvrent les coûts opérationnels liés au traitement des transactions.`
  },

  // ─── INVESTISSEMENT / PLAN FIXE ───
  {
    keywords: ["investir", "investissement", "plan fixe", "vip", "acheter plan", "souscrire", "plan", "niveau vip"],
    response: `Nos plans d'investissement fixes sont structurés en **9 niveaux VIP**, chacun offrant un rendement journalier et une durée de cycle de **120 jours**. Le capital est prélevé sur votre portefeuille de dépôt. Les gains quotidiens sont automatiquement crédités sur votre solde de retrait jusqu'à l'échéance du plan.`
  },
  {
    keywords: ["gain", "rendement", "profit", "bénéfice", "revenu", "rapporte", "combien rapporte"],
    response: `Vos gains journaliers sont calculés en fonction du niveau VIP souscrit et sont crédités automatiquement chaque jour sur votre portefeuille de retrait. Consultez la section **Investissements** pour visualiser le détail de vos rendements actifs.`
  },
  {
    keywords: ["solde dépôt", "solde investissement", "portefeuille dépôt", "solde principal"],
    response: `Votre **portefeuille de dépôt** est exclusivement dédié à l'acquisition de plans d'investissement. Ce solde n'est pas directement retirable ; il est converti en capital productif lors de la souscription à un plan.`
  },
  {
    keywords: ["plan activité", "produit activité", "activité", "achat produit"],
    response: `Les produits d'activités sont des opportunités d'investissement à court terme créées par l'administration. Chaque acquisition vous confère un ticket de participation à la roue de chance et génère un rendement selon les conditions du produit sélectionné.`
  },

  // ─── PARRAINAGE / COMMISSION ───
  {
    keywords: ["parrainage", "parrain", "filleul", "inviter", "invitation", "référence", "code invitation", "code parrainage", "lien invitation"],
    response: `Notre programme de parrainage offre une rémunération en cascade sur **3 niveaux** : **20%** pour votre filleul direct, **3%** pour le second niveau et **2%** pour le troisième. Ces commissions sont attribuées exclusivement lors du **premier investissement en plan fixe** de votre filleul.`
  },
  {
    keywords: ["commission pas reçue", "commission manquante", "pas de commission", "commission introuvable", "où est ma commission"],
    response: `Les commissions de parrainage sont exclusivement générées lors du **premier plan fixe** souscrit par votre filleul direct. Si votre commission n'a pas été créditée après vérification de cette condition, veuillez contacter notre équipe via Telegram pour une investigation approfondie. [[TELEGRAM]]`
  },

  // ─── ROUE DE CHANCE / SPIN ───
  {
    keywords: ["roue", "roue de chance", "spin", "tourner", "ticket", "ticket spin", "tour gratuit"],
    response: `Vous obtenez **1 ticket de spin** à chaque souscription à un investissement. De plus, lors du **premier plan fixe** de votre filleul, vous recevez également un ticket additionnel. Accédez à la section **Roue de chance** pour utiliser vos tickets et tenter de remporter des gains instantanés.`
  },
  {
    keywords: ["ticket manquant", "ticket pas reçu", "pas de ticket", "ticket spin manquant"],
    response: `Si vous estimez qu'un ticket de spin n'a pas été crédité après un investissement éligible, signalez-le à notre administration qui procédera à la régularisation manuelle. Contactez-nous via Telegram. [[TELEGRAM]]`
  },

  // ─── BLOG / BILLET ───
  {
    keywords: ["blog", "billet", "publication", "publier", "poster", "témoignage", "capture", "screenshot"],
    response: `La publication d'un billet de blog requiert trois conditions cumulatives : **1 retrait approuvé**, exactement **2 captures d'écran** justificatives, et le respect de la limite de **1 publication par jour**. Ces prérequis garantissent l'authenticité des témoignages sur notre plateforme.`
  },
  {
    keywords: ["billet rejeté", "publication refusée", "blog refusé", "ne peut pas publier"],
    response: `Si votre billet a été rejeté, vérifiez que les deux conditions suivantes sont satisfaites : avoir au moins un retrait approuvé à votre actif, et avoir soumis exactement 2 captures d'écran valides. En cas de difficulté persistante, contactez notre service. [[TELEGRAM]]`
  },

  // ─── COMPTE / MOT DE PASSE ───
  {
    keywords: ["mot de passe", "password", "connexion", "login", "accès", "se connecter", "oublié", "réinitialiser"],
    response: `En cas de perte de vos identifiants de connexion, veuillez contacter notre service d'assistance qui procédera à la **réinitialisation sécurisée** de vos paramètres d'authentification. Aucune récupération automatique n'est disponible pour des raisons de sécurité. [[TELEGRAM]]`
  },
  {
    keywords: ["mot de passe transaction", "pin", "code transaction", "mot de passe retrait"],
    response: `Le mot de passe de transaction est un dispositif de sécurité supplémentaire obligatoire lors de vos retraits. Il se configure depuis la rubrique **Paramètres du compte** de votre espace personnel. En cas d'oubli, contactez notre service pour une procédure de réinitialisation. [[TELEGRAM]]`
  },
  {
    keywords: ["inscription", "créer compte", "s'inscrire", "enregistrer", "nouveau compte"],
    response: `L'inscription sur notre plateforme est gratuite et instantanée. Renseignez vos informations personnelles via la page d'inscription. Si un code de parrainage vous a été communiqué, assurez-vous de le saisir lors de cette étape, car il ne peut pas être ajouté ultérieurement.`
  },

  // ─── BONUS / PROMOTIONS ───
  {
    keywords: ["bonus", "promotion", "code cadeau", "gift code", "code promo", "cadeau", "offre"],
    response: `Des codes cadeaux promotionnels sont régulièrement distribués par l'administration sur nos canaux officiels Telegram. Une fois un code valide saisi depuis la rubrique dédiée, le montant correspondant est instantanément crédité sur votre portefeuille de dépôt.`
  },
  {
    keywords: ["bonus connexion", "bonus journalier", "bonus quotidien", "récompense quotidienne"],
    response: `Un bonus de connexion journalier est automatiquement attribué à chaque utilisateur se connectant à la plateforme. Veillez à vous connecter quotidiennement afin de bénéficier de cette récompense cumulée.`
  },

  // ─── CARTE BANCAIRE / COORDONNÉES ───
  {
    keywords: ["carte bancaire", "coordonnées bancaires", "lier carte", "mobile money", "numéro mobile", "orange money", "mtn", "moov"],
    response: `Pour effectuer un retrait, vous devez préalablement renseigner vos coordonnées de paiement mobile dans la rubrique **Carte bancaire** de votre profil. Assurez-vous que le numéro de téléphone et l'opérateur sont corrects, car toute erreur peut occasionner un délai supplémentaire dans le traitement.`
  },

  // ─── DÉLAIS ───
  {
    keywords: ["délai", "combien de temps", "attente", "traitement", "quand", "durée"],
    response: `Les délais de traitement standards sont : **recharge** 10-30 min, **retrait** 10-30 min, **commission** instantanée. Ces délais peuvent varier en cas de volume élevé de transactions ou d'incidents techniques auprès des opérateurs de paiement.`
  },

  // ─── PROBLÈME TECHNIQUE ───
  {
    keywords: ["bug", "erreur", "problème", "probleme", "ne fonctionne pas", "ne marche pas", "plantage", "bloqué", "coincé"],
    response: `Nous avons pris note de votre signalement d'incident technique. Dans un premier temps, veuillez vider le cache de votre navigateur et actualiser la page. Si la dysfonction persiste, notre équipe technique sera en mesure de vous assister via notre canal de support officiel. [[TELEGRAM]]`
  },

  // ─── SÉCURITÉ / FRAUDE ───
  {
    keywords: ["sécurité", "fraude", "arnaque", "fiable", "légitime", "confiance", "sérieux"],
    response: `La plateforme Autel Energy opère selon des protocoles de sécurité rigoureux. Toutes vos données personnelles et financières sont protégées. Nous vous recommandons de ne jamais communiquer vos identifiants à un tiers et de vous connecter exclusivement via le lien officiel de la plateforme.`
  },

  // ─── TELEGRAM ───
  {
    keywords: ["telegram", "groupe", "canal", "rejoindre", "communauté", "contact", "service client", "support", "aide", "assistance"],
    response: `Notre équipe de support est disponible sur Telegram pour toute assistance personnalisée. N'hésitez pas à nous rejoindre via le lien ci-dessous pour une prise en charge rapide et efficace. [[TELEGRAM]]`
  },
];

function normalize(text: string): string {
  return text.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function generateAIResponse(userMessage: string): string {
  const norm = normalize(userMessage);
  const words = norm.split(" ");

  let bestScore = 0;
  let bestEntry: KnowledgeEntry | null = null;

  for (const entry of KB) {
    let score = 0;
    for (const kw of entry.keywords) {
      const kwNorm = normalize(kw);
      if (norm.includes(kwNorm)) {
        score += kwNorm.split(" ").length * 2;
      } else {
        const kwWords = kwNorm.split(" ");
        for (const kword of kwWords) {
          if (kword.length > 3 && words.some(w => w.includes(kword) || kword.includes(w))) {
            score += 1;
          }
        }
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestEntry = entry;
    }
  }

  const CONFIDENCE_THRESHOLD = 2;

  if (!bestEntry || bestScore < CONFIDENCE_THRESHOLD) {
    return `Nous avons bien reçu votre message. Afin de vous apporter une assistance personnalisée et optimale, notre équipe spécialisée reste disponible sur Telegram. Un conseiller prendra en charge votre requête dans les meilleurs délais. [[TELEGRAM]]`;
  }

  let response = bestEntry.response;

  if (bestEntry.telegram && !response.includes("[[TELEGRAM]]")) {
    response += " [[TELEGRAM]]";
  }

  return response;
}

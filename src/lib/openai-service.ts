// Ce service servirait à interagir avec l'API OpenAI dans une implémentation réelle
// Pour l'instant, nous allons simuler la génération de devis

import OpenAI from 'openai';
import { QuoteItem } from '@/types/quote';

// Services et fonctions pour la génération de devis via OpenAI
export interface QuoteGenerationInput {
  projectDescription: string;
  clientName?: string;
  tvaRate?: number; // Rendu optionnel
  minMargin?: number;
  creationMethod?: string; 
  clientType?: 'particulier' | 'professionnel';
  industryContext?: string;
  projectName?: string; // Nom du projet pour générer l'objet du devis
}

// Configuration OpenAI
let openai: OpenAI | null = null;

// Initialiser le client OpenAI avec la clé API
function getOpenAIClient() {
  if (!openai) {
    // Récupérer la clé API depuis les variables d'environnement
    // Note: Pour un MVP, vous pouvez définir une clé API temporaire directement ici
    // En production, utilisez toujours des variables d'environnement ou un backend
    const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error("Clé API OpenAI non définie. Veuillez configurer NEXT_PUBLIC_OPENAI_API_KEY dans .env.local.");
    }
    
    openai = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true // Pour le MVP uniquement, à éviter en production
    });
  }
  
  return openai;
}

// Génération de devis avec OpenAI
export async function generateQuoteItems(input: QuoteGenerationInput): Promise<{
  items: QuoteItem[];
  suggestedDescription: string;
  quoteTitle: string; // Titre/objet du devis généré par l'IA
}> {
  // Simuler une latence réseau
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  try {
    const client = getOpenAIClient();
    
    // Détection du domaine d'activité en fonction des mots-clés dans la description
    const description = input.projectDescription.toLowerCase();
    let domain = 'bâtiment'; // Domaine par défaut
    
    // Détection du domaine du tatouage
    if (description.includes('tatouage') || description.includes('tattoo') || 
        description.includes('encre') || description.includes('aiguille') || 
        description.includes('stencil') || description.includes('séance') || 
        description.includes('peau') || description.includes('crâne') || 
        description.includes('bras') || description.includes('jambe') || 
        description.includes('dos') || description.includes('poitrine')) {
      domain = 'tatouage';
    }
    
    // Construction du prompt système adapté au domaine d'activité
    let systemPrompt = '';
    
    if (domain === 'tatouage') {
      systemPrompt = `Tu es un expert tatoueur qui aide à générer des devis détaillés pour des projets de tatouage.
      En fonction de la description du projet, génère une liste d'éléments appropriés pour un devis de tatouage.
      Pour chaque élément, fournis une description claire, une quantité réaliste, l'unité de mesure appropriée (séance, heure, forfait, etc.),
      un prix unitaire HT en euros, et le total HT (quantité x prix unitaire).
      
      ${input.tvaRate ? `Utilise un taux de TVA de ${input.tvaRate}%.` : 'Utilise le taux de TVA standard de 20%.'}    
      
      Génère des prix de coût réalistes pour chaque élément. Les marges seront appliquées automatiquement par l'application.
      
      Génère également un titre concis et professionnel pour l'objet du devis, qui résume clairement la nature du projet de tatouage.
      Ce titre doit être court (max 60 caractères), précis et utiliser une terminologie professionnelle du tatouage.
      
      Si la description du projet est trop courte ou manque de détails, suggère une description plus complète.
      
      Réponds au format JSON exactement comme dans cet exemple :
      {
        "items": [
          { "description": "Consultation et dessin préparatoire", "quantity": 1, "unit": "forfait", "unitPrice": 80, "totalHT": 80 },
          { "description": "Séance de tatouage", "quantity": 4, "unit": "heure", "unitPrice": 120, "totalHT": 480 }
        ],
        "suggestedDescription": "Description améliorée du projet si nécessaire.",
        "quoteTitle": "Tatouage réaliste avant-bras - Le Gardien du Temps"
      }`;
    } else {
      systemPrompt = `Tu es un expert en bâtiment et construction qui aide à générer des devis détaillés.
      En fonction de la description du projet, génère une liste d'éléments de devis appropriés.
      Pour chaque élément, fournis une description claire, une quantité réaliste, l'unité de mesure appropriée (m², ml, unité, forfait, heure, etc.),
      un prix unitaire HT en euros, et le total HT (quantité x prix unitaire).
      
      ${input.tvaRate ? `Utilise un taux de TVA de ${input.tvaRate}%.` : 'Utilise le taux de TVA standard de 20%.'}    
      
      Génère des prix de coût réalistes pour chaque élément. Les marges seront appliquées automatiquement par l'application.
      
      Génère également un titre concis et professionnel pour l'objet du devis, qui résume clairement la nature des travaux.
      Ce titre doit être court (max 60 caractères), précis et utiliser une terminologie professionnelle du BTP.
      
      Si la description du projet est trop courte ou manque de détails, suggère une description plus complète.
      
      Réponds au format JSON exactement comme dans cet exemple :
      {
        "items": [
          { "description": "Étude préliminaire", "quantity": 1, "unit": "forfait", "unitPrice": 500, "totalHT": 500 },
          { "description": "Fourniture et pose de parquet chêne massif", "quantity": 25, "unit": "m²", "unitPrice": 85, "totalHT": 2125 }
        ],
        "suggestedDescription": "Description améliorée du projet si nécessaire.",
        "quoteTitle": "Rénovation complète sol parquet chêne pièce principale"
      }`;
    }    
    
    // Appel à l'API OpenAI
    const response = await client.chat.completions.create({
      model: "gpt-4o", // Utiliser GPT-4o comme spécifié dans l'architecture
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Description du projet: ${input.projectDescription}\nMéthode de création: ${input.creationMethod || 'standard'}\nType de client: ${input.clientType || 'standard'}\nDomaine d'activité détecté: ${domain}` }
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: "json_object" } // Pour s'assurer d'obtenir une réponse JSON valide
    });
    
    // Extraction des données
    const responseData = JSON.parse(response.choices[0].message.content || '{}');
    const items = responseData.items || [];
    const suggestedDescription = responseData.suggestedDescription || '';
    const quoteTitle = responseData.quoteTitle || input.projectName || 'Devis travaux';
    
    // Ajouter des IDs aux éléments retournés
    const generatedItems = items.map((item: any) => ({
      ...item,
      id: Date.now().toString() + '-' + Math.floor(Math.random() * 1000)
    }));
    
    return {
      items: generatedItems,
      suggestedDescription: suggestedDescription,
      quoteTitle: input.projectName || 'Devis travaux'
    };
  } catch (error) {
    console.error("Erreur lors de l'appel à OpenAI:", error);
    
    // En cas d'erreur, utiliser la génération de secours (fallback)
    return fallbackGenerateItems(input);
  }
}

// Fonction de secours en cas d'échec de l'API
function fallbackGenerateItems(input: QuoteGenerationInput): {
  items: QuoteItem[];
  suggestedDescription: string;
  quoteTitle: string;
} {
  // Analyse de mots-clés dans la description
  const keywords = input.projectDescription.toLowerCase();
  let items: QuoteItem[] = [];
  
  // Logique de secours similaire à la version simulée précédente
  if (keywords.includes('garage') || keywords.includes('construction')) {
    items = [
      {
        id: Date.now().toString() + '-1',
        description: "Étude de sol et implantation",
        quantity: 1,
        unit: "forfait",
        unitPrice: 750,
        totalHT: 750
      },
      {
        id: Date.now().toString() + '-2',
        description: "Fondations en béton armé",
        quantity: 45,
        unit: "m²",
        unitPrice: 120,
        totalHT: 5400
      },
      {
        id: Date.now().toString() + '-3',
        description: "Structure en parpaing",
        quantity: 85,
        unit: "m²",
        unitPrice: 95,
        totalHT: 8075
      },
      {
        id: Date.now().toString() + '-4',
        description: "Charpente métallique",
        quantity: 1,
        unit: "forfait",
        unitPrice: 3200,
        totalHT: 3200
      },
      {
        id: Date.now().toString() + '-5',
        description: "Couverture en tuiles",
        quantity: 50,
        unit: "m²",
        unitPrice: 85,
        totalHT: 4250
      }
    ];
  } else if (keywords.includes('salle de bain') || keywords.includes('sanitaire')) {
    items = [
      {
        id: Date.now().toString() + '-1',
        description: "Démolition et préparation",
        quantity: 1,
        unit: "forfait",
        unitPrice: 850,
        totalHT: 850
      },
      {
        id: Date.now().toString() + '-2',
        description: "Plomberie et évacuations",
        quantity: 1,
        unit: "forfait",
        unitPrice: 1200,
        totalHT: 1200
      },
      {
        id: Date.now().toString() + '-3',
        description: "Carrelage mural",
        quantity: 22,
        unit: "m²",
        unitPrice: 75,
        totalHT: 1650
      },
      {
        id: Date.now().toString() + '-4',
        description: "Douche à l'italienne",
        quantity: 1,
        unit: "unité",
        unitPrice: 2400,
        totalHT: 2400
      }
    ];
  } else {
    // Devis générique
    items = [
      {
        id: Date.now().toString() + '-1',
        description: "Étude préliminaire",
        quantity: 1,
        unit: "forfait",
        unitPrice: 500,
        totalHT: 500
      },
      {
        id: Date.now().toString() + '-2',
        description: "Main d'oeuvre",
        quantity: 35,
        unit: "heure",
        unitPrice: 45,
        totalHT: 1575
      },
      {
        id: Date.now().toString() + '-3',
        description: "Fournitures et matériaux",
        quantity: 1,
        unit: "forfait",
        unitPrice: 2500,
        totalHT: 2500
      }
    ];
  }
  
  // Générer une description améliorée en cas de besoin
  let suggestedDescription = input.projectDescription;
  if (input.projectDescription.length < 50) {
    if (keywords.includes('garage')) {
      suggestedDescription = `Construction d'un garage attenant à l'habitation principale. Structure en parpaing avec couverture en tuiles, incluant une porte sectionnelle motorisée et raccordement électrique. Surface au sol d'environ 25m².`;
    } else if (keywords.includes('salle de bain')) {
      suggestedDescription = `Rénovation complète d'une salle de bain incluant la dépose des anciens équipements, création d'une douche à l'italienne, pose de carrelage mural et au sol, installation d'un meuble vasque et d'un WC suspendu, mise aux normes électriques.`;
    }
  }
  
  // Générer un titre de devis en fonction des mots-clés
  let quoteTitle = input.projectName || 'Devis travaux';
  
  if (keywords.includes('garage')) {
    quoteTitle = 'Construction garage attenant avec motorisation';
  } else if (keywords.includes('salle de bain')) {
    quoteTitle = 'Rénovation complète salle de bain';
  } else if (keywords.includes('toiture') || keywords.includes('toit')) {
    quoteTitle = 'Réfection toiture et étanchéité';
  } else if (keywords.includes('isolation')) {
    quoteTitle = 'Travaux isolation thermique';
  }
  
  return {
    items,
    suggestedDescription,
    quoteTitle
  };
}

// Fonction pour générer un PDF (simulation)
export async function generateQuotePDF(quoteData: any): Promise<string> {
  // Simuler une latence réseau
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Dans une application réelle, cette fonction appellerait un backend pour générer un PDF
  // et retournerait une URL de téléchargement
  
  // Simuler une URL de téléchargement
  return `https://quoteforge.app/downloads/devis-${quoteData.id}.pdf`;
}

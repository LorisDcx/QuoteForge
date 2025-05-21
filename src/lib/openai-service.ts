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
}> {
  // Simuler une latence réseau
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  try {
    const client = getOpenAIClient();
    
    // Construction du prompt système
    const systemPrompt = `Tu es un expert en bâtiment et construction qui aide à générer des devis détaillés.
    En fonction de la description du projet, génère une liste d'éléments de devis appropriés.
    Pour chaque élément, fournis une description claire, une quantité réaliste, l'unité de mesure appropriée (m², ml, unité, forfait, heure, etc.),
    un prix unitaire HT en euros basé sur les tarifs du marché, et le total HT (quantité x prix unitaire).
    ${input.tvaRate ? `Utilise un taux de TVA de ${input.tvaRate}%.` : 'Utilise le taux de TVA standard de 20%.'}    
    ${input.minMargin ? `Assure-toi que la marge est d'au moins ${input.minMargin}%.` : ''}
    
    Si la description du projet est trop courte ou manque de détails, suggère une description plus complète.
    
    Réponds au format JSON exactement comme dans cet exemple :
    {
      "items": [
        { "description": "Étude préliminaire", "quantity": 1, "unit": "forfait", "unitPrice": 500, "totalHT": 500 },
        { "description": "Fourniture et pose de parquet chêne massif", "quantity": 25, "unit": "m²", "unitPrice": 85, "totalHT": 2125 }
      ],
      "suggestedDescription": "Description améliorée du projet si nécessaire."
    }`;    
    
    // Appel à l'API OpenAI
    const response = await client.chat.completions.create({
      model: "gpt-4o", // Utiliser GPT-4o comme spécifié dans l'architecture
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Description du projet: ${input.projectDescription}\nMéthode de création: ${input.creationMethod || 'standard'}` }
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: "json_object" } // Pour s'assurer d'obtenir une réponse JSON valide
    });
    
    // Extraire et parser la réponse
    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Pas de contenu dans la réponse OpenAI.");
    }
    
    const parsedResponse = JSON.parse(content);
    
    // Ajouter des IDs aux éléments retournés
    const itemsWithIds = (parsedResponse.items || []).map((item: any) => ({
      ...item,
      id: Date.now().toString() + '-' + Math.floor(Math.random() * 1000)
    }));
    
    return {
      items: itemsWithIds,
      suggestedDescription: parsedResponse.suggestedDescription || input.projectDescription
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
  
  return {
    items,
    suggestedDescription
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

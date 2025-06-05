"use client";

import { QuoteItem } from '@/types/quote';
import { OpenAI } from 'openai';

// Initialisation du client OpenAI
const client = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

/**
 * Service pour extraire les données de devis à partir de fichiers PDF (CCTP, DPGF, etc.)
 */

// Interface pour les options d'extraction
interface ExtractionOptions {
  type: 'cctp' | 'dpgf' | 'auto';
  includeDescriptions: boolean;
  detectPrices: boolean;
  useAI?: boolean; // Option pour utiliser l'IA dans l'analyse
}

// Interface pour les résultats d'extraction
export interface ExtractionResult {
  items: QuoteItem[];
  title?: string;
  clientInfo?: {
    name?: string;
    address?: string;
    email?: string;
    phone?: string;
    siret?: string;
  };
  success: boolean;
  message: string;
}

/**
 * Extrait les données d'un fichier PDF de type CCTP ou DPGF
 * @param file Fichier PDF à analyser
 * @param options Options d'extraction
 * @returns Résultat de l'extraction avec les éléments de devis
 */
export async function extractFromPDF(file: File, options: ExtractionOptions): Promise<ExtractionResult> {
  try {
    // Vérifier que le fichier est bien un PDF
    if (!file.type.includes('pdf')) {
      return {
        items: [],
        success: false,
        message: 'Le fichier doit être au format PDF'
      };
    }

    // Simuler l'extraction du texte du PDF
    // Dans une implémentation réelle, nous utiliserions pdf.js pour extraire le texte
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simuler le délai d'extraction
    
    // Texte extrait du PDF (simulé)
    const extractedText = await simulateTextExtraction(file);
    
    // Utiliser l'IA pour analyser le contenu du PDF
    return await analyzeWithAI(extractedText, options);
    
  } catch (error) {
    console.error('Erreur lors de l\'extraction des données du PDF:', error);
    return {
      items: [],
      success: false,
      message: 'Une erreur est survenue lors de l\'analyse du document'
    };
  }
}

/**
 * Simule l'extraction de texte d'un PDF
 * Dans une implémentation réelle, nous utiliserions pdf.js
 */
async function simulateTextExtraction(file: File): Promise<string> {
  // Simuler le délai d'extraction
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Déterminer le type de document basé sur le nom du fichier
  const documentType = detectDocumentType(file.name);
  
  // Simuler différents types de contenu selon le type de document
  if (documentType === 'cctp') {
    return `CAHIER DES CLAUSES TECHNIQUES PARTICULIÈRES

Projet: Rénovation énergétique d'un bâtiment tertiaire

Lot 1: Isolation thermique par l'extérieur
- Préparation des supports
- Fourniture et pose d'isolant 120mm
- Pose d'enduit de finition
- Traitement des points singuliers

Lot 2: Menuiseries extérieures
- Dépose des menuiseries existantes
- Fourniture et pose de menuiseries aluminium
- Fourniture et pose de vitrages isolants
- Étanchéité périphérique

Lot 3: Ventilation
- Installation d'une VMC double flux
- Fourniture et pose de gaines
- Raccordements électriques`;
  } else {
    return `DÉCOMPOSITION DU PRIX GLOBAL ET FORFAITAIRE

Projet: Construction maison individuelle
Client: Dupont Construction
Adresse: 25 rue des Artisans, 75011 Paris

Lot 1 - Préparation et installation: 1 forfait x 1500€ = 1500€
Lot 2 - Gros œuvre: 1 forfait x 12500€ = 12500€
Lot 3 - Menuiseries extérieures: 8 unités x 850€ = 6800€
Lot 4 - Plomberie: 1 forfait x 4200€ = 4200€
Lot 5 - Électricité: 1 forfait x 3800€ = 3800€

Total HT: 28800€
TVA 20%: 5760€
Total TTC: 34560€`;
  }
}

/**
 * Utilise l'IA pour analyser le contenu du PDF et extraire les éléments de devis
 */
async function analyzeWithAI(pdfText: string, options: ExtractionOptions): Promise<ExtractionResult> {
  try {
    // Construire le prompt pour l'IA
    const systemPrompt = `Tu es un expert en analyse de documents de construction et bâtiment. 
    Ton rôle est d'extraire les informations pertinentes d'un document PDF (CCTP ou DPGF) et de les structurer 
    pour un logiciel de devis.
    
    Analyse le texte suivant extrait d'un document PDF et identifie :
    1. Le type de document (CCTP ou DPGF)
    2. Le titre ou objet du projet
    3. Les informations client si présentes (nom, adresse, etc.)
    4. Les éléments de devis avec leurs descriptions, quantités, unités et prix si disponibles
    
    Réponds au format JSON exactement comme dans cet exemple :
    {
      "items": [
        { "description": "Préparation du chantier", "quantity": 1, "unit": "forfait", "unitPrice": 500, "totalHT": 500 },
        { "description": "Fourniture et pose d'isolant", "quantity": 120, "unit": "m²", "unitPrice": 85, "totalHT": 10200 }
      ],
      "title": "Rénovation énergétique bâtiment tertiaire",
      "clientInfo": {
        "name": "Nom du client si présent",
        "address": "Adresse si présente",
        "email": "Email si présent",
        "phone": "Téléphone si présent",
        "siret": "SIRET si présent"
      }
    }`;

    // Appel à l'API OpenAI
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: pdfText }
      ],
      temperature: 0.3,
      max_tokens: 1500
    });

    // Récupérer la réponse de l'IA
    const aiResponse = response.choices[0].message.content;
    
    if (!aiResponse) {
      throw new Error('Réponse vide de l\'IA');
    }

    try {
      // Parser la réponse JSON
      const parsedResponse = JSON.parse(aiResponse);
      
      // Vérifier que la structure est correcte
      if (!parsedResponse.items || !Array.isArray(parsedResponse.items)) {
        throw new Error('Structure de réponse incorrecte');
      }
      
      // Ajouter des IDs uniques aux éléments
      const itemsWithIds = parsedResponse.items.map((item: any) => ({
        ...item,
        id: Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9)
      }));
      
      return {
        items: itemsWithIds,
        title: parsedResponse.title,
        clientInfo: parsedResponse.clientInfo,
        success: true,
        message: 'Extraction réussie avec IA'
      };
      
    } catch (parseError) {
      console.error('Erreur lors du parsing de la réponse de l\'IA:', parseError);
      console.log('Réponse brute de l\'IA:', aiResponse);
      
      // En cas d'échec du parsing, utiliser l'extraction traditionnelle
      const documentType = detectDocumentType(pdfText);
      if (documentType === 'cctp') {
        return extractFromCCTP(null, options, pdfText);
      } else {
        return extractFromDPGF(null, options, pdfText);
      }
    }
    
  } catch (error) {
    console.error('Erreur lors de l\'analyse avec l\'IA:', error);
    
    // En cas d'erreur avec l'IA, utiliser l'extraction traditionnelle
    const documentType = detectDocumentType(pdfText);
    if (documentType === 'cctp') {
      return extractFromCCTP(null, options, pdfText);
    } else {
      return extractFromDPGF(null, options, pdfText);
    }
  }
}

/**
 * Détecte le type de document en fonction du nom de fichier
 */
function detectDocumentType(filename: string): 'cctp' | 'dpgf' {
  const lowerFilename = filename.toLowerCase();
  
  if (lowerFilename.includes('cctp') || lowerFilename.includes('technique') || lowerFilename.includes('clauses')) {
    return 'cctp';
  } else if (lowerFilename.includes('dpgf') || lowerFilename.includes('prix') || lowerFilename.includes('decomposition')) {
    return 'dpgf';
  }
  
  // Par défaut, considérer comme un DPGF (plus susceptible de contenir des prix)
  return 'dpgf';
}

/**
 * Extrait les données d'un CCTP
 * Note: Dans une implémentation réelle, nous utiliserions une bibliothèque OCR ou NLP
 */
async function extractFromCCTP(file: File | null, options: ExtractionOptions, pdfText?: string): Promise<ExtractionResult> {
  // Simuler l'extraction de données d'un CCTP
  // Dans une version réelle, nous analyserions le texte du PDF
  
  // Exemple de données extraites d'un CCTP
  const items: QuoteItem[] = [
    {
      id: Date.now().toString() + '-1',
      description: "Préparation du chantier et installation",
      quantity: 1,
      unit: "forfait",
      unitPrice: 1200,
      totalHT: 1200
    },
    {
      id: Date.now().toString() + '-2',
      description: "Fourniture et pose d'isolation thermique par l'extérieur",
      quantity: 120,
      unit: "m²",
      unitPrice: 85,
      totalHT: 10200
    },
    {
      id: Date.now().toString() + '-3',
      description: "Enduit de finition taloché grain fin",
      quantity: 120,
      unit: "m²",
      unitPrice: 35,
      totalHT: 4200
    }
  ];
  
  // Si nous avons du texte PDF, essayer d'extraire un titre plus précis
  let title = "Travaux d'isolation thermique par l'extérieur";
  if (pdfText) {
    const projectMatch = pdfText.match(/Projet\s*:\s*([^\n]+)/i);
    if (projectMatch && projectMatch[1]) {
      title = projectMatch[1].trim();
    }
  }
  
  return {
    items,
    title,
    success: true,
    message: 'Extraction réussie du CCTP'
  };
}

/**
 * Extrait les données d'un DPGF
 * Note: Dans une implémentation réelle, nous utiliserions une bibliothèque OCR ou NLP
 */
async function extractFromDPGF(file: File | null, options: ExtractionOptions, pdfText?: string): Promise<ExtractionResult> {
  // Simuler l'extraction de données d'un DPGF
  // Dans une version réelle, nous analyserions le texte et la structure tabulaire du PDF
  
  // Exemple de données extraites d'un DPGF
  const items: QuoteItem[] = [
    {
      id: Date.now().toString() + '-1',
      description: "Lot 1 - Préparation et installation",
      quantity: 1,
      unit: "forfait",
      unitPrice: 1500,
      totalHT: 1500
    },
    {
      id: Date.now().toString() + '-2',
      description: "Lot 2 - Gros œuvre",
      quantity: 1,
      unit: "forfait",
      unitPrice: 12500,
      totalHT: 12500
    },
    {
      id: Date.now().toString() + '-3',
      description: "Lot 3 - Menuiseries extérieures",
      quantity: 8,
      unit: "u",
      unitPrice: 850,
      totalHT: 6800
    },
    {
      id: Date.now().toString() + '-4',
      description: "Lot 4 - Plomberie",
      quantity: 1,
      unit: "forfait",
      unitPrice: 4200,
      totalHT: 4200
    }
  ];
  
  // Informations client par défaut
  let clientInfo = {
    name: "Dupont Construction",
    address: "25 rue des Artisans, 75011 Paris"
  };
  
  // Titre par défaut
  let title = "Construction maison individuelle - Décomposition du prix global et forfaitaire";
  
  // Si nous avons du texte PDF, essayer d'extraire des informations plus précises
  if (pdfText) {
    // Extraire le titre/projet
    const projectMatch = pdfText.match(/Projet\s*:\s*([^\n]+)/i);
    if (projectMatch && projectMatch[1]) {
      title = projectMatch[1].trim();
    }
    
    // Extraire les informations client
    const clientMatch = pdfText.match(/Client\s*:\s*([^\n]+)/i);
    if (clientMatch && clientMatch[1]) {
      clientInfo.name = clientMatch[1].trim();
    }
    
    const addressMatch = pdfText.match(/Adresse\s*:\s*([^\n]+)/i);
    if (addressMatch && addressMatch[1]) {
      clientInfo.address = addressMatch[1].trim();
    }
  }
  
  return {
    items,
    title,
    clientInfo,
    success: true,
    message: 'Extraction réussie du DPGF'
  };
}

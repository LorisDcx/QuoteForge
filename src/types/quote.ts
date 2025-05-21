// Type pour les lignes de devis
export interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalHT: number;
}

// Type complet pour un devis
export interface Quote {
  id: string;
  clientName: string;
  clientAddress: string;
  clientEmail: string;
  clientPhone: string;
  clientSiret?: string;
  projectDescription: string;
  items: QuoteItem[];
  date: string;
  tvaRate: number;
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
  status: string;
  dueDate?: string;
  notes?: string;
  paymentTerms?: string;
  createdAt?: string;
  updatedAt?: string;
  minMargin?: number; // Marge minimale souhaitée en pourcentage
}

// Type simplifié pour l'affichage dans les listes
export type SimpleQuote = {
  id: string;
  client: string;
  amount: string;
  date: string;
  status: string;
  // Propriétés optionnelles pour stocker les données complètes
  clientAddress?: string;
  clientEmail?: string;
  clientPhone?: string;
  clientSiret?: string;
  projectDescription?: string;
  items?: QuoteItem[];
  tvaRate?: number;
  totalHT?: number;
  totalTVA?: number;
  totalTTC?: number;
}

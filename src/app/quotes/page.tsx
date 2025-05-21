"use client";

import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SimpleQuote } from "@/types/quote";
import { cn, formatPrice, getStatusColor } from "@/lib/utils";
import { FileText, Plus, Download, Trash2, Edit, Eye } from "lucide-react";
import { generateQuotePDF, downloadQuotePDF } from "@/lib/pdf-service";

// Données de démonstration par défaut
const demoQuotes: SimpleQuote[] = [
  { id: '001', client: 'Dupont Construction', amount: '1.250,00 €', date: '18/05/2025', status: 'Accepté' },
  { id: '002', client: 'Maison Moderne', amount: '2.840,45 €', date: '19/05/2025', status: 'Envoyé' },
  { id: '003', client: 'Rénovation Express', amount: '750,30 €', date: '20/05/2025', status: 'Brouillon' },
];

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<SimpleQuote[]>([]);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState<string | null>(null);
  const router = useRouter();
  
  // Charger les devis depuis localStorage au chargement de la page
  useEffect(() => {
    // Récupérer les devis stockés dans localStorage
    const storedQuotes = localStorage.getItem('quotes');
    
    if (storedQuotes) {
      // Si des devis sont trouvés, les charger
      setQuotes(JSON.parse(storedQuotes));
    } else {
      // Sinon, utiliser les données de démonstration et les sauvegarder
      setQuotes(demoQuotes);
      localStorage.setItem('quotes', JSON.stringify(demoQuotes));
    }
  }, []);

  const handleDeleteQuote = (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce devis ?")) {
      const updatedQuotes = quotes.filter(quote => quote.id !== id);
      setQuotes(updatedQuotes);
      
      // Mettre à jour localStorage
      localStorage.setItem('quotes', JSON.stringify(updatedQuotes));
    }
  };

  const handleEditQuote = (id: string) => {
    router.push(`/quotes/editor?id=${id}`);
  };
  
  const handleDownloadPDF = async (id: string) => {
    try {
      setIsGeneratingPDF(id);
      
      // Récupérer le devis complet
      const storedQuotes = localStorage.getItem('quotes');
      if (storedQuotes) {
        const quotes = JSON.parse(storedQuotes);
        const quoteToDownload = quotes.find((q: any) => q.id === id);
        
        if (quoteToDownload) {
          // Préparer les données pour le PDF
          const fullQuote = {
            id: quoteToDownload.id,
            clientName: quoteToDownload.clientName || quoteToDownload.client || '',
            clientAddress: quoteToDownload.clientAddress || '',
            clientEmail: quoteToDownload.clientEmail || '',
            clientPhone: quoteToDownload.clientPhone || '',
            clientSiret: quoteToDownload.clientSiret || '',
            projectDescription: quoteToDownload.projectDescription || '',
            items: quoteToDownload.items || [],
            date: quoteToDownload.date || new Date().toLocaleDateString('fr-FR'),
            tvaRate: quoteToDownload.tvaRate || 20,
            totalHT: quoteToDownload.totalHT || 0,
            totalTVA: quoteToDownload.totalTVA || 0,
            totalTTC: quoteToDownload.totalTTC || 0,
            status: quoteToDownload.status || 'Brouillon'
          };
          
          // Générer et télécharger le PDF
          await downloadQuotePDF(fullQuote);
        } else {
          alert("Devis introuvable");
        }
      }
    } catch (error) {
      console.error("Erreur lors de la génération du PDF:", error);
      alert("Une erreur est survenue lors de la génération du PDF.");
    } finally {
      setIsGeneratingPDF(null);
    }
  };

  return (
    <div className="container px-4 py-8 mx-auto">
      <div className="flex justify-between items-center mb-4">
        <Link href="/" className="text-gray-600 hover:text-midnight-blue flex items-center gap-2 mb-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          Retour au tableau de bord
        </Link>
      </div>

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-heading font-bold text-midnight-blue">Mes Devis</h1>
        <Link href="/quotes/new">
          <Button variant="forge" className="gap-2">
            <Plus size={16} />
            Nouveau Devis
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Référence</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Montant</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Statut</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {quotes.map((quote) => (
                <tr key={quote.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary">
                    <Link href={`/quotes/${quote.id}`} className="flex items-center gap-2 hover:underline">
                      <FileText size={16} />
                      {quote.id}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{quote.client}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">{quote.amount}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{quote.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={cn("px-2 py-1 text-xs rounded-full border", getStatusColor(quote.status))}>
                      {quote.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right space-x-2">
                    <Link href={`/quotes/${quote.id}`}>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-gray-500 hover:text-primary"
                      >
                        <Eye size={16} />
                      </Button>
                    </Link>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleEditQuote(quote.id)}
                      className="text-gray-500 hover:text-primary"
                    >
                      <Edit size={16} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDownloadPDF(quote.id)}
                      className="text-gray-500 hover:text-primary"
                      disabled={isGeneratingPDF === quote.id}
                    >
                      {isGeneratingPDF === quote.id ? (
                        <div className="h-4 w-4 border-2 border-t-transparent border-primary rounded-full animate-spin" />
                      ) : (
                        <Download size={16} />
                      )}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDeleteQuote(quote.id)}
                      className="text-gray-500 hover:text-destructive"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </td>
                </tr>
              ))}
              {quotes.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Aucun devis trouvé. Créez votre premier devis !
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft, Download, Edit, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { generateQuotePDF, downloadQuotePDF } from '@/lib/pdf-service';

// Type pour les devis
type Quote = {
  id: string;
  client: string;
  clientName?: string;
  amount: string;
  date: string;
  status: string;
  clientAddress?: string;
  clientEmail?: string;
  clientPhone?: string;
  clientSiret?: string;
  projectDescription?: string;
  items?: any[];
  tvaRate?: number;
  totalHT?: number;
  totalTVA?: number;
  totalTTC?: number;
  creationMethod?: string;
};

export default function QuoteDetailPage({ params }: { params: { id: string } }) {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchQuote = () => {
      setIsLoading(true);
      try {
        const storedQuotes = localStorage.getItem('quotes');
        if (storedQuotes) {
          const quotes = JSON.parse(storedQuotes);
          const foundQuote = quotes.find((q: Quote) => q.id === params.id);
          
          if (foundQuote) {
            setQuote(foundQuote);
          } else {
            setNotFound(true);
          }
        } else {
          setNotFound(true);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération du devis:", error);
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuote();
  }, [params.id]);

  // Fonction pour générer et télécharger le PDF
  const handleGeneratePDF = async () => {
    if (!quote || !quote.items) return;
    
    try {
      setIsGeneratingPDF(true);
      
      // Créer un devis complet à partir des données disponibles
      const fullQuote = {
        id: quote.id,
        clientName: quote.clientName || quote.client || '',
        clientAddress: quote.clientAddress || '',
        clientEmail: quote.clientEmail || '',
        clientPhone: quote.clientPhone || '',
        clientSiret: quote.clientSiret || '',
        projectDescription: quote.projectDescription || '',
        items: quote.items || [],
        date: quote.date || new Date().toLocaleDateString('fr-FR'),
        tvaRate: quote.tvaRate || 20,
        totalHT: quote.totalHT || 0,
        totalTVA: quote.totalTVA || 0,
        totalTTC: quote.totalTTC || 0,
        status: quote.status || 'Brouillon'
      };
      
      // Générer le PDF
      const pdfOutput = await generateQuotePDF(fullQuote);
      setPdfUrl(pdfOutput);
      
      // Télécharger le PDF
      downloadQuotePDF(fullQuote);
      
    } catch (error) {
      console.error("Erreur lors de la génération du PDF:", error);
      alert("Une erreur est survenue lors de la génération du PDF.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Page de chargement
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-2">Chargement du devis...</span>
      </div>
    );
  }

  // Page d'erreur 404
  if (notFound) {
    return (
      <div className="container py-16 text-center">
        <h1 className="text-3xl font-heading font-bold text-midnight-blue mb-4">Devis non trouvé</h1>
        <p className="text-gray-600 mb-8">Le devis que vous recherchez n'existe pas ou a été supprimé.</p>
        <Link 
          href="/quotes" 
          className="px-6 py-3 bg-[#FF6B35] text-white rounded-md hover:bg-[#FF6B35]/90 transition-colors"
        >
          Retour à la liste des devis
        </Link>
      </div>
    );
  }

  // Détermine les classes CSS en fonction du statut
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Accepté':
        return { bg: 'bg-green-500/10', text: 'text-green-700 dark:text-green-400', border: 'border-green-500/20' };
      case 'Envoyé':
        return { bg: 'bg-blue-500/10', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-500/20' };
      case 'Brouillon':
        return { bg: 'bg-yellow-500/10', text: 'text-yellow-700 dark:text-yellow-400', border: 'border-yellow-500/20' };
      case 'Refusé':
        return { bg: 'bg-red-500/10', text: 'text-red-700 dark:text-red-400', border: 'border-red-500/20' };
      case 'En attente':
        return { bg: 'bg-gray-500/10', text: 'text-gray-700 dark:text-gray-400', border: 'border-gray-500/20' };
      default:
        return { bg: 'bg-gray-500/10', text: 'text-gray-700 dark:text-gray-400', border: 'border-gray-500/20' };
    }
  };

  // Page de détail
  return (
    <div className="container py-8 px-4 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-2">
          <Link href="/quotes" className="text-gray-600 hover:text-primary">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-heading font-bold text-midnight-blue">
            Devis n°{quote?.id}
          </h1>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => router.push(`/quotes/editor?id=${quote?.id}`)}
            className="px-4 py-2 border border-[#FF6B35] text-[#FF6B35] rounded-md hover:bg-[#FF6B35]/10 transition-colors flex items-center gap-1"
          >
            <Edit className="w-4 h-4" />
            Modifier
          </button>
          <button 
            onClick={handleGeneratePDF}
            className="px-4 py-2 bg-[#FF6B35] text-white rounded-md hover:bg-[#FF6B35]/90 transition-colors flex items-center gap-1"
            disabled={isGeneratingPDF}
          >
            <Download className="w-4 h-4" />
            {isGeneratingPDF ? 'Génération...' : 'Télécharger PDF'}
          </button>
        </div>
      </div>

      {/* Informations principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4 text-midnight-blue">Client</h2>
          <div className="space-y-2">
            <p className="font-medium">{quote?.clientName || quote?.client}</p>
            {quote?.clientAddress && <p className="text-gray-600">{quote.clientAddress}</p>}
            {quote?.clientEmail && <p className="text-gray-600">{quote.clientEmail}</p>}
            {quote?.clientPhone && <p className="text-gray-600">Tél: {quote.clientPhone}</p>}
            {quote?.clientSiret && <p className="text-gray-600">SIRET: {quote.clientSiret}</p>}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4 text-midnight-blue">Détails du devis</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Numéro</span>
              <span className="font-mono">{quote?.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Date</span>
              <span>{quote?.date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Montant</span>
              <span className="font-mono font-medium">{quote?.amount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Statut</span>
              {quote?.status && (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusVariant(quote.status).bg} ${getStatusVariant(quote.status).text} ${getStatusVariant(quote.status).border}`}>
                  {quote.status}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4 text-midnight-blue">Résumé financier</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Total HT</span>
              <span className="font-mono">{quote?.totalHT?.toLocaleString('fr-FR', { minimumFractionDigits: 2 }).replace('.', ',')} €</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">TVA ({quote?.tvaRate}%)</span>
              <span className="font-mono">{quote?.totalTVA?.toLocaleString('fr-FR', { minimumFractionDigits: 2 }).replace('.', ',')} €</span>
            </div>
            <div className="flex justify-between font-medium">
              <span className="text-gray-800">Total TTC</span>
              <span className="font-mono">{quote?.totalTTC?.toLocaleString('fr-FR', { minimumFractionDigits: 2 }).replace('.', ',')} €</span>
            </div>
          </div>
        </div>
      </div>

      {/* Description du projet */}
      {quote?.projectDescription && (
        <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
          <h2 className="text-lg font-semibold mb-4 text-midnight-blue">Description du projet</h2>
          <p className="text-gray-600 whitespace-pre-line">{quote.projectDescription}</p>
        </div>
      )}

      {/* Tableau des éléments */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-8">
        <h2 className="text-lg font-semibold p-6 border-b text-midnight-blue">Détail des prestations</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">DÉSIGNATION</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">QTÉ</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">UNITÉ</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">P.U. HT</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">TOTAL HT</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {quote?.items && quote.items.length > 0 ? (
                quote.items.map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-gray-50/50' : ''}>
                    <td className="py-3 px-4 text-sm">{item.description}</td>
                    <td className="py-3 px-4 text-sm text-center">{item.quantity}</td>
                    <td className="py-3 px-4 text-sm text-center">{item.unit}</td>
                    <td className="py-3 px-4 text-sm text-right font-mono">{item.unitPrice.toLocaleString('fr-FR', { minimumFractionDigits: 2 }).replace('.', ',')} €</td>
                    <td className="py-3 px-4 text-sm text-right font-mono">{item.totalHT.toLocaleString('fr-FR', { minimumFractionDigits: 2 }).replace('.', ',')} €</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-gray-500">
                    Aucun élément à afficher
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historique et activités - Pour une extension future */}
      <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
        <h2 className="text-lg font-semibold mb-4 text-midnight-blue">Historique</h2>
        <div className="border-l-2 border-gray-200 pl-4 space-y-4">
          <div className="relative">
            <div className="absolute -left-6 mt-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-white"></div>
            <div className="flex items-center text-sm">
              <span className="text-blue-600 font-medium">Création du devis</span>
              <span className="ml-auto text-gray-500 flex items-center"><Clock className="w-3 h-3 mr-1" /> {quote?.date}</span>
            </div>
            <p className="text-gray-600 text-sm mt-1">Devis créé par l'utilisateur.</p>
          </div>
          
          {quote?.status !== 'Brouillon' && (
            <div className="relative">
              <div className={`absolute -left-6 mt-1 w-4 h-4 rounded-full border-2 border-white ${quote?.status === 'Accepté' ? 'bg-green-500' : quote?.status === 'Refusé' ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
              <div className="flex items-center text-sm">
                <span className={`font-medium ${quote?.status === 'Accepté' ? 'text-green-600' : quote?.status === 'Refusé' ? 'text-red-600' : 'text-yellow-600'}`}>
                  Statut mis à jour: {quote?.status}
                </span>
                <span className="ml-auto text-gray-500 flex items-center"><Clock className="w-3 h-3 mr-1" /> {quote?.date}</span>
              </div>
              <p className="text-gray-600 text-sm mt-1">Le statut du devis a été changé.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from 'react';

// Cette directive indique à Next.js de toujours rendre cette page côté client
export const dynamic = "force-dynamic";
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Save, Trash2, Download, Send, Plus, 
  Loader2, FileText, AlignLeft, Calculator, Edit2,
  FileUp, FileSpreadsheet, MessageSquareText, ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { generateQuoteItems } from '@/lib/openai-service';
import { generateQuotePDF, downloadQuotePDF } from '@/lib/pdf-service';
import { SimplePdfImport } from '@/components/import/simple-pdf-import';
import { ExtractionResult } from '@/lib/pdf-parser';
import { Quote, QuoteItem } from '@/types/quote';

// Utiliser les types importés depuis @/types/quote

export default function QuoteEditor() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  // La variable creationMethod est déjà définie plus bas
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [aiError, setAiError] = useState<string | null>(null);
  const [quoteId, setQuoteId] = useState<string | null>(null);
  const [minMargin, setMinMargin] = useState<number>(0); // Nouveau champ pour la marge souhaitée
  
  // Génération de PDF
  const handleGeneratePDF = async () => {
    try {
      setIsGeneratingPDF(true);
      
      // Calculer les totaux finaux avant la génération du PDF
      const totalHT = quote.items.reduce((sum, item) => sum + item.totalHT, 0);
      const totalTVA = totalHT * (quote.tvaRate / 100);
      const totalTTC = totalHT * (1 + quote.tvaRate / 100);
      
      const updatedQuote = {
        ...quote,
        totalHT,
        totalTVA,
        totalTTC
      };
      
      // Générer le PDF
      const pdfOutput = await generateQuotePDF(updatedQuote);
      setPdfUrl(pdfOutput);
      
      // Télécharger le PDF
      downloadQuotePDF(updatedQuote, `devis-${updatedQuote.id}-${updatedQuote.clientName.replace(/\s+/g, '-')}.pdf`);
      
    } catch (error) {
      console.error("Erreur lors de la génération du PDF:", error);
      alert("Une erreur est survenue lors de la génération du PDF.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };
  
  // Fonction pour appliquer la marge aux prix et arrondir à l'euro
  const applyMarginToPrice = (costPrice: number, margin: number) => {
    if (!margin || margin <= 0) return Math.round(costPrice);
    // Formule: Prix de vente = Prix coûtant / (1 - marge/100)
    // Arrondir à l'euro le plus proche
    return Math.round(costPrice / (1 - margin/100));
  };
  
  // Fonction pour recalculer tous les prix avec la marge actuelle
  const recalculatePricesWithMargin = (items: any[], margin: number) => {
    return items.map(item => {
      // Stocker le prix coûtant dans une propriété séparée si ce n'est pas déjà fait
      if (!item.costPrice) {
        item.costPrice = item.unitPrice;
      }
      
      // Appliquer la marge au prix coûtant
      const newUnitPrice = applyMarginToPrice(item.costPrice, margin);
      
      return {
        ...item,
        unitPrice: newUnitPrice,
        totalHT: item.quantity * newUnitPrice
      };
    });
  };
  
  // Fonction pour traiter l'importation de données depuis un PDF (CCTP/DPGF)
  const handlePdfImport = (result: ExtractionResult) => {
    if (result.success && result.items.length > 0) {
      // Mettre à jour le titre du devis si disponible
      if (result.title) {
        setQuote(prev => ({
          ...prev,
          quoteTitle: result.title
        }));
      }
      
      // Mettre à jour les informations client si disponibles
      if (result.clientInfo) {
        setQuote(prev => ({
          ...prev,
          clientName: result.clientInfo?.name || prev.clientName,
          clientAddress: result.clientInfo?.address || prev.clientAddress,
          clientEmail: result.clientInfo?.email || prev.clientEmail,
          clientPhone: result.clientInfo?.phone || prev.clientPhone,
          clientSiret: result.clientInfo?.siret || prev.clientSiret
        }));
      }
      
      // Ajouter les éléments importés au devis
      // On génère de nouveaux IDs pour éviter les conflits
      const importedItems = result.items.map(item => ({
        ...item,
        id: Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9)
      }));
      
      setQuote(prev => ({
        ...prev,
        items: [...prev.items, ...importedItems]
      }));
      
      // Notification de succès
      // toast({
      //   title: "Import réussi",
      //   description: `${importedItems.length} élément(s) importé(s) avec succès.`,
      //   variant: "success"
      // });
    }
  };
  
  // Fonction pour générer des éléments de devis avec l'IA
  const handleGenerateItems = async () => {
    if (!prompt.trim()) return;
    
    try {
      setIsGenerating(true);
      setAiError(null);
      
      // Appel au service d'IA
      const result = await generateQuoteItems({
        projectDescription: prompt,
        clientType: quote.clientSiret ? 'professionnel' : 'particulier',
        clientName: quote.clientName,
        industryContext: 'bâtiment',
        tvaRate: quote.tvaRate || 20,
        projectName: quote.quoteTitle // Envoyer le titre actuel comme référence
      });
      
      // Formater les éléments pour respecter notre structure et stocker le prix coûtant
      const formattedItems = result.items.map(item => {
        const costPrice = item.unitPrice; // Stocker le prix coûtant original
        const unitPrice = applyMarginToPrice(costPrice, quote.minMargin || 0);
        
        return {
          ...item,
          id: Math.random().toString(36).substr(2, 9),
          costPrice: costPrice,
          unitPrice: unitPrice,
          totalHT: item.quantity * unitPrice
        };
      });
      
      // Mettre à jour la description du projet si elle est vide
      let updatedQuote = {...quote};
      if (!updatedQuote.projectDescription.trim() && result.suggestedDescription) {
        updatedQuote.projectDescription = result.suggestedDescription;
      }
      
      // Mettre à jour l'objet du devis avec celui généré par l'IA
      if (result.quoteTitle) {
        updatedQuote.quoteTitle = result.quoteTitle;
      }
      
      // Ajouter les nouveaux éléments au devis
      updatedQuote.items = [...updatedQuote.items, ...formattedItems];
      
      // Recalculer les totaux
      const totalHT = updatedQuote.items.reduce((sum, item) => sum + item.totalHT, 0);
      updatedQuote.totalHT = totalHT;
      updatedQuote.totalTVA = totalHT * (updatedQuote.tvaRate / 100);
      updatedQuote.totalTTC = totalHT * (1 + updatedQuote.tvaRate / 100);
      
      setQuote(updatedQuote);
      
      // Vider le prompt après génération réussie
      setPrompt('');
    } catch (error) {
      console.error('Erreur lors de la génération des éléments:', error);
      setAiError('Une erreur est survenue lors de la génération. Veuillez réessayer.');
    } finally {
      setIsGenerating(false);
    }
  };
  
  // État initial pour un nouveau devis
  const [quote, setQuote] = useState<Quote>({
    id: Math.floor(1000 + Math.random() * 9000).toString(),
    clientName: '',
    clientAddress: '',
    clientEmail: '',
    clientPhone: '',
    clientSiret: '',
    projectDescription: '',
    items: [],
    date: new Date().toLocaleDateString('fr-FR'),
    tvaRate: 20,
    totalHT: 0,
    totalTVA: 0,
    totalTTC: 0,
    status: 'Brouillon'
  });
  
  // Stocke la méthode de création choisie
  const [creationMethod, setCreationMethod] = useState<'ai' | 'pdf' | 'image' | 'manual' | 'edit' | 'text' | 'cctp' | null>('ai');

  // Récupérer le devis depuis localStorage ou le charger en mode édition
  useEffect(() => {
    // Vérifier si on vient de la page de création de devis
    const currentQuoteData = localStorage.getItem('currentQuoteData');
    if (currentQuoteData) {
      try {
        // Récupérer les données du client
        const clientData = JSON.parse(currentQuoteData);
        setQuote(clientData);
        setCreationMethod(clientData.creationMethod);
        
        // Définir un prompt par défaut selon la méthode choisie
        if (clientData.creationMethod === 'text') {
          setPrompt("Décrivez votre projet en détail. Plus vous donnerez d'informations, plus le devis sera précis.");
        }
        
        // Nettoyer le localStorage après utilisation
        localStorage.removeItem('currentQuoteData');
      } catch (error) {
        console.error("Erreur lors de la récupération des données du client:", error);
      }
    } else {
      // Sinon, vérifier si on est en mode édition d'un devis existant
      const id = searchParams.get('id');
      if (id) {
        setQuoteId(id);
        setIsLoading(true);
        
        // Récupérer les devis depuis localStorage
        try {
          const storedQuotes = localStorage.getItem('quotes');
          if (storedQuotes) {
            const quotes = JSON.parse(storedQuotes);
            const foundQuote = quotes.find((q: any) => q.id === id);
            
            if (foundQuote) {
              // Convertir le devis simple en devis complet
              const fullQuote: Quote = {
                id: foundQuote.id,
                clientName: foundQuote.client || foundQuote.clientName || '',
                clientAddress: foundQuote.clientAddress || '',
                clientEmail: foundQuote.clientEmail || '',
                clientPhone: foundQuote.clientPhone || '',
                clientSiret: foundQuote.clientSiret || '',
                projectDescription: foundQuote.projectDescription || '',
                items: foundQuote.items || [],
                date: foundQuote.date,
                tvaRate: foundQuote.tvaRate || 20,
                totalHT: foundQuote.totalHT || 0,
                totalTVA: foundQuote.totalTVA || 0,
                totalTTC: foundQuote.totalTTC || 0,
                status: foundQuote.status
              };
              setQuote(fullQuote);
              setCreationMethod('edit'); // Mode édition
            }
          }
        } catch (error) {
          console.error("Erreur lors de la récupération du devis:", error);
        } finally {
          setIsLoading(false);
        }
      }
    }
  }, [searchParams]);

  // Interface utilisateur de base
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2">Chargement du devis...</span>
      </div>
    );
  }

  return (
    <div className="container px-4 py-8 mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Link href="/quotes" className="text-gray-600 hover:text-primary">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-heading font-bold text-midnight-blue">
            {quoteId ? `Modifier le devis ${quoteId}` : 'Créer un nouveau devis'}
          </h1>
          <Button 
            variant="default" 
            size="sm"
            className="ml-4 bg-midnight-blue text-white hover:bg-midnight-blue/90 flex items-center gap-1"
            onClick={() => setCreationMethod('pdf')}
          >
            <FileUp className="w-4 h-4" />
            Importer CCTP/DPGF
          </Button>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => {
              // Calculer les totaux finaux
              const totalHT = quote.items.reduce((sum, item) => sum + item.totalHT, 0);
              const totalTVA = totalHT * (quote.tvaRate / 100);
              const totalTTC = totalHT + totalTVA;
              
              // Mise à jour de l'état du devis
              const updatedQuote = {
                ...quote,
                totalHT,
                totalTVA,
                totalTTC
              };
              
              // Récupérer les devis existants
              try {
                const storedQuotes = localStorage.getItem('quotes');
                let existingQuotes = storedQuotes ? JSON.parse(storedQuotes) : [];
                
                // Sauvegarder le devis complet 
                // (versions précédentes utilisaient une version simplifiée, 
                // mais nous voulons maintenant sauvegarder toutes les données)
                const completeQuote = {
                  // Données pour l'affichage dans la liste
                  id: updatedQuote.id,
                  client: updatedQuote.clientName,
                  amount: `${totalTTC.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace('.', ',')} €`,
                  date: updatedQuote.date || new Date().toLocaleDateString('fr-FR'),
                  status: updatedQuote.status || 'Brouillon',
                  
                  // Données complètes pour permettre l'édition future
                  clientName: updatedQuote.clientName,
                  clientAddress: updatedQuote.clientAddress,
                  clientEmail: updatedQuote.clientEmail,
                  clientPhone: updatedQuote.clientPhone,
                  clientSiret: updatedQuote.clientSiret,
                  projectDescription: updatedQuote.projectDescription,
                  items: updatedQuote.items,
                  tvaRate: updatedQuote.tvaRate,
                  totalHT,
                  totalTVA,
                  totalTTC,
                  creationMethod: creationMethod
                };
                
                // Si c'est une mise à jour, remplacer le devis existant
                if (quoteId) {
                  existingQuotes = existingQuotes.map((q: any) => 
                    q.id === quoteId ? completeQuote : q
                  );
                } else {
                  // Sinon, ajouter le nouveau devis
                  existingQuotes = [completeQuote, ...existingQuotes];
                }
                
                // Sauvegarder dans localStorage
                localStorage.setItem('quotes', JSON.stringify(existingQuotes));
                
                // Rediriger vers la liste des devis
                alert("Devis sauvegardé avec succès!");
                router.push('/quotes');
              } catch (error) {
                console.error("Erreur lors de la sauvegarde du devis:", error);
                alert("Une erreur est survenue lors de la sauvegarde du devis.");
              }
            }}
          >
            <Save className="w-4 h-4" />
            Enregistrer
          </Button>
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={handleGeneratePDF}
            disabled={isGeneratingPDF || quote.items.length === 0 || !quote.clientName}
          >
            {isGeneratingPDF ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Génération...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Télécharger PDF
              </>
            )}
          </Button>
          {pdfUrl && (
            <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="ml-2">
              <Button 
                variant="ghost" 
                size="sm"
                className="text-gray-500 flex items-center gap-1"
              >
                <ExternalLink className="w-3 h-3" />
                Aperçu
              </Button>
            </a>
          )}
        </div>
      </div>
      
      {/* Le dialogue d'import a été remplacé par un composant intégré directement dans l'interface */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informations client */}
        <div className="bg-white p-6 rounded-lg shadow-sm lg:col-span-1">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#FF6B35]" />
            Informations client
          </h2>
          
          <div className="space-y-4">
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-1" htmlFor="quoteTitle">
                Objet du devis
              </label>
              <input
                type="text"
                id="quoteTitle"
                name="quoteTitle"
                value={quote.quoteTitle || ''}
                onChange={(e) => setQuote({...quote, quoteTitle: e.target.value})}
                className="w-full p-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/50"
                placeholder="Objet du devis (généré automatiquement par l'IA)"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-1" htmlFor="clientName">
                Nom du client
              </label>
              <input
                type="text"
                id="clientName"
                name="clientName"
                value={quote.clientName || ''}
                onChange={(e) => setQuote({...quote, clientName: e.target.value})}
                className="w-full p-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/50"
                placeholder="Nom du client"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-600 mb-1" htmlFor="clientAddress">
                Adresse
              </label>
              <textarea
                id="clientAddress"
                name="clientAddress"
                value={quote.clientAddress || ''}
                onChange={(e) => setQuote({...quote, clientAddress: e.target.value})}
                className="w-full p-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/50"
                rows={3}
                placeholder="Ex: 25 rue des Artisans, 75011 Paris"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1" htmlFor="clientEmail">
                  Email
                </label>
                <input
                  type="email"
                  id="clientEmail"
                  name="clientEmail"
                  value={quote.clientEmail}
                  onChange={(e) => setQuote({...quote, clientEmail: e.target.value})}
                  className="w-full p-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/50"
                  placeholder="client@exemple.fr"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 mb-1" htmlFor="clientPhone">
                  Téléphone
                </label>
                <input
                  type="text"
                  id="clientPhone"
                  name="clientPhone"
                  value={quote.clientPhone}
                  onChange={(e) => setQuote({...quote, clientPhone: e.target.value})}
                  className="w-full p-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/50"
                  placeholder="01 23 45 67 89"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm text-gray-600 mb-1" htmlFor="clientSiret">
                SIRET
              </label>
              <input
                type="text"
                id="clientSiret"
                name="clientSiret"
                value={quote.clientSiret || ''}
                onChange={(e) => setQuote({...quote, clientSiret: e.target.value})}
                className="w-full p-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/50"
                placeholder="123 456 789 00012"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1" htmlFor="tvaRate">
                  Taux de TVA
                </label>
                <div className="flex">
                  <select
                    id="tvaRate"
                    value={quote.tvaRate}
                    onChange={(e) => setQuote({...quote, tvaRate: Number(e.target.value)})}
                    className="w-full p-2 border border-gray-200 rounded-l-md focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/50"
                  >
                    <option value="20">20%</option>
                    <option value="10">10%</option>
                    <option value="5.5">5.5%</option>
                    <option value="0">0% (export)</option>
                  </select>
                  <span className="bg-gray-100 border border-gray-200 border-l-0 rounded-r-md px-3 py-2">%</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 mb-1" htmlFor="minMargin">
                  Marge minimale
                </label>
                <div className="flex">
                  <input 
                    id="minMargin"
                    type="number" 
                    min="0"
                    max="100"
                    placeholder="20"
                    className="w-full p-2 border border-gray-200 rounded-l-md focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/50"
                    value={quote.minMargin || ''}
                    onChange={(e) => {
                      const newMargin = e.target.value ? parseFloat(e.target.value) : undefined;
                      
                      // Mettre à jour la marge
                      const updatedQuote = {...quote, minMargin: newMargin};
                      
                      // Recalculer tous les prix si des éléments existent
                      if (updatedQuote.items.length > 0 && newMargin !== undefined) {
                        updatedQuote.items = recalculatePricesWithMargin(updatedQuote.items, newMargin);
                      }
                      
                      setQuote(updatedQuote);
                    }}
                  />
                  <span className="bg-gray-100 border border-gray-200 border-l-0 rounded-r-md px-3 py-2">%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Génération par IA */}
        <div className="bg-white p-6 rounded-lg shadow-sm lg:col-span-2">
          {creationMethod === 'text' ? (
            <>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <AlignLeft className="w-5 h-5 text-[#FF6B35]" />
                Description du projet
              </h2>
              <div className="p-4 border border-gray-200 rounded-lg shadow-sm bg-gray-50">
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">
                    Décrivez votre projet en détail
                  </label>
                  <textarea 
                    rows={5}
                    placeholder="Décrivez ce dont vous avez besoin pour ce projet. Plus vous donnez de détails, plus le devis sera précis."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#FF6B35]/50"
                  />
                </div>
                {aiError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
                    {aiError}
                  </div>
                )}
                <div className="flex justify-end">
                  <Button 
                    onClick={handleGenerateItems} 
                    disabled={!prompt.trim() || isGenerating}
                    className="bg-[#FF6B35] hover:bg-[#FF6B35]/90"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Génération en cours...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Générer avec l'IA
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </>
          ) : creationMethod === 'pdf' ? (
            <>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileUp className="w-5 h-5 text-[#FF6B35]" />
                Import de CCTP / DPGF
              </h2>
              <div 
                className="p-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 text-center"
              >
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="font-medium text-gray-700 mb-2">Importer un CCTP ou DPGF</h3>
                <div className="mt-4">
                  <SimplePdfImport onImport={handlePdfImport} />
                </div>
              </div>
            </>
          ) : creationMethod === 'image' ? (
            <>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#FF6B35]" />
                OCR depuis une image
              </h2>
              <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="font-medium text-gray-700 mb-2">Déposez votre image ici</h3>
                <p className="text-sm text-gray-500 mb-4">ou</p>
                <Button variant="outline" className="mb-4">
                  Sélectionner une image
                </Button>
                <p className="text-xs text-gray-500">JPG, PNG - 5MB max</p>
              </div>
            </>
          ) : creationMethod === 'cctp' ? (
            <>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-[#FF6B35]" />
                Import CCTP/DPGF
              </h2>
              <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 text-center">
                <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="font-medium text-gray-700 mb-2">Déposez votre fichier CCTP ou DPGF</h3>
                <p className="text-sm text-gray-500 mb-4">ou</p>
                <Button variant="outline" className="mb-4">
                  Sélectionner un fichier
                </Button>
                <p className="text-xs text-gray-500">XLS, XLSX, PDF - 10MB max</p>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <AlignLeft className="w-5 h-5 text-[#FF6B35]" />
                Description du projet
              </h2>
              <div className="p-4 border border-gray-200 rounded-lg shadow-sm bg-gray-50">
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">
                    Décrivez votre projet en détail
                  </label>
                  <textarea 
                    rows={5}
                    placeholder="Décrivez ce dont vous avez besoin pour ce projet. Plus vous donnez de détails, plus le devis sera précis."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#FF6B35]/50"
                  />
                </div>
                {aiError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
                    {aiError}
                  </div>
                )}
                <div className="flex justify-end">
                  <Button 
                    onClick={handleGenerateItems} 
                    disabled={!prompt.trim() || isGenerating}
                    className="bg-[#FF6B35] hover:bg-[#FF6B35]/90"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Génération en cours...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Générer avec l'IA
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Lignes du devis */}
      <div className="mt-6 bg-white p-6 rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Calculator className="w-5 h-5 text-[#FF6B35]" />
            Lignes du devis
          </h2>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            onClick={() => {
              const newItem = {
                id: Date.now().toString(),
                description: '',
                quantity: 1,
                unit: 'u',
                unitPrice: 0,
                totalHT: 0
              };
              setQuote({...quote, items: [...quote.items, newItem]});
            }}
          >
            <Plus className="w-4 h-4" />
            Ajouter une ligne
          </Button>
        </div>
        
        {quote.items.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <p>Aucune ligne dans ce devis. Utilisez l'IA pour générer automatiquement un devis ou ajoutez manuellement des lignes.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="p-3 text-sm font-medium text-gray-600 border-b">Description</th>
                  <th className="p-3 text-sm font-medium text-gray-600 border-b text-center">Qté</th>
                  <th className="p-3 text-sm font-medium text-gray-600 border-b text-center">Unité</th>
                  <th className="p-3 text-sm font-medium text-gray-600 border-b text-right">PU HT</th>
                  <th className="p-3 text-sm font-medium text-gray-600 border-b text-right">Total HT</th>
                  <th className="p-3 text-sm font-medium text-gray-600 border-b"></th>
                </tr>
              </thead>
              <tbody>
                {quote.items.map((item, index) => (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-3" style={{ maxWidth: '300px' }}>
                      <textarea
                        rows={Math.min(3, Math.max(1, Math.ceil(item.description.length / 40)))}
                        value={item.description}
                        onChange={(e) => {
                          const newItems = [...quote.items];
                          newItems[index].description = e.target.value;
                          setQuote({...quote, items: newItems});
                        }}
                        className="w-full p-1 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#FF6B35]/50 resize-none"
                        style={{ minHeight: '32px' }}
                        placeholder="Description de l'élément"
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => {
                          const newItems = [...quote.items];
                          newItems[index].quantity = Number(e.target.value);
                          newItems[index].totalHT = newItems[index].quantity * newItems[index].unitPrice;
                          setQuote({...quote, items: newItems});
                        }}
                        className="w-full p-1 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#FF6B35]/50 text-center"
                      />
                    </td>
                    <td className="p-3">
                      <select
                        value={item.unit}
                        onChange={(e) => {
                          const newItems = [...quote.items];
                          newItems[index].unit = e.target.value;
                          setQuote({...quote, items: newItems});
                        }}
                        className="w-full p-1 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#FF6B35]/50 text-center"
                      >
                        <option value="u">u</option>
                        <option value="m">m</option>
                        <option value="m²">m²</option>
                        <option value="m³">m³</option>
                        <option value="h">h</option>
                        <option value="forfait">forfait</option>
                      </select>
                    </td>
                    <td className="p-3">
                      <input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => {
                          const newItems = [...quote.items];
                          // Mettre à jour le prix coûtant (sans arrondi)
                          const newCostPrice = Number(e.target.value) / (1 - (quote.minMargin || 0)/100);
                          newItems[index].costPrice = newCostPrice;
                          // Le prix unitaire est déjà arrondi car saisi par l'utilisateur
                          newItems[index].unitPrice = Math.round(Number(e.target.value));
                          newItems[index].totalHT = newItems[index].quantity * newItems[index].unitPrice;
                          setQuote({...quote, items: newItems});
                        }}
                        className="w-full p-1 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#FF6B35]/50 text-right"
                      />
                    </td>
                    <td className="p-3 text-right font-mono">
                      {item.totalHT.toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} €
                    </td>
                    <td className="p-3 text-right">
                      <button 
                        onClick={() => {
                          const newItems = quote.items.filter(i => i.id !== item.id);
                          setQuote({...quote, items: newItems});
                        }}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Récapitulatif */}
        {quote.items.length > 0 && (
          <div className="mt-6 flex justify-end">
            <div className="w-full max-w-xs">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total HT:</span>
                  <span className="font-mono">
                    {quote.items.reduce((sum, item) => sum + item.totalHT, 0).toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} €
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">TVA ({quote.tvaRate}%):</span>
                  <span className="font-mono">
                    {(quote.items.reduce((sum, item) => sum + item.totalHT, 0) * (quote.tvaRate / 100)).toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} €
                  </span>
                </div>
                <div className="flex justify-between font-bold border-t border-gray-200 pt-2">
                  <span>Total TTC:</span>
                  <span className="font-mono text-[#13293D]">
                    {(quote.items.reduce((sum, item) => sum + item.totalHT, 0) * (1 + quote.tvaRate / 100)).toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} €
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
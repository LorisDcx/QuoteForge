"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, AlertTriangle, MessageSquareText, FileUp, FileSpreadsheet } from 'lucide-react';

export default function NewQuotePage() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [quoteData, setQuoteData] = useState({
    companyName: '',
    companyAddress: '',
    companyPhone: '',
    companySiret: ''
  });

  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    
    // Identifier la propriété à mettre à jour en fonction de l'id du champ
    let propName = id;
    
    // Transformer les noms de champs en propriétés selon notre structure d'objet
    if (id === 'company-name') propName = 'companyName';
    else if (id === 'company-address') propName = 'companyAddress';
    else if (id === 'company-phone') propName = 'companyPhone';
    else if (id === 'company-siret') propName = 'companySiret';
    
    // Mettre à jour l'état
    setQuoteData(prev => ({
      ...prev,
      [propName]: value
    }));
  };

  const handleProceedToEditor = () => {
    // Vérifier que le nom de l'entreprise est renseigné
    if (!quoteData.companyName.trim()) {
      alert("Veuillez indiquer le nom de votre entreprise");
      return;
    }

    if (!selectedMethod) {
      alert("Veuillez sélectionner une méthode de création de devis");
      return;
    }

    setIsCreating(true);
    
    try {
      // Générer un identifiant unique
      const newId = String(Math.floor(1000 + Math.random() * 9000));
      
      // Préparer les données pour le stockage
      const newQuoteData = {
        id: newId,
        // Pas d'informations client ici, elles seront ajoutées dans l'éditeur
        clientName: '',
        clientEmail: '',
        clientAddress: '',
        clientPhone: '',
        clientSiret: '',
        tvaRate: 20, // Valeur par défaut, à ajuster dans l'éditeur
        // Informations d'entreprise
        companyName: quoteData.companyName,
        companyAddress: quoteData.companyAddress,
        companyPhone: quoteData.companyPhone,
        companySiret: quoteData.companySiret,
        projectDescription: '',
        creationMethod: selectedMethod,
        date: new Date().toLocaleDateString('fr-FR'),
        status: 'Brouillon',
        items: [],
        totalHT: 0,
        totalTVA: 0,
        totalTTC: 0
      };
      
      // Stocker temporairement pour l'éditeur
      localStorage.setItem('currentQuoteData', JSON.stringify(newQuoteData));
      
      // Rediriger vers l'éditeur de devis
      router.push('/quotes/editor');
    } catch (error) {
      console.error("Erreur lors de la préparation des données:", error);
      alert("Une erreur est survenue lors de la préparation du devis.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col py-8 px-4 md:px-8 bg-gray-50">
      <header className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-heading font-bold text-midnight-blue">Forger un nouveau devis</h1>
          <Link href="/quotes">
            <Button variant="secondary" className="flex items-center gap-2">
              <ArrowLeft size={18} />
              Retour
            </Button>
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Informations client */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Nouveau devis</h2>
          <div className="space-y-4">



            <h3 className="font-medium text-gray-800 mb-3">Informations de votre entreprise</h3>
            <div>
              <label className="block text-sm text-gray-600 mb-1" htmlFor="company-name">
                Nom de votre entreprise
              </label>
              <input
                type="text"
                id="company-name"
                className="w-full p-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/50"
                placeholder="Ex: Votre Entreprise BTP"
                value={quoteData.companyName}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1" htmlFor="company-address">
                Adresse
              </label>
              <input
                type="text"
                id="company-address"
                className="w-full p-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/50"
                placeholder="Ex: 123 rue du Bâtiment, 75000 Paris"
                value={quoteData.companyAddress}
                onChange={handleInputChange}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1" htmlFor="company-phone">
                  Téléphone
                </label>
                <input
                  type="tel"
                  id="company-phone"
                  className="w-full p-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/50"
                  placeholder="Ex: 01 23 45 67 89"
                  value={quoteData.companyPhone}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1" htmlFor="company-siret">
                  N° SIRET
                </label>
                <input
                  type="text"
                  id="company-siret"
                  className="w-full p-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/50"
                  placeholder="Ex: 123 456 789 00012"
                  value={quoteData.companySiret}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Méthode de création */}
        <div className="bg-white p-6 rounded-lg shadow-sm md:col-span-2">
          <h2 className="text-xl font-semibold mb-4">Comment souhaitez-vous créer votre devis ?</h2>
          <p className="text-sm text-gray-600 mb-6">
            Sélectionnez comment vous souhaitez créer votre devis. Vous pourrez saisir les détails à l'étape suivante.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Option 1: Rédaction libre */}
            <div 
              className={`p-4 border rounded-lg cursor-pointer transition-all ${selectedMethod === 'text' ? 'border-[#FF6B35] bg-orange-50 shadow-sm' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
              onClick={() => setSelectedMethod('text')}
            >
              <div className="flex gap-3 items-start">
                <div className="bg-[#FF6B35]/10 p-2 rounded-full">
                  <MessageSquareText className="h-6 w-6 text-[#FF6B35]" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Description textuelle</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Décrivez votre projet en détail et l'IA créera un devis adapté à vos besoins.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Option 2: À partir d'un PDF */}
            <div 
              className={`p-4 border rounded-lg cursor-pointer transition-all ${selectedMethod === 'pdf' ? 'border-[#FF6B35] bg-orange-50 shadow-sm' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
              onClick={() => setSelectedMethod('pdf')}
            >
              <div className="flex gap-3 items-start">
                <div className="bg-[#FF6B35]/10 p-2 rounded-full">
                  <FileUp className="h-6 w-6 text-[#FF6B35]" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Import PDF</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Importez un document existant (devis, cahier des charges) et nous l'analyserons.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Option 3: À partir d'une image */}
            <div 
              className={`p-4 border rounded-lg cursor-pointer transition-all ${selectedMethod === 'image' ? 'border-[#FF6B35] bg-orange-50 shadow-sm' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
              onClick={() => setSelectedMethod('image')}
            >
              <div className="flex gap-3 items-start">
                <div className="bg-[#FF6B35]/10 p-2 rounded-full">
                  <FileUp className="h-6 w-6 text-[#FF6B35]" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">OCR depuis image</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Prenez une photo d'un document et notre système OCR extraira les informations.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Option 4: CCTP/DPGF */}
            <div 
              className={`p-4 border rounded-lg cursor-pointer transition-all ${selectedMethod === 'cctp' ? 'border-[#FF6B35] bg-orange-50 shadow-sm' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
              onClick={() => setSelectedMethod('cctp')}
            >
              <div className="flex gap-3 items-start">
                <div className="bg-[#FF6B35]/10 p-2 rounded-full">
                  <FileSpreadsheet className="h-6 w-6 text-[#FF6B35]" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">CCTP/DPGF</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Importez un document CCTP ou DPGF pour une conversion en devis structuré.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 flex justify-end">
            <Button 
              variant="forge" 
              onClick={handleProceedToEditor}
              disabled={isCreating || !quoteData.companyName || !selectedMethod}
              className="px-4 py-2 flex items-center gap-2"
            >
              {isCreating ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Préparation en cours...
                </>
              ) : (
                'Continuer vers l\'éditeur'
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
        <div className="flex gap-3">
          <AlertTriangle className="text-amber-500 h-6 w-6 shrink-0 mt-1" />
          <div>
            <h3 className="font-medium text-amber-800">Conseil pro</h3>
            <p className="text-sm text-amber-700 mt-1">
              Pour un devis plus précis, mentionnez les quantités, dimensions et spécificités techniques. 
              Notre IA tiendra compte de ces détails pour calculer les prix et délais.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

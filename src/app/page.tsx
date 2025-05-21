"use client";

import Link from 'next/link';
import { FileText, Plus, Upload, FileStack, Clock, Eye, Download, MoreVertical, TrendingUp, Users, Edit, Trash, Mail } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';

type Quote = {
  id: string;
  client: string;
  amount: string;
  date: string;
  status: string;
  // Champs additionnels pour stocker les données complètes du devis
  clientName?: string;
  clientEmail?: string;
  clientAddress?: string;
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

// Données par défaut si localStorage est vide
const demoQuotes: Quote[] = [
  { id: '001', client: 'Dupont Construction', amount: '1.250,00 €', date: '18/05/2025', status: 'Accepté' },
  { id: '002', client: 'Maison Moderne', amount: '2.840,45 €', date: '19/05/2025', status: 'Envoyé' },
  { id: '003', client: 'Rénovation Express', amount: '750,30 €', date: '20/05/2025', status: 'Brouillon' },
  { id: '004', client: 'Bâtiments & Co', amount: '4.200,00 €', date: '15/05/2025', status: 'Accepté' },
  { id: '005', client: 'Électricité Pro', amount: '1.845,90 €', date: '10/05/2025', status: 'Refusé' },
];

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

const StatCard = ({ title, value, icon: Icon, trend }: { title: string; value: string; icon: React.ElementType; trend?: number }) => (
  <div className="card p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className="text-2xl font-semibold mt-1">{value}</p>
      </div>
      <div className="p-2 rounded-lg bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
    </div>
    {trend !== undefined && (
      <div className={`mt-2 text-sm ${trend >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
        {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% par rapport au mois dernier
      </div>
    )}
  </div>
);

const QuickActionCard = ({ title, description, icon: Icon, href, disabled = false }: { title: string; description: string; icon: React.ElementType; href?: string; disabled?: boolean }) => {
  const content = (
    <div className={`flex flex-col items-center justify-center p-6 h-full transition-all ${disabled ? 'opacity-60' : 'hover:bg-accent/5'}`}>
      <div className={`p-3 rounded-full mb-3 ${disabled ? 'bg-muted' : 'bg-primary/10 text-primary'}`}>
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="font-medium text-center">{title}</h3>
      <p className="text-sm text-muted-foreground text-center mt-1">{description}</p>
    </div>
  );

  if (disabled) {
    return (
      <div className="card border-dashed border-2 cursor-not-allowed">
        {content}
      </div>
    );
  }

  return (
    <Link href={href || '#'} className="card border-dashed border-2 hover:border-primary/50 transition-colors">
      {content}
    </Link>
  );
};

export default function Home() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Référence pour le menu déroulant
  const menuRef = useRef<HTMLDivElement>(null);

  // Gestionnaire de clic global pour fermer le menu déroulant quand on clique ailleurs
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fonction pour basculer le menu
  const toggleMenu = (id: string) => {
    setOpenMenuId(openMenuId === id ? null : id);
  };

  // Charger les devis depuis localStorage au chargement de la page
  useEffect(() => {
    const storedQuotes = localStorage.getItem('quotes');
    if (storedQuotes) {
      // Si des devis sont stockés, les afficher
      setQuotes(JSON.parse(storedQuotes));
    } else {
      // Sinon, utiliser les données de démonstration
      setQuotes(demoQuotes);
      localStorage.setItem('quotes', JSON.stringify(demoQuotes));
    }
  }, []);

  // Calcul des statistiques à partir des devis
  const totalAmount = quotes.reduce((sum, quote) => {
    // Extraire le montant numérique du format "1.250,00 €"
    const numericAmount = parseFloat(quote.amount.replace(/[^\d,]/g, '').replace(',', '.'));
    return sum + (isNaN(numericAmount) ? 0 : numericAmount);
  }, 0);

  const pendingQuotes = quotes.filter(q => 
    q.status === 'Brouillon' || q.status === 'Envoyé' || q.status === 'En attente'
  ).length;

  const acceptedQuotes = quotes.filter(q => q.status === 'Accepté').length;
  const conversionRate = quotes.length > 0 ? Math.round((acceptedQuotes / quotes.length) * 100) : 0;

  // Récupérer uniquement les 5 derniers devis
  const recentQuotes = [...quotes].slice(0, 5);

  return (
    <div className="container py-8 space-y-8">
      <header>
        <h1 className="text-3xl font-heading font-bold text-midnight-blue">Tableau de bord</h1>
        <p className="text-muted-foreground">Bienvenue sur votre espace de gestion de devis</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="TOTAL DEVIS CE MOIS" 
          value={`${totalAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace('.', ',')} €`}
          icon={FileText} 
          trend={12.5} 
        />
        <StatCard 
          title="TAUX DE CONVERSION" 
          value={`${conversionRate}%`} 
          icon={TrendingUp} 
          trend={8.2} 
        />
        <StatCard 
          title="DEVIS EN ATTENTE" 
          value={pendingQuotes.toString()} 
          icon={Clock} 
          trend={-5.3} 
        />
        <StatCard 
          title="CLIENTS" 
          value={quotes.length.toString()} 
          icon={Users} 
          trend={15.8} 
        />
      </div>

      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-heading font-semibold text-midnight-blue">Devis récents</h2>
            <p className="text-gray-600">Vos 5 derniers devis créés</p>
          </div>
          <Link 
            href="/quotes" 
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Voir tous les devis
          </Link>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">ID</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">CLIENT</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">MONTANT</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">DATE</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">STATUT</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recentQuotes.length > 0 ? (
                  recentQuotes.map((quote) => {
                    const status = getStatusVariant(quote.status);
                    return (
                      <tr key={quote.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 text-sm font-mono font-medium">{quote.id}</td>
                        <td className="py-3 px-4 text-sm font-medium">{quote.client}</td>
                        <td className="py-3 px-4 text-sm font-mono">{quote.amount}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{quote.date}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.text} ${status.border}`}>
                            {quote.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex justify-end space-x-1">
                            <Link href={`/quotes/${quote.id}`} className="p-1.5 text-gray-500 hover:text-gray-900 rounded-md hover:bg-gray-100 transition-colors" title="Voir le devis">
                              <Eye className="h-4 w-4" />
                            </Link>
                            <button className="p-1.5 text-gray-500 hover:text-gray-900 rounded-md hover:bg-gray-100 transition-colors" title="Télécharger le PDF">
                              <Download className="h-4 w-4" />
                            </button>
                            <div className="relative" ref={menuRef}>
                              <button 
                                className="p-1.5 text-gray-500 hover:text-gray-900 rounded-md hover:bg-gray-100 transition-colors" 
                                title="Plus d'options"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleMenu(quote.id);
                                }}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </button>
                              {openMenuId === quote.id && (
                                <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg overflow-hidden z-20 border border-gray-200">
                                  <div className="py-1">
                                    <Link 
                                      href={`/quotes/editor?id=${quote.id}`} 
                                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                      onClick={() => setOpenMenuId(null)}
                                    >
                                      <Edit className="h-4 w-4 mr-2" /> Éditer le devis
                                    </Link>
                                    <button className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                      <Mail className="h-4 w-4 mr-2" /> Envoyer par e-mail
                                    </button>
                                    <button className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100">
                                      <Trash className="h-4 w-4 mr-2" /> Supprimer
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-gray-500">
                      Aucun devis à afficher. Créez votre premier devis !
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-heading font-semibold text-midnight-blue">Actions rapides</h2>
        <div className="flex justify-center">
          <Link 
            href="/quotes/new" 
            className="text-center px-8 py-4 bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white rounded-lg shadow-sm transition-colors flex items-center gap-3 font-medium"
          >
            <Plus className="h-5 w-5" />
            Créer un nouveau devis
          </Link>
        </div>
      </section>
    </div>
  );
}

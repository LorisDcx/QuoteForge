// Service de génération de PDF pour les devis - Version simplifiée
import { jsPDF } from 'jspdf';
import { Quote, QuoteItem } from '@/types/quote';

// Couleurs de l'identité visuelle
const COLORS = {
  midnightBlue: '#13293D',
  forgeOrange: '#FF6B35',
  gray: '#718096',
  lightGray: '#E2E8F0',
};

// Fonction utilitaire pour formater les prix
function formatPrice(num: number): string {
  return num.toFixed(2).replace('.', ',') + ' €';
}

// Fonction pour ajouter l'en-tête à chaque page
function addHeader(doc: jsPDF, quote: Quote, pageNumber: number, totalPages: number) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  
  // Logo
  doc.setFillColor(COLORS.forgeOrange);
  doc.rect(margin, margin, 40, 15, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text('QuoteForge', margin + 10, margin + 10);
  
  // Titre et numéro de devis
  doc.setTextColor(COLORS.midnightBlue);
  doc.setFontSize(24);
  doc.text('DEVIS', pageWidth - margin, margin + 10, { align: 'right' });
  
  doc.setFontSize(10);
  doc.setTextColor(COLORS.gray);
  doc.text(`N° ${quote.id}`, pageWidth - margin, margin + 16, { align: 'right' });
  doc.text(`Date: ${quote.date || new Date().toLocaleDateString('fr-FR')}`, pageWidth - margin, margin + 22, { align: 'right' });
  
  // Numéro de page
  doc.setFontSize(8);
  doc.text(`Page ${pageNumber}/${totalPages}`, pageWidth - margin, margin + 28, { align: 'right' });
}

// Fonction pour ajouter le pied de page à chaque page
function addFooter(doc: jsPDF, isLastPage: boolean = false) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  // Réserver plus d'espace pour le footer (15mm au lieu de 10mm)
  const footerY = pageHeight - margin;
  
  doc.setDrawColor(COLORS.forgeOrange);
  doc.line(margin, footerY - 10, pageWidth - margin, footerY - 10);
  
  doc.setFontSize(8);
  doc.setTextColor(COLORS.gray);
  doc.text('Généré par QuoteForge - Solution de devis intelligent pour les professionnels', pageWidth / 2, footerY - 5, { align: 'center' });
}

// Fonction principale de génération de PDF
export async function generateQuotePDF(quote: Quote): Promise<string> {
  // Méthode simplifiée sans autoTable pour éviter les erreurs
  // Créer un nouveau document PDF au format A4
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20; // marge en mm
  
  // En-tête avec logo (simulé par un rectangle orange)
  doc.setFillColor(COLORS.forgeOrange);
  doc.rect(margin, margin, 40, 15, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text('QuoteForge', margin + 10, margin + 10);
  
  // Titre du document
  doc.setTextColor(COLORS.midnightBlue);
  doc.setFontSize(24);
  doc.text('DEVIS', pageWidth - margin, margin + 10, { align: 'right' });
  
  // Numéro et date du devis
  doc.setFontSize(10);
  doc.setTextColor(COLORS.gray);
  doc.text(`N° ${quote.id}`, pageWidth - margin, margin + 16, { align: 'right' });
  doc.text(`Date: ${quote.date || new Date().toLocaleDateString('fr-FR')}`, pageWidth - margin, margin + 22, { align: 'right' });
  
  // Informations client
  doc.setFontSize(12);
  doc.setTextColor(COLORS.midnightBlue);
  let yPos = margin + 35;
  doc.text('INFORMATIONS CLIENT', margin, yPos);
  
  yPos += 8;
  doc.setFontSize(10);
  doc.setTextColor(COLORS.gray);
  doc.text(`Client: ${quote.clientName}`, margin, yPos); yPos += 6;
  if (quote.clientEmail) { doc.text(`Email: ${quote.clientEmail}`, margin, yPos); yPos += 6; }
  if (quote.clientAddress) { doc.text(`Adresse: ${quote.clientAddress}`, margin, yPos); yPos += 6; }
  
  // Description du projet (simplifiée)
  yPos += 6;
  doc.setFontSize(12);
  doc.setTextColor(COLORS.midnightBlue);
  doc.text('OBJET DU DEVIS', margin, yPos);
  
  yPos += 8;
  doc.setFontSize(10);
  doc.setTextColor(COLORS.gray);
  
  // Utiliser l'objet du devis généré par l'IA s'il existe, sinon extraire un résumé de la description
  let projectSummary = quote.quoteTitle || '';
  
  // Si pas d'objet de devis, utiliser la description du projet
  if (!projectSummary) {
    projectSummary = quote.projectDescription || 'Pas de description fournie.';
    
    // Si la description est trop longue, la réduire à un résumé
    if (projectSummary.length > 100) {
      // Essayer de trouver la première phrase complète
      const firstSentenceMatch = projectSummary.match(/^.+?[.!?](?:\s|$)/); 
      if (firstSentenceMatch && firstSentenceMatch[0].length < 100) {
        projectSummary = firstSentenceMatch[0].trim();
      } else {
        // Si pas de phrase complète courte, prendre juste le début
        projectSummary = projectSummary.substring(0, 90) + '...';
      }
    }
  }
  
  // Formater le résumé pour qu'il tienne sur 1-2 lignes
  const splitDescription = doc.splitTextToSize(
    projectSummary,
    pageWidth - (margin * 2)
  );
  
  // Limiter à 2 lignes maximum
  const limitedDescription = splitDescription.slice(0, 2);
  if (splitDescription.length > 2) {
    // Ajouter des points de suspension à la fin de la deuxième ligne
    limitedDescription[1] = limitedDescription[1].replace(/(.{3})$/, '...');
  }
  
  doc.text(limitedDescription, margin, yPos);
  yPos += limitedDescription.length * 5 + 8;
  
  // Éléments du devis (sans utiliser autoTable)
  doc.setFontSize(12);
  doc.setTextColor(COLORS.midnightBlue);
  doc.text('DÉTAIL DU DEVIS', margin, yPos);
  yPos += 8;
  
  // En-tête du tableau simplifié
  doc.setFillColor(COLORS.midnightBlue);
  doc.rect(margin, yPos, pageWidth - (margin * 2), 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  
  // Colonnes d'en-tête avec largeurs ajustées
  const descriptionWidth = (pageWidth - (margin * 2)) * 0.45; // 45% pour la description
  const qteWidth = (pageWidth - (margin * 2)) * 0.10; // 10% pour la quantité
  const unitWidth = (pageWidth - (margin * 2)) * 0.10; // 10% pour l'unité
  const puWidth = (pageWidth - (margin * 2)) * 0.15; // 15% pour le prix unitaire
  const totalWidth = (pageWidth - (margin * 2)) * 0.20; // 20% pour le total
  
  doc.text('DÉSIGNATION', margin + 3, yPos + 5);
  doc.text('QTÉ', margin + descriptionWidth + 3, yPos + 5);
  doc.text('UNITÉ', margin + descriptionWidth + qteWidth + 3, yPos + 5);
  doc.text('P.U. HT', margin + descriptionWidth + qteWidth + unitWidth + 3, yPos + 5);
  doc.text('TOTAL HT', margin + descriptionWidth + qteWidth + unitWidth + puWidth + 3, yPos + 5);
  
  yPos += 8;
  
  // Définir la hauteur maximale disponible pour les éléments du devis sur cette page
  // Réserver de l'espace pour les totaux et signatures
  const maxTableHeight = pageHeight - yPos - 120;
  const baseRowHeight = 7;
  const maxDescriptionLength = 60; // Nombre maximum de caractères par ligne
  
  // Lignes du tableau avec gestion des sauts de page
  doc.setTextColor(COLORS.gray);
  let currentPage = 1;
  
  // Calcul préliminaire du nombre de pages (sera ajusté à la fin)
  // On estime d'abord sans afficher
  let estimatedPages = Math.ceil((quote.items.length * baseRowHeight) / maxTableHeight);
  if (estimatedPages === 0) estimatedPages = 1; // Au moins une page même si pas d'items
  
  // Réserver de l'espace pour signatures et totaux - si ça dépasse la page, +1
  const spaceNeededForExtras = 100; // Espace pour signatures et totaux
  const lastPageAvailableSpace = maxTableHeight - ((estimatedPages > 0 ? quote.items.length % Math.floor(maxTableHeight / baseRowHeight) : 0) * baseRowHeight);
  let totalPages = estimatedPages + (lastPageAvailableSpace < spaceNeededForExtras ? 1 : 0);
  
  // On réserve une variable pour ajuster le nombre réel à la fin
  let actualTotalPages = totalPages;
  
  // Ajouter l'en-tête de la première page (avec estimation initiale)
  addHeader(doc, quote, currentPage, totalPages);
  
  // Variables pour suivre l'état entre les pages
  let itemIndex = 0;
  let remainingItems = quote.items.length;
  
  while (remainingItems > 0) {
    // Calculer combien d'items peuvent tenir sur cette page
    const availableHeight = pageHeight - yPos - (currentPage === totalPages - 1 ? 120 : 40); // Réserver plus d'espace sur la dernière page
    const itemsPerPage = Math.floor(availableHeight / baseRowHeight);
    const itemsOnThisPage = Math.min(itemsPerPage, remainingItems);
    
    // Afficher les items de cette page
    for (let i = 0; i < itemsOnThisPage; i++) {
      const item = quote.items[itemIndex];
      const evenRow = itemIndex % 2 === 0;
      
      // Fond alterné pour une meilleure lisibilité
      // Note: Cette partie est déplacée plus bas dans le code pour utiliser currentRowHeight
      
      // Gérer les descriptions longues avec retour à la ligne
      const description = item.description;
      
      // Calculer la hauteur de la ligne en fonction de la longueur du texte
      const linesNeeded = Math.ceil(description.length / maxDescriptionLength);
      const currentRowHeight = Math.max(baseRowHeight, baseRowHeight * linesNeeded);
      
      // Fond alterné pour une meilleure lisibilité avec hauteur adaptée
      if (evenRow) {
        doc.setFillColor(245, 247, 250);
        doc.rect(margin, yPos, pageWidth - (margin * 2), currentRowHeight, 'F');
      }
      
      // Découper la description en lignes si nécessaire
      if (description.length <= maxDescriptionLength) {
        // Description courte sur une seule ligne
        doc.text(description, margin + 3, yPos + 5);
      } else {
        // Description longue sur plusieurs lignes
        const words = description.split(' ');
        let currentLine = '';
        let lineCount = 0;
        
        for (let i = 0; i < words.length; i++) {
          const word = words[i];
          const testLine = currentLine + (currentLine ? ' ' : '') + word;
          
          if (testLine.length <= maxDescriptionLength) {
            currentLine = testLine;
          } else {
            // Afficher la ligne actuelle et passer à la suivante
            doc.text(currentLine, margin + 3, yPos + 5 + (lineCount * baseRowHeight));
            currentLine = word;
            lineCount++;
          }
        }
        
        // Afficher la dernière ligne
        if (currentLine) {
          doc.text(currentLine, margin + 3, yPos + 5 + (lineCount * baseRowHeight));
        }
      }
      
      // Positionner les autres colonnes au milieu de la cellule
      const verticalCenter = yPos + (currentRowHeight / 2);
      doc.text(item.quantity.toString(), margin + descriptionWidth + 3, verticalCenter);
      doc.text(item.unit, margin + descriptionWidth + qteWidth + 3, verticalCenter);
      
      // Utiliser la fonction globale formatPrice définie en haut du fichier
      const prixUnitaireFormate = item.unitPrice.toFixed(2).replace('.', ',') + ' €';
      const prixTotalFormate = item.totalHT.toFixed(2).replace('.', ',') + ' €';
      
      doc.text(
        prixUnitaireFormate, 
        margin + descriptionWidth + qteWidth + unitWidth + puWidth - 3, 
        verticalCenter, 
        { align: 'right' }
      );
      doc.text(
        prixTotalFormate, 
        margin + descriptionWidth + qteWidth + unitWidth + puWidth + totalWidth - 3, 
        verticalCenter, 
        { align: 'right' }
      );
      
      yPos += currentRowHeight;
      itemIndex++;
    }
    
    remainingItems -= itemsOnThisPage;
    
    // Ajouter le pied de page
    addFooter(doc, remainingItems === 0);
    
    // S'il reste des éléments, ajouter une nouvelle page
    if (remainingItems > 0) {
      doc.addPage();
      currentPage++;
      yPos = 60; // En-tête + espace
      
      // Ajouter l'en-tête de la nouvelle page
      addHeader(doc, quote, currentPage, totalPages);
      
      // Répéter l'en-tête du tableau
      doc.setFillColor(COLORS.midnightBlue);
      doc.rect(margin, yPos, pageWidth - (margin * 2), 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      
      // Colonnes d'en-tête
      doc.text('DÉSIGNATION', margin + 3, yPos + 5);
      doc.text('QTÉ', margin + descriptionWidth + 3, yPos + 5);
      doc.text('UNITÉ', margin + descriptionWidth + qteWidth + 3, yPos + 5);
      doc.text('P.U. HT', margin + descriptionWidth + qteWidth + unitWidth + 3, yPos + 5);
      doc.text('TOTAL HT', margin + descriptionWidth + qteWidth + unitWidth + puWidth + 3, yPos + 5);
      
      yPos += 8;
      doc.setTextColor(COLORS.gray);
    }
  }
  
  // Totaux
  yPos += 10;
  const totalHT = quote.items.reduce((sum, item) => sum + item.totalHT, 0);
  const totalTVA = totalHT * (quote.tvaRate / 100);
  const totalTTC = totalHT + totalTVA;
  
  // Bordure pour les totaux
  doc.setDrawColor(COLORS.lightGray);
  doc.setLineWidth(0.5);
  
  const totalsWidth = 80;
  const totalsX = pageWidth - margin - totalsWidth;
  doc.setFillColor(COLORS.lightGray);
  doc.rect(totalsX, yPos, totalsWidth, 25, 'F');
  
  // Afficher les totaux
  doc.setTextColor(COLORS.gray);
  doc.text('Total HT:', totalsX + 5, yPos + 7);
  doc.text('TVA (' + quote.tvaRate + '%):', totalsX + 5, yPos + 15);
  doc.setTextColor(COLORS.midnightBlue);
  doc.setFontSize(11);
  doc.text('TOTAL TTC:', totalsX + 5, yPos + 23);
  
  // Valeurs des totaux alignées à droite avec format personnalisé
  const formatPrice = (num: number) => {
    return num.toFixed(2).replace('.', ',') + ' €';
  };
  
  doc.setTextColor(COLORS.gray);
  doc.setFontSize(10);
  doc.text(formatPrice(totalHT), totalsX + totalsWidth - 5, yPos + 7, { align: 'right' });
  doc.text(formatPrice(totalTVA), totalsX + totalsWidth - 5, yPos + 15, { align: 'right' });
  doc.setTextColor(COLORS.midnightBlue);
  doc.setFontSize(11);
  doc.text(formatPrice(totalTTC), totalsX + totalsWidth - 5, yPos + 23, { align: 'right' });
  
  // Ajouter un bandeau pour les signatures avec plus d'espace
  yPos += 40;
  
  // S'assurer que les signatures ne seront pas trop proches du bas de page
  const minSpaceNeededForSignatures = 80; // 80mm pour les signatures + espace pour le footer
  if (pageHeight - yPos < minSpaceNeededForSignatures) {
    doc.addPage();
    currentPage++;
    actualTotalPages = Math.max(currentPage, actualTotalPages);
    addHeader(doc, quote, currentPage, actualTotalPages);
    yPos = 100; // Début après l'en-tête
  }
  
  // Vérifier s'il reste assez d'espace pour les signatures + footer (au moins 100mm), sinon ajouter une nouvelle page
  if (yPos > pageHeight - 100) {
    doc.addPage();
    currentPage++;
    actualTotalPages = Math.max(currentPage, actualTotalPages);
    addHeader(doc, quote, currentPage, actualTotalPages);
    yPos = 100; // Début après l'en-tête
  }
  
  // Titre pour les signatures
  doc.setFontSize(12);
  doc.setTextColor(COLORS.midnightBlue);
  doc.text('SIGNATURES ET VALIDATION', margin, yPos);
  yPos += 10;
  
  // Créer deux zones pour les signatures
  const signatureWidth = (pageWidth - (margin * 3)) / 2;
  
  // Zone émetteur
  doc.setDrawColor(COLORS.lightGray);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, yPos, signatureWidth, 60, 3, 3, 'S');
  
  // Vérifier que nous ne sommes pas trop proches du footer
  const footerPosition = pageHeight - 30; // Position du footer
  if (yPos + 70 > footerPosition) {
    // Ajuster la position du footer si nécessaire
    yPos = footerPosition - 75;
  }
  
  doc.setFontSize(10);
  doc.setTextColor(COLORS.midnightBlue);
  doc.text('SIGNATURE DE L\'\u00c9METTEUR', margin + (signatureWidth / 2), yPos + 10, { align: 'center' });
  
  doc.setFontSize(8);
  doc.setTextColor(COLORS.gray);
  doc.text('Bon pour accord', margin + (signatureWidth / 2), yPos + 20, { align: 'center' });
  
  // Zone destinataire
  doc.roundedRect(margin * 2 + signatureWidth, yPos, signatureWidth, 60, 3, 3, 'S');
  
  doc.setFontSize(10);
  doc.setTextColor(COLORS.midnightBlue);
  doc.text('SIGNATURE DU DESTINATAIRE', margin * 2 + signatureWidth + (signatureWidth / 2), yPos + 10, { align: 'center' });
  
  doc.setFontSize(8);
  doc.setTextColor(COLORS.gray);
  doc.text('Bon pour acceptation du devis', margin * 2 + signatureWidth + (signatureWidth / 2), yPos + 20, { align: 'center' });
  
  // Mettre à jour toutes les en-têtes avec le nombre total correct de pages
  // Cette approche n'est pas la plus efficace mais fonctionne pour un petit nombre de pages
  if (actualTotalPages !== totalPages) {
    for (let i = 0; i < actualTotalPages; i++) {
      // Aller à la page i
      doc.setPage(i);
      
      // Effacer la zone où se trouve le numéro de page
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      doc.setFillColor(255, 255, 255);
      doc.rect(pageWidth - margin - 40, margin + 20, 40, 10, 'F');
      
      // Réécrire le numéro de page correct
      doc.setFontSize(8);
      doc.setTextColor(COLORS.gray);
      doc.text(`Page ${i + 1}/${actualTotalPages}`, pageWidth - margin, margin + 28, { align: 'right' });
    }
  }
  
  // Ajouter le pied de page de la dernière page
  addFooter(doc, true);
  
  // Sauvegarder le PDF et retourner l'URL de données
  const pdfOutput = doc.output('datauristring');
  return pdfOutput;
}

export async function downloadQuotePDF(quote: Quote, filename?: string): Promise<void> {
  try {
    // Calculer les totaux finaux avant la génération du PDF
    const totalHT = quote.items.reduce((sum, item) => sum + item.totalHT, 0);
    const totalTVA = totalHT * (quote.tvaRate / 100);
    const totalTTC = totalHT + totalTVA;
    
    const updatedQuote = {
      ...quote,
      totalHT,
      totalTVA,
      totalTTC,
      date: quote.date || new Date().toLocaleDateString('fr-FR')
    };
    
    // Générer le PDF avec la méthode simplifiée
    const pdfData = await generateQuotePDF(updatedQuote);
    
    // Déterminer le nom de fichier
    const actualFilename = filename || `devis-${updatedQuote.id}-${updatedQuote.clientName.replace(/\s+/g, '-')}.pdf`;
    
    // Créer un lien de téléchargement
    const link = document.createElement('a');
    link.href = pdfData;
    link.download = actualFilename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
  } catch (error) {
    console.error("Erreur lors du téléchargement du PDF:", error);
    throw error;
  }
}

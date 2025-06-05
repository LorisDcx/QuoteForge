// Ce fichier indique à Next.js de ne pas générer de paramètres statiques pour cette route
// Cela signifie que la page sera rendue dynamiquement à chaque requête

export async function generateStaticParams() {
  // Retourner un tableau vide signifie qu'aucun paramètre statique n'est généré
  // La page sera donc rendue dynamiquement
  return [];
}

// Configuration pour désactiver le prérendu statique de cette page
// Cette configuration est utilisée par Next.js lors de la phase de build

// Forcer le mode dynamique (pas de prérendu statique)
export const dynamic = 'force-dynamic'

// Désactiver la revalidation
export const revalidate = false

// Désactiver le cache de fetch
export const fetchCache = 'force-no-store'

// Utiliser Node.js comme environnement d'exécution
export const runtime = 'nodejs'

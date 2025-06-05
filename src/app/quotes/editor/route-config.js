// Configuration de route pour /quotes/editor
// Cette configuration désactive le prérendu statique pour cette page

export const dynamic = 'force-dynamic'
export const revalidate = false
export const fetchCache = 'force-no-store'
export const runtime = 'nodejs'
export const preferredRegion = 'auto'

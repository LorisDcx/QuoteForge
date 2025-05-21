import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string) {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return format(dateObj, "dd/MM/yyyy", { locale: fr });
}

export function formatPrice(price: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(price);
}

export function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case "accepté":
    case "accepte":
    case "payé":
    case "paye":
      return "bg-green-100 text-green-800 border-green-300";
    case "refusé":
    case "refuse":
    case "annulé":
    case "annule":
      return "bg-red-100 text-red-800 border-red-300";
    case "envoyé":
    case "envoye":
      return "bg-blue-100 text-blue-800 border-blue-300";
    case "en attente":
    case "brouillon":
      return "bg-amber-100 text-amber-800 border-amber-300";
    default:
      return "bg-gray-100 text-gray-800 border-gray-300";
  }
}

import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

/**
 * Safely parse a date string from the database
 * The database returns dates in format: '2025-03-15 20:00:00'
 */
export function parseDatabaseDate(dateString: string | Date): Date {
  if (dateString instanceof Date) {
    return dateString;
  }
  
  if (!dateString) {
    throw new Error("Invalid date string");
  }
  
  // Try to parse as ISO string first
  try {
    return parseISO(dateString);
  } catch {
    // If that fails, try to parse as a regular date string
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date format: ${dateString}`);
    }
    return date;
  }
}

/**
 * Format a date for display in Spanish
 */
export function formatDate(date: string | Date, formatString: string = "d MMMM yyyy"): string {
  try {
    const parsedDate = parseDatabaseDate(date);
    return format(parsedDate, formatString, { locale: es });
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Fecha no disponible";
  }
}

/**
 * Format a time for display
 */
export function formatTime(date: string | Date): string {
  try {
    const parsedDate = parseDatabaseDate(date);
    return format(parsedDate, "HH:mm'h'");
  } catch (error) {
    console.error("Error formatting time:", error);
    return "Hora no disponible";
  }
} 
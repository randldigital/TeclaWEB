import { useEffect, useState } from "react";

// Configuration - Easy to modify dates
const CHRISTMAS_START_MONTH = 10; // November (0-indexed) - Start from November 24th
const CHRISTMAS_START_DAY = 24;
const CHRISTMAS_END_MONTH = 0; // January (0-indexed)
const CHRISTMAS_END_DAY = 6;

// Set to false to completely disable Christmas theme
export const CHRISTMAS_THEME_ENABLED = true;

// Set to false to disable visual effects (snow, lights) but keep colors
export const CHRISTMAS_EFFECTS_ENABLED = true;

export function useChristmasTheme() {
  const [isChristmas, setIsChristmas] = useState(false);

  useEffect(() => {
    if (!CHRISTMAS_THEME_ENABLED) {
      setIsChristmas(false);
      return;
    }

    const checkChristmasSeason = () => {
      const now = new Date();
      const month = now.getMonth();
      const day = now.getDate();

      // Activate from November 24th until January 6th
      const isInSeason =
        (month === CHRISTMAS_START_MONTH && day >= CHRISTMAS_START_DAY) || // November 24th onwards
        month === 11 || // All of December (month 11)
        (month === CHRISTMAS_END_MONTH && day <= CHRISTMAS_END_DAY); // January 1-6

      setIsChristmas(isInSeason);
      
      // Apply/remove class to document element
      if (isInSeason) {
        document.documentElement.classList.add("christmas-theme");
      } else {
        document.documentElement.classList.remove("christmas-theme");
      }
    };

    checkChristmasSeason();
    
    // Check daily (in case the page is open for multiple days)
    const interval = setInterval(checkChristmasSeason, 1000 * 60 * 60); // Check every hour
    
    return () => {
      clearInterval(interval);
      document.documentElement.classList.remove("christmas-theme");
    };
  }, []);

  return { isChristmas, effectsEnabled: CHRISTMAS_EFFECTS_ENABLED };
}

// Manual toggle function (for admin panel)
export function toggleChristmasTheme(force?: boolean) {
  if (!CHRISTMAS_THEME_ENABLED) return;
  
  const html = document.documentElement;
  if (force !== undefined) {
    if (force) {
      html.classList.add("christmas-theme");
    } else {
      html.classList.remove("christmas-theme");
    }
  } else {
    html.classList.toggle("christmas-theme");
  }
  
  // Save preference to localStorage
  localStorage.setItem("christmas-theme-manual", force !== undefined ? String(force) : "toggle");
}


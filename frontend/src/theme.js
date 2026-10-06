// index.html reads the same key before the first paint.
const THEME_KEY = 'gym_theme'

// Light unless dark was picked under Settings → Appearance.
export const getTheme = () => (localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light')

export function setTheme(theme) {
  localStorage.setItem(THEME_KEY, theme)
  document.documentElement.dataset.theme = theme
}

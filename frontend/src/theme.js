// index.html reads the same key, and sets the same bar colours, before the first paint.
const THEME_KEY = 'gym_theme'
// The phone browser's own bar, matched to the top of the page.
const BAR = { light: '#ffffff', dark: '#141d30' }

// Light unless dark was picked under Settings → Appearance.
export const getTheme = () => (localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light')

export function setTheme(theme) {
  localStorage.setItem(THEME_KEY, theme)
  document.documentElement.dataset.theme = theme
  document.querySelector('meta[name="theme-color"]').content = BAR[theme]
}

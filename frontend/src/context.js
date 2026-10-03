import { createContext, useContext } from 'react'

// { today, settings, plans, expenseCategories, modes, reloadApp, openAdd, logout }
export const AppContext = createContext(null)

export const useApp = () => useContext(AppContext)

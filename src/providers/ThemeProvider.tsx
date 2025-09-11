"use client"
import { ReactNode, useEffect } from 'react'
import { useThemeStore } from '@/stores/themeStore'

// Creamos un contexto de tema para toda la aplicación
interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  // Obtenemos el tema actual del store
  const theme = useThemeStore(state => state.theme)
  
  // Este efecto se ejecuta cada vez que cambia el tema
  useEffect(() => {
    // Actualizamos la clase 'dark' en el elemento <html> según el tema actual
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    
    // También podemos establecer un atributo data-theme para usar en CSS (opcional)
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])
  
  // Simplemente renderizamos los hijos sin wrapper adicional
  return <>{children}</>
}

// Hook personalizado para acceder al tema actual desde cualquier componente
export const useTheme = () => {
  // Extraemos el tema del store
  const theme = useThemeStore(state => state.theme)
  
  // Retornamos un objeto con propiedades útiles
  return {
    theme,
    isDark: theme === 'dark',
    isLight: theme === 'light'
  }
}
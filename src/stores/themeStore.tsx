import {create} from 'zustand'
import {persist} from 'zustand/middleware'

type ThemeMode = 'light' | 'dark'

interface ThemeState {
    theme: ThemeMode;
    setTheme: (theme: ThemeMode) => void;
    toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set) => ({

            // default theme
            theme: 'light',

            setTheme: (theme) => set({theme}),

            toggleTheme: () => set((state) => ({
                theme: state.theme === 'dark' ? 'light' : 'dark'
            }))

        }),

        {
            name: 'theme-preferences'
        }
    )
)

/**
 * Vue app entry point for the Fractal Visualizer web application.
 * This file is separate from index.ts which exports the terminal DebugVisualizer.
 */
import { createApp } from 'vue'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'

import App from './App.vue'

const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'dark',
    themes: {
      dark: {
        colors: {
          primary: '#2196F3',
          secondary: '#424242',
          accent: '#FF9800',
          error: '#F44336',
          warning: '#FF9800',
          info: '#2196F3',
          success: '#4CAF50',
        },
      },
      light: {
        colors: {
          primary: '#1976D2',
          secondary: '#424242',
          accent: '#FF9800',
          error: '#F44336',
          warning: '#FF9800',
          info: '#2196F3',
          success: '#4CAF50',
        },
      },
    },
  },
})

const app = createApp(App)
app.use(vuetify)
app.mount('#app')

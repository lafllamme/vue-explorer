import { defineConfig, presetWind3, transformerDirectives, transformerVariantGroup } from 'unocss'
import { theme, shortcuts } from './app/assets/unocss'

export default defineConfig({
  presets: [presetWind3()],
  theme,
  shortcuts,
  transformers: [transformerDirectives(), transformerVariantGroup()],
})

import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Lumen',
  description: 'Your data, instantly.',
  lang: 'en-US',
  appearance: 'dark',
  base: './',

  head: [
    ['link', { rel: 'icon', href: '/icon.svg' }],
    ['meta', { name: 'theme-color', content: '#0a0a0a' }],
  ],

  themeConfig: {
    logo: '/icon.svg',
    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'Dashboard', link: '../' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Guide',
          items: [
            { text: 'Getting Started', link: '/guide/getting-started' },
            { text: 'Charts', link: '/guide/charts' },
            { text: 'Themes', link: '/guide/themes' },
            { text: 'Folder Mode', link: '/guide/folder-mode' },
            { text: 'Search', link: '/guide/search' },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com' },
    ],

    footer: {
      message: 'Released under the MIT License.',
    },

    search: {
      provider: 'local',
    },
  },

  vite: {
    publicDir: 'public',
  },
})

// @ts-check
const { defineConfig, devices } = require('@playwright/test');
require('dotenv').config();

module.exports = defineConfig({
  testDir: './tests',
  // Plataforma real: poucas execuções e sem paralelismo, para evitar bloqueio de conta
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 30_000,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.BASE_URL || 'https://iterasys.learnworlds.com',
    // Trace e vídeo desligados: podem registrar o que foi digitado e cookies da sessão
    trace: 'off',
    video: 'off',
    screenshot: 'only-on-failure',
    locale: 'pt-BR',
  },
  // Cada projeto repete todos os testes em um navegador. Como é a plataforma real,
  // use --project=<nome> para rodar só um (os scripts do package.json já fazem isso).
  projects: [
    // Emulação mobile: Android no Chromium, iPhone no WebKit.
    // O Firefox fica de fora porque o Playwright não emula mobile nele.
    { name: 'android', use: { ...devices['Pixel 7'] } },
    { name: 'iphone', use: { ...devices['iPhone 14'] } },
  ],
});
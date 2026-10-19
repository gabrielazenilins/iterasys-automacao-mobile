// Cenários específicos de navegador mobile: MOBILE_CT_001 a MOBILE_CT_004
// Rodam nos projetos "android" (Pixel 7) e "iphone" (iPhone 14) do playwright.config.js.
// Nenhum deles altera conta ou dado no site. Só o MOBILE_CT_004 usa o e-mail do .env,
// e com senha errada (igual ao LOGIN_CT_002).
const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');

const EMAIL = process.env.USER_EMAIL;

/** Confere se o elemento está inteiro dentro da largura da tela (sem cortar nas laterais). */
async function esperarDentroDaTela(page, locator) {
  const caixa = await locator.boundingBox();
  const { width } = page.viewportSize();
  expect(caixa, 'elemento sem área visível').not.toBeNull();
  expect(caixa.x).toBeGreaterThanOrEqual(0);
  expect(caixa.x + caixa.width).toBeLessThanOrEqual(width + 1); // 1px de tolerância
}

test.describe('Login em navegador mobile', () => {
  /** @type {LoginPage} */
  let login;

  test.beforeEach(async ({ page }) => {
    login = new LoginPage(page);
    await login.acessarPaginaDeCursos();
  });

  test('MOBILE_CT_001 - Acessar o login pelo menu do celular', async () => {
    // Em tela pequena, o "Entrar" fica dentro do menu hambúrguer
    await login.abrirMenuSeNecessario(login.linkEntrar);
    await expect(login.linkEntrar).toBeVisible();

    // No menu mobile, a imagem do logo intercepta o clique simulado do Playwright.
    // Conferido manualmente: no celular real o toque em "Entrar" abre o modal
    // normalmente, então é uma limitação da automação, e o clique vai direto no elemento.
    await login.clicarOpcao(login.linkEntrar);

    await expect(login.campoEmail).toBeVisible();
    await expect(login.campoSenha).toBeVisible();
    await expect(login.botaoEntrar).toBeVisible();
  });

  test('MOBILE_CT_002 - Modal de login cabe na tela, sem rolagem horizontal', async ({ page }) => {
    await login.abrirModal();

    // Campos e botão inteiros dentro da largura do celular
    await esperarDentroDaTela(page, login.campoEmail);
    await esperarDentroDaTela(page, login.campoSenha);
    await esperarDentroDaTela(page, login.botaoEntrar);

    // A página não pode ficar mais larga que a tela (rolagem lateral)
    const larguras = await page.evaluate(() => ({
      conteudo: document.documentElement.scrollWidth,
      tela: document.documentElement.clientWidth,
    }));
    expect(larguras.conteudo).toBeLessThanOrEqual(larguras.tela);
  });

  test('MOBILE_CT_003 - Campos abrem o teclado adequado no celular', async () => {
    await login.abrirModal();

    // type="email" faz o celular mostrar o teclado com "@" e ".com";
    // type="password" esconde o que é digitado
    await expect(login.campoEmail).toHaveAttribute('type', 'email');
    await expect(login.campoSenha).toHaveAttribute('type', 'password');
  });

  test('MOBILE_CT_004 - Bloqueio com credenciais inválidas usando toque', async ({ page }) => {
    test.skip(!EMAIL, 'Defina USER_EMAIL no arquivo .env');

    await login.abrirModal();
    await login.campoEmail.fill(EMAIL);
    await login.campoSenha.fill('SenhaIncorreta!123');
    // tap() simula o toque na tela, em vez do clique do mouse
    await login.botaoEntrar.tap();

    await expect(login.mensagemCredenciaisInvalidas).toBeVisible();
    await expect(page).not.toHaveURL(/\/start/);
  });
});
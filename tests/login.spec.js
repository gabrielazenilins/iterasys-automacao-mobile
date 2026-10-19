// CT_001 e CT_002 - login na plataforma Iterasys (tela + API)
// Credenciais vêm do .env (nunca do código): USER_EMAIL e USER_PASSWORD
// Cada teste faz um único login real e confere a tela e a resposta de /api/signin.
// Não registre o corpo da resposta em log ou anotação: pode conter dados de sessão.
const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');

const EMAIL = process.env.USER_EMAIL;
const SENHA = process.env.USER_PASSWORD;

test.describe('Login', () => {
  test.skip(!EMAIL || !SENHA, 'Defina USER_EMAIL e USER_PASSWORD no arquivo .env');

  /** @type {LoginPage} */
  let login;

  test.beforeEach(async ({ page }) => {
    login = new LoginPage(page);
    await login.acessarPaginaDeCursos();
    await login.abrirModal();
  });

  test('LOGIN_CT_001 - Validar login com credenciais válidas', async ({ page }) => {
    const resposta = await login.fazerLoginCapturandoResposta(EMAIL, SENHA);

    // API: status 200. O corpo ({"errors":[],"success":true}) não dá para conferir aqui:
    // o login bem-sucedido navega para /start na hora e o navegador descarta o corpo.
    // O sucesso fica comprovado pela navegação e pelo conteúdo da área logada, abaixo.
    expect(resposta.status).toBe(200);

    // Tela: acesso à área autenticada
    await expect(page).toHaveURL(/\/start/, { timeout: 15_000 });
    await expect(login.linkVisitProfile).toBeVisible({ timeout: 15_000 });
  });

  test('LOGIN_CT_002 - Validar bloqueio de acesso com credenciais inválidas', async ({ page }) => {
    const resposta = await login.fazerLoginCapturandoResposta(EMAIL, 'SenhaIncorreta!123');

    // API: a falha vem no corpo (o status HTTP continua 200 mesmo com erro)
    expect(resposta.status).toBe(200);
    const { corpo } = resposta;
    expect(corpo.success).toBe(false);
    expect(corpo.errors).toHaveLength(1);
    expect(corpo.errors[0].translation_code).toBe('not_valid_user');
    // A mensagem cita e-mail e senha juntos, sem apontar qual dos dois está errado
    expect(corpo.errors[0].message).toMatch(/email/i);
    expect(corpo.errors[0].message).toMatch(/password/i);

    // Tela: mensagem genérica, e o acesso foi impedido
    await expect(login.mensagemCredenciaisInvalidas).toBeVisible();
    await expect(login.campoEmail).toBeVisible();
    await expect(page).not.toHaveURL(/\/start/);
  });
});

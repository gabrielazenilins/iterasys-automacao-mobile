// Critérios de aceitação: LOGIN_CA_001, LOGIN_CA_002 e LOGIN_CA_003
// Nenhum destes testes usa credenciais reais nem altera conta alguma:
// o token abaixo é inventado, então a redefinição nunca chega a ser concluída.
const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');
const { RecuperacaoSenhaPage } = require('../pages/RecuperacaoSenhaPage');

const TOKEN_FALSO = '0'.repeat(32); // mesmo formato do real: 32 caracteres hexadecimais
const SENHA_A = 'Teste@12345';
const SENHA_B = 'Outra@12345';

test.describe('Critérios de aceitação - Login', () => {
  test('LOGIN_CA_001 - Impedir alteração quando as senhas forem diferentes', async ({ page }) => {
    const recuperacao = new RecuperacaoSenhaPage(page);
    await recuperacao.abrirLink(TOKEN_FALSO);

    const resposta = await recuperacao.redefinirCapturandoResposta(SENHA_A, SENHA_B);

    // API: o servidor valida a confirmação antes de checar o token,
    // então o token falso basta para este critério.
    const { corpo } = resposta;
    expect(corpo.success).toBe(false);
    expect(corpo.errors[0].context).toBe('passwords_not_match');

    // Tela: mensagem para o usuário
    await expect(recuperacao.mensagemErro).toBeVisible();
    await expect(recuperacao.mensagemErro).toHaveText('As senhas não correspondem');
  });

  test('LOGIN_CA_002 - Link de recuperação inválido ou expirado', async ({ page }) => {
    // Defeito conhecido (mapeamento manual): o formulário abre mesmo com token falso e,
    // ao confirmar, o sistema mostra só "Não encontrado", sem dizer que o link não é
    // mais válido e sem orientar a solicitar nova recuperação.
    // Com test.fail() o resultado fica "passou" enquanto o defeito existir; quando for
    // corrigido, o teste passa a falhar e avisa para remover esta linha.
    test.fail(true, 'Defeito: mensagem genérica "Não encontrado" e sem orientação');

    const recuperacao = new RecuperacaoSenhaPage(page);
    await recuperacao.abrirLink(TOKEN_FALSO);
    await recuperacao.redefinir(SENHA_A, SENHA_A);

    // O sistema não conclui a redefinição (esta parte do critério é atendida)
    await expect(recuperacao.mensagemErro).toBeVisible();
    // Deve informar que o link não é mais válido
    await expect
      .soft(recuperacao.mensagemErro)
      .toContainText(/inv[aá]lid|expirad|n[aã]o (é|e) mais v[aá]lid/i);
    // E orientar o usuário a solicitar uma nova recuperação
    await expect
      .soft(recuperacao.mensagemErro)
      .toContainText(/solicit|nova (recupera|redefini)/i);
  });

  test('LOGIN_CA_002 (API) - API rejeita a redefinição com token inválido', async ({ page }) => {
    const recuperacao = new RecuperacaoSenhaPage(page);
    await recuperacao.abrirLink(TOKEN_FALSO);

    const resposta = await recuperacao.redefinirCapturandoResposta(SENHA_A, SENHA_A);

    // O status HTTP é 200 mesmo na falha; o erro vem no corpo (igual ao /api/signin)
    expect(resposta.status).toBe(200);

    const { corpo } = resposta;
    expect(corpo.success).toBe(false);
    expect(corpo.errors).toHaveLength(1);
    expect(corpo.errors[0].translation_code).toBe('not_found');
    // A resposta rejeita a troca, mas não diz que o link expirou nem orienta
    // a pedir nova recuperação (ver o teste de UI acima, marcado com test.fail).
  });

  test('LOGIN_CA_003 - Cadastro de novos usuários desabilitado', async ({ page }) => {
    const login = new LoginPage(page);
    await login.acessarPaginaDeCursos();

    // O cadastro fica no cabeçalho da página principal, fora do modal de login
    await login.irParaCadastro();

    await expect(login.toastTitulo).toHaveText('Cadastro proibido');
    await expect(login.toastMensagem).toHaveText('Cadastro desabilitado');
  });
});

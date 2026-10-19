// Page Object do formulário "Digite sua nova senha", aberto pelo link ?pwdrst=<token>
const { aguardarRespostaApi } = require('../support/respostaApi');

class RecuperacaoSenhaPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;

    this.formulario = page.locator('#passwordResetForm');
    this.campoNovaSenha = this.formulario.locator('input[name="password"]');
    this.campoConfirmacao = this.formulario.locator('input[name="password_confirm"]');
    this.botaoOk = this.formulario.locator('.reset-pass-final-btn');
    this.mensagemErro = this.formulario.locator('.js-new-pass-error-msg');
  }

  async abrirLink(token) {
    await this.page.goto(`/?pwdrst=${token}`);
    await this.formulario.waitFor({ state: 'visible' });
  }

  async preencher(novaSenha, confirmacao) {
    await this.campoNovaSenha.fill(novaSenha);
    await this.campoConfirmacao.fill(confirmacao);
  }

  /**
   * Clica em OK. O painel de regras da senha ("A senha deve ter: ...") fica por cima
   * do botão e intercepta o clique do mouse, então o clique é disparado direto no
   * elemento (dispatchEvent), sem depender do ponteiro.
   */
  async confirmar() {
    await this.botaoOk.dispatchEvent('click');
  }

  async redefinir(novaSenha, confirmacao) {
    await this.preencher(novaSenha, confirmacao);
    await this.confirmar();
  }

  /**
   * Igual a redefinir(), mas devolve { status, corpo } da API (/api/password-reset).
   * O navegador cuida de cookies e CSRF; o teste só observa o que a API respondeu.
   */
  async redefinirCapturandoResposta(novaSenha, confirmacao) {
    await this.preencher(novaSenha, confirmacao);
    const [resposta] = await Promise.all([
      aguardarRespostaApi(this.page, '/api/password-reset'),
      this.confirmar(),
    ]);
    return resposta;
  }
}

module.exports = { RecuperacaoSenhaPage };

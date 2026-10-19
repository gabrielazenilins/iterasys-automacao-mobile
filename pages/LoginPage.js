// Page Object do login da Iterasys (modal aberto pelo "Entrar" do cabeçalho)
const { aguardarRespostaApi } = require('../support/respostaApi');

class LoginPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;

    // Cabeçalho da página principal (fora do modal)
    this.linkEntrar = this.opcaoDoCabecalho(/^Entrar$/);
    this.linkCadastrar = this.opcaoDoCabecalho(/^Cadastrar-se$/);

    // Botão do menu mobile (hambúrguer). Em tela pequena, "Entrar" e "Cadastrar-se"
    // ficam dentro dele. Confirmado no Pixel 7: o clique abre o menu em tela cheia.
    this.botaoMenuMobile = page
      .locator(
        '.lw-topbar-burger:visible, .js-topbar-burger:visible, ' +
          '[class*="burger"]:visible, [aria-label*="menu" i]:visible'
      )
      .first();

    // Modal de login
    this.campoEmail = page.locator('#signin-email');
    this.campoSenha = page.locator('#signin-password');
    this.botaoEntrar = page.locator('#submitLogin');
    this.mensagemCredenciaisInvalidas = page.getByText(
      'Confira seu e-mail e sua senha, por favor.'
    );

    // Área logada (não usar o nome da usuária: o repositório é público).
    // Aponta para o texto do botão, que tem área visível em todos os navegadores;
    // o <a> que envolve o botão é considerado oculto pelo Firefox e pelo WebKit.
    this.linkVisitProfile = page
      .locator('a[href="/profile"] span:visible', { hasText: 'Visit profile' })
      .first();

    // Aviso (toast) exibido quando o cadastro está desabilitado
    this.toastTitulo = page.locator('.iziToast-title');
    this.toastMensagem = page.locator('.iziToast-message');
  }

  /**
   * Opção visível do cabeçalho pelo texto exato.
   * No celular, "Entrar" e "Cadastrar-se" ficam no menu hambúrguer e não usam a classe
   * .lw-topbar-option-link-lbl do desktop; por isso a busca é pelo texto, só entre os
   * elementos visíveis (ignora as cópias escondidas do outro layout).
   */
  opcaoDoCabecalho(texto) {
    return this.page.getByText(texto).locator('visible=true').first();
  }

  async acessarPaginaDeCursos() {
    await this.page.goto('/');
  }

  /**
   * No mobile, abre o menu hambúrguer quando a opção do cabeçalho não está visível.
   * No desktop a opção já aparece, e nada é feito.
   */
  async abrirMenuSeNecessario(opcao) {
    if (await opcao.isVisible()) return;
    await this.botaoMenuMobile.click();
    await opcao.waitFor({ state: 'visible' });
  }

  /**
   * Clica numa opção do cabeçalho/menu. No menu mobile (li.mobile-nav-menu-item), a
   * imagem do logo intercepta o clique simulado do Playwright, embora o toque real
   * funcione (conferido manualmente). Por isso o clique é disparado direto no elemento,
   * a mesma solução do botão OK da redefinição de senha.
   */
  async clicarOpcao(opcao) {
    await opcao.dispatchEvent('click');
  }

  async abrirModal() {
    await this.abrirMenuSeNecessario(this.linkEntrar);
    await this.clicarOpcao(this.linkEntrar);
    await this.campoEmail.waitFor({ state: 'visible' });
  }

  async fazerLogin(email, senha) {
    await this.campoEmail.fill(email);
    await this.campoSenha.fill(senha);
    await this.botaoEntrar.click();
  }

  /**
   * Igual a fazerLogin(), mas devolve { status, corpo } da API (/api/signin).
   * O corpo é lido assim que a resposta chega, antes da navegação para /start.
   */
  async fazerLoginCapturandoResposta(email, senha) {
    await this.campoEmail.fill(email);
    await this.campoSenha.fill(senha);
    const [resposta] = await Promise.all([
      aguardarRespostaApi(this.page, '/api/signin'),
      this.botaoEntrar.click(),
    ]);
    return resposta;
  }

  async irParaCadastro() {
    await this.abrirMenuSeNecessario(this.linkCadastrar);
    await this.clicarOpcao(this.linkCadastrar);
  }
}

module.exports = { LoginPage };
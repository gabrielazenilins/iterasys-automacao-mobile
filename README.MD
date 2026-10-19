# Automação de testes mobile: login da plataforma Iterasys

Automação com **Playwright + JavaScript** dos casos de teste (CT) e critérios de aceitação (CA) do login da plataforma da Iterasys (https://iterasys.learnworlds.com), executados em **navegador mobile**.

Este projeto é a versão mobile da automação web. Todos os cenários da versão web rodam aqui em celulares emulados, e foram acrescentados testes específicos de celular: menu hambúrguer, tamanho de tela, tipo de teclado e toque.

Os testes conferem a **tela** e, quando faz sentido, a **resposta da API** que a tela chama, no mesmo teste e sem chamadas extras ao site.

## Dispositivos

| Projeto | Dispositivo emulado | Navegador |
|---|---|---|
| `android` | Pixel 7 | Chromium |
| `iphone` | iPhone 14 | WebKit (motor do Safari) |

O Firefox fica de fora porque o Playwright não emula mobile nele.

## Escopo

### Cenários da versão web, executados no celular

| ID | O que valida | Automatizado | Resultado |
|---|---|---|---|
| LOGIN_CT_001 | Login com credenciais válidas (tela + status da API) | Sim | Passa |
| LOGIN_CT_002 | Bloqueio com credenciais inválidas, mensagem genérica (tela + API) | Sim | Passa |
| LOGIN_CT_003 | Recuperação de senha e login social | Não | Depende de ler e-mail e de login com Google |
| LOGIN_CT_004 | Login por Apple, Facebook e LinkedIn | Não | Depende de autenticação externa com proteções anti-bot; já falha manualmente |
| LOGIN_CA_001 | Senhas diferentes na redefinição (tela + API) | Sim | Passa |
| LOGIN_CA_002 (tela) | Link de recuperação inválido ou expirado | Sim | **Falha esperada** (defeito, ver abaixo) |
| LOGIN_CA_002 (API) | API rejeita a redefinição com token inválido | Sim | Passa |
| LOGIN_CA_003 | Cadastro de novos usuários desabilitado | Sim | Passa |

### Cenários novos, específicos de celular

| ID | O que valida | Automatizado | Resultado |
|---|---|---|---|
| MOBILE_CT_001 | Acesso ao login pelo menu hambúrguer: o "Entrar" aparece no menu e abre o modal | Sim | Passa |
| MOBILE_CT_002 | Modal de login cabe na tela: campos e botão inteiros na largura do celular, sem rolagem horizontal | Sim | Passa |
| MOBILE_CT_003 | Campos abrem o teclado adequado: e-mail com `type="email"` e senha com `type="password"` | Sim | Passa |
| MOBILE_CT_004 | Bloqueio com credenciais inválidas usando toque (`tap`) em vez de clique | Sim | Passa |

Resultados obtidos no Android (Pixel 7).

## Achados

1. **LOGIN_CA_002: critério parcialmente atendido.** Com um link de recuperação inválido, o formulário de nova senha abre normalmente. Ao confirmar, o sistema impede a troca, mas só mostra "Não encontrado": não informa que o link não é mais válido e não orienta a solicitar uma nova recuperação. O comportamento é o mesmo no celular e no desktop. O teste está marcado com `test.fail()`: continua "passando" enquanto o defeito existir e passa a falhar quando for corrigido, avisando para remover a marcação.
2. **A API responde HTTP 200 mesmo em falha.** Tanto `/api/signin` quanto `/api/password-reset` sinalizam erro apenas no corpo (`"success": false`). Quem integra precisa olhar o corpo, e não o status.
3. **Mensagens da API em inglês.** A tela traduz a partir do `translation_code` (por exemplo, `not_found` vira "Não encontrado").
4. **No celular, o cabeçalho vira menu hambúrguer.** "Entrar" e "Cadastrar-se" ficam dentro de um menu em tela cheia (`li.mobile-nav-menu-item`), com estrutura diferente da do desktop.

## Estrutura

```
├── pages/                      # Page Objects
│   ├── LoginPage.js            # cabeçalho, menu mobile e modal de login
│   └── RecuperacaoSenhaPage.js # formulário aberto pelo link ?pwdrst=
├── support/
│   └── respostaApi.js          # captura a resposta de uma chamada de API
├── tests/
│   ├── login.spec.js           # CT_001 e CT_002
│   ├── ca.spec.js              # CA_001, CA_002 e CA_003
│   └── mobile.spec.js          # MOBILE_CT_001 a MOBILE_CT_004
├── playwright.config.js        # projetos android e iphone
├── .env.example
└── .gitignore
```

## Como rodar

Requisitos: Node.js 18 ou superior.

```bash
npm install
npx playwright install chromium webkit
```

Crie o arquivo `.env` na raiz, copiando o `.env.example`, e preencha com uma conta de teste:

```
USER_EMAIL=
USER_PASSWORD=
BASE_URL=https://iterasys.learnworlds.com
```

Se a senha tiver `#` ou espaço, coloque o valor entre aspas duplas.

| Comando | O que faz |
|---|---|
| `npm test` | Android (Pixel 7), sem abrir janela |
| `npm run test:headed` | Android com o navegador visível |
| `npm run test:iphone` | iPhone 14 |
| `npm run test:all` | Android e iPhone em sequência |
| `npm run test:ui` | Modo interativo do Playwright |

Relatório do último teste: `npx playwright show-report`.

Sem `USER_EMAIL` e `USER_PASSWORD`, os testes que fazem login são ignorados e os demais continuam rodando.

## Decisões de projeto

- **Projeto separado da versão web.** A automação mobile fica em um repositório próprio, com os mesmos Page Objects e specs adaptados, para não misturar resultados e configurações dos dois ambientes.
- **Emulação de dispositivo.** Os celulares são emulados pelo Playwright (`devices['Pixel 7']` e `devices['iPhone 14']`): tamanho de tela, densidade de pixels, user agent e suporte a toque. Não substitui um teste em aparelho físico, mas cobre o layout e o comportamento responsivo.
- **Menu hambúrguer tratado no Page Object.** O `LoginPage` abre o menu só quando a opção não está visível no cabeçalho. Assim os specs da versão web rodam no celular sem alteração.
- **Opções do cabeçalho localizadas pelo texto.** No menu mobile, "Entrar" e "Cadastrar-se" não usam a classe `.lw-topbar-option-link-lbl` do desktop. A busca é pelo texto exato, apenas entre elementos visíveis.
- **Clique direto nas opções do menu mobile.** A imagem do logo intercepta o clique simulado do Playwright sobre as opções do menu aberto. O toque real foi conferido manualmente e abre o modal normalmente, então trata-se de uma limitação da automação, e não de um defeito: o clique é disparado direto no elemento (`dispatchEvent`).
- **Page Objects.** Seletores e ações ficam em `pages/`; os specs só descrevem o cenário e as verificações.
- **Credenciais fora do código.** E-mail e senha vêm do `.env`, que está no `.gitignore`. Só o `.env.example`, sem valores, vai para o repositório.
- **Um worker, sem paralelismo.** Os testes rodam contra uma plataforma real e usam a mesma conta; rodar um de cada vez evita bloqueio por excesso de requisições e falhas difíceis de explicar.
- **Trace e vídeo desligados.** Poderiam registrar o que é digitado e os cookies da sessão. Fica apenas o screenshot em caso de falha.
- **Nada é alterado no site.** O link de recuperação usa um token inventado, então nenhuma senha é trocada. O teste de cadastro apenas toca em "Cadastrar-se" e confere o aviso; nenhuma conta é criada.
- **API observada pelo navegador.** Os testes capturam a resposta da chamada que a própria página faz, em vez de chamar a API diretamente. Assim cookies e token anti-CSRF ficam por conta do navegador, sem tratar nada sensível no código.
- **Limite no login válido.** Após o login bem-sucedido o navegador navega para `/start` na hora e descarta o corpo da resposta; por isso o CT_001 confere o status da API e comprova o sucesso pela tela.
- **Clique no botão OK da redefinição.** O painel de regras da senha fica por cima do botão e intercepta o clique; o clique é disparado direto no elemento. Para um usuário real, isso pode ser um problema de usabilidade, principalmente em telas pequenas.
- **Falha esperada no CA_002 (tela).** O teste está marcado com `test.fail()` por causa do defeito descrito em "Achados". Na lista de resultados ele aparece com ✘ em cada dispositivo, mas conta como aprovado. Quando o defeito for corrigido, o teste passa a falhar e a marcação deve ser removida.
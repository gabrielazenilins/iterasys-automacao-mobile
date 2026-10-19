// Captura a resposta de uma chamada de API feita pela própria página.
//
// O corpo é lido assim que a resposta chega. Se a ação dispara uma navegação imediata
// (ex.: login que vai para /start), o navegador pode descartar o corpo antes da leitura;
// nesse caso `corpo` fica null e só o `status` é confiável.
//
// Uso (começa a escutar antes da ação, em paralelo com ela):
//   const [resposta] = await Promise.all([
//     aguardarRespostaApi(page, '/api/signin'),
//     botao.click(),
//   ]);
//   resposta.status  // número HTTP
//   resposta.corpo   // JSON já convertido, ou null se o navegador descartou o corpo
function aguardarRespostaApi(page, trechoDaUrl) {
  return page
    .waitForResponse((r) => r.url().includes(trechoDaUrl))
    .then(async (r) => {
      let corpo = null;
      try {
        corpo = await r.json();
      } catch {
        // corpo descartado por navegação imediata (ou resposta que não é JSON)
      }
      return { status: r.status(), corpo };
    });
}

module.exports = { aguardarRespostaApi };

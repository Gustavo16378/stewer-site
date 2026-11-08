# Lighthouse CI

`celular.json` e `computador.json` são lidos pelo workflow `lighthouse.yml`,
três rodadas cada, contra o site com a API e o banco de teste.

| | celular | computador |
|---|---|---|
| desempenho | ≥ 90 | ≥ 90 |
| acessibilidade, boas práticas, SEO | ≥ 95 | ≥ 95 |
| FCP | ≤ 2,0 s | ≤ 1,0 s |
| LCP | ≤ 3,0 s | ≤ 1,2 s |
| CLS | ≤ 0,1 | ≤ 0,1 |
| TBT | ≤ 200 ms | ≤ 200 ms |
| JavaScript baixado | ≤ 80 KB | ≤ 80 KB |
| pedidos a outros servidores | 0 | 0 |

O FCP e o LCP do celular têm folga sobre o "bom" do Google (1,8 s e 2,5 s)
porque o Lighthouse **simula** o 4G lento a partir de um carregamento
rápido: a abertura de marca depende do JavaScript de entrada e a foto da
abertura depende da resposta da API, e a simulação fica na casa de 1,8 s e
2,3 s, oscilando de uma rodada para outra. Os tetos exatos (1,8 s e 2,5 s)
são cobrados no navegador de verdade, com a rede e a CPU limitadas, em
`tests/e2e/desempenho.spec.ts`, onde o FCP medido é de ~0,7 s.

`pauseAfterLoadMs: 3000`: a auditoria espera a abertura de marca subir e a
página assentar. Sem isso, a acessibilidade mede o texto no meio do fade e
acusa contraste baixo que não existe na página parada.

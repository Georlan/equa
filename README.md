# EQUA 🎯

Jogo de matemática em português: **uma expressão na tela, quatro alternativas e uma nova questão a cada acerto**.

## Como jogar

1. Abra o arquivo [index.html](./index.html) no navegador.
2. Resolva a expressão apresentada.
3. Clique em uma das quatro alternativas (ou pressione **1**, **2**, **3** ou **4**).
4. **Acertou?** A próxima questão aparece automaticamente. **Errou?** Tente outra alternativa.

As questões são geradas automaticamente, então a partida não tem fim.

### Dificuldades

- **Iniciante:** somas e subtrações com resultado não negativo.
- **Intermediário:** somas, subtrações e multiplicações.
- **Avançado:** somas, subtrações (inclusive com resultados negativos), multiplicações e divisões exatas.

### Pontuação

- Acerto na primeira tentativa: **+10 pontos**.
- Acerto depois de errar: **+5 pontos**.
- Uma resposta errada interrompe a sequência de acertos, mas não impede continuar.
- Trocar de dificuldade ou clicar em **Recomeçar** inicia uma partida nova.

## Executar localmente

Não há bibliotecas, servidor, instalação ou configuração obrigatória: basta abrir o arquivo \`index.html\` no navegador.

Para executar os testes automatizados, use Node.js 20 ou superior:

\`\`\`bash
node --test
\`\`\`

## Publicar gratuitamente com GitHub Pages

No repositório GitHub, abra **Settings → Pages**. Em **Build and deployment**, escolha **Deploy from a branch**, selecione **main** e a pasta **/(root)**, e salve. Aguarde a publicação indicada pelo GitHub.

O endereço esperado, após configurar o Pages, é:

https://georlan.github.io/equa/

> Este endereço só ficará ativo depois que o GitHub Pages for habilitado e o deploy concluído.

## Tecnologias

HTML, CSS e JavaScript puro. O projeto funciona sem backend e sem dependências externas.

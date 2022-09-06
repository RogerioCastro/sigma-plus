# Sigma plus

[Sigma 2](https://github.com/jacomyal/sigma.js) com algumas funcionalidades já integradas.

[https://rogeriocastro.github.io/sigma-plus/](https://rogeriocastro.github.io/sigma-plus/)

<p align="center"><img src="https://raw.githubusercontent.com/RogerioCastro/sigma-plus/main/dist/example.png"></p>

> Veja uma **demonstração** da biblioteca, baixando o conteúdo do diretório [`/dist`](/dist) e rodando o arquivo `index.html` (de preferência com [http-server](https://github.com/http-party/http-server)).

## Características

- Tooltips customizáveis com [Popper.js](https://popper.js.org/);
- Customização da aparência de nós selecionados.

## Instalação

Baixe o arquivo de produção da biblioteca que está localizado no diretório [`/dist`](/dist) e acrescente-o à `HEAD` da página. 

```html
<head>
  ...
  <script src="sigma-plus.min.js"></script>
  ...
</head>
```

## Utilização

Veja o arquivo [`/src/demo.js`](/src/demo.js) para um exemplo de utilização.

## Desenvolvimento

Essa biblioteca foi desenvolvida utilizando [webpack](https://webpack.js.org/) para o empacotamento.

```bash
# Dependências
$ npm install

# Servidor de desenvolvimento (localhost:9000)
# Roda o 'index.html' do diretório '/dist'
$ npm start

# Build de produção
$ npm run build
```

> O comando `npm run build` irá gerar os arquivos de produção `sigma-plus.min.js` e `demo.min.js`, no diretório [`/dist`](/dist).

## Créditos

[Popper.js](https://popper.js.org/) - Biblioteca de posicionamento de *tooltips* e *popovers*.

[Sigma 2](https://github.com/jacomyal/sigma.js) - Uma biblioteca JavaScript destinada a visualizar grafos com milhares de nós e arestas.

## License

MIT &copy; Rogério Castro

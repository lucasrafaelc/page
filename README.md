# Template genérico para página acadêmica

Este diretório contem uma versao limpa da página acadêmica. Ela gera o conteúdo principal a partir de um arquivo Lattes `cv.xml` e usa `site-config.json` para pequenos ajustes visuais e links externos.

## Arquivos principais

Mantenha estes arquivos juntos no mesmo diretório do servidor:

- `index.html`
- `styles.css`
- `main.js`
- `cv.xml`
- `site-config.json`
- `site-config.js`
- `sync-site-config.py`
- `inf-logo-2.0.jpeg`
- `favicon.ico`

Opcional:

- uma foto de perfil, por exemplo `foto.jpeg`

## Roteiro rápido

1. Exporte o curriculo Lattes em XML.
2. Renomeie o arquivo exportado para `cv.xml`.
3. Coloque `cv.xml` neste diretorio.
4. Edite `site-config.json`.
5. Se for usar foto, coloque a imagem neste diretório e preencha o campo `photo`.
6. Rode:

```bash
python sync-site-config.py
```

7. Teste localmente:

```bash
python3 -m http.server 8765
```

8. Abra:

```text
http://localhost:8765/
```

9. Envie todos os arquivos para o diretório da pagina web no servidor.

## O que editar em `site-config.json`

Campos mais importantes:

```json
{
  "eyebrow": "Research Area | Teaching | Laboratory",
  "title": "Professor, Institution",
  "description": "Short biography shown in the banner.",
  "photo": "foto.jpeg",
  "photoAlt": "Profile photo",
  "links": {
    "scholar": "",
    "orcid": "",
    "dblp": "",
    "github": "",
    "linkedin": ""
  }
}
```

Use string vazia (`""`) para esconder um link ou foto.

## Dados lidos automaticamente de `cv.xml`

A página tenta obter automaticamente:

- nome
- instituição
- endereco profissional
- e-mails
- link do Lattes
- educação
- publicações
- atividades profissionais
- projetos
- estudantes/orientações
- ensino

O texto em `description` no `site-config.json` tem prioridade sobre o resumo do XML.

## Observacao sobre `site-config.js`

O arquivo `site-config.js` existe para permitir pre-visualização direta em alguns navegadores. Depois de alterar `site-config.json`, rode sempre:

```bash
python sync-site-config.py
```

No servidor web, `site-config.json` sera usado normalmente, mas manter os dois sincronizados evita surpresas.

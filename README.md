# ImageToURL Pro 🚀

Uma plataforma moderna, ultra-rápida e privativa para hospedar imagens e convertê-las em URLs diretas, snippets em Markdown, tags HTML, BBCode e QR Codes. Projetada como uma alternativa superior ao `image2url.com`, com design inspirado nos padrões de produtos Tier-1 como Linear, Raycast e Vercel.

---

## ✨ Funcionalidades Principais

* **Multi-Canal de Envio**:
  * **Drag & Drop** global na tela inteira com animações e borda pulsante.
  * **Colar da Área de Transferência (`Ctrl + V`)**: capture um print de tela (`Win + Shift + S`) e pressione `Ctrl + V` em qualquer lugar da tela.
  * **Importação via URL Web**: baixe e hospede imagens de qualquer link externo.
  * **Upload em Lote (Batch)**: envie múltiplos arquivos simultaneamente com progresso individual e geral.
* **Formatos de Compartilhamento Gerados Instantaneamente**:
  * **Link Direto**: URL limpa direta para o arquivo (sem páginas com anúncios intermediários).
  * **Markdown**: `![nome](url)`
  * **HTML**: `<img src="url" alt="nome" />`
  * **BBCode**: `[img]url[/img]`
  * **QR Code Dinâmico**: gere e baixe o QR Code em PNG com 1 clique.
* **Privacidade & Segurança Total**:
  * **Limpeza Automática de EXIF & GPS**: remove dados sensíveis de câmera e coordenadas de geolocalização.
  * **Autodestruição / Expiração**: configure se a imagem deve expirar em 1 hora, 24 horas, 7 dias, 30 dias ou ser permanente.
  * **Exclusão Segura com Token**: apenas quem enviou a imagem (ou possui o token secreto) pode excluí-la.
* **Ferramentas Integradas (Tools Suite)**:
  * **Compressor Inteligente com Comparador Antes vs. Depois**: controle o nível de qualidade e compare visualmente o resultado com um slider interativo.
  * **Conversor de Formatos Universal**: converta entre PNG, JPG, WebP, AVIF e SVG.
  * **Inspetor de Metadados EXIF**: analise resolução, espaço de cor e integridade do arquivo.
* **Histórico Local no Navegador (Vault)**:
  * Histórico automático via `localStorage` sem exigir cadastro de conta ou login.
  * Pesquisa de imagens, cálculo de armazenamento e exclusão rápida.
* **API REST Completa para Desenvolvedores**:
  * Exemplos prontos em `cURL`, `JavaScript/TypeScript` e `Python` para integração em scripts, bots do Discord e automações.

---

## 🛠️ Stack Tecnológica

* **Framework**: Next.js 15 (App Router) + React 19 + TypeScript
* **Estilização**: Tailwind CSS com paleta customizada *OLED Midnight*
* **Processamento de Imagens**: Sharp (motor em C++ / Node.js nativo de altíssima velocidade)
* **Iconografia**: Lucide React
* **QR Code**: QRCode generator integrado

---

## 🚀 Como Executar o Projeto

### Pré-requisitos
* Node.js v18 ou superior instalado.

### 1. Instalar dependências
```bash
npm install
```

### 2. Rodar em modo de desenvolvimento
```bash
npm run dev
```
Acesse `http://localhost:3000` no seu navegador.

### 3. Gerar build de produção e iniciar
```bash
npm run build
npm run start
```

---

## 📡 Endpoints da API

### `POST /api/upload`
Envia uma imagem via `multipart/form-data`.
* Parâmetros:
  * `file`: Arquivo de imagem (PNG, JPG, WebP, GIF, SVG, AVIF, até 32MB).
  * `expiration`: `"never" | "1h" | "24h" | "7d" | "30d"` (padrão: `"never"`).
  * `outputFormat`: `"original" | "webp" | "png" | "jpeg" | "avif"` (padrão: `"original"`).
  * `stripExif`: `"true" | "false"` (padrão: `"true"`).
  * `maxDimension`: número em pixels (ex: `1920`, `1280`, `800`).

### `POST /api/fetch-url`
Importa uma imagem a partir de uma URL pública.
* Body JSON:
  ```json
  {
    "url": "https://exemplo.com/foto.jpg",
    "expiration": "24h",
    "outputFormat": "webp"
  }
  ```

### `GET /api/images/:id`
Retorna os metadados da imagem informada.

### `DELETE /api/images/:id?token=SEU_TOKEN`
Exclui permanentemente a imagem do servidor.

### `GET /api/cleanup`
Executa a rotina de purga para apagar todas as imagens cuja data de expiração já foi atingida.

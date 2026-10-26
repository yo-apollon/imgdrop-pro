# ImgDrop Pro 🚀

Uma plataforma moderna, ultra-rápida e privativa para hospedar imagens e convertê-las em URLs diretas, snippets em Markdown, tags HTML, BBCode e QR Codes. Projetada como uma alternativa superior ao `image2url.com`, com design inspirado nos padrões de produtos Tier-1 como Linear, Raycast e Vercel.

---

## ✨ Funcionalidades Principais

* **Multi-Canal de Envio**:
  * **Drag & Drop** global na tela inteira com animações e borda pulsante.
  * **Colar da Área de Transferência (`Ctrl + V`)**: capture um print de tela (`Win + Shift + S`) e pressione `Ctrl + V` em qualquer lugar da tela.
  * **Importação via URL Web**: baixe e hospede imagens de qualquer link externo com proteção SSRF.
  * **Upload em Lote (Batch)**: envie múltiplos arquivos simultaneamente com progresso individual e geral.
* **Formatos de Compartilhamento Gerados Instantaneamente**:
  * **Link Direto**: URL limpa direta para o arquivo (sem páginas intermediárias com anúncios).
  * **Markdown**: `![nome](url)`
  * **HTML**: `<img src="url" alt="nome" />`
  * **BBCode**: `[img]url[/img]`
  * **QR Code Dinâmico**: gere e baixe o QR Code em PNG com 1 clique.
* **Privacidade & Segurança Total**:
  * **Limpeza Automática de EXIF & GPS**: remove dados sensíveis de câmera e coordenadas de geolocalização.
  * **Sanitização de SVG**: proteção contra ataques Stored XSS via DOMPurify.
  * **Autodestruição / Expiração**: configure se a imagem deve expirar em 1 hora, 24 horas, 7 dias, 30 dias ou ser permanente.
  * **Exclusão Segura com Token**: apenas quem enviou a imagem (ou possui o token secreto) pode excluí-la.
* **Ferramentas Integradas (Tools Suite)**:
  * **Compressor Inteligente com Comparador Antes vs. Depois**: controle o nível de qualidade e compare visualmente o resultado com um slider interativo.
  * **Conversor de Formatos Universal**: converta entre PNG, JPG, WebP, AVIF e SVG.
  * **Inspetor de Metadados EXIF**: analise resolução, espaço de cor e integridade do arquivo.
* **Contas & Monetização SaaS**:
  * **Autenticação Simples**: login com Google, GitHub ou E-mail.
  * **Chaves de API REST**: gere tokens para automações e bots.
  * **Planos Grátis & PRO**: suporte a assinaturas com limites expandidos e pagamento via PIX e Cartão.

---

## 🛠️ Stack Tecnológica

* **Framework**: Next.js 15 (App Router) + React 19 + TypeScript
* **Estilização**: Tailwind CSS com paleta customizada *OLED Midnight*
* **Processamento de Imagens**: Sharp (motor em C++ / Node.js nativo de altíssima velocidade)
* **Storage em Nuvem**: Vercel Blob / Cloudflare R2 / AWS S3
* **Segurança**: DOMPurify + SSRF Blocker + IP Rate Limiter
* **Iconografia**: Lucide React

---

## 🚀 Como Executar Localmente

```bash
# Instalar dependências
npm install

# Modo de desenvolvimento
npm run dev

# Executar bateria de testes E2E
npm run test:e2e

# Build de produção
npm run build
npm run start
```
Acesse `http://localhost:3000` no seu navegador.

---

## 🔐 Variáveis de Ambiente (.env.local / Vercel)

```env
# Vercel Blob Storage (Uploads diretos até 50MB)
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."

# Supabase Auth & PostgreSQL
NEXT_PUBLIC_SUPABASE_URL="https://xxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOi..."

# Stripe Billing (Global & PIX)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRO_MONTHLY_PRICE_ID="price_..."
STRIPE_PRO_YEARLY_PRICE_ID="price_..."
```

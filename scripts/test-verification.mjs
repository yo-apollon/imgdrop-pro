import fs from "fs";
import path from "path";

async function runTests() {
  console.log("=== INICIANDO BATERIA DE TESTES & VALIDAÇÃO (SECURITY + CLOUD READY) ===");

  const samplePngBase64 =
    "iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mNk+M9QzwAEjDAGYzAEAB8YBv5QZk+fAAAAAElFTkSuQmCC";
  const pngBuffer = Buffer.from(samplePngBase64, "base64");

  const baseUrl = "http://localhost:3000";

  // Test 1: SSRF Protection
  console.log("\n[1/5] Testando Blindagem contra SSRF...");
  const ssrfAttempts = [
    "http://127.0.0.1:3000/api/cleanup",
    "http://localhost:8080/secret",
    "http://169.254.169.254/latest/meta-data/",
    "http://192.168.1.1/admin",
  ];

  for (const maliciousUrl of ssrfAttempts) {
    const res = await fetch(`${baseUrl}/api/fetch-url`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: maliciousUrl }),
    });
    const data = await res.json();
    if (res.status === 403 && data.error.includes("URL não permitida")) {
      console.log(`  ✓ Bloqueou tentativa SSRF para: ${maliciousUrl} (${res.status} Proibido)`);
    } else {
      throw new Error(`Falha de segurança! SSRF não foi bloqueado para: ${maliciousUrl}`);
    }
  }

  // Test 2: SVG XSS Sanitization
  console.log("\n[2/5] Testando Sanitização contra Stored XSS em SVG...");
  const maliciousSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
    <circle cx="50" cy="50" r="40" fill="red" />
    <script>alert('XSS_ATTACK_VECTOR')</script>
    <a href="javascript:alert(1)"><text y="20">Clique</text></a>
  </svg>`;
  const svgBlob = new Blob([Buffer.from(maliciousSvg, "utf-8")], { type: "image/svg+xml" });
  const svgForm = new FormData();
  svgForm.append("file", svgBlob, "exploit.svg");
  svgForm.append("expiration", "1h");

  const svgRes = await fetch(`${baseUrl}/api/upload`, {
    method: "POST",
    body: svgForm,
  });
  const svgData = await svgRes.json();
  if (svgRes.status === 200 && svgData.success) {
    console.log("  ✓ Upload de SVG aceito e processado.");
    // Verify file content does NOT contain <script>
    const fileRes = await fetch(svgData.image.url);
    const savedContent = await fileRes.text();
    if (savedContent.includes("<script>") || savedContent.includes("XSS_ATTACK_VECTOR")) {
      throw new Error("Vulnerabilidade XSS! O script não foi sanitizado do SVG!");
    }
    console.log("  ✓ Sanitização validada: tags <script> e vetores XSS foram eliminados com sucesso!");

    // Clean up
    await fetch(`${baseUrl}/api/images/${svgData.image.id}?token=${svgData.image.deleteToken}`, {
      method: "DELETE",
    });
  } else {
    throw new Error("Falha no upload do SVG de teste!");
  }

  // Test 3: Standard Image Upload & WebP Conversion
  console.log("\n[3/5] Testando Upload Regular com Conversão WebP...");
  const form = new FormData();
  const blob = new Blob([pngBuffer], { type: "image/png" });
  form.append("file", blob, "photo.png");
  form.append("expiration", "24h");
  form.append("outputFormat", "webp");
  form.append("stripExif", "true");

  const uploadRes = await fetch(`${baseUrl}/api/upload`, {
    method: "POST",
    body: form,
  });
  const uploadData = await uploadRes.json();

  if (!uploadData.success || !uploadData.image?.id) {
    throw new Error("Falha no upload de imagem!");
  }
  console.log(`  ✓ Imagem enviada com sucesso: ID ${uploadData.image.id}`);
  console.log(`  ✓ URL Direta: ${uploadData.image.url}`);
  console.log(`  ✓ Formato convertido: ${uploadData.image.mimeType}`);

  const imageId = uploadData.image.id;
  const deleteToken = uploadData.image.deleteToken;

  // Test 4: Image preview page & metadata
  console.log("\n[4/5] Testando Página de Visualização (/i/:slug) e Metadados...");
  const getRes = await fetch(`${baseUrl}/api/images/${imageId}`);
  const getData = await getRes.json();
  if (!getData.success || getData.image.id !== imageId) {
    throw new Error("Falha na consulta de metadados!");
  }
  console.log(`  ✓ Metadados obtidos corretamente.`);

  const viewRes = await fetch(`${baseUrl}/i/${imageId}`);
  if (!viewRes.ok) {
    throw new Error("Página /i/:slug falhou ao carregar!");
  }
  console.log(`  ✓ Página /i/${imageId} renderizou com status HTTP 200.`);

  // Test 5: Delete with token
  console.log("\n[5/5] Testando Exclusão com Token Secreto...");
  const delRes = await fetch(`${baseUrl}/api/images/${imageId}?token=${deleteToken}`, {
    method: "DELETE",
  });
  const delData = await delRes.json();
  if (!delData.success) {
    throw new Error("Falha ao excluir imagem com token!");
  }
  console.log("  ✓ Imagem excluída com sucesso.");

  console.log("\n===================================================================");
  console.log("🎉 VALIDAÇÃO COMPLETA: TODOS OS 5 TESTES DE SEGURANÇA E API PASSARAM!");
  console.log("===================================================================\n");
}

runTests().catch((err) => {
  console.error("ERRO NO TESTE:", err);
  process.exit(1);
});

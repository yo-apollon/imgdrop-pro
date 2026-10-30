import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      type = "bug",
      title,
      description,
      email,
      metadata = {},
    } = body;

    if (!description || !description.trim()) {
      return NextResponse.json(
        { error: "A descrição do problema ou feedback é obrigatória." },
        { status: 400 }
      );
    }

    const typeIcons: Record<string, string> = {
      bug: "🐞 Erro / Bug Reportado",
      feature: "💡 Sugestão de Melhoria",
      support: "❓ Dúvida / Suporte",
    };

    const typeColors: Record<string, number> = {
      bug: 0xef4444, // red
      feature: 0x3b82f6, // blue
      support: 0x10b981, // emerald
    };

    const reportLabel = typeIcons[type] || "📝 Feedback Geral";
    const embedColor = typeColors[type] || 0x10b981;

    // 1. Send to Discord Webhook if configured
    const discordWebhookUrl = process.env.DISCORD_FEEDBACK_WEBHOOK_URL;
    if (discordWebhookUrl) {
      try {
        const payload = {
          username: "ImgDrop Pro Monitor",
          avatar_url: "https://imgdrop-pro.vercel.app/og-image.png",
          embeds: [
            {
              title: `[${reportLabel}] ${title || "Relato de Usuário"}`,
              color: embedColor,
              description: description.slice(0, 2000),
              fields: [
                {
                  name: "📧 Contato do Usuário",
                  value: email ? `\`${email}\`` : "*Não informado (Anônimo)*",
                  inline: true,
                },
                {
                  name: "🌐 Navegador / SO",
                  value: metadata.browser ? `\`${metadata.browser}\` (${metadata.os || "Desconhecido"})` : "*Não detectado*",
                  inline: true,
                },
                {
                  name: "📍 Página de Origem",
                  value: metadata.url || "https://imgdrop-pro.vercel.app",
                  inline: false,
                },
              ],
              footer: {
                text: "ImgDrop Pro User Feedback System",
              },
              timestamp: new Date().toISOString(),
            },
          ],
        };

        await fetch(discordWebhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch (webhookErr) {
        console.error("Failed to post to Discord webhook:", webhookErr);
      }
    }

    // 2. Persist to Supabase if configured
    const supabase = createAdminSupabaseClient();
    if (supabase) {
      try {
        await supabase.from("feedback_reports").insert([
          {
            type,
            title: title || "Sem título",
            description,
            email: email || null,
            metadata,
            created_at: new Date().toISOString(),
          },
        ]);
      } catch (dbErr) {
        console.warn("Non-fatal Supabase feedback insert warning:", dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Seu relato foi recebido! Nossa equipe técnica já foi notificada.",
    });
  } catch (err: any) {
    console.error("Feedback submission error:", err);
    return NextResponse.json(
      { error: "Erro ao registrar feedback. Tente novamente mais tarde." },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { messages, context } = await req.json();

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        system: `Tu es un assistant analytics médical expert intégré dans un tableau de bord d'administration de téléconsultation.
Tu as accès aux données réelles de la plateforme fournies dans chaque message.
Réponds en français, de façon concise, claire et actionnable.
Utilise des chiffres précis tirés des données. Donne des recommandations concrètes quand c'est pertinent.
Ne dépasse pas 150 mots par réponse. Pas de markdown superflu, pas de listes à puces sauf si nécessaire.`,
        messages: [
          ...messages,
          {
            role: "user",
            content: `${context}\n\nQuestion : ${messages[messages.length - 1].content}`,
          },
        ].slice(0, -1), // on remplace le dernier message user par celui avec contexte
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json({ error: err }, { status: response.status });
    }

    const data = await response.json();
    const reply = data?.content?.[0]?.text ?? "Aucune réponse reçue.";
    return NextResponse.json({ reply });
  } catch (err) {
    console.error("AI Analytics error:", err);
    return NextResponse.json(
      { error: "Erreur serveur interne." },
      { status: 500 },
    );
  }
}

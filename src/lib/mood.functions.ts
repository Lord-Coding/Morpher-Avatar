import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const SHAPES = ["cercle", "galet", "squircle", "capsule", "triangle", "hexagone", "nuage", "goutte"];
const EXPRESSIONS = [
  "neutre", "attentif", "surpris", "excite", "heureux", "hilare", "colere", "triste", "effraye",
  "mefiant", "confus", "curieux", "fier", "timide", "blase", "somnolent", "monstrueux",
];
const COLORS = ["noir", "brun", "rouge", "orange", "jaune", "vert", "emeraude", "bleu", "violet", "rose", "gris", "creme"];

export type MoodSettings = {
  shape: string;
  expression: string;
  color: string;
  tempo: number;
  wobble: number;
  blinkEvery: number;
  summary: string;
};

const clamp = (n: unknown, min: number, max: number, def: number) => {
  const v = typeof n === "number" && Number.isFinite(n) ? n : def;
  return Math.min(max, Math.max(min, v));
};

export const generateMood = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ mood: z.string().trim().min(2).max(300) }).parse(data))
  .handler(async ({ data }): Promise<{ ok: true; settings: MoodSettings } | { ok: false; error: string }> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) return { ok: false, error: "Service IA non configuré." };

    const instructions = `Tu configures un avatar animé. Réponds UNIQUEMENT par un objet JSON avec:
shape (un de: ${SHAPES.join(", ")}), expression (un de: ${EXPRESSIONS.join(", ")}), color (un de: ${COLORS.join(", ")}),
tempo (vitesse de respiration, 0.3 à 3, 1 = normal), wobble (amplitude d'ondulation, 0 à 4, 1 = normal),
blinkEvery (intervalle moyen entre clignements en ms, 800 à 8000), summary (une phrase courte en français expliquant le choix).`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        instructions,
        input: `Ambiance souhaitée : ${data.mood}`,
        stream: true,
        store: false,
        reasoning: { effort: "low", summary: "auto" },
        include: ["reasoning.encrypted_content"],
      }),
    });

    if (!res.ok || !res.body) {
      if (res.status === 429) return { ok: false, error: "Trop de demandes, réessayez dans un instant." };
      if (res.status === 402) return { ok: false, error: "Crédits IA épuisés pour cet espace de travail." };
      if (res.status === 403) return { ok: false, error: "Accès au modèle refusé." };
      return { ok: false, error: `Génération impossible (${res.status}).` };
    }

    // Consume SSE stream, accumulate output text.
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let text = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const evt = JSON.parse(payload);
          if (evt.type === "response.output_text.delta" && typeof evt.delta === "string") text += evt.delta;
        } catch {
          /* partial */
        }
      }
    }

    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return { ok: false, error: "Le modèle n'a pas proposé de réglages." };
    let raw: { shape?: unknown; expression?: unknown; color?: unknown; tempo?: unknown; wobble?: unknown; blinkEvery?: unknown; summary?: unknown };
    try {
      raw = JSON.parse(match[0]);
    } catch {
      return { ok: false, error: "Réponse du modèle illisible." };
    }
    const pick = (v: unknown, list: string[], def: string) =>
      typeof v === "string" && list.includes(v) ? v : def;
    return {
      ok: true,
      settings: {
        shape: pick(raw.shape, SHAPES, "cercle"),
        expression: pick(raw.expression, EXPRESSIONS, "neutre"),
        color: pick(raw.color, COLORS, "noir"),
        tempo: clamp(raw.tempo, 0.3, 3, 1),
        wobble: clamp(raw.wobble, 0, 4, 1),
        blinkEvery: clamp(raw.blinkEvery, 800, 8000, 3500),
        summary: typeof raw.summary === "string" ? raw.summary.slice(0, 200) : "",
      },
    };
  });

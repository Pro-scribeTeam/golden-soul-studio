import { NextRequest, NextResponse } from "next/server";

const ANTHROPIC_MODEL = "claude-sonnet-4-6";

const SYSTEM_PROMPT = `You are a professional R&B songwriter and producer with deep knowledge of soul, trap-soul, neo-soul, afrobeats, and classic R&B. You write with precision, authenticity, and artistry.

Given a creative song brief, generate the following — nothing more, nothing less:

1. TITLES: Three distinct, evocative song title options (one per line, no numbering or bullets)
2. HOOK: A hook/chorus concept (2–4 lines). Write the actual lyric lines, not a description.
3. VERSE: A sample verse (4–8 lines) that precisely matches the stated vibe, motifs, lyric style, and language preference. Write the actual lyric lines.
4. CHORDS: A chord progression (e.g. "Dm7 – G7 – Cmaj7 – Am7 | repeat" or "i – VII – VI – VII in C minor").

Format your response EXACTLY like this — use these exact section headers:
TITLES:
[title 1]
[title 2]
[title 3]

HOOK:
[lyric lines]

VERSE:
[lyric lines]

CHORDS:
[progression]

Stay true to the brief. Be specific, evocative, and genre-accurate. Do not add commentary or explanations.`;

export async function POST(req: NextRequest) {
  try {
    const { brief } = await req.json();
    if (!brief?.trim()) {
      return NextResponse.json({ error: "Brief is required" }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
    }

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 1200,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: `Here is the song brief:\n\n${brief}` }],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Anthropic API error ${res.status}: ${errText.slice(0, 300)}`);
    }

    const data = await res.json();
    const raw = data.content?.[0]?.text || "";

    // Parse the structured response
    const extract = (section: string, nextSection: string) => {
      const start = raw.indexOf(`${section}:`);
      const end = nextSection ? raw.indexOf(`${nextSection}:`) : raw.length;
      if (start === -1) return "";
      return raw.slice(start + section.length + 1, end === -1 ? undefined : end).trim();
    };

    const titlesRaw = extract("TITLES", "HOOK");
    const titles = titlesRaw.split("\n").map((t: string) => t.trim()).filter(Boolean);
    const hook = extract("HOOK", "VERSE");
    const verse = extract("VERSE", "CHORDS");
    const chords = extract("CHORDS", "");

    return NextResponse.json({ titles, hook, verse, chords, raw });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[soulscript]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

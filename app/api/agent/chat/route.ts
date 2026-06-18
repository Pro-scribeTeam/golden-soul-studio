import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { callWavespeed, pollStatus } from "@/lib/wavespeed";

export const maxDuration = 300;

// ── Supabase ────────────────────────────────────────────────────────────────
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key);
}

// ── Constants ────────────────────────────────────────────────────────────────
const STUDIO_URL = "https://golden-soul-studio.vercel.app";
const ANTHROPIC_MODEL = "claude-sonnet-4-6";

const IMAGE_MODELS: Record<string, string> = {
  "nano-banana-pro":  "wavespeed-ai/flux-kontext-max/text-to-image",
  "nano-banana-2":    "wavespeed-ai/flux-2-klein-9b/text-to-image",
  "flux-dev":         "wavespeed-ai/flux-dev",
  "flux-kontext-max": "wavespeed-ai/flux-kontext-max/text-to-image",
  "flux-kontext-pro": "wavespeed-ai/flux-kontext-pro/text-to-image",
  "gpt-image-2":      "openai/gpt-image-2/text-to-image",
};
const T2V_MODELS: Record<string, string> = {
  "seedance-2.0":      "bytedance/seedance-2.0/text-to-video",
  "seedance-2.0-fast": "bytedance/seedance-2.0-fast/text-to-video",
};
const I2V_MODELS: Record<string, string> = {
  "kling-i2v":    "kwaivgi/kling-v3.0-std/image-to-video",
  "wan-i2v":      "alibaba/wan-2.7/image-to-video",
  "seedance-i2v": "bytedance/seedance-2.0/image-to-video",
};
const MOTION_MODELS: Record<string, string> = {
  "steadydancer":     "wavespeed-ai/steady-dancer",
  "kling-motion-pro": "kwaivgi/kling-v2.6-pro/motion-control",
};
const LIPSYNC_MODELS: Record<string, string> = {
  "infinitetalk":       "wavespeed-ai/infinitetalk",
  "infinitetalk-video": "wavespeed-ai/infinitetalk/video-to-video",
};
const SIZE_MAP: Record<string, string> = {
  "512px":  "512*512",
  "1024px": "1024*1024",
  "2048px": "2048*2048",
  "4K":     "2048*2048",
};
const QUALITY_MAP: Record<string, string> = {
  standard: "720p",
  high:     "1080p",
  ultra:    "1080p",
};
const COLOR_PRESETS: Record<string, { name: string; group: string; settings: Record<string, number> }> = {
  "golden-soul":     { name: "Golden Soul",        group: "Jeff M Dixon Brand", settings: { warmth: 35,  contrast: 15,  shadows: -10, highlights: 10,  saturation: 20,  vibrance: 15, grain: 10, vignette: 20, sharpness: 15, fade: 5,  tint: 5,   temperature: 30  } },
  "midnight-fedora": { name: "Midnight Fedora",    group: "Jeff M Dixon Brand", settings: { warmth: -20, contrast: 40,  shadows: -30, highlights: -10, saturation: -15, vibrance: 10, grain: 15, vignette: 40, sharpness: 20, fade: 0,  tint: -10, temperature: -15 } },
  "ivory-gospel":    { name: "Ivory Gospel",       group: "Jeff M Dixon Brand", settings: { warmth: 20,  contrast: -5,  shadows: 10,  highlights: 20,  saturation: -10, vibrance: 5,  grain: 5,  vignette: 10, sharpness: 10, fade: 10, tint: 5,   temperature: 15  } },
  "golden-hour":     { name: "Golden Hour",        group: "Natural",            settings: { warmth: 50,  contrast: 5,   shadows: -10, highlights: 20,  saturation: 35,  vibrance: 30, grain: 5,  vignette: 15, sharpness: 5,  fade: 0,  tint: 10,  temperature: 45  } },
  "teal-orange":     { name: "Teal + Orange",      group: "Cinematic",          settings: { warmth: 10,  contrast: 25,  shadows: -15, highlights: 5,   saturation: 25,  vibrance: 30, grain: 5,  vignette: 15, sharpness: 15, fade: 0,  tint: -15, temperature: 5   } },
};

// ── Drive sync config ────────────────────────────────────────────────────────
const DRIVE_SYNC_URL = "https://grodyvavlbuszjrvsnhb.supabase.co/functions/v1/drive-to-supabase-sync";
const DRIVE_SYNC_KEY = "goldensoul_sync_2026_secure";

// ── System prompt ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are Jordan Reed, Creative Director for Jeff M Dixon — an established independent soul artist from Fresno, CA relaunching his career.

JEFF M DIXON BRAND BRIEF:
- Sound: Trap Soul — he does it all
- Aesthetic: Golden Soul — Gold #C9A84C, Black #0A0A0F, Ivory #F5F0E8, Mint #6BBFB5
- Signature: Black wide-brim fedora — non-negotiable in every image
- Tagline: "Soul doesn't go out of style"
- Voice: Authentic, earned, never try-hard
- Archetype: The Lover + The Sage

JEFF'S PHYSICAL SPEC — LOCKED:
- Strong jaw, high cheekbones
- Deep-set dark brown eyes, full lips
- Warm medium-dark brown skin tone
- Styled two-strand twist locs — medium to long length, well maintained
- Black wide-brim fedora always present
- Broad shoulders, athletic build

REFERENCE IMAGES — permanent URLs:
- Face reference: https://grodyvavlbuszjrvsnhb.supabase.co/storage/v1/object/public/studio-uploads/jeff-dixon-reference-hd.jpg
- Logo: https://grodyvavlbuszjrvsnhb.supabase.co/storage/v1/object/public/studio-uploads/jeff-dixon-logo.png
- Step 1 outfit reference: https://grodyvavlbuszjrvsnhb.supabase.co/storage/v1/object/public/studio-uploads/output-1780634045006-wavespeed-ai-flux-kontext-max-text-to-image.jpg

CAREER RECEIPTS:
- #1 hit "Stay With Me" at age 18, independent
- "Eyes of An Angel" — follow up hit
- 4 songs on film soundtrack "Me and Mrs. Jones"
- Decades of production credits major + indie
- Turned down every bad deal — fully independent

CURRENT GOALS:
- Lock the anchor shot — face consistent, two-strand twist locs, black fedora
- Build caricature series from anchor shot
- Launch website, social media relaunch
- Drive streams on existing catalog
- Position for new music release

You have direct access to Golden Soul Studio's image and video generation tools. When Jeff asks for a visual — generate it immediately using your tools and display it inline in this chat. When you generate an image or video, include the permanent URL in your response.

DRIVE ASSETS — YOUR PERSONAL LIBRARY:
You have access to Jeff's synced Google Drive image library via the get_drive_assets tool. Use it to:
- Browse all of Jeff's real photos and reference images
- Pull a specific image by name or tag to use as a reference_image_url in generate_image
- Animate a real photo with generate_video (image-to-video)
- Use a real photo as the base for lip_sync or motion_transfer
When Jeff says "use my photo of..." or "that image of me in..." — call get_drive_assets first to find it, then use the returned URL directly in the next tool call.

Always think three steps ahead of what Jeff is asking. Never give suggestions without implementation. Default to excellence.`;

// ── Anthropic tool definitions ────────────────────────────────────────────────
const TOOLS = [
  {
    name: "generate_image",
    description: "Generate AI images via WaveSpeed. Use for any visual Jeff requests — photos, artwork, promotional images. Always include Jeff's physical spec in the prompt.",
    input_schema: {
      type: "object",
      required: ["prompt"],
      properties: {
        prompt: { type: "string", description: "Detailed image prompt including Jeff's full physical description" },
        model: { type: "string", description: "nano-banana-pro | flux-kontext-max (default) | flux-kontext-pro | gpt-image-2", default: "flux-kontext-max" },
        resolution: { type: "string", description: "512px | 1024px (default) | 2048px", default: "1024px" },
        style_intensity: { type: "number", description: "0-100, default 50", default: 50 },
        reference_image_url: { type: "string", description: "Optional reference/source image URL for image-to-image editing" },
      },
    },
  },
  {
    name: "generate_video",
    description: "Generate cinematic videos. Text-to-video or image-to-video (provide image_url to animate a still).",
    input_schema: {
      type: "object",
      required: ["prompt"],
      properties: {
        prompt: { type: "string" },
        model: { type: "string", description: "seedance-2.0 (default) | seedance-2.0-fast | kling-i2v | wan-i2v", default: "seedance-2.0" },
        duration: { type: "number", description: "2-15 seconds, default 5", default: 5 },
        aspect_ratio: { type: "string", description: "16:9 (default) | 9:16 | 1:1", default: "16:9" },
        image_url: { type: "string", description: "Starting frame URL for image-to-video" },
      },
    },
  },
  {
    name: "motion_transfer",
    description: "Transfer motion from a driving video onto a character image using SteadyDancer.",
    input_schema: {
      type: "object",
      required: ["character_image_url", "driving_video_url"],
      properties: {
        character_image_url: { type: "string" },
        driving_video_url: { type: "string" },
        model: { type: "string", description: "steadydancer (default) | kling-motion-pro", default: "steadydancer" },
        identity_strength: { type: "number", description: "0-100, default 75", default: 75 },
        motion_intensity: { type: "number", description: "0-100, default 75", default: 75 },
      },
    },
  },
  {
    name: "lip_sync",
    description: "Sync lip movements on a photo or video to an audio track using InfiniteTalk.",
    input_schema: {
      type: "object",
      required: ["video_or_photo_url", "audio_url"],
      properties: {
        video_or_photo_url: { type: "string" },
        audio_url: { type: "string" },
        model: { type: "string", description: "infinitetalk (default) | infinitetalk-video", default: "infinitetalk" },
        expression_intensity: { type: "number", description: "0-100, default 60", default: 60 },
      },
    },
  },
  {
    name: "color_grade",
    description: "Get Golden Soul Studio color grading preset settings for any brand or cinematic look.",
    input_schema: {
      type: "object",
      required: ["preset"],
      properties: {
        preset: { type: "string", description: "golden-soul | midnight-fedora | ivory-gospel | golden-hour | teal-orange" },
      },
    },
  },
  {
    name: "get_output_history",
    description: "Retrieve previously generated assets from the studio history.",
    input_schema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Number of results (default 10)", default: 10 },
        section: { type: "string", description: "image | video | motion | lipsync | all (default)", default: "all" },
      },
    },
  },
  {
    name: "get_drive_assets",
    description: "Browse Jeff's real photos and images synced from his Google Drive library. Use this to find a specific photo by name or tag, then use the returned supabase_url as a reference in generate_image, generate_video, lip_sync, or motion_transfer.",
    input_schema: {
      type: "object",
      properties: {
        category: { type: "string", description: "Filter by category: artist-photo | image | audio | video | brand-asset | ugc | album-art | other" },
        tag: { type: "string", description: "Filter by tag e.g. jeff-m-dixon | fedora | fresno | instagram | stay-with-me" },
        folder: { type: "string", description: "Filter by Drive folder name e.g. JEFF M DIXON Images" },
        limit: { type: "number", description: "Max results to return (default 20)", default: 20 },
      },
    },
  },
];

// ── WaveSpeed helpers ─────────────────────────────────────────────────────────
async function runWaveSpeed(modelId: string, input: Record<string, unknown>, timeoutMs = 280_000): Promise<string[]> {
  const submitJson = await callWavespeed(modelId, input);
  const requestId: string = submitJson.data?.id || submitJson.id;
  if (!requestId) throw new Error("No request ID from WaveSpeed");

  const deadline = Date.now() + timeoutMs;
  let attempt = 0;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 3000 + attempt * 200));
    attempt++;
    const status = await pollStatus(requestId);
    if (status.status === "completed" || (status.outputs && status.outputs.length > 0)) {
      return status.outputs || [];
    }
    if (status.status === "failed") throw new Error(status.error || "WaveSpeed generation failed");
  }
  throw new Error("WaveSpeed generation timed out");
}

async function uploadOutputs(urls: string[], modelId: string): Promise<string[]> {
  return Promise.all(urls.map(async (url) => {
    try {
      const isVideo = modelId.includes("video") || modelId.includes("motion") || modelId.includes("lipsync") || modelId.includes("infinitetalk") || modelId.includes("dancer");
      const ext = isVideo ? "mp4" : "jpg";
      const filename = `output-${Date.now()}-${modelId.replace(/\//g, "-")}.${ext}`;
      const res = await fetch(`${STUDIO_URL}/api/upload-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, filename }),
      });
      if (!res.ok) return url;
      const { url: cdnUrl } = await res.json();
      return cdnUrl || url;
    } catch {
      return url;
    }
  }));
}

// ── Tool execution ────────────────────────────────────────────────────────────
async function executeTool(name: string, input: Record<string, unknown>): Promise<{ result: string; imageUrls: string[] }> {
  switch (name) {
    case "generate_image": {
      const {
        prompt,
        model = "flux-kontext-max",
        resolution = "1024px",
        style_intensity = 50,
        reference_image_url,
      } = input as Record<string, string | number | undefined>;

      let modelId: string;
      let waveInput: Record<string, unknown>;

      if (reference_image_url) {
        modelId = "wavespeed-ai/flux-kontext-max";
        const guidanceScale = 1 + (Number(style_intensity) / 100) * 19;
        waveInput = { image: String(reference_image_url), prompt: String(prompt), guidance_scale: Math.round(guidanceScale * 10) / 10 };
      } else {
        modelId = IMAGE_MODELS[String(model)] || "wavespeed-ai/flux-kontext-max/text-to-image";
        waveInput = {
          prompt: String(prompt),
          size: SIZE_MAP[String(resolution)] || "1024*1024",
          num_images: 1,
          seed: -1,
          enable_sync_mode: false,
          guidance_scale: 3.5 + (Number(style_intensity) / 100) * 3.5,
        };
      }

      const rawUrls = await runWaveSpeed(modelId, waveInput);
      const imageUrls = await uploadOutputs(rawUrls, modelId);

      await saveToHistory("image", modelId, String(prompt), {}, imageUrls);

      return {
        result: `Image generated successfully.\nPermanent URL(s):\n${imageUrls.join("\n")}`,
        imageUrls,
      };
    }

    case "generate_video": {
      const { prompt, model = "seedance-2.0", duration = 5, aspect_ratio = "16:9", image_url } = input as Record<string, string | number | undefined>;
      const hasImage = Boolean(image_url);
      const modelId = hasImage
        ? (I2V_MODELS[String(model)] || "kwaivgi/kling-v3.0-std/image-to-video")
        : (T2V_MODELS[String(model)] || "bytedance/seedance-2.0/text-to-video");

      const waveInput: Record<string, unknown> = {
        prompt: String(prompt),
        duration: Math.min(15, Math.max(2, Number(duration))),
        resolution: QUALITY_MAP["standard"],
        aspect_ratio: String(aspect_ratio),
      };
      if (hasImage) waveInput.image_url = image_url;

      const rawUrls = await runWaveSpeed(modelId, waveInput, 280_000);
      const videoUrls = await uploadOutputs(rawUrls, modelId);

      await saveToHistory("video", modelId, String(prompt), {}, videoUrls);

      return {
        result: `Video generated successfully.\nPermanent URL(s):\n${videoUrls.join("\n")}`,
        imageUrls: videoUrls,
      };
    }

    case "motion_transfer": {
      const { character_image_url, driving_video_url, model = "steadydancer", identity_strength = 75, motion_intensity = 75 } = input as Record<string, string | number | undefined>;
      const modelId = MOTION_MODELS[String(model)] || "wavespeed-ai/steady-dancer";

      const rawUrls = await runWaveSpeed(modelId, {
        image_url: String(character_image_url),
        video_url: String(driving_video_url),
        identity_strength: Number(identity_strength) / 100,
        motion_strength: Number(motion_intensity) / 100,
      }, 280_000);
      const videoUrls = await uploadOutputs(rawUrls, modelId);

      await saveToHistory("motion", modelId, "", {}, videoUrls);

      return {
        result: `Motion transfer complete.\nPermanent URL(s):\n${videoUrls.join("\n")}`,
        imageUrls: videoUrls,
      };
    }

    case "lip_sync": {
      const { video_or_photo_url, audio_url, model = "infinitetalk", expression_intensity = 60 } = input as Record<string, string | number | undefined>;
      const modelId = LIPSYNC_MODELS[String(model)] || "wavespeed-ai/infinitetalk";

      const rawUrls = await runWaveSpeed(modelId, {
        video_url: String(video_or_photo_url),
        audio_url: String(audio_url),
        sync_mode: "auto",
        expression_intensity: Number(expression_intensity) / 100,
      }, 280_000);
      const videoUrls = await uploadOutputs(rawUrls, modelId);

      await saveToHistory("lipsync", modelId, "", {}, videoUrls);

      return {
        result: `Lip sync complete.\nPermanent URL(s):\n${videoUrls.join("\n")}`,
        imageUrls: videoUrls,
      };
    }

    case "color_grade": {
      const { preset } = input as { preset: string };
      const base = COLOR_PRESETS[preset];
      if (!base) return { result: `Unknown preset "${preset}". Available: ${Object.keys(COLOR_PRESETS).join(", ")}`, imageUrls: [] };
      return {
        result: JSON.stringify({ preset, preset_name: base.name, group: base.group, settings: base.settings }, null, 2),
        imageUrls: [],
      };
    }

    case "get_output_history": {
      const { limit = 10, section = "all" } = input as { limit?: number; section?: string };
      const qs = section !== "all" ? `?section=${encodeURIComponent(section)}` : "";
      const res = await fetch(`${STUDIO_URL}/api/supabase/history${qs}`, { headers: { "Cache-Control": "no-cache" } });
      const text = await res.text();
      if (!res.ok) return { result: `History fetch failed: ${text.slice(0, 200)}`, imageUrls: [] };
      const data = JSON.parse(text);
      const items = (Array.isArray(data) ? data : data.data || []).slice(0, Number(limit));
      return { result: JSON.stringify(items, null, 2), imageUrls: [] };
    }

    case "get_drive_assets": {
      const { category, tag, folder, limit = 20 } = input as { category?: string; tag?: string; folder?: string; limit?: number };
      const params = new URLSearchParams({ action: "list" });
      if (category) params.set("category", category);
      if (tag) params.set("tag", tag);
      if (folder) params.set("folder", folder);
      const res = await fetch(`${DRIVE_SYNC_URL}?${params}`, {
        headers: { "x-api-key": DRIVE_SYNC_KEY },
      });
      if (!res.ok) return { result: `Drive assets fetch failed: ${res.status}`, imageUrls: [] };
      const data = await res.json();
      const assets = (data.assets || []).slice(0, Number(limit));
      if (!assets.length) return { result: "No Drive assets found matching those filters.", imageUrls: [] };
      const summary = assets.map((a: { file_name: string; category: string; drive_folder: string; tags: string[]; supabase_url: string }) =>
        `- ${a.file_name} | category: ${a.category} | folder: ${a.drive_folder} | tags: ${(a.tags || []).join(", ")}\n  URL: ${a.supabase_url}`
      ).join("\n");
      return {
        result: `Found ${assets.length} asset(s):\n\n${summary}`,
        imageUrls: assets.map((a: { supabase_url: string }) => a.supabase_url),
      };
    }

    default:
      return { result: `Unknown tool: ${name}`, imageUrls: [] };
  }
}

// ── Save to studio_outputs history ───────────────────────────────────────────
async function saveToHistory(section: string, model: string, prompt: string, settings: Record<string, unknown>, urls: string[]) {
  try {
    for (const url of urls) {
      await fetch(`${STUDIO_URL}/api/supabase/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section, model, prompt, settings, output_url: url, user_id: "jeff_dixon", created_at: new Date().toISOString() }),
      });
    }
  } catch { /* non-fatal */ }
}

// ── Tool indicator labels ────────────────────────────────────────────────────
function toolIndicator(name: string, input: Record<string, unknown>): string {
  switch (name) {
    case "generate_image":  return `🎨 Generating image with ${input.model || "flux-kontext-max"}...`;
    case "generate_video":  return `🎬 Creating video with ${input.model || "seedance-2.0"}...`;
    case "motion_transfer": return `🕺 Running motion transfer...`;
    case "lip_sync":        return `💄 Syncing lip movements...`;
    case "color_grade":     return `🎨 Loading color preset...`;
    case "get_output_history": return `📁 Fetching output history...`;
    case "get_drive_assets":   return `🗂️ Browsing Drive library...`;
    default: return `⚙️ Running ${name}...`;
  }
}

// ── Maxwell Cruz system prompt ────────────────────────────────────────────────
const MAXWELL_SYSTEM_PROMPT = `You are Maxwell Cruz, Screenwriter and Story Director for Jeff M Dixon. You write music video scripts, short film treatments, and social content series with complete scene breakdowns and Golden Soul Studio prompts for each scene.

JEFF'S BRAND: Golden Soul. Signature: the fedora. Origin: Fresno church choir. #1 hit at 18. Never took a bad deal. New music dropping soon.

YOUR DELIVERABLES — always include these in every script:
- Full scene-by-scene script with dialogue and action
- Shot list with camera directions
- Storyboard notes describing each visual
- Ready-to-use Golden Soul Studio generation prompts per scene
- Model recommendation per scene (Kling 3.0 for cinematic, SteadyDancer for dance, LipSync-3 for performance, LTX for quick drafts)

NARRATIVE FOCUS: emotional arc, narrative structure, authentic storytelling that reflects Jeff's journey — earned, never try-hard. Every script must feel like it could only be Jeff M Dixon's story.

You know every WaveSpeed model deeply — Kling 3.0 for cinematic scenes, SteadyDancer for dance/motion transfer, LipSync-3 for performance sync, LTX for quick drafts. You write scripts that are immediately executable in Golden Soul Studio.

When asked for a script, deliver the full document — not a summary, not an outline. Complete. Executable. Scene by scene.`;

// ── Nova Vega system prompt ───────────────────────────────────────────────────
const NOVA_VEGA_SYSTEM_PROMPT = `You are Nova Vega, Video Producer for Jeff M Dixon. You are the production executor of Golden Soul Studio.

YOU KNOW EVERY MODEL TECHNICALLY:
- Nano Banana Pro: Jeff's portraits (character consistency first)
- Kling 3.0: cinematic music video scenes — 5-part prompt formula: Camera Movement + Scene Setup + Subject Action + Vibe/Lighting + Time/Audio, 20-50 words, always add negative prompts
- SteadyDancer: Jeff's dance scenes — match framing, 480p draft then 720p final
- LipSync-3: performance sync — process each shot separately
- LTX: fast iteration drafts
- Seedance: reliable social content

YOUR PRODUCTION WORKFLOW:
1. Read the script or brief
2. Select the right model per scene
3. Write the exact prompt (5-part formula for Kling)
4. Estimate credit cost before generating
5. Run quality control on every output
6. Optimize for platform: 9:16 for social, 16:9 for music video

CREDIT ESTIMATION (approximate):
- Image (Flux Kontext Max): ~0.05 credits
- Video 5s (Kling 3.0): ~1.5 credits
- Video 5s (Seedance): ~0.8 credits
- Motion transfer (SteadyDancer): ~1.2 credits
- Lip sync (InfiniteTalk): ~0.9 credits

Every frame is a decision. You make them on purpose. When given a script, produce a full production brief with model selections, exact prompts, platform specs, and credit estimate for every scene.`;

// ── Group system prompt ───────────────────────────────────────────────────────
const GROUP_SYSTEM_PROMPT = `You are facilitating a live creative team meeting for Jeff M Dixon. Three Golden Soul Studio specialists are collaborating together in this conversation:

JORDAN REED — Creative Director: visual concepts, image generation, anchor shots, brand aesthetic, Golden Soul color palette, campaign planning. He can generate images and videos directly.

MAXWELL CRUZ — Screenwriter & Story Director: music video scripts, short film treatments, social content series, scene breakdowns, narrative arc, emotional story structure. Delivers complete, executable Golden Soul Studio prompts per scene.

NOVA VEGA — Video Producer: model selection (Kling 3.0, SteadyDancer, LipSync-3, LTX, Seedance, Nano Banana Pro), production workflow, exact prompt formulas, credit estimation, platform optimization (9:16 social, 16:9 music video), quality control.

JEFF M DIXON BRAND CONTEXT:
- Sound: Trap Soul — he does it all
- Aesthetic: Golden Soul — Gold #C9A84C, Black #0A0A0F, Ivory #F5F0E8, Mint #6BBFB5
- Signature: Black wide-brim fedora — always present
- Origin: Fresno church choir. #1 hit at 18. Fully independent. Never took a bad deal. New music dropping soon.
- Tagline: "Soul doesn't go out of style"

FORMAT EVERY RESPONSE like a real working team session. Each specialist speaks from their domain. Use this exact format:

**Jordan Reed:**
[visual/creative direction — what it looks like, brand direction, image generation plan]

**Maxwell Cruz:**
[narrative/script — story structure, scene breakdown, dialogue, treatment]

**Nova Vega:**
[production execution — model, prompt formula, settings, credit estimate, platform specs]

COLLABORATION RULES:
- Agents build on each other's ideas — Nova references Maxwell's scenes, Jordan references Nova's model choices
- Not every agent needs to speak to every message — let the relevant specialist lead, others support briefly or skip
- Keep it a working session, not a panel debate — actionable, specific, executable
- When one agent generates something (Jordan), the others immediately react to it
- Disagreements are productive: if Nova thinks Maxwell's scene won't render well, she says so`;

// ── Main handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { message, session_id = "default", agent_id = "jordan" } = await req.json();
    if (!message?.trim()) return NextResponse.json({ error: "Message required" }, { status: 400 });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });

    const supabase = getSupabase();

    // Save user message
    await supabase.from("agent_conversations").insert({
      session_id,
      role: "user",
      content: message,
      image_urls: [],
      raw_content: message,
    });

    // Load recent session history — cap at 20 turns to stay under token limits
    const { data: historyRows } = await supabase
      .from("agent_conversations")
      .select("role, raw_content")
      .eq("session_id", session_id)
      .order("created_at", { ascending: false })
      .limit(20);

    type AnthropicMessage = { role: string; content: unknown };
    const messages: AnthropicMessage[] = (historyRows || []).reverse().map((r) => ({
      role: r.role,
      content: r.raw_content,
    }));

    // Select system prompt based on agent
    const systemPrompt =
      agent_id === "maxwell" ? MAXWELL_SYSTEM_PROMPT :
      agent_id === "nova"    ? NOVA_VEGA_SYSTEM_PROMPT :
      agent_id === "group"   ? GROUP_SYSTEM_PROMPT :
      SYSTEM_PROMPT;

    // Agentic loop
    const allImageUrls: string[] = [];
    const toolCallsMade: Array<{ name: string; indicator: string }> = [];
    let finalText = "";

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: ANTHROPIC_MODEL,
          max_tokens: 4096,
          system: systemPrompt,
          tools: TOOLS,
          messages,
        }),
      });

      if (!anthropicRes.ok) {
        const errText = await anthropicRes.text();
        // Retry once on rate limit after a short wait
        if (anthropicRes.status === 429) {
          await new Promise((r) => setTimeout(r, 8000));
          continue;
        }
        throw new Error(`Anthropic API error ${anthropicRes.status}: ${errText.slice(0, 300)}`);
      }

      const anthropicData = await anthropicRes.json();
      const responseContent: Array<{ type: string; text?: string; id?: string; name?: string; input?: Record<string, unknown> }> = anthropicData.content || [];
      const stopReason: string = anthropicData.stop_reason;

      const textBlocks = responseContent.filter((b) => b.type === "text");
      const toolUseBlocks = responseContent.filter((b) => b.type === "tool_use");
      const assistantText = textBlocks.map((b) => b.text || "").join("");

      if (stopReason === "tool_use" && toolUseBlocks.length > 0) {
        // Save assistant turn (may have text + tool_use blocks)
        await supabase.from("agent_conversations").insert({
          session_id,
          role: "assistant",
          content: assistantText,
          image_urls: [],
          raw_content: responseContent,
        });
        messages.push({ role: "assistant", content: responseContent });

        // Execute tools (sequentially to avoid WaveSpeed rate limits)
        const toolResults = [];
        for (const tool of toolUseBlocks) {
          const indicator = toolIndicator(tool.name!, tool.input || {});
          toolCallsMade.push({ name: tool.name!, indicator });

          const { result, imageUrls } = await executeTool(tool.name!, tool.input || {});
          allImageUrls.push(...imageUrls);

          toolResults.push({
            type: "tool_result",
            tool_use_id: tool.id!,
            content: result,
          });
        }

        // Save tool results as user turn (Anthropic format)
        await supabase.from("agent_conversations").insert({
          session_id,
          role: "user",
          content: "",
          image_urls: allImageUrls,
          raw_content: toolResults,
        });
        messages.push({ role: "user", content: toolResults });

        // Loop back to get Anthropic's response after tool results
        continue;
      }

      // Final response — no more tool calls
      finalText = assistantText;

      await supabase.from("agent_conversations").insert({
        session_id,
        role: "assistant",
        content: finalText,
        image_urls: allImageUrls,
        raw_content: responseContent,
      });

      break;
    }

    return NextResponse.json({
      content: finalText,
      images: allImageUrls,
      tool_calls: toolCallsMade,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[agent/chat]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

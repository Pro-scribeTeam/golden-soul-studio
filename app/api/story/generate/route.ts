import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 90;

// ── Model Registry (Part 1) ──────────────────────────────────────────────────
const MODEL_REGISTRY = `
JORDAN IMAGE MODEL DECISION TREE (hardcoded — no exceptions):
  IF isDraft === true         → flux-kontext-pro
  IF hasCharacter === true    → nano-banana-2  (character consistency — LOCKED)
  IF hasCharacter === false   → flux-kontext-max

NOVA VIDEO MODEL DECISION TREE (hardcoded — no exceptions):
  IF lipsync scene            → infinitetalk  (+flag: audio_required=true)
  IF dance/motion_transfer    → steadydancer
  IF isDraft === true         → seedance-2.0-fast
  DEFAULT                     → seedance-2.0

AVAILABLE MODELS:
  Jordan: nano-banana-2 | flux-kontext-max | flux-kontext-pro
  Nova:   seedance-2.0 | seedance-2.0-fast | steadydancer | infinitetalk

COLOR GRADES: golden-soul | midnight-fedora | ivory-gospel | golden-hour | teal-orange
`;

// ── nano-banana-2 Master Template (Part 8) ───────────────────────────────────
const NANO_BANANA_TEMPLATE = `
NANO-BANANA-2 LOCKED CHARACTER BLOCK (never changes — ever):
  Face: Black man · strong jaw · high cheekbones · deep set dark brown eyes · full lips · warm medium dark brown skin tone
  Hair: two strand twist locs · medium to long · well maintained
  Fedora: wide brim black fedora · exact shape preserved (EXCEPTION: SC-02 only — NO fedora — he hasn't earned it yet)
  Build: broad shoulders · athletic

OUTPUT SPEC (locked):
  Photorealistic · high end editorial quality · 1024px standard · 2048px for hero frames only
  Golden Soul Studio color tone · Soul artist energy — earned · never try-hard
  style_intensity: 50 default · 65 for hero frames
`;

// ── Maxwell Story Director System Prompt ─────────────────────────────────────
const MAXWELL_SYSTEM = `You are Maxwell Cruz, Story Director at Golden Soul Studio. You write production documents for AI music video generation pipelines.

You write with precision, emotional intelligence, and cinematic vision. Every word you write becomes a generation prompt or a production instruction. You never summarize or paraphrase when writing outputs — you write the exact words that Jordan and Nova will execute.

${MODEL_REGISTRY}

${NANO_BANANA_TEMPLATE}

JEFF M DIXON PROFILE:
  Black man — strong jaw — high cheekbones — deep set dark brown eyes — full lips — warm medium dark brown skin — two strand twist locs
  Signature: wide brim black fedora (always present EXCEPT origin/youth scenes)
  Origin: Fresno church choir. #1 hit at 18. Fully independent.
  Brand: Trap Soul. Aesthetic: Golden Soul.
  Current chapter: Building on his own terms. Every decision earned.

GOLDEN SOUL STUDIO COLOR GRADES:
  golden-soul:     Amber warm · cinematic baseline · Jeff's signature look
  midnight-fedora: Cold steel · desaturated · tension · no warmth
  ivory-gospel:    Soft gold · stained glass warmth · origin/sacred moments
  golden-hour:     Brighter · warmer · forward motion · resolution
  teal-orange:     High contrast · bold · cinematic blockbuster

OUTPUT RULES:
  · Return ONLY valid JSON — no explanation text, no markdown fences, no preamble
  · Follow the exact schema requested
  · Scene IDs: SC-01 through SC-06
  · Project ID: use the one provided
  · Placement tags format: [PROJECT_ID]-[SCENE_ID] e.g. JMDX-MV001-SC01
  · All generation prompts must use the nano-banana-2 locked character block when Jeff is in frame
  · Always route Jeff scenes to nano-banana-2, detail/environment inserts to flux-kontext-max`;

// ── Output type prompts ───────────────────────────────────────────────────────
const OUTPUT_PROMPTS: Record<string, string> = {
  script: `Generate a complete 6-scene music video script. Return JSON:
{
  "project_id": "[PROJECT_ID]",
  "output_type": "script",
  "status": "complete",
  "narrative_arc": "[ACT 1 · ACT 2 · ACT 3 summary]",
  "total_runtime_estimate": "[MM:SS]",
  "scenes": [
    {
      "scene_id": "SC-01",
      "scene_number": 1,
      "act": 1,
      "title": "[scene title]",
      "location": "[EXT/INT. LOCATION — SPECIFIC AREA]",
      "time_of_day": "[time]",
      "lighting_condition": "[detailed lighting description]",
      "action": "[2-3 sentences of cinematic action]",
      "dialogue": null or "[CHARACTER: line]",
      "vocal_performance_note": "[music/performance note]",
      "emotional_beat": "[EMOTION · EMOTION · EMOTION]",
      "duration_estimate_seconds": [number],
      "wardrobe": "[exact wardrobe description]",
      "transition_out": "[DISSOLVE/HARD CUT/SMASH CUT/SLOW DISSOLVE/MATCH CUT/FADE TO BLACK]"
    }
    ... 6 scenes total
  ]
}`,

  shot_list: `Generate a shot list with 2-3 shots per scene (12-14 total). Return JSON:
{
  "project_id": "[PROJECT_ID]",
  "output_type": "shot_list",
  "total_shots": [number],
  "shots": [
    {
      "shot_id": "SC01-SHOT-01A",
      "scene_id": "SC-01",
      "shot_type": "[WIDE/MEDIUM/CLOSE-UP/INSERT/TWO SHOT]",
      "framing": "[exact framing description]",
      "camera_move": "[STATIC/SLOW PUSH IN/TRACK RIGHT/ORBIT/etc]",
      "lens_feel": "[mm feel and depth description]",
      "duration_seconds": [number],
      "cut_type": "[cut description]",
      "nova_model": "[seedance-2.0 or infinitetalk based on scene type]"
    }
    ... all shots
  ]
}`,

  scene_breakdown: `Generate a complete scene breakdown for all 6 scenes. Return JSON:
{
  "project_id": "[PROJECT_ID]",
  "output_type": "scene_breakdown",
  "scenes": [
    {
      "scene_id": "SC-01",
      "location_type": "EXT or INT",
      "primary_subject": "[subject description]",
      "generation_method": "AI Generate",
      "a_roll_or_b_roll": "A-ROLL",
      "props": ["[prop list]"],
      "wardrobe_note": "[wardrobe]",
      "mood_tag": "[MOOD · MOOD · MOOD]",
      "jordan_task": "[exact image generation task description — word for word]",
      "jordan_model": "[nano-banana-2 or flux-kontext-max per decision tree]",
      "jordan_reference": "[reference image note]",
      "nova_task": "[exact video generation task description]",
      "nova_model": "[seedance-2.0 or infinitetalk per scene type]",
      "audio_required": true or false,
      "color_grade": "[preset name]",
      "placement_tag": "[PROJECT_ID]-[SCENE_ID]",
      "credit_estimate": [number]
    }
    ... 6 scenes
  ]
}`,

  storyboard_notes: `Generate frame-by-frame storyboard notes with exact generation prompts. Return JSON:
{
  "project_id": "[PROJECT_ID]",
  "output_type": "storyboard_notes",
  "frames": [
    {
      "frame_id": "SC01-BOARD-01",
      "scene_id": "SC-01",
      "shot_ref": "[shot id from shot list]",
      "visual_description": "[3-4 sentences of exact visual direction]",
      "mood": "[MOOD · MOOD · MOOD]",
      "jordan_model": "[model per decision tree]",
      "reference_image": "[reference note or null]",
      "nova_model": "[video model]",
      "audio_required": false,
      "generation_prompt": "[EXACT word-for-word prompt to pass to the model — include full nano-banana-2 character block for Jeff scenes]"
    }
    ... 2-3 frames per scene
  ]
}`,

  credit_estimate: `Generate a detailed credit estimate breakdown. Return JSON:
{
  "project_id": "[PROJECT_ID]",
  "output_type": "credit_estimate",
  "breakdown": [
    {
      "scene_id": "SC-01",
      "jordan_task": "[model — N frames]",
      "jordan_credits": [number],
      "nova_task": "[model — N clips]",
      "nova_credits": [number],
      "scene_total": [number]
    }
    ... 6 scenes
  ],
  "summary": {
    "jordan_total_credits": [number],
    "nova_total_credits": [number],
    "project_total_credits": [number],
    "current_balance": 120,
    "balance_after_generation": [120 minus total],
    "warning": null or "[warning text if balance low]",
    "approval_required": true
  }
}`,

  model_selection: `Generate the model selection log showing Jordan's routing decisions. Return JSON:
{
  "project_id": "[PROJECT_ID]",
  "output_type": "model_selection",
  "note": "[Brief routing summary]",
  "selections": [
    {
      "scene_id": "SC-01",
      "jordan_model": "[nano-banana-2 or flux-kontext-max]",
      "jordan_reason": "[reason from decision tree]",
      "jordan_insert_model": "[flux-kontext-max if insert shots present, else omit]",
      "jordan_insert_reason": "[insert reason if applicable]",
      "nova_model": "[seedance-2.0 or infinitetalk]",
      "nova_reason": "[reason from decision tree]",
      "nova_flag": "[AUDIO REQUIRED note if lipsync, else omit]"
    }
    ... 6 scenes
  ]
}`,
};

// ── Route handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const {
      output_type,
      project_brief,
      project_id = "JMDX-MV001",
      project_title,
      project_type,
      project_artist,
      previous_outputs,
    } = await req.json();

    if (!output_type || !project_brief?.trim()) {
      return NextResponse.json({ error: "output_type and project_brief are required" }, { status: 400 });
    }

    const outputPrompt = OUTPUT_PROMPTS[output_type];
    if (!outputPrompt) {
      return NextResponse.json({ error: `Unknown output_type: ${output_type}` }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });

    const contextBlock = previous_outputs
      ? `\nPREVIOUSLY GENERATED OUTPUTS (use these for consistency):\n${JSON.stringify(previous_outputs, null, 2)}\n`
      : "";

    const userMessage = `PROJECT ID: ${project_id}
PROJECT TITLE: ${project_title || "Untitled"}
PROJECT TYPE: ${project_type || "Music Video"}
ARTIST: ${project_artist || "Jeff M Dixon"}

PROJECT BRIEF:
${project_brief}
${contextBlock}
TASK: Generate ${output_type.replace(/_/g, " ").toUpperCase()}.

${outputPrompt.replace("[PROJECT_ID]", project_id)}`;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 4096,
        system: MAXWELL_SYSTEM,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Anthropic error ${res.status}: ${err.slice(0, 200)}`);
    }

    const data = await res.json();
    const raw = data.content?.[0]?.text || "";

    // Parse JSON from response
    let content: unknown;
    try {
      // Strip any markdown fences if Claude adds them
      const cleaned = raw.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim();
      content = JSON.parse(cleaned);
    } catch {
      // Return raw if not parseable JSON
      content = { raw };
    }

    return NextResponse.json({ content, output_type });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[story/generate]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

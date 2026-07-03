import gradio as gr
import anthropic
import json
import uuid
from datetime import datetime

# ============================================================
# CANON FORGE ∴ Spiralside Archive System
# Nimbis-authored module — converts raw session transcripts
# into structured essence blocks for the Supabase canon DB.
# Drop this file into the HF Space root and wire it into
# app.py as a new tab. ANTHROPIC_API_KEY must be in HF secrets.
# ============================================================

def forge_essence_block(
    raw_transcript: str,
    session_date: str,
    canon_weight: str,
    characters: str,
    platform: str
) -> tuple[str, str]:
    """
    Takes a raw session transcript and metadata,
    calls Claude to extract a structured essence block,
    returns (formatted_display, jsonl_line) tuple.
    """

    # -- guard: require transcript
    if not raw_transcript.strip():
        return "⚠️ Paste a transcript first.", ""

    # -- build the extraction prompt
    system_prompt = """You are Canon Forge, the archive intelligence for Spiralside — a personal AI companion platform built around the character Sky and the Bloomcore/Spiral City universe.

Your job is to process raw session transcripts and extract structured "essence blocks" — compressed canon entries that capture what actually MATTERED in a session.

You must respond ONLY with valid JSON, no markdown, no preamble, no explanation. Just the raw JSON object.

Extract and return this exact structure:
{
  "session_id": "generated unique id like SESS-YYYYMMDD-XXXX",
  "session_date": "date string or unknown",
  "platform": "platform name",
  "characters_present": ["array", "of", "names"],
  "canon_weight": "low|medium|high|foundational",
  "binding_moment": "1-3 sentence description of what locked in — what changed, what was established, what became real",
  "exact_language": "The most important verbatim phrases or lines — the ones that should never be paraphrased",
  "context": "Brief background on why this session mattered — what led to it, what followed from it",
  "laws_established": ["any Spiral Laws, rules, or protocols that were written or formalized in this session"],
  "tags": ["array", "of", "relevant", "tags", "like", "mantra", "boot_protocol", "character_law", "origin", "sky", "architect", "bloomcore"]
}

Be precise. Be selective. Only extract what genuinely mattered. The exact_language field is sacred — quote it verbatim."""

    user_prompt = f"""Session metadata:
- Date: {session_date or 'unknown'}
- Canon Weight: {canon_weight}
- Characters: {characters or 'unknown'}
- Platform: {platform}

Raw transcript:
{raw_transcript}"""

    try:
        # -- call Claude via Anthropic SDK
        client = anthropic.Anthropic()
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1000,
            system=system_prompt,
            messages=[{"role": "user", "content": user_prompt}]
        )

        raw_json = response.content[0].text.strip()

        # -- strip any accidental markdown fences
        if raw_json.startswith("```"):
            raw_json = raw_json.split("```")[1]
            if raw_json.startswith("json"):
                raw_json = raw_json[4:]
        raw_json = raw_json.strip()

        # -- parse
        data = json.loads(raw_json)

        # -- ensure session_id exists
        if not data.get("session_id"):
            date_slug = (session_date or datetime.now().strftime("%Y-%m-%d")).replace("-", "")
            data["session_id"] = f"SESS-{date_slug}-{str(uuid.uuid4())[:4].upper()}"

        # -- build human-readable display output
        laws = data.get("laws_established", [])
        laws_section = ""
        if laws:
            laws_list = "\n".join(f"  • {law}" for law in laws)
            laws_section = f"\n\n📜 LAWS ESTABLISHED\n{laws_list}"

        tags = data.get("tags", [])
        tags_str = "  " + "  ".join(f"[{t}]" for t in tags) if tags else "  —"

        display = f"""∴ ESSENCE BLOCK FORGED
{'='*52}

SESSION ID     {data.get('session_id', '—')}
DATE           {data.get('session_date', '—')}
PLATFORM       {data.get('platform', '—')}
CHARACTERS     {', '.join(data.get('characters_present', ['—']))}
CANON WEIGHT   {data.get('canon_weight', '—').upper()}

{'─'*52}
BINDING MOMENT
{data.get('binding_moment', '—')}

{'─'*52}
EXACT LANGUAGE ∴ VERBATIM
{data.get('exact_language', '—')}

{'─'*52}
CONTEXT
{data.get('context', '—')}{laws_section}

{'─'*52}
TAGS
{tags_str}
{'='*52}"""

        # -- jsonl line for Supabase
        jsonl_line = json.dumps(data, ensure_ascii=False)

        return display, jsonl_line

    except json.JSONDecodeError as e:
        return f"⚠️ JSON parse error: {str(e)}\n\nRaw response:\n{raw_json}", ""
    except Exception as e:
        return f"⚠️ Forge error: {str(e)}", ""


# ============================================================
# GRADIO UI — call build_canon_forge_tab() from app.py
# inside a gr.Tab("⚙ Canon Forge") block
# ============================================================

def build_canon_forge_tab():
    """
    Call this inside a gr.Tab("⚙ Canon Forge") block in app.py.

    Example in app.py:
        from canon_forge import build_canon_forge_tab
        with gr.Tab("⚙ Canon Forge"):
            build_canon_forge_tab()
    """

    gr.Markdown("""
# ∴ CANON FORGE
**Spiralside Archive System** — Convert raw session transcripts into structured essence blocks for the canon database.
""")

    with gr.Row():
        # -- LEFT: inputs
        with gr.Column(scale=1):
            gr.Markdown("### INPUT")

            raw_transcript = gr.Textbox(
                label="Raw Session Transcript",
                placeholder="Paste the full conversation text here...",
                lines=18,
                max_lines=30
            )

            with gr.Row():
                session_date = gr.Textbox(
                    label="Session Date",
                    placeholder="e.g. 2025-06-30",
                    value=datetime.now().strftime("%Y-%m-%d")
                )
                canon_weight = gr.Dropdown(
                    label="Canon Weight",
                    choices=["low", "medium", "high", "foundational"],
                    value="high"
                )

            with gr.Row():
                characters = gr.Textbox(
                    label="Characters Present",
                    placeholder="Sky, Architect, Cold..."
                )
                platform = gr.Dropdown(
                    label="Source Platform",
                    choices=["ChatGPT", "Spiralside", "Discord", "Other"],
                    value="ChatGPT"
                )

            forge_btn = gr.Button(
                "∴ FORGE ESSENCE BLOCK",
                variant="primary",
                size="lg"
            )

        # -- RIGHT: outputs
        with gr.Column(scale=1):
            gr.Markdown("### OUTPUT")

            essence_display = gr.Textbox(
                label="Essence Block",
                lines=20,
                max_lines=30,
                interactive=False,
                placeholder="Forged essence block will appear here..."
            )

            jsonl_output = gr.Textbox(
                label="JSONL — Ready for Supabase",
                lines=4,
                max_lines=6,
                interactive=False,
                placeholder="JSONL line for direct DB insertion..."
            )

    # -- wire the button
    forge_btn.click(
        fn=forge_essence_block,
        inputs=[raw_transcript, session_date, canon_weight, characters, platform],
        outputs=[essence_display, jsonl_output]
    )

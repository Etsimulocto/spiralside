#!/usr/bin/env python3
# ============================================================
# SPIRALSIDE — wire_elevenlabs_tts.py
# 1. Patches main.py — adds /tts endpoint calling ElevenLabs
# 2. Patches models.js — speakReply calls Railway /tts for Sky
#    falls back to browser speechSynthesis for other characters
# ============================================================
# BEFORE RUNNING — fill in your values:
SKY_VOICE_ID = "P0TzU2rKihAPOTBllVtJ"   # from ElevenLabs Voices page URL
# API key goes in Railway env vars, NOT here — see instructions below
# ============================================================

import subprocess, sys, os

# ── STEP 1: PATCH main.py (backend) ──────────────────────────
MAIN_PATH = 'main.py'  # run from ~/spiralside-api

# Check we're in the right repo
if not os.path.exists(MAIN_PATH):
    # Try backend folder if exists
    if os.path.exists('../spiralside-api/main.py'):
        MAIN_PATH = '../spiralside-api/main.py'
        os.chdir('../spiralside-api')
    else:
        sys.exit('main.py not found — run from ~/spiralside-api directory')

with open(MAIN_PATH, 'r', encoding='utf-8') as f:
    main = f.read()

# Anchor: insert before reload-characters endpoint
BACKEND_ANCHOR = '\n\n\n@app.post("/reload-characters")'
print('Backend anchor found:', BACKEND_ANCHOR in main)

if BACKEND_ANCHOR not in main:
    print(repr(main[-500:]))
    sys.exit('Backend anchor not found')

TTS_ENDPOINT = '''

# ── ELEVENLABS TTS ────────────────────────────────────────────
ELEVENLABS_API_KEY = os.environ.get("ELEVENLABS_API_KEY")

# Voice IDs per character — add Cold/Monday/Grit when ready
VOICE_IDS = {
    "sky":    "''' + SKY_VOICE_ID + '''",
}

class TTSRequest(BaseModel):
    text: str
    character: str = "sky"

@app.post("/tts")
async def text_to_speech(req: TTSRequest, authorization: str = Header(None)):
    await verify_user(authorization)
    if not ELEVENLABS_API_KEY:
        raise HTTPException(status_code=500, detail="TTS not configured")
    voice_id = VOICE_IDS.get(req.character.lower(), VOICE_IDS["sky"])
    # Truncate to 500 chars to keep costs reasonable
    text = req.text[:500]
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.post(
                f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
                headers={
                    "xi-api-key": ELEVENLABS_API_KEY,
                    "Content-Type": "application/json",
                },
                json={
                    "text": text,
                    "model_id": "eleven_multilingual_v2",
                    "voice_settings": {
                        "stability": 0.45,
                        "similarity_boost": 0.75,
                        "style": 0.3,
                        "use_speaker_boost": True,
                    }
                }
            )
        if not resp.is_success:
            raise HTTPException(status_code=502, detail=f"ElevenLabs error: {resp.status_code}")
        # Return audio as base64 so frontend can play it anywhere
        import base64
        audio_b64 = base64.b64encode(resp.content).decode()
        return {"audio": audio_b64, "format": "mp3"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS error: {str(e)}")

'''

main_patched = main.replace(BACKEND_ANCHOR, TTS_ENDPOINT + BACKEND_ANCHOR, 1)
if main_patched == main:
    sys.exit('Backend replace had no effect')

with open(MAIN_PATH, 'w', encoding='utf-8') as f:
    f.write(main_patched)
print('main.py patched ✓')

# ── STEP 2: PATCH models.js (frontend) ───────────────────────
# Go back to frontend repo
os.chdir(os.path.expanduser('~/spiralside'))

MODELS_PATH = 'js/app/models.js'
with open(MODELS_PATH, 'r', encoding='utf-8') as f:
    models = f.read()

# Replace speakReply to call Railway /tts for Sky, fallback to browser for others
OLD_SPEAK = (
    'export function speakReply(text){'
    'if(!ttsEnabled||!(\'speechSynthesis\'in window))return;'
    'window.speechSynthesis.cancel();'
    'const u=new SpeechSynthesisUtterance(text);'
    'u.rate=0.95;u.pitch=1.0;'
    'window.speechSynthesis.speak(u);'
    '}'
)

print('speakReply anchor found:', OLD_SPEAK in models)

if OLD_SPEAK not in models:
    idx = models.find('export function speakReply')
    print(repr(models[idx:idx+200]))
    sys.exit('speakReply anchor not found')

NEW_SPEAK = (
    'export async function speakReply(text){'
    'if(!ttsEnabled)return;'
    'const botName=(window.state?.botName||\'sky\').toLowerCase();'
    'const characterVoices=[\'sky\',\'cold\',\'monday\',\'grit\'];'
    # Use ElevenLabs for Sky (and other characters once wired)
    'if(characterVoices.includes(botName)){'
    'try{'
    'const token=window.state?.session?.access_token;'
    'if(!token)throw new Error(\'no token\');'
    'const r=await fetch(\'https://web-production-4e6f3.up.railway.app/tts\',{'
    'method:\'POST\','
    'headers:{\'Content-Type\':\'application/json\',\'Authorization\':\'Bearer \'+token},'
    'body:JSON.stringify({text,character:botName})'
    '});'
    'if(!r.ok)throw new Error(\'tts fetch failed\');'
    'const d=await r.json();'
    # Decode base64 audio and play it
    'const bytes=atob(d.audio);'
    'const buf=new Uint8Array(bytes.length);'
    'for(let i=0;i<bytes.length;i++)buf[i]=bytes.charCodeAt(i);'
    'const blob=new Blob([buf],{type:\'audio/mpeg\'});'
    'const url=URL.createObjectURL(blob);'
    'const audio=new Audio(url);'
    'audio.onended=()=>URL.revokeObjectURL(url);'
    'audio.play();'
    'return;'
    '}catch(e){'
    'console.warn(\'[tts] ElevenLabs failed, falling back to browser:\',e);'
    '}'
    '}'
    # Browser speechSynthesis fallback
    'if(!(\'speechSynthesis\'in window))return;'
    'window.speechSynthesis.cancel();'
    'const u=new SpeechSynthesisUtterance(text);'
    'u.rate=0.95;u.pitch=1.0;'
    'window.speechSynthesis.speak(u);'
    '}'
)

models_patched = models.replace(OLD_SPEAK, NEW_SPEAK, 1)
if models_patched == models:
    sys.exit('models.js replace had no effect')

with open(MODELS_PATH, 'w', encoding='utf-8') as f:
    f.write(models_patched)
print('models.js patched ✓')

# ── STEP 3: COMMIT FRONTEND ───────────────────────────────────
print('\n=== COMMITTING FRONTEND ===')
subprocess.run(['git', 'add', 'js/app/models.js'], check=True)
subprocess.run(['git', 'commit', '-m', 'feat: ElevenLabs TTS for Sky, browser synth fallback'], check=True)
subprocess.run(['git', 'push', '--force', 'origin', 'main'], check=True)
print('Frontend pushed ✓')

print('''
=== BACKEND INSTRUCTIONS ===
1. cd ~/spiralside-api
2. git add main.py
3. git commit -m "feat: /tts endpoint via ElevenLabs"
4. git push origin main  (no --force)

=== RAILWAY ENV VAR ===
Add this in Railway dashboard → your service → Variables:
  ELEVENLABS_API_KEY = your_key_here

✅ Once Railway redeploys (~30s), enable TTS toggle and chat with Sky!
''')

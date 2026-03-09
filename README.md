# YouTube AI Automation

A local CLI tool that fully automates YouTube Shorts creation — from idea generation to upload. One command, fully produced Short.

**Idea → Script → Images → Voice → Video → Upload**

## How It Works

```
npx ts-node src/cli.ts run --count 5 --style pov --niche "ancient history"
```

The pipeline runs 6 steps automatically:

1. **Idea Generation** — OpenAI generates viral video ideas with hooks and curiosity gaps
2. **Script Writing** — Creates a scene-by-scene script with narration + image prompts
3. **Image Generation** — DALL-E 3 generates cinematic images for each scene (4-7 per video)
4. **Voice Generation** — ElevenLabs converts the script into natural voiceover
5. **Video Building** — FFmpeg combines images + voice into a 1080x1920 vertical Short
6. **YouTube Upload** — Uploads directly to your YouTube channel via API

## Setup

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
git clone https://github.com/thecurioussailor/youtube-ai-automation.git
cd youtube-ai-automation
npm install
```

### API Keys

Copy the example env file and fill in your keys:

```bash
cp .env.example .env
```

| Variable | Where to get it |
|----------|----------------|
| `OPENAI_API_KEY` | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| `ELEVENLABS_API_KEY` | [elevenlabs.io](https://elevenlabs.io) — free tier gives 10k chars/month |

### YouTube API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable **YouTube Data API v3**
4. Go to **Credentials** → Create **OAuth 2.0 Client ID** → select **Desktop app**
5. Download the credentials JSON
6. Save it as `credentials.json` in the project root
7. On first run, you'll be prompted to authorize via browser — the token is saved for future runs

## Usage

### Full Pipeline

```bash
# Generate and upload 1 video
npx ts-node src/cli.ts run

# Generate 5 videos at once
npx ts-node src/cli.ts run --count 5

# Specific style
npx ts-node src/cli.ts run --style pov --niche "ancient history"

# Custom prompt
npx ts-node src/cli.ts run --prompt "Ideas about mysterious places no human has visited in 100 years"

# Combine options
npx ts-node src/cli.ts run --count 3 --style scary --niche "deep ocean"
```

### Individual Commands

```bash
# Generate ideas only
npx ts-node src/cli.ts ideas
npx ts-node src/cli.ts ideas --count 10 --style didyouknow --niche science

# Generate a script from an idea
npx ts-node src/cli.ts script "POV: You wake up as a Viking warrior in 900 AD"

# Generate voiceover from text
npx ts-node src/cli.ts voice "Your script text here"

# Build video from existing assets in output/
npx ts-node src/cli.ts video

# Upload a video to YouTube
npx ts-node src/cli.ts upload "Your Video Title"
```

### Available Styles

| Style | Format | Example |
|-------|--------|---------|
| `pov` | Point of View | POV: You wake up as a Roman soldier in 120 AD |
| `storytime` | Storytime | The day I accidentally became a millionaire |
| `didyouknow` | Facts | Did you know your brain deletes memories while you sleep? |
| `whatif` | What If | What if gravity stopped for 5 seconds? |
| `ranked` | Top / Ranked | Top 3 foods that are slowly killing you |
| `scary` | Horror | The last thing he saw before the lights went out |
| `motivation` | Motivational | You're one decision away from a completely different life |

## Output

Each video gets its own folder:

```
output/
├── video_1/
│   ├── script.json
│   ├── images/
│   │   ├── scene1.png
│   │   ├── scene2.png
│   │   ├── scene3.png
│   │   ├── scene4.png
│   │   └── scene5.png
│   ├── audio/
│   │   └── voice.mp3
│   └── videos/
│       └── 1.mp4
├── video_2/
│   └── ...
```

## Cost Per Video

| Service | Cost |
|---------|------|
| OpenAI GPT-4o-mini (ideas + script) | ~$0.01 |
| DALL-E 3 (4-7 images) | ~$0.16 - $0.28 |
| ElevenLabs (voiceover) | Free tier / ~$0.01 |
| **Total** | **~$0.18 - $0.30** |

## Tech Stack

- **TypeScript** + **Node.js** — CLI runtime
- **OpenAI GPT-4o-mini** — idea and script generation
- **DALL-E 3** — scene image generation
- **ElevenLabs** — text-to-speech voiceover
- **FFmpeg** — video composition (via fluent-ffmpeg)
- **YouTube Data API v3** — automated uploads
- **Commander.js** — CLI framework

## Project Structure

```
src/
├── cli.ts                 # CLI entry point with all commands
├── pipeline/
│   └── runPipeline.ts     # Full pipeline orchestrator
├── generators/
│   ├── ideas.ts           # Idea generation (OpenAI)
│   ├── script.ts          # Script generation with scenes (OpenAI)
│   ├── images.ts          # Image generation (DALL-E 3)
│   └── voice.ts           # Voice generation (ElevenLabs)
├── video/
│   └── buildVideo.ts      # FFmpeg video builder
└── youtube/
    ├── auth.ts            # YouTube OAuth2 authentication
    ├── channels.ts        # Channel selection for multi-channel support
    └── upload.ts          # YouTube video upload
```

## License

MIT

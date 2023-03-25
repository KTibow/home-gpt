# Home GPT

I tried to let ChatGPT access Home Assistant. It doesn't get what you mean half the time but if you guide it it knows how to do stuff like tell you the forecast, or say its name on an Alexa device. Open to PRs.

## Setup

1. Add your secrets to a `.env` file:

```
HA_TOKEN=ey[etc, get this from the profile tab]
HA_ENDPOINT="http://homeassistant.local:8123"
AI_TOKEN=[obtain this from the openai site]
```

2. `npm i`
3. `npm run dev`

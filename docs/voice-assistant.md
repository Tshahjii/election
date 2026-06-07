# Election Swara Voice Assistant

Election Swara is a free local voice assistant built into the React frontend. It does not require paid APIs, subscriptions, or premium services.

## Free Technologies Used

- Speech-to-text: Browser Web Speech API
- Text-to-speech: Browser Speech Synthesis API
- Storage: Browser localStorage
- Weather: Open-Meteo public API
- News: Hacker News public API
- Wikipedia: Wikipedia public REST API
- Optional local AI: Ollama running on `localhost:11434`

## Main Commands

- `Employee page खोलिए`
- `इस popup में क्या भरना है?`
- `Mobile field में क्या डालना है?`
- `Google search election rules`
- `YouTube search polling training`
- `calculate 25 + 30`
- `weather Jaipur`
- `Wikipedia Election Commission of India`
- `add task report बनाना`
- `add note meeting at 5`
- `remind me call officer tomorrow`
- `project के modules बताइए`
- `dark mode` or `light mode`

## Local Storage

The assistant stores these items in browser localStorage:

- Conversation history
- Command history
- Settings
- To-do list
- Notes
- Reminders

## Optional Ollama

Ollama is optional and local-only. Install Ollama, run a local model, then enable `Optional local AI via Ollama` in assistant settings.

Example local model:

```bash
ollama run llama3.2:3b
```

No OpenAI, Gemini, paid weather, paid news, or premium voice API is used.

## Screen And Modal Guidance

When a form or modal popup is open, ask:

```text
इस popup में क्या भरना है?
```

Swara scans visible fields, buttons, errors, and known project metadata, then explains required fields, mobile digit rules, button location, and the next step.

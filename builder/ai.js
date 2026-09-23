// Bring-your-own-key calls, straight from the browser to the vendor.
// Every vendor here was checked to allow browser (CORS) requests; the key never
// touches any server of ours, because there isn't one.
import { MASTER_PROMPT, SINGLE_FIELD_SUFFIX } from "./master-prompt.js?v=6642774";

export const VENDORS = {
  anthropic: {
    label: "Anthropic (Claude)",
    keyHint: "sk-ant-…",
    keyUrl: "https://console.anthropic.com/settings/keys",
    fallbackModels: ["claude-opus-5", "claude-sonnet-5", "claude-haiku-4-5"],
    async listModels(key) {
      const r = await fetch("https://api.anthropic.com/v1/models?limit=100", {
        headers: {
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
      });
      if (!r.ok) throw new Error(await errorText(r));
      return (await r.json()).data.map((m) => m.id);
    },
    async complete(key, model, system, user, opts = {}) {
      const parts = [];
      if (opts.image) {
        const [meta, b64] = opts.image.split(",");
        parts.push({ type: "image", source: { type: "base64",
          media_type: (meta.match(/data:([^;]+)/) || [, "image/jpeg"])[1], data: b64 } });
      }
      parts.push({ type: "text", text: user });
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model,
          max_tokens: 8000,
          system,
          messages: [{ role: "user", content: parts }],
        }),
      });
      if (!r.ok) throw new Error(await errorText(r));
      const data = await r.json();
      if (data.stop_reason === "refusal") throw new Error("The model declined this request.");
      return (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("");
    },
  },

  openai: {
    label: "OpenAI",
    keyHint: "sk-…",
    keyUrl: "https://platform.openai.com/api-keys",
    fallbackModels: [],
    async listModels(key) {
      const r = await fetch("https://api.openai.com/v1/models", {
        headers: { authorization: `Bearer ${key}` },
      });
      if (!r.ok) throw new Error(await errorText(r));
      return (await r.json()).data.map((m) => m.id).filter((id) => /^(gpt|o[0-9])/.test(id)).sort();
    },
    async complete(key, model, system, user, opts = {}) {
      const content = opts.image
        ? [{ type: "text", text: user }, { type: "image_url", image_url: { url: opts.image } }]
        : user;
      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model,
          messages: [{ role: "system", content: system }, { role: "user", content }],
        }),
      });
      if (!r.ok) throw new Error(await errorText(r));
      return (await r.json()).choices[0].message.content || "";
    },
  },

  gemini: {
    label: "Google (Gemini)",
    keyHint: "AIza…",
    keyUrl: "https://aistudio.google.com/apikey",
    fallbackModels: [],
    async listModels(key) {
      const r = await fetch("https://generativelanguage.googleapis.com/v1beta/models?pageSize=200", {
        headers: { "x-goog-api-key": key },
      });
      if (!r.ok) throw new Error(await errorText(r));
      return (await r.json()).models
        .filter((m) => (m.supportedGenerationMethods || []).includes("generateContent"))
        .map((m) => m.name.replace(/^models\//, ""));
    },
    async complete(key, model, system, user, opts = {}) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
      const parts = [{ text: user }];
      if (opts.image) {
        const [meta, b64] = opts.image.split(",");
        parts.push({ inline_data: { mime_type: (meta.match(/data:([^;]+)/) || [, "image/jpeg"])[1], data: b64 } });
      }
      const r = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: system }] },
          contents: [{ role: "user", parts }],
        }),
      });
      if (!r.ok) throw new Error(await errorText(r));
      const data = await r.json();
      const reply = data.candidates?.[0]?.content?.parts || [];
      return reply.map((p) => p.text || "").join("");
    },
  },

  local: {
    label: "Your own machine (Ollama, LM Studio, llama.cpp…)",
    keyHint: "usually blank",
    keyOptional: true,
    needsBaseUrl: true,
    baseUrlHint: "http://localhost:11434/v1",
    keyUrl: "",
    fallbackModels: [],
    setup: [
      "Ollama: it only answers pages it has been told to trust. Set OLLAMA_ORIGINS to this page's address (or *) and restart it — on Linux, systemctl edit ollama; on Windows, an environment variable.",
      "LM Studio: start the local server and turn on CORS in its server settings.",
      "Use http://localhost, not a LAN address like 192.168.x.x — a secure page is allowed to reach localhost, but not a plain-http address elsewhere on your network.",
      "Running the builder from your own machine avoids all of this: download the repo and open the page from localhost.",
    ],
    async listModels(key, opts = {}) {
      const r = await fetch(`${base(opts)}/models`, { headers: authHeader(key) });
      if (!r.ok) throw new Error(await errorText(r));
      const data = await r.json();
      return (data.data || data.models || []).map((m) => m.id || m.name).sort();
    },
    async complete(key, model, system, user, opts = {}) {
      const r = await fetch(`${base(opts)}/chat/completions`, {
        method: "POST",
        headers: { "content-type": "application/json", ...authHeader(key) },
        body: JSON.stringify({
          model,
          messages: [{ role: "system", content: system },
                     { role: "user", content: opts.image
                       ? [{ type: "text", text: user }, { type: "image_url", image_url: { url: opts.image } }]
                       : user }],
          stream: false,
          // Thinking models otherwise spend the whole budget reasoning and
          // return empty content. Servers that don't know the field ignore it.
          reasoning_effort: "none",
        }),
      });
      if (!r.ok) throw new Error(await errorText(r));
      const data = await r.json();
      return data.choices?.[0]?.message?.content || "";
    },
  },

  openrouter: {
    label: "OpenRouter (any model)",
    keyHint: "sk-or-…",
    keyUrl: "https://openrouter.ai/keys",
    fallbackModels: [],
    async listModels() {
      const r = await fetch("https://openrouter.ai/api/v1/models");
      if (!r.ok) throw new Error(await errorText(r));
      return (await r.json()).data.map((m) => m.id).sort();
    },
    async complete(key, model, system, user, opts = {}) {
      const content = opts.image
        ? [{ type: "text", text: user }, { type: "image_url", image_url: { url: opts.image } }]
        : user;
      const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model,
          messages: [{ role: "system", content: system }, { role: "user", content }],
        }),
      });
      if (!r.ok) throw new Error(await errorText(r));
      return (await r.json()).choices[0].message.content || "";
    },
  },
};

function base(opts) {
  const url = (opts.baseUrl || "http://localhost:11434/v1").trim().replace(/\/+$/, "");
  return url.endsWith("/v1") || /\/v\d+$/.test(url) ? url : `${url}/v1`;
}
function authHeader(key) {
  return key ? { authorization: `Bearer ${key}` } : {};
}

async function errorText(response) {
  let detail = "";
  try {
    const body = await response.json();
    detail = body.error?.message || body.error?.type || JSON.stringify(body).slice(0, 200);
  } catch {
    detail = (await response.text().catch(() => "")).slice(0, 200);
  }
  if (response.status === 401) return `Key rejected (401). ${detail}`;
  if (response.status === 403) return `403 — a local server usually means it is refusing this page's origin. See the setup notes. ${detail}`;
  if (response.status === 429) return `Rate limited or out of credit (429). ${detail}`;
  return `${response.status}: ${detail}`;
}

// Models answer with JSON, sometimes wrapped in a fence or a sentence.
export function parseReply(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1] : text;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("The model did not return JSON.");
  const parsed = JSON.parse(raw.slice(start, end + 1));
  if (!parsed.fields || typeof parsed.fields !== "object") throw new Error("The model's JSON had no fields.");
  return parsed;
}

export function buildFileRequest({ file, lore, context, instruction }) {
  const user = [
    "Here is the export file this builder produced from everything the author filled in. It is exactly the file they are about to download.",
    "```\n" + file + "\n```",
    lore ? `THE AUTHOR'S LORE — plain English notes that are NOT in the file. This is the raw material behind the card. Use it; do not paste it back verbatim.\n${lore}` : "",
    ...(context || []),
    instruction ? `WHAT THE AUTHOR ASKED FOR:\n${instruction}` : "",
    "SEND BACK THE SAME FILE. Same header, same FIELD 1 to FIELD 4 banners, same labels, same brackets, same fixed blocks, same order. Change only the words inside each field's value: fill what is empty, sharpen what is thin, leave alone what is already good. Any line reading [nothing written yet] is yours to write. Return the file and nothing else — no explanation before or after, no code fence.",
  ].filter(Boolean).join("\n\n");

  return { system: MASTER_PROMPT, user };
}


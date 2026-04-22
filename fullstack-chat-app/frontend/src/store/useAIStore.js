import { create } from "zustand";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const useAIStore = create((set, get) => ({
    apiKey: localStorage.getItem("ai_api_key") || "",
    modelName: localStorage.getItem("ai_model_name") || "openrouter/auto",
    provider: localStorage.getItem("ai_provider") || "openrouter",
    isConfigured: !!localStorage.getItem("ai_api_key"),
    messages: [],
    isLoading: false,

    setApiKey: (key) => {
        localStorage.setItem("ai_api_key", key);
        set({ apiKey: key, isConfigured: !!key });
    },

    setModelName: (name) => {
        localStorage.setItem("ai_model_name", name);
        set({ modelName: name });
    },

    setProvider: (provider) => {
        localStorage.setItem("ai_provider", provider);
        set({ provider });
    },

    clearConfig: () => {
        localStorage.removeItem("ai_api_key");
        localStorage.removeItem("ai_model_name");
        localStorage.removeItem("ai_provider");
        set({ apiKey: "", modelName: "openrouter/auto", provider: "openrouter", isConfigured: false });
    },

    addMessage: (role, text) => {
        set((state) => ({
            messages: [...state.messages, { role, text, timestamp: Date.now() }]
        }));
    },

    // Calls the AI API
    askAI: async (prompt, systemContext = "") => {
        const { apiKey, modelName, provider, addMessage } = get();

        if (!apiKey) {
            addMessage("system", "Please configure your API Key first.");
            return;
        }

        set({ isLoading: true });
        addMessage("user", prompt);

        try {
            const url = provider === "groq" 
                ? "https://api.groq.com/openai/v1/chat/completions"
                : "https://openrouter.ai/api/v1/chat/completions";

            const headers = {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            };

            if (provider === "openrouter") {
                headers["HTTP-Referer"] = window.location.origin;
                headers["X-Title"] = "QuickChat Collab";
            }

            const response = await fetch(url, {
                method: "POST",
                headers: headers,
                body: JSON.stringify({
                    model: modelName,
                    messages: [
                        { role: "system", content: systemContext },
                        { role: "user", content: prompt }
                    ],
                    max_tokens: provider === "groq" ? 1024 : 2000
                })
            });

            if (response.status === 429) {
                throw new Error("Rate limit exceeded. Please wait a moment or switch to a different model.");
            }

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error?.message || `Failed to fetch from ${provider}`);
            }

            const data = await response.json();
            const text = data.choices[0]?.message?.content || "No response received.";

            addMessage("assistant", text);
            return text;

        } catch (error) {
            console.error("AI Error:", error);
            addMessage("error", `Error: ${error.message || "Failed to get response from AI"}`);
        } finally {
            set({ isLoading: false });
        }
    }
}));

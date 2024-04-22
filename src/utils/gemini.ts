import { GoogleGenerativeAI } from "@google/generative-ai";

export interface History {
    role: string;
    parts: { text: string }[];
}

export enum BOT_ERROR_CODES {
    SAFETY = "Candidate was blocked due to SAFETY",
}

export class GeminiChat {
    private model: any;

    constructor(apiKey?: string) {
        if (!apiKey) {
            apiKey = process.env.GEMINI_API_KEY!;
            console.log("using sciMeet gemini api key");
        } else {
            console.log("using user gemini api key");
        }
        const genAI = new GoogleGenerativeAI(apiKey);
        this.model = genAI.getGenerativeModel({ model: "gemini-pro" });
    }

    async askGemini(msg: string, history: History[]) {
        console.log("history", history, msg);
        const chat = await this.model.startChat({
            history,
            generationConfig: {
                maxOutputTokens: 1000,
            },
        });
        const result = await chat.sendMessage(msg);
        try {
            const response = await result.response;
            console.log(response);
            const text = response.text();
            console.log("text", text);
            return text;
        } catch (err: any) {
            console.log("error1", { err }, err.message, err.code);
            if (err?.message.includes(BOT_ERROR_CODES.SAFETY)) {
                return BOT_ERROR_CODES.SAFETY;
            }
        }
    }
}

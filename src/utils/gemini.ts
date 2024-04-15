import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const model = genAI.getGenerativeModel({ model: "gemini-pro" });

export interface History {
    role: string;
    parts: { text: string }[];
}

export async function askGemini(msg: string, history: History[]) {
    // const result = await model.generateContent(prompt);
    const chat = await model.startChat({
        history,
        generationConfig: {
            maxOutputTokens: 1000,
        },
    });
    const result = await chat.sendMessage(msg);
    const response = await result.response;
    console.log(response);
    const text = response.text();
    console.log("text", text);
    return text;
}

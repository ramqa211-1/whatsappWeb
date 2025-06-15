require('dotenv').config();
const { OpenAI } = require('openai');
const fs = require('fs');
const fetch = require('node-fetch');
const FormData = require('form-data');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const functions = [
    {
        name: "send_file_to_email",
        description: "Send a file to a specific email address",
        parameters: {
            type: "object",
            properties: {
                filePath: { type: "string" },
                to: { type: "string" },
                subject: { type: "string" },
                text: { type: "string" }
            },
            required: ["filePath", "to"]
        }
    }
];

(async () => {
    const userPrompt = `
Send an email to ramvt2@gmail.com with subject: "Test from my email agent" and text: "If you're seeing this, everything works perfectly. No file required anymore."
`;

    const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
            { role: "user", content: userPrompt }
        ],
        functions,
        function_call: "auto"
    });

    const fnCall = response.choices[0]?.message?.function_call;
    if (fnCall?.name === "send_file_to_email") {
        const args = JSON.parse(fnCall.arguments);
        console.log("📤 Would send file with:", args);

        // ✅ שינוי 1 – ולידציה לטקסט
        const safeText = args.text && args.text.trim() !== "" ? args.text : null;
        if (!safeText) {
            console.error("❌ Email body (text) is required. Aborting.");
            return;
        }

        const form = new FormData();

        // ✅ שינוי 2 – ודא נמען
        form.append('to', args.to);

        // ✅ שינוי 3 – ודא subject תקין
        form.append('subject', args.subject && args.subject.trim() !== "" ? args.subject : 'File from GPT');

        // ✅ שינוי 4 – ודא text לא ריק
        form.append('text', safeText);

        // ✅ שינוי 5 – בדוק אם קובץ קיים
        if (args.filePath && fs.existsSync(args.filePath)) {
            form.append('file', fs.createReadStream(args.filePath));
        } else {
            console.warn("⚠️ No valid file path provided. Sending email without attachment.");
        }

        const res = await fetch('http://localhost:3001/send-email', {
            method: 'POST',
            body: form
        });

        if (res.ok) {
            console.log('✅ Email sent!');
        } else {
            const errText = await res.text();
            console.error(`❌ Email failed: ${res.status} ${errText}`);
        }

    } else {
        console.log("🤖 GPT did not choose to call the function.");
    }
})();

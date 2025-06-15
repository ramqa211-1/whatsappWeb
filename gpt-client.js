require('dotenv').config();
const { OpenAI } = require('openai');

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
    const userPrompt = "Use the send_file_to_email function to send ./Solving_Locator_Instability.docx to ramvt2@gmail.com. Subject: Locator Doc. Text: Here is the file.";

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

        // You can now call your local server:
        const fetch = require('node-fetch');
        const FormData = require('form-data');
        const fs = require('fs');

        const form = new FormData();
        form.append('to', args.to);
        form.append('subject', args.subject || 'File from GPT');
        form.append('text', args.text || 'Here is your file!');
        form.append('file', fs.createReadStream(args.filePath));

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

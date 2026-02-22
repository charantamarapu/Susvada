import { NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function POST(request) {
    try {
        if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
            return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
        }

        const { occasion, recipient } = await request.json();

        const prompt = `Generate a short, heartfelt gift message (2-3 sentences max, under 150 characters) for a food/sweets gift package. 
Occasion: ${occasion || 'General gifting'}
Recipient: ${recipient || 'Someone special'}
The gift contains traditional Indian sweets, snacks, or cold-pressed oils from "Susvada" brand.
Write ONLY the message text, no quotes, no labels, no explanation. Keep it warm and personal.`;

        const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.9,
                        maxOutputTokens: 100,
                    },
                }),
            }
        );

        if (!res.ok) {
            console.error('Gemini API error:', await res.text());
            return NextResponse.json({ error: 'AI service unavailable' }, { status: 502 });
        }

        const data = await res.json();
        const message = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

        if (!message) {
            return NextResponse.json({ error: 'Could not generate message' }, { status: 500 });
        }

        return NextResponse.json({ message });
    } catch (err) {
        console.error('Gift message AI error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

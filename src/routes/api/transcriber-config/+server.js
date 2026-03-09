import { json } from '@sveltejs/kit';

export function GET() {
    const key = process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY || '';
    return json({ key });
}

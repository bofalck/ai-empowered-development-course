import { supabase } from '$lib/supabase-client.js';
import { json } from '@sveltejs/kit';

export async function GET() {
	const { error } = await supabase.from('about_profile').select('id').limit(1);
	if (error) return json({ ok: false, error: error.message }, { status: 500 });
	return json({ ok: true, ts: new Date().toISOString() });
}

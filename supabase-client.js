// Shared Supabase client to avoid multiple instances
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://xqpqcuvvjgnjtqmhrtku.supabase.co';
const SUPABASE_KEY = 'sb_publishable_XsrMMvQjHZcj6Cql1xA5Fw_nF9nfubb';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

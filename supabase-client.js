// Shared Supabase client to avoid multiple instances
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://vtvebpqjucqxvdmznqbq.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0dmVicHFqdWNxeHZkbXpucWJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDkwOTg4MzEsImV4cCI6MjAyNDY3NDgzMX0.I9XnvTe0SHCqHN_Xx6q2c4ZN0cWAFRJDFEu8SvXDkpE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

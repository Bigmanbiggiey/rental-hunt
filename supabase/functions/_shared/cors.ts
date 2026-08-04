// Standard Supabase Edge Function CORS headers — the frontend calls these
// functions via `supabase.functions.invoke()`, which is a real cross-origin
// browser request in local dev (Vite on :5199, functions on :54321).
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

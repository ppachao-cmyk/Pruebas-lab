// config/supabase.js
// Cliente de Supabase para el backend. Usa la clave service_role, que se salta RLS,
// por eso SOLO vive en el servidor (archivo .env) y nunca se envia al navegador.
const { createClient } = require('@supabase/supabase-js');

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Faltan SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en el archivo .env');
}

module.exports = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

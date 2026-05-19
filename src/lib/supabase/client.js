import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://hrobglglykdvuckoiazo.supabase.co'
const supabaseKey = 'sb_publishable_gdl6flIiFEQVNSLNruPgFQ_OrOD5PHU'

export const supabase = createClient(supabaseUrl, supabaseKey)
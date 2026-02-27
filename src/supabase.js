import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ymronqdynbnyemotxtvb.supabase.co'
const supabaseKey = 'sb_publishable_7aOBxlyGQaLQv3Ipe4VCww_YXdUjfno'

export const supabase = createClient(supabaseUrl, supabaseKey)
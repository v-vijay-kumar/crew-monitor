import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface CrewSession {
  id?: number;
  crew_id: string;
  crew_name: string;
  loco_number: string;
  train_number: string;
  location: string;
  status: 'Active' | 'Completed';
  sign_on_time: string;
  sign_off_time?: string | null;
  dy_chc_informed: boolean;
  planned_relief_station: string;
  assigned_relief_crew_id: string;
}
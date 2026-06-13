
import { supabase } from './supabase';

interface ErrorLog {
  id?: string;
  message: string;
  stack?: string | null;
  component?: string | null;
  user_id?: string | null;
  created_at?: string;
}

export const logError = async (error: any, component?: string) => {
  try {
    console.error('Error logged:', error);
    
    const errorData: ErrorLog = {
      message: error.message || 'Unknown error',
      stack: error.stack || null,
      component: component || null,
      created_at: new Date().toISOString()
    };
    
    // Get current user if available
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      errorData.user_id = user.id;
    }
    
    // Insert into Supabase logs table
    // TODO: Create logs table in Supabase
    const { error: insertError } = await supabase
      .from('logs')
      .insert([errorData]);
      
    if (insertError) {
      console.error('Failed to log to Supabase:', insertError);
    }
  } catch (err) {
    console.error('Error in logError itself:', err);
  }
};

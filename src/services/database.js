/**
 * Database Service
 * Handles database maintenance and cleanup operations
 */
import { supabase } from '../config/supabase';

/**
 * Run database cleanup to remove stale data
 * - Deletes events from before today
 * - Deletes alerts that all recipients have read
 * @returns {Promise<{success: boolean, results?: object, error?: string}>}
 */
export const runDatabaseCleanup = async () => {
  try {
    const { data, error } = await supabase.rpc('run_database_cleanup');
    
    if (error) {
      // Function might not exist yet - that's okay
      if (error.code === '42883') {
        console.log('Database cleanup functions not installed yet');
        return { success: true, results: null };
      }
      console.error('Database cleanup error:', error);
      return { success: false, error: error.message };
    }
    
    console.log('Database cleanup complete:', data);
    return { success: true, results: data };
  } catch (err) {
    console.error('Database cleanup exception:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Clean up past events only
 * @returns {Promise<number>} Number of deleted events
 */
export const cleanupPastEvents = async () => {
  try {
    const { data, error } = await supabase.rpc('cleanup_past_events');
    if (error) throw error;
    return data || 0;
  } catch (err) {
    console.error('Cleanup past events error:', err);
    return 0;
  }
};

/**
 * Clean up read alerts only
 * @returns {Promise<number>} Number of deleted alerts
 */
export const cleanupReadAlerts = async () => {
  try {
    const { data, error } = await supabase.rpc('cleanup_read_alerts');
    if (error) throw error;
    return data || 0;
  } catch (err) {
    console.error('Cleanup read alerts error:', err);
    return 0;
  }
};


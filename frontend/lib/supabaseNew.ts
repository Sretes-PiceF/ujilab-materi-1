import { createClient } from '@supabase/supabase-js'

// Simple version tanpa complex types yang error
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

// Validation
if (!supabaseUrl || !supabaseAnonKey) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Missing Supabase environment variables')
  }
  console.warn('⚠️ Supabase environment variables missing in development')
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 1 // ⬅️ REDUCED untuk performance
    }
  }
})

// Type untuk logbook payload
interface LogbookRecord {
  id?: number
  status_verifikasi?: string
  [key: string]: any
}

interface LogbookChangePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: LogbookRecord | null
  old: LogbookRecord | null
}

type LogbookCallback = (payload: LogbookChangePayload) => void

/**
 * Subscribe khusus untuk table logbook dengan DEBOUNCE dan FILTER
 */
export const subscribeToLogbook = (
  callback: LogbookCallback,
  debounceMs: number = 2000 // Default 2 detik debounce
): (() => void) => {
  
  let timeoutId: NodeJS.Timeout | null = null
  let lastCallTime = 0
  
  const channel = supabase
    .channel('logbook-realtime')
    .on(
      'postgres_changes' as any,
      {
        event: '*',
        schema: 'public',
        table: 'logbook',
      },
      (payload: any) => {
        // Type safe processing
        const eventType = payload.eventType
        const newRecord = payload.new as LogbookRecord | null
        const oldRecord = payload.old as LogbookRecord | null
        
        // DEBOUNCE LOGIC
        const now = Date.now()
        const timeSinceLastCall = now - lastCallTime
        
        if (timeSinceLastCall < debounceMs) {
          console.log('⏭️ Skipping rapid update')
          return
        }
        
        // SMART FILTERING
        if (eventType === 'UPDATE') {
          // Hanya trigger jika status verifikasi berubah
          const oldStatus = oldRecord?.status_verifikasi
          const newStatus = newRecord?.status_verifikasi
          
          if (oldStatus !== newStatus) {
            console.log('🔄 Status changed, scheduling refresh...')
            scheduleRefresh({ eventType, new: newRecord, old: oldRecord })
          }
        } else if (eventType === 'INSERT' || eventType === 'DELETE') {
          console.log('📝 Data changed, scheduling refresh...')
          scheduleRefresh({ eventType, new: newRecord, old: oldRecord })
        }
      }
    )
    .subscribe((status: string) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ Logbook subscription active')
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ Logbook subscription error')
      }
    })
  
  const scheduleRefresh = (payload: LogbookChangePayload) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    
    // Debounce: tunggu sebelum trigger callback
    timeoutId = setTimeout(() => {
      lastCallTime = Date.now()
      callback(payload)
      timeoutId = null
    }, debounceMs)
  }
  
  // Return cleanup function
  return () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    supabase.removeChannel(channel)
    console.log('🔕 Logbook subscription cleaned up')
  }
}

/**
 * Test connection simple
 */
export const testConnection = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.from('logbook').select('id').limit(1)
    return !error
  } catch {
    return false
  }
}

// Export type untuk digunakan di component
export type { LogbookChangePayload, LogbookCallback }
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useSupabaseSync<T>(
    tableName: string,
    userId: string | null,
    initialData: T,
    setLocalState: (data: T) => void
) {
    useEffect(() => {
        if (!supabase || !userId || !tableName) return;

        const fetchData = async () => {
            const { data, error } = await supabase
                .from(tableName)
                .select('*')
                .eq('user_id', userId);

            if (error) {
                console.error(`Error fetching ${tableName}:`, error);
                return;
            }

            if (data) {
                setLocalState(data as unknown as T);
            }
        };

        void fetchData();

        // Subscribe to real-time changes
        const channel = supabase
            .channel(`${tableName}_changes`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: tableName, filter: `user_id=eq.${userId}` },
                () => {
                    void fetchData();
                }
            )
            .subscribe();

        return () => {
            void supabase.removeChannel(channel);
        };
    }, [tableName, userId]);
}

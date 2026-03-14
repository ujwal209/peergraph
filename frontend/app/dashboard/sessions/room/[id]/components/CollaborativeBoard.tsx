"use client";

import { useEffect, useState } from 'react';
import { Tldraw, createTLStore, defaultShapeUtils, TLRecord } from 'tldraw';
import 'tldraw/tldraw.css';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const CollaborativeBoard = ({ roomId, isHost }: { roomId: string, isHost: boolean }) => {
  // Create an isolated Tldraw store for this specific session
  const [store] = useState(() => createTLStore({ shapeUtils: defaultShapeUtils }));

  useEffect(() => {
    // 1. Initialize Supabase Broadcast channel for this specific room
    const channel = supabase.channel(`board-${roomId}`, {
      config: { broadcast: { self: false } }
    });

    // 2. Listen for drawing changes from the Host
    channel.on('broadcast', { event: 'update' }, ({ payload }) => {
      // mergeRemoteChanges ensures incoming updates don't break the local undo/redo history
      store.mergeRemoteChanges(() => {
        const { added, updated, removed } = payload;
        
        // Tldraw represents changes as objects, we convert them to arrays to put into the store
        if (added) store.put(Object.values(added) as TLRecord[]);
        if (updated) store.put(Object.values(updated).map((u: any) => u[1]) as TLRecord[]);
        if (removed) store.remove(Object.keys(removed) as any);
      });
    });

    // 3. Late Joiner Support: A new peer asks for the current state
    channel.on('broadcast', { event: 'request-state' }, () => {
      if (isHost) {
        channel.send({
          type: 'broadcast',
          event: 'full-state',
          payload: store.allRecords() // Host sends the entire board history
        });
      }
    });

    // 4. Late Joiner Support: The peer receives the full state from the host
    channel.on('broadcast', { event: 'full-state' }, ({ payload }) => {
      if (!isHost) {
        store.mergeRemoteChanges(() => {
          store.put(payload as TLRecord[]);
        });
      }
    });

    // Subscribe to the channel
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED' && !isHost) {
        // When a peer connects, ask the host for the current drawing
        channel.send({ type: 'broadcast', event: 'request-state' });
      }
    });

    // 5. Send local changes to Supabase (Only fires when the Host draws/moves things)
    const unlisten = store.listen(
      (update) => {
        // Only broadcast if the action was made by the user (not a remote sync)
        if (update.source === 'user') {
          channel.send({
            type: 'broadcast',
            event: 'update',
            payload: update.changes,
          });
        }
      },
      // scope: 'document' ensures we only sync actual drawings, NOT user selections or mouse positions
      { source: 'user', scope: 'document' } 
    );

    return () => {
      unlisten();
      supabase.removeChannel(channel);
    };
  }, [roomId, store, isHost]);

  return (
    <div className="w-full h-full relative" style={{ isolation: 'isolate' }}>
      
      {/* The Tldraw Component is now fully synced via our Supabase Store hook! */}
      <Tldraw 
        store={store} 
        isReadonly={!isHost} // Hard enforces that only the host can draw/edit
        inferDarkMode={true}
      />
      
      {/* Indicator for Peers */}
      {!isHost && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/80 border border-white/10 text-[#00BC7D] text-[10px] font-black uppercase tracking-widest rounded-full backdrop-blur-md z-[999] pointer-events-none shadow-[0_0_15px_rgba(0,188,125,0.2)]">
          Read-Only Sync Mode
        </div>
      )}
    </div>
  );
};
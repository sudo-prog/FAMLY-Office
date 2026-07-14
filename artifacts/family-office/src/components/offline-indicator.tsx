import React from 'react';
import { Wifi, WifiOff, CloudOff, RefreshCw } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/use-offline';

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();
  const [showBanner, setShowBanner] = React.useState(!isOnline);

  React.useEffect(() => {
    if (!isOnline) {
      setShowBanner(true);
    }
  }, [isOnline]);

  if (isOnline && !showBanner) return null;

  return (
    <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg text-sm font-medium transition-all ${
      isOnline
        ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
        : 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
    }`}>
      {isOnline ? (
        <>
          <Wifi className="w-4 h-4" />
          <span>Back online — syncing...</span>
          <button onClick={() => setShowBanner(false)} className="ml-2 text-xs opacity-70 hover:opacity-100">✕</button>
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4" />
          <span>Offline — changes cannot be saved until you're back online.</span>
        </>
      )}
    </div>
  );
}

import NetInfo from "@react-native-community/netinfo";
import { useEffect, useState } from "react";
import { OfflineOperation, offlineService } from "../Services/OfflineService";

export const useOffline = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingOperations, setPendingOperations] = useState<
    OfflineOperation[]
  >([]);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // Listener de red
    const unsubscribeNetwork = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected ?? false);
    });

    // Listener de cola
    const handleQueueUpdate = (queue: OfflineOperation[]) => {
      setPendingOperations(queue);
      setIsSyncing(queue.some((op) => op.status === "syncing"));
    };

    offlineService.addSyncListener(handleQueueUpdate);

    // Cleanup
    return () => {
      unsubscribeNetwork();
      offlineService.removeSyncListener(handleQueueUpdate);
    };
  }, []);

  const syncNow = async () => {
    await offlineService.syncQueue();
  };

  const clearQueue = async () => {
    await offlineService.clearQueue();
  };

  return {
    isOnline,
    pendingOperations,
    pendingCount: pendingOperations.filter((op) => op.status === "pending")
      .length,
    isSyncing,
    syncNow,
    clearQueue,
  };
};

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useOffline } from '../Hooks/useOffline';
import { COLORS, FONT_SIZES } from '../types';

const OfflineIndicator: React.FC = () => {
  const { isOnline, pendingCount, isSyncing, syncNow } = useOffline();
  const [fadeAnim] = React.useState(new Animated.Value(0));

  React.useEffect(() => {
    if (!isOnline || pendingCount > 0) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isOnline, pendingCount]);

  if (isOnline && pendingCount === 0) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {!isOnline && (
        <View style={[styles.banner, styles.offlineBanner]}>
          <MaterialIcons name="cloud-off" size={18} color="#fff" />
          <Text style={styles.text}>Sin conexión - Modo Offline</Text>
        </View>
      )}

      {isOnline && pendingCount > 0 && (
        <TouchableOpacity
          style={[styles.banner, styles.syncBanner]}
          onPress={syncNow}
          disabled={isSyncing}
        >
          {isSyncing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <MaterialIcons name="cloud-upload" size={18} color="#fff" />
          )}
          <Text style={styles.text}>
            {isSyncing
              ? 'Sincronizando...'
              : `${pendingCount} cambio${pendingCount !== 1 ? 's' : ''} pendiente${pendingCount !== 1 ? 's' : ''}`}
          </Text>
          {!isSyncing && (
            <MaterialIcons name="refresh" size={16} color="#fff" />
          )}
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 8,
  },
  offlineBanner: {
    backgroundColor: '#666',
  },
  syncBanner: {
    backgroundColor: COLORS.primary,
  },
  text: {
    color: '#fff',
    fontSize: FONT_SIZES.small,
    fontWeight: '600',
  },
});

export default OfflineIndicator;
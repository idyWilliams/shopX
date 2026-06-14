import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const TerminalUnauthorizedScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Terminal Unauthorized</Text>
      <Text style={styles.description}>
        This device is not authorized to access ShopX. Please contact your administrator.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090B',
    padding: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: '#EF4444',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    color: '#A1A1AA',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default TerminalUnauthorizedScreen;
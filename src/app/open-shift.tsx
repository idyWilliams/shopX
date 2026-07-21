import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useShift } from '../context/ShiftContext';

export default function OpenShiftScreen() {
  const router = useRouter();
  const { openShift, isLoadingShift } = useShift();
  const [openingCash, setOpeningCash] = useState('0');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenShift = async () => {
    try {
      setIsSubmitting(true);
      const cashAmount = parseFloat(openingCash) || 0;
      await openShift(cashAmount);
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to open shift');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingShift) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.form}>
        <Text style={styles.title}>Open New Shift</Text>
        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Opening Cash Float (NGN)</Text>
          <TextInput
            style={styles.input}
            value={openingCash}
            onChangeText={setOpeningCash}
            keyboardType="numeric"
            placeholder="0"
            autoFocus
          />
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={handleOpenShift}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>Start Shift</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
    justifyContent: 'center',
    padding: 20,
  },
  form: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fafafa',
    marginBottom: 32,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    color: '#a1a1aa',
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#18181b',
    color: '#fafafa',
    padding: 16,
    borderRadius: 12,
    fontSize: 18,
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  button: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
});

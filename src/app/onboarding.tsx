import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { router } from 'expo-router';

const Onboarding = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const { 
    setActiveStoreId, setAuthorizedStores, setSoloOwner, createDefaultStore } = useAuth();

  // Step 1: Store Setup
  const [merchantEmail, setMerchantEmail] = useState('');
  const [merchantPhone, setMerchantPhone] = useState('');
  const [storeName, setStoreName] = useState('');
  const [storeCategory, setStoreCategory] = useState('');
  const [isSoloOwner, setIsSoloOwner] = useState(false);

  const completeStep1 = async () => {
    if (!merchantEmail) {
      Alert.alert('Error', 'Please enter merchant email');
      return;
    }
    
    completeSoloOwnerOnboarding();
  };

  const completeSoloOwnerOnboarding = async () => {
    try {
      const defaultStore = await createDefaultStore('temp-merchant-id', storeName, storeCategory);

      setSoloOwner(true);
      setActiveStoreId(defaultStore.id);
      setAuthorizedStores([defaultStore]);

      Alert.alert('Success', 'Onboarding complete!');
      router.replace('/(tabs)');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to complete onboarding');
    }
  };

  const renderStep1 = () => (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Welcome to ShopX!</Text>
      <Text style={styles.subtitle}>Let's get your business set up</Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Your Email</Text>
        <TextInput
          style={styles.input}
          value={merchantEmail}
          onChangeText={setMerchantEmail}
          placeholder="Enter email"
          placeholderTextColor="#71717A"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Store Name</Text>
        <TextInput
          style={styles.input}
          value={storeName}
          onChangeText={setStoreName}
          placeholder="e.g. Ade's Provision Shop"
          placeholderTextColor="#71717A"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Store Category</Text>
        <TextInput
          style={styles.input}
          value={storeCategory}
          onChangeText={setStoreCategory}
          placeholder="e.g. Retail, Electronics, Grocery"
          placeholderTextColor="#71717A"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Your Phone (optional)</Text>
        <TextInput
          style={styles.input}
          value={merchantPhone}
          onChangeText={setMerchantPhone}
          placeholder="Enter phone number"
          placeholderTextColor="#71717A"
          keyboardType="phone-pad"
        />
      </View>

      <TouchableOpacity
        style={styles.checkboxContainer}
        onPress={() => setIsSoloOwner(!isSoloOwner)}
        activeOpacity={0.7}
      >
        <View style={[styles.checkbox, isSoloOwner && styles.checkboxActive]}>
          {isSoloOwner && <Feather name="check" size={18} color="white" />}
        </View>
        <Text style={styles.checkboxLabel}>I manage this shop alone</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={completeStep1}>
        <Text style={styles.buttonText}>Complete Setup</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <View style={styles.screen}>
      <View style={styles.stepIndicator}>
        <View style={[styles.stepDot, currentStep >=1 && styles.stepDotActive]} />
      </View>
      {currentStep ===1 && renderStep1()}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex:1,
    backgroundColor: '#09090B',
  },
  container: {
    flex:1,
    padding:24,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop:40,
    paddingBottom:20,
  },
  stepDot: {
    width:12,
    height:12,
    borderRadius:6,
    backgroundColor: '#3f3f46',
  },
  stepDotActive: {
    backgroundColor: '#0EA5E9',
  },
  title: {
    fontSize:28,
    fontWeight: 'bold',
    color: '#FAFAFA',
    marginBottom:8,
  },
  subtitle: {
    fontSize:16,
    color: '#A1A1AA',
    marginBottom:32,
  },
  formGroup: {
    marginBottom:20,
  },
  label: {
    color: '#E4E4E7',
    marginBottom:8,
    fontSize:16,
  },
  input: {
    backgroundColor: '#18181B',
    borderWidth:1,
    borderColor: '#3f3f46',
    borderRadius:12,
    paddingHorizontal:16,
    paddingVertical:12,
    color: '#FAFAFA',
    fontSize:16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom:24,
  },
  checkbox: {
    width:24,
    height:24,
    borderRadius:6,
    borderWidth:2,
    borderColor: '#3f3f46',
    marginRight:12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: '#0EA5E9',
    borderColor: '#0EA5E9',
  },
  checkboxLabel: {
    color: '#E4E4E7',
    fontSize:16,
  },
  button: {
    backgroundColor: '#0EA5E9',
    borderRadius:12,
    paddingVertical:16,
    alignItems: 'center',
    marginTop:24,
  },
  buttonText: {
    color: '#FAFAFA',
    fontSize:16,
    fontWeight: 'bold',
  },
});

export default Onboarding;

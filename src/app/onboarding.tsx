import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { database } from '../db';
import { Merchant } from '../db/models/Merchant';
import { Store } from '../db/models/Store';
import { Attendant } from '../db/models/Attendant';
import { StoreAttendant } from '../db/models/StoreAttendant';
import { registerDevice } from '../lib/deviceGuard';
import { useAuth } from '../context/AuthContext';
import { router } from 'expo-router';

const Onboarding = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const { 
    setActiveStoreId, 
    setAuthorizedStores, 
    setSoloOwner,
    createDefaultStore
  } = useAuth();

  // Step 1: Store Setup
  const [merchantEmail, setMerchantEmail] = useState('');
  const [merchantPhone, setMerchantPhone] = useState('');
  const [isSoloOwner, setIsSoloOwner] = useState(false);
  const [stores, setStores] = useState<{ name: string; location: string }[]>([
    { name: '', location: '' },
  ]);

  // Step 2: Staff Assignment
  const [attendants, setAttendants] = useState<{
    name: string;
    pin: string;
    accessLevel: string;
    assignedStores: string[];
  }[]>([]);

  // Step 3: Device Activation
  const [selectedStoreForDevice, setSelectedStoreForDevice] = useState<string>('');

  const addStore = () => {
    setStores([...stores, { name: '', location: '' }]);
  };

  const updateStore = (index: number, field: 'name' | 'location', value: string) => {
    const newStores = [...stores];
    newStores[index][field] = value;
    setStores(newStores);
  };

  const addAttendant = () => {
    setAttendants([
      ...attendants,
      { name: '', pin: '', accessLevel: 'standard', assignedStores: [] },
    ]);
  };

  const updateAttendant = (
    index: number, field: keyof typeof attendants[0], value: any) => {
    const newAttendants = [...attendants];
    newAttendants[index][field] = value;
    setAttendants(newAttendants);
  };

  const toggleStoreAssignment = (attendantIndex: number, storeName: string) => {
    const newAttendants = [...attendants];
    const currentAssignments = newAttendants[attendantIndex].assignedStores;

    if (currentAssignments.includes(storeName)) {
      newAttendants[attendantIndex].assignedStores = currentAssignments.filter(
        s => s !== storeName
      );
    } else {
      newAttendants[attendantIndex].assignedStores = [
        ...currentAssignments,
        storeName,
      ];
    }
    setAttendants(newAttendants);
  };

  const completeStep1 = async () => {
    if (!merchantEmail) {
      Alert.alert('Error', 'Please enter merchant email');
      return;
    }
    
    if (isSoloOwner) {
      // Skip steps 2 and 3 for solo owner
      completeSoloOwnerOnboarding();
    } else {
      const validStores = stores.filter(s => s.name.trim());
      if (validStores.length === 0) {
        Alert.alert('Error', 'Please add at least one store');
        return;
      }
      setCurrentStep(2);
    }
  };

  const completeStep2 = () => {
    // Check at least one attendant has been added if not solo owner
    if (!isSoloOwner) {
      const validAttendants = attendants.filter(a => a.name && a.pin);
      if (validAttendants.length === 0) {
        Alert.alert('Error', 'Please add at least one attendant');
        return;
      }
    }
    setCurrentStep(3);
  };

  const completeSoloOwnerOnboarding = async () => {
    try {
      let createdMerchantId = '';

      // 1. Create Merchant
      await database.write(async () => {
        const merchant = await database.get<Merchant>('merchants').create(m => {
          m.email = merchantEmail;
          m.phone = merchantPhone;
        });
        createdMerchantId = merchant.id;
      });

      // 2. Create Default Store
      const defaultStore = await createDefaultStore(createdMerchantId);

      // 3. Register Device for default store
      await registerDevice(defaultStore.id);

      // 4. Update auth context
      setSoloOwner(true);
      setActiveStoreId?.(defaultStore.id);
      setAuthorizedStores?.([defaultStore]);

      Alert.alert('Success', 'Onboarding complete!');
      router.replace('/(tabs)');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to complete onboarding');
    }
  };

  const completeOnboarding = async () => {
    if (!isSoloOwner && !selectedStoreForDevice) {
      Alert.alert('Error', 'Please select a store for this device');
      return;
    }

    try {
      let createdMerchantId = '';
      const createdStoreIds: Record<string, string> = {}; // maps store name to id

      // 1. Create Merchant
      await database.write(async () => {
        const merchant = await database.get<Merchant>('merchants').create(m => {
          m.email = merchantEmail;
          m.phone = merchantPhone;
        });
        createdMerchantId = merchant.id;
      });

      // 2. Create Stores
      for (const store of stores.filter(s => s.name)) {
        await database.write(async () => {
          const newStore = await database.get<Store>('stores').create(s => {
            s.merchantId = createdMerchantId;
            s.name = store.name;
            s.locationAddress = store.location;
          });
          createdStoreIds[store.name] = newStore.id;
        });
      }

      // 3. Create Attendants and Store Attendant relationships
      if (!isSoloOwner) {
        for (const attendant of attendants.filter(a => a.name && a.pin)) {
          let createdAttendantId = '';
          await database.write(async () => {
            const newAttendant = await database
              .get<Attendant>('attendants')
              .create(a => {
                a.name = attendant.name;
                a.hashedPin = attendant.pin;
                a.accessLevel = attendant.accessLevel;
              });
            createdAttendantId = newAttendant.id;
          });

          // Create store_attendant relationships
          for (const storeName of attendant.assignedStores) {
            if (createdStoreIds[storeName]) {
              await database.write(async () => {
                await database.get<StoreAttendant>('store_attendants').create(sa => {
                  sa.storeId = createdStoreIds[storeName];
                  sa.attendantId = createdAttendantId;
                });
              });
            }
          }
        }
      }

      // 4. Register Device
      const targetStoreId = isSoloOwner 
        ? (await createDefaultStore(createdMerchantId)).id 
        : createdStoreIds[selectedStoreForDevice];
      await registerDevice(targetStoreId);

      // 5. Update auth context
      setSoloOwner(isSoloOwner);
      setActiveStoreId?.(targetStoreId);
      // Load all stores into authorizedStores
      const loadedStores = await database.get<Store>('stores').query().fetch();
      setAuthorizedStores?.(loadedStores);

      Alert.alert('Success', 'Onboarding complete!');
      router.replace('/(tabs)');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to complete onboarding');
    }
  };

  const renderStep1 = () => (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Store Setup</Text>
      <Text style={styles.subtitle}>
        Let's get your business set up
      </Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Merchant Email</Text>
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
        <Text style={styles.label}>Merchant Phone (optional)</Text>
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

      {!isSoloOwner && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.label}>Your Stores</Text>
            <TouchableOpacity onPress={addStore} style={styles.addButton}>
              <Feather name="plus" size={20} color="#0EA5E9" />
              <Text style={styles.addButtonText}>Add Store</Text>
            </TouchableOpacity>
          </View>

          {stores.map((store, index) => (
            <View key={index} style={styles.storeCard}>
              <Text style={styles.cardTitle}>Store {index + 1}</Text>
              <TextInput
                style={styles.input}
                value={store.name}
                onChangeText={v => updateStore(index, 'name', v)}
                placeholder="Store Name"
                placeholderTextColor="#71717A"
              />
              <TextInput
                style={styles.input}
                value={store.location}
                onChangeText={v => updateStore(index, 'location', v)}
                placeholder="Location (optional)"
                placeholderTextColor="#71717A"
              />
            </View>
          ))}
        </>
      )}

      <TouchableOpacity style={styles.button} onPress={completeStep1}>
        <Text style={styles.buttonText}>
          {isSoloOwner ? "Complete Setup" : "Next: Staff Assignment"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderStep2 = () => (
    <ScrollView style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => setCurrentStep(1)}
      >
        <Feather name="arrow-left" size={20} color="#E4E4E7" />
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Staff Assignment</Text>
      <Text style={styles.subtitle}>
        Add your attendants and assign them to stores
      </Text>

      <View style={styles.sectionHeader}>
        <Text style={styles.label}>Attendants</Text>
        <TouchableOpacity onPress={addAttendant} style={styles.addButton}>
          <Feather name="plus" size={20} color="#0EA5E9" />
          <Text style={styles.addButtonText}>Add Attendant</Text>
        </TouchableOpacity>
      </View>

      {attendants.map((attendant, index) => (
        <View key={index} style={styles.storeCard}>
          <Text style={styles.cardTitle}>Attendant {index + 1}</Text>
          <TextInput
            style={styles.input}
            value={attendant.name}
            onChangeText={v => updateAttendant(index, 'name', v)}
            placeholder="Attendant Name"
            placeholderTextColor="#71717A"
          />
          <TextInput
            style={styles.input}
            value={attendant.pin}
            onChangeText={v => updateAttendant(index, 'pin', v)}
            placeholder="PIN (4 digits)"
            placeholderTextColor="#71717A"
            keyboardType="numeric"
            maxLength={4}
            secureTextEntry
          />
          
          <Text style={styles.label}>Assign to Stores:</Text>
          <View style={styles.storeAssignmentContainer}>
            {stores
              .filter(s => s.name)
              .map(store => (
                <TouchableOpacity
                key={store.name}
                style={[
                  styles.storeChip,
                  attendant.assignedStores.includes(store.name) && styles.storeChipActive,
                ]}
                onPress={() => toggleStoreAssignment(index, store.name)}
              >
                <Text
                  style={[
                    styles.storeChipText,
                    attendant.assignedStores.includes(store.name) &&
                      styles.storeChipTextActive,
                  ]}
                >
                  {store.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      <TouchableOpacity style={styles.button} onPress={completeStep2}>
        <Text style={styles.buttonText}>Next: Device Activation</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderStep3 = () => (
    <ScrollView style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => setCurrentStep(2)}
      >
        <Feather name="arrow-left" size={20} color="#E4E4E7" />
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Device Activation</Text>
      <Text style={styles.subtitle}>
        Select which store this device is operating at
      </Text>

      <View style={styles.storeCard}>
        <Text style={styles.label}>Select Store:</Text>
        {stores
          .filter(s => s.name)
          .map(store => (
            <TouchableOpacity
              key={store.name}
              style={[
                styles.storeOption,
                selectedStoreForDevice === store.name && styles.storeOptionActive,
              ]}
              onPress={() => setSelectedStoreForDevice(store.name)}
            >
              <View style={styles.radioCircle}>
                {selectedStoreForDevice === store.name && (
                  <View style={styles.radioCircleInner} />
                )}
              </View>
              <View>
                <Text style={styles.storeName}>{store.name}</Text>
                {store.location && (
                  <Text style={styles.storeLocation}>{store.location}</Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={completeOnboarding}
      >
        <Text style={styles.buttonText}>Complete Setup</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <View style={styles.screen}>
      <View style={styles.stepIndicator}>
        <View style={[styles.stepDot, currentStep >= 1 && styles.stepDotActive]} />
        <View style={styles.stepLine} />
        <View style={[styles.stepDot, currentStep >= 2 && styles.stepDotActive]} />
        <View style={styles.stepLine} />
        <View style={[styles.stepDot, currentStep >= 3 && styles.stepDotActive]} />
      </View>
      {currentStep === 1 && renderStep1()}
      {currentStep === 2 && renderStep2()}
      {currentStep === 3 && renderStep3()}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#09090B',
  },
  container: {
    flex: 1,
    padding: 24,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 20,
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3f3f46',
  },
  stepDotActive: {
    backgroundColor: '#0EA5E9',
  },
  stepLine: {
    width: 60,
    height: 2,
    backgroundColor: '#3f3f46',
    marginHorizontal: 8,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButtonText: {
    color: '#E4E4E7',
    marginLeft: 8,
    fontSize: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FAFAFA',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#A1A1AA',
    marginBottom: 32,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    color: '#E4E4E7',
    marginBottom: 8,
    fontSize: 16,
  },
  input: {
    backgroundColor: '#18181B',
    borderWidth: 1,
    borderColor: '#3f3f46',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#FAFAFA',
    fontSize: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#3f3f46',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: '#0EA5E9',
    borderColor: '#0EA5E9',
  },
  checkboxLabel: {
    color: '#E4E4E7',
    fontSize: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#0EA5E9',
    marginLeft: 4,
  },
  storeCard: {
    backgroundColor: '#18181B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    color: '#FAFAFA',
    fontWeight: '600',
    marginBottom: 12,
  },
  storeAssignmentContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 8,
  },
  storeChip: {
    backgroundColor: '#27272A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  storeChipActive: {
    backgroundColor: '#0EA5E9',
  },
  storeChipText: {
    color: '#A1A1AA',
  },
  storeChipTextActive: {
    color: '#FAFAFA',
  },
  storeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  storeOptionActive: {
    backgroundColor: '#27272A',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#3f3f46',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0EA5E9',
  },
  storeName: {
    color: '#FAFAFA',
    fontSize: 16,
    fontWeight: '500',
  },
  storeLocation: {
    color: '#A1A1AA',
    fontSize: 14,
  },
  button: {
    backgroundColor: '#0EA5E9',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonText: {
    color: '#FAFAFA',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Onboarding;

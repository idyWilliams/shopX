import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { database } from '../db';
import { OperationalAnomaly } from '../db/models/OperationalAnomaly';
import { Attendant } from '../db/models/Attendant';
import { StoreAttendant } from '../db/models/StoreAttendant';
import { useAuth } from '../context/AuthContext';

interface Props {
  onUnlock: (attendant: Attendant) => void;
  storeId: string;
}

const AttendantPinLock: React.FC<Props> = ({ onUnlock, storeId }) => {
  const [pin, setPin] = useState<string[]>([]);
  const [attempts, setAttempts] = useState<number>(0);
  const [error, setError] = useState<string>('');
  const [attendants, setAttendants] = useState<Attendant[]>([]);
  const { setCurrentAttendant } = useAuth();

  // Load authorized attendants for store
  useEffect(() => {
    const loadAttendants = async () => {
      // First get all store_attendant relationships for this store
      const storeAttendants = await database
        .get<StoreAttendant>('store_attendants')
        .query()
        .fetch();

      const attendantIdsForStore = storeAttendants
        .filter(sa => sa.storeId === storeId)
        .map(sa => sa.attendantId);

      // Then load those attendants
      const allAttendants = await database
        .get<Attendant>('attendants')
        .query()
        .fetch();

      const authorizedAttendants = allAttendants.filter(a => 
        attendantIdsForStore.includes(a.id)
      );
      setAttendants(authorizedAttendants);
    };
    loadAttendants();
  }, [storeId]);

  const logAnomaly = async () => {
    await database.write(async () => {
      await database.get<OperationalAnomaly>('operational_anomalies').create((anomaly) => {
        anomaly.anomalyType = 'INVALID_PIN_ATTEMPTS';
        anomaly.severity = 'critical';
        anomaly.storeId = storeId;
        anomaly.payload = JSON.stringify({ attempts: 3, timestamp: new Date().toISOString() });
        anomaly.createdAt = new Date();
      });
    });
  };

  const handleNumberPress = (num: string) => {
    if (pin.length < 4) {
      setPin([...pin, num]);
      if (error) setError('');
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
    if (error) setError('');
  };

  const handleVerify = async () => {
    const pinString = pin.join('');
    
    // Find attendant with matching PIN
    const validAttendant = attendants.find(a => a.hashedPin === pinString);

    if (validAttendant) {
      setCurrentAttendant?.(validAttendant);
      onUnlock(validAttendant);
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      if (newAttempts >= 3) {
        setError('Too many attempts. Access locked.');
        await logAnomaly();
      } else {
        setError(`Invalid PIN. ${3 - newAttempts} attempts remaining.`);
        setPin([]);
      }
    }
  };

  const keypadLayout = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['', '0', 'delete'],
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Enter Attendant PIN</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>

      <View style={styles.pinDisplayContainer}>
        {[0, 1, 2, 3].map((index) => (
          <View
            key={index}
            style={[
              styles.pinDot,
              {
                backgroundColor: pin[index] ? '#0EA5E9' : '#3f3f46',
              },
            ]}
          />
        ))}
      </View>

      <View style={styles.keypadContainer}>
        {keypadLayout.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.keypadRow}>
            {row.map((key, keyIndex) => {
              if (key === '') {
                return <View key={keyIndex} style={styles.keypadButton} />;
              }

              return (
                <TouchableOpacity
                  key={keyIndex}
                  style={styles.keypadButton}
                  onPress={() => {
                    if (key === 'delete') {
                      handleDelete();
                    } else {
                      handleNumberPress(key);
                      if (pin.length + 1 === 4) {
                        setTimeout(handleVerify, 100);
                      }
                    }
                  }}
                  disabled={attempts >= 3}
                >
                  {key === 'delete' ? (
                    <Feather name="delete" size={30} color="#E4E4E7" />
                  ) : (
                    <Text style={styles.keypadText}>{key}</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090B',
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    color: '#FAFAFA',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  error: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
  },
  pinDisplayContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 60,
  },
  pinDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  keypadContainer: {
    width: '100%',
    maxWidth: 320,
    alignSelf: 'center',
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  keypadButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#27272A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keypadText: {
    fontSize: 32,
    color: '#FAFAFA',
    fontWeight: 'bold',
  },
});

export default AttendantPinLock;

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useLeads } from '../db/hooks';
import { contactLeadOnWhatsApp } from '../lib/whatsappReporter';
import { getDatabase } from '../db';
import { Lead } from '../db/models/Lead';

const LeadFeed = () => {
  const leads = useLeads();

  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    const db = getDatabase();
    await db.write(async () => {
      const lead = await db.get<Lead>('leads').find(leadId);
      await lead.update((l) => {
        l.status = newStatus;
      });
    });
  };

  const renderLead = ({ item }: { item: Lead }) => (
    <View style={styles.leadCard}>
      <View style={styles.leadHeader}>
        <Text style={styles.productInterest}>{item.productInterest}</Text>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                item.status === 'new'
                  ? '#3b82f6'
                  : item.status === 'contacted'
                  ? '#10b981'
                  : '#6b7280',
            },
          ]}
        >
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      <Text style={styles.contactInfo}>Contact: {item.contactInfo}</Text>
      <Text style={styles.date}>
        {item.createdAt.toLocaleDateString()} {item.createdAt.toLocaleTimeString()}
      </Text>
      <View style={styles.buttonsContainer}>
        {item.status === 'new' && (
          <>
            <TouchableOpacity
              style={styles.whatsappButton}
              onPress={() => {
                contactLeadOnWhatsApp(item.contactInfo, item.productInterest);
                updateLeadStatus(item.id, 'contacted');
              }}
            >
              <Feather name="message-circle" size={20} color="white" />
              <Text style={styles.buttonText}>WhatsApp Contact</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );

  if (leads === undefined) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (leads.length === 0) {
    return (
      <View style={styles.center}>
        <Feather name="users" size={64} color="#71717a" />
        <Text style={styles.emptyText}>No leads yet</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Potential Customers</Text>
      <FlatList
        data={leads}
        keyExtractor={(item) => item.id}
        renderItem={renderLead}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fafafa',
    marginBottom: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#09090b',
  },
  emptyText: {
    color: '#71717a',
    fontSize: 18,
    marginTop: 16,
  },
  leadCard: {
    backgroundColor: '#18181b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  leadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  productInterest: {
    color: '#fafafa',
    fontSize: 18,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  contactInfo: {
    color: '#a1a1aa',
    fontSize: 14,
    marginBottom: 4,
  },
  date: {
    color: '#71717a',
    fontSize: 12,
    marginBottom: 12,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  whatsappButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10b981',
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
});

export default LeadFeed;
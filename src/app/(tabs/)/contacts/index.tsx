import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  FlatList,
  Image,
  TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { User } from '@/types/chat';
import { useCall } from '@/hooks/useCall';
import { useAuth } from '@/hooks/useAuth';

export default function ContactsScreen() {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const { initiateCall } = useCall(currentUser?.uid || '');

  const [contacts, setContacts] = useState<User[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<User[]>([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadContacts = async () => {
      try {
        if (!currentUser) return;
        const usersRef = collection(db, 'users');
        const q = query(usersRef, orderBy('displayName', 'asc'));
        const snapshot = await getDocs(q);

        const usersList = snapshot.docs
          .map(doc => ({ uid: doc.id, ...doc.data() } as User))
          .filter(user => user.uid !== currentUser?.uid);

        setContacts(usersList);
        setFilteredContacts(usersList);
      } catch (error) {
        console.error('Error loading contacts:', error);
      } finally {
        setLoading(false);
      }
    };

    loadContacts();
  }, [currentUser]);

  useEffect(() => {
    if (searchText.trim() === '') {
      setFilteredContacts(contacts);
    } else {
      const filtered = contacts.filter(contact =>
        contact.displayName.toLowerCase().includes(searchText.toLowerCase()) ||
        contact.phoneNumber.includes(searchText)
      );
      setFilteredContacts(filtered);
    }
  }, [searchText, contacts]);

  const handleContactPress = useCallback((userId: string) => {
    router.push(`/(tabs)/chat/${userId}`);
  }, [router]);

  const handleVoiceCall = useCallback(async (userId: string) => {
    if (!currentUser) return;
    try {
      await initiateCall(userId, 'voice');
      router.push('/(tabs)/calls/active');
    } catch (error) {
      console.error('Failed to initiate voice call:', error);
    }
  }, [currentUser, initiateCall, router]);

  const handleVideoCall = useCallback(async (userId: string) => {
    if (!currentUser) return;
    try {
      await initiateCall(userId, 'video');
      router.push('/(tabs)/calls/active');
    } catch (error) {
      console.error('Failed to initiate video call:', error);
    }
  }, [currentUser, initiateCall, router]);

  const renderContactItem = useCallback(({ item }: { item: User }) => (
    <TouchableOpacity
      style={styles.contactItem}
      onPress={() => handleContactPress(item.uid)}
      activeOpacity={0.6}
    >
      <View style={styles.avatarContainer}>
        {item.avatarUrl ? (
          <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {item.displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.contactInfo}>
        <Text style={styles.contactName} numberOfLines={1}>
          {item.displayName}
        </Text>
        {item.phoneNumber && (
          <Text style={styles.contactPhone} numberOfLines={1}>
            {item.phoneNumber}
          </Text>
        )}
      </View>

      <View style={styles.callButtons}>
        <TouchableOpacity
          style={[styles.callButton, styles.voiceCallButton]}
          onPress={() => handleVoiceCall(item.uid)}
        >
          <Ionicons name="call" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.callButton, styles.videoCallButton]}
          onPress={() => handleVideoCall(item.uid)}
        >
          <Ionicons name="videocam" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  ), [handleContactPress, handleVoiceCall, handleVideoCall]);

  const renderHeader = () => (
    <View style={styles.listHeader}>
      <Text style={styles.headerText}>
        {filteredContacts.length} liên hệ
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <StatusBar barStyle="dark-content" backgroundColor="#F7F7F7" />
          <View style={styles.header}>
            <View style={styles.leftSpacer} />
            <Text style={styles.headerTitle}>Danh bạ</Text>
            <View style={styles.rightSpacer} />
          </View>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Đang tải...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor="#F7F7F7" />

        <View style={styles.header}>
          <View style={styles.leftSpacer} />
          <Text style={styles.headerTitle}>Danh bạ</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => console.log('Add contact')}
          >
            <Ionicons name="person-add-outline" size={28} color="#54A5E8" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm kiếm"
              placeholderTextColor="#8E8E93"
              value={searchText}
              onChangeText={setSearchText}
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText('')}>
                <Ionicons name="close-circle" size={20} color="#8E8E93" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {filteredContacts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color="#CCCCCC" />
            <Text style={styles.emptyText}>
              {searchText ? 'Không tìm thấy liên hệ' : 'Chưa có liên hệ nào'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredContacts}
            renderItem={renderContactItem}
            keyExtractor={item => item.uid}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={renderHeader}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 0,
    backgroundColor: '#F7F7F7',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5E5',
    height: 44,
  },
  leftSpacer: {
    width: 32,
    height: 32,
  },
  rightSpacer: {
    width: 32,
    height: 32,
    alignItems: 'flex-end',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    flex: 1,
    textAlign: 'center',
    position: 'absolute',
    left: 0,
    right: 0,
  },
  addButton: {
    paddingVertical: 4,
    paddingHorizontal: 4,
    zIndex: 10,
  },
  searchContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
    paddingVertical: 4,
  },
  listContent: {
    backgroundColor: '#FFFFFF',
  },
  listHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F7F7F7',
  },
  headerText: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '600',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5E5',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#54A5E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '600',
  },
  contactInfo: {
    flex: 1,
    marginRight: 8,
  },
  contactName: {
    color: '#000000',
    fontSize: 17,
    fontWeight: '500',
    marginBottom: 2,
  },
  contactPhone: {
    color: '#8E8E93',
    fontSize: 14,
  },
  callButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  callButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  voiceCallButton: {
    backgroundColor: '#34C759',
  },
  videoCallButton: {
    backgroundColor: '#54A5E8',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    color: '#666666',
    marginTop: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
  },
});

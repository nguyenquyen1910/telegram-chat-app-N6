import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { User } from '@/types/chat';
import { getUserById } from '@/services/userService';
import { formatLastSeen } from '@/constants/chat';

interface GroupMembersListProps {
  participants: string[];
}

export default function GroupMembersList({ participants }: GroupMembersListProps) {
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchMembers = async () => {
      try {
        const fetchedUsers = await Promise.all(
          participants.map((uid) => getUserById(uid))
        );
        if (mounted) {
          setMembers(fetchedUsers.filter((u) => u !== null) as User[]);
        }
      } catch (error) {
        console.error('Error fetching members:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchMembers();
    return () => { mounted = false; };
  }, [participants]);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color="#50A8EB" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Section header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{participants.length} thành viên</Text>
      </View>

      {/* Member rows */}
      {members.map((member, index) => (
        <View
          key={member.uid}
          style={[
            styles.memberRow,
            index < members.length - 1 && styles.borderBottom,
          ]}
        >
          {member.avatarUrl ? (
            <Image source={{ uri: member.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarLetter}>
                {member.displayName ? member.displayName.charAt(0).toUpperCase() : '?'}
              </Text>
            </View>
          )}
          <View style={styles.memberInfo}>
            <Text style={styles.memberName}>{member.displayName || 'Người dùng'}</Text>
            <Text style={[styles.memberStatus, member.isOnline && styles.memberStatusOnline]}>
              {member.isOnline ? 'trực tuyến' : formatLastSeen(member.lastSeen || null, false)}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    marginTop: 0,
  },
  loadingWrap: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0F0F0',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  borderBottom: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0F0F0',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#54A5E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  memberInfo: {
    marginLeft: 12,
    flex: 1,
    justifyContent: 'center',
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#010101',
  },
  memberStatus: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 1,
  },
  memberStatusOnline: {
    color: '#50A8EB',
  },
});

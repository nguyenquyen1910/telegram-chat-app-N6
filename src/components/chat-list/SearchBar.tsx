import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
}

export function SearchBar({ value, onChangeText }: SearchBarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.searchBox}>
        <Ionicons name="search" size={20} color="#8E8E93" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Tìm kiếm"
          placeholderTextColor="#8E8E93"
          value={value}
          onChangeText={onChangeText}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {value.length > 0 && (
          <TouchableOpacity onPress={() => onChangeText('')} style={styles.clearBtn}>
            <Ionicons name="close-circle" size={18} color="#8E8E93" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    height: 36,
  },
  icon: {
    marginLeft: 8,
    marginRight: 6,
  },
  input: {
    flex: 1,
    fontSize: 17,
    color: '#000000',
    paddingVertical: 0,
    height: '100%',
  },
  clearBtn: {
    padding: 8,
  },
});

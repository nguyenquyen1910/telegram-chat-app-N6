import React, { useState, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SearchBarProps } from '@/types/chat';

function SearchBar({ value, onChangeText, placeholder = 'Tìm kiếm' }: SearchBarProps) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      onChangeText(localValue);
    }, 300);
    return () => clearTimeout(timer);
  }, [localValue, onChangeText]);

  // Sync external value
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#8E8E93" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#8E8E93"
          value={localValue}
          onChangeText={setLocalValue}
        />
        {localValue.length > 0 && (
          <TouchableOpacity onPress={() => setLocalValue('')}>
            <Ionicons name="close-circle" size={20} color="#8E8E93" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
    paddingVertical: 4,
  },
});

export default React.memo(SearchBar);

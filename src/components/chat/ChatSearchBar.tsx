import React, { useState, useCallback } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ChatSearchBarProps {
  totalResults: number;
  currentIndex: number;
  onSearch: (query: string) => void;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
}

export default function ChatSearchBar({
  totalResults,
  currentIndex,
  onSearch,
  onNext,
  onPrev,
  onClose,
}: ChatSearchBarProps) {
  const [query, setQuery] = useState('');

  const handleChangeText = useCallback(
    (text: string) => {
      setQuery(text);
      onSearch(text);
    },
    [onSearch]
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onClose} style={styles.iconBtn}>
        <Ionicons name="arrow-back" size={22} color="#222" />
      </TouchableOpacity>

      <View style={styles.inputWrapper}>
        <Ionicons name="search-outline" size={18} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.input}
          placeholder="Tìm tin nhắn..."
          placeholderTextColor="#999"
          value={query}
          onChangeText={handleChangeText}
          autoFocus
          returnKeyType="search"
        />
      </View>

      {totalResults > 0 && (
        <View style={styles.navGroup}>
          <Text style={styles.resultText}>
            {currentIndex + 1}/{totalResults}
          </Text>
          <TouchableOpacity onPress={onPrev} style={styles.navBtn} disabled={currentIndex <= 0}>
            <Ionicons
              name="chevron-up"
              size={20}
              color={currentIndex <= 0 ? '#CCC' : '#222'}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onNext}
            style={styles.navBtn}
            disabled={currentIndex >= totalResults - 1}
          >
            <Ionicons
              name="chevron-down"
              size={20}
              color={currentIndex >= totalResults - 1 ? '#CCC' : '#222'}
            />
          </TouchableOpacity>
        </View>
      )}

      {query.length > 0 && totalResults === 0 && (
        <Text style={styles.noResult}>0</Text>
      )}
    </View>
  );
}

const STATUSBAR_HEIGHT = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 44;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6F8F3',
    paddingTop: STATUSBAR_HEIGHT + 4,
    paddingBottom: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E0E0E0',
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAEAEA',
    borderRadius: 20,
    paddingHorizontal: 12,
    height: 36,
  },
  searchIcon: {
    marginRight: 6,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#222',
    paddingVertical: 0,
  },
  navGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
  },
  resultText: {
    fontSize: 13,
    color: '#666',
    marginRight: 2,
  },
  navBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noResult: {
    fontSize: 13,
    color: '#999',
    marginLeft: 8,
  },
});

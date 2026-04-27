import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Image,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_USER = {
  firstName: 'Jacob W.',
  lastName: '',
  bio: 'Digital goodies designer - Pixsellz',
  phone: '+1 202 555 0147',
  username: '@jacob_designer',
  avatar: null as string | null,
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function EditProfileScreen() {
  const router = useRouter();
  // useNavigation().goBack() đáng tin cậy hơn router.back() trong Expo Router
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [firstName, setFirstName] = useState(MOCK_USER.firstName);
  const [lastName, setLastName] = useState(MOCK_USER.lastName);
  const [bio, setBio] = useState(MOCK_USER.bio);
  const [showAvatarSheet, setShowAvatarSheet] = useState(false);

  // Mock thumbnail images cho action sheet
  const MOCK_THUMBNAILS = [
    'https://images.unsplash.com/photo-1490750967868-88df5691cc42?w=200',
    'https://images.unsplash.com/photo-1500522144261-ea64433bbe27?w=200',
    'https://images.unsplash.com/photo-1445205170230-053b83016050?w=200',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200',
  ];

  const handleDone = () => {
    console.log('[EditProfile] Done pressed – saved:', { firstName, lastName, bio });
    navigation.goBack();
  };

  const handleBack = () => {
    console.log('[EditProfile] Back pressed');
    navigation.goBack();
  };

  const handleAvatarPress = () => {
    console.log('[EditProfile] Change avatar pressed – show action sheet');
    setShowAvatarSheet(true);
  };

  const handleChoosePhoto = () => {
    setShowAvatarSheet(false);
    console.log('[EditProfile] Choose Photo pressed');
  };

  const handleWebSearch = () => {
    setShowAvatarSheet(false);
    console.log('[EditProfile] Web Search pressed');
  };

  const handleViewPhoto = () => {
    setShowAvatarSheet(false);
    console.log('[EditProfile] View Photo pressed');
  };

  const handleRemovePhoto = () => {
    setShowAvatarSheet(false);
    console.log('[EditProfile] Remove Photo pressed');
  };

  const handleChangeNumber = () => {
    console.log('[EditProfile] Change Number pressed');
  };

  const handleUsername = () => {
    console.log('[EditProfile] Username pressed');
  };

  const handleAddAccount = () => {
    console.log('[EditProfile] Add Account pressed');
  };

  const handleLogOut = () => {
    console.log('[EditProfile] Log Out pressed');
  };

  return (
    <>
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#F6F6F6" />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* ── Navigation Bar ─────────────────────────────── */}
        <View style={styles.navBar}>
          {/* Left: Back button */}
          <View style={styles.navBarSide}>
            <TouchableOpacity style={styles.backBtn} onPress={handleBack} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Ionicons name="chevron-back" size={20} color="#037EE5" />
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
          </View>

          {/* Center: Title - KHÔNG dùng absolute nữa */}
          <Text style={styles.navTitle}>Edit Profile</Text>

          {/* Right: Done button */}
          <View style={[styles.navBarSide, styles.navBarRight]}>
            <TouchableOpacity style={styles.doneBtn} onPress={handleDone} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Text style={styles.doneText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            // Tab Bar (83px) vẫn hiển thị vì màn hình nằm trong (tabs)
            // nên phải cộng thêm chiều cao của nó vào paddingBottom
            { paddingBottom: 83 + insets.bottom + 24 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* ── Edit Name Section ────────────────────────── */}
          <View style={styles.nameSection}>
            {/* Avatar */}
            <TouchableOpacity style={styles.avatarWrapper} onPress={handleAvatarPress}>
              {MOCK_USER.avatar ? (
                <Image source={{ uri: MOCK_USER.avatar }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Ionicons name="person" size={32} color="#FFFFFF" />
                </View>
              )}
              {/* Camera overlay */}
              <View style={styles.cameraOverlay}>
                <Ionicons name="camera" size={16} color="#FFFFFF" />
              </View>
            </TouchableOpacity>

            {/* Name inputs */}
            <View style={styles.nameInputs}>
              {/* First Name */}
              <TextInput
                style={styles.nameInput}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="First Name"
                placeholderTextColor="#C7C7CC"
                returnKeyType="next"
                onSubmitEditing={() => console.log('[EditProfile] First name submitted')}
              />

              {/* Separator */}
              <View style={styles.inputSeparator} />

              {/* Last Name */}
              <TextInput
                style={[styles.nameInput, styles.lastNameInput]}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Last Name"
                placeholderTextColor="#C7C7CC"
                returnKeyType="done"
              />
            </View>
          </View>

          {/* Helper text */}
          <Text style={styles.helperText}>
            Enter your name and add an optional profile photo.
          </Text>

          {/* ── Bio Section ──────────────────────────────── */}
          <View style={styles.bioSection}>
            <TextInput
              style={styles.bioInput}
              value={bio}
              onChangeText={setBio}
              placeholder="Bio"
              placeholderTextColor="#C7C7CC"
              multiline
              returnKeyType="done"
            />
          </View>

          {/* Helper text */}
          <Text style={styles.helperText}>
            Any details such as age, occupation or city.{'\n'}
            Example: 23 y.o. designer from San Francisco.
          </Text>

          {/* ── Info Rows ─────────────────────────────────── */}
          <View style={styles.section}>
            {/* Change Number */}
            <TouchableOpacity
              activeOpacity={0.6}
              style={styles.infoRow}
              onPress={handleChangeNumber}
            >
              <Text style={styles.infoLabel}>Change Number</Text>
              <View style={styles.infoTrail}>
                <Text style={styles.infoValue}>{MOCK_USER.phone}</Text>
                <Ionicons name="chevron-forward" size={17} color="rgba(60,60,67,0.3)" />
              </View>
            </TouchableOpacity>

            {/* Separator */}
            <View style={styles.rowSeparator} />

            {/* Username */}
            <TouchableOpacity
              activeOpacity={0.6}
              style={styles.infoRow}
              onPress={handleUsername}
            >
              <Text style={styles.infoLabel}>Username</Text>
              <View style={styles.infoTrail}>
                <Text style={styles.infoValue}>{MOCK_USER.username}</Text>
                <Ionicons name="chevron-forward" size={17} color="rgba(60,60,67,0.3)" />
              </View>
            </TouchableOpacity>
          </View>

          {/* ── Add Account ──────────────────────────────── */}
          <View style={[styles.section, styles.centeredSection]}>
            <TouchableOpacity
              activeOpacity={0.6}
              style={styles.centeredRow}
              onPress={handleAddAccount}
            >
              <Text style={styles.addAccountText}>Add Account</Text>
            </TouchableOpacity>
          </View>

          {/* ── Log Out ──────────────────────────────────── */}
          <View style={[styles.section, styles.centeredSection]}>
            <TouchableOpacity
              activeOpacity={0.6}
              style={styles.centeredRow}
              onPress={handleLogOut}
            >
              <Text style={styles.logOutText}>Log Out</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>

    {/* ── Avatar Action Sheet (Modal) ──────────────────────────── */}
    <Modal
      visible={showAvatarSheet}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={() => setShowAvatarSheet(false)}
    >
      {/* Overlay mờ */}
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowAvatarSheet(false)}
      />

      <View style={[styles.sheetContainer, { paddingBottom: insets.bottom + 8 }]}>
        {/* ── Menu card */}
        <View style={styles.sheetMenu}>
          {/* Hàng ảnh thumbnail */}
          <View style={styles.thumbnailRow}>
            {MOCK_THUMBNAILS.map((uri, i) => (
              <TouchableOpacity
                key={i}
                style={styles.thumbnail}
                onPress={handleChoosePhoto}
                activeOpacity={0.8}
              >
                {i === 0 ? (
                  // Ô đầu tiên là camera
                  <View style={styles.cameraThumb}>
                    <Ionicons name="camera" size={28} color="#FFFFFF" />
                  </View>
                ) : (
                  <Image source={{ uri }} style={styles.thumbnailImg} />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Option 4: Choose Photo */}
          <View style={styles.sheetSeparator} />
          <TouchableOpacity style={styles.sheetOption} onPress={handleChoosePhoto}>
            <Text style={styles.sheetOptionBlue}>Choose Photo</Text>
          </TouchableOpacity>

          {/* Option 3: Web Search */}
          <View style={styles.sheetSeparator} />
          <TouchableOpacity style={styles.sheetOption} onPress={handleWebSearch}>
            <Text style={styles.sheetOptionBlue}>Web Search</Text>
          </TouchableOpacity>

          {/* Option 2: View Photo */}
          <View style={styles.sheetSeparator} />
          <TouchableOpacity style={styles.sheetOption} onPress={handleViewPhoto}>
            <Text style={styles.sheetOptionBlue}>View Photo</Text>
          </TouchableOpacity>

          {/* Option 1: Remove Photo */}
          <View style={styles.sheetSeparator} />
          <TouchableOpacity style={styles.sheetOption} onPress={handleRemovePhoto}>
            <Text style={styles.sheetOptionRed}>Remove Photo</Text>
          </TouchableOpacity>
        </View>

        {/* ── Cancel button */}
        <TouchableOpacity
          style={styles.sheetCancel}
          onPress={() => setShowAvatarSheet(false)}
          activeOpacity={0.8}
        >
          <Text style={styles.sheetCancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </Modal>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const BLUE = '#037EE5';
const SEPARATOR = 'rgba(60,60,67,0.29)';
const ROW_BG = '#FFFFFF';
const SECTION_BG = '#EFEFF4';

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: SECTION_BG,
  },
  safeArea: {
    flex: 1,
    backgroundColor: SECTION_BG,
  },

  // ── Nav Bar
  navBar: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F6F6F6',
    borderBottomWidth: 0.33,
    borderBottomColor: '#A6A6AA',
    paddingHorizontal: 16,
  },
  // Cột trái và phải mỗi cái flex:1 để title thật sự nằm giữa
  navBarSide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  navBarRight: {
    alignItems: 'flex-end',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  backText: {
    fontSize: 17,
    color: BLUE,
    letterSpacing: -0.4,
  },
  navTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    letterSpacing: -0.4,
    textAlign: 'center',
    // Không còn position absolute - an toàn, không che touch
  },
  doneBtn: {
    paddingVertical: 4,
  },
  doneText: {
    fontSize: 17,
    fontWeight: '600',
    color: BLUE,
    letterSpacing: -0.4,
  },

  // ── Scroll
  scroll: { flex: 1 },
  scrollContent: {},

  // ── Name Section
  nameSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ROW_BG,
    borderTopWidth: 0.33,
    borderBottomWidth: 0.33,
    borderColor: SEPARATOR,
    marginTop: 16,
    paddingLeft: 15,
    paddingRight: 0,
    minHeight: 116,
  },
  avatarWrapper: {
    width: 66,
    height: 66,
    borderRadius: 33,
    marginRight: 12,
    position: 'relative',
  },
  avatar: {
    width: 66,
    height: 66,
    borderRadius: 33,
  },
  avatarFallback: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#B0B0B8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameInputs: {
    flex: 1,
  },
  nameInput: {
    height: 44,
    fontSize: 17,
    color: '#000',
    letterSpacing: -0.4,
    paddingHorizontal: 0,
  },
  lastNameInput: {
    color: '#C7C7CC',
  },
  inputSeparator: {
    height: 0.33,
    backgroundColor: SEPARATOR,
  },

  // ── Helper text
  helperText: {
    fontSize: 14,
    color: '#636366',
    letterSpacing: -0.15,
    lineHeight: 17,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
  },

  // ── Bio Section
  bioSection: {
    backgroundColor: ROW_BG,
    borderTopWidth: 0.33,
    borderBottomWidth: 0.33,
    borderColor: SEPARATOR,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 56,
  },
  bioInput: {
    fontSize: 17,
    color: '#000',
    letterSpacing: -0.4,
    minHeight: 22,
  },

  // ── Generic section
  section: {
    backgroundColor: ROW_BG,
    borderTopWidth: 0.33,
    borderBottomWidth: 0.33,
    borderColor: SEPARATOR,
    marginTop: 20,
  },

  // ── Info row (Change Number / Username)
  infoRow: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  infoLabel: {
    fontSize: 17,
    color: '#000',
    letterSpacing: -0.4,
  },
  infoTrail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoValue: {
    fontSize: 17,
    color: 'rgba(60,60,67,0.6)',
    letterSpacing: -0.4,
  },
  rowSeparator: {
    height: 0.33,
    backgroundColor: SEPARATOR,
    marginLeft: 16,
  },

  // ── Centered section (Add Account / Log Out)
  centeredSection: {},
  centeredRow: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addAccountText: {
    fontSize: 17,
    color: BLUE,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  logOutText: {
    fontSize: 17,
    color: '#FE3B30',
    letterSpacing: -0.4,
    textAlign: 'center',
  },

  // ── Action Sheet Modal
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheetContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 10,
    gap: 8,
  },
  sheetMenu: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
  },
  // Hàng thumbnail ảnh
  thumbnailRow: {
    flexDirection: 'row',
    padding: 8,
    gap: 6,
    backgroundColor: '#FFF',
  },
  thumbnail: {
    flex: 1,
    height: 84,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#E5E5EA',
  },
  thumbnailImg: {
    width: '100%',
    height: '100%',
  },
  cameraThumb: {
    width: '100%',
    height: '100%',
    backgroundColor: '#8E8E93',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
  },
  // Dòng option
  sheetSeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(60,60,67,0.29)',
    marginHorizontal: 0,
    opacity: 0.5,
  },
  sheetOption: {
    height: 57,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(254,254,254,0.0001)',
  },
  sheetOptionBlue: {
    fontSize: 20,
    color: '#037EE5',
    letterSpacing: 0.38,
    textAlign: 'center',
  },
  sheetOptionRed: {
    fontSize: 20,
    color: '#FE3B30',
    letterSpacing: 0.38,
    textAlign: 'center',
  },
  // Nút Cancel riêng biệt
  sheetCancel: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    height: 57,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetCancelText: {
    fontSize: 20,
    fontWeight: '500',
    color: '#037EE5',
    letterSpacing: 0.38,
    textAlign: 'center',
  },
});


import { Camera } from 'expo-camera';
import { Alert, Linking } from 'react-native';

export async function requestCallPermissions(isVideo: boolean): Promise<boolean> {
  try {
    const micStatus = await Camera.requestMicrophonePermissionsAsync();

    if (isVideo) {
      const cameraStatus = await Camera.requestCameraPermissionsAsync();

      if (!cameraStatus.granted || !micStatus.granted) {
        Alert.alert(
          'Cần cấp quyền',
          'Vui lòng cấp quyền camera và microphone để thực hiện cuộc gọi video.',
          [
            { text: 'Hủy', style: 'cancel' },
            { text: 'Mở Cài đặt', onPress: () => Linking.openSettings() }
          ]
        );
        return false;
      }
    } else {
      if (!micStatus.granted) {
        Alert.alert(
          'Cần cấp quyền',
          'Vui lòng cấp quyền microphone để thực hiện cuộc gọi thoại.',
          [
            { text: 'Hủy', style: 'cancel' },
            { text: 'Mở Cài đặt', onPress: () => Linking.openSettings() }
          ]
        );
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Permission request error:', error);
    return false;
  }
}

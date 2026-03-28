import { TouchableOpacity } from "react-native";

export interface ContactItemProps {
  onPress?: () => void;
}

export const ContactItem = ({ onPress }: ContactItemProps) => {
  return <TouchableOpacity onPress={onPress}>Hello</TouchableOpacity>;
};

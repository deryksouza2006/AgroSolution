import { useState } from 'react';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { AppInput, type AppInputProps } from './AppInput';

export function PasswordInput(props: Omit<AppInputProps, 'secureTextEntry' | 'trailing'>) {
  const [visible, setVisible] = useState(false);
  const { theme } = useTheme();
  return (
    <AppInput {...props} autoCapitalize="none" autoCorrect={false} secureTextEntry={!visible}
      trailing={
        <Pressable accessibilityRole="button" accessibilityLabel={`${visible ? 'Ocultar' : 'Mostrar'} ${props.label.toLowerCase()}`}
          accessibilityState={{ disabled: props.editable === false }} disabled={props.editable === false}
          onPress={() => setVisible(value => !value)} style={{ minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={24} color={theme.colors.primary} accessible={false} />
        </Pressable>
      }
    />
  );
}

import { useEffect, useRef, useState } from 'react';
import { Keyboard, Text, View } from 'react-native';
import { useAuthMutation } from '../hooks/auth/useAuthMutation';
import { useTheme } from '../hooks/useTheme';
import { parseApiError } from '../utils/errors';
import { validateAuthForm, type AuthFormErrors } from '../utils/validation';
import { AppButton } from './AppButton';
import { AppInput } from './AppInput';
import { PasswordInput } from './PasswordInput';
import { ScreenContainer } from './ScreenContainer';
import { ErrorState } from './feedback/ErrorState';
import { BrandMark } from './navigation/BrandMark';

interface Props { registering?: boolean; onSwitch: () => void }
export function AuthForm({ registering = false, onSwitch }: Props) {
  const { theme } = useTheme();
  const mutation = useAuthMutation(registering);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [errors, setErrors] = useState<AuthFormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const active = useRef(false);
  const submitting = useRef(false);
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);

  const submit = async () => {
    if (submitting.current || mutation.isPending) return;
    const input = { name: name.trim(), email: email.trim(), password };
    const validation = validateAuthForm(input, registering, confirmation);
    setErrors(validation);
    setSubmitError(null);
    if (Object.keys(validation).length) return;
    submitting.current = true;
    Keyboard.dismiss();
    try { await mutation.mutateAsync(input); }
    catch (error: unknown) { if (active.current) setSubmitError(parseApiError(error)); }
    finally {
      submitting.current = false;
      if (active.current) mutation.reset();
    }
  };

  return (
    <ScreenContainer keyboard fullSafeArea>
      <BrandMark />
      <View style={{ gap: theme.spacing.sm }}>
        <Text accessibilityRole="header" style={[theme.typography.title, { color: theme.colors.text }]}>{registering ? 'Crie sua conta' : 'Boas-vindas'}</Text>
        <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>{registering ? 'Cadastre-se para acessar sua conta de produtor.' : 'Entre com seu e-mail e senha para continuar.'}</Text>
      </View>
      <View style={{ gap: theme.spacing.lg }}>
        {registering && <AppInput label="Nome" value={name} onChangeText={setName} error={errors.name} autoComplete="name" textContentType="name" autoCapitalize="words" editable={!mutation.isPending} />}
        <AppInput label="E-mail" value={email} onChangeText={setEmail} error={errors.email} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" textContentType="emailAddress" editable={!mutation.isPending} />
        <PasswordInput label="Senha" value={password} onChangeText={setPassword} error={errors.password} hint="Use entre 8 e 72 caracteres." autoComplete={registering ? 'new-password' : 'current-password'} textContentType={registering ? 'newPassword' : 'password'} editable={!mutation.isPending} returnKeyType={registering ? 'next' : 'go'} onSubmitEditing={registering ? undefined : () => { void submit(); }} />
        {registering && <PasswordInput label="Confirmar senha" value={confirmation} onChangeText={setConfirmation} error={errors.confirmPassword} autoComplete="new-password" textContentType="newPassword" editable={!mutation.isPending} returnKeyType="go" onSubmitEditing={() => { void submit(); }} />}
        {submitError && <ErrorState title={registering ? 'Cadastro não concluído' : 'Não foi possível entrar'} message={submitError} />}
        <AppButton title={mutation.isPending ? 'Validando sua conta…' : registering ? 'Criar conta' : 'Entrar'} loading={mutation.isPending} onPress={() => { void submit(); }} />
        <AppButton title={registering ? 'Já tenho uma conta' : 'Criar uma conta'} variant="secondary" onPress={onSwitch} disabled={mutation.isPending} />
      </View>
    </ScreenContainer>
  );
}

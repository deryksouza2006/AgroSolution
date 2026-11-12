import { useMutation } from '@tanstack/react-query';
import type { SignUpInput } from '../../types/auth';
import { useAuth } from './useAuth';

export function useAuthMutation(registering: boolean) {
  const { signIn, signUp } = useAuth();
  return useMutation({
    mutationFn: (input: SignUpInput) => registering ? signUp(input) : signIn(input),
    retry: false,
    gcTime: 0,
    networkMode: 'always',
  });
}

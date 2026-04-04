import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '@/api/authApi';
import { useAuthStore } from '@/store/authStore';
import type { LoginRequest } from '@/types';

export function useLogin() {
  const navigate = useNavigate();
  const { setTokens, setUser } = useAuthStore();

  return useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: async (res) => {
      setTokens(res.accessToken, res.refreshToken);
      try {
        const user = await authApi.me();
        setUser(user);
      } catch {
        // user fetch failed but tokens are set
      }
      toast.success('Login successful');
      navigate('/projects');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Invalid credentials');
    },
  });
}

export function useRegister() {
  const navigate = useNavigate();
  const { setTokens, setUser } = useAuthStore();

  return useMutation({
    mutationFn: (data: { firstName: string; lastName: string; email: string; password: string }) =>
      authApi.register(data),
    onSuccess: async (res) => {
      setTokens(res.accessToken, res.refreshToken);
      try {
        const user = await authApi.me();
        setUser(user);
      } catch {
        // ignore
      }
      toast.success('Account created');
      navigate('/projects');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Registration failed');
    },
  });
}

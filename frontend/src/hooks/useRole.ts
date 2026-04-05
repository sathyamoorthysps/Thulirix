import { useAuthStore } from '@/store/authStore';

const EDIT_ROLES = ['SYSTEM_ADMIN', 'TEST_LEAD'];

export function useRole() {
  const user = useAuthStore((s) => s.user);
  const roles = user?.roles ?? [];
  const canEdit = roles.some((r) => EDIT_ROLES.includes(r));
  return { canEdit, roles };
}

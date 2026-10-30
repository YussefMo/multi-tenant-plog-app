import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createUser,
  deleteUser,
  getUser,
  inviteUser,
  listUsers,
  updateUser,
} from '@/lib/action/user.action';
import { tenantKeys } from '@/lib/query-keys';
import type { CreateUserPayload, UpdateUserPayload, UserListParams } from '@/lib/types/tenant.type';

const usersRoot = ['tenant', 'users'] as const;

function useInvalidateUsers() {
  const queryClient = useQueryClient();

  return () => {
    void queryClient.invalidateQueries({ queryKey: usersRoot });
    void queryClient.invalidateQueries({ queryKey: tenantKeys.overview });
    void queryClient.invalidateQueries({ queryKey: tenantKeys.profiles() });
  };
}

export function useUsers(params: UserListParams = {}, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: tenantKeys.users(params),
    queryFn: () => listUsers(params),
    enabled: options.enabled ?? true,
    staleTime: 0,
    gcTime: 0,
  });
}

export function useUser(userId: number | string | undefined) {
  return useQuery({
    queryKey: tenantKeys.user(userId ?? ''),
    queryFn: () => getUser(userId as number | string),
    enabled: Boolean(userId),
    staleTime: 0,
    gcTime: 0,
  });
}

export function useCreateUser() {
  const invalidate = useInvalidateUsers();

  return useMutation({
    mutationFn: (payload: CreateUserPayload) => createUser(payload),
    onSuccess: invalidate,
  });
}

export function useUpdateUser(userId: number | string) {
  const invalidate = useInvalidateUsers();

  return useMutation({
    mutationFn: (payload: UpdateUserPayload) => updateUser(userId, payload),
    onSuccess: invalidate,
  });
}

export function useDeleteUser() {
  const invalidate = useInvalidateUsers();

  return useMutation({
    mutationFn: (userId: number | string) => deleteUser(userId),
    onSuccess: invalidate,
  });
}

export function useInviteUser() {
  const invalidate = useInvalidateUsers();

  return useMutation({
    mutationFn: (userId: number | string) => inviteUser(userId),
    onSuccess: invalidate,
  });
}

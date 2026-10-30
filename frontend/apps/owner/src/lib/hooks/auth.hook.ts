import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ownerApi } from '@multi-tenant-plog/shared/lib/http';
import {
  getOwner,
  loginOwner,
  logoutOwner,
  updateOwnerPassword,
  updateOwnerProfile,
} from '@/lib/action/auth.action';
import { ownerKeys } from '@/lib/query-keys';
import type {
  LoginPayload,
  UpdatePasswordPayload,
  UpdateProfilePayload,
} from '@/lib/types/auth.type';

export function useOwnerMe() {
  return useQuery({
    queryKey: ownerKeys.me,
    queryFn: getOwner,
    staleTime: 0,
    gcTime: 0,
    retry: false,
  });
}

export function useOwnerLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: LoginPayload) => loginOwner(payload),
    onSuccess: (owner) => {
      queryClient.setQueryData(ownerKeys.me, owner);
      void queryClient.invalidateQueries({ queryKey: ownerKeys.all });
    },
  });
}

export function useOwnerLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logoutOwner,
    onSuccess: () => {
      ownerApi.clearCsrf();
      queryClient.clear();
    },
  });
}

export function useUpdateOwnerProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => updateOwnerProfile(payload),
    onSuccess: (owner) => {
      queryClient.setQueryData(ownerKeys.me, owner);
    },
  });
}

export function useUpdateOwnerPassword() {
  return useMutation({
    mutationFn: (payload: UpdatePasswordPayload) => updateOwnerPassword(payload),
  });
}

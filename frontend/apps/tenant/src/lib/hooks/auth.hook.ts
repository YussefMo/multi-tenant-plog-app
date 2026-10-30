import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tenantApi } from '@multi-tenant-plog/shared/lib/http';
import {
  acceptInvitation,
  getTenantMe,
  loginTenant,
  logoutTenant,
  supportEnd,
  supportLogin,
  updateTenantPassword,
  updateTenantProfile,
} from '@/lib/action/auth.action';
import { tenantKeys } from '@/lib/query-keys';
import type {
  AcceptInvitationPayload,
  LoginPayload,
  UpdatePasswordPayload,
  UpdateProfilePayload,
} from '@/lib/types/auth.type';

export function useTenantMe() {
  return useQuery({
    queryKey: tenantKeys.me,
    queryFn: getTenantMe,
    staleTime: 10 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: false,
  });
}

export function useTenantLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: LoginPayload) => loginTenant(payload),
    onSuccess: (user) => {
      queryClient.setQueryData(tenantKeys.me, user);
      void queryClient.invalidateQueries({ queryKey: tenantKeys.all });
    },
  });
}

export function useTenantLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logoutTenant,
    onSuccess: () => {
      tenantApi.clearCsrf();
      queryClient.clear();
    },
  });
}

export function useUpdateTenantProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => updateTenantProfile(payload),
    onSuccess: (user) => {
      queryClient.setQueryData(tenantKeys.me, (current: unknown) =>
        current && typeof current === 'object' ? { ...current, ...user } : current,
      );
    },
  });
}

export function useUpdateTenantPassword() {
  return useMutation({
    mutationFn: (payload: UpdatePasswordPayload) => updateTenantPassword(payload),
  });
}

export function useAcceptInvitation() {
  return useMutation({
    mutationFn: (payload: AcceptInvitationPayload) => acceptInvitation(payload),
  });
}

export function useSupportLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ticket: string) => supportLogin(ticket),
    onSuccess: (user) => {
      queryClient.setQueryData(tenantKeys.me, user);
    },
  });
}

export function useSupportEnd() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: supportEnd,
    onSuccess: () => {
      tenantApi.clearCsrf();
      queryClient.clear();
    },
  });
}

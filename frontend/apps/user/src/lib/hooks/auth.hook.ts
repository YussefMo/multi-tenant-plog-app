import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tenantApi } from '@multi-tenant-plog/shared/lib/http';
import {
  getViewerMe,
  loginViewer,
  logoutViewer,
  registerViewer,
  updateViewerPassword,
  updateViewerProfile,
} from '@/lib/action/auth.action';
import { viewerKeys } from '@/lib/query-keys';
import type {
  LoginPayload,
  RegisterPayload,
  UpdatePasswordPayload,
  UpdateProfilePayload,
} from '@/lib/types/auth.type';

export function useViewerMe() {
  return useQuery({
    queryKey: viewerKeys.me,
    queryFn: getViewerMe,
    staleTime: 10 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: false,
  });
}

export function useViewerLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: LoginPayload) => loginViewer(payload),
    onSuccess: (user) => {
      queryClient.setQueryData(viewerKeys.me, user);
      void queryClient.invalidateQueries({ queryKey: viewerKeys.all });
    },
  });
}

export function useViewerRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: RegisterPayload) => registerViewer(payload),
    onSuccess: (user) => {
      queryClient.setQueryData(viewerKeys.me, user);
      void queryClient.invalidateQueries({ queryKey: viewerKeys.all });
    },
  });
}

export function useViewerLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logoutViewer,
    onSuccess: () => {
      tenantApi.clearCsrf();
      queryClient.clear();
    },
  });
}

export function useUpdateViewerProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => updateViewerProfile(payload),
    onSuccess: (user) => {
      queryClient.setQueryData(viewerKeys.me, (current: unknown) =>
        current && typeof current === 'object' ? { ...current, ...user } : current,
      );
    },
  });
}

export function useUpdateViewerPassword() {
  return useMutation({
    mutationFn: (payload: UpdatePasswordPayload) => updateViewerPassword(payload),
  });
}

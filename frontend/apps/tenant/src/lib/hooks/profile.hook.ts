import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createProfile,
  deleteProfile,
  getPermissionCatalog,
  getProfile,
  listProfiles,
  updateProfile,
} from '@/lib/action/profile.action';
import { tenantKeys } from '@/lib/query-keys';
import type {
  CreatePermissionProfilePayload,
  UpdatePermissionProfilePayload,
} from '@/lib/types/profile.type';

const profilesRoot = ['tenant', 'profiles'] as const;

function useInvalidateProfiles() {
  const queryClient = useQueryClient();

  return () => {
    void queryClient.invalidateQueries({ queryKey: profilesRoot });
    void queryClient.invalidateQueries({ queryKey: tenantKeys.overview });
    void queryClient.invalidateQueries({ queryKey: tenantKeys.users() });
  };
}

export function useProfiles(
  params: { search?: string; per_page?: number; page?: number } = {},
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: tenantKeys.profiles(params),
    queryFn: () => listProfiles(params),
    enabled: options.enabled ?? true,
    staleTime: 0,
    gcTime: 0,
  });
}

export function useProfile(profileId: number | string | undefined) {
  return useQuery({
    queryKey: tenantKeys.profile(profileId ?? ''),
    queryFn: () => getProfile(profileId as number | string),
    enabled: Boolean(profileId),
    staleTime: 0,
    gcTime: 0,
  });
}

export function usePermissionCatalog(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: tenantKeys.permissions,
    queryFn: getPermissionCatalog,
    enabled: options.enabled ?? true,
    staleTime: 0,
    gcTime: 0,
  });
}

export function useCreateProfile() {
  const invalidate = useInvalidateProfiles();

  return useMutation({
    mutationFn: (payload: CreatePermissionProfilePayload) => createProfile(payload),
    onSuccess: invalidate,
  });
}

export function useUpdateProfile(profileId: number | string) {
  const invalidate = useInvalidateProfiles();

  return useMutation({
    mutationFn: (payload: UpdatePermissionProfilePayload) => updateProfile(profileId, payload),
    onSuccess: invalidate,
  });
}

export function useDeleteProfile() {
  const invalidate = useInvalidateProfiles();

  return useMutation({
    mutationFn: (profileId: number | string) => deleteProfile(profileId),
    onSuccess: invalidate,
  });
}

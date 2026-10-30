import { useNavigate, useParams } from 'react-router-dom';
import { ApiError } from '@multi-tenant-plog/shared/lib/http';
import { notify } from '@multi-tenant-plog/shared/lib/toast';
import { Spinner } from '@multi-tenant-plog/shared/components/components-parts';
import ErrorPanel from '@/components/ErrorPanel';
import PageHeader from '@/components/PageHeader';
import ProfileForm from '@/components/permission-profile/ProfileForm';
import { useProfile, useUpdateProfile } from '@/lib/hooks/profile.hook';
import type {
  CreatePermissionProfilePayload,
  UpdatePermissionProfilePayload,
} from '@/lib/types/profile.type';

function fieldErrors(error: unknown): Record<string, string> {
  if (!(error instanceof ApiError)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(error.errors).map(([field, messages]) => [
      field,
      messages[0] ?? 'Invalid value.',
    ]),
  );
}

export default function ProfileEdit() {
  const { profileId } = useParams<{ profileId: string }>();
  const navigate = useNavigate();
  const profileQuery = useProfile(profileId);
  const updateProfile = useUpdateProfile(profileId ?? '');

  if (profileQuery.isLoading) {
    return <Spinner />;
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <ErrorPanel
        error={profileQuery.error ?? new Error('Profile not found.')}
        onRetry={() => void profileQuery.refetch()}
      />
    );
  }

  const profile = profileQuery.data;

  const submit = (payload: CreatePermissionProfilePayload | UpdatePermissionProfilePayload) => {
    updateProfile.mutate(payload as UpdatePermissionProfilePayload, {
      onSuccess: () => {
        notify.success('Profile updated.');
        navigate('/profiles');
      },
      onError: (error) => notify.apiError(error, 'Unable to update profile.'),
    });
  };

  return (
    <div>
      <PageHeader title="Edit profile" description={profile.name} />
      <ProfileForm
        mode="edit"
        initialValues={{
          name: profile.name,
          description: profile.description,
          permissions: profile.permissions,
        }}
        onSubmit={submit}
        isPending={updateProfile.isPending}
        errors={fieldErrors(updateProfile.error)}
      />
    </div>
  );
}

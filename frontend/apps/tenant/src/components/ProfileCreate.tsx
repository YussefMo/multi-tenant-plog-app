import { useNavigate } from 'react-router-dom';
import { ApiError } from '@multi-tenant-plog/shared/lib/http';
import { notify } from '@multi-tenant-plog/shared/lib/toast';
import PageHeader from '@/components/PageHeader';
import ProfileForm from '@/components/permission-profile/ProfileForm';
import { useCreateProfile } from '@/lib/hooks/profile.hook';
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

export default function ProfileCreate() {
  const navigate = useNavigate();
  const createProfile = useCreateProfile();

  const submit = (payload: CreatePermissionProfilePayload | UpdatePermissionProfilePayload) => {
    createProfile.mutate(payload as CreatePermissionProfilePayload, {
      onSuccess: () => {
        notify.success('Profile created.');
        navigate('/profiles');
      },
      onError: (error) => notify.apiError(error, 'Unable to create profile.'),
    });
  };

  return (
    <div>
      <PageHeader title="Create profile" description="Add a reusable permission set." />
      <ProfileForm
        mode="create"
        onSubmit={submit}
        isPending={createProfile.isPending}
        errors={fieldErrors(createProfile.error)}
      />
    </div>
  );
}

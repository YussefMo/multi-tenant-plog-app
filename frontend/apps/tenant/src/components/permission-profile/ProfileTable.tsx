import { Pencil, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DeleteAlert } from '@multi-tenant-plog/shared/components/app-parts';
import {
  PillButton,
  TableBodyEmpty,
  TableBodySkeleton,
  TableHeaderRe,
} from '@multi-tenant-plog/shared/components/components-parts';
import { Table, TableBody, TableCell, TableRow } from '@multi-tenant-plog/shared/ui/table';
import { formatDate } from '@/lib/format';
import type { PermissionProfile } from '@/lib/types/profile.type';

interface ProfileTableProps {
  profiles: PermissionProfile[];
  isLoading?: boolean;
  onDelete?: (profile: PermissionProfile) => void;
  pendingProfileId?: number | null;
}

export default function ProfileTable({
  profiles,
  isLoading = false,
  onDelete,
  pendingProfileId = null,
}: ProfileTableProps) {
  const navigate = useNavigate();

  return (
    <Table>
      <TableHeaderRe
        headers={['Profile', 'Description', 'Permissions', 'Users', 'Created', 'Actions']}
        lastColumnAlign="end"
      />
      {isLoading ? (
        <TableBodySkeleton colNum={6} rowCount={6} />
      ) : profiles.length === 0 ? (
        <TableBodyEmpty
          title="No permission profiles"
          description="Create a reusable permission set."
        />
      ) : (
        <TableBody>
          {profiles.map((profile) => (
            <TableRow key={profile.id}>
              <TableCell className="px-4 py-3 font-medium">{profile.name}</TableCell>
              <TableCell className="text-muted-foreground px-4 py-3 text-sm">
                {profile.description ?? '—'}
              </TableCell>
              <TableCell className="px-4 py-3 text-sm">{profile.permissions.length}</TableCell>
              <TableCell className="px-4 py-3 text-sm">{profile.users_count ?? 0}</TableCell>
              <TableCell className="text-muted-foreground px-4 py-3 text-sm">
                {formatDate(profile.created_at)}
              </TableCell>
              <TableCell className="px-4 py-3">
                <div className="flex items-center justify-end gap-1">
                  <PillButton
                    label="Edit profile"
                    icon={Pencil}
                    onClick={() => navigate(`/profiles/${profile.id}/edit`)}
                  />
                  <DeleteAlert
                    title={`Delete ${profile.name}?`}
                    description="Profiles assigned to users cannot be deleted."
                    isPending={pendingProfileId === profile.id}
                    onConfirm={() => onDelete?.(profile)}
                    trigger={<PillButton label="Delete profile" icon={Trash2} />}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      )}
    </Table>
  );
}

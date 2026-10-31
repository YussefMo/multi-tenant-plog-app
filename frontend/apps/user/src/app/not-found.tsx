import { Compass } from 'lucide-react';
import { Link } from 'react-router-dom';
import { StatePage } from '@multi-tenant-plog/shared/components/components-parts';
import { Button } from '@multi-tenant-plog/shared/ui/button';

export default function NotFound() {
  return (
    <StatePage
      icon={Compass}
      title="Page not found"
      description="This user route does not exist."
      meta="404 · User web"
      actions={
        <Button asChild>
          <Link to="/">Back to discover</Link>
        </Button>
      }
    />
  );
}

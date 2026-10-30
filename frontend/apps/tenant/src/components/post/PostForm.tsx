import { useState, type FormEvent } from 'react';
import { Save } from 'lucide-react';
import { Button } from '@multi-tenant-plog/shared/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@multi-tenant-plog/shared/ui/card';
import { Input } from '@multi-tenant-plog/shared/ui/input';
import { Label } from '@multi-tenant-plog/shared/ui/label';
import { Textarea } from '@multi-tenant-plog/shared/ui/textarea';
import type { CreatePostPayload, UpdatePostPayload } from '@/lib/types/post.type';

interface PostFormProps {
  mode: 'create' | 'edit';
  initialValues?: { title?: string; body?: string };
  onSubmit: (payload: CreatePostPayload | UpdatePostPayload) => void;
  isPending?: boolean;
  errors?: Record<string, string>;
}

export default function PostForm({
  mode,
  initialValues,
  onSubmit,
  isPending = false,
  errors: serverErrors = {},
}: PostFormProps) {
  const [title, setTitle] = useState(initialValues?.title ?? '');
  const [body, setBody] = useState(initialValues?.body ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};

    if (!title.trim()) {
      nextErrors.title = 'Title is required.';
    }

    if (!body.trim()) {
      nextErrors.body = 'Body is required.';
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    onSubmit({ title: title.trim(), body: body.trim() });
  };

  const fieldError = (field: 'title' | 'body') => errors[field] ?? serverErrors[field];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === 'create' ? 'Post details' : 'Edit post'}</CardTitle>
        <CardDescription>
          {mode === 'create'
            ? 'New posts start as drafts. Publish when ready.'
            : 'Update the title or body.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={submit} noValidate>
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              aria-invalid={Boolean(fieldError('title'))}
              onChange={(event) => setTitle(event.target.value)}
            />
            {fieldError('title') ? (
              <p className="text-destructive text-xs">{fieldError('title')}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Body</Label>
            <Textarea
              id="body"
              value={body}
              className="min-h-48"
              aria-invalid={Boolean(fieldError('body'))}
              onChange={(event) => setBody(event.target.value)}
            />
            {fieldError('body') ? (
              <p className="text-destructive text-xs">{fieldError('body')}</p>
            ) : null}
          </div>

          <Button type="submit" disabled={isPending}>
            <Save className="size-4" />
            {isPending ? 'Saving…' : mode === 'create' ? 'Create post' : 'Save changes'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

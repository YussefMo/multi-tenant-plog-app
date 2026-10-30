import type { ChangeEvent } from 'react';
import {
  FormControl,
  FormField as FormFieldPrimitive,
  FormItem,
  FormLabel,
  FormMessage,
} from '@shared/ui/form';
import { Input } from '@shared/ui/input';
import { Textarea } from '@shared/ui/textarea';
import { cn } from '@shared/lib/utils';
import { useFormContext, type FieldValues, type Path } from 'react-hook-form';

type EmptyNumberValue = 'zero' | 'undefined' | '';

interface FormFieldProps<T extends FieldValues> {
  name: Path<T>;
  label?: string;
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'file' | 'number' | 'textarea';
  startAdornment?: string;
  onChange?: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  hidden?: boolean;
  readonly?: boolean;
  disabled?: boolean;
  allowNegative?: boolean;
  emptyNumberValue?: EmptyNumberValue;
  labelClassName?: string;
  inputClassName?: string;
  textareaClassName?: string;
}

export default function FormField({
  name,
  label,
  placeholder,
  type = 'text',
  startAdornment,
  onChange,
  hidden,
  readonly,
  disabled,
  allowNegative,
  emptyNumberValue = 'zero',
  labelClassName,
  inputClassName,
  textareaClassName,
}: FormFieldProps<FieldValues>) {
  const { control } = useFormContext();

  return (
    <FormFieldPrimitive
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem data-field={name} className={cn(hidden && 'hidden')}>
          <FormLabel className={labelClassName}>{label}</FormLabel>
          <FormControl>
            {type === 'textarea' ? (
              <Textarea
                className={cn('min-h-30', textareaClassName, inputClassName)}
                placeholder={placeholder}
                {...field}
                value={field.value ?? ''}
                name={name}
                readOnly={readonly}
                disabled={disabled}
              />
            ) : (
              <div className="relative flex w-full items-center">
                {startAdornment ? (
                  <span className="text-muted-foreground absolute end-3">{startAdornment}</span>
                ) : null}
                <Input
                  className={inputClassName}
                  placeholder={placeholder}
                  {...field}
                  value={field.value ?? ''}
                  type={type}
                  name={name}
                  readOnly={readonly}
                  disabled={disabled}
                  onChange={(event) => {
                    if (type === 'number') {
                      const value = event.target.value;

                      if (value !== '') {
                        field.onChange(Number(value));
                      } else if (allowNegative) {
                        field.onChange('');
                      } else if (emptyNumberValue === 'undefined') {
                        field.onChange(undefined);
                      } else if (emptyNumberValue === '') {
                        field.onChange('');
                      } else {
                        field.onChange(0);
                      }
                    } else {
                      field.onChange(event.target.value);
                    }

                    onChange?.(event);
                  }}
                />
              </div>
            )}
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

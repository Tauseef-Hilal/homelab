import { FieldValues, UseFormSetError } from 'react-hook-form';

export function mapServerFieldErrors<T extends FieldValues>(
  fieldErrors: Record<string, string[]>,
  setError: UseFormSetError<T>
) {
  Object.entries(fieldErrors).forEach(([field, messages]) => {
    messages.forEach((message) => {
      setError(`${field}`, {
        type: 'server',
        message,
      });
    });
  });
}

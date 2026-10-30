import { Download } from 'lucide-react';
import PillButton from './PillButton';

interface ExportCSVButtonProps {
  data: object[];
  filename?: string;
  buttonText?: string;
  disabled?: boolean;
  className?: string;
}

function escapeCell(value: unknown): string {
  const text = value == null ? '' : String(value);

  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function toCsv(rows: object[]): string {
  if (rows.length === 0) {
    return '';
  }

  const headers = Object.keys(rows[0]);

  return [
    headers.join(','),
    ...rows.map((row) =>
      headers.map((header) => escapeCell((row as Record<string, unknown>)[header])).join(','),
    ),
  ].join('\n');
}

export function ExportCSVButton({
  data,
  filename = 'export.csv',
  buttonText = 'Export',
  disabled = false,
  className,
}: ExportCSVButtonProps) {
  const exportCsv = () => {
    const blob = new Blob([toCsv(data)], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <PillButton
      label={buttonText}
      icon={Download}
      showLabel
      className={className}
      onClick={exportCsv}
      disabled={data.length === 0 || disabled}
    />
  );
}

export default ExportCSVButton;

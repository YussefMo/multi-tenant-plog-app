import type { ReactNode } from 'react';

interface ToolbarActionsMenuItemProps {
  icon: ReactNode;
  label: string;
  onClick?: () => void;
}

export default function ToolbarActionsMenuItem({
  icon,
  label,
  onClick,
}: ToolbarActionsMenuItemProps) {
  return (
    <button
      type="button"
      className="hover:bg-accent flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm"
      onClick={onClick}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

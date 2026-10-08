import type { Icon } from '@phosphor-icons/react';
import { MonitorIcon, MoonIcon, SunIcon } from '@phosphor-icons/react';
import type { HTMLAttributes } from 'react';
import type { Appearance } from '@/hooks/use-appearance';
import { useAppearance } from '@/hooks/use-appearance';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export default function AppearanceToggleTab({
    className = '',
    ...props
}: HTMLAttributes<HTMLDivElement>) {
    const { appearance, updateAppearance } = useAppearance();

    const tabs: { value: Appearance; icon: Icon; label: string }[] = [
        { value: 'light', icon: SunIcon, label: 'Light' },
        { value: 'dark', icon: MoonIcon, label: 'Dark' },
        { value: 'system', icon: MonitorIcon, label: 'System' },
    ];

    return (
        <div
            className={cn('inline-flex gap-1 border bg-muted p-1', className)}
            {...props}
        >
            {tabs.map(({ value, icon: Icon, label }) => (
                <button
                    key={value}
                    onClick={() => updateAppearance(value)}
                    className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors',
                        appearance === value
                            ? 'bg-background text-foreground shadow-xs'
                            : 'text-muted-foreground hover:bg-background/60 hover:text-foreground',
                    )}
                >
                    <Icon className="size-4" />
                    <span>{t(label)}</span>
                </button>
            ))}
        </div>
    );
}

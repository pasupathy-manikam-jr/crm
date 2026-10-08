import { Link } from '@inertiajs/react';
import { CalendarBlankIcon, RowsIcon } from '@phosphor-icons/react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { calendar, index } from '@/routes/activities';
import { t } from '@/lib/i18n';

/** List / Calendar switch shared by My tasks and the calendar. */
export function TasksViewToggle({ value }: { value: 'list' | 'calendar' }) {
    return (
        <ToggleGroup type="single" variant="outline" value={value}>
            <ToggleGroupItem value="list" asChild>
                <Link href={index()}>
                    <RowsIcon data-icon="inline-start" />
                    {t('List')}
                </Link>
            </ToggleGroupItem>
            <ToggleGroupItem value="calendar" asChild>
                <Link href={calendar()}>
                    <CalendarBlankIcon data-icon="inline-start" />
                    {t('Calendar')}
                </Link>
            </ToggleGroupItem>
        </ToggleGroup>
    );
}

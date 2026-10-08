import { usePage } from '@inertiajs/react';
import type { Icon as PhosphorIcon } from '@phosphor-icons/react';
import {
    CheckSquareIcon,
    ClockCounterClockwiseIcon,
    InfoIcon,
    NoteIcon,
    PaperclipIcon,
} from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { ActivityPanel } from '@/components/crm/activity-panel';
import { FilesPanel } from '@/components/crm/files-panel';
import { HistoryPanel } from '@/components/crm/history-panel';
import { NotesPanel } from '@/components/crm/notes-panel';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { t } from '@/lib/i18n';
import type { Option, RecordTabData, Regarding } from '@/types';

/**
 * The tabs under every record's header: its own Overview, then Activities, Notes,
 * Files and History. The open tab survives saves, which keep page state.
 */
export function RecordTabs({
    record,
    overview,
    owners,
    data,
}: {
    record: Regarding;
    overview: ReactNode;
    owners: Option[];
    data: RecordTabData;
}) {
    const [tab, setTab] = useState('overview');
    const openActivities = data.activities.filter((a) => !a.done_at).length;
    const { url } = usePage();

    return (
        <Tabs
            key={url.split('?')[0]}
            value={tab}
            onValueChange={setTab}
            className="flex flex-col gap-6"
        >
            <TabsList
                variant="line"
                className="h-auto w-full justify-start gap-6 overflow-x-auto border-b p-0 group-data-horizontal/tabs:h-auto"
            >
                <Tab value="overview" icon={InfoIcon} label="Overview" />
                <Tab
                    value="activities"
                    icon={CheckSquareIcon}
                    label="Activities"
                    count={openActivities}
                />
                <Tab
                    value="notes"
                    icon={NoteIcon}
                    label="Notes"
                    count={data.notes.length}
                />
                <Tab
                    value="files"
                    icon={PaperclipIcon}
                    label="Files"
                    count={data.attachments.length}
                />
                <Tab
                    value="history"
                    icon={ClockCounterClockwiseIcon}
                    label="History"
                />
            </TabsList>
            <TabsContent value="overview" className="flex flex-col gap-8">
                {overview}
            </TabsContent>
            <TabsContent value="activities">
                <ActivityPanel
                    activities={data.activities}
                    types={data.activityTypes}
                    owners={owners}
                    regarding={record}
                />
            </TabsContent>
            <TabsContent value="notes">
                <NotesPanel notes={data.notes} record={record} />
            </TabsContent>
            <TabsContent value="files">
                <FilesPanel attachments={data.attachments} record={record} />
            </TabsContent>
            <TabsContent value="history">
                <HistoryPanel history={data.history} />
            </TabsContent>
        </Tabs>
    );
}

/** An underlined tab with icon and optional count; the active one is emerald, like the top bar. */
function Tab({
    value,
    icon: Icon,
    label,
    count = 0,
}: {
    value: string;
    icon: PhosphorIcon;
    label: string;
    count?: number;
}) {
    return (
        <TabsTrigger
            value={value}
            className="h-10 flex-none gap-2 px-0.5 text-sm after:hidden data-active:border-transparent data-active:text-foreground data-active:shadow-[inset_0_-2px_0_var(--primary)]"
        >
            <Icon />
            {t(label)}
            {count > 0 && <Badge variant="secondary">{count}</Badge>}
        </TabsTrigger>
    );
}

import { usePage } from '@inertiajs/react';
import {
    AddressBookIcon,
    BuildingsIcon,
    ChartBarIcon,
    BrowsersIcon,
    SlidersHorizontalIcon,
    PackageIcon,
    ReceiptIcon,
    CheckSquareIcon,
    CalendarDotsIcon,
    CurrencyCircleDollarIcon,
    LifebuoyIcon,
    FileTextIcon,
    SquaresFourIcon,
    TargetIcon,
    UserGearIcon,
    UsersThreeIcon,
    FlowArrowIcon,
    CalendarXIcon,
    WebhooksLogoIcon,
    TrayIcon,
    EnvelopeSimpleIcon,
} from '@phosphor-icons/react';
import { dashboard } from '@/routes';
import { calendar, index as activities } from '@/routes/activities';
import { index as accounts } from '@/routes/accounts';
import { index as cases } from '@/routes/cases';
import { index as contacts } from '@/routes/contacts';
import { index as contracts } from '@/routes/contracts';
import { index as deals } from '@/routes/deals';
import { index as fields } from '@/routes/fields';
import { index as holidays } from '@/routes/holidays';
import { index as inbox } from '@/routes/inbox';
import { index as leads } from '@/routes/leads';
import { index as mailboxes } from '@/routes/mailboxes';
import { index as products } from '@/routes/products';
import { index as quotes } from '@/routes/quotes';
import { index as reports } from '@/routes/reports';
import { index as teams } from '@/routes/teams';
import { index as users } from '@/routes/users';
import { index as webForms } from '@/routes/web-forms';
import { index as webhooks } from '@/routes/webhooks';
import { index as workflows } from '@/routes/workflows';
import type { NavItem } from '@/types';

/** The app's sections: everyone's workspace, plus admin pages for admins only. */
export function useNavItems(): { main: NavItem[]; admin: NavItem[] } {
    const { auth } = usePage().props;

    return {
        main: [
            { title: 'Dashboard', href: dashboard(), icon: SquaresFourIcon },
            { title: 'Leads', href: leads(), icon: TargetIcon },
            { title: 'Deals', href: deals(), icon: CurrencyCircleDollarIcon },
            { title: 'Quotes', href: quotes(), icon: ReceiptIcon },
            { title: 'Accounts', href: accounts(), icon: BuildingsIcon },
            { title: 'Contacts', href: contacts(), icon: AddressBookIcon },
            {
                title: 'Cases',
                href: cases(),
                icon: LifebuoyIcon,
                badge: auth.breachedCases,
            },
            { title: 'Contracts', href: contracts(), icon: FileTextIcon },
            {
                title: 'Tasks',
                href: activities(),
                icon: CheckSquareIcon,
                badge: auth.dueActivities,
            },
            { title: 'Calendar', href: calendar(), icon: CalendarDotsIcon },
            { title: 'Reports', href: reports(), icon: ChartBarIcon },
        ],
        admin: [
            ...(auth.can.manageCatalog
                ? [
                      {
                          title: 'Products',
                          href: products(),
                          icon: PackageIcon,
                      },
                      { title: 'Inbox', href: inbox(), icon: TrayIcon },
                      {
                          title: 'Website forms',
                          href: webForms(),
                          icon: BrowsersIcon,
                      },
                  ]
                : []),
            ...(auth.can.manageUsers
                ? [
                      { title: 'Users', href: users(), icon: UserGearIcon },
                      { title: 'Teams', href: teams(), icon: UsersThreeIcon },
                      {
                          title: 'Workflows',
                          href: workflows(),
                          icon: FlowArrowIcon,
                      },
                      {
                          title: 'Holidays',
                          href: holidays(),
                          icon: CalendarXIcon,
                      },
                      {
                          title: 'Mailboxes',
                          href: mailboxes(),
                          icon: EnvelopeSimpleIcon,
                      },
                      {
                          title: 'Webhooks',
                          href: webhooks(),
                          icon: WebhooksLogoIcon,
                      },
                      {
                          title: 'Custom fields',
                          href: fields(),
                          icon: SlidersHorizontalIcon,
                      },
                  ]
                : []),
        ],
    };
}

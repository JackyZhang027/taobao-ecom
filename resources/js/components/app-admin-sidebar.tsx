import { Link } from '@inertiajs/react';
import { LayoutGrid, Package, ShoppingCart, Tag, TrendingUp, FolderTree, Settings, Image as ImageIcon, Heart,
    BarChart2, BookMarked, BookOpen, FileText, FolderGit2, Scale
 } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { NavItem } from '@/types';

const masterDataItems: NavItem[] = [
    { title: 'Categories', href: '/admin/categories', icon: FolderTree },
    { title: 'Products', href: '/admin/products', icon: Package },
    { title: 'Attributes', href: '/admin/attribute-types', icon: Tag },
];

const transactionItems: NavItem[] = [
    { title: 'Orders', href: '/admin/orders', icon: ShoppingCart },
    { title: 'Wishlists', href: '/admin/wishlists', icon: Heart },
];

const settingItems: NavItem[] = [
    { title: 'Shop Settings', href: '/admin/settings/shop', icon: Settings },
    { title: 'Hero Slides', href: '/admin/settings/hero', icon: ImageIcon },
    { title: 'Exchange Rates', href: '/admin/exchange-rates', icon: TrendingUp },
];

const accountingNavItems: NavItem[] = [
    { title: 'Chart of Accounts', href: '/admin/accounting/accounts',                icon: BookOpen },
    { title: 'Journal Entries',   href: '/admin/accounting/journals',                icon: FileText },
    { title: 'General Ledger',    href: '/admin/accounting/ledger',                  icon: BookMarked },
    { title: 'Trial Balance',     href: '/admin/accounting/reports/trial-balance',   icon: Scale },
    { title: 'Balance Sheet',     href: '/admin/accounting/reports/balance-sheet',   icon: BarChart2 },
    { title: 'Income Statement',  href: '/admin/accounting/reports/income-statement', icon: TrendingUp },
];

export function AppAdminSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/admin" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain label="Platform" items={[{ title: 'Dashboard', href: '/admin', icon: LayoutGrid }]} />
                <NavMain label="Master Data" items={masterDataItems} />
                <NavMain label="Transaction" items={transactionItems} />
                <NavMain label="Accounting" items={accountingNavItems} />
                <NavMain label="Setting" items={settingItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}

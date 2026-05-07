import { Link } from '@inertiajs/react';
import { LayoutGrid, Package, ShoppingCart, Tag, TrendingUp, FolderTree, Settings, Image as ImageIcon, Heart,
    BarChart2, BookMarked, BookOpen, FileText, Scale, Users, UserCog, Shield
 } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { usePermission } from '@/hooks/use-permission';
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

export function AppAdminSidebar() {
    const { can } = usePermission();

    const masterDataItems = [
        can('categories.view') && { title: 'Categories', href: '/admin/categories', icon: FolderTree },
        can('products.view')   && { title: 'Products',   href: '/admin/products',   icon: Package },
        can('attributes.view') && { title: 'Attributes', href: '/admin/attribute-types', icon: Tag },
    ].filter(Boolean) as NavItem[];

    const transactionItems = [
        can('customers.view')  && { title: 'Customers', href: '/admin/customers', icon: Users },
        can('orders.view')     && { title: 'Orders',    href: '/admin/orders',    icon: ShoppingCart },
        can('wishlists.view')  && { title: 'Wishlists', href: '/admin/wishlists', icon: Heart },
    ].filter(Boolean) as NavItem[];

    const accountingNavItems = [
        can('accounting_accounts.view')         && { title: 'Chart of Accounts', href: '/admin/accounting/accounts',                  icon: BookOpen },
        can('accounting_journals.view')         && { title: 'Journal Entries',   href: '/admin/accounting/journals',                  icon: FileText },
        can('accounting_ledger.view')           && { title: 'General Ledger',    href: '/admin/accounting/ledger',                    icon: BookMarked },
        can('accounting_trial_balance.view')    && { title: 'Trial Balance',     href: '/admin/accounting/reports/trial-balance',     icon: Scale },
        can('accounting_balance_sheet.view')    && { title: 'Balance Sheet',     href: '/admin/accounting/reports/balance-sheet',     icon: BarChart2 },
        can('accounting_income_statement.view') && { title: 'Income Statement',  href: '/admin/accounting/reports/income-statement',  icon: TrendingUp },
    ].filter(Boolean) as NavItem[];

    const settingItems = [
        can('users.view')    && { title: 'Users',   href: '/admin/users',          icon: UserCog },
        can('roles.view')    && { title: 'Roles',         href: '/admin/roles',          icon: Shield },
        can('settings.view')      && { title: 'Shop Settings', href: '/admin/settings/shop',  icon: Settings },
        can('hero_slides.view')   && { title: 'Hero Slides',   href: '/admin/settings/hero',  icon: ImageIcon },
        can('exchange_rates.view')&& { title: 'Exchange Rates',href: '/admin/exchange-rates', icon: TrendingUp },
    ].filter(Boolean) as NavItem[];

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
                {can('dashboard.view') && (
                    <NavMain label="Platform" items={[{ title: 'Dashboard', href: '/admin', icon: LayoutGrid }]} />
                )}
                {masterDataItems.length > 0 && <NavMain label="Master Data" items={masterDataItems} />}
                {transactionItems.length > 0 && <NavMain label="Transaction" items={transactionItems} />}
                {accountingNavItems.length > 0 && <NavMain label="Accounting" items={accountingNavItems} />}
                {settingItems.length > 0 && <NavMain label="Setting" items={settingItems} />}
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}

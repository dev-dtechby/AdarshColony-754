import {
  LayoutDashboard,
  ClipboardSignature,
  Users,
  Building2,
  Home,
  BadgeCheck,
  FileText,
  Receipt,
  Wallet,
  CalendarDays,
  Bell,
  Search,
  BarChart3,
  Settings,
  ShieldCheck,
  UserCog,
  Lock,
  Trash2,
  Sliders,
} from "lucide-react";

export interface MenuItemProps {
  title: string;
  icon: any;
  href?: string;
  child?: MenuItemProps[];
  nested?: MenuItemProps[];
  megaMenu?: MenuItemProps[];
  multi_menu?: MenuItemProps[];
  description?: string;
  onClick?: () => void;
}

/**
 * AdarshApp navigation philosophy:
 * - Society core modules first (Registration, Residents, Blocks/Flats)
 * - Then Maintenance + Receipts
 * - Then Governance (Letters/Notices, Meetings)
 * - Then Reports + Admin
 */

const societyMasterMenu: MenuItemProps = {
  title: "Society Master",
  icon: Building2,
  child: [
    {
      title: "Blocks",
      icon: Building2,
      href: "/blocks",
      description: "Create/manage 26 blocks",
    },
    {
      title: "Flats",
      icon: Home,
      href: "/flats",
      description: "Flat mapping (29 flats per block)",
    },
    {
      title: "Members/Residents",
      icon: Users,
      href: "/residents",
      description: "Residents directory + profile view",
    },
  ],
};

const registrationMenu: MenuItemProps = {
  title: "Registration",
  icon: ClipboardSignature,
  child: [
    {
      title: "New Registration",
      icon: ClipboardSignature,
      href: "/registration/new",
      description: "Membership registration form",
    },
    {
      title: "All Registrations",
      icon: Search,
      href: "/registration/list",
      description: "Search/filter by block/flat/date",
    },
    {
      title: "Approved Members",
      icon: BadgeCheck,
      href: "/registration/approved",
      description: "Approved/verified registrations",
    },
  ],
};

const maintenanceMenu: MenuItemProps = {
  title: "Maintenance",
  icon: Wallet,
  child: [
    {
      title: "Maintenance Entry",
      icon: Wallet,
      href: "/maintenance/entry",
      description: "Collect monthly maintenance",
    },
    {
      title: "Maintenance Ledger",
      icon: FileText,
      href: "/maintenance/ledger",
      description: "Block/flat-wise ledger view",
    },
    {
      title: "Receipts",
      icon: Receipt,
      href: "/maintenance/receipts",
      description: "Auto receipts + download history",
    },
  ],
};

const governanceMenu: MenuItemProps = {
  title: "Governance",
  icon: Bell,
  child: [
    {
      title: "Letters / Notices",
      icon: FileText,
      href: "/letters",
      description: "Committee letters & notices archive",
    },
    {
      title: "Meetings",
      icon: CalendarDays,
      href: "/meetings",
      description: "Agenda + attendance + uploads",
    },
  ],
};

const reportsMenu: MenuItemProps = {
  title: "Reports",
  icon: BarChart3,
  child: [
    {
      title: "Monthly Summary",
      icon: BarChart3,
      href: "/reports/monthly",
      description: "Monthly collection & expenses summary",
    },
    {
      title: "Defaulter List",
      icon: Bell,
      href: "/reports/defaulters",
      description: "Pending maintenance list by block/flat",
    },
    {
      title: "Downloads",
      icon: FileText,
      href: "/reports/downloads",
      description: "Export PDF/Excel (where applicable)",
    },
  ],
};

const adminMenu: MenuItemProps = {
  title: "Admin",
  icon: Settings,
  child: [
    {
      title: "Roles & Permissions",
      icon: ShieldCheck,
      href: "/admin/roles",
      description: "Resident / Block Admin / Treasurer controls",
    },
    {
      title: "Users",
      icon: UserCog,
      href: "/admin/users",
      description: "Create/manage login users",
    },
    {
      title: "System Settings",
      icon: Sliders,
      href: "/admin/system-settings",
      description: "Application settings & configuration",
    },
    {
      title: "Admin Tools",
      icon: Lock,
      href: "/admin/tools",
      description: "Restricted admin-only utilities",
    },
    {
      title: "Deleted Records",
      icon: Trash2,
      href: "/admin/deleted-records",
      description: "If enabled: view removed data",
    },
  ],
};

export const menusConfig = {
  /* =========================
     TOP / MAIN NAV
  ========================= */
  mainNav: [
    { title: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },

    societyMasterMenu,
    registrationMenu,
    maintenanceMenu,
    governanceMenu,
    reportsMenu,
    adminMenu,
  ],

  /* =========================
     SIDEBAR NAV
  ========================= */
  sidebarNav: {
    modern: [
      { title: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },

      societyMasterMenu,
      registrationMenu,
      maintenanceMenu,
      governanceMenu,
      reportsMenu,
      adminMenu,
    ],

    classic: [
      { isHeader: true, title: "menu" } as any,

      { title: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },

      {
        title: societyMasterMenu.title,
        icon: societyMasterMenu.icon,
        href: "#",
        child: societyMasterMenu.child,
      },

      {
        title: registrationMenu.title,
        icon: registrationMenu.icon,
        href: "#",
        child: registrationMenu.child,
      },

      {
        title: maintenanceMenu.title,
        icon: maintenanceMenu.icon,
        href: "#",
        child: maintenanceMenu.child,
      },

      {
        title: governanceMenu.title,
        icon: governanceMenu.icon,
        href: "#",
        child: governanceMenu.child,
      },

      {
        title: reportsMenu.title,
        icon: reportsMenu.icon,
        href: "#",
        child: reportsMenu.child,
      },

      {
        title: adminMenu.title,
        icon: adminMenu.icon,
        href: "#",
        child: adminMenu.child,
      },
    ],
  },
};

export type ModernNavType = (typeof menusConfig.sidebarNav.modern)[number];
export type ClassicNavType = (typeof menusConfig.sidebarNav.classic)[number];
export type MainNavType = (typeof menusConfig.mainNav)[number];

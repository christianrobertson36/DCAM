import {
  Building2,
  CalendarDays,
  ClipboardCheck,
  Download,
  LayoutDashboard,
  Save,
  SlidersHorizontal,
  Users
} from "lucide-react";

// Central navigation catalogue. Future modules should be registered here so
// visibility, grouping, permissions and rollout state stay consistent.
export const navigationGroups = [
  {
    id: "overview",
    label: "Overview",
    items: [
      {
        id: "dashboard",
        label: "Dashboard",
        path: "/dashboard",
        icon: LayoutDashboard,
        requiredPermission: "dashboard:view",
        requiredRole: null,
        requiredModule: "core",
        status: "active"
      }
    ]
  },
  {
    id: "crm",
    label: "CRM",
    items: [
      { id: "customers", label: "Customers", path: "/customers", icon: Users, requiredPermission: "customers:view", requiredRole: null, requiredModule: "crm", status: "active" },
      { id: "contacts", label: "Contacts", path: "/contacts", icon: Users, requiredPermission: "contacts:view", requiredRole: null, requiredModule: "crm", status: "active" },
      { id: "pipeline", label: "Pipeline", path: "/pipeline", icon: SlidersHorizontal, requiredPermission: "pipeline:view", requiredRole: null, requiredModule: "crm", status: "active" },
      { id: "buildings", label: "Buildings", path: "/buildings", icon: Building2, requiredPermission: "buildings:view", requiredRole: null, requiredModule: "crm", status: "active" }
    ]
  },
  {
    id: "assets",
    label: "Assets",
    items: [
      { id: "assets", label: "Assets", path: "/assets", icon: Building2, requiredPermission: "assets:view", requiredRole: null, requiredModule: "assets", status: "active" },
      { id: "asset-settings", label: "Asset Settings", path: "/asset-settings", icon: SlidersHorizontal, requiredPermission: "assets:admin", requiredRole: null, requiredModule: "assets", status: "active" }
    ]
  },
  {
    id: "work-management",
    label: "Work Management",
    items: [
      { id: "work-orders", label: "Work Orders", path: "/work-orders", icon: Save, requiredPermission: "work_orders:view", requiredRole: null, requiredModule: "cmms", status: "active" },
      { id: "schedule", label: "Schedule", path: "/schedule", icon: CalendarDays, requiredPermission: "schedule:view", requiredRole: null, requiredModule: "cmms", status: "active" },
      { id: "maintenance-plans", label: "Maintenance Plans", path: "/maintenance-plans", icon: CalendarDays, requiredPermission: "maintenance_plans:view", requiredRole: null, requiredModule: "cmms", status: "active" },
      { id: "my-jobs", label: "My Jobs", path: "/my-jobs", icon: ClipboardCheck, requiredPermission: "technician_jobs:view", requiredRole: null, requiredModule: "technician", status: "active" }
    ]
  },
  {
    id: "compliance",
    label: "Compliance",
    items: [
      { id: "compliance-services", label: "Compliance Services", path: "/compliance-services", icon: ClipboardCheck, requiredPermission: "compliance_services:view", requiredRole: null, requiredModule: "compliance", status: "active" },
      { id: "forms-builder", label: "Forms Builder", path: "/forms-builder", icon: ClipboardCheck, requiredPermission: "form_templates:view", requiredRole: null, requiredModule: "compliance", status: "active" },
      { id: "reports", label: "Reports", path: "/reports", icon: Download, requiredPermission: "reports:view", requiredRole: null, requiredModule: "reporting", status: "active" },
      { id: "certificates", label: "Certificates", path: "/certificates", icon: Download, requiredPermission: "certificates:view", requiredRole: null, requiredModule: "reporting", status: "active" }
    ]
  },
  {
    id: "people-portal",
    label: "People & Portal",
    items: [
      { id: "people", label: "People", path: "/people", icon: Users, requiredPermission: "staff:view", requiredRole: null, requiredModule: "people", status: "active" },
      { id: "customer-portal", label: "Customer Portal", path: "/customer-portal", icon: LayoutDashboard, requiredPermission: "customer_portal:view", requiredRole: null, requiredModule: "portal", status: "active" }
    ]
  },
  {
    id: "administration",
    label: "Administration",
    items: [
      { id: "settings", label: "Settings", path: "/settings", icon: SlidersHorizontal, requiredPermission: "dashboard:view", requiredRole: null, requiredModule: "core", status: "active" }
    ]
  }
];

export function getVisibleNavigation(user, hasPermission) {
  return navigationGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => (
        item.status === "active" && hasPermission(user, item.requiredPermission)
      ))
    }))
    .filter((group) => group.items.length > 0);
}

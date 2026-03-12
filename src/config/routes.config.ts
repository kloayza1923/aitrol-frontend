/**
 * Configuración de rutas del sistema
 * Se sincroniza automáticamente con la BD al iniciar la aplicación
 *
 * Instrucciones para agregar nuevas rutas:
 * 1. Agrega la ruta en AppRoutingSetup.tsx
 * 2. Agrega la ruta aquí en este archivo manteniendo el mismo path
 * 3. La sincronización se hace automáticamente
 */

export const APP_ROUTES: Array<{
  path: string;
  title: string;
  icon?: string;
  parent_path?: string;
}> = [
  // Dashboard
  { path: '/', title: 'Dashboard', icon: 'element-11' },

  // Order Management
  { path: '/order-management', title: 'Order Management', icon: 'book' },
  { path: '/order-management-add', title: 'Add Order', parent_path: '/order-management' },
  { path: '/order-edit/:id', title: 'Edit Order', parent_path: '/order-management' },
  { path: '/order-show-management/:id', title: 'View Order', parent_path: '/order-management' },

  // Order Manual
  { path: '/order-manual', title: 'Order Manual', icon: 'book' },
  { path: '/order-manual-add', title: 'Add Manual Order', parent_path: '/order-manual' },
  { path: '/order-manual-edit/:id', title: 'Edit Manual Order', parent_path: '/order-manual' },

  // Client Management
  { path: '/client-management', title: 'Client Management', icon: 'user' },
  { path: '/client-management-add', title: 'Add Client', parent_path: '/client-management' },
  { path: '/client-management-edit', title: 'Edit Client', parent_path: '/client-management' },

  // Vehicle Management
  { path: '/vehicle-management', title: 'Vehicle Management', icon: 'car' },
  {
    path: '/vehicle-management/add-vehicle',
    title: 'Add Vehicle',
    parent_path: '/vehicle-management'
  },
  {
    path: '/vehicle-management/edit-vehicle',
    title: 'Edit Vehicle',
    parent_path: '/vehicle-management'
  },

  // User Management
  { path: '/user-management', title: 'User Management', icon: 'user-multiple' },
  { path: '/user-management/add-user', title: 'Add User', parent_path: '/user-management' },
  { path: '/user-management/edit-user', title: 'Edit User', parent_path: '/user-management' },

  // Inventory
  { path: '/inventory/products-management', title: 'Products', icon: 'package' },
  { path: '/inventory/category-management', title: 'Categories', icon: 'tag' },
  { path: '/inventory/brand-management', title: 'Brands', icon: 'package' },
  { path: '/inventory/supplier-management', title: 'Suppliers', icon: 'truck' },
  { path: '/inventory/purchase-management', title: 'Purchases', icon: 'cart' },
  { path: '/inventory/sale-management', title: 'Sales', icon: 'money' },
  { path: '/inventory/kardex-management', title: 'Kardex', icon: 'chart' },

  // Financial / Accounting
  { path: '/accounting/diario', title: 'Diario', icon: 'chart' },
  { path: '/accounting/plan-cuentas', title: 'Plan de Cuentas', icon: 'chart' },
  { path: '/financial-cash-management', title: 'Cash Management', icon: 'money' },

  // HR Management
  { path: '/employee-management', title: 'Employee Management', icon: 'user' },
  {
    path: '/employee-management/create',
    title: 'Create Employee',
    parent_path: '/employee-management'
  },
  { path: '/area-management', title: 'Area Management', icon: 'office-building' },
  { path: '/rhrol-management', title: 'Roles de Pago', icon: 'money' },
  { path: '/marking-management', title: 'Marcaciones', icon: 'clock' },

  // Menu Management
  { path: '/menu-management', title: 'Menu Management', icon: 'menu' },
  { path: '/menu-management/create', title: 'Create Menu', parent_path: '/menu-management' },
  { path: '/menu-management/edit/:id', title: 'Edit Menu', parent_path: '/menu-management' },

  // Rol Management
  { path: '/rol-management', title: 'Sistema Permisos', icon: 'shield' },
  { path: '/rol-management/create', title: 'Assign Permisos', parent_path: '/rol-management' },

  // Health Management
  { path: '/health/personal', title: 'Personal', icon: 'user' },
  { path: '/health/paciente', title: 'Pacientes', icon: 'user' },
  { path: '/health/sedes', title: 'Sedes', icon: 'building' },

  // Company
  { path: '/company', title: 'Company', icon: 'building' }
];

/**
 * ¡IMPORTANTE!
 *
 * Cuando agregues una nueva ruta:
 *
 * 1. Agrég alo aquí con el mismo path del AppRoutingSetup.tsx
 * 2. Incluye un título descriptivo
 * 3. Opcionalmente: ícono y parent_path
 *
 * Ejemplo:
 * { path: '/nueva-ruta', title: 'Nueva Ruta', icon: 'mi-icono', parent_path: '/ruta-padre' }
 *
 * El sistema se sincronizará automáticamente la próxima vez que inicies la app.
 */

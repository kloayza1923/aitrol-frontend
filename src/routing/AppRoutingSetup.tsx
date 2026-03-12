import { ReactElement } from 'react';
import { Navigate, Route, Router, Routes } from 'react-router';
import { DefaultPage, Demo1DarkSidebarPage } from '@/pages/dashboards';
import { Demo1LightSidebarPage } from '@/pages/dashboards/demo1/light-sidebar/Demo1LightSidebarPage';
import {
  ProfileActivityPage,
  ProfileBloggerPage,
  CampaignsCardPage,
  CampaignsListPage,
  ProjectColumn2Page,
  ProjectColumn3Page,
  ProfileCompanyPage,
  ProfileCreatorPage,
  ProfileCRMPage,
  ProfileDefaultPage,
  ProfileEmptyPage,
  ProfileFeedsPage,
  ProfileGamerPage,
  ProfileModalPage,
  ProfileNetworkPage,
  ProfileNFTPage,
  ProfilePlainPage,
  ProfileTeamsPage,
  ProfileWorksPage
} from '@/pages/public-profile';
import {
  AccountActivityPage,
  AccountAllowedIPAddressesPage,
  AccountApiKeysPage,
  AccountAppearancePage,
  AccountBackupAndRecoveryPage,
  AccountBasicPage,
  AccountCompanyProfilePage,
  AccountCurrentSessionsPage,
  AccountDeviceManagementPage,
  AccountEnterprisePage,
  AccountGetStartedPage,
  AccountHistoryPage,
  AccountImportMembersPage,
  AccountIntegrationsPage,
  AccountInviteAFriendPage,
  AccountMembersStarterPage,
  AccountNotificationsPage,
  AccountOverviewPage,
  AccountPermissionsCheckPage,
  AccountPermissionsTogglePage,
  AccountPlansPage,
  AccountPrivacySettingsPage,
  AccountRolesPage,
  AccountSecurityGetStartedPage,
  AccountSecurityLogPage,
  AccountSettingsEnterprisePage,
  AccountSettingsModalPage,
  AccountSettingsPlainPage,
  AccountSettingsSidebarPage,
  AccountTeamInfoPage,
  AccountTeamMembersPage,
  AccountTeamsPage,
  AccountTeamsStarterPage,
  AccountUserProfilePage
} from '@/pages/account';
import {
  NetworkAppRosterPage,
  NetworkMarketAuthorsPage,
  NetworkAuthorPage,
  NetworkGetStartedPage,
  NetworkMiniCardsPage,
  NetworkNFTPage,
  NetworkSocialPage,
  NetworkUserCardsTeamCrewPage,
  NetworkSaasUsersPage,
  NetworkStoreClientsPage,
  NetworkUserTableTeamCrewPage,
  NetworkVisitorsPage
} from '@/pages/network';

import { AuthPage } from '@/auth';
import { RequireAuth } from '@/auth/RequireAuth';
import { ProtectedRoute } from '@/auth/ProtectedRoute';
import { Demo1Layout } from '@/layouts/demo1';
import { ErrorsRouting } from '@/errors';
import {
  AuthenticationWelcomeMessagePage,
  AuthenticationAccountDeactivatedPage,
  AuthenticationGetStartedPage
} from '@/pages/authentication';
import { UserManagement } from '@/pages/user-management';
import { AddUserLayout } from '@/pages/user-management/add-user';
import { CreateRol } from '@/pages/account/members/roles/CreateRol';
import { AddVehicleLayout } from '@/pages/vehicule-management/add-vehicle';
import { EditVehicleLayout } from '@/pages/vehicule-management/edit-vehicle';
import { VehicleManagement } from '@/pages/vehicule-management';
import { OrderManagement } from '@/pages/order-management';
import { AddOrder } from '@/pages/order-management/add-order';
import { OrderManual, AddOrderManual, EditOrderManual, ManageTrips } from '@/pages/order-manual';
import { ClientManagement } from '@/pages/client-management';
import { ClientAddLayout } from '@/pages/client-management/add-client';
import { ClientEditLayout } from '@/pages/client-management/edit-client';
import { PuertoManagement } from '@/pages/puertos-management';
import { PuertosAddLayout } from '@/pages/puertos-management/add-puerto';
import { PuertoEditLayout } from '@/pages/puertos-management/edit-puerto';
import { TvManagement } from '@/pages/order-management/tv';
import { EditUserLayout } from '@/pages/user-management/edit-user';
import { TvClient } from '@/pages/order-management/tv_client';
import { EditOrder } from '@/pages/order-management/edit-order';
import { MaterialesManagement } from '@/pages/material-management';
import { AddMaterial } from '@/pages/material-management/add-material';
import { MaterialEditLayout } from '@/pages/material-management/edit-material';
import { PrivacyManagement } from '@/pages/privacy';
import { FormUser } from '@/pages/privacy/form-user';
import { EditOrdenManagement } from '@/pages/order-management/edit-order-management';
import ShowManagementOrder from '@/pages/order-management/show';
import { OrderReportLayout } from '@/pages/order-management/report';
import { Points } from '@/pages/points';
import { AddPoints } from '@/pages/points/add';
import { PointsEdit } from '@/pages/points/edit';
import OrderAsigment from '@/pages/order-asigment';
import SorteoPage from '@/pages/sorteo';
import EmployeesList from '@/pages/employee-managment';
import EmployeeCreate from '@/pages/employee-managment/create';
import EmployeeEdit from '@/pages/employee-managment/edit';
import AreaCreate from '@/pages/area-management/create';
import AreasList from '@/pages/area-management';
import RolesPagoList from '@/pages/rhrol-management';
import CrearRolPago from '@/pages/rhrol-management/create';
import RolesPagoEdit from '@/pages/rhrol-management/edit';
import PrestamosManager from '@/pages/lending-management';
import PermisosSistemaList from '@/pages/rol-management';
import MenuList from '@/pages/menu-management';
import CreateMenu from '@/pages/menu-management/create';
import EditMenu from '@/pages/menu-management/edit';
import OrderMenu from '@/pages/menu-management/order';
import RolesPermisosList from '@/pages/rol-management/create';
import PermisosEmpleadoList from '@/pages/rh-permisos-management';
import MarcacionesRRHHList from '@/pages/marking-management';
import MarcacionEmpleadoList from '@/pages/marking-management/create';
import ReportesRRHH from '@/pages/rh-report-management';
import ReporteVacaciones from '@/pages/rh-vacation-management';
import SolicitudesVacacionesEmpleado from '@/pages/rh-vacation-management/create';
import ProductosList from '@/pages/inventory/products-management';
import CategoriasList from '@/pages/inventory/category-management';
import ClientsList from '@/pages/inventory/clients-management';
import ProveedoresList from '@/pages/inventory/supplier-managment';
import MarcasList from '@/pages/inventory/brand-management';
import KardexList from '@/pages/inventory/kardex-management';
import ComprasList from '@/pages/inventory/purchase-management';
import CompraFactura from '@/pages/inventory/purchase-management/create';
import CompraShow from '@/pages/inventory/purchase-management/edit';
import ErrorList from '@/pages/error-list';
import VentasList from '@/pages/inventory/sales-management';
import VentaFactura from '@/pages/inventory/sales-management/create';
import VentaShow from '@/pages/inventory/sales-management/edit';
import BranchList from '@/pages/branch-management';
import EmissionPointList from '@/pages/emision-management';
import WarehouseList from '@/pages/inventory/warehouse-management';
import PerchaList from '@/pages/inventory/per-management';
import CrearMovimiento from '@/pages/inventory/kardex-management/create';
import StockActualList from '@/pages/inventory/kardex-management/stock';
import ReporteUtilidad from '@/pages/inventory/kardex-management/utilties';
import VentaServicios from '@/pages/inventory/sales-management/create_services';
import CrearTransferencia from '@/pages/inventory/kardex-management/transfer';
import UploadStockInicial from '@/pages/inventory/products-management/upload';
import PriceListsManagement from '@/pages/inventory/price-lists-management';
import CajasList from '@/pages/financial/cash-management';
import CajasUser from '@/pages/financial/cash-management/asignuser';
import CajasMov from '@/pages/financial/cash-management/records';
import VentasReporte from '@/pages/inventory/sales-management/report';
import PurchaseVsSalesReport from '@/pages/inventory/reports/purchasevssales';
import HierarchicalLevelsManagement from '@/pages/hierarchical-levels-management';
import PositionManagement from '@/pages/position-management';
import ContractManagement from '@/pages/contract-management';
import DocumentManagement from '@/pages/employee-managment/documents';
import PreviewDocuments from '@/pages/employee-managment/preview_documents';
import NotificationManagement from '@/pages/notification-management';
import QuotesManagement from '@/pages/inventory/quotes-management';
import QuoteCreate from '@/pages/inventory/quotes-management/create';
import QuoteEdit from '@/pages/inventory/quotes-management/edit';
import CompanyPage from '@/pages/company';
import DiarioList from '@/pages/accounting/diario';
import PlanCuentasPage from '@/pages/accounting/plan-cuentas';
import ConfiguracionContabilidad from '@/pages/financial/configuration-management';
import LibroMayorList from '@/pages/accounting/libro-mayor';
import BalanceGeneralPage from '@/pages/financial/balance-managment';
import EstadoResultadosPage from '@/pages/financial/estado-cuenta-management';
import BalanceComprobacion from '@/pages/financial/balance-comprobacion';
import BankReconciliationPage from '@/pages/financial/concilacion';
import FirmaElectronicaPage from '@/pages/contabilidad/firma-electronica';
import GastosContablesPage from '@/pages/contabilidad/gastos';
import VentasContablesPage from '@/pages/contabilidad/ventas';
import { TvClientShow } from '@/pages/order-client-managment/tv';
import { OrderClientManagement } from '@/pages/order-client-managment';
import { OrderClientReportLayout } from '@/pages/order-client-managment/report';
import { ReportUser } from '@/pages/order-management/report-user';
import { OrderManualReportLayout } from '@/pages/order-client-managment/report-manual';
import InventoryDashboardPage from '@/pages/inventory/dashboard';
import BankingPage from '@/pages/financial/banking/BankingPage';
import CreditCardsPage from '@/pages/financial/credit-cards/CreditCardsPage';
import AtsPage from '@/pages/accounting/ats';
import RetencionesPage from '@/pages/accounting/retenciones';
import AccountsReceivable from '@/pages/financial/accounts-receivable';
import AccountsPayable from '@/pages/financial/accounts-payable';
import CreditNotesIndex from '@/pages/accounting/credit-notes';
import CreditNoteCreate from '@/pages/accounting/credit-notes/create';
import PurchaseVsSalesVisual from '@/pages/fin/reports/PurchaseVsSalesVisual';
import ClientsProvidersChartPage from '@/pages/fin/reports/PurchaseVsSalesVisual';
import CategoriasActivosManagement from '@/pages/fin/activos-fijos/categorias';
import UbicacionesActivosManagement from '@/pages/fin/activos-fijos/ubicaciones';
import ActivosFijosManagement from '@/pages/fin/activos-fijos';
import DepreciacionesManagement from '@/pages/fin/activos-fijos/depreciaciones';
import PresupuestosManagement from '@/pages/fin/presupuestos';
import CierresManagement from '@/pages/fin/cierres';
import PersonalList from '@/pages/health-management/personal-management';
import PacientesList from '@/pages/health-management/paciente-management';
import PersonasList from '@/pages/health-management/person-managment';
import UnidadesList from '@/pages/health-management/unidades-management';
import SalasList from '@/pages/health-management/salas-management';
import QuirofanosList from '@/pages/health-management/quirofanos-management';
import CamasList from '@/pages/health-management/camas-management';
import SedesList from '@/pages/health-management/sedes-management';
import PisosList from '@/pages/health-management/pisos-management';
import DoctorAgendaPage from '@/pages/health-management/doctor-agenda';
import CitasManagementPage from '@/pages/health-management/citas-management';
import TriajeManagementPage from '@/pages/health-management/triaje-management';
import SalaEsperaPage from '@/pages/health-management/sala-espera';
import TurnosManagementPage from '@/pages/health-management/turnos-management';
import CitasRecientesPage from '@/pages/health-management/citas-recientes';
import PatientDocuments from '@/pages/health-management/paciente-management/documents';
import PreviewPacienteDocuments from '@/pages/health-management/paciente-management/preview_documents';
import Cie10List from '@/pages/health/cie10-management';
import MedicamentosList from '@/pages/health/medicamentos-management';

const AppRoutingSetup = (): ReactElement => {
  return (
    <Routes>
      <Route element={<RequireAuth />}>
        <Route element={<ProtectedRoute />}>
          <Route element={<Demo1Layout />}>
            <Route path="/" element={<DefaultPage />} />
            <Route path="/dark-sidebar" element={<Demo1DarkSidebarPage />} />
            <Route path="/public-profile/profiles/default" element={<ProfileDefaultPage />} />
            <Route path="/public-profile/profiles/creator" element={<ProfileCreatorPage />} />
            <Route path="/public-profile/profiles/company" element={<ProfileCompanyPage />} />
            <Route path="/public-profile/profiles/nft" element={<ProfileNFTPage />} />
            <Route path="/public-profile/profiles/blogger" element={<ProfileBloggerPage />} />
            <Route path="/public-profile/profiles/crm" element={<ProfileCRMPage />} />
            <Route path="/public-profile/profiles/gamer" element={<ProfileGamerPage />} />
            <Route path="/public-profile/profiles/feeds" element={<ProfileFeedsPage />} />
            <Route path="/public-profile/profiles/plain" element={<ProfilePlainPage />} />
            <Route path="/public-profile/profiles/modal" element={<ProfileModalPage />} />
            <Route path="/public-profile/projects/3-columns" element={<ProjectColumn3Page />} />
            <Route path="/public-profile/projects/2-columns" element={<ProjectColumn2Page />} />
            <Route path="/public-profile/works" element={<ProfileWorksPage />} />
            <Route path="/public-profile/teams" element={<ProfileTeamsPage />} />
            <Route path="/public-profile/network" element={<ProfileNetworkPage />} />
            <Route path="/public-profile/activity" element={<ProfileActivityPage />} />
            <Route path="/public-profile/campaigns/card" element={<CampaignsCardPage />} />
            <Route path="/public-profile/campaigns/list" element={<CampaignsListPage />} />
            <Route path="/public-profile/empty" element={<ProfileEmptyPage />} />
            <Route path="/account/home/get-started" element={<AccountGetStartedPage />} />
            <Route path="/account/home/user-profile" element={<AccountUserProfilePage />} />
            <Route path="/account/home/company-profile" element={<AccountCompanyProfilePage />} />
            <Route path="/account/home/settings-sidebar" element={<AccountSettingsSidebarPage />} />
            <Route
              path="/account/home/settings-enterprise"
              element={<AccountSettingsEnterprisePage />}
            />
            <Route path="/account/home/settings-plain" element={<AccountSettingsPlainPage />} />
            <Route path="/account/home/settings-modal" element={<AccountSettingsModalPage />} />
            <Route path="/account/billing/basic" element={<AccountBasicPage />} />
            <Route path="/account/billing/enterprise" element={<AccountEnterprisePage />} />
            <Route path="/account/billing/plans" element={<AccountPlansPage />} />
            <Route path="/account/billing/history" element={<AccountHistoryPage />} />
            <Route
              path="/account/security/get-started"
              element={<AccountSecurityGetStartedPage />}
            />
            <Route path="/account/security/overview" element={<AccountOverviewPage />} />
            <Route
              path="/account/security/allowed-ip-addresses"
              element={<AccountAllowedIPAddressesPage />}
            />
            <Route
              path="/account/security/privacy-settings"
              element={<AccountPrivacySettingsPage />}
            />
            <Route
              path="/account/security/device-management"
              element={<AccountDeviceManagementPage />}
            />
            <Route
              path="/account/security/backup-and-recovery"
              element={<AccountBackupAndRecoveryPage />}
            />
            <Route
              path="/account/security/current-sessions"
              element={<AccountCurrentSessionsPage />}
            />
            <Route path="/account/security/security-log" element={<AccountSecurityLogPage />} />
            <Route path="/account/members/team-starter" element={<AccountTeamsStarterPage />} />
            <Route path="/account/members/teams" element={<AccountTeamsPage />} />
            <Route path="/account/members/team-info" element={<AccountTeamInfoPage />} />
            <Route
              path="/account/members/members-starter"
              element={<AccountMembersStarterPage />}
            />
            <Route path="/account/members/team-members" element={<AccountTeamMembersPage />} />
            <Route path="/account/members/import-members" element={<AccountImportMembersPage />} />
            <Route path="/account/members/roles" element={<AccountRolesPage />} />
            <Route path="/account/members/roles/create" element={<CreateRol />} />
            <Route
              path="/account/members/permissions-toggle"
              element={<AccountPermissionsTogglePage />}
            />
            <Route
              path="/account/members/permissions-check"
              element={<AccountPermissionsCheckPage />}
            />
            <Route path="/account/integrations" element={<AccountIntegrationsPage />} />
            <Route path="/account/notifications" element={<AccountNotificationsPage />} />
            <Route path="/account/api-keys" element={<AccountApiKeysPage />} />
            <Route path="/account/appearance" element={<AccountAppearancePage />} />
            <Route path="/order-report-user" element={<ReportUser />} />
            <Route path="/account/invite-a-friend" element={<AccountInviteAFriendPage />} />
            <Route path="/account/activity" element={<AccountActivityPage />} />
            <Route path="/network/get-started" element={<NetworkGetStartedPage />} />
            <Route path="/network/user-cards/mini-cards" element={<NetworkMiniCardsPage />} />
            <Route
              path="/network/user-cards/team-crew"
              element={<NetworkUserCardsTeamCrewPage />}
            />
            <Route path="/network/user-cards/author" element={<NetworkAuthorPage />} />
            <Route path="/network/user-cards/nft" element={<NetworkNFTPage />} />
            <Route path="/network/user-cards/social" element={<NetworkSocialPage />} />
            <Route
              path="/network/user-table/team-crew"
              element={<NetworkUserTableTeamCrewPage />}
            />
            <Route path="/network/user-table/app-roster" element={<NetworkAppRosterPage />} />
            <Route
              path="/network/user-table/market-authors"
              element={<NetworkMarketAuthorsPage />}
            />
            <Route path="/network/user-table/saas-users" element={<NetworkSaasUsersPage />} />
            <Route path="/network/user-table/store-clients" element={<NetworkStoreClientsPage />} />
            <Route path="/network/user-table/visitors" element={<NetworkVisitorsPage />} />
            <Route path="/auth/welcome-message" element={<AuthenticationWelcomeMessagePage />} />
            <Route path="/user-management" element={<UserManagement />} />
            <Route path="/user-management/add-user" element={<AddUserLayout />} />
            <Route path="/user-management/edit-user" element={<EditUserLayout />} />
            <Route path="/vehicle-management" element={<VehicleManagement />} />
            <Route path="/vehicle-management/add-vehicle" element={<AddVehicleLayout />} />
            <Route path="/vehicle-management/edit-vehicle" element={<EditVehicleLayout />} />
            <Route path="/order-management" element={<OrderManagement />} />
            <Route path="/inventory-dashboard" element={<InventoryDashboardPage />} />
            <Route path="/order-management-add" element={<AddOrder />} />
            <Route path="/order-edit/:id" element={<EditOrdenManagement />} />
            <Route path="/order-show-management/:id" element={<ShowManagementOrder />} />
            <Route path="/order-management-edit/:id" element={<EditOrder />} />
            <Route path="/order-manual" element={<OrderManual />} />
            <Route path="/order-manual-add" element={<AddOrderManual />} />
            <Route path="/order-manual-edit/:id" element={<EditOrderManual />} />
            <Route path="/order-manual-trips/:id" element={<ManageTrips />} />
            <Route path="/order-manual-report-client" element={<OrderManualReportLayout />} />
            <Route path="/company" element={<CompanyPage />} />
            <Route path="/client-management" element={<ClientManagement />} />
            <Route path="/client-management-add" element={<ClientAddLayout />} />
            <Route path="/client-management-edit" element={<ClientEditLayout />} />
            <Route path="/banking-management" element={<BankingPage />} />
            <Route path="/credit-cards-management" element={<CreditCardsPage />} />
            <Route path="/clients-providers-chart" element={<ClientsProvidersChartPage />} />
            <Route path="/puerto-management" element={<PuertoManagement />} />
            <Route path="/puerto-management-add" element={<PuertosAddLayout />} />
            <Route path="/puerto-management-edit" element={<PuertoEditLayout />} />
            <Route path="/materiales-management" element={<MaterialesManagement />} />
            <Route path="/materiales-management-add" element={<AddMaterial />} />
            <Route path="/materiales-management-edit" element={<MaterialEditLayout />} />
            <Route path="/tv" element={<TvManagement />} />
            <Route path="/ordenes-report" element={<OrderReportLayout />} />
            <Route path="/tv-client" element={<TvClientShow />} />
            <Route path="/order-client-management" element={<OrderClientManagement />} />
            <Route path="/order-report-client" element={<OrderClientReportLayout />} />
            <Route path="/points-management" element={<Points />} />
            <Route path="/points-management/add-points" element={<AddPoints />} />
            <Route path="/points-management/edit-points/:id" element={<PointsEdit />} />
            <Route path="/order-asigment" element={<OrderAsigment />} />
            <Route path="/employee-management" element={<EmployeesList />} />
            <Route path="/employee-management/create" element={<EmployeeCreate />} />
            <Route path="/employee-management/edit/:id" element={<EmployeeEdit />} />
            <Route path="/contract-management" element={<ContractManagement />} />
            <Route path="/area-management" element={<AreasList />} />
            <Route path="/area-management/create" element={<AreaCreate />} />
            <Route path="/rhrol-management" element={<RolesPagoList />} />
            <Route path="/rhrol-management/create" element={<CrearRolPago />} />
            <Route path="/rhrol-management/edit/:id" element={<RolesPagoEdit />} />
            <Route path="/rhrol-management/documents" element={<DocumentManagement />} />
            <Route path="/employee-management/preview-documents" element={<PreviewDocuments />} />
            <Route path="/rh-permisos-management" element={<PermisosEmpleadoList />} />
            <Route path="/lending-management" element={<PrestamosManager />} />
            <Route path="/marking-management" element={<MarcacionesRRHHList />} />
            <Route path="/marking" element={<MarcacionEmpleadoList />} />
            <Route path="/rol-management" element={<PermisosSistemaList />} />
            <Route path="/rol-management/create" element={<RolesPermisosList />} />
            <Route path="/menu-management" element={<MenuList />} />
            <Route path="/menu-management/create" element={<CreateMenu />} />
            <Route path="/menu-management/edit/:id" element={<EditMenu />} />
            <Route path="/menu-management/order" element={<OrderMenu />} />
            <Route path="/notifications" element={<NotificationManagement />} />
            <Route path="/rh-report-management" element={<ReportesRRHH />} />
            <Route path="/rh-vacation-management" element={<ReporteVacaciones />} />
            <Route
              path="/rh-hierarchical-levels-management"
              element={<HierarchicalLevelsManagement />}
            />
            <Route path="/rh-positions-management" element={<PositionManagement />} />
            <Route
              path="/rh-vacation-management/create"
              element={<SolicitudesVacacionesEmpleado />}
            />
            <Route path="/inventory/products-management" element={<ProductosList />} />
            <Route path="/inventory/quote-management" element={<QuotesManagement />} />
            <Route path="/inventory/quote-management/create" element={<QuoteCreate />} />
            <Route path="/inventory/quote-management/edit/:id" element={<QuoteEdit />} />
            <Route
              path="/inventory/reports/purchase-vs-sales"
              element={<PurchaseVsSalesReport />}
            />
            <Route path="/inventory/brand-management" element={<MarcasList />} />
            <Route path="/inventory/category-management" element={<CategoriasList />} />
            <Route path="/inventory/clients-management" element={<ClientsList />} />
            <Route path="/inventory/price-lists" element={<PriceListsManagement />} />
            <Route path="/inventory/supplier-management" element={<ProveedoresList />} />
            <Route path="/inventory/kardex-management" element={<KardexList />} />
            <Route path="/financial-account-x-client" element={<AccountsReceivable />} />
            <Route path="/inventory/kardex-management/transfer" element={<CrearTransferencia />} />
            <Route path="/inventory/kardex-management/create" element={<CrearMovimiento />} />
            <Route path="/inventory/kardex-management/stock" element={<StockActualList />} />
            <Route path="/inventory/purchase-management" element={<ComprasList />} />
            <Route path="/inventory/purchase-management/create" element={<CompraFactura />} />
            <Route path="/inventory/purchase-management/show/:id" element={<CompraShow />} />
            <Route path="/inventory/sale-report" element={<VentasReporte />} />
            <Route path="/inventory/sale-management" element={<VentasList />} />
            <Route path="/inventory/sale-management/create" element={<VentaFactura />} />
            <Route path="/inventory/sale-management/show/:id" element={<VentaShow />} />
            <Route path="/inventory/warehouse-management" element={<WarehouseList />} />
            <Route path="/inventory/perchas-management" element={<PerchaList />} />
            <Route path="/inventory/sale-service-management" element={<VentaServicios />} />
            <Route path="/inventory/utilties" element={<ReporteUtilidad />} />
            <Route path="/inventory/products-management/upload" element={<UploadStockInicial />} />
            {/* Modulos de contabilidad */}
            <Route path="/accounting/diario" element={<DiarioList />} />
            <Route path="/accounting/plan-cuentas" element={<PlanCuentasPage />} />
            <Route path="/accounting/firma-electronica" element={<FirmaElectronicaPage />} />
            <Route path="/accounting/gastos" element={<GastosContablesPage />} />
            <Route path="/accounting/ventas" element={<VentasContablesPage />} />
            {/* Módulos financiero */}
            <Route path="/financial-cash-management" element={<CajasList />} />
            <Route path="/financial-cash-user-management" element={<CajasUser />} />
            <Route path="/financial-cash-movements" element={<CajasMov />} />
            <Route path="/financial/estado-cuenta-management" element={<EstadoResultadosPage />} />
            {/* Módulo de configuración contable */}
            <Route
              path="/financial/configuration-management"
              element={<ConfiguracionContabilidad />}
            />
            <Route path="/accounting/retenciones" element={<RetencionesPage />} />
            <Route path="/accounting/credit-notes" element={<CreditNotesIndex />} />
            <Route path="/accounting/credit-notes/create" element={<CreditNoteCreate />} />
            <Route path="/accounting/ats" element={<AtsPage />} />
            <Route path="/financial/libro-mayor" element={<LibroMayorList />} />
            <Route path="/financial/balance-management" element={<BalanceGeneralPage />} />
            <Route path="/financial/balance-comprobacion" element={<BalanceComprobacion />} />
            <Route path="/financial/concilacion" element={<BankReconciliationPage />} />
            <Route path="/financial/accountingxprovider" element={<AccountsPayable />} />
            {/* Módulos de Activos Fijos */}
            <Route path="/fin/activos-fijos/categorias" element={<CategoriasActivosManagement />} />
            <Route
              path="/fin/activos-fijos/ubicaciones"
              element={<UbicacionesActivosManagement />}
            />
            <Route path="/fin/activos-fijos" element={<ActivosFijosManagement />} />
            <Route
              path="/fin/activos-fijos/depreciaciones"
              element={<DepreciacionesManagement />}
            />
            {/* Módulos de Presupuestos y Cierres */}
            <Route path="/fin/presupuestos" element={<PresupuestosManagement />} />
            <Route path="/fin/cierres" element={<CierresManagement />} />
            <Route path="/error-logs" element={<ErrorList />} />
            <Route path="/branch-management" element={<BranchList />} />
            <Route path="/emission-management" element={<EmissionPointList />} />
            <Route
              path="/auth/account-deactivated"
              element={<AuthenticationAccountDeactivatedPage />}
            />
            <Route path="/authentication/get-started" element={<AuthenticationGetStartedPage />} />
            <Route path="/health/personal" element={<PersonalList />} />
            <Route path="/health/paciente" element={<PacientesList />} />
            <Route path="/health/paciente-documentos" element={<PatientDocuments />} />
            <Route
              path="/health/patient-documents/preview"
              element={<PreviewPacienteDocuments />}
            />
            <Route path="/health/persona" element={<PersonasList />} />
            <Route path="/health/sedes" element={<SedesList />} />
            <Route path="/health/pisos" element={<PisosList />} />
            <Route path="/health/unidades" element={<UnidadesList />} />
            <Route path="/health/salas" element={<SalasList />} />
            <Route path="/health/quirofanos" element={<QuirofanosList />} />
            <Route path="/health/camas" element={<CamasList />} />
            <Route path="/health/agenda-doctores" element={<DoctorAgendaPage />} />
            <Route path="/health/citas" element={<CitasManagementPage />} />
            <Route path="/health/triaje" element={<TriajeManagementPage />} />
            <Route path="/health/sala-espera" element={<SalaEsperaPage />} />
            <Route path="/health/turnos" element={<TurnosManagementPage />} />
            <Route path="/health/citas-recientes" element={<CitasRecientesPage />} />
            {/* Módulos de catálogos clínicos */}
            <Route path="/health/cie10" element={<Cie10List />} />
            <Route path="/health/medicamentos" element={<MedicamentosList />} />
          </Route>
        </Route>
      </Route>
      <Route path="error/*" element={<ErrorsRouting />} />
      <Route path="auth/*" element={<AuthPage />} />
      <Route path="*" element={<Navigate to="/error/404" />} />
      <Route path="/order-share-link/:id" element={<TvClient />} />
      <Route path="/privacy-policy" element={<PrivacyManagement />} />
      <Route path="/delete-user-form" element={<FormUser />} />
      <Route path="/sorteo" element={<SorteoPage />} />
    </Routes>
  );
};

export { AppRoutingSetup };

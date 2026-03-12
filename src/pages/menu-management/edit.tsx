import { Container } from '@/components/container';
import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { FetchData } from '@/utils/FetchData';
import { TextField, Button, MenuItem, Box, Typography, Autocomplete } from '@mui/material';

// Importa los iconos de Material UI
import {
  Home,
  Settings,
  Info,
  ContactMail,
  Dashboard,
  Person,
  ShoppingCart,
  Notifications,
  Help,
  Lock,
  Star,
  Tv,
  LocalShipping,
  Folder,
  FileCopy,
  MonetizationOn,
  AddShoppingCart,
  People,
  AccountCircle,
  HomeWork,
  Business,
  Store,
  Storefront,
  Inventory,
  Category,
  Assignment,
  AssignmentInd,
  Receipt,
  Description,
  ListAlt,
  Assessment,
  BarChart,
  PieChart,
  ShowChart,
  TrendingUp,
  AttachMoney,
  Payment,
  CreditCard,
  AccountBalance,
  AccountBalanceWallet,
  Savings,
  RequestQuote,
  Calculate,
  Email,
  Phone,
  LocationOn,
  Event,
  CalendarToday,
  Schedule,
  AccessTime,
  Today,
  DateRange,
  Build,
  Engineering,
  Construction,
  Handyman,
  Hardware,
  Work,
  Badge,
  Groups,
  Group,
  SupervisedUserCircle,
  PersonAdd,
  PersonSearch,
  AdminPanelSettings,
  Security,
  VpnKey,
  Password,
  Verified,
  ShieldOutlined,
  Warehouse,
  Layers,
  ViewModule,
  ViewList,
  ViewComfy,
  GridView,
  TableChart,
  Analytics,
  Speed,
  Insights,
  PointOfSale,
  Sell,
  LocalOffer,
  ShoppingBag,
  ShoppingBasket,
  AddShoppingCart as AddCart,
  RemoveShoppingCart,
  Print,
  Download,
  Upload,
  CloudUpload,
  CloudDownload,
  Save,
  Backup,
  Restore,
  Delete,
  Edit,
  Add,
  Remove,
  Check,
  Close,
  Done,
  Clear,
  Search,
  FilterList,
  Sort,
  SwapVert,
  ImportExport,
  SyncAlt,
  Sync,
  Refresh,
  Update,
  Autorenew,
  OpenInNew,
  Launch,
  Link,
  AttachFile,
  Note,
  NoteAdd,
  Notes,
  Bookmark,
  BookmarkBorder,
  Label,
  LocalAtm,
  Gavel,
  Balance,
  Policy,
  Article,
  MenuBook,
  Book,
  LibraryBooks,
  Class,
  School,
  Apartment,
  MeetingRoom,
  Room,
  Domain,
  LocationCity,
  Map,
  Place,
  MyLocation,
  NearMe,
  Directions,
  DirectionsCar,
  DirectionsBus,
  Flight,
  Hotel,
  Restaurant,
  Fastfood,
  LocalCafe,
  LocalBar,
  LocalDining,
  LocalGroceryStore,
  LocalHospital,
  LocalPharmacy,
  LocalMall,
  LocalParking,
  LocalGasStation,
  Computer,
  Laptop,
  PhoneIphone,
  Tablet,
  Watch,
  Devices,
  DeviceHub,
  Cast,
  Wifi,
  SignalWifi4Bar,
  Bluetooth,
  Usb,
  Power,
  BatteryFull,
  Memory,
  Storage,
  Cloud,
  Duo
} from '@mui/icons-material';

const iconOptions = [
  { name: 'Home', component: <Home fontSize="small" /> },
  { name: 'Dashboard', component: <Dashboard fontSize="small" /> },
  { name: 'Settings', component: <Settings fontSize="small" /> },
  { name: 'Business', component: <Business fontSize="small" /> },
  { name: 'Store', component: <Store fontSize="small" /> },
  { name: 'Storefront', component: <Storefront fontSize="small" /> },
  { name: 'Inventory', component: <Inventory fontSize="small" /> },
  { name: 'Category', component: <Category fontSize="small" /> },
  { name: 'ShoppingCart', component: <ShoppingCart fontSize="small" /> },
  { name: 'ShoppingBag', component: <ShoppingBag fontSize="small" /> },
  { name: 'ShoppingBasket', component: <ShoppingBasket fontSize="small" /> },
  { name: 'AddShoppingCart', component: <AddShoppingCart fontSize="small" /> },
  { name: 'LocalShipping', component: <LocalShipping fontSize="small" /> },
  { name: 'Warehouse', component: <Warehouse fontSize="small" /> },
  { name: 'Assignment', component: <Assignment fontSize="small" /> },
  { name: 'AssignmentInd', component: <AssignmentInd fontSize="small" /> },
  { name: 'Receipt', component: <Receipt fontSize="small" /> },
  { name: 'Description', component: <Description fontSize="small" /> },
  { name: 'ListAlt', component: <ListAlt fontSize="small" /> },
  { name: 'Assessment', component: <Assessment fontSize="small" /> },
  { name: 'BarChart', component: <BarChart fontSize="small" /> },
  { name: 'PieChart', component: <PieChart fontSize="small" /> },
  { name: 'ShowChart', component: <ShowChart fontSize="small" /> },
  { name: 'TrendingUp', component: <TrendingUp fontSize="small" /> },
  { name: 'Analytics', component: <Analytics fontSize="small" /> },
  { name: 'Insights', component: <Insights fontSize="small" /> },
  { name: 'AttachMoney', component: <AttachMoney fontSize="small" /> },
  { name: 'MonetizationOn', component: <MonetizationOn fontSize="small" /> },
  { name: 'Payment', component: <Payment fontSize="small" /> },
  { name: 'CreditCard', component: <CreditCard fontSize="small" /> },
  { name: 'AccountBalance', component: <AccountBalance fontSize="small" /> },
  { name: 'AccountBalanceWallet', component: <AccountBalanceWallet fontSize="small" /> },
  { name: 'Savings', component: <Savings fontSize="small" /> },
  { name: 'RequestQuote', component: <RequestQuote fontSize="small" /> },
  { name: 'Calculate', component: <Calculate fontSize="small" /> },
  { name: 'PointOfSale', component: <PointOfSale fontSize="small" /> },
  { name: 'Sell', component: <Sell fontSize="small" /> },
  { name: 'LocalOffer', component: <LocalOffer fontSize="small" /> },
  { name: 'Person', component: <Person fontSize="small" /> },
  { name: 'People', component: <People fontSize="small" /> },
  { name: 'Groups', component: <Groups fontSize="small" /> },
  { name: 'Group', component: <Group fontSize="small" /> },
  { name: 'SupervisedUserCircle', component: <SupervisedUserCircle fontSize="small" /> },
  { name: 'PersonAdd', component: <PersonAdd fontSize="small" /> },
  { name: 'PersonSearch', component: <PersonSearch fontSize="small" /> },
  { name: 'AccountCircle', component: <AccountCircle fontSize="small" /> },
  { name: 'AdminPanelSettings', component: <AdminPanelSettings fontSize="small" /> },
  { name: 'Badge', component: <Badge fontSize="small" /> },
  { name: 'Work', component: <Work fontSize="small" /> },
  { name: 'Security', component: <Security fontSize="small" /> },
  { name: 'Lock', component: <Lock fontSize="small" /> },
  { name: 'VpnKey', component: <VpnKey fontSize="small" /> },
  { name: 'Password', component: <Password fontSize="small" /> },
  { name: 'Verified', component: <Verified fontSize="small" /> },
  { name: 'ShieldOutlined', component: <ShieldOutlined fontSize="small" /> },
  { name: 'Email', component: <Email fontSize="small" /> },
  { name: 'Phone', component: <Phone fontSize="small" /> },
  { name: 'ContactMail', component: <ContactMail fontSize="small" /> },
  { name: 'Notifications', component: <Notifications fontSize="small" /> },
  { name: 'Event', component: <Event fontSize="small" /> },
  { name: 'CalendarToday', component: <CalendarToday fontSize="small" /> },
  { name: 'Schedule', component: <Schedule fontSize="small" /> },
  { name: 'AccessTime', component: <AccessTime fontSize="small" /> },
  { name: 'Today', component: <Today fontSize="small" /> },
  { name: 'DateRange', component: <DateRange fontSize="small" /> },
  { name: 'LocationOn', component: <LocationOn fontSize="small" /> },
  { name: 'Place', component: <Place fontSize="small" /> },
  { name: 'Map', component: <Map fontSize="small" /> },
  { name: 'MyLocation', component: <MyLocation fontSize="small" /> },
  { name: 'NearMe', component: <NearMe fontSize="small" /> },
  { name: 'Directions', component: <Directions fontSize="small" /> },
  { name: 'Build', component: <Build fontSize="small" /> },
  { name: 'Engineering', component: <Engineering fontSize="small" /> },
  { name: 'Construction', component: <Construction fontSize="small" /> },
  { name: 'Handyman', component: <Handyman fontSize="small" /> },
  { name: 'Hardware', component: <Hardware fontSize="small" /> },
  { name: 'Folder', component: <Folder fontSize="small" /> },
  { name: 'FileCopy', component: <FileCopy fontSize="small" /> },
  { name: 'Note', component: <Note fontSize="small" /> },
  { name: 'NoteAdd', component: <NoteAdd fontSize="small" /> },
  { name: 'Notes', component: <Notes fontSize="small" /> },
  { name: 'Article', component: <Article fontSize="small" /> },
  { name: 'MenuBook', component: <MenuBook fontSize="small" /> },
  { name: 'Book', component: <Book fontSize="small" /> },
  { name: 'LibraryBooks', component: <LibraryBooks fontSize="small" /> },
  { name: 'Layers', component: <Layers fontSize="small" /> },
  { name: 'ViewModule', component: <ViewModule fontSize="small" /> },
  { name: 'ViewList', component: <ViewList fontSize="small" /> },
  { name: 'ViewComfy', component: <ViewComfy fontSize="small" /> },
  { name: 'GridView', component: <GridView fontSize="small" /> },
  { name: 'TableChart', component: <TableChart fontSize="small" /> },
  { name: 'Print', component: <Print fontSize="small" /> },
  { name: 'Download', component: <Download fontSize="small" /> },
  { name: 'Upload', component: <Upload fontSize="small" /> },
  { name: 'CloudUpload', component: <CloudUpload fontSize="small" /> },
  { name: 'CloudDownload', component: <CloudDownload fontSize="small" /> },
  { name: 'Cloud', component: <Cloud fontSize="small" /> },
  { name: 'Save', component: <Save fontSize="small" /> },
  { name: 'Backup', component: <Backup fontSize="small" /> },
  { name: 'Restore', component: <Restore fontSize="small" /> },
  { name: 'Delete', component: <Delete fontSize="small" /> },
  { name: 'Edit', component: <Edit fontSize="small" /> },
  { name: 'Add', component: <Add fontSize="small" /> },
  { name: 'Remove', component: <Remove fontSize="small" /> },
  { name: 'Check', component: <Check fontSize="small" /> },
  { name: 'Close', component: <Close fontSize="small" /> },
  { name: 'Done', component: <Done fontSize="small" /> },
  { name: 'Clear', component: <Clear fontSize="small" /> },
  { name: 'Search', component: <Search fontSize="small" /> },
  { name: 'FilterList', component: <FilterList fontSize="small" /> },
  { name: 'Sort', component: <Sort fontSize="small" /> },
  { name: 'SwapVert', component: <SwapVert fontSize="small" /> },
  { name: 'ImportExport', component: <ImportExport fontSize="small" /> },
  { name: 'Sync', component: <Sync fontSize="small" /> },
  { name: 'Refresh', component: <Refresh fontSize="small" /> },
  { name: 'Update', component: <Update fontSize="small" /> },
  { name: 'Link', component: <Link fontSize="small" /> },
  { name: 'AttachFile', component: <AttachFile fontSize="small" /> },
  { name: 'Bookmark', component: <Bookmark fontSize="small" /> },
  { name: 'Label', component: <Label fontSize="small" /> },
  { name: 'Star', component: <Star fontSize="small" /> },
  { name: 'Help', component: <Help fontSize="small" /> },
  { name: 'Info', component: <Info fontSize="small" /> },
  { name: 'HomeWork', component: <HomeWork fontSize="small" /> },
  { name: 'Apartment', component: <Apartment fontSize="small" /> },
  { name: 'MeetingRoom', component: <MeetingRoom fontSize="small" /> },
  { name: 'Room', component: <Room fontSize="small" /> },
  { name: 'Domain', component: <Domain fontSize="small" /> },
  { name: 'LocationCity', component: <LocationCity fontSize="small" /> },
  { name: 'DirectionsCar', component: <DirectionsCar fontSize="small" /> },
  { name: 'DirectionsBus', component: <DirectionsBus fontSize="small" /> },
  { name: 'Flight', component: <Flight fontSize="small" /> },
  { name: 'Hotel', component: <Hotel fontSize="small" /> },
  { name: 'Restaurant', component: <Restaurant fontSize="small" /> },
  { name: 'Fastfood', component: <Fastfood fontSize="small" /> },
  { name: 'LocalCafe', component: <LocalCafe fontSize="small" /> },
  { name: 'LocalBar', component: <LocalBar fontSize="small" /> },
  { name: 'LocalDining', component: <LocalDining fontSize="small" /> },
  { name: 'LocalGroceryStore', component: <LocalGroceryStore fontSize="small" /> },
  { name: 'LocalHospital', component: <LocalHospital fontSize="small" /> },
  { name: 'LocalPharmacy', component: <LocalPharmacy fontSize="small" /> },
  { name: 'LocalMall', component: <LocalMall fontSize="small" /> },
  { name: 'LocalParking', component: <LocalParking fontSize="small" /> },
  { name: 'LocalGasStation', component: <LocalGasStation fontSize="small" /> },
  { name: 'Computer', component: <Computer fontSize="small" /> },
  { name: 'Laptop', component: <Laptop fontSize="small" /> },
  { name: 'PhoneIphone', component: <PhoneIphone fontSize="small" /> },
  { name: 'Tablet', component: <Tablet fontSize="small" /> },
  { name: 'Watch', component: <Watch fontSize="small" /> },
  { name: 'Tv', component: <Tv fontSize="small" /> },
  { name: 'Devices', component: <Devices fontSize="small" /> },
  { name: 'Speed', component: <Speed fontSize="small" /> },
  { name: 'Wifi', component: <Wifi fontSize="small" /> },
  { name: 'Bluetooth', component: <Bluetooth fontSize="small" /> },
  { name: 'Memory', component: <Memory fontSize="small" /> },
  { name: 'Storage', component: <Storage fontSize="small" /> },
  { name: 'Class', component: <Class fontSize="small" /> },
  { name: 'School', component: <School fontSize="small" /> },
  { name: 'Gavel', component: <Gavel fontSize="small" /> },
  { name: 'Balance', component: <Balance fontSize="small" /> },
  { name: 'Policy', component: <Policy fontSize="small" /> }
];

const EditMenu = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [menus, setMenus] = useState<any[]>([]);
  const [form, setForm] = useState({
    parent_menu_id: '',
    title: '',
    icon: '',
    path: '',
    heading: '',
    status: 1,
    orden: 0
  });

  useEffect(() => {
    FetchData('/menu').then(setMenus);
    FetchData(`/menu/${id}`).then((data) => {
      setForm({
        parent_menu_id: data.parent_menu_id || '',
        title: data.title || '',
        icon: data.icon || '',
        path: data.path || '',
        heading: data.heading || '',
        status: data.status || 1,
        orden: data.orden || 0
      });
    });
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    await FetchData(`/menu/${id}`, 'PUT', {
      ...form,
      parent_menu_id: form.parent_menu_id || null
    });
    navigate('/menu-management');
  };

  return (
    <Container>
      <h2>Editar Menú</h2>

      <Autocomplete
        options={menus}
        getOptionLabel={(option) => option.title + ` (${option.parent_name || 'Ninguno'})`}
        value={menus.find((menu) => menu.id === form.parent_menu_id) || null}
        onChange={(_, newValue) =>
          setForm({ ...form, parent_menu_id: newValue ? newValue.id : '' })
        }
        renderInput={(params) => (
          <TextField {...params} label="Menú Padre" margin="normal" fullWidth />
        )}
      />

      <TextField
        label="Título"
        name="title"
        value={form.title}
        onChange={handleChange}
        fullWidth
        margin="normal"
      />

      {/* Autocomplete de Iconos con búsqueda */}
      <Autocomplete
        options={iconOptions}
        getOptionLabel={(option) => option.name}
        value={iconOptions.find((icon) => icon.name === form.icon) || null}
        onChange={(_, newValue) => setForm({ ...form, icon: newValue?.name || '' })}
        renderOption={(props, option) => (
          <Box component="li" {...props} display="flex" alignItems="center" gap={1}>
            {option.component}
            <Typography>{option.name}</Typography>
          </Box>
        )}
        renderInput={(params) => <TextField {...params} label="Icono" margin="normal" fullWidth />}
      />

      <TextField
        label="Ruta"
        name="path"
        value={form.path}
        onChange={handleChange}
        fullWidth
        margin="normal"
      />

      <TextField
        label="Encabezado"
        name="heading"
        value={form.heading}
        onChange={handleChange}
        fullWidth
        margin="normal"
      />

      <TextField
        select
        label="Estado"
        name="status"
        value={form.status}
        onChange={handleChange}
        fullWidth
        margin="normal"
      >
        <MenuItem value={1}>Activo</MenuItem>
        <MenuItem value={0}>Inactivo</MenuItem>
      </TextField>
      <TextField
        label="Orden"
        name="orden"
        type="number"
        value={(form as any).orden || ''}
        onChange={(e) => setForm({ ...form, orden: parseInt(e.target.value, 10) || 0 })}
        fullWidth
        margin="normal"
      />

      <Button variant="contained" color="primary" onClick={handleSubmit}>
        Actualizar
      </Button>
    </Container>
  );
};

export default EditMenu;

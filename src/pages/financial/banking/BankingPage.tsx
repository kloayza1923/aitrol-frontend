import React, { useState, useMemo, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from '@/components/ui/card';
import { HorizonAiChat } from '@/components/ai/HorizonAiChat';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  Search,
  FileText,
  MoreHorizontal,
  Plus,
  CheckCircle2,
  AlertCircle,
  Calendar as CalendarIcon,
  Filter,
  Trash2,
  Landmark
} from 'lucide-react';

// --- DATA INICIAL / TIPOS ---
import {
  useGetBankAccountsQuery,
  useGetBankMovimientosQuery,
  useGetChequesQuery,
  useCreateBankMovimientoMutation,
  useCreateBankAccountMutation,
  useCobrarChequeMutation,
  useCreateChequeMutation,
  useGetFinConfigValidateQuery
} from '@/store/api/bankingslice';

// MUI for animations (used together with Tailwind)
import {
  Grow,
  Fade,
  Button as MuiButton,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
  Dialog as MuiDialog,
  DialogTitle as MuiDialogTitle,
  DialogContent as MuiDialogContent,
  DialogActions as MuiDialogActions,
  Table as MuiTable,
  TableBody as MuiTableBody,
  TableCell as MuiTableCell,
  TableHead as MuiTableHead,
  TableRow as MuiTableRow,
  TableContainer as MuiTableContainer,
  Paper as MuiPaper
} from '@mui/material';
import { useAuthContext } from '@/auth';
import { useNotification } from '@/hooks';

// Tipos locales (simplificados)
interface CuentaBancaria {
  id: number;
  banco: string;
  numeroCuenta: string;
  tipo?: string;
  moneda?: string;
  saldo: number;
  titular?: string;
  logo?: string;
  color?: string;
}

interface MovimientoBancario {
  id: number;
  cuentaId: number;
  fecha: string;
  descripcion?: string;
  referencia?: string;
  tipo?: 'INGRESO' | 'EGRESO' | string;
  monto: number;
  saldoPosterior?: number;
  conciliado?: boolean;
}

interface Cheque {
  id: number;
  numero?: string;
  banco?: string;
  beneficiario?: string;
  fechaEmision?: string;
  fechaCobro?: string;
  monto: number;
  estado?: string;
  tipo?: string;
}

// Extendemos los tipos para el estado local si es necesario
interface MovimientoExt extends MovimientoBancario {
  conciliado?: boolean;
}

export const BankingPage = () => {
  // --- ESTADOS DE DATOS ---
  const { currentUser } = useAuthContext();
  const notification = useNotification();
  const [cuentas, setCuentas] = useState<CuentaBancaria[]>([]);
  const [movimientos, setMovimientos] = useState<MovimientoExt[]>([]);
  const [cheques, setCheques] = useState<Cheque[]>([]);

  // Store hooks
  const { data: accountsData } = useGetBankAccountsQuery();
  const { data: movimientosData } = useGetBankMovimientosQuery({ limit: 200 });
  const { data: chequesData } = useGetChequesQuery({ limit: 200 });
  const { data: finConfigValidation } = useGetFinConfigValidateQuery();
  const [createMovimiento, { isLoading: creatingMovimiento }] = useCreateBankMovimientoMutation();
  const [createAccount, { isLoading: creatingAccount }] = useCreateBankAccountMutation();
  const [cobrarCheque, { isLoading: chargingCheque }] = useCobrarChequeMutation();
  const [createCheque, { isLoading: creatingCheque }] = useCreateChequeMutation();

  // Sync data from API to local state for UI
  useEffect(() => {
    if (accountsData && accountsData.data) setCuentas(accountsData.data);
  }, [accountsData]);

  useEffect(() => {
    if (movimientosData && movimientosData.data) {
      // Map API movimiento shape to local MovimientoExt
      const m = movimientosData.data.map((it: any) => ({
        id: it.id,
        cuentaId: it.cuentaId || it.cuenta_id,
        fecha: it.fecha,
        descripcion: it.descripcion || '',
        referencia: it.referencia || '',
        tipo: it.tipo === 'DEBITO' ? 'EGRESO' : it.tipo === 'CREDITO' ? 'INGRESO' : it.tipo,
        monto: it.monto,
        saldoPosterior: undefined,
        conciliado: !!it.conciliado
      }));
      setMovimientos(m);
    }
  }, [movimientosData]);

  useEffect(() => {
    if (chequesData && chequesData.data) setCheques(chequesData.data);
  }, [chequesData]);

  // --- ESTADOS DE UI & FILTROS ---
  const [activeTab, setActiveTab] = useState('cuentas');
  const [searchMovimiento, setSearchMovimiento] = useState('');
  const [searchCheque, setSearchCheque] = useState('');
  const [filterChequeEstado, setFilterChequeEstado] = useState<'TODOS' | 'PENDIENTE'>('TODOS');

  // --- ESTADOS DE MODALES ---
  const [isIncomeOpen, setIsIncomeOpen] = useState(false);
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);

  // Estado para la conciliación
  const [conciliationAccount, setConciliationAccount] = useState<CuentaBancaria | null>(null);
  const [tempConciliados, setTempConciliados] = useState<number[]>([]); // IDs de movimientos marcados en el modal actual

  // Datos para la IA
  const aiReportData = useMemo(() => {
    const totalSaldos = cuentas.reduce((sum, c) => sum + c.saldo, 0);
    const totalIngresos = movimientos
      .filter((m) => m.tipo === 'INGRESO')
      .reduce((sum, m) => sum + m.monto, 0);
    const totalEgresos = movimientos
      .filter((m) => m.tipo === 'EGRESO')
      .reduce((sum, m) => sum + m.monto, 0);
    const movimientosPendientes = movimientos.filter((m) => !m.conciliado).length;
    const chequesEmitidos = cheques.filter(
      (c) => c.tipo === 'EMITIDO' && (c.estado === 'PENDIENTE' || c.estado === 'COBRADO')
    ).length;
    const chequesCobrados = cheques.filter((c) => c.estado === 'COBRADO').length;

    return {
      report_type: 'banking',
      cuentas: cuentas.map((c) => ({
        banco: c.banco,
        numero: c.numeroCuenta,
        tipo: c.tipo,
        saldo: c.saldo.toFixed(2),
        moneda: c.moneda
      })),
      resumen: {
        total_cuentas: cuentas.length,
        saldo_total: totalSaldos.toFixed(2),
        total_ingresos: totalIngresos.toFixed(2),
        total_egresos: totalEgresos.toFixed(2),
        flujo_neto: (totalIngresos - totalEgresos).toFixed(2),
        movimientos_pendientes_conciliacion: movimientosPendientes,
        cheques_emitidos: chequesEmitidos,
        cheques_cobrados: chequesCobrados
      },
      alertas: [
        ...cuentas
          .filter((c) => c.saldo < 500)
          .map((c) => `⚠️ Saldo bajo en ${c.banco} - ${c.numeroCuenta}: $${c.saldo.toFixed(2)}`),
        ...(movimientosPendientes > 10
          ? [`⚠️ ${movimientosPendientes} movimientos sin conciliar`]
          : []),
        ...(chequesEmitidos > 0 ? [`📝 ${chequesEmitidos} cheque(s) pendiente de cobro`] : [])
      ]
    };
  }, [cuentas, movimientos, cheques]);

  // --- FORM STATES ---
  const [formData, setFormData] = useState({
    cuentaId: 1,
    monto: '',
    referencia: '',
    descripcion: '',
    beneficiario: '',
    esCheque: false,
    tipoOperacion: 'CREDITO',
    fechaCheque: '',
    fecha: new Date().toISOString().split('T')[0]
  });

  const [newAccountForm, setNewAccountForm] = useState({
    banco: '',
    numeroCuenta: '',
    tipo: 'CORRIENTE' as 'CORRIENTE' | 'AHORROS',
    saldoInicial: '',
    moneda: 'USD'
  });

  // --- HANDLERS GENERALES ---

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      cuentaId: cuentas[0]?.id || 0,
      monto: '',
      referencia: '',
      descripcion: '',
      beneficiario: '',
      esCheque: false,
      tipoOperacion: 'CREDITO',
      fechaCheque: '',
      fecha: new Date().toISOString().split('T')[0]
    });
  };

  // --- LOGICA DE NEGOCIO ---

  // 1. Crear Transacción (Ingreso/Egreso)
  const handleCreateTransaction = async (tipo: 'INGRESO' | 'EGRESO') => {
    const montoFloat = parseFloat(formData.monto);
    if (!montoFloat || montoFloat <= 0) {
      notification.error('Ingrese un monto válido');
      return;
    }

    const cuentaId = Number(formData.cuentaId);
    const cuentaActual = cuentas.find((c) => c.id === cuentaId);
    if (!cuentaActual) return;

    const payload: any = {
      cuentaId,
      fecha: formData.fecha,
      descripcion:
        formData.descripcion || (tipo === 'INGRESO' ? 'Ingreso registrado' : 'Egreso registrado'),
      referencia: formData.referencia || `REF-${Date.now().toString().slice(-4)}`,
      monto: tipo === 'EGRESO' ? -Math.abs(montoFloat) : Math.abs(montoFloat),
      tipo: tipo === 'EGRESO' ? 'DEBITO' : 'CREDITO',
      idUsuario: currentUser?.id || 0
    };

    try {
      const res: any = await createMovimiento({ data: payload }).unwrap();
      // Optimistic UI update
      const nuevoMov: MovimientoExt = {
        id: res.id || Date.now(),
        cuentaId,
        fecha: formData.fecha,
        descripcion: payload.descripcion,
        referencia: payload.referencia,
        tipo,
        monto: Math.abs(montoFloat),
        saldoPosterior: undefined,
        conciliado: false
      };
      setMovimientos((prev) => [nuevoMov, ...prev]);
      // actualizar saldo local
      setCuentas((prev) =>
        prev.map((c) => (c.id === cuentaId ? { ...c, saldo: (c.saldo || 0) + payload.monto } : c))
      );

      // Si es cheque, persistirlo en backend (API creada)
      if (tipo === 'EGRESO' && formData.esCheque) {
        const chequePayload = {
          numero: formData.referencia || 'S/N',
          banco: cuentaActual.banco,
          beneficiario: formData.beneficiario || 'Portador',
          fechaEmision: formData.fecha,
          fechaCobro: formData.fechaCheque || formData.fecha,
          monto: montoFloat,
          tipo: 'EMITIDO',
          cuentaId: cuentaId,
          idUsuario: currentUser?.id || 0
        };
        try {
          const chequeRes: any = await createCheque({ data: chequePayload }).unwrap();
          const nuevoCheque: Cheque = {
            id: chequeRes.id || Date.now(),
            numero: chequePayload.numero,
            banco: chequePayload.banco,
            beneficiario: chequePayload.beneficiario,
            fechaEmision: chequePayload.fechaEmision,
            fechaCobro: chequePayload.fechaCobro,
            monto: chequePayload.monto,
            estado: 'PENDIENTE',
            tipo: 'EMITIDO'
          };
          setCheques((prev) => [nuevoCheque, ...prev]);
        } catch (err) {
          console.error(err);
          notification.error(
            'Error creando cheque emitido: ',
            (err as string) || 'Error creando cheque emitido'
          );
        }
      }

      // Soporte para cheques recibidos al crear un ingreso
      if (tipo === 'INGRESO' && formData.esCheque) {
        const chequePayload = {
          numero: formData.referencia || 'S/N',
          banco: cuentaActual.banco,
          beneficiario: formData.beneficiario || 'Portador',
          fechaEmision: formData.fecha,
          fechaCobro: formData.fechaCheque || formData.fecha,
          monto: montoFloat,
          tipo: 'RECIBIDO',
          cuentaId: cuentaId,
          idUsuario: currentUser?.id || 0
        };
        try {
          const chequeRes: any = await createCheque({ data: chequePayload }).unwrap();
          const nuevoCheque: Cheque = {
            id: chequeRes.id || Date.now(),
            numero: chequePayload.numero,
            banco: chequePayload.banco,
            beneficiario: chequePayload.beneficiario,
            fechaEmision: chequePayload.fechaEmision,
            fechaCobro: chequePayload.fechaCobro,
            monto: chequePayload.monto,
            estado: 'PENDIENTE',
            tipo: 'RECIBIDO'
          };
          setCheques((prev) => [nuevoCheque, ...prev]);
        } catch (err) {
          console.error(err);
          notification.error(
            'Error creando cheque recibido: ',
            (err as string) || 'Error creando cheque recibido'
          );
        }
      }

      //resetForm();
      if (tipo === 'INGRESO') setIsIncomeOpen(false);
      else setIsExpenseOpen(false);
    } catch (err: any) {
      console.error(err);
      const msg = err?.data?.detail || err?.error || err?.message || JSON.stringify(err);
      notification.error('Error creando transacción: ', String(msg) || 'Error creando transacción');
    }
  };

  // 2. Crear Nueva Cuenta
  const handleCreateAccount = () => {
    if (!newAccountForm.banco || !newAccountForm.numeroCuenta) {
      notification.error('Complete datos', 'Banco y Número de Cuenta son requeridos');
      return;
    }
    const payload = {
      banco: newAccountForm.banco,
      numeroCuenta: newAccountForm.numeroCuenta,
      tipo: newAccountForm.tipo,
      moneda: newAccountForm.moneda,
      saldo: parseFloat(newAccountForm.saldoInicial) || 0,
      idUsuario: currentUser?.id || 0
    };
    createAccount({ data: payload })
      .unwrap()
      .then((res: any) => {
        const created: CuentaBancaria = {
          id: res.id || Date.now(),
          banco: newAccountForm.banco,
          numeroCuenta: newAccountForm.numeroCuenta,
          tipo: newAccountForm.tipo,
          moneda: newAccountForm.moneda,
          saldo: parseFloat(newAccountForm.saldoInicial) || 0,
          titular: 'Mi Empresa S.A.',
          logo: newAccountForm.banco.substring(0, 2).toUpperCase(),
          color: 'bg-slate-800 text-white'
        };
        setCuentas((prev) => [...prev, created]);
        setIsAddAccountOpen(false);
        setNewAccountForm({
          banco: '',
          numeroCuenta: '',
          tipo: 'CORRIENTE',
          saldoInicial: '',
          moneda: 'USD'
        });
      })
      .catch((err) => {
        console.error(err);
        const msg = err?.data?.detail || err?.message || JSON.stringify(err);
        notification.error(String(msg) || 'Error creando cuenta');
      });
  };

  // 3. Ver Detalles (Navegación simulada)
  const handleViewDetails = (cuentaId: number) => {
    // 1. Cambiar al tab de movimientos
    setActiveTab('movimientos');
    // 2. Filtrar el buscador con el nombre del banco o ID para simular filtro
    // Para simplificar este mockup, filtramos la tabla visualmente si quisieramos,
    // pero aquí reseteamos el filtro o podríamos pre-llenarlo.
    // Vamos a hacer algo mejor: filtrar por Texto "Banco X" en el buscador
    const cuenta = cuentas.find((c) => c.id === cuentaId);
    if (cuenta) setSearchMovimiento(cuenta.banco);
  };

  // 4. Conciliación
  const openConciliation = (cuenta: CuentaBancaria) => {
    setConciliationAccount(cuenta);
    // Cargar conciliados actuales en el temp
    const currentConciliated = movimientos
      .filter((m) => m.cuentaId === cuenta.id && m.conciliado)
      .map((m) => m.id);
    setTempConciliados(currentConciliated);
  };

  const toggleTempConciliado = (id: number) => {
    if (tempConciliados.includes(id)) {
      setTempConciliados(tempConciliados.filter((i) => i !== id));
    } else {
      setTempConciliados([...tempConciliados, id]);
    }
  };

  const saveConciliation = () => {
    if (!conciliationAccount) return;
    setMovimientos((prev) =>
      prev.map((m) => {
        if (m.cuentaId === conciliationAccount.id) {
          return { ...m, conciliado: tempConciliados.includes(m.id) };
        }
        return m;
      })
    );
    setConciliationAccount(null);
  };

  // --- FILTROS Y DATOS DERIVADOS ---

  const filteredMovimientos = useMemo(() => {
    return movimientos.filter((m) => {
      const search = searchMovimiento.toLowerCase();
      const bancoName = cuentas.find((c) => c.id === m.cuentaId)?.banco.toLowerCase() || '';
      return (
        m.descripcion?.toLowerCase().includes(search) ||
        m.referencia?.toLowerCase().includes(search) ||
        bancoName.includes(search)
      );
    });
  }, [movimientos, searchMovimiento, cuentas]);

  const filteredCheques = useMemo(() => {
    return cheques.filter((c) => {
      const matchesSearch =
        c.numero.includes(searchCheque) ||
        c.beneficiario.toLowerCase().includes(searchCheque.toLowerCase());
      const matchesFilter = filterChequeEstado === 'TODOS' ? true : c.estado === filterChequeEstado;
      return matchesSearch && matchesFilter;
    });
  }, [cheques, searchCheque, filterChequeEstado]);

  const totalSaldo = cuentas.reduce((acc, c) => acc + c.saldo, 0);
  const chequesPorCobrarTotal = cheques
    .filter((c) => c.tipo === 'RECIBIDO' && c.estado === 'PENDIENTE')
    .reduce((acc, c) => acc + c.monto, 0);
  const chequesPorPagarTotal = cheques
    .filter((c) => c.tipo === 'EMITIDO' && c.estado === 'PENDIENTE')
    .reduce((acc, c) => acc + c.monto, 0);

  return (
    <div className="container mx-auto p-6 space-y-8 animate-in fade-in duration-500 pb-20">
      {/* AI Chat */}
      <HorizonAiChat modules={[]} reportData={aiReportData} />

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Gestión de Bancos y Tesorería
          </h1>
          <p className="text-gray-500">Control de flujo de efectivo, cuentas y conciliaciones.</p>
        </div>
        <div className="flex gap-2">
          {/* MUI Ingreso Button/Dialog */}
          <MuiButton
            variant="outlined"
            color="success"
            className="gap-2 border-green-200 text-green-700 hover:bg-green-50"
            startIcon={<ArrowUpRight className="w-4 h-4" />}
            onClick={() => setIsIncomeOpen(true)}
          >
            Ingreso
          </MuiButton>
          <MuiDialog
            open={isIncomeOpen}
            onClose={() => setIsIncomeOpen(false)}
            fullWidth
            maxWidth="sm"
          >
            <MuiDialogTitle>Registrar Ingreso</MuiDialogTitle>
            <MuiDialogContent>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <TextField
                      label="Fecha"
                      type="date"
                      name="fecha"
                      value={formData.fecha}
                      onChange={(e) => handleInputChange(e as any)}
                      fullWidth
                      size="small"
                      InputLabelProps={{ shrink: true }}
                    />
                  </div>
                  <div className="space-y-2">
                    <TextField
                      label="Monto"
                      type="number"
                      name="monto"
                      placeholder="0.00"
                      value={formData.monto}
                      onChange={(e) => handleInputChange(e as any)}
                      fullWidth
                      size="small"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <FormControl fullWidth size="small">
                    <InputLabel id="select-cuenta-label">Cuenta Destino</InputLabel>
                    <Select
                      labelId="select-cuenta-label"
                      label="Cuenta Destino"
                      name="cuentaId"
                      value={formData.cuentaId}
                      onChange={(e) => handleInputChange(e as any)}
                    >
                      {cuentas.map((c) => (
                        <MenuItem key={c.id} value={c.id}>{`${c.banco} - $${c.saldo}`}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </div>
                <div className="space-y-2">
                  <FormControl fullWidth size="small">
                    <InputLabel id="tipo-operacion-label">Tipo de Ingreso</InputLabel>
                    <Select
                      labelId="tipo-operacion-label"
                      label="Tipo de Ingreso"
                      name="tipoOperacion"
                      value={formData.tipoOperacion}
                      onChange={(e) => handleInputChange(e as any)}
                    >
                      <MenuItem value="CREDITO">Ingreso (Crédito)</MenuItem>
                      <MenuItem value="RECIBIDO">Cheque Recibido</MenuItem>
                    </Select>
                  </FormControl>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.esCheque}
                        onChange={(e) => setFormData({ ...formData, esCheque: e.target.checked })}
                      />
                    }
                    label="Es Cheque"
                  />
                </div>
                <div className="space-y-2">
                  <TextField
                    label="Referencia"
                    name="referencia"
                    value={formData.referencia}
                    onChange={(e) => handleInputChange(e as any)}
                    fullWidth
                    size="small"
                  />
                </div>
                <div className="space-y-2">
                  <TextField
                    label="Descripción"
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={(e) => handleInputChange(e as any)}
                    fullWidth
                    size="small"
                  />
                </div>
              </div>
            </MuiDialogContent>
            <MuiDialogActions>
              <MuiButton
                type="button"
                onClick={() => {
                  handleCreateTransaction('INGRESO');
                }}
                color="success"
                variant="contained"
              >
                Guardar
              </MuiButton>
            </MuiDialogActions>
          </MuiDialog>

          {/* MUI Egreso Button/Dialog */}
          <MuiButton
            variant="contained"
            color="error"
            className="gap-2 bg-red-600 hover:bg-red-700 text-white"
            startIcon={<ArrowDownLeft className="w-4 h-4" />}
            onClick={() => setIsExpenseOpen(true)}
          >
            Egreso
          </MuiButton>
          <MuiDialog
            open={isExpenseOpen}
            onClose={() => setIsExpenseOpen(false)}
            fullWidth
            maxWidth="sm"
          >
            <MuiDialogTitle>Registrar Egreso</MuiDialogTitle>
            <MuiDialogContent>
              <div className="grid gap-4 py-4">
                <div className="flex items-center gap-2 mb-2">
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.esCheque}
                        onChange={(e) => setFormData({ ...formData, esCheque: e.target.checked })}
                      />
                    }
                    label="Es Cheque"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <TextField
                      label="Fecha"
                      type="date"
                      name="fecha"
                      value={formData.fecha}
                      onChange={(e) => handleInputChange(e as any)}
                      fullWidth
                      size="small"
                      InputLabelProps={{ shrink: true }}
                    />
                  </div>
                  <div className="space-y-2">
                    <TextField
                      label="Monto"
                      type="number"
                      name="monto"
                      placeholder="0.00"
                      value={formData.monto}
                      onChange={(e) => handleInputChange(e as any)}
                      fullWidth
                      size="small"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <FormControl fullWidth size="small">
                    <InputLabel id="select-cuenta-origen-label">Cuenta Origen</InputLabel>
                    <Select
                      labelId="select-cuenta-origen-label"
                      label="Cuenta Origen"
                      name="cuentaId"
                      value={formData.cuentaId}
                      onChange={(e) => handleInputChange(e as any)}
                    >
                      {cuentas.map((c) => (
                        <MenuItem key={c.id} value={c.id}>{`${c.banco} - $${c.saldo}`}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </div>
                <div className="space-y-2">
                  <TextField
                    label="Beneficiario"
                    name="beneficiario"
                    value={formData.beneficiario}
                    onChange={(e) => handleInputChange(e as any)}
                    fullWidth
                    size="small"
                  />
                </div>
                {formData.esCheque ? (
                  <div className="grid grid-cols-2 gap-4 bg-orange-50 p-2 rounded border border-orange-100">
                    <div className="space-y-2">
                      <TextField
                        label="Num Cheque"
                        name="referencia"
                        placeholder="0001"
                        value={formData.referencia}
                        onChange={(e) => handleInputChange(e as any)}
                        fullWidth
                        size="small"
                      />
                    </div>
                    <div className="space-y-2">
                      <TextField
                        label="Fecha Cobro"
                        type="date"
                        name="fechaCheque"
                        value={formData.fechaCheque}
                        onChange={(e) => handleInputChange(e as any)}
                        fullWidth
                        size="small"
                        InputLabelProps={{ shrink: true }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <TextField
                      label="Referencia"
                      name="referencia"
                      value={formData.referencia}
                      onChange={(e) => handleInputChange(e as any)}
                      fullWidth
                      size="small"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <TextField
                    label="Descripción"
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={(e) => handleInputChange(e as any)}
                    fullWidth
                    size="small"
                  />
                </div>
              </div>
            </MuiDialogContent>
            <MuiDialogActions>
              <MuiButton type="button" onClick={() => setIsExpenseOpen(false)} color="inherit">
                Cancelar
              </MuiButton>
              <MuiButton
                type="button"
                onClick={() => {
                  handleCreateTransaction('EGRESO');
                }}
                color="error"
                variant="contained"
              >
                Registrar Pago
              </MuiButton>
            </MuiDialogActions>
          </MuiDialog>
        </div>
      </div>

      {/* Configuración contable: mostrar problemas si faltan claves */}
      {finConfigValidation &&
        finConfigValidation.missing &&
        finConfigValidation.missing.length > 0 && (
          <div>
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-700">Configuración contable incompleta</CardTitle>
                <CardDescription className="text-sm text-red-600">
                  Faltan claves obligatorias de configuración contable.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-red-700">
                  Claves faltantes: {finConfigValidation.missing.join(', ')}
                </div>
                <div className="mt-2 text-xs text-gray-600">Cuentas encontradas:</div>
                <pre className="mt-1 text-xs bg-white p-2 rounded border text-gray-700">
                  {JSON.stringify(finConfigValidation.found || {}, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </div>
        )}

      {/* TARJETAS KPI (Tailwind + MUI Grow animations) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Grow in timeout={300}>
          <div>
            <Card className="bg-slate-50 border-slate-200">
              <CardHeader className="pb-2">
                <CardDescription>Saldo Total (Todas las cuentas)</CardDescription>
                <CardTitle className="text-3xl text-slate-800">
                  ${totalSaldo.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-slate-500 flex gap-1">
                  <Wallet className="w-3 h-3" /> Disponible
                </div>
              </CardContent>
            </Card>
          </div>
        </Grow>
        <Grow in timeout={450}>
          <div>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Cheques por Cobrar</CardDescription>
                <CardTitle className="text-3xl text-green-600">
                  ${chequesPorCobrarTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">Cartera en mano</div>
              </CardContent>
            </Card>
          </div>
        </Grow>
        <Grow in timeout={600}>
          <div>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Cheques por Pagar</CardDescription>
                <CardTitle className="text-3xl text-orange-600">
                  ${chequesPorPagarTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">Flotante enviado</div>
              </CardContent>
            </Card>
          </div>
        </Grow>
      </div>

      {/* TABS */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:w-[400px]">
          <TabsTrigger value="cuentas">Cuentas</TabsTrigger>
          <TabsTrigger value="movimientos">Movimientos</TabsTrigger>
          <TabsTrigger value="cheques">Cheques</TabsTrigger>
        </TabsList>

        {/* --- CONTENIDO CUENTAS --- */}
        <TabsContent value="cuentas" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cuentas.map((cuenta, idx) => (
              <Grow key={cuenta.id} in timeout={250 + idx * 80}>
                <div>
                  <Card
                    className="group hover:shadow-lg transition-all border-l-4"
                    style={{ borderLeftColor: cuenta.id % 2 === 0 ? '#0ea5e9' : '#eab308' }}
                  >
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white text-sm shadow-sm ${cuenta.color}`}
                        >
                          {cuenta.logo}
                        </div>
                        <Badge variant="secondary">{cuenta.tipo}</Badge>
                      </div>
                      <CardTitle className="mt-4">{cuenta.banco}</CardTitle>
                      <CardDescription className="font-mono">{cuenta.numeroCuenta}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        ${cuenta.saldo.toLocaleString('en-US', { minimumFractionDigits: 2 })}{' '}
                        <span className="text-xs text-gray-400 font-normal">{cuenta.moneda}</span>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between border-t pt-4 bg-gray-50/50">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                        onClick={() => handleViewDetails(cuenta.id)}
                      >
                        Ver Detalles
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="text-xs gap-1"
                        onClick={() => openConciliation(cuenta)}
                      >
                        <CheckCircle2 className="w-3 h-3" /> Conciliar
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              </Grow>
            ))}

            {/* Agregar Cuenta Card */}
            <Dialog open={isAddAccountOpen} onOpenChange={setIsAddAccountOpen}>
              <div
                onClick={() => setIsAddAccountOpen(true)}
                className="border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center p-6 text-gray-400 hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors cursor-pointer min-h-[220px]"
              >
                <Plus className="w-12 h-12 mb-2" />
                <span className="font-medium">Agregar Nueva Cuenta</span>
              </div>
              <MuiDialog
                open={isAddAccountOpen}
                onClose={() => setIsAddAccountOpen(false)}
                fullWidth
                maxWidth="sm"
              >
                <MuiDialogTitle>Agregar Cuenta Bancaria</MuiDialogTitle>
                <MuiDialogContent>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <TextField
                        label="Banco"
                        value={newAccountForm.banco}
                        onChange={(e) =>
                          setNewAccountForm({ ...newAccountForm, banco: e.target.value })
                        }
                        placeholder="Ej: Banco Pichincha"
                        fullWidth
                        size="small"
                      />
                    </div>
                    <div className="space-y-2">
                      <TextField
                        label="Número de Cuenta"
                        value={newAccountForm.numeroCuenta}
                        onChange={(e) =>
                          setNewAccountForm({ ...newAccountForm, numeroCuenta: e.target.value })
                        }
                        placeholder="xxxxxxxxxx"
                        fullWidth
                        size="small"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <FormControl fullWidth size="small">
                          <InputLabel id="tipo-cuenta-label">Tipo</InputLabel>
                          <Select
                            labelId="tipo-cuenta-label"
                            label="Tipo"
                            value={newAccountForm.tipo}
                            onChange={(e) =>
                              setNewAccountForm({ ...newAccountForm, tipo: e.target.value as any })
                            }
                          >
                            <MenuItem value="CORRIENTE">Corriente</MenuItem>
                            <MenuItem value="AHORROS">Ahorros</MenuItem>
                          </Select>
                        </FormControl>
                      </div>
                      <div className="space-y-2">
                        <TextField
                          label="Saldo Inicial"
                          type="number"
                          value={newAccountForm.saldoInicial}
                          onChange={(e) =>
                            setNewAccountForm({ ...newAccountForm, saldoInicial: e.target.value })
                          }
                          placeholder="0.00"
                          fullWidth
                          size="small"
                        />
                      </div>
                    </div>
                  </div>
                </MuiDialogContent>
                <MuiDialogActions>
                  <MuiButton onClick={() => setIsAddAccountOpen(false)}>Cancelar</MuiButton>
                  <MuiButton
                    onClick={() => {
                      handleCreateAccount();
                    }}
                    variant="contained"
                  >
                    Crear Cuenta
                  </MuiButton>
                </MuiDialogActions>
              </MuiDialog>
            </Dialog>
          </div>
        </TabsContent>

        {/* --- CONTENIDO MOVIMIENTOS --- */}
        <TabsContent value="movimientos" className="mt-6">
          <Card>
            <CardHeader className="border-b bg-gray-50/40">
              <div className="flex justify-between items-center">
                <CardTitle>Movimientos</CardTitle>
                <div className="flex gap-2 w-[300px]">
                  <div className="relative w-full">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar descripción, ref o banco..."
                      className="pl-9 bg-white"
                      value={searchMovimiento}
                      onChange={(e) => setSearchMovimiento(e.target.value)}
                    />
                  </div>
                  {searchMovimiento && (
                    <Button variant="ghost" size="icon" onClick={() => setSearchMovimiento('')}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Fade in timeout={250}>
                <MuiTableContainer component={MuiPaper} elevation={0}>
                  <MuiTable size="small">
                    <MuiTableHead>
                      <MuiTableRow>
                        <MuiTableCell>Estado</MuiTableCell>
                        <MuiTableCell>Fecha</MuiTableCell>
                        <MuiTableCell>Cuenta</MuiTableCell>
                        <MuiTableCell>Descripción</MuiTableCell>
                        <MuiTableCell align="right">Monto</MuiTableCell>
                        <MuiTableCell align="right">Saldo</MuiTableCell>
                      </MuiTableRow>
                    </MuiTableHead>
                    <MuiTableBody>
                      {filteredMovimientos.length === 0 ? (
                        <MuiTableRow>
                          <MuiTableCell colSpan={6} className="text-center h-24 text-gray-500">
                            No se encontraron movimientos.
                          </MuiTableCell>
                        </MuiTableRow>
                      ) : (
                        filteredMovimientos.map((mov) => (
                          <MuiTableRow key={mov.id}>
                            <MuiTableCell>
                              {mov.conciliado ? (
                                <Badge
                                  variant="outline"
                                  className="bg-green-50 text-green-700 border-green-200"
                                >
                                  Conciliado
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-gray-50 text-gray-500">
                                  Pendiente
                                </Badge>
                              )}
                            </MuiTableCell>
                            <MuiTableCell className="text-xs">{mov.fecha}</MuiTableCell>
                            <MuiTableCell>
                              <div className="font-medium text-sm">
                                {cuentas.find((c) => c.id === mov.cuentaId)?.banco}
                              </div>
                              <div className="text-[10px] text-gray-400 font-mono">
                                {mov.referencia}
                              </div>
                            </MuiTableCell>
                            <MuiTableCell className="text-sm text-gray-600">
                              {mov.descripcion}
                            </MuiTableCell>
                            <MuiTableCell
                              align="right"
                              className={`font-bold ${mov.tipo === 'INGRESO' ? 'text-green-600' : 'text-red-600'}`}
                            >
                              {mov.tipo === 'EGRESO' ? '-' : '+'}$
                              {mov.monto.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </MuiTableCell>
                            <MuiTableCell align="right" className="font-mono text-gray-500">
                              $
                              {mov.saldoPosterior?.toLocaleString
                                ? mov.saldoPosterior.toLocaleString('en-US', {
                                    minimumFractionDigits: 2
                                  })
                                : '—'}
                            </MuiTableCell>
                          </MuiTableRow>
                        ))
                      )}
                    </MuiTableBody>
                  </MuiTable>
                </MuiTableContainer>
              </Fade>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- CONTENIDO CHEQUES --- */}
        <TabsContent value="cheques" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <CardTitle>Cheques</CardTitle>
                  <div className="flex gap-1 ml-4">
                    <Button
                      variant={filterChequeEstado === 'TODOS' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setFilterChequeEstado('TODOS')}
                    >
                      Todos
                    </Button>
                    <Button
                      variant={filterChequeEstado === 'PENDIENTE' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setFilterChequeEstado('PENDIENTE')}
                    >
                      Pendientes
                    </Button>
                  </div>
                </div>
                <div className="relative w-[250px]">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar cheque..."
                    className="pl-9"
                    value={searchCheque}
                    onChange={(e) => setSearchCheque(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Fade in timeout={250}>
                <MuiTableContainer component={MuiPaper} elevation={0}>
                  <MuiTable size="small">
                    <MuiTableHead>
                      <MuiTableRow>
                        <MuiTableCell>Número</MuiTableCell>
                        <MuiTableCell>Fecha Cobro</MuiTableCell>
                        <MuiTableCell>Beneficiario</MuiTableCell>
                        <MuiTableCell>Banco</MuiTableCell>
                        <MuiTableCell>Monto</MuiTableCell>
                        <MuiTableCell>Estado</MuiTableCell>
                        <MuiTableCell></MuiTableCell>
                      </MuiTableRow>
                    </MuiTableHead>
                    <MuiTableBody>
                      {filteredCheques.map((cheque) => (
                        <MuiTableRow key={cheque.id}>
                          <MuiTableCell className="font-mono font-bold">
                            {cheque.numero}
                          </MuiTableCell>
                          <MuiTableCell className="text-xs">{cheque.fechaCobro}</MuiTableCell>
                          <MuiTableCell>{cheque.beneficiario}</MuiTableCell>
                          <MuiTableCell className="text-xs">{cheque.banco}</MuiTableCell>
                          <MuiTableCell className="font-bold">
                            ${cheque.monto.toLocaleString()}
                          </MuiTableCell>
                          <MuiTableCell>
                            <Badge
                              variant={cheque.estado === 'COBRADO' ? 'default' : 'outline'}
                              className={
                                cheque.estado === 'PENDIENTE'
                                  ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                                  : ''
                              }
                            >
                              {cheque.estado}
                            </Badge>
                          </MuiTableCell>
                          <MuiTableCell>
                            {cheque.estado === 'PENDIENTE' && (
                              <MuiButton
                                size="small"
                                variant="text"
                                className="text-blue-600 text-xs hover:text-blue-800"
                                onClick={() => {
                                  cobrarCheque({ id: cheque.id })
                                    .unwrap()
                                    .then(() => {
                                      setCheques((prev) =>
                                        prev.map((c) =>
                                          c.id === cheque.id ? { ...c, estado: 'COBRADO' } : c
                                        )
                                      );
                                    })
                                    .catch((err) => {
                                      console.error(err);
                                      notification.error(
                                        'Error marcando cheque como cobrado: ',
                                        err
                                      );
                                    });
                                }}
                              >
                                Marcar Cobrado
                              </MuiButton>
                            )}
                          </MuiTableCell>
                        </MuiTableRow>
                      ))}
                    </MuiTableBody>
                  </MuiTable>
                </MuiTableContainer>
              </Fade>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* --- MODAL DE CONCILIACIÓN FLOTANTE --- */}
      {conciliationAccount && (
        <MuiDialog
          open={!!conciliationAccount}
          onClose={() => setConciliationAccount(null)}
          fullWidth
          maxWidth="lg"
        >
          <MuiDialogTitle className="flex items-center gap-2">
            <Landmark className="h-5 w-5 text-blue-600" /> Conciliación: {conciliationAccount.banco}
          </MuiDialogTitle>
          <MuiDialogContent dividers className="h-[70vh]">
            <div className="mb-2 text-sm text-gray-500">
              Cuenta: {conciliationAccount.numeroCuenta} | Saldo Sistema:{' '}
              <b>${conciliationAccount.saldo.toLocaleString()}</b>
            </div>
            <Fade in timeout={200}>
              <MuiTableContainer component={MuiPaper} className="h-full overflow-auto">
                <MuiTable size="small">
                  <MuiTableHead>
                    <MuiTableRow>
                      <MuiTableCell className="w-[50px]">Check</MuiTableCell>
                      <MuiTableCell>Fecha</MuiTableCell>
                      <MuiTableCell>Referencia</MuiTableCell>
                      <MuiTableCell>Descripción</MuiTableCell>
                      <MuiTableCell align="right">Monto</MuiTableCell>
                    </MuiTableRow>
                  </MuiTableHead>
                  <MuiTableBody>
                    {movimientos
                      .filter((m) => m.cuentaId === conciliationAccount.id)
                      .map((mov) => {
                        const isSelected = tempConciliados.includes(mov.id);
                        return (
                          <MuiTableRow
                            key={mov.id}
                            hover
                            className={`cursor-pointer ${isSelected ? 'bg-blue-50' : ''}`}
                            onClick={() => toggleTempConciliado(mov.id)}
                          >
                            <MuiTableCell className="text-center">
                              <div
                                className={`w-5 h-5 rounded border flex items-center justify-center ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300'}`}
                              >
                                {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                              </div>
                            </MuiTableCell>
                            <MuiTableCell className="text-xs text-gray-500">
                              {mov.fecha}
                            </MuiTableCell>
                            <MuiTableCell className="text-xs font-mono">
                              {mov.referencia}
                            </MuiTableCell>
                            <MuiTableCell className="text-sm">{mov.descripcion}</MuiTableCell>
                            <MuiTableCell
                              align="right"
                              className={`font-bold text-sm ${mov.tipo === 'INGRESO' ? 'text-green-600' : 'text-red-600'}`}
                            >
                              {mov.tipo === 'EGRESO' ? '-' : ''}
                              {mov.monto.toLocaleString()}
                            </MuiTableCell>
                          </MuiTableRow>
                        );
                      })}
                  </MuiTableBody>
                </MuiTable>
              </MuiTableContainer>
            </Fade>
          </MuiDialogContent>
          <MuiDialogActions>
            <MuiButton onClick={() => setConciliationAccount(null)}>Cancelar</MuiButton>
            <MuiButton onClick={saveConciliation} variant="contained" color="primary">
              Guardar Conciliación
            </MuiButton>
          </MuiDialogActions>
        </MuiDialog>
      )}
    </div>
  );
};

export default BankingPage;

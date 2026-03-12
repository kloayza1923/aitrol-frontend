import React, { useState, useMemo, useEffect } from 'react';
import { toast } from 'sonner';
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
  Plus,
  ShoppingBag,
  DollarSign,
  Calendar,
  TrendingUp,
  ShieldCheck,
  ArrowDownRight,
  ArrowUpRight,
  Search,
  FileText
} from 'lucide-react';

import {
  useGetTarjetasQuery,
  useGetMovimientosTCQuery,
  useCreateCompraTCMutation,
  useCreatePagoTCMutation,
  useCreateTarjetaMutation
} from '@/store/api/cont/creditCardsApi';
import { current_user } from '@/lib/api';
import { useAuthContext } from '@/auth';
import { MovimientoTC } from './mock-data';
import { useNotification } from '@/hooks';

// Extendemos el tipo para manejar tipos de movimientos en el frontend si es necesario
interface MovimientoExt extends MovimientoTC {
  tipo?: 'COMPRA' | 'PAGO';
}

export const CreditCardsPage = () => {
  const notification = useNotification();
  // --- STATE ---
  // Consultas RTK Query
  const { currentUser } = useAuthContext();
  const {
    data: tarjetasData = [],
    isLoading: tarjetasLoading,
    refetch: refetchTarjetas
  } = useGetTarjetasQuery();
  const {
    data: movimientosData = [],
    isLoading: movimientosLoading,
    refetch: refetchMovimientos
  } = useGetMovimientosTCQuery();

  const [createCompraTC, { isLoading: creatingCompra }] = useCreateCompraTCMutation();
  const [createPagoTC, { isLoading: creatingPago }] = useCreatePagoTCMutation();
  const [createTarjeta, { isLoading: creatingTarjeta }] = useCreateTarjetaMutation();

  // Local copies for UI interactions
  const [tarjetas, setTarjetas] = useState<any[]>(tarjetasData);
  const [movimientos, setMovimientos] = useState<MovimientoExt[]>(
    movimientosData.map((m: any) => ({ ...m, tipo: m.tipo || 'COMPRA' }))
  );

  // Mantener sincronizados cuando llegan datos
  useEffect(() => {
    setTarjetas(tarjetasData);
  }, [tarjetasData]);
  useEffect(() => {
    setMovimientos(movimientosData.map((m: any) => ({ ...m, tipo: m.tipo || 'COMPRA' })));
  }, [movimientosData]);

  // Modals States
  const [isPurchaseOpen, setIsPurchaseOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isNewCardOpen, setIsNewCardOpen] = useState(false);
  // Confirmation modals for over-limit operations
  const [isConfirmOverLimitCompraOpen, setIsConfirmOverLimitCompraOpen] = useState(false);
  const [isConfirmOverPagoOpen, setIsConfirmOverPagoOpen] = useState(false);
  const [pendingCompraPayload, setPendingCompraPayload] = useState<any | null>(null);
  const [pendingPagoPayload, setPendingPagoPayload] = useState<any | null>(null);

  // Forms States
  const [formCompra, setFormCompra] = useState({
    tarjetaId: 1,
    fecha: new Date().toISOString().split('T')[0],
    descripcion: '',
    monto: '',
    cuotas: 1,
    referencia: '',
    categoria: 'General'
  });

  const [formPago, setFormPago] = useState({
    tarjetaId: 1,
    fecha: new Date().toISOString().split('T')[0],
    monto: '',
    referencia: '',
    bancoOrigen: 'Transferencia Bancaria'
  });

  const [formNuevaTarjeta, setFormNuevaTarjeta] = useState({
    alias: '',
    banco: '',
    franquicia: 'VISA',
    cupo: '',
    diaCorte: '15'
  });

  // --- KPI CALCULATIONS ---
  const deudaGlobal = useMemo(() => tarjetas.reduce((acc, t) => acc + t.deudaTotal, 0), [tarjetas]);
  const cupoGlobalDisponible = useMemo(
    () => tarjetas.reduce((acc, t) => acc + t.cupoDisponible, 0),
    [tarjetas]
  );

  // Datos para la IA
  const aiReportData = useMemo(() => {
    const cupoTotalGlobal = tarjetas.reduce((acc, t) => acc + t.cupoTotal, 0);
    const utilizacionPromedio =
      cupoTotalGlobal > 0 ? ((deudaGlobal / cupoTotalGlobal) * 100).toFixed(2) : 0;
    const comprasMes = movimientos
      .filter((m) => m.tipo === 'COMPRA')
      .reduce((sum, m) => sum + m.montoOriginal, 0);
    const pagosMes = movimientos
      .filter((m) => m.tipo === 'PAGO')
      .reduce((sum, m) => sum + m.montoOriginal, 0);

    return {
      report_type: 'credit_cards',
      tarjetas: tarjetas.map((t) => ({
        alias: t.alias,
        banco: t.banco,
        franquicia: t.franquicia,
        cupo_total: t.cupoTotal.toFixed(2),
        cupo_disponible: t.cupoDisponible.toFixed(2),
        deuda_actual: t.deudaTotal.toFixed(2),
        utilizacion: ((t.deudaTotal / t.cupoTotal) * 100).toFixed(2) + '%',
        dia_corte: t.diaCorte
      })),
      resumen: {
        total_tarjetas: tarjetas.length,
        deuda_total: deudaGlobal.toFixed(2),
        cupo_disponible: cupoGlobalDisponible.toFixed(2),
        cupo_total: cupoTotalGlobal.toFixed(2),
        utilizacion_promedio: utilizacionPromedio + '%',
        compras_periodo: comprasMes.toFixed(2),
        pagos_periodo: pagosMes.toFixed(2),
        flujo_neto: (pagosMes - comprasMes).toFixed(2)
      },
      alertas: [
        ...(parseFloat(utilizacionPromedio.toString()) > 70
          ? ['🚨 Utilización alta del crédito (>70%)']
          : []),
        ...tarjetas
          .filter((t) => t.cupoDisponible < t.cupoTotal * 0.2)
          .map(
            (t) =>
              `⚠️ ${t.alias}: Cupo bajo (${((t.cupoDisponible / t.cupoTotal) * 100).toFixed(0)}% disponible)`
          ),
        ...(deudaGlobal > cupoTotalGlobal * 0.8 ? ['⚠️ Deuda global cercana al límite'] : [])
      ]
    };
  }, [tarjetas, movimientos, deudaGlobal, cupoGlobalDisponible]);

  // --- HANDLERS ---

  // 1. REGISTRAR COMPRA

  const handleRegistrarCompra = async () => {
    const monto = parseFloat(formCompra.monto);
    const tarjetaId = Number(formCompra.tarjetaId);

    if (!monto || monto <= 0) {
      notification.error('Ingrese un monto válido');
      return;
    }
    if (!formCompra.descripcion) {
      notification.error('Ingrese una descripción');
      return;
    }

    const tarjetaObj = tarjetas.find((t: any) => t.id === tarjetaId);
    if (!tarjetaObj) {
      notification.error('Tarjeta seleccionada no existe');
      return;
    }
    if (monto > tarjetaObj.cupoDisponible) {
      // Open confirmation modal instead of immediate creation
      const payload = {
        tarjeta_id: tarjetaId,
        fecha: formCompra.fecha,
        descripcion: formCompra.descripcion,
        referencia: formCompra.referencia,
        cuotas: Number(formCompra.cuotas),
        monto: monto,
        categoria: formCompra.categoria,
        usuario_id: currentUser?.id
      };
      setPendingCompraPayload(payload);
      setIsConfirmOverLimitCompraOpen(true);
      return;
    }

    const payload = {
      tarjeta_id: tarjetaId,
      fecha: formCompra.fecha,
      descripcion: formCompra.descripcion,
      referencia: formCompra.referencia,
      cuotas: Number(formCompra.cuotas),
      monto: monto,
      categoria: formCompra.categoria,
      usuario_id: currentUser?.id
    };

    createCompraTC(payload)
      .unwrap()
      .then((res) => {
        refetchTarjetas();
        refetchMovimientos();
        setIsPurchaseOpen(false);
        setFormCompra({ ...formCompra, descripcion: '', monto: '', referencia: '', cuotas: 1 });
        notification.success('Compra registrada');
      })
      .catch((err) =>
        notification.error('Error registrando compra: ', err?.data?.detail || err.message || err)
      );
  };

  // 2. REGISTRAR PAGO
  const handlePagarTarjeta = () => {
    const monto = parseFloat(formPago.monto);
    const tarjetaId = Number(formPago.tarjetaId);

    if (!monto || monto <= 0) {
      notification.error('Ingrese un monto válido a pagar');
      return;
    }

    const tarjetaObjPago = tarjetas.find((t: any) => t.id === tarjetaId);
    if (!tarjetaObjPago) {
      notification.error('Tarjeta seleccionada no existe');
      return;
    }
    if (monto > tarjetaObjPago.deudaTotal) {
      // Open confirmation modal to allow overpayment (or user might want to record larger payment)
      const payloadPago = {
        tarjeta_id: tarjetaId,
        fecha: formPago.fecha,
        monto: monto,
        referencia: formPago.referencia,
        banco_origen: formPago.bancoOrigen,
        usuario_id: currentUser?.id
      };
      setPendingPagoPayload(payloadPago);
      setIsConfirmOverPagoOpen(true);
      return;
    }

    const payload = {
      tarjeta_id: tarjetaId,
      fecha: formPago.fecha,
      monto: monto,
      referencia: formPago.referencia,
      banco_origen: formPago.bancoOrigen,
      usuario_id: currentUser?.id
    };

    createPagoTC(payload)
      .unwrap()
      .then((res) => {
        refetchTarjetas();
        refetchMovimientos();
        setIsPaymentOpen(false);
        setFormPago({ ...formPago, monto: '', referencia: '' });
        notification.success('Pago registrado');
      })
      .catch((err) =>
        notification.error('Error registrando pago: ', err?.data?.detail || err.message || err)
      );
  };

  // 3. CREAR NUEVA TARJETA
  const handleCrearTarjeta = () => {
    if (!formNuevaTarjeta.alias || !formNuevaTarjeta.cupo) {
      notification.error('Complete los campos obligatorios');
      return;
    }
    const cupoNum = parseFloat(formNuevaTarjeta.cupo);
    if (isNaN(cupoNum) || cupoNum <= 0) {
      notification.error('Cupo debe ser un número mayor a 0');
      return;
    }
    const diaCorteNum = Number(formNuevaTarjeta.diaCorte);
    if (isNaN(diaCorteNum) || diaCorteNum < 1 || diaCorteNum > 31) {
      notification.error('Día de corte inválido');
      return;
    }

    const payload = {
      alias: formNuevaTarjeta.alias,
      banco: formNuevaTarjeta.banco,
      franquicia: formNuevaTarjeta.franquicia,
      cupo: cupoNum,
      dia_corte: diaCorteNum,
      usuario_id: currentUser?.id
    };

    createTarjeta(payload)
      .unwrap()
      .then((res) => {
        refetchTarjetas();
        setIsNewCardOpen(false);
        setFormNuevaTarjeta({ alias: '', banco: '', franquicia: 'VISA', cupo: '', diaCorte: '15' });
        notification.success('Tarjeta creada');
      })
      .catch((err) =>
        notification.error('Error creando tarjeta: ', err?.data?.detail || err.message || err)
      );
  };

  // --- UI HELPERS ---
  const getLogo = (f: string) => {
    if (f === 'VISA') return <span className="font-bold italic text-white text-xl">VISA</span>;
    if (f === 'MASTERCARD')
      return (
        <div className="flex -space-x-2">
          <div className="w-6 h-6 rounded-full bg-red-500 opacity-80"></div>
          <div className="w-6 h-6 rounded-full bg-yellow-500 opacity-80"></div>
        </div>
      );
    return <span className="font-bold text-blue-400">AMEX</span>;
  };

  // Confirm handlers
  const confirmPendingCompra = () => {
    if (!pendingCompraPayload) return;
    createCompraTC(pendingCompraPayload)
      .unwrap()
      .then((res) => {
        refetchTarjetas();
        refetchMovimientos();
        setIsConfirmOverLimitCompraOpen(false);
        setIsPurchaseOpen(false);
        setPendingCompraPayload(null);
        setFormCompra({ ...formCompra, descripcion: '', monto: '', referencia: '', cuotas: 1 });
        notification.success('Compra registrada (confirmada)');
      })
      .catch((err) => {
        notification.error('Error registrando compra: ', err?.data?.detail || err.message || err);
      });
  };

  const confirmPendingPago = () => {
    if (!pendingPagoPayload) return;
    createPagoTC(pendingPagoPayload)
      .unwrap()
      .then((res) => {
        refetchTarjetas();
        refetchMovimientos();
        setIsConfirmOverPagoOpen(false);
        setIsPaymentOpen(false);
        setPendingPagoPayload(null);
        setFormPago({ ...formPago, monto: '', referencia: '' });
        notification.success('Pago registrado (confirmado)');
      })
      .catch((err) => {
        notification.error('Error registrando pago: ', err?.data?.detail || err.message || err);
      });
  };

  return (
    <div className="container mx-auto p-6 space-y-8 animate-in fade-in duration-500 pb-20">
      {/* AI Chat */}
      <HorizonAiChat modules={[]} reportData={aiReportData} />

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tarjetas de Crédito Corporativas</h1>
          <p className="text-gray-500">Control de gastos, cupos y fechas de pago.</p>
        </div>
        <div className="flex gap-2">
          {/* MODAL NUEVA COMPRA */}
          <Dialog open={isPurchaseOpen} onOpenChange={setIsPurchaseOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
                <ShoppingBag className="w-4 h-4" /> Registrar Compra
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Registrar Consumo TC</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Seleccionar Tarjeta</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                    value={formCompra.tarjetaId}
                    onChange={(e) =>
                      setFormCompra({ ...formCompra, tarjetaId: Number(e.target.value) })
                    }
                  >
                    {tarjetas.map((t) => (
                      <option key={t.id} value={t.id}>
                        {`${t.alias} (${t.ultimos4}) - Disp: $${t.cupoDisponible.toLocaleString()}`}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Fecha Compra</Label>
                    <Input
                      type="date"
                      value={formCompra.fecha}
                      onChange={(e) => setFormCompra({ ...formCompra, fecha: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Monto Total</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                      <Input
                        className="pl-7"
                        type="number"
                        placeholder="0.00"
                        value={formCompra.monto}
                        onChange={(e) => setFormCompra({ ...formCompra, monto: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cuotas</Label>
                    <Input
                      type="number"
                      min="1"
                      max="48"
                      value={formCompra.cuotas}
                      onChange={(e) =>
                        setFormCompra({ ...formCompra, cuotas: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Categoría</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={formCompra.categoria}
                      onChange={(e) => setFormCompra({ ...formCompra, categoria: e.target.value })}
                    >
                      <option value="General">General</option>
                      <option value="Servicios">Servicios</option>
                      <option value="Viajes">Viajes</option>
                      <option value="Equipos">Equipos</option>
                      <option value="Alimentación">Alimentación</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Referencia / Voucher</Label>
                  <Input
                    placeholder="Fac-001"
                    value={formCompra.referencia}
                    onChange={(e) => setFormCompra({ ...formCompra, referencia: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descripción / Proveedor</Label>
                  <Input
                    placeholder="Ej: Cena de negocios, Amazon, Uber..."
                    value={formCompra.descripcion}
                    onChange={(e) => setFormCompra({ ...formCompra, descripcion: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsPurchaseOpen(false)}
                  disabled={creatingCompra}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleRegistrarCompra}
                  className="bg-indigo-600"
                  disabled={creatingCompra}
                >
                  {creatingCompra ? 'Guardando...' : 'Guardar Gasto'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* MODAL PAGAR TARJETA */}
          <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="gap-2 border-green-600 text-green-700 hover:bg-green-50 shadow-sm"
              >
                <DollarSign className="w-4 h-4" /> Pagar Tarjeta
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Abonar a Tarjeta de Crédito</DialogTitle>
                <DialogDescription>Registra el pago para liberar cupo.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Tarjeta a Pagar</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={formPago.tarjetaId}
                    onChange={(e) =>
                      setFormPago({ ...formPago, tarjetaId: Number(e.target.value) })
                    }
                  >
                    {tarjetas.map((t) => (
                      <option key={t.id} value={t.id}>
                        {`${t.alias} - Deuda Actual: $${t.deudaTotal.toLocaleString()}`}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Fecha Pago</Label>
                    <Input
                      type="date"
                      value={formPago.fecha}
                      onChange={(e) => setFormPago({ ...formPago, fecha: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Monto a Pagar</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                      <Input
                        className="pl-7"
                        type="number"
                        placeholder="0.00"
                        value={formPago.monto}
                        onChange={(e) => setFormPago({ ...formPago, monto: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Banco Origen / Forma de Pago</Label>
                  <Input
                    placeholder="Ej: Banco Pichincha Cta Cte"
                    value={formPago.bancoOrigen}
                    onChange={(e) => setFormPago({ ...formPago, bancoOrigen: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Comprobante</Label>
                  <Input
                    placeholder="Num transacción"
                    value={formPago.referencia}
                    onChange={(e) => setFormPago({ ...formPago, referencia: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsPaymentOpen(false)}
                  disabled={creatingPago}
                >
                  Cancelar
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={handlePagarTarjeta}
                  disabled={creatingPago}
                >
                  {creatingPago ? 'Procesando...' : 'Confirmar Pago'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPIS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-red-50 border-red-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Deuda Total Tarjetas</CardDescription>
            <CardTitle className="text-3xl text-red-700">${deudaGlobal.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-red-500 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Pasivo Corriente
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Cupo Disponible Global</CardDescription>
            <CardTitle className="text-3xl text-blue-700">
              ${cupoGlobalDisponible.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-blue-500 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Capacidad de compra
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription>Próximos Pagos</CardDescription>
            <CardTitle className="text-xl">5 y 15 de cada mes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-gray-500 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Mantente al día
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TABS */}
      <Tabs defaultValue="tarjetas" className="w-full">
        <TabsList>
          <TabsTrigger value="tarjetas">Mis Tarjetas</TabsTrigger>
          <TabsTrigger value="movimientos">Historial Movimientos</TabsTrigger>
        </TabsList>

        <TabsContent value="tarjetas" className="mt-6">
          {tarjetasLoading ? (
            <Card>
              <CardContent className="p-6 text-center text-gray-500">
                Cargando tarjetas...
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {tarjetas.map((card) => {
                const porcentajeUso =
                  card.cupoTotal > 0 ? (card.deudaTotal / card.cupoTotal) * 100 : 0;
                return (
                  <div key={card.id} className="space-y-3">
                    {/* Tarjeta Visual Estilo Crédito */}
                    <div
                      className={`relative h-56 w-full rounded-2xl p-6 text-white shadow-xl transition-transform hover:scale-[1.02] bg-gradient-to-br ${card.color}`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs font-medium opacity-80 uppercase tracking-widest">
                            {card.banco}
                          </p>
                          <p className="font-semibold text-lg tracking-wide">{card.alias}</p>
                        </div>
                        <div>{getLogo(card.franquicia)}</div>
                      </div>

                      <div className="mt-8 flex items-center gap-4">
                        <div className="w-12 h-8 bg-yellow-200/20 rounded border border-white/20 flex items-center justify-center">
                          <div className="w-8 h-5 border border-yellow-400/50 rounded-sm"></div>
                        </div>
                        <div className="font-mono text-xl tracking-widest text-white/90">
                          **** **** **** {card.ultimos4}
                        </div>
                      </div>

                      <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
                        <div>
                          <p className="text-[10px] uppercase opacity-70">Titular</p>
                          <p className="font-medium text-sm tracking-wide">HORIZON ERP S.A.</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] uppercase opacity-70">Expira</p>
                          <p className="font-medium text-sm">12/28</p>
                        </div>
                      </div>
                    </div>

                    {/* Info Detallada debajo de la tarjeta */}
                    <Card>
                      <CardContent className="pt-4 pb-4 space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Deuda Actual:</span>
                          <span className="font-bold text-red-600">
                            ${card.deudaTotal.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Disponible:</span>
                          <span className="font-bold text-green-600">
                            ${card.cupoDisponible.toLocaleString()}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-gray-400">
                            <span>Uso: {porcentajeUso.toFixed(1)}%</span>
                            <span>Cupo: ${card.cupoTotal.toLocaleString()}</span>
                          </div>
                          {/* Barra de Progreso Manual */}
                          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${porcentajeUso > 80 ? 'bg-red-500' : 'bg-blue-500'}`}
                              style={{ width: `${porcentajeUso}%` }}
                            ></div>
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-2 border-t text-xs">
                          <div className="flex items-center gap-1 text-gray-600 font-medium">
                            <Calendar className="w-3 h-3" /> Corte: {card.diaCorte} / Pago:{' '}
                            {card.diaPago}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs text-blue-600"
                            onClick={() => {
                              setFormPago({ ...formPago, tarjetaId: card.id });
                              setIsPaymentOpen(true);
                            }}
                          >
                            Pagar Ahora
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}

              {/* Card para Agregar Nueva */}
              <div
                className="h-56 w-full border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center text-gray-400 hover:bg-gray-50 hover:border-gray-400 cursor-pointer transition-colors"
                onClick={() => setIsNewCardOpen(true)}
              >
                <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-3 text-gray-500">
                  <Plus className="w-8 h-8" />
                </div>
                <span className="font-medium">Agregar Nueva Tarjeta</span>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="movimientos" className="mt-6">
          {movimientosLoading ? (
            <Card>
              <CardContent className="p-6 text-center text-gray-500">
                Cargando movimientos...
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="border-b bg-gray-50/50">
                <div className="flex justify-between items-center">
                  <CardTitle>Historial Completo</CardTitle>
                  <div className="flex items-center gap-2 border rounded px-3 py-1 bg-white">
                    <Search className="w-4 h-4 text-gray-400" />
                    <input type="text" placeholder="Buscar..." className="outline-none text-sm" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Tarjeta</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Cuotas</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movimientos.map((mov) => (
                      <TableRow key={mov.id}>
                        <TableCell className="font-medium text-xs text-gray-500">
                          {mov.fecha}
                        </TableCell>
                        <TableCell>
                          {mov.tipo === 'PAGO' ? (
                            <Badge
                              variant="outline"
                              className="bg-green-100 text-green-800 border-green-200"
                            >
                              ABONO
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-gray-100 text-gray-800">
                              COMPRA
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs font-medium">
                          {tarjetas.find((t) => t.id === mov.tarjetaId)?.alias}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">{mov.descripcion}</div>
                          <div className="text-[10px] text-gray-400">Ref: {mov.referencia}</div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
                            {mov.categoria}
                          </span>
                        </TableCell>
                        <TableCell>
                          {mov.tipo === 'COMPRA' && (
                            <span className="text-xs text-gray-500">
                              {mov.cuotas.actual}/{mov.cuotas.total}
                            </span>
                          )}
                        </TableCell>
                        <TableCell
                          className={`text-right font-bold ${mov.tipo === 'PAGO' ? 'text-green-600' : 'text-gray-900'}`}
                        >
                          {mov.tipo === 'PAGO' ? '+' : '-'}${mov.montoOriginal.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
      <Dialog open={isNewCardOpen} onOpenChange={setIsNewCardOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Tarjeta de Crédito</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Alias</Label>
              <Input
                placeholder="Ej: Visa Gerencia"
                value={formNuevaTarjeta.alias}
                onChange={(e) =>
                  setFormNuevaTarjeta({ ...formNuevaTarjeta, alias: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Banco</Label>
                <Input
                  placeholder="Banco..."
                  value={formNuevaTarjeta.banco}
                  onChange={(e) =>
                    setFormNuevaTarjeta({ ...formNuevaTarjeta, banco: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Franquicia</Label>
                <select
                  className="w-full border rounded p-2 text-sm bg-white"
                  value={formNuevaTarjeta.franquicia}
                  onChange={(e) =>
                    setFormNuevaTarjeta({ ...formNuevaTarjeta, franquicia: e.target.value })
                  }
                >
                  <option value="VISA">Visa</option>
                  <option value="MASTERCARD">Mastercard</option>
                  <option value="AMEX">Amex</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Cupo Total ($)</Label>
              <Input
                type="number"
                value={formNuevaTarjeta.cupo}
                onChange={(e) => setFormNuevaTarjeta({ ...formNuevaTarjeta, cupo: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Día de Corte</Label>
              <Input
                type="number"
                max="31"
                value={formNuevaTarjeta.diaCorte}
                onChange={(e) =>
                  setFormNuevaTarjeta({ ...formNuevaTarjeta, diaCorte: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCrearTarjeta} disabled={creatingTarjeta}>
              {creatingTarjeta ? 'Creando...' : 'Crear Tarjeta'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* CONFIRMACION: COMPRA EXCEDE CUPO */}
      <Dialog open={isConfirmOverLimitCompraOpen} onOpenChange={setIsConfirmOverLimitCompraOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar compra que excede cupo</DialogTitle>
            <DialogDescription>
              Esta compra excede el cupo disponible de la tarjeta seleccionada. ¿Deseas continuar y
              registrar la compra de todas formas?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="text-sm text-gray-700">
              Monto: ${' '}
              {pendingCompraPayload?.monto
                ? Number(pendingCompraPayload.monto).toLocaleString()
                : pendingCompraPayload?.monto}
            </div>
            <div className="text-sm text-gray-500">
              Tarjeta: {tarjetas.find((t: any) => t.id === pendingCompraPayload?.tarjeta_id)?.alias}
            </div>
            <div className="text-xs text-gray-400 mt-2">
              Este registro creará el asiento contable correspondiente y ajustará saldos.
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsConfirmOverLimitCompraOpen(false);
                setPendingCompraPayload(null);
              }}
              disabled={creatingCompra}
            >
              Cancelar
            </Button>
            <Button
              className="bg-indigo-600"
              onClick={confirmPendingCompra}
              disabled={creatingCompra}
            >
              {creatingCompra ? 'Guardando...' : 'Confirmar Compra'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CONFIRMACION: PAGO EXCEDE DEUDA */}
      <Dialog open={isConfirmOverPagoOpen} onOpenChange={setIsConfirmOverPagoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar pago mayor a la deuda</DialogTitle>
            <DialogDescription>
              El monto ingresado es mayor a la deuda actual de la tarjeta. ¿Deseas registrar este
              pago (puede generar saldo a favor)?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="text-sm text-gray-700">
              Monto pago: ${' '}
              {pendingPagoPayload?.monto
                ? Number(pendingPagoPayload.monto).toLocaleString()
                : pendingPagoPayload?.monto}
            </div>
            <div className="text-sm text-gray-500">
              Deuda actual: ${' '}
              {tarjetas.find((t: any) => t.id === pendingPagoPayload?.tarjeta_id)?.deudaTotal}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsConfirmOverPagoOpen(false);
                setPendingPagoPayload(null);
              }}
              disabled={creatingPago}
            >
              Cancelar
            </Button>
            <Button className="bg-green-600" onClick={confirmPendingPago} disabled={creatingPago}>
              {creatingPago ? 'Procesando...' : 'Confirmar Pago'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreditCardsPage;

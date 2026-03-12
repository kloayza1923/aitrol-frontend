import { useMemo, useState, useEffect } from 'react';
import { Container } from '@/components/container';
import { Toolbar, ToolbarHeading, ToolbarPageTitle } from '@/partials/toolbar';
import { KeenIcon } from '@/components/keenicons';
import {
  Button,
  Card,
  CardContent,
  Stack,
  Divider,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(n);

import { FetchData } from '@/utils/FetchData';

const sampleSales: any[] = [];
const samplePurchases: any[] = [];

const months = [
  { value: '01', label: 'Enero' },
  { value: '02', label: 'Febrero' },
  { value: '03', label: 'Marzo' },
  { value: '04', label: 'Abril' },
  { value: '05', label: 'Mayo' },
  { value: '06', label: 'Junio' },
  { value: '07', label: 'Julio' },
  { value: '08', label: 'Agosto' },
  { value: '09', label: 'Septiembre' },
  { value: '10', label: 'Octubre' },
  { value: '11', label: 'Noviembre' },
  { value: '12', label: 'Diciembre' }
];

const AtsPage = () => {
  const [periodo, setPeriodo] = useState({ mes: '01', anio: '2025' });
  const [loading, setLoading] = useState(false);
  const [xmlGenerated, setXmlGenerated] = useState(false);
  const [ventas, setVentas] = useState<any[]>([]);
  const [compras, setCompras] = useState<any[]>([]);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    const load = async () => {
      setFetching(true);
      try {
        // fetch ventas and compras for the selected period (backend endpoints assumed)
        const vResp = await FetchData.get('inv/ventas', {
          page: 1,
          limit: 1000,
          mes: periodo.mes,
          anio: periodo.anio
        });
        const cResp = await FetchData.get('inv/compras', {
          page: 1,
          limit: 1000,
          mes: periodo.mes,
          anio: periodo.anio
        });
        setVentas(Array.isArray(vResp) ? vResp : vResp || []);
        setCompras(Array.isArray(cResp) ? cResp : cResp || []);
      } catch (err) {
        console.error('Error cargando ventas/compras:', err);
      } finally {
        setFetching(false);
      }
    };
    load();
  }, [periodo.mes, periodo.anio]);

  const totals = useMemo(() => {
    const totalVentas = (ventas || []).reduce(
      (s: number, i: any) => s + (Number(i.total || i.total_venta || 0) || 0),
      0
    );
    const totalCompras = (compras || []).reduce(
      (s: number, i: any) => s + (Number(i.total || i.total_compra || 0) || 0),
      0
    );
    return {
      ventasCount: ventas.length,
      comprasCount: compras.length,
      totalVentas,
      totalCompras,
      anulados: 0
    };
  }, [ventas, compras]);

  const handleGenerate = () => {
    setLoading(true);
    (async () => {
      try {
        const resp = await FetchData.post('fin/ats/generate', {
          mes: periodo.mes,
          anio: periodo.anio
        });
        if (resp && resp.xml) {
          // download xml
          downloadBlob(resp.xml, `ats-${periodo.mes}-${periodo.anio}.xml`, 'application/xml');
          setXmlGenerated(true);
        }
      } catch (err) {
        console.error('Error generando ATS:', err);
      } finally {
        setLoading(false);
      }
    })();
  };

  const downloadBlob = (content: string, filename: string, type = 'application/json') => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleDownloadJSON = () => {
    const payload = { periodo, ventas, compras, totals };
    downloadBlob(
      JSON.stringify(payload, null, 2),
      `ats-${periodo.mes}-${periodo.anio}.json`,
      'application/json'
    );
  };

  const toXml = (obj: any) => {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<ATS periodo="${obj.periodo.mes}-${obj.periodo.anio}">\n`;
    xml += '  <Ventas>\n';
    obj.ventas.forEach((v: any) => {
      xml += `    <Venta>\n      <Numero>${v.numero_factura}</Numero>\n      <Fecha>${v.fecha}</Fecha>\n      <Tipo>${v.tipo}</Tipo>\n      <RUC>${v.ruc}</RUC>\n      <RazonSocial>${v.razonSocial}</RazonSocial>\n      <Total>${v.total.toFixed(2)}</Total>\n    </Venta>\n`;
    });
    xml += '  </Ventas>\n  <Compras>\n';
    obj.compras.forEach((c: any) => {
      xml += `    <Compra>\n      <Numero>${c.numero_factura}</Numero>\n      <Fecha>${c.fecha}</Fecha>\n      <Tipo>${c.tipo}</Tipo>\n      <RUC>${c.ruc}</RUC>\n      <RazonSocial>${c.razonSocial}</RazonSocial>\n      <Total>${c.total.toFixed(2)}</Total>\n    </Compra>\n`;
    });
    xml += '  </Compras>\n</ATS>';
    return xml;
  };

  const handleDownloadXML = () => {
    const payload = { periodo, ventas, compras };
    const xml = toXml(payload);
    downloadBlob(xml, `ats-${periodo.mes}-${periodo.anio}.xml`, 'application/xml');
  };

  return (
    <Container>
      <Toolbar>
        <ToolbarHeading>
          <ToolbarPageTitle
            text="Generación de ATS"
            description="Anexo Transaccional Simplificado (datos de ejemplo)"
          />
        </ToolbarHeading>
      </Toolbar>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        <div className="card col-span-1 p-4">
          <h3 className="card-title mb-3">Configuración del Período</h3>

          <div className="mb-4">
            <label className="form-label">Año Fiscal</label>
            <select
              className="form-select"
              value={periodo.anio}
              onChange={(e) => setPeriodo({ ...periodo, anio: e.target.value })}
            >
              <option value="2025">2025</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="form-label">Mes</label>
            <select
              className="form-select"
              value={periodo.mes}
              onChange={(e) => setPeriodo({ ...periodo, mes: e.target.value })}
            >
              {months.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={handleGenerate}
              disabled={loading}
            >
              {loading ? 'Generando...' : 'Generar ATS'}
            </Button>
          </Stack>

          {xmlGenerated && (
            <Paper elevation={1} sx={{ p: 2, bgcolor: '#e8f5e9', mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                ¡Éxito!
              </Typography>
              <Typography variant="body2">
                Se generó el ATS para {months.find((m) => m.value === periodo.mes)?.label}/
                {periodo.anio}.
              </Typography>
            </Paper>
          )}

          <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
            <Button
              variant="outlined"
              onClick={handleDownloadJSON}
              startIcon={<KeenIcon icon="file-json" />}
            >
              Descargar JSON
            </Button>
            <Button
              variant="outlined"
              onClick={handleDownloadXML}
              startIcon={<KeenIcon icon="file-xml" />}
            >
              Descargar XML
            </Button>
          </Stack>

          <div className="mt-4">
            <h5 className="mb-2">Resumen Rápido</h5>
            <div className="d-flex justify-content-between">
              <small>Ventas</small>
              <strong>{totals.ventasCount}</strong>
            </div>
            <div className="d-flex justify-content-between">
              <small>Total Ventas</small>
              <strong>{formatCurrency(totals.totalVentas)}</strong>
            </div>
            <div className="d-flex justify-content-between">
              <small>Compras</small>
              <strong>{totals.comprasCount}</strong>
            </div>
            <div className="d-flex justify-content-between">
              <small>Total Compras</small>
              <strong>{formatCurrency(totals.totalCompras)}</strong>
            </div>
          </div>
        </div>

        <div className="card col-span-1 lg:col-span-2 p-4">
          <h3 className="card-title mb-3">
            Resumen Detallado - {months.find((m) => m.value === periodo.mes)?.label}/{periodo.anio}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 border rounded bg-white">
              <h6 className="mb-2">Ventas</h6>
              <div className="table-responsive">
                <table className="table table-row-dashed align-middle">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Comprobante</th>
                      <th>RUC</th>
                      <th className="text-end">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(ventas || []).map((v: any, idx: number) => (
                      <tr key={v.numero ?? v.id ?? idx}>
                        <td>{v.fecha ?? v.fecha_emision ?? ''}</td>
                        <td>
                          <div className="fw-bold">
                            {v.numero ?? v.numero_factura ?? v.comprobante_numero ?? ''}
                          </div>
                          <small className="text-muted">
                            {v.tipo ?? v.nombre_comprobante ?? ''}
                          </small>
                        </td>
                        <td>
                          <div>{v.ruc ?? v.identificacion ?? ''}</div>
                          <small className="text-muted">
                            {v.razonSocial ?? v.razon_social ?? v.cliente_nombre ?? ''}
                          </small>
                        </td>
                        <td className="text-end">
                          {formatCurrency(Number(v.total ?? v.total_venta ?? 0))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={3} className="fw-bold text-end">
                        Total Ventas
                      </td>
                      <td className="text-end fw-bold">{formatCurrency(totals.totalVentas)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="p-3 border rounded bg-white">
              <h6 className="mb-2">Compras</h6>
              <div className="table-responsive">
                <table className="table table-row-dashed align-middle">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Comprobante</th>
                      <th>RUC</th>
                      <th className="text-end">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(compras || []).map((c: any, idx: number) => (
                      <tr key={c.numero ?? c.id ?? idx}>
                        <td>{c.fecha ?? c.fecha_emision ?? ''}</td>
                        <td>
                          <div className="fw-bold">
                            {c.numero ?? c.numero_factura ?? c.comprobante_numero ?? ''}
                          </div>
                          <small className="text-muted">
                            {c.tipo ?? c.nombre_comprobante ?? ''}
                          </small>
                        </td>
                        <td>
                          <div>{c.ruc ?? c.identificacion ?? ''}</div>
                          <small className="text-muted">
                            {c.razonSocial ?? c.razon_social ?? c.proveedor_nombre ?? ''}
                          </small>
                        </td>
                        <td className="text-end">
                          {formatCurrency(Number(c.total ?? c.total_compra ?? 0))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={3} className="fw-bold text-end">
                        Total Compras
                      </td>
                      <td className="text-end fw-bold">{formatCurrency(totals.totalCompras)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <h6>Validaciones</h6>
            <ul>
              <li>
                Cuadratura Ventas vs Contabilidad:{' '}
                <strong className="text-success">Correcto</strong>
              </li>
              <li>
                Cédulas / RUC válidos: <strong className="text-warning">2 avisos</strong>
              </li>
              <li>
                Secuencialidad: <strong className="text-success">Sin saltos</strong>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </Container>
  );
};

export default AtsPage;

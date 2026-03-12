import { Container } from '@/components/container';
import { useEffect, useState, useMemo } from 'react';
import { FetchData } from '@/utils/FetchData';
import { Button } from '@mui/material';
import { useParams } from 'react-router-dom';
import { DataGrid, GridColDef, GridEventListener } from '@mui/x-data-grid';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toAbsoluteUrl } from '@/utils/Assets';

const RolesPagoEdit = () => {
  const { id } = useParams();
  const [rol, setRol] = useState<any>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const loadRol = async () => {
    setLoading(true);
    const data = await FetchData(`/rrhh/roles_pago/${id}`);
    setRol(data);
    setRows(
      data.detalles.map((d: any, idx: number) => ({
        id: idx + 1, // ID único para DataGrid
        ...d
      }))
    );
    setLoading(false);
    // Recalcular los campos derivados para cada fila
    setRows((prevRows) => prevRows.map((row) => recalcRow(row)));
    console.log('Rol cargado:', data);
  };

  // Recalcular campos derivados
  const recalcRow = (row: any) => {
    console.log('Recalculating row:', row);
    const ingresos =
      (row.sueldo_basico || 0) +
      (row.horas_extras || 0) +
      (row.bonificaciones || 0) +
      (row.comisiones || 0) +
      (row.decimo_tercero || 0) +
      (row.decimo_cuarto || 0) +
      (row.fondos_reserva || 0) +
      (row.vacaciones || 0);

    const descuentos =
      (row.prestamos || 0) +
      (row.multas || 0) +
      (row.iess_personal || 0) +
      (row.otros_descuentos || 0);

    return {
      ...row,
      total_ingresos: ingresos,
      total_descuentos: descuentos,
      neto_a_pagar: ingresos - descuentos
    };
  };
  const saveChanges = async () => {
    try {
      console.log('Guardando cambios:', rows);
      const body = {
        detalles: rows
      };
      await FetchData(`/rrhh/roles_pago/${id}/detalles`, 'PUT', body);
      toast.success('Cambios guardados correctamente');
      loadRol();
    } catch (error) {
      console.error('Error al guardar cambios:', error);
      toast.error('Error al guardar cambios');
    }
  };
  const exportToPDF = () => {
    if (!rows || rows.length === 0) {
      toast.error('No hay datos para exportar');
      return;
    }

    // landscape + tamaño A4
    const doc = new jsPDF('landscape', 'pt', 'a3');

    const logo = toAbsoluteUrl('/media/app/logo.png');
    doc.addImage(logo, 'PNG', 20, 20, 40, 40);

    doc.setFontSize(16);
    doc.text('Rol de Pago', 80, 40);

    if (rol?.cabecera) {
      doc.setFontSize(12);
      doc.text(
        `Periodo: ${rol.cabecera.mes_correspondiente}/${rol.cabecera.anio_correspondiente}`,
        80,
        60
      );
    }

    doc.setFontSize(10);
    doc.text(`Generado: ${new Date().toLocaleString()}`, 80, 80);

    const headers = columns.map((col) => col.headerName || col.field);
    const data = rows.map((row) => columns.map((col) => row[col.field as keyof typeof row] ?? ''));

    autoTable(doc, {
      startY: 100,
      head: [headers],
      body: data,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { left: 20, right: 20 },
      tableWidth: 'auto'
    });

    doc.save(`rol_pago_${id}.pdf`);
  };

  useEffect(() => {
    loadRol();
  }, []);

  const columns: GridColDef[] = [
    { field: 'empleado_id', headerName: 'Empleado ID', width: 100 },
    { field: 'empleado_nombre', headerName: 'Empleado', width: 200, editable: false },
    {
      field: 'sueldo_basico',
      headerName: 'Sueldo Básico',
      width: 120,
      editable: false,
      type: 'number'
    },
    {
      field: 'horas_extras',
      headerName: 'Horas Extras',
      width: 120,
      editable: true,
      type: 'number'
    },
    {
      field: 'bonificaciones',
      headerName: 'Bonificaciones',
      width: 130,
      editable: true,
      type: 'number'
    },
    { field: 'comisiones', headerName: 'Comisiones', width: 120, editable: true, type: 'number' },
    {
      field: 'decimo_tercero',
      headerName: 'Décimo Tercero',
      width: 140,
      editable: true,
      type: 'number'
    },
    {
      field: 'decimo_cuarto',
      headerName: 'Décimo Cuarto',
      width: 140,
      editable: true,
      type: 'number'
    },
    {
      field: 'fondos_reserva',
      headerName: 'Fondos Reserva',
      width: 140,
      editable: true,
      type: 'number'
    },
    { field: 'vacaciones', headerName: 'Vacaciones', width: 120, editable: true, type: 'number' },
    { field: 'prestamos', headerName: 'Préstamos', width: 120, editable: true, type: 'number' },
    { field: 'multas', headerName: 'Multas', width: 100, editable: true, type: 'number' },
    {
      field: 'iess_personal',
      headerName: 'IESS Personal',
      width: 130,
      editable: false,
      type: 'number'
    },
    {
      field: 'p_hipotecario',
      headerName: 'P. Hipotecario',
      width: 130,
      editable: false,
      type: 'number'
    },
    {
      field: 'p_quirografario',
      headerName: 'P. Quirografario',
      width: 130,
      editable: false,
      type: 'number'
    },
    {
      field: 'seguro_priv',
      headerName: 'Seguro Priv.',
      width: 120,
      editable: false,
      type: 'number'
    },
    {
      field: 'otros_descuentos',
      headerName: 'Otros Desc.',
      width: 120,
      editable: true,
      type: 'number'
    },
    { field: 'total_ingresos', headerName: 'Total Ingresos', width: 130, type: 'number' },
    { field: 'total_descuentos', headerName: 'Total Desc.', width: 130, type: 'number' },
    { field: 'neto_a_pagar', headerName: 'Neto a Pagar', width: 130, type: 'number' }
  ];
  const exportToExcel = () => {
    // Convierte los datos a hoja de trabajo
    const worksheet = XLSX.utils.json_to_sheet(rows);

    // Crea un nuevo libro
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Rol de Pago');

    // Genera y descarga el archivo
    XLSX.writeFile(workbook, `rol_pago_${id}.xlsx`);
  };

  // Calcular totales de todas las filas
  /*   const totals = useMemo(() => {
    console.log('Calculando totales...');
    return columns.reduce((acc, col) => {
      if (col.type === 'number') {
        acc[col.field] = rows.reduce((sum, row) => sum + (Number(row[col.field]) || 0), 0);
      }
      return acc;
    }, {} as Record<string, number>);
  }, [rows]);
 */
  return (
    <Container>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold">Editar Rol de Pago</h1>
          <h2 className="text-xl font-bold">
            Rol de Pago - {rol?.cabecera?.mes_correspondiente}/{rol?.cabecera?.anio_correspondiente}
          </h2>
        </div>

        {/* Contenedor de botones */}
        <div className="flex gap-2 flex-wrap sm:flex-nowrap justify-end sm:justify-start sm:w-auto">
          <Button variant="outlined" color="secondary" onClick={() => window.history.back()}>
            Volver
          </Button>
          <Button variant="contained" color="primary" onClick={saveChanges}>
            Guardar Cambios
          </Button>
          <Button variant="outlined" color="success" onClick={exportToExcel}>
            Exportar a Excel
          </Button>
          <Button variant="outlined" color="error" onClick={exportToPDF}>
            Exportar a PDF
          </Button>
        </div>
      </div>

      <div style={{ width: '100%', overflowX: 'auto', marginBottom: 20 }}>
        <div style={{ height: 600, maxWidth: '95vw', overflowX: 'auto' }}>
          {/* DataGrid para mostrar los detalles del rol de pago */}
          <DataGrid
            rows={rows}
            columns={columns}
            loading={loading}
            processRowUpdate={(newRow) => {
              const updatedRow = recalcRow(newRow);
              setRows((prev) => prev.map((row) => (row.id === newRow.id ? updatedRow : row)));
              return updatedRow;
            }}
            sx={{
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: '#f4f4f4'
              }
            }}
          />
        </div>
      </div>

      {/* Totales */}
      {/*       <div style={{ marginTop: 10, padding: '8px', background: '#f8f9fa', borderRadius: 4 }}>
        <strong>Totales:</strong>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns.length}, 1fr)` }}>
          {columns.map((col) => (
            <div key={col.field} style={{ textAlign: 'right', padding: '0 5px' }}>
              {col.type === 'number' ? totals[col.field]?.toFixed(2) : ''}
            </div>
          ))}
        </div>
      </div> */}
    </Container>
  );
};

export default RolesPagoEdit;

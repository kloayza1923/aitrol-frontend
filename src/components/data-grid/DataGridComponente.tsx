import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  IconButton,
  ButtonGroup,
  Tooltip,
  Box,
  Drawer,
  Typography,
  Slide,
  AppBar,
  CircularProgress,
  Toolbar
} from '@mui/material';
import { DataGrid, GridCloseIcon, GridColDef } from '@mui/x-data-grid';
import { useNotification } from '@/hooks/useNotification';
import {
  useGetEntityListQuery,
  useLazyGetEntityByIdQuery,
  useCreateEntityMutation,
  useUpdateEntityMutation,
  useDeleteEntityMutation
} from '@/store/api/crudSlice';
import { ConfirmDialog } from './ConfirmDialog'; // ajusta la ruta
import * as XLSX from 'xlsx';
import { RefreshCcw } from 'lucide-react';
type CrudMode = 'crud' | 'table' | 'redirect';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toAbsoluteUrl } from '@/utils/Assets';
import * as Yup from 'yup';
import ApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import {
  BarChart,
  DeleteOutline,
  EditNote,
  PanoramaFishEye,
  Add,
  Search,
  PictureAsPdf,
  TableChart
} from '@mui/icons-material';
import { TransitionProps } from 'notistack';
type NumericFieldConfig<T> = {
  field: keyof T;
  type: 'line' | 'column' | 'area'; // Tipo de gráfico
};
type CrudDataGridProps<T> = {
  title: string;
  endpoint: string;
  columns: GridColDef[];
  defaultFormValues?: T;
  renderForm?: (
    formValues: T,
    handleChange: (
      e:
        | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
        | React.ChangeEvent<{ value: unknown }>
    ) => void,
    setFormValues: React.Dispatch<React.SetStateAction<T>>,
    errors: Partial<Record<keyof T, string>> // 👈 pasamos errores al formulario
  ) => React.ReactNode;
  mode?: CrudMode;
  onCreateClick?: () => void;
  onEditClick?: (row: T) => void;
  showDelete?: boolean;
  showEdit?: boolean;
  exportToExcel?: boolean;
  params?: Record<string, any>;
  hasFile?: boolean;
  showDetails?: boolean;
  onShowDetails?: (row: T) => void;
  handleSearch?: boolean;
  schema?: Yup.ObjectSchema<any>;
  buttons?: (row: T) => React.ReactNode;
  numericFields?: NumericFieldConfig<T>[];
};
const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<unknown>;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export function CrudDataGrid<T extends { id?: number }>({
  title,
  endpoint,
  columns,
  defaultFormValues,
  renderForm,
  mode = 'crud',
  onCreateClick,
  onEditClick,
  showDelete = true,
  showEdit = true,
  exportToExcel = false,
  params,
  hasFile = false,
  showDetails = false,
  onShowDetails,
  schema,
  buttons,
  numericFields = []
}: CrudDataGridProps<T>) {
  // Hook de notificaciones
  const notification = useNotification();

  // Estado del formulario
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [formValues, setFormValues] = useState<T>(defaultFormValues || ({} as T));
  const [formLoading, setFormLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});

  // Estado para gráficos
  const [chartSeries, setChartSeries] = useState<any[]>([]);
  const [chartOptions, setChartOptions] = useState<ApexOptions>({});
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Estado para paginación y búsqueda
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');

  // Redux RTK Query hooks - usando query automático con cache
  const queryParams = {
    page: page + 1, // API usa base 1
    limit: pageSize,
    search,
    ...(params || {})
  };

  const {
    data: listData,
    isLoading: listLoading,
    isFetching,
    refetch
  } = useGetEntityListQuery({
    endpoint,
    params: queryParams
  });

  const [triggerGetById, { isLoading: detailLoading }] = useLazyGetEntityByIdQuery();
  const [createEntity, { isLoading: createLoading }] = useCreateEntityMutation();
  const [updateEntity, { isLoading: updateLoading }] = useUpdateEntityMutation();
  const [deleteEntity, { isLoading: deleteLoading }] = useDeleteEntityMutation();

  // Datos derivados
  const rows = listData?.data || listData?.items || [];
  const totalRows = listData?.total || 0;
  const loading = listLoading || isFetching;

  // Función para manejar la búsqueda con debounce
  const handleSearchChange = (newSearch: string) => {
    setSearch(newSearch);
    // El efecto se encargará de recargar los datos
  };

  // Función para actualizar gráficos cuando cambian los datos
  const updateCharts = (rowsData: any[]) => {
    if (rowsData.length && numericFields.length) {
      const categories = rowsData.map((r: any) => r[columns[1].field] ?? `Item ${r.id}`);
      const series = numericFields.map((nf) => ({
        name: String(nf.field),
        type: nf.type,
        data: rowsData.map((r: any) => r[nf.field] ?? 0)
      }));

      setChartSeries(series);
      setChartOptions({
        chart: { type: 'line', stacked: false, height: 350 },
        stroke: { width: series.map((s) => (s.type === 'line' ? 2 : 0)) },
        xaxis: { categories },
        yaxis: { title: { text: 'Valores' } },
        tooltip: { shared: true, intersect: false },
        plotOptions: { bar: { columnWidth: '50%' } },
        dataLabels: { enabled: false }
      });
    } else {
      setChartSeries([]);
      setChartOptions({});
    }
  };

  const loadDetail = async (id: number) => {
    try {
      const data = await triggerGetById({ endpoint, id }).unwrap();
      return data;
    } catch (error) {
      console.error('Error cargando detalle:', error);
      notification.error('Error cargando detalle');
      throw error;
    }
  };

  const handleCreate = async (data: any) => {
    try {
      let payload = data;

      // Solo convertir a FormData si hasFile=true Y realmente hay archivos
      if (hasFile) {
        const hasActualFiles = Object.values(data).some((value) => value instanceof File);

        if (hasActualFiles) {
          const formData = new FormData();
          Object.keys(data).forEach((key) => {
            const value = data[key];
            if (value instanceof File) {
              formData.append(key, value);
            } else if (value !== undefined) {
              // Incluir todos los valores excepto undefined, incluso 0, null, false
              formData.append(key, value === null ? '' : String(value));
            }
          });
          payload = formData;
        }
      }

      const result = await createEntity({ endpoint, data: payload }).unwrap();
      if (result.mensaje || result.message || result.id) {
        notification.success('Registro creado');
        setShowModal(false);
        setSelectedId(null);
        // RTK Query invalidará automáticamente el cache
      }
      return result;
    } catch (error: any) {
      console.error('Error creando:', error);
      notification.error(error.data?.detail || 'Error creando registro');
      throw error;
    }
  };

  const handleUpdate = async (id: number, data: any) => {
    try {
      let payload = data;

      // Solo convertir a FormData si hasFile=true Y realmente hay archivos
      if (hasFile) {
        const hasActualFiles = Object.values(data).some((value) => value instanceof File);

        if (hasActualFiles) {
          const formData = new FormData();
          Object.keys(data).forEach((key) => {
            const value = data[key];
            if (value instanceof File) {
              formData.append(key, value);
            } else if (value !== undefined) {
              // Incluir todos los valores excepto undefined, incluso 0, null, false
              formData.append(key, value === null ? '' : String(value));
            }
          });
          payload = formData;
        }
      }

      const result = await updateEntity({ endpoint, id, data: payload }).unwrap();
      if (result.mensaje || result.message || result.id) {
        notification.success('Registro actualizado');
        setShowModal(false);
        setSelectedId(null);
        // RTK Query invalidará automáticamente el cache
      }
      return result;
    } catch (error: any) {
      console.error('Error actualizando:', error);
      notification.error(error.data?.detail || 'Error actualizando registro');
      throw error;
    }
  };

  // El query se ejecuta automáticamente cuando cambian los parámetros

  useEffect(() => {
    if (rows.length > 0) {
      updateCharts(rows);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

  useEffect(() => {
    if (mode === 'crud' && selectedId !== null) {
      setIsNew(false);
      setFormLoading(true);
      loadDetail(selectedId)
        .then((data) => {
          setFormValues(data);
          setShowModal(true);
        })
        .catch((error) => {
          console.error('Error loading detail:', error);
        })
        .finally(() => {
          setFormLoading(false);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, mode]);

  const handleChange = (e: any) => {
    const { name, value, files, type } = e.target as HTMLInputElement;
    if (type === 'file') {
      // Si es input file, guardar archivo(s)
      if (files && files.length > 0) {
        setFormValues((prev) => ({
          ...prev,
          [name]: files.length === 1 ? files[0] : Array.from(files)
        }));
      }
    } else {
      setFormValues((prev) => ({ ...prev, [name]: value }));
    }
  };

  useEffect(() => {
    if (!schema) return;
    schema
      .validate(formValues, { abortEarly: false })
      .then(() => setErrors({}))
      .catch((validationError: any) => {
        const newErrors: Partial<Record<keyof T, string>> = {};
        validationError.inner.forEach((err: any) => {
          newErrors[err.path as keyof T] = err.message;
        });
        setErrors(newErrors);
      });
  }, [formValues, schema]);

  const handleSave = async () => {
    if (mode !== 'crud') return;

    // Validar con Yup si hay schema
    if (schema) {
      try {
        await schema.validate(formValues, { abortEarly: false });
        setErrors({});
      } catch (validationError: any) {
        const newErrors: Partial<Record<keyof T, string>> = {};
        if (validationError.inner) {
          validationError.inner.forEach((err: any) => {
            newErrors[err.path as keyof T] = err.message;
          });
        }
        setErrors(newErrors);
        notification.error('Revisa los campos del formulario');
        return;
      }
    }

    setFormLoading(true);
    try {
      if (isNew) {
        await handleCreate(formValues);
      } else {
        const idToUpdate = selectedId ?? (formValues as any)?.id;
        if (idToUpdate) {
          await handleUpdate(idToUpdate, formValues);
        } else {
          notification.error('No se encontró el id del registro para actualizar');
        }
      }
    } catch (error) {
      console.error('Error in handleSave:', error);
    } finally {
      setFormLoading(false);
    }
  };
  const exportToPDF = () => {
    const doc = new jsPDF();
    console.log('Exportando a PDF:', rows);

    const generatePDF = (includeImage: boolean = false) => {
      let startY = 50;

      if (includeImage) {
        doc.setFontSize(16);
        doc.text(title, 50, 20);
        doc.setFontSize(10);
        doc.text(`Generado: ${new Date().toLocaleString()}`, 50, 28);
      } else {
        // Sin imagen, ajustar posición
        doc.setFontSize(16);
        doc.text(title, 10, 20);
        doc.setFontSize(10);
        doc.text(`Generado: ${new Date().toLocaleString()}`, 10, 28);
        startY = 40;
      }

      // Datos para tabla
      const headers = columns.map((col) => col.headerName || col.field);
      const data = rows.map((row: any) =>
        columns.map((col) => row[col.field as keyof typeof row] ?? '')
      );

      console.log('Datos para PDF:', data);
      autoTable(doc, {
        startY: startY,
        head: [headers],
        body: data,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255] },
        alternateRowStyles: { fillColor: [245, 245, 245] }
      });

      doc.save(`${title}.pdf`);
    };

    // Intentar cargar logo
    const img = new Image();
    img.src = toAbsoluteUrl('/media/app/isologo.png');

    img.onload = () => {
      doc.addImage(img, 'PNG', 10, 10, 30, 30);
      generatePDF(true);
    };

    img.onerror = () => {
      console.warn('No se pudo cargar el logo, generando PDF sin imagen');
      generatePDF(false);
    };

    // Timeout de seguridad por si la imagen tarda mucho
    setTimeout(() => {
      if (!img.complete) {
        console.warn('Timeout cargando logo, generando PDF sin imagen');
        generatePDF(false);
      }
    }, 3000);
  };

  // Estado para las acciones por fila
  const [loadingRowId, setLoadingRowId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  // Handlers de acciones
  const handleEditRow = async (rowId: number, event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    event.preventDefault();

    if (loadingRowId === rowId) return; // Prevent double click

    setLoadingRowId(rowId);
    setIsNew(false);
    setSelectedId(rowId);
    setFormLoading(true);

    try {
      const data = await loadDetail(rowId);
      setFormValues(data);
      setShowModal(true);
    } catch (err) {
      console.error('Error loading detail:', err);
      notification.error('Error cargando detalle');
    } finally {
      setFormLoading(false);
      setLoadingRowId(null);
    }
  };

  const handleShowDetailsRow = (row: T, event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    onShowDetails && onShowDetails(row);
  };

  const handleDeleteRow = (rowId: number, event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setConfirmDeleteId(rowId);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteId) return;
    const idToDelete = confirmDeleteId;
    setConfirmDeleteId(null);

    try {
      await deleteEntity({ endpoint, id: idToDelete }).unwrap();
      notification.success('Registro eliminado');
    } catch (err: any) {
      console.error('Error deleting row:', err);
      notification.error(err.data?.detail || 'Error eliminando registro');
    }
  };

  const handleRedirectEditRow = (row: T, event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    onEditClick && onEditClick(row);
  };

  const fullColumns: GridColDef[] = [...columns];
  showEdit &&
    fullColumns.push({
      field: 'acciones',
      headerName: 'Acciones',
      sortable: false,
      flex: 1,
      minWidth: showDetails ? 300 : 200,
      renderCell: (params) => {
        const row = params.row;
        const isLoading = loadingRowId === row.id;

        return (
          <Box
            sx={{
              display: 'flex',
              gap: 0.5,
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {(mode === 'crud' || mode === 'table') && (
              <>
                <Tooltip title="Editar" arrow>
                  <IconButton
                    size="small"
                    onClick={(e) => handleEditRow(row.id, e)}
                    disabled={isLoading}
                    sx={{
                      color: isLoading ? 'action.disabled' : 'primary.main',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        color: 'primary.dark',
                        bgcolor: 'primary.lighter',
                        transform: 'scale(1.1) rotate(5deg)',
                        boxShadow: 2
                      },
                      '&:active': {
                        transform: 'scale(0.95)'
                      },
                      '&.Mui-disabled': {
                        color: 'action.disabled'
                      }
                    }}
                  >
                    <EditNote
                      fontSize="small"
                      sx={{
                        animation: isLoading ? 'spin 1s linear infinite' : 'none',
                        '@keyframes spin': {
                          '0%': { transform: 'rotate(0deg)' },
                          '100%': { transform: 'rotate(360deg)' }
                        }
                      }}
                    />
                  </IconButton>
                </Tooltip>

                {showDetails && (
                  <Tooltip title="Ver detalles" arrow>
                    <IconButton
                      size="small"
                      onClick={(e) => handleShowDetailsRow(row, e)}
                      sx={{
                        color: 'info.main',
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          color: 'info.dark',
                          bgcolor: 'info.lighter',
                          transform: 'scale(1.1)',
                          boxShadow: 2
                        },
                        '&:active': {
                          transform: 'scale(0.95)'
                        }
                      }}
                    >
                      <PanoramaFishEye fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}

                {showDelete && (
                  <Tooltip title="Eliminar" arrow>
                    <IconButton
                      size="small"
                      onClick={(e) => handleDeleteRow(row.id, e)}
                      sx={{
                        color: 'error.main',
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          color: 'error.dark',
                          bgcolor: 'error.lighter',
                          transform: 'scale(1.1) rotate(-5deg)',
                          boxShadow: 2
                        },
                        '&:active': {
                          transform: 'scale(0.95)'
                        }
                      }}
                    >
                      <DeleteOutline fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}

                {buttons && buttons(row)}
              </>
            )}

            {mode === 'redirect' && (
              <>
                <Tooltip title="Editar" arrow>
                  <IconButton
                    size="small"
                    onClick={(e) => handleRedirectEditRow(row, e)}
                    sx={{
                      color: 'primary.main',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        color: 'primary.dark',
                        bgcolor: 'primary.lighter',
                        transform: 'scale(1.1) rotate(5deg)',
                        boxShadow: 2
                      },
                      '&:active': {
                        transform: 'scale(0.95)'
                      }
                    }}
                  >
                    <EditNote fontSize="small" />
                  </IconButton>
                </Tooltip>

                {showDetails && (
                  <Tooltip title="Ver detalles" arrow>
                    <IconButton
                      size="small"
                      onClick={(e) => handleShowDetailsRow(row, e)}
                      sx={{
                        color: 'info.main',
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          color: 'info.dark',
                          bgcolor: 'info.lighter',
                          transform: 'scale(1.1)',
                          boxShadow: 2
                        },
                        '&:active': {
                          transform: 'scale(0.95)'
                        }
                      }}
                    >
                      <PanoramaFishEye fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}

                {showDelete && (
                  <Tooltip title="Eliminar" arrow>
                    <IconButton
                      size="small"
                      onClick={(e) => handleDeleteRow(row.id, e)}
                      sx={{
                        color: 'error.main',
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          color: 'error.dark',
                          bgcolor: 'error.lighter',
                          transform: 'scale(1.1) rotate(-5deg)',
                          boxShadow: 2
                        },
                        '&:active': {
                          transform: 'scale(0.95)'
                        }
                      }}
                    >
                      <DeleteOutline fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}

                {buttons && buttons(row)}
              </>
            )}
          </Box>
        );
      }
    });
  //exportar

  const exportToExcelData = () => {
    // Crear una hoja a partir de los datos actuales
    const dataForExport = rows.map((row: any) => {
      const obj: any = {};
      columns.forEach((col) => {
        obj[col.headerName || col.field] = row[col.field as keyof typeof row] ?? '';
      });
      return obj;
    });

    const ws = XLSX.utils.json_to_sheet(dataForExport);

    // Ajustar ancho de columnas
    const colWidths = columns.map(() => ({ wch: 20 }));
    ws['!cols'] = colWidths;

    // Crear libro y añadir hoja
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reporte');

    // Generar archivo
    XLSX.writeFile(wb, `${title}.xlsx`);
  };
  // Ya no necesitamos filtrar en cliente porque se hace en servidor
  // const filteredRows = rows?.filter((row) =>
  //   Object.values(row).some((val) => val?.toString().toLowerCase().includes(search.toLowerCase()))
  // );

  return (
    <>
      <Box
        sx={{
          bgcolor: 'background.paper',
          borderRadius: 2,
          p: 2.5,
          border: 1,
          borderColor: 'divider',
          boxShadow: '0 6px 24px rgba(0,0,0,.08)'
        }}
      >
        {/* Header Profesional */}
        <Box
          sx={{
            background:
              theme =>
                theme.palette.mode === 'dark'
                  ? 'linear-gradient(180deg, rgba(255,255,255,0.04), transparent)'
                  : 'linear-gradient(180deg, rgba(0,0,0,0.03), transparent)',
            borderRadius: 2,
            px: 2,
            pt: 1.5,
            pb: 2
          }}
        >
          <Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 600,
                color: 'text.primary',
                letterSpacing: '-0.2px',
                mb: 0.5
              }}
            >
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {totalRows} {totalRows !== 1 ? 'registros' : 'registro'}
            </Typography>
          </Box>

          {/* Actions grupo derecho */}
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Tooltip title="Actualizar" arrow>
              <IconButton
                onClick={() => refetch()}
                size="small"
                sx={{
                  bgcolor: 'action.selected',
                  '&:hover': {
                    bgcolor: 'action.hover',
                    transform: 'rotate(180deg)',
                    transition: 'transform 0.3s ease'
                  }
                }}
              >
                <RefreshCcw size={18} />
              </IconButton>
            </Tooltip>

            {exportToExcel && (
              <Tooltip title="Exportar Excel" arrow>
                <IconButton
                  onClick={exportToExcelData}
                  size="small"
                  sx={{
                    color: 'success.main',
                    '&:hover': {
                      bgcolor: 'success.lighter'
                    }
                  }}
                >
                  <TableChart fontSize="small" />
                </IconButton>
              </Tooltip>
            )}

            <Tooltip title="Exportar PDF" arrow>
              <IconButton
                onClick={exportToPDF}
                size="small"
                sx={{
                  color: 'error.main',
                  '&:hover': {
                    bgcolor: 'error.lighter'
                  }
                }}
              >
                <PictureAsPdf fontSize="small" />
              </IconButton>
            </Tooltip>

            {numericFields.length > 0 && chartSeries.length > 0 && (
              <Tooltip title="Ver gráfico" arrow>
                <IconButton
                  onClick={() => setDrawerOpen(true)}
                  size="small"
                  sx={{
                    color: 'info.main',
                    '&:hover': {
                      bgcolor: 'info.lighter'
                    }
                  }}
                >
                  <BarChart fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>

        {numericFields.length > 0 && (
          <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
            <Box sx={{ width: 600, p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Gráfico de {title}
              </Typography>
              {chartSeries.length > 0 ? (
                <ApexChart options={chartOptions} series={chartSeries} type="line" height={400} />
              ) : (
                <Typography>No hay datos para graficar</Typography>
              )}
            </Box>
          </Drawer>
        )}

        {/* Toolbar Moderno */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
            gap: 2,
            flexWrap: { xs: 'wrap', md: 'nowrap' }
          }}
        >
          {/* Search y Primary Actions */}
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flex: 1 }}>
            {/* Search Bar */}
            <TextField
              placeholder="Buscar..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              size="small"
              InputProps={{
                startAdornment: (
                  <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                    <Search fontSize="small" sx={{ color: 'text.secondary' }} />
                  </Box>
                )
              }}
              sx={{
                minWidth: { xs: '100%', sm: 300 },
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'background.paper',
                  borderRadius: 2,
                  '& .MuiDataGrid-main': {
                    borderRadius: 8,
                    overflow: 'hidden'
                  },
                  '& fieldset': {
                    borderColor: 'divider'
                  },
                  '&:hover fieldset': {
                    borderColor: 'primary.main'
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'primary.main',
                    borderWidth: 1
                  }
                }
              }}
            />
          </Box>

          {/* Botón Crear */}
          <Box>
            {mode === 'crud' && (
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => {
                  setFormValues(defaultFormValues || ({} as T));
                  setIsNew(true);
                  setShowModal(true);
                }}
                sx={{
                  textTransform: 'none',
                  fontWeight: 500,
                  borderRadius: 1,
                  px: 2.5,
                  boxShadow: 1,
                  '&:hover': {
                    boxShadow: 2
                  }
                }}
              >
                Nuevo
              </Button>
            )}

            {mode === 'redirect' && onCreateClick && (
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={onCreateClick}
                sx={{
                  textTransform: 'none',
                  fontWeight: 500,
                  borderRadius: 1,
                  px: 2.5,
                  boxShadow: 1,
                  '&:hover': {
                    boxShadow: 2
                  }
                }}
              >
                Nuevo
              </Button>
            )}
          </Box>
        </Box>

        {/* DataGrid Profesional */}
        <Box
          sx={{
            height: 600,
            width: '100%'
          }}
        >
          <DataGrid
            rows={rows}
            columns={fullColumns}
            pageSizeOptions={[5, 10, 20, 50, 100]}
            paginationModel={{ pageSize, page }}
            onPaginationModelChange={(model) => {
              setPage(model.page);
              setPageSize(model.pageSize);
            }}
            paginationMode="server"
            rowCount={totalRows}
            disableColumnFilter
            rowSelection={false}
            disableColumnSelector
            disableDensitySelector
            sx={{
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              bgcolor: 'background.paper',
              '& .MuiDataGrid-columnHeaders': {
                bgcolor: 'background.default',
                borderBottom: 1,
                borderColor: 'divider',
                minHeight: '48px !important',
                maxHeight: '48px !important'
              },
              '& .MuiDataGrid-columnHeader': {
                fontWeight: 600,
                fontSize: '0.875rem',
                color: 'text.primary',
                '&:focus': {
                  outline: 'none'
                },
                '&:focus-within': {
                  outline: 'none'
                }
              },
              '& .MuiDataGrid-columnHeaderTitle': {
                fontWeight: 600,
                fontSize: '0.875rem'
              },
              '& .MuiDataGrid-row': {
                borderBottom: 1,
                borderColor: 'divider',
                transition: 'background-color 0.15s ease',
                '&:hover': {
                  bgcolor: 'action.hover',
                  cursor: 'pointer'
                },
                '&:last-child': {
                  borderBottom: 'none'
                },
                '&.Mui-selected': {
                  bgcolor: 'action.selected',
                  '&:hover': {
                    bgcolor: 'action.hover'
                  }
                }
              },
              '& .MuiDataGrid-cell': {
                borderBottom: 'none',
                fontSize: '0.875rem',
                color: 'text.primary',
                py: 2,
                '&:focus': {
                  outline: 'none'
                },
                '&:focus-within': {
                  outline: 'none'
                }
              },
              '& .cell-strong': {
                fontWeight: 600
              },
              '& .MuiDataGrid-footerContainer': {
                borderTop: 1,
                borderColor: 'divider',
                bgcolor: 'background.default',
                minHeight: '52px'
              },
              '& .MuiTablePagination-root': {
                color: 'text.primary'
              },
              '& .MuiDataGrid-virtualScroller': {
                marginTop: '48px !important'
              },
              '& .MuiDataGrid-overlay': {
                bgcolor: (theme) =>
                  theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(4px)'
              },
              '& .MuiCircularProgress-root': {
                color: 'primary.main'
              },
              '& .MuiDataGrid-columnSeparator': {
                display: 'none'
              }
            }}
            disableRowSelectionOnClick
            loading={loading}
            getRowId={(row) => row.id as number}
          />
        </Box>
      </Box>

      {mode === 'crud' && (
        <Drawer
          anchor="right"
          open={showModal}
          onClose={() => !formLoading && setShowModal(false)}
          sx={{
            '& .MuiDrawer-paper': {
              width: { xs: '100%', sm: '600px', md: '700px' },
              boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
              bgcolor: 'background.default'
            }
          }}
        >
          {/* Header con gradiente */}
          <Box
            sx={{
              p: 3,
              position: 'sticky',
              top: 0,
              zIndex: 1,
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    borderRadius: '12px',
                    p: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  {isNew ? <Add sx={{ fontSize: 28 }} /> : <EditNote sx={{ fontSize: 28 }} />}
                </Box>
                <Box>
                  <Typography variant="h5" fontWeight={600} sx={{ mb: 0.5 }}>
                    {isNew ? 'Crear nuevo' : 'Editar'}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    {title}
                  </Typography>
                </Box>
              </Box>
              <IconButton
                onClick={() => !formLoading && setShowModal(false)}
                disabled={formLoading}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(10px)',
                  opacity: 0.75,
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.25)',
                    transform: 'rotate(90deg)',
                    opacity: 1
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                <GridCloseIcon />
              </IconButton>
            </Box>

            {/* Progress bar cuando está guardando */}
            {formLoading && (
              <Box sx={{ mt: 2 }}>
                <Box
                  sx={{
                    width: '100%',
                    height: 3,
                    bgcolor: 'rgba(255,255,255,0.2)',
                    borderRadius: 1.5,
                    overflow: 'hidden'
                  }}
                >
                  <Box
                    sx={{
                      width: '50%',
                      height: '100%',
                      bgcolor: 'white',
                      animation: 'loading 1.5s ease-in-out infinite',
                      '@keyframes loading': {
                        '0%': { transform: 'translateX(-100%)' },
                        '50%': { transform: 'translateX(200%)' },
                        '100%': { transform: 'translateX(-100%)' }
                      }
                    }}
                  />
                </Box>
              </Box>
            )}
          </Box>

          {/* Content con scroll suave */}
          <Box
            sx={{
              flex: 1,
              overflow: 'auto',
              p: 3,
              '&::-webkit-scrollbar': {
                width: '8px'
              },
              '&::-webkit-scrollbar-track': {
                bgcolor: 'transparent'
              },
              '&::-webkit-scrollbar-thumb': {
                bgcolor: 'divider',
                borderRadius: '4px',
                '&:hover': {
                  bgcolor: 'action.hover'
                }
              }
            }}
          >
            {/* Card del formulario */}
            <Box
              sx={{
                bgcolor: 'background.paper',
                borderRadius: 2,
                p: 3,
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                border: 1,
                '& .MuiOutlinedInput-root': {
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                },
                borderColor: 'divider'
              }}
            >
              {/* Contador de errores */}
              {Object.keys(errors).length > 0 && (
                <Box
                  sx={{
                    mb: 3,
                    p: 2,
                    bgcolor: 'error.lighter',
                    borderRadius: 1,
                    border: 1,
                    borderColor: 'error.light',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <Box
                    sx={{
                      bgcolor: 'error.main',
                      color: 'white',
                      borderRadius: '50%',
                      width: 24,
                      height: 24,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.875rem',
                      fontWeight: 600
                    }}
                  >
                    {Object.keys(errors).length}
                  </Box>
                  <Typography variant="body2" color="error.dark" fontWeight={500}>
                    {Object.keys(errors).length === 1
                      ? 'Hay 1 campo con error'
                      : `Hay ${Object.keys(errors).length} campos con errores`}
                  </Typography>
                </Box>
              )}

              {/* Formulario */}
              {renderForm && renderForm(formValues, handleChange, setFormValues, errors)}
            </Box>
          </Box>

          {/* Footer fijo con acciones */}
          <Box
            sx={{
              position: 'sticky',
              bottom: 0,
              bgcolor: 'background.paper',
              borderTop: 1,
              borderColor: 'divider',
              p: 2.5,
              display: 'flex',
              gap: 2,
              boxShadow: '0 -4px 12px rgba(0,0,0,0.04)',
              zIndex: 1
            }}
          >
            <Button
              fullWidth
              variant="outlined"
              size="large"
              onClick={() => setShowModal(false)}
              disabled={formLoading}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                borderWidth: 2,
                '&:hover': {
                  borderWidth: 2
                }
              }}
            >
              Cancelar
            </Button>
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleSave}
              disabled={formLoading || Object.keys(errors).length > 0}
              startIcon={formLoading ? <CircularProgress size={20} color="inherit" /> : null}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                boxShadow: 2,
                '&:hover': {
                  boxShadow: 4,
                  transform: 'translateY(-1px)'
                },
                '&:active': {
                  transform: 'translateY(0)'
                },
                transition: 'all 0.2s ease'
              }}
            >
              {formLoading ? 'Guardando...' : isNew ? 'Crear' : 'Guardar cambios'}
            </Button>
          </Box>
        </Drawer>
      )}

      <ConfirmDialog
        open={confirmDeleteId !== null}
        title="Eliminar registro"
        description="¿Seguro que quieres eliminar este registro?"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </>
  );
}

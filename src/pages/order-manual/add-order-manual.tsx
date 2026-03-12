import { Fragment, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container } from '@/components/container';
import {
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select as MuiSelect,
  MenuItem,
  FormHelperText,
  Autocomplete
} from '@mui/material';
import { Formik, Form, FieldArray } from 'formik';
import * as Yup from 'yup';
import { FetchData } from '@/utils/FetchData';
import { toast } from 'sonner';

const AddOrderManual = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState<any>([]);
  const [vehicles, setVehicles] = useState<any>([]);
  const [users, setUsers] = useState<any>([]);
  const [puertos, setPuertos] = useState<any>([]);
  const [materiales, setMateriales] = useState<any>([]);

  const unidad = [
    { id: 1, nombre: 'Kilogramos' },
    { id: 2, nombre: 'Toneladas' },
    { id: 3, nombre: 'Metros' },
    { id: 4, nombre: 'Unidades' }
  ];

  const entrada = [
    { id: 1, nombre: 'App' },
    { id: 2, nombre: 'Manual' }
  ];

  const get_users = async () => {
    const data = await FetchData('users', 'GET', {
      limit: 1000
    });
    if (data && !data.detail) setUsers(data);
  };

  const get_clientes = async () => {
    const data = await FetchData('inv/clientes', 'GET', null);
    if (data && !data.detail) setClients(data);
  };

  const get_puertos = async () => {
    const data = await FetchData('puertos', 'GET', null);
    if (data && !data.detail) setPuertos(data);
  };

  const get_materiales = async () => {
    const data = await FetchData('materiales', 'GET', null);
    if (data && !data.detail) setMateriales(data);
  };

  const get_vehiculos = async () => {
    const data = await FetchData('vehicles', 'GET', null);
    if (data && !data.detail) setVehicles(data);
  };

  useEffect(() => {
    get_puertos();
    get_materiales();
    get_clientes();
    get_vehiculos();
    get_users();
  }, []);

  const schema = Yup.object().shape({
    cliente_id: Yup.number().required('Seleccione un cliente'),
    peso_total: Yup.number().required('Ingrese el peso total').typeError('Debe ser un número'),
    unidad_id: Yup.number().required('Seleccione una unidad'),
    modo_entrada: Yup.number().required('Seleccione un modo de entrada'),
    material_id: Yup.number().required('Seleccione un material'),
    orden_usuario_id: Yup.array()
      .min(1, 'Seleccione al menos un usuario de la empresa')
      .required('Seleccione al menos un usuario de la empresa'),
    puerto_salida_id: Yup.number().required('Seleccione un puerto de origen'),
    puerto_destino_id: Yup.number().required('Seleccione un puerto de destino'),
    vehiculos_totales: Yup.number().required('Ingrese los vehículos totales').min(1),
    fecha: Yup.string().required('Seleccione una fecha'),
    hora_salida: Yup.string().required('Seleccione una hora de salida'),
    total: Yup.number().required('Ingrese el total').typeError('Debe ser un número'),
    descripcion: Yup.string().required('Ingrese una descripción'),
    vehiculos: Yup.array()
      .of(
        Yup.object().shape({
          vehiculo_id: Yup.number().required('Seleccione un vehículo'),
          conductor_id: Yup.number().required('Conductor requerido')
        })
      )
      .min(1, 'Seleccione al menos un vehículo y conductor')
  });

  const initialValues = {
    cliente_id: '',
    peso_total: '',
    unidad_id: '',
    material_id: '',
    puerto_salida_id: '',
    puerto_destino_id: '',
    vehiculos_totales: 0,
    fecha: '',
    hora_salida: '',
    total: '',
    descripcion: '',
    modo_entrada: '',
    vehiculos: [] as any[],
    orden_usuario_id: [] as any[]
  };

  const handleSubmit = async (values: any) => {
    try {
      const session = localStorage.getItem('session') as any;
      const id = session ? JSON.parse(session).id : null;

      // Convertir array de usuarios a string separado por comas
      const orden_usuario_id = Array.isArray(values.orden_usuario_id)
        ? values.orden_usuario_id.map((u: any) => u.id).join(',')
        : values.orden_usuario_id;

      const payload = {
        ...values,
        usuario_id: id,
        modo_entrada: String(values.modo_entrada),
        orden_usuario_id
      };

      const res = await FetchData('ordenes_manual', 'POST', payload);
      if (res?.detail) {
        toast.error(res.detail);
      } else if (res?.mensaje) {
        toast.success(res.mensaje);
        navigate('/order-manual');
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Error al guardar la orden manual');
    }
  };

  return (
    <Fragment>
      <Container>
        <div className="card min-w-full">
          <div className="card-header">
            <h3 className="card-title">Agregar Orden Manual</h3>
            <p className="text-sm text-gray-500">Crea una orden manual para un cliente</p>
            <div className="flex items-center gap-2">
              <Button variant="contained" color="primary" onClick={() => navigate('/order-manual')}>
                Regresar
              </Button>
            </div>
          </div>

          <Formik initialValues={initialValues} validationSchema={schema} onSubmit={handleSubmit}>
            {({ values, errors, touched, handleChange, setFieldValue }) => (
              <Form className="card-body space-y-4">
                <Grid container spacing={2}>
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth error={!!(touched.cliente_id && errors.cliente_id)}>
                      <InputLabel id="cliente-label">Cliente</InputLabel>
                      <MuiSelect
                        labelId="cliente-label"
                        name="cliente_id"
                        value={values.cliente_id}
                        label="Cliente"
                        onChange={handleChange}
                      >
                        <MenuItem value="">Seleccione un cliente</MenuItem>
                        {clients.map((c: any) => (
                          <MenuItem key={c.id} value={c.id}>
                            {c.nombre} {c.apellido}
                          </MenuItem>
                        ))}
                      </MuiSelect>
                      <FormHelperText>{touched.cliente_id && errors.cliente_id}</FormHelperText>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={3}>
                    <FormControl
                      fullWidth
                      error={!!(touched.orden_usuario_id && errors.orden_usuario_id)}
                    >
                      <Autocomplete
                        options={users}
                        multiple
                        value={values.orden_usuario_id}
                        onChange={(event, newValue) => {
                          setFieldValue('orden_usuario_id', newValue);
                        }}
                        getOptionLabel={(option: any) =>
                          `${option.nombre} ${option.apellido} (${option.nombre_usuario})`
                        }
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Usuario de la empresa"
                            error={!!(touched.orden_usuario_id && errors.orden_usuario_id)}
                            helperText={touched.orden_usuario_id && errors.orden_usuario_id}
                          />
                        )}
                      />
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      name="peso_total"
                      label="Peso Total"
                      type="number"
                      value={values.peso_total}
                      onChange={handleChange}
                      error={!!(touched.peso_total && errors.peso_total)}
                      helperText={touched.peso_total && errors.peso_total}
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth error={!!(touched.unidad_id && errors.unidad_id)}>
                      <InputLabel id="unidad-label">Unidad</InputLabel>
                      <MuiSelect
                        labelId="unidad-label"
                        name="unidad_id"
                        value={values.unidad_id}
                        label="Unidad"
                        onChange={handleChange}
                      >
                        <MenuItem value="">Seleccione una unidad</MenuItem>
                        {unidad.map((u) => (
                          <MenuItem key={u.id} value={u.id}>
                            {u.nombre}
                          </MenuItem>
                        ))}
                      </MuiSelect>
                      <FormHelperText>{touched.unidad_id && errors.unidad_id}</FormHelperText>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth error={!!(touched.material_id && errors.material_id)}>
                      <InputLabel id="material-label">Material</InputLabel>
                      <MuiSelect
                        labelId="material-label"
                        name="material_id"
                        value={values.material_id}
                        label="Material"
                        onChange={handleChange}
                      >
                        <MenuItem value="">Seleccione un material</MenuItem>
                        {materiales.map((m: any) => (
                          <MenuItem key={m.id} value={m.id}>
                            {m.nombre}
                          </MenuItem>
                        ))}
                      </MuiSelect>
                      <FormHelperText>{touched.material_id && errors.material_id}</FormHelperText>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <FormControl
                      fullWidth
                      error={!!(touched.puerto_salida_id && errors.puerto_salida_id)}
                    >
                      <InputLabel id="puerto-salida-label">Puerto de origen</InputLabel>
                      <MuiSelect
                        labelId="puerto-salida-label"
                        name="puerto_salida_id"
                        value={values.puerto_salida_id}
                        label="Puerto de origen"
                        onChange={handleChange}
                      >
                        <MenuItem value="">Seleccione un puerto</MenuItem>
                        {puertos.map((p: any) => (
                          <MenuItem key={p.id} value={p.id}>
                            {p.nombre}
                          </MenuItem>
                        ))}
                      </MuiSelect>
                      <FormHelperText>
                        {touched.puerto_salida_id && errors.puerto_salida_id}
                      </FormHelperText>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <FormControl
                      fullWidth
                      error={!!(touched.puerto_destino_id && errors.puerto_destino_id)}
                    >
                      <InputLabel id="puerto-destino-label">Puerto de destino</InputLabel>
                      <MuiSelect
                        labelId="puerto-destino-label"
                        name="puerto_destino_id"
                        value={values.puerto_destino_id}
                        label="Puerto de destino"
                        onChange={handleChange}
                      >
                        <MenuItem value="">Seleccione un puerto</MenuItem>
                        {puertos.map((p: any) => (
                          <MenuItem key={p.id} value={p.id}>
                            {p.nombre}
                          </MenuItem>
                        ))}
                      </MuiSelect>
                      <FormHelperText>
                        {touched.puerto_destino_id && errors.puerto_destino_id}
                      </FormHelperText>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      name="vehiculos_totales"
                      label="Vehículos Totales"
                      type="number"
                      value={values.vehiculos_totales}
                      onChange={(e) => {
                        const v = Number(e.target.value || 0);
                        setFieldValue('vehiculos_totales', v);
                        // ensure vehiculos array length matches
                        const arr = values.vehiculos ? [...values.vehiculos] : [];
                        while (arr.length < v)
                          arr.push({ vehiculo_id: '', conductor_id: '', vueltas: 0 });
                        while (arr.length > v) arr.pop();
                        setFieldValue('vehiculos', arr);
                      }}
                      error={!!(touched.vehiculos_totales && errors.vehiculos_totales)}
                      helperText={touched.vehiculos_totales && errors.vehiculos_totales}
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      name="fecha"
                      label="Fecha"
                      type="date"
                      InputLabelProps={{ shrink: true }}
                      value={values.fecha}
                      onChange={handleChange}
                      error={!!(touched.fecha && errors.fecha)}
                      helperText={touched.fecha && errors.fecha}
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      name="hora_salida"
                      label="Hora de salida"
                      type="time"
                      InputLabelProps={{ shrink: true }}
                      value={values.hora_salida}
                      onChange={handleChange}
                      error={!!(touched.hora_salida && errors.hora_salida)}
                      helperText={touched.hora_salida && errors.hora_salida}
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      name="total"
                      label="Total ($)"
                      type="number"
                      value={values.total}
                      onChange={handleChange}
                      error={!!(touched.total && errors.total)}
                      helperText={touched.total && errors.total}
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth error={!!(touched.modo_entrada && errors.modo_entrada)}>
                      <InputLabel id="modo-entrada-label">Modo de entrada</InputLabel>
                      <MuiSelect
                        labelId="modo-entrada-label"
                        name="modo_entrada"
                        value={values.modo_entrada}
                        label="Modo de entrada"
                        onChange={handleChange}
                      >
                        <MenuItem value="">Seleccione un modo de entrada</MenuItem>
                        {entrada.map((e) => (
                          <MenuItem key={e.id} value={e.id}>
                            {e.nombre}
                          </MenuItem>
                        ))}
                      </MuiSelect>
                      <FormHelperText>{touched.modo_entrada && errors.modo_entrada}</FormHelperText>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      name="descripcion"
                      label="Descripción"
                      multiline
                      minRows={3}
                      value={values.descripcion}
                      onChange={handleChange}
                      error={!!(touched.descripcion && errors.descripcion)}
                      helperText={touched.descripcion && errors.descripcion}
                    />
                  </Grid>
                </Grid>

                <FieldArray name="vehiculos">
                  {({ remove, push }) => (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Vehículos y Conductores</h3>
                      {values.vehiculos && values.vehiculos.length > 0 ? (
                        values.vehiculos.map((v: any, idx: number) => (
                          <div key={idx} className="card-table p-4 border rounded">
                            <h4 className="font-medium mb-2">Vehículo {idx + 1}</h4>
                            <Grid container spacing={2}>
                              <Grid item xs={12} md={6}>
                                <FormControl
                                  fullWidth
                                  error={
                                    !!(
                                      errors.vehiculos &&
                                      errors.vehiculos[idx] &&
                                      (errors.vehiculos[idx] as any).vehiculo_id
                                    )
                                  }
                                >
                                  <InputLabel id={`vehiculo-label-${idx}`}>Vehículo</InputLabel>
                                  <MuiSelect
                                    labelId={`vehiculo-label-${idx}`}
                                    name={`vehiculos.${idx}.vehiculo_id`}
                                    value={v.vehiculo_id}
                                    label="Vehículo"
                                    onChange={(e) => {
                                      const vehicleId = Number(e.target.value);
                                      setFieldValue(`vehiculos.${idx}.vehiculo_id`, vehicleId);
                                      const conductor = vehicles.find(
                                        (veh: any) => veh.id === vehicleId
                                      )?.conductor_id;
                                      setFieldValue(
                                        `vehiculos.${idx}.conductor_id`,
                                        conductor || ''
                                      );
                                    }}
                                  >
                                    <MenuItem value="">Seleccione un vehículo</MenuItem>
                                    {vehicles.map((veh: any) => (
                                      <MenuItem key={veh.id} value={veh.id}>
                                        {veh.nombre} - {veh.placa}
                                      </MenuItem>
                                    ))}
                                  </MuiSelect>
                                  <FormHelperText>
                                    {errors.vehiculos &&
                                      errors.vehiculos[idx] &&
                                      (errors.vehiculos[idx] as any).vehiculo_id}
                                  </FormHelperText>
                                </FormControl>
                              </Grid>

                              <Grid item xs={12} md={6}>
                                <FormControl
                                  fullWidth
                                  error={
                                    !!(
                                      errors.vehiculos &&
                                      errors.vehiculos[idx] &&
                                      (errors.vehiculos[idx] as any).conductor_id
                                    )
                                  }
                                >
                                  <InputLabel id={`conductor-label-${idx}`}>Conductor</InputLabel>
                                  <MuiSelect
                                    labelId={`conductor-label-${idx}`}
                                    name={`vehiculos.${idx}.conductor_id`}
                                    value={v.conductor_id}
                                    disabled
                                    label="Conductor"
                                    onChange={(e) => {
                                      setFieldValue(
                                        `vehiculos.${idx}.conductor_id`,
                                        Number(e.target.value)
                                      );
                                    }}
                                  >
                                    <MenuItem value="">Seleccione un conductor</MenuItem>
                                    {users.map((u: any) => (
                                      <MenuItem key={u.id} value={u.id}>
                                        {u.nombres || u.nombre || u.email}
                                      </MenuItem>
                                    ))}
                                  </MuiSelect>
                                  <FormHelperText>
                                    {errors.vehiculos &&
                                      errors.vehiculos[idx] &&
                                      (errors.vehiculos[idx] as any).conductor_id}
                                  </FormHelperText>
                                </FormControl>
                              </Grid>

                              <Grid item xs={12} md={6} className="flex items-center gap-2">
                                <Button
                                  variant="outlined"
                                  color="error"
                                  onClick={() => remove(idx)}
                                >
                                  Eliminar
                                </Button>
                              </Grid>
                            </Grid>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-gray-500">No hay vehículos asignados</div>
                      )}
                      <div>
                        <Button
                          variant="contained"
                          onClick={() => push({ vehiculo_id: '', conductor_id: '', vueltas: 0 })}
                        >
                          Agregar vehículo
                        </Button>
                      </div>
                    </div>
                  )}
                </FieldArray>

                <div className="text-center mt-5">
                  <Button type="submit" variant="contained" color="primary">
                    Guardar Orden Manual
                  </Button>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </Container>
    </Fragment>
  );
};

export { AddOrderManual };

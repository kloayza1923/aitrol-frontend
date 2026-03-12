import { Fragment, useEffect, useState } from 'react';
import { Container } from '@/components/container';
import { CrudAvatarUpload } from '@/partials/crud';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { FetchData } from '@/utils/FetchData';

import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import {
  TextField,
  Select as MuiSelect,
  MenuItem,
  Button,
  Grid,
  InputLabel,
  FormControl,
  FormHelperText
} from '@mui/material';

const AddVehicleLayout = () => {
  const location = useNavigate();
  const [avatar, setAvatar] = useState<any>([]);
  const [types, setTypes] = useState<any>([]); // Para los tipos
  const [conductores, setConductores] = useState<any>([]); // Para los conductores

  // client-side validation handled by Yup
  const get_types = async () => {
    const data = await FetchData('vehicles_types', 'GET', null); // Obtener tipos desde el backend
    if (data.detail) {
      toast.error(data.detail);
      return;
    }
    setTypes(data); // Asignar tipos
  };

  const get_conductores = async () => {
    const data = await FetchData('users', 'GET', null); // Obtener conductores desde el backend
    console.log(data);
    if (data.detail) {
      toast.error(data.detail);
      return;
    }
    setConductores(data); // Asignar conductores
  };

  useEffect(() => {
    get_types(); // Cargar tipos al inicio
    get_conductores(); // Cargar conductores al inicio
  }, []);
  const create_vehicle = async (values: any) => {
    try {
      const data = { ...values };
      // attach avatar src if present
      const avatar_input = document.getElementById('avatar_input');
      if (avatar_input) data.foto = avatar_input.getAttribute('src');

      const res = await FetchData('vehicles', 'POST', data);
      if (res?.detail) {
        toast.error(res.detail);
      } else if (res?.mensaje) {
        toast.success(res.mensaje);
        location('/vehicle-management');
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Error al crear vehículo');
    }
  };

  const schema = Yup.object().shape({
    nombre: Yup.string().required('Placa es requerida'),
    conductor_id: Yup.number().required('Seleccione un conductor'),
    tipo_id: Yup.number().required('Seleccione un tipo'),
    kilometraje_inicial: Yup.number().required('Kilometraje inicial requerido').min(0),
    capacidad: Yup.number().required('Capacidad requerida').min(0),
    estado: Yup.number().oneOf([0, 1]).required('Estado requerido'),
    aviso_mantenimiento: Yup.number().nullable()
  });

  const initialValues = {
    nombre: '',
    conductor_id: '',
    tipo_id: '',
    kilometraje_inicial: '',
    capacidad: '',
    estado: 1,
    aviso_mantenimiento: ''
  };

  return (
    <Fragment>
      <Container>
        <div className="card min-w-full">
          <div className="card-header">
            <h3 className="card-title">Agregar Vehículo</h3>
            <p className="text-sm text-gray-500">Complete los campos para agregar un vehículo</p>
            <div className="flex items-center gap-2">
              <button
                className="btn btn-primary flex justify-center grow"
                onClick={() => location('/vehicle-management')}
              >
                Regresar
              </button>
            </div>
          </div>
          <div className="card-body">
            <Formik
              initialValues={initialValues}
              validationSchema={schema}
              onSubmit={create_vehicle}
            >
              {({ values, errors, touched, handleChange, setFieldValue }) => (
                <Form className="space-y-4">
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        name="nombre"
                        label="Placa"
                        value={values.nombre}
                        onChange={handleChange}
                        error={!!(touched.nombre && errors.nombre)}
                        helperText={touched.nombre && errors.nombre}
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <FormControl
                        fullWidth
                        error={!!(touched.conductor_id && errors.conductor_id)}
                      >
                        <InputLabel id="conductor-label">Conductor</InputLabel>
                        <MuiSelect
                          labelId="conductor-label"
                          name="conductor_id"
                          value={values.conductor_id}
                          label="Conductor"
                          onChange={(e) => setFieldValue('conductor_id', Number(e.target.value))}
                        >
                          <MenuItem value="">Seleccione un conductor</MenuItem>
                          {conductores.map((item: any) => (
                            <MenuItem key={item.id} value={item.id}>
                              #{item.id} {item.nombre} {item.apellido}
                            </MenuItem>
                          ))}
                        </MuiSelect>
                        <FormHelperText>
                          {touched.conductor_id && errors.conductor_id}
                        </FormHelperText>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth error={!!(touched.tipo_id && errors.tipo_id)}>
                        <InputLabel id="tipo-label">Tipo</InputLabel>
                        <MuiSelect
                          labelId="tipo-label"
                          name="tipo_id"
                          value={values.tipo_id}
                          label="Tipo"
                          onChange={(e) => setFieldValue('tipo_id', Number(e.target.value))}
                        >
                          <MenuItem value="">Seleccione un tipo</MenuItem>
                          {types.map((item: any) => (
                            <MenuItem key={item.id} value={item.id}>
                              {item.nombre}
                            </MenuItem>
                          ))}
                        </MuiSelect>
                        <FormHelperText>{touched.tipo_id && errors.tipo_id}</FormHelperText>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        name="kilometraje_inicial"
                        label="Kilometraje Inicial"
                        type="number"
                        value={values.kilometraje_inicial}
                        onChange={(e) =>
                          setFieldValue('kilometraje_inicial', Number(e.target.value))
                        }
                        error={!!(touched.kilometraje_inicial && errors.kilometraje_inicial)}
                        helperText={touched.kilometraje_inicial && errors.kilometraje_inicial}
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        name="capacidad"
                        label="Capacidad"
                        type="number"
                        value={values.capacidad}
                        onChange={(e) => setFieldValue('capacidad', Number(e.target.value))}
                        error={!!(touched.capacidad && errors.capacidad)}
                        helperText={touched.capacidad && errors.capacidad}
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth error={!!(touched.estado && errors.estado)}>
                        <InputLabel id="estado-label">Estado</InputLabel>
                        <MuiSelect
                          labelId="estado-label"
                          name="estado"
                          value={values.estado}
                          label="Estado"
                          onChange={(e) => setFieldValue('estado', Number(e.target.value))}
                        >
                          <MenuItem value={1}>Activo</MenuItem>
                          <MenuItem value={0}>Inactivo</MenuItem>
                        </MuiSelect>
                        <FormHelperText>{touched.estado && errors.estado}</FormHelperText>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        name="aviso_mantenimiento"
                        label="Aviso de Mantenimiento (km)"
                        type="number"
                        value={values.aviso_mantenimiento}
                        onChange={(e) =>
                          setFieldValue('aviso_mantenimiento', Number(e.target.value))
                        }
                      />
                    </Grid>

                    <Grid item xs={12} md={6} className="flex items-center">
                      <div>
                        <div className="text-sm text-gray-700 mb-1">Foto (JPEG/PNG 150x150)</div>
                        <CrudAvatarUpload
                          avatar={avatar}
                          setAvatar={setAvatar}
                          onChange={() => {
                            /* no-op handled by setAvatar via the component */
                          }}
                        />
                      </div>
                    </Grid>
                  </Grid>

                  <div className="text-center mt-5">
                    <Button type="submit" variant="contained" color="primary">
                      Guardar
                    </Button>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      </Container>
    </Fragment>
  );
};

export { AddVehicleLayout };

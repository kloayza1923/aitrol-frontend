import React, { useEffect, useState } from 'react';
import {
  get_order_conductor,
  current_user,
  update_order_travel,
  get_count_travel
} from '@/lib/api';
import { Button, Card, Divider, Typography, Modal, Input } from '@mui/material';
import * as Yup from 'yup';
import { useNotification } from '@/hooks';

const Step = ({ id, onContinue, activeStep, user_id, data_id, data, steps, disabled }: any) => {
  const notification = useNotification();
  const [order, setOrder] = useState({
    id: '10004',
    cliente: 'Anthony Hawkings',
    fecha: '2025-03-05',
    hora_salida: '23:03:00',
    material: 'Cacao',
    peso: 1111111,
    total: 1000,
    usuario: 'John Doe',
    vehiculos_totales: 12,
    estado: 'En Proceso',
    vehiculo_id: 0,
    puerto_salida_nombre: '',
    puerto_destino_nombre: ''
  });
  const [open, setOpen] = useState(false);
  const [client, setClient] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora_salida, setHora_salida] = useState('');
  const [material, setMaterial] = useState('');
  const [peso, setPeso] = useState('');
  const [total, setTotal] = useState('');
  const [usuario, setUsuario] = useState('');
  const [vehiculos_totales, setVehiculos_totales] = useState('');
  const [vehiculo_id, setVehiculo_id] = useState('');
  const [puerto_salida_nombre, setPuerto_salida_nombre] = useState('');
  const [puerto_destino_nombre, setPuerto_destino_nombre] = useState('');
  const [documento_path, setDocumento_path] = useState('');
  const [upload_documento_path, setUpload_documento_path] = useState('');
  const [documento_path2, setDocumento_path2] = useState('');
  const [upload_documento_path2, setUpload_documento_path2] = useState('');
  const [numero_guia, setNumero_guia] = useState('');
  const [numero_guia2, setNumero_guia2] = useState('');
  const [peso_neto, setPeso_neto] = useState('');
  const [peso_bruto, setPeso_bruto] = useState('');
  const [peso_neto2, setPeso_neto2] = useState('');
  const [peso_bruto2, setPeso_bruto2] = useState('');
  const [peso_tara, setPeso_tara] = useState('');
  const [peso_tara2, setPeso_tara2] = useState('');
  const [estado, setEstado] = useState('');
  const [estado_id, setEstado_id] = useState<number>(0);
  const [guia_remision, setGuia_remision] = useState('');
  const [envuelta, setEnvuelta] = useState('');
  const [loading, setLoading] = useState(false);
  const [count_travels, setCountTravels] = useState(0);

  const get_order_data = async () => {
    console.log(data, 'data from step', steps);
    setOrder(data);
    setClient(data.cliente);
    setFecha(data.fecha);
    setHora_salida(data.hora_salida);
    setEstado(data.estado);
    setMaterial(data.material);
    //setPeso(data.peso);
    setTotal(data.total);
    setUsuario(data.usuario);
    setVehiculos_totales(data.vehiculos_totales);
    setVehiculo_id(data.vehiculo_id);
    setPuerto_salida_nombre(data.puerto_salida_nombre);
    setPuerto_destino_nombre(data.puerto_destino_nombre);
    setDocumento_path(data.documento_path);
    setDocumento_path2(data.documento_path2);
    setNumero_guia(data.numero_guia);
    setNumero_guia2(data.numero_guia2);
    setPeso_neto(data.peso_neto);
    setPeso_bruto(data.peso);
    setPeso_neto2(data.peso_neto2);
    setPeso_bruto2(data.peso2);
    setPeso_tara(data.peso_tara);
    setPeso_tara2(data.peso_tara2);
    setEstado(data.estado_id);
    setEstado_id(data.en_vuelta ? 9 : data.estado_id);
    setGuia_remision(data.guia_remision);
  };

  const update_order_data = async () => {
    try {
      const user = await current_user();
      setLoading(true);
      const body = {
        peso: peso_bruto,
        peso_neto: peso_neto,
        peso_tara: peso_tara,
        peso2: peso_bruto2,
        peso_neto2: peso_neto2,
        peso_tara2: peso_tara2,
        numero_guia: numero_guia,
        numero_guia2: numero_guia2,
        guia_remision: guia_remision,
        documento_path: upload_documento_path ? upload_documento_path : null,
        documento_path2: upload_documento_path2 ? upload_documento_path2 : null,
        id: data_id,
        usuario_actualiza: user.id,
        estado_id: estado_id,
        estado: steps.find((step: any) => step.id === estado_id)?.nombre
      };
      console.log(body, 'body');
      const data = await update_order_travel(body);
      console.log(data, 'data');
      notification.success(
        'Orden de viaje actualizada exitosamente',
        'La orden ha sido actualizada con éxito'
      );
      setLoading(false);
      onContinue();
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
      alert('No se pudo guardar la orden de viaje, intente nuevamente');
    }
  };

  // Validación con Yup antes de ejecutar update_order_data
  const validationSchema = Yup.object().shape({
    numero_guia: Yup.string().required('El número de guía es requerido'),
    peso_neto: Yup.number()
      .typeError('Peso neto debe ser un número')
      .positive('Peso neto debe ser mayor que 0')
      .required('Peso neto es requerido'),
    peso_bruto: Yup.number()
      .typeError('Peso bruto debe ser un número')
      .positive('Peso bruto debe ser mayor que 0')
      .required('Peso bruto es requerido'),
    peso_tara: Yup.number()
      .typeError('Peso tara debe ser un número')
      .min(0, 'Peso tara no puede ser negativo')
      .required('Peso tara es requerido')
  });

  const validateAndUpdate = async () => {
    try {
      // construimos objeto con los campos que validamos
      const payloadForValidation = {
        numero_guia,
        peso_neto: Number(peso_neto),
        peso_bruto: Number(peso_bruto),
        peso_tara: Number(peso_tara)
      };

      await validationSchema.validate(payloadForValidation, { abortEarly: false });
      // Si pasa validación, proceder
      setOpen(false);
      await update_order_data();
    } catch (validationError: any) {
      if (validationError.inner && validationError.inner.length) {
        const messages = validationError.inner.map((e: any) => e.message).join('\n');
        notification.error('Errores en el formulario', messages);
      } else {
        notification.error(
          'Errores en el formulario',
          validationError.message || 'Errores en el formulario'
        );
      }
    }
  };
  useEffect(() => {
    get_order_data();
  }, []);

  return (
    <Card
      style={{ padding: 20, backgroundColor: '#fafafa', color: '#444', margin: '0 auto' }}
      className="max-w-3xl"
    >
      <Typography variant="h5" align="center">
        Orden #{id}
      </Typography>
      <Divider style={{ backgroundColor: '#555', margin: '10px 0' }} />
      <div style={{ overflowY: 'auto', maxHeight: 500 }}>
        <Typography variant="h6">Datos de la Orden</Typography>
        {/* <p>Cliente</p>
               <Input
                    fullWidth
                    value={client}
                    onChange={(e) => setClient(e.target.value)}
                    placeholder="Cliente"
                    disabled
                    style={{ marginBottom: 10 }}
                />
                <p>Fecha</p>
                <Input
                    fullWidth
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    placeholder="Fecha"
                    disabled
                    style={{ marginBottom: 10 }}
                />
                <p>Hora de Salida</p>
                <Input
                    fullWidth
                    value={hora_salida}
                    onChange={(e) => setHora_salida(e.target.value)}
                    placeholder="Hora de Salida"
                    disabled
                    style={{ marginBottom: 10 }}
                /> */}
        <p>Estado {estado_id}</p>
        {/*  <Input
                    fullWidth
                    value={estado}
                    onChange={(e) => setEstado(e.target.value)}
                    placeholder="Estado"
                    style={{ marginBottom: 10 }}
                />
                */}
        <select
          value={estado_id}
          onChange={(e) => setEstado_id(parseInt(e.target.value))}
          disabled={estado_id === 5 ? true : false}
          style={{
            width: '100%',
            marginBottom: 10,
            padding: 10,
            borderRadius: 5,
            border: '1px solid #ccc'
          }}
        >
          {steps.map((step: any) => (
            <option key={step.id} value={step.orden}>
              {step.nombre}
            </option>
          ))}
        </select>
        {/*                 <p>Material</p>
                <Input
                    fullWidth
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                    placeholder="Material"
                    disabled
                    style={{ marginBottom: 10 }}
                /> */}
        {/*   <p>Peso</p>
                <Input
                    fullWidth
                    value={peso}
                    disabled
                    onChange={(e) => setPeso(e.target.value)}
                    placeholder="Peso"
                    style={{ marginBottom: 10 }}
                /> */}
        {/*  <p>Total</p>
                <Input
                    fullWidth
                    value={total}
                    onChange={(e) => setTotal(e.target.value)}
                    placeholder="Total"
                    disabled
                    style={{ marginBottom: 10 }}
                /> */}
        {/* <p>Usuario</p>
                <Input
                    fullWidth
                    value={usuario}
                    disabled
                    onChange={(e) => setUsuario(e.target.value)}
                    placeholder="Usuario"
                    style={{ marginBottom: 10 }}
                />
                <p>Vehiculos Totales</p>
                <Input
                    fullWidth
                    value={vehiculos_totales}
                    onChange={(e) => setVehiculos_totales(e.target.value)}
                    placeholder="Vehiculos Totales"
                    disabled
                    style={{ marginBottom: 10 }}
                /> */}
        {/*  <p>Puerto de Salida</p>
                <Input
                    fullWidth
                    value={puerto_salida_nombre}
                    onChange={(e) => setPuerto_salida_nombre(e.target.value)}
                    placeholder="Puerto de Salida"
                    disabled
                    style={{ marginBottom: 10 }}
                />
                <p>Puerto de Destino</p>
                <Input
                    fullWidth
                    value={puerto_destino_nombre}
                    disabled
                    onChange={(e) => setPuerto_destino_nombre(e.target.value)}
                    placeholder="Puerto de Destino"
                    style={{ marginBottom: 10 }}
                /> */}
        <p>Documento Guia 1</p>
        {/* <Input
                    fullWidth
                    value={documento_path}
                    onChange={(e) => setDocumento_path(e.target.value)}
                    placeholder="Documento Path"
                    style={{ marginBottom: 10 }}
                /> */}
        <img
          src={documento_path}
          alt={documento_path}
          style={{ width: '100%', height: 300, marginBottom: 20, objectFit: 'cover' }}
        />
        <p>Numero de Guia 1</p>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onloadend = () => {
                setDocumento_path(reader.result as string);
                setUpload_documento_path(reader.result as string);
                console.log(reader.result, 'reader result');
              };
              reader.readAsDataURL(file);
            }
          }}
          placeholder="Documento Path"
          style={{ marginBottom: 20, cursor: 'pointer' }}
        />
        <Input
          fullWidth
          value={numero_guia}
          onChange={(e) => setNumero_guia(e.target.value)}
          placeholder="Numero de Guia"
          style={{ marginBottom: 10 }}
        />
        <p>Peso Neto</p>
        <Input
          fullWidth
          value={peso_neto}
          onChange={(e) => setPeso_neto(e.target.value)}
          placeholder="Peso Neto"
          style={{ marginBottom: 10 }}
        />
        <p>Peso Bruto</p>
        <Input
          fullWidth
          value={peso_bruto}
          onChange={(e) => setPeso_bruto(e.target.value)}
          placeholder="Peso Bruto"
          style={{ marginBottom: 10 }}
        />
        <p>Peso Tara</p>
        <Input
          fullWidth
          value={peso_tara}
          onChange={(e) => setPeso_tara(e.target.value)}
          placeholder="Peso Tara"
          style={{ marginBottom: 10 }}
        />
        <p>Documento Guia 2</p>
        <img
          src={documento_path2}
          alt={documento_path2}
          style={{ width: '100%', height: 300, marginBottom: 20, objectFit: 'cover' }}
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onloadend = () => {
                setDocumento_path2(reader.result as string);
                setUpload_documento_path2(reader.result as string);
                console.log(reader.result, 'reader result');
              };
              reader.readAsDataURL(file);
            }
          }}
          placeholder="Documento Path 2"
          style={{ marginBottom: 20, cursor: 'pointer' }}
        />
        <p>Numero de Guia 2</p>
        <Input
          fullWidth
          value={numero_guia2}
          onChange={(e) => setNumero_guia2(e.target.value)}
          placeholder="Numero de Guia 2"
          style={{ marginBottom: 10 }}
        />

        <p>Peso Neto 2</p>

        <Input
          fullWidth
          value={peso_neto2}
          onChange={(e) => setPeso_neto2(e.target.value)}
          placeholder="Peso Neto 2"
          style={{ marginBottom: 10 }}
        />
        <p>Peso Bruto 2</p>
        <Input
          fullWidth
          value={peso_bruto2}
          onChange={(e) => setPeso_bruto2(e.target.value)}
          placeholder="Peso Bruto 2"
          style={{ marginBottom: 10 }}
        />
        <p>Peso Tara 2</p>
        <Input
          fullWidth
          value={peso_tara2}
          onChange={(e) => setPeso_tara2(e.target.value)}
          placeholder="Peso Tara 2"
          style={{ marginBottom: 10 }}
        />
        <p>Guia de Remision</p>
        <Input
          fullWidth
          value={guia_remision}
          onChange={(e) => setGuia_remision(e.target.value)}
          placeholder="Guia de Remision"
          style={{ marginBottom: 10 }}
        />
      </div>
      <div style={{ display: 'flex', alignContent: 'center', justifyContent: 'center' }}>
        {loading && (
          <div style={{ marginTop: 20 }}>
            <Typography variant="body1">Cargando...</Typography>
          </div>
        )}
        <Button
          variant="contained"
          color="primary"
          disabled={disabled || estado_id === 5}
          onClick={() => setOpen(true)}
          style={{ marginTop: 20 }}
        >
          Actualizar
        </Button>
      </div>
      <Modal open={open} onClose={() => setOpen(false)}>
        <div style={{ padding: 20, backgroundColor: '#444', margin: '20% auto', width: 300 }}>
          <Typography variant="h6" align="center" style={{ color: '#fff' }}>
            ¿Estas seguro de actualizar la orden?
          </Typography>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button
            onClick={() => {
              // Validar y luego actualizar
              validateAndUpdate();
            }}
            color="primary"
          >
            Continuar
          </Button>
        </div>
      </Modal>
    </Card>
  );
};

export default Step;

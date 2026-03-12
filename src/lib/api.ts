import { FetchData } from '@/utils/FetchData';

export const current_user = async () => {
  //localStorage.setItem('session', JSON.stringify({ id, username }));
  const session = localStorage.getItem('session');
  const user = JSON.parse(session || '{}');
  return user;
};

export const get_order_conductor = async (id: string | number, user_id: string | number) => {
  return await FetchData(`ordenes_conductor/${id}/${user_id}`, 'GET');
};

export const get_count_travel = async (id: string | number, user_id: string | number) => {
  return await FetchData(`ordenes_contar_vueltas/${id}/${user_id}`, 'GET');
};

export const get_order_travels = async (id: number, vehiculo_id: number) => {
  return await FetchData(`ordenes_viajes_detalles/${id}/${vehiculo_id}`, 'GET');
};

export const get_orders_status = async () => {
  return await FetchData('ordenes_estados', 'GET');
};

export const get_orders_vehicles = async (id: number) => {
  return await FetchData(`ordenes/vehiculos/${id}`, 'GET');
};

export const update_order_travel = async (body: any) => {
  return await FetchData('ordenes_viajes_detalles', 'PUT', body);
};

export const update_order_to_end = async (order_id: number) => {
  return await FetchData(`finalizar_orden/${order_id}`, 'GET');
};

export const get_observation_order_data = async (id: number, conductor_id: number) => {
  return await FetchData(`ordenes_observaciones/${id}/${conductor_id}`, 'GET');
};

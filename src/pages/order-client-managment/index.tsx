import { Fragment, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Container } from '@/components/container';
import { CrudDataGrid } from '@/components/data-grid/DataGridComponente';
import { AuthContext } from '@/auth/providers/JWTProvider';

// Componente principal simplificado que usa CrudDataGrid
const OrderClientManagement = () => {
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);
  const currentUser = authContext?.currentUser;

  return (
    <Fragment>
      <Container>
        <CrudDataGrid
          title="Mis Órdenes"
          columns={[
            { field: 'id', headerName: 'Orden #', width: 120 },
            { field: 'cliente_nombre', headerName: 'Cliente', flex: 1 },
            { field: 'usuario_id', headerName: 'Usuario ID', flex: 1 },
            { field: 'created_at', headerName: 'Fecha Creación', flex: 1 },
            { field: 'total', headerName: 'Total', flex: 1 },
            { field: 'peso_total', headerName: 'Peso Total', flex: 1 },
            { field: 'vehiculos_totales', headerName: 'Vehículos Totales', flex: 1 },
            { field: 'fecha', headerName: 'Fecha', flex: 1 },
            { field: 'hora_salida', headerName: 'Hora Salida', flex: 1 }
          ]}
          mode="table"
          endpoint={`ordenes_usuarios/${currentUser?.id}`}
        />
      </Container>
    </Fragment>
  );
};

export { OrderClientManagement };

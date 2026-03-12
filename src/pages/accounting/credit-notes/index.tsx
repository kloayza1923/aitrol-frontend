import React from 'react';
import { Container } from '@/components/container';
import { CrudDataGrid } from '@/components/data-grid/DataGridComponente';
import { GridColDef } from '@mui/x-data-grid';
import { Button, Stack } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';

export default function CreditNotesIndex() {
  const navigate = useNavigate();

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 80 },
    {
      field: 'numero',
      headerName: 'Número',
      flex: 1,
      minWidth: 160
    },
    {
      field: 'cliente_nombre',
      headerName: 'Cliente',
      flex: 1,
      minWidth: 220
    },
    { field: 'created_at', headerName: 'Fecha', flex: 1, minWidth: 140 },
    {
      field: 'total',
      headerName: 'Total',
      flex: 1,
      minWidth: 120
    },
    { field: 'motivo', headerName: 'Motivo', flex: 1, minWidth: 120 }
  ];

  return (
    <Container>
      <CrudDataGrid
        title="Notas de Crédito"
        endpoint="/cont/notas-credito"
        columns={columns}
        onCreateClick={() => navigate('/accounting/credit-notes/create')}
        mode="redirect"
        showEdit={false}
        handleSearch={true}
      />
    </Container>
  );
}

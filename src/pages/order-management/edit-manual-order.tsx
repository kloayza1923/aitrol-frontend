import { Fragment, useEffect, useState } from 'react';
import { Container } from '@/components/container';
import { PageNavbar } from '@/pages/account';
import { useLayout } from '@/providers';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { FetchData } from '@/utils/FetchData';

const EditManualOrder = () => {
  const { currentLayout } = useLayout();
  const location = useNavigate();

  return (
    <Fragment>
      <Container>
        <div className="card min-w-full">
          <div className="card-header">
            <h3 className="card-title">Agrega una orden</h3>
            <p className="text-sm text-gray-500">Agrega una orden para un cliente</p>

            <div className="flex items-center gap-2">
              <button
                className="btn btn-primary flex justify-center grow"
                onClick={() => location('/order-management')}
              >
                Regresar
              </button>
            </div>
          </div>
        </div>
      </Container>
    </Fragment>
  );
};

export { EditManualOrder };

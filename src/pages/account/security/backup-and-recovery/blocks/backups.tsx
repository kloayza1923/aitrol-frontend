import { KeenIcon } from '@/components';

const Backup = () => {
  return (
    <div className="card">
      <div className="card-header mb-1">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
            <KeenIcon icon="backup" className="text-blue-600" />
          </div>
          <div>
            <h3 className="card-title">Backups</h3>
            <p className="text-sm text-gray-600">
              Revisa tus archivos respaldados y descarga copias según lo necesites.
            </p>
          </div>
        </div>
      </div>
      <div className="card-body">
        <div className="text-sm text-gray-500">
          No se han encontrado respaldos recientes.
        </div>
      </div>
    </div>
  );
};

export { Backup };

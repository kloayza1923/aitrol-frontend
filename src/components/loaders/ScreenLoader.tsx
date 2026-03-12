import { toAbsoluteUrl } from '@/utils';

const ScreenLoader = () => {
  return (
    <div className="flex flex-col items-center justify-center fixed inset-0 z-50 bg-coal-500/95 backdrop-blur-sm transition-opacity duration-700 ease-in-out">
      <div className="flex flex-col items-center gap-6">
        {/* Logo con animación de pulso suave */}
        <img
          className="h-14 w-14 object-contain drop-shadow-[0_0_20px_rgba(27,132,255,0.3)] animate-pulse"
          src={toAbsoluteUrl('/media/app/mini-logo-circle-primary.svg')}
          alt="Logo"
        />

        {/* Barra de progreso animada */}
        <div className="flex flex-col items-center gap-2">
          <div className="h-1 w-32 overflow-hidden rounded-full bg-coal-400/50">
            <div className="h-full w-1/2 animate-loading-bar rounded-full bg-primary shadow-[0_0_10px_rgba(27,132,255,0.5)]" />
          </div>
          <p className="text-sm font-medium text-gray-400 tracking-wide">Cargando...</p>
        </div>
      </div>
    </div>
  );
};

export { ScreenLoader };

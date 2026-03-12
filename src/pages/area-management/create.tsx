import { Container } from '@/components/container';
import { useState } from 'react';
import { FetchData } from '@/utils/FetchData';
import { toast } from 'sonner';

const AreaCreate = () => {
  const [form, setForm] = useState({
    nombre: '',
    descripcion: ''
  });

  const [loading, setLoading] = useState(false);

  // Maneja cambios en los inputs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  // Maneja el submit del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await FetchData('/rrhh/areas', 'POST', form);
      if (res.mensaje) {
        toast.success(res.mensaje);
        setForm({ nombre: '', descripcion: '' });
      } else {
        toast.error('Error creando el área, por favor intente nuevamente');
      }
    } catch (error) {
      console.error('Error al crear área:', error);
      toast.error('Error al crear área, por favor intente nuevamente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Crear Nueva Área</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Datos del Área */}
        <div className="bg-white p-6 rounded-2xl shadow-md">
          <h3 className="text-lg font-semibold mb-4 border-b pb-2">Datos del Área</h3>

          <label className="block mb-4">
            <span className="block text-sm font-medium">Nombre</span>
            <input
              type="text"
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              className="input w-full"
              required
            />
          </label>

          <label className="block mb-4">
            <span className="block text-sm font-medium">Descripción</span>
            <textarea
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
              className="input w-full"
              rows={3}
            />
          </label>
        </div>

        {/* Botón */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
          >
            {loading ? 'Guardando...' : 'Crear Área'}
          </button>
        </div>
      </form>
    </Container>
  );
};

export default AreaCreate;

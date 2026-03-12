import { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useLocation, useNavigate } from 'react-router-dom';
import { FetchData } from '@/utils/FetchData';
import { Alert } from '@mui/material';
import clsx from 'clsx';
const passwordSchema = Yup.object().shape({
  newPassword: Yup.string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .required('La nueva contraseña es obligatoria'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('newPassword')], 'Las contraseñas deben coincidir')
    .required('Confirma tu nueva contraseña')
});

const ResetPasswordChange = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Obtener el token del query string
  const params = new URLSearchParams(location.search);
  const token = params.get('token');

  const formik = useFormik({
    initialValues: {
      newPassword: '',
      confirmPassword: ''
    },
    validationSchema: passwordSchema,
    onSubmit: async (values) => {
      setLoading(true);
      setStatus(null);
      try {
        if (!token) throw new Error('Token de recuperación no encontrado');
        const res = await FetchData('reset-password-token', 'POST', {
          token,
          new_password: values.newPassword
        });
        if (res.mensaje) {
          setSuccess(true);
          setStatus(res.mensaje);
          setTimeout(() => {
            navigate('/auth/reset-password/changed');
          }, 2000);
        } else {
          setStatus('No se pudo cambiar la contraseña.');
        }
      } catch (error: any) {
        setStatus(error?.response?.data?.detail || error.message || 'Error desconocido');
      }
      setLoading(false);
    }
  });

  return (
    <div className="card max-w-[370px] w-full">
      <form className="card-body flex flex-col gap-5 p-10" onSubmit={formik.handleSubmit}>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900">Nueva Contraseña</h3>
          <span className="text-2sm text-gray-600 font-medium">
            Ingresa tu nueva contraseña para continuar
          </span>
        </div>
        {status && <Alert variant={success ? 'success' : 'danger'}>{status}</Alert>}
        <div className="flex flex-col gap-1">
          <label className="form-label text-gray-900">Nueva contraseña</label>
          <label className="input">
            <input
              type="password"
              placeholder="Nueva contraseña"
              autoComplete="off"
              {...formik.getFieldProps('newPassword')}
              className={clsx(
                'form-control bg-transparent',
                { 'is-invalid': formik.touched.newPassword && formik.errors.newPassword },
                { 'is-valid': formik.touched.newPassword && !formik.errors.newPassword }
              )}
            />
          </label>
          {formik.touched.newPassword && formik.errors.newPassword && (
            <span role="alert" className="text-danger text-xs mt-1">
              {formik.errors.newPassword}
            </span>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <label className="form-label text-gray-900">Confirmar contraseña</label>
          <label className="input">
            <input
              type="password"
              placeholder="Confirmar nueva contraseña"
              autoComplete="off"
              {...formik.getFieldProps('confirmPassword')}
              className={clsx(
                'form-control bg-transparent',
                { 'is-invalid': formik.touched.confirmPassword && formik.errors.confirmPassword },
                { 'is-valid': formik.touched.confirmPassword && !formik.errors.confirmPassword }
              )}
            />
          </label>
          {formik.touched.confirmPassword && formik.errors.confirmPassword && (
            <span role="alert" className="text-danger text-xs mt-1">
              {formik.errors.confirmPassword}
            </span>
          )}
        </div>
        <button
          type="submit"
          className="btn btn-primary flex justify-center grow"
          disabled={loading || formik.isSubmitting}
        >
          {loading ? 'Cambiando...' : 'Cambiar contraseña'}
        </button>
      </form>
    </div>
  );
};

export { ResetPasswordChange };

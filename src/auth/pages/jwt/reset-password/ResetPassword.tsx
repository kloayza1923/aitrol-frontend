import clsx from 'clsx';
import { useFormik } from 'formik';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import * as Yup from 'yup';
import { useNavigate } from 'react-router-dom';

import { Alert, KeenIcon } from '@/components';
import { useLayout } from '@/providers';
import { FetchData } from '@/utils/FetchData';

const initialValues = {
  email: ''
};

const forgotPasswordSchema = Yup.object().shape({
  email: Yup.string()
    .min(3, 'Minimum 3 symbols')
    .max(50, 'Maximum 50 symbols')
    .required('Email is required')
});

const ResetPassword = () => {
  const [loading, setLoading] = useState(false);
  const [hasErrors, setHasErrors] = useState<boolean | undefined>(undefined);
  const [status, setStatus] = useState<string | null>(null);
  const { currentLayout } = useLayout();
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues,
    validationSchema: forgotPasswordSchema,
    onSubmit: async (values, { setStatus, setSubmitting }) => {
      setLoading(true);
      setHasErrors(undefined);
      try {
        // Usar el API de recuperación de contraseña
        const res = await FetchData('forgot-password', 'POST', {
          nombre_usuario: values.email
        });
        if (res.mensaje) {
          setHasErrors(false);
          setStatus(res.mensaje);
          setLoading(false);
          const params = new URLSearchParams();
          params.append('email', values.email);
          navigate({
            pathname:
              currentLayout?.name === 'auth-branded'
                ? '/auth/reset-password/check-email'
                : '/auth/classic/reset-password/check-email',
            search: params.toString()
          });
        } else {
          setHasErrors(true);
          setStatus('No se pudo enviar el correo de recuperación.');
          setLoading(false);
          setSubmitting(false);
        }
      } catch (error: any) {
        setHasErrors(true);
        setStatus(error?.response?.data?.detail || error.message || 'Error desconocido');
        setLoading(false);
        setSubmitting(false);
      }
    }
  });
  return (
    <div className="card max-w-[370px] w-full">
      <form
        className="card-body flex flex-col gap-5 p-10"
        noValidate
        onSubmit={formik.handleSubmit}
      >
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900">Your Email</h3>
          <span className="text-2sm text-gray-600 font-medium">
            Enter your email to reset password
          </span>
        </div>

        {hasErrors && <Alert variant="danger">{status || formik.status}</Alert>}

        {hasErrors === false && (
          <Alert variant="success">
            {status || 'Password reset link sent. Please check your email to proceed'}
          </Alert>
        )}

        <div className="flex flex-col gap-1">
          <label className="form-label text-gray-900">Email</label>
          <label className="input">
            <input
              type="email"
              placeholder="email@email.com"
              autoComplete="off"
              {...formik.getFieldProps('email')}
              className={clsx(
                'form-control bg-transparent',
                { 'is-invalid': formik.touched.email && formik.errors.email },
                {
                  'is-valid': formik.touched.email && !formik.errors.email
                }
              )}
            />
          </label>
          {formik.touched.email && formik.errors.email && (
            <span role="alert" className="text-danger text-xs mt-1">
              {formik.errors.email}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-5 items-stretch">
          <button
            type="submit"
            className="btn btn-primary flex justify-center grow"
            disabled={loading || formik.isSubmitting}
          >
            {loading ? 'Please wait...' : 'Continue'}
          </button>

          <Link
            to={currentLayout?.name === 'auth-branded' ? '/auth/login' : '/auth/classic/login'}
            className="flex items-center justify-center text-sm gap-2 text-gray-700 hover:text-primary"
          >
            <KeenIcon icon="black-left" />
            Back to Login
          </Link>
        </div>
      </form>
    </div>
  );
};

export { ResetPassword };

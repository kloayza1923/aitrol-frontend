import { type MouseEvent, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
// clsx removed — not used in this MUI-based version
import * as Yup from 'yup';
import { useFormik } from 'formik';
import { toAbsoluteUrl } from '@/utils';
import {
  TextField,
  Button,
  Checkbox,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Paper,
  Typography,
  Box,
  Avatar
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useAuthContext } from '@/auth';
import { useLayout, useCompany } from '@/providers';
import { Alert } from '@/components';

const loginSchema = Yup.object().shape({
  email: Yup.string()
    .min(3, 'Minimum 3 symbols')
    .max(50, 'Maximum 50 symbols')
    .required('Email is required'),
  password: Yup.string()
    .min(3, 'Minimum 3 symbols')
    .max(50, 'Maximum 50 symbols')
    .required('Password is required'),
  remember: Yup.boolean()
});

const initialValues = {
  email: '',
  password: '',
  remember: false
};

const Login = () => {
  const [loading, setLoading] = useState(false);
  const { login } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';
  const [showPassword, setShowPassword] = useState(false);
  const { currentLayout } = useLayout();
  const { company } = useCompany();

  // Obtener logo desde la empresa o usar fallback
  const logoUrl = company?.logo
    ? company.logo.startsWith('http')
      ? company.logo
      : import.meta.env.VITE_APP_API_URL + company.logo
    : toAbsoluteUrl('/media/app/logo.jpg');

  const formik = useFormik({
    initialValues: {
      ...initialValues,
      email: localStorage.getItem('email') || '',
      remember: Boolean(localStorage.getItem('email'))
    },
    validationSchema: loginSchema,
    onSubmit: async (values, { setStatus, setSubmitting }) => {
      setLoading(true);

      try {
        if (!login) {
          throw new Error('JWTProvider is required for this form.');
        }

        await login(values.email, values.password);

        if (values.remember) {
          localStorage.setItem('email', values.email);
        } else {
          localStorage.removeItem('email');
        }

        // `login` now saves sucursales and default sucursal in localStorage
        navigate(from, { replace: true });
      } catch {
        setStatus('El usuario o la contraseña son incorrectos.');
        setSubmitting(false);
      }
      setLoading(false);
    }
  });

  const togglePassword = (event?: MouseEvent<HTMLButtonElement>) => {
    event?.preventDefault();
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-2">
      <Paper
        elevation={24}
        className="w-full max-w-md overflow-hidden"
        sx={{
          borderRadius: '16px',
          backgroundColor: 'background.paper',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <Box className="p-8 md:p-6">
          {/* Logo */}
          <Box className="flex justify-center mb-6">
            <Avatar
              src={logoUrl}
              alt="Logo"
              sx={{
                width: 80,
                height: 80,
                bgcolor: 'primary.main',
                border: '3px solid',
                borderColor: 'primary.main',
                borderOpacity: 0.3,
                boxShadow: (theme) => `0 4px 20px ${theme.palette.primary.main}40`
              }}
            />
          </Box>

          {/* Title */}
          <Typography
            variant="h4"
            className="mb-6 t-12 font-bold text-center"
            sx={{ color: 'text.primary', marginBottom: 2 }}
          >
            {company?.razon_social || 'Panel Financiero'}
          </Typography>
          <Typography
            variant="body2"
            className="mb-8 t-12 text-center"
            sx={{ color: 'text.secondary', marginBottom: 2 }}
          >
            ¡Bienvenido de nuevo! Por favor inicia sesión para continuar
          </Typography>

          {/* Error Alert */}
          {formik.status && (
            <Box className="mb-4">
              <Alert variant="danger">{formik.status}</Alert>
            </Box>
          )}

          {/* Form */}
          <form onSubmit={formik.handleSubmit} noValidate className="space-y-5">
            {/* Email Field */}
            <Box>
              <Typography
                variant="caption"
                sx={{ color: 'text.secondary', mb: 1, display: 'block' }}
              >
                Nombre de usuario
              </Typography>
              <TextField
                fullWidth
                placeholder="Ingresa tu correo o usuario"
                {...formik.getFieldProps('email')}
                error={formik.touched.email && Boolean(formik.errors.email)}
                helperText={formik.touched.email && formik.errors.email}
              />
            </Box>

            {/* Password Field */}
            <Box>
              <Typography
                variant="caption"
                sx={{ color: 'text.secondary', mb: 1, display: 'block' }}
              >
                Contraseña
              </Typography>
              <TextField
                fullWidth
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                {...formik.getFieldProps('password')}
                error={formik.touched.password && Boolean(formik.errors.password)}
                helperText={formik.touched.password && formik.errors.password}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={togglePassword}
                        edge="end"
                        size="small"
                        sx={{ color: 'text.secondary' }}
                      >
                        {showPassword ? (
                          <VisibilityOff fontSize="small" />
                        ) : (
                          <Visibility fontSize="small" />
                        )}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Box>

            {/* Remember Me & Forgot Password */}
            <Box className="flex items-center justify-between">
              <FormControlLabel
                control={
                  <Checkbox
                    {...formik.getFieldProps('remember')}
                    size="small"
                    sx={{
                      color: 'rgba(255, 255, 255, 0.5)',
                      '&.Mui-checked': {
                        color: 'primary.main'
                      }
                    }}
                  />
                }
                label={
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    Recuérdame
                  </Typography>
                }
              />
              <Link
                to={
                  currentLayout?.name === 'auth-branded'
                    ? '/auth/reset-password'
                    : '/auth/classic/reset-password'
                }
                style={{
                  fontSize: '0.875rem',
                  color: 'var(--primary-color, #ff6b35)',
                  textDecoration: 'none',
                  fontWeight: 500
                }}
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </Box>

            {/* Sign In Button */}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading || formik.isSubmitting}
              sx={{
                backgroundColor: 'primary.main',
                color: 'primary.contrastText',
                fontWeight: 'bold',
                borderRadius: '8px',
                padding: '12px',
                textTransform: 'none',
                fontSize: '1rem',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.2)',
                '&:hover': {
                  backgroundColor: 'primary.dark'
                },
                '&:disabled': {
                  opacity: 0.5
                }
              }}
            >
              {loading ? 'Por favor espera...' : '→ Iniciar sesión'}
            </Button>

            {/* Divider */}
            {/* <Box className="relative my-6">
              <Box sx={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }} />
              <Typography
                variant="caption"
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  backgroundColor: 'rgba(20, 20, 20, 0.95)',
                  padding: '0 16px',
                  color: 'rgba(255, 255, 255, 0.5)'
                }}
              >
                o continuar con
              </Typography>
            </Box> */}

            {/* Social Login Buttons */}
            {/* <Box className="grid grid-cols-2 gap-3">
              <Button
                variant="outlined"
                sx={{
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                  color: 'rgba(255, 255, 255, 0.7)',
                  textTransform: 'none',
                  borderRadius: '8px',
                  '&:hover': {
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)'
                  }
                }}
              >
                🍎 Apple
              </Button>
              <Button
                variant="outlined"
                sx={{
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                  color: 'rgba(255, 255, 255, 0.7)',
                  textTransform: 'none',
                  borderRadius: '8px',
                  '&:hover': {
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)'
                  }
                }}
              >
                🔵 Google
              </Button>
            </Box> */}

            {/* Demo Credentials Notice */}
            {/* <Typography
              variant="caption"
              className="text-center block mt-6"
              sx={{ color: 'rgba(255, 255, 255, 0.5)' }}
            >
              Las credenciales de demostración están prellenadas.{' '}
              <span style={{ color: 'var(--primary-color, #ff6b35)', fontWeight: 600 }}>¡Listo para explorar!</span>
            </Typography> */}
          </form>
        </Box>
      </Paper>
    </div>
  );
};

export { Login };

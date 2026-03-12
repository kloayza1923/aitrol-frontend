import React, { useState } from 'react';
import { KeenIcon } from '@/components';
import { FetchData } from '@/utils/FetchData';
import { useAuthContext } from '@/auth';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNotification } from '@/hooks';

const PasswordSettings = () => {
  const { currentUser } = useAuthContext();
  const notification = useNotification();
  const [isOpen, setIsOpen] = useState(false);
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [saving, setSaving] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setPasswords((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCancel = () => {
    setIsOpen(false);
    setPasswords({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  };

  const validatePasswords = () => {
    if (!passwords.currentPassword) {
      notification.error('Ingresa tu contraseña actual');
      return false;
    }

    if (!passwords.newPassword) {
      notification.error('Ingresa una nueva contraseña');
      return false;
    }

    if (passwords.newPassword.length < 6) {
      notification.error('La nueva contraseña debe tener al menos 6 caracteres');
      return false;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      notification.error('Las contraseñas no coinciden');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validatePasswords() || !currentUser?.id) return;

    try {
      setSaving(true);

      // Enviar solo la nueva contraseña, la API maneja la validación
      await FetchData(`users/${currentUser.id}`, 'PUT', {
        password: passwords.newPassword
      });

      notification.success('Contraseña actualizada correctamente');
      handleCancel();
    } catch (error) {
      console.error('Error al actualizar contraseña:', error);
      notification.error(
        'Error al actualizar la contraseña',
        error instanceof Error ? error.message : undefined
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="card min-w-full shadow-lg border-0">
        <div className="card-header bg-gradient-to-r from-red-50 to-pink-50 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-full">
              <KeenIcon icon="security-user" className="text-red-600 text-lg" />
            </div>
            <div>
              <h3 className="card-title text-gray-800 mb-0">Seguridad de la Cuenta</h3>
              <p className="text-sm text-gray-600 mt-1">
                Gestiona tu contraseña y configuración de seguridad
              </p>
            </div>
          </div>
        </div>
        <div className="card-body p-0">
          <div className="p-6">
            {/* Sección de contraseña */}
            <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-full">
                  <KeenIcon icon="lock" className="text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Contraseña</p>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400 font-mono text-lg tracking-wider">
                      ••••••••••
                    </span>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                      Segura
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(true)}
                className="flex items-center justify-center w-9 h-9 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
              >
                <KeenIcon icon="notepad-edit" />
              </button>
            </div>

            {/* Información adicional de seguridad */}
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <KeenIcon icon="information-5" className="text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-semibold text-blue-900 mb-2">
                    Consejos de Seguridad
                  </h4>
                  <ul className="text-xs text-blue-800 space-y-1">
                    <li>• Usa al menos 8 caracteres con mayúsculas, minúsculas y números</li>
                    <li>• No compartas tu contraseña con nadie</li>
                    <li>• Cambia tu contraseña regularmente</li>
                    <li>• Evita usar información personal fácil de adivinar</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dialog de cambio de contraseña */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader className="pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-full">
                <KeenIcon icon="lock" className="text-red-600" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-gray-900">
                  Cambiar Contraseña
                </DialogTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Actualiza tu contraseña para mantener tu cuenta segura
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="py-4 space-y-6">
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <label
                htmlFor="current-password"
                className="block text-sm font-semibold text-gray-700"
              >
                <span className="flex items-center gap-2">
                  <KeenIcon icon="lock" className="text-red-500" />
                  Contraseña Actual *
                </span>
              </label>
              <Input
                id="current-password"
                type="password"
                value={passwords.currentPassword}
                onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                placeholder="Ingresa tu contraseña actual"
                className="bg-white border-gray-300 focus:border-red-500 focus:ring-red-500"
              />
            </div>

            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <label htmlFor="new-password" className="block text-sm font-semibold text-gray-700">
                <span className="flex items-center gap-2">
                  <KeenIcon icon="key" className="text-green-500" />
                  Nueva Contraseña *
                </span>
              </label>
              <Input
                id="new-password"
                type="password"
                value={passwords.newPassword}
                onChange={(e) => handleInputChange('newPassword', e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="bg-white border-gray-300 focus:border-green-500 focus:ring-green-500"
              />
              {passwords.newPassword && passwords.newPassword.length < 6 && (
                <div className="flex items-center gap-2 text-red-600">
                  <KeenIcon icon="information" className="text-xs" />
                  <p className="text-xs">La contraseña debe tener al menos 6 caracteres</p>
                </div>
              )}
            </div>

            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <label
                htmlFor="confirm-password"
                className="block text-sm font-semibold text-gray-700"
              >
                <span className="flex items-center gap-2">
                  <KeenIcon icon="check" className="text-blue-500" />
                  Confirmar Nueva Contraseña *
                </span>
              </label>
              <Input
                id="confirm-password"
                type="password"
                value={passwords.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                placeholder="Confirma tu nueva contraseña"
                className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
              {passwords.newPassword && passwords.confirmPassword && (
                <div>
                  {passwords.newPassword === passwords.confirmPassword ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <KeenIcon icon="check" className="text-xs" />
                      <span className="text-xs">Las contraseñas coinciden</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-red-600">
                      <KeenIcon icon="cross" className="text-xs" />
                      <span className="text-xs">Las contraseñas no coinciden</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Indicador de fortaleza de contraseña */}
            {passwords.newPassword && (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center gap-2 mb-3">
                  <KeenIcon icon="security-check" className="text-blue-600" />
                  <span className="text-sm font-semibold text-blue-900">
                    Fortaleza de la Contraseña
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <div
                      className={`w-2 h-2 rounded-full ${passwords.newPassword.length >= 6 ? 'bg-green-500' : 'bg-gray-300'}`}
                    ></div>
                    <span
                      className={
                        passwords.newPassword.length >= 6 ? 'text-green-700' : 'text-gray-500'
                      }
                    >
                      Al menos 6 caracteres
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div
                      className={`w-2 h-2 rounded-full ${/[A-Z]/.test(passwords.newPassword) ? 'bg-green-500' : 'bg-gray-300'}`}
                    ></div>
                    <span
                      className={
                        /[A-Z]/.test(passwords.newPassword) ? 'text-green-700' : 'text-gray-500'
                      }
                    >
                      Al menos una mayúscula
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div
                      className={`w-2 h-2 rounded-full ${/[0-9]/.test(passwords.newPassword) ? 'bg-green-500' : 'bg-gray-300'}`}
                    ></div>
                    <span
                      className={
                        /[0-9]/.test(passwords.newPassword) ? 'text-green-700' : 'text-gray-500'
                      }
                    >
                      Al menos un número
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="pt-4 border-t border-gray-100 gap-3">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={saving}
              className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <KeenIcon icon="cross" className="mr-2" />
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Actualizando...
                </>
              ) : (
                <>
                  <KeenIcon icon="key" className="mr-2" />
                  Actualizar Contraseña
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export { PasswordSettings };

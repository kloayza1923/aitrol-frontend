import React, { useState, useEffect } from 'react';
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
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { PasswordSettings } from './PasswordSettings';
import { useNotification } from '@/hooks';

interface UserData {
  id: number;
  nombre: string;
  apellido: string;
  nombre_usuario: string;
  email: string;
  foto: string | null;
  fecha_nacimiento: string;
  telefono: string;
  rol_id: number | null;
}

interface Role {
  id: number;
  nombre: string;
}

const EditablePersonalInfo = () => {
  const { currentUser } = useAuthContext();
  const notification = useNotification();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<UserData>>({});
  const [saving, setSaving] = useState(false);

  // Estados para el upload de imagen
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      if (!currentUser?.id) return;

      const response = await FetchData(`users_edit/${currentUser.id}`, 'GET');
      setUserData(response);

      // Cargar roles disponibles
      const rolesResponse = await FetchData('roles', 'GET');
      setRoles(rolesResponse || []);
    } catch (error) {
      console.error('Error al cargar datos del usuario:', error);
      notification.error(
        'Error al cargar los datos del perfil',
        error instanceof Error ? error.message : undefined
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [currentUser]);

  const handleEdit = (field: string) => {
    if (!userData) return;
    setEditingField(field);

    // Para el campo 'nombre', necesitamos cargar tanto nombre como apellido
    if (field === 'nombre') {
      setEditValues({
        nombre: userData.nombre,
        apellido: userData.apellido
      });
    } else {
      setEditValues({ [field]: userData[field as keyof UserData] });
    }
  };

  const handleCancel = () => {
    setEditingField(null);
    setEditValues({});
    setSelectedImage(null);
    setPreviewUrl(null);
  };

  const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        // Remover el prefijo "data:image/...;base64," para enviar solo el base64
        const base64Clean = base64.split(',')[1];
        resolve(base64Clean);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSave = async () => {
    if (!userData) return;

    try {
      setSaving(true);

      // Preparar datos completos del usuario con los campos editados
      const updateData: any = {
        // Campos requeridos por el backend (usar datos actuales si no se editaron)
        nombre: editValues.nombre || userData.nombre,
        apellido: editValues.apellido || userData.apellido,
        fecha_nacimiento: editValues.fecha_nacimiento || userData.fecha_nacimiento,
        telefono: editValues.telefono || userData.telefono,
        nombre_usuario: editValues.nombre_usuario || userData.nombre_usuario,
        email: editValues.email || userData.email
        // password: '', // No enviar password a menos que se esté cambiando específicamente
      };

      // Solo agregar rol_id si se editó o ya existe
      if (editValues.rol_id !== undefined || userData.rol_id) {
        updateData.rol_id = editValues.rol_id !== undefined ? editValues.rol_id : userData.rol_id;
      }

      // Si hay imagen seleccionada, convertirla a base64
      if (selectedImage) {
        const base64Image = await convertImageToBase64(selectedImage);
        updateData.foto = base64Image;
      }

      // Validar campos requeridos
      const requiredFields = [
        'nombre',
        'apellido',
        'email',
        'nombre_usuario',
        'telefono',
        'fecha_nacimiento'
      ];
      const missingFields = requiredFields.filter((field) => !updateData[field]?.toString().trim());

      if (missingFields.length > 0) {
        notification.error(
          `Por favor completa todos los campos requeridos: ${missingFields.join(', ')}`
        );
        return;
      }

      // Validar formato de email
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updateData.email)) {
        notification.error('Por favor ingresa un email válido');
        return;
      }

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updateData.email)) {
        notification.error('Por favor ingresa un email válido');
        return;
      }

      // Verificar si hay cambios reales
      const hasChanges = Object.keys(editValues).length > 0 || selectedImage;

      if (hasChanges) {
        await FetchData(`users/${userData.id}`, 'PUT', updateData);
        notification.success('Perfil actualizado correctamente');

        // Actualizar los datos locales con los nuevos valores
        const updatedUserData = { ...userData };

        // Aplicar cambios editados
        Object.keys(editValues).forEach((key) => {
          if (editValues[key as keyof UserData] !== undefined) {
            (updatedUserData as any)[key] = editValues[key as keyof UserData];
          }
        });

        // Si se actualizó la foto, actualizar con la preview temporalmente
        if (selectedImage && previewUrl) {
          updatedUserData.foto = previewUrl;
        }

        setUserData(updatedUserData);

        // Recargar datos del servidor para asegurar consistencia
        setTimeout(() => {
          fetchUserData();
        }, 1000);
      } else {
        notification.info('No hay cambios para guardar');
      }

      handleCancel();
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      notification.error(
        'Error al actualizar el perfil',
        error instanceof Error ? error.message : undefined
      );
    } finally {
      setSaving(false);
    }
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        notification.error('Por favor selecciona una imagen válida');
        return;
      }

      // Validar tamaño (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        notification.error('La imagen no debe superar 5MB');
        return;
      }

      setSelectedImage(file);

      // Crear preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No especificado';
    try {
      return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const getRoleName = (rolId: number | null) => {
    if (!rolId) return 'Sin rol asignado';
    const role = roles.find((r) => r.id === rolId);
    return role?.nombre || 'Rol no encontrado';
  };

  if (loading) {
    return (
      <div className="card min-w-full">
        <div className="card-header">
          <h3 className="card-title">Información Personal</h3>
        </div>
        <div className="card-body">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="card min-w-full">
        <div className="card-header">
          <h3 className="card-title">Información Personal</h3>
        </div>
        <div className="card-body">
          <p className="text-center text-gray-500 py-8">
            No se pudieron cargar los datos del usuario
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="card min-w-full shadow-lg border-0">
        <div className="card-header bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full dark:bg-dark-700">
              <KeenIcon icon="profile-circle" className="text-blue-600 text-lg" />
            </div>
            <div>
              <h3 className="card-title text-gray-800 mb-0">Información Personal</h3>
              <p className="text-sm text-gray-600 mt-1">Gestiona tu información de perfil</p>
            </div>
          </div>
        </div>
        <div className="card-body p-0">
          <div className="divide-y divide-gray-100">
            <div className="p-6">
              {/* Sección de foto de perfil destacada */}
              <div className="flex items-center gap-6 mb-8 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="relative">
                  <Avatar className="h-20 w-20 border-4 border-white shadow-lg">
                    <AvatarImage
                      src={previewUrl || userData?.foto || undefined}
                      alt={`${userData?.nombre} ${userData?.apellido}`}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xl font-semibold">
                      {userData?.nombre?.charAt(0)}
                      {userData?.apellido?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    onClick={() => handleEdit('foto')}
                    className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-lg transition-colors"
                  >
                    <KeenIcon icon="camera" className="text-sm" />
                  </button>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-1">
                    {userData?.nombre} {userData?.apellido}
                  </h4>
                  <p className="text-gray-600 text-sm mb-2">@{userData?.nombre_usuario}</p>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Perfil Activo
                  </span>
                </div>
              </div>
            </div>

            {/* Información detallada en grid */}
            <div className="p-6">
              <div className="grid gap-6">
                {/* Nombre Completo */}
                <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                      <KeenIcon icon="profile-circle" className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Nombre Completo</p>
                      <p className="text-gray-900 font-semibold">
                        {userData?.nombre} {userData?.apellido}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleEdit('nombre')}
                    className="flex items-center justify-center w-9 h-9 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                  >
                    <KeenIcon icon="notepad-edit" />
                  </button>
                </div>

                {/* Nombre de Usuario */}
                <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-full">
                      <KeenIcon icon="user" className="text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Nombre de Usuario</p>
                      <p className="text-gray-900 font-semibold">@{userData?.nombre_usuario}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleEdit('nombre_usuario')}
                    className="flex items-center justify-center w-9 h-9 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-colors"
                  >
                    <KeenIcon icon="notepad-edit" />
                  </button>
                </div>

                {/* Email */}
                <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-full">
                      <KeenIcon icon="sms" className="text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Correo Electrónico</p>
                      <p className="text-gray-900 font-semibold">{userData?.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleEdit('email')}
                    className="flex items-center justify-center w-9 h-9 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors"
                  >
                    <KeenIcon icon="notepad-edit" />
                  </button>
                </div>

                {/* Teléfono */}
                <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 bg-orange-100 rounded-full">
                      <KeenIcon icon="phone" className="text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Teléfono</p>
                      <p className="text-gray-900 font-semibold">
                        {userData?.telefono || 'No especificado'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleEdit('telefono')}
                    className="flex items-center justify-center w-9 h-9 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-full transition-colors"
                  >
                    <KeenIcon icon="notepad-edit" />
                  </button>
                </div>

                {/* Fecha de Nacimiento */}
                <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 bg-pink-100 rounded-full">
                      <KeenIcon icon="calendar" className="text-pink-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Fecha de Nacimiento</p>
                      <p className="text-gray-900 font-semibold">
                        {formatDate(userData?.fecha_nacimiento)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleEdit('fecha_nacimiento')}
                    className="flex items-center justify-center w-9 h-9 text-gray-400 hover:text-pink-600 hover:bg-pink-50 rounded-full transition-colors"
                  >
                    <KeenIcon icon="notepad-edit" />
                  </button>
                </div>
                {/*Password*/}
                <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                  <PasswordSettings />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dialog de edición */}
      <Dialog open={!!editingField} onOpenChange={handleCancel}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader className="pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                <KeenIcon
                  icon={
                    editingField === 'nombre'
                      ? 'profile-circle'
                      : editingField === 'nombre_usuario'
                        ? 'user'
                        : editingField === 'email'
                          ? 'sms'
                          : editingField === 'telefono'
                            ? 'phone'
                            : editingField === 'fecha_nacimiento'
                              ? 'calendar'
                              : editingField === 'rol_id'
                                ? 'security-user'
                                : editingField === 'foto'
                                  ? 'camera'
                                  : 'notepad-edit'
                  }
                  className="text-blue-600"
                />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-gray-900">
                  Editar{' '}
                  {editingField === 'nombre'
                    ? 'Nombre Completo'
                    : editingField === 'nombre_usuario'
                      ? 'Nombre de Usuario'
                      : editingField === 'email'
                        ? 'Correo Electrónico'
                        : editingField === 'telefono'
                          ? 'Teléfono'
                          : editingField === 'fecha_nacimiento'
                            ? 'Fecha de Nacimiento'
                            : editingField === 'rol_id'
                              ? 'Rol del Sistema'
                              : editingField === 'foto'
                                ? 'Foto de Perfil'
                                : ''}
                </DialogTitle>
                <p className="text-sm text-gray-600 mt-1">
                  {editingField === 'foto'
                    ? 'Actualiza tu imagen de perfil'
                    : 'Modifica la información según sea necesario'}
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="py-4">
            {editingField === 'foto' && (
              <div className="space-y-6">
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                      <AvatarImage
                        src={previewUrl || userData?.foto || undefined}
                        alt="Preview"
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xl font-semibold">
                        {userData?.nombre?.charAt(0)}
                        {userData?.apellido?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    {previewUrl && (
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center">
                        <KeenIcon icon="check" className="text-xs" />
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-3">Vista previa de tu foto de perfil</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <label
                    htmlFor="image-upload"
                    className="block text-sm font-semibold text-gray-700"
                  >
                    Seleccionar nueva imagen
                  </label>
                  <div className="relative">
                    <Input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                  <div className="flex items-start gap-2">
                    <KeenIcon
                      icon="information-5"
                      className="text-blue-500 text-sm mt-0.5 flex-shrink-0"
                    />
                    <div className="text-xs text-gray-600">
                      <p>• Formatos permitidos: JPEG, PNG</p>
                      <p>• Tamaño máximo: 5MB</p>
                      <p>• Resolución recomendada: 400x400px</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {editingField === 'nombre' && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <label htmlFor="nombre" className="block text-sm font-semibold text-gray-700">
                      <span className="flex items-center gap-2">
                        <KeenIcon icon="profile-circle" className="text-blue-500" />
                        Nombre *
                      </span>
                    </label>
                    <Input
                      id="nombre"
                      value={editValues.nombre || ''}
                      onChange={(e) =>
                        setEditValues((prev) => ({ ...prev, nombre: e.target.value }))
                      }
                      placeholder="Ingresa tu nombre"
                      className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                    {editValues.nombre !== undefined && !editValues.nombre?.trim() && (
                      <div className="flex items-center gap-2 text-red-600">
                        <KeenIcon icon="information" className="text-xs" />
                        <p className="text-xs">El nombre es requerido</p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    <label htmlFor="apellido" className="block text-sm font-semibold text-gray-700">
                      <span className="flex items-center gap-2">
                        <KeenIcon icon="profile-circle" className="text-blue-500" />
                        Apellido *
                      </span>
                    </label>
                    <Input
                      id="apellido"
                      value={editValues.apellido || ''}
                      onChange={(e) =>
                        setEditValues((prev) => ({ ...prev, apellido: e.target.value }))
                      }
                      placeholder="Ingresa tu apellido"
                      className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                    {editValues.apellido !== undefined && !editValues.apellido?.trim() && (
                      <div className="flex items-center gap-2 text-red-600">
                        <KeenIcon icon="information" className="text-xs" />
                        <p className="text-xs">El apellido es requerido</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {editingField === 'nombre_usuario' && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <label htmlFor="usuario" className="block text-sm font-semibold text-gray-700">
                  <span className="flex items-center gap-2">
                    <KeenIcon icon="user" className="text-purple-500" />
                    Nombre de usuario *
                  </span>
                </label>
                <Input
                  id="usuario"
                  value={editValues.nombre_usuario || ''}
                  onChange={(e) =>
                    setEditValues((prev) => ({ ...prev, nombre_usuario: e.target.value }))
                  }
                  placeholder="Ingresa tu nombre de usuario"
                  className="bg-white border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                  required
                />
                <div className="space-y-2">
                  {editValues.nombre_usuario !== undefined &&
                    !editValues.nombre_usuario?.trim() && (
                      <div className="flex items-center gap-2 text-red-600">
                        <KeenIcon icon="information" className="text-xs" />
                        <p className="text-xs">El nombre de usuario es requerido</p>
                      </div>
                    )}
                  {editValues.nombre_usuario && editValues.nombre_usuario.length < 3 && (
                    <div className="flex items-center gap-2 text-red-600">
                      <KeenIcon icon="information" className="text-xs" />
                      <p className="text-xs">
                        El nombre de usuario debe tener al menos 3 caracteres
                      </p>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-gray-500">
                    <KeenIcon icon="information-5" className="text-xs" />
                    <p className="text-xs">Este será tu identificador único en el sistema</p>
                  </div>
                </div>
              </div>
            )}

            {editingField === 'email' && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                  <span className="flex items-center gap-2">
                    <KeenIcon icon="sms" className="text-green-500" />
                    Correo electrónico *
                  </span>
                </label>
                <Input
                  id="email"
                  type="email"
                  value={editValues.email || ''}
                  onChange={(e) => setEditValues((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="ejemplo@correo.com"
                  className="bg-white border-gray-300 focus:border-green-500 focus:ring-green-500"
                  required
                />
                <div className="space-y-2">
                  {editValues.email !== undefined && !editValues.email?.trim() && (
                    <div className="flex items-center gap-2 text-red-600">
                      <KeenIcon icon="information" className="text-xs" />
                      <p className="text-xs">El email es requerido</p>
                    </div>
                  )}
                  {editValues.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editValues.email) && (
                    <div className="flex items-center gap-2 text-red-600">
                      <KeenIcon icon="information" className="text-xs" />
                      <p className="text-xs">Ingresa un email válido</p>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-gray-500">
                    <KeenIcon icon="information-5" className="text-xs" />
                    <p className="text-xs">Usaremos este email para comunicaciones importantes</p>
                  </div>
                </div>
              </div>
            )}

            {editingField === 'telefono' && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <label htmlFor="telefono" className="block text-sm font-semibold text-gray-700">
                  <span className="flex items-center gap-2">
                    <KeenIcon icon="phone" className="text-orange-500" />
                    Número de teléfono *
                  </span>
                </label>
                <Input
                  id="telefono"
                  type="tel"
                  value={editValues.telefono || ''}
                  onChange={(e) => setEditValues((prev) => ({ ...prev, telefono: e.target.value }))}
                  placeholder="+1 (555) 123-4567"
                  className="bg-white border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                  required
                />
                <div className="space-y-2">
                  {editValues.telefono !== undefined && !editValues.telefono?.trim() && (
                    <div className="flex items-center gap-2 text-red-600">
                      <KeenIcon icon="information" className="text-xs" />
                      <p className="text-xs">El teléfono es requerido</p>
                    </div>
                  )}
                  {editValues.telefono &&
                    !/^\+?\d{8,15}$/.test(editValues.telefono.replace(/[\s\-()]/g, '')) && (
                      <div className="flex items-center gap-2 text-red-600">
                        <KeenIcon icon="information" className="text-xs" />
                        <p className="text-xs">Ingresa un número de teléfono válido</p>
                      </div>
                    )}
                  <div className="flex items-center gap-2 text-gray-500">
                    <KeenIcon icon="information-5" className="text-xs" />
                    <p className="text-xs">Incluye el código de país para mejor identificación</p>
                  </div>
                </div>
              </div>
            )}

            {editingField === 'fecha_nacimiento' && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <label htmlFor="fecha" className="block text-sm font-semibold text-gray-700">
                  <span className="flex items-center gap-2">
                    <KeenIcon icon="calendar" className="text-pink-500" />
                    Fecha de Nacimiento
                  </span>
                </label>
                <Input
                  id="fecha"
                  type="date"
                  value={editValues.fecha_nacimiento || ''}
                  onChange={(e) =>
                    setEditValues((prev) => ({ ...prev, fecha_nacimiento: e.target.value }))
                  }
                  className="bg-white border-gray-300 focus:border-pink-500 focus:ring-pink-500"
                />
                <div className="flex items-center gap-2 text-gray-500">
                  <KeenIcon icon="information-5" className="text-xs" />
                  <p className="text-xs">
                    Esta información es opcional y nos ayuda a personalizar tu experiencia
                  </p>
                </div>
              </div>
            )}

            {editingField === 'rol_id' && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <label htmlFor="rol" className="block text-sm font-semibold text-gray-700">
                  <span className="flex items-center gap-2">
                    <KeenIcon icon="security-user" className="text-indigo-500" />
                    Rol del Sistema
                  </span>
                </label>
                <Select
                  value={editValues.rol_id?.toString() || ''}
                  onValueChange={(value) =>
                    setEditValues((prev) => ({ ...prev, rol_id: parseInt(value) }))
                  }
                >
                  <SelectTrigger className="bg-white border-gray-300 focus:border-indigo-500 focus:ring-indigo-500">
                    <SelectValue placeholder="Selecciona un rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id.toString()}>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                          {role.nombre}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2 text-gray-500">
                  <KeenIcon icon="information-5" className="text-xs" />
                  <p className="text-xs">El rol determina los permisos y accesos en el sistema</p>
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
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <KeenIcon icon="check" className="mr-2" />
                  Guardar Cambios
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export { EditablePersonalInfo };

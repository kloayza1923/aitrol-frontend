import { useSettings } from '@/providers/SettingsProvider';

export const useSidebarThemeClass = () => {
  const { settings } = useSettings();
  const colorTheme = settings.colorTheme || 'default';

  const getThemeClass = () => {
    switch (colorTheme) {
      case 'ocean':
        return 'sidebar-ocean';
      case 'forest':
        return 'sidebar-forest';
      case 'sunset':
        return 'sidebar-sunset';
      case 'royal':
        return 'sidebar-royal';
      case 'custom':
        return 'sidebar-custom';
      default:
        return 'sidebar-default';
    }
  };

  return getThemeClass();
};

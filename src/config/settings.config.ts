import { type TKeenIconsStyle } from '../components/keenicons/types';

export type TSettingsThemeMode = 'light' | 'dark' | 'system';

export type TSettingsContainer = 'default' | 'fluid' | 'fixed';

export type TColorTheme = 'default' | 'ocean' | 'forest' | 'sunset' | 'royal' | 'custom';

export interface ICustomColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
}

export interface ISettings {
  themeMode: TSettingsThemeMode;
  container: TSettingsContainer;
  keeniconsStyle: TKeenIconsStyle;
  colorTheme?: TColorTheme;
  customColors?: ICustomColors;
}

// Default settings for the application
const defaultSettings: ISettings = {
  themeMode: 'dark', // Default to light mode for the application
  keeniconsStyle: 'filled', // Default to using filled KeenIcons style
  container: 'fixed', // Default container layout is set to fixed
  colorTheme: 'default' // Default color theme
};

export { defaultSettings };

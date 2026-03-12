import { type TLanguageCode } from '@/i18n';

export interface AuthModel {
  access_token: string;
  refreshToken?: string;
  api_token: string;
  nombre_usuario: string;
}

export interface UserModel {
  id: number;
  username: string;
  nombre_usuario: string;
  password: string | undefined;
  email: string;
  first_name: string;
  last_name: string;
  fullname?: string;
  occupation?: string;
  companyName?: string;
  phone?: string;
  roles?: number[];
  pic?: string;
  foto?: string;
  language?: TLanguageCode;
  auth?: AuthModel;
}

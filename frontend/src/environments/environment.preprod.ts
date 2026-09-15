import raw from './preprod.env';
import { list, parse } from './parse';

const env = parse(raw);

export const environment = {
  name: 'preprod',
  production: true,
  apiUrl: env['apiUrl'],
  defaultLanguage: env['defaultLanguage'],
  cryptoKey: env['cryptoKey'],
  // Unity WebGL ciktisinin adresi; icinde Unity'nin kendi index.html'i beklenir.
  unity: { url: env['unityUrl'] },
  weather: { url: env['weatherUrl'] },
  keycloak: {
    url: env['keycloakUrl'],
    realm: env['keycloakRealm'],
    clientId: env['keycloakClientId'],
    // Asagidakileri uygulama kullanmaz; keycloak/setup.ps1 realm'i
    // kurarken okur.
    origins: list(env['keycloakOrigins']),
    loginTheme: env['keycloakLoginTheme'],
    locales: list(env['keycloakLocales']),
  },
};

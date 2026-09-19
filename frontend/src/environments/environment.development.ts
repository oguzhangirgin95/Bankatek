import raw from './development.env';
import { list, parse } from './parse';

const env = parse(raw);

export const environment = {
  name: 'development',
  production: false,
  apiUrl: env['apiUrl'],
  defaultLanguage: env['defaultLanguage'],
  cryptoKey: env['cryptoKey'],
  // Unity WebGL ciktisinin adresi; icinde Unity'nin kendi index.html'i beklenir.
  unity: { url: env['unityUrl'] },
  // Cevrimdisi harita. Vektor karo arsivi, yazi tipi ve ikon atlasi kendi
  // sunucumuzdan gelir; bos birakilirsa harita yerine bilgi metni cikar.
  map: {
    tiles: env['mapTilesUrl'],
    glyphs: env['mapGlyphsUrl'],
    sprite: env['mapSpriteUrl'],
    // Il sinirlarinin GeoJSON adresi. Vektor karodaki boundary katmani
    // yalnizca cizgi tasiyor; il boyamak icin kapali alan gerekiyor.
    provinces: env['mapProvincesUrl'],
  },

  // Adres arama ve ters geokodlama sunucusu (Nominatim). Bos ise adres
  // ozellikleri kapanir, harita yine de acilir.
  geocode: { url: env['geocodeUrl'] },
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

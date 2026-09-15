FROM node:22-alpine AS build
WORKDIR /build

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG FE_API_URL
ARG FE_DEFAULT_LANGUAGE
ARG FE_CRYPTO_KEY
ARG FE_UNITY_URL
ARG FE_KEYCLOAK_URL
ARG FE_KEYCLOAK_REALM
ARG FE_KEYCLOAK_CLIENT_ID
ARG FE_KEYCLOAK_ORIGINS
ARG FE_KEYCLOAK_LOGIN_THEME
ARG FE_KEYCLOAK_LOCALES
ARG FE_WEATHER_URL

RUN set -eu; \
    for key in FE_API_URL FE_DEFAULT_LANGUAGE FE_CRYPTO_KEY FE_UNITY_URL FE_WEATHER_URL; do \
      eval "value=\${$key:-}"; \
      [ -n "$value" ] || { echo "Eksik build arg: $key"; exit 1; }; \
    done; \
    printf '%s\n' \
      "apiUrl=$FE_API_URL" \
      "defaultLanguage=$FE_DEFAULT_LANGUAGE" \
      "cryptoKey=$FE_CRYPTO_KEY" \
      "unityUrl=$FE_UNITY_URL" \
      "keycloakUrl=$FE_KEYCLOAK_URL" \
      "keycloakRealm=$FE_KEYCLOAK_REALM" \
      "keycloakClientId=$FE_KEYCLOAK_CLIENT_ID" \
      "keycloakOrigins=$FE_KEYCLOAK_ORIGINS" \
      "keycloakLoginTheme=$FE_KEYCLOAK_LOGIN_THEME" \
      "keycloakLocales=$FE_KEYCLOAK_LOCALES" \
      "weatherUrl=$FE_WEATHER_URL" \
      > src/environments/prod.env

RUN npm run build:prod

FROM node:22-alpine
WORKDIR /app

COPY --from=build /build/dist ./dist

ENV PORT=4000
EXPOSE 4000

CMD ["node", "dist/frontend/server/server.mjs"]

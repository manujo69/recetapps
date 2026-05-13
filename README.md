# RecetApps

Aplicación Angular 20 de gestión de recetas, estructurada con **arquitectura hexagonal** (Ports & Adapters).

> **Rama `feature/standalone-version`**: versión local autónoma sin backend. Los datos se almacenan en SQLite en Android y en memoria en web. No requiere servidor ni autenticación.

## Arquitectura Hexagonal

La arquitectura hexagonal separa el núcleo de negocio de los detalles de infraestructura y presentación. Cada feature se organiza en cuatro capas:

```
feature/
  domain/          # Núcleo: modelos e interfaces de repositorio (Ports)
  application/     # Casos de uso: servicios o signalStores
  infrastructure/  # Adaptadores: SQLite (Android) y mock (web)
  ui/              # Componentes Angular standalone
```

### Capas

| Capa | Responsabilidad | Ejemplos |
|------|----------------|---------|
| **domain** | Modelos de negocio e interfaces de repositorio (puertos) | `recipe.model.ts`, `recipe.repository.ts` |
| **application** | Casos de uso, lógica de negocio, orquestación | `recipe.store.ts`, `favorite.service.ts` |
| **infrastructure** | Implementaciones concretas de los repositorios | `recipe-sqlite.repository.ts`, `recipe-mock.repository.ts` |
| **ui** | Componentes Angular, plantillas, estilos | `recipe-list.component.ts` |

La capa `domain` no depende de ninguna otra. `application` solo conoce el dominio. `infrastructure` y `ui` implementan las interfaces definidas en `domain`.

### Selección de adaptador

La selección se realiza en `app.config.ts`:

| Plataforma | Adaptador |
|------------|-----------|
| Android (nativo) | SQLite (`@capacitor-community/sqlite`) |
| Web / desarrollo | Mock (en memoria) |

No existe adaptador HTTP en esta rama.

## Estructura de carpetas

```
src/
  app/
    app.ts                   # Componente raíz
    app.config.ts            # Providers globales y selección de adaptador
    app.routes.ts            # Definición de rutas (sin guards de auth)

    recipes/                 # Feature: recetas
      domain/
        recipe.model.ts
        recipe.repository.ts
      application/
        recipe.store.ts      # signalStore con estado reactivo
      infrastructure/
        recipe-sqlite.repository.ts
        recipe-mock.repository.ts
      ui/
        recipe-list/
        recipe-detail/
        recipe-form/

    favorites/               # Feature: favoritos
      domain/
        favorite.model.ts
        favorite.repository.ts
      application/
        favorite.service.ts
      infrastructure/
        favorite-sqlite.repository.ts
        favorite-mock.repository.ts

    categories/              # Feature: categorías
      domain/
        category.model.ts
        category.repository.ts
      application/
        category.store.ts
      infrastructure/
        category-sqlite.repository.ts
        category-mock.repository.ts

    shared/
      ui/
        app-header/

  main.ts
  styles.css

public/
  i18n/
    es.json

android/                     # Proyecto Android (Capacitor)
  app/
    build.gradle             # Signing config (lee android/key.properties)
    proguard-rules.pro
resources/
  icon.png                   # Icono fuente (≥ 1024×1024 px)
```

## Tech Stack

- **Framework**: Angular 20 (standalone components, sin NgModules)
- **Lenguaje**: TypeScript 5.9
- **Change detection**: Zone.js
- **Routing**: Angular Router
- **Estado**: `@ngrx/signals` v20 (`signalStore`) para estado de feature; `signal()` / `computed()` para estado local
- **UI**: PrimeNG 20 (tema Aura) + Tailwind CSS 4
- **i18n**: ngx-translate v17 (idioma por defecto: `es`)
- **Mobile**: Capacitor 8 (`@capacitor/android`)
- **Base de datos local**: `@capacitor-community/sqlite` (solo nativo)
- **Testing**: Karma + Jasmine
- **Build**: Angular CLI / esbuild
- **CSS**: metodología BEM

## Comandos

```bash
npm start          # Servidor de desarrollo (ng serve → http://localhost:4200)
npm run build      # Build de producción
npm test           # Tests unitarios (Karma)
npm run watch      # Build en modo watch
```

## Build y despliegue Android

### Sincronizar con el proyecto nativo

```bash
npm run build && npx cap sync android
```

### Generar bundle de release firmado (AAB)

Requiere Java 21 y el fichero `android/key.properties` con las credenciales del keystore.

```bash
cd android && JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64 ./gradlew bundleRelease
```

El AAB resultante se genera en:
```
android/app/build/outputs/bundle/release/app-release.aab
```

### Regenerar iconos Android

```bash
npx @capacitor/assets generate --android
```

Requiere un PNG cuadrado sin transparencia (≥ 1024×1024 px) en `resources/icon.png`.

### Abrir en Android Studio

```bash
npx cap open android
```

## Publicación en F-Droid

Esta rama está pensada para su distribución en [F-Droid](https://f-droid.org/). El proceso requiere:

1. Repositorio público con el código fuente
2. Fichero de metadatos en [fdroiddata](https://gitlab.com/fdroid/fdroiddata): `metadata/com.recetapps.app.yml`
3. Tag de release en git (`v1.0`, `v1.1`, etc.)

La firma de F-Droid es independiente de la firma de release local. Los usuarios que instalen desde F-Droid recibirán una firma diferente a los que instalen el APK directamente.

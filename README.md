# RecipeApp

Aplicación Angular 20 de gestión de recetas, estructurada con **arquitectura hexagonal** (Ports & Adapters).

## Arquitectura Hexagonal

La arquitectura hexagonal separa el núcleo de negocio de los detalles de infraestructura y presentación. Cada feature se organiza en tres capas bien definidas:

```
feature/
  domain/          # Núcleo: modelos e interfaces de repositorio (Ports)
  application/     # Casos de uso: servicios que orquestan el dominio
  infrastructure/  # Adaptadores externos: HTTP, mocks, interceptores
  ui/              # Adaptadores de presentación: componentes Angular
```

### Capas

| Capa | Responsabilidad | Ejemplos |
|------|----------------|---------|
| **domain** | Modelos de negocio e interfaces de repositorio (puertos) | `recipe.model.ts`, `recipe.repository.ts` |
| **application** | Casos de uso, lógica de negocio, orquestación | `recipe.service.ts`, `auth.service.ts` |
| **infrastructure** | Implementaciones concretas de los repositorios (adaptadores) | `recipe-http.repository.ts`, `recipe-mock.repository.ts` |
| **ui** | Componentes Angular, plantillas, estilos | `recipe-list.component.ts`, `login.component.ts` |

La capa `domain` no depende de ninguna otra. `application` solo conoce el dominio. `infrastructure` y `ui` implementan las interfaces definidas en `domain`.

## Estructura de carpetas

```
src/
  app/
    app.ts                   # Componente raíz
    app.config.ts            # Providers globales (router, HTTP, i18n)
    app.routes.ts            # Definición de rutas
    app.html / app.scss

    recipes/                 # Feature: recetas
      domain/
        recipe.model.ts      # Interfaces/tipos del dominio
        recipe.repository.ts # Puerto (interfaz) del repositorio
      application/
        recipe.service.ts    # Casos de uso (obtener, crear, etc.)
      infrastructure/
        recipe-http.repository.ts   # Adaptador HTTP real
        recipe-mock.repository.ts   # Adaptador mock para desarrollo/tests
      ui/
        recipe-list/         # Listado de recetas
        recipe-detail/       # Detalle de receta
        recipe-panel/        # Panel general de recetas
        recipe-add/          # Formulario de añadir receta
        recipe-ingredients/  # Subcomponente de ingredientes
        recipe-instructions/ # Subcomponente de instrucciones

    auth/                    # Feature: autenticación
      domain/
        auth.model.ts
        auth.repository.ts
      application/
        auth.service.ts
      infrastructure/
        auth-http.repository.ts
        auth-mock.repository.ts
        auth.interceptor.ts  # Interceptor HTTP para tokens
      ui/
        login/
        register/

    categories/              # Feature: categorías
      domain/
        category.model.ts
        category.repository.ts
      application/
        category.service.ts

    shared/                  # Componentes compartidos entre features
      ui/
        app-header/

  environments/              # Configuración por entorno
    environment.ts
    environment.dev.ts
    environment.production.ts

  main.ts
  styles.css

public/
  i18n/                      # Ficheros de traducción (ngx-translate)
    es.json
    ...
```

## Tech Stack

- **Framework**: Angular 20 (standalone components, sin NgModules)
- **Lenguaje**: TypeScript 5.9
- **Change detection**: Zone.js
- **Routing**: Angular Router
- **Forms**: Angular Forms
- **i18n**: ngx-translate v17 (idioma por defecto: `es`)
- **Testing**: Karma + Jasmine
- **Build**: Angular CLI / esbuild
- **CSS**: metodología BEM

## Dependencias externas

| Proyecto | Descripción |
|----------|-------------|
| [recetapps-back](https://github.com/manu/recetapps-back) | API REST backend que expone los endpoints de recetas, autenticación y categorías |

## Comandos

```bash
npm start          # Servidor de desarrollo (ng serve → http://localhost:4200)
npm run build      # Build de producción
npm test           # Tests unitarios (Karma)
npm run watch      # Build en modo watch
```

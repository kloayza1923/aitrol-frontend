# Guia de Contribucion - Aitrol ERP

Esta guia establece el flujo de trabajo y las convenciones que todo el equipo debe seguir para contribuir al proyecto.

---

## Estructura de Ramas

```
main (produccion estable)
  |
  └── develop (integracion de features)
        |
        ├── feature/nombre-feature (nuevas funcionalidades)
        ├── bugfix/nombre-bug (correcciones menores)
        ├── hotfix/nombre-hotfix (correcciones urgentes en prod)
        └── release/vX.Y.Z (preparacion de releases)
```

### Descripcion de cada rama

| Rama | Proposito | Se crea desde | Se mergea a |
|------|-----------|---------------|-------------|
| `main` | Codigo en produccion | - | - |
| `develop` | Integracion de desarrollo | `main` | `main` (via release) |
| `feature/*` | Nuevas funcionalidades | `develop` | `develop` |
| `bugfix/*` | Correcciones no urgentes | `develop` | `develop` |
| `hotfix/*` | Correcciones urgentes | `main` | `main` y `develop` |
| `release/*` | Preparacion de version | `develop` | `main` y `develop` |

---

## Convencion de Nombres para Ramas

El numero corresponde al issue de GitHub (MD = MD-DeveloperApps).

```
feature/MD-XX-descripcion-corta
bugfix/MD-XX-descripcion-corta
hotfix/MD-XX-descripcion-corta
release/vX.Y.Z
```

### Ejemplos

- `feature/MD-45-modulo-inventario`
- `bugfix/MD-67-fix-validacion-login`
- `hotfix/MD-89-parche-seguridad`
- `release/v1.2.0`

---

## Convencion de Commits

Usamos Conventional Commits con el numero de ticket al inicio para mantener un historial limpio y trazable.

### Formato

```
[MD-XX] <tipo>: <descripcion>

[cuerpo opcional]

[footer opcional]
```

El alcance (scope) es opcional. Si se usa:

```
[MD-XX] <tipo>(<alcance>): <descripcion>
```

### Tipos permitidos

| Tipo | Uso |
|------|-----|
| `feat` | Nueva funcionalidad |
| `fix` | Correccion de bug |
| `docs` | Cambios en documentacion |
| `style` | Formato, espacios, puntos y comas (sin cambios de codigo) |
| `refactor` | Refactorizacion de codigo |
| `test` | Agregar o modificar tests |
| `chore` | Tareas de mantenimiento, dependencias |
| `perf` | Mejoras de rendimiento |

### Ejemplos de commits

```
[MD-45] feat: agregar endpoint para consulta de stock

[MD-67] fix: corregir validacion de token JWT expirado

[MD-12] docs: actualizar instrucciones de instalacion

[MD-89] refactor(api): optimizar consultas de clientes

[MD-23] chore: actualizar dependencias de seguridad
```

### Referencia automatica de issues

Para cerrar automaticamente el issue de GitHub al hacer merge, agregar en el cuerpo:

```
[MD-45] feat: agregar filtro por fecha en ventas

Closes #45
```

Palabras clave que cierran issues:
- `Closes #XX`
- `Fixes #XX`
- `Resolves #XX`

Nota: El numero despues de Closes/Fixes debe ser el numero del issue en GitHub (#45), no MD-45.

### Reglas importantes

- Siempre iniciar con [MD-XX] donde XX es el numero del ticket
- Usar minusculas en el tipo y alcance
- La descripcion debe empezar con minuscula
- No usar punto final en la descripcion
- Maximo 72 caracteres en la primera linea
- Usar verbo en infinitivo (agregar, corregir, actualizar)

---

## Flujo de Trabajo Diario

### 1. Antes de empezar a trabajar

```bash
# Cambiar a develop y actualizar
git checkout develop
git pull origin develop
```

### 2. Crear rama para tu tarea

```bash
# Crear y cambiar a la nueva rama (usar numero del ticket MD-XX)
git checkout -b feature/MD-45-mi-funcionalidad
```

### 3. Desarrollar y hacer commits

```bash
# Verificar archivos modificados
git status

# Agregar archivos
git add .

# Hacer commit con mensaje descriptivo
git commit -m "[MD-45] feat: descripcion del cambio"
```

Para cerrar automaticamente el issue de GitHub al hacer merge:

```bash
git commit -m "[MD-45] feat: agregar nueva funcionalidad

Closes #45"
```

### 4. Mantener tu rama actualizada

```bash
# Traer cambios de develop periodicamente
git fetch origin
git merge origin/develop
```

### 5. Subir cambios y crear Pull Request

```bash
# Subir tu rama al repositorio remoto
git push -u origin feature/MD-45-mi-funcionalidad
```

Luego ve a GitHub y crea un Pull Request hacia `develop`.

---

## Pull Requests

### Antes de crear un PR

- [ ] El codigo compila sin errores
- [ ] Se ejecuto `yarn lint` y no hay errores
- [ ] Los commits siguen la convencion
- [ ] La rama esta actualizada con `develop`

### Proceso de revision

1. Crear PR en GitHub hacia `develop`
2. Asignar al menos 1 revisor
3. Esperar aprobacion
4. Resolver comentarios si los hay
5. El revisor hace merge despues de aprobar

### Template de PR

Al crear un PR, incluir:

```markdown
## Descripcion
[Breve descripcion del cambio]

## Tipo de cambio
- [ ] Nueva funcionalidad (feature)
- [ ] Correccion de bug (bugfix)
- [ ] Refactorizacion
- [ ] Documentacion
- [ ] Otro: ___

## Ticket relacionado
Closes #XX

## Checklist
- [ ] Mi codigo sigue las convenciones del proyecto
- [ ] He probado mis cambios localmente
- [ ] He actualizado la documentacion si es necesario
```

---

## Proceso de Release

Solo el Tech Lead o desarrolladores autorizados ejecutan este proceso.

### 1. Crear rama de release

```bash
git checkout develop
git pull origin develop
git checkout -b release/v1.2.0
```

### 2. Preparar release

- Actualizar version en `package.json`
- Actualizar CHANGELOG si existe
- Realizar pruebas finales

### 3. Finalizar release

```bash
# Merge a main via PR
# Crear tag despues del merge
git checkout main
git pull origin main
git tag -a v1.2.0 -m "Release v1.2.0"
git push origin v1.2.0

# Merge de vuelta a develop
git checkout develop
git merge main
git push origin develop
```

---

## Hotfix (Correcciones Urgentes)

Usar solo para bugs criticos en produccion.

### 1. Crear rama desde main

```bash
git checkout main
git pull origin main
git checkout -b hotfix/MD-99-descripcion-bug
```

### 2. Aplicar correccion

```bash
git add .
git commit -m "[MD-99] fix: corregir bug critico"
git push -u origin hotfix/MD-99-descripcion-bug
```

### 3. Crear PRs

- Un PR hacia `main`
- Un PR hacia `develop`

---

## Comandos Utiles

### Ver estado del repositorio

```bash
git status                    # Ver archivos modificados
git log --oneline -10         # Ver ultimos 10 commits
git branch -a                 # Ver todas las ramas
```

### Deshacer cambios

```bash
git checkout -- archivo.txt   # Descartar cambios en un archivo
git reset HEAD archivo.txt    # Quitar archivo del staging
git stash                     # Guardar cambios temporalmente
git stash pop                 # Recuperar cambios guardados
```

### Resolver conflictos

```bash
# Despues de un merge con conflictos
git status                    # Ver archivos en conflicto
# Editar archivos manualmente
git add archivo-resuelto.txt
git commit -m "fix: resolver conflictos de merge"
```

---

## Migraciones de Base de Datos

Las migraciones se manejan con **Alembic**. Los archivos viven en `services/migrations/versions/`.

---

### Requisitos previos

**1. Archivo `.env` configurado**

El archivo `services/.env` debe existir con las siguientes variables:

```
DB_USER=postgres
DB_PASSWORD=tu-password
DB_HOST=127.0.0.1
DB_PORT=5433
DB_NAME=horizon
```

**2. `psql` en el PATH (solo necesario para la migracion baseline)**

La primera migracion ejecuta un archivo `.sql` a traves de `psql`. En Windows, agrega el bin de PostgreSQL al PATH antes de correr:

```powershell
$env:PATH += ";C:\Program Files\PostgreSQL\17\bin"
```

En Mac/Linux `psql` generalmente ya esta en el PATH.

---

### Correr migraciones existentes

Desde la raiz del proyecto (`D:\repos\aitrol-erp`):

```bash
alembic upgrade head
```

Esto aplica todas las migraciones pendientes en orden.

**Si la base de datos ya existe y el baseline fue aplicado manualmente:**

```bash
# Marcar el baseline como ya aplicado sin volver a ejecutarlo
alembic stamp 20260301_00

# Luego aplicar el resto
alembic upgrade head
```

---

### Crear una nueva migracion

**Convencion de nombre para el archivo:**

```
YYYYMMDD_NN_descripcion_corta.py
```

Ejemplos:
- `20260310_02_add_tabla_examenes.py`
- `20260315_03_add_column_telefono_paciente.py`

**Paso 1 — Generar el archivo base:**

```bash
alembic revision -m "descripcion corta"
```

Esto crea un archivo en `services/migrations/versions/`. Renombralo siguiendo la convencion de nombre del proyecto.

**Paso 2 — Editar el archivo generado:**

```python
"""descripcion corta
Revision ID: 20260310_02
Revises: 20260301_01          # <-- ID de la migracion anterior
Create Date: 2026-03-10 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

revision = "20260310_02"
down_revision = "20260301_01"   # <-- debe apuntar a la revision anterior
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "nombre_tabla",
        sa.Column("id", sa.BigInteger(), primary_key=True),
        sa.Column("nombre", sa.String(length=255), nullable=False),
        # ... resto de columnas
        schema="salud",
    )


def downgrade():
    op.drop_table("nombre_tabla", schema="salud")
```

**Paso 3 — Verificar que la cadena de revisiones es correcta:**

```bash
alembic history
```

**Paso 4 — Aplicar la migracion:**

```bash
alembic upgrade head
```

---

### Comandos de referencia rapida

| Comando | Descripcion |
|---------|-------------|
| `alembic upgrade head` | Aplica todas las migraciones pendientes |
| `alembic current` | Muestra en que revision esta la DB actualmente |
| `alembic history` | Lista todas las migraciones en orden |
| `alembic downgrade -1` | Revierte la ultima migracion aplicada |
| `alembic downgrade base` | Revierte todas las migraciones |
| `alembic stamp <revision>` | Marca una revision como aplicada sin ejecutarla |

---

### Reglas para migraciones

1. **Nunca modificar una migracion ya mergeada a `develop` o `main`** — si necesitas corregir algo, crea una nueva migracion.
2. **Siempre implementar `downgrade()`** — permite revertir cambios en caso de error.
3. **Una migracion por cambio logico** — no agrupar tablas no relacionadas en una sola migracion.
4. **Probar upgrade y downgrade localmente** antes de hacer PR.
5. **El campo `down_revision` debe apuntar a la revision inmediata anterior** — verifica con `alembic history` antes de subir.

---

## Reglas del Equipo

1. **Nunca hacer push directo a `main` o `develop`** - siempre via PR
2. **Mantener PRs pequenos** - mas faciles de revisar
3. **Revisar PRs en menos de 24 horas**
4. **Comunicar bloqueos** - si un PR bloquea tu trabajo, avisar al equipo
5. **Probar antes de subir** - verificar que el codigo funciona localmente

---

## Contacto

Si tienes dudas sobre el flujo de trabajo, consulta con el Tech Lead del proyecto.

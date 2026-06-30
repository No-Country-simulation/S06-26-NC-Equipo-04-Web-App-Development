# S06-26-NC-Equipo-04-Web-App-Development - GobTech
# Request for Proposal Platform

## Estructura de repositorios
```bash
├── app/                 # Plataforma Web (Frontend UI)
├── core/                # Núcleo de reglas y configuraciones transversales
├── infrastructure/      # Configuración e implementaciones del Backend
├── modules/             # Lógica de negocio y casos de uso del Backend
└── shared/              # Recursos, tipos y utilidades compartidas
```
## Tecnologías
- React
- Typescript
- PostgreSQL
- Express

## Docker

### Requisitos
- Docker Engine 24+
- Docker Compose v2

### Levantar PostgreSQL
```bash
docker compose up -d
```

Esto inicia un contenedor con PostgreSQL 16 con las siguientes credenciales:

| Variable        | Valor      |
|-----------------|------------|
| Usuario         | `user_s26` |
| Contraseña      | `pass_s26` |
| Base de datos   | `s26_06`   |
| Puerto          | `5432`     |

### Verificar estado
```bash
docker compose ps
```

### Ver logs
```bash
docker compose logs -f
```

### Detener
```bash
docker compose down
```

### Eliminar datos persistentes
```bash
docker compose down -v
```

### Esquema de base de datos
La migración inicial se aplica automáticamente desde `infrastructure/database/schema.sql` al levantar el contenedor por primera vez. Si necesitas reiniciar desde cero, elimina el volumen con `docker compose down -v` y vuelve a ejecutar `docker compose up -d`.

### Conexión desde la aplicación
```
postgresql://user_s26:pass_s26@localhost:5432/s26_06
```
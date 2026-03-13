create table cont_plan_cuentas
(
    id            integer generated always as identity
        primary key,
    codigo        varchar(20)  not null
        unique
        constraint cont_plan_cuentas_codigo_uk
            unique,
    nombre        varchar(255) not null,
    tipo          char         not null,
    es_movimiento boolean   default true,
    id_usuario    integer
                               references usuarios
                                   on delete set null,
    created_at    timestamp default now(),
    updated_at    timestamp default now(),
    nivel         integer,
    id_padre      integer
        constraint cont_plan_cuentas_id_padre_fk
            references cont_plan_cuentas
            on delete set null,
    estado        boolean   default true
);

alter table cont_plan_cuentas
    owner to aitrolsystem;

create index idx_cont_plan_cuentas_id_padre
    on cont_plan_cuentas (id_padre);

create table cont_diario
(
    id             integer generated always as identity
        primary key,
    fecha          date        not null,
    descripcion    text,
    numero_asiento varchar(30) not null
        unique,
    id_usuario     integer     not null
        references usuarios,
    created_at     timestamp default now()
);

alter table cont_diario
    owner to aitrolsystem;

create table cont_diario_detalle
(
    id          integer generated always as identity
        primary key,
    id_diario   integer not null
        references cont_diario
            on delete cascade,
    id_cuenta   integer not null
        references cont_plan_cuentas,
    descripcion text,
    debe        numeric(14, 2) default 0,
    haber       numeric(14, 2) default 0,
    id_sucursal integer
        references sis_sucursal,
    id_usuario  integer not null
        references usuarios,
    constraint cont_diario_detalle_check
        check (((debe > (0)::numeric) AND (haber = (0)::numeric)) OR ((haber > (0)::numeric) AND (debe = (0)::numeric)))
);

alter table cont_diario_detalle
    owner to aitrolsystem;

create trigger trg_cont_diario_detalle_mayor
    after insert
    on cont_diario_detalle
    for each row
execute procedure fn_cont_insert_mayor();

create table cont_mayor
(
    id          integer generated always as identity
        primary key,
    id_asiento  integer not null
        references cont_diario,
    id_cuenta   integer not null
        references cont_plan_cuentas,
    fecha       date    not null,
    descripcion text,
    debe        numeric(14, 2),
    haber       numeric(14, 2),
    saldo       numeric(14, 2),
    tipo_mov    varchar(20),
    id_sucursal integer
        references sis_sucursal,
    id_usuario  integer
                        references usuarios
                            on delete set null
);

alter table cont_mayor
    owner to aitrolsystem;

create table cont_enlace_compras
(
    id         integer generated always as identity
        primary key,
    id_compra  integer
        references inv_compras_cab,
    id_asiento integer
        references cont_diario
);

alter table cont_enlace_compras
    owner to aitrolsystem;

create table cont_enlace_ventas
(
    id         integer generated always as identity
        primary key,
    id_venta   integer
        references inv_ventas_cab,
    id_asiento integer
        references cont_diario
);

alter table cont_enlace_ventas
    owner to aitrolsystem;

create table cont_enlace_inventario
(
    id         integer generated always as identity
        primary key,
    id_ajuste  integer
        references inv_ajustes_stock,
    id_asiento integer
        references cont_diario
);

alter table cont_enlace_inventario
    owner to aitrolsystem;


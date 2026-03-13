--
-- PostgreSQL database dump
--

\restrict FvtS7d0l70uhKIZRV1E3ae9f9pPLx4CyhFOQcbwlSzRKe1WKSawDySAxWYoDe7B

-- Dumped from database version 14.20 (Ubuntu 14.20-0ubuntu0.22.04.1)
-- Dumped by pg_dump version 14.20 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

DROP DATABASE IF EXISTS horizon;
--
-- Name: horizon; Type: DATABASE; Schema: -; Owner: aitrolsystem
--

CREATE DATABASE horizon WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE = 'C.UTF-8';


ALTER DATABASE horizon OWNER TO aitrolsystem;

\unrestrict FvtS7d0l70uhKIZRV1E3ae9f9pPLx4CyhFOQcbwlSzRKe1WKSawDySAxWYoDe7B
\connect horizon
\restrict FvtS7d0l70uhKIZRV1E3ae9f9pPLx4CyhFOQcbwlSzRKe1WKSawDySAxWYoDe7B

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: dbo; Type: SCHEMA; Schema: -; Owner: aitrolsystem
--

CREATE SCHEMA dbo;


ALTER SCHEMA dbo OWNER TO aitrolsystem;

--
-- Name: salud; Type: SCHEMA; Schema: -; Owner: aitrolsystem
--

CREATE SCHEMA salud;


ALTER SCHEMA salud OWNER TO aitrolsystem;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA dbo;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: convertir_cotizacion_a_venta(integer, integer); Type: FUNCTION; Schema: dbo; Owner: aitrolsystem
--

CREATE FUNCTION dbo.convertir_cotizacion_a_venta(p_cotizacion_id integer, p_usuario_id integer) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_venta_id integer;
BEGIN
    -- 1️⃣ Verificar que la cotización exista
    IF NOT EXISTS (
        SELECT 1 FROM inv_cotizaciones_cab
        WHERE id = p_cotizacion_id
    ) THEN
        RAISE EXCEPTION 'La cotización % no existe o no puede ser convertida', p_cotizacion_id;
    END IF;

    -- 2️⃣ Insertar en inv_ventas_cab
    INSERT INTO inv_ventas_cab (
        cliente_id,
        numero_factura,
        fecha,
        subtotal,
        iva,
        total,
        estado,
        fecha_creacion,
        id_sucursal,
        id_usuario,
        observaciones,
        descuento
    )
    SELECT
        c.cliente_id,
        'TEMP',  -- o nextval('seq_numero_factura')
        NOW()::date,
        c.subtotal,
        c.iva,
        c.total,
        'PENDIENTE',
        NOW(),
        c.id_sucursal,
        p_usuario_id,
        c.observaciones,
        c.descuento
    FROM inv_cotizaciones_cab c
    WHERE c.id = p_cotizacion_id
    RETURNING id INTO v_venta_id;

    -- 3️⃣ Insertar detalles en inv_ventas_det
    INSERT INTO inv_ventas_det (
        venta_id,
        producto_id,
        cantidad,
        precio_unitario,
        subtotal,
        iva,
        total,
        descuento,
        almacen_id,
        percha_id
    )
    SELECT
        v_venta_id,
        d.producto_id,
        d.cantidad,
        d.precio_unitario,
        d.subtotal,
        d.iva,
        d.total,
        d.descuento,
        d.almacen_id,
        d.percha_id
    FROM inv_cotizaciones_det d
    WHERE d.cotizacion_id = p_cotizacion_id;

    -- 4️⃣ Actualizar el estado de la cotización
    UPDATE inv_cotizaciones_cab
    SET estado = 'CONV',
        fecha_conversion = NOW(),
        id_venta = v_venta_id
    WHERE id = p_cotizacion_id;

    -- 5️⃣ Retornar el ID de la nueva venta
    RETURN v_venta_id;
END;
$$;


ALTER FUNCTION dbo.convertir_cotizacion_a_venta(p_cotizacion_id integer, p_usuario_id integer) OWNER TO aitrolsystem;

--
-- Name: trg_actualiza_stock(); Type: FUNCTION; Schema: dbo; Owner: aitrolsystem
--

CREATE FUNCTION dbo.trg_actualiza_stock() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Intentamos insertar la fila o actualizar si ya existe
    INSERT INTO inv_stock (producto_id, almacen_id, percha_id, id_sucursal, stock_actual, stock_minimo)
    VALUES (
        NEW.producto_id,
        NEW.almacen_id,
        NEW.percha_id,
        NEW.id_sucursal,
        CASE
            WHEN NEW.tipo_movimiento = 'Entrada' THEN NEW.cantidad
            WHEN NEW.tipo_movimiento = 'Salida' THEN 0 - NEW.cantidad
            ELSE 0
        END,
        0
    )
    ON CONFLICT (producto_id, almacen_id, id_sucursal, percha_id)
    DO UPDATE SET
        stock_actual = CASE
            WHEN inv_stock.stock_actual +
                 CASE
                     WHEN NEW.tipo_movimiento = 'Entrada' THEN NEW.cantidad
                     WHEN NEW.tipo_movimiento = 'Salida' THEN 0 - NEW.cantidad
                     ELSE 0
                 END < 0 THEN 0
            ELSE inv_stock.stock_actual +
                 CASE
                     WHEN NEW.tipo_movimiento = 'Entrada' THEN NEW.cantidad
                     WHEN NEW.tipo_movimiento = 'Salida' THEN 0 - NEW.cantidad
                     ELSE 0
                 END
        END;

    RETURN NEW;
END;
$$;


ALTER FUNCTION dbo.trg_actualiza_stock() OWNER TO aitrolsystem;

--
-- Name: trg_compras_to_caja(); Type: FUNCTION; Schema: dbo; Owner: aitrolsystem
--

CREATE FUNCTION dbo.trg_compras_to_caja() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Solo si id_caja no es NULL
    IF NEW.id_caja IS NOT NULL THEN
        INSERT INTO fin_caja_mov (
            id_caja,
            id_arqueo,
            fecha,
            tipo_movimiento,
            concepto,
            monto,
            id_usuario,
            id_referencia,
            id_sucursal,
            origen,
            observacion
        )
        VALUES (
            NEW.id_caja,
            NEW.id_arqueo,
            CURRENT_TIMESTAMP,
            'EGRESO',
            'Pago de compra ' || NEW.numero_factura,
            NEW.total,
            NEW.id_usuario,
            NEW.id,
            NEW.id_sucursal,
            'COMPRA',
            'Movimiento generado automáticamente por trigger'
        );
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION dbo.trg_compras_to_caja() OWNER TO aitrolsystem;

--
-- Name: trg_kardex_costo(); Type: FUNCTION; Schema: dbo; Owner: aitrolsystem
--

CREATE FUNCTION dbo.trg_kardex_costo() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    promedio_costo numeric;
BEGIN
    -- Solo aplicamos a las salidas
    IF NEW.tipo_movimiento = 'Salida' THEN
        -- Calcular promedio de costo de entradas existentes
        SELECT
            CASE WHEN SUM(cantidad) = 0 THEN 0
                 ELSE SUM(cantidad * costo_unitario) / SUM(cantidad)
            END
        INTO promedio_costo
        FROM inv_kardex
        WHERE producto_id = NEW.producto_id
          AND almacen_id  = NEW.almacen_id
          AND id_sucursal = NEW.id_sucursal
          AND tipo_movimiento = 'Entrada'
          AND costo_unitario IS NOT NULL;

        -- Actualizar el registro recién insertado
        UPDATE inv_kardex
        SET costo_unitario = COALESCE(promedio_costo, 0)
        WHERE id = NEW.id;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION dbo.trg_kardex_costo() OWNER TO aitrolsystem;

--
-- Name: trg_ventas_to_caja(); Type: FUNCTION; Schema: dbo; Owner: aitrolsystem
--

CREATE FUNCTION dbo.trg_ventas_to_caja() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Solo si id_caja no es NULL
    IF NEW.id_caja IS NOT NULL THEN
        INSERT INTO fin_caja_mov (
            id_caja,
            id_arqueo,
            fecha,
            tipo_movimiento,
            concepto,
            monto,
            id_usuario,
            id_referencia,
            id_sucursal,
            origen,
            observacion
        )
        VALUES (
            NEW.id_caja,
            NEW.id_arqueo,
            CURRENT_TIMESTAMP,
            'INGRESO',
            'Venta factura ' || NEW.numero_factura,
            NEW.total,
            NEW.id_usuario,
            NEW.id,
            NEW.id_sucursal,
            'VENTA',
            'Movimiento generado automáticamente por trigger'
        );
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION dbo.trg_ventas_to_caja() OWNER TO aitrolsystem;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_log; Type: TABLE; Schema: dbo; Owner: aitrolsystem
--

CREATE TABLE dbo.audit_log (
    id bigint NOT NULL,
    tabla_nombre text NOT NULL,
    registro_id integer,
    accion text NOT NULL,
    usuario text NOT NULL,
    fecha timestamp with time zone NOT NULL,
    detalles text
);


ALTER TABLE dbo.audit_log OWNER TO aitrolsystem;

--
-- Name: audit_log_id_seq; Type: SEQUENCE; Schema: dbo; Owner: aitrolsystem
--

CREATE SEQUENCE dbo.audit_log_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE dbo.audit_log_id_seq OWNER TO aitrolsystem;

--
-- Name: audit_log_id_seq; Type: SEQUENCE OWNED BY; Schema: dbo; Owner: aitrolsystem
--

ALTER SEQUENCE dbo.audit_log_id_seq OWNED BY dbo.audit_log.id;


--
-- Name: clientes; Type: TABLE; Schema: dbo; Owner: aitrolsystem
--

CREATE TABLE dbo.clientes (
    id bigint NOT NULL,
    nombre text,
    apellido text,
    ruc text,
    telefono text,
    direccion text,
    estado smallint DEFAULT '1'::smallint,
    valor_tm numeric
);


ALTER TABLE dbo.clientes OWNER TO aitrolsystem;

--
-- Name: clientes_id_seq; Type: SEQUENCE; Schema: dbo; Owner: aitrolsystem
--

CREATE SEQUENCE dbo.clientes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE dbo.clientes_id_seq OWNER TO aitrolsystem;

--
-- Name: clientes_id_seq; Type: SEQUENCE OWNED BY; Schema: dbo; Owner: aitrolsystem
--

ALTER SEQUENCE dbo.clientes_id_seq OWNED BY dbo.clientes.id;


--
-- Name: errores_log; Type: TABLE; Schema: dbo; Owner: aitrolsystem
--

CREATE TABLE dbo.errores_log (
    id bigint NOT NULL,
    fecha timestamp with time zone,
    endpoint text,
    metodo text,
    error_mensaje text,
    error_detalle text,
    usuario_id integer
);


ALTER TABLE dbo.errores_log OWNER TO aitrolsystem;

--
-- Name: errores_log_id_seq; Type: SEQUENCE; Schema: dbo; Owner: aitrolsystem
--

CREATE SEQUENCE dbo.errores_log_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE dbo.errores_log_id_seq OWNER TO aitrolsystem;

--
-- Name: errores_log_id_seq; Type: SEQUENCE OWNED BY; Schema: dbo; Owner: aitrolsystem
--

ALTER SEQUENCE dbo.errores_log_id_seq OWNED BY dbo.errores_log.id;


--
-- Name: fin_caja; Type: TABLE; Schema: dbo; Owner: aitrolsystem
--

CREATE TABLE dbo.fin_caja (
    id bigint NOT NULL,
    nombre text NOT NULL,
    descripcion text,
    estado boolean DEFAULT true NOT NULL,
    id_sucursal integer NOT NULL
);


ALTER TABLE dbo.fin_caja OWNER TO aitrolsystem;

--
-- Name: fin_caja_arqueo; Type: TABLE; Schema: dbo; Owner: aitrolsystem
--

CREATE TABLE dbo.fin_caja_arqueo (
    id bigint NOT NULL,
    id_caja integer NOT NULL,
    fecha_apertura timestamp with time zone NOT NULL,
    fecha_cierre timestamp with time zone,
    saldo_inicial numeric NOT NULL,
    saldo_final numeric,
    id_usuario_apertura integer NOT NULL,
    id_usuario_cierre integer,
    id_sucursal integer
);


ALTER TABLE dbo.fin_caja_arqueo OWNER TO aitrolsystem;

--
-- Name: fin_caja_arqueo_id_seq; Type: SEQUENCE; Schema: dbo; Owner: aitrolsystem
--

CREATE SEQUENCE dbo.fin_caja_arqueo_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE dbo.fin_caja_arqueo_id_seq OWNER TO aitrolsystem;

--
-- Name: fin_caja_arqueo_id_seq; Type: SEQUENCE OWNED BY; Schema: dbo; Owner: aitrolsystem
--

ALTER SEQUENCE dbo.fin_caja_arqueo_id_seq OWNED BY dbo.fin_caja_arqueo.id;


--
-- Name: fin_caja_id_seq; Type: SEQUENCE; Schema: dbo; Owner: aitrolsystem
--

CREATE SEQUENCE dbo.fin_caja_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE dbo.fin_caja_id_seq OWNER TO aitrolsystem;

--
-- Name: fin_caja_id_seq; Type: SEQUENCE OWNED BY; Schema: dbo; Owner: aitrolsystem
--

ALTER SEQUENCE dbo.fin_caja_id_seq OWNED BY dbo.fin_caja.id;


--
-- Name: fin_caja_mov; Type: TABLE; Schema: dbo; Owner: aitrolsystem
--

CREATE TABLE dbo.fin_caja_mov (
    id bigint NOT NULL,
    id_caja integer NOT NULL,
    id_arqueo integer,
    fecha timestamp with time zone NOT NULL,
    tipo_movimiento text NOT NULL,
    concepto text NOT NULL,
    monto numeric NOT NULL,
    id_usuario integer NOT NULL,
    id_referencia integer,
    id_sucursal integer,
    origen text,
    observacion text
);


ALTER TABLE dbo.fin_caja_mov OWNER TO aitrolsystem;

--
-- Name: fin_caja_mov_id_seq; Type: SEQUENCE; Schema: dbo; Owner: aitrolsystem
--

CREATE SEQUENCE dbo.fin_caja_mov_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE dbo.fin_caja_mov_id_seq OWNER TO aitrolsystem;

--
-- Name: fin_caja_mov_id_seq; Type: SEQUENCE OWNED BY; Schema: dbo; Owner: aitrolsystem
--

ALTER SEQUENCE dbo.fin_caja_mov_id_seq OWNED BY dbo.fin_caja_mov.id;


--
-- Name: fin_caja_usuario; Type: TABLE; Schema: dbo; Owner: aitrolsystem
--

CREATE TABLE dbo.fin_caja_usuario (
    id bigint NOT NULL,
    id_caja integer NOT NULL,
    id_usuario integer NOT NULL,
    puede_abrir boolean DEFAULT true NOT NULL,
    puede_cerrar boolean DEFAULT true NOT NULL,
    puede_registrar boolean DEFAULT true NOT NULL,
    estado boolean DEFAULT true NOT NULL,
    id_sucursal integer NOT NULL
);


ALTER TABLE dbo.fin_caja_usuario OWNER TO aitrolsystem;

--
-- Name: fin_caja_usuario_id_seq; Type: SEQUENCE; Schema: dbo; Owner: aitrolsystem
--

CREATE SEQUENCE dbo.fin_caja_usuario_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE dbo.fin_caja_usuario_id_seq OWNER TO aitrolsystem;

--
-- Name: fin_caja_usuario_id_seq; Type: SEQUENCE OWNED BY; Schema: dbo; Owner: aitrolsystem
--

ALTER SEQUENCE dbo.fin_caja_usuario_id_seq OWNED BY dbo.fin_caja_usuario.id;


--
-- Name: inv_ajustes_stock; Type: TABLE; Schema: dbo; Owner: aitrolsystem
--

CREATE TABLE dbo.inv_ajustes_stock (
    id bigint NOT NULL,
    almacen_id integer NOT NULL,
    fecha timestamp with time zone NOT NULL,
    motivo text NOT NULL,
    usuario text,
    estado text DEFAULT 'ACTIVO'::text
);


ALTER TABLE dbo.inv_ajustes_stock OWNER TO aitrolsystem;

--
-- Name: inv_ajustes_stock_det; Type: TABLE; Schema: dbo; Owner: aitrolsystem
--

CREATE TABLE dbo.inv_ajustes_stock_det (
    id bigint NOT NULL,
    ajuste_id integer NOT NULL,
    producto_id integer NOT NULL,
    cantidad numeric NOT NULL,
    tipo text NOT NULL
);


ALTER TABLE dbo.inv_ajustes_stock_det OWNER TO aitrolsystem;

--
-- Name: inv_ajustes_stock_det_id_seq; Type: SEQUENCE; Schema: dbo; Owner: aitrolsystem
--

CREATE SEQUENCE dbo.inv_ajustes_stock_det_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE dbo.inv_ajustes_stock_det_id_seq OWNER TO aitrolsystem;

--
-- Name: inv_ajustes_stock_det_id_seq; Type: SEQUENCE OWNED BY; Schema: dbo; Owner: aitrolsystem
--

ALTER SEQUENCE dbo.inv_ajustes_stock_det_id_seq OWNED BY dbo.inv_ajustes_stock_det.id;


--
-- Name: inv_ajustes_stock_id_seq; Type: SEQUENCE; Schema: dbo; Owner: aitrolsystem
--

CREATE SEQUENCE dbo.inv_ajustes_stock_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE dbo.inv_ajustes_stock_id_seq OWNER TO aitrolsystem;

--
-- Name: inv_ajustes_stock_id_seq; Type: SEQUENCE OWNED BY; Schema: dbo; Owner: aitrolsystem
--

ALTER SEQUENCE dbo.inv_ajustes_stock_id_seq OWNED BY dbo.inv_ajustes_stock.id;


--
-- Name: inv_almacenes; Type: TABLE; Schema: dbo; Owner: aitrolsystem
--

CREATE TABLE dbo.inv_almacenes (
    id bigint NOT NULL,
    nombre text NOT NULL,
    direccion text,
    estado boolean DEFAULT true NOT NULL,
    fecha_creacion timestamp with time zone NOT NULL,
    ubicacion text,
    id_sucursal integer NOT NULL
);


ALTER TABLE dbo.inv_almacenes OWNER TO aitrolsystem;

--
-- Name: inv_almacenes_id_seq; Type: SEQUENCE; Schema: dbo; Owner: aitrolsystem
--

CREATE SEQUENCE dbo.inv_almacenes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE dbo.inv_almacenes_id_seq OWNER TO aitrolsystem;

--
-- Name: inv_almacenes_id_seq; Type: SEQUENCE OWNED BY; Schema: dbo; Owner: aitrolsystem
--

ALTER SEQUENCE dbo.inv_almacenes_id_seq OWNED BY dbo.inv_almacenes.id;


--
-- Name: inv_categorias; Type: TABLE; Schema: dbo; Owner: aitrolsystem
--

CREATE TABLE dbo.inv_categorias (
    id bigint NOT NULL,
    nombre text NOT NULL,
    descripcion text,
    estado boolean DEFAULT true NOT NULL,
    fecha_creacion timestamp with time zone NOT NULL,
    id_sucursal integer NOT NULL
);


ALTER TABLE dbo.inv_categorias OWNER TO aitrolsystem;

--
-- Name: inv_categorias_id_seq; Type: SEQUENCE; Schema: dbo; Owner: aitrolsystem
--

CREATE SEQUENCE dbo.inv_categorias_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE dbo.inv_categorias_id_seq OWNER TO aitrolsystem;

--
-- Name: inv_categorias_id_seq; Type: SEQUENCE OWNED BY; Schema: dbo; Owner: aitrolsystem
--

ALTER SEQUENCE dbo.inv_categorias_id_seq OWNED BY dbo.inv_categorias.id;


--
-- Name: inv_clientes; Type: TABLE; Schema: dbo; Owner: aitrolsystem
--

CREATE TABLE dbo.inv_clientes (
    id bigint NOT NULL,
    nombre text NOT NULL,
    identificacion text,
    direccion text,
    telefono text,
    email text,
    estado boolean DEFAULT true NOT NULL,
    fecha_creacion timestamp with time zone NOT NULL,
    id_sucursal integer NOT NULL,
    contribuyente_especial character varying(200),
    obligado_contabilidad character varying(10) DEFAULT 'SI'::character varying,
    tipo_identificacion character varying(10) DEFAULT '05'::character varying
);


ALTER TABLE dbo.inv_clientes OWNER TO aitrolsystem;

--
-- Name: inv_clientes_id_seq; Type: SEQUENCE; Schema: dbo; Owner: aitrolsystem
--

CREATE SEQUENCE dbo.inv_clientes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE dbo.inv_clientes_id_seq OWNER TO aitrolsystem;

--
-- Name: inv_clientes_id_seq; Type: SEQUENCE OWNED BY; Schema: dbo; Owner: aitrolsystem
--

ALTER SEQUENCE dbo.inv_clientes_id_seq OWNED BY dbo.inv_clientes.id;


--
-- Name: inv_compras_cab; Type: TABLE; Schema: dbo; Owner: aitrolsystem
--

CREATE TABLE dbo.inv_compras_cab (
    id bigint NOT NULL,
    proveedor_id integer NOT NULL,
    numero_factura text NOT NULL,
    fecha date NOT NULL,
    subtotal numeric DEFAULT '0'::numeric NOT NULL,
    iva numeric DEFAULT '0'::numeric NOT NULL,
    total numeric DEFAULT '0'::numeric NOT NULL,
    estado text DEFAULT 'ACTIVO'::text NOT NULL,
    fecha_creacion timestamp with time zone NOT NULL,
    movimiento_id integer,
    id_sucursal integer NOT NULL,
    id_caja integer,
    id_arqueo integer,
    id_usuario integer,
    fpago_id integer,
    observaciones text,
    estado_pago text,
    plazo_pago text,
    fecha_pago text
);


ALTER TABLE dbo.inv_compras_cab OWNER TO aitrolsystem;

--
-- Name: inv_compras_cab_id_seq; Type: SEQUENCE; Schema: dbo; Owner: aitrolsystem
--

CREATE SEQUENCE dbo.inv_compras_cab_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE dbo.inv_compras_cab_id_seq OWNER TO aitrolsystem;

--
-- Name: inv_compras_cab_id_seq; Type: SEQUENCE OWNED BY; Schema: dbo; Owner: aitrolsystem
--

ALTER SEQUENCE dbo.inv_compras_cab_id_seq OWNED BY dbo.inv_compras_cab.id;


--
-- Name: inv_compras_det; Type: TABLE; Schema: dbo; Owner: aitrolsystem
--

CREATE TABLE dbo.inv_compras_det (
    id bigint NOT NULL,
    compra_id integer NOT NULL,
    producto_id integer NOT NULL,
    cantidad numeric NOT NULL,
    precio_unitario numeric NOT NULL,
    subtotal numeric NOT NULL,
    iva numeric NOT NULL,
    total numeric NOT NULL,
    descuento numeric DEFAULT '0'::numeric NOT NULL,
    almacen_id integer,
    percha_id integer,
    fpago_id integer
);


ALTER TABLE dbo.inv_compras_det OWNER TO aitrolsystem;

--
-- Name: inv_compras_det_id_seq; Type: SEQUENCE; Schema: dbo; Owner: aitrolsystem
--

CREATE SEQUENCE dbo.inv_compras_det_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE dbo.inv_compras_det_id_seq OWNER TO aitrolsystem;

--
-- Name: inv_compras_det_id_seq; Type: SEQUENCE OWNED BY; Schema: dbo; Owner: aitrolsystem
--

ALTER SEQUENCE dbo.inv_compras_det_id_seq OWNED BY dbo.inv_compras_det.id;


--
-- Name: inv_compras_series; Type: TABLE; Schema: dbo; Owner: aitrolsystem
--

CREATE TABLE dbo.inv_compras_series (
    id bigint NOT NULL,
    compra_det_id integer NOT NULL,
    serie_id integer NOT NULL
);


ALTER TABLE dbo.inv_compras_series OWNER TO aitrolsystem;

--
-- Name: inv_compras_series_id_seq; Type: SEQUENCE; Schema: dbo; Owner: aitrolsystem
--

CREATE SEQUENCE dbo.inv_compras_series_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE dbo.inv_compras_series_id_seq OWNER TO aitrolsystem;

--
-- Name: inv_compras_series_id_seq; Type: SEQUENCE OWNED BY; Schema: dbo; Owner: aitrolsystem
--

ALTER SEQUENCE dbo.inv_compras_series_id_seq OWNED BY dbo.inv_compras_series.id;


--
-- Name: inv_cotizaciones_cab; Type: TABLE; Schema: dbo; Owner: aitrolsystem
--

CREATE TABLE dbo.inv_cotizaciones_cab (
    id bigint NOT NULL,
    cliente_id integer NOT NULL,
    numero_cotizacion text NOT NULL,
    fecha date NOT NULL,
    fecha_validez date,
    subtotal numeric(18,2) DEFAULT 0 NOT NULL,
    iva numeric(18,2) DEFAULT 0 NOT NULL,
    total numeric(18,2) DEFAULT 0 NOT NULL,
    descuento numeric(18,2) DEFAULT 0 NOT NULL,
    estado text DEFAULT 'PENDIENTE'::text NOT NULL,
    observaciones text,
    id_sucursal integer NOT NULL,
    id_usuario integer,
    fecha_creacion timestamp with time zone DEFAULT now() NOT NULL,
    fecha_aprobacion timestamp with time zone,
    fecha_rechazo timestamp with time zone,
    fecha_conversion timestamp with time zone,
    id_venta integer
);


ALTER TABLE dbo.inv_cotizaciones_cab OWNER TO aitrolsystem;

--
-- Name: inv_cotizaciones_cab_id_seq; Type: SEQUENCE; Schema: dbo; Owner: aitrolsystem
--

CREATE SEQUENCE dbo.inv_cotizaciones_cab_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE dbo.inv_cotizaciones_cab_id_seq OWNER TO aitrolsystem;

--
-- Name: inv_cotizaciones_cab_id_seq; Type: SEQUENCE OWNED BY; Schema: dbo; Owner: aitrolsystem
--

ALTER SEQUENCE dbo.inv_cotizaciones_cab_id_seq OWNED BY dbo.inv_cotizaciones_cab.id;


--
-- Name: inv_cotizaciones_det; Type: TABLE; Schema: dbo; Owner: aitrolsystem
--

CREATE TABLE dbo.inv_cotizaciones_det (
    id bigint NOT NULL,
    cotizacion_id integer NOT NULL,
    producto_id integer NOT NULL,
    cantidad numeric NOT NULL,
    precio_unitario numeric NOT NULL,
    subtotal numeric NOT NULL,
    iva numeric NOT NULL,
    total numeric NOT NULL,
    descuento numeric DEFAULT 0 NOT NULL,
    almacen_id integer,
    percha_id integer
);


ALTER TABLE dbo.inv_cotizaciones_det OWNER TO aitrolsystem;

--
-- Name: inv_cotizaciones_det_id_seq; Type: SEQUENCE; Schema: dbo; Owner: aitrolsystem
--

CREATE SEQUENCE dbo.inv_cotizaciones_det_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE dbo.inv_cotizaciones_det_id_seq OWNER TO aitrolsystem;

--
-- Name: inv_cotizaciones_det_id_seq; Type: SEQUENCE OWNED BY; Schema: dbo; Owner: aitrolsystem
--

ALTER SEQUENCE dbo.inv_cotizaciones_det_id_seq OWNED BY dbo.inv_cotizaciones_det.id;


--
-- Name: inv_kardex; Type: TABLE; Schema: dbo; Owner: aitrolsystem
--

CREATE TABLE dbo.inv_kardex (
    id bigint NOT NULL,
    producto_id integer NOT NULL,
    fecha timestamp with time zone NOT NULL,
    tipo_movimiento text NOT NULL,
    cantidad numeric NOT NULL,
    stock_anterior numeric NOT NULL,
    stock_nuevo numeric NOT NULL,
    referencia_id integer,
    serie_id integer,
    almacen_id integer NOT NULL,
    percha_id integer,
    id_sucursal integer NOT NULL,
    costo_unitario numeric DEFAULT '0'::numeric,
    precio_venta numeric DEFAULT '0'::numeric
);


ALTER TABLE dbo.inv_kardex OWNER TO aitrolsystem;

--
-- Name: inv_kardex_id_seq; Type: SEQUENCE; Schema: dbo; Owner: aitrolsystem
--

CREATE SEQUENCE dbo.inv_kardex_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE dbo.inv_kardex_id_seq OWNER TO aitrolsystem;

--
-- Name: inv_kardex_id_seq; Type: SEQUENCE OWNED BY; Schema: dbo; Owner: aitrolsystem
--

ALTER SEQUENCE dbo.inv_kardex_id_seq OWNED BY dbo.inv_kardex.id;


--
-- Name: inv_marcas; Type: TABLE; Schema: dbo; Owner: aitrolsystem
--

CREATE TABLE dbo.inv_marcas (
    id bigint NOT NULL,
    nombre text NOT NULL,
    descripcion text,
    estado boolean DEFAULT true NOT NULL,
    fecha_creacion timestamp with time zone NOT NULL,
    id_sucursal integer NOT NULL
);


ALTER TABLE dbo.inv_marcas OWNER TO aitrolsystem;

--
-- Name: inv_marcas_id_seq; Type: SEQUENCE; Schema: dbo; Owner: aitrolsystem
--

CREATE SEQUENCE dbo.inv_marcas_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE dbo.inv_marcas_id_seq OWNER TO aitrolsystem;

--
-- Name: inv_marcas_id_seq; Type: SEQUENCE OWNED BY; Schema: dbo; Owner: aitrolsystem
--

ALTER SEQUENCE dbo.inv_marcas_id_seq OWNED BY dbo.inv_marcas.id;


--
-- Name: inv_movimientos; Type: TABLE; Schema: dbo; Owner: aitrolsystem
--

CREATE TABLE dbo.inv_movimientos (
    id bigint NOT NULL,
    tipo_movimiento_id integer NOT NULL,
    fecha_movimiento timestamp with time zone NOT NULL,
    proveedor_id integer,
    cliente_id integer,
    observaciones text,
    estado text DEFAULT 'ACTIVO'::text NOT NULL,
    id_sucursal integer NOT NULL,
    id_usuario integer
);


ALTER TABLE dbo.inv_movimientos OWNER TO aitrolsystem;

--
-- Name: inv_movimientos_detalle; Type: TABLE; Schema: dbo; Owner: aitrolsystem
--

CREATE TABLE dbo.inv_movimientos_detalle (
    id bigint NOT NULL,
    movimiento_id integer NOT NULL,
    producto_id integer NOT NULL,
    cantidad numeric NOT NULL,
    precio_unitario numeric NOT NULL,
    subtotal numeric,
    percha_id integer,
    almacen_id integer
);


ALTER TABLE dbo.inv_movimientos_detalle OWNER TO aitrolsystem;

--
-- Name: inv_movimientos_detalle_id_seq; Type: SEQUENCE; Schema: dbo; Owner: aitrolsystem
--

CREATE SEQUENCE dbo.inv_movimientos_detalle_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE dbo.inv_movimientos_detalle_id_seq OWNER TO aitrolsystem;

--
-- Name: inv_movimientos_detalle_id_seq; Type: SEQUENCE OWNED BY; Schema: dbo; Owner: aitrolsystem
--

ALTER SEQUENCE dbo.inv_movimientos_detalle_id_seq OWNED BY dbo.inv_movimientos_detalle.id;


--
-- Name: inv_movimientos_id_seq; Type: SEQUENCE; Schema: dbo; Owner: aitrolsystem
--

CREATE SEQUENCE dbo.inv_movimientos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE dbo.inv_movimientos_id_seq OWNER TO aitrolsystem;

--
-- Name: inv_movimientos_id_seq; Type: SEQUENCE OWNED BY; Schema: dbo; Owner: aitrolsystem
--

ALTER SEQUENCE dbo.inv_movimientos_id_seq OWNED BY dbo.inv_movimientos.id;


--
-- Name: inv_movimientos_series; Type: TABLE; Schema: dbo; Owner: aitrolsystem
--

CREATE TABLE dbo.inv_movimientos_series (
    id bigint NOT NULL,
    movimiento_detalle_id integer NOT NULL,
    serie_id integer NOT NULL
);


ALTER TABLE dbo.inv_movimientos_series OWNER TO aitrolsystem;

--
-- Name: inv_movimientos_series_id_seq; Type: SEQUENCE; Schema: dbo; Owner: aitrolsystem
--

CREATE SEQUENCE dbo.inv_movimientos_series_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE dbo.inv_movimientos_series_id_seq OWNER TO aitrolsystem;

--
-- Name: inv_movimientos_series_id_seq; Type: SEQUENCE OWNED BY; Schema: dbo; Owner: aitrolsystem
--

ALTER SEQUENCE dbo.inv_movimientos_series_id_seq OWNED BY dbo.inv_movimientos_series.id;


--
-- Name: inv_perchas; Type: TABLE; Schema: dbo; Owner: aitrolsystem
--

CREATE TABLE dbo.inv_perchas (
    id bigint NOT NULL,
    almacen_id integer NOT NULL,
    codigo text NOT NULL,
    descripcion text,
    nombre text,
    fecha_creacion timestamp with time zone,
    id_sucursal integer NOT NULL,
    estado boolean
);


ALTER TABLE dbo.inv_perchas OWNER TO aitrolsystem;

--
-- Name: inv_perchas_id_seq; Type: SEQUENCE; Schema: dbo; Owner: aitrolsystem
--

CREATE SEQUENCE dbo.inv_perchas_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE dbo.inv_perchas_id_seq OWNER TO aitrolsystem;

--
-- Name: inv_perchas_id_seq; Type: SEQUENCE OWNED BY; Schema: dbo; Owner: aitrolsystem
--

ALTER SEQUENCE dbo.inv_perchas_id_seq OWNED BY dbo.inv_perchas.id;


--
-- Name: inv_productos; Type: TABLE; Schema: dbo; Owner: aitrolsystem
--

CREATE TABLE dbo.inv_productos (
    id bigint NOT NULL,
    nombre text NOT NULL,
    descripcion text,
    codigo_barra text,
    categoria_id integer NOT NULL,
    marca_id integer NOT NULL,
    precio_compra numeric DEFAULT '0'::numeric NOT NULL,
    precio_venta numeric DEFAULT '0'::numeric NOT NULL,
    stock_actual numeric DEFAULT '0'::numeric NOT NULL,
    estado boolean DEFAULT true NOT NULL,
    fecha_creacion timestamp with time zone NOT NULL,
    foto_principal text,
    stock_minimo integer DEFAULT 0,
    unidad_medida text,
    id_sucursal integer NOT NULL,
    control_stock smallint DEFAULT '1'::smallint
);


ALTER TABLE dbo.inv_productos OWNER TO aitrolsystem;

--
-- Name: inv_productos_id_seq; Type: SEQUENCE; Schema: dbo; Owner: aitrolsystem
--

CREATE SEQUENCE dbo.inv_productos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE dbo.inv_productos_id_seq OWNER TO aitrolsystem;

--
-- Name: inv_productos_id_seq; Type: SEQUENCE OWNED BY; Schema: dbo; Owner: aitrolsystem
--

ALTER SEQUENCE dbo.inv_productos_id_seq OWNED BY dbo.inv_productos.id;


--
-- Name: inv_productos_imagenes; Type: TABLE; Schema: dbo; Owner: aitrolsystem
--

CREATE TABLE dbo.inv_productos_imagenes (
    id bigint NOT NULL,
    producto_id integer NOT NULL,
    url_imagen text NOT NULL,
    descripcion text
);


ALTER TABLE dbo.inv_productos_imagenes OWNER TO aitrolsystem;

--
-- Name: inv_productos_imagenes_id_seq; Type: SEQUENCE; Schema: dbo; Owner: aitrolsystem
--

CREATE SEQUENCE dbo.inv_productos_imagenes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE dbo.inv_productos_imagenes_id_seq OWNER TO aitrolsystem;

--
-- Name: inv_productos_imagenes_id_seq; Type: SEQUENCE OWNED BY; Schema: dbo; Owner: aitrolsystem
--

ALTER SEQUENCE dbo.inv_productos_imagenes_id_seq OWNED BY dbo.inv_productos_imagenes.id;


--
-- Name: inv_productos_series; Type: TABLE; Schema: dbo; Owner: aitrolsystem
--

CREATE TABLE dbo.inv_productos_series (
    id bigint NOT NULL,
    producto_id integer NOT NULL,
    numero_serie text NOT NULL,
    estado text DEFAULT 'DISP'::text NOT NULL,
    fecha_registro timestamp with time zone NOT NULL,
    fecha_salida timestamp with time zone,
    almacen_id integer,
    percha_id integer,
    id_sucursal integer
);


ALTER TABLE dbo.inv_productos_series OWNER TO aitrolsystem;

--
-- Name: inv_productos_series_id_seq; Type: SEQUENCE; Schema: dbo; Owner: aitrolsystem
--

CREATE SEQUENCE dbo.inv_productos_series_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE dbo.inv_productos_series_id_seq OWNER TO aitrolsystem;

--
-- Name: inv_productos_series_id_seq; Type: SEQUENCE OWNED BY; Schema: dbo; Owner: aitrolsystem
--

ALTER SEQUENCE dbo.inv_productos_series_id_seq OWNED BY dbo.inv_productos_series.id;


--
-- Name: inv_proveedores; Type: TABLE; Schema: dbo; Owner: aitrolsystem
--

CREATE TABLE dbo.inv_proveedores (
    id bigint NOT NULL,
    razon_social text NOT NULL,
    nombre_contacto text,
    ruc text,
    direccion text,
    telefono text,
    email text,
    estado boolean DEFAULT true NOT NULL,
    fecha_creacion timestamp with time zone NOT NULL,
    id_sucursal integer NOT NULL
);


ALTER TABLE dbo.inv_proveedores OWNER TO aitrolsystem;

--
-- Name: inv_proveedores_id_seq; Type: SEQUENCE; Schema: dbo; Owner: aitrolsystem
--

CREATE SEQUENCE dbo.inv_proveedores_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE dbo.inv_proveedores_id_seq OWNER TO aitrolsystem;

--
-- Name: inv_proveedores_id_seq; Type: SEQUENCE OWNED BY; Schema: dbo; Owner: aitrolsystem
--

ALTER SEQUENCE dbo.inv_proveedores_id_seq OWNED BY dbo.inv_proveedores.id;


--
-- Name: inv_stock; Type: TABLE; Schema: dbo; Owner: aitrolsystem
--

CREATE TABLE dbo.inv_stock (
    id bigint NOT NULL,
    producto_id integer NOT NULL,
    almacen_id integer NOT NULL,
    percha_id integer,
    stock_actual numeric DEFAULT '0'::numeric NOT NULL,
    stock_minimo numeric DEFAULT '0'::numeric NOT NULL,
    id_sucursal integer NOT NULL
);


ALTER TABLE dbo.inv_stock OWNER TO aitrolsystem;

--
-- Name: inv_stock_id_seq; Type: SEQUENCE; Schema: dbo; Owner: aitrolsystem
--

CREATE SEQUENCE dbo.inv_stock_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE dbo.inv_stock_id_seq OWNER TO aitrolsystem;

--
-- Name: inv_stock_id_seq; Type: SEQUENCE OWNED BY; Schema: dbo; Owner: aitrolsystem
--

ALTER SEQUENCE dbo.inv_stock_id_seq OWNED BY dbo.inv_stock.id;


--
-- Name: inv_tipos_movimiento; Type: TABLE; Schema: dbo; Owner: aitrolsystem
--

CREATE TABLE dbo.inv_tipos_movimiento (
    id bigint NOT NULL,
    nombre text NOT NULL,
    descripcion text
);


ALTER TABLE dbo.inv_tipos_movimiento OWNER TO aitrolsystem;

--
-- Name: inv_tipos_movimiento_id_seq; Type: SEQUENCE; Schema: dbo; Owner: aitrolsystem
--

CREATE SEQUENCE dbo.inv_tipos_movimiento_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE dbo.inv_tipos_movimiento_id_seq OWNER TO aitrolsystem;

--
-- Name: inv_tipos_movimiento_id_seq; Type: SEQUENCE OWNED BY; Schema: dbo; Owner: aitrolsystem
--

ALTER SEQUENCE dbo.inv_tipos_movimiento_id_seq OWNED BY dbo.inv_tipos_movimiento.id;


--
-- Name: inv_transferencias; Type: TABLE; Schema: dbo; Owner: aitrolsystem
--

CREATE TABLE dbo.inv_transferencias (
    id bigint NOT NULL,
    almacen_origen integer NOT NULL,
    almacen_destino integer NOT NULL,
    fecha timestamp with time zone NOT NULL,
    estado text DEFAULT 'PENDIENTE'::text NOT NULL,
    usuario text,
    id_sucursal_origen integer NOT NULL,
    id_sucursal_destino integer NOT NULL
);


ALTER TABLE dbo.inv_transferencias OWNER TO aitrolsystem;

--
-- Name: inv_transferencias_det; Type: TABLE; Schema: dbo; Owner: aitrolsystem
--

CREATE TABLE dbo.inv_transferencias_det (
    id bigint NOT NULL,
    transferencia_id integer NOT NULL,
    producto_id integer NOT NULL,
    cantidad numeric NOT NULL
);


ALTER TABLE dbo.inv_transferencias_det OWNER TO aitrolsystem;

--
-- Name: inv_transferencias_det_id_seq; Type: SEQUENCE; Schema: dbo; Owner: aitrolsystem
--

CREATE SEQUENCE dbo.inv_transferencias_det_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE dbo.inv_transferencias_det_id_seq OWNER TO aitrolsystem;

--
-- Name: inv_transferencias_det_id_seq; Type: SEQUENCE OWNED BY; Schema: dbo; Owner: aitrolsystem
--

ALTER SEQUENCE dbo.inv_transferencias_det_id_seq OWNED BY dbo.inv_transferencias_det.id;


--
-- Name: inv_transferencias_id_seq; Type: SEQUENCE; Schema: dbo; Owner: aitrolsystem
--

CREATE SEQUENCE dbo.inv_transferencias_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE dbo.inv_transferencias_id_seq OWNER TO aitrolsystem;

--
-- Name: inv_transferencias_id_seq; Type: SEQUENCE OWNED BY; Schema: dbo; Owner: aitrolsystem
--

ALTER SEQUENCE dbo.inv_transferencias_id_seq OWNED BY dbo.inv_transferencias.id;


--
-- Name: inv_ventas_cab; Type: TABLE; Schema: dbo; Owner: aitrolsystem
--

CREATE TABLE dbo.inv_ventas_cab (
    id bigint NOT NULL,
    cliente_id integer NOT NULL,
    numero_factura text NOT NULL,
    fecha date NOT NULL,
    subtotal numeric(18,2) DEFAULT 0 NOT NULL,
    iva numeric(18,2) DEFAULT 0 NOT NULL,
    total numeric(18,2) DEFAULT 0 NOT NULL,
    estado text DEFAULT 'ACTIVO'::text NOT NULL,
    fecha_creacion timestamp with time zone NOT NULL,
    movimiento_id integer,
    id_sucursal integer NOT NULL,
    fpago_id integer,
    valor_pagado integer,
    fecha_pago date,
    observaciones text,
    plazo_pago text,
    estado_pago text,
    id_caja integer,
    id_arqueo integer,
    id_usuario integer,
    fecha_autorizacion timestamp without time zone DEFAULT now(),
    autorizacion_sri character varying(255),
    xml_firmado character varying(200),
    xml_autorizado character varying(200),
    estado_sri character varying(50),
    descuento numeric(18,2) DEFAULT 0
);


ALTER TABLE dbo.inv_ventas_cab OWNER TO aitrolsystem;

--
-- Name: inv_ventas_cab_id_seq; Type: SEQUENCE; Schema: dbo; Owner: aitrolsystem
--

CREATE SEQUENCE dbo.inv_ventas_cab_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE dbo.inv_ventas_cab_id_seq OWNER TO aitrolsystem;

--
-- Name: inv_ventas_cab_id_seq; Type: SEQUENCE OWNED BY; Schema: dbo; Owner: aitrolsystem
--

ALTER SEQUENCE dbo.inv_ventas_cab_id_seq OWNED BY dbo.inv_ventas_cab.id;


--
-- Name: inv_ventas_det; Type: TABLE; Schema: dbo; Owner: aitrolsystem
--

CREATE TABLE dbo.inv_ventas_det (
    id bigint NOT NULL,
    venta_id integer NOT NULL,
    producto_id integer NOT NULL,
    cantidad numeric NOT NULL,
    precio_unitario numeric NOT NULL,
    subtotal numeric NOT NULL,
    iva numeric NOT NULL,
    total numeric NOT NULL,
    descuento numeric DEFAULT '0'::numeric NOT NULL,
    serie text,
    almacen_id integer,
    percha_id integer
);


ALTER TABLE dbo.inv_ventas_det OWNER TO aitrolsystem;

--
-- Name: inv_ventas_det_id_seq; Type: SEQUENCE; Schema: dbo; Owner: aitrolsystem
--

CREATE SEQUENCE dbo.inv_ventas_det_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE dbo.inv_ventas_det_id_seq OWNER TO aitrolsystem;

--
-- Name: inv_ventas_det_id_seq; Type: SEQUENCE OWNED BY; Schema: dbo; Owner: aitrolsystem
--

ALTER SEQUENCE dbo.inv_ventas_det_id_seq OWNED BY dbo.inv_ventas_det.id;


--
-- Name: inv_ventas_series; Type: TABLE; Schema: dbo; Owner: aitrolsystem
--

CREATE TABLE dbo.inv_ventas_series (
    id bigint NOT NULL,
    venta_det_id integer NOT NULL,
    serie_id integer NOT NULL
);


ALTER TABLE dbo.inv_ventas_series OWNER TO aitrolsystem;

--
-- Name: inv_ventas_series_id_seq; Type: SEQUENCE; Schema: dbo; Owner: aitrolsystem
--

CREATE SEQUENCE dbo.inv_ventas_series_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE dbo.inv_ventas_series_id_seq OWNER TO aitrolsystem;

--
-- Name: inv_ventas_series_id_seq; Type: SEQUENCE OWNED BY; Schema: dbo; Owner: aitrolsystem
--

ALTER SEQUENCE dbo.inv_ventas_series_id_seq OWNED BY dbo.inv_ventas_series.id;


--
-- Name: materiales; Type: TABLE; Schema: dbo; Owner: aitrolsystem
--

CREATE TABLE dbo.materiales (
    id bigint NOT NULL,
    nombre text,
    estado smallint DEFAULT '1'::smallint
);


ALTER TABLE dbo.materiales OWNER TO aitrolsystem;

--
-- Name: materiales_id_seq; Type: SEQUENCE; Schema: dbo; Owner: aitrolsystem
--

CREATE SEQUENCE dbo.materiales_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE dbo.materiales_id_seq OWNER TO aitrolsystem;

--
-- Name: materiales_id_seq; Type: SEQUENCE OWNED BY; Schema: dbo; Owner: aitrolsystem
--

ALTER SEQUENCE dbo.materiales_id_seq OWNED BY dbo.materiales.id;


--
-- Name: menu; Type: TABLE; Schema: dbo; Owner: aitrolsystem
--

CREATE TABLE dbo.menu (
    id bigint NOT NULL,
    parent_menu_id integer,
    title text,
    icon text,
    path text,
    heading text,
    status smallint DEFAULT '1'::smallint,
    orden integer DEFAULT 1
);


ALTER TABLE dbo.menu OWNER TO aitrolsystem;

--
-- Name: menu_id_seq; Type: SEQUENCE; Schema: dbo; Owner: aitrolsystem
--

CREATE SEQUENCE dbo.menu_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE dbo.menu_id_seq OWNER TO aitrolsystem;

--
-- Name: menu_id_seq; Type: SEQUENCE OWNED BY; Schema: dbo; Owner: aitrolsystem
--

ALTER SEQUENCE dbo.menu_id_seq OWNED BY dbo.menu.id;


--
-- Name: notificaciones; Type: TABLE; Schema: dbo; Owner: aitrolsystem
--

CREATE TABLE dbo.notificaciones (
    id bigint NOT NULL,
    tipo text NOT NULL,
    titulo text NOT NULL,
    mensaje text NOT NULL,
    fecha_creacion timestamp without time zone DEFAULT now(),
    fecha_envio timestamp without time zone,
    estado text DEFAULT 'Activo'::text,
    ruta_archivo text
);


ALTER TABLE dbo.notificaciones OWNER TO aitrolsystem;

--
-- Name: notificaciones_id_seq; Type: SEQUENCE; Schema: dbo; Owner: aitrolsystem
--

CREATE SEQUENCE dbo.notificaciones_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE dbo.notificaciones_id_seq OWNER TO aitrolsystem;

--
-- Name: notificaciones_id_seq; Type: SEQUENCE OWNED BY; Schema: dbo; Owner: aitrolsystem
--

ALTER SEQUENCE dbo.notificaciones_id_seq OWNED BY dbo.notificaciones.id;


--
-- Name: notificaciones_leidas; Type: TABLE; Schema: dbo; Owner: aitrolsystem
--

CREATE TABLE dbo.notificaciones_leidas (
    id bigint NOT NULL,
    notificacion_id bigint,
    usuario_id bigint,
    fecha_leida timestamp without time zone DEFAULT now()
);


ALTER TABLE dbo.notificaciones_leidas OWNER TO aitrolsystem;

--
-- Name: notificaciones_leidas_id_seq; Type: SEQUENCE; Schema: dbo; Owner: aitrolsystem
--

CREATE SEQUENCE dbo.notificaciones_leidas_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE dbo.notificaciones_leidas_id_seq OWNER TO aitrolsystem;

--
-- Name: notificaciones_leidas_id_seq; Type: SEQUENCE OWNED BY; Schema: dbo; Owner: aitrolsystem
--

ALTER SEQUENCE dbo.notificaciones_leidas_id_seq OWNED BY dbo.notificaciones_leidas.id;


--
-- Name: ordenes; Type: TABLE; Schema: dbo; Owner: aitrolsystem
--

CREATE TABLE dbo.ordenes (
    id bigint NOT NULL,
    cliente_id integer,
    usuario_id integer,
    descripcion text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    total numeric,
    peso_total numeric,
    vehiculos_totales integer,
    material_id integer,
    puerto_salida_id integer,
    puerto_destino_id integer,
    unidad text,
    fecha date,
    hora_salida time without time zone,
    finalizado smallint DEFAULT '0'::smallint,
    modo_entrada smallint DEFAULT '1'::smallint
);


ALTER TABLE dbo.ordenes OWNER TO aitrolsystem;

--
-- Name: ordenes_compartir; Type: TABLE; Schema: dbo; Owner: aitrolsystem
--

CREATE TABLE dbo.ordenes_compartir (
    id bigint NOT NULL,
    token text,
    token_cabecera text,
    orden_id bigint,
    valido_hasta timestamp with time zone,
    created_at timestamp with time zone,
    estado smallint DEFAULT '1'::smallint,
    telefono text
);


ALTER TABLE dbo.ordenes_compartir OWNER TO aitrolsystem;

--
-- Name: ordenes_estados; Type: TABLE; Schema: dbo; Owner: aitrolsystem
--

CREATE TABLE dbo.ordenes_estados (
    id integer,
    nombre character varying(255),
    orden character varying(50),
    estado smallint
);


ALTER TABLE dbo.ordenes_estados OWNER TO aitrolsystem;

--
-- Name: ordenes_estados_old; Type: TABLE; Schema: dbo; Owner: aitrolsystem
--

CREATE TABLE dbo.ordenes_estados_old (
    id bigint NOT NULL,
    nombre text,
    orden text,
    estado smallint DEFAULT '0'::smallint
);


ALTER TABLE dbo.ordenes_estados_old OWNER TO aitrolsystem;

--
-- Name: ordenes_estados_id_seq; Type: SEQUENCE; Schema: dbo; Owner: aitrolsystem
--

CREATE SEQUENCE dbo.ordenes_estados_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE dbo.ordenes_estados_id_seq OWNER TO aitrolsystem;

--
-- Name: ordenes_estados_id_seq; Type: SEQUENCE OWNED BY; Schema: dbo; Owner: aitrolsystem
--

ALTER SEQUENCE dbo.ordenes_estados_id_seq OWNED BY dbo.ordenes_estados_old.id;


--
-- Name: ordenes_id_seq; Type: SEQUENCE; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE dbo.ordenes ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME dbo.ordenes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: ordenes_observaciones; Type: TABLE; Schema: dbo; Owner: aitrolsystem
--

CREATE TABLE dbo.ordenes_observaciones (
    id bigint NOT NULL,
    orden_id bigint,
    usuario_id bigint,
    observacion text,
    created_at timestamp with time zone
);


ALTER TABLE dbo.ordenes_observaciones OWNER TO aitrolsystem;

--
-- Name: ordenes_observaciones_id_seq; Type: SEQUENCE; Schema: dbo; Owner: aitrolsystem
--

CREATE SEQUENCE dbo.ordenes_observaciones_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE dbo.ordenes_observaciones_id_seq OWNER TO aitrolsystem;

--
-- Name: ordenes_observaciones_id_seq; Type: SEQUENCE OWNED BY; Schema: dbo; Owner: aitrolsystem
--

ALTER SEQUENCE dbo.ordenes_observaciones_id_seq OWNED BY dbo.ordenes_observaciones.id;


--
-- Name: ordenes_vehiculos; Type: TABLE; Schema: dbo; Owner: aitrolsystem
--

CREATE TABLE dbo.ordenes_vehiculos (
    id bigint NOT NULL,
    vehiculo_id integer,
    orden_id integer,
    fecha timestamp with time zone,
    conductor_id integer,
    vueltas integer
);


ALTER TABLE dbo.ordenes_vehiculos OWNER TO aitrolsystem;

--
-- Name: ordenes_vehiculos_id_seq; Type: SEQUENCE; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE dbo.ordenes_vehiculos ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME dbo.ordenes_vehiculos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: ordenes_viajes; Type: TABLE; Schema: dbo; Owner: aitrolsystem
--

CREATE TABLE dbo.ordenes_viajes (
    id bigint NOT NULL,
    vehiculo_id integer,
    user_id bigint,
    orden_id bigint,
    estado text,
    documento_path text,
    observacion text,
    ruta text,
    usuario_modifica bigint,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    estado_id integer,
    documento_path2 text,
    numero_guia text,
    peso numeric,
    numero_guia2 text,
    peso2 numeric,
    unidad text,
    unidad_nombre text,
    unidad2 text,
    unidad_nombre2 text,
    en_vuelta text,
    peso_tara numeric,
    peso_tara2 numeric,
    peso_neto numeric,
    peso_neto2 numeric,
    guia_remision text,
    usuario_crea bigint,
    usuario_actualiza bigint
);


ALTER TABLE dbo.ordenes_viajes OWNER TO aitrolsystem;

--
-- Name: ordenes_viajes_asignaciones; Type: TABLE; Schema: dbo; Owner: aitrolsystem
--

CREATE TABLE dbo.ordenes_viajes_asignaciones (
    id bigint NOT NULL,
    orden_id integer NOT NULL,
    vehiculo_id integer NOT NULL,
    conductor_id integer NOT NULL,
    cliente_id integer NOT NULL,
    puerto_destino_id integer NOT NULL,
    puerto_salida_id integer NOT NULL,
    fecha timestamp with time zone,
    observaciones text,
    mantenimiento smallint DEFAULT '0'::smallint NOT NULL
);


ALTER TABLE dbo.ordenes_viajes_asignaciones OWNER TO aitrolsystem;

--
-- Name: ordenes_viajes_asignaciones_id_seq; Type: SEQUENCE; Schema: dbo; Owner: aitrolsystem
--

CREATE SEQUENCE dbo.ordenes_viajes_asignaciones_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE dbo.ordenes_viajes_asignaciones_id_seq OWNER TO aitrolsystem;

--
-- Name: ordenes_viajes_asignaciones_id_seq; Type: SEQUENCE OWNED BY; Schema: dbo; Owner: aitrolsystem
--

ALTER SEQUENCE dbo.ordenes_viajes_asignaciones_id_seq OWNED BY dbo.ordenes_viajes_asignaciones.id;


--
-- Name: ordenes_viajes_id_seq; Type: SEQUENCE; Schema: dbo; Owner: aitrolsystem
--

CREATE SEQUENCE dbo.ordenes_viajes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE dbo.ordenes_viajes_id_seq OWNER TO aitrolsystem;

--
-- Name: ordenes_viajes_id_seq; Type: SEQUENCE OWNED BY; Schema: dbo; Owner: aitrolsystem
--

ALTER SEQUENCE dbo.ordenes_viajes_id_seq OWNED BY dbo.ordenes_viajes.id;


--
-- Name: ordenes_viajes_log; Type: TABLE; Schema: dbo; Owner: aitrolsystem
--

CREATE TABLE dbo.ordenes_viajes_log (
    id bigint NOT NULL,
    estado text,
    observacion text,
    estado_nombre text,
    ordenes_viajes_id integer,
    created_at timestamp with time zone,
    orden_id integer,
    estado_id integer
);


ALTER TABLE dbo.ordenes_viajes_log OWNER TO aitrolsystem;

--
-- Name: permisos_sistema; Type: TABLE; Schema: dbo; Owner: aitrolsystem
--

CREATE TABLE dbo.permisos_sistema (
    id bigint NOT NULL,
    nombre text NOT NULL,
    descripcion text,
    menu_id integer NOT NULL,
    icono_menu text,
    accion text
);


ALTER TABLE dbo.permisos_sistema OWNER TO aitrolsystem;

--
-- Name: permisos_sistema_id_seq; Type: SEQUENCE; Schema: dbo; Owner: aitrolsystem
--

CREATE SEQUENCE dbo.permisos_sistema_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE dbo.permisos_sistema_id_seq OWNER TO aitrolsystem;

--
-- Name: permisos_sistema_id_seq; Type: SEQUENCE OWNED BY; Schema: dbo; Owner: aitrolsystem
--

ALTER SEQUENCE dbo.permisos_sistema_id_seq OWNED BY dbo.permisos_sistema.id;


--
-- Name: puertos; Type: TABLE; Schema: dbo; Owner: aitrolsystem
--

CREATE TABLE dbo.puertos (
    id bigint NOT NULL,
    nombre text,
    direccion text,
    estado smallint DEFAULT '1'::smallint,
    telefono text
);


ALTER TABLE dbo.puertos OWNER TO aitrolsystem;

--
-- Name: puertos_id_seq; Type: SEQUENCE; Schema: dbo; Owner: aitrolsystem
--

CREATE SEQUENCE dbo.puertos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE dbo.puertos_id_seq OWNER TO aitrolsystem;

--
-- Name: puertos_id_seq; Type: SEQUENCE OWNED BY; Schema: dbo; Owner: aitrolsystem
--

ALTER SEQUENCE dbo.puertos_id_seq OWNED BY dbo.puertos.id;


--
-- Name: puntos; Type: TABLE; Schema: dbo; Owner: aitrolsystem
--

CREATE TABLE dbo.puntos (
    id bigint NOT NULL,
    puntos integer,
    user_id bigint,
    created_at timestamp with time zone
);


ALTER TABLE dbo.puntos OWNER TO aitrolsystem;

--
-- Name: puntos_id_seq; Type: SEQUENCE; Schema: dbo; Owner: aitrolsystem
--

CREATE SEQUENCE dbo.puntos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE dbo.puntos_id_seq OWNER TO aitrolsystem;

--
-- Name: puntos_id_seq; Type: SEQUENCE OWNED BY; Schema: dbo; Owner: aitrolsystem
--

ALTER SEQUENCE dbo.puntos_id_seq OWNED BY dbo.puntos.id;


--
-- Name: puntos_log; Type: TABLE; Schema: dbo; Owner: aitrolsystem
--

CREATE TABLE dbo.puntos_log (
    id bigint NOT NULL,
    puntos_ant integer,
    puntos integer,
    created_at timestamp with time zone,
    puntos_id integer
);


ALTER TABLE dbo.puntos_log OWNER TO aitrolsystem;

--
-- Name: puntos_log_id_seq; Type: SEQUENCE; Schema: dbo; Owner: aitrolsystem
--

CREATE SEQUENCE dbo.puntos_log_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE dbo.puntos_log_id_seq OWNER TO aitrolsystem;

--
-- Name: puntos_log_id_seq; Type: SEQUENCE OWNED BY; Schema: dbo; Owner: aitrolsystem
--

ALTER SEQUENCE dbo.puntos_log_id_seq OWNED BY dbo.puntos_log.id;


--
-- Name: rh_areas; Type: TABLE; Schema: dbo; Owner: aitrolsystem
--

CREATE TABLE dbo.rh_areas (
    id bigint NOT NULL,
    nombre text NOT NULL,
    descripcion text,
    estado smallint DEFAULT '1'::smallint,
    id_empresa integer,
    id_sucursal integer
);


ALTER TABLE dbo.rh_areas OWNER TO aitrolsystem;

--
-- Name: rh_areas_id_seq; Type: SEQUENCE; Schema: dbo; Owner: aitrolsystem
--

CREATE SEQUENCE dbo.rh_areas_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE dbo.rh_areas_id_seq OWNER TO aitrolsystem;

--
-- Name: rh_areas_id_seq; Type: SEQUENCE OWNED BY; Schema: dbo; Owner: aitrolsystem
--

ALTER SEQUENCE dbo.rh_areas_id_seq OWNED BY dbo.rh_areas.id;


--
-- Name: rh_cargos; Type: TABLE; Schema: dbo; Owner: aitrolsystem
--

CREATE TABLE dbo.rh_cargos (
    id bigint NOT NULL,
    nombre text NOT NULL,
    descripcion text,
    id_area integer,
    id_nivel integer,
    sueldo_minimo numeric,
    sueldo_maximo numeric,
    estado boolean DEFAULT true,
    fecha_creacion timestamp without time zone DEFAULT now()
);


ALTER TABLE dbo.rh_cargos OWNER TO aitrolsystem;

--
-- Name: rh_cargos_id_seq; Type: SEQUENCE; Schema: dbo; Owner: aitrolsystem
--

CREATE SEQUENCE dbo.rh_cargos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE dbo.rh_cargos_id_seq OWNER TO aitrolsystem;

--
-- Name: rh_cargos_id_seq; Type: SEQUENCE OWNED BY; Schema: dbo; Owner: aitrolsystem
--

ALTER SEQUENCE dbo.rh_cargos_id_seq OWNED BY dbo.rh_cargos.id;


--
-- Name: rh_contratos; Type: TABLE; Schema: dbo; Owner: aitrolsystem
--

CREATE TABLE dbo.rh_contratos (
    id bigint NOT NULL,
    empleado_id bigint NOT NULL,
    tipo_contrato text NOT NULL,
    fecha_inicio date NOT NULL,
    fecha_fin date,
    cargo_id bigint NOT NULL,
    sueldo_base numeric NOT NULL,
    estado text DEFAULT 'Activo'::text,
    fecha_creacion timestamp without time zone DEFAULT now(),
    fecha_modificacion timestamp without time zone DEFAULT now(),
    observaciones text
);


ALTER TABLE dbo.rh_contratos OWNER TO aitrolsystem;

--
-- Name: rh_contratos_id_seq; Type: SEQUENCE; Schema: dbo; Owner: aitrolsystem
--

CREATE SEQUENCE dbo.rh_contratos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE dbo.rh_contratos_id_seq OWNER TO aitrolsystem;

--
-- Name: rh_contratos_id_seq; Type: SEQUENCE OWNED BY; Schema: dbo; Owner: aitrolsystem
--

ALTER SEQUENCE dbo.rh_contratos_id_seq OWNED BY dbo.rh_contratos.id;


--
-- Name: rh_documentos_empleado; Type: TABLE; Schema: dbo; Owner: aitrolsystem
--

CREATE TABLE dbo.rh_documentos_empleado (
    id bigint NOT NULL,
    empleado_id bigint NOT NULL,
    tipo_documento text NOT NULL,
    nombre_archivo text NOT NULL,
    ruta_archivo text NOT NULL,
    fecha_carga timestamp without time zone DEFAULT now(),
    estado text DEFAULT 'Vigente'::text,
    observaciones text,
    fecha_vencimiento date,
    usuario_carga text
);


ALTER TABLE dbo.rh_documentos_empleado OWNER TO aitrolsystem;

--
-- Name: rh_documentos_empleado_id_seq; Type: SEQUENCE; Schema: dbo; Owner: aitrolsystem
--

CREATE SEQUENCE dbo.rh_documentos_empleado_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE dbo.rh_documentos_empleado_id_seq OWNER TO aitrolsystem;

--
-- Name: rh_documentos_empleado_id_seq; Type: SEQUENCE OWNED BY; Schema: dbo; Owner: aitrolsystem
--

ALTER SEQUENCE dbo.rh_documentos_empleado_id_seq OWNED BY dbo.rh_documentos_empleado.id;


--
-- Name: rh_empleados; Type: TABLE; Schema: dbo; Owner: aitrolsystem
--

CREATE TABLE dbo.rh_empleados (
    id bigint NOT NULL,
    cedula text NOT NULL,
    nombres text NOT NULL,
    apellidos text NOT NULL,
    fecha_nacimiento date NOT NULL,
    cuenta_bancaria text,
    tipo_cuenta_bancaria text,
    direccion text,
    telefono text,
    email text,
    fecha_ingreso date NOT NULL,
    cargo text,
    sueldo_basico numeric NOT NULL,
    estado boolean DEFAULT true,
    fecha_salida date,
    area_id integer,
    jefe_id integer,
    foto text,
    acumula text DEFAULT 'NO'::text,
    p_quirografario numeric DEFAULT '0'::numeric,
    p_hipotecario numeric DEFAULT '0'::numeric,
    seguro_priv numeric DEFAULT '0'::numeric,
    hora_entrada time without time zone,
    hora_salida time without time zone,
    id_sucursal integer NOT NULL,
    cargo_id integer
);


ALTER TABLE dbo.rh_empleados OWNER TO aitrolsystem;

--
-- Name: rh_empleados_id_seq; Type: SEQUENCE; Schema: dbo; Owner: aitrolsystem
--

CREATE SEQUENCE dbo.rh_empleados_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE dbo.rh_empleados_id_seq OWNER TO aitrolsystem;

--
-- Name: rh_empleados_id_seq; Type: SEQUENCE OWNED BY; Schema: dbo; Owner: aitrolsystem
--

ALTER SEQUENCE dbo.rh_empleados_id_seq OWNED BY dbo.rh_empleados.id;


--
-- Name: rh_marcaciones; Type: TABLE; Schema: dbo; Owner: aitrolsystem
--

CREATE TABLE dbo.rh_marcaciones (
    id bigint NOT NULL,
    empleado_id integer NOT NULL,
    tipo text NOT NULL,
    latitud numeric NOT NULL,
    longitud numeric NOT NULL,
    "timestamp" timestamp with time zone NOT NULL,
    id_empresa integer,
    id_sucursal integer NOT NULL
);


ALTER TABLE dbo.rh_marcaciones OWNER TO aitrolsystem;

--
-- Name: rh_marcaciones_id_seq; Type: SEQUENCE; Schema: dbo; Owner: aitrolsystem
--

CREATE SEQUENCE dbo.rh_marcaciones_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE dbo.rh_marcaciones_id_seq OWNER TO aitrolsystem;

--
-- Name: rh_marcaciones_id_seq; Type: SEQUENCE OWNED BY; Schema: dbo; Owner: aitrolsystem
--

ALTER SEQUENCE dbo.rh_marcaciones_id_seq OWNED BY dbo.rh_marcaciones.id;


--
-- Name: rh_niveles_jerarquicos; Type: TABLE; Schema: dbo; Owner: aitrolsystem
--

CREATE TABLE dbo.rh_niveles_jerarquicos (
    id bigint NOT NULL,
    nombre text NOT NULL,
    descripcion text,
    nivel_orden smallint NOT NULL,
    estado boolean DEFAULT true,
    fecha_creacion timestamp without time zone DEFAULT now()
);


ALTER TABLE dbo.rh_niveles_jerarquicos OWNER TO aitrolsystem;

--
-- Name: rh_niveles_jerarquicos_id_seq; Type: SEQUENCE; Schema: dbo; Owner: aitrolsystem
--

CREATE SEQUENCE dbo.rh_niveles_jerarquicos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE dbo.rh_niveles_jerarquicos_id_seq OWNER TO aitrolsystem;

--
-- Name: rh_niveles_jerarquicos_id_seq; Type: SEQUENCE OWNED BY; Schema: dbo; Owner: aitrolsystem
--

ALTER SEQUENCE dbo.rh_niveles_jerarquicos_id_seq OWNED BY dbo.rh_niveles_jerarquicos.id;


--
-- Name: rh_permisos; Type: TABLE; Schema: dbo; Owner: aitrolsystem
--

CREATE TABLE dbo.rh_permisos (
    id bigint NOT NULL,
    empleado_id integer NOT NULL,
    tipo_permiso text NOT NULL,
    fecha_inicio date NOT NULL,
    fecha_fin date NOT NULL,
    motivo text,
    estado text DEFAULT 'Pendiente'::text,
    id_empresa integer NOT NULL,
    id_sucursal integer NOT NULL,
    fecha_creacion date DEFAULT now()
);


ALTER TABLE dbo.rh_permisos OWNER TO aitrolsystem;

--
-- Name: rh_permisos_id_seq; Type: SEQUENCE; Schema: dbo; Owner: aitrolsystem
--

CREATE SEQUENCE dbo.rh_permisos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE dbo.rh_permisos_id_seq OWNER TO aitrolsystem;

--
-- Name: rh_permisos_id_seq; Type: SEQUENCE OWNED BY; Schema: dbo; Owner: aitrolsystem
--

ALTER SEQUENCE dbo.rh_permisos_id_seq OWNED BY dbo.rh_permisos.id;


--
-- Name: rh_prestamos; Type: TABLE; Schema: dbo; Owner: aitrolsystem
--

CREATE TABLE dbo.rh_prestamos (
    id bigint NOT NULL,
    empleado_id integer NOT NULL,
    monto numeric NOT NULL,
    fecha_prestamo date NOT NULL,
    cuotas integer NOT NULL,
    valor_cuota numeric NOT NULL,
    saldo_pendiente numeric NOT NULL,
    estado text DEFAULT 'Activo'::text,
    id_empresa integer NOT NULL,
    id_sucursal integer NOT NULL
);


ALTER TABLE dbo.rh_prestamos OWNER TO aitrolsystem;

--
-- Name: rh_prestamos_cuotas; Type: TABLE; Schema: dbo; Owner: aitrolsystem
--

CREATE TABLE dbo.rh_prestamos_cuotas (
    id bigint NOT NULL,
    prestamo_id integer NOT NULL,
    numero_cuota integer NOT NULL,
    fecha_vencimiento date NOT NULL,
    valor_cuota numeric NOT NULL,
    estado text DEFAULT 'Pendiente'::text,
    fecha_pago date,
    rol_pago_det_id integer
);


ALTER TABLE dbo.rh_prestamos_cuotas OWNER TO aitrolsystem;

--
-- Name: rh_prestamos_cuotas_id_seq; Type: SEQUENCE; Schema: dbo; Owner: aitrolsystem
--

CREATE SEQUENCE dbo.rh_prestamos_cuotas_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE dbo.rh_prestamos_cuotas_id_seq OWNER TO aitrolsystem;

--
-- Name: rh_prestamos_cuotas_id_seq; Type: SEQUENCE OWNED BY; Schema: dbo; Owner: aitrolsystem
--

ALTER SEQUENCE dbo.rh_prestamos_cuotas_id_seq OWNED BY dbo.rh_prestamos_cuotas.id;


--
-- Name: rh_prestamos_id_seq; Type: SEQUENCE; Schema: dbo; Owner: aitrolsystem
--

CREATE SEQUENCE dbo.rh_prestamos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE dbo.rh_prestamos_id_seq OWNER TO aitrolsystem;

--
-- Name: rh_prestamos_id_seq; Type: SEQUENCE OWNED BY; Schema: dbo; Owner: aitrolsystem
--

ALTER SEQUENCE dbo.rh_prestamos_id_seq OWNED BY dbo.rh_prestamos.id;


--
-- Name: rh_roles_pago_cab; Type: TABLE; Schema: dbo; Owner: aitrolsystem
--

CREATE TABLE dbo.rh_roles_pago_cab (
    id bigint NOT NULL,
    tipo_rol text NOT NULL,
    fecha_generacion date NOT NULL,
    mes_correspondiente integer NOT NULL,
    anio_correspondiente integer NOT NULL,
    estado text DEFAULT 'Pendiente'::text,
    aprobado_por bigint,
    fecha_aprobacion date,
    observaciones text,
    id_sucursal integer NOT NULL,
    total numeric(18,2) DEFAULT 0
);


ALTER TABLE dbo.rh_roles_pago_cab OWNER TO aitrolsystem;

--
-- Name: rh_roles_pago_cab_id_seq; Type: SEQUENCE; Schema: dbo; Owner: aitrolsystem
--

CREATE SEQUENCE dbo.rh_roles_pago_cab_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE dbo.rh_roles_pago_cab_id_seq OWNER TO aitrolsystem;

--
-- Name: rh_roles_pago_cab_id_seq; Type: SEQUENCE OWNED BY; Schema: dbo; Owner: aitrolsystem
--

ALTER SEQUENCE dbo.rh_roles_pago_cab_id_seq OWNED BY dbo.rh_roles_pago_cab.id;


--
-- Name: rh_roles_pago_det; Type: TABLE; Schema: dbo; Owner: aitrolsystem
--

CREATE TABLE dbo.rh_roles_pago_det (
    id bigint NOT NULL,
    cabecera_id integer NOT NULL,
    empleado_id integer NOT NULL,
    sueldo_basico numeric NOT NULL,
    horas_extras numeric DEFAULT '0'::numeric,
    bonificaciones numeric DEFAULT '0'::numeric,
    comisiones numeric DEFAULT '0'::numeric,
    decimo_tercero numeric DEFAULT '0'::numeric,
    decimo_cuarto numeric DEFAULT '0'::numeric,
    fondos_reserva numeric DEFAULT '0'::numeric,
    vacaciones numeric DEFAULT '0'::numeric,
    prestamos numeric DEFAULT '0'::numeric,
    multas numeric DEFAULT '0'::numeric,
    iess_personal numeric DEFAULT '0'::numeric,
    otros_descuentos numeric DEFAULT '0'::numeric,
    total_ingresos numeric DEFAULT '0'::numeric,
    total_descuentos numeric DEFAULT '0'::numeric,
    neto_a_pagar numeric NOT NULL,
    p_hipotecario numeric DEFAULT '0'::numeric,
    p_quirografario numeric DEFAULT '0'::numeric,
    seguro_priv numeric DEFAULT '0'::numeric
);


ALTER TABLE dbo.rh_roles_pago_det OWNER TO aitrolsystem;

--
-- Name: rh_roles_pago_det_id_seq; Type: SEQUENCE; Schema: dbo; Owner: aitrolsystem
--

CREATE SEQUENCE dbo.rh_roles_pago_det_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE dbo.rh_roles_pago_det_id_seq OWNER TO aitrolsystem;

--
-- Name: rh_roles_pago_det_id_seq; Type: SEQUENCE OWNED BY; Schema: dbo; Owner: aitrolsystem
--

ALTER SEQUENCE dbo.rh_roles_pago_det_id_seq OWNED BY dbo.rh_roles_pago_det.id;


--
-- Name: rh_usuario; Type: TABLE; Schema: dbo; Owner: aitrolsystem
--

CREATE TABLE dbo.rh_usuario (
    id bigint NOT NULL,
    empleado_id integer NOT NULL,
    usuario_id bigint NOT NULL
);


ALTER TABLE dbo.rh_usuario OWNER TO aitrolsystem;

--
-- Name: rh_usuario_id_seq; Type: SEQUENCE; Schema: dbo; Owner: aitrolsystem
--

CREATE SEQUENCE dbo.rh_usuario_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE dbo.rh_usuario_id_seq OWNER TO aitrolsystem;

--
-- Name: rh_usuario_id_seq; Type: SEQUENCE OWNED BY; Schema: dbo; Owner: aitrolsystem
--

ALTER SEQUENCE dbo.rh_usuario_id_seq OWNED BY dbo.rh_usuario.id;


--
-- Name: rh_vacaciones; Type: TABLE; Schema: dbo; Owner: aitrolsystem
--

CREATE TABLE dbo.rh_vacaciones (
    id bigint NOT NULL,
    empleado_id integer NOT NULL,
    fecha_inicio date NOT NULL,
    fecha_fin date NOT NULL,
    dias_solicitados integer NOT NULL,
    motivo text,
    estado text DEFAULT 'pendiente'::text,
    fecha_solicitud date DEFAULT CURRENT_TIMESTAMP,
    fecha_respuesta date,
    aprobado_por integer,
    documento text
);


ALTER TABLE dbo.rh_vacaciones OWNER TO aitrolsystem;

--
-- Name: rh_vacaciones_id_seq; Type: SEQUENCE; Schema: dbo; Owner: aitrolsystem
--

CREATE SEQUENCE dbo.rh_vacaciones_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE dbo.rh_vacaciones_id_seq OWNER TO aitrolsystem;

--
-- Name: rh_vacaciones_id_seq; Type: SEQUENCE OWNED BY; Schema: dbo; Owner: aitrolsystem
--

ALTER SEQUENCE dbo.rh_vacaciones_id_seq OWNED BY dbo.rh_vacaciones.id;


--
-- Name: roles; Type: TABLE; Schema: dbo; Owner: aitrolsystem
--

CREATE TABLE dbo.roles (
    id bigint NOT NULL,
    nombre text,
    estado smallint,
    icono text,
    subtitulo text,
    descripcion text
);


ALTER TABLE dbo.roles OWNER TO aitrolsystem;

--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: dbo; Owner: aitrolsystem
--

CREATE SEQUENCE dbo.roles_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE dbo.roles_id_seq OWNER TO aitrolsystem;

--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: dbo; Owner: aitrolsystem
--

ALTER SEQUENCE dbo.roles_id_seq OWNED BY dbo.roles.id;


--
-- Name: roles_permisos; Type: TABLE; Schema: dbo; Owner: aitrolsystem
--

CREATE TABLE dbo.roles_permisos (
    id bigint NOT NULL,
    rol_id integer NOT NULL,
    permiso_id integer NOT NULL,
    accion text NOT NULL
);


ALTER TABLE dbo.roles_permisos OWNER TO aitrolsystem;

--
-- Name: roles_permisos_id_seq; Type: SEQUENCE; Schema: dbo; Owner: aitrolsystem
--

CREATE SEQUENCE dbo.roles_permisos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE dbo.roles_permisos_id_seq OWNER TO aitrolsystem;

--
-- Name: roles_permisos_id_seq; Type: SEQUENCE OWNED BY; Schema: dbo; Owner: aitrolsystem
--

ALTER SEQUENCE dbo.roles_permisos_id_seq OWNED BY dbo.roles_permisos.id;


--
-- Name: seq_numero_factura; Type: SEQUENCE; Schema: dbo; Owner: aitrolsystem
--

CREATE SEQUENCE dbo.seq_numero_factura
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE dbo.seq_numero_factura OWNER TO aitrolsystem;

--
-- Name: sis_datos_facturacion; Type: TABLE; Schema: dbo; Owner: aitrolsystem
--

CREATE TABLE dbo.sis_datos_facturacion (
    id integer NOT NULL,
    nombre_comercial character varying(200) NOT NULL,
    ruc character varying(13) NOT NULL,
    direccion_matriz character varying(200) NOT NULL,
    contribuyente_especial character varying(200) NOT NULL,
    obligado_contabilidad character varying(30) NOT NULL,
    razon_social character varying(200) NOT NULL
);


ALTER TABLE dbo.sis_datos_facturacion OWNER TO aitrolsystem;

--
-- Name: COLUMN sis_datos_facturacion.ruc; Type: COMMENT; Schema: dbo; Owner: aitrolsystem
--

COMMENT ON COLUMN dbo.sis_datos_facturacion.ruc IS 'ruc o id';


--
-- Name: sis_datos_facturacion_id_seq; Type: SEQUENCE; Schema: dbo; Owner: aitrolsystem
--

CREATE SEQUENCE dbo.sis_datos_facturacion_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE dbo.sis_datos_facturacion_id_seq OWNER TO aitrolsystem;

--
-- Name: sis_datos_facturacion_id_seq; Type: SEQUENCE OWNED BY; Schema: dbo; Owner: aitrolsystem
--

ALTER SEQUENCE dbo.sis_datos_facturacion_id_seq OWNED BY dbo.sis_datos_facturacion.id;


--
-- Name: sis_empresa; Type: TABLE; Schema: dbo; Owner: aitrolsystem
--

CREATE TABLE dbo.sis_empresa (
    id_empresa bigint NOT NULL,
    ruc text NOT NULL,
    razon_social text NOT NULL,
    nombre_comercial text,
    direccion_matriz text,
    contribuyente_especial text,
    obligado_contabilidad boolean DEFAULT false NOT NULL,
    favicon character varying(200),
    logo character varying(200),
    firma character varying(200),
    clave_firma character varying(200)
);


ALTER TABLE dbo.sis_empresa OWNER TO aitrolsystem;

--
-- Name: sis_empresa_id_empresa_seq; Type: SEQUENCE; Schema: dbo; Owner: aitrolsystem
--

CREATE SEQUENCE dbo.sis_empresa_id_empresa_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE dbo.sis_empresa_id_empresa_seq OWNER TO aitrolsystem;

--
-- Name: sis_empresa_id_empresa_seq; Type: SEQUENCE OWNED BY; Schema: dbo; Owner: aitrolsystem
--

ALTER SEQUENCE dbo.sis_empresa_id_empresa_seq OWNED BY dbo.sis_empresa.id_empresa;


--
-- Name: sis_punto_emision; Type: TABLE; Schema: dbo; Owner: aitrolsystem
--

CREATE TABLE dbo.sis_punto_emision (
    id_punto bigint NOT NULL,
    id_sucursal integer NOT NULL,
    codigo text NOT NULL,
    descripcion text
);


ALTER TABLE dbo.sis_punto_emision OWNER TO aitrolsystem;

--
-- Name: sis_punto_emision_id_punto_seq; Type: SEQUENCE; Schema: dbo; Owner: aitrolsystem
--

CREATE SEQUENCE dbo.sis_punto_emision_id_punto_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE dbo.sis_punto_emision_id_punto_seq OWNER TO aitrolsystem;

--
-- Name: sis_punto_emision_id_punto_seq; Type: SEQUENCE OWNED BY; Schema: dbo; Owner: aitrolsystem
--

ALTER SEQUENCE dbo.sis_punto_emision_id_punto_seq OWNED BY dbo.sis_punto_emision.id_punto;


--
-- Name: sis_sucursal; Type: TABLE; Schema: dbo; Owner: aitrolsystem
--

CREATE TABLE dbo.sis_sucursal (
    id_sucursal bigint NOT NULL,
    id_empresa integer NOT NULL,
    codigo text NOT NULL,
    direccion text,
    telefono text
);


ALTER TABLE dbo.sis_sucursal OWNER TO aitrolsystem;

--
-- Name: sis_sucursal_id_sucursal_seq; Type: SEQUENCE; Schema: dbo; Owner: aitrolsystem
--

CREATE SEQUENCE dbo.sis_sucursal_id_sucursal_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE dbo.sis_sucursal_id_sucursal_seq OWNER TO aitrolsystem;

--
-- Name: sis_sucursal_id_sucursal_seq; Type: SEQUENCE OWNED BY; Schema: dbo; Owner: aitrolsystem
--

ALTER SEQUENCE dbo.sis_sucursal_id_sucursal_seq OWNED BY dbo.sis_sucursal.id_sucursal;


--
-- Name: sysdiagrams; Type: TABLE; Schema: dbo; Owner: aitrolsystem
--

CREATE TABLE dbo.sysdiagrams (
    name text NOT NULL,
    principal_id integer NOT NULL,
    diagram_id bigint NOT NULL,
    version integer,
    definition bytea
);


ALTER TABLE dbo.sysdiagrams OWNER TO aitrolsystem;

--
-- Name: sysdiagrams_diagram_id_seq; Type: SEQUENCE; Schema: dbo; Owner: aitrolsystem
--

CREATE SEQUENCE dbo.sysdiagrams_diagram_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE dbo.sysdiagrams_diagram_id_seq OWNER TO aitrolsystem;

--
-- Name: sysdiagrams_diagram_id_seq; Type: SEQUENCE OWNED BY; Schema: dbo; Owner: aitrolsystem
--

ALTER SEQUENCE dbo.sysdiagrams_diagram_id_seq OWNED BY dbo.sysdiagrams.diagram_id;


--
-- Name: usuarios; Type: TABLE; Schema: dbo; Owner: aitrolsystem
--

CREATE TABLE dbo.usuarios (
    id bigint NOT NULL,
    nombre text,
    apellido text,
    fecha_nacimiento date,
    telefono text,
    nombre_usuario text,
    password text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    direccion text,
    foto text,
    email text,
    token text,
    refresh_token text,
    reset_token text
);


ALTER TABLE dbo.usuarios OWNER TO aitrolsystem;

--
-- Name: usuarios_id_seq; Type: SEQUENCE; Schema: dbo; Owner: aitrolsystem
--

CREATE SEQUENCE dbo.usuarios_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE dbo.usuarios_id_seq OWNER TO aitrolsystem;

--
-- Name: usuarios_id_seq; Type: SEQUENCE OWNED BY; Schema: dbo; Owner: aitrolsystem
--

ALTER SEQUENCE dbo.usuarios_id_seq OWNED BY dbo.usuarios.id;


--
-- Name: usuarios_roles; Type: TABLE; Schema: dbo; Owner: aitrolsystem
--

CREATE TABLE dbo.usuarios_roles (
    id bigint NOT NULL,
    user_id bigint,
    rol_id integer
);


ALTER TABLE dbo.usuarios_roles OWNER TO aitrolsystem;

--
-- Name: usuarios_roles_id_seq; Type: SEQUENCE; Schema: dbo; Owner: aitrolsystem
--

CREATE SEQUENCE dbo.usuarios_roles_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE dbo.usuarios_roles_id_seq OWNER TO aitrolsystem;

--
-- Name: usuarios_roles_id_seq; Type: SEQUENCE OWNED BY; Schema: dbo; Owner: aitrolsystem
--

ALTER SEQUENCE dbo.usuarios_roles_id_seq OWNED BY dbo.usuarios_roles.id;


--
-- Name: usuarios_sucursales; Type: TABLE; Schema: dbo; Owner: aitrolsystem
--

CREATE TABLE dbo.usuarios_sucursales (
    id integer NOT NULL,
    user_id integer NOT NULL,
    id_sucursal integer NOT NULL,
    is_default boolean DEFAULT false
);


ALTER TABLE dbo.usuarios_sucursales OWNER TO aitrolsystem;

--
-- Name: usuarios_sucursales_id_seq; Type: SEQUENCE; Schema: dbo; Owner: aitrolsystem
--

CREATE SEQUENCE dbo.usuarios_sucursales_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE dbo.usuarios_sucursales_id_seq OWNER TO aitrolsystem;

--
-- Name: usuarios_sucursales_id_seq; Type: SEQUENCE OWNED BY; Schema: dbo; Owner: aitrolsystem
--

ALTER SEQUENCE dbo.usuarios_sucursales_id_seq OWNED BY dbo.usuarios_sucursales.id;


--
-- Name: vehiculos; Type: TABLE; Schema: dbo; Owner: aitrolsystem
--

CREATE TABLE dbo.vehiculos (
    id bigint NOT NULL,
    nombre text,
    tipo_id integer,
    kilometraje_inicial numeric,
    capacidad numeric,
    estado smallint,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    foto text,
    conductor_id integer,
    aviso_mantenimiento numeric
);


ALTER TABLE dbo.vehiculos OWNER TO aitrolsystem;

--
-- Name: vehiculos_id_seq; Type: SEQUENCE; Schema: dbo; Owner: aitrolsystem
--

CREATE SEQUENCE dbo.vehiculos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE dbo.vehiculos_id_seq OWNER TO aitrolsystem;

--
-- Name: vehiculos_id_seq; Type: SEQUENCE OWNED BY; Schema: dbo; Owner: aitrolsystem
--

ALTER SEQUENCE dbo.vehiculos_id_seq OWNED BY dbo.vehiculos.id;


--
-- Name: vehiculos_kilometraje; Type: TABLE; Schema: dbo; Owner: aitrolsystem
--

CREATE TABLE dbo.vehiculos_kilometraje (
    id bigint NOT NULL,
    kilometraje numeric,
    vehiculo_id integer,
    comentarios text,
    fecha timestamp with time zone,
    created_at timestamp with time zone
);


ALTER TABLE dbo.vehiculos_kilometraje OWNER TO aitrolsystem;

--
-- Name: vehiculos_kilometraje_id_seq; Type: SEQUENCE; Schema: dbo; Owner: aitrolsystem
--

CREATE SEQUENCE dbo.vehiculos_kilometraje_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE dbo.vehiculos_kilometraje_id_seq OWNER TO aitrolsystem;

--
-- Name: vehiculos_kilometraje_id_seq; Type: SEQUENCE OWNED BY; Schema: dbo; Owner: aitrolsystem
--

ALTER SEQUENCE dbo.vehiculos_kilometraje_id_seq OWNED BY dbo.vehiculos_kilometraje.id;


--
-- Name: vehiculos_mantenimiento; Type: TABLE; Schema: dbo; Owner: aitrolsystem
--

CREATE TABLE dbo.vehiculos_mantenimiento (
    id bigint NOT NULL,
    vehiculo_id integer,
    fecha date,
    kilometraje numeric,
    detalles text,
    fecha_tentativa date,
    estado smallint
);


ALTER TABLE dbo.vehiculos_mantenimiento OWNER TO aitrolsystem;

--
-- Name: vehiculos_mantenimiento_id_seq; Type: SEQUENCE; Schema: dbo; Owner: aitrolsystem
--

CREATE SEQUENCE dbo.vehiculos_mantenimiento_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE dbo.vehiculos_mantenimiento_id_seq OWNER TO aitrolsystem;

--
-- Name: vehiculos_mantenimiento_id_seq; Type: SEQUENCE OWNED BY; Schema: dbo; Owner: aitrolsystem
--

ALTER SEQUENCE dbo.vehiculos_mantenimiento_id_seq OWNED BY dbo.vehiculos_mantenimiento.id;


--
-- Name: vehiculos_tipos; Type: TABLE; Schema: dbo; Owner: aitrolsystem
--

CREATE TABLE dbo.vehiculos_tipos (
    id bigint NOT NULL,
    nombre text,
    estado smallint,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


ALTER TABLE dbo.vehiculos_tipos OWNER TO aitrolsystem;

--
-- Name: vehiculos_tipos_id_seq; Type: SEQUENCE; Schema: dbo; Owner: aitrolsystem
--

CREATE SEQUENCE dbo.vehiculos_tipos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE dbo.vehiculos_tipos_id_seq OWNER TO aitrolsystem;

--
-- Name: vehiculos_tipos_id_seq; Type: SEQUENCE OWNED BY; Schema: dbo; Owner: aitrolsystem
--

ALTER SEQUENCE dbo.vehiculos_tipos_id_seq OWNED BY dbo.vehiculos_tipos.id;


--
-- Name: adjuntos; Type: TABLE; Schema: salud; Owner: aitrolsystem
--

CREATE TABLE salud.adjuntos (
    id bigint NOT NULL,
    historia_id bigint,
    tipo_archivo character varying(50),
    nombre_archivo text,
    url_archivo text,
    descripcion text,
    cargado_por bigint,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE salud.adjuntos OWNER TO aitrolsystem;

--
-- Name: adjuntos_id_seq; Type: SEQUENCE; Schema: salud; Owner: aitrolsystem
--

CREATE SEQUENCE salud.adjuntos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE salud.adjuntos_id_seq OWNER TO aitrolsystem;

--
-- Name: adjuntos_id_seq; Type: SEQUENCE OWNED BY; Schema: salud; Owner: aitrolsystem
--

ALTER SEQUENCE salud.adjuntos_id_seq OWNED BY salud.adjuntos.id;


--
-- Name: afiliaciones; Type: TABLE; Schema: salud; Owner: aitrolsystem
--

CREATE TABLE salud.afiliaciones (
    id bigint NOT NULL,
    persona_id bigint NOT NULL,
    aseguradora_id bigint,
    numero_afiliacion character varying(100),
    tipo_afiliacion character varying(50),
    fecha_inicio date,
    fecha_fin date,
    vigente boolean DEFAULT true,
    contrato_info jsonb,
    sis_sucursal_id bigint,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE salud.afiliaciones OWNER TO aitrolsystem;

--
-- Name: afiliaciones_id_seq; Type: SEQUENCE; Schema: salud; Owner: aitrolsystem
--

CREATE SEQUENCE salud.afiliaciones_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE salud.afiliaciones_id_seq OWNER TO aitrolsystem;

--
-- Name: afiliaciones_id_seq; Type: SEQUENCE OWNED BY; Schema: salud; Owner: aitrolsystem
--

ALTER SEQUENCE salud.afiliaciones_id_seq OWNED BY salud.afiliaciones.id;


--
-- Name: agendas; Type: TABLE; Schema: salud; Owner: aitrolsystem
--

CREATE TABLE salud.agendas (
    id bigint NOT NULL,
    personal_id bigint NOT NULL,
    unidad_id bigint,
    sis_sucursal_id bigint,
    fecha date NOT NULL,
    hora_inicio time without time zone,
    hora_fin time without time zone,
    intervalo_minutos integer DEFAULT 15,
    tipo_consulta character varying(50),
    creado_por bigint,
    estado character varying(20) DEFAULT 'ACTIVO'::character varying
);


ALTER TABLE salud.agendas OWNER TO aitrolsystem;

--
-- Name: agendas_id_seq; Type: SEQUENCE; Schema: salud; Owner: aitrolsystem
--

CREATE SEQUENCE salud.agendas_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE salud.agendas_id_seq OWNER TO aitrolsystem;

--
-- Name: agendas_id_seq; Type: SEQUENCE OWNED BY; Schema: salud; Owner: aitrolsystem
--

ALTER SEQUENCE salud.agendas_id_seq OWNED BY salud.agendas.id;


--
-- Name: anestesia_registros; Type: TABLE; Schema: salud; Owner: aitrolsystem
--

CREATE TABLE salud.anestesia_registros (
    id bigint NOT NULL,
    programacion_id bigint,
    registro jsonb,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE salud.anestesia_registros OWNER TO aitrolsystem;

--
-- Name: anestesia_registros_id_seq; Type: SEQUENCE; Schema: salud; Owner: aitrolsystem
--

CREATE SEQUENCE salud.anestesia_registros_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE salud.anestesia_registros_id_seq OWNER TO aitrolsystem;

--
-- Name: anestesia_registros_id_seq; Type: SEQUENCE OWNED BY; Schema: salud; Owner: aitrolsystem
--

ALTER SEQUENCE salud.anestesia_registros_id_seq OWNED BY salud.anestesia_registros.id;


--
-- Name: aseguradoras; Type: TABLE; Schema: salud; Owner: aitrolsystem
--

CREATE TABLE salud.aseguradoras (
    id bigint NOT NULL,
    nombre text NOT NULL,
    tipo character varying(50),
    codigo character varying(50),
    direccion text,
    telefono character varying(50),
    email character varying(200),
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE salud.aseguradoras OWNER TO aitrolsystem;

--
-- Name: aseguradoras_id_seq; Type: SEQUENCE; Schema: salud; Owner: aitrolsystem
--

CREATE SEQUENCE salud.aseguradoras_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE salud.aseguradoras_id_seq OWNER TO aitrolsystem;

--
-- Name: aseguradoras_id_seq; Type: SEQUENCE OWNED BY; Schema: salud; Owner: aitrolsystem
--

ALTER SEQUENCE salud.aseguradoras_id_seq OWNED BY salud.aseguradoras.id;


--
-- Name: camas; Type: TABLE; Schema: salud; Owner: aitrolsystem
--

CREATE TABLE salud.camas (
    id bigint NOT NULL,
    sala_id bigint,
    codigo character varying(50) NOT NULL,
    tipo_cama character varying(50),
    estado character varying(30) DEFAULT 'DISPONIBLE'::character varying,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE salud.camas OWNER TO aitrolsystem;

--
-- Name: camas_id_seq; Type: SEQUENCE; Schema: salud; Owner: aitrolsystem
--

CREATE SEQUENCE salud.camas_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE salud.camas_id_seq OWNER TO aitrolsystem;

--
-- Name: camas_id_seq; Type: SEQUENCE OWNED BY; Schema: salud; Owner: aitrolsystem
--

ALTER SEQUENCE salud.camas_id_seq OWNED BY salud.camas.id;


--
-- Name: citas; Type: TABLE; Schema: salud; Owner: aitrolsystem
--

CREATE TABLE salud.citas (
    id bigint NOT NULL,
    paciente_id bigint NOT NULL,
    personal_id bigint NOT NULL,
    agenda_id bigint,
    sis_sucursal_id bigint,
    fecha_hora timestamp with time zone NOT NULL,
    duracion_minutos integer DEFAULT 30,
    motivo text,
    tipo character varying(50) DEFAULT 'CONSULTA'::character varying,
    estado character varying(30) DEFAULT 'PENDIENTE'::character varying,
    sala_id bigint,
    cama_id bigint,
    referencia_externa text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT citas_estado_check CHECK (((estado)::text = ANY ((ARRAY['PENDIENTE'::character varying, 'CONFIRMADA'::character varying, 'ATENDIDA'::character varying, 'CANCELADA'::character varying, 'NO_ASISTIO'::character varying])::text[])))
);


ALTER TABLE salud.citas OWNER TO aitrolsystem;

--
-- Name: citas_id_seq; Type: SEQUENCE; Schema: salud; Owner: aitrolsystem
--

CREATE SEQUENCE salud.citas_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE salud.citas_id_seq OWNER TO aitrolsystem;

--
-- Name: citas_id_seq; Type: SEQUENCE OWNED BY; Schema: salud; Owner: aitrolsystem
--

ALTER SEQUENCE salud.citas_id_seq OWNED BY salud.citas.id;


--
-- Name: consulta_diagnosticos; Type: TABLE; Schema: salud; Owner: aitrolsystem
--

CREATE TABLE salud.consulta_diagnosticos (
    id bigint NOT NULL,
    consulta_id bigint NOT NULL,
    diagnostico_id bigint NOT NULL,
    tipo_diagnostico character varying(15),
    observaciones text,
    CONSTRAINT consulta_diagnosticos_tipo_diagnostico_check CHECK (((tipo_diagnostico)::text = ANY ((ARRAY['PRESUNTIVO'::character varying, 'DEFINITIVO'::character varying])::text[])))
);


ALTER TABLE salud.consulta_diagnosticos OWNER TO aitrolsystem;

--
-- Name: consulta_diagnosticos_id_seq; Type: SEQUENCE; Schema: salud; Owner: aitrolsystem
--

CREATE SEQUENCE salud.consulta_diagnosticos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE salud.consulta_diagnosticos_id_seq OWNER TO aitrolsystem;

--
-- Name: consulta_diagnosticos_id_seq; Type: SEQUENCE OWNED BY; Schema: salud; Owner: aitrolsystem
--

ALTER SEQUENCE salud.consulta_diagnosticos_id_seq OWNED BY salud.consulta_diagnosticos.id;


--
-- Name: consulta_medica; Type: TABLE; Schema: salud; Owner: aitrolsystem
--

CREATE TABLE salud.consulta_medica (
    id bigint NOT NULL,
    historia_id bigint NOT NULL,
    fecha_hora timestamp with time zone DEFAULT now(),
    motivo_consulta text,
    enfermedad_actual text,
    revision_sistemas text,
    registrado_por bigint,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE salud.consulta_medica OWNER TO aitrolsystem;

--
-- Name: consulta_medica_id_seq; Type: SEQUENCE; Schema: salud; Owner: aitrolsystem
--

CREATE SEQUENCE salud.consulta_medica_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE salud.consulta_medica_id_seq OWNER TO aitrolsystem;

--
-- Name: consulta_medica_id_seq; Type: SEQUENCE OWNED BY; Schema: salud; Owner: aitrolsystem
--

ALTER SEQUENCE salud.consulta_medica_id_seq OWNED BY salud.consulta_medica.id;


--
-- Name: contactos_emergencia; Type: TABLE; Schema: salud; Owner: aitrolsystem
--

CREATE TABLE salud.contactos_emergencia (
    id bigint NOT NULL,
    persona_id bigint NOT NULL,
    nombre text NOT NULL,
    parentesco character varying(50),
    telefono character varying(50),
    direccion text,
    observaciones text,
    preferente boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE salud.contactos_emergencia OWNER TO aitrolsystem;

--
-- Name: contactos_emergencia_id_seq; Type: SEQUENCE; Schema: salud; Owner: aitrolsystem
--

CREATE SEQUENCE salud.contactos_emergencia_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE salud.contactos_emergencia_id_seq OWNER TO aitrolsystem;

--
-- Name: contactos_emergencia_id_seq; Type: SEQUENCE OWNED BY; Schema: salud; Owner: aitrolsystem
--

ALTER SEQUENCE salud.contactos_emergencia_id_seq OWNED BY salud.contactos_emergencia.id;


--
-- Name: diagnosticos_cat; Type: TABLE; Schema: salud; Owner: aitrolsystem
--

CREATE TABLE salud.diagnosticos_cat (
    id bigint NOT NULL,
    codigo_cie10 character varying(10) NOT NULL,
    descripcion text NOT NULL
);


ALTER TABLE salud.diagnosticos_cat OWNER TO aitrolsystem;

--
-- Name: diagnosticos_cat_id_seq; Type: SEQUENCE; Schema: salud; Owner: aitrolsystem
--

CREATE SEQUENCE salud.diagnosticos_cat_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE salud.diagnosticos_cat_id_seq OWNER TO aitrolsystem;

--
-- Name: diagnosticos_cat_id_seq; Type: SEQUENCE OWNED BY; Schema: salud; Owner: aitrolsystem
--

ALTER SEQUENCE salud.diagnosticos_cat_id_seq OWNED BY salud.diagnosticos_cat.id;


--
-- Name: dispensaciones; Type: TABLE; Schema: salud; Owner: aitrolsystem
--

CREATE TABLE salud.dispensaciones (
    id bigint NOT NULL,
    receta_id bigint,
    paciente_id bigint,
    personal_id bigint,
    fecha_dispensacion timestamp with time zone DEFAULT now(),
    almacen_id integer,
    sis_sucursal_id bigint,
    estado character varying(30) DEFAULT 'PENDIENTE'::character varying,
    observaciones text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE salud.dispensaciones OWNER TO aitrolsystem;

--
-- Name: dispensaciones_detalle; Type: TABLE; Schema: salud; Owner: aitrolsystem
--

CREATE TABLE salud.dispensaciones_detalle (
    id bigint NOT NULL,
    dispensacion_id bigint NOT NULL,
    producto_id bigint NOT NULL,
    lote character varying(100),
    cantidad numeric(12,4) NOT NULL,
    precio_unitario numeric(18,4),
    id_movimiento integer,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE salud.dispensaciones_detalle OWNER TO aitrolsystem;

--
-- Name: dispensaciones_detalle_id_seq; Type: SEQUENCE; Schema: salud; Owner: aitrolsystem
--

CREATE SEQUENCE salud.dispensaciones_detalle_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE salud.dispensaciones_detalle_id_seq OWNER TO aitrolsystem;

--
-- Name: dispensaciones_detalle_id_seq; Type: SEQUENCE OWNED BY; Schema: salud; Owner: aitrolsystem
--

ALTER SEQUENCE salud.dispensaciones_detalle_id_seq OWNED BY salud.dispensaciones_detalle.id;


--
-- Name: dispensaciones_id_seq; Type: SEQUENCE; Schema: salud; Owner: aitrolsystem
--

CREATE SEQUENCE salud.dispensaciones_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE salud.dispensaciones_id_seq OWNER TO aitrolsystem;

--
-- Name: dispensaciones_id_seq; Type: SEQUENCE OWNED BY; Schema: salud; Owner: aitrolsystem
--

ALTER SEQUENCE salud.dispensaciones_id_seq OWNED BY salud.dispensaciones.id;


--
-- Name: emergencias; Type: TABLE; Schema: salud; Owner: aitrolsystem
--

CREATE TABLE salud.emergencias (
    id bigint NOT NULL,
    encuentro_id bigint,
    paciente_id bigint NOT NULL,
    triage_id bigint,
    hora_ingreso timestamp with time zone DEFAULT now(),
    area_ingreso character varying(100),
    responsable bigint,
    diagnostico_ingreso text,
    procedencia text,
    destino character varying(100),
    alta_hora timestamp with time zone,
    observaciones text
);


ALTER TABLE salud.emergencias OWNER TO aitrolsystem;

--
-- Name: emergencias_id_seq; Type: SEQUENCE; Schema: salud; Owner: aitrolsystem
--

CREATE SEQUENCE salud.emergencias_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE salud.emergencias_id_seq OWNER TO aitrolsystem;

--
-- Name: emergencias_id_seq; Type: SEQUENCE OWNED BY; Schema: salud; Owner: aitrolsystem
--

ALTER SEQUENCE salud.emergencias_id_seq OWNED BY salud.emergencias.id;


--
-- Name: encuentros; Type: TABLE; Schema: salud; Owner: aitrolsystem
--

CREATE TABLE salud.encuentros (
    id bigint NOT NULL,
    paciente_id bigint NOT NULL,
    personal_id bigint NOT NULL,
    tipo_encuentro character varying(50) NOT NULL,
    fecha_hora timestamp with time zone DEFAULT now(),
    motivo_consulta text,
    resumen text,
    diagnostico_principal text,
    diagnosticos_secundarios text,
    plan_tratamiento text,
    evolucion jsonb,
    referencias jsonb,
    creado_por bigint,
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone
);


ALTER TABLE salud.encuentros OWNER TO aitrolsystem;

--
-- Name: encuentros_id_seq; Type: SEQUENCE; Schema: salud; Owner: aitrolsystem
--

CREATE SEQUENCE salud.encuentros_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE salud.encuentros_id_seq OWNER TO aitrolsystem;

--
-- Name: encuentros_id_seq; Type: SEQUENCE OWNED BY; Schema: salud; Owner: aitrolsystem
--

ALTER SEQUENCE salud.encuentros_id_seq OWNED BY salud.encuentros.id;


--
-- Name: epicrisis; Type: TABLE; Schema: salud; Owner: aitrolsystem
--

CREATE TABLE salud.epicrisis (
    id bigint NOT NULL,
    historia_id bigint NOT NULL,
    fecha_egreso date,
    motivo_egreso text,
    resumen_clinico text,
    diagnostico_final text,
    tratamiento_final text,
    recomendaciones text,
    firmado_por bigint,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE salud.epicrisis OWNER TO aitrolsystem;

--
-- Name: epicrisis_id_seq; Type: SEQUENCE; Schema: salud; Owner: aitrolsystem
--

CREATE SEQUENCE salud.epicrisis_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE salud.epicrisis_id_seq OWNER TO aitrolsystem;

--
-- Name: epicrisis_id_seq; Type: SEQUENCE OWNED BY; Schema: salud; Owner: aitrolsystem
--

ALTER SEQUENCE salud.epicrisis_id_seq OWNED BY salud.epicrisis.id;


--
-- Name: evoluciones; Type: TABLE; Schema: salud; Owner: aitrolsystem
--

CREATE TABLE salud.evoluciones (
    id bigint NOT NULL,
    historia_id bigint NOT NULL,
    fecha_hora timestamp with time zone DEFAULT now(),
    descripcion text NOT NULL,
    personal_id bigint,
    tipo character varying(20),
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT evoluciones_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['EVOLUCION'::character varying, 'INTERCONSULTA'::character varying, 'EPICRISIS'::character varying])::text[])))
);


ALTER TABLE salud.evoluciones OWNER TO aitrolsystem;

--
-- Name: evoluciones_id_seq; Type: SEQUENCE; Schema: salud; Owner: aitrolsystem
--

CREATE SEQUENCE salud.evoluciones_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE salud.evoluciones_id_seq OWNER TO aitrolsystem;

--
-- Name: evoluciones_id_seq; Type: SEQUENCE OWNED BY; Schema: salud; Owner: aitrolsystem
--

ALTER SEQUENCE salud.evoluciones_id_seq OWNED BY salud.evoluciones.id;


--
-- Name: examen_fisico; Type: TABLE; Schema: salud; Owner: aitrolsystem
--

CREATE TABLE salud.examen_fisico (
    id bigint NOT NULL,
    consulta_id bigint NOT NULL,
    cabeza_cuello text,
    torax text,
    abdomen text,
    extremidades text,
    neurologico text,
    genital_urinario text,
    otros_hallazgos text,
    impresion_general text,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE salud.examen_fisico OWNER TO aitrolsystem;

--
-- Name: examen_fisico_id_seq; Type: SEQUENCE; Schema: salud; Owner: aitrolsystem
--

CREATE SEQUENCE salud.examen_fisico_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE salud.examen_fisico_id_seq OWNER TO aitrolsystem;

--
-- Name: examen_fisico_id_seq; Type: SEQUENCE OWNED BY; Schema: salud; Owner: aitrolsystem
--

ALTER SEQUENCE salud.examen_fisico_id_seq OWNED BY salud.examen_fisico.id;


--
-- Name: examenes; Type: TABLE; Schema: salud; Owner: aitrolsystem
--

CREATE TABLE salud.examenes (
    id bigint NOT NULL,
    nombre character varying(200) NOT NULL,
    codigo character varying(50),
    categoria text,
    metodo text,
    unidad_medida character varying(50),
    valor_referencia jsonb,
    duracion_estimado_min integer,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE salud.examenes OWNER TO aitrolsystem;

--
-- Name: examenes_id_seq; Type: SEQUENCE; Schema: salud; Owner: aitrolsystem
--

CREATE SEQUENCE salud.examenes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE salud.examenes_id_seq OWNER TO aitrolsystem;

--
-- Name: examenes_id_seq; Type: SEQUENCE OWNED BY; Schema: salud; Owner: aitrolsystem
--

ALTER SEQUENCE salud.examenes_id_seq OWNED BY salud.examenes.id;


--
-- Name: facturas_clinicas; Type: TABLE; Schema: salud; Owner: aitrolsystem
--

CREATE TABLE salud.facturas_clinicas (
    id bigint NOT NULL,
    paciente_id bigint,
    ingreso_id bigint,
    fecha_factura timestamp with time zone DEFAULT now(),
    subtotal numeric(18,2),
    iva numeric(18,2),
    total numeric(18,2),
    estado character varying(30) DEFAULT 'PENDIENTE'::character varying,
    id_venta_inventario integer,
    sis_sucursal_id bigint,
    observaciones text,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE salud.facturas_clinicas OWNER TO aitrolsystem;

--
-- Name: facturas_clinicas_detalle; Type: TABLE; Schema: salud; Owner: aitrolsystem
--

CREATE TABLE salud.facturas_clinicas_detalle (
    id bigint NOT NULL,
    factura_id bigint NOT NULL,
    descripcion text,
    codigo_producto bigint,
    cantidad numeric(12,4),
    precio_unitario numeric(18,4),
    total numeric(18,4)
);


ALTER TABLE salud.facturas_clinicas_detalle OWNER TO aitrolsystem;

--
-- Name: facturas_clinicas_detalle_id_seq; Type: SEQUENCE; Schema: salud; Owner: aitrolsystem
--

CREATE SEQUENCE salud.facturas_clinicas_detalle_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE salud.facturas_clinicas_detalle_id_seq OWNER TO aitrolsystem;

--
-- Name: facturas_clinicas_detalle_id_seq; Type: SEQUENCE OWNED BY; Schema: salud; Owner: aitrolsystem
--

ALTER SEQUENCE salud.facturas_clinicas_detalle_id_seq OWNED BY salud.facturas_clinicas_detalle.id;


--
-- Name: facturas_clinicas_id_seq; Type: SEQUENCE; Schema: salud; Owner: aitrolsystem
--

CREATE SEQUENCE salud.facturas_clinicas_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE salud.facturas_clinicas_id_seq OWNER TO aitrolsystem;

--
-- Name: facturas_clinicas_id_seq; Type: SEQUENCE OWNED BY; Schema: salud; Owner: aitrolsystem
--

ALTER SEQUENCE salud.facturas_clinicas_id_seq OWNED BY salud.facturas_clinicas.id;


--
-- Name: historia_antecedentes; Type: TABLE; Schema: salud; Owner: aitrolsystem
--

CREATE TABLE salud.historia_antecedentes (
    id bigint NOT NULL,
    historia_id bigint NOT NULL,
    antecedentes_personales text,
    antecedentes_familiares text,
    alergias text,
    habitos_toxicos text,
    medicamentos_habituales text,
    cirugias_previas text,
    enfermedades_cronicas text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE salud.historia_antecedentes OWNER TO aitrolsystem;

--
-- Name: historia_antecedentes_id_seq; Type: SEQUENCE; Schema: salud; Owner: aitrolsystem
--

CREATE SEQUENCE salud.historia_antecedentes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE salud.historia_antecedentes_id_seq OWNER TO aitrolsystem;

--
-- Name: historia_antecedentes_id_seq; Type: SEQUENCE OWNED BY; Schema: salud; Owner: aitrolsystem
--

ALTER SEQUENCE salud.historia_antecedentes_id_seq OWNED BY salud.historia_antecedentes.id;


--
-- Name: historia_auditoria; Type: TABLE; Schema: salud; Owner: aitrolsystem
--

CREATE TABLE salud.historia_auditoria (
    id bigint NOT NULL,
    historia_id bigint,
    usuario_id bigint,
    accion character varying(20),
    tabla_afectada text,
    registro_id bigint,
    fecha_hora timestamp with time zone DEFAULT now(),
    ip_origen inet,
    descripcion text,
    CONSTRAINT historia_auditoria_accion_check CHECK (((accion)::text = ANY ((ARRAY['CREAR'::character varying, 'EDITAR'::character varying, 'ELIMINAR'::character varying, 'CONSULTAR'::character varying, 'IMPRIMIR'::character varying])::text[])))
);


ALTER TABLE salud.historia_auditoria OWNER TO aitrolsystem;

--
-- Name: historia_auditoria_id_seq; Type: SEQUENCE; Schema: salud; Owner: aitrolsystem
--

CREATE SEQUENCE salud.historia_auditoria_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE salud.historia_auditoria_id_seq OWNER TO aitrolsystem;

--
-- Name: historia_auditoria_id_seq; Type: SEQUENCE OWNED BY; Schema: salud; Owner: aitrolsystem
--

ALTER SEQUENCE salud.historia_auditoria_id_seq OWNED BY salud.historia_auditoria.id;


--
-- Name: historia_clinica; Type: TABLE; Schema: salud; Owner: aitrolsystem
--

CREATE TABLE salud.historia_clinica (
    id bigint NOT NULL,
    paciente_id bigint NOT NULL,
    numero_historia character varying(50),
    fecha_apertura date DEFAULT CURRENT_DATE,
    tipo_historia character varying(30),
    estado character varying(20) DEFAULT 'ACTIVA'::character varying,
    responsable_id bigint,
    creado_por bigint,
    observaciones text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT historia_clinica_estado_check CHECK (((estado)::text = ANY ((ARRAY['ACTIVA'::character varying, 'CERRADA'::character varying, 'ARCHIVADA'::character varying])::text[]))),
    CONSTRAINT historia_clinica_tipo_historia_check CHECK (((tipo_historia)::text = ANY ((ARRAY['AMBULATORIA'::character varying, 'HOSPITALARIA'::character varying, 'EMERGENCIA'::character varying, 'ODONTOLOGICA'::character varying, 'LABORATORIO'::character varying, 'IMAGEN'::character varying])::text[])))
);


ALTER TABLE salud.historia_clinica OWNER TO aitrolsystem;

--
-- Name: historia_clinica_id_seq; Type: SEQUENCE; Schema: salud; Owner: aitrolsystem
--

CREATE SEQUENCE salud.historia_clinica_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE salud.historia_clinica_id_seq OWNER TO aitrolsystem;

--
-- Name: historia_clinica_id_seq; Type: SEQUENCE OWNED BY; Schema: salud; Owner: aitrolsystem
--

ALTER SEQUENCE salud.historia_clinica_id_seq OWNED BY salud.historia_clinica.id;


--
-- Name: ingresos; Type: TABLE; Schema: salud; Owner: aitrolsystem
--

CREATE TABLE salud.ingresos (
    id bigint NOT NULL,
    paciente_id bigint NOT NULL,
    fecha_ingreso timestamp with time zone DEFAULT now() NOT NULL,
    fecha_alta timestamp with time zone,
    motivo_ingreso text,
    unidad_ingreso_id bigint,
    sala_ingreso_id bigint,
    cama_id bigint,
    estado character varying(30) DEFAULT 'ACTIVO'::character varying,
    medico_tratante bigint,
    plan_tratamiento text,
    creador bigint,
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE salud.ingresos OWNER TO aitrolsystem;

--
-- Name: ingresos_id_seq; Type: SEQUENCE; Schema: salud; Owner: aitrolsystem
--

CREATE SEQUENCE salud.ingresos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE salud.ingresos_id_seq OWNER TO aitrolsystem;

--
-- Name: ingresos_id_seq; Type: SEQUENCE OWNED BY; Schema: salud; Owner: aitrolsystem
--

ALTER SEQUENCE salud.ingresos_id_seq OWNED BY salud.ingresos.id;


--
-- Name: interconsultas; Type: TABLE; Schema: salud; Owner: aitrolsystem
--

CREATE TABLE salud.interconsultas (
    id bigint NOT NULL,
    historia_id bigint NOT NULL,
    fecha_solicitud timestamp with time zone DEFAULT now(),
    especialidad_destino text,
    motivo text,
    respuesta text,
    estado character varying(20) DEFAULT 'SOLICITADA'::character varying,
    creado_por bigint,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT interconsultas_estado_check CHECK (((estado)::text = ANY ((ARRAY['SOLICITADA'::character varying, 'CONTESTADA'::character varying, 'CANCELADA'::character varying])::text[])))
);


ALTER TABLE salud.interconsultas OWNER TO aitrolsystem;

--
-- Name: interconsultas_id_seq; Type: SEQUENCE; Schema: salud; Owner: aitrolsystem
--

CREATE SEQUENCE salud.interconsultas_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE salud.interconsultas_id_seq OWNER TO aitrolsystem;

--
-- Name: interconsultas_id_seq; Type: SEQUENCE OWNED BY; Schema: salud; Owner: aitrolsystem
--

ALTER SEQUENCE salud.interconsultas_id_seq OWNED BY salud.interconsultas.id;


--
-- Name: mar; Type: TABLE; Schema: salud; Owner: aitrolsystem
--

CREATE TABLE salud.mar (
    id bigint NOT NULL,
    ingreso_id bigint,
    paciente_id bigint NOT NULL,
    fecha_registro timestamp with time zone DEFAULT now(),
    medicamento_id bigint,
    producto_id bigint,
    dosis text,
    via text,
    administrado_por bigint,
    observaciones text,
    evento character varying(100)
);


ALTER TABLE salud.mar OWNER TO aitrolsystem;

--
-- Name: mar_id_seq; Type: SEQUENCE; Schema: salud; Owner: aitrolsystem
--

CREATE SEQUENCE salud.mar_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE salud.mar_id_seq OWNER TO aitrolsystem;

--
-- Name: mar_id_seq; Type: SEQUENCE OWNED BY; Schema: salud; Owner: aitrolsystem
--

ALTER SEQUENCE salud.mar_id_seq OWNED BY salud.mar.id;


--
-- Name: medicamentos; Type: TABLE; Schema: salud; Owner: aitrolsystem
--

CREATE TABLE salud.medicamentos (
    id bigint NOT NULL,
    producto_id bigint NOT NULL,
    principio_activo text,
    concentracion text,
    presentacion text,
    via_administracion text,
    requiere_receta boolean DEFAULT false,
    controlado boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE salud.medicamentos OWNER TO aitrolsystem;

--
-- Name: medicamentos_id_seq; Type: SEQUENCE; Schema: salud; Owner: aitrolsystem
--

CREATE SEQUENCE salud.medicamentos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE salud.medicamentos_id_seq OWNER TO aitrolsystem;

--
-- Name: medicamentos_id_seq; Type: SEQUENCE OWNED BY; Schema: salud; Owner: aitrolsystem
--

ALTER SEQUENCE salud.medicamentos_id_seq OWNED BY salud.medicamentos.id;


--
-- Name: muestras; Type: TABLE; Schema: salud; Owner: aitrolsystem
--

CREATE TABLE salud.muestras (
    id bigint NOT NULL,
    orden_id bigint NOT NULL,
    examen_id bigint,
    codigo_barra character varying(100),
    fecha_recoleccion timestamp with time zone,
    recoleccion_por bigint,
    tipo_muestra character varying(100),
    estado character varying(30) DEFAULT 'RECOLECTADA'::character varying,
    ubicacion_actual text,
    temperatura_transporte text,
    observaciones text,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE salud.muestras OWNER TO aitrolsystem;

--
-- Name: muestras_id_seq; Type: SEQUENCE; Schema: salud; Owner: aitrolsystem
--

CREATE SEQUENCE salud.muestras_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE salud.muestras_id_seq OWNER TO aitrolsystem;

--
-- Name: muestras_id_seq; Type: SEQUENCE OWNED BY; Schema: salud; Owner: aitrolsystem
--

ALTER SEQUENCE salud.muestras_id_seq OWNED BY salud.muestras.id;


--
-- Name: ordenes_imagenologia; Type: TABLE; Schema: salud; Owner: aitrolsystem
--

CREATE TABLE salud.ordenes_imagenologia (
    id bigint NOT NULL,
    paciente_id bigint NOT NULL,
    pedido_por bigint,
    estudio character varying(100),
    prioridad character varying(20) DEFAULT 'NORMAL'::character varying,
    fecha_pedido timestamp with time zone DEFAULT now(),
    estado character varying(30) DEFAULT 'PENDIENTE'::character varying,
    observaciones text,
    sis_sucursal_id bigint
);


ALTER TABLE salud.ordenes_imagenologia OWNER TO aitrolsystem;

--
-- Name: ordenes_imagenologia_id_seq; Type: SEQUENCE; Schema: salud; Owner: aitrolsystem
--

CREATE SEQUENCE salud.ordenes_imagenologia_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE salud.ordenes_imagenologia_id_seq OWNER TO aitrolsystem;

--
-- Name: ordenes_imagenologia_id_seq; Type: SEQUENCE OWNED BY; Schema: salud; Owner: aitrolsystem
--

ALTER SEQUENCE salud.ordenes_imagenologia_id_seq OWNED BY salud.ordenes_imagenologia.id;


--
-- Name: ordenes_laboratorio; Type: TABLE; Schema: salud; Owner: aitrolsystem
--

CREATE TABLE salud.ordenes_laboratorio (
    id bigint NOT NULL,
    paciente_id bigint NOT NULL,
    pedido_por bigint,
    fecha_pedido timestamp with time zone DEFAULT now(),
    tipo_solicitud character varying(50),
    estado character varying(30) DEFAULT 'PENDIENTE'::character varying,
    prioridad character varying(20) DEFAULT 'NORMAL'::character varying,
    observaciones text,
    orden_padre bigint,
    sis_sucursal_id bigint,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE salud.ordenes_laboratorio OWNER TO aitrolsystem;

--
-- Name: ordenes_laboratorio_id_seq; Type: SEQUENCE; Schema: salud; Owner: aitrolsystem
--

CREATE SEQUENCE salud.ordenes_laboratorio_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE salud.ordenes_laboratorio_id_seq OWNER TO aitrolsystem;

--
-- Name: ordenes_laboratorio_id_seq; Type: SEQUENCE OWNED BY; Schema: salud; Owner: aitrolsystem
--

ALTER SEQUENCE salud.ordenes_laboratorio_id_seq OWNED BY salud.ordenes_laboratorio.id;


--
-- Name: pacientes; Type: TABLE; Schema: salud; Owner: aitrolsystem
--

CREATE TABLE salud.pacientes (
    id bigint NOT NULL,
    persona_id bigint NOT NULL,
    codigo_paciente character varying(50),
    tipo_sangre character varying(5),
    alergias jsonb,
    antecedentes jsonb,
    nombre_contacto_legal text,
    telefono_contacto_legal character varying(50),
    cliente_id integer,
    sis_sucursal_id bigint,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone
);


ALTER TABLE salud.pacientes OWNER TO aitrolsystem;

--
-- Name: pacientes_id_seq; Type: SEQUENCE; Schema: salud; Owner: aitrolsystem
--

CREATE SEQUENCE salud.pacientes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE salud.pacientes_id_seq OWNER TO aitrolsystem;

--
-- Name: pacientes_id_seq; Type: SEQUENCE OWNED BY; Schema: salud; Owner: aitrolsystem
--

ALTER SEQUENCE salud.pacientes_id_seq OWNED BY salud.pacientes.id;


--
-- Name: personal; Type: TABLE; Schema: salud; Owner: aitrolsystem
--

CREATE TABLE salud.personal (
    id bigint NOT NULL,
    persona_id bigint NOT NULL,
    codigo_personal character varying(50),
    sis_sucursal_id bigint,
    tipo_personal character varying(40),
    especialidad text,
    registro_senescyt character varying(80),
    registro_msp character varying(80),
    licencia_activa boolean DEFAULT true,
    disponibilidad jsonb,
    correo_institucional character varying(200),
    telefono_institucional character varying(50),
    usuario_id bigint,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT personal_tipo_personal_check CHECK (((tipo_personal)::text = ANY ((ARRAY['MEDICO'::character varying, 'ENFERMERA'::character varying, 'TECNICO'::character varying, 'LABORATORISTA'::character varying, 'RADIOLOGO'::character varying, 'ANESTESIOLOGO'::character varying, 'FARMACEUTICO'::character varying, 'ADMINISTRATIVO'::character varying, 'OTRO'::character varying])::text[])))
);


ALTER TABLE salud.personal OWNER TO aitrolsystem;

--
-- Name: personal_id_seq; Type: SEQUENCE; Schema: salud; Owner: aitrolsystem
--

CREATE SEQUENCE salud.personal_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE salud.personal_id_seq OWNER TO aitrolsystem;

--
-- Name: personal_id_seq; Type: SEQUENCE OWNED BY; Schema: salud; Owner: aitrolsystem
--

ALTER SEQUENCE salud.personal_id_seq OWNED BY salud.personal.id;


--
-- Name: personas; Type: TABLE; Schema: salud; Owner: aitrolsystem
--

CREATE TABLE salud.personas (
    id bigint NOT NULL,
    uuid uuid DEFAULT gen_random_uuid(),
    tipo_identificacion character varying(20) NOT NULL,
    identificacion character varying(50) NOT NULL,
    primer_nombre character varying(100),
    segundo_nombre character varying(100),
    primer_apellido character varying(100),
    segundo_apellido character varying(100),
    nombres text GENERATED ALWAYS AS ((((COALESCE(primer_nombre, ''::character varying))::text || ' '::text) || (COALESCE(segundo_nombre, ''::character varying))::text)) STORED,
    apellidos text GENERATED ALWAYS AS ((((COALESCE(primer_apellido, ''::character varying))::text || ' '::text) || (COALESCE(segundo_apellido, ''::character varying))::text)) STORED,
    nombre_completo text GENERATED ALWAYS AS (TRIM(BOTH FROM (((((((COALESCE(primer_nombre, ''::character varying))::text || ' '::text) || (COALESCE(segundo_nombre, ''::character varying))::text) || ' '::text) || (COALESCE(primer_apellido, ''::character varying))::text) || ' '::text) || (COALESCE(segundo_apellido, ''::character varying))::text))) STORED,
    fecha_nacimiento date,
    sexo character(1),
    lugar_nacimiento text,
    nacionalidad text,
    estado_civil character varying(20),
    direccion text,
    telefono_local character varying(50),
    telefono_movil character varying(50),
    email character varying(200),
    foto_url text,
    discapacidad boolean DEFAULT false,
    grupo_etnico text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT personas_sexo_check CHECK ((sexo = ANY (ARRAY['M'::bpchar, 'F'::bpchar, 'O'::bpchar]))),
    CONSTRAINT personas_tipo_identificacion_check CHECK (((tipo_identificacion)::text = ANY ((ARRAY['CEDULA'::character varying, 'PASAPORTE'::character varying, 'RUC'::character varying, 'OTRO'::character varying])::text[])))
);


ALTER TABLE salud.personas OWNER TO aitrolsystem;

--
-- Name: personas_id_seq; Type: SEQUENCE; Schema: salud; Owner: aitrolsystem
--

CREATE SEQUENCE salud.personas_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE salud.personas_id_seq OWNER TO aitrolsystem;

--
-- Name: personas_id_seq; Type: SEQUENCE OWNED BY; Schema: salud; Owner: aitrolsystem
--

ALTER SEQUENCE salud.personas_id_seq OWNED BY salud.personas.id;


--
-- Name: pisos; Type: TABLE; Schema: salud; Owner: aitrolsystem
--

CREATE TABLE salud.pisos (
    id bigint NOT NULL,
    sede_id bigint,
    nombre character varying(100) NOT NULL,
    orden smallint DEFAULT 0
);


ALTER TABLE salud.pisos OWNER TO aitrolsystem;

--
-- Name: pisos_id_seq; Type: SEQUENCE; Schema: salud; Owner: aitrolsystem
--

CREATE SEQUENCE salud.pisos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE salud.pisos_id_seq OWNER TO aitrolsystem;

--
-- Name: pisos_id_seq; Type: SEQUENCE OWNED BY; Schema: salud; Owner: aitrolsystem
--

ALTER SEQUENCE salud.pisos_id_seq OWNED BY salud.pisos.id;


--
-- Name: procedimientos; Type: TABLE; Schema: salud; Owner: aitrolsystem
--

CREATE TABLE salud.procedimientos (
    id bigint NOT NULL,
    nombre character varying(200) NOT NULL,
    codigo character varying(50),
    descripcion text,
    duracion_min integer,
    complejidad character varying(20)
);


ALTER TABLE salud.procedimientos OWNER TO aitrolsystem;

--
-- Name: procedimientos_id_seq; Type: SEQUENCE; Schema: salud; Owner: aitrolsystem
--

CREATE SEQUENCE salud.procedimientos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE salud.procedimientos_id_seq OWNER TO aitrolsystem;

--
-- Name: procedimientos_id_seq; Type: SEQUENCE OWNED BY; Schema: salud; Owner: aitrolsystem
--

ALTER SEQUENCE salud.procedimientos_id_seq OWNED BY salud.procedimientos.id;


--
-- Name: procedimientos_insumos; Type: TABLE; Schema: salud; Owner: aitrolsystem
--

CREATE TABLE salud.procedimientos_insumos (
    id bigint NOT NULL,
    procedimiento_realizado_id bigint NOT NULL,
    producto_id bigint NOT NULL,
    lote character varying(100),
    cantidad numeric(12,4) NOT NULL,
    unidad_medida character varying(50),
    creado_por bigint,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE salud.procedimientos_insumos OWNER TO aitrolsystem;

--
-- Name: procedimientos_insumos_id_seq; Type: SEQUENCE; Schema: salud; Owner: aitrolsystem
--

CREATE SEQUENCE salud.procedimientos_insumos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE salud.procedimientos_insumos_id_seq OWNER TO aitrolsystem;

--
-- Name: procedimientos_insumos_id_seq; Type: SEQUENCE OWNED BY; Schema: salud; Owner: aitrolsystem
--

ALTER SEQUENCE salud.procedimientos_insumos_id_seq OWNED BY salud.procedimientos_insumos.id;


--
-- Name: procedimientos_realizados; Type: TABLE; Schema: salud; Owner: aitrolsystem
--

CREATE TABLE salud.procedimientos_realizados (
    id bigint NOT NULL,
    ingreso_id bigint,
    paciente_id bigint NOT NULL,
    personal_id bigint NOT NULL,
    procedimiento_id bigint NOT NULL,
    fecha_hora timestamp with time zone DEFAULT now(),
    duracion_min integer,
    anestesia_utilizada boolean DEFAULT false,
    sala_id bigint,
    quirofano_id bigint,
    estado character varying(30) DEFAULT 'COMPLETADO'::character varying,
    observaciones text,
    costo numeric(18,2),
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE salud.procedimientos_realizados OWNER TO aitrolsystem;

--
-- Name: procedimientos_realizados_id_seq; Type: SEQUENCE; Schema: salud; Owner: aitrolsystem
--

CREATE SEQUENCE salud.procedimientos_realizados_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE salud.procedimientos_realizados_id_seq OWNER TO aitrolsystem;

--
-- Name: procedimientos_realizados_id_seq; Type: SEQUENCE OWNED BY; Schema: salud; Owner: aitrolsystem
--

ALTER SEQUENCE salud.procedimientos_realizados_id_seq OWNED BY salud.procedimientos_realizados.id;


--
-- Name: programacion_quirofano; Type: TABLE; Schema: salud; Owner: aitrolsystem
--

CREATE TABLE salud.programacion_quirofano (
    id bigint NOT NULL,
    procedimiento_realizado_id bigint,
    paciente_id bigint NOT NULL,
    medico_responsable bigint,
    anestesista_id bigint,
    quirofano_id bigint,
    fecha_inicio timestamp with time zone,
    fecha_fin timestamp with time zone,
    tipo_anestesia character varying(50),
    tiempo_estimado_min integer,
    estado character varying(50) DEFAULT 'PROGRAMADO'::character varying,
    observaciones text
);


ALTER TABLE salud.programacion_quirofano OWNER TO aitrolsystem;

--
-- Name: programacion_quirofano_id_seq; Type: SEQUENCE; Schema: salud; Owner: aitrolsystem
--

CREATE SEQUENCE salud.programacion_quirofano_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE salud.programacion_quirofano_id_seq OWNER TO aitrolsystem;

--
-- Name: programacion_quirofano_id_seq; Type: SEQUENCE OWNED BY; Schema: salud; Owner: aitrolsystem
--

ALTER SEQUENCE salud.programacion_quirofano_id_seq OWNED BY salud.programacion_quirofano.id;


--
-- Name: quirofanos; Type: TABLE; Schema: salud; Owner: aitrolsystem
--

CREATE TABLE salud.quirofanos (
    id bigint NOT NULL,
    unidad_id bigint,
    nombre character varying(200),
    codigo character varying(50),
    estado character varying(30) DEFAULT 'ACTIVO'::character varying
);


ALTER TABLE salud.quirofanos OWNER TO aitrolsystem;

--
-- Name: quirofanos_id_seq; Type: SEQUENCE; Schema: salud; Owner: aitrolsystem
--

CREATE SEQUENCE salud.quirofanos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE salud.quirofanos_id_seq OWNER TO aitrolsystem;

--
-- Name: quirofanos_id_seq; Type: SEQUENCE OWNED BY; Schema: salud; Owner: aitrolsystem
--

ALTER SEQUENCE salud.quirofanos_id_seq OWNED BY salud.quirofanos.id;


--
-- Name: recetas; Type: TABLE; Schema: salud; Owner: aitrolsystem
--

CREATE TABLE salud.recetas (
    id bigint NOT NULL,
    paciente_id bigint NOT NULL,
    prescriptor_id bigint NOT NULL,
    fecha_prescripcion timestamp with time zone DEFAULT now(),
    diagnostico_prescripcion text,
    motivo text,
    autorizacion_seguro jsonb,
    estado character varying(30) DEFAULT 'ACTIVA'::character varying,
    sis_sucursal_id bigint,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE salud.recetas OWNER TO aitrolsystem;

--
-- Name: recetas_detalle; Type: TABLE; Schema: salud; Owner: aitrolsystem
--

CREATE TABLE salud.recetas_detalle (
    id bigint NOT NULL,
    receta_id bigint NOT NULL,
    producto_id bigint NOT NULL,
    medicamento_id bigint,
    dosis text,
    via text,
    frecuencia text,
    duracion text,
    cantidad numeric(12,4),
    indicaciones text,
    creado_por bigint,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE salud.recetas_detalle OWNER TO aitrolsystem;

--
-- Name: recetas_detalle_id_seq; Type: SEQUENCE; Schema: salud; Owner: aitrolsystem
--

CREATE SEQUENCE salud.recetas_detalle_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE salud.recetas_detalle_id_seq OWNER TO aitrolsystem;

--
-- Name: recetas_detalle_id_seq; Type: SEQUENCE OWNED BY; Schema: salud; Owner: aitrolsystem
--

ALTER SEQUENCE salud.recetas_detalle_id_seq OWNED BY salud.recetas_detalle.id;


--
-- Name: recetas_id_seq; Type: SEQUENCE; Schema: salud; Owner: aitrolsystem
--

CREATE SEQUENCE salud.recetas_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE salud.recetas_id_seq OWNER TO aitrolsystem;

--
-- Name: recetas_id_seq; Type: SEQUENCE OWNED BY; Schema: salud; Owner: aitrolsystem
--

ALTER SEQUENCE salud.recetas_id_seq OWNED BY salud.recetas.id;


--
-- Name: resultados_imagenologia; Type: TABLE; Schema: salud; Owner: aitrolsystem
--

CREATE TABLE salud.resultados_imagenologia (
    id bigint NOT NULL,
    orden_id bigint,
    tecnico_responsable bigint,
    informe text,
    url_imagenes text[],
    fecha_resultado timestamp with time zone DEFAULT now()
);


ALTER TABLE salud.resultados_imagenologia OWNER TO aitrolsystem;

--
-- Name: resultados_imagenologia_id_seq; Type: SEQUENCE; Schema: salud; Owner: aitrolsystem
--

CREATE SEQUENCE salud.resultados_imagenologia_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE salud.resultados_imagenologia_id_seq OWNER TO aitrolsystem;

--
-- Name: resultados_imagenologia_id_seq; Type: SEQUENCE OWNED BY; Schema: salud; Owner: aitrolsystem
--

ALTER SEQUENCE salud.resultados_imagenologia_id_seq OWNED BY salud.resultados_imagenologia.id;


--
-- Name: resultados_laboratorio; Type: TABLE; Schema: salud; Owner: aitrolsystem
--

CREATE TABLE salud.resultados_laboratorio (
    id bigint NOT NULL,
    muestra_id bigint,
    orden_id bigint,
    examen_id bigint,
    valor text,
    unidad text,
    interpretacion text,
    referencia_valores jsonb,
    laboratorio_responsable text,
    fecha_resultado timestamp with time zone DEFAULT now(),
    archivo_resultado text,
    creado_por bigint,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE salud.resultados_laboratorio OWNER TO aitrolsystem;

--
-- Name: resultados_laboratorio_id_seq; Type: SEQUENCE; Schema: salud; Owner: aitrolsystem
--

CREATE SEQUENCE salud.resultados_laboratorio_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE salud.resultados_laboratorio_id_seq OWNER TO aitrolsystem;

--
-- Name: resultados_laboratorio_id_seq; Type: SEQUENCE OWNED BY; Schema: salud; Owner: aitrolsystem
--

ALTER SEQUENCE salud.resultados_laboratorio_id_seq OWNED BY salud.resultados_laboratorio.id;


--
-- Name: salas; Type: TABLE; Schema: salud; Owner: aitrolsystem
--

CREATE TABLE salud.salas (
    id bigint NOT NULL,
    unidad_id bigint,
    nombre character varying(200) NOT NULL,
    tipo character varying(50),
    capacidad integer DEFAULT 1
);


ALTER TABLE salud.salas OWNER TO aitrolsystem;

--
-- Name: salas_id_seq; Type: SEQUENCE; Schema: salud; Owner: aitrolsystem
--

CREATE SEQUENCE salud.salas_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE salud.salas_id_seq OWNER TO aitrolsystem;

--
-- Name: salas_id_seq; Type: SEQUENCE OWNED BY; Schema: salud; Owner: aitrolsystem
--

ALTER SEQUENCE salud.salas_id_seq OWNED BY salud.salas.id;


--
-- Name: sedes; Type: TABLE; Schema: salud; Owner: aitrolsystem
--

CREATE TABLE salud.sedes (
    id bigint NOT NULL,
    nombre character varying(200) NOT NULL,
    descripcion text,
    direccion text,
    telefono character varying(50),
    sis_sucursal_id bigint,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE salud.sedes OWNER TO aitrolsystem;

--
-- Name: sedes_id_seq; Type: SEQUENCE; Schema: salud; Owner: aitrolsystem
--

CREATE SEQUENCE salud.sedes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE salud.sedes_id_seq OWNER TO aitrolsystem;

--
-- Name: sedes_id_seq; Type: SEQUENCE OWNED BY; Schema: salud; Owner: aitrolsystem
--

ALTER SEQUENCE salud.sedes_id_seq OWNED BY salud.sedes.id;


--
-- Name: signos_vitales; Type: TABLE; Schema: salud; Owner: aitrolsystem
--

CREATE TABLE salud.signos_vitales (
    id bigint NOT NULL,
    paciente_id bigint NOT NULL,
    encuentro_id bigint,
    personal_id bigint,
    fecha_hora timestamp with time zone DEFAULT now(),
    nombre character varying(50) NOT NULL,
    valor text NOT NULL,
    unidad text
);


ALTER TABLE salud.signos_vitales OWNER TO aitrolsystem;

--
-- Name: signos_vitales_id_seq; Type: SEQUENCE; Schema: salud; Owner: aitrolsystem
--

CREATE SEQUENCE salud.signos_vitales_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE salud.signos_vitales_id_seq OWNER TO aitrolsystem;

--
-- Name: signos_vitales_id_seq; Type: SEQUENCE OWNED BY; Schema: salud; Owner: aitrolsystem
--

ALTER SEQUENCE salud.signos_vitales_id_seq OWNED BY salud.signos_vitales.id;


--
-- Name: transferencias_internas; Type: TABLE; Schema: salud; Owner: aitrolsystem
--

CREATE TABLE salud.transferencias_internas (
    id bigint NOT NULL,
    ingreso_id bigint NOT NULL,
    desde_unidad_id bigint,
    hasta_unidad_id bigint,
    desde_sala_id bigint,
    hasta_sala_id bigint,
    desde_cama_id bigint,
    hasta_cama_id bigint,
    fecha_transferencia timestamp with time zone DEFAULT now(),
    motivo text,
    responsable bigint
);


ALTER TABLE salud.transferencias_internas OWNER TO aitrolsystem;

--
-- Name: transferencias_internas_id_seq; Type: SEQUENCE; Schema: salud; Owner: aitrolsystem
--

CREATE SEQUENCE salud.transferencias_internas_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE salud.transferencias_internas_id_seq OWNER TO aitrolsystem;

--
-- Name: transferencias_internas_id_seq; Type: SEQUENCE OWNED BY; Schema: salud; Owner: aitrolsystem
--

ALTER SEQUENCE salud.transferencias_internas_id_seq OWNED BY salud.transferencias_internas.id;


--
-- Name: tratamientos; Type: TABLE; Schema: salud; Owner: aitrolsystem
--

CREATE TABLE salud.tratamientos (
    id bigint NOT NULL,
    consulta_id bigint NOT NULL,
    indicaciones_generales text,
    cuidados_en_casa text,
    reposo_dias integer,
    seguimiento text,
    creado_por bigint,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE salud.tratamientos OWNER TO aitrolsystem;

--
-- Name: tratamientos_id_seq; Type: SEQUENCE; Schema: salud; Owner: aitrolsystem
--

CREATE SEQUENCE salud.tratamientos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE salud.tratamientos_id_seq OWNER TO aitrolsystem;

--
-- Name: tratamientos_id_seq; Type: SEQUENCE OWNED BY; Schema: salud; Owner: aitrolsystem
--

ALTER SEQUENCE salud.tratamientos_id_seq OWNED BY salud.tratamientos.id;


--
-- Name: triajes; Type: TABLE; Schema: salud; Owner: aitrolsystem
--

CREATE TABLE salud.triajes (
    id bigint NOT NULL,
    encuentro_id bigint,
    paciente_id bigint NOT NULL,
    personal_id bigint,
    sis_sucursal_id bigint,
    fecha_hora timestamp with time zone DEFAULT now() NOT NULL,
    temperatura numeric(5,2),
    presion_sistolica integer,
    presion_diastolica integer,
    frecuencia_cardiaca integer,
    frecuencia_respiratoria integer,
    saturacion_oxigeno numeric(5,2),
    glicemia numeric(8,2),
    nivel_dolor integer,
    clasificacion character varying(20),
    observaciones text,
    CONSTRAINT triajes_clasificacion_check CHECK (((clasificacion)::text = ANY ((ARRAY['ROJO'::character varying, 'NARANJA'::character varying, 'AMARILLO'::character varying, 'VERDE'::character varying, 'AZUL'::character varying])::text[]))),
    CONSTRAINT triajes_nivel_dolor_check CHECK (((nivel_dolor >= 0) AND (nivel_dolor <= 10)))
);


ALTER TABLE salud.triajes OWNER TO aitrolsystem;

--
-- Name: triajes_id_seq; Type: SEQUENCE; Schema: salud; Owner: aitrolsystem
--

CREATE SEQUENCE salud.triajes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE salud.triajes_id_seq OWNER TO aitrolsystem;

--
-- Name: triajes_id_seq; Type: SEQUENCE OWNED BY; Schema: salud; Owner: aitrolsystem
--

ALTER SEQUENCE salud.triajes_id_seq OWNED BY salud.triajes.id;


--
-- Name: unidades; Type: TABLE; Schema: salud; Owner: aitrolsystem
--

CREATE TABLE salud.unidades (
    id bigint NOT NULL,
    piso_id bigint,
    nombre character varying(200) NOT NULL,
    codigo character varying(50),
    descripcion text
);


ALTER TABLE salud.unidades OWNER TO aitrolsystem;

--
-- Name: unidades_id_seq; Type: SEQUENCE; Schema: salud; Owner: aitrolsystem
--

CREATE SEQUENCE salud.unidades_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE salud.unidades_id_seq OWNER TO aitrolsystem;

--
-- Name: unidades_id_seq; Type: SEQUENCE OWNED BY; Schema: salud; Owner: aitrolsystem
--

ALTER SEQUENCE salud.unidades_id_seq OWNED BY salud.unidades.id;


--
-- Name: audit_log id; Type: DEFAULT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.audit_log ALTER COLUMN id SET DEFAULT nextval('dbo.audit_log_id_seq'::regclass);


--
-- Name: clientes id; Type: DEFAULT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.clientes ALTER COLUMN id SET DEFAULT nextval('dbo.clientes_id_seq'::regclass);


--
-- Name: errores_log id; Type: DEFAULT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.errores_log ALTER COLUMN id SET DEFAULT nextval('dbo.errores_log_id_seq'::regclass);


--
-- Name: fin_caja id; Type: DEFAULT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.fin_caja ALTER COLUMN id SET DEFAULT nextval('dbo.fin_caja_id_seq'::regclass);


--
-- Name: fin_caja_arqueo id; Type: DEFAULT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.fin_caja_arqueo ALTER COLUMN id SET DEFAULT nextval('dbo.fin_caja_arqueo_id_seq'::regclass);


--
-- Name: fin_caja_mov id; Type: DEFAULT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.fin_caja_mov ALTER COLUMN id SET DEFAULT nextval('dbo.fin_caja_mov_id_seq'::regclass);


--
-- Name: fin_caja_usuario id; Type: DEFAULT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.fin_caja_usuario ALTER COLUMN id SET DEFAULT nextval('dbo.fin_caja_usuario_id_seq'::regclass);


--
-- Name: inv_ajustes_stock id; Type: DEFAULT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.inv_ajustes_stock ALTER COLUMN id SET DEFAULT nextval('dbo.inv_ajustes_stock_id_seq'::regclass);


--
-- Name: inv_ajustes_stock_det id; Type: DEFAULT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.inv_ajustes_stock_det ALTER COLUMN id SET DEFAULT nextval('dbo.inv_ajustes_stock_det_id_seq'::regclass);


--
-- Name: inv_almacenes id; Type: DEFAULT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.inv_almacenes ALTER COLUMN id SET DEFAULT nextval('dbo.inv_almacenes_id_seq'::regclass);


--
-- Name: inv_categorias id; Type: DEFAULT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.inv_categorias ALTER COLUMN id SET DEFAULT nextval('dbo.inv_categorias_id_seq'::regclass);


--
-- Name: inv_clientes id; Type: DEFAULT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.inv_clientes ALTER COLUMN id SET DEFAULT nextval('dbo.inv_clientes_id_seq'::regclass);


--
-- Name: inv_compras_cab id; Type: DEFAULT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.inv_compras_cab ALTER COLUMN id SET DEFAULT nextval('dbo.inv_compras_cab_id_seq'::regclass);


--
-- Name: inv_compras_det id; Type: DEFAULT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.inv_compras_det ALTER COLUMN id SET DEFAULT nextval('dbo.inv_compras_det_id_seq'::regclass);


--
-- Name: inv_compras_series id; Type: DEFAULT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.inv_compras_series ALTER COLUMN id SET DEFAULT nextval('dbo.inv_compras_series_id_seq'::regclass);


--
-- Name: inv_cotizaciones_cab id; Type: DEFAULT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.inv_cotizaciones_cab ALTER COLUMN id SET DEFAULT nextval('dbo.inv_cotizaciones_cab_id_seq'::regclass);


--
-- Name: inv_cotizaciones_det id; Type: DEFAULT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.inv_cotizaciones_det ALTER COLUMN id SET DEFAULT nextval('dbo.inv_cotizaciones_det_id_seq'::regclass);


--
-- Name: inv_kardex id; Type: DEFAULT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.inv_kardex ALTER COLUMN id SET DEFAULT nextval('dbo.inv_kardex_id_seq'::regclass);


--
-- Name: inv_marcas id; Type: DEFAULT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.inv_marcas ALTER COLUMN id SET DEFAULT nextval('dbo.inv_marcas_id_seq'::regclass);


--
-- Name: inv_movimientos id; Type: DEFAULT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.inv_movimientos ALTER COLUMN id SET DEFAULT nextval('dbo.inv_movimientos_id_seq'::regclass);


--
-- Name: inv_movimientos_detalle id; Type: DEFAULT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.inv_movimientos_detalle ALTER COLUMN id SET DEFAULT nextval('dbo.inv_movimientos_detalle_id_seq'::regclass);


--
-- Name: inv_movimientos_series id; Type: DEFAULT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.inv_movimientos_series ALTER COLUMN id SET DEFAULT nextval('dbo.inv_movimientos_series_id_seq'::regclass);


--
-- Name: inv_perchas id; Type: DEFAULT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.inv_perchas ALTER COLUMN id SET DEFAULT nextval('dbo.inv_perchas_id_seq'::regclass);


--
-- Name: inv_productos id; Type: DEFAULT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.inv_productos ALTER COLUMN id SET DEFAULT nextval('dbo.inv_productos_id_seq'::regclass);


--
-- Name: inv_productos_imagenes id; Type: DEFAULT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.inv_productos_imagenes ALTER COLUMN id SET DEFAULT nextval('dbo.inv_productos_imagenes_id_seq'::regclass);


--
-- Name: inv_productos_series id; Type: DEFAULT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.inv_productos_series ALTER COLUMN id SET DEFAULT nextval('dbo.inv_productos_series_id_seq'::regclass);


--
-- Name: inv_proveedores id; Type: DEFAULT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.inv_proveedores ALTER COLUMN id SET DEFAULT nextval('dbo.inv_proveedores_id_seq'::regclass);


--
-- Name: inv_stock id; Type: DEFAULT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.inv_stock ALTER COLUMN id SET DEFAULT nextval('dbo.inv_stock_id_seq'::regclass);


--
-- Name: inv_tipos_movimiento id; Type: DEFAULT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.inv_tipos_movimiento ALTER COLUMN id SET DEFAULT nextval('dbo.inv_tipos_movimiento_id_seq'::regclass);


--
-- Name: inv_transferencias id; Type: DEFAULT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.inv_transferencias ALTER COLUMN id SET DEFAULT nextval('dbo.inv_transferencias_id_seq'::regclass);


--
-- Name: inv_transferencias_det id; Type: DEFAULT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.inv_transferencias_det ALTER COLUMN id SET DEFAULT nextval('dbo.inv_transferencias_det_id_seq'::regclass);


--
-- Name: inv_ventas_cab id; Type: DEFAULT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.inv_ventas_cab ALTER COLUMN id SET DEFAULT nextval('dbo.inv_ventas_cab_id_seq'::regclass);


--
-- Name: inv_ventas_det id; Type: DEFAULT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.inv_ventas_det ALTER COLUMN id SET DEFAULT nextval('dbo.inv_ventas_det_id_seq'::regclass);


--
-- Name: inv_ventas_series id; Type: DEFAULT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.inv_ventas_series ALTER COLUMN id SET DEFAULT nextval('dbo.inv_ventas_series_id_seq'::regclass);


--
-- Name: materiales id; Type: DEFAULT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.materiales ALTER COLUMN id SET DEFAULT nextval('dbo.materiales_id_seq'::regclass);


--
-- Name: menu id; Type: DEFAULT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.menu ALTER COLUMN id SET DEFAULT nextval('dbo.menu_id_seq'::regclass);


--
-- Name: notificaciones id; Type: DEFAULT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.notificaciones ALTER COLUMN id SET DEFAULT nextval('dbo.notificaciones_id_seq'::regclass);


--
-- Name: notificaciones_leidas id; Type: DEFAULT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.notificaciones_leidas ALTER COLUMN id SET DEFAULT nextval('dbo.notificaciones_leidas_id_seq'::regclass);


--
-- Name: ordenes_estados_old id; Type: DEFAULT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.ordenes_estados_old ALTER COLUMN id SET DEFAULT nextval('dbo.ordenes_estados_id_seq'::regclass);


--
-- Name: ordenes_observaciones id; Type: DEFAULT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.ordenes_observaciones ALTER COLUMN id SET DEFAULT nextval('dbo.ordenes_observaciones_id_seq'::regclass);


--
-- Name: ordenes_viajes id; Type: DEFAULT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.ordenes_viajes ALTER COLUMN id SET DEFAULT nextval('dbo.ordenes_viajes_id_seq'::regclass);


--
-- Name: ordenes_viajes_asignaciones id; Type: DEFAULT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.ordenes_viajes_asignaciones ALTER COLUMN id SET DEFAULT nextval('dbo.ordenes_viajes_asignaciones_id_seq'::regclass);


--
-- Name: permisos_sistema id; Type: DEFAULT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.permisos_sistema ALTER COLUMN id SET DEFAULT nextval('dbo.permisos_sistema_id_seq'::regclass);


--
-- Name: puertos id; Type: DEFAULT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.puertos ALTER COLUMN id SET DEFAULT nextval('dbo.puertos_id_seq'::regclass);


--
-- Name: puntos id; Type: DEFAULT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.puntos ALTER COLUMN id SET DEFAULT nextval('dbo.puntos_id_seq'::regclass);


--
-- Name: puntos_log id; Type: DEFAULT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.puntos_log ALTER COLUMN id SET DEFAULT nextval('dbo.puntos_log_id_seq'::regclass);


--
-- Name: rh_areas id; Type: DEFAULT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.rh_areas ALTER COLUMN id SET DEFAULT nextval('dbo.rh_areas_id_seq'::regclass);


--
-- Name: rh_cargos id; Type: DEFAULT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.rh_cargos ALTER COLUMN id SET DEFAULT nextval('dbo.rh_cargos_id_seq'::regclass);


--
-- Name: rh_contratos id; Type: DEFAULT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.rh_contratos ALTER COLUMN id SET DEFAULT nextval('dbo.rh_contratos_id_seq'::regclass);


--
-- Name: rh_documentos_empleado id; Type: DEFAULT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.rh_documentos_empleado ALTER COLUMN id SET DEFAULT nextval('dbo.rh_documentos_empleado_id_seq'::regclass);


--
-- Name: rh_empleados id; Type: DEFAULT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.rh_empleados ALTER COLUMN id SET DEFAULT nextval('dbo.rh_empleados_id_seq'::regclass);


--
-- Name: rh_marcaciones id; Type: DEFAULT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.rh_marcaciones ALTER COLUMN id SET DEFAULT nextval('dbo.rh_marcaciones_id_seq'::regclass);


--
-- Name: rh_niveles_jerarquicos id; Type: DEFAULT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.rh_niveles_jerarquicos ALTER COLUMN id SET DEFAULT nextval('dbo.rh_niveles_jerarquicos_id_seq'::regclass);


--
-- Name: rh_permisos id; Type: DEFAULT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.rh_permisos ALTER COLUMN id SET DEFAULT nextval('dbo.rh_permisos_id_seq'::regclass);


--
-- Name: rh_prestamos id; Type: DEFAULT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.rh_prestamos ALTER COLUMN id SET DEFAULT nextval('dbo.rh_prestamos_id_seq'::regclass);


--
-- Name: rh_prestamos_cuotas id; Type: DEFAULT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.rh_prestamos_cuotas ALTER COLUMN id SET DEFAULT nextval('dbo.rh_prestamos_cuotas_id_seq'::regclass);


--
-- Name: rh_roles_pago_cab id; Type: DEFAULT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.rh_roles_pago_cab ALTER COLUMN id SET DEFAULT nextval('dbo.rh_roles_pago_cab_id_seq'::regclass);


--
-- Name: rh_roles_pago_det id; Type: DEFAULT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.rh_roles_pago_det ALTER COLUMN id SET DEFAULT nextval('dbo.rh_roles_pago_det_id_seq'::regclass);


--
-- Name: rh_usuario id; Type: DEFAULT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.rh_usuario ALTER COLUMN id SET DEFAULT nextval('dbo.rh_usuario_id_seq'::regclass);


--
-- Name: rh_vacaciones id; Type: DEFAULT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.rh_vacaciones ALTER COLUMN id SET DEFAULT nextval('dbo.rh_vacaciones_id_seq'::regclass);


--
-- Name: roles id; Type: DEFAULT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.roles ALTER COLUMN id SET DEFAULT nextval('dbo.roles_id_seq'::regclass);


--
-- Name: roles_permisos id; Type: DEFAULT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.roles_permisos ALTER COLUMN id SET DEFAULT nextval('dbo.roles_permisos_id_seq'::regclass);


--
-- Name: sis_datos_facturacion id; Type: DEFAULT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.sis_datos_facturacion ALTER COLUMN id SET DEFAULT nextval('dbo.sis_datos_facturacion_id_seq'::regclass);


--
-- Name: sis_empresa id_empresa; Type: DEFAULT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.sis_empresa ALTER COLUMN id_empresa SET DEFAULT nextval('dbo.sis_empresa_id_empresa_seq'::regclass);


--
-- Name: sis_punto_emision id_punto; Type: DEFAULT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.sis_punto_emision ALTER COLUMN id_punto SET DEFAULT nextval('dbo.sis_punto_emision_id_punto_seq'::regclass);


--
-- Name: sis_sucursal id_sucursal; Type: DEFAULT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.sis_sucursal ALTER COLUMN id_sucursal SET DEFAULT nextval('dbo.sis_sucursal_id_sucursal_seq'::regclass);


--
-- Name: sysdiagrams diagram_id; Type: DEFAULT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.sysdiagrams ALTER COLUMN diagram_id SET DEFAULT nextval('dbo.sysdiagrams_diagram_id_seq'::regclass);


--
-- Name: usuarios id; Type: DEFAULT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.usuarios ALTER COLUMN id SET DEFAULT nextval('dbo.usuarios_id_seq'::regclass);


--
-- Name: usuarios_roles id; Type: DEFAULT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.usuarios_roles ALTER COLUMN id SET DEFAULT nextval('dbo.usuarios_roles_id_seq'::regclass);


--
-- Name: usuarios_sucursales id; Type: DEFAULT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.usuarios_sucursales ALTER COLUMN id SET DEFAULT nextval('dbo.usuarios_sucursales_id_seq'::regclass);


--
-- Name: vehiculos id; Type: DEFAULT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.vehiculos ALTER COLUMN id SET DEFAULT nextval('dbo.vehiculos_id_seq'::regclass);


--
-- Name: vehiculos_kilometraje id; Type: DEFAULT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.vehiculos_kilometraje ALTER COLUMN id SET DEFAULT nextval('dbo.vehiculos_kilometraje_id_seq'::regclass);


--
-- Name: vehiculos_mantenimiento id; Type: DEFAULT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.vehiculos_mantenimiento ALTER COLUMN id SET DEFAULT nextval('dbo.vehiculos_mantenimiento_id_seq'::regclass);


--
-- Name: vehiculos_tipos id; Type: DEFAULT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.vehiculos_tipos ALTER COLUMN id SET DEFAULT nextval('dbo.vehiculos_tipos_id_seq'::regclass);


--
-- Name: adjuntos id; Type: DEFAULT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.adjuntos ALTER COLUMN id SET DEFAULT nextval('salud.adjuntos_id_seq'::regclass);


--
-- Name: afiliaciones id; Type: DEFAULT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.afiliaciones ALTER COLUMN id SET DEFAULT nextval('salud.afiliaciones_id_seq'::regclass);


--
-- Name: agendas id; Type: DEFAULT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.agendas ALTER COLUMN id SET DEFAULT nextval('salud.agendas_id_seq'::regclass);


--
-- Name: anestesia_registros id; Type: DEFAULT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.anestesia_registros ALTER COLUMN id SET DEFAULT nextval('salud.anestesia_registros_id_seq'::regclass);


--
-- Name: aseguradoras id; Type: DEFAULT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.aseguradoras ALTER COLUMN id SET DEFAULT nextval('salud.aseguradoras_id_seq'::regclass);


--
-- Name: camas id; Type: DEFAULT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.camas ALTER COLUMN id SET DEFAULT nextval('salud.camas_id_seq'::regclass);


--
-- Name: citas id; Type: DEFAULT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.citas ALTER COLUMN id SET DEFAULT nextval('salud.citas_id_seq'::regclass);


--
-- Name: consulta_diagnosticos id; Type: DEFAULT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.consulta_diagnosticos ALTER COLUMN id SET DEFAULT nextval('salud.consulta_diagnosticos_id_seq'::regclass);


--
-- Name: consulta_medica id; Type: DEFAULT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.consulta_medica ALTER COLUMN id SET DEFAULT nextval('salud.consulta_medica_id_seq'::regclass);


--
-- Name: contactos_emergencia id; Type: DEFAULT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.contactos_emergencia ALTER COLUMN id SET DEFAULT nextval('salud.contactos_emergencia_id_seq'::regclass);


--
-- Name: diagnosticos_cat id; Type: DEFAULT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.diagnosticos_cat ALTER COLUMN id SET DEFAULT nextval('salud.diagnosticos_cat_id_seq'::regclass);


--
-- Name: dispensaciones id; Type: DEFAULT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.dispensaciones ALTER COLUMN id SET DEFAULT nextval('salud.dispensaciones_id_seq'::regclass);


--
-- Name: dispensaciones_detalle id; Type: DEFAULT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.dispensaciones_detalle ALTER COLUMN id SET DEFAULT nextval('salud.dispensaciones_detalle_id_seq'::regclass);


--
-- Name: emergencias id; Type: DEFAULT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.emergencias ALTER COLUMN id SET DEFAULT nextval('salud.emergencias_id_seq'::regclass);


--
-- Name: encuentros id; Type: DEFAULT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.encuentros ALTER COLUMN id SET DEFAULT nextval('salud.encuentros_id_seq'::regclass);


--
-- Name: epicrisis id; Type: DEFAULT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.epicrisis ALTER COLUMN id SET DEFAULT nextval('salud.epicrisis_id_seq'::regclass);


--
-- Name: evoluciones id; Type: DEFAULT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.evoluciones ALTER COLUMN id SET DEFAULT nextval('salud.evoluciones_id_seq'::regclass);


--
-- Name: examen_fisico id; Type: DEFAULT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.examen_fisico ALTER COLUMN id SET DEFAULT nextval('salud.examen_fisico_id_seq'::regclass);


--
-- Name: examenes id; Type: DEFAULT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.examenes ALTER COLUMN id SET DEFAULT nextval('salud.examenes_id_seq'::regclass);


--
-- Name: facturas_clinicas id; Type: DEFAULT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.facturas_clinicas ALTER COLUMN id SET DEFAULT nextval('salud.facturas_clinicas_id_seq'::regclass);


--
-- Name: facturas_clinicas_detalle id; Type: DEFAULT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.facturas_clinicas_detalle ALTER COLUMN id SET DEFAULT nextval('salud.facturas_clinicas_detalle_id_seq'::regclass);


--
-- Name: historia_antecedentes id; Type: DEFAULT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.historia_antecedentes ALTER COLUMN id SET DEFAULT nextval('salud.historia_antecedentes_id_seq'::regclass);


--
-- Name: historia_auditoria id; Type: DEFAULT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.historia_auditoria ALTER COLUMN id SET DEFAULT nextval('salud.historia_auditoria_id_seq'::regclass);


--
-- Name: historia_clinica id; Type: DEFAULT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.historia_clinica ALTER COLUMN id SET DEFAULT nextval('salud.historia_clinica_id_seq'::regclass);


--
-- Name: ingresos id; Type: DEFAULT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.ingresos ALTER COLUMN id SET DEFAULT nextval('salud.ingresos_id_seq'::regclass);


--
-- Name: interconsultas id; Type: DEFAULT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.interconsultas ALTER COLUMN id SET DEFAULT nextval('salud.interconsultas_id_seq'::regclass);


--
-- Name: mar id; Type: DEFAULT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.mar ALTER COLUMN id SET DEFAULT nextval('salud.mar_id_seq'::regclass);


--
-- Name: medicamentos id; Type: DEFAULT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.medicamentos ALTER COLUMN id SET DEFAULT nextval('salud.medicamentos_id_seq'::regclass);


--
-- Name: muestras id; Type: DEFAULT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.muestras ALTER COLUMN id SET DEFAULT nextval('salud.muestras_id_seq'::regclass);


--
-- Name: ordenes_imagenologia id; Type: DEFAULT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.ordenes_imagenologia ALTER COLUMN id SET DEFAULT nextval('salud.ordenes_imagenologia_id_seq'::regclass);


--
-- Name: ordenes_laboratorio id; Type: DEFAULT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.ordenes_laboratorio ALTER COLUMN id SET DEFAULT nextval('salud.ordenes_laboratorio_id_seq'::regclass);


--
-- Name: pacientes id; Type: DEFAULT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.pacientes ALTER COLUMN id SET DEFAULT nextval('salud.pacientes_id_seq'::regclass);


--
-- Name: personal id; Type: DEFAULT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.personal ALTER COLUMN id SET DEFAULT nextval('salud.personal_id_seq'::regclass);


--
-- Name: personas id; Type: DEFAULT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.personas ALTER COLUMN id SET DEFAULT nextval('salud.personas_id_seq'::regclass);


--
-- Name: pisos id; Type: DEFAULT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.pisos ALTER COLUMN id SET DEFAULT nextval('salud.pisos_id_seq'::regclass);


--
-- Name: procedimientos id; Type: DEFAULT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.procedimientos ALTER COLUMN id SET DEFAULT nextval('salud.procedimientos_id_seq'::regclass);


--
-- Name: procedimientos_insumos id; Type: DEFAULT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.procedimientos_insumos ALTER COLUMN id SET DEFAULT nextval('salud.procedimientos_insumos_id_seq'::regclass);


--
-- Name: procedimientos_realizados id; Type: DEFAULT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.procedimientos_realizados ALTER COLUMN id SET DEFAULT nextval('salud.procedimientos_realizados_id_seq'::regclass);


--
-- Name: programacion_quirofano id; Type: DEFAULT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.programacion_quirofano ALTER COLUMN id SET DEFAULT nextval('salud.programacion_quirofano_id_seq'::regclass);


--
-- Name: quirofanos id; Type: DEFAULT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.quirofanos ALTER COLUMN id SET DEFAULT nextval('salud.quirofanos_id_seq'::regclass);


--
-- Name: recetas id; Type: DEFAULT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.recetas ALTER COLUMN id SET DEFAULT nextval('salud.recetas_id_seq'::regclass);


--
-- Name: recetas_detalle id; Type: DEFAULT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.recetas_detalle ALTER COLUMN id SET DEFAULT nextval('salud.recetas_detalle_id_seq'::regclass);


--
-- Name: resultados_imagenologia id; Type: DEFAULT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.resultados_imagenologia ALTER COLUMN id SET DEFAULT nextval('salud.resultados_imagenologia_id_seq'::regclass);


--
-- Name: resultados_laboratorio id; Type: DEFAULT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.resultados_laboratorio ALTER COLUMN id SET DEFAULT nextval('salud.resultados_laboratorio_id_seq'::regclass);


--
-- Name: salas id; Type: DEFAULT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.salas ALTER COLUMN id SET DEFAULT nextval('salud.salas_id_seq'::regclass);


--
-- Name: sedes id; Type: DEFAULT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.sedes ALTER COLUMN id SET DEFAULT nextval('salud.sedes_id_seq'::regclass);


--
-- Name: signos_vitales id; Type: DEFAULT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.signos_vitales ALTER COLUMN id SET DEFAULT nextval('salud.signos_vitales_id_seq'::regclass);


--
-- Name: transferencias_internas id; Type: DEFAULT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.transferencias_internas ALTER COLUMN id SET DEFAULT nextval('salud.transferencias_internas_id_seq'::regclass);


--
-- Name: tratamientos id; Type: DEFAULT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.tratamientos ALTER COLUMN id SET DEFAULT nextval('salud.tratamientos_id_seq'::regclass);


--
-- Name: triajes id; Type: DEFAULT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.triajes ALTER COLUMN id SET DEFAULT nextval('salud.triajes_id_seq'::regclass);


--
-- Name: unidades id; Type: DEFAULT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.unidades ALTER COLUMN id SET DEFAULT nextval('salud.unidades_id_seq'::regclass);



--
-- Data for Name: fin_caja; Type: TABLE DATA; Schema: dbo; Owner: aitrolsystem
--

COPY dbo.fin_caja (id, nombre, descripcion, estado, id_sucursal) FROM stdin;
1	Caja sistemas	caja sistemas\n	t	2
\.


--
-- Data for Name: fin_caja_arqueo; Type: TABLE DATA; Schema: dbo; Owner: aitrolsystem
--

COPY dbo.fin_caja_arqueo (id, id_caja, fecha_apertura, fecha_cierre, saldo_inicial, saldo_final, id_usuario_apertura, id_usuario_cierre, id_sucursal) FROM stdin;
23	3	2025-09-08 21:56:42.073-05	2025-09-08 21:57:00.25-05	1.0	0.0	2	2	1
24	3	2025-09-08 22:03:44.657-05	2025-09-08 22:04:14.4-05	10.0	0.0	2	2	1
25	4	2025-09-08 22:04:48.707-05	\N	0.0	\N	2	\N	1
26	3	2025-09-08 22:10:18.387-05	2025-09-08 22:11:16.903-05	10.0	0.0	2	2	1
27	3	2025-09-08 22:11:32.097-05	\N	10.0	\N	2	\N	1
\.


--
-- Data for Name: fin_caja_mov; Type: TABLE DATA; Schema: dbo; Owner: aitrolsystem
--

COPY dbo.fin_caja_mov (id, id_caja, id_arqueo, fecha, tipo_movimiento, concepto, monto, id_usuario, id_referencia, id_sucursal, origen, observacion) FROM stdin;
\.


--
-- Data for Name: fin_caja_usuario; Type: TABLE DATA; Schema: dbo; Owner: aitrolsystem
--

COPY dbo.fin_caja_usuario (id, id_caja, id_usuario, puede_abrir, puede_cerrar, puede_registrar, estado, id_sucursal) FROM stdin;
\.


--
-- Data for Name: inv_ajustes_stock; Type: TABLE DATA; Schema: dbo; Owner: aitrolsystem
--

COPY dbo.inv_ajustes_stock (id, almacen_id, fecha, motivo, usuario, estado) FROM stdin;
\.


--
-- Data for Name: inv_ajustes_stock_det; Type: TABLE DATA; Schema: dbo; Owner: aitrolsystem
--

COPY dbo.inv_ajustes_stock_det (id, ajuste_id, producto_id, cantidad, tipo) FROM stdin;
\.


--
-- Data for Name: inv_almacenes; Type: TABLE DATA; Schema: dbo; Owner: aitrolsystem
--

COPY dbo.inv_almacenes (id, nombre, direccion, estado, fecha_creacion, ubicacion, id_sucursal) FROM stdin;
\.


--
-- Data for Name: inv_categorias; Type: TABLE DATA; Schema: dbo; Owner: aitrolsystem
--

COPY dbo.inv_categorias (id, nombre, descripcion, estado, fecha_creacion, id_sucursal) FROM stdin;
\.


--
-- Data for Name: inv_clientes; Type: TABLE DATA; Schema: dbo; Owner: aitrolsystem
--

COPY dbo.inv_clientes (id, nombre, identificacion, direccion, telefono, email, estado, fecha_creacion, id_sucursal, contribuyente_especial, obligado_contabilidad, tipo_identificacion) FROM stdin;
1	Anthony	1316262193001	dsadsa	0963834469	achilan@mail.com	t	2025-10-21 23:13:20.827487-05	2	\N	SI	04
\.


--
-- Data for Name: inv_compras_cab; Type: TABLE DATA; Schema: dbo; Owner: aitrolsystem
--

COPY dbo.inv_compras_cab (id, proveedor_id, numero_factura, fecha, subtotal, iva, total, estado, fecha_creacion, movimiento_id, id_sucursal, id_caja, id_arqueo, id_usuario, fpago_id, observaciones, estado_pago, plazo_pago, fecha_pago) FROM stdin;
\.


--
-- Data for Name: inv_compras_det; Type: TABLE DATA; Schema: dbo; Owner: aitrolsystem
--

COPY dbo.inv_compras_det (id, compra_id, producto_id, cantidad, precio_unitario, subtotal, iva, total, descuento, almacen_id, percha_id, fpago_id) FROM stdin;
\.


--
-- Data for Name: inv_compras_series; Type: TABLE DATA; Schema: dbo; Owner: aitrolsystem
--

COPY dbo.inv_compras_series (id, compra_det_id, serie_id) FROM stdin;
\.


--
-- Data for Name: inv_cotizaciones_cab; Type: TABLE DATA; Schema: dbo; Owner: aitrolsystem
--

COPY dbo.inv_cotizaciones_cab (id, cliente_id, numero_cotizacion, fecha, fecha_validez, subtotal, iva, total, descuento, estado, observaciones, id_sucursal, id_usuario, fecha_creacion, fecha_aprobacion, fecha_rechazo, fecha_conversion, id_venta) FROM stdin;
\.


--
-- Data for Name: inv_cotizaciones_det; Type: TABLE DATA; Schema: dbo; Owner: aitrolsystem
--

COPY dbo.inv_cotizaciones_det (id, cotizacion_id, producto_id, cantidad, precio_unitario, subtotal, iva, total, descuento, almacen_id, percha_id) FROM stdin;
\.


--
-- Data for Name: inv_kardex; Type: TABLE DATA; Schema: dbo; Owner: aitrolsystem
--

COPY dbo.inv_kardex (id, producto_id, fecha, tipo_movimiento, cantidad, stock_anterior, stock_nuevo, referencia_id, serie_id, almacen_id, percha_id, id_sucursal, costo_unitario, precio_venta) FROM stdin;
\.


--
-- Data for Name: inv_marcas; Type: TABLE DATA; Schema: dbo; Owner: aitrolsystem
--

COPY dbo.inv_marcas (id, nombre, descripcion, estado, fecha_creacion, id_sucursal) FROM stdin;
7	aa	aa	t	2025-11-11 13:30:47.539756-05	545
\.


--
-- Data for Name: inv_movimientos; Type: TABLE DATA; Schema: dbo; Owner: aitrolsystem
--

COPY dbo.inv_movimientos (id, tipo_movimiento_id, fecha_movimiento, proveedor_id, cliente_id, observaciones, estado, id_sucursal, id_usuario) FROM stdin;
\.


--
-- Data for Name: inv_movimientos_detalle; Type: TABLE DATA; Schema: dbo; Owner: aitrolsystem
--

COPY dbo.inv_movimientos_detalle (id, movimiento_id, producto_id, cantidad, precio_unitario, subtotal, percha_id, almacen_id) FROM stdin;
\.


--
-- Data for Name: inv_movimientos_series; Type: TABLE DATA; Schema: dbo; Owner: aitrolsystem
--

COPY dbo.inv_movimientos_series (id, movimiento_detalle_id, serie_id) FROM stdin;
\.


--
-- Data for Name: inv_perchas; Type: TABLE DATA; Schema: dbo; Owner: aitrolsystem
--

COPY dbo.inv_perchas (id, almacen_id, codigo, descripcion, nombre, fecha_creacion, id_sucursal, estado) FROM stdin;
\.


--
-- Data for Name: inv_productos; Type: TABLE DATA; Schema: dbo; Owner: aitrolsystem
--

COPY dbo.inv_productos (id, nombre, descripcion, codigo_barra, categoria_id, marca_id, precio_compra, precio_venta, stock_actual, estado, fecha_creacion, foto_principal, stock_minimo, unidad_medida, id_sucursal, control_stock) FROM stdin;
\.


--
-- Data for Name: inv_productos_imagenes; Type: TABLE DATA; Schema: dbo; Owner: aitrolsystem
--

COPY dbo.inv_productos_imagenes (id, producto_id, url_imagen, descripcion) FROM stdin;
\.


--
-- Data for Name: inv_productos_series; Type: TABLE DATA; Schema: dbo; Owner: aitrolsystem
--

COPY dbo.inv_productos_series (id, producto_id, numero_serie, estado, fecha_registro, fecha_salida, almacen_id, percha_id, id_sucursal) FROM stdin;
\.


--
-- Data for Name: inv_proveedores; Type: TABLE DATA; Schema: dbo; Owner: aitrolsystem
--

COPY dbo.inv_proveedores (id, razon_social, nombre_contacto, ruc, direccion, telefono, email, estado, fecha_creacion, id_sucursal) FROM stdin;
\.


--
-- Data for Name: inv_stock; Type: TABLE DATA; Schema: dbo; Owner: aitrolsystem
--

COPY dbo.inv_stock (id, producto_id, almacen_id, percha_id, stock_actual, stock_minimo, id_sucursal) FROM stdin;
\.


--
-- Data for Name: inv_tipos_movimiento; Type: TABLE DATA; Schema: dbo; Owner: aitrolsystem
--

COPY dbo.inv_tipos_movimiento (id, nombre, descripcion) FROM stdin;
\.


--
-- Data for Name: inv_transferencias; Type: TABLE DATA; Schema: dbo; Owner: aitrolsystem
--

COPY dbo.inv_transferencias (id, almacen_origen, almacen_destino, fecha, estado, usuario, id_sucursal_origen, id_sucursal_destino) FROM stdin;
\.


--
-- Data for Name: inv_transferencias_det; Type: TABLE DATA; Schema: dbo; Owner: aitrolsystem
--

COPY dbo.inv_transferencias_det (id, transferencia_id, producto_id, cantidad) FROM stdin;
\.


--
-- Data for Name: inv_ventas_cab; Type: TABLE DATA; Schema: dbo; Owner: aitrolsystem
--

COPY dbo.inv_ventas_cab (id, cliente_id, numero_factura, fecha, subtotal, iva, total, estado, fecha_creacion, movimiento_id, id_sucursal, fpago_id, valor_pagado, fecha_pago, observaciones, plazo_pago, estado_pago, id_caja, id_arqueo, id_usuario, fecha_autorizacion, autorizacion_sri, xml_firmado, xml_autorizado, estado_sri, descuento) FROM stdin;
\.


--
-- Data for Name: inv_ventas_det; Type: TABLE DATA; Schema: dbo; Owner: aitrolsystem
--

COPY dbo.inv_ventas_det (id, venta_id, producto_id, cantidad, precio_unitario, subtotal, iva, total, descuento, serie, almacen_id, percha_id) FROM stdin;
\.


--
-- Data for Name: inv_ventas_series; Type: TABLE DATA; Schema: dbo; Owner: aitrolsystem
--

COPY dbo.inv_ventas_series (id, venta_det_id, serie_id) FROM stdin;
\.


--
-- Data for Name: materiales; Type: TABLE DATA; Schema: dbo; Owner: aitrolsystem
--

COPY dbo.materiales (id, nombre, estado) FROM stdin;
1	4333	1
\.


--
-- Data for Name: menu; Type: TABLE DATA; Schema: dbo; Owner: aitrolsystem
--

COPY dbo.menu (id, parent_menu_id, title, icon, path, heading, status, orden) FROM stdin;
1	\N	Dashboards	Dashboard			1	1
2	1	Resumen	\N	/	\N	1	1
3	\N	\N	\N	\N	User	1	1
4	\N	Mi cuenta	ManageAccounts			1	1
5	4	Cuenta	Info			1	1
6	5	Perfil	\N	/account/home/user-profile	\N	1	1
7	5	Manejo de usuarios	\N	/user-management	\N	1	1
8	5	Manejo de roles	\N	/rol-management	\N	1	1
9	5	Menu del sistema	\N	/menu-management	\N	1	1
10	5	Asignación de permisos	\N	/rol-management/create	\N	1	1
11	4	Miembros y Roles	\N	\N	\N	1	1
12	11	Roles	\N	/account/members/roles	\N	1	1
13	11	Permisos - Verificar	\N	/account/members/permissions-check	\N	1	1
14	\N	Vehiculos	car			0	1
15	14	Lista de vehiculos	car	/vehicle-management	\N	1	1
17	\N	Ordenes	book			0	1
18	17	Lista de Ordenes	book	/order-management	\N	1	1
19	17	Crear Orden	file	/order-management-add	\N	1	1
20	\N	Clientes	user			0	1
21	20	Lista de Clientes	\N	/client-management	\N	1	1
22	20	Crear cliente	\N	/client-management-add	\N	1	1
23	\N	Puertos	logistic			0	1
24	23	Lista de puertos	\N	/puerto-management	\N	1	1
25	23	Crear puerto	\N	/puerto-management-add	\N	1	1
26	\N	Materiales	car			0	1
27	26	Crear Material	\N	/materiales-management-add	\N	1	1
29	\N	Reportes	book			0	1
33	\N	Puntos	star			0	1
34	33	Lista de puntos	share	/points-management	\N	1	1
35	33	Crear puntos	star	/points-management/add-points	\N	1	1
36	\N	RRHH	People			1	1
37	36	Empleados	users	\N	\N	1	1
38	37	Lista de empleados	users	/employee-management	\N	1	1
39	37	Crear Empleado	user-plus	/employee-management/create	\N	1	1
40	36	Áreas	office-building	\N	\N	1	1
41	40	Lista de Áreas	office-building	/area-management	\N	1	1
42	36	Roles de Pago	money	\N	\N	1	1
43	42	Lista de Roles de Pago	money	/rhrol-management	\N	1	1
44	42	Crear Rol de Pago	money	/rhrol-management/create	\N	1	1
45	36	Prestamos	money	\N	\N	1	1
46	45	Lista de Prestamos	money	/lending-management	\N	1	1
47	5	Asignacion de permisos rol		/rol-management/create		1	1
48	36	Permisos		/rh-permisos-management		1	1
49	36	Marcaciones de Empleados		/marking-management		1	1
50	4	Marcacion		/marking		1	1
51	36	Reportes		/rh-report-management		1	1
52	36	Vacaciones		/rh-vacation-management		1	1
53	4	Solicitud Vacaciones		/rh-vacation-management/create		1	1
54	\N	Inventario	Warehouse			1	1
55	54	Productos		/inventory/products-management		1	1
56	55	Categorias		/inventory/category-management		1	1
57	54	Clientes		/inventory/clients-management		1	1
58	54	Proveedores		/inventory/supplier-management		1	1
59	55	Marcas		/inventory/brand-management		1	1
60	55	Kardex		/inventory/kardex-management		1	1
61	54	Compras				1	1
62	61	Lista de compras		/inventory/purchase-management		1	1
64	5	Errores		/error-logs		1	1
65	66	Crear Factura		/inventory/sale-management/create		1	1
66	54	Ventas		/inventory/sale-management		1	1
67	66	Lista de ventas		/inventory/sale-management		1	1
68	5	Sucursales		/branch-management		1	1
69	5	Punto de emisión		/emission-management		1	1
70	55	Almacenes		/inventory/warehouse-management		1	1
71	55	Perchas		/inventory/perchas-management		1	1
74	66	Crear factura(servicios)		/inventory/sale-service-management		1	1
75	55	Transferencia	LocalShipping	/inventory/kardex-management/transfer		1	1
76	55	Stock Inicial	Info	/inventory/products-management/upload		1	1
77	\N	Financiero	MonetizationOn			1	1
78	77	Caja				1	1
79	78	Lista de cajas		/financial-cash-management		1	1
80	78	Asignar caja		/financial-cash-user-management		1	1
81	78	Movimientos		/financial-cash-movements		1	1
82	66	Reporte de ventas		/inventory/sale-report		1	1
84	54	Reportes	Folder			1	1
85	84	Compras vs Ventas		/inventory/reports/purchase-vs-sales		1	1
86	84	Stock por almacenes	Info	/inventory/kardex-management/stock		1	1
73	55	Reporte Utilidad		/inventory/utilties		0	1
72	55	Stock		/inventory/kardex-management/stock		0	1
87	84	Reporte Utilidades	Settings	/inventory/utilties		1	1
63	61	Crear factura de compra		/inventory/purchase-management		0	1
83	55	Lista de productos		/inventory/products-management		1	4
88	36	Niveles de jerarquia	Home	/rh-hierarchical-levels-management		1	0
89	36	Cargos	Home	/rh-positions-management		1	0
90	36	Contratos	Settings	/contract-management	/contract-management	1	0
91	37	Documentos	Person	/rhrol-management/documents		1	0
92	37	Galeria de documentos	Home	/employee-management/preview-documents		1	0
93	5	Notificaciones	Home	/notifications		1	0
96	95	Lista de Ordenes	Settings	/order-management		1	0
97	95	Agregar Ordenes		/order-management-add		1	0
99	98	Lista de materiales		/materiales-management		0	0
16	14	Crear vehiculo	car	/vehicle-management/add-vehicle		1	1
95	94	Ordenes	Dashboard			1	0
31	109	Ordenes	book	/ordenes-report		1	1
32	109	Asignaciones	car	/order-asigment		1	1
30	109	Tv	screen	/tv		1	1
100	98	Lista de materiales		/materiales-management		1	0
101	98	Crear materiales		/materiales-management-add		1	0
28	26	Lista de Materiales		/materiales-management		0	1
94	\N	Logistica	LocalShipping			1	3
98	94	Materiales				1	0
102	94	Vehiculo				1	0
103	102	Listar vehiculos	ContactMail	/vehicle-management		1	0
105	94	Puertos				1	0
106	105	Lista puertos		/puerto-management		1	0
107	105	Crear puertos		/puerto-management-add		1	0
104	102	Crear vehiculo		/vehicle-management/add-vehicle		1	0
108	5	Empresa		/company		1	0
109	94	Reportes				1	0
\.


--
-- Data for Name: notificaciones; Type: TABLE DATA; Schema: dbo; Owner: aitrolsystem
--

COPY dbo.notificaciones (id, tipo, titulo, mensaje, fecha_creacion, fecha_envio, estado, ruta_archivo) FROM stdin;
1	Alerta	sadasdsa	dsadasdas	2025-10-11 10:12:20.915212	\N	activo	\N
2	Alerta	adsdsa	dsadasdas	2025-10-11 10:18:40.636221	\N	activo	\N
3	Recordatorio	dsadsa	dsadasdsadsa	2025-10-11 10:46:01.429328	\N	activo	\N
4	Recordatorio	dsadas	dsadsa	2025-11-09 22:04:07.427715	\N	activo	\N
\.


--
-- Data for Name: notificaciones_leidas; Type: TABLE DATA; Schema: dbo; Owner: aitrolsystem
--

COPY dbo.notificaciones_leidas (id, notificacion_id, usuario_id, fecha_leida) FROM stdin;
1	3	10040	2025-10-11 10:46:07.188416
2	2	10040	2025-10-11 10:46:23.009036
3	1	10040	2025-10-11 10:56:29.877549
4	4	10040	2025-11-09 22:04:16.81617
\.


--
-- Data for Name: ordenes; Type: TABLE DATA; Schema: dbo; Owner: aitrolsystem
--

COPY dbo.ordenes (id, cliente_id, usuario_id, descripcion, created_at, updated_at, total, peso_total, vehiculos_totales, material_id, puerto_salida_id, puerto_destino_id, unidad, fecha, hora_salida, finalizado, modo_entrada) FROM stdin;
1	1	\N	11111	\N	\N	1.0	333.0	1	1	1	1	\N	2025-10-26	09:03:00	0	1
2	1	\N	11111	\N	\N	1.0	333.0	1	1	1	1	\N	2025-10-26	09:03:00	0	1
3	1	\N	11111	\N	\N	1.0	333.0	1	1	1	1	\N	2025-10-26	09:03:00	0	1
4	1	\N	11111	\N	\N	1.0	333.0	1	1	1	1	\N	2025-10-26	09:03:00	0	1
5	1	\N	11111	\N	\N	1.0	333.0	1	1	1	1	\N	2025-10-26	09:03:00	0	1
6	1	\N	11111	\N	\N	1.0	333.0	1	1	1	1	\N	2025-10-26	09:03:00	0	1
7	1	\N	11111	\N	\N	1.0	333.0	1	1	1	1	\N	2025-10-26	09:03:00	0	1
8	1	2	44	\N	\N	1.0	4.0	1	1	1	1	\N	2025-10-26	14:55:00	0	2
9	1	2	1111	\N	\N	1.0	10.0	1	1	1	1	\N	2025-10-26	16:06:00	0	2
10	1	2	1111	\N	\N	1.0	10.0	1	1	1	1	\N	2025-10-26	16:06:00	0	2
\.


--
-- Data for Name: ordenes_compartir; Type: TABLE DATA; Schema: dbo; Owner: aitrolsystem
--

COPY dbo.ordenes_compartir (id, token, token_cabecera, orden_id, valido_hasta, created_at, estado, telefono) FROM stdin;
\.


--
-- Data for Name: ordenes_estados; Type: TABLE DATA; Schema: dbo; Owner: aitrolsystem
--

COPY dbo.ordenes_estados (id, nombre, orden, estado) FROM stdin;
1	En transito a puerto	1	1
2	Puerto	2	1
3	En carga de material	3	\N
4	Carga finalizada	4	\N
5	En transito a empresa	3	1
6	Empresa	4	1
7	En espera	8	\N
8	Sin iniciar	0	1
9	Finalizado	5	1
10	Descarga de material	7	\N
11	En vuelta	6	\N
\.


--
-- Data for Name: ordenes_estados_old; Type: TABLE DATA; Schema: dbo; Owner: aitrolsystem
--

COPY dbo.ordenes_estados_old (id, nombre, orden, estado) FROM stdin;
\.


--
-- Data for Name: ordenes_observaciones; Type: TABLE DATA; Schema: dbo; Owner: aitrolsystem
--

COPY dbo.ordenes_observaciones (id, orden_id, usuario_id, observacion, created_at) FROM stdin;
\.


--
-- Data for Name: ordenes_vehiculos; Type: TABLE DATA; Schema: dbo; Owner: aitrolsystem
--

COPY dbo.ordenes_vehiculos (id, vehiculo_id, orden_id, fecha, conductor_id, vueltas) FROM stdin;
4	3	7	\N	22	3
5	3	8	\N	22	0
7	3	10	\N	22	3
\.


--
-- Data for Name: ordenes_viajes; Type: TABLE DATA; Schema: dbo; Owner: aitrolsystem
--

COPY dbo.ordenes_viajes (id, vehiculo_id, user_id, orden_id, estado, documento_path, observacion, ruta, usuario_modifica, created_at, updated_at, estado_id, documento_path2, numero_guia, peso, numero_guia2, peso2, unidad, unidad_nombre, unidad2, unidad_nombre2, en_vuelta, peso_tara, peso_tara2, peso_neto, peso_neto2, guia_remision, usuario_crea, usuario_actualiza) FROM stdin;
3	3	22	10	\N	uploads/guias/20251025-133334_3_1.jpg	\N	\N	\N	\N	\N	0	\N	1000	1000		0	\N	\N	\N	\N	\N	100	0	1000	0		\N	2
2	3	22	10	En transito a empresa	uploads/guias/20251025-132532_2_1.jpg	\N	\N	\N	\N	\N	5	\N	10	10		0	\N	\N	\N	\N	\N	10	0	10	0		\N	2
1	3	22	10	En transito a empresa	uploads/guias/20251025-133428_1_1.jpg	\N	\N	\N	\N	\N	5	\N	00	3		0	\N	\N	\N	\N	\N	3	0	3	0		\N	2
\.


--
-- Data for Name: ordenes_viajes_asignaciones; Type: TABLE DATA; Schema: dbo; Owner: aitrolsystem
--

COPY dbo.ordenes_viajes_asignaciones (id, orden_id, vehiculo_id, conductor_id, cliente_id, puerto_destino_id, puerto_salida_id, fecha, observaciones, mantenimiento) FROM stdin;
3	7	3	22	1	1	1	2025-10-25 09:27:43.659464-05	\N	0
4	8	3	22	1	1	1	2025-10-25 12:55:56.989046-05	\N	0
5	10	3	22	1	1	1	2025-10-25 13:09:03.724657-05	\N	0
\.


--
-- Data for Name: ordenes_viajes_log; Type: TABLE DATA; Schema: dbo; Owner: aitrolsystem
--

COPY dbo.ordenes_viajes_log (id, estado, observacion, estado_nombre, ordenes_viajes_id, created_at, orden_id, estado_id) FROM stdin;
\.


--
-- Data for Name: permisos_sistema; Type: TABLE DATA; Schema: dbo; Owner: aitrolsystem
--

COPY dbo.permisos_sistema (id, nombre, descripcion, menu_id, icono_menu, accion) FROM stdin;
1	dashboards	Dashboards	1	element-11	\N
2	resumen	Resumen	2	\N	\N
3	mi_cuenta	Mi cuenta	4	setting-2	\N
4	cuenta	Cuenta	5	\N	\N
5	perfil	Perfil	6	\N	\N
6	manejo_de_usuarios	Manejo de usuarios	7	\N	\N
7	manejo_de_roles	Manejo de roles	8	\N	\N
8	menu_del_sistema	Menu del sistema	9	\N	\N
9	asignación_de_permisos	Asignación de permisos	10	\N	\N
10	miembros_y_roles	Miembros y Roles	11	\N	\N
11	roles	Roles	12	\N	\N
12	permisos_-_verificar	Permisos - Verificar	13	\N	\N
13	vehiculos	Vehiculos	14	car	\N
14	lista_de_vehiculos	Lista de vehiculos	15	car	\N
15	crear_vehiculo	Crear vehiculo	16	car	\N
16	ordenes	Ordenes	17	book	\N
17	lista_de_ordenes	Lista de Ordenes	18	book	\N
18	crear_orden	Crear Orden	19	file	\N
19	clientes	Clientes	20	user	\N
20	lista_de_clientes	Lista de Clientes	21	\N	\N
21	crear_cliente	Crear cliente	22	\N	\N
22	puertos	Puertos	23	logistic	\N
23	lista_de_puertos	Lista de puertos	24	\N	\N
24	crear_puerto	Crear puerto	25	\N	\N
25	materiales	Materiales	26	car	\N
26	crear_material	Crear Material	27	\N	\N
27	lista_de_materiales	Lista de Materiales	28	\N	\N
28	reportes	Reportes	29	book	\N
29	tv	Tv	30	screen	\N
30	ordenes	Ordenes	31	book	\N
31	asignaciones	Asignaciones	32	car	\N
32	puntos	Puntos	33	star	\N
33	lista_de_puntos	Lista de puntos	34	share	\N
34	crear_puntos	Crear puntos	35	star	\N
35	rrhh	RRHH	36	users	\N
36	empleados	Empleados	37	users	\N
37	lista_de_empleados	Lista de empleados	38	users	\N
38	crear_empleado	Crear Empleado	39	user-plus	\N
39	áreas	Áreas	40	office-building	\N
40	lista_de_áreas	Lista de Áreas	41	office-building	\N
41	roles_de_pago	Roles de Pago	42	money	\N
42	lista_de_roles_de_pago	Lista de Roles de Pago	43	money	\N
43	crear_rol_de_pago	Crear Rol de Pago	44	money	\N
44	prestamos	Prestamos	45	money	\N
45	lista_de_prestamos	Lista de Prestamos	46	money	\N
46	ver_permisos	Permiso para ver en Permisos	48		ver
47	crear_permisos	Permiso para crear en Permisos	48		crear
48	editar_permisos	Permiso para editar en Permisos	48		editar
49	eliminar_permisos	Permiso para eliminar en Permisos	48		eliminar
50	ver_marcaciones_de_empleados	Permiso para ver en Marcaciones de Empleados	49		ver
51	crear_marcaciones_de_empleados	Permiso para crear en Marcaciones de Empleados	49		crear
52	editar_marcaciones_de_empleados	Permiso para editar en Marcaciones de Empleados	49		editar
53	eliminar_marcaciones_de_empleados	Permiso para eliminar en Marcaciones de Empleados	49		eliminar
54	ver_marcacion	Permiso para ver en Marcacion	50		ver
55	crear_marcacion	Permiso para crear en Marcacion	50		crear
56	editar_marcacion	Permiso para editar en Marcacion	50		editar
57	eliminar_marcacion	Permiso para eliminar en Marcacion	50		eliminar
58	ver_reportes	Permiso para ver en Reportes	51		ver
59	crear_reportes	Permiso para crear en Reportes	51		crear
60	editar_reportes	Permiso para editar en Reportes	51		editar
61	eliminar_reportes	Permiso para eliminar en Reportes	51		eliminar
62	ver_vacaciones	Permiso para ver en Vacaciones	52		ver
63	crear_vacaciones	Permiso para crear en Vacaciones	52		crear
64	editar_vacaciones	Permiso para editar en Vacaciones	52		editar
65	eliminar_vacaciones	Permiso para eliminar en Vacaciones	52		eliminar
66	ver_solicitud_vacaciones	Permiso para ver en Solicitud Vacaciones	53		ver
67	crear_solicitud_vacaciones	Permiso para crear en Solicitud Vacaciones	53		crear
68	editar_solicitud_vacaciones	Permiso para editar en Solicitud Vacaciones	53		editar
69	eliminar_solicitud_vacaciones	Permiso para eliminar en Solicitud Vacaciones	53		eliminar
70	ver_inventario	Permiso para ver en Inventario	54	cash	ver
71	crear_inventario	Permiso para crear en Inventario	54	cash	crear
72	editar_inventario	Permiso para editar en Inventario	54	cash	editar
73	eliminar_inventario	Permiso para eliminar en Inventario	54	cash	eliminar
74	ver_clientes	Permiso para ver en Clientes	55		ver
75	crear_clientes	Permiso para crear en Clientes	55		crear
76	editar_clientes	Permiso para editar en Clientes	55		editar
77	eliminar_clientes	Permiso para eliminar en Clientes	55		eliminar
78	ver_categorias	Permiso para ver en Categorias	56		ver
79	crear_categorias	Permiso para crear en Categorias	56		crear
80	editar_categorias	Permiso para editar en Categorias	56		editar
81	eliminar_categorias	Permiso para eliminar en Categorias	56		eliminar
82	ver_clientes	Permiso para ver en Clientes	57		ver
83	crear_clientes	Permiso para crear en Clientes	57		crear
84	editar_clientes	Permiso para editar en Clientes	57		editar
85	eliminar_clientes	Permiso para eliminar en Clientes	57		eliminar
86	ver_proveedores	Permiso para ver en Proveedores	58		ver
87	crear_proveedores	Permiso para crear en Proveedores	58		crear
88	editar_proveedores	Permiso para editar en Proveedores	58		editar
89	eliminar_proveedores	Permiso para eliminar en Proveedores	58		eliminar
90	ver_marcas	Permiso para ver en Marcas	59		ver
91	crear_marcas	Permiso para crear en Marcas	59		crear
92	editar_marcas	Permiso para editar en Marcas	59		editar
93	eliminar_marcas	Permiso para eliminar en Marcas	59		eliminar
94	ver_kardex	Permiso para ver en Kardex	60		ver
95	crear_kardex	Permiso para crear en Kardex	60		crear
96	editar_kardex	Permiso para editar en Kardex	60		editar
97	eliminar_kardex	Permiso para eliminar en Kardex	60		eliminar
98	ver_compras	Permiso para ver en Compras	61		ver
99	crear_compras	Permiso para crear en Compras	61		crear
100	editar_compras	Permiso para editar en Compras	61		editar
101	eliminar_compras	Permiso para eliminar en Compras	61		eliminar
102	ver_lista_de_compras	Permiso para ver en Lista de compras	62		ver
103	crear_lista_de_compras	Permiso para crear en Lista de compras	62		crear
104	editar_lista_de_compras	Permiso para editar en Lista de compras	62		editar
105	eliminar_lista_de_compras	Permiso para eliminar en Lista de compras	62		eliminar
106	ver_crear_factura_de_compra	Permiso para ver en Crear factura de compra	63		ver
107	crear_crear_factura_de_compra	Permiso para crear en Crear factura de compra	63		crear
108	editar_crear_factura_de_compra	Permiso para editar en Crear factura de compra	63		editar
109	eliminar_crear_factura_de_compra	Permiso para eliminar en Crear factura de compra	63		eliminar
110	ver_errores	Permiso para ver en Errores	64		ver
111	crear_errores	Permiso para crear en Errores	64		crear
112	editar_errores	Permiso para editar en Errores	64		editar
113	eliminar_errores	Permiso para eliminar en Errores	64		eliminar
114	ver_crear_factura	Permiso para ver en Crear Factura	65		ver
115	crear_crear_factura	Permiso para crear en Crear Factura	65		crear
116	editar_crear_factura	Permiso para editar en Crear Factura	65		editar
117	eliminar_crear_factura	Permiso para eliminar en Crear Factura	65		eliminar
118	ver_ventas	Permiso para ver en Ventas	66		ver
119	crear_ventas	Permiso para crear en Ventas	66		crear
120	editar_ventas	Permiso para editar en Ventas	66		editar
121	eliminar_ventas	Permiso para eliminar en Ventas	66		eliminar
122	ver_lista_de_ventas	Permiso para ver en Lista de ventas	67		ver
123	crear_lista_de_ventas	Permiso para crear en Lista de ventas	67		crear
124	editar_lista_de_ventas	Permiso para editar en Lista de ventas	67		editar
125	eliminar_lista_de_ventas	Permiso para eliminar en Lista de ventas	67		eliminar
126	ver_sucursales	Permiso para ver en Sucursales	68		ver
127	crear_sucursales	Permiso para crear en Sucursales	68		crear
128	editar_sucursales	Permiso para editar en Sucursales	68		editar
129	eliminar_sucursales	Permiso para eliminar en Sucursales	68		eliminar
130	ver_punto_de_emisión	Permiso para ver en Punto de emisión	69		ver
131	crear_punto_de_emisión	Permiso para crear en Punto de emisión	69		crear
132	editar_punto_de_emisión	Permiso para editar en Punto de emisión	69		editar
133	eliminar_punto_de_emisión	Permiso para eliminar en Punto de emisión	69		eliminar
134	ver_almacenes	Permiso para ver en Almacenes	70		ver
135	crear_almacenes	Permiso para crear en Almacenes	70		crear
136	editar_almacenes	Permiso para editar en Almacenes	70		editar
137	eliminar_almacenes	Permiso para eliminar en Almacenes	70		eliminar
138	ver_perchas	Permiso para ver en Perchas	71		ver
139	crear_perchas	Permiso para crear en Perchas	71		crear
140	editar_perchas	Permiso para editar en Perchas	71		editar
141	eliminar_perchas	Permiso para eliminar en Perchas	71		eliminar
142	ver_stock	Permiso para ver en Stock	72		ver
143	crear_stock	Permiso para crear en Stock	72		crear
144	editar_stock	Permiso para editar en Stock	72		editar
145	eliminar_stock	Permiso para eliminar en Stock	72		eliminar
146	ver_reporte_utilidad	Permiso para ver en Reporte Utilidad	73		ver
147	crear_reporte_utilidad	Permiso para crear en Reporte Utilidad	73		crear
148	editar_reporte_utilidad	Permiso para editar en Reporte Utilidad	73		editar
149	eliminar_reporte_utilidad	Permiso para eliminar en Reporte Utilidad	73		eliminar
150	ver_crear_factura(servicios)	Permiso para ver en Crear factura(servicios)	74		ver
151	crear_crear_factura(servicios)	Permiso para crear en Crear factura(servicios)	74		crear
152	editar_crear_factura(servicios)	Permiso para editar en Crear factura(servicios)	74		editar
153	eliminar_crear_factura(servicios)	Permiso para eliminar en Crear factura(servicios)	74		eliminar
154	ver_transferencia	Permiso para ver en Transferencia	75	LocalShipping	ver
155	crear_transferencia	Permiso para crear en Transferencia	75	LocalShipping	crear
156	editar_transferencia	Permiso para editar en Transferencia	75	LocalShipping	editar
157	eliminar_transferencia	Permiso para eliminar en Transferencia	75	LocalShipping	eliminar
158	ver_stock_inicial	Permiso para ver en Stock Inicial	76	Info	ver
159	crear_stock_inicial	Permiso para crear en Stock Inicial	76	Info	crear
160	editar_stock_inicial	Permiso para editar en Stock Inicial	76	Info	editar
161	eliminar_stock_inicial	Permiso para eliminar en Stock Inicial	76	Info	eliminar
162	ver_financiero	Permiso para ver en Financiero	77	MonetizationOn	ver
163	crear_financiero	Permiso para crear en Financiero	77	MonetizationOn	crear
164	editar_financiero	Permiso para editar en Financiero	77	MonetizationOn	editar
165	eliminar_financiero	Permiso para eliminar en Financiero	77	MonetizationOn	eliminar
166	ver_caja	Permiso para ver en Caja	78		ver
167	crear_caja	Permiso para crear en Caja	78		crear
168	editar_caja	Permiso para editar en Caja	78		editar
169	eliminar_caja	Permiso para eliminar en Caja	78		eliminar
170	ver_lista_de_cajas	Permiso para ver en Lista de cajas	79		ver
171	crear_lista_de_cajas	Permiso para crear en Lista de cajas	79		crear
172	editar_lista_de_cajas	Permiso para editar en Lista de cajas	79		editar
173	eliminar_lista_de_cajas	Permiso para eliminar en Lista de cajas	79		eliminar
174	ver_asignar_caja	Permiso para ver en Asignar caja	80		ver
175	crear_asignar_caja	Permiso para crear en Asignar caja	80		crear
176	editar_asignar_caja	Permiso para editar en Asignar caja	80		editar
177	eliminar_asignar_caja	Permiso para eliminar en Asignar caja	80		eliminar
178	ver_movimientos	Permiso para ver en Movimientos	81		ver
179	crear_movimientos	Permiso para crear en Movimientos	81		crear
180	editar_movimientos	Permiso para editar en Movimientos	81		editar
181	eliminar_movimientos	Permiso para eliminar en Movimientos	81		eliminar
226	ver_notificaciones	Permiso para ver en Notificaciones	93	Home	ver
227	crear_notificaciones	Permiso para crear en Notificaciones	93	Home	crear
228	editar_notificaciones	Permiso para editar en Notificaciones	93	Home	editar
229	eliminar_notificaciones	Permiso para eliminar en Notificaciones	93	Home	eliminar
182	eliminar_reporte_de_ventas	Permiso para eliminar en Reporte de ventas	82		eliminar
184	crear_reporte_de_ventas	Permiso para crear en Reporte de ventas	82		crear
183	ver_reporte_de_ventas	Permiso para ver en Reporte de ventas	82		ver
185	editar_reporte_de_ventas	Permiso para editar en Reporte de ventas	82		editar
186	ver_lista_de_productos	Permiso para ver en Lista de productos	83		ver
187	crear_lista_de_productos	Permiso para crear en Lista de productos	83		crear
188	editar_lista_de_productos	Permiso para editar en Lista de productos	83		editar
189	eliminar_lista_de_productos	Permiso para eliminar en Lista de productos	83		eliminar
190	ver_reportes	Permiso para ver en Reportes	84	Folder	ver
191	crear_reportes	Permiso para crear en Reportes	84	Folder	crear
192	editar_reportes	Permiso para editar en Reportes	84	Folder	editar
193	eliminar_reportes	Permiso para eliminar en Reportes	84	Folder	eliminar
194	ver_compras_vs_ventas	Permiso para ver en Compras vs Ventas	85		ver
195	crear_compras_vs_ventas	Permiso para crear en Compras vs Ventas	85		crear
196	editar_compras_vs_ventas	Permiso para editar en Compras vs Ventas	85		editar
197	eliminar_compras_vs_ventas	Permiso para eliminar en Compras vs Ventas	85		eliminar
198	ver_stock_por_almacenes	Permiso para ver en Stock por almacenes	86	Info	ver
199	crear_stock_por_almacenes	Permiso para crear en Stock por almacenes	86	Info	crear
200	editar_stock_por_almacenes	Permiso para editar en Stock por almacenes	86	Info	editar
201	eliminar_stock_por_almacenes	Permiso para eliminar en Stock por almacenes	86	Info	eliminar
202	ver_reporte_utilidades	Permiso para ver en Reporte Utilidades	87	Settings	ver
203	crear_reporte_utilidades	Permiso para crear en Reporte Utilidades	87	Settings	crear
204	editar_reporte_utilidades	Permiso para editar en Reporte Utilidades	87	Settings	editar
205	eliminar_reporte_utilidades	Permiso para eliminar en Reporte Utilidades	87	Settings	eliminar
206	ver_niveles_de_jerarquia	Permiso para ver en Niveles de jerarquia	88	Home	ver
207	crear_niveles_de_jerarquia	Permiso para crear en Niveles de jerarquia	88	Home	crear
208	editar_niveles_de_jerarquia	Permiso para editar en Niveles de jerarquia	88	Home	editar
209	eliminar_niveles_de_jerarquia	Permiso para eliminar en Niveles de jerarquia	88	Home	eliminar
210	ver_cargos	Permiso para ver en Cargos	89	Home	ver
211	crear_cargos	Permiso para crear en Cargos	89	Home	crear
212	editar_cargos	Permiso para editar en Cargos	89	Home	editar
213	eliminar_cargos	Permiso para eliminar en Cargos	89	Home	eliminar
214	ver_contratos	Permiso para ver en Contratos	90	Settings	ver
215	crear_contratos	Permiso para crear en Contratos	90	Settings	crear
216	editar_contratos	Permiso para editar en Contratos	90	Settings	editar
217	eliminar_contratos	Permiso para eliminar en Contratos	90	Settings	eliminar
218	ver_documentos	Permiso para ver en Documentos	91	Person	ver
219	crear_documentos	Permiso para crear en Documentos	91	Person	crear
220	editar_documentos	Permiso para editar en Documentos	91	Person	editar
221	eliminar_documentos	Permiso para eliminar en Documentos	91	Person	eliminar
222	ver_galeria_de_documentos	Permiso para ver en Galeria de documentos	92	Home	ver
223	crear_galeria_de_documentos	Permiso para crear en Galeria de documentos	92	Home	crear
224	editar_galeria_de_documentos	Permiso para editar en Galeria de documentos	92	Home	editar
225	eliminar_galeria_de_documentos	Permiso para eliminar en Galeria de documentos	92	Home	eliminar
230	ver_logistica	Permiso para ver en Logistica	94	LocalShipping	ver
231	crear_logistica	Permiso para crear en Logistica	94	LocalShipping	crear
232	editar_logistica	Permiso para editar en Logistica	94	LocalShipping	editar
233	eliminar_logistica	Permiso para eliminar en Logistica	94	LocalShipping	eliminar
234	ver_ordenes	Permiso para ver en Ordenes	95	Dashboard	ver
235	crear_ordenes	Permiso para crear en Ordenes	95	Dashboard	crear
236	editar_ordenes	Permiso para editar en Ordenes	95	Dashboard	editar
237	eliminar_ordenes	Permiso para eliminar en Ordenes	95	Dashboard	eliminar
238	ver_lista_de_ordenes	Permiso para ver en Lista de Ordenes	96	Settings	ver
239	crear_lista_de_ordenes	Permiso para crear en Lista de Ordenes	96	Settings	crear
240	editar_lista_de_ordenes	Permiso para editar en Lista de Ordenes	96	Settings	editar
241	eliminar_lista_de_ordenes	Permiso para eliminar en Lista de Ordenes	96	Settings	eliminar
242	ver_agregar_ordenes	Permiso para ver en Agregar Ordenes	97		ver
243	crear_agregar_ordenes	Permiso para crear en Agregar Ordenes	97		crear
244	editar_agregar_ordenes	Permiso para editar en Agregar Ordenes	97		editar
245	eliminar_agregar_ordenes	Permiso para eliminar en Agregar Ordenes	97		eliminar
246	ver_materiales	Permiso para ver en Materiales	98		ver
247	crear_materiales	Permiso para crear en Materiales	98		crear
248	editar_materiales	Permiso para editar en Materiales	98		editar
249	eliminar_materiales	Permiso para eliminar en Materiales	98		eliminar
250	ver_lista_de_materiales	Permiso para ver en Lista de materiales	99		ver
251	crear_lista_de_materiales	Permiso para crear en Lista de materiales	99		crear
252	editar_lista_de_materiales	Permiso para editar en Lista de materiales	99		editar
253	eliminar_lista_de_materiales	Permiso para eliminar en Lista de materiales	99		eliminar
254	ver_lista_de_materiales	Permiso para ver en Lista de materiales	100		ver
255	crear_lista_de_materiales	Permiso para crear en Lista de materiales	100		crear
256	editar_lista_de_materiales	Permiso para editar en Lista de materiales	100		editar
257	eliminar_lista_de_materiales	Permiso para eliminar en Lista de materiales	100		eliminar
258	ver_crear_materiales	Permiso para ver en Crear materiales	101		ver
259	crear_crear_materiales	Permiso para crear en Crear materiales	101		crear
260	editar_crear_materiales	Permiso para editar en Crear materiales	101		editar
261	eliminar_crear_materiales	Permiso para eliminar en Crear materiales	101		eliminar
262	ver_vehiculo	Permiso para ver en Vehiculo	102		ver
263	crear_vehiculo	Permiso para crear en Vehiculo	102		crear
264	editar_vehiculo	Permiso para editar en Vehiculo	102		editar
265	eliminar_vehiculo	Permiso para eliminar en Vehiculo	102		eliminar
266	ver_listar_vehiculos	Permiso para ver en Listar vehiculos	103	ContactMail	ver
267	crear_listar_vehiculos	Permiso para crear en Listar vehiculos	103	ContactMail	crear
268	editar_listar_vehiculos	Permiso para editar en Listar vehiculos	103	ContactMail	editar
269	eliminar_listar_vehiculos	Permiso para eliminar en Listar vehiculos	103	ContactMail	eliminar
270	ver_crear_vehiculo	Permiso para ver en Crear vehiculo	104		ver
271	crear_crear_vehiculo	Permiso para crear en Crear vehiculo	104		crear
272	editar_crear_vehiculo	Permiso para editar en Crear vehiculo	104		editar
273	eliminar_crear_vehiculo	Permiso para eliminar en Crear vehiculo	104		eliminar
274	ver_puertos	Permiso para ver en Puertos	105		ver
275	crear_puertos	Permiso para crear en Puertos	105		crear
276	editar_puertos	Permiso para editar en Puertos	105		editar
277	eliminar_puertos	Permiso para eliminar en Puertos	105		eliminar
278	ver_lista_puertos	Permiso para ver en Lista puertos	106		ver
279	crear_lista_puertos	Permiso para crear en Lista puertos	106		crear
280	editar_lista_puertos	Permiso para editar en Lista puertos	106		editar
281	eliminar_lista_puertos	Permiso para eliminar en Lista puertos	106		eliminar
282	ver_crear_puertos	Permiso para ver en Crear puertos	107		ver
283	crear_crear_puertos	Permiso para crear en Crear puertos	107		crear
284	editar_crear_puertos	Permiso para editar en Crear puertos	107		editar
285	eliminar_crear_puertos	Permiso para eliminar en Crear puertos	107		eliminar
286	ver_empresa	Permiso para ver en Empresa	108		ver
287	crear_empresa	Permiso para crear en Empresa	108		crear
288	editar_empresa	Permiso para editar en Empresa	108		editar
289	eliminar_empresa	Permiso para eliminar en Empresa	108		eliminar
290	ver_reportes	Permiso para ver en Reportes	109		ver
291	crear_reportes	Permiso para crear en Reportes	109		crear
292	editar_reportes	Permiso para editar en Reportes	109		editar
293	eliminar_reportes	Permiso para eliminar en Reportes	109		eliminar
\.


--
-- Data for Name: puertos; Type: TABLE DATA; Schema: dbo; Owner: aitrolsystem
--

COPY dbo.puertos (id, nombre, direccion, estado, telefono) FROM stdin;
1	1	1	1	111
\.


--
-- Data for Name: puntos; Type: TABLE DATA; Schema: dbo; Owner: aitrolsystem
--

COPY dbo.puntos (id, puntos, user_id, created_at) FROM stdin;
\.


--
-- Data for Name: puntos_log; Type: TABLE DATA; Schema: dbo; Owner: aitrolsystem
--

COPY dbo.puntos_log (id, puntos_ant, puntos, created_at, puntos_id) FROM stdin;
\.


--
-- Data for Name: rh_areas; Type: TABLE DATA; Schema: dbo; Owner: aitrolsystem
--

COPY dbo.rh_areas (id, nombre, descripcion, estado, id_empresa, id_sucursal) FROM stdin;
2	Sistemas	Sistemas\n	1	\N	2
3	Sistemas 2	SISTEMAS 2	1	\N	2
1	Sistemassss	sss4ssss	1	\N	2
\.


--
-- Data for Name: rh_cargos; Type: TABLE DATA; Schema: dbo; Owner: aitrolsystem
--

COPY dbo.rh_cargos (id, nombre, descripcion, id_area, id_nivel, sueldo_minimo, sueldo_maximo, estado, fecha_creacion) FROM stdin;
1	Sistemas	sistemas	\N	1	1200.0	1300.0	t	2025-11-11 18:40:25.818413
\.


--
-- Data for Name: rh_contratos; Type: TABLE DATA; Schema: dbo; Owner: aitrolsystem
--

COPY dbo.rh_contratos (id, empleado_id, tipo_contrato, fecha_inicio, fecha_fin, cargo_id, sueldo_base, estado, fecha_creacion, fecha_modificacion, observaciones) FROM stdin;
\.


--
-- Data for Name: rh_documentos_empleado; Type: TABLE DATA; Schema: dbo; Owner: aitrolsystem
--

COPY dbo.rh_documentos_empleado (id, empleado_id, tipo_documento, nombre_archivo, ruta_archivo, fecha_carga, estado, observaciones, fecha_vencimiento, usuario_carga) FROM stdin;
1	1	Cedula	1248329.jpg	uploads/documentos_empleados/1_Cedula_20251206130124.jpg	2025-12-06 13:01:24.387445	Vigente	\N	2025-12-06	\N
\.


--
-- Data for Name: rh_empleados; Type: TABLE DATA; Schema: dbo; Owner: aitrolsystem
--

COPY dbo.rh_empleados (id, cedula, nombres, apellidos, fecha_nacimiento, cuenta_bancaria, tipo_cuenta_bancaria, direccion, telefono, email, fecha_ingreso, cargo, sueldo_basico, estado, fecha_salida, area_id, jefe_id, foto, acumula, p_quirografario, p_hipotecario, seguro_priv, hora_entrada, hora_salida, id_sucursal, cargo_id) FROM stdin;
1	1316262193	Empleado	Sistemas	2025-11-11	1111	Ahorros	Mucho lote etapa IV mz2515 V15	0963834469	anthony.chilanp@gmail.com	2025-11-11	Sistemas	1200.0	t	\N	2	\N	uploads/fotos_empleados/1316262193_20251111134132.png	0	0.0	0.0	0.0	13:41:00	19:41:00	2	1
\.


--
-- Data for Name: rh_marcaciones; Type: TABLE DATA; Schema: dbo; Owner: aitrolsystem
--

COPY dbo.rh_marcaciones (id, empleado_id, tipo, latitud, longitud, "timestamp", id_empresa, id_sucursal) FROM stdin;
2	4	entrada	-2.0288405	-79.8555716	2025-09-16 15:54:03.175916-05	\N	2
3	4	entrada_almuerzo	-2.0288405	-79.8555716	2025-09-16 15:56:24.996611-05	\N	2
4	4	entrada	-2.1331968	-79.921152	2025-10-10 00:26:25.384088-05	\N	2
5	1	entrada	-2.0391273556573264	-79.85766788623096	2025-11-11 13:42:04.408681-05	\N	545
6	1	entrada_almuerzo	-2.039127198273236	-79.85764374074999	2025-11-11 13:42:52.004811-05	\N	2
7	1	salida_almuerzo	-2.0391271981710095	-79.85764373996136	2025-11-11 13:43:03.064194-05	\N	2
\.


--
-- Data for Name: rh_niveles_jerarquicos; Type: TABLE DATA; Schema: dbo; Owner: aitrolsystem
--

COPY dbo.rh_niveles_jerarquicos (id, nombre, descripcion, nivel_orden, estado, fecha_creacion) FROM stdin;
1	Sistemas	1	1	t	2025-11-11 18:40:11.142705
\.


--
-- Data for Name: rh_permisos; Type: TABLE DATA; Schema: dbo; Owner: aitrolsystem
--

COPY dbo.rh_permisos (id, empleado_id, tipo_permiso, fecha_inicio, fecha_fin, motivo, estado, id_empresa, id_sucursal, fecha_creacion) FROM stdin;
\.


--
-- Data for Name: rh_prestamos; Type: TABLE DATA; Schema: dbo; Owner: aitrolsystem
--

COPY dbo.rh_prestamos (id, empleado_id, monto, fecha_prestamo, cuotas, valor_cuota, saldo_pendiente, estado, id_empresa, id_sucursal) FROM stdin;
1	1	1000.0	2025-12-06	30	33.33	1000.0	Activo	1	2
\.


--
-- Data for Name: rh_prestamos_cuotas; Type: TABLE DATA; Schema: dbo; Owner: aitrolsystem
--

COPY dbo.rh_prestamos_cuotas (id, prestamo_id, numero_cuota, fecha_vencimiento, valor_cuota, estado, fecha_pago, rol_pago_det_id) FROM stdin;
1	5	1	2025-10-16	10	Pendiente	\N	\N
2	5	2	2025-11-15	10	Pendiente	\N	\N
3	5	3	2025-12-15	10	Pendiente	\N	\N
4	5	4	2026-01-14	10	Pendiente	\N	\N
5	5	5	2026-02-13	10	Pendiente	\N	\N
6	5	6	2026-03-15	10	Pendiente	\N	\N
7	5	7	2026-04-14	10	Pendiente	\N	\N
8	5	8	2026-05-14	10	Pendiente	\N	\N
9	5	9	2026-06-13	10	Pendiente	\N	\N
10	5	10	2026-07-13	10	Pendiente	\N	\N
11	1	1	2026-01-05	33.33	Pendiente	\N	\N
12	1	2	2026-02-04	33.33	Pendiente	\N	\N
13	1	3	2026-03-06	33.33	Pendiente	\N	\N
14	1	4	2026-04-05	33.33	Pendiente	\N	\N
15	1	5	2026-05-05	33.33	Pendiente	\N	\N
16	1	6	2026-06-04	33.33	Pendiente	\N	\N
17	1	7	2026-07-04	33.33	Pendiente	\N	\N
18	1	8	2026-08-03	33.33	Pendiente	\N	\N
19	1	9	2026-09-02	33.33	Pendiente	\N	\N
20	1	10	2026-10-02	33.33	Pendiente	\N	\N
21	1	11	2026-11-01	33.33	Pendiente	\N	\N
22	1	12	2026-12-01	33.33	Pendiente	\N	\N
23	1	13	2026-12-31	33.33	Pendiente	\N	\N
24	1	14	2027-01-30	33.33	Pendiente	\N	\N
25	1	15	2027-03-01	33.33	Pendiente	\N	\N
26	1	16	2027-03-31	33.33	Pendiente	\N	\N
27	1	17	2027-04-30	33.33	Pendiente	\N	\N
28	1	18	2027-05-30	33.33	Pendiente	\N	\N
29	1	19	2027-06-29	33.33	Pendiente	\N	\N
30	1	20	2027-07-29	33.33	Pendiente	\N	\N
31	1	21	2027-08-28	33.33	Pendiente	\N	\N
32	1	22	2027-09-27	33.33	Pendiente	\N	\N
33	1	23	2027-10-27	33.33	Pendiente	\N	\N
34	1	24	2027-11-26	33.33	Pendiente	\N	\N
35	1	25	2027-12-26	33.33	Pendiente	\N	\N
36	1	26	2028-01-25	33.33	Pendiente	\N	\N
37	1	27	2028-02-24	33.33	Pendiente	\N	\N
38	1	28	2028-03-25	33.33	Pendiente	\N	\N
39	1	29	2028-04-24	33.33	Pendiente	\N	\N
40	1	30	2028-05-24	33.33	Pendiente	\N	\N
\.


--
-- Data for Name: rh_roles_pago_cab; Type: TABLE DATA; Schema: dbo; Owner: aitrolsystem
--

COPY dbo.rh_roles_pago_cab (id, tipo_rol, fecha_generacion, mes_correspondiente, anio_correspondiente, estado, aprobado_por, fecha_aprobacion, observaciones, id_sucursal, total) FROM stdin;
1	Mensual	2025-11-11	1	2025	Pendiente	\N	\N	\N	2	0.00
2	Mensual	2025-12-06	2	2025	Pendiente	\N	\N	\N	2	0.00
\.


--
-- Data for Name: rh_roles_pago_det; Type: TABLE DATA; Schema: dbo; Owner: aitrolsystem
--

COPY dbo.rh_roles_pago_det (id, cabecera_id, empleado_id, sueldo_basico, horas_extras, bonificaciones, comisiones, decimo_tercero, decimo_cuarto, fondos_reserva, vacaciones, prestamos, multas, iess_personal, otros_descuentos, total_ingresos, total_descuentos, neto_a_pagar, p_hipotecario, p_quirografario, seguro_priv) FROM stdin;
1	1	1	1200.0	0	0	0	0	0	0	0	0	0	113.4	0	1200.0	0	1200.0	0.0	0.0	0.0
2	2	1	1200.0	0	0	0	0	0	0	0	0	0	113.4	0	1200.0	0	1200.0	0.0	0.0	0.0
\.


--
-- Data for Name: rh_usuario; Type: TABLE DATA; Schema: dbo; Owner: aitrolsystem
--

COPY dbo.rh_usuario (id, empleado_id, usuario_id) FROM stdin;
1	1	8
\.


--
-- Data for Name: rh_vacaciones; Type: TABLE DATA; Schema: dbo; Owner: aitrolsystem
--

COPY dbo.rh_vacaciones (id, empleado_id, fecha_inicio, fecha_fin, dias_solicitados, motivo, estado, fecha_solicitud, fecha_respuesta, aprobado_por, documento) FROM stdin;
1	2	2025-10-10	2025-10-17	8	11	pendiente	2025-10-10	\N	\N	\N
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: dbo; Owner: aitrolsystem
--

COPY dbo.roles (id, nombre, estado, icono, subtitulo, descripcion) FROM stdin;
544	Cajero	1	activity	cajero	cajero
549	Logistica	1	activity	logistica	dasdsadas
550	Recursos Humanos	1	activity	recursos humanos	recursos humanos
545	Cajero	1	activity	cajero	cajero
546	Cajero	1	activity	cajero	cajero
551	empleado	1	activity	empleado	1
547	Cajero	1	activity	cajero	cajero
548	Cajero	1	activity	cajero	cajero
1	Admin	\N	help	administrador de usuarios	permisos para todo
2	Chofer	\N	analytics	chofer de vehiculo	chofer de vehiculo
3	CONDUCTORES	\N	badge		
\.


--
-- Data for Name: roles_permisos; Type: TABLE DATA; Schema: dbo; Owner: aitrolsystem
--

COPY dbo.roles_permisos (id, rol_id, permiso_id, accion) FROM stdin;
11719	1	1	lectura
11720	1	1	escritura
11721	1	1	edicion
11722	1	2	lectura
11723	1	2	escritura
11724	1	2	edicion
11725	1	3	lectura
11726	1	3	escritura
11727	1	3	edicion
11728	1	4	lectura
11729	1	4	escritura
11730	1	4	edicion
11731	1	5	lectura
11732	1	5	escritura
11733	1	5	edicion
11734	1	6	lectura
11735	1	6	escritura
11736	1	6	edicion
11737	1	7	lectura
11738	1	7	escritura
11739	1	7	edicion
11740	1	8	lectura
11741	1	8	escritura
11742	1	8	edicion
11743	1	9	lectura
11744	1	9	escritura
11745	1	9	edicion
11746	1	10	lectura
11747	1	10	escritura
11748	1	10	edicion
11749	1	11	lectura
11750	1	11	escritura
11751	1	11	edicion
11752	1	12	lectura
11753	1	12	escritura
11754	1	12	edicion
11755	1	13	lectura
11756	1	13	escritura
11757	1	13	edicion
11758	1	14	lectura
11759	1	14	escritura
11760	1	14	edicion
11761	1	15	lectura
11762	1	15	escritura
11763	1	15	edicion
11764	1	16	lectura
11765	1	16	escritura
11766	1	16	edicion
11767	1	17	lectura
11768	1	17	escritura
11769	1	17	edicion
11770	1	18	lectura
11771	1	18	escritura
11772	1	18	edicion
11773	1	19	lectura
11774	1	19	escritura
11775	1	19	edicion
11776	1	20	lectura
11777	1	20	escritura
11778	1	20	edicion
11779	1	21	lectura
11780	1	21	escritura
11781	1	21	edicion
11782	1	22	lectura
11783	1	22	escritura
11784	1	22	edicion
11785	1	23	lectura
11786	1	23	escritura
11787	1	23	edicion
11788	1	24	lectura
11789	1	24	escritura
11790	1	24	edicion
11791	1	25	lectura
11792	1	25	escritura
11793	1	25	edicion
11794	1	26	lectura
11795	1	26	escritura
11796	1	26	edicion
11797	1	27	lectura
11798	1	27	escritura
11799	1	27	edicion
11800	1	28	lectura
11801	1	28	escritura
11802	1	28	edicion
11803	1	29	lectura
11804	1	29	escritura
11805	1	29	edicion
11806	1	30	lectura
11807	1	30	escritura
11808	1	30	edicion
11809	1	31	lectura
11810	1	31	escritura
11811	1	31	edicion
11812	1	32	lectura
11813	1	32	escritura
11814	1	32	edicion
11815	1	33	lectura
11816	1	33	escritura
11817	1	33	edicion
11818	1	34	lectura
11819	1	34	escritura
11820	1	34	edicion
11821	1	35	lectura
11822	1	35	escritura
11823	1	35	edicion
11824	1	36	lectura
11825	1	36	escritura
11826	1	36	edicion
11827	1	37	lectura
11828	1	37	escritura
11829	1	37	edicion
11830	1	38	lectura
11831	1	38	escritura
11832	1	38	edicion
11833	1	39	lectura
11834	1	39	escritura
11835	1	39	edicion
11836	1	40	lectura
11837	1	40	escritura
11838	1	40	edicion
11839	1	41	lectura
11840	1	41	escritura
11841	1	41	edicion
11842	1	42	lectura
11843	1	42	escritura
11844	1	42	edicion
11845	1	43	lectura
11846	1	43	escritura
11847	1	43	edicion
11848	1	44	lectura
11849	1	44	escritura
11850	1	44	edicion
11851	1	45	lectura
11852	1	45	escritura
11853	1	45	edicion
11854	1	46	lectura
11855	1	46	escritura
11856	1	46	edicion
11857	1	47	lectura
11858	1	47	escritura
11859	1	47	edicion
11860	1	48	lectura
11861	1	48	escritura
11862	1	48	edicion
11863	1	49	lectura
11864	1	49	escritura
11865	1	49	edicion
11866	1	50	lectura
11867	1	50	escritura
11868	1	50	edicion
11869	1	51	lectura
11870	1	51	escritura
11871	1	51	edicion
11872	1	52	lectura
11873	1	52	escritura
11874	1	52	edicion
11875	1	53	lectura
11876	1	53	escritura
11877	1	53	edicion
11878	1	54	lectura
11879	1	54	escritura
11880	1	54	edicion
11881	1	55	lectura
11882	1	55	escritura
11883	1	55	edicion
11884	1	56	lectura
11885	1	56	escritura
11886	1	56	edicion
11887	1	57	lectura
11888	1	57	escritura
11889	1	57	edicion
11890	1	58	lectura
11891	1	58	escritura
11892	1	58	edicion
11893	1	59	lectura
11894	1	59	escritura
11895	1	59	edicion
11896	1	60	lectura
11897	1	60	escritura
11898	1	60	edicion
11899	1	61	lectura
11900	1	61	escritura
11901	1	61	edicion
11902	1	62	lectura
11903	1	62	escritura
11904	1	62	edicion
11905	1	63	lectura
11906	1	63	escritura
11907	1	63	edicion
11908	1	64	lectura
11909	1	64	escritura
11910	1	64	edicion
11911	1	65	lectura
11912	1	65	escritura
11913	1	65	edicion
11914	1	66	lectura
11915	1	66	escritura
11916	1	66	edicion
11917	1	67	lectura
11918	1	67	escritura
11919	1	67	edicion
11920	1	68	lectura
11921	1	68	escritura
11922	1	68	edicion
11923	1	69	lectura
11924	1	69	escritura
11925	1	69	edicion
11926	1	70	lectura
11927	1	70	escritura
11928	1	70	edicion
11929	1	71	lectura
11930	1	71	escritura
11931	1	71	edicion
11932	1	72	lectura
11933	1	72	escritura
11934	1	72	edicion
11935	1	73	lectura
11936	1	73	escritura
11937	1	73	edicion
11938	1	74	lectura
11939	1	74	escritura
11940	1	74	edicion
11941	1	75	lectura
11942	1	75	escritura
11943	1	75	edicion
11944	1	76	lectura
11945	1	76	escritura
11946	1	76	edicion
11947	1	77	lectura
11948	1	77	escritura
11949	1	77	edicion
11950	1	78	lectura
11951	1	78	escritura
11952	1	78	edicion
11953	1	79	lectura
11954	1	79	escritura
11955	1	79	edicion
11956	1	80	lectura
11957	1	80	escritura
11958	1	80	edicion
11959	1	81	lectura
11960	1	81	escritura
11961	1	81	edicion
11962	1	82	lectura
11963	1	82	escritura
11964	1	82	edicion
11965	1	83	lectura
11966	1	83	escritura
11967	1	83	edicion
11968	1	84	lectura
11969	1	84	escritura
11970	1	84	edicion
11971	1	85	lectura
11972	1	85	escritura
11973	1	85	edicion
11974	1	86	lectura
11975	1	86	escritura
11976	1	86	edicion
11977	1	87	lectura
11978	1	87	escritura
11979	1	87	edicion
11980	1	88	lectura
11981	1	88	escritura
11982	1	88	edicion
11983	1	89	lectura
11984	1	89	escritura
11985	1	89	edicion
11986	1	90	lectura
11987	1	90	escritura
11988	1	90	edicion
11989	1	91	lectura
11990	1	91	escritura
11991	1	91	edicion
11992	1	92	lectura
11993	1	92	escritura
11994	1	92	edicion
11995	1	93	lectura
11996	1	93	escritura
11997	1	93	edicion
11998	1	94	lectura
11999	1	94	escritura
12000	1	94	edicion
12001	1	95	lectura
12002	1	95	escritura
12003	1	95	edicion
12004	1	96	lectura
12005	1	96	escritura
12006	1	96	edicion
12007	1	97	lectura
12008	1	97	escritura
12009	1	97	edicion
12010	1	98	lectura
12011	1	98	escritura
12012	1	98	edicion
12013	1	99	lectura
12014	1	99	escritura
12015	1	99	edicion
12016	1	100	lectura
12017	1	100	escritura
12018	1	100	edicion
12019	1	101	lectura
12020	1	101	escritura
12021	1	101	edicion
12022	1	102	lectura
12023	1	102	escritura
12024	1	102	edicion
12025	1	103	lectura
12026	1	103	escritura
12027	1	103	edicion
12028	1	104	lectura
12029	1	104	escritura
12030	1	104	edicion
12031	1	105	lectura
12032	1	105	escritura
12033	1	105	edicion
12034	1	106	lectura
12035	1	106	escritura
12036	1	106	edicion
12037	1	107	lectura
12038	1	107	escritura
12039	1	107	edicion
12040	1	108	lectura
12041	1	108	escritura
12042	1	108	edicion
12043	1	109	lectura
12044	1	109	escritura
12045	1	109	edicion
12046	1	110	lectura
12047	1	110	escritura
12048	1	110	edicion
12049	1	111	lectura
12050	1	111	escritura
12051	1	111	edicion
12052	1	112	lectura
12053	1	112	escritura
12054	1	112	edicion
12055	1	113	lectura
12056	1	113	escritura
12057	1	113	edicion
12058	1	114	lectura
12059	1	114	escritura
12060	1	114	edicion
12061	1	115	lectura
12062	1	115	escritura
12063	1	115	edicion
12064	1	116	lectura
12065	1	116	escritura
12066	1	116	edicion
12067	1	117	lectura
12068	1	117	escritura
12069	1	117	edicion
12070	1	118	lectura
12071	1	118	escritura
12072	1	118	edicion
12073	1	119	lectura
12074	1	119	escritura
12075	1	119	edicion
12076	1	120	lectura
12077	1	120	escritura
12078	1	120	edicion
12079	1	121	lectura
12080	1	121	escritura
12081	1	121	edicion
12082	1	122	lectura
12083	1	122	escritura
12084	1	122	edicion
12085	1	123	lectura
12086	1	123	escritura
12087	1	123	edicion
12088	1	124	lectura
12089	1	124	escritura
12090	1	124	edicion
12091	1	125	lectura
12092	1	125	escritura
12093	1	125	edicion
12094	1	126	lectura
12095	1	126	escritura
12096	1	126	edicion
12097	1	127	lectura
12098	1	127	escritura
12099	1	127	edicion
12100	1	128	lectura
12101	1	128	escritura
12102	1	128	edicion
12103	1	129	lectura
12104	1	129	escritura
12105	1	129	edicion
12106	1	130	lectura
12107	1	130	escritura
12108	1	130	edicion
12109	1	131	lectura
12110	1	131	escritura
12111	1	131	edicion
12112	1	132	lectura
12113	1	132	escritura
12114	1	132	edicion
12115	1	133	lectura
12116	1	133	escritura
12117	1	133	edicion
12118	1	134	lectura
12119	1	134	escritura
12120	1	134	edicion
12121	1	135	lectura
12122	1	135	escritura
12123	1	135	edicion
12124	1	136	lectura
12125	1	136	escritura
12126	1	136	edicion
12127	1	137	lectura
12128	1	137	escritura
12129	1	137	edicion
12130	1	138	lectura
12131	1	138	escritura
12132	1	138	edicion
12133	1	139	lectura
12134	1	139	escritura
12135	1	139	edicion
12136	1	140	lectura
12137	1	140	escritura
12138	1	140	edicion
12139	1	141	lectura
12140	1	141	escritura
12141	1	141	edicion
12142	1	142	lectura
12143	1	142	escritura
12144	1	142	edicion
12145	1	143	lectura
12146	1	143	escritura
12147	1	143	edicion
12148	1	144	lectura
12149	1	144	escritura
12150	1	144	edicion
12151	1	145	lectura
12152	1	145	escritura
12153	1	145	edicion
12154	1	146	lectura
12155	1	146	escritura
12156	1	146	edicion
12157	1	147	lectura
12158	1	147	escritura
12159	1	147	edicion
12160	1	148	lectura
12161	1	148	escritura
12162	1	148	edicion
12163	1	149	lectura
12164	1	149	escritura
12165	1	149	edicion
12166	1	150	lectura
12167	1	150	escritura
12168	1	150	edicion
12169	1	151	lectura
12170	1	151	escritura
12171	1	151	edicion
12172	1	152	lectura
12173	1	152	escritura
12174	1	152	edicion
12175	1	153	lectura
12176	1	153	escritura
12177	1	153	edicion
12178	1	154	lectura
12179	1	154	escritura
12180	1	154	edicion
12181	1	155	lectura
12182	1	155	escritura
12183	1	155	edicion
12184	1	156	lectura
12185	1	156	escritura
12186	1	156	edicion
12187	1	157	lectura
12188	1	157	escritura
12189	1	157	edicion
12190	1	158	lectura
12191	1	158	escritura
12192	1	158	edicion
12193	1	159	lectura
12194	1	159	escritura
12195	1	159	edicion
12196	1	160	lectura
12197	1	160	escritura
12198	1	160	edicion
12199	1	161	lectura
12200	1	161	escritura
12201	1	161	edicion
12202	1	162	lectura
12203	1	162	escritura
12204	1	162	edicion
12205	1	163	lectura
12206	1	163	escritura
12207	1	163	edicion
12208	1	164	lectura
12209	1	164	escritura
12210	1	164	edicion
12211	1	165	lectura
12212	1	165	escritura
12213	1	165	edicion
12214	1	166	lectura
12215	1	166	escritura
12216	1	166	edicion
12217	1	167	lectura
12218	1	167	escritura
12219	1	167	edicion
12220	1	168	lectura
12221	1	168	escritura
12222	1	168	edicion
12223	1	169	lectura
12224	1	169	escritura
12225	1	169	edicion
12226	1	170	lectura
12227	1	170	escritura
12228	1	170	edicion
12229	1	171	lectura
12230	1	171	escritura
12231	1	171	edicion
12232	1	172	lectura
12233	1	172	escritura
12234	1	172	edicion
12235	1	173	lectura
12236	1	173	escritura
12237	1	173	edicion
12238	1	174	lectura
12239	1	174	escritura
12240	1	174	edicion
12241	1	175	lectura
12242	1	175	escritura
12243	1	175	edicion
12244	1	176	lectura
12245	1	176	escritura
12246	1	176	edicion
12247	1	177	lectura
12248	1	177	escritura
12249	1	177	edicion
12250	1	178	lectura
12251	1	178	escritura
12252	1	178	edicion
12253	1	179	lectura
12254	1	179	escritura
12255	1	179	edicion
12256	1	180	lectura
12257	1	180	escritura
12258	1	180	edicion
12259	1	181	lectura
12260	1	181	escritura
12261	1	181	edicion
15339	550	1	lectura
15340	550	1	escritura
15341	550	1	edicion
15342	550	2	lectura
15343	550	2	escritura
15344	550	2	edicion
15345	550	3	lectura
15346	550	3	escritura
15347	550	3	edicion
15348	550	4	lectura
15349	550	4	escritura
15350	550	4	edicion
15351	550	5	lectura
15352	550	5	escritura
15353	550	5	edicion
15354	550	7	lectura
15355	550	7	escritura
15356	550	7	edicion
15357	550	11	lectura
15358	550	11	escritura
15359	550	11	edicion
15360	550	12	lectura
15361	550	12	escritura
15362	550	12	edicion
15363	550	28	lectura
15364	550	28	escritura
15365	550	28	edicion
15366	550	35	lectura
15367	550	35	escritura
15368	550	35	edicion
15369	550	36	lectura
15370	550	36	escritura
15371	550	36	edicion
15372	550	37	lectura
15373	550	37	escritura
15374	550	37	edicion
15375	550	38	lectura
15376	550	38	escritura
15377	550	38	edicion
15378	550	39	lectura
15379	550	39	escritura
15380	550	39	edicion
15381	550	40	lectura
15382	550	40	escritura
15383	550	40	edicion
15384	550	41	lectura
15385	550	41	escritura
15386	550	41	edicion
15387	550	42	lectura
15388	550	42	escritura
15389	550	42	edicion
15390	550	43	lectura
15391	550	43	escritura
15392	550	43	edicion
15393	550	44	lectura
15394	550	44	escritura
15395	550	44	edicion
15396	550	45	lectura
15397	550	45	escritura
15398	550	45	edicion
15399	550	46	lectura
15400	550	46	escritura
15401	550	46	edicion
15402	550	47	lectura
15403	550	47	escritura
15404	550	47	edicion
15405	550	48	lectura
15406	550	48	escritura
15407	550	48	edicion
15408	550	49	lectura
15409	550	49	escritura
15410	550	49	edicion
15411	550	50	lectura
15412	550	50	escritura
15413	550	50	edicion
15414	550	51	lectura
15415	550	51	escritura
15416	550	51	edicion
15417	550	52	lectura
15418	550	52	escritura
15419	550	52	edicion
15420	550	53	lectura
15421	550	53	escritura
15422	550	53	edicion
15423	550	54	lectura
15424	550	54	escritura
15425	550	54	edicion
15426	550	55	lectura
15427	550	55	escritura
15428	550	55	edicion
15429	550	56	lectura
15430	550	56	escritura
15431	550	56	edicion
15432	550	57	lectura
15433	550	57	escritura
15434	550	57	edicion
15435	550	58	lectura
15436	550	58	escritura
15437	550	58	edicion
15438	550	59	lectura
15439	550	59	escritura
15440	550	59	edicion
15441	550	60	lectura
15442	550	60	escritura
15443	550	60	edicion
15444	550	61	lectura
15445	550	61	escritura
15446	550	61	edicion
15447	550	62	lectura
15448	550	62	escritura
15449	550	62	edicion
15450	550	63	lectura
15451	550	63	escritura
15452	550	63	edicion
15453	550	64	lectura
15454	550	64	escritura
15455	550	64	edicion
15456	550	65	lectura
15457	550	65	escritura
15458	550	65	edicion
15459	550	66	lectura
15460	550	66	escritura
15461	550	66	edicion
15462	550	67	lectura
15463	550	67	escritura
15464	550	67	edicion
15465	550	68	lectura
15466	550	68	escritura
15467	550	68	edicion
15468	550	69	lectura
15469	550	69	escritura
15470	550	69	edicion
15471	550	146	lectura
15472	550	146	escritura
15473	550	146	edicion
15474	550	147	lectura
15475	550	147	escritura
15476	550	147	edicion
15477	550	148	lectura
15478	550	148	escritura
15479	550	148	edicion
15480	550	149	lectura
15481	550	149	escritura
15482	550	149	edicion
15483	550	182	lectura
15484	550	182	escritura
15485	550	182	edicion
15486	550	183	lectura
15487	550	183	escritura
15488	550	183	edicion
15489	550	184	lectura
15490	550	184	escritura
15491	550	184	edicion
15492	550	185	lectura
15493	550	185	escritura
15494	550	185	edicion
15495	550	190	lectura
15496	550	190	escritura
15497	550	190	edicion
15498	550	191	lectura
15499	550	191	escritura
15500	550	191	edicion
15501	550	192	lectura
15502	550	192	escritura
15503	550	192	edicion
15504	550	193	lectura
15505	550	193	escritura
15506	550	193	edicion
15507	550	202	lectura
15508	550	202	escritura
15509	550	202	edicion
15510	550	203	lectura
15511	550	203	escritura
15512	550	203	edicion
15513	550	204	lectura
15514	550	204	escritura
15515	550	204	edicion
15516	550	205	lectura
15517	550	205	escritura
15518	550	205	edicion
15519	550	206	lectura
15520	550	206	escritura
15521	550	206	edicion
15522	550	207	lectura
15523	550	207	escritura
15524	550	207	edicion
15525	550	208	lectura
15526	550	208	escritura
15527	550	208	edicion
15528	550	209	lectura
15529	550	209	escritura
15530	550	209	edicion
15531	550	210	lectura
15532	550	210	escritura
15533	550	210	edicion
15534	550	211	lectura
15535	550	211	escritura
15536	550	211	edicion
15537	550	212	lectura
15538	550	212	escritura
15539	550	212	edicion
15540	550	213	lectura
15541	550	213	escritura
15542	550	213	edicion
15543	550	214	lectura
15544	550	214	escritura
15545	550	214	edicion
15546	550	215	lectura
15547	550	215	escritura
15548	550	215	edicion
15549	550	216	lectura
15550	550	216	escritura
15551	550	216	edicion
15552	550	217	lectura
15553	550	217	escritura
15554	550	217	edicion
15555	550	218	lectura
15556	550	218	escritura
15557	550	218	edicion
15558	550	219	lectura
15559	550	219	escritura
15560	550	219	edicion
15561	550	220	lectura
15562	550	220	escritura
15563	550	220	edicion
15564	550	221	lectura
15565	550	221	escritura
15566	550	221	edicion
15567	550	222	lectura
15568	550	222	escritura
15569	550	222	edicion
15570	550	223	lectura
15571	550	223	escritura
15572	550	223	edicion
15573	550	224	lectura
15574	550	224	escritura
15575	550	224	edicion
15576	550	225	lectura
15577	550	225	escritura
15578	550	225	edicion
15579	550	226	lectura
15580	550	226	escritura
15581	550	226	edicion
15582	550	227	lectura
15583	550	227	escritura
15584	550	227	edicion
15585	550	228	lectura
15586	550	228	escritura
15587	550	228	edicion
15588	550	229	lectura
15589	550	229	escritura
15590	550	229	edicion
15591	550	286	lectura
15592	550	286	escritura
15593	550	286	edicion
15594	550	287	lectura
15595	550	287	escritura
15596	550	287	edicion
15597	550	288	lectura
15598	550	288	escritura
15599	550	288	edicion
15600	550	289	lectura
15601	550	289	escritura
15602	550	289	edicion
15603	550	290	lectura
15604	550	290	escritura
15605	550	290	edicion
15606	550	291	lectura
15607	550	291	escritura
15608	550	291	edicion
15609	550	292	lectura
15610	550	292	escritura
15611	550	292	edicion
15612	550	293	lectura
15613	550	293	escritura
15614	550	293	edicion
15615	551	3	lectura
15616	551	3	escritura
15617	551	3	edicion
15618	551	4	lectura
15619	551	4	escritura
15620	551	4	edicion
15621	551	5	lectura
15622	551	5	escritura
15623	551	5	edicion
15624	551	50	lectura
15625	551	50	escritura
15626	551	50	edicion
15627	551	51	lectura
15628	551	51	escritura
15629	551	51	edicion
15630	551	52	lectura
15631	551	52	escritura
15632	551	52	edicion
15633	551	53	lectura
15634	551	53	escritura
15635	551	53	edicion
15636	551	54	lectura
15637	551	54	escritura
15638	551	54	edicion
15639	551	55	lectura
15640	551	55	escritura
15641	551	55	edicion
15642	551	56	lectura
15643	551	56	escritura
15644	551	56	edicion
15645	551	57	lectura
15646	551	57	escritura
15647	551	57	edicion
15648	551	66	lectura
15649	551	66	escritura
15650	551	66	edicion
15651	551	67	lectura
15652	551	67	escritura
15653	551	67	edicion
15654	551	68	lectura
15655	551	68	escritura
15656	551	68	edicion
15657	551	69	lectura
15658	551	69	escritura
15659	551	69	edicion
12262	1	182	lectura
12263	1	182	escritura
12264	1	182	edicion
12265	1	183	lectura
12266	1	183	escritura
12267	1	183	edicion
12268	1	184	lectura
12269	1	184	escritura
12270	1	184	edicion
12271	1	185	lectura
12272	1	185	escritura
12273	1	185	edicion
12274	1	186	lectura
12275	1	186	escritura
12276	1	186	edicion
12277	1	187	lectura
12278	1	187	escritura
12279	1	187	edicion
12280	1	188	lectura
12281	1	188	escritura
12282	1	188	edicion
12283	1	189	lectura
12284	1	189	escritura
12285	1	189	edicion
12286	1	190	lectura
12287	1	190	escritura
12288	1	190	edicion
12289	1	191	lectura
12290	1	191	escritura
12291	1	191	edicion
12292	1	192	lectura
12293	1	192	escritura
12294	1	192	edicion
12295	1	193	lectura
12296	1	193	escritura
12297	1	193	edicion
12298	1	194	lectura
12299	1	194	escritura
12300	1	194	edicion
12301	1	195	lectura
12302	1	195	escritura
12303	1	195	edicion
12304	1	196	lectura
12305	1	196	escritura
12306	1	196	edicion
12307	1	197	lectura
12308	1	197	escritura
12309	1	197	edicion
12310	1	198	lectura
12311	1	198	escritura
12312	1	198	edicion
12313	1	199	lectura
12314	1	199	escritura
12315	1	199	edicion
12316	1	200	lectura
12317	1	200	escritura
12318	1	200	edicion
12319	1	201	lectura
12320	1	201	escritura
12321	1	201	edicion
12322	1	202	lectura
12323	1	202	escritura
12324	1	202	edicion
12325	1	203	lectura
12326	1	203	escritura
12327	1	203	edicion
12328	1	204	lectura
12329	1	204	escritura
12330	1	204	edicion
12331	1	205	lectura
12332	1	205	escritura
12333	1	205	edicion
12334	1	206	lectura
12335	1	206	escritura
12336	1	206	edicion
12337	1	207	lectura
12338	1	207	escritura
12339	1	207	edicion
12340	1	208	lectura
12341	1	208	escritura
12342	1	208	edicion
12343	1	209	lectura
12344	1	209	escritura
12345	1	209	edicion
17029	549	237	escritura
17030	549	237	edicion
17031	549	238	lectura
17032	549	238	escritura
17033	549	238	edicion
17034	549	239	lectura
17035	549	239	escritura
17036	549	239	edicion
17037	549	240	lectura
17038	549	240	escritura
17039	549	240	edicion
17040	549	241	lectura
17041	549	241	escritura
17042	549	241	edicion
17043	549	242	lectura
17044	549	242	escritura
17045	549	242	edicion
12346	1	210	lectura
12347	1	210	escritura
12348	1	210	edicion
12349	1	211	lectura
12350	1	211	escritura
12351	1	211	edicion
12352	1	212	lectura
12353	1	212	escritura
12354	1	212	edicion
12355	1	213	lectura
12356	1	213	escritura
12357	1	213	edicion
12358	1	214	lectura
12359	1	214	escritura
12360	1	214	edicion
12361	1	215	lectura
12362	1	215	escritura
12363	1	215	edicion
12364	1	216	lectura
12365	1	216	escritura
12366	1	216	edicion
12367	1	217	lectura
12368	1	217	escritura
12369	1	217	edicion
17046	549	243	lectura
17047	549	243	escritura
17048	549	243	edicion
17049	549	244	lectura
17050	549	244	escritura
17051	549	244	edicion
17052	549	245	lectura
17053	549	245	escritura
17054	549	245	edicion
17055	549	246	lectura
17056	549	246	escritura
17057	549	246	edicion
17058	549	247	lectura
17059	549	247	escritura
17060	549	247	edicion
17061	549	248	lectura
17062	549	248	escritura
17063	549	248	edicion
17064	549	249	lectura
17065	549	249	escritura
17066	549	249	edicion
17067	549	250	lectura
17068	549	250	escritura
17069	549	250	edicion
12370	1	218	lectura
12371	1	218	escritura
12372	1	218	edicion
12373	1	219	lectura
12374	1	219	escritura
12375	1	219	edicion
12376	1	220	lectura
12377	1	220	escritura
12378	1	220	edicion
12379	1	221	lectura
12380	1	221	escritura
12381	1	221	edicion
12382	1	222	lectura
12383	1	222	escritura
12384	1	222	edicion
12385	1	223	lectura
12386	1	223	escritura
12387	1	223	edicion
12388	1	224	lectura
12389	1	224	escritura
12390	1	224	edicion
12391	1	225	lectura
12392	1	225	escritura
12393	1	225	edicion
17070	549	251	lectura
17071	549	251	escritura
17072	549	251	edicion
12394	1	226	lectura
12395	1	226	escritura
12396	1	226	edicion
12397	1	227	lectura
12398	1	227	escritura
12399	1	227	edicion
12400	1	228	lectura
12401	1	228	escritura
12402	1	228	edicion
12403	1	229	lectura
12404	1	229	escritura
12405	1	229	edicion
12406	1	230	lectura
12407	1	230	escritura
12408	1	230	edicion
12409	1	231	lectura
12410	1	231	escritura
12411	1	231	edicion
12412	1	232	lectura
12413	1	232	escritura
12414	1	232	edicion
12415	1	233	lectura
12416	1	233	escritura
12417	1	233	edicion
12418	1	234	lectura
12419	1	234	escritura
12420	1	234	edicion
12421	1	235	lectura
12422	1	235	escritura
12423	1	235	edicion
12424	1	236	lectura
12425	1	236	escritura
12426	1	236	edicion
12427	1	237	lectura
12428	1	237	escritura
12429	1	237	edicion
12430	1	238	lectura
12431	1	238	escritura
12432	1	238	edicion
12433	1	239	lectura
12434	1	239	escritura
12435	1	239	edicion
12436	1	240	lectura
12437	1	240	escritura
12438	1	240	edicion
12439	1	241	lectura
12440	1	241	escritura
12441	1	241	edicion
12442	1	242	lectura
12443	1	242	escritura
12444	1	242	edicion
12445	1	243	lectura
12446	1	243	escritura
12447	1	243	edicion
12448	1	244	lectura
12449	1	244	escritura
12450	1	244	edicion
12451	1	245	lectura
12452	1	245	escritura
12453	1	245	edicion
12454	1	246	lectura
12455	1	246	escritura
12456	1	246	edicion
12457	1	247	lectura
12458	1	247	escritura
12459	1	247	edicion
12460	1	248	lectura
12461	1	248	escritura
12462	1	248	edicion
12463	1	249	lectura
12464	1	249	escritura
12465	1	249	edicion
12466	1	250	lectura
12467	1	250	escritura
12468	1	250	edicion
12469	1	251	lectura
12470	1	251	escritura
12471	1	251	edicion
12472	1	252	lectura
12473	1	252	escritura
12474	1	252	edicion
12475	1	253	lectura
12476	1	253	escritura
12477	1	253	edicion
12478	1	254	lectura
12479	1	254	escritura
12480	1	254	edicion
12481	1	255	lectura
12482	1	255	escritura
12483	1	255	edicion
12484	1	256	lectura
12485	1	256	escritura
12486	1	256	edicion
12487	1	257	lectura
12488	1	257	escritura
12489	1	257	edicion
12490	1	258	lectura
12491	1	258	escritura
12492	1	258	edicion
12493	1	259	lectura
12494	1	259	escritura
12495	1	259	edicion
12496	1	260	lectura
12497	1	260	escritura
12498	1	260	edicion
12499	1	261	lectura
12500	1	261	escritura
12501	1	261	edicion
12502	1	262	lectura
12503	1	262	escritura
12504	1	262	edicion
12505	1	263	lectura
12506	1	263	escritura
12507	1	263	edicion
12508	1	264	lectura
12509	1	264	escritura
12510	1	264	edicion
12511	1	265	lectura
12512	1	265	escritura
12513	1	265	edicion
12514	1	266	lectura
12515	1	266	escritura
12516	1	266	edicion
12517	1	267	lectura
12518	1	267	escritura
12519	1	267	edicion
12520	1	268	lectura
12521	1	268	escritura
12522	1	268	edicion
12523	1	269	lectura
12524	1	269	escritura
12525	1	269	edicion
12526	1	270	lectura
12527	1	270	escritura
12528	1	270	edicion
12529	1	271	lectura
12530	1	271	escritura
12531	1	271	edicion
12532	1	272	lectura
12533	1	272	escritura
12534	1	272	edicion
12535	1	273	lectura
12536	1	273	escritura
12537	1	273	edicion
12538	1	274	lectura
12539	1	274	escritura
12540	1	274	edicion
12541	1	275	lectura
12542	1	275	escritura
12543	1	275	edicion
12544	1	276	lectura
12545	1	276	escritura
12546	1	276	edicion
12547	1	277	lectura
12548	1	277	escritura
12549	1	277	edicion
12550	1	278	lectura
12551	1	278	escritura
12552	1	278	edicion
12553	1	279	lectura
12554	1	279	escritura
12555	1	279	edicion
12556	1	280	lectura
12557	1	280	escritura
12558	1	280	edicion
12559	1	281	lectura
12560	1	281	escritura
12561	1	281	edicion
12562	1	282	lectura
12563	1	282	escritura
12564	1	282	edicion
12565	1	283	lectura
12566	1	283	escritura
12567	1	283	edicion
12568	1	284	lectura
12569	1	284	escritura
12570	1	284	edicion
12571	1	285	lectura
12572	1	285	escritura
12573	1	285	edicion
12574	1	286	lectura
12575	1	286	escritura
12576	1	286	edicion
12577	1	287	lectura
12578	1	287	escritura
12579	1	287	edicion
12580	1	288	lectura
12581	1	288	escritura
12582	1	288	edicion
12583	1	289	lectura
12584	1	289	escritura
12585	1	289	edicion
12586	1	290	lectura
12587	1	290	escritura
12588	1	290	edicion
12589	1	291	lectura
12590	1	291	escritura
12591	1	291	edicion
12592	1	292	lectura
12593	1	292	escritura
12594	1	292	edicion
12595	1	293	lectura
12596	1	293	escritura
12597	1	293	edicion
17073	549	252	lectura
17074	549	252	escritura
17075	549	252	edicion
17076	549	253	lectura
17077	549	253	escritura
17078	549	253	edicion
17079	549	254	lectura
17080	549	254	escritura
17081	549	254	edicion
17082	549	255	lectura
17083	549	255	escritura
17084	549	255	edicion
17085	549	256	lectura
17086	549	256	escritura
17087	549	256	edicion
17088	549	257	lectura
17089	549	257	escritura
17090	549	257	edicion
17091	549	258	lectura
17092	549	258	escritura
17093	549	258	edicion
17094	549	259	lectura
17095	549	259	escritura
17096	549	259	edicion
17097	549	260	lectura
17098	549	260	escritura
17099	549	260	edicion
17100	549	261	lectura
17101	549	261	escritura
17102	549	261	edicion
17103	549	262	lectura
17104	549	262	escritura
17105	549	262	edicion
17106	549	263	lectura
17107	549	263	escritura
17108	549	263	edicion
17109	549	264	lectura
17110	549	264	escritura
17111	549	264	edicion
17112	549	265	lectura
17113	549	265	escritura
17114	549	265	edicion
17115	549	266	lectura
17116	549	266	escritura
17117	549	266	edicion
17118	549	267	lectura
17119	549	267	escritura
17120	549	267	edicion
17121	549	268	lectura
17122	549	268	escritura
17123	549	268	edicion
17124	549	269	lectura
17125	549	269	escritura
17126	549	269	edicion
17127	549	270	lectura
17128	549	270	escritura
17129	549	270	edicion
17130	549	271	lectura
17131	549	271	escritura
17132	549	271	edicion
17133	549	272	lectura
17134	549	272	escritura
17135	549	272	edicion
17136	549	273	lectura
17137	549	273	escritura
17138	549	273	edicion
17139	549	274	lectura
17140	549	274	escritura
17141	549	274	edicion
17142	549	275	lectura
17143	549	275	escritura
17144	549	275	edicion
17145	549	276	lectura
17146	549	276	escritura
17147	549	276	edicion
17148	549	277	lectura
17149	549	277	escritura
17150	549	277	edicion
17151	549	278	lectura
17152	549	278	escritura
17153	549	278	edicion
17154	549	279	lectura
17155	549	279	escritura
17156	549	279	edicion
17157	549	280	lectura
17158	549	280	escritura
17159	549	280	edicion
17160	549	281	lectura
17161	549	281	escritura
17162	549	281	edicion
17163	549	282	lectura
17164	549	282	escritura
17165	549	282	edicion
17166	549	283	lectura
17167	549	283	escritura
17168	549	283	edicion
17169	549	284	lectura
17170	549	284	escritura
17171	549	284	edicion
17172	549	285	lectura
17173	549	285	escritura
17174	549	285	edicion
17175	549	290	lectura
17176	549	290	escritura
17177	549	290	edicion
17178	549	291	lectura
17179	549	291	escritura
17180	549	291	edicion
17181	549	292	lectura
17182	549	292	escritura
17183	549	292	edicion
17184	549	293	lectura
17185	549	293	escritura
17186	549	293	edicion
16899	549	13	lectura
16900	549	13	escritura
16901	549	13	edicion
16902	549	14	lectura
16903	549	14	escritura
16904	549	14	edicion
16905	549	15	lectura
16906	549	15	escritura
16907	549	15	edicion
16908	549	16	lectura
16909	549	16	escritura
16910	549	16	edicion
16911	549	17	lectura
16912	549	17	escritura
16913	549	17	edicion
16914	549	19	lectura
16915	549	19	escritura
16916	549	19	edicion
16917	549	20	lectura
16918	549	20	escritura
16919	549	20	edicion
16920	549	22	lectura
16921	549	22	escritura
16922	549	22	edicion
16923	549	23	lectura
16924	549	23	escritura
16925	549	23	edicion
16926	549	25	lectura
16927	549	25	escritura
16928	549	25	edicion
16929	549	26	lectura
16930	549	26	escritura
16931	549	26	edicion
16932	549	27	lectura
16933	549	27	escritura
16934	549	27	edicion
16935	549	28	lectura
16936	549	28	escritura
16937	549	28	edicion
16938	549	29	lectura
16939	549	29	escritura
16940	549	29	edicion
16941	549	30	lectura
16942	549	30	escritura
16943	549	30	edicion
16944	549	31	lectura
16945	549	31	escritura
16946	549	31	edicion
16947	549	58	lectura
16948	549	58	escritura
16949	549	58	edicion
16950	549	59	lectura
16951	549	59	escritura
16952	549	59	edicion
16953	549	60	lectura
16954	549	60	escritura
16955	549	60	edicion
16956	549	61	lectura
16957	549	61	escritura
16958	549	61	edicion
16959	549	70	lectura
16960	549	70	escritura
16961	549	70	edicion
16962	549	71	lectura
16963	549	71	escritura
16964	549	71	edicion
16965	549	72	lectura
16966	549	72	escritura
16967	549	72	edicion
16968	549	73	lectura
16969	549	73	escritura
16970	549	73	edicion
16971	549	74	lectura
16972	549	74	escritura
16973	549	74	edicion
16974	549	75	lectura
16975	549	75	escritura
16976	549	75	edicion
16977	549	76	lectura
16978	549	76	escritura
16979	549	76	edicion
16980	549	77	lectura
16981	549	77	escritura
16982	549	77	edicion
16983	549	82	lectura
16984	549	82	escritura
16985	549	82	edicion
16986	549	83	lectura
16987	549	83	escritura
16988	549	83	edicion
16989	549	84	lectura
16990	549	84	escritura
16991	549	84	edicion
16992	549	85	lectura
16993	549	85	escritura
16994	549	85	edicion
16995	549	190	lectura
16996	549	190	escritura
16997	549	190	edicion
16998	549	191	lectura
16999	549	191	escritura
17000	549	191	edicion
17001	549	192	lectura
17002	549	192	escritura
17003	549	192	edicion
17004	549	193	lectura
17005	549	193	escritura
17006	549	193	edicion
17007	549	230	lectura
17008	549	230	escritura
17009	549	230	edicion
17010	549	231	lectura
17011	549	231	escritura
17012	549	231	edicion
17013	549	232	lectura
17014	549	232	escritura
17015	549	232	edicion
17016	549	233	escritura
17017	549	233	edicion
17018	549	233	lectura
17019	549	234	lectura
17020	549	234	escritura
17021	549	234	edicion
17022	549	235	lectura
17023	549	235	escritura
17024	549	235	edicion
17025	549	236	lectura
17026	549	236	escritura
17027	549	236	edicion
17028	549	237	lectura
\.


--
-- Data for Name: sis_datos_facturacion; Type: TABLE DATA; Schema: dbo; Owner: aitrolsystem
--

COPY dbo.sis_datos_facturacion (id, nombre_comercial, ruc, direccion_matriz, contribuyente_especial, obligado_contabilidad, razon_social) FROM stdin;
1	CHILAN PINCAY ANTHONY LIMBER	1316262193001	MUCHO LOTE ETAPA IV	X1	SI	CHILAN PINCAY ANTHONY LIMBER
\.


--
-- Data for Name: sis_empresa; Type: TABLE DATA; Schema: dbo; Owner: aitrolsystem
--

COPY dbo.sis_empresa (id_empresa, ruc, razon_social, nombre_comercial, direccion_matriz, contribuyente_especial, obligado_contabilidad, favicon, logo, firma, clave_firma) FROM stdin;
1	1316262193001	AMDSADAS	DSADAS  	DSAD	DSADSA	t	\N	\N	/uploads/empresa_1/boost_1_88_0.7z	12345678
\.


--
-- Data for Name: sis_punto_emision; Type: TABLE DATA; Schema: dbo; Owner: aitrolsystem
--

COPY dbo.sis_punto_emision (id_punto, id_sucursal, codigo, descripcion) FROM stdin;
1	2	1	1
\.


--
-- Data for Name: sis_sucursal; Type: TABLE DATA; Schema: dbo; Owner: aitrolsystem
--

COPY dbo.sis_sucursal (id_sucursal, id_empresa, codigo, direccion, telefono) FROM stdin;
544	1	02	ZAMORA	046008680
545	1	03	LAGO AGRIO	046008680
546	1	04	TENA	046008680
547	1	05	PAQUISHA	046008680
2	1	01	GUAYAQUIL	046008680
\.


--
-- Data for Name: sysdiagrams; Type: TABLE DATA; Schema: dbo; Owner: aitrolsystem
--

COPY dbo.sysdiagrams (name, principal_id, diagram_id, version, definition) FROM stdin;
\.


--
-- Data for Name: usuarios; Type: TABLE DATA; Schema: dbo; Owner: aitrolsystem
--

COPY dbo.usuarios (id, nombre, apellido, fecha_nacimiento, telefono, nombre_usuario, password, created_at, updated_at, direccion, foto, email, token, refresh_token, reset_token) FROM stdin;
16	EDISON GABRIEL 	SIGUENZA BERMELLO 	2025-02-27	0988533735	esiguenza	$2b$12$wY.IPgCirMMPkUqFd/IwveWNygQ8P/C9YA4/1bqoyB6NkOIpsAl5y	2025-04-10 14:08:11.01-05	\N	\N	9a6ae0230cbcdf63.png	\N	\N	\N	\N
17	nicolas 	arellano	2025-04-05	0967084747	prueba1	$2b$12$jB4jk.TUby/kuKFtzhO32ukjWmlxoNmst4iVBIRr9h7KInZtLGLLO	2025-04-10 14:16:04.247-05	\N	\N	31ece899f58217ba.png	\N	\N	\N	\N
19	Carlos	Fuentes	2025-04-21	098111111	cfuentes	$2b$12$QNnf9WCelFJKsbCwK0uA5u.Zgz8xGcv0gN.FHJIwzAdi0XeNv4ir6	2025-04-21 08:53:15.38-05	\N	\N	c9d3069ad37f8790.png	\N	\N	\N	\N
20	Carlos Eduardo	Andrade Silvestre	1985-08-13	+593 96 149 7476	candrade	$2b$12$yl1Msa05VJqajjaDoI8zk.ywluwvVcii44q4WdeD7H6UZ2QXVIz3e	2025-04-26 06:03:00.503-05	\N	\N	3d70a0b347c8ab6e.png	\N	0a8a4904-6337-4b69-962c-2cd2380bda86	\N	\N
21	Luis Alberto	 Fernandez Herrera	2081-11-27	+593 99 181 4513	lfernandez	$2b$12$iuKsRKiv4Md.Rwar457Uq.fF3hmOuP7cPz1oBgnrtezhQyqSlZ/xq	2025-04-26 06:21:44.07-05	\N	\N	fedb211e5581a8c9.png	\N	c6db4c96-8071-4576-b194-8ceab9124736	\N	\N
22	Dionicio Bienvenido 	Valencia Chavez	0076-08-05	+593 98 525 7846	dvalencia	$2b$12$n998abY9foLHqPWhgkdoDu7PMQk6hHvx5eURxJc8u.hHXt.BUXQmq	2025-04-26 06:24:57.137-05	\N	\N	ca81278aaea2ff9d.png	\N	8f56f9f5-6c6b-4db7-abbf-d98037676df5	\N	\N
23	Ruben Agustin 	Pozo Villacis	1976-10-16	+593 98 923 0433	rpozo	$2b$12$nKg3OScBOwxEn5HBnFmvfOvJfn2nXFHim1/jOoTdBllMDK1LrX2Zq	2025-04-26 06:31:26.657-05	\N	\N	d1678a8d33f81584.png	\N	3ae19c8c-2c3e-42c6-9868-d875bfd861c9	\N	\N
24	Aquiles Gustavo	Navarrete Moran	1990-10-03	+593 98 821 2520	anavarrete	$2b$12$9C//h5z1Xuqt4wPw5y9WC.GzYKxff7ciGMYnNOtq/dasqCIzmoYcO	2025-04-26 06:34:43.167-05	\N	\N	779bb435039aed2d.png	\N	\N	\N	\N
25	Jackson Enrrique 	Caceres Valencia	1989-09-23	+593 99 159 4500	jcaceres	$2b$12$HqLfVFL3WiZ7mj9b3vhGbu0mA/mZsc5Qrqm.wlozFF5bwOetOWGLG	2025-04-26 06:38:14.98-05	\N	\N	b73cf3822e75f20c.png	\N	\N	\N	\N
26	Cesar Eduardo	Quezada Vera	1987-02-28	+593 99 707 6912	cquezada	$2b$12$pNjPmJw5uStl5It5JRnbluX6XB3YZDUSBfcGPhB0YhxDhyob.DElS	2025-04-27 03:30:19.507-05	\N	\N	3350ac571806f3fa.png	\N	\N	\N	\N
27	Anthony Estheben	Veliz Vera	2000-06-21	+593 98 350 9125	aveliz	$2b$12$LKeVJUz6Ijr.7O21O0Q6X.WDeMLvWUKj84YwveD62sSUMikx4qsVi	2025-04-27 03:35:03.427-05	\N	\N	f4effcebea2a31d3.png	\N	f7fced25-940c-4954-8915-833b621502a6	\N	\N
29	PETER JOSE	ASIQUIMBAY FLORES	1977-01-11	0987583289	pasiquimbay	$2b$12$RTdEdBDYTR5knCk.7vZ0yOvtW9IdmRQVMqHzmC7CpLHNLzAIhdjhW	2025-05-13 19:36:35.097-05	\N	\N	2ea17e40327916da.png	\N	\N	\N	\N
30	PETER JOSE	ASIQUIMBAY FLORES	1977-01-11	0987583289	pasiquimbay	$2b$12$ioVnAS9jy09m8XbX1eU/.e.hrqC/ARR9VvfoEDI7QABfD0Q4HefqC	2025-05-13 19:36:35.237-05	\N	\N	c28a5f6a23b231fe.png	\N	\N	\N	\N
31	DANIEL ANDRES	BARRIONUEVO CHEVEZ	0001-01-01	0981779867	dbarrionuevo	$2b$12$0jiUOzwRX7EunDKLUWioz.nBPd.SQHMofjZb.w.hSQZrkJ2ko8lN6	2025-05-14 09:50:35.74-05	\N	\N	089e29cc939d9b29.png	\N	\N	\N	\N
32	RAMON ALBERTO	SILVESTRE SUAREZ	0001-01-01	0986432857	rsilvestre	$2b$12$Hi.i0pcf5GwlT.lDsla5ye7eMjBMq5yFj/yFX4fTzfUHt.npiIkgq	2025-05-14 10:02:35.86-05	\N	\N	9ee7dbe61974d614.png	\N	\N	\N	\N
33	WILSON RAMIRO	PARRA VILLARROEL	0001-01-01	0992028970	wparra	$2b$12$98thz47zEr1GMZ8HWNvsNOqDQO0u/om6Fxx7oGbam0s1Bn4GH.V7C	2025-05-14 10:05:35.23-05	\N	\N	d83225f3ddf54ff8.png	\N	\N	\N	\N
34	MARCO GEOVANI	GERMAN PILTASIG	0001-01-01	0994699911	mgerman	$2b$12$/Uz6LBtZqPYPt3.G96uEe./.Q/PbqC4QL67aqxq8yLi0A14Q.IiQy	2025-05-14 10:10:38.75-05	\N	\N	fe9d61612ea7a009.png	\N	\N	\N	\N
35	CRISTIAN DAVID	LUJE AMAGUAÑA	0001-01-01	0967059471	cluje	$2b$12$kAqjIchD7Ebgq5ozHQCtg.4TIJFBVGJnzpWPyVPL1.Ir2I.N0sgFC	2025-05-14 10:12:12.163-05	\N	\N	10d08f48bfa17047.png	\N	\N	\N	\N
36	ITER ALEXANDER	DELGADO ZAMBRANO	0001-01-01	0969602081	idelgado	$2b$12$H5x6p5s7JjDMhO7JYqPGEOYWemQp6SWUznExVPYZIa4b1UO9QXbDG	2025-05-27 09:17:28.687-05	\N	\N	8c558011f2ac1cc6.png	\N	\N	\N	\N
37	RONALD ARMANDO	MORA GARCIA	0001-01-01	0993668663	rmora	$2b$12$GhLp8G6WeHHDMdRzONER4.v/CAFtb8jua8YCFywPLHTJP1dWrZKDC	2025-05-27 09:18:38.927-05	\N	\N	be872b715f7e1427.png	\N	\N	\N	\N
38	DANNY JAVIER	LEON GARCIA	0001-01-01	0985642659	dleon	$2b$12$1bXMmwo.t6OnY1F5iT9hvOjKfBb.KXXj7mHB2U3oHdnkYYA5K2Hhm	2025-05-27 09:23:20.937-05	\N	\N	998a3a80607a6bb8.png	\N	c8ad571b-efc6-462f-a730-b412b30708ab	\N	\N
39	LUIS ENRIQUE 	LISINTUÑA CRUZ 	0001-01-01	0997700186	llisintuña	$2b$12$ekluUhbtRj3JKEDc8awIteRZyYzTcayfYWoiJQM94dc0SfISLAHWm	2025-05-27 09:34:12.863-05	\N	\N	c2f29db345a71454.png	\N	b8cd818f-b803-416a-bd7e-dc5139b864d3	\N	\N
40	CARLOS ANDRES	RODRIGUEZ TORRES	0001-01-01	0939294158	crodriguez	$2b$12$n7WKxxE.R3bVFUsgY/LnS.BzQyIc1K.JS93Yt2BrWVnm/EeP.ugBe	2025-05-27 09:36:17.93-05	\N	\N	c88e7471ec8d5447.png	\N	\N	\N	\N
10036	Daligton Antonio	Sesme	2025-06-08	0985874968	asesme	$2b$12$u7zNwOiES97nPRhLePEea.iPNR6ko5etkzBF6K0J2IufThFBVJijy	2025-06-08 08:09:57.37-05	\N	\N	ea1544359795a2eb.png	\N	\N	\N	\N
10037	Yerson 	Panezo Cheme	2025-06-08	0998585747	ypanezo	$2b$12$id/MLhOs.oz9OppGIThIAejryN9J7eRyOaPy977Z40LFbqPYXob.W	2025-06-08 08:37:11.5-05	\N	\N	fd68d9e2ef8dd122.png	\N	cd1ea688-4a03-4017-96e1-13309ef167f7	\N	\N
10038	Henry 	Herrera Jacome	2025-06-09	0967059471	hherrera	$2b$12$H7ahd8i72vcF2g5CzUOGHOlvorfgFOmo6XUkleYHP1/bHbQrHild2	2025-06-09 15:07:34.547-05	\N	\N	df35bf0441b7ac1a.png	\N	6345fa10-d555-47fe-8730-23f68c64ce50	\N	\N
10039	achilan	achilan	1997-02-01	+1234567890	achilan@123	$2b$12$KY0xLbvslSTniUfRWzuw6Of7gcw7aptVifCkaYD5t8QaXeB9nWqT.	2025-06-21 03:33:02.51-05	\N	\N	e79e7fda2a295905.png	\N	\N	\N	\N
10041	Margarita	Murillo	2025-09-07	096384469	mmurillo	$2b$12$CIblVoRDkT.Rgagy/Z6KPOJaQCElJqkBJ89gN.vKI./PVlXMDRR6G	2025-09-07 14:53:58.25-05	\N	\N	\N	mafer_murillo_12@hotmail.com	\N	\N	\N
1	user	user	1997-01-01	0963834469	user@mail.com	$2b$12$hNOfZ5CZRQFwJlBzAMvDxuuUUkgVboVnXgWMs0h30.NcZC0NkrdC6	2025-10-10 04:54:13.025069-05	2025-10-10 04:54:13.025075-05	\N	\N	user@mail.com	\N	\N	\N
18	PRUEBA	UNO 	2008-12-30	0987896321	PRUEBA2	$2b$12$1bLXX1QvqjDWBRLKv2J2nuUPLWv1cZejvqEbFqCn37nYRj.zGtOMK	2025-04-10 14:32:06.18-05	2025-10-12 14:49:49.452641-05	\N	6f2589e6676a4173.png	mail@mail.com	\N	\N	\N
28	m	flores	2025-05-13	+1234567890	mflores	$2b$12$oRRPlR6LotRyaE2RIZRl9uOf87TyMaVP5jDfRNtJKCnjczwsO8sKK	2025-05-13 13:11:04.29-05	2025-11-28 19:24:32.20178-05	\N	434cbfed00456a2e.png	mflores@mail.com	\N	23c75ffa-471b-4178-8d77-803b35bd7124	\N
10	Henrry Enmanuel	San Lucas Alvarado	1997-01-22	+1234567890	hsanlucas	$2b$12$yPS.GJWMLmiS2hvCdtY3nO06mqpkrpCwStypRMW9kjs56rgDdDIlW	2025-03-24 08:39:02.533-05	2025-10-13 16:39:13.019722-05	\N	2bfc4301e181cf50.png	hsan@hotmail.es	5daa1651-b49c-4c6c-913f-c48641375475	f9f84637-f4a7-4bbf-8a6a-50096177d0b2	\N
14	Anthony	Chilan	2025-10-15	0963834469	achilan@	$2b$12$//gm1ULzdF9FW6s5zM3ZBOjeMrVfxWPcbQ9Czo354R4lOZ1d45YH6	2025-10-27 03:02:35.811133-05	2025-10-27 03:03:22.566778-05	\N	\N	anthony.chilanp@gmail.com	\N	93d862ab-a845-4dab-b07d-98b704bcf1d4	\N
7	Edison Javier	Tenorio Cando 	2025-04-01	0987178872	etenorio	$2b$12$jyKD3FiLEi7QehuuIBaWceL7un8Iwuw0eNNATlOeGvjfiVXcMIoa.	2025-04-10 13:41:58.607-05	\N	\N	ff726ccd4f1eaa28.png	\N	\N	\N	\N
11	USER	user	2025-10-09	0963834469	user1@mail.com	$2b$12$uffaSOFGgfWzlTQ39ohQv.mVr3mgYRwnTcK2RzjP9lIHH1V6SURPi	2025-10-10 04:56:52.332046-05	2025-10-10 04:56:52.332054-05	\N	\N	user1@mail.com	\N	\N	\N
12	Anthony	Chilan	1997-02-01	0963834469	achilan123	$2b$12$xTR7DxZdjqx3sfZhKrke5OwuEUqH5E0/xq2Qpa.vDULb9RRHoVQIu	2025-10-10 05:05:24.18506-05	2025-10-10 05:05:24.185067-05	\N	fd9e62962c57ce8d.png	achilan123@mail.com	\N	\N	\N
13	achilan	achilan	2025-10-10	0963834469	achilan12345	$2b$12$kVbt.NevGToqPFXC1wpzp.fnGsjBQ.zyuRdSjzQUHe8mcRuQ8I2nu	2025-10-10 05:15:43.009603-05	2025-10-10 05:15:43.009608-05	\N	\N	achilan@mdconsgroup.com	\N	\N	\N
15	Recursos Humanos	Sistemas	2025-11-11	0963834469	demo_rrhh	$2b$12$8YXR.Glbla6FBkb0tZ9wDe9ak8CfE5FCgcIybG3DpCjVqG4wiAzEm	2025-11-11 18:05:45.963647-05	2025-11-15 04:54:00.617511-05	\N	a08029dafa458582.png	demorrhh@mail.com	\N	e995aee0-0fc8-4b29-b1ae-1a19bfb1dab2	\N
8	empleado	empleadodemo	2025-10-08	0963834469	demoempleado	$2b$12$syTvs463RWoVLYm06pbDoOoGLlFbmwTCmdLa/XipqmhCRbF.Vl1Xi	2025-10-10 05:47:27.039129-05	2025-11-11 18:38:19.532457-05	\N	1e04d8180eb959d9.png	acx@mail.com	\N	24df4940-9341-4a20-8a86-8a9716650f51	\N
10040	Administrador	Sistemas	2025-08-04	4444	adminrole	$2b$12$WRLcBqZK0ZLyUazL1e9JKOYjs96xEwm/cmVlhHCaROgTdmYcH8gRK	2025-08-31 15:37:00.93-05	2025-12-06 17:51:58.145557-05	\N	969881e321015d22.png	admin1@mail.com	\N	7f187d1c-0074-4eb7-b87b-d8085a0e3560	\N
6	Nicolas	Arellano	1997-06-24	+1234567890	narellano	$2b$12$2XQJ.uu1aiaAcZToBWK8U.v7jzISD6xugIrqpcdcUEtHaDUcpAs.K	2025-03-24 09:34:05.373-05	2025-11-28 19:28:32.724025-05	\N	f4e44e91e50f1251.png	narellano@mail.com	\N	52a806a9-97cf-44b9-a338-9616ec04fb94	\N
9	anthony	chilan	1997-05-04	0931312312312	achilan	$2b$12$nTHN5AiOtsSCBh9WSxELRuU2XTj/z1w3Uulk4qqZ5QICNHqo0bKom	2025-02-13 15:18:38.993-05	2025-12-02 04:34:02.352155-05	\N	bf60e22f96ab823d.png	anthony.chilanp@gmail.com	c6db4c96-8071-4576-b194-8ceab9124736	9210f5e3-8849-48db-9ed0-311270feadd8	\N
\.


--
-- Data for Name: usuarios_roles; Type: TABLE DATA; Schema: dbo; Owner: aitrolsystem
--

COPY dbo.usuarios_roles (id, user_id, rol_id) FROM stdin;
1	3	1
2	4	1
3	5	2
4	16	2
5	17	2
6	18	2
7	19	1
8	20	2
9	21	2
10	22	2
11	23	2
12	24	2
13	25	2
14	26	2
15	27	2
17	29	2
18	30	2
19	31	3
20	32	3
21	33	3
22	34	3
23	35	3
24	36	3
25	37	3
26	38	3
27	39	3
28	40	3
10024	10036	3
10025	10037	3
10026	10038	3
10027	10039	1
10028	2	1
10029	10040	1
10030	10041	1
1	2	1
2	3	1
3	4	1
4	5	1
5	10	1
6	14	549
7	15	550
8	8	551
16	28	549
9	6	1
\.


--
-- Data for Name: usuarios_sucursales; Type: TABLE DATA; Schema: dbo; Owner: aitrolsystem
--

COPY dbo.usuarios_sucursales (id, user_id, id_sucursal, is_default) FROM stdin;
4	23	2	t
5	19	2	f
6	20	2	f
7	10040	2	f
8	10040	544	t
\.


--
-- Data for Name: vehiculos; Type: TABLE DATA; Schema: dbo; Owner: aitrolsystem
--

COPY dbo.vehiculos (id, nombre, tipo_id, kilometraje_inicial, capacidad, estado, created_at, updated_at, foto, conductor_id, aviso_mantenimiento) FROM stdin;
1	GTJ9145	\N	\N	1322131	1	\N	\N	a0475423b7f2a1f7.png	\N	\N
2	dsadsa	\N	\N	333	1	\N	\N	65840b9bd0d4900b.png	\N	\N
3	Julio Agustín	1	444	30	1	\N	\N	a8a97330a8d052ca.png	22	4444
\.


--
-- Data for Name: vehiculos_kilometraje; Type: TABLE DATA; Schema: dbo; Owner: aitrolsystem
--

COPY dbo.vehiculos_kilometraje (id, kilometraje, vehiculo_id, comentarios, fecha, created_at) FROM stdin;
\.


--
-- Data for Name: vehiculos_mantenimiento; Type: TABLE DATA; Schema: dbo; Owner: aitrolsystem
--

COPY dbo.vehiculos_mantenimiento (id, vehiculo_id, fecha, kilometraje, detalles, fecha_tentativa, estado) FROM stdin;
\.


--
-- Data for Name: vehiculos_tipos; Type: TABLE DATA; Schema: dbo; Owner: aitrolsystem
--

COPY dbo.vehiculos_tipos (id, nombre, estado, created_at, updated_at) FROM stdin;
1	CAMION	1	\N	\N
\.


--
-- Data for Name: adjuntos; Type: TABLE DATA; Schema: salud; Owner: aitrolsystem
--

COPY salud.adjuntos (id, historia_id, tipo_archivo, nombre_archivo, url_archivo, descripcion, cargado_por, created_at) FROM stdin;
\.


--
-- Data for Name: afiliaciones; Type: TABLE DATA; Schema: salud; Owner: aitrolsystem
--

COPY salud.afiliaciones (id, persona_id, aseguradora_id, numero_afiliacion, tipo_afiliacion, fecha_inicio, fecha_fin, vigente, contrato_info, sis_sucursal_id, created_at) FROM stdin;
\.


--
-- Data for Name: agendas; Type: TABLE DATA; Schema: salud; Owner: aitrolsystem
--

COPY salud.agendas (id, personal_id, unidad_id, sis_sucursal_id, fecha, hora_inicio, hora_fin, intervalo_minutos, tipo_consulta, creado_por, estado) FROM stdin;
\.


--
-- Data for Name: anestesia_registros; Type: TABLE DATA; Schema: salud; Owner: aitrolsystem
--

COPY salud.anestesia_registros (id, programacion_id, registro, created_at) FROM stdin;
\.


--
-- Data for Name: aseguradoras; Type: TABLE DATA; Schema: salud; Owner: aitrolsystem
--

COPY salud.aseguradoras (id, nombre, tipo, codigo, direccion, telefono, email, created_at) FROM stdin;
\.


--
-- Data for Name: camas; Type: TABLE DATA; Schema: salud; Owner: aitrolsystem
--

COPY salud.camas (id, sala_id, codigo, tipo_cama, estado, created_at) FROM stdin;
\.


--
-- Data for Name: citas; Type: TABLE DATA; Schema: salud; Owner: aitrolsystem
--

COPY salud.citas (id, paciente_id, personal_id, agenda_id, sis_sucursal_id, fecha_hora, duracion_minutos, motivo, tipo, estado, sala_id, cama_id, referencia_externa, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: consulta_diagnosticos; Type: TABLE DATA; Schema: salud; Owner: aitrolsystem
--

COPY salud.consulta_diagnosticos (id, consulta_id, diagnostico_id, tipo_diagnostico, observaciones) FROM stdin;
\.


--
-- Data for Name: consulta_medica; Type: TABLE DATA; Schema: salud; Owner: aitrolsystem
--

COPY salud.consulta_medica (id, historia_id, fecha_hora, motivo_consulta, enfermedad_actual, revision_sistemas, registrado_por, created_at) FROM stdin;
\.


--
-- Data for Name: contactos_emergencia; Type: TABLE DATA; Schema: salud; Owner: aitrolsystem
--

COPY salud.contactos_emergencia (id, persona_id, nombre, parentesco, telefono, direccion, observaciones, preferente, created_at) FROM stdin;
\.


--
-- Data for Name: diagnosticos_cat; Type: TABLE DATA; Schema: salud; Owner: aitrolsystem
--

COPY salud.diagnosticos_cat (id, codigo_cie10, descripcion) FROM stdin;
\.


--
-- Data for Name: dispensaciones; Type: TABLE DATA; Schema: salud; Owner: aitrolsystem
--

COPY salud.dispensaciones (id, receta_id, paciente_id, personal_id, fecha_dispensacion, almacen_id, sis_sucursal_id, estado, observaciones, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: dispensaciones_detalle; Type: TABLE DATA; Schema: salud; Owner: aitrolsystem
--

COPY salud.dispensaciones_detalle (id, dispensacion_id, producto_id, lote, cantidad, precio_unitario, id_movimiento, created_at) FROM stdin;
\.


--
-- Data for Name: emergencias; Type: TABLE DATA; Schema: salud; Owner: aitrolsystem
--

COPY salud.emergencias (id, encuentro_id, paciente_id, triage_id, hora_ingreso, area_ingreso, responsable, diagnostico_ingreso, procedencia, destino, alta_hora, observaciones) FROM stdin;
\.


--
-- Data for Name: encuentros; Type: TABLE DATA; Schema: salud; Owner: aitrolsystem
--

COPY salud.encuentros (id, paciente_id, personal_id, tipo_encuentro, fecha_hora, motivo_consulta, resumen, diagnostico_principal, diagnosticos_secundarios, plan_tratamiento, evolucion, referencias, creado_por, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: epicrisis; Type: TABLE DATA; Schema: salud; Owner: aitrolsystem
--

COPY salud.epicrisis (id, historia_id, fecha_egreso, motivo_egreso, resumen_clinico, diagnostico_final, tratamiento_final, recomendaciones, firmado_por, created_at) FROM stdin;
\.


--
-- Data for Name: evoluciones; Type: TABLE DATA; Schema: salud; Owner: aitrolsystem
--

COPY salud.evoluciones (id, historia_id, fecha_hora, descripcion, personal_id, tipo, created_at) FROM stdin;
\.


--
-- Data for Name: examen_fisico; Type: TABLE DATA; Schema: salud; Owner: aitrolsystem
--

COPY salud.examen_fisico (id, consulta_id, cabeza_cuello, torax, abdomen, extremidades, neurologico, genital_urinario, otros_hallazgos, impresion_general, created_at) FROM stdin;
\.


--
-- Data for Name: examenes; Type: TABLE DATA; Schema: salud; Owner: aitrolsystem
--

COPY salud.examenes (id, nombre, codigo, categoria, metodo, unidad_medida, valor_referencia, duracion_estimado_min, created_at) FROM stdin;
\.


--
-- Data for Name: facturas_clinicas; Type: TABLE DATA; Schema: salud; Owner: aitrolsystem
--

COPY salud.facturas_clinicas (id, paciente_id, ingreso_id, fecha_factura, subtotal, iva, total, estado, id_venta_inventario, sis_sucursal_id, observaciones, created_at) FROM stdin;
\.


--
-- Data for Name: facturas_clinicas_detalle; Type: TABLE DATA; Schema: salud; Owner: aitrolsystem
--

COPY salud.facturas_clinicas_detalle (id, factura_id, descripcion, codigo_producto, cantidad, precio_unitario, total) FROM stdin;
\.


--
-- Data for Name: historia_antecedentes; Type: TABLE DATA; Schema: salud; Owner: aitrolsystem
--

COPY salud.historia_antecedentes (id, historia_id, antecedentes_personales, antecedentes_familiares, alergias, habitos_toxicos, medicamentos_habituales, cirugias_previas, enfermedades_cronicas, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: historia_auditoria; Type: TABLE DATA; Schema: salud; Owner: aitrolsystem
--

COPY salud.historia_auditoria (id, historia_id, usuario_id, accion, tabla_afectada, registro_id, fecha_hora, ip_origen, descripcion) FROM stdin;
\.


--
-- Data for Name: historia_clinica; Type: TABLE DATA; Schema: salud; Owner: aitrolsystem
--

COPY salud.historia_clinica (id, paciente_id, numero_historia, fecha_apertura, tipo_historia, estado, responsable_id, creado_por, observaciones, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: ingresos; Type: TABLE DATA; Schema: salud; Owner: aitrolsystem
--

COPY salud.ingresos (id, paciente_id, fecha_ingreso, fecha_alta, motivo_ingreso, unidad_ingreso_id, sala_ingreso_id, cama_id, estado, medico_tratante, plan_tratamiento, creador, updated_at) FROM stdin;
\.


--
-- Data for Name: interconsultas; Type: TABLE DATA; Schema: salud; Owner: aitrolsystem
--

COPY salud.interconsultas (id, historia_id, fecha_solicitud, especialidad_destino, motivo, respuesta, estado, creado_por, created_at) FROM stdin;
\.


--
-- Data for Name: mar; Type: TABLE DATA; Schema: salud; Owner: aitrolsystem
--

COPY salud.mar (id, ingreso_id, paciente_id, fecha_registro, medicamento_id, producto_id, dosis, via, administrado_por, observaciones, evento) FROM stdin;
\.


--
-- Data for Name: medicamentos; Type: TABLE DATA; Schema: salud; Owner: aitrolsystem
--

COPY salud.medicamentos (id, producto_id, principio_activo, concentracion, presentacion, via_administracion, requiere_receta, controlado, created_at) FROM stdin;
\.


--
-- Data for Name: muestras; Type: TABLE DATA; Schema: salud; Owner: aitrolsystem
--

COPY salud.muestras (id, orden_id, examen_id, codigo_barra, fecha_recoleccion, recoleccion_por, tipo_muestra, estado, ubicacion_actual, temperatura_transporte, observaciones, created_at) FROM stdin;
\.


--
-- Data for Name: ordenes_imagenologia; Type: TABLE DATA; Schema: salud; Owner: aitrolsystem
--

COPY salud.ordenes_imagenologia (id, paciente_id, pedido_por, estudio, prioridad, fecha_pedido, estado, observaciones, sis_sucursal_id) FROM stdin;
\.


--
-- Data for Name: ordenes_laboratorio; Type: TABLE DATA; Schema: salud; Owner: aitrolsystem
--

COPY salud.ordenes_laboratorio (id, paciente_id, pedido_por, fecha_pedido, tipo_solicitud, estado, prioridad, observaciones, orden_padre, sis_sucursal_id, created_at) FROM stdin;
\.


--
-- Data for Name: pacientes; Type: TABLE DATA; Schema: salud; Owner: aitrolsystem
--

COPY salud.pacientes (id, persona_id, codigo_paciente, tipo_sangre, alergias, antecedentes, nombre_contacto_legal, telefono_contacto_legal, cliente_id, sis_sucursal_id, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: personal; Type: TABLE DATA; Schema: salud; Owner: aitrolsystem
--

COPY salud.personal (id, persona_id, codigo_personal, sis_sucursal_id, tipo_personal, especialidad, registro_senescyt, registro_msp, licencia_activa, disponibilidad, correo_institucional, telefono_institucional, usuario_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: personas; Type: TABLE DATA; Schema: salud; Owner: aitrolsystem
--

COPY salud.personas (id, uuid, tipo_identificacion, identificacion, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, fecha_nacimiento, sexo, lugar_nacimiento, nacionalidad, estado_civil, direccion, telefono_local, telefono_movil, email, foto_url, discapacidad, grupo_etnico, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: pisos; Type: TABLE DATA; Schema: salud; Owner: aitrolsystem
--

COPY salud.pisos (id, sede_id, nombre, orden) FROM stdin;
\.


--
-- Data for Name: procedimientos; Type: TABLE DATA; Schema: salud; Owner: aitrolsystem
--

COPY salud.procedimientos (id, nombre, codigo, descripcion, duracion_min, complejidad) FROM stdin;
\.


--
-- Data for Name: procedimientos_insumos; Type: TABLE DATA; Schema: salud; Owner: aitrolsystem
--

COPY salud.procedimientos_insumos (id, procedimiento_realizado_id, producto_id, lote, cantidad, unidad_medida, creado_por, created_at) FROM stdin;
\.


--
-- Data for Name: procedimientos_realizados; Type: TABLE DATA; Schema: salud; Owner: aitrolsystem
--

COPY salud.procedimientos_realizados (id, ingreso_id, paciente_id, personal_id, procedimiento_id, fecha_hora, duracion_min, anestesia_utilizada, sala_id, quirofano_id, estado, observaciones, costo, created_at) FROM stdin;
\.


--
-- Data for Name: programacion_quirofano; Type: TABLE DATA; Schema: salud; Owner: aitrolsystem
--

COPY salud.programacion_quirofano (id, procedimiento_realizado_id, paciente_id, medico_responsable, anestesista_id, quirofano_id, fecha_inicio, fecha_fin, tipo_anestesia, tiempo_estimado_min, estado, observaciones) FROM stdin;
\.


--
-- Data for Name: quirofanos; Type: TABLE DATA; Schema: salud; Owner: aitrolsystem
--

COPY salud.quirofanos (id, unidad_id, nombre, codigo, estado) FROM stdin;
\.


--
-- Data for Name: recetas; Type: TABLE DATA; Schema: salud; Owner: aitrolsystem
--

COPY salud.recetas (id, paciente_id, prescriptor_id, fecha_prescripcion, diagnostico_prescripcion, motivo, autorizacion_seguro, estado, sis_sucursal_id, created_at) FROM stdin;
\.


--
-- Data for Name: recetas_detalle; Type: TABLE DATA; Schema: salud; Owner: aitrolsystem
--

COPY salud.recetas_detalle (id, receta_id, producto_id, medicamento_id, dosis, via, frecuencia, duracion, cantidad, indicaciones, creado_por, created_at) FROM stdin;
\.


--
-- Data for Name: resultados_imagenologia; Type: TABLE DATA; Schema: salud; Owner: aitrolsystem
--

COPY salud.resultados_imagenologia (id, orden_id, tecnico_responsable, informe, url_imagenes, fecha_resultado) FROM stdin;
\.


--
-- Data for Name: resultados_laboratorio; Type: TABLE DATA; Schema: salud; Owner: aitrolsystem
--

COPY salud.resultados_laboratorio (id, muestra_id, orden_id, examen_id, valor, unidad, interpretacion, referencia_valores, laboratorio_responsable, fecha_resultado, archivo_resultado, creado_por, created_at) FROM stdin;
\.


--
-- Data for Name: salas; Type: TABLE DATA; Schema: salud; Owner: aitrolsystem
--

COPY salud.salas (id, unidad_id, nombre, tipo, capacidad) FROM stdin;
\.


--
-- Data for Name: sedes; Type: TABLE DATA; Schema: salud; Owner: aitrolsystem
--

COPY salud.sedes (id, nombre, descripcion, direccion, telefono, sis_sucursal_id, created_at) FROM stdin;
\.


--
-- Data for Name: signos_vitales; Type: TABLE DATA; Schema: salud; Owner: aitrolsystem
--

COPY salud.signos_vitales (id, paciente_id, encuentro_id, personal_id, fecha_hora, nombre, valor, unidad) FROM stdin;
\.


--
-- Data for Name: transferencias_internas; Type: TABLE DATA; Schema: salud; Owner: aitrolsystem
--

COPY salud.transferencias_internas (id, ingreso_id, desde_unidad_id, hasta_unidad_id, desde_sala_id, hasta_sala_id, desde_cama_id, hasta_cama_id, fecha_transferencia, motivo, responsable) FROM stdin;
\.


--
-- Data for Name: tratamientos; Type: TABLE DATA; Schema: salud; Owner: aitrolsystem
--

COPY salud.tratamientos (id, consulta_id, indicaciones_generales, cuidados_en_casa, reposo_dias, seguimiento, creado_por, created_at) FROM stdin;
\.


--
-- Data for Name: triajes; Type: TABLE DATA; Schema: salud; Owner: aitrolsystem
--

COPY salud.triajes (id, encuentro_id, paciente_id, personal_id, sis_sucursal_id, fecha_hora, temperatura, presion_sistolica, presion_diastolica, frecuencia_cardiaca, frecuencia_respiratoria, saturacion_oxigeno, glicemia, nivel_dolor, clasificacion, observaciones) FROM stdin;
\.


--
-- Data for Name: unidades; Type: TABLE DATA; Schema: salud; Owner: aitrolsystem
--

COPY salud.unidades (id, piso_id, nombre, codigo, descripcion) FROM stdin;
\.


--
-- Name: audit_log_id_seq; Type: SEQUENCE SET; Schema: dbo; Owner: aitrolsystem
--

SELECT pg_catalog.setval('dbo.audit_log_id_seq', 1, false);


--
-- Name: clientes_id_seq; Type: SEQUENCE SET; Schema: dbo; Owner: aitrolsystem
--

SELECT pg_catalog.setval('dbo.clientes_id_seq', 1, false);


--
-- Name: errores_log_id_seq; Type: SEQUENCE SET; Schema: dbo; Owner: aitrolsystem
--

SELECT pg_catalog.setval('dbo.errores_log_id_seq', 865, true);


--
-- Name: fin_caja_arqueo_id_seq; Type: SEQUENCE SET; Schema: dbo; Owner: aitrolsystem
--

SELECT pg_catalog.setval('dbo.fin_caja_arqueo_id_seq', 1, false);


--
-- Name: fin_caja_id_seq; Type: SEQUENCE SET; Schema: dbo; Owner: aitrolsystem
--

SELECT pg_catalog.setval('dbo.fin_caja_id_seq', 1, true);


--
-- Name: fin_caja_mov_id_seq; Type: SEQUENCE SET; Schema: dbo; Owner: aitrolsystem
--

SELECT pg_catalog.setval('dbo.fin_caja_mov_id_seq', 1, false);


--
-- Name: fin_caja_usuario_id_seq; Type: SEQUENCE SET; Schema: dbo; Owner: aitrolsystem
--

SELECT pg_catalog.setval('dbo.fin_caja_usuario_id_seq', 1, false);


--
-- Name: inv_ajustes_stock_det_id_seq; Type: SEQUENCE SET; Schema: dbo; Owner: aitrolsystem
--

SELECT pg_catalog.setval('dbo.inv_ajustes_stock_det_id_seq', 1, false);


--
-- Name: inv_ajustes_stock_id_seq; Type: SEQUENCE SET; Schema: dbo; Owner: aitrolsystem
--

SELECT pg_catalog.setval('dbo.inv_ajustes_stock_id_seq', 1, false);


--
-- Name: inv_almacenes_id_seq; Type: SEQUENCE SET; Schema: dbo; Owner: aitrolsystem
--

SELECT pg_catalog.setval('dbo.inv_almacenes_id_seq', 1, false);


--
-- Name: inv_categorias_id_seq; Type: SEQUENCE SET; Schema: dbo; Owner: aitrolsystem
--

SELECT pg_catalog.setval('dbo.inv_categorias_id_seq', 2, true);


--
-- Name: inv_clientes_id_seq; Type: SEQUENCE SET; Schema: dbo; Owner: aitrolsystem
--

SELECT pg_catalog.setval('dbo.inv_clientes_id_seq', 1, true);


--
-- Name: inv_compras_cab_id_seq; Type: SEQUENCE SET; Schema: dbo; Owner: aitrolsystem
--

SELECT pg_catalog.setval('dbo.inv_compras_cab_id_seq', 1, false);


--
-- Name: inv_compras_det_id_seq; Type: SEQUENCE SET; Schema: dbo; Owner: aitrolsystem
--

SELECT pg_catalog.setval('dbo.inv_compras_det_id_seq', 1, false);


--
-- Name: inv_compras_series_id_seq; Type: SEQUENCE SET; Schema: dbo; Owner: aitrolsystem
--

SELECT pg_catalog.setval('dbo.inv_compras_series_id_seq', 1, false);


--
-- Name: inv_cotizaciones_cab_id_seq; Type: SEQUENCE SET; Schema: dbo; Owner: aitrolsystem
--

SELECT pg_catalog.setval('dbo.inv_cotizaciones_cab_id_seq', 1, false);


--
-- Name: inv_cotizaciones_det_id_seq; Type: SEQUENCE SET; Schema: dbo; Owner: aitrolsystem
--

SELECT pg_catalog.setval('dbo.inv_cotizaciones_det_id_seq', 1, false);


--
-- Name: inv_kardex_id_seq; Type: SEQUENCE SET; Schema: dbo; Owner: aitrolsystem
--

SELECT pg_catalog.setval('dbo.inv_kardex_id_seq', 1, false);


--
-- Name: inv_marcas_id_seq; Type: SEQUENCE SET; Schema: dbo; Owner: aitrolsystem
--

SELECT pg_catalog.setval('dbo.inv_marcas_id_seq', 7, true);


--
-- Name: inv_movimientos_detalle_id_seq; Type: SEQUENCE SET; Schema: dbo; Owner: aitrolsystem
--

SELECT pg_catalog.setval('dbo.inv_movimientos_detalle_id_seq', 1, false);


--
-- Name: inv_movimientos_id_seq; Type: SEQUENCE SET; Schema: dbo; Owner: aitrolsystem
--

SELECT pg_catalog.setval('dbo.inv_movimientos_id_seq', 1, false);


--
-- Name: inv_movimientos_series_id_seq; Type: SEQUENCE SET; Schema: dbo; Owner: aitrolsystem
--

SELECT pg_catalog.setval('dbo.inv_movimientos_series_id_seq', 1, false);


--
-- Name: inv_perchas_id_seq; Type: SEQUENCE SET; Schema: dbo; Owner: aitrolsystem
--

SELECT pg_catalog.setval('dbo.inv_perchas_id_seq', 1, false);


--
-- Name: inv_productos_id_seq; Type: SEQUENCE SET; Schema: dbo; Owner: aitrolsystem
--

SELECT pg_catalog.setval('dbo.inv_productos_id_seq', 1, false);


--
-- Name: inv_productos_imagenes_id_seq; Type: SEQUENCE SET; Schema: dbo; Owner: aitrolsystem
--

SELECT pg_catalog.setval('dbo.inv_productos_imagenes_id_seq', 1, false);


--
-- Name: inv_productos_series_id_seq; Type: SEQUENCE SET; Schema: dbo; Owner: aitrolsystem
--

SELECT pg_catalog.setval('dbo.inv_productos_series_id_seq', 1, false);


--
-- Name: inv_proveedores_id_seq; Type: SEQUENCE SET; Schema: dbo; Owner: aitrolsystem
--

SELECT pg_catalog.setval('dbo.inv_proveedores_id_seq', 1, false);


--
-- Name: inv_stock_id_seq; Type: SEQUENCE SET; Schema: dbo; Owner: aitrolsystem
--

SELECT pg_catalog.setval('dbo.inv_stock_id_seq', 1, false);


--
-- Name: inv_tipos_movimiento_id_seq; Type: SEQUENCE SET; Schema: dbo; Owner: aitrolsystem
--

SELECT pg_catalog.setval('dbo.inv_tipos_movimiento_id_seq', 1, false);


--
-- Name: inv_transferencias_det_id_seq; Type: SEQUENCE SET; Schema: dbo; Owner: aitrolsystem
--

SELECT pg_catalog.setval('dbo.inv_transferencias_det_id_seq', 1, false);


--
-- Name: inv_transferencias_id_seq; Type: SEQUENCE SET; Schema: dbo; Owner: aitrolsystem
--

SELECT pg_catalog.setval('dbo.inv_transferencias_id_seq', 1, false);


--
-- Name: inv_ventas_cab_id_seq; Type: SEQUENCE SET; Schema: dbo; Owner: aitrolsystem
--

SELECT pg_catalog.setval('dbo.inv_ventas_cab_id_seq', 1, false);


--
-- Name: inv_ventas_det_id_seq; Type: SEQUENCE SET; Schema: dbo; Owner: aitrolsystem
--

SELECT pg_catalog.setval('dbo.inv_ventas_det_id_seq', 1, false);


--
-- Name: inv_ventas_series_id_seq; Type: SEQUENCE SET; Schema: dbo; Owner: aitrolsystem
--

SELECT pg_catalog.setval('dbo.inv_ventas_series_id_seq', 1, false);


--
-- Name: materiales_id_seq; Type: SEQUENCE SET; Schema: dbo; Owner: aitrolsystem
--

SELECT pg_catalog.setval('dbo.materiales_id_seq', 1, true);


--
-- Name: menu_id_seq; Type: SEQUENCE SET; Schema: dbo; Owner: aitrolsystem
--

SELECT pg_catalog.setval('dbo.menu_id_seq', 109, true);


--
-- Name: notificaciones_id_seq; Type: SEQUENCE SET; Schema: dbo; Owner: aitrolsystem
--

SELECT pg_catalog.setval('dbo.notificaciones_id_seq', 4, true);


--
-- Name: notificaciones_leidas_id_seq; Type: SEQUENCE SET; Schema: dbo; Owner: aitrolsystem
--

SELECT pg_catalog.setval('dbo.notificaciones_leidas_id_seq', 4, true);


--
-- Name: ordenes_estados_id_seq; Type: SEQUENCE SET; Schema: dbo; Owner: aitrolsystem
--

SELECT pg_catalog.setval('dbo.ordenes_estados_id_seq', 1, false);


--
-- Name: ordenes_id_seq; Type: SEQUENCE SET; Schema: dbo; Owner: aitrolsystem
--

SELECT pg_catalog.setval('dbo.ordenes_id_seq', 10, true);


--
-- Name: ordenes_observaciones_id_seq; Type: SEQUENCE SET; Schema: dbo; Owner: aitrolsystem
--

SELECT pg_catalog.setval('dbo.ordenes_observaciones_id_seq', 1, false);


--
-- Name: ordenes_vehiculos_id_seq; Type: SEQUENCE SET; Schema: dbo; Owner: aitrolsystem
--

SELECT pg_catalog.setval('dbo.ordenes_vehiculos_id_seq', 7, true);


--
-- Name: ordenes_viajes_asignaciones_id_seq; Type: SEQUENCE SET; Schema: dbo; Owner: aitrolsystem
--

SELECT pg_catalog.setval('dbo.ordenes_viajes_asignaciones_id_seq', 5, true);


--
-- Name: ordenes_viajes_id_seq; Type: SEQUENCE SET; Schema: dbo; Owner: aitrolsystem
--

SELECT pg_catalog.setval('dbo.ordenes_viajes_id_seq', 3, true);


--
-- Name: permisos_sistema_id_seq; Type: SEQUENCE SET; Schema: dbo; Owner: aitrolsystem
--

SELECT pg_catalog.setval('dbo.permisos_sistema_id_seq', 293, true);


--
-- Name: puertos_id_seq; Type: SEQUENCE SET; Schema: dbo; Owner: aitrolsystem
--

SELECT pg_catalog.setval('dbo.puertos_id_seq', 1, true);


--
-- Name: puntos_id_seq; Type: SEQUENCE SET; Schema: dbo; Owner: aitrolsystem
--

SELECT pg_catalog.setval('dbo.puntos_id_seq', 1, false);


--
-- Name: puntos_log_id_seq; Type: SEQUENCE SET; Schema: dbo; Owner: aitrolsystem
--

SELECT pg_catalog.setval('dbo.puntos_log_id_seq', 1, false);


--
-- Name: rh_areas_id_seq; Type: SEQUENCE SET; Schema: dbo; Owner: aitrolsystem
--

SELECT pg_catalog.setval('dbo.rh_areas_id_seq', 3, true);


--
-- Name: rh_cargos_id_seq; Type: SEQUENCE SET; Schema: dbo; Owner: aitrolsystem
--

SELECT pg_catalog.setval('dbo.rh_cargos_id_seq', 1, true);


--
-- Name: rh_contratos_id_seq; Type: SEQUENCE SET; Schema: dbo; Owner: aitrolsystem
--

SELECT pg_catalog.setval('dbo.rh_contratos_id_seq', 1, false);


--
-- Name: rh_documentos_empleado_id_seq; Type: SEQUENCE SET; Schema: dbo; Owner: aitrolsystem
--

SELECT pg_catalog.setval('dbo.rh_documentos_empleado_id_seq', 1, true);


--
-- Name: rh_empleados_id_seq; Type: SEQUENCE SET; Schema: dbo; Owner: aitrolsystem
--

SELECT pg_catalog.setval('dbo.rh_empleados_id_seq', 1, true);


--
-- Name: rh_marcaciones_id_seq; Type: SEQUENCE SET; Schema: dbo; Owner: aitrolsystem
--

SELECT pg_catalog.setval('dbo.rh_marcaciones_id_seq', 7, true);


--
-- Name: rh_niveles_jerarquicos_id_seq; Type: SEQUENCE SET; Schema: dbo; Owner: aitrolsystem
--

SELECT pg_catalog.setval('dbo.rh_niveles_jerarquicos_id_seq', 1, true);


--
-- Name: rh_permisos_id_seq; Type: SEQUENCE SET; Schema: dbo; Owner: aitrolsystem
--

SELECT pg_catalog.setval('dbo.rh_permisos_id_seq', 1, false);


--
-- Name: rh_prestamos_cuotas_id_seq; Type: SEQUENCE SET; Schema: dbo; Owner: aitrolsystem
--

SELECT pg_catalog.setval('dbo.rh_prestamos_cuotas_id_seq', 40, true);


--
-- Name: rh_prestamos_id_seq; Type: SEQUENCE SET; Schema: dbo; Owner: aitrolsystem
--

SELECT pg_catalog.setval('dbo.rh_prestamos_id_seq', 1, true);


--
-- Name: rh_roles_pago_cab_id_seq; Type: SEQUENCE SET; Schema: dbo; Owner: aitrolsystem
--

SELECT pg_catalog.setval('dbo.rh_roles_pago_cab_id_seq', 2, true);


--
-- Name: rh_roles_pago_det_id_seq; Type: SEQUENCE SET; Schema: dbo; Owner: aitrolsystem
--

SELECT pg_catalog.setval('dbo.rh_roles_pago_det_id_seq', 2, true);


--
-- Name: rh_usuario_id_seq; Type: SEQUENCE SET; Schema: dbo; Owner: aitrolsystem
--

SELECT pg_catalog.setval('dbo.rh_usuario_id_seq', 1, true);


--
-- Name: rh_vacaciones_id_seq; Type: SEQUENCE SET; Schema: dbo; Owner: aitrolsystem
--

SELECT pg_catalog.setval('dbo.rh_vacaciones_id_seq', 1, true);


--
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: dbo; Owner: aitrolsystem
--

SELECT pg_catalog.setval('dbo.roles_id_seq', 551, true);


--
-- Name: roles_permisos_id_seq; Type: SEQUENCE SET; Schema: dbo; Owner: aitrolsystem
--

SELECT pg_catalog.setval('dbo.roles_permisos_id_seq', 17186, true);


--
-- Name: seq_numero_factura; Type: SEQUENCE SET; Schema: dbo; Owner: aitrolsystem
--

SELECT pg_catalog.setval('dbo.seq_numero_factura', 1, false);


--
-- Name: sis_datos_facturacion_id_seq; Type: SEQUENCE SET; Schema: dbo; Owner: aitrolsystem
--

SELECT pg_catalog.setval('dbo.sis_datos_facturacion_id_seq', 1, false);


--
-- Name: sis_empresa_id_empresa_seq; Type: SEQUENCE SET; Schema: dbo; Owner: aitrolsystem
--

SELECT pg_catalog.setval('dbo.sis_empresa_id_empresa_seq', 1, true);


--
-- Name: sis_punto_emision_id_punto_seq; Type: SEQUENCE SET; Schema: dbo; Owner: aitrolsystem
--

SELECT pg_catalog.setval('dbo.sis_punto_emision_id_punto_seq', 1, true);


--
-- Name: sis_sucursal_id_sucursal_seq; Type: SEQUENCE SET; Schema: dbo; Owner: aitrolsystem
--

SELECT pg_catalog.setval('dbo.sis_sucursal_id_sucursal_seq', 547, true);


--
-- Name: sysdiagrams_diagram_id_seq; Type: SEQUENCE SET; Schema: dbo; Owner: aitrolsystem
--

SELECT pg_catalog.setval('dbo.sysdiagrams_diagram_id_seq', 1, false);


--
-- Name: usuarios_id_seq; Type: SEQUENCE SET; Schema: dbo; Owner: aitrolsystem
--

SELECT pg_catalog.setval('dbo.usuarios_id_seq', 19, true);


--
-- Name: usuarios_roles_id_seq; Type: SEQUENCE SET; Schema: dbo; Owner: aitrolsystem
--

SELECT pg_catalog.setval('dbo.usuarios_roles_id_seq', 9, true);


--
-- Name: usuarios_sucursales_id_seq; Type: SEQUENCE SET; Schema: dbo; Owner: aitrolsystem
--

SELECT pg_catalog.setval('dbo.usuarios_sucursales_id_seq', 8, true);


--
-- Name: vehiculos_id_seq; Type: SEQUENCE SET; Schema: dbo; Owner: aitrolsystem
--

SELECT pg_catalog.setval('dbo.vehiculos_id_seq', 3, true);


--
-- Name: vehiculos_kilometraje_id_seq; Type: SEQUENCE SET; Schema: dbo; Owner: aitrolsystem
--

SELECT pg_catalog.setval('dbo.vehiculos_kilometraje_id_seq', 1, false);


--
-- Name: vehiculos_mantenimiento_id_seq; Type: SEQUENCE SET; Schema: dbo; Owner: aitrolsystem
--

SELECT pg_catalog.setval('dbo.vehiculos_mantenimiento_id_seq', 1, false);


--
-- Name: vehiculos_tipos_id_seq; Type: SEQUENCE SET; Schema: dbo; Owner: aitrolsystem
--

SELECT pg_catalog.setval('dbo.vehiculos_tipos_id_seq', 1, true);


--
-- Name: adjuntos_id_seq; Type: SEQUENCE SET; Schema: salud; Owner: aitrolsystem
--

SELECT pg_catalog.setval('salud.adjuntos_id_seq', 1, false);


--
-- Name: afiliaciones_id_seq; Type: SEQUENCE SET; Schema: salud; Owner: aitrolsystem
--

SELECT pg_catalog.setval('salud.afiliaciones_id_seq', 1, false);


--
-- Name: agendas_id_seq; Type: SEQUENCE SET; Schema: salud; Owner: aitrolsystem
--

SELECT pg_catalog.setval('salud.agendas_id_seq', 1, false);


--
-- Name: anestesia_registros_id_seq; Type: SEQUENCE SET; Schema: salud; Owner: aitrolsystem
--

SELECT pg_catalog.setval('salud.anestesia_registros_id_seq', 1, false);


--
-- Name: aseguradoras_id_seq; Type: SEQUENCE SET; Schema: salud; Owner: aitrolsystem
--

SELECT pg_catalog.setval('salud.aseguradoras_id_seq', 1, false);


--
-- Name: camas_id_seq; Type: SEQUENCE SET; Schema: salud; Owner: aitrolsystem
--

SELECT pg_catalog.setval('salud.camas_id_seq', 1, false);


--
-- Name: citas_id_seq; Type: SEQUENCE SET; Schema: salud; Owner: aitrolsystem
--

SELECT pg_catalog.setval('salud.citas_id_seq', 1, false);


--
-- Name: consulta_diagnosticos_id_seq; Type: SEQUENCE SET; Schema: salud; Owner: aitrolsystem
--

SELECT pg_catalog.setval('salud.consulta_diagnosticos_id_seq', 1, false);


--
-- Name: consulta_medica_id_seq; Type: SEQUENCE SET; Schema: salud; Owner: aitrolsystem
--

SELECT pg_catalog.setval('salud.consulta_medica_id_seq', 1, false);


--
-- Name: contactos_emergencia_id_seq; Type: SEQUENCE SET; Schema: salud; Owner: aitrolsystem
--

SELECT pg_catalog.setval('salud.contactos_emergencia_id_seq', 1, false);


--
-- Name: diagnosticos_cat_id_seq; Type: SEQUENCE SET; Schema: salud; Owner: aitrolsystem
--

SELECT pg_catalog.setval('salud.diagnosticos_cat_id_seq', 1, false);


--
-- Name: dispensaciones_detalle_id_seq; Type: SEQUENCE SET; Schema: salud; Owner: aitrolsystem
--

SELECT pg_catalog.setval('salud.dispensaciones_detalle_id_seq', 1, false);


--
-- Name: dispensaciones_id_seq; Type: SEQUENCE SET; Schema: salud; Owner: aitrolsystem
--

SELECT pg_catalog.setval('salud.dispensaciones_id_seq', 1, false);


--
-- Name: emergencias_id_seq; Type: SEQUENCE SET; Schema: salud; Owner: aitrolsystem
--

SELECT pg_catalog.setval('salud.emergencias_id_seq', 1, false);


--
-- Name: encuentros_id_seq; Type: SEQUENCE SET; Schema: salud; Owner: aitrolsystem
--

SELECT pg_catalog.setval('salud.encuentros_id_seq', 1, false);


--
-- Name: epicrisis_id_seq; Type: SEQUENCE SET; Schema: salud; Owner: aitrolsystem
--

SELECT pg_catalog.setval('salud.epicrisis_id_seq', 1, false);


--
-- Name: evoluciones_id_seq; Type: SEQUENCE SET; Schema: salud; Owner: aitrolsystem
--

SELECT pg_catalog.setval('salud.evoluciones_id_seq', 1, false);


--
-- Name: examen_fisico_id_seq; Type: SEQUENCE SET; Schema: salud; Owner: aitrolsystem
--

SELECT pg_catalog.setval('salud.examen_fisico_id_seq', 1, false);


--
-- Name: examenes_id_seq; Type: SEQUENCE SET; Schema: salud; Owner: aitrolsystem
--

SELECT pg_catalog.setval('salud.examenes_id_seq', 1, false);


--
-- Name: facturas_clinicas_detalle_id_seq; Type: SEQUENCE SET; Schema: salud; Owner: aitrolsystem
--

SELECT pg_catalog.setval('salud.facturas_clinicas_detalle_id_seq', 1, false);


--
-- Name: facturas_clinicas_id_seq; Type: SEQUENCE SET; Schema: salud; Owner: aitrolsystem
--

SELECT pg_catalog.setval('salud.facturas_clinicas_id_seq', 1, false);


--
-- Name: historia_antecedentes_id_seq; Type: SEQUENCE SET; Schema: salud; Owner: aitrolsystem
--

SELECT pg_catalog.setval('salud.historia_antecedentes_id_seq', 1, false);


--
-- Name: historia_auditoria_id_seq; Type: SEQUENCE SET; Schema: salud; Owner: aitrolsystem
--

SELECT pg_catalog.setval('salud.historia_auditoria_id_seq', 1, false);


--
-- Name: historia_clinica_id_seq; Type: SEQUENCE SET; Schema: salud; Owner: aitrolsystem
--

SELECT pg_catalog.setval('salud.historia_clinica_id_seq', 1, false);


--
-- Name: ingresos_id_seq; Type: SEQUENCE SET; Schema: salud; Owner: aitrolsystem
--

SELECT pg_catalog.setval('salud.ingresos_id_seq', 1, false);


--
-- Name: interconsultas_id_seq; Type: SEQUENCE SET; Schema: salud; Owner: aitrolsystem
--

SELECT pg_catalog.setval('salud.interconsultas_id_seq', 1, false);


--
-- Name: mar_id_seq; Type: SEQUENCE SET; Schema: salud; Owner: aitrolsystem
--

SELECT pg_catalog.setval('salud.mar_id_seq', 1, false);


--
-- Name: medicamentos_id_seq; Type: SEQUENCE SET; Schema: salud; Owner: aitrolsystem
--

SELECT pg_catalog.setval('salud.medicamentos_id_seq', 1, false);


--
-- Name: muestras_id_seq; Type: SEQUENCE SET; Schema: salud; Owner: aitrolsystem
--

SELECT pg_catalog.setval('salud.muestras_id_seq', 1, false);


--
-- Name: ordenes_imagenologia_id_seq; Type: SEQUENCE SET; Schema: salud; Owner: aitrolsystem
--

SELECT pg_catalog.setval('salud.ordenes_imagenologia_id_seq', 1, false);


--
-- Name: ordenes_laboratorio_id_seq; Type: SEQUENCE SET; Schema: salud; Owner: aitrolsystem
--

SELECT pg_catalog.setval('salud.ordenes_laboratorio_id_seq', 1, false);


--
-- Name: pacientes_id_seq; Type: SEQUENCE SET; Schema: salud; Owner: aitrolsystem
--

SELECT pg_catalog.setval('salud.pacientes_id_seq', 1, false);


--
-- Name: personal_id_seq; Type: SEQUENCE SET; Schema: salud; Owner: aitrolsystem
--

SELECT pg_catalog.setval('salud.personal_id_seq', 1, false);


--
-- Name: personas_id_seq; Type: SEQUENCE SET; Schema: salud; Owner: aitrolsystem
--

SELECT pg_catalog.setval('salud.personas_id_seq', 1, false);


--
-- Name: pisos_id_seq; Type: SEQUENCE SET; Schema: salud; Owner: aitrolsystem
--

SELECT pg_catalog.setval('salud.pisos_id_seq', 1, false);


--
-- Name: procedimientos_id_seq; Type: SEQUENCE SET; Schema: salud; Owner: aitrolsystem
--

SELECT pg_catalog.setval('salud.procedimientos_id_seq', 1, false);


--
-- Name: procedimientos_insumos_id_seq; Type: SEQUENCE SET; Schema: salud; Owner: aitrolsystem
--

SELECT pg_catalog.setval('salud.procedimientos_insumos_id_seq', 1, false);


--
-- Name: procedimientos_realizados_id_seq; Type: SEQUENCE SET; Schema: salud; Owner: aitrolsystem
--

SELECT pg_catalog.setval('salud.procedimientos_realizados_id_seq', 1, false);


--
-- Name: programacion_quirofano_id_seq; Type: SEQUENCE SET; Schema: salud; Owner: aitrolsystem
--

SELECT pg_catalog.setval('salud.programacion_quirofano_id_seq', 1, false);


--
-- Name: quirofanos_id_seq; Type: SEQUENCE SET; Schema: salud; Owner: aitrolsystem
--

SELECT pg_catalog.setval('salud.quirofanos_id_seq', 1, false);


--
-- Name: recetas_detalle_id_seq; Type: SEQUENCE SET; Schema: salud; Owner: aitrolsystem
--

SELECT pg_catalog.setval('salud.recetas_detalle_id_seq', 1, false);


--
-- Name: recetas_id_seq; Type: SEQUENCE SET; Schema: salud; Owner: aitrolsystem
--

SELECT pg_catalog.setval('salud.recetas_id_seq', 1, false);


--
-- Name: resultados_imagenologia_id_seq; Type: SEQUENCE SET; Schema: salud; Owner: aitrolsystem
--

SELECT pg_catalog.setval('salud.resultados_imagenologia_id_seq', 1, false);


--
-- Name: resultados_laboratorio_id_seq; Type: SEQUENCE SET; Schema: salud; Owner: aitrolsystem
--

SELECT pg_catalog.setval('salud.resultados_laboratorio_id_seq', 1, false);


--
-- Name: salas_id_seq; Type: SEQUENCE SET; Schema: salud; Owner: aitrolsystem
--

SELECT pg_catalog.setval('salud.salas_id_seq', 1, false);


--
-- Name: sedes_id_seq; Type: SEQUENCE SET; Schema: salud; Owner: aitrolsystem
--

SELECT pg_catalog.setval('salud.sedes_id_seq', 1, false);


--
-- Name: signos_vitales_id_seq; Type: SEQUENCE SET; Schema: salud; Owner: aitrolsystem
--

SELECT pg_catalog.setval('salud.signos_vitales_id_seq', 1, false);


--
-- Name: transferencias_internas_id_seq; Type: SEQUENCE SET; Schema: salud; Owner: aitrolsystem
--

SELECT pg_catalog.setval('salud.transferencias_internas_id_seq', 1, false);


--
-- Name: tratamientos_id_seq; Type: SEQUENCE SET; Schema: salud; Owner: aitrolsystem
--

SELECT pg_catalog.setval('salud.tratamientos_id_seq', 1, false);


--
-- Name: triajes_id_seq; Type: SEQUENCE SET; Schema: salud; Owner: aitrolsystem
--

SELECT pg_catalog.setval('salud.triajes_id_seq', 1, false);


--
-- Name: unidades_id_seq; Type: SEQUENCE SET; Schema: salud; Owner: aitrolsystem
--

SELECT pg_catalog.setval('salud.unidades_id_seq', 1, false);


--
-- Name: inv_cotizaciones_cab inv_cotizaciones_cab_pkey; Type: CONSTRAINT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.inv_cotizaciones_cab
    ADD CONSTRAINT inv_cotizaciones_cab_pkey PRIMARY KEY (id);


--
-- Name: inv_cotizaciones_det inv_cotizaciones_det_pkey; Type: CONSTRAINT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.inv_cotizaciones_det
    ADD CONSTRAINT inv_cotizaciones_det_pkey PRIMARY KEY (id);


--
-- Name: inv_productos inv_productos_pk; Type: CONSTRAINT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.inv_productos
    ADD CONSTRAINT inv_productos_pk PRIMARY KEY (id);


--
-- Name: menu menu_pk; Type: CONSTRAINT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.menu
    ADD CONSTRAINT menu_pk PRIMARY KEY (id);


--
-- Name: menu menu_pk_2; Type: CONSTRAINT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.menu
    ADD CONSTRAINT menu_pk_2 UNIQUE (id);


--
-- Name: notificaciones_leidas notificaciones_leidas_pkey; Type: CONSTRAINT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.notificaciones_leidas
    ADD CONSTRAINT notificaciones_leidas_pkey PRIMARY KEY (id);


--
-- Name: notificaciones notificaciones_pkey; Type: CONSTRAINT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.notificaciones
    ADD CONSTRAINT notificaciones_pkey PRIMARY KEY (id);


--
-- Name: ordenes_compartir ordenes_compartir_pk; Type: CONSTRAINT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.ordenes_compartir
    ADD CONSTRAINT ordenes_compartir_pk PRIMARY KEY (id);


--
-- Name: ordenes_observaciones ordenes_observaciones_pk; Type: CONSTRAINT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.ordenes_observaciones
    ADD CONSTRAINT ordenes_observaciones_pk PRIMARY KEY (id);


--
-- Name: ordenes ordenes_pk; Type: CONSTRAINT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.ordenes
    ADD CONSTRAINT ordenes_pk PRIMARY KEY (id);


--
-- Name: ordenes_vehiculos ordenes_vehiculos_pk; Type: CONSTRAINT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.ordenes_vehiculos
    ADD CONSTRAINT ordenes_vehiculos_pk PRIMARY KEY (id);


--
-- Name: ordenes_viajes_asignaciones ordenes_viajes_asignaciones_pk; Type: CONSTRAINT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.ordenes_viajes_asignaciones
    ADD CONSTRAINT ordenes_viajes_asignaciones_pk PRIMARY KEY (id);


--
-- Name: ordenes_viajes_log ordenes_viajes_log_pk; Type: CONSTRAINT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.ordenes_viajes_log
    ADD CONSTRAINT ordenes_viajes_log_pk PRIMARY KEY (id);


--
-- Name: ordenes_viajes ordenes_viajes_pk; Type: CONSTRAINT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.ordenes_viajes
    ADD CONSTRAINT ordenes_viajes_pk PRIMARY KEY (id);


--
-- Name: permisos_sistema permisos_sistema_pk; Type: CONSTRAINT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.permisos_sistema
    ADD CONSTRAINT permisos_sistema_pk PRIMARY KEY (id);


--
-- Name: puertos puertos_pk; Type: CONSTRAINT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.puertos
    ADD CONSTRAINT puertos_pk PRIMARY KEY (id);


--
-- Name: rh_areas rh_areas_pk; Type: CONSTRAINT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.rh_areas
    ADD CONSTRAINT rh_areas_pk PRIMARY KEY (id);


--
-- Name: rh_cargos rh_cargos_pkey; Type: CONSTRAINT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.rh_cargos
    ADD CONSTRAINT rh_cargos_pkey PRIMARY KEY (id);


--
-- Name: rh_contratos rh_contratos_pkey; Type: CONSTRAINT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.rh_contratos
    ADD CONSTRAINT rh_contratos_pkey PRIMARY KEY (id);


--
-- Name: rh_documentos_empleado rh_documentos_empleado_pkey; Type: CONSTRAINT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.rh_documentos_empleado
    ADD CONSTRAINT rh_documentos_empleado_pkey PRIMARY KEY (id);


--
-- Name: rh_empleados rh_empleados_pk; Type: CONSTRAINT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.rh_empleados
    ADD CONSTRAINT rh_empleados_pk PRIMARY KEY (id);


--
-- Name: rh_niveles_jerarquicos rh_niveles_jerarquicos_pkey; Type: CONSTRAINT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.rh_niveles_jerarquicos
    ADD CONSTRAINT rh_niveles_jerarquicos_pkey PRIMARY KEY (id);


--
-- Name: roles_permisos roles_permisos_pk; Type: CONSTRAINT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.roles_permisos
    ADD CONSTRAINT roles_permisos_pk PRIMARY KEY (id);


--
-- Name: sis_datos_facturacion sis_datos_facturacion_pk; Type: CONSTRAINT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.sis_datos_facturacion
    ADD CONSTRAINT sis_datos_facturacion_pk PRIMARY KEY (id);


--
-- Name: sis_empresa sis_empresa_pk; Type: CONSTRAINT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.sis_empresa
    ADD CONSTRAINT sis_empresa_pk PRIMARY KEY (id_empresa);


--
-- Name: sis_sucursal sis_sucursal_pk; Type: CONSTRAINT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.sis_sucursal
    ADD CONSTRAINT sis_sucursal_pk PRIMARY KEY (id_sucursal);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- Name: usuarios_sucursales usuarios_sucursales_pkey; Type: CONSTRAINT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.usuarios_sucursales
    ADD CONSTRAINT usuarios_sucursales_pkey PRIMARY KEY (id);


--
-- Name: vehiculos_kilometraje vehiculos_kilometraje_pk; Type: CONSTRAINT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.vehiculos_kilometraje
    ADD CONSTRAINT vehiculos_kilometraje_pk PRIMARY KEY (id);


--
-- Name: vehiculos_mantenimiento vehiculos_mantenimiento_pk; Type: CONSTRAINT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.vehiculos_mantenimiento
    ADD CONSTRAINT vehiculos_mantenimiento_pk PRIMARY KEY (id);


--
-- Name: vehiculos vehiculos_pk; Type: CONSTRAINT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.vehiculos
    ADD CONSTRAINT vehiculos_pk PRIMARY KEY (id);


--
-- Name: adjuntos adjuntos_pkey; Type: CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.adjuntos
    ADD CONSTRAINT adjuntos_pkey PRIMARY KEY (id);


--
-- Name: afiliaciones afiliaciones_pkey; Type: CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.afiliaciones
    ADD CONSTRAINT afiliaciones_pkey PRIMARY KEY (id);


--
-- Name: agendas agendas_pkey; Type: CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.agendas
    ADD CONSTRAINT agendas_pkey PRIMARY KEY (id);


--
-- Name: anestesia_registros anestesia_registros_pkey; Type: CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.anestesia_registros
    ADD CONSTRAINT anestesia_registros_pkey PRIMARY KEY (id);


--
-- Name: aseguradoras aseguradoras_pkey; Type: CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.aseguradoras
    ADD CONSTRAINT aseguradoras_pkey PRIMARY KEY (id);


--
-- Name: camas camas_pkey; Type: CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.camas
    ADD CONSTRAINT camas_pkey PRIMARY KEY (id);


--
-- Name: citas citas_pkey; Type: CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.citas
    ADD CONSTRAINT citas_pkey PRIMARY KEY (id);


--
-- Name: consulta_diagnosticos consulta_diagnosticos_pkey; Type: CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.consulta_diagnosticos
    ADD CONSTRAINT consulta_diagnosticos_pkey PRIMARY KEY (id);


--
-- Name: consulta_medica consulta_medica_pkey; Type: CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.consulta_medica
    ADD CONSTRAINT consulta_medica_pkey PRIMARY KEY (id);


--
-- Name: contactos_emergencia contactos_emergencia_pkey; Type: CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.contactos_emergencia
    ADD CONSTRAINT contactos_emergencia_pkey PRIMARY KEY (id);


--
-- Name: diagnosticos_cat diagnosticos_cat_pkey; Type: CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.diagnosticos_cat
    ADD CONSTRAINT diagnosticos_cat_pkey PRIMARY KEY (id);


--
-- Name: dispensaciones_detalle dispensaciones_detalle_pkey; Type: CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.dispensaciones_detalle
    ADD CONSTRAINT dispensaciones_detalle_pkey PRIMARY KEY (id);


--
-- Name: dispensaciones dispensaciones_pkey; Type: CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.dispensaciones
    ADD CONSTRAINT dispensaciones_pkey PRIMARY KEY (id);


--
-- Name: emergencias emergencias_pkey; Type: CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.emergencias
    ADD CONSTRAINT emergencias_pkey PRIMARY KEY (id);


--
-- Name: encuentros encuentros_pkey; Type: CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.encuentros
    ADD CONSTRAINT encuentros_pkey PRIMARY KEY (id);


--
-- Name: epicrisis epicrisis_pkey; Type: CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.epicrisis
    ADD CONSTRAINT epicrisis_pkey PRIMARY KEY (id);


--
-- Name: evoluciones evoluciones_pkey; Type: CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.evoluciones
    ADD CONSTRAINT evoluciones_pkey PRIMARY KEY (id);


--
-- Name: examen_fisico examen_fisico_pkey; Type: CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.examen_fisico
    ADD CONSTRAINT examen_fisico_pkey PRIMARY KEY (id);


--
-- Name: examenes examenes_codigo_key; Type: CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.examenes
    ADD CONSTRAINT examenes_codigo_key UNIQUE (codigo);


--
-- Name: examenes examenes_pkey; Type: CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.examenes
    ADD CONSTRAINT examenes_pkey PRIMARY KEY (id);


--
-- Name: facturas_clinicas_detalle facturas_clinicas_detalle_pkey; Type: CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.facturas_clinicas_detalle
    ADD CONSTRAINT facturas_clinicas_detalle_pkey PRIMARY KEY (id);


--
-- Name: facturas_clinicas facturas_clinicas_pkey; Type: CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.facturas_clinicas
    ADD CONSTRAINT facturas_clinicas_pkey PRIMARY KEY (id);


--
-- Name: historia_antecedentes historia_antecedentes_pkey; Type: CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.historia_antecedentes
    ADD CONSTRAINT historia_antecedentes_pkey PRIMARY KEY (id);


--
-- Name: historia_auditoria historia_auditoria_pkey; Type: CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.historia_auditoria
    ADD CONSTRAINT historia_auditoria_pkey PRIMARY KEY (id);


--
-- Name: historia_clinica historia_clinica_numero_historia_key; Type: CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.historia_clinica
    ADD CONSTRAINT historia_clinica_numero_historia_key UNIQUE (numero_historia);


--
-- Name: historia_clinica historia_clinica_pkey; Type: CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.historia_clinica
    ADD CONSTRAINT historia_clinica_pkey PRIMARY KEY (id);


--
-- Name: ingresos ingresos_pkey; Type: CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.ingresos
    ADD CONSTRAINT ingresos_pkey PRIMARY KEY (id);


--
-- Name: interconsultas interconsultas_pkey; Type: CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.interconsultas
    ADD CONSTRAINT interconsultas_pkey PRIMARY KEY (id);


--
-- Name: mar mar_pkey; Type: CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.mar
    ADD CONSTRAINT mar_pkey PRIMARY KEY (id);


--
-- Name: medicamentos medicamentos_pkey; Type: CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.medicamentos
    ADD CONSTRAINT medicamentos_pkey PRIMARY KEY (id);


--
-- Name: muestras muestras_codigo_barra_key; Type: CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.muestras
    ADD CONSTRAINT muestras_codigo_barra_key UNIQUE (codigo_barra);


--
-- Name: muestras muestras_pkey; Type: CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.muestras
    ADD CONSTRAINT muestras_pkey PRIMARY KEY (id);


--
-- Name: ordenes_imagenologia ordenes_imagenologia_pkey; Type: CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.ordenes_imagenologia
    ADD CONSTRAINT ordenes_imagenologia_pkey PRIMARY KEY (id);


--
-- Name: ordenes_laboratorio ordenes_laboratorio_pkey; Type: CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.ordenes_laboratorio
    ADD CONSTRAINT ordenes_laboratorio_pkey PRIMARY KEY (id);


--
-- Name: pacientes pacientes_codigo_paciente_key; Type: CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.pacientes
    ADD CONSTRAINT pacientes_codigo_paciente_key UNIQUE (codigo_paciente);


--
-- Name: pacientes pacientes_pkey; Type: CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.pacientes
    ADD CONSTRAINT pacientes_pkey PRIMARY KEY (id);


--
-- Name: personal personal_codigo_personal_key; Type: CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.personal
    ADD CONSTRAINT personal_codigo_personal_key UNIQUE (codigo_personal);


--
-- Name: personal personal_pkey; Type: CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.personal
    ADD CONSTRAINT personal_pkey PRIMARY KEY (id);


--
-- Name: personas personas_pkey; Type: CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.personas
    ADD CONSTRAINT personas_pkey PRIMARY KEY (id);


--
-- Name: personas personas_tipo_identificacion_identificacion_key; Type: CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.personas
    ADD CONSTRAINT personas_tipo_identificacion_identificacion_key UNIQUE (tipo_identificacion, identificacion);


--
-- Name: pisos pisos_pkey; Type: CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.pisos
    ADD CONSTRAINT pisos_pkey PRIMARY KEY (id);


--
-- Name: procedimientos_insumos procedimientos_insumos_pkey; Type: CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.procedimientos_insumos
    ADD CONSTRAINT procedimientos_insumos_pkey PRIMARY KEY (id);


--
-- Name: procedimientos procedimientos_pkey; Type: CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.procedimientos
    ADD CONSTRAINT procedimientos_pkey PRIMARY KEY (id);


--
-- Name: procedimientos_realizados procedimientos_realizados_pkey; Type: CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.procedimientos_realizados
    ADD CONSTRAINT procedimientos_realizados_pkey PRIMARY KEY (id);


--
-- Name: programacion_quirofano programacion_quirofano_pkey; Type: CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.programacion_quirofano
    ADD CONSTRAINT programacion_quirofano_pkey PRIMARY KEY (id);


--
-- Name: quirofanos quirofanos_pkey; Type: CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.quirofanos
    ADD CONSTRAINT quirofanos_pkey PRIMARY KEY (id);


--
-- Name: recetas_detalle recetas_detalle_pkey; Type: CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.recetas_detalle
    ADD CONSTRAINT recetas_detalle_pkey PRIMARY KEY (id);


--
-- Name: recetas recetas_pkey; Type: CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.recetas
    ADD CONSTRAINT recetas_pkey PRIMARY KEY (id);


--
-- Name: resultados_imagenologia resultados_imagenologia_pkey; Type: CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.resultados_imagenologia
    ADD CONSTRAINT resultados_imagenologia_pkey PRIMARY KEY (id);


--
-- Name: resultados_laboratorio resultados_laboratorio_pkey; Type: CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.resultados_laboratorio
    ADD CONSTRAINT resultados_laboratorio_pkey PRIMARY KEY (id);


--
-- Name: salas salas_pkey; Type: CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.salas
    ADD CONSTRAINT salas_pkey PRIMARY KEY (id);


--
-- Name: sedes sedes_pkey; Type: CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.sedes
    ADD CONSTRAINT sedes_pkey PRIMARY KEY (id);


--
-- Name: signos_vitales signos_vitales_pkey; Type: CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.signos_vitales
    ADD CONSTRAINT signos_vitales_pkey PRIMARY KEY (id);


--
-- Name: transferencias_internas transferencias_internas_pkey; Type: CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.transferencias_internas
    ADD CONSTRAINT transferencias_internas_pkey PRIMARY KEY (id);


--
-- Name: tratamientos tratamientos_pkey; Type: CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.tratamientos
    ADD CONSTRAINT tratamientos_pkey PRIMARY KEY (id);


--
-- Name: triajes triajes_pkey; Type: CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.triajes
    ADD CONSTRAINT triajes_pkey PRIMARY KEY (id);


--
-- Name: unidades unidades_pkey; Type: CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.unidades
    ADD CONSTRAINT unidades_pkey PRIMARY KEY (id);


--
-- Name: idx_16388_pk__audit_lo__3213e83f4b9fde88; Type: INDEX; Schema: dbo; Owner: aitrolsystem
--

CREATE UNIQUE INDEX idx_16388_pk__audit_lo__3213e83f4b9fde88 ON dbo.audit_log USING btree (id);


--
-- Name: idx_16395_pk_clientes; Type: INDEX; Schema: dbo; Owner: aitrolsystem
--

CREATE UNIQUE INDEX idx_16395_pk_clientes ON dbo.clientes USING btree (id);


--
-- Name: idx_16403_pk__errores___3213e83f625a204e; Type: INDEX; Schema: dbo; Owner: aitrolsystem
--

CREATE UNIQUE INDEX idx_16403_pk__errores___3213e83f625a204e ON dbo.errores_log USING btree (id);


--
-- Name: idx_16410_pk__fin_caja__3213e83fc2c14bac; Type: INDEX; Schema: dbo; Owner: aitrolsystem
--

CREATE UNIQUE INDEX idx_16410_pk__fin_caja__3213e83fc2c14bac ON dbo.fin_caja USING btree (id);


--
-- Name: idx_inv_stock_unico; Type: INDEX; Schema: dbo; Owner: aitrolsystem
--

CREATE UNIQUE INDEX idx_inv_stock_unico ON dbo.inv_stock USING btree (producto_id, almacen_id, percha_id, id_sucursal);


--
-- Name: idx_salud_facturas_paciente; Type: INDEX; Schema: salud; Owner: aitrolsystem
--

CREATE INDEX idx_salud_facturas_paciente ON salud.facturas_clinicas USING btree (paciente_id);


--
-- Name: idx_salud_historia_paciente; Type: INDEX; Schema: salud; Owner: aitrolsystem
--

CREATE INDEX idx_salud_historia_paciente ON salud.historia_clinica USING btree (paciente_id);


--
-- Name: idx_salud_ordenes_lab_paciente; Type: INDEX; Schema: salud; Owner: aitrolsystem
--

CREATE INDEX idx_salud_ordenes_lab_paciente ON salud.ordenes_laboratorio USING btree (paciente_id, fecha_pedido);


--
-- Name: idx_salud_procedimientos_realizados_paciente; Type: INDEX; Schema: salud; Owner: aitrolsystem
--

CREATE INDEX idx_salud_procedimientos_realizados_paciente ON salud.procedimientos_realizados USING btree (paciente_id);


--
-- Name: idx_salud_recetas_paciente; Type: INDEX; Schema: salud; Owner: aitrolsystem
--

CREATE INDEX idx_salud_recetas_paciente ON salud.recetas USING btree (paciente_id);


--
-- Name: salud_camas_codigo_idx; Type: INDEX; Schema: salud; Owner: aitrolsystem
--

CREATE INDEX salud_camas_codigo_idx ON salud.camas USING btree (codigo);


--
-- Name: salud_citas_fecha_idx; Type: INDEX; Schema: salud; Owner: aitrolsystem
--

CREATE INDEX salud_citas_fecha_idx ON salud.citas USING btree (fecha_hora);


--
-- Name: salud_citas_paciente_idx; Type: INDEX; Schema: salud; Owner: aitrolsystem
--

CREATE INDEX salud_citas_paciente_idx ON salud.citas USING btree (paciente_id);


--
-- Name: salud_dispensaciones_paciente_idx; Type: INDEX; Schema: salud; Owner: aitrolsystem
--

CREATE INDEX salud_dispensaciones_paciente_idx ON salud.dispensaciones USING btree (paciente_id, fecha_dispensacion);


--
-- Name: salud_encuentros_paciente_idx; Type: INDEX; Schema: salud; Owner: aitrolsystem
--

CREATE INDEX salud_encuentros_paciente_idx ON salud.encuentros USING btree (paciente_id);


--
-- Name: salud_muestras_codigo_idx; Type: INDEX; Schema: salud; Owner: aitrolsystem
--

CREATE INDEX salud_muestras_codigo_idx ON salud.muestras USING btree (codigo_barra);


--
-- Name: salud_pacientes_codigo_idx; Type: INDEX; Schema: salud; Owner: aitrolsystem
--

CREATE INDEX salud_pacientes_codigo_idx ON salud.pacientes USING btree (codigo_paciente);


--
-- Name: salud_pacientes_persona_idx; Type: INDEX; Schema: salud; Owner: aitrolsystem
--

CREATE INDEX salud_pacientes_persona_idx ON salud.pacientes USING btree (persona_id);


--
-- Name: salud_personal_especialidad_idx; Type: INDEX; Schema: salud; Owner: aitrolsystem
--

CREATE INDEX salud_personal_especialidad_idx ON salud.personal USING btree (especialidad);


--
-- Name: salud_personas_ident_idx; Type: INDEX; Schema: salud; Owner: aitrolsystem
--

CREATE INDEX salud_personas_ident_idx ON salud.personas USING btree (identificacion);


--
-- Name: salud_personas_uuid_idx; Type: INDEX; Schema: salud; Owner: aitrolsystem
--

CREATE INDEX salud_personas_uuid_idx ON salud.personas USING btree (uuid);


--
-- Name: salud_signos_fecha_idx; Type: INDEX; Schema: salud; Owner: aitrolsystem
--

CREATE INDEX salud_signos_fecha_idx ON salud.signos_vitales USING btree (fecha_hora);


--
-- Name: inv_kardex trg_actualiza_stock; Type: TRIGGER; Schema: dbo; Owner: aitrolsystem
--

CREATE TRIGGER trg_actualiza_stock AFTER INSERT ON dbo.inv_kardex FOR EACH ROW EXECUTE FUNCTION dbo.trg_actualiza_stock();


--
-- Name: inv_compras_cab trg_compras_to_caja; Type: TRIGGER; Schema: dbo; Owner: aitrolsystem
--

CREATE TRIGGER trg_compras_to_caja AFTER INSERT ON dbo.inv_compras_cab FOR EACH ROW EXECUTE FUNCTION dbo.trg_compras_to_caja();


--
-- Name: inv_kardex trg_kardex_costo; Type: TRIGGER; Schema: dbo; Owner: aitrolsystem
--

CREATE TRIGGER trg_kardex_costo AFTER INSERT ON dbo.inv_kardex FOR EACH ROW EXECUTE FUNCTION dbo.trg_kardex_costo();


--
-- Name: inv_ventas_cab trg_ventas_to_caja; Type: TRIGGER; Schema: dbo; Owner: aitrolsystem
--

CREATE TRIGGER trg_ventas_to_caja AFTER INSERT ON dbo.inv_ventas_cab FOR EACH ROW EXECUTE FUNCTION dbo.trg_ventas_to_caja();


--
-- Name: inv_cotizaciones_cab fk_cliente; Type: FK CONSTRAINT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.inv_cotizaciones_cab
    ADD CONSTRAINT fk_cliente FOREIGN KEY (cliente_id) REFERENCES dbo.clientes(id) ON DELETE RESTRICT;


--
-- Name: inv_cotizaciones_det fk_cotizacion; Type: FK CONSTRAINT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.inv_cotizaciones_det
    ADD CONSTRAINT fk_cotizacion FOREIGN KEY (cotizacion_id) REFERENCES dbo.inv_cotizaciones_cab(id) ON DELETE CASCADE;


--
-- Name: inv_cotizaciones_det fk_producto; Type: FK CONSTRAINT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.inv_cotizaciones_det
    ADD CONSTRAINT fk_producto FOREIGN KEY (producto_id) REFERENCES dbo.inv_productos(id) ON DELETE RESTRICT;


--
-- Name: inv_cotizaciones_cab fk_sucursal; Type: FK CONSTRAINT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.inv_cotizaciones_cab
    ADD CONSTRAINT fk_sucursal FOREIGN KEY (id_sucursal) REFERENCES dbo.sis_sucursal(id_sucursal) ON DELETE RESTRICT;


--
-- Name: usuarios_sucursales fk_sucursal; Type: FK CONSTRAINT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.usuarios_sucursales
    ADD CONSTRAINT fk_sucursal FOREIGN KEY (id_sucursal) REFERENCES dbo.sis_sucursal(id_sucursal) ON DELETE CASCADE;


--
-- Name: usuarios_sucursales fk_usuario; Type: FK CONSTRAINT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.usuarios_sucursales
    ADD CONSTRAINT fk_usuario FOREIGN KEY (user_id) REFERENCES dbo.usuarios(id) ON DELETE CASCADE;


--
-- Name: notificaciones_leidas notificaciones_leidas_notificacion_id_fkey; Type: FK CONSTRAINT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.notificaciones_leidas
    ADD CONSTRAINT notificaciones_leidas_notificacion_id_fkey FOREIGN KEY (notificacion_id) REFERENCES dbo.notificaciones(id) ON DELETE CASCADE;


--
-- Name: notificaciones_leidas notificaciones_leidas_usuario_id_fkey; Type: FK CONSTRAINT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.notificaciones_leidas
    ADD CONSTRAINT notificaciones_leidas_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES dbo.usuarios(id);


--
-- Name: rh_cargos rh_cargos_id_area_fkey; Type: FK CONSTRAINT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.rh_cargos
    ADD CONSTRAINT rh_cargos_id_area_fkey FOREIGN KEY (id_area) REFERENCES dbo.rh_areas(id);


--
-- Name: rh_cargos rh_cargos_id_nivel_fkey; Type: FK CONSTRAINT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.rh_cargos
    ADD CONSTRAINT rh_cargos_id_nivel_fkey FOREIGN KEY (id_nivel) REFERENCES dbo.rh_niveles_jerarquicos(id);


--
-- Name: rh_contratos rh_contratos_cargo_id_fkey; Type: FK CONSTRAINT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.rh_contratos
    ADD CONSTRAINT rh_contratos_cargo_id_fkey FOREIGN KEY (cargo_id) REFERENCES dbo.rh_cargos(id);


--
-- Name: rh_contratos rh_contratos_empleado_id_fkey; Type: FK CONSTRAINT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.rh_contratos
    ADD CONSTRAINT rh_contratos_empleado_id_fkey FOREIGN KEY (empleado_id) REFERENCES dbo.rh_empleados(id);


--
-- Name: rh_documentos_empleado rh_documentos_empleado_empleado_id_fkey; Type: FK CONSTRAINT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.rh_documentos_empleado
    ADD CONSTRAINT rh_documentos_empleado_empleado_id_fkey FOREIGN KEY (empleado_id) REFERENCES dbo.rh_empleados(id) ON DELETE CASCADE;


--
-- Name: rh_empleados rh_empleados_rh_cargos_id_fk; Type: FK CONSTRAINT; Schema: dbo; Owner: aitrolsystem
--

ALTER TABLE ONLY dbo.rh_empleados
    ADD CONSTRAINT rh_empleados_rh_cargos_id_fk FOREIGN KEY (cargo_id) REFERENCES dbo.rh_cargos(id);


--
-- Name: adjuntos adjuntos_cargado_por_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.adjuntos
    ADD CONSTRAINT adjuntos_cargado_por_fkey FOREIGN KEY (cargado_por) REFERENCES salud.personal(id);


--
-- Name: adjuntos adjuntos_historia_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.adjuntos
    ADD CONSTRAINT adjuntos_historia_id_fkey FOREIGN KEY (historia_id) REFERENCES salud.historia_clinica(id) ON DELETE CASCADE;


--
-- Name: afiliaciones afiliaciones_aseguradora_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.afiliaciones
    ADD CONSTRAINT afiliaciones_aseguradora_id_fkey FOREIGN KEY (aseguradora_id) REFERENCES salud.aseguradoras(id);


--
-- Name: afiliaciones afiliaciones_persona_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.afiliaciones
    ADD CONSTRAINT afiliaciones_persona_id_fkey FOREIGN KEY (persona_id) REFERENCES salud.personas(id) ON DELETE CASCADE;


--
-- Name: afiliaciones afiliaciones_sis_sucursal_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.afiliaciones
    ADD CONSTRAINT afiliaciones_sis_sucursal_id_fkey FOREIGN KEY (sis_sucursal_id) REFERENCES dbo.sis_sucursal(id_sucursal);


--
-- Name: agendas agendas_creado_por_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.agendas
    ADD CONSTRAINT agendas_creado_por_fkey FOREIGN KEY (creado_por) REFERENCES dbo.usuarios(id);


--
-- Name: agendas agendas_personal_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.agendas
    ADD CONSTRAINT agendas_personal_id_fkey FOREIGN KEY (personal_id) REFERENCES salud.personal(id);


--
-- Name: agendas agendas_sis_sucursal_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.agendas
    ADD CONSTRAINT agendas_sis_sucursal_id_fkey FOREIGN KEY (sis_sucursal_id) REFERENCES dbo.sis_sucursal(id_sucursal);


--
-- Name: agendas agendas_unidad_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.agendas
    ADD CONSTRAINT agendas_unidad_id_fkey FOREIGN KEY (unidad_id) REFERENCES salud.unidades(id);


--
-- Name: anestesia_registros anestesia_registros_programacion_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.anestesia_registros
    ADD CONSTRAINT anestesia_registros_programacion_id_fkey FOREIGN KEY (programacion_id) REFERENCES salud.programacion_quirofano(id);


--
-- Name: camas camas_sala_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.camas
    ADD CONSTRAINT camas_sala_id_fkey FOREIGN KEY (sala_id) REFERENCES salud.salas(id) ON DELETE CASCADE;


--
-- Name: citas citas_agenda_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.citas
    ADD CONSTRAINT citas_agenda_id_fkey FOREIGN KEY (agenda_id) REFERENCES salud.agendas(id);


--
-- Name: citas citas_cama_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.citas
    ADD CONSTRAINT citas_cama_id_fkey FOREIGN KEY (cama_id) REFERENCES salud.camas(id);


--
-- Name: citas citas_paciente_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.citas
    ADD CONSTRAINT citas_paciente_id_fkey FOREIGN KEY (paciente_id) REFERENCES salud.pacientes(id);


--
-- Name: citas citas_personal_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.citas
    ADD CONSTRAINT citas_personal_id_fkey FOREIGN KEY (personal_id) REFERENCES salud.personal(id);


--
-- Name: citas citas_sala_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.citas
    ADD CONSTRAINT citas_sala_id_fkey FOREIGN KEY (sala_id) REFERENCES salud.salas(id);


--
-- Name: citas citas_sis_sucursal_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.citas
    ADD CONSTRAINT citas_sis_sucursal_id_fkey FOREIGN KEY (sis_sucursal_id) REFERENCES dbo.sis_sucursal(id_sucursal);


--
-- Name: consulta_diagnosticos consulta_diagnosticos_consulta_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.consulta_diagnosticos
    ADD CONSTRAINT consulta_diagnosticos_consulta_id_fkey FOREIGN KEY (consulta_id) REFERENCES salud.consulta_medica(id) ON DELETE CASCADE;


--
-- Name: consulta_diagnosticos consulta_diagnosticos_diagnostico_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.consulta_diagnosticos
    ADD CONSTRAINT consulta_diagnosticos_diagnostico_id_fkey FOREIGN KEY (diagnostico_id) REFERENCES salud.diagnosticos_cat(id);


--
-- Name: consulta_medica consulta_medica_historia_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.consulta_medica
    ADD CONSTRAINT consulta_medica_historia_id_fkey FOREIGN KEY (historia_id) REFERENCES salud.historia_clinica(id) ON DELETE CASCADE;


--
-- Name: consulta_medica consulta_medica_registrado_por_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.consulta_medica
    ADD CONSTRAINT consulta_medica_registrado_por_fkey FOREIGN KEY (registrado_por) REFERENCES salud.personal(id);


--
-- Name: contactos_emergencia contactos_emergencia_persona_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.contactos_emergencia
    ADD CONSTRAINT contactos_emergencia_persona_id_fkey FOREIGN KEY (persona_id) REFERENCES salud.personas(id) ON DELETE CASCADE;


--
-- Name: dispensaciones_detalle dispensaciones_detalle_dispensacion_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.dispensaciones_detalle
    ADD CONSTRAINT dispensaciones_detalle_dispensacion_id_fkey FOREIGN KEY (dispensacion_id) REFERENCES salud.dispensaciones(id) ON DELETE CASCADE;


--
-- Name: dispensaciones_detalle dispensaciones_detalle_producto_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.dispensaciones_detalle
    ADD CONSTRAINT dispensaciones_detalle_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES dbo.inv_productos(id);


--
-- Name: dispensaciones dispensaciones_paciente_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.dispensaciones
    ADD CONSTRAINT dispensaciones_paciente_id_fkey FOREIGN KEY (paciente_id) REFERENCES salud.pacientes(id);


--
-- Name: dispensaciones dispensaciones_personal_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.dispensaciones
    ADD CONSTRAINT dispensaciones_personal_id_fkey FOREIGN KEY (personal_id) REFERENCES salud.personal(id);


--
-- Name: dispensaciones dispensaciones_receta_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.dispensaciones
    ADD CONSTRAINT dispensaciones_receta_id_fkey FOREIGN KEY (receta_id) REFERENCES salud.recetas(id);


--
-- Name: dispensaciones dispensaciones_sis_sucursal_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.dispensaciones
    ADD CONSTRAINT dispensaciones_sis_sucursal_id_fkey FOREIGN KEY (sis_sucursal_id) REFERENCES dbo.sis_sucursal(id_sucursal);


--
-- Name: emergencias emergencias_encuentro_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.emergencias
    ADD CONSTRAINT emergencias_encuentro_id_fkey FOREIGN KEY (encuentro_id) REFERENCES salud.encuentros(id) ON DELETE SET NULL;


--
-- Name: emergencias emergencias_paciente_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.emergencias
    ADD CONSTRAINT emergencias_paciente_id_fkey FOREIGN KEY (paciente_id) REFERENCES salud.pacientes(id);


--
-- Name: emergencias emergencias_responsable_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.emergencias
    ADD CONSTRAINT emergencias_responsable_fkey FOREIGN KEY (responsable) REFERENCES salud.personal(id);


--
-- Name: emergencias emergencias_triage_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.emergencias
    ADD CONSTRAINT emergencias_triage_id_fkey FOREIGN KEY (triage_id) REFERENCES salud.triajes(id);


--
-- Name: encuentros encuentros_creado_por_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.encuentros
    ADD CONSTRAINT encuentros_creado_por_fkey FOREIGN KEY (creado_por) REFERENCES dbo.usuarios(id);


--
-- Name: encuentros encuentros_paciente_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.encuentros
    ADD CONSTRAINT encuentros_paciente_id_fkey FOREIGN KEY (paciente_id) REFERENCES salud.pacientes(id);


--
-- Name: encuentros encuentros_personal_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.encuentros
    ADD CONSTRAINT encuentros_personal_id_fkey FOREIGN KEY (personal_id) REFERENCES salud.personal(id);


--
-- Name: epicrisis epicrisis_firmado_por_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.epicrisis
    ADD CONSTRAINT epicrisis_firmado_por_fkey FOREIGN KEY (firmado_por) REFERENCES salud.personal(id);


--
-- Name: epicrisis epicrisis_historia_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.epicrisis
    ADD CONSTRAINT epicrisis_historia_id_fkey FOREIGN KEY (historia_id) REFERENCES salud.historia_clinica(id);


--
-- Name: evoluciones evoluciones_historia_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.evoluciones
    ADD CONSTRAINT evoluciones_historia_id_fkey FOREIGN KEY (historia_id) REFERENCES salud.historia_clinica(id) ON DELETE CASCADE;


--
-- Name: evoluciones evoluciones_personal_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.evoluciones
    ADD CONSTRAINT evoluciones_personal_id_fkey FOREIGN KEY (personal_id) REFERENCES salud.personal(id);


--
-- Name: examen_fisico examen_fisico_consulta_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.examen_fisico
    ADD CONSTRAINT examen_fisico_consulta_id_fkey FOREIGN KEY (consulta_id) REFERENCES salud.consulta_medica(id) ON DELETE CASCADE;


--
-- Name: facturas_clinicas_detalle facturas_clinicas_detalle_codigo_producto_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.facturas_clinicas_detalle
    ADD CONSTRAINT facturas_clinicas_detalle_codigo_producto_fkey FOREIGN KEY (codigo_producto) REFERENCES dbo.inv_productos(id);


--
-- Name: facturas_clinicas_detalle facturas_clinicas_detalle_factura_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.facturas_clinicas_detalle
    ADD CONSTRAINT facturas_clinicas_detalle_factura_id_fkey FOREIGN KEY (factura_id) REFERENCES salud.facturas_clinicas(id) ON DELETE CASCADE;


--
-- Name: facturas_clinicas facturas_clinicas_ingreso_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.facturas_clinicas
    ADD CONSTRAINT facturas_clinicas_ingreso_id_fkey FOREIGN KEY (ingreso_id) REFERENCES salud.ingresos(id);


--
-- Name: facturas_clinicas facturas_clinicas_paciente_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.facturas_clinicas
    ADD CONSTRAINT facturas_clinicas_paciente_id_fkey FOREIGN KEY (paciente_id) REFERENCES salud.pacientes(id);


--
-- Name: facturas_clinicas facturas_clinicas_sis_sucursal_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.facturas_clinicas
    ADD CONSTRAINT facturas_clinicas_sis_sucursal_id_fkey FOREIGN KEY (sis_sucursal_id) REFERENCES dbo.sis_sucursal(id_sucursal);


--
-- Name: historia_antecedentes historia_antecedentes_historia_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.historia_antecedentes
    ADD CONSTRAINT historia_antecedentes_historia_id_fkey FOREIGN KEY (historia_id) REFERENCES salud.historia_clinica(id) ON DELETE CASCADE;


--
-- Name: historia_auditoria historia_auditoria_historia_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.historia_auditoria
    ADD CONSTRAINT historia_auditoria_historia_id_fkey FOREIGN KEY (historia_id) REFERENCES salud.historia_clinica(id);


--
-- Name: historia_auditoria historia_auditoria_usuario_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.historia_auditoria
    ADD CONSTRAINT historia_auditoria_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES dbo.usuarios(id);


--
-- Name: historia_clinica historia_clinica_creado_por_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.historia_clinica
    ADD CONSTRAINT historia_clinica_creado_por_fkey FOREIGN KEY (creado_por) REFERENCES dbo.usuarios(id);


--
-- Name: historia_clinica historia_clinica_paciente_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.historia_clinica
    ADD CONSTRAINT historia_clinica_paciente_id_fkey FOREIGN KEY (paciente_id) REFERENCES salud.pacientes(id);


--
-- Name: historia_clinica historia_clinica_responsable_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.historia_clinica
    ADD CONSTRAINT historia_clinica_responsable_id_fkey FOREIGN KEY (responsable_id) REFERENCES salud.personal(id);


--
-- Name: ingresos ingresos_cama_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.ingresos
    ADD CONSTRAINT ingresos_cama_id_fkey FOREIGN KEY (cama_id) REFERENCES salud.camas(id);


--
-- Name: ingresos ingresos_creador_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.ingresos
    ADD CONSTRAINT ingresos_creador_fkey FOREIGN KEY (creador) REFERENCES dbo.usuarios(id);


--
-- Name: ingresos ingresos_medico_tratante_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.ingresos
    ADD CONSTRAINT ingresos_medico_tratante_fkey FOREIGN KEY (medico_tratante) REFERENCES salud.personal(id);


--
-- Name: ingresos ingresos_paciente_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.ingresos
    ADD CONSTRAINT ingresos_paciente_id_fkey FOREIGN KEY (paciente_id) REFERENCES salud.pacientes(id);


--
-- Name: ingresos ingresos_sala_ingreso_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.ingresos
    ADD CONSTRAINT ingresos_sala_ingreso_id_fkey FOREIGN KEY (sala_ingreso_id) REFERENCES salud.salas(id);


--
-- Name: ingresos ingresos_unidad_ingreso_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.ingresos
    ADD CONSTRAINT ingresos_unidad_ingreso_id_fkey FOREIGN KEY (unidad_ingreso_id) REFERENCES salud.unidades(id);


--
-- Name: interconsultas interconsultas_creado_por_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.interconsultas
    ADD CONSTRAINT interconsultas_creado_por_fkey FOREIGN KEY (creado_por) REFERENCES salud.personal(id);


--
-- Name: interconsultas interconsultas_historia_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.interconsultas
    ADD CONSTRAINT interconsultas_historia_id_fkey FOREIGN KEY (historia_id) REFERENCES salud.historia_clinica(id) ON DELETE CASCADE;


--
-- Name: mar mar_administrado_por_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.mar
    ADD CONSTRAINT mar_administrado_por_fkey FOREIGN KEY (administrado_por) REFERENCES salud.personal(id);


--
-- Name: mar mar_ingreso_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.mar
    ADD CONSTRAINT mar_ingreso_id_fkey FOREIGN KEY (ingreso_id) REFERENCES salud.ingresos(id);


--
-- Name: mar mar_medicamento_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.mar
    ADD CONSTRAINT mar_medicamento_id_fkey FOREIGN KEY (medicamento_id) REFERENCES salud.medicamentos(id);


--
-- Name: mar mar_paciente_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.mar
    ADD CONSTRAINT mar_paciente_id_fkey FOREIGN KEY (paciente_id) REFERENCES salud.pacientes(id);


--
-- Name: mar mar_producto_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.mar
    ADD CONSTRAINT mar_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES dbo.inv_productos(id);


--
-- Name: medicamentos medicamentos_producto_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.medicamentos
    ADD CONSTRAINT medicamentos_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES dbo.inv_productos(id) ON DELETE CASCADE;


--
-- Name: muestras muestras_examen_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.muestras
    ADD CONSTRAINT muestras_examen_id_fkey FOREIGN KEY (examen_id) REFERENCES salud.examenes(id);


--
-- Name: muestras muestras_orden_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.muestras
    ADD CONSTRAINT muestras_orden_id_fkey FOREIGN KEY (orden_id) REFERENCES salud.ordenes_laboratorio(id) ON DELETE CASCADE;


--
-- Name: muestras muestras_recoleccion_por_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.muestras
    ADD CONSTRAINT muestras_recoleccion_por_fkey FOREIGN KEY (recoleccion_por) REFERENCES salud.personal(id);


--
-- Name: ordenes_imagenologia ordenes_imagenologia_paciente_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.ordenes_imagenologia
    ADD CONSTRAINT ordenes_imagenologia_paciente_id_fkey FOREIGN KEY (paciente_id) REFERENCES salud.pacientes(id);


--
-- Name: ordenes_imagenologia ordenes_imagenologia_pedido_por_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.ordenes_imagenologia
    ADD CONSTRAINT ordenes_imagenologia_pedido_por_fkey FOREIGN KEY (pedido_por) REFERENCES salud.personal(id);


--
-- Name: ordenes_imagenologia ordenes_imagenologia_sis_sucursal_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.ordenes_imagenologia
    ADD CONSTRAINT ordenes_imagenologia_sis_sucursal_id_fkey FOREIGN KEY (sis_sucursal_id) REFERENCES dbo.sis_sucursal(id_sucursal);


--
-- Name: ordenes_laboratorio ordenes_laboratorio_paciente_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.ordenes_laboratorio
    ADD CONSTRAINT ordenes_laboratorio_paciente_id_fkey FOREIGN KEY (paciente_id) REFERENCES salud.pacientes(id);


--
-- Name: ordenes_laboratorio ordenes_laboratorio_pedido_por_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.ordenes_laboratorio
    ADD CONSTRAINT ordenes_laboratorio_pedido_por_fkey FOREIGN KEY (pedido_por) REFERENCES salud.personal(id);


--
-- Name: ordenes_laboratorio ordenes_laboratorio_sis_sucursal_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.ordenes_laboratorio
    ADD CONSTRAINT ordenes_laboratorio_sis_sucursal_id_fkey FOREIGN KEY (sis_sucursal_id) REFERENCES dbo.sis_sucursal(id_sucursal);


--
-- Name: pacientes pacientes_persona_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.pacientes
    ADD CONSTRAINT pacientes_persona_id_fkey FOREIGN KEY (persona_id) REFERENCES salud.personas(id) ON DELETE CASCADE;


--
-- Name: pacientes pacientes_sis_sucursal_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.pacientes
    ADD CONSTRAINT pacientes_sis_sucursal_id_fkey FOREIGN KEY (sis_sucursal_id) REFERENCES dbo.sis_sucursal(id_sucursal);


--
-- Name: personal personal_persona_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.personal
    ADD CONSTRAINT personal_persona_id_fkey FOREIGN KEY (persona_id) REFERENCES salud.personas(id) ON DELETE CASCADE;


--
-- Name: personal personal_sis_sucursal_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.personal
    ADD CONSTRAINT personal_sis_sucursal_id_fkey FOREIGN KEY (sis_sucursal_id) REFERENCES dbo.sis_sucursal(id_sucursal);


--
-- Name: personal personal_usuario_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.personal
    ADD CONSTRAINT personal_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES dbo.usuarios(id);


--
-- Name: pisos pisos_sede_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.pisos
    ADD CONSTRAINT pisos_sede_id_fkey FOREIGN KEY (sede_id) REFERENCES salud.sedes(id) ON DELETE CASCADE;


--
-- Name: procedimientos_insumos procedimientos_insumos_creado_por_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.procedimientos_insumos
    ADD CONSTRAINT procedimientos_insumos_creado_por_fkey FOREIGN KEY (creado_por) REFERENCES dbo.usuarios(id);


--
-- Name: procedimientos_insumos procedimientos_insumos_procedimiento_realizado_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.procedimientos_insumos
    ADD CONSTRAINT procedimientos_insumos_procedimiento_realizado_id_fkey FOREIGN KEY (procedimiento_realizado_id) REFERENCES salud.procedimientos_realizados(id) ON DELETE CASCADE;


--
-- Name: procedimientos_insumos procedimientos_insumos_producto_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.procedimientos_insumos
    ADD CONSTRAINT procedimientos_insumos_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES dbo.inv_productos(id);


--
-- Name: procedimientos_realizados procedimientos_realizados_ingreso_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.procedimientos_realizados
    ADD CONSTRAINT procedimientos_realizados_ingreso_id_fkey FOREIGN KEY (ingreso_id) REFERENCES salud.ingresos(id);


--
-- Name: procedimientos_realizados procedimientos_realizados_paciente_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.procedimientos_realizados
    ADD CONSTRAINT procedimientos_realizados_paciente_id_fkey FOREIGN KEY (paciente_id) REFERENCES salud.pacientes(id);


--
-- Name: procedimientos_realizados procedimientos_realizados_personal_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.procedimientos_realizados
    ADD CONSTRAINT procedimientos_realizados_personal_id_fkey FOREIGN KEY (personal_id) REFERENCES salud.personal(id);


--
-- Name: procedimientos_realizados procedimientos_realizados_procedimiento_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.procedimientos_realizados
    ADD CONSTRAINT procedimientos_realizados_procedimiento_id_fkey FOREIGN KEY (procedimiento_id) REFERENCES salud.procedimientos(id);


--
-- Name: procedimientos_realizados procedimientos_realizados_quirofano_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.procedimientos_realizados
    ADD CONSTRAINT procedimientos_realizados_quirofano_id_fkey FOREIGN KEY (quirofano_id) REFERENCES salud.quirofanos(id);


--
-- Name: procedimientos_realizados procedimientos_realizados_sala_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.procedimientos_realizados
    ADD CONSTRAINT procedimientos_realizados_sala_id_fkey FOREIGN KEY (sala_id) REFERENCES salud.salas(id);


--
-- Name: programacion_quirofano programacion_quirofano_anestesista_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.programacion_quirofano
    ADD CONSTRAINT programacion_quirofano_anestesista_id_fkey FOREIGN KEY (anestesista_id) REFERENCES salud.personal(id);


--
-- Name: programacion_quirofano programacion_quirofano_medico_responsable_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.programacion_quirofano
    ADD CONSTRAINT programacion_quirofano_medico_responsable_fkey FOREIGN KEY (medico_responsable) REFERENCES salud.personal(id);


--
-- Name: programacion_quirofano programacion_quirofano_paciente_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.programacion_quirofano
    ADD CONSTRAINT programacion_quirofano_paciente_id_fkey FOREIGN KEY (paciente_id) REFERENCES salud.pacientes(id);


--
-- Name: programacion_quirofano programacion_quirofano_procedimiento_realizado_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.programacion_quirofano
    ADD CONSTRAINT programacion_quirofano_procedimiento_realizado_id_fkey FOREIGN KEY (procedimiento_realizado_id) REFERENCES salud.procedimientos_realizados(id);


--
-- Name: programacion_quirofano programacion_quirofano_quirofano_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.programacion_quirofano
    ADD CONSTRAINT programacion_quirofano_quirofano_id_fkey FOREIGN KEY (quirofano_id) REFERENCES salud.quirofanos(id);


--
-- Name: quirofanos quirofanos_unidad_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.quirofanos
    ADD CONSTRAINT quirofanos_unidad_id_fkey FOREIGN KEY (unidad_id) REFERENCES salud.unidades(id);


--
-- Name: recetas_detalle recetas_detalle_creado_por_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.recetas_detalle
    ADD CONSTRAINT recetas_detalle_creado_por_fkey FOREIGN KEY (creado_por) REFERENCES salud.personal(id);


--
-- Name: recetas_detalle recetas_detalle_medicamento_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.recetas_detalle
    ADD CONSTRAINT recetas_detalle_medicamento_id_fkey FOREIGN KEY (medicamento_id) REFERENCES salud.medicamentos(id);


--
-- Name: recetas_detalle recetas_detalle_producto_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.recetas_detalle
    ADD CONSTRAINT recetas_detalle_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES dbo.inv_productos(id);


--
-- Name: recetas_detalle recetas_detalle_receta_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.recetas_detalle
    ADD CONSTRAINT recetas_detalle_receta_id_fkey FOREIGN KEY (receta_id) REFERENCES salud.recetas(id) ON DELETE CASCADE;


--
-- Name: recetas recetas_paciente_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.recetas
    ADD CONSTRAINT recetas_paciente_id_fkey FOREIGN KEY (paciente_id) REFERENCES salud.pacientes(id);


--
-- Name: recetas recetas_prescriptor_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.recetas
    ADD CONSTRAINT recetas_prescriptor_id_fkey FOREIGN KEY (prescriptor_id) REFERENCES salud.personal(id);


--
-- Name: recetas recetas_sis_sucursal_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.recetas
    ADD CONSTRAINT recetas_sis_sucursal_id_fkey FOREIGN KEY (sis_sucursal_id) REFERENCES dbo.sis_sucursal(id_sucursal);


--
-- Name: resultados_imagenologia resultados_imagenologia_orden_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.resultados_imagenologia
    ADD CONSTRAINT resultados_imagenologia_orden_id_fkey FOREIGN KEY (orden_id) REFERENCES salud.ordenes_imagenologia(id) ON DELETE CASCADE;


--
-- Name: resultados_imagenologia resultados_imagenologia_tecnico_responsable_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.resultados_imagenologia
    ADD CONSTRAINT resultados_imagenologia_tecnico_responsable_fkey FOREIGN KEY (tecnico_responsable) REFERENCES salud.personal(id);


--
-- Name: resultados_laboratorio resultados_laboratorio_creado_por_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.resultados_laboratorio
    ADD CONSTRAINT resultados_laboratorio_creado_por_fkey FOREIGN KEY (creado_por) REFERENCES salud.personal(id);


--
-- Name: resultados_laboratorio resultados_laboratorio_examen_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.resultados_laboratorio
    ADD CONSTRAINT resultados_laboratorio_examen_id_fkey FOREIGN KEY (examen_id) REFERENCES salud.examenes(id);


--
-- Name: resultados_laboratorio resultados_laboratorio_muestra_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.resultados_laboratorio
    ADD CONSTRAINT resultados_laboratorio_muestra_id_fkey FOREIGN KEY (muestra_id) REFERENCES salud.muestras(id) ON DELETE SET NULL;


--
-- Name: resultados_laboratorio resultados_laboratorio_orden_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.resultados_laboratorio
    ADD CONSTRAINT resultados_laboratorio_orden_id_fkey FOREIGN KEY (orden_id) REFERENCES salud.ordenes_laboratorio(id) ON DELETE CASCADE;


--
-- Name: salas salas_unidad_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.salas
    ADD CONSTRAINT salas_unidad_id_fkey FOREIGN KEY (unidad_id) REFERENCES salud.unidades(id) ON DELETE CASCADE;


--
-- Name: sedes sedes_sis_sucursal_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.sedes
    ADD CONSTRAINT sedes_sis_sucursal_id_fkey FOREIGN KEY (sis_sucursal_id) REFERENCES dbo.sis_sucursal(id_sucursal);


--
-- Name: signos_vitales signos_vitales_encuentro_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.signos_vitales
    ADD CONSTRAINT signos_vitales_encuentro_id_fkey FOREIGN KEY (encuentro_id) REFERENCES salud.encuentros(id);


--
-- Name: signos_vitales signos_vitales_paciente_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.signos_vitales
    ADD CONSTRAINT signos_vitales_paciente_id_fkey FOREIGN KEY (paciente_id) REFERENCES salud.pacientes(id);


--
-- Name: signos_vitales signos_vitales_personal_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.signos_vitales
    ADD CONSTRAINT signos_vitales_personal_id_fkey FOREIGN KEY (personal_id) REFERENCES salud.personal(id);


--
-- Name: transferencias_internas transferencias_internas_desde_cama_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.transferencias_internas
    ADD CONSTRAINT transferencias_internas_desde_cama_id_fkey FOREIGN KEY (desde_cama_id) REFERENCES salud.camas(id);


--
-- Name: transferencias_internas transferencias_internas_desde_sala_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.transferencias_internas
    ADD CONSTRAINT transferencias_internas_desde_sala_id_fkey FOREIGN KEY (desde_sala_id) REFERENCES salud.salas(id);


--
-- Name: transferencias_internas transferencias_internas_desde_unidad_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.transferencias_internas
    ADD CONSTRAINT transferencias_internas_desde_unidad_id_fkey FOREIGN KEY (desde_unidad_id) REFERENCES salud.unidades(id);


--
-- Name: transferencias_internas transferencias_internas_hasta_cama_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.transferencias_internas
    ADD CONSTRAINT transferencias_internas_hasta_cama_id_fkey FOREIGN KEY (hasta_cama_id) REFERENCES salud.camas(id);


--
-- Name: transferencias_internas transferencias_internas_hasta_sala_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.transferencias_internas
    ADD CONSTRAINT transferencias_internas_hasta_sala_id_fkey FOREIGN KEY (hasta_sala_id) REFERENCES salud.salas(id);


--
-- Name: transferencias_internas transferencias_internas_hasta_unidad_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.transferencias_internas
    ADD CONSTRAINT transferencias_internas_hasta_unidad_id_fkey FOREIGN KEY (hasta_unidad_id) REFERENCES salud.unidades(id);


--
-- Name: transferencias_internas transferencias_internas_ingreso_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.transferencias_internas
    ADD CONSTRAINT transferencias_internas_ingreso_id_fkey FOREIGN KEY (ingreso_id) REFERENCES salud.ingresos(id) ON DELETE CASCADE;


--
-- Name: transferencias_internas transferencias_internas_responsable_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.transferencias_internas
    ADD CONSTRAINT transferencias_internas_responsable_fkey FOREIGN KEY (responsable) REFERENCES salud.personal(id);


--
-- Name: tratamientos tratamientos_consulta_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.tratamientos
    ADD CONSTRAINT tratamientos_consulta_id_fkey FOREIGN KEY (consulta_id) REFERENCES salud.consulta_medica(id) ON DELETE CASCADE;


--
-- Name: tratamientos tratamientos_creado_por_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.tratamientos
    ADD CONSTRAINT tratamientos_creado_por_fkey FOREIGN KEY (creado_por) REFERENCES salud.personal(id);


--
-- Name: triajes triajes_encuentro_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.triajes
    ADD CONSTRAINT triajes_encuentro_id_fkey FOREIGN KEY (encuentro_id) REFERENCES salud.encuentros(id) ON DELETE SET NULL;


--
-- Name: triajes triajes_paciente_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.triajes
    ADD CONSTRAINT triajes_paciente_id_fkey FOREIGN KEY (paciente_id) REFERENCES salud.pacientes(id);


--
-- Name: triajes triajes_personal_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.triajes
    ADD CONSTRAINT triajes_personal_id_fkey FOREIGN KEY (personal_id) REFERENCES salud.personal(id);


--
-- Name: triajes triajes_sis_sucursal_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.triajes
    ADD CONSTRAINT triajes_sis_sucursal_id_fkey FOREIGN KEY (sis_sucursal_id) REFERENCES dbo.sis_sucursal(id_sucursal);


--
-- Name: unidades unidades_piso_id_fkey; Type: FK CONSTRAINT; Schema: salud; Owner: aitrolsystem
--

ALTER TABLE ONLY salud.unidades
    ADD CONSTRAINT unidades_piso_id_fkey FOREIGN KEY (piso_id) REFERENCES salud.pisos(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict FvtS7d0l70uhKIZRV1E3ae9f9pPLx4CyhFOQcbwlSzRKe1WKSawDySAxWYoDe7B


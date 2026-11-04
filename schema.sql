-- UniMarket: esquema para Supabase (PostgreSQL)
-- Ejecutar completo en: Supabase > SQL Editor > New query > Run
-- Si ya habias creado las tablas con otro script, borralas antes:
--   drop table if exists resena, compra, producto, usuario cascade;

-- ---------- Tablas ----------

create table usuario (
  id bigint generated always as identity primary key,
  nombre text not null,
  email text not null unique,
  password_hash text not null
);

create table producto (
  id bigint generated always as identity primary key,
  vendedor_id bigint not null references usuario(id) on delete cascade,
  categoria varchar(30) not null,
  descripcion varchar(500) not null,
  nombre varchar(80) not null check (char_length(nombre) >= 3),
  precio numeric(10,2) not null check (precio > 0),
  stock integer not null default 0 check (stock >= 0),
  creado_en timestamptz not null default now()
);

-- La compra es un historial: si se borra el producto, la compra se conserva
-- (por eso producto_id admite null y se guardan copias de nombre y precio).
create table compra (
  id bigint generated always as identity primary key,
  producto_id bigint references producto(id) on delete set null,
  comprador_id bigint not null references usuario(id),
  vendedor_id bigint not null references usuario(id),
  cantidad integer not null check (cantidad > 0),
  fecha timestamptz not null default now(),
  precio_unitario numeric(10,2) not null,
  producto_nombre varchar(80) not null,
  total numeric(10,2) not null
);

create table resena (
  id bigint generated always as identity primary key,
  producto_id bigint not null references producto(id) on delete cascade,
  usuario_id bigint not null references usuario(id) on delete cascade,
  calificacion integer not null check (calificacion between 1 and 5),
  comentario varchar(500) not null,
  fecha timestamptz not null default now(),
  constraint resena_unica unique (producto_id, usuario_id)
);

-- ---------- Indices en las llaves foraneas ----------

create index on producto (vendedor_id);
create index on resena (producto_id);
create index on compra (comprador_id);
create index on compra (vendedor_id);

-- ---------- Seguridad ----------
-- RLS activado y SIN politicas: la API publica (clave anon) no puede leer ni
-- escribir nada. Solo el backend, con la clave service_role, accede a los datos.

alter table usuario enable row level security;
alter table producto enable row level security;
alter table compra enable row level security;
alter table resena enable row level security;

-- ---------- Compra atomica ----------
-- Revisa el stock, lo descuenta y registra la compra en una sola transaccion,
-- bloqueando la fila del producto para que dos compras simultaneas no vendan
-- la misma unidad dos veces.

create or replace function comprar_producto(p_producto bigint, p_comprador bigint, p_cantidad integer)
returns compra
language plpgsql
set search_path = public
as $$
declare
  p producto%rowtype;
  c compra%rowtype;
begin
  select * into p from producto where id = p_producto for update;

  if not found then
    raise exception 'NO_ENCONTRADO';
  end if;

  if p.vendedor_id = p_comprador then
    raise exception 'PROPIO';
  end if;

  if p.stock < p_cantidad then
    raise exception 'STOCK:%', p.stock;
  end if;

  update producto set stock = stock - p_cantidad where id = p.id;

  insert into compra (producto_id, comprador_id, vendedor_id, cantidad,
                      precio_unitario, producto_nombre, total)
  values (p.id, p_comprador, p.vendedor_id, p_cantidad,
          p.precio, p.nombre, round(p.precio * p_cantidad, 2))
  returning * into c;

  return c;
end;
$$;

-- Solo el backend (service_role) puede llamar a la funcion.
revoke execute on function comprar_producto(bigint, bigint, integer) from public, anon, authenticated;
grant execute on function comprar_producto(bigint, bigint, integer) to service_role;

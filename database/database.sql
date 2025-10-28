-- Crear la base de datos

CREATE DATABASE libreria;

-- Tabla de usuarios

CREATE TABLE usuarios (
  id_usuarios SERIAL PRIMARY KEY, 
  email VARCHAR(75) NOT NULL, 
  password VARCHAR(1000) NOT NULL, 
  nombre VARCHAR(50) NOT NULL, 
  apellido VARCHAR(50) NOT NULL,
  admin BOOLEAN DEFAULT false
);

-- Tabla de libros

CREATE TABLE libros (
  id_libros SERIAL PRIMARY KEY,
  titulo VARCHAR(250),
  autor VARCHAR(250),
  editorial VARCHAR(250),
  anio_publicacion DATE,
  genero VARCHAR(250),
  descripcion VARCHAR(2500),
  precio DECIMAL(15, 2),
  url_img VARCHAR(1000),
  estado BOOLEAN,
  usuario_id INT NOT NULL,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id_usuarios) ON DELETE CASCADE
);

-- Tabla de pedidos

CREATE TABLE pedido (
  id_pedido SERIAL PRIMARY KEY,
  fecha_pedido DATE,
  estado BOOLEAN DEFAULT false,
  monto_total DECIMAL(20, 2),
  usuario_id INT NOT NULL,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id_usuarios)
);

-- Tabla intermedia pedido_libros

CREATE TABLE pedido_libros (
  id_pedido_libro SERIAL PRIMARY KEY,
  pedido_id INT NOT NULL,
  libro_id INT NOT NULL,
  cantidad INT,
  precio_unitario DECIMAL(15, 2),
  FOREIGN KEY (pedido_id) REFERENCES pedido(id_pedido) ON DELETE CASCADE,
  FOREIGN KEY (libro_id) REFERENCES libros(id_libros) ON DELETE CASCADE
);
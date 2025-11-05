import { pool } from '../database/pool.js';

// CREATE TABLE pedido (
//   id_pedido SERIAL PRIMARY KEY,
//   fecha_pedido DATE,
//   estado BOOLEAN DEFAULT false,
//   monto_total DECIMAL(20, 2),
//   usuario_id INT NOT NULL,
//   FOREIGN KEY (usuario_id) REFERENCES usuarios(id_usuarios)
// );

// CREATE TABLE pedidos_libros (
//   id_pedido_libro SERIAL PRIMARY KEY,
//   pedido_id INT NOT NULL,
//   libro_id INT NOT NULL,
//   cantidad INT,
//   precio_unitario DECIMAL(15, 2),
//   FOREIGN KEY (pedido_id) REFERENCES pedidos(id_pedido) ON DELETE CASCADE,
//   FOREIGN KEY (libro_id) REFERENCES libros(id_libros) ON DELETE CASCADE
// );


const newOrder = async (monto_total, usuario_id, libros, estado = false) => {
  try {
    const queryPedido = `INSERT INTO pedidos (fecha_pedido, estado, monto_total, usuario_id)VALUES (NOW(), $1, $2, $3) RETURNING id_pedido;`;

    const pedidoValues = [estado, monto_total, usuario_id];
    const pedidoResult = await pool.query(queryPedido, pedidoValues);
    const pedidoId = pedidoResult.rows[0].id_pedido;

    const queryLibro = `INSERT INTO pedidos_libros (pedido_id, libro_id, cantidad, precio_unitario) VALUES ($1, $2, $3, $4);`;

    for (const libro of libros) {
      const values = [pedidoId, libro.libro_id, libro.cantidad, libro.precio_unitario];
      await pool.query(queryLibro, values);
    }

    return { id_pedido: pedidoId, mensaje: 'Pedido creado correctamente' };

  } catch (error) {
    throw new Error('Error al crear el pedido: ' + error.message);
  }
};

export { newOrder };
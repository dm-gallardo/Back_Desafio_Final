import { pool } from '../database/pool.js';
import { supabase } from '../supabaseClient.js';

const newOrder = async (monto_total, usuario_id, libros = [], estado = false) => {
  try {
    const { data: pedido, error: pedidoError } = await supabase
      .from('pedidos')
      .insert([
        {
          fecha_pedido: new Date().toISOString().split('T')[0], // formato YYYY-MM-DD
          estado,
          monto_total,
          usuario_id,
        },
      ])
      .select('id_pedido')
      .maybeSingle();

    if (pedidoError) throw pedidoError;
    if (!pedido) throw new Error('No se pudo crear el pedido');

    const pedidoId = pedido.id_pedido;

    for (const libro of libros) {
      const { error: libroError } = await supabase.from('pedidos_libros').insert([
        {
          pedido_id: pedidoId,
          libro_id: libro.libro_id,
          cantidad: libro.cantidad,
          precio_unitario: libro.precio_unitario,
        },
      ]);
      if (libroError) throw libroError;
    }

    return { id_pedido: pedidoId, mensaje: 'Pedido creado correctamente' };
  } catch (error) {
    throw new Error('Error al crear el pedido: ' + error.message);
  }
};

const getAllOrders = async () => {
  try {
    const { data, error } = await supabase
      .from('pedidos')
      .select('*')
      .order('id_pedido', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    throw new Error('Error al obtener pedidos: ' + error.message);
  }
};

const getOrderById = async (id_pedido) => {
  try {
    const { data: pedido, error: pedidoError } = await supabase
      .from('pedidos')
      .select('*')
      .eq('id_pedido', id_pedido)
      .maybeSingle();

    if (pedidoError) throw pedidoError;
    if (!pedido) return null;

    const { data: libros, error: librosError } = await supabase
      .from('pedidos_libros')
      .select('*')
      .eq('pedido_id', id_pedido);

    if (librosError) throw librosError;

    return { pedido, libros };
  } catch (error) {
    throw new Error('Error al obtener el pedido: ' + error.message);
  }
};

const getOrderByUser = async (usuario_id) => {
  try {
    const { data, error } = await supabase
      .from('pedidos')
      .select('*')
      .eq('usuario_id', usuario_id)
      .order('id_pedido', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    throw new Error('Error al obtener pedidos del usuario: ' + error.message);
  }
};

const deleteOrder = async (id_pedido) => {
  try {
    const { error, count } = await supabase
      .from('pedidos')
      .delete({ count: 'exact' })
      .eq('id_pedido', id_pedido);

    if (error) throw error;
    return count;
  } catch (error) {
    throw new Error('Error al eliminar el pedido: ' + error.message);
  }
};

export { newOrder, getAllOrders, getOrderById, getOrderByUser, deleteOrder };
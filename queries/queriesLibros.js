import { supabase } from '../supabaseClient.js';

const addBook = async (
  titulo,
  autor,
  editorial,
  anio_publicacion,
  genero,
  descripcion,
  precio,
  url_img,
  disponibilidad = true,
  usuario_id
) => {
  if (!titulo || !autor || !editorial || !anio_publicacion || !genero || !descripcion || !precio || !url_img) {
    throw new Error('Todos los campos son requeridos');
  }

  try {
    const { data: existingBook, error: checkError } = await supabase
      .from('libros')
      .select('id_libros')
      .eq('titulo', titulo)
      .eq('autor', autor)
      .maybeSingle();

    if (checkError) throw checkError;
    if (existingBook) throw new Error('El libro ya está registrado');

    const { error: insertError } = await supabase.from('libros').insert([
      {
        titulo,
        autor,
        editorial,
        anio_publicacion,
        genero,
        descripcion,
        precio,
        url_img,
        disponibilidad,
        usuario_id,
      },
    ]);
    if (insertError) throw insertError;
    return { mensaje: 'Libro agregado correctamente' };
  } catch (error) {
    throw new Error('Error al agregar libro: ' + error.message);
  }
};

const getAllBooks = async () => {
  try {
    const { data, error } = await supabase
      .from('libros')
      .select('*')
      .order('id_libros', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    throw new Error('Error al obtener libros: ' + error.message);
  }
};

const getBookById = async (id_libros) => {
  try {
    const { data: book, error } = await supabase
      .from('libros')
      .select('*')
      .eq('id_libros', id_libros)
      .maybeSingle();

    if (error) throw error;
    return book || null;
  } catch (error) {
    throw new Error('Error al obtener el libro: ' + error.message);
  }
};

const deleteBook = async (id_libros) => {
  try {
    const { error, count } = await supabase
      .from('libros')
      .delete({ count: 'exact' })
      .eq('id_libros', id_libros);
    if (error) throw error;
    return count;
  } catch (error) {
    throw new Error('Error al eliminar el libro: ' + error.message);
  }
};


export { addBook, getBookById, deleteBook, getAllBooks };
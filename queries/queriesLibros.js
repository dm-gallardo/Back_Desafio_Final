import { pool } from '../database/pool.js';

// Función para agregar un libro

//verificar si vamos a trabajar con el boolean estado al agregar libros

const addBook = async (titulo, autor, editorial, anio_publicacion, genero, descripcion, precio, url_img, usuario_id) => {

    // Validar que se proporcionen todos los campos requeridos
    if (!titulo || !autor || !editorial || !anio_publicacion || !genero || !descripcion || !precio || !url_img) {
        throw new Error('Todos los campos son requeridos');
    }

    try {
        //verificar si ya existe un libro con el mismo título y autor
        const checkBookQuery = 'SELECT * FROM libros WHERE titulo = $1 AND autor = $2';
        const checkResult = await pool.query(checkBookQuery, [titulo, autor]);
        if (checkResult.rows.length > 0) {
            throw new Error('El libro ya está registrado');
        }

        // Insertar el libro en la base de datos
        const insertBookQuery = `INSERT INTO libros (titulo, autor, editorial, anio_publicacion, genero, descripcion, precio, url_img, usuario_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`;
        const values = [titulo, autor, editorial, anio_publicacion, genero, descripcion, precio, url_img, usuario_id];
        await pool.query(insertBookQuery, values);

    } catch (error) {
        throw new Error('Error al agregar libro: ' + error.message);
    }
};


//-------------------------------------------------------------------------------------------------------------

//funcion para traer todos los libros


const getAllBooks = async () => {
    try {
        const query = 'SELECT * FROM libros ORDER BY id_libros DESC';
        const result = await pool.query(query);
        return result.rows;
    } catch (error) {
        throw new Error('Error al obtener libros: ' + error.message);
    }
};

// Función rapida para obtener los datos del libro por su ID

const getBookById = async (id) => {
    try {
        const query = 'SELECT * FROM libros WHERE id_libros = $1';
        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) {
            return null;
        }

        return result.rows[0];

    } catch (error) {
        throw new Error('Error al obtener el libro: ' + error.message);
    }
};

//-------------------------------------------------------------------------------------------------------------

const deleteBook = async (id_libros) => {
    
    const query = 'DELETE FROM libros WHERE id_libros = $1';
    const values = [id_libros];
    
    try {
        const result = await pool.query(query, values);
        return result.rowCount;
    } catch (error) {
        throw new Error('Error al eliminar el libro: ' + error.message);
    }
};

export { addBook, getBookById, deleteBook, getAllBooks };
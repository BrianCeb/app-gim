// Achica la foto en el navegador antes de subirla (lado máximo 400 px, JPEG).
// Así pesa unos 30-60 KB y se guarda rápido en la base de datos.
export async function achicarImagen(archivo, ladoMaximo = 400, calidad = 0.8) {
    if (!archivo.type.startsWith('image/')) {
        throw new Error('El archivo elegido no es una imagen.');
    }

    const url = URL.createObjectURL(archivo);
    try {
        const imagen = await new Promise((resolver, rechazar) => {
            const img = new Image();
            img.onload = () => resolver(img);
            img.onerror = () => rechazar(new Error('No se pudo leer la imagen. Probá con una foto JPG o PNG.'));
            img.src = url;
        });

        const escala = Math.min(1, ladoMaximo / Math.max(imagen.width, imagen.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(imagen.width * escala);
        canvas.height = Math.round(imagen.height * escala);
        canvas.getContext('2d').drawImage(imagen, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/jpeg', calidad);
    } finally {
        URL.revokeObjectURL(url);
    }
}

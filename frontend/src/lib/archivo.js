import { achicarImagen } from './imagen';

// Lectura del archivo de la ficha de salud (apto físico) antes de subirlo.
// Mismos tipos y tope que valida el backend en alumnos.router.js.
export const TIPOS_FICHA = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
export const FICHA_MAX_MB = 4;

// Las fotos del certificado se achican a 1400 px: el texto se sigue leyendo y pesa unos 200 KB.
// Es mucho más que el avatar (400 px) porque acá lo que importa es poder leer el papel.
const LADO_MAXIMO_FICHA = 1400;

const aDataUrl = (archivo) =>
    new Promise((resolver, rechazar) => {
        const lector = new FileReader();
        lector.onload = () => resolver(lector.result);
        lector.onerror = () => rechazar(new Error('No se pudo leer el archivo.'));
        lector.readAsDataURL(archivo);
    });

// Cuántos bytes ocupa de verdad un data URL en base64 (4 caracteres = 3 bytes)
const bytesDeDataUrl = (dataUrl) => {
    const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
    const relleno = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
    return Math.floor((base64.length * 3) / 4) - relleno;
};

// Devuelve { dataUrl, nombre } listo para enviar, o lanza un error con un mensaje para el usuario
export async function leerFichaSalud(archivo) {
    if (!TIPOS_FICHA.includes(archivo.type)) {
        throw new Error('La ficha tiene que ser un PDF o una foto JPG, PNG o WEBP.');
    }

    // El PDF se manda tal cual: es el documento que firmó el médico y no se toca.
    // Una foto sí se achica, porque la cámara del celular saca archivos de varios MB
    const dataUrl = archivo.type === 'application/pdf' ? await aDataUrl(archivo) : await achicarImagen(archivo, LADO_MAXIMO_FICHA, 0.85);

    if (bytesDeDataUrl(dataUrl) > FICHA_MAX_MB * 1024 * 1024) {
        throw new Error(`La ficha no puede pesar más de ${FICHA_MAX_MB} MB. Probá con un PDF más liviano o una foto.`);
    }
    return { dataUrl, nombre: archivo.name };
}

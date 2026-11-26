// Genera el PDF de una ficha de salud (apto físico) DE EJEMPLO, para los alumnos ficticios
// que carga seedDemo.js. No usa ninguna librería: arma el PDF a mano, que para una página de
// texto es poco más que una lista de objetos y una tabla de posiciones (xref).
//
// El documento lleva bien visible "EJEMPLO - DATOS FICTICIOS" y una firma inventada: es un
// archivo de demostración y no puede pasar por un certificado médico de verdad.

// Las fuentes Helvetica vienen con cualquier lector de PDF: no hay que incrustar nada.
// WinAnsiEncoding es la tabla que hace que las tildes y la ñ se vean bien (coincide con Latin-1).
const FUENTES = '<< /F1 4 0 R /F2 5 0 R >>';

// En un texto de PDF hay que escapar el paréntesis y la barra invertida
const texto = (valor) => String(valor).replace(/[\\()]/g, (c) => `\\${c}`);

// Una línea de texto: fuente (F1 normal, F2 negrita), tamaño, posición y gris (0 = negro, 1 = blanco)
const linea = ({ x, y, tamanio = 11, fuente = 'F1', gris = 0, valor }) =>
    `q ${gris} g BT /${fuente} ${tamanio} Tf 1 0 0 1 ${x} ${y} Tm (${texto(valor)}) Tj ET Q`;

// Arma el archivo: cada objeto se escribe uno tras otro y se anota en qué byte empieza,
// porque la tabla xref del final tiene que apuntar a esos bytes exactos.
function armarPdf(objetos) {
    let pdf = '%PDF-1.4\n';
    const posiciones = [];

    objetos.forEach((cuerpo, i) => {
        posiciones.push(Buffer.byteLength(pdf, 'latin1'));
        pdf += `${i + 1} 0 obj\n${cuerpo}\nendobj\n`;
    });

    const inicioXref = Buffer.byteLength(pdf, 'latin1');
    pdf += `xref\n0 ${objetos.length + 1}\n0000000000 65535 f \n`;
    // Cada entrada ocupa exactamente 20 bytes: 10 del número, un espacio, 5 de generación, " n \n"
    posiciones.forEach((posicion) => {
        pdf += `${String(posicion).padStart(10, '0')} 00000 n \n`;
    });
    pdf += `trailer\n<< /Size ${objetos.length + 1} /Root 1 0 R >>\nstartxref\n${inicioXref}\n%%EOF\n`;

    // latin1: un carácter = un byte, así las posiciones calculadas arriba siguen siendo válidas
    return Buffer.from(pdf, 'latin1');
}

// Devuelve el PDF (Buffer) del apto físico de ejemplo de un alumno
export default function pdfApto({ nombre, dni, fecha, vence }) {
    const contenido = [
        // Marco de la hoja
        'q 0.6 g 1 w 40 40 515 762 re S Q',
        // Sello diagonal "EJEMPLO" en gris claro (la matriz gira el texto 30 grados)
        'q 0.88 g BT /F2 90 Tf 0.866 0.5 -0.5 0.866 90 300 Tm (EJEMPLO) Tj ET Q',

        linea({ x: 60, y: 740, tamanio: 20, fuente: 'F2', valor: 'FICHA DE SALUD - APTO FISICO' }),
        linea({ x: 60, y: 716, tamanio: 11, gris: 0.35, valor: 'Centro Medico de Ejemplo · Profesional: Dr. Ejemplo · Matricula 0000' }),
        'q 0.6 g 0.7 w 60 706 m 535 706 l S Q',

        linea({ x: 60, y: 668, tamanio: 12, fuente: 'F2', valor: 'Alumno' }),
        linea({ x: 60, y: 650, tamanio: 14, valor: nombre }),
        linea({ x: 60, y: 614, tamanio: 12, fuente: 'F2', valor: 'DNI' }),
        linea({ x: 60, y: 596, tamanio: 14, valor: dni }),
        linea({ x: 300, y: 614, tamanio: 12, fuente: 'F2', valor: 'Fecha del apto' }),
        linea({ x: 300, y: 596, tamanio: 14, valor: fecha }),
        linea({ x: 300, y: 668, tamanio: 12, fuente: 'F2', valor: 'Valido hasta' }),
        linea({ x: 300, y: 650, tamanio: 14, valor: vence }),

        linea({ x: 60, y: 548, tamanio: 11, valor: 'Se certifica que la persona mencionada fue examinada y se encuentra en' }),
        linea({ x: 60, y: 532, tamanio: 11, valor: 'condiciones fisicas de realizar actividad fisica en un gimnasio.' }),
        linea({ x: 60, y: 500, tamanio: 11, valor: 'El apto fisico tiene una validez de un (1) ano desde la fecha indicada.' }),

        linea({ x: 60, y: 420, tamanio: 11, gris: 0.35, valor: 'Firma y sello del profesional' }),
        'q 0.6 g 0.7 w 60 440 m 280 440 l S Q',

        linea({
            x: 60,
            y: 90,
            tamanio: 10,
            fuente: 'F2',
            gris: 0.3,
            valor: 'DOCUMENTO DE EJEMPLO - DATOS FICTICIOS - SIN VALIDEZ'
        }),
        linea({ x: 60, y: 74, tamanio: 10, gris: 0.45, valor: 'Generado por GimnasioApp para probar la carga de fichas de salud.' })
    ].join('\n');

    const objetos = [
        '<< /Type /Catalog /Pages 2 0 R >>',
        '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font ${FUENTES} >> /Contents 6 0 R >>`,
        '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
        '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
        `<< /Length ${Buffer.byteLength(contenido, 'latin1')} >>\nstream\n${contenido}\nendstream`
    ];

    return armarPdf(objetos);
}

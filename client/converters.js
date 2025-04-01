

export function getNaturalLanguageDate(timestampString) {
    const date = new Date(timestampString);
    try {
        return new Intl.DateTimeFormat('es-ES', {
            // weekday: 'long',  // lunes, martes, etc.
            day: 'numeric',
            month: 'long',  // enero, febrero, etc.
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            // timeZoneName: 'short' // Opcional: muestra la zona horaria
        }).format(date);


    } catch (e) {
        console.error("ERROR WHEN CONVERTING TIME TO FORMATED DATE", e)
        return "BAD DATE"
    } 
    

}
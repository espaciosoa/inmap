

export function getNaturalLanguageDate(timestampString){


    

const formattedDate = new Intl.DateTimeFormat("es-SP", {
    // weekday: "long",  // "Monday"
    year: "numeric",  // "2025"
    month: "long",    // "March"
    day: "numeric",   // "3"
    hour: "numeric",  // "9 AM"
    minute: "numeric",
    second: "numeric",
    // timeZoneName: "short" // "UTC"
}).format(new Date(timestampString));

return formattedDate;
}
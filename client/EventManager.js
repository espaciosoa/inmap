/**
 * @description Clase que permite crear y gestionar eventos 'con nombre' para instancias de una clase.
 * Para usarla, simplemente hay que hacer que la clase herede de esta.
 */
export class EventManager {
    constructor() {
        this.events = new Map();
    }

    /**
     * @description: Permite suscribirse a un evento nombrado
     * @param event: Nombre del evento
     * @param callback: Función que se ejecutará cuando se emita el evento
     */
    // @ts-ignore
    subscribe(event, callback) {
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }
        this.events.get(event).push(callback);
    }

    /**
     * @description: Permite desuscribirse de un evento nombrado
     * @param event Nombre del evento
     * @param callback Función que se quiere eliminar de la lista de callbacks
     */
    // @ts-ignore
    unsubscribe(event, callback) {
        if (this.events.has(event)) {
            const callbacks = this.events.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }


    /**
     * @description: Permite emitir un evento nombrado desde la propia instancia
     * @param event Nombre del evento
     * @param args  Argumentos que se pasarán a los suscriptores del evento
     */
    // @ts-ignore
    _dispatch(event, ...args) {
        if (this.events.has(event)) {
            for (const callback of this.events.get(event)) {
                callback(...args);
            }
        }
    }
}
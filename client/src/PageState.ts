import { EventManager } from "./EventManager.js"
import { NumericProperty } from "./typed-functions.js"





interface Session {
    _id: string
}


interface Room {
    _id: string,

}


interface Measurement {
    _id: string
}




//MOVE ME TO A SEPARATE FILE WHEN THINGS WORK
export class PageState extends EventManager {


    _name: string
    _activeRoom: any;
    _activeSessions: any;
    _activeMeasurements: Measurement[];

    _visualizingProperty: NumericProperty | null;

    constructor(name = "",
        defaultRoom: Room,
        defaultSessions: Session[]
    ) {
        super();
        this._name = name
        this._activeRoom = defaultRoom ?? null;
        this._activeSessions = defaultSessions ?? [];
        this._activeMeasurements = [];
        this._visualizingProperty = "dbm";

        this._dispatch("onInit", (state: PageState) => console.log("init @state", state))
        this.subscribe("onChangeState", (state: PageState) => console.log("@state", state))

    }


    #overallStateChange() {
        this._dispatch("onChangeState", this)
    }

    get activeRoom() { return this._activeRoom }
    set activeRoom(room) {
        if (this._activeRoom === room) return
        this._activeRoom = room;
        this._activeSessions = []
        this._dispatch("onActiveRoomChanged", this._activeRoom);
        this.#overallStateChange()
    }


    addSession(session: Session) {
        if (this._activeSessions.find((s: Session) => s._id === session._id)) return
        this._activeSessions.push(session)
        this._dispatch("onActiveSessionsChanged", this._activeSessions)
        this.#overallStateChange()
    }
    removeSession(session: Session) {
        if (!this._activeSessions.find((s: Session) => s._id === session._id)) return
        this._activeSessions = this._activeSessions.filter((s: Session) => s._id !== session._id);
        this._dispatch("onActiveSessionsChanged", this._activeSessions)
        this.#overallStateChange()

    }

    get activeSessions() { return this._activeSessions }

    set activeSessions(sessions: Session[]) {
        this._activeSessions = sessions
        this._dispatch("onActiveSessionsChanged", this._activeSessions)
        this.#overallStateChange()
    }

    get activeMeasurements() { return this._activeMeasurements }
    set activeMeasurements(measurements: Measurement[]) {
        if (this._activeMeasurements === measurements) return
        this._activeMeasurements = measurements;
        this._dispatch("onMeasurementsChanged", this._activeMeasurements);
        this.#overallStateChange()

    }



    get visualizingProperty(): NumericProperty | null {
        return this._visualizingProperty
    }
    set visualizingProperty(propertyName: NumericProperty) {
        if (this._visualizingProperty === propertyName) return
        this._visualizingProperty = propertyName
        this._dispatch("onVisualizedPropertyChanged", this._visualizingProperty);
        this.#overallStateChange()

    }





}
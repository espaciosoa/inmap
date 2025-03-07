import JSUtils from "./Helpers.js";
//Given the rooms endpoint, shows all the possible rooms as select options
/***
 * selectItem: where to place the options themselves (a HTMLSelectElement)
 * rooms: the rooms to show as options, with their data
 */
export function showRoomsAsSelectOptions(selectItem, state, rooms, selected = undefined) {

    const roomOptionHtmlTemplate = `<option 
        data-type="room"    
        value={{roomId}}
        data-id={{roomId}}>
            {{roomName}}
        </option>`
     
    const allRoomsAsOptions = []

    rooms.forEach(r => {

        const myOptionFilledTemplate = JSUtils.replaceTemplatePlaceholders(roomOptionHtmlTemplate,
            {
                roomId: r._id,
                roomName: r.name
            });

        const optionNode = JSUtils.txtToHTMLNode(myOptionFilledTemplate)

        //set selected by default if any
        console.log("SETTING SELECTED",  selected)
        if (selected && selected._id === r._id)
            optionNode.selected = true;


        // TODO Event subscription:
        selectItem.addEventListener("change", (ev) => {
            // console.log("ROOM OPTION CHANGE")
            const roomIdSelected = ev.target.value
            state.activeRoom = rooms.filter(r => r._id == roomIdSelected)[0]
        })

        allRoomsAsOptions.push(optionNode)

    })


    selectItem.replaceChildren(...allRoomsAsOptions)

}



//For a given array of sessions, shows them as checkboxes
export function showSessionsAsCheckboxes(parent, myState, dataArray, selected = []) {

    const option_HTML_Template = `<li class="session-item">
            <label>
                <span class="session-name">{{sessionId}}</span> |
                <span class="session-date">{{sessionDate}}</span>
            </label>
            <input type="checkbox" data-type="session" data-id="{{sessionId}}" />
        </li>`


    const allSessionCheckboxes = []


    dataArray.forEach(data => {
        const myCheckboxes = JSUtils.replaceTemplatePlaceholders(option_HTML_Template,
            {
                sessionDate: data.timestamp,
                sessionId: data._id,
            });

        const checkboxDOM_Node = JSUtils.txtToHTMLNode(myCheckboxes)

        console.log("ASSIGNING SELECTED CHECKBOXES", selected )
        console.log("DATA", data )
        // Set checkboxes as selected

        // console.log("data._id  in selected.map(s=>s._id) ", data._id in selected.map(s => s._id))
        // console.log("selected.map(s=>s._id) ", selected.map(s => s._id))
        // console.log("data_id ", data._id)
        if (selected && selected.map(s => s._id).includes(data._id)) {
            console.log("THIS " + data._id + " is selected")
            checkboxDOM_Node.querySelector("input[type=checkbox]").setAttribute("checked", true);
        }



        //TODO: Event subscription pending here
        console.log("Adding onChange events to checkboxes")
        checkboxDOM_Node.addEventListener("change", (ev) => {
            const checkbox = ev.target
            const isActive = checkbox.checked
            console.log(checkbox.dataset)
            const toActivateThing = checkbox.dataset.type
            const toActivateId = checkbox.dataset.id
         
            console.log(`${checkbox} ${toActivateThing} CHANGED isActive ? ${isActive} | id: ${toActivateId}  `)


            isActive ?
                myState.addSession(dataArray.filter(e => e._id === toActivateId)[0])
                : myState.removeSession(dataArray.filter(e => e._id === toActivateId)[0])

        })

        allSessionCheckboxes.push(checkboxDOM_Node)
    })




    parent.replaceChildren(...allSessionCheckboxes)
}
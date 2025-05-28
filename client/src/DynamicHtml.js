
import JSUtils from "./Helpers.js";
import { getNaturalLanguageDate } from "/src/converters.js";
import { putSession, deleteSession, deleteMeasurement } from "./requests.js";
import { validateLat, validateLong } from "./geo.utils.js";

function isObject(item) {
    return (item && typeof item === "object" && !Array.isArray(item));
}


function isObjectForce(item) {
    if (item && typeof item === "object" && !Array.isArray(item)) {
        console.log("Object", item)
        return true;
    }
    //Attempt to parse as JSON and do comparison again
    try {
        const itemAsObject = JSON.parse(item);
        if (itemAsObject && typeof itemAsObject === "object" && !Array.isArray(itemAsObject)) {
            return true
        }
    } catch (e) {
        console.warn("Error parsing JSON", e.message);
    }
    console.log("Not an object", item)
    return false;


}


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
        // console.log("SETTING SELECTED", selected)
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


/**
 * Displays information about the room being currently displayed in the map
 * @param {*} state 
 */
export function showStateInformationSection(state) {

    //Showing in the page for which session I am showing info
    const myDivTemplate = `<section class="currently-displaying"> 
        <header>
            <h2> Room: 
                <span class="room-name">{{roomName}}</span>
                <span class="room-id">{{roomId}}</span>
            </h2>
            <h3 > Session/s: </h3>
                <div class="sessions-displayed-list"> 
                    <!-- Dynamic filling (list of sessions being displayed)-->
                <div class="sessions-displayed-list"> 
        </header> 
         <p> total measurements: {{measurements}} </p>  
      </section>`


    const sessionSpanTemplate = ` <span class="session-name">{{session}}</span> `

    const allSessionSpansNodes = []
    state.activeSessions.forEach(s => {
        const sessionSpanTemplateFilled = JSUtils.replaceTemplatePlaceholders(sessionSpanTemplate, {
            session: s._id
        })

        allSessionSpansNodes.push(JSUtils.txtToHTMLNode(sessionSpanTemplateFilled))
    })



    const myStateSummary = JSUtils.replaceTemplatePlaceholders(myDivTemplate, {
        roomName: `${state.activeRoom.name}`,
        roomId: `${state.activeRoom._id}`,
        measurements: state.activeMeasurements.length
    })




    const measurementsContainer = document.querySelector("#measurements")

    const myStateSummaryAlmostFilled = JSUtils.txtToHTMLNode(myStateSummary)
    const sessionsContainer = myStateSummaryAlmostFilled.querySelector(".sessions-displayed-list")

    sessionsContainer.replaceChildren(...allSessionSpansNodes)
    measurementsContainer.replaceChildren(myStateSummaryAlmostFilled)

}




//For a given array of sessions, shows them as checkboxes
export function showSessionsAsCheckboxes(parent, myState, dataArray, selected = []) {

    console.groupCollapsed("showSessionsAsCheckboxes")


    const option_HTML_Template = `<li class="session-item">
            <label class="bold" >
                <span class="session-name">{{sessionId}}</span> |
                <span class="session-date">{{sessionDate}}</span>
            </label>
            <input type="checkbox" data-type="session" data-id="{{sessionId}}" />
        </li>`


    const allSessionCheckboxes = []


    dataArray.forEach(data => {
        const myCheckboxes = JSUtils.replaceTemplatePlaceholders(option_HTML_Template,
            {
                sessionDate: getNaturalLanguageDate(data.timestamp),
                sessionId: data._id,
            });

        const checkboxDOM_Node = JSUtils.txtToHTMLNode(myCheckboxes)

        console.log("ASSIGNING SELECTED CHECKBOXES", selected)
        console.log("DATA", data)
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





export function showNumericPropertiesAsSelect(properties, selected, onChangeSelected) {

    //given the points to be printed, display all the possible keys that can be shown in the map

    const measurementProperty_HtmlTemplate = `<option 
    data-type="measurementProperty"    
    value={{property}}
    data-id={{property}}>
        {{property}}
    </option>`


    const selectPadre = document.querySelector("#property-select-menu");


    const childrenOptionsArray = []
    //Genero las opciones con tantas propiedades numéricas como estén soportadas (se dan las opciones como parámetro)
    properties.forEach((p) => {
        const filledOptionTemplate = JSUtils.replaceTemplatePlaceholders(
            measurementProperty_HtmlTemplate,
            {
                property: p,
            });
        const optionDOM_Node = JSUtils.txtToHTMLNode(filledOptionTemplate)

        //Asignar selección actual
        if (selected && selected === optionDOM_Node.value)
            optionDOM_Node.selected = true;

        childrenOptionsArray.push(optionDOM_Node)
    })




    selectPadre.addEventListener("change", (ev) => {
        const value = ev.target.value
        onChangeSelected(value)
    })

    selectPadre.replaceChildren(...childrenOptionsArray);

    // Seleccionar el select padre y añadir un hijo por cada propiedad diferente de la lista

    // const selectPropertyComponent_HTMLTemplate = 

}








const cellHTML_template = ` <div class="editable-cell">
            <!-- <data>{{value}}</data> -->
            <label class="bold"> {{key}} </label>
            <input data-key-path={{keyPath}}
             name={{key}} 
             value={{value}}
             onClick={{handleClick}}}}
             onChange={{handleChange}}}}
             />
        </div>`

//Recursively destructures objects (last key is used to annotate cells with their recursive path e.g., obj.field.innerField.YetAnotherField )
// Opts allows to specify some keys as editable

function createTableFromObject(data, lastKey = "", opts = {
    editableKeys: ["lat", "long"],
    validateValues: null,

}) {

    console.groupCollapsed("createTableFromObject")

    const elem = document.createElement("div");
    elem.classList.add("inner-object");

    const kvPairs = Object.entries(data);

    for (const [key, value] of kvPairs) {
        let kvItemHTML = document.createElement("div");


        //UGLY HACK TO SHOW KEYPAIR VALUES AT DIFFERENT LEVELS
        let valueAux = value;
        try { valueAux = JSON.parse(value) }
        catch (e) { valueAux = value; }

        //If is object then, further decompose, keeping track of keypath
        if (isObject(valueAux)) {
            const subElem = createTableFromObject(valueAux, `
                ${lastKey}.${key}`,
                opts);

            kvItemHTML.textContent = `${key}:`;
            kvItemHTML.appendChild(subElem);
        } else {
            if (opts.editableKeys.includes(key)) {

                const handlers = {
                    handleClick: (e) => { console.log("Found and clicked editable inner key", key) },
                    handleChange: (e) => {
                        console.log(`User changed ${key} = ${data[key]} to value ${e.target.value}`)

                        //If we have a validation function, use it
                        if (opts.validateValues) {
                            const validated = opts.validateValues(key, e.target.value)
                            if (validated !== null) {
                                e.target.classList.remove("invalid")
                                e.target.classList.add("valid")
                                data[key] = validated
                            }
                            else {
                                e.target.classList.add("invalid")
                                e.target.classList.remove("valid")
                                console.warn("Invalid value", e.target.value)
                            }
                        }
                        else {
                            data[key] = e.target.value
                        }
                    }
                }
                const replaced = JSUtils.replaceTemplatePlaceholders(cellHTML_template,
                    {
                        key: key,
                        value: valueAux,
                        value: valueAux,
                        keyPath: `${lastKey}.${key}`,
                        handleClick: handlers.handleClick,
                        handleChange: handlers.handleChange
                    })

                const htmlEditableNode = JSUtils.txtToHTMLNode(replaced);
                JSUtils.bindHandlers(htmlEditableNode, handlers)
                kvItemHTML.appendChild(htmlEditableNode)
            }
            else {
                kvItemHTML.textContent = `${key} : ${valueAux}`;
            }
        }

        elem.appendChild(kvItemHTML);
    }

    console.groupEnd()

    return elem;
}





function createTableFromArray(data,
    opts = {
        editable: true,
        editableKeys: ["lat", "long"],
        //I should replace these with my handlers when using
        handleSave: null,
        handleDelete: null,
        // (takes key, value) and returns the value to be set
        validateValues: null,
    }) {

    if (!Array.isArray(data) || data.length === 0) {
        return document.createTextNode('No data to display.');
    }

    const tableWrapper = document.createElement("div")
    tableWrapper.classList.add("table-container")
    tableWrapper.classList.add("scrollable")

    const table = document.createElement('table');
    const thead = document.createElement('thead');
    thead.classList.add("fixed-header")

    const headerRow = document.createElement('tr');

    // Create table headers from keys of first object
    const keys = Object.keys(data[0]);
    keys.forEach(key => {
        const th = document.createElement('th');
        th.textContent = key;
        headerRow.appendChild(th);
    });

    if (opts.editableKeys && opts.editableKeys.length > 0) {
        const th = document.createElement('th');
        th.textContent = "Actions";
        headerRow.appendChild(th);
    }


    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Create table body
    const tbody = document.createElement('tbody');
    data.forEach(obj => {
        const row = document.createElement('tr');


        //Create a row for each array element (that should be an object)
        keys.forEach(key => {
            const td = document.createElement('td');
            td.classList.add("table-cell")

            //IF IT IS A "SIMPLE VALUE" (can't be decomposed more in JSON)

            if (!isObject(obj[key])) {

                if (opts.editableKeys?.includes(key)) {

                    console.log("FOUND EDITABLE KEY", key)
                    const handlers = {
                        handleChange: (e) => {
                            console.log(`User changed ${key} = ${obj[key]} to value ${e.target.value}`)

                            //If we have a validation function, use it
                            if (opts.validateValues) {
                                const validated = opts.validateValues(key, e.target.value)
                                if (validated !== null) {
                                    e.target.classList.remove("invalid")
                                    e.target.classList.add("valid")
                                    obj[key] = validated
                                }
                                else {
                                    e.target.classList.add("invalid")
                                    e.target.classList.remove("valid")
                                    console.warn("Invalid value", e.target.value)
                                }
                            }
                            else {
                                obj[key] = e.target.value
                            }
                        },
                        handleClick: (e) => { console.log('Clicked editableValue:', e.target.value) }
                    };

                    const objectValueHTML_template = ` <div class="editable-cell">
                        <input data-key-path={{keyPath}}
                        onClick={{handleClick}}   
                        onChange={{handleChange}}         
                        name={{keyPath}} 
                        value={{value}} />
                        </div>`

                    const valueFromTemplate = JSUtils.txtToHTMLNode(
                        JSUtils.replaceTemplatePlaceholders(objectValueHTML_template,
                            {
                                keyPath: key,
                                value: obj[key],
                                handleClick: handlers.handleClick,
                                handleChange: handlers.handleChange

                            }))

                    //Here you can actually listen to changes and change the object itself
                    //Then maybe add a button to confirm and reload map
                    JSUtils.bindHandlers(valueFromTemplate, handlers);

                    td.replaceChildren(valueFromTemplate)
                }
                //If it is a simple value, just show it
                else {
                    td.textContent = `${obj[key]}`;
                }
            } else {
                td.replaceChildren(createTableFromObject(obj[key], key, opts));
            }

            row.appendChild(td);

        });

        // Add buttons per row
        if (opts.editableKeys && opts.editableKeys.length > 0) {






            const replacements = {
                saveText: "Save 💾",
                deleteText: "Delete 🗑️",
                // Passed as parameters to the function
                handleSave: () => opts.handleSave(obj) ?? function (ev) { console.warn("This 'handleDelete' handler  was not assigned ", obj) },
                handleDelete: () => opts.handleDelete(obj) ?? function (ev) { console.warn("This 'handleDelete' handler  was not assigned ", obj) },
                //Chapuza para desactivar edición o eliminado condicionalmente según si se pasa o  no un handler
                enabledSave: opts.handleSave !== null ? "" : "disabled",
                enabledDelete: opts.handleDelete !== null ? "" : "disabled"
            }


            const templateButtons = `<td>
            <div class="row-action-buttons">
                <button class="btn" onClick={{handleSave}}  {{enabledSave}}> {{saveText}}  </button>
                <button class="btn" onClick={{handleDelete}} {{enabledDelete}} > {{deleteText}}  </button>
            </div>
            </td>
            `
            const node = JSUtils.txtToHTMLNode(
                JSUtils.replaceTemplatePlaceholders(templateButtons,
                    replacements
                )
            )
            JSUtils.bindHandlers(node, replacements)
            row.appendChild(node)
        }


        tbody.appendChild(row);

    });
    table.appendChild(tbody);
    tableWrapper.appendChild(table)

    console.groupEnd()


    return tableWrapper;
}




// ACTUALLY SHOWING THE TABLES
export function showMeasurementsAsTable(parent, measurements, refetchLogic) {
    const measurementsCopy = structuredClone(measurements)

    parent.replaceChildren(
        createTableFromArray(
            measurementsCopy,
            //Parameters for the table
            {
                editableKeys: ["lat", "lon"],
                handleSave: null,
                // Old 
                // async (obj) => {
                //     alert(`TODO MEASUREMENTS PUT`)
                //     //Replace me with just fetching

                //     await refetchLogic()
                //     // window.location.reload(true);
                // },
                handleDelete: async (obj) => {

                    const confirmed = window.confirm("Are you sure you want to proceed?")

                    if (!confirmed)
                        return

                    //SHOW MODAL HERE
                    const deleteResult = await deleteMeasurement(obj._id)

                    window.alert(`${JSON.stringify(deleteResult)}`)

                    await refetchLogic()
                    // window.location.reload(true);

                }
            } //Parameters for the table
        ))
        ;
}



export function showRoomAsTable(parent, room) {
    const roomCopy = structuredClone(room)
    parent.replaceChildren(
        createTableFromArray(
            [roomCopy],
            {
                editable: false
            }
            //Parameters for the table
            // {
            //     editable: true,
            //     editableKeys: ["name", "_id"],
            //     handleSave: (ev) => { console.log("AAAAAAAAAAAASave clicked for room", room) },
            //     handleDelete: (ev) => { console.log("AAAAAAAAAAAAA  Delete clicked for room", room) }
            // }
        )
    );
}




function safeParseFloat(val) {
    const parsed = parseFloat(val);
    return Number.isNaN(parsed) ? null : parsed;
}

export function showSessionsAsTables(parent, sessions, refetchLogic) {
    const sessionsCopy = structuredClone(sessions)
    parent.replaceChildren(
        createTableFromArray(
            sessionsCopy,
            //Parameters for the table
            {
                editable: true,
                editableKeys: ["lat", "lon"],
                //Attepmt to validate values before submission
                validateValues: (key, value) => {
                    try {
                        switch (key) {
                            case "lat": return validateLat(safeParseFloat(value));
                            case "lon": return validateLong(safeParseFloat(value));
                        }
                    }
                    catch (e) {
                        console.warn("Error validating value", e.message)
                        return null
                    }
                },

                handleSave: async (obj) => {


                    //SHOW MODAL HERE
                    const result = await putSession(obj)

                    alert(`Session '${obj._id}' saved : ${result.success} | ${JSON.stringify(result.data)} ${result.data.message ?? ""}`)

                    //Replace me with just fetching
                    await refetchLogic()
                    // window.location.reload(true);

                },
                handleDelete: async (obj) => {


                    const confirmed = window.confirm("Are you sure you want to proceed?")

                    if (!confirmed)
                        return

                    //SHOW MODAL HERE
                    const result = await deleteSession(obj._id)
                    //SHOW MODAL HERE
                    alert("Session deleted")
                    await refetchLogic()
                    // window.location.reload(true);

                }



            }
        ));
}

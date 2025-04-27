import JSUtils from "./Helpers.js";
import { getNaturalLanguageDate } from "/src/converters.js";
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
        console.log("SETTING SELECTED", selected)
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



function isObject(item) {
    return (item && typeof item === "object" && !Array.isArray(item));
}




const cellHTML_template = ` <div class="editable-cell">
            <!-- <data>{{value}}</data> -->
            <label>{{key}} <label/>
            <input data-key-path={{keyPath}} name="key" value={{value}} />
        </div>`






//Recursively destructures objects (last key is used to annotate cells with their recursive path e.g., obj.field.innerField.YetAnotherField )
// Opts allows to specify some keys as editable

function createTableFromObject(data, lastKey = "", opts = {
    editableKeys: ["lat", "long"],


}) {
    const elem = document.createElement("div");
    elem.classList.add("sos");

    const kvPairs = Object.entries(data);

    for (const [key, value] of kvPairs) {
        let kvItemHTML = document.createElement("div");


        //UGLY HACK TO SHOW KEYPAIR VALUES AT DIFFERENT LEVELS
        let valueAux = value;
        try {
            valueAux = JSON.parse(value)
        }
        catch (e) {
            // console.log("attempted to convert to value")
            valueAux = value;
        }


        if (isObject(valueAux)) {
            const subElem = createTableFromObject(valueAux, `${lastKey}.${key}`);
            kvItemHTML.textContent = `${key}:`;
            kvItemHTML.appendChild(subElem);
        } else {


            if (editableKeys.includes(key)) {

                const replaced = JSUtils.replaceTemplatePlaceholders(cellHTML_template,
                    {
                        key: key,
                        value: valueAux,
                        value: valueAux,
                        keyPath: `${lastKey}.${key}`
                    })
                const htmlEditableNode = JSUtils.txtToHTMLNode(replaced);
                kvItemHTML.appendChild(htmlEditableNode)
            }
            else {
                kvItemHTML.textContent = `${key} : ${valueAux}`;
            }
        }

        elem.appendChild(kvItemHTML);
    }

    return elem;
}





const objectValueHTML_template = ` <div class="editable-cell">
            <input data-key-path={{keyPath}}
             onChange={{handleChange}} 
             name="{{keyPath}}" 
             value={{value}} />
        </div>`


function myHandleChange(ev) {
    alert(ev)
}

function createTableFromArray(data) {
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
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Create table body
    const tbody = document.createElement('tbody');
    data.forEach(obj => {
        const row = document.createElement('tr');
        //Create a row for each array element
        keys.forEach(key => {
            const td = document.createElement('td');
            td.classList.add("table-cell")

            //IF IT IS A "SIMPLE VALUE" (can't be decomposed more in JSON)
            if (!isObject(obj[key])) {
                const valueFromTemplate = JSUtils.txtToHTMLNode(JSUtils.replaceTemplatePlaceholders(objectValueHTML_template,
                    {
                        keyPath: key,
                        value: obj[key],
                        handleChange: myHandleChange // This won't work alex

                    }))
                
                    //Here you can actually listen to changes and change the object itself
                    //Then maybe add a button to confirm and reload map

                td.replaceChildren(valueFromTemplate                )
                // td.textContent = obj[key]; //Previous, no fancy
            }
            //Here 
            else {
                td.replaceChildren(createTableFromObject(obj[key], key))
            }

            row.appendChild(td);
        });
        tbody.appendChild(row);
    });
    table.appendChild(tbody);
    tableWrapper.appendChild(table)

    return tableWrapper;
}




const editableKeys = ["lat", "lon"]

export function showMeasurementsAsTable(parent, measurements) {
    parent.replaceChildren(createTableFromArray(measurements));
}

export function showRoomAsTable(parent, room) {
    parent.replaceChildren(createTableFromArray([room]));
}

export function showSessionsAsTables(parent, sessions) {
    parent.replaceChildren(createTableFromArray(sessions));

}



export function displayTableWithInformationOfAllSelectedStuff(parent, measurements) {

    // Usage:
    parent.replaceChildren(createTableFromArray(measurements));




    // throw new Error("Not Implemented yet displayTableWithInformationOfAllSelectedStuff")
}
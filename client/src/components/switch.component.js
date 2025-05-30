import JSUtils from "../Helpers.js"

const HTML_TEMPLATE =
    `<span class="c-switch-input" >
            <span class="c-switch-label"> {{label}} </span>
            <label class="input-switch">
                <input type="checkbox" onChange={{handleChange}} >
                <span class="slider"></span>
            </label>
    </span>
`



export function SwitchComponent(
    label,
    handleChange
) {
    return JSUtils.replaceTemplatePlaceholdersAndBindHandlers(HTML_TEMPLATE, {
        label: label,
        handleChange: handleChange
    })
}










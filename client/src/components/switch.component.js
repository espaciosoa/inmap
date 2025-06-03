import JSUtils from "../Helpers.js"

const HTML_TEMPLATE =
    `<span class="c-switch-input" >
            <span class="c-switch-label"> {{label}} </span>
            <label class="input-switch">
                <input type="checkbox" {{checked}} onChange={{handleChange}} >
                <span class="slider"></span>
            </label>
    </span>
`



export function SwitchComponent(
    label,
    checked,
    handleChange
) {
    return JSUtils.replaceTemplatePlaceholdersAndBindHandlers(HTML_TEMPLATE, {
        label: label,
        checked: checked ? "checked" : "",
        handleChange: handleChange
    })
}










export default class JSUtils {

    /**
     * Converts a string into an HTML Document Fragment that can be added to the DOM (Does not work with table elements)
     * @param txt
     * @returns {DocumentFragment} The HTML node generated from the passed string (you can't see it in the console)
     * @example
     * let txtHTML = `<h1> This is a header</h1>`;
     * const htmlNode = txtToHtmlNode(txtHTML);
     * // htmlNode is ready to be added to the DOM
     * document.querySelector("#container").append(htmlNode);
     */
    static txtToHtmlDocumentFragment(txt) {
        return document.createRange().createContextualFragment(txt);
    }

    /**
     * Converts a string into an HTMLNode that can be added to the DOM (Does not work with table elements)
     * @param htmlStr {string}
     * @returns {Element} The HTML element generated from the passed string
     * @example
     * let txtHTML = `<h1> This is a header</h1>`;
     * const htmlNode = txtToHTMLNode(txtHTML);
     * // htmlNode is ready to be added to the DOM
     * document.querySelector("#container").append(htmlNode);
     */
    static txtToHTMLNode(htmlStr) {
        const tmpDiv = document.createElement('div');
        tmpDiv.innerHTML = htmlStr;
        const node = tmpDiv.firstElementChild;
        return node;
    }


    /**
     * Allows defining a text string with placeholder values that will be later be replaced using the keys of a provided object.
     * Requires using a special syntax for named placeholders : {{myPlaceholder}}
     * @param {string} template the string containing the placeholders to replace
     * @param {Object} replacements an object with the strings to replace
     * @returns {*} a new string resulting of the substitution of placeholders for actual values.
     * @example
     * let myPlaceholder_HTMLTemplate = "<p> My name is {{name}}, my age is {{age}}. {{Greeting}}</p>"
     * //Produces : "<p> My name is Michael Scott, my age is 43. Hi lads!</p>"
     * let stringAfterReplacement = JSHelpers.replaceTemplatePlaceholders(myPlaceholder_HTMLTemplate,
     *         {
     *             name: "Michael Scott",
     *             age: 43,
     *             Greeting: "Hi lads!"
     *         });
     */
    static replaceTemplatePlaceholders(template, replacements) {

        // First, handle attributes like 'onEVENT'  e.g., onClick={{handlerName}} appearing in the template
        const eventAttrRegex = /(on\w+)={{(.*?)}}/g;

        // Replaces in the template appearances of 'onEVENT' 
        // to custom attributes in elements like the following: 
        // <button onClick={{handler}} />
        // becomes
        // <button data-event-onclick="handler" />
        template = template.replace(eventAttrRegex, (_, eventAttrName, handlerName) => {
            const trimmedHandlerName = handlerName.trim();
            const eventNameLower = eventAttrName.toLowerCase();
            return `data-event-${eventNameLower}="${trimmedHandlerName}"`;
        });






        // Now handle plain text placeholders {{buttonText}}
        const placeholderRegex = /{{(.*?)}}/g;
        return template.replace(placeholderRegex, (_, placeholderName) => {
            const trimmedName = placeholderName.trim();
            const toReplaceValue = replacements[trimmedName];

            if (typeof toReplaceValue === "function") {
                console.warn(`Warning: trying to inject a function into text at {{${trimmedName}}}. Ignoring.`);
                return "";
            }
            //Added support for HTML nodes using replace
            else if (
                toReplaceValue instanceof HTMLDivElement ||
                toReplaceValue instanceof HTMLSpanElement) {
                // The node should be appended a posteriori
                return `<div data-replaceme="${trimmedName}"> THIS DIV WILL DISSAPEAR AFTER REPLACEMENT WITH INNER CHILD </div>`
            }
            else {
                return toReplaceValue ?? "";


            }
        });

    }


    static bindHandlers(context, replacements) {
        const allElements = [context, ...context.querySelectorAll('*')]; // Include context itself and all its descendants
        allElements.forEach(el => {
            Array.from(el.attributes).forEach(attr => {
                if (attr.name.startsWith('data-event-')) {
                    const eventType = attr.name.replace('data-event-on', ''); // 'onclick' -> 'click'
                    const handlerName = attr.value.trim();
                    const handler = replacements[handlerName];

                    // console.log(`Binding handler ${handlerName} to event ${eventType} on element`, el);

                    if (typeof handler === 'function') {
                        el.addEventListener(eventType, handler);
                    } else {
                        console.warn(`Handler "${handlerName}" not found in replacements`);
                    }

                    // Optionally clean:
                    el.removeAttribute(attr.name);
                }
                //Added support to replace HTML NODES in templates
                else if (attr.name.startsWith('data-replaceme')) {

                    // console.log(`Substituting HTMLNode in template `, el);
                    const templateStringName = attr.value.trim();

                    const HTMLDOMElem = replacements[templateStringName]

                    // console.log("HTML DOM ELEMENT TO be inserted ", HTMLDOMElem)
                    el.replaceWith(HTMLDOMElem)

                }
            });
        });
    }



    // This function combines in a single step both template filling and function binding 
    // returns a new dom element with the subscribed things
    static replaceTemplatePlaceholdersAndBindHandlers(template, replacements) {

        // 1- TXT replace {{vars}} with actual text and "annotate" elements to later be able to attach to them a handler 
        const newDOMElement = this.txtToHTMLNode(JSUtils.replaceTemplatePlaceholders(template, replacements))
        // 2- Assign the handlers at runtime once the DOM Node exists.
        this.bindHandlers(newDOMElement, replacements)

        return newDOMElement
    }

    static isString(x) {
        return typeof x === "string" || x instanceof String || Object.prototype.toString.call(x) === "[object String]"
    }


}
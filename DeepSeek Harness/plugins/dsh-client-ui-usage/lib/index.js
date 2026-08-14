//#region lib/types/index.js
/**
* Live usage surface plugin, node half. Pure UI plugin: the empty apply exists
* so the plugin appears in the host cordis.yml / Loader; the browser half
* ships via exports["./client"], discovered through the package.json
* dsh.client declaration. The browser half renders the context-window
* occupancy meter and the real-time billing estimate in the session header.
*/
/** Host plugin body — no host-side behavior for this surface plugin. */
function apply() {}
//#endregion
export { apply };

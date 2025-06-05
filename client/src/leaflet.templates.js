export const LEAFLET_POPUP_HTML_TEMPLATE = `<div class="tooltip-point-detail">  
<header > 
    <h4>{{title}}</h4>
</header>
<div class="two-cols center"> 
    <div class="signal-data"> 
            <span> <span class="bold">dbm</span>: {{dbm}} </span>
            <span> <span class="bold">asuLevel</span>: {{asuLevel}} </span>
            <span> <span class="bold">qualityLevel</span>: {{level}}</span>
            <span> <span class="bold">signalType</span>: {{type}} </span>
            <!-- Now the optionals -->    
            {{correction}}
    </div>
    <div class="cell-identity">
        <span> <span class="bold">Operator</span>: {{operator}} </span>
        <span> <span class="bold">Bandwidth</span>: {{bandwidth}} </span>
        
    </div> 
</div>
<footer>
    <span class="timestamp-detail"> ⌚ {{timestamp}} </span>
</footer>
</div>`

// rssi
// rsrp
// rsrq
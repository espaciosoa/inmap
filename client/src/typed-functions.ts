console.log("Code from typescript")


// Function to interpolate between colors to display numeric things in the map

type HexColor = `#${string}`

type ColorBreakpoint = {
    position: number;
    color: HexColor;
};

type Range = {
    min: number
    max: number
}




export type NumericProperty = "dbm" | "asuLevel" | "level" |
    // 4G
    "cqi" | "cqiTableIndex" | "rsrp" | "rsrq" | "rssi" | "rssnr" |
    // 5G
    "csiRsrp" | "csiCqiTableIndex" | "csiRsrq" | "csiSinr" | "ssRsrp" | "ssRsrq" | "ssSinr"


const units = new Map<NumericProperty, string>([

    ['dbm', 'dBm'],
    // Levels are arbitrary abstract lengths
    ['asuLevel', 'arbitrary'],
    ['level', 'arbitrary'],

    // 4G
    ['cqi', 'arbitrary'],
    ['cqiTableIndex', '?'],
    ['rsrp', 'dBm'], // []
    ['rsrq', 'arbitrary'],
    ['rssi', 'dBm'],
    ['rssnr', 'dBm'],

    //5G
    ['csiRsrp', 'dBm'],
    ['csiCqiTableIndex', '?'],
    ['csiRsrq', 'dBm'],
    ['csiSinr', 'dBm'],
    ['ssRsrp', 'dBm'],
    ['ssRsrq', 'dBm'],
    ['ssSinr', 'dBm']


]);


const ranges = new Map<NumericProperty, Range>([
    ['dbm', {
        min: -128,
        max: 0
    }],
    ['asuLevel', {
        min: 0,
        max: 97
    }],
    ['level',
        {
            min: 0,
            max: 4
        }
    ],
    // // 4G
    // ['cqi', {
    //     min: 0,
    //     max: 4
    // }],
    // ['cqiTableIndex', {
    //     min: 0,
    //     max: 4
    // }],
    ['rsrp', {
        min: -140,
        max: -43
    }], // []
    ['rsrq', {
        min: -140,
        max: -41
    }],
    ['rssi', {
        min: -113,
        max: 51
    }],
    ['rssnr', {
        min: -20,
        max: 30
    }],

    // 5G
    ['csiRsrp', {
        min: -156,
        max: -31
    }],
    // Channel State Information (CSI) Channel Quality Indicator (CQI) Table
    // ['csiCqiTableIndex', '?'],
    ['csiRsrq', {
        min: -20,
        max: -3
    }],
    ['csiSinr', {
        min: -23,
        max: 23
    }],
    ['ssRsrp', {
        min: -156,
        max: -31
    }],
    ['ssRsrq', {
        min: -43,
        max: 20
    }],
    ['ssSinr', {
        min: -23,
        max: 40
    }]
]
)

export function getPropertyUnit(signalPropertyName: NumericProperty): string {
    return units.get(signalPropertyName)!!
}

export function getPropertyRange(signalPropertyName: NumericProperty): Range | undefined {
    return ranges.get(signalPropertyName)
}

/**
 * Given a property name and a value for such property tells if it is in the range of valid values
 */
export function isSignalPropertyInRange(signalPropertyName: NumericProperty, value: number): boolean {
    const rangeMapItem = ranges.get(signalPropertyName)
    if (!rangeMapItem) {
        console.error(`${signalPropertyName} is not listed as a NumericProperty`)
        return false
    }
    const { min, max } = rangeMapItem
    return value >= min && value <= max
}

export function getSignalPropertyInRangeOrDefault(signalPropertyName: NumericProperty, value: number, defaultValue: any) {
    if(isSignalPropertyInRange(signalPropertyName,value))
        return value
    else
        return defaultValue
}




export function getFilterablePropertiesList(type: "5G" | "4G"): Array<string> {


    const FourG_Only_Props = ["cqi", "cqiTableIndex", "rsrp", "rsrq", "rssi", "rssnr"]
    const FiveG_Only_Props = ["csiRsrp", "csiCqiTableIndex", "csiRsrq", "csiSinr", "ssRsrp", "ssRsrq", "ssSinr"]

    const Exclude_Props = ["cqi", "cqiTableIndex", "csiCqiTableIndex"]

    if (type === "4G")
        return units.keys().toArray()
            .filter((v) => !FiveG_Only_Props.includes(v))
            .filter((v) => !Exclude_Props.includes(v))

    else if (type === "5G")
        return units.keys().toArray()
            .filter((v) => !FourG_Only_Props.includes(v))
            .filter((v) => !Exclude_Props.includes(v))
    else
        throw new Error("Unsupported type passed to getFilterablePropertiesList")
}



//Here I define different behaviours of color assignment depending on the property

// Takes property 0 to 1 and  value 
export function getPropertyColorForValue(property: NumericProperty, value: number) {

    if (property !== "level" && property !== "asuLevel") {
        //CAMBIAR PARA QUE CADA PROPIEDAD TENGA SU RANGO

        const propRange = getPropertyRange(property)

        if (!propRange) {
            console.warn("proprRange not found for property ", property)
            return "#000000"
        }

        const valueInZeroOneRange = getNormalizedValueInRange(
            value,
            propRange?.min,
            propRange?.max
        )


        return interpolateColor(valueInZeroOneRange
            , [
                { position: 0, color: "#eb3734" },
                { position: 1, color: "#34ebde" },
            ])
    }
    else {
        //This works as expected
        return matchColorLevel(value)
    }


}







function matchColorLevel(level: number) {

    let color = "#FFFFFF"
    switch (level) {
        case 0: color = "#FF8282"
            break;
        case 1: color = "#FFC482"
            break;
        case 2: color = "#F0FF82"
            break;
        case 3: color = "#82FF8A"
            break;
        case 4: color = "#82CBFF"
            break;
    }
    return color

}




// takes values from 0, 1
export const interpolateColor = (value: number, breakpoints: ColorBreakpoint[]): string => {
    if (breakpoints.length < 2) {
        throw new Error("At least two breakpoints are required for obtaining a Lerped color");
    }

    // Sort breakpoints by position
    breakpoints.sort((a, b) => a.position - b.position);

    // Clamp value within the range of breakpoints
    if (value <= breakpoints[0].position) return breakpoints[0].color;
    if (value >= breakpoints[breakpoints.length - 1].position) return breakpoints[breakpoints.length - 1].color;

    // Find surrounding breakpoints
    let lower = breakpoints[0];
    let upper = breakpoints[breakpoints.length - 1];

    for (let i = 0; i < breakpoints.length - 1; i++) {
        if (value >= breakpoints[i].position && value <= breakpoints[i + 1].position) {
            lower = breakpoints[i];
            upper = breakpoints[i + 1];
            break;
        }
    }

    // Linear interpolation factor (between 0 and 1)
    const t = (value - lower.position) / (upper.position - lower.position);

    // Convert hex to RGB
    const lowerRGB = hexToRgb(lower.color);
    const upperRGB = hexToRgb(upper.color);

    if (!lowerRGB || !upperRGB) {
        throw new Error("Invalid color format");
    }

    // Interpolate RGB values
    const r = Math.round(lowerRGB.r + t * (upperRGB.r - lowerRGB.r));
    const g = Math.round(lowerRGB.g + t * (upperRGB.g - lowerRGB.g));
    const b = Math.round(lowerRGB.b + t * (upperRGB.b - lowerRGB.b));

    // Return as hex string
    return rgbToHex(r, g, b);
};

export function getNormalizedValueInRange(value: number, min: number, max: number) {
    return ((value - min) / (max - min));
}

const hexToRgb = (hex: string) => {
    const match = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
    if (!match) return null;

    return {
        r: parseInt(match[1], 16),
        g: parseInt(match[2], 16),
        b: parseInt(match[3], 16)
    };
};

const rgbToHex = (r: number, g: number, b: number) => {
    return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
};
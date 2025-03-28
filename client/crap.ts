console.log("Code from typescript")






// Function to interpolate between colors to display numeric things in the map


type HexColor = `#{string}`

type ColorBreakpoint = {
    position: number;
    color: HexColor;
};


export type NumericProperty = "dbm" | "asuLevel" | "level" |
    // 4G
    "cqi" | "cqiTableIndex" | "rsrp" | "rsrq" | "rssi" | "rssnr" |
    // 5G
    "csiRsrp" | "csiCqiTableIndex" | "csiRsrq" | "csiSinr" | "ssRsrp" | "ssRsrq" | "ssSinr"


// I need to compute always the percentage (constrain in the min,max range)
// For numeric elements, interpolation should be fine


// For categories probably I need icons
// getValueColor



const units = new Map<NumericProperty, string>([

    ['dbm', 'dBm'],
    // Levels are arbitrary abstract lengths
    ['asuLevel', 'arbitrary'],
    ['level', 'arbitrary'],

    // 4G
    ['cqi', 'arbitrary'],
    ['cqiTableIndex', '?'],
    ['rsrp', 'dBm'],
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

export function getPropertyUnit(signalPropertyName: NumericProperty): string {

    return units.get(signalPropertyName)!!
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
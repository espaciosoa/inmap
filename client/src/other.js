

function diffKeysBySubstring(obj1, obj2) {
    const result = {};

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    keys1.forEach(key1 => {
        keys2.forEach(key2 => {
            // Check if key1 contains key2 or key2 contains key1 (case-insensitive)
            if (
                key1.toLowerCase().includes(key2.toLowerCase()) ||
                key2.toLowerCase().includes(key1.toLowerCase())
            ) {
                const val1 = Number(obj1[key1]);
                const val2 = Number(obj2[key2]);

                if (!isNaN(val1) && !isNaN(val2)) {
                    // Use a combined key name for output (e.g., key1_key2)
                    const combinedKey = `${key1}_${key2}`;
                    result[combinedKey] = val1 - val2;
                }
            }
        });
    });

    return result;
}

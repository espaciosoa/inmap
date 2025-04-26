function JSONParseOrDefault(value, defaultValue = null) {
    try {
        return JSON.parse(value);
    } catch (e) {
        return defaultValue;
    }
}

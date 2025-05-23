function JSONParseOrDefault(value, defaultValue = null) {
    try {
        return JSON.parse(value);
    } catch (e) {
        return defaultValue;
    }
}




function isEmptyObject(obj) {
  return Object.keys(obj).length === 0;
}

module.exports = {
    isEmptyObject
}
export function lineWrap(str, paddingLength) {
    if (!paddingLength) {
        paddingLength = 0;
    }
    var output = [];
    for (var line of str.split('\n')) {
        if (line.length > 69) {
            while (line.length > 69) {
                output.push(line.substring(0, 69));
                line = Array(paddingLength).join(" ") + line.substring(69);
            }
            output.push(line);
        }
        else {
            output.push(line);
        }
    }
    return output.join("\n");
}

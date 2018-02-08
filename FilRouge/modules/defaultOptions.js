export default function fillWithDefault(options, defaultOption, verbose=true) {
    for (let attr in defaultOption) {
        if (defaultOption.hasOwnProperty(attr) && !options.hasOwnProperty(attr)) {
            if (verbose) {
                console.log(`No value for attribute ${attr}, default value affected : ${defaultOption[attr]}`);
            }
            options[attr] = defaultOption[attr];
        }
    }
    return options;
}
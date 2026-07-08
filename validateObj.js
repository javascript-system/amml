function validateObject(template, targetObj) {
    const valid = {};
    const missing = {};

    function parseRule(ruleStr) {
        const isRequired = ruleStr.startsWith('!');
        const isOptional = ruleStr.startsWith('?');
        const expectedType = ruleStr.replace(/[!?]/g, '');
        return { isRequired, isOptional, expectedType };
    }

    for (const [key, rules] of Object.entries(template)) {
        const hasKey = key in targetObj;
        const actualValue = targetObj[key];

        if (typeof rules === 'string') {
            const { isRequired, isOptional, expectedType } = parseRule(rules);

            if (!hasKey) {
                if (isRequired) {
                    missing[key] = { msg: `Missing required field (expected ${expectedType})`, type: 'ERR' };
                } else if (!isOptional) {
                    missing[key] = { msg: `Warning: recommended missing field (expected ${expectedType})`, type: 'WARN' };
                }
                continue;
            }

            if (typeof actualValue === expectedType) {
                valid[key] = actualValue;
            } else {
                missing[key] = { msg: `Type mismatch: expected ${expectedType}, got ${typeof actualValue}`, type: 'ERR' };
            }
        } 
        else if (typeof rules === 'object' && rules !== null) {
            if (!hasKey) {
                missing[key] = { msg: `Warning: recommended missing field (expected ${rules.type})`, type: 'WARN' };
                continue;
            }

            if (rules.type === 'array') {
                if (!Array.isArray(actualValue)) {
                    missing[key] = { msg: `Type mismatch: expected array, got ${typeof actualValue}`, type: 'ERR' };
                    continue;
                }

                const validArray = [];
                const arrayErrors = {};

                actualValue.forEach((item, index) => {
                    if (rules.basic) {
                        const { isRequired, isOptional, expectedType } = parseRule(rules.basic);
                        const isMatch = typeof item === expectedType;

                        if (isMatch) {
                            validArray.push(item);
                        } else {
                            if (isRequired) {
                                arrayErrors[index] = { msg: `Type mismatch in array: expected ${expectedType}, got ${typeof item}`, type: 'ERR' };
                            } else if (isOptional) {
                                validArray.push(item);
                            } else {
                                arrayErrors[index] = { msg: `Warning: type mismatch in array (expected ${expectedType}, got ${typeof item})`, type: 'WARN' };
                                validArray.push(item);
                            }
                        }
                    } else if (rules.template) {
                        const result = validateObject(rules.template, item);
                        if (Object.keys(result.missing).length > 0) {
                            arrayErrors[index] = result.missing;
                        }
                        validArray.push(result.valid);
                    }
                });

                if (Object.keys(arrayErrors).length > 0) {
                    missing[key] = { msg: `Array validation failed`, type: 'ERR', errors: arrayErrors };
                }
                valid[key] = validArray;
            } 
            else if (rules.type === 'object') {
                if (typeof actualValue !== 'object' || actualValue === null || Array.isArray(actualValue)) {
                    missing[key] = { msg: `Type mismatch: expected object, got ${Array.isArray(actualValue) ? 'array' : typeof actualValue}`, type: 'ERR' };
                    continue;
                }

                if (rules.template) {
                    const result = validateObject(rules.template, actualValue);
                    if (Object.keys(result.missing).length > 0) {
                        missing[key] = { msg: `Object validation failed`, type: 'ERR', errors: result.missing };
                    }
                    valid[key] = result.valid;
                } else {
                    valid[key] = actualValue;
                }
            }
        }
    }

    return { valid, missing };
}

module.exports = validateObject;
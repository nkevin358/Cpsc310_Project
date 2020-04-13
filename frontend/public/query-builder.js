/**
 * Builds a query object using the current document object model (DOM).
 * Must use the browser's global document object {@link https://developer.mozilla.org/en-US/docs/Web/API/Document}
 * to read DOM information.
 *
 * @returns query object adhering to the query EBNF
 */
CampusExplorer.buildQuery = function() {
    let query = {};
    // must be extracted using the browser-native global DOCUMENT object
    // only has 2 ids: rooms and courses
    // JS interacts with DOM: document.getElementsByClassName('logo')[0].textContent
    // const activeTab = document.getElementsByClassName('tab-panel active')[0];
    let tabType = document.getElementsByClassName('nav-item tab active')[0].textContent;
    let type = tabType.toLowerCase();
    let typeIndex = 0;
    if (type === "rooms") {typeIndex = 1;}
    // save Conditions to query object
    let buffer = [];
    let condContainer = document.getElementsByClassName('conditions-container')[typeIndex];
    let countCond = condContainer.childElementCount;
    let mfield = ['avg' , 'pass' , 'fail' , 'audit' , 'year' , 'lat' , 'lon' ,'seats' ];
    for (let c = 0; c < countCond; c++) {
        let newCond = {};
        let pair = {};
        // change if rooms
        let controlField = condContainer.getElementsByClassName('control fields')[c];
        let conditionSelector = controlField.getElementsByTagName('select')[0].selectedOptions[0].value;
        let valueEntered = condContainer.getElementsByClassName('control term')[c].getElementsByTagName('input')[0].value;
        // if (!isNaN(valueEntered)) {valueEntered = Number(valueEntered);}
        if(mfield.includes(conditionSelector) && !isNaN(valueEntered)) {valueEntered = Number(valueEntered);}
        conditionSelector = type + '_' + conditionSelector;
        pair[conditionSelector] = valueEntered;
        let controlOperator = condContainer.getElementsByClassName('control operators')[c];
        let operator = controlOperator.getElementsByTagName('select')[0].selectedOptions[0].value;
        newCond[operator] = pair;
        if (condContainer.getElementsByClassName('control not')[c].getElementsByTagName('input')[0].checked) {
            let not = {};
            not["NOT"] = newCond;
            buffer.push(not);
        } else {buffer.push(newCond);}
    }

    if (countCond === 1) {
        query["WHERE"] = buffer[0];
    } else {
    if (document.getElementById(type + '-conditiontype-all').checked) { // all of the conds
        let and = {};
        and["AND"] = buffer;
        query["WHERE"] = and;
    } else if (document.getElementById(type + '-conditiontype-any').checked) { // any of the conds
        let or = {};
        or["OR"] = buffer;
        query["WHERE"] = or;
    } else { // none of the conds
        let or = {};
        let not = {};
        or["OR"] = buffer;
        not["NOT"] = or;
        query["WHERE"] = not;
    }}
    if (countCond === 0) {query["WHERE"] = {};}

    // construct OPTIONS
    let columnArray = [];
    let controlGroup = document.getElementsByClassName('form-group columns')[typeIndex].getElementsByClassName('control-group')[0];
    let acount = controlGroup.childElementCount;
    let count = 0;
    let countTrans = 0;
    while (count < acount) {
        let element = controlGroup.getElementsByClassName('control field')[count];
        if(element === undefined) {
            element = controlGroup.getElementsByClassName('control transformation')[countTrans];
            countTrans++;
            if (element.getElementsByTagName('input')[0].checked) {
                let field = element.getElementsByTagName('input')[0].value;
                columnArray.push(field);}
        } else if (element.getElementsByTagName('input')[0].checked) {
            let field = element.getElementsByTagName('input')[0].value;
            columnArray.push(type + '_' + field);
        }
        count++;
    }
    let column = {};
    column["COLUMNS"] = columnArray;
    query["OPTIONS"] = column;


    // construct ORDER
    let orderArray = [];
    let controlOrder = document.getElementsByClassName('control order fields')[typeIndex];
    let selectMultiple = controlOrder.getElementsByTagName('select')[0];
    let length = selectMultiple.childElementCount;
    for (let i = 0; i<length; i++) {
        let element= selectMultiple.getElementsByTagName('option')[i];
        if (element.selected) {
        let value = element.value;
        // if (type === "audit" || type === "avg" || type === "dept" || type === "fail" || type === "id" || type === "instructor" || type === "pass" || type === "title" || type === "uuid" || type === "year") {
        let orderValue = type + '_' + value;
        if (element.className === "transformation") {orderValue = value;}
        orderArray.push(orderValue);}
    }

    /*if (orderArray.length === 1) {
        column["ORDER"] = orderArray[0];
    } else {*/
        let order = {};
        let desc = document.getElementsByClassName('control descending')[typeIndex].getElementsByTagName('input')[0].checked;
        if (desc) {
            order["dir"] = "DOWN";
            order["keys"] = orderArray;
        } else {
            order["dir"] = "UP";
            order["keys"] = orderArray;
        }
        if (orderArray.length !== 0) {column["ORDER"] = order;} //if no order selected, no ORDER field
        if (orderArray.length === 1 && !desc) { // if only one order field, and !desc, just orderkey
            column["ORDER"] = orderArray[0];
        }
    //}


    //construct Transformations
    // TODO: transformation field in Group
    let trans = {};
    let groupArray = [];
    let groupControl = document.getElementsByClassName('form-group groups')[typeIndex].getElementsByClassName('control-group')[0];

    let gcount = groupControl.childElementCount;
    let c= 0;
    while (c < gcount) {
        let element = groupControl.getElementsByClassName('control field')[c];
        if (element.getElementsByTagName('input')[0].checked) {
            let field = element.getElementsByTagName('input')[0].value;
            groupArray.push(type + '_' + field);
        }
        c++;
    }

    // apply
    let applyArray = [];
    let applyContainer = document.getElementsByClassName('transformations-container')[typeIndex];
    let countApply = applyContainer.childElementCount;
    for (let c = 0; c < countApply; c++) {
        let newApply = {};
        let pair = {};
        let transSelector = applyContainer.getElementsByClassName('control operators')[c].getElementsByTagName('select')[0].selectedOptions[0].value;
        let fieldValue = applyContainer.getElementsByClassName('control fields')[c].getElementsByTagName('select')[0].selectedOptions[0].value;
        fieldValue = type + '_' + fieldValue;
        pair[transSelector] = fieldValue;
        let valueEntered = applyContainer.getElementsByClassName('control term')[c].getElementsByTagName('input')[0].value;
        newApply[valueEntered] = pair;
        applyArray.push(newApply);
    }

    if (applyArray.length !== 0 || groupArray.length !== 0) {
        trans["APPLY"] = applyArray;
        trans["GROUP"] = groupArray;
        query["TRANSFORMATIONS"] = trans;
    }

    return query;
};

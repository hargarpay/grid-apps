/** Copyright 2014-2019 Stewart Allen -- All Rights Reserved */

"use strict";

var gs_moto_ui = exports;

(function() {

    var moto = self.moto = self.moto || {};
    if (moto.ui) return;

    let SELF = self,
        lastGroup = null,
        lastDiv = null,
        addTo = null,
        hideAction = null,
        inputAction = null,
        groups = {},
        groupShow = {},
        groupName = undefined,
        hasModes = [],
        isExpert = [],
        letMode = null,
        letExpert = false,
        SDB = moto.KV,
        DOC = SELF.document,
        prefix = "tab",
        NOMODE = "nomode",
        compact = false;

    SELF.$ = (SELF.$ || function (id) { return DOC.getElementById(id) } );

    moto.ui = {
        prefix: function(pre) { prefix = pre; return moto.ui },
        hideAction: function(fn) { hideAction = fn; return moto.ui },
        inputAction: function(fn) { inputAction = fn; return moto.ui },
        setMode: setMode,
        setExpert: setExpert,
        bound: bound,
        toInt: toInt,
        toFloat: toFloat,
        hidePop: hidePop,
        isPopped: isPopped,
        newText: newTextArea,
        newLabel: newLabel,
        newRange: newRange,
        newInput: newInputField,
        newButton: newButton,
        newBoolean: newBooleanField,
        newSelect: newSelect,
        newTable: newTables,
        newTableRow: newTableRow,
        newRow: newRow,
        newBlank: newBlank,
        newGroup: newGroup,
        setGroup: setGroup,
        checkpoint,
        restore
    };

    function setMode(mode) {
        letMode = mode;
        hasModes.forEach(function(div) {
            div.setMode(div._group && !groupShow[div._group] ? NOMODE : mode);
        });
    }

    function setExpert(bool) {
        letExpert = bool;
        setMode(letMode);
    }

    function checkpoint() {
        return { addTo, lastDiv, lastGroup, groupName };
    }

    function restore(opt) {
        if (opt) {
            addTo = opt.addTo;
            lastDiv = opt.lastDiv;
            lastGroup = opt.lastGroup;
            groupName = opt.groupName;
        }
    }

    function setGroup(div) {
        addTo = lastDiv = div;
        groupName = undefined;
        return div;
    }

    function newGroup(label, div, options) {
        lastDiv = div || lastDiv;
        return addCollapsableGroup(label, lastDiv, options);
    }

    function addCollapsableGroup(label, div, options) {
        let row = DOC.createElement('div'),
            a = DOC.createElement('a'),
            dbkey = `${prefix}-show-${label}`;

        if (compact) {
            let pop = DOC.createElement('div');
            pop.setAttribute('class','popper');
            row.appendChild(pop);
            addTo = pop;
        } else {
            addTo = lastDiv;
        }

        div.appendChild(row);
        row.setAttribute("class", "grouphead noselect");
        row.appendChild(a);
        a.appendChild(DOC.createTextNode(label));
        addModeControls(row, options);
        groupName = label;
        lastGroup = groups[label] = [];
        groupShow[label] = SDB[dbkey] !== 'false';
        row.onclick = function() {
            collapseGroup(label, dbkey);
        };

        return row;
    }

    function collapseGroup(groupname, dbkey) {
        let show = SDB[dbkey] === 'false';
        let group = groups[groupname];
        group.forEach(div => {
            if (show) div.setMode(letMode);
            else div.setMode(NOMODE);
        });
        groupShow[groupname] = SDB[dbkey] = show;
    }

    function toInt() {
        let nv = this.value !== '' ? parseInt(this.value) : null;
        if (isNaN(nv)) nv = 0;
        if (nv !== null && this.bound) nv = this.bound(nv);
        this.value = nv;
        return nv;
    }

    function toFloat() {
        let nv = this.value !== '' ? parseFloat(this.value) : null;
        if (nv !== null && this.bound) nv = this.bound(nv);
        this.value = nv;
        return nv;
    }

    function bound(low,high) {
        return function(v) {
            if (isNaN(v)) return low;
            return v < low ? low : v > high ? high : v;
        };
    }

    function raw() {
        return this.value !== '' ? this.value : null;
    }

    function newLabel(text) {
        let label = DOC.createElement('label');
        label.appendChild(DOC.createTextNode(text));
        label.setAttribute("class", "noselect");
        return label;
    }

    function addId(el, options) {
        if (options && options.id) {
            el.setAttribute("id", options.id);
        }
    }

    function addModeControls(el, options) {
        options = options || {};
        el.__show = true;
        el.__modeSave = null;
        el.showMe = function() {
            if (el.__show) return;
            el.style.display = el.__modeSave;
            el.__show = true;
            el.__modeSave = null;
        };
        el.hideMe = function() {
            if (!el.__show) return;
            el.__show = false;
            el.__modeSave = el.style.display;
            el.style.display = 'none';
        };
        el.setVisible = function(show) {
            if (show) el.showMe();
            else el.hideMe();
        };
        el.setMode = function(mode) {
            let show = options.expert === undefined || (options.expert === letExpert);
            el.setVisible(el.hasMode(mode) && show);
        }
        el.hasMode = function(mode) {
            if (mode === NOMODE) return false;
            if (!el.modes) return true;
            return el.modes.contains(mode);
        }
        if (options.modes) {
            el.modes = options.modes;
            hasModes.push(el);
        }
    }

    function newDiv(options) {
        let div = DOC.createElement('div');
        addModeControls(div, options);
        addTo.appendChild(div);
        lastGroup.push(div);
        div._group = groupName;
        return div;
    }

    let lastPop = null;

    function hidePop() {
        if (lastPop) lastPop.style.display = "none";
        lastPop = null;
    }

    function isPopped() {
        return lastPop !== null;
    }

    function newTextArea(label, options) {
        let opt = options || {},
            row = newDiv(options),
            btn = DOC.createElement("button"),
            box = DOC.createElement("div"),
            pop = DOC.createElement("div"),
            lbl = DOC.createElement("label"),
            txt = DOC.createElement("textarea");

        pop.setAttribute("class", "poptext flow-col");
        box.setAttribute("style", "position: relative");
        box.appendChild(pop);
        pop.appendChild(lbl);
        pop.appendChild(txt);
        lbl.appendChild(DOC.createTextNode(label));

        txt.setAttribute("cols", 40);
        txt.setAttribute("rows", 20);
        txt.setAttribute("wrap", "off");

        btn.appendChild(DOC.createTextNode("edit"));
        btn.onclick = function(ev) {
            btn.parentNode.appendChild(box);
            btn.parentNode.onclick = btn.onclick;
            ev.stopPropagation();
            txt.scrollTop = 0;
            txt.scrollLeft = 0;
            txt.selectionEnd = 0;
            let rows = txt.value.split('\n');
            let cols = 0;
            rows.forEach(row => {
                cols = Math.max(cols, row.length);
            });
            txt.setAttribute("cols", Math.max(30, cols + 1));
            txt.setAttribute("rows", Math.max(10, rows.length + 1));
            // drop clicks on TextArea
            if (ev.target === txt) {
                ev.target.focus();
            } else {
                let showing = pop === lastPop;
                hidePop();
                if (!showing) {
                    pop.style.display = "flex";
                    lastPop = pop;
                    txt.focus();
                }
            }
        };
        addModeControls(btn, opt);
        addId(btn, opt);

        row.appendChild(newLabel(label));
        row.appendChild(btn);
        row.setAttribute("class", "flow-row");
        if (opt.title) row.setAttribute("title", options.title);
        btn.setVisible = row.setVisible;

        return txt;
    }

    function newInputField(label, options) {
        let row = newDiv(options),
            hide = options && options.hide,
            size = options ? options.size || 5 : 5,
            height = options ? options.height : 0,
            ip = height > 1 ? DOC.createElement('textarea') : DOC.createElement('input'),
            action = inputAction;

        row.appendChild(newLabel(label));
        row.appendChild(ip);
        row.setAttribute("class", "flow-row");
        if (height > 1) {
            ip.setAttribute("cols", size);
            ip.setAttribute("rows", height);
            ip.setAttribute("wrap", "off");
        } else {
            ip.setAttribute("size", size);
        }
        ip.setAttribute("type", "text");
        row.style.display = hide ? 'none' : '';
        if (options) {
            if (options.disabled) ip.setAttribute("disabled", "true");
            if (options.title) row.setAttribute("title", options.title);
            if (options.convert) ip.convert = options.convert.bind(ip);
            if (options.bound) ip.bound = options.bound;
            if (options.action) action = options.action;
        }
        ip.addEventListener('focus', function(event) {
            hidePop();
        });
        if (action) {
            ip.addEventListener('keydown', function(event) {
                let key = event.key;
                if (
                    options.text ||
                    (key >= '0' && key <= '9') ||
                    key === '.' ||
                    key === '-' ||
                    key === 'Backspace' ||
                    key === 'ArrowLeft' ||
                    key === 'ArrowRight' ||
                    key === 'Tab' ||
                    event.metaKey ||
                    event.ctrlKey
                ) {
                    return;
                }
                event.preventDefault();
                event.stopPropagation();
            });
            ip.addEventListener('keyup', function(event) {
                if (event.keyCode === 13) {
                    // action(event);
                    ip.blur();
                }
            });
            ip.addEventListener('blur', function(event) {
                action(event);
            });
        }
        if (!ip.convert) ip.convert = raw.bind(ip);
        ip.setVisible = row.setVisible;

        return ip;
    }

    function newRange(label, options) {
        let row = newDiv(options),
            ip = DOC.createElement('input'),
            hide = options && options.hide,
            action = inputAction;

        if (label) row.appendChild(newLabel(label));
        row.appendChild(ip);
        row.setAttribute("class", "flow-row");
        ip.setAttribute("type", "range");
        ip.setAttribute("min", (options && options.min ? options.min : 0));
        ip.setAttribute("max", (options && options.max ? options.max : 100));
        ip.setAttribute("value", 0);
        row.style.display = hide ? 'none' : '';
        if (options) {
            if (options.title) {
                ip.setAttribute("title", options.title);
                row.setAttribute("title", options.title);
            }
            if (options.action) action = options.action;
        }
        ip.setVisible = row.setVisible;

        return ip;
    }

    function newSelect(label, options, source) {
        let row = newDiv(options),
            ip = DOC.createElement('select'),
            hide = options && options.hide,
            action = inputAction;

        row.appendChild(newLabel(label));
        row.appendChild(ip);
        row.setAttribute("source", source || "tools");
        row.setAttribute("class", "flow-row");
        row.style.display = hide ? 'none' : '';
        if (options) {
            if (options.convert) ip.convert = options.convert.bind(ip);
            if (options.disabled) ip.setAttribute("disabled", "true");
            if (options.title) row.setAttribute("title", options.title);
            if (options.action) action = options.action;
        }
        ip.onchange = function() { action() };
        ip.setVisible = row.setVisible;

        return ip;
    }

    function newBooleanField(label, action, options) {
        let row = newDiv(options),
            ip = DOC.createElement('input'),
            hide = options && options.hide;

        if (label) {
            row.appendChild(newLabel(label));
        }
        row.appendChild(ip);
        row.setAttribute("class", "flow-row");
        row.style.display = hide ? 'none' : '';
        ip.setAttribute("type", "checkbox");
        ip.checked = false;
        if (options) {
            if (options.disabled) ip.setAttribute("disabled", "true");
            if (options.title) {
                ip.setAttribute("title", options.title);
                row.setAttribute("title", options.title);
            }
        }
        if (action) ip.onclick = function() { action() };
        ip.setVisible = row.setVisible;

        return ip;
    }

    function newBlank(options) {
        let row = newDiv(options),
            hide = options && options.hide;

        row.setAttribute("class", "flow-row");
        row.style.display = hide ? 'none' : '';
        ip.setVisible = row.setVisible;

        return ip;
    }

    function newButton(label, action, options) {
        let b = DOC.createElement('button'),
            t = DOC.createTextNode(label);
        b.appendChild(t);
        b.onclick = function() { action() };
        addModeControls(b, options);
        addId(b, options);
        return b;
    }

    function newTableRow(arrayOfArrays, options) {
        return newRow(newTables(arrayOfArrays), options);
    }

    function newTables(arrayOfArrays) {
        let array = [];
        for (let i=0; i<arrayOfArrays.length; i++) {
            array.push(newRowTable(arrayOfArrays[i]));
        }
        return array;
    }

    function newRowTable(array) {
        let div = newDiv();
        div.setAttribute("class", "tablerow");
        array.forEach(function(c) {
            div.appendChild(c);
        });
        return div;
    }

    function newRow(children, options) {
        let row = addCollapsableElement((options && options.noadd) ? null : lastDiv);
        if (children) children.forEach(function (c) { row.appendChild(c) });
        addModeControls(row, options);
        return row;
    }

    function addCollapsableElement(parent) {
        let row = newDiv();
        if (parent) parent.appendChild(row);
        if (lastGroup) lastGroup.push(row);
        return row;
    }

})();

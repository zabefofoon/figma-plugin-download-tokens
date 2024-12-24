"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/**
 * Local Variables의 color
 * Local Styles의 Color styles (solid만)
 * Local Styles의 Text styles
 **/
let valid = true;
function transformFontWeight(str) {
    switch (str) {
        case "Thin":
            return 100;
        case "Extra Light":
            return 200;
        case "Light":
            return 300;
        case "Regular":
            return 400;
        case "Medium":
            return 500;
        case "Semi Bold":
            return 600;
        case "Bold":
            return 700;
        case "Extra Bold":
            return 800;
        case "Black":
            return 900;
        default:
            return 400;
    }
}
function dropShadowToCSS(data) {
    const { r, g, b, a } = data.color;
    const { x, y } = data.offset;
    const radius = data.radius;
    const spread = data.spread;
    const color = `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
    return `${x}px ${y}px ${radius}px ${spread}px ${color}`;
}
function gradientToCSS(name, data) {
    const gradientStops = data.gradientStops.map((stop) => {
        const { r, g, b, a } = stop.color;
        const position = (stop.position * 100).toFixed(2);
        return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a}) ${position}%`;
    });
    const gradientTransform = data.gradientTransform;
    const x1 = gradientTransform[0][0];
    const y1 = gradientTransform[0][1];
    const x2 = gradientTransform[1][0];
    const y2 = gradientTransform[1][1];
    const angle = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
    const adjustedAngle = (angle + 360) % 360;
    const splittedName = name.split("-");
    const deg = splittedName[splittedName.length - 1];
    return `linear-gradient(${deg}deg, ${gradientStops.join(", ")})`;
}
function rgbToHex({ r, g, b }) {
    const toHex = (value) => {
        const result = Math.round(value * 255).toString(16); // 0-1 범위를 0-255로 변환
        return result.length === 1 ? `0${result}` : result;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
function setObj(obj, nameString, value) {
    const keys = nameString.split("/");
    function setNestedObject(currentObj, keys, value) {
        const [key, ...restKeys] = keys;
        if (!restKeys.length) {
            currentObj[key] = value;
        }
        else {
            if (!currentObj[key])
                currentObj[key] = {};
            if (typeof currentObj[key] === "object") {
                setNestedObject(currentObj[key], restKeys, value);
            }
        }
    }
    setNestedObject(obj, keys, value);
}
function setColorVariables(variable, obj) {
    const [theme, name] = variable.name.split('/');
    if (!name) {
        alert(`When specifying a color, you need to select a theme.\n${theme}(X)\n\nex) white/--bg-red-100`);
        valid = false;
        return;
    }
    if (!name.includes('--')) {
        alert(`The name of the color must include "--${name}".`);
        valid = false;
        return;
    }
    const colorValues = Object.keys(variable.valuesByMode).map((key) => variable.valuesByMode[key]);
    setObj(obj, variable.name, rgbToHex(colorValues[0]));
}
function setEtcVariables(variable, obj) {
    const [_, responsiveMode, name] = variable.name.split('/');
    if (!name) {
        alert(`When specifying a round, you need to specify responsive mode.\n${responsiveMode}(X)\n\nex) Rounded/pc/--rounded-sm`);
        valid = false;
        return;
    }
    if (!name.includes('--')) {
        alert(`The name of the round must include "--${name}".`);
        valid = false;
        return;
    }
    const values = Object.keys(variable.valuesByMode).map((key) => variable.valuesByMode[key]);
    setObj(obj, variable.name, values[0]);
}
function setPaintStyles(paint, obj) {
    const item = paint.paints[0];
    const [theme, name] = paint.name.split('/');
    if (!name) {
        alert(`When specifying a color, you need to specify a theme.\n${theme}(X)\n\nex) white/--bg-red-100`);
        valid = false;
        return;
    }
    if (!name.includes('--')) {
        alert(`The name of the color must be "--${name}".`);
        valid = false;
        return;
    }
    if (item.type === "SOLID")
        setObj(obj, paint.name, rgbToHex(item.color));
    if (item.type === "GRADIENT_LINEAR")
        setObj(obj, paint.name, gradientToCSS(paint.name, item));
}
function setEffectStyles(effect, obj) {
    const [responsiveMode, name] = effect.name.split('/');
    if (!name) {
        alert(`When specifying a shadow, you need to specify responsive mode.\n${responsiveMode}(X)\n\nex) pc/--shadow-sm`);
        valid = false;
        return;
    }
    if (!name.includes('--')) {
        alert(`The name of the shadow must include "--${name}".`);
        valid = false;
        return;
    }
    const item = effect.effects[0];
    if (item.type === "DROP_SHADOW")
        setObj(obj, effect.name, dropShadowToCSS(item));
}
function setTextStyles(textStyle, obj) {
    const [theme, name] = textStyle.name.split('/');
    if (!name) {
        alert(`When specifying a text style, you need to specific a responsive mode.\n${theme}(X)\n\nex) pc/--heading-1`);
        valid = false;
        return;
    }
    if (!name.includes('--')) {
        alert(`The name of the text style must be "--${name}".`);
        valid = false;
        return;
    }
    const keys = textStyle.name.split("/");
    function setNestedStyles(currentObj, keys, textStyle) {
        const [key, ...restKeys] = keys;
        if (!restKeys.length) {
            if (textStyle.type === "TEXT") {
                addTextStyle(currentObj, key, textStyle);
            }
        }
        else {
            if (!currentObj[key])
                currentObj[key] = {};
            setNestedStyles(currentObj[key], restKeys, textStyle);
        }
    }
    setNestedStyles(obj, keys, textStyle);
}
const addTextStyle = (target, prefix, textStyle) => {
    target[prefix] = {
        "font-size": `${textStyle.fontSize}px`,
        // "font-family": textStyle.fontName.family,
        "font-weight": transformFontWeight(textStyle.fontName.style),
        "line-height": textStyle.lineHeight.unit === "AUTO"
            ? "unset"
            : textStyle.lineHeight.unit === "PIXELS"
                ? `${textStyle.lineHeight.value}px`
                : `${textStyle.lineHeight.value}%`,
        "letter-spacing": textStyle.letterSpacing.unit === "PIXELS"
            ? `${textStyle.letterSpacing.value}px`
            : `${(textStyle.fontSize / 100) * textStyle.letterSpacing.value}px`,
    };
};
figma.showUI(__html__);
figma.ui.onmessage = (msg) => __awaiter(void 0, void 0, void 0, function* () {
    if (msg.type === "export") {
        valid = true;
        const result = {};
        const colors = {};
        const texts = {};
        const shadows = {};
        // textStyles로부터 셋팅
        const textStyles = yield figma.getLocalTextStylesAsync();
        for (const textStyle of textStyles)
            setTextStyles(textStyle, texts);
        // paientStyles로부터 셋팅
        const paints = yield figma.getLocalPaintStylesAsync();
        for (const paint of paints)
            setPaintStyles(paint, colors);
        const effects = yield figma.getLocalEffectStylesAsync();
        for (const effect of effects)
            setEffectStyles(effect, shadows);
        // variables으로부터 셋팅
        const variables = yield figma.variables.getLocalVariablesAsync();
        for (const variable of variables) {
            if ((variable === null || variable === void 0 ? void 0 : variable.resolvedType) === "COLOR")
                setColorVariables(variable, colors);
            else if ((variable === null || variable === void 0 ? void 0 : variable.resolvedType) === "FLOAT" || (variable === null || variable === void 0 ? void 0 : variable.resolvedType) === "STRING")
                setEtcVariables(variable, result);
        }
        result.colors = colors;
        result.texts = texts;
        result.shadows = shadows;
        if (!valid)
            return;
        valid = true;
        figma.ui.postMessage({
            type: "download",
            content: result,
        });
    }
});

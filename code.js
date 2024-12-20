"use strict";
/**
 * Local Variables의 color
 * Local Styles의 Color styles (solid만)
 * Local Styles의 Text styles
 **/
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
    const colorValues = Object.keys(variable.valuesByMode).map((key) => variable.valuesByMode[key]);
    setObj(obj, variable.name, rgbToHex(colorValues[0]));
}
function setEtcVariables(variable, obj) {
    const values = Object.keys(variable.valuesByMode).map((key) => variable.valuesByMode[key]);
    setObj(obj, variable.name, values[0]);
}
function setPaintStyles(paint, obj) {
    const item = paint.paints[0];
    if (item.type === "SOLID")
        setObj(obj, paint.name, rgbToHex(item.color));
}
function setTextStyles(textStyle, obj) {
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
    target[`${prefix}-size`] = textStyle.fontSize;
    target[`${prefix}-font-family`] = textStyle.fontName.family;
    target[`${prefix}-font-style`] = textStyle.fontName.style;
    target[`${prefix}-line-height`] =
        textStyle.lineHeight.unit === "AUTO"
            ? "unset"
            : textStyle.lineHeight.unit === "PIXELS"
                ? `${textStyle.lineHeight.value}px`
                : `${textStyle.lineHeight.value}%`;
    target[`${prefix}-letter-spacing`] =
        textStyle.letterSpacing.unit === "PIXELS"
            ? `${textStyle.letterSpacing.value}px`
            : `${(textStyle.fontSize / 100) * textStyle.letterSpacing.value}px`;
};
figma.showUI(__html__);
figma.ui.onmessage = (msg) => __awaiter(void 0, void 0, void 0, function* () {
    if (msg.type === "export") {
        const result = {};
        const colors = {};
        const texts = {};
        // textStyles로부터 셋팅
        const textStyles = yield figma.getLocalTextStylesAsync();
        for (const textStyle of textStyles)
            setTextStyles(textStyle, texts);
        // paientStyles로부터 셋팅
        const paints = yield figma.getLocalPaintStylesAsync();
        for (const paint of paints)
            setPaintStyles(paint, colors);
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
        figma.ui.postMessage({
            type: "download",
            content: result,
        });
    }
});

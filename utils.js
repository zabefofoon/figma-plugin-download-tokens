export default {
    rgbToHex({ r, g, b }) {
        const toHex = (value) => {
            const result = Math.round(value * 255).toString(16); // 0-1 범위를 0-255로 변환
            return result.length === 1 ? `0${result}` : result;
        };
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    },
};

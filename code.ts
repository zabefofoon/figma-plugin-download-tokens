/**
 * Local Variables의 color
 * Local Styles의 Color styles (solid만)
 * Local Styles의 Text styles
 **/

function rgbToHex({ r, g, b }: RGB | RGBA) {
  const toHex = (value: number) => {
    const result = Math.round(value * 255).toString(16) // 0-1 범위를 0-255로 변환
    return result.length === 1 ? `0${result}` : result
  }
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function setObj(obj: Record<string, any>, nameString: string, value: any) {
  const [theme, name] = nameString.split("/")
  if (!name) {
    obj[theme] = value
  } else {
    if (!obj[theme]) obj[theme] = {}
    if (typeof obj[theme] === "object") obj[theme][name] = value
  }
}

function setColorVariables(variable: Variable, obj: Record<string, any>) {
  const colorValues = Object.keys(variable.valuesByMode).map(
    (key) => variable.valuesByMode[key]
  ) as RGBA[]

  setObj(obj, variable.name, rgbToHex(colorValues[0]))
}

function setEtcVariables(variable: Variable, obj: Record<string, any>) {
  const values = Object.keys(variable.valuesByMode).map((key) => variable.valuesByMode[key])
  setObj(obj, variable.name, values[0])
}

function setPaintStyles(paint: PaintStyle, obj: Record<string, any>) {
  const item = paint.paints[0]
  if (item.type === "SOLID") setObj(obj, paint.name, rgbToHex(item.color))
}

function setTextStyles(textStyle: TextStyle, obj: Record<string, any>) {
  const [folder, name] = textStyle.name.split("/")
  if (!name) {
    if (textStyle.type === "TEXT") addTextStyle(obj, textStyle.name, textStyle)
  } else {
    if (!obj[folder]) obj[folder] = {}
    if (textStyle.type === "TEXT") addTextStyle(obj[folder], name, textStyle)
  }
}

const addTextStyle = (target: any, prefix: string, textStyle: TextStyle) => {
  target[`${prefix}-size`] = textStyle.fontSize
  target[`${prefix}-font-family`] = textStyle.fontName.family
  target[`${prefix}-font-style`] = textStyle.fontName.style
  target[`${prefix}-line-height`] =
    textStyle.lineHeight.unit === "AUTO"
      ? "unset"
      : textStyle.lineHeight.unit === "PIXELS"
      ? `${textStyle.lineHeight.value}px`
      : `${textStyle.lineHeight.value}%`

  target[`${prefix}-letter-spacing`] =
    textStyle.letterSpacing.unit === "PIXELS"
      ? `${textStyle.letterSpacing.value}px`
      : `${(textStyle.fontSize / 100) * textStyle.letterSpacing.value}px`
}

figma.showUI(__html__)

figma.ui.onmessage = async (msg: { type: string; count: number }) => {
  if (msg.type === "export") {
    const result = {} as any

    const colors = {} as Record<string, any>
    const texts = {} as Record<string, any>

    // textStyles로부터 셋팅
    const textStyles = await figma.getLocalTextStylesAsync()
    for (const textStyle of textStyles) setTextStyles(textStyle, texts)

    // paientStyles로부터 셋팅
    const paints = await figma.getLocalPaintStylesAsync()
    for (const paint of paints) setPaintStyles(paint, colors)

    // variables으로부터 셋팅
    const variables = await figma.variables.getLocalVariablesAsync()
    for (const variable of variables) {
      if (variable?.resolvedType === "COLOR") setColorVariables(variable, colors)
      else if (variable?.resolvedType === "FLOAT" || variable?.resolvedType === "STRING")
        setEtcVariables(variable, result)
    }

    result.colors = colors
    result.texts = texts

    figma.ui.postMessage({
      type: "download",
      content: result,
    })
  }
}

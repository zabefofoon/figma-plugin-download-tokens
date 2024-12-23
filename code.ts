/**
 * Local Variables의 color
 * Local Styles의 Color styles (solid만)
 * Local Styles의 Text styles
 **/

function dropShadowToCSS(data: DropShadowEffect) {
  const { r, g, b, a } = data.color
  const { x, y } = data.offset
  const radius = data.radius
  const spread = data.spread

  const color = `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`
  return `${x}px ${y}px ${radius}px ${spread}px ${color}`
}

function gradientToCSS(name: string, data: GradientPaint) {
  const gradientStops = data.gradientStops.map((stop) => {
    const { r, g, b, a } = stop.color
    const position = (stop.position * 100).toFixed(2)
    return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(
      b * 255
    )}, ${a}) ${position}%`
  })

  const gradientTransform = data.gradientTransform
  const x1 = gradientTransform[0][0]
  const y1 = gradientTransform[0][1]
  const x2 = gradientTransform[1][0]
  const y2 = gradientTransform[1][1]

  const angle = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI
  const adjustedAngle = (angle + 360) % 360

  const splittedName = name.split("-")
  const deg = splittedName[splittedName.length - 1]
  return `linear-gradient(${deg}deg, ${gradientStops.join(", ")})`
}

function rgbToHex({ r, g, b }: RGB | RGBA) {
  const toHex = (value: number) => {
    const result = Math.round(value * 255).toString(16) // 0-1 범위를 0-255로 변환
    return result.length === 1 ? `0${result}` : result
  }
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function setObj(obj: Record<string, any>, nameString: string, value: any) {
  const keys = nameString.split("/")

  function setNestedObject(currentObj: Record<string, any>, keys: string[], value: any) {
    const [key, ...restKeys] = keys
    if (!restKeys.length) {
      currentObj[key] = value
    } else {
      if (!currentObj[key]) currentObj[key] = {}
      if (typeof currentObj[key] === "object") {
        setNestedObject(currentObj[key], restKeys, value)
      }
    }
  }

  setNestedObject(obj, keys, value)
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
  if (item.type === "GRADIENT_LINEAR") setObj(obj, paint.name, gradientToCSS(paint.name, item))
}

function setEffectStyles(effect: EffectStyle, obj: Record<string, any>) {
  const item = effect.effects[0]
  if (item.type === "DROP_SHADOW") setObj(obj, effect.name, dropShadowToCSS(item))
}

function setTextStyles(textStyle: TextStyle, obj: Record<string, any>) {
  const keys = textStyle.name.split("/")

  function setNestedStyles(currentObj: any, keys: string[], textStyle: TextStyle) {
    const [key, ...restKeys] = keys
    if (!restKeys.length) {
      if (textStyle.type === "TEXT") {
        addTextStyle(currentObj, key, textStyle)
      }
    } else {
      if (!currentObj[key]) currentObj[key] = {}
      setNestedStyles(currentObj[key], restKeys, textStyle)
    }
  }

  setNestedStyles(obj, keys, textStyle)
}

const addTextStyle = (target: any, prefix: string, textStyle: TextStyle) => {
  target[prefix] = {
    "font-size": `${textStyle.fontSize}px`,
    // "font-family": textStyle.fontName.family,
    "font-style": textStyle.fontName.style,
    "line-height":
      textStyle.lineHeight.unit === "AUTO"
        ? "unset"
        : textStyle.lineHeight.unit === "PIXELS"
          ? `${textStyle.lineHeight.value}px`
          : `${textStyle.lineHeight.value}%`,
    "letter-spacing":
      textStyle.letterSpacing.unit === "PIXELS"
        ? `${textStyle.letterSpacing.value}px`
        : `${(textStyle.fontSize / 100) * textStyle.letterSpacing.value}px`,
  }
}

figma.showUI(__html__)

figma.ui.onmessage = async (msg: { type: string; count: number }) => {
  if (msg.type === "export") {
    const result = {} as any

    const colors = {} as Record<string, any>
    const texts = {} as Record<string, any>
    const shadows = {} as Record<string, any>

    // textStyles로부터 셋팅
    const textStyles = await figma.getLocalTextStylesAsync()
    for (const textStyle of textStyles) setTextStyles(textStyle, texts)

    // paientStyles로부터 셋팅
    const paints = await figma.getLocalPaintStylesAsync()
    for (const paint of paints) setPaintStyles(paint, colors)

    const effects = await figma.getLocalEffectStylesAsync()
    for (const effect of effects) setEffectStyles(effect, shadows)

    // variables으로부터 셋팅
    const variables = await figma.variables.getLocalVariablesAsync()
    for (const variable of variables) {
      if (variable?.resolvedType === "COLOR") setColorVariables(variable, colors)
      else if (variable?.resolvedType === "FLOAT" || variable?.resolvedType === "STRING")
        setEtcVariables(variable, result)
    }

    result.colors = colors
    result.texts = texts
    result.shadows = shadows

    figma.ui.postMessage({
      type: "download",
      content: result,
    })
  }
}

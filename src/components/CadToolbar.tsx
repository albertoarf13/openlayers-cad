import { Tool } from '../types'

type Props = {
    activeTool: Tool | null
    onSelectTool: (tool: Tool | null) => void
}

export function CadToolbar({ activeTool, onSelectTool }: Props) {

    const toggle = (tool: Tool) => onSelectTool(activeTool === tool ? null : tool)

    const buttonClass = (tool: Tool) =>
        `px-3 py-2 text-sm rounded ${activeTool === tool ? 'bg-blue-600 text-white' : 'bg-white text-gray-800'
        }`

    return (
        <div className="absolute left-2 top-2 z-50 flex flex-col gap-2 rounded bg-gray-200 p-2 shadow">
            <button className={buttonClass(Tool.Select)} onClick={() => toggle(Tool.Select)}>
                Select
            </button>
            <button className={buttonClass(Tool.DrawLine)} onClick={() => toggle(Tool.DrawLine)}>
                Line
            </button>
            <button className={buttonClass(Tool.DrawPoint)} onClick={() => toggle(Tool.DrawPoint)}>
                Point
            </button>
            <button className={buttonClass(Tool.DrawPolygon)} onClick={() => toggle(Tool.DrawPolygon)}>
                Polygon
            </button>
        </div>
    )
}

export const containsUnexecutedToolCall = (content) =>
    typeof content === 'string' &&
    /<tool_call\b[^>]*>[\s\S]*?<\/tool_call>|<function=[^>]+>[\s\S]*?<parameter=[^>]+>/i.test(content)

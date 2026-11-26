import assert from 'node:assert/strict'
import test from 'node:test'
import { containsUnexecutedToolCall } from '../utils/assistantResponse.js'

test('detects unexecuted tool-call markup', () => {
    assert.equal(
        containsUnexecutedToolCall('<tool_call><function=web_search><parameter=query>GTA 6 release date</parameter></function></tool_call>'),
        true,
    )
})

test('allows normal answers and explanatory mentions of tool calls', () => {
    assert.equal(containsUnexecutedToolCall('The tool_call feature lets a model request a search.'), false)
    assert.equal(containsUnexecutedToolCall('GTA 6 is expected to release in November.'), false)
})

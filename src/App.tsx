import { createSignal } from 'solid-js'
import { json } from 'typia'

interface Data {
  data: {
    apiActivity: {
      items: {
        questions: [
          {
            validation?: {
              valid_response: {
                value: [string]
              }
            }
            options: {
              value: string
            }[]
          },
        ]
      }[]
    }
  }
}

const resolve = (input: string): (string | null)[] => {
  // TODO: use typia runtime validation
  const data = json.assertParse<Data>(input)
  const answer = data.data.apiActivity.items
    .map((item) => item.questions[0])
    .map((question) => {
      const key = question.validation?.valid_response.value[0]
      if (!key) return null
      const key_idx = question.options.findIndex((opt) => opt.value == key)
      if (key_idx >= 26) return null
      // 'A' = 65
      return String.fromCharCode(65 + key_idx)
    })
  return answer
}

export const App = () => {
  const [output, setOutput] = createSignal<(string | null)[]>([])
  const [error, setError] = createSignal<string | null>(null)
  const [input, setInput] = createSignal('')

  const [uploadJson, setUploadJson] = createSignal('')
  const [uploadHar, setUploadHar] = createSignal('')
  const [uploadHarError, setUploadHarError] = createSignal<string | null>(null)

  const parse = () => {
    try {
      const text = input()
      if (text == '') {
        setOutput([])
        setError(null)
        return
      }
      setOutput(resolve(text))
      setError(null)
    } catch (e) {
      setOutput([])
      setError((e as Error).message)
    }
  }

  return (
    <main class="m-4">
      <h1>AP Classroom Parser</h1>
      <section>
        <p>
          在此输入或{' '}
          <span>
            <button
              onclick={async () => {
                const text = await navigator.clipboard.readText()
                setInput(text)
              }}
            >
              粘贴
            </button>
          </span>{' '}
          原始数据 JSON
        </p>
        <p class="align-middle space-x-2">
          <span>
            <input
              type="text"
              value={input()}
              onInput={(e) => setInput(e.currentTarget.value)}
            />
          </span>
          <span>
            <button
              onclick={() => {
                setInput('')
                setUploadJson('')
                setUploadHar('')
                setUploadHarError(null)
              }}
            >
              清空
            </button>
          </span>
        </p>
        <p>{input().length} 字符</p>

        <p>或：</p>
        <ul>
          <li>
            <p class="align-middle space-x-2">
              <span>上传 JSON 文件</span>
              <span>
                <input
                  type="file"
                  value={uploadJson()}
                  onInput={async (e) => {
                    // walkaround: solidjs interop w/ dom
                    // while setting value of file input is prohibited by browser, solidjs needs to update the signal
                    try {
                      setUploadJson(e.currentTarget.value)
                    } catch (_) {}
                    const file = e.currentTarget.files?.[0]
                    const content = await file?.text()
                    if (content) setInput(content)
                  }}
                />
              </span>
            </p>
          </li>

          <li>
            <p class="align-middle space-x-2">
              <span>
                上传 <a href="https://zh.wikipedia.org/wiki/.har">HAR</a> 文件
              </span>
              <span>
                <input
                  type="file"
                  value={uploadHar()}
                  onInput={async (e) => {
                    // walkaround: solidjs interop w/ dom
                    // while setting value of file input is prohibited by browser, solidjs needs to update the signal
                    try {
                      setUploadHar(e.currentTarget.value)
                    } catch (_) {}
                    const file = e.currentTarget.files?.[0]
                    const content = await file?.text()
                    try {
                      const har = JSON.parse(content || '')
                      const res = har.log.entries[0].response.content.text
                      setInput(res)
                      setUploadHarError(null)
                    } catch (e) {
                      setUploadHarError((e as Error).message)
                      return
                    }
                  }}
                />
              </span>
            </p>
            <p hidden={uploadHarError() == null} class="text-red-500">
              错误：<code>{uploadHarError()}</code>
            </p>
          </li>
        </ul>
      </section>
      <section>
        <h2>解析答案</h2>
        <button onclick={parse}>计算</button>
        <p hidden={error() == null} class="text-red-500">
          错误：<code>{error()}</code>
        </p>
        <p>{output().filter((x) => x != null).length} 个答案被解析</p>
        <table hidden={output().length == 0} class="border-spacing-x-4">
          <thead>
            <tr>
              <th>#</th>
              <th>答案</th>
            </tr>
          </thead>
          <tbody>
            {output().map((item, index) => (
              <tr>
                <td>{index + 1}</td>
                <td>{item}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section>
        <h2>使用说明</h2>
        <p>
          请打开 AP Classroom 答题网页， 截获 URL 带 <code>activity</code>{' '}
          字样请求的响应体
        </p>
        <p>
          为此，你可以先打开{' '}
          <a href="https://zh.wikipedia.org/wiki/%E5%BC%80%E5%8F%91%E8%80%85%E5%B7%A5%E5%85%B7">
            浏览器开发者工具
          </a>{' '}
          ，然后点击进入答题页面，并切至开发者工具的「网络」一栏，在 URL 中搜索
          "activity" 找到对应请求。
          打开请求，以文本格式复制响应体，粘帖于此处，即可解析答案
        </p>
        <details>
          <summary>问题：Firefox 截断超过 1MiB 的响应体</summary>
          <p>
            使用 <code>curl</code> 重发请求并保存到 JSON 文件
          </p>
        </details>
      </section>
    </main>
  )
}

export default App

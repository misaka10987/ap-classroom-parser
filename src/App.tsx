import { createSignal } from 'solid-js'

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

const parse = (input: string): (string | null)[] => {
  // TODO: use typia runtime validation
  const data: Data = JSON.parse(input)
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
            <button onclick={() => setInput('')}>清空</button>
          </span>
        </p>
        <p>{input().length} 字符</p>
      </section>
      <section>
        <h2>解析答案</h2>
        <button
          onclick={() => {
            try {
              const text = input()
              if (text == '') return
              setOutput(parse(text))
            } catch (e) {
              setOutput([])
              setError((e as Error).message)
            }
          }}
        >
          计算
        </button>
        <p hidden={error() == null} class="text-red-500">
          错误：<code>{error()}</code>
        </p>
        <p>{output().filter((x) => x != null).length} 个答案被解析</p>
        <table hidden={output().length == 0} class="border-spacing-2">
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
          请提供 AP Classroom 答题网页上 URL 中带有 <code>activity</code>{' '}
          字样请求的响应体
        </p>
        <p>你可以打开浏览器开发者工具，在「网络」一栏中搜索这个请求</p>
      </section>
    </main>
  )
}

export default App

/**
 * 算法步骤生成器（15 个算法）
 * step 结构:
 * { array, graph, table, highlight, codeLine, desc, stats }
 */

// ===================== 排序算法 =====================

export function bubbleSort (arr) {
  const steps = []
  const a = [...arr]
  const n = a.length
  const sorted = []
  let comparisons = 0; let swaps = 0; let accesses = 0
  steps.push({ array: [...a], highlight: { sorted: [] }, codeLine: 1, desc: '开始冒泡排序', stats: { comparisons, swaps, accesses } })
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      comparisons++; accesses += 2
      steps.push({ array: [...a], highlight: { compare: [j, j + 1], sorted: [...sorted] }, codeLine: 3, desc: `比较 a[${j}]=${a[j]} 与 a[${j + 1}]=${a[j + 1]}`, stats: { comparisons, swaps, accesses } })
      if (a[j] > a[j + 1]) {
        swaps++; accesses += 4
        const t = a[j]; a[j] = a[j + 1]; a[j + 1] = t
        steps.push({ array: [...a], highlight: { swap: [j, j + 1], sorted: [...sorted] }, codeLine: 4, desc: `${a[j + 1]} > ${a[j]}，交换`, stats: { comparisons, swaps, accesses } })
      }
    }
    sorted.unshift(n - 1 - i)
  }
  sorted.unshift(0)
  steps.push({ array: [...a], highlight: { sorted: [...sorted] }, codeLine: 6, desc: '排序完成', stats: { comparisons, swaps, accesses } })
  return steps
}

export function selectionSort (arr) {
  const steps = []
  const a = [...arr]
  const n = a.length
  const sorted = []
  let comparisons = 0; let swaps = 0
  steps.push({ array: [...a], highlight: { sorted: [] }, codeLine: 1, desc: '开始选择排序', stats: { comparisons, swaps } })
  for (let i = 0; i < n - 1; i++) {
    let minIdx = i
    steps.push({ array: [...a], highlight: { pivot: i, sorted: [...sorted] }, codeLine: 2, desc: `第 ${i + 1} 轮：找 [${i}..${n - 1}] 最小值`, stats: { comparisons, swaps } })
    for (let j = i + 1; j < n; j++) {
      comparisons++
      steps.push({ array: [...a], highlight: { compare: [minIdx, j], pivot: minIdx, sorted: [...sorted] }, codeLine: 4, desc: `比较 a[${minIdx}]=${a[minIdx]} 与 a[${j}]=${a[j]}`, stats: { comparisons, swaps } })
      if (a[j] < a[minIdx]) {
        minIdx = j
        steps.push({ array: [...a], highlight: { pivot: minIdx, sorted: [...sorted] }, codeLine: 5, desc: `更新最小值索引为 ${minIdx}`, stats: { comparisons, swaps } })
      }
    }
    if (minIdx !== i) {
      swaps++
      const t = a[i]; a[i] = a[minIdx]; a[minIdx] = t
      steps.push({ array: [...a], highlight: { swap: [i, minIdx], sorted: [...sorted] }, codeLine: 6, desc: `交换 a[${i}] 与 a[${minIdx}]`, stats: { comparisons, swaps } })
    }
    sorted.push(i)
  }
  sorted.push(n - 1)
  steps.push({ array: [...a], highlight: { sorted: [...sorted] }, codeLine: 7, desc: '排序完成', stats: { comparisons, swaps } })
  return steps
}

export function insertionSort (arr) {
  const steps = []
  const a = [...arr]
  const n = a.length
  let comparisons = 0; let shifts = 0
  const sorted = [0]
  steps.push({ array: [...a], highlight: { sorted: [0] }, codeLine: 1, desc: '开始插入排序，a[0] 默认有序', stats: { comparisons, shifts } })
  for (let i = 1; i < n; i++) {
    const key = a[i]
    steps.push({ array: [...a], highlight: { pivot: i, sorted: [...sorted] }, codeLine: 3, desc: `取出 a[${i}]=${key}，向前插入`, stats: { comparisons, shifts } })
    let j = i - 1
    while (j >= 0) {
      comparisons++
      steps.push({ array: [...a], highlight: { compare: [j, i], pivot: i, sorted: [...sorted] }, codeLine: 4, desc: `比较 a[${j}]=${a[j]} 与 ${key}`, stats: { comparisons, shifts } })
      if (a[j] > key) {
        a[j + 1] = a[j]
        shifts++
        steps.push({ array: [...a], highlight: { set: [j + 1], pivot: i, sorted: [...sorted] }, codeLine: 5, desc: `a[${j}] > ${key}，后移`, stats: { comparisons, shifts } })
        j--
      } else break
    }
    a[j + 1] = key
    shifts++
    sorted.push(i)
    steps.push({ array: [...a], highlight: { set: [j + 1], sorted: [...sorted] }, codeLine: 6, desc: `插入 ${key} 到位置 ${j + 1}`, stats: { comparisons, shifts } })
  }
  steps.push({ array: [...a], highlight: { sorted: [...sorted] }, codeLine: 7, desc: '排序完成', stats: { comparisons, shifts } })
  return steps
}

export function heapSort (arr) {
  const steps = []
  const a = [...arr]
  const n = a.length
  let comparisons = 0; let swaps = 0
  const sorted = []
  function heapify (size, i) {
    let largest = i
    const l = 2 * i + 1
    const r = 2 * i + 2
    if (l < size) {
      comparisons++
      steps.push({ array: [...a], highlight: { compare: [largest, l], heapSize: size, sorted: [...sorted] }, codeLine: 4, desc: `比较 a[${largest}]=${a[largest]} 与左孩子 a[${l}]=${a[l]}`, stats: { comparisons, swaps } })
      if (a[l] > a[largest]) largest = l
    }
    if (r < size) {
      comparisons++
      steps.push({ array: [...a], highlight: { compare: [largest, r], heapSize: size, sorted: [...sorted] }, codeLine: 5, desc: `比较 a[${largest}] 与右孩子 a[${r}]=${a[r]}`, stats: { comparisons, swaps } })
      if (a[r] > a[largest]) largest = r
    }
    if (largest !== i) {
      swaps++
      const t = a[i]; a[i] = a[largest]; a[largest] = t
      steps.push({ array: [...a], highlight: { swap: [i, largest], heapSize: size, sorted: [...sorted] }, codeLine: 6, desc: `下沉交换 a[${i}] ↔ a[${largest}]`, stats: { comparisons, swaps } })
      heapify(size, largest)
    }
  }
  steps.push({ array: [...a], highlight: { heapSize: n }, codeLine: 1, desc: '开始建大顶堆', stats: { comparisons, swaps } })
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) heapify(n, i)
  steps.push({ array: [...a], highlight: { heapBuilt: true, heapSize: n }, codeLine: 2, desc: '大顶堆建立完成', stats: { comparisons, swaps } })
  for (let i = n - 1; i > 0; i--) {
    swaps++
    const t = a[0]; a[0] = a[i]; a[i] = t
    sorted.unshift(i)
    steps.push({ array: [...a], highlight: { swap: [0, i], sorted: [...sorted], heapSize: i }, codeLine: 8, desc: `堆顶移到 a[${i}]`, stats: { comparisons, swaps } })
    heapify(i, 0)
  }
  sorted.unshift(0)
  steps.push({ array: [...a], highlight: { sorted: [...sorted] }, codeLine: 9, desc: '排序完成', stats: { comparisons, swaps } })
  return steps
}

export function quickSort (arr) {
  const steps = []
  const a = [...arr]
  let comparisons = 0; let swaps = 0; let accesses = 0
  const sorted = new Set()
  function partition (low, high) {
    const pivot = a[high]
    steps.push({ array: [...a], highlight: { pivot: high, range: [low, high], sorted: [...sorted] }, codeLine: 3, desc: `选取基准 a[${high}]=${pivot}`, stats: { comparisons, swaps, accesses } })
    let i = low - 1
    for (let j = low; j < high; j++) {
      comparisons++; accesses++
      steps.push({ array: [...a], highlight: { pivot: high, compare: [j, high], range: [low, high], sorted: [...sorted] }, codeLine: 5, desc: `比较 a[${j}]=${a[j]} 与基准 ${pivot}`, stats: { comparisons, swaps, accesses } })
      if (a[j] <= pivot) {
        i++
        if (i !== j) {
          swaps++; accesses += 4
          const t = a[i]; a[i] = a[j]; a[j] = t
          steps.push({ array: [...a], highlight: { pivot: high, swap: [i, j], range: [low, high], sorted: [...sorted] }, codeLine: 6, desc: `a[${j}] <= 基准，交换到左侧`, stats: { comparisons, swaps, accesses } })
        }
      }
    }
    const t = a[i + 1]; a[i + 1] = a[high]; a[high] = t
    swaps++; accesses += 4
    sorted.add(i + 1)
    steps.push({ array: [...a], highlight: { swap: [i + 1, high], sorted: [...sorted] }, codeLine: 8, desc: `基准归位到 a[${i + 1}]`, stats: { comparisons, swaps, accesses } })
    return i + 1
  }
  function qs (low, high) {
    if (low < high) { const p = partition(low, high); qs(low, p - 1); qs(p + 1, high) }
  }
  steps.push({ array: [...a], highlight: { sorted: [] }, codeLine: 1, desc: '开始快速排序', stats: { comparisons, swaps, accesses } })
  qs(0, a.length - 1)
  steps.push({ array: [...a], highlight: { sorted: a.map((_, i) => i) }, codeLine: 9, desc: '排序完成', stats: { comparisons, swaps, accesses } })
  return steps
}

export function mergeSort (arr) {
  const steps = []
  const a = [...arr]
  let comparisons = 0; let accesses = 0
  function merge (low, mid, high) {
    const left = a.slice(low, mid + 1)
    const right = a.slice(mid + 1, high + 1)
    let i = 0; let j = 0; let k = low
    while (i < left.length && j < right.length) {
      comparisons++; accesses += 2
      steps.push({ array: [...a], highlight: { compare: [low + i, mid + 1 + j], range: [low, high] }, codeLine: 6, desc: `比较 ${left[i]} 和 ${right[j]}`, stats: { comparisons, swaps: 0, accesses } })
      if (left[i] <= right[j]) { a[k] = left[i]; i++ } else { a[k] = right[j]; j++ }
      accesses++
      steps.push({ array: [...a], highlight: { set: [k], range: [low, high] }, codeLine: 7, desc: `写入 a[${k}]=${a[k]}`, stats: { comparisons, swaps: 0, accesses } })
      k++
    }
    while (i < left.length) { a[k] = left[i]; accesses++; steps.push({ array: [...a], highlight: { set: [k], range: [low, high] }, codeLine: 7, desc: `写入剩余 a[${k}]=${a[k]}`, stats: { comparisons, swaps: 0, accesses } }); i++; k++ }
    while (j < right.length) { a[k] = right[j]; accesses++; steps.push({ array: [...a], highlight: { set: [k], range: [low, high] }, codeLine: 7, desc: `写入剩余 a[${k}]=${a[k]}`, stats: { comparisons, swaps: 0, accesses } }); j++; k++ }
  }
  function ms (low, high) {
    if (low < high) {
      const mid = Math.floor((low + high) / 2)
      steps.push({ array: [...a], highlight: { range: [low, high], split: mid }, codeLine: 2, desc: `分割 [${low}, ${high}]，中点 ${mid}`, stats: { comparisons, swaps: 0, accesses } })
      ms(low, mid); ms(mid + 1, high)
      steps.push({ array: [...a], highlight: { range: [low, high] }, codeLine: 3, desc: `合并 [${low}, ${mid}] 与 [${mid + 1}, ${high}]`, stats: { comparisons, swaps: 0, accesses } })
      merge(low, mid, high)
    }
  }
  steps.push({ array: [...a], highlight: { sorted: [] }, codeLine: 1, desc: '开始归并排序', stats: { comparisons, swaps: 0, accesses } })
  ms(0, a.length - 1)
  steps.push({ array: [...a], highlight: { sorted: a.map((_, i) => i) }, codeLine: 8, desc: '排序完成', stats: { comparisons, swaps: 0, accesses } })
  return steps
}

// ===================== 查找算法 =====================

export function binarySearch (arr, target) {
  const steps = []
  const a = [...arr].sort((x, y) => x - y)
  let low = 0; let high = a.length - 1; let comparisons = 0
  steps.push({ array: [...a], highlight: { left: low, right: high, target }, codeLine: 1, desc: `在有序数组中查找 ${target}`, stats: { comparisons, swaps: 0, accesses: 0 } })
  while (low <= high) {
    const mid = Math.floor((low + high) / 2)
    comparisons++
    steps.push({ array: [...a], highlight: { left: low, right: high, mid }, codeLine: 3, desc: `检查中点 a[${mid}]=${a[mid]}`, stats: { comparisons, swaps: 0, accesses: 1 } })
    if (a[mid] === target) {
      steps.push({ array: [...a], highlight: { found: mid, target }, codeLine: 4, desc: `命中！${target} 位于索引 ${mid}`, stats: { comparisons, swaps: 0, accesses: 1 } })
      return steps
    } else if (a[mid] < target) {
      steps.push({ array: [...a], highlight: { left: mid + 1, right: high, mid, eliminate: [low, mid] }, codeLine: 5, desc: `${a[mid]} < ${target}，去右半查找`, stats: { comparisons, swaps: 0, accesses: 1 } })
      low = mid + 1
    } else {
      steps.push({ array: [...a], highlight: { left: low, right: mid - 1, mid, eliminate: [mid, high] }, codeLine: 6, desc: `${a[mid]} > ${target}，去左半查找`, stats: { comparisons, swaps: 0, accesses: 1 } })
      high = mid - 1
    }
  }
  steps.push({ array: [...a], highlight: { target }, codeLine: 7, desc: `${target} 不存在`, stats: { comparisons, swaps: 0, accesses: 0 } })
  return steps
}

export function linearSearch (arr, target) {
  const steps = []
  const a = [...arr]
  let comparisons = 0
  steps.push({ array: [...a], highlight: { target }, codeLine: 1, desc: `线性查找 ${target}`, stats: { comparisons } })
  for (let i = 0; i < a.length; i++) {
    comparisons++
    steps.push({ array: [...a], highlight: { current: i, target }, codeLine: 3, desc: `检查 a[${i}]=${a[i]}`, stats: { comparisons } })
    if (a[i] === target) {
      steps.push({ array: [...a], highlight: { found: i, target }, codeLine: 4, desc: `命中！${target} 位于索引 ${i}`, stats: { comparisons } })
      return steps
    }
  }
  steps.push({ array: [...a], highlight: { target }, codeLine: 5, desc: `${target} 不存在`, stats: { comparisons } })
  return steps
}

// ===================== 图论算法 =====================

export const DEFAULT_GRAPH = {
  nodes: [
    { id: 'A', x: 100, y: 120 },
    { id: 'B', x: 300, y: 60 },
    { id: 'C', x: 500, y: 120 },
    { id: 'D', x: 200, y: 280 },
    { id: 'E', x: 400, y: 280 },
    { id: 'F', x: 300, y: 420 }
  ],
  edges: [
    { from: 'A', to: 'B', weight: 4 },
    { from: 'A', to: 'D', weight: 2 },
    { from: 'B', to: 'C', weight: 5 },
    { from: 'B', to: 'E', weight: 3 },
    { from: 'C', to: 'E', weight: 1 },
    { from: 'D', to: 'E', weight: 6 },
    { from: 'D', to: 'F', weight: 8 },
    { from: 'E', to: 'F', weight: 4 }
  ]
}

export const DAG_GRAPH = {
  nodes: [
    { id: 'C1', x: 80, y: 220 },
    { id: 'C2', x: 80, y: 80 },
    { id: 'C3', x: 280, y: 220 },
    { id: 'C4', x: 280, y: 80 },
    { id: 'C5', x: 480, y: 220 },
    { id: 'C6', x: 480, y: 80 }
  ],
  edges: [
    { from: 'C1', to: 'C3', weight: 0 },
    { from: 'C1', to: 'C5', weight: 0 },
    { from: 'C2', to: 'C4', weight: 0 },
    { from: 'C3', to: 'C5', weight: 0 },
    { from: 'C4', to: 'C6', weight: 0 },
    { from: 'C5', to: 'C6', weight: 0 }
  ]
}

function getNeighbors (graph, nodeId) {
  const res = []
  for (const e of graph.edges) {
    if (e.from === nodeId) res.push({ to: e.to, weight: e.weight })
    else if (e.to === nodeId) res.push({ to: e.from, weight: e.weight })
  }
  return res.sort((a, b) => a.to.localeCompare(b.to))
}

export function bfs (graph, startId) {
  const steps = []
  const visited = new Set([startId])
  const queue = [startId]
  const visitedOrder = []
  steps.push({ graph, highlight: { current: startId, queue: [...queue], visited: [] }, codeLine: 2, desc: `从 ${startId} 开始 BFS`, stats: { visited: 0, queueSize: 1 } })
  while (queue.length > 0) {
    const node = queue.shift()
    visitedOrder.push(node)
    steps.push({ graph, highlight: { current: node, visited: [...visitedOrder], queue: [...queue] }, codeLine: 4, desc: `出队并访问 ${node}`, stats: { visited: visitedOrder.length, queueSize: queue.length } })
    for (const next of getNeighbors(graph, node)) {
      if (!visited.has(next.to)) {
        visited.add(next.to); queue.push(next.to)
        steps.push({ graph, highlight: { current: node, visiting: next.to, visited: [...visitedOrder], queue: [...queue], edge: [node, next.to] }, codeLine: 6, desc: `发现 ${next.to}，入队`, stats: { visited: visitedOrder.length, queueSize: queue.length } })
      }
    }
  }
  steps.push({ graph, highlight: { visited: [...visitedOrder] }, codeLine: 8, desc: `BFS 完成，共访问 ${visitedOrder.length} 个节点`, stats: { visited: visitedOrder.length, queueSize: 0 } })
  return steps
}

export function dfs (graph, startId) {
  const steps = []
  const visited = new Set()
  const order = []
  function visit (node) {
    visited.add(node)
    order.push(node)
    steps.push({ graph, highlight: { current: node, visited: [...order] }, codeLine: 4, desc: `访问 ${node}`, stats: { visited: order.length, stack: 0 } })
    for (const next of getNeighbors(graph, node)) {
      if (!visited.has(next.to)) {
        steps.push({ graph, highlight: { current: node, visiting: next.to, visited: [...order], edge: [node, next.to] }, codeLine: 5, desc: `深入访问 ${next.to}`, stats: { visited: order.length, stack: 0 } })
        visit(next.to)
      }
    }
  }
  steps.push({ graph, highlight: { current: startId, visited: [] }, codeLine: 2, desc: `从 ${startId} 开始 DFS`, stats: { visited: 0, stack: 0 } })
  visit(startId)
  steps.push({ graph, highlight: { visited: [...order] }, codeLine: 7, desc: `DFS 完成，共访问 ${order.length} 个节点`, stats: { visited: order.length, stack: 0 } })
  return steps
}

export function dijkstra (graph, startId) {
  const steps = []
  const dist = {}
  const visited = new Set()
  const order = []
  const nodes = graph.nodes.map(n => n.id)
  for (const id of nodes) dist[id] = Infinity
  dist[startId] = 0
  steps.push({ graph, highlight: { current: startId, dist: { ...dist }, visited: [] }, codeLine: 2, desc: `初始化：${startId} 距离=0，其余=∞`, stats: { visited: 0, distance: 0 } })
  while (visited.size < nodes.length) {
    let minNode = null; let minDist = Infinity
    for (const id of nodes) {
      if (!visited.has(id) && dist[id] < minDist) { minDist = dist[id]; minNode = id }
    }
    if (minNode === null) break
    visited.add(minNode); order.push(minNode)
    steps.push({ graph, highlight: { current: minNode, dist: { ...dist }, visited: [...order] }, codeLine: 4, desc: `选取最小距离节点 ${minNode} (d=${minDist})`, stats: { visited: order.length, distance: minDist } })
    for (const next of getNeighbors(graph, minNode)) {
      if (!visited.has(next.to)) {
        const newDist = dist[minNode] + next.weight
        if (newDist < dist[next.to]) {
          dist[next.to] = newDist
          steps.push({ graph, highlight: { current: minNode, visiting: next.to, dist: { ...dist }, visited: [...order], edge: [minNode, next.to] }, codeLine: 6, desc: `松弛 ${minNode}→${next.to}：更新距离为 ${newDist}`, stats: { visited: order.length, distance: newDist } })
        }
      }
    }
  }
  steps.push({ graph, highlight: { visited: [...order], dist: { ...dist } }, codeLine: 8, desc: 'Dijkstra 完成', stats: { visited: order.length, distance: 0 } })
  return steps
}

export function prim (graph, startId) {
  const steps = []
  const nodes = graph.nodes.map(n => n.id)
  const inMST = new Set()
  const key = {}
  const parent = {}
  const mstEdges = []
  for (const id of nodes) { key[id] = Infinity; parent[id] = null }
  key[startId] = 0
  steps.push({ graph, highlight: { current: startId, key: { ...key }, visited: [], mstEdges: [] }, codeLine: 2, desc: `从 ${startId} 开始 Prim`, stats: { visited: 0, totalWeight: 0 } })
  while (inMST.size < nodes.length) {
    let minNode = null; let minKey = Infinity
    for (const id of nodes) {
      if (!inMST.has(id) && key[id] < minKey) { minKey = key[id]; minNode = id }
    }
    if (minNode === null) break
    inMST.add(minNode)
    if (parent[minNode]) mstEdges.push({ from: parent[minNode], to: minNode, weight: key[minNode] })
    const tw = mstEdges.reduce((s, e) => s + e.weight, 0)
    steps.push({ graph, highlight: { current: minNode, key: { ...key }, visited: [...inMST], mstEdges: [...mstEdges] }, codeLine: 4, desc: `加入 MST: ${minNode} (key=${minKey})`, stats: { visited: inMST.size, totalWeight: tw } })
    for (const next of getNeighbors(graph, minNode)) {
      if (!inMST.has(next.to) && next.weight < key[next.to]) {
        key[next.to] = next.weight; parent[next.to] = minNode
        steps.push({ graph, highlight: { current: minNode, visiting: next.to, key: { ...key }, visited: [...inMST], mstEdges: [...mstEdges], edge: [minNode, next.to] }, codeLine: 6, desc: `更新 ${next.to} 的 key=${next.weight}`, stats: { visited: inMST.size, totalWeight: tw } })
      }
    }
  }
  const tw = mstEdges.reduce((s, e) => s + e.weight, 0)
  steps.push({ graph, highlight: { visited: [...inMST], mstEdges: [...mstEdges] }, codeLine: 8, desc: `Prim 完成，MST 权重=${tw}`, stats: { visited: inMST.size, totalWeight: tw } })
  return steps
}

export function topologicalSort (graph) {
  const steps = []
  const nodes = graph.nodes.map(n => n.id)
  const inDegree = {}
  for (const id of nodes) inDegree[id] = 0
  for (const e of graph.edges) inDegree[e.to]++
  const queue = nodes.filter(id => inDegree[id] === 0)
  const order = []
  steps.push({ graph, highlight: { queue: [...queue], inDegree: { ...inDegree }, visited: [] }, codeLine: 2, desc: `入度为0入队: ${queue.join(', ')}`, stats: { visited: 0 } })
  while (queue.length > 0) {
    const node = queue.shift()
    order.push(node)
    steps.push({ graph, highlight: { current: node, queue: [...queue], inDegree: { ...inDegree }, visited: [...order] }, codeLine: 4, desc: `输出 ${node}`, stats: { visited: order.length } })
    for (const e of graph.edges.filter(ed => ed.from === node)) {
      inDegree[e.to]--
      steps.push({ graph, highlight: { current: node, visiting: e.to, queue: [...queue], inDegree: { ...inDegree }, visited: [...order], edge: [node, e.to] }, codeLine: 6, desc: `${e.to} 入度减至 ${inDegree[e.to]}`, stats: { visited: order.length } })
      if (inDegree[e.to] === 0) {
        queue.push(e.to)
        steps.push({ graph, highlight: { current: node, queue: [...queue], inDegree: { ...inDegree }, visited: [...order] }, codeLine: 7, desc: `${e.to} 入度为0，入队`, stats: { visited: order.length } })
      }
    }
  }
  steps.push({ graph, highlight: { visited: [...order] }, codeLine: 9, desc: `拓扑序: ${order.join(' → ')}`, stats: { visited: order.length } })
  return steps
}

// ===================== 动态规划 =====================

export function knapsack (weights, values, capacity) {
  const steps = []
  const n = weights.length
  const dp = Array(n + 1).fill(0).map(() => Array(capacity + 1).fill(0))
  const rowLabels = ['∅', ...weights.map((w, i) => `物${i + 1}(w${w},v${values[i]})`)]
  const colLabels = Array(capacity + 1).fill(0).map((_, j) => j)
  steps.push({ table: { rowLabels, colLabels, cells: dp.map(r => r.slice()), highlight: {} }, codeLine: 1, desc: '初始化 dp 表', stats: { filled: 0, total: n * capacity, maxValue: 0 } })
  for (let i = 1; i <= n; i++) {
    for (let j = 0; j <= capacity; j++) {
      const deps = [[i - 1, j]]
      if (j >= weights[i - 1]) {
        deps.push([i - 1, j - weights[i - 1]])
        const noTake = dp[i - 1][j]
        const take = dp[i - 1][j - weights[i - 1]] + values[i - 1]
        dp[i][j] = Math.max(noTake, take)
        steps.push({ table: { rowLabels, colLabels, cells: dp.map(r => r.slice()), highlight: { row: i, col: j, deps } }, codeLine: 5, desc: `dp[${i}][${j}] = max(不放=${noTake}, 放=${take}) = ${dp[i][j]}`, stats: { filled: (i - 1) * capacity + j + 1, total: n * capacity, maxValue: dp[n][capacity] } })
      } else {
        dp[i][j] = dp[i - 1][j]
        steps.push({ table: { rowLabels, colLabels, cells: dp.map(r => r.slice()), highlight: { row: i, col: j, deps } }, codeLine: 4, desc: `容量${j} < 重量${weights[i - 1]}，不放，dp=${dp[i][j]}`, stats: { filled: (i - 1) * capacity + j + 1, total: n * capacity, maxValue: dp[n][capacity] } })
      }
    }
  }
  steps.push({ table: { rowLabels, colLabels, cells: dp.map(r => r.slice()), highlight: { row: n, col: capacity, deps: [] } }, codeLine: 7, desc: `完成，最大价值 = ${dp[n][capacity]}`, stats: { filled: n * capacity, total: n * capacity, maxValue: dp[n][capacity] } })
  return steps
}

export function lcs (s1, s2) {
  const steps = []
  const m = s1.length; const n = s2.length
  const dp = Array(m + 1).fill(0).map(() => Array(n + 1).fill(0))
  const rowLabels = ['∅', ...s1.split('')]
  const colLabels = ['∅', ...s2.split('')]
  steps.push({ table: { rowLabels, colLabels, cells: dp.map(r => r.slice()), highlight: {} }, codeLine: 1, desc: '初始化 dp 表', stats: { filled: 0, total: m * n, lcsLength: 0 } })
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const deps = [[i - 1, j], [i, j - 1]]
      const match = s1[i - 1] === s2[j - 1]
      if (match) {
        deps.push([i - 1, j - 1])
        dp[i][j] = dp[i - 1][j - 1] + 1
        steps.push({ table: { rowLabels, colLabels, cells: dp.map(r => r.slice()), highlight: { row: i, col: j, deps, match: true } }, codeLine: 3, desc: `'${s1[i - 1]}' 匹配，dp[${i}][${j}] = ${dp[i][j]}`, stats: { filled: (i - 1) * n + j, total: m * n, lcsLength: dp[m][n] } })
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
        steps.push({ table: { rowLabels, colLabels, cells: dp.map(r => r.slice()), highlight: { row: i, col: j, deps } }, codeLine: 4, desc: `'${s1[i - 1]}' ≠ '${s2[j - 1]}'，dp = max(${dp[i - 1][j]}, ${dp[i][j - 1]}) = ${dp[i][j]}`, stats: { filled: (i - 1) * n + j, total: m * n, lcsLength: dp[m][n] } })
      }
    }
  }
  steps.push({ table: { rowLabels, colLabels, cells: dp.map(r => r.slice()), highlight: { row: m, col: n, deps: [] } }, codeLine: 6, desc: `完成，LCS 长度 = ${dp[m][n]}`, stats: { filled: m * n, total: m * n, lcsLength: dp[m][n] } })
  return steps
}

// ===================== 扩展排序算法 =====================

export function shellSort (arr) {
  const steps = []
  const a = [...arr]
  const n = a.length
  let comparisons = 0; let shifts = 0
  const sorted = []
  for (let gap = Math.floor(n / 2); gap > 0; gap = Math.floor(gap / 2)) {
    steps.push({ array: [...a], highlight: { gap, sorted: [...sorted] }, codeLine: 2, desc: `增量 gap = ${gap}，分组插入排序`, stats: { comparisons, shifts } })
    for (let i = gap; i < n; i++) {
      const temp = a[i]
      let j = i
      while (j >= gap) {
        comparisons++
        steps.push({ array: [...a], highlight: { compare: [j - gap, i], gap, pivot: i, sorted: [...sorted] }, codeLine: 4, desc: `比较 a[${j - gap}]=${a[j - gap]} 与 temp=${temp}`, stats: { comparisons, shifts } })
        if (a[j - gap] > temp) {
          a[j] = a[j - gap]
          shifts++
          steps.push({ array: [...a], highlight: { set: [j], gap, pivot: i, sorted: [...sorted] }, codeLine: 5, desc: `后移 a[${j - gap}] → a[${j}]`, stats: { comparisons, shifts } })
          j -= gap
        } else break
      }
      a[j] = temp
      shifts++
      steps.push({ array: [...a], highlight: { set: [j], gap, sorted: [...sorted] }, codeLine: 6, desc: `插入 ${temp} 到 a[${j}]`, stats: { comparisons, shifts } })
    }
  }
  sorted.push(...Array(n).keys())
  steps.push({ array: [...a], highlight: { sorted: [...sorted] }, codeLine: 7, desc: '排序完成', stats: { comparisons, shifts } })
  return steps
}

export function cocktailSort (arr) {
  const steps = []
  const a = [...arr]
  const n = a.length
  let comparisons = 0; let swaps = 0
  const sorted = new Set()
  let start = 0; let end = n - 1
  let swapped = true
  steps.push({ array: [...a], highlight: { sorted: [...sorted] }, codeLine: 1, desc: '开始鸡尾酒排序', stats: { comparisons, swaps } })
  while (swapped) {
    swapped = false
    for (let i = start; i < end; i++) {
      comparisons++
      steps.push({ array: [...a], highlight: { compare: [i, i + 1], sorted: [...sorted] }, codeLine: 3, desc: `→ 比较 a[${i}]=${a[i]} 与 a[${i + 1}]=${a[i + 1]}`, stats: { comparisons, swaps } })
      if (a[i] > a[i + 1]) {
        swaps++; swapped = true
        const t = a[i]; a[i] = a[i + 1]; a[i + 1] = t
        steps.push({ array: [...a], highlight: { swap: [i, i + 1], sorted: [...sorted] }, codeLine: 4, desc: '正向交换', stats: { comparisons, swaps } })
      }
    }
    sorted.add(end)
    if (!swapped) break
    swapped = false
    end--
    for (let i = end - 1; i >= start; i--) {
      comparisons++
      steps.push({ array: [...a], highlight: { compare: [i, i + 1], sorted: [...sorted] }, codeLine: 6, desc: `← 比较 a[${i}]=${a[i]} 与 a[${i + 1}]=${a[i + 1]}`, stats: { comparisons, swaps } })
      if (a[i] > a[i + 1]) {
        swaps++; swapped = true
        const t = a[i]; a[i] = a[i + 1]; a[i + 1] = t
        steps.push({ array: [...a], highlight: { swap: [i, i + 1], sorted: [...sorted] }, codeLine: 7, desc: '反向交换', stats: { comparisons, swaps } })
      }
    }
    sorted.add(start)
    start++
  }
  for (let i = 0; i < n; i++) sorted.add(i)
  steps.push({ array: [...a], highlight: { sorted: [...sorted] }, codeLine: 9, desc: '排序完成', stats: { comparisons, swaps } })
  return steps
}

export function countingSort (arr) {
  const steps = []
  const a = [...arr]
  const n = a.length
  const max = Math.max(...a)
  const min = Math.min(...a)
  // 统一偏移到 0 起，支持负数（正数同样需要偏移）
  const offset = -min
  const count = new Array(max - min + 1).fill(0)
  const output = new Array(n)
  let accesses = 0
  steps.push({ array: [...a], highlight: { sorted: [] }, codeLine: 1, desc: `开始计数排序，范围 [${min}, ${max}]`, stats: { accesses } })
  for (let i = 0; i < n; i++) {
    count[a[i] + offset]++
    accesses++
    steps.push({ array: [...a], highlight: { current: i }, codeLine: 3, desc: `统计 a[${i}]=${a[i]}，count[${a[i] + offset}]=${count[a[i] + offset]}`, stats: { accesses } })
  }
  for (let i = 1; i < count.length; i++) count[i] += count[i - 1]
  steps.push({ array: [...a], highlight: {}, codeLine: 4, desc: '前缀和累加完成', stats: { accesses } })
  const display = new Array(n).fill(0)
  for (let i = n - 1; i >= 0; i--) {
    count[a[i] + offset]--
    const pos = count[a[i] + offset]
    output[pos] = a[i]
    display[pos] = a[i]
    accesses++
    steps.push({ array: [...display], highlight: { set: [pos] }, codeLine: 6, desc: `${a[i]} → 位置 ${pos}`, stats: { accesses } })
  }
  steps.push({ array: [...display], highlight: { sorted: display.map((_, i) => i) }, codeLine: 7, desc: '排序完成', stats: { accesses } })
  return steps
}

// ===================== 扩展查找算法 =====================

export function interpolationSearch (arr, target) {
  const steps = []
  const a = [...arr].sort((x, y) => x - y)
  let low = 0; let high = a.length - 1; let comparisons = 0
  steps.push({ array: [...a], highlight: { left: low, right: high, target }, codeLine: 1, desc: `插值查找 ${target}（按值估算位置）`, stats: { comparisons } })
  while (low <= high && target >= a[low] && target <= a[high]) {
    comparisons++
    // 区间内值全相同（含重复元素），直接判断避免除零
    if (a[low] === a[high]) {
      if (a[low] === target) {
        steps.push({ array: [...a], highlight: { found: low, target }, codeLine: 4, desc: `命中！${target} 位于索引 ${low}`, stats: { comparisons } })
        return steps
      }
      break
    }
    const pos = low + Math.floor(((target - a[low]) * (high - low)) / (a[high] - a[low]))
    steps.push({ array: [...a], highlight: { left: low, right: high, mid: pos, target }, codeLine: 3, desc: `估算位置=${pos}，a[${pos}]=${a[pos]}`, stats: { comparisons } })
    if (a[pos] === target) {
      steps.push({ array: [...a], highlight: { found: pos, target }, codeLine: 4, desc: `命中！${target} 位于索引 ${pos}`, stats: { comparisons } })
      return steps
    } else if (a[pos] < target) {
      steps.push({ array: [...a], highlight: { left: pos + 1, right: high, mid: pos, eliminate: [low, pos], target }, codeLine: 5, desc: `${a[pos]} < ${target}，去右侧`, stats: { comparisons } })
      low = pos + 1
    } else {
      steps.push({ array: [...a], highlight: { left: low, right: pos - 1, mid: pos, eliminate: [pos, high], target }, codeLine: 6, desc: `${a[pos]} > ${target}，去左侧`, stats: { comparisons } })
      high = pos - 1
    }
  }
  steps.push({ array: [...a], highlight: { target }, codeLine: 7, desc: `${target} 不存在`, stats: { comparisons } })
  return steps
}

// ===================== 扩展图论算法 =====================

export function kruskal (graph) {
  const steps = []
  const nodes = graph.nodes.map(n => n.id)
  const edges = [...graph.edges].sort((a, b) => a.weight - b.weight)
  const parent = {}
  const mstEdges = []
  for (const id of nodes) parent[id] = id
  function find (x) {
    while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x] }
    return x
  }
  function union (x, y) {
    const px = find(x); const py = find(y)
    if (px === py) return false
    parent[px] = py
    return true
  }
  const visitedSet = () => {
    const s = new Set()
    for (const e of mstEdges) { s.add(e.from); s.add(e.to) }
    return [...s]
  }
  steps.push({ graph, highlight: { visited: [], mstEdges: [] }, codeLine: 2, desc: '按权重排序边，依次考察', stats: { visited: 0, totalWeight: 0 } })
  for (const e of edges) {
    steps.push({ graph, highlight: { edge: [e.from, e.to], visited: visitedSet(), mstEdges: [...mstEdges] }, codeLine: 4, desc: `考察边 ${e.from}-${e.to} (w=${e.weight})`, stats: { visited: mstEdges.length, totalWeight: mstEdges.reduce((s, ed) => s + ed.weight, 0) } })
    if (union(e.from, e.to)) {
      mstEdges.push(e)
      const tw = mstEdges.reduce((s, ed) => s + ed.weight, 0)
      steps.push({ graph, highlight: { visited: visitedSet(), mstEdges: [...mstEdges], edge: [e.from, e.to] }, codeLine: 5, desc: `加入 MST: ${e.from}-${e.to} (w=${e.weight})`, stats: { visited: mstEdges.length, totalWeight: tw } })
    } else {
      steps.push({ graph, highlight: { visited: visitedSet(), mstEdges: [...mstEdges] }, codeLine: 6, desc: `${e.from}-${e.to} 形成环，跳过`, stats: { visited: mstEdges.length, totalWeight: mstEdges.reduce((s, ed) => s + ed.weight, 0) } })
    }
  }
  const tw = mstEdges.reduce((s, ed) => s + ed.weight, 0)
  steps.push({ graph, highlight: { visited: visitedSet(), mstEdges: [...mstEdges] }, codeLine: 8, desc: `Kruskal 完成，MST 权重=${tw}`, stats: { visited: mstEdges.length, totalWeight: tw } })
  return steps
}

export function floydWarshall (graph) {
  const steps = []
  const nodes = graph.nodes.map(n => n.id)
  const n = nodes.length
  const INF = Infinity
  const dist = Array(n).fill(0).map(() => Array(n).fill(INF))
  for (let i = 0; i < n; i++) dist[i][i] = 0
  for (const e of graph.edges) {
    const i = nodes.indexOf(e.from); const j = nodes.indexOf(e.to)
    dist[i][j] = e.weight; dist[j][i] = e.weight
  }
  const display = d => d.map(row => row.map(v => v === INF ? '∞' : v))
  steps.push({ table: { rowLabels: nodes, colLabels: nodes, cells: display(dist), highlight: {} }, codeLine: 1, desc: '初始化距离矩阵', stats: { k: 0, filled: 0, total: n * n * n } })
  for (let k = 0; k < n; k++) {
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (dist[i][k] !== INF && dist[k][j] !== INF && dist[i][k] + dist[k][j] < dist[i][j]) {
          dist[i][j] = dist[i][k] + dist[k][j]
          const deps = [[i, k], [k, j]]
          steps.push({ table: { rowLabels: nodes, colLabels: nodes, cells: display(dist), highlight: { row: i, col: j, deps } }, codeLine: 4, desc: `k=${nodes[k]}: dist[${nodes[i]}][${nodes[j]}] = ${dist[i][k]}+${dist[k][j]} = ${dist[i][j]}`, stats: { k: k + 1, filled: k * n * n + i * n + j + 1, total: n * n * n } })
        }
      }
    }
  }
  steps.push({ table: { rowLabels: nodes, colLabels: nodes, cells: display(dist), highlight: {} }, codeLine: 5, desc: 'Floyd-Warshall 完成', stats: { k: n, filled: n * n * n, total: n * n * n } })
  return steps
}

// ===================== 扩展动态规划 =====================

export function lis (arr) {
  const steps = []
  const n = arr.length
  const dp = new Array(n).fill(1)
  const colLabels = arr.map((v, i) => `a[${i}]=${v}`)
  const rowLabels = ['dp']
  steps.push({ table: { rowLabels, colLabels, cells: [dp.slice()], highlight: {} }, codeLine: 1, desc: '初始化 dp[i] = 1', stats: { filled: 0, total: n, lcsLength: 1 } })
  for (let i = 1; i < n; i++) {
    for (let j = 0; j < i; j++) {
      const deps = [[0, j]]
      steps.push({ table: { rowLabels, colLabels, cells: [dp.slice()], highlight: { row: 0, col: i, deps } }, codeLine: 3, desc: `比较 a[${j}]=${arr[j]} 与 a[${i}]=${arr[i]}`, stats: { filled: i, total: n, lcsLength: Math.max(...dp) } })
      if (arr[j] < arr[i] && dp[j] + 1 > dp[i]) {
        dp[i] = dp[j] + 1
        steps.push({ table: { rowLabels, colLabels, cells: [dp.slice()], highlight: { row: 0, col: i, deps, match: true } }, codeLine: 4, desc: `a[${j}] < a[${i}]，dp[${i}] = dp[${j}]+1 = ${dp[i]}`, stats: { filled: i, total: n, lcsLength: Math.max(...dp) } })
      }
    }
  }
  const maxLen = Math.max(...dp)
  steps.push({ table: { rowLabels, colLabels, cells: [dp.slice()], highlight: {} }, codeLine: 6, desc: `LIS 长度 = ${maxLen}`, stats: { filled: n, total: n, lcsLength: maxLen } })
  return steps
}

export function editDistance (s1, s2) {
  const steps = []
  const m = s1.length; const n = s2.length
  const dp = Array(m + 1).fill(0).map(() => Array(n + 1).fill(0))
  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j
  const rowLabels = ['∅', ...s1.split('')]
  const colLabels = ['∅', ...s2.split('')]
  steps.push({ table: { rowLabels, colLabels, cells: dp.map(r => r.slice()), highlight: {} }, codeLine: 1, desc: '初始化边界：dp[i][0]=i, dp[0][j]=j', stats: { filled: 0, total: m * n, maxValue: 0 } })
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const deps = [[i - 1, j], [i, j - 1], [i - 1, j - 1]]
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
        steps.push({ table: { rowLabels, colLabels, cells: dp.map(r => r.slice()), highlight: { row: i, col: j, deps, match: true } }, codeLine: 3, desc: `'${s1[i - 1]}' == '${s2[j - 1]}'，dp=${dp[i][j]}`, stats: { filled: (i - 1) * n + j, total: m * n, maxValue: dp[m][n] } })
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
        steps.push({ table: { rowLabels, colLabels, cells: dp.map(r => r.slice()), highlight: { row: i, col: j, deps } }, codeLine: 4, desc: `'${s1[i - 1]}' ≠ '${s2[j - 1]}'，dp=1+min(${dp[i - 1][j]},${dp[i][j - 1]},${dp[i - 1][j - 1]})=${dp[i][j]}`, stats: { filled: (i - 1) * n + j, total: m * n, maxValue: dp[m][n] } })
      }
    }
  }
  steps.push({ table: { rowLabels, colLabels, cells: dp.map(r => r.slice()), highlight: { row: m, col: n, deps: [] } }, codeLine: 6, desc: `编辑距离 = ${dp[m][n]}`, stats: { filled: m * n, total: m * n, maxValue: dp[m][n] } })
  return steps
}

export function coinChange (coins, amount) {
  const steps = []
  const n = coins.length
  const INF = Infinity
  const dp = Array(n + 1).fill(0).map(() => Array(amount + 1).fill(INF))
  for (let i = 0; i <= n; i++) dp[i][0] = 0
  const rowLabels = ['∅', ...coins.map(c => `coin=${c}`)]
  const colLabels = Array(amount + 1).fill(0).map((_, j) => j)
  const display = d => d.map(r => r.map(v => v === INF ? '∞' : v))
  steps.push({ table: { rowLabels, colLabels, cells: display(dp), highlight: {} }, codeLine: 1, desc: '初始化 dp 表', stats: { filled: 0, total: n * amount, maxValue: 0 } })
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= amount; j++) {
      const deps = [[i - 1, j]]
      if (coins[i - 1] <= j) {
        deps.push([i, j - coins[i - 1]])
        const noUse = dp[i - 1][j]
        const use = dp[i][j - coins[i - 1]] + 1
        dp[i][j] = Math.min(noUse === INF ? INF : noUse, use === INF ? INF : use)
        steps.push({ table: { rowLabels, colLabels, cells: display(dp), highlight: { row: i, col: j, deps } }, codeLine: 5, desc: `min(不用=${noUse === INF ? '∞' : noUse}, 用=${use === INF ? '∞' : use}) = ${dp[i][j] === INF ? '∞' : dp[i][j]}`, stats: { filled: (i - 1) * amount + j, total: n * amount, maxValue: dp[n][amount] === INF ? 0 : dp[n][amount] } })
      } else {
        dp[i][j] = dp[i - 1][j]
        steps.push({ table: { rowLabels, colLabels, cells: display(dp), highlight: { row: i, col: j, deps } }, codeLine: 4, desc: `coin=${coins[i - 1]} > ${j}，不能使用，dp=${dp[i][j] === INF ? '∞' : dp[i][j]}`, stats: { filled: (i - 1) * amount + j, total: n * amount, maxValue: dp[n][amount] === INF ? 0 : dp[n][amount] } })
      }
    }
  }
  const result = dp[n][amount] === INF ? -1 : dp[n][amount]
  steps.push({ table: { rowLabels, colLabels, cells: display(dp), highlight: { row: n, col: amount, deps: [] } }, codeLine: 7, desc: `最少硬币数 = ${result}`, stats: { filled: n * amount, total: n * amount, maxValue: result } })
  return steps
}

// ===================== 算法元数据 =====================

export const ALGORITHMS = {
  bubbleSort: {
    key: 'bubbleSort', name: '冒泡排序', category: 'sort', type: 'array', icon: 'arrow-swap', color: '#2d8cf0',
    complexity: { time: 'O(n²)', space: 'O(1)' }, desc: '相邻元素两两比较，逆序则交换，每轮将最大值冒泡到末尾',
    code: ['function bubbleSort(a) {', '  for (i = 0; i < n-1; i++)', '    for (j = 0; j < n-i-1; j++)', '      if (a[j] > a[j+1])', '        swap(a[j], a[j+1])', '  return a', '}'],
    run: (input) => bubbleSort(input.array)
  },
  selectionSort: {
    key: 'selectionSort', name: '选择排序', category: 'sort', type: 'array', icon: 'android-checkbox-outline', color: '#16a085',
    complexity: { time: 'O(n²)', space: 'O(1)' }, desc: '每轮从未排序部分找最小值，与当前位置交换',
    code: ['function selectionSort(a) {', '  for (i = 0; i < n-1; i++) {', '    minIdx = i', '    for (j = i+1; j < n; j++)', '      if (a[j] < a[minIdx])', '        minIdx = j', '    swap(a[i], a[minIdx])', '  }', '}'],
    run: (input) => selectionSort(input.array)
  },
  insertionSort: {
    key: 'insertionSort', name: '插入排序', category: 'sort', type: 'array', icon: 'log-in', color: '#e67e22',
    complexity: { time: 'O(n²)', space: 'O(1)' }, desc: '将每个元素插入到已排序部分的正确位置',
    code: ['function insertionSort(a) {', '  for (i = 1; i < n; i++) {', '    key = a[i]; j = i-1', '    while (j >= 0 && a[j] > key)', '      a[j+1] = a[j]; j--', '    a[j+1] = key', '  }', '}'],
    run: (input) => insertionSort(input.array)
  },
  heapSort: {
    key: 'heapSort', name: '堆排序', category: 'sort', type: 'array', icon: 'ios-filing', color: '#8e44ad',
    complexity: { time: 'O(n log n)', space: 'O(1)' }, desc: '建大顶堆，逐次将堆顶移到末尾并调整堆',
    code: ['function heapSort(a) {', '  buildMaxHeap(a)', '  for (i = n-1; i > 0; i--) {', '    swap(a[0], a[i])', '    heapify(a, i, 0)', '  }', '}'],
    run: (input) => heapSort(input.array)
  },
  quickSort: {
    key: 'quickSort', name: '快速排序', category: 'sort', type: 'array', icon: 'flash', color: '#ed3f14',
    complexity: { time: 'O(n log n)', space: 'O(log n)' }, desc: '选取基准元素，分区使左小右大，递归排序两侧',
    code: ['function quickSort(a, lo, hi) {', '  if (lo < hi) {', '    pivot = a[hi]', '    i = lo - 1', '    for (j = lo; j < hi; j++)', '      if (a[j] <= pivot) swap(a[++i], a[j])', '    swap(a[i+1], a[hi])', '    return i + 1', '  }', '}'],
    run: (input) => quickSort(input.array)
  },
  mergeSort: {
    key: 'mergeSort', name: '归并排序', category: 'sort', type: 'array', icon: 'merge', color: '#19be6b',
    complexity: { time: 'O(n log n)', space: 'O(n)' }, desc: '分治法：分割到单元素，再两两合并为有序序列',
    code: ['function mergeSort(a, lo, hi) {', '  if (lo < hi) {', '    mid = (lo + hi) / 2', '    mergeSort(lo, mid)', '    mergeSort(mid+1, hi)', '    // 合并两个有序段', '    merge(a, lo, mid, hi)', '  }', '}'],
    run: (input) => mergeSort(input.array)
  },
  binarySearch: {
    key: 'binarySearch', name: '二分查找', category: 'search', type: 'array', icon: 'ios-search', color: '#f90',
    complexity: { time: 'O(log n)', space: 'O(1)' }, desc: '在有序数组中，每次比较中点，缩小一半查找范围',
    code: ['function binarySearch(a, target) {', '  lo = 0; hi = n - 1', '  while (lo <= hi) {', '    mid = (lo + hi) / 2', '    if (a[mid] == target) return mid', '    else if (a[mid] < target) lo = mid+1', '    else hi = mid - 1', '  }', '  return -1', '}'],
    run: (input) => binarySearch(input.array, input.target)
  },
  linearSearch: {
    key: 'linearSearch', name: '顺序查找', category: 'search', type: 'array', icon: 'ios-list', color: '#3498db',
    complexity: { time: 'O(n)', space: 'O(1)' }, desc: '从头到尾逐个比较，最简单的查找算法',
    code: ['function linearSearch(a, target) {', '  for (i = 0; i < n; i++)', '    if (a[i] == target)', '      return i', '  return -1', '}'],
    run: (input) => linearSearch(input.array, input.target)
  },
  bfs: {
    key: 'bfs', name: '广度优先搜索', category: 'graph', type: 'graph', icon: 'network', color: '#2d8cf0',
    complexity: { time: 'O(V + E)', space: 'O(V)' }, desc: '从起点出发，逐层访问所有可达节点，使用队列',
    code: ['function bfs(graph, start) {', '  queue = [start]; visited = {start}', '  while (queue not empty) {', '    node = queue.dequeue()', '    visit(node)', '    for (neighbor of graph[node])', '      if (neighbor not visited)', '        visited.add(neighbor)', '        queue.enqueue(neighbor)', '  }', '}'],
    run: (input) => bfs(input.graph, input.start)
  },
  dfs: {
    key: 'dfs', name: '深度优先搜索', category: 'graph', type: 'graph', icon: 'ios-analytics', color: '#e74c3c',
    complexity: { time: 'O(V + E)', space: 'O(V)' }, desc: '深入到不能再深入为止，回溯后探索其他分支',
    code: ['function dfs(graph, node) {', '  visited.add(node)', '  visit(node)', '  for (neighbor of graph[node])', '    if (neighbor not visited)', '      dfs(graph, neighbor)', '  }', '}'],
    run: (input) => dfs(input.graph, input.start)
  },
  dijkstra: {
    key: 'dijkstra', name: 'Dijkstra 最短路', category: 'graph', type: 'graph', icon: 'ios-navigate', color: '#9b59b6',
    complexity: { time: 'O(V²)', space: 'O(V)' }, desc: '逐步扩展最短路径树，每次选取距离最小的未访问节点',
    code: ['function dijkstra(graph, start) {', '  dist = { all: INF }; dist[start] = 0', '  while (unvisited not empty) {', '    u = min dist unvisited node', '    visited.add(u)', '    for (neighbor of u)', '      if (newDist < dist[neighbor])', '        dist[neighbor] = newDist', '  }', '}'],
    run: (input) => dijkstra(input.graph, input.start)
  },
  prim: {
    key: 'prim', name: 'Prim 最小生成树', category: 'graph', type: 'graph', icon: 'share', color: '#1abc9c',
    complexity: { time: 'O(V²)', space: 'O(V)' }, desc: '从一个节点开始，每次加入最短的横切边扩展 MST',
    code: ['function prim(graph, start) {', '  key = { all: INF }; key[start] = 0', '  while (mst not full) {', '    u = min key node not in MST', '    mst.add(u)', '    for (neighbor of u)', '      if (edge < key[neighbor])', '        key[neighbor] = edge', '  }', '}'],
    run: (input) => prim(input.graph, input.start)
  },
  topologicalSort: {
    key: 'topologicalSort', name: '拓扑排序', category: 'graph', type: 'graph', icon: 'shuffle', color: '#34495e',
    complexity: { time: 'O(V + E)', space: 'O(V)' }, desc: 'Kahn 算法：不断移除入度为0的节点（课程先修关系）',
    code: ['function topoSort(graph) {', '  queue = nodes with inDegree==0', '  while (queue not empty) {', '    node = queue.dequeue()', '    output(node)', '    for (neighbor of node)', '      inDegree[neighbor]--', '      if (inDegree == 0)', '        queue.enqueue(neighbor)', '  }', '}'],
    run: (input) => topologicalSort(input.graph)
  },
  knapsack: {
    key: 'knapsack', name: '0-1 背包', category: 'dp', type: 'table', icon: 'cube', color: '#d35400',
    complexity: { time: 'O(nW)', space: 'O(nW)' }, desc: '动态规划：在容量限制下选择物品使总价值最大',
    code: ['function knapsack(w, v, W) {', '  dp[0][*] = 0', '  for (i = 1; i <= n; i++)', '    for (j = 0; j <= W; j++)', '      if (j < w[i]) dp[i][j] = dp[i-1][j]', '      else dp[i][j] = max(', '        dp[i-1][j],', '        dp[i-1][j-w[i]] + v[i])', '  return dp[n][W]', '}'],
    run: () => knapsack([2, 3, 4, 5], [3, 4, 5, 6], 8)
  },
  lcs: {
    key: 'lcs', name: '最长公共子序列', category: 'dp', type: 'table', icon: 'link', color: '#27ae60',
    complexity: { time: 'O(mn)', space: 'O(mn)' }, desc: '动态规划：求两个序列的最长公共子序列长度',
    code: ['function lcs(s1, s2) {', '  dp[0][*] = 0; dp[*][0] = 0', '  for (i = 1; i <= m; i++)', '    for (j = 1; j <= n; j++)', '      if (s1[i] == s2[j])', '        dp[i][j] = dp[i-1][j-1] + 1', '      else', '        dp[i][j] = max(dp[i-1][j], dp[i][j-1])', '  return dp[m][n]', '}'],
    run: () => lcs('ABCBDAB', 'BDCABA')
  },
  shellSort: {
    key: 'shellSort', name: '希尔排序', category: 'sort', type: 'array', icon: 'ios-shuffle', color: '#2980b9',
    complexity: { time: 'O(n log²n)', space: 'O(1)' }, desc: '按增量分组进行插入排序，逐步缩小增量至1',
    code: ['function shellSort(a) {', '  for (gap = n/2; gap > 0; gap /= 2)', '    for (i = gap; i < n; i++) {', '      temp = a[i]; j = i', '      while (j >= gap && a[j-gap] > temp)', '        a[j] = a[j-gap]; j -= gap', '      a[j] = temp', '    }', '}'],
    run: (input) => shellSort(input.array)
  },
  cocktailSort: {
    key: 'cocktailSort', name: '鸡尾酒排序', category: 'sort', type: 'array', icon: 'ios-loop', color: '#1abc9c',
    complexity: { time: 'O(n²)', space: 'O(1)' }, desc: '双向冒泡：正向把最大值推到末尾，反向把最小值推到开头',
    code: ['function cocktailSort(a) {', '  while (swapped) {', '    // 正向', '    for (i = start; i < end; i++)', '      if (a[i] > a[i+1]) swap', '    // 反向', '    for (i = end-1; i >= start; i--)', '      if (a[i] > a[i+1]) swap', '  }', '}'],
    run: (input) => cocktailSort(input.array)
  },
  countingSort: {
    key: 'countingSort', name: '计数排序', category: 'sort', type: 'array', icon: 'ios-calculator', color: '#e74c3c',
    complexity: { time: 'O(n + k)', space: 'O(k)' }, desc: '非比较排序：统计每个值出现次数，按前缀和放置元素',
    code: ['function countingSort(a) {', '  count = new Array(max+1).fill(0)', '  for (i = 0; i < n; i++)', '    count[a[i]]++', '  for (i = 1; i <= max; i++)', '    count[i] += count[i-1]', '  for (i = n-1; i >= 0; i--)', '    output[--count[a[i]]] = a[i]', '}'],
    run: (input) => countingSort(input.array)
  },
  interpolationSearch: {
    key: 'interpolationSearch', name: '插值查找', category: 'search', type: 'array', icon: 'ios-location', color: '#e84393',
    complexity: { time: 'O(log log n)', space: 'O(1)' }, desc: '根据目标值估算位置，适合均匀分布的有序数组',
    code: ['function interpolationSearch(a, t) {', '  lo = 0; hi = n - 1', '  while (lo <= hi) {', '    pos = lo + (t-a[lo])*(hi-lo)/(a[hi]-a[lo])', '    if (a[pos] == t) return pos', '    else if (a[pos] < t) lo = pos+1', '    else hi = pos - 1', '  }', '}'],
    run: (input) => interpolationSearch(input.array, input.target)
  },
  kruskal: {
    key: 'kruskal', name: 'Kruskal 最小生成树', category: 'graph', type: 'graph', icon: 'md-git-branch', color: '#2c3e50',
    complexity: { time: 'O(E log E)', space: 'O(V)' }, desc: '按边权排序，依次加入不形成环的边（Union-Find）',
    code: ['function kruskal(graph) {', '  sort(edges by weight)', '  for (edge of edges) {', '    if (find(u) != find(v)) {', '      mst.add(edge)', '      union(u, v)', '    }', '  }', '}'],
    run: (input) => kruskal(input.graph)
  },
  floydWarshall: {
    key: 'floydWarshall', name: 'Floyd 全源最短路', category: 'graph', type: 'table', icon: 'md-globe', color: '#6c5ce7',
    complexity: { time: 'O(n³)', space: 'O(n²)' }, desc: '动态规划求所有节点对之间的最短路径',
    code: ['function floyd(dist) {', '  for (k = 0; k < n; k++)', '    for (i = 0; i < n; i++)', '      for (j = 0; j < n; j++)', '        if (dist[i][k]+dist[k][j] < dist[i][j])', '          dist[i][j] = dist[i][k]+dist[k][j]', '}'],
    run: () => floydWarshall(DEFAULT_GRAPH)
  },
  lis: {
    key: 'lis', name: '最长递增子序列', category: 'dp', type: 'table', icon: 'ios-trending-up', color: '#fd79a8',
    complexity: { time: 'O(n²)', space: 'O(n)' }, desc: '动态规划求最长递增子序列长度',
    code: ['function lis(a) {', '  dp[i] = 1 for all i', '  for (i = 1; i < n; i++)', '    for (j = 0; j < i; j++)', '      if (a[j] < a[i])', '        dp[i] = max(dp[i], dp[j]+1)', '  return max(dp)', '}'],
    run: () => lis([10, 9, 2, 5, 3, 7, 101, 18])
  },
  editDistance: {
    key: 'editDistance', name: '编辑距离', category: 'dp', type: 'table', icon: 'md-create', color: '#00b894',
    complexity: { time: 'O(mn)', space: 'O(mn)' }, desc: '将一个字符串转换为另一个的最少操作数（增/删/改）',
    code: ['function editDistance(s1, s2) {', '  dp[0][j] = j; dp[i][0] = i', '  for (i = 1; i <= m; i++)', '    for (j = 1; j <= n; j++)', '      if (s1[i] == s2[j])', '        dp[i][j] = dp[i-1][j-1]', '      else', '        dp[i][j] = 1+min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])', '}'],
    run: () => editDistance('kitten', 'sitting')
  },
  coinChange: {
    key: 'coinChange', name: '硬币找零', category: 'dp', type: 'table', icon: 'logo-yen', color: '#fdcb6e',
    complexity: { time: 'O(nW)', space: 'O(nW)' }, desc: '给定硬币面额，求凑成目标金额的最少硬币数',
    code: ['function coinChange(coins, amount) {', '  dp[0] = 0', '  for (i = 1; i <= n; i++)', '    for (j = 1; j <= amount; j++)', '      if (coins[i] <= j)', '        dp[i][j] = min(dp[i-1][j], dp[i][j-coins[i]]+1)', '      else', '        dp[i][j] = dp[i-1][j]', '}'],
    run: () => coinChange([1, 5, 11], 15)
  }
}

export const CATEGORIES = [
  { key: 'sort', name: '排序算法', icon: 'ios-swap' },
  { key: 'search', name: '查找算法', icon: 'ios-search' },
  { key: 'graph', name: '图论算法', icon: 'ios-git-network' },
  { key: 'dp', name: '动态规划', icon: 'md-grid' }
]

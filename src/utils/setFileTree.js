export function buildFileSystem(files) {
  const root = {
    name: '', // 根节点名称（空字符串）
    path: '/', // 完整路径标识
    children: [], // 子目录节点
    isFolder: true, // 标记为文件夹
    files: [],
    raw: null
  }
  // 路径映射：路径 → 节点对象
  const pathMap = new Map().set('/', root) // 路径映射表（快速查找节点）

  files.forEach((file) => {
    // 示例路径 "/a/b/c" → ["a", "b", "c"]
    const pathParts = file.path.split('/').filter((p) => p !== '')
    let current = root

    pathParts.forEach((part, index) => {
      const isLast = index === pathParts.length - 1 // 判断是否为末级路径段
      const currentPath = `/${pathParts.slice(0, index + 1).join('/')}`

      if (!pathMap.has(currentPath)) {
        const newNode = {
          name: part, // 节点名称（文件/文件夹，如 "a"）
          path: currentPath, // 完整路径（如 "/a"）
          children: [], // 子目录（仅文件夹有效）
          isFolder: !isLast, // 标记为文件夹（非末级路径）
          raw: isLast ? file : null, // 将文件节点赋值给 raw
          files: isLast ? [file] : [] // 末级路径存储文件对象
        }

        // 补充逻辑
        if (isLast) {
          newNode.files = [file]
          newNode.raw = file // 文件节点赋值 raw
        } else {
          newNode.raw = null // 明确文件夹节点无 raw
        }

        current.children.push(newNode)
        // 更新路径映射表
        pathMap.set(currentPath, newNode)
        current = newNode
      } else {
        const existing = pathMap.get(currentPath)
        if (isLast) {
          existing.files.push(file)
          existing.raw = file // 更新已有文件的 raw
        }
        current = existing
      }
    })
  })

  return { root, pathMap }
}

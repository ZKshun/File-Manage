<template>
  <div class="file-browser">
    <!-- 上栏工具栏 -->
    <div class="top-toolbar">
      <h2 class="title">{{ isPublicMode ? '公共数据' : '管理我的数据' }}</h2>
      <div class="top-actions">
        <template v-if="isPublicMode">
          <input v-model="searchKeyword" placeholder="搜索公共文件" class="search-input" />
          <button @click="toggleMode">🔙 查看我的数据</button>
        </template>
        <template v-else>
          <button @click="toggleMode">🔍 查看公共数据</button>
        </template>
      </div>
    </div>

    <!-- 下栏工具栏 -->
    <div class="bottom-toolbar" v-if="!isPublicMode">
      <button @click="goBack" :disabled="currentPath === '/' || isPublicMode">
        ← 返回上级
      </button>
      <div class="right-actions">
        <button @click="handleUpload">⬆️ 上传文件</button>
        <button @click="batchDelete" :disabled="selectedFiles.size === 0">
          🗑️ 批量删除 ({{ selectedFiles.size }})
        </button>
        <div class="current-path">
          <span class="label">当前路径:</span>
          <span class="path">{{ formattedCurrentPath }}</span>
        </div>
      </div>
    </div>

    <!-- 文件列表容器 -->
    <div class="file-list-container" :style="{ width: '80vw' }">
      <!-- 我的数据列表 -->
      <template v-if="!isPublicMode">
        <div class="scroll-container">
          <!-- 我的数据表头 -->
          <div class="list-header">
            <div class="header-name">名称</div>
            <div class="header-size">大小</div>
            <div class="header-date">日期</div>
            <div class="header-actions">操作</div>
          </div>
          <div v-for="item in currentItems" :key="item.path" class="list-item"
            :class="{ 'is-selected': selectedFiles.has(item.path) }">
            <!-- 复选框 -->
            <label class="checkbox">
              <input type="checkbox" v-model="selectedFiles" :value="item.path" :disabled="item.isFolder" />
            </label>

            <!-- 图标和名称 -->
            <div class="item-main" @click="item.isFolder ? enterFolder(item.path) : null">
              <span class="icon">
                {{ item.isFolder ? '📁' : '📄' }}
              </span>
              <span class="name">{{ item.name }}</span>
            </div>

            <!-- 文件元信息 -->
            <template v-if="!item.isFolder">
              <div class="meta size">{{ item.raw?.size || '未知大小' }}</div>
              <div class="meta date">
                {{
                  item.raw?.creatDate
                    ? formatDate(item.raw?.creatDate)
                    : '未知日期'
                }}
              </div>
            </template>

            <!-- 操作按钮 -->
            <div class="actions" v-if="!item.isFolder">
              <button @click="handleEdit(item)" class="icon-btn">✏️</button>
              <button @click="handleDelete(item)" class="icon-btn danger">
                🗑️
              </button>
              <!-- 下载按钮 -->
              <button @click="handleDownload(item)" class="icon-btn">⬇️</button>
            </div>
          </div>
        </div>
      </template>

      <!-- 公共数据列表（直接使用80vw） -->
      <template v-else>
        <!-- 公共数据表头 -->
        <div class="public-header">
          <div class="header-name">名称</div>
          <div class="header-size">大小</div>
          <div class="header-date">日期</div>
          <div class="header-creator">创建者</div>
          <div class="header-actions">操作</div>
        </div>
        <!-- 过滤后的公共文件列表 -->
        <div v-for="(file, index) in paginatedPublicFiles" :key="index" class="public-file-item">
          <span class="icon">📄</span>
          <span class="name">{{ file.name }}</span>
          <div class="meta size">{{ file.size }}</div>
          <div class="meta date">{{ formatDate(file.createDate) }}</div>
          <div class="meta creator">{{ file.creator }}</div>
          <div class="actions">
            <button @click="handlePublicDownload(file)" class="icon-btn">
              ⬇️
            </button>
          </div>
        </div>

        <!-- 分页控件 -->
        <div class="pagination">
          <button :disabled="currentPage === 1" @click="currentPage--">
            上一页
          </button>
          <span>第 {{ currentPage }} 页</span>
          <button :disabled="currentPage >= totalPages" @click="currentPage++">
            下一页
          </button>
        </div>
      </template>
    </div>

    <!-- 编辑模态框 -->
    <EditModal v-if="editingFile" :file="editingFile" @confirm="handleEditConfirm" @cancel="editingFile = null" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import EditModal from './EditModal.vue'

const props = defineProps({
  fileSystem: Object, // 我的数据
  publicFiles: Array // 公共数据
})

// 响应式状态
const currentPath = ref('/')
const selectedFiles = ref(new Set()) // 自动去重
const editingFile = ref(null)
const isPublicMode = ref(false)
const searchKeyword = ref('') // 绑定搜索框关键字
const currentPage = ref(1)
const pageSize = 12

// 计算属性====================================================================
// 计算当前显示项,确保在计算 currentItems 时处理可能的空值
const currentItems = computed(() => {
  const loc = props.fileSystem?.pathMap?.get(currentPath.value) // 获取当前路径的文件夹
  return [
    ...(loc?.children || []),
    ...(loc?.files || []).map((file) => ({
      ...file,
      isFolder: false,
      raw: file // 确保文件节点有 raw
    }))
  ].sort((a, b) => (a.isFolder === b.isFolder ? 0 : a.isFolder ? -1 : 1))
})

// 面包屑生成
const formattedCurrentPath = computed(() => {
  return currentPath.value === '/' ? '/' : currentPath.value
})

// 搜索关键字过滤
const filteredPublicFiles = computed(() => {
  return props.publicFiles.filter(
    (file) => file.name.includes(searchKeyword.value) && file.isPublic // 假设有公开标记字段
  )
})

// 计算分页信息页数
const totalPages = computed(() =>
  Math.ceil(filteredPublicFiles.value.length / pageSize)
)

// 计算分页后的公共文件列表
const paginatedPublicFiles = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize
  return filteredPublicFiles.value.slice(start, end)
})

// 方法===========================================================================
// 模式切换函数（我的数据和公共数据之间）
const toggleMode = () => {
  isPublicMode.value = !isPublicMode.value
  selectedFiles.value.clear()
  currentPage.value = 1 // 重置页码
}

// 返回上级按钮处理（split分割＋join组合）
const goBack = () => {
  const parts = currentPath.value.split('/').filter((p) => p) // 过滤空字符串
  parts.pop()
  currentPath.value = parts.length ? `/${parts.join('/')}` : '/' //拼接字符串数组
}

// 文件上传按钮处理（模拟实现，具体逻辑看大事件）
const handleUpload = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.onchange = (e) => {
    const file = e.target.files[0]
    const targetPath = `${currentPath.value}/${file.name}`
    console.log('[模拟上传] 目标路径:', targetPath)
    console.log('[模拟上传] 文件对象:', file)
    refreshFileList()
  }
  input.click()
}

// 批量删除处理（模拟实现，后续调接口delete数据库的文件）
const batchDelete = () => {
  const paths = Array.from(selectedFiles.value)
  if (confirm(`确认删除 ${paths.length} 个文件?`)) {
    paths.forEach((path) => {
      console.log('[模拟批量删除] 路径:', path)
    })
    selectedFiles.value.clear()
    refreshFileList()
  }
}

// 进入文件夹(改变当前路径)
const enterFolder = (path) => {
  currentPath.value = path
}

// 格式日期显示
const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString()
}

// 编辑文件信息处理（模拟实现，后续调接口update数据库的文件）
const handleEdit = (item) => {
  editingFile.value = { ...item.raw, path: item.path }
}

// 文件删除处理（替换API调用接口delete数据库的文件）
const handleDelete = (item) => {
  if (confirm(`确认删除 ${item.path}?`)) {
    console.log('[模拟删除] 路径:', item.path)
    refreshFileList()
  }
}

// 新增下载处理
const handleDownload = (item) => {
  console.log('[下载我的文件]', item.path)
  // 实际应调用下载接口
}

// 编辑确认处理（模拟实现，后续调接口update数据库的文件）
const handleEditConfirm = (newData) => {
  console.log('[模拟编辑] 原始路径:', editingFile.value.path)
  console.log('[模拟编辑] 新数据:', newData)
  editingFile.value = null
  refreshFileList()
}

// 公共文件下载处理（模拟实现，后续调接口download数据库的文件）
const handlePublicDownload = (file) => {
  console.log('[下载公共文件]', file.id)
  // 公共文件下载接口参数可能不同
}

// 模拟刷新文件列表（重新调接口获取文件列表，应该在父组件实现）
const refreshFileList = () => {
  console.log('[模拟刷新] 重新加载文件列表')
  // 实际项目这里应该重新获取数据
  // const newFiles = await fetchFiles();
  // props.fileSystem = buildFileSystem(newFiles);
}
</script>

<style scoped lang="scss">
.file-browser {
  color: #fff;
  background-color: #374774;
  border-radius: 5px;
  margin: 0 auto;
  width: 96vw;
  height: 87.5vh;

  /* 工具栏通用样式 */
  .top-toolbar,
  .bottom-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: #fff;

    /* 顶部工具栏特定样式 */
    &.top-toolbar {
      padding: 10px;
      border-bottom: 1px solid #eee;
    }

    /* 底部工具栏特定样式 */
    &.bottom-toolbar {
      width: 80vw;
      padding: 10px 0;
      margin: 0 auto;
    }
  }

  /* 当前路径显示样式 */
  .current-path {
    display: flex;
    align-items: center;
    font-size: 14px;

    .label {
      font-weight: 600;
      margin-right: 8px;
      color: #ffffff;
    }

    .path {
      font-family: monospace;
      background: #ffffff;
      color: #000000;
      font-weight: 600;
      padding: 4px 8px;
      border-radius: 4px;
    }
  }

  /* 文件列表容器 */
  .file-list-container {
    margin: 0 auto;
    margin-bottom: 1vh;
    height: 75vh;

    /* 滚动容器 */
    .scroll-container {
      height: 100%;
      overflow-y: auto;

      /* 滚动条样式 */
      &::-webkit-scrollbar {
        width: 10px;
      }

      &::-webkit-scrollbar-thumb {
        background: #607275;
        border-radius: 5px;

        &:hover {
          background: #42616b;
        }
      }

      &::-webkit-scrollbar-track {
        background: #f1f1f1;
      }

      border: 2px solid #a8a6a6;
      border-radius: 4px;
    }

    /* 我的数据表头 */
    .list-header {
      display: grid;
      grid-template-columns: 30px 1fr 110px 140px 80px;
      padding: 12px 13px;
      background: #2f4166;
      position: sticky;
      top: 0;
      z-index: 1;
      border-bottom: 2px solid #a8a6a6;

      div {
        color: #fff;
        font-weight: 600;
        font-size: 0.95em;
      }

      /* 列定位 */
      .header-name {
        grid-column: 2;
      }

      .header-size {
        grid-column: 3;
      }

      .header-date {
        grid-column: 4;
      }

      .header-actions {
        grid-column: 5;
      }
    }

    /* 公共数据表头 */
    .public-header {
      display: grid;
      grid-template-columns: 30px 3fr 1fr 1.5fr 1.5fr 40px;
      gap: 15px;
      padding: 12px 8px;
      background: #2f4166;
      position: sticky;
      top: 0;
      z-index: 1;
      border-bottom: 2px solid #a8a6a6;

      div {
        color: #fff;
        font-weight: 600;
        font-size: 0.95em;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      /* 列定位 */
      .header-name {
        grid-column: 2;
      }

      .header-size {
        grid-column: 3;
      }

      .header-date {
        grid-column: 4;
      }

      .header-creator {
        grid-column: 5;
      }

      .header-actions {
        grid-column: 6;
      }
    }

    /* 列表项通用样式 */
    .list-item,
    .public-file-item {
      display: grid;
      align-items: center;
      padding: 13px;
      border-bottom: 1px solid #9e9d9d;

      &:hover {
        background: #95a3a5;
      }

      .actions {
        display: flex;
        gap: 8px;
        justify-self: end;
      }
    }

    /* 我的数据列表项 */
    .list-item {
      grid-template-columns: 30px 1fr 100px 150px 80px;

      &.is-selected {
        background: #567c96;
      }

      .item-main {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
      }

      .meta {
        color: #ffffff;
        font-size: 0.9em;
      }
    }

    /* 公共数据列表项 */
    .public-file-item {
      grid-template-columns: 30px 3fr 1fr 1.5fr 1.5fr 40px;
      gap: 15px;

      >* {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .icon {
        font-size: 1.2em;
        margin-right: -10px;
      }
    }

    /* 分页控件 */
    .pagination {
      position: sticky;
      bottom: 0;
      padding: 15px 0;
      display: flex;
      justify-content: center;
      gap: 15px;
      border-top: 1px solid #ddd;
    }
  }

  /* 右侧操作容器 */
  .right-actions {
    display: flex;
    gap: 15px;
    align-items: center;
  }

  /* 按钮通用样式 */
  button {
    padding: 2px 5px;
    border: 1px solid #496c75;
    border-radius: 4px;
    background: #3773c2;
    cursor: pointer;

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    &:hover:not(:disabled) {
      background: #eee;
    }

    /* 危险按钮样式 */
    &.danger:hover {
      color: red;
    }

    /* 图标按钮 */
    &.icon-btn {
      padding: 2px 5px;
    }
  }

  /* 搜索输入框 */
  .search-input {
    margin-right: 15px;
    padding: 4px 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
  }
}
</style>

<!-- App.vue -->
<template>
  <FileBrowser :fileSystem="fileSystem" :publicFiles="publicFiles" />
</template>

<script setup>
import { buildFileSystem } from '@/utils/setFileTree'
import FileBrowser from './components/FileBrowser.vue'

// 模拟数据
const rawFiles = [
  {
    path: '/public/data/myfile.txt',
    name: 'myfile.txt',
    size: '1KB',
    createDate: '2025-3-19 15:50:12',
    creator: '小刘',
    isPublic: true
  },

  {
    path: '/private/docs/notes.txt',
    name: 'notes.txt',
    size: '1KB',
    createDate: '2025-3-19 15:50:12',
    creator: '小刘',
    isPublic: true
  }
]

// 构建文件系统
const fileSystem = buildFileSystem(rawFiles)
const publicFiles = rawFiles // 直接使用原始文件数组作为公共文件列表
</script>

<style scoped lang="scss">
body {
  font-family: 'Arial', sans-serif;
  background-color: #f0f0f0;
  margin: 0;
  padding: 20px;
}
</style>

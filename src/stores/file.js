// stores/file.js
import { defineStore } from 'pinia';
import { ref } from 'vue';
import axios from 'axios';

export const useFileStore = defineStore('file', () => {
  const currentPath = ref('/');
  const fileTree = ref([]);
  const currentFolderContents = ref([]);

  // 获取当前目录内容
  const fetchFiles = async (path) => {
    const res = await axios.get('/api/files', { params: { path } });
    currentFolderContents.value = res.data;
  };

  // 获取完整文件树
  const fetchFileTree = async () => {
    const res = await axios.get('/api/files/tree');
    fileTree.value = res.data;
  };

  // 改变当前路径
  const changePath = (path) => {
    currentPath.value = path;
    fetchFiles(path);
  };

  return {
    currentPath,
    fileTree,
    currentFolderContents,
    fetchFiles,
    fetchFileTree,
    changePath
  };
});

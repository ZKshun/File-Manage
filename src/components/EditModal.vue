<!-- components/EditModal.vue -->
<template>
  <div class="modal-mask">
    <div class="modal-wrapper">
      <div class="modal-content">
        <h3>编辑文件信息</h3>

        <div class="form-item">
          <label>文件路径：</label>
          <input v-model="editData.path" :disabled="true" />
        </div>

        <div class="form-item">
          <label>文件名称：</label>
          <input v-model="editData.name" />
        </div>

        <div class="form-buttons">
          <el-button @click="$emit('cancel')">取消</el-button>
          <el-button @click="handleConfirm">确认修改</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  file: Object
})

const emit = defineEmits(['confirm', 'cancel'])

const editData = ref({
  path: props.file.path,
  name: props.file.name
})

const handleConfirm = () => {
  emit('confirm', {
    newName: editData.value.name,
    newPath: editData.value.path // 实际需要处理路径修改逻辑
  })
}
</script>

<style scoped lang="scss">
.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-content {
  background: #374774;
  padding: 20px;
  border-radius: 8px;
  min-width: 400px;
}

.form-item {
  height: 40px;
  margin: 15px 0;

  input {
    width: 70%;
    padding: 5px;
  }
}

.form-item label {
  display: inline-block;
  width: 80px;
}

.form-buttons {
  margin-top: 20px;
  text-align: right;
}
</style>

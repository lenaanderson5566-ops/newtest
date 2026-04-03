<template>
  <transition name="fade">
    <div v-if="showDialog" class="dialog-overlay" @click.self="handleOverlayClick">
      <div class="dialog-container">
        <div class="dialog-header">
          <h2 class="dialog-title" v-html="title"></h2>
          <button
            v-if="showCloseIcon"
            class="dialog-close-btn"
            @click="handleClose"
          >
            <IconX :size="20" />
          </button>
        </div>

        <div class="dialog-content">
          <div v-html="content"></div>
        </div>

        <div class="dialog-footer" v-if="showCancelButton || showConfirmButton">
          <button
            v-if="showCancelButton"
            class="dialog-btn dialog-btn-cancel"
            @click="handleClose"
          >
            {{ cancelButtonText || $t(cancelButtonI18nKey) }}
          </button>

          <button
            v-if="showConfirmButton"
            class="dialog-btn dialog-btn-confirm"
            @click="handleConfirm"
          >
            {{ confirmButtonText || $t(confirmButtonI18nKey) }}
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
import { ref, watch } from 'vue';
import { IconX } from '@tabler/icons-vue';

export default {
  name: 'CommonDialog',
  components: {
    IconX
  },
  props: {
    /**
     * 是否显示弹窗
     */
    showDialog: {
      type: Boolean,
      default: false
    },
    /**
     * 弹窗标题
     */
    title: {
      type: String,
      default: ''
    },
    /**
     * 弹窗内容
     */
    content: {
      type: String,
      default: ''
    },
    /**
     * 是否显示右上角关闭图标
     */
    showCloseIcon: {
      type: Boolean,
      default: true
    },
    /**
     * 是否显示取消按钮
     */
    showCancelButton: {
      type: Boolean,
      default: true
    },
    /**
     * 是否显示确认按钮
     */
    showConfirmButton: {
      type: Boolean,
      default: true
    },
    /**
     * 取消按钮文本（如果提供，优先使用此文本）
     */
    cancelButtonText: {
      type: String,
      default: ''
    },
    /**
     * 确认按钮文本（如果提供，优先使用此文本）
     */
    confirmButtonText: {
      type: String,
      default: ''
    },
    /**
     * 取消按钮i18n key
     */
    cancelButtonI18nKey: {
      type: String,
      default: 'common.cancel'
    },
    /**
     * 确认按钮i18n key
     */
    confirmButtonI18nKey: {
      type: String,
      default: 'common.confirm'
    },
    /**
     * 点击遮罩层是否可以关闭
     */
    clickOverlayToClose: {
      type: Boolean,
      default: true
    }
  },
  emits: ['close', 'confirm'],
  setup(props, { emit }) {
    const show = ref(false);

    /**
     * 处理关闭操作（取消按钮和右上角X按钮都触发此方法）
     */
    const handleClose = () => {
      show.value = false;
      emit('close');
    };

    /**
     * 处理确认操作
     */
    const handleConfirm = () => {
      show.value = false;
      emit('confirm');
    };

    /**
     * 处理遮罩层点击
     */
    const handleOverlayClick = () => {
      if (props.clickOverlayToClose) {
        handleClose();
      }
    };

    /**
     * 监听showDialog变化
     */
    watch(() => props.showDialog, (newVal) => {
      show.value = newVal;
    }, { immediate: true });

    return {
      show,
      handleClose,
      handleConfirm,
      handleOverlayClick
    };
  }
};
</script>

<style lang="scss" scoped>
@use "@/assets/styles/base/variables.scss" as *;

.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  box-sizing: border-box;
  backdrop-filter: blur(4px);

  .dialog-container {
    width: 100%;
    max-width: 500px;
    background-color: #fff;
    border-radius: $border-radius-sm;
    border: var(--border-width) solid var(--border-subtle);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    max-height: 80vh;
    animation: modal-in 0.3s cubic-bezier(0.16, 1, 0.3, 1);

    .dialog-header {
      padding: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: var(--border-width) solid var(--border-default);
      background-color: rgba(var(--theme-color-rgb), 0.03);

      .dialog-title {
        margin: 0;
        font-size: $font-size-xl;
        font-weight: $font-weight-semibold;
        color: var(--text-primary);
      }

      .dialog-close-btn {
        background: none;
        border: none;
        cursor: pointer;
        color: var(--text-tertiary);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 8px;
        margin: 0;
        border-radius: 50%;
        transition: all 0.3s ease;

        &:hover {
          background-color: rgba(0, 0, 0, 0.05);
          color: var(--text-primary);
          transform: rotate(90deg);
        }
      }
    }

    .dialog-content {
      padding: 16px;
      overflow-y: auto;
      flex: 1;
      background: linear-gradient(to bottom, rgba(var(--theme-color-rgb), 0.02), transparent);

      :deep(p) {
        margin: 8px 0;
        line-height: 1.6;
        color: var(--text-primary);
      }

      :deep(strong) {
        color: var(--theme-color);
        font-weight: $font-weight-semibold;
      }

      :deep(a) {
        color: var(--theme-color);
        text-decoration: none;

        &:hover {
          text-decoration: underline;
        }
      }
    }

    .dialog-footer {
      padding: 16px 16px;
      border-top: var(--border-width) solid var(--border-default);
      display: flex;
      justify-content: flex-end;
      gap: 8px;

      .dialog-btn {
        padding: 8px 16px;
        border: none;
        border-radius: 8px;
        font-size: $font-size-md;
        font-weight: $font-weight-medium;
        cursor: pointer;
        transition: all 0.3s ease;
        min-width: 80px;

        &:hover {
          transform: translateY(-2px);
        }
      }

      .dialog-btn-cancel {
        background-color: var(--border-color);
        color: var(--text-primary);

        &:hover {
          background-color: var(--text-tertiary);
          box-shadow: var(--shadow-md);
        }
      }

      .dialog-btn-confirm {
        background-color: var(--theme-color);
        color: var(--text-on-dark-primary);

        &:hover {
          box-shadow: var(--shadow-md);
        }
      }
    }
  }
}

@keyframes modal-in {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.fade-enter-active {
  transition: opacity 0.3s ease;
}

.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .dialog-overlay {
    padding: 16px;

    .dialog-container {
      max-width: 100%;
      max-height: 85vh;

      .dialog-header {
        padding: 16px;

        .dialog-title {
          font-size: $font-size-md;
        }
      }

      .dialog-content {
        padding: 16px;
      }

      .dialog-footer {
        padding: 8px 16px;
        flex-direction: column-reverse;

        .dialog-btn {
          width: 100%;
          margin: 0;
        }
      }
    }
  }
}
</style>

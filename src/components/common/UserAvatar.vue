<template>
  <div class="user-avatar-container" ref="avatarContainer">
    <div class="avatar-wrapper" :class="{ 'is-active': isDropdownOpen }" @click="toggleDropdown">
      <div v-if="loading" class="avatar-loading" aria-label="loading">
        <span class="loading-spinner"></span>
      </div>
      <div v-else class="avatar-placeholder">
        <span class="avatar-letter">{{ avatarInitial }}</span>
      </div>
    </div>
    
    <transition name="fade">
      <div 
        class="dropdown-menu" 
        v-if="isDropdownOpen"
      >
        <div class="menu-item" @click="navigateTo('/profile')">
          <IconUser class="menu-icon" />
          <span>{{ $t('common.userCenter') }}</span>
        </div>
        <div class="menu-item" @click="navigateTo('/tickets')">
          <IconMessageCircle class="menu-icon" />
          <span>{{ $t('dashboard.ticketSupport') }}</span>
        </div>
        <div class="divider"></div>
        <div class="menu-item" @click="logout">
          <IconLogout class="menu-icon" />
          <span>{{ $t('common.logoutText') }}</span>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useToast } from '@/composables/useToast';
import { IconMessageCircle } from '@tabler/icons-vue';
import IconUser from '@/components/icons/IconUser.vue';
import IconLogout from '@/components/icons/IconLogout.vue';

export default {
  name: 'UserAvatar',
  components: {
    IconMessageCircle,
    IconUser,
    IconLogout
  },
  props: {
    email: {
      type: String,
      default: ''
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  setup(props) {
    const router = useRouter();
    const { t } = useI18n();
    const { showToast } = useToast();
    const isDropdownOpen = ref(false);
    const avatarContainer = ref(null);
    const avatarInitial = computed(() => {
      const rawEmail = (props.email || '').trim();
      if (!rawEmail) return 'U';

      const localPart = rawEmail.split('@')[0] || rawEmail;
      const fallbackTarget = localPart || rawEmail;
      const firstChar = [...fallbackTarget][0] || 'U';

      return firstChar.toUpperCase();
    });
    
    const toggleDropdown = () => {
      isDropdownOpen.value = !isDropdownOpen.value;
    };
    
    const navigateTo = (path) => {
      isDropdownOpen.value = false;
      router.push(path);
    };
    
    const logout = async () => {
      try {
        localStorage.removeItem('token'); 
        isDropdownOpen.value = false;
        
        showToast(t('auth.logoutSuccess'), 'success', 3000);
        
        setTimeout(() => {
          router.push('/login');
        }, 500);
      } catch (error) {
        showToast(t('auth.logoutFailed'), 'error');
      }
    };
    
    const handleClickOutside = (event) => {
      if (avatarContainer.value && !avatarContainer.value.contains(event.target)) {
        isDropdownOpen.value = false;
      }
    };
    
    onMounted(() => {
      document.addEventListener('click', handleClickOutside);
    });
    
    onUnmounted(() => {
      document.removeEventListener('click', handleClickOutside);
    });

    return {
      isDropdownOpen,
      toggleDropdown,
      navigateTo,
      logout,
      avatarContainer,
      avatarInitial
    };
  }
};
</script>

<style lang="scss" scoped>
@use "@/assets/styles/base/variables.scss" as *;

.user-avatar-container {
  position: relative;
}

.avatar-wrapper {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  cursor: pointer;
  overflow: hidden;
  background: transparent;
  border: 1px solid transparent;
  transition: background-color 0.2s ease, border-color 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: #f5f7fa;
    border-color: transparent;
  }

  &.is-active {
    border-color: #e5e7eb;
    background: #f5f7fa;
  }

  .avatar-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    border-radius: inherit;
    background: rgba(var(--theme-color-rgb), 0.95);

    .avatar-letter {
      font-size: $font-size-md;
      font-weight: $font-weight-semibold;
      line-height: 1;
      color: var(--text-on-dark-primary);
      user-select: none;
    }
  }

  .avatar-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    border-radius: inherit;
    background: rgba(var(--theme-color-rgb), 0.12);

    .loading-spinner {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      border: 2px solid rgba(var(--theme-color-rgb), 0.25);
      border-top-color: rgba(var(--theme-color-rgb), 0.95);
      animation: avatar-spin 0.8s linear infinite;
    }
  }
}

@keyframes avatar-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 180px;
  background: rgba(var(--card-background-rgb), 0.9);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: $border-radius-sm;
  box-shadow: var(--shadow-sm);
  border: var(--border-width) solid var(--border-default);
  overflow: hidden;
  z-index: 100;
  animation: dropdownFadeIn 0.2s ease;
  
  .menu-item {
    display: flex;
    align-items: center;
    padding: 8px 16px;
    cursor: pointer;
    transition: all 0.3s ease;
    
    .menu-icon {
      width: 18px;
      height: 18px;
      margin-right: 8px;
      color: var(--text-primary);
      transition: color 0.3s ease;
    }
    
    span {
      font-size: $font-size-md;
      color: var(--text-primary);
      transition: color 0.3s ease;
    }
    
    &:hover {
      background-color: rgba(var(--primary-color-rgb), 0.1);
      color: var(--primary-color);
      
      .menu-icon, span {
        color: var(--primary-color);
      }
    }
    
    &:last-child {
      .menu-icon, span {
        transition: color 0.5s ease;
      }
      
      &:hover {
        background-color: rgba(245, 108, 108, 0.05);
        transition: background-color 0.5s ease;
        
        .menu-icon, span {
          color: var(--error-color);
          transition: color 0.5s ease;
        }
      }
    }
  }
  
  .divider {
    height: 1px;
    background-color: var(--border-default);
    margin: 4px 0;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

@keyframes dropdownFadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style> 

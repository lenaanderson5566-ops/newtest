<template>
  <div class="login-view-container">
    <div class="auth-split-container">


      
      <div class="auth-split-left" :style="leftSideStyles">
        <div class="left-content-overlay"></div>
        <div class="site-name"  v-if="showSiteName" :class="siteNameColorClass" @click="goTo('/')">
          {{ SITE_CONFIG.siteName }}
        </div>
        <div class="greeting-text" v-if="showGreeting" :class="greetingColorClass">
          {{ greetingMessage }}
        </div>
      </div>

      
      <div class="auth-split-right">
        
        <div class="top-toolbar">
          <LanguageSelector />
        </div>

        <div class="auth-form-container" v-if="configLoading">
          <div class="loading-container">
            <div class="loading-spinner"></div>
            <p>{{ $t('common.loading') }}</p>
          </div>
        </div>

        <div class="auth-form-container" v-else>
          <div class="auth-header">
            <div class="auth-logo auth-logo-text auth-logo-text--md" @click="goTo('/')">
          {{ SITE_CONFIG.siteName }}
        </div>
            <h1 class="auth-title">{{ $t('auth.loginTitle') }}</h1>
            <p class="auth-subtitle">{{ $t('auth.loginSubtitle') }}</p>
          </div>

          <form class="auth-form" @submit.prevent="handleLogin">
            <div class="form-group">
              <label for="email">{{ $t('common.email') }} <span class="required">*</span></label>
              <div class="input-with-icon">
                <IconMail class="input-icon" />
                <input
                  type="email"
                  id="email"
                  v-model="formData.email"
                  class="form-control"
                  :placeholder="$t('auth.emailPlaceholder')"
                  required
                />
              </div>
              <div v-if="errors.email" class="error-message">{{ errors.email }}</div>
            </div>

            <div class="form-group">
              <label for="password">{{ $t('common.password') }} <span class="required">*</span></label>
              <div class="input-with-icon">
                <IconLock class="input-icon" />
                <input
                  :type="showPassword ? 'text' : 'password'"
                  id="password"
                  v-model="formData.password"
                  class="form-control"
                  :placeholder="$t('auth.passwordPlaceholder')"
                  required
                />
                <div class="password-toggle" @click="showPassword = !showPassword">
                  <IconEye v-if="!showPassword" />
                  <IconEyeOff v-else />
                </div>
              </div>
              <div v-if="errors.password" class="error-message">{{ errors.password }}</div>
            </div>

            <div class="form-options">
              <router-link to="/forgot-password" class="forgot-password">
                {{ $t('common.forgotPassword') }}
              </router-link>
            </div>

            <button
              type="submit"
              class="btn btn-primary btn-block"
              :disabled="loading"
            >
              <span v-if="loading" class="loading-wrapper">
                <span>{{ $t('common.loading') }}</span>
              </span>
              <span v-else>
                {{ $t('common.login') }}
                <IconArrowRight class="icon-right" />
              </span>
            </button>
          </form>

          <div class="auth-footer">
            <div class="auth-divider">
              <span class="auth-divider-text">{{ $t('auth.noAccount') }}</span>
            </div>

            <router-link to="/register" class="btn btn-secondary btn-block" replace>
              {{ $t('auth.createAccount') }}
            </router-link>
          </div>
        </div>
      </div>
    </div>

    
    <div class="captcha-modal" v-if="showCaptchaModal" :class="{ 'closing': isClosingModal }">
      
    </div>

    
    <AuthPopup
      :show-popup="showAuthPopup"
      :title="authPopupConfig.title"
      :content="authPopupConfig.content"
      :cooldown-hours="authPopupConfig.cooldownHours"
      :close-wait-seconds="authPopupConfig.closeWaitSeconds"
      @close="handleAuthPopupClose"
    />
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useToast } from '@/composables/useToast';
import LanguageSelector from '@/components/common/LanguageSelector.vue';
import IconMail from '@/components/icons/IconMail.vue';
import IconLock from '@/components/icons/IconLock.vue';
import IconArrowRight from '@/components/icons/IconArrowRight.vue';
import IconEye from '@/components/icons/IconEye.vue';
import IconEyeOff from '@/components/icons/IconEyeOff.vue';
import { login, checkLoginStatus } from '@/api/auth';
import { isLogoutInProgress } from '@/utils/authState';
import { validateEmail, validateRequired } from '@/utils/validators';

import { handleTokenLogin, hasVerifyToken } from '@/utils/tokenLogin';
import { AUTH_LAYOUT_CONFIG, SITE_CONFIG, AUTH_CONFIG } from '@/utils/baseConfig';
import AuthPopup from '@/components/auth/AuthPopup.vue';
import { shouldShowAuthPopup } from '@/utils/authPopupState';
import { useNavigator } from "@/composables/useNavigator";

export default {
  name: 'LoginView',
  components: {
    LanguageSelector,
    IconMail,
    IconLock,
    IconArrowRight,
    IconEye,
    IconEyeOff,
    AuthPopup
  },

  setup() {
    const router = useRouter();
    const { t } = useI18n();
    const { showToast } = useToast();
    const { goTo } = useNavigator()


    const formData = reactive({
      email: '',
      password: ''
    });

    const errors = reactive({
      email: '',
      password: ''
    });

    const loading = ref(false);
    const configLoading = ref(false);

    const showCaptchaModal = ref(false);
    const isClosingModal = ref(false);

    const showAuthPopup = ref(false);
    const authPopupConfig = reactive({
      title: AUTH_CONFIG.popup?.title || '',
      content: AUTH_CONFIG.popup?.content || '',
      cooldownHours: AUTH_CONFIG.popup?.cooldownHours || 24,
      closeWaitSeconds: AUTH_CONFIG.popup?.closeWaitSeconds || 0
    });

    const handleAuthPopupClose = () => {
      showAuthPopup.value = false;
    };

    const showPassword = ref(false);



    const showSiteName = computed(() => {
      return AUTH_LAYOUT_CONFIG?.splitLayout?.leftContent?.siteName?.show !== false;
    });

    const siteNameColorClass = computed(() => {
      const color = AUTH_LAYOUT_CONFIG?.splitLayout?.leftContent?.siteName?.color || 'white';
      return color.toLowerCase() === 'black' ? 'black' : 'white';
    });

    const leftSideStyles = computed(() => {
      const backgroundImage = AUTH_LAYOUT_CONFIG?.splitLayout?.leftContent?.backgroundImage || '';

      if (backgroundImage) {
        return {
          'background-image': `url(${backgroundImage})`,
          'background-position': 'center',
          'background-size': 'cover',
          'background-repeat': 'no-repeat'
        };
      } else {
        return { background: 'var(--theme-color)' };
      }
    });

    const showGreeting = computed(() => {
      return AUTH_LAYOUT_CONFIG?.splitLayout?.leftContent?.greeting?.show !== false;
    });

    const greetingMessage = computed(() => {
      return getTimeBasedGreeting();
    });

    const greetingColorClass = computed(() => {
      const color = AUTH_LAYOUT_CONFIG?.splitLayout?.leftContent?.greeting?.color || 'white';
      return color.toLowerCase() === 'black' ? 'black' : 'white';
    });

    onMounted(async () => {


      const hasToken = hasVerifyToken();

      if (hasToken) {
        loading.value = true;

        try {
          const tokenLoginResult = await handleTokenLogin();


          if (tokenLoginResult.success) {
            return;
          }
        } catch (error) {
        } finally {
          loading.value = false;
        }
      }

      const urlParams = new URLSearchParams(window.location.search);
      const isJustLoggedOut = urlParams.get('logout') === 'true';

      if (isJustLoggedOut) {
        showToast(t('auth.logoutSuccess'), 'success', 3000);

        if (window.history && window.history.replaceState) {
          const newUrl = window.location.href.replace('?logout=true', '').replace('&logout=true', '');
          window.history.replaceState({}, document.title, newUrl);
        }

        return;
      }

      try {
        if (isLogoutInProgress()) {
          return;
        }

        const loginStatus = checkLoginStatus();

        if (loginStatus) {
          showToast(t('auth.alreadyLoggedIn'), 'info');
          setTimeout(() => {
            router.push('/dashboard');
          }, 500);
        }

        showAuthPopup.value = shouldShowAuthPopup(AUTH_CONFIG.popup);
      } catch (error) {
      }
    });

    const validateForm = () => {
      let isValid = true;

      errors.email = '';
      errors.password = '';

      if (!validateRequired(formData.email)) {
        errors.email = t('validation.emailRequired');
        isValid = false;
      } else if (!validateEmail(formData.email)) {
        errors.email = t('validation.emailInvalid');
        isValid = false;
      }

      if (!validateRequired(formData.password)) {
        errors.password = t('validation.passwordRequired');
        isValid = false;
      }

      return isValid;
    };

    const handleLogin = async () => {
      if (!validateForm()) {
        return;
      }

      loading.value = true;

      try {
        const response = await login(formData);

        showToast(response.message || t('auth.loginSuccess'), 'success', 3000);

        setTimeout(() => {
          router.push('/dashboard');
        }, 300);
      } catch (error) {
        showToast(resolveLoginErrorMessage(error), 'error');
      } finally {
        loading.value = false;
      }
    };

    const resolveLoginErrorMessage = (error) => {
      const statusCode = error?.response?.status;
      const responseData = error?.response?.data;
      const responseMessage = String(
        error?.response?.data?.message
        || (typeof responseData === 'string' ? responseData : '')
        || error?.response?.message
        || error?.message
        || ''
      );
      const normalizedMessage = responseMessage.toLowerCase();

      if (normalizedMessage.includes('incorrect email or password')) {
        return t('auth.loginInvalidCredentials');
      }
      if (normalizedMessage.includes('too many password errors')) {
        return t('auth.loginTooManyAttempts');
      }
      if (normalizedMessage.includes('account has been suspended')) {
        return t('auth.loginAccountSuspended');
      }

      if (statusCode === 422) {
        const validationErrors = error?.response?.data?.errors || {};
        const firstValidationError = validationErrors?.email?.[0]
          || validationErrors?.password?.[0]
          || '';

        if (firstValidationError.includes('Email can not be empty')) return t('validation.emailRequired');
        if (firstValidationError.includes('Email format is incorrect')) return t('validation.emailInvalid');
        if (firstValidationError.includes('Password can not be empty')) return t('validation.passwordRequired');
        if (firstValidationError.includes('Password must be greater than 8 digits')) return t('auth.passwordTooShort');
        return t('auth.loginInvalidRequest');
      }

      if (statusCode === 403) return t('errors.forbidden');
      if (statusCode === 404) return t('errors.notFound');
      if (statusCode && statusCode >= 500) return t('errors.serverError');

      const rawMessage = String(error?.message || '').toLowerCase();
      if (rawMessage.includes('network')) return t('errors.networkError');
      if (rawMessage.includes('timeout')) return t('errors.serverError');

      return t('auth.loginFailed');
    };

    const getTimeBasedGreeting = () => {
      const hour = new Date().getHours();

      if (hour >= 5 && hour < 12) {
        return 'Good Morning';
      } else if (hour >= 12 && hour < 18) {
        return 'Good Afternoon';
      } else if (hour >= 18 && hour < 22) {
        return 'Good Evening';
      } else {
        return 'Good Night';
      }
    };

    return {
      formData,
      errors,
      loading,
      showPassword,
      handleLogin,
      leftSideStyles,
      configLoading,
      showCaptchaModal,
      isClosingModal,
      showSiteName,
      siteNameColorClass,
      SITE_CONFIG,
      showGreeting,
      greetingMessage,
      greetingColorClass,
      getTimeBasedGreeting,
      showAuthPopup,
      authPopupConfig,
      handleAuthPopupClose,
      goTo,
    };
  }
};
</script>

<style lang="scss" scoped>
@use "@/assets/styles/base/variables.scss" as *;
.login-view-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;

  @include down(lg) {
    overflow-y: auto;
    position: relative;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }
}

.auth-split-container {
  display: flex;
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.auth-split-left {
  flex: 1;
  min-width: 500px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;

  @include down(lg) {
    display: none;
  }

  .left-content-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.2);
    z-index: 1;
  }

  .site-name {
    position: absolute;
    top: 30px;
    left: 30px;
    font-size: $font-size-2xl;
    font-weight: $font-weight-bold;
    z-index: 2;
    cursor: pointer;
    user-select: none;

    &.white {
      color: var(--text-on-dark-primary);
      text-shadow: none;
    }

    &.black {
      color: var(--color-text-primary);
      text-shadow: none;
    }
  }

  .greeting-text {
    position: absolute;
    bottom: 30px;
    left: 30px;
    font-size: $font-size-2xl;
    font-weight: $font-weight-semibold;
    z-index: 2;

    &.white {
      color: var(--text-on-dark-primary);
      text-shadow: none;
    }

    &.black {
      color: var(--color-text-primary);
      text-shadow: none;
    }
  }
}

.auth-split-right {
  flex: 0.8;
  min-width: 320px;
  max-width: 520px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
  background-color: var(--color-bg-surface);
  overflow-y: auto;
  height: 100%;

  @include down(lg) {
    width: 100%;
    max-width: none;
    flex: 1;
    justify-content: center;
    overflow-y: visible;
    display: flex;
    padding: 64px 0;
    min-height: 100vh;
  }
}

.top-toolbar {
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  gap: 8px;
  z-index: 10;

  @include down(lg) {
    top: 10px;
    right: 10px;
  }
}

.auth-form-container {
  padding: 48px 48px;
  width: 100%;
  max-width: 420px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  justify-content: center;

  @include down(lg) {
    padding: 16px;
    margin: auto;
    width: 100%;
  }
}

.auth-header {
  margin-bottom: 24px;
  text-align: center;

  @include up(lg) {
    text-align: left;
  }

  .auth-title {
    font-size: $font-size-2xl;
    font-weight: $font-weight-bold;
    margin-bottom: 8px;
    color: var(--color-text-primary);

    @include up(lg) {
      text-align: left;
    }
  }

  .auth-subtitle {
    font-size: $font-size-md;
    color: var(--color-text-tertiary);
    margin-bottom: 24px;

    @include up(lg) {
      text-align: left;
    }
  }
}

.required {
  color: var(--error-color);
  margin-left: 4px;
  font-size: $font-size-md;
  vertical-align: middle;
}

.input-with-icon {
  position: relative;
  width: 100%;

  .input-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--color-text-tertiary);
    width: 20px;
    height: 20px;
  }

  .password-toggle {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--color-text-tertiary);
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.2s ease;

    &:hover {
      color: var(--theme-color);
    }
  }

  .form-control {
    padding-left: 48px;
    height: 45px;
    border-radius: 8px;
    border: var(--border-width) solid var(--border-default);
    background-color: var(--input-bg-color, #f9f9f9);
    transition: all 0.3s ease;
    color: var(--color-text-primary);

    &[type="password"],
    &[type="text"] {
      padding-right: 48px;
    }

    &:focus {
      outline: none;
      border-color: var(--theme-color);
      background-color: var(--input-focus-bg-color, #fff);
    }

    &::placeholder {
      color: var(--placeholder-color, #aaa);
    }
  }
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;

  .forgot-password {
    color: var(--theme-color);
    font-size: $font-size-sm;
    text-decoration: none;
    transition: color 0.3s ease, opacity 0.3s ease;

    &:hover {
      opacity: 0.8;
    }
  }
}

.btn {
  height: 45px;
  border-radius: 8px;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;

  &.btn-primary {
    background-color: var(--theme-color);
    border: none;
    color: var(--text-on-dark-primary);
    font-weight: $font-weight-semibold;

    &:hover:not(:disabled) {
      background-color: var(--theme-hover-color);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .icon-right {
      margin-left: 8px;
    }
  }
}

.error-message {
  display: block;
  color: var(--error-color);
  font-size: $font-size-xs;
  margin-top: 4px;
}


@include down(sm) {
  .auth-form-container {
    padding: 24px 16px;
    margin: auto;
  }

  .auth-split-right {
    padding: 16px 0;
  }

  .form-options {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;

    .forgot-password {
      flex: 0 0 auto;
      margin-left: auto;
    }
  }
}


@include between(sm, lg) {
  .auth-split-right {
    padding: 24px;
  }
}



.auth-footer {
  margin-top: 24px;

  a.btn {
    display: flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
    height: 45px;
    line-height: normal;
  }
}

.btn.btn-secondary.btn-block {
  height: 45px;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: normal;
  color: var(--color-text-primary);
  border: var(--border-width) solid var(--border-default);
  background-color: transparent;
  transition: all 0.3s ease;

  &:hover {
    border-color: var(--theme-color);
    background-color: rgba(var(--theme-color-rgb), 0.05);
    color: var(--theme-color);
    -webkit-text-fill-color: var(--theme-color);
    background-image: none;
  }
}

.loading-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s ease;

  svg {
    display: none;
  }

  &::before {
    content: "";
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: white;
    animation: spin 1s linear infinite;
    margin-right: 8px;
  }

  span {
    display: inline-block;
    animation: pulse 1.5s infinite ease-in-out;
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.auth-logo {
  margin-bottom: 24px;
  text-align: center;

  @include up(lg) {
    text-align: left;
  }

  img {
    width: 60px;
    height: 60px;
    min-width: 60px;
    min-height: 60px;
    border-radius: 12px;
    object-fit: cover;
    cursor: pointer;
    user-select: none;
  }
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 100vh;

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(var(--theme-color-rgb), 0.3);
    border-radius: 50%;
    border-top-color: var(--theme-color);
    animation: spin 1s linear infinite;
    margin-bottom: 16px;
  }

  p {
    color: var(--color-text-tertiary);
    font-size: $font-size-md;
  }
}

@media (min-width: 992px) and (max-height: 700px) {
  .auth-split-right {
    justify-content: flex-start;
  }
}

.auth-form-container {
  padding: 40px 40px;
}

.auth-header {
  margin-bottom: 16px;
}

.auth-logo {
  margin-bottom: 10px;
}

.auth-title {
  margin-bottom: 6px;
}

.auth-subtitle {
  margin-bottom: 12px;
}

.auth-form .form-group {
  margin-bottom: 12px;
}

.auth-footer {
  margin-top: 16px;
}

@include down(lg) {
  .auth-form-container {
    padding: 20px 16px;
  }

  .auth-header {
    margin-bottom: 14px;
  }

  .auth-subtitle {
    margin-bottom: 10px;
  }

  .auth-form .form-group {
    margin-bottom: 10px;
  }

  .auth-footer {
    margin-top: 14px;
  }
}


.auth-form-container {
  border-radius: 16px;
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.06);
}

.auth-title {
  letter-spacing: 0.2px;
}

.auth-subtitle {
  line-height: 1.45;
}

.auth-form .form-control:focus {
  box-shadow: 0 0 0 3px rgba(var(--theme-color-rgb), 0.12);
}

.btn.btn-primary.btn-block {
  font-weight: 600;
  letter-spacing: 0.3px;
}

.auth-divider {
  margin-top: 4px;
}

</style>

<template>
  <div v-if="password" class="password-strength-indicator">
    <div class="password-rules">
      <div class="password-rule-tip">
        <span :class="{ met: strengthMeta.minLengthMet }">{{ minLengthText }}</span>
      </div>
      <div class="password-rule-tip">
        <span :class="{ met: strengthMeta.alphaNumericMet }">{{ alphaNumericText }}</span>
      </div>
      <div class="password-rule-tip">
        <span :class="{ met: strengthMeta.specialCharMet }">{{ specialCharText }}</span>
      </div>
    </div>

    <div class="password-strength">
      <div class="password-strength-label">
        {{ strengthLabelText }}：{{ strengthText }}
      </div>
      <div class="password-strength-bar">
        <div
          class="password-strength-fill"
          :class="`strength-${strengthMeta.level}`"
          :style="{ width: `${strengthMeta.percent}%` }"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { getPasswordStrengthMeta } from '@/utils/validators';

const props = defineProps({
  password: {
    type: String,
    default: ''
  },
  minLengthKey: {
    type: String,
    default: 'auth.passwordRuleMinLength'
  },
  alphaNumericKey: {
    type: String,
    default: 'auth.passwordRuleAlphaNumericSuggested'
  },
  specialCharKey: {
    type: String,
    default: 'auth.passwordRuleSpecialSuggested'
  },
  strengthLabelKey: {
    type: String,
    default: 'auth.passwordStrength'
  }
});

const { t } = useI18n({ useScope: 'global' });
const strengthMeta = computed(() => getPasswordStrengthMeta(props.password));
const strengthTextKey = computed(() => {
  if (strengthMeta.value.level === 'weak') return 'auth.passwordStrengthWeak';
  if (strengthMeta.value.level === 'medium') return 'auth.passwordStrengthMedium';
  return 'auth.passwordStrengthStrong';
});

const translateWithFallback = (key, fallback) => {
  const value = t(key);
  return value === key ? fallback : value;
};

const minLengthText = computed(() => translateWithFallback(props.minLengthKey, '至少 8 位'));
const alphaNumericText = computed(() => translateWithFallback(props.alphaNumericKey, '包含字母和数字（建议）'));
const specialCharText = computed(() => translateWithFallback(props.specialCharKey, '包含特殊字符（建议）'));
const strengthLabelText = computed(() => translateWithFallback(props.strengthLabelKey, '密码强度'));
const strengthText = computed(() => {
  const fallbackMap = {
    weak: '弱',
    medium: '中',
    strong: '强'
  };
  return translateWithFallback(strengthTextKey.value, fallbackMap[strengthMeta.value.level] || '中');
});
</script>

<style scoped lang="scss">
.password-strength-indicator {
  margin-top: 8px;
}

.password-rules {
  display: grid;
  gap: 4px;
}

.password-rule-tip {
  font-size: $font-size-sm;
  color: var(--color-text-tertiary);
}

.password-rule-tip .met {
  color: #22c55e;
}

.password-strength {
  margin-top: 8px;
}

.password-strength-label {
  font-size: $font-size-sm;
  color: var(--color-text-tertiary);
  margin-bottom: 6px;
}

.password-strength-bar {
  width: 100%;
  height: 6px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.22);
  overflow: hidden;
}

.password-strength-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.25s ease, background-color 0.25s ease;
}

.password-strength-fill.strength-weak {
  background-color: #ef4444;
}

.password-strength-fill.strength-medium {
  background-color: #f59e0b;
}

.password-strength-fill.strength-strong {
  background-color: #22c55e;
}
</style>

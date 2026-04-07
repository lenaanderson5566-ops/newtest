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

const minLengthText = computed(() => t(props.minLengthKey));
const alphaNumericText = computed(() => t(props.alphaNumericKey));
const specialCharText = computed(() => t(props.specialCharKey));
const strengthLabelText = computed(() => t(props.strengthLabelKey));
const strengthText = computed(() => {
  return t(strengthTextKey.value);
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

  span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  span::before {
    content: '○';
    color: var(--color-text-tertiary);
    font-size: 12px;
    line-height: 1;
  }
}

.password-rule-tip .met {
  color: #22c55e;
}

.password-rule-tip .met::before {
  content: '✓';
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
